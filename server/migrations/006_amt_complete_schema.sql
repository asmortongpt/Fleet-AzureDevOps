BEGIN;

-- Table for scan sessions/events
CREATE TABLE scan_sessions (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    asset_id UUID NOT NULL,
    scan_type VARCHAR(50) CHECK (scan_type IN ('barcode', 'QR', 'RFID')),
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (asset_id) REFERENCES assets(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_scan_sessions_tenant_id ON scan_sessions(tenant_id);

-- Table for asset checkout history
CREATE TABLE asset_checkout_history (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    asset_id UUID NOT NULL,
    user_id UUID NOT NULL,
    checked_out_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    checked_in_at TIMESTAMPTZ,
    condition VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (asset_id) REFERENCES assets(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_asset_checkout_history_tenant_id ON asset_checkout_history(tenant_id);

-- Table for asset locations
CREATE TABLE asset_locations (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    asset_id UUID NOT NULL,
    location GEOGRAPHY(POINT, 4326),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (asset_id) REFERENCES assets(id)
);

CREATE INDEX idx_asset_locations_tenant_id ON asset_locations(tenant_id);

-- Table for geofences
CREATE TABLE geofences (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    boundary GEOGRAPHY(POLYGON, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_geofences_tenant_id ON geofences(tenant_id);

-- Table for geofence rules and alerts
CREATE TABLE geofence_rules (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    geofence_id INT NOT NULL,
    rule_type VARCHAR(50) CHECK (rule_type IN ('entry', 'exit')),
    alert_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (geofence_id) REFERENCES geofences(id)
);

CREATE INDEX idx_geofence_rules_tenant_id ON geofence_rules(tenant_id);

-- Table for asset utilization tracking
CREATE TABLE asset_utilization (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    asset_id UUID NOT NULL,
    usage_start TIMESTAMPTZ NOT NULL,
    usage_end TIMESTAMPTZ,
    usage_duration INTERVAL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (asset_id) REFERENCES assets(id)
);

CREATE INDEX idx_asset_utilization_tenant_id ON asset_utilization(tenant_id);

-- Table for compliance documents
CREATE TABLE compliance_documents (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    asset_id UUID NOT NULL,
    document_type VARCHAR(100),
    document_url TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (asset_id) REFERENCES assets(id)
);

CREATE INDEX idx_compliance_documents_tenant_id ON compliance_documents(tenant_id);

-- Table for software licenses
CREATE TABLE software_licenses (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    software_name VARCHAR(255) NOT NULL,
    license_key VARCHAR(255) NOT NULL,
    allocated_to UUID,
    allocation_date TIMESTAMPTZ,
    expiration_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (allocated_to) REFERENCES users(id)
);

CREATE INDEX idx_software_licenses_tenant_id ON software_licenses(tenant_id);

-- Audit triggers for critical actions
CREATE OR REPLACE FUNCTION audit_trigger() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (tenant_id, table_name, operation, user_id, changed_data, changed_at)
    VALUES (NEW.tenant_id, TG_TABLE_NAME, TG_OP, current_user, row_to_json(NEW), NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_scan_sessions
AFTER INSERT OR UPDATE OR DELETE ON scan_sessions
FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_asset_checkout_history
AFTER INSERT OR UPDATE OR DELETE ON asset_checkout_history
FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_asset_locations
AFTER INSERT OR UPDATE OR DELETE ON asset_locations
FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_geofences
AFTER INSERT OR UPDATE OR DELETE ON geofences
FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_geofence_rules
AFTER INSERT OR UPDATE OR DELETE ON geofence_rules
FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_asset_utilization
AFTER INSERT OR UPDATE OR DELETE ON asset_utilization
FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_compliance_documents
AFTER INSERT OR UPDATE OR DELETE ON compliance_documents
FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_software_licenses
AFTER INSERT OR UPDATE OR DELETE ON software_licenses
FOR EACH ROW EXECUTE FUNCTION audit_trigger();

COMMIT;