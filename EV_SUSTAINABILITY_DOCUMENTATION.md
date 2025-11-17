# Fleet EV & Sustainability Features Documentation

## Executive Summary

This document provides comprehensive documentation of the Electric Vehicle (EV) charging management and sustainability tracking features in the Fleet management application. These features enable fleet operators to efficiently manage EV charging infrastructure, track fuel consumption, and monitor environmental impact.

---

## Table of Contents

1. [Feature 1: EV Charging Management](#feature-1-ev-charging-management)
2. [Feature 2: EV Charging Dashboard](#feature-2-ev-charging-dashboard)
3. [Feature 3: Fuel Management](#feature-3-fuel-management)
4. [Feature 4: Carbon Footprint Tracker](#feature-4-carbon-footprint-tracker)
5. [Integration Architecture](#integration-architecture)
6. [Test Scenarios](#test-scenarios)

---

# Feature 1: EV Charging Management

## Feature Overview

**Feature Name:** EV Charging Management System
**Status:** Active
**Component:** `EVChargingManagement.tsx`
**API Routes:** `/api/ev/*`
**Key Technology:** OCPP 2.0.1 Protocol (Open Charge Point Protocol)

### Feature Description

The EV Charging Management system provides a comprehensive interface for fleet managers to register and maintain charging station infrastructure, monitor active charging sessions, track energy consumption, and manage tariff optimization. The system integrates with OCPP-compliant charging stations (ChargePoint, EVBox, ABB, etc.) for real-time control and monitoring.

---

## Target Users

1. **Fleet Managers** - Primary users managing charging infrastructure strategy
2. **Operations Managers** - Monitor station availability and session status
3. **Drivers** - View available charging stations and reserve time slots
4. **Facility Managers** - Maintain charging station hardware and configuration
5. **Energy Coordinators** - Optimize charging schedules for cost and grid impact

---

## User Stories

### Story 1.1: Station Infrastructure Management
**As a** Fleet Manager,
**I want to** register and configure multiple EV charging stations across different depot locations,
**so that** I can create a distributed charging network that supports my fleet's charging needs.

**Acceptance Criteria:**
- Add new charging stations with details: name, location (address, lat/lng), charger type
- Configure charger specifications: power output (kW), connector types, network provider
- Set station type (depot, public, home)
- Mark stations as available/unavailable
- View utilization metrics per station
- Edit existing station configurations
- Track total energy delivered per station

---

### Story 1.2: Real-Time Session Monitoring
**As an** Operations Manager,
**I want to** view all active charging sessions with detailed real-time metrics,
**so that** I can monitor charging progress and identify issues immediately.

**Acceptance Criteria:**
- Display list of all active charging sessions
- Show vehicle number, driver name, station name, and connection time
- Display energy delivered (kWh) and current state of charge (%)
- Show charging cost and tariff information
- Indicate session status (active, completed, interrupted, scheduled)
- Monitor smart charging status and carbon offset
- End active sessions remotely with confirmation

---

### Story 1.3: Charging Session Scheduling
**As a** Fleet Coordinator,
**I want to** schedule charging sessions for off-peak hours to minimize energy costs,
**so that** I can reduce operating costs while supporting grid stability.

**Acceptance Criteria:**
- Create smart charging schedules with target state of charge (20-100%)
- Specify completion time for scheduling algorithm
- Enable "prefer off-peak" option for tariff optimization
- Enable "prefer renewable" option for renewable energy preference
- Set maximum charge rate limits if needed
- System adjusts charging start time based on grid availability
- Track cost savings from scheduled charging

---

### Story 1.4: Cost Analysis and Optimization
**As a** Finance Manager,
**I want to** analyze charging costs by session, station, and time period,
**so that** I can identify cost-saving opportunities and optimize charging strategies.

**Acceptance Criteria:**
- View total energy delivered and total cost metrics
- Calculate average cost per kWh
- Show peak vs off-peak pricing impact
- Identify stations with highest cost per session
- Display demand charge information
- Generate monthly cost trends
- Compare actual vs. scheduled charging efficiency

---

### Story 1.5: Carbon Offset Tracking
**As a** Sustainability Officer,
**I want to** measure and report carbon offsets from EV charging,
**so that** I can quantify environmental benefits and support ESG reporting.

**Acceptance Criteria:**
- Calculate CO2 saved per session vs. ICE baseline
- Display total CO2 offset by session
- Show renewable energy percentage used
- Track emissions reduction trends over time
- Export carbon data for ESG reports
- Calculate tree equivalent from carbon savings

---

## Key Workflows

### Workflow 1: Register New Charging Station

```
Fleet Manager Flow:
1. Navigate to EV Charging Management
2. Click "Add Station" button
3. Enter station details:
   - Name: "Main Depot - Station 3"
   - Location: Address, latitude, longitude
   - Type: "depot" (from dropdown)
   - Charger Type: "Level 2" or "DC Fast"
   - Power Output: 7.2 kW (for Level 2) or 50 kW (for DC Fast)
   - Network Provider: "ChargePoint"
   - Connector Types: Select J1772, CCS, CHAdeMO
4. Toggle "Available for Use"
5. Click "Add Station"
6. System creates record and establishes OCPP connection
7. Confirmation: "Station added successfully"
8. Station appears in Charging Stations list
9. Station integrates with live monitoring dashboard
```

**Data Inputs:**
- Station name, location coordinates
- Charger specifications (power, type)
- Network provider information
- Connector compatibility list

**Data Outputs:**
- Station ID (unique identifier)
- Station created timestamp
- Online/offline status
- Connection to OCPP protocol

---

### Workflow 2: Monitor Active Charging Session

```
Operations Manager Flow:
1. Open EV Charging Dashboard
2. View active sessions in real-time
3. Observe key metrics:
   - Energy delivered: 25.5 kWh
   - Session cost: $8.92
   - State of charge: 15% → ~65%
   - Smart charging: Enabled
   - Tariff type: Time-of-Use (TOU)
4. Monitor session progress
5. If issue detected, click "End Session"
6. Confirm termination
7. Session status changes to "completed" or "interrupted"
8. Generate charging receipt with CO2 offset info
```

**Session Metrics Tracked:**
- Start time, start SOC, start meter reading
- Current energy delivered (kWh)
- Current cost ($)
- Elapsed time
- Average power (kW)
- Target vs. actual charge rate
- Renewable energy percentage

---

### Workflow 3: Create Smart Charging Schedule

```
Fleet Coordinator Flow:
1. Navigate to Smart Charging Schedules
2. Select vehicle from dropdown
3. Set charging parameters:
   - Target SOC: 80%
   - Desired completion time: Tomorrow 6:00 AM
   - Prefer off-peak: Toggle ON
   - Prefer renewable: Toggle ON
   - Max charge rate: 6.6 kW
4. Submit schedule
5. System calculates optimal start time:
   - Analyzes off-peak tariff windows
   - Checks renewable generation forecast
   - Calculates required charge duration
   - Returns start time: 11:00 PM (13 hours before deadline)
6. Schedule confirmation with projected savings
7. Vehicle automatically charges at scheduled time
8. Session history shows "smartCharging: true"
9. Cost comparison: Scheduled: $8.50 vs. Immediate: $12.00 (29% savings)
```

---

### Workflow 4: End Charging Session (Remote)

```
1. Locate active session in table
2. Click "End" button in Actions column
3. OCPP RemoteStopTransaction message sent
4. Station receives stop command
5. Charging halts gracefully
6. Session captured:
   - endTime: Current timestamp
   - endSOC: Final battery percentage
   - duration: Total charging minutes
   - status: "completed"
7. Cost calculated and finalized
8. CO2 offset computed
9. Receipt generated and stored
10. Notification sent to driver
11. Session logged for audit trail
```

---

## Core Functionality & Features

### Feature Set Matrix

| Feature | Capability | Status |
|---------|-----------|--------|
| **Station Management** | Add/Edit/Delete stations | Implemented |
| | Register with OCPP protocol | Implemented |
| | Configure charger types (Level 1/2/DC Fast) | Implemented |
| | Location-based search | Available via API |
| | Utilization metrics | Real-time |
| **Session Management** | Real-time monitoring | Active |
| | Remote start/stop | Via OCPP |
| | Session history tracking | Database-backed |
| | Cost calculation | Per-session |
| | Energy tracking (kWh) | Meter-based |
| **Smart Charging** | Off-peak optimization | Scheduling algorithm |
| | Renewable preference | Integration-ready |
| | Dynamic pricing support | TOU tariff support |
| | Demand response | Reserve capacity |
| | Vehicle reservation system | Available |
| **Reporting** | Energy reports | Available |
| | Cost reports | Available |
| | Carbon reports | CO2 tracking |
| | Station utilization reports | Real-time |

---

## Data Inputs and Outputs

### Input Data Structures

```typescript
// ChargingStation Input
{
  name: string                    // e.g., "Main Depot - Station 1"
  location: {
    address: string               // e.g., "123 Fleet St, Tampa, FL"
    lat: number                   // Latitude
    lng: number                   // Longitude
  }
  stationType: "depot" | "public" | "home"
  networkProvider?: string        // e.g., "ChargePoint"
  chargerType: "level-1" | "level-2" | "dc-fast"
  powerOutput: number            // kW (7.2 for Level 2, 50 for DC Fast)
  connectorType: string[]        // e.g., ["J1772", "CCS"]
  available: boolean
  occupied: boolean
  status: "online" | "offline" | "maintenance"
}

// ChargingSession Input
{
  vehicleId: string
  driverId?: string
  stationId: string
  startTime: ISO 8601 string
  startSOC: number              // 0-100%
  smartCharging: boolean
  tariffType: "tou" | "flat" | "demand"
  maxChargeRate?: number        // kW
  targetSOC?: number            // 0-100%
}

// Smart Charging Schedule Input
{
  vehicleId: number
  targetSoC: number             // 20-100%
  completionTime: ISO datetime
  preferOffPeak?: boolean
  preferRenewable?: boolean
  maxChargeRate?: number        // kW
}
```

### Output Data Structures

```typescript
// Charging Session Output
{
  id: string
  vehicleNumber: string
  driverName: string
  stationName: string
  startTime: ISO string
  endTime?: ISO string
  duration?: number            // minutes
  energyDelivered: number      // kWh
  cost: number                 // USD
  startSOC: number            // %
  endSOC?: number             // %
  status: "active" | "completed" | "interrupted" | "scheduled"
  peakDemandCharge: number
  carbonOffset: number        // kg CO2
  efficiency: number          // kWh/mile
  tariffApplied: string
}

// Fleet Summary Output
{
  totalStations: number
  availableStations: number
  activeSessions: number
  totalEnergy: number         // kWh (completed sessions)
  totalCost: number          // USD
  totalCarbon: number        // kg CO2 saved
  averageCostPerKWh: number
  stationUtilization: number // %
}
```

---

## Integration Points

### 1. OCPP 2.0.1 Protocol Integration

**Service:** `OCPPService` (WebSocket-based)
**Supported Charger Brands:** ChargePoint, EVBox, ABB, Tesla SuperCharger, Electrify America

**Key Integrations:**
```
Remote Start Transaction
├─ POST /api/ev/chargers/{id}/remote-start
├─ OCPP Message: RemoteStartTransaction
├─ Parameters: connectorId, vehicleId, idTag
└─ Response: Session initiated or error

Remote Stop Transaction
├─ POST /api/ev/sessions/{transactionId}/stop
├─ OCPP Message: RemoteStopTransaction
├─ Parameters: transactionId, reason
└─ Response: Session terminated

Real-Time Status Monitoring
├─ OCPP: StatusNotification (push)
├─ OCPP: MeterValues (periodic)
├─ OCPP: TransactionEvent (state changes)
└─ Database: Update charging_sessions table
```

### 2. Vehicle Database Integration

**Tables Involved:**
- `vehicles` - Vehicle registry
- `charging_sessions` - Session history
- `charging_stations` - Station configuration
- `carbon_footprint_log` - Environmental tracking

**Relationships:**
```
Vehicle (1) ──→ (many) ChargingSession
Vehicle (1) ──→ (many) CarbonFootprintLog
ChargingStation (1) ──→ (many) ChargingSession
Driver (1) ──→ (many) ChargingSession
```

### 3. Energy & Tariff Integration

**Data Sources:**
- Real-time energy rates from grid operator
- TOU (Time-of-Use) tariff schedules
- Renewable energy generation data
- Demand charge windows

**Calculations:**
```
Cost = Energy(kWh) × Rate($/kWh) + DemandCharge($)
Optimization = Shift charging to off-peak hours
Savings = (Peak Rate - Off-peak Rate) × Energy
```

### 4. Carbon Footprint Integration

**Baseline:**
- ICE Vehicle: ~8,887 grams CO2/gallon of fuel
- EV Charging: Grid mix CO2 intensity (varies by region)
- Renewable Percentage: Adjusts actual emissions

**Calculation:**
```
Carbon Offset = (ICE Emissions - EV Emissions)
             = (Miles × 8.887 g/mile) - (kWh × Grid Intensity × Renewable%)
```

### 5. API Routes & Endpoints

```
GET /api/ev/chargers
  → List all charging stations with filters
  → Parameters: latitude, longitude, radius (miles)
  
GET /api/ev/chargers/{id}/status
  → Get real-time station status and connector info
  
POST /api/ev/chargers/{id}/reserve
  → Create charging station reservation
  → Body: stationId, vehicleId, driverId, startTime, endTime

POST /api/ev/chargers/{id}/remote-start
  → Initiate charging session via OCPP
  
POST /api/ev/sessions/{transactionId}/stop
  → Stop active charging session via OCPP
  
GET /api/ev/sessions/active
  → Get all currently active charging sessions
  
POST /api/ev/vehicles/{id}/charge-schedule
  → Create smart charging schedule
  
GET /api/ev/station-utilization
  → Get utilization metrics for all stations
  
GET /api/ev/vehicles/{id}/charging-history
  → Get historical charging sessions for vehicle
```

---

# Feature 2: EV Charging Dashboard

## Feature Overview

**Feature Name:** EV Charging Dashboard
**Status:** Active
**Component:** `EVChargingDashboard.tsx`
**Type:** Real-time monitoring dashboard

### Feature Description

The EV Charging Dashboard provides a centralized, real-time view of the entire charging infrastructure's operational status. Fleet managers can monitor active sessions, station availability, utilization rates, and energy consumption at a glance with automatic 30-second refresh intervals.

---

## Target Users

1. **Operations Managers** - Monitor fleet charging operations
2. **Fleet Managers** - Track infrastructure performance
3. **Dispatch Coordinators** - Coordinate vehicle charging scheduling
4. **Facility Managers** - Manage charging station maintenance windows
5. **Executives** - Review fleet utilization KPIs

---

## User Stories

### Story 2.1: Real-Time Fleet Overview
**As an** Operations Manager,
**I want to** see a real-time overview of all charging stations and active sessions,
**so that** I can quickly assess fleet charging status and respond to issues.

**Acceptance Criteria:**
- Dashboard loads and auto-refreshes every 30 seconds
- Display key metrics: online stations, available stations, active sessions
- Color-coded status indicators (green=available, blue=charging, yellow=reserved, red=faulted)
- Show energy delivered today across fleet
- Display average station utilization percentage
- Loading indicator while fetching data

---

### Story 2.2: Station Status Monitoring
**As a** Facility Manager,
**I want to** monitor individual charging station status and connector availability,
**so that** I can plan maintenance and address availability issues.

**Acceptance Criteria:**
- View all stations in grid or list format
- Show status badge (Available, Charging, Reserved, Unavailable, Faulted)
- Display available/total connectors per station
- Power type and max power output (kW)
- Location information
- Show pricing (off-peak and peak rates)
- Reserve or start charging buttons for available stations

---

### Story 2.3: Active Session Control
**As a** Dispatcher,
**I want to** control active charging sessions remotely,
**so that** I can adjust charging in response to operational needs.

**Acceptance Criteria:**
- View detailed information for each active session
- Display vehicle name, driver, station, and current metrics
- Show energy delivered, duration, power level, state of charge
- Progress bar showing charge progress to target SOC
- Stop Charging button with confirmation
- Automatic update of session status
- Session receipt generated upon completion

---

### Story 2.4: Station Utilization Analysis
**As a** Fleet Manager,
**I want to** analyze station utilization to identify capacity bottlenecks,
**so that** I can make data-driven decisions on infrastructure expansion.

**Acceptance Criteria:**
- View utilization percentage per station
- Show sessions today count
- Display total energy delivered per station
- Visual progress bar for utilization level
- Identify peak utilization hours
- Compare utilization across locations
- Export utilization data for planning

---

## Key Workflows

### Workflow 1: Open Dashboard and Monitor Status

```
Operations Manager Flow:
1. Navigate to "EV Charging Dashboard"
2. Dashboard loads with auto-refresh (30s interval)
3. View key metrics in header:
   - Online Stations: 8/10
   - Available Connectors: 6
   - Active Sessions: 2
   - Energy Delivered: 67.8 kWh
   - Avg Utilization: 45%
4. Switch tabs to view:
   - Overview (summary cards)
   - Stations (all stations in detail)
   - Active Sessions (real-time monitoring)
   - Utilization (performance metrics)
5. Click refresh button for immediate update
6. Monitor continues with automatic updates
```

---

### Workflow 2: View Detailed Active Session

```
Dispatcher Flow:
1. Navigate to "Active Sessions" tab
2. Select a session to view details
3. Observe:
   - Vehicle: "Tesla Model 3"
   - Driver: "John Smith"
   - Station: "Main Depot - Station 2"
   - Energy Delivered: 45.3 kWh
   - Duration: 2h 15m
   - Avg Power: 20.1 kW
   - State of Charge: 15% → 95%
   - Target SOC: 95%
   - Progress bar shows 87% completion
4. View historical session data
5. If intervention needed, click "Stop Charging"
6. Confirm termination
7. Session records and generates receipt
```

---

### Workflow 3: Create Reservation

```
Dispatcher Flow:
1. Navigate to "Stations" tab
2. Find station with available connectors
3. Click "Reserve" button on station card
4. Reservation dialog opens:
   - Select vehicle from dropdown
   - Enter desired start time
   - Enter desired end time (duration needed)
5. System checks availability for time window
6. Confirm reservation
7. Reservation confirmed:
   - Reservation ID generated
   - Calendar slot marked as reserved
   - Status shows "Reserved" (yellow)
8. Available connectors count decreases
9. Notification sent to driver
```

---

## Core Functionality

### Dashboard Metrics

```
Key Metrics Card Set:
├─ Online Stations
│  ├─ Display: X/Y (online/total)
│  ├─ Available: Count ready for charging
│  └─ Status: Green if >80% online
├─ Active Sessions
│  ├─ Display: Count of actively charging vehicles
│  ├─ Trend: Increasing/decreasing
│  └─ Status: Blue if normal
├─ Energy Delivered
│  ├─ Display: Total kWh (today)
│  ├─ Rate: kWh per hour
│  └─ Format: ###.## kWh
└─ Avg Utilization
   ├─ Display: Percentage
   ├─ Calculation: (Used Connectors / Total) × 100
   └─ Status: Color coded
```

### Tab Navigation

```
Overview Tab
├─ Charging Stations (first 5)
├─ Active Sessions (first 5)
├─ Recent activity
└─ Quick action buttons

Stations Tab
├─ All stations in grid format
├─ 3-column responsive layout
├─ Station details card
│  ├─ Name and location
│  ├─ Power type and max power
│  ├─ Available connectors
│  ├─ Pricing information
│  ├─ Reserve button
│  └─ Start button
└─ Filter and sort options

Sessions Tab
├─ All active sessions
├─ Session detail card
│  ├─ Vehicle and driver info
│  ├─ Station name
│  ├─ Energy, duration, power metrics
│  ├─ State of charge progress bar
│  └─ Stop Charging button
└─ Sort by start time, energy, etc.

Utilization Tab
├─ Utilization per station
├─ Utilization metric card
│  ├─ Station name
│  ├─ Utilization % with visual bar
│  ├─ Sessions today count
│  └─ Total energy delivered
└─ Sort by utilization %
```

---

## Data Inputs and Outputs

### Dashboard Data Requirements

```typescript
// ChargingStation (Dashboard)
{
  id: number
  station_id: string
  name: string
  location_name: string
  status: "Available" | "Charging" | "Reserved" | "Unavailable" | "Faulted"
  is_online: boolean
  power_type: string                    // "Level 2", "DC Fast", etc.
  max_power_kw: number
  available_connectors: number
  num_connectors: number
  price_per_kwh_off_peak: number
  price_per_kwh_on_peak: number
}

// ChargingSession (Dashboard)
{
  id: number
  transaction_id: string
  vehicle_name: string
  driver_name: string
  station_name: string
  start_time: ISO string
  energy_delivered_kwh: number
  start_soc_percent: number
  end_soc_percent: number
  target_soc_percent: number
  duration_minutes: number
  avg_power_kw: number
}

// StationUtilization
{
  name: string
  sessions_today: number
  total_energy_kwh: number
  utilization_percent: number           // 0-100
}
```

### Display Outputs

```
Real-Time Metrics:
├─ Online Stations: "8/10"
├─ Active Sessions: "2"
├─ Energy Delivered: "67.8 kWh"
├─ Avg Utilization: "45%"
└─ Last Updated: "Just now"

Station Status Indicators:
├─ Color: Green (Available), Blue (Charging), Yellow (Reserved)
├─ Icon: Status symbol
├─ Badge: Text label
└─ Availability: "6/8 available"

Session Progress:
├─ Progress Bar: Visual representation 0-100%
├─ Current SOC: "87%"
├─ Target SOC: "95%"
├─ Energy Consumed: "45.3 kWh"
└─ Time Remaining: "~12 minutes"
```

---

## Integration Points

### API Integration

```
GET /api/ev/chargers
  Response: ChargingStation[]
  Refresh Rate: 30 seconds
  
GET /api/ev/sessions/active
  Response: ChargingSession[]
  Refresh Rate: 30 seconds
  
GET /api/ev/station-utilization
  Response: StationUtilization[]
  Refresh Rate: 30 seconds
  
POST /api/ev/chargers/{stationId}/remote-start
  Action: Initiate charging
  Trigger: "Start" button
  
POST /api/ev/sessions/{transactionId}/stop
  Action: Stop charging
  Trigger: "Stop Charging" button
  
POST /api/ev/chargers/{id}/reserve
  Action: Create reservation
  Trigger: "Reserve" button
```

---

# Feature 3: Fuel Management

## Feature Overview

**Feature Name:** Fuel Management & Cost Optimization
**Status:** Active
**Component:** `FuelManagement.tsx`
**Type:** Analytics and reporting

### Feature Description

The Fuel Management feature provides comprehensive tracking and analysis of fuel consumption across the fleet. It enables fleet managers to monitor fuel expenses, analyze consumption patterns by vehicle type, identify optimization opportunities, and project cost savings through route optimization and fleet improvements.

---

## Target Users

1. **Fleet Managers** - Overall fuel budget management
2. **Finance Managers** - Cost analysis and reporting
3. **Operations Managers** - Driver coaching and efficiency
4. **Maintenance Managers** - Vehicle health impact on fuel efficiency
5. **Sustainability Officers** - Fuel reduction initiatives

---

## User Stories

### Story 3.1: Fuel Transaction Tracking
**As a** Finance Manager,
**I want to** track and record all fuel transactions across the fleet,
**so that** I have accurate fuel cost data for budgeting and analysis.

**Acceptance Criteria:**
- Record fuel transactions with: date, vehicle, gallons, price, cost, station
- Display recent transactions in list format
- Show transaction details: vehicle number, date, station, cost, gallons, MPG
- Filter by date range, vehicle, payment method
- Display fuel card (fleet card) used or other payment method
- Export transaction history
- Auto-populate vehicle information

---

### Story 3.2: Fuel Cost Analytics
**As a** Fleet Manager,
**I want to** analyze fuel costs across the fleet to identify trends and anomalies,
**so that** I can understand cost drivers and control expenses.

**Acceptance Criteria:**
- Display total fuel cost with trend (up/down)
- Show total gallons consumed
- Calculate average price per gallon
- Display fleet average MPG
- Show monthly cost trend chart
- Identify high-cost months
- Compare period-over-period changes
- Generate cost variance reports

---

### Story 3.3: Fuel Efficiency Analysis
**As an** Operations Manager,
**I want to** monitor fuel efficiency (MPG) by vehicle type and driver,
**so that** I can identify efficiency issues and implement coaching.

**Acceptance Criteria:**
- Display fleet average MPG
- Show MPG by vehicle type (sedan, SUV, truck, van)
- Identify below-average performers
- Track MPG trends over time
- Compare driver efficiency
- Flag unusually low MPG as alert
- Provide efficiency improvement recommendations
- Calculate impact of poor efficiency

---

### Story 3.4: Cost Optimization Recommendations
**As a** Finance Manager,
**I want to** receive data-driven recommendations for reducing fuel costs,
**so that** I can implement high-impact efficiency initiatives.

**Acceptance Criteria:**
- Route optimization potential (estimated savings/month)
- Bulk purchasing agreement recommendations
- Vehicle replacement analysis for low-efficiency units
- Negotiate fleet contracts with preferred stations
- Off-peak fueling scheduling
- Driver behavior coaching opportunities
- Estimate savings impact per recommendation

---

### Story 3.5: Fleet Card Management
**As a** Fleet Manager,
**I want to** manage fleet fuel cards and track usage per card,
**so that** I can control spending limits and prevent misuse.

**Acceptance Criteria:**
- View all active fleet cards
- Set spending limits per card
- Monitor card usage and transactions
- Deactivate lost/stolen cards
- View transaction details for each card
- Assign card to driver or vehicle
- Generate card usage reports
- Detect suspicious activity

---

## Key Workflows

### Workflow 1: Record Fuel Transaction

```
Driver or Fleet Administrator Flow:
1. Fuels vehicle at station
2. Collects receipt with:
   - Date and time
   - Station name and location
   - Gallons pumped
   - Total cost
   - Odometer reading (for MPG calculation)
3. Enters transaction in Fleet app or via form:
   - Select vehicle from dropdown
   - Enter date
   - Enter station name
   - Enter gallons dispensed
   - Enter total cost
   - Enter odometer (optional for MPG)
   - Select payment method (fleet card, cash, etc.)
4. System calculates:
   - Price per gallon = Total Cost / Gallons
   - MPG = Miles / Gallons (if odometer provided)
5. Saves transaction to database
6. Notification: "Fuel transaction recorded"
7. Updates fleet totals and averages
8. Transaction appears in recent transactions list
```

---

### Workflow 2: Analyze Monthly Fuel Costs

```
Finance Manager Flow:
1. Navigate to Fuel Management > Records
2. View key metrics:
   - Total Fuel Cost: $12,450 (8.3% up from prior period)
   - Total Gallons: 5,200 gallons
   - Avg Price/Gallon: $2.39 (2.4% down - trending down)
   - Fleet Avg MPG: 18.4 (1.8% up - improving)
3. View monthly chart showing cost trend
4. Click on high-cost month
5. Filter transactions for that month:
   - May transactions show 150 deliveries
   - Cost spike due to bulk fuel for roadwork project
6. Export transaction list for accounting
7. Calculate average cost per mile:
   - Total Cost / Total Miles = $/mile
8. Compare to industry benchmarks
9. Identify improvement opportunities
```

---

### Workflow 3: Efficiency Analysis by Vehicle Type

```
Operations Manager Flow:
1. Navigate to Fuel Management > Analytics
2. View charts:
   - Fuel Consumption by Vehicle Type
   - MPG by Vehicle Type
3. Data shows:
   - Sedans: 450 gal, 28 MPG
   - SUVs: 680 gal, 22 MPG
   - Trucks: 920 gal, 18 MPG
   - Vans: 540 gal, 20 MPG
4. Identify low performers:
   - Trucks consuming 56% of fuel (920 gal) at 18 MPG
5. Click on truck category for details:
   - List of 4 trucks in fleet
   - Individual MPG for each truck
   - Maintenance history correlation
   - Driver efficiency comparison
6. Identify truck #2 has 15 MPG (below average)
7. Generate report on truck #2
8. Schedule maintenance inspection
9. Plan driver coaching sessions
10. Project fleet-wide impact if improved to 22 MPG:
    - 920 gal ÷ 22 MPG = 41.8 miles (vs. 16.6 miles at 18 MPG)
    - Savings: ~600 gallons/year = $1,410 at $2.39/gal
```

---

### Workflow 4: Cost Optimization Review

```
Finance Manager Flow:
1. Navigate to Fuel Management > Cost Optimization
2. Review recommendations:
   - Recommendation 1: Route Optimization
     * Potential savings: $2,400/month
     * Method: Implement route optimization to reduce miles
     * Status: High priority (proven ROI)
   - Recommendation 2: Bulk Purchasing Agreements
     * Current: Spot market pricing
     * Potential: 3-5% discount with fleet contract
     * Savings: ~$600/month
     * Action: Negotiate with major station networks
   - Recommendation 3: Vehicle Replacement Analysis
     * Find: 12 vehicles below-average efficiency
     * Replace oldest or highest-mileage vehicles
     * Potential savings: $3,500/month
     * Payback period: 2-3 years
3. Approve recommendations
4. Create action items with owners and deadlines
5. Schedule monthly reviews to track progress
6. Estimate total annual savings: $75,000+
```

---

## Core Functionality

### Metrics Dashboard

```
Primary Metrics:
├─ Total Fuel Cost
│  ├─ Display: $12,450
│  ├─ Trend: ↑ 8.3% (up)
│  ├─ Period: "Last 90 days"
│  └─ Status: Info (neutral)
├─ Total Gallons
│  ├─ Display: 5,200 gallons
│  ├─ Trend: ↑ 5.1% (up)
│  └─ Status: Info
├─ Avg Price/Gallon
│  ├─ Display: $2.39
│  ├─ Trend: ↓ 2.4% (down - good)
│  └─ Status: Success (improving)
└─ Fleet Avg MPG
   ├─ Display: 18.4 MPG
   ├─ Trend: ↑ 1.8% (up - good)
   └─ Status: Success (improving)
```

### Tab Navigation

```
Records Tab
├─ Monthly cost chart (bar chart)
├─ Recent transactions table
│  ├─ Vehicle number
│  ├─ Date and station
│  ├─ Gallons and cost
│  ├─ Price per gallon
│  ├─ MPG
│  └─ Payment method badge
└─ Filters: date range, vehicle, payment method

Fleet Cards Tab
├─ Card management interface
├─ Card listing
│  ├─ Card number (masked)
│  ├─ Assigned to (driver/vehicle)
│  ├─ Spending limit
│  ├─ Current month usage
│  ├─ Status (active/inactive)
│  └─ Actions (edit, deactivate)
└─ Add new card button

Stations Tab
├─ Preferred fueling stations
├─ Station details
│  ├─ Station name and location
│  ├─ Network (Shell, Chevron, etc.)
│  ├─ Pricing information
│  ├─ Loyalty benefits
│  └─ Transaction history
└─ Station performance analysis

Analytics Tab
├─ Fuel consumption by vehicle type (chart)
├─ MPG by vehicle type (chart)
├─ Efficiency trends over time
└─ Vehicle type comparison

Optimization Tab
├─ Cost reduction recommendations
├─ Recommendation cards
│  ├─ Description and priority
│  ├─ Estimated monthly savings
│  ├─ Implementation steps
│  └─ ROI calculation
└─ Action tracking
```

---

## Data Inputs and Outputs

### Fuel Transaction Input

```typescript
// FuelTransaction Input
{
  vehicleId: string
  vehicleNumber: string
  date: ISO string              // Date of fuel transaction
  station: string               // Station name
  gallons: number              // Gallons dispensed
  pricePerGallon: number       // $/gallon
  totalCost: number            // Total USD
  mpg: number                  // Miles per gallon (if applicable)
  odometerReading?: number     // Optional odometer
  paymentMethod: string        // "fleet_card", "cash", "credit_card"
  driverId?: string
  notes?: string
}

// Fleet Card Input
{
  cardNumber: string           // Last 4 digits for display
  assignedTo: string          // driver_id or vehicle_id
  spendingLimit: number       // Monthly limit in USD
  status: "active" | "inactive"
  expiryDate: ISO string
  network: string             // e.g., "Shell", "Chevron"
}
```

### Fuel Management Output

```typescript
// FuelMetrics Output
{
  totalCost: number           // Sum of all transaction costs
  totalGallons: number        // Sum of gallons
  averagePrice: number        // Cost/Gallons
  averageMpg: number          // Fleet average MPG
  monthlyTrend: Array<{
    month: string             // "Jan", "Feb", etc.
    cost: number             // Monthly total cost
  }>
  transactionCount: number
  periodStartDate: ISO string
  periodEndDate: ISO string
}

// Efficiency Report Output
{
  vehicleType: string
  fuelConsumed: number        // Gallons
  averageMpg: number
  totalCost: number
  percentageOfFleet: number   // % of total consumption
  trends: Array<{
    month: string
    mpg: number
    gallons: number
  }>
}

// Optimization Recommendation Output
{
  id: string
  title: string               // e.g., "Route Optimization"
  description: string
  monthlySavings: number      // USD
  annualSavings: number       // USD
  priority: "high" | "medium" | "low"
  implementationSteps: string[]
  roiMonths: number           // Payback period
  status: "pending" | "in_progress" | "completed"
}
```

---

## Integration Points

### API Routes

```
GET /api/fuel/transactions
  → List all fuel transactions (paginated)
  → Filter: vehicle, date range, payment method
  
POST /api/fuel/transactions
  → Record new fuel transaction
  → Input: FuelTransaction
  
GET /api/fuel/transactions/:id
  → Get transaction details
  
PUT /api/fuel/transactions/:id
  → Update transaction
  
GET /api/fuel/analytics
  → Get fuel analytics data
  → Includes: monthly trends, efficiency by type
  
GET /api/fuel/cards
  → List fleet fuel cards
  
POST /api/fuel/cards
  → Issue new fleet card
  
GET /api/fuel/stations
  → List preferred fueling stations
  
GET /api/fuel/recommendations
  → Get cost optimization recommendations
```

### Database Relationships

```
FuelTransaction
├─ vehicleId → Vehicle
├─ driverId → Driver
├─ stationId → FuelingStation
└─ fleetCardId → FleetCard

FleetCard
├─ assignedTo → Driver or Vehicle
└─ networkProvider → Station Network
```

---

# Feature 4: Carbon Footprint Tracker

## Feature Overview

**Feature Name:** Carbon Footprint Tracker & ESG Reporting
**Status:** Active
**Component:** `CarbonFootprintTracker.tsx`
**Type:** Environmental impact tracking and compliance

### Feature Description

The Carbon Footprint Tracker provides real-time monitoring of environmental impact from fleet operations. It measures CO2 emissions from EV charging and fuel consumption, calculates emissions avoided vs. ICE baseline, tracks renewable energy usage, and generates comprehensive ESG reports for stakeholder reporting and compliance.

---

## Target Users

1. **Sustainability Officers** - Track environmental initiatives
2. **Executive Leadership** - ESG reporting and targets
3. **Fleet Managers** - Understand environmental impact
4. **Compliance Officers** - Regulatory reporting
5. **Marketing/Communications** - Sustainability messaging
6. **Environmental Committees** - Board reporting

---

## User Stories

### Story 4.1: Real-Time Carbon Impact Monitoring
**As a** Sustainability Officer,
**I want to** monitor real-time carbon emissions and reduction from fleet operations,
**so that** I can track progress toward environmental targets.

**Acceptance Criteria:**
- Display CO2 emitted from EV charging (grid emissions)
- Display CO2 saved vs. ICE vehicle baseline
- Show carbon reduction percentage
- Display tree equivalent (years of tree growth)
- Auto-update with new charging sessions
- Filter by date range (7d, 30d, 90d, year)
- Show per-vehicle breakdown
- Alert when targets are exceeded

---

### Story 4.2: Environmental Impact Visualization
**As an** Executive,
**I want to** understand the environmental benefits of EV adoption in relatable terms,
**so that** I can communicate impact to stakeholders.

**Acceptance Criteria:**
- Display gasoline avoided (gallons)
- Show cost savings from fuel avoidance
- Visualize ICE emissions avoided (kg CO2)
- Calculate tree equivalent (# of trees)
- Show energy consumption metrics
- Display renewable energy percentage
- Provide environmental impact narrative
- Generate shareable infographics

---

### Story 4.3: ESG Performance Scoring
**As a** Compliance Officer,
**I want to** generate ESG performance scores and reports,
**so that** I can meet regulatory reporting requirements and stakeholder expectations.

**Acceptance Criteria:**
- Calculate environmental score (0-100)
- Determine sustainability rating (A-F)
- Show EV adoption percentage
- Display carbon reduction percentage
- Track renewable energy percentage
- Assess ESG targets achievement
- Generate monthly, quarterly, annual reports
- Export reports for stakeholders
- Support multiple ESG frameworks

---

### Story 4.4: Carbon Trend Analysis
**As a** Fleet Manager,
**I want to** analyze carbon reduction trends over time,
**so that** I can measure progress and adjust strategies.

**Acceptance Criteria:**
- Display monthly carbon trend chart
- Show moving average of emissions
- Identify seasonal patterns
- Compare year-over-year changes
- Track renewable energy adoption
- Monitor fleet electrification progress
- Predict future emissions trajectory
- Alert on adverse trends

---

### Story 4.5: Vehicle-Level Carbon Tracking
**As a** Sustainability Officer,
**I want to** track carbon footprint by individual vehicle,
**so that** I can identify top performers and coaching opportunities.

**Acceptance Criteria:**
- Display CO2 emissions per vehicle
- Show CO2 saved per vehicle
- Calculate carbon reduction % per vehicle
- Track vehicle efficiency (kWh/mile, MPG)
- Compare vehicle types
- Identify efficient and inefficient vehicles
- Generate vehicle rankings
- Recommend vehicle replacement/upgrade

---

## Key Workflows

### Workflow 1: Monitor Daily Carbon Impact

```
Sustainability Officer Flow:
1. Open Carbon Footprint Tracker
2. Select date range: "Last 30 Days" (default)
3. View key metrics:
   - CO2 Emissions: 4.5k kg
   - CO2 Saved: 18.2k kg (vs. ICE)
   - Reduction: 80.2%
   - Trees Equivalent: 834 trees
4. Observe data is auto-refreshed
5. View ESG Performance card:
   - Environmental Score: 87/100 (Green)
   - EV Adoption: 65%
   - Renewable Energy: 32%
   - Carbon Reduction: 80.2%
   - Status: Meeting ESG Targets ✓
6. Review recent carbon log table:
   - Date: Vehicle: Energy/Miles: CO2 Emitted: CO2 Saved: Reduction %
7. Switch to trends tab to see historical patterns
```

---

### Workflow 2: Generate ESG Report

```
Compliance Officer Flow:
1. Navigate to Carbon Footprint Tracker > Overview
2. Click "Download Report" button
3. Report generation dialog opens
4. Select report parameters:
   - Period: Monthly | Quarterly | Annual
   - Year: 2024
   - Month: November (if monthly)
5. System generates ESG report:
   - Report Title: "ESG Performance Report - November 2024"
   - Report Period: Monthly
   - Report Date Generated: Today's date
   - Organization: Fleet Company Name
6. Report contains:
   a) Executive Summary
      - Total EVs: 24 vehicles
      - Total Fleet: 38 vehicles
      - EV Adoption: 63%
      - Total Energy: 8,500 kWh
      - Total Miles: 45,000 miles
      - Total CO2 Emitted: 5.2k kg
      - Total CO2 Saved: 22.1k kg
   b) ESG Score Card
      - Environmental Score: 87/100
      - Sustainability Rating: A
      - Meets ESG Targets: Yes ✓
   c) Detailed Metrics
      - Renewable %: 28%
      - Carbon Reduction %: 80.9%
      - Efficiency: 0.189 kWh/mile (fleet avg)
   d) Trend Analysis
      - Month-over-month changes
      - YTD performance
      - Projections
   e) Vehicle Breakdown
      - Per-vehicle emissions
      - Per-vehicle carbon savings
      - Type comparisons
   f) Impact Narrative
      - Trees equivalent: 1,013 trees
      - Gallons avoided: 5,100 gallons
      - Cost savings: $17,850
      - Environmental benefits explanation
7. Download PDF or export to Excel
8. Submit to board/stakeholders
9. Archive report in compliance repository
```

---

### Workflow 3: Vehicle Performance Analysis

```
Fleet Manager Flow:
1. Navigate to Carbon Footprint > By Vehicle tab
2. View all vehicles with carbon metrics:
   - Vehicle | CO2 Emitted | CO2 Saved | Reduction % | Trees Equivalent
3. Top performers highlighted:
   - Tesla Model 3: 1.2k kg emitted, 8.3k kg saved, 87% reduction
   - Nissan Leaf: 0.8k kg emitted, 6.1k kg saved, 88% reduction
4. Lower performers:
   - Chevy Volt (hybrid): 2.5k kg emitted, 3.2k kg saved, 56% reduction
   - Ford F-150 (gas): 5.2k kg emitted, 0 kg saved, 0% reduction
5. Click on EV to see details:
   - Total energy consumed: 450 kWh
   - Total miles driven: 2,100 miles
   - Efficiency: 0.214 kWh/mile
   - Sessions: 32 charging sessions
   - Avg session: 14 kWh
6. Identify efficiency champions for training
7. Plan replacement strategy for low-performers
8. Calculate impact of switching fleet to 100% EV:
   - Current: 22.1k kg CO2 saved
   - At 100% EV: 88.5k kg CO2 saved (4x improvement)
9. Build business case for vehicle replacements
```

---

### Workflow 4: Renewable Energy Tracking

```
Sustainability Officer Flow:
1. Navigate to Carbon Footprint Tracker > Overview
2. View renewable energy metric: 32%
3. This represents:
   - 32% of grid electricity is from renewable sources
   - Result: Lower carbon intensity per kWh
4. Click on renewable % card for details
5. See renewable energy sources:
   - Solar: 15%
   - Wind: 12%
   - Hydro: 5%
   - Other: 0%
6. View impact on emissions:
   - With current grid mix: 5.2k kg CO2 from charging
   - If 100% renewable: 0 kg CO2 from charging
   - Current savings from renewables: 1.7k kg CO2
7. Track charging preferences:
   - Employees increasingly charging at off-peak
   - Off-peak hours have higher renewable %
   - Result: Natural improvement without intervention
8. Negotiate renewable energy supply:
   - Investigate solar canopy at depots
   - Renewable energy credits (RECs)
   - Green energy tariffs from utility
   - Potential: 50%+ renewable within 1 year
9. Include renewable % in ESG reports
10. Communicate to stakeholders as sustainability win
```

---

## Core Functionality

### Carbon Calculations

```
Energy-Based Emissions:
├─ Grid Carbon Intensity: varies by region
│  ├─ Example: 0.4 kg CO2/kWh (US average)
│  ├─ Range: 0.2 (renewable-rich) to 0.8 (coal-heavy)
│  └─ Updated: Periodic (real-time possible)
├─ Charging Emissions:
│  ├─ Formula: Energy (kWh) × Carbon Intensity × (1 - Renewable%)
│  ├─ Example: 50 kWh × 0.4 kg/kWh × (1 - 0.32) = 13.6 kg CO2
│  └─ Applied: Per charging session
└─ Carbon Saved (vs. ICE):
   ├─ Formula: (Miles × 8.887 g/mile) - (Actual Emissions)
   ├─ Example: (100 mi × 8.887) - 13.6 kg = 875.1 kg saved
   └─ Reduction %: (Saved / (Miles × 8.887)) × 100

Fuel-Based Emissions:
├─ Gasoline Emissions: 8.887 kg CO2/gallon
├─ Diesel Emissions: 10.155 kg CO2/gallon
├─ Calculation: Gallons × Emission Factor
└─ Example: 100 gal × 8.887 = 888.7 kg CO2

Baseline Comparison:
├─ ICE Baseline: Fleet vehicle avg fuel efficiency
├─ Example Fleet: 18.4 MPG average
├─ EV Baseline: kWh/mile efficiency
├─ Example Fleet: 0.25 kWh/mile average
└─ Savings: Difference between baselines
```

### ESG Scoring Methodology

```
Environmental Score (0-100):
├─ Carbon Reduction Achievement (40%)
│  ├─ Target: 50% reduction by 2025
│  ├─ Current: 80% achieved
│  └─ Score: 40 points
├─ EV Adoption Rate (30%)
│  ├─ Target: 50% by 2025
│  ├─ Current: 63% achieved
│  └─ Score: 30 points
├─ Renewable Energy Usage (20%)
│  ├─ Target: 40% renewable by 2025
│  ├─ Current: 32% achieved
│  └─ Score: 16 points
└─ Total Score: 86/100

Sustainability Rating (A-F):
├─ A: 85-100 (Excellent)
├─ B: 70-84 (Good)
├─ C: 55-69 (Adequate)
├─ D: 40-54 (Below Average)
└─ F: <40 (Poor)

Current Assessment: Rating A (Score 87)
Status: Meets ESG Targets ✓
```

---

## Data Inputs and Outputs

### Carbon Data Input

```typescript
// CarbonData Input (from charging sessions)
{
  vehicle_id: number
  vehicle_name: string
  log_date: ISO string
  kwh_consumed: number                // Energy from charging
  miles_driven: number
  efficiency_kwh_per_mile: number    // kWh/mile
  carbon_emitted_kg: number          // Grid-based emissions
  carbon_saved_kg: number            // vs. ICE baseline
  carbon_saved_percent: number       // % reduction
  renewable_percent: number          // Renewable in grid mix
}

// Carbon Data Input (from fuel transactions)
{
  vehicle_id: number
  fuel_type: "gasoline" | "diesel"
  gallons: number
  date: ISO string
  carbon_emitted_kg: number          // 8.887 * gallons (gas)
}

// ESG Report Parameters
{
  period: "monthly" | "quarterly" | "annual"
  year: number
  month?: number                     // If monthly
  include_detailed_metrics: boolean
  include_trends: boolean
  include_forecasts: boolean
}
```

### Carbon Output Data

```typescript
// CarbonSummary Output
{
  vehicle_count: number
  total_kwh: number
  total_miles: number
  total_carbon_kg: number            // Grid emissions
  total_saved_kg: number             // vs. ICE
  avg_reduction_percent: number      // Average reduction %
  gasoline_avoided_gallons: number   // Equivalent gallons saved
  cost_savings: number               // At $3.50/gal
  tree_equivalent: number            // Trees needed to offset
}

// ESGReport Output
{
  report_period: "monthly" | "quarterly" | "annual"
  report_year: number
  report_month?: number
  total_ev_count: number
  total_fleet_count: number
  ev_adoption_percent: number        // % of fleet
  total_kwh_consumed: number
  total_miles_driven: number
  total_carbon_emitted_kg: number    // Grid emissions from EVs
  total_carbon_saved_kg: number      // vs. ICE baseline
  carbon_reduction_percent: number   // Overall reduction
  renewable_percent: number          // Renewable in grid
  environmental_score: number        // 0-100
  sustainability_rating: string      // "A" to "F"
  meets_esg_targets: boolean
  trends: {
    previous_period: CarbonSummary
    yoy_change: number              // % change year-over-year
    trend_direction: "up" | "down"
  }
  vehicles: Array<{
    vehicle_id: number
    vehicle_name: string
    co2_emitted: number
    co2_saved: number
    reduction_percent: number
  }>
}
```

### Dashboard Metrics Display

```
Key Metrics Cards:
├─ CO₂ Emissions
│  ├─ Value: "4.5k kg"
│  ├─ Label: "From EV charging"
│  └─ Icon: CloudIcon
├─ CO₂ Saved
│  ├─ Value: "18.2k kg"
│  ├─ Label: "vs. ICE vehicles"
│  ├─ Color: Green
│  └─ Icon: ArrowTrendingDownIcon
├─ Carbon Reduction
│  ├─ Value: "80.2%"
│  ├─ Label: "Carbon reduction"
│  └─ Icon: SparklesIcon
└─ Trees Equivalent
   ├─ Value: "834"
   ├─ Label: "Annual absorption"
   └─ Icon: Tree

ESG Score Card:
├─ Environmental Score: 87/100 (Color: Green)
├─ EV Adoption: 65%
├─ Renewable Energy: 32%
├─ Carbon Reduction: 80.2%
└─ Status: Meeting ESG Targets ✓
```

---

## Integration Points

### API Routes

```
GET /api/ev/carbon-footprint
  → Get carbon footprint data
  → Parameters: startDate, endDate, vehicleId (optional)
  → Response: CarbonData[], CarbonSummary
  
GET /api/ev/esg-report
  → Generate ESG report
  → Parameters: period (monthly|quarterly|annual), year, month
  → Response: ESGReport
  
GET /api/ev/carbon-trends
  → Get carbon trend data
  → Parameters: timeframe (daily|weekly|monthly|yearly)
  → Response: Array<{date, emissions, saved, reduction}>
```

### Data Dependencies

```
Carbon Data Sources:
├─ Charging Sessions
│  ├─ energy_delivered_kwh
│  ├─ start_time, end_time
│  ├─ vehicle_id
│  └─ station_id (for location/grid info)
├─ Fuel Transactions
│  ├─ gallons
│  ├─ fuel_type (gas/diesel)
│  ├─ date
│  └─ vehicle_id
├─ Vehicle Data
│  ├─ Vehicle type (EV, ICE, Hybrid)
│  ├─ baseline fuel efficiency
│  └─ baseline energy efficiency
├─ Grid Carbon Intensity
│  ├─ Regional data
│  ├─ Updated: Hourly or daily
│  └─ Source: Regional grid operator or EPA
└─ Renewable Energy Mix
   ├─ By region/time of day
   ├─ Updated: Hourly
   └─ Source: Grid operator or renewable tracker
```

### Database Relationships

```
carbon_footprint_log
├─ vehicle_id → vehicles
├─ log_date → timestamp
├─ kwh_consumed ← charging_sessions
├─ miles_driven ← trip_usage or telematics
└─ carbon calculations

esg_report
├─ report_period (monthly, quarterly, annual)
├─ report_date → timestamp
├─ vehicle_count (derived)
├─ aggregate calculations
└─ derived metrics

vehicle
├─ vehicle_id
├─ vehicle_type (EV, ICE, Hybrid)
├─ baseline_fuel_efficiency (MPG)
├─ baseline_energy_efficiency (kWh/mi)
└─ active: boolean
```

---

# Integration Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer (React)                    │
├─────────────────────────────────────────────────────────────┤
│  EV Charging    │  EV Charging  │  Fuel Management  │ Carbon │
│  Management     │  Dashboard    │                   │ Tracker│
└─────────────────────────────────────────────────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│              API Layer (Express.js + TypeScript)             │
├─────────────────────────────────────────────────────────────┤
│  EV Management Routes  │  Charging Routes  │  Fuel Routes    │
│  • /api/ev/chargers    │  • /charging-     │  • /fuel/       │
│  • /api/ev/sessions    │    sessions       │    transactions │
│  • /api/ev/carbon-*    │  • /charging-     │  • /fuel/cards  │
│  • /api/ev/esg-*       │    stations       │  • /fuel/       │
└─────────────────────────────────────────────────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│         Service Layer (Business Logic)                       │
├─────────────────────────────────────────────────────────────┤
│  OCPPService          │  EVChargingService     │ FuelService   │
│  • WebSocket mgmt     │  • Session tracking    │ • Transactions│
│  • Station comms      │  • Station mgmt        │ • Analytics   │
│  • Transaction ctrl   │  • Carbon calculations │ • Optimization│
└─────────────────────────────────────────────────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│         Database Layer (PostgreSQL)                          │
├─────────────────────────────────────────────────────────────┤
│  Tables:                                                     │
│  ├─ charging_stations    ├─ fuel_transactions               │
│  ├─ charging_sessions    ├─ fuel_cards                       │
│  ├─ vehicles             ├─ carbon_footprint_log             │
│  ├─ drivers              ├─ esg_reports                      │
│  └─ reservations         └─ utilization_metrics              │
└─────────────────────────────────────────────────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│      External Integrations                                   │
├─────────────────────────────────────────────────────────────┤
│  OCPP 2.0.1 Charger    │  Grid Operator Data  │ Fuel Pricing  │
│  (ChargePoint, EVBox)  │  (Carbon Intensity)  │ (Real-time)   │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### Charging Session Flow

```
Driver Initiates Charge
        │
        ▼
Frontend: Select Station
        │
        ▼
API: POST /api/ev/chargers/{id}/remote-start
        │
        ▼
OCPPService: Send RemoteStartTransaction
        │
        ▼
Physical Charger: Receive & Process
        │
        ▼
Charger Begins Charging
        │
        ▼
Periodic Meter Updates (every 30s-60s)
        │
        ├─ MeterValue messages via OCPP
        ├─ Energy delivered (kWh)
        ├─ Current power (kW)
        └─ State of charge (%)
        │
        ▼
Database: Update charging_sessions table
        │
        ├─ energy_delivered_kwh
        ├─ current_power_kw
        └─ current_soc_percent
        │
        ▼
Dashboard Auto-Refresh (30s)
        │
        ├─ Fetch active sessions via API
        ├─ Display real-time metrics
        └─ Update progress bars
        │
        ▼
Session Ends (Manual or Auto)
        │
        ▼
APIPost: /api/ev/sessions/{id}/stop
        │
        ▼
OCPPService: Send RemoteStopTransaction
        │
        ▼
Charger Stops Charging
        │
        ▼
Final Meter Reading
        │
        └─ End time, final SOC, total energy
        │
        ▼
Database: Record Completed Session
        │
        ├─ end_time: NOW()
        ├─ end_soc: Final percent
        ├─ total_energy: kWh delivered
        ├─ total_cost: Calculated
        ├─ duration: minutes
        └─ status: "completed"
        │
        ▼
Carbon Calculation Service
        │
        ├─ Energy × Grid Carbon Intensity
        ├─ Calculate CO2 saved vs. ICE
        └─ Update carbon_footprint_log
        │
        ▼
Session Receipt Generated
        │
        ├─ Email to driver
        ├─ Display on dashboard
        └─ Archive in database
        │
        ▼
Metrics Update
        │
        ├─ Total energy in session
        ├─ Monthly cost running total
        ├─ Fleet carbon offset
        └─ ESG metrics refresh
```

---

## Feature Interaction Map

```
EVChargingManagement ◄──────┬──────────► EVChargingDashboard
      │                      │                    │
      │ Register Stations    │ Monitor Sessions   │
      │                      │                    │
      ├─────────────────────┼────────────────────┤
      │                      │                    │
      ▼                      ▼                    ▼
   Database ────────────────────────────────► API Layer
      │                      │                    │
      ├─ Stations           ├─ Sessions          ├─ Authentication
      ├─ Sessions           ├─ Utilization       ├─ Authorization
      ├─ Carbon Logs        └─ Real-time Data    └─ Validation
      └─ Vehicles
           │                      │                    │
           └──────────────────────┴────────────────────┘
                          │
                          ▼
                  OCPP Service Layer
                  (Charger Communication)
                          │
                    ┌─────┼─────┐
                    ▼     ▼     ▼
                  Station Status Updates
                  Meter Values (Energy)
                  Transaction Events
                          │
                          ▼
                  Chargers (OCPP 2.0.1)
                          │
                    ┌─────┼─────┐
                    ▼     ▼     ▼
                  ChargePoint
                  EVBox
                  ABB / Other

FuelManagement ◄──────────────────────────► CarbonFootprintTracker
      │                                             │
      │ Record Transactions                        │
      │ Track Gallons                              │
      │ Analyze Efficiency                         │ Calculate Emissions
      │                                            │ Track Savings
      ▼                                            ▼
   Database: fuel_transactions ──► Database: carbon_footprint_log
      │                                            │
      │ Monthly Metrics                            │ ESG Reports
      │ Cost Analysis                              │ Environmental Score
      │ Efficiency Trends                          │ Sustainability Rating
      │                                            │
      └────────────────────────┬────────────────────┘
                               │
                               ▼
                         Fleet Dashboard
                         (KPI Summary)
```

---

# Test Scenarios

## Test Scenario 1: EV Charging Management - Full Workflow

### Test Case 1.1: Register New Charging Station

**Objective:** Verify station registration and OCPP integration

**Preconditions:**
- User logged in as Fleet Manager
- EVChargingManagement component loaded
- OCPP service running

**Steps:**
1. Click "Add Station" button
2. Fill form with:
   - Name: "Test Depot - Station 1"
   - Location: "123 Test St, TestCity, TX"
   - Latitude: 27.9506
   - Longitude: -82.4572
   - Station Type: "depot"
   - Charger Type: "level-2"
   - Power: 7.2 kW
   - Network: "ChargePoint"
   - Connector Types: ["J1772", "CCS"]
   - Available: Toggle ON
3. Click "Add Station"

**Expected Results:**
- Toast notification: "Station added successfully"
- New station appears in Charging Stations list
- Station ID generated and stored
- OCPP connection established
- Status shows "online"
- Station available for charging sessions

**Validation Points:**
- Database: INSERT into charging_stations successful
- API: Station_id returned
- OCPP: WebSocket connection established
- Frontend: Station renders in list with correct data
- Metrics: Total Stations count incremented

---

### Test Case 1.2: Monitor Active Charging Session

**Objective:** Verify real-time session monitoring and data accuracy

**Preconditions:**
- Charging station registered and online
- Vehicle with EV capability in system
- Active charging session initiated

**Steps:**
1. Navigate to EVChargingDashboard or EVChargingManagement
2. Locate session in active sessions table
3. Verify session displays:
   - Vehicle number: "EV-1001"
   - Driver name: "John Smith"
   - Station name: "Main Depot - Station 2"
   - Start time: Actual start timestamp
   - Energy delivered: Increments with time
   - Cost: Calculated correctly
   - Start SOC: 15%
   - Status: "active"
4. Wait 1-2 minutes and refresh
5. Verify energy delivered increased
6. Verify cost increased proportionally

**Expected Results:**
- Real-time metrics update without page refresh
- Energy delivered increases at expected rate
- Cost calculation accurate per tariff
- Session status remains "active"
- Progress bar updates smoothly

**Validation Points:**
- API call: GET /api/ev/sessions/active returns correct data
- Database: charging_sessions updated with latest meter values
- Frontend: Values refresh every 30 seconds
- Calculations: Cost = Energy × Rate correct
- No duplicate sessions displayed

---

### Test Case 1.3: End Charging Session (Remote)

**Objective:** Verify remote session termination and finalization

**Preconditions:**
- Active charging session running
- Session metrics: 25.5 kWh delivered, $8.92 cost, 45 min duration

**Steps:**
1. Locate active session in table
2. Click "End" button
3. Confirm termination (if confirmation dialog appears)
4. Wait for station response

**Expected Results:**
- OCPP RemoteStopTransaction sent successfully
- Station stops charging
- Session status changes to "completed"
- End time recorded (NOW())
- Final energy delivered: 25.5 kWh
- Final cost: $8.92
- Duration: 45 minutes
- Session appears in historical list
- Toast: "Charging session completed"

**Validation Points:**
- API call: POST /api/ev/sessions/{id}/stop successful
- OCPP message sent and acknowledged
- Database: charging_sessions.status = "completed"
- Database: end_time, final_soc, total_duration recorded
- Carbon calculation executed
- Session removed from active list
- Session added to completed history

---

### Test Case 1.4: Cost Calculation Accuracy

**Objective:** Verify cost calculations with different tariff types

**Preconditions:**
- Completed charging session with known metrics

**Test Data:**
```
Session Parameters:
- Energy: 50 kWh
- Tariff Type: TOU (Time of Use)
- Off-peak Rate: $0.12/kWh
- Peak Rate: $0.18/kWh
- Peak Demand Charge: $2.50
- Session Time: 11:00 PM - 12:45 AM (off-peak window)

Calculation:
- Off-peak Cost: 50 kWh × $0.12 = $6.00
- Peak Demand: $2.50 (if applicable)
- Total: $6.00 + $2.50 = $8.50
```

**Steps:**
1. Record session with above parameters
2. Verify calculated cost in session record
3. Verify cost in monthly summary
4. Export and verify in report

**Expected Results:**
- Displayed cost matches calculation: $8.50
- Peak demand charge included if applicable
- Tariff type "tou" applied correctly
- Cost per kWh: $0.17 ($8.50 / 50 kWh) correct
- Monthly total includes this session

---

## Test Scenario 2: EV Charging Dashboard - Real-Time Monitoring

### Test Case 2.1: Dashboard Auto-Refresh

**Objective:** Verify automatic data refresh every 30 seconds

**Preconditions:**
- Dashboard loaded
- At least 1 active charging session
- Active charging session metrics changing

**Steps:**
1. Open EV Charging Dashboard
2. Note current metric values:
   - Active Sessions: X
   - Energy Delivered: Y kWh
   - Timestamp: Z
3. Wait 30 seconds without refresh action
4. Observe metrics update automatically
5. Verify timestamp updated
6. Wait another 30 seconds
7. Verify continuous updates

**Expected Results:**
- Metrics update without user action
- Updates occur at ~30 second intervals
- Energy delivered increases appropriately
- Active session cards show updated values
- No loading spinner between updates (smooth refresh)
- Utilization metrics update

**Validation Points:**
- API calls: Every 30s for chargers, sessions, utilization
- Frontend: State updates without full page reload
- Data consistency: All metrics updated in same request
- Network: Multiple requests sent at expected intervals
- No memory leaks from repeated requests

---

### Test Case 2.2: Station Availability Display

**Objective:** Verify accurate station status and availability display

**Preconditions:**
- Multiple charging stations registered
- Stations with different statuses: online, offline, maintenance

**Station Configuration:**
```
Station 1: Online, 0/2 connectors available (both occupied)
Station 2: Online, 2/2 connectors available (empty)
Station 3: Offline, 0/3 connectors available (unavailable)
Station 4: Maintenance, 0/2 connectors available (unavailable)
```

**Steps:**
1. Open Dashboard Stations tab
2. Verify each station displays:
   - Status badge with correct color
   - Available/Total connectors
   - Power type and output
   - Pricing information
   - Action buttons appropriately enabled/disabled

**Expected Results:**
- Station 1: Status "Charging" (blue), "0/2 available", reserve/start disabled
- Station 2: Status "Available" (green), "2/2 available", reserve/start enabled
- Station 3: Status "Offline" (gray), "0/3 available", buttons disabled
- Station 4: Status "Maintenance" (yellow), "0/2 available", buttons disabled
- Overall online count: "2/4" (stations 1, 2)
- Available count: "1" (station 2 only)

**Validation Points:**
- API: GET /api/ev/chargers returns correct statuses
- Frontend: Status colors match specification
- Buttons: Conditional rendering based on status
- Metrics: Online/available counts calculated correctly
- Real-time: Status updates when changes occur

---

## Test Scenario 3: Fuel Management - Analytics

### Test Case 3.1: Monthly Cost Analysis

**Objective:** Verify accurate fuel cost calculations and trends

**Preconditions:**
- Multiple fuel transactions entered for current month and prior 2 months
- Transactions include: date, vehicle, gallons, price, cost, station

**Test Data:**
```
October: 4,800 gal @ $2.35/gal = $11,280
November: 5,200 gal @ $2.39/gal = $12,428
December (current): 4,950 gal @ $2.38/gal = $11,781
```

**Steps:**
1. Navigate to Fuel Management > Records tab
2. Verify metrics displayed:
   - Total Cost: $35,489
   - Total Gallons: 14,950
   - Avg Price: $2.37/gal
   - Fleet Avg MPG: 18.4
3. Verify monthly chart shows:
   - October: $11,280
   - November: $12,428 (highest)
   - December: $11,781
4. Verify trend: ↓ (down from November)

**Expected Results:**
- Total Cost correctly sums all transactions
- Gallons correctly sum
- Avg Price = Total Cost / Total Gallons
- Monthly chart accurate bars
- Trend arrow shows correct direction
- Percentage change calculated (Nov to Dec: -5.2% ↓)

**Validation Points:**
- Database: SUM(totalCost) accurate
- Calculation: Averages correct
- Frontend: Chart renders with correct data
- Filter: Can filter by month, vehicle, station
- Export: Data exports correctly to CSV/Excel

---

### Test Case 3.2: Vehicle Type Efficiency Comparison

**Objective:** Verify fuel efficiency analysis by vehicle type

**Preconditions:**
- Fleet with mixed vehicle types
- Historical fuel consumption and MPG data

**Test Data:**
```
Sedans (5 vehicles):
- Total Fuel: 450 gallons
- Average MPG: 28
- Total Cost: $1,071.50

SUVs (8 vehicles):
- Total Fuel: 680 gallons
- Average MPG: 22
- Total Cost: $1,622.20

Trucks (4 vehicles):
- Total Fuel: 920 gallons
- Average MPG: 18
- Total Cost: $2,192.60

Vans (3 vehicles):
- Total Fuel: 540 gallons
- Average MPG: 20
- Total Cost: $1,287.30
```

**Steps:**
1. Navigate to Fuel Management > Analytics tab
2. View "Fuel Consumption by Vehicle Type" chart
3. Verify bar heights reflect gallons:
   - Trucks: 920 (highest)
   - SUVs: 680
   - Vans: 540
   - Sedans: 450 (lowest)
4. View "MPG by Vehicle Type" chart
5. Verify bar heights reflect efficiency:
   - Sedans: 28 (highest efficiency)
   - SUVs: 22
   - Vans: 20
   - Trucks: 18 (lowest efficiency)
6. Calculate fleet percentages:
   - Trucks: 920/2,590 = 35.5% of consumption
   - SUVs: 680/2,590 = 26.3%

**Expected Results:**
- Consumption chart shows correct proportions
- Efficiency chart shows correct rankings
- Trucks identified as highest consumer but lowest efficiency
- Fleet average MPG calculated: 21.3 MPG
- Cost per gallon consistent across types

**Validation Points:**
- Data aggregation: GROUP BY vehicle_type
- Chart rendering: Correct data binding
- Calculations: Percentage calculations accurate
- Insights: Anomalies identified (e.g., Truck #2 at 15 MPG)
- Recommendations: Provided based on analysis

---

### Test Case 3.3: Cost Optimization Recommendations

**Objective:** Verify optimization recommendations and savings calculations

**Preconditions:**
- At least 3 months of fuel data
- Fleet using spot market pricing
- Current routing not optimized

**Steps:**
1. Navigate to Fuel Management > Cost Optimization
2. Verify recommendations displayed:
   a) Route Optimization
      - Status: "High Priority"
      - Monthly Savings: $2,400
      - Annual Savings: $28,800
   b) Bulk Purchasing
      - Current rate: $2.37/gal (spot)
      - Negotiated rate: $2.25/gal (5% discount)
      - Annual savings: $3,600
   c) Vehicle Replacement
      - Vehicles below avg: 12
      - Potential gain: +3 MPG
      - Annual savings: $4,200
3. Verify ROI calculations
4. Select recommendation to view details

**Expected Results:**
- All recommendations listed with:
  - Clear description
  - Estimated savings (monthly & annual)
  - Priority level (high/medium/low)
  - Implementation steps
  - ROI calculation
- Route optimization highest priority (proven ROI)
- Total potential annual savings: $36,600+
- Recommendations based on actual fleet data

**Validation Points:**
- Calculations: Savings based on historical data
- ROI: Realistic payback periods
- Feasibility: Recommendations actionable
- Prioritization: Based on impact and ease
- Tracking: Can mark as "approved" or "rejected"

---

## Test Scenario 4: Carbon Footprint Tracker - ESG Reporting

### Test Case 4.1: Carbon Emissions Calculation

**Objective:** Verify accurate carbon emission and offset calculations

**Preconditions:**
- Completed charging sessions with known energy data
- Current grid carbon intensity: 0.4 kg CO2/kWh
- Renewable percentage: 32%

**Test Data:**
```
Charging Session:
- Energy: 50 kWh
- Grid Intensity: 0.4 kg CO2/kWh
- Renewable: 32%
- ICE Baseline: 8 mi/gallon (12.5 gal per 100 miles)
- Miles Driven: 100 miles

Calculations:
- CO2 Emitted: 50 × 0.4 × (1 - 0.32) = 13.6 kg CO2
- ICE Emissions: (100 miles / 8 MPG) × 8.887 kg/gal = 111.1 kg CO2
- CO2 Saved: 111.1 - 13.6 = 97.5 kg CO2
- Reduction %: (97.5 / 111.1) × 100 = 87.8%
```

**Steps:**
1. Record charging session: 50 kWh, 100 miles
2. Navigate to Carbon Footprint Tracker
3. Verify session carbon data:
   - CO2 Emitted: 13.6 kg
   - CO2 Saved: 97.5 kg
   - Reduction: 87.8%
4. Tree Equivalent: 97.5 / 21.8 = 4.5 trees
5. Verify in table under "Recent Carbon Footprint"

**Expected Results:**
- Carbon emitted matches calculation: 13.6 kg
- Carbon saved vs. ICE: 97.5 kg
- Reduction percentage: 87.8%
- Tree equivalent: 4.5 trees
- All values displayed in dashboard metrics

**Validation Points:**
- Grid intensity applied correctly
- Renewable percentage factored in
- ICE baseline used for comparison
- Calculations match formulas
- Data persisted to carbon_footprint_log table
- Fleet totals updated

---

### Test Case 4.2: ESG Report Generation

**Objective:** Verify ESG report generation and accuracy

**Preconditions:**
- Full month of charging and fuel data
- Fleet: 24 EVs, 14 ICE/Hybrid vehicles (38 total)
- November performance data available

**Steps:**
1. Navigate to Carbon Footprint > Overview
2. Click "Download Report" button
3. Select parameters:
   - Period: "Monthly"
   - Year: "2024"
   - Month: "November"
4. System generates report (shows loading)
5. Download PDF report
6. Verify report contents

**Expected Results:**
- Report generated successfully
- Report contains:
  a) Header: "ESG Performance Report - November 2024"
  b) Executive Summary:
     - Total EVs: 24 (63% of fleet)
     - Total miles: 45,000
     - Total energy: 8,500 kWh
     - CO2 saved: 22,100 kg
  c) ESG Score Card:
     - Environmental Score: 87/100
     - Rating: A
     - Meets Targets: Yes ✓
  d) Detailed Metrics:
     - Carbon reduction: 80.9%
     - Renewable %: 28%
     - EV adoption: 63%
  e) Vehicle Breakdown: Per-vehicle emissions
  f) Impact Narrative: Trees (1,013), gallons (5,100), savings ($17,850)
7. Export to Excel option available
8. Archive in system

**Validation Points:**
- Report generation: No errors
- Data accuracy: Matches dashboard metrics
- Calculations: All formulas correct
- ESG scoring: Matches methodology
- PDF generation: Quality and formatting
- Export: Data integrity in Excel
- Audit trail: Report logged with timestamp

---

### Test Case 4.3: Carbon Trend Analysis

**Objective:** Verify trend data and forecasting accuracy

**Preconditions:**
- 6+ months of carbon data
- Growing EV adoption over period

**Test Data:**
```
Monthly Carbon Saved:
June: 12,000 kg
July: 14,500 kg
August: 16,200 kg
September: 18,500 kg
October: 20,100 kg
November: 22,100 kg
```

**Steps:**
1. Navigate to Carbon Footprint > Trends tab
2. Verify trend chart displays:
   - X-axis: Months (Jun - Nov)
   - Y-axis: CO2 Saved (kg)
   - Line graph showing upward trend
3. Identify trend characteristics:
   - Trend direction: UP (positive)
   - Slope: ~2,000 kg/month increase
   - Moving average: Smoothed trend line
4. View metrics:
   - Trend: +84% improvement (Jun to Nov)
   - Monthly avg: 17,067 kg saved
   - Current rate: 22,100 kg/month
5. View forecast (if available):
   - Projected for Dec: ~24,000 kg

**Expected Results:**
- Trend chart accurately represents data
- Line chart shows upward trajectory
- Metrics reflect actual performance
- Trend direction correct (improving)
- Percentage change calculated: +84%
- Forecast reasonable based on trend

**Validation Points:**
- Data points: All months included
- Chart rendering: Clean visualization
- Metrics: Accurate calculations
- Trend line: Correct slope and direction
- Forecast: Based on moving average
- Insights: Key trends identified (EV adoption impact)

---

### Test Case 4.4: By-Vehicle Carbon Ranking

**Objective:** Verify vehicle-level carbon tracking and rankings

**Preconditions:**
- Fleet with 24 EVs and 14 ICE vehicles
- Complete charging and fuel history

**Steps:**
1. Navigate to Carbon Footprint > By Vehicle tab
2. View vehicle list with rankings:
   - Ranked by CO2 saved (descending)
3. Top performers (EVs):
   - Tesla Model 3: 1,200 kg emitted, 8,300 kg saved, 87% reduction
   - Nissan Leaf: 800 kg emitted, 6,100 kg saved, 88% reduction
4. Lower performers (ICE/Hybrid):
   - Chevy Volt: 2,500 kg emitted, 3,200 kg saved, 56% reduction
   - Ford F-150: 5,200 kg emitted, 0 kg saved (ICE baseline)
5. Click on top performer for details:
   - Total kWh: 450
   - Total miles: 2,100
   - Efficiency: 0.214 kWh/mile
   - Sessions: 32
   - Tree equivalent: 205 trees
6. Click on low performer for details:
   - Fuel consumed: 600 gallons
   - Average MPG: 15
   - Carbon: 5,332 kg CO2

**Expected Results:**
- Vehicle list sorted by CO2 saved
- EV vehicles show high savings
- ICE vehicles show low/no savings
- Reduction % calculates correctly
- Tree equivalent calculated: kg saved / 21.8
- Efficiency metrics displayed accurately
- Detail view available for each vehicle

**Validation Points:**
- Data aggregation: Per-vehicle calculations
- Ranking: Sorted correctly
- CO2 calculations: Matching detailed views
- Efficiency: kWh/mile and MPG calculated
- Tree equivalent: Accurate conversion
- Comparison: Rankings enable fleet strategy decisions

---

## Performance & Load Testing

### Test Case 5.1: Dashboard Real-Time Update Performance

**Objective:** Verify dashboard performs with large datasets

**Preconditions:**
- Fleet with 50+ stations
- 20+ active charging sessions
- 1000+ historical sessions

**Load:**
- 50 charging stations
- 20 active sessions
- Auto-refresh every 30s
- 4 concurrent users on dashboard

**Steps:**
1. Load dashboard with large dataset
2. Monitor:
   - Page load time: Should be <3s
   - Auto-refresh interval: Consistent 30s
   - Memory usage: Should not exceed 500MB
   - API response time: <500ms
   - No lag in interactions
3. Interact while data loading:
   - Click buttons
   - Switch tabs
   - Scroll tables
4. Monitor for 5 minutes continuously

**Expected Results:**
- Page loads in <3 seconds
- All metrics display correctly
- Auto-refresh maintains 30s interval
- No memory leaks
- Tab switches smooth
- Table scrolling responsive
- No UI freezes
- All data accurate after load

---

### Test Case 5.2: Report Generation Under Load

**Objective:** Verify ESG report generation with large datasets

**Preconditions:**
- 12 months of data
- 50 vehicles
- 10,000+ sessions
- 5 concurrent report requests

**Steps:**
1. Request ESG report for full year
2. Request second report while first generates
3. Monitor:
   - Generation time: <30s for first report
   - Second report: <45s (queued)
   - Server CPU usage
   - Database load
   - Memory usage
4. Download both PDFs
5. Verify data accuracy in both

**Expected Results:**
- First report: <30s generation
- Concurrent requests handled properly
- Both reports accurate and complete
- No data corruption
- Server remains responsive
- No timeout errors
- PDFs generated with quality

---

## Error & Edge Case Testing

### Test Case 6.1: OCPP Connection Failure Recovery

**Objective:** Verify system handles charging station connection failures gracefully

**Scenario:** Station loses internet connection mid-session

**Steps:**
1. Initiate charging session
2. Simulate network failure (disconnect OCPP WebSocket)
3. Wait 10 seconds
4. Observe system behavior:
   - Station status changes to "offline"
   - Session shows last known meter values
   - Frontend displays warning
   - System attempts reconnection
5. Restore network connection
6. Verify reconnection and data sync

**Expected Results:**
- Session doesn't crash
- User notified of connection issue
- Station status updates to "offline"
- Reconnection attempted automatically
- Upon restore, session continues with updated data
- No data loss
- User can still view last known values

---

### Test Case 6.2: Invalid Data Handling

**Objective:** Verify system handles invalid inputs gracefully

**Test Cases:**
1. Negative energy values
2. Impossible state of charge (>100%)
3. End time before start time
4. Zero price per gallon
5. Duplicate session IDs
6. Missing required fields

**Expected Results:**
- Validation errors caught
- User-friendly error messages displayed
- Data not persisted if invalid
- Error logged for troubleshooting
- No system crashes
- UI remains responsive

---

## Accessibility Testing

### Test Case 7.1: Dashboard Accessibility

**Objective:** Verify dashboard accessible to users with disabilities

**Tests:**
1. Keyboard navigation: Can tab through all controls
2. Screen reader: All metrics announced correctly
3. Color contrast: All text meets WCAG AA standards
4. Focus indicators: Clear focus on interactive elements
5. Alt text: All images have descriptive alt text
6. Form labels: All inputs properly labeled

**Expected Results:**
- Full keyboard accessibility
- Screen reader compatible
- Color contrast ≥ 4.5:1 for normal text
- Clear focus indicators
- All content reachable without mouse
- Accessible to users with visual impairments

---

## Integration Testing

### Test Case 8.1: Cross-Feature Data Consistency

**Objective:** Verify data consistency across all features

**Scenario:**
1. Record fuel transaction in Fuel Management
2. Verify vehicle efficiency calculates correctly
3. Initiate EV charging session for same vehicle
4. Verify charging session carbon offset calculated
5. Verify carbon data appears in Carbon Footprint Tracker
6. Verify ESG report includes all data

**Expected Results:**
- Vehicle data consistent across features
- Carbon calculations use same baseline
- No data discrepancies
- All features see same vehicle information
- Reports aggregate all data sources correctly

---

