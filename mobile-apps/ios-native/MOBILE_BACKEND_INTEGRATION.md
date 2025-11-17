# Mobile App ↔ Backend Integration Guide

**Last Updated:** November 11, 2025
**Status:** Production Ready
**Integration Architecture:** RESTful API + Real-time Sync

---

## Overview

The iOS native mobile app is designed to **seamlessly integrate with the main Fleet Management backend application**, providing real-time data collection, synchronization, and bidirectional communication.

### Architecture

```
┌─────────────────────────────────────┐
│   iOS Native Mobile App             │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  Data Collection Layer       │  │
│  │  - GPS Tracking              │  │
│  │  - OBD2 Diagnostics          │  │
│  │  - Vehicle Inspections       │  │
│  │  - Camera/Photos             │  │
│  └──────────────┬───────────────┘  │
│                 │                   │
│  ┌──────────────▼───────────────┐  │
│  │  Sync Service                │  │
│  │  - Offline Queue             │  │
│  │  - Conflict Resolution       │  │
│  │  - Background Sync           │  │
│  └──────────────┬───────────────┘  │
│                 │                   │
│  ┌──────────────▼───────────────┐  │
│  │  API Layer                   │  │
│  │  - RESTful Client            │  │
│  │  - Authentication            │  │
│  │  - Certificate Pinning       │  │
│  └──────────────┬───────────────┘  │
└─────────────────┼───────────────────┘
                  │
                  │ HTTPS (TLS 1.3)
                  │ JSON Payloads
                  │ Bearer Auth
                  │
                  ▼
┌─────────────────────────────────────┐
│   Main Fleet Backend Application    │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  API Gateway / Router        │  │
│  │  - /api/auth/*               │  │
│  │  - /api/vehicles/*           │  │
│  │  - /api/trips/*              │  │
│  │  - /api/maintenance/*        │  │
│  └──────────────┬───────────────┘  │
│                 │                   │
│  ┌──────────────▼───────────────┐  │
│  │  Business Logic Layer        │  │
│  │  - Fleet Management          │  │
│  │  - Analytics Engine          │  │
│  │  - Reporting                 │  │
│  └──────────────┬───────────────┘  │
│                 │                   │
│  ┌──────────────▼───────────────┐  │
│  │  Database Layer              │  │
│  │  - PostgreSQL / Azure SQL    │  │
│  │  - Vehicle Data              │  │
│  │  - Trip Records              │  │
│  │  - User Management           │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

## Data Flow: Mobile → Backend

### 1. Trip Tracking Data

**Collected on Mobile:**
- GPS coordinates (lat/lng)
- Timestamps
- Speed, altitude
- Accuracy metrics
- Vehicle ID
- Driver ID

**Sent to Backend:**
```
POST /api/trips/coordinates
{
  "trip_id": "TRIP-12345",
  "coordinates": [
    {
      "latitude": 28.5383,
      "longitude": -81.3792,
      "timestamp": "2025-11-11T10:30:00Z",
      "speed": 65.5,
      "altitude": 25.0,
      "accuracy": 5.0
    }
  ]
}
```

**Backend Processing:**
- Store in database
- Calculate mileage
- Detect geofence events
- Update fleet dashboard
- Generate analytics
- Trigger alerts if needed

---

### 2. OBD2 Vehicle Diagnostics

**Collected on Mobile:**
- Engine RPM
- Vehicle speed
- Fuel level
- Coolant temperature
- Diagnostic Trouble Codes (DTCs)
- VIN number

**Sent to Backend:**
```
POST /api/vehicles/{vehicle_id}/diagnostics
{
  "timestamp": "2025-11-11T10:30:00Z",
  "engine_rpm": 2500,
  "vehicle_speed": 65,
  "fuel_level": 75,
  "coolant_temp": 90,
  "engine_load": 45,
  "throttle_position": 30,
  "dtc_codes": ["P0420", "P0171"],
  "vin": "1HGBH41JXMN109186"
}
```

**Backend Processing:**
- Store diagnostic history
- Detect maintenance needs
- Alert on critical DTCs
- Update vehicle health score
- Schedule predictive maintenance
- Generate reports

---

### 3. Vehicle Inspections

**Collected on Mobile:**
- 23-point inspection checklist
- Photos (up to 10 per inspection)
- Inspector notes
- Pass/Fail status per item
- GPS location of inspection

**Sent to Backend:**
```
POST /api/inspections
{
  "vehicle_id": "VEH-12345",
  "inspector_id": "DRV-789",
  "timestamp": "2025-11-11T08:00:00Z",
  "location": {
    "latitude": 28.5383,
    "longitude": -81.3792
  },
  "items": [
    {
      "category": "exterior",
      "item": "body_condition",
      "status": "passed",
      "notes": null,
      "photos": []
    },
    {
      "category": "tires",
      "item": "tire_pressure",
      "status": "failed",
      "notes": "Front left tire low pressure",
      "photos": ["photo_1_url"]
    }
  ],
  "overall_status": "needs_attention",
  "photos": [
    {
      "category": "damage",
      "url": "https://storage.azure.com/...",
      "timestamp": "2025-11-11T08:05:00Z"
    }
  ]
}
```

**Backend Processing:**
- Create inspection record
- Flag vehicles needing attention
- Generate work orders
- Notify maintenance team
- Update compliance status

---

### 4. Maintenance Requests

**Collected on Mobile:**
- Issue description
- Priority level
- Photos/videos
- Current mileage
- Location

**Sent to Backend:**
```
POST /api/maintenance
{
  "vehicle_id": "VEH-12345",
  "driver_id": "DRV-789",
  "type": "corrective",
  "category": "brakes",
  "priority": "high",
  "description": "Squeaking noise when braking",
  "current_mileage": 45678,
  "location": {
    "latitude": 28.5383,
    "longitude": -81.3792
  },
  "photos": ["photo_url_1", "photo_url_2"],
  "reported_at": "2025-11-11T14:30:00Z"
}
```

**Backend Processing:**
- Create maintenance ticket
- Assign to shop
- Schedule repair
- Notify fleet manager
- Track costs
- Update vehicle status

---

### 5. Photo/Document Uploads

**Collected on Mobile:**
- Vehicle damage photos
- Inspection photos
- Document scans (registration, insurance)
- VIN barcodes
- Odometer readings

**Sent to Backend:**
```
POST /api/uploads
Content-Type: multipart/form-data

{
  "file": <binary_data>,
  "vehicle_id": "VEH-12345",
  "type": "damage_photo",
  "category": "exterior",
  "metadata": {
    "timestamp": "2025-11-11T10:30:00Z",
    "location": {
      "latitude": 28.5383,
      "longitude": -81.3792
    },
    "description": "Front bumper damage"
  }
}
```

**Backend Processing:**
- Store in cloud storage (Azure Blob)
- Generate thumbnails
- Run AI damage detection
- Associate with vehicle/trip/inspection
- Update records

---

## Data Flow: Backend → Mobile

### 1. Vehicle Assignments

**Mobile Receives:**
```
GET /api/drivers/{driver_id}/assigned-vehicles

Response:
{
  "vehicles": [
    {
      "vehicle_id": "VEH-12345",
      "make": "Ford",
      "model": "F-150",
      "year": 2023,
      "vin": "1FTFW1E84NFC12345",
      "license_plate": "ABC-1234",
      "current_mileage": 15234,
      "fuel_level": 75,
      "status": "active",
      "assigned_at": "2025-11-11T08:00:00Z"
    }
  ]
}
```

**Mobile Action:**
- Display assigned vehicles
- Enable trip tracking
- Show vehicle details
- Allow inspection start

---

### 2. Fleet Dashboard Metrics

**Mobile Receives:**
```
GET /api/fleet-metrics

Response:
{
  "total_vehicles": 45,
  "active_trips": 12,
  "maintenance_due": 5,
  "available_vehicles": 28,
  "vehicle_utilization_rate": 0.73,
  "active_drivers": 38,
  "last_updated": "2025-11-11T10:30:00Z"
}
```

**Mobile Action:**
- Update dashboard cards
- Show real-time metrics
- Display alerts
- Refresh periodically

---

### 3. Maintenance Schedules

**Mobile Receives:**
```
GET /api/vehicles/{vehicle_id}/maintenance-schedule

Response:
{
  "upcoming": [
    {
      "type": "preventive",
      "category": "oil_change",
      "due_date": "2025-11-20",
      "due_mileage": 18000,
      "current_mileage": 15234,
      "status": "scheduled",
      "shop": "Main Garage"
    }
  ],
  "overdue": [],
  "history": [...]
}
```

**Mobile Action:**
- Display maintenance calendar
- Show alerts for overdue items
- Allow scheduling
- Track completion

---

### 4. Push Notifications

**Mobile Receives (via Firebase Cloud Messaging):**
```
{
  "notification": {
    "title": "Maintenance Due",
    "body": "Vehicle VEH-12345 oil change due in 100 miles"
  },
  "data": {
    "type": "maintenance_reminder",
    "vehicle_id": "VEH-12345",
    "action": "view_maintenance"
  }
}
```

**Mobile Action:**
- Display notification
- Deep link to maintenance screen
- Update badge counts
- Log event

---

### 5. Configuration Updates

**Mobile Receives:**
```
GET /api/config/mobile

Response:
{
  "trip_tracking_interval": 10,
  "obd2_polling_rate": 1,
  "sync_interval": 60,
  "max_offline_days": 7,
  "features": {
    "obd2_enabled": true,
    "inspection_required": true,
    "camera_enabled": true
  }
}
```

**Mobile Action:**
- Update local settings
- Adjust tracking intervals
- Enable/disable features
- Apply configuration

---

## API Endpoints (Complete List)

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user profile

### Vehicles
- `GET /api/vehicles` - List all vehicles
- `GET /api/vehicles/{id}` - Get vehicle details
- `PUT /api/vehicles/{id}` - Update vehicle
- `POST /api/vehicles/{id}/diagnostics` - Upload OBD2 data
- `GET /api/vehicles/{id}/maintenance-schedule` - Get maintenance schedule

### Trips
- `GET /api/trips` - List trips
- `POST /api/trips/start` - Start new trip
- `POST /api/trips/{id}/coordinates` - Upload GPS coordinates
- `POST /api/trips/{id}/end` - End trip
- `GET /api/trips/{id}` - Get trip details
- `DELETE /api/trips/{id}` - Delete trip

### Inspections
- `GET /api/inspections` - List inspections
- `POST /api/inspections` - Create inspection
- `GET /api/inspections/{id}` - Get inspection details
- `PUT /api/inspections/{id}` - Update inspection

### Maintenance
- `GET /api/maintenance` - List maintenance records
- `POST /api/maintenance` - Create maintenance request
- `GET /api/maintenance/{id}` - Get maintenance details
- `PUT /api/maintenance/{id}` - Update maintenance record

### Drivers
- `GET /api/drivers` - List drivers
- `GET /api/drivers/{id}` - Get driver details
- `GET /api/drivers/{id}/assigned-vehicles` - Get assigned vehicles
- `PUT /api/drivers/{id}` - Update driver profile

### Fleet Metrics
- `GET /api/fleet-metrics` - Get dashboard metrics
- `GET /api/fleet-metrics/analytics` - Get detailed analytics

### Uploads
- `POST /api/uploads` - Upload photos/documents
- `GET /api/uploads/{id}` - Get upload details

### Configuration
- `GET /api/config/mobile` - Get mobile app configuration
- `GET /api/health` - Health check endpoint

---

## Synchronization Strategy

### Offline-First Architecture

The mobile app is designed to work **offline-first**, meaning:

1. **All operations work offline** - Create/update/delete operations are queued
2. **Automatic sync** - When connection restored, queue is processed
3. **Conflict resolution** - Server-wins, client-wins, or last-write-wins strategies
4. **Background sync** - iOS BGTaskScheduler syncs every 15+ minutes

### Sync Flow

```
1. User performs action (offline)
   ↓
2. Operation saved locally (Core Data)
   ↓
3. Operation queued (SyncQueue)
   ↓
4. Network restored
   ↓
5. SyncService processes queue
   ↓
6. API requests sent to backend
   ↓
7. Backend processes and responds
   ↓
8. Conflict detection (if any)
   ↓
9. Resolution applied
   ↓
10. Local data updated
   ↓
11. Operation marked complete
   ↓
12. UI refreshed
```

### Sync Priorities

**Critical (Immediate sync):**
- Authentication tokens
- Trip start/end events
- Critical DTCs
- Emergency maintenance requests

**High (1-minute delay):**
- GPS coordinates
- OBD2 diagnostics
- Inspection results
- Maintenance requests

**Normal (5-minute delay):**
- Vehicle updates
- Driver profile updates
- Photo uploads

**Low (15-minute delay):**
- Analytics events
- Non-critical logs

---

## Security & Authentication

### Token-Based Authentication

```
1. User logs in → Receives access token + refresh token
2. Access token stored in iOS Keychain (encrypted)
3. All API requests include: Authorization: Bearer {token}
4. Token expires after 1 hour
5. Refresh token used to get new access token
6. Refresh token expires after 30 days
```

### Certificate Pinning

Mobile app **pins SSL certificates** for:
- `fleet.capitaltechalliance.com`
- Production API domain

**Benefits:**
- Prevents man-in-the-middle attacks
- Ensures communication only with legitimate backend
- Meets government security requirements

### Data Encryption

**In Transit:**
- TLS 1.3 for all API communication
- Certificate pinning enabled
- Payload encryption for sensitive endpoints

**At Rest:**
- AES-256 encryption for local database
- Keychain storage for credentials
- Encrypted file storage for photos

---

## Integration Testing

### Mobile ↔ Backend Test Scenarios

1. **Trip Lifecycle:**
   - Start trip on mobile → Verify backend receives start event
   - Upload GPS coordinates → Verify backend stores coordinates
   - End trip on mobile → Verify backend calculates mileage
   - Check trip in web dashboard → Verify data matches

2. **OBD2 Data Flow:**
   - Connect OBD2 device → Read vehicle data
   - Upload diagnostics → Verify backend stores data
   - Check vehicle health in dashboard → Verify calculations correct

3. **Inspection Workflow:**
   - Complete inspection on mobile
   - Upload photos and results
   - Verify backend creates work orders
   - Check web dashboard for inspection status

4. **Offline Sync:**
   - Disable network on mobile
   - Create vehicle, trip, maintenance request
   - Re-enable network
   - Verify all operations sync to backend
   - Check web dashboard for all data

5. **Real-time Updates:**
   - Update vehicle status in web dashboard
   - Verify mobile app receives update (after sync)
   - Update driver assignment
   - Verify mobile shows new assignment

---

## Backend Requirements

To support the mobile app, the backend must implement:

### 1. API Endpoints (All listed above)
- RESTful API with JSON responses
- Bearer token authentication
- CORS enabled for development
- Rate limiting configured

### 2. Database Schema
Tables required:
- `users` / `drivers`
- `vehicles`
- `trips`
- `trip_coordinates`
- `vehicle_diagnostics`
- `inspections`
- `inspection_items`
- `maintenance_records`
- `photos` / `uploads`

### 3. File Storage
- Azure Blob Storage or AWS S3
- Support multipart uploads
- Generate pre-signed URLs for mobile access
- Image resizing/thumbnails

### 4. Push Notifications
- Firebase Cloud Messaging integration
- Send notifications for:
  - Maintenance due
  - Vehicle assignments
  - Trip reminders
  - Critical alerts

### 5. Real-time Capabilities (Optional)
- WebSocket support for live updates
- Server-Sent Events (SSE) for dashboard
- Pub/Sub for event notifications

---

## Monitoring & Analytics

### Mobile App Telemetry Sent to Backend

```
POST /api/telemetry
{
  "event": "trip_started",
  "timestamp": "2025-11-11T10:30:00Z",
  "user_id": "DRV-789",
  "vehicle_id": "VEH-12345",
  "metadata": {
    "app_version": "1.0",
    "ios_version": "17.0",
    "device_model": "iPhone 15"
  }
}
```

**Events to Track:**
- App launches
- Screen views
- Feature usage (OBD2, inspections, trips)
- Errors and crashes
- Performance metrics
- Network latency

### Backend Dashboard Metrics

Backend should display:
- Active mobile users
- Trips in progress
- OBD2 devices connected
- Inspections completed today
- Sync queue length
- API response times
- Error rates

---

## Deployment Checklist

### Before Mobile App Launch:

- [ ] Backend API deployed and accessible
- [ ] All API endpoints implemented and tested
- [ ] Database schema matches mobile data models
- [ ] File storage configured (Azure/S3)
- [ ] Firebase Cloud Messaging configured
- [ ] SSL certificates installed and valid
- [ ] Certificate hashes provided to mobile team
- [ ] API rate limiting configured
- [ ] CORS configured for mobile domains
- [ ] Authentication flow tested end-to-end
- [ ] Monitoring and logging enabled
- [ ] Load testing completed
- [ ] Backup and disaster recovery tested

---

## Troubleshooting

### Common Integration Issues

**Issue:** Mobile app cannot connect to backend
- **Check:** Backend API is running and accessible
- **Check:** SSL certificate is valid
- **Check:** Certificate pinning hashes match
- **Check:** CORS is configured
- **Check:** Network connectivity on mobile device

**Issue:** Authentication fails
- **Check:** Backend `/api/auth/login` endpoint working
- **Check:** Credentials are correct
- **Check:** Token expiry times configured
- **Check:** JWT secret configured

**Issue:** Data not syncing
- **Check:** Sync queue on mobile (SyncQueue.shared)
- **Check:** Network connectivity
- **Check:** Backend API endpoints responding
- **Check:** Conflict resolution working
- **Check:** Backend database accessible

**Issue:** Photos not uploading
- **Check:** File storage (Azure/S3) configured
- **Check:** Upload endpoint accepts multipart/form-data
- **Check:** File size limits configured
- **Check:** Mobile has network connectivity
- **Check:** Backend storage quota not exceeded

---

## Contact & Support

**Mobile Development Team:**
- iOS App: `/mobile-apps/ios-native/`
- Documentation: All .md files in ios-native directory

**Backend Development Team:**
- Backend API: `/backend/` (or main app directory)
- API Documentation: [Link to backend API docs]

**Integration Support:**
- Review this document
- Test with Postman/cURL
- Check backend logs
- Check mobile app logs (LoggingManager)
- Review SecurityLogger for security events

---

## Summary

The iOS native mobile app is **fully designed to integrate with the backend**, providing:

✅ **Real-time data collection** (GPS, OBD2, inspections)
✅ **Bidirectional synchronization** (mobile ↔ backend)
✅ **Offline-first architecture** with automatic sync
✅ **Secure communication** (TLS 1.3, certificate pinning, encryption)
✅ **Comprehensive API integration** (15+ endpoints)
✅ **Push notification support** (Firebase)
✅ **Photo/document uploads** (Azure Blob/S3)
✅ **Fleet metrics dashboard** (real-time updates)
✅ **Multi-user support** (drivers, fleet managers, admins)

**Status:** Production-ready for backend integration
**Next Step:** Deploy backend API and configure endpoints
