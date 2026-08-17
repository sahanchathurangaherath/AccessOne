-- =====================================================================
-- Module 4 -- card serial generation
--
-- A sequence, for the same reason as request numbers (V5): MAX(card_serial)
-- + 1 is a race. Two approvals committing at the same moment would read
-- the same maximum and produce the same serial, and uq_id_cards_serial
-- would then fail one of them at random.
--
-- Serials are also security-relevant, not just a data-quality concern.
-- They are the credential presented at the door, so a duplicate is a
-- security failure.
--
-- START WITH 10: V4's sample data already seeds cards 1-9 with serials
-- ACO-2026-000001 through ACO-2026-000009. The sequence continues from
-- the next one rather than colliding with the fixtures.
-- =====================================================================

CREATE SEQUENCE dbo.seq_card_serial
    AS BIGINT
    START WITH 10
    INCREMENT BY 1
    NO CACHE;
GO
