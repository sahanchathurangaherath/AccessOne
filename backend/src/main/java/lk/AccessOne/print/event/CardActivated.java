package lk.AccessOne.print.event;

import lk.AccessOne.shared.event.DomainEvent;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

/** Published at handover -- the moment the card becomes usable. Subscribed by notifications. */
public record CardActivated(
        Long cardId, String cardSerial, Long receiverId,
        LocalDateTime occurredAt) implements DomainEvent {

    public CardActivated(Long cardId, String cardSerial, Long receiverId) {
        this(cardId, cardSerial, receiverId, LocalDateTime.now(ZoneOffset.UTC));
    }
}
