package lk.AccessOne.entry.event;

import lk.AccessOne.shared.enums.AlertSeverity;
import lk.AccessOne.shared.event.DomainEvent;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

/** The notification listener subscribes to this -- security officers, not one employee. */
public record SecurityAlertRaised(
        Long alertId, AlertSeverity severity, String message,
        LocalDateTime occurredAt) implements DomainEvent {

    public SecurityAlertRaised(Long alertId, AlertSeverity severity, String message) {
        this(alertId, severity, message, LocalDateTime.now(ZoneOffset.UTC));
    }
}
