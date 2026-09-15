package lk.AccessOne.entry.decision;

import lk.AccessOne.shared.enums.CredentialType;
import lk.AccessOne.shared.enums.DenialReason;

/**
 * The result of one strategy's evaluation. Carries everything the log row
 * needs, including the snapshot values, so the service never has to reload
 * anything to write the entry.
 *
 * Named {@code AccessDecisionResult} rather than {@code AccessDecision} to
 * avoid colliding with {@link lk.AccessOne.shared.enums.AccessDecision},
 * the GRANTED/DENIED column enum -- this type is the full outcome, that
 * one is just its decision column.
 */
public record AccessDecisionResult(
        boolean granted,
        DenialReason denialReason,
        CredentialType credentialType,
        Long cardId,
        Long passId,
        Long areaId,
        String credentialRef,
        String holderName,
        String areaName) {

    public static AccessDecisionResult granted(CredentialType type, Long cardId, Long passId,
                                                Long areaId, String ref, String holder, String area) {
        return new AccessDecisionResult(true, null, type, cardId, passId, areaId, ref, holder, area);
    }

    public static AccessDecisionResult denied(DenialReason reason, CredentialType type,
                                               Long cardId, Long passId, Long areaId,
                                               String ref, String holder, String area) {
        return new AccessDecisionResult(false, reason, type, cardId, passId, areaId, ref, holder, area);
    }

    /** Nothing recognised. Still logged -- this is the event that matters most. */
    public static AccessDecisionResult unknownCredential(CredentialType type, String ref,
                                                           Long areaId, String areaName) {
        return new AccessDecisionResult(false, DenialReason.UNKNOWN_CREDENTIAL,
                type, null, null, areaId, ref, "Unknown credential", areaName);
    }

    public static Builder builder() {
        return new Builder();
    }

    /**
     * Builder pattern.
     *
     * granted()/denied() take seven or eight positional arguments,
     * including one that is always null -- the id of whichever credential
     * type this result is NOT about. {@link #card(Long)} and
     * {@link #pass(Long)} set credentialType and the matching id together
     * and leave the other id alone, so a call site never writes that null
     * itself.
     */
    public static final class Builder {
        private boolean granted;
        private DenialReason denialReason;
        private CredentialType credentialType;
        private Long cardId;
        private Long passId;
        private Long areaId;
        private String credentialRef;
        private String holderName;
        private String areaName;

        private Builder() { }

        public Builder granted() {
            this.granted = true;
            this.denialReason = null;
            return this;
        }

        public Builder denied(DenialReason reason) {
            this.granted = false;
            this.denialReason = reason;
            return this;
        }

        public Builder card(Long cardId) {
            this.credentialType = CredentialType.EMPLOYEE_CARD;
            this.cardId = cardId;
            return this;
        }

        public Builder pass(Long passId) {
            this.credentialType = CredentialType.VISITOR_PASS;
            this.passId = passId;
            return this;
        }

        public Builder credentialRef(String credentialRef) {
            this.credentialRef = credentialRef;
            return this;
        }

        public Builder holder(String holderName) {
            this.holderName = holderName;
            return this;
        }

        public Builder area(Long areaId, String areaName) {
            this.areaId = areaId;
            this.areaName = areaName;
            return this;
        }

        public AccessDecisionResult build() {
            return new AccessDecisionResult(granted, denialReason, credentialType,
                    cardId, passId, areaId, credentialRef, holderName, areaName);
        }
    }
}
