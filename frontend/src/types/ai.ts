export interface PhotoChecks {
  lighting: boolean;
  plainBackground: boolean;
  faceCentered: boolean;
  antiSpoofPassed: boolean;
  confidence: number;
  summary: string;
}

export interface RequestAiEvaluation {
  id: number;
  cardRequestId: number;
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  recommendedAccessLevelId: number | null;
  recommendedAccessLevelName: string | null;
  recommendationReason: string;
  photoComplianceStatus: "COMPLIANT" | "NON_COMPLIANT" | "FLAGGED";
  photoChecksJson: string;
  evaluatedAt: string;
  eligibleForOneClickApproval: boolean;
}

export interface CopilotMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolInvoked?: string;
  parameters?: string;
  timestamp: string;
}

export interface CopilotQueryResponse {
  answer: string;
  toolInvoked: string;
  parameters: string;
  latencyMs: number;
}
