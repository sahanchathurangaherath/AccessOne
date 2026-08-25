package lk.AccessOne.entry.decision;

import lk.AccessOne.shared.enums.CredentialType;

/**
 * Strategy pattern.
 *
 * Employee cards and visitor passes have genuinely different rules -- a
 * card is controlled by status and revocation, a pass by a validity
 * window -- but the entry point asks one question of both. This interface
 * is what lets the caller not care which it is holding.
 *
 * Implementations must be pure: no writes, no logging, no side effects.
 * The service logs the outcome; a strategy that logged would produce a
 * second entry every time.
 */
public interface AccessDecisionStrategy {

    boolean supports(CredentialType type);

    AccessDecisionResult evaluate(AccessRequest request);
}
