package lk.AccessOne.shared.enums;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * Visitor passes expire; employee cards do not.
 *
 * An unaccounted visitor is a materially larger risk than an unaccounted
 * employee: a visitor's business is time-bounded, while an employee's
 * need for access ends with employment, which is a status rather than a
 * date.
 *
 * Matches visitor_passes.status CHECK constraint.
 */
public enum PassStatus implements StatefulEnum<PassStatus> {

    ISSUED, ACTIVE, EXPIRED, SUSPENDED, CANCELLED, RETURNED;

    private static final Map<PassStatus, Set<PassStatus>> ALLOWED = Map.of(
        ISSUED,    EnumSet.of(ACTIVE, EXPIRED, SUSPENDED, CANCELLED),
        ACTIVE,    EnumSet.of(EXPIRED, SUSPENDED, RETURNED, CANCELLED),
        SUSPENDED, EnumSet.of(ACTIVE, CANCELLED, EXPIRED),
        // EXPIRED -> ACTIVE: an extension that pushes validUntil back into
        // the future reopens the pass. This used to be a direct field
        // assignment in VisitorPass.changeWindow() that bypassed the check
        // entirely -- Phase 14 found it and routed it through here instead.
        EXPIRED,   EnumSet.of(RETURNED, ACTIVE)
    );

    @Override
    public boolean canTransitionTo(PassStatus target) {
        return ALLOWED.getOrDefault(this, EnumSet.noneOf(PassStatus.class))
                      .contains(target);
    }

    /**
     * Status alone is never enough -- the validity window must also be
     * checked. See VisitorPass.isUsableAt().
     */
    public boolean allowsEntry() {
        return this == ISSUED || this == ACTIVE;
    }
}
