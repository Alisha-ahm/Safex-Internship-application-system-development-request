/**
 * =====================================================================
 * SafeX Internship Application — Google Apps Script Backend
 * =====================================================================
 *
 * PURPOSE
 *   Receives POST requests (JSON) from the SafeX internship application
 *   frontend, validates the payload server-side, checks for duplicate
 *   email submissions, appends a new row to a Google Sheet, and returns
 *   a JSON response.
 *
 * SETUP (see README.md "Google Sheets Setup" for the full walkthrough)
 *   1. Create a new Google Sheet.
 *   2. Rename the first tab to match SHEET_NAME below (default: "Applications").
 *   3. Add header row (see HEADERS array below) OR let this script create
 *      it automatically on first run (see ensureHeaders()).
 *   4. Extensions → Apps Script, delete any boilerplate code, paste this file.
 *   5. Run `deploy` via Deploy → New deployment → type: Web app.
 *        - Execute as: Me
 *        - Who has access: Anyone  (required so the public form can POST)
 *   6. Copy the generated Web App URL.
 *   7. Paste that URL into script.js as the value of GOOGLE_SCRIPT_URL.
 *
 * SECURITY NOTE
 *   Client-side validation in script.js improves UX, but is NOT a
 *   security boundary. This script re-validates the most important
 *   fields before writing anything to the spreadsheet.
 * =====================================================================
 */

// ---------------------------------------------------------------------
// CONFIGURATION — adjust if your sheet/tab name differs.
// ---------------------------------------------------------------------
const SHEET_NAME = 'Applications'; // Name of the sheet TAB that stores rows.

const HEADERS = [
  'Timestamp',
  'Full Name',
  'Email',
  'Phone',
  'City',
  'Education',
  'University',
  'Domain',
  'Interest Reason',
  'HTML Skill',
  'CSS Skill',
  'JavaScript Skill',
  'Communication Skill',
  'Problem Solving',
  'Portfolio URL',
  'Application Reference'
];

const EMAIL_COLUMN_INDEX = HEADERS.indexOf('Email') + 1; // 1-based column index for duplicate lookup.

// ---------------------------------------------------------------------
// ENTRY POINT — handles POST requests from the frontend fetch() call.
// ---------------------------------------------------------------------
function doPost(e) {
  try {
    const payload = parseRequestBody(e);
    const validation = validatePayload(payload);

    if (!validation.valid) {
      return jsonResponse({ status: 'error', message: validation.message });
    }

    const data = validation.data;
    const sheet = getSheet();

    if (isDuplicateEmail(sheet, data.email)) {
      return jsonResponse({
        status: 'duplicate',
        message: 'An application with this email already exists.'
      });
    }

    const reference = generateReference();

    try {
      appendApplicationRow(sheet, data, reference);
    } catch (innerErr) {
      // A concurrent request inserted the same email while we were
      // waiting for the lock (see appendApplicationRow's re-check).
      if (innerErr && innerErr.name === 'DuplicateEmailError') {
        return jsonResponse({
          status: 'duplicate',
          message: 'An application with this email already exists.'
        });
      }
      throw innerErr;
    }

    return jsonResponse({
      status: 'success',
      message: 'Application submitted successfully.',
      reference: reference
    });
  } catch (err) {
    // Never let an uncaught exception leak stack traces to the client.
    return jsonResponse({
      status: 'error',
      message: 'Server error while processing the application. Please try again later.'
    });
  }
}

// Optional: lets you sanity-check the deployment by visiting the Web App
// URL directly in a browser (GET request).
function doGet(e) {
  return jsonResponse({
    status: 'ok',
    message: 'SafeX internship application endpoint is live. Use POST to submit applications.'
  });
}

// ---------------------------------------------------------------------
// REQUEST PARSING
// ---------------------------------------------------------------------
function parseRequestBody(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error('Empty request body.');
  }
  return JSON.parse(e.postData.contents);
}

// ---------------------------------------------------------------------
// SERVER-SIDE VALIDATION
// Re-checks the fields that matter most for data quality/integrity.
// Mirrors (a subset of) the frontend validation rules.
// ---------------------------------------------------------------------
function validatePayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, message: 'Invalid payload.' };
  }

  const personal = payload.personal || {};
  const interest = payload.interest || {};
  const skills = payload.skills || {};

  const fullName = safeTrim(personal.fullName);
  const email = safeTrim(personal.email).toLowerCase();
  const phone = safeTrim(personal.phone);
  const city = safeTrim(personal.city);
  const education = safeTrim(personal.education);
  const university = safeTrim(personal.university);

  const domain = safeTrim(interest.domain);
  const reason = safeTrim(interest.reason);

  const html = safeTrim(skills.html);
  const css = safeTrim(skills.css);
  const javascriptSkill = safeTrim(skills.javascript);
  const communication = safeTrim(skills.communication);
  const problemSolving = safeTrim(skills.problemSolving);
  const portfolio = safeTrim(skills.portfolio);

  if (!fullName || fullName.length < 2 || !/[a-zA-Z]/.test(fullName)) {
    return { valid: false, message: 'Please provide a valid full name.' };
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailPattern.test(email)) {
    return { valid: false, message: 'Please provide a valid email address.' };
  }

  const phonePattern = /^(?:\+92|0092|92|0)3\d{9}$/;
  const cleanPhone = phone.replace(/[\s-]/g, '');
  if (!cleanPhone || !phonePattern.test(cleanPhone)) {
    return { valid: false, message: 'Please provide a valid Pakistani phone number.' };
  }

  if (!city) return { valid: false, message: 'City is required.' };
  if (!education) return { valid: false, message: 'Education level is required.' };
  if (!university) return { valid: false, message: 'University / Institution is required.' };
  if (!domain) return { valid: false, message: 'Domain of interest is required.' };

  if (!reason || reason.length < 30 || reason.length > 500) {
    return { valid: false, message: 'Interest reason must be between 30 and 500 characters.' };
  }

  const ratings = [html, css, javascriptSkill, communication, problemSolving];
  for (let i = 0; i < ratings.length; i++) {
    const num = Number(ratings[i]);
    if (!ratings[i] || !Number.isInteger(num) || num < 1 || num > 5) {
      return { valid: false, message: 'All skill ratings must be between 1 and 5.' };
    }
  }

  if (portfolio && !/^https?:\/\//i.test(portfolio)) {
    return { valid: false, message: 'Portfolio URL must start with http:// or https://' };
  }

  return {
    valid: true,
    data: {
      fullName,
      email,
      phone: cleanPhone,
      city,
      education,
      university,
      domain,
      reason,
      html,
      css,
      javascript: javascriptSkill,
      communication,
      problemSolving,
      portfolio
    }
  };
}

function safeTrim(value) {
  return (value === null || value === undefined) ? '' : String(value).trim();
}

// ---------------------------------------------------------------------
// SPREADSHEET HELPERS
// ---------------------------------------------------------------------
function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  ensureHeaders(sheet);
  return sheet;
}

function ensureHeaders(sheet) {
  const firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const isEmpty = firstRow.every((cell) => cell === '' || cell === null);
  if (isEmpty) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
}

/**
 * DUPLICATE EMAIL DETECTION
 * Scans the Email column for an existing case-insensitive match.
 *
 * LIMITATION (documented in README.md as well):
 *   Google Apps Script has no native locking guarantee across
 *   simultaneous requests unless LockService is used. Under very high
 *   concurrent traffic (multiple submissions with the same email within
 *   milliseconds of each other) a race condition could theoretically
 *   allow two duplicate rows to be inserted. We mitigate this with
 *   LockService.getScriptLock() below, but this is a best-effort
 *   safeguard, not a guarantee under all failure scenarios (e.g. Apps
 *   Script execution timeouts).
 */
function isDuplicateEmail(sheet, email) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false; // only header row (or empty) exists

  const emailValues = sheet
    .getRange(2, EMAIL_COLUMN_INDEX, lastRow - 1, 1)
    .getValues()
    .flat();

  const normalizedTarget = email.toLowerCase();
  return emailValues.some((value) => String(value).trim().toLowerCase() === normalizedTarget);
}

function appendApplicationRow(sheet, data, reference) {
  // Best-effort lock to reduce race conditions between concurrent
  // duplicate-check + append operations (see isDuplicateEmail() note).
  const lock = LockService.getScriptLock();
  lock.waitLock(10000); // wait up to 10 seconds for the lock

  try {
    // Re-check duplicates inside the lock in case another request slipped
    // in between the initial check and acquiring this lock.
    if (isDuplicateEmail(sheet, data.email)) {
      throw new DuplicateEmailError();
    }

    sheet.appendRow([
      new Date(),
      data.fullName,
      data.email,
      data.phone,
      data.city,
      data.education,
      data.university,
      data.domain,
      data.reason,
      data.html,
      data.css,
      data.javascript,
      data.communication,
      data.problemSolving,
      data.portfolio,
      reference
    ]);
  } finally {
    lock.releaseLock();
  }
}

function DuplicateEmailError() {
  this.name = 'DuplicateEmailError';
  this.message = 'Duplicate email detected inside lock.';
}
DuplicateEmailError.prototype = Object.create(Error.prototype);

// ---------------------------------------------------------------------
// MISC HELPERS
// ---------------------------------------------------------------------
function generateReference() {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `SAFEX-${year}-${rand}`;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
