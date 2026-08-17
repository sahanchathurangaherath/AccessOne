package lk.AccessOne.shared.enums;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/** Matches dispatch_records.status CHECK constraint. */
public enum DispatchStatus {

    PENDING, DISPATCHED, DELIVERED, RETURNED;

    private static final Map<DispatchStatus, Set<DispatchStatus>> ALLOWED = Map.of(
        PENDING,    EnumSet.of(DISPATCHED),
        DISPATCHED, EnumSet.of(DELIVERED, RETURNED),
        RETURNED,   EnumSet.of(DISPATCHED)   // re-sent after a failed delivery
    );

    public boolean canTransitionTo(DispatchStatus target) {
        return ALLOWED.getOrDefault(this, EnumSet.noneOf(DispatchStatus.class))
                      .contains(target);
    }
}
