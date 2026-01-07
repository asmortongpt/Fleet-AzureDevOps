# Policy Engine Database Schema - Visual Diagram

## Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    TENANTS ||--o{ POLICY_TEMPLATES : "has"
    TENANTS ||--o{ DRIVERS : "has"
    TENANTS ||--o{ VEHICLES : "has"
    TENANTS ||--o{ WORK_ORDERS : "has"

    POLICY_TEMPLATES ||--o{ POLICY_ACKNOWLEDGMENTS : "requires"
    POLICY_TEMPLATES ||--o{ POLICY_VIOLATIONS : "tracks"
    POLICY_TEMPLATES ||--o{ POLICY_COMPLIANCE_AUDITS : "audited_by"
    POLICY_TEMPLATES ||--o{ POLICY_EXECUTIONS : "executed_via"
    POLICY_TEMPLATES ||--o| POLICY_TEMPLATES : "supersedes"

    DRIVERS ||--o{ POLICY_ACKNOWLEDGMENTS : "acknowledges"
    DRIVERS ||--o{ POLICY_VIOLATIONS : "commits"
    DRIVERS ||--o{ WORK_ORDERS : "assigned_to"

    VEHICLES ||--o{ POLICY_VIOLATIONS : "involved_in"
    VEHICLES ||--o{ WORK_ORDERS : "requires"
    VEHICLES ||--o{ POLICY_EXECUTIONS : "triggers"

    POLICY_EXECUTIONS ||--o| WORK_ORDERS : "creates"

    POLICY_TEMPLATES {
        serial id PK
        varchar policy_code UK "FLT-SAF-001"
        varchar policy_name "Vehicle Safety Inspection"
        varchar policy_category "Safety, HR, Operations"
        text policy_content "Markdown content"
        text procedures "Step-by-step"
        jsonb conditions "Rule conditions NEW"
        jsonb actions "Automation actions NEW"
        text_array regulatory_references "OSHA, FMCSA, EPA"
        varchar version "1.0, 1.1"
        date effective_date
        date next_review_date
        varchar status "Draft, Active, Archived"
        boolean execution_enabled "Automation flag NEW"
        varchar execution_schedule "daily, weekly NEW"
        timestamp last_execution_at "NEW"
        timestamp next_execution_at "NEW"
    }

    POLICY_ACKNOWLEDGMENTS {
        serial id PK
        int policy_id FK
        int employee_id FK
        timestamp acknowledged_at
        varchar acknowledgment_method "Electronic, Paper"
        text signature_data "Base64 image"
        varchar ip_address
        boolean test_passed
        decimal test_score
        boolean training_completed
        boolean is_current "Version tracking"
    }

    POLICY_VIOLATIONS {
        serial id PK
        int policy_id FK
        int employee_id FK
        int vehicle_id FK
        date violation_date
        varchar severity "Minor, Moderate, Serious, Critical"
        text violation_description
        varchar disciplinary_action
        boolean is_repeat_offense
        int_array previous_violations
        int offense_count "Progressive discipline"
        boolean training_required
        text employee_statement
        boolean appeal_filed
        varchar case_status "Open, Closed, Under Appeal"
    }

    POLICY_COMPLIANCE_AUDITS {
        serial id PK
        int policy_id FK
        date audit_date
        varchar audit_type "Scheduled, Random, Regulatory"
        decimal compliance_score "0-100%"
        int compliant_items
        int non_compliant_items
        jsonb findings "Detailed results"
        int_array employees_audited
        int_array vehicles_audited
        boolean corrective_actions_required
        date corrective_actions_due_date
    }

    POLICY_EXECUTIONS {
        uuid id PK "NEW TABLE"
        uuid tenant_id FK
        int policy_id FK
        varchar trigger_type "scheduled, event, manual"
        varchar trigger_event "inspection_overdue"
        jsonb trigger_data
        boolean conditions_met
        jsonb conditions_evaluated "Check results"
        jsonb actions_executed "Actions taken"
        uuid vehicle_id FK
        uuid driver_id FK
        uuid work_order_id FK "Optionally creates WO"
        varchar execution_status "pending, completed, failed"
        timestamp started_at
        timestamp completed_at
        int duration_ms
        varchar execution_mode "automatic, manual"
    }

    DRIVERS {
        uuid id PK
        uuid tenant_id FK
        varchar first_name
        varchar last_name
        varchar email
        varchar license_number
        timestamp license_expiry_date
        varchar status "active, suspended"
        numeric performance_score
    }

    VEHICLES {
        uuid id PK
        uuid tenant_id FK
        varchar vin
        varchar license_plate
        varchar status "active, out_of_service"
        int mileage
        timestamp inspection_due
        timestamp next_service_date
    }

    WORK_ORDERS {
        uuid id PK
        uuid tenant_id FK
        uuid vehicle_id FK
        uuid assigned_to FK
        varchar work_order_type
        varchar priority "low, medium, high, urgent"
        varchar status "open, in_progress, completed"
    }

    COMPLIANCE_AUDIT_TRAIL {
        uuid id PK
        uuid tenant_id FK
        uuid user_id FK
        varchar compliance_type "OSHA, DOT, EPA, GDPR"
        varchar event_type
        text event_description
        varchar related_resource_type
        uuid related_resource_id
        int retention_years "7-year default"
        timestamp created_at
    }
```

---

## Data Flow Diagram

### Policy Lifecycle with Automation

```mermaid
flowchart TD
    A[Create Policy Template] --> B{Approval Workflow}
    B -->|Approved| C[Publish Policy<br/>status = Active]
    B -->|Rejected| Z[Return to Draft]
    Z --> A

    C --> D{Automation Enabled?}

    D -->|No - Manual Only| E1[Employee Acknowledges]
    D -->|Yes - Automated| E2[Policy Engine Scheduler]

    E1 --> F1[Record Acknowledgment]
    F1 --> G1[Training/Test if Required]
    G1 --> H1[Compliance Tracking]

    E2 --> F2[Evaluate Conditions]
    F2 --> G2{Conditions Met?}

    G2 -->|No| H2[Log Execution<br/>conditions_met = false]
    G2 -->|Yes| I2[Execute Actions]

    I2 --> J2[Send Notifications]
    I2 --> K2[Create Work Orders]
    I2 --> L2[Update Vehicle/Driver Status]

    J2 --> M2[Log to policy_executions]
    K2 --> M2
    L2 --> M2

    M2 --> N2{Success?}
    N2 -->|Yes| O2[execution_status = completed]
    N2 -->|No| P2[execution_status = failed<br/>+ error_message]

    O2 --> Q[Compliance Audit Trail]
    P2 --> R[Alert Admin + Retry]
    H1 --> Q
    H2 --> Q

    Q --> S[Periodic Audit]
    S --> T[Generate Compliance Report]

    style E2 fill:#90EE90
    style I2 fill:#FFD700
    style M2 fill:#87CEEB
```

---

## Policy Execution Flow (Detailed)

```mermaid
sequenceDiagram
    participant Scheduler
    participant PolicyEngine
    participant DB as Database
    participant VehicleService
    participant WorkOrderService
    participant NotificationService
    participant AuditLog

    Scheduler->>PolicyEngine: Trigger scheduled policies (daily)
    PolicyEngine->>DB: SELECT policies WHERE<br/>execution_enabled = TRUE<br/>AND next_execution_at <= NOW()

    DB-->>PolicyEngine: Return active policies

    loop For each policy
        PolicyEngine->>DB: SELECT vehicles/drivers<br/>matching policy scope
        DB-->>PolicyEngine: Return eligible entities

        PolicyEngine->>PolicyEngine: Evaluate conditions JSON<br/>against entity data

        alt Conditions Met
            PolicyEngine->>DB: INSERT INTO policy_executions<br/>(conditions_met = TRUE)

            loop For each action
                alt Action: send_notification
                    PolicyEngine->>NotificationService: sendNotification(template, target)
                    NotificationService-->>PolicyEngine: notification_id
                else Action: create_work_order
                    PolicyEngine->>WorkOrderService: createWorkOrder(params)
                    WorkOrderService->>DB: INSERT INTO work_orders
                    WorkOrderService-->>PolicyEngine: work_order_id
                else Action: update_vehicle_status
                    PolicyEngine->>VehicleService: updateStatus(vehicle_id, new_status)
                    VehicleService->>DB: UPDATE vehicles SET status = ?
                    VehicleService-->>PolicyEngine: success
                end

                PolicyEngine->>DB: UPDATE policy_executions<br/>SET actions_executed = actions_executed || new_action
            end

            PolicyEngine->>DB: UPDATE policy_executions<br/>SET execution_status = 'completed'
            PolicyEngine->>AuditLog: logComplianceEvent(policy_id, action_results)
        else Conditions Not Met
            PolicyEngine->>DB: INSERT INTO policy_executions<br/>(conditions_met = FALSE)
        end

        PolicyEngine->>DB: UPDATE policy_templates<br/>SET last_execution_at = NOW(),<br/>next_execution_at = NOW() + schedule_interval
    end

    PolicyEngine-->>Scheduler: Execution complete
```

---

## Policy Violation Progressive Discipline Flow

```mermaid
stateDiagram-v2
    [*] --> ViolationDetected: Incident Occurs

    ViolationDetected --> Investigation: Create Violation Record

    Investigation --> CheckHistory: Root Cause Analysis

    CheckHistory --> FirstOffense: offense_count = 1
    CheckHistory --> RepeatOffense: offense_count > 1

    FirstOffense --> VerbalWarning: disciplinary_action
    RepeatOffense --> WrittenWarning: offense_count = 2
    RepeatOffense --> Suspension: offense_count = 3
    RepeatOffense --> Termination: offense_count >= 4<br/>OR severity = Critical

    VerbalWarning --> TrainingRequired: Remedial Action
    WrittenWarning --> TrainingRequired
    Suspension --> TrainingRequired

    TrainingRequired --> TrainingComplete: training_completed = TRUE

    TrainingComplete --> EmployeeAcknowledge

    EmployeeAcknowledge --> AppealWindow: employee_acknowledged = TRUE

    AppealWindow --> NoAppeal: 7 days elapsed
    AppealWindow --> AppealFiled: appeal_filed = TRUE

    AppealFiled --> AppealReview: Investigation
    AppealReview --> AppealGranted: Overturned
    AppealReview --> AppealDenied: Upheld

    AppealGranted --> CaseReopened
    AppealDenied --> CaseClosed
    NoAppeal --> CaseClosed

    CaseReopened --> Investigation
    CaseClosed --> [*]
    Termination --> [*]

    note right of FirstOffense
        Progressive Discipline:
        1st: Verbal Warning
        2nd: Written Warning
        3rd: Suspension (1-3 days)
        4th: Termination
    end note
```

---

## Table Relationships Matrix

| From Table | To Table | Relationship | FK Column | Cascade |
|------------|----------|--------------|-----------|---------|
| **policy_templates** | tenants | Many-to-One | (implicit via RLS) | - |
| **policy_templates** | policy_templates | One-to-One | supersedes_policy_id | SET NULL |
| **policy_acknowledgments** | policy_templates | Many-to-One | policy_id | CASCADE |
| **policy_acknowledgments** | drivers | Many-to-One | employee_id | CASCADE |
| **policy_acknowledgments** | policy_acknowledgments | One-to-One | superseded_by_acknowledgment_id | SET NULL |
| **policy_violations** | policy_templates | Many-to-One | policy_id | CASCADE |
| **policy_violations** | drivers | Many-to-One | employee_id | CASCADE |
| **policy_violations** | vehicles | Many-to-One | vehicle_id | SET NULL |
| **policy_compliance_audits** | policy_templates | Many-to-One | policy_id | CASCADE |
| **policy_executions** | policy_templates | Many-to-One | policy_id | CASCADE |
| **policy_executions** | vehicles | Many-to-One | vehicle_id | SET NULL |
| **policy_executions** | drivers | Many-to-One | driver_id | SET NULL |
| **policy_executions** | work_orders | One-to-One | work_order_id | SET NULL |

---

## Indexing Strategy

### Policy Templates Table
```sql
-- Primary queries
CREATE INDEX idx_policies_category ON policy_templates(policy_category);
CREATE INDEX idx_policies_status ON policy_templates(status);
CREATE INDEX idx_policies_effective_date ON policy_templates(effective_date);
CREATE INDEX idx_policies_review_date ON policy_templates(next_review_date);

-- Automation queries
CREATE INDEX idx_policy_templates_execution_enabled ON policy_templates(execution_enabled)
    WHERE execution_enabled = TRUE;
CREATE INDEX idx_policy_templates_next_execution ON policy_templates(next_execution_at)
    WHERE next_execution_at IS NOT NULL;

-- JSONB searches
CREATE INDEX idx_policy_templates_conditions ON policy_templates USING GIN (conditions);
CREATE INDEX idx_policy_templates_actions ON policy_templates USING GIN (actions);
```

### Policy Executions Table
```sql
-- Primary queries
CREATE INDEX idx_policy_executions_tenant ON policy_executions(tenant_id);
CREATE INDEX idx_policy_executions_policy ON policy_executions(policy_id);
CREATE INDEX idx_policy_executions_trigger ON policy_executions(trigger_type);
CREATE INDEX idx_policy_executions_status ON policy_executions(execution_status);

-- Relationship queries
CREATE INDEX idx_policy_executions_vehicle ON policy_executions(vehicle_id)
    WHERE vehicle_id IS NOT NULL;
CREATE INDEX idx_policy_executions_driver ON policy_executions(driver_id)
    WHERE driver_id IS NOT NULL;
CREATE INDEX idx_policy_executions_work_order ON policy_executions(work_order_id)
    WHERE work_order_id IS NOT NULL;

-- Time-series queries
CREATE INDEX idx_policy_executions_started ON policy_executions(started_at);
CREATE INDEX idx_policy_executions_conditions_met ON policy_executions(conditions_met);
```

### Policy Violations Table
```sql
CREATE INDEX idx_violations_policy ON policy_violations(policy_id);
CREATE INDEX idx_violations_employee ON policy_violations(employee_id);
CREATE INDEX idx_violations_date ON policy_violations(violation_date);
CREATE INDEX idx_violations_severity ON policy_violations(severity);
```

---

## Performance Optimization

### Query Patterns

#### 1. Find policies due for execution
```sql
SELECT pt.id, pt.policy_code, pt.conditions, pt.actions
FROM policy_templates pt
WHERE pt.execution_enabled = TRUE
  AND pt.next_execution_at <= CURRENT_TIMESTAMP
  AND pt.status = 'Active'
ORDER BY pt.next_execution_at;
```
**Indexes Used:**
- `idx_policy_templates_next_execution`
- `idx_policies_status`

---

#### 2. Get employee compliance status
```sql
SELECT
    d.id,
    d.first_name || ' ' || d.last_name AS name,
    COUNT(DISTINCT pt.id) AS total_policies,
    COUNT(DISTINCT pa.policy_id) AS acknowledged,
    COUNT(DISTINCT pv.id) FILTER (WHERE pv.severity IN ('Serious', 'Critical')) AS serious_violations
FROM drivers d
CROSS JOIN policy_templates pt
LEFT JOIN policy_acknowledgments pa ON d.id = pa.employee_id
    AND pt.id = pa.policy_id
    AND pa.is_current = TRUE
LEFT JOIN policy_violations pv ON d.id = pv.employee_id
WHERE pt.status = 'Active'
GROUP BY d.id, d.first_name, d.last_name;
```
**Indexes Used:**
- `idx_acknowledgments_employee`
- `idx_violations_employee`
- `idx_policies_status`

---

#### 3. Audit trail for specific vehicle
```sql
SELECT
    pe.started_at,
    pt.policy_name,
    pe.trigger_event,
    pe.conditions_met,
    pe.actions_executed,
    pe.execution_status
FROM policy_executions pe
JOIN policy_templates pt ON pe.policy_id = pt.id
WHERE pe.vehicle_id = $1
ORDER BY pe.started_at DESC
LIMIT 50;
```
**Indexes Used:**
- `idx_policy_executions_vehicle`
- `idx_policy_executions_started`

---

## Data Retention & Archival

```mermaid
flowchart LR
    A[Active Data] --> B{Age Check}
    B -->|< 2 years| C[Hot Storage<br/>Main Tables]
    B -->|2-7 years| D[Warm Storage<br/>Archive Tables]
    B -->|> 7 years| E{Regulatory<br/>Requirement?}

    E -->|Yes| F[Cold Storage<br/>Compliance Archive]
    E -->|No| G[Eligible for Deletion]

    C --> H[Daily Queries]
    D --> I[Reporting Queries]
    F --> J[Audit Requests Only]

    G --> K[Soft Delete<br/>deleted_at timestamp]
    K --> L[Purge after 90 days]

    style C fill:#90EE90
    style D fill:#FFD700
    style F fill:#87CEEB
    style G fill:#FFB6C1
```

### Retention Policy

| Table | Hot Storage | Archive After | Delete After | Notes |
|-------|-------------|---------------|--------------|-------|
| policy_templates | Active versions | Never | Never | Version history preserved |
| policy_acknowledgments | 2 years | 2-7 years | Never | Legal requirement |
| policy_violations | 2 years | 2-7 years | Never | Employment records |
| policy_executions | 90 days | 90 days-2 years | After 7 years | Audit trail |
| policy_compliance_audits | 1 year | 1-7 years | After 10 years | Regulatory compliance |

---

## Security Model

### Row-Level Security (RLS)

```sql
-- Tenant isolation on all tables
CREATE POLICY tenant_isolation_policy_templates ON policy_templates
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_policy_executions ON policy_executions
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Service account read access for monitoring
CREATE POLICY service_account_read_policy_executions ON policy_executions
    FOR SELECT
    USING (
        current_setting('app.service_account', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id')::uuid
    );
```

### Access Control Matrix

| Role | policy_templates | policy_acknowledgments | policy_violations | policy_executions |
|------|-----------------|----------------------|------------------|-------------------|
| **Admin** | Full CRUD | Read Only | Full CRUD | Read Only |
| **Fleet Manager** | Read, Update | Read All | Full CRUD | Read All |
| **Safety Manager** | Read, Update | Read All | Full CRUD | Read All |
| **Mechanic** | Read | None | None | None |
| **Driver** | Read (assigned) | Read/Write (own) | Read (own) | None |
| **System** | Full CRUD | Full CRUD | Read Only | Full CRUD |

---

## Monitoring & Alerts

### Key Metrics to Monitor

```mermaid
graph TD
    A[Policy Engine Monitoring] --> B[Execution Metrics]
    A --> C[Compliance Metrics]
    A --> D[Performance Metrics]

    B --> B1[Execution Success Rate]
    B --> B2[Failed Executions]
    B --> B3[Average Duration]

    C --> C1[Acknowledgment Rate]
    C --> C2[Violation Trends]
    C --> C3[Audit Scores]

    D --> D1[Query Performance]
    D --> D2[Database Load]
    D --> D3[Index Utilization]

    style B1 fill:#90EE90
    style B2 fill:#FFB6C1
    style C1 fill:#87CEEB
```

### Alert Rules

1. **Execution Failure Rate > 5%**
   ```sql
   SELECT
       COUNT(*) FILTER (WHERE execution_status = 'failed') * 100.0 / COUNT(*) AS failure_rate
   FROM policy_executions
   WHERE started_at > NOW() - INTERVAL '24 hours';
   ```

2. **Unacknowledged Policies**
   ```sql
   SELECT
       d.email,
       COUNT(*) AS pending_policies
   FROM drivers d
   CROSS JOIN policy_templates pt
   LEFT JOIN policy_acknowledgments pa ON d.id = pa.employee_id AND pt.id = pa.policy_id
   WHERE pt.status = 'Active'
     AND pt.is_mandatory = TRUE
     AND pa.id IS NULL
   GROUP BY d.id, d.email
   HAVING COUNT(*) > 0;
   ```

3. **Overdue Audits**
   ```sql
   SELECT *
   FROM policy_templates
   WHERE status = 'Active'
     AND next_review_date < CURRENT_DATE;
   ```

---

**Diagram Version:** 1.0
**Last Updated:** January 2, 2026
**Author:** Policy Engine Implementation Team
