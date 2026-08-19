package lk.AccessOne.visitor.domain;

import lk.AccessOne.access.domain.AccessLevel;
import lk.AccessOne.identity.domain.Role;
import lk.AccessOne.identity.domain.User;
import lk.AccessOne.organisation.domain.Department;
import lk.AccessOne.organisation.domain.Employee;
import lk.AccessOne.shared.enums.IdDocumentType;
import lk.AccessOne.shared.enums.PassStatus;
import lk.AccessOne.shared.enums.VisitorType;
import lk.AccessOne.shared.error.BusinessRuleException;
import lk.AccessOne.shared.error.InvalidStateTransitionException;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Pure domain tests -- no Spring context, no database. isUsableAt() is the
 * method Phase 12 calls on every entry attempt, so it is worth pinning
 * down that it checks the window itself rather than trusting the stored
 * status (chk_passes_window has no equivalent in Java otherwise).
 */
class VisitorPassTest {

    private Employee host() {
        Department dept = new Department("FIN", "Finance", null);
        return new Employee("EMP001", "Nimal", "Perera", "982345678V",
                "nimal@accessone.lk", null, "Finance Manager", dept, LocalDate.now());
    }

    private Visitor visitor() {
        return new Visitor("VIS-0010", "Kasun Silva", IdDocumentType.NIC, "199012345678V",
                VisitorType.GUEST, host(), "Acme Ltd", null, null);
    }

    private User issuer() {
        return new User("security1", "hash", null, new Role("SECURITY_OFFICER", null));
    }

    private VisitorPass passWithWindow(LocalDateTime from, LocalDateTime until) {
        return VisitorPass.issue("VP-2026-9001", visitor(), host(), new AccessLevel("VIS", "Visitor Access", null),
                "Meeting", from, until, "https://accessone.local/verify/pass/VP-2026-9001", issuer());
    }

    private VisitorPass livePass() {
        return passWithWindow(LocalDateTime.now().minusHours(1), LocalDateTime.now().plusHours(1));
    }

    @Test
    void issueRejectsAWindowThatEndsBeforeItStarts() {
        LocalDateTime now = LocalDateTime.now();
        assertThatThrownBy(() -> passWithWindow(now, now.minusMinutes(1)))
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void expiredPassIsRefusedRegardlessOfStoredStatus() {
        VisitorPass pass = passWithWindow(LocalDateTime.now().minusHours(3), LocalDateTime.now().minusHours(1));
        // status is still ISSUED -- the sweep has not run
        assertThat(pass.getStatus()).isEqualTo(PassStatus.ISSUED);

        assertThat(pass.isUsableAt(LocalDateTime.now())).isFalse();
        assertThat(pass.denialReasonAt(LocalDateTime.now())).contains("expired");
    }

    @Test
    void passIsNotUsableBeforeItsWindow() {
        VisitorPass pass = passWithWindow(LocalDateTime.now().plusHours(2), LocalDateTime.now().plusHours(4));
        assertThat(pass.isUsableAt(LocalDateTime.now())).isFalse();
        assertThat(pass.denialReasonAt(LocalDateTime.now())).contains("not valid yet");
    }

    @Test
    void aLivePassWithinItsWindowIsUsable() {
        VisitorPass pass = livePass();
        assertThat(pass.isUsableAt(LocalDateTime.now())).isTrue();
        assertThat(pass.denialReasonAt(LocalDateTime.now())).isNull();
    }

    @Test
    void aSuspendedPassIsNeverUsableEvenWithinItsWindow() {
        VisitorPass pass = livePass();
        pass.suspend();
        assertThat(pass.isUsableAt(LocalDateTime.now())).isFalse();
        assertThat(pass.denialReasonAt(LocalDateTime.now())).contains("suspended");
    }

    @Test
    void cancellingWithoutAReasonIsRefused() {
        VisitorPass pass = livePass();
        assertThatThrownBy(() -> pass.cancel(" "))
                .isInstanceOf(BusinessRuleException.class);
        assertThat(pass.getStatus()).isEqualTo(PassStatus.ISSUED);
    }

    @Test
    void cancelSetsStatusAndReasonTogether() {
        VisitorPass pass = livePass();
        pass.cancel("Visit rescheduled");

        assertThat(pass.getStatus()).isEqualTo(PassStatus.CANCELLED);
        assertThat(pass.getCancelledReason()).isEqualTo("Visit rescheduled");
    }

    @Test
    void extendingAnExpiredPassReopensIt() {
        VisitorPass pass = passWithWindow(LocalDateTime.now().minusHours(3), LocalDateTime.now().minusHours(1));
        pass.markExpired();
        assertThat(pass.getStatus()).isEqualTo(PassStatus.EXPIRED);

        pass.changeWindow(LocalDateTime.now().plusHours(2));

        assertThat(pass.getStatus()).isEqualTo(PassStatus.ACTIVE);
        assertThat(pass.isUsableAt(LocalDateTime.now())).isTrue();
    }

    @Test
    void aClosedPassCannotBeExtended() {
        VisitorPass pass = livePass();
        pass.cancel("No longer needed");

        assertThatThrownBy(() -> pass.changeWindow(LocalDateTime.now().plusDays(1)))
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void aFreshlyIssuedPassCannotJumpStraightToReturned() {
        VisitorPass pass = livePass();
        assertThatThrownBy(() -> pass.markReturned())
                .isInstanceOf(InvalidStateTransitionException.class);
    }
}
