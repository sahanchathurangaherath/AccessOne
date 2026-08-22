package lk.AccessOne.entry.decision;

import lk.AccessOne.access.domain.AccessLevel;
import lk.AccessOne.access.domain.Area;
import lk.AccessOne.access.repository.AreaRepository;
import lk.AccessOne.entry.repository.BlacklistRepository;
import lk.AccessOne.identity.domain.Role;
import lk.AccessOne.identity.domain.User;
import lk.AccessOne.organisation.domain.Department;
import lk.AccessOne.organisation.domain.Employee;
import lk.AccessOne.shared.enums.DenialReason;
import lk.AccessOne.shared.enums.Direction;
import lk.AccessOne.shared.enums.IdDocumentType;
import lk.AccessOne.shared.enums.VisitorType;
import lk.AccessOne.visitor.domain.Visitor;
import lk.AccessOne.visitor.domain.VisitorPass;
import lk.AccessOne.visitor.repository.VisitorPassRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class VisitorPassStrategyTest {

    private final VisitorPassRepository passes = mock(VisitorPassRepository.class);
    private final AreaRepository areas = mock(AreaRepository.class);
    private final BlacklistRepository blacklist = mock(BlacklistRepository.class);
    private final VisitorPassStrategy strategy = new VisitorPassStrategy(passes, areas, blacklist);

    /**
     * The pass is left in ISSUED status -- the scheduled sweep that would
     * flip it to EXPIRED has deliberately not run. Security must not
     * depend on that job; the window is checked live against the moment
     * of the attempt.
     */
    @Test
    void expiredPassIsDeniedRegardlessOfWhatTheSchedulerHasDone() {
        Department dept = new Department("SEC", "Security", null);
        Employee host = new Employee("EMP002", "Ruwan", "Fernando", "902345678V",
                "ruwan@accessone.lk", null, "Security Officer", dept, LocalDate.now());
        Visitor visitor = new Visitor("VIS-9001", "Kamal Silva", IdDocumentType.NIC, "991234567V",
                VisitorType.GUEST, host, null, null, null);
        AccessLevel level = new AccessLevel("AL-VIS", "Visitor (Escorted)", null);
        Area area = new Area("A-LOBBY", "Main Lobby", "Tower A", "G", false, null);
        level.grant(area);
        User issuer = new User("rfernando", "hash", null, new Role("SECURITY_OFFICER", null));

        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        VisitorPass pass = VisitorPass.issue("VP-2026-9001", visitor, host, level, "Meeting",
                now.minusDays(2), now.minusDays(1), "https://accessone.lk/pass/VP-2026-9001", issuer);

        when(passes.findByPassNoForDecision("VP-2026-9001")).thenReturn(Optional.of(pass));
        when(areas.findByAreaCode("A-LOBBY")).thenReturn(Optional.of(area));

        AccessDecisionResult decision = strategy.evaluate(
                AccessRequest.now("VP-2026-9001", "A-LOBBY", Direction.IN));

        assertThat(decision.granted()).isFalse();
        assertThat(decision.denialReason()).isEqualTo(DenialReason.PASS_EXPIRED);
    }

    @Test
    void unknownPassIsDeniedButStillLoggable() {
        when(passes.findByPassNoForDecision("VP-9999-9999")).thenReturn(Optional.empty());
        Area area = new Area("A-LOBBY", "Main Lobby", "Tower A", "G", false, null);
        when(areas.findByAreaCode("A-LOBBY")).thenReturn(Optional.of(area));

        AccessDecisionResult decision = strategy.evaluate(
                AccessRequest.now("VP-9999-9999", "A-LOBBY", Direction.IN));

        assertThat(decision.granted()).isFalse();
        assertThat(decision.denialReason()).isEqualTo(DenialReason.UNKNOWN_CREDENTIAL);
        assertThat(decision.holderName()).isNotBlank();
    }
}
