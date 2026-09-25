package lk.AccessOne.print.service;

import lk.AccessOne.card.event.CardGenerated;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Module 4 publishes CardGenerated when an IdCard has been generated with its
 * credentials following HR approval. Module 5 (Print Production) listens and
 * automatically places the newly generated card into the print queue.
 */
@Component
public class CardGeneratedListener {

    private final PrintJobService printJobService;

    public CardGeneratedListener(PrintJobService printJobService) {
        this.printJobService = printJobService;
    }

    @EventListener
    @Transactional
    public void on(CardGenerated event) {
        printJobService.queueJob(event.cardId());
    }
}
