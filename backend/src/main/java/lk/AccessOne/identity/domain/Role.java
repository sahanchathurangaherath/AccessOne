package lk.AccessOne.identity.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lk.AccessOne.shared.domain.BaseEntity;

import java.util.HashSet;
import java.util.Set;

/**
 * roles has a created_at column but no updated_at, so it extends BaseEntity
 * rather than AuditableEntity — role names are seeded, not edited.
 */
@Entity
@Table(name = "roles")
public class Role extends BaseEntity {

    @NotBlank
    @Size(max = 40)
    @Column(name = "role_name", nullable = false, length = 40, unique = true)
    private String roleName;

    @Size(max = 255)
    @Column(name = "description", length = 255)
    private String description;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "role_permissions",
        joinColumns        = @JoinColumn(name = "role_id"),
        inverseJoinColumns = @JoinColumn(name = "permission_id")
    )
    private Set<Permission> permissions = new HashSet<>();

    protected Role() { }

    public Role(String roleName, String description) {
        this.roleName = roleName;
        this.description = description;
    }

    public void grant(Permission permission) { permissions.add(permission); }
    public void revoke(Permission permission) { permissions.remove(permission); }
    public boolean hasPermission(Permission permission) { return permissions.contains(permission); }

    public String getRoleName() { return roleName; }
    public String getDescription() { return description; }
    public Set<Permission> getPermissions() { return Set.copyOf(permissions); }
}
