package lk.AccessOne.shared.enums;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/** Matches print_jobs.status CHECK constraint. */
public enum PrintStatus {

    QUEUED, IN_PROGRESS, PRINTED, QC_PASSED, QC_FAILED, CANCELLED;

    private static final Map<PrintStatus, Set<PrintStatus>> ALLOWED = Map.of(
        QUEUED,      EnumSet.of(IN_PROGRESS, CANCELLED),
        IN_PROGRESS, EnumSet.of(PRINTED, CANCELLED),
        PRINTED,     EnumSet.of(QC_PASSED, QC_FAILED)
        // QC_FAILED and QC_PASSED are terminal for this job -- a reprint
        // is a new job, never a reopening of this one.
    );

    public boolean canTransitionTo(PrintStatus target) {
        return ALLOWED.getOrDefault(this, EnumSet.noneOf(PrintStatus.class))
                      .contains(target);
    }

    /** chk_printjobs_printed: these three require printed_at. */
    public boolean requiresPrintedAt() {
        return this == PRINTED || this == QC_PASSED || this == QC_FAILED;
    }

    /**
     * Once physical stock has been consumed, the job cannot be cancelled.
     * A card exists in the world; cancelling the record would leave it
     * unaccounted for, which is the exact failure this module prevents.
     */
    public boolean isCancellable() {
        return this == QUEUED || this == IN_PROGRESS;
    }

    /** Only a QC-passed job may be dispatched. */
    public boolean isDispatchable() {
        return this == QC_PASSED;
    }
}
