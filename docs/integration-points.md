# Integration points

Events published by one module for another to listen for. A module that
publishes one of these does not know or need to know who is listening — that
is the whole point of using `ApplicationEventPublisher` instead of a direct
call. Recorded here so a module built later knows what is already available
to subscribe to, without reading every other module's source.

## `lk.AccessOne.cardrequest.event.CardRequestSubmitted`

```java
public record CardRequestSubmitted(Long requestId, Long employeeId) { }
```

**Published by:** `CardRequestService.submit()`, after the request's own
status change is committed to `SUBMITTED`.

**Listened for by:** `lk.AccessOne.approval.service.RequestSubmittedListener`
— opens (or reopens, on a resubmission) the `approvals` row for the request.
Runs as a plain `@EventListener` inside the submitting transaction, so the
request and its approval row are created together or not at all.

## `lk.AccessOne.approval.event.CardRequestApproved`

```java
public record CardRequestApproved(Long requestId, Long employeeId, Long accessLevelId) { }
```

**Published by:** `ApprovalService.approve()`, after both the approval and
the card request have moved to their concluded states and been audited.

**Listened for by:** `lk.AccessOne.card.service.CardGenerationListener` --
generates the card in the same transaction as the approval. `accessLevelId`
is not read directly off the event; the listener re-reads the request and
assigns whatever access level it carries (nullable -- a request can be
approved with no specific access level requested).

## `lk.AccessOne.approval.event.CardRequestRejected`

```java
public record CardRequestRejected(Long requestId, Long employeeId, String reason) { }
```

**Published by:** `ApprovalService.reject()`.

**Listened for by:** *(nobody yet.)* A candidate subscriber is a
notifications module, to tell the employee their request was rejected and
why — `reason` is already the same text stored on the `approvals` row.

## `lk.AccessOne.approval.event.EmployeeExited`

```java
public record EmployeeExited(Long employeeId, String reason, LocalDate exitDate) { }
```

**Published by:** `ApprovalService.recordExit()`, after the employee's
`employment_status` is updated and any in-flight card requests
(`SUBMITTED` or `UNDER_VERIFICATION`) are cancelled.

**Listened for by:** `lk.AccessOne.card.service.CardService.on(EmployeeExited)`
— revokes every `ACTIVE` `id_cards` row for `employeeId`, with the reason
prefixed `"Employment ended: "`. Module 2 published this weeks ago with
nothing subscribed; this listener completes the contract without Module 2
changing a line.

## `lk.AccessOne.print.event.CardActivated`

```java
public record CardActivated(Long cardId, String cardSerial, Long receiverId) { }
```

**Published by:** `DispatchService.recordHandover()`, in the same
transaction as `IdCard.activate()`. This is the moment a card actually
becomes usable — not when it was printed, not when it was dispatched.

**Listened for by:** *(nobody yet.)* A candidate subscriber is an employee
notification module, once one exists.

## `lk.AccessOne.print.event.PrintQualityFailed`

```java
public record PrintQualityFailed(Long printJobId, Long cardId, String notes) { }
```

**Published by:** `PrintJobService.recordQualityCheck()`, when the result
is `FAIL`.

**Listened for by:** *(nobody yet.)* A candidate subscriber is a
production-alerts dashboard, once the reprint rate needs watching live
rather than pulled from `/print/reports/reprint-rate`.

## Module 3 provides

This module has no events — everything it offers is called directly,
because the caller needs an answer back (a boolean, a reason, a set of
areas), not a fire-and-forget notification.

- `AccessLevelService.test(levelId, areaId)` — the rule check, with a
  denial reason. Phase 12's access decision engine calls
  `AccessLevel.permits(area)` directly rather than going through the
  service, since it runs on every entry attempt and needs no DTO mapping
  in between.
- `AccessLevelRepository.findWithAreas(id)` — a level with its permitted
  areas already fetched, for the decision engine or anything else that
  needs to call `permits()` without a second query.
- `CardAccessAssignmentRepository.findCurrentForCard(cardId)` — the level
  a card holds right now. Backed by `idx_caa_card_current`, a filtered
  covering index — this is the query Phase 12 runs on every entry
  attempt, so it must never table-scan.
- `PUT /api/v1/config/cards/{cardId}/access-level` — Module 4 calls this
  once, right after generating a card, to assign its initial level.
- `AccessLevel.permits(Area area)` — pure, side-effect free, returns
  `false` for a deactivated level or a deactivated area. This is the one
  method the phrase "access decision engine" in Phase 12 actually means.

## Module 3 expects

Nothing upstream. It depends only on `Department` and `Employee`
(already mapped since Phase 2) and the Phase 6 reuse layer, so it was
built and tested in isolation before either Module 2 or Module 4 existed.

## Module 4 provides

- `CardService.verifyBySerial(serial)` — Phase 12's lookup. Returns
  `found=false` rather than throwing for an unrecognised serial, because
  Phase 12 needs to log that as a denied attempt, not an error.
- `IdCard.isUsable()` — true only when `ACTIVE`.
- `IdCardRepository.findBySerialWithEmployee(serial)` — one query, employee
  and department already fetched, for the decision engine's hot path.
- `GET /api/v1/cards/{id}/pdf`, `/qr`, `/photo` — the printable card, its QR
  alone, and its photo, each as its own endpoint so none of them requires
  pulling the others along.
- Events published: `CardGenerated`, `CardReportedLost`, `CardRevoked` —
  nobody subscribes to these yet, which is fine; see `EmployeeExited` above
  for what "nobody subscribes yet" looks like once a listener does exist.

## Module 4 consumes

- `CardRequestApproved` (Module 2) — triggers generation, in the same
  transaction as the approval.
- `EmployeeExited` (Module 2) — revokes usable cards.
- `AccessLevelService.assign(cardId, levelId, remarks)` (Module 3) — called
  once, right after generation, to assign the card's initial level. Called
  directly as a Spring bean, not over HTTP — Module 4 needs the assignment
  to happen in the same transaction as card creation, and a second query
  round-trip would put that outside the boundary.

## Module 5 provides

- `VisitorPass.isUsableAt(moment)` — Phase 12's check for a visitor pass.
  Checks the status *and* the validity window itself; never trusts the
  stored status alone, because the scheduled sweep that keeps status
  accurate can be stopped without anyone noticing.
- `VisitorPass.denialReasonAt(moment)` — the specific reason, for the
  access log.
- `VisitorPass.permits(area)` — delegates to `AccessLevel.permits()`
  (Module 3), the same rule cards use.
- `VisitorPassRepository.findByPassNoForDecision(passNo)` — fetch-joins
  the access level *and* its permitted areas. Phase 12 must use this, not
  `findById`, or `permits()` throws `LazyInitializationException` at the
  door.
- `VisitorPassService.verifyByPassNo(passNo)` — returns `found=false` for
  an unrecognised pass rather than throwing, same reasoning as Module 4's
  `verifyBySerial`.

## Module 5 consumes

- `AccessLevel.permits(area)` and `AccessLevelRepository` (Module 3) —
  a pass's `access_level_id` is `NOT NULL`, unlike a card's, so every
  pass has a level to check against from the moment it is issued.
- `QrCodeService.png()` (Module 4) — reused rather than duplicated; a
  visitor pass QR and a card QR are the same kind of thing.
- `/api/v1/config/access-levels` (Module 3) is otherwise `IT_ADMIN`/
  `SYSTEM_ADMIN`-only in `SecurityConfig`. A read-only `GET` carve-out for
  `SECURITY_OFFICER` was added ahead of that rule so the issue-pass form
  can show what a level permits without granting write access to levels
  themselves.

Nothing downstream depends on Module 5 except Phase 12.

## A pre-existing timezone bug, fixed here

Every `LocalDateTime` written through Hibernate was being stored 5:30
*behind* true UTC on this host (Sri Lanka Standard Time, the JVM's
default timezone) and silently corrected back on read — invisible at the
application layer, and invisible to any native query that compares two
stored columns to each other, since the offset cancels. It only surfaces
where a native query compares a stored column against `SYSUTCDATETIME()`
directly, which is exactly what `v_current_visitors` (pre-existing, Phase
1/3) and `sp_expire_visitor_passes` do — this module's on-site board was
the first place in the codebase that made it visible, showing visitors
as hundreds of minutes overdue seconds after checking in.

Fixed in `AccessOneApplication.main()` with `TimeZone.setDefault(UTC)`
before the Spring context starts. New writes are correct; rows written
before this fix keep their -5:30 skew unless corrected separately. The
Java-side security checks (`isUsableAt`, the scheduled expiry sweep) were
never affected — they run entirely in the JVM and compare Hibernate-read
values against each other, not against `SYSUTCDATETIME()`.

## Module 6 provides

- `CardActivated` event — published at handover. A future notification
  module subscribes to this, not to anything in Module 4.
- `PrintJobRepository.existsByCardId(cardId)` — `CardService.hasPrintJob()`
  (Module 4's void guard, `ALREADY_IN_PRODUCTION`) now calls this directly
  rather than the native `COUNT(*)` query it used before Module 6 existed.
- Card statuses reached only through this module: `QUEUED_FOR_PRINT`,
  `PRINTED`, `DISPATCHED`, `ACTIVE`.

## Module 6 consumes

- `IdCard.moveTo()` and `IdCard.activate()` (Module 4). Never sets the
  card status directly — the transition rules live in `CardStatus` alone.
- `CardService.pdf(cardId)` (Module 4) for the print-ready file, exposed
  at `GET /api/v1/print/jobs/{id}/card-file`.

## CardStatus transitions this module needs

```
GENERATED        -> QUEUED_FOR_PRINT   (queue a job)
QUEUED_FOR_PRINT -> PRINTED            (job complete)
QUEUED_FOR_PRINT -> GENERATED          (job cancelled)
PRINTED          -> QUEUED_FOR_PRINT   (reprint after QC failure)
PRINTED          -> DISPATCHED         (dispatch)
DISPATCHED       -> ACTIVE             (handover -- the activation)
```

`QUEUED_FOR_PRINT -> GENERATED` did not exist before this module — Phase 9
had no path back out of the print queue, since nothing before Module 6
needed one. Added to `CardStatus.ALLOWED` rather than worked around.

## Adding a listener

A new module subscribes without changing the publisher:

```java
@Component
public class SomeListener {
    @EventListener
    @Transactional
    public void on(CardRequestApproved event) {
        // ...
    }
}
```

Use `@EventListener` (joins the publisher's transaction — all-or-nothing
with the change that triggered it) unless the listener should only act after
the change has definitely committed, in which case use
`@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)` with
`@Transactional(propagation = Propagation.REQUIRES_NEW)` — the same pattern
`AuditEventListener` uses for the audit trail, where a change that gets
rolled back should never produce an audit row.
