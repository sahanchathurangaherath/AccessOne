package lk.AccessOne.entry.event;

import lk.AccessOne.entry.decision.AccessDecisionResult;
import lk.AccessOne.entry.decision.AccessRequest;

/**
 * Published once per evaluated attempt, after the log row is committed.
 * Carries the original request alongside the decision so listeners have
 * direction and timestamp without the decision itself needing to repeat
 * them.
 */
public record AccessEvaluated(Long logId, AccessDecisionResult decision, AccessRequest request) { }
