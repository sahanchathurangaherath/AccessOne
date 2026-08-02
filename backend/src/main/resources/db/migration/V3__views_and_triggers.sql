-- =====================================================================
-- AccessOne - V3__views_and_triggers.sql
-- Target: Microsoft SQL Server 2022 or later
--
-- Views, Audit Triggers, and Automated Maintenance Stored Procedures
--
-- Summary:
--   * Views: Provide aggregated metrics and operational queues for
--     reporting, security monitoring, and administrative dashboards.
--   * Triggers: Provide database-level audit logging on critical status changes
--     using set-based `inserted` and `deleted` tables and SESSION_CONTEXT user tracking.
--   * Stored Procedures: Maintenance procedures for routine automated tasks,
--     such as expiring past-due visitor passes.
-- =====================================================================
GO


-- =====================================================================
-- VIEWS
-- =====================================================================

-- v_card_status_summary
-- Aggregated summary view of ID card statuses grouped by department
CREATE OR ALTER VIEW dbo.v_card_status_summary AS
SELECT
    d.id                                                        AS department_id,
    d.dept_code                                                 AS dept_code,
    d.dept_name                                                 AS dept_name,
    COUNT(c.id)                                                 AS total_cards,
    SUM(CASE WHEN c.status = 'ACTIVE'    THEN 1 ELSE 0 END)     AS active_cards,
    SUM(CASE WHEN c.status IN ('GENERATED', 'QUEUED_FOR_PRINT',
                               'PRINTED', 'DISPATCHED')
             THEN 1 ELSE 0 END)                                 AS in_progress_cards,
    SUM(CASE WHEN c.status = 'REVOKED'   THEN 1 ELSE 0 END)     AS revoked_cards,
    SUM(CASE WHEN c.status = 'SUSPENDED' THEN 1 ELSE 0 END)     AS suspended_cards,
    SUM(CASE WHEN c.status IN ('LOST', 'DAMAGED')
             THEN 1 ELSE 0 END)                                 AS lost_or_damaged_cards,
    SUM(CASE WHEN c.status = 'REPLACED'  THEN 1 ELSE 0 END)     AS replaced_cards
FROM dbo.departments d
LEFT JOIN dbo.employees e ON e.department_id = d.id
LEFT JOIN dbo.id_cards  c ON c.employee_id   = e.id
GROUP BY d.id, d.dept_code, d.dept_name;
GO


-- v_current_visitors
-- Active site visitor view tracking open visits (check_out_at IS NULL)
CREATE OR ALTER VIEW dbo.v_current_visitors AS
SELECT
    vl.id                                                       AS visit_log_id,
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


-- v_pending_request_queue
-- Pending request queue view with request ageing indicators
CREATE OR ALTER VIEW dbo.v_pending_request_queue AS
SELECT
    r.id                                                        AS request_id,
    r.request_no                                                AS request_no,
    r.request_type                                              AS request_type,
    r.status                                                    AS status,
    r.submitted_at                                              AS submitted_at,
    e.emp_id                                                    AS emp_id,
    CONCAT(e.first_name, ' ', e.last_name)                      AS employee_name,
    e.designation                                               AS designation,
    d.dept_name                                                 AS dept_name,
    ap.decision                                                 AS approval_decision,
    DATEDIFF(HOUR, r.submitted_at, SYSUTCDATETIME())            AS hours_pending,
    CASE
        WHEN DATEDIFF(HOUR, r.submitted_at, SYSUTCDATETIME()) > 72 THEN 'OVERDUE'
        WHEN DATEDIFF(HOUR, r.submitted_at, SYSUTCDATETIME()) > 24 THEN 'AGEING'
        ELSE 'NORMAL'
    END                                                         AS ageing_flag
FROM dbo.card_requests r
JOIN dbo.employees   e  ON e.id = r.employee_id
JOIN dbo.departments d  ON d.id = e.department_id
LEFT JOIN dbo.approvals ap ON ap.card_request_id = r.id
WHERE r.status IN ('SUBMITTED', 'UNDER_VERIFICATION');
GO


-- =====================================================================
-- TRIGGERS
--
-- Triggers capture automated audit entries in `audit_logs` upon key
-- data modifications, capturing user context from SESSION_CONTEXT.
-- =====================================================================

-- Audit trigger for ID card status changes
CREATE OR ALTER TRIGGER dbo.trg_id_cards_status_audit
ON dbo.id_cards
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT UPDATE(status) RETURN;

    INSERT INTO dbo.audit_logs (
        entity_name, entity_id, action,
        old_value, new_value,
        performed_by_username, performed_at
    )
    SELECT
        'id_cards', i.id, 'STATUS_CHANGE',
        JSON_OBJECT('status': d.status, 'card_serial': d.card_serial),
        JSON_OBJECT('status': i.status, 'card_serial': i.card_serial),
        COALESCE(CAST(SESSION_CONTEXT(N'app_username') AS NVARCHAR(50)), 'SYSTEM'),
        SYSUTCDATETIME()
    FROM inserted i
    JOIN deleted  d ON d.id = i.id
    WHERE i.status <> d.status;
END;
GO


-- Audit trigger for ID card creation
CREATE OR ALTER TRIGGER dbo.trg_id_cards_create_audit
ON dbo.id_cards
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.audit_logs (
        entity_name, entity_id, action,
        old_value, new_value,
        performed_by_username, performed_at
    )
    SELECT
        'id_cards', i.id, 'CREATE',
        NULL,
        JSON_OBJECT('card_serial': i.card_serial,
                    'status':      i.status,
                    'employee_id': i.employee_id),
        COALESCE(CAST(SESSION_CONTEXT(N'app_username') AS NVARCHAR(50)), 'SYSTEM'),
        SYSUTCDATETIME()
    FROM inserted i;
END;
GO


-- Audit trigger for visitor pass status updates
CREATE OR ALTER TRIGGER dbo.trg_visitor_passes_status_audit
ON dbo.visitor_passes
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT UPDATE(status) RETURN;

    INSERT INTO dbo.audit_logs (
        entity_name, entity_id, action,
        old_value, new_value,
        performed_by_username, performed_at
    )
    SELECT
        'visitor_passes', i.id, 'STATUS_CHANGE',
        JSON_OBJECT('status': d.status, 'pass_no': d.pass_no),
        JSON_OBJECT('status': i.status, 'pass_no': i.pass_no),
        COALESCE(CAST(SESSION_CONTEXT(N'app_username') AS NVARCHAR(50)), 'SYSTEM'),
        SYSUTCDATETIME()
    FROM inserted i
    JOIN deleted  d ON d.id = i.id
    WHERE i.status <> d.status;
END;
GO


-- =====================================================================
-- STORED PROCEDURES
-- =====================================================================

-- sp_expire_visitor_passes
-- Automatically updates past-due visitor passes to EXPIRED status
-- and auto-closes corresponding open visit log records.
CREATE OR ALTER PROCEDURE dbo.sp_expire_visitor_passes
    @p_expired_count INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.visitor_passes
       SET status = 'EXPIRED'
     WHERE status IN ('ISSUED', 'ACTIVE')
       AND valid_until < SYSUTCDATETIME();

    SET @p_expired_count = @@ROWCOUNT;

    -- Auto-close active visits associated with newly expired visitor passes
    UPDATE vl
       SET vl.check_out_at = vp.valid_until,
           vl.remarks      = CONCAT_WS(' | ', vl.remarks,
                                       'Auto-closed on pass expiry')
      FROM dbo.visit_logs vl
      JOIN dbo.visitor_passes vp ON vp.id = vl.visitor_pass_id
     WHERE vl.check_out_at IS NULL
       AND vp.status = 'EXPIRED';
END;
GO


-- =====================================================================
-- End of Migration Script V3__views_and_triggers.sql
-- =====================================================================