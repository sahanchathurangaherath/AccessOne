package lk.AccessOne.entry.domain;

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
 * blacklist. Deliberately does not extend {@code BaseEntity}/{@code
 * AuditableEntity} -- the table has neither {@code created_at} nor
 * {@code updated_at}; {@code blacklisted_at} is its own timestamp, set once,
 * never revised. {@code ddl-auto: validate} means mapping a column the
 * schema doesn't have fails at startup, so the shared base classes don't
 * fit here.
 */
@Entity
@Table(name = "blacklist")
public class BlacklistEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "card_id")    private Long cardId;
    @Column(name = "visitor_id") private Long visitorId;

    @Column(name = "reason", nullable = false, length = 255)
    private String reason;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "blacklisted_by", nullable = false)
    private User blacklistedBy;

    @Column(name = "blacklisted_at", nullable = false)
    private LocalDateTime blacklistedAt;

    @Column(name = "released_at") private LocalDateTime releasedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "released_by")
    private User releasedBy;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    protected BlacklistEntry() { }

    /** chk_blacklist_onetarget: exactly one, never both, never neither. */
    public static BlacklistEntry forCard(Long cardId, String reason, User by) {
        return create(cardId, null, reason, by);
    }

    public static BlacklistEntry forVisitor(Long visitorId, String reason, User by) {
        return create(null, visitorId, reason, by);
    }

    private static BlacklistEntry create(Long cardId, Long visitorId, String reason, User by) {
        if (reason == null || reason.isBlank()) {
            throw new BusinessRuleException("REASON_REQUIRED", "Say why this is being blacklisted.");
        }
        BlacklistEntry entry = new BlacklistEntry();
        entry.cardId = cardId;
        entry.visitorId = visitorId;
        entry.reason = reason.trim();
        entry.blacklistedBy = by;
        entry.blacklistedAt = LocalDateTime.now(ZoneOffset.UTC);
        entry.active = true;
        return entry;
    }

    /** chk_blacklist_release: both fields, together. */
    public void release(User by) {
        if (!active) {
            throw new BusinessRuleException("ALREADY_RELEASED",
                "This blacklist entry has already been lifted.");
        }
        this.active = false;
        this.releasedAt = LocalDateTime.now(ZoneOffset.UTC);
        this.releasedBy = by;
    }

    public Long getId()                  { return id; }
    public Long getCardId()              { return cardId; }
    public Long getVisitorId()           { return visitorId; }
    public String getReason()            { return reason; }
    public User getBlacklistedBy()       { return blacklistedBy; }
    public LocalDateTime getBlacklistedAt() { return blacklistedAt; }
    public LocalDateTime getReleasedAt() { return releasedAt; }
    public User getReleasedBy()          { return releasedBy; }
    public boolean isActive()            { return active; }

    @Override
    public boolean equals(Object other) {
        if (this == other) return true;
        if (!(other instanceof BlacklistEntry that)) return false;
        if (!getClass().equals(Hibernate.getClass(other))) return false;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() { return getClass().hashCode(); }
}
