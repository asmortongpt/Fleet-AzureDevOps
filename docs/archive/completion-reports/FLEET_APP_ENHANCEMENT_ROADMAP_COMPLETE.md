# Fleet App Enhancement Roadmap - Complete Implementation Guide
**Analysis Date:** 2026-01-05
**Based on:** Fleet Database ERD Comparison Matrix
**Version:** 2.0 - Comprehensive Edition

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Principles](#architecture-principles)
3. [Critical Implementations](#critical-implementations)
4. [High Value Implementations](#high-value-implementations)
5. [Enhancement Implementations](#enhancement-implementations)
6. [Security & Compliance Considerations](#security--compliance-considerations)
7. [Data Migration Strategy](#data-migration-strategy)
8. [API Specifications](#api-specifications)
9. [Frontend Component Library](#frontend-component-library)
10. [Testing Strategy](#testing-strategy)
11. [Performance Optimization](#performance-optimization)
12. [Deployment Plan](#deployment-plan)
13. [Training & Documentation](#training--documentation)
14. [Cost-Benefit Analysis](#cost-benefit-analysis)

---

## Executive Summary

This document provides a **complete implementation guide** for integrating critical data elements from the legacy Fleet Database ERD into the current Fleet application. The roadmap balances **enterprise functionality** with **modern architecture** principles.

### Priority Framework
- 🔴 **Critical (P0)** - Required for core business operations, ROI < 6 months
- 🟡 **High Value (P1)** - Significant operational improvement, ROI 6-12 months
- 🟢 **Enhancement (P2)** - Quality of life improvements, ROI 12-24 months
- ⚪ **Skip** - Not applicable or superseded by modern approach

### Quick Stats

| Metric | Value |
|--------|-------|
| **Total Implementation Time** | 16 weeks (8 sprints) |
| **New Database Tables** | 47 tables |
| **Modified Existing Tables** | 18 tables |
| **New API Endpoints** | 85+ endpoints |
| **New Frontend Pages** | 28 pages |
| **Frontend Components** | 65+ components |
| **Database Migrations** | 12 migration files |
| **Estimated Development Hours** | 1,280 hours (2 developers × 16 weeks) |
| **Estimated Cost** | $192,000 - $256,000 |
| **Expected Annual ROI** | $450,000 - $750,000 |

---

## Architecture Principles

### Design Philosophy

1. **Preserve Multi-Tenancy**
   - All new tables include `tenant_id`
   - Row-Level Security (RLS) policies applied
   - Tenant isolation maintained

2. **Maintain Modern Stack**
   - PostgreSQL with PostGIS for geospatial
   - UUID primary keys for distributed systems
   - JSONB for flexible metadata
   - Timestamp with timezone

3. **API-First Design**
   - RESTful endpoints with OpenAPI specs
   - GraphQL consideration for complex queries
   - Webhook support for integrations
   - Real-time via WebSockets where needed

4. **Progressive Enhancement**
   - Backward compatible migrations
   - Optional feature flags
   - Graceful degradation for missing data
   - No breaking changes to existing APIs

5. **Security by Default**
   - Parameterized queries ($1, $2, $3)
   - Input validation at API layer
   - Output escaping
   - Audit logging for sensitive operations
   - RBAC with granular permissions

### Technology Stack

```
Frontend:
- React 18+ with TypeScript
- Tailwind CSS for styling
- React Query for data fetching
- Zustand for state management
- Recharts for data visualization
- React Hook Form for forms
- Zod for validation

Backend:
- Node.js 20+ with Express
- TypeScript
- PostgreSQL 15+ with PostGIS
- Redis for caching
- Bull for job queues
- Winston for logging

Infrastructure:
- Azure Kubernetes Service (AKS)
- Azure Database for PostgreSQL
- Azure Redis Cache
- Azure Storage for documents
- Azure Application Insights
- GitHub Actions for CI/CD
```

---

## 1. ORGANIZATIONAL STRUCTURE (🔴 CRITICAL)

### Business Case

**Problem:** Current app lacks organizational hierarchy for cost allocation, departmental reporting, and budget tracking.

**Solution:** Implement 4-tier hierarchy (Business Area → Division → Department → Fund) matching enterprise accounting structure.

**ROI Calculation:**
- **Time Saved:** 20 hours/month in manual cost allocation
- **Cost Recovery:** $50K/year in improved chargeback accuracy
- **Compliance:** Eliminates audit findings on cost allocation
- **Payback Period:** 3 months

### Implementation Strategy

#### A. Enhanced Database Schema

```sql
-- Migration: 040_organizational_structure.sql
-- Dependencies: None
-- Estimated execution time: < 5 seconds

-- ============================================================================
-- BUSINESS AREAS
-- ============================================================================

CREATE TABLE business_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Identification
  business_area_code VARCHAR(50) NOT NULL,
  business_area_name VARCHAR(255) NOT NULL,
  short_name VARCHAR(50),

  -- Configuration
  display_metrics BOOLEAN DEFAULT TRUE,
  allow_cross_charging BOOLEAN DEFAULT FALSE,

  -- Hierarchy
  parent_business_area_id UUID REFERENCES business_areas(id) ON DELETE SET NULL,
  hierarchy_level INTEGER DEFAULT 0,
  hierarchy_path LTREE, -- PostgreSQL ltree for hierarchical queries

  -- Contact
  manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),

  -- Financial
  default_fund_id UUID, -- Will reference funds(id)
  cost_center VARCHAR(50),
  profit_center VARCHAR(50),

  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'archived')),
  effective_date DATE DEFAULT CURRENT_DATE,
  termination_date DATE,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),

  CONSTRAINT unique_business_area_code_per_tenant UNIQUE (tenant_id, business_area_code),
  CONSTRAINT check_termination_after_effective CHECK (termination_date IS NULL OR termination_date > effective_date)
);

-- Enable ltree extension for hierarchical queries
CREATE EXTENSION IF NOT EXISTS ltree;

CREATE INDEX idx_business_areas_tenant_id ON business_areas(tenant_id);
CREATE INDEX idx_business_areas_parent_id ON business_areas(parent_business_area_id);
CREATE INDEX idx_business_areas_hierarchy_path ON business_areas USING GIST(hierarchy_path);
CREATE INDEX idx_business_areas_status ON business_areas(status) WHERE status = 'active';
CREATE INDEX idx_business_areas_manager_id ON business_areas(manager_id);

COMMENT ON TABLE business_areas IS 'Top-level organizational units (companies, divisions, subsidiaries)';
COMMENT ON COLUMN business_areas.hierarchy_path IS 'Materialized path for fast hierarchical queries using ltree';

-- ============================================================================
-- DIVISIONS
-- ============================================================================

CREATE TABLE divisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Identification
  division_code VARCHAR(50) NOT NULL,
  division_name VARCHAR(255) NOT NULL,
  short_name VARCHAR(50),

  -- Hierarchy
  business_area_id UUID NOT NULL REFERENCES business_areas(id) ON DELETE CASCADE,
  parent_division_id UUID REFERENCES divisions(id) ON DELETE SET NULL,

  -- Contact
  director_id UUID REFERENCES users(id) ON DELETE SET NULL,
  contact_email VARCHAR(255),

  -- Configuration
  budget_authority_limit DECIMAL(15,2),
  approval_required_above DECIMAL(15,2),

  -- Location
  primary_location VARCHAR(255),
  region VARCHAR(100),

  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'archived')),
  effective_date DATE DEFAULT CURRENT_DATE,
  termination_date DATE,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),

  CONSTRAINT unique_division_code_per_tenant UNIQUE (tenant_id, division_code),
  CONSTRAINT check_division_termination CHECK (termination_date IS NULL OR termination_date > effective_date)
);

CREATE INDEX idx_divisions_tenant_id ON divisions(tenant_id);
CREATE INDEX idx_divisions_business_area_id ON divisions(business_area_id);
CREATE INDEX idx_divisions_parent_id ON divisions(parent_division_id);
CREATE INDEX idx_divisions_director_id ON divisions(director_id);
CREATE INDEX idx_divisions_status ON divisions(status) WHERE status = 'active';

COMMENT ON TABLE divisions IS 'Second-tier organizational units within business areas';

-- ============================================================================
-- DEPARTMENTS (Cost Centers)
-- ============================================================================

CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Identification
  department_code VARCHAR(50) NOT NULL,
  department_name VARCHAR(255) NOT NULL,
  short_name VARCHAR(50),

  -- Hierarchy
  division_id UUID REFERENCES divisions(id) ON DELETE SET NULL,
  parent_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,

  -- Financial
  fund_id UUID, -- Will reference funds(id)
  cost_center VARCHAR(50) UNIQUE,
  account_code VARCHAR(50),

  -- Management
  manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),

  -- Budget
  monthly_budget DECIMAL(15,2),
  annual_budget DECIMAL(15,2),
  budget_fiscal_year INTEGER,

  -- Configuration
  allow_work_orders BOOLEAN DEFAULT TRUE,
  allow_fuel_purchases BOOLEAN DEFAULT TRUE,
  require_approval_above DECIMAL(10,2),

  -- Location
  primary_facility_id UUID REFERENCES facilities(id),
  physical_address VARCHAR(500),

  -- Billing
  billing_frequency VARCHAR(20) DEFAULT 'monthly' CHECK (billing_frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'annual')),
  billing_contact_email VARCHAR(255),
  po_required BOOLEAN DEFAULT FALSE,
  default_po_number VARCHAR(100),

  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'archived')),
  effective_date DATE DEFAULT CURRENT_DATE,
  termination_date DATE,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),

  CONSTRAINT unique_department_code_per_tenant UNIQUE (tenant_id, department_code),
  CONSTRAINT check_department_termination CHECK (termination_date IS NULL OR termination_date > effective_date)
);

CREATE INDEX idx_departments_tenant_id ON departments(tenant_id);
CREATE INDEX idx_departments_division_id ON departments(division_id);
CREATE INDEX idx_departments_parent_id ON departments(parent_department_id);
CREATE INDEX idx_departments_fund_id ON departments(fund_id);
CREATE INDEX idx_departments_manager_id ON departments(manager_id);
CREATE INDEX idx_departments_cost_center ON departments(cost_center);
CREATE INDEX idx_departments_primary_facility_id ON departments(primary_facility_id);
CREATE INDEX idx_departments_status ON departments(status) WHERE status = 'active';

COMMENT ON TABLE departments IS 'Cost centers / departments within divisions';
COMMENT ON COLUMN departments.cost_center IS 'Unique cost center code for accounting integration';

-- ============================================================================
-- FUNDS (Budget Allocation)
-- ============================================================================

CREATE TABLE funds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Identification
  fund_code VARCHAR(50) NOT NULL,
  fund_name VARCHAR(255) NOT NULL,
  fund_description TEXT,

  -- Classification
  fund_type VARCHAR(50) NOT NULL CHECK (fund_type IN ('operating', 'capital', 'grant', 'restricted', 'revolving', 'special')),
  fund_category VARCHAR(100),

  -- Financial
  fiscal_year INTEGER NOT NULL,
  total_budget DECIMAL(15,2) NOT NULL,
  allocated_budget DECIMAL(15,2) DEFAULT 0,
  encumbered_amount DECIMAL(15,2) DEFAULT 0,
  spent_to_date DECIMAL(15,2) DEFAULT 0,
  available_balance DECIMAL(15,2) GENERATED ALWAYS AS (total_budget - allocated_budget - encumbered_amount - spent_to_date) STORED,

  -- Dates
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Restrictions
  is_restricted BOOLEAN DEFAULT FALSE,
  allowed_expense_types TEXT[], -- ['maintenance', 'fuel', 'capital']
  requires_approval BOOLEAN DEFAULT FALSE,
  approval_threshold DECIMAL(15,2),

  -- GL Integration
  gl_account VARCHAR(50),
  gl_fund_code VARCHAR(50),

  -- Management
  fund_manager_id UUID REFERENCES users(id),

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_closed BOOLEAN DEFAULT FALSE,
  close_date DATE,

  -- Rollover
  allow_rollover BOOLEAN DEFAULT FALSE,
  rollover_to_fund_id UUID REFERENCES funds(id),

  -- Alerts
  alert_threshold_percentage DECIMAL(5,2) DEFAULT 90.00,
  alert_recipients TEXT[],

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),

  CONSTRAINT unique_fund_code_per_tenant_year UNIQUE (tenant_id, fund_code, fiscal_year),
  CONSTRAINT check_fund_dates CHECK (end_date > start_date),
  CONSTRAINT check_fund_budget_positive CHECK (total_budget >= 0),
  CONSTRAINT check_fund_allocations CHECK (allocated_budget >= 0 AND encumbered_amount >= 0 AND spent_to_date >= 0)
);

CREATE INDEX idx_funds_tenant_id ON funds(tenant_id);
CREATE INDEX idx_funds_fiscal_year ON funds(fiscal_year);
CREATE INDEX idx_funds_fund_type ON funds(fund_type);
CREATE INDEX idx_funds_is_active ON funds(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_funds_fund_manager_id ON funds(fund_manager_id);
CREATE INDEX idx_funds_available_balance ON funds((total_budget - allocated_budget - encumbered_amount - spent_to_date));

COMMENT ON TABLE funds IS 'Budget funds for cost allocation and tracking';
COMMENT ON COLUMN funds.encumbered_amount IS 'Amount committed but not yet spent (e.g., open POs)';
COMMENT ON COLUMN funds.available_balance IS 'Auto-calculated remaining budget';

-- ============================================================================
-- BUSINESS AREA - DEPARTMENT MANY-TO-MANY
-- ============================================================================

CREATE TABLE business_area_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_area_id UUID NOT NULL REFERENCES business_areas(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,

  is_primary BOOLEAN DEFAULT FALSE,
  allocation_percentage DECIMAL(5,2) DEFAULT 100.00,

  effective_date DATE DEFAULT CURRENT_DATE,
  termination_date DATE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),

  CONSTRAINT unique_business_area_department UNIQUE (business_area_id, department_id),
  CONSTRAINT check_allocation_percentage CHECK (allocation_percentage >= 0 AND allocation_percentage <= 100),
  CONSTRAINT check_bad_termination CHECK (termination_date IS NULL OR termination_date > effective_date)
);

CREATE INDEX idx_business_area_departments_business_area_id ON business_area_departments(business_area_id);
CREATE INDEX idx_business_area_departments_department_id ON business_area_departments(department_id);
CREATE INDEX idx_business_area_departments_is_primary ON business_area_departments(department_id, is_primary) WHERE is_primary = TRUE;

COMMENT ON TABLE business_area_departments IS 'Many-to-many relationship allowing departments to serve multiple business areas';
COMMENT ON COLUMN business_area_departments.allocation_percentage IS 'Percentage of department costs allocated to this business area';

-- ============================================================================
-- ADD FOREIGN KEY TO DEPARTMENTS NOW THAT FUNDS TABLE EXISTS
-- ============================================================================

ALTER TABLE departments
  ADD CONSTRAINT fk_departments_fund_id
  FOREIGN KEY (fund_id) REFERENCES funds(id) ON DELETE SET NULL;

ALTER TABLE business_areas
  ADD CONSTRAINT fk_business_areas_default_fund_id
  FOREIGN KEY (default_fund_id) REFERENCES funds(id) ON DELETE SET NULL;

-- ============================================================================
-- UPDATE EXISTING TABLES
-- ============================================================================

-- Add organizational references to vehicles
ALTER TABLE vehicles
  ADD COLUMN department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  ADD COLUMN business_area_id UUID REFERENCES business_areas(id) ON DELETE SET NULL,
  ADD COLUMN assigned_cost_center VARCHAR(50),
  ADD COLUMN assignment_effective_date DATE,
  ADD COLUMN assignment_notes TEXT;

CREATE INDEX idx_vehicles_department_id ON vehicles(department_id);
CREATE INDEX idx_vehicles_business_area_id ON vehicles(business_area_id);
CREATE INDEX idx_vehicles_assigned_cost_center ON vehicles(assigned_cost_center);

COMMENT ON COLUMN vehicles.department_id IS 'Primary department responsible for this vehicle';
COMMENT ON COLUMN vehicles.business_area_id IS 'Business area for cost allocation';

-- Add organizational references to users/employees
ALTER TABLE users
  ADD COLUMN department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  ADD COLUMN division_id UUID REFERENCES divisions(id) ON DELETE SET NULL,
  ADD COLUMN employee_id VARCHAR(50),
  ADD COLUMN position_number VARCHAR(50),
  ADD COLUMN position_title VARCHAR(255),
  ADD COLUMN employment_date DATE,
  ADD COLUMN supervisor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN employee_type VARCHAR(50) CHECK (employee_type IN ('full_time', 'part_time', 'contractor', 'temp', 'intern'));

CREATE INDEX idx_users_department_id ON users(department_id);
CREATE INDEX idx_users_division_id ON users(division_id);
CREATE INDEX idx_users_employee_id ON users(employee_id);
CREATE INDEX idx_users_supervisor_id ON users(supervisor_id);

COMMENT ON COLUMN users.employee_id IS 'External HR system employee ID';
COMMENT ON COLUMN users.supervisor_id IS 'Direct supervisor for approval workflows';

-- Add organizational references to work orders
ALTER TABLE work_orders
  ADD COLUMN department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  ADD COLUMN business_area_id UUID REFERENCES business_areas(id) ON DELETE SET NULL,
  ADD COLUMN fund_id UUID REFERENCES funds(id) ON DELETE SET NULL,
  ADD COLUMN cost_center VARCHAR(50),
  ADD COLUMN project_code VARCHAR(100),
  ADD COLUMN requires_approval BOOLEAN DEFAULT FALSE,
  ADD COLUMN approved_by UUID REFERENCES users(id),
  ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX idx_work_orders_department_id ON work_orders(department_id);
CREATE INDEX idx_work_orders_business_area_id ON work_orders(business_area_id);
CREATE INDEX idx_work_orders_fund_id ON work_orders(fund_id);
CREATE INDEX idx_work_orders_project_code ON work_orders(project_code);

-- Add organizational references to fuel transactions
ALTER TABLE fuel_transactions
  ADD COLUMN department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  ADD COLUMN business_area_id UUID REFERENCES business_areas(id) ON DELETE SET NULL,
  ADD COLUMN fund_id UUID REFERENCES funds(id) ON DELETE SET NULL,
  ADD COLUMN cost_center VARCHAR(50),
  ADD COLUMN project_code VARCHAR(100);

CREATE INDEX idx_fuel_transactions_department_id ON fuel_transactions(department_id);
CREATE INDEX idx_fuel_transactions_business_area_id ON fuel_transactions(business_area_id);
CREATE INDEX idx_fuel_transactions_fund_id ON fuel_transactions(fund_id);

-- Add organizational references to facilities
ALTER TABLE facilities
  ADD COLUMN department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  ADD COLUMN business_area_id UUID REFERENCES business_areas(id) ON DELETE SET NULL,
  ADD COLUMN cost_center VARCHAR(50);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC ORGANIZATIONAL ASSIGNMENT
-- ============================================================================

-- Function to automatically assign organization from vehicle to transactions
CREATE OR REPLACE FUNCTION assign_organization_from_vehicle()
RETURNS TRIGGER AS $$
BEGIN
  -- If no department/business area specified, inherit from vehicle
  IF NEW.vehicle_id IS NOT NULL THEN
    IF NEW.department_id IS NULL OR NEW.business_area_id IS NULL THEN
      SELECT
        COALESCE(NEW.department_id, v.department_id),
        COALESCE(NEW.business_area_id, v.business_area_id),
        COALESCE(NEW.cost_center, v.assigned_cost_center)
      INTO NEW.department_id, NEW.business_area_id, NEW.cost_center
      FROM vehicles v
      WHERE v.id = NEW.vehicle_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to work orders
CREATE TRIGGER trigger_assign_org_to_work_orders
  BEFORE INSERT ON work_orders
  FOR EACH ROW
  EXECUTE FUNCTION assign_organization_from_vehicle();

-- Apply to fuel transactions
CREATE TRIGGER trigger_assign_org_to_fuel_transactions
  BEFORE INSERT ON fuel_transactions
  FOR EACH ROW
  EXECUTE FUNCTION assign_organization_from_vehicle();

-- ============================================================================
-- FUNCTIONS FOR ORGANIZATIONAL QUERIES
-- ============================================================================

-- Get all descendant departments for a business area (recursive)
CREATE OR REPLACE FUNCTION get_business_area_departments(p_business_area_id UUID)
RETURNS TABLE (department_id UUID, department_name VARCHAR, depth INTEGER) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE dept_tree AS (
    -- Base case: direct departments
    SELECT
      d.id,
      d.department_name,
      1 as depth
    FROM departments d
    JOIN business_area_departments bad ON d.id = bad.department_id
    WHERE bad.business_area_id = p_business_area_id

    UNION ALL

    -- Recursive case: child departments
    SELECT
      d.id,
      d.department_name,
      dt.depth + 1
    FROM departments d
    JOIN dept_tree dt ON d.parent_department_id = dt.id
  )
  SELECT id, department_name, depth FROM dept_tree
  ORDER BY depth, department_name;
END;
$$ LANGUAGE plpgsql;

-- Get organizational hierarchy path for a department
CREATE OR REPLACE FUNCTION get_department_hierarchy_path(p_department_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_path TEXT;
BEGIN
  WITH RECURSIVE dept_path AS (
    -- Start with the specified department
    SELECT
      d.id,
      d.department_name,
      d.parent_department_id,
      d.department_name::TEXT as path,
      1 as level
    FROM departments d
    WHERE d.id = p_department_id

    UNION ALL

    -- Recursively get parent departments
    SELECT
      d.id,
      d.department_name,
      d.parent_department_id,
      d.department_name || ' > ' || dp.path,
      dp.level + 1
    FROM departments d
    JOIN dept_path dp ON d.id = dp.parent_department_id
  )
  SELECT path INTO v_path
  FROM dept_path
  ORDER BY level DESC
  LIMIT 1;

  RETURN v_path;
END;
$$ LANGUAGE plpgsql;

-- Check if user has permission to access department data
CREATE OR REPLACE FUNCTION user_has_department_access(
  p_user_id UUID,
  p_department_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_department_id UUID;
  v_user_role VARCHAR(50);
  v_is_supervisor BOOLEAN;
BEGIN
  -- Get user's department and role
  SELECT department_id, role
  INTO v_user_department_id, v_user_role
  FROM users
  WHERE id = p_user_id;

  -- Admins have access to all departments
  IF v_user_role = 'admin' THEN
    RETURN TRUE;
  END IF;

  -- Users have access to their own department
  IF v_user_department_id = p_department_id THEN
    RETURN TRUE;
  END IF;

  -- Check if user is a supervisor of someone in this department
  SELECT EXISTS (
    SELECT 1
    FROM users
    WHERE department_id = p_department_id
      AND supervisor_id = p_user_id
  ) INTO v_is_supervisor;

  IF v_is_supervisor THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Organizational hierarchy view
CREATE OR REPLACE VIEW v_organizational_hierarchy AS
SELECT
  ba.id as business_area_id,
  ba.business_area_code,
  ba.business_area_name,
  d.id as division_id,
  d.division_code,
  d.division_name,
  dept.id as department_id,
  dept.department_code,
  dept.department_name,
  dept.cost_center,
  f.id as fund_id,
  f.fund_code,
  f.fund_name,
  ba.status as business_area_status,
  d.status as division_status,
  dept.status as department_status,
  f.is_active as fund_is_active
FROM business_areas ba
LEFT JOIN divisions d ON d.business_area_id = ba.id
LEFT JOIN departments dept ON dept.division_id = d.id
LEFT JOIN funds f ON dept.fund_id = f.id
WHERE ba.status = 'active'
ORDER BY ba.business_area_code, d.division_code, dept.department_code;

-- Department summary with counts
CREATE OR REPLACE VIEW v_department_summary AS
SELECT
  d.id as department_id,
  d.department_code,
  d.department_name,
  d.cost_center,
  div.division_name,
  ba.business_area_name,
  f.fund_code,
  f.available_balance as fund_balance,

  -- Vehicle counts
  COUNT(DISTINCT v.id) as vehicle_count,
  COUNT(DISTINCT v.id) FILTER (WHERE v.status = 'active') as active_vehicle_count,

  -- Employee counts
  COUNT(DISTINCT u.id) as employee_count,
  COUNT(DISTINCT u.id) FILTER (WHERE u.is_active = TRUE) as active_employee_count,

  -- Manager info
  m.first_name || ' ' || m.last_name as manager_name,
  m.email as manager_email

FROM departments d
LEFT JOIN divisions div ON d.division_id = div.id
LEFT JOIN business_area_departments bad ON d.id = bad.department_id AND bad.is_primary = TRUE
LEFT JOIN business_areas ba ON bad.business_area_id = ba.id
LEFT JOIN funds f ON d.fund_id = f.id
LEFT JOIN vehicles v ON v.department_id = d.id
LEFT JOIN users u ON u.department_id = d.id
LEFT JOIN users m ON d.manager_id = m.id
WHERE d.status = 'active'
GROUP BY
  d.id, d.department_code, d.department_name, d.cost_center,
  div.division_name, ba.business_area_name, f.fund_code, f.available_balance,
  m.first_name, m.last_name, m.email;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE business_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_area_departments ENABLE ROW LEVEL SECURITY;

-- Business Areas Policy
CREATE POLICY tenant_isolation_business_areas ON business_areas
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Divisions Policy
CREATE POLICY tenant_isolation_divisions ON divisions
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Departments Policy
CREATE POLICY tenant_isolation_departments ON departments
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Funds Policy
CREATE POLICY tenant_isolation_funds ON funds
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- ============================================================================
-- SEED DATA FOR TESTING
-- ============================================================================

-- Function to create default organizational structure for new tenants
CREATE OR REPLACE FUNCTION create_default_org_structure(p_tenant_id UUID)
RETURNS VOID AS $$
DECLARE
  v_business_area_id UUID;
  v_division_id UUID;
  v_department_id UUID;
  v_fund_id UUID;
BEGIN
  -- Create default business area
  INSERT INTO business_areas (tenant_id, business_area_code, business_area_name, short_name)
  VALUES (p_tenant_id, 'DEFAULT', 'Default Business Area', 'Default')
  RETURNING id INTO v_business_area_id;

  -- Create default division
  INSERT INTO divisions (tenant_id, business_area_id, division_code, division_name, short_name)
  VALUES (p_tenant_id, v_business_area_id, 'OPS', 'Operations', 'Ops')
  RETURNING id INTO v_division_id;

  -- Create default operating fund
  INSERT INTO funds (
    tenant_id, fund_code, fund_name, fund_type, fiscal_year,
    total_budget, start_date, end_date
  )
  VALUES (
    p_tenant_id, 'OP-' || EXTRACT(YEAR FROM CURRENT_DATE)::TEXT,
    'Operating Fund ' || EXTRACT(YEAR FROM CURRENT_DATE)::TEXT,
    'operating', EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
    1000000.00,
    DATE_TRUNC('year', CURRENT_DATE)::DATE,
    (DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year - 1 day')::DATE
  )
  RETURNING id INTO v_fund_id;

  -- Create unassigned department
  INSERT INTO departments (
    tenant_id, division_id, fund_id, department_code,
    department_name, short_name, cost_center
  )
  VALUES (
    p_tenant_id, v_division_id, v_fund_id, 'UNASSIGNED',
    'Unassigned', 'Unassigned', 'CC-0000'
  )
  RETURNING id INTO v_department_id;

  -- Link business area to department
  INSERT INTO business_area_departments (business_area_id, department_id, is_primary)
  VALUES (v_business_area_id, v_department_id, TRUE);

  RAISE NOTICE 'Created default organizational structure for tenant %', p_tenant_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================

CREATE TRIGGER update_business_areas_updated_at BEFORE UPDATE ON business_areas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_divisions_updated_at BEFORE UPDATE ON divisions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_funds_updated_at BEFORE UPDATE ON funds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Assuming role 'fleet_user' exists
DO $$
DECLARE
  table_name text;
BEGIN
  FOR table_name IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN (
      'business_areas', 'divisions', 'departments', 'funds', 'business_area_departments'
    )
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE %I TO fleet_user', table_name);
  END LOOP;
END $$;
```

#### B. Backend API Implementation

**File:** `api/src/routes/organization.routes.ts`

```typescript
import express from 'express';
import { z } from 'zod';
import {
  getBusinessAreas,
  createBusinessArea,
  updateBusinessArea,
  deleteBusinessArea,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getFunds,
  createFund,
  getDivisions,
  createDivision,
  getOrganizationalHierarchy,
  assignVehicleToDepartment,
  bulkAssignVehicles,
  getDepartmentSummary,
  getFundUtilization
} from '../controllers/organization.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = express.Router();

// ============================================================================
// BUSINESS AREAS
// ============================================================================

// Schema validation
const businessAreaSchema = z.object({
  business_area_code: z.string().min(1).max(50),
  business_area_name: z.string().min(1).max(255),
  short_name: z.string().max(50).optional(),
  parent_business_area_id: z.string().uuid().optional(),
  manager_id: z.string().uuid().optional(),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().max(20).optional(),
  default_fund_id: z.string().uuid().optional(),
  cost_center: z.string().max(50).optional(),
  profit_center: z.string().max(50).optional(),
  display_metrics: z.boolean().optional(),
  allow_cross_charging: z.boolean().optional(),
  metadata: z.record(z.any()).optional()
});

/**
 * @route GET /api/v1/organization/business-areas
 * @desc Get all business areas for tenant
 * @access Private (fleet_manager, admin)
 */
router.get(
  '/business-areas',
  authenticate,
  authorize(['admin', 'fleet_manager']),
  getBusinessAreas
);

/**
 * @route POST /api/v1/organization/business-areas
 * @desc Create new business area
 * @access Private (admin)
 */
router.post(
  '/business-areas',
  authenticate,
  authorize(['admin']),
  validateRequest(businessAreaSchema),
  createBusinessArea
);

/**
 * @route PUT /api/v1/organization/business-areas/:id
 * @desc Update business area
 * @access Private (admin)
 */
router.put(
  '/business-areas/:id',
  authenticate,
  authorize(['admin']),
  validateRequest(businessAreaSchema.partial()),
  updateBusinessArea
);

/**
 * @route DELETE /api/v1/organization/business-areas/:id
 * @desc Delete business area (soft delete)
 * @access Private (admin)
 */
router.delete(
  '/business-areas/:id',
  authenticate,
  authorize(['admin']),
  deleteBusinessArea
);

// ============================================================================
// DIVISIONS
// ============================================================================

const divisionSchema = z.object({
  division_code: z.string().min(1).max(50),
  division_name: z.string().min(1).max(255),
  short_name: z.string().max(50).optional(),
  business_area_id: z.string().uuid(),
  parent_division_id: z.string().uuid().optional(),
  director_id: z.string().uuid().optional(),
  contact_email: z.string().email().optional(),
  budget_authority_limit: z.number().min(0).optional(),
  approval_required_above: z.number().min(0).optional(),
  primary_location: z.string().max(255).optional(),
  region: z.string().max(100).optional(),
  metadata: z.record(z.any()).optional()
});

router.get('/divisions', authenticate, getDivisions);
router.post('/divisions', authenticate, authorize(['admin']), validateRequest(divisionSchema), createDivision);

// ============================================================================
// DEPARTMENTS
// ============================================================================

const departmentSchema = z.object({
  department_code: z.string().min(1).max(50),
  department_name: z.string().min(1).max(255),
  short_name: z.string().max(50).optional(),
  division_id: z.string().uuid().optional(),
  parent_department_id: z.string().uuid().optional(),
  fund_id: z.string().uuid().optional(),
  cost_center: z.string().max(50).optional(),
  account_code: z.string().max(50).optional(),
  manager_id: z.string().uuid().optional(),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().max(20).optional(),
  monthly_budget: z.number().min(0).optional(),
  annual_budget: z.number().min(0).optional(),
  budget_fiscal_year: z.number().int().optional(),
  primary_facility_id: z.string().uuid().optional(),
  billing_frequency: z.enum(['weekly', 'biweekly', 'monthly', 'quarterly', 'annual']).optional(),
  billing_contact_email: z.string().email().optional(),
  po_required: z.boolean().optional(),
  default_po_number: z.string().max(100).optional(),
  metadata: z.record(z.any()).optional()
});

router.get('/departments', authenticate, getDepartments);
router.get('/departments/:id/summary', authenticate, getDepartmentSummary);
router.post('/departments', authenticate, authorize(['admin']), validateRequest(departmentSchema), createDepartment);
router.put('/departments/:id', authenticate, authorize(['admin']), validateRequest(departmentSchema.partial()), updateDepartment);
router.delete('/departments/:id', authenticate, authorize(['admin']), deleteDepartment);

// ============================================================================
// FUNDS
// ============================================================================

const fundSchema = z.object({
  fund_code: z.string().min(1).max(50),
  fund_name: z.string().min(1).max(255),
  fund_description: z.string().optional(),
  fund_type: z.enum(['operating', 'capital', 'grant', 'restricted', 'revolving', 'special']),
  fund_category: z.string().max(100).optional(),
  fiscal_year: z.number().int(),
  total_budget: z.number().min(0),
  start_date: z.string().date(),
  end_date: z.string().date(),
  is_restricted: z.boolean().optional(),
  allowed_expense_types: z.array(z.string()).optional(),
  requires_approval: z.boolean().optional(),
  approval_threshold: z.number().min(0).optional(),
  gl_account: z.string().max(50).optional(),
  gl_fund_code: z.string().max(50).optional(),
  fund_manager_id: z.string().uuid().optional(),
  allow_rollover: z.boolean().optional(),
  rollover_to_fund_id: z.string().uuid().optional(),
  alert_threshold_percentage: z.number().min(0).max(100).optional(),
  alert_recipients: z.array(z.string().email()).optional(),
  metadata: z.record(z.any()).optional()
});

router.get('/funds', authenticate, getFunds);
router.get('/funds/:id/utilization', authenticate, getFundUtilization);
router.post('/funds', authenticate, authorize(['admin']), validateRequest(fundSchema), createFund);

// ============================================================================
// HIERARCHY & REPORTING
// ============================================================================

/**
 * @route GET /api/v1/organization/hierarchy
 * @desc Get complete organizational hierarchy
 * @access Private
 */
router.get('/hierarchy', authenticate, getOrganizationalHierarchy);

/**
 * @route POST /api/v1/organization/vehicles/assign
 * @desc Assign vehicle to department
 * @access Private (fleet_manager, admin)
 */
const vehicleAssignmentSchema = z.object({
  vehicle_id: z.string().uuid(),
  department_id: z.string().uuid(),
  business_area_id: z.string().uuid().optional(),
  cost_center: z.string().max(50).optional(),
  effective_date: z.string().date().optional(),
  notes: z.string().optional()
});

router.post(
  '/vehicles/assign',
  authenticate,
  authorize(['admin', 'fleet_manager']),
  validateRequest(vehicleAssignmentSchema),
  assignVehicleToDepartment
);

/**
 * @route POST /api/v1/organization/vehicles/bulk-assign
 * @desc Bulk assign vehicles to department
 * @access Private (admin)
 */
const bulkAssignmentSchema = z.object({
  vehicle_ids: z.array(z.string().uuid()).min(1),
  department_id: z.string().uuid(),
  business_area_id: z.string().uuid().optional(),
  effective_date: z.string().date().optional()
});

router.post(
  '/vehicles/bulk-assign',
  authenticate,
  authorize(['admin']),
  validateRequest(bulkAssignmentSchema),
  bulkAssignVehicles
);

export default router;
```

**File:** `api/src/controllers/organization.controller.ts`

```typescript
import { Request, Response } from 'express';
import { pool } from '../config/database';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Get all business areas for tenant
 */
export const getBusinessAreas = async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.user;
    const { status, include_inactive } = req.query;

    let query = `
      SELECT
        ba.*,
        m.first_name || ' ' || m.last_name as manager_name,
        m.email as manager_email,
        f.fund_code as default_fund_code,
        COUNT(DISTINCT bad.department_id) as department_count
      FROM business_areas ba
      LEFT JOIN users m ON ba.manager_id = m.id
      LEFT JOIN funds f ON ba.default_fund_id = f.id
      LEFT JOIN business_area_departments bad ON ba.id = bad.business_area_id
      WHERE ba.tenant_id = $1
    `;

    const params: any[] = [tenant_id];

    if (status) {
      query += ` AND ba.status = $2`;
      params.push(status);
    } else if (!include_inactive) {
      query += ` AND ba.status = 'active'`;
    }

    query += `
      GROUP BY ba.id, m.first_name, m.last_name, m.email, f.fund_code
      ORDER BY ba.business_area_code
    `;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    logger.error('Error fetching business areas:', error);
    throw new AppError('Failed to fetch business areas', 500);
  }
};

/**
 * Create new business area
 */
export const createBusinessArea = async (req: Request, res: Response) => {
  try {
    const { tenant_id, user_id } = req.user;
    const businessAreaData = req.body;

    // Check for duplicate code
    const duplicateCheck = await pool.query(
      'SELECT id FROM business_areas WHERE tenant_id = $1 AND business_area_code = $2',
      [tenant_id, businessAreaData.business_area_code]
    );

    if (duplicateCheck.rows.length > 0) {
      throw new AppError('Business area code already exists', 400);
    }

    const result = await pool.query(
      `INSERT INTO business_areas (
        tenant_id, business_area_code, business_area_name, short_name,
        parent_business_area_id, manager_id, contact_email, contact_phone,
        default_fund_id, cost_center, profit_center, display_metrics,
        allow_cross_charging, metadata, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $15)
      RETURNING *`,
      [
        tenant_id,
        businessAreaData.business_area_code,
        businessAreaData.business_area_name,
        businessAreaData.short_name,
        businessAreaData.parent_business_area_id,
        businessAreaData.manager_id,
        businessAreaData.contact_email,
        businessAreaData.contact_phone,
        businessAreaData.default_fund_id,
        businessAreaData.cost_center,
        businessAreaData.profit_center,
        businessAreaData.display_metrics ?? true,
        businessAreaData.allow_cross_charging ?? false,
        JSON.stringify(businessAreaData.metadata || {}),
        user_id
      ]
    );

    logger.info(`Business area created: ${result.rows[0].id} by user ${user_id}`);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Business area created successfully'
    });
  } catch (error) {
    logger.error('Error creating business area:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to create business area', 500);
  }
};

/**
 * Get all departments with summary information
 */
export const getDepartments = async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.user;
    const { division_id, business_area_id, status, search } = req.query;

    let query = `
      SELECT
        d.*,
        div.division_name,
        div.division_code,
        ba.business_area_name,
        ba.business_area_code,
        f.fund_code,
        f.fund_name,
        f.available_balance as fund_balance,
        m.first_name || ' ' || m.last_name as manager_name,
        m.email as manager_email,
        COUNT(DISTINCT v.id) as vehicle_count,
        COUNT(DISTINCT u.id) as employee_count
      FROM departments d
      LEFT JOIN divisions div ON d.division_id = div.id
      LEFT JOIN business_area_departments bad ON d.id = bad.department_id AND bad.is_primary = TRUE
      LEFT JOIN business_areas ba ON bad.business_area_id = ba.id
      LEFT JOIN funds f ON d.fund_id = f.id
      LEFT JOIN users m ON d.manager_id = m.id
      LEFT JOIN vehicles v ON v.department_id = d.id
      LEFT JOIN users u ON u.department_id = d.id AND u.is_active = TRUE
      WHERE d.tenant_id = $1
    `;

    const params: any[] = [tenant_id];
    let paramIndex = 2;

    if (division_id) {
      query += ` AND d.division_id = $${paramIndex}`;
      params.push(division_id);
      paramIndex++;
    }

    if (business_area_id) {
      query += ` AND bad.business_area_id = $${paramIndex}`;
      params.push(business_area_id);
      paramIndex++;
    }

    if (status) {
      query += ` AND d.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    } else {
      query += ` AND d.status = 'active'`;
    }

    if (search) {
      query += ` AND (
        d.department_name ILIKE $${paramIndex} OR
        d.department_code ILIKE $${paramIndex} OR
        d.cost_center ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += `
      GROUP BY d.id, div.division_name, div.division_code, ba.business_area_name,
               ba.business_area_code, f.fund_code, f.fund_name, f.available_balance,
               m.first_name, m.last_name, m.email
      ORDER BY d.department_code
    `;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    logger.error('Error fetching departments:', error);
    throw new AppError('Failed to fetch departments', 500);
  }
};

/**
 * Create new department
 */
export const createDepartment = async (req: Request, res: Response) => {
  try {
    const { tenant_id, user_id } = req.user;
    const deptData = req.body;

    // Check for duplicate code or cost center
    const duplicateCheck = await pool.query(
      `SELECT id FROM departments
       WHERE tenant_id = $1
       AND (department_code = $2 OR (cost_center = $3 AND cost_center IS NOT NULL))`,
      [tenant_id, deptData.department_code, deptData.cost_center]
    );

    if (duplicateCheck.rows.length > 0) {
      throw new AppError('Department code or cost center already exists', 400);
    }

    const result = await pool.query(
      `INSERT INTO departments (
        tenant_id, division_id, parent_department_id, department_code,
        department_name, short_name, fund_id, cost_center, account_code,
        manager_id, contact_email, contact_phone, monthly_budget, annual_budget,
        budget_fiscal_year, primary_facility_id, billing_frequency,
        billing_contact_email, po_required, default_po_number, metadata,
        created_by, updated_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $22
      ) RETURNING *`,
      [
        tenant_id,
        deptData.division_id,
        deptData.parent_department_id,
        deptData.department_code,
        deptData.department_name,
        deptData.short_name,
        deptData.fund_id,
        deptData.cost_center,
        deptData.account_code,
        deptData.manager_id,
        deptData.contact_email,
        deptData.contact_phone,
        deptData.monthly_budget,
        deptData.annual_budget,
        deptData.budget_fiscal_year,
        deptData.primary_facility_id,
        deptData.billing_frequency || 'monthly',
        deptData.billing_contact_email,
        deptData.po_required ?? false,
        deptData.default_po_number,
        JSON.stringify(deptData.metadata || {}),
        user_id
      ]
    );

    logger.info(`Department created: ${result.rows[0].id} by user ${user_id}`);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Department created successfully'
    });
  } catch (error) {
    logger.error('Error creating department:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to create department', 500);
  }
};

/**
 * Get organizational hierarchy
 */
export const getOrganizationalHierarchy = async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.user;

    const query = `
      WITH RECURSIVE org_tree AS (
        -- Business Areas
        SELECT
          ba.id,
          ba.business_area_code as code,
          ba.business_area_name as name,
          'business_area' as type,
          NULL::UUID as parent_id,
          0 as level,
          ARRAY[ba.id] as path
        FROM business_areas ba
        WHERE ba.tenant_id = $1 AND ba.parent_business_area_id IS NULL AND ba.status = 'active'

        UNION ALL

        -- Child Business Areas
        SELECT
          ba.id,
          ba.business_area_code,
          ba.business_area_name,
          'business_area',
          ba.parent_business_area_id,
          ot.level + 1,
          ot.path || ba.id
        FROM business_areas ba
        JOIN org_tree ot ON ba.parent_business_area_id = ot.id
        WHERE ba.tenant_id = $1 AND ba.status = 'active'

        UNION ALL

        -- Divisions
        SELECT
          d.id,
          d.division_code,
          d.division_name,
          'division',
          d.business_area_id,
          ot.level + 1,
          ot.path || d.id
        FROM divisions d
        JOIN org_tree ot ON d.business_area_id = ot.id
        WHERE d.tenant_id = $1 AND ot.type = 'business_area' AND d.status = 'active'

        UNION ALL

        -- Departments
        SELECT
          dept.id,
          dept.department_code,
          dept.department_name,
          'department',
          dept.division_id,
          ot.level + 1,
          ot.path || dept.id
        FROM departments dept
        JOIN org_tree ot ON dept.division_id = ot.id
        WHERE dept.tenant_id = $1 AND ot.type = 'division' AND dept.status = 'active'
      )
      SELECT
        id,
        code,
        name,
        type,
        parent_id,
        level,
        path
      FROM org_tree
      ORDER BY path;
    `;

    const result = await pool.query(query, [tenant_id]);

    // Transform flat list into hierarchical tree
    const buildTree = (items: any[], parentId: string | null = null): any[] => {
      return items
        .filter(item => item.parent_id === parentId)
        .map(item => ({
          ...item,
          children: buildTree(items, item.id)
        }));
    };

    const tree = buildTree(result.rows);

    res.json({
      success: true,
      data: tree
    });
  } catch (error) {
    logger.error('Error fetching organizational hierarchy:', error);
    throw new AppError('Failed to fetch organizational hierarchy', 500);
  }
};

/**
 * Assign vehicle to department
 */
export const assignVehicleToDepartment = async (req: Request, res: Response) => {
  try {
    const { tenant_id, user_id } = req.user;
    const { vehicle_id, department_id, business_area_id, cost_center, effective_date, notes } = req.body;

    // Verify vehicle belongs to tenant
    const vehicleCheck = await pool.query(
      'SELECT id FROM vehicles WHERE id = $1 AND tenant_id = $2',
      [vehicle_id, tenant_id]
    );

    if (vehicleCheck.rows.length === 0) {
      throw new AppError('Vehicle not found', 404);
    }

    // Verify department belongs to tenant
    const deptCheck = await pool.query(
      'SELECT id, cost_center FROM departments WHERE id = $1 AND tenant_id = $2',
      [department_id, tenant_id]
    );

    if (deptCheck.rows.length === 0) {
      throw new AppError('Department not found', 404);
    }

    // Update vehicle assignment
    const result = await pool.query(
      `UPDATE vehicles
       SET
         department_id = $1,
         business_area_id = $2,
         assigned_cost_center = $3,
         assignment_effective_date = $4,
         assignment_notes = $5,
         updated_at = NOW()
       WHERE id = $6 AND tenant_id = $7
       RETURNING *`,
      [
        department_id,
        business_area_id,
        cost_center || deptCheck.rows[0].cost_center,
        effective_date || new Date(),
        notes,
        vehicle_id,
        tenant_id
      ]
    );

    logger.info(`Vehicle ${vehicle_id} assigned to department ${department_id} by user ${user_id}`);

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Vehicle assigned to department successfully'
    });
  } catch (error) {
    logger.error('Error assigning vehicle to department:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to assign vehicle to department', 500);
  }
};

/**
 * Bulk assign vehicles to department
 */
export const bulkAssignVehicles = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    const { tenant_id, user_id } = req.user;
    const { vehicle_ids, department_id, business_area_id, effective_date } = req.body;

    await client.query('BEGIN');

    // Verify department
    const deptCheck = await client.query(
      'SELECT id, cost_center FROM departments WHERE id = $1 AND tenant_id = $2',
      [department_id, tenant_id]
    );

    if (deptCheck.rows.length === 0) {
      throw new AppError('Department not found', 404);
    }

    const cost_center = deptCheck.rows[0].cost_center;

    // Update all vehicles
    const result = await client.query(
      `UPDATE vehicles
       SET
         department_id = $1,
         business_area_id = $2,
         assigned_cost_center = $3,
         assignment_effective_date = $4,
         updated_at = NOW()
       WHERE id = ANY($5::uuid[]) AND tenant_id = $6
       RETURNING id, vin, make, model`,
      [
        department_id,
        business_area_id,
        cost_center,
        effective_date || new Date(),
        vehicle_ids,
        tenant_id
      ]
    );

    await client.query('COMMIT');

    logger.info(`${result.rows.length} vehicles bulk assigned to department ${department_id} by user ${user_id}`);

    res.json({
      success: true,
      data: {
        updated_count: result.rows.length,
        vehicles: result.rows
      },
      message: `${result.rows.length} vehicles assigned successfully`
    });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error in bulk vehicle assignment:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to bulk assign vehicles', 500);
  } finally {
    client.release();
  }
};

// Additional controller methods would continue...
export const updateBusinessArea = async (req: Request, res: Response) => { /* ... */ };
export const deleteBusinessArea = async (req: Request, res: Response) => { /* ... */ };
export const getDivisions = async (req: Request, res: Response) => { /* ... */ };
export const createDivision = async (req: Request, res: Response) => { /* ... */ };
export const updateDepartment = async (req: Request, res: Response) => { /* ... */ };
export const deleteDepartment = async (req: Request, res: Response) => { /* ... */ };
export const getFunds = async (req: Request, res: Response) => { /* ... */ };
export const createFund = async (req: Request, res: Response) => { /* ... */ };
export const getDepartmentSummary = async (req: Request, res: Response) => { /* ... */ };
export const getFundUtilization = async (req: Request, res: Response) => { /* ... */ };
```

#### C. Frontend Implementation

**Component Library Structure:**

```
src/components/organization/
├── BusinessAreaCard.tsx
├── BusinessAreaForm.tsx
├── BusinessAreaList.tsx
├── DepartmentCard.tsx
├── DepartmentForm.tsx
├── DepartmentList.tsx
├── DepartmentSelector.tsx
├── DivisionCard.tsx
├── DivisionForm.tsx
├── FundCard.tsx
├── FundForm.tsx
├── FundUtilizationGauge.tsx
├── OrganizationTreeView.tsx
└── VehicleAssignmentModal.tsx

src/pages/admin/
├── OrganizationStructure.tsx
├── BusinessAreasPage.tsx
├── DepartmentsPage.tsx
├── DivisionsPage.tsx
└── FundsPage.tsx

src/hooks/
├── useBusinessAreas.ts
├── useDepartments.ts
├── useDivisions.ts
├── useFunds.ts
└── useOrganizationHierarchy.ts
```

**File:** `src/components/organization/OrganizationTreeView.tsx`

```typescript
import React, { useState } from 'react';
import { useOrganizationHierarchy } from '@/hooks/useOrganizationHierarchy';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  BuildingOfficeIcon,
  BuildingLibraryIcon,
  UserGroupIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';

interface OrgNode {
  id: string;
  code: string;
  name: string;
  type: 'business_area' | 'division' | 'department';
  children?: OrgNode[];
}

interface TreeNodeProps {
  node: OrgNode;
  level: number;
  onSelect: (node: OrgNode) => void;
  selectedId?: string;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, level, onSelect, selectedId }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);

  const getIcon = () => {
    switch (node.type) {
      case 'business_area':
        return <BuildingOfficeIcon className="h-5 w-5 text-blue-500" />;
      case 'division':
        return <BuildingLibraryIcon className="h-5 w-5 text-green-500" />;
      case 'department':
        return <UserGroupIcon className="h-5 w-5 text-purple-500" />;
      default:
        return null;
    }
  };

  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;

  return (
    <div className="select-none">
      <div
        className={`flex items-center py-2 px-3 hover:bg-gray-50 cursor-pointer rounded-md transition-colors ${
          isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
        }`}
        style={{ paddingLeft: `${level * 20 + 12}px` }}
        onClick={() => onSelect(node)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="mr-2"
          >
            {isExpanded ? (
              <ChevronDownIcon className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRightIcon className="h-4 w-4 text-gray-500" />
            )}
          </button>
        ) : (
          <div className="w-4 mr-2" />
        )}

        <div className="mr-3">{getIcon()}</div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{node.name}</span>
            <span className="text-xs text-gray-500 font-mono">{node.code}</span>
          </div>
        </div>
      </div>

      {isExpanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const OrganizationTreeView: React.FC<{
  onSelect?: (node: OrgNode) => void;
}> = ({ onSelect }) => {
  const { data: hierarchy, isLoading, error } = useOrganizationHierarchy();
  const [selectedId, setSelectedId] = useState<string>();

  const handleSelect = (node: OrgNode) => {
    setSelectedId(node.id);
    onSelect?.(node);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-200 rounded" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 p-4 bg-red-50 rounded-md">
        Error loading organizational structure
      </div>
    );
  }

  if (!hierarchy || hierarchy.length === 0) {
    return (
      <div className="text-gray-500 p-4 bg-gray-50 rounded-md text-center">
        No organizational structure defined
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Organization Structure</h3>
      </div>
      <div className="p-2 max-h-[600px] overflow-y-auto">
        {hierarchy.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            level={0}
            onSelect={handleSelect}
            selectedId={selectedId}
          />
        ))}
      </div>
    </div>
  );
};
```

**File:** `src/components/organization/DepartmentSelector.tsx`

```typescript
import React from 'react';
import { useDepartments } from '@/hooks/useDepartments';
import Select from 'react-select';

interface DepartmentSelectorProps {
  value?: string;
  onChange: (departmentId: string | null) => void;
  divisionId?: string;
  businessAreaId?: string;
  placeholder?: string;
  isClearable?: boolean;
  isDisabled?: boolean;
  className?: string;
}

export const DepartmentSelector: React.FC<DepartmentSelectorProps> = ({
  value,
  onChange,
  divisionId,
  businessAreaId,
  placeholder = 'Select department...',
  isClearable = true,
  isDisabled = false,
  className = ''
}) => {
  const { data: departments, isLoading } = useDepartments({
    division_id: divisionId,
    business_area_id: businessAreaId,
    status: 'active'
  });

  const options = departments?.map(dept => ({
    value: dept.id,
    label: `${dept.department_name} (${dept.department_code})`,
    data: dept
  })) || [];

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <Select
      className={className}
      value={selectedOption}
      onChange={(option) => onChange(option?.value || null)}
      options={options}
      placeholder={placeholder}
      isClearable={isClearable}
      isDisabled={isDisabled}
      isLoading={isLoading}
      styles={{
        control: (base) => ({
          ...base,
          minHeight: '38px',
        }),
      }}
      formatOptionLabel={(option) => (
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">{option.data.department_name}</div>
            <div className="text-xs text-gray-500">
              {option.data.cost_center && `Cost Center: ${option.data.cost_center}`}
            </div>
          </div>
          <div className="text-xs text-gray-400">
            {option.data.vehicle_count} vehicles
          </div>
        </div>
      )}
    />
  );
};
```

**File:** `src/pages/admin/OrganizationStructure.tsx`

```typescript
import React, { useState } from 'react';
import { OrganizationTreeView } from '@/components/organization/OrganizationTreeView';
import { BusinessAreaForm } from '@/components/organization/BusinessAreaForm';
import { DepartmentForm } from '@/components/organization/DepartmentForm';
import { DivisionForm } from '@/components/organization/DivisionForm';
import { FundForm } from '@/components/organization/FundForm';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Tab } from '@headlessui/react';

export const OrganizationStructure: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formType, setFormType] = useState<'business_area' | 'division' | 'department' | 'fund'>('department');

  const openForm = (type: typeof formType) => {
    setFormType(type);
    setIsFormOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Organization Structure</h1>
          <p className="mt-2 text-gray-600">
            Manage your organizational hierarchy, departments, and budget funds
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tree View */}
          <div className="lg:col-span-1">
            <div className="mb-4 flex gap-2">
              <button
                onClick={() => openForm('business_area')}
                className="flex-1 btn btn-secondary text-sm"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Business Area
              </button>
              <button
                onClick={() => openForm('division')}
                className="flex-1 btn btn-secondary text-sm"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Division
              </button>
            </div>
            <div className="mb-4 flex gap-2">
              <button
                onClick={() => openForm('department')}
                className="flex-1 btn btn-primary text-sm"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Department
              </button>
              <button
                onClick={() => openForm('fund')}
                className="flex-1 btn btn-secondary text-sm"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Fund
              </button>
            </div>
            <OrganizationTreeView onSelect={setSelectedNode} />
          </div>

          {/* Details Panel */}
          <div className="lg:col-span-2">
            {selectedNode ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <Tab.Group>
                  <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1 mb-6">
                    <Tab className={({ selected }) =>
                      `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                       ${selected ? 'bg-white shadow text-blue-700' : 'text-gray-700 hover:bg-white/[0.12] hover:text-gray-900'}`
                    }>
                      Overview
                    </Tab>
                    <Tab className={({ selected }) =>
                      `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                       ${selected ? 'bg-white shadow text-blue-700' : 'text-gray-700 hover:bg-white/[0.12] hover:text-gray-900'}`
                    }>
                      Vehicles
                    </Tab>
                    <Tab className={({ selected }) =>
                      `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                       ${selected ? 'bg-white shadow text-blue-700' : 'text-gray-700 hover:bg-white/[0.12] hover:text-gray-900'}`
                    }>
                      Employees
                    </Tab>
                    <Tab className={({ selected }) =>
                      `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                       ${selected ? 'bg-white shadow text-blue-700' : 'text-gray-700 hover:bg-white/[0.12] hover:text-gray-900'}`
                    }>
                      Budget
                    </Tab>
                  </Tab.List>
                  <Tab.Panels>
                    <Tab.Panel>
                      {/* Overview content */}
                      <div className="space-y-4">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">{selectedNode.name}</h2>
                          <p className="text-gray-500 font-mono">{selectedNode.code}</p>
                        </div>
                        {/* Additional overview details */}
                      </div>
                    </Tab.Panel>
                    <Tab.Panel>
                      {/* Vehicles list */}
                    </Tab.Panel>
                    <Tab.Panel>
                      {/* Employees list */}
                    </Tab.Panel>
                    <Tab.Panel>
                      {/* Budget information */}
                    </Tab.Panel>
                  </Tab.Panels>
                </Tab.Group>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <p className="text-gray-500">Select an item from the tree to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Forms Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {formType === 'business_area' && (
              <BusinessAreaForm onClose={() => setIsFormOpen(false)} />
            )}
            {formType === 'division' && (
              <DivisionForm onClose={() => setIsFormOpen(false)} />
            )}
            {formType === 'department' && (
              <DepartmentForm onClose={() => setIsFormOpen(false)} />
            )}
            {formType === 'fund' && (
              <FundForm onClose={() => setIsFormOpen(false)} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
```

#### D. React Hooks for Data Fetching

**File:** `src/hooks/useOrganizationHierarchy.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export const useOrganizationHierarchy = () => {
  return useQuery({
    queryKey: ['organization', 'hierarchy'],
    queryFn: async () => {
      const response = await api.get('/organization/hierarchy');
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
```

**File:** `src/hooks/useDepartments.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';

interface DepartmentFilters {
  division_id?: string;
  business_area_id?: string;
  status?: string;
  search?: string;
}

export const useDepartments = (filters?: DepartmentFilters) => {
  return useQuery({
    queryKey: ['departments', filters],
    queryFn: async () => {
      const response = await api.get('/organization/departments', { params: filters });
      return response.data.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/organization/departments', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['organization', 'hierarchy'] });
    },
  });
};

export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put(`/organization/departments/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['organization', 'hierarchy'] });
    },
  });
};
```

---

### Testing Requirements

#### Unit Tests

**File:** `api/src/controllers/__tests__/organization.controller.test.ts`

```typescript
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response } from 'express';
import { getBusinessAreas, createDepartment } from '../organization.controller';
import { pool } from '../../config/database';

jest.mock('../../config/database');

describe('Organization Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });

    mockResponse = {
      json: mockJson,
      status: mockStatus,
    };

    mockRequest = {
      user: {
        tenant_id: '00000000-0000-0000-0000-000000000001',
        user_id: '00000000-0000-0000-0000-000000000002',
        role: 'admin'
      },
      query: {},
      body: {}
    };
  });

  describe('getBusinessAreas', () => {
    it('should return all active business areas for tenant', async () => {
      const mockBusinessAreas = [
        {
          id: '11111111-1111-1111-1111-111111111111',
          business_area_code: 'BA1',
          business_area_name: 'Business Area 1',
          status: 'active'
        }
      ];

      (pool.query as jest.Mock).mockResolvedValue({
        rows: mockBusinessAreas
      });

      await getBusinessAreas(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockBusinessAreas,
        count: 1
      });
    });

    it('should filter by status if provided', async () => {
      mockRequest.query = { status: 'inactive' };

      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      await getBusinessAreas(mockRequest as Request, mockResponse as Response);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('ba.status = $2'),
        expect.arrayContaining(['inactive'])
      );
    });
  });

  describe('createDepartment', () => {
    it('should create new department successfully', async () => {
      const departmentData = {
        department_code: 'DEPT1',
        department_name: 'Department 1',
        cost_center: 'CC-1001'
      };

      mockRequest.body = departmentData;

      // Mock duplicate check
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] }) // No duplicates
        .mockResolvedValueOnce({ // Create department
          rows: [{
            id: '22222222-2222-2222-2222-222222222222',
            ...departmentData
          }]
        });

      await createDepartment(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining(departmentData),
        message: 'Department created successfully'
      });
    });

    it('should reject duplicate department code', async () => {
      mockRequest.body = {
        department_code: 'DEPT1',
        department_name: 'Department 1'
      };

      // Mock duplicate found
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [{ id: '33333333-3333-3333-3333-333333333333' }]
      });

      await expect(
        createDepartment(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow('Department code or cost center already exists');
    });
  });
});
```

#### Integration Tests

**File:** `api/src/__tests__/integration/organization.integration.test.ts`

```typescript
import request from 'supertest';
import app from '../../app';
import { pool } from '../../config/database';

describe('Organization API Integration Tests', () => {
  let authToken: string;
  let tenantId: string;
  let businessAreaId: string;
  let departmentId: string;

  beforeAll(async () => {
    // Setup test database and get auth token
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'testpassword'
      });

    authToken = loginRes.body.data.token;
    tenantId = loginRes.body.data.user.tenant_id;
  });

  afterAll(async () => {
    // Cleanup
    await pool.end();
  });

  describe('POST /api/v1/organization/business-areas', () => {
    it('should create a new business area', async () => {
      const res = await request(app)
        .post('/api/v1/organization/business-areas')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          business_area_code: 'TEST-BA',
          business_area_name: 'Test Business Area',
          short_name: 'Test BA'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.business_area_code).toBe('TEST-BA');

      businessAreaId = res.body.data.id;
    });
  });

  describe('POST /api/v1/organization/departments', () => {
    it('should create a new department', async () => {
      const res = await request(app)
        .post('/api/v1/organization/departments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          department_code: 'TEST-DEPT',
          department_name: 'Test Department',
          cost_center: 'CC-TEST-001',
          annual_budget: 100000
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.department_code).toBe('TEST-DEPT');

      departmentId = res.body.data.id;
    });

    it('should reject duplicate cost center', async () => {
      const res = await request(app)
        .post('/api/v1/organization/departments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          department_code: 'TEST-DEPT-2',
          department_name: 'Test Department 2',
          cost_center: 'CC-TEST-001' // Duplicate
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already exists');
    });
  });

  describe('POST /api/v1/organization/vehicles/assign', () => {
    let vehicleId: string;

    beforeAll(async () => {
      // Create test vehicle
      const vehRes = await request(app)
        .post('/api/v1/vehicles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vin: 'TEST123456789VIN1',
          make: 'Test',
          model: 'Vehicle',
          year: 2024
        });

      vehicleId = vehRes.body.data.id;
    });

    it('should assign vehicle to department', async () => {
      const res = await request(app)
        .post('/api/v1/organization/vehicles/assign')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehicle_id: vehicleId,
          department_id: departmentId,
          effective_date: '2024-01-01'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.department_id).toBe(departmentId);
    });

    it('should automatically inherit department from vehicle on fuel transaction', async () => {
      const fuelRes = await request(app)
        .post('/api/v1/fuel-transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehicle_id: vehicleId,
          gallons: 15.5,
          price_per_gallon: 3.59,
          transaction_date: '2024-01-05'
        });

      expect(fuelRes.status).toBe(201);
      expect(fuelRes.body.data.department_id).toBe(departmentId);
    });
  });

  describe('GET /api/v1/organization/hierarchy', () => {
    it('should return organizational hierarchy tree', async () => {
      const res = await request(app)
        .get('/api/v1/organization/hierarchy')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      if (res.body.data.length > 0) {
        expect(res.body.data[0]).toHaveProperty('children');
      }
    });
  });
});
```

---

### Data Migration Script

**File:** `api/src/scripts/migrate-org-structure.ts`

```typescript
/**
 * Migration Script: Assign existing vehicles and users to default department
 * Run this after deploying organizational structure tables
 */

import { pool } from '../config/database';
import { logger } from '../utils/logger';

async function migrateOrganizationalData() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get all tenants
    const tenants = await client.query('SELECT id, name FROM tenants');

    for (const tenant of tenants.rows) {
      logger.info(`Processing tenant: ${tenant.name} (${tenant.id})`);

      // Check if default org structure exists
      let defaultDept = await client.query(
        `SELECT id FROM departments
         WHERE tenant_id = $1 AND department_code = 'UNASSIGNED'`,
        [tenant.id]
      );

      // Create if doesn't exist
      if (defaultDept.rows.length === 0) {
        logger.info(`Creating default org structure for tenant ${tenant.id}`);
        await client.query('SELECT create_default_org_structure($1)', [tenant.id]);

        defaultDept = await client.query(
          `SELECT id FROM departments
           WHERE tenant_id = $1 AND department_code = 'UNASSIGNED'`,
          [tenant.id]
        );
      }

      const defaultDeptId = defaultDept.rows[0].id;

      // Assign vehicles without department
      const vehicleUpdate = await client.query(
        `UPDATE vehicles
         SET department_id = $1,
             assignment_effective_date = CURRENT_DATE,
             assignment_notes = 'Automatically assigned during migration'
         WHERE tenant_id = $2
         AND department_id IS NULL
         RETURNING id`,
        [defaultDeptId, tenant.id]
      );

      logger.info(`Assigned ${vehicleUpdate.rowCount} vehicles to default department`);

      // Assign users without department
      const userUpdate = await client.query(
        `UPDATE users
         SET department_id = $1
         WHERE tenant_id = $2
         AND department_id IS NULL
         RETURNING id`,
        [defaultDeptId, tenant.id]
      );

      logger.info(`Assigned ${userUpdate.rowCount} users to default department`);

      // Update fuel transactions to inherit from vehicle
      const fuelUpdate = await client.query(
        `UPDATE fuel_transactions ft
         SET department_id = v.department_id,
             business_area_id = v.business_area_id,
             cost_center = v.assigned_cost_center
         FROM vehicles v
         WHERE ft.vehicle_id = v.id
         AND ft.tenant_id = $1
         AND ft.department_id IS NULL
         RETURNING ft.id`,
        [tenant.id]
      );

      logger.info(`Updated ${fuelUpdate.rowCount} fuel transactions with department`);

      // Update work orders to inherit from vehicle
      const woUpdate = await client.query(
        `UPDATE work_orders wo
         SET department_id = v.department_id,
             business_area_id = v.business_area_id,
             cost_center = v.assigned_cost_center
         FROM vehicles v
         WHERE wo.vehicle_id = v.id
         AND wo.tenant_id = $1
         AND wo.department_id IS NULL
         RETURNING wo.id`,
        [tenant.id]
      );

      logger.info(`Updated ${woUpdate.rowCount} work orders with department`);
    }

    await client.query('COMMIT');
    logger.info('Organizational data migration completed successfully');

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error during organizational data migration:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateOrganizationalData()
    .then(() => {
      logger.info('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration script failed:', error);
      process.exit(1);
    });
}

export { migrateOrganizationalData };
```

---

### Performance Optimization

#### Database Indexes

All critical indexes are included in the migration above. Additional performance considerations:

```sql
-- Partial indexes for commonly filtered queries
CREATE INDEX idx_departments_active ON departments(tenant_id, status)
  WHERE status = 'active';

CREATE INDEX idx_funds_current_fiscal_year ON funds(tenant_id, fiscal_year)
  WHERE is_active = TRUE AND fiscal_year = EXTRACT(YEAR FROM CURRENT_DATE);

-- Index for organizational hierarchy queries
CREATE INDEX idx_business_areas_hierarchy ON business_areas(tenant_id, parent_business_area_id)
  WHERE status = 'active';

-- Covering index for department summary queries
CREATE INDEX idx_departments_summary ON departments(
  tenant_id, division_id, status
) INCLUDE (department_name, department_code, cost_center, manager_id);
```

#### Caching Strategy

```typescript
// api/src/services/cache.service.ts

import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export class CacheService {
  /**
   * Cache organizational hierarchy (rarely changes)
   */
  static async getOrganizationHierarchy(tenantId: string) {
    const cacheKey = `org:hierarchy:${tenantId}`;

    // Try cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fetch from database
    const hierarchy = await this.fetchHierarchyFromDB(tenantId);

    // Cache for 15 minutes
    await redis.setex(cacheKey, 900, JSON.stringify(hierarchy));

    return hierarchy;
  }

  /**
   * Invalidate org hierarchy cache
   */
  static async invalidateOrganizationCache(tenantId: string) {
    await redis.del(`org:hierarchy:${tenantId}`);
  }

  private static async fetchHierarchyFromDB(tenantId: string) {
    // Implementation
  }
}
```

---

### Deployment Checklist

- [ ] Run migration 040_organizational_structure.sql
- [ ] Verify all indexes created successfully
- [ ] Run data migration script `migrate-org-structure.ts`
- [ ] Deploy backend API changes
- [ ] Deploy frontend updates
- [ ] Update API documentation
- [ ] Create admin user guide
- [ ] Configure Redis caching
- [ ] Set up monitoring for new tables
- [ ] Test multi-tenant isolation
- [ ] Verify Row-Level Security policies
- [ ] Run integration tests
- [ ] Performance test with production data volume
- [ ] Train administrators on org structure management

---

This completes the comprehensive implementation for **Organizational Structure**. The remaining sections (Billing, KPIs, etc.) would follow similar structure with:

1. Complete SQL migrations
2. Full API implementation
3. React components and hooks
4. Testing suites
5. Migration scripts
6. Performance optimizations
7. Deployment procedures

Would you like me to continue with the next critical implementation (Billing & Cost Allocation) in similar detail?
