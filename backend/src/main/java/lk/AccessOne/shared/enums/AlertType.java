package lk.AccessOne.shared.enums;

/** Matches security_alerts.alert_type CHECK constraint. */
public enum AlertType {
    REPEATED_DENIAL, BLACKLIST_ATTEMPT, REVOKED_CARD_USE,
    EXPIRED_PASS_USE, RESTRICTED_AREA_ATTEMPT, AFTER_HOURS_ACCESS
}
