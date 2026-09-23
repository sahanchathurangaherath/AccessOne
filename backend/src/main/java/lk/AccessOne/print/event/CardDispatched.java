package lk.AccessOne.print.event;

import lk.AccessOne.shared.enums.DispatchMethod;
import lk.AccessOne.shared.event.DomainEvent;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

/** Published when a printed card is dispatched for delivery or collection. */
public record CardDispatched(
        Long cardId, String cardSerial, Long employeeId,
        DispatchMethod dispatchMethod, String remarks,
        LocalDateTime occurredAt) implements DomainEvent {

    public CardDispatched(Long cardId, String cardSerial, Long employeeId, DispatchMethod dispatchMethod, String remarks) {
        this(cardId, cardSerial, employeeId, dispatchMethod, remarks, LocalDateTime.now(ZoneOffset.UTC));
    }
}
