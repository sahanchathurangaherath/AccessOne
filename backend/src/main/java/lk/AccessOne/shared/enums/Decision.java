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
public enum Decision {

    PENDING, VERIFIED, APPROVED, REJECTED;

    private static final Map<Decision, Set<Decision>> ALLOWED = Map.of(
        PENDING,  EnumSet.of(VERIFIED),
        VERIFIED, EnumSet.of(APPROVED, REJECTED)
    );

    public boolean canTransitionTo(Decision target) {
        return ALLOWED.getOrDefault(this, EnumSet.noneOf(Decision.class))
                      .contains(target);
    }

    /** APPROVED and REJECTED require a decider and a timestamp. */
    public boolean isConcluded() {
        return this == APPROVED || this == REJECTED;
    }
}
