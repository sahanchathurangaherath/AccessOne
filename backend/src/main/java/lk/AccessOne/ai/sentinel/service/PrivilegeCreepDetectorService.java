package lk.AccessOne.ai.sentinel.service;

import lk.AccessOne.access.domain.Area;
import lk.AccessOne.access.repository.AreaRepository;
import lk.AccessOne.ai.config.AiProperties;
import lk.AccessOne.entry.decision.AccessDecisionResult;
import lk.AccessOne.entry.domain.SecurityAlert;
import lk.AccessOne.entry.event.AccessEvaluated;
import lk.AccessOne.entry.repository.SecurityAlertRepository;
import lk.AccessOne.shared.enums.AlertSeverity;
import lk.AccessOne.shared.enums.AlertType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Optional;

@Service
public class PrivilegeCreepDetectorService {

    private static final Logger log = LoggerFactory.getLogger(PrivilegeCreepDetectorService.class);

    private static final LocalTime SHIFT_START = LocalTime.of(6, 0);
    private static final LocalTime SHIFT_END = LocalTime.of(21, 0);

    private final AiProperties aiProperties;
    private final AreaRepository areaRepository;
    private final SecurityAlertRepository securityAlertRepository;

    public PrivilegeCreepDetectorService(
            AiProperties aiProperties,
            AreaRepository areaRepository,
            SecurityAlertRepository securityAlertRepository) {
        this.aiProperties = aiProperties;
        this.areaRepository = areaRepository;
        this.securityAlertRepository = securityAlertRepository;
    }

    /**
     * Detects anomalous off-hours access or privilege creep in restricted security zones.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Optional<SecurityAlert> checkOffHoursAnomaly(AccessEvaluated event) {
        if (!aiProperties.isEnabled()) {
            return Optional.empty();
        }

        AccessDecisionResult decision = event.decision();
        Long areaId = decision.areaId();
        LocalDateTime scanTime = event.occurredAt();

        Area area = areaRepository.findById(areaId).orElse(null);
        if (area == null || !area.isRestricted()) {
            return Optional.empty();
        }

        LocalTime time = scanTime.toLocalTime();
        DayOfWeek day = scanTime.getDayOfWeek();

        boolean isOffHours = time.isBefore(SHIFT_START) || time.isAfter(SHIFT_END)
            || day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY;

        if (isOffHours && decision.granted()) {
            String message = "Off-hours anomaly: %s accessed restricted zone %s (%s) outside scheduled business hours at %s on %s."
                .formatted(
                    decision.holderName(),
                    area.getAreaName(),
                    area.getBuilding(),
                    time.toString().substring(0, 5),
                    day.toString()
                );

            log.warn("SENTINEL OFF-HOURS ALERT: {}", message);

            SecurityAlert alert = SecurityAlert.raise(
                AlertType.OFF_HOURS_ANOMALY,
                AlertSeverity.HIGH,
                message,
                event.logId(),
                areaId
            );

            return Optional.of(securityAlertRepository.save(alert));
        }

        return Optional.empty();
    }
}
