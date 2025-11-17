# API Integration Guide - iOS Fleet Management

**Last Updated:** November 11, 2025
**API Version:** v1
**Backend Framework:** RESTful HTTP

---

## Overview

This guide covers how the iOS app integrates with the backend API. It includes endpoints, authentication, request/response examples, and error handling.

### API Architecture
```
iOS App
   ↓
APIConfiguration (endpoint definitions)
   ↓
AzureNetworkManager (HTTP client)
   ↓
CertificatePinningManager (security validation)
   ↓
Backend API (Azure or local development)
```

---

## Environment Configuration

### Development Environment
```
Base URL:        http://localhost:3000
API Path:        /api
Full URL:        http://localhost:3000/api
SSL Validation:  Disabled (for localhost)
Certificate Pin: N/A
```

### Production Environment
```
Base URL:        https://fleet.capitaltechalliance.com
API Path:        /api
Full URL:        https://fleet.capitaltechalliance.com/api
SSL Validation:  Enabled (certificate pinning)
Certificate Pin: Required for production
```

### Switching Environments

#### In Code (Compile-Time)
```swift
// File: APIConfiguration.swift
#if DEBUG
    static var current: APIEnvironment {
        return .development
    }
#else
    static var current: APIEnvironment {
        return .production
    }
#endif
```

#### At Runtime (if needed)
```swift
// Override environment during development
AzureConfig.setEnvironment(.production)
```

---

## Authentication

### Authentication Flow

```
1. User enters email/password
   ↓
2. POST /auth/login
   { "email": "user@example.com", "password": "..." }
   ↓
3. Server returns JWT token
   { "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
   ↓
4. KeychainManager stores token securely
   ↓
5. Token added to request headers
   Authorization: Bearer <token>
   ↓
6. Server validates token on each request
   ↓
7. Token refresh before expiration
   POST /auth/refresh
```

### Token Management

#### Storing Token
```swift
// KeychainManager stores JWT securely
let tokenKey = "authToken"
KeychainManager.save(token, forKey: tokenKey)
```

#### Using Token
```swift
// Automatically added to all API requests
let token = KeychainManager.retrieve(key: "authToken")
var request = URLRequest(url: url)
request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
```

#### Token Refresh
```swift
// Automatic refresh before expiration
if token.isExpired {
    let newToken = try await authService.refreshToken()
    KeychainManager.save(newToken, forKey: "authToken")
}
```

#### Logout
```swift
// Clear token on logout
POST /auth/logout
KeychainManager.delete(key: "authToken")
AuthenticationManager.isAuthenticated = false
```

---

## API Endpoints

### Authentication Endpoints

#### Login
```
POST /auth/login

Request:
{
    "email": "user@example.com",
    "password": "password123"
}

Response (200 OK):
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
        "id": "user-123",
        "email": "user@example.com",
        "role": "driver"
    },
    "expiresIn": 3600
}

Error (401):
{
    "error": "Invalid credentials",
    "message": "Email or password incorrect"
}
```

#### Get Current User
```
GET /auth/me

Headers:
Authorization: Bearer <token>

Response (200 OK):
{
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Driver",
    "role": "driver",
    "permissions": ["vehicle.read", "trip.create"]
}

Error (401):
{
    "error": "Unauthorized",
    "message": "Token expired or invalid"
}
```

#### Refresh Token
```
POST /auth/refresh

Headers:
Authorization: Bearer <token>

Response (200 OK):
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
}
```

#### Logout
```
POST /auth/logout

Headers:
Authorization: Bearer <token>

Response (204 No Content):
(empty body)
```

---

### Vehicle Endpoints

#### List All Vehicles
```
GET /vehicles

Headers:
Authorization: Bearer <token>

Query Parameters:
?status=active        # active, inactive, maintenance
?page=1              # pagination page
?limit=20            # items per page
?sort=make,year      # sort fields

Response (200 OK):
{
    "data": [
        {
            "id": "vehicle-001",
            "vin": "5FNRL6H76LB123456",
            "make": "Honda",
            "model": "Odyssey",
            "year": 2023,
            "licensePlate": "ABC123",
            "status": "active",
            "lastOdometerReading": 45230,
            "nextMaintenanceDate": "2024-03-01",
            "obd2Status": "connected",
            "currentDriver": {
                "id": "driver-001",
                "name": "John Driver"
            }
        },
        { ... more vehicles ... }
    ],
    "pagination": {
        "page": 1,
        "limit": 20,
        "total": 42,
        "pages": 3
    }
}
```

#### Get Vehicle Details
```
GET /vehicles/{vehicleId}

Path Parameters:
vehicleId: "vehicle-001"

Headers:
Authorization: Bearer <token>

Response (200 OK):
{
    "id": "vehicle-001",
    "vin": "5FNRL6H76LB123456",
    "make": "Honda",
    "model": "Odyssey",
    "year": 2023,
    "licensePlate": "ABC123",
    "status": "active",
    "owner": {
        "id": "fleet-123",
        "name": "Fleet Company"
    },
    "currentDriver": {
        "id": "driver-001",
        "name": "John Driver",
        "licenseNumber": "D12345678"
    },
    "maintenance": {
        "lastServiceDate": "2024-01-15",
        "nextServiceDate": "2024-04-15",
        "mileageAtService": 45000,
        "issues": ["Check oil level", "Tire pressure low"]
    },
    "obd2": {
        "connected": true,
        "deviceId": "OBD2-ABC123",
        "batteryVoltage": 13.2,
        "fuelLevel": 0.75,
        "engineStatus": "running"
    },
    "metrics": {
        "totalDistance": 125450,
        "totalTrips": 3420,
        "averageSpeed": 45.3,
        "fuelEfficiency": 8.5
    }
}
```

#### Update Vehicle
```
PUT /vehicles/{vehicleId}

Path Parameters:
vehicleId: "vehicle-001"

Headers:
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
    "status": "maintenance",
    "lastOdometerReading": 45230,
    "maintenanceNotes": "Oil change and filter replacement"
}

Response (200 OK):
{
    "id": "vehicle-001",
    "status": "maintenance",
    "lastUpdated": "2024-01-20T14:30:00Z",
    ... complete vehicle object ...
}
```

---

### Trip Endpoints

#### List Trips
```
GET /trips

Headers:
Authorization: Bearer <token>

Query Parameters:
?vehicleId=vehicle-001     # filter by vehicle
?driverId=driver-001       # filter by driver
?startDate=2024-01-01      # ISO 8601 date
?endDate=2024-01-31
?status=completed          # completed, in-progress, cancelled
?page=1&limit=20

Response (200 OK):
{
    "data": [
        {
            "id": "trip-001",
            "vehicleId": "vehicle-001",
            "driverId": "driver-001",
            "startTime": "2024-01-20T08:00:00Z",
            "endTime": "2024-01-20T17:30:00Z",
            "startLocation": {
                "lat": 37.7749,
                "lng": -122.4194,
                "address": "123 Main St, San Francisco"
            },
            "endLocation": {
                "lat": 37.8044,
                "lng": -122.2712,
                "address": "456 Oak Ave, Oakland"
            },
            "distance": 45.2,
            "duration": 31500,
            "averageSpeed": 52.3,
            "fuelUsed": 5.3,
            "status": "completed",
            "notes": "Client delivery"
        },
        { ... more trips ... }
    ],
    "pagination": { ... }
}
```

#### Start Trip
```
POST /trips/start

Headers:
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
    "vehicleId": "vehicle-001",
    "startLocation": {
        "lat": 37.7749,
        "lng": -122.4194
    },
    "notes": "Starting delivery route"
}

Response (201 Created):
{
    "id": "trip-001",
    "vehicleId": "vehicle-001",
    "driverId": "driver-001",
    "startTime": "2024-01-20T08:00:00Z",
    "startLocation": { ... },
    "status": "in-progress"
}
```

#### End Trip
```
POST /trips/{tripId}/end

Path Parameters:
tripId: "trip-001"

Headers:
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
    "endLocation": {
        "lat": 37.8044,
        "lng": -122.2712
    },
    "fuelUsed": 5.3,
    "notes": "Trip completed successfully"
}

Response (200 OK):
{
    "id": "trip-001",
    "status": "completed",
    "distance": 45.2,
    "duration": 31500,
    "averageSpeed": 52.3,
    ... complete trip object ...
}
```

#### Get Trip Details
```
GET /trips/{tripId}

Path Parameters:
tripId: "trip-001"

Headers:
Authorization: Bearer <token>

Response (200 OK):
{
    "id": "trip-001",
    ... complete trip object ...
    "gpsTrack": [
        {
            "timestamp": "2024-01-20T08:00:05Z",
            "lat": 37.7749,
            "lng": -122.4194,
            "speed": 0,
            "altitude": 50
        },
        { ... more GPS points ... }
    ]
}
```

---

### Maintenance Endpoints

#### Get Maintenance Records
```
GET /maintenance

Headers:
Authorization: Bearer <token>

Query Parameters:
?vehicleId=vehicle-001     # filter by vehicle
?status=pending            # pending, in-progress, completed
?type=inspection           # inspection, repair, service

Response (200 OK):
{
    "data": [
        {
            "id": "maint-001",
            "vehicleId": "vehicle-001",
            "type": "inspection",
            "status": "pending",
            "createdDate": "2024-01-20T10:00:00Z",
            "scheduledDate": "2024-01-21T09:00:00Z",
            "priority": "high",
            "description": "Safety inspection required",
            "items": [
                {
                    "category": "Tires",
                    "issue": "Tire pressure low",
                    "severity": "medium"
                },
                {
                    "category": "Oil",
                    "issue": "Oil level low",
                    "severity": "high"
                }
            ]
        }
    ]
}
```

#### Submit Maintenance Record
```
POST /maintenance

Headers:
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
    "vehicleId": "vehicle-001",
    "type": "inspection",
    "description": "Pre-trip inspection",
    "items": [
        {
            "category": "Tires",
            "status": "good",
            "notes": "Tire pressure OK"
        },
        {
            "category": "Lights",
            "status": "good",
            "notes": "All lights functioning"
        },
        {
            "category": "Oil",
            "status": "warning",
            "notes": "Low, needs top-up"
        }
    ],
    "photos": ["photo-id-1", "photo-id-2"],
    "inspectionDate": "2024-01-20T14:30:00Z"
}

Response (201 Created):
{
    "id": "maint-001",
    "vehicleId": "vehicle-001",
    "status": "submitted",
    "createdDate": "2024-01-20T14:30:00Z"
}
```

---

### Fleet Metrics Endpoints

#### Get Fleet Metrics
```
GET /fleet-metrics

Headers:
Authorization: Bearer <token>

Query Parameters:
?timeRange=30days          # 7days, 30days, 90days, 1year
?vehicleIds=v1,v2,v3      # specific vehicles (optional)

Response (200 OK):
{
    "period": {
        "startDate": "2023-12-21",
        "endDate": "2024-01-20",
        "days": 30
    },
    "fleet": {
        "totalVehicles": 42,
        "activeVehicles": 38,
        "maintenanceVehicles": 4,
        "totalDistance": 125420.5,
        "totalTrips": 3420,
        "averageSpeed": 45.3,
        "fuelEfficiency": 8.5,
        "totalFuelUsed": 14750.2,
        "averageFuelPrice": 3.45
    },
    "safety": {
        "totalIncidents": 2,
        "speeding": 5,
        "hardBraking": 12,
        "harshAcceleration": 8
    },
    "utilization": {
        "averageKmPerDay": 95.2,
        "utilizationRate": 0.85,
        "idleTime": 120.5
    },
    "trends": {
        "fuelEfficiencyTrend": 0.05,
        "safetyTrend": 0.12,
        "utilizationTrend": -0.02
    }
}
```

---

### Health Check Endpoint

#### Check API Health
```
GET /health

Response (200 OK):
{
    "status": "healthy",
    "timestamp": "2024-01-20T14:30:00Z",
    "version": "1.0",
    "checks": {
        "database": "ok",
        "cache": "ok",
        "messaging": "ok"
    }
}

Response (503 Service Unavailable):
{
    "status": "degraded",
    "timestamp": "2024-01-20T14:30:00Z",
    "checks": {
        "database": "error",
        "cache": "ok",
        "messaging": "error"
    },
    "message": "Database and messaging service unavailable"
}
```

---

## Request/Response Handling

### Standard HTTP Headers

#### Request Headers
```
Content-Type: application/json
Accept: application/json
Authorization: Bearer <token>
User-Agent: iOS/Fleet-Management-App/1.0
Cache-Control: no-cache
X-Request-ID: unique-id
```

#### Response Headers
```
Content-Type: application/json
Content-Length: 1234
ETag: "123abc"
Cache-Control: max-age=300
X-Request-ID: unique-id
X-Response-Time: 145ms
```

---

### Error Responses

#### 400 Bad Request
```json
{
    "error": "ValidationError",
    "message": "Invalid request parameters",
    "details": {
        "email": "Invalid email format",
        "vehicleId": "Vehicle ID required"
    }
}
```

#### 401 Unauthorized
```json
{
    "error": "AuthenticationError",
    "message": "Token expired or invalid",
    "code": "TOKEN_EXPIRED"
}
```

#### 403 Forbidden
```json
{
    "error": "AuthorizationError",
    "message": "Insufficient permissions",
    "requiredPermission": "vehicle.write"
}
```

#### 404 Not Found
```json
{
    "error": "NotFoundError",
    "message": "Vehicle not found",
    "resourceId": "vehicle-999"
}
```

#### 409 Conflict
```json
{
    "error": "ConflictError",
    "message": "Vehicle is already in use",
    "currentDriver": "driver-001"
}
```

#### 429 Too Many Requests
```json
{
    "error": "RateLimitError",
    "message": "Too many requests",
    "retryAfter": 60
}
```

#### 500 Internal Server Error
```json
{
    "error": "InternalServerError",
    "message": "An error occurred processing your request",
    "requestId": "req-123"
}
```

---

## Implementation Examples

### Making API Request

```swift
// In a Service class
func fetchVehicles() async throws -> [VehicleModel] {
    // 1. Get current token
    guard let token = KeychainManager.retrieve(key: "authToken") else {
        throw APIError.unauthorized
    }

    // 2. Create request
    guard let request = APIConfiguration.createRequest(
        for: APIConfiguration.Endpoints.vehicles,
        method: .GET,
        token: token
    ) else {
        throw APIError.invalidURL
    }

    // 3. Make network call
    let (data, response) = try await URLSession.shared.data(for: request)

    // 4. Check response
    guard let httpResponse = response as? HTTPURLResponse else {
        throw APIError.invalidResponse
    }

    // 5. Handle status codes
    switch httpResponse.statusCode {
    case 200...299:
        // Success - decode response
        let decoder = JSONDecoder()
        let vehicles = try decoder.decode([VehicleModel].self, from: data)
        return vehicles

    case 401:
        // Unauthorized - refresh token
        try await refreshToken()
        return try await fetchVehicles() // Retry

    case 403:
        throw APIError.forbidden

    case 404:
        throw APIError.notFound

    case 500...599:
        throw APIError.serverError(httpResponse.statusCode)

    default:
        throw APIError.unknown
    }
}
```

### Handling Errors

```swift
Task {
    do {
        let vehicles = try await apiService.fetchVehicles()
        await MainActor.run {
            self.vehicles = vehicles
        }
    } catch APIError.unauthorized {
        // Show login screen
        AuthenticationManager.shared.logout()
    } catch APIError.networkUnavailable {
        // Show offline message
        self.errorMessage = "No internet connection"
    } catch APIError.serverError(let code) {
        // Show server error
        self.errorMessage = "Server error: \(code)"
    } catch {
        // Show generic error
        self.errorMessage = "An error occurred"
    }
}
```

### Upload with Progress

```swift
func uploadInspectionPhotos(_ photos: [Data]) async throws {
    for (index, photoData) in photos.enumerated() {
        let progress = Double(index) / Double(photos.count)
        await MainActor.run {
            self.uploadProgress = progress
        }

        let uploadResponse = try await apiService.uploadPhoto(photoData)
        photoIds.append(uploadResponse.id)
    }
}
```

---

## Pagination

### Implementation
```swift
// Request next page
let pageNumber = 2
let limit = 20

let url = "\(APIConfiguration.apiBaseURL)/vehicles?page=\(pageNumber)&limit=\(limit)"
```

### Response
```json
{
    "data": [...],
    "pagination": {
        "page": 2,
        "limit": 20,
        "total": 150,
        "pages": 8,
        "hasNextPage": true,
        "hasPreviousPage": true
    }
}
```

---

## Rate Limiting

### Headers
```
X-RateLimit-Limit: 1000      # Total requests allowed
X-RateLimit-Remaining: 999   # Requests remaining
X-RateLimit-Reset: 1643894400 # Unix timestamp when limit resets
```

### Handling Rate Limit
```swift
if httpResponse.statusCode == 429 {
    if let retryAfter = httpResponse.value(forHTTPHeaderField: "Retry-After") {
        let seconds = Int(retryAfter) ?? 60
        try? await Task.sleep(nanoseconds: UInt64(seconds) * 1_000_000_000)
        return try await request() // Retry
    }
}
```

---

## Offline Support

### Caching Strategy
```swift
// Try network first
do {
    let vehicles = try await networkService.fetchVehicles()
    persistenceManager.cache(vehicles)
    return vehicles
} catch {
    // Fall back to cache on error
    if let cached = persistenceManager.getCachedVehicles() {
        return cached
    }
    throw error
}
```

### Sync on Reconnection
```swift
// Monitor network status
networkMonitor.startMonitoring()

networkMonitor.onConnected = {
    Task {
        // Sync pending changes
        try await syncService.syncPendingChanges()
    }
}
```

---

## API Configuration Best Practices

1. **Environment-Based URLs**
   - Use debug/release configurations
   - Never hardcode production URLs in debug builds

2. **Token Management**
   - Always store tokens in Keychain
   - Implement automatic refresh
   - Clear on logout

3. **Error Handling**
   - Map HTTP status codes to app errors
   - Provide user-friendly messages
   - Log errors for debugging

4. **Performance**
   - Implement request caching
   - Use pagination for lists
   - Debounce frequent requests
   - Compress responses when possible

5. **Security**
   - Always use HTTPS in production
   - Implement certificate pinning
   - Validate SSL certificates
   - Don't log sensitive data

---

## Testing API Integration

### Mock API for Testing
```swift
// Mock implementation
class MockAPIService: APIServiceProtocol {
    func fetchVehicles() async throws -> [VehicleModel] {
        return [
            VehicleModel(id: "1", make: "Honda", model: "Odyssey", year: 2023),
            VehicleModel(id: "2", make: "Toyota", model: "Sienna", year: 2022)
        ]
    }
}

// Use in tests
let viewModel = VehicleViewModel(apiService: MockAPIService())
```

---

## Support & Debugging

### Enable Network Logging
```swift
// Add this to AppDelegate
if DEBUG {
    let config = URLSessionConfiguration.default
    config.waitsForConnectivity = true
    URLSession.shared = URLSession(configuration: config, delegate: self, delegateQueue: nil)
}
```

### View Network Requests
```
In Xcode:
Debug > View Memory Graph
or use Charles Proxy / Burp Suite for HTTPS inspection
```

---

**For API specifications not listed here, contact the backend team or check the API documentation.**
