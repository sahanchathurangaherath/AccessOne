package lk.AccessOne.cardrequest.event;

import lk.AccessOne.shared.event.DomainEvent;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

/** Module 1 publishes this and does not need to know who listens. */
public record CardRequestSubmitted(
        Long requestId, Long employeeId,
        LocalDateTime occurredAt) implements DomainEvent {

    public CardRequestSubmitted(Long requestId, Long employeeId) {
        this(requestId, employeeId, LocalDateTime.now(ZoneOffset.UTC));
    }
}
