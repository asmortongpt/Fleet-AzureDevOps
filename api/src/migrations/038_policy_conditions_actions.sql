-- Migration: 038 - Policy Conditions and Actions Schema
-- Description: Adds structured conditions and actions columns to policy_templates for rule-based enforcement
-- Author: Policy Engine Implementation
-- Date: 2026-01-02
-- Dependencies: 022_policy_templates_library.sql

-- ==============================================================================
-- ALTER TABLE: Add Conditions and Actions Columns
-- ==============================================================================

ALTER TABLE policy_templates
ADD COLUMN IF NOT EXISTS conditions JSONB,
ADD COLUMN IF NOT EXISTS actions JSONB,
ADD COLUMN IF NOT EXISTS execution_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS execution_schedule VARCHAR(100), -- 'hourly', 'daily', 'weekly', 'monthly', 'on_event'
ADD COLUMN IF NOT EXISTS last_execution_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS next_execution_at TIMESTAMP;

-- ==============================================================================
-- INDEXES
-- ==============================================================================

-- Index for finding policies that should be executed
CREATE INDEX idx_policy_templates_execution_enabled ON policy_templates(execution_enabled) WHERE execution_enabled = TRUE;
CREATE INDEX idx_policy_templates_next_execution ON policy_templates(next_execution_at) WHERE next_execution_at IS NOT NULL;

-- GIN index for JSONB condition queries
CREATE INDEX idx_policy_templates_conditions ON policy_templates USING GIN (conditions);
CREATE INDEX idx_policy_templates_actions ON policy_templates USING GIN (actions);

-- ==============================================================================
-- VALIDATION FUNCTIONS
-- ==============================================================================

-- Function to validate condition schema
CREATE OR REPLACE FUNCTION validate_policy_conditions(conditions_json JSONB)
RETURNS BOOLEAN AS $$
DECLARE
    condition JSONB;
    required_fields TEXT[] := ARRAY['type', 'operator'];
BEGIN
    -- NULL conditions are valid (policy doesn't use automation)
    IF conditions_json IS NULL THEN
        RETURN TRUE;
    END IF;

    -- Conditions must be an array
    IF jsonb_typeof(conditions_json) != 'array' THEN
        RAISE EXCEPTION 'Conditions must be a JSON array';
    END IF;

    -- Validate each condition object
    FOR condition IN SELECT jsonb_array_elements(conditions_json)
    LOOP
        -- Check required fields
        IF NOT (condition ? 'type' AND condition ? 'operator') THEN
            RAISE EXCEPTION 'Each condition must have "type" and "operator" fields';
        END IF;

        -- Validate operator values
        IF condition->>'operator' NOT IN (
            'equals', 'not_equals',
            'greater_than', 'less_than', 'greater_than_or_equal', 'less_than_or_equal',
            'between', 'not_between',
            'in', 'not_in',
            'contains', 'not_contains',
            'exists', 'not_exists',
            'matches_regex'
        ) THEN
            RAISE EXCEPTION 'Invalid operator: %', condition->>'operator';
        END IF;
    END LOOP;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to validate action schema
CREATE OR REPLACE FUNCTION validate_policy_actions(actions_json JSONB)
RETURNS BOOLEAN AS $$
DECLARE
    action JSONB;
BEGIN
    -- NULL actions are valid (policy doesn't use automation)
    IF actions_json IS NULL THEN
        RETURN TRUE;
    END IF;

    -- Actions must be an array
    IF jsonb_typeof(actions_json) != 'array' THEN
        RAISE EXCEPTION 'Actions must be a JSON array';
    END IF;

    -- Validate each action object
    FOR action IN SELECT jsonb_array_elements(actions_json)
    LOOP
        -- Check required field
        IF NOT (action ? 'type') THEN
            RAISE EXCEPTION 'Each action must have a "type" field';
        END IF;

        -- Validate action types
        IF action->>'type' NOT IN (
            'send_notification',
            'send_email',
            'send_sms',
            'create_work_order',
            'update_vehicle_status',
            'update_driver_status',
            'disable_vehicle',
            'enable_vehicle',
            'create_incident',
            'log_violation',
            'trigger_webhook',
            'execute_workflow'
        ) THEN
            RAISE EXCEPTION 'Invalid action type: %', action->>'type';
        END IF;
    END LOOP;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add check constraints
ALTER TABLE policy_templates
ADD CONSTRAINT check_valid_conditions CHECK (validate_policy_conditions(conditions)),
ADD CONSTRAINT check_valid_actions CHECK (validate_policy_actions(actions));

-- ==============================================================================
-- TRIGGER: Update execution schedule
-- ==============================================================================

CREATE OR REPLACE FUNCTION update_policy_execution_schedule()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if execution is enabled
    IF NEW.execution_enabled = TRUE THEN
        -- Set next execution time based on schedule
        IF NEW.execution_schedule = 'hourly' THEN
            NEW.next_execution_at := CURRENT_TIMESTAMP + INTERVAL '1 hour';
        ELSIF NEW.execution_schedule = 'daily' THEN
            NEW.next_execution_at := CURRENT_TIMESTAMP + INTERVAL '1 day';
        ELSIF NEW.execution_schedule = 'weekly' THEN
            NEW.next_execution_at := CURRENT_TIMESTAMP + INTERVAL '1 week';
        ELSIF NEW.execution_schedule = 'monthly' THEN
            NEW.next_execution_at := CURRENT_TIMESTAMP + INTERVAL '1 month';
        ELSIF NEW.execution_schedule = 'on_event' THEN
            -- Event-driven policies don't have scheduled executions
            NEW.next_execution_at := NULL;
        END IF;
    ELSE
        -- Execution disabled, clear schedule
        NEW.next_execution_at := NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_policy_execution_schedule
    BEFORE INSERT OR UPDATE OF execution_enabled, execution_schedule ON policy_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_policy_execution_schedule();

-- ==============================================================================
-- COMMENTS
-- ==============================================================================

COMMENT ON COLUMN policy_templates.conditions IS 'Array of condition objects for rule-based enforcement: [{type, field, operator, value, unit, description}]';
COMMENT ON COLUMN policy_templates.actions IS 'Array of action objects to execute when conditions met: [{type, target, template, parameters, priority}]';
COMMENT ON COLUMN policy_templates.execution_enabled IS 'Flag to enable/disable automatic execution of this policy';
COMMENT ON COLUMN policy_templates.execution_schedule IS 'Frequency of automatic execution: hourly, daily, weekly, monthly, on_event';
COMMENT ON COLUMN policy_templates.last_execution_at IS 'Timestamp of last automatic execution';
COMMENT ON COLUMN policy_templates.next_execution_at IS 'Timestamp of next scheduled execution (NULL for event-driven)';

-- ==============================================================================
-- EXAMPLE DATA: Vehicle Inspection Policy
-- ==============================================================================

-- Update existing Vehicle Safety Inspection Policy with automation rules
UPDATE policy_templates
SET
    conditions = '[
        {
            "type": "vehicle_inspection_overdue",
            "field": "vehicles.inspection_due",
            "operator": "less_than",
            "value": "CURRENT_DATE",
            "description": "Vehicle inspection due date has passed"
        },
        {
            "type": "vehicle_active",
            "field": "vehicles.status",
            "operator": "equals",
            "value": "active",
            "description": "Vehicle is currently active"
        }
    ]'::jsonb,
    actions = '[
        {
            "type": "send_notification",
            "target": "fleet_manager",
            "template": "inspection_overdue_alert",
            "channels": ["email", "dashboard"],
            "priority": "high",
            "parameters": {
                "subject": "Vehicle Inspection Overdue",
                "include_vehicle_details": true
            }
        },
        {
            "type": "create_work_order",
            "parameters": {
                "work_order_type": "inspection",
                "priority": "urgent",
                "description": "Annual safety inspection overdue - automated policy enforcement",
                "assign_to_role": "mechanic"
            }
        },
        {
            "type": "update_vehicle_status",
            "parameters": {
                "new_status": "inspection_required",
                "require_approval": false
            }
        }
    ]'::jsonb,
    execution_enabled = FALSE, -- Disabled by default, enable after testing
    execution_schedule = 'daily' -- Check daily for overdue inspections
WHERE policy_code = 'FLT-SAF-001'
    AND policy_name LIKE '%Vehicle Safety Inspection%';

-- ==============================================================================
-- EXAMPLE DATA: Driver License Expiration Policy
-- ==============================================================================

INSERT INTO policy_templates (
    policy_code,
    policy_name,
    policy_category,
    sub_category,
    policy_objective,
    policy_scope,
    policy_content,
    regulatory_references,
    version,
    effective_date,
    status,
    is_mandatory,
    applies_to_roles,
    conditions,
    actions,
    execution_enabled,
    execution_schedule
) VALUES (
    'FLT-COM-002',
    'Driver License Expiration Monitoring',
    'Compliance',
    'Driver Qualification',
    'Ensure all drivers maintain valid licenses and provide advance warning of expirations',
    'All drivers operating company vehicles',
    '# Driver License Expiration Policy

## Objective
Monitor driver license expiration dates and take proactive action to prevent drivers from operating with expired licenses.

## Automation Rules
This policy automatically:
- Sends 30-day advance warning to drivers
- Sends 7-day urgent warning to drivers and managers
- Disables driver status when license expires

## Compliance
- FMCSA 49 CFR 391.11 - Driver Qualifications
- State DMV regulations',
    ARRAY['FMCSA 49 CFR 391.11', 'State DMV'],
    '1.0',
    CURRENT_DATE,
    'Active',
    TRUE,
    ARRAY['driver'],
    -- CONDITIONS: Check for licenses expiring within 30 days
    '[
        {
            "type": "license_expiring_soon",
            "field": "drivers.license_expiry_date",
            "operator": "between",
            "value": ["CURRENT_DATE", "CURRENT_DATE + INTERVAL ''30 days''"],
            "description": "Driver license expires within 30 days"
        },
        {
            "type": "driver_active",
            "field": "drivers.status",
            "operator": "equals",
            "value": "active",
            "description": "Driver is currently active"
        }
    ]'::jsonb,
    -- ACTIONS: Multi-tier notification system
    '[
        {
            "type": "send_notification",
            "target": "driver",
            "template": "license_expiring_30day",
            "channels": ["email", "sms"],
            "priority": "medium",
            "condition": "days_until_expiry >= 30",
            "parameters": {
                "subject": "Driver License Expiring in 30 Days",
                "include_renewal_instructions": true
            }
        },
        {
            "type": "send_notification",
            "target": "driver",
            "template": "license_expiring_7day",
            "channels": ["email", "sms", "push"],
            "priority": "high",
            "condition": "days_until_expiry <= 7 AND days_until_expiry > 0",
            "parameters": {
                "subject": "URGENT: Driver License Expiring Soon",
                "escalate_to_manager": true
            }
        },
        {
            "type": "send_notification",
            "target": "fleet_manager",
            "template": "license_expiring_7day_manager",
            "channels": ["email", "dashboard"],
            "priority": "high",
            "condition": "days_until_expiry <= 7",
            "parameters": {
                "subject": "Driver License Expiration Alert",
                "include_driver_schedule": true
            }
        },
        {
            "type": "update_driver_status",
            "condition": "days_until_expiry <= 0",
            "parameters": {
                "new_status": "suspended",
                "reason": "Driver license expired - automatic suspension per policy FLT-COM-002",
                "require_approval": false
            }
        }
    ]'::jsonb,
    FALSE, -- Disabled by default
    'daily'
);

-- ==============================================================================
-- SCHEMA DOCUMENTATION
-- ==============================================================================

/*
================================================================================
CONDITIONS SCHEMA
================================================================================

Each condition is an object with the following structure:

{
    "type": "string",           // Condition type identifier (required)
    "field": "string",           // Database field to check (optional, depends on type)
    "operator": "string",        // Comparison operator (required)
    "value": "any",              // Expected value (required for most operators)
    "unit": "string",            // Unit of measurement (optional, e.g., "days", "miles")
    "description": "string",     // Human-readable description (optional)
    "condition": "string"        // Additional runtime condition (optional, SQL expression)
}

SUPPORTED OPERATORS:
- equals, not_equals
- greater_than, less_than, greater_than_or_equal, less_than_or_equal
- between, not_between (value must be [min, max])
- in, not_in (value must be array)
- contains, not_contains (for array/JSONB fields)
- exists, not_exists (field existence check)
- matches_regex (value is regex pattern)

CONDITION TYPES:
- vehicle_inspection_overdue: Check if vehicle inspection is overdue
- vehicle_maintenance_overdue: Check if maintenance is overdue
- license_expiring_soon: Check if driver license expires soon
- certification_expiring: Check if certification expires soon
- vehicle_active: Check if vehicle status is active
- driver_active: Check if driver status is active
- mileage_threshold: Check if vehicle mileage exceeds threshold
- age_threshold: Check if vehicle age exceeds threshold

EXAMPLE CONDITIONS:
[
    {
        "type": "vehicle_inspection_overdue",
        "field": "vehicles.inspection_due",
        "operator": "less_than",
        "value": "CURRENT_DATE",
        "description": "Vehicle inspection due date has passed"
    },
    {
        "type": "mileage_threshold",
        "field": "vehicles.mileage",
        "operator": "greater_than",
        "value": 100000,
        "unit": "miles",
        "description": "Vehicle has exceeded 100,000 miles"
    }
]

================================================================================
ACTIONS SCHEMA
================================================================================

Each action is an object with the following structure:

{
    "type": "string",           // Action type (required)
    "target": "string",          // Target entity (optional, depends on type)
    "template": "string",        // Template name for notifications (optional)
    "channels": ["string"],      // Communication channels (optional)
    "priority": "string",        // Action priority: low, medium, high, urgent (optional)
    "condition": "string",       // Runtime condition for this action (optional, SQL expression)
    "parameters": {object},      // Action-specific parameters (optional)
    "require_approval": boolean  // Whether action requires manual approval (optional, default false)
}

ACTION TYPES:
- send_notification: Send in-app notification
- send_email: Send email
- send_sms: Send SMS message
- create_work_order: Create maintenance work order
- update_vehicle_status: Change vehicle status
- update_driver_status: Change driver status
- disable_vehicle: Mark vehicle as out of service
- enable_vehicle: Mark vehicle as in service
- create_incident: Create incident report
- log_violation: Create policy violation record
- trigger_webhook: Call external webhook
- execute_workflow: Trigger multi-step workflow

NOTIFICATION TARGETS:
- driver: Assigned driver
- fleet_manager: Fleet manager role
- mechanic: Mechanic role
- admin: System administrator
- custom: Custom recipient (specify in parameters)

EXAMPLE ACTIONS:
[
    {
        "type": "send_notification",
        "target": "fleet_manager",
        "template": "inspection_overdue_alert",
        "channels": ["email", "dashboard"],
        "priority": "high",
        "parameters": {
            "subject": "Vehicle Inspection Overdue",
            "include_vehicle_details": true,
            "cc": ["safety@company.com"]
        }
    },
    {
        "type": "create_work_order",
        "parameters": {
            "work_order_type": "inspection",
            "priority": "urgent",
            "description": "Annual safety inspection overdue",
            "assign_to_role": "mechanic",
            "estimated_hours": 2
        }
    },
    {
        "type": "update_vehicle_status",
        "condition": "days_overdue > 30",
        "parameters": {
            "new_status": "out_of_service",
            "reason": "Inspection overdue by more than 30 days",
            "require_approval": true
        }
    }
]

================================================================================
*/
