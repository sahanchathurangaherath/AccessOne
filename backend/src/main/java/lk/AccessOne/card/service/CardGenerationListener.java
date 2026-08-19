package lk.AccessOne.card.service;

import lk.AccessOne.approval.event.CardRequestApproved;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Module 2 publishes this. Module 2 does not know Module 4 exists. */
@Component
public class CardGenerationListener {

    private final CardGenerationService generationService;

    public CardGenerationListener(CardGenerationService generationService) {
        this.generationService = generationService;
    }

    @EventListener
    @Transactional
    public void on(CardRequestApproved event) {
        generationService.generateFor(event.requestId());
    }
}
