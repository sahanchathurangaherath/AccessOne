package lk.AccessOne.card.event;

import lk.AccessOne.shared.event.DomainEvent;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

/** Subscribed by notifications. */
public record CardGenerated(
        Long cardId, Long employeeId, String cardSerial,
        LocalDateTime occurredAt) implements DomainEvent {

    public CardGenerated(Long cardId, Long employeeId, String cardSerial) {
        this(cardId, employeeId, cardSerial, LocalDateTime.now(ZoneOffset.UTC));
    }
}
