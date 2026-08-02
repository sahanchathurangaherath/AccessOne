-- =====================================================================
-- AccessOne - reporting-queries.sql
-- Target: Microsoft SQL Server 2022 or later
--
-- NOT a Flyway migration. This file lives in /database and is a DB module
-- deliverable: the analytical queries behind the dashboards and reports.
--
-- Run against the `accessone` database after V1-V4 have been applied.
--
-- PLATFORM NOTES
--   * SQL Server has no boolean expression type, so MySQL's SUM(x = 'y')
--     becomes SUM(CASE WHEN x = 'y' THEN 1 ELSE 0 END) throughout.
--   * A column alias cannot be used in GROUP BY or HAVING - the full
--     expression has to be repeated. It CAN be used in ORDER BY.
--   * DATEDIFF takes the unit first: DATEDIFF(HOUR, start, end).
--     MySQL's DATEDIFF(end, start) has the arguments the other way round,
--     which is an easy way to get a negative number and not notice.
-- =====================================================================


-- ---------------------------------------------------------------------
-- Q1. Cards issued per department
-- Used by: IT Administrator dashboard
-- ---------------------------------------------------------------------
SELECT
    d.dept_code,
    d.dept_name,
    COUNT(c.id)                                                     AS cards_issued,
    SUM(CASE WHEN c.status = 'ACTIVE'  THEN 1 ELSE 0 END)           AS active_cards,
    SUM(CASE WHEN c.status = 'REVOKED' THEN 1 ELSE 0 END)           AS revoked_cards,
    ROUND(100.0 * SUM(CASE WHEN c.status = 'ACTIVE' THEN 1 ELSE 0 END)
          / NULLIF(COUNT(c.id), 0), 1)                              AS active_pct
FROM dbo.departments d
LEFT JOIN dbo.employees e ON e.department_id = d.id
LEFT JOIN dbo.id_cards  c ON c.employee_id   = e.id
GROUP BY d.id, d.dept_code, d.dept_name
ORDER BY cards_issued DESC, d.dept_name;


-- ---------------------------------------------------------------------
-- Q2. Average approval turnaround time
-- Used by: HR dashboard and the process efficiency section of the report
-- Measured from submission to final decision, in hours.
-- ---------------------------------------------------------------------
SELECT
    COUNT(*)                                                        AS decided_requests,
    ROUND(AVG(CAST(DATEDIFF(HOUR, r.submitted_at, a.decided_at) AS DECIMAL(10,2))), 1)
                                                                    AS avg_hours,
    MIN(DATEDIFF(HOUR, r.submitted_at, a.decided_at))               AS fastest_hours,
    MAX(DATEDIFF(HOUR, r.submitted_at, a.decided_at))               AS slowest_hours
FROM dbo.approvals a
JOIN dbo.card_requests r ON r.id = a.card_request_id
WHERE a.decision IN ('APPROVED', 'REJECTED')
  AND a.decided_at IS NOT NULL;

-- The CAST above matters. DATEDIFF returns INT, and AVG over INT does
-- integer division - 23.8 hours would be reported as 23.


-- Same measure, broken down by month, to show the trend.
SELECT
    CONVERT(CHAR(7), r.submitted_at, 126)                           AS [month],
    COUNT(*)                                                        AS decided_requests,
    ROUND(AVG(CAST(DATEDIFF(HOUR, r.submitted_at, a.decided_at) AS DECIMAL(10,2))), 1)
                                                                    AS avg_hours
FROM dbo.approvals a
JOIN dbo.card_requests r ON r.id = a.card_request_id
WHERE a.decision IN ('APPROVED', 'REJECTED')
  AND a.decided_at IS NOT NULL
GROUP BY CONVERT(CHAR(7), r.submitted_at, 126)
ORDER BY [month];


-- ---------------------------------------------------------------------
-- Q3. Denied access attempts per area
-- Used by: Security Officer dashboard
-- ---------------------------------------------------------------------
SELECT
    l.area_name,
    COUNT(*)                                                        AS total_attempts,
    SUM(CASE WHEN l.decision = 'DENIED' THEN 1 ELSE 0 END)          AS denied_attempts,
    ROUND(100.0 * SUM(CASE WHEN l.decision = 'DENIED' THEN 1 ELSE 0 END)
          / COUNT(*), 1)                                            AS denial_rate_pct
FROM dbo.access_logs l
GROUP BY l.area_name
HAVING SUM(CASE WHEN l.decision = 'DENIED' THEN 1 ELSE 0 END) > 0
ORDER BY denied_attempts DESC;


-- Denials broken down by reason, which is what actually drives action.
SELECT
    l.denial_reason,
    COUNT(*)                                                        AS occurrences,
    COUNT(DISTINCT l.credential_ref)                                AS distinct_credentials
FROM dbo.access_logs l
WHERE l.decision = 'DENIED'
GROUP BY l.denial_reason
ORDER BY occurrences DESC;


-- ---------------------------------------------------------------------
-- Q4. Active versus revoked cards
-- Used by: executive summary tile
-- ---------------------------------------------------------------------
SELECT
    status,
    COUNT(*)                                                        AS card_count,
    ROUND(100.0 * COUNT(*)
          / (SELECT COUNT(*) FROM dbo.id_cards), 1)                 AS pct_of_total
FROM dbo.id_cards
GROUP BY status
ORDER BY card_count DESC;


-- ---------------------------------------------------------------------
-- Q5. Reprint rate
-- Used by: Print Supervisor production report
-- A high reprint rate points at a printer or a photo-quality problem.
-- ---------------------------------------------------------------------
SELECT
    COUNT(*)                                                        AS total_jobs,
    SUM(CASE WHEN job_type  = 'INITIAL' THEN 1 ELSE 0 END)          AS initial_jobs,
    SUM(CASE WHEN job_type  = 'REPRINT' THEN 1 ELSE 0 END)          AS reprint_jobs,
    ROUND(100.0 * SUM(CASE WHEN job_type = 'REPRINT' THEN 1 ELSE 0 END)
          / NULLIF(COUNT(*), 0), 1)                                 AS reprint_rate_pct,
    SUM(CASE WHEN qc_result = 'FAIL'    THEN 1 ELSE 0 END)          AS failed_quality_checks
FROM dbo.print_jobs
WHERE status <> 'CANCELLED';


-- ---------------------------------------------------------------------
-- Q6. Daily visitor report
-- Used by: Security Officer, end of day
-- ---------------------------------------------------------------------
SELECT
    CAST(vl.check_in_at AS DATE)                                    AS visit_date,
    COUNT(*)                                                        AS total_visits,
    SUM(CASE WHEN vl.check_out_at IS NULL THEN 1 ELSE 0 END)        AS still_on_site,
    COUNT(DISTINCT v.id)                                            AS distinct_visitors,
    SUM(CASE WHEN v.visitor_type = 'CONTRACTOR' THEN 1 ELSE 0 END)  AS contractor_visits,
    ROUND(AVG(CAST(DATEDIFF(MINUTE, vl.check_in_at,
              COALESCE(vl.check_out_at, SYSUTCDATETIME())) AS DECIMAL(10,2))), 0)
                                                                    AS avg_minutes_on_site
FROM dbo.visit_logs vl
JOIN dbo.visitor_passes vp ON vp.id = vl.visitor_pass_id
JOIN dbo.visitors       v  ON v.id  = vp.visitor_id
GROUP BY CAST(vl.check_in_at AS DATE)
ORDER BY visit_date DESC;


-- ---------------------------------------------------------------------
-- Q7. Cards awaiting action - the operational backlog
-- Used by: Print Supervisor and IT Administrator
-- ---------------------------------------------------------------------
SELECT
    c.card_serial,
    c.status                                                        AS card_status,
    CONCAT(e.first_name, ' ', e.last_name)                          AS employee_name,
    d.dept_name,
    pj.job_no,
    pj.status                                                       AS print_status,
    DATEDIFF(DAY, c.issue_date, CAST(SYSUTCDATETIME() AS DATE))     AS days_since_issue
FROM dbo.id_cards c
JOIN dbo.employees   e  ON e.id = c.employee_id
JOIN dbo.departments d  ON d.id = e.department_id
LEFT JOIN dbo.print_jobs pj ON pj.card_id = c.id
                           AND pj.status <> 'CANCELLED'
WHERE c.status IN ('GENERATED', 'QUEUED_FOR_PRINT', 'PRINTED', 'DISPATCHED')
ORDER BY days_since_issue DESC;


-- ---------------------------------------------------------------------
-- Q8. Employees with no active card
-- Used by: HR compliance check - who is working without a valid credential
-- ---------------------------------------------------------------------
SELECT
    e.emp_id,
    CONCAT(e.first_name, ' ', e.last_name)                          AS employee_name,
    d.dept_name,
    e.employment_status,
    e.date_joined,
    (SELECT COUNT(*) FROM dbo.card_requests r
      WHERE r.employee_id = e.id)                                   AS request_count
FROM dbo.employees e
JOIN dbo.departments d ON d.id = e.department_id
WHERE e.employment_status = 'ACTIVE'
  AND NOT EXISTS (
      SELECT 1 FROM dbo.id_cards c
       WHERE c.employee_id = e.id
         AND c.status = 'ACTIVE')
ORDER BY e.date_joined;


-- ---------------------------------------------------------------------
-- Q9. Peak access hours
-- Used by: capacity planning at entry points
-- ---------------------------------------------------------------------
SELECT
    DATEPART(HOUR, access_time)                                     AS hour_of_day,
    COUNT(*)                                                        AS access_events,
    SUM(CASE WHEN direction = 'IN'  THEN 1 ELSE 0 END)              AS entries,
    SUM(CASE WHEN direction = 'OUT' THEN 1 ELSE 0 END)              AS exits
FROM dbo.access_logs
WHERE decision = 'GRANTED'
GROUP BY DATEPART(HOUR, access_time)
ORDER BY hour_of_day;


-- ---------------------------------------------------------------------
-- Q10. Audit trail for a single card
-- Used by: the audit panel on the card detail screen
-- Replace the parameter with the card id under investigation.
-- ---------------------------------------------------------------------
DECLARE @card_id BIGINT = 9;   -- the revoked card

SELECT
    al.performed_at,
    al.action,
    al.performed_by_username,
    al.old_value,
    al.new_value,
    al.ip_address
FROM dbo.audit_logs al
WHERE al.entity_name = 'id_cards'
  AND al.entity_id   = @card_id
ORDER BY al.performed_at;