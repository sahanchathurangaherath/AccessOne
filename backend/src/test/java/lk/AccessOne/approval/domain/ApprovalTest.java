package lk.AccessOne.approval.domain;

import lk.AccessOne.cardrequest.domain.CardRequest;
import lk.AccessOne.identity.domain.Role;
import lk.AccessOne.identity.domain.User;
import lk.AccessOne.organisation.domain.Department;
import lk.AccessOne.organisation.domain.Employee;
import lk.AccessOne.shared.enums.Decision;
import lk.AccessOne.shared.enums.RequestType;
import lk.AccessOne.shared.error.BusinessRuleException;
import lk.AccessOne.shared.error.InvalidStateTransitionException;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Pure domain tests -- no Spring context, no database. These prove the
 * two-step process (verify, then decide) is enforced by the enum, not by
 * the order of buttons on a screen, and that a concluded decision always
 * carries a decider and a timestamp together.
 */
class ApprovalTest {

    private User hrUser() {
        Department dept = new Department("HR", "Human Resources", null);
        Employee employee = new Employee("EMP100", "Nirmala", "Perera", "912345678V",
                "nperera@accessone.lk", null, "HR Manager", dept, LocalDate.now());
        Role role = new Role("HR_MANAGER", "Verifies and approves card requests");
        return new User("nperera", "hash", employee, role);
    }

    private CardRequest cardRequest() {
        Department dept = new Department("FIN", "Finance", null);
        Employee employee = new Employee("EMP007", "Chamari", "Rajapaksa", "982345678V",
                "crajapaksa@accessone.lk", null, "Finance Executive", dept, LocalDate.now());
        CardRequest request = CardRequest.draft("REQ-2026-9001", employee, RequestType.NEW,
                null, null, null, null);
        request.attachPhoto("requests/1/photo.jpg");
        request.submit();
        return request;
    }

    @Test
    void approvalRequiresVerificationFirst() {
        Approval approval = Approval.openFor(cardRequest());

        assertThatThrownBy(() -> approval.approve(hrUser()))
                .isInstanceOf(InvalidStateTransitionException.class);
        assertThat(approval.getDecision()).isEqualTo(Decision.PENDING);
    }

    @Test
    void rejectingWithoutVerificationFirstIsRefusedTheSameWay() {
        Approval approval = Approval.openFor(cardRequest());

        assertThatThrownBy(() -> approval.reject(hrUser(), "Photo unclear"))
                .isInstanceOf(InvalidStateTransitionException.class);
        assertThat(approval.getDecision()).isEqualTo(Decision.PENDING);
    }

    @Test
    void verifyThenApproveSucceeds() {
        Approval approval = Approval.openFor(cardRequest());
        User hr = hrUser();

        approval.verify(hr);
        approval.approve(hr);

        assertThat(approval.getDecision()).isEqualTo(Decision.APPROVED);
        assertThat(approval.getDecidedBy()).isEqualTo(hr);
        assertThat(approval.getDecidedAt()).isNotNull();
    }

    @Test
    void rejectionRecordsDeciderAndTimestamp() {
        Approval approval = Approval.openFor(cardRequest());
        User hr = hrUser();

        approval.verify(hr);
        approval.reject(hr, "Photo does not meet the standard");

        assertThat(approval.getDecidedBy()).isNotNull();
        assertThat(approval.getDecidedAt()).isNotNull();      // chk_approvals_decider
        assertThat(approval.getRejectionReason()).isNotBlank();
    }

    @Test
    void rejectionWithoutAReasonIsRejected() {
        Approval approval = Approval.openFor(cardRequest());
        User hr = hrUser();
        approval.verify(hr);

        assertThatThrownBy(() -> approval.reject(hr, "  "))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Say why");

        // A rejected-without-reason call must leave the decision unchanged,
        // not half-transitioned -- same principle as CardRequest.submit().
        assertThat(approval.getDecision()).isEqualTo(Decision.VERIFIED);
    }

    @Test
    void reopenClearsTheDecisionButKeepsTheRequestLinked() {
        Approval approval = Approval.openFor(cardRequest());
        User hr = hrUser();
        approval.verify(hr);
        approval.reject(hr, "Original card lost, no police report attached");

        approval.reopen();

        assertThat(approval.getDecision()).isEqualTo(Decision.PENDING);
        assertThat(approval.getDecidedBy()).isNull();
        assertThat(approval.getDecidedAt()).isNull();
        assertThat(approval.getVerifiedBy()).isNull();
        assertThat(approval.getVerifiedAt()).isNull();
        assertThat(approval.getRejectionReason()).isNull();
        assertThat(approval.getRequest()).isNotNull();
    }
}
