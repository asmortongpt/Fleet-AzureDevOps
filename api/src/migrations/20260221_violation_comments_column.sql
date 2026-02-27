-- Add comments JSONB column to policy_violations for inline comment storage
ALTER TABLE policy_violations ADD COLUMN IF NOT EXISTS comments JSONB DEFAULT '[]';
