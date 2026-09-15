package lk.AccessOne.shared.enums;

import org.junit.jupiter.api.Test;

import java.util.Arrays;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The State pattern's lifecycle, tested as a unit -- fast, and the tests
 * you would most want passing before a demo.
 */
class CardStatusTest {

    @Test
    void aCardCannotBeActivatedWithoutBeingDispatched() {
        assertThat(CardStatus.PRINTED.canTransitionTo(CardStatus.ACTIVE)).isFalse();
        assertThat(CardStatus.DISPATCHED.canTransitionTo(CardStatus.ACTIVE)).isTrue();
    }

    @Test
    void aRevokedCardCannotBeReinstated() {
        assertThat(CardStatus.REVOKED.canTransitionTo(CardStatus.ACTIVE)).isFalse();
    }

    @Test
    void reprintIsPossibleWithoutVoidingTheCard() {
        assertThat(CardStatus.PRINTED.canTransitionTo(CardStatus.QUEUED_FOR_PRINT)).isTrue();
    }

    @Test
    void terminalStatesAreTerminal() {
        for (CardStatus target : CardStatus.values()) {
            assertThat(CardStatus.VOID.canTransitionTo(target)).isFalse();
            assertThat(CardStatus.REPLACED.canTransitionTo(target)).isFalse();
        }
    }

    /**
     * Map.of() caps at ten entries and would not even compile past that,
     * but the sharper risk is a map that compiles with exactly the right
     * count and quietly omits one state's transitions. This is the test
     * that catches a status silently becoming a dead end.
     */
    @Test
    void everyNonTerminalStateHasOutgoingTransitions() {
        for (CardStatus status : CardStatus.values()) {
            boolean terminal = status.isTerminal();
            boolean hasOutgoing = Arrays.stream(CardStatus.values())
                                        .anyMatch(status::canTransitionTo);
            assertThat(hasOutgoing)
                .as("%s should %shave outgoing transitions", status, terminal ? "not " : "")
                .isEqualTo(!terminal);
        }
    }
}
