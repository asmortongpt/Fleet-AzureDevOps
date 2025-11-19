# Multi-Asset Fleet Management - API Documentation

**Version**: 1.0
**Last Updated**: 2025-11-19
**Base URL**: `http://localhost:3000/api` (Development)
**Migration**: 032_multi_asset_vehicle_extensions.sql

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Vehicle Endpoints - Extended](#vehicle-endpoints-extended)
4. [Asset Relationships Endpoints](#asset-relationships-endpoints)
5. [Maintenance Schedules - Multi-Metric](#maintenance-schedules-multi-metric)
6. [Request/Response Examples](#requestresponse-examples)
7. [Error Codes](#error-codes)
8. [Rate Limiting](#rate-limiting)

---

## Overview

The Multi-Asset API extends the Fleet Management System to support diverse asset types including:
- Heavy equipment (excavators, bulldozers, loaders)
- Tractors and trailers
- Specialty equipment (generators, compressors)
- Non-powered assets

### Key Capabilities

- **Multi-Metric Tracking**: Odometer, engine hours, PTO hours, auxiliary hours, cycles
- **Asset Relationships**: Parent-child relationships (tractor-trailer, machine-attachment)
- **Equipment Specifications**: Capacity, reach, lift height, payload
- **Advanced Filtering**: Filter by asset category, type, power type, operational status
- **Hour-Based Maintenance**: Maintenance schedules based on equipment hours or cycles

---

## Authentication

All endpoints require JWT authentication via the `Authorization` header:

```http
Authorization: Bearer <your-jwt-token>
```

Obtain a token via the login endpoint:

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "fleet_manager"
  }
}
```

---

## Vehicle Endpoints - Extended

### GET /api/vehicles

List all vehicles/assets with multi-asset filtering.

**New Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `asset_category` | string | Filter by asset category | `HEAVY_EQUIPMENT` |
| `asset_type` | string | Filter by specific type | `EXCAVATOR` |
| `power_type` | string | Filter by power type | `SELF_POWERED` |
| `operational_status` | string | Filter by status | `AVAILABLE` |
| `primary_metric` | string | Filter by tracking metric | `ENGINE_HOURS` |
| `is_road_legal` | boolean | Road-legal equipment only | `true` |
| `location_id` | uuid | Filter by facility | `uuid` |
| `group_id` | string | Filter by group | `group-123` |
| `fleet_id` | string | Filter by fleet | `fleet-west` |
| `page` | integer | Page number (default: 1) | `1` |
| `limit` | integer | Items per page (default: 50) | `50` |

**Asset Categories:**
- `PASSENGER_VEHICLE`
- `HEAVY_EQUIPMENT`
- `TRAILER`
- `TRACTOR`
- `SPECIALTY`
- `NON_POWERED`

**Asset Types:**

*Heavy Equipment:*
- `EXCAVATOR`, `BULLDOZER`, `LOADER`, `BACKHOE`, `GRADER`, `ROLLER`, `CRANE`, `FORKLIFT`

*Trailers:*
- `FLATBED`, `ENCLOSED`, `DUMP`, `LOWBOY`, `REFRIGERATED`

*Tractors:*
- `FARM_TRACTOR`, `ROAD_TRACTOR`

*Specialty:*
- `GENERATOR`, `COMPRESSOR`, `PUMP`, `WELDER`

*Passenger Vehicles:*
- `SEDAN`, `SUV`, `TRUCK`, `VAN`

**Power Types:**
- `SELF_POWERED`, `TOWED`, `CARRIED`, `STATIONARY`, `MANUAL`

**Operational Status:**
- `AVAILABLE`, `IN_USE`, `MAINTENANCE`, `RESERVED`, `OUT_OF_SERVICE`

**Primary Metrics:**
- `ODOMETER`, `ENGINE_HOURS`, `PTO_HOURS`, `AUX_HOURS`, `CYCLES`, `CALENDAR`

**Example Request:**

```http
GET /api/vehicles?asset_category=HEAVY_EQUIPMENT&asset_type=EXCAVATOR&operational_status=AVAILABLE&page=1&limit=20
Authorization: Bearer <token>
```

**Example Response:**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "tenant_id": "tenant-uuid",
      "make": "Caterpillar",
      "model": "320D",
      "year": 2022,
      "vin": "CAT320D123456",

      // Multi-Asset Fields
      "asset_category": "HEAVY_EQUIPMENT",
      "asset_type": "EXCAVATOR",
      "power_type": "SELF_POWERED",
      "operational_status": "AVAILABLE",

      // Multi-Metric Tracking
      "primary_metric": "ENGINE_HOURS",
      "engine_hours": 1245.5,
      "pto_hours": 320.0,
      "aux_hours": 0,
      "cycle_count": 0,
      "odometer": null,
      "last_metric_update": "2025-11-19T10:30:00Z",

      // Equipment Specifications
      "capacity_tons": 25.0,
      "max_reach_feet": 30.5,
      "lift_height_feet": 25.0,
      "bucket_capacity_yards": 2.5,
      "operating_weight_lbs": 45000,

      // Capabilities
      "has_pto": true,
      "has_aux_power": false,
      "is_road_legal": false,
      "requires_cdl": false,
      "requires_special_license": true,
      "is_off_road_only": true,
      "max_speed_kph": null,

      // Organization
      "group_id": "construction-team-1",
      "fleet_id": "heavy-equipment-west",
      "location_id": "facility-uuid",
      "parent_asset_id": null,

      "status": "active",
      "created_at": "2025-01-15T08:00:00Z",
      "updated_at": "2025-11-19T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

### POST /api/vehicles

Create a new vehicle/asset with multi-asset fields.

**Request Body:**

```json
{
  "make": "Caterpillar",
  "model": "320D",
  "year": 2022,
  "vin": "CAT320D123456",

  // Multi-Asset Classification
  "asset_category": "HEAVY_EQUIPMENT",
  "asset_type": "EXCAVATOR",
  "power_type": "SELF_POWERED",
  "operational_status": "AVAILABLE",

  // Multi-Metric Setup
  "primary_metric": "ENGINE_HOURS",
  "engine_hours": 0,
  "pto_hours": 0,

  // Equipment Specifications
  "capacity_tons": 25.0,
  "max_reach_feet": 30.5,
  "lift_height_feet": 25.0,
  "bucket_capacity_yards": 2.5,
  "operating_weight_lbs": 45000,

  // Capabilities
  "has_pto": true,
  "has_aux_power": false,
  "is_road_legal": false,
  "requires_special_license": true,
  "is_off_road_only": true,

  // Organization
  "group_id": "construction-team-1",
  "fleet_id": "heavy-equipment-west",
  "location_id": "facility-uuid"
}
```

**Response:** `201 Created`

```json
{
  "vehicle": { /* full vehicle object */ },
  "message": "Vehicle created successfully"
}
```

### PUT /api/vehicles/:id

Update an existing vehicle/asset.

**Request Body:** Same structure as POST (all fields optional)

**Example - Update Equipment Hours:**

```json
{
  "engine_hours": 1245.5,
  "pto_hours": 320.0,
  "last_metric_update": "2025-11-19T10:30:00Z"
}
```

**Response:** `200 OK`

### GET /api/vehicles/:id

Get detailed information for a single vehicle/asset.

**Response:**

```json
{
  "vehicle": {
    /* Full vehicle object with all multi-asset fields */
  }
}
```

---

## Asset Relationships Endpoints

Manage parent-child asset relationships (e.g., tractor-trailer combinations).

### GET /api/asset-relationships

List all asset relationships.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `parent_asset_id` | uuid | Filter by parent asset |
| `child_asset_id` | uuid | Filter by child asset |
| `relationship_type` | string | Filter by type |
| `active_only` | boolean | Show only active (default: true) |

**Relationship Types:**
- `TOWS` - Tractor tows trailer
- `ATTACHED` - Equipment attachment (bucket, blade)
- `CARRIES` - Truck carries container
- `POWERS` - Truck powers generator
- `CONTAINS` - Vehicle contains cargo

**Example Request:**

```http
GET /api/asset-relationships?parent_asset_id=tractor-uuid&active_only=true
Authorization: Bearer <token>
```

**Example Response:**

```json
{
  "relationships": [
    {
      "id": "rel-uuid",
      "parent_asset_id": "tractor-uuid",
      "child_asset_id": "trailer-uuid",
      "relationship_type": "TOWS",
      "effective_from": "2025-11-15T08:00:00Z",
      "effective_to": null,
      "notes": "Cross-country haul #1234",
      "created_by": "user-uuid",
      "created_at": "2025-11-15T08:00:00Z",

      // Enriched data
      "parent_asset_name": "Freightliner Cascadia (VIN123)",
      "parent_asset_type": "ROAD_TRACTOR",
      "child_asset_name": "Great Dane 53ft Dry Van (VIN456)",
      "child_asset_type": "ENCLOSED",
      "created_by_name": "John Manager"
    }
  ],
  "total": 1
}
```

### GET /api/asset-relationships/active

Get all currently active asset combinations.

Uses the database view `vw_active_asset_combos` for optimized querying.

**Example Request:**

```http
GET /api/asset-relationships/active
Authorization: Bearer <token>
```

**Example Response:**

```json
{
  "combinations": [
    {
      "relationship_id": "rel-uuid",
      "parent_asset_id": "tractor-uuid",
      "parent_asset_name": "Freightliner Cascadia (VIN123)",
      "parent_asset_type": "ROAD_TRACTOR",
      "child_asset_id": "trailer-uuid",
      "child_asset_name": "Great Dane 53ft (VIN456)",
      "child_asset_type": "ENCLOSED",
      "relationship_type": "TOWS",
      "effective_from": "2025-11-15T08:00:00Z",
      "tenant_id": "tenant-uuid"
    }
  ],
  "total": 1
}
```

### GET /api/asset-relationships/:id

Get a specific relationship by ID.

**Response:** `200 OK` with full relationship object

### POST /api/asset-relationships

Create a new asset relationship (attach trailer, equipment, etc.).

**Request Body:**

```json
{
  "parent_asset_id": "tractor-uuid",
  "child_asset_id": "trailer-uuid",
  "relationship_type": "TOWS",
  "effective_from": "2025-11-19T08:00:00Z",
  "notes": "Attached for delivery route #5678"
}
```

**Validations:**
- Both assets must exist and belong to the same tenant
- Cannot create circular relationships (A→B and B→A)
- Parent and child must be different assets

**Response:** `201 Created`

```json
{
  "relationship": { /* full relationship object */ },
  "message": "Asset relationship created successfully"
}
```

### PUT /api/asset-relationships/:id

Update an existing relationship.

**Request Body:**

```json
{
  "relationship_type": "ATTACHED",
  "notes": "Updated notes"
}
```

**Response:** `200 OK`

### PATCH /api/asset-relationships/:id/deactivate

Deactivate a relationship (detach trailer, equipment).

Sets `effective_to = NOW()`.

**Response:** `200 OK`

```json
{
  "relationship": { /* updated relationship */ },
  "message": "Relationship deactivated successfully"
}
```

### DELETE /api/asset-relationships/:id

Permanently delete a relationship.

**Note:** Usually prefer `PATCH /deactivate` to maintain history.

**Response:** `200 OK`

```json
{
  "message": "Relationship deleted successfully"
}
```

### GET /api/asset-relationships/history/:assetId

Get the complete relationship history for a specific asset.

Shows all past and present relationships where the asset was either parent or child.

**Example Request:**

```http
GET /api/asset-relationships/history/tractor-uuid
Authorization: Bearer <token>
```

**Response:**

```json
{
  "history": [
    {
      "id": "rel-uuid-1",
      "parent_asset_id": "tractor-uuid",
      "child_asset_id": "trailer-uuid-1",
      "relationship_type": "TOWS",
      "effective_from": "2025-11-01T08:00:00Z",
      "effective_to": "2025-11-10T17:00:00Z",
      "parent_asset_name": "Freightliner (VIN123)",
      "child_asset_name": "Trailer A (VIN456)",
      "created_by_name": "John Manager",
      "notes": "Route #1234"
    },
    {
      "id": "rel-uuid-2",
      "parent_asset_id": "tractor-uuid",
      "child_asset_id": "trailer-uuid-2",
      "relationship_type": "TOWS",
      "effective_from": "2025-11-15T08:00:00Z",
      "effective_to": null,
      "parent_asset_name": "Freightliner (VIN123)",
      "child_asset_name": "Trailer B (VIN789)",
      "created_by_name": "Jane Manager",
      "notes": "Route #5678"
    }
  ],
  "total": 2
}
```

---

## Maintenance Schedules - Multi-Metric

Extended maintenance endpoints supporting hour-based and cycle-based triggers.

### GET /api/maintenance-schedules

List maintenance schedules with multi-metric filtering.

**New Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `trigger_metric` | string | Filter by metric type |
| `vehicle_id` | uuid | Filter by vehicle |
| `service_type` | string | Filter by service type |
| `page` | integer | Page number |
| `limit` | integer | Items per page |

**Trigger Metrics:**
- `ODOMETER`, `ENGINE_HOURS`, `PTO_HOURS`, `AUX_HOURS`, `CYCLES`, `CALENDAR`

**Example Request:**

```http
GET /api/maintenance-schedules?trigger_metric=ENGINE_HOURS&page=1&limit=50
Authorization: Bearer <token>
```

**Example Response:**

```json
{
  "data": [
    {
      "id": "schedule-uuid",
      "tenant_id": "tenant-uuid",
      "vehicle_id": "excavator-uuid",
      "service_type": "Oil Change",

      // Multi-Metric Fields
      "trigger_metric": "ENGINE_HOURS",
      "trigger_condition": "OR",

      // Hour-based intervals
      "service_interval_hours": 250,
      "last_service_engine_hours": 1000,
      "next_service_due_engine_hours": 1250,

      // PTO-based (if applicable)
      "service_interval_pto_hours": null,
      "last_service_pto_hours": null,
      "next_service_due_pto_hours": null,

      // Calendar-based
      "service_interval_days": 180,
      "last_service_date": "2025-05-15",
      "next_service_due_date": "2025-11-15",

      // Mile-based (if applicable)
      "service_interval_miles": null,
      "last_service_odometer": null,
      "next_service_due_odometer": null,

      "priority": "medium",
      "estimated_cost": 350.00,
      "status": "active",
      "notes": "Manufacturer recommended interval",
      "created_at": "2025-01-15T08:00:00Z",
      "updated_at": "2025-11-19T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 15,
    "pages": 1
  }
}
```

### POST /api/maintenance-schedules

Create a multi-metric maintenance schedule.

**Request Body Examples:**

**Example 1: Engine Hour-Based**

```json
{
  "vehicle_id": "excavator-uuid",
  "service_type": "Hydraulic Fluid Change",
  "trigger_metric": "ENGINE_HOURS",
  "service_interval_hours": 500,
  "last_service_engine_hours": 1000,
  "priority": "medium",
  "estimated_cost": 450.00,
  "notes": "Check hydraulic system pressure during service"
}
```

**Example 2: PTO Hour-Based**

```json
{
  "vehicle_id": "excavator-uuid",
  "service_type": "PTO System Service",
  "trigger_metric": "PTO_HOURS",
  "service_interval_pto_hours": 100,
  "last_service_pto_hours": 300,
  "priority": "high",
  "estimated_cost": 600.00
}
```

**Example 3: Multi-Metric with OR Logic**

```json
{
  "vehicle_id": "truck-uuid",
  "service_type": "Oil Change",
  "trigger_metric": "ODOMETER",
  "trigger_condition": "OR",
  "service_interval_miles": 5000,
  "service_interval_days": 180,
  "last_service_odometer": 50000,
  "last_service_date": "2025-05-15",
  "priority": "medium",
  "estimated_cost": 150.00,
  "notes": "Whichever comes first"
}
```

**Example 4: Cycle-Based (Compressor)**

```json
{
  "vehicle_id": "compressor-uuid",
  "service_type": "Filter Replacement",
  "trigger_metric": "CYCLES",
  "service_interval_cycles": 10000,
  "last_service_cycles": 25000,
  "priority": "medium",
  "estimated_cost": 200.00
}
```

**Response:** `201 Created`

---

## Request/Response Examples

### Complete Examples

#### Example 1: Add an Excavator and Set Up Maintenance

**Step 1: Create the Excavator**

```http
POST /api/vehicles
Authorization: Bearer <token>
Content-Type: application/json

{
  "make": "Caterpillar",
  "model": "320D",
  "year": 2022,
  "vin": "CAT320D2022001",
  "asset_category": "HEAVY_EQUIPMENT",
  "asset_type": "EXCAVATOR",
  "power_type": "SELF_POWERED",
  "operational_status": "AVAILABLE",
  "primary_metric": "ENGINE_HOURS",
  "engine_hours": 0,
  "pto_hours": 0,
  "capacity_tons": 25.0,
  "max_reach_feet": 30.5,
  "bucket_capacity_yards": 2.5,
  "has_pto": true,
  "requires_special_license": true,
  "is_road_legal": false
}
```

**Step 2: Create Hour-Based Maintenance Schedule**

```http
POST /api/maintenance-schedules
Authorization: Bearer <token>
Content-Type: application/json

{
  "vehicle_id": "<excavator-uuid-from-step-1>",
  "service_type": "250-Hour Service",
  "trigger_metric": "ENGINE_HOURS",
  "service_interval_hours": 250,
  "last_service_engine_hours": 0,
  "priority": "medium",
  "estimated_cost": 350.00
}
```

#### Example 2: Attach Trailer to Tractor

**Step 1: Find Available Trailers**

```http
GET /api/vehicles?asset_category=TRAILER&operational_status=AVAILABLE
Authorization: Bearer <token>
```

**Step 2: Create Relationship**

```http
POST /api/asset-relationships
Authorization: Bearer <token>
Content-Type: application/json

{
  "parent_asset_id": "tractor-uuid",
  "child_asset_id": "trailer-uuid",
  "relationship_type": "TOWS",
  "notes": "Route to Los Angeles - Job #5678"
}
```

**Step 3: Update Operational Status**

```http
PUT /api/vehicles/trailer-uuid
Authorization: Bearer <token>
Content-Type: application/json

{
  "operational_status": "IN_USE"
}
```

#### Example 3: Update Equipment Hours and Check Maintenance Due

**Step 1: Update Hours**

```http
PUT /api/vehicles/excavator-uuid
Authorization: Bearer <token>
Content-Type: application/json

{
  "engine_hours": 1245.5,
  "pto_hours": 320.0,
  "last_metric_update": "2025-11-19T16:30:00Z"
}
```

**Step 2: Check Maintenance Due**

```http
GET /api/maintenance-schedules?vehicle_id=excavator-uuid
Authorization: Bearer <token>
```

Response will show:
- Current hours: 1245.5
- Next due: 1250
- Remaining: 4.5 hours

#### Example 4: Filter Heavy Equipment Available for Assignment

```http
GET /api/vehicles?asset_category=HEAVY_EQUIPMENT&operational_status=AVAILABLE&asset_type=EXCAVATOR&capacity_tons=20
Authorization: Bearer <token>
```

Returns all available excavators with capacity ≥ 20 tons.

---

## Error Codes

### Standard HTTP Status Codes

| Code | Description | Common Causes |
|------|-------------|---------------|
| `200` | OK | Request succeeded |
| `201` | Created | Resource created successfully |
| `400` | Bad Request | Validation error, invalid parameters |
| `401` | Unauthorized | Missing or invalid JWT token |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | Resource does not exist |
| `409` | Conflict | Duplicate resource, constraint violation |
| `422` | Unprocessable Entity | Business logic validation failed |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Server error |

### Error Response Format

```json
{
  "error": "Descriptive error message",
  "details": {
    "field": "asset_category",
    "message": "Invalid asset category value"
  }
}
```

### Common Errors

**Invalid Asset Category:**
```json
{
  "error": "Validation failed",
  "details": {
    "field": "asset_category",
    "message": "Must be one of: PASSENGER_VEHICLE, HEAVY_EQUIPMENT, TRAILER, TRACTOR, SPECIALTY, NON_POWERED"
  }
}
```

**Circular Relationship:**
```json
{
  "error": "Circular relationship detected: child asset is already a parent of this asset"
}
```

**Assets Not Found:**
```json
{
  "error": "One or both assets not found or do not belong to your organization"
}
```

**Same Parent and Child:**
```json
{
  "error": "Parent and child assets must be different"
}
```

---

## Rate Limiting

API rate limits:

- **Global**: 30 requests per minute per IP
- **Per Endpoint**: May have additional limits

Rate limit headers included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1637337600
```

When rate limit exceeded:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60

{
  "error": "Rate limit exceeded. Please try again in 60 seconds."
}
```

---

## Pagination

All list endpoints support pagination:

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50, max: 100)

**Response Format:**

```json
{
  "data": [ /* array of items */ ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 234,
    "pages": 5
  }
}
```

---

## OpenAPI/Swagger Documentation

Interactive API documentation available at:

**Development:**
- `http://localhost:3000/api/docs`

**Production:**
- `https://api.fleetmanagement.com/api/docs`

OpenAPI spec available at:
- `/api/openapi.json`

---

## Support

For API support:

- **Email**: api-support@fleetmanagement.com
- **Documentation**: https://docs.fleetmanagement.com/api
- **Status Page**: https://status.fleetmanagement.com

---

**Document Version History:**
- v1.0 (2025-11-19): Initial release with multi-asset endpoints
