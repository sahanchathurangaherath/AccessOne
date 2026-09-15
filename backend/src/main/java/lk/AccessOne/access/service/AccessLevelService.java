package lk.AccessOne.access.service;

import lk.AccessOne.access.domain.AccessLevel;
import lk.AccessOne.access.domain.Area;
import lk.AccessOne.access.domain.CardAccessAssignment;
import lk.AccessOne.access.repository.AccessLevelRepository;
import lk.AccessOne.access.repository.AreaRepository;
import lk.AccessOne.access.repository.CardAccessAssignmentRepository;
import lk.AccessOne.access.web.dto.AccessLevelDto;
import lk.AccessOne.access.web.dto.AccessLevelInput;
import lk.AccessOne.access.web.dto.AccessTestResult;
import lk.AccessOne.access.web.dto.AssignmentDto;
import lk.AccessOne.access.web.dto.MatrixColumn;
import lk.AccessOne.access.web.dto.MatrixRow;
import lk.AccessOne.access.web.dto.PermissionMatrix;
import lk.AccessOne.identity.domain.User;
import lk.AccessOne.identity.repository.UserRepository;
import lk.AccessOne.shared.audit.AuditEvent;
import lk.AccessOne.shared.audit.AuditValue;
import lk.AccessOne.shared.audit.CurrentUserProvider;
import lk.AccessOne.shared.enums.AuditAction;
import lk.AccessOne.shared.error.BusinessRuleException;
import lk.AccessOne.shared.service.EntityLookup;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class AccessLevelService {

    private final AccessLevelRepository levels;
    private final AreaRepository areas;
    private final CardAccessAssignmentRepository assignments;
    private final EntityLookup lookup;
    private final ApplicationEventPublisher events;
    private final ConfigMapper mapper;
    private final CurrentUserProvider currentUser;
    private final UserRepository users;

    public AccessLevelService(AccessLevelRepository levels, AreaRepository areas,
                               CardAccessAssignmentRepository assignments, EntityLookup lookup,
                               ApplicationEventPublisher events, ConfigMapper mapper,
                               CurrentUserProvider currentUser, UserRepository users) {
        this.levels = levels;
        this.areas = areas;
        this.assignments = assignments;
        this.lookup = lookup;
        this.events = events;
        this.mapper = mapper;
        this.currentUser = currentUser;
        this.users = users;
    }

    // ---------- CRUD ----------

    @Transactional(readOnly = true)
    public List<AccessLevelDto> findAll() {
        return levels.findAllWithAreas().stream().map(mapper::toDto).toList();
    }

    @Transactional(readOnly = true)
    public AccessLevelDto findById(Long id) {
        return mapper.toDto(lookup.require(levels.findWithAreas(id), "Access level", id));
    }

    @Transactional
    public AccessLevelDto create(AccessLevelInput input) {
        if (levels.existsByLevelCodeIgnoreCase(input.levelCode())) {
            throw new BusinessRuleException("DUPLICATE_CODE",
                "An access level with the code %s already exists.".formatted(input.levelCode()));
        }
        AccessLevel level = levels.save(
                new AccessLevel(input.levelCode(), input.levelName(), input.description()));
        events.publishEvent(AuditEvent.created("access_levels", level.getId(),
                AuditValue.of().with("level_code", input.levelCode()).json()));
        return mapper.toDto(level);
    }

    @Transactional
    public AccessLevelDto update(Long id, AccessLevelInput input) {
        AccessLevel level = lookup.require(levels.findWithAreas(id), "Access level", id);
        level.update(input.levelName(), input.description());
        events.publishEvent(new AuditEvent("access_levels", id, AuditAction.UPDATE, null, null));
        return mapper.toDto(level);
    }

    @Transactional
    public AccessLevelDto deactivate(Long id) {
        AccessLevel level = lookup.require(levels.findWithAreas(id), "Access level", id);
        level.deactivate();
        events.publishEvent(new AuditEvent("access_levels", id, AuditAction.UPDATE,
                AuditValue.of().with("is_active", true).json(),
                AuditValue.of().with("is_active", false).json()));
        return mapper.toDto(level);
    }

    @Transactional
    public AccessLevelDto reactivate(Long id) {
        AccessLevel level = lookup.require(levels.findWithAreas(id), "Access level", id);
        level.reactivate();
        events.publishEvent(new AuditEvent("access_levels", id, AuditAction.UPDATE,
                AuditValue.of().with("is_active", false).json(),
                AuditValue.of().with("is_active", true).json()));
        return mapper.toDto(level);
    }

    // ---------- level-to-area mapping ----------

    @Transactional
    public AccessLevelDto replaceAreas(Long levelId, Set<Long> areaIds) {
        AccessLevel level = lookup.require(levels.findWithAreas(levelId),
                                           "Access level", levelId);

        Set<Area> before = level.getPermittedAreas();
        Set<Area> after  = new HashSet<>(areas.findAllById(areaIds));

        if (after.size() != areaIds.size()) {
            throw new BusinessRuleException("AREA_NOT_FOUND",
                "One or more of the selected areas no longer exists.");
        }

        level.replaceAreas(after);

        // The audit entry records what changed, not just that something did.
        events.publishEvent(new AuditEvent("access_levels", levelId,
                AuditAction.UPDATE, codesJson(before), codesJson(after)));

        return mapper.toDto(level);
    }

    private String codesJson(Set<Area> areaSet) {
        return AuditValue.of()
                .withList("areas", areaSet.stream().map(Area::getAreaCode).toList())
                .json();
    }

    // ---------- the permission matrix ----------

    /**
     * Never cache this. A revoked permission must take effect immediately;
     * a cache would leave someone holding access they no longer have,
     * which is precisely the failure the system exists to prevent. It is
     * one query with a fetch join at these volumes -- the cache would buy
     * nothing and cost correctness.
     */
    @Transactional(readOnly = true)
    public PermissionMatrix matrix() {
        List<AccessLevel> levelList = levels.findAllWithAreas();
        List<Area> areaList = areas.findByActiveTrueOrderByBuildingAscAreaNameAsc();

        List<MatrixRow> rows = levelList.stream()
                .map(level -> new MatrixRow(
                        level.getId(), level.getLevelCode(), level.getLevelName(),
                        level.isActive(),
                        areaList.stream().map(level::permits).toList()))
                .toList();

        return new PermissionMatrix(
                areaList.stream().map(a -> new MatrixColumn(
                        a.getId(), a.getAreaCode(), a.getAreaName(), a.isRestricted()))
                        .toList(),
                rows);
    }

    // ---------- the rule test ----------

    /**
     * Same method the Phase 12 engine will call, so what this reports is
     * what the door will do.
     */
    @Transactional(readOnly = true)
    public AccessTestResult test(Long levelId, Long areaId) {
        AccessLevel level = lookup.require(levels.findWithAreas(levelId),
                                           "Access level", levelId);
        Area area = lookup.require(areas, areaId, "Area");

        boolean granted = level.permits(area);
        return new AccessTestResult(
                granted,
                level.getLevelName(), area.getAreaName(), area.isRestricted(),
                granted ? null : explainDenial(level, area));
    }

    private String explainDenial(AccessLevel level, Area area) {
        if (!level.isActive())        return "The access level is deactivated.";
        if (!area.isReachable())      return "The area is deactivated.";
        return "%s does not include %s.".formatted(level.getLevelName(), area.getAreaName());
    }

    // ---------- card-level assignment ----------

    @Transactional
    public AssignmentDto assign(Long cardId, Long levelId, String remarks) {
        AccessLevel level = lookup.require(levels, levelId, "Access level");

        if (!level.isActive()) {
            throw new BusinessRuleException("LEVEL_INACTIVE",
                "%s is deactivated and cannot be assigned.".formatted(level.getLevelName()));
        }

        // Supersede rather than delete. The previous grant is a record of
        // a decision somebody made, and it stays.
        assignments.findCurrentForCard(cardId).ifPresent(current -> {
            if (current.getAccessLevel().getId().equals(levelId)) {
                throw new BusinessRuleException("ALREADY_ASSIGNED",
                    "This card already holds %s.".formatted(level.getLevelName()));
            }
            current.supersede();
        });

        CardAccessAssignment assignment = assignments.save(new CardAccessAssignment(
                cardId, level, actingUser(), LocalDate.now(), remarks));

        events.publishEvent(AuditEvent.created("card_access_assignments",
                assignment.getId(),
                AuditValue.of().with("card_id", cardId).with("level", level.getLevelCode()).json()));

        return mapper.toDto(assignment);
    }

    @Transactional(readOnly = true)
    public List<AssignmentDto> history(Long cardId) {
        return assignments.findHistoryForCard(cardId).stream().map(mapper::toDto).toList();
    }

    private User actingUser() {
        return users.getReferenceById(currentUser.currentUserId());
    }
}
