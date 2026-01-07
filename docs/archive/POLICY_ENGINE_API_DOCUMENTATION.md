# Fleet Policy Engine API - Complete Documentation

**Version:** 1.0.0
**Last Updated:** 2026-01-02
**Base URL:** `/api/policy-templates`

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Policy Template Endpoints](#policy-template-endpoints)
4. [Policy Acknowledgment Endpoints](#policy-acknowledgment-endpoints)
5. [Policy Violation Endpoints](#policy-violation-endpoints)
6. [Policy Audit Endpoints](#policy-audit-endpoints)
7. [Policy Enforcement Middleware](#policy-enforcement-middleware)
8. [Compliance Dashboard](#compliance-dashboard)
9. [Data Models](#data-models)
10. [Error Handling](#error-handling)
11. [Examples](#examples)

---

## Overview

The Fleet Policy Engine API provides comprehensive policy management, enforcement, and compliance tracking for fleet operations. It includes:

- **Policy Templates Library** - Pre-built and custom policies for safety, HR, operations, and compliance
- **Digital Acknowledgments** - Employee policy acknowledgments with digital signatures
- **Policy Enforcement** - Automatic policy checks on critical operations
- **Violation Tracking** - Progressive discipline and policy violation management
- **Compliance Audits** - Scheduled and ad-hoc compliance auditing
- **Analytics Dashboard** - Real-time compliance metrics and reporting

---

## Authentication

All endpoints require JWT authentication via the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

Additionally, mutation endpoints (POST, PUT, DELETE) require CSRF tokens.

**Required Permissions:**
- `policy:view:global` - View policies
- `policy:create:global` - Create policies
- `policy:update:global` - Update/activate/deactivate policies
- `policy:delete:global` - Delete policies and create violations

---

## Policy Template Endpoints

### 1. List Policy Templates

**Endpoint:** `GET /api/policy-templates`

**Description:** Retrieve a paginated list of policy templates with optional filtering.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | integer | No | Page number (default: 1) |
| limit | integer | No | Items per page (default: 50) |
| category | string | No | Filter by category (Safety, HR, Operations, etc.) |
| status | string | No | Filter by status (Draft, Active, Archived, Superseded) |

**Example Request:**
```bash
GET /api/policy-templates?page=1&limit=20&category=Safety&status=Active
```

**Example Response:**
```json
{
  "data": [
    {
      "id": 1,
      "policy_code": "FLT-SAF-001",
      "policy_name": "Vehicle Safety Inspection Policy",
      "policy_category": "Safety",
      "sub_category": "Inspections",
      "policy_objective": "Ensure all vehicles are maintained in safe operating condition",
      "policy_scope": "All company vehicles and drivers",
      "policy_content": "# Vehicle Safety Inspection Policy\n\n## Daily Inspections...",
      "procedures": "1. Complete pre-trip inspection\n2. Complete post-trip inspection...",
      "regulatory_references": ["FMCSA 49 CFR 396.11", "FMCSA 49 CFR 396.13"],
      "industry_standards": ["ISO 9001", "ANSI Z359"],
      "responsible_roles": {
        "safety_manager": ["Review incidents", "Approve procedures"],
        "supervisors": ["Monitor compliance", "Enforce policy"]
      },
      "approval_required_from": ["Safety Manager", "Fleet Director"],
      "version": "1.0",
      "effective_date": "2025-01-01",
      "review_cycle_months": 12,
      "next_review_date": "2026-01-01",
      "expiration_date": null,
      "supersedes_policy_id": null,
      "status": "Active",
      "is_mandatory": true,
      "applies_to_roles": ["driver", "mechanic"],
      "requires_training": true,
      "requires_test": false,
      "test_questions": null,
      "related_forms": [1, 2],
      "attachments": [
        {"filename": "inspection_checklist.pdf", "url": "https://...", "description": "Daily Inspection Checklist"}
      ],
      "times_acknowledged": 45,
      "last_acknowledged_at": "2025-12-20T10:30:00Z",
      "created_at": "2025-01-01T00:00:00Z",
      "created_by": 1,
      "updated_at": "2025-06-15T14:20:00Z",
      "updated_by": 1,
      "approved_at": "2025-01-01T00:00:00Z",
      "approved_by": 1
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

### 2. Get Policy Template by ID

**Endpoint:** `GET /api/policy-templates/:id`

**Description:** Retrieve a single policy template by ID.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | integer | Yes | Policy template ID |

**Example Request:**
```bash
GET /api/policy-templates/1
```

**Example Response:**
```json
{
  "id": 1,
  "policy_code": "FLT-SAF-001",
  "policy_name": "Vehicle Safety Inspection Policy",
  ...
}
```

**Error Responses:**
- `404 Not Found` - Policy template not found

---

### 3. Create Policy Template

**Endpoint:** `POST /api/policy-templates`

**Description:** Create a new policy template.

**Request Body:**
```json
{
  "policy_code": "FLT-SAF-002",
  "policy_name": "Driver Fatigue Management Policy",
  "policy_category": "Safety",
  "sub_category": "Hours of Service",
  "policy_objective": "Prevent accidents caused by driver fatigue",
  "policy_scope": "All commercial drivers",
  "policy_content": "# Driver Fatigue Management\n\n## Hours of Service Limits...",
  "procedures": "1. Log all driving hours\n2. Take required rest breaks...",
  "regulatory_references": ["FMCSA 49 CFR Part 395"],
  "industry_standards": ["ISO 39001"],
  "responsible_roles": {
    "safety_manager": ["Monitor HOS compliance"],
    "drivers": ["Log hours accurately"]
  },
  "approval_required_from": ["Safety Manager"],
  "version": "1.0",
  "effective_date": "2025-02-01",
  "review_cycle_months": 12,
  "status": "Draft",
  "is_mandatory": true,
  "applies_to_roles": ["driver"],
  "requires_training": true,
  "requires_test": true
}
```

**Example Response:**
```json
{
  "id": 15,
  "policy_code": "FLT-SAF-002",
  "policy_name": "Driver Fatigue Management Policy",
  ...
}
```

**Status Code:** `201 Created`

---

### 4. Update Policy Template

**Endpoint:** `PUT /api/policy-templates/:id`

**Description:** Update an existing policy template.

**Request Body:** (Partial update supported)
```json
{
  "policy_content": "Updated content...",
  "version": "1.1",
  "status": "Active"
}
```

**Example Response:**
```json
{
  "id": 15,
  "policy_code": "FLT-SAF-002",
  "version": "1.1",
  "status": "Active",
  ...
}
```

**Error Responses:**
- `404 Not Found` - Policy template not found

---

### 5. Delete Policy Template

**Endpoint:** `DELETE /api/policy-templates/:id`

**Description:** Delete a policy template. If the policy has been acknowledged or has violations, it will be archived instead of deleted.

**Example Response (No acknowledgments):**
```json
{
  "message": "Policy template deleted successfully",
  "policy": { ... }
}
```

**Example Response (Has acknowledgments):**
```json
{
  "message": "Policy archived (cannot delete due to existing acknowledgments or violations)",
  "policy": {
    "id": 15,
    "status": "Archived",
    ...
  }
}
```

**Error Responses:**
- `404 Not Found` - Policy template not found

---

### 6. Activate Policy Template

**Endpoint:** `POST /api/policy-templates/:id/activate`

**Description:** Activate a policy template, setting it to Active status and setting effective/review dates.

**Example Request:**
```bash
POST /api/policy-templates/15/activate
```

**Example Response:**
```json
{
  "message": "Policy template activated successfully",
  "policy": {
    "id": 15,
    "status": "Active",
    "effective_date": "2025-01-02",
    "next_review_date": "2026-01-02",
    "approved_at": "2025-01-02T15:30:00Z",
    "approved_by": 1,
    ...
  }
}
```

**Error Responses:**
- `404 Not Found` - Policy template not found

---

### 7. Deactivate Policy Template

**Endpoint:** `POST /api/policy-templates/:id/deactivate`

**Description:** Deactivate a policy template by archiving it.

**Example Request:**
```bash
POST /api/policy-templates/15/deactivate
```

**Example Response:**
```json
{
  "message": "Policy template deactivated successfully",
  "policy": {
    "id": 15,
    "status": "Archived",
    ...
  }
}
```

**Error Responses:**
- `404 Not Found` - Policy template not found

---

### 8. Execute/Test Policy

**Endpoint:** `POST /api/policy-templates/:id/execute`

**Description:** Test a policy evaluation against provided context. Used for testing policy rules.

**Request Body:**
```json
{
  "context": {
    "employee_id": 42,
    "employee_role": "driver",
    "vehicle_id": 100,
    "operation": "create_maintenance"
  }
}
```

**Example Response:**
```json
{
  "message": "Policy evaluation completed",
  "evaluation": {
    "policy_id": 1,
    "policy_code": "FLT-SAF-001",
    "policy_name": "Vehicle Safety Inspection Policy",
    "evaluated_at": "2025-01-02T15:45:00Z",
    "context": {
      "employee_id": 42,
      "employee_role": "driver"
    },
    "checks": [
      {
        "check": "policy_active",
        "passed": true,
        "message": "Policy is active"
      },
      {
        "check": "employee_acknowledged",
        "passed": true,
        "message": "Employee acknowledged policy on 2025-12-01T09:00:00Z",
        "data": { ... }
      },
      {
        "check": "policy_not_expired",
        "passed": true,
        "message": "Policy valid until 2026-12-31"
      },
      {
        "check": "role_applicability",
        "passed": true,
        "message": "Policy applies to role: driver",
        "applies": true
      }
    ],
    "compliant": true,
    "violations": []
  }
}
```

**Non-Compliant Example:**
```json
{
  "message": "Policy evaluation completed",
  "evaluation": {
    ...
    "compliant": false,
    "violations": [
      {
        "violation_type": "missing_acknowledgment",
        "severity": "Moderate",
        "message": "Mandatory policy not acknowledged by employee"
      }
    ]
  }
}
```

---

## Policy Acknowledgment Endpoints

### 9. Get Policy Acknowledgments

**Endpoint:** `GET /api/policy-templates/:id/acknowledgments`

**Description:** Get all acknowledgments for a specific policy.

**Example Response:**
```json
{
  "data": [
    {
      "id": 100,
      "policy_id": 1,
      "employee_id": 42,
      "employee_name": "John Smith",
      "employee_number": "EMP-42",
      "acknowledged_at": "2025-12-01T09:00:00Z",
      "acknowledgment_method": "Electronic",
      "signature_data": "data:image/png;base64,...",
      "ip_address": "192.168.1.100",
      "device_info": "Mozilla/5.0...",
      "test_taken": true,
      "test_score": 95.00,
      "test_passed": true,
      "training_completed": true,
      "training_completed_at": "2025-11-30T14:00:00Z",
      "training_duration_minutes": 45,
      "is_current": true,
      "superseded_by_acknowledgment_id": null
    }
  ]
}
```

---

### 10. Acknowledge Policy

**Endpoint:** `POST /api/policy-templates/:id/acknowledge`

**Description:** Employee acknowledges a policy with digital signature.

**Request Body:**
```json
{
  "signature_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgA...",
  "ip_address": "192.168.1.100",
  "device_info": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "test_taken": true,
  "test_score": 95.00,
  "test_passed": true
}
```

**Example Response:**
```json
{
  "id": 101,
  "policy_id": 1,
  "employee_id": 42,
  "acknowledged_at": "2025-01-02T16:00:00Z",
  "is_current": true,
  ...
}
```

**Status Code:** `201 Created`

**Side Effects:**
- Previous acknowledgments for this employee/policy are marked as `is_current = false`
- Policy's `times_acknowledged` counter is incremented
- Policy's `last_acknowledged_at` timestamp is updated

---

## Policy Violation Endpoints

### 11. Get Policy Violations (All)

**Endpoint:** `GET /api/policy-templates/violations`

**Description:** Get all policy violations with optional filtering.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | integer | No | Page number (default: 1) |
| limit | integer | No | Items per page (default: 50) |
| employee_id | integer | No | Filter by employee |
| policy_id | integer | No | Filter by policy |
| severity | string | No | Filter by severity (Minor, Moderate, Serious, Critical) |

**Example Response:**
```json
{
  "data": [
    {
      "id": 50,
      "policy_id": 1,
      "policy_name": "Vehicle Safety Inspection Policy",
      "employee_id": 42,
      "employee_name": "John Smith",
      "employee_number": "EMP-42",
      "violation_date": "2025-12-15",
      "violation_time": "08:30:00",
      "location": "Warehouse Yard",
      "violation_description": "Failed to complete pre-trip inspection",
      "severity": "Moderate",
      "vehicle_id": 100,
      "related_incident_id": null,
      "witnesses": ["Jane Doe", "Bob Johnson"],
      "witness_statements": ["Saw driver skip checklist", "No inspection performed"],
      "investigation_notes": "Driver admitted to rushing due to late schedule",
      "root_cause": "Time pressure, inadequate training reinforcement",
      "disciplinary_action": "Written Warning",
      "action_description": "Formal written warning issued, retaining required",
      "action_date": "2025-12-16",
      "action_taken_by": "Safety Manager",
      "is_repeat_offense": false,
      "previous_violations": [],
      "offense_count": 1,
      "training_required": true,
      "training_completed": false,
      "training_completion_date": null,
      "employee_statement": "I understand the importance of safety inspections",
      "employee_acknowledged": true,
      "employee_acknowledged_date": "2025-12-16",
      "employee_signature": "data:image/png;base64,...",
      "appeal_filed": false,
      "case_status": "Action Taken",
      "created_at": "2025-12-15T09:00:00Z",
      "created_by": 1,
      "updated_at": "2025-12-16T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 25,
    "pages": 1
  }
}
```

---

### 12. Get Policy Violations (By Policy)

**Endpoint:** `GET /api/policy-templates/:id/violations`

**Description:** Get all violations for a specific policy.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | integer | No | Page number (default: 1) |
| limit | integer | No | Items per page (default: 50) |

**Example Response:** (Same format as endpoint #11)

---

### 13. Create Policy Violation

**Endpoint:** `POST /api/policy-templates/violations`

**Description:** Record a new policy violation.

**Request Body:**
```json
{
  "policy_id": 1,
  "employee_id": 42,
  "violation_date": "2025-01-02",
  "violation_time": "14:30:00",
  "location": "Downtown Route",
  "violation_description": "Operating vehicle with expired inspection",
  "severity": "Serious",
  "vehicle_id": 100,
  "witnesses": ["Dispatcher"],
  "investigation_notes": "Vehicle inspection expired 3 days ago, driver was notified",
  "disciplinary_action": "Suspension",
  "action_description": "3-day suspension without pay, mandatory retraining",
  "training_required": true
}
```

**Example Response:**
```json
{
  "id": 51,
  "policy_id": 1,
  "employee_id": 42,
  "violation_date": "2025-01-02",
  "severity": "Serious",
  ...
}
```

**Status Code:** `201 Created`

---

## Policy Audit Endpoints

### 14. Get Policy Audits

**Endpoint:** `GET /api/policy-templates/audits`

**Description:** Get policy compliance audits.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | integer | No | Page number (default: 1) |
| limit | integer | No | Items per page (default: 50) |
| policy_id | integer | No | Filter by policy |

**Example Response:**
```json
{
  "data": [
    {
      "id": 10,
      "policy_id": 1,
      "policy_name": "Vehicle Safety Inspection Policy",
      "audit_date": "2025-12-01",
      "auditor_name": "Sarah Johnson",
      "audit_type": "Scheduled",
      "location": "Main Facility",
      "department": "Fleet Operations",
      "employees_audited": [42, 43, 44, 45],
      "vehicles_audited": [100, 101, 102],
      "compliance_score": 92.50,
      "compliant_items": 37,
      "non_compliant_items": 3,
      "findings": [
        {
          "description": "2 vehicles missing fire extinguishers",
          "severity": "Moderate",
          "responsible_party": "Fleet Manager",
          "corrective_action": "Install fire extinguishers immediately"
        },
        {
          "description": "1 driver incomplete inspection logs",
          "severity": "Minor",
          "responsible_party": "Driver Supervisor",
          "corrective_action": "Retrain driver on log procedures"
        }
      ],
      "corrective_actions_required": true,
      "corrective_actions": ["Install missing safety equipment", "Complete driver retraining"],
      "corrective_actions_completed": false,
      "corrective_actions_due_date": "2025-12-15",
      "follow_up_required": true,
      "follow_up_date": "2025-12-20",
      "follow_up_completed": false,
      "audit_report_url": "https://storage.../audit_report_10.pdf",
      "photos_urls": ["https://storage.../photo1.jpg", "https://storage.../photo2.jpg"],
      "created_at": "2025-12-01T16:00:00Z",
      "created_by": 5
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 12,
    "pages": 1
  }
}
```

---

### 15. Create Policy Audit

**Endpoint:** `POST /api/policy-templates/audits`

**Description:** Create a new policy compliance audit record.

**Request Body:**
```json
{
  "policy_id": 1,
  "audit_date": "2025-01-02",
  "auditor_name": "Sarah Johnson",
  "audit_type": "Random",
  "location": "Main Facility",
  "department": "Fleet Operations",
  "employees_audited": [42, 43],
  "vehicles_audited": [100, 101],
  "compliance_score": 95.00,
  "compliant_items": 19,
  "non_compliant_items": 1,
  "findings": [
    {
      "description": "1 inspection form incomplete",
      "severity": "Minor",
      "responsible_party": "Supervisor",
      "corrective_action": "Complete missing fields"
    }
  ],
  "corrective_actions_required": true,
  "corrective_actions": ["Complete inspection forms"],
  "corrective_actions_due_date": "2025-01-05"
}
```

**Example Response:**
```json
{
  "id": 11,
  "policy_id": 1,
  "audit_date": "2025-01-02",
  ...
}
```

**Status Code:** `201 Created`

---

## Policy Enforcement Middleware

### Middleware Integration

The Policy Enforcement middleware automatically checks policies before allowing critical operations.

**Usage in Routes:**
```typescript
import { policyEnforcement } from '../middleware/policy-enforcement'

router.post('/vehicles',
  csrfProtection,
  policyEnforcement(['FLT-SAF-001'], { mode: 'warn', includeInResponse: true }),
  requireRBAC({ ... }),
  asyncHandler(async (req, res) => { ... })
)
```

**Options:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| mode | 'strict' \| 'warn' | 'warn' | strict = block request, warn = allow but log |
| logViolations | boolean | true | Log violations to database |
| includeInResponse | boolean | true | Include evaluation in response.locals |

**Enforcement Logic:**

1. **Policy Active Check** - Ensures policy status is 'Active'
2. **Expiration Check** - Verifies policy has not expired
3. **Acknowledgment Check** - Confirms user has acknowledged mandatory policies
4. **Training Check** - Verifies required training is completed
5. **Test Check** - Ensures required tests are passed

**Response (Strict Mode - Non-Compliant):**
```json
{
  "error": "Policy violation detected",
  "message": "Operation blocked due to policy non-compliance",
  "policy_evaluation": {
    "compliant": false,
    "violations": [
      {
        "policy_id": 1,
        "policy_code": "FLT-SAF-001",
        "policy_name": "Vehicle Safety Inspection Policy",
        "violation_type": "missing_acknowledgment",
        "severity": "Moderate",
        "message": "User has not acknowledged mandatory policy: Vehicle Safety Inspection Policy"
      }
    ],
    "checks_performed": 4,
    "policies_evaluated": 1,
    "timestamp": "2025-01-02T17:00:00Z"
  }
}
```

**Status Code (Strict Mode):** `403 Forbidden`

**Response (Warn Mode):**
Operation proceeds normally. Violations are logged to database and included in `res.locals.policyEvaluation`.

---

## Compliance Dashboard

### 16. Get Employee Compliance Status

**Endpoint:** `GET /api/policy-templates/compliance/employee/:employee_id`

**Description:** Get an individual employee's policy compliance status.

**Example Response:**
```json
{
  "employee_id": 42,
  "employee_name": "John Smith",
  "total_policies": 25,
  "acknowledged_policies": 23,
  "pending_acknowledgments": 2,
  "last_acknowledgment_date": "2025-12-20T10:30:00Z"
}
```

---

### 17. Get Overall Dashboard

**Endpoint:** `GET /api/policy-templates/dashboard`

**Description:** Get organization-wide policy compliance metrics.

**Example Response:**
```json
{
  "policies": {
    "active_policies": 150,
    "overdue_reviews": 5,
    "upcoming_reviews": 12
  },
  "compliance": {
    "total_employees": 200,
    "compliant_employees": 185
  },
  "violations": [
    {
      "severity": "Critical",
      "count": "2"
    },
    {
      "severity": "Serious",
      "count": "8"
    },
    {
      "severity": "Moderate",
      "count": "15"
    },
    {
      "severity": "Minor",
      "count": "25"
    }
  ]
}
```

---

## Data Models

### Policy Template

```typescript
interface PolicyTemplate {
  id: number
  policy_code: string              // Unique code (e.g., 'FLT-SAF-001')
  policy_name: string
  policy_category: string          // Safety, HR, Operations, Maintenance, Compliance, Environmental
  sub_category?: string
  policy_objective: string
  policy_scope: string
  policy_content: string           // Markdown supported
  procedures?: string
  regulatory_references?: string[] // e.g., ['OSHA 1910.134', 'FMCSA 49 CFR 391']
  industry_standards?: string[]    // e.g., ['ISO 9001', 'ANSI Z359']
  responsible_roles?: object       // { role: [responsibilities] }
  approval_required_from?: string[]
  version: string
  effective_date: string
  review_cycle_months?: number
  next_review_date?: string
  expiration_date?: string
  supersedes_policy_id?: number
  status: 'Draft' | 'Pending Approval' | 'Active' | 'Archived' | 'Superseded'
  is_mandatory: boolean
  applies_to_roles?: string[]
  requires_training: boolean
  requires_test: boolean
  test_questions?: object
  related_forms?: number[]
  attachments?: object[]
  times_acknowledged: number
  last_acknowledged_at?: string
  created_at: string
  created_by?: number
  updated_at: string
  updated_by?: number
  approved_at?: string
  approved_by?: number
}
```

### Policy Acknowledgment

```typescript
interface PolicyAcknowledgment {
  id: number
  policy_id: number
  employee_id: number
  acknowledged_at: string
  acknowledgment_method: 'Electronic' | 'Paper' | 'In-Person'
  signature_data?: string          // Base64 encoded image
  ip_address?: string
  device_info?: string
  test_taken: boolean
  test_score?: number
  test_passed: boolean
  training_completed: boolean
  training_completed_at?: string
  training_duration_minutes?: number
  is_current: boolean
  superseded_by_acknowledgment_id?: number
}
```

### Policy Violation

```typescript
interface PolicyViolation {
  id: number
  policy_id: number
  employee_id: number
  violation_date: string
  violation_time?: string
  location?: string
  violation_description: string
  severity: 'Minor' | 'Moderate' | 'Serious' | 'Critical'
  vehicle_id?: number
  related_incident_id?: number
  witnesses?: string[]
  witness_statements?: string[]
  investigation_notes?: string
  root_cause?: string
  disciplinary_action?: 'Verbal Warning' | 'Written Warning' | 'Suspension' | 'Termination' | 'No Action'
  action_description?: string
  action_date?: string
  action_taken_by?: string
  is_repeat_offense: boolean
  previous_violations?: number[]
  offense_count: number
  training_required: boolean
  training_completed: boolean
  training_completion_date?: string
  employee_statement?: string
  employee_acknowledged: boolean
  employee_acknowledged_date?: string
  employee_signature?: string
  appeal_filed: boolean
  appeal_date?: string
  appeal_reason?: string
  appeal_decision?: string
  appeal_decision_date?: string
  case_status: 'Open' | 'Under Investigation' | 'Action Taken' | 'Closed' | 'Under Appeal'
  created_at: string
  created_by?: number
  updated_at: string
}
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "error": "Error type",
  "message": "Human-readable error description"
}
```

### HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET/PUT request |
| 201 | Created | Successful POST request |
| 400 | Bad Request | Invalid request body or parameters |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Policy violation (strict mode) or insufficient permissions |
| 404 | Not Found | Resource not found |
| 500 | Internal Server Error | Unexpected server error |

---

## Examples

### Example 1: Create and Activate a New Policy

```bash
# Step 1: Create policy
curl -X POST https://api.fleet.com/api/policy-templates \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -d '{
    "policy_code": "FLT-OP-101",
    "policy_name": "Smartphone Usage While Driving Policy",
    "policy_category": "Safety",
    "sub_category": "Distracted Driving",
    "policy_objective": "Eliminate distracted driving incidents",
    "policy_scope": "All drivers",
    "policy_content": "# Smartphone Usage Policy\n\n## Prohibited Activities\n- Texting while driving\n- Making calls without hands-free\n...",
    "regulatory_references": ["FMCSA 49 CFR 392.82"],
    "version": "1.0",
    "effective_date": "2025-02-01",
    "review_cycle_months": 12,
    "status": "Draft",
    "is_mandatory": true,
    "applies_to_roles": ["driver"]
  }'

# Response: { "id": 20, ... }

# Step 2: Activate policy
curl -X POST https://api.fleet.com/api/policy-templates/20/activate \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-CSRF-Token: $CSRF_TOKEN"

# Response: { "message": "Policy template activated successfully", "policy": { "id": 20, "status": "Active", ... } }
```

### Example 2: Employee Acknowledges Policy

```bash
curl -X POST https://api.fleet.com/api/policy-templates/20/acknowledge \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -d '{
    "signature_data": "data:image/png;base64,iVBORw0KGgo...",
    "ip_address": "192.168.1.50",
    "device_info": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
    "test_taken": false
  }'

# Response: { "id": 150, "policy_id": 20, "employee_id": 42, "acknowledged_at": "2025-01-02T18:00:00Z", ... }
```

### Example 3: Record a Policy Violation

```bash
curl -X POST https://api.fleet.com/api/policy-templates/violations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -d '{
    "policy_id": 20,
    "employee_id": 55,
    "violation_date": "2025-01-02",
    "violation_time": "10:15:00",
    "location": "Highway 101 NB",
    "violation_description": "Driver observed texting while vehicle in motion",
    "severity": "Serious",
    "vehicle_id": 120,
    "witnesses": ["Public caller"],
    "investigation_notes": "Dashboard camera confirms violation, driver admits to checking GPS",
    "disciplinary_action": "Written Warning",
    "action_description": "Final written warning, smartphone confiscated during shifts",
    "training_required": true
  }'

# Response: { "id": 75, "case_status": "Action Taken", ... }
```

### Example 4: Test Policy Compliance Before Operation

```bash
curl -X POST https://api.fleet.com/api/policy-templates/1/execute \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -d '{
    "context": {
      "employee_id": 42,
      "employee_role": "driver",
      "vehicle_id": 100,
      "operation": "create_maintenance"
    }
  }'

# Response:
# {
#   "message": "Policy evaluation completed",
#   "evaluation": {
#     "policy_code": "FLT-SAF-001",
#     "compliant": true,
#     "checks": [ ... ],
#     "violations": []
#   }
# }
```

### Example 5: Get Compliance Dashboard

```bash
curl -X GET https://api.fleet.com/api/policy-templates/dashboard \
  -H "Authorization: Bearer $TOKEN"

# Response:
# {
#   "policies": { "active_policies": 150, "overdue_reviews": 5, "upcoming_reviews": 12 },
#   "compliance": { "total_employees": 200, "compliant_employees": 185 },
#   "violations": [ { "severity": "Critical", "count": "2" }, ... ]
# }
```

### Example 6: Middleware Enforcement (Code Example)

```typescript
// In your route file
import { policyEnforcement } from '../middleware/policy-enforcement'

// Example: Vehicle creation requires safety policy acknowledgment
router.post('/vehicles',
  csrfProtection,
  policyEnforcement(['FLT-SAF-001'], {
    mode: 'warn',              // Allow operation but log violations
    logViolations: true,       // Store serious violations in DB
    includeInResponse: true    // Add evaluation to res.locals
  }),
  requireRBAC({ ... }),
  asyncHandler(async (req, res) => {
    // ... vehicle creation logic ...

    // Access policy evaluation result
    const evaluation = res.locals.policyEvaluation
    if (evaluation && !evaluation.compliant) {
      // Optionally include warning in response
      return res.status(201).json({
        data: vehicle,
        warnings: {
          policy_compliance: evaluation.violations
        }
      })
    }

    res.status(201).json({ data: vehicle })
  })
)
```

---

## Integration with Critical Routes

The Policy Engine is integrated into the following critical routes:

### Vehicles
- **POST /api/vehicles** - Requires `FLT-SAF-001` (Vehicle Safety Inspection Policy)
- **PUT /api/vehicles/:id** - Requires `FLT-SAF-001`
- **DELETE /api/vehicles/:id** - Requires `FLT-SAF-001`

### Maintenance
- **POST /api/maintenance** - Requires `FLT-SAF-001`

### Fuel Transactions
- **POST /api/fuel-transactions** - Requires `FLT-SAF-001`

**Mode:** All routes use 'warn' mode, allowing operations to proceed while logging violations.

---

## Best Practices

1. **Policy Codes** - Use consistent naming: `[CATEGORY]-[SUBCATEGORY]-[NUMBER]` (e.g., `FLT-SAF-001`)

2. **Versioning** - Increment version when making significant changes. Use semantic versioning (1.0, 1.1, 2.0)

3. **Acknowledgments** - Always collect digital signatures for legal compliance

4. **Violations** - Record violations promptly with detailed notes for progressive discipline tracking

5. **Audits** - Schedule regular audits and follow up on corrective actions

6. **Training** - Link required training to policies and track completion

7. **Review Cycles** - Set appropriate review cycles (typically 12 months) and monitor overdue reviews

8. **Enforcement** - Use 'strict' mode for critical safety policies, 'warn' mode for operational policies

---

## Security Considerations

- All endpoints require JWT authentication
- Mutation endpoints require CSRF tokens
- Tenant isolation enforced on all queries
- Audit logging enabled on all operations
- Digital signatures stored securely
- IP addresses logged for compliance tracking
- Policy violations automatically logged for serious/critical severities

---

## Performance Considerations

- Pagination enabled on all list endpoints (default 50 items)
- Database indexes on:
  - `policy_category`, `status`, `effective_date`, `next_review_date`
  - `policy_id`, `employee_id` (acknowledgments/violations)
  - `violation_date`, `severity` (violations)
  - `audit_date` (audits)
- Policy enforcement middleware caches active policies

---

## Future Enhancements

- [ ] Automated policy review reminders
- [ ] Policy version diff viewer
- [ ] Mobile policy acknowledgment app
- [ ] AI-powered policy compliance suggestions
- [ ] Integration with HR systems for automatic role-based policy assignment
- [ ] Real-time compliance dashboards with charts
- [ ] Bulk policy acknowledgment workflows
- [ ] Policy templates marketplace

---

**For support or questions, contact:** fleet-api-support@example.com

**API Version:** 1.0.0
**Last Updated:** 2026-01-02
