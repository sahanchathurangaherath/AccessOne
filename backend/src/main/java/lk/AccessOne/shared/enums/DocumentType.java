package lk.AccessOne.shared.enums;

/** Matches request_documents.chk_reqdocs_type. */
public enum DocumentType {
    PHOTO,
    NIC_COPY,
    APPOINTMENT_LETTER,
    POLICE_REPORT,
    OTHER;

    /** A police report is what makes a lost-card replacement credible. */
    public boolean isSupportingEvidence() {
        return this == POLICE_REPORT || this == APPOINTMENT_LETTER;
    }
}
