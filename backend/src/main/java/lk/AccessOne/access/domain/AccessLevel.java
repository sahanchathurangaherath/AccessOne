package lk.AccessOne.access.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lk.AccessOne.shared.domain.AuditableEntity;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "access_levels")
public class AccessLevel extends AuditableEntity {

    @NotBlank
    @Size(max = 15)
    @Column(name = "level_code", nullable = false, length = 15, unique = true)
    private String levelCode;

    @NotBlank
    @Size(max = 80)
    @Column(name = "level_name", nullable = false, length = 80, unique = true)
    private String levelName;

    @Size(max = 255)
    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "access_level_areas",
        joinColumns        = @JoinColumn(name = "access_level_id"),
        inverseJoinColumns = @JoinColumn(name = "area_id")
    )
    private Set<Area> permittedAreas = new HashSet<>();

    protected AccessLevel() { }

    public AccessLevel(String levelCode, String levelName, String description) {
        this.levelCode = levelCode;
        this.levelName = levelName;
        this.description = description;
    }

    public void grant(Area area) { permittedAreas.add(area); }
    public void revoke(Area area) { permittedAreas.remove(area); }

    /** The single question the access decision engine asks in Phase 12. */
    public boolean permits(Area area) {
        return active && permittedAreas.contains(area);
    }

    public void deactivate() { this.active = false; }
    public void reactivate() { this.active = true; }

    public String getLevelCode() { return levelCode; }
    public String getLevelName() { return levelName; }
    public String getDescription() { return description; }
    public boolean isActive() { return active; }
    public Set<Area> getPermittedAreas() { return Set.copyOf(permittedAreas); }
}
