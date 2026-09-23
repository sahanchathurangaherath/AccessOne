package lk.AccessOne.ai.sentinel.service;

import lk.AccessOne.access.domain.Area;
import lk.AccessOne.access.repository.AreaRepository;
import lk.AccessOne.ai.config.AiProperties;
import lk.AccessOne.ai.sentinel.domain.AreaCoordinate;
import lk.AccessOne.entry.decision.AccessDecisionResult;
import lk.AccessOne.entry.domain.AccessLog;
import lk.AccessOne.entry.domain.SecurityAlert;
import lk.AccessOne.entry.event.AccessEvaluated;
import lk.AccessOne.entry.repository.AccessLogRepository;
import lk.AccessOne.entry.repository.SecurityAlertRepository;
import lk.AccessOne.shared.enums.AlertSeverity;
import lk.AccessOne.shared.enums.AlertType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class SpatioTemporalSentinelService {

    private static final Logger log = LoggerFactory.getLogger(SpatioTemporalSentinelService.class);

    private final AiProperties aiProperties;
    private final AreaRepository areaRepository;
    private final AccessLogRepository accessLogRepository;
    private final SecurityAlertRepository securityAlertRepository;

    public SpatioTemporalSentinelService(
            AiProperties aiProperties,
            AreaRepository areaRepository,
            AccessLogRepository accessLogRepository,
            SecurityAlertRepository securityAlertRepository) {
        this.aiProperties = aiProperties;
        this.areaRepository = areaRepository;
        this.accessLogRepository = accessLogRepository;
        this.securityAlertRepository = securityAlertRepository;
    }

    /**
     * Inspects a newly evaluated scan against the credential's spatio-temporal history.
     * Detects impossible travel (e.g. badge clone or impossible walking speed between buildings).
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Optional<SecurityAlert> checkImpossibleTravel(AccessEvaluated event) {
        if (!aiProperties.isEnabled()) {
            return Optional.empty();
        }

        AccessDecisionResult decision = event.decision();
        String credentialRef = decision.credentialRef();
        Long currentAreaId = decision.areaId();
        Long currentLogId = event.logId();
        LocalDateTime currentScanTime = event.occurredAt();

        // 1. Fetch current area details
        Area currentArea = areaRepository.findById(currentAreaId).orElse(null);
        if (currentArea == null) return Optional.empty();

        AreaCoordinate currentCoord = new AreaCoordinate(
            currentArea.getId(),
            currentArea.getAreaCode(),
            currentArea.getAreaName(),
            currentArea.getBuilding(),
            currentArea.getFloorNo(),
            currentArea.getGeoX(),
            currentArea.getGeoY()
        );

        // 2. Fetch the immediately preceding scan for this credential
        Optional<AccessLog> previousLogOpt = accessLogRepository
            .findTopByCredentialRefAndIdNotOrderByAccessTimeDesc(credentialRef, currentLogId);

        if (previousLogOpt.isEmpty()) {
            return Optional.empty();
        }

        AccessLog prevLog = previousLogOpt.get();
        LocalDateTime prevScanTime = prevLog.getAccessTime();

        // Calculate time delta
        long deltaSeconds = Math.abs(Duration.between(prevScanTime, currentScanTime).getSeconds());
        int windowSeconds = aiProperties.getSentinel().getEvaluationWindowSeconds();

        // If scans are beyond the evaluation window (e.g. > 5 minutes), travel is realistically feasible
        if (deltaSeconds <= 0 || deltaSeconds > windowSeconds) {
            return Optional.empty();
        }

        // 3. Fetch previous area coordinates
        Area prevArea = areaRepository.findById(prevLog.getAreaId()).orElse(null);
        if (prevArea == null) return Optional.empty();

        AreaCoordinate prevCoord = new AreaCoordinate(
            prevArea.getId(),
            prevArea.getAreaCode(),
            prevArea.getAreaName(),
            prevArea.getBuilding(),
            prevArea.getFloorNo(),
            prevArea.getGeoX(),
            prevArea.getGeoY()
        );

        // Calculate distance between scan points
        double distanceMeters = currentCoord.distanceTo(prevCoord);
        if (distanceMeters < 10.0) {
            // Consecutive scans at the same door or immediate proximity
            return Optional.empty();
        }

        // Calculate required velocity in km/h
        double speedKmh = (distanceMeters / (double) deltaSeconds) * 3.6;
        double maxAllowedSpeed = aiProperties.getSentinel().getMaxSpeedKmh();

        if (speedKmh > maxAllowedSpeed) {
            String message = "Impossible travel detected for %s (%s): scanned at %s (%s) then %s (%s) %d seconds later. Required velocity: %.1f km/h (threshold: %.1f km/h). Potential badge cloning or sharing."
                .formatted(
                    decision.holderName(),
                    credentialRef,
                    prevCoord.areaName(),
                    prevCoord.building(),
                    currentCoord.areaName(),
                    currentCoord.building(),
                    deltaSeconds,
                    speedKmh,
                    maxAllowedSpeed
                );

            log.warn("SENTINEL ALERT: {}", message);

            SecurityAlert alert = SecurityAlert.raise(
                AlertType.IMPOSSIBLE_TRAVEL,
                AlertSeverity.CRITICAL,
                message,
                currentLogId,
                currentAreaId
            );

            return Optional.of(securityAlertRepository.save(alert));
        }

        return Optional.empty();
    }
}
