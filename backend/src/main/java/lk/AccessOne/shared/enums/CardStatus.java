package lk.AccessOne.shared.enums;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * Card lifecycle. The permitted transitions live here, in one place, so no
 * service can invent its own rules. This is the State pattern in AccessOne.
 *
 * There is deliberately no EXPIRED state: employee cards carry no expiry
 * date, and validity is controlled by status and revocation.
 */
public enum CardStatus implements StatefulEnum<CardStatus> {

    GENERATED,
    QUEUED_FOR_PRINT,
    PRINTED,
    DISPATCHED,
    ACTIVE,
    SUSPENDED,
    REVOKED,
    LOST,
    DAMAGED,
    VOID,
    REPLACED;

    private static final Map<CardStatus, Set<CardStatus>> ALLOWED = Map.of(
        GENERATED,        EnumSet.of(QUEUED_FOR_PRINT, VOID),
        // GENERATED: a cancelled print job returns the card to the queue's
        // starting point, not to VOID -- cancelling a job is not the same
        // decision as voiding the card.
        QUEUED_FOR_PRINT, EnumSet.of(PRINTED, GENERATED, VOID),
        PRINTED,          EnumSet.of(DISPATCHED, QUEUED_FOR_PRINT, VOID),
        DISPATCHED,       EnumSet.of(ACTIVE, QUEUED_FOR_PRINT),
        ACTIVE,           EnumSet.of(SUSPENDED, REVOKED, LOST, DAMAGED, REPLACED),
        SUSPENDED,        EnumSet.of(ACTIVE, REVOKED),
        LOST,             EnumSet.of(REVOKED, REPLACED),
        DAMAGED,          EnumSet.of(REVOKED, REPLACED),
        REVOKED,          EnumSet.of(REPLACED)
    );

    @Override
    public boolean canTransitionTo(CardStatus target) {
        return ALLOWED.getOrDefault(this, EnumSet.noneOf(CardStatus.class))
                      .contains(target);
    }

    /** A card only opens doors when it is ACTIVE. */
    public boolean isUsable() {
        return this == ACTIVE;
    }

    public boolean isTerminal() {
        return this == VOID || this == REPLACED;
    }
}
