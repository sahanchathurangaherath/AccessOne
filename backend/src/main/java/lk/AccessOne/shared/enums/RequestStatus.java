package lk.AccessOne.shared.enums;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

public enum RequestStatus {

    DRAFT, SUBMITTED, UNDER_VERIFICATION, APPROVED, REJECTED, WITHDRAWN, CANCELLED;

    private static final Map<RequestStatus, Set<RequestStatus>> ALLOWED = Map.of(
        DRAFT,              EnumSet.of(SUBMITTED, CANCELLED),
        SUBMITTED,          EnumSet.of(UNDER_VERIFICATION, WITHDRAWN, CANCELLED),
        UNDER_VERIFICATION, EnumSet.of(APPROVED, REJECTED, WITHDRAWN),
        REJECTED,           EnumSet.of(SUBMITTED)
    );

    public boolean canTransitionTo(RequestStatus target) {
        return ALLOWED.getOrDefault(this, EnumSet.noneOf(RequestStatus.class))
                      .contains(target);
    }

    /** Hard delete is permitted only while the request has never been acted on. */
    public boolean isHardDeletable() {
        return this == DRAFT;
    }
}
