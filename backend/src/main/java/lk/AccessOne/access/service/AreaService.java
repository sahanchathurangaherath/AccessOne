package lk.AccessOne.access.service;

import lk.AccessOne.access.domain.Area;
import lk.AccessOne.access.repository.AccessLevelRepository;
import lk.AccessOne.access.repository.AreaRepository;
import lk.AccessOne.access.web.dto.AreaDto;
import lk.AccessOne.access.web.dto.AreaInput;
import lk.AccessOne.shared.audit.AuditEvent;
import lk.AccessOne.shared.enums.AuditAction;
import lk.AccessOne.shared.error.BusinessRuleException;
import lk.AccessOne.shared.service.EntityLookup;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AreaService {

    private final AreaRepository areas;
    private final AccessLevelRepository levels;
    private final EntityLookup lookup;
    private final ApplicationEventPublisher events;
    private final ConfigMapper mapper;

    public AreaService(AreaRepository areas, AccessLevelRepository levels, EntityLookup lookup,
                        ApplicationEventPublisher events, ConfigMapper mapper) {
        this.areas = areas;
        this.levels = levels;
        this.lookup = lookup;
        this.events = events;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public List<AreaDto> findAll() {
        return areas.findAll().stream()
                .map(a -> mapper.toDto(a, (int) levels.countGrantingArea(a.getId())))
                .toList();
    }

    @Transactional
    public AreaDto create(AreaInput input) {
        if (areas.existsByAreaCodeIgnoreCase(input.areaCode())) {
            throw new BusinessRuleException("DUPLICATE_CODE",
                "An area with the code %s already exists.".formatted(input.areaCode()));
        }
        Area area = areas.save(new Area(input.areaCode(), input.areaName(), input.building(),
                input.floorNo(), input.restricted(), input.description()));
        events.publishEvent(AuditEvent.created("areas", area.getId(),
                "{\"area_code\":\"%s\"}".formatted(input.areaCode())));
        return mapper.toDto(area, 0);
    }

    @Transactional
    public AreaDto update(Long id, AreaInput input) {
        Area area = lookup.require(areas, id, "Area");
        area.update(input.areaName(), input.building(), input.floorNo(),
                    input.restricted(), input.description());
        events.publishEvent(new AuditEvent("areas", id, AuditAction.UPDATE, null, null));
        return mapper.toDto(area, (int) levels.countGrantingArea(id));
    }

    @Transactional
    public AreaDto deactivate(Long id) {
        Area area = lookup.require(areas, id, "Area");
        area.deactivate();
        events.publishEvent(new AuditEvent("areas", id,
                AuditAction.UPDATE, "{\"is_active\":true}", "{\"is_active\":false}"));
        return mapper.toDto(area, (int) levels.countGrantingArea(id));
    }

    @Transactional
    public AreaDto reactivate(Long id) {
        Area area = lookup.require(areas, id, "Area");
        area.reactivate();
        events.publishEvent(new AuditEvent("areas", id,
                AuditAction.UPDATE, "{\"is_active\":false}", "{\"is_active\":true}"));
        return mapper.toDto(area, (int) levels.countGrantingArea(id));
    }

    /**
     * An area can never be deleted, only deactivated -- visit_logs,
     * access_logs and security_alerts all reference it with ON DELETE NO
     * ACTION, because deleting it would orphan security history. Unlike
     * a department, there is no "empty" case that makes this safe.
     */
    @Transactional
    public void delete(Long id) {
        Area area = lookup.require(areas, id, "Area");
        throw new BusinessRuleException("AREA_NOT_DELETABLE",
            "%s cannot be deleted -- access and visit logs refer to it permanently. Deactivate it instead."
                .formatted(area.getAreaName()));
    }
}
