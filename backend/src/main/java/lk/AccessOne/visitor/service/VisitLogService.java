package lk.AccessOne.visitor.service;

import lk.AccessOne.access.domain.Area;
import lk.AccessOne.access.repository.AreaRepository;
import lk.AccessOne.identity.domain.User;
import lk.AccessOne.identity.repository.UserRepository;
import lk.AccessOne.shared.audit.AuditEvent;
import lk.AccessOne.shared.audit.AuditValue;
import lk.AccessOne.shared.audit.CurrentUserProvider;
import lk.AccessOne.shared.audit.StatusChangeSupport;
import lk.AccessOne.shared.enums.AuditAction;
import lk.AccessOne.shared.enums.PassStatus;
import lk.AccessOne.shared.error.BusinessRuleException;
import lk.AccessOne.shared.service.EntityLookup;
import lk.AccessOne.visitor.domain.VisitLog;
import lk.AccessOne.visitor.domain.VisitorPass;
import lk.AccessOne.visitor.repository.OnSiteRepository;
import lk.AccessOne.visitor.repository.VisitLogRepository;
import lk.AccessOne.visitor.repository.VisitorPassRepository;
import lk.AccessOne.visitor.repository.VisitorReportRepository;
import lk.AccessOne.visitor.web.dto.DailyReportDto;
import lk.AccessOne.visitor.web.dto.OnSiteDto;
import lk.AccessOne.visitor.web.dto.VisitLogDto;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Service
public class VisitLogService {

    private final VisitorPassRepository passes;
    private final VisitLogRepository visitLogs;
    private final OnSiteRepository onSiteRepository;
    private final VisitorReportRepository reports;
    private final AreaRepository areas;
    private final UserRepository users;
    private final CurrentUserProvider currentUser;
    private final VisitorMapper mapper;
    private final EntityLookup lookup;
    private final StatusChangeSupport statusChanges;
    private final ApplicationEventPublisher events;

    public VisitLogService(VisitorPassRepository passes, VisitLogRepository visitLogs,
                            OnSiteRepository onSiteRepository, VisitorReportRepository reports,
                            AreaRepository areas, UserRepository users, CurrentUserProvider currentUser,
                            VisitorMapper mapper, EntityLookup lookup,
                            StatusChangeSupport statusChanges, ApplicationEventPublisher events) {
        this.passes = passes;
        this.visitLogs = visitLogs;
        this.onSiteRepository = onSiteRepository;
        this.reports = reports;
        this.areas = areas;
        this.users = users;
        this.currentUser = currentUser;
        this.mapper = mapper;
        this.lookup = lookup;
        this.statusChanges = statusChanges;
        this.events = events;
    }

    @Transactional
    public VisitLogDto checkIn(Long passId, Long areaId) {
        VisitorPass pass = lookup.require(passes, passId, "Visitor pass");
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);

        // The same check the door will make. If a pass would be refused
        // at an entry point, it must be refused at the desk too.
        if (!pass.isUsableAt(now)) {
            throw new BusinessRuleException("PASS_NOT_USABLE", pass.denialReasonAt(now));
        }

        visitLogs.findOpenForPass(passId).ifPresent(open -> {
            throw new BusinessRuleException("ALREADY_ON_SITE", "This visitor is already checked in.");
        });

        Area area = areaId == null ? null : lookup.require(areas, areaId, "Area");
        if (area != null && !pass.permits(area)) {
            throw new BusinessRuleException("AREA_NOT_PERMITTED",
                "%s does not permit entry to %s."
                    .formatted(pass.getAccessLevel().getLevelName(), area.getAreaName()));
        }

        VisitLog log = visitLogs.save(VisitLog.checkIn(pass, area, actingUser()));

        // First entry activates the pass. ISSUED means printed and handed
        // over; ACTIVE means in use on site.
        if (pass.getStatus() == PassStatus.ISSUED) {
            statusChanges.apply("visitor_passes", passId, pass::getStatus, pass::markActive);
        }

        events.publishEvent(AuditEvent.created("visit_logs", log.getId(),
                AuditValue.of().with("pass_no", pass.getPassNo()).json()));
        return mapper.toDto(log);
    }

    @Transactional
    public VisitLogDto checkOut(Long passId, String remarks) {
        VisitLog log = lookup.require(visitLogs.findOpenForPass(passId), "Open visit for pass", passId);
        log.checkOut(remarks);

        events.publishEvent(new AuditEvent("visit_logs", log.getId(),
                AuditAction.UPDATE, null, AuditValue.of().with("checked_out", true).json()));
        return mapper.toDto(log);
    }

    /** Derived from open logs, never from a stored flag that could drift. */
    @Transactional(readOnly = true)
    public List<OnSiteDto> onSite() {
        return onSiteRepository.findOnSite().stream().map(mapper::toOnSite).toList();
    }

    @Transactional(readOnly = true)
    public List<DailyReportDto> dailySummary(LocalDateTime fromDate) {
        return reports.dailySummary(fromDate).stream().map(mapper::toDto).toList();
    }

    private User actingUser() {
        return users.getReferenceById(currentUser.currentUserId());
    }
}
