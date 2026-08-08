package lk.AccessOne.cardrequest.domain;

import lk.AccessOne.organisation.domain.Department;
import lk.AccessOne.organisation.domain.Employee;
import lk.AccessOne.shared.enums.RequestStatus;
import lk.AccessOne.shared.enums.RequestType;
import lk.AccessOne.shared.error.BusinessRuleException;
import lk.AccessOne.shared.error.InvalidStateTransitionException;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Pure domain tests -- no Spring context, no database. These cover the
 * rules a broken demo would expose: a submit that silently half-transitions,
 * or a draft-only guard that a resubmission slips past.
 */
class CardRequestTest {

    private Employee employee() {
        Department dept = new Department("IT", "Information Technology", null);
        return new Employee("EMP001", "Nimal", "Perera", "982345678V",
                "nimal@accessone.lk", null, "Software Engineer", dept, LocalDate.now());
    }

    private CardRequest draftWithoutPhoto() {
        return CardRequest.draft("REQ-2026-9001", employee(), RequestType.NEW,
                null, null, null, null);
    }

    private CardRequest draftWithPhoto() {
        CardRequest request = draftWithoutPhoto();
        request.attachPhoto("requests/1/photo.jpg");
        return request;
    }

    @Test
    void submitMovesADraftWithAPhotoToSubmitted() {
        CardRequest request = draftWithPhoto();

        request.submit();

        assertThat(request.getStatus()).isEqualTo(RequestStatus.SUBMITTED);
        assertThat(request.getSubmittedAt()).isNotNull();
    }

    @Test
    void submitRequiresAPhoto() {
        CardRequest request = draftWithoutPhoto();

        assertThatThrownBy(request::submit)
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("photo");

        // A rejected submit must leave the request unchanged, not half-transitioned.
        assertThat(request.getStatus()).isEqualTo(RequestStatus.DRAFT);
        assertThat(request.getSubmittedAt()).isNull();
    }

    @Test
    void submittedRequestCannotBeEdited() {
        CardRequest request = draftWithPhoto();
        request.submit();

        assertThatThrownBy(() -> request.updateDraft(RequestType.NEW, null, null, null))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("cannot be edited");
    }

    @Test
    void replacementWithoutAReasonIsRejected() {
        assertThatThrownBy(() -> CardRequest.draft("REQ-2026-9002", employee(),
                RequestType.REPLACEMENT, null, null, null, null))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("replaced");
    }

    @Test
    void replacementWithoutAPreviousCardIsRejected() {
        assertThatThrownBy(() -> CardRequest.draft("REQ-2026-9003", employee(),
                RequestType.REPLACEMENT, "Lost while travelling", null, null, null))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("card being replaced");
    }

    @Test
    void onlyADraftIsHardDeletable() {
        CardRequest request = draftWithPhoto();
        assertThat(request.isHardDeletable()).isTrue();

        request.submit();
        assertThat(request.isHardDeletable()).isFalse();
    }

    @Test
    void aSubmittedRequestCannotJumpStraightToApproved() {
        CardRequest request = draftWithPhoto();
        request.submit();

        assertThatThrownBy(() -> request.transitionTo(RequestStatus.APPROVED))
                .isInstanceOf(InvalidStateTransitionException.class);

        assertThat(request.getStatus()).isEqualTo(RequestStatus.SUBMITTED);
    }

    @Test
    void withdrawingClosesTheRequest() {
        CardRequest request = draftWithPhoto();
        request.submit();

        request.withdraw();

        assertThat(request.getStatus()).isEqualTo(RequestStatus.WITHDRAWN);
        assertThat(request.getClosedAt()).isNotNull();
    }
}
