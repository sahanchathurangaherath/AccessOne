package lk.AccessOne.access.domain;

import lk.AccessOne.shared.error.BusinessRuleException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Pure domain tests -- no Spring context, no database. permits() is the
 * one method the Phase 12 access decision engine calls on every entry
 * attempt, so its correctness under deactivation is worth pinning down
 * here rather than trusting it by inspection.
 */
class AccessLevelTest {

    private Area serverRoom() {
        return new Area("SRV", "Server Room", "HQ", "3", true, null);
    }

    @Test
    void deactivatedAreaIsNeverPermitted() {
        Area serverRoom = serverRoom();
        AccessLevel level = new AccessLevel("L3", "Manager", null);
        level.grant(serverRoom);

        assertThat(level.permits(serverRoom)).isTrue();

        serverRoom.deactivate();
        assertThat(level.permits(serverRoom)).isFalse();
    }

    @Test
    void deactivatedLevelPermitsNothing() {
        Area serverRoom = serverRoom();
        AccessLevel level = new AccessLevel("L3", "Manager", null);
        level.grant(serverRoom);

        level.deactivate();

        assertThat(level.permits(serverRoom)).isFalse();
    }

    @Test
    void grantingAccessToADeactivatedAreaIsRejected() {
        Area serverRoom = serverRoom();
        serverRoom.deactivate();
        AccessLevel level = new AccessLevel("L3", "Manager", null);

        assertThatThrownBy(() -> level.grant(serverRoom))
                .isInstanceOf(BusinessRuleException.class);
        assertThat(level.getPermittedAreas()).isEmpty();
    }

    @Test
    void replaceAreasRejectsAnyDeactivatedAreaInTheSet() {
        Area active = serverRoom();
        Area inactive = new Area("LAB", "Lab", "HQ", "2", false, null);
        inactive.deactivate();
        AccessLevel level = new AccessLevel("L3", "Manager", null);

        assertThatThrownBy(() -> level.replaceAreas(java.util.Set.of(active, inactive)))
                .isInstanceOf(BusinessRuleException.class);

        // Rejected wholesale -- no partial replacement leaving a mix of
        // the old and new mapping.
        assertThat(level.getPermittedAreas()).isEmpty();
    }

    @Test
    void revokeRemovesOnlyTheGivenArea() {
        Area serverRoom = serverRoom();
        Area lab = new Area("LAB", "Lab", "HQ", "2", false, null);
        AccessLevel level = new AccessLevel("L3", "Manager", null);
        level.grant(serverRoom);
        level.grant(lab);

        level.revoke(serverRoom);

        assertThat(level.getPermittedAreas()).containsExactly(lab);
    }
}
