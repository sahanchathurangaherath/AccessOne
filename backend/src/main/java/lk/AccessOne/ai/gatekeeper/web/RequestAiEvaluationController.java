package lk.AccessOne.ai.gatekeeper.web;

import lk.AccessOne.access.domain.AccessLevel;
import lk.AccessOne.access.repository.AccessLevelRepository;
import lk.AccessOne.ai.gatekeeper.domain.RequestAiEvaluation;
import lk.AccessOne.ai.gatekeeper.service.RequestTriageService;
import lk.AccessOne.ai.gatekeeper.web.dto.RequestAiEvaluationResponse;
import lk.AccessOne.shared.web.ApiPaths;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ApiPaths.API_V1 + "/requests/{id}/ai-evaluation")
public class RequestAiEvaluationController {

    private final RequestTriageService triageService;
    private final AccessLevelRepository accessLevelRepository;

    public RequestAiEvaluationController(
            RequestTriageService triageService,
            AccessLevelRepository accessLevelRepository) {
        this.triageService = triageService;
        this.accessLevelRepository = accessLevelRepository;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'SYSTEM_ADMIN', 'IT_ADMIN')")
    public RequestAiEvaluationResponse getEvaluation(@PathVariable Long id) {
        RequestAiEvaluation eval = triageService.getEvaluation(id)
            .orElseGet(() -> triageService.triageRequest(id));

        return toResponse(eval);
    }

    @PostMapping("/re-evaluate")
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'SYSTEM_ADMIN')")
    public RequestAiEvaluationResponse reEvaluate(@PathVariable Long id) {
        RequestAiEvaluation eval = triageService.triageRequest(id);
        return toResponse(eval);
    }

    private RequestAiEvaluationResponse toResponse(RequestAiEvaluation eval) {
        String levelName = null;
        if (eval.getRecommendedAccessLevelId() != null) {
            levelName = accessLevelRepository.findById(eval.getRecommendedAccessLevelId())
                .map(AccessLevel::getLevelName)
                .orElse("Standard Level");
        }

        boolean eligible = eval.getRiskScore() <= 25 && "COMPLIANT".equalsIgnoreCase(eval.getPhotoComplianceStatus());

        return new RequestAiEvaluationResponse(
            eval.getId(),
            eval.getCardRequestId(),
            eval.getRiskScore(),
            eval.getRiskLevel(),
            eval.getRecommendedAccessLevelId(),
            levelName,
            eval.getRecommendationReason(),
            eval.getPhotoComplianceStatus(),
            eval.getPhotoChecksJson(),
            eval.getEvaluatedAt(),
            eligible
        );
    }
}
