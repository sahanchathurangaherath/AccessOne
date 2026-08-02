package lk.AccessOne.shared.error;

/** Refused by a State pattern enum. Always says what was attempted. */
public class InvalidStateTransitionException extends BusinessRuleException {
    public InvalidStateTransitionException(String entity, Object from, Object to) {
        super("INVALID_STATE_TRANSITION",
              "%s cannot move from %s to %s".formatted(entity, from, to));
    }
}
