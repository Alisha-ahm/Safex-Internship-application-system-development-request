# SafeX Internship Application Form

A production-quality, multi-step internship application intake system built with
**HTML5, CSS3, and Vanilla JavaScript**, backed by a **Google Apps Script + Google
Sheets** submission pipeline. Built as a real internship-intake product, not a
tutorial-style form.

---

## Overview

**Problem:** Companies collecting internship applications through a plain email
address or a single long form get incomplete submissions, malformed contact
details, and duplicate applications — with no structured way to review or store
the data.

**Solution:** SafeX's application form breaks the intake process into four
guided steps (Personal Information → Field/Interest → Skill Self-Rating →
Review & Submit), validates every field in real time, prevents incomplete or
malformed data from ever reaching the backend, gives applicants a full review
screen with per-section editing before they commit, and stores clean,
normalized data directly into a Google Sheet — with duplicate-email protection
on both the client and server.

---

## Features

- **4-step guided form** with a visual progress indicator (step circles,
  progress bar, "Step X of 4 · Progress: NN%").
- **Real-time client-side validation** — errors appear/disappear as the user
  types or leaves a field, not only on submit.
- **Field-by-field validation rules**:
  - Full Name — required, ≥2 chars, rejects digit-only/symbol-only input, trims whitespace.
  - Email — required, valid format, normalized (trim + lowercase).
  - Phone — required, Pakistani mobile format (`03XXXXXXXXX`, `+923XXXXXXXXX`, `923XXXXXXXXX`).
  - City, Education Level, University — required.
  - Domain of interest — required single-select via accessible radio "cards".
  - Interest reason — required textarea, 30–500 chars, **live character counter**.
  - Skill ratings (HTML/CSS/JavaScript/Communication/Problem Solving) — required 1–5 scale with labeled levels (Beginner → Expert).
  - Portfolio/GitHub URL — optional, but if provided must start with `http://`/`https://` and be a syntactically valid URL.
  - Final consent checkbox before submission is allowed.
- **Review & Edit screen** — every answer is shown grouped by section, each
  with an **Edit** button that jumps back to the right step without losing
  any data.
- **Progress indicator** stays in sync with Next, Previous, Edit, and failed
  validation at all times.
- **Accessible by design** — semantic `<fieldset>`/`<legend>`, real
  `<label for>` associations (no placeholder-as-label), `aria-required`,
  `aria-invalid`, `aria-describedby` linking inputs to error text, visible
  focus rings, keyboard-only operability, `role="alert"` live error regions,
  a skip link, and a screen-reader step announcer.
- **Submission UX** — Submit button shows a spinner + "Submitting…", is
  disabled during the request, and cannot be double-clicked into firing
  multiple requests.
- **Success screen** with a generated application reference
  (`SAFEX-YYYY-NNNN`) and a "Back to Home" reset.
- **Duplicate-email detection** — both a friendly dedicated screen on the
  frontend and a server-side check in Google Apps Script (see
  [Known Limitations](#known-limitations)).
- **Network/backend failure handling** — a dedicated error screen with
  "Try Again"; the applicant's data is never cleared on failure.
- **Optional localStorage autosave** — if the applicant refreshes mid-form,
  their draft is restored automatically (with a dismissible banner and a
  "Clear Saved Data" action). No passwords or sensitive tokens are ever
  stored.
- **Fully responsive** — tested down to 375px mobile widths and up through
  1920px desktop, no horizontal scroll, touch-friendly controls.
- **Best-effort Back/Forward browser support** via the History API — the
  step shown updates instead of navigating away from the page.

---

## Technologies

- HTML5
- CSS3 (custom properties, Grid/Flexbox, `:has()` selector, media queries)
- JavaScript (ES6+, no frameworks, no build step)
- Google Apps Script (serverless backend)
- Google Sheets (data store)
- Google Fonts (Inter) + Font Awesome Free (icons) via CDN

No React, Vue, Angular, Bootstrap, or Tailwind is used anywhere in this project.

---

## Project Structure

```text
safex-internship-form/
│
├── index.html                    # Markup for all 4 steps, review, and result screens
├── style.css                     # All styling: layout, states, responsiveness, transitions
├── script.js                     # All application logic (validation, navigation, submission)
│
├── google-apps-script/
│   └── Code.gs                   # Google Apps Script backend (doPost/doGet, validation, Sheet writes)
│
├── README.md                     # This file
├── VALIDATION-TEST-CASES.md       # Manual QA test matrix
└── screenshots/                   # Place demo screenshots here (see "Demo" section)
```

### File responsibilities

| File | Responsibility |
|---|---|
| `index.html` | Semantic structure for the 4 form steps, progress indicator, review container, and the 3 result screens (success / duplicate / error). No inline styles or scripts. |
| `style.css` | Professional color palette, responsive grid layouts, validation states (`is-invalid`/`is-valid`), subtle transitions, and 3 responsive breakpoints (tablet/mobile/small mobile). |
| `script.js` | Single IIFE module. Holds `applicationData` state, all validator functions, step navigation, review rendering, localStorage persistence, and the `fetch()` call to Google Apps Script. |
| `google-apps-script/Code.gs` | `doPost` handler: parses JSON, re-validates server-side, checks for duplicate emails (with a `LockService` guard), appends a row, and returns a JSON response. `doGet` provides a simple health check. |

---

## Local Setup

This is a static frontend with no build step and no dependencies to install.

1. Clone or copy the `safex-internship-form/` folder to your machine.
2. Open `index.html` directly in a browser, **or** (recommended, to avoid any
   `file://` fetch quirks) serve it with any static file server, for example:

   ```bash
   cd safex-internship-form
   python3 -m http.server 8080
   # then open http://localhost:8080 in your browser
   ```

   or with Node:

   ```bash
   npx serve safex-internship-form
   ```

3. The form is fully usable end-to-end (navigation, validation, review,
   localStorage) without any backend configured. **Actual submission**
   requires the Google Apps Script step below.

---

## Google Sheets Setup

Follow these steps exactly to wire up the backend:

1. **Create a Google Sheet.** Go to [sheets.google.com](https://sheets.google.com) → Blank spreadsheet. Name it e.g. "SafeX Internship Applications".
2. **Rename the first tab** to `Applications` (this must match the `SHEET_NAME` constant at the top of `Code.gs` — change one or the other if you'd like a different name).
3. **Add the header row** (optional — the script auto-creates it on first run if the sheet is empty):

   ```text
   Timestamp | Full Name | Email | Phone | City | Education | University | Domain | Interest Reason | HTML Skill | CSS Skill | JavaScript Skill | Communication Skill | Problem Solving | Portfolio URL | Application Reference
   ```

4. Open **Extensions → Apps Script** from the Sheet's menu bar.
5. Delete any boilerplate `function myFunction() {}` code in the editor, and
   paste the **entire contents** of `google-apps-script/Code.gs` from this
   project.
6. Click **Deploy → New deployment**.
   - Click the gear icon next to "Select type" and choose **Web app**.
   - Description: e.g. "SafeX internship intake v1".
   - **Execute as:** `Me` (your Google account — required so the script can write to the Sheet).
   - **Who has access:** `Anyone` (required — otherwise the public form cannot POST to it).
7. Click **Deploy**, then authorize the script when prompted (you'll see a
   Google "unverified app" warning the first time — this is expected for a
   personal Apps Script project; click **Advanced → Go to (project name)
   (unsafe) → Allow**).
8. **Copy the Web App URL** shown after deployment. It looks like:

   ```text
   https://script.google.com/macros/s/AKfycbxXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/exec
   ```

9. Continue to [Configuration](#configuration) below to plug this URL into the frontend.
10. **Test the submission** end-to-end (see [Testing](#testing)).
11. **Verify the row appears** in your Google Sheet's `Applications` tab.

> If you later edit `Code.gs`, you must create a **New deployment** (or use
> "Manage deployments → Edit → New version") for the changes to take effect
> on the existing Web App URL.

---

## Configuration

Open `script.js` and find this line near the top (inside the "CONSTANTS &
CONFIGURATION" section):

```javascript
// ⚠️ REPLACE THIS with your deployed Google Apps Script Web App URL.
const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL';
```

Replace `'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL'` with the URL you copied in
step 8 above, e.g.:

```javascript
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/exec';
```

If this value is left as the placeholder, the form will still validate and
navigate correctly, but clicking **Submit** will immediately show the
"Something Went Wrong" error screen with a clear message that the backend
is not configured — it will **never** silently pretend to succeed.

---

## Testing

The project was manually tested against the full matrix documented in
[`VALIDATION-TEST-CASES.md`](./VALIDATION-TEST-CASES.md), covering:

- Every required-field / format-validation rule (name, email, phone,
  reason length, ratings, URL format) in both invalid and valid states.
- Step navigation (Next blocked on invalid data + auto-focus of the first
  invalid field; Previous always allowed; data preserved in both
  directions).
- Review screen accuracy and the Edit-button round-trip back into each step.
- Submission UX: submit button disabling, spinner state, and rejection of
  rapid repeat clicks.
- Duplicate email detection (both the "already applied" screen and the
  Apps Script-side row check).
- Network/backend failure simulated by leaving `GOOGLE_SCRIPT_URL` as the
  placeholder, and by disabling network access — confirming the error
  screen appears and form data is retained.
- Responsive layout at 1920px, 1440px, 1366px, 768px, 430px, 390px, and
  375px widths — no horizontal scrolling, touch-friendly buttons.
- Keyboard-only navigation through all 4 steps, including radio "cards"
  and rating buttons via Tab/Arrow keys/Space.
- Refresh mid-form → localStorage restore banner + automatic field
  restoration.

See the linked document for the full pass/fail table.

---

## Known Limitations

- **Duplicate detection is best-effort, not transactional.** Google Apps
  Script has no native database-style unique constraint. This project
  mitigates race conditions with `LockService.getScriptLock()` around the
  duplicate-check-then-append sequence, but under extreme concurrent load
  (e.g. two identical submissions firing within the same few hundred
  milliseconds, or the script hitting Google's execution time limits) a
  duplicate row could theoretically still slip through. For an
  internship-intake volume of traffic this is not a practical concern.
- **Apps Script cold starts** can occasionally add 1–3 seconds of latency
  to the first submission after a period of inactivity; this is a Google
  Apps Script platform characteristic, not a bug in this code.
- **No server-side rate limiting** beyond the duplicate-email check —
  Apps Script Web Apps do not provide built-in IP-based throttling.
- **`Anyone` access is required** for the Web App deployment so the public
  form can POST to it; this means the endpoint URL itself should not be
  treated as a secret, and no sensitive data (passwords, IDs, etc.) is ever
  requested or stored by this form.
- **Client-side validation is a UX aid only.** All fields are re-validated
  server-side in `Code.gs` before anything is written to the spreadsheet,
  per the security requirements of this project.
- **Browser Back/Forward** moves between the 4 steps via the History API,
  but does not survive a full page reload (localStorage autosave is the
  mechanism that protects against reloads).

---

## Future Improvements

- Move the Apps Script duplicate check to a dedicated "index" sheet/lookup
  for O(1) checks once application volume grows large (current approach
  scans the Email column linearly, which is fine for hundreds/low
  thousands of rows).
- Add email notifications (via `MailApp`/`GmailApp` in Apps Script) to
  automatically acknowledge receipt to the applicant.
- Add an admin-facing status column (Reviewed / Shortlisted / Rejected)
  and a lightweight internal dashboard.
- Add file upload support (resume/CV) via Google Drive integration.
- Internationalize the UI copy for multi-language applicants.
- Add automated end-to-end tests (e.g. Playwright) covering the full
  happy-path and key edge cases in CI.

---

## User Guide

1. Open the application page.
2. **Step 1 — Personal Information:** fill in your name, email, phone
   (Pakistani format), city, education level, and university. Errors
   appear immediately if a field is invalid; correct them and the error
   clears automatically.
3. Click **Next**. If anything is missing or invalid, the page will not
   advance and will jump your cursor to the first problem field.
4. **Step 2 — Field & Interest:** choose your primary domain of interest
   and explain why (30–500 characters; watch the live counter).
5. **Step 3 — Skill Self-Rating:** rate yourself 1–5 on each skill, and
   optionally add a portfolio/GitHub link.
6. **Step 4 — Review & Submit:** check every section. Click **Edit** on
   any section to jump back and fix it — nothing you've entered is lost.
   Tick the confirmation checkbox and click **Submit Application**.
7. You'll see a **Submitting…** state, then either:
   - A **success screen** with your unique application reference, or
   - A **"you've already applied"** screen if that email was used before, or
   - A **"something went wrong"** screen with a **Try Again** button (your
     data stays intact — nothing is cleared).
8. If you accidentally refresh the page mid-form, reopening it will offer
   to restore your unfinished draft.

---

## Deployment (Frontend)

This folder (`safex-internship-form/`) is a plain static site — `index.html`,
`style.css`, and `script.js` with no build step. It can be hosted on **any**
static file host (Cloudflare Pages, GitHub Pages, Netlify, Vercel, a plain
web server, etc.). Simply upload the three files (plus this README/tests
docs, which aren't required at runtime) and point the host at `index.html`.
The only required runtime configuration is the `GOOGLE_SCRIPT_URL` constant
described in [Configuration](#configuration) above.

---

## License

Internal SafeX internship-assignment project. Adapt freely for your own
internship intake needs.
