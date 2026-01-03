# Fleet Management Platform - API Documentation

**Version:** 1.0.0
**Base URL:** `https://proud-bay-0fdc8040f.3.azurestaticapps.net/api`
**Last Updated:** January 2, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [API Categories](#api-categories)
4. [Core Fleet Management](#core-fleet-management)
5. [Asset Management](#asset-management)
6. [Maintenance & Work Orders](#maintenance--work-orders)
7. [Fuel Management](#fuel-management)
8. [GPS & Tracking](#gps--tracking)
9. [EV Management](#ev-management)
10. [Document Management](#document-management)
11. [Analytics & Reporting](#analytics--reporting)
12. [AI & Automation](#ai--automation)
13. [Mobile Integration](#mobile-integration)
14. [Safety & Compliance](#safety--compliance)
15. [Integration Guides](#integration-guides)
16. [Error Handling](#error-handling)
17. [Rate Limiting](#rate-limiting)
18. [Best Practices](#best-practices)

---

## Overview

The Fleet Management Platform API is a comprehensive RESTful API designed for managing vehicle fleets, assets, maintenance, compliance, and operations. It provides secure, scalable endpoints with multi-tenant isolation, role-based access control (RBAC), and real-time capabilities.

### Key Features

- **Multi-tenant Architecture**: Complete tenant isolation with Row-Level Security (RLS)
- **Role-Based Access Control**: Granular permissions (Admin, Manager, User, Guest)
- **Real-time Updates**: WebSocket support for live data
- **AI-Powered Features**: Semantic search, predictive maintenance, route optimization
- **Comprehensive Auditing**: Full audit trail for all operations
- **FIPS-Compliant Security**: Enterprise-grade encryption and authentication

### Technology Stack

- **Runtime**: Node.js with Express
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT with FIPS-compliant crypto
- **Caching**: Redis for performance optimization
- **Monitoring**: Application Insights & Sentry

---

## Authentication & Authorization

### Authentication Flow

The API uses **JWT (JSON Web Tokens)** for authentication with FIPS 140-2 compliant cryptography.

#### 1. OAuth 2.0 Authentication (Recommended)

**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "email": "admin@fleet.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@fleet.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "admin",
    "tenant_id": "tenant-uuid",
    "permissions": ["vehicle:read", "vehicle:write", ...]
  },
  "expires_in": 86400
}
```

#### 2. Microsoft Azure AD Authentication

**Endpoint:** `POST /api/microsoft-auth/login`

**Request:**
```json
{
  "code": "authorization_code_from_azure",
  "redirect_uri": "https://yourapp.com/auth/callback"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... },
  "microsoft_token": "azure_access_token"
}
```

### Authorization Headers

Include the JWT token in all API requests:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### CSRF Protection

For state-changing operations (POST, PUT, DELETE), include a CSRF token:

**Get CSRF Token:**
```http
GET /api/csrf-token
```

**Response:**
```json
{
  "csrfToken": "random-token-here"
}
```

**Include in requests:**
```http
X-CSRF-Token: random-token-here
```

### Role-Based Access Control (RBAC)

| Role | Permissions | Description |
|------|-------------|-------------|
| **Admin** | Full access | Complete system control |
| **Manager** | Read/Write (limited) | Manage fleet operations |
| **User** | Read/Write (own scope) | Standard user access |
| **Guest** | Read-only | View-only access |

### Permissions Structure

```typescript
PERMISSIONS = {
  // Vehicles
  VEHICLE_READ: "vehicle:read",
  VEHICLE_CREATE: "vehicle:create",
  VEHICLE_UPDATE: "vehicle:update",
  VEHICLE_DELETE: "vehicle:delete",

  // Maintenance
  MAINTENANCE_READ: "maintenance:read",
  MAINTENANCE_CREATE: "maintenance:create",
  MAINTENANCE_UPDATE: "maintenance:update",
  MAINTENANCE_DELETE: "maintenance:delete",

  // And more...
}
```

---

## API Categories

The API is organized into the following categories:

1. **Core Fleet Management** - Vehicles, drivers, facilities
2. **Asset Management** - Heavy equipment, multi-asset tracking
3. **Maintenance & Work Orders** - Preventive/corrective maintenance
4. **Fuel Management** - Transactions, purchasing, analytics
5. **GPS & Tracking** - Real-time location, geofencing
6. **EV Management** - Charging stations, sessions, optimization
7. **Document Management** - OCR, storage, search
8. **Analytics & Reporting** - Executive dashboards, custom reports
9. **AI & Automation** - Semantic search, predictive analytics
10. **Mobile Integration** - Mobile apps, OBD2, notifications
11. **Safety & Compliance** - Incidents, OSHA, inspections

---

## Core Fleet Management

### Vehicles

#### List All Vehicles

```http
GET /api/vehicles?page=1&pageSize=20&search=ford&status=active
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `pageSize` (number): Items per page (default: 20, max: 100)
- `search` (string): Search by make, model, VIN, or license plate
- `status` (string): Filter by status (active, maintenance, retired)

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "tenant_id": "tenant-uuid",
      "vin": "1HGBH41JXMN109186",
      "license_plate": "ABC-123",
      "make": "Ford",
      "model": "F-150",
      "year": 2023,
      "status": "active",
      "odometer": 45678,
      "fuel_type": "gasoline",
      "assigned_driver_id": "driver-uuid",
      "facility_id": "facility-uuid",
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 150
}
```

#### Get Vehicle by ID

```http
GET /api/vehicles/:id
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "tenant_id": "tenant-uuid",
    "vin": "1HGBH41JXMN109186",
    "license_plate": "ABC-123",
    "make": "Ford",
    "model": "F-150",
    "year": 2023,
    "status": "active",
    "odometer": 45678,
    "engine_hours": 1234,
    "fuel_type": "gasoline",
    "fuel_capacity": 26.0,
    "assigned_driver_id": "driver-uuid",
    "facility_id": "facility-uuid",
    "purchase_date": "2023-01-15",
    "purchase_price": 45000.00,
    "current_value": 38000.00,
    "insurance_policy": "POL-12345",
    "registration_expiry": "2025-01-15",
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  }
}
```

#### Create Vehicle

```http
POST /api/vehicles
Content-Type: application/json
Authorization: Bearer {token}
X-CSRF-Token: {csrf_token}
```

**Request Body:**
```json
{
  "vin": "1HGBH41JXMN109186",
  "license_plate": "ABC-123",
  "make": "Ford",
  "model": "F-150",
  "year": 2023,
  "fuel_type": "gasoline",
  "fuel_capacity": 26.0,
  "status": "active",
  "purchase_date": "2023-01-15",
  "purchase_price": 45000.00,
  "facility_id": "facility-uuid"
}
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "tenant_id": "tenant-uuid",
    "vin": "1HGBH41JXMN109186",
    ...
  }
}
```

**Validation Rules:**
- `vin`: 17 characters, alphanumeric
- `year`: 1900-2100
- `make`, `model`: Required, 1-100 characters
- `fuel_type`: One of: gasoline, diesel, electric, hybrid, cng, lpg

#### Update Vehicle

```http
PUT /api/vehicles/:id
Content-Type: application/json
Authorization: Bearer {token}
X-CSRF-Token: {csrf_token}
```

**Request Body:**
```json
{
  "odometer": 46000,
  "status": "maintenance",
  "assigned_driver_id": "new-driver-uuid"
}
```

#### Delete Vehicle

```http
DELETE /api/vehicles/:id
Authorization: Bearer {token}
X-CSRF-Token: {csrf_token}
```

**Response:**
```json
{
  "message": "Vehicle deleted successfully"
}
```

---

### Drivers

#### List All Drivers

```http
GET /api/drivers?page=1&limit=50
```

**Response:**
```json
{
  "data": [
    {
      "id": "driver-uuid",
      "tenant_id": "tenant-uuid",
      "email": "john.doe@fleet.com",
      "first_name": "John",
      "last_name": "Doe",
      "phone": "+1-555-0100",
      "license_number": "D1234567",
      "license_expiry": "2026-12-31",
      "license_class": "CDL-A",
      "hire_date": "2020-01-15",
      "is_active": true,
      "role": "driver",
      "created_at": "2020-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 125,
    "pages": 3
  }
}
```

#### Get Driver by ID

```http
GET /api/drivers/:id
```

#### Create Driver

```http
POST /api/drivers
Content-Type: application/json
Authorization: Bearer {token}
X-CSRF-Token: {csrf_token}
```

**Request Body:**
```json
{
  "email": "john.doe@fleet.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1-555-0100",
  "license_number": "D1234567",
  "license_expiry": "2026-12-31",
  "license_class": "CDL-A",
  "hire_date": "2020-01-15"
}
```

---

## Asset Management

### Heavy Equipment

Track construction equipment, trailers, and other fleet assets.

#### List Heavy Equipment

```http
GET /api/heavy-equipment?type=excavator&status=active
```

**Query Parameters:**
- `type`: Filter by equipment type (excavator, dozer, crane, etc.)
- `status`: Filter by status (active, maintenance, retired)
- `page`, `pageSize`: Pagination

**Response:**
```json
{
  "data": [
    {
      "id": "equipment-uuid",
      "tenant_id": "tenant-uuid",
      "asset_type": "excavator",
      "make": "Caterpillar",
      "model": "320",
      "serial_number": "CAT123456",
      "year": 2022,
      "status": "active",
      "engine_hours": 1500,
      "location": "Site A",
      "assigned_to": "operator-uuid",
      "purchase_date": "2022-03-15",
      "purchase_price": 250000.00
    }
  ],
  "total": 45
}
```

#### Track Asset Location

```http
GET /api/assets-mobile/:assetId/location
```

**Response:**
```json
{
  "asset_id": "equipment-uuid",
  "location": {
    "latitude": 30.4383,
    "longitude": -84.2807,
    "accuracy": 10,
    "timestamp": "2024-01-15T14:30:00Z"
  },
  "status": "in_use",
  "operator": "John Doe"
}
```

---

## Maintenance & Work Orders

### Maintenance Records

#### List Maintenance Records

```http
GET /api/maintenance?vehicleId=123&status=pending&page=1&pageSize=20
```

**Query Parameters:**
- `vehicleId` (number): Filter by vehicle ID
- `status`: Filter by status (pending, in_progress, completed, cancelled)
- `type`: Filter by type (preventive, corrective, inspection)
- `startDate`, `endDate`: Date range filter

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "tenant_id": "tenant-uuid",
      "vehicle_id": 123,
      "type": "preventive",
      "status": "pending",
      "description": "Oil change and tire rotation",
      "odometer_reading": 45000,
      "scheduled_date": "2024-01-20",
      "completed_date": null,
      "technician_id": "tech-uuid",
      "cost": 150.00,
      "notes": "Due for service",
      "created_at": "2024-01-10T10:00:00Z"
    }
  ],
  "total": 25
}
```

#### Get Maintenance by ID

```http
GET /api/maintenance/:id
```

#### Get Maintenance History by Vehicle

```http
GET /api/maintenance/vehicle/:vehicleId
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "type": "preventive",
      "description": "Oil change",
      "completed_date": "2024-01-15",
      "cost": 75.00
    },
    {
      "id": 2,
      "type": "corrective",
      "description": "Brake replacement",
      "completed_date": "2024-01-10",
      "cost": 450.00
    }
  ],
  "total_cost": 525.00,
  "total_records": 2
}
```

#### Create Maintenance Record

```http
POST /api/maintenance
Content-Type: application/json
Authorization: Bearer {token}
X-CSRF-Token: {csrf_token}
```

**Request Body:**
```json
{
  "vehicle_id": 123,
  "type": "preventive",
  "description": "Oil change and tire rotation",
  "odometer_reading": 45000,
  "scheduled_date": "2024-01-20",
  "technician_id": "tech-uuid",
  "estimated_cost": 150.00,
  "notes": "Regular maintenance"
}
```

**Validation:**
- `vehicle_id`: Required, must exist in tenant
- `type`: One of: preventive, corrective, inspection
- `description`: Required, 1-1000 characters
- `odometer_reading`: Optional, positive number

#### Update Maintenance Record

```http
PUT /api/maintenance/:id
Content-Type: application/json
Authorization: Bearer {token}
X-CSRF-Token: {csrf_token}
```

**Request Body:**
```json
{
  "status": "completed",
  "completed_date": "2024-01-20",
  "actual_cost": 165.00,
  "notes": "Completed successfully. Also replaced air filter."
}
```

---

### Work Orders

#### List Work Orders

```http
GET /api/work-orders?status=open&priority=high&page=1&limit=50
```

**Query Parameters:**
- `status`: Filter by status (open, in_progress, on_hold, completed, cancelled)
- `priority`: Filter by priority (low, medium, high, critical)
- `facility_id`: Filter by facility
- `assigned_technician_id`: Filter by technician

**Response:**
```json
{
  "data": [
    {
      "id": "wo-uuid",
      "work_order_number": "WO-2024-001",
      "vehicle_id": "vehicle-uuid",
      "facility_id": "facility-uuid",
      "assigned_technician_id": "tech-uuid",
      "type": "preventive",
      "priority": "high",
      "status": "open",
      "description": "Engine diagnostic and repair",
      "odometer_reading": 50000,
      "engine_hours_reading": 1250,
      "scheduled_start": "2024-01-20T08:00:00Z",
      "scheduled_end": "2024-01-20T17:00:00Z",
      "actual_start": null,
      "actual_end": null,
      "labor_cost": 0,
      "parts_cost": 0,
      "total_cost": 0,
      "notes": "",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 42
  }
}
```

#### Create Work Order

```http
POST /api/work-orders
Content-Type: application/json
Authorization: Bearer {token}
X-CSRF-Token: {csrf_token}
```

**Request Body:**
```json
{
  "work_order_number": "WO-2024-001",
  "vehicle_id": "vehicle-uuid",
  "facility_id": "facility-uuid",
  "assigned_technician_id": "tech-uuid",
  "type": "preventive",
  "priority": "high",
  "description": "Engine diagnostic and repair",
  "odometer_reading": 50000,
  "scheduled_start": "2024-01-20T08:00:00Z",
  "scheduled_end": "2024-01-20T17:00:00Z"
}
```

---

## Fuel Management

### Fuel Transactions

#### List Fuel Transactions

```http
GET /api/fuel-transactions?vehicleId=123&startDate=2024-01-01&endDate=2024-01-31
```

**Query Parameters:**
- `vehicleId` (number): Filter by vehicle
- `driverId` (string): Filter by driver
- `paymentMethod`: Filter by payment method (fleet_card, cash, credit_card)
- `startDate`, `endDate`: Date range filter
- `page`, `pageSize`: Pagination

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "tenant_id": "tenant-uuid",
      "vehicle_id": 123,
      "driver_id": "driver-uuid",
      "transaction_date": "2024-01-15T14:30:00Z",
      "odometer": 45678,
      "gallons": 15.5,
      "price_per_gallon": 3.45,
      "total_cost": 53.48,
      "fuel_type": "gasoline",
      "payment_method": "fleet_card",
      "card_last_four": "1234",
      "merchant": "Shell Station",
      "location": "123 Main St, Tallahassee, FL",
      "created_at": "2024-01-15T14:35:00Z"
    }
  ],
  "total": 156
}
```

#### Get Fuel Transaction by ID

```http
GET /api/fuel-transactions/:id
```

#### Create Fuel Transaction

```http
POST /api/fuel-transactions
Content-Type: application/json
Authorization: Bearer {token}
X-CSRF-Token: {csrf_token}
```

**Request Body:**
```json
{
  "vehicle_id": 123,
  "driver_id": "driver-uuid",
  "transaction_date": "2024-01-15T14:30:00Z",
  "odometer": 45678,
  "gallons": 15.5,
  "price_per_gallon": 3.45,
  "fuel_type": "gasoline",
  "payment_method": "fleet_card",
  "card_last_four": "1234",
  "merchant": "Shell Station",
  "location": "123 Main St, Tallahassee, FL"
}
```

**Validation:**
- `vehicle_id`: Required, must exist in tenant
- `gallons`: Required, positive number
- `price_per_gallon`: Required, positive number
- `fuel_type`: One of: gasoline, diesel, electric, hybrid, cng, lpg
- `payment_method`: One of: fleet_card, cash, credit_card, invoice

---

## GPS & Tracking

### Real-Time Vehicle Positions

#### Get All Vehicle Positions

```http
GET /api/gps?status=moving&page=1&limit=50
```

**Query Parameters:**
- `status`: Filter by status (moving, idle, stopped)
- `minLat`, `maxLat`, `minLng`, `maxLng`: Bounding box filter
- `page`, `limit`: Pagination

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "vehicle_id": 123,
      "latitude": 30.4383,
      "longitude": -84.2807,
      "speed": 45.5,
      "heading": 90,
      "status": "moving",
      "odometer": 45678,
      "timestamp": "2024-01-15T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

#### Get Vehicle Position History

```http
GET /api/gps/vehicle/:vehicleId/history?startTime=2024-01-15T00:00:00Z&endTime=2024-01-15T23:59:59Z
```

**Response:**
```json
{
  "success": true,
  "vehicle_id": 123,
  "data": [
    {
      "latitude": 30.4383,
      "longitude": -84.2807,
      "speed": 45.5,
      "heading": 90,
      "timestamp": "2024-01-15T08:00:00Z"
    },
    {
      "latitude": 30.4450,
      "longitude": -84.2900,
      "speed": 50.0,
      "heading": 95,
      "timestamp": "2024-01-15T08:05:00Z"
    }
  ],
  "total_points": 288
}
```

### Geofencing

#### List Geofences

```http
GET /api/geofences
```

**Response:**
```json
{
  "data": [
    {
      "id": "geofence-uuid",
      "name": "Main Depot",
      "type": "facility",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [-84.2807, 30.4383],
            [-84.2750, 30.4383],
            [-84.2750, 30.4420],
            [-84.2807, 30.4420],
            [-84.2807, 30.4383]
          ]
        ]
      },
      "alerts_enabled": true,
      "created_at": "2024-01-10T10:00:00Z"
    }
  ]
}
```

#### Create Geofence

```http
POST /api/geofences
Content-Type: application/json
Authorization: Bearer {token}
X-CSRF-Token: {csrf_token}
```

**Request Body:**
```json
{
  "name": "Service Area North",
  "type": "service_area",
  "geometry": {
    "type": "Polygon",
    "coordinates": [...]
  },
  "alerts_enabled": true,
  "alert_on_entry": true,
  "alert_on_exit": true
}
```

#### Get Geofence Alerts

```http
GET /api/gps/geofence-alerts?startDate=2024-01-01&endDate=2024-01-31
```

**Response:**
```json
{
  "data": [
    {
      "id": "alert-uuid",
      "vehicle_id": 123,
      "geofence_id": "geofence-uuid",
      "alert_type": "exit",
      "timestamp": "2024-01-15T14:30:00Z",
      "location": {
        "latitude": 30.4383,
        "longitude": -84.2807
      }
    }
  ]
}
```

---

## EV Management

### Charging Stations

#### List Charging Stations

```http
GET /api/charging-stations?status=available
```

**Response:**
```json
{
  "data": [
    {
      "id": "station-uuid",
      "name": "Depot Charger 1",
      "location": "Main Depot",
      "latitude": 30.4383,
      "longitude": -84.2807,
      "status": "available",
      "power_output_kw": 50,
      "connector_type": "CCS",
      "cost_per_kwh": 0.12,
      "is_public": false,
      "created_at": "2023-06-15T10:00:00Z"
    }
  ]
}
```

#### Get Charging Station by ID

```http
GET /api/charging-stations/:id
```

### Charging Sessions

#### List Charging Sessions

```http
GET /api/charging-sessions?vehicleId=123&status=active
```

**Response:**
```json
{
  "data": [
    {
      "id": "session-uuid",
      "vehicle_id": 123,
      "station_id": "station-uuid",
      "start_time": "2024-01-15T14:00:00Z",
      "end_time": null,
      "start_battery_level": 20,
      "end_battery_level": null,
      "energy_delivered_kwh": 15.5,
      "cost": 1.86,
      "status": "active",
      "driver_id": "driver-uuid"
    }
  ]
}
```

#### Start Charging Session

```http
POST /api/charging-sessions
Content-Type: application/json
Authorization: Bearer {token}
X-CSRF-Token: {csrf_token}
```

**Request Body:**
```json
{
  "vehicle_id": 123,
  "station_id": "station-uuid",
  "start_battery_level": 20,
  "driver_id": "driver-uuid"
}
```

#### End Charging Session

```http
PUT /api/charging-sessions/:id/complete
Content-Type: application/json
Authorization: Bearer {token}
X-CSRF-Token: {csrf_token}
```

**Request Body:**
```json
{
  "end_battery_level": 80,
  "energy_delivered_kwh": 25.5
}
```

---

## Document Management

### Documents

#### Upload Document

```http
POST /api/documents
Content-Type: multipart/form-data
Authorization: Bearer {token}
X-CSRF-Token: {csrf_token}
```

**Form Data:**
- `file`: Document file (PDF, DOCX, images)
- `document_type`: Type of document (invoice, registration, insurance, etc.)
- `vehicle_id`: (Optional) Associated vehicle
- `driver_id`: (Optional) Associated driver
- `description`: Document description

**Response:**
```json
{
  "id": "doc-uuid",
  "filename": "registration.pdf",
  "document_type": "registration",
  "file_size": 1048576,
  "mime_type": "application/pdf",
  "storage_path": "documents/2024/01/registration.pdf",
  "ocr_status": "processing",
  "created_at": "2024-01-15T10:00:00Z"
}
```

#### List Documents

```http
GET /api/documents?vehicleId=123&documentType=registration
```

**Response:**
```json
{
  "data": [
    {
      "id": "doc-uuid",
      "filename": "registration.pdf",
      "document_type": "registration",
      "file_size": 1048576,
      "vehicle_id": 123,
      "created_at": "2024-01-15T10:00:00Z",
      "download_url": "/api/documents/doc-uuid/download"
    }
  ]
}
```

#### Download Document

```http
GET /api/documents/:id/download
Authorization: Bearer {token}
```

**Response:** Binary file stream

#### OCR Processing

```http
POST /api/documents/:id/ocr
Authorization: Bearer {token}
X-CSRF-Token: {csrf_token}
```

**Response:**
```json
{
  "document_id": "doc-uuid",
  "ocr_status": "completed",
  "extracted_text": "...",
  "confidence": 0.95,
  "entities": {
    "dates": ["2024-01-15"],
    "amounts": [150.00],
    "vendor": "ABC Auto Parts"
  }
}
```

---

## Analytics & Reporting

### Executive Dashboard

#### Get Dashboard Summary

```http
GET /api/executive-dashboard/summary?period=30d
```

**Query Parameters:**
- `period`: Time period (7d, 30d, 90d, 1y)
- `startDate`, `endDate`: Custom date range

**Response:**
```json
{
  "summary": {
    "total_vehicles": 150,
    "active_vehicles": 142,
    "in_maintenance": 8,
    "total_drivers": 125,
    "active_drivers": 118
  },
  "metrics": {
    "total_miles": 456789,
    "total_fuel_cost": 125430.50,
    "total_maintenance_cost": 45620.00,
    "average_mpg": 15.5,
    "utilization_rate": 0.85
  },
  "trends": {
    "miles_trend": "+5.2%",
    "fuel_cost_trend": "-2.1%",
    "maintenance_cost_trend": "+8.5%"
  }
}
```

#### Get Fleet Performance Metrics

```http
GET /api/executive-dashboard/fleet-performance
```

**Response:**
```json
{
  "vehicle_utilization": {
    "average": 85.5,
    "by_type": {
      "sedan": 92.0,
      "truck": 88.5,
      "van": 78.0
    }
  },
  "fuel_efficiency": {
    "fleet_average_mpg": 15.5,
    "best_performers": [
      { "vehicle_id": 45, "mpg": 22.5 },
      { "vehicle_id": 67, "mpg": 21.8 }
    ],
    "worst_performers": [
      { "vehicle_id": 12, "mpg": 10.2 },
      { "vehicle_id": 89, "mpg": 11.5 }
    ]
  },
  "maintenance_metrics": {
    "preventive_compliance": 94.5,
    "average_downtime_days": 2.5,
    "cost_per_vehicle": 3045.00
  }
}
```

### Custom Reports

#### Generate Custom Report

```http
POST /api/custom-reports/generate
Content-Type: application/json
Authorization: Bearer {token}
X-CSRF-Token: {csrf_token}
```

**Request Body:**
```json
{
  "report_type": "fuel_analysis",
  "date_range": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "filters": {
    "vehicle_ids": [123, 456],
    "fuel_types": ["gasoline", "diesel"]
  },
  "grouping": "vehicle",
  "format": "pdf"
}
```

**Response:**
```json
{
  "report_id": "report-uuid",
  "status": "processing",
  "estimated_completion": "2024-01-15T10:05:00Z",
  "download_url": null
}
```

#### Check Report Status

```http
GET /api/custom-reports/:reportId/status
```

**Response:**
```json
{
  "report_id": "report-uuid",
  "status": "completed",
  "download_url": "/api/custom-reports/report-uuid/download",
  "created_at": "2024-01-15T10:00:00Z",
  "completed_at": "2024-01-15T10:03:00Z"
}
```

---

## AI & Automation

### AI-Powered Semantic Search

#### Semantic Search

```http
POST /api/ai-search/semantic
Content-Type: application/json
Authorization: Bearer {token}
X-CSRF-Token: {csrf_token}
```

**Request Body:**
```json
{
  "query": "Find all maintenance records for vehicles with engine issues in the last 90 days",
  "limit": 10,
  "minScore": 0.7,
  "filter": {
    "document_type": "maintenance"
  }
}
```

**Response:**
```json
{
  "query": "Find all maintenance records for vehicles with engine issues in the last 90 days",
  "results": [
    {
      "id": "doc-uuid",
      "content": "Engine diagnostic performed. Found issue with fuel injector...",
      "score": 0.92,
      "metadata": {
        "vehicle_id": 123,
        "date": "2024-01-10",
        "type": "corrective"
      }
    }
  ],
  "count": 8,
  "searchTimeMs": 145,
  "strategy": "semantic"
}
```

#### Hybrid Search (Keyword + Semantic)

```http
POST /api/ai-search/hybrid
Content-Type: application/json
Authorization: Bearer {token}
X-CSRF-Token: {csrf_token}
```

**Request Body:**
```json
{
  "query": "brake replacement",
  "limit": 20,
  "keywordWeight": 0.3,
  "vectorWeight": 0.7
}
```

### AI Task Prioritization

#### Get Prioritized Tasks

```http
POST /api/ai-tasks/prioritize
Content-Type: application/json
Authorization: Bearer {token}
X-CSRF-Token: {csrf_token}
```

**Request Body:**
```json
{
  "tasks": [
    {
      "id": "task-1",
      "title": "Oil change for Vehicle 123",
      "type": "maintenance",
      "due_date": "2024-01-20"
    },
    {
      "id": "task-2",
      "title": "Brake inspection for Vehicle 456",
      "type": "inspection",
      "due_date": "2024-01-18"
    }
  ]
}
```

**Response:**
```json
{
  "prioritized_tasks": [
    {
      "id": "task-2",
      "priority_score": 0.92,
      "reason": "Safety-critical inspection due in 3 days",
      "recommended_action": "Schedule immediately"
    },
    {
      "id": "task-1",
      "priority_score": 0.75,
      "reason": "Preventive maintenance due in 5 days",
      "recommended_action": "Schedule within 48 hours"
    }
  ]
}
```

### AI Dispatch Optimization

```http
POST /api/ai-dispatch/optimize
Content-Type: application/json
Authorization: Bearer {token}
X-CSRF-Token: {csrf_token}
```

**Request Body:**
```json
{
  "jobs": [
    {
      "id": "job-1",
      "location": { "lat": 30.4383, "lng": -84.2807 },
      "duration": 60,
      "priority": "high"
    }
  ],
  "vehicles": [
    {
      "id": 123,
      "location": { "lat": 30.4500, "lng": -84.2900 },
      "capacity": 1000
    }
  ]
}
```

**Response:**
```json
{
  "assignments": [
    {
      "vehicle_id": 123,
      "jobs": ["job-1"],
      "route": [...],
      "estimated_time": 120,
      "estimated_distance": 15.5
    }
  ],
  "optimization_score": 0.88
}
```

---

## Mobile Integration

### Mobile Notifications

#### Send Push Notification

```http
POST /api/push-notifications
Content-Type: application/json
Authorization: Bearer {token}
X-CSRF-Token: {csrf_token}
```

**Request Body:**
```json
{
  "user_id": "driver-uuid",
  "title": "Vehicle Assignment",
  "body": "You have been assigned to Vehicle #123",
  "data": {
    "type": "vehicle_assignment",
    "vehicle_id": 123
  },
  "priority": "high"
}
```

### Mobile Trip Logging

#### Start Trip

```http
POST /api/mobile-trips/start
Content-Type: application/json
Authorization: Bearer {token}
X-CSRF-Token: {csrf_token}
```

**Request Body:**
```json
{
  "vehicle_id": 123,
  "driver_id": "driver-uuid",
  "start_location": {
    "latitude": 30.4383,
    "longitude": -84.2807
  },
  "start_odometer": 45678,
  "trip_type": "business"
}
```

**Response:**
```json
{
  "trip_id": "trip-uuid",
  "status": "in_progress",
  "start_time": "2024-01-15T08:00:00Z"
}
```

#### End Trip

```http
PUT /api/mobile-trips/:tripId/end
Content-Type: application/json
Authorization: Bearer {token}
X-CSRF-Token: {csrf_token}
```

**Request Body:**
```json
{
  "end_location": {
    "latitude": 30.4500,
    "longitude": -84.2900
  },
  "end_odometer": 45700,
  "purpose": "Client meeting"
}
```

### Mobile Photo Upload

```http
POST /api/mobile-photos
Content-Type: multipart/form-data
Authorization: Bearer {token}
X-CSRF-Token: {csrf_token}
```

**Form Data:**
- `photo`: Image file
- `vehicle_id`: Vehicle ID
- `photo_type`: Type (damage, inspection, fuel_receipt)
- `latitude`, `longitude`: GPS coordinates
- `notes`: Optional notes

---

## Safety & Compliance

### Safety Incidents

#### List Incidents

```http
GET /api/safety-incidents?severity=high&status=open
```

**Response:**
```json
{
  "data": [
    {
      "id": "incident-uuid",
      "incident_number": "INC-2024-001",
      "vehicle_id": 123,
      "driver_id": "driver-uuid",
      "incident_date": "2024-01-15T14:30:00Z",
      "severity": "high",
      "type": "collision",
      "status": "under_investigation",
      "description": "Minor collision at intersection",
      "location": "Main St & 5th Ave",
      "injuries": false,
      "police_report_number": "PR-123456",
      "created_at": "2024-01-15T14:45:00Z"
    }
  ]
}
```

#### Report Incident

```http
POST /api/safety-incidents
Content-Type: application/json
Authorization: Bearer {token}
X-CSRF-Token: {csrf_token}
```

**Request Body:**
```json
{
  "vehicle_id": 123,
  "driver_id": "driver-uuid",
  "incident_date": "2024-01-15T14:30:00Z",
  "severity": "high",
  "type": "collision",
  "description": "Minor collision at intersection",
  "location": "Main St & 5th Ave",
  "latitude": 30.4383,
  "longitude": -84.2807,
  "injuries": false,
  "witnesses": []
}
```

### OSHA Compliance

#### Get Compliance Forms

```http
GET /api/osha-compliance/forms
```

**Response:**
```json
{
  "forms": [
    {
      "id": "form-uuid",
      "form_type": "300",
      "form_name": "Log of Work-Related Injuries and Illnesses",
      "year": 2024,
      "status": "in_progress",
      "last_updated": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Vehicle Inspections

#### List Inspections

```http
GET /api/inspections?vehicleId=123&status=completed
```

**Response:**
```json
{
  "data": [
    {
      "id": "inspection-uuid",
      "vehicle_id": 123,
      "inspector_id": "driver-uuid",
      "inspection_date": "2024-01-15T08:00:00Z",
      "type": "pre_trip",
      "status": "completed",
      "passed": true,
      "odometer": 45678,
      "items": [
        {
          "item": "brakes",
          "status": "pass",
          "notes": ""
        },
        {
          "item": "tires",
          "status": "pass",
          "notes": ""
        }
      ],
      "defects": [],
      "signature": "base64_signature_data"
    }
  ]
}
```

#### Create Inspection

```http
POST /api/inspections
Content-Type: application/json
Authorization: Bearer {token}
X-CSRF-Token: {csrf_token}
```

**Request Body:**
```json
{
  "vehicle_id": 123,
  "inspector_id": "driver-uuid",
  "type": "pre_trip",
  "odometer": 45678,
  "items": [
    { "item": "brakes", "status": "pass" },
    { "item": "tires", "status": "pass" },
    { "item": "lights", "status": "pass" }
  ],
  "defects": [],
  "signature": "base64_signature_data"
}
```

---

## Integration Guides

### Getting Started

#### 1. Obtain API Credentials

Contact your fleet administrator to receive:
- API endpoint URL
- Tenant ID
- User credentials or OAuth client credentials

#### 2. Authenticate

**Using Username/Password:**
```bash
curl -X POST https://api.fleet.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@company.com",
    "password": "your-password"
  }'
```

**Using Microsoft Azure AD:**
```bash
# Step 1: Redirect user to Azure AD login
https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize
  ?client_id={client_id}
  &response_type=code
  &redirect_uri={redirect_uri}
  &scope=openid profile email

# Step 2: Exchange code for token
curl -X POST https://api.fleet.com/api/microsoft-auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "code": "authorization_code",
    "redirect_uri": "https://yourapp.com/callback"
  }'
```

#### 3. Make API Calls

Include the JWT token in all requests:

```bash
curl -X GET https://api.fleet.com/api/vehicles \
  -H "Authorization: Bearer {your_jwt_token}"
```

### Code Examples

#### JavaScript/Node.js

```javascript
const axios = require('axios');

class FleetAPIClient {
  constructor(baseURL, email, password) {
    this.baseURL = baseURL;
    this.email = email;
    this.password = password;
    this.token = null;
  }

  async authenticate() {
    const response = await axios.post(`${this.baseURL}/api/auth/login`, {
      email: this.email,
      password: this.password
    });
    this.token = response.data.token;
    return this.token;
  }

  async getVehicles(params = {}) {
    const response = await axios.get(`${this.baseURL}/api/vehicles`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      },
      params
    });
    return response.data;
  }

  async createVehicle(vehicleData) {
    // Get CSRF token first
    const csrfResponse = await axios.get(`${this.baseURL}/api/csrf-token`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    const csrfToken = csrfResponse.data.csrfToken;

    // Create vehicle
    const response = await axios.post(
      `${this.baseURL}/api/vehicles`,
      vehicleData,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'X-CSRF-Token': csrfToken
        }
      }
    );
    return response.data;
  }

  async getMaintenanceByVehicle(vehicleId) {
    const response = await axios.get(
      `${this.baseURL}/api/maintenance/vehicle/${vehicleId}`,
      {
        headers: { 'Authorization': `Bearer ${this.token}` }
      }
    );
    return response.data;
  }
}

// Usage
(async () => {
  const client = new FleetAPIClient(
    'https://api.fleet.com',
    'user@company.com',
    'password123'
  );

  await client.authenticate();

  const vehicles = await client.getVehicles({
    page: 1,
    pageSize: 20,
    status: 'active'
  });

  console.log(`Found ${vehicles.total} vehicles`);

  // Create a new vehicle
  const newVehicle = await client.createVehicle({
    vin: '1HGBH41JXMN109186',
    make: 'Ford',
    model: 'F-150',
    year: 2023,
    fuel_type: 'gasoline'
  });

  console.log(`Created vehicle ${newVehicle.data.id}`);
})();
```

#### Python

```python
import requests
from typing import Dict, Optional, List

class FleetAPIClient:
    def __init__(self, base_url: str, email: str, password: str):
        self.base_url = base_url
        self.email = email
        self.password = password
        self.token: Optional[str] = None
        self.session = requests.Session()

    def authenticate(self) -> str:
        """Authenticate and get JWT token"""
        response = self.session.post(
            f"{self.base_url}/api/auth/login",
            json={"email": self.email, "password": self.password}
        )
        response.raise_for_status()
        self.token = response.json()["token"]
        self.session.headers.update({
            "Authorization": f"Bearer {self.token}"
        })
        return self.token

    def get_csrf_token(self) -> str:
        """Get CSRF token for state-changing operations"""
        response = self.session.get(f"{self.base_url}/api/csrf-token")
        response.raise_for_status()
        return response.json()["csrfToken"]

    def get_vehicles(self, **params) -> Dict:
        """Get list of vehicles"""
        response = self.session.get(
            f"{self.base_url}/api/vehicles",
            params=params
        )
        response.raise_for_status()
        return response.json()

    def create_vehicle(self, vehicle_data: Dict) -> Dict:
        """Create a new vehicle"""
        csrf_token = self.get_csrf_token()
        response = self.session.post(
            f"{self.base_url}/api/vehicles",
            json=vehicle_data,
            headers={"X-CSRF-Token": csrf_token}
        )
        response.raise_for_status()
        return response.json()

    def get_fuel_transactions(
        self,
        vehicle_id: Optional[int] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> List[Dict]:
        """Get fuel transactions with optional filters"""
        params = {}
        if vehicle_id:
            params["vehicleId"] = vehicle_id
        if start_date:
            params["startDate"] = start_date
        if end_date:
            params["endDate"] = end_date

        response = self.session.get(
            f"{self.base_url}/api/fuel-transactions",
            params=params
        )
        response.raise_for_status()
        return response.json()["data"]

# Usage
if __name__ == "__main__":
    client = FleetAPIClient(
        "https://api.fleet.com",
        "user@company.com",
        "password123"
    )

    # Authenticate
    client.authenticate()
    print("Authenticated successfully")

    # Get vehicles
    vehicles = client.get_vehicles(page=1, pageSize=20, status="active")
    print(f"Found {vehicles['total']} vehicles")

    # Create a vehicle
    new_vehicle = client.create_vehicle({
        "vin": "1HGBH41JXMN109186",
        "make": "Ford",
        "model": "F-150",
        "year": 2023,
        "fuel_type": "gasoline"
    })
    print(f"Created vehicle {new_vehicle['data']['id']}")

    # Get fuel transactions
    transactions = client.get_fuel_transactions(
        vehicle_id=123,
        start_date="2024-01-01",
        end_date="2024-01-31"
    )
    print(f"Found {len(transactions)} fuel transactions")
```

#### cURL Examples

**List Vehicles:**
```bash
curl -X GET "https://api.fleet.com/api/vehicles?page=1&pageSize=20" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Create Vehicle:**
```bash
# Step 1: Get CSRF token
CSRF_TOKEN=$(curl -X GET "https://api.fleet.com/api/csrf-token" \
  -H "Authorization: Bearer {token}" | jq -r '.csrfToken')

# Step 2: Create vehicle
curl -X POST "https://api.fleet.com/api/vehicles" \
  -H "Authorization: Bearer {token}" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vin": "1HGBH41JXMN109186",
    "make": "Ford",
    "model": "F-150",
    "year": 2023,
    "fuel_type": "gasoline"
  }'
```

**Get Maintenance Records:**
```bash
curl -X GET "https://api.fleet.com/api/maintenance/vehicle/123" \
  -H "Authorization: Bearer {token}"
```

**Create Fuel Transaction:**
```bash
curl -X POST "https://api.fleet.com/api/fuel-transactions" \
  -H "Authorization: Bearer {token}" \
  -H "X-CSRF-Token: {csrf_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicle_id": 123,
    "driver_id": "driver-uuid",
    "transaction_date": "2024-01-15T14:30:00Z",
    "gallons": 15.5,
    "price_per_gallon": 3.45,
    "fuel_type": "gasoline",
    "payment_method": "fleet_card"
  }'
```

### Webhook Integration

The API supports webhooks for real-time event notifications.

#### Configure Webhook

```http
POST /api/webhooks
Content-Type: application/json
Authorization: Bearer {token}
X-CSRF-Token: {csrf_token}
```

**Request:**
```json
{
  "url": "https://your-server.com/webhook",
  "events": [
    "vehicle.created",
    "vehicle.updated",
    "maintenance.due",
    "geofence.entered",
    "geofence.exited"
  ],
  "secret": "your-webhook-secret"
}
```

#### Webhook Payload Example

```json
{
  "event": "geofence.exited",
  "timestamp": "2024-01-15T14:30:00Z",
  "data": {
    "vehicle_id": 123,
    "geofence_id": "geofence-uuid",
    "location": {
      "latitude": 30.4383,
      "longitude": -84.2807
    }
  },
  "signature": "hmac-sha256-signature"
}
```

#### Verify Webhook Signature

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(JSON.stringify(payload)).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}
```

---

## Error Handling

### Standard Error Response

All errors follow this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional context"
  },
  "timestamp": "2024-01-15T14:30:00Z",
  "request_id": "req-uuid"
}
```

### HTTP Status Codes

| Code | Description | Example |
|------|-------------|---------|
| **200** | Success | Request completed successfully |
| **201** | Created | Resource created successfully |
| **400** | Bad Request | Invalid input data |
| **401** | Unauthorized | Missing or invalid token |
| **403** | Forbidden | Insufficient permissions |
| **404** | Not Found | Resource doesn't exist |
| **409** | Conflict | Duplicate resource |
| **422** | Validation Error | Input validation failed |
| **429** | Too Many Requests | Rate limit exceeded |
| **500** | Internal Server Error | Server error |
| **503** | Service Unavailable | Service temporarily unavailable |

### Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| `AUTH_FAILED` | Authentication failed | Check credentials |
| `INVALID_TOKEN` | JWT token invalid | Re-authenticate |
| `TOKEN_EXPIRED` | JWT token expired | Refresh token |
| `PERMISSION_DENIED` | Insufficient permissions | Contact administrator |
| `VALIDATION_ERROR` | Input validation failed | Fix input data |
| `RESOURCE_NOT_FOUND` | Resource doesn't exist | Check ID |
| `DUPLICATE_RESOURCE` | Resource already exists | Use unique values |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Wait before retrying |
| `TENANT_ISOLATION_VIOLATION` | Cross-tenant access attempt | Check tenant context |

### Example Error Responses

**Validation Error (400):**
```json
{
  "error": "Validation error",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "vin",
      "message": "VIN must be exactly 17 characters"
    },
    {
      "field": "year",
      "message": "Year must be between 1900 and 2100"
    }
  ]
}
```

**Authentication Error (401):**
```json
{
  "error": "Invalid credentials",
  "code": "AUTH_FAILED",
  "attempts_remaining": 2
}
```

**Permission Error (403):**
```json
{
  "error": "Insufficient permissions",
  "code": "PERMISSION_DENIED",
  "required_permission": "vehicle:delete"
}
```

**Not Found Error (404):**
```json
{
  "error": "Vehicle not found",
  "code": "RESOURCE_NOT_FOUND",
  "resource_type": "vehicle",
  "resource_id": 123
}
```

**Rate Limit Error (429):**
```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retry_after": 60,
  "limit": 100,
  "window": "1 minute"
}
```

---

## Rate Limiting

### Rate Limit Tiers

| Endpoint Category | Limit | Window | Burst |
|------------------|-------|--------|-------|
| Authentication | 5 requests | 15 minutes | 10 |
| Registration | 3 requests | 1 hour | 5 |
| Read Operations | 100 requests | 1 minute | 200 |
| Write Operations | 50 requests | 1 minute | 100 |
| File Uploads | 10 requests | 1 minute | 20 |
| Global (per IP) | 1000 requests | 15 minutes | 1500 |

### Rate Limit Headers

All responses include rate limit information:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705329600
X-RateLimit-Window: 60
```

### Handling Rate Limits

**Best Practices:**

1. **Implement Exponential Backoff**
```javascript
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.response?.status === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}
```

2. **Respect Retry-After Header**
```javascript
if (response.status === 429) {
  const retryAfter = response.headers['retry-after'];
  await sleep(retryAfter * 1000);
}
```

3. **Use Batch Endpoints**
```http
POST /api/v1/batch
```

---

## Best Practices

### Security Best Practices

1. **Always Use HTTPS**
   - Never send tokens over HTTP
   - All production endpoints use TLS 1.2+

2. **Secure Token Storage**
   ```javascript
   // ❌ Bad - stored in localStorage
   localStorage.setItem('token', token);

   // ✅ Good - httpOnly cookie or secure storage
   // Set by server with httpOnly, secure flags
   ```

3. **Implement Token Refresh**
   ```javascript
   if (isTokenExpiringSoon(token)) {
     token = await refreshToken();
   }
   ```

4. **Validate All Input**
   ```javascript
   // Client-side validation
   const schema = z.object({
     vin: z.string().length(17),
     year: z.number().min(1900).max(2100)
   });
   schema.parse(data);
   ```

5. **Use CSRF Tokens**
   - Always include CSRF token for POST/PUT/DELETE
   - Refresh CSRF token periodically

### Performance Best Practices

1. **Use Pagination**
   ```http
   GET /api/vehicles?page=1&pageSize=20
   ```

2. **Filter Server-Side**
   ```http
   GET /api/fuel-transactions?vehicleId=123&startDate=2024-01-01
   ```

3. **Request Only Needed Fields**
   ```http
   GET /api/vehicles?fields=id,vin,make,model
   ```

4. **Cache Responses**
   ```javascript
   const cache = new Map();
   const cacheKey = `vehicles-${page}-${pageSize}`;

   if (cache.has(cacheKey)) {
     return cache.get(cacheKey);
   }

   const data = await fetchVehicles(page, pageSize);
   cache.set(cacheKey, data);
   ```

5. **Use Batch Endpoints**
   ```http
   POST /api/v1/batch
   {
     "requests": [
       { "method": "GET", "url": "/api/vehicles/123" },
       { "method": "GET", "url": "/api/vehicles/456" }
     ]
   }
   ```

### Error Handling Best Practices

1. **Handle All Error Cases**
   ```javascript
   try {
     const response = await api.getVehicle(id);
   } catch (error) {
     if (error.response?.status === 404) {
       // Handle not found
     } else if (error.response?.status === 401) {
       // Re-authenticate
     } else {
       // Handle other errors
     }
   }
   ```

2. **Log Errors with Context**
   ```javascript
   logger.error('Failed to create vehicle', {
     vehicleData,
     error: error.message,
     requestId: error.response?.headers['x-request-id']
   });
   ```

3. **Provide User-Friendly Messages**
   ```javascript
   const errorMessages = {
     'VALIDATION_ERROR': 'Please check your input',
     'AUTH_FAILED': 'Invalid credentials',
     'PERMISSION_DENIED': 'You don\'t have access to this resource'
   };
   ```

### Integration Best Practices

1. **Version Your API Calls**
   ```http
   Accept: application/vnd.fleet.v1+json
   ```

2. **Handle Webhooks Idempotently**
   ```javascript
   const processedEvents = new Set();

   if (processedEvents.has(event.id)) {
     return; // Already processed
   }

   processEvent(event);
   processedEvents.add(event.id);
   ```

3. **Monitor API Health**
   ```http
   GET /api/health
   GET /api/health-detailed
   ```

4. **Use Correlation IDs**
   ```http
   X-Correlation-ID: unique-request-id
   ```

5. **Implement Circuit Breakers**
   ```javascript
   const breaker = new CircuitBreaker(api.call, {
     threshold: 5,
     timeout: 3000,
     resetTimeout: 30000
   });
   ```

### Testing Best Practices

1. **Test Authentication Flow**
   ```javascript
   describe('Authentication', () => {
     it('should authenticate with valid credentials', async () => {
       const response = await api.login(email, password);
       expect(response.token).toBeDefined();
     });

     it('should reject invalid credentials', async () => {
       await expect(
         api.login(email, 'wrong-password')
       ).rejects.toThrow('AUTH_FAILED');
     });
   });
   ```

2. **Test Tenant Isolation**
   ```javascript
   it('should not access other tenant data', async () => {
     const response = await api.getVehicle(otherTenantVehicleId);
     expect(response.status).toBe(404);
   });
   ```

3. **Test Rate Limits**
   ```javascript
   it('should enforce rate limits', async () => {
     const promises = Array(101).fill().map(() => api.getVehicles());
     const results = await Promise.allSettled(promises);
     const rateLimited = results.filter(r =>
       r.status === 'rejected' &&
       r.reason.response?.status === 429
     );
     expect(rateLimited.length).toBeGreaterThan(0);
   });
   ```

---

## Postman Collection

### Import Collection

Download the Postman collection:
```
https://api.fleet.com/docs/postman-collection.json
```

### Environment Variables

Set up these variables in Postman:

```json
{
  "base_url": "https://api.fleet.com",
  "token": "{{auth_token}}",
  "tenant_id": "your-tenant-id",
  "csrf_token": "{{csrf_token}}"
}
```

### Pre-request Scripts

**Auto-refresh token:**
```javascript
if (!pm.globals.get('token') || isTokenExpired()) {
  pm.sendRequest({
    url: pm.variables.get('base_url') + '/api/auth/login',
    method: 'POST',
    header: { 'Content-Type': 'application/json' },
    body: {
      mode: 'raw',
      raw: JSON.stringify({
        email: pm.environment.get('email'),
        password: pm.environment.get('password')
      })
    }
  }, (err, res) => {
    pm.globals.set('token', res.json().token);
  });
}
```

---

## Support & Resources

### Documentation
- **API Reference**: https://api.fleet.com/docs
- **Developer Portal**: https://developers.fleet.com
- **Changelog**: https://api.fleet.com/changelog

### Support Channels
- **Email**: api-support@fleet.com
- **Slack**: #fleet-api-support
- **GitHub**: https://github.com/fleet/api/issues

### SLA & Uptime
- **Uptime Target**: 99.9%
- **Support Hours**: 24/7 for critical issues
- **Response Time**: < 1 hour for P1 issues

### Compliance
- **FIPS 140-2**: Cryptographic operations
- **SOC 2 Type II**: Annual certification
- **GDPR**: Data privacy compliance
- **ISO 27001**: Information security

---

## Appendix

### Glossary

| Term | Definition |
|------|------------|
| **VIN** | Vehicle Identification Number (17 characters) |
| **OBD2** | On-Board Diagnostics (vehicle diagnostic system) |
| **RBAC** | Role-Based Access Control |
| **RLS** | Row-Level Security (database isolation) |
| **JWT** | JSON Web Token (authentication) |
| **CSRF** | Cross-Site Request Forgery (security protection) |
| **OCR** | Optical Character Recognition |
| **RAG** | Retrieval-Augmented Generation (AI technique) |

### Common Abbreviations

- **API**: Application Programming Interface
- **REST**: Representational State Transfer
- **CRUD**: Create, Read, Update, Delete
- **FIPS**: Federal Information Processing Standards
- **OSHA**: Occupational Safety and Health Administration
- **EV**: Electric Vehicle
- **GPS**: Global Positioning System
- **MPG**: Miles Per Gallon
- **kWh**: Kilowatt-hour

---

**Last Updated**: January 2, 2026
**Version**: 1.0.0
**Maintained by**: Fleet Platform API Team

For the most up-to-date documentation, visit: https://api.fleet.com/docs
