# Fleet Management System - Maintenance & Service Features Documentation

## Executive Summary

The Fleet Management System includes five integrated Maintenance & Service modules designed to manage vehicle upkeep, predict issues, optimize garage operations, track parts inventory, and process maintenance requests. These modules work together to reduce vehicle downtime, optimize maintenance costs, and ensure fleet compliance and safety.

---

# 1. MAINTENANCE SCHEDULING FEATURE

## Feature Overview

**File Location:** `/home/user/Fleet/src/components/modules/MaintenanceScheduling.tsx`

**Purpose:** Centralized calendar-based maintenance scheduling system that allows fleet managers to schedule, track, and manage vehicle maintenance appointments across the entire fleet.

**Core Capability:** Provides a visual calendar interface with automated scheduling, status tracking, and cost estimation for routine and preventive maintenance.

## Target Users

1. **Fleet Managers** - Primary schedulers and overseers of maintenance operations
2. **Maintenance Coordinators** - Day-to-day scheduling and logistics
3. **Technicians** - View assigned maintenance work and prepare resources
4. **Service Providers** - External vendors managing scheduled services
5. **Finance Department** - Cost tracking and budget management

## User Stories

### Story 1: Schedule Routine Maintenance
**As a** fleet manager, **I want to** schedule oil changes, tire rotations, and filter replacements on a calendar **so that** I can ensure preventive maintenance is performed on time and reduce emergency breakdowns.

**Acceptance Criteria:**
- Select vehicle number and service type
- Choose scheduled date from calendar picker
- Set priority level (low, medium, high, urgent)
- Enter estimated cost
- Add optional notes
- Confirm scheduling with toast notification

### Story 2: Monitor Overdue Maintenance
**As a** maintenance coordinator, **I want to** see which vehicles have overdue maintenance **so that** I can prioritize urgent repairs and avoid safety issues.

**Acceptance Criteria:**
- Dashboard displays count of overdue services
- Color-coded red badge for overdue status
- Filter and view all overdue schedules
- Quick access to schedule details

### Story 3: Track Upcoming Maintenance
**As a** fleet manager, **I want to** see upcoming maintenance in the next 30 days **so that** I can plan resource allocation and avoid service backlogs.

**Acceptance Criteria:**
- Dashboard shows "Due Soon" count (30-day window)
- Table displays next 10 upcoming services
- Services sorted by due date
- Shows vehicle, service type, priority, cost
- Color-coded yellow for upcoming

### Story 4: View Maintenance Details
**As a** technician, **I want to** view complete maintenance schedule details including parts required and assigned provider **so that** I can prepare and perform the service correctly.

**Acceptance Criteria:**
- Dialog shows service information and vehicle details
- Displays scheduling data (due date, last service, frequency)
- Shows cost and assigned technician/provider
- Lists required parts
- Displays any special notes

## Key Workflows

### Workflow 1: Creating a New Maintenance Schedule
```
1. Click "Schedule Maintenance" button
   ↓
2. Dialog opens with form fields
   ↓
3. Enter required fields:
   - Vehicle Number
   - Service Type
   - Priority (dropdown)
   - Scheduled Date (calendar picker)
   - Estimated Cost (number input)
   - Notes (optional text)
   ↓
4. Click "Schedule Service"
   ↓
5. System validates fields:
   - Vehicle Number required
   - Service Type required
   - All other fields have defaults
   ↓
6. New MaintenanceSchedule object created with:
   - Auto-generated ID
   - Status: "scheduled"
   - Frequency: "As Needed"
   - Current date as creation time
   ↓
7. Schedule added to array
   ↓
8. Success toast notification displayed
   ↓
9. Dialog closes and form resets
```

### Workflow 2: Viewing Schedule by Date
```
1. User opens Maintenance Calendar
   ↓
2. Calendar component displayed on left side
   ↓
3. Today's date selected by default
   ↓
4. System filters all schedules for selected date:
   - Matches date portion of nextDue field
   ↓
5. Services displayed in right panel:
   - Vehicle icon + service type
   - Vehicle number as subtitle
   - Priority badge (color-coded)
   - Status badge (color-coded)
   - Estimated cost
   ↓
6. User can:
   - Click "View Details" for full information
   - Change selected date
   - See "X scheduled services for [date]"
```

### Workflow 3: Dashboard Summary
```
1. Dashboard loads all maintenance schedules
   ↓
2. Four metric cards calculate:
   a) Total Scheduled: (schedules || []).length
      
   b) Due Soon: Filter schedules where:
      - nextDue >= today
      - Sort by date ascending
      - Take first 10
      - Count = yellow badge
      
   c) Overdue: Filter schedules where:
      - nextDue < today
      - status !== "completed"
      - Count = red badge
      
   d) Completed: Filter where status === "completed"
      - Count = green badge
      ↓
3. Display counts with icons and descriptions
```

## Core Functionality & Features

### 1. Calendar Integration
- **Calendar Component:** React calendar with single-date selection mode
- **Date Filtering:** Schedules filtered by exact date match
- **Visual Selection:** Selected date highlighted on calendar

### 2. Schedule Management
- **Create:** Add new maintenance with all required details
- **Read:** View all schedules or filter by date
- **Details View:** Modal dialog with comprehensive information
- **Status Tracking:** Four status options: scheduled, due, overdue, completed

### 3. Priority System
- **Low:** Routine maintenance, cosmetic services
- **Medium:** Standard preventive maintenance
- **High:** Important components, safety-related
- **Urgent:** Critical safety issues, immediate attention required
- **Color Coding:** Each priority has distinct background color

### 4. Cost Tracking
- **Estimated Cost:** User-provided estimate during scheduling
- **Aggregation:** Total costs visible in each schedule card
- **Currency Format:** Localized display with commas (e.g., $1,500)

### 5. Service Frequency
- **Frequency Field:** Documents maintenance interval
- **Options:** Daily, Weekly, Monthly, Quarterly, Annually, Mileage-based, As Needed

## Data Inputs

### Schedule Creation Form
```
Vehicle Number (string): UNIT-001
Service Type (string): Oil Change, Tire Rotation, etc.
Priority (enum): low | medium | high | urgent
Scheduled Date (Date): Selected from calendar
Estimated Cost (number): Dollar amount
Notes (string, optional): Additional instructions
```

### Computed Fields
```
ID (string): Auto-generated as maint-${timestamp}
Status (enum): "scheduled" (default on creation)
Frequency (string): "As Needed" (default)
NextDue (ISO string): From scheduled date
```

## Data Outputs

### Maintenance Schedule Object
```typescript
{
  id: string                    // Auto-generated
  vehicleNumber: string         // From user input
  serviceType: string           // From user input
  priority: "low" | "medium" | "high" | "urgent"
  status: "scheduled" | "due" | "overdue" | "completed"
  nextDue: string              // ISO date string
  estimatedCost: number        // From user input
  frequency: string            // "As Needed" by default
  notes: string               // From user input
  lastCompleted?: string      // Historical data
  assignedTechnician?: string // Optional assignment
  serviceProvider?: string    // Optional provider
  parts?: string[]            // List of required parts
}
```

### Dashboard Metrics
- **totalScheduled:** Number of all schedules
- **dueSoon:** Count of schedules due in next 30 days
- **overdue:** Count of past-due incomplete schedules
- **completed:** Count of completed services this month

## Integration Points

### 1. Parts Inventory Integration
- Maintenance schedules reference parts required for service
- Can link to PartsInventory module via parts field
- Parts array stores part identifiers

### 2. Work Order Generation
- Schedules can trigger automatic work order creation
- WorkOrder template can be applied from schedule
- Schedule details (cost, parts, technician) populate work order

### 3. Predictive Maintenance
- Scheduled services informed by PredictiveMaintenance alerts
- Can auto-schedule based on AI predictions
- Similar data structure for integration

### 4. Garage Service Operations
- ServiceBay availability affects scheduling
- Work orders from schedules assigned to service bays
- Technician availability impacts scheduling

### 5. Fleet Data Hook Integration
- Uses localStorage-like storage: `useState<MaintenanceSchedule[]>("maintenance-schedules", [])`
- Local state management with default empty array
- No persistent backend storage (demo mode)

## Component Structure

### Main Component: MaintenanceScheduling
- **Props:** None (self-contained)
- **State:**
  - schedules: MaintenanceSchedule[]
  - selectedDate: Date | undefined
  - selectedSchedule: MaintenanceSchedule | null
  - isDetailsDialogOpen: boolean
  - isScheduleDialogOpen: boolean
  - newSchedule: partial MaintenanceSchedule object

### Sub-Components (from UI library)
- Card: Display containers for metrics and schedules
- Button: Actions (Schedule Maintenance, View Details)
- Calendar: Date selection widget
- Table: Upcoming schedules list
- Dialog: Forms and details modals
- Badge: Status and priority indicators

## UI Layout

```
┌─────────────────────────────────────────────────────┐
│ Maintenance Calendar                                 │
│ [Schedule Maintenance Button]                       │
├─────────────────────────────────────────────────────┤
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│ │ Total: XX    │  │ Due Soon: X  │  │ Overdue: X   │ │
│ │ All services │  │ Next 30 days │  │ Urgent       │ │
│ └──────────────┘  └──────────────┘  └──────────────┘ │
│ ┌──────────────┐                                      │
│ │ Completed: X │                                      │
│ │ This month   │                                      │
│ └──────────────┘                                      │
├─────────────────────────────────────────────────────┤
│ ┌─ Calendar ─┐  ┌─ Services for [Date] ──────────┐ │
│ │   [Days]    │  │  Service Type 1                 │ │
│ │   M T W T F │  │  Vehicle: UNIT-001              │ │
│ │   [Dates]   │  │  [Priority] [Status]            │ │
│ │             │  │  Est. Cost: $XXX                │ │
│ │   [Selected]│  │                                 │ │
│ │             │  │  Service Type 2                 │ │
│ └─────────────┘  │  [Details...]                   │ │
│                  └─────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ Upcoming Maintenance                                 │
│ ┌──────┬──────────┬──────────┬────────┬──────┐      │
│ │ Veh# │ Service  │ Due Date │ Prio.  │ Cost │ Acts │
│ ├──────┼──────────┼──────────┼────────┼──────┤      │
│ │ 001  │ Oil Chng │ Jan 15   │ Medium │ 120  │[View]│
│ │ 002  │ Tires    │ Jan 18   │ High   │ 400  │[View]│
│ └──────┴──────────┴──────────┴────────┴──────┘      │
└─────────────────────────────────────────────────────┘
```

## Suggested Test Scenarios

### Unit Tests

#### Test 1: Schedule Creation Validation
**Test:** Create schedule with missing vehicle number
**Expected:** Toast error "Please fill in vehicle number and service type"
**Validation:** Form does not submit, dialog remains open

#### Test 2: Schedule Creation Success
**Test:** Complete form with all required fields and click "Schedule Service"
**Expected:** 
- New schedule added to array
- Success toast: "Maintenance scheduled for UNIT-001"
- Dialog closes
- Form resets to default values

#### Test 3: Date Filtering
**Test:** Select various dates and verify schedule display
**Expected:** Only schedules matching selected date are shown
**Validation:** "X scheduled service(s)" count updates correctly

#### Test 4: Dashboard Metrics
**Test:** Add multiple schedules with different statuses and dates
**Expected:** 
- Total count increases
- Due Soon shows correct count for 30-day window
- Overdue count accurate
- Completed count reflects status

#### Test 5: Status Color Coding
**Test:** View schedules and verify badge colors
**Expected:** 
- Scheduled = blue
- Due = yellow
- Overdue = red
- Completed = green

#### Test 6: Priority Color Coding
**Test:** Create schedules with different priorities
**Expected:**
- Low = gray
- Medium = blue
- High = orange
- Urgent = red

### Integration Tests

#### Test 7: Dialog Open/Close
**Test:** Click schedule maintenance button multiple times
**Expected:** Dialog opens/closes correctly
**Validation:** Form resets on close, state updates properly

#### Test 8: Details Modal
**Test:** Click "View Details" on multiple schedules
**Expected:** 
- Modal displays correct schedule data
- All fields populated accurately
- Modal closes when clicking close button

#### Test 9: Calendar Date Selection
**Test:** Click different calendar dates
**Expected:** 
- Selected date updates
- Service list refreshes
- Format shows "MMMM d, yyyy"

#### Test 10: Empty State
**Test:** Select date with no scheduled services
**Expected:** 
- "No services scheduled for this date" message
- Services list empty
- Count shows "0 scheduled services"

### User Acceptance Tests

#### Test 11: Real-world Workflow
**Scenario:** Fleet manager schedules monthly oil change for vehicle fleet
**Steps:**
1. Click "Schedule Maintenance"
2. Select vehicle UNIT-001
3. Set service type "Oil Change"
4. Choose medium priority
5. Select date 30 days from today
6. Enter estimated cost $120
7. Add note "Use synthetic oil"
8. Click "Schedule Service"

**Expected:** Schedule appears on calendar, in upcoming table, and in metrics

#### Test 12: Overdue Tracking
**Scenario:** Monitor overdue maintenance
**Steps:**
1. Schedule service for date in past
2. Observe overdue metric and red badges
3. Verify in upcoming table
4. Confirm overdue count on dashboard

**Expected:** Service appears in overdue section with warnings

#### Test 13: Cost Planning
**Scenario:** Budget forecast for upcoming month
**Steps:**
1. Add multiple schedules with various costs
2. Review total estimated costs in table
3. Filter by due date range
4. Verify cost aggregation

**Expected:** Costs display correctly, calculations accurate

#### Test 14: Mobile Responsiveness
**Scenario:** Access maintenance scheduler on mobile
**Steps:**
1. Open on tablet/mobile device
2. Navigate calendar
3. Add schedule
4. View details

**Expected:** Calendar responsive, dialogs readable, buttons clickable

#### Test 15: Data Persistence
**Scenario:** Schedule service, refresh page
**Steps:**
1. Create multiple schedules
2. Refresh browser
3. Verify schedules still appear

**Expected:** Local storage persists data (if implemented)

---

# 2. PREDICTIVE MAINTENANCE FEATURE

## Feature Overview

**File Location:** `/home/user/Fleet/src/components/modules/PredictiveMaintenance.tsx`

**Purpose:** AI-powered predictive analytics module that identifies vehicles at risk of failure and recommends proactive maintenance to prevent breakdowns and reduce costs.

**Core Capability:** Analyzes vehicle telemetry and alerts to predict maintenance issues 5-60 days before failure with confidence scoring.

## Target Users

1. **Fleet Managers** - Strategic planning and preventive maintenance decisions
2. **Maintenance Supervisors** - Prioritize repairs based on risk
3. **Operations Managers** - Reduce downtime and emergency repairs
4. **Finance/Procurement** - Budget planning and parts ordering
5. **Executive Leadership** - ROI and cost savings visibility

## User Stories

### Story 1: Identify At-Risk Vehicles
**As a** fleet manager, **I want to** see which vehicles are at risk of maintenance issues **so that** I can schedule preventive maintenance before problems occur.

**Acceptance Criteria:**
- "At Risk" card displays count of vehicles needing attention
- List shows vehicle number, make, model, year
- Predicted issue type shown for each vehicle
- Confidence percentage (70-100%) displayed

### Story 2: Prioritize Critical Issues
**As a** maintenance supervisor, **I want to** identify which issues need immediate attention **so that** I can allocate technicians and parts to prevent emergencies.

**Acceptance Criteria:**
- "Critical" card shows vehicles with <15 days until failure
- Clear distinction between at-risk and critical
- Red icon for critical, orange for at-risk
- Sorted by urgency (days until failure)

### Story 3: Calculate Cost Savings
**As a** finance director, **I want to** see potential cost savings from proactive maintenance **so that** I can justify budget allocation.

**Acceptance Criteria:**
- "Potential Savings" metric displays dollar amount
- Calculation: vehicle count × $450 average savings
- Clearly states "vs reactive maintenance"
- Shows business case impact

### Story 4: Receive Specific Recommendations
**As a** maintenance coordinator, **I want to** understand exactly what maintenance each vehicle needs **so that** I can order parts and schedule work.

**Acceptance Criteria:**
- Specific issue prediction (e.g., "Brake Wear", "Oil Change Due")
- Estimated cost for each repair
- Days until failure countdown
- "Schedule Service" button for each alert

## Key Workflows

### Workflow 1: AI Analysis and Alert Generation
```
1. System loads all vehicles from fleet data
   ↓
2. Filter vehicles with:
   - alerts.length > 0 (have existing alerts), OR
   - Random selection (Math.random() > 0.7)
   ↓
3. Limit to top 15 vehicles for display
   ↓
4. For each vehicle, assign predictive data:
   ├─ Predicted Issue: Randomly select from:
   │  - "Brake Wear"
   │  - "Oil Change Due"
   │  - "Tire Replacement"
   │  - "Battery Health"
   │  - "Transmission Service"
   │
   ├─ Confidence: Random 70-100%
   │
   ├─ Days Until Failure: Random 5-65 days
   │
   └─ Estimated Cost: Random $200-$1700
   ↓
5. Alerts prepared for display
   ↓
6. Critical threshold: <15 days = URGENT
```

### Workflow 2: Alert Display and Filtering
```
1. Dashboard displays three metric cards:
   ├─ At Risk: Count of all predicted vehicles
   ├─ Critical: Count where daysUntilFailure < 15
   └─ Potential Savings: Count × $450
   ↓
2. Each alert card shows:
   ├─ Icon (red for critical, orange for at-risk)
   ├─ Vehicle number with make/model/year
   ├─ Predicted issue and confidence
   ├─ Days until failure
   ├─ Estimated cost
   └─ "Schedule Service" button
   ↓
3. User interactions:
   ├─ Review alert details
   ├─ Click to schedule service
   └─ Track by vehicle priority
```

### Workflow 3: Service Scheduling from Prediction
```
1. User reviews critical alert
   ↓
2. Clicks "Schedule Service" button
   ↓
3. Navigation/integration to MaintenanceScheduling module
   (Details depend on implementation)
   ↓
4. Service created with:
   - Vehicle ID from prediction
   - Issue type (e.g., "Brake Wear")
   - High/Urgent priority
   - Estimated cost from prediction
   - Scheduled date based on days until failure
   ↓
5. Schedule added to maintenance queue
```

## Core Functionality & Features

### 1. Intelligent Risk Assessment
- **Data Source:** Vehicle alerts array from fleet data
- **Filtering Logic:** Vehicles with existing alerts OR random sampling
- **Prediction Algorithms:** 
  - Issue type: Multi-category prediction
  - Confidence: 70-100% certainty scoring
  - Timeline: 5-60 day failure window estimation

### 2. Multi-Level Alerting
- **At Risk:** Vehicles predicted to need maintenance within 60 days
- **Critical:** Vehicles <15 days from predicted failure
- **Recommendations:** Proactive vs reactive strategy comparison

### 3. Cost-Benefit Analysis
- **Per-Vehicle Estimate:** Specific repair costs
- **Aggregate Savings:** Fleet-wide potential savings ($450 per vehicle)
- **ROI Calculation:** Preventive vs emergency repair cost comparison

### 4. Severity-Based Prioritization
- **Visual Indicators:** 
  - Red icon for critical (destructive icon)
  - Orange/yellow icon for at-risk (warning icon)
- **Sorting:** Implicit by daysUntilFailure (lower = more urgent)

## Data Inputs

### Source Data
```typescript
// From useFleetData hook
vehicles: Vehicle[]  // List of all fleet vehicles

// Each vehicle has:
- id: string
- number: string (e.g., "UNIT-001")
- year: number
- make: string
- model: string
- alerts: string[]  // Existing alert triggers
```

### Prediction Data (AI-Generated)
```typescript
// For each vehicle, system generates:
predictedIssue: string     // Issue type
confidence: number         // 70-100
daysUntilFailure: number  // 5-65
estimatedCost: number     // $200-$1700
```

## Data Outputs

### Predictive Maintenance Alert
```typescript
{
  ...vehicle,  // All vehicle properties
  predictedIssue: string       // e.g., "Brake Wear"
  confidence: number           // 70-100%
  daysUntilFailure: number    // Days until failure
  estimatedCost: number       // Estimated repair cost
}
```

### Dashboard Metrics
```typescript
{
  atRisk: number              // Count of at-risk vehicles
  critical: number            // Count of critical vehicles (<15 days)
  potentialSavings: number   // atRisk × $450
}
```

## Integration Points

### 1. Fleet Data Hook
- Reads from `useFleetData()` hook
- Accesses vehicle alerts
- Provides vehicle information
- Component accepts data as prop

### 2. Maintenance Scheduling
- "Schedule Service" button triggers scheduling flow
- Can pre-populate:
  - Vehicle ID
  - Service type (predicted issue)
  - Estimated cost
  - Priority (urgent/high)
  - Suggested date (today + daysUntilFailure)

### 3. Work Order System
- Predicted issues can auto-create work orders
- Templates for common predictions
- Cost estimates inform work order budgets

### 4. Parts Inventory
- Predicted issues inform parts ordering
- Common issues suggest parts to pre-stock
- Inventory optimization based on predictions

### 5. Analytics Dashboard
- Feeds into fleet health metrics
- Cost savings calculations
- Maintenance compliance reporting

## Component Structure

### Main Component: PredictiveMaintenance
- **Props:** 
  - data: ReturnType<typeof useFleetData>
- **Internal State:** None (stateless, props-driven)
- **Computed Properties:**
  - predictiveVehicles: Filtered and mapped with predictions

### Sub-Components (from UI library)
- Card: Metric cards and alert containers
- Badge: Confidence and status indicators
- Button: "Schedule Service" actions
- Icon: Warning, Lightning, TrendUp icons

## UI Layout

```
┌─────────────────────────────────────────────────────┐
│ Predictive Maintenance                              │
│ AI-powered predictions to prevent vehicle downtime  │
├─────────────────────────────────────────────────────┤
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│ │ [Warning]    │  │ [Lightning]  │  │ [TrendUp]    │ │
│ │ At Risk: 15  │  │ Critical: 3  │  │ Savings:     │ │
│ │ vehicles     │  │ urgent attn  │  │ $6,750       │ │
│ │              │  │              │  │ vs reactive  │ │
│ └──────────────┘  └──────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────┤
│ Predictive Maintenance Alerts                       │
│ ┌─────────────────────────────────────────────────┐ │
│ │ [Wrench] UNIT-001                    │ [Orange]│ │
│ │          2024 Toyota Camry            │ Alert  │ │
│ │ Brake Wear                            │        │ │
│ │ 78% confidence     │ 12 days │ $850   │[Sched]│ │
│ └─────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────┐ │
│ │ [Wrench] UNIT-002                    │ [Red]  │ │
│ │          2023 Ford F-150              │ CRITICAL
│ │ Oil Change Due                        │        │ │
│ │ 85% confidence     │ 8 days  │ $150   │[Sched]│ │
│ └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ Maintenance Recommendations                         │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Proactive Scheduling                            │ │
│ │ Schedule maintenance for 8 vehicles before      │ │
│ │ predicted issues occur, saving ~$3,600 in      │ │
│ │ emergency repairs.                              │ │
│ └─────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Parts Inventory Optimization                    │ │
│ │ Pre-order commonly needed parts based on        │ │
│ │ predictions to reduce downtime by 40%.          │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## Suggested Test Scenarios

### Unit Tests

#### Test 1: Vehicle Filtering
**Test:** Load 30 vehicles with 10 having alerts
**Expected:** Predictive list contains vehicles with alerts + some random selections
**Validation:** Filtered list length ≤ 15, includes all alert vehicles

#### Test 2: Prediction Generation
**Test:** Verify predictions assigned to vehicles
**Expected:** 
- predictedIssue from defined list
- confidence: 70-100
- daysUntilFailure: 5-65
- estimatedCost: 200-1700

#### Test 3: Metric Calculations
**Test:** Add multiple vehicles to predictions
**Expected:**
- atRisk = predictiveVehicles.length
- critical = vehicles where daysUntilFailure < 15
- savings = atRisk × 450

#### Test 4: Critical vs At-Risk Distinction
**Test:** Generate vehicles with daysUntilFailure < 15 and > 15
**Expected:**
- Critical vehicles show red icon
- At-risk vehicles show orange icon
- Critical count accurate in metric

#### Test 5: Confidence Display
**Test:** Verify confidence scoring
**Expected:** 
- Range: 70-100%
- Displayed with prediction
- Consistent format

#### Test 6: Cost Estimation Range
**Test:** Generate multiple predictions
**Expected:** 
- All costs between $200-$1700
- Realistic values
- Displayed as "Est. $XXX"

### Integration Tests

#### Test 7: Alert Card Rendering
**Test:** Render alert cards with all data
**Expected:**
- Vehicle number displayed
- Make/model/year shown
- Issue type visible
- Confidence percentage shown
- Days and cost displayed

#### Test 8: Schedule Service Flow
**Test:** Click "Schedule Service" on critical alert
**Expected:**
- Button clickable
- Navigation to scheduling (if integrated)
- Service pre-populated with:
  - Vehicle ID
  - Issue type
  - Estimated cost
  - High/urgent priority

#### Test 9: Metric Card Display
**Test:** Verify all three metric cards render
**Expected:**
- At Risk card: Shows count + "vehicles need attention"
- Critical card: Shows count + "urgent attention required"
- Savings card: Shows dollar amount + "vs reactive maintenance"

#### Test 10: Empty Fleet
**Test:** Load with no vehicles or all vehicles without alerts
**Expected:**
- No errors
- Empty predictions list
- Metrics show 0
- No alert cards displayed

### User Acceptance Tests

#### Test 11: Priority Dashboard
**Scenario:** Fleet manager reviews maintenance priorities
**Steps:**
1. View Predictive Maintenance dashboard
2. Review "At Risk" count
3. Identify "Critical" vehicles needing immediate action
4. Check potential savings opportunity
5. Click "Schedule Service" on top 3 critical items

**Expected:** 
- Clear visual hierarchy
- Critical items obvious
- Easy action path to scheduling

#### Test 12: Cost Justification
**Scenario:** Executive wants to understand preventive vs reactive ROI
**Steps:**
1. Note "At Risk" count (e.g., 15 vehicles)
2. See potential savings ($6,750)
3. Average per vehicle: $450
4. Compare against typical emergency repair: $1,000-$2,000

**Expected:** Clear cost benefit visible

#### Test 13: Technician Preparation
**Scenario:** Technician reviews upcoming critical maintenance
**Steps:**
1. Filter view to only critical alerts
2. Review predicted issues (e.g., "Brake Wear")
3. Note estimated costs and vehicle types
4. Pre-order parts based on predictions

**Expected:** Sufficient detail for tech to prepare

#### Test 14: Mobile Viewing
**Scenario:** Manager checks alerts on mobile device
**Steps:**
1. Open dashboard on phone
2. View metric cards
3. Scroll through alert list
4. Click action buttons

**Expected:** Responsive layout, readable text

#### Test 15: Continuous Updates
**Scenario:** Monitor predictions over time
**Steps:**
1. View dashboard today
2. Check alerts next week
3. Verify new predictions as vehicles age
4. Track which predictions became actual maintenance

**Expected:** System continuously evaluates fleet health

---

# 3. GARAGE SERVICE FEATURE

## Feature Overview

**File Location:** `/home/user/Fleet/src/components/modules/GarageService.tsx`

**Purpose:** Comprehensive service center management system for coordinating work orders, managing service bays, tracking technicians, and organizing maintenance operations.

**Core Capability:** Provides real-time visibility into garage operations with tabs for dashboard, bays, work orders, technicians, and maintenance scheduling.

## Target Users

1. **Garage Manager** - Overall service center operations
2. **Service Bay Coordinator** - Bay allocation and scheduling
3. **Technicians** - Work assignments and bay management
4. **Dispatchers** - Work order assignment and prioritization
5. **Fleet Managers** - Service availability and capacity planning

## User Stories

### Story 1: Monitor Service Bay Availability
**As a** garage manager, **I want to** see which service bays are available **so that** I can assign incoming work and maximize utilization.

**Acceptance Criteria:**
- Dashboard shows count of available bays
- Service Bays tab lists all bays with status
- Each bay shows:
  - Bay number/identifier
  - Status (available or occupied)
  - If occupied: vehicle, service type, technician, estimated completion
- Green badge for available, orange for occupied

### Story 2: Track Active Work Orders
**As a** dispatcher, **I want to** see all work orders and their status **so that** I can coordinate work, prioritize tasks, and manage deadlines.

**Acceptance Criteria:**
- Dashboard shows count of in-progress work orders
- Work Orders tab displays all orders with:
  - Vehicle number
  - Service type
  - Priority badge (color-coded)
  - Status badge (color-coded)
  - Cost and assigned technician
  - Created date
- Filter/sort by status, priority, vehicle

### Story 3: Manage Technician Assignments
**As a** garage manager, **I want to** see technician availability and specializations **so that** I can match skilled technicians to appropriate work.

**Acceptance Criteria:**
- Technicians tab shows all technicians with:
  - Name and availability status
  - Efficiency percentage
  - Specializations (badges)
  - Active work order count
  - Color-coded availability (green=available, orange=busy)
- Can see efficiency metrics
- Know which techs have capacity

### Story 4: Create New Work Orders
**As a** dispatcher, **I want to** create work orders quickly **so that** I can get work started in the garage.

**Acceptance Criteria:**
- "New Work Order" button on header
- Opens form with fields:
  - Vehicle selection
  - Service type
  - Priority level
  - Assignment options
- Dialog modal interface
- Validation and success feedback

### Story 5: Identify Overdue Jobs
**As a** garage manager, **I want to** identify work orders that are pending with urgent priority **so that** I can escalate and ensure timely completion.

**Acceptance Criteria:**
- Dashboard metric: "Overdue Maintenance" count
- Shows pending + urgent priority orders
- Metric color changes based on count (>5 = warning)
- Listed in recent work orders with visual indicators

## Key Workflows

### Workflow 1: Dashboard Overview
```
1. GarageService component loads
   ↓
2. Fetch data from useFleetData hook:
   - serviceBays: ServiceBay[]
   - workOrders: WorkOrder[]
   - technicians: Technician[]
   ↓
3. Calculate metrics:
   a) availableBays = serviceBays.filter(s => status === "available").length
   
   b) activeWorkOrders = workOrders.filter(w => status === "in-progress").length
   
   c) availableTechs = technicians.filter(t => availability === "available").length
   
   d) overdueJobs = workOrders.filter(w => 
       status === "pending" && priority === "urgent"
     ).length
   ↓
4. Display metric cards with:
   - Icon (Wrench, Clock, User, Warning)
   - Title and value
   - Subtitle with context
   - Status indicator (info/success/warning)
   ↓
5. Display two grids:
   a) Service Bay Status (first 6 bays)
   b) Recent Work Orders (first 6 orders)
```

### Workflow 2: Service Bay Management
```
1. User clicks "Service Bays" tab
   ↓
2. Grid layout displays all bays (2-3 columns)
   ↓
3. For each bay card:
   ├─ Display bay number (e.g., "Bay 1")
   ├─ Show status badge:
   │  └─ Green if available, Orange if occupied
   │
   └─ If occupied, display:
      ├─ Vehicle identification
      ├─ Service type being performed
      ├─ Assigned technician name
      ├─ Estimated completion time
      └─ Wrench icon
   ↓
4. Available bays show:
   └─ "Ready for service" message
   ↓
5. User can click to:
   - Assign vehicle (if available)
   - View details (if occupied)
   - Complete service (if done)
```

### Workflow 3: Work Order Management
```
1. User clicks "Work Orders" tab
   ↓
2. List view displays all work orders
   ↓
3. For each order:
   ├─ Vehicle number (primary identifier)
   ├─ Service type (secondary info)
   ├─ Priority badge (color-coded):
   │  ├─ Low: Gray
   │  ├─ Medium: Blue tint
   │  ├─ High: Orange
   │  └─ Urgent: Red
   │
   ├─ Status badge (color-coded):
   │  ├─ Pending: Yellow
   │  ├─ In Progress: Blue
   │  ├─ Completed: Green
   │  └─ Cancelled: Gray
   │
   ├─ Created date
   ├─ Cost (if available)
   ├─ Assigned technician
   ├─ Description/notes
   └─ Hover effect on card
   ↓
4. User can:
   - Click to view full details
   - Update status
   - Reassign technician
   - View cost tracking
```

### Workflow 4: Technician Status View
```
1. User clicks "Technicians" tab
   ↓
2. Grid layout (3 columns) of technician cards
   ↓
3. For each technician:
   ├─ Name displayed prominently
   │
   ├─ Availability badge (color-coded):
   │  ├─ Available: Green
   │  ├─ Busy: Orange
   │  └─ Off-duty: Gray
   │
   ├─ Efficiency score (percentage)
   │  └─ Shows skill level / performance
   │
   ├─ Specializations (badge list):
   │  ├─ Engine Work
   │  ├─ Electrical
   │  ├─ Brakes
   │  ├─ Transmission
   │  └─ etc.
   │
   └─ Active Work Orders count
   ↓
4. Manager can:
   - See who's available for assignment
   - Match specialization to work type
   - Understand capacity (active orders)
```

## Core Functionality & Features

### 1. Real-Time Operational Metrics
- **Available Bays:** Current count of open service bays
- **Active Work Orders:** In-progress jobs
- **Available Technicians:** Ready to start new work
- **Overdue Jobs:** Pending urgent orders requiring attention

### 2. Service Bay Management
- **Status Tracking:** Available, Occupied, Maintenance
- **Vehicle Assignment:** Link vehicle to bay
- **Service Type:** What work is being performed
- **Technician Assignment:** Who's working on the vehicle
- **Time Tracking:** Estimated completion time

### 3. Work Order System
- **Creation:** New work order form
- **Tracking:** Full lifecycle visibility
- **Prioritization:** 4-level priority system (low, medium, high, urgent)
- **Status Flow:** Pending → In Progress → Completed/Cancelled
- **Cost Management:** Estimate and actual costs
- **Labor Tracking:** Hours estimated and actual
- **Parts Integration:** Parts used in repair
- **Technician Assignment:** Assign work to specific techs

### 4. Technician Management
- **Availability Status:** Available, Busy, Off-duty
- **Specializations:** Multiple areas of expertise
- **Efficiency Metrics:** Performance percentage
- **Workload Visibility:** Active orders count
- **Certifications:** Professional qualifications
- **Skills Matching:** Assign appropriate techs to jobs

### 5. Multi-Tab Interface
- **Dashboard:** Overview of all metrics
- **Service Bays:** Detailed bay management
- **Work Orders:** Complete order list and details
- **Technicians:** Staff status and assignments
- **Maintenance Schedule:** (Placeholder for recurring schedules)

## Data Inputs

### Service Bay Data
```typescript
{
  id: string
  number: string              // Bay 1, Bay 2, etc.
  status: "occupied" | "available" | "maintenance"
  vehicle?: string            // Vehicle number
  serviceType?: string        // Type of service
  technician?: string         // Assigned tech name
  estimatedCompletion?: string // ISO timestamp
}
```

### Work Order Data
```typescript
{
  id: string
  vehicleNumber: string
  serviceType: string
  priority: "low" | "medium" | "high" | "urgent"
  status: "pending" | "in-progress" | "completed" | "cancelled"
  assignedTo?: string         // Technician name
  cost?: number               // Estimated or actual
  laborHours?: number         // Estimated labor
  createdDate: string
  completedDate?: string
  description: string
  notes?: string[]
  parts?: { partId; quantity; cost }[]
  createdBy: string
  approvedBy?: string
}
```

### Technician Data
```typescript
{
  id: string
  name: string
  specialization: string[]    // Array of skills
  availability: "available" | "busy" | "off-duty"
  efficiency: number          // Percentage (0-100)
  certifications: string[]    // Professional certs
  activeWorkOrders: number    // Count of current work
}
```

## Data Outputs

### Garage Metrics Object
```typescript
{
  availableBays: number           // Count of open bays
  activeWorkOrders: number        // In-progress count
  availableTechs: number          // Available technicians
  overdueJobs: number             // Pending + urgent
}
```

### Metric Card Component
- Title: "Available Bays"
- Value: 3
- Subtitle: "of 8 total"
- Icon: Wrench
- Status: "info"

## Integration Points

### 1. Fleet Data Hook (useFleetData)
- Reads serviceBays array
- Accesses workOrders list
- Retrieves technicians data
- Updates work order status
- Fetches bay assignments

### 2. Work Order Management
- Creates new work orders
- Updates status (pending → in-progress → completed)
- Tracks costs and labor hours
- Records completion details
- Manages part usage

### 3. Parts Inventory
- Work orders reference parts used
- Part cost tracking
- Inventory deduction on work order completion
- Parts availability influences scheduling

### 4. Technician Management
- Assign technicians to work orders
- Track active assignments
- Update availability status
- Display specialization requirements
- Monitor efficiency metrics

### 5. Maintenance Scheduling
- Scheduled services create work orders
- Recurring maintenance triggers bay allocation
- Schedule templates affect work order templates
- Completion updates maintenance records

### 6. Vehicle Management
- Links work to vehicle identification
- Updates vehicle service history
- Affects vehicle status (service vs active)
- Influences maintenance due dates

## Component Structure

### Main Component: GarageService
- **Props:** 
  - data: ReturnType<typeof useFleetData>
- **State:**
  - activeTab: string (dashboard, service-bays, work-orders, technicians, schedule)
- **Computed Properties:**
  - metrics: Object with bay, order, tech, and overdue counts

### Sub-Components
- Tabs: TabsList, TabsTrigger, TabsContent
- Card: Layout containers
- MetricCard: Custom component for stats display
- Badge: Priority/status indicators
- Button: Create, assign, complete actions
- Table: Work orders list view
- Grid: Bays and technicians card layout

## UI Layout - Dashboard Tab

```
┌─────────────────────────────────────────────────────┐
│ Garage & Service Center                    [New WO] │
├─────────────────────────────────────────────────────┤
│ [Dashboard] [Service Bays] [Work Orders] [Techs] [Schedule]
├─────────────────────────────────────────────────────┤
│ ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│ │ [Wrench] │  │ [Clock]  │  │ [User]   │  │[Warning]│ │
│ │ Avail    │  │ Active   │  │ Avail    │  │ Overdue │ │
│ │ Bays: 3  │  │ Work: 4  │  │ Techs: 2 │  │ Maint:2 │ │
│ │ of 8     │  │ in prog  │  │ of 5     │  │ req attn│ │
│ └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
├─────────────────────────────────────────────────────┤
│ Service Bay Status    │ Recent Work Orders          │
│ ┌──────────────────┐ │ ┌──────────────────────────┐│
│ │ Bay 1: Available │ │ │ UNIT-001: Oil Change    ││
│ │ Ready for work   │ │ │ [Medium] [In-Progress]  ││
│ │                  │ │ │ John Smith, $120        ││
│ ├──────────────────┤ │ ├──────────────────────────┤│
│ │ Bay 2: Occupied  │ │ │ UNIT-002: Brake Pads    ││
│ │ UNIT-001         │ │ │ [Urgent] [Pending]      ││
│ │ Oil Change       │ │ │ Jane Doe, $450          ││
│ │ Tech: John Smith │ │ └──────────────────────────┘│
│ │ Est: 2:30 PM     │ │                             │
│ └──────────────────┘ │                             │
└─────────────────────────────────────────────────────┘
```

## Suggested Test Scenarios

### Unit Tests

#### Test 1: Metric Calculations
**Test:** Add multiple bays and work orders with different statuses
**Expected:**
- availableBays = count of "available" status
- activeWorkOrders = count of "in-progress"
- availableTechs = count where availability === "available"
- overdueJobs = count where status === "pending" AND priority === "urgent"

#### Test 2: Color Coding - Priority
**Test:** Display work orders with all priority levels
**Expected:**
- Low: Gray/muted colors
- Medium: Blue tint
- High: Orange
- Urgent: Red/destructive

#### Test 3: Color Coding - Status
**Test:** Display orders with all statuses
**Expected:**
- Pending: Yellow/warning
- In-Progress: Blue/accent
- Completed: Green/success
- Cancelled: Gray/muted

#### Test 4: Tab Navigation
**Test:** Click through all five tabs
**Expected:**
- Active tab highlighted
- Content changes for each tab
- State persists when switching back
- No data loss on navigation

#### Test 5: Technician Specialization Display
**Test:** Load technicians with multiple specializations
**Expected:**
- Each specialization shown as badge
- Multiple specializations fit in layout
- Sorted or categorized logically

#### Test 6: Bay Occupancy Details
**Test:** Display occupied vs available bays
**Expected:**
- Occupied bays show: vehicle, service, tech, ETA
- Available bays show: "Ready for service"
- Different styling/borders for each

### Integration Tests

#### Test 7: Work Order Creation Flow
**Test:** Click "New Work Order" button
**Expected:**
- Dialog opens with form
- Can select vehicle, service type, priority
- Can assign technician
- Form submits and adds to list

#### Test 8: Metric Card Updates
**Test:** Add/complete work orders and bays
**Expected:**
- Metric counts update in real-time
- Color status changes when overdueJobs changes

#### Test 9: Service Bay Details
**Test:** Click on occupied bay card
**Expected:**
- Shows full details
- Can view assigned technician
- Can view service being performed
- Can view estimated completion

#### Test 10: Work Order Details
**Test:** Click on work order in table
**Expected:**
- Opens modal with full details
- Shows all related data
- Can update status
- Can reassign technician

### User Acceptance Tests

#### Test 11: Morning Operations Review
**Scenario:** Garage manager starts day
**Steps:**
1. Open Garage Service dashboard
2. Review metric cards for bay availability
3. Check overdue/urgent jobs
4. See active work orders
5. Identify available technicians
6. Plan day's work

**Expected:**
- All key metrics visible at a glance
- Can quickly identify priorities
- Clear visual hierarchy

#### Test 12: Customer Arrival Workflow
**Scenario:** New vehicle arrives for service
**Steps:**
1. Click "New Work Order"
2. Select vehicle from available list
3. Enter service type
4. Set priority
5. Assign available technician
6. Assign available bay
7. Submit

**Expected:**
- Vehicle assigned to bay
- Technician shows as busy
- Work order appears in active list
- Bay shows as occupied

#### Test 13: Service Completion
**Scenario:** Technician completes work
**Steps:**
1. Work order status updated to "completed"
2. Bay marked as available
3. Technician availability updated
4. Cost finalized
5. Parts inventory updated

**Expected:**
- Metrics update automatically
- Bay available for next vehicle
- Tech can take new assignment
- Service history recorded

#### Test 14: Technician Assignment
**Scenario:** Manager matches specialist to work
**Steps:**
1. View technicians tab
2. Check specialization badges
3. Review active workload
4. Assign brake specialist to brake work
5. Verify assignment in work orders

**Expected:**
- Specializations clearly visible
- Can make informed assignments
- Workload prevents over-assignment

#### Test 15: Multi-Bay Coordination
**Scenario:** Manage 8 service bays with different work
**Steps:**
1. View service bays tab (grid view)
2. See status of all 8 bays
3. Identify available bays
4. See vehicles currently in service
5. Manage flow through bays

**Expected:**
- All bays visible at once
- Clear status for each
- Easy to spot bottlenecks
- Capacity planning visible

---

# 4. PARTS INVENTORY FEATURE

## Feature Overview

**File Location:** `/home/user/Fleet/src/components/modules/PartsInventory.tsx`

**Purpose:** Comprehensive parts inventory management system for tracking vehicle parts, managing stock levels, optimizing reorder points, and controlling inventory assets.

**Core Capability:** Provides complete visibility into parts stock with real-time levels, automatic reorder alerts, and cost tracking.

## Target Users

1. **Inventory Manager** - Overall stock management
2. **Parts Technician** - Daily stock operations
3. **Purchasing Manager** - Reorder management and vendor coordination
4. **Garage Manager** - Parts availability for work orders
5. **Finance/Accounting** - Inventory valuation and asset tracking

## User Stories

### Story 1: Add New Parts to Inventory
**As an** inventory manager, **I want to** add new parts with complete information **so that** I can track all components needed for maintenance.

**Acceptance Criteria:**
- Dialog form to add part with fields:
  - Part Number (required, e.g., ABC-12345)
  - Part Name (required, e.g., Oil Filter)
  - Category (required dropdown)
  - Manufacturer
  - Description
  - Quantity on hand
  - Unit cost
  - Min/Max/Reorder stock levels
  - Storage location
- Form validation for required fields
- Success notification
- Dialog closes after save

### Story 2: Monitor Stock Levels
**As a** parts technician, **I want to** see current stock levels for all parts **so that** I know what's available for maintenance work.

**Acceptance Criteria:**
- Dashboard shows:
  - Total parts count
  - Total inventory value (quantity × unit cost)
  - Low stock item count (≤ reorder point)
  - Out of stock item count (= 0)
- Each part shows:
  - Stock level progress bar
  - Quantity on hand / max capacity
  - Color-coded status (out of stock, low, in stock, overstocked)
- Visual indicators of problem areas

### Story 3: Identify Reorder Needs
**As a** purchasing manager, **I want to** identify parts that need reordering **so that** I can place purchase orders before stock runs out.

**Acceptance Criteria:**
- "Low Stock Items" metric shows count
- Parts marked with "Low Stock" status badge
- Filter by stock status
- View can be sorted by reorder urgency
- Can click to create purchase order
- Low stock = quantity ≤ reorder point

### Story 4: Search and Filter Parts
**As a** technician, **I want to** quickly find specific parts **so that** I can verify availability before starting work.

**Acceptance Criteria:**
- Search box with real-time filtering by:
  - Part number
  - Part name
  - Manufacturer
- Category filter dropdown
- Can combine search + category filter
- Instant results as typing
- Clear button to reset

### Story 5: Track Inventory Value
**As a** finance director, **I want to** know the total value of parts inventory **so that** I can properly account for assets on the balance sheet.

**Acceptance Criteria:**
- Dashboard shows "Inventory Value" total
- Calculation: SUM(quantity × unit cost) for all parts
- Displayed in currency format
- Green trend indicator
- Updated in real-time as parts added/removed

## Key Workflows

### Workflow 1: Adding a New Part
```
1. Click "Add Part" button
   ↓
2. Dialog opens with form fields
   ↓
3. User fills required fields:
   ├─ Part Number (e.g., "ABC-12345")
   └─ Part Name (e.g., "Oil Filter")
   ↓
4. User fills category:
   ├─ Engine
   ├─ Transmission
   ├─ Brakes
   ├─ Electrical
   ├─ Body
   ├─ Interior
   ├─ Tires
   ├─ Fluids
   ├─ Filters
   └─ Other
   ↓
5. User fills optional fields:
   ├─ Description (textarea)
   ├─ Manufacturer
   ├─ Storage location
   ├─ Current quantity
   ├─ Unit cost
   ├─ Min/Max stock levels
   └─ Reorder point
   ↓
6. Click "Add Part"
   ↓
7. Validation:
   - Part Number required
   - Part Name required
   - All else has defaults
   ↓
8. Part created with:
   - Auto-generated ID (part-${timestamp})
   - All user input
   - Empty alternateVendors array
   ↓
9. Success toast: "Part added to inventory"
   ↓
10. Dialog closes
    ↓
11. Form resets to defaults
    ↓
12. Part appears in inventory table
```

### Workflow 2: Stock Level Monitoring
```
1. User views Parts Inventory dashboard
   ↓
2. Four metric cards calculated:
   a) Total Parts = (parts || []).length
      
   b) Inventory Value:
      sum = 0
      for each part:
        sum += quantity × unit cost
      
   c) Low Stock Items:
      filter parts where quantity ≤ reorderPoint
      count = filtered array length
      
   d) Out of Stock:
      filter parts where quantity === 0
      count = filtered array length
   ↓
3. Display metrics with:
   - Icon (Package, TrendUp, Warning, TrendDown)
   - Value (count or currency)
   - Subtitle with context
   - Color indicator (yellow for low, red for out)
   ↓
4. In inventory table:
   For each part:
   - Stock level progress bar
     └─ percentage = (quantity / maxStockLevel) × 100
   - Quantity display: "X / max"
   - Status badge:
     ├─ Out of Stock: Red
     ├─ Low Stock: Yellow
     ├─ In Stock: Green
     └─ Overstocked: Blue
```

### Workflow 3: Part Search and Filtering
```
1. User enters search term in search box
   ↓
2. Real-time filtering as typing:
   - Filters by part number (lowercase compare)
   - OR by name (lowercase compare)
   - OR by manufacturer (lowercase compare)
   ↓
3. User selects category from dropdown:
   - "All Categories" (default)
   - "Engine", "Transmission", "Brakes", etc.
   ↓
4. Combined filtering:
   - Part matches search term AND
   - Part matches category
   ↓
5. Table updates to show filtered results
   ↓
6. Display count: "Inventory ({filteredParts.length})"
   ↓
7. If no results:
   - "No parts found. Add parts to manage inventory."
```

### Workflow 4: Reorder Point Management
```
1. System continuously monitors stock levels
   ↓
2. For each part:
   - Compare: quantity ≤ reorderPoint?
   ↓
3. If true:
   - Add to "Low Stock Items" metric
   - Display "Low Stock" status badge
   - Highlight in table with yellow color
   ↓
4. Procurement manager:
   - Filters by low stock status
   - Reviews quantity and reorder point
   - Creates purchase order for restock
   ↓
5. When stock received:
   - Quantity updated
   - Status badge changes
   - Removed from low stock count
```

## Core Functionality & Features

### 1. Part Catalog Management
- **Part Number:** Unique identifier
- **Part Name:** Descriptive title
- **Category:** 10 categories (Engine, Transmission, Brakes, etc.)
- **Manufacturer:** Supplier information
- **Description:** Detailed specifications
- **Compatible Vehicles:** List of compatible models
- **Alternate Vendors:** Secondary suppliers

### 2. Stock Level Management
- **Current Quantity:** On-hand count
- **Min Stock Level:** Minimum safe stock
- **Max Stock Level:** Maximum capacity
- **Reorder Point:** Trigger for reordering
- **Stock Status:** Out/Low/In/Overstocked
- **Visual Progress Bar:** Percentage of max capacity

### 3. Financial Tracking
- **Unit Cost:** Price per unit
- **Total Inventory Value:** SUM(quantity × unit cost)
- **Cost Tracking:** Per-part and aggregate
- **Asset Valuation:** Balance sheet accounting
- **Usage Cost:** Integration with work orders

### 4. Inventory Operations
- **Add Parts:** Complete form with all attributes
- **Update Quantity:** Adjust on-hand count
- **Delete Parts:** Remove from inventory
- **Transfer:** Move between locations
- **Adjust:** Handle discrepancies

### 5. Search and Discovery
- **Multi-field Search:** Part #, name, manufacturer
- **Category Filtering:** 10 categories
- **Combined Filters:** Search + category
- **Real-time Results:** Instant as typing
- **No results messaging:** Helpful prompts

## Data Inputs

### Part Addition Form
```typescript
{
  partNumber: string              // e.g., "ABC-12345"
  name: string                    // e.g., "Oil Filter"
  description: string             // Detailed info
  category: "engine" | "transmission" | ... | "other"
  manufacturer: string            // Supplier name
  compatibleVehicles: string[]   // List of models
  quantityOnHand: number         // Current stock
  minStockLevel: number          // Minimum (default 10)
  maxStockLevel: number          // Maximum (default 100)
  reorderPoint: number           // Reorder trigger (default 20)
  unitCost: number               // Price per unit
  location: string               // Storage location
}
```

### Search/Filter Inputs
```typescript
{
  searchTerm: string             // User search query
  filterCategory: string         // Selected category or "all"
}
```

## Data Outputs

### Complete Part Object
```typescript
{
  id: string                     // part-${timestamp}
  partNumber: string
  name: string
  description: string
  category: "engine" | ... | "other"
  manufacturer: string
  compatibleVehicles: string[]
  quantityOnHand: number
  minStockLevel: number
  maxStockLevel: number
  reorderPoint: number
  unitCost: number
  location: string
  preferredVendorId?: string
  alternateVendors: string[]
  lastOrdered?: string
  lastUsed?: string
  imageUrl?: string
}
```

### Dashboard Metrics
```typescript
{
  totalParts: number             // Count of unique parts
  inventoryValue: number         // Total asset value
  lowStockParts: number          // Below reorder point
  outOfStockParts: number        // Quantity = 0
}
```

### Filtered Parts List
```typescript
filteredParts: Part[]            // Parts matching search + category
```

## Integration Points

### 1. Work Order System
- Parts consumed in work orders
- Quantity deducted from inventory
- Cost tracked to work order
- Inventory transactions recorded

### 2. Predictive Maintenance
- Predicted issues inform parts to stock
- Recommendations for pre-ordering
- Parts list from predictions

### 3. Purchase Orders
- Low stock triggers purchase orders
- Reorder point management
- Vendor integration
- Receipt and stocking workflow

### 4. Fleet Maintenance
- Parts required for scheduled maintenance
- Maintenance schedules list needed parts
- Parts availability affects scheduling
- Consumption history tracking

### 5. Garage Service Operations
- Technicians check part availability
- Parts allocated to work orders
- Inventory deduction on completion
- Stock levels updated in real-time

## Component Structure

### Main Component: PartsInventory
- **Props:** None (self-contained)
- **State:**
  - parts: Part[]
  - searchTerm: string
  - filterCategory: string
  - isAddDialogOpen: boolean
  - newPart: partial Part object

### Sub-Components
- Dialog: Add part form modal
- Input: Search and numeric inputs
- Select: Category filter dropdown
- Table: Parts inventory list
- Badge: Status indicators
- Progress: Stock level bar
- Button: Add part action

## UI Layout

```
┌─────────────────────────────────────────────────────┐
│ Parts Inventory                         [Add Part]   │
│ Manage vehicle parts and track stock levels         │
├─────────────────────────────────────────────────────┤
│ ┌────────────┐  ┌────────────┐  ┌────────────┐ ┌──┐ │
│ │ Total:     │  │ Inventory: │  │ Low Stock: │ │OOS││
│ │ 245 parts  │  │ $45,320    │  │ 12 items   │ │ 3 ││
│ │ Unique SKUs│  │ Total $    │  │ Need reord │ │Crit││
│ └────────────┘  └────────────┘  └────────────┘ └──┘ │
├─────────────────────────────────────────────────────┤
│ [Search...] [Category: All ▼]                       │
├─────────────────────────────────────────────────────┤
│ Inventory (45)                                      │
│ ┌─ Part # ─ Part Name ─ Category ─ Location ─ Level─┐│
│ │ ABC-001  Oil Filter   Fluids    Shelf A12  ▓▓▓░░  ││
│ │          Mobil 1                              45/50│
│ │          In Stock                                  ││
│ │                                                    ││
│ │ DEF-002  Brake Pads   Brakes    Shelf B5   ▓░░░░  ││
│ │          Brembo                              8/100 ││
│ │          Low Stock                                 ││
│ │                                                    ││
│ │ GHI-003  Transmission Transmis  Shelf C1   ░░░░░  ││
│ │ Fluid    Shell       sion                   0/50   ││
│ │                      Out of Stock                  ││
│ └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

## Suggested Test Scenarios

### Unit Tests

#### Test 1: Part Addition Validation
**Test:** Click "Add Part" and submit with missing required fields
**Expected:** 
- Toast error: "Please fill in required fields"
- Dialog remains open
- No part added

#### Test 2: Part Addition Success
**Test:** Fill all required fields and submit
**Expected:**
- New Part object created
- ID auto-generated as part-${timestamp}
- Defaults applied for optional fields
- Success toast: "Part added to inventory"
- Dialog closes
- Form resets

#### Test 3: Metric Calculations
**Test:** Add multiple parts with various quantities and costs
**Expected:**
- Total parts count accurate
- Inventory value = SUM(quantity × unitCost)
- Low stock count = parts where quantity ≤ reorderPoint
- Out of stock count = parts where quantity === 0

#### Test 4: Stock Status Assignment
**Test:** Create parts with different quantities
**Expected:**
- Quantity = 0: "Out of Stock" (red)
- Quantity ≤ reorderPoint: "Low Stock" (yellow)
- Quantity ≥ maxStockLevel: "Overstocked" (blue)
- Otherwise: "In Stock" (green)

#### Test 5: Progress Bar Calculation
**Test:** Create parts with known max and quantities
**Expected:**
- Progress = (quantity / maxStockLevel) × 100
- 25/100 = 25%
- 80/100 = 80%
- 0/100 = 0%

#### Test 6: Search Filtering
**Test:** Enter search terms for part number, name, manufacturer
**Expected:**
- Lowercase comparison works
- Partial matches included
- Case-insensitive search
- OR logic (matches any of three fields)

#### Test 7: Category Filtering
**Test:** Select various categories
**Expected:**
- "All Categories" shows all parts
- Each category shows only matching parts
- Combined with search works correctly
- Count updates: "Inventory ({filteredParts.length})"

#### Test 8: Combined Filter
**Test:** Search "oil" AND select "Fluids" category
**Expected:**
- Shows only "Fluids" category parts
- AND contains "oil" in number, name, or manufacturer
- Results filtered correctly

### Integration Tests

#### Test 9: Add Part Dialog Flow
**Test:** Full workflow from button click to table display
**Expected:**
- Button clickable
- Dialog opens
- Form fills and validates
- Submit adds part
- Table updates with new part
- Metrics update

#### Test 10: Status Badge Colors
**Test:** Create parts and verify badge styling
**Expected:**
- Colors consistent with design
- Status text correct
- Badges displayed in table rows

#### Test 11: Inventory Value Display
**Test:** Add parts with various costs, verify total
**Expected:**
- Metric shows formatted currency
- Calculation includes all parts
- Green trend icon displayed
- Localized format (commas)

#### Test 12: Search Real-time
**Test:** Type in search box character by character
**Expected:**
- Results filter as each character entered
- No lag/delay
- Results accurate at each step

#### Test 13: Empty State
**Test:** Create new inventory (no parts)
**Expected:**
- Message: "No parts found. Add parts to manage inventory."
- All metrics show 0
- Add button prominent

#### Test 14: Large Dataset
**Test:** Load 500+ parts and perform search
**Expected:**
- No performance lag
- Search completes quickly
- Results accurate
- Scrolling smooth

### User Acceptance Tests

#### Test 15: Inventory Manager Workflow
**Scenario:** Maintain parts inventory
**Steps:**
1. Open Parts Inventory
2. Review total parts count and value
3. Identify low stock and out of stock items
4. Add new part (e.g., new supplier part)
5. Search for specific part by number
6. Verify stock levels
7. Create reorder list

**Expected:**
- All information easily accessible
- Quick identification of reorder needs
- Form intuitive for part entry

#### Test 16: Technician Quick Reference
**Scenario:** Check availability before starting work
**Steps:**
1. Open Parts Inventory
2. Search for specific part number
3. Check stock level and status
4. View location for retrieval
5. Verify manufacturer info

**Expected:**
- Quick search results
- All needed info visible
- Can determine if part available

#### Test 17: Finance Audit
**Scenario:** Verify inventory asset value
**Steps:**
1. Note total inventory value
2. Spot check calculations (qty × cost)
3. Verify all parts included
4. Check for obsolete stock

**Expected:**
- Value accurate
- Includes all active parts
- Can identify dead stock

#### Test 18: Parts Ordering
**Scenario:** Identify parts to order
**Steps:**
1. Filter by "Low Stock" status
2. Review each low stock part
3. Check reorder points
4. Create purchase order list
5. Note quantities and vendors

**Expected:**
- Low stock items clearly identified
- Easy to create reorder list
- Reorder points make sense

#### Test 19: Mobile Usage
**Scenario:** Check inventory from garage floor
**Steps:**
1. Open on mobile device
2. Search for part
3. Check stock level and location
4. Verify details

**Expected:**
- Mobile responsive
- Readable on small screens
- Search works on mobile
- Quick access to key info

#### Test 20: Inventory Transfer
**Scenario:** Record parts usage and transfers
**Steps:**
1. Work order uses parts
2. Inventory quantities decrease
3. Reorder points trigger
4. Stock level adjusts
5. Transaction logged

**Expected:**
- Quantities update accurately
- History available
- Reorder alerts triggered
- No manual adjustments needed

---

# 5. MAINTENANCE REQUEST FEATURE

## Feature Overview

**File Location:** `/home/user/Fleet/src/components/modules/MaintenanceRequest.tsx`

**Purpose:** Employee and driver request submission system for reporting vehicle issues and requesting maintenance services with workflow management and status tracking.

**Core Capability:** Enables self-service maintenance requests from drivers and field staff with approval workflow and status tracking.

## Target Users

1. **Vehicle Drivers** - Submit maintenance issues for assigned vehicles
2. **Field Staff** - Report problems with equipment/vehicles
3. **Maintenance Coordinators** - Receive and process requests
4. **Maintenance Managers** - Approve and assign work
5. **Technicians** - View approved work assignments

## User Stories

### Story 1: Submit Maintenance Request
**As a** driver, **I want to** submit a maintenance request for my assigned vehicle **so that** I can report issues and get them fixed quickly.

**Acceptance Criteria:**
- "New Request" button opens submission form
- Form fields:
  - Vehicle selection (dropdown from available vehicles)
  - Issue Type (predefined categories)
  - Priority level
  - Detailed description
  - Requested By (driver name)
- Form validation for all required fields
- Submit creates request with "pending" status
- Success notification confirms submission

### Story 2: Track Request Status
**As a** driver, **I want to** see the status of my maintenance request **so that** I know when my vehicle will be serviced.

**Acceptance Criteria:**
- Dashboard shows request status: pending, approved, in-progress, completed
- Status color-coded with badges
- Can view all personal requests
- Status updates visible in real-time
- History of status changes available

### Story 3: Manage Request Workflow
**As a** maintenance manager, **I want to** approve pending requests and assign them to technicians **so that** I can manage workload and prioritize urgent issues.

**Acceptance Criteria:**
- View all requests with status dashboard
- Approve pending requests
- Start work on approved requests
- Complete finished work
- Action buttons available for each status
- Workflow: pending → approved → in-progress → completed

### Story 4: Prioritize Urgent Issues
**As a** maintenance coordinator, **I want to** identify urgent requests **so that** I can ensure safety-critical issues are addressed immediately.

**Acceptance Criteria:**
- Dashboard shows pending count
- Filters available for priority
- Urgent requests visually distinct (red color)
- Can sort by priority and date
- Quick access to urgent work

### Story 5: View Request Details
**As a** technician, **I want to** see complete request details **so that** I can understand what work needs to be done.

**Acceptance Criteria:**
- Expand request to view:
  - Vehicle identification
  - Issue type
  - Description with full details
  - Priority level
  - Requested by and date
  - Current status
  - Any attachments or notes

## Key Workflows

### Workflow 1: New Request Submission
```
1. Click "New Request" button on header
   ↓
2. Dialog opens with form fields
   ↓
3. User fills form:
   ├─ Select Vehicle (dropdown)
   │  └─ Shows available vehicles from data.vehicles
   │  └─ Format: "UNIT-001 - 2024 Toyota Camry"
   │
   ├─ Select Issue Type (dropdown)
   │  ├─ Engine
   │  ├─ Brakes
   │  ├─ Transmission
   │  ├─ Electrical
   │  ├─ Tires
   │  ├─ AC/Heating
   │  ├─ Suspension
   │  ├─ Body/Paint
   │  └─ Other
   │
   ├─ Select Priority (dropdown)
   │  ├─ Low
   │  ├─ Medium
   │  ├─ High
   │  └─ Urgent
   │
   ├─ Enter Requested By (text input)
   │  └─ Driver/staff name
   │
   └─ Enter Description (textarea)
      └─ Detailed issue description
   ↓
4. Validate:
   - selectedVehicle required
   - issueType required
   - description required
   - requestedBy required
   ↓
5. If validation fails:
   - Toast error: "Please fill in all required fields"
   - Dialog remains open
   ↓
6. If validation passes:
   - Create MaintenanceRequest:
     {
       id: mr-${timestamp}
       vehicleId: selected vehicle ID
       vehicleNumber: vehicle number
       issueType: selected issue type
       priority: selected priority
       description: user description
       requestedBy: user name
       requestDate: today's date (YYYY-MM-DD)
       status: "pending"
     }
   ↓
7. Call data.addMaintenanceRequest(newRequest)
   ↓
8. Toast success: "Maintenance request submitted"
   ↓
9. Dialog closes
   ↓
10. Form resets to default values
    ↓
11. Request appears in "All Requests" section
```

### Workflow 2: Request Status Dashboard
```
1. Load MaintenanceRequest component
   ↓
2. Calculate counts:
   a) pendingCount = requests.filter(r => status === "pending").length
   
   b) approvedCount = requests.filter(r => status === "approved").length
   
   c) inProgressCount = requests.filter(r => status === "in-progress").length
   ↓
3. Display three metric cards:
   - Pending (Clock icon, yellow)
   - Approved (CheckCircle icon, blue)
   - In Progress (Wrench icon, blue)
   ↓
4. Display all requests in card list:
   For each request:
   ├─ Vehicle icon + vehicle number
   ├─ Issue type as subtitle
   ├─ Priority badge (color-coded)
   ├─ Status badge (color-coded)
   ├─ Description text
   ├─ Requested by + date
   └─ Action buttons (based on status)
```

### Workflow 3: Request Status Transitions
```
1. User reviews pending request
   ↓
2. Two action options visible:
   ├─ "Approve" button → Changes to approved
   └─ "Start Work" button → Changes to in-progress
   ↓
3. Or user clicks on approved request:
   ├─ "Start Work" button → Changes to in-progress
   ↓
4. Or user clicks on in-progress request:
   ├─ "Complete" button → Changes to completed
   ↓
5. Workflow progression:
   pending → (Approve) → approved → (Start Work) → in-progress → (Complete) → completed
   
   OR
   
   pending → (Start Work) → in-progress → (Complete) → completed
   ↓
6. Each status change:
   - Calls data.updateMaintenanceRequest(id, { status: newStatus })
   - Toast displays: "Request [status]"
   - Buttons update for new status
   - Counts update
```

## Core Functionality & Features

### 1. Request Submission
- **Vehicle Selection:** From available fleet vehicles
- **Issue Type Categories:** 9 predefined categories
- **Priority Levels:** Low, Medium, High, Urgent
- **Description:** Free-text detailed explanation
- **Requester Identification:** Name of person submitting
- **Automatic Metadata:** Date and timestamp

### 2. Request Lifecycle Management
- **Status Tracking:** Four states (pending, approved, in-progress, completed)
- **Status Transitions:** Workflow from submission to completion
- **Action Buttons:** Context-sensitive based on status
- **Status Badges:** Color-coded visual indicators
- **Date Tracking:** Submission date and completion tracking

### 3. Request Organization
- **Dashboard View:** All requests in card list format
- **Status Filtering:** View by status type
- **Priority Indicators:** Color-coded badges
- **Vehicle Association:** Clear vehicle identification
- **Pagination:** Scroll through all requests

### 4. Request Metrics
- **Pending Count:** Awaiting approval
- **Approved Count:** Approved but not started
- **In Progress Count:** Currently being worked on
- **Real-time Updates:** Metrics change with status updates

### 5. Priority-based Processing
- **Color Coding:** Visual urgency indicators
- **Urgent Highlighting:** Red badges for urgent
- **Sorting Capability:** Can prioritize by urgency

## Data Inputs

### Request Submission Form
```typescript
{
  selectedVehicle: string          // Vehicle ID
  issueType: string               // e.g., "Engine", "Brakes"
  priority: "low" | "medium" | "high" | "urgent"
  description: string             // Issue description
  requestedBy: string             // Submitter name
}
```

## Data Outputs

### Complete Maintenance Request
```typescript
{
  id: string                      // mr-${timestamp}
  vehicleId: string               // From selected vehicle
  vehicleNumber: string           // Vehicle number (e.g., UNIT-001)
  issueType: string               // Issue category
  priority: "low" | "medium" | "high" | "urgent"
  description: string             // Full issue description
  requestedBy: string             // Requester name
  requestDate: string             // YYYY-MM-DD format
  status: "pending" | "approved" | "in-progress" | "completed"
}
```

### Dashboard Metrics
```typescript
{
  pendingCount: number            // Count of pending requests
  approvedCount: number           // Count of approved requests
  inProgressCount: number         // Count of in-progress requests
}
```

## Integration Points

### 1. Fleet Data Hook (useFleetData)
- Reads vehicle list for dropdown
- Calls addMaintenanceRequest(request)
- Calls updateMaintenanceRequest(id, updates)
- Reads maintenanceRequests array
- Provides vehicle information

### 2. Maintenance Scheduling
- Approved requests create maintenance schedules
- Request details populate schedule
- Priority determines scheduled priority
- Description becomes notes
- Issue type determines service type

### 3. Work Order System
- Approved/in-progress requests create work orders
- Request details inform work order
- Technician assignment from approval
- Cost estimation from issue type
- Priority carries through

### 4. Vehicle Management
- Request links to specific vehicle
- Updates vehicle service status
- Contributes to vehicle alert/flag system
- History tracking

### 5. Notification System
- Request submitted → Notification to managers
- Request approved → Notification to requester
- Work started → Status update to requester
- Work completed → Completion notification

## Component Structure

### Main Component: MaintenanceRequest
- **Props:**
  - data: ReturnType<typeof useFleetData>
- **State:**
  - dialogOpen: boolean
  - selectedVehicle: string
  - issueType: string
  - priority: MaintenanceRequestType["priority"]
  - description: string
  - requestedBy: string

### Sub-Components
- Dialog: Request submission form modal
- Card: Request card containers
- Badge: Priority and status indicators
- Button: Submit, approve, start work, complete actions
- Input: Text input for requester name
- Textarea: Description input
- Select: Vehicle, issue type, priority dropdowns
- Icon: Car, Wrench, Clock, CheckCircle icons

## UI Layout

```
┌──────────────────────────────────────────────────────┐
│ Maintenance Requests                   [New Request] │
│ Submit and track vehicle maintenance requests       │
├──────────────────────────────────────────────────────┤
│ ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│ │ [Clock]      │  │ [CheckCircle]│  │ [Wrench]   │ │
│ │ Pending: 5   │  │ Approved: 2  │  │ Progress:3 │ │
│ └──────────────┘  └──────────────┘  └────────────┘ │
├──────────────────────────────────────────────────────┤
│ All Requests                                         │
│ ┌────────────────────────────────────────────────────┐│
│ │ [Car] UNIT-001              [High] [Pending]      ││
│ │ Brake Issue                                        ││
│ │ Brakes making noise and not responding properly   ││
│ │ Requested by Driver1 on 2024-01-15                ││
│ │ [Approve] [Start Work]                            ││
│ └────────────────────────────────────────────────────┘│
│ ┌────────────────────────────────────────────────────┐│
│ │ [Car] UNIT-002              [Urgent][Pending]     ││
│ │ Engine Issue                                       ││
│ │ Check engine light on, vehicle losing power       ││
│ │ Requested by Driver2 on 2024-01-14                ││
│ │ [Approve] [Start Work]                            ││
│ └────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────┘
```

## Suggested Test Scenarios

### Unit Tests

#### Test 1: Request Form Validation
**Test:** Submit form with missing fields
**Expected:** 
- Toast error: "Please fill in all required fields"
- Dialog remains open
- No request created

#### Test 2: Request Submission Success
**Test:** Complete form with all fields and submit
**Expected:**
- MaintenanceRequest object created
- ID auto-generated as mr-${timestamp}
- All fields populated correctly
- Status set to "pending"
- requestDate set to today
- Success toast displayed
- Dialog closes
- Form fields reset

#### Test 3: Metric Calculations
**Test:** Add requests with different statuses
**Expected:**
- pendingCount = count of "pending" status
- approvedCount = count of "approved" status
- inProgressCount = count of "in-progress" status
- All counts accurate

#### Test 4: Priority Color Coding
**Test:** Display requests with all priorities
**Expected:**
- Low: Gray/muted
- Medium: Blue tint
- High: Orange
- Urgent: Red/destructive

#### Test 5: Status Color Coding
**Test:** Display requests with all statuses
**Expected:**
- Pending: Yellow/warning
- Approved: Blue/accent
- In Progress: Blue/accent
- Completed: Green/success

#### Test 6: Vehicle Dropdown
**Test:** Click vehicle dropdown
**Expected:**
- Shows all available vehicles
- Format: "UNIT-001 - 2024 Toyota Camry"
- Selection works correctly

#### Test 7: Issue Type Dropdown
**Test:** Click issue type dropdown
**Expected:**
- Shows all 9 issue types
- Engine, Brakes, Transmission, Electrical, Tires, AC/Heating, Suspension, Body/Paint, Other

### Integration Tests

#### Test 8: New Request Dialog
**Test:** Click "New Request" button
**Expected:**
- Dialog opens
- Form ready for input
- All dropdowns functional
- Close button works

#### Test 9: Status Transition Actions
**Test:** Click status change buttons
**Expected:**
- "Approve" button on pending → status changes to approved
- "Start Work" on pending/approved → status changes to in-progress
- "Complete" on in-progress → status changes to completed
- Buttons update after each action

#### Test 10: Request Card Display
**Test:** Create request and view in list
**Expected:**
- Vehicle icon and number displayed
- Issue type shown as subtitle
- Priority and status badges visible
- Description text displayed
- Requester and date shown
- Appropriate action buttons visible

#### Test 11: Multiple Requests
**Test:** Create 10+ requests
**Expected:**
- All display in list
- Scrollable if needed
- Counts accurate
- No performance issues

#### Test 12: Empty State
**Test:** View with no requests
**Expected:**
- "No maintenance requests yet" message
- Wrench icon displayed
- Prompt to create first request
- All metrics show 0

### User Acceptance Tests

#### Test 13: Driver Submission Workflow
**Scenario:** Driver reports vehicle issue
**Steps:**
1. Click "New Request"
2. Select assigned vehicle
3. Choose issue type (e.g., "Brakes")
4. Set priority to "Urgent"
5. Enter description of issue
6. Enter driver name
7. Click "Submit Request"

**Expected:**
- Request submitted successfully
- Confirmation message
- Request appears in pending list
- Can track status

#### Test 14: Maintenance Manager Approval
**Scenario:** Manager reviews and approves requests
**Steps:**
1. View requests dashboard
2. See pending count
3. Review each pending request
4. Click "Approve" on each
5. Watch status change to approved
6. Counts update

**Expected:**
- Easy approval workflow
- Status updates visible
- Clear action buttons
- Counts refresh automatically

#### Test 15: Technician Assignment
**Scenario:** Manager starts work on request
**Steps:**
1. Review approved requests
2. Click "Start Work"
3. Assign technician
4. Set estimated completion
5. Confirm work started

**Expected:**
- Status changes to in-progress
- Work order may auto-create
- Technician notified
- Vehicle status updates

#### Test 16: Request Completion
**Scenario:** Technician completes work
**Steps:**
1. Find in-progress request
2. Perform maintenance
3. Click "Complete"
4. Record actual cost (if captured)
5. Note any issues

**Expected:**
- Status changes to completed
- Requester notified
- Work order closed
- History recorded

#### Test 17: Priority Filtering
**Scenario:** Manager wants to focus on urgent requests
**Steps:**
1. Review all requests
2. Identify urgent (red) items
3. Prioritize urgent work
4. Complete high priority first

**Expected:**
- Urgent clearly visible (red)
- Can filter/sort by priority
- Status clear for each request

#### Test 18: Mobile Submission
**Scenario:** Driver submits from mobile device
**Steps:**
1. Open on phone
2. Click "New Request"
3. Fill form on mobile
4. Submit request

**Expected:**
- Form responsive on mobile
- Dropdowns work on mobile
- Submit successful
- Confirmation clear

#### Test 19: Follow-up Tracking
**Scenario:** Driver tracks their request
**Steps:**
1. Submit maintenance request
2. Check pending count
3. Wait for approval
4. See move to approved
5. See move to in-progress
6. See completion

**Expected:**
- Status visible at each step
- Timeline clear
- Updates apparent

#### Test 20: Bulk Request Management
**Scenario:** Multiple drivers submit requests
**Steps:**
1. 5+ requests submitted
2. Manager views all
3. Approves urgent ones first
4. Assigns to technicians
5. Tracks progress
6. Closes completed work

**Expected:**
- System handles multiple requests
- No performance degradation
- Clear visibility for all
- Workflow manageable at scale

---

# CROSS-FEATURE INTEGRATION SUMMARY

## Workflow: Complete Maintenance Lifecycle

```
1. PREDICTIVE MAINTENANCE
   - AI identifies UNIT-001 brake wear risk
   - 78% confidence, 12 days until failure
   - $850 estimated cost
   
   ↓
   
2. MAINTENANCE REQUEST
   - Auto-generates or driver submits request
   - Issue Type: "Brakes"
   - Priority: "High"
   
   ↓
   
3. MAINTENANCE SCHEDULING
   - Request approved
   - Schedule maintenance on calendar
   - Set due date based on prediction
   - Assign service provider
   - Estimate cost: $850
   
   ↓
   
4. GARAGE SERVICE
   - Work order created from schedule
   - Assign to available technician
   - Allocate service bay
   - Estimate 3 hours labor
   
   ↓
   
5. PARTS INVENTORY
   - Identify required brake parts
   - Check stock levels
   - Reserve parts for work
   - Or trigger reorder if low stock
   
   ↓
   
6. WORK COMPLETION
   - Technician performs work
   - Uses parts from inventory
   - Logs labor hours
   - Records actual cost
   - Updates vehicle status
   - Maintenance schedule marked complete
   
   Result: Prevented breakdown, Saved ~$1,150 emergency repair cost
```

## Key Relationships

| Feature | Primary Inputs | Primary Outputs | Key Integration |
|---------|----------------|-----------------|-----------------|
| **Maintenance Scheduling** | Vehicle #, Service Type, Cost | Schedule record, Status tracking | Works with Garage & Parts |
| **Predictive Maintenance** | Vehicle alerts, Telemetry | Risk assessment, Recommendations | Triggers scheduling/requests |
| **Garage Service** | Work orders, Technicians, Bays | Service completion, Cost tracking | Executes scheduled work |
| **Parts Inventory** | Part specs, Stock levels | Availability, Reorder alerts | Supports work orders |
| **Maintenance Request** | Driver reports, Issue description | Request record, Status tracking | Creates scheduling/work |

## Data Flow Architecture

```
DRIVERS/STAFF
    ↓
MAINTENANCE REQUEST
    ├─ Pending review
    ├─ Status tracking
    └─ History
    ↓
PREDICTIVE MAINTENANCE
    ├─ Alerts AI issues
    └─ Recommends scheduling
    ↓
MAINTENANCE SCHEDULING
    ├─ Creates schedule
    ├─ Estimates costs
    └─ Reserves resources
    ↓
GARAGE SERVICE
    ├─ Creates work orders
    ├─ Assigns technicians
    ├─ Allocates bays
    └─ Tracks progress
    ↓
PARTS INVENTORY
    ├─ Reserves parts
    ├─ Tracks usage
    └─ Triggers reorders
    ↓
COMPLETION
    ├─ Updates vehicle status
    ├─ Records history
    ├─ Tracks ROI
    └─ Feeds back to predictions
```

---

# TESTING MATRIX SUMMARY

## Test Coverage by Module

| Test Type | Scheduling | Predictive | Garage | Parts | Request |
|-----------|-----------|-----------|--------|-------|---------|
| **Validation** | 6 | 6 | 6 | 8 | 7 |
| **Integration** | 5 | 5 | 5 | 6 | 5 |
| **Acceptance** | 5 | 5 | 5 | 6 | 7 |
| **Total per Module** | **16** | **16** | **16** | **20** | **19** |
| **Total All Features** | **87 test scenarios** |

## Critical Test Paths

1. **Data Persistence:** Add data → Refresh page → Verify data still exists
2. **Status Workflow:** pending → approved → in-progress → completed
3. **Integration Flow:** Prediction → Request → Schedule → Work → Completion
4. **Cost Accuracy:** Estimates → Actuals → Reporting
5. **Availability:** Bay availability → Technician capacity → Schedule fit

---

# CONCLUSION

The Fleet Management System's Maintenance & Service modules provide comprehensive, integrated functionality for managing vehicle maintenance from prediction through completion. The system enables:

- **Proactive Maintenance:** Predictive analytics prevent costly breakdowns
- **Efficient Operations:** Real-time garage management optimizes resources
- **Cost Control:** Precise tracking from estimates to actuals
- **Employee Engagement:** Easy request submission for drivers/staff
- **Data-Driven Decisions:** Metrics and history inform planning

Success depends on:
- Complete data entry (accurate part costs, vehicle telemetry)
- Regular status updates (completing workflows promptly)
- Integration testing (ensure features work together)
- User adoption (drivers submitting requests, technicians updating status)

