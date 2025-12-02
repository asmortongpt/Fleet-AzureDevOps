# Fleet Management System - Data Flow Architecture

**Generated:** November 13, 2025
**Version:** 1.0.0

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Multi-Tenancy Architecture](#multi-tenancy-architecture)
3. [Database Schema](#database-schema)
4. [Data Flow Patterns](#data-flow-patterns)
5. [External Integration Flows](#external-integration-flows)
6. [Real-Time Data Flows](#real-time-data-flows)
7. [Authentication & Authorization Flow](#authentication--authorization-flow)
8. [Background Jobs & Scheduled Tasks](#background-jobs--scheduled-tasks)
9. [Caching Strategy](#caching-strategy)
10. [Data Security & Compliance](#data-security--compliance)

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│  - React Query for API state management                     │
│  - Real-time updates via WebSocket                          │
│  - Azure AD authentication                                   │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTPS/WSS
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                  NGINX Ingress Controller                    │
│  - SSL termination (Let's Encrypt)                          │
│  - Rate limiting (100 req/min)                              │
│  - Load balancing                                            │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                   Node.js API (Express)                      │
│  - JWT authentication middleware                             │
│  - Multi-tenant isolation                                    │
│  - OpenTelemetry instrumentation                            │
│  - 63 route modules                                          │
└──────┬─────────┬──────────┬──────────┬──────────┬───────────┘
       │         │          │          │          │
       ▼         ▼          ▼          ▼          ▼
   ┌──────┐ ┌──────┐  ┌────────┐ ┌────────┐ ┌─────────┐
   │ PG   │ │Redis │  │ Azure  │ │External│ │ WebSocket│
   │ SQL  │ │Cache │  │Services│ │  APIs  │ │ Clients  │
   └──────┘ └──────┘  └────────┘ └────────┘ └─────────┘
```

### Technology Stack

**Frontend:**
- React 18
- TypeScript
- React Query (API state)
- Zustand (UI state)
- Tailwind CSS
- Mapbox GL (mapping)

**Backend:**
- Node.js 18+
- Express.js
- TypeScript
- PostgreSQL 14+ (with PostGIS)
- Redis (caching & sessions)

**Cloud Services:**
- Azure Kubernetes Service (AKS)
- Azure Database for PostgreSQL
- Azure Redis Cache
- Azure Blob Storage
- Azure Key Vault
- Azure Application Insights
- Azure AD

**Infrastructure:**
- Kubernetes 1.28+
- Helm charts
- NGINX Ingress
- cert-manager (SSL)
- Azure DevOps (CI/CD)

---

## Multi-Tenancy Architecture

### Tenant Isolation Strategy

**Database-Level Isolation:**
- Every table has a `tenant_id` column
- Row-level security enforced via SQL queries
- No shared data between tenants
- Tenant identified from JWT token

```typescript
// Every query includes tenant_id filter
const vehicles = await pool.query(
  'SELECT * FROM vehicles WHERE tenant_id = $1',
  [req.user.tenant_id]
);
```

### Tenant Data Structure

```sql
┌─────────────────┐
│    tenants      │
├─────────────────┤
│ id (UUID)       │◄──┐
│ name            │   │
│ domain          │   │
│ settings (JSON) │   │
│ is_active       │   │
└─────────────────┘   │
                      │
                      │ Foreign Key
┌─────────────────┐   │
│     users       │   │
├─────────────────┤   │
│ id              │   │
│ tenant_id       │───┘
│ email           │
│ role            │
│ password_hash   │
└─────────────────┘
         │
         │ FK
         ▼
┌─────────────────┐
│   vehicles      │
│   drivers       │
│   work_orders   │
│   routes        │
│   ... (all)     │
└─────────────────┘
```

### Tenant Context Flow

```
1. User Login
   ↓
2. JWT Generated (includes tenant_id)
   ↓
3. API Request with JWT
   ↓
4. authenticateJWT middleware extracts tenant_id
   ↓
5. req.user = { id, email, role, tenant_id }
   ↓
6. All DB queries filtered by tenant_id
   ↓
7. Response only includes tenant's data
```

### Environment-Specific Tenant Configuration

| Environment | Tenant Strategy |
|-------------|----------------|
| **Production** | Real customer tenants, strict isolation |
| **Staging** | Test tenants, mirrors production |
| **Development** | Single demo tenant (tenant_id: 1), USE_MOCK_DATA=true |

---

## Database Schema

### Core Tables (31 tables total)

#### 1. Authentication & Multi-Tenancy
- `tenants` - Organization accounts
- `users` - User accounts with roles
- `audit_logs` - FedRAMP compliance logging

#### 2. Fleet Management
- `vehicles` - Vehicle inventory
- `drivers` - Driver records
- `facilities` - Garages/depots/service centers

#### 3. Maintenance
- `work_orders` - Maintenance work orders
- `maintenance_schedules` - Preventive maintenance
- `purchase_orders` - Parts/service orders
- `vendors` - Approved vendors

#### 4. Operations
- `routes` - Route planning
- `geofences` - Geographic boundaries
- `geofence_events` - Entry/exit events
- `inspections` - Vehicle inspections
- `inspection_forms` - Inspection templates

#### 5. Telemetry & IoT
- `telemetry_data` - Real-time vehicle telemetry
- `fuel_transactions` - Fuel purchases
- `video_events` - Dash camera events
- `damage_reports` - Vehicle damage with 3D models

#### 6. Safety & Compliance
- `safety_incidents` - Accident/incident reports
- `osha_compliance_forms` - OSHA forms
- `policy_documents` - Company policies
- `policy_acknowledgments` - Policy acceptance

#### 7. EV & Charging
- `charging_stations` - Charging infrastructure
- `charging_sessions` - Charging history
- `ev_metrics` - EV-specific data

#### 8. Dispatch System
- `dispatch_channels` - Radio channels
- `audio_transmissions` - Push-to-talk audio
- `dispatch_active_listeners` - Connected users
- `emergency_alerts` - Emergency broadcasts

#### 9. Advanced Features
- `traffic_cameras` - Real-time traffic feeds
- `arcgis_layers` - Custom map layers
- `ai_insights` - ML-generated insights
- `cost_forecasts` - Predictive analytics

### Database Indexes

**Critical Indexes for Performance:**

```sql
-- Multi-tenancy indexes (most important)
CREATE INDEX idx_vehicles_tenant ON vehicles(tenant_id);
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_work_orders_tenant ON work_orders(tenant_id);
-- ... (every table has tenant index)

-- Geospatial indexes (PostGIS)
CREATE INDEX idx_vehicles_location ON vehicles USING GIST(location);
CREATE INDEX idx_facilities_location ON facilities USING GIST(location);
CREATE INDEX idx_geofences_geometry ON geofences USING GIST(geometry);

-- Time-series indexes
CREATE INDEX idx_telemetry_data_timestamp ON telemetry_data(timestamp DESC);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Foreign key indexes
CREATE INDEX idx_vehicles_assigned_driver ON vehicles(assigned_driver_id);
CREATE INDEX idx_work_orders_vehicle ON work_orders(vehicle_id);
```

### Data Types & Special Columns

**Generated Columns:**
```sql
-- Auto-calculated totals
total_cost DECIMAL(10,2) GENERATED ALWAYS AS (labor_cost + parts_cost) STORED

-- Auto-calculated overdue status
is_overdue BOOLEAN GENERATED ALWAYS AS (
  CASE WHEN interval_type = 'days' AND next_service_due_date < CURRENT_DATE
  THEN true ELSE false END
) STORED
```

**PostGIS Geography:**
```sql
-- Point locations (vehicles, facilities)
location GEOGRAPHY(POINT, 4326)

-- Polygon geofences
geometry GEOGRAPHY(POLYGON, 4326)

-- Usage
ST_Contains(geofence.geometry, vehicle.location)
ST_Distance(point1, point2)
```

**JSONB Columns:**
```sql
-- Flexible schema fields
settings JSONB DEFAULT '{}'          -- tenant settings
telematics_data JSONB DEFAULT '{}'   -- vehicle IoT data
form_template JSONB                  -- inspection form structure
form_data JSONB                      -- inspection responses
waypoints JSONB DEFAULT '[]'         -- route waypoints
raw_data JSONB                       -- telemetry raw data
```

**Arrays:**
```sql
photos TEXT[]                        -- Array of photo URLs
dtc_codes VARCHAR(10)[]              -- OBD2 diagnostic codes
cdl_endorsements VARCHAR(50)[]       -- Driver endorsements
alert_recipients TEXT[]              -- Email addresses
```

---

## Data Flow Patterns

### 1. Request/Response Pattern (Standard CRUD)

```
┌─────────┐     ┌─────────┐     ┌──────────┐     ┌──────────┐
│ Client  │────▶│ Express │────▶│Middleware│────▶│  Route   │
└─────────┘     └─────────┘     └──────────┘     └──────────┘
                                       │               │
                                       ▼               ▼
                                ┌──────────┐     ┌──────────┐
                                │   Auth   │     │   DB     │
                                │Middleware│     │  Query   │
                                └──────────┘     └──────────┘
                                       │               │
                                       ▼               ▼
                                ┌──────────────────────────┐
                                │    PostgreSQL DB         │
                                │  - Multi-tenant filter   │
                                │  - Row-level security    │
                                └──────────────────────────┘
```

**Example: List Vehicles**
```
1. GET /api/vehicles?page=1&limit=50
2. authenticateJWT extracts tenant_id from JWT
3. authorize checks user role (admin or fleet_manager)
4. auditLog middleware logs READ action
5. Query: SELECT * FROM vehicles WHERE tenant_id = $1 LIMIT $2 OFFSET $3
6. Response: { data: [...], pagination: {...} }
```

### 2. File Upload Pattern

```
┌────────┐     ┌─────────┐     ┌──────────┐     ┌──────────┐
│ Client │────▶│Multer   │────▶│  Route   │────▶│  Azure   │
│        │     │Parser   │     │ Handler  │     │  Blob    │
└────────┘     └─────────┘     └──────────┘     └──────────┘
                                     │
                                     ▼
                              ┌──────────┐
                              │   DB     │
                              │ (URL)    │
                              └──────────┘
```

**Example: Upload Damage Photos**
```
1. POST /api/damage-reports (multipart/form-data)
2. Multer middleware parses files
3. Upload each file to Azure Blob Storage
4. Generate public URLs
5. INSERT damage report with photo URLs
6. Trigger TripoSR 3D reconstruction (async)
7. Response: { id, photos: [...], triposr_status: 'pending' }
```

### 3. External API Integration Pattern

```
┌────────┐     ┌─────────┐     ┌──────────┐     ┌──────────┐
│ Client │────▶│  Route  │────▶│ Service  │────▶│ External │
│        │     │ Handler │     │  Layer   │     │   API    │
└────────┘     └─────────┘     └──────────┘     └──────────┘
                                     │
                                     ▼
                              ┌──────────┐
                              │   DB     │
                              │ (Cache)  │
                              └──────────┘
```

**Example: Fetch Smartcar Vehicle Location**
```
1. GET /api/smartcar/vehicles/:id/location
2. SmartcarService.getLocation(vehicleId)
3. Retrieve access token from DB
4. Check if token expired → refresh if needed
5. Call Smartcar API: GET https://api.smartcar.com/vehicles/:id/location
6. Cache result in Redis (5 min TTL)
7. Update vehicles table with latest location
8. Response: { latitude, longitude, timestamp }
```

### 4. Background Job Pattern

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Cron    │────▶│   Job    │────▶│   DB     │
│  Timer   │     │ Handler  │     │  Query   │
└──────────┘     └──────────┘     └──────────┘
                      │
                      ▼
               ┌──────────┐
               │ External │
               │   API    │
               └──────────┘
```

**Example: Telematics Sync Job**
```
1. Cron: Every 5 minutes
2. telematicsSync.run()
3. Query vehicles with gps_device_id
4. For each vehicle:
   a. Call Samsara API for latest location
   b. INSERT telemetry_data record
   c. UPDATE vehicles table with latest GPS
5. Log sync results
```

**Example: Maintenance Scheduler**
```
1. Cron: Every day at 6 AM
2. maintenanceScheduler.run()
3. Query maintenance_schedules WHERE next_service_due_date <= TODAY
4. For each overdue schedule:
   a. CREATE work_order
   b. Send email notification to fleet manager
   c. UPDATE last_checked timestamp
5. Log scheduled work orders
```

### 5. Event-Driven Pattern (WebSocket)

```
┌────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│Client A│◀────┤          │     │  Event   │     │   DB     │
└────────┘     │WebSocket │◀────┤ Handler  │────▶│  Logs    │
┌────────┐     │  Server  │     └──────────┘     └──────────┘
│Client B│◀────┤          │
└────────┘     └──────────┘
               ▲
               │
         ┌────────┐
         │Client C│
         └────────┘
```

**Example: Dispatch Push-to-Talk**
```
1. Driver clicks PTT button
2. WebSocket: { type: 'start_transmission', channelId: 1 }
3. Server assigns transmission_id
4. Broadcast to all listeners: { type: 'transmission_start', userId: ... }
5. Audio chunks stream: { type: 'audio_chunk', data: ... }
6. Server:
   - Forwards audio to all channel listeners
   - Uploads to Azure Blob Storage
   - Sends to Azure Speech for transcription
7. WebSocket: { type: 'end_transmission' }
8. INSERT audio_transmissions record
9. AI tagging: Azure OpenAI analyzes transcription
10. UPDATE transmission with tags and transcription
```

---

## External Integration Flows

### 1. Microsoft OAuth Flow

```
┌────────┐                                              ┌──────────┐
│  User  │                                              │  Azure   │
│        │                                              │    AD    │
└───┬────┘                                              └──────────┘
    │                                                         ▲
    │ 1. Click "Login with Microsoft"                        │
    ▼                                                         │
┌────────┐                                                   │
│Frontend│                                                   │
└───┬────┘                                                   │
    │                                                         │
    │ 2. GET /api/auth/microsoft?tenant_id=1                │
    ▼                                                         │
┌────────┐                                                   │
│  API   │  3. Redirect to Microsoft login                  │
└───┬────┘  ──────────────────────────────────────────────▶ │
    │                                                         │
    │       4. User authenticates with Microsoft             │
    │       ◀──────────────────────────────────────────────  │
    │                                                         │
    │       5. Redirect to callback with code                │
    │       ◀──────────────────────────────────────────────  │
    │                                                         │
    │ 6. Exchange code for access token                      │
    │  ──────────────────────────────────────────────────▶   │
    │                                                         │
    │ 7. Access token + refresh token                        │
    │  ◀──────────────────────────────────────────────────   │
    │                                                         │
    │ 8. GET Microsoft Graph /me                             │
    │  ──────────────────────────────────────────────────▶   │
    │                                                         │
    │ 9. User profile (email, name)                          │
    │  ◀──────────────────────────────────────────────────   │
    ▼
┌────────┐
│   DB   │  10. Find or create user
└───┬────┘  11. Generate JWT token
    │
    │ 12. Redirect: /auth/callback?token=JWT
    ▼
┌────────┐  13. Store token, redirect to dashboard
│Frontend│
└────────┘
```

### 2. Smartcar Connected Vehicle Flow

```
┌────────┐     ┌────────┐     ┌──────────┐     ┌──────────┐
│  User  │────▶│  API   │────▶│ Smartcar │────▶│   Car    │
│        │     │        │     │   API    │     │Manufacturer│
└────────┘     └────────┘     └──────────┘     └──────────┘

Flow:
1. GET /api/smartcar/auth-url
   → Returns Smartcar OAuth URL

2. User clicks link, redirects to Smartcar
   → Authenticates with car manufacturer (Tesla, Ford, etc.)

3. Smartcar redirects to /api/smartcar/callback?code=...
   → Exchange code for access token
   → Store token in DB with vehicle_id

4. GET /api/smartcar/vehicles/:id/location
   → Retrieve access token from DB
   → Call Smartcar API with token
   → Return real-time location

5. POST /api/smartcar/vehicles/:id/lock
   → Retrieve access token
   → Call Smartcar API: POST /vehicles/:id/security
   → Send lock command to vehicle
   → Vehicle manufacturer's servers execute command
```

### 3. Samsara Telematics Integration

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│   Cron   │────▶│   API    │────▶│ Samsara  │
│  Job     │     │  Sync    │     │   API    │
└──────────┘     └──────────┘     └──────────┘
                      │
                      ▼
                 ┌──────────┐
                 │    DB    │
                 │(Telemetry)│
                 └──────────┘

Data Flow:
1. Every 5 minutes: telematicsSync.start()

2. GET https://api.samsara.com/fleet/vehicles/locations
   Headers: Authorization: Bearer <SAMSARA_API_TOKEN>
   → Returns all vehicle locations

3. For each vehicle:
   - Map Samsara vehicle ID to internal vehicle_id
   - INSERT INTO telemetry_data (vehicle_id, latitude, longitude, speed, timestamp)
   - UPDATE vehicles SET latitude, longitude, last_gps_update

4. GET https://api.samsara.com/fleet/vehicles/stats
   → Returns odometer, fuel, engine state
   - UPDATE vehicles SET odometer, fuel_level

5. GET https://api.samsara.com/safety/events
   → Returns safety events (harsh braking, etc.)
   - INSERT INTO video_events
```

### 4. Azure Speech Services (Dispatch Transcription)

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│WebSocket │────▶│   API    │────▶│  Azure   │────▶│  Azure   │
│ Client   │     │ Handler  │     │   Blob   │     │  Speech  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                      │
                      ▼
                 ┌──────────┐
                 │    DB    │
                 │(Transcr.)│
                 └──────────┘

Flow:
1. Audio transmission received via WebSocket

2. Upload audio to Azure Blob Storage
   - Container: dispatch-audio
   - Path: /{tenant_id}/{transmission_id}.wav

3. Get SAS URL for audio file

4. Create Azure Speech recognizer
   speechConfig = SpeechConfig.fromSubscription(AZURE_SPEECH_KEY, region)
   audioConfig = AudioConfig.fromWavFileInput(audioFile)
   recognizer = SpeechRecognizer(speechConfig, audioConfig)

5. Start continuous recognition
   recognizer.recognizeOnceAsync()
   → Returns recognized text + confidence score

6. UPDATE audio_transmissions SET transcription = text, transcription_confidence = score

7. Send transcription to Azure OpenAI for tagging
   → Extracts: emergency status, location mentions, unit numbers
   → UPDATE audio_transmissions SET ai_tags = tags
```

### 5. TripoSR 3D Reconstruction

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────▶│   API    │────▶│  Azure   │────▶│ TripoSR  │
│ (Photos) │     │  Upload  │     │   Blob   │     │  Service │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                      │
                      ▼
                 ┌──────────┐
                 │    DB    │
                 │ (Status) │
                 └──────────┘

Flow:
1. POST /api/damage-reports (multipart form with 3-6 photos)

2. Upload photos to Azure Blob Storage
   - Container: damage-photos
   - Path: /{tenant_id}/{report_id}/{filename}

3. INSERT damage_reports (triposr_status = 'pending')

4. Background job: Start TripoSR reconstruction
   - POST https://triposr-service.azure.com/api/reconstruct
   - Body: { photos: [url1, url2, ...] }
   - Returns: { task_id: "..." }

5. UPDATE damage_reports SET triposr_task_id = task_id, triposr_status = 'processing'

6. Poll TripoSR status endpoint every 30 seconds
   GET /api/task/:task_id/status

7. When complete:
   - Download GLB model
   - Upload to Azure Blob Storage
   - UPDATE damage_reports SET triposr_model_url, triposr_status = 'completed'

8. Frontend polls: GET /api/damage-reports/:id
   → Returns status and model URL when ready
```

---

## Real-Time Data Flows

### WebSocket Connection Management

```typescript
// Server-side connection tracking
private activeConnections: Map<string, WebSocket> = new Map()
private channelListeners: Map<number, Set<string>> = new Map()

// Connection lifecycle
wss.on('connection', (ws, req) => {
  const connectionId = uuidv4()
  activeConnections.set(connectionId, ws)

  ws.on('message', (data) => handleMessage(connectionId, data))
  ws.on('close', () => handleDisconnection(connectionId))
})

// Broadcasting to channel
function broadcastToChannel(channelId: number, message: any) {
  const listeners = channelListeners.get(channelId) || new Set()
  listeners.forEach(connectionId => {
    const ws = activeConnections.get(connectionId)
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
    }
  })
}
```

### Real-Time GPS Tracking

```
Vehicle IoT Device ────▶ Samsara API ────▶ Fleet API (sync job) ────▶ Database
                                                    │
                                                    ▼
                                              WebSocket Broadcast
                                                    │
                                                    ▼
                                        ┌──────────────────────┐
                                        │ Connected Clients    │
                                        │ - Fleet map view     │
                                        │ - Individual vehicle │
                                        │ - Dispatch console   │
                                        └──────────────────────┘
```

### Geofence Event Detection

```
1. Telemetry data received (lat/lng)
2. Query: SELECT * FROM geofences WHERE ST_Contains(geometry, ST_Point(lng, lat))
3. If match found:
   a. Compare with last known status
   b. If status changed (entry/exit):
      - INSERT geofence_events
      - Check alert_on_entry / alert_on_exit
      - If alerts enabled:
        * Send email to alert_recipients
        * Send push notification
        * WebSocket broadcast to dispatch
```

---

## Authentication & Authorization Flow

### JWT Token Structure

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "admin",
    "tenant_id": "uuid",
    "iat": 1699800000,
    "exp": 1699886400
  },
  "signature": "..."
}
```

### Authentication Middleware Flow

```typescript
export const authenticateJWT = async (req, res, next) => {
  // Check if user already set (global mock mode)
  if (req.user) return next()

  // Dev/staging mock data bypass
  if (process.env.USE_MOCK_DATA === 'true') {
    req.user = {
      id: '1',
      email: 'demo@fleet.local',
      role: 'admin',
      tenant_id: '1'
    }
    return next()
  }

  // Production: Validate JWT
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Authentication required' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' })
  }
}
```

### Authorization Middleware Flow

```typescript
export const authorize = (...roles: string[]) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: roles,
        current: req.user.role
      })
    }

    next()
  }
}
```

### Role-Based Access Control Matrix

| Role | Vehicles | Drivers | Work Orders | Routes | Dispatch | Settings |
|------|----------|---------|-------------|--------|----------|----------|
| **admin** | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD |
| **fleet_manager** | CRUD | CRUD | CRUD | CRUD | Read | Read |
| **driver** | Read (assigned) | Read (self) | Read | Read (assigned) | Join channels | Read |
| **technician** | Read | Read | Update | - | - | - |
| **viewer** | Read | Read | Read | Read | - | - |

---

## Background Jobs & Scheduled Tasks

### Maintenance Scheduler

```typescript
// Cron: Daily at 6 AM
maintenanceScheduler.start()

async function checkOverdueSchedules() {
  // Find overdue schedules
  const overdue = await pool.query(`
    SELECT ms.*, v.vin, v.make, v.model
    FROM maintenance_schedules ms
    JOIN vehicles v ON ms.vehicle_id = v.id
    WHERE ms.is_active = true
    AND (
      (ms.interval_type = 'days' AND ms.next_service_due_date <= CURRENT_DATE)
      OR (ms.interval_type = 'miles' AND v.odometer >= ms.next_service_due_odometer)
      OR (ms.interval_type = 'hours' AND v.engine_hours >= ms.next_service_due_engine_hours)
    )
  `)

  // Create work orders
  for (const schedule of overdue.rows) {
    await createWorkOrder({
      vehicle_id: schedule.vehicle_id,
      type: 'preventive',
      priority: 'medium',
      description: `Scheduled ${schedule.service_type}`,
      odometer_reading: vehicle.odometer
    })

    // Send notification
    await sendEmail({
      to: 'fleet-manager@example.com',
      subject: `Maintenance Due: ${vehicle.make} ${vehicle.model} (${vehicle.vin})`,
      body: `Service type: ${schedule.service_type}`
    })
  }
}
```

### Telematics Sync Job

```typescript
// Cron: Every 5 minutes
telematicsSync.start()

async function syncVehicleData() {
  // Get vehicles with GPS devices
  const vehicles = await pool.query(`
    SELECT id, gps_device_id, tenant_id
    FROM vehicles
    WHERE gps_device_id IS NOT NULL
    AND status = 'active'
  `)

  // Fetch from Samsara
  const locations = await samsaraService.getVehicleLocations()

  for (const vehicle of vehicles.rows) {
    const location = locations.find(l => l.id === vehicle.gps_device_id)
    if (!location) continue

    // Insert telemetry
    await pool.query(`
      INSERT INTO telemetry_data (
        tenant_id, vehicle_id, timestamp,
        latitude, longitude, speed, heading
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      vehicle.tenant_id,
      vehicle.id,
      new Date(),
      location.latitude,
      location.longitude,
      location.speed,
      location.heading
    ])

    // Update vehicle
    await pool.query(`
      UPDATE vehicles
      SET latitude = $1, longitude = $2,
          location = ST_SetSRID(ST_MakePoint($2, $1), 4326),
          speed = $3, heading = $4,
          last_gps_update = NOW()
      WHERE id = $5
    `, [location.latitude, location.longitude, location.speed, location.heading, vehicle.id])

    // Check geofences
    await checkGeofenceEvents(vehicle.id, location.latitude, location.longitude)
  }
}
```

---

## Caching Strategy

### Redis Cache Layers

**Layer 1: Session Cache**
```typescript
// User sessions (if using session-based auth)
redis.set(`session:${sessionId}`, JSON.stringify(user), 'EX', 86400) // 24h
```

**Layer 2: API Response Cache**
```typescript
// Cache frequent queries
redis.set(`vehicles:${tenantId}:list`, JSON.stringify(vehicles), 'EX', 300) // 5 min

// Cache external API calls
redis.set(`smartcar:${vehicleId}:location`, JSON.stringify(location), 'EX', 300)
```

**Layer 3: Computed Data Cache**
```typescript
// Cache expensive calculations
redis.set(`analytics:${tenantId}:dashboard`, JSON.stringify(metrics), 'EX', 3600) // 1h
```

### Cache Invalidation Strategy

**Time-based expiration:**
- Session data: 24 hours
- List queries: 5 minutes
- External API data: 5 minutes
- Analytics: 1 hour

**Event-based invalidation:**
```typescript
// After vehicle update
async function updateVehicle(id, data) {
  await db.update(id, data)

  // Invalidate caches
  await redis.del(`vehicle:${id}`)
  await redis.del(`vehicles:${tenantId}:list`)
}
```

---

## Data Security & Compliance

### FedRAMP Compliance Features

**1. Audit Logging (AU-2, AU-3)**
```typescript
// Every action logged
export async function createAuditLog(
  tenantId: string,
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  details: any,
  ipAddress: string,
  userAgent: string,
  outcome: 'success' | 'failure',
  errorMessage?: string
) {
  const hash = crypto.createHash('sha256')
    .update(JSON.stringify({ tenantId, userId, action, resourceType, resourceId, details }))
    .digest('hex')

  await pool.query(`
    INSERT INTO audit_logs (
      tenant_id, user_id, action, resource_type, resource_id,
      details, ip_address, user_agent, outcome, error_message, hash
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
  `, [tenantId, userId, action, resourceType, resourceId, details, ipAddress, userAgent, outcome, errorMessage, hash])
}
```

**2. Account Lockout (AC-7)**
```sql
-- Failed login tracking
UPDATE users
SET failed_login_attempts = failed_login_attempts + 1,
    account_locked_until = CASE
      WHEN failed_login_attempts >= 3 THEN NOW() + INTERVAL '30 minutes'
      ELSE NULL
    END
WHERE id = $1
```

**3. Password Complexity (IA-5)**
```typescript
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[0-9]/, 'Password must contain number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain special character')
```

**4. Data Encryption**
- **At Rest:** Azure Database encryption enabled
- **In Transit:** TLS 1.2+ enforced
- **Secrets:** Azure Key Vault with RBAC

**5. Multi-Factor Authentication**
```sql
users (
  ...
  mfa_enabled BOOLEAN DEFAULT false,
  mfa_secret VARCHAR(255)
)
```

### Data Retention Policies

**Telemetry Data:**
- Hot storage: 30 days (PostgreSQL)
- Cold storage: 1 year (Azure Blob)
- Archive: 7 years (compliance)

**Audit Logs:**
- Retained indefinitely
- Immutable (no DELETE permission)

**Video Events:**
- Standard: 30 days
- Evidence locker: Indefinite

---

## Performance Considerations

### Database Query Optimization

**N+1 Query Prevention:**
```typescript
// BAD: N+1 queries
const vehicles = await getVehicles()
for (const vehicle of vehicles) {
  const driver = await getDriver(vehicle.assigned_driver_id) // N queries
}

// GOOD: Single query with JOIN
const vehicles = await pool.query(`
  SELECT v.*, d.first_name, d.last_name
  FROM vehicles v
  LEFT JOIN drivers d ON v.assigned_driver_id = d.id
  WHERE v.tenant_id = $1
`, [tenantId])
```

**Pagination:**
```typescript
// Always paginate large result sets
const limit = Math.min(parseInt(req.query.limit) || 50, 100)
const offset = (page - 1) * limit

const result = await pool.query(`
  SELECT * FROM vehicles
  WHERE tenant_id = $1
  LIMIT $2 OFFSET $3
`, [tenantId, limit, offset])
```

### Connection Pooling

```typescript
// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  port: 5432,
  max: 20,              // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})
```

---

## Monitoring & Observability

### OpenTelemetry Instrumentation

```typescript
// Automatic instrumentation
import sdk from './config/telemetry'
sdk.start()

// Manual tracing
const tracer = trace.getTracer('fleet-api')
const span = tracer.startSpan('database.query')
span.setAttribute('query.type', 'SELECT')
span.end()
```

### Application Insights

**Tracked Metrics:**
- Request duration
- Request count
- Failed requests
- Database query time
- External API latency
- WebSocket connections
- Cache hit/miss ratio

**Custom Events:**
```typescript
import { appInsights } from './config/app-insights'

appInsights.trackEvent({
  name: 'VehicleCreated',
  properties: {
    tenant_id: tenantId,
    vehicle_type: vehicleType
  }
})
```

---

## Deployment Architecture

### Kubernetes Resources

**Namespaces:**
- `fleet-management` (production)
- `fleet-management-staging`
- `fleet-management-dev`

**Deployments:**
- `fleet-api` (Node.js API)
- `fleet-app` (React frontend)
- `fleet-postgres` (Database)
- `fleet-redis` (Cache)

**Services:**
- `fleet-api-service` (ClusterIP, port 3000)
- `fleet-app-internal` (ClusterIP, port 3000)
- `fleet-postgres-service` (ClusterIP, port 5432)
- `fleet-redis-service` (ClusterIP, port 6379)

**Ingress:**
- Production: `fleet.capitaltechalliance.com`
- Staging: `fleet-staging.capitaltechalliance.com`
- Dev: `fleet-dev.capitaltechalliance.com`

---

**Document Version:** 1.0.0
**Last Updated:** November 13, 2025
