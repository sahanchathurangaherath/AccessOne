package lk.AccessOne.card.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lk.AccessOne.access.domain.AccessLevel;
import lk.AccessOne.cardrequest.domain.CardRequest;
import lk.AccessOne.organisation.domain.Employee;
import lk.AccessOne.shared.domain.AuditableEntity;
import lk.AccessOne.shared.enums.CardStatus;
import lk.AccessOne.shared.error.BusinessRuleException;
import lk.AccessOne.shared.error.InvalidStateTransitionException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

/**
 * uq_id_cards_request: one card per request, permanently. A "reissue" is
 * therefore never another card from the same request -- it is a new
 * REPLACEMENT request (Module 1) that goes through approval (Module 2) and
 * produces its own card, linked back here via {@link #supersededBy}.
 */
@Entity
@Table(name = "id_cards")
public class IdCard extends AuditableEntity {

    @Column(name = "card_serial", nullable = false, length = 30, unique = true)
    private String cardSerial;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "card_request_id", nullable = false, unique = true)
    private CardRequest request;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "access_level_id")
    private AccessLevel accessLevel;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 25)
    private CardStatus status = CardStatus.GENERATED;

    @Column(name = "version_no", nullable = false)
    private short versionNo = 1;

    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @Column(name = "activated_at")
    private LocalDateTime activatedAt;

    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;

    @Column(name = "revocation_reason", length = 255)
    private String revocationReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "replaced_by_card_id")
    private IdCard replacedBy;

    /**
     * Snapshots, not lookups.
     *
     * An issued card is a physical object. If someone's designation changes
     * next year, the card in their pocket still says what was printed on
     * it -- so the record has to match the object, not the current employee
     * row.
     */
    @Column(name = "printed_name", nullable = false, length = 120)
    private String printedName;

    @Column(name = "printed_designation", nullable = false, length = 100)
    private String printedDesignation;

    @Column(name = "printed_department", nullable = false, length = 100)
    private String printedDepartment;

    @Column(name = "photo_path", length = 255)
    private String photoPath;

    protected IdCard() { }

    public static IdCard generate(String serial, CardRequest request, Employee employee,
                                   AccessLevel level, short versionNo, String photoPath) {
        IdCard card = new IdCard();
        card.cardSerial = serial;
        card.request = request;
        card.employee = employee;
        card.accessLevel = level;
        card.versionNo = versionNo;
        card.issueDate = LocalDate.now();
        card.photoPath = photoPath;
        card.status = CardStatus.GENERATED;

        card.printedName = employee.getFullName();
        card.printedDesignation = employee.getDesignation();
        card.printedDepartment = employee.getDepartment().getDeptName();
        return card;
    }

    // lifecycle 

    /** The one place status changes. Every other method here goes through this. */
    public void moveTo(CardStatus target) {
        if (!status.canTransitionTo(target)) {
            throw new InvalidStateTransitionException("Card", status, target);
        }
        this.status = target;
    }

    /** chk_id_cards_activation: ACTIVE requires activated_at. Both, together. */
    public void activate() {
        moveTo(CardStatus.ACTIVE);
        this.activatedAt = LocalDateTime.now(ZoneOffset.UTC);
    }

    /** chk_id_cards_revocation: REVOKED requires revoked_at AND a reason. */
    public void revoke(String reason) {
        if (reason == null || reason.isBlank()) {
            throw new BusinessRuleException("REASON_REQUIRED",
                "Say why the card is being revoked.");
        }
        moveTo(CardStatus.REVOKED);
        this.revokedAt = LocalDateTime.now(ZoneOffset.UTC);
        this.revocationReason = reason.trim();
    }

    public void reportLost()    { moveTo(CardStatus.LOST); }
    public void reportDamaged() { moveTo(CardStatus.DAMAGED); }
    public void suspend()       { moveTo(CardStatus.SUSPENDED); }
    public void reinstate()     { moveTo(CardStatus.ACTIVE); }

    /** Void only before the card enters production -- the state machine already refuses it after DISPATCHED. */
    public void voidCard(String reason) {
        moveTo(CardStatus.VOID);
        this.revocationReason = reason;
    }

    /**
     * Called when the replacement card has been generated, in the same
     * transaction. chk_id_cards_not_self stops a card replacing itself.
     */
    public void supersededBy(IdCard replacement) {
        if (replacement == null || replacement.equals(this)) {
            throw new BusinessRuleException("INVALID_REPLACEMENT",
                "A card cannot replace itself.");
        }
        moveTo(CardStatus.REPLACED);
        this.replacedBy = replacement;
    }

    public void assignAccessLevel(AccessLevel level) {
        this.accessLevel = level;
    }

    /** The one question the Phase 12 decision engine asks of a card. */
    public boolean isUsable() {
        return status.isUsable();
    }

    public String getCardSerial()          { return cardSerial; }
    public CardRequest getRequest()        { return request; }
    public Employee getEmployee()          { return employee; }
    public AccessLevel getAccessLevel()    { return accessLevel; }
    public CardStatus getStatus()          { return status; }
    public short getVersionNo()            { return versionNo; }
    public LocalDate getIssueDate()        { return issueDate; }
    public LocalDateTime getActivatedAt()  { return activatedAt; }
    public LocalDateTime getRevokedAt()    { return revokedAt; }
    public String getRevocationReason()    { return revocationReason; }
    public IdCard getReplacedBy()          { return replacedBy; }
    public String getPrintedName()         { return printedName; }
    public String getPrintedDesignation()  { return printedDesignation; }
    public String getPrintedDepartment()   { return printedDepartment; }
    public String getPhotoPath()           { return photoPath; }
}
