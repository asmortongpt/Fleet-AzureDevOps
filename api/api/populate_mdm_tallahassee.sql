-- ============================================================================
-- Populate MDM with Tallahassee Data + Avatars + Vehicle Images
-- ============================================================================

BEGIN;

-- Get default tenant ID
DO $$
DECLARE
  default_tenant_id UUID;
BEGIN
  SELECT id INTO default_tenant_id FROM tenants LIMIT 1;

  -- ============================================================================
  -- POPULATE MDM_PEOPLE from Drivers with Avatars
  -- ============================================================================
  INSERT INTO mdm_people (
    tenant_id,
    global_person_id,
    first_name,
    middle_name,
    last_name,
    preferred_name,
    date_of_birth,
    gender,
    primary_email,
    primary_phone,
    emergency_contact_name,
    emergency_contact_phone,
    street_address,
    city,
    state,
    zip_code,
    country,
    avatar_url,
    profile_photo_url,
    person_type,
    status,
    metadata,
    created_at
  )
  SELECT
    tenant_id,
    'PER-' || LPAD((ROW_NUMBER() OVER (ORDER BY created_at))::text, 6, '0') as global_person_id,
    first_name,
    NULL as middle_name,
    last_name,
    first_name as preferred_name,
    date_of_birth,
    CASE (ROW_NUMBER() OVER (ORDER BY created_at)) % 3
      WHEN 0 THEN 'male'
      WHEN 1 THEN 'female'
      ELSE 'other'
    END as gender,
    email as primary_email,
    phone as primary_phone,
    emergency_contact_name,
    emergency_contact_phone,
    '1245 Monroe Street' as street_address,
    'Tallahassee' as city,
    'Florida' as state,
    '32301' as zip_code,
    'USA' as country,
    -- Generate avatar using DiceBear API (free, deterministic avatars)
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || first_name || last_name || '&backgroundColor=b6e3f4' as avatar_url,
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || first_name || last_name || '&backgroundColor=b6e3f4&size=256' as profile_photo_url,
    'driver' as person_type,
    CASE d.status
      WHEN 'active' THEN 'active'
      WHEN 'inactive' THEN 'inactive'
      ELSE 'active'
    END as status,
    jsonb_build_object(
      'employee_number', employee_number,
      'license_number', license_number,
      'license_state', license_state,
      'cdl', cdl,
      'cdl_class', cdl_class
    ) as metadata,
    created_at
  FROM drivers d
  WHERE d.id IN (SELECT id FROM drivers ORDER BY created_at LIMIT 30)
  ON CONFLICT (global_person_id) DO NOTHING;

  -- Link drivers to MDM people
  UPDATE drivers d
  SET mdm_person_id = mp.id
  FROM mdm_people mp
  WHERE 'PER-' || LPAD((
    SELECT ROW_NUMBER()
    FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn FROM drivers) sub
    WHERE sub.id = d.id
  )::text, 6, '0') = mp.global_person_id;

  -- ============================================================================
  -- POPULATE MDM_PLACES from Facilities
  -- ============================================================================
  INSERT INTO mdm_places (
    tenant_id,
    global_place_id,
    name,
    code,
    street_address,
    city,
    state,
    zip_code,
    country,
    latitude,
    longitude,
    place_type,
    sub_type,
    status,
    contact_name,
    contact_phone,
    contact_email,
    operating_hours,
    capacity,
    current_occupancy,
    image_url,
    metadata,
    created_at
  )
  SELECT
    tenant_id,
    'PLC-' || LPAD((ROW_NUMBER() OVER (ORDER BY created_at))::text, 6, '0') as global_place_id,
    name,
    code,
    address as street_address,
    city,
    state,
    zip_code,
    country,
    latitude,
    longitude,
    type as place_type,
    'facility' as sub_type,
    CASE is_active WHEN true THEN 'active' ELSE 'inactive' END as status,
    contact_name,
    contact_phone,
    contact_email,
    operating_hours,
    capacity,
    current_occupancy,
    'https://picsum.photos/seed/' || code || '/800/600' as image_url,
    '{}' as metadata,
    created_at
  FROM facilities
  WHERE id IN (SELECT id FROM facilities LIMIT 10)
  ON CONFLICT (global_place_id) DO NOTHING;

  -- Link facilities to MDM places
  UPDATE facilities f
  SET mdm_place_id = mp.id
  FROM mdm_places mp
  WHERE 'PLC-' || LPAD((
    SELECT ROW_NUMBER()
    FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn FROM facilities) sub
    WHERE sub.id = f.id
  )::text, 6, '0') = mp.global_place_id;

  -- ============================================================================
  -- POPULATE MDM_THINGS from Vehicles with Real Vehicle Images
  -- ============================================================================
  INSERT INTO mdm_things (
    tenant_id,
    global_thing_id,
    name,
    number,
    serial_number,
    thing_type,
    category,
    sub_category,
    make,
    model,
    year,
    vin,
    license_plate,
    status,
    condition,
    purchase_date,
    purchase_price,
    current_value,
    assigned_person_id,
    image_url,
    photos,
    metadata,
    created_at
  )
  SELECT
    v.tenant_id,
    'THG-' || LPAD((ROW_NUMBER() OVER (ORDER BY v.created_at))::text, 6, '0') as global_thing_id,
    v.name,
    v.number,
    v.vin as serial_number,
    'vehicle' as thing_type,
    v.type as category,
    CASE v.type
      WHEN 'van' THEN 'cargo_van'
      WHEN 'truck' THEN 'pickup_truck'
      WHEN 'bus' THEN 'passenger_bus'
      ELSE 'utility'
    END as sub_category,
    v.make,
    v.model,
    v.year,
    v.vin,
    v.license_plate,
    CASE v.status
      WHEN 'active' THEN 'active'
      WHEN 'maintenance' THEN 'maintenance'
      WHEN 'inactive' THEN 'retired'
      ELSE 'active'
    END as status,
    'good' as condition,
    v.purchase_date,
    v.purchase_price,
    v.current_value,
    mp.id as assigned_person_id,
    -- Generate realistic vehicle images using Unsplash API
    CASE
      WHEN v.make = 'Ford' AND v.model LIKE '%Transit%' THEN
        'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&h=600&fit=crop&q=80'
      WHEN v.make = 'Chevrolet' AND v.model LIKE '%Silverado%' THEN
        'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&h=600&fit=crop&q=80'
      WHEN v.make = 'RAM' THEN
        'https://images.unsplash.com/photo-1580414057667-d76e0a8c6b47?w=800&h=600&fit=crop&q=80'
      WHEN v.make = 'Toyota' THEN
        'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&h=600&fit=crop&q=80'
      ELSE
        'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop&q=80'
    END as image_url,
    jsonb_build_array(
      CASE
        WHEN v.make = 'Ford' AND v.model LIKE '%Transit%' THEN
          'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&h=600&fit=crop&q=80'
        WHEN v.make = 'Chevrolet' AND v.model LIKE '%Silverado%' THEN
          'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&h=600&fit=crop&q=80'
        WHEN v.make = 'RAM' THEN
          'https://images.unsplash.com/photo-1580414057667-d76e0a8c6b47?w=800&h=600&fit=crop&q=80'
        WHEN v.make = 'Toyota' THEN
          'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&h=600&fit=crop&q=80'
        ELSE
          'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop&q=80'
      END
    ) as photos,
    jsonb_build_object(
      'fuel_type', v.fuel_type,
      'fuel_level', v.fuel_level,
      'odometer', v.odometer,
      'last_service_date', v.last_service_date,
      'next_service_date', v.next_service_date
    ) as metadata,
    v.created_at
  FROM vehicles v
  LEFT JOIN drivers d ON d.id = v.assigned_driver_id
  LEFT JOIN mdm_people mp ON mp.id = d.mdm_person_id
  WHERE v.number LIKE 'TLH-%'
  ON CONFLICT (global_thing_id) DO NOTHING;

  -- Link vehicles to MDM things
  UPDATE vehicles v
  SET mdm_thing_id = mt.id
  FROM mdm_things mt
  WHERE 'THG-' || LPAD((
    SELECT ROW_NUMBER()
    FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn FROM vehicles WHERE number LIKE 'TLH-%') sub
    WHERE sub.id = v.id
  )::text, 6, '0') = mt.global_thing_id;

  -- ============================================================================
  -- Update Drivers table with avatar URLs
  -- ============================================================================
  UPDATE drivers d
  SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'avatar_url', mp.avatar_url,
    'profile_photo_url', mp.profile_photo_url,
    'mdm_global_id', mp.global_person_id
  )
  FROM mdm_people mp
  WHERE mp.id = d.mdm_person_id;

  -- ============================================================================
  -- Update Vehicles table with image URLs
  -- ============================================================================
  UPDATE vehicles v
  SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'image_url', mt.image_url,
    'photos', mt.photos,
    'mdm_global_id', mt.global_thing_id
  )
  FROM mdm_things mt
  WHERE mt.id = v.mdm_thing_id;

END $$;

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
\echo '========================================='
\echo 'MDM Population Complete'
\echo '========================================='

SELECT 'PEOPLE' as entity, COUNT(*) as total FROM mdm_people
UNION ALL
SELECT 'PLACES' as entity, COUNT(*) as total FROM mdm_places
UNION ALL
SELECT 'THINGS' as entity, COUNT(*) as total FROM mdm_things
ORDER BY entity;

\echo ''
\echo 'Sample People with Avatars:'
SELECT
  global_person_id,
  first_name || ' ' || last_name as name,
  person_type,
  LEFT(avatar_url, 50) || '...' as avatar
FROM mdm_people
LIMIT 5;

\echo ''
\echo 'Sample Things (Vehicles) with Images:'
SELECT
  global_thing_id,
  name,
  make || ' ' || model || ' ' || year::text as vehicle,
  LEFT(image_url, 50) || '...' as image
FROM mdm_things
WHERE thing_type = 'vehicle'
LIMIT 5;

\echo ''
\echo 'Drivers with Avatars:'
SELECT
  d.first_name || ' ' || d.last_name as driver,
  mp.avatar_url IS NOT NULL as has_avatar,
  d.metadata->>'avatar_url' IS NOT NULL as avatar_in_metadata
FROM drivers d
LEFT JOIN mdm_people mp ON mp.id = d.mdm_person_id
WHERE d.id IN (SELECT id FROM drivers ORDER BY created_at LIMIT 5);

\echo ''
\echo 'Vehicles with Images:'
SELECT
  v.number,
  v.name,
  mt.image_url IS NOT NULL as has_image,
  v.metadata->>'image_url' IS NOT NULL as image_in_metadata
FROM vehicles v
LEFT JOIN mdm_things mt ON mt.id = v.mdm_thing_id
WHERE v.number LIKE 'TLH-%'
LIMIT 5;
