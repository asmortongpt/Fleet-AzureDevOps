-- Migration: Add station_id column to charging_stations table
-- Date: 2025-11-14
-- Description: Adds unique station_id column for OCPP protocol identification

DO $$
BEGIN
    -- Add station_id column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'charging_stations' AND column_name = 'station_id'
    ) THEN
        ALTER TABLE charging_stations ADD COLUMN station_id VARCHAR(100) UNIQUE;
        RAISE NOTICE 'Added station_id column to charging_stations table';

        -- Populate station_id with generated values for existing records using a CTE
        WITH numbered_stations AS (
            SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_num
            FROM charging_stations
            WHERE station_id IS NULL
        )
        UPDATE charging_stations cs
        SET station_id = 'STATION-' || LPAD(ns.row_num::TEXT, 6, '0')
        FROM numbered_stations ns
        WHERE cs.id = ns.id;

        -- Make it NOT NULL after populating
        ALTER TABLE charging_stations ALTER COLUMN station_id SET NOT NULL;

        RAISE NOTICE 'Populated station_id for existing charging stations';
    ELSE
        RAISE NOTICE 'station_id column already exists';
    END IF;
END $$;
