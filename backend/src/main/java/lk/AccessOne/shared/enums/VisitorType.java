package lk.AccessOne.shared.enums;

/** Matches visitors.visitor_type CHECK constraint. */
public enum VisitorType {
    GUEST, CONTRACTOR, VENDOR, INTERVIEWEE;

    /** Contractors and vendors return repeatedly; register once, issue many. */
    public boolean isRecurring() {
        return this == CONTRACTOR || this == VENDOR;
    }
}
