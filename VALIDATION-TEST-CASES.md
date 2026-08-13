# SafeX Internship Application — Validation Test Cases

Manual QA matrix for the SafeX Internship Application Form. Each row was
exercised by hand in Chrome, Firefox, and Safari (desktop) plus Chrome on
Android and Safari on iOS (mobile), at the breakpoints listed in the README
(1920px, 1440px, 1366px, 768px, 430px, 390px, 375px).

Legend: **PASS** = behaves as expected. **N/A** = not applicable in this
environment (noted with a reason).

---

## Step 1 — Personal Information

| Test Case | Input | Expected Result | Status |
|---|---|---|---|
| Empty name | *(empty)* | "Full name is required." shown, Next blocked | PASS |
| Name with only spaces | `"   "` | "Full name is required." shown (trimmed to empty) | PASS |
| Name containing only numbers | `12345` | "Please enter a valid name." shown | PASS |
| Name too short | `A` | "Name must be at least 2 characters." shown | PASS |
| Name with extra whitespace | `  Ali   Ahmed  ` | Accepted, normalized to `Ali Ahmed` on commit | PASS |
| Valid name | `Ali Ahmed` | Field marked valid (green), error cleared | PASS |
| Empty email | *(empty)* | "Email address is required." shown | PASS |
| Invalid email (no domain) | `alisha@` | "Please enter a valid email address." shown | PASS |
| Invalid email (no @) | `alisha.com` | "Please enter a valid email address." shown | PASS |
| Valid email, mixed case + spaces | `  Ali@Example.COM ` | Accepted, normalized to `ali@example.com` | PASS |
| Valid email | `user@gmail.com` | Accepted, field marked valid | PASS |
| Empty phone | *(empty)* | "Phone number is required." shown | PASS |
| Invalid phone (too short) | `123` | "Enter a valid Pakistani phone number." shown | PASS |
| Invalid phone (wrong prefix) | `04001234567` | "Enter a valid Pakistani phone number." shown | PASS |
| Valid phone (local format) | `03001234567` | Accepted | PASS |
| Valid phone (international, plus) | `+923001234567` | Accepted | PASS |
| Valid phone (international, no plus) | `923001234567` | Accepted | PASS |
| Valid phone with spaces/dashes | `0300-123-4567` | Accepted (whitespace/dashes stripped before check) | PASS |
| Empty city | *(empty)* | "City is required." shown | PASS |
| Valid city | `Karachi` | Accepted | PASS |
| No education level selected | *(none)* | "Please select your education level." shown | PASS |
| Education selected | `Bachelor's` | Accepted | PASS |
| Empty university | *(empty)* | "University / Institution is required." shown | PASS |
| Valid university | `FAST-NUCES` | Accepted | PASS |
| Next clicked with all Step 1 fields invalid | *(all empty)* | Next blocked, first invalid field (`Full Name`) auto-focused | PASS |
| Next clicked with all Step 1 fields valid | *(all valid)* | Advances to Step 2, progress bar updates to 50% | PASS |

## Step 2 — Field & Interest

| Test Case | Input | Expected Result | Status |
|---|---|---|---|
| No domain selected | *(none)* | "Please select a domain of interest." shown, Next blocked | PASS |
| Domain selected | `Full Stack Development` | Card highlighted, error cleared immediately | PASS |
| Empty interest reason | *(empty)* | "Please tell us why you are interested in this field." shown | PASS |
| Reason below minimum (10 chars) | `I like code` (11 chars) | "Please enter at least 30 characters." shown; counter shows `11 / 500` in warning color | PASS |
| Reason at exactly 30 characters | 30-char string | Accepted, counter turns "ok" (green) | PASS |
| Reason above maximum (500+) | 520-char string | "Please keep your answer under 500 characters." shown; counter shows over-limit in red | PASS |
| Reason at exactly 500 characters | 500-char string | Accepted | PASS |
| Live character counter | typing incrementally | Counter updates on every keystroke, e.g. `27 / 500` | PASS |
| Next with invalid Step 2 data | domain unselected, reason too short | Next blocked, first invalid element (domain group) focused/announced | PASS |
| Next with valid Step 2 data | domain + valid reason | Advances to Step 3, progress bar updates to 75% | PASS |

## Step 3 — Skill Self-Rating

| Test Case | Input | Expected Result | Status |
|---|---|---|---|
| Missing HTML rating | *(none)* | "Please rate your HTML skill." shown | PASS |
| Missing CSS rating | *(none)* | "Please rate your CSS skill." shown | PASS |
| Missing JavaScript rating | *(none)* | "Please rate your JavaScript skill." shown | PASS |
| Missing Communication rating | *(none)* | "Please rate your Communication skill." shown | PASS |
| Missing Problem Solving rating | *(none)* | "Please rate your Problem Solving skill." shown | PASS |
| All ratings selected | HTML 4, CSS 4, JS 3, Comm 5, PS 4 | All groups marked valid, no errors | PASS |
| Rating selection via keyboard | Tab to group, Arrow keys / Space to select | Radio selection works, focus ring visible | PASS |
| Portfolio URL empty | *(empty)* | Accepted (optional field, no error) | PASS |
| Portfolio URL missing protocol | `github.com/aliahmed` | "URL must start with http:// or https://" shown | PASS |
| Portfolio URL malformed | `https:///bad` | "Please enter a valid URL." shown | PASS |
| Portfolio URL valid | `https://github.com/aliahmed` | Accepted, field marked valid | PASS |
| Next with a missing rating | 4 of 5 ratings filled | Next blocked, first invalid rating group focused | PASS |
| Next with all Step 3 data valid | all ratings + optional URL | Advances to Step 4 (Review), progress bar updates to 100% | PASS |

## Step 4 — Review & Submit

| Test Case | Input | Expected Result | Status |
|---|---|---|---|
| Review renders all entered data | valid data from steps 1–3 | Name, email, phone, city, education, university, domain, reason, all 5 ratings, and portfolio URL (or "Not provided") all display correctly | PASS |
| Edit button on Personal section | click "Edit" under Personal Information | Returns to Step 1 with all fields still populated | PASS |
| Edit button on Interest section | click "Edit" under Field & Interest | Returns to Step 2 with domain + reason still populated | PASS |
| Edit button on Skills section | click "Edit" under Skill Self-Rating | Returns to Step 3 with all ratings + URL still populated | PASS |
| Edit then Next again | edit Step 1, change city, click Next → Next → Next | Updated city reflected correctly back on Review | PASS |
| Submit without checking consent | consent checkbox unchecked | "Please confirm your information is accurate before submitting." shown, submission blocked | PASS |
| Submit with consent checked | consent checkbox checked, valid data | Proceeds to submission flow | PASS |

## Submission Flow / Backend Integration

| Test Case | Input | Expected Result | Status |
|---|---|---|---|
| Submit button double-click | rapid double-click on Submit | Only one request fires; button disabled after first click; "Submitting…" shown | PASS |
| GOOGLE_SCRIPT_URL left as placeholder | valid form, unconfigured backend | Clear configuration error surfaced on the error screen instead of a silent failure | PASS |
| Successful submission | valid data, configured Apps Script | Success screen shown with `SAFEX-YYYY-NNNN` reference; form data cleared from localStorage | PASS |
| Duplicate email submission | email already present in the Sheet | Backend returns `status: "duplicate"`; dedicated "You've Already Applied" screen shown | PASS |
| Network failure during submission | browser offline / DevTools "Offline" throttling | "Something Went Wrong" error screen shown with Try Again button; form data retained, nothing cleared | PASS |
| Google Apps Script server error | Apps Script throws / returns malformed JSON | Generic server error message shown (no leaked stack trace); Try Again available | PASS |
| Try Again after failure | click "Try Again" on error screen | Returns to form view with all data intact, can resubmit | PASS |
| Refresh mid-form | fill Step 1–2 partially, refresh browser | Restore banner appears on reload; fields auto-restored to last saved values | PASS |
| Clear Saved Data | click "Clear Saved Data" in restore banner | localStorage draft removed; fields no longer restored on next reload | PASS |
| Successful submission clears draft | complete + submit successfully | localStorage draft automatically cleared after success | PASS |

## Navigation & UX Edge Cases

| Test Case | Input | Expected Result | Status |
|---|---|---|---|
| Previous button on Step 1 | *(n/a)* | Disabled — cannot go before Step 1 | PASS |
| Previous button from Step 2/3/4 | click Previous | Returns one step back, all data preserved, progress bar updates accordingly | PASS |
| Forward/backward repeatedly | Next → Previous → Next → Previous | No data loss at any point, progress indicator always accurate | PASS |
| Browser Back button mid-form | press browser Back after reaching Step 3 | Returns to Step 2 within the form instead of leaving the page | PASS |
| Browser Forward button | press browser Forward after using Back | Returns to Step 3 | PASS |
| Keyboard-only full traversal | Tab/Shift+Tab/Enter/Space/Arrow keys only, no mouse | All 4 steps completable, all controls reachable and operable, focus always visible | PASS |
| Mobile screen (375px–430px) | complete form on a 375px viewport | No horizontal scroll, all buttons touch-friendly (≥44px height), error text wraps without breaking layout | PASS |
| Tablet screen (768px) | complete form on a 768px viewport | 2-column grid collapses to 1 column appropriately, progress step labels condense | PASS |
| Desktop screens (1366/1440/1920px) | complete form at each width | Centered content, consistent max-width container, no excessive whitespace issues | PASS |

---

## Summary

All planned test cases above were exercised manually against the delivered
build and passed. Where a scenario depends on external conditions (e.g. the
exact Google Apps Script quota/timeout behavior under extreme concurrent
load), the corresponding limitation is documented in `README.md` under
**Known Limitations** rather than claimed as fully tested here.
