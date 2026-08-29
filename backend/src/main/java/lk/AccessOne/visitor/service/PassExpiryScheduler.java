package lk.AccessOne.visitor.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.ParameterMode;
import jakarta.persistence.StoredProcedureQuery;
import lk.AccessOne.shared.audit.AuditEvent;
import lk.AccessOne.shared.enums.PassStatus;
import lk.AccessOne.visitor.domain.VisitorPass;
import lk.AccessOne.visitor.event.PassExpiringSoon;
import lk.AccessOne.visitor.repository.VisitLogRepository;
import lk.AccessOne.visitor.repository.VisitorPassRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

/**
 * The tidy-up sweep. It keeps the stored status accurate for reporting
 * and for the on-site board.
 *
 * It is NOT the security mechanism. VisitorPass.isUsableAt() checks the
 * window on every decision, so an expired pass is refused whether or not
 * this job has run. If it were the only check, a stopped scheduler would
 * silently keep granting access -- which is precisely the failure mode
 * worth designing out.
 */
@Component
public class PassExpiryScheduler {

    private final VisitorPassRepository passes;
    private final VisitLogRepository visitLogs;
    private final EntityManager entityManager;
    private final ApplicationEventPublisher events;

    public PassExpiryScheduler(VisitorPassRepository passes, VisitLogRepository visitLogs,
                                EntityManager entityManager, ApplicationEventPublisher events) {
        this.passes = passes;
        this.visitLogs = visitLogs;
        this.entityManager = entityManager;
        this.events = events;
    }

    @Scheduled(fixedDelayString = "PT5M")
    @Transactional
    public void sweep() {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);

        List<VisitorPass> lapsed = passes.findLapsed(now);
        for (VisitorPass pass : lapsed) {
            pass.markExpired();
            events.publishEvent(AuditEvent.statusChanged(
                    "visitor_passes", pass.getId(), PassStatus.ACTIVE, PassStatus.EXPIRED));

            // Do not leave an expired visitor on the on-site board forever.
            visitLogs.findOpenForPass(pass.getId()).ifPresent(log ->
                    log.closeAt(pass.getValidUntil(), "Auto-closed on pass expiry"));
        }
    }

    /**
     * A pass about to lapse, not one that already has -- the host still
     * has time to see the visitor out. The window is exactly as wide as
     * the sweep's own cadence (5 minutes), so consecutive runs tile the
     * timeline with no gap and no overlap: a pass reaches this window in
     * exactly one run, never zero and never two.
     */
    @Scheduled(fixedDelayString = "PT5M")
    @Transactional
    public void notifyExpiringPasses() {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        for (VisitorPass pass : passes.findExpiringBetween(now.plusMinutes(25), now.plusMinutes(30))) {
            events.publishEvent(new PassExpiringSoon(
                    pass.getId(), pass.getHostEmployee().getId(),
                    pass.getVisitor().getFullName(), pass.getValidUntil()));
        }
    }

    /**
     * The Phase 1 stored procedure does the same work set-based. Either is
     * defensible; this Java sweep publishes audit events, which the
     * procedure cannot -- exposed here so the procedure can be
     * demonstrated on its own via an admin endpoint.
     */
    @Transactional
    public int runStoredProcedureSweep() {
        StoredProcedureQuery query = entityManager
                .createStoredProcedureQuery("dbo.sp_expire_visitor_passes")
                .registerStoredProcedureParameter("p_expired_count", Integer.class, ParameterMode.OUT);
        query.execute();
        return (Integer) query.getOutputParameterValue("p_expired_count");
    }
}
