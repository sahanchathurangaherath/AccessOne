package lk.AccessOne.visitor.repository;

import lk.AccessOne.visitor.domain.VisitLog;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;

import java.time.LocalDateTime;
import java.util.List;

/** Reads the Phase 1 view rather than rebuilding its logic. */
public interface OnSiteRepository extends Repository<VisitLog, Long> {

    interface OnSiteRow {
        Long getVisitLogId();
        Long getPassId();
        String getVisitorCode();
        String getVisitorName();
        String getCompany();
        String getVisitorType();
        String getPassNo();
        String getPassStatus();
        LocalDateTime getValidUntil();
        String getHostName();
        String getHostEmpId();
        String getEntryArea();
        LocalDateTime getCheckInAt();
        Integer getMinutesOnSite();
        Boolean getPassOverdue();
    }

    @Query(value = """
           SELECT visit_log_id AS visitLogId, pass_id AS passId, visitor_code AS visitorCode,
                  visitor_name AS visitorName, company, visitor_type AS visitorType,
                  pass_no AS passNo, pass_status AS passStatus,
                  valid_until AS validUntil, host_name AS hostName,
                  host_emp_id AS hostEmpId, entry_area AS entryArea,
                  check_in_at AS checkInAt, minutes_on_site AS minutesOnSite,
                  pass_overdue AS passOverdue
           FROM dbo.v_current_visitors
           ORDER BY check_in_at ASC
           """, nativeQuery = true)
    List<OnSiteRow> findOnSite();
}
