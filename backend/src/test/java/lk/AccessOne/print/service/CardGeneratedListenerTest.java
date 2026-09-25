package lk.AccessOne.print.service;

import lk.AccessOne.card.event.CardGenerated;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class CardGeneratedListenerTest {

    @Mock
    private PrintJobService printJobService;

    @InjectMocks
    private CardGeneratedListener listener;

    @Test
    void onCardGeneratedQueuesPrintJobForCard() {
        CardGenerated event = new CardGenerated(42L, 10L, "ACO-2026-000042");

        listener.on(event);

        verify(printJobService).queueJob(42L);
    }
}
