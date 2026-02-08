-- ============================================================================
-- Migration: Enhance Maintenance Schedules for PM Tracking & VMRS
-- Created: 2026-02-06
-- Purpose: Add VMRS codes, PM intervals, compliance tracking, auto-scheduling
-- ============================================================================

-- ============================================================================
-- PART 1: VMRS Classification & Service Types
-- ============================================================================

ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS vmrs_code VARCHAR(20);
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS vmrs_system VARCHAR(100);
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS vmrs_assembly VARCHAR(100);
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS service_level VARCHAR(50);
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS maintenance_class VARCHAR(50);
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS priority_level VARCHAR(20);

COMMENT ON COLUMN maintenance_schedules.service_level IS 'Level A/B/C/D PM inspection';
COMMENT ON COLUMN maintenance_schedules.maintenance_class IS 'preventive, predictive, corrective, emergency';

-- ============================================================================
-- PART 2: Multiple Interval Triggers (OR logic)
-- ============================================================================

ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS interval_miles INTEGER;
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS interval_hours INTEGER;
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS interval_days INTEGER;
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS interval_months INTEGER;
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS interval_logic VARCHAR(20) DEFAULT 'OR';

COMMENT ON COLUMN maintenance_schedules.interval_logic IS 'OR = trigger on first met, AND = all must be met';

-- ============================================================================
-- PART 3: Last Service Tracking
-- ============================================================================

ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS last_service_date DATE;
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS last_service_miles INTEGER;
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS last_service_hours INTEGER;
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS last_service_work_order_id UUID;
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS last_service_by UUID;
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS last_service_cost NUMERIC(10,2);

-- ============================================================================
-- PART 4: Next Service Due Calculations
-- ============================================================================

ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS next_due_date DATE;
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS next_due_miles INTEGER;
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS next_due_hours INTEGER;
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS overdue BOOLEAN DEFAULT FALSE;
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS days_overdue INTEGER;
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS miles_overdue INTEGER;

-- ============================================================================
-- PART 5: Alert Thresholds
-- ============================================================================

ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS alert_threshold_days INTEGER DEFAULT 7;
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS alert_threshold_miles INTEGER DEFAULT 500;
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS alert_threshold_hours INTEGER DEFAULT 50;
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS critical_threshold_days INTEGER DEFAULT 0;
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS critical_threshold_miles INTEGER DEFAULT 0;
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS alert_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS alert_sent_date TIMESTAMP;

-- ============================================================================
-- PART 6: Compliance & Regulatory
-- ============================================================================

ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS dot_required BOOLEAN DEFAULT FALSE;
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS fmcsa_regulation VARCHAR(100);
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS osha_required BOOLEAN DEFAULT FALSE;
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS epa_required BOOLEAN DEFAULT FALSE;
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS manufacturer_required BOOLEAN DEFAULT FALSE;
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS warranty_required BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN maintenance_schedules.fmcsa_regulation IS 'e.g., Part 396.3, Part 396.11';

-- ============================================================================
-- PART 7: Auto-Scheduling & Work Order Generation
-- ============================================================================

ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS auto_generate_work_order BOOLEAN DEFAULT TRUE;
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS auto_schedule_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS lead_time_days INTEGER DEFAULT 7;
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS estimated_duration_hours NUMERIC(5,2);
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS preferred_facility_id UUID;
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS preferred_technician_id UUID;

-- ============================================================================
-- PART 8: Parts & Cost Estimates
-- ============================================================================

ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS requires_parts BOOLEAN DEFAULT FALSE;
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS parts_list JSONB;
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS estimated_parts_cost NUMERIC(10,2);
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS estimated_labor_hours NUMERIC(5,2);
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS estimated_labor_cost NUMERIC(10,2);
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS estimated_total_cost NUMERIC(10,2);

-- ============================================================================
-- PART 9: Service History & Performance
-- ============================================================================

ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS service_count INTEGER DEFAULT 0;
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS on_time_completion_count INTEGER DEFAULT 0;
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS late_completion_count INTEGER DEFAULT 0;
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS average_completion_days NUMERIC(10,2);
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS average_cost NUMERIC(10,2);
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS total_cost_ytd NUMERIC(10,2) DEFAULT 0;

-- ============================================================================
-- PART 10: Seasonal & Environmental Considerations
-- ============================================================================

ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS seasonal BOOLEAN DEFAULT FALSE;
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS seasonal_months INTEGER[];
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS temperature_dependent BOOLEAN DEFAULT FALSE;
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS climate_zone VARCHAR(50);

COMMENT ON COLUMN maintenance_schedules.seasonal_months IS 'Array of months (1-12) when service should be performed';

-- ============================================================================
-- PART 11: Documentation & Instructions
-- ============================================================================

ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS service_procedure_url VARCHAR(500);
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS oem_manual_reference VARCHAR(200);
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS special_tools_required TEXT;
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS safety_precautions TEXT;
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS inspection_checklist JSONB;

-- ============================================================================
-- PART 12: Suspension & Modifications
-- ============================================================================

ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS suspended BOOLEAN DEFAULT FALSE;
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS suspended_date TIMESTAMP;
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS suspended_by UUID;
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS suspended_reason TEXT;
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS suspension_until DATE;

-- ============================================================================
-- PART 13: Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_vmrs_code ON maintenance_schedules(vmrs_code);
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_next_due_date ON maintenance_schedules(next_due_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_overdue ON maintenance_schedules(overdue) WHERE overdue = TRUE;
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_suspended ON maintenance_schedules(suspended) WHERE suspended = FALSE;
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_auto_schedule ON maintenance_schedules(auto_schedule_enabled) WHERE auto_schedule_enabled = TRUE;
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_facility ON maintenance_schedules(preferred_facility_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_technician ON maintenance_schedules(preferred_technician_id);

-- ============================================================================
-- PART 14: Foreign Keys
-- ============================================================================

ALTER TABLE maintenance_schedules DROP CONSTRAINT IF EXISTS maintenance_schedules_last_service_work_order_id_fkey;
ALTER TABLE maintenance_schedules ADD CONSTRAINT maintenance_schedules_last_service_work_order_id_fkey
  FOREIGN KEY (last_service_work_order_id) REFERENCES work_orders(id) ON DELETE SET NULL;

ALTER TABLE maintenance_schedules DROP CONSTRAINT IF EXISTS maintenance_schedules_last_service_by_fkey;
ALTER TABLE maintenance_schedules ADD CONSTRAINT maintenance_schedules_last_service_by_fkey
  FOREIGN KEY (last_service_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE maintenance_schedules DROP CONSTRAINT IF EXISTS maintenance_schedules_preferred_facility_id_fkey;
ALTER TABLE maintenance_schedules ADD CONSTRAINT maintenance_schedules_preferred_facility_id_fkey
  FOREIGN KEY (preferred_facility_id) REFERENCES facilities(id) ON DELETE SET NULL;

ALTER TABLE maintenance_schedules DROP CONSTRAINT IF EXISTS maintenance_schedules_preferred_technician_id_fkey;
ALTER TABLE maintenance_schedules ADD CONSTRAINT maintenance_schedules_preferred_technician_id_fkey
  FOREIGN KEY (preferred_technician_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE maintenance_schedules DROP CONSTRAINT IF EXISTS maintenance_schedules_suspended_by_fkey;
ALTER TABLE maintenance_schedules ADD CONSTRAINT maintenance_schedules_suspended_by_fkey
  FOREIGN KEY (suspended_by) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================================================
-- PART 15: Check Constraints
-- ============================================================================

ALTER TABLE maintenance_schedules DROP CONSTRAINT IF EXISTS maintenance_schedules_maintenance_class_check;
ALTER TABLE maintenance_schedules ADD CONSTRAINT maintenance_schedules_maintenance_class_check
  CHECK (maintenance_class IN ('preventive', 'predictive', 'corrective', 'emergency', 'condition_based'));

ALTER TABLE maintenance_schedules DROP CONSTRAINT IF EXISTS maintenance_schedules_service_level_check;
ALTER TABLE maintenance_schedules ADD CONSTRAINT maintenance_schedules_service_level_check
  CHECK (service_level IN ('A', 'B', 'C', 'D', 'PM1', 'PM2', 'PM3', 'PM4'));

ALTER TABLE maintenance_schedules DROP CONSTRAINT IF EXISTS maintenance_schedules_interval_logic_check;
ALTER TABLE maintenance_schedules ADD CONSTRAINT maintenance_schedules_interval_logic_check
  CHECK (interval_logic IN ('OR', 'AND'));

COMMENT ON TABLE maintenance_schedules IS 'Enhanced PM schedules with VMRS codes, multiple interval triggers, compliance tracking, auto-scheduling, and cost estimates';
