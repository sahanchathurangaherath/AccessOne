package lk.AccessOne.access.service;

import lk.AccessOne.access.domain.AccessLevel;
import lk.AccessOne.access.domain.Area;
import lk.AccessOne.access.domain.CardAccessAssignment;
import lk.AccessOne.access.web.dto.AccessLevelDto;
import lk.AccessOne.access.web.dto.AreaDto;
import lk.AccessOne.access.web.dto.AreaRef;
import lk.AccessOne.access.web.dto.AssignmentDto;
import lk.AccessOne.organisation.domain.Department;
import lk.AccessOne.organisation.web.dto.DepartmentDto;
import org.springframework.stereotype.Component;

/** Manual mapping only -- same reasoning as CardRequestMapper: not worth a library at this size. */
@Component
public class ConfigMapper {

    public DepartmentDto toDto(Department d, long employeeCount) {
        return new DepartmentDto(d.getId(), d.getDeptCode(), d.getDeptName(),
                d.getDescription(), d.isActive(), employeeCount, employeeCount == 0);
    }

    public AreaDto toDto(Area a, int levelCount) {
        return new AreaDto(a.getId(), a.getAreaCode(), a.getAreaName(), a.getBuilding(),
                a.getFloorNo(), a.isRestricted(), a.isActive(), a.getDescription(), levelCount);
    }

    public AccessLevelDto toDto(AccessLevel l) {
        return new AccessLevelDto(l.getId(), l.getLevelCode(), l.getLevelName(),
                l.getDescription(), l.isActive(),
                l.getPermittedAreas().stream()
                        .map(a -> new AreaRef(a.getId(), a.getAreaCode(), a.getAreaName()))
                        .sorted((a, b) -> a.areaCode().compareTo(b.areaCode()))
                        .toList());
    }

    public AssignmentDto toDto(CardAccessAssignment a) {
        return new AssignmentDto(a.getId(), a.getCardId(),
                a.getAccessLevel().getLevelCode(), a.getAccessLevel().getLevelName(),
                a.getAssignedBy().getUsername(), a.getValidFrom(),
                a.getRevokedAt(), a.isCurrent(), a.getRemarks());
    }
}
