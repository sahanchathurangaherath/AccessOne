package lk.AccessOne.access.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lk.AccessOne.shared.domain.AuditableEntity;

@Entity
@Table(name = "areas")
public class Area extends AuditableEntity {

    @NotBlank
    @Size(max = 15)
    @Column(name = "area_code", nullable = false, length = 15, unique = true)
    private String areaCode;

    @NotBlank
    @Size(max = 100)
    @Column(name = "area_name", nullable = false, length = 100, unique = true)
    private String areaName;

    @Size(max = 60)
    @Column(name = "building", length = 60)
    private String building;

    @Size(max = 10)
    @Column(name = "floor_no", length = 10)
    private String floorNo;

    @Column(name = "is_restricted", nullable = false)
    private boolean restricted = false;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Size(max = 255)
    @Column(name = "description", length = 255)
    private String description;

    protected Area() { }

    public Area(String areaCode, String areaName, String building, String floorNo,
                boolean restricted, String description) {
        this.areaCode = areaCode;
        this.areaName = areaName;
        this.building = building;
        this.floorNo = floorNo;
        this.restricted = restricted;
        this.description = description;
    }

    public void deactivate() { this.active = false; }
    public void reactivate() { this.active = true; }

    public String getAreaCode() { return areaCode; }
    public String getAreaName() { return areaName; }
    public String getBuilding() { return building; }
    public String getFloorNo() { return floorNo; }
    public boolean isRestricted() { return restricted; }
    public boolean isActive() { return active; }
    public String getDescription() { return description; }
}
