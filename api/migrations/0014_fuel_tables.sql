-- Fuel & Fraud Detection Tables Migration
-- Feature 5: Fuel Card Integration & Fraud Detection

-- Create fuel_transactions table
CREATE TABLE IF NOT EXISTS fuel_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  timestamp TIMESTAMP NOT NULL,
  volume DECIMAL(10, 2) NOT NULL,
  cost DECIMAL(10, 2) NOT NULL,
  fuel_type VARCHAR(50),
  odometer DECIMAL(10, 2),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  card_number VARCHAR(50),
  merchant_name VARCHAR(200),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create fuel_fraud_rules table
CREATE TABLE IF NOT EXISTS fuel_fraud_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  rule_type VARCHAR(50) NOT NULL,
  parameters JSONB NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create fuel_fraud_alerts table
CREATE TABLE IF NOT EXISTS fuel_fraud_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES fuel_transactions(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES fuel_fraud_rules(id) ON DELETE CASCADE,
  severity VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'open',
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes
CREATE INDEX idx_fuel_transactions_asset ON fuel_transactions(asset_id);
CREATE INDEX idx_fuel_transactions_driver ON fuel_transactions(driver_id);
CREATE INDEX idx_fuel_transactions_timestamp ON fuel_transactions(timestamp);
CREATE INDEX idx_fuel_fraud_alerts_transaction ON fuel_fraud_alerts(transaction_id);
CREATE INDEX idx_fuel_fraud_alerts_status ON fuel_fraud_alerts(status);
