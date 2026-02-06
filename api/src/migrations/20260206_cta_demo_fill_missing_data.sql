-- ============================================================================
-- CTA Demo Fill Missing Data (Tallahassee, FL)
-- Ensures all drilldowns have DB-backed, realistic demo data (no mocks).
-- Idempotent: Inserts only when CTA tenant tables are empty.
-- ============================================================================

-- --------------------------------------------------------------------------
-- Recall actions: add operational fields used by the UI if missing
-- --------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'recall_actions'
      AND column_name = 'action_taken'
  ) THEN
    ALTER TABLE recall_actions ADD COLUMN action_taken TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'recall_actions'
      AND column_name = 'action_by'
  ) THEN
    ALTER TABLE recall_actions ADD COLUMN action_by VARCHAR(255);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'recall_actions'
      AND column_name = 'notes'
  ) THEN
    ALTER TABLE recall_actions ADD COLUMN notes TEXT;
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- Inventory audit trigger: tolerate tables without updated_by/created_by
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION audit_inventory_changes()
RETURNS TRIGGER AS $$
DECLARE
    changed_cols TEXT[];
    resolved_user_id UUID;
BEGIN
    IF TG_OP = 'UPDATE' THEN
        SELECT ARRAY_AGG(key)
        INTO changed_cols
        FROM jsonb_each(to_jsonb(NEW))
        WHERE to_jsonb(NEW)->key IS DISTINCT FROM to_jsonb(OLD)->key;
    END IF;

    resolved_user_id := COALESCE(
        NULLIF((to_jsonb(NEW)->>'updated_by'), '')::uuid,
        NULLIF((to_jsonb(NEW)->>'created_by'), '')::uuid,
        NULLIF((to_jsonb(NEW)->>'user_id'), '')::uuid,
        NULLIF((to_jsonb(OLD)->>'updated_by'), '')::uuid,
        NULLIF((to_jsonb(OLD)->>'created_by'), '')::uuid,
        NULLIF((to_jsonb(OLD)->>'user_id'), '')::uuid
    );

    INSERT INTO inventory_audit_log (
        tenant_id,
        table_name,
        record_id,
        operation,
        old_values,
        new_values,
        changed_fields,
        user_id,
        timestamp
    ) VALUES (
        COALESCE(NEW.tenant_id, OLD.tenant_id),
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
        changed_cols,
        resolved_user_id,
        NOW()
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --------------------------------------------------------------------------
-- Warranty statistics trigger: update warranty_records metadata safely
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_warranty_statistics()
RETURNS TRIGGER AS $$
DECLARE
    target_id UUID;
    filed_count INTEGER;
    approved_count INTEGER;
BEGIN
    target_id := COALESCE(NEW.warranty_id, OLD.warranty_id);
    IF target_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    filed_count := (SELECT COUNT(*) FROM warranty_claims WHERE warranty_id = target_id);
    approved_count := (
        SELECT COUNT(*)
        FROM warranty_claims
        WHERE warranty_id = target_id
          AND status IN ('APPROVED', 'RESOLVED')
    );

    UPDATE warranty_records
    SET
        metadata = jsonb_set(
            jsonb_set(COALESCE(metadata, '{}'::jsonb), '{claims_filed}', to_jsonb(filed_count), true),
            '{claims_approved}', to_jsonb(approved_count), true
        ),
        status = CASE WHEN filed_count > 0 AND status = 'ACTIVE' THEN 'CLAIMED' ELSE status END,
        updated_at = NOW()
    WHERE id = target_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- --------------------------------------------------------------------------
-- Service bays (per facility)
-- --------------------------------------------------------------------------
WITH cta AS (
  SELECT id AS tenant_id
  FROM tenants
  WHERE slug = 'cta-fleet'
  LIMIT 1
),
facilities AS (
  SELECT id, name
  FROM facilities
  WHERE tenant_id = (SELECT tenant_id FROM cta)
)
INSERT INTO service_bays (
  tenant_id,
  facility_id,
  bay_name,
  bay_number,
  bay_type,
  is_active,
  metadata
)
SELECT
  (SELECT tenant_id FROM cta),
  f.id,
  f.name || ' Bay ' || gs.i,
  gs.i,
  CASE
    WHEN gs.i = 1 THEN 'inspection'
    WHEN gs.i = 2 THEN 'maintenance'
    ELSE 'standard'
  END,
  true,
  jsonb_build_object(
    'capacity', CASE WHEN gs.i = 1 THEN 2 ELSE 1 END,
    'specialty', CASE WHEN gs.i = 1 THEN 'inspections' WHEN gs.i = 2 THEN 'preventive-maintenance' ELSE 'general' END
  )
FROM facilities f
CROSS JOIN generate_series(1, 3) AS gs(i)
WHERE NOT EXISTS (
  SELECT 1 FROM service_bays sb WHERE sb.tenant_id = (SELECT tenant_id FROM cta)
);

-- --------------------------------------------------------------------------
-- Appointment types
-- --------------------------------------------------------------------------
WITH cta AS (
  SELECT id AS tenant_id
  FROM tenants
  WHERE slug = 'cta-fleet'
  LIMIT 1
)
INSERT INTO appointment_types (
  tenant_id,
  name,
  description,
  duration_minutes,
  color
)
SELECT
  (SELECT tenant_id FROM cta),
  v.name,
  v.description,
  v.duration_minutes,
  v.color
FROM (
  VALUES
    ('PM Inspection', 'Preventive maintenance and safety inspection', 60, '#2563eb'),
    ('Diagnostics', 'Electronic diagnostics and troubleshooting', 90, '#7c3aed'),
    ('Repair - Mechanical', 'Mechanical repair and component replacement', 120, '#dc2626'),
    ('Repair - Electrical', 'Electrical system repair and calibration', 90, '#f59e0b'),
    ('Safety Equipment', 'Safety equipment install or replacement', 45, '#16a34a')
) AS v(name, description, duration_minutes, color)
WHERE NOT EXISTS (
  SELECT 1 FROM appointment_types at WHERE at.tenant_id = (SELECT tenant_id FROM cta)
);

-- --------------------------------------------------------------------------
-- Inventory items (100 smaller items for CTA)
-- --------------------------------------------------------------------------
WITH cta AS (
  SELECT id AS tenant_id
  FROM tenants
  WHERE slug = 'cta-fleet'
  LIMIT 1
),
admin_user AS (
  SELECT id, COALESCE(first_name, '') AS first_name, COALESCE(last_name, '') AS last_name
  FROM users
  WHERE tenant_id = (SELECT tenant_id FROM cta)
  ORDER BY (lower(email) = 'cta.admin@cta-fleet.local') DESC, created_at
  LIMIT 1
)
INSERT INTO inventory_items (
  tenant_id,
  sku,
  part_number,
  name,
  description,
  category,
  subcategory,
  manufacturer,
  manufacturer_part_number,
  quantity_on_hand,
  quantity_reserved,
  reorder_point,
  reorder_quantity,
  warehouse_location,
  bin_location,
  unit_cost,
  list_price,
  primary_supplier_name,
  created_by,
  updated_by,
  last_restocked
)
SELECT
  (SELECT tenant_id FROM cta),
  'CTA-INV-' || lpad(gs.i::text, 4, '0'),
  'CTA-PN-' || lpad(gs.i::text, 5, '0'),
  CASE
    WHEN gs.i <= 15 THEN 'Portable Welder ' || lpad(gs.i::text, 2, '0')
    WHEN gs.i <= 30 THEN 'Safety Harness ' || lpad(gs.i::text, 2, '0')
    WHEN gs.i <= 45 THEN 'Traffic Cone Kit ' || lpad(gs.i::text, 2, '0')
    WHEN gs.i <= 55 THEN 'Hydraulic Fluid Drum ' || lpad(gs.i::text, 2, '0')
    WHEN gs.i <= 65 THEN 'Fleet Tire ' || lpad(gs.i::text, 2, '0')
    WHEN gs.i <= 75 THEN 'Deep Cycle Battery ' || lpad(gs.i::text, 2, '0')
    WHEN gs.i <= 85 THEN 'Air Filter Set ' || lpad(gs.i::text, 2, '0')
    WHEN gs.i <= 95 THEN 'Power Cable Kit ' || lpad(gs.i::text, 2, '0')
    ELSE 'LED Work Light ' || lpad(gs.i::text, 2, '0')
  END,
  'CTA Operations inventory item for Tallahassee service fleet',
  CASE
    WHEN gs.i <= 15 THEN 'tools'
    WHEN gs.i <= 30 THEN 'safety-equipment'
    WHEN gs.i <= 45 THEN 'supplies'
    WHEN gs.i <= 55 THEN 'fluids'
    WHEN gs.i <= 65 THEN 'tires'
    WHEN gs.i <= 75 THEN 'batteries'
    WHEN gs.i <= 85 THEN 'filters'
    WHEN gs.i <= 95 THEN 'electrical'
    ELSE 'lighting'
  END,
  CASE
    WHEN gs.i <= 15 THEN 'fabrication'
    WHEN gs.i <= 30 THEN 'ppe'
    WHEN gs.i <= 45 THEN 'traffic-control'
    WHEN gs.i <= 55 THEN 'hydraulic'
    WHEN gs.i <= 65 THEN 'all-season'
    WHEN gs.i <= 75 THEN 'deep-cycle'
    WHEN gs.i <= 85 THEN 'air'
    WHEN gs.i <= 95 THEN 'cabling'
    ELSE 'work-lighting'
  END,
  CASE
    WHEN gs.i % 5 = 0 THEN 'Caterpillar'
    WHEN gs.i % 5 = 1 THEN 'DeWalt'
    WHEN gs.i % 5 = 2 THEN 'Generac'
    WHEN gs.i % 5 = 3 THEN 'Milwaukee'
    ELSE 'Honda'
  END,
  'MFG-' || lpad(gs.i::text, 6, '0'),
  0,
  0,
  8,
  20,
  'CTA Central Yard',
  'A-' || lpad(((gs.i - 1) % 25 + 1)::text, 2, '0'),
  (18 + (gs.i % 12))::numeric(10,2),
  (18 + (gs.i % 12))::numeric(10,2) * 1.35,
  CASE
    WHEN gs.i % 3 = 0 THEN 'Capital Equipment Supply'
    WHEN gs.i % 3 = 1 THEN 'Panhandle Industrial'
    ELSE 'Gulf Coast Fleet Parts'
  END,
  (SELECT id FROM admin_user),
  (SELECT id FROM admin_user),
  NOW() - ((gs.i % 15) || ' days')::interval
FROM generate_series(1, 100) AS gs(i)
WHERE NOT EXISTS (
  SELECT 1 FROM inventory_items ii WHERE ii.tenant_id = (SELECT tenant_id FROM cta)
);

-- --------------------------------------------------------------------------
-- Inventory transactions (purchases)
-- --------------------------------------------------------------------------
WITH cta AS (
  SELECT id AS tenant_id
  FROM tenants
  WHERE slug = 'cta-fleet'
  LIMIT 1
),
admin_user AS (
  SELECT id,
         trim(concat_ws(' ', first_name, last_name)) AS full_name
  FROM users
  WHERE tenant_id = (SELECT tenant_id FROM cta)
  ORDER BY (lower(email) = 'cta.admin@cta-fleet.local') DESC, created_at
  LIMIT 1
),
items AS (
  SELECT id, unit_cost, warehouse_location, bin_location, sku
  FROM inventory_items
  WHERE tenant_id = (SELECT tenant_id FROM cta)
)
INSERT INTO inventory_transactions (
  tenant_id,
  item_id,
  transaction_type,
  quantity,
  unit_cost,
  vehicle_id,
  work_order_id,
  user_id,
  user_name,
  reason,
  reference_number,
  notes,
  warehouse_location,
  bin_location
)
SELECT
  (SELECT tenant_id FROM cta),
  i.id,
  'purchase',
  15 + (row_number() OVER (ORDER BY i.sku) % 35),
  i.unit_cost,
  NULL,
  NULL,
  (SELECT id FROM admin_user),
  (SELECT full_name FROM admin_user),
  'Initial CTA stock load',
  'PO-CTA-2026-' || lpad((row_number() OVER (ORDER BY i.sku))::text, 4, '0'),
  'Initial inventory purchase for CTA Tallahassee operations',
  i.warehouse_location,
  i.bin_location
FROM items i
WHERE NOT EXISTS (
  SELECT 1
  FROM inventory_transactions t
  WHERE t.tenant_id = (SELECT tenant_id FROM cta)
    AND t.transaction_type = 'purchase'
);

-- --------------------------------------------------------------------------
-- Inventory transactions (usage tied to work orders)
-- --------------------------------------------------------------------------
WITH cta AS (
  SELECT id AS tenant_id
  FROM tenants
  WHERE slug = 'cta-fleet'
  LIMIT 1
),
admin_user AS (
  SELECT id,
         trim(concat_ws(' ', first_name, last_name)) AS full_name
  FROM users
  WHERE tenant_id = (SELECT tenant_id FROM cta)
  ORDER BY (lower(email) = 'cta.admin@cta-fleet.local') DESC, created_at
  LIMIT 1
),
items AS (
  SELECT id, unit_cost, warehouse_location, bin_location, sku,
         row_number() OVER (ORDER BY sku) AS rn
  FROM inventory_items
  WHERE tenant_id = (SELECT tenant_id FROM cta)
),
vehicles AS (
  SELECT id
  FROM vehicles
  WHERE tenant_id = (SELECT tenant_id FROM cta)
  ORDER BY number
),
work_orders AS (
  SELECT id
  FROM work_orders
  WHERE tenant_id = (SELECT tenant_id FROM cta)
  ORDER BY created_at
)
INSERT INTO inventory_transactions (
  tenant_id,
  item_id,
  transaction_type,
  quantity,
  unit_cost,
  vehicle_id,
  work_order_id,
  user_id,
  user_name,
  reason,
  reference_number,
  notes,
  warehouse_location,
  bin_location
)
SELECT
  (SELECT tenant_id FROM cta),
  i.id,
  'usage',
  -1 * (1 + (i.rn % 3)),
  i.unit_cost,
  (SELECT id FROM vehicles OFFSET ((i.rn - 1) % GREATEST((SELECT COUNT(*) FROM vehicles), 1)) LIMIT 1),
  (SELECT id FROM work_orders OFFSET ((i.rn - 1) % GREATEST((SELECT COUNT(*) FROM work_orders), 1)) LIMIT 1),
  (SELECT id FROM admin_user),
  (SELECT full_name FROM admin_user),
  'Work order consumption',
  'WO-USE-' || lpad(i.rn::text, 4, '0'),
  'Parts issued to CTA maintenance work order',
  i.warehouse_location,
  i.bin_location
FROM items i
WHERE i.rn <= 40
  AND NOT EXISTS (
    SELECT 1
    FROM inventory_transactions t
    WHERE t.tenant_id = (SELECT tenant_id FROM cta)
      AND t.transaction_type = 'usage'
  );

-- --------------------------------------------------------------------------
-- Certifications for CTA drivers
-- --------------------------------------------------------------------------
WITH cta AS (
  SELECT id AS tenant_id
  FROM tenants
  WHERE slug = 'cta-fleet'
  LIMIT 1
),
cta_drivers AS (
  SELECT id, row_number() OVER (ORDER BY created_at) AS rn
  FROM drivers
  WHERE tenant_id = (SELECT tenant_id FROM cta)
)
INSERT INTO certifications (
  tenant_id,
  driver_id,
  type,
  number,
  issuing_authority,
  issued_date,
  expiry_date,
  status,
  notes,
  metadata
)
SELECT
  (SELECT tenant_id FROM cta),
  d.id,
  CASE
    WHEN d.rn % 4 = 0 THEN 'CDL-A'
    WHEN d.rn % 4 = 1 THEN 'OSHA-10'
    WHEN d.rn % 4 = 2 THEN 'Defensive Driving'
    ELSE 'DOT Medical'
  END,
  'CTA-CERT-' || lpad(d.rn::text, 4, '0'),
  'Florida DOT',
  (CURRENT_DATE - ((d.rn % 18) * 30) * INTERVAL '1 day')::timestamp,
  (CURRENT_DATE + ((12 + (d.rn % 12)) * 30) * INTERVAL '1 day')::timestamp,
  'active',
  'CTA operations certification',
  jsonb_build_object('region', 'Tallahassee', 'fleet', 'CTA')
FROM cta_drivers d
WHERE NOT EXISTS (
  SELECT 1 FROM certifications c WHERE c.tenant_id = (SELECT tenant_id FROM cta)
);

-- --------------------------------------------------------------------------
-- Training courses
-- --------------------------------------------------------------------------
WITH cta AS (
  SELECT id AS tenant_id
  FROM tenants
  WHERE slug = 'cta-fleet'
  LIMIT 1
)
INSERT INTO training_courses (
  tenant_id,
  title,
  description,
  category,
  level,
  duration_minutes,
  modules,
  prerequisites,
  certification,
  instructor,
  tags,
  rating
)
SELECT
  (SELECT tenant_id FROM cta),
  v.title,
  v.description,
  v.category,
  v.level,
  v.duration_minutes,
  v.modules,
  v.prerequisites,
  v.certification,
  v.instructor,
  v.tags,
  v.rating
FROM (
  VALUES
    (
      'CTA Safety Fundamentals',
      'Core safety practices for CTA field operations',
      'safety',
      'foundation',
      90,
      '["PPE", "Work zones", "Incident reporting"]'::jsonb,
      '[]'::jsonb,
      '{"certificate":"CTA Safety"}'::jsonb,
      '{"name":"M. Rivers"}'::jsonb,
      ARRAY['safety','field','cta'],
      4.6
    ),
    (
      'Fleet Maintenance Essentials',
      'Preventive maintenance and inspection workflows',
      'maintenance',
      'intermediate',
      120,
      '["PM checklist", "Service bays", "Work orders"]'::jsonb,
      '[]'::jsonb,
      '{"certificate":"Maintenance Basics"}'::jsonb,
      '{"name":"D. Alvarez"}'::jsonb,
      ARRAY['maintenance','fleet'],
      4.4
    ),
    (
      'Heavy Equipment Operations',
      'Safe operation for CTA heavy equipment',
      'operations',
      'advanced',
      150,
      '["Load safety", "Spotting", "Daily checks"]'::jsonb,
      '[]'::jsonb,
      '{"certificate":"Equipment Operator"}'::jsonb,
      '{"name":"K. Shaw"}'::jsonb,
      ARRAY['equipment','safety'],
      4.7
    ),
    (
      'Defensive Driving - City',
      'Urban driving best practices for Tallahassee routes',
      'driver',
      'foundation',
      60,
      '["Urban hazards", "Intersections", "Weather"]'::jsonb,
      '[]'::jsonb,
      '{"certificate":"Defensive Driving"}'::jsonb,
      '{"name":"S. Patel"}'::jsonb,
      ARRAY['driver','safety'],
      4.5
    )
) AS v(
  title,
  description,
  category,
  level,
  duration_minutes,
  modules,
  prerequisites,
  certification,
  instructor,
  tags,
  rating
)
WHERE NOT EXISTS (
  SELECT 1 FROM training_courses tc WHERE tc.tenant_id = (SELECT tenant_id FROM cta)
);

-- --------------------------------------------------------------------------
-- Training progress (assign courses to CTA drivers)
-- --------------------------------------------------------------------------
WITH cta AS (
  SELECT id AS tenant_id
  FROM tenants
  WHERE slug = 'cta-fleet'
  LIMIT 1
),
cta_drivers AS (
  SELECT id, row_number() OVER (ORDER BY created_at) AS rn
  FROM drivers
  WHERE tenant_id = (SELECT tenant_id FROM cta)
),
cta_courses AS (
  SELECT id, row_number() OVER (ORDER BY created_at) AS rn
  FROM training_courses
  WHERE tenant_id = (SELECT tenant_id FROM cta)
)
INSERT INTO training_progress (
  tenant_id,
  course_id,
  driver_id,
  progress,
  completed_modules,
  last_accessed,
  time_spent_minutes,
  score
)
SELECT
  (SELECT tenant_id FROM cta),
  c.id,
  d.id,
  CASE WHEN (d.rn + c.rn) % 3 = 0 THEN 100 ELSE 60 END,
  CASE WHEN (d.rn + c.rn) % 3 = 0 THEN '["module1","module2","module3"]'::jsonb ELSE '["module1"]'::jsonb END,
  NOW() - ((d.rn + c.rn) % 14) * INTERVAL '1 day',
  45 + ((d.rn + c.rn) % 60),
  CASE WHEN (d.rn + c.rn) % 3 = 0 THEN 92.5 ELSE 78.0 END
FROM cta_drivers d
JOIN cta_courses c ON c.rn <= 3
WHERE NOT EXISTS (
  SELECT 1 FROM training_progress tp WHERE tp.tenant_id = (SELECT tenant_id FROM cta)
);

-- --------------------------------------------------------------------------
-- Fuel transactions (2 per vehicle)
-- --------------------------------------------------------------------------
WITH cta AS (
  SELECT id AS tenant_id
  FROM tenants
  WHERE slug = 'cta-fleet'
  LIMIT 1
),
cta_vehicles AS (
  SELECT id, assigned_driver_id, odometer, latitude::float8 AS lat, longitude::float8 AS lng,
         row_number() OVER (ORDER BY number) AS rn
  FROM vehicles
  WHERE tenant_id = (SELECT tenant_id FROM cta)
),
series AS (
  SELECT v.*, gs.i AS seq
  FROM cta_vehicles v
  CROSS JOIN generate_series(1, 2) AS gs(i)
)
INSERT INTO fuel_transactions (
  tenant_id,
  vehicle_id,
  driver_id,
  transaction_date,
  fuel_type,
  gallons,
  cost_per_gallon,
  total_cost,
  odometer,
  location,
  latitude,
  longitude,
  vendor_name,
  receipt_number,
  payment_method,
  card_last4,
  notes
)
SELECT
  (SELECT tenant_id FROM cta),
  s.id,
  s.assigned_driver_id,
  NOW() - ((s.rn + s.seq) % 45) * INTERVAL '1 day',
  'gasoline',
  (10 + ((s.rn + s.seq) % 12))::numeric(10,3),
  (3.15 + (((s.rn + s.seq) % 8) * 0.07))::numeric(8,3),
  ROUND((10 + ((s.rn + s.seq) % 12)) * (3.15 + (((s.rn + s.seq) % 8) * 0.07)), 2),
  COALESCE(s.odometer, 20000) + (s.seq * 120),
  'CTA Fuel Depot - Tallahassee, FL',
  s.lat,
  s.lng,
  CASE WHEN (s.rn + s.seq) % 2 = 0 THEN 'Capital Fuel Services' ELSE 'Sunshine Fuel Co.' END,
  'CTA-RCPT-' || lpad((s.rn * 10 + s.seq)::text, 5, '0'),
  'fleet-card',
  '1024',
  'Routine fueling'
FROM series s
WHERE NOT EXISTS (
  SELECT 1 FROM fuel_transactions ft WHERE ft.tenant_id = (SELECT tenant_id FROM cta)
);

-- --------------------------------------------------------------------------
-- Insurance policies and assignments
-- --------------------------------------------------------------------------
WITH cta AS (
  SELECT id AS tenant_id
  FROM tenants
  WHERE slug = 'cta-fleet'
  LIMIT 1
)
INSERT INTO insurance_policies (
  tenant_id,
  policy_number,
  policy_type,
  insurance_carrier,
  carrier_contact_name,
  carrier_contact_phone,
  carrier_contact_email,
  policy_start_date,
  policy_end_date,
  premium_amount,
  premium_frequency,
  deductible_amount,
  coverage_limits,
  status,
  auto_renew,
  notes
)
SELECT
  (SELECT tenant_id FROM cta),
  v.policy_number,
  v.policy_type,
  v.carrier,
  v.contact_name,
  v.contact_phone,
  v.contact_email,
  CURRENT_DATE - INTERVAL '120 days',
  CURRENT_DATE + INTERVAL '240 days',
  v.premium,
  v.frequency,
  v.deductible,
  v.coverage,
  'active',
  true,
  'CTA insurance coverage for Tallahassee operations'
FROM (
  VALUES
    ('CTA-LIAB-2026', 'liability', 'Florida Fleet Insurance', 'Alex Rivera', '850-555-1212', 'alex.rivera@ffi.example', 12000.00, 'annual', 1000.00, '{"bodily_injury":"$1,000,000","property_damage":"$500,000"}'::jsonb),
    ('CTA-COMP-2026', 'comprehensive', 'Gulf Coast Risk', 'Dana Ortiz', '850-555-3434', 'dana.ortiz@gcr.example', 8500.00, 'annual', 1500.00, '{"comprehensive":"$750,000"}'::jsonb),
    ('CTA-WC-2026', 'workers-comp', 'Capital Mutual', 'Jamie Holt', '850-555-5656', 'jamie.holt@cm.example', 6400.00, 'annual', 500.00, '{"workers_comp":"$500,000"}'::jsonb)
) AS v(policy_number, policy_type, carrier, contact_name, contact_phone, contact_email, premium, frequency, deductible, coverage)
WHERE NOT EXISTS (
  SELECT 1 FROM insurance_policies ip WHERE ip.tenant_id = (SELECT tenant_id FROM cta)
);

WITH cta AS (
  SELECT id AS tenant_id
  FROM tenants
  WHERE slug = 'cta-fleet'
  LIMIT 1
),
liability_policy AS (
  SELECT id
  FROM insurance_policies
  WHERE tenant_id = (SELECT tenant_id FROM cta)
    AND policy_type = 'liability'
  ORDER BY created_at
  LIMIT 1
),
vehicles AS (
  SELECT id
  FROM vehicles
  WHERE tenant_id = (SELECT tenant_id FROM cta)
)
INSERT INTO vehicle_insurance_assignments (
  tenant_id,
  vehicle_id,
  policy_id,
  start_date,
  end_date,
  is_active
)
SELECT
  (SELECT tenant_id FROM cta),
  v.id,
  (SELECT id FROM liability_policy),
  CURRENT_DATE - INTERVAL '120 days',
  NULL,
  true
FROM vehicles v
WHERE (SELECT id FROM liability_policy) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM vehicle_insurance_assignments via WHERE via.tenant_id = (SELECT tenant_id FROM cta)
  );

WITH cta AS (
  SELECT id AS tenant_id
  FROM tenants
  WHERE slug = 'cta-fleet'
  LIMIT 1
),
wc_policy AS (
  SELECT id
  FROM insurance_policies
  WHERE tenant_id = (SELECT tenant_id FROM cta)
    AND policy_type = 'workers-comp'
  ORDER BY created_at
  LIMIT 1
),
cta_drivers AS (
  SELECT id
  FROM drivers
  WHERE tenant_id = (SELECT tenant_id FROM cta)
)
INSERT INTO driver_insurance_assignments (
  tenant_id,
  driver_id,
  policy_id,
  start_date,
  end_date,
  is_active
)
SELECT
  (SELECT tenant_id FROM cta),
  d.id,
  (SELECT id FROM wc_policy),
  CURRENT_DATE - INTERVAL '120 days',
  NULL,
  true
FROM cta_drivers d
WHERE (SELECT id FROM wc_policy) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM driver_insurance_assignments dia WHERE dia.tenant_id = (SELECT tenant_id FROM cta)
  );

-- --------------------------------------------------------------------------
-- Warranty records and claims
-- --------------------------------------------------------------------------
WITH cta AS (
  SELECT id AS tenant_id
  FROM tenants
  WHERE slug = 'cta-fleet'
  LIMIT 1
),
items AS (
  SELECT id, part_number, name, row_number() OVER (ORDER BY name) AS rn
  FROM inventory_items
  WHERE tenant_id = (SELECT tenant_id FROM cta)
),
vendors AS (
  SELECT id, name, row_number() OVER (ORDER BY name) AS rn
  FROM vendors
  WHERE tenant_id = (SELECT tenant_id FROM cta)
)
INSERT INTO warranty_records (
  tenant_id,
  inventory_item_id,
  part_number,
  part_name,
  vendor_id,
  vendor_name,
  warranty_type,
  warranty_start_date,
  warranty_end_date,
  coverage_details,
  terms,
  status,
  metadata
)
SELECT
  (SELECT tenant_id FROM cta),
  i.id,
  i.part_number,
  i.name,
  v.id,
  v.name,
  'MANUFACTURER',
  CURRENT_DATE - INTERVAL '90 days',
  CURRENT_DATE + INTERVAL '540 days',
  'Parts and labor coverage',
  'Standard CTA vendor warranty terms',
  'ACTIVE',
  jsonb_build_object('region', 'Tallahassee')
FROM items i
LEFT JOIN vendors v
  ON v.rn = ((i.rn - 1) % GREATEST((SELECT COUNT(*) FROM vendors), 1)) + 1
WHERE i.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM warranty_records wr WHERE wr.tenant_id = (SELECT tenant_id FROM cta)
  )
LIMIT 25;

WITH cta AS (
  SELECT id AS tenant_id
  FROM tenants
  WHERE slug = 'cta-fleet'
  LIMIT 1
),
warranties AS (
  SELECT id, row_number() OVER (ORDER BY created_at) AS rn
  FROM warranty_records
  WHERE tenant_id = (SELECT tenant_id FROM cta)
  ORDER BY created_at
  LIMIT 5
)
INSERT INTO warranty_claims (
  tenant_id,
  warranty_id,
  claim_number,
  date_submitted,
  issue_description,
  claim_type,
  status,
  resolution,
  attachments
)
SELECT
  (SELECT tenant_id FROM cta),
  w.id,
  'CTA-WCLM-' || lpad(w.rn::text, 3, '0'),
  CURRENT_DATE - (w.rn * 7) * INTERVAL '1 day',
  'Component failure observed during routine inspection',
  CASE WHEN w.rn % 2 = 0 THEN 'DEFECT' ELSE 'FAILURE' END,
  CASE WHEN w.rn % 2 = 0 THEN 'IN_REVIEW' ELSE 'PENDING' END,
  NULL,
  '[]'::jsonb
FROM warranties w
WHERE NOT EXISTS (
  SELECT 1 FROM warranty_claims wc WHERE wc.tenant_id = (SELECT tenant_id FROM cta)
);

-- --------------------------------------------------------------------------
-- Recall notices and actions
-- --------------------------------------------------------------------------
WITH cta AS (
  SELECT id AS tenant_id
  FROM tenants
  WHERE slug = 'cta-fleet'
  LIMIT 1
)
INSERT INTO recall_notices (
  tenant_id,
  recall_number,
  title,
  description,
  severity,
  urgency,
  issued_by,
  date_issued,
  effective_date,
  compliance_deadline,
  affected_parts,
  remedy_description,
  status
)
SELECT
  (SELECT tenant_id FROM cta),
  v.recall_number,
  v.title,
  v.description,
  v.severity,
  v.urgency,
  v.issued_by,
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE - INTERVAL '15 days',
  CURRENT_DATE + INTERVAL '60 days',
  v.affected_parts,
  v.remedy_description,
  'ACTIVE'
FROM (
  VALUES
    (
      'CTA-REC-1024',
      'Hydraulic Hose Inspection',
      'Potential wear identified on select hydraulic hose batches used in CTA equipment.',
      'SAFETY',
      'URGENT',
      'CTA Fleet Safety Office',
      '["Hydraulic Hose Kit", "Hydraulic Fluid Drum"]'::jsonb,
      'Inspect hoses and replace if wear exceeds threshold.'
    ),
    (
      'CTA-REC-2048',
      'Battery Terminal Check',
      'Battery terminal corrosion reported in humid conditions.',
      'PERFORMANCE',
      'MODERATE',
      'CTA Maintenance',
      '["Deep Cycle Battery"]'::jsonb,
      'Clean terminals and apply corrosion inhibitor.'
    )
) AS v(recall_number, title, description, severity, urgency, issued_by, affected_parts, remedy_description)
WHERE NOT EXISTS (
  SELECT 1 FROM recall_notices rn WHERE rn.tenant_id = (SELECT tenant_id FROM cta)
);

WITH cta AS (
  SELECT id AS tenant_id
  FROM tenants
  WHERE slug = 'cta-fleet'
  LIMIT 1
),
recalls AS (
  SELECT id, row_number() OVER (ORDER BY created_at) AS rn
  FROM recall_notices
  WHERE tenant_id = (SELECT tenant_id FROM cta)
),
items AS (
  SELECT id, name, row_number() OVER (ORDER BY name) AS rn
  FROM inventory_items
  WHERE tenant_id = (SELECT tenant_id FROM cta)
)
INSERT INTO recall_actions (
  tenant_id,
  recall_id,
  inventory_item_id,
  location,
  action_required,
  compliance_status,
  completed_at,
  action_taken,
  action_by,
  notes
)
SELECT
  (SELECT tenant_id FROM cta),
  r.id,
  i.id,
  'CTA Central Yard',
  'Inspect and remediate per CTA recall guidance',
  CASE WHEN (r.rn + i.rn) % 3 = 0 THEN 'COMPLETED' WHEN (r.rn + i.rn) % 3 = 1 THEN 'IN_PROGRESS' ELSE 'PENDING' END,
  CASE WHEN (r.rn + i.rn) % 3 = 0 THEN NOW() - INTERVAL '3 days' ELSE NULL END,
  CASE WHEN (r.rn + i.rn) % 3 = 0 THEN 'Replaced component' ELSE 'Inspection scheduled' END,
  'CTA Maintenance Team',
  'CTA recall action tracking'
FROM recalls r
JOIN items i ON i.rn <= 4
WHERE NOT EXISTS (
  SELECT 1 FROM recall_actions ra WHERE ra.tenant_id = (SELECT tenant_id FROM cta)
);
