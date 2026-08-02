-- =====================================================================
-- AccessOne - V2__indexes.sql
-- Target: Microsoft SQL Server 2022 or later
--
-- Performance Index Optimization Migration Script
--
-- This script creates non-clustered and filtered indexes to optimize
-- search performance, join performance on foreign key columns, and
-- common query paths across the application.
--
-- Key Index Strategies:
--   * Foreign Key Coverage: Explicit indexes on foreign key columns used in joins
--     and cascading referential integrity checks.
--   * Filtered Indexes: Used on conditional status columns (e.g. open visits,
--     active blacklists) to maintain compact index sizes and high speed.
--   * Covering & Ordered Indexes: Multi-column indexes supporting common sort orders
--     (e.g., access log timestamps, audit records).
-- =====================================================================


-- access_logs — the largest table and the one queried hardest

-- "Show access history for card, newest first"
CREATE INDEX idx_access_logs_card_time
    ON access_logs (card_id, access_time DESC);

-- "Show access history for visitor pass"
CREATE INDEX idx_access_logs_pass_time
    ON access_logs (visitor_pass_id, access_time DESC);

-- "Denied access attempts per area report"
CREATE INDEX idx_access_logs_area_decision
    ON access_logs (area_id, decision, access_time);

-- "Access events date range lookups"
CREATE INDEX idx_access_logs_time
    ON access_logs (access_time DESC);

-- "Repeated denial monitoring for security alerts"
CREATE INDEX idx_access_logs_decision_time
    ON access_logs (decision, access_time);


-- card_requests

-- "Pending approval queue lookups"
CREATE INDEX idx_card_requests_status
    ON card_requests (status, submitted_at);

-- "Employee request history lookups"
CREATE INDEX idx_card_requests_emp_status
    ON card_requests (employee_id, status);


-- id_cards

-- "Active vs revoked cards" and "cards awaiting print"
CREATE INDEX idx_id_cards_status
    ON id_cards (status);

-- "All cards belonging to this employee, current one first"
CREATE INDEX idx_id_cards_emp_status
    ON id_cards (employee_id, status);


-- approvals

-- "Average approval time"  (reporting query)
CREATE INDEX idx_approvals_decision_time
    ON approvals (decision, decided_at);


-- print_jobs

-- "Print queue, oldest first"  (print supervisor dashboard)
CREATE INDEX idx_print_jobs_status_queued
    ON print_jobs (status, queued_at);

-- "Reprint rate"  (production report)
CREATE INDEX idx_print_jobs_type_status
    ON print_jobs (job_type, status);


-- visitor_passes

-- "Passes expiring soon" and the scheduled expiry sweep
CREATE INDEX idx_visitor_passes_status_until
    ON visitor_passes (status, valid_until);


-- visit_logs

-- Filtered index for active visitors currently on site (check_out_at IS NULL)
CREATE INDEX idx_visit_logs_open
    ON visit_logs (check_in_at)
    WHERE check_out_at IS NULL;

-- "Visit history for this pass"
CREATE INDEX idx_visit_logs_pass_in
    ON visit_logs (visitor_pass_id, check_in_at DESC);


-- employees

-- "Cards issued per department" and department staff listings
CREATE INDEX idx_employees_dept_status
    ON employees (department_id, employment_status);

-- Name search on the employee picker
CREATE INDEX idx_employees_name
    ON employees (last_name, first_name);


-- blacklist

-- Filtered indexes for active blacklist checks during access decision processing
CREATE INDEX idx_blacklist_active_card
    ON blacklist (card_id)
    WHERE is_active = 1 AND card_id IS NOT NULL;

CREATE INDEX idx_blacklist_active_visitor
    ON blacklist (visitor_id)
    WHERE is_active = 1 AND visitor_id IS NOT NULL;


-- security_alerts

-- "Open alerts, most severe first"  (security dashboard)
CREATE INDEX idx_security_alerts_status
    ON security_alerts (status, severity, created_at DESC);


-- audit_logs

-- "Full history of this one record"  (audit trail on any detail screen)
CREATE INDEX idx_audit_logs_entity
    ON audit_logs (entity_name, entity_id, performed_at DESC);

-- "Everything this user did"  and the default audit viewer sort
CREATE INDEX idx_audit_logs_user_time
    ON audit_logs (performed_by, performed_at DESC);
GO


-- Foreign key supporting indexes
--
-- SQL Server does not create these automatically. Each one below backs a
-- join the application actually performs, or a referential check that runs
-- on delete. Foreign keys already covered by a UNIQUE constraint or by a
-- composite index above are deliberately not repeated.

CREATE INDEX idx_users_role              ON users (role_id);
CREATE INDEX idx_role_permissions_perm   ON role_permissions (permission_id);
CREATE INDEX idx_access_level_areas_area ON access_level_areas (area_id);
CREATE INDEX idx_request_documents_req   ON request_documents (card_request_id);
CREATE INDEX idx_approval_comments_appr  ON approval_comments (approval_id);
CREATE INDEX idx_id_cards_level          ON id_cards (access_level_id);
CREATE INDEX idx_print_jobs_card         ON print_jobs (card_id);
CREATE INDEX idx_dispatch_receiver       ON dispatch_records (received_by_employee_id);
CREATE INDEX idx_visitors_host           ON visitors (host_employee_id);
CREATE INDEX idx_visitor_passes_visitor  ON visitor_passes (visitor_id);
CREATE INDEX idx_visitor_passes_host     ON visitor_passes (host_employee_id);
CREATE INDEX idx_visitor_passes_level    ON visitor_passes (access_level_id);
GO


-- =====================================================================
-- End of Migration Script V2__indexes.sql
-- =====================================================================