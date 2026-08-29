package lk.AccessOne.approval.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lk.AccessOne.cardrequest.domain.CardRequest;
import lk.AccessOne.identity.domain.User;
import lk.AccessOne.shared.domain.AuditableEntity;
import lk.AccessOne.shared.enums.Decision;
import lk.AccessOne.shared.error.BusinessRuleException;
import lk.AccessOne.shared.error.InvalidStateTransitionException;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "approvals")
public class Approval extends AuditableEntity {

    /**
     * UNIQUE on card_request_id in the schema. That constraint is what
     * makes this 1:1 -- a request can never accumulate two decisions.
     */
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "card_request_id", nullable = false, unique = true)
    private CardRequest request;

    @Enumerated(EnumType.STRING)
    @Column(name = "decision", nullable = false, length = 20)
    private Decision decision = Decision.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by")
    private User verifiedBy;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "decided_by")
    private User decidedBy;

    @Column(name = "decided_at")
    private LocalDateTime decidedAt;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @OneToMany(mappedBy = "approval", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ApprovalComment> comments = new ArrayList<>();

    protected Approval() { }

    public static Approval openFor(CardRequest request) {
        Approval approval = new Approval();
        approval.request = request;
        approval.decision = Decision.PENDING;
        return approval;
    }

    // ---------- behaviour ----------

    public void verify(User verifier) {
        move(Decision.VERIFIED);
        this.verifiedBy = verifier;
        this.verifiedAt = now();
    }

    public void approve(User decider) {
        move(Decision.APPROVED);
        conclude(decider);
    }

    public void reject(User decider, String reason) {
        if (reason == null || reason.isBlank()) {
            throw new BusinessRuleException("REASON_REQUIRED",
                "Say why the request is being rejected -- the employee needs "
              + "to know what to correct.");
        }
        move(Decision.REJECTED);
        this.rejectionReason = reason.trim();
        conclude(decider);
    }

    /**
     * A corrected request comes back for a fresh decision. The previous
     * decision is not lost -- it is in audit_logs, written when the
     * decision was first made. This row holds current state; the trail
     * holds history.
     */
    public void reopen() {
        move(Decision.PENDING);
        this.rejectionReason = null;
        this.decidedBy = null;
        this.decidedAt = null;
        this.verifiedBy = null;
        this.verifiedAt = null;
    }

    public void addComment(ApprovalComment comment) {
        comments.add(comment);
        comment.attachTo(this);
    }

    // ---------- guards ----------

    /**
     * decided_by and decided_at are set here and nowhere else, so they
     * cannot drift from the decision. chk_approvals_decider enforces the
     * same rule at the database level.
     */
    private void conclude(User decider) {
        this.decidedBy = decider;
        this.decidedAt = now();
    }

    private void move(Decision target) {
        if (!decision.canTransitionTo(target)) {
            throw new InvalidStateTransitionException("Approval", decision, target);
        }
        this.decision = target;
    }

    private LocalDateTime now() { return LocalDateTime.now(ZoneOffset.UTC); }

    // getters only
    public CardRequest getRequest()      { return request; }
    public Decision getDecision()        { return decision; }
    public User getVerifiedBy()          { return verifiedBy; }
    public LocalDateTime getVerifiedAt() { return verifiedAt; }
    public User getDecidedBy()           { return decidedBy; }
    public LocalDateTime getDecidedAt()  { return decidedAt; }
    public String getRejectionReason()   { return rejectionReason; }
    public List<ApprovalComment> getComments() { return List.copyOf(comments); }
}
