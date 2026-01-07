# Policy Engine API Reference

Complete API documentation for the Policy Engine, including all endpoints, request/response examples, authentication, and error codes.

---

## Table of Contents

1. [Base URL and Versioning](#base-url-and-versioning)
2. [Authentication](#authentication)
3. [Request/Response Format](#requestresponse-format)
4. [Rate Limiting](#rate-limiting)
5. [Policy Templates Endpoints](#policy-templates-endpoints)
6. [Policy Acknowledgments Endpoints](#policy-acknowledgments-endpoints)
7. [Policy Violations Endpoints](#policy-violations-endpoints)
8. [Compliance Audits Endpoints](#compliance-audits-endpoints)
9. [Dashboard & Analytics Endpoints](#dashboard--analytics-endpoints)
10. [Error Codes](#error-codes)
11. [Webhooks](#webhooks)
12. [Code Examples](#code-examples)

---

## Base URL and Versioning

**Base URL**: `https://api.fleetplatform.com`

**Current Version**: `v1`

**Full Endpoint Pattern**: `https://api.fleetplatform.com/api/{resource}`

Example: `https://api.fleetplatform.com/api/policy-templates`

---

## Authentication

All API requests require JWT (JSON Web Token) authentication.

### Obtaining a Token

**Endpoint**: `POST /api/auth/login`

**Request**:
```http
POST /api/auth/login HTTP/1.1
Host: api.fleetplatform.com
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 123,
    "email": "user@example.com",
    "role": "fleet_manager",
    "tenant_id": 1
  }
}
```

### Using the Token

Include the token in the `Authorization` header for all subsequent requests:

```http
GET /api/policy-templates HTTP/1.1
Host: api.fleetplatform.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Expiration

Tokens expire after 24 hours. Refresh before expiration:

**Endpoint**: `POST /api/auth/refresh`

**Request**:
```http
POST /api/auth/refresh HTTP/1.1
Host: api.fleetplatform.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2026-01-03T12:00:00Z"
}
```

### Permissions

Policy endpoints require specific permissions:

| Permission | Description |
|------------|-------------|
| `policy:view:global` | View all policies |
| `policy:create:global` | Create new policies |
| `policy:update:global` | Update existing policies |
| `policy:delete:global` | Delete policies (also used for creating violations) |

**Check User Permissions**:
```typescript
// Included in JWT payload
{
  "user_id": 123,
  "tenant_id": 1,
  "permissions": ["policy:view:global", "policy:create:global"]
}
```

---

## Request/Response Format

### Request Headers

```http
POST /api/policy-templates HTTP/1.1
Host: api.fleetplatform.com
Content-Type: application/json
Authorization: Bearer {token}
X-CSRF-Token: {csrf_token}  # Required for POST/PUT/DELETE
```

### Response Format

All responses follow this structure:

**Success Response** (200, 201):
```json
{
  "data": { /* resource data */ },
  "pagination": {  // Only for list endpoints
    "page": 1,
    "limit": 50,
    "total": 150,
    "pages": 3
  }
}
```

**Error Response** (4xx, 5xx):
```json
{
  "error": "Error message",
  "code": "POL-001",
  "details": {
    "field": "policy_id",
    "reason": "Policy not found"
  }
}
```

### Pagination

List endpoints support pagination via query parameters:

- `page` (default: 1): Page number
- `limit` (default: 50, max: 100): Items per page

**Example**:
```http
GET /api/policy-templates?page=2&limit=25
```

**Response**:
```json
{
  "data": [ /* 25 policies */ ],
  "pagination": {
    "page": 2,
    "limit": 25,
    "total": 150,
    "pages": 6
  }
}
```

---

## Rate Limiting

**Limits**:
- 1000 requests per hour per user
- 10,000 requests per hour per tenant

**Rate Limit Headers**:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 1641024000
```

**Rate Limit Exceeded Response** (429):
```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 3600
}
```

---

## Policy Templates Endpoints

### List Policy Templates

Retrieve all policy templates with optional filtering.

**Endpoint**: `GET /api/policy-templates`

**Permissions Required**: `policy:view:global`

**Query Parameters**:
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Items per page (default: 50, max: 100)
- `category` (string, optional): Filter by category (`Safety`, `HR`, `Operations`, `Maintenance`, `Compliance`, `Environmental`)
- `status` (string, optional): Filter by status (`Draft`, `Pending Approval`, `Active`, `Archived`, `Superseded`)

**Request**:
```http
GET /api/policy-templates?category=Safety&status=Active&page=1&limit=10 HTTP/1.1
Host: api.fleetplatform.com
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 1,
      "policy_code": "FLT-SAF-001",
      "policy_name": "Comprehensive Safety Incident Reporting",
      "policy_category": "Safety",
      "sub_category": "OSHA Compliance",
      "policy_objective": "Ensure all OSHA-recordable injuries are reported within 24 hours",
      "policy_scope": "All drivers and field personnel",
      "policy_content": "# Policy Content...",
      "procedures": "# Step-by-step procedures...",
      "regulatory_references": ["OSHA 29 CFR 1904", "OSHA 1904.4"],
      "industry_standards": ["ANSI Z16.1"],
      "responsible_roles": {
        "driver": ["Report incidents", "Provide evidence"],
        "supervisor": ["Review reports", "Investigate"]
      },
      "approval_required_from": ["supervisor", "safety_manager"],
      "version": "1.0",
      "effective_date": "2026-01-01",
      "review_cycle_months": 12,
      "next_review_date": "2027-01-01",
      "expiration_date": null,
      "supersedes_policy_id": null,
      "status": "Active",
      "is_mandatory": true,
      "applies_to_roles": ["driver", "mechanic", "supervisor"],
      "requires_training": true,
      "requires_test": true,
      "test_questions": [
        {
          "question": "When must OSHA-recordable injuries be reported?",
          "options": ["Immediately", "Within 24 hours", "Within 7 days", "Within 30 days"],
          "correct_answer": 1
        }
      ],
      "related_forms": [101, 102],
      "attachments": [
        {
          "filename": "OSHA_300_Log_Template.pdf",
          "url": "https://storage.fleetplatform.com/attachments/osha_300.pdf",
          "description": "OSHA 300 Log Template"
        }
      ],
      "times_acknowledged": 45,
      "last_acknowledged_at": "2026-01-02T10:30:00Z",
      "created_at": "2025-12-01T09:00:00Z",
      "created_by": 5,
      "updated_at": "2025-12-15T14:30:00Z",
      "updated_by": 5,
      "approved_at": "2025-12-20T16:00:00Z",
      "approved_by": 10
    }
    // ... more policies
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 23,
    "pages": 3
  }
}
```

---

### Get Single Policy Template

Retrieve a specific policy template by ID.

**Endpoint**: `GET /api/policy-templates/:id`

**Permissions Required**: `policy:view:global`

**Request**:
```http
GET /api/policy-templates/1 HTTP/1.1
Host: api.fleetplatform.com
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "id": 1,
  "policy_code": "FLT-SAF-001",
  "policy_name": "Comprehensive Safety Incident Reporting",
  // ... (same structure as list endpoint)
}
```

**Error Response** (404 Not Found):
```json
{
  "error": "Policy template not found",
  "code": "POL-001"
}
```

---

### Create Policy Template

Create a new policy template.

**Endpoint**: `POST /api/policy-templates`

**Permissions Required**: `policy:create:global`

**Headers Required**:
- `X-CSRF-Token`: CSRF protection token

**Request**:
```http
POST /api/policy-templates HTTP/1.1
Host: api.fleetplatform.com
Authorization: Bearer {token}
X-CSRF-Token: {csrf_token}
Content-Type: application/json

{
  "policy_code": "FLT-SAF-002",
  "policy_name": "Driver Safety Training",
  "policy_category": "Safety",
  "sub_category": "Training",
  "policy_objective": "Ensure all drivers complete annual safety training",
  "policy_scope": "All drivers",
  "policy_content": "# Policy Content\n\nAll drivers must complete...",
  "procedures": "# Procedures\n\n1. Enroll in training...",
  "regulatory_references": ["FMCSA 49 CFR 380"],
  "industry_standards": ["NHTSA Guidelines"],
  "responsible_roles": {
    "driver": ["Complete training", "Pass test"],
    "hr_manager": ["Track completion", "Schedule training"]
  },
  "approval_required_from": ["hr_manager"],
  "version": "1.0",
  "effective_date": "2026-02-01",
  "review_cycle_months": 12,
  "status": "Draft",
  "is_mandatory": true,
  "applies_to_roles": ["driver"],
  "requires_training": true,
  "requires_test": true,
  "test_questions": []
}
```

**Response** (201 Created):
```json
{
  "id": 24,
  "policy_code": "FLT-SAF-002",
  "policy_name": "Driver Safety Training",
  // ... (full policy object)
  "created_at": "2026-01-02T15:45:00Z",
  "created_by": 123
}
```

**Error Response** (400 Bad Request):
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "policy_code",
    "reason": "Policy code already exists"
  }
}
```

---

### Update Policy Template

Update an existing policy template.

**Endpoint**: `PUT /api/policy-templates/:id`

**Permissions Required**: `policy:update:global`

**Headers Required**:
- `X-CSRF-Token`: CSRF protection token

**Request**:
```http
PUT /api/policy-templates/24 HTTP/1.1
Host: api.fleetplatform.com
Authorization: Bearer {token}
X-CSRF-Token: {csrf_token}
Content-Type: application/json

{
  "status": "Pending Approval",
  "policy_content": "# Updated Policy Content..."
}
```

**Response** (200 OK):
```json
{
  "id": 24,
  "policy_code": "FLT-SAF-002",
  "status": "Pending Approval",
  "policy_content": "# Updated Policy Content...",
  // ... (full policy object)
  "updated_at": "2026-01-02T16:00:00Z",
  "updated_by": 123
}
```

**Error Response** (404 Not Found):
```json
{
  "error": "Policy template not found",
  "code": "POL-001"
}
```

---

## Policy Acknowledgments Endpoints

### Get Policy Acknowledgments

Retrieve all acknowledgments for a specific policy.

**Endpoint**: `GET /api/policy-templates/:id/acknowledgments`

**Permissions Required**: `policy:view:global`

**Request**:
```http
GET /api/policy-templates/1/acknowledgments HTTP/1.1
Host: api.fleetplatform.com
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 501,
      "policy_id": 1,
      "employee_id": 42,
      "employee_name": "John Doe",
      "employee_number": "EMP-042",
      "acknowledged_at": "2026-01-02T09:15:00Z",
      "acknowledgment_method": "Electronic",
      "signature_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
      "ip_address": "192.168.1.100",
      "device_info": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "test_taken": true,
      "test_score": 95.00,
      "test_passed": true,
      "training_completed": true,
      "training_completed_at": "2026-01-02T09:00:00Z",
      "training_duration_minutes": 30,
      "is_current": true,
      "superseded_by_acknowledgment_id": null
    }
    // ... more acknowledgments
  ]
}
```

---

### Acknowledge Policy

Employee acknowledges a policy (digital signature).

**Endpoint**: `POST /api/policy-templates/:id/acknowledge`

**Permissions Required**: `policy:create:global`

**Headers Required**:
- `X-CSRF-Token`: CSRF protection token

**Request**:
```http
POST /api/policy-templates/1/acknowledge HTTP/1.1
Host: api.fleetplatform.com
Authorization: Bearer {token}
X-CSRF-Token: {csrf_token}
Content-Type: application/json

{
  "signature_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "ip_address": "192.168.1.100",
  "device_info": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  "test_taken": true,
  "test_score": 95.00,
  "test_passed": true
}
```

**Response** (201 Created):
```json
{
  "id": 502,
  "policy_id": 1,
  "employee_id": 123,
  "acknowledged_at": "2026-01-02T16:30:00Z",
  "acknowledgment_method": "Electronic",
  "signature_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "ip_address": "192.168.1.100",
  "device_info": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  "test_taken": true,
  "test_score": 95.00,
  "test_passed": true,
  "training_completed": false,
  "is_current": true
}
```

**Notes**:
- Automatically marks previous acknowledgments as `is_current = false`
- Updates policy's `times_acknowledged` count
- If `test_passed = false`, acknowledgment may be rejected (depending on policy settings)

---

## Policy Violations Endpoints

### List Policy Violations

Retrieve policy violations with optional filtering.

**Endpoint**: `GET /api/policy-templates/violations`

**Permissions Required**: `policy:view:global`

**Query Parameters**:
- `page` (integer, optional): Page number
- `limit` (integer, optional): Items per page
- `employee_id` (integer, optional): Filter by employee
- `policy_id` (integer, optional): Filter by policy
- `severity` (string, optional): Filter by severity (`Minor`, `Moderate`, `Serious`, `Critical`)

**Request**:
```http
GET /api/policy-templates/violations?severity=Critical&page=1&limit=10 HTTP/1.1
Host: api.fleetplatform.com
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 301,
      "policy_id": 1,
      "policy_name": "Comprehensive Safety Incident Reporting",
      "employee_id": 42,
      "employee_name": "John Doe",
      "employee_number": "EMP-042",
      "violation_date": "2026-01-02",
      "violation_time": "14:30:00",
      "location": "Main Depot",
      "violation_description": "Failed to report OSHA-recordable injury within 24 hours",
      "severity": "Critical",
      "vehicle_id": 15,
      "related_incident_id": 205,
      "witnesses": ["Jane Smith", "Bob Johnson"],
      "witness_statements": [
        "I saw the incident occur...",
        "I was present when..."
      ],
      "investigation_notes": "Employee forgot to submit report immediately after incident.",
      "root_cause": "Lack of awareness of 24-hour reporting requirement",
      "disciplinary_action": "Written Warning",
      "action_description": "First violation - written warning issued. Employee required to retake safety training.",
      "action_date": "2026-01-03",
      "action_taken_by": "Safety Manager",
      "is_repeat_offense": false,
      "previous_violations": [],
      "offense_count": 1,
      "training_required": true,
      "training_completed": false,
      "training_completion_date": null,
      "employee_statement": "I apologize for the delay. I was unaware of the 24-hour deadline.",
      "employee_acknowledged": true,
      "employee_acknowledged_date": "2026-01-03",
      "employee_signature": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
      "appeal_filed": false,
      "case_status": "Closed",
      "created_at": "2026-01-02T15:00:00Z",
      "created_by": 10,
      "updated_at": "2026-01-03T10:00:00Z"
    }
    // ... more violations
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "pages": 1
  }
}
```

---

### Report Policy Violation

Create a new policy violation record.

**Endpoint**: `POST /api/policy-templates/violations`

**Permissions Required**: `policy:delete:global` (Note: Uses delete permission for historical reasons)

**Headers Required**:
- `X-CSRF-Token`: CSRF protection token

**Request**:
```http
POST /api/policy-templates/violations HTTP/1.1
Host: api.fleetplatform.com
Authorization: Bearer {token}
X-CSRF-Token: {csrf_token}
Content-Type: application/json

{
  "policy_id": 1,
  "employee_id": 42,
  "violation_date": "2026-01-02",
  "violation_time": "14:30:00",
  "location": "Main Depot",
  "violation_description": "Failed to report OSHA-recordable injury within 24 hours",
  "severity": "Critical",
  "vehicle_id": 15,
  "related_incident_id": 205,
  "witnesses": ["Jane Smith", "Bob Johnson"],
  "investigation_notes": "Employee forgot to submit report immediately after incident."
}
```

**Response** (201 Created):
```json
{
  "id": 302,
  "policy_id": 1,
  "employee_id": 42,
  "violation_date": "2026-01-02",
  // ... (full violation object)
  "case_status": "Open",
  "created_at": "2026-01-02T16:45:00Z",
  "created_by": 10
}
```

---

## Compliance Audits Endpoints

### List Compliance Audits

Retrieve policy compliance audits.

**Endpoint**: `GET /api/policy-templates/audits`

**Permissions Required**: `policy:view:global`

**Query Parameters**:
- `page` (integer, optional): Page number
- `limit` (integer, optional): Items per page
- `policy_id` (integer, optional): Filter by policy

**Request**:
```http
GET /api/policy-templates/audits?policy_id=1&page=1&limit=10 HTTP/1.1
Host: api.fleetplatform.com
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 401,
      "policy_id": 1,
      "policy_name": "Comprehensive Safety Incident Reporting",
      "audit_date": "2025-12-15",
      "auditor_name": "Safety Manager",
      "audit_type": "Scheduled",
      "location": "Main Depot",
      "department": "Fleet Operations",
      "employees_audited": [42, 43, 44, 45],
      "vehicles_audited": [15, 16, 17],
      "compliance_score": 92.50,
      "compliant_items": 37,
      "non_compliant_items": 3,
      "findings": [
        {
          "description": "3 incidents not reported within 24 hours",
          "severity": "Moderate",
          "responsible_party": "Drivers",
          "corrective_action": "Retrain drivers on reporting procedures"
        }
      ],
      "corrective_actions_required": true,
      "corrective_actions": [
        "Schedule safety training for all drivers",
        "Add mobile incident reporting reminder notifications"
      ],
      "corrective_actions_completed": false,
      "corrective_actions_due_date": "2026-01-15",
      "follow_up_required": true,
      "follow_up_date": "2026-02-01",
      "follow_up_completed": false,
      "audit_report_url": "https://storage.fleetplatform.com/audits/audit_401.pdf",
      "photos_urls": [
        "https://storage.fleetplatform.com/audits/audit_401_photo1.jpg"
      ],
      "created_at": "2025-12-15T16:00:00Z",
      "created_by": 10
    }
    // ... more audits
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "pages": 1
  }
}
```

---

### Create Compliance Audit

Create a new policy compliance audit.

**Endpoint**: `POST /api/policy-templates/audits`

**Permissions Required**: `policy:create:global`

**Headers Required**:
- `X-CSRF-Token`: CSRF protection token

**Request**:
```http
POST /api/policy-templates/audits HTTP/1.1
Host: api.fleetplatform.com
Authorization: Bearer {token}
X-CSRF-Token: {csrf_token}
Content-Type: application/json

{
  "policy_id": 1,
  "audit_date": "2026-01-02",
  "auditor_name": "Safety Manager",
  "audit_type": "Random",
  "location": "Main Depot",
  "department": "Fleet Operations",
  "employees_audited": [42, 43, 44],
  "vehicles_audited": [15, 16],
  "compliance_score": 95.00,
  "compliant_items": 19,
  "non_compliant_items": 1,
  "findings": [
    {
      "description": "1 incident report missing photo evidence",
      "severity": "Minor",
      "responsible_party": "Driver #42",
      "corrective_action": "Remind driver to attach photos"
    }
  ],
  "corrective_actions_required": true,
  "corrective_actions": ["Add photo requirement reminder to app"],
  "corrective_actions_due_date": "2026-01-15"
}
```

**Response** (201 Created):
```json
{
  "id": 402,
  "policy_id": 1,
  "audit_date": "2026-01-02",
  // ... (full audit object)
  "created_at": "2026-01-02T17:00:00Z",
  "created_by": 10
}
```

---

## Dashboard & Analytics Endpoints

### Get Policy Dashboard

Retrieve policy metrics and analytics.

**Endpoint**: `GET /api/policy-templates/dashboard`

**Permissions Required**: `policy:view:global`

**Request**:
```http
GET /api/policy-templates/dashboard HTTP/1.1
Host: api.fleetplatform.com
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "policies": {
    "active_policies": 15,
    "overdue_reviews": 2,
    "upcoming_reviews": 3
  },
  "compliance": {
    "total_employees": 80,
    "compliant_employees": 72
  },
  "violations": [
    {
      "severity": "Critical",
      "count": 2
    },
    {
      "severity": "Serious",
      "count": 5
    },
    {
      "severity": "Moderate",
      "count": 12
    },
    {
      "severity": "Minor",
      "count": 8
    }
  ]
}
```

---

### Get Employee Compliance

Retrieve compliance status for a specific employee.

**Endpoint**: `GET /api/policy-templates/compliance/employee/:employee_id`

**Permissions Required**: `policy:view:global`

**Request**:
```http
GET /api/policy-templates/compliance/employee/42 HTTP/1.1
Host: api.fleetplatform.com
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "employee_id": 42,
  "employee_name": "John Doe",
  "total_policies": 15,
  "acknowledged_policies": 13,
  "pending_acknowledgments": 2,
  "last_acknowledgment_date": "2026-01-02T09:15:00Z"
}
```

**Error Response** (404 Not Found):
```json
{
  "error": "Employee not found",
  "code": "POL-001"
}
```

---

## Error Codes

| Code | HTTP Status | Message | Cause | Solution |
|------|-------------|---------|-------|----------|
| `POL-001` | 404 | Policy not found | Invalid policy ID | Verify policy ID exists |
| `POL-002` | 500 | Policy evaluation failed | Exception during evaluation | Check condition syntax |
| `POL-003` | 403 | Insufficient permissions | User lacks required permission | Grant appropriate permission |
| `POL-004` | 400 | Policy in draft status | Attempting to enforce non-active policy | Activate policy first |
| `POL-005` | 400 | Condition field missing | Context doesn't contain required field | Add field to context |
| `POL-006` | 400 | Dual control violation | Policy requires two approvers | Add second approver |
| `POL-007` | 401 | MFA required | Policy requires MFA | Prompt user for MFA |
| `VALIDATION_ERROR` | 400 | Validation failed | Invalid request data | Check request body |
| `RATE_LIMIT_EXCEEDED` | 429 | Rate limit exceeded | Too many requests | Wait and retry |
| `UNAUTHORIZED` | 401 | Unauthorized | Missing or invalid token | Authenticate and obtain valid token |
| `FORBIDDEN` | 403 | Forbidden | Insufficient permissions | Request permission from admin |
| `INTERNAL_SERVER_ERROR` | 500 | Internal server error | Server-side error | Contact support |

---

## Webhooks

Subscribe to policy events via webhooks.

### Supported Events

| Event | Trigger | Payload |
|-------|---------|---------|
| `policy.created` | New policy created | Full policy object |
| `policy.updated` | Policy updated | Full policy object |
| `policy.activated` | Policy status changed to Active | Full policy object |
| `policy.deactivated` | Policy status changed from Active | Full policy object |
| `policy.acknowledged` | Employee acknowledges policy | Acknowledgment object |
| `policy.violated` | Policy violation recorded | Violation object |
| `policy.audit_completed` | Compliance audit completed | Audit object |

### Webhook Configuration

**Endpoint**: `POST /api/webhooks`

**Request**:
```http
POST /api/webhooks HTTP/1.1
Host: api.fleetplatform.com
Authorization: Bearer {token}
X-CSRF-Token: {csrf_token}
Content-Type: application/json

{
  "url": "https://your-app.com/webhooks/policy",
  "events": ["policy.violated", "policy.activated"],
  "secret": "your-webhook-secret"
}
```

### Webhook Payload Example

```json
{
  "event": "policy.violated",
  "timestamp": "2026-01-02T16:45:00Z",
  "data": {
    "id": 302,
    "policy_id": 1,
    "policy_name": "Comprehensive Safety Incident Reporting",
    "employee_id": 42,
    "employee_name": "John Doe",
    "severity": "Critical",
    "violation_description": "Failed to report OSHA-recordable injury within 24 hours"
    // ... (full violation object)
  },
  "signature": "sha256=..."
}
```

### Verifying Webhook Signatures

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

---

## Code Examples

### JavaScript/TypeScript (Fetch API)

```typescript
// Get policy templates
async function getPolicyTemplates(category?: string, status?: string) {
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  if (status) params.append('status', status);

  const response = await fetch(
    `https://api.fleetplatform.com/api/policy-templates?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

// Create policy template
async function createPolicyTemplate(policyData: any) {
  const response = await fetch(
    'https://api.fleetplatform.com/api/policy-templates',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
        'X-CSRF-Token': getCsrfToken()
      },
      body: JSON.stringify(policyData)
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create policy');
  }

  return await response.json();
}

// Acknowledge policy
async function acknowledgePolicy(policyId: number, signatureData: string) {
  const response = await fetch(
    `https://api.fleetplatform.com/api/policy-templates/${policyId}/acknowledge`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
        'X-CSRF-Token': getCsrfToken()
      },
      body: JSON.stringify({
        signature_data: signatureData,
        ip_address: await getClientIp(),
        device_info: navigator.userAgent
      })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to acknowledge policy');
  }

  return await response.json();
}
```

### Python (Requests Library)

```python
import requests

BASE_URL = "https://api.fleetplatform.com/api"

class PolicyAPIClient:
    def __init__(self, token):
        self.token = token
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

    def get_policy_templates(self, category=None, status=None, page=1, limit=50):
        params = {
            'page': page,
            'limit': limit
        }
        if category:
            params['category'] = category
        if status:
            params['status'] = status

        response = requests.get(
            f'{BASE_URL}/policy-templates',
            headers=self.headers,
            params=params
        )
        response.raise_for_status()
        return response.json()

    def create_policy_template(self, policy_data, csrf_token):
        headers = {**self.headers, 'X-CSRF-Token': csrf_token}
        response = requests.post(
            f'{BASE_URL}/policy-templates',
            headers=headers,
            json=policy_data
        )
        response.raise_for_status()
        return response.json()

    def get_dashboard_metrics(self):
        response = requests.get(
            f'{BASE_URL}/policy-templates/dashboard',
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

# Usage
client = PolicyAPIClient(token='your-jwt-token')
policies = client.get_policy_templates(category='Safety', status='Active')
print(f"Found {len(policies['data'])} active safety policies")
```

### cURL

```bash
# Get policy templates
curl -X GET "https://api.fleetplatform.com/api/policy-templates?category=Safety&status=Active" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create policy template
curl -X POST "https://api.fleetplatform.com/api/policy-templates" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "policy_code": "FLT-SAF-002",
    "policy_name": "Driver Safety Training",
    "policy_category": "Safety",
    "policy_objective": "Ensure all drivers complete annual safety training",
    "policy_scope": "All drivers",
    "status": "Draft",
    "is_mandatory": true
  }'

# Acknowledge policy
curl -X POST "https://api.fleetplatform.com/api/policy-templates/1/acknowledge" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "signature_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "ip_address": "192.168.1.100",
    "device_info": "curl/7.68.0"
  }'
```

---

## API Client SDKs

Official SDKs are available for:

- **JavaScript/TypeScript**: `npm install @fleetplatform/policy-sdk`
- **Python**: `pip install fleetplatform-policy`
- **C#/.NET**: `dotnet add package FleetPlatform.Policy`
- **Java**: `implementation 'com.fleetplatform:policy-sdk:1.0.0'`

---

## Postman Collection

Import our Postman collection for easy API testing:

**Collection URL**: `https://api.fleetplatform.com/postman/policy-engine-collection.json`

---

## Support

For API support:

- **Email**: api-support@fleetplatform.com
- **Docs**: https://docs.fleetplatform.com
- **Status**: https://status.fleetplatform.com
- **Slack Community**: https://fleetplatform.slack.com

---

**Document Version**: 1.0
**Last Updated**: 2026-01-02
**API Version**: v1
**Maintained By**: Fleet Platform API Team
