package lk.AccessOne.entry.decision;

import lk.AccessOne.access.domain.AccessLevel;
import lk.AccessOne.access.domain.Area;
import lk.AccessOne.access.repository.AreaRepository;
import lk.AccessOne.entry.repository.BlacklistRepository;
import lk.AccessOne.identity.domain.Role;
import lk.AccessOne.identity.domain.User;
import lk.AccessOne.organisation.domain.Department;
import lk.AccessOne.organisation.domain.Employee;
import lk.AccessOne.shared.enums.CredentialType;
import lk.AccessOne.shared.enums.DenialReason;
import lk.AccessOne.shared.enums.Direction;
import lk.AccessOne.shared.enums.IdDocumentType;
import lk.AccessOne.shared.enums.VisitorType;
import lk.AccessOne.visitor.domain.Visitor;
import lk.AccessOne.visitor.domain.VisitorPass;
import lk.AccessOne.visitor.repository.VisitorPassRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Every denial reason DenialReason defines for a visitor pass, so none is
 * left unverified -- the same completeness goal as EmployeeCardStrategyTest.
 */
class VisitorPassStrategyTest {

    private final VisitorPassRepository passes = mock(VisitorPassRepository.class);
    private final AreaRepository areas = mock(AreaRepository.class);
    private final BlacklistRepository blacklist = mock(BlacklistRepository.class);
    private final VisitorPassStrategy strategy = new VisitorPassStrategy(passes, areas, blacklist);

    private Employee host;
    private Visitor visitor;
    private AccessLevel level;
    private Area area;
    private User issuer;

    @BeforeEach
    void setUp() {
        Department dept = new Department("SEC", "Security", null);
        host = new Employee("EMP002", "Ruwan", "Fernando", "902345678V",
                "ruwan@accessone.lk", null, "Security Officer", dept, LocalDate.now());
        visitor = new Visitor("VIS-9001", "Kamal Silva", IdDocumentType.NIC, "991234567V",
                VisitorType.GUEST, host, null, null, null);
        level = new AccessLevel("AL-VIS", "Visitor (Escorted)", null);
        area = new Area("A-LOBBY", "Main Lobby", "Tower A", "G", false, null);
        level.grant(area);
        issuer = new User("rfernando", "hash", null, new Role("SECURITY_OFFICER", null));
    }

    private VisitorPass passWithWindow(LocalDateTime from, LocalDateTime until) {
        return VisitorPass.issue("VP-2026-9001", visitor, host, level, "Meeting",
                from, until, "https://accessone.lk/pass/VP-2026-9001", issuer);
    }

    private VisitorPass livePass() {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        return passWithWindow(now.minusHours(1), now.plusHours(1));
    }

    @Test
    void aLivePassInAPermittedAreaIsGranted() {
        VisitorPass pass = livePass();
        when(passes.findByPassNoForDecision("VP-2026-9001")).thenReturn(Optional.of(pass));
        when(areas.findByAreaCode("A-LOBBY")).thenReturn(Optional.of(area));
        when(blacklist.isVisitorBlacklisted(any())).thenReturn(false);

        AccessDecisionResult decision = strategy.evaluate(
                AccessRequest.now("VP-2026-9001", "A-LOBBY", Direction.IN));

        assertThat(decision.granted()).isTrue();
        assertThat(decision.credentialType()).isEqualTo(CredentialType.VISITOR_PASS);
    }

    /**
     * The pass is left in ISSUED status -- the scheduled sweep that would
     * flip it to EXPIRED has deliberately not run. Security must not
     * depend on that job; the window is checked live against the moment
     * of the attempt.
     */
    @Test
    void expiredPassIsDeniedRegardlessOfWhatTheSchedulerHasDone() {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        VisitorPass pass = passWithWindow(now.minusDays(2), now.minusDays(1));

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
        when(areas.findByAreaCode("A-LOBBY")).thenReturn(Optional.of(area));

        AccessDecisionResult decision = strategy.evaluate(
                AccessRequest.now("VP-9999-9999", "A-LOBBY", Direction.IN));

        assertThat(decision.granted()).isFalse();
        assertThat(decision.denialReason()).isEqualTo(DenialReason.UNKNOWN_CREDENTIAL);
        assertThat(decision.holderName()).isNotBlank();
    }

    @Test
    void anAreaCodeThatDoesNotExistIsDenied() {
        VisitorPass pass = livePass();
        when(passes.findByPassNoForDecision("VP-2026-9001")).thenReturn(Optional.of(pass));
        when(areas.findByAreaCode("A-NOWHERE")).thenReturn(Optional.empty());

        AccessDecisionResult decision = strategy.evaluate(
                AccessRequest.now("VP-2026-9001", "A-NOWHERE", Direction.IN));

        assertThat(decision.granted()).isFalse();
        assertThat(decision.denialReason()).isEqualTo(DenialReason.UNKNOWN_AREA);
    }

    @Test
    void aBlacklistedVisitorIsDeniedEvenWithALivePass() {
        VisitorPass pass = livePass();
        when(passes.findByPassNoForDecision("VP-2026-9001")).thenReturn(Optional.of(pass));
        when(areas.findByAreaCode("A-LOBBY")).thenReturn(Optional.of(area));
        when(blacklist.isVisitorBlacklisted(visitor.getId())).thenReturn(true);

        AccessDecisionResult decision = strategy.evaluate(
                AccessRequest.now("VP-2026-9001", "A-LOBBY", Direction.IN));

        assertThat(decision.granted()).isFalse();
        assertThat(decision.denialReason()).isEqualTo(DenialReason.VISITOR_BLACKLISTED);
    }

    @Test
    void aPassNotYetValidIsDenied() {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        VisitorPass pass = passWithWindow(now.plusHours(2), now.plusHours(4));
        when(passes.findByPassNoForDecision("VP-2026-9001")).thenReturn(Optional.of(pass));
        when(areas.findByAreaCode("A-LOBBY")).thenReturn(Optional.of(area));

        AccessDecisionResult decision = strategy.evaluate(
                AccessRequest.now("VP-2026-9001", "A-LOBBY", Direction.IN));

        assertThat(decision.granted()).isFalse();
        assertThat(decision.denialReason()).isEqualTo(DenialReason.PASS_NOT_YET_VALID);
    }

    /** Suspended is neither "expired" nor "not yet valid" -- its own reason, not a reused one. */
    @Test
    void aSuspendedPassIsDenied() {
        VisitorPass pass = livePass();
        pass.suspend();
        when(passes.findByPassNoForDecision("VP-2026-9001")).thenReturn(Optional.of(pass));
        when(areas.findByAreaCode("A-LOBBY")).thenReturn(Optional.of(area));

        AccessDecisionResult decision = strategy.evaluate(
                AccessRequest.now("VP-2026-9001", "A-LOBBY", Direction.IN));

        assertThat(decision.granted()).isFalse();
        assertThat(decision.denialReason()).isEqualTo(DenialReason.PASS_NOT_ACTIVE);
    }

    @Test
    void aDeactivatedAreaIsDenied() {
        area.deactivate();
        VisitorPass pass = livePass();
        when(passes.findByPassNoForDecision("VP-2026-9001")).thenReturn(Optional.of(pass));
        when(areas.findByAreaCode("A-LOBBY")).thenReturn(Optional.of(area));

        AccessDecisionResult decision = strategy.evaluate(
                AccessRequest.now("VP-2026-9001", "A-LOBBY", Direction.IN));

        assertThat(decision.granted()).isFalse();
        assertThat(decision.denialReason()).isEqualTo(DenialReason.AREA_INACTIVE);
    }

    @Test
    void anAreaThePassDoesNotPermitIsDenied() {
        Area serverRoom = new Area("A-SERVER", "Server Room", "Tower A", "B1", true, null);
        // level (see setUp) only grants A-LOBBY -- never granted A-SERVER.
        VisitorPass pass = livePass();
        when(passes.findByPassNoForDecision("VP-2026-9001")).thenReturn(Optional.of(pass));
        when(areas.findByAreaCode("A-SERVER")).thenReturn(Optional.of(serverRoom));

        AccessDecisionResult decision = strategy.evaluate(
                AccessRequest.now("VP-2026-9001", "A-SERVER", Direction.IN));

        assertThat(decision.granted()).isFalse();
        assertThat(decision.denialReason()).isEqualTo(DenialReason.AREA_NOT_PERMITTED);
    }
}
