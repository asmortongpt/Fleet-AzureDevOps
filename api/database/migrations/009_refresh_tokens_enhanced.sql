-- Migration: Enhanced Refresh Token Storage with Multi-Tenancy
-- Description: Updates refresh_tokens table to include tenant_id for multi-tenancy support
-- Security: OWASP ASVS 3.0 compliant token rotation pattern
-- Created: 2025-11-20

-- Add tenant_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'refresh_tokens'
        AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE refresh_tokens
        ADD COLUMN tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE;

        -- Create index for tenant-based queries
        CREATE INDEX idx_refresh_tokens_tenant_id ON refresh_tokens(tenant_id);

        -- Add comment
        COMMENT ON COLUMN refresh_tokens.tenant_id IS 'Foreign key to tenants table for multi-tenancy isolation';
    END IF;
END $$;

-- Add used_at column for tracking token usage (detection of replay attacks)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'refresh_tokens'
        AND column_name = 'used_at'
    ) THEN
        ALTER TABLE refresh_tokens
        ADD COLUMN used_at TIMESTAMP WITH TIME ZONE;

        -- Create index for detecting reuse
        CREATE INDEX idx_refresh_tokens_used_at ON refresh_tokens(used_at);

        -- Add comment
        COMMENT ON COLUMN refresh_tokens.used_at IS 'Timestamp when token was used (for detecting replay attacks)';
    END IF;
END $$;

-- Add IP address tracking for security auditing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'refresh_tokens'
        AND column_name = 'ip_address'
    ) THEN
        ALTER TABLE refresh_tokens
        ADD COLUMN ip_address VARCHAR(45);

        -- Add comment
        COMMENT ON COLUMN refresh_tokens.ip_address IS 'IP address where token was created (IPv4 or IPv6)';
    END IF;
END $$;

-- Add user agent for security auditing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'refresh_tokens'
        AND column_name = 'user_agent'
    ) THEN
        ALTER TABLE refresh_tokens
        ADD COLUMN user_agent TEXT;

        -- Add comment
        COMMENT ON COLUMN refresh_tokens.user_agent IS 'User agent string for device identification';
    END IF;
END $$;

-- Create function to detect and prevent token reuse (OWASP recommendation)
CREATE OR REPLACE FUNCTION check_refresh_token_reuse()
RETURNS TRIGGER AS $$
BEGIN
    -- If token was already used, this is a replay attack attempt
    IF OLD.used_at IS NOT NULL THEN
        -- Revoke ALL tokens for this user as a security measure
        UPDATE refresh_tokens
        SET revoked_at = CURRENT_TIMESTAMP
        WHERE user_id = OLD.user_id
        AND revoked_at IS NULL;

        -- Log security event
        INSERT INTO audit_logs (
            tenant_id, user_id, action, table_name,
            details, ip_address, status
        ) VALUES (
            OLD.tenant_id, OLD.user_id, 'TOKEN_REUSE_DETECTED', 'refresh_tokens',
            jsonb_build_object(
                'token_id', OLD.id,
                'original_use', OLD.used_at,
                'reuse_attempt', CURRENT_TIMESTAMP
            ),
            NULL, 'security_violation'
        );

        RAISE EXCEPTION 'Token reuse detected - all tokens revoked for security';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for token reuse detection
DROP TRIGGER IF EXISTS trigger_check_refresh_token_reuse ON refresh_tokens;
CREATE TRIGGER trigger_check_refresh_token_reuse
    BEFORE UPDATE OF used_at ON refresh_tokens
    FOR EACH ROW
    EXECUTE FUNCTION check_refresh_token_reuse();

COMMENT ON FUNCTION check_refresh_token_reuse IS 'Detects refresh token reuse attacks and revokes all user tokens';

-- Enhanced cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_refresh_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Remove expired and revoked tokens older than 30 days
    WITH deleted AS (
        DELETE FROM refresh_tokens
        WHERE (
            (expires_at < CURRENT_TIMESTAMP - INTERVAL '30 days' AND revoked_at IS NOT NULL)
            OR (expires_at < CURRENT_TIMESTAMP - INTERVAL '90 days')
        )
        RETURNING *
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_refresh_tokens IS 'Removes expired refresh tokens and returns count of deleted records';

-- Create function to revoke all tokens for a user (for forced logout)
CREATE OR REPLACE FUNCTION revoke_all_user_tokens(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    revoked_count INTEGER;
BEGIN
    WITH updated AS (
        UPDATE refresh_tokens
        SET revoked_at = CURRENT_TIMESTAMP
        WHERE user_id = p_user_id
        AND revoked_at IS NULL
        RETURNING *
    )
    SELECT COUNT(*) INTO revoked_count FROM updated;

    RETURN revoked_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION revoke_all_user_tokens IS 'Revokes all active refresh tokens for a user (forced logout from all devices)';

-- Create view for active tokens (for monitoring)
CREATE OR REPLACE VIEW active_refresh_tokens AS
SELECT
    rt.id,
    rt.user_id,
    rt.tenant_id,
    u.email,
    u.role,
    rt.created_at,
    rt.expires_at,
    rt.ip_address,
    rt.user_agent,
    EXTRACT(EPOCH FROM (rt.expires_at - CURRENT_TIMESTAMP)) / 3600 AS hours_until_expiry
FROM refresh_tokens rt
JOIN users u ON rt.user_id = u.id
WHERE rt.revoked_at IS NULL
AND rt.expires_at > CURRENT_TIMESTAMP
ORDER BY rt.created_at DESC;

COMMENT ON VIEW active_refresh_tokens IS 'View of currently active (non-revoked, non-expired) refresh tokens';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_tenant ON refresh_tokens(user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_revoked ON refresh_tokens(expires_at, revoked_at);

-- Update table comment
COMMENT ON TABLE refresh_tokens IS 'OWASP ASVS 3.0 compliant refresh token storage with rotation, revocation, and replay attack detection';
