package lk.AccessOne.visitor.service;

import jakarta.persistence.EntityManager;
import lk.AccessOne.organisation.domain.Employee;
import lk.AccessOne.organisation.repository.EmployeeRepository;
import lk.AccessOne.shared.audit.AuditEvent;
import lk.AccessOne.shared.enums.AuditAction;
import lk.AccessOne.shared.error.BusinessRuleException;
import lk.AccessOne.shared.service.EntityLookup;
import lk.AccessOne.shared.storage.FileStorageService;
import lk.AccessOne.shared.web.PageResponse;
import lk.AccessOne.visitor.domain.Visitor;
import lk.AccessOne.visitor.repository.VisitorPassRepository;
import lk.AccessOne.visitor.repository.VisitorRepository;
import lk.AccessOne.visitor.web.dto.RegisterVisitorInput;
import lk.AccessOne.visitor.web.dto.UpdateVisitorInput;
import lk.AccessOne.visitor.web.dto.VisitorDto;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;

@Service
public class VisitorService {

    private final VisitorRepository visitors;
    private final VisitorPassRepository passes;
    private final EmployeeRepository employees;
    private final FileStorageService storage;
    private final VisitorMapper mapper;
    private final EntityLookup lookup;
    private final ApplicationEventPublisher events;
    private final EntityManager entityManager;

    public VisitorService(VisitorRepository visitors, VisitorPassRepository passes,
                           EmployeeRepository employees, FileStorageService storage,
                           VisitorMapper mapper, EntityLookup lookup,
                           ApplicationEventPublisher events, EntityManager entityManager) {
        this.visitors = visitors;
        this.passes = passes;
        this.employees = employees;
        this.storage = storage;
        this.mapper = mapper;
        this.lookup = lookup;
        this.events = events;
        this.entityManager = entityManager;
    }

    @Transactional(readOnly = true)
    public PageResponse<VisitorDto> search(String search, Pageable pageable) {
        return PageResponse.of(visitors.search(search, pageable), mapper::toDto);
    }

    @Transactional(readOnly = true)
    public VisitorDto findById(Long id) {
        return mapper.toDto(lookup.require(visitors, id, "Visitor"));
    }

    @Transactional
    public VisitorDto register(RegisterVisitorInput input) {
        Employee host = lookup.require(employees, input.hostEmployeeId(), "Host employee");

        if (!host.isActivelyEmployed()) {
            throw new BusinessRuleException("HOST_NOT_ACTIVE",
                "%s is no longer employed here and cannot host a visitor.".formatted(host.getFullName()));
        }

        Visitor visitor = visitors.save(new Visitor(
                nextVisitorCode(), input.fullName(), input.idDocumentType(),
                input.idDocumentNo(), input.visitorType(), host,
                input.company(), input.phone(), input.email()));

        events.publishEvent(AuditEvent.created("visitors", visitor.getId(),
                "{\"visitor_code\":\"%s\"}".formatted(visitor.getVisitorCode())));
        return mapper.toDto(visitor);
    }

    @Transactional
    public VisitorDto update(Long id, UpdateVisitorInput input) {
        Visitor visitor = lookup.require(visitors, id, "Visitor");
        Employee host = lookup.require(employees, input.hostEmployeeId(), "Host employee");

        visitor.update(input.fullName(), input.company(), input.phone(), input.email(), host);

        events.publishEvent(new AuditEvent("visitors", id, AuditAction.UPDATE, null, null));
        return mapper.toDto(visitor);
    }

    @Transactional
    public VisitorDto uploadPhoto(Long id, MultipartFile file) {
        Visitor visitor = lookup.require(visitors, id, "Visitor");
        visitor.attachPhoto(storage.store("visitors", id, file, FileStorageService.IMAGES, 2L * 1024 * 1024));
        return mapper.toDto(visitor);
    }

    /**
     * Visit history is a security record. A visitor who has been issued a
     * pass cannot be erased -- the logs would reference nobody. One with
     * no passes is a registration error and is removed outright.
     */
    @Transactional
    public void delete(Long visitorId) {
        Visitor visitor = lookup.require(visitors, visitorId, "Visitor");
        long passCount = passes.countByVisitorId(visitorId);

        if (passCount > 0) {
            visitor.softDelete();
            events.publishEvent(new AuditEvent("visitors", visitorId,
                    AuditAction.UPDATE, "{\"is_deleted\":false}", "{\"is_deleted\":true}"));
            return;
        }
        visitors.delete(visitor);
        events.publishEvent(new AuditEvent("visitors", visitorId, AuditAction.DELETE, null, null));
    }

    private String nextVisitorCode() {
        Number n = (Number) entityManager
                .createNativeQuery("SELECT NEXT VALUE FOR dbo.seq_visitor_code")
                .getSingleResult();
        return "VIS-%04d".formatted(n.longValue());
    }
}
