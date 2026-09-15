package lk.AccessOne.print.event;

import lk.AccessOne.shared.event.DomainEvent;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

/** A candidate subscriber is a production-alerts dashboard once the reprint rate needs watching live. */
public record PrintQualityFailed(
        Long printJobId, Long cardId, String notes,
        LocalDateTime occurredAt) implements DomainEvent {

    public PrintQualityFailed(Long printJobId, Long cardId, String notes) {
        this(printJobId, cardId, notes, LocalDateTime.now(ZoneOffset.UTC));
    }
}
