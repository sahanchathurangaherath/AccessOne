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
import lk.AccessOne.shared.audit.AuditLog;
import lk.AccessOne.shared.audit.AuditLogRepository;
import lk.AccessOne.shared.enums.AuditAction;
import lk.AccessOne.shared.enums.RequestStatus;
import lk.AccessOne.shared.error.BusinessRuleException;
import lk.AccessOne.shared.error.ResourceNotFoundException;
import lk.AccessOne.shared.web.PageResponse;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class CardRequestService {

    private final CardRequestRepository requests;
    private final EmployeeRepository employees;
    private final AccessLevelRepository accessLevels;
    private final UserRepository users;
    private final FileStorageService storage;
    private final CardRequestMapper mapper;
    private final ApplicationEventPublisher events;
    private final EntityManager entityManager;
    private final AuditLogRepository auditLogs;

    public CardRequestService(CardRequestRepository requests, EmployeeRepository employees,
                               AccessLevelRepository accessLevels, UserRepository users,
                               FileStorageService storage, CardRequestMapper mapper,
                               ApplicationEventPublisher events, EntityManager entityManager,
                               AuditLogRepository auditLogs) {
        this.requests = requests;
        this.employees = employees;
        this.accessLevels = accessLevels;
        this.users = users;
        this.storage = storage;
        this.mapper = mapper;
        this.events = events;
        this.entityManager = entityManager;
        this.auditLogs = auditLogs;
    }

    // ---------- read ----------

    @Transactional(readOnly = true)
    public PageResponse<CardRequestSummary> search(RequestStatus status, Pageable pageable) {
        Long scope = isHr() ? null : requireCurrentEmployeeId();
        return PageResponse.of(requests.search(scope, status, pageable), mapper::toSummary);
    }

    @Transactional(readOnly = true)
    public CardRequestDetail findById(Long id) {
        CardRequest request = requests.findDetailById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Card request", id));

        // 404, not 403. A 403 confirms the record exists, which is itself
        // information this caller is not entitled to.
        if (!canView(request)) {
            throw new ResourceNotFoundException("Card request", id);
        }
        return mapper.toDetail(request);
    }

    @Transactional(readOnly = true)
    public List<RequestTimelineEntry> timeline(Long id) {
        findById(id);   // reuses the ownership check

        return auditLogs.findByEntityNameAndEntityIdOrderByPerformedAtAsc("card_requests", id)
                .stream()
                .map(log -> new RequestTimelineEntry(
                        extractStatus(log),
                        log.getPerformedByUsername(),
                        log.getPerformedAt(),
                        describe(log.getAction())))
                .toList();
    }

    // ---------- write ----------

    @Transactional
    public CardRequestDetail create(CreateCardRequest input) {
        Long employeeId = isHr() && input.employeeId() != null
                ? input.employeeId()
                : requireCurrentEmployeeId();

        Employee employee = employees.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));

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
                : accessLevels.findById(input.requestedAccessLevelId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Access level", input.requestedAccessLevelId()));

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
                : accessLevels.findById(input.requestedAccessLevelId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Access level", input.requestedAccessLevelId()));

        request.updateDraft(input.requestType(), input.reason(),
                            level, input.previousCardId());

        events.publishEvent(new AuditEvent("card_requests", id, AuditAction.UPDATE, null, null));
        return mapper.toDetail(request);
    }

    @Transactional
    public CardRequestDetail uploadPhoto(Long id, MultipartFile file) {
        CardRequest request = loadOwned(id);
        request.attachPhoto(storage.storePhoto(id, file));
        return mapper.toDetail(request);
    }

    @Transactional
    public CardRequestDetail submit(Long id) {
        CardRequest request = loadOwned(id);
        RequestStatus from = request.getStatus();

        request.submit();

        events.publishEvent(AuditEvent.statusChanged(
                "card_requests", id, from, request.getStatus()));
        return mapper.toDetail(request);
    }

    @Transactional
    public CardRequestDetail withdraw(Long id) {
        CardRequest request = loadOwned(id);
        RequestStatus from = request.getStatus();

        request.withdraw();

        events.publishEvent(AuditEvent.statusChanged(
                "card_requests", id, from, request.getStatus()));
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
        CardRequest request = requests.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Card request", id));
        if (!canView(request)) {
            throw new ResourceNotFoundException("Card request", id);
        }
        return request;
    }

    private boolean canView(CardRequest request) {
        if (isHr()) return true;
        Long mine = currentEmployeeId();
        return mine != null && mine.equals(request.getEmployee().getId());
    }

    private boolean isHr() {
        return hasRole("ROLE_HR_MANAGER") || hasRole("ROLE_SYSTEM_ADMIN");
    }

    private boolean hasRole(String role) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role::equals);
    }

    private Long currentEmployeeId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AccessOneUserDetails details) {
            return details.getEmployeeId();
        }
        return null;
    }

    private Long requireCurrentEmployeeId() {
        Long id = currentEmployeeId();
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

    private static final Pattern STATUS_FIELD = Pattern.compile("\"status\"\\s*:\\s*\"([A-Z_]+)\"");

    /**
     * AuditLog.newValue is a small hand-built JSON string (see AuditEvent),
     * never a user-controlled document, so a regex extraction is enough --
     * pulling in a JSON library for one field is not worth the dependency.
     */
    private String extractStatus(AuditLog log) {
        String json = log.getNewValue();
        if (json != null) {
            Matcher matcher = STATUS_FIELD.matcher(json);
            if (matcher.find()) return matcher.group(1);
        }
        return log.getAction().name();
    }

    private String describe(AuditAction action) {
        return switch (action) {
            case CREATE -> "Request created";
            case UPDATE -> "Request details updated";
            case STATUS_CHANGE -> "Status changed";
            case DELETE -> "Request deleted";
            default -> action.name();
        };
    }
}
