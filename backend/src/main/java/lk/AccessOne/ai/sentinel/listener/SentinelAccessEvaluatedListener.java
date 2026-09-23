package lk.AccessOne.ai.sentinel.listener;

import lk.AccessOne.ai.sentinel.service.PrivilegeCreepDetectorService;
import lk.AccessOne.ai.sentinel.service.SpatioTemporalSentinelService;
import lk.AccessOne.entry.event.AccessEvaluated;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Physical Security Sentinel Event Listener:
 * Watches the entry decision stream for spatio-temporal anomalies and impossible travel
 * without blocking the low-latency decision path.
 */
@Component
public class SentinelAccessEvaluatedListener {

    private static final Logger log = LoggerFactory.getLogger(SentinelAccessEvaluatedListener.class);

    private final SpatioTemporalSentinelService sentinelService;
    private final PrivilegeCreepDetectorService privilegeCreepService;

    public SentinelAccessEvaluatedListener(
            SpatioTemporalSentinelService sentinelService,
            PrivilegeCreepDetectorService privilegeCreepService) {
        this.sentinelService = sentinelService;
        this.privilegeCreepService = privilegeCreepService;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void on(AccessEvaluated event) {
        try {
            // Check for impossible travel / badge cloning
            sentinelService.checkImpossibleTravel(event);

            // Check for off-hours restricted access
            privilegeCreepService.checkOffHoursAnomaly(event);

        } catch (Exception ex) {
            log.error("Sentinel failed to analyze access event for log #{}: {}", event.logId(), ex.getMessage());
        }
    }
}
