package lk.AccessOne.shared.enums;

/** Matches print_jobs.status CHECK constraint. */
public enum PrintStatus {
    QUEUED, IN_PROGRESS, PRINTED, QC_PASSED, QC_FAILED, CANCELLED
}
