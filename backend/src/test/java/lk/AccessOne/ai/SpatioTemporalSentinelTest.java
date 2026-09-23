package lk.AccessOne.ai;

import lk.AccessOne.access.domain.Area;
import lk.AccessOne.access.repository.AreaRepository;
import lk.AccessOne.ai.config.AiProperties;
import lk.AccessOne.ai.sentinel.domain.AreaCoordinate;
import lk.AccessOne.ai.sentinel.service.SpatioTemporalSentinelService;
import lk.AccessOne.entry.decision.AccessDecisionResult;
import lk.AccessOne.entry.decision.AccessRequest;
import lk.AccessOne.entry.domain.AccessLog;
import lk.AccessOne.entry.domain.SecurityAlert;
import lk.AccessOne.entry.event.AccessEvaluated;
import lk.AccessOne.entry.repository.AccessLogRepository;
import lk.AccessOne.entry.repository.SecurityAlertRepository;
import lk.AccessOne.shared.enums.AlertSeverity;
import lk.AccessOne.shared.enums.AlertType;
import lk.AccessOne.shared.enums.CredentialType;
import lk.AccessOne.shared.enums.Direction;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SpatioTemporalSentinelTest {

    @Mock
    private AreaRepository areaRepository;
    @Mock
    private AccessLogRepository accessLogRepository;
    @Mock
    private SecurityAlertRepository securityAlertRepository;

    private SpatioTemporalSentinelService sentinelService;

    private Area towerA;
    private Area towerB;

    @BeforeEach
    void setUp() {
        AiProperties properties = new AiProperties();
        properties.getSentinel().setMaxSpeedKmh(15.0);
        properties.getSentinel().setEvaluationWindowSeconds(300);

        sentinelService = new SpatioTemporalSentinelService(
            properties, areaRepository, accessLogRepository, securityAlertRepository
        );

        towerA = new Area("A-LOBBY", "Main Lobby", "Tower A", "G", false, "Lobby");
        towerA.setCoordinates(0.0, 0.0);
        ReflectionTestUtils.setField(towerA, "id", 1L);

        towerB = new Area("B-SRV", "Server Room", "Tower B", "B1", true, "Server room");
        towerB.setCoordinates(550.0, 350.0);
        ReflectionTestUtils.setField(towerB, "id", 8L);
    }

    @Test
    @DisplayName("Consecutive scans across distant buildings within 30 seconds triggers IMPOSSIBLE_TRAVEL alert")
    void testImpossibleTravelTriggered() {
        LocalDateTime t1 = LocalDateTime.of(2026, 9, 23, 10, 0, 0);
        LocalDateTime t2 = LocalDateTime.of(2026, 9, 23, 10, 0, 30); // 30s later

        // Prior scan at Tower A
        AccessDecisionResult prevDecision = AccessDecisionResult.granted(
            CredentialType.EMPLOYEE_CARD, 30L, null, 1L, "ACO-2026-000030", "Kasun Herath", "Main Lobby"
        );
        AccessRequest prevRequest = new AccessRequest("ACO-2026-000030", "A-LOBBY", Direction.IN, t1);
        AccessLog prevLog = AccessLog.from(prevDecision, prevRequest);
        ReflectionTestUtils.setField(prevLog, "id", 100L);

        when(areaRepository.findById(8L)).thenReturn(Optional.of(towerB));
        when(areaRepository.findById(1L)).thenReturn(Optional.of(towerA));
        when(accessLogRepository.findTopByCredentialRefAndIdNotOrderByAccessTimeDesc("ACO-2026-000030", 101L))
            .thenReturn(Optional.of(prevLog));
        when(securityAlertRepository.save(any(SecurityAlert.class))).thenAnswer(i -> i.getArgument(0));

        // Current scan at Tower B (650m away, 30s later = ~78 km/h)
        AccessDecisionResult decision = AccessDecisionResult.granted(
            CredentialType.EMPLOYEE_CARD, 30L, null, 8L, "ACO-2026-000030", "Kasun Herath", "Server Room"
        );
        AccessRequest request = new AccessRequest("ACO-2026-000030", "B-SRV", Direction.IN, t2);
        AccessEvaluated event = new AccessEvaluated(101L, decision, request, t2);

        Optional<SecurityAlert> alert = sentinelService.checkImpossibleTravel(event);

        assertThat(alert).isPresent();
        assertThat(alert.get().getAlertType()).isEqualTo(AlertType.IMPOSSIBLE_TRAVEL);
        assertThat(alert.get().getSeverity()).isEqualTo(AlertSeverity.CRITICAL);
        assertThat(alert.get().getMessage()).contains("Impossible travel detected");
        assertThat(alert.get().getMessage()).contains("ACO-2026-000030");
    }

    @Test
    @DisplayName("Consecutive scans within walking speed (10 minutes apart) does not trigger alert")
    void testNormalTravelDoesNotTriggerAlert() {
        LocalDateTime t1 = LocalDateTime.of(2026, 9, 23, 10, 0, 0);
        LocalDateTime t2 = LocalDateTime.of(2026, 9, 23, 10, 10, 0); // 10 mins later (outside 300s window)

        AccessDecisionResult prevDecision = AccessDecisionResult.granted(
            CredentialType.EMPLOYEE_CARD, 30L, null, 1L, "ACO-2026-000030", "Kasun Herath", "Main Lobby"
        );
        AccessRequest prevRequest = new AccessRequest("ACO-2026-000030", "A-LOBBY", Direction.IN, t1);
        AccessLog prevLog = AccessLog.from(prevDecision, prevRequest);
        ReflectionTestUtils.setField(prevLog, "id", 100L);

        when(areaRepository.findById(8L)).thenReturn(Optional.of(towerB));
        when(accessLogRepository.findTopByCredentialRefAndIdNotOrderByAccessTimeDesc("ACO-2026-000030", 101L))
            .thenReturn(Optional.of(prevLog));

        AccessDecisionResult decision = AccessDecisionResult.granted(
            CredentialType.EMPLOYEE_CARD, 30L, null, 8L, "ACO-2026-000030", "Kasun Herath", "Server Room"
        );
        AccessRequest request = new AccessRequest("ACO-2026-000030", "B-SRV", Direction.IN, t2);
        AccessEvaluated event = new AccessEvaluated(101L, decision, request, t2);

        Optional<SecurityAlert> alert = sentinelService.checkImpossibleTravel(event);

        assertThat(alert).isEmpty();
        verify(securityAlertRepository, never()).save(any());
    }

    @Test
    @DisplayName("Euclidean distance calculation accurately reflects coordinate geometry")
    void testEuclideanDistanceCalculation() {
        AreaCoordinate coordA = new AreaCoordinate(1L, "A", "Area A", "Bld A", "1", 0.0, 0.0);
        AreaCoordinate coordB = new AreaCoordinate(2L, "B", "Area B", "Bld B", "1", 300.0, 400.0);

        // 3-4-5 right triangle -> 500 meters
        double distance = coordA.distanceTo(coordB);
        assertThat(distance).isEqualTo(500.0);
    }
}
