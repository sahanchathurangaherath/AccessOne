package lk.AccessOne.organisation.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lk.AccessOne.shared.domain.AuditableEntity;

@Entity
@Table(name = "departments")
public class Department extends AuditableEntity {

    @NotBlank
    @Size(max = 10)
    @Column(name = "dept_code", nullable = false, length = 10, unique = true)
    private String deptCode;

    @NotBlank
    @Size(max = 100)
    @Column(name = "dept_name", nullable = false, length = 100, unique = true)
    private String deptName;

    @Size(max = 255)
    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    protected Department() { }   // JPA

    public Department(String deptCode, String deptName, String description) {
        this.deptCode = deptCode;
        this.deptName = deptName;
        this.description = description;
    }

    /** Departments are deactivated, never deleted, once employees exist. */
    public void deactivate() { this.active = false; }
    public void reactivate() { this.active = true; }

    public String getDeptCode()   { return deptCode; }
    public String getDeptName()   { return deptName; }
    public String getDescription(){ return description; }
    public boolean isActive()     { return active; }

    public void rename(String deptName, String description) {
        this.deptName = deptName;
        this.description = description;
    }
}
