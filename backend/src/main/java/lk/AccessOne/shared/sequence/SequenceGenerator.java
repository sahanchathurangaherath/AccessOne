package lk.AccessOne.shared.sequence;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * Singleton pattern -- one Spring bean, one source for every numbered
 * artefact: card serials, print job numbers, card request numbers, visitor
 * pass numbers.
 *
 * The uniqueness guarantee is not in Java at all; it is the database
 * sequence named at each call site. Two application instances, or two
 * threads on one instance, cannot produce the same value because the
 * database allocates it atomically for every caller. A Java-side counter
 * would be a textbook Singleton and would be wrong the moment the
 * application ran on two machines -- naming this class Singleton describes
 * the single point of access; the correctness comes from the database.
 *
 * Previously the same "SELECT NEXT VALUE FOR ..." plus format-string
 * pattern appeared once in each of four services.
 */
@Component
public class SequenceGenerator {

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Format: PREFIX-YYYY-N...N, zero-padded to {@code width} digits.
     *
     * The sequence name is interpolated rather than bound, because SQL
     * Server does not accept a bind parameter there. Every call site below
     * passes a compile-time constant, never user input -- keep it that way.
     */
    public String next(String sequenceName, String prefix, int width) {
        Number value = (Number) entityManager
                .createNativeQuery("SELECT NEXT VALUE FOR " + sequenceName)
                .getSingleResult();
        return ("%s-%d-%0" + width + "d").formatted(prefix, LocalDate.now().getYear(), value.longValue());
    }
}
