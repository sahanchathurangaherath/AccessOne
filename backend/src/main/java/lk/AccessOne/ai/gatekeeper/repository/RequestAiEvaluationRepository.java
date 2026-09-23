package lk.AccessOne.ai.gatekeeper.repository;

import lk.AccessOne.ai.gatekeeper.domain.RequestAiEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RequestAiEvaluationRepository extends JpaRepository<RequestAiEvaluation, Long> {
    Optional<RequestAiEvaluation> findTopByCardRequestIdOrderByEvaluatedAtDesc(Long cardRequestId);
}
