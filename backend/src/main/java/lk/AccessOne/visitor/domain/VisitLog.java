package lk.AccessOne.visitor.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lk.AccessOne.access.domain.Area;
import lk.AccessOne.identity.domain.User;
import lk.AccessOne.shared.domain.BaseEntity;
import lk.AccessOne.shared.error.BusinessRuleException;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

/** visit_logs has created_at but no updated_at -- a visit event is a record, not a document. */
@Entity
@Table(name = "visit_logs")
public class VisitLog extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "visitor_pass_id", nullable = false)
    private VisitorPass pass;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entry_area_id")
    private Area entryArea;

    @Column(name = "check_in_at", nullable = false)
    private LocalDateTime checkInAt;

    @Column(name = "check_out_at")
    private LocalDateTime checkOutAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recorded_by", nullable = false)
    private User recordedBy;

    @Column(name = "remarks", length = 255)
    private String remarks;

    protected VisitLog() { }

    public static VisitLog checkIn(VisitorPass pass, Area area, User recorder) {
        VisitLog log = new VisitLog();
        log.pass = pass;
        log.entryArea = area;
        log.recordedBy = recorder;
        log.checkInAt = LocalDateTime.now(ZoneOffset.UTC);
        return log;
    }

    /** chk_visitlogs_times: check_out_at must not precede check_in_at. */
    public void checkOut(String remarks) {
        if (checkOutAt != null) {
            throw new BusinessRuleException("ALREADY_CHECKED_OUT", "This visit was already closed.");
        }
        this.checkOutAt = LocalDateTime.now(ZoneOffset.UTC);
        this.remarks = remarks;
    }

    /** Used by the expiry sweep to close a visit at the pass end time. */
    public void closeAt(LocalDateTime moment, String remarks) {
        this.checkOutAt = moment.isBefore(checkInAt) ? checkInAt : moment;
        this.remarks = remarks;
    }

    public boolean isOpen() { return checkOutAt == null; }

    public VisitorPass getPass()           { return pass; }
    public Area getEntryArea()             { return entryArea; }
    public LocalDateTime getCheckInAt()    { return checkInAt; }
    public LocalDateTime getCheckOutAt()   { return checkOutAt; }
    public User getRecordedBy()            { return recordedBy; }
    public String getRemarks()             { return remarks; }
}
