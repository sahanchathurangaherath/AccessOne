package lk.AccessOne.approval.event;

import lk.AccessOne.shared.event.DomainEvent;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

/**
 * Module 4 listens for this to revoke the employee's cards.
 *
 * Published in Phase 7 with nothing subscribed; Module 4 added its
 * listener in Phase 9 without this record, or the service that publishes
 * it, changing at all -- the Observer pattern's benefit, demonstrated by
 * the project's own history rather than asserted.
 */
public record EmployeeExited(
        Long employeeId, String reason, LocalDate exitDate,
        LocalDateTime occurredAt) implements DomainEvent {

    public EmployeeExited(Long employeeId, String reason, LocalDate exitDate) {
        this(employeeId, reason, exitDate, LocalDateTime.now(ZoneOffset.UTC));
    }
}
