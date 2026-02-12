BEGIN;

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS unit_number varchar(50),
  ADD COLUMN IF NOT EXISTS vehicle_number varchar(50);

UPDATE vehicles
SET
  unit_number = COALESCE(unit_number, number, vin),
  vehicle_number = COALESCE(vehicle_number, number, unit_number, vin)
WHERE unit_number IS NULL
   OR vehicle_number IS NULL;

CREATE OR REPLACE FUNCTION sync_vehicle_numbers()
RETURNS trigger AS $$
BEGIN
  IF NEW.number IS NULL OR NEW.number = '' THEN
    NEW.number := COALESCE(NULLIF(NEW.unit_number, ''), NULLIF(NEW.vehicle_number, ''), NEW.vin, NEW.number);
  END IF;

  NEW.unit_number := COALESCE(NULLIF(NEW.unit_number, ''), NEW.number);
  NEW.vehicle_number := COALESCE(NULLIF(NEW.vehicle_number, ''), NEW.number);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS vehicles_sync_numbers ON vehicles;
CREATE TRIGGER vehicles_sync_numbers
BEFORE INSERT OR UPDATE ON vehicles
FOR EACH ROW EXECUTE FUNCTION sync_vehicle_numbers();

COMMIT;
