package lk.AccessOne.entry.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lk.AccessOne.entry.decision.AccessDecisionResult;
import lk.AccessOne.entry.decision.AccessRequest;
import lk.AccessOne.shared.domain.BaseEntity;
import lk.AccessOne.shared.enums.AccessDecision;
import lk.AccessOne.shared.enums.CredentialType;
import lk.AccessOne.shared.enums.Direction;

import java.time.LocalDateTime;

/**
 * access_logs. Extends {@link BaseEntity} rather than {@code AuditableEntity}
 * -- the table is append-only and has no {@code updated_at}. A log row is a
 * record of what happened, never edited afterward.
 */
@Entity
@Table(name = "access_logs")
public class AccessLog extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "credential_type", nullable = false, length = 20)
    private CredentialType credentialType;

    @Column(name = "card_id")         private Long cardId;
    @Column(name = "visitor_pass_id") private Long visitorPassId;
    @Column(name = "area_id")         private Long areaId;

    /**
     * Snapshot columns -- the deliberate denormalisation in this schema.
     *
     * An access log is a historical record of what happened, not a live
     * view of current data. If an area is renamed from "Server Room" to
     * "Data Centre" in 2027, a joined query would rewrite a 2026 log
     * entry to say something that was never true at the time.
     */
    @Column(name = "credential_ref", nullable = false, length = 30)
    private String credentialRef;

    @Column(name = "holder_name", nullable = false, length = 150)
    private String holderName;

    @Column(name = "area_name", nullable = false, length = 120)
    private String areaName;

    @Column(name = "access_time", nullable = false)
    private LocalDateTime accessTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "direction", nullable = false, length = 5)
    private Direction direction;

    @Enumerated(EnumType.STRING)
    @Column(name = "decision", nullable = false, length = 10)
    private AccessDecision decision;

    @Column(name = "denial_reason", length = 60)
    private String denialReason;

    protected AccessLog() { }

    /**
     * Everything comes from the decision, which already carries the
     * snapshots. No reloading, and no chance of the log disagreeing with
     * the decision it records.
     */
    public static AccessLog from(AccessDecisionResult decision, AccessRequest request) {
        AccessLog log = new AccessLog();
        log.credentialType = decision.credentialType();
        log.cardId        = decision.cardId();
        log.visitorPassId = decision.passId();
        log.areaId        = decision.areaId();
        log.credentialRef = truncate(decision.credentialRef(), 30);
        log.holderName    = truncate(decision.holderName(), 150);
        log.areaName      = truncate(decision.areaName(), 120);
        log.accessTime    = request.at();
        log.direction     = request.direction();
        log.decision      = decision.granted() ? AccessDecision.GRANTED : AccessDecision.DENIED;
        log.denialReason  = decision.granted() ? null : decision.denialReason().text();
        return log;
    }

    private static String truncate(String value, int max) {
        if (value == null || value.isBlank()) return "Unknown";
        return value.length() <= max ? value : value.substring(0, max);
    }

    public CredentialType getCredentialType() { return credentialType; }
    public Long getCardId()                   { return cardId; }
    public Long getVisitorPassId()            { return visitorPassId; }
    public Long getAreaId()                   { return areaId; }
    public String getCredentialRef()          { return credentialRef; }
    public String getHolderName()             { return holderName; }
    public String getAreaName()               { return areaName; }
    public LocalDateTime getAccessTime()      { return accessTime; }
    public Direction getDirection()           { return direction; }
    public AccessDecision getDecision()       { return decision; }
    public String getDenialReason()           { return denialReason; }
}
