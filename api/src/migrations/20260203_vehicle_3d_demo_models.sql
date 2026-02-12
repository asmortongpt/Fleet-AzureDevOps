-- Seed 3D model records aligned with the current schema (vehicle_3d_models)

WITH admin AS (
  SELECT tenant_id
  FROM users
  ORDER BY (email = 'admin@fleet.local') DESC, created_at
  LIMIT 1
)
INSERT INTO vehicle_3d_models (
  tenant_id,
  model_name,
  model_type,
  file_url,
  thumbnail_url,
  poly_count,
  status,
  metadata,
  created_at,
  updated_at
)
SELECT
  admin.tenant_id,
  m.model_name,
  m.model_type,
  m.file_url,
  m.thumbnail_url,
  m.poly_count,
  'active',
  m.metadata::jsonb,
  NOW(),
  NOW()
FROM admin
CROSS JOIN (
  VALUES
    (
      'Generic Sedan',
      'sedan',
      '/models/vehicles/sedans/sample_sedan.glb',
      NULL,
      50000,
      '{"make":"Generic","model":"Sedan","year":"2024","bodyStyle":"sedan"}'
    ),
    (
      'Generic SUV',
      'suv',
      '/models/vehicles/suvs/ford_explorer.glb',
      NULL,
      60000,
      '{"make":"Generic","model":"SUV","year":"2024","bodyStyle":"suv"}'
    ),
    (
      'Generic Pickup',
      'truck',
      '/models/vehicles/trucks/sample_truck.glb',
      NULL,
      65000,
      '{"make":"Generic","model":"Pickup","year":"2024","bodyStyle":"truck"}'
    ),
    (
      'Generic Van',
      'van',
      '/models/vehicles/vans/ford_transit.glb',
      NULL,
      52000,
      '{"make":"Generic","model":"Van","year":"2024","bodyStyle":"van"}'
    )
) AS m(model_name, model_type, file_url, thumbnail_url, poly_count, metadata)
WHERE NOT EXISTS (
  SELECT 1
  FROM vehicle_3d_models existing
  WHERE existing.tenant_id = admin.tenant_id
    AND existing.model_name = m.model_name
);
