package lk.AccessOne.ai.copilot.web.dto;

public record CopilotQueryResponse(
    String answer,
    String toolInvoked,
    String parameters,
    long latencyMs
) {}
