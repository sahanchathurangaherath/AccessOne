package lk.AccessOne.shared.enums;

import lk.AccessOne.shared.error.InvalidStateTransitionException;

/**
 * State pattern.
 *
 * Every lifecycle in AccessOne -- card, request, approval decision, print
 * job, dispatch, visitor pass -- defines its own legal transitions, in one
 * place, on the enum that owns the state. No service decides for itself
 * what may follow what.
 *
 * The alternative would be transition checks scattered across six modules
 * written at different times, which is exactly how the fourth one comes to
 * disagree with the first about what a status change is allowed to do.
 */
public interface StatefulEnum<S extends Enum<S>> {

    boolean canTransitionTo(S target);

    /** The one call every domain entity's `move`-style method should make before assigning. */
    default void requireTransitionTo(S target, String entityLabel) {
        if (!canTransitionTo(target)) {
            @SuppressWarnings("unchecked")
            S from = (S) this;
            throw new InvalidStateTransitionException(entityLabel, from, target);
        }
    }
}
