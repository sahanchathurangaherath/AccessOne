package lk.AccessOne.visitor.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lk.AccessOne.access.domain.AccessLevel;
import lk.AccessOne.access.domain.Area;
import lk.AccessOne.identity.domain.User;
import lk.AccessOne.organisation.domain.Employee;
import lk.AccessOne.shared.domain.AuditableEntity;
import lk.AccessOne.shared.enums.PassStatus;
import lk.AccessOne.shared.error.BusinessRuleException;
import lk.AccessOne.shared.error.InvalidStateTransitionException;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

/**
 * The deliberate contrast to {@code IdCard}: a card never expires, a pass
 * always does. {@code chk_passes_window} requires a validity window that
 * {@code id_cards} has no equivalent column for at all.
 */
@Entity
@Table(name = "visitor_passes")
public class VisitorPass extends AuditableEntity {

    @Column(name = "pass_no", nullable = false, length = 20, unique = true)
    private String passNo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "visitor_id", nullable = false)
    private Visitor visitor;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "host_employee_id", nullable = false)
    private Employee hostEmployee;

    /** NOT NULL -- a pass with unspecified permissions is not a credential. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "access_level_id", nullable = false)
    private AccessLevel accessLevel;

    @Column(name = "purpose", nullable = false, length = 255)
    private String purpose;

    @Column(name = "valid_from", nullable = false)
    private LocalDateTime validFrom;

    @Column(name = "valid_until", nullable = false)
    private LocalDateTime validUntil;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 15)
    private PassStatus status = PassStatus.ISSUED;

    @Column(name = "qr_payload", nullable = false, length = 255, unique = true)
    private String qrPayload;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "issued_by", nullable = false)
    private User issuedBy;

    @Column(name = "issued_at", nullable = false)
    private LocalDateTime issuedAt;

    @Column(name = "cancelled_reason", length = 255)
    private String cancelledReason;

    protected VisitorPass() { }

    public static VisitorPass issue(String passNo, Visitor visitor, Employee host,
                                     AccessLevel level, String purpose,
                                     LocalDateTime from, LocalDateTime until,
                                     String qrPayload, User issuer) {
        if (!until.isAfter(from)) {
            throw new BusinessRuleException("INVALID_WINDOW", "The pass must end after it starts.");
        }
        VisitorPass pass = new VisitorPass();
        pass.passNo = passNo;
        pass.visitor = visitor;
        pass.hostEmployee = host;
        pass.accessLevel = level;
        pass.purpose = purpose;
        pass.validFrom = from;
        pass.validUntil = until;
        pass.qrPayload = qrPayload;
        pass.issuedBy = issuer;
        pass.issuedAt = LocalDateTime.now(ZoneOffset.UTC);
        pass.status = PassStatus.ISSUED;
        return pass;
    }

    // ---------- the security-critical method ----------

    /**
     * THE method of this module. Phase 12's decision engine calls it on
     * every entry attempt by a visitor.
     *
     * It checks the window itself rather than trusting the stored status.
     * The scheduled sweep keeps the status tidy for reporting, but
     * security must never depend on a job having run -- a stopped
     * scheduler would otherwise keep granting access on expired passes.
     */
    public boolean isUsableAt(LocalDateTime moment) {
        return status.allowsEntry()
            && !moment.isBefore(validFrom)
            && !moment.isAfter(validUntil);
    }

    public String denialReasonAt(LocalDateTime moment) {
        if (!status.allowsEntry())      return "Pass is " + status.name().toLowerCase() + ".";
        if (moment.isBefore(validFrom)) return "Pass is not valid yet.";
        if (moment.isAfter(validUntil)) return "Pass expired at " + validUntil + ".";
        return null;
    }

    /** Delegates to Module 3 -- one definition of what a level permits. */
    public boolean permits(Area area) {
        return accessLevel.permits(area);
    }

    // ---------- lifecycle ----------

    public void markActive()   { move(PassStatus.ACTIVE); }
    public void markExpired()  { move(PassStatus.EXPIRED); }
    public void suspend()      { move(PassStatus.SUSPENDED); }
    public void reinstate()    { move(PassStatus.ACTIVE); }
    public void markReturned() { move(PassStatus.RETURNED); }

    /** chk_passes_cancel: CANCELLED requires a reason. */
    public void cancel(String reason) {
        if (reason == null || reason.isBlank()) {
            throw new BusinessRuleException("REASON_REQUIRED", "Say why the pass is being cancelled.");
        }
        move(PassStatus.CANCELLED);
        this.cancelledReason = reason.trim();
    }

    /** Extending or shortening. chk_passes_window still applies. */
    public void changeWindow(LocalDateTime newUntil) {
        if (!newUntil.isAfter(validFrom)) {
            throw new BusinessRuleException("INVALID_WINDOW", "The new end time must be after the start.");
        }
        if (status == PassStatus.CANCELLED || status == PassStatus.RETURNED) {
            throw new BusinessRuleException("PASS_CLOSED", "A closed pass cannot be extended.");
        }
        this.validUntil = newUntil;
        if (status == PassStatus.EXPIRED && newUntil.isAfter(now())) {
            this.status = PassStatus.ACTIVE;      // reopened by the extension
        }
    }

    private void move(PassStatus target) {
        if (!status.canTransitionTo(target)) {
            throw new InvalidStateTransitionException("Visitor pass", status, target);
        }
        this.status = target;
    }

    private LocalDateTime now() { return LocalDateTime.now(ZoneOffset.UTC); }

    public String getPassNo()              { return passNo; }
    public Visitor getVisitor()            { return visitor; }
    public Employee getHostEmployee()      { return hostEmployee; }
    public AccessLevel getAccessLevel()    { return accessLevel; }
    public String getPurpose()             { return purpose; }
    public LocalDateTime getValidFrom()    { return validFrom; }
    public LocalDateTime getValidUntil()   { return validUntil; }
    public PassStatus getStatus()          { return status; }
    public String getQrPayload()           { return qrPayload; }
    public User getIssuedBy()              { return issuedBy; }
    public LocalDateTime getIssuedAt()     { return issuedAt; }
    public String getCancelledReason()     { return cancelledReason; }
}
