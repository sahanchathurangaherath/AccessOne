package lk.AccessOne.shared.enums;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

public enum RequestStatus {

    DRAFT, SUBMITTED, UNDER_VERIFICATION, APPROVED, REJECTED, WITHDRAWN, CANCELLED;

    private static final Map<RequestStatus, Set<RequestStatus>> ALLOWED = Map.of(
        DRAFT,              EnumSet.of(SUBMITTED),
        SUBMITTED,          EnumSet.of(UNDER_VERIFICATION, WITHDRAWN, CANCELLED),
        UNDER_VERIFICATION, EnumSet.of(APPROVED, REJECTED, WITHDRAWN, CANCELLED),
        REJECTED,           EnumSet.of(SUBMITTED)
    );

    public boolean canTransitionTo(RequestStatus target) {
        return ALLOWED.getOrDefault(this, EnumSet.noneOf(RequestStatus.class))
                      .contains(target);
    }

    /** A draft is deleted, not cancelled; cancelling only applies once a request has been submitted. */
    public boolean isHardDeletable() {
        return this == DRAFT;
    }

    public boolean isClosed() {
        return this == APPROVED || this == REJECTED
            || this == WITHDRAWN || this == CANCELLED;
    }
}
