# AccessOne — Manual Test Case Suite

Covers every user scenario across all six roles, end to end. Grounded in the
actual implemented business rules (service classes, domain guards, and the
Phase 12 access engine) — every "expected result" names the specific error
code, event, or status change the code actually produces, not a generic
guess.

**How to use this document:** run each case against a freshly seeded
database, record the actual result and Pass/Fail in the last two columns,
and keep the filled-in version as the Phase 15 deliverable. Automated
coverage for the sharpest business rules underneath these scenarios lives in
`backend/src/test/java` (98 tests as of this pass) — see the note at the end
of each section for which cases also have a unit test.

**Test accounts** (seeded in V4): one user per role — `nperera` (HR_MANAGER),
`itadmin` (IT_ADMIN), `rfernando` (SECURITY_OFFICER), `printsup`
(PRINT_SUPERVISOR), `sysadmin` (SYSTEM_ADMIN), plus any employee's own login
for EMPLOYEE. Confirm actual seeded usernames/passwords against `V4__sample_data.sql`
before running.

---

## 0. Authentication & Authorization

| ID | Scenario | Steps | Expected Result | Actual | Pass/Fail |
|---|---|---|---|---|---|
| AUTH-01 | Login as each of the six roles | Log in as each seeded account in turn | Each lands on its role's landing page with the correct nav items (employee → My requests, HR → Approvals, IT → Configuration, Security → On site, Print → Production, Admin → Administration) | | |
| AUTH-02 | Wrong password | Log in with a valid username, wrong password | Clean error message, no stack trace, no indication of whether the username exists | | |
| AUTH-03 | Session survives refresh | Log in, refresh the page | Still logged in, same role/dashboard | | |
| AUTH-04 | Logout invalidates session | Log out, then use the browser back button | Redirected to login, cannot see any protected page | | |
| AUTH-05 | Forbidden route redirect | As EMPLOYEE, navigate directly to `/hr` or `/admin` | Redirected away, not a broken/blank page | | |
| AUTH-06 | Cross-employee data isolation | As Employee A, note Employee B's request ID; call `GET /api/v1/requests/{B's id}` directly | 403/404 — an employee cannot read another employee's request by changing an ID in the URL | | |
| AUTH-07 | Role escalation via direct API call | As EMPLOYEE, call an HR-only endpoint (e.g. `POST /api/v1/approvals/{id}/approve`) directly | 403, not a 500 and not a silent success | | |
| AUTH-08 | Account lockout after repeated failed logins | Fail login 5+ times for one account | Account locks (per `User.LOCK_THRESHOLD` / `failedLoginAttempts`); admin dashboard's "accounts with failed logins" tile reflects it | | |
| AUTH-09 | Successful login resets the failure counter | Fail login twice, then succeed | `failedLoginAttempts` resets to 0 | | |

---

## 1. Module 1 — Employee Card Requests

| ID | Scenario | Steps | Expected Result | Actual | Pass/Fail |
|---|---|---|---|---|---|
| REQ-01 | Create a NEW request | Employee → New request → type NEW, no previous card | Draft created, status DRAFT | | |
| REQ-02 | REPLACEMENT without a reason | New request, type REPLACEMENT, leave reason blank | Rejected: "...replaced..." validation message, no request created | | |
| REQ-03 | REPLACEMENT without a previous card | Type REPLACEMENT, give a reason, leave previous card blank | Rejected: "...card being replaced..." | | |
| REQ-04 | REPLACEMENT, fully filled | Type REPLACEMENT, reason + previous card selected | Draft created | | |
| REQ-05 | Submit without a photo | Draft with no photo attached → Submit | Rejected ("...photo..."), status stays DRAFT | | |
| REQ-06 | Submit with a photo | Attach a photo → Submit | Status → SUBMITTED, `submittedAt` set, `CardRequestSubmitted` published (HR queue gains the request) | | |
| REQ-07 | Edit a draft | Edit request type/reason while still DRAFT | Changes saved | | |
| REQ-08 | Edit after submission | Try to edit a SUBMITTED request | Rejected: "...cannot be edited..." | | |
| REQ-09 | Withdraw a submitted request | Submit, then Withdraw | Status → WITHDRAWN, `closedAt` set | | |
| REQ-10 | Delete a draft | Delete a DRAFT request | Removed entirely (hard delete), documents' folder cleaned up | | |
| REQ-11 | Delete a submitted request | Try to delete a SUBMITTED (or later) request, including via direct API call | Rejected: NOT_DELETABLE — "withdraw it instead" | | |
| REQ-12 | Upload a supporting document | Upload a document on a draft | Appears in the document list | | |
| REQ-13 | Download a document | Download an uploaded document | Correct file returned with original filename | | |
| REQ-14 | Remove a document from a draft | Delete a document while still DRAFT | Removed | | |
| REQ-15 | View request timeline | Open a request that has been submitted, verified, approved | Timeline shows each status change with who/when | | |
| REQ-16 | Existing request in progress blocks a new one | With a SUBMITTED/UNDER_VERIFICATION request already open, try to create another | Rejected: REQUEST_IN_PROGRESS | | |
| REQ-17 | Employee dashboard tile | View employee landing page | "Card status" and "Requests in progress" tiles show real, current values | | |

*Automated coverage:* `CardRequestTest` (submit/edit/delete-restriction rules), `RequestDocumentService` paths untested at unit level — exercise REQ-12–14 manually.

---

## 2. Module 2 — Verification & Approval (HR)

| ID | Scenario | Steps | Expected Result | Actual | Pass/Fail |
|---|---|---|---|---|---|
| APR-01 | View pending queue | Open HR → Approvals | Lists all pending requests, oldest first, with ageing flag (NORMAL/AGEING/OVERDUE) | | |
| APR-02 | Filter by ageing | Click the "Overdue" filter tab | List narrows to only OVERDUE-flagged requests | | |
| APR-03 | Approve without verifying first | Call approve directly on a freshly-opened approval (skip verify) | Rejected: `InvalidStateTransitionException` — decision stays PENDING | | |
| APR-04 | Reject without verifying first | Same, but reject | Same rejection, decision stays PENDING | | |
| APR-05 | Verify, then approve | Verify → Approve | Decision → APPROVED, decider + timestamp recorded, audit action = **APPROVE** (not STATUS_CHANGE), `CardRequestApproved` published | | |
| APR-06 | Approve an exited employee's request | Record the employee's exit first, then try to approve | Rejected: EMPLOYEE_NOT_ACTIVE — "reject the request instead" | | |
| APR-07 | Reject without a reason | Verify → Reject with a blank reason | Rejected: "Say why..."; decision stays VERIFIED | | |
| APR-08 | Reject with a reason | Verify → Reject with a real reason | Decision → REJECTED, audit action = **REJECT**, `CardRequestRejected` published, employee notified with the reason itself as the message | | |
| APR-09 | Resubmit after rejection | As the employee, resubmit the corrected request | `RequestSubmittedListener` reopens the existing approval row (decision → PENDING) rather than creating a duplicate; request status → SUBMITTED again | | |
| APR-10 | Bulk approve | Select 3+ pending requests → Approve selected | Each approved individually with its own audit entry (not one aggregate entry); a partial failure (e.g. one employee exited) reports per-request success/failure, not an all-or-nothing rollback | | |
| APR-11 | Comment on a request | Add a comment during review | Comment appears with author and timestamp | | |
| APR-12 | Raise a request on behalf of an employee | As HR, use the "raise on behalf" path for another employee | Request created under that employee's name, not HR's | | |
| APR-13 | Batch-raise for onboarding | Submit a batch of new-employee requests | Each created individually; per-item success/failure reported | | |
| APR-14 | Record an employee exit | Trigger exit for an employee with SUBMITTED/UNDER_VERIFICATION requests and an ACTIVE card | In-flight requests → CANCELLED; active card(s) → **REVOKED** (audit action REVOKE, not STATUS_CHANGE); `EmployeeExited` published | | |
| APR-15 | View approval history | Open HR → Approval history | Shows all concluded (APPROVED/REJECTED) decisions with decider | | |
| APR-16 | HR dashboard tiles | View HR landing page | Pending / Overdue / Decided this week / Avg turnaround tiles match a direct count; each links to the filtered queue or history | | |

*Automated coverage:* `ApprovalTest` (verify-before-decide, reason requirements, reopen, decider/timestamp pairing).

---

## 3. Module 3 — Department & Access Level Configuration (IT)

| ID | Scenario | Steps | Expected Result | Actual | Pass/Fail |
|---|---|---|---|---|---|
| CFG-01 | Create a department | New department with a unique code | Created | | |
| CFG-02 | Duplicate department code | Create another department with the same code (any case) | Rejected: DUPLICATE_CODE | | |
| CFG-03 | Deactivate a department with active staff | Deactivate a department that has employees | Succeeds, but the response/UI shows the affected staff count as a warning, not a silent no-op | | |
| CFG-04 | Reactivate a department | Reactivate a deactivated department | Active again | | |
| CFG-05 | Delete a department in use | Try to delete a department with employees | Rejected: DEPARTMENT_IN_USE | | |
| CFG-06 | Create an area | New area, mark as restricted | Created | | |
| CFG-07 | Duplicate area code | Create another area with the same code | Rejected: DUPLICATE_CODE | | |
| CFG-08 | Deactivate / reactivate an area | Toggle an area's active flag | Reflected immediately in the permission matrix and the rule test | | |
| CFG-09 | Delete an area | Try to delete any area, active or not | Always rejected: AREA_NOT_DELETABLE — "deactivate it instead" | | |
| CFG-10 | Create an access level | New level with a unique code | Created | | |
| CFG-11 | Duplicate level code | Create another level with the same code | Rejected: DUPLICATE_CODE | | |
| CFG-12 | Grant/revoke areas on a level | Open a level, add and remove areas from its permitted set | Matrix updates; audit entry records the before/after area-code sets | | |
| CFG-13 | Deactivate an access level | Deactivate a level currently assigned to cards | Succeeds; assigned cards keep the (now-inactive) level, but it can no longer be newly assigned | | |
| CFG-14 | View the permission matrix | Open IT → Access levels | Rows = levels, columns = active areas, cells reflect the DB exactly (no caching) | | |
| CFG-15 | Rule test | Pick a level + area combination in the rule-test panel | Result (granted/denied + reason) matches what the door (Phase 12 engine) would actually decide for that pair | | |
| CFG-16 | Assign an access level to a card | On a card's detail page, assign a level | Assignment recorded; superseding a previous assignment keeps the old one in history rather than deleting it | | |
| CFG-17 | Assign an inactive level | Try to assign a deactivated level to a card | Rejected: LEVEL_INACTIVE | | |
| CFG-18 | Re-assign the same level | Assign a level the card already holds | Rejected: ALREADY_ASSIGNED | | |
| CFG-19 | IT dashboard tiles | View IT landing page | Active cards / Revoked / Awaiting generation / Active access levels tiles match direct counts | | |

*Automated coverage:* `AccessLevelTest`, `CardAccessAssignmentTest` (permission and assignment rules at the domain level).

---

## 4. Module 4 — Card Generation

| ID | Scenario | Steps | Expected Result | Actual | Pass/Fail |
|---|---|---|---|---|---|
| GEN-01 | Generate a card for an approved request | IT → generate for an APPROVED request | Card created with a unique serial (`ACO-YYYY-NNNNNN`), QR + NFC credential created in the same operation, `CardGenerated` published | | |
| GEN-02 | Generate twice for the same request | Try to generate again for a request that already has a card | Rejected: ALREADY_GENERATED | | |
| GEN-03 | View card layout preview | Open a card's detail page | Photo, name, employee ID, department, designation, serial and QR all render correctly | | |
| GEN-04 | Download the printable PDF | Download the card PDF | Renders with photo and all required fields, opens in a PDF reader | | |
| GEN-05 | Scan / verify by serial | Scan the QR (or submit its serial to the verify endpoint) | Resolves to the correct card record | | |
| GEN-06 | Regenerate credentials | After a data correction, regenerate QR/NFC | New QR/NFC payloads issued, same card serial, audit entry recorded | | |
| GEN-07 | Revoke a card without a reason | Try to revoke with a blank reason | Rejected | | |
| GEN-08 | Revoke a card with a reason | Revoke with a real reason | Status → REVOKED, `revokedAt` + `revocationReason` both set, audit action = **REVOKE**, employee notified, card immediately unusable at the door | | |
| GEN-09 | Void a card before printing | Void a GENERATED card | Status → VOID | | |
| GEN-10 | Void a card already in the print queue | Try to void a card with an open print job | Rejected: ALREADY_IN_PRODUCTION — "revoke it instead" | | |
| GEN-11 | Report a card lost | Trigger "report lost" on an active card | `CardReportedLost` published | | |
| GEN-12 | Reissue after loss/damage | Approve a REPLACEMENT request, generate the new card | Old card → REPLACED, linked to the new card; new card starts fresh at GENERATED | | |
| GEN-13 | A card cannot replace itself | Attempt to supersede a card with itself (API-level check) | Rejected | | |

*Automated coverage:* `IdCardTest` (activation/revocation/supersession invariants), `CredentialPayloadFactoryTest` (QR/NFC content, tamper detection, ciphertext uniqueness), `SequenceGeneratorTest` (serial format).

---

## 5. Module 6 — Print Production, Dispatch & Activation

| ID | Scenario | Steps | Expected Result | Actual | Pass/Fail |
|---|---|---|---|---|---|
| PRN-01 | Queue a print job | Queue a job for a GENERATED card | Job created (QUEUED), card → QUEUED_FOR_PRINT | | |
| PRN-02 | Queue a second job for the same card | Try to queue again while one is still open | Rejected: JOB_ALREADY_OPEN | | |
| PRN-03 | Start a job | Assign a printer, start the job | Job → IN_PROGRESS | | |
| PRN-04 | Mark printed | Mark the job as printed | Job → PRINTED, card → PRINTED, `printedAt` set | | |
| PRN-05 | Record a QC pass | Record QC result = PASS | Job → QC_PASSED | | |
| PRN-06 | Record a QC fail | Record QC result = FAIL, with notes | Job → QC_FAILED, `PrintQualityFailed` published | | |
| PRN-07 | Reprint after QC failure | Reprint the failed job | New job created (REPRINT type), the failed job stays as a permanent record, card → QUEUED_FOR_PRINT again | | |
| PRN-08 | Reprint a job that hasn't failed | Try to reprint a job that is not QC_FAILED | Rejected: NOT_FAILED | | |
| PRN-09 | Cancel a queued job | Cancel before printing starts | Job → CANCELLED, card returns to GENERATED so it can be queued again | | |
| PRN-10 | Cancel a job already printed | Try to cancel after printing | Rejected — physical stock has been consumed | | |
| PRN-11 | Open a dispatch record | Open dispatch for a QC_PASSED job | Dispatch record created (PENDING) | | |
| PRN-12 | Duplicate dispatch | Try to open a second dispatch record for the same job | Rejected: ALREADY_DISPATCHED | | |
| PRN-13 | Complete handover | Mark the dispatch as delivered/handed over | Dispatch → DELIVERED, card → ACTIVE (**activation happens at handover, not at print or batch receipt**), `activatedAt` set, `CardActivated` published, employee notified — card now works at the door | | |
| PRN-14 | Card cannot activate without being dispatched | Attempt to move a card straight to ACTIVE from PRINTED via a direct API call | Rejected: `InvalidStateTransitionException` | | |
| PRN-15 | Production reports | Open Print → Reports | Reprint rate by department and daily throughput both render with correct numbers | | |
| PRN-16 | Export reports to CSV | Click "Export CSV" on both reports | Downloads open correctly in Excel; a department/date containing a comma or quote is escaped properly | | |
| PRN-17 | Print dashboard tiles | View print landing page | Queued / In progress / Printed today / Reprint rate tiles match direct counts | | |

*Automated coverage:* `PrintJobTest`, `DispatchRecordTest` (all the transition and cancellability rules above).

---

## 6. Module 5 — Visitor & Temporary Pass Management

| ID | Scenario | Steps | Expected Result | Actual | Pass/Fail |
|---|---|---|---|---|---|
| VIS-01 | Register a visitor | Register against an active host employee | Visitor created with a unique code | | |
| VIS-02 | Register against an inactive host | Try to register with an exited employee as host | Rejected: HOST_NOT_ACTIVE | | |
| VIS-03 | Issue a pass | Issue a pass with a validity window and an active access level | Pass created (ISSUED), QR generated | | |
| VIS-04 | Issue a second live pass | Try to issue another pass while one is still live (ISSUED/ACTIVE/SUSPENDED) for the same visitor | Rejected: PASS_ALREADY_LIVE | | |
| VIS-05 | Issue with an inactive level | Try to issue a pass against a deactivated access level | Rejected: LEVEL_INACTIVE | | |
| VIS-06 | Check in | Check in a visitor to a permitted area | Visit log opens; pass ISSUED → ACTIVE on first entry; visitor appears on the on-site board | | |
| VIS-07 | Check in to a forbidden area | Check in to an area the pass's level does not permit | Rejected: AREA_NOT_PERMITTED | | |
| VIS-08 | Check in outside the validity window | Try to check in before `validFrom` or after `validUntil` | Rejected with the specific reason (not yet valid / expired) | | |
| VIS-09 | Double check-in | Check in a visitor already on site | Rejected: ALREADY_ON_SITE | | |
| VIS-10 | Check out | Check out a checked-in visitor | Visit log closes; visitor disappears from the on-site board | | |
| VIS-11 | Extend a live pass | Extend `validUntil` further into the future | New window recorded; audit entry captures both the old and new `validUntil` and the reason | | |
| VIS-12 | Extend an expired pass | Extend a pass that has already lapsed to EXPIRED, with a new end time in the future | Pass reopens: status → **ACTIVE** again (not left EXPIRED) | | |
| VIS-13 | Extend a closed pass | Try to extend a CANCELLED or RETURNED pass | Rejected: PASS_CLOSED | | |
| VIS-14 | Shorten a pass to before now | Try to set a new `validUntil` that is before `validFrom` | Rejected: INVALID_WINDOW | | |
| VIS-15 | Suspend / reinstate | Suspend an active pass, then reinstate it | Suspended pass denies entry even mid-window; reinstated pass works again | | |
| VIS-16 | Cancel without a reason | Try to cancel with a blank reason | Rejected | | |
| VIS-17 | Cancel with a reason | Cancel with a real reason | Status → CANCELLED, reason recorded | | |
| VIS-18 | Automatic expiry sweep | Issue a pass with `validUntil` in the near past, wait for the scheduled sweep (or trigger it), take no manual action | Pass flips ISSUED/ACTIVE → EXPIRED on its own; any open visit log auto-closes with "Auto-closed on pass expiry" | | |
| VIS-19 | Security does not depend on the sweep | Issue a pass that has technically lapsed but the sweep has not run yet; attempt entry | Denied anyway — the door checks the live window, not the stored status | | |
| VIS-20 | Host notified before expiry | Issue a pass expiring in ~30 minutes, wait for the notification sweep | The **host** (not the visitor) receives a "pass expiring" notification exactly once | | |
| VIS-21 | Delete a visitor with history | Try to delete a visitor who has had at least one pass | Soft-deleted (flagged), not removed — visit history stays intact | | |
| VIS-22 | Delete a visitor with no history | Delete a visitor with zero passes issued | Hard-deleted | | |
| VIS-23 | On-site board accuracy | Check several visitors in and out in sequence, refresh the board each time | Board always matches exactly who currently has an open visit log | | |
| VIS-24 | Daily visitor report | Open the daily visitor report (and its CSV export) | Totals, distinct visitors, contractor count and average time on site all reconcile against the visit logs | | |
| VIS-25 | Security dashboard tiles | View security landing page | On site now / Open alerts / Denied today / Expiring within the hour tiles match direct counts | | |

*Automated coverage:* `VisitorPassTest` (window boundaries — including the exact-instant edge cases — suspension, cancellation, reopening-on-extension).

---

## 7. Access Decision Engine — Entry Point Simulator

| ID | Scenario | Steps | Expected Result | Actual | Pass/Fail |
|---|---|---|---|---|---|
| ENT-01 | Grant — valid employee card | Present an ACTIVE card's serial at a permitted area | GRANTED, holder + area shown, log entry written | | |
| ENT-02 | Grant — valid visitor pass | Present a live pass number at a permitted area | GRANTED | | |
| ENT-03 | Deny — unknown credential | Present a serial/pass number that has never existed | DENIED — "Credential not recognised"; still logged | | |
| ENT-04 | Deny — unknown area | Present a valid credential against a nonexistent area code | DENIED — "Area not recognised" | | |
| ENT-05 | Deny — card not active | Present a card still in GENERATED/PRINTED/DISPATCHED (not yet activated) | DENIED — "Card is not active" | | |
| ENT-06 | Deny — card blacklisted | Blacklist a card, then present it | DENIED — "Card is blacklisted"; takes priority over any other denial reason that would also apply | | |
| ENT-07 | Deny — visitor blacklisted | Blacklist a visitor, then present their pass | DENIED — "Visitor is blacklisted" | | |
| ENT-08 | Deny — employee not active | Present an active card belonging to an exited employee | DENIED — "Employee no longer employed" | | |
| ENT-09 | Deny — no access level | Present a card with no access level assigned | DENIED — "No access level assigned" | | |
| ENT-10 | Deny — area not permitted | Present a valid card/pass at an area its level does not grant | DENIED — "...does not permit this area" | | |
| ENT-11 | Deny — area inactive | Deactivate an area, then present a credential that would otherwise be granted there | DENIED — "Area is closed" | | |
| ENT-12 | Deny — pass not yet valid | Present a pass before its `validFrom` | DENIED — "Pass is not valid yet" | | |
| ENT-13 | Deny — pass expired | Present a pass after its `validUntil` | DENIED — "Pass has expired" | | |
| ENT-14 | Deny — pass suspended | Suspend a pass mid-window, then present it | DENIED — "Pass is not active" | | |
| ENT-15 | Repeated denial → alert | Present the same denied credential several times in a short window | A security alert is raised (REPEATED_DENIAL); appears in the open-alerts queue and dashboard tile | | |
| ENT-16 | Blacklist takes effect immediately | Blacklist a currently-valid card mid-session, present it again with no restart | Denied immediately — no cache, no restart required | | |
| ENT-17 | Release from blacklist | Release a blacklisted card, present it again | Access evaluated normally again (granted if otherwise valid) | | |
| ENT-18 | View access log | Open the access log viewer, filter by credential/area/decision/date | Results match the filters exactly | | |
| ENT-19 | Denials-by-reason report | Open the denials report | Grouped counts match the access log | | |
| ENT-20 | Both credential types share one entry point | Confirm the simulator UI and API never branch on credential type before calling evaluate | One call handles both; the only type-specific code is which strategy is selected internally | | |

*Automated coverage:* `EmployeeCardStrategyTest` and `VisitorPassStrategyTest` now cover **every** `DenialReason` value applicable to each credential type (9 and 9 scenarios respectively), plus `AccessDecisionServiceTest` for strategy dispatch and the loud failure when no strategy is registered.

---

## 8. Notifications, Dashboards, Audit & Reports

| ID | Scenario | Steps | Expected Result | Actual | Pass/Fail |
|---|---|---|---|---|---|
| SYS-01 | Approval notification | Approve an employee's request | Employee gets a notification linking to the request | | |
| SYS-02 | Rejection notification carries the reason | Reject a request with a specific reason | Notification message **is** the reason, not a generic "rejected" | | |
| SYS-03 | Card activation notification | Complete a handover | Employee notified their card is active | | |
| SYS-04 | No notification on rollback | Force a failure inside a transaction that would otherwise notify (e.g. a concurrent conflict) | No notification is created — notifications only fire `AFTER_COMMIT` | | |
| SYS-05 | Unread badge count | Trigger a notification, check the bell icon | Badge count increments; `aria-label` announces "Notifications, N unread" | | |
| SYS-06 | Mark one read / mark all read | Open the bell, click a notification, then "Mark all read" | Read notifications lose the unread styling; badge count drops accordingly | | |
| SYS-07 | Six dashboards show live numbers | Visit each of the six role landing pages | Every tile matches a direct count for that role's data | | |
| SYS-08 | Dashboard tiles are clickable | Click a nonzero tile (e.g. HR's "Overdue") | Navigates to the corresponding filtered list, not just a static number | | |
| SYS-09 | Audit trail completeness | Perform one action from each module (create request, approve, reject, generate card, revoke, print, QC fail, dispatch, register visitor, issue pass, extend, cancel, blacklist) | Every action produces an audit row with the real acting username | | |
| SYS-10 | Sharper audit actions | Check the audit log after an approve/reject/revoke | Action column shows **APPROVE**/**REJECT**/**REVOKE** specifically, not generic STATUS_CHANGE | | |
| SYS-11 | Audit viewer is admin-only | Try to open the audit log as a non-admin role (including a direct API call) | 403 | | |
| SYS-12 | Audit log filtering | Filter the audit log by entity, action, username and date range | Results narrow correctly on each filter, individually and combined | | |
| SYS-13 | CSV export opens correctly | Export the reprint-rate, throughput and daily-visitor reports | All three open in Excel without mangled characters (UTF-8 BOM present) | | |
| SYS-14 | CSV formula-injection guard | Export a report where a value would start with `=`, `+`, `-` or `@` (e.g. a department or visitor name) | The value is prefixed so Excel treats it as text, never executes it as a formula | | |

---

## 9. Cross-cutting / Non-functional

| ID | Scenario | Steps | Expected Result | Actual | Pass/Fail |
|---|---|---|---|---|---|
| NFR-01 | Keyboard-only journey | Unplug the mouse: log in, create a request, submit, log in as HR, approve | Entire journey completable with keyboard alone, focus ring visible throughout | | |
| NFR-02 | Greyscale check | Set the display to greyscale (or a colour-blindness simulator) | Every status badge, the ageing indicator, the on-site board and the entry-simulator result remain distinguishable by text/shape, not colour alone | | |
| NFR-03 | 200% zoom | Zoom every screen to 200% | No unintended clipping or horizontal scroll (the permission matrix is the one expected exception) | | |
| NFR-04 | Network failure handling | Simulate a dropped connection while a list is loading | A handled error state with a retry button appears, never a blank screen | | |
| NFR-05 | Empty states | View a list with zero rows (e.g. a brand-new department's card list) | A real empty state with explanatory copy, not a blank table | | |
| NFR-06 | Pagination | Page through a list with more rows than one page | Page controls work; page state resets correctly when filters change | | |
| NFR-07 | Clean checkout | Clone the repo fresh, run the documented setup, run `mvnw clean test` | Backend starts, migrations apply cleanly, all tests pass with one command | | |
| NFR-08 | Restart from a clean database | Drop and rebuild the database, restart the backend | No feature depends on accumulated local state; the demo dataset reproduces the same starting point every time | | |

---

## Summary

| Section | Cases | Automated unit tests backing it |
|---|---|---|
| 0. Auth | 9 | — (manual only; no auth-layer unit tests in this suite) |
| 1. Card Requests | 17 | `CardRequestTest` (8 tests) |
| 2. Approvals | 16 | `ApprovalTest` (6 tests) |
| 3. Access Configuration | 19 | `AccessLevelTest` (5), `CardAccessAssignmentTest` (2) |
| 4. Card Generation | 13 | `IdCardTest` (8), `CredentialPayloadFactoryTest` (6), `SequenceGeneratorTest` (3) |
| 5. Print & Dispatch | 17 | `PrintJobTest` (9), `DispatchRecordTest` (5) |
| 6. Visitor & Passes | 25 | `VisitorPassTest` (14) |
| 7. Access Engine | 20 | `EmployeeCardStrategyTest` (9), `VisitorPassStrategyTest` (9), `AccessDecisionServiceTest` (2), `AccessDecisionResultTest` (2) |
| 8. Notifications/Audit/Reports | 14 | `DenialReasonTest` (1), `CardStatusTest`/`RequestStatusTest` (state-machine completeness underneath) |
| 9. Non-functional | 8 | — (manual only) |
| **Total** | **158 manual cases** | **98 automated tests** |

**Known gap, disclosed honestly:** every automated test above is a pure unit
test — mocked repositories, no Spring context, no database (this codebase
has no H2/Testcontainers dependency and this session has no live SQL Server
instance to test against). Repository-level and full end-to-end coverage
exists only as the manual cases in this document. If real
`@DataJpaTest`/integration coverage is added later, it belongs against the
`accessone_test` schema mentioned in the original project plan.
