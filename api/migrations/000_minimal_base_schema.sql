-- Minimal base schema to support Phase 1 AI-generated migrations
-- Created: 2025-11-27
-- Purpose: Unblock Phase 1 WebSocket, Mobile QR, and Analytics features

BEGIN;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tenants table - Multi-tenant isolation
CREATE TABLE IF NOT EXISTS tenants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) UNIQUE,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tenants_status ON tenants(status);

-- Users table - Authentication and authorization
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'user',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_email_per_tenant UNIQUE (tenant_id, email)
);

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

-- Assets table - For fleet/asset management
CREATE TABLE IF NOT EXISTS assets (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  asset_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  location VARCHAR(255),
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  qr_code VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id)
);

CREATE INDEX idx_assets_tenant_id ON assets(tenant_id);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_assigned_to ON assets(assigned_to);
CREATE INDEX idx_assets_qr_code ON assets(qr_code);

-- Insert default tenant for development
INSERT INTO tenants (id, name, domain, status)
VALUES (1, 'Default Tenant', 'default.local', 'active')
ON CONFLICT (id) DO NOTHING;

-- Insert default admin user
INSERT INTO users (id, tenant_id, email, first_name, last_name, role, status)
VALUES (1, 1, 'admin@fleet.local', 'Admin', 'User', 'admin', 'active')
ON CONFLICT (id) DO NOTHING;

COMMIT;
