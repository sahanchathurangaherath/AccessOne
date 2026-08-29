package lk.AccessOne.organisation.service;

import lk.AccessOne.access.service.ConfigMapper;
import lk.AccessOne.organisation.domain.Department;
import lk.AccessOne.organisation.repository.DepartmentRepository;
import lk.AccessOne.organisation.repository.EmployeeRepository;
import lk.AccessOne.organisation.web.dto.DepartmentDto;
import lk.AccessOne.organisation.web.dto.DepartmentInput;
import lk.AccessOne.shared.audit.AuditEvent;
import lk.AccessOne.shared.audit.AuditValue;
import lk.AccessOne.shared.enums.AuditAction;
import lk.AccessOne.shared.enums.EmploymentStatus;
import lk.AccessOne.shared.error.BusinessRuleException;
import lk.AccessOne.shared.service.EntityLookup;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DepartmentService {

    private final DepartmentRepository departments;
    private final EmployeeRepository employees;
    private final EntityLookup lookup;
    private final ApplicationEventPublisher events;
    private final ConfigMapper mapper;

    public DepartmentService(DepartmentRepository departments, EmployeeRepository employees,
                              EntityLookup lookup, ApplicationEventPublisher events,
                              ConfigMapper mapper) {
        this.departments = departments;
        this.employees = employees;
        this.lookup = lookup;
        this.events = events;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public List<DepartmentDto> findAll() {
        return departments.findAll().stream()
                .map(d -> mapper.toDto(d, employees.countByDepartmentId(d.getId())))
                .toList();
    }

    @Transactional
    public DepartmentDto create(DepartmentInput input) {
        if (departments.existsByDeptCodeIgnoreCase(input.deptCode())) {
            throw new BusinessRuleException("DUPLICATE_CODE",
                "A department with the code %s already exists."
                    .formatted(input.deptCode()));
        }
        Department department = departments.save(
                new Department(input.deptCode(), input.deptName(), input.description()));
        events.publishEvent(AuditEvent.created("departments", department.getId(),
                AuditValue.of().with("dept_code", input.deptCode()).json()));
        return mapper.toDto(department, 0);
    }

    @Transactional
    public DepartmentDto update(Long id, DepartmentInput input) {
        Department department = lookup.require(departments, id, "Department");
        department.rename(input.deptName(), input.description());
        events.publishEvent(new AuditEvent("departments", id, AuditAction.UPDATE, null, null));
        return mapper.toDto(department, employees.countByDepartmentId(id));
    }

    @Transactional
    public DepartmentDto deactivate(Long id) {
        Department department = lookup.require(departments, id, "Department");
        long staff = employees.countByDepartmentIdAndEmploymentStatus(
                id, EmploymentStatus.ACTIVE);

        // Not a refusal -- a warning the caller has to acknowledge. The
        // count goes back in the response so the UI can say how many.
        department.deactivate();
        events.publishEvent(new AuditEvent("departments", id, AuditAction.UPDATE,
                AuditValue.of().with("is_active", true).json(),
                AuditValue.of().with("is_active", false).json()));
        return mapper.toDto(department, staff);
    }

    @Transactional
    public DepartmentDto reactivate(Long id) {
        Department department = lookup.require(departments, id, "Department");
        department.reactivate();
        events.publishEvent(new AuditEvent("departments", id, AuditAction.UPDATE,
                AuditValue.of().with("is_active", false).json(),
                AuditValue.of().with("is_active", true).json()));
        return mapper.toDto(department, employees.countByDepartmentId(id));
    }

    @Transactional
    public void delete(Long id) {
        Department department = lookup.require(departments, id, "Department");
        long staff = employees.countByDepartmentId(id);

        if (staff > 0) {
            throw new BusinessRuleException("DEPARTMENT_IN_USE",
                ("%d employees belong to %s. Deactivate it instead -- deleting "
               + "would leave their employment history pointing at nothing.")
                    .formatted(staff, department.getDeptName()));
        }
        departments.delete(department);
        events.publishEvent(new AuditEvent("departments", id,
                AuditAction.DELETE, null, null));
    }
}
