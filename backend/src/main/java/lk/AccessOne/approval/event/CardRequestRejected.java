package lk.AccessOne.approval.event;

import lk.AccessOne.shared.event.DomainEvent;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

public record CardRequestRejected(
        Long requestId, Long employeeId, String reason,
        LocalDateTime occurredAt) implements DomainEvent {

    public CardRequestRejected(Long requestId, Long employeeId, String reason) {
        this(requestId, employeeId, reason, LocalDateTime.now(ZoneOffset.UTC));
    }
}
