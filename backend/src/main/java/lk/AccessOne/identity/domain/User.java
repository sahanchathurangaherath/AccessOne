package lk.AccessOne.identity.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lk.AccessOne.organisation.domain.Employee;
import lk.AccessOne.shared.domain.AuditableEntity;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User extends AuditableEntity {

    @NotBlank
    @Size(max = 50)
    @Column(name = "username", nullable = false, length = 50, unique = true)
    private String username;

    /** Never expose this in a DTO — write-only from the application's perspective. */
    @NotBlank
    @Size(max = 100)
    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id")
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "failed_login_attempts", nullable = false)
    private short failedLoginAttempts = 0;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    protected User() { }

    public User(String username, String passwordHash, Employee employee, Role role) {
        this.username = username;
        this.passwordHash = passwordHash;
        this.employee = employee;
        this.role = role;
    }

    public void deactivate() { this.active = false; }
    public void activate() { this.active = true; }

    public String getUsername() { return username; }
    public String getPasswordHash() { return passwordHash; }
    public Employee getEmployee() { return employee; }
    public Role getRole() { return role; }
    public boolean isActive() { return active; }
    public short getFailedLoginAttempts() { return failedLoginAttempts; }
    public LocalDateTime getLastLoginAt() { return lastLoginAt; }
}
