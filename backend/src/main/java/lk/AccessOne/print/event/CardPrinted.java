package lk.AccessOne.print.event;

import lk.AccessOne.shared.event.DomainEvent;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

/** Published when a card printing job completes successfully. */
public record CardPrinted(
        Long cardId, String cardSerial, Long employeeId,
        LocalDateTime occurredAt) implements DomainEvent {

    public CardPrinted(Long cardId, String cardSerial, Long employeeId) {
        this(cardId, cardSerial, employeeId, LocalDateTime.now(ZoneOffset.UTC));
    }
}
