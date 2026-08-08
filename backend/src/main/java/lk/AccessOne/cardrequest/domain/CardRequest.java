package lk.AccessOne.cardrequest.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lk.AccessOne.access.domain.AccessLevel;
import lk.AccessOne.identity.domain.User;
import lk.AccessOne.organisation.domain.Employee;
import lk.AccessOne.shared.domain.AuditableEntity;
import lk.AccessOne.shared.enums.RequestStatus;
import lk.AccessOne.shared.enums.RequestType;
import lk.AccessOne.shared.error.BusinessRuleException;
import lk.AccessOne.shared.error.InvalidStateTransitionException;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "card_requests")
public class CardRequest extends AuditableEntity {

    @NotBlank @Size(max = 20)
    @Column(name = "request_no", nullable = false, length = 20, unique = true)
    private String requestNo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Enumerated(EnumType.STRING)
    @Column(name = "request_type", nullable = false, length = 20)
    private RequestType requestType;

    @Size(max = 255)
    @Column(name = "reason", length = 255)
    private String reason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_access_level_id")
    private AccessLevel requestedAccessLevel;

    /**
     * Deliberately a plain Long, not a @ManyToOne to IdCard. Module 4 owns
     * id_cards and may not exist yet, and the schema has no foreign key here
     * either -- it would create a cycle with id_cards.card_request_id.
     * Storing the id keeps the two modules independent.
     */
    @Column(name = "previous_card_id")
    private Long previousCardId;

    @Size(max = 255)
    @Column(name = "photo_path", length = 255)
    private String photoPath;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 25)
    private RequestStatus status = RequestStatus.DRAFT;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @OneToMany(mappedBy = "request", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RequestDocument> documents = new ArrayList<>();

    protected CardRequest() { }

    // construction 

    public static CardRequest draft(String requestNo, Employee employee,
                                     RequestType type, String reason,
                                     AccessLevel level, Long previousCardId,
                                     User createdBy) {
        CardRequest request = new CardRequest();
        request.requestNo = requestNo;
        request.employee = employee;
        request.requestType = type;
        request.reason = reason;
        request.requestedAccessLevel = level;
        request.previousCardId = previousCardId;
        request.createdBy = createdBy;
        request.status = RequestStatus.DRAFT;
        request.validateTypeRules();
        return request;
    }

    //  behaviour 
    public void updateDraft(RequestType type, String reason,
                             AccessLevel level, Long previousCardId) {
        requireDraft("edited");
        this.requestType = type;
        this.reason = reason;
        this.requestedAccessLevel = level;
        this.previousCardId = previousCardId;
        validateTypeRules();
    }

    public void attachPhoto(String path) {
        requireDraft("given a new photo");
        this.photoPath = path;
    }

    public void submit() {
        if (photoPath == null || photoPath.isBlank()) {
            throw new BusinessRuleException("PHOTO_REQUIRED",
                "Attach a photo before submitting this request.");
        }
        transitionTo(RequestStatus.SUBMITTED);
    }

    public void withdraw() {
        transitionTo(RequestStatus.WITHDRAWN);
    }

    /**
     * The one place a status changes. Module 2 calls this for verification
     * and decisions, so the rules cannot diverge between modules.
     */
    public void transitionTo(RequestStatus target) {
        if (!status.canTransitionTo(target)) {
            throw new InvalidStateTransitionException("Card request", status, target);
        }
        RequestStatus previous = this.status;
        this.status = target;
        if (target.isClosed() && closedAt == null) {
            this.closedAt = LocalDateTime.now(ZoneOffset.UTC);
        }
        if (target == RequestStatus.SUBMITTED) {
            this.submittedAt = LocalDateTime.now(ZoneOffset.UTC);
        }
        // A resubmitted request reopens; clear the closing timestamp.
        if (previous == RequestStatus.REJECTED && target == RequestStatus.SUBMITTED) {
            this.closedAt = null;
        }
    }

    public boolean isHardDeletable() {
        return status.isHardDeletable();
    }

    public void addDocument(RequestDocument document) {
        requireDraft("given new documents");
        documents.add(document);
        document.attachTo(this);
    }

    public void removeDocument(RequestDocument document) {
        requireDraft("stripped of documents");
        documents.remove(document);
    }

    // ---------- guards ----------

    private void requireDraft(String action) {
        if (status != RequestStatus.DRAFT) {
            throw new BusinessRuleException("NOT_A_DRAFT",
                "A request that has been submitted cannot be " + action + ".");
        }
    }

    /**
     * Mirrors chk_card_requests_reason. Checked here so the user sees a
     * field-level message rather than a database constraint violation.
     */
    private void validateTypeRules() {
        if (requestType == RequestType.REPLACEMENT) {
            if (reason == null || reason.isBlank()) {
                throw new BusinessRuleException("REASON_REQUIRED",
                    "Say why the card is being replaced.");
            }
            if (previousCardId == null) {
                throw new BusinessRuleException("PREVIOUS_CARD_REQUIRED",
                    "Select the card being replaced.");
            }
        }
    }

    // getters only -- no setters
    public String getRequestNo()                 { return requestNo; }
    public Employee getEmployee()                { return employee; }
    public RequestType getRequestType()          { return requestType; }
    public String getReason()                    { return reason; }
    public AccessLevel getRequestedAccessLevel() { return requestedAccessLevel; }
    public Long getPreviousCardId()              { return previousCardId; }
    public String getPhotoPath()                 { return photoPath; }
    public RequestStatus getStatus()             { return status; }
    public LocalDateTime getSubmittedAt()        { return submittedAt; }
    public LocalDateTime getClosedAt()           { return closedAt; }
    public User getCreatedBy()                   { return createdBy; }
    public List<RequestDocument> getDocuments()  { return List.copyOf(documents); }
}
