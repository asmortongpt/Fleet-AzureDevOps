-- Focus local/demo dataset on the Tallahassee CTA tenant.
-- Marks non-CTA tenants inactive to avoid confusing cross-tenant demo artifacts.
-- This is intentionally non-destructive (no deletes).

UPDATE tenants
SET is_active = CASE WHEN slug = 'cta-fleet' THEN true ELSE false END,
    updated_at = NOW()
WHERE slug <> 'cta-fleet' OR is_active IS DISTINCT FROM (slug = 'cta-fleet');

