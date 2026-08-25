package lk.AccessOne.entry.alert;

import lk.AccessOne.access.domain.Area;
import lk.AccessOne.access.repository.AreaRepository;
import lk.AccessOne.entry.decision.AccessDecisionResult;
import lk.AccessOne.entry.decision.AccessRequest;
import lk.AccessOne.entry.domain.SecurityAlert;
import lk.AccessOne.entry.event.AccessEvaluated;
import lk.AccessOne.entry.repository.AccessLogRepository;
import lk.AccessOne.entry.repository.SecurityAlertRepository;
import lk.AccessOne.shared.enums.AlertSeverity;
import lk.AccessOne.shared.enums.AlertType;
import lk.AccessOne.shared.enums.Direction;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.Duration;

/**
 * The engine publishes; this listener decides what is suspicious. Adding a
 * rule later touches nothing in the decision path (Observer pattern).
 */
@Component
public class SecurityAlertListener {

    private static final int DENIAL_THRESHOLD = 3;
    private static final Duration WINDOW = Duration.ofMinutes(10);

    private final SecurityAlertRepository alerts;
    private final AccessLogRepository accessLogs;
    private final AreaRepository areas;

    public SecurityAlertListener(SecurityAlertRepository alerts, AccessLogRepository accessLogs,
                                  AreaRepository areas) {
        this.alerts = alerts;
        this.accessLogs = accessLogs;
        this.areas = areas;
    }

    /**
     * AFTER_COMMIT, so an alert only exists for an attempt that was
     * actually recorded. A fresh transaction (REQUIRES_NEW), because the
     * one that recorded the log has already committed by the time this runs.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(AccessEvaluated event) {
        AccessDecisionResult decision = event.decision();

        if (decision.granted()) {
            checkRestrictedAreaEntry(event);
            checkAfterHours(event);
            return;
        }

        switch (decision.denialReason()) {
            case CARD_BLACKLISTED, VISITOR_BLACKLISTED ->
                raise(AlertType.BLACKLIST_ATTEMPT, AlertSeverity.CRITICAL, event,
                      "%s attempted entry to %s with a blacklisted credential."
                          .formatted(decision.holderName(), decision.areaName()));

            case CARD_NOT_ACTIVE ->
                raise(AlertType.REVOKED_CARD_USE, AlertSeverity.HIGH, event,
                      "Card %s (%s) was presented at %s but is not active."
                          .formatted(decision.credentialRef(), decision.holderName(), decision.areaName()));

            case PASS_EXPIRED ->
                raise(AlertType.EXPIRED_PASS_USE, AlertSeverity.MEDIUM, event,
                      "Expired pass %s was presented at %s."
                          .formatted(decision.credentialRef(), decision.areaName()));

            case AREA_NOT_PERMITTED -> {
                if (isRestricted(decision.areaId())) {
                    raise(AlertType.RESTRICTED_AREA_ATTEMPT, AlertSeverity.HIGH, event,
                          "%s attempted entry to the restricted area %s."
                              .formatted(decision.holderName(), decision.areaName()));
                }
            }
            default -> { }
        }

        checkRepeatedDenials(event);
    }

    /**
     * Three refusals for one credential inside ten minutes. One denial is
     * a wrong door; three is somebody trying doors.
     */
    private void checkRepeatedDenials(AccessEvaluated event) {
        String ref = event.decision().credentialRef();
        AccessRequest request = event.request();

        long recent = accessLogs.countRecentDenials(ref, request.at().minus(WINDOW));
        if (recent < DENIAL_THRESHOLD) return;

        // Do not re-raise while an alert for this credential is still open,
        // or a persistent attempt buries the dashboard in duplicates.
        if (alerts.countOpenRepeatedDenialAlerts(ref, request.at().minus(WINDOW)) > 0) return;

        raise(AlertType.REPEATED_DENIAL, AlertSeverity.HIGH, event,
              "%d denied attempts for %s in the last %d minutes."
                  .formatted(recent, ref, WINDOW.toMinutes()));
    }

    /** A granted entry to a restricted area is still worth recording. */
    private void checkRestrictedAreaEntry(AccessEvaluated event) {
        if (event.request().direction() == Direction.IN && isRestricted(event.decision().areaId())) {
            raise(AlertType.RESTRICTED_AREA_ATTEMPT, AlertSeverity.LOW, event,
                  "%s entered the restricted area %s."
                      .formatted(event.decision().holderName(), event.decision().areaName()));
        }
    }

    private void checkAfterHours(AccessEvaluated event) {
        int hour = event.request().at().getHour();
        if (hour >= 20 || hour < 6) {
            raise(AlertType.AFTER_HOURS_ACCESS, AlertSeverity.LOW, event,
                  "%s entered %s at %s."
                      .formatted(event.decision().holderName(), event.decision().areaName(),
                                 event.request().at().toLocalTime()));
        }
    }

    private boolean isRestricted(Long areaId) {
        if (areaId == null) return false;
        return areas.findById(areaId).map(Area::isRestricted).orElse(false);
    }

    private void raise(AlertType type, AlertSeverity severity, AccessEvaluated event, String message) {
        alerts.save(SecurityAlert.raise(type, severity, message, event.logId(), event.decision().areaId()));
    }
}
