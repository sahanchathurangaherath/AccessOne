package lk.AccessOne.ai.copilot.web;

import jakarta.validation.Valid;
import lk.AccessOne.ai.copilot.service.SecOpsCopilotService;
import lk.AccessOne.ai.copilot.web.dto.CopilotQueryRequest;
import lk.AccessOne.ai.copilot.web.dto.CopilotQueryResponse;
import lk.AccessOne.shared.web.ApiPaths;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ApiPaths.API_V1 + "/copilot")
public class SecOpsCopilotController {

    private final SecOpsCopilotService copilotService;

    public SecOpsCopilotController(SecOpsCopilotService copilotService) {
        this.copilotService = copilotService;
    }

    @PostMapping("/query")
    @PreAuthorize("hasAnyRole('SECURITY_OFFICER', 'IT_ADMIN', 'SYSTEM_ADMIN')")
    public CopilotQueryResponse query(
            @RequestBody @Valid CopilotQueryRequest request,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "Officer";
        SecOpsCopilotService.CopilotExecutionResult result = copilotService.processQuery(request.prompt(), username);

        return new CopilotQueryResponse(
            result.answerMarkdown(),
            result.toolInvoked(),
            result.parametersExtracted(),
            result.executionTimeMs()
        );
    }
}
