package lk.AccessOne.entry.event;

import lk.AccessOne.shared.enums.AlertSeverity;

/** Phase 13's notification listener subscribes to this -- security officers, not one employee. */
public record SecurityAlertRaised(Long alertId, AlertSeverity severity, String message) { }
