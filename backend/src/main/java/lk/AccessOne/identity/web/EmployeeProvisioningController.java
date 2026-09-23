package lk.AccessOne.identity.web;

import jakarta.validation.Valid;
import lk.AccessOne.identity.domain.PasswordResetToken;
import lk.AccessOne.identity.domain.Role;
import lk.AccessOne.identity.domain.User;
import lk.AccessOne.identity.repository.PasswordResetTokenRepository;
import lk.AccessOne.identity.repository.RoleRepository;
import lk.AccessOne.identity.repository.UserRepository;
import lk.AccessOne.identity.web.dto.EmployeeDetailDto;
import lk.AccessOne.identity.web.dto.EmployeeProvisioningRequest;
import lk.AccessOne.identity.web.dto.EmployeeRowDto;
import lk.AccessOne.identity.web.dto.ProvisionedEmployeeResponse;
import lk.AccessOne.identity.web.dto.UpdateEmployeeRequest;
import lk.AccessOne.notification.service.EmailService;
import lk.AccessOne.organisation.domain.Department;
import lk.AccessOne.organisation.domain.Employee;
import lk.AccessOne.organisation.repository.DepartmentRepository;
import lk.AccessOne.organisation.repository.EmployeeRepository;
import lk.AccessOne.shared.audit.AuditEvent;
import lk.AccessOne.shared.audit.AuditValue;
import lk.AccessOne.shared.enums.AuditAction;
import lk.AccessOne.shared.enums.EmploymentStatus;
import lk.AccessOne.shared.error.BusinessRuleException;
import lk.AccessOne.shared.error.ResourceNotFoundException;
import lk.AccessOne.shared.web.ApiPaths;
import lk.AccessOne.shared.web.PageResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Authoritative Employee and User administration endpoints for HR Managers & System Admins.
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
    private final EmailService emailService;
    private final PasswordResetTokenRepository resetTokens;
    private final String portalBaseUrl;

    public EmployeeProvisioningController(EmployeeRepository employees, UserRepository users,
                                          RoleRepository roles, DepartmentRepository departments,
                                          PasswordEncoder passwordEncoder,
                                          ApplicationEventPublisher events,
                                          EmailService emailService,
                                          PasswordResetTokenRepository resetTokens,
                                          @Value("${accessone.mail.portal-base-url:http://localhost:3000}") String portalBaseUrl) {
        this.employees = employees;
        this.users = users;
        this.roles = roles;
        this.departments = departments;
        this.passwordEncoder = passwordEncoder;
        this.events = events;
        this.emailService = emailService;
        this.resetTokens = resetTokens;
        this.portalBaseUrl = portalBaseUrl;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public PageResponse<EmployeeRowDto> list(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) EmploymentStatus status,
            @PageableDefault(size = 20) Pageable pageable) {

        Page<Employee> page = employees.searchEmployees(query, departmentId, status, pageable);
        return PageResponse.of(page, emp -> {
            Optional<User> userOpt = users.findByEmployeeIdAndActiveTrue(emp.getId());
            return new EmployeeRowDto(
                    emp.getId(),
                    emp.getEmpId(),
                    emp.getFirstName(),
                    emp.getLastName(),
                    emp.getFullName(),
                    emp.getNic(),
                    emp.getEmail(),
                    emp.getPhone(),
                    emp.getDesignation(),
                    emp.getDepartment().getId(),
                    emp.getDepartment().getDeptName(),
                    emp.getDepartment().getDeptCode(),
                    emp.getDateJoined(),
                    emp.getEmploymentStatus(),
                    emp.getPhotoPath(),
                    userOpt.map(User::getUsername).orElse(null),
                    userOpt.isPresent()
            );
        });
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public EmployeeDetailDto get(@PathVariable Long id) {
        Employee emp = employees.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", id));

        Optional<User> userOpt = users.findByEmployeeIdAndActiveTrue(emp.getId());

        return new EmployeeDetailDto(
                emp.getId(),
                emp.getEmpId(),
                emp.getFirstName(),
                emp.getLastName(),
                emp.getFullName(),
                emp.getNic(),
                emp.getEmail(),
                emp.getPhone(),
                emp.getDesignation(),
                emp.getDepartment().getId(),
                emp.getDepartment().getDeptName(),
                emp.getDepartment().getDeptCode(),
                emp.getDateJoined(),
                emp.getDateLeft(),
                emp.getEmploymentStatus(),
                emp.getPhotoPath(),
                userOpt.map(User::getId).orElse(null),
                userOpt.map(User::getUsername).orElse(null),
                userOpt.map(u -> u.getRole().getRoleName()).orElse(null),
                userOpt.map(User::isActive).orElse(false),
                userOpt.map(User::getLastLoginAt).orElse(null)
        );
    }

    @PutMapping("/{id}")
    @Transactional
    public EmployeeDetailDto update(@PathVariable Long id, @RequestBody @Valid UpdateEmployeeRequest body) {
        Employee emp = employees.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", id));

        // Ensure email uniqueness if changed
        if (!emp.getEmail().equalsIgnoreCase(body.email())) {
            employees.findByEmailIgnoreCase(body.email()).ifPresent(existing -> {
                if (!existing.getId().equals(id)) {
                    throw new BusinessRuleException("email-in-use", "Email already in use: " + body.email());
                }
            });
        }

        Department department = departments.findById(body.departmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department", body.departmentId()));

        emp.updateDetails(body.firstName(), body.lastName(), body.email(),
                body.phone(), body.designation(), department);

        events.publishEvent(new AuditEvent("employees", emp.getId(), AuditAction.UPDATE,
                null, AuditValue.of()
                        .with("empId", emp.getEmpId())
                        .with("email", emp.getEmail())
                        .with("designation", emp.getDesignation())
                        .with("deptId", department.getId())
                        .json()));

        Optional<User> userOpt = users.findByEmployeeIdAndActiveTrue(emp.getId());

        return new EmployeeDetailDto(
                emp.getId(),
                emp.getEmpId(),
                emp.getFirstName(),
                emp.getLastName(),
                emp.getFullName(),
                emp.getNic(),
                emp.getEmail(),
                emp.getPhone(),
                emp.getDesignation(),
                emp.getDepartment().getId(),
                emp.getDepartment().getDeptName(),
                emp.getDepartment().getDeptCode(),
                emp.getDateJoined(),
                emp.getDateLeft(),
                emp.getEmploymentStatus(),
                emp.getPhotoPath(),
                userOpt.map(User::getId).orElse(null),
                userOpt.map(User::getUsername).orElse(null),
                userOpt.map(u -> u.getRole().getRoleName()).orElse(null),
                userOpt.map(User::isActive).orElse(false),
                userOpt.map(User::getLastLoginAt).orElse(null)
        );
    }

    @PostMapping("/{id}/send-reset-email")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void sendPasswordResetEmail(@PathVariable Long id) {
        Employee emp = employees.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", id));

        User user = users.findByEmployeeIdAndActiveTrue(id)
                .orElseThrow(() -> new BusinessRuleException("no-user-account", "No active user account found for this employee."));

        if (emp.getEmail() == null || emp.getEmail().isBlank()) {
            throw new BusinessRuleException("no-email", "Employee has no registered email address.");
        }

        String token = UUID.randomUUID().toString().replace("-", "")
                + UUID.randomUUID().toString().replace("-", "");
        LocalDateTime expiresAt = LocalDateTime.now(ZoneOffset.UTC).plusMinutes(15);
        resetTokens.save(new PasswordResetToken(user, token, expiresAt));

        String resetLink = portalBaseUrl + "/login?resetToken=" + token;
        emailService.sendHtmlEmail(
                emp.getEmail(),
                "AccessOne Password Reset Request",
                "password-reset",
                Map.of(
                        "username", user.getUsername(),
                        "resetLink", resetLink
                )
        );
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

        emailService.sendHtmlEmail(
                employee.getEmail(),
                "Welcome to AccessOne - Your Account Credentials",
                "welcome-employee",
                Map.of(
                        "employeeName", employee.getFullName(),
                        "empId", employee.getEmpId(),
                        "username", username,
                        "temporaryPassword", temporaryPassword,
                        "loginUrl", portalBaseUrl + "/login"
                )
        );

        return new ProvisionedEmployeeResponse(employee.getId(), employee.getEmpId(),
                user.getId(), username, temporaryPassword);
    }

    private String generateTemporaryPassword() {
        StringBuilder password = new StringBuilder(TEMP_PASSWORD_LENGTH);
        for (int i = 0; i < TEMP_PASSWORD_LENGTH; i++) {
            password.append(TEMP_PASSWORD_ALPHABET.charAt(RANDOM.nextInt(TEMP_PASSWORD_ALPHABET.length())));
        }
        return password.toString();
    }
}
