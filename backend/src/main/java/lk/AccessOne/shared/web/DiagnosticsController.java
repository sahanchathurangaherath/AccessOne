package lk.AccessOne.shared.web;

import lk.AccessOne.identity.repository.UserRepository;
import lk.AccessOne.organisation.repository.DepartmentRepository;
import lk.AccessOne.organisation.repository.EmployeeRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Proves the stack end to end: entity mapping, repository, transaction, JSON
 * serialisation. Delete this controller in Phase 3, or lock it behind the
 * system administrator role — an unauthenticated row-count endpoint is a
 * small information leak.
 */
@RestController
@RequestMapping(ApiPaths.API_V1 + "/meta")
public class DiagnosticsController {

    private final DepartmentRepository departments;
    private final EmployeeRepository employees;
    private final UserRepository users;

    public DiagnosticsController(DepartmentRepository departments,
                                 EmployeeRepository employees,
                                 UserRepository users) {
        this.departments = departments;
        this.employees = employees;
        this.users = users;
    }

    @GetMapping("/counts")
    public Map<String, Long> counts() {
        return Map.of(
            "departments", departments.count(),
            "employees",   employees.count(),
            "users",       users.count()
        );
    }
}
