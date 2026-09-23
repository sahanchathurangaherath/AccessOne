package lk.AccessOne.ai.gatekeeper.service;

import lk.AccessOne.ai.config.AiProperties;
import lk.AccessOne.ai.gatekeeper.domain.PhotoComplianceResult;
import lk.AccessOne.ai.gatekeeper.domain.RequestAiEvaluation;
import lk.AccessOne.ai.gatekeeper.repository.RequestAiEvaluationRepository;
import lk.AccessOne.cardrequest.domain.CardRequest;
import lk.AccessOne.cardrequest.repository.CardRequestRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class RequestTriageService {

    private static final Logger log = LoggerFactory.getLogger(RequestTriageService.class);

    private final AiProperties aiProperties;
    private final PhotoComplianceService photoComplianceService;
    private final LeastPrivilegeRecommendationService leastPrivilegeRecommendationService;
    private final RequestAiEvaluationRepository evaluationRepository;
    private final CardRequestRepository cardRequestRepository;

    public RequestTriageService(
            AiProperties aiProperties,
            PhotoComplianceService photoComplianceService,
            LeastPrivilegeRecommendationService leastPrivilegeRecommendationService,
            RequestAiEvaluationRepository evaluationRepository,
            CardRequestRepository cardRequestRepository) {
        this.aiProperties = aiProperties;
        this.photoComplianceService = photoComplianceService;
        this.leastPrivilegeRecommendationService = leastPrivilegeRecommendationService;
        this.evaluationRepository = evaluationRepository;
        this.cardRequestRepository = cardRequestRepository;
    }

    /**
     * Autonomous request triage: analyzes employee portrait compliance, evaluates
     * requested access against least-privilege role matrix, and computes a risk score.
     */
    @Transactional
    public RequestAiEvaluation triageRequest(Long cardRequestId) {
        CardRequest request = cardRequestRepository.findById(cardRequestId)
            .orElseThrow(() -> new IllegalArgumentException("Card request not found: " + cardRequestId));

        return triage(request);
    }

    @Transactional
    public RequestAiEvaluation triage(CardRequest request) {
        if (!aiProperties.isEnabled()) {
            log.info("AI Gatekeeper is disabled via configuration.");
            return null;
        }

        // 1. Inspect Photo Compliance
        PhotoComplianceResult photoReport = photoComplianceService.inspectPhoto(request.getPhotoPath());

        // 2. Compute Least-Privilege Recommendation
        LeastPrivilegeRecommendationService.Recommendation accessRec =
            leastPrivilegeRecommendationService.evaluate(request.getEmployee(), request.getRequestedAccessLevel());

        // 3. Calculate Composite Risk Score (0-100)
        int score = 5; // nominal base
        if (!photoReport.compliant()) {
            score += 35;
        }
        if (!photoReport.antiSpoofPassed()) {
            score += 45;
        }
        score += accessRec.privilegeRiskScorePenalty();

        // Clamp between 0 and 100
        score = Math.min(100, Math.max(0, score));

        String riskLevel = score <= 25 ? "LOW" : (score <= 65 ? "MEDIUM" : "HIGH");
        String photoStatus = photoReport.compliant() ? "COMPLIANT" :
            (photoReport.antiSpoofPassed() ? "NON_COMPLIANT" : "FLAGGED");

        String checksJson = """
            {
              "lighting": %b,
              "plainBackground": %b,
              "faceCentered": %b,
              "antiSpoofPassed": %b,
              "confidence": %.2f,
              "summary": "%s"
            }
            """.formatted(
                photoReport.lightingOk(),
                photoReport.plainBackground(),
                photoReport.faceCentered(),
                photoReport.antiSpoofPassed(),
                photoReport.confidence(),
                photoReport.summary().replace("\"", "\\\"")
            );

        RequestAiEvaluation evaluation = new RequestAiEvaluation(
            request.getId(),
            score,
            riskLevel,
            accessRec.accessLevelId(),
            accessRec.reasoning(),
            photoStatus,
            checksJson
        );

        RequestAiEvaluation saved = evaluationRepository.save(evaluation);
        log.info("AI Gatekeeper triaged Request #{} - Risk: {} ({} pts), Rec Level: {}",
            request.getRequestNo(), riskLevel, score, accessRec.accessLevelCode());

        return saved;
    }

    public Optional<RequestAiEvaluation> getEvaluation(Long cardRequestId) {
        return evaluationRepository.findTopByCardRequestIdOrderByEvaluatedAtDesc(cardRequestId);
    }
}
