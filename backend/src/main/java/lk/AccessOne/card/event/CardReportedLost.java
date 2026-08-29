package lk.AccessOne.card.event;

import lk.AccessOne.shared.event.DomainEvent;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

/** A candidate subscriber is a notifications module, to alert security. */
public record CardReportedLost(
        Long cardId, Long employeeId,
        LocalDateTime occurredAt) implements DomainEvent {

    public CardReportedLost(Long cardId, Long employeeId) {
        this(cardId, employeeId, LocalDateTime.now(ZoneOffset.UTC));
    }
}
