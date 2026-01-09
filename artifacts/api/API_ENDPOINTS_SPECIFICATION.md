# Fleet Management System - API Endpoints Specification

**Generated:** 2026-01-08
**Status:** Complete
**Coverage:** 83 new tables across 10 migrations

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [API Conventions](#api-conventions)
4. [Endpoint Categories](#endpoint-categories)
5. [Detailed Specifications](#detailed-specifications)

---

## Overview

This document provides comprehensive API endpoint specifications for all 83 new database tables added in migrations 005-015. Each endpoint follows REST conventions with consistent request/response patterns.

### Base URL
```
Production: https://proud-bay-0fdc8040f.3.azurestaticapps.net/api
Development: http://localhost:3000/api
```

### API Versioning
```
/api/v1/...  (Current)
```

---

## Authentication & Authorization

### Authentication Methods
1. **JWT Bearer Token** (Primary)
   ```
   Authorization: Bearer <token>
   ```

2. **API Token** (For integrations)
   ```
   Authorization: Bearer <api_token>
   X-API-Key: <api_token>
   ```

### Required Headers
```
Authorization: Bearer <token>
Content-Type: application/json
X-Tenant-ID: <tenant_id>  (Optional - derived from token)
```

### Permission System
- Uses RBAC (Role-Based Access Control) from Migration 013
- Permissions checked via `user_has_permission()` function
- Format: `{resource}.{action}` (e.g., `vehicles.read`, `maintenance.approve`)

---

## API Conventions

### Standard Request Format
```json
{
  "data": {
    // Request payload
  },
  "filters": {
    "page": 1,
    "limit": 50,
    "sort": "created_at",
    "order": "desc"
  }
}
```

### Standard Response Format

#### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "timestamp": "2026-01-08T12:00:00Z"
}
```

#### Paginated Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 250,
    "pages": 5,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2026-01-08T12:00:00Z"
}
```

#### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "specific_field",
    "message": "Detailed error"
  },
  "timestamp": "2026-01-08T12:00:00Z"
}
```

### HTTP Status Codes
- `200 OK` - Successful GET, PUT, PATCH
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (duplicate)
- `422 Unprocessable Entity` - Business logic error
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

### Query Parameters
```
?page=1                  # Page number (default: 1)
?limit=50                # Items per page (default: 50, max: 100)
?sort=created_at         # Sort field
?order=desc              # Sort order (asc|desc)
?search=query            # Full-text search
?filter[status]=active   # Field filters
?include=related         # Include related resources
```

---

## Endpoint Categories

### 1. Telematics & GPS (Migration 005)
- `/api/v1/vehicle-locations` - Real-time GPS tracking
- `/api/v1/obd-telemetry` - OBD-II diagnostics
- `/api/v1/geofences` - Geographic boundaries
- `/api/v1/geofence-events` - Entry/exit events
- `/api/v1/driver-behavior-events` - Harsh events
- `/api/v1/video-footage` - Dashcam videos
- `/api/v1/trips` - Trip tracking
- `/api/v1/routes` - Route planning
- `/api/v1/trip-classifications` - IRS compliance
- `/api/v1/personal-use-policies` - Personal use policies
- `/api/v1/personal-use-charges` - Personal use billing

### 2. Document Management & RAG (Migration 006)
- `/api/v1/document-folders` - Folder hierarchy
- `/api/v1/documents` - Document CRUD
- `/api/v1/document-shares` - Sharing management
- `/api/v1/document-versions` - Version control
- `/api/v1/document-comments` - Annotations
- `/api/v1/document-ai-analysis` - AI analysis
- `/api/v1/documents/search` - Semantic search (RAG)

### 3. Financial & Accounting (Migration 007)
- `/api/v1/expenses` - Expense reports
- `/api/v1/invoices` - Invoice management
- `/api/v1/purchase-orders` - PO management
- `/api/v1/budget-allocations` - Budget tracking
- `/api/v1/cost-allocations` - Cost distribution
- `/api/v1/depreciation-schedules` - Asset depreciation
- `/api/v1/fuel-cards` - Fuel card management
- `/api/v1/fuel-transactions` - Transaction tracking

### 4. Work Orders & Scheduling (Migration 008)
- `/api/v1/work-order-templates` - Work order templates
- `/api/v1/work-order-tasks` - Task management
- `/api/v1/service-bays` - Bay management
- `/api/v1/service-bay-schedule` - Scheduling
- `/api/v1/technicians` - Technician profiles
- `/api/v1/recurring-maintenance` - PM automation

### 5. Communication & Notifications (Migration 009)
- `/api/v1/notifications` - Notification center
- `/api/v1/notification-preferences` - User preferences
- `/api/v1/messages` - Internal messaging
- `/api/v1/teams-messages` - Teams integration
- `/api/v1/outlook-emails` - Email integration
- `/api/v1/alert-rules` - Alerting configuration
- `/api/v1/alert-history` - Alert tracking

### 6. Safety & Compliance (Migration 010)
- `/api/v1/accident-reports` - Accident reporting
- `/api/v1/safety-inspections` - Safety inspections
- `/api/v1/driver-violations` - Traffic violations
- `/api/v1/compliance-documents` - Document tracking
- `/api/v1/hours-of-service` - DOT HOS logs
- `/api/v1/driver-training` - Training records
- `/api/v1/safety-meetings` - Meeting management
- `/api/v1/insurance-policies` - Insurance tracking

### 7. Asset Management & 3D Models (Migration 011)
- `/api/v1/asset-tags` - Asset tagging
- `/api/v1/asset-transfers` - Transfer tracking
- `/api/v1/turbosquid-models` - 3D model library
- `/api/v1/triposr-generations` - AI 3D generation (photos)
- `/api/v1/meshy-generations` - AI 3D generation (text)

### 8. Reporting & Analytics (Migration 012)
- `/api/v1/saved-reports` - Report management
- `/api/v1/report-executions` - Execution tracking
- `/api/v1/dashboards` - Dashboard management
- `/api/v1/kpi-targets` - KPI tracking
- `/api/v1/benchmark-data` - Industry benchmarks
- `/api/v1/analytics-cache` - Performance cache

### 9. User Management & RBAC (Migration 013)
- `/api/v1/roles` - Role management
- `/api/v1/user-roles` - Role assignments
- `/api/v1/permissions` - Permission definitions
- `/api/v1/user-permissions` - Permission overrides
- `/api/v1/user-activity` - Activity logs
- `/api/v1/api-tokens` - API token management

### 10. Integrations (Migration 014)
- `/api/v1/integrations/microsoft-graph` - Graph sync
- `/api/v1/integrations/calendars` - Calendar sync
- `/api/v1/webhooks` - Webhook subscriptions
- `/api/v1/webhook-deliveries` - Delivery tracking
- `/api/v1/integrations/api` - API integrations
- `/api/v1/integrations/logs` - Integration logs
- `/api/v1/integrations/mappings` - ID mappings

### 11. System & Miscellaneous (Migration 015)
- `/api/v1/audit-trails` - Audit logging
- `/api/v1/system-settings` - Configuration
- `/api/v1/feature-flags` - Feature toggles
- `/api/v1/import-jobs` - Import tracking
- `/api/v1/export-jobs` - Export tracking
- `/api/v1/scheduled-jobs` - Job scheduler
- `/api/v1/job-history` - Execution history
- `/api/v1/retention-policies` - Data lifecycle

---

## Detailed Specifications

### Example: Vehicle Locations API

#### List Vehicle Locations
```
GET /api/v1/vehicle-locations
```

**Query Parameters:**
```
?vehicle_id=<uuid>        # Filter by vehicle
?start_date=<datetime>     # Start of date range
?end_date=<datetime>       # End of date range
?is_moving=true            # Filter by movement
?geofence_id=<uuid>        # Filter by geofence
?page=1&limit=50           # Pagination
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "vehicle_id": "uuid",
      "latitude": 28.5383,
      "longitude": -81.3792,
      "altitude_meters": 50,
      "heading_degrees": 90,
      "speed_mph": 35,
      "accuracy_meters": 5,
      "gps_timestamp": "2026-01-08T12:00:00Z",
      "odometer_reading": 45000,
      "engine_status": "running",
      "ignition_on": true,
      "is_moving": true,
      "address": "123 Main St, Orlando, FL 32801",
      "city": "Orlando",
      "state": "FL",
      "zip_code": "32801",
      "geofence_ids": ["uuid1", "uuid2"],
      "data_source": "geotab",
      "device_id": "GT12345",
      "created_at": "2026-01-08T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1000,
    "pages": 20
  }
}
```

#### Get Latest Location
```
GET /api/v1/vehicle-locations/latest/:vehicle_id
```

**Response:**
```json
{
  "success": true,
  "data": { /* single location object */ }
}
```

#### Create Location (Internal/Integration Use)
```
POST /api/v1/vehicle-locations
```

**Request:**
```json
{
  "vehicle_id": "uuid",
  "latitude": 28.5383,
  "longitude": -81.3792,
  "gps_timestamp": "2026-01-08T12:00:00Z",
  "speed_mph": 35,
  "heading_degrees": 90,
  "odometer_reading": 45000,
  "engine_status": "running"
}
```

**Response:** `201 Created`

#### Get Location History
```
GET /api/v1/vehicle-locations/:vehicle_id/history
```

**Query Parameters:**
```
?start_date=2026-01-01T00:00:00Z
?end_date=2026-01-08T23:59:59Z
?interval=5m  # Aggregation interval (1m, 5m, 15m, 1h)
```

---

### Example: Documents API

#### List Documents
```
GET /api/v1/documents
```

**Query Parameters:**
```
?folder_id=<uuid>              # Filter by folder
?category=<category>            # Filter by category
?tags=tag1,tag2                # Filter by tags
?search=<query>                # Full-text search
?linked_entity_type=vehicle    # Filter by entity type
?linked_entity_id=<uuid>       # Filter by entity ID
?is_expired=false              # Filter expired
?page=1&limit=50               # Pagination
```

#### Get Document
```
GET /api/v1/documents/:id
```

#### Create Document
```
POST /api/v1/documents
Content-Type: multipart/form-data
```

**Form Data:**
```
file: <binary>
document_name: "Vehicle Registration"
folder_id: "uuid"
document_category: "registration"
tags: ["2026", "vehicle-123"]
linked_entity_type: "vehicle"
linked_entity_id: "uuid"
is_confidential: false
expiration_date: "2027-01-01"
```

**Response:** `201 Created`

#### Update Document
```
PATCH /api/v1/documents/:id
```

**Request:**
```json
{
  "document_name": "Updated Name",
  "tags": ["updated", "tag"],
  "expiration_date": "2027-06-01"
}
```

#### Delete Document
```
DELETE /api/v1/documents/:id
```

#### Share Document
```
POST /api/v1/documents/:id/share
```

**Request:**
```json
{
  "share_type": "link",
  "permissions": ["read", "download"],
  "expires_at": "2026-02-08T00:00:00Z",
  "requires_password": true,
  "password": "secure_password",
  "shared_with_email": "user@example.com"
}
```

#### Search Documents (Semantic/RAG)
```
POST /api/v1/documents/search
```

**Request:**
```json
{
  "query": "vehicle maintenance procedures for 2023 Ford F-150",
  "similarity_threshold": 0.7,
  "max_results": 10,
  "filter": {
    "document_category": "manual",
    "linked_entity_type": "vehicle"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "document_id": "uuid",
      "document_name": "F-150 Maintenance Manual",
      "similarity_score": 0.95,
      "relevant_excerpt": "...",
      "url": "https://...",
      "created_at": "2023-01-01T00:00:00Z"
    }
  ]
}
```

#### Request AI Analysis
```
POST /api/v1/documents/:id/analyze
```

**Request:**
```json
{
  "analysis_type": "extraction",
  "ai_provider": "anthropic",
  "model_name": "claude-3-5-sonnet-20241022",
  "prompt": "Extract vehicle details and dates"
}
```

---

### Example: Expenses API

#### List Expenses
```
GET /api/v1/expenses
```

**Query Parameters:**
```
?status=submitted          # Filter by status
?expense_type=fuel         # Filter by type
?vehicle_id=<uuid>         # Filter by vehicle
?driver_id=<uuid>          # Filter by driver
?start_date=2026-01-01     # Date range
?end_date=2026-01-31
?min_amount=0              # Amount range
?max_amount=1000
?page=1&limit=50
```

#### Create Expense
```
POST /api/v1/expenses
```

**Request:**
```json
{
  "expense_type": "fuel",
  "expense_date": "2026-01-08",
  "amount": 75.50,
  "currency": "USD",
  "merchant_name": "Shell Gas Station",
  "description": "Fuel for vehicle 123",
  "vehicle_id": "uuid",
  "driver_id": "uuid",
  "payment_method": "fuel_card",
  "fuel_card_id": "uuid",
  "receipt_url": "https://..."
}
```

#### Submit Expense
```
POST /api/v1/expenses/:id/submit
```

#### Approve Expense
```
POST /api/v1/expenses/:id/approve
```

**Request:**
```json
{
  "approval_notes": "Approved - within policy"
}
```

**Required Permission:** `expenses.approve`

#### Reject Expense
```
POST /api/v1/expenses/:id/reject
```

**Request:**
```json
{
  "rejected_reason": "Missing receipt documentation"
}
```

---

### Example: Work Orders API

#### List Work Orders
```
GET /api/v1/work-orders
```

**Query Parameters:**
```
?status=in_progress        # Filter by status
?vehicle_id=<uuid>         # Filter by vehicle
?assigned_to=<uuid>        # Filter by technician
?priority=high             # Filter by priority
?start_date=2026-01-01     # Date range
?end_date=2026-01-31
```

#### Create Work Order
```
POST /api/v1/work-orders
```

**Request:**
```json
{
  "vehicle_id": "uuid",
  "work_order_type": "repair",
  "priority": "high",
  "description": "Check engine light - P0301 code",
  "estimated_duration_hours": 2,
  "estimated_cost": 350,
  "scheduled_date": "2026-01-09T09:00:00Z",
  "assigned_to": "uuid",
  "service_bay_id": "uuid",
  "template_id": "uuid"
}
```

#### Add Task to Work Order
```
POST /api/v1/work-orders/:id/tasks
```

**Request:**
```json
{
  "task_description": "Replace spark plug cylinder 1",
  "task_type": "replacement",
  "estimated_duration_hours": 0.5,
  "required_parts": [
    {
      "part_number": "SP-001",
      "quantity": 1,
      "estimated_cost": 15
    }
  ]
}
```

#### Complete Task
```
PATCH /api/v1/work-order-tasks/:id/complete
```

**Request:**
```json
{
  "completion_notes": "Spark plug replaced successfully",
  "actual_duration_hours": 0.75,
  "parts_used": [
    {
      "part_number": "SP-001",
      "quantity": 1,
      "actual_cost": 15
    }
  ],
  "photos": ["url1", "url2"]
}
```

---

### Example: Roles & Permissions API

#### List Roles
```
GET /api/v1/roles
```

#### Create Role
```
POST /api/v1/roles
```

**Request:**
```json
{
  "role_name": "Fleet Supervisor",
  "role_key": "fleet_supervisor",
  "role_description": "Supervises fleet operations",
  "parent_role_id": "uuid",
  "permissions": [
    "vehicles.read",
    "vehicles.update",
    "work_orders.create",
    "work_orders.approve"
  ],
  "access_scope": "department",
  "can_create_work_orders": true,
  "max_approval_amount": 5000
}
```

#### Assign Role to User
```
POST /api/v1/user-roles
```

**Request:**
```json
{
  "user_id": "uuid",
  "role_id": "uuid",
  "effective_from": "2026-01-08",
  "effective_until": null,
  "is_primary_role": true,
  "active_locations": ["uuid1", "uuid2"],
  "assignment_reason": "Promoted to Fleet Supervisor"
}
```

#### Check User Permission
```
GET /api/v1/permissions/check
```

**Query Parameters:**
```
?user_id=<uuid>
?permission_key=vehicles.update
?entity_id=<uuid>  # Optional: Check permission on specific entity
```

**Response:**
```json
{
  "success": true,
  "data": {
    "has_permission": true,
    "source": "role",  # or "direct_grant"
    "role_name": "Fleet Manager"
  }
}
```

---

### Example: Integrations API

#### List API Integrations
```
GET /api/v1/integrations/api
```

#### Create Integration
```
POST /api/v1/integrations/api
```

**Request:**
```json
{
  "integration_name": "Geotab Integration",
  "integration_type": "telematics",
  "provider": "Geotab",
  "api_base_url": "https://my.geotab.com/apiv1",
  "auth_type": "basic_auth",
  "client_id": "database_name",
  "client_secret": "password",  # Encrypted at rest
  "config": {
    "database": "company_database"
  },
  "features_enabled": ["vehicle_tracking", "driver_behavior"],
  "sync_enabled": true,
  "sync_frequency": "every_5_min"
}
```

#### Test Integration
```
POST /api/v1/integrations/api/:id/test
```

**Response:**
```json
{
  "success": true,
  "data": {
    "connection_successful": true,
    "response_time_ms": 150,
    "api_version": "v1",
    "features_available": ["..."]
  }
}
```

#### Sync Integration
```
POST /api/v1/integrations/api/:id/sync
```

**Request:**
```json
{
  "sync_type": "incremental",  # or "full"
  "features": ["vehicle_tracking"]
}
```

#### Get Integration Logs
```
GET /api/v1/integrations/:id/logs
```

**Query Parameters:**
```
?log_level=error           # Filter by level
?start_date=2026-01-01
?end_date=2026-01-08
?operation=fetch_vehicles  # Filter by operation
```

---

### Example: Reports & Analytics API

#### List Saved Reports
```
GET /api/v1/saved-reports
```

#### Create Report
```
POST /api/v1/saved-reports
```

**Request:**
```json
{
  "report_name": "Monthly Fleet Utilization",
  "report_category": "fleet_utilization",
  "report_type": "chart",
  "output_format": "pdf",
  "data_source": "vehicles",
  "query_definition": {
    "filters": [
      {
        "field": "status",
        "operator": "=",
        "value": "active"
      }
    ],
    "groupBy": ["location", "vehicle_type"],
    "aggregations": [
      {
        "field": "odometer",
        "function": "sum"
      },
      {
        "field": "id",
        "function": "count"
      }
    ],
    "sortBy": [
      {
        "field": "total_miles",
        "direction": "desc"
      }
    ]
  },
  "chart_type": "bar",
  "date_range_type": "last_30_days",
  "is_scheduled": true,
  "schedule_frequency": "monthly",
  "schedule_day_of_month": 1,
  "auto_email_recipients": ["manager@example.com"]
}
```

#### Execute Report
```
POST /api/v1/saved-reports/:id/execute
```

**Request:**
```json
{
  "parameters": {
    "date_from": "2026-01-01",
    "date_to": "2026-01-31",
    "location_id": "uuid"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "execution_id": "uuid",
    "status": "processing",
    "estimated_completion": "2026-01-08T12:05:00Z"
  }
}
```

#### Get Report Result
```
GET /api/v1/report-executions/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "completed",
    "output_file_url": "https://...",
    "result_row_count": 150,
    "execution_time_seconds": 3.5,
    "completed_at": "2026-01-08T12:05:00Z"
  }
}
```

---

### Example: Audit Trail API

#### Query Audit Logs
```
GET /api/v1/audit-trails
```

**Query Parameters:**
```
?user_id=<uuid>            # Filter by user
?action=update             # Filter by action
?table_name=vehicles       # Filter by table
?record_id=<uuid>          # Filter by record
?start_date=2026-01-01     # Date range
?end_date=2026-01-08
?is_sensitive=true         # Filter sensitive actions
?compliance_tags=pii,hipaa # Filter by compliance
?page=1&limit=50
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_email": "user@example.com",
      "action": "update",
      "table_name": "vehicles",
      "record_id": "uuid",
      "record_name": "Vehicle 123",
      "old_values": {
        "status": "active",
        "odometer": 45000
      },
      "new_values": {
        "status": "maintenance",
        "odometer": 45250
      },
      "changed_fields": ["status", "odometer"],
      "source": "web_ui",
      "source_ip": "192.168.1.100",
      "occurred_at": "2026-01-08T12:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

---

## Rate Limiting

### Default Limits
- **Authenticated Requests:** 1000 requests/hour
- **API Tokens:** Custom limits per token
- **Unauthenticated:** 100 requests/hour (health checks only)

### Rate Limit Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1641567600
```

### Rate Limit Exceeded
```
429 Too Many Requests

{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "limit": 1000,
    "reset_at": "2026-01-08T13:00:00Z"
  }
}
```

---

## Webhooks

### Subscribe to Events
```
POST /api/v1/webhooks
```

**Request:**
```json
{
  "subscription_name": "Vehicle Status Changes",
  "target_url": "https://your-app.com/webhooks/fleet",
  "event_types": [
    "vehicle.created",
    "vehicle.updated",
    "vehicle.deleted",
    "maintenance.due"
  ],
  "auth_type": "hmac_signature",
  "hmac_secret": "your_secret",
  "filter_conditions": {
    "status": "active"
  }
}
```

### Webhook Payload Format
```json
{
  "event_id": "uuid",
  "event_type": "vehicle.updated",
  "event_timestamp": "2026-01-08T12:00:00Z",
  "tenant_id": "uuid",
  "data": {
    "id": "uuid",
    "old_values": { ... },
    "new_values": { ... },
    "changed_fields": ["status"]
  },
  "metadata": {
    "user_id": "uuid",
    "user_email": "user@example.com"
  }
}
```

### Webhook Signature Verification
```
X-Webhook-Signature: sha256=<hmac_signature>
X-Webhook-Event-ID: <uuid>
X-Webhook-Timestamp: <unix_timestamp>
```

---

## Batch Operations

### Batch Create
```
POST /api/v1/{resource}/batch
```

**Request:**
```json
{
  "items": [
    { /* item 1 */ },
    { /* item 2 */ },
    { /* item 3 */ }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "created": 3,
    "failed": 0,
    "results": [
      { "id": "uuid1", "success": true },
      { "id": "uuid2", "success": true },
      { "id": "uuid3", "success": true }
    ]
  }
}
```

### Batch Update
```
PATCH /api/v1/{resource}/batch
```

### Batch Delete
```
DELETE /api/v1/{resource}/batch
```

**Request:**
```json
{
  "ids": ["uuid1", "uuid2", "uuid3"]
}
```

---

## Export/Import

### Export Data
```
POST /api/v1/export-jobs
```

**Request:**
```json
{
  "job_name": "Vehicle Export",
  "export_type": "vehicles",
  "export_format": "excel",
  "fields_to_export": ["vin", "make", "model", "year", "status"],
  "filter_criteria": {
    "status": "active"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "job_id": "uuid",
    "status": "queued",
    "estimated_completion": "2026-01-08T12:05:00Z"
  }
}
```

### Check Export Status
```
GET /api/v1/export-jobs/:id
```

### Download Export
```
GET /api/v1/export-jobs/:id/download
```

### Import Data
```
POST /api/v1/import-jobs
Content-Type: multipart/form-data
```

**Form Data:**
```
file: <binary>
import_type: "vehicles"
skip_duplicates: true
update_existing: true
```

---

## Real-Time Updates (WebSockets)

### Connect
```
ws://localhost:3000/ws
wss://proud-bay-0fdc8040f.3.azurestaticapps.net/ws
```

### Authentication
```json
{
  "type": "auth",
  "token": "Bearer <token>"
}
```

### Subscribe to Updates
```json
{
  "type": "subscribe",
  "channels": [
    "vehicles",
    "notifications",
    "work_orders"
  ],
  "filters": {
    "vehicle_id": "uuid"
  }
}
```

### Receive Updates
```json
{
  "type": "update",
  "channel": "vehicles",
  "event": "location_updated",
  "data": {
    "vehicle_id": "uuid",
    "latitude": 28.5383,
    "longitude": -81.3792,
    "timestamp": "2026-01-08T12:00:00Z"
  }
}
```

---

## Error Codes Reference

| Code | HTTP | Description |
|------|------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `AUTHENTICATION_REQUIRED` | 401 | No or invalid token |
| `INSUFFICIENT_PERMISSIONS` | 403 | User lacks required permission |
| `RESOURCE_NOT_FOUND` | 404 | Requested resource doesn't exist |
| `DUPLICATE_RESOURCE` | 409 | Resource already exists |
| `BUSINESS_LOGIC_ERROR` | 422 | Business rule violation |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Testing

### Postman Collection
```
GET /api/v1/docs/postman.json
```

### OpenAPI Specification
```
GET /api/v1/docs/openapi.yaml
```

### Health Check
```
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-08T12:00:00Z",
  "uptime": 86400,
  "version": "1.0.0",
  "services": {
    "database": {
      "status": "up",
      "latency": 5
    },
    "redis": {
      "status": "up",
      "latency": 2
    }
  }
}
```

---

**Document Version:** 1.0.0
**Last Updated:** 2026-01-08
**Maintained By:** Fleet Dev Team
