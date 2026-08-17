package lk.AccessOne.print.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lk.AccessOne.organisation.domain.Employee;
import lk.AccessOne.shared.domain.AuditableEntity;
import lk.AccessOne.shared.enums.DispatchMethod;
import lk.AccessOne.shared.enums.DispatchStatus;
import lk.AccessOne.shared.error.BusinessRuleException;
import lk.AccessOne.shared.error.InvalidStateTransitionException;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Entity
@Table(name = "dispatch_records")
public class DispatchRecord extends AuditableEntity {

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "print_job_id", nullable = false, unique = true)
    private PrintJob printJob;

    @Enumerated(EnumType.STRING)
    @Column(name = "dispatch_method", nullable = false, length = 20)
    private DispatchMethod dispatchMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 15)
    private DispatchStatus status = DispatchStatus.PENDING;

    @Column(name = "dispatched_at")
    private LocalDateTime dispatchedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "received_by_employee_id")
    private Employee receivedBy;

    @Column(name = "handed_over_at")
    private LocalDateTime handedOverAt;

    @Column(name = "handover_signature_path", length = 255)
    private String handoverSignaturePath;

    @Column(name = "remarks", length = 255)
    private String remarks;

    protected DispatchRecord() { }

    public static DispatchRecord open(PrintJob job, DispatchMethod method, String remarks) {
        if (!job.isDispatchable()) {
            throw new BusinessRuleException("NOT_QC_PASSED",
                "Only a card that has passed its quality check can be dispatched.");
        }
        DispatchRecord record = new DispatchRecord();
        record.printJob = job;
        record.dispatchMethod = method;
        record.remarks = remarks;
        record.status = DispatchStatus.PENDING;
        return record;
    }

    public void dispatch() {
        move(DispatchStatus.DISPATCHED);
        this.dispatchedAt = LocalDateTime.now(ZoneOffset.UTC);
    }

    /**
     * chk_dispatch_delivered: DELIVERED requires BOTH a named receiver and
     * a timestamp. The database enforces the module's central rule --
     * delivery means a named person took the card at a known time.
     */
    public void recordHandover(Employee receiver, String signaturePath) {
        if (receiver == null) {
            throw new BusinessRuleException("RECEIVER_REQUIRED", "Record who received the card.");
        }
        move(DispatchStatus.DELIVERED);
        this.receivedBy = receiver;
        this.handedOverAt = LocalDateTime.now(ZoneOffset.UTC);
        this.handoverSignaturePath = signaturePath;
    }

    public void markReturned(String reason) {
        move(DispatchStatus.RETURNED);
        this.remarks = reason;
    }

    private void move(DispatchStatus target) {
        if (!status.canTransitionTo(target)) {
            throw new InvalidStateTransitionException("Dispatch", status, target);
        }
        this.status = target;
    }

    public PrintJob getPrintJob()                { return printJob; }
    public DispatchMethod getDispatchMethod()    { return dispatchMethod; }
    public DispatchStatus getStatus()            { return status; }
    public LocalDateTime getDispatchedAt()       { return dispatchedAt; }
    public Employee getReceivedBy()              { return receivedBy; }
    public LocalDateTime getHandedOverAt()       { return handedOverAt; }
    public String getHandoverSignaturePath()     { return handoverSignaturePath; }
    public String getRemarks()                   { return remarks; }
}
