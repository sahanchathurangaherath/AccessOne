-- =====================================================================
-- Phase 13 -- notifications
--
-- Not part of the 25-table Database module submission. Added here
-- because the notification feature was scoped for this phase.
--
-- Notifications are transient: they are read, and eventually pruned.
-- The permanent record of what happened is audit_logs. That separation
-- is why this table can be added late without touching anything else.
-- =====================================================================

CREATE TABLE notifications (
    id                  BIGINT IDENTITY(1,1) NOT NULL,
    user_id             BIGINT           NOT NULL,
    notification_type   NVARCHAR(40)     NOT NULL,
    title               NVARCHAR(120)    NOT NULL,
    message             NVARCHAR(500)    NOT NULL,
    entity_name         NVARCHAR(60)         NULL,
    entity_id           BIGINT               NULL,
    action_path         NVARCHAR(255)        NULL,
    is_read             BIT              NOT NULL
        CONSTRAINT df_notifications_is_read DEFAULT 0,
    read_at             DATETIME2(0)         NULL,
    created_at          DATETIME2(0)     NOT NULL
        CONSTRAINT df_notifications_created_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT pk_notifications         PRIMARY KEY (id),
    CONSTRAINT fk_notifications_user    FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT chk_notifications_type   CHECK (notification_type IN (
                                            'REQUEST_SUBMITTED', 'REQUEST_APPROVED',
                                            'REQUEST_REJECTED', 'CARD_GENERATED',
                                            'CARD_READY', 'CARD_ACTIVATED',
                                            'CARD_REVOKED', 'PASS_EXPIRING',
                                            'SECURITY_ALERT')),
    -- A read notification must record when. Same shape as the other
    -- "state plus timestamp" constraints across this schema.
    CONSTRAINT chk_notifications_read   CHECK (is_read = 0 OR read_at IS NOT NULL)
);
GO

EXEC sys.sp_addextendedproperty @name = N'MS_Description',
     @value = N'Transient in-app notifications. The permanent record is audit_logs.',
     @level0type = N'SCHEMA', @level0name = N'dbo',
     @level1type = N'TABLE',  @level1name = N'notifications';
GO

-- The unread badge count, on every page load for every user. Filtered to
-- unread only: read notifications are the bulk of the table over time and
-- are never counted.
CREATE INDEX idx_notifications_unread
    ON notifications (user_id, created_at DESC)
    INCLUDE (notification_type, title, message, action_path)
    WHERE is_read = 0;
GO

CREATE INDEX idx_notifications_user_recent
    ON notifications (user_id, created_at DESC);
GO
