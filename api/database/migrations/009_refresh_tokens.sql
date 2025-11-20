-- Migration: Refresh Token Storage for JWT Token Rotation
-- Description: Creates table for storing refresh tokens with revocation support
-- Security: Implements secure token rotation pattern (OWASP recommendation)
-- Created: 2025-11-20

-- Create refresh_tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP WITH TIME ZONE,

    -- Add indexes for performance
    CONSTRAINT refresh_tokens_token_hash_unique UNIQUE(token_hash)
);

-- Create indexes for efficient lookups
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX idx_refresh_tokens_revoked_at ON refresh_tokens(revoked_at);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

-- Add comments for documentation
COMMENT ON TABLE refresh_tokens IS 'Stores refresh tokens for JWT token rotation. Supports revocation and expiration tracking.';
COMMENT ON COLUMN refresh_tokens.id IS 'Unique identifier for the refresh token record';
COMMENT ON COLUMN refresh_tokens.user_id IS 'Foreign key to users table';
COMMENT ON COLUMN refresh_tokens.token_hash IS 'Base64 encoded hash of the refresh token (first 64 chars)';
COMMENT ON COLUMN refresh_tokens.expires_at IS 'When the refresh token expires (typically 7 days)';
COMMENT ON COLUMN refresh_tokens.created_at IS 'When the refresh token was created';
COMMENT ON COLUMN refresh_tokens.revoked_at IS 'When the refresh token was revoked (NULL if still valid)';

-- Create cleanup function to remove expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_refresh_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM refresh_tokens
    WHERE expires_at < CURRENT_TIMESTAMP - INTERVAL '30 days'
    AND revoked_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_refresh_tokens IS 'Removes expired and revoked refresh tokens older than 30 days';

-- Grant permissions (adjust based on your user setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON refresh_tokens TO fleet_webapp;
-- GRANT USAGE, SELECT ON SEQUENCE refresh_tokens_id_seq TO fleet_webapp;

-- Example cleanup job (to be run periodically via cron or scheduler)
-- SELECT cleanup_expired_refresh_tokens();
