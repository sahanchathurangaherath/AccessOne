package lk.AccessOne.identity.web;

import jakarta.validation.Valid;
import lk.AccessOne.identity.domain.Role;
import lk.AccessOne.identity.domain.User;
import lk.AccessOne.identity.repository.RoleRepository;
import lk.AccessOne.identity.repository.UserRepository;
import lk.AccessOne.identity.web.dto.EmployeeProvisioningRequest;
import lk.AccessOne.identity.web.dto.ProvisionedEmployeeResponse;
import lk.AccessOne.organisation.domain.Department;
import lk.AccessOne.organisation.domain.Employee;
import lk.AccessOne.organisation.repository.DepartmentRepository;
import lk.AccessOne.organisation.repository.EmployeeRepository;
import lk.AccessOne.shared.audit.AuditEvent;
import lk.AccessOne.shared.audit.AuditValue;
import lk.AccessOne.shared.enums.AuditAction;
import lk.AccessOne.shared.error.BusinessRuleException;
import lk.AccessOne.shared.error.ResourceNotFoundException;
import lk.AccessOne.shared.web.ApiPaths;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.security.SecureRandom;

/**
 * The only place an Employee/User pair is created outside a DB migration.
 * Restricted to HR_MANAGER/SYSTEM_ADMIN by SecurityConfig -- there is no
 * public registration endpoint anywhere in this API.
 */
@RestController
@RequestMapping(ApiPaths.API_V1 + "/admin/employees")
public class EmployeeProvisioningController {

    private static final String TEMP_PASSWORD_ALPHABET =
            "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    private static final int TEMP_PASSWORD_LENGTH = 12;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final EmployeeRepository employees;
    private final UserRepository users;
    private final RoleRepository roles;
    private final DepartmentRepository departments;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationEventPublisher events;

    public EmployeeProvisioningController(EmployeeRepository employees, UserRepository users,
                                          RoleRepository roles, DepartmentRepository departments,
                                          PasswordEncoder passwordEncoder,
                                          ApplicationEventPublisher events) {
        this.employees = employees;
        this.users = users;
        this.roles = roles;
        this.departments = departments;
        this.passwordEncoder = passwordEncoder;
        this.events = events;
    }

    @PostMapping("/provision")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public ProvisionedEmployeeResponse provision(@RequestBody @Valid EmployeeProvisioningRequest body) {
        if (employees.findByEmpId(body.empId()).isPresent()) {
            throw new BusinessRuleException("employee-exists", "Employee already exists: " + body.empId());
        }
        if (employees.findByEmailIgnoreCase(body.email()).isPresent()) {
            throw new BusinessRuleException("email-in-use", "Email already in use: " + body.email());
        }

        Department department = departments.findById(body.departmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department", body.departmentId()));

        Employee employee = new Employee(body.empId(), body.firstName(), body.lastName(), body.nic(),
                body.email(), body.phone(), body.designation(), department, body.dateJoined());
        employees.save(employee);

        String username = body.empId().toLowerCase();
        if (users.existsByUsernameIgnoreCase(username)) {
            throw new BusinessRuleException("username-taken", "Username already taken: " + username);
        }

        Role employeeRole = roles.findByRoleName("EMPLOYEE")
                .orElseThrow(() -> new ResourceNotFoundException("Role", "EMPLOYEE"));

        String temporaryPassword = generateTemporaryPassword();
        User user = new User(username, passwordEncoder.encode(temporaryPassword), employee, employeeRole);
        users.save(user);

        events.publishEvent(new AuditEvent("employees", employee.getId(), AuditAction.CREATE,
                null, AuditValue.of().with("empId", employee.getEmpId())
                                     .with("email", employee.getEmail()).json()));
        events.publishEvent(new AuditEvent("users", user.getId(), AuditAction.CREATE,
                null, AuditValue.of().with("username", username).with("role", "EMPLOYEE").json()));

        return new ProvisionedEmployeeResponse(employee.getId(), employee.getEmpId(),
                user.getId(), username, temporaryPassword);
    }

    /**
     * Returned once, in this response, and never stored in plaintext or
     * logged -- the employee is forced to replace it via
     * POST /api/v1/auth/change-password on first login.
     */
    private String generateTemporaryPassword() {
        StringBuilder password = new StringBuilder(TEMP_PASSWORD_LENGTH);
        for (int i = 0; i < TEMP_PASSWORD_LENGTH; i++) {
            password.append(TEMP_PASSWORD_ALPHABET.charAt(RANDOM.nextInt(TEMP_PASSWORD_ALPHABET.length())));
        }
        return password.toString();
    }
}
