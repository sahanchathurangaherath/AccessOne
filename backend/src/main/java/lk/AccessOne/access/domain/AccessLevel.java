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
import lk.AccessOne.shared.error.BusinessRuleException;

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

    /**
     * The many-to-many is managed entirely through access_level_areas.
     * Permitted areas are rows, never a delimited column -- that is the
     * 1NF argument in the normalisation notes, in code.
     *
     * The join table carries created_at, which this mapping does not
     * populate; it has a database default. Hibernate's validate only
     * checks columns you mapped, so this is fine.
     */
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

    /**
     * The single question the access decision engine asks, in Phase 12.
     *
     * Pure and side-effect free on purpose: it runs on every entry
     * attempt, and anything that writes or logs here would be executed
     * thousands of times a day.
     */
    public boolean permits(Area area) {
        return active && area != null && area.isReachable()
            && permittedAreas.contains(area);
    }

    public void grant(Area area) {
        if (!area.isReachable()) {
            throw new BusinessRuleException("AREA_INACTIVE",
                "Reactivate the area before granting access to it.");
        }
        permittedAreas.add(area);
    }

    public void revoke(Area area) {
        permittedAreas.remove(area);
    }

    /** Replaces the whole mapping in one operation. */
    public void replaceAreas(Set<Area> areas) {
        areas.stream().filter(a -> !a.isReachable()).findFirst()
             .ifPresent(a -> { throw new BusinessRuleException("AREA_INACTIVE",
                 "Cannot grant access to the deactivated area " + a.getAreaName() + "."); });
        permittedAreas.clear();
        permittedAreas.addAll(areas);
    }

    public void update(String levelName, String description) {
        this.levelName = levelName;
        this.description = description;
    }

    public void deactivate() { this.active = false; }
    public void reactivate() { this.active = true; }

    public String getLevelCode() { return levelCode; }
    public String getLevelName() { return levelName; }
    public String getDescription() { return description; }
    public boolean isActive() { return active; }
    public Set<Area> getPermittedAreas() { return Set.copyOf(permittedAreas); }
}
