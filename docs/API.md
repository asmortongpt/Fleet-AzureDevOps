# Fleet Management System - API Documentation

**Version**: 1.0.0  
**Base URL**: `https://fleet.capitaltechalliance.com/api`  
**Protocol**: HTTPS only

## Table of Contents

1. [Authentication](#authentication)
2. [Core Resources](#core-resources)
3. [Endpoints](#endpoints)
4. [Error Handling](#error-handling)
5. [Rate Limiting](#rate-limiting)
6. [Examples](#examples)

---

## Authentication

All API requests require authentication via JWT (JSON Web Token).

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your_password"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "fleet_manager",
    "tenantId": "uuid"
  },
  "expiresIn": 86400
}
```

### Using the Token

Include the JWT token in the Authorization header for all subsequent requests:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Core Resources

### Vehicles

#### GET /api/vehicles
List all vehicles for the authenticated tenant.

**Query Parameters:**
- `status` (string, optional): Filter by status (active, maintenance, out_of_service)
- `limit` (number, optional): Page size (default: 50, max: 100)
- `offset` (number, optional): Pagination offset
- `search` (string, optional): Search by VIN, make, model, license plate

**Example:**
```http
GET /api/vehicles?status=active&limit=20
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "vin": "1HGCM82633A123456",
      "make": "Honda",
      "model": "Accord",
      "year": 2023,
      "licensePlate": "FLA-1001",
      "vehicleType": "sedan",
      "fuelType": "gasoline",
      "status": "active",
      "odometer": 12500.00,
      "assignedDriver": {
        "id": "uuid",
        "name": "John Smith"
      },
      "assignedFacility": {
        "id": "uuid",
        "name": "Tallahassee HQ"
      }
    }
  ],
  "total": 10,
  "limit": 20,
  "offset": 0
}
```

#### GET /api/vehicles/:id
Get a single vehicle by ID.

**Response:**
```json
{
  "id": "uuid",
  "vin": "1HGCM82633A123456",
  "make": "Honda",
  "model": "Accord",
  "year": 2023,
  "licensePlate": "FLA-1001",
  "vehicleType": "sedan",
  "fuelType": "gasoline",
  "status": "active",
  "odometer": 12500.00,
  "purchaseDate": "2023-01-15",
  "purchasePrice": 28000.00,
  "currentValue": 24000.00,
  "gpsDeviceId": "GPS-001",
  "lastGpsUpdate": "2025-11-08T14:30:00Z",
  "latitude": 30.4518,
  "longitude": -84.2807,
  "assignedDriver": {...},
  "assignedFacility": {...},
  "telematicsData": {...},
  "maintenanceSchedules": [...]
}
```

#### POST /api/vehicles
Create a new vehicle.

**Request:**
```json
{
  "vin": "1HGCM82633A123456",
  "make": "Honda",
  "model": "Accord",
  "year": 2023,
  "licensePlate": "FLA-1001",
  "vehicleType": "sedan",
  "fuelType": "gasoline",
  "purchaseDate": "2023-01-15",
  "purchasePrice": 28000.00
}
```

#### PUT /api/vehicles/:id
Update a vehicle.

#### DELETE /api/vehicles/:id
Soft delete a vehicle (sets status to retired).

---

### Work Orders

#### GET /api/work-orders
List all work orders.

**Query Parameters:**
- `status` (string): Filter by status
- `vehicleId` (uuid): Filter by vehicle
- `technicianId` (uuid): Filter by assigned technician
- `priority` (string): Filter by priority
- `startDate` (date): Filter by date range
- `endDate` (date): Filter by date range

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "workOrderNumber": "WO-2025-001",
      "vehicle": {...},
      "facility": {...},
      "assignedTechnician": {...},
      "type": "preventive_maintenance",
      "priority": "medium",
      "status": "completed",
      "description": "Standard 10,000 mile service",
      "scheduledStart": "2025-11-01",
      "actualEnd": "2025-11-01T16:30:00Z",
      "laborHours": 2.5,
      "laborCost": 187.50,
      "partsCost": 142.50,
      "totalCost": 330.00
    }
  ],
  "total": 100
}
```

#### POST /api/work-orders
Create a new work order.

**Request:**
```json
{
  "vehicleId": "uuid",
  "facilityId": "uuid",
  "type": "repair",
  "priority": "high",
  "description": "Replace brake pads",
  "scheduledStart": "2025-11-10",
  "scheduledEnd": "2025-11-10"
}
```

---

### Drivers

#### GET /api/drivers
List all drivers.

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "user": {
        "email": "john.smith@example.com",
        "firstName": "John",
        "lastName": "Smith",
        "phone": "+1-850-555-0101"
      },
      "licenseNumber": "S650-123-45-678-0",
      "licenseState": "FL",
      "licenseExpiration": "2026-12-31",
      "cdlClass": "A",
      "cdlEndorsements": ["T", "N"],
      "medicalCardExpiration": "2026-06-30",
      "status": "active",
      "safetyScore": 98.5,
      "totalMilesDriven": 125000.00
    }
  ]
}
```

---

### Fuel Transactions

#### GET /api/fuel/transactions
List fuel transactions.

**Query Parameters:**
- `vehicleId` (uuid)
- `driverId` (uuid)
- `startDate` (date)
- `endDate` (date)

#### POST /api/fuel/transactions
Record a new fuel transaction.

**Request:**
```json
{
  "vehicleId": "uuid",
  "driverId": "uuid",
  "gallons": 12.5,
  "pricePerGallon": 3.299,
  "odometerReading": 12100.00,
  "fuelType": "Regular Unleaded",
  "location": "Shell Station - Capital Circle",
  "latitude": 30.4518,
  "longitude": -84.2807
}
```

---

### Routes

#### GET /api/routes
List routes.

#### POST /api/routes
Create a new route.

**Request:**
```json
{
  "routeName": "Tallahassee to Jacksonville",
  "vehicleId": "uuid",
  "driverId": "uuid",
  "plannedStartTime": "2025-11-10T06:00:00Z",
  "plannedEndTime": "2025-11-10T10:30:00Z",
  "waypoints": [
    {"address": "Tallahassee HQ", "lat": 30.4518, "lng": -84.2807},
    {"address": "Jacksonville", "lat": 30.3322, "lng": -81.6557}
  ]
}
```

---

### Reports

#### GET /api/reports/fleet-summary
Get fleet summary statistics.

**Response:**
```json
{
  "totalVehicles": 10,
  "activeVehicles": 8,
  "vehiclesInMaintenance": 2,
  "totalDrivers": 4,
  "activeDrivers": 4,
  "openWorkOrders": 2,
  "avgSafetyScore": 97.2,
  "totalFuelCost": 15234.50,
  "avgMPG": 24.3
}
```

#### GET /api/reports/maintenance-due
Get vehicles due for maintenance.

#### GET /api/reports/fuel-efficiency
Get fuel efficiency report.

**Query Parameters:**
- `vehicleId` (uuid, optional)
- `startDate` (date, required)
- `endDate` (date, required)

---

## Error Handling

All errors follow a consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid vehicle ID format",
    "field": "vehicleId",
    "details": "Vehicle ID must be a valid UUID"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing authentication token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Rate Limiting

API requests are rate-limited per user:

- **Global limit**: 100 requests per minute
- **Auth endpoints**: 5 requests per minute
- **Standard endpoints**: 60 requests per minute

Rate limit headers are included in every response:

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1699564800
```

---

## Examples

### Complete Workflow: Create Work Order

1. **Get vehicles**:
```bash
curl -X GET https://fleet.capitaltechalliance.com/api/vehicles \
  -H "Authorization: Bearer YOUR_TOKEN"
```

2. **Create work order**:
```bash
curl -X POST https://fleet.capitaltechalliance.com/api/work-orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "uuid",
    "type": "preventive_maintenance",
    "priority": "medium",
    "description": "Oil change and tire rotation",
    "scheduledStart": "2025-11-15"
  }'
```

3. **Update work order status**:
```bash
curl -X PUT https://fleet.capitaltechalliance.com/api/work-orders/uuid \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "actualStart": "2025-11-15T08:00:00Z"
  }'
```

---

## Support

- **API Status**: https://status.capitaltechalliance.com
- **Support Email**: api-support@capitaltechalliance.com
- **Documentation**: https://docs.fleet.capitaltechalliance.com

