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
}
