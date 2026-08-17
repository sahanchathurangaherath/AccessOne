-- =====================================================================
-- Module 6 -- job numbering and the print queue
--
-- The sequence exists for the same reason as card serials (V8): MAX + 1
-- is a race, and uq_print_jobs_no would fail one of two concurrent
-- inserts at random.
--
-- START WITH 12: V4's sample data already seeds jobs 1-11 with numbers
-- PJ-2026-0001 through PJ-2026-0011.
-- =====================================================================

CREATE SEQUENCE dbo.seq_print_job_no
    AS BIGINT
    START WITH 12
    INCREMENT BY 1
    NO CACHE;
GO

-- ---------------------------------------------------------------------
-- The production queue: open jobs, oldest first.
--
-- Filtered to work in progress. Completed and cancelled jobs are read on
-- the history screen and never by the queue, so indexing them would add
-- write cost for no read benefit.
-- ---------------------------------------------------------------------
CREATE INDEX idx_print_jobs_open
    ON print_jobs (queued_at)
    INCLUDE (card_id, job_type, status, printer_name)
    WHERE status IN ('QUEUED', 'IN_PROGRESS', 'PRINTED');
GO
