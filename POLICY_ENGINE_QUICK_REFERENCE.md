# Policy Engine Database Schema - Quick Reference

**Last Updated:** January 2, 2026

---

## Table of Contents
1. [Core Tables](#core-tables)
2. [Column Quick Reference](#column-quick-reference)
3. [Example Queries](#example-queries)
4. [JSON Schema Examples](#json-schema-examples)
5. [Common Operations](#common-operations)
6. [Troubleshooting](#troubleshooting)

---

## Core Tables

### 1. policy_templates
**Purpose:** Master policy library with version control and automation rules

**Key Columns:**
- `policy_code` - Unique identifier (e.g., "FLT-SAF-001")
- `policy_content` - Full policy text (Markdown supported)
- `conditions` - JSONB automation rules (NEW)
- `actions` - JSONB enforcement actions (NEW)
- `status` - Draft | Pending Approval | Active | Archived | Superseded

**Location:** `/api/src/migrations/022_policy_templates_library.sql`

---

### 2. policy_acknowledgments
**Purpose:** Track employee policy acknowledgments with digital signatures

**Key Columns:**
- `policy_id` → policy_templates.id
- `employee_id` → drivers.id
- `signature_data` - Base64 encoded signature
- `test_score` - Assessment results
- `is_current` - Version tracking flag

**Location:** `/api/src/migrations/022_policy_templates_library.sql`

---

### 3. policy_violations
**Purpose:** Track policy violations with progressive discipline

**Key Columns:**
- `severity` - Minor | Moderate | Serious | Critical
- `disciplinary_action` - Verbal Warning | Written Warning | Suspension | Termination
- `offense_count` - Progressive discipline counter
- `case_status` - Open | Under Investigation | Action Taken | Closed | Under Appeal

**Location:** `/api/src/migrations/022_policy_templates_library.sql`

---

### 4. policy_executions (NEW)
**Purpose:** Audit trail for automatic policy enforcement

**Key Columns:**
- `trigger_type` - scheduled | event | manual | violation
- `conditions_met` - TRUE/FALSE evaluation result
- `actions_executed` - JSONB array of actions taken
- `execution_status` - pending | running | completed | failed | skipped
- `work_order_id` - Optional FK to created work order

**Location:** `/api/src/migrations/037_policy_executions.sql`

---

### 5. policy_compliance_audits
**Purpose:** Compliance audit tracking with scoring

**Key Columns:**
- `audit_type` - Scheduled | Random | Incident-Triggered | Regulatory
- `compliance_score` - 0-100%
- `findings` - JSONB detailed results
- `corrective_actions_required` - Boolean flag

**Location:** `/api/src/migrations/022_policy_templates_library.sql`

---

## Column Quick Reference

### Policy Status Values
```
Draft              - Being written
Pending Approval   - Awaiting management approval
Active             - Currently enforced
Archived           - No longer active
Superseded         - Replaced by newer version
```

### Severity Levels
```
Minor    - Low impact, warning appropriate
Moderate - Medium impact, corrective action needed
Serious  - High impact, suspension possible
Critical - Safety/compliance violation, termination possible
```

### Execution Status
```
pending    - Queued for execution
running    - Currently processing
completed  - Successfully finished
failed     - Error occurred
skipped    - Conditions not met
```

### Trigger Types
```
scheduled - Periodic execution (daily, weekly, etc.)
event     - Triggered by system event
manual    - User-initiated
violation - Triggered by policy violation
```

---

## Example Queries

### 1. Find All Active Policies Requiring Acknowledgment
```sql
SELECT
    pt.policy_code,
    pt.policy_name,
    pt.effective_date,
    ARRAY_LENGTH(pt.applies_to_roles, 1) AS role_count
FROM policy_templates pt
WHERE pt.status = 'Active'
  AND pt.is_mandatory = TRUE
ORDER BY pt.effective_date DESC;
```

---

### 2. Get Employee Acknowledgment Status
```sql
SELECT
    d.first_name || ' ' || d.last_name AS employee,
    pt.policy_code,
    pt.policy_name,
    pa.acknowledged_at,
    pa.test_passed,
    pa.training_completed
FROM drivers d
CROSS JOIN policy_templates pt
LEFT JOIN policy_acknowledgments pa
    ON d.id = pa.employee_id
    AND pt.id = pa.policy_id
    AND pa.is_current = TRUE
WHERE pt.status = 'Active'
  AND d.id = $1
ORDER BY pa.acknowledged_at DESC NULLS LAST;
```

---

### 3. Find Policies Due for Review
```sql
SELECT
    policy_code,
    policy_name,
    next_review_date,
    CURRENT_DATE - next_review_date AS days_overdue
FROM policy_templates
WHERE status = 'Active'
  AND next_review_date < CURRENT_DATE
ORDER BY next_review_date;
```

---

### 4. Progressive Discipline Tracking
```sql
SELECT
    d.first_name || ' ' || d.last_name AS employee,
    pv.violation_date,
    pt.policy_name,
    pv.severity,
    pv.offense_count,
    pv.disciplinary_action
FROM policy_violations pv
JOIN drivers d ON pv.employee_id = d.id
JOIN policy_templates pt ON pv.policy_id = pt.id
WHERE pv.employee_id = $1
ORDER BY pv.violation_date DESC;
```

---

### 5. Execution Success Rate (Last 7 Days)
```sql
SELECT
    pt.policy_code,
    pt.policy_name,
    COUNT(*) AS total_executions,
    COUNT(*) FILTER (WHERE pe.execution_status = 'completed') AS successful,
    COUNT(*) FILTER (WHERE pe.execution_status = 'failed') AS failed,
    ROUND(
        COUNT(*) FILTER (WHERE pe.execution_status = 'completed') * 100.0 / COUNT(*),
        2
    ) AS success_rate
FROM policy_executions pe
JOIN policy_templates pt ON pe.policy_id = pt.id
WHERE pe.started_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
GROUP BY pt.policy_code, pt.policy_name
ORDER BY success_rate;
```

---

### 6. Unacknowledged Mandatory Policies
```sql
SELECT
    d.email,
    d.first_name || ' ' || d.last_name AS employee,
    COUNT(*) AS pending_policies,
    ARRAY_AGG(pt.policy_name) AS policy_names
FROM drivers d
CROSS JOIN policy_templates pt
LEFT JOIN policy_acknowledgments pa
    ON d.id = pa.employee_id
    AND pt.id = pa.policy_id
    AND pa.is_current = TRUE
WHERE pt.status = 'Active'
  AND pt.is_mandatory = TRUE
  AND pa.id IS NULL
  AND d.status = 'active'
GROUP BY d.id, d.email, d.first_name, d.last_name
HAVING COUNT(*) > 0
ORDER BY COUNT(*) DESC;
```

---

### 7. Compliance Audit Summary
```sql
SELECT
    pca.audit_date,
    pca.audit_type,
    pt.policy_name,
    pca.compliance_score,
    pca.compliant_items,
    pca.non_compliant_items,
    pca.corrective_actions_required
FROM policy_compliance_audits pca
JOIN policy_templates pt ON pca.policy_id = pt.id
WHERE pca.audit_date > CURRENT_DATE - INTERVAL '90 days'
ORDER BY pca.audit_date DESC, pca.compliance_score ASC;
```

---

### 8. Recent Policy Executions with Details
```sql
SELECT
    pe.started_at,
    pt.policy_code,
    pt.policy_name,
    pe.trigger_type,
    pe.trigger_event,
    pe.conditions_met,
    pe.execution_status,
    pe.duration_ms,
    v.unit_number AS vehicle,
    d.first_name || ' ' || d.last_name AS driver,
    wo.work_order_number AS created_wo
FROM policy_executions pe
JOIN policy_templates pt ON pe.policy_id = pt.id
LEFT JOIN vehicles v ON pe.vehicle_id = v.id
LEFT JOIN drivers d ON pe.driver_id = d.id
LEFT JOIN work_orders wo ON pe.work_order_id = wo.id
ORDER BY pe.started_at DESC
LIMIT 50;
```

---

## JSON Schema Examples

### Conditions Schema

```json
[
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
    },
    {
        "type": "mileage_threshold",
        "field": "vehicles.mileage",
        "operator": "greater_than",
        "value": 100000,
        "unit": "miles",
        "description": "Vehicle mileage exceeds threshold"
    }
]
```

**Supported Operators:**
- `equals`, `not_equals`
- `greater_than`, `less_than`, `greater_than_or_equal`, `less_than_or_equal`
- `between`, `not_between`
- `in`, `not_in`
- `contains`, `not_contains`
- `exists`, `not_exists`
- `matches_regex`

---

### Actions Schema

```json
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
            "description": "Annual safety inspection overdue - automated policy enforcement",
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
```

**Supported Action Types:**
- `send_notification`, `send_email`, `send_sms`
- `create_work_order`
- `update_vehicle_status`, `update_driver_status`
- `disable_vehicle`, `enable_vehicle`
- `create_incident`, `log_violation`
- `trigger_webhook`, `execute_workflow`

---

## Common Operations

### Creating a New Policy

```sql
INSERT INTO policy_templates (
    policy_code,
    policy_name,
    policy_category,
    policy_objective,
    policy_scope,
    policy_content,
    regulatory_references,
    version,
    effective_date,
    status,
    is_mandatory,
    applies_to_roles
) VALUES (
    'FLT-SAF-003',
    'Defensive Driving Standards',
    'Safety',
    'Establish safe driving practices for all fleet operators',
    'All drivers operating company vehicles',
    '# Defensive Driving Standards\n\n...',
    ARRAY['NHTSA Guidelines', 'State Vehicle Code'],
    '1.0',
    CURRENT_DATE,
    'Draft',
    TRUE,
    ARRAY['driver']
);
```

---

### Recording an Acknowledgment

```sql
INSERT INTO policy_acknowledgments (
    policy_id,
    employee_id,
    acknowledged_at,
    acknowledgment_method,
    signature_data,
    ip_address,
    test_taken,
    test_score,
    test_passed,
    is_current
) VALUES (
    123,                           -- policy_id
    456,                           -- employee_id (driver)
    CURRENT_TIMESTAMP,
    'Electronic',
    'data:image/png;base64,...',  -- signature
    '192.168.1.100',
    TRUE,
    92.5,
    TRUE,
    TRUE
);
```

---

### Creating a Policy Violation

```sql
INSERT INTO policy_violations (
    policy_id,
    employee_id,
    vehicle_id,
    violation_date,
    violation_description,
    severity,
    disciplinary_action,
    offense_count,
    case_status
) VALUES (
    123,                          -- policy_id
    456,                          -- employee_id
    789,                          -- vehicle_id
    CURRENT_DATE,
    'Failed to complete pre-trip inspection checklist',
    'Moderate',
    'Written Warning',
    1,
    'Open'
);
```

---

### Enabling Policy Automation

```sql
UPDATE policy_templates
SET
    conditions = '[
        {
            "type": "vehicle_inspection_overdue",
            "field": "vehicles.inspection_due",
            "operator": "less_than",
            "value": "CURRENT_DATE"
        }
    ]'::jsonb,
    actions = '[
        {
            "type": "send_notification",
            "target": "fleet_manager",
            "template": "inspection_overdue"
        }
    ]'::jsonb,
    execution_enabled = TRUE,
    execution_schedule = 'daily'
WHERE policy_code = 'FLT-SAF-001';
```

---

### Logging a Policy Execution

```sql
INSERT INTO policy_executions (
    tenant_id,
    policy_id,
    trigger_type,
    trigger_event,
    trigger_data,
    conditions_met,
    conditions_evaluated,
    actions_executed,
    vehicle_id,
    execution_status,
    started_at
) VALUES (
    'tenant-uuid',
    123,
    'scheduled',
    'daily_inspection_check',
    '{"days_overdue": 5}'::jsonb,
    TRUE,
    '[{"condition_index": 0, "result": "PASS"}]'::jsonb,
    '[{"action_index": 0, "type": "send_notification", "status": "success"}]'::jsonb,
    'vehicle-uuid',
    'completed',
    CURRENT_TIMESTAMP
);
```

---

## Troubleshooting

### Issue: Policies not executing automatically

**Check:**
```sql
SELECT
    policy_code,
    execution_enabled,
    execution_schedule,
    next_execution_at,
    status
FROM policy_templates
WHERE policy_code = 'FLT-SAF-001';
```

**Fix:**
```sql
UPDATE policy_templates
SET execution_enabled = TRUE,
    next_execution_at = CURRENT_TIMESTAMP
WHERE policy_code = 'FLT-SAF-001';
```

---

### Issue: Duplicate acknowledgments

**Find duplicates:**
```sql
SELECT
    policy_id,
    employee_id,
    COUNT(*)
FROM policy_acknowledgments
WHERE is_current = TRUE
GROUP BY policy_id, employee_id
HAVING COUNT(*) > 1;
```

**Fix:**
```sql
-- Mark older acknowledgments as not current
UPDATE policy_acknowledgments pa1
SET is_current = FALSE
WHERE pa1.id IN (
    SELECT pa2.id
    FROM policy_acknowledgments pa2
    WHERE pa2.policy_id = pa1.policy_id
      AND pa2.employee_id = pa1.employee_id
      AND pa2.is_current = TRUE
      AND pa2.id < (
          SELECT MAX(id)
          FROM policy_acknowledgments pa3
          WHERE pa3.policy_id = pa1.policy_id
            AND pa3.employee_id = pa1.employee_id
            AND pa3.is_current = TRUE
      )
);
```

---

### Issue: Policy execution failures

**View recent failures:**
```sql
SELECT *
FROM v_policy_execution_failures
ORDER BY started_at DESC
LIMIT 10;
```

**Retry failed execution:**
```sql
UPDATE policy_executions
SET execution_status = 'pending',
    retry_count = retry_count + 1,
    error_message = NULL
WHERE id = 'execution-uuid'
  AND retry_count < 3;
```

---

### Issue: Orphaned policy executions

**Find executions with missing work orders:**
```sql
SELECT
    pe.id,
    pe.started_at,
    pt.policy_code,
    pe.work_order_id
FROM policy_executions pe
JOIN policy_templates pt ON pe.policy_id = pt.id
LEFT JOIN work_orders wo ON pe.work_order_id = wo.id
WHERE pe.work_order_id IS NOT NULL
  AND wo.id IS NULL;
```

**Fix:**
```sql
UPDATE policy_executions
SET work_order_id = NULL
WHERE id IN (
    -- IDs from query above
);
```

---

## Performance Tips

### 1. Use Indexed Columns in WHERE Clauses
```sql
-- Good - uses index
SELECT * FROM policy_templates WHERE status = 'Active';

-- Bad - full table scan
SELECT * FROM policy_templates WHERE LOWER(policy_name) LIKE '%safety%';
```

---

### 2. Limit JSONB Queries
```sql
-- Good - specific path
SELECT * FROM policy_templates
WHERE conditions @> '[{"type": "vehicle_inspection_overdue"}]';

-- Better - with additional filters
SELECT * FROM policy_templates
WHERE execution_enabled = TRUE
  AND conditions @> '[{"type": "vehicle_inspection_overdue"}]';
```

---

### 3. Use Views for Complex Queries
```sql
-- Instead of complex joins, use pre-built views
SELECT * FROM v_employee_compliance WHERE employee_id = $1;
SELECT * FROM v_policies_due_for_review;
SELECT * FROM v_policy_execution_summary;
```

---

### 4. Paginate Large Result Sets
```sql
SELECT *
FROM policy_executions
ORDER BY started_at DESC
LIMIT 50 OFFSET $1;
```

---

## Security Checklist

- [ ] Row-Level Security (RLS) enabled on all tables
- [ ] Tenant isolation enforced via `tenant_id`
- [ ] Sensitive data (signatures, PII) encrypted at rest
- [ ] Audit logs enabled for all policy operations
- [ ] User permissions validated before data access
- [ ] SQL injection prevention via parameterized queries
- [ ] Digital signatures validated before storage

---

## Useful Views

### v_policies_due_for_review
Lists all active policies needing review.
```sql
SELECT * FROM v_policies_due_for_review;
```

---

### v_employee_compliance
Per-employee compliance dashboard.
```sql
SELECT * FROM v_employee_compliance WHERE employee_id = $1;
```

---

### v_policy_execution_summary
Execution statistics by policy.
```sql
SELECT * FROM v_policy_execution_summary
WHERE last_execution > CURRENT_DATE - INTERVAL '30 days';
```

---

### v_policy_execution_failures
Recent failed executions with details.
```sql
SELECT * FROM v_policy_execution_failures LIMIT 20;
```

---

## Migration Files Reference

| File | Purpose | Dependencies |
|------|---------|--------------|
| `022_policy_templates_library.sql` | Core policy tables | None |
| `037_policy_executions.sql` | Execution audit trail | 022 |
| `038_policy_conditions_actions.sql` | Automation schema | 022 |

**Migration Order:**
1. Run `022_policy_templates_library.sql` first
2. Then `037_policy_executions.sql`
3. Finally `038_policy_conditions_actions.sql`

---

## Related Documentation

- **Full Schema Report:** `POLICY_ENGINE_DATABASE_SCHEMA_REPORT.md`
- **Visual Diagrams:** `POLICY_ENGINE_SCHEMA_DIAGRAM.md`
- **API Integration:** (Coming soon)
- **Frontend Guide:** (Coming soon)

---

**Version:** 1.0
**Last Updated:** January 2, 2026
**Maintainer:** Fleet Management Development Team
