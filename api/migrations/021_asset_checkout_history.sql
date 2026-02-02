-- api/migrations/021_asset_checkout_history.sql

-- This migration script creates a table for tracking the checkout history of assets
-- including GPS location data and a reference to photos associated with each checkout.

BEGIN;

CREATE TABLE IF NOT EXISTS asset_checkout_history (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER NOT NULL,
    tenant_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    checkout_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    checkin_time TIMESTAMP WITH TIME ZONE,
    gps_lat NUMERIC(10, 7) CHECK (gps_lat >= -90 AND gps_lat <= 90),
    gps_lng NUMERIC(10, 7) CHECK (gps_lng >= -180 AND gps_lng <= 180),
    photo_url VARCHAR(255),
    condition_rating INTEGER CHECK (condition_rating >= 1 AND condition_rating <= 5),
    signature_base64 TEXT,
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

COMMIT;