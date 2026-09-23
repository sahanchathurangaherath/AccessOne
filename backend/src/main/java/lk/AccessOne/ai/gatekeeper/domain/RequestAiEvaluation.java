package lk.AccessOne.ai.gatekeeper.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lk.AccessOne.shared.domain.AuditableEntity;

import java.time.LocalDateTime;

@Entity
@Table(name = "card_request_ai_evaluations")
public class RequestAiEvaluation extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "card_request_id", nullable = false)
    private Long cardRequestId;

    @Column(name = "risk_score", nullable = false)
    private int riskScore; // 0 to 100

    @Column(name = "risk_level", nullable = false, length = 20)
    private String riskLevel; // LOW, MEDIUM, HIGH

    @Column(name = "recommended_access_level_id")
    private Long recommendedAccessLevelId;

    @Column(name = "recommendation_reason", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String recommendationReason;

    @Column(name = "photo_compliance_status", nullable = false, length = 20)
    private String photoComplianceStatus; // COMPLIANT, NON_COMPLIANT, FLAGGED

    @Column(name = "photo_checks_json", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String photoChecksJson;

    @Column(name = "evaluated_at", nullable = false)
    private LocalDateTime evaluatedAt = LocalDateTime.now();

    protected RequestAiEvaluation() { }

    public RequestAiEvaluation(Long cardRequestId, int riskScore, String riskLevel,
                               Long recommendedAccessLevelId, String recommendationReason,
                               String photoComplianceStatus, String photoChecksJson) {
        this.cardRequestId = cardRequestId;
        this.riskScore = riskScore;
        this.riskLevel = riskLevel;
        this.recommendedAccessLevelId = recommendedAccessLevelId;
        this.recommendationReason = recommendationReason;
        this.photoComplianceStatus = photoComplianceStatus;
        this.photoChecksJson = photoChecksJson;
        this.evaluatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Long getCardRequestId() { return cardRequestId; }
    public int getRiskScore() { return riskScore; }
    public String getRiskLevel() { return riskLevel; }
    public Long getRecommendedAccessLevelId() { return recommendedAccessLevelId; }
    public String getRecommendationReason() { return recommendationReason; }
    public String getPhotoComplianceStatus() { return photoComplianceStatus; }
    public String getPhotoChecksJson() { return photoChecksJson; }
    public LocalDateTime getEvaluatedAt() { return evaluatedAt; }
}
