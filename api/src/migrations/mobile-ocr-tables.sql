-- Mobile OCR Tables Migration
-- Tables for mobile OCR capture functionality

-- Odometer readings table
CREATE TABLE IF NOT EXISTS odometer_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    odometer_reading DECIMAL(10, 2) NOT NULL,
    reading_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reading_type VARCHAR(50) DEFAULT 'manual' CHECK (reading_type IN ('manual', 'ocr', 'telematics', 'gps')),
    unit VARCHAR(20) DEFAULT 'miles' CHECK (unit IN ('miles', 'kilometers')),
    photo_path TEXT,
    trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
    reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
    confidence_score DECIMAL(3, 2),
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_odometer_readings_tenant ON odometer_readings(tenant_id);
CREATE INDEX idx_odometer_readings_vehicle ON odometer_readings(vehicle_id);
CREATE INDEX idx_odometer_readings_date ON odometer_readings(reading_date DESC);
CREATE INDEX idx_odometer_readings_trip ON odometer_readings(trip_id);

-- Mobile OCR captures table (metadata for all OCR captures)
CREATE TABLE IF NOT EXISTS mobile_ocr_captures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    capture_type VARCHAR(50) NOT NULL CHECK (capture_type IN ('fuel_receipt', 'odometer', 'damage', 'inspection')),
    document_id VARCHAR(255) NOT NULL,
    image_path TEXT NOT NULL,
    ocr_data JSONB,
    confidence_scores JSONB,
    processing_time INTEGER, -- milliseconds
    ocr_provider VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_mobile_ocr_tenant ON mobile_ocr_captures(tenant_id);
CREATE INDEX idx_mobile_ocr_user ON mobile_ocr_captures(user_id);
CREATE INDEX idx_mobile_ocr_type ON mobile_ocr_captures(capture_type);
CREATE INDEX idx_mobile_ocr_document ON mobile_ocr_captures(document_id);
CREATE INDEX idx_mobile_ocr_created ON mobile_ocr_captures(created_at DESC);

-- Add columns to vehicles table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'vehicles' AND column_name = 'last_odometer_update'
    ) THEN
        ALTER TABLE vehicles ADD COLUMN last_odometer_update TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add trigger to update vehicles.updated_at
CREATE OR REPLACE FUNCTION update_vehicle_odometer_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE vehicles
    SET updated_at = NOW()
    WHERE id = NEW.vehicle_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_vehicle_odometer
    AFTER INSERT ON odometer_readings
    FOR EACH ROW
    EXECUTE FUNCTION update_vehicle_odometer_timestamp();

-- Add trigger to update mobile_ocr_captures.updated_at
CREATE OR REPLACE FUNCTION update_mobile_ocr_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_mobile_ocr_timestamp
    BEFORE UPDATE ON mobile_ocr_captures
    FOR EACH ROW
    EXECUTE FUNCTION update_mobile_ocr_timestamp();

-- Grants for mobile app users (adjust roles as needed)
GRANT SELECT, INSERT, UPDATE ON odometer_readings TO authenticated_users;
GRANT SELECT, INSERT ON mobile_ocr_captures TO authenticated_users;

-- Comments
COMMENT ON TABLE odometer_readings IS 'Stores all odometer readings from various sources including OCR captures';
COMMENT ON TABLE mobile_ocr_captures IS 'Metadata for all mobile OCR captures including fuel receipts, odometer readings, and damage reports';
COMMENT ON COLUMN odometer_readings.reading_type IS 'Source of the reading: manual entry, OCR, telematics, or GPS';
COMMENT ON COLUMN odometer_readings.confidence_score IS 'Confidence score from OCR (0.0 to 1.0) if applicable';
COMMENT ON COLUMN mobile_ocr_captures.ocr_data IS 'Full structured data extracted from OCR';
COMMENT ON COLUMN mobile_ocr_captures.confidence_scores IS 'Confidence scores for each extracted field';
