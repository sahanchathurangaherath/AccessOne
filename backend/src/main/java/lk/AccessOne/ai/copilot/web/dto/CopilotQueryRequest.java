package lk.AccessOne.ai.copilot.web.dto;

import jakarta.validation.constraints.NotBlank;

public record CopilotQueryRequest(
    @NotBlank(message = "Prompt cannot be empty")
    String prompt
) {}
