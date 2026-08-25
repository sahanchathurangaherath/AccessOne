-- =====================================================================
-- Phase 12 — access decision engine
--
-- Two lookups run on EVERY entry attempt and must never table-scan.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Blacklist check. Filtered to active entries: a released entry is
-- history and is never consulted by the engine.
--
-- V2 already created idx_blacklist_active_card and
-- idx_blacklist_active_visitor. This adds the covering column so the
-- engine can answer without touching the table at all.
-- ---------------------------------------------------------------------
DROP INDEX idx_blacklist_active_card ON blacklist;
GO

CREATE INDEX idx_blacklist_active_card
    ON blacklist (card_id)
    INCLUDE (reason, blacklisted_at)
    WHERE is_active = 1 AND card_id IS NOT NULL;
GO

DROP INDEX idx_blacklist_active_visitor ON blacklist;
GO

CREATE INDEX idx_blacklist_active_visitor
    ON blacklist (visitor_id)
    INCLUDE (reason, blacklisted_at)
    WHERE is_active = 1 AND visitor_id IS NOT NULL;
GO

-- ---------------------------------------------------------------------
-- Repeated-denial detection: "how many times has this credential been
-- refused in the last N minutes". Runs after every denial.
-- ---------------------------------------------------------------------
CREATE INDEX idx_accesslogs_denials
    ON access_logs (credential_ref, access_time DESC)
    INCLUDE (area_name, denial_reason)
    WHERE decision = 'DENIED';
GO

-- ---------------------------------------------------------------------
-- The open-alert queue for the security dashboard.
-- ---------------------------------------------------------------------
CREATE INDEX idx_alerts_open
    ON security_alerts (created_at DESC)
    INCLUDE (alert_type, severity, message, area_id)
    WHERE status = 'OPEN';
GO