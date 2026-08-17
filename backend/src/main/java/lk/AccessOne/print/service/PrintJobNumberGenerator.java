package lk.AccessOne.print.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * Same reasoning as CardSerialGenerator (Module 4): a database sequence,
 * not MAX + 1, because two concurrent queue requests must never be able to
 * produce the same job number.
 *
 * Format: PJ-YYYY-NNNN, matching the sample data seeded in V4
 * (PJ-2026-0001 .. PJ-2026-0011) -- seq_print_job_no starts at 12.
 */
@Component
public class PrintJobNumberGenerator {

    @PersistenceContext
    private EntityManager entityManager;

    public String next() {
        Number value = (Number) entityManager
                .createNativeQuery("SELECT NEXT VALUE FOR dbo.seq_print_job_no")
                .getSingleResult();
        return "PJ-%d-%04d".formatted(LocalDate.now().getYear(), value.longValue());
    }
}
