package lk.AccessOne.approval.event;

import lk.AccessOne.shared.event.DomainEvent;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

/** Module 4 listens for this to generate a card. Module 2 does not know or care that it exists. */
public record CardRequestApproved(
        Long requestId, Long employeeId, Long accessLevelId,
        LocalDateTime occurredAt) implements DomainEvent {

    public CardRequestApproved(Long requestId, Long employeeId, Long accessLevelId) {
        this(requestId, employeeId, accessLevelId, LocalDateTime.now(ZoneOffset.UTC));
    }
}
