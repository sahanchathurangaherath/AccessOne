-- ============================================================================
-- V72: Password Reset Tokens for Self-Service Account Recovery
-- ============================================================================

CREATE TABLE password_reset_tokens (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token_hash NVARCHAR(128) NOT NULL,
    expires_at DATETIME2(7) NOT NULL,
    used_at DATETIME2(7) NULL,
    created_at DATETIME2(7) NOT NULL CONSTRAINT df_reset_tokens_created DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_reset_tokens_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT uq_reset_tokens_hash UNIQUE (token_hash)
);

CREATE INDEX ix_reset_tokens_user_expires ON password_reset_tokens(user_id, expires_at);
