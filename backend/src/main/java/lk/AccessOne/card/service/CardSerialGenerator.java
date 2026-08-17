package lk.AccessOne.card.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * Singleton pattern -- one Spring bean, one source of card serials.
 *
 * The uniqueness guarantee comes from a database sequence (V8), not from
 * Java. Two application instances, or two threads, cannot produce the same
 * value because the database allocates it.
 *
 * Format: ACO-YYYY-NNNNNN, matching the sample data seeded in V4
 * (ACO-2026-000001 .. ACO-2026-000009) -- seq_card_serial starts at 10 so
 * the two never collide.
 */
@Component
public class CardSerialGenerator {

    @PersistenceContext
    private EntityManager entityManager;

    public String next() {
        Number value = (Number) entityManager
                .createNativeQuery("SELECT NEXT VALUE FOR dbo.seq_card_serial")
                .getSingleResult();
        return "ACO-%d-%06d".formatted(LocalDate.now().getYear(), value.longValue());
    }
}
