package lk.AccessOne.card.service;

import lk.AccessOne.shared.sequence.SequenceGenerator;
import org.springframework.stereotype.Component;

/**
 * Singleton pattern -- one Spring bean, one source of card serials.
 *
 * The uniqueness guarantee comes from a database sequence (V8), not from
 * Java. Two application instances, or two threads, cannot produce the same
 * value because the database allocates it. See SequenceGenerator, which
 * this class now delegates to, for why that distinction matters.
 *
 * Format: ACO-YYYY-NNNNNN, matching the sample data seeded in V4
 * (ACO-2026-000001 .. ACO-2026-000009) -- seq_card_serial starts at 10 so
 * the two never collide.
 */
@Component
public class CardSerialGenerator {

    private final SequenceGenerator sequences;

    public CardSerialGenerator(SequenceGenerator sequences) {
        this.sequences = sequences;
    }

    public String next() {
        return sequences.next("dbo.seq_card_serial", "ACO", 6);
    }
}
