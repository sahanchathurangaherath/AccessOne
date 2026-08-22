package lk.AccessOne.entry.decision;

import lk.AccessOne.access.domain.AccessLevel;
import lk.AccessOne.access.domain.Area;
import lk.AccessOne.access.repository.AreaRepository;
import lk.AccessOne.card.domain.IdCard;
import lk.AccessOne.card.repository.IdCardRepository;
import lk.AccessOne.cardrequest.domain.CardRequest;
import lk.AccessOne.entry.repository.BlacklistRepository;
import lk.AccessOne.organisation.domain.Department;
import lk.AccessOne.organisation.domain.Employee;
import lk.AccessOne.shared.enums.CardStatus;
import lk.AccessOne.shared.enums.CredentialType;
import lk.AccessOne.shared.enums.DenialReason;
import lk.AccessOne.shared.enums.Direction;
import lk.AccessOne.shared.enums.RequestType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * The strategy is pure -- no Spring context, no database -- so the
 * repositories it depends on are mocked and the card/area graph is built
 * by hand, the same way PrintJobTest builds its fixtures.
 */
class EmployeeCardStrategyTest {

    private final IdCardRepository cards = mock(IdCardRepository.class);
    private final AreaRepository areas = mock(AreaRepository.class);
    private final BlacklistRepository blacklist = mock(BlacklistRepository.class);
    private final EmployeeCardStrategy strategy = new EmployeeCardStrategy(cards, areas, blacklist);

    private IdCard activeCard;
    private Area area;

    @BeforeEach
    void setUp() {
        Department dept = new Department("FIN", "Finance", null);
        Employee employee = new Employee("EMP001", "Nimal", "Perera", "982345678V",
                "nimal@accessone.lk", null, "Software Engineer", dept, LocalDate.now());
        CardRequest request = CardRequest.draft("REQ-2026-9001", employee, RequestType.NEW,
                null, null, null, null);
        AccessLevel level = new AccessLevel("AL-GEN", "General Staff", null);
        area = new Area("A-LOBBY", "Main Lobby", "Tower A", "G", false, null);
        level.grant(area);

        activeCard = IdCard.generate("ACO-2026-000001", request, employee, level, (short) 1, null);
        activeCard.moveTo(CardStatus.QUEUED_FOR_PRINT);
        activeCard.moveTo(CardStatus.PRINTED);
        activeCard.moveTo(CardStatus.DISPATCHED);
        activeCard.activate();
    }

    @Test
    void blacklistedCardIsDeniedEvenWhenOtherwiseValid() {
        when(cards.findBySerialWithEmployee("ACO-2026-000001")).thenReturn(Optional.of(activeCard));
        when(areas.findByAreaCode("A-LOBBY")).thenReturn(Optional.of(area));
        when(blacklist.isCardBlacklisted(any())).thenReturn(true);

        AccessDecisionResult decision = strategy.evaluate(
                AccessRequest.now("ACO-2026-000001", "A-LOBBY", Direction.IN));

        assertThat(decision.granted()).isFalse();
        assertThat(decision.denialReason()).isEqualTo(DenialReason.CARD_BLACKLISTED);
    }

    @Test
    void validCardInAPermittedAreaIsGranted() {
        when(cards.findBySerialWithEmployee("ACO-2026-000001")).thenReturn(Optional.of(activeCard));
        when(areas.findByAreaCode("A-LOBBY")).thenReturn(Optional.of(area));
        when(blacklist.isCardBlacklisted(any())).thenReturn(false);

        AccessDecisionResult decision = strategy.evaluate(
                AccessRequest.now("ACO-2026-000001", "A-LOBBY", Direction.IN));

        assertThat(decision.granted()).isTrue();
        assertThat(decision.credentialType()).isEqualTo(CredentialType.EMPLOYEE_CARD);
    }

    /** Somebody presenting a credential the system has never seen is exactly what the log exists to capture. */
    @Test
    void unknownCredentialIsDeniedButStillLoggable() {
        when(cards.findBySerialWithEmployee("ACO-9999-999999")).thenReturn(Optional.empty());
        when(areas.findByAreaCode("A-LOBBY")).thenReturn(Optional.of(area));

        AccessDecisionResult decision = strategy.evaluate(
                AccessRequest.now("ACO-9999-999999", "A-LOBBY", Direction.IN));

        assertThat(decision.granted()).isFalse();
        assertThat(decision.denialReason()).isEqualTo(DenialReason.UNKNOWN_CREDENTIAL);
        assertThat(decision.holderName()).isNotBlank();
    }
}
