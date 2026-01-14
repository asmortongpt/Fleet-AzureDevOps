# Fleet Management API - Production Documentation

## Version: 1.0.0 (Production-Ready)

**Base URL:** `https://api.fleet.capitaltechalliance.com` (Production)
**Development:** `http://localhost:3000`

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Authorization](#authorization)
4. [Security Features](#security-features)
5. [API Endpoints](#api-endpoints)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)
8. [Examples](#examples)

---

## Overview

The Fleet Management API is a production-ready RESTful API for managing fleet operations, including vehicles, drivers, maintenance, fuel tracking, GPS monitoring, and analytics.

### Key Features

- JWT-based authentication with bcrypt password hashing (cost factor 12)
- Role-Based Access Control (RBAC) with 8 user roles
- Multi-tenant architecture with strict data isolation
- CSRF protection for state-changing operations
- Rate limiting (100 requests per 15 minutes)
- Input validation and sanitization (XSS prevention)
- SQL injection protection via Drizzle ORM
- Comprehensive audit logging
- Real-time GPS tracking
- Advanced analytics and reporting

---

## Authentication

### POST `/api/auth/register`

Register a new user account.

**Rate Limit:** 5 requests per 15 minutes

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "StrongPassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "tenantId": "optional-tenant-uuid"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "Viewer",
    "tenantId": "uuid"
  }
}
```

### POST `/api/auth/login`

Authenticate and receive access token.

**Rate Limit:** 5 requests per 15 minutes

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "StrongPassword123!"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "Admin",
    "tenantId": "uuid"
  }
}
```

### GET `/api/auth/me`

Get current user profile.

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "Admin",
  "tenantId": "uuid",
  "lastLoginAt": "2025-01-13T10:00:00Z",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

---

## Authorization

### User Roles

| Role | Level | Permissions |
|------|-------|-------------|
| **SuperAdmin** | 100 | All permissions |
| **Admin** | 80 | All except user management |
| **Manager** | 60 | CRUD on vehicles, drivers, maintenance, fuel, routes |
| **Supervisor** | 50 | Read + limited create permissions |
| **Dispatcher** | 40 | Routes, GPS, vehicle/driver read access |
| **Mechanic** | 30 | Maintenance, work orders, parts |
| **Driver** | 20 | Vehicle read, fuel logging, GPS updates |
| **Viewer** | 10 | Read-only access to reports and analytics |

### Permission Format

Permissions are in the format `resource:action`:
- `vehicles:read`, `vehicles:create`, `vehicles:update`, `vehicles:delete`
- `drivers:read`, `drivers:create`, `drivers:update`, `drivers:delete`
- `maintenance:*` (wildcard for all maintenance actions)

---

## Security Features

### 1. CSRF Protection

All state-changing operations (POST, PUT, DELETE) require a CSRF token.

**Get CSRF Token:**
```bash
GET /api/csrf
```

**Response:**
```json
{
  "csrfToken": "random-64-char-token"
}
```

**Use Token:**
```bash
POST /api/vehicles
Headers:
  X-CSRF-Token: {csrfToken}
  Authorization: Bearer {jwtToken}
```

### 2. Rate Limiting

| Endpoint Type | Limit |
|--------------|-------|
| General API | 100 requests / 15 min |
| Authentication | 5 requests / 15 min |
| Data Creation | 30 requests / 15 min |

### 3. Input Validation

All inputs are validated using Zod schemas and sanitized to prevent XSS attacks.

### 4. Password Requirements

- Minimum 12 characters
- Hashed using bcrypt with cost factor 12
- Never stored or transmitted in plain text

---

## API Endpoints

### Vehicles (5 endpoints)

#### GET `/api/vehicles`
List all vehicles (paginated).

**Required Permission:** `vehicles:read`

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 50, max: 100)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "vin": "1HGBH41JXMN109186",
      "number": "V001",
      "make": "Toyota",
      "model": "Camry",
      "year": 2023,
      "status": "active",
      "fuelLevel": 75.5,
      "odometer": 50000,
      "latitude": 37.7749,
      "longitude": -122.4194
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 150
  }
}
```

#### GET `/api/vehicles/:id`
Get single vehicle by ID.

**Required Permission:** `vehicles:read`

#### POST `/api/vehicles`
Create new vehicle.

**Required Permission:** `vehicles:create`

**Request Body:**
```json
{
  "vin": "1HGBH41JXMN109186",
  "name": "Fleet Vehicle 001",
  "number": "V001",
  "type": "sedan",
  "make": "Toyota",
  "model": "Camry",
  "year": 2023,
  "licensePlate": "ABC123",
  "fuelType": "gasoline",
  "purchaseDate": "2023-01-15T00:00:00Z",
  "purchasePrice": 25000
}
```

#### PUT `/api/vehicles/:id`
Update vehicle.

**Required Permission:** `vehicles:update`

#### DELETE `/api/vehicles/:id`
Delete vehicle.

**Required Permission:** `vehicles:delete`

#### POST `/api/vehicles/:id/assign-driver`
Assign driver to vehicle.

**Required Permission:** `vehicles:update`

**Request Body:**
```json
{
  "driverId": "driver-uuid"
}
```

---

### Drivers (6 endpoints)

#### GET `/api/drivers`
List all drivers.

**Required Permission:** `drivers:read`

#### GET `/api/drivers/:id`
Get driver by ID.

#### POST `/api/drivers`
Create new driver.

**Required Permission:** `drivers:create`

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "555-1234",
  "licenseNumber": "DL123456",
  "licenseState": "CA",
  "licenseExpiryDate": "2026-12-31T00:00:00Z",
  "cdl": true,
  "cdlClass": "A",
  "hireDate": "2023-01-01T00:00:00Z"
}
```

#### PUT `/api/drivers/:id`
Update driver.

#### DELETE `/api/drivers/:id`
Delete driver.

#### GET `/api/drivers/:id/history`
Get driver activity history.

**Response:**
```json
{
  "workOrders": [...],
  "fuelTransactions": [...],
  "inspections": [...],
  "incidents": [...],
  "meta": {
    "totalActivities": 50
  }
}
```

---

### Work Orders (4 endpoints)

#### GET `/api/work-orders`
List work orders.

**Required Permission:** `maintenance:read`

#### GET `/api/work-orders/:id`
Get work order details.

#### POST `/api/work-orders`
Create work order.

**Required Permission:** `maintenance:create`

**Request Body:**
```json
{
  "vehicleId": "vehicle-uuid",
  "title": "Oil Change",
  "description": "Regular 5,000 mile oil change",
  "type": "preventive",
  "priority": "medium",
  "scheduledStartDate": "2025-01-20T08:00:00Z",
  "scheduledEndDate": "2025-01-20T10:00:00Z",
  "estimatedCost": 75.00
}
```

#### PUT `/api/work-orders/:id`
Update work order.

---

### Maintenance (3 endpoints)

#### GET `/api/maintenance-records`
List maintenance records.

#### POST `/api/maintenance-records`
Create maintenance record.

**Request Body:**
```json
{
  "vehicleId": "vehicle-uuid",
  "type": "corrective",
  "title": "Brake Replacement",
  "description": "Replaced front brake pads and rotors",
  "actualCost": 450.00,
  "laborHours": 3.5,
  "odometerAtStart": 50000
}
```

#### GET `/api/maintenance-schedules`
List maintenance schedules.

---

### Fuel (3 endpoints)

#### GET `/api/fuel-transactions`
List fuel transactions.

**Required Permission:** `fuel:read`

#### POST `/api/fuel-transactions`
Log fuel transaction.

**Required Permission:** `fuel:create`

**Request Body:**
```json
{
  "vehicleId": "vehicle-uuid",
  "driverId": "driver-uuid",
  "transactionDate": "2025-01-13T14:30:00Z",
  "fuelType": "gasoline",
  "gallons": 15.5,
  "costPerGallon": 3.50,
  "totalCost": 54.25,
  "odometer": 50000,
  "location": "Shell Station - Main St",
  "vendorName": "Shell"
}
```

#### GET `/api/fuel-analytics`
Get fuel analytics.

**Query Parameters:**
- `startDate` (ISO 8601 date)
- `endDate` (ISO 8601 date)
- `vehicleId` (UUID, optional)

**Response:**
```json
{
  "summary": {
    "totalGallons": 1500.5,
    "totalCost": 5250.25,
    "avgCostPerGallon": 3.50,
    "transactionCount": 100
  },
  "byVehicle": [
    {
      "vehicleId": "uuid",
      "gallons": 150.5,
      "cost": 525.75,
      "transactions": 10
    }
  ]
}
```

---

### GPS & Tracking (3 endpoints)

#### GET `/api/gps-tracks`
Get GPS tracking data.

**Query Parameters:**
- `vehicleId` (UUID, required)
- `limit` (number, default: 100)

#### POST `/api/gps-position`
Submit GPS position update.

**Required Permission:** `gps:create`

**Request Body:**
```json
{
  "vehicleId": "vehicle-uuid",
  "timestamp": "2025-01-13T15:00:00Z",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "altitude": 100,
  "speed": 45.5,
  "heading": 180,
  "accuracy": 10
}
```

#### GET `/api/routes`
Get routes.

---

### Reports & Analytics (4 endpoints)

#### GET `/api/reports`
List available reports.

**Response:**
```json
[
  {
    "id": "fleet-overview",
    "name": "Fleet Overview",
    "description": "Complete fleet status and utilization",
    "category": "operational",
    "available": true
  }
]
```

#### GET `/api/analytics`
Dashboard analytics.

**Response:**
```json
{
  "fleet": {
    "totalVehicles": 100,
    "activeVehicles": 85,
    "inMaintenance": 10,
    "utilizationRate": 85.0
  },
  "drivers": {
    "totalDrivers": 80,
    "activeDrivers": 75,
    "onLeave": 5
  },
  "maintenance": {
    "totalWorkOrders": 500,
    "pendingWorkOrders": 20,
    "completedThisMonth": 50
  },
  "fuel": {
    "totalCostLast30Days": 5250.25,
    "transactionCount": 100,
    "avgCostPerTransaction": 52.50
  },
  "safety": {
    "totalIncidents": 10,
    "incidentsLast30Days": 2,
    "criticalIncidents": 0
  }
}
```

#### GET `/api/analytics/vehicles`
Vehicle-specific analytics.

**Query Parameters:**
- `vehicleId` (UUID, required)

#### GET `/api/analytics/fuel`
Fuel analytics (alias for `/api/fuel-analytics`).

---

## Error Handling

### Error Response Format

```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "details": [
    {
      "field": "fieldName",
      "message": "Validation error message",
      "code": "error_code"
    }
  ],
  "timestamp": "2025-01-13T10:00:00Z",
  "path": "/api/vehicles",
  "method": "POST"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (authentication failed) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 429 | Too Many Requests (rate limit exceeded) |
| 500 | Internal Server Error |

---

## Examples

### Complete Workflow Example

```bash
# 1. Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "StrongPassword123!",
    "firstName": "Admin",
    "lastName": "User"
  }'

# 2. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "StrongPassword123!"
  }'

# Save the token from response
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 3. Get CSRF Token
curl http://localhost:3000/api/csrf

# Save the CSRF token
CSRF_TOKEN="random-64-char-token"

# 4. Create Vehicle
curl -X POST http://localhost:3000/api/vehicles \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vin": "1HGBH41JXMN109186",
    "name": "Fleet Vehicle 001",
    "number": "V001",
    "type": "sedan",
    "make": "Toyota",
    "model": "Camry",
    "year": 2023,
    "licensePlate": "ABC123",
    "fuelType": "gasoline"
  }'

# 5. List Vehicles
curl http://localhost:3000/api/vehicles \
  -H "Authorization: Bearer $TOKEN"

# 6. Get Analytics
curl http://localhost:3000/api/analytics \
  -H "Authorization: Bearer $TOKEN"
```

---

## Support

For issues or questions:
- Email: support@capitaltechalliance.com
- Documentation: https://docs.fleet.capitaltechalliance.com
- GitHub: https://github.com/capitaltechhub/Fleet-AzureDevOps

---

**Last Updated:** 2025-01-13
**API Version:** 1.0.0 (Production)
