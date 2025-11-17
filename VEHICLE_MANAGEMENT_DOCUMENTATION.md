# Vehicle Management Features - Comprehensive Documentation

## Executive Summary

This document provides complete documentation for all Vehicle Management features in the Fleet Management System. These features form the core of fleet operations, providing real-time monitoring, tracking, and management capabilities for all vehicles in the fleet.

---

## Table of Contents

1. [Fleet Dashboard](#1-fleet-dashboard)
2. [Virtual Garage](#2-virtual-garage)
3. [GPS Tracking](#3-gps-tracking)
4. [Vehicle Telemetry](#4-vehicle-telemetry)
5. [Integration Architecture](#integration-architecture)
6. [Test Scenarios](#test-scenarios)

---

## 1. Fleet Dashboard

### Feature Description
The Fleet Dashboard is the central command center for fleet managers, providing comprehensive oversight of all vehicles with advanced filtering, search, and real-time metrics. It offers an interactive map view and detailed vehicle status monitoring.

**File:** `src/components/modules/FleetDashboard.tsx`

### Target Users
- **Fleet Managers** - Monitor overall fleet health and status
- **Operations Directors** - Track fleet utilization and performance metrics
- **Dispatchers** - Identify available vehicles for assignment
- **Maintenance Managers** - Monitor vehicles needing service
- **Regional Supervisors** - Filter and view vehicles by region/department
- **Executives** - Review high-level fleet statistics and trends

### User Stories

**US-VD-001: Monitor Fleet Status**
- **As a** Fleet Manager
- **I want to** view real-time status of all vehicles in my fleet
- **So that** I can quickly identify issues and optimize fleet utilization
- **Acceptance Criteria:**
  - Display total vehicles, active count, fuel levels, and service requirements
  - Color-coded status badges (active, idle, charging, service, emergency)
  - Real-time updates every 30 seconds
  - Status distribution chart showing breakdown by status type

**US-VD-002: Search and Filter Vehicles**
- **As a** Fleet Manager
- **I want to** search and filter vehicles by multiple criteria
- **So that** I can quickly find specific vehicles or vehicle groups
- **Acceptance Criteria:**
  - Text search by vehicle number, make, model
  - Basic filters: vehicle type, region, status
  - Advanced filters: department, fuel level, mileage, year, alerts, driver assignment
  - Active filter badges with one-click removal
  - Filter persistence during session

**US-VD-003: Apply Advanced Filters**
- **As an** Operations Manager
- **I want to** use advanced filtering with multiple criteria
- **So that** I can identify vehicles meeting specific conditions
- **Acceptance Criteria:**
  - 12+ filter criteria available
  - Fuel level range slider (0-100%)
  - Mileage range input (min/max)
  - Year range selection
  - Last maintenance date filters (7, 30, 60, 90 days, overdue)
  - Alert status filtering (has alerts, no alerts, critical only)
  - Driver assignment status (all, assigned, unassigned)

**US-VD-004: View Fleet on Map**
- **As a** Dispatcher
- **I want to** see all vehicles displayed on an interactive map
- **So that** I can understand geographic distribution and proximity
- **Acceptance Criteria:**
  - Interactive map with vehicle markers
  - Map updates with applied filters
  - Vehicle clustering for dense areas
  - Click markers to view vehicle details
  - Real-time location updates

**US-VD-005: Add New Vehicles**
- **As a** Fleet Administrator
- **I want to** add new vehicles to the fleet
- **So that** I can maintain accurate fleet inventory
- **Acceptance Criteria:**
  - Add Vehicle dialog with all required fields
  - VIN validation
  - License plate format validation
  - Immediate display in dashboard after adding
  - Confirmation toast notification

**US-VD-006: Monitor Priority Vehicles**
- **As a** Fleet Supervisor
- **I want to** view priority vehicles (emergency vehicles and vehicles with alerts)
- **So that** I can ensure critical assets receive immediate attention
- **Acceptance Criteria:**
  - Priority vehicles card showing top 5
  - Automatic inclusion of emergency type vehicles
  - Automatic inclusion of vehicles with active alerts
  - Direct link to vehicle details
  - Real-time priority list updates

### Key Workflows

#### Workflow 1: Fleet Status Monitoring
```
1. User opens Fleet Dashboard
   └─> System loads all vehicles from database
2. Dashboard displays 4 metric cards
   ├─> Total Vehicles count
   ├─> Active Vehicles count with trend
   ├─> Average Fuel Level with low fuel warning
   └─> Service Required count with alerts
3. Dashboard shows 3 distribution cards
   ├─> Status Distribution (active, idle, charging, service, emergency)
   ├─> Regional Distribution (grouped by region)
   └─> Priority Vehicles (emergency + alerts)
4. Interactive map displays all vehicle locations
5. Vehicle list shows first 10 vehicles with full details
6. Auto-refresh every 30 seconds
```

#### Workflow 2: Advanced Vehicle Search
```
1. User clicks "Advanced Filters" button
2. System opens Advanced Filters dialog with 12 filter categories:
   ├─> Vehicle Status (checkboxes: active, idle, charging, service, emergency, offline)
   ├─> Department (checkboxes for each department)
   ├─> Region (checkboxes for each region)
   ├─> Fuel Level Range (dual slider: 0-100%)
   ├─> Mileage Range (number inputs: min/max)
   ├─> Alert Status (has alerts, no alerts, critical)
   ├─> Driver Assignment (all, assigned, unassigned)
   ├─> Vehicle Types (sedan, SUV, truck, van, emergency, specialty)
   ├─> Year Range (dropdown: from/to year)
   └─> Last Maintenance (7d, 30d, 60d, 90d, overdue)
3. User selects filter criteria
4. User clicks "Apply Filters"
5. System filters vehicles matching ALL criteria
6. Dashboard updates:
   ├─> Metrics recalculate for filtered set
   ├─> Map shows only filtered vehicles
   ├─> Vehicle list updates
   └─> Active filter badges display
7. User can click X on any badge to remove individual filter
8. User can click "Clear all" to reset all filters
```

#### Workflow 3: Vehicle Details Review
```
1. User views vehicle in list
2. Each vehicle card displays:
   ├─> Status icon (color-coded)
   ├─> Vehicle number (e.g., FL-1001)
   ├─> Make, model, year
   ├─> Region and department
   ├─> Fuel level percentage
   └─> Current status badge
3. User clicks vehicle card
4. System navigates to detailed vehicle view
5. Map marker highlights selected vehicle
```

### Core Functionality

1. **Real-Time Metrics**
   - Total vehicles count
   - Active vehicles percentage
   - Average fuel level with low fuel alerts
   - Service required count with alerts
   - Status distribution (6 status types)
   - Regional distribution
   - Priority vehicles monitoring

2. **Advanced Filtering System**
   - 12 distinct filter categories
   - Multi-select checkboxes
   - Range sliders and inputs
   - Dropdown selections
   - Filter combination (AND logic)
   - Active filter badges
   - One-click filter removal
   - Complete filter reset

3. **Search Functionality**
   - Vehicle number search
   - Make/model search
   - Case-insensitive matching
   - Real-time search results

4. **Interactive Map Integration**
   - UniversalMap component integration
   - Filtered vehicle display
   - Real-time location updates
   - Marker clustering
   - Click-to-view details

5. **Vehicle List Display**
   - Paginated display (10 per page)
   - Color-coded status indicators
   - Fuel level indicators
   - Hover effects
   - Quick status view

### Data Inputs/Outputs

**Input Data Structures:**
```typescript
interface Vehicle {
  id: string
  number: string
  make: string
  model: string
  year: number
  vin: string
  type: "sedan" | "suv" | "truck" | "van" | "emergency" | "specialty"
  status: "active" | "idle" | "charging" | "service" | "emergency" | "offline"
  region: string
  department: string
  fuelLevel: number  // 0-100
  mileage: number
  location: { lat: number; lng: number; address: string }
  alerts: string[]
  assignedDriver?: string
  lastService: string  // ISO date
  nextService: string  // ISO date
}

interface AdvancedFilterCriteria {
  vehicleStatus: string[]
  departments: string[]
  regions: string[]
  fuelLevelRange: [number, number]
  mileageRange: { min: number | null; max: number | null }
  alertStatus: string[]
  driverAssigned: "all" | "assigned" | "unassigned"
  vehicleTypes: string[]
  yearRange: { from: number | null; to: number | null }
  lastMaintenance: "all" | "7days" | "30days" | "60days" | "90days" | "overdue"
}
```

**Output Metrics:**
```typescript
interface FleetMetrics {
  total: number
  active: number
  idle: number
  charging: number
  service: number
  emergency: number
  lowFuel: number
  alerts: number
  avgFuelLevel: number
}
```

### Integration Points

1. **useFleetData Hook** - Real-time fleet data management
2. **UniversalMap Component** - Geographic visualization
3. **AddVehicleDialog** - Vehicle creation workflow
4. **MetricCard Component** - KPI display
5. **Vehicle Database** - Primary data source

---

## 2. Virtual Garage

### Feature Description
The Virtual Garage provides AI-powered vehicle damage reporting and management using TripoSR for 3D damage model generation. It enables photo-based damage assessment, inspection tracking, and virtual vehicle visualization.

**File:** `src/components/modules/VirtualGarage.tsx`

### Target Users
- **Fleet Managers** - Monitor vehicle condition and damage reports
- **Maintenance Technicians** - Review damage details for repair planning
- **Insurance Adjusters** - Assess damage claims with 3D models
- **Drivers** - Report vehicle damage with photo documentation
- **Safety Officers** - Track vehicle damage trends and safety issues
- **Inspectors** - Conduct and document vehicle inspections

### User Stories

**US-VG-001: Report Vehicle Damage**
- **As a** Driver
- **I want to** report vehicle damage with photos
- **So that** maintenance can be scheduled and documented
- **Acceptance Criteria:**
  - Upload multiple damage photos (PNG, JPG, JPEG, WEBP)
  - Select vehicle from dropdown
  - Enter damage description
  - Select severity (minor, moderate, severe)
  - Submit generates 3D model via TripoSR
  - Confirmation notification displayed

**US-VG-002: Generate 3D Damage Models**
- **As a** Fleet Manager
- **I want to** automatically generate 3D models from damage photos
- **So that** I can assess damage remotely and accurately
- **Acceptance Criteria:**
  - TripoSR AI processes uploaded photos
  - Background processing with status tracking
  - Status indicators: pending, processing, completed, failed
  - Model ready notification
  - View 3D model in viewer

**US-VG-003: View Vehicle Inspections**
- **As a** Maintenance Manager
- **I want to** view all inspections for a vehicle
- **So that** I can track inspection history and defects
- **Acceptance Criteria:**
  - Display inspection count for selected vehicle
  - List inspection types (pre-trip, post-trip, safety)
  - Show inspection status (pass, fail, needs repair)
  - Display defects found
  - View inspection photos

**US-VG-004: Switch Between Vehicles**
- **As a** Fleet Supervisor
- **I want to** easily switch between vehicles in the garage
- **So that** I can quickly review multiple vehicles
- **Acceptance Criteria:**
  - Vehicle list sidebar with all fleet vehicles
  - One-click vehicle selection
  - Selected vehicle highlighted
  - Vehicle details update immediately
  - Associated damage reports load automatically

**US-VG-005: View Damage Report History**
- **As an** Insurance Adjuster
- **I want to** view all damage reports for a vehicle
- **So that** I can assess claims and repair history
- **Acceptance Criteria:**
  - Display damage report count
  - List all reports with dates
  - Show severity levels
  - Indicate 3D model status
  - View report photos

**US-VG-006: Monitor 3D Model Generation**
- **As a** Technician
- **I want to** see the status of 3D model generation
- **So that** I know when models are ready for review
- **Acceptance Criteria:**
  - Real-time status updates
  - Processing indicator (spinning icon)
  - Completion indicator (checkmark)
  - Failed status notification
  - Estimated time remaining

### Key Workflows

#### Workflow 1: Damage Reporting with 3D Generation
```
1. Driver clicks "Report Damage" button
2. System opens damage report dialog
3. Driver selects vehicle from dropdown
4. Driver enters damage description
5. Driver selects severity level
6. Driver drags/drops or selects photos
   ├─> Photo preview thumbnails display
   └─> Multiple photos supported
7. Driver clicks "Generate 3D Model"
8. System uploads photos to Azure Blob Storage
9. System calls TripoSR API with first photo
   POST /api/generate
   ├─> file: photo blob
   └─> remove_bg: true
10. TripoSR returns task_id
11. System creates damage report in database:
    ├─> vehicle_id
    ├─> description
    ├─> severity
    ├─> photo URLs
    ├─> triposr_task_id
    └─> triposr_status: "processing"
12. System polls TripoSR every 2 seconds
    GET /api/tasks/{task_id}
13. When status = "succeeded":
    ├─> Update report with model URL
    ├─> Display success notification
    └─> 3D model ready indicator
14. If status = "failed":
    └─> Display error notification
```

#### Workflow 2: Virtual Garage Navigation
```
1. User opens Virtual Garage
2. System loads:
   ├─> All vehicles via /vehicles API
   ├─> All inspections via /inspections API
   └─> All damage reports via /damage-reports API
3. System selects first vehicle automatically
4. Dashboard displays 4 metrics:
   ├─> Total Vehicles
   ├─> Damage Reports (for selected vehicle)
   ├─> Inspections (for selected vehicle)
   └─> 3D Models Ready (completed status)
5. Main viewer displays selected vehicle
6. User switches view mode:
   ├─> "Vehicle" tab - Shows vehicle information
   └─> "Damage" tab - Shows 3D damage model (if available)
7. Vehicle list sidebar shows all vehicles
8. Damage reports section shows reports for selected vehicle
```

#### Workflow 3: Inspection Review
```
1. User selects vehicle from list
2. System filters inspections for vehicle
3. System displays inspection count
4. User reviews inspection details:
   ├─> Inspection date
   ├─> Type (pre-trip, post-trip, safety)
   ├─> Status (pass, fail, needs repair)
   ├─> Photos attached
   ├─> Defects found
   └─> Odometer reading
5. User can drill down to full inspection report
```

### Core Functionality

1. **AI-Powered Damage Reporting**
   - Multi-photo upload via drag-and-drop
   - TripoSR 3D model generation
   - Automatic background removal
   - Status tracking (pending → processing → completed)
   - Polling mechanism for completion

2. **Vehicle Management**
   - Vehicle selection and display
   - Vehicle information cards
   - License plate and color display
   - Department assignment

3. **Inspection Tracking**
   - Pre-trip inspections
   - Post-trip inspections
   - Safety inspections
   - Pass/fail/needs repair status
   - Defect documentation

4. **3D Visualization**
   - Virtual vehicle display
   - 3D damage model viewer
   - Dual view modes (vehicle/damage)
   - Model status indicators

5. **Damage Report Management**
   - Severity classification
   - Photo gallery
   - Report timeline
   - Status badges

### Data Inputs/Outputs

**Input Data Structures:**
```typescript
interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  vin: string
  license_plate: string
  department?: string
  vehicle_type?: string
  color?: string
  status?: string
}

interface DamageReport {
  id: string
  vehicle_id: string
  reported_date: string
  description: string
  severity: "minor" | "moderate" | "severe"
  photos: string[]  // Azure Blob URLs
  triposr_model_url?: string
  triposr_task_id?: string
  triposr_status?: "pending" | "processing" | "completed" | "failed"
  location?: string
  inspection_id?: string
}

interface Inspection {
  id: string
  vehicle_id: string
  inspection_date: string
  inspection_type: "pre_trip" | "post_trip" | "safety"
  status: "pass" | "fail" | "needs_repair"
  photos: string[]
  defects_found?: string
  odometer_reading?: number
}
```

**TripoSR API:**
```typescript
// Generate 3D Model
POST /api/generate
Content-Type: multipart/form-data
Body:
  file: File  // Image file
  remove_bg: boolean

Response:
{
  task_id: string
  status: "processing"
}

// Check Status
GET /api/tasks/{task_id}
Response:
{
  task_id: string
  status: "pending" | "processing" | "succeeded" | "failed"
  model_url?: string  // GLB file URL when succeeded
  error?: string  // Error message if failed
}
```

### Integration Points

1. **useAPI Hook** - Fetch vehicles, inspections, damage reports
2. **Azure Blob Storage** - Photo upload and storage
3. **TripoSR Microservice** - 3D model generation
   - Service URL: `http://triposr-service.fleet-management.svc.cluster.local:8000`
4. **Sonner Toast** - User notifications
5. **React Dropzone** - File upload interface

---

## 3. GPS Tracking

### Feature Description
Live GPS tracking provides real-time fleet location monitoring with interactive map visualization, status filtering, and activity tracking. Enables dispatchers and managers to monitor vehicle locations and movements.

**File:** `src/components/modules/GPSTracking.tsx`

### Target Users
- **Dispatchers** - Monitor vehicle locations for assignment
- **Fleet Managers** - Track fleet geographic distribution
- **Operations Supervisors** - Monitor active vehicles and routes
- **Safety Officers** - Track emergency vehicles
- **Customer Service** - Provide ETA updates
- **Regional Managers** - Monitor vehicles in specific areas

### User Stories

**US-GPS-001: View Fleet Location Map**
- **As a** Dispatcher
- **I want to** see all vehicle locations on a map
- **So that** I can assign nearby vehicles to new jobs
- **Acceptance Criteria:**
  - Map displays all vehicles with markers
  - Marker color indicates vehicle status
  - Real-time location updates
  - Zoom and pan controls
  - Map height: 600px for optimal viewing

**US-GPS-002: Filter by Vehicle Status**
- **As a** Fleet Manager
- **I want to** filter vehicles by status
- **So that** I can focus on specific vehicle groups
- **Acceptance Criteria:**
  - Status filter dropdown with options:
    - All Vehicles
    - Active Only
    - Idle Only
    - Emergency
  - Map updates to show only filtered vehicles
  - Vehicle list updates simultaneously
  - Filter selection persists during session

**US-GPS-003: View Vehicle Activity**
- **As an** Operations Supervisor
- **I want to** see recent vehicle activity
- **So that** I can monitor fleet movements
- **Acceptance Criteria:**
  - Display 5 most recent active vehicles
  - Show current address
  - Display GPS coordinates (lat/lng to 4 decimals)
  - Status badge with color coding
  - Real-time activity updates

**US-GPS-004: Monitor Status Distribution**
- **As a** Fleet Manager
- **I want to** see count of vehicles by status
- **So that** I can understand fleet utilization
- **Acceptance Criteria:**
  - Status legend with counts:
    - Active (green)
    - Idle (gray)
    - Emergency (red)
  - Live count updates
  - Visual indicators (colored dots)

**US-GPS-005: Access Vehicle Details**
- **As a** Dispatcher
- **I want to** click on a vehicle to see details
- **So that** I can get complete vehicle information
- **Acceptance Criteria:**
  - Click vehicle in list or map marker
  - Display vehicle number
  - Show current address
  - Display status
  - Show precise coordinates

### Key Workflows

#### Workflow 1: Live Fleet Monitoring
```
1. User opens GPS Tracking dashboard
2. System loads all vehicles with GPS data
3. Map initializes centered on fleet center point
4. Vehicle markers display on map:
   ├─> Green markers = Active vehicles
   ├─> Gray markers = Idle vehicles
   ├─> Blue markers = Charging vehicles
   ├─> Yellow markers = Service vehicles
   └─> Red markers = Emergency vehicles
5. Vehicle list displays on right sidebar (top 20)
6. Status distribution shows counts
7. Recent activity shows last 5 vehicle movements
8. System auto-refreshes every 10 seconds
```

#### Workflow 2: Status-Based Filtering
```
1. User selects status filter dropdown
2. User selects "Active Only"
3. System filters vehicles array:
   vehicles.filter(v => v.status === "active")
4. Map updates:
   ├─> Remove non-active markers
   └─> Keep only green (active) markers
5. Vehicle list updates to show only active vehicles
6. Status legend updates counts
7. Recent activity filters to active only
```

#### Workflow 3: Vehicle Location Review
```
1. User views vehicle in sidebar list
2. Vehicle card displays:
   ├─> Status icon (color-coded)
   ├─> Vehicle number
   ├─> Current address (first part)
   └─> Status badge
3. User clicks vehicle card
4. Map centers on vehicle location
5. Marker highlights/pulses
6. Recent Activity section shows:
   ├─> Full address
   ├─> Precise coordinates
   └─> Current status
```

### Core Functionality

1. **Interactive Map**
   - UniversalMap integration
   - Real-time vehicle markers
   - Status-based marker colors
   - Zoom and pan controls
   - Auto-center on fleet

2. **Status Filtering**
   - All Vehicles view
   - Active vehicles only
   - Idle vehicles only
   - Emergency vehicles only
   - Real-time filter updates

3. **Vehicle List**
   - Scrollable sidebar (max-height: 500px)
   - Top 20 vehicles displayed
   - Status icons
   - Click-to-view details
   - Hover effects

4. **Activity Tracking**
   - Recent activity display (5 vehicles)
   - Address display
   - GPS coordinates (4 decimal precision)
   - Status badges
   - Real-time updates

5. **Status Legend**
   - Visual status indicators
   - Vehicle counts by status
   - Color-coded dots
   - Live count updates

### Data Inputs/Outputs

**Input Data:**
```typescript
interface Vehicle {
  id: string
  number: string  // e.g., "FL-1001"
  make: string
  model: string
  year: number
  type: string
  status: "active" | "idle" | "charging" | "service" | "emergency" | "offline"
  location: {
    lat: number
    lng: number
    address: string
  }
  region: string
  department: string
  fuelLevel: number
}

interface GISFacility {
  id: string
  name: string
  type: string
  location: { lat: number; lng: number }
}
```

**Props:**
```typescript
interface GPSTrackingProps {
  vehicles: Vehicle[]
  facilities: GISFacility[]
}
```

### Integration Points

1. **UniversalMap Component** - Map rendering and vehicle markers
2. **Vehicle Location API** - Real-time GPS coordinates
3. **Status Management System** - Vehicle status updates
4. **Geocoding Service** - Address resolution

---

## 4. Vehicle Telemetry

### Feature Description
Vehicle Telemetry provides real-time data from OBD-II devices and Smartcar API integration, displaying live vehicle diagnostics, DTC codes, remote control capabilities, and comprehensive vehicle health monitoring.

**File:** `src/components/modules/VehicleTelemetry.tsx`

### Target Users
- **Fleet Managers** - Monitor vehicle health across fleet
- **Maintenance Technicians** - Review diagnostic codes and sensor data
- **Operations Managers** - Track vehicle performance metrics
- **Drivers** - View vehicle health and diagnostics
- **Compliance Officers** - Review emission-related codes
- **Telematics Analysts** - Analyze vehicle data trends

### User Stories

**US-VT-001: Monitor Live Vehicle Data**
- **As a** Fleet Manager
- **I want to** view real-time telemetry from all vehicles
- **So that** I can monitor fleet health and performance
- **Acceptance Criteria:**
  - Display 4 dashboard metrics (total, connected, DTCs, Smartcar)
  - Show odometer, speed, RPM, fuel/SOC for each vehicle
  - Update data in real-time
  - Color-coded connection status
  - Data source badge (OBD-II, Smartcar, Integrated)

**US-VT-002: Review Diagnostic Trouble Codes**
- **As a** Maintenance Technician
- **I want to** view and manage DTC codes
- **So that** I can diagnose and resolve vehicle issues
- **Acceptance Criteria:**
  - Display all active DTC codes
  - Show code number (e.g., P0128)
  - Display code description
  - Severity indicator (info, warning, critical)
  - Timestamp of code generation
  - Ability to clear codes
  - Cleared status tracking

**US-VT-003: Remote Vehicle Control**
- **As a** Fleet Manager
- **I want to** remotely control Smartcar-enabled vehicles
- **So that** I can lock/unlock doors and control charging
- **Acceptance Criteria:**
  - Lock doors remotely
  - Unlock doors remotely
  - Start EV charging
  - Stop EV charging
  - Command confirmation notifications
  - Capability detection (only show available commands)
  - Consent status verification

**US-VT-004: Filter by Data Source**
- **As a** Telematics Analyst
- **I want to** filter vehicles by telemetry data source
- **So that** I can analyze different integration methods
- **Acceptance Criteria:**
  - Filter options: All Sources, OBD-II Only, Smartcar Only, Integrated
  - Table updates with filtered vehicles
  - Metrics recalculate for filtered set
  - Map updates to show filtered vehicles

**US-VT-005: View Detailed Vehicle Telemetry**
- **As a** Technician
- **I want to** view detailed telemetry for a specific vehicle
- **So that** I can diagnose performance issues
- **Acceptance Criteria:**
  - Speed and RPM display
  - Engine temperature
  - Coolant temperature
  - Tire pressure (all 4 tires)
  - Battery voltage
  - Oil pressure
  - DTC codes with descriptions
  - Smartcar capabilities (if applicable)

**US-VT-006: Track Connection Status**
- **As an** Operations Manager
- **I want to** see which vehicles are connected to telemetry
- **So that** I can ensure data collection is working
- **Acceptance Criteria:**
  - Connected/Disconnected status badge
  - Filter by connection status
  - Last update timestamp
  - Connection status in dashboard metrics
  - Visual indicators (green = connected, gray = offline)

**US-VT-007: Manage Smartcar Consent**
- **As a** Fleet Administrator
- **I want to** track Smartcar consent status
- **So that** I can ensure proper authorization
- **Acceptance Criteria:**
  - Display consent granted status
  - Show consent granted date
  - Show expiration date
  - List authorized scopes
  - Consent renewal reminders

### Key Workflows

#### Workflow 1: Telemetry Dashboard Monitoring
```
1. User opens Vehicle Telemetry page
2. System loads vehicles with telemetry data
3. Dashboard displays 4 metrics:
   ├─> Total Vehicles (all monitored vehicles)
   ├─> Connected (vehicles with live data) - Green
   ├─> Active DTCs (total diagnostic codes) - Orange
   └─> Smartcar Enabled (vehicles with remote control) - Purple
4. Search and filter controls display
5. Interactive map shows all vehicle locations
6. Table displays vehicles with:
   ├─> Vehicle info (number, make, model, year)
   ├─> Data source badge (OBD-II/Smartcar/Integrated)
   ├─> Connection status
   ├─> Odometer reading
   ├─> Fuel/State of Charge
   ├─> DTC count
   └─> Action buttons (Details, Refresh)
7. Auto-refresh every 30 seconds
```

#### Workflow 2: DTC Code Management
```
1. Technician clicks "Details" for vehicle with DTCs
2. System opens telemetry details dialog
3. DTC Codes section displays:
   ├─> Code number (e.g., P0128)
   ├─> Severity badge (info/warning/critical)
   ├─> Full description
   ├─> Timestamp
   └─> "Clear" button (if not already cleared)
4. Technician reviews code description
5. Technician clicks "Clear" button
6. System updates DTC:
   ├─> Sets cleared: true
   ├─> Adds "Cleared" badge
   └─> Disables "Clear" button
7. Success toast notification
8. DTC count decrements in table
```

#### Workflow 3: Smartcar Remote Control
```
1. User selects vehicle with Smartcar integration
2. User clicks "Details" button
3. Details dialog opens showing:
   ├─> Live telemetry metrics
   ├─> Diagnostic codes (if any)
   └─> Smartcar Remote Control section
4. Remote Control section displays capability buttons:
   ├─> Lock Doors (if canLock = true)
   ├─> Unlock Doors (if canUnlock = true)
   ├─> Start Charge (if canStartCharge = true)
   └─> Stop Charge (if canStopCharge = true)
5. User clicks "Lock Doors"
6. System sends command to Smartcar API
7. Info toast: "Sending lock command to vehicle..."
8. 1.5 second processing delay
9. Success toast: "Command executed successfully"
10. Vehicle state updates (if applicable)
```

#### Workflow 4: Data Source Filtering
```
1. User selects "Data Source" filter
2. Options displayed:
   ├─> All Sources
   ├─> OBD-II Only
   ├─> Smartcar Only
   └─> Integrated
3. User selects "Smartcar Only"
4. System filters vehicles:
   vehicles.filter(v => v.dataSource === "smartcar")
5. Table updates to show only Smartcar vehicles
6. Metrics recalculate:
   ├─> Total updates to filtered count
   ├─> Connected updates
   ├─> DTCs recalculate
   └─> Smartcar Enabled shows filtered count
7. Map updates to show only Smartcar vehicles
```

#### Workflow 5: Detailed Telemetry Review
```
1. User clicks "Details" for any vehicle
2. Dialog opens with 3 metric cards:
   ├─> Speed & RPM
   │   ├─> Current speed (mph)
   │   └─> Engine RPM
   ├─> Temperature
   │   ├─> Engine temp (°F)
   │   └─> Coolant temp (°F)
   └─> Tire Pressure
       ├─> FL: X psi
       ├─> FR: X psi
       ├─> RL: X psi
       └─> RR: X psi
3. If DTCs present, section displays below
4. If Smartcar enabled, remote controls display
5. User reviews all telemetry data
6. User can refresh data or execute commands
```

### Core Functionality

1. **Multi-Source Telemetry**
   - OBD-II device integration
   - Smartcar API integration
   - Integrated (both sources)
   - Data source identification

2. **Live Data Display**
   - Odometer (miles)
   - Speed (mph)
   - RPM
   - Fuel level (%) / State of Charge (% for EVs)
   - Battery voltage
   - Engine temperature (°F)
   - Coolant temperature (°F)
   - Oil pressure (psi)
   - Tire pressure (4 tires, psi)
   - Range (miles)
   - GPS location

3. **Diagnostic Codes (DTC)**
   - Code number display
   - Description lookup
   - Severity classification (info, warning, critical)
   - Timestamp tracking
   - Clear functionality
   - Cleared status tracking
   - Active code count

4. **Smartcar Integration**
   - Capability detection
   - Lock/Unlock doors
   - Start/Stop charging
   - Location tracking
   - Odometer reading
   - Battery/charge status
   - Consent management
   - Scope verification

5. **Filtering & Search**
   - Text search (vehicle number, make, model, VIN)
   - Data source filter
   - Connection status filter
   - Real-time filter updates

6. **Dashboard Metrics**
   - Total vehicles monitored
   - Connected vehicles count
   - Active DTC count
   - Smartcar-enabled count
   - Color-coded indicators

### Data Inputs/Outputs

**Data Structures:**
```typescript
interface VehicleTelemetry {
  id: string
  tenantId: string
  vehicleId: string
  vehicleNumber: string
  make: string
  model: string
  year: number
  vin: string
  dataSource: "obd-ii" | "smartcar" | "integrated"
  connected: boolean
  lastUpdate: string  // ISO timestamp

  liveData: {
    odometer: number  // miles
    speed: number  // mph
    rpm: number
    fuelLevel: number  // %
    batteryVoltage: number
    engineTemp: number  // °F
    coolantTemp: number  // °F
    oilPressure: number  // psi
    tirePressure: {
      fl: number  // front left psi
      fr: number  // front right psi
      rl: number  // rear left psi
      rr: number  // rear right psi
    }
    stateOfCharge?: number  // % for EVs
    range?: number  // miles
    location?: {
      lat: number
      lng: number
    }
  }

  dtcCodes: Array<{
    code: string  // e.g., "P0128"
    description: string
    severity: "info" | "warning" | "critical"
    timestamp: string  // ISO
    cleared: boolean
  }>

  smartcarCapabilities?: {
    canLock: boolean
    canUnlock: boolean
    canStartCharge: boolean
    canStopCharge: boolean
    canGetLocation: boolean
    canGetOdometer: boolean
    canGetBattery: boolean
  }

  consentStatus: {
    granted: boolean
    grantedAt?: string  // ISO
    expiresAt?: string  // ISO
    scopes: string[]  // e.g., ["read_vehicle_info", "control_charge"]
  }
}
```

**API Endpoints:**
```
GET /vehicles - Fetch all vehicles
GET /api/telemetry/vehicles - Fetch telemetry data
POST /api/smartcar/lock - Lock vehicle doors
POST /api/smartcar/unlock - Unlock vehicle doors
POST /api/smartcar/charge/start - Start charging
POST /api/smartcar/charge/stop - Stop charging
PUT /api/telemetry/dtc/{id}/clear - Clear DTC code
```

### Integration Points

1. **OBD-II Devices** - Hardware integration for diagnostic data
2. **Smartcar API** - Cloud-based vehicle control
3. **useAPI Hook** - Data fetching and caching
4. **UniversalMap** - Vehicle location visualization
5. **useFleetData** - Fleet data management
6. **Sonner Toast** - User notifications

---

## Integration Architecture

### System Integration Map

```
┌─────────────────────────────────────────────────────────────┐
│                    Vehicle Management System                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │    Fleet     │    │   Virtual    │    │     GPS      │  │
│  │  Dashboard   │    │   Garage     │    │   Tracking   │  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘  │
│         │                   │                    │           │
│         └───────────┬───────┴────────────────────┘           │
│                     │                                         │
│             ┌───────▼────────┐                               │
│             │    Vehicle     │                               │
│             │   Telemetry    │                               │
│             └───────┬────────┘                               │
└─────────────────────┼──────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
   ┌────▼────┐  ┌────▼────┐  ┌────▼────┐
   │ Vehicle │  │  Fleet  │  │   Map   │
   │   DB    │  │  Data   │  │ Service │
   └─────────┘  └─────────┘  └─────────┘
        │             │             │
   ┌────▼────┐  ┌────▼────┐  ┌────▼────┐
   │ TripoSR │  │ Smartcar│  │ OBD-II  │
   │   API   │  │   API   │  │ Devices │
   └─────────┘  └─────────┘  └─────────┘
```

### Data Flow

1. **Fleet Dashboard → Vehicle DB**
   - Real-time vehicle status queries
   - Metrics aggregation
   - Filter operations

2. **Virtual Garage → TripoSR API**
   - Photo upload for 3D model generation
   - Status polling
   - Model retrieval

3. **GPS Tracking → Map Service**
   - Real-time location updates
   - Marker rendering
   - Geocoding requests

4. **Vehicle Telemetry → OBD-II Devices**
   - Live diagnostic data stream
   - DTC code retrieval
   - Sensor readings

5. **Vehicle Telemetry → Smartcar API**
   - Remote commands (lock/unlock/charge)
   - Vehicle state queries
   - Consent management

---

## Test Scenarios

### Fleet Dashboard Tests

**Test 1: Dashboard Load and Metrics**
- **Given:** User has access to Fleet Dashboard
- **When:** User navigates to dashboard
- **Then:**
  - 4 metric cards display
  - All vehicle counts are accurate
  - Average fuel level calculates correctly
  - Map loads with all vehicles

**Test 2: Advanced Filtering**
- **Given:** User opens advanced filters
- **When:** User selects multiple filter criteria
- **Then:**
  - Vehicles filter using AND logic
  - Active filter badges display
  - Metrics recalculate
  - Map updates with filtered vehicles

**Test 3: Search Functionality**
- **Given:** User is on dashboard
- **When:** User types vehicle number in search
- **Then:**
  - Vehicle list filters in real-time
  - Matching vehicles highlight
  - No results message if no matches

**Test 4: Priority Vehicle Detection**
- **Given:** Fleet has emergency vehicles and vehicles with alerts
- **When:** Dashboard loads
- **Then:**
  - Priority Vehicles card shows top 5
  - Emergency vehicles included
  - Vehicles with alerts included
  - Correct status colors display

**Test 5: Filter Badge Removal**
- **Given:** User has active filters
- **When:** User clicks X on filter badge
- **Then:**
  - Specific filter removes
  - Other filters remain active
  - Vehicle list updates
  - Map updates

### Virtual Garage Tests

**Test 6: Damage Report Submission**
- **Given:** User has photos of vehicle damage
- **When:** User submits damage report
- **Then:**
  - Photos upload to Azure Blob
  - TripoSR API called
  - Task ID returned
  - Status set to "processing"
  - Success notification displays

**Test 7: 3D Model Generation**
- **Given:** Damage report submitted
- **When:** TripoSR processing completes
- **Then:**
  - Status updates to "completed"
  - Model URL saved
  - Success notification displays
  - 3D icon appears on report

**Test 8: Vehicle Selection**
- **Given:** Multiple vehicles in garage
- **When:** User clicks vehicle in list
- **Then:**
  - Vehicle details update
  - Damage reports filter to vehicle
  - Inspections filter to vehicle
  - Highlight appears on selected vehicle

**Test 9: Inspection Display**
- **Given:** Vehicle has multiple inspections
- **When:** User views vehicle
- **Then:**
  - Inspection count displays correctly
  - All inspections list
  - Status badges show correct colors
  - Defects display

### GPS Tracking Tests

**Test 10: Map Display**
- **Given:** Fleet has vehicles with GPS data
- **When:** User opens GPS Tracking
- **Then:**
  - Map centers on fleet
  - All vehicle markers display
  - Marker colors match status
  - Legend shows correct counts

**Test 11: Status Filter**
- **Given:** User is viewing all vehicles
- **When:** User selects "Active Only" filter
- **Then:**
  - Map shows only active vehicles
  - Vehicle list filters
  - Legend updates counts
  - Recent activity filters

**Test 12: Recent Activity**
- **Given:** Vehicles are moving
- **When:** Location updates received
- **Then:**
  - Recent activity updates
  - Top 5 most recent show
  - Addresses display
  - Coordinates format correctly (4 decimals)

### Vehicle Telemetry Tests

**Test 13: Telemetry Data Display**
- **Given:** Vehicles with OBD-II devices
- **When:** User opens telemetry page
- **Then:**
  - All connected vehicles display
  - Live data shows correctly
  - Data source badges accurate
  - Metrics calculate correctly

**Test 14: DTC Code Management**
- **Given:** Vehicle has active DTC codes
- **When:** Technician views details
- **Then:**
  - All DTCs list
  - Severity colors correct
  - Descriptions display
  - Clear button available

**Test 15: DTC Code Clearing**
- **Given:** Active DTC code exists
- **When:** User clicks "Clear"
- **Then:**
  - Code marked as cleared
  - "Cleared" badge displays
  - Clear button disables
  - DTC count decrements

**Test 16: Smartcar Remote Control**
- **Given:** Vehicle has Smartcar integration
- **When:** User sends lock command
- **Then:**
  - Info toast displays
  - Command sent to Smartcar API
  - Success toast after 1.5 seconds
  - Command confirmation received

**Test 17: Connection Status Tracking**
- **Given:** Mixed connected/disconnected vehicles
- **When:** User views telemetry table
- **Then:**
  - Connected badge shows green
  - Disconnected badge shows gray
  - Last update timestamp displays
  - Connection filter works

**Test 18: Data Source Filtering**
- **Given:** Vehicles from multiple sources
- **When:** User filters by "Smartcar Only"
- **Then:**
  - Only Smartcar vehicles display
  - Metrics recalculate
  - Table updates
  - Map filters

**Test 19: Detailed Telemetry View**
- **Given:** User selects vehicle
- **When:** User clicks "Details"
- **Then:**
  - Dialog opens
  - 3 metric cards display
  - Tire pressure shows all 4 tires
  - Temperature data displays
  - Speed and RPM show

**Test 20: Consent Status Display**
- **Given:** Smartcar vehicle with consent
- **When:** User views vehicle details
- **Then:**
  - Consent status displays
  - Granted date shows
  - Expiration date shows
  - Scopes list displays

---

## Summary

The Vehicle Management System provides comprehensive fleet monitoring, damage reporting with AI-powered 3D generation, real-time GPS tracking, and live telemetry from multiple data sources. With 20+ user stories, 15+ workflows, and 20 test scenarios, the system serves Fleet Managers, Technicians, Dispatchers, and Operations staff with powerful tools for efficient fleet management.

**Total Features:** 4
**Total User Stories:** 20+
**Total Workflows:** 15+
**Total Test Scenarios:** 20
**Integration Points:** 10+
**API Endpoints:** 15+

---

**Document Version:** 1.0
**Last Updated:** 2025-11-11
**Status:** Complete
