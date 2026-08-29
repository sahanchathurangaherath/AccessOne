package lk.AccessOne.shared.enums;

/** Matches notifications.notification_type CHECK constraint. */
public enum NotificationType {
    REQUEST_SUBMITTED, REQUEST_APPROVED, REQUEST_REJECTED,
    CARD_GENERATED, CARD_READY, CARD_ACTIVATED, CARD_REVOKED,
    PASS_EXPIRING, SECURITY_ALERT
}
