package lk.AccessOne.entry.service;

import lk.AccessOne.access.domain.Area;
import lk.AccessOne.access.repository.AreaRepository;
import lk.AccessOne.entry.domain.SecurityAlert;
import lk.AccessOne.entry.repository.SecurityAlertRepository;
import lk.AccessOne.entry.web.dto.AlertDetail;
import lk.AccessOne.entry.web.dto.AlertRow;
import lk.AccessOne.identity.domain.User;
import lk.AccessOne.identity.repository.UserRepository;
import lk.AccessOne.identity.security.AccessOneUserDetails;
import lk.AccessOne.shared.enums.AlertStatus;
import lk.AccessOne.shared.error.BusinessRuleException;
import lk.AccessOne.shared.service.EntityLookup;
import lk.AccessOne.shared.web.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SecurityAlertService {

    private final SecurityAlertRepository alerts;
    private final AreaRepository areas;
    private final EntryMapper mapper;
    private final EntityLookup lookup;
    private final UserRepository users;

    public SecurityAlertService(SecurityAlertRepository alerts, AreaRepository areas, EntryMapper mapper,
                                 EntityLookup lookup, UserRepository users) {
        this.alerts = alerts;
        this.areas = areas;
        this.mapper = mapper;
        this.lookup = lookup;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public PageResponse<AlertRow> list(AlertStatus status, Pageable pageable) {
        return PageResponse.of(alerts.search(status, pageable), a -> mapper.toRow(a, areaName(a.getAreaId())));
    }

    @Transactional(readOnly = true)
    public AlertDetail findById(Long id) {
        SecurityAlert alert = lookup.require(alerts, id, "Security alert");
        return mapper.toDetail(alert, areaName(alert.getAreaId()));
    }

    @Transactional
    public AlertDetail acknowledge(Long id) {
        SecurityAlert alert = lookup.require(alerts, id, "Security alert");
        alert.acknowledge(actingUser());
        return mapper.toDetail(alert, areaName(alert.getAreaId()));
    }

    @Transactional
    public AlertDetail resolve(Long id) {
        SecurityAlert alert = lookup.require(alerts, id, "Security alert");
        alert.resolve(actingUser());
        return mapper.toDetail(alert, areaName(alert.getAreaId()));
    }

    @Transactional
    public AlertDetail dismiss(Long id) {
        SecurityAlert alert = lookup.require(alerts, id, "Security alert");
        alert.dismiss(actingUser());
        return mapper.toDetail(alert, areaName(alert.getAreaId()));
    }

    private String areaName(Long areaId) {
        if (areaId == null) return null;
        return areas.findById(areaId).map(Area::getAreaName).orElse("Unknown area");
    }

    private User actingUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AccessOneUserDetails details) {
            return users.getReferenceById(details.getUserId());
        }
        throw new BusinessRuleException("NO_ACTING_USER", "No authenticated user to record this action against.");
    }
}
