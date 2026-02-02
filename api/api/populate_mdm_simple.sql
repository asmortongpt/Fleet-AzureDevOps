-- ============================================================================
-- Populate MDM - Simplified Version
-- ============================================================================

BEGIN;

-- Get default tenant
DO $$
DECLARE
  default_tenant_id UUID;
  person_counter INTEGER := 0;
  place_counter INTEGER := 0;
  thing_counter INTEGER := 0;
BEGIN
  SELECT id INTO default_tenant_id FROM tenants LIMIT 1;

  -- ============================================================================
  -- 1. POPULATE MDM_PEOPLE from first 30 drivers
  -- ============================================================================
  FOR rec IN (SELECT * FROM drivers ORDER BY created_at LIMIT 30) LOOP
    person_counter := person_counter + 1;

    INSERT INTO mdm_people (
      tenant_id, global_person_id, first_name, last_name,
      date_of_birth, primary_email, primary_phone,
      emergency_contact_name, emergency_contact_phone,
      city, state, zip_code, country,
      avatar_url, profile_photo_url, person_type, status, metadata
    ) VALUES (
      rec.tenant_id,
      'PER-' || LPAD(person_counter::text, 6, '0'),
      rec.first_name,
      rec.last_name,
      rec.date_of_birth,
      rec.email,
      rec.phone,
      rec.emergency_contact_name,
      rec.emergency_contact_phone,
      'Tallahassee',
      'Florida',
      '32301',
      'USA',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=' || rec.first_name || rec.last_name || '&backgroundColor=b6e3f4',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=' || rec.first_name || rec.last_name || '&backgroundColor=b6e3f4&size=256',
      'driver',
      CASE rec.status WHEN 'active' THEN 'active' ELSE 'inactive' END,
      jsonb_build_object(
        'employee_number', rec.employee_number,
        'license_number', rec.license_number,
        'cdl', rec.cdl
      )
    )
    ON CONFLICT (global_person_id) DO NOTHING;

    -- Link driver to MDM person
    UPDATE drivers
    SET mdm_person_id = (SELECT id FROM mdm_people WHERE global_person_id = 'PER-' || LPAD(person_counter::text, 6, '0'))
    WHERE id = rec.id;

    -- Update driver metadata with avatar
    UPDATE drivers
    SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'avatar_url', 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || rec.first_name || rec.last_name || '&backgroundColor=b6e3f4',
      'profile_photo_url', 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || rec.first_name || rec.last_name || '&backgroundColor=b6e3f4&size=256'
    )
    WHERE id = rec.id;
  END LOOP;

  -- ============================================================================
  -- 2. POPULATE MDM_PLACES from facilities
  -- ============================================================================
  FOR rec IN (SELECT * FROM facilities ORDER BY created_at LIMIT 10) LOOP
    place_counter := place_counter + 1;

    INSERT INTO mdm_places (
      tenant_id, global_place_id, name, code,
      street_address, city, state, zip_code, country,
      latitude, longitude, place_type, status,
      contact_name, contact_phone, contact_email,
      operating_hours, capacity, current_occupancy, image_url
    ) VALUES (
      rec.tenant_id,
      'PLC-' || LPAD(place_counter::text, 6, '0'),
      rec.name,
      rec.code,
      rec.address,
      rec.city,
      rec.state,
      rec.zip_code,
      rec.country,
      rec.latitude,
      rec.longitude,
      rec.type,
      CASE rec.is_active WHEN true THEN 'active' ELSE 'inactive' END,
      rec.contact_name,
      rec.contact_phone,
      rec.contact_email,
      rec.operating_hours,
      rec.capacity,
      rec.current_occupancy,
      'https://picsum.photos/seed/' || rec.code || '/800/600'
    )
    ON CONFLICT (global_place_id) DO NOTHING;

    -- Link facility to MDM place
    UPDATE facilities
    SET mdm_place_id = (SELECT id FROM mdm_places WHERE global_place_id = 'PLC-' || LPAD(place_counter::text, 6, '0'))
    WHERE id = rec.id;
  END LOOP;

  -- ============================================================================
  -- 3. POPULATE MDM_THINGS from Tallahassee vehicles
  -- ============================================================================
  FOR rec IN (SELECT * FROM vehicles WHERE number LIKE 'TLH-%' ORDER BY created_at) LOOP
    thing_counter := thing_counter + 1;

    INSERT INTO mdm_things (
      tenant_id, global_thing_id, name, number, serial_number,
      thing_type, category, make, model, year,
      vin, license_plate, status, condition,
      purchase_date, purchase_price, current_value,
      assigned_person_id, image_url, photos, metadata
    ) VALUES (
      rec.tenant_id,
      'THG-' || LPAD(thing_counter::text, 6, '0'),
      rec.name,
      rec.number,
      rec.vin,
      'vehicle',
      rec.type,
      rec.make,
      rec.model,
      rec.year,
      rec.vin,
      rec.license_plate,
      CASE rec.status
        WHEN 'active' THEN 'active'
        WHEN 'maintenance' THEN 'maintenance'
        ELSE 'active'
      END,
      'good',
      rec.purchase_date,
      rec.purchase_price,
      rec.current_value,
      (SELECT mdm_person_id FROM drivers WHERE id = rec.assigned_driver_id),
      CASE
        WHEN rec.make = 'Ford' AND rec.model LIKE '%Transit%' THEN
          'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&h=600&fit=crop&q=80'
        WHEN rec.make = 'Chevrolet' AND rec.model LIKE '%Silverado%' THEN
          'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&h=600&fit=crop&q=80'
        WHEN rec.make = 'RAM' THEN
          'https://images.unsplash.com/photo-1580414057667-d76e0a8c6b47?w=800&h=600&fit=crop&q=80'
        WHEN rec.make = 'Toyota' THEN
          'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&h=600&fit=crop&q=80'
        ELSE
          'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop&q=80'
      END,
      jsonb_build_array(
        CASE
          WHEN rec.make = 'Ford' AND rec.model LIKE '%Transit%' THEN
            'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&h=600&fit=crop&q=80'
          WHEN rec.make = 'Chevrolet' AND rec.model LIKE '%Silverado%' THEN
            'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&h=600&fit=crop&q=80'
          WHEN rec.make = 'RAM' THEN
            'https://images.unsplash.com/photo-1580414057667-d76e0a8c6b47?w=800&h=600&fit=crop&q=80'
          WHEN rec.make = 'Toyota' THEN
            'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&h=600&fit=crop&q=80'
          ELSE
            'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop&q=80'
        END
      ),
      jsonb_build_object(
        'fuel_type', rec.fuel_type,
        'odometer', rec.odometer
      )
    )
    ON CONFLICT (global_thing_id) DO NOTHING;

    -- Link vehicle to MDM thing
    UPDATE vehicles
    SET mdm_thing_id = (SELECT id FROM mdm_things WHERE global_thing_id = 'THG-' || LPAD(thing_counter::text, 6, '0')),
        metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
          'image_url', CASE
            WHEN rec.make = 'Ford' AND rec.model LIKE '%Transit%' THEN
              'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&h=600&fit=crop&q=80'
            WHEN rec.make = 'Chevrolet' AND rec.model LIKE '%Silverado%' THEN
              'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&h=600&fit=crop&q=80'
            WHEN rec.make = 'RAM' THEN
              'https://images.unsplash.com/photo-1580414057667-d76e0a8c6b47?w=800&h=600&fit=crop&q=80'
            WHEN rec.make = 'Toyota' THEN
              'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&h=600&fit=crop&q=80'
            ELSE
              'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop&q=80'
          END
        )
    WHERE id = rec.id;
  END LOOP;

  RAISE NOTICE 'MDM Population Complete: % people, % places, % things', person_counter, place_counter, thing_counter;
END $$;

COMMIT;

-- Verification
SELECT 'PEOPLE' as entity, COUNT(*) as total FROM mdm_people
UNION ALL
SELECT 'PLACES' as entity, COUNT(*) as total FROM mdm_places
UNION ALL
SELECT 'THINGS' as entity, COUNT(*) as total FROM mdm_things
ORDER BY entity;

\echo ''
\echo 'Sample Drivers with Avatars:'
SELECT
  d.first_name || ' ' || d.last_name as driver,
  d.phone,
  LEFT(d.metadata->>'avatar_url', 60) || '...' as avatar
FROM drivers d
WHERE d.mdm_person_id IS NOT NULL
LIMIT 5;

\echo ''
\echo 'Sample Vehicles with Images:'
SELECT
  v.number,
  v.make || ' ' || v.model as vehicle,
  LEFT(v.metadata->>'image_url', 60) || '...' as image
FROM vehicles v
WHERE v.mdm_thing_id IS NOT NULL
LIMIT 5;
