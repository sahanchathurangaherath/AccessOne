package lk.AccessOne.card.event;

import lk.AccessOne.shared.event.DomainEvent;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

/** Subscribed by notifications; a candidate is the entry decision engine's alerting too. */
public record CardRevoked(
        Long cardId, Long employeeId, String reason,
        LocalDateTime occurredAt) implements DomainEvent {

    public CardRevoked(Long cardId, Long employeeId, String reason) {
        this(cardId, employeeId, reason, LocalDateTime.now(ZoneOffset.UTC));
    }
}
