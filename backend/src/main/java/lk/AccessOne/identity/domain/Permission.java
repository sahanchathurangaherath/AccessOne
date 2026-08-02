package lk.AccessOne.identity.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.hibernate.Hibernate;

/**
 * permissions carries no timestamp columns at all, so — unlike every other
 * entity in this phase — it maps neither BaseEntity nor AuditableEntity.
 * Either superclass would add a created_at column ddl-auto: validate cannot
 * find in this table.
 */
@Entity
@Table(name = "permissions")
public class Permission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 60)
    @Column(name = "permission_code", nullable = false, length = 60, unique = true)
    private String permissionCode;

    @Size(max = 255)
    @Column(name = "description", length = 255)
    private String description;

    protected Permission() { }

    public Permission(String permissionCode, String description) {
        this.permissionCode = permissionCode;
        this.description = description;
    }

    public Long getId() { return id; }
    public String getPermissionCode() { return permissionCode; }
    public String getDescription() { return description; }

    @Override
    public boolean equals(Object other) {
        if (this == other) return true;
        if (!(other instanceof Permission that)) return false;
        if (!getClass().equals(Hibernate.getClass(other))) return false;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
