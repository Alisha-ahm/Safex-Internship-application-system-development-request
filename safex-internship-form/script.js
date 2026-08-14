/* =====================================================================
   SafeX Internship Application Form — Client-side Application Logic
   Vanilla JavaScript, no frameworks. Organized into clear sections:
     1. Constants & configuration
     2. State (applicationData)
     3. DOM references
     4. Validation functions
     5. Error display helpers
     6. Step navigation & progress
     7. Data collection & review rendering
     8. localStorage persistence
     9. Submission handling (Google Apps Script)
     10. Initialization / event wiring
   ===================================================================== */

(function () {
  'use strict';

  /* =====================================================================
     1. CONSTANTS & CONFIGURATION
     ===================================================================== */

  // ⚠️ REPLACE THIS with your deployed Google Apps Script Web App URL.
  // See README.md → "Google Sheets Setup" for full deployment instructions.
  // Example of a real deployed URL format:
  //   https://script.google.com/macros/s/AKfycbxXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/exec
  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwQpQu-LC9BlACcOd2ikcTifcUrKzhUTtan-HZQi-QjeFr3WodD9aeYrFJwnKm8CZ-D/exec';

  const TOTAL_STEPS = 4;
  const STORAGE_KEY = 'safex_internship_application_draft_v1';
  const REASON_MIN = 30;
  const REASON_MAX = 500;

  const STEP_NAMES = {
    1: 'Personal Information',
    2: 'Field & Interest',
    3: 'Skill Self-Rating',
    4: 'Review & Submit'
  };

  const SKILL_LABELS = {
    html: 'HTML',
    css: 'CSS',
    javascript: 'JavaScript',
    communication: 'Communication',
    problemSolving: 'Problem Solving'
  };

  const SKILL_LEVEL_TEXT = {
    1: 'Beginner',
    2: 'Basic',
    3: 'Intermediate',
    4: 'Advanced',
    5: 'Expert'
  };

  // Pakistani mobile number formats:
  //  - 03XXXXXXXXX (11 digits, starts with 03)
  //  - +923XXXXXXXXX (starts with +92 3, 10 digits after country code)
  //  - 923XXXXXXXXX (without plus)
  const PK_PHONE_REGEX = /^(?:\+92|0092|92|0)3\d{9}$/;

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /* =====================================================================
     2. APPLICATION STATE
     ===================================================================== */

  const applicationData = {
    personal: {
      fullName: '',
      email: '',
      phone: '',
      city: '',
      education: '',
      university: ''
    },
    interest: {
      domain: '',
      reason: ''
    },
    skills: {
      html: '',
      css: '',
      javascript: '',
      communication: '',
      problemSolving: '',
      portfolio: ''
    },
    submittedAt: null
  };

  let currentStep = 1;
  let isSubmitting = false;
  let submissionSucceeded = false;

  /* =====================================================================
     3. DOM REFERENCES (cached once DOM is ready)
     ===================================================================== */

  const dom = {};

  function cacheDom() {
    dom.form = document.getElementById('internshipForm');
    dom.steps = Array.from(document.querySelectorAll('.form-step'));
    dom.progressSteps = Array.from(document.querySelectorAll('.progress-step'));
    dom.progressBarFill = document.getElementById('progressBarFill');
    dom.progressBar = document.getElementById('progressBar');
    dom.progressText = document.getElementById('progressText');
    dom.stepAnnouncer = document.getElementById('stepAnnouncer');

    dom.prevBtn = document.getElementById('prevBtn');
    dom.nextBtn = document.getElementById('nextBtn');
    dom.submitBtn = document.getElementById('submitBtn');
    dom.submitBtnText = document.getElementById('submitBtnText');

    dom.submissionStatus = document.getElementById('submissionStatus');

    dom.successScreen = document.getElementById('successScreen');
    dom.duplicateScreen = document.getElementById('duplicateScreen');
    dom.errorScreen = document.getElementById('errorScreen');
    dom.referenceValue = document.getElementById('referenceValue');
    dom.errorDetail = document.getElementById('errorDetail');
    dom.backHomeBtn = document.getElementById('backHomeBtn');
    dom.duplicateBackBtn = document.getElementById('duplicateBackBtn');
    dom.retryBtn = document.getElementById('retryBtn');

    dom.reasonInput = document.getElementById('reason');
    dom.reasonCounter = document.getElementById('reasonCounter');

    dom.reviewContainer = document.getElementById('reviewContainer');

    dom.restoreBanner = document.getElementById('restoreBanner');
    dom.dismissRestoreBtn = document.getElementById('dismissRestoreBtn');
    dom.clearSavedBtn = document.getElementById('clearSavedBtn');

    // Personal fields
    dom.fullName = document.getElementById('fullName');
    dom.email = document.getElementById('email');
    dom.phone = document.getElementById('phone');
    dom.city = document.getElementById('city');
    dom.education = document.getElementById('education');
    dom.university = document.getElementById('university');

    // Interest fields
    dom.domainInputs = Array.from(document.querySelectorAll('input[name="domain"]'));

    // Skills
    dom.portfolio = document.getElementById('portfolio');

    // Consent
    dom.consent = document.getElementById('consent');
  }

  /* =====================================================================
     4. VALIDATION FUNCTIONS
     ===================================================================== */

  /**
   * Validates a full name.
   * Rejects empty strings, names shorter than 2 chars, and names
   * consisting only of digits/symbols.
   */
  function validateName(rawValue) {
    const value = rawValue.trim();
    if (!value) {
      return { valid: false, message: 'Full name is required.' };
    }
    if (value.length < 2) {
      return { valid: false, message: 'Name must be at least 2 characters.' };
    }
    // Reject names that are only numbers/symbols (no letters at all)
    if (!/[a-zA-Z]/.test(value)) {
      return { valid: false, message: 'Please enter a valid name.' };
    }
    return { valid: true, value: value.replace(/\s+/g, ' ') };
  }

  /**
   * Validates and normalizes an email address.
   * Normalization: trim + lowercase.
   */
  function validateEmail(rawValue) {
    const trimmed = rawValue.trim().toLowerCase();
    if (!trimmed) {
      return { valid: false, message: 'Email address is required.' };
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      return { valid: false, message: 'Please enter a valid email address.' };
    }
    return { valid: true, value: trimmed };
  }

  /**
   * Validates a Pakistani phone number.
   * Accepts: 03001234567, +923001234567, 923001234567, 00923001234567
   */
  function validatePhone(rawValue) {
    const trimmed = rawValue.trim().replace(/[\s-]/g, '');
    if (!trimmed) {
      return { valid: false, message: 'Phone number is required.' };
    }
    if (!PK_PHONE_REGEX.test(trimmed)) {
      return { valid: false, message: 'Enter a valid Pakistani phone number.' };
    }
    return { valid: true, value: trimmed };
  }

  function validateRequiredText(rawValue, fieldLabel) {
    const value = rawValue.trim();
    if (!value) {
      return { valid: false, message: `${fieldLabel} is required.` };
    }
    return { valid: true, value };
  }

  function validateSelect(rawValue, fieldLabel) {
    if (!rawValue) {
      return { valid: false, message: `Please select ${fieldLabel}.` };
    }
    return { valid: true, value: rawValue };
  }

  function validateDomain(value) {
    if (!value) {
      return { valid: false, message: 'Please select a domain of interest.' };
    }
    return { valid: true, value };
  }

  function validateReason(rawValue) {
    const value = rawValue.trim();
    if (!value) {
      return { valid: false, message: 'Please tell us why you are interested in this field.' };
    }
    if (value.length < REASON_MIN) {
      return { valid: false, message: `Please enter at least ${REASON_MIN} characters.` };
    }
    if (value.length > REASON_MAX) {
      return { valid: false, message: `Please keep your answer under ${REASON_MAX} characters.` };
    }
    return { valid: true, value };
  }

  function validateRating(value, skillLabel) {
    if (!value) {
      return { valid: false, message: `Please rate your ${skillLabel} skill.` };
    }
    const num = Number(value);
    if (!Number.isInteger(num) || num < 1 || num > 5) {
      return { valid: false, message: `Please provide a valid rating for ${skillLabel}.` };
    }
    return { valid: true, value: String(num) };
  }

  /**
   * Validates an optional portfolio/GitHub URL.
   * Empty is allowed. If provided, must start with http:// or https://
   * and pass the native URL constructor check.
   */
  function validatePortfolioUrl(rawValue) {
    const value = rawValue.trim();
    if (!value) {
      return { valid: true, value: '' };
    }
    if (!/^https?:\/\//i.test(value)) {
      return { valid: false, message: 'URL must start with http:// or https://' };
    }
    try {
      // eslint-disable-next-line no-new
      new URL(value);
    } catch (err) {
      return { valid: false, message: 'Please enter a valid URL.' };
    }
    return { valid: true, value };
  }

  function validateConsent(checked) {
    if (!checked) {
      return { valid: false, message: 'Please confirm your information is accurate before submitting.' };
    }
    return { valid: true, value: true };
  }

  /* =====================================================================
     5. ERROR / FIELD STATE DISPLAY HELPERS
     ===================================================================== */

  /**
   * Shows an error message for a given field and marks it visually invalid.
   * `groupEl` is the closest .form-group (or .rating-group / .consent-group)
   * wrapper; `errorEl` is the <span class="error-message"> element.
   * `inputEls` may be one input or an array/NodeList of inputs (radio groups).
   */
  function showError(groupEl, errorEl, inputEls, message) {
    if (groupEl) {
      groupEl.classList.add('is-invalid');
      groupEl.classList.remove('is-valid');
    }
    if (errorEl) {
      errorEl.textContent = message;
    }
    const inputs = normalizeInputList(inputEls);
    inputs.forEach((el) => {
      if (el) el.setAttribute('aria-invalid', 'true');
    });
  }

  function clearError(groupEl, errorEl, inputEls) {
    if (groupEl) {
      groupEl.classList.remove('is-invalid');
      groupEl.classList.add('is-valid');
    }
    if (errorEl) {
      errorEl.textContent = '';
    }
    const inputs = normalizeInputList(inputEls);
    inputs.forEach((el) => {
      if (el) el.setAttribute('aria-invalid', 'false');
    });
  }

  /** Removes valid/invalid visual state entirely (used sparingly). */
  function resetFieldState(groupEl, errorEl, inputEls) {
    if (groupEl) {
      groupEl.classList.remove('is-invalid', 'is-valid');
    }
    if (errorEl) errorEl.textContent = '';
    const inputs = normalizeInputList(inputEls);
    inputs.forEach((el) => {
      if (el) el.removeAttribute('aria-invalid');
    });
  }

  function normalizeInputList(inputEls) {
    if (!inputEls) return [];
    if (inputEls instanceof NodeList || Array.isArray(inputEls)) {
      return Array.from(inputEls);
    }
    return [inputEls];
  }

  /* =====================================================================
     FIELD DEFINITIONS
     Maps each field to its DOM group/error elements and validator.
     This drives both real-time validation and full-step validation.
     ===================================================================== */

  function getFieldDefinitions() {
    return {
      fullName: {
        step: 1,
        group: dom.fullName.closest('.form-group'),
        error: document.getElementById('fullName-error'),
        inputs: dom.fullName,
        validate: () => validateName(dom.fullName.value),
        commit: (result) => {
          applicationData.personal.fullName = result.value;
          dom.fullName.value = result.value; // reflect trimmed/normalized value back into the field
        }
      },
      email: {
        step: 1,
        group: dom.email.closest('.form-group'),
        error: document.getElementById('email-error'),
        inputs: dom.email,
        validate: () => validateEmail(dom.email.value),
        commit: (result) => {
          applicationData.personal.email = result.value;
          dom.email.value = result.value; // reflect trim+lowercase normalization back into the field
        }
      },
      phone: {
        step: 1,
        group: dom.phone.closest('.form-group'),
        error: document.getElementById('phone-error'),
        inputs: dom.phone,
        validate: () => validatePhone(dom.phone.value),
        commit: (result) => {
          applicationData.personal.phone = result.value;
          dom.phone.value = result.value; // reflect stripped whitespace/dashes back into the field
        }
      },
      city: {
        step: 1,
        group: dom.city.closest('.form-group'),
        error: document.getElementById('city-error'),
        inputs: dom.city,
        validate: () => validateRequiredText(dom.city.value, 'City'),
        commit: (result) => { applicationData.personal.city = result.value; }
      },
      education: {
        step: 1,
        group: dom.education.closest('.form-group'),
        error: document.getElementById('education-error'),
        inputs: dom.education,
        validate: () => validateSelect(dom.education.value, 'your education level'),
        commit: (result) => { applicationData.personal.education = result.value; }
      },
      university: {
        step: 1,
        group: dom.university.closest('.form-group'),
        error: document.getElementById('university-error'),
        inputs: dom.university,
        validate: () => validateRequiredText(dom.university.value, 'University / Institution'),
        commit: (result) => { applicationData.personal.university = result.value; }
      },
      domain: {
        step: 2,
        group: document.getElementById('domainGroup'),
        error: document.getElementById('domain-error'),
        inputs: dom.domainInputs,
        validate: () => {
          const checked = dom.domainInputs.find((el) => el.checked);
          return validateDomain(checked ? checked.value : '');
        },
        commit: (result) => { applicationData.interest.domain = result.value; }
      },
      reason: {
        step: 2,
        group: dom.reasonInput.closest('.form-group'),
        error: document.getElementById('reason-error'),
        inputs: dom.reasonInput,
        validate: () => validateReason(dom.reasonInput.value),
        commit: (result) => { applicationData.interest.reason = result.value; }
      },
      html: {
        step: 3,
        group: document.querySelector('.rating-group[data-skill="html"]'),
        error: document.getElementById('html-error'),
        inputs: document.querySelectorAll('input[name="html"]'),
        validate: () => {
          const checked = document.querySelector('input[name="html"]:checked');
          return validateRating(checked ? checked.value : '', 'HTML');
        },
        commit: (result) => { applicationData.skills.html = result.value; }
      },
      css: {
        step: 3,
        group: document.querySelector('.rating-group[data-skill="css"]'),
        error: document.getElementById('css-error'),
        inputs: document.querySelectorAll('input[name="css"]'),
        validate: () => {
          const checked = document.querySelector('input[name="css"]:checked');
          return validateRating(checked ? checked.value : '', 'CSS');
        },
        commit: (result) => { applicationData.skills.css = result.value; }
      },
      javascript: {
        step: 3,
        group: document.querySelector('.rating-group[data-skill="javascript"]'),
        error: document.getElementById('javascript-error'),
        inputs: document.querySelectorAll('input[name="javascript"]'),
        validate: () => {
          const checked = document.querySelector('input[name="javascript"]:checked');
          return validateRating(checked ? checked.value : '', 'JavaScript');
        },
        commit: (result) => { applicationData.skills.javascript = result.value; }
      },
      communication: {
        step: 3,
        group: document.querySelector('.rating-group[data-skill="communication"]'),
        error: document.getElementById('communication-error'),
        inputs: document.querySelectorAll('input[name="communication"]'),
        validate: () => {
          const checked = document.querySelector('input[name="communication"]:checked');
          return validateRating(checked ? checked.value : '', 'Communication');
        },
        commit: (result) => { applicationData.skills.communication = result.value; }
      },
      problemSolving: {
        step: 3,
        group: document.querySelector('.rating-group[data-skill="problemSolving"]'),
        error: document.getElementById('problemSolving-error'),
        inputs: document.querySelectorAll('input[name="problemSolving"]'),
        validate: () => {
          const checked = document.querySelector('input[name="problemSolving"]:checked');
          return validateRating(checked ? checked.value : '', 'Problem Solving');
        },
        commit: (result) => { applicationData.skills.problemSolving = result.value; }
      },
      portfolio: {
        step: 3,
        group: dom.portfolio.closest('.form-group'),
        error: document.getElementById('portfolio-error'),
        inputs: dom.portfolio,
        validate: () => validatePortfolioUrl(dom.portfolio.value),
        commit: (result) => { applicationData.skills.portfolio = result.value; }
      },
      consent: {
        step: 4,
        group: dom.consent.closest('.consent-group'),
        error: document.getElementById('consent-error'),
        inputs: dom.consent,
        validate: () => validateConsent(dom.consent.checked),
        commit: () => {}
      }
    };
  }

  let fieldDefinitions = null;

  /**
   * Validates a single field by key, updates its visual state, and
   * commits normalized data into applicationData when valid.
   * Returns true if valid.
   */
  function validateField(key) {
    const def = fieldDefinitions[key];
    if (!def) return true;
    const result = def.validate();
    if (!result.valid) {
      showError(def.group, def.error, def.inputs, result.message);
      return false;
    }
    clearError(def.group, def.error, def.inputs);
    def.commit(result);
    return true;
  }

  /**
   * Validates every field belonging to a given step number.
   * Focuses the first invalid field found. Returns true if the whole
   * step is valid.
   */
  function validateStep(stepNumber) {
    const keys = Object.keys(fieldDefinitions).filter(
      (key) => fieldDefinitions[key].step === stepNumber
    );

    let allValid = true;
    let firstInvalidEl = null;

    keys.forEach((key) => {
      const isValid = validateField(key);
      if (!isValid && !firstInvalidEl) {
        const def = fieldDefinitions[key];
        const inputs = normalizeInputList(def.inputs);
        firstInvalidEl = inputs[0];
      }
      if (!isValid) allValid = false;
    });

    if (!allValid && firstInvalidEl) {
      firstInvalidEl.focus();
    }

    return allValid;
  }

  /* =====================================================================
     6. STEP NAVIGATION & PROGRESS INDICATOR
     ===================================================================== */

  function goToStep(stepNumber) {
    if (stepNumber < 1 || stepNumber > TOTAL_STEPS) return;

    currentStep = stepNumber;

    dom.steps.forEach((stepEl) => {
      const stepNum = Number(stepEl.dataset.step);
      stepEl.classList.toggle('is-active', stepNum === currentStep);
    });

    updateProgress();
    updateNavButtons();

    if (currentStep === TOTAL_STEPS) {
      renderReview();
    }

    // Announce step change for screen reader users
    dom.stepAnnouncer.textContent = `Step ${currentStep} of ${TOTAL_STEPS}: ${STEP_NAMES[currentStep]}`;

    // Push a history state so Back/Forward browser buttons move between steps
    // instead of leaving the page (best-effort; does not persist across reload).
    try {
      const state = { safexStep: currentStep };
      if (history.state && history.state.safexStep === currentStep) {
        // avoid duplicate identical states
      } else {
        history.pushState(state, '', `#step-${currentStep}`);
      }
    } catch (err) {
      /* history API not available — ignore silently */
    }

    // Scroll the card into view smoothly on step change (helps on mobile)
    const card = document.getElementById('application-form');
    if (card && window.scrollY > card.offsetTop) {
      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    saveDraftToStorage();
  }

  function updateProgress() {
    dom.progressSteps.forEach((stepEl) => {
      const stepNum = Number(stepEl.dataset.step);
      stepEl.classList.remove('is-active', 'is-completed');
      if (stepNum < currentStep) {
        stepEl.classList.add('is-completed');
      } else if (stepNum === currentStep) {
        stepEl.classList.add('is-active');
      }
    });

    const percent = Math.round((currentStep / TOTAL_STEPS) * 100);
    dom.progressBarFill.style.width = percent + '%';
    dom.progressBar.setAttribute('aria-valuenow', String(percent));
    dom.progressText.textContent = `Step ${currentStep} of ${TOTAL_STEPS} · Progress: ${percent}%`;
  }

  function updateNavButtons() {
    dom.prevBtn.disabled = currentStep === 1;

    if (currentStep === TOTAL_STEPS) {
      dom.nextBtn.hidden = true;
      dom.submitBtn.hidden = false;
    } else {
      dom.nextBtn.hidden = false;
      dom.submitBtn.hidden = true;
    }
  }

  function handleNext() {
    if (validateStep(currentStep)) {
      goToStep(currentStep + 1);
    }
  }

  function handlePrevious() {
    // Previous never validates — never lose or block navigation backward.
    goToStep(currentStep - 1);
  }

  /* =====================================================================
     7. DATA COLLECTION & REVIEW RENDERING
     ===================================================================== */

  /**
   * Re-validates & re-commits all fields across all steps into
   * applicationData. Used before rendering the review screen and before
   * final submission, so any field edited-then-left-blank is re-checked.
   */
  function collectAllStepData() {
    let allValid = true;
    Object.keys(fieldDefinitions).forEach((key) => {
      if (key === 'consent') return; // consent is validated at submit-time only
      const valid = validateField(key);
      if (!valid) allValid = false;
    });
    return allValid;
  }

  function renderReview() {
    collectAllStepData();

    const p = applicationData.personal;
    const i = applicationData.interest;
    const s = applicationData.skills;

    dom.reviewContainer.innerHTML = `
      <div class="review-section" data-review-step="1">
        <div class="review-section-header">
          <span class="review-section-title"><i class="fa-solid fa-user" aria-hidden="true"></i> Personal Information</span>
          <button type="button" class="btn-edit" data-edit-step="1">Edit</button>
        </div>
        <div class="review-grid">
          <div class="review-item"><span class="review-item-label">Full Name</span><span class="review-item-value">${escapeHtml(p.fullName) || '—'}</span></div>
          <div class="review-item"><span class="review-item-label">Email</span><span class="review-item-value">${escapeHtml(p.email) || '—'}</span></div>
          <div class="review-item"><span class="review-item-label">Phone</span><span class="review-item-value">${escapeHtml(p.phone) || '—'}</span></div>
          <div class="review-item"><span class="review-item-label">City</span><span class="review-item-value">${escapeHtml(p.city) || '—'}</span></div>
          <div class="review-item"><span class="review-item-label">Education</span><span class="review-item-value">${escapeHtml(p.education) || '—'}</span></div>
          <div class="review-item"><span class="review-item-label">University</span><span class="review-item-value">${escapeHtml(p.university) || '—'}</span></div>
        </div>
      </div>

      <div class="review-section" data-review-step="2">
        <div class="review-section-header">
          <span class="review-section-title"><i class="fa-solid fa-diagram-project" aria-hidden="true"></i> Field &amp; Interest</span>
          <button type="button" class="btn-edit" data-edit-step="2">Edit</button>
        </div>
        <div class="review-grid">
          <div class="review-item"><span class="review-item-label">Domain</span><span class="review-item-value">${escapeHtml(i.domain) || '—'}</span></div>
          <div class="review-item full-width"><span class="review-item-label">Reason</span><span class="review-item-value">${escapeHtml(i.reason) || '—'}</span></div>
        </div>
      </div>

      <div class="review-section" data-review-step="3">
        <div class="review-section-header">
          <span class="review-section-title"><i class="fa-solid fa-star-half-stroke" aria-hidden="true"></i> Skill Self-Rating</span>
          <button type="button" class="btn-edit" data-edit-step="3">Edit</button>
        </div>
        <div class="review-grid">
          <div class="review-item"><span class="review-item-label">HTML</span><span class="review-item-value">${formatRating(s.html)}</span></div>
          <div class="review-item"><span class="review-item-label">CSS</span><span class="review-item-value">${formatRating(s.css)}</span></div>
          <div class="review-item"><span class="review-item-label">JavaScript</span><span class="review-item-value">${formatRating(s.javascript)}</span></div>
          <div class="review-item"><span class="review-item-label">Communication</span><span class="review-item-value">${formatRating(s.communication)}</span></div>
          <div class="review-item"><span class="review-item-label">Problem Solving</span><span class="review-item-value">${formatRating(s.problemSolving)}</span></div>
          <div class="review-item"><span class="review-item-label">Portfolio / GitHub</span><span class="review-item-value">${s.portfolio ? `<a href="${escapeHtml(s.portfolio)}" target="_blank" rel="noopener noreferrer">${escapeHtml(s.portfolio)}</a>` : 'Not provided'}</span></div>
        </div>
      </div>
    `;

    // Wire up Edit buttons (delegated once per render since innerHTML rebuilt)
    dom.reviewContainer.querySelectorAll('[data-edit-step]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetStep = Number(btn.dataset.editStep);
        goToStep(targetStep);
      });
    });
  }

  function formatRating(value) {
    if (!value) return '—';
    return `${value}/5 (${SKILL_LEVEL_TEXT[value] || ''})`;
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /* =====================================================================
     8. LOCAL STORAGE PERSISTENCE (optional, no sensitive data)
     ===================================================================== */

  function saveDraftToStorage() {
    try {
      // Snapshot current raw input values so partially-typed, not-yet-valid
      // fields are not lost either.
      const snapshot = {
        currentStep,
        raw: {
          fullName: dom.fullName.value,
          email: dom.email.value,
          phone: dom.phone.value,
          city: dom.city.value,
          education: dom.education.value,
          university: dom.university.value,
          domain: (dom.domainInputs.find((el) => el.checked) || {}).value || '',
          reason: dom.reasonInput.value,
          html: (document.querySelector('input[name="html"]:checked') || {}).value || '',
          css: (document.querySelector('input[name="css"]:checked') || {}).value || '',
          javascript: (document.querySelector('input[name="javascript"]:checked') || {}).value || '',
          communication: (document.querySelector('input[name="communication"]:checked') || {}).value || '',
          problemSolving: (document.querySelector('input[name="problemSolving"]:checked') || {}).value || '',
          portfolio: dom.portfolio.value
        },
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch (err) {
      // localStorage may be unavailable (private browsing, quota, etc.)
      // Fail silently — persistence is a nice-to-have, not critical.
      console.warn('Could not save draft to localStorage:', err);
    }
  }

  function loadDraftFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err) {
      console.warn('Could not read saved draft:', err);
      return null;
    }
  }

  function clearDraftFromStorage() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.warn('Could not clear saved draft:', err);
    }
  }

  function restoreDraftIntoForm(snapshot) {
    if (!snapshot || !snapshot.raw) return;
    const r = snapshot.raw;

    dom.fullName.value = r.fullName || '';
    dom.email.value = r.email || '';
    dom.phone.value = r.phone || '';
    dom.city.value = r.city || '';
    dom.education.value = r.education || '';
    dom.university.value = r.university || '';

    if (r.domain) {
      const domainInput = dom.domainInputs.find((el) => el.value === r.domain);
      if (domainInput) domainInput.checked = true;
    }

    dom.reasonInput.value = r.reason || '';
    updateReasonCounter();

    ['html', 'css', 'javascript', 'communication', 'problemSolving'].forEach((skill) => {
      if (r[skill]) {
        const input = document.querySelector(`input[name="${skill}"][value="${r[skill]}"]`);
        if (input) input.checked = true;
      }
    });

    dom.portfolio.value = r.portfolio || '';

    // Re-run collection quietly (no error display) to warm up applicationData
    // for fields that are already valid, without flashing error states.
    Object.keys(fieldDefinitions).forEach((key) => {
      if (key === 'consent') return;
      const def = fieldDefinitions[key];
      const result = def.validate();
      if (result.valid) def.commit(result);
    });

    const targetStep = Math.min(Math.max(Number(snapshot.currentStep) || 1, 1), TOTAL_STEPS);
    goToStep(targetStep);
  }

  /* =====================================================================
     9. SUBMISSION HANDLING
     ===================================================================== */

  function generateReference() {
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `SAFEX-${year}-${rand}`;
  }

  function setSubmissionStatus(message, type) {
    if (!message) {
      dom.submissionStatus.hidden = true;
      dom.submissionStatus.textContent = '';
      dom.submissionStatus.className = 'submission-status';
      return;
    }
    dom.submissionStatus.hidden = false;
    dom.submissionStatus.textContent = message;
    dom.submissionStatus.className = 'submission-status ' + (type ? `is-${type}` : '');
  }

  function showScreen(screenEl) {
    [dom.successScreen, dom.duplicateScreen, dom.errorScreen].forEach((el) => {
      el.hidden = el !== screenEl;
    });
    if (screenEl) {
      dom.form.hidden = true;
      screenEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      screenEl.focus?.();
    } else {
      dom.form.hidden = false;
    }
  }

  function buildPayload() {
    return {
      personal: applicationData.personal,
      interest: applicationData.interest,
      skills: applicationData.skills,
      submittedAt: new Date().toISOString()
    };
  }

  async function submitApplication() {
    if (isSubmitting) return; // prevent double submission
    isSubmitting = true;

    dom.submitBtn.disabled = true;
    dom.nextBtn.disabled = true;
    dom.submitBtnText.textContent = 'Submitting…';
    dom.submitBtn.querySelector('i')?.classList.replace('fa-paper-plane', 'fa-spinner');
    setSubmissionStatus('Submitting your application…', 'loading');

    applicationData.submittedAt = new Date().toISOString();
    const payload = buildPayload();

    // Guard: if the placeholder URL has not been replaced, fail clearly
    // instead of sending a request that can never succeed.
    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL') {
      resetSubmitButton();
      setSubmissionStatus('', null);
      showSubmissionError(
        'The application backend is not configured yet (GOOGLE_SCRIPT_URL is still a placeholder in script.js).'
      );
      return;
    }

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      resetSubmitButton();
      setSubmissionStatus('', null);

      submissionSucceeded = true;
      clearDraftFromStorage();
      showSuccess(generateReference());
    } catch (err) {
      console.error('Submission failed:', err);
      resetSubmitButton();
      setSubmissionStatus('', null);
      showSubmissionError(err.message);
    }
  }

  function resetSubmitButton() {
    isSubmitting = false;
    dom.submitBtn.disabled = false;
    dom.nextBtn.disabled = false;
    dom.submitBtnText.textContent = 'Submit Application';
    dom.submitBtn.querySelector('i')?.classList.replace('fa-spinner', 'fa-paper-plane');
  }

  function showSuccess(reference) {
    dom.referenceValue.textContent = reference;
    showScreen(dom.successScreen);
  }

  function showDuplicateScreen() {
    showScreen(dom.duplicateScreen);
  }

  function showSubmissionError(detail) {
    dom.errorDetail.textContent = detail ? `Technical detail: ${detail}` : '';
    showScreen(dom.errorScreen);
  }

  function backToForm() {
    showScreen(null);
  }

  /* =====================================================================
     10. INITIALIZATION / EVENT WIRING
     ===================================================================== */

  function wireRealTimeValidation() {
    // Text/email/tel/url/select inputs: validate on blur (so user isn't
    // interrupted mid-typing) and on input (so error clears as soon as fixed).
    const liveFields = ['fullName', 'email', 'phone', 'city', 'education', 'university', 'portfolio'];
    liveFields.forEach((key) => {
      const def = fieldDefinitions[key];
      const el = normalizeInputList(def.inputs)[0];
      if (!el) return;

      el.addEventListener('blur', () => validateField(key));
      el.addEventListener('input', () => {
        // Only clear/re-validate while typing if the field is already
        // marked invalid, to avoid nagging the user prematurely.
        const group = def.group;
        if (group && group.classList.contains('is-invalid')) {
          validateField(key);
        }
      });
    });

    // Reason textarea: live character counter + validation
    dom.reasonInput.addEventListener('input', () => {
      updateReasonCounter();
      const group = fieldDefinitions.reason.group;
      if (group && group.classList.contains('is-invalid')) {
        validateField('reason');
      }
    });
    dom.reasonInput.addEventListener('blur', () => validateField('reason'));

    // Domain radio cards: validate immediately on selection
    dom.domainInputs.forEach((input) => {
      input.addEventListener('change', () => validateField('domain'));
    });

    // Rating radios: validate immediately on selection
    ['html', 'css', 'javascript', 'communication', 'problemSolving'].forEach((skill) => {
      document.querySelectorAll(`input[name="${skill}"]`).forEach((input) => {
        input.addEventListener('change', () => validateField(skill));
      });
    });

    // Consent checkbox
    dom.consent.addEventListener('change', () => validateField('consent'));
  }

  function updateReasonCounter() {
    const len = dom.reasonInput.value.trim().length;
    dom.reasonCounter.textContent = `${len} / ${REASON_MAX}`;
    dom.reasonCounter.classList.remove('is-under', 'is-ok', 'is-over');
    if (len > REASON_MAX) {
      dom.reasonCounter.classList.add('is-over');
    } else if (len < REASON_MIN) {
      dom.reasonCounter.classList.add('is-under');
    } else {
      dom.reasonCounter.classList.add('is-ok');
    }
  }

  function wireNavigation() {
    dom.nextBtn.addEventListener('click', handleNext);
    dom.prevBtn.addEventListener('click', handlePrevious);

    dom.form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (isSubmitting) return;
      if (!validateStep(4)) return;
      if (!collectAllStepData()) {
        // Some earlier-step field became invalid (e.g., user cleared it
        // via browser autofill weirdness) — send them back to fix it.
        setSubmissionStatus('', null);
        return;
      }
      submitApplication();
    });

    // Browser back/forward support: move between steps rather than
    // navigating away, as long as we're mid-form.
    window.addEventListener('popstate', (event) => {
      if (submissionSucceeded) return;
      const state = event.state;
      if (state && state.safexStep) {
        currentStep = Math.min(Math.max(state.safexStep, 1), TOTAL_STEPS);
        dom.steps.forEach((stepEl) => {
          const stepNum = Number(stepEl.dataset.step);
          stepEl.classList.toggle('is-active', stepNum === currentStep);
        });
        updateProgress();
        updateNavButtons();
        if (currentStep === TOTAL_STEPS) renderReview();
      }
    });
  }

  function wireResultScreens() {
    dom.backHomeBtn.addEventListener('click', () => {
      // Full reset: reload the page for a completely clean slate.
      window.location.hash = '';
      window.location.reload();
    });

    dom.duplicateBackBtn.addEventListener('click', () => {
      backToForm();
      goToStep(1);
      dom.fullName.focus();
    });

    dom.retryBtn.addEventListener('click', () => {
      backToForm();
      submitApplication();
    });
  }

  function wireRestoreBanner() {
    const snapshot = loadDraftFromStorage();
    const hasContent = snapshot && snapshot.raw && Object.values(snapshot.raw).some((v) => v && String(v).trim());

    if (hasContent) {
      dom.restoreBanner.hidden = false;
      dom.dismissRestoreBtn.addEventListener('click', () => {
        dom.restoreBanner.hidden = true;
      });
      dom.clearSavedBtn.addEventListener('click', () => {
        clearDraftFromStorage();
        dom.restoreBanner.hidden = true;
      });
      // Auto-restore into the form fields; user can still "Clear Saved Data".
      restoreDraftIntoForm(snapshot);
    }
  }

  function wireAutosave() {
    // Save on every meaningful interaction so a refresh never loses data.
    dom.form.addEventListener('input', saveDraftToStorage);
    dom.form.addEventListener('change', saveDraftToStorage);
  }

  function init() {
    cacheDom();
    fieldDefinitions = getFieldDefinitions();

    updateReasonCounter();
    updateProgress();
    updateNavButtons();
    wireRealTimeValidation();
    wireNavigation();
    wireResultScreens();
    wireAutosave();
    wireRestoreBanner();

    // Initialize history state for step 1 so popstate has something to
    // compare against.
    try {
      history.replaceState({ safexStep: 1 }, '', '#step-1');
    } catch (err) {
      /* ignore */
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
