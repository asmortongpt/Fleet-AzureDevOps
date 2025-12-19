-- Enable required PostgreSQL extensions
-- Must be run as admin user

-- Enable UUID extension (use gen_random_uuid() instead of uuid-ossp)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable PostGIS for geographic data (if available)
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS "postgis";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'PostGIS extension not available - geographic features will be limited';
END
$$;

-- Comment
COMMENT ON EXTENSION pgcrypto IS 'Cryptographic functions including UUID generation';
