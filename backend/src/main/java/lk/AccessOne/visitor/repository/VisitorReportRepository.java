package lk.AccessOne.visitor.repository;

import lk.AccessOne.visitor.domain.VisitLog;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/** Read-only reporting -- no CRUD needed, so this extends the bare marker interface, not JpaRepository. */
public interface VisitorReportRepository extends Repository<VisitLog, Long> {

    interface DailyRow {
        LocalDate getVisitDate();
        int getTotalVisits();
        int getStillOnSite();
        int getDistinctVisitors();
        int getContractorVisits();
        BigDecimal getAvgMinutesOnSite();
    }

    /** CAST(... AS DECIMAL) inside AVG matters -- DATEDIFF returns INT, and integer division would truncate the average. */
    @Query(value = """
           SELECT CAST(vl.check_in_at AS DATE) AS visitDate,
                  COUNT(*) AS totalVisits,
                  SUM(CASE WHEN vl.check_out_at IS NULL THEN 1 ELSE 0 END) AS stillOnSite,
                  COUNT(DISTINCT v.id) AS distinctVisitors,
                  SUM(CASE WHEN v.visitor_type = 'CONTRACTOR' THEN 1 ELSE 0 END)
                      AS contractorVisits,
                  AVG(CAST(DATEDIFF(MINUTE, vl.check_in_at,
                           COALESCE(vl.check_out_at, SYSUTCDATETIME())) AS DECIMAL(10,2)))
                      AS avgMinutesOnSite
           FROM dbo.visit_logs vl
           JOIN dbo.visitor_passes vp ON vp.id = vl.visitor_pass_id
           JOIN dbo.visitors       v  ON v.id  = vp.visitor_id
           WHERE vl.check_in_at >= :fromDate
           GROUP BY CAST(vl.check_in_at AS DATE)
           ORDER BY visitDate DESC
           """, nativeQuery = true)
    List<DailyRow> dailySummary(@Param("fromDate") LocalDateTime fromDate);
}
