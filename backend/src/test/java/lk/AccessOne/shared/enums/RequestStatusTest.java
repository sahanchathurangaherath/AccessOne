package lk.AccessOne.shared.enums;

import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.EnumSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class RequestStatusTest {

    /** A draft is deleted outright; withdrawal only makes sense once something has been submitted. */
    private static final Set<RequestStatus> TERMINAL =
            EnumSet.of(RequestStatus.APPROVED, RequestStatus.WITHDRAWN, RequestStatus.CANCELLED);

    @Test
    void aDraftCanOnlyBeSubmitted() {
        assertThat(RequestStatus.DRAFT.canTransitionTo(RequestStatus.SUBMITTED)).isTrue();
        assertThat(RequestStatus.DRAFT.canTransitionTo(RequestStatus.APPROVED)).isFalse();
    }

    @Test
    void aRejectedRequestCanBeCorrectedAndResubmitted() {
        assertThat(RequestStatus.REJECTED.canTransitionTo(RequestStatus.SUBMITTED)).isTrue();
    }

    @Test
    void closedStatusesAreClosed() {
        for (RequestStatus status : TERMINAL) {
            assertThat(status.isClosed()).isTrue();
        }
        assertThat(RequestStatus.DRAFT.isClosed()).isFalse();
        assertThat(RequestStatus.SUBMITTED.isClosed()).isFalse();
    }

    @Test
    void everyNonTerminalStateHasOutgoingTransitions() {
        for (RequestStatus status : RequestStatus.values()) {
            boolean terminal = TERMINAL.contains(status);
            boolean hasOutgoing = Arrays.stream(RequestStatus.values())
                                        .anyMatch(status::canTransitionTo);
            assertThat(hasOutgoing)
                .as("%s should %shave outgoing transitions", status, terminal ? "not " : "")
                .isEqualTo(!terminal);
        }
    }
}
