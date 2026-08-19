package lk.AccessOne.print.repository;

import lk.AccessOne.print.domain.PrintJob;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/** Read-only reporting -- no CRUD needed, so this extends the bare marker interface, not JpaRepository. */
public interface ProductionReportRepository extends Repository<PrintJob, Long> {

    interface ReprintRateRow {
        String getDeptName();
        int getTotalJobs();
        int getInitialJobs();
        int getReprintJobs();
        BigDecimal getReprintRatePct();
        int getQcFailures();
    }

    interface ThroughputRow {
        LocalDate getPrintDate();
        int getCardsPrinted();
        int getPassed();
        int getFailed();
        BigDecimal getAvgHoursInQueue();
    }

    /**
     * SQL Server has no boolean expression type, so MySQL's
     * SUM(job_type = 'REPRINT') becomes an explicit CASE. NULLIF guards
     * the division for a department with no jobs at all.
     */
    @Query(value = """
           SELECT d.dept_name AS deptName,
                  COUNT(*) AS totalJobs,
                  SUM(CASE WHEN pj.job_type = 'INITIAL' THEN 1 ELSE 0 END) AS initialJobs,
                  SUM(CASE WHEN pj.job_type = 'REPRINT' THEN 1 ELSE 0 END) AS reprintJobs,
                  ROUND(100.0 * SUM(CASE WHEN pj.job_type = 'REPRINT' THEN 1 ELSE 0 END)
                        / NULLIF(COUNT(*), 0), 1) AS reprintRatePct,
                  SUM(CASE WHEN pj.qc_result = 'FAIL' THEN 1 ELSE 0 END) AS qcFailures
           FROM dbo.print_jobs pj
           JOIN dbo.id_cards    c ON c.id = pj.card_id
           JOIN dbo.employees   e ON e.id = c.employee_id
           JOIN dbo.departments d ON d.id = e.department_id
           WHERE pj.status <> 'CANCELLED'
             AND (:fromDate IS NULL OR pj.queued_at >= :fromDate)
           GROUP BY d.id, d.dept_name
           ORDER BY reprintRatePct DESC
           """, nativeQuery = true)
    List<ReprintRateRow> reprintRateByDepartment(@Param("fromDate") LocalDateTime fromDate);

    /** Throughput and turnaround. DATEDIFF takes the unit first in T-SQL. */
    @Query(value = """
           SELECT CAST(pj.printed_at AS DATE) AS printDate,
                  COUNT(*) AS cardsPrinted,
                  SUM(CASE WHEN pj.qc_result = 'PASS' THEN 1 ELSE 0 END) AS passed,
                  SUM(CASE WHEN pj.qc_result = 'FAIL' THEN 1 ELSE 0 END) AS failed,
                  AVG(CAST(DATEDIFF(HOUR, pj.queued_at, pj.printed_at) AS DECIMAL(10,2)))
                      AS avgHoursInQueue
           FROM dbo.print_jobs pj
           WHERE pj.printed_at IS NOT NULL
           GROUP BY CAST(pj.printed_at AS DATE)
           ORDER BY printDate DESC
           """, nativeQuery = true)
    List<ThroughputRow> dailyThroughput();
}
