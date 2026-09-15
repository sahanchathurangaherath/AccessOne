package lk.AccessOne.visitor.event;

import lk.AccessOne.shared.event.DomainEvent;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

/**
 * Notify the host, not the visitor -- the host is the accountable party,
 * the same reasoning that made host_employee_id mandatory when the pass
 * was issued.
 */
public record PassExpiringSoon(
        Long passId, Long hostEmployeeId, String visitorName, LocalDateTime validUntil,
        LocalDateTime occurredAt) implements DomainEvent {

    public PassExpiringSoon(Long passId, Long hostEmployeeId, String visitorName, LocalDateTime validUntil) {
        this(passId, hostEmployeeId, visitorName, validUntil, LocalDateTime.now(ZoneOffset.UTC));
    }
}
