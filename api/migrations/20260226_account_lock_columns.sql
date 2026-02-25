-- Add account lock tracking columns to users for auth middleware/tests
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_users_account_lock ON users (account_locked_until);
