package lk.AccessOne.print.service;

import lk.AccessOne.shared.sequence.SequenceGenerator;
import org.springframework.stereotype.Component;

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

    private final SequenceGenerator sequences;

    public PrintJobNumberGenerator(SequenceGenerator sequences) {
        this.sequences = sequences;
    }

    public String next() {
        return sequences.next("dbo.seq_print_job_no", "PJ", 4);
    }
}
