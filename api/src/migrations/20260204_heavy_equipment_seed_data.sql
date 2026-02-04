-- Migration: Seed Heavy Equipment Demo Data (DB-backed)
-- Created: 2026-02-04
-- Purpose: Ensure the Heavy Equipment UI has real, deterministic records backed by Postgres tables.
-- Note: This is safe/idempotent; it only inserts when matching records don't already exist.

DO $$
DECLARE
  t RECORD;
  f RECORD;
  a_id UUID;
  he_id UUID;
  d RECORD;
  equip RECORD;
BEGIN
  FOR t IN SELECT id, slug FROM tenants LOOP
    SELECT id, latitude, longitude INTO f
    FROM facilities
    WHERE tenant_id = t.id
    ORDER BY created_at ASC
    LIMIT 1;

    -- If a tenant has no facilities, skip seeding heavy equipment for it.
    IF f.id IS NULL THEN
      CONTINUE;
    END IF;

    FOR equip IN
      SELECT * FROM (
        VALUES
          ('excavator',       'Excavator',       2022, 1185.5, 'diesel', 45000, 0.0015, -0.0012, 'available',  false, 'North Yard'),
          ('backhoe',         'Backhoe Loader',  2021, 1640.2, 'diesel', 32000, -0.0010, 0.0011,  'in_use',     false, 'Downtown Site'),
          ('bulldozer',       'Bulldozer',       2020, 2105.9, 'diesel', 60000, 0.0020, 0.0007,   'maintenance', false, 'Central Shop'),
          ('telehandler',     'Telehandler',     2023,  540.3, 'diesel', 15000, -0.0018, -0.0009, 'available',  true,  'Airport Expansion'),
          ('mobile-crane',    'Mobile Crane',    2019, 2890.0, 'diesel', 80000, 0.0005, 0.0022,   'in_use',     false, 'Bridge Repair')
      ) AS v(equipment_type, asset_name, model_year, engine_hours, engine_type, weight_capacity_lbs, lat_off, lng_off, availability_status, is_rental, job_site)
    LOOP
      -- Create or reuse a backing asset record
      INSERT INTO assets (
        tenant_id,
        asset_number,
        name,
        description,
        type,
        category,
        manufacturer,
        model,
        serial_number,
        purchase_date,
        purchase_price,
        current_value,
        status,
        assigned_facility_id,
        condition,
        notes,
        metadata
      )
      VALUES (
        t.id,
        'HEQ-' || UPPER(SUBSTRING(t.slug FROM 1 FOR 6)) || '-' || UPPER(SUBSTRING(equip.equipment_type FROM 1 FOR 3)),
        equip.asset_name,
        'Seeded heavy equipment asset for demo and integration testing',
        'equipment',
        'construction',
        'Caterpillar',
        equip.asset_name,
        'HE-' || UPPER(SUBSTRING(t.slug FROM 1 FOR 4)) || '-' || UPPER(SUBSTRING(equip.equipment_type FROM 1 FOR 3)),
        NOW() - INTERVAL '540 days',
        175000.00,
        142500.00,
        'active',
        f.id,
        'good',
        'DB-seeded record (not mock runtime data)',
        jsonb_build_object(
          'latitude', (f.latitude + equip.lat_off)::text,
          'longitude', (f.longitude + equip.lng_off)::text
        )
      )
      ON CONFLICT (tenant_id, asset_number) DO NOTHING;

      SELECT id INTO a_id
      FROM assets
      WHERE tenant_id = t.id
        AND asset_number = 'HEQ-' || UPPER(SUBSTRING(t.slug FROM 1 FOR 6)) || '-' || UPPER(SUBSTRING(equip.equipment_type FROM 1 FOR 3))
      LIMIT 1;

      -- Create heavy_equipment if not present
      IF a_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM heavy_equipment WHERE tenant_id = t.id AND asset_id = a_id
      ) THEN
        INSERT INTO heavy_equipment (
          tenant_id,
          asset_id,
          equipment_type,
          model_year,
          engine_hours,
          engine_type,
          weight_capacity_lbs,
          load_capacity,
          reach_distance_ft,
          inspection_required,
          last_inspection_date,
          next_inspection_date,
          certification_number,
          requires_certification,
          operator_license_type,
          metadata
        )
        VALUES (
          t.id,
          a_id,
          equip.equipment_type,
          equip.model_year,
          equip.engine_hours,
          equip.engine_type,
          equip.weight_capacity_lbs,
          NULL,
          NULL,
          TRUE,
          CURRENT_DATE - INTERVAL '30 days',
          CURRENT_DATE + INTERVAL '335 days',
          'CERT-' || UPPER(SUBSTRING(equip.equipment_type FROM 1 FOR 3)) || '-001',
          TRUE,
          'Class-A',
          jsonb_build_object(
            'availability_status', equip.availability_status,
            'is_rental', equip.is_rental,
            'current_job_site', equip.job_site
          )
        )
        RETURNING id INTO he_id;
      ELSE
        SELECT id INTO he_id
        FROM heavy_equipment
        WHERE tenant_id = t.id AND asset_id = a_id
        LIMIT 1;
      END IF;

      -- Seed telematics snapshot if none exists
      IF he_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM equipment_telematics_snapshots WHERE tenant_id = t.id AND equipment_id = he_id
      ) THEN
        INSERT INTO equipment_telematics_snapshots (
          tenant_id,
          equipment_id,
          timestamp,
          engine_hours,
          engine_rpm,
          engine_temp_celsius,
          fuel_level_percent,
          fuel_consumption_rate,
          latitude,
          longitude,
          speed_mph,
          altitude_feet,
          hydraulic_pressure_psi,
          battery_voltage,
          diagnostic_codes,
          alerts
        )
        SELECT
          t.id,
          he_id,
          NOW(),
          equip.engine_hours,
          1500,
          88,
          72,
          5.6,
          COALESCE(NULLIF(a.metadata->>'latitude','')::numeric, f.latitude),
          COALESCE(NULLIF(a.metadata->>'longitude','')::numeric, f.longitude),
          0,
          150,
          2450,
          12.6,
          ARRAY[]::TEXT[],
          '[]'::jsonb
        FROM assets a
        WHERE a.id = a_id;
      END IF;

      -- Seed a simple maintenance schedule if none exists for this equipment
      IF he_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM equipment_maintenance_schedules WHERE tenant_id = t.id AND equipment_id = he_id
      ) THEN
        INSERT INTO equipment_maintenance_schedules (
          tenant_id,
          equipment_id,
          schedule_type,
          title,
          description,
          interval_days,
          interval_hours,
          last_completed_date,
          next_due_date,
          last_completed_hours,
          next_due_hours,
          status,
          is_active
        )
        VALUES (
          t.id,
          he_id,
          'both',
          'Preventive Maintenance',
          'Standard PM (hours + calendar)',
          90,
          250,
          CURRENT_DATE - INTERVAL '45 days',
          CURRENT_DATE + INTERVAL '45 days',
          GREATEST(0, equip.engine_hours - 120),
          equip.engine_hours + 130,
          CASE WHEN equip.availability_status = 'maintenance' THEN 'overdue' ELSE 'scheduled' END,
          TRUE
        );
      END IF;

      -- Seed utilization logs (last 14 days) - idempotent via unique constraint
      INSERT INTO equipment_utilization_logs (
        tenant_id, equipment_id, log_date, productive_hours, idle_hours, maintenance_hours, down_hours,
        billable_hours, total_revenue, engine_hours, fuel_consumption_rate, metadata
      )
      SELECT
        t.id,
        he_id,
        (CURRENT_DATE - gs.day_offset)::date AS log_date,
        (4 + (gs.day_offset % 3))::numeric AS productive_hours,
        (1 + (gs.day_offset % 2))::numeric AS idle_hours,
        (CASE WHEN gs.day_offset % 7 = 0 THEN 1 ELSE 0 END)::numeric AS maintenance_hours,
        0::numeric AS down_hours,
        (4 + (gs.day_offset % 3))::numeric AS billable_hours,
        ((4 + (gs.day_offset % 3)) * 125)::numeric AS total_revenue,
        equip.engine_hours + (14 - gs.day_offset) AS engine_hours,
        5.0 + (gs.day_offset % 4) * 0.25 AS fuel_consumption_rate,
        jsonb_build_object('job_site', equip.job_site)
      FROM (SELECT generate_series(0, 13) AS day_offset) gs
      ON CONFLICT (tenant_id, equipment_id, log_date) DO NOTHING;

      -- Seed cost events if none exist for this equipment and period
      IF he_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM equipment_maintenance_events
        WHERE tenant_id = t.id AND equipment_id = he_id AND event_date >= CURRENT_DATE - INTERVAL '180 days'
      ) THEN
        INSERT INTO equipment_maintenance_events (tenant_id, equipment_id, event_date, description, cost, metadata)
        VALUES
          (t.id, he_id, CURRENT_DATE - INTERVAL '120 days', 'Hydraulic service', 1850.00, jsonb_build_object('cost_type','maintenance')),
          (t.id, he_id, CURRENT_DATE - INTERVAL '60 days',  'Fuel (diesel)',     920.00, jsonb_build_object('cost_type','fuel')),
          (t.id, he_id, CURRENT_DATE - INTERVAL '55 days',  'Operator labor',    640.00, jsonb_build_object('cost_type','labor')),
          (t.id, he_id, CURRENT_DATE - INTERVAL '30 days',  'Insurance premium', 310.00, jsonb_build_object('cost_type','insurance')),
          (t.id, he_id, CURRENT_DATE - INTERVAL '20 days',  'Yard storage',      180.00, jsonb_build_object('cost_type','storage'));
      END IF;
    END LOOP;

    -- Seed operator certifications for a few active drivers per tenant (idempotent via existence check)
    FOR d IN
      SELECT id FROM drivers WHERE tenant_id = t.id AND status = 'active' ORDER BY created_at ASC LIMIT 3
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM equipment_operator_certifications
        WHERE tenant_id = t.id AND driver_id = d.id AND equipment_type = 'excavator'
      ) THEN
        INSERT INTO equipment_operator_certifications (
          tenant_id,
          driver_id,
          equipment_type,
          certification_number,
          certification_date,
          expiry_date,
          certifying_authority,
          certification_level,
          status
        )
        VALUES (
          t.id,
          d.id,
          'excavator',
          'EXC-' || SUBSTRING(d.id::text FROM 1 FOR 6),
          CURRENT_DATE - INTERVAL '365 days',
          CURRENT_DATE + INTERVAL '365 days',
          'CTA Training Authority',
          'intermediate',
          'active'
        );
      END IF;
    END LOOP;
  END LOOP;
END $$;

