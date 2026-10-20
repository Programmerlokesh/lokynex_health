-- Refresh token storage — supports short-lived access tokens + long-lived refresh flow.
-- Token itself is NEVER stored raw — only its SHA-256 hash, so a DB leak alone
-- cannot be used to impersonate a user (mirrors how passwords are hashed, not stored raw).
CREATE TABLE refresh_tokens (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash              VARCHAR(255) NOT NULL,
    expires_at              TIMESTAMPTZ NOT NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at              TIMESTAMPTZ,
    replaced_by_token_hash  VARCHAR(255),
    UNIQUE (token_hash)
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens (token_hash);