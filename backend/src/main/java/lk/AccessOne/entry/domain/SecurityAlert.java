package lk.AccessOne.entry.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lk.AccessOne.identity.domain.User;
import lk.AccessOne.shared.domain.BaseEntity;
import lk.AccessOne.shared.enums.AlertSeverity;
import lk.AccessOne.shared.enums.AlertStatus;
import lk.AccessOne.shared.enums.AlertType;
import lk.AccessOne.shared.error.BusinessRuleException;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

/**
 * security_alerts. Extends {@link BaseEntity} -- {@code created_at} exists,
 * {@code updated_at} does not; an alert's lifecycle is tracked by
 * {@code acknowledged_at}, not a revision timestamp.
 */
@Entity
@Table(name = "security_alerts")
public class SecurityAlert extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "alert_type", nullable = false, length = 30)
    private AlertType alertType;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", nullable = false, length = 10)
    private AlertSeverity severity = AlertSeverity.MEDIUM;

    @Column(name = "message", nullable = false, length = 500)
    private String message;

    @Column(name = "related_access_log_id")
    private Long relatedAccessLogId;

    @Column(name = "area_id")
    private Long areaId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 15)
    private AlertStatus status = AlertStatus.OPEN;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "acknowledged_by")
    private User acknowledgedBy;

    @Column(name = "acknowledged_at")
    private LocalDateTime acknowledgedAt;

    protected SecurityAlert() { }

    public static SecurityAlert raise(AlertType type, AlertSeverity severity, String message,
                                       Long relatedAccessLogId, Long areaId) {
        SecurityAlert alert = new SecurityAlert();
        alert.alertType = type;
        alert.severity = severity;
        alert.message = message;
        alert.relatedAccessLogId = relatedAccessLogId;
        alert.areaId = areaId;
        alert.status = AlertStatus.OPEN;
        return alert;
    }

    /** chk_alerts_ack: anything other than OPEN requires both fields, set together. */
    private void moveWithAck(AlertStatus target, User by) {
        if (status != AlertStatus.OPEN) {
            throw new BusinessRuleException("ALREADY_HANDLED",
                "This alert has already been acknowledged.");
        }
        this.status = target;
        this.acknowledgedBy = by;
        this.acknowledgedAt = LocalDateTime.now(ZoneOffset.UTC);
    }

    public void acknowledge(User by) { moveWithAck(AlertStatus.ACKNOWLEDGED, by); }
    public void resolve(User by)     { moveWithAck(AlertStatus.RESOLVED, by); }
    public void dismiss(User by)     { moveWithAck(AlertStatus.DISMISSED, by); }

    public AlertType getAlertType()          { return alertType; }
    public AlertSeverity getSeverity()       { return severity; }
    public String getMessage()               { return message; }
    public Long getRelatedAccessLogId()      { return relatedAccessLogId; }
    public Long getAreaId()                  { return areaId; }
    public AlertStatus getStatus()           { return status; }
    public User getAcknowledgedBy()          { return acknowledgedBy; }
    public LocalDateTime getAcknowledgedAt() { return acknowledgedAt; }
}
