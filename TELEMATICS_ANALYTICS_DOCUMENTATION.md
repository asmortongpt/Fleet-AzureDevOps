# Fleet Telematics & Analytics Features Documentation

## Executive Summary

This document provides comprehensive documentation of four core telematics and analytics features in the Fleet Management application:

1. **Video Telematics** - AI-powered dashcam event detection and driver coaching
2. **Video Telematics Dashboard** - Real-time monitoring and analysis interface
3. **Fleet Analytics** - Comprehensive performance metrics and cost analysis
4. **Traffic Cameras** - Real-time traffic monitoring and camera network management

---

## Feature 1: Video Telematics

### Feature Overview
**File**: `/home/user/Fleet/src/components/modules/VideoTelematics.tsx`

The Video Telematics module provides AI-powered detection and management of safety events captured from vehicle dashcams, with integrated driver coaching workflows and comprehensive privacy controls.

### Target Users
- **Fleet Managers**: Manage fleet-wide safety events and coaching programs
- **Safety Managers**: Review incidents, assign coaching, track driver improvement
- **Compliance Officers**: Ensure regulatory compliance and data retention
- **Drivers**: View their own events and coaching status (with appropriate permissions)
- **Administrators**: Configure system-wide privacy and security settings

### User Stories

1. **As a Fleet Manager, I want to view all video events across my fleet so that I can identify safety trends and high-risk drivers**
   - Access comprehensive event list with filtering by severity, type, and status
   - See real-time metrics on events needing review and coaching
   - Export data for compliance reporting

2. **As a Safety Manager, I want to review specific events and assign coaching so that I can improve driver safety**
   - Play video clips of recorded incidents
   - Assign coaching to drivers with specific notes
   - Track coaching status (pending/in-progress/completed)

3. **As a Compliance Officer, I want to configure privacy settings and data retention policies so that we comply with regulations**
   - Set video retention periods (7-90 days configurable)
   - Enable/disable audio recording
   - Control access by role (admin, manager, driver)
   - Auto-delete videos after retention period

4. **As a Driver, I want to understand what events were recorded and why so that I can improve my driving**
   - View their own safety events (with permission)
   - Understand coaching assignments
   - See completed coaching status
   - Know if they can opt-out of recording

### Core Workflows

#### Workflow 1: Event Detection & Review
```
1. AI System detects driving event (via dashcam)
2. Event is stored with metadata:
   - Event type (phone-use, harsh-braking, etc.)
   - Severity level (low/medium/high/critical)
   - Location and timestamp
   - Speed, AI confidence score
   - Vehicle and driver identification
3. Event appears in manager's queue (marked as unreviewed)
4. Manager/Safety Officer:
   a) Searches/filters to find event
   b) Plays video clip to verify event
   c) Marks event as reviewed
   d) Optionally assigns coaching
5. Driver receives notification of coaching assignment
6. Coaching workflow initiated
```

#### Workflow 2: Coaching Assignment & Tracking
```
1. Manager identifies event requiring coaching
2. Manager clicks "Assign Coaching" on event
3. System creates coaching record with:
   - Initial status: "pending"
   - Assigned to: Safety Manager/specific person
   - Notes added by manager
4. Driver is notified of coaching assignment
5. Coaching Status Progression:
   - Pending: Awaiting driver/coach scheduling
   - In-Progress: Active coaching session
   - Completed: Coaching session finished, noted
6. Manager can view coaching progress anytime
```

#### Workflow 3: Privacy Settings Configuration
```
1. Administrator navigates to Privacy Settings
2. Configures:
   Recording Settings:
   - Enable/disable audio recording
   - Driver notification of recording
   - Driver opt-out capability
   
   Data Retention:
   - Set retention period (7-90 days)
   - Auto-delete videos after retention
   
   Privacy Protection:
   - Face blurring (automated)
   - License plate blurring (automated)
   
   Access Control:
   - Select roles with access (admin/manager/driver)
   
   Security:
   - Enable video encryption on export/download
3. Saves settings with validation
4. System applies settings to all new/existing videos
```

### Key Components & Data Model

#### Event Data Structure (VideoEvent Interface)
```typescript
{
  id: string
  tenantId: string
  vehicleId: string
  vehicleNumber: string
  driverId?: string
  driverName?: string
  
  // Event Classification
  eventType: "distraction" | "phone-use" | "drowsiness" | "tailgating" |
             "harsh-braking" | "harsh-acceleration" | "speeding" | "collision" |
             "near-miss" | "seatbelt" | "rolling-stop" | "lane-departure"
  severity: "low" | "medium" | "high" | "critical"
  
  // Temporal & Location Data
  timestamp: string (ISO 8601)
  location: {
    lat: number
    lng: number
    address: string
  }
  
  // Vehicle Metrics
  speed: number (mph)
  duration: number (seconds)
  
  // AI Analysis
  videoUrl?: string
  thumbnailUrl?: string
  aiConfidence: number (0-1)
  
  // Review Tracking
  reviewed: boolean
  reviewedBy?: string
  reviewedAt?: string
  
  // Coaching Assignment
  coaching: {
    assigned: boolean
    assignedTo?: string
    status: "pending" | "in-progress" | "completed"
    notes?: string
  }
  
  // Data Retention
  retained: boolean
  retentionDays: number
}
```

#### Privacy Settings Data Structure
```typescript
{
  enableAudioRecording: boolean (default: true)
  videoRetentionPeriod: number days (default: 30)
  autoDeleteAfterRetention: boolean (default: true)
  
  blurFaces: boolean (default: false)
  blurLicensePlates: boolean (default: false)
  
  restrictAccessByRole: {
    admin: boolean (default: true)
    manager: boolean (default: true)
    driver: boolean (default: false)
  }
  
  enableDriverOptOut: boolean (default: false)
  notifyDriversOfRecording: boolean (default: true)
  enableVideoEncryption: boolean (default: true)
}
```

### UI Components & Features

#### Summary Metrics Card
- **Total Events**: Count of all video events (all-time)
- **Needs Review**: Count of unreviewed events (yellow highlight)
- **Coaching Pending**: Count of pending coaching assignments (orange highlight)
- **Critical Events**: Count of critical severity events (red highlight)

#### Event List Table
Columns:
- Time (date + time)
- Vehicle/Driver (vehicle number + driver name)
- Event Type (badge)
- Severity (color-coded badge)
- Confidence (AI confidence percentage)
- Coaching Status (pending/in-progress/completed/not assigned)
- Actions (Play video, Review, Assign Coaching)

#### Filtering & Search
- **Search**: By vehicle number, driver name, or location address
- **Filter by Event Type**: All types or specific (Distraction, Phone Use, Drowsiness, etc.)
- **Filter by Severity**: All, Low, Medium, High, Critical
- **Filter by Review Status**: All, Reviewed, Unreviewed

#### Video Event Details Dialog
Shows when user clicks "Play" button:
- Video player (placeholder showing duration and speed)
- Location details
- AI confidence score
- Reviewer information
- Retention period
- Coaching status (if assigned)
- Download video clip button

### Data Inputs & Outputs

#### Inputs
- **Vehicle dashcam footage**: Raw video streams from installed cameras
- **AI event detection results**: Events identified by AI models
- **Driver/vehicle data**: From fleet database
- **Geolocation data**: GPS coordinates and address lookup
- **Speed/acceleration data**: From vehicle telematics
- **Manager actions**: Review events, assign coaching

#### Outputs
- **Event records**: Stored in database for history/compliance
- **Coaching assignments**: Create work items for safety managers
- **Privacy-compliant videos**: Blurred faces/plates if enabled
- **Audit logs**: Track all reviews and coaching assignments
- **Analytics metrics**: Feed into Fleet Analytics for trends
- **Alerts/notifications**: Notify drivers of coaching assignments
- **Compliance reports**: For regulatory requirements

### Integration Points

#### 1. Telematics System
- Receives video events from dashcam systems
- Provides event data to incident analysis

#### 2. Driver Database
- Retrieves driver names, IDs, assignments
- Updates driver safety scores

#### 3. Vehicle Management
- Gets vehicle information and status
- Integrates vehicle location data

#### 4. Notification System
- Sends coaching assignment notifications to drivers
- Sends alerts for critical events

#### 5. Video Storage
- Stores and retrieves video clips
- Manages video encryption/decryption
- Handles video cleanup based on retention

#### 6. Fleet Analytics
- Provides event data for safety trends
- Feeds into driver scorecard calculations
- Contributes to cost analysis (safety incidents)

#### 7. Compliance & Audit
- Logs all user actions (reviews, coaching)
- Maintains audit trail for privacy compliance
- Exports data for regulatory reporting

---

## Feature 2: Video Telematics Dashboard

### Feature Overview
**File**: `/home/user/Fleet/src/components/VideoTelematicsDashboard.tsx`

The Video Telematics Dashboard provides real-time monitoring, comprehensive analysis, and management of video events from multiple camera types, with integrated coaching queue management and camera health monitoring.

### Target Users
- **Fleet Dispatch Centers**: Monitor real-time safety events across fleet
- **Safety Directors**: Analyze trends and manage coaching programs
- **Operations Managers**: Ensure camera systems are operational
- **Field Supervisors**: Monitor driver safety during shifts
- **Compliance Teams**: Generate reports for regulatory agencies

### User Stories

1. **As a Dispatch Center Operator, I want to see real-time video events so that I can respond immediately to critical safety incidents**
   - See critical events highlighted at the top
   - Know how many events need review
   - Quickly play video of incidents
   - Know which cameras are offline

2. **As a Safety Director, I want to view the coaching queue so that I can schedule and manage driver coaching sessions**
   - See all drivers needing coaching
   - Filter by event type and severity
   - Access video for coaching reference
   - Track coaching progress

3. **As an Operations Manager, I want to monitor camera health so that I can ensure continuous monitoring**
   - See online/offline camera status
   - Know when cameras last reported (ping time)
   - Check firmware versions
   - Quickly identify failed equipment

4. **As a Compliance Officer, I want to analyze AI-detected behaviors so that I can assess accuracy and validate incidents**
   - See AI-detected behaviors with confidence scores
   - Compare multiple behaviors per event
   - Review false positive rate
   - Validate AI model performance

### Core Workflows

#### Workflow 1: Real-Time Event Monitoring
```
1. Dashboard loads and fetches latest events
2. Events displayed with real-time filters:
   - Severity (critical, severe, moderate, minor)
   - Event type (harsh braking, speeding, drowsiness, etc.)
   - Date range (last 24h, 7d, 30d, 90d, all)
   - Review status
3. User applies filters:
   a) Dashboard updates filtered event list
   b) Shows only matching events
   c) Updates event count
4. User clicks on event:
   a) Event details popup opens
   b) Shows video thumbnail
   c) Displays all metrics and AI analysis
5. User actions:
   - Play video (opens in new window)
   - Mark reviewed / Mark false positive
   - Assign for coaching
   - Mark as evidence
```

#### Workflow 2: Camera Health Monitoring
```
1. Dashboard loads camera health tab
2. Displays grid of camera cards showing:
   - Vehicle name
   - Camera type (dash cam, interior, 360, etc.)
   - Health status (online/offline/unknown)
   - Current status
   - Last ping time
   - Firmware version
3. System color-codes:
   - Green: Online, healthy
   - Red: Offline, not reporting
   - Gray: Unknown/pending
4. Manager can:
   a) Identify offline cameras
   b) Contact technician for repairs
   c) Track firmware versions
   d) Schedule maintenance
```

#### Workflow 3: Coaching Queue Management
```
1. User navigates to Coaching Queue tab
2. System displays all events requiring coaching that haven't been reviewed
3. Queue ordered by:
   - Severity (critical first)
   - Timestamp (newest first)
4. For each coaching queue item:
   - Show driver name
   - Event type
   - Severity badge
   - Date of incident
5. Manager can:
   a) View video to understand incident
   b) Schedule coaching session
   c) Add coaching notes
   d) Track progress
```

### Key Components & Data Structures

#### VideoEvent (Dashboard Version)
```typescript
{
  id: number
  vehicle_name: string
  vin: string
  driver_name: string
  event_type: string
  severity: string ('minor', 'moderate', 'severe', 'critical')
  event_timestamp: string
  latitude: number
  longitude: number
  address: string
  speed_mph: number
  g_force: number
  video_url: string
  video_thumbnail_url: string
  confidence_score: number (0-1)
  ai_detected_behaviors: Array<{
    behavior: string
    confidence: number
  }>
  reviewed: boolean
  coaching_required: boolean
  marked_as_evidence: boolean
  camera_type: string
}
```

#### CameraHealth
```typescript
{
  id: number
  vehicle_name: string
  vin: string
  camera_type: string
  status: string
  health_status: 'online' | 'offline' | 'unknown'
  last_ping_at: string
  hours_since_ping: number
  firmware_version: string
}
```

### UI Components & Features

#### Header Section
- Title: "Video Telematics"
- Subtitle: "Real-time driver safety monitoring and AI-powered event analysis"

#### Stats Cards (6-column grid)
1. **Total Events**: Count of all events detected
2. **Critical**: Count of critical severity events (red)
3. **Needs Review**: Count of unreviewed events (yellow)
4. **Needs Coaching**: Count of coaching-required unreviewed events (orange)
5. **Cameras Online**: Count of operational cameras (green)
6. **Cameras Offline**: Count of offline cameras (red)

#### Tabs
1. **Safety Events Tab**
   - Filters: Severity, Event Type, Date Range, Apply button
   - Event cards showing:
     - Thumbnail image
     - Event title and details
     - Vehicle and driver info
     - Metrics (time, speed, g-force, AI confidence)
     - Location address
     - AI-detected behaviors with confidence
     - Action buttons

2. **Camera Health Tab**
   - Grid of camera status cards
   - Shows health status, last ping, firmware version
   - Color-coded status badges

3. **Coaching Queue Tab**
   - List of events requiring coaching
   - Driver name, event type, severity, date
   - Review video button for each

### Action Buttons
- **Play Video**: Opens video clip in new window
- **Mark Reviewed**: Sets event as reviewed
- **False Positive**: Marks event as false positive (also sets reviewed)
- **Requires Coaching**: Flags event for driver coaching
- **Evidence Badge**: Shows if marked as evidence
- **Coaching Required Badge**: Shows coaching status

### Data Inputs & Outputs

#### Inputs
- **API Endpoint**: `/api/video/events` (with filters)
  - Severity filter
  - Event type filter
  - Date range filter
- **API Endpoint**: `/api/video/health/cameras` - Camera status data
- **API Endpoint**: `/api/video/events/{id}/clip` - Video playback URL
- **User actions**: Review, coaching assignment, false positive marking

#### Outputs
- **PATCH** `/api/video/events/{id}/review`:
  ```json
  {
    "reviewed": boolean,
    "falsePositive": boolean,
    "reviewNotes": string
  }
  ```
- **PATCH** `/api/video/events/{id}/review`:
  ```json
  {
    "coachingRequired": boolean
  }
  ```
- **Displayed metrics**: Real-time stats for dashboard
- **Video playback**: Redirects to secure video URL

### Integration Points

#### 1. Video Events API
- Fetches real-time events from backend
- Supports filtering by severity, type, date range
- Returns paginated results

#### 2. Camera Management System
- Monitors camera health and operational status
- Tracks ping/heartbeat data
- Manages firmware version info

#### 3. Video Storage & CDN
- Provides secure URLs for video playback
- Delivers thumbnails for event preview
- Manages access control

#### 4. Event Review Service
- Persists review status in database
- Tracks reviewer identity and timestamp
- Records false positive classifications

#### 5. Coaching Workflow Engine
- Creates coaching assignments
- Tracks coaching status progression
- Sends driver notifications

#### 6. Authentication & Authorization
- Uses Bearer token authentication
- Validates user permissions before showing data
- Auto-logs out on 401 Unauthorized

---

## Feature 3: Fleet Analytics

### Feature Overview
**File**: `/home/user/Fleet/src/components/modules/FleetAnalytics.tsx`

Fleet Analytics provides comprehensive performance metrics, financial analysis, utilization tracking, and KPI monitoring across the entire fleet, enabling data-driven decision-making for fleet optimization.

### Target Users
- **Fleet Managers**: Monitor overall fleet performance and efficiency
- **Operations Directors**: Analyze utilization and cost trends
- **CFO/Finance Team**: Track costs, ROI, and budget compliance
- **Maintenance Managers**: Monitor maintenance costs and downtime
- **Route Planners**: Optimize fleet utilization and fuel efficiency

### User Stories

1. **As a Fleet Manager, I want to see fleet utilization rates so that I can optimize vehicle assignment and reduce idle time**
   - View current fleet utilization percentage
   - See monthly trends in utilization
   - Identify underutilized vehicles
   - Compare by vehicle type

2. **As a Finance Director, I want to analyze operating costs so that I can control expenses and improve profitability**
   - View total fuel costs vs. maintenance costs
   - Track cost per vehicle and per mile
   - See cost trends over time
   - Identify cost-saving opportunities
   - Generate financial reports

3. **As a Maintenance Manager, I want to monitor maintenance costs and downtime so that I can optimize maintenance schedules**
   - View total maintenance expenses
   - Track vehicles in service (downtime)
   - Monitor downtime rate percentage
   - See maintenance cost trends
   - Identify high-maintenance vehicles

4. **As an Operations Director, I want to view performance insights so that I can make informed strategic decisions**
   - See actionable insights about fleet performance
   - Identify trends (improving/declining metrics)
   - Get alerts for concerning metrics
   - Compare actual vs. target performance

### Core Workflows

#### Workflow 1: Fleet Overview Monitoring
```
1. Manager opens Fleet Analytics
2. Dashboard loads with period selector (Week/Month/Quarter/Year)
3. Overview tab shows:
   a) Total Fleet Size card: Shows vehicle count
   b) Fleet Utilization card: Shows % vehicles in active use
   c) Avg Mileage card: Shows average miles per vehicle
   d) Vehicles in Service card: Shows count needing maintenance
4. Manager reviews overview metrics
5. Charts display:
   - Fleet Status Over Time (monthly breakdown of active/idle/service)
   - Fleet Utilization Rate (monthly trend line)
6. Manager can:
   - Click card for detail drill-down
   - Change time period
   - Switch to other analytics tabs
```

#### Workflow 2: Financial Analysis
```
1. Manager navigates to Financial tab
2. Top metrics display:
   a) Total Fuel Cost: Aggregated with trend and change %
   b) Maintenance Cost: Aggregated with trend and change %
   c) Cost per Vehicle: Calculated average
3. Charts show:
   a) Cost Analysis Breakdown (monthly bar chart with fuel/maintenance)
   b) Cost Distribution (pie breakdown showing % allocation)
4. Insights section shows:
   - "Fuel Costs Rising" (with 8.5% increase highlighted)
   - "Maintenance Costs Decreasing" (with 2.3% decrease)
   - Recommendations (fuel efficiency training, route optimization)
5. Manager can:
   - Export financial report
   - Drill into specific cost categories
   - View vendor billing details
```

#### Workflow 3: Utilization Analysis by Vehicle Type
```
1. Manager navigates to Utilization tab
2. Displays:
   a) Bar chart: Utilization % by vehicle type (Sedan/SUV/Truck/Van/Emergency)
   b) Fleet Composition card showing:
      - Vehicle type name
      - Count of vehicles
      - Utilization percentage
      - Visual progress bar (green/yellow/red based on 80%/60% thresholds)
3. Manager insights:
   - Identify underutilized types
   - Plan fleet expansion or reduction
   - Optimize assignment strategy
   - Reallocate vehicles between departments
```

#### Workflow 4: KPI Dashboard
```
1. Manager navigates to Key Metrics (KPIs) tab
2. Four main KPI cards display:
   a) Cost per Mile: Calculated as (fuel + maintenance) / total miles
   b) Fuel Efficiency: Average MPG across fleet
   c) Downtime Rate: % of fleet requiring service
   d) Utilization: % of fleet actively in use
3. Performance Insights section shows:
   a) Fleet Utilization Improving: +3.2% trend
   b) Fuel Costs Rising: +8.5% trend (warning)
   c) Maintenance Costs Decreasing: -2.3% trend (success)
   d) Each with actionable recommendations
4. Manager can:
   - Set target KPIs
   - Compare actual vs. target
   - Export KPI report
   - Share with executives
```

### Key Components & Data Model

#### FleetMetrics Data Structure
```typescript
{
  totalFleet: number (total vehicle count)
  utilization: number (%) (active vehicles / total)
  totalFuelCost: number ($)
  totalMaintenanceCost: number ($)
  avgMileage: number (miles)
  downtime: number (vehicle count in service)
}
```

#### KPI Data Structure
```typescript
{
  costPerVehicle: number ($) = (totalFuel + totalMaintenance) / totalFleet
  costPerMile: number ($) = (totalFuel + totalMaintenance) / (avgMileage * totalFleet)
  downtimeRate: number (%) = (downtime / totalFleet) * 100
  fuelEfficiency: number (MPG) = average across all fuel transactions
}
```

#### Monthly Fleet Data
```typescript
{
  name: string (month name: "Jan", "Feb", etc.)
  active: number (vehicles in active use)
  idle: number (vehicles not in use)
  service: number (vehicles in service/maintenance)
  utilization: number (%) (active / total)
}
```

#### Cost Analysis Data
```typescript
{
  name: string (month)
  fuel: number ($)
  maintenance: number ($)
  insurance: number ($)
}
```

#### Utilization by Type Data
```typescript
{
  name: string (vehicle type)
  utilization: number (%)
  count: number (vehicles of this type)
}
```

### UI Components & Features

#### Header
- Title: "Fleet Analytics"
- Subtitle: "Comprehensive analytics and performance insights"
- Time Period Selector (Week/Month/Quarter/Year)

#### Tabs
1. **Overview Tab**
   - Metric cards: Total Fleet Size, Utilization, Avg Mileage, Vehicles in Service
   - Fleet Status Over Time chart
   - Fleet Utilization Rate chart

2. **Financial Tab**
   - Metric cards: Total Fuel Cost, Maintenance Cost, Cost per Vehicle
   - Cost Analysis Breakdown chart
   - Cost Distribution card with progress bars
   - Total Operating Cost summary

3. **Utilization Tab**
   - Utilization by Vehicle Type chart
   - Fleet Composition card with breakdown by type

4. **Key Metrics Tab**
   - KPI cards: Cost per Mile, Fuel Efficiency, Downtime Rate, Utilization
   - Performance Insights section with 3-4 actionable insights
   - Each insight shows trend icon and supporting metrics

### Chart Components
- **Area Charts**: Fleet status over time
- **Line Charts**: Utilization rate trends
- **Bar Charts**: Cost by category, utilization by type
- **Progress Bars**: Visual representation of metrics
- **Stat Cards**: Key numbers with trend indicators

### Data Inputs & Outputs

#### Inputs (from useFleetData hook)
```typescript
vehicles: Vehicle[] (provides status, mileage)
fuelTransactions: FuelTransaction[] (provides fuel cost, mpg, gallons)
workOrders: WorkOrder[] (provides maintenance cost, service status)
```

#### Calculations Performed
1. **Total Fleet**: Count of vehicles
2. **Active Vehicles**: Count where status === "active"
3. **Utilization Rate**: (active / total) * 100
4. **Average Mileage**: Sum of mileage / vehicle count
5. **Downtime Count**: Count where status === "service"
6. **Total Fuel Cost**: Sum of all transaction totalCost
7. **Total Maintenance Cost**: Sum of workOrder.cost where cost exists
8. **Cost per Vehicle**: (fuel + maintenance) / vehicle count
9. **Cost per Mile**: (fuel + maintenance) / (avgMileage * vehicleCount)
10. **Fuel Efficiency**: Sum of mpg / transaction count
11. **Downtime Rate**: (downtime / total) * 100

#### Outputs
- **Dashboard metrics**: Real-time display
- **Charts**: Visualized trends
- **KPIs**: Executive summary
- **Insights**: Actionable recommendations
- **Export capability**: Reports for stakeholders

### Integration Points

#### 1. Fleet Data Source (useFleetData Hook)
- Provides vehicles, fuel transactions, work orders
- Real-time data from production API
- Handles data mutations (add/update/delete)

#### 2. Vehicle Database
- Provides vehicle status (active/idle/service)
- Mileage tracking
- Vehicle type and classification

#### 3. Fuel Management System
- Tracks fuel costs and MPG
- Provides fuel transaction history
- Calculates fuel efficiency metrics

#### 4. Maintenance System
- Provides work order costs
- Tracks service status and downtime
- Supplies maintenance schedule data

#### 5. Reporting System
- Exports analytics data to reports
- Generates executive dashboards
- Provides audit trails

---

## Feature 4: Traffic Cameras

### Feature Overview
**File**: `/home/user/Fleet/src/components/modules/TrafficCameras.tsx`

Traffic Cameras module provides real-time monitoring and management of traffic camera networks across service regions, enabling route optimization and incident response through integration with third-party data sources like ArcGIS.

### Target Users
- **Route Planners**: Use traffic data to optimize routes and avoid congestion
- **Dispatch Managers**: Monitor traffic conditions for real-time routing decisions
- **Operations Managers**: Ensure camera network is operational
- **Regional Coordinators**: Monitor regional traffic patterns
- **Incident Managers**: Respond to traffic incidents affecting fleet

### User Stories

1. **As a Route Planner, I want to see real-time traffic camera feeds so that I can optimize routes and reduce travel time**
   - View map of all traffic cameras in service area
   - See which cameras are operational vs. offline
   - Filter cameras by location or jurisdiction
   - Link camera data to route optimization

2. **As a Dispatch Manager, I want to monitor traffic conditions so that I can make real-time routing decisions**
   - See live traffic camera feeds
   - Know which cameras are operational
   - Get alerts when cameras go offline
   - Quickly view traffic conditions on major routes

3. **As an Operations Manager, I want to track camera health and sync status so that I can maintain network availability**
   - See all data sources and their sync status
   - Know when last sync occurred and if it was successful
   - Trigger manual sync of camera data
   - Monitor total cameras synced per source

4. **As a Regional Coordinator, I want to filter cameras by source so that I can monitor specific jurisdictions or providers**
   - Filter cameras by data source
   - See camera provider information
   - Track cameras by source/provider
   - Monitor sync status by source

### Core Workflows

#### Workflow 1: Camera Network Monitoring
```
1. User opens Traffic Cameras module
2. System loads:
   a) Fetches list of all cameras from all data sources
   b) Fetches list of available data sources
   c) Displays loading spinner until complete
3. Dashboard loads showing:
   a) Stats: Total cameras, operational, offline counts
   b) Map view: Shows camera locations with markers
   c) List view: Shows camera details in sidebar
4. User views cameras:
   - Green icons: Operational cameras
   - Gray icons: Offline cameras
   - Blue highlight: Selected camera
5. User can:
   - Search by camera name, address, cross streets
   - Filter by status (operational/offline)
   - Filter by data source
   - Click camera to view details
   - View live feed (if available)
```

#### Workflow 2: Camera Synchronization
```
1. User views current camera sync status:
   - Sees "Sync Cameras" button in header
2. User clicks "Sync Cameras" button
3. System initiates sync process:
   a) Button shows "Syncing..." with spinner
   b) For each enabled data source:
      - Calls data source API
      - Fetches updated camera list
      - Updates camera operational status
      - Records sync timestamp
   c) Updates totalCamerasSynced count per source
   d) Records lastSyncStatus (success/failed)
4. After ~3 seconds sync completes:
   a) Button returns to normal
   b) Camera list refreshes
   c) Map updates with new positions
   d) Stats update
5. Data Sources section shows:
   - Last sync timestamp
   - Last sync status (success/failed/pending)
   - Total cameras synced
   - Enabled/disabled status
```

#### Workflow 3: Data Source Management
```
1. User navigates to Data Sources section
2. Displays list of all configured data sources showing:
   a) Source name (e.g., "FDOT Traffic Cameras", "City of Tampa")
   b) Description
   c) Number of cameras synced
   d) Last sync timestamp
   e) Last sync status badge (success/failed/pending)
   f) Enabled/disabled status badge
3. For each source:
   - Green badge: Enabled & success
   - Red badge: Failed sync
   - Gray badge: Disabled
4. User can:
   - Enable/disable sources
   - View source details
   - Manually trigger source sync
   - Check sync logs
```

#### Workflow 4: Location-Based Filtering
```
1. User wants to monitor cameras in specific area
2. User enters search term or applies filters:
   a) Search: Camera name, address, cross streets
   b) Status filter: Operational/offline
   c) Source filter: Specific data source
3. System filters cameras in real-time:
   a) Map updates to show only filtered cameras
   b) Camera list updates
   c) Stats update for filtered set
4. Shows count: "Showing X of Y cameras"
5. User can:
   - Click camera to view details
   - View live feed if available
   - Add to route planning
```

### Key Components & Data Model

#### TrafficCamera Data Structure
```typescript
{
  id: string
  sourceId: string (which data source this camera came from)
  externalId: string (ID in source system)
  name: string (camera name)
  address?: string
  crossStreet1?: string
  crossStreet2?: string
  crossStreets?: string (combined format)
  
  cameraUrl?: string (link to camera feed)
  streamUrl?: string (video stream URL)
  imageUrl?: string (snapshot image)
  
  latitude?: number
  longitude?: number
  
  enabled: boolean
  operational: boolean (is it currently online)
  lastCheckedAt?: string (last health check)
  
  metadata?: Record<string, any> (source-specific data)
  syncedAt?: string (when last synced)
  createdAt: string
  updatedAt: string
}
```

#### CameraDataSource Structure
```typescript
{
  id: string
  name: string (e.g., "FDOT Traffic Cameras")
  description?: string
  sourceType: 'arcgis' | 'rest_api' | 'csv' | 'geojson' | 'manual'
  serviceUrl: string (API endpoint)
  enabled: boolean
  syncIntervalMinutes: number (how often to auto-sync)
  
  authentication?: {
    type: 'token' | 'oauth' | 'none'
    token?: string
  }
  
  fieldMapping: Record<string, string> (maps API fields to TrafficCamera fields)
  
  lastSyncAt?: string
  lastSyncStatus?: 'success' | 'failed' | 'pending'
  lastSyncError?: string
  totalCamerasSynced: number
  
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}
```

### UI Components & Features

#### Header Section
- Title: "Traffic Cameras"
- Subtitle: "Real-time traffic camera monitoring across the region"
- Sync Cameras button (with spinner when syncing)

#### Stats Cards (3-column grid)
1. **Total Cameras**: Count of all cameras across all sources
2. **Operational**: Count of online cameras (green)
3. **Offline**: Count of offline cameras (red)

#### Filter Card
- Search input: By name, address, cross streets
- Status filter dropdown: All/Operational/Offline
- Source filter dropdown: All sources/specific sources
- Applies filters in real-time

#### Main Content (2-column layout)

**Left Column (2/3 width)**: Map View
- Displays UniversalMap component
- Shows camera locations as markers
- Color coding: Green (operational), Gray (offline)
- Supports zoom and pan
- Clickable markers to select camera
- Shows map legend below:
  - Operational count
  - Offline count
  - "Showing X of Y cameras" text

**Right Column (1/3 width)**: Camera List
- Scrollable list of filtered cameras
- For each camera:
  - Name (truncated if long)
  - Address with map pin icon
  - Cross streets
  - Status badge (green/red)
- Hover effects: Highlight on hover
- Click to select: Border highlight + background change
- View Feed button: Opens camera stream in new window (if cameraUrl exists)

#### Data Sources Status Card
- Title: "Data Sources"
- For each source:
  - Source name (bold)
  - Description
  - Camera count (small badge)
  - Last sync timestamp
  - Status badge (success/failed/pending colors)
  - Enabled/disabled badge

### Data Inputs & Outputs

#### Inputs
- **API Endpoint**: `/api/traffic-cameras/list`
  - Returns: TrafficCamera[]
  - Response time: ~500-2000ms depending on data source
  
- **API Endpoint**: `/api/traffic-cameras/sources`
  - Returns: CameraDataSource[]
  - Lists all configured data sources
  
- **API Endpoint**: `/api/traffic-cameras/sync` (POST)
  - Triggers manual sync of all enabled sources
  - Returns: { status: 'syncing' }

#### Data Source Integration
- **ArcGIS REST API**: Fetches traffic camera feature layers
- **Custom REST APIs**: Calls configured service URLs
- **CSV/GeoJSON**: Imports static camera definitions
- **Manual Entry**: Admin adds cameras via UI

#### Outputs
- **Camera location data**: Used by route optimization
- **Traffic conditions**: Integrated into dispatch console
- **Availability alerts**: Notify ops when cameras go offline
- **Sync logs**: Audit trail of data source synchronization
- **Usage metrics**: Track which cameras are accessed

### Integration Points

#### 1. Map System (UniversalMap Component)
- Displays camera locations on map
- Supports multiple map providers
- Shows/hides cameras based on filters
- Handles map interactions (zoom, pan, click)

#### 2. Data Source APIs
- **ArcGIS**: RESTful feature service integration
- **Custom APIs**: HTTP/REST endpoints
- **File-based**: CSV/GeoJSON import
- **Manual**: Database entry for ad-hoc cameras

#### 3. API Client
- Uses apiClient.trafficCameras.list()
- Uses apiClient.trafficCameras.sources()
- Uses apiClient.trafficCameras.sync()
- Handles authentication and error handling

#### 4. Database
- Stores camera records and source definitions
- Maintains sync status and history
- Tracks camera metadata

#### 5. Route Optimization System
- Consumes camera data for route planning
- Uses camera locations for traffic-aware routing
- Integrates with dispatch console

#### 6. Notification System
- Alerts on camera offline/online status changes
- Notifies operations of sync failures
- Sends alerts to relevant stakeholders

#### 7. Vehicle Tracking System
- Coordinates with vehicle location data
- Enables correlation of vehicle position with camera coverage
- Supports incident investigation

---

## Cross-Feature Integration Architecture

### Data Flow Diagram

```
Video Events (AI Detection)
        ↓
VideoTelematics ←→ VideoTelematicsDashboard
        ↓
    Event Storage
    ↓ ↓ ↓
    ├→ Driver Coaching
    ├→ Safety Analytics
    └→ Fleet Analytics (Safety metrics)
    
Fleet Operations Data
    ├→ Vehicle Status
    ├→ Fuel Costs
    ├→ Maintenance Costs
    ↓
Fleet Analytics (Utilization & Financial)
    ↓
Performance Insights & Reports

Traffic Data Sources
    ├→ ArcGIS
    ├→ City Traffic APIs
    └→ Regional Data Providers
    ↓
Traffic Cameras
    ↓
Route Optimization ← Uses for better routing
```

### Shared Data Models
- **Vehicle**: Referenced across all features
- **Driver**: Referenced in telematics and analytics
- **Location**: GPS coordinates used in cameras and events
- **Timestamp**: ISO 8601 for all time-series data
- **Tenant**: Multi-tenant isolation across features

---

## Test Scenarios

### Video Telematics Tests

#### Test 1: Event Detection & Review Flow
**Scenario**: New video event detected, manager reviews and coaches driver
1. System detects harsh-braking event from dashcam
2. Event appears in Video Telematics list with "Unreviewed" status
3. Manager searches for events from specific driver
4. Manager clicks "Play" to view 8-second video clip
5. Manager confirms incident severity and clicks "Review"
6. Manager clicks "Assign Coaching" and adds notes
7. Verify coaching status changes to "pending"
8. Driver receives notification

**Expected Results**:
- Event visible in list within 5 seconds of detection
- Video plays successfully (no errors)
- Review status persists after page refresh
- Coaching status transitions correctly
- Notification sent to driver

#### Test 2: Privacy Settings Configuration
**Scenario**: Administrator configures privacy settings for compliance
1. Admin opens Privacy Settings dialog
2. Sets video retention to 60 days
3. Disables audio recording
4. Enables face blurring
5. Restricts driver access
6. Saves settings
7. Verify settings persist after logout/login

**Expected Results**:
- All settings saved correctly
- Setting changes apply to new videos immediately
- Validation prevents invalid configurations (e.g., no roles selected)
- Audit log records all changes

#### Test 3: Event Filtering & Search
**Scenario**: Manager searches for specific events across fleet
1. Manager searches "John Smith" (driver name)
2. Filters by "phone-use" event type
3. Filters by "high" severity
4. Filters to show only "unreviewed" events
5. Verify list shows only matching events

**Expected Results**:
- Search returns relevant driver events
- Multiple filters work together (AND logic)
- Result count updates
- Filters reset cleanly
- Performance acceptable with large datasets (1000+ events)

### Video Telematics Dashboard Tests

#### Test 4: Real-Time Monitoring
**Scenario**: Dashboard shows real-time updates during shift
1. Dashboard loads with event list
2. New critical event detected in backend
3. Event appears in dashboard within 5 seconds
4. Critical count increases
5. Event can be played immediately

**Expected Results**:
- Real-time updates without manual refresh
- Critical events highlighted prominently
- Video accessible immediately upon appearance
- No duplicate events in list

#### Test 5: Camera Health Monitoring
**Scenario**: Operations manager checks camera status
1. Dashboard loads Camera Health tab
2. Shows 45 cameras: 42 online, 3 offline
3. Offline cameras shown with red status
4. Last ping times displayed
5. Click offline camera to see more details

**Expected Results**:
- Accurate camera count
- Status accurately reflects operational state
- Ping times update in real-time
- Offline cameras identifiable at a glance

#### Test 6: Coaching Queue Management
**Scenario**: Safety manager views coaching assignments
1. Opens Coaching Queue tab
2. Shows 12 events requiring coaching
3. Events sorted by severity (critical first)
4. Manager plays video to understand incident
5. Manager schedules coaching session
6. Status updates to reflect scheduling

**Expected Results**:
- Queue shows all unreviewed coaching-required events
- Videos accessible from queue
- Status changes persist
- Completed coaching items removed from queue

### Fleet Analytics Tests

#### Test 7: Utilization Metrics
**Scenario**: Manager analyzes fleet utilization
1. Opens Fleet Analytics
2. Views current utilization: 72%
3. Sees 6-month trend chart showing utilization by month
4. Switches to utilization by vehicle type view
5. Identifies that trucks are underutilized (45%)

**Expected Results**:
- Utilization calculated correctly: (active vehicles / total)
- Charts render with proper data
- Drill-down to vehicle type works
- Data updates when vehicle statuses change

#### Test 8: Cost Analysis
**Scenario**: Finance director analyzes operating costs
1. Opens Financial tab
2. Sees total fuel cost: $48,350
3. Sees total maintenance: $21,200
4. Views monthly cost breakdown chart
5. Notes fuel costs trending up 8.5% vs. last month
6. Notes maintenance down 2.3%

**Expected Results**:
- Cost calculations accurate
- Charts display correct monthly data
- Trend percentages calculated correctly
- Cost distribution pie/bar charts render properly
- Can export financial report

#### Test 9: KPI Dashboard
**Scenario**: Executive reviews fleet KPIs
1. Opens Key Metrics tab
2. Views: Cost/mile, Fuel efficiency, Downtime rate, Utilization
3. Compares against targets (if set)
4. Reads performance insights section
5. Shares KPI card with team

**Expected Results**:
- All KPIs calculated correctly
- Insights relevant and actionable
- Cards display proper formatting
- Export/share functionality works

### Traffic Cameras Tests

#### Test 10: Camera Network Sync
**Scenario**: Operations manager syncs traffic camera network
1. Opens Traffic Cameras module
2. Sees "Sync Cameras" button
3. Clicks to initiate sync
4. Button shows "Syncing..." with spinner
5. Wait 3 seconds for completion
6. List updates with new camera positions
7. Stats show updated counts

**Expected Results**:
- Sync completes successfully within 5 seconds
- All enabled data sources queried
- Camera locations updated
- Sync status reflects "success"
- No duplicate cameras created

#### Test 11: Camera Filtering
**Scenario**: Route planner filters cameras by location
1. Searches "Downtown Tampa"
2. Filters by "Operational" status
3. Filters by "FDOT" data source
4. Map zooms to relevant area
5. Shows 8 operational FDOT cameras downtown

**Expected Results**:
- Search returns relevant cameras
- Multiple filters work together
- Map updates to show filtered cameras
- Sidebar list matches map markers
- Count displays "Showing 8 of 45 cameras"

#### Test 12: Data Source Status
**Scenario**: Operations monitor data source health
1. Scrolls to Data Sources section
2. Sees 3 sources:
   - FDOT: 127 cameras, last sync 2 minutes ago (success)
   - City of Tampa: 45 cameras, last sync failed 1 hour ago
   - Waze: disabled
3. Identifies sync failure
4. Manually triggers sync for failed source

**Expected Results**:
- Source list accurate
- Last sync times update
- Status badges show correct colors
- Failed sync alerts user
- Manual sync retry works

---

## Performance & Scalability Considerations

### Video Telematics
- **Event Storage**: Handle 1000+ events per day per fleet
- **Video Storage**: Efficient retrieval of clips, cleanup of old videos
- **Search Performance**: Index on vehicle number, driver name, timestamp
- **Caching**: Cache privacy settings, event types

### Fleet Analytics
- **Data Aggregation**: Efficient calculation across thousands of vehicles
- **Chart Rendering**: Handle large datasets (36+ months of data)
- **Real-time Updates**: Use SWR hooks for automatic refresh
- **Memory**: Avoid loading all historical data at once

### Traffic Cameras
- **Data Source Sync**: Efficiently sync from multiple sources
- **Map Rendering**: Handle 200+ camera markers
- **Filter Performance**: Client-side filtering for responsiveness
- **Pagination**: Implement for large camera lists

---

## Security & Privacy Considerations

### Video Telematics
- **Video Encryption**: AES-256 encryption for stored and transmitted video
- **Access Control**: Role-based access (admin, manager, driver levels)
- **Audit Logging**: Log all video access and review actions
- **Data Retention**: Automatic deletion per configured policies
- **Face/Plate Blurring**: PII protection in video recordings
- **GDPR Compliance**: Support for driver opt-out and data export

### Fleet Analytics
- **Data Aggregation**: No personal driver data exposed
- **Access Control**: Manager+ only for cost data
- **Audit Trails**: Log all report generation
- **Data Anonymization**: Reports use vehicle numbers, not driver names

### Traffic Cameras
- **Public Data**: Traffic cameras are public data sources
- **API Authentication**: Secure data source credentials
- **Rate Limiting**: Prevent abuse of data source APIs
- **Audit Logging**: Track sync operations

---

## Recommended Improvements & Future Enhancements

### Video Telematics
1. Machine learning model retraining based on coaching feedback
2. Integration with insurance companies for risk assessment
3. Real-time alert system for critical events
4. Video evidence management for litigation
5. Driver behavior scoring based on events
6. Automated coaching course assignment

### Fleet Analytics
1. Predictive maintenance recommendations
2. Fuel consumption forecasting
3. Cost optimization recommendations
4. Benchmark comparison with industry standards
5. Custom metric creation
6. Advanced drill-down capabilities
7. Scheduled report delivery

### Traffic Cameras
1. Incident detection from traffic cameras
2. Integration with vehicle routing decisions
3. Predictive traffic modeling
4. Automated incident response
5. Traffic pattern analytics
6. Multi-source data fusion

---

## Maintenance & Monitoring

### Key Metrics to Monitor
- Video event detection latency
- Video storage cost and usage
- Dashboard query performance
- Camera data sync success rate
- Camera availability and uptime
- User login and session management

### Troubleshooting Common Issues

**No video events appearing:**
1. Check dashcam integration status
2. Verify AI detection service is running
3. Check event storage for errors
4. Review network connectivity

**Dashboard slow to load:**
1. Check data volume (pagination/filtering)
2. Verify API performance
3. Clear browser cache
4. Check network latency

**Sync cameras failing:**
1. Verify data source credentials
2. Check API rate limits
3. Review error logs
4. Test connectivity to data sources

---

## References & Documentation Links

- **API Documentation**: `/api/docs`
- **Database Schema**: `database/schema.sql`
- **Type Definitions**: `/src/lib/types.ts`
- **Component Library**: `/src/components/ui/`
- **Hooks**: `/src/hooks/use-api.ts`, `/src/hooks/use-fleet-data.ts`

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-11  
**Author**: Fleet Application Documentation Team
