package lk.AccessOne.ai.gatekeeper.event;

import lk.AccessOne.ai.gatekeeper.service.RequestTriageService;
import lk.AccessOne.cardrequest.event.CardRequestSubmitted;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class CardRequestSubmittedListener {

    private static final Logger log = LoggerFactory.getLogger(CardRequestSubmittedListener.class);

    private final RequestTriageService triageService;

    public CardRequestSubmittedListener(RequestTriageService triageService) {
        this.triageService = triageService;
    }

    /**
     * Executes autonomous AI triage after the card request transaction commits.
     */
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void on(CardRequestSubmitted event) {
        try {
            log.info("CardRequestSubmitted event received for request ID: {}. Launching AI Gatekeeper triage...", event.requestId());
            triageService.triageRequest(event.requestId());
        } catch (Exception e) {
            log.error("Failed to run AI Gatekeeper triage for request {}: {}", event.requestId(), e.getMessage());
        }
    }
}
