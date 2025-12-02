# Fleet Management API - Complete Endpoint Reference

**Generated:** November 13, 2025
**API Version:** 1.0.0
**Base URLs:**
- **Production:** `https://fleet.capitaltechalliance.com/api`
- **Staging:** `https://fleet-staging.capitaltechalliance.com/api`
- **Development:** `https://fleet-dev.capitaltechalliance.com/api`

---

## Table of Contents

1. [System & Health](#system--health)
2. [Authentication & Authorization](#authentication--authorization)
3. [Vehicle Management](#vehicle-management)
4. [Driver Management](#driver-management)
5. [Maintenance & Work Orders](#maintenance--work-orders)
6. [Fuel Management](#fuel-management)
7. [Route Management & Optimization](#route-management--optimization)
8. [Dispatch & Radio Communications](#dispatch--radio-communications)
9. [Geofencing](#geofencing)
10. [Inspections](#inspections)
11. [Damage Reports & 3D Modeling](#damage-reports--3d-modeling)
12. [Safety & OSHA Compliance](#safety--osha-compliance)
13. [Video Telematics](#video-telematics)
14. [EV Management & Charging](#ev-management--charging)
15. [Telematics & IoT](#telematics--iot)
16. [Traffic Cameras & ArcGIS](#traffic-cameras--arcgis)
17. [Connected Vehicles (Smartcar)](#connected-vehicles-smartcar)
18. [Facilities Management](#facilities-management)
19. [Vendor Management](#vendor-management)
20. [Policies & Compliance](#policies--compliance)
21. [Document Management](#document-management)
22. [Billing & Financial Reports](#billing--financial-reports)
23. [Personal Use Tracking](#personal-use-tracking)
24. [AI & ML Services](#ai--ml-services)
25. [Mobile Integration](#mobile-integration)
26. [Emulator Services](#emulator-services)
27. [Quality Gates & Deployments](#quality-gates--deployments)

---

## System & Health

### GET /api/health
**Description:** Health check endpoint
**Authentication:** None
**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-13T12:00:00Z",
  "environment": "production",
  "version": "1.0.0"
}
```
**Test:** ✅ All environments responding (200 OK)

### GET /api/docs
**Description:** Interactive Swagger/OpenAPI documentation
**Authentication:** None
**URL:** `/api/docs`

### GET /api/openapi.json
**Description:** OpenAPI specification in JSON format
**Authentication:** None

---

## Authentication & Authorization

### POST /api/auth/login
**Description:** Email/password authentication
**Authentication:** None
**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```
**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "admin",
    "tenant_id": "uuid"
  }
}
```
**Features:**
- Account lockout after 3 failed attempts (30 minutes)
- Password complexity enforcement
- Audit logging (FedRAMP AC-7)

### POST /api/auth/register
**Description:** Create new user account
**Authentication:** None
**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123!@",
  "first_name": "Jane",
  "last_name": "Smith",
  "phone": "+1234567890",
  "role": "viewer"
}
```
**Password Requirements:**
- Minimum 8 characters
- Must contain uppercase letter
- Must contain lowercase letter
- Must contain number
- Must contain special character

### POST /api/auth/logout
**Description:** Logout and invalidate session
**Authentication:** Bearer Token
**Headers:** `Authorization: Bearer <token>`

### GET /api/auth/microsoft
**Description:** Initiate Microsoft OAuth2 flow
**Authentication:** None
**Query Parameters:**
- `tenant_id` (optional): Tenant ID for multi-tenant login (default: 1)
**Flow:**
1. Redirects to Microsoft login page
2. User authenticates with Microsoft account
3. Redirects to `/api/auth/microsoft/callback` with authorization code
4. Returns JWT token

### GET /api/auth/microsoft/callback
**Description:** OAuth2 callback endpoint
**Authentication:** None
**Query Parameters:**
- `code`: Authorization code from Microsoft
- `state`: Tenant ID passed during initiation
**Integration:**
- **Azure AD Configuration:** `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID`
- **Microsoft Graph API:** Fetches user profile information
- **Auto-provisioning:** Creates user account if doesn't exist

### GET /api/auth/microsoft/login
**Description:** Alias for `/api/auth/microsoft`
**Authentication:** None

---

## Vehicle Management

### GET /api/vehicles
**Description:** List all vehicles for tenant
**Authentication:** Bearer Token
**Roles:** `admin`, `fleet_manager`
**Query Parameters:**
- `page` (default: 1): Page number
- `limit` (default: 50): Items per page
**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "vin": "1HGBH41JXMN109186",
      "make": "Ford",
      "model": "F-150",
      "year": 2023,
      "license_plate": "ABC123",
      "vehicle_type": "truck",
      "fuel_type": "gasoline",
      "status": "active",
      "odometer": 15234.50,
      "latitude": 38.9072,
      "longitude": -77.0369,
      "assigned_driver_id": "uuid",
      "created_at": "2025-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "pages": 3
  }
}
```
**Database Query:**
- Multi-tenant isolation enforced via `tenant_id`
- Paginated results
- Indexes: `idx_vehicles_tenant`, `idx_vehicles_status`

### GET /api/vehicles/:id
**Description:** Get specific vehicle details
**Authentication:** Bearer Token
**Roles:** `admin`, `fleet_manager`
**Response:** Single vehicle object

### POST /api/vehicles
**Description:** Create new vehicle
**Authentication:** Bearer Token
**Roles:** `admin`, `fleet_manager`
**Request Body:**
```json
{
  "vin": "1HGBH41JXMN109186",
  "make": "Ford",
  "model": "F-150",
  "year": 2023,
  "license_plate": "XYZ789",
  "vehicle_type": "truck",
  "fuel_type": "gasoline",
  "status": "active",
  "purchase_price": 45000.00,
  "gps_device_id": "GPS-12345"
}
```
**Validation:**
- VIN must be unique
- Year must be between 1900 and current year + 1
- Status must be one of: `active`, `maintenance`, `out_of_service`, `sold`, `retired`

### PUT /api/vehicles/:id
**Description:** Update vehicle details
**Authentication:** Bearer Token
**Roles:** `admin`, `fleet_manager`
**Audit:** All changes logged to `audit_logs` table

### DELETE /api/vehicles/:id
**Description:** Delete vehicle
**Authentication:** Bearer Token
**Roles:** `admin` only
**Cascade:** Associated work orders, telemetry data, and fuel transactions are handled per FK constraints

### GET /api/vehicles/:id/identify
**Description:** AI-powered VIN/license plate identification from photo
**Authentication:** Bearer Token
**Service:** Azure Computer Vision OCR
**Request:** Multipart form with image file
**Response:**
```json
{
  "vin": "1HGBH41JXMN109186",
  "license_plate": "ABC123",
  "confidence": 0.95
}
```

### GET /api/vehicles/:id/3d-model
**Description:** Get 3D model URL for vehicle
**Authentication:** Bearer Token
**Response:**
```json
{
  "model_url": "https://storage.azure.com/3d-models/vehicle-uuid.glb",
  "format": "glb",
  "created_at": "2025-11-10T10:00:00Z"
}
```

---

## Driver Management

### GET /api/drivers
**Description:** List all drivers
**Authentication:** Bearer Token
**Roles:** `admin`, `fleet_manager`
**Features:**
- Paginated results
- Safety score tracking
- License expiration monitoring
- CDL endorsements

### GET /api/drivers/:id
**Description:** Get driver details
**Response Includes:**
- User information
- License details (number, state, expiration)
- CDL class and endorsements
- Medical card expiration
- Safety score
- Total miles/hours driven
- Incident and violation counts

### POST /api/drivers
**Description:** Create new driver
**Required Fields:**
- `user_id` (links to users table)
- `license_number` (must be unique)
- `license_state`
- `license_expiration`

### PUT /api/drivers/:id
**Description:** Update driver information

### DELETE /api/drivers/:id
**Description:** Delete driver record
**Roles:** `admin` only

### GET /api/drivers/:id/scorecard
**Description:** Driver safety scorecard with AI insights
**Response:**
```json
{
  "driver_id": "uuid",
  "safety_score": 92.5,
  "period": "last_30_days",
  "metrics": {
    "harsh_braking": 3,
    "harsh_acceleration": 5,
    "speeding_events": 2,
    "idle_time_hours": 12.5
  },
  "ai_recommendations": [
    "Consider defensive driving training for braking improvement"
  ]
}
```

---

## Maintenance & Work Orders

### GET /api/work-orders
**Description:** List work orders
**Query Parameters:**
- `status`: Filter by status (open, in_progress, completed, cancelled)
- `vehicle_id`: Filter by vehicle
- `priority`: Filter by priority
**Response:** Paginated list of work orders

### GET /api/work-orders/:id
**Description:** Get work order details
**Response Includes:**
- Work order number
- Vehicle information
- Assigned technician
- Labor and parts costs
- Photo attachments
- Audit trail

### POST /api/work-orders
**Description:** Create work order
**Request Body:**
```json
{
  "vehicle_id": "uuid",
  "facility_id": "uuid",
  "type": "preventive",
  "priority": "medium",
  "description": "Oil change and tire rotation",
  "odometer_reading": 15234.50,
  "scheduled_start": "2025-11-15",
  "scheduled_end": "2025-11-15"
}
```
**Types:** `preventive`, `corrective`, `inspection`
**Priority:** `low`, `medium`, `high`, `critical`

### PUT /api/work-orders/:id
**Description:** Update work order
**Cost Calculation:** Total cost auto-calculated as `labor_cost + parts_cost` (GENERATED column)

### DELETE /api/work-orders/:id
**Description:** Delete work order

### GET /api/maintenance-schedules
**Description:** Preventive maintenance schedules
**Features:**
- Interval-based scheduling (miles, hours, days)
- Overdue detection (GENERATED column)
- Next service due calculations

### POST /api/maintenance-schedules
**Description:** Create maintenance schedule
**Request Body:**
```json
{
  "vehicle_id": "uuid",
  "service_type": "oil_change",
  "interval_type": "miles",
  "interval_value": 5000,
  "last_service_date": "2025-10-01",
  "last_service_odometer": 10234.50
}
```
**Interval Types:**
- `miles`: Based on odometer reading
- `hours`: Based on engine hours
- `days`: Based on calendar date

### GET /api/maintenance-schedules/:id/recurring
**Description:** Get recurring maintenance schedule details
**Auto-scheduling:** Background job creates work orders when due

---

## Fuel Management

### GET /api/fuel-transactions
**Description:** List fuel transactions
**Query Parameters:**
- `vehicle_id`: Filter by vehicle
- `driver_id`: Filter by driver
- `start_date`: Filter by date range
- `end_date`: Filter by date range

### POST /api/fuel-transactions
**Description:** Record fuel transaction
**Request Body:**
```json
{
  "vehicle_id": "uuid",
  "driver_id": "uuid",
  "gallons": 15.5,
  "price_per_gallon": 3.89,
  "odometer_reading": 15234.50,
  "fuel_type": "gasoline",
  "location": "Shell Station, 123 Main St",
  "latitude": 38.9072,
  "longitude": -77.0369,
  "fuel_card_number": "****1234"
}
```
**Auto-calculation:** `total_cost = gallons * price_per_gallon` (GENERATED column)

### GET /api/fuel-purchasing/optimization
**Description:** AI-powered fuel purchasing recommendations
**Features:**
- Price forecasting using ML models
- Optimal purchase timing
- Bulk purchasing recommendations
- Historical trend analysis

---

## Route Management & Optimization

### GET /api/routes
**Description:** List routes
**Features:**
- Planned, in-progress, completed, cancelled routes
- Waypoint tracking
- Distance and duration estimates

### POST /api/routes
**Description:** Create route
**Request Body:**
```json
{
  "route_name": "Downtown Deliveries",
  "vehicle_id": "uuid",
  "driver_id": "uuid",
  "start_location": "123 Main St, DC",
  "end_location": "789 Oak St, DC",
  "waypoints": [
    {"lat": 38.9072, "lng": -77.0369, "address": "Stop 1", "order": 1},
    {"lat": 38.9100, "lng": -77.0400, "address": "Stop 2", "order": 2}
  ],
  "planned_start_time": "2025-11-15T08:00:00Z"
}
```

### POST /api/route-optimization/optimize
**Description:** AI-powered route optimization
**Service:** Azure Maps Route Optimization API
**Request:**
```json
{
  "vehicle_id": "uuid",
  "waypoints": [...],
  "optimization_goals": ["minimize_distance", "minimize_time"]
}
```
**Response:**
```json
{
  "optimized_waypoints": [...],
  "total_distance": 45.2,
  "estimated_duration": 120,
  "savings": {
    "distance_miles": 8.5,
    "time_minutes": 25
  }
}
```

### GET /api/route-optimization/emulator
**Description:** Route emulator for testing/demo
**Features:** Generates realistic route data

---

## Dispatch & Radio Communications

### WebSocket: /api/dispatch/ws
**Protocol:** WebSocket
**Purpose:** Real-time push-to-talk radio communications
**Authentication:** Query parameter token or initial message
**Messages:**
1. **join_channel**
```json
{
  "type": "join_channel",
  "channelId": 1,
  "userId": "uuid",
  "username": "John Doe",
  "deviceInfo": {...}
}
```

2. **start_transmission**
```json
{
  "type": "start_transmission",
  "channelId": 1,
  "isEmergency": false,
  "location": {"lat": 38.9072, "lng": -77.0369}
}
```

3. **audio_chunk**
```json
{
  "type": "audio_chunk",
  "transmissionId": "uuid",
  "audioData": "base64_encoded_audio"
}
```

4. **end_transmission**
```json
{
  "type": "end_transmission",
  "transmissionId": "uuid"
}
```

5. **emergency_alert**
```json
{
  "type": "emergency_alert",
  "alertType": "accident",
  "location": {"lat": 38.9072, "lng": -77.0369},
  "description": "Vehicle collision"
}
```

**Azure Services Integration:**
- **Azure Blob Storage:** Audio archival
- **Azure Speech Services:** Real-time transcription
- **Azure Web PubSub:** Scalable real-time messaging
- **Azure OpenAI:** AI-powered incident tagging

### GET /api/dispatch/channels
**Description:** List dispatch channels
**Response:**
```json
{
  "channels": [
    {
      "id": 1,
      "name": "Primary Dispatch",
      "description": "Main dispatch channel",
      "channelType": "dispatch",
      "isActive": true,
      "priorityLevel": 1,
      "colorCode": "#FF0000"
    }
  ]
}
```

### POST /api/dispatch/channels
**Description:** Create dispatch channel
**Roles:** `admin` only

### GET /api/dispatch/transmissions
**Description:** List transmission history
**Query Parameters:**
- `channel_id`: Filter by channel
- `user_id`: Filter by user
- `start_date`: Date range
- `is_emergency`: Filter emergency transmissions

### GET /api/dispatch/transmissions/:id/transcription
**Description:** Get AI transcription of audio transmission
**Service:** Azure Speech Services
**Response:**
```json
{
  "transmission_id": "uuid",
  "transcription": "Unit 12 responding to location Alpha",
  "confidence": 0.92,
  "language": "en-US"
}
```

### GET /api/dispatch/active-listeners
**Description:** List users currently connected to channels

### POST /api/dispatch/emergency-alerts
**Description:** Broadcast emergency alert to all channels

---

## Geofencing

### GET /api/geofences
**Description:** List geofences
**Geometry:** PostGIS POLYGON or POINT with radius
**Response:**
```json
{
  "geofences": [
    {
      "id": "uuid",
      "name": "Restricted Zone A",
      "geofence_type": "polygon",
      "center_latitude": 38.9072,
      "center_longitude": -77.0369,
      "radius": 500,
      "alert_on_entry": true,
      "alert_on_exit": false,
      "alert_recipients": ["admin@example.com"]
    }
  ]
}
```

### POST /api/geofences
**Description:** Create geofence
**Types:**
- `circular`: Defined by center point + radius
- `polygon`: Defined by array of coordinates

### GET /api/geofences/:id/events
**Description:** Geofence entry/exit events
**Response:**
```json
{
  "events": [
    {
      "vehicle_id": "uuid",
      "driver_id": "uuid",
      "event_type": "entry",
      "event_time": "2025-11-13T10:30:00Z",
      "latitude": 38.9072,
      "longitude": -77.0369,
      "speed": 35.5,
      "alert_sent": true
    }
  ]
}
```

### POST /api/geofences/:id/check
**Description:** Check if location is within geofence
**Request:**
```json
{
  "latitude": 38.9072,
  "longitude": -77.0369
}
```
**Spatial Query:** Uses PostGIS `ST_Contains` function

---

## Inspections

### GET /api/inspections
**Description:** List vehicle inspections
**Types:** `pre_trip`, `post_trip`, `safety`, `custom`

### GET /api/inspection-forms
**Description:** List inspection form templates
**Response:**
```json
{
  "forms": [
    {
      "id": "uuid",
      "form_name": "Pre-Trip Inspection",
      "form_type": "pre_trip",
      "form_template": {
        "fields": [
          {
            "name": "tire_pressure",
            "type": "number",
            "required": true,
            "label": "Tire Pressure (PSI)"
          },
          {
            "name": "brake_check",
            "type": "boolean",
            "required": true,
            "label": "Brakes Working?"
          }
        ]
      }
    }
  ]
}
```

### POST /api/inspections
**Description:** Submit inspection
**Request:**
```json
{
  "vehicle_id": "uuid",
  "driver_id": "uuid",
  "inspection_form_id": "uuid",
  "odometer_reading": 15234.50,
  "status": "pass",
  "form_data": {
    "tire_pressure": 35,
    "brake_check": true,
    "lights_working": true
  },
  "signature_data": "base64_signature_image",
  "photos": ["url1", "url2"]
}
```

### PUT /api/inspections/:id
**Description:** Update inspection

---

## Damage Reports & 3D Modeling

### GET /api/damage-reports
**Description:** List damage reports
**Integration:** TripoSR 3D reconstruction service

### POST /api/damage-reports
**Description:** Create damage report with photos
**Request:** Multipart form data
```
vehicle_id: uuid
reported_by: uuid
damage_description: "Dent on front bumper"
damage_severity: "moderate"
damage_location: "Front bumper"
photos[]: [file1.jpg, file2.jpg, file3.jpg]
```

### GET /api/damage-reports/:id/3d-model
**Description:** Get 3D model generated from photos
**Service:** TripoSR neural reconstruction
**Process:**
1. Photos uploaded to Azure Blob Storage
2. TripoSR task initiated asynchronously
3. Status tracked in `triposr_status` field
4. GLB model URL returned when complete
**Response:**
```json
{
  "triposr_status": "completed",
  "triposr_model_url": "https://storage.azure.com/damage-models/uuid.glb",
  "processing_time_seconds": 45
}
```

### POST /api/damage/detect
**Description:** AI-powered damage detection from image
**Service:** Azure Computer Vision Custom Vision
**Request:** Image file
**Response:**
```json
{
  "detections": [
    {
      "type": "dent",
      "confidence": 0.87,
      "bounding_box": {"x": 100, "y": 150, "w": 200, "h": 150},
      "severity": "moderate"
    }
  ]
}
```

---

## Safety & OSHA Compliance

### GET /api/safety-incidents
**Description:** List safety incidents
**Features:**
- OSHA reporting integration
- Severity classification
- Root cause analysis
- Corrective action tracking

### POST /api/safety-incidents
**Description:** Report safety incident
**Request:**
```json
{
  "vehicle_id": "uuid",
  "driver_id": "uuid",
  "incident_date": "2025-11-13T14:30:00Z",
  "incident_type": "accident",
  "severity": "moderate",
  "location": "I-95 Mile Marker 42",
  "latitude": 38.9072,
  "longitude": -77.0369,
  "description": "Vehicle collision with guardrail",
  "injuries_count": 0,
  "at_fault": false,
  "police_report_number": "DC-2025-12345"
}
```

### GET /api/osha-compliance/forms
**Description:** OSHA compliance forms library
**Forms:**
- OSHA 300 (Injury/Illness Log)
- OSHA 301 (Injury Report)
- OSHA 300A (Annual Summary)

### POST /api/osha-compliance/submit
**Description:** Submit OSHA compliance form

### GET /api/osha-compliance/dashboard
**Description:** OSHA compliance dashboard with metrics

---

## Video Telematics

### GET /api/video/cameras
**Description:** List dash cameras
**Features:**
- GPS tracking
- Health monitoring
- Storage capacity tracking

### GET /api/video/events
**Description:** List video events
**Event Types:**
- Harsh braking
- Harsh acceleration
- Collision
- Lane departure
- Distracted driving
- Speeding

### GET /api/video/events/:id
**Description:** Get video event with footage URL

### POST /api/video/events/:id/coaching
**Description:** Create coaching session from video event
**AI Features:**
- Incident auto-tagging
- Driver behavior analysis
- Coaching recommendations

### GET /api/video/evidence-locker
**Description:** Secured evidence storage for legal purposes
**Compliance:** Chain-of-custody tracking

### GET /api/video/driver-insights/:driverId
**Description:** AI-powered driver behavior insights
**Metrics:**
- Safe driving score
- Event frequency
- Improvement trends

---

## EV Management & Charging

### GET /api/ev/vehicles
**Description:** List electric vehicles
**Response:**
```json
{
  "vehicles": [
    {
      "vehicle_id": "uuid",
      "battery_level": 75,
      "range_remaining": 180,
      "charging_status": "not_charging",
      "last_charge_date": "2025-11-12T22:00:00Z"
    }
  ]
}
```

### GET /api/charging-stations
**Description:** List charging stations
**Features:**
- Location mapping
- Connector types
- Power ratings
- Availability status

### POST /api/charging-stations
**Description:** Add charging station
**Request:**
```json
{
  "station_name": "HQ Charging Station 1",
  "facility_id": "uuid",
  "latitude": 38.9072,
  "longitude": -77.0369,
  "connector_types": ["CCS", "CHAdeMO"],
  "power_rating_kw": 150,
  "status": "available"
}
```

### GET /api/charging-sessions
**Description:** List charging sessions
**Metrics:**
- Energy consumed (kWh)
- Charging duration
- Cost
- Carbon offset

### POST /api/charging-sessions
**Description:** Start charging session

### PUT /api/charging-sessions/:id/end
**Description:** End charging session

### GET /api/ev/battery-health/:vehicleId
**Description:** Battery health analytics
**Metrics:**
- State of health (SOH)
- Capacity degradation
- Cycle count
- Predicted lifespan

### GET /api/ev/carbon-footprint
**Description:** Calculate carbon emissions savings
**Comparison:** EV vs. ICE equivalent

---

## Telematics & IoT

### GET /api/telemetry
**Description:** Real-time telemetry data
**Data Points:**
- GPS location
- Speed
- Engine RPM
- Fuel level
- Battery voltage
- Coolant temperature
- OBD2 diagnostic codes
- Harsh events (braking, acceleration, turns)

### POST /api/telemetry
**Description:** Submit telemetry data (from IoT devices)
**Request:**
```json
{
  "vehicle_id": "uuid",
  "timestamp": "2025-11-13T12:00:00Z",
  "latitude": 38.9072,
  "longitude": -77.0369,
  "speed": 55.5,
  "heading": 180.0,
  "odometer": 15234.50,
  "fuel_level": 75.5,
  "engine_rpm": 2500,
  "battery_voltage": 12.8,
  "dtc_codes": ["P0420", "P0171"]
}
```
**Database:** Time-series optimized (can use TimescaleDB hypertable)

### GET /api/telematics/providers
**Description:** List configured telematics providers
**Providers:**
- **Samsara**: Fleet tracking and compliance
- **Smartcar**: Connected vehicle API

### GET /api/telematics/sync
**Description:** Sync data from external telematics provider
**Background Job:** Runs every 5 minutes via cron

---

## Traffic Cameras & ArcGIS

### GET /api/traffic-cameras
**Description:** List traffic cameras with real-time feeds
**Integration:** State/city traffic camera APIs
**Response:**
```json
{
  "cameras": [
    {
      "id": "uuid",
      "camera_name": "I-95 NB Mile 42",
      "location": "I-95 Northbound",
      "latitude": 38.9072,
      "longitude": -77.0369,
      "stream_url": "https://traffic.dc.gov/camera/42",
      "image_url": "https://traffic.dc.gov/snapshot/42.jpg",
      "status": "active"
    }
  ]
}
```

### GET /api/arcgis-layers
**Description:** ArcGIS map layers integration
**Features:**
- Real-time traffic layers
- Weather layers
- Construction/hazard layers
- Custom geospatial layers

### POST /api/arcgis-layers
**Description:** Add custom ArcGIS layer

---

## Connected Vehicles (Smartcar)

### GET /api/smartcar/auth-url
**Description:** Get Smartcar OAuth authorization URL
**Brands Supported:** Tesla, Ford, GM, Mercedes, BMW, Audi, Volvo, 50+ more

### GET /api/smartcar/callback
**Description:** OAuth callback endpoint
**Process:** Exchanges code for access token, stores in database

### GET /api/smartcar/vehicles
**Description:** List connected vehicles

### GET /api/smartcar/vehicles/:id/location
**Description:** Get real-time vehicle location
**API:** Smartcar Location API

### GET /api/smartcar/vehicles/:id/odometer
**Description:** Get current odometer reading

### POST /api/smartcar/vehicles/:id/lock
**Description:** Lock vehicle remotely

### POST /api/smartcar/vehicles/:id/unlock
**Description:** Unlock vehicle remotely

### POST /api/smartcar/vehicles/:id/start-charge
**Description:** Start EV charging

### POST /api/smartcar/vehicles/:id/stop-charge
**Description:** Stop EV charging

### GET /api/smartcar/vehicles/:id/battery
**Description:** Get EV battery status

### GET /api/smartcar/vehicles/:id/fuel
**Description:** Get fuel tank status

---

## Facilities Management

### GET /api/facilities
**Description:** List facilities (garages, depots, service centers)
**Response:**
```json
{
  "facilities": [
    {
      "id": "uuid",
      "name": "Main Garage",
      "facility_type": "garage",
      "address": "123 Fleet St",
      "city": "Washington",
      "state": "DC",
      "zip_code": "20001",
      "latitude": 38.9072,
      "longitude": -77.0369,
      "capacity": 50,
      "service_bays": 10,
      "is_active": true
    }
  ]
}
```

### POST /api/facilities
**Description:** Create facility

### PUT /api/facilities/:id
**Description:** Update facility

### DELETE /api/facilities/:id
**Description:** Delete facility

---

## Vendor Management

### GET /api/vendors
**Description:** List approved vendors
**Categories:**
- Parts suppliers
- Service providers
- Fuel vendors
- Insurance providers

### POST /api/vendors
**Description:** Add vendor

### GET /api/purchase-orders
**Description:** List purchase orders

### POST /api/purchase-orders
**Description:** Create purchase order
**Request:**
```json
{
  "vendor_id": "uuid",
  "po_number": "PO-2025-001",
  "total_amount": 2500.00,
  "items": [
    {
      "description": "Brake pads",
      "quantity": 10,
      "unit_price": 50.00
    }
  ]
}
```

---

## Policies & Compliance

### GET /api/policies
**Description:** List company policies

### POST /api/policies
**Description:** Create policy

### GET /api/policy-templates
**Description:** Policy template library
**Templates:**
- Vehicle use policy
- Safety policy
- Maintenance policy
- Driver handbook

### GET /api/personal-use-policies
**Description:** Personal vehicle use policies

### POST /api/personal-use-charges
**Description:** Record personal use charges

---

## Document Management

### GET /api/documents
**Description:** List documents
**Categories:**
- Vehicle registrations
- Insurance policies
- Maintenance records
- Driver licenses
- Compliance certifications

### POST /api/documents
**Description:** Upload document
**Request:** Multipart form data
**Features:**
- Azure Blob Storage
- OCR text extraction
- AI-powered classification
- Full-text search

### GET /api/documents/:id
**Description:** Get document details

### GET /api/documents/:id/download
**Description:** Download document file

### POST /api/documents/:id/extract-text
**Description:** OCR text extraction
**Service:** Azure Form Recognizer

---

## Billing & Financial Reports

### GET /api/billing-reports
**Description:** Financial reports
**Reports:**
- Fuel cost analysis
- Maintenance cost analysis
- Total cost of ownership
- Budget vs. actual

### GET /api/mileage-reimbursement
**Description:** Mileage reimbursement tracking

### POST /api/mileage-reimbursement
**Description:** Submit mileage reimbursement claim

### GET /api/trip-usage
**Description:** Trip usage tracking (business vs. personal)

---

## Personal Use Tracking

### GET /api/personal-use-policies
**Description:** Personal vehicle use policies by tenant

### POST /api/personal-use-charges
**Description:** Calculate and record personal use charges

### GET /api/trip-usage/:vehicleId
**Description:** Trip usage breakdown for vehicle

---

## AI & ML Services

### POST /api/ai-insights/driver-scoring
**Description:** AI-powered driver safety scoring
**ML Model:** Custom trained on telematics data

### POST /api/ai-insights/cost-forecasting
**Description:** Predict future costs (fuel, maintenance)
**Service:** Azure Machine Learning

### POST /api/fleet-optimizer/recommendations
**Description:** Fleet optimization recommendations
**Features:**
- Right-sizing fleet
- Replacement timing
- Route efficiency
- Cost reduction opportunities

### POST /api/ai-insights/anomaly-detection
**Description:** Detect anomalies in vehicle behavior

### GET /api/executive-dashboard
**Description:** Executive dashboard with KPIs
**Metrics:**
- Fleet utilization %
- Maintenance costs
- Fuel efficiency
- Safety incidents
- Driver scores

---

## Mobile Integration

### GET /api/mobile/drivers/:id/app-data
**Description:** Mobile app data for driver
**Response:**
- Assigned vehicles
- Today's routes
- Pending inspections
- Messages/alerts

### POST /api/push-notifications/send
**Description:** Send push notification
**Platforms:** iOS (APNS), Android (FCM)

### POST /api/mobile/drivers/:id/location
**Description:** Update driver location from mobile app

---

## Emulator Services

### GET /api/emulator/status
**Description:** Emulator system status
**Purpose:** Generate realistic demo data for testing

### POST /api/emulator/start
**Description:** Start emulators
**Emulators:**
- GPS tracking
- OBD2 telemetry
- Fuel transactions
- Video events
- Driver behavior
- Route tracking
- EV charging
- Maintenance events
- Cost projections
- IoT sensors

### POST /api/emulator/stop
**Description:** Stop all emulators

### GET /api/emulator/vehicles/:id/data
**Description:** Get emulated data for vehicle

---

## Quality Gates & Deployments

### GET /api/quality-gates
**Description:** CI/CD quality gate results

### POST /api/deployments
**Description:** Record deployment event

---

## Authentication Summary

**Token Type:** JWT (JSON Web Token)
**Token Lifetime:** 24 hours
**Refresh:** Not implemented (must re-authenticate after expiration)
**Header Format:** `Authorization: Bearer <token>`

**Roles & Permissions:**
- `admin`: Full access to all endpoints
- `fleet_manager`: Manage vehicles, drivers, work orders, routes
- `driver`: Read-only access to assigned vehicles, submit inspections
- `technician`: Access work orders, update maintenance records
- `viewer`: Read-only access to reports and dashboards

**Multi-tenancy:**
- All resources scoped to `tenant_id`
- Database-level isolation via row-level filtering
- No cross-tenant data leakage
- Tenant identified via JWT token

---

## Rate Limiting

**Configuration:**
- **Window:** 1 minute
- **Max Requests:** 100 per IP address
- **Headers:**
  - `X-RateLimit-Limit: 100`
  - `X-RateLimit-Remaining: 95`
  - `X-RateLimit-Reset: 1699800000`

**Response (429 Too Many Requests):**
```json
{
  "error": "Too many requests from this IP, please try again later"
}
```

---

## Error Response Format

**Standard Error:**
```json
{
  "error": "Error message",
  "details": [...] // Optional validation errors
}
```

**HTTP Status Codes:**
- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Duplicate resource
- `423 Locked`: Account locked
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

## External Integrations

### Azure Services
1. **Azure AD / Microsoft Graph**
   - Endpoint: `https://login.microsoftonline.com/`
   - Purpose: SSO authentication, user profile
   - Configuration: `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID`

2. **Azure OpenAI**
   - Endpoint: Configured per environment
   - Purpose: AI insights, natural language processing
   - Configuration: `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_KEY`

3. **Azure Blob Storage**
   - Purpose: Document storage, audio archival, 3D models
   - Configuration: `AZURE_STORAGE_CONNECTION_STRING`

4. **Azure Speech Services**
   - Purpose: Audio transcription for dispatch
   - Configuration: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`

5. **Azure Web PubSub**
   - Purpose: Real-time dispatch communications
   - Configuration: `AZURE_WEBPUBSUB_CONNECTION_STRING`

6. **Azure Computer Vision**
   - Purpose: VIN/plate recognition, damage detection
   - Configuration: `AZURE_COMPUTER_VISION_ENDPOINT`, `AZURE_COMPUTER_VISION_KEY`

7. **Azure Form Recognizer**
   - Purpose: OCR document processing
   - Configuration: `AZURE_FORM_RECOGNIZER_ENDPOINT`, `AZURE_FORM_RECOGNIZER_KEY`

8. **Azure Maps**
   - Purpose: Routing, geocoding, traffic data
   - Configuration: `AZURE_MAPS_KEY`

### Third-Party Services
1. **Smartcar**
   - Endpoint: `https://api.smartcar.com/v2.0`
   - Purpose: Connected vehicle API (50+ car brands)
   - Configuration: `SMARTCAR_CLIENT_ID`, `SMARTCAR_CLIENT_SECRET`, `SMARTCAR_REDIRECT_URI`

2. **Samsara**
   - Endpoint: `https://api.samsara.com`
   - Purpose: Fleet telematics and GPS tracking
   - Configuration: `SAMSARA_API_TOKEN`

3. **Mapbox**
   - Endpoint: `https://api.mapbox.com`
   - Purpose: Alternative mapping service
   - Configuration: `MAPBOX_API_KEY`

4. **OpenAI** (fallback)
   - Endpoint: `https://api.openai.com/v1`
   - Purpose: AI services if Azure OpenAI unavailable
   - Configuration: `OPENAI_API_KEY`

5. **SendGrid**
   - Purpose: Email notifications
   - Configuration: `SENDGRID_API_KEY`

6. **Twilio**
   - Purpose: SMS notifications
   - Configuration: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

7. **Cohere**
   - Purpose: AI text generation
   - Configuration: `COHERE_API_KEY`

---

## Environment-Specific URLs

### Production
- **Frontend:** `https://fleet.capitaltechalliance.com`
- **API:** `https://fleet.capitaltechalliance.com/api`
- **WebSocket:** `wss://fleet.capitaltechalliance.com/api/dispatch/ws`
- **Docs:** `https://fleet.capitaltechalliance.com/api/docs`
- **Status:** ✅ **ONLINE** (200 OK)

### Staging
- **Frontend:** `https://fleet-staging.capitaltechalliance.com`
- **API:** `https://fleet-staging.capitaltechalliance.com/api`
- **WebSocket:** `wss://fleet-staging.capitaltechalliance.com/api/dispatch/ws`
- **Docs:** `https://fleet-staging.capitaltechalliance.com/api/docs`
- **Status:** ✅ **ONLINE** (200 OK)

### Development
- **Frontend:** `https://fleet-dev.capitaltechalliance.com`
- **API:** `https://fleet-dev.capitaltechalliance.com/api`
- **WebSocket:** `wss://fleet-dev.capitaltechalliance.com/api/dispatch/ws`
- **Docs:** `https://fleet-dev.capitaltechalliance.com/api/docs`
- **Status:** ✅ **ONLINE** (200 OK)
- **Special:** Mock data mode enabled (`USE_MOCK_DATA=true`)

---

## Testing Recommendations

### Health Check Test Script
```bash
#!/bin/bash
ENVIRONMENTS=("prod" "staging" "dev")
DOMAINS=("fleet.capitaltechalliance.com" "fleet-staging.capitaltechalliance.com" "fleet-dev.capitaltechalliance.com")

for i in "${!ENVIRONMENTS[@]}"; do
  ENV="${ENVIRONMENTS[$i]}"
  DOMAIN="${DOMAINS[$i]}"

  echo "Testing $ENV environment..."
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/api/health)

  if [ "$STATUS" = "200" ]; then
    echo "✅ $ENV: ONLINE"
  else
    echo "❌ $ENV: OFFLINE (HTTP $STATUS)"
  fi
done
```

### Authentication Test
```bash
# Login
TOKEN=$(curl -s -X POST https://fleet-staging.capitaltechalliance.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demofleet.com","password":"Demo@123"}' \
  | jq -r '.token')

# Test authenticated endpoint
curl -H "Authorization: Bearer $TOKEN" \
  https://fleet-staging.capitaltechalliance.com/api/vehicles
```

### WebSocket Test
```javascript
const ws = new WebSocket('wss://fleet-staging.capitaltechalliance.com/api/dispatch/ws');

ws.onopen = () => {
  console.log('Connected');
  ws.send(JSON.stringify({
    type: 'join_channel',
    channelId: 1,
    userId: 'test-user',
    username: 'Test User'
  }));
};

ws.onmessage = (event) => {
  console.log('Message:', event.data);
};
```

---

## Security Best Practices

1. **Never expose API keys in client-side code**
2. **Use HTTPS for all API calls** (enforced)
3. **Store JWT tokens securely** (httpOnly cookies recommended)
4. **Implement token refresh** to avoid re-authentication
5. **Validate all input** (Zod schemas used throughout)
6. **Use parameterized queries** (prevents SQL injection)
7. **Enable audit logging** for compliance (FedRAMP)
8. **Monitor rate limits** to prevent abuse
9. **Rotate secrets regularly** (Azure Key Vault)
10. **Use managed identities** for Azure service access

---

## Support & Documentation

- **Swagger UI:** Available at `/api/docs` on all environments
- **OpenAPI Spec:** Available at `/api/openapi.json`
- **Source Code:** `/Users/andrewmorton/Documents/GitHub/Fleet/api/src/routes/`
- **Database Schema:** `/Users/andrewmorton/Documents/GitHub/Fleet/database/schema.sql`
- **Environment Guide:** `/Users/andrewmorton/Documents/GitHub/Fleet/ENVIRONMENTS.md`

---

**Document Version:** 1.0.0
**Last Updated:** November 13, 2025
**Total Endpoints:** 200+
**Total Route Files:** 63
