package lk.AccessOne.cardrequest.service;

import jakarta.persistence.EntityManager;
import lk.AccessOne.access.domain.AccessLevel;
import lk.AccessOne.access.repository.AccessLevelRepository;
import lk.AccessOne.cardrequest.domain.CardRequest;
import lk.AccessOne.cardrequest.repository.CardRequestRepository;
import lk.AccessOne.cardrequest.web.dto.CardRequestDetail;
import lk.AccessOne.cardrequest.web.dto.CardRequestSummary;
import lk.AccessOne.cardrequest.web.dto.CreateCardRequest;
import lk.AccessOne.cardrequest.web.dto.RequestTimelineEntry;
import lk.AccessOne.identity.domain.User;
import lk.AccessOne.identity.repository.UserRepository;
import lk.AccessOne.identity.security.AccessOneUserDetails;
import lk.AccessOne.organisation.domain.Employee;
import lk.AccessOne.organisation.repository.EmployeeRepository;
import lk.AccessOne.shared.audit.AuditEvent;
import lk.AccessOne.shared.audit.StatusChangeSupport;
import lk.AccessOne.shared.audit.TimelineService;
import lk.AccessOne.shared.enums.AuditAction;
import lk.AccessOne.shared.enums.RequestStatus;
import lk.AccessOne.shared.error.BusinessRuleException;
import lk.AccessOne.shared.security.OwnershipGuard;
import lk.AccessOne.shared.service.EntityLookup;
import lk.AccessOne.shared.storage.FileStorageService;
import lk.AccessOne.shared.web.PageResponse;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@Service
public class CardRequestService {

    /** The two roles that may act on any employee's request, not just their own. */
    private static final String[] PRIVILEGED_ROLES = { "HR_MANAGER", "SYSTEM_ADMIN" };

    private final CardRequestRepository requests;
    private final EmployeeRepository employees;
    private final AccessLevelRepository accessLevels;
    private final UserRepository users;
    private final FileStorageService storage;
    private final CardRequestMapper mapper;
    private final ApplicationEventPublisher events;
    private final EntityManager entityManager;
    private final EntityLookup lookup;
    private final OwnershipGuard guard;
    private final StatusChangeSupport statusChanges;
    private final TimelineService timelineService;

    public CardRequestService(CardRequestRepository requests, EmployeeRepository employees,
                               AccessLevelRepository accessLevels, UserRepository users,
                               FileStorageService storage, CardRequestMapper mapper,
                               ApplicationEventPublisher events, EntityManager entityManager,
                               EntityLookup lookup, OwnershipGuard guard,
                               StatusChangeSupport statusChanges, TimelineService timelineService) {
        this.requests = requests;
        this.employees = employees;
        this.accessLevels = accessLevels;
        this.users = users;
        this.storage = storage;
        this.mapper = mapper;
        this.events = events;
        this.entityManager = entityManager;
        this.lookup = lookup;
        this.guard = guard;
        this.statusChanges = statusChanges;
        this.timelineService = timelineService;
    }

    // ---------- read ----------

    @Transactional(readOnly = true)
    public PageResponse<CardRequestSummary> search(RequestStatus status, Pageable pageable) {
        Long scope = guard.hasAnyRole(PRIVILEGED_ROLES) ? null : requireCurrentEmployeeId();
        return PageResponse.of(requests.search(scope, status, pageable), mapper::toSummary);
    }

    @Transactional(readOnly = true)
    public CardRequestDetail findById(Long id) {
        CardRequest request = lookup.require(requests.findDetailById(id), "Card request", id);
        guard.requireOwnerOr(request.getEmployee().getId(), "Card request", id, PRIVILEGED_ROLES);
        return mapper.toDetail(request);
    }

    @Transactional(readOnly = true)
    public List<RequestTimelineEntry> timeline(Long id) {
        findById(id);   // reuses the ownership check

        return timelineService.forEntity("card_requests", id).stream()
                .map(e -> new RequestTimelineEntry(
                        e.status() != null ? e.status() : e.action(),
                        e.changedBy(), e.changedAt(), e.note()))
                .toList();
    }

    // ---------- write ----------

    @Transactional
    public CardRequestDetail create(CreateCardRequest input) {
        Long employeeId = guard.hasAnyRole(PRIVILEGED_ROLES) && input.employeeId() != null
                ? input.employeeId()
                : requireCurrentEmployeeId();

        Employee employee = lookup.require(employees, employeeId, "Employee");

        if (!employee.isActivelyEmployed()) {
            throw new BusinessRuleException("EMPLOYEE_NOT_ACTIVE",
                "A card cannot be requested for an employee who has left.");
        }

        if (requests.existsByEmployeeIdAndStatusIn(employeeId,
                List.of(RequestStatus.DRAFT, RequestStatus.SUBMITTED,
                        RequestStatus.UNDER_VERIFICATION))) {
            throw new BusinessRuleException("REQUEST_IN_PROGRESS",
                "This employee already has a request in progress.");
        }

        AccessLevel level = input.requestedAccessLevelId() == null ? null
                : lookup.require(accessLevels, input.requestedAccessLevelId(), "Access level");

        CardRequest request = CardRequest.draft(
                nextRequestNo(), employee, input.requestType(), input.reason(),
                level, input.previousCardId(), currentUser());

        requests.save(request);
        events.publishEvent(AuditEvent.created("card_requests", request.getId(),
                "{\"request_no\":\"%s\",\"status\":\"DRAFT\"}".formatted(request.getRequestNo())));

        return mapper.toDetail(request);
    }

    @Transactional
    public CardRequestDetail update(Long id, CreateCardRequest input) {
        CardRequest request = loadOwned(id);
        AccessLevel level = input.requestedAccessLevelId() == null ? null
                : lookup.require(accessLevels, input.requestedAccessLevelId(), "Access level");

        request.updateDraft(input.requestType(), input.reason(),
                            level, input.previousCardId());

        events.publishEvent(new AuditEvent("card_requests", id, AuditAction.UPDATE, null, null));
        return mapper.toDetail(request);
    }

    @Transactional
    public CardRequestDetail uploadPhoto(Long id, MultipartFile file) {
        CardRequest request = loadOwned(id);
        request.attachPhoto(storage.store("requests", id, file,
                FileStorageService.IMAGES, 2L * 1024 * 1024));
        return mapper.toDetail(request);
    }

    @Transactional
    public CardRequestDetail submit(Long id) {
        CardRequest request = loadOwned(id);
        statusChanges.apply("card_requests", id, request::getStatus, request::submit);
        return mapper.toDetail(request);
    }

    @Transactional
    public CardRequestDetail withdraw(Long id) {
        CardRequest request = loadOwned(id);
        statusChanges.apply("card_requests", id, request::getStatus, request::withdraw);
        return mapper.toDetail(request);
    }

    @Transactional
    public void delete(Long id) {
        CardRequest request = loadOwned(id);

        if (!request.isHardDeletable()) {
            throw new BusinessRuleException("NOT_DELETABLE",
                "A submitted request cannot be deleted. Withdraw it instead -- "
              + "the approval history has to survive.");
        }

        requests.delete(request);   // documents cascade, in the DB and in JPA
        storage.deleteFolder("requests", id);
        events.publishEvent(new AuditEvent("card_requests", id, AuditAction.DELETE, null, null));
    }

    // ---------- helpers ----------

    private String nextRequestNo() {
        Number next = (Number) entityManager
                .createNativeQuery("SELECT NEXT VALUE FOR dbo.seq_card_request_no")
                .getSingleResult();
        return "REQ-%d-%04d".formatted(LocalDate.now().getYear(), next.longValue());
    }

    CardRequest loadOwned(Long id) {
        CardRequest request = lookup.require(requests, id, "Card request");
        guard.requireOwnerOr(request.getEmployee().getId(), "Card request", id, PRIVILEGED_ROLES);
        return request;
    }

    private Long requireCurrentEmployeeId() {
        Long id = guard.currentEmployeeId();
        if (id == null) {
            throw new BusinessRuleException("NO_EMPLOYEE_RECORD",
                "This account is not linked to an employee record.");
        }
        return id;
    }

    private User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AccessOneUserDetails details) {
            return users.findById(details.getUserId()).orElse(null);
        }
        return null;
    }
}
