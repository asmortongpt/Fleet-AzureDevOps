-- Fleet Management System - Production Seed Data
-- Capital Tech Alliance Fleet
-- Created: 2025-11-08

-- Set search path
SET search_path TO public;

-- ===========================================================================
-- TENANT: Capital Tech Alliance
-- ===========================================================================
INSERT INTO tenants (id, name, domain, settings, is_active, created_at)
VALUES (
    'cta00000-0000-0000-0000-000000000001'::UUID,
    'Capital Tech Alliance Fleet',
    'fleet.capitaltechalliance.com',
    '{"max_vehicles": 1000, "max_drivers": 500, "timezone": "America/New_York", "billing_tier": "enterprise"}'::JSONB,
    true,
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    domain = EXCLUDED.domain,
    settings = EXCLUDED.settings,
    updated_at = NOW();

-- Admin User
INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, phone, role, is_active, created_at)
VALUES (
    'usr00000-0000-0000-0000-000000000001'::UUID,
    'cta00000-0000-0000-0000-000000000001'::UUID,
    'admin@capitaltechalliance.com',
    '$2b$10$rSyN0kzQvb9VqP1Ue3jV8.xQZYv4YvWxqJLjBzH6P8RqK2JZyK1Oa',
    'System',
    'Administrator',
    '+1-850-555-0001',
    'admin',
    true,
    NOW()
) ON CONFLICT (email) DO UPDATE SET updated_at = NOW();

\echo 'Seed data created successfully!'
