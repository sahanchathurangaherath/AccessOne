-- =====================================================================
-- Module 1 -- request number generation
--
-- A sequence rather than MAX(request_no) + 1, which is a race: two
-- concurrent submissions read the same maximum and produce the same
-- number, and the UNIQUE constraint then fails one of them at random.
--
-- NO CACHE trades a small amount of throughput for contiguous numbers
-- across a service restart. At this volume the throughput is irrelevant
-- and a gap in a request number invites questions in a demo.
-- =====================================================================

CREATE SEQUENCE dbo.seq_card_request_no
    AS BIGINT
    START WITH 16
    INCREMENT BY 1
    NO CACHE;
GO
