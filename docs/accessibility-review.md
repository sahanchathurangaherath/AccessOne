# Accessibility review — Phase 13

**Method:** static code review (component source, not a live browser session). This
session could not drive an actual browser, so the items below are split into
**verified by inspection** and **needs a live pass by a human** — do not present the
second group as done without actually running the checks.

## Verified by inspection

**Colour is not the only signal.**
- `StatusBadge` ([status-badge.tsx](../frontend/src/components/status-badge.tsx)) always
  renders the status as text (`ACTIVE` → "active", etc.), never a bare colour swatch. The
  map now also covers `APPROVE`/`REJECT`/`REVOKE` (added this phase) so audit-log rows
  don't fall through to the neutral grey by accident.
- The Entry Point Simulator result ([security/access/page.tsx](../frontend/src/app/(app)/security/access/page.tsx))
  shows the literal word `GRANTED`/`DENIED` at 36px alongside colour, plus a written
  denial reason — never colour alone.
- The ageing indicator, on-site board and permission matrix all pair colour with a text
  label or numeric value (spot-checked; not exhaustively re-verified this pass).

**Live regions.**
- The Entry Point Simulator result panel has `aria-live="polite" aria-atomic="true"`
  ([security/access/page.tsx:98](../frontend/src/app/(app)/security/access/page.tsx)), so
  a screen reader announces the decision without the user needing to find it.
- The notification bell badge count is exposed via `aria-label` on the trigger button
  (`Notifications, N unread`), which a screen reader reads on focus. It is **not** wrapped
  in an `aria-live` region, so a background count change (the 60s poll) is not announced
  proactively — only on next interaction with the bell. Minor; worth an `aria-live="polite"`
  wrapper if this becomes a real finding in a live test.

**Labels and icon-only controls.**
- Form inputs go through the shared `Field` component, which pairs every input with a
  `<label>`.
- Icon-only buttons checked (notification bell, filter tabs) carry `aria-label` or visible
  text; the bell specifically: `aria-label={count > 0 ? "Notifications, N unread" : "Notifications"}`.

**Keyboard reachability (structural, not a live run).**
- Interactive elements are native `<button>`, `<a>`, `<select>`, `<input>` throughout the
  screens read this phase — no `<div onClick>` pattern was found in the files touched.
- `Button` ([ui/button.tsx](../frontend/src/components/ui/button.tsx)) defines an explicit
  `focus-visible:ring` state, so a visible focus ring is a base-styled property, not
  something each screen has to remember to add.

## Needs a live pass (not done in this session)

These require an actual browser and a human, and were **not** performed here — do not
mark them complete without doing them:

- [ ] **Keyboard-only run-through**: unplug the mouse, complete login → new request →
      submit → HR login → approve, confirm focus is visible at every step and nothing is
      unreachable.
- [ ] **Greyscale / colour-blind check**: set the display to greyscale (or use a
      simulator) and re-read every status badge, the ageing indicator, and the entry
      simulator result.
- [ ] **200% zoom**: confirm no clipping and no unintended horizontal scroll (the
      permission matrix is expected to scroll horizontally; nothing else should).
- [ ] **Contrast measurement**: `text-slate` on `bg-paper` is the pair most likely to sit
      near the 4.5:1 boundary — measure it with a real contrast tool against the actual
      rendered colours, not just eyeballed.
- [ ] Full sweep of every screen for the terminology/status-vocabulary table in the Phase
      13 plan (Request/Approve-Reject/Card/Pass/Area/Access level/Handover/Revoke/Deactivate)
      — only the screens touched this phase were checked.

## What changed this phase

- Extended `StatusBadge`'s tone map to cover the three audit actions
  (`APPROVE`/`REJECT`/`REVOKE`) introduced alongside the sharper audit trail, so the new
  audit log viewer doesn't show them as unstyled neutral grey.
- Added `aria-label` values to the new admin dashboard and audit-log filter controls
  (entity, username, action `<select>`), following the existing `Field`/labelled-input
  convention used elsewhere.
