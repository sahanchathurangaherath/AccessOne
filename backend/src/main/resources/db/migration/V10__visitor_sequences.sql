-- =====================================================================
-- Module 5 -- visitor and pass numbering, plus the expiry sweep index
--
-- START WITH 7 / 8: V4's sample data already seeds visitors 1-6
-- (VIS-0001 .. VIS-0006) and passes 1-7 (VP-2026-0001 .. VP-2026-0007).
-- =====================================================================

CREATE SEQUENCE dbo.seq_visitor_code AS BIGINT START WITH 7 INCREMENT BY 1 NO CACHE;
GO

CREATE SEQUENCE dbo.seq_pass_no      AS BIGINT START WITH 8 INCREMENT BY 1 NO CACHE;
GO

-- ---------------------------------------------------------------------
-- The expiry sweep runs every few minutes and asks one question: which
-- live passes are past their window? Filtering to live statuses keeps
-- the index tiny -- expired, cancelled and returned rows are the bulk of
-- the table over time and are never scanned by the sweep.
-- ---------------------------------------------------------------------
CREATE INDEX idx_passes_live_expiry
    ON visitor_passes (valid_until)
    INCLUDE (visitor_id, host_employee_id, status)
    WHERE status IN ('ISSUED', 'ACTIVE');
GO

-- ---------------------------------------------------------------------
-- "Who is on site right now" -- open visits only. This is the busiest
-- read in the module and it must never scan the whole log.
-- ---------------------------------------------------------------------
CREATE INDEX idx_visitlogs_open
    ON visit_logs (check_in_at)
    INCLUDE (visitor_pass_id, entry_area_id)
    WHERE check_out_at IS NULL;
GO
