-- V73: AI Gatekeeper Triage & Physical Sentinel Spatio-Temporal Anomaly Support

-- 1. Create table for autonomous AI card request triage and photo compliance
CREATE TABLE card_request_ai_evaluations (
    id                          BIGINT IDENTITY(1,1) NOT NULL,
    card_request_id             BIGINT               NOT NULL,
    risk_score                  INT                  NOT NULL,
    risk_level                  NVARCHAR(20)         NOT NULL,
    recommended_access_level_id BIGINT               NULL,
    recommendation_reason       NVARCHAR(MAX)        NOT NULL,
    photo_compliance_status     NVARCHAR(20)         NOT NULL,
    photo_checks_json           NVARCHAR(MAX)        NOT NULL,
    evaluated_at                DATETIME2(0)         NOT NULL CONSTRAINT df_ai_eval_evaluated_at DEFAULT SYSUTCDATETIME(),
    created_at                  DATETIME2(0)         NOT NULL CONSTRAINT df_ai_eval_created_at DEFAULT SYSUTCDATETIME(),
    updated_at                  DATETIME2(0)         NOT NULL CONSTRAINT df_ai_eval_updated_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT pk_card_request_ai_evaluations PRIMARY KEY (id),
    CONSTRAINT fk_ai_eval_request FOREIGN KEY (card_request_id)
        REFERENCES card_requests (id) ON DELETE CASCADE,
    CONSTRAINT fk_ai_eval_access_level FOREIGN KEY (recommended_access_level_id)
        REFERENCES access_levels (id) ON DELETE SET NULL,
    CONSTRAINT chk_ai_eval_risk_level CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
    CONSTRAINT chk_ai_eval_photo_status CHECK (photo_compliance_status IN ('COMPLIANT', 'NON_COMPLIANT', 'FLAGGED'))
);

CREATE INDEX idx_ai_eval_request_id ON card_request_ai_evaluations (card_request_id);

-- 2. Add spatial coordinates to physical areas for real-time velocity calculations
ALTER TABLE areas ADD geo_x FLOAT NULL, geo_y FLOAT NULL;

-- 3. Seed campus coordinates (meters relative to campus origin)
UPDATE areas SET geo_x = 0.0, geo_y = 0.0 WHERE building = 'Tower A';
UPDATE areas SET geo_x = 550.0, geo_y = 350.0 WHERE building = 'Tower B';
UPDATE areas SET geo_x = 1100.0, geo_y = 800.0 WHERE building = 'Block C';
UPDATE areas SET geo_x = 750.0, geo_y = 200.0 WHERE building = 'Tower C';
UPDATE areas SET geo_x = 400.0, geo_y = 600.0 WHERE building = 'Tech Tower' OR building = 'Building B';
UPDATE areas SET geo_x = 100.0, geo_y = 50.0 WHERE building = 'HQ Building';
UPDATE areas SET geo_x = 850.0, geo_y = 400.0 WHERE geo_x IS NULL;

-- 4. Extend security_alerts constraint to allow Sentinel anomaly types
ALTER TABLE security_alerts DROP CONSTRAINT chk_alerts_type;
ALTER TABLE security_alerts ADD CONSTRAINT chk_alerts_type CHECK (alert_type IN (
    'REPEATED_DENIAL', 'BLACKLIST_ATTEMPT', 'REVOKED_CARD_USE',
    'EXPIRED_PASS_USE', 'RESTRICTED_AREA_ATTEMPT', 'AFTER_HOURS_ACCESS',
    'IMPOSSIBLE_TRAVEL', 'OFF_HOURS_ANOMALY', 'PRIVILEGE_CREEP'
));
