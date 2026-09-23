package lk.AccessOne.ai.gatekeeper.web.dto;

import java.time.LocalDateTime;

public record RequestAiEvaluationResponse(
    Long id,
    Long cardRequestId,
    int riskScore,
    String riskLevel,
    Long recommendedAccessLevelId,
    String recommendedAccessLevelName,
    String recommendationReason,
    String photoComplianceStatus,
    String photoChecksJson,
    LocalDateTime evaluatedAt,
    boolean eligibleForOneClickApproval
) {}
