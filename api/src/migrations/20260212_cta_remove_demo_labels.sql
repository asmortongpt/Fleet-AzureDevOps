-- Remove demo/mock labels from CTA operational data for production-ready demos

DO $$
DECLARE
  tenant_uuid uuid := '8e33a492-9b42-4e7a-8654-0572c9773b71';
BEGIN
  -- Work orders: remove demo language + demo metadata flags
  UPDATE work_orders
  SET description = regexp_replace(description, '(?i)\\bdemo\\b\\s*', '', 'g'),
      notes = regexp_replace(notes, '(?i)\\bdemo\\b\\s*', '', 'g'),
      metadata = (metadata - 'demo' - 'seed')
  WHERE tenant_id = tenant_uuid
    AND (description ILIKE '%demo%' OR notes ILIKE '%demo%' OR metadata ? 'demo' OR metadata ? 'seed');

  -- Incidents: remove demo language + demo metadata flags
  UPDATE incidents
  SET description = regexp_replace(description, '(?i)\\bdemo\\b\\s*', '', 'g'),
      metadata = (metadata - 'demo' - 'seed')
  WHERE tenant_id = tenant_uuid
    AND (description ILIKE '%demo%' OR metadata ? 'demo' OR metadata ? 'seed');

  -- Inspections: remove demo language (metadata may not exist in all schemas)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inspections' AND column_name = 'metadata'
  ) THEN
    UPDATE inspections
    SET notes = regexp_replace(notes, '(?i)\\bdemo\\b\\s*', '', 'g'),
        metadata = (metadata - 'demo' - 'seed')
    WHERE tenant_id = tenant_uuid
      AND (notes ILIKE '%demo%' OR metadata ? 'demo' OR metadata ? 'seed');
  ELSE
    UPDATE inspections
    SET notes = regexp_replace(notes, '(?i)\\bdemo\\b\\s*', '', 'g')
    WHERE tenant_id = tenant_uuid
      AND notes ILIKE '%demo%';
  END IF;

  -- Assets: remove demo language + demo metadata flags
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assets' AND column_name = 'metadata'
  ) THEN
    UPDATE assets
    SET notes = regexp_replace(notes, '(?i)\\bdemo\\b\\s*', '', 'g'),
        metadata = (metadata - 'demo' - 'seed')
    WHERE tenant_id = tenant_uuid
      AND (notes ILIKE '%demo%' OR metadata ? 'demo' OR metadata ? 'seed');
  ELSE
    UPDATE assets
    SET notes = regexp_replace(notes, '(?i)\\bdemo\\b\\s*', '', 'g')
    WHERE tenant_id = tenant_uuid
      AND notes ILIKE '%demo%';
  END IF;

  -- Heavy equipment: remove demo metadata flags (table does not include notes/description)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'heavy_equipment' AND column_name = 'metadata'
  ) THEN
    UPDATE heavy_equipment
    SET metadata = (metadata - 'demo' - 'seed')
    WHERE tenant_id = tenant_uuid
      AND (metadata ? 'demo' OR metadata ? 'seed');
  END IF;

  -- Inventory items: remove demo language (no notes/metadata in schema)
  UPDATE inventory_items
  SET description = regexp_replace(description, '(?i)\\bdemo\\b\\s*', '', 'g')
  WHERE tenant_id = tenant_uuid
    AND description ILIKE '%demo%';
END $$;
