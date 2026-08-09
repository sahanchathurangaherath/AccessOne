
package lk.AccessOne.access.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lk.AccessOne.identity.domain.User;
import lk.AccessOne.shared.domain.BaseEntity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

/**
 * History, not a column on the card.
 *
 * "Who granted this card access to the server room, and when" is a
 * question the Director asked for. A single access_level_id on id_cards
 * answers "what" but never "who" or "when".
 *
 * Extends BaseEntity, not AuditableEntity: the table has created_at but
 * no updated_at -- a granted assignment is never edited, only superseded
 * by a new row.
 */
@Entity
@Table(name = "card_access_assignments")
public class CardAccessAssignment extends BaseEntity {

    /**
     * A plain Long, not a @ManyToOne to IdCard. Module 4 owns id_cards
     * and may not exist yet; keeping the id here means Module 3 can be
     * built and tested first.
     */
    @Column(name = "card_id", nullable = false)
    private Long cardId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "access_level_id", nullable = false)
    private AccessLevel accessLevel;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assigned_by", nullable = false)
    private User assignedBy;

    @Column(name = "valid_from", nullable = false)
    private LocalDate validFrom;

    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;

    @Column(name = "is_current", nullable = false)
    private boolean current = true;

    @Column(name = "remarks", length = 255)
    private String remarks;

    protected CardAccessAssignment() { }

    public CardAccessAssignment(Long cardId, AccessLevel level,
                                User assignedBy, LocalDate validFrom, String remarks) {
        this.cardId = cardId;
        this.accessLevel = level;
        this.assignedBy = assignedBy;
        this.validFrom = validFrom;
        this.remarks = remarks;
    }

    /**
     * chk_caa_current: is_current = 0 OR revoked_at IS NULL.
     * Setting both together here is what keeps the row valid.
     */
    public void supersede() {
        this.current = false;
        this.revokedAt = LocalDateTime.now(ZoneOffset.UTC);
    }

    public Long getCardId()              { return cardId; }
    public AccessLevel getAccessLevel()  { return accessLevel; }
    public User getAssignedBy()          { return assignedBy; }
    public LocalDate getValidFrom()      { return validFrom; }
    public LocalDateTime getRevokedAt()  { return revokedAt; }
    public boolean isCurrent()           { return current; }
    public String getRemarks()           { return remarks; }
}
