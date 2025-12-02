# Fleet Management - Routes & Navigation Features Documentation

**Comprehensive Guide to Route Optimization, Navigation, and GIS Integration**

---

## Table of Contents
1. [RouteOptimizer Component](#routeoptimizer-component)
2. [RouteManagement Component](#routemanagement-component)
3. [AdvancedRouteOptimization Component](#advancedrouteoptimization-component)
4. [GISCommandCenter Component](#giscommandcenter-component)
5. [ArcGISIntegration Component](#arcgisintegration-component)
6. [GeofenceManagement Component](#geofencemanagement-component)
7. [EnhancedMapLayers Component](#enhancedmaplayers-component)
8. [MapSettings Component](#mapsettings-component)
9. [UniversalMap Component](#universalmap-component)
10. [GoogleMap Component](#googlemap-component)

---

## ROUTEOPTIMIZER COMPONENT

**File:** `/src/components/RouteOptimizer.tsx`

### Feature Description
The Route Optimizer is an AI-driven route optimization interface that helps fleet managers create optimal delivery routes by analyzing stops, considering traffic conditions, vehicle capacity, and time windows. It provides visual map representation of routes with detailed stop-by-stop information.

### Target Users
- **Fleet Managers:** Plan daily/weekly delivery routes
- **Dispatchers:** Optimize routes before assigning to drivers
- **Operations Teams:** Monitor route efficiency and costs
- **Route Planners:** Design complex multi-stop routes

### User Stories

```
1. As a fleet manager, I want to add delivery stops and automatically optimize 
   routes so that I can minimize fuel costs and delivery time

2. As a dispatcher, I want to import stops from CSV files so that I can quickly 
   set up routes for large delivery batches

3. As an operations manager, I want to see estimated savings from optimized routes 
   so that I can justify investment in route optimization technology

4. As a driver coordinator, I want to assign specific vehicles to optimization jobs 
   so that constraints and vehicle capabilities are respected

5. As a route analyst, I want to compare different optimization goals 
   (minimize time/distance/cost/balanced) so that I can choose the best strategy 
   for different scenarios
```

### Core Functionality & Features

**Input Management:**
- Manual stop addition with name, address, service time, priority, and weight
- Automatic geocoding of addresses using Mapbox API
- CSV import for bulk stop data
- Stop removal and editing
- Service time specification per stop

**Optimization Parameters:**
- **Optimization Goals:** Minimize Time, Distance, Cost, or Balanced approach
- **Constraints Consideration:** 
  - Real-time traffic data
  - Time windows (if available)
  - Vehicle capacity utilization
- **Vehicle Selection:** Manual or automatic vehicle assignment
- **Route Limits:** Max 50 stops per route (configurable)

**Output Display:**
- Summary metrics (Total Distance, Time, Cost, Savings)
- Individual route cards with:
  - Route number and assigned vehicle/driver
  - Sequential stop list with addresses
  - Service time requirements
  - Capacity utilization percentage
  - Cost breakdowns
- Interactive map visualization with markers for all stops
- Optimization score and solver metrics

### Data Inputs & Outputs

**Input Data Structure:**
```typescript
interface Stop {
  name: string
  address: string
  latitude: number
  longitude: number
  serviceMinutes: number
  weight?: number
  priority: number
}

interface OptimizationRequest {
  jobName: string
  stops: Stop[]
  vehicleIds?: number[]
  goal: 'minimize_time' | 'minimize_distance' | 'minimize_cost' | 'balance'
  considerTraffic: boolean
  considerTimeWindows: boolean
  considerCapacity: boolean
  maxStopsPerRoute: number
}
```

**Output Data Structure:**
```typescript
interface OptimizationResult {
  jobId: number
  routes: OptimizedRoute[]
  totalDistance: number // miles
  totalDuration: number // minutes
  totalCost: number
  estimatedSavings: number
  optimizationScore: number
  solverTime: number
}

interface OptimizedRoute {
  routeNumber: number
  vehicle: { id: number; name: string }
  driver: { id: number; name: string }
  stops: Stop[]
  totalDistance: number
  totalDuration: number
  totalCost: number
  capacityUtilization: number
  geometry?: any
}
```

### API Integration Points

**Endpoints Used:**
- `GET /api/vehicles` - Fetch available vehicles for assignment
- `POST /api/route-optimization/optimize` - Perform route optimization
- `Mapbox Geocoding API` - Convert addresses to coordinates

**Map Integration:**
- Uses MapboxMap component for visualization
- Center map on first stop location
- Renders all stops as markers with route numbers

### Key Workflows

**Workflow 1: Basic Route Optimization**
1. User navigates to Route Optimizer
2. Enters job name (e.g., "Daily Deliveries - Nov 10")
3. Selects optimization goal (balance cost/time/distance)
4. Adds stops manually or imports from CSV
5. System auto-geocodes addresses
6. User reviews vehicle selection (auto or manual)
7. Clicks "Optimize Routes" button
8. System processes optimization request
9. Results display with summary metrics and route details
10. User can view routes on interactive map
11. Routes ready for driver assignment

**Workflow 2: Bulk Import & Quick Optimization**
1. User has CSV file with stops (name, address, lat, lng, service mins)
2. Clicks "Import Stops (CSV)"
3. Selects CSV file from computer
4. System parses CSV and populates stops list
5. User verifies imported data
6. Selects vehicles to use
7. Chooses optimization goal
8. Triggers optimization
9. Reviews results
10. Exports or approves routes for dispatch

**Workflow 3: Fine-tune Optimization**
1. User reviews initial optimization results
2. Identifies suboptimal routing
3. Manually adjusts stops or constraints
4. Changes optimization goal
5. Re-runs optimization with new parameters
6. Compares results
7. Selects best outcome

### Test Scenarios

**Scenario 1: Basic Optimization Success**
- **Setup:** 5 stops in Boston area, balanced optimization goal
- **Expected:** Routes created with reasonable cost/time trade-off
- **Verify:** Total distance is reasonable, stops are sequenced logically, capacity utilization shown

**Scenario 2: CSV Import**
- **Setup:** CSV file with 20 stops
- **Expected:** All stops imported correctly with coordinates
- **Verify:** Stop count matches, all coordinates valid, addresses geocoded

**Scenario 3: Time Window Constraints**
- **Setup:** Stops with early/late arrival times
- **Expected:** Routes respect time windows
- **Verify:** No stops assigned outside their time window

**Scenario 4: Vehicle Capacity**
- **Setup:** Stops with varying weights, capacity limits set
- **Expected:** Routes respect vehicle weight limits
- **Verify:** No route exceeds vehicle capacity

**Scenario 5: Comparison of Optimization Goals**
- **Setup:** Same stops, run optimization with all 4 goals
- **Expected:** Different routing based on goal
- **Verify:** Time-optimized uses fewer hours, distance-optimized uses fewer miles, cost-optimized is cheapest

**Scenario 6: Error Handling**
- **Test:** Missing required fields
- **Expected:** Validation error shown
- **Verify:** User cannot optimize without job name or minimum 2 stops

---

## ROUTEMANAGEMENT COMPONENT

**File:** `/src/components/modules/RouteManagement.tsx`

### Feature Description
Route Management provides a centralized interface for creating, tracking, and managing delivery routes throughout their lifecycle. It allows dispatchers to create routes, assign vehicles and drivers, track route status, and monitor efficiency metrics.

### Target Users
- **Dispatchers:** Create and assign routes to drivers
- **Route Coordinators:** Monitor route progress and status
- **Fleet Managers:** Track overall route efficiency and performance
- **Drivers:** View assigned routes and update status (via mobile/app)

### User Stories

```
1. As a dispatcher, I want to create new routes by selecting a vehicle, driver, 
   and locations so that I can organize daily deliveries

2. As a route coordinator, I want to see active, planned, and completed routes 
   in separate tabs so that I can monitor operations at different stages

3. As a fleet manager, I want to track route efficiency percentage 
   so that I can identify improvements

4. As a driver, I want to see my assigned route with start/end locations 
   so that I know where I'm going and can mark it as complete

5. As a dispatcher, I want to transition routes from planned → active → completed 
   so that I can track progress through the day
```

### Core Functionality & Features

**Route Creation Dialog:**
- Route name input
- Vehicle selection dropdown (populated from fleet)
- Driver selection dropdown
- Start location input
- End location input
- Scheduled start time picker
- Automatic calculation of distance and estimated time

**Route Metrics Display:**
- Active routes count
- Completed today count
- Total distance across all routes
- Average efficiency percentage

**Route Status Management:**
- Status indicators: Planned, Active, Completed, Cancelled
- Color-coded badges for quick visual identification
- One-click status transitions (Planned → Active → Completed)

**Route Listing:**
- Tabbed interface (Active, Planned, Completed, All Routes)
- Route details per card:
  - Route name and status badge
  - Vehicle number and driver name
  - Distance and estimated time
  - Start → End locations
  - Efficiency percentage
  - Action buttons for status changes

**Map Visualization:**
- Integrates UniversalMap for geographic display
- Shows vehicle locations and facilities
- Routes displayed visually
- Center on fleet region

### Data Inputs & Outputs

**Input Data Structure:**
```typescript
interface Route {
  id: string
  name: string
  vehicleId: string
  vehicleNumber: string
  driver: string
  startLocation: string
  endLocation: string
  waypoints: string[]
  distance: number
  estimatedTime: number // minutes
  status: "planned" | "active" | "completed" | "cancelled"
  scheduledStart: string
  scheduledEnd: string
  actualStart?: string
  actualEnd?: string
  efficiency: number // percentage
}

interface CreateRouteRequest {
  routeName: string
  selectedVehicle: string
  driver: string
  startLocation: string
  endLocation: string
  scheduledStart: string
}
```

**Output Data:**
- Created route object with auto-calculated distance and time
- Updated route list for selected tab
- Toast notifications for user feedback

### API Integration Points

**Hooks Used:**
- `useFleetData()` - Gets vehicles and facilities for dropdowns
- Local state management with React hooks

**Data Sources:**
- Vehicles list (for selection)
- Drivers list (for selection)
- Facilities (for map visualization)

### Key Workflows

**Workflow 1: Create and Start a New Route**
1. User clicks "Create Route" button
2. Dialog opens with form fields
3. User enters route name (e.g., "Downtown Delivery Route")
4. Selects vehicle from dropdown (auto-filters available vehicles)
5. Selects driver from dropdown
6. Enters start location
7. Enters end location
8. Selects scheduled start time
9. System auto-calculates distance and estimated time
10. User clicks "Create Route"
11. Route created with "planned" status
12. Dialog closes, new route appears in "Planned" tab
13. User can later click "Start Route" to transition to "active"

**Workflow 2: Monitor Route Progress**
1. User opens Route Management
2. Metrics cards show: 3 Active, 12 Completed Today, 156 mi total, 92% avg efficiency
3. User clicks "Active" tab
4. Sees currently executing routes
5. Selects specific route to view details
6. Can transition to "Completed" when done
7. Checks "Completed" tab to see finished routes
8. Verifies efficiency percentage (95% = good)

**Workflow 3: Track Route Efficiency**
1. Routes auto-calculate efficiency based on stops completed vs estimated time
2. System tracks:
   - Planned vs actual times
   - Distance traveled vs optimized distance
   - Stops completed in sequence
3. Efficiency score calculated (0-100%)
4. Displayed on route cards
5. Fleet manager uses for performance analysis

### Test Scenarios

**Scenario 1: Route Creation**
- **Setup:** User with dispatcher role, vehicles and drivers available
- **Expected:** Dialog opens, all dropdowns populated
- **Verify:** Route created with correct vehicle/driver, status="planned"

**Scenario 2: Tab Filtering**
- **Setup:** Mix of planned, active, and completed routes
- **Expected:** Each tab shows only routes with matching status
- **Verify:** Route counts correct for each tab

**Scenario 3: Status Transitions**
- **Setup:** Planned route visible
- **Expected:** "Start Route" button appears for planned routes
- **Verify:** Clicking button transitions status to "active", updates UI

**Scenario 4: Efficiency Calculation**
- **Setup:** Route with multiple stops, actual times recorded
- **Expected:** Efficiency % calculated
- **Verify:** Shows reasonable percentage (typical 85-98%)

**Scenario 5: Map Integration**
- **Setup:** Route management with vehicles and facilities
- **Expected:** Map shows current vehicle locations
- **Verify:** Map renders correctly, vehicles appear at expected locations

**Scenario 6: Metrics Accuracy**
- **Setup:** Multiple routes in different statuses
- **Expected:** Metric cards show correct counts
- **Verify:** Active count, completed count, total distance all accurate

---

## ADVANCEDROUTEOPTIMIZATION COMPONENT

**File:** `/src/components/modules/AdvancedRouteOptimization.tsx`

### Feature Description
Advanced Route Optimization extends basic route optimization with sophisticated constraints including EV charging, real-time traffic awareness, weather considerations, and multi-vehicle fleet coordination. It provides analytics on optimization impact and supports complex business rules.

### Target Users
- **Fleet Managers:** Optimize mixed vehicle fleets (EV and traditional)
- **Operations Directors:** Monitor optimization ROI and efficiency gains
- **Route Planners:** Handle complex constraints and exceptions
- **Sustainability Officers:** Track emissions reduction

### User Stories

```
1. As a fleet manager with electric vehicles, I want the system to automatically 
   include charging stops in routes so that EVs don't run out of battery

2. As an operations director, I want to see optimization analytics showing 
   distance reduction, time savings, and cost savings so that I can measure 
   the value of the system

3. As a route planner, I want to optimize for different goals (distance/time/cost/emissions) 
   so that I can choose the best strategy for different route types

4. As a sustainability officer, I want to track CO2 emissions reduction 
   so that I can report on environmental impact

5. As a fleet manager, I want real-time re-optimization on disruptions 
   so that my routes adapt to traffic changes, accidents, or delays
```

### Core Functionality & Features

**Route Visualization:**
- Map display with vehicle and facility markers
- Route geometries shown as lines between stops
- Satellite and terrain view options
- Real-time vehicle position updates

**Advanced Configuration Options:**
- **Optimization Goal:** Distance, Time, Cost, or Emissions
- **Traffic Awareness:** Toggle real-time traffic consideration
- **Weather Awareness:** Toggle weather-based routing adjustments
- **EV Support:** Toggle EV-specific routing with charging requirements
- **Max Stops Per Route:** Configurable (default 10)
- **Max Route Duration:** Configurable in minutes (default 480/8 hours)
- **Charge Stop Requirements:** Auto-add charging stations for EVs

**Route Performance Cards:**
- Route ID and assigned vehicle/driver
- Optimization score (0-100%) with color coding
- Distance and duration metrics
- Fuel/energy consumption estimates
- Cost estimates
- Re-optimize button for real-time adjustments

**Stop Details:**
- Stop name and priority level (low/medium/high/critical)
- Address and time window (if applicable)
- Service time required
- Special requirements (refrigeration, lift gate, etc.)
- Sequential numbering within route

**Analytics Dashboard:**
- Total routes count
- Average optimization score
- Total distance across all routes
- Estimated cost savings vs unoptimized baseline
- Optimization impact metrics:
  - Distance reduction percentage (typical 15-25%)
  - Time savings percentage (typical 18-30%)
  - Fuel/energy savings (typical 12-20%)
  - CO2 reduction in kg

### Data Inputs & Outputs

**Configuration Data:**
```typescript
interface RouteOptimizationConfig {
  optimizeFor: "distance" | "time" | "cost" | "emissions"
  considerTraffic: boolean
  considerWeather: boolean
  evAware: boolean
  maxStopsPerRoute: number
  maxRouteDuration: number // minutes
  requiredChargeStops: boolean
  vehicleCapabilities: {
    range: number // miles
    chargeTime: number // minutes
  }
}

interface OptimizedRoute {
  id: string
  vehicleId: string
  driverId: string
  stops: RouteStop[]
  totalDistance: number // miles
  totalDuration: number // minutes
  estimatedFuel: number // gallons or kWh
  estimatedCost: number
  optimizationScore: number // 0-100
  constraints: string[]
}
```

**Stop Structure:**
```typescript
interface RouteStop {
  id: string
  name: string
  address: string
  location: { lat: number; lng: number }
  timeWindow: { start: string; end: string }
  serviceTime: number // minutes
  priority: "low" | "medium" | "high" | "critical"
  requirements?: string[]
}
```

**Analytics Output:**
- `totalRoutes`: number of optimized routes
- `avgOptimizationScore`: average quality score
- `totalDistance`: sum across all routes
- `estimatedSavings`: financial benefit
- `distanceReduction`: percentage reduction
- `timeSavings`: percentage time saved
- `fuelEnergyySavings`: percentage fuel/energy saved
- `co2Reduction`: kg of CO2 prevented

### API Integration Points

**Hooks Used:**
- `useFleetData()` - Gets vehicles, facilities, and routes
- Local state management for configuration

**Data Sources:**
- Fleet vehicles (with optimization profiles)
- Route data from database
- Facilities for visualization

### Key Workflows

**Workflow 1: EV-Aware Route Optimization**
1. Fleet manager navigates to Advanced Route Optimization
2. Sees 15 active routes for the day
3. Enables "EV-Aware Routing" toggle
4. Sets vehicle range to 250 miles
5. Sets charge time to 30 minutes
6. Sets optimization goal to "cost"
7. Clicks "Optimize All Routes"
8. System analyzes routes and injects charging stops where needed
9. Routes recalculated to include chargers without exceeding range
10. Results show:
    - 18% distance reduction
    - 16% fuel/energy savings
    - $127 estimated savings
    - 892 kg CO2 reduction

**Workflow 2: Optimize for Different Goals**
1. Route planner has 20 stops to optimize
2. First runs with "Minimize Distance" goal
3. Gets results: 156 miles, 4.2 hours, $45 cost
4. Runs again with "Minimize Time" goal
5. Gets results: 162 miles, 3.8 hours, $48 cost
6. Runs with "Minimize Cost" goal
7. Gets results: 158 miles, 4.0 hours, $43 cost
8. Compares all three options
9. Selects "Minimize Cost" for this route
10. Approves route for dispatch

**Workflow 3: Real-Time Re-optimization**
1. Route is active with driver on the road
2. Traffic incident occurs affecting the route
3. System detects disruption
4. Dispatcher clicks "Re-optimize" button
5. System re-calculates route with current traffic conditions
6. New optimal path generated
7. Driver notified of updated route
8. Estimated arrival time adjusted
9. Route continues with new optimal path

**Workflow 4: Constraint Analysis**
1. Route has multiple constraints:
   - Time windows for deliveries
   - Vehicle range limitations (EV)
   - Traffic conditions
   - Weather warnings
2. System processes all constraints simultaneously
3. Generates optimal solution respecting all constraints
4. If constraints conflict, displays warnings
5. Shows which constraints are satisfied
6. Highlights routes with active constraints

### Test Scenarios

**Scenario 1: EV Charging Stop Insertion**
- **Setup:** 8-hour route, EV with 200-mile range, 30-min charge time
- **Expected:** Charging stops auto-inserted at appropriate locations
- **Verify:** No segment exceeds vehicle range, charge time included in total

**Scenario 2: Multi-Goal Comparison**
- **Setup:** Same 10 stops, optimize with all 4 goals
- **Expected:** Different solutions for each goal
- **Verify:** Distance-optimized lowest miles, time-optimized shortest duration, cost-optimized lowest expense

**Scenario 3: Traffic Awareness**
- **Setup:** Enable traffic consideration, route through congested area
- **Expected:** Route avoids peak congestion hours
- **Verify:** Timing adjusted to avoid traffic, total time increased appropriately

**Scenario 4: Weather Impact**
- **Setup:** Enable weather, rain forecast in area
- **Expected:** Route adjusted for weather conditions
- **Verify:** Roads avoided if dangerous, timing increased for caution

**Scenario 5: Critical Priority Handling**
- **Setup:** One stop marked "critical" priority
- **Expected:** Critical stop positioned early in route sequence
- **Verify:** Critical stop delivered with minimal delay risk

**Scenario 6: Analytics Accuracy**
- **Setup:** Run full optimization, check analytics
- **Expected:** Savings percentages match actual differences
- **Verify:** All metrics calculated correctly, CO2 reduction reasonable

**Scenario 7: Constraint Conflict**
- **Setup:** Stop with 8-10am window, 20+ miles away in traffic
- **Expected:** Warning shown about conflicting constraints
- **Verify:** System highlights issue, allows manual override

---

## GISCOMMANDCENTER COMPONENT

**File:** `/src/components/modules/GISCommandCenter.tsx`

### Feature Description
GIS Command Center provides a geographic information system command center for enterprise fleet monitoring, facility management, and regional operations. It displays real-time vehicle positions, facility statuses, and regional operational metrics with regional filtering capabilities.

### Target Users
- **Fleet Operations Managers:** Monitor fleet across geographic regions
- **Facility Managers:** Track facility status and capacity
- **Emergency Response Coordinators:** Monitor emergency situations
- **Regional Supervisors:** Oversee specific regions' operations
- **Executives:** High-level fleet health dashboards

### User Stories

```
1. As a fleet operations manager, I want to see all vehicles and facilities on a map 
   so that I can understand geographic distribution and status at a glance

2. As a regional supervisor, I want to filter the view to my region 
   so that I can focus on my area of responsibility

3. As a facility manager, I want to see which facilities are operational 
   so that I can coordinate maintenance and ensure service availability

4. As an emergency response coordinator, I want to identify vehicles in emergency status 
   so that I can respond quickly to critical situations

5. As an operations executive, I want to see region summary statistics 
   so that I can understand operational health across the fleet
```

### Core Functionality & Features

**Regional Filtering:**
- Dropdown to select region (All Regions, or specific region names)
- Automatic extraction of regions from vehicle data
- Filters both vehicles and facilities to selected region

**Metric Cards (5 cards):**
1. **Total Vehicles:** Count of vehicles in selected region
2. **Active:** Number of vehicles actively moving/delivering
3. **Facilities:** Count of operational facilities
4. **Emergency:** Count of vehicles in emergency/urgent status
5. **In Service:** Count of vehicles currently undergoing maintenance

**Map Visualization:**
- Three map style options:
  - **Map View:** Standard road map
  - **Satellite:** Satellite imagery
  - **Terrain:** Terrain visualization
- Vehicle markers with status color coding:
  - Green: Active
  - Gray: Idle
  - Red: Emergency
  - Blue: Charging (if EV)
  - Orange: Service/Maintenance
  - Dark Gray: Offline

**Layer Visibility Toggle:**
- Vehicles layer on/off
- Facilities layer on/off
- Routes layer on/off
- Quick buttons to toggle each layer

**Status Legend:**
- Visual indicators showing what each color means
- Count of vehicles in each status
- Real-time updating

**Facility List Panel:**
- Shows first 6 facilities (scrollable)
- Facility icon by type (office, depot, service center, fueling station)
- Facility name, type, and address
- Status badge (Operational or Maintenance)

**Region Summary Panel:**
- Coverage area name
- Vehicle count
- Facility count
- Average response time
- Overall region status

### Data Inputs & Outputs

**Input Data:**
```typescript
interface Vehicle {
  id: string
  name: string
  status: "active" | "idle" | "charging" | "service" | "emergency" | "offline"
  region: string
  location: { lat: number; lng: number; address?: string }
  driver?: string
  type: string
}

interface GISFacility {
  id: string
  name: string
  type: "office" | "depot" | "service-center" | "fueling-station"
  region: string
  location: { lat: number; lng: number }
  address: string
  status: "operational" | "maintenance" | "closed"
  capacity: number
}
```

**Output Display:**
- Filtered vehicle list based on region
- Filtered facility list based on region
- Calculated metrics for selected region
- Map with appropriate markers and layers

### API Integration Points

**Hooks Used:**
- `useFleetData()` - Gets vehicles and routes
- `useFacilities()` - Gets facility data
- Local state for region selection and layer visibility

### Key Workflows

**Workflow 1: Regional Fleet Overview**
1. Operations manager opens GIS Command Center
2. Map displays all vehicles across entire fleet
3. Metrics show: 45 Total Vehicles, 28 Active, 12 Facilities, 2 Emergency, 3 In Service
4. Manager selects "Northeast" region from dropdown
5. Map and metrics filter to Northeast region
6. Shows: 12 vehicles in northeast, 8 active, 4 facilities
7. Can see emergency vehicles in that region and take action
8. Reviews facility status (all operational)
9. Checks average response time (12 minutes)

**Workflow 2: Emergency Response**
1. Dispatch center alerts manager of emergency situation
2. Manager opens GIS Command Center
3. Immediately sees 2 vehicles in emergency status (red dots)
4. Clicks on emergency vehicle
5. Gets vehicle details popup (driver, location, last update)
6. Can assign nearest active vehicle to assist
7. Toggles off non-emergency vehicles to focus on emergency
8. Coordinates response across facility network

**Workflow 3: Facility Status Check**
1. Manager needs to route vehicles for maintenance
2. Checks Facility panel to see which service centers are operational
3. See list shows 5 operational, 1 in maintenance
4. Routes vehicles to operational facility
5. Facility capacity check available in panel
6. Ensures facility can accommodate incoming vehicles

**Workflow 4: Layer Visibility Management**
1. Manager wants to see route paths without vehicle clutter
2. Toggles "Vehicles" layer off
3. Toggles "Routes" layer on
4. Map shows route paths without vehicle markers
5. Can analyze route efficiency visually
6. Toggles back to see vehicles for operational view

### Test Scenarios

**Scenario 1: Region Filtering**
- **Setup:** Vehicles and facilities in multiple regions
- **Expected:** Dropdown shows all regions, filtering works correctly
- **Verify:** Selected region shows only matching vehicles/facilities

**Scenario 2: Status Color Coding**
- **Setup:** Vehicles with different statuses
- **Expected:** Each status has unique color on map
- **Verify:** Colors match legend, easy to distinguish

**Scenario 3: Metric Calculation**
- **Setup:** 100 vehicles total, 40 active, 5 emergency, 8 in service
- **Expected:** Metric cards show correct counts for selected region
- **Verify:** Counts match actual filtered data

**Scenario 4: Emergency Vehicle Identification**
- **Setup:** 2 vehicles with emergency status
- **Expected:** Easily visible on map with red markers
- **Verify:** Can quickly locate emergency vehicles

**Scenario 5: Facility Panel Accuracy**
- **Setup:** 20 facilities in region
- **Expected:** Panel shows first 6 with scrolling capability
- **Verify:** All facility types display correct icons

**Scenario 6: Layer Toggle Functionality**
- **Setup:** Map with vehicles, facilities, routes visible
- **Expected:** Each layer toggles independently
- **Verify:** Toggling one layer doesn't affect others

**Scenario 7: Map Style Switching**
- **Setup:** Three map style options available
- **Expected:** Clicking each style switches map appearance
- **Verify:** All data persists, only map style changes

---

## ARCGISINTEGRATION COMPONENT

**File:** `/src/components/modules/ArcGISIntegration.tsx`

### Feature Description
ArcGIS Integration enables plug-and-play connection to external ArcGIS map layers (REST services), allowing organizations to overlay custom mapping data from Esri's ecosystem including traffic data, demographic layers, infrastructure maps, and custom business data.

### Target Users
- **GIS Administrators:** Configure ArcGIS layer connections
- **Fleet Managers:** Use custom mapping layers for routing decisions
- **Data Analysts:** Layer organizational data onto maps
- **System Administrators:** Manage ArcGIS service authentication
- **Operations Teams:** Visualize industry-specific geographic data

### User Stories

```
1. As a GIS administrator, I want to add ArcGIS REST service layers 
   so that I can extend the mapping capabilities with external data

2. As a fleet manager, I want to use traffic incident layers from ArcGIS 
   so that my routes avoid congestion and accidents

3. As a data analyst, I want to overlay demographic data on the map 
   so that I can understand service coverage and market penetration

4. As a system administrator, I want to test ArcGIS service connections before enabling 
   so that I ensure all layers are accessible and properly configured

5. As an operations lead, I want to toggle layers on and off quickly 
   so that I can focus on relevant data and reduce map clutter
```

### Core Functionality & Features

**Add Layer Dialog:**
- Layer name (required)
- Service URL (required) - ArcGIS REST endpoint
- Description (optional)
- Authentication token (optional) - for secured services
- Opacity slider (0-100%)
- Connection testing before save
- Example ArcGIS URLs provided

**Connection Testing:**
- "Test Connection" button
- Validates URL and authentication
- Fetches service capabilities
- Shows success/failure message
- Prevents adding unreachable services

**Layer Management:**
- List of added layers with:
  - Layer name and icon
  - Service type badge (feature/tile/dynamic/image)
  - Description
  - Enabled/Disabled status
  - Opacity control (when enabled)
  - Supported operations display
  - Edit and delete buttons

**Layer Configuration:**
- Toggle layer visibility on/off
- Adjust opacity with slider
- View layer capabilities and metadata
- Edit layer settings
- Duplicate layer for templating
- Delete layer with confirmation

**Layer Types Supported:**
- **Feature Layers:** Vector features with attributes, editable
- **Tile Layers:** Pre-rendered cached tiles, fast performance
- **Dynamic Layers:** Server-rendered on demand
- **Image Layers:** Raster imagery and aerial photos
- **WMS:** Web Mapping Service compatibility

**Example Services Provided:**
- USA States (boundaries)
- World Cities (major population centers)
- Traffic Cameras (live camera feeds in Minnesota)

**Help Section:**
- Step-by-step instructions for adding layers
- Layer type descriptions
- Supported operations list
- Authentication guidance

### Data Inputs & Outputs

**Layer Configuration Data:**
```typescript
interface ArcGISLayerConfig {
  id: string
  name: string
  description?: string
  serviceUrl: string
  layerType: 'feature' | 'tile' | 'image' | 'dynamic' | 'wms'
  enabled: boolean
  opacity: number // 0-1
  minZoom?: number
  maxZoom?: number
  refreshInterval?: number // seconds
  authentication?: ArcGISAuth
  styling?: ArcGISLayerStyle
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

interface ArcGISAuth {
  type: 'token' | 'oauth' | 'none'
  token?: string
  clientId?: string
  clientSecret?: string
}
```

**Service Capabilities Response:**
```typescript
interface ArcGISServiceCapabilities {
  serviceUrl: string
  name: string
  description: string
  layerType: string
  spatialReference: { wkid: number }
  extent: { xmin: number; ymin: number; xmax: number; ymax: number }
  layers?: ArcGISLayerInfo[]
  fields?: ArcGISFieldInfo[]
  supportedOperations: string[]
}
```

### API Integration Points

**Service Used:**
- `arcgisService.testServiceConnection()` - Validate ArcGIS URL
- `arcgisService.fetchServiceCapabilities()` - Get layer metadata
- `apiClient.arcgisLayers.list()` - Fetch configured layers
- `apiClient.arcgisLayers.create()` - Save new layer
- `apiClient.arcgisLayers.update()` - Update layer settings
- `apiClient.arcgisLayers.delete()` - Remove layer

**ArcGIS REST API Endpoints:**
- `/query` - Feature layer queries
- `/tile/{level}/{row}/{col}` - Tile requests
- `/export` - Dynamic map exports

### Key Workflows

**Workflow 1: Add Traffic Incidents Layer**
1. Administrator opens ArcGIS Integration
2. Clicks "Add Layer" button
3. Dialog opens
4. Enters name: "Traffic Incidents"
5. Enters service URL: `https://services.arcgis.com/traffic/featureserver/0`
6. Adds description: "Real-time traffic incidents and alerts"
7. Leaves authentication blank (public service)
8. Sets opacity to 80%
9. Clicks "Test Connection"
10. System validates URL and fetches capabilities
11. Success message displayed
12. Clicks "Add Layer"
13. Layer added to active layers list
14. Layer now available for display on fleet map

**Workflow 2: Layer Visibility Management**
1. Multiple ArcGIS layers configured
2. User wants to focus on traffic only
3. Toggles off:
    - Demographic layer
    - Boundary layer
    - Infrastructure layer
4. Leaves traffic layer enabled
5. Map displays only traffic layer
6. Can toggle back on as needed

**Workflow 3: Opacity Adjustment**
1. Demographics layer is making map too busy
2. User finds layer in list
3. Adjusts opacity slider from 100% to 50%
4. Layer becomes semi-transparent
5. Underlying map data visible through layer
6. Better visibility of core fleet data

**Workflow 4: Service Connection Troubleshooting**
1. Administrator tries to add new service layer
2. Enters URL and clicks "Test Connection"
3. Gets error message: "Failed to connect to service"
4. Checks:
    - URL is correct
    - Service is accessible
    - Network allows access
5. Discovers service requires authentication
6. Enters ArcGIS token
7. Clicks "Test Connection" again
8. Connection successful
9. Adds layer with authentication

**Workflow 5: Layer Configuration Update**
1. Existing layer needs opacity adjustment
2. User finds layer in list
3. Clicks edit button
4. Changes opacity from 100% to 70%
5. Updates metadata if needed
6. Clicks save
7. Layer updated with new settings
8. Changes apply immediately to map

### Test Scenarios

**Scenario 1: Successful Layer Addition**
- **Setup:** Valid ArcGIS REST service URL available
- **Expected:** Connection test passes, layer added successfully
- **Verify:** Layer appears in list, can be toggled on/off

**Scenario 2: Invalid Service URL**
- **Setup:** Provide invalid or inaccessible URL
- **Expected:** Test connection fails with error message
- **Verify:** Layer not added, error message helpful

**Scenario 3: Authenticated Service**
- **Setup:** Secured ArcGIS service requiring token
- **Expected:** Connection fails without token, succeeds with token
- **Verify:** Authentication properly handled

**Scenario 4: Opacity Control**
- **Setup:** Layer added and visible on map
- **Expected:** Opacity slider ranges 0-100%
- **Verify:** Changing opacity updates map in real-time

**Scenario 5: Layer Type Detection**
- **Setup:** Add different layer type services (feature, tile, dynamic)
- **Expected:** Layer type correctly identified and displayed
- **Verify:** Badge shows correct layer type

**Scenario 6: Multiple Layer Management**
- **Setup:** 5+ layers added with different opacity and visibility
- **Expected:** All layers toggleable independently
- **Verify:** Toggling one doesn't affect others

**Scenario 7: Example Service Usage**
- **Setup:** User clicks on example service
- **Expected:** URL copied or form pre-populated
- **Verify:** Can quickly add example services

---

## GEOFENCEMANAGEMENT COMPONENT

**File:** `/src/components/modules/GeofenceManagement.tsx`

### Feature Description
Geofence Management enables administrators to create and manage geographic boundaries with automated alerts. When vehicles enter, exit, or dwell within geofences, the system can trigger notifications, logging, and automated actions. Supports circle, polygon, and rectangle geofences with customizable trigger events.

### Target Users
- **Fleet Administrators:** Create and manage geofences
- **Operations Managers:** Monitor geofence violations and alerts
- **Dispatchers:** Respond to unauthorized location access
- **Security Officers:** Track vehicle movements and compliance
- **Route Planners:** Use geofences for service area definition

### User Stories

```
1. As a fleet administrator, I want to create circular geofences around warehouse locations 
   so that I can monitor when vehicles enter or leave the facility

2. As a dispatcher, I want to receive alerts when vehicles enter/exit critical areas 
   so that I can ensure proper routing and security

3. As an operations manager, I want to see all active geofences and their trigger status 
   so that I can understand coverage and ensure areas are properly monitored

4. As a security officer, I want to set up geofences for restricted areas 
   so that I can alert when unauthorized vehicle access occurs

5. As a route planner, I want to use geofences to define service territories 
   so that I can restrict routes to service areas
```

### Core Functionality & Features

**Geofence Creation Dialog:**
- Geofence name (required)
- Description (optional)
- Type selection: Circle, Polygon, or Rectangle
- For circles:
  - Center latitude/longitude
  - Radius in meters
- For polygons/rectangles:
  - Multiple coordinate points
- Color picker for visual identification
- Status toggle (Active/Inactive)

**Trigger Configuration:**
- Alert on Entry - vehicle enters geofence
- Alert on Exit - vehicle leaves geofence
- Alert on Dwell - vehicle stays in geofence for X minutes
- Dwell time duration (when dwell enabled)

**Alert Settings:**
- Alert priority: Low, Medium, High, or Critical
- Notification recipients:
  - Specific user selection
  - Role-based notifications (Manager, Dispatcher, etc.)
- Color-coded by priority

**Geofence Management Table:**
- Search and filter capabilities
- Type filtering (All, Circle, Polygon, Rectangle)
- Columns:
  - Name with color indicator
  - Type (with icon)
  - Active triggers (entry, exit, dwell)
  - Priority badge
  - Active/Inactive status toggle
  - Edit, Duplicate, Delete buttons

**Metrics Display:**
- Total geofences defined
- Active geofences monitoring
- Total trigger events configured
- Events triggered today

**Map Visualization:**
- Shows all geofences on map
- Vehicles and facilities displayed
- Geofence boundaries visible
- Color-coded by priority or type
- Interactive map allows viewing geofence locations

### Data Inputs & Outputs

**Geofence Data Structure:**
```typescript
interface Geofence {
  id: string
  tenantId: string
  name: string
  description: string
  type: "circle" | "polygon" | "rectangle"
  center?: { lat: number; lng: number } // for circles
  radius?: number // meters
  coordinates?: { lat: number; lng: number }[] // for polygon/rectangle
  color: string
  active: boolean
  triggers: {
    onEnter: boolean
    onExit: boolean
    onDwell: boolean
    dwellTimeMinutes?: number
  }
  notifyUsers: string[]
  notifyRoles: string[]
  alertPriority: "low" | "medium" | "high" | "critical"
  createdBy: string
  createdAt: string
  lastModified: string
}

interface CreateGeofenceRequest {
  name: string
  description?: string
  type: "circle" | "polygon" | "rectangle"
  center?: { lat: number; lng: number }
  radius?: number
  coordinates?: { lat: number; lng: number }[]
  color: string
  triggers: TriggerConfig
  alertPriority: string
  notifyUsers: string[]
  notifyRoles: string[]
}
```

**Alert Event Data:**
```typescript
interface GeofenceEvent {
  id: string
  geofenceId: string
  vehicleId: string
  eventType: "enter" | "exit" | "dwell"
  timestamp: string
  location: { lat: number; lng: number }
  driver: string
  alertPriority: string
}
```

### API Integration Points

**Hooks Used:**
- `useFleetData()` - Gets vehicles and facilities
- `toast` - Toast notifications for actions
- Local state for geofence management

**Backend Integration:**
- Local storage for geofence data
- API ready for:
  - `POST /api/geofences` - Create geofence
  - `GET /api/geofences` - List geofences
  - `PUT /api/geofences/:id` - Update geofence
  - `DELETE /api/geofences/:id` - Delete geofence

### Key Workflows

**Workflow 1: Create Warehouse Geofence**
1. Administrator opens Geofence Management
2. Clicks "Create Geofence"
3. Dialog opens
4. Enters name: "Main Warehouse"
5. Adds description: "Central distribution facility"
6. Selects type: "Circle"
7. Enters center: Lat 42.3601, Lng -71.0589 (Boston location)
8. Sets radius: 500 meters
9. Selects color: Blue
10. Enables triggers: "Alert on Entry" and "Alert on Exit"
11. Sets priority: "Medium"
12. Selects notify users: "Manager1", "Manager2"
13. Clicks "Create Geofence"
14. Geofence appears on map as blue circle
15. Appears in geofences table with status Active

**Workflow 2: Monitor Geofence Events**
1. Vehicle approaches warehouse
2. System detects entry into geofence
3. "Alert on Entry" triggers
4. Notification sent to configured users
5. Event logged with timestamp and vehicle info
6. Vehicle spends 45 minutes at warehouse
7. Vehicle exits geofence
8. "Alert on Exit" triggers
9. Notification sent to users
10. Dispatch receives real-time updates

**Workflow 3: Dwell Monitoring**
1. Administrator creates geofence with "Alert on Dwell"
2. Sets dwell time: 30 minutes
3. Vehicle enters geofence
4. Spends 25 minutes - no alert
5. Spends 35 minutes - alert triggers at 30 minute mark
6. Notification: "Vehicle dwelling in [Geofence] for 30+ minutes"
7. Dispatcher can investigate if extended stay is unexpected

**Workflow 4: Service Territory Definition**
1. Route planner creates polygon geofence
2. Defines service territory boundaries
3. Adds multiple coordinate points (4+ for polygon)
4. Names geofence: "North Service Territory"
5. Marks as active
6. Routes must stay within territory
7. Exit alert notifies dispatcher if vehicle leaves territory
8. Used to restrict routes to defined areas

**Workflow 5: Restricted Area Security**
1. Security officer creates critical geofence
2. Area: Unauthorized zone around facility
3. Type: Rectangle around restricted area
4. Priority: Critical
5. Enables only "Alert on Entry"
6. Any unauthorized vehicle entry triggers critical alert
7. Immediately notified to security and dispatch
8. Quick response to unauthorized access

### Test Scenarios

**Scenario 1: Circle Geofence Creation**
- **Setup:** Create circle geofence with lat/lng center and radius
- **Expected:** Geofence created and visible on map as circle
- **Verify:** Circle renders at correct location with correct radius

**Scenario 2: Entry/Exit Triggers**
- **Setup:** Geofence with entry and exit alerts enabled
- **Expected:** Alerts trigger appropriately when vehicle crosses boundary
- **Verify:** Alert notifications sent to configured recipients

**Scenario 3: Dwell Detection**
- **Setup:** Geofence with dwell trigger at 15 minutes
- **Expected:** Alert fires after vehicle stays 15+ minutes
- **Verify:** Alert doesn't fire before 15 minutes, fires after

**Scenario 4: Polygon Geofence**
- **Setup:** Create polygon with 4+ coordinate points
- **Expected:** Polygon renders with all points connected
- **Verify:** Shape accurate, events trigger when vehicle in/out of polygon

**Scenario 5: Priority Coloring**
- **Setup:** Create geofences with different priorities
- **Expected:** Each priority has distinct color
- **Verify:** Colors visually distinct and match priority level

**Scenario 6: Geofence Duplication**
- **Setup:** Existing geofence with full configuration
- **Expected:** Can duplicate with all settings copied
- **Verify:** Duplicate has same config but new ID/timestamps

**Scenario 7: Search and Filter**
- **Setup:** 10+ geofences of different types
- **Expected:** Search works by name, filter by type
- **Verify:** Search results accurate, type filter works correctly

**Scenario 8: Geofence Deactivation**
- **Setup:** Active geofence with triggers enabled
- **Expected:** Can toggle to inactive, triggers stop
- **Verify:** Inactive geofence doesn't generate alerts

---

## ENHANCEDMAPLAYERS COMPONENT

**File:** `/src/components/modules/EnhancedMapLayers.tsx`

### Feature Description
Enhanced Map Layers extends the base mapping functionality with real-time operational data layers including live traffic conditions, weather radar, traffic cameras, safety incidents, and EV charging stations. Multiple independent layers can be toggled on/off to show relevant information for different operational needs.

### Target Users
- **Fleet Operations Teams:** Monitor real-time traffic and weather
- **Dispatch Centers:** See live incident data affecting routes
- **EV Fleet Managers:** Locate charging infrastructure
- **Safety Managers:** Monitor incident locations and severity
- **Route Planners:** Factor external conditions into planning

### User Stories

```
1. As a fleet operations manager, I want to see real-time traffic conditions on the map 
   so that I can adjust routes to avoid congestion

2. As a dispatcher, I want to see traffic incidents and accidents 
   so that I can alert drivers and reroute vehicles

3. As an EV fleet manager, I want to see charging station locations on the map 
   so that I can plan charging stops on long routes

4. As a safety officer, I want to monitor weather alerts 
   so that I can advise drivers of dangerous conditions

5. As a route coordinator, I want to toggle layers on/off 
   so that I can reduce map clutter and focus on relevant data
```

### Core Functionality & Features

**Map Layer Options:**
1. **Live Traffic** - Real-time traffic conditions, congestion levels
2. **Weather Radar** - NWS weather radar and real-time weather alerts
3. **Traffic Cameras** - DOT traffic camera feeds for monitoring
4. **Traffic Incidents** - Accidents, construction, road closures
5. **EV Charging Stations** - Public charging network locations

**Layer Management Interface:**
- Toggle buttons for each layer (Enabled/Disabled visual state)
- Descriptions of what each layer shows
- Data source attribution (Google Traffic, NWS, DOT, etc.)
- Quick enable/disable controls

**Traffic Incidents Display:**
- List of active incidents with:
  - Incident type (accident, construction, closure, congestion, hazard)
  - Severity badge (critical, major, minor)
  - Location (latitude/longitude)
  - Description of incident
  - Impacted routes list
  - Estimated delay in minutes
  - Time reported

**Weather Monitoring:**
- Current weather conditions:
  - Temperature in Fahrenheit
  - Wind speed and direction
  - Humidity percentage
  - Visibility in miles
  - Precipitation amount
- Active weather alerts section:
  - Alert type (winter storm, tornado, flood, etc.)
  - Severity level (extreme, severe, moderate, minor)
  - Urgency (immediate, expected, future)
  - Affected area description
  - Headline summary
  - Detailed instructions for response
  - Expiration timestamp

**Traffic Cameras:**
- Live camera feed previews
- Camera location and orientation
- Online/offline/maintenance status
- Last update timestamp
- "View Live Stream" button for each camera
- Searchable camera list

**Metric Cards:**
- Active layers count
- Active traffic incidents count
- Online traffic cameras count
- Current temperature and conditions
- Active weather alerts count

### Data Inputs & Outputs

**Layer Configuration:**
```typescript
interface MapLayer {
  id: string
  name: string
  type: "traffic" | "weather" | "camera" | "incident" | "charging" | "geofence" | "overlay"
  enabled: boolean
  icon: any
  description: string
  dataSource?: string
}
```

**Weather Data:**
```typescript
interface WeatherConditions {
  temperature: number // Fahrenheit
  conditions: string
  windSpeed: number // mph
  windDirection: string
  humidity: number // percentage
  visibility: number // miles
  precipitation: number // inches
  alerts: WeatherAlert[]
}

interface WeatherAlert {
  id: string
  event: string // Type of alert
  severity: "extreme" | "severe" | "moderate" | "minor"
  urgency: "immediate" | "expected" | "future"
  certainty: "observed" | "likely" | "possible"
  area: string // Affected area description
  headline: string
  description: string
  instruction: string // Recommended actions
  onset: string // Start time
  expires: string // End time
}
```

**Traffic Incident:**
```typescript
interface TrafficIncident {
  id: string
  type: "accident" | "construction" | "road-closure" | "congestion" | "hazard"
  severity: "critical" | "major" | "minor"
  location: { lat: number; lng: number }
  description: string
  impactedRoutes: string[]
  estimatedDelay: number // minutes
  reportedAt: string
}
```

**Traffic Camera:**
```typescript
interface TrafficCamera {
  id: string
  name: string
  location: { lat: number; lng: number }
  streamUrl: string
  imageUrl: string
  status: "online" | "offline" | "maintenance"
  direction: string
  lastUpdate: string
}
```

### API Integration Points

**Data Sources:**
- `useSafetyIncidents()` - Fetch traffic incidents
- `useChargingStations()` - Fetch EV charging locations
- `weather.gov API` - National Weather Service data
- `traffic.google.com` - Traffic conditions
- State DOT APIs - Traffic cameras

**API Calls:**
- `fetch(weather.gov/points/)` - Get weather grid point
- `fetch(weather.gov/alerts/)` - Get active weather alerts
- Incident data from internal API

### Key Workflows

**Workflow 1: Monitor Traffic During Peak Hours**
1. Fleet operations opens Enhanced Map Layers
2. Toggles on "Live Traffic" layer
3. Toggles on "Traffic Incidents" layer
4. Map displays traffic conditions with incident markers
5. Sees major accident on Route 95 during peak hours
6. Checks "Estimated Delay" - 45 minutes
7. Can reroute vehicles to avoid incident
8. Updates driver notifications
9. As incident clears, traffic improves, layer updates

**Workflow 2: Weather-Aware Dispatch**
1. Dispatcher opens Enhanced Map Layers
2. Toggles "Weather Radar" on
3. Sees severe thunderstorm warning in delivery area
4. Checks "Active Weather Alerts" - tornado watch issued
5. Instructions say: "Avoid outdoor activities"
6. Pauses deliveries in affected area
7. Redirects routes to unaffected regions
8. As weather warning expires, resumes normal operations

**Workflow 3: EV Charging Route Planning**
1. EV fleet manager planning 200-mile route
2. Toggles on "EV Charging Stations"
3. Map shows charging network locations
4. Route passes through area with multiple chargers
5. Plans charging stop at optimal location
6. Includes charge time in route planning
7. Route is complete without range concerns

**Workflow 4: Real-time Incident Response**
1. New traffic incident reported (construction zone)
2. System updates traffic incidents layer
3. Dispatcher sees new incident on map
4. Checks incident details: "Road closure, major delay"
5. Identifies routes affected
6. Proactively reroutes affected vehicles
7. Notifies drivers of new route
8. Traffic incident cleared after 2 hours
9. Can reroute back to normal routes

**Workflow 5: Intelligent Layer Management**
1. Dispatch center starts day with many layers enabled
2. Too much information on map, hard to see vehicles
3. Toggles off:
   - EV Charging Stations (not relevant today)
   - Weather (clear forecast)
   - Cameras (not needed for route monitoring)
4. Leaves on:
   - Live Traffic
   - Traffic Incidents
5. Map is now cleaner, focused on routing relevance
6. Can toggle layers back on as needed

### Test Scenarios

**Scenario 1: Traffic Incidents Loading**
- **Setup:** Multiple active traffic incidents available
- **Expected:** Incidents load and display on map with severity colors
- **Verify:** All incidents show correct type, severity, and location

**Scenario 2: Weather Alert Retrieval**
- **Setup:** Active weather alerts for region
- **Expected:** Alerts fetch from weather.gov and display
- **Verify:** Alert information complete and accurate

**Scenario 3: Layer Toggle Functionality**
- **Setup:** Multiple layers with some enabled, some disabled
- **Expected:** Toggling layer on/off updates map immediately
- **Verify:** Only enabled layers render, toggling is responsive

**Scenario 4: Camera Feed Status**
- **Setup:** Mix of online, offline, and maintenance cameras
- **Expected:** Status badges show correct state for each camera
- **Verify:** Can filter by status, online cameras are playable

**Scenario 5: Incident Severity Coloring**
- **Setup:** Incidents with different severity levels
- **Expected:** Each severity has distinct color
- **Verify:** Critical incidents most visible, minor incidents subtle

**Scenario 6: Metric Card Updates**
- **Setup:** Layers enabled/disabled, incidents change
- **Expected:** Metric cards update in real-time
- **Verify:** Active layers count correct, incident count accurate

**Scenario 7: Real-time Updates**
- **Setup:** Enabled traffic layer with polling
- **Expected:** Traffic conditions update periodically
- **Verify:** Map refreshes without user interaction

**Scenario 8: Data Source Attribution**
- **Setup:** Multiple layers with different data sources
- **Expected:** Data source shown for each layer
- **Verify:** Source attribution accurate and clickable if applicable

---

## MAPSETTINGS COMPONENT

**File:** `/src/components/modules/MapSettings.tsx`

### Feature Description
Map Settings allows administrators to select and configure the preferred map provider for the entire fleet application. It presents a detailed comparison of available mapping services with costs, features, pros/cons, and setup requirements. Users can switch between providers and view configuration guidance.

### Target Users
- **System Administrators:** Configure map provider for organization
- **IT Managers:** Manage mapping costs and API keys
- **Fleet Administrators:** Oversee mapping platform decisions
- **Finance Officers:** Review mapping service costs
- **Operations Leads:** Ensure mapping service availability

### User Stories

```
1. As a system administrator, I want to choose the most cost-effective map provider 
   so that I can minimize expenses while meeting functionality needs

2. As an IT manager, I want to see setup requirements for each provider 
   so that I can plan implementation and configuration

3. As a fleet administrator, I want to compare features across providers 
   so that I can select the one that best fits our needs

4. As a finance officer, I want to see estimated monthly costs per provider 
   so that I can budget for mapping services

5. As an operations lead, I want to switch providers seamlessly 
   so that service continues uninterrupted during provider changes
```

### Core Functionality & Features

**Provider Options (5 Providers):**

1. **OpenStreetMap (Leaflet)**
   - Cost: FREE - Unlimited
   - Features: 100% open-source, no API key, no usage limits
   - Pros: No cost, no key needed, works immediately, active community
   - Cons: Basic styling, less features than commercial options

2. **Google Maps**
   - Cost: $200/month free credit (28,000 map loads)
   - Features: Industry-standard, Street View, real-time traffic, extensive POI
   - Pros: Best-in-class maps, familiar to users, extensive APIs
   - Cons: Requires API key, costs after free tier

3. **Mapbox**
   - Cost: 50,000 free loads/month
   - Features: Custom styles, vector tiles, 3D terrain, excellent performance
   - Pros: Beautiful maps, developer-friendly, great tools
   - Cons: Requires API key, learning curve for custom styling

4. **Apple Maps (MapKit JS)**
   - Cost: 250,000 free loads/month
   - Features: Clean design, great mobile experience, privacy-focused
   - Pros: Generous free tier, modern design, privacy benefits
   - Cons: Apple developer account needed, less mature service

5. **Azure Maps**
   - Cost: $0.50-$5/1000 loads
   - Features: Enterprise solution, GDPR compliant, Azure integration
   - Pros: Azure ecosystem, enterprise support, GDPR compliance
   - Cons: Requires Azure subscription, more expensive, complex setup

**Comparison Interface:**
- Radio button selection for provider
- Detailed comparison displayed when provider selected:
  - Name and description
  - Monthly cost
  - Advantages list (with green checkmark icons)
  - Considerations list (with warning indicators)
  - Setup requirements section
  - Link to provider setup/API key page
- Recommendation banner for cost-conscious users

**Current Provider Indicator:**
- Shows which provider is currently active
- "Current" badge on active provider
- Cannot select if already active

**API Key Setup Guidance:**
- Step-by-step setup instructions
- Links to provider setup pages
- Environment variable naming (.env configuration)
- Rebuild instructions

**Save & Apply:**
- "Save & Apply" button (disabled if no change)
- Confirmation that application will reload
- Page reload applies new provider

### Data Inputs & Outputs

**Provider Configuration:**
```typescript
interface MapProviderOption {
  id: MapProvider // "google" | "openstreetmap" | "mapbox" | "apple" | "azure"
  name: string
  description: string
  cost: string
  pros: string[]
  cons: string[]
  apiKeyRequired: boolean
  setupUrl?: string
}

type MapProvider = "google" | "openstreetmap" | "mapbox" | "apple" | "azure"
```

**Output:**
- Selected provider stored in localStorage
- Application reloaded to use new provider
- All maps switch to new provider

### API Integration Points

**Functions Used:**
- `getMapProvider()` - Retrieve current provider from localStorage
- `setMapProvider()` - Save provider to localStorage and reload
- Browser localStorage for persistence
- Environment variables for API keys

### Key Workflows

**Workflow 1: Cost-Conscious Provider Selection**
1. Administrator reviews mapping provider options
2. Finance department indicates $200/month budget limit
3. Reviews costs:
   - OpenStreetMap: FREE (preferred)
   - Mapbox: ~$100/month after free tier
   - Google Maps: $200/month after free tier
   - Azure: $500+/month (over budget)
4. Selects OpenStreetMap (no cost, unlimited usage)
5. Notes "No API key needed - ready to use!" message
6. Clicks "Save & Apply"
7. Application reloads with OpenStreetMap
8. All maps immediately switch to free provider

**Workflow 2: Feature-Rich Provider Selection**
1. Operations team needs Street View and real-time traffic
2. Compares providers by features:
   - Google Maps: Has Street View and real-time traffic
   - Mapbox: Has custom styling, no Street View
   - Alternatives don't have both features
3. Selects Google Maps
4. Reviews setup requirements
5. Notes "Ensure you have configured the API key"
6. Directs IT to get Google Maps API key
7. Once key configured, clicks "Save & Apply"
8. All maps now use Google Maps with full features

**Workflow 3: Provider Migration**
1. Organization currently using Mapbox
2. Switching to Azure Maps for enterprise features
3. Administrator navigates to MapSettings
4. Selects Azure Maps from radio options
5. Reviews pros/cons and setup requirements
6. Clicks link to Azure Maps setup page
7. IT team configures Azure Maps account and key
8. Once ready, administrator clicks "Save & Apply"
9. Application reloads (no downtime to users)
10. All maps now on Azure platform

**Workflow 4: Free Tier Upgrade**
1. Organization using OpenStreetMap (free)
2. Needs premium features as they scale
3. Evaluates upgrade options:
   - Mapbox (50K loads/month free) - good middle ground
   - Google Maps (28K loads/month free) - more features
4. Projects usage will exceed free tiers
5. Selects Google Maps for feature set
6. Reviews cost: $200 monthly credit covers most usage
7. Links to Google Cloud Console for API key setup
8. After setup, switches provider
9. Scale up with confidence of more load capacity

### Test Scenarios

**Scenario 1: Provider Selection**
- **Setup:** Multiple providers displayed with options
- **Expected:** Can select each provider via radio button
- **Verify:** Details for selected provider display correctly

**Scenario 2: Cost Comparison**
- **Setup:** View all providers' cost information
- **Expected:** Costs clearly displayed and comparable
- **Verify:** Can identify most cost-effective option

**Scenario 3: Feature Comparison**
- **Setup:** Select different providers to compare
- **Expected:** Features and limitations clearly shown
- **Verify:** Can identify feature differences between providers

**Scenario 4: Setup Instructions**
- **Setup:** Select provider requiring API key
- **Expected:** Setup steps displayed with links
- **Verify:** Instructions clear, links functional

**Scenario 5: Current Provider Indicator**
- **Setup:** One provider currently active
- **Expected:** Marked with "Current" badge, button disabled
- **Verify:** Cannot "save" if no change made

**Scenario 6: Save and Apply**
- **Setup:** Select different provider and click save
- **Expected:** Page reloads with new provider
- **Verify:** New provider active after reload, localStorage updated

**Scenario 7: API Key Warning**
- **Setup:** Select provider requiring API key
- **Expected:** Warning message displayed
- **Verify:** Message indicates API key must be configured

**Scenario 8: Free Provider**
- **Setup:** Select OpenStreetMap
- **Expected:** Success message "No API key needed"
- **Verify:** Can save immediately without configuration

---

## UNIVERSALMAP COMPONENT

**File:** `/src/components/UniversalMap.tsx`

### Feature Description
Universal Map is a wrapper component that provides abstraction over multiple map providers, allowing the application to support Google Maps, OpenStreetMap, Mapbox, Apple Maps, and Azure Maps. It automatically loads the user's preferred provider from settings and renders the appropriate map implementation, with fallback to OpenStreetMap.

### Target Users
- **All Fleet Users:** Access maps throughout application
- **Administrators:** Via settings component, select preferred provider
- **Integration Teams:** Plug in new map providers without changing all components

### User Stories

```
1. As a fleet user, I want maps to use my organization's preferred provider 
   so that I have consistent, optimal experience across the application

2. As an administrator, I want to switch map providers without code changes 
   so that I can adapt to organizational needs easily

3. As a developer, I want a consistent map interface 
   so that all components work with any provider

4. As an organization, I want a free mapping option available by default 
   so that we can start using the application without vendor lock-in
```

### Core Functionality & Features

**Provider Support:**
- Google Maps (via @react-google-maps/api)
- OpenStreetMap/Leaflet (via react-leaflet)
- Mapbox (via mapbox-gl)
- Azure Maps (via azure-maps)
- Apple Maps (coming soon, falls back to Leaflet)

**Provider Selection Logic:**
1. Check if provider explicitly passed via props
2. If not, load from localStorage (user/organization preference)
3. Validate provider string
4. Default to OpenStreetMap (free, no setup required)

**Map Props Interface:**
```typescript
interface UniversalMapProps {
  vehicles?: Vehicle[]
  facilities?: GISFacility[]
  cameras?: TrafficCamera[]
  showVehicles?: boolean
  showFacilities?: boolean
  showCameras?: boolean
  showRoutes?: boolean
  center?: [number, number]
  zoom?: number
  className?: string
  provider?: MapProvider // Optional override
}
```

**Features Passed to Provider:**
- Vehicle markers with location and status
- Facility markers with type-specific icons
- Traffic camera markers
- Route geometry visualization
- Click handlers for marker info windows
- Customizable center and zoom

**Loading State:**
- Shows spinner while provider loads
- Displays "Loading map..." message
- Handles provider load failures gracefully

**Provider Routing:**
```
UniversalMap
├── if provider === "google" → GoogleMap
├── if provider === "mapbox" → MapboxMap
├── if provider === "azure" → AzureMap
├── if provider === "apple" → (fallback to Leaflet for now)
└── default → LeafletMap (OpenStreetMap)
```

### Data Inputs & Outputs

**Input Props:**
- Vehicles array with locations
- Facilities array with locations
- Cameras array with coordinates
- Visibility flags for each layer
- Center coordinates (defaults to USA center)
- Zoom level (defaults to 4)
- Optional provider override

**Output:**
- Rendered map with markers
- Interactive map with click handlers
- Info windows on marker click

### API Integration Points

**Local Storage:**
- Reads `fleet_map_provider` for user preference
- Falls back to OpenStreetMap if not set
- Can be updated via MapSettings component

**Provider APIs:**
- Each provider handles its own authentication
- API keys from environment variables
- Provider-specific error handling

### Key Workflows

**Workflow 1: First-Time User (Default to Free)**
1. New user opens application
2. UniversalMap is needed for view
3. No provider set in localStorage
4. Defaults to OpenStreetMap (free)
5. No API key needed
6. Map loads immediately
7. Works without any setup

**Workflow 2: Provider Preference Set**
1. Organization administrator sets Google Maps as preference
2. Stores in MapSettings: localStorage["fleet_map_provider"] = "google"
3. User navigates to map view
4. UniversalMap loads
5. Detects preference: "google"
6. Validates Google Maps API key configured
7. Renders GoogleMap component
8. All components using UniversalMap show Google Maps

**Workflow 3: Provider Override via Props**
1. Special component needs specific provider (e.g., Mapbox)
2. Passes `provider="mapbox"` prop to UniversalMap
3. UniversalMap ignores stored preference
4. Uses passed provider: Mapbox
5. Allows flexibility for specialized views

**Workflow 4: Provider Migration**
1. Application currently on OpenStreetMap
2. Organization upgrades to Mapbox
3. Administrator changes setting in MapSettings
4. UniversalMap detects new provider: "mapbox"
5. Validates Mapbox API key
6. Reloads with Mapbox provider
7. All maps immediately switch to Mapbox
8. No code changes needed in components

**Workflow 5: Fallback on Error**
1. Google Maps fails to load (network error)
2. GoogleMap component throws error
3. UniversalMap catches error
4. Could fallback to Leaflet as backup
5. User continues with reduced functionality
6. Application remains usable

### Test Scenarios

**Scenario 1: Default Provider**
- **Setup:** New session, no localStorage
- **Expected:** Maps use OpenStreetMap
- **Verify:** Leaflet map renders, no API key errors

**Scenario 2: Stored Preference**
- **Setup:** localStorage has "google" preference, API key configured
- **Expected:** GoogleMap renders
- **Verify:** Google maps interface visible

**Scenario 3: Provider Override**
- **Setup:** Pass `provider="mapbox"` prop despite different stored preference
- **Expected:** Mapbox renders
- **Verify:** Mapbox interface shown, ignores stored preference

**Scenario 4: Missing API Key**
- **Setup:** Google Maps preference but no API key
- **Expected:** Error message shown
- **Verify:** User directed to configure API key

**Scenario 5: Valid Provider String**
- **Setup:** Arbitrary provider string like "invalid"
- **Expected:** Falls back to OpenStreetMap
- **Verify:** Validation works, fallback successful

**Scenario 6: Vehicle Markers**
- **Setup:** Pass vehicles array to UniversalMap
- **Expected:** Markers appear for each vehicle
- **Verify:** Correct number of markers, correct positions

**Scenario 7: Facilities Display**
- **Setup:** Pass facilities with showFacilities=true
- **Expected:** Facility markers appear with type icons
- **Verify:** Correct facility icons, correct locations

**Scenario 8: Loading State**
- **Setup:** Load map on slow connection
- **Expected:** Spinner shown while loading
- **Verify:** Loading message displays until map ready

---

## GOOGLEMAP COMPONENT

**File:** `/src/components/GoogleMap.tsx`

### Feature Description
GoogleMap is a specialized map implementation using Google Maps JavaScript API. It provides a performant, feature-rich map with Street View support, real-time traffic layers, customizable styling, and interactive markers for vehicles, facilities, and cameras. It's optimized for desktop and mobile experiences.

### Target Users
- **Fleet Users:** Primary map interface when Google Maps is selected
- **Street View Users:** Inspect locations and surroundings
- **Traffic Monitoring Teams:** View live traffic conditions
- **Mobile App Users:** Responsive map on mobile devices
- **Organizations:** Who pay for or have negotiated Google Maps pricing

### User Stories

```
1. As a dispatcher, I want to see my fleet on Google Maps 
   so that I have access to familiar, feature-rich mapping interface

2. As a driver coordinator, I want to use Street View to inspect delivery locations 
   so that I can prepare drivers for the environment they'll encounter

3. As a fleet manager, I want to see real-time traffic on the map 
   so that I understand current conditions affecting my vehicles

4. As a mobile user, I want the map to work on my phone or tablet 
   so that I can monitor my fleet on the go

5. As a traffic analyst, I want to examine historical traffic patterns 
   so that I can identify bottlenecks and plan better routes
```

### Core Functionality & Features

**Map Initialization:**
- Loads Google Maps JavaScript API
- Requires API key (from environment variable)
- LoadScript component handles async loading
- Error handling for missing or invalid API key
- Loading spinner during map load

**Map Controls:**
- Zoom controls (default enabled)
- Street View control
- Map type control (road/satellite/hybrid/terrain)
- Fullscreen control
- Pan controls

**Map Type Options:**
- **Roadmap:** Default street map
- **Satellite:** Satellite imagery
- **Hybrid:** Satellite with street labels
- **Terrain:** Terrain and relief features

**Marker Types:**

1. **Vehicle Markers**
   - Colored circles based on vehicle status
   - Colors: Green (active), Gray (idle), Red (emergency), Blue (charging), Orange (service), Dark Gray (offline)
   - Sized to be visible but not overwhelming
   - Click to show info window

2. **Facility Markers**
   - Custom icons by facility type
   - Blue (office), Purple (depot), Yellow (service center), Red (fueling station)
   - Click to show facility info

3. **Camera Markers**
   - Blue circles for operational cameras
   - Gray circles for offline cameras
   - Click to show camera info and stream link

**Info Windows:**
- Click marker to open info window
- **Vehicle Info:**
  - Vehicle name
  - Type and status
  - Driver assignment
  - Current location/address
- **Facility Info:**
  - Facility name
  - Type and status
  - Capacity information
  - Address
- **Camera Info:**
  - Camera name
  - Address and cross streets
  - Operational status
  - Link to live stream

**Auto-Fit Bounds:**
- Automatically fits map to show all markers
- Respects max zoom (doesn't zoom in past zoom level 15)
- Responsive to data changes

**Styling:**
- Clean, professional appearance
- Works in light and dark themes
- Responsive layout (100% width/height)
- Minimum height of 500px

### Data Inputs & Outputs

**Input Props:**
```typescript
interface GoogleMapProps {
  vehicles?: Vehicle[] // Array of vehicle objects with locations
  facilities?: GISFacility[] // Array of facility objects
  cameras?: TrafficCamera[] // Array of traffic cameras
  showVehicles?: boolean // Toggle vehicle visibility
  showFacilities?: boolean // Toggle facility visibility
  showCameras?: boolean // Toggle camera visibility
  showRoutes?: boolean // Toggle route visibility (not yet implemented)
  mapStyle?: "roadmap" | "satellite" | "hybrid" | "terrain"
  center?: [number, number] // [lng, lat] - defaults to USA center
  zoom?: number // Map zoom level (default 4)
  className?: string // CSS class for container
}
```

**Output:**
- Rendered interactive map
- Marker interactions and info windows
- Map controls and navigation

### API Integration Points

**Google Maps API:**
- Maps JavaScript API v3
- Requires VITE_GOOGLE_MAPS_API_KEY environment variable
- Free tier: $200/month credit (28,000 map loads)
- Premium features available with paid tier

**Data Sources:**
- Vehicles from fleet data
- Facilities from facility management system
- Cameras from traffic monitoring systems
- Real-time position updates (if implemented)

### Key Workflows

**Workflow 1: Initial Map Load**
1. GoogleMap component mounts
2. Checks for API key in environment
3. Shows error if missing key
4. LoadScript begins loading Google Maps library
5. Shows loading spinner while loading
6. Once library loaded, map renders
7. Vehicles and facilities populate as data loads
8. Map auto-fits to show all markers
9. User can interact with map

**Workflow 2: Inspect Vehicle**
1. Dispatcher opens fleet map
2. Sees 25 vehicle markers (green, orange, red)
3. Clicks on specific vehicle (green circle)
4. Info window opens showing:
   - Vehicle name: "Truck #42"
   - Status: "Active"
   - Driver: "John Smith"
   - Location: "123 Main St, Boston, MA"
5. Can use Street View to see surrounding area
6. Closes info window by clicking X

**Workflow 3: Check Facility Capacity**
1. Fleet manager needs to route vehicles
2. Checks facility locations on map
3. Clicks on depot facility (purple icon)
4. Info window shows:
   - Name: "Boston Depot"
   - Type: "Depot"
   - Status: "Operational"
   - Capacity: "15 vehicles"
5. Notes capacity info for routing decision

**Workflow 4: Monitor Traffic Camera**
1. Dispatcher monitoring highway congestion
2. Toggles "Show Cameras" on map
3. Camera markers appear (blue circles) at highway locations
4. Clicks on camera near congestion area
5. Info window shows camera details and "View Live Stream" link
6. Clicks link to view live traffic conditions
7. Can make informed routing decisions

**Workflow 5: Switch Map Styles**
1. User clicks map type control
2. Options: Road, Satellite, Hybrid, Terrain
3. Selects "Satellite" to see aerial view
4. Map switches to satellite imagery
5. Markers remain visible
6. Can analyze geographic features
7. Switches back to Road view for better street labels

**Workflow 6: Zoom to Area**
1. Initial map shows entire USA
2. User zooms in on Northeast region
3. Map zooms from zoom level 4 to 10
4. More vehicles become visible, details clearer
5. Can see specific streets and landmarks
6. Zoom controls allow fine-tuning
7. Or use scroll wheel to zoom

### Test Scenarios

**Scenario 1: API Key Validation**
- **Setup:** Missing or invalid VITE_GOOGLE_MAPS_API_KEY
- **Expected:** Error message displayed with setup instructions
- **Verify:** User directed to configure API key correctly

**Scenario 2: Vehicle Marker Display**
- **Setup:** 10 vehicles with various statuses
- **Expected:** Correct number of markers with status colors
- **Verify:** Green for active, orange for service, etc.

**Scenario 3: Facility Icons**
- **Setup:** Different facility types
- **Expected:** Correct icon for each facility type
- **Verify:** Office=blue, Depot=purple, etc.

**Scenario 4: Info Window Content**
- **Setup:** Click vehicle marker
- **Expected:** Info window with vehicle details
- **Verify:** All info fields populated correctly

**Scenario 5: Auto-Fit Bounds**
- **Setup:** Multiple markers across geographic area
- **Expected:** Map auto-zooms to fit all markers
- **Verify:** All markers visible, appropriate zoom level

**Scenario 6: Map Type Switching**
- **Setup:** Start with roadmap, switch to satellite
- **Expected:** Map style changes, markers remain
- **Verify:** Can switch between all 4 map types

**Scenario 7: Zoom Interaction**
- **Setup:** Scroll wheel zoom on map
- **Expected:** Zoom in/out responsive to scroll
- **Verify:** Zoom level updates, content adjusts

**Scenario 8: Responsive Design**
- **Setup:** Resize browser window, test mobile viewport
- **Expected:** Map adjusts to container size
- **Verify:** Works on desktop and mobile sizes

**Scenario 9: Street View Integration**
- **Setup:** Click Street View control
- **Expected:** Street View loads for map center
- **Verify:** Can navigate Street View, return to map

**Scenario 10: Popup Closure**
- **Setup:** Open info window, click X or outside
- **Expected:** Info window closes
- **Verify:** Can open different marker's info without interference

---

## Summary & Integration Points

### Cross-Component Data Flow

```
MapSettings ─────┐
                 ├─→ localStorage["fleet_map_provider"]
                 │
UniversalMap ────┤─→ GoogleMap | MapboxMap | LeafletMap | AzureMap
    ↓            │
Various Components ┴→ Shows map with vehicles/facilities/cameras
    ↓
RouteOptimizer ──→ Uses MapboxMap directly for route visualization
RouteManagement ─→ Uses UniversalMap
AdvancedRouteOptimization → Uses UniversalMap
GISCommandCenter → Uses UniversalMap
GeofenceManagement → Uses UniversalMap
EnhancedMapLayers → Uses UniversalMap with layers
ArcGISIntegration → Adds layers to UniversalMap
```

### API Integration Summary

**Route Optimization APIs:**
- `GET /api/vehicles` - List available vehicles
- `POST /api/route-optimization/optimize` - Perform optimization
- `GET /api/route-optimization/jobs` - Get optimization history
- Mapbox Geocoding API - Convert addresses to coordinates

**Geofence APIs:**
- `GET /api/geofences` - List geofences
- `POST /api/geofences` - Create geofence
- `PUT /api/geofences/:id` - Update geofence
- `DELETE /api/geofences/:id` - Delete geofence

**Map Data APIs:**
- `useFleetData()` - Vehicles, routes, facilities
- `useFacilities()` - Facility information
- `useSafetyIncidents()` - Traffic incidents
- `useChargingStations()` - EV charging locations
- `weather.gov API` - Weather data and alerts
- Google Traffic API - Real-time traffic
- State DOT APIs - Traffic cameras

### Recommended Test Coverage

**Unit Tests:**
- Component props validation
- State management (useState, useEffect)
- Helper functions (color coding, calculations)
- API call handling

**Integration Tests:**
- Component interaction (dialogs, forms)
- Data flow between parent/child components
- API integration (mocking API calls)
- Map provider switching

**E2E Tests:**
- Complete workflows (create route, optimize, view on map)
- Multi-step processes (create geofence, set triggers, monitor)
- Provider switching and data persistence
- Error handling and recovery

### Performance Considerations

1. **Map Provider Selection:** Free providers (OpenStreetMap) have unlimited usage
2. **API Rate Limiting:** Commercial providers have limits, cache results where possible
3. **Marker Clustering:** For large fleets (500+ vehicles), implement marker clustering
4. **Lazy Loading:** Load map components only when needed
5. **Data Updates:** Implement smart updates (delta-only, not full refresh)

### Security Considerations

1. **API Keys:** Store in environment variables, never in source code
2. **ArcGIS Authentication:** Support token-based and OAuth auth
3. **Data Isolation:** Multi-tenant isolation (tenantId in queries)
4. **Permissions:** Role-based access control (admin, fleet_manager, dispatcher, driver)
5. **Audit Logging:** Log all geofence/route/optimization changes

---

**Document Version:** 1.0
**Last Updated:** November 11, 2025
**Status:** Comprehensive Feature Documentation Complete

