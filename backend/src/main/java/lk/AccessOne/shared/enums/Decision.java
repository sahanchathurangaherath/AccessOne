package lk.AccessOne.shared.enums;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * Verification and decision are separate steps on purpose. Verification
 * is a factual check of the employee record; approval is a judgement.
 * Recording them separately means the trail shows both who checked the
 * facts and who made the call.
 */
public enum Decision implements StatefulEnum<Decision> {

    PENDING, VERIFIED, APPROVED, REJECTED;

    private static final Map<Decision, Set<Decision>> ALLOWED = Map.of(
        PENDING,  EnumSet.of(VERIFIED),
        VERIFIED, EnumSet.of(APPROVED, REJECTED),
        // A corrected request comes back for a fresh decision -- Approval.reopen()
        // used to set this directly, bypassing the check entirely. Phase 14 found
        // it and added the transition it was actually relying on.
        REJECTED, EnumSet.of(PENDING)
    );

    @Override
    public boolean canTransitionTo(Decision target) {
        return ALLOWED.getOrDefault(this, EnumSet.noneOf(Decision.class))
                      .contains(target);
    }

    /** APPROVED and REJECTED require a decider and a timestamp. */
    public boolean isConcluded() {
        return this == APPROVED || this == REJECTED;
    }
}
