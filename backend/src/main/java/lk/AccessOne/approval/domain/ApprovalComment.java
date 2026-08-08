package lk.AccessOne.approval.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lk.AccessOne.identity.domain.User;
import lk.AccessOne.shared.error.BusinessRuleException;
import org.hibernate.Hibernate;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

/**
 * approval_comments has neither created_at nor updated_at -- only
 * commented_at -- so this stands apart from BaseEntity/AuditableEntity
 * entirely, the same way AuditLog and RequestDocument do, and maintains
 * its own commented_at rather than relying on Spring Data auditing's
 * created_at name.
 */
@Entity
@Table(name = "approval_comments")
public class ApprovalComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "approval_id", nullable = false)
    private Approval approval;

    @Column(name = "comment_text", nullable = false, length = 1000)
    private String commentText;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "commented_by", nullable = false)
    private User commentedBy;

    @Column(name = "commented_at", nullable = false)
    private LocalDateTime commentedAt;

    protected ApprovalComment() { }

    public ApprovalComment(String text, User author) {
        if (text == null || text.isBlank()) {
            throw new BusinessRuleException("EMPTY_COMMENT", "Write something first.");
        }
        this.commentText = text.trim();
        this.commentedBy = author;
        this.commentedAt = LocalDateTime.now(ZoneOffset.UTC);
    }

    void attachTo(Approval approval) { this.approval = approval; }

    public Long getId()                    { return id; }
    public Approval getApproval()          { return approval; }
    public String getCommentText()         { return commentText; }
    public User getCommentedBy()           { return commentedBy; }
    public LocalDateTime getCommentedAt()  { return commentedAt; }

    @Override
    public boolean equals(Object other) {
        if (this == other) return true;
        if (!(other instanceof ApprovalComment that)) return false;
        if (!getClass().equals(Hibernate.getClass(other))) return false;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
