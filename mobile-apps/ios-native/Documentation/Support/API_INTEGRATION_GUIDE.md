# Fleet Management iOS App - API Integration Guide

**Version:** 1.0
**Last Updated:** November 2025
**Target Audience:** IT Administrators, Backend Developers, Integration Engineers

---

## Table of Contents

1. [Introduction](#introduction)
2. [Backend Integration Overview](#backend-integration-overview)
3. [Authentication Flow](#authentication-flow)
4. [API Endpoints Used by Mobile App](#api-endpoints-used-by-mobile-app)
5. [Data Synchronization Process](#data-synchronization-process)
6. [Webhook Configuration](#webhook-configuration)
7. [Troubleshooting API Connectivity](#troubleshooting-api-connectivity)
8. [Security Best Practices](#security-best-practices)
9. [Performance Optimization](#performance-optimization)
10. [API Reference](#api-reference)

---

## Introduction

### Purpose

This guide provides technical details for IT administrators and developers who need to understand, configure, or troubleshoot the Fleet Management iOS mobile app's integration with backend services.

### Architecture Overview

```
┌─────────────────┐
│   iOS Mobile    │
│      App        │
└────────┬────────┘
         │ HTTPS (TLS 1.2+)
         │ Certificate Pinning
         ▼
┌─────────────────┐
│  API Gateway    │ ← Azure API Management
│  Load Balancer  │
└────────┬────────┘
         │
         ├──────────────┬──────────────┬──────────────┐
         ▼              ▼              ▼              ▼
┌──────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ Auth Service │  │  Fleet   │  │  Sync    │  │  Media   │
│ (Azure AD)   │  │ Service  │  │ Service  │  │ Service  │
└──────────────┘  └──────────┘  └──────────┘  └──────────┘
                        │              │              │
                        ▼              ▼              ▼
                  ┌──────────────────────────────────┐
                  │    Azure Cosmos DB (NoSQL)       │
                  │    Azure SQL Database            │
                  │    Azure Blob Storage            │
                  └──────────────────────────────────┘
```

### Technology Stack

**Mobile App:**
- Swift 5.5+
- SwiftUI
- URLSession for networking
- Combine for reactive programming
- CoreData for local persistence

**Backend:**
- Azure App Services
- Azure Functions (serverless)
- Azure Cosmos DB (primary data store)
- Azure SQL Database (relational data, reporting)
- Azure Blob Storage (photos, files)
- Azure Active Directory (authentication)
- Azure API Management (API gateway)

### Base URLs

| Environment | Base URL | Purpose |
|------------|----------|---------|
| Production | https://api.fleetmanagement.com | Live production environment |
| Staging | https://api-staging.fleetmanagement.com | Pre-production testing |
| Development | https://api-dev.fleetmanagement.com | Development/testing |
| Local | http://localhost:5000 | Local development (developers only) |

---

## Backend Integration Overview

### System Components

#### 1. API Gateway (Azure API Management)

**Role:**
- Single entry point for all mobile app requests
- Rate limiting and throttling
- Request/response transformation
- API key validation
- Metrics and monitoring

**Configuration:**
```xml
<!-- API Management Policy -->
<policies>
    <inbound>
        <base />
        <rate-limit calls="1000" renewal-period="3600" />
        <quota calls="50000" renewal-period="86400" />
        <validate-jwt header-name="Authorization" failed-validation-httpcode="401">
            <openid-config url="https://login.microsoftonline.com/{tenant}/.well-known/openid-configuration" />
        </validate-jwt>
    </inbound>
</policies>
```

#### 2. Authentication Service

**Provider:** Azure Active Directory B2C

**Endpoints:**
- Token endpoint: `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token`
- Authorization endpoint: `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize`
- UserInfo endpoint: `https://graph.microsoft.com/v1.0/me`

**Token Types:**
- **Access Token:** JWT, 1 hour expiration, used for API authentication
- **Refresh Token:** 90 days expiration, used to obtain new access tokens
- **ID Token:** Contains user profile information

#### 3. Fleet Service

**Role:**
- Vehicle management
- Driver management
- Fleet operations
- Reporting

**Database:** Azure Cosmos DB (vehicles, drivers, organizations)

#### 4. Trip Service

**Role:**
- Trip tracking
- GPS coordinates storage
- Trip analytics
- Route optimization

**Database:** Azure Cosmos DB (partitioned by date for performance)

#### 5. Sync Service

**Role:**
- Offline data synchronization
- Conflict resolution
- Change tracking
- Delta sync

**Technology:** Azure Cosmos DB Change Feed

#### 6. Media Service

**Role:**
- Photo upload/download
- Image optimization
- Thumbnail generation
- CDN delivery

**Storage:** Azure Blob Storage with CDN

### Data Flow

**Typical Request Flow:**

1. **Mobile app** makes HTTPS request to API Gateway
2. **API Gateway** validates API key and JWT token
3. **API Gateway** forwards request to appropriate service
4. **Service** processes request, accesses database
5. **Service** returns response to API Gateway
6. **API Gateway** returns response to mobile app
7. **Mobile app** caches response in local CoreData

**Offline-to-Online Sync Flow:**

1. User performs actions while offline (stored in sync queue)
2. Network becomes available
3. Background sync manager triggers sync
4. Sync service fetches changes from server (delta sync)
5. Mobile app uploads local changes to server
6. Conflict resolver handles any conflicts
7. Local database updated with server state
8. UI refreshed to reflect synced data

---

## Authentication Flow

### OAuth 2.0 + OpenID Connect

The mobile app uses **OAuth 2.0** with **OpenID Connect** for authentication.

### Initial Login Flow

```
┌─────────┐                                         ┌──────────┐
│ Mobile  │                                         │  Azure   │
│   App   │                                         │    AD    │
└────┬────┘                                         └────┬─────┘
     │                                                    │
     │  1. Present Login Screen                          │
     │                                                    │
     │  2. User enters email & password                  │
     │                                                    │
     │  3. POST /api/v1/auth/login                      │
     ├───────────────────────────────────────────────────>│
     │     {email, password, deviceId}                   │
     │                                                    │
     │  4. Validate credentials                          │
     │                                                    │
     │  5. Return tokens                                 │
     │<───────────────────────────────────────────────────┤
     │     {accessToken, refreshToken, expiresIn}        │
     │                                                    │
     │  6. Store tokens in Keychain                      │
     │                                                    │
     │  7. Set Authorization header for future requests  │
     │                                                    │
```

### Login API Request

**Endpoint:** `POST /api/v1/auth/login`

**Request Headers:**
```http
Content-Type: application/json
User-Agent: iOS/Fleet-Management-App/1.0
Accept: application/json
```

**Request Body:**
```json
{
  "email": "driver@company.com",
  "password": "YOUR_PASSWORD_HERE",
  "deviceId": "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX",
  "deviceName": "John's iPhone 13"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": 12345,
    "email": "driver@company.com",
    "name": "John Driver",
    "role": "driver",
    "organization_id": 100
  },
  "access_token": "YOUR_ACCESS_TOKEN_HERE",
  "refresh_token": "YOUR_REFRESH_TOKEN_HERE",
  "expires_in": 3600
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "invalid_credentials",
  "message": "Invalid email or password"
}
```

### Token Refresh Flow

Access tokens expire after 1 hour. The mobile app automatically refreshes tokens before expiration.

**Endpoint:** `POST /api/v1/auth/refresh`

**Request Headers:**
```http
Content-Type: application/json
```

**Request Body:**
```json
{
  "refresh_token": "YOUR_REFRESH_TOKEN_HERE"
}
```

**Success Response (200 OK):**
```json
{
  "access_token": "YOUR_ACCESS_TOKEN_HERE",
  "refresh_token": "YOUR_REFRESH_TOKEN_HERE",
  "expires_in": 3600
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "invalid_token",
  "message": "Refresh token expired or invalid"
}
```

**Action:** Mobile app logs user out and prompts for re-authentication.

### JWT Token Structure

**Access Token Claims:**
```json
{
  "sub": "12345",
  "email": "driver@company.com",
  "name": "John Driver",
  "role": "driver",
  "org_id": 100,
  "permissions": ["trip.create", "trip.read", "vehicle.read"],
  "iat": 1635724800,
  "exp": 1635728400,
  "iss": "https://auth.fleetmanagement.com",
  "aud": "fleet-mobile-app"
}
```

### Implementing Token Refresh in Swift

```swift
class AuthenticationManager {
    func refreshTokenIfNeeded() async throws {
        guard let refreshToken = getRefreshToken() else {
            throw AuthError.noRefreshToken
        }

        // Check if access token expires in next 5 minutes
        guard shouldRefreshToken() else { return }

        let newTokens = try await AuthenticationService.shared.refreshToken(refreshToken)

        // Store new tokens
        storeAccessToken(newTokens.accessToken)
        if let newRefreshToken = newTokens.refreshToken {
            storeRefreshToken(newRefreshToken)
        }
    }

    private func shouldRefreshToken() -> Bool {
        guard let expirationDate = getTokenExpirationDate() else { return true }
        let fiveMinutesFromNow = Date().addingTimeInterval(300)
        return expirationDate < fiveMinutesFromNow
    }
}
```

### Authorization Header

All authenticated API requests must include:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
```

---

## API Endpoints Used by Mobile App

### Trip Management

#### Create Trip

**Endpoint:** `POST /api/v1/trips`

**Purpose:** Start a new trip

**Request:**
```json
{
  "vehicle_id": 501,
  "driver_id": 12345,
  "start_time": "2025-01-15T08:30:00Z",
  "start_location": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "address": "123 Main St, San Francisco, CA"
  },
  "odometer_start": 45678,
  "purpose": "Delivery route"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "trip": {
    "id": "trip_abc123",
    "vehicle_id": 501,
    "driver_id": 12345,
    "start_time": "2025-01-15T08:30:00Z",
    "status": "in_progress",
    "created_at": "2025-01-15T08:30:05Z"
  }
}
```

#### Update Trip Location

**Endpoint:** `POST /api/v1/trips/{trip_id}/locations`

**Purpose:** Upload GPS coordinates during trip

**Request (batch upload):**
```json
{
  "locations": [
    {
      "latitude": 37.7749,
      "longitude": -122.4194,
      "timestamp": "2025-01-15T08:31:00Z",
      "speed": 25.5,
      "heading": 180,
      "accuracy": 10
    },
    {
      "latitude": 37.7750,
      "longitude": -122.4195,
      "timestamp": "2025-01-15T08:31:30Z",
      "speed": 30.0,
      "heading": 185,
      "accuracy": 8
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "locations_saved": 2
}
```

**Rate Limiting:**
- Max 1 request per second per trip
- Batch up to 100 locations per request

#### End Trip

**Endpoint:** `PUT /api/v1/trips/{trip_id}/end`

**Request:**
```json
{
  "end_time": "2025-01-15T12:00:00Z",
  "end_location": {
    "latitude": 37.8049,
    "longitude": -122.4094,
    "address": "789 Market St, San Francisco, CA"
  },
  "odometer_end": 45723,
  "notes": "Completed delivery route"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "trip": {
    "id": "trip_abc123",
    "status": "completed",
    "distance_miles": 45.2,
    "duration_minutes": 210,
    "end_time": "2025-01-15T12:00:00Z"
  }
}
```

#### Get Trip Details

**Endpoint:** `GET /api/v1/trips/{trip_id}`

**Response (200 OK):**
```json
{
  "success": true,
  "trip": {
    "id": "trip_abc123",
    "vehicle_id": 501,
    "driver_id": 12345,
    "start_time": "2025-01-15T08:30:00Z",
    "end_time": "2025-01-15T12:00:00Z",
    "distance_miles": 45.2,
    "duration_minutes": 210,
    "max_speed_mph": 65,
    "average_speed_mph": 32,
    "idle_time_minutes": 15,
    "fuel_used_gallons": 2.3,
    "route_coordinates": [...], // Array of lat/lng
    "status": "completed"
  }
}
```

#### List Trips

**Endpoint:** `GET /api/v1/trips`

**Query Parameters:**
```
?driver_id=12345
&start_date=2025-01-01
&end_date=2025-01-31
&status=completed
&limit=50
&offset=0
```

**Response (200 OK):**
```json
{
  "success": true,
  "trips": [...],
  "total_count": 145,
  "has_more": true
}
```

### Vehicle Management

#### Get Vehicles

**Endpoint:** `GET /api/v1/vehicles`

**Query Parameters:**
```
?assigned_to_driver=12345
&status=active
&include_maintenance=true
```

**Response (200 OK):**
```json
{
  "success": true,
  "vehicles": [
    {
      "id": 501,
      "vin": "1HGCM82633A123456",
      "make": "Ford",
      "model": "F-150",
      "year": 2022,
      "license_plate": "ABC1234",
      "color": "Blue",
      "status": "active",
      "odometer": 45723,
      "assigned_driver_id": 12345,
      "maintenance_status": {
        "oil_change_due_miles": 50000,
        "oil_change_due_date": "2025-03-01",
        "inspection_due_date": "2025-02-15",
        "issues": []
      }
    }
  ]
}
```

#### Get Vehicle Details

**Endpoint:** `GET /api/v1/vehicles/{vehicle_id}`

**Response:** Full vehicle object with maintenance history, trip statistics, etc.

#### Update Vehicle Odometer

**Endpoint:** `PUT /api/v1/vehicles/{vehicle_id}/odometer`

**Request:**
```json
{
  "odometer": 45750,
  "recorded_at": "2025-01-15T12:00:00Z"
}
```

### OBD2 Data

#### Upload OBD2 Data

**Endpoint:** `POST /api/v1/vehicles/{vehicle_id}/obd2`

**Request:**
```json
{
  "timestamp": "2025-01-15T10:30:00Z",
  "trip_id": "trip_abc123",
  "data": {
    "rpm": 2500,
    "speed_mph": 45,
    "coolant_temp_f": 195,
    "fuel_level_percent": 75,
    "engine_load_percent": 45,
    "throttle_position_percent": 30,
    "intake_air_temp_f": 80,
    "maf_rate": 12.5
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data_id": "obd_xyz789"
}
```

#### Get Diagnostic Trouble Codes (DTCs)

**Endpoint:** `POST /api/v1/vehicles/{vehicle_id}/dtc/read`

**Response (200 OK):**
```json
{
  "success": true,
  "codes": [
    {
      "code": "P0420",
      "description": "Catalyst System Efficiency Below Threshold",
      "status": "stored",
      "detected_at": "2025-01-10T14:22:00Z"
    }
  ]
}
```

#### Clear Diagnostic Trouble Codes

**Endpoint:** `POST /api/v1/vehicles/{vehicle_id}/dtc/clear`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Diagnostic codes cleared"
}
```

### Photo Upload

#### Upload Photo

**Endpoint:** `POST /api/v1/photos`

**Content-Type:** `multipart/form-data`

**Request:**
```
POST /api/v1/photos HTTP/1.1
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="photo.jpg"
Content-Type: image/jpeg

[Binary image data]
------WebKitFormBoundary
Content-Disposition: form-data; name="metadata"

{
  "vehicle_id": 501,
  "trip_id": "trip_abc123",
  "type": "inspection",
  "description": "Front bumper damage",
  "location": {
    "latitude": 37.7749,
    "longitude": -122.4194
  },
  "timestamp": "2025-01-15T10:00:00Z"
}
------WebKitFormBoundary--
```

**Response (201 Created):**
```json
{
  "success": true,
  "photo": {
    "id": "photo_123abc",
    "url": "https://cdn.fleetmanagement.com/photos/photo_123abc.jpg",
    "thumbnail_url": "https://cdn.fleetmanagement.com/photos/photo_123abc_thumb.jpg",
    "size_bytes": 2458624,
    "uploaded_at": "2025-01-15T10:00:05Z"
  }
}
```

**Optimizations:**
- Images auto-compressed to max 2MB
- Thumbnails generated at 300x300px
- EXIF data preserved (timestamp, GPS if enabled)
- CDN delivery for fast access

### Sync Service

#### Get Changes (Delta Sync)

**Endpoint:** `GET /api/v1/sync/changes`

**Query Parameters:**
```
?since=2025-01-15T08:00:00Z
&types=trips,vehicles,maintenance
```

**Purpose:** Fetch all changes since last sync

**Response (200 OK):**
```json
{
  "success": true,
  "changes": [
    {
      "type": "trip",
      "action": "update",
      "id": "trip_abc123",
      "data": {...},
      "changed_at": "2025-01-15T09:30:00Z"
    },
    {
      "type": "vehicle",
      "action": "update",
      "id": 501,
      "data": {...},
      "changed_at": "2025-01-15T10:15:00Z"
    }
  ],
  "has_more": false,
  "next_cursor": "2025-01-15T10:15:00Z"
}
```

#### Upload Local Changes

**Endpoint:** `POST /api/v1/sync/upload`

**Request:**
```json
{
  "changes": [
    {
      "type": "trip",
      "action": "create",
      "id": "local_trip_1",
      "data": {...},
      "changed_at": "2025-01-15T08:45:00Z"
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "results": [
    {
      "local_id": "local_trip_1",
      "server_id": "trip_xyz789",
      "status": "success"
    }
  ],
  "conflicts": []
}
```

**Conflict Response:**
```json
{
  "success": true,
  "results": [...],
  "conflicts": [
    {
      "type": "trip",
      "local_id": "trip_abc123",
      "server_version": {...},
      "local_version": {...},
      "changed_fields": ["end_time", "distance_miles"]
    }
  ]
}
```

### User Profile

#### Get Current User

**Endpoint:** `GET /api/v1/auth/me`

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": 12345,
    "email": "driver@company.com",
    "name": "John Driver",
    "role": "driver",
    "organization_id": 100,
    "profile_photo_url": "https://cdn.fleetmanagement.com/avatars/12345.jpg",
    "preferences": {
      "notifications_enabled": true,
      "gps_accuracy": "high",
      "auto_sync": true
    }
  }
}
```

#### Update User Preferences

**Endpoint:** `PUT /api/v1/users/me/preferences`

**Request:**
```json
{
  "notifications_enabled": false,
  "gps_accuracy": "balanced",
  "auto_sync": true
}
```

---

## Data Synchronization Process

### Sync Strategy

The mobile app uses a **hybrid sync strategy**:

1. **Real-time sync** for critical data (trip start/end)
2. **Periodic sync** every 5 minutes for updates
3. **Background sync** when app is backgrounded
4. **On-demand sync** when user pulls to refresh

### Sync Queue

**Local Queue Structure:**

| ID | Type | Action | Data | Timestamp | Retry Count | Status |
|----|------|--------|------|-----------|-------------|--------|
| 1 | trip | create | {...} | 2025-01-15T08:30:00Z | 0 | pending |
| 2 | photo | upload | {...} | 2025-01-15T08:35:00Z | 1 | pending |
| 3 | trip | update | {...} | 2025-01-15T08:40:00Z | 0 | synced |

### Conflict Resolution

**Conflict Types:**

1. **Update Conflict:** Both mobile and server modified same record
2. **Delete Conflict:** Mobile modified, server deleted (or vice versa)
3. **Create Conflict:** Duplicate creation attempts

**Resolution Strategies:**

| Conflict Type | Default Strategy | Options |
|---------------|------------------|---------|
| Update Conflict | Server wins | Server wins, Client wins, Manual, Merge |
| Delete Conflict | Server wins | Server wins, Client wins, Manual |
| Create Conflict | Keep both | Keep both, Server wins, Client wins |

**Conflict Resolution API:**

**Endpoint:** `POST /api/v1/sync/resolve-conflict`

**Request:**
```json
{
  "conflict_id": "conflict_123",
  "resolution": "server_wins",
  "type": "trip",
  "local_id": "trip_abc123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "resolved_data": {...}
}
```

### Background Sync

**iOS Background Tasks:**

```swift
// Register background task
BGTaskScheduler.shared.register(
    forTaskWithIdentifier: "com.fleet.sync.refresh",
    using: nil
) { task in
    handleBackgroundSync(task: task as! BGAppRefreshTask)
}

// Schedule background sync
func scheduleBackgroundSync() {
    let request = BGAppRefreshTaskRequest(identifier: "com.fleet.sync.refresh")
    request.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60) // 15 minutes

    try? BGTaskScheduler.shared.submit(request)
}
```

**Background Sync Flow:**

1. iOS wakes app in background
2. App has 30 seconds to complete sync
3. Fetch changes from server (delta sync)
4. Upload pending local changes (up to 50 items)
5. Resolve conflicts (auto-resolve with server wins)
6. Update local database
7. Mark task complete

---

## Webhook Configuration

### Overview

Webhooks allow the backend to push real-time notifications to mobile app users via push notifications.

### Webhook Events

| Event | Trigger | Payload |
|-------|---------|---------|
| `trip.started` | Driver starts trip | `{trip_id, driver_id, vehicle_id}` |
| `trip.ended` | Driver ends trip | `{trip_id, driver_id, distance, duration}` |
| `vehicle.maintenance_due` | Maintenance approaching | `{vehicle_id, maintenance_type, due_date}` |
| `vehicle.alert` | Vehicle issue detected | `{vehicle_id, alert_type, severity}` |
| `user.message` | Admin sends message to driver | `{message_id, subject, body}` |

### Configuring Webhooks

**Admin Portal:**

1. Settings > Integrations > Webhooks > Add Webhook

2. Configuration:
   ```
   Event: vehicle.maintenance_due
   Target: Push Notification
   Filter: vehicle.assigned_driver_id == user_id
   Template: "Maintenance due for {vehicle.make} {vehicle.model} on {due_date}"
   ```

3. Test webhook with sample data

**API Configuration:**

**Endpoint:** `POST /api/v1/webhooks`

**Request:**
```json
{
  "event": "vehicle.maintenance_due",
  "target_type": "push_notification",
  "filter": "vehicle.assigned_driver_id == user_id",
  "template": {
    "title": "Maintenance Due",
    "body": "Maintenance due for {{vehicle.make}} {{vehicle.model}} on {{due_date}}",
    "data": {
      "vehicle_id": "{{vehicle.id}}",
      "maintenance_type": "{{maintenance_type}}"
    }
  },
  "enabled": true
}
```

### Push Notification Payload

**FCM (Firebase Cloud Messaging) Format:**

```json
{
  "to": "YOUR_FCM_DEVICE_TOKEN_HERE",
  "notification": {
    "title": "Maintenance Due",
    "body": "Oil change due for Ford F-150 on 2025-02-01"
  },
  "data": {
    "type": "vehicle.maintenance_due",
    "vehicle_id": "501",
    "maintenance_type": "oil_change",
    "due_date": "2025-02-01",
    "deep_link": "fleetapp://vehicle/501/maintenance"
  },
  "priority": "high",
  "content_available": true
}
```

**APNs (Apple Push Notification Service) Format:**

```json
{
  "aps": {
    "alert": {
      "title": "Maintenance Due",
      "body": "Oil change due for Ford F-150 on 2025-02-01"
    },
    "badge": 1,
    "sound": "default",
    "content-available": 1
  },
  "type": "vehicle.maintenance_due",
  "vehicle_id": "501",
  "maintenance_type": "oil_change",
  "due_date": "2025-02-01",
  "deep_link": "fleetapp://vehicle/501/maintenance"
}
```

### Deep Linking

**Supported Deep Links:**

```
fleetapp://trip/{trip_id}
fleetapp://vehicle/{vehicle_id}
fleetapp://vehicle/{vehicle_id}/maintenance
fleetapp://vehicle/{vehicle_id}/inspections
fleetapp://messages/{message_id}
fleetapp://profile
```

**Handling Deep Links in Swift:**

```swift
func handleDeepLink(_ url: URL) {
    guard url.scheme == "fleetapp" else { return }

    let components = url.pathComponents

    switch (url.host, components.count) {
    case ("trip", 2):
        let tripId = components[1]
        navigateToTrip(tripId)

    case ("vehicle", 2):
        let vehicleId = components[1]
        navigateToVehicle(vehicleId)

    case ("vehicle", 3) where components[2] == "maintenance":
        let vehicleId = components[1]
        navigateToVehicleMaintenance(vehicleId)

    default:
        break
    }
}
```

---

## Troubleshooting API Connectivity

### Common Issues

#### 1. Network Connection Errors

**Symptoms:**
- "Network connection error" in mobile app
- Requests timing out
- Intermittent connectivity

**Diagnosis:**

1. **Check network availability:**
   ```swift
   if NetworkMonitor.shared.isConnected {
       print("Network is available")
   } else {
       print("No network connection")
   }
   ```

2. **Test DNS resolution:**
   ```bash
   nslookup api.fleetmanagement.com
   ```

3. **Test HTTPS connectivity:**
   ```bash
   curl -v https://api.fleetmanagement.com/health
   ```

**Solutions:**

- **Corporate firewall:** Whitelist `*.fleetmanagement.com`
- **VPN issues:** Test without VPN, configure VPN split tunneling
- **DNS issues:** Use alternative DNS (8.8.8.8)
- **SSL certificate issues:** Ensure device has latest CA certificates

#### 2. Authentication Failures

**Symptoms:**
- 401 Unauthorized errors
- "Session expired" messages
- Token refresh failures

**Diagnosis:**

1. **Check token expiration:**
   ```swift
   let expirationDate = getTokenExpirationDate()
   print("Token expires at: \(expirationDate)")
   ```

2. **Verify token format:**
   ```bash
   # Decode JWT token
   echo "TOKEN_HERE" | base64 -d
   ```

3. **Check API logs:**
   - Admin Portal > Logs > API Logs
   - Filter by 401 errors
   - Review error messages

**Solutions:**

- **Expired token:** Implement automatic token refresh
- **Invalid token:** Clear tokens, re-authenticate
- **Clock skew:** Ensure device time is synchronized
- **Revoked token:** User may be deactivated, check admin portal

#### 3. Rate Limiting

**Symptoms:**
- 429 Too Many Requests errors
- Sync failures during high activity
- API rejecting requests

**Diagnosis:**

1. **Check rate limit headers:**
   ```
   X-RateLimit-Limit: 1000
   X-RateLimit-Remaining: 0
   X-RateLimit-Reset: 1635724800
   ```

2. **Review API usage:**
   - Admin Portal > API Usage Dashboard
   - Identify spike in requests

**Solutions:**

- **Implement exponential backoff:**
  ```swift
  func retryWithBackoff(attempt: Int) async throws {
      let delay = min(pow(2.0, Double(attempt)), 60.0) // Max 60s
      try await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
      // Retry request
  }
  ```

- **Batch requests:** Upload multiple items in single request
- **Reduce sync frequency:** Increase sync interval
- **Upgrade plan:** Contact sales for higher rate limits

#### 4. Sync Conflicts

**Symptoms:**
- Data not updating
- Conflict resolution dialogs
- Duplicate records

**Diagnosis:**

1. **Check sync queue:**
   ```swift
   let queueStats = SyncQueue.shared.getQueueStatistics()
   print("Pending: \(queueStats.pendingOperations)")
   print("Conflicts: \(queueStats.conflicts)")
   ```

2. **Review conflict logs:**
   - Settings > Sync > View Conflicts
   - Identify conflict patterns

**Solutions:**

- **Auto-resolve:** Set default conflict resolution (server wins)
- **Manual resolve:** Review and resolve conflicts individually
- **Prevent conflicts:** Avoid editing same record on multiple devices

#### 5. Photo Upload Failures

**Symptoms:**
- Photos stuck in upload queue
- "Upload failed" errors
- Timeout errors

**Diagnosis:**

1. **Check photo size:**
   ```swift
   let fileSize = photoData.count
   print("Photo size: \(fileSize / 1024 / 1024) MB")
   ```

2. **Check network speed:**
   - Use speed test app
   - Slow upload speeds cause timeouts

3. **Check storage quota:**
   - Admin Portal > Storage Usage
   - Verify quota not exceeded

**Solutions:**

- **Compress photos:** Reduce quality before upload
- **Use Wi-Fi:** Upload on Wi-Fi, not cellular
- **Increase timeout:** Configure longer timeout for uploads
- **Retry mechanism:** Auto-retry failed uploads

### Debugging Tools

#### Network Traffic Inspection

**Using Charles Proxy:**

1. Install Charles Proxy on Mac
2. Configure iPhone to use proxy (Settings > Wi-Fi > HTTP Proxy)
3. Install Charles SSL certificate on device
4. View all HTTP/HTTPS traffic from mobile app

**Using Xcode Network Link Conditioner:**

1. Install Hardware IO Tools from Apple
2. System Preferences > Network Link Conditioner
3. Simulate poor network conditions (3G, packet loss, etc.)
4. Test app behavior

#### API Testing Tools

**Postman Collection:**

Import Fleet Management API collection:

```bash
# Import collection
curl -o fleet-api.postman_collection.json \
  https://api.fleetmanagement.com/docs/postman-collection

# Open in Postman
open fleet-api.postman_collection.json
```

**cURL Examples:**

```bash
# Test authentication
curl -X POST https://api.fleetmanagement.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"YOUR_PASSWORD_HERE"}'

# Test authorized request
curl -X GET https://api.fleetmanagement.com/api/v1/vehicles \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test with verbose output
curl -v -X GET https://api.fleetmanagement.com/api/v1/trips
```

---

## Security Best Practices

### 1. Certificate Pinning

**Prevent man-in-the-middle attacks:**

```swift
class CertificatePinningManager {
    static func validateServerTrust(_ serverTrust: SecTrust) -> Bool {
        let pinnedCertificates = [
            "sha256/YOUR_CERTIFICATE_HASH_1_HERE",
            "sha256/YOUR_CERTIFICATE_HASH_2_HERE"
        ]

        // Validate server certificate against pinned certificates
        // Implementation details...
        return true
    }
}
```

### 2. Secure Token Storage

**Use iOS Keychain:**

```swift
class KeychainManager {
    func storeToken(_ token: String, for key: String) throws {
        let data = token.data(using: .utf8)!

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlock
        ]

        SecItemAdd(query as CFDictionary, nil)
    }
}
```

### 3. Request Signing

**Sign critical requests:**

```swift
func signRequest(_ request: URLRequest) -> URLRequest {
    var signedRequest = request

    let timestamp = String(Int(Date().timeIntervalSince1970))
    let nonce = UUID().uuidString

    let signature = HMAC.sha256(
        data: "\(request.httpMethod ?? "")\(request.url?.path ?? "")\(timestamp)\(nonce)",
        key: ConfigurationManager.shared.apiSecret
    )

    signedRequest.setValue(timestamp, forHTTPHeaderField: "X-Timestamp")
    signedRequest.setValue(nonce, forHTTPHeaderField: "X-Nonce")
    signedRequest.setValue(signature, forHTTPHeaderField: "X-Signature")

    return signedRequest
}
```

### 4. Data Encryption

**Encrypt sensitive data at rest:**

```swift
class EncryptionManager {
    func encryptData(_ data: Data) throws -> Data {
        let key = getEncryptionKey()
        let encrypted = try AES.GCM.seal(data, using: key)
        return encrypted.combined!
    }

    func decryptData(_ data: Data) throws -> Data {
        let key = getEncryptionKey()
        let sealedBox = try AES.GCM.SealedBox(combined: data)
        return try AES.GCM.open(sealedBox, using: key)
    }
}
```

### 5. Input Validation

**Validate all user inputs:**

```swift
func validateEmail(_ email: String) -> Bool {
    let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
    let emailPredicate = NSPredicate(format:"SELF MATCHES %@", emailRegex)
    return emailPredicate.evaluate(with: email)
}

func sanitizeInput(_ input: String) -> String {
    // Remove potentially dangerous characters
    return input
        .replacingOccurrences(of: "<", with: "")
        .replacingOccurrences(of: ">", with: "")
        .trimmingCharacters(in: .whitespacesAndNewlines)
}
```

---

## Performance Optimization

### 1. Request Batching

**Batch multiple operations:**

```swift
// Instead of individual requests:
// POST /api/v1/trips/{id}/locations (x100)

// Use batch endpoint:
POST /api/v1/trips/{id}/locations/batch
{
  "locations": [
    {...}, // 100 locations
    {...}
  ]
}
```

### 2. Response Caching

**Cache responses:**

```swift
class APIClient {
    let cache = URLCache(
        memoryCapacity: 20 * 1024 * 1024, // 20 MB
        diskCapacity: 100 * 1024 * 1024 // 100 MB
    )

    func request(_ endpoint: String) async throws -> Data {
        var request = URLRequest(url: URL(string: endpoint)!)
        request.cachePolicy = .returnCacheDataElseLoad

        let (data, _) = try await URLSession.shared.data(for: request)
        return data
    }
}
```

### 3. Pagination

**Paginate large datasets:**

```
GET /api/v1/trips?limit=50&offset=0
GET /api/v1/trips?limit=50&offset=50
GET /api/v1/trips?limit=50&offset=100
```

### 4. Field Filtering

**Request only needed fields:**

```
GET /api/v1/trips?fields=id,start_time,end_time,distance_miles
```

Reduces response size by 70%.

### 5. Compression

**Enable gzip compression:**

```swift
var request = URLRequest(url: url)
request.setValue("gzip, deflate", forHTTPHeaderField: "Accept-Encoding")
```

---

## API Reference

### Base Information

**Base URL:** `https://api.fleetmanagement.com`
**API Version:** v1
**Authentication:** Bearer Token (JWT)
**Content-Type:** `application/json`
**Rate Limit:** 1000 requests/hour (standard plan)

### Endpoint Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/auth/login` | Authenticate user |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| GET | `/api/v1/auth/me` | Get current user profile |
| POST | `/api/v1/trips` | Create new trip |
| GET | `/api/v1/trips` | List trips |
| GET | `/api/v1/trips/{id}` | Get trip details |
| PUT | `/api/v1/trips/{id}/end` | End trip |
| POST | `/api/v1/trips/{id}/locations` | Upload GPS coordinates |
| GET | `/api/v1/vehicles` | List vehicles |
| GET | `/api/v1/vehicles/{id}` | Get vehicle details |
| POST | `/api/v1/vehicles/{id}/obd2` | Upload OBD2 data |
| POST | `/api/v1/photos` | Upload photo |
| GET | `/api/v1/sync/changes` | Get delta changes |
| POST | `/api/v1/sync/upload` | Upload local changes |

### Error Codes

| HTTP Code | Error Code | Meaning |
|-----------|-----------|---------|
| 400 | `bad_request` | Invalid request parameters |
| 401 | `unauthorized` | Missing or invalid authentication |
| 403 | `forbidden` | Insufficient permissions |
| 404 | `not_found` | Resource not found |
| 409 | `conflict` | Data conflict (e.g., duplicate) |
| 422 | `validation_error` | Input validation failed |
| 429 | `rate_limit_exceeded` | Too many requests |
| 500 | `internal_error` | Server error |
| 503 | `service_unavailable` | Service temporarily down |

### Support

**API Documentation:** https://api.fleetmanagement.com/docs
**API Status:** https://status.fleetmanagement.com
**Technical Support:** api-support@fleetmanagement.com
**Emergency:** +1-800-FLEET-911

---

**Document Version:** 1.0
**Last Updated:** November 2025
**Next Review:** February 2026
