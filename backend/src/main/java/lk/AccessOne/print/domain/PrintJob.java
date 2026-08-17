package lk.AccessOne.print.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lk.AccessOne.card.domain.IdCard;
import lk.AccessOne.identity.domain.User;
import lk.AccessOne.shared.domain.AuditableEntity;
import lk.AccessOne.shared.enums.PrintJobType;
import lk.AccessOne.shared.enums.PrintStatus;
import lk.AccessOne.shared.enums.QcResult;
import lk.AccessOne.shared.error.BusinessRuleException;
import lk.AccessOne.shared.error.InvalidStateTransitionException;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

/**
 * fk_printjobs_card is deliberately not unique -- a reprint is a NEW job
 * against the same card, which is what makes the reprint-rate report
 * possible (Step 6).
 */
@Entity
@Table(name = "print_jobs")
public class PrintJob extends AuditableEntity {

    @Column(name = "job_no", nullable = false, length = 20, unique = true)
    private String jobNo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "card_id", nullable = false)
    private IdCard card;

    @Enumerated(EnumType.STRING)
    @Column(name = "job_type", nullable = false, length = 15)
    private PrintJobType jobType = PrintJobType.INITIAL;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private PrintStatus status = PrintStatus.QUEUED;

    @Column(name = "printer_name", length = 60)
    private String printerName;

    @Column(name = "queued_at", nullable = false)
    private LocalDateTime queuedAt;

    @Column(name = "printed_at")
    private LocalDateTime printedAt;

    /** NOT NULL in the schema, defaulting to PENDING. Never null here. */
    @Enumerated(EnumType.STRING)
    @Column(name = "qc_result", nullable = false, length = 10)
    private QcResult qcResult = QcResult.PENDING;

    @Column(name = "qc_notes", length = 255)
    private String qcNotes;

    @Column(name = "cancelled_reason", length = 255)
    private String cancelledReason;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    protected PrintJob() { }

    public static PrintJob queue(String jobNo, IdCard card, PrintJobType type, User createdBy) {
        PrintJob job = new PrintJob();
        job.jobNo = jobNo;
        job.card = card;
        job.jobType = type;
        job.createdBy = createdBy;
        job.queuedAt = LocalDateTime.now(ZoneOffset.UTC);
        job.status = PrintStatus.QUEUED;
        return job;
    }

    // ---------- production ----------

    public void start(String printerName) {
        move(PrintStatus.IN_PROGRESS);
        this.printerName = printerName;
    }

    /** chk_printjobs_printed: PRINTED requires printed_at. Both together. */
    public void markPrinted() {
        move(PrintStatus.PRINTED);
        this.printedAt = LocalDateTime.now(ZoneOffset.UTC);
    }

    public void recordQualityCheck(QcResult result, String notes) {
        if (result == QcResult.PENDING) {
            throw new BusinessRuleException("QC_RESULT_REQUIRED", "Record a pass or a fail.");
        }
        if (result == QcResult.FAIL && (notes == null || notes.isBlank())) {
            throw new BusinessRuleException("QC_NOTES_REQUIRED",
                "Say what was wrong with the card -- the reprint depends on it.");
        }
        move(result == QcResult.PASS ? PrintStatus.QC_PASSED : PrintStatus.QC_FAILED);
        this.qcResult = result;
        this.qcNotes = notes == null ? null : notes.trim();
    }

    /** chk_printjobs_cancel: CANCELLED requires a reason. */
    public void cancel(String reason) {
        if (!status.isCancellable()) {
            throw new BusinessRuleException("ALREADY_IN_PRODUCTION",
                "Printing has begun and the physical card exists. It cannot be "
              + "cancelled -- fail the quality check and reprint instead.");
        }
        if (reason == null || reason.isBlank()) {
            throw new BusinessRuleException("REASON_REQUIRED", "Say why the job is being cancelled.");
        }
        move(PrintStatus.CANCELLED);
        this.cancelledReason = reason.trim();
    }

    private void move(PrintStatus target) {
        if (!status.canTransitionTo(target)) {
            throw new InvalidStateTransitionException("Print job", status, target);
        }
        this.status = target;
    }

    public boolean isDispatchable() { return status.isDispatchable(); }
    public boolean wasPrinted()     { return printedAt != null; }

    public String getJobNo()               { return jobNo; }
    public IdCard getCard()                { return card; }
    public PrintJobType getJobType()       { return jobType; }
    public PrintStatus getStatus()         { return status; }
    public String getPrinterName()         { return printerName; }
    public LocalDateTime getQueuedAt()     { return queuedAt; }
    public LocalDateTime getPrintedAt()    { return printedAt; }
    public QcResult getQcResult()          { return qcResult; }
    public String getQcNotes()             { return qcNotes; }
    public String getCancelledReason()     { return cancelledReason; }
    public User getCreatedBy()             { return createdBy; }
}
