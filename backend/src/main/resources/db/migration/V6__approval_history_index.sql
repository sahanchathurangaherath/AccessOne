-- =====================================================================
-- Module 2 -- approval history
--
-- Backs "decisions made by this user, most recent first", which is the
-- HR history screen and the approval-turnaround report.
--
-- Filtered to concluded decisions only: PENDING and VERIFIED rows are
-- served by v_pending_request_queue and never appear in history, so
-- indexing them would be dead weight on every write.
-- =====================================================================

CREATE INDEX idx_approvals_decider_time
    ON approvals (decided_by, decided_at DESC)
    WHERE decision IN ('APPROVED', 'REJECTED');
GO
