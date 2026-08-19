-- =====================================================================
-- Module 5 -- add pass_id to v_current_visitors
--
-- The original view (V3) exposes pass_no but not the pass's own id.
-- The on-site board needs to call POST /passes/{id}/check-out, which
-- takes the numeric id, not the pass number -- so the view is missing
-- exactly the column the busiest screen in this module needs.
-- =====================================================================

CREATE OR ALTER VIEW dbo.v_current_visitors AS
SELECT
    vl.id                                                       AS visit_log_id,
    vp.id                                                       AS pass_id,
    v.visitor_code                                              AS visitor_code,
    v.full_name                                                 AS visitor_name,
    v.company                                                   AS company,
    v.visitor_type                                              AS visitor_type,
    vp.pass_no                                                  AS pass_no,
    vp.status                                                   AS pass_status,
    vp.valid_until                                              AS valid_until,
    CONCAT(h.first_name, ' ', h.last_name)                      AS host_name,
    h.emp_id                                                    AS host_emp_id,
    a.area_name                                                 AS entry_area,
    vl.check_in_at                                              AS check_in_at,
    DATEDIFF(MINUTE, vl.check_in_at, SYSUTCDATETIME())          AS minutes_on_site,
    CAST(CASE WHEN vp.valid_until < SYSUTCDATETIME()
              THEN 1 ELSE 0 END AS BIT)                         AS pass_overdue
FROM dbo.visit_logs vl
JOIN dbo.visitor_passes vp ON vp.id = vl.visitor_pass_id
JOIN dbo.visitors       v  ON v.id  = vp.visitor_id
JOIN dbo.employees      h  ON h.id  = vp.host_employee_id
LEFT JOIN dbo.areas     a  ON a.id  = vl.entry_area_id
WHERE vl.check_out_at IS NULL;
GO
