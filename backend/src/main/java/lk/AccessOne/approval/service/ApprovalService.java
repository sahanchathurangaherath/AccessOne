package lk.AccessOne.approval.service;

import lk.AccessOne.approval.domain.Approval;
import lk.AccessOne.approval.domain.ApprovalComment;
import lk.AccessOne.approval.event.CardRequestApproved;
import lk.AccessOne.approval.event.CardRequestRejected;
import lk.AccessOne.approval.event.EmployeeExited;
import lk.AccessOne.approval.repository.ApprovalRepository;
import lk.AccessOne.approval.repository.PendingQueueRepository;
import lk.AccessOne.approval.web.dto.ApprovalDetail;
import lk.AccessOne.approval.web.dto.ApprovalHistoryRow;
import lk.AccessOne.approval.web.dto.ApprovalTimelineEntry;
import lk.AccessOne.approval.web.dto.BulkOutcome;
import lk.AccessOne.approval.web.dto.BulkResult;
import lk.AccessOne.approval.web.dto.PendingRequestRow;
import lk.AccessOne.cardrequest.domain.CardRequest;
import lk.AccessOne.cardrequest.repository.CardRequestRepository;
import lk.AccessOne.cardrequest.service.CardRequestService;
import lk.AccessOne.cardrequest.web.dto.CardRequestDetail;
import lk.AccessOne.cardrequest.web.dto.CreateCardRequest;
import lk.AccessOne.identity.domain.User;
import lk.AccessOne.identity.repository.UserRepository;
import lk.AccessOne.organisation.domain.Employee;
import lk.AccessOne.organisation.repository.EmployeeRepository;
import lk.AccessOne.shared.audit.CurrentUserProvider;
import lk.AccessOne.shared.audit.StatusChangeSupport;
import lk.AccessOne.shared.audit.TimelineService;
import lk.AccessOne.shared.enums.AuditAction;
import lk.AccessOne.shared.enums.EmploymentStatus;
import lk.AccessOne.shared.enums.RequestStatus;
import lk.AccessOne.shared.error.BusinessRuleException;
import lk.AccessOne.shared.error.ResourceNotFoundException;
import lk.AccessOne.shared.service.EntityLookup;
import lk.AccessOne.shared.web.PageResponse;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class ApprovalService {

    private final ApprovalRepository approvals;
    private final PendingQueueRepository queue;
    private final CardRequestRepository requests;
    private final CardRequestService cardRequestService;
    private final EmployeeRepository employees;
    private final EntityLookup lookup;
    private final StatusChangeSupport statusChanges;
    private final TimelineService timelineService;
    private final CurrentUserProvider currentUser;
    private final UserRepository users;
    private final ApplicationEventPublisher events;
    private final ApprovalMapper mapper;

    public ApprovalService(ApprovalRepository approvals, PendingQueueRepository queue,
                            CardRequestRepository requests, CardRequestService cardRequestService,
                            EmployeeRepository employees, EntityLookup lookup,
                            StatusChangeSupport statusChanges, TimelineService timelineService,
                            CurrentUserProvider currentUser, UserRepository users,
                            ApplicationEventPublisher events, ApprovalMapper mapper) {
        this.approvals = approvals;
        this.queue = queue;
        this.requests = requests;
        this.cardRequestService = cardRequestService;
        this.employees = employees;
        this.lookup = lookup;
        this.statusChanges = statusChanges;
        this.timelineService = timelineService;
        this.currentUser = currentUser;
        this.users = users;
        this.events = events;
        this.mapper = mapper;
    }

    // ---------- queue ----------

    @Transactional(readOnly = true)
    public PageResponse<PendingRequestRow> queue(String ageing, int page, int size) {
        List<PendingQueueRepository.QueueRow> rows = queue.findQueue(ageing, page * size, size);
        long total = queue.countQueue(ageing);
        return PageResponse.ofList(rows.stream().map(mapper::toQueueRow).toList(), page, size, total);
    }

    // ---------- read ----------

    @Transactional(readOnly = true)
    public ApprovalDetail findByRequestId(Long requestId) {
        return mapper.toDetail(load(requestId));
    }

    @Transactional(readOnly = true)
    public List<ApprovalTimelineEntry> timeline(Long requestId) {
        Approval approval = load(requestId);
        return timelineService.forEntity("approvals", approval.getId()).stream()
                .map(e -> new ApprovalTimelineEntry(
                        e.status() != null ? e.status() : e.action(),
                        e.changedBy(), e.changedAt(), e.note()))
                .toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<ApprovalHistoryRow> history(Long deciderId, Pageable pageable) {
        Page<Approval> page = approvals.findHistory(deciderId, pageable);
        return PageResponse.of(page, mapper::toHistoryRow);
    }

    // ---------- decisions ----------

    @Transactional
    public ApprovalDetail verify(Long requestId) {
        Approval approval = load(requestId);
        CardRequest request = approval.getRequest();

        statusChanges.apply("approvals", approval.getId(),
                approval::getDecision, () -> approval.verify(actingUser()));

        statusChanges.apply("card_requests", request.getId(),
                request::getStatus, () -> request.transitionTo(RequestStatus.UNDER_VERIFICATION));

        return mapper.toDetail(approval);
    }

    @Transactional
    public ApprovalDetail approve(Long requestId) {
        Approval approval = load(requestId);
        CardRequest request = approval.getRequest();

        requireEmployeeStillActive(request);

        statusChanges.apply("approvals", approval.getId(), AuditAction.APPROVE,
                approval::getDecision, () -> approval.approve(actingUser()));

        statusChanges.apply("card_requests", request.getId(),
                request::getStatus, () -> request.transitionTo(RequestStatus.APPROVED));

        // Module 4 listens for this. Module 2 does not know or care that
        // it exists, and card generation can be built later without any
        // change here.
        events.publishEvent(new CardRequestApproved(
                request.getId(), request.getEmployee().getId(),
                request.getRequestedAccessLevel() == null ? null
                        : request.getRequestedAccessLevel().getId()));

        return mapper.toDetail(approval);
    }

    @Transactional
    public ApprovalDetail reject(Long requestId, String reason) {
        Approval approval = load(requestId);
        CardRequest request = approval.getRequest();

        statusChanges.apply("approvals", approval.getId(), AuditAction.REJECT,
                approval::getDecision, () -> approval.reject(actingUser(), reason));

        statusChanges.apply("card_requests", request.getId(),
                request::getStatus, () -> request.transitionTo(RequestStatus.REJECTED));

        events.publishEvent(new CardRequestRejected(
                request.getId(), request.getEmployee().getId(), reason));

        return mapper.toDetail(approval);
    }

    // ---------- comments ----------

    @Transactional
    public ApprovalDetail comment(Long requestId, String text) {
        Approval approval = load(requestId);
        approval.addComment(new ApprovalComment(text, actingUser()));
        return mapper.toDetail(approval);
    }

    // ---------- bulk approval ----------

    @Transactional
    public BulkResult bulkApprove(List<Long> requestIds) {
        List<BulkOutcome> outcomes = new ArrayList<>();

        for (Long requestId : requestIds) {
            try {
                approve(requestId);
                outcomes.add(BulkOutcome.ok(requestId));
            } catch (BusinessRuleException | ResourceNotFoundException e) {
                outcomes.add(BulkOutcome.failed(requestId, e.getMessage()));
            }
        }

        return new BulkResult(
                outcomes.stream().filter(BulkOutcome::success).count(),
                outcomes.stream().filter(o -> !o.success()).count(),
                outcomes);
    }

    // ---------- HR raises a request on behalf of an employee ----------

    @Transactional
    public CardRequestDetail raiseOnBehalf(CreateCardRequest input) {
        // CardRequestService already handles the HR path: it honours
        // input.employeeId() when the caller has the HR role.
        return cardRequestService.create(input);
    }

    @Transactional
    public BulkResult raiseBatch(List<CreateCardRequest> inputs) {
        List<BulkOutcome> outcomes = new ArrayList<>();

        for (CreateCardRequest input : inputs) {
            try {
                CardRequestDetail created = cardRequestService.create(input);
                outcomes.add(BulkOutcome.ok(created.id()));
            } catch (BusinessRuleException | ResourceNotFoundException e) {
                outcomes.add(BulkOutcome.failed(input.employeeId(), e.getMessage()));
            }
        }

        return new BulkResult(
                outcomes.stream().filter(BulkOutcome::success).count(),
                outcomes.stream().filter(o -> !o.success()).count(),
                outcomes);
    }

    // ---------- revocation trigger ----------

    @Transactional
    public void recordExit(Long employeeId, EmploymentStatus reason, LocalDate exitDate) {
        Employee employee = lookup.require(employees, employeeId, "Employee");
        employee.recordExit(reason, exitDate);

        // Cancel anything still in flight -- an approval for someone who
        // has left should never proceed to a card.
        requests.findByEmployeeIdAndStatusIn(employeeId,
                List.of(RequestStatus.SUBMITTED, RequestStatus.UNDER_VERIFICATION))
                .forEach(r -> statusChanges.apply("card_requests", r.getId(),
                        r::getStatus, () -> r.transitionTo(RequestStatus.CANCELLED)));

        events.publishEvent(new EmployeeExited(employeeId, reason.name(), exitDate));
    }

    // ---------- helpers ----------

    private Approval load(Long requestId) {
        return lookup.require(approvals.findDetailByRequestId(requestId),
                              "Approval for card request", requestId);
    }

    /**
     * Not a database constraint -- it depends on a row in another table.
     * Approving a card for someone who resigned last week is exactly the
     * failure the revocation flow exists to prevent, so catch it here.
     */
    private void requireEmployeeStillActive(CardRequest request) {
        if (!request.getEmployee().isActivelyEmployed()) {
            throw new BusinessRuleException("EMPLOYEE_NOT_ACTIVE",
                "This employee has left. Reject the request instead of approving it.");
        }
    }

    private User actingUser() {
        return users.getReferenceById(currentUser.currentUserId());
    }
}
