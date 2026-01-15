-- Adds world-space damage annotations and UV polygon overlay support
ALTER TABLE IF EXISTS damage_reports
  ADD COLUMN IF NOT EXISTS damage_annotations JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE IF EXISTS damage_reports
  ADD COLUMN IF NOT EXISTS damage_overlay JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_damage_reports_annotations_gin
  ON damage_reports USING GIN (damage_annotations);
