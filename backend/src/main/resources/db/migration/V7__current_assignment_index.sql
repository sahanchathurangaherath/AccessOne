-- =====================================================================
-- Module 3 -- current access level for a card
--
-- The access decision engine asks "which level does this card hold right
-- now" on every entry attempt, so this lookup must never table-scan.
--
-- Filtered to current assignments only. Revoked rows are history: they
-- are read on the assignment-history screen and never by the engine, so
-- indexing them would add write cost for no read benefit.
-- =====================================================================

CREATE INDEX idx_caa_card_current
    ON card_access_assignments (card_id)
    INCLUDE (access_level_id, valid_from)
    WHERE is_current = 1;
GO
