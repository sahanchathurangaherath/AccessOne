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

**Listened for by:** *(nobody yet — card generation is not built.)* When it
is, subscribe with a plain `@EventListener` (or `@TransactionalEventListener`
if card generation should only start after the approval genuinely commits)
and use `accessLevelId` to decide what access the generated card carries.
`accessLevelId` is nullable — a request can be approved with no specific
access level requested.

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

**Listened for by:** *(nobody yet — card revocation is not built.)* When it
is, subscribe with a plain `@EventListener` and revoke every active
`id_cards` row for `employeeId`. Until then, publishing this event with no
listener is harmless — that is deliberate, not a gap to fix.

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
