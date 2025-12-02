# Dispatcher - Test Cases

**Role**: Dispatcher
**Access Level**: Operational (Live operations focus)
**Primary Interface**: Web Dashboard + Mobile App (50/50 split)
**Version**: 1.0
**Date**: November 10, 2025

---

## Table of Contents

1. [Real-Time Vehicle Tracking](#epic-1-real-time-vehicle-tracking)
2. [Route Assignment and Optimization](#epic-2-route-assignment-and-optimization)
3. [Load Planning and Scheduling](#epic-3-load-planning-and-scheduling)
4. [Emergency Response Coordination](#epic-4-emergency-response-coordination)
5. [Performance Monitoring and Reporting](#epic-5-performance-monitoring-and-reporting)

---

## Test Case Format

**TC ID**: Test Case Identifier (TC-DS-XXX)
**Name**: Descriptive test case name
**Related US/UC**: Associated user story and use case
**Priority**: High/Medium/Low
**Test Type**: Functional/Integration/Performance/Security/UI
**Preconditions**: System state and setup requirements
**Test Steps**: Numbered step-by-step actions
**Expected Results**: Anticipated outcomes after each step
**Acceptance Criteria**: Pass/fail conditions
**Test Data**: Sample data used in testing

---

## Epic 1: Real-Time Vehicle Tracking

### TC-DS-001: Live Fleet Map Display with Real-Time Updates

**TC ID**: TC-DS-001
**Name**: Verify live fleet map displays all active vehicles with real-time GPS updates
**Related US/UC**: US-DI-001 / UC-DI-001
**Priority**: High
**Test Type**: Functional + Integration

**Preconditions**:
- Dispatcher is logged into the dispatch console
- At least 5 active vehicles with GPS telematics enabled
- WebSocket connection is established
- Map service API is operational
- Internet connection is stable

**Test Steps**:
1. Navigate to the Live Fleet Map dashboard
2. Wait for initial map load (should complete within 3 seconds)
3. Observe vehicle markers displayed on map
4. Verify color coding of vehicle statuses
5. Wait 15 seconds without interaction
6. Verify map refreshes with new GPS positions
7. Click on a vehicle marker (e.g., Vehicle #247)
8. Verify popup displays with vehicle details
9. Enable traffic overlay layer
10. Verify traffic conditions display correctly
11. Apply filter: "Active deliveries only"
12. Verify only vehicles with active delivery status remain visible
13. Enable vehicle trail visualization (last 2 hours)
14. Verify dotted path lines appear showing historical movement
15. Wait 30 seconds and verify continuous auto-refresh via WebSocket

**Expected Results**:
- Step 2: Map loads within 3 seconds
- Step 3: All 5+ active vehicles visible as color-coded markers
- Step 4: Colors match status (Green=Active, Yellow=Idle, Orange=Maintenance, Red=Emergency, Blue=Completed)
- Step 6: Vehicle positions update with new GPS coordinates
- Step 8: Popup displays driver name, load, destination, ETA, vehicle status, last communication time
- Step 9: Traffic overlay appears with real-time congestion colors
- Step 12: Map updates to show only vehicles with active status
- Step 14: Vehicle trails visible as dotted lines on map
- Step 15: Real-time updates continue without manual refresh

**Acceptance Criteria**:
- All active vehicles display on map within 3 seconds of page load
- Vehicle markers update every 10-30 seconds via WebSocket without page refresh
- Vehicle status color coding is accurate and visible
- Popup displays all required vehicle information correctly
- Traffic overlay and filtering features work without errors
- Vehicle trail visualization loads and displays historical movement
- No map loading delays or performance degradation with 5+ vehicles

**Test Data**:
- Vehicle #247: Status=Active, Current Location=(42.1015°N, 72.5898°W), ETA=2:45 PM
- Vehicle #455: Status=Idle, Current Location=(42.2100°N, 72.6000°W), ETA=N/A
- Vehicle #512: Status=Maintenance, Current Location=(42.1500°N, 72.5500°W), ETA=N/A
- Vehicle #287: Status=In Transit, Current Location=(42.0900°N, 72.5700°W), ETA=3:30 PM
- Vehicle #342: Status=Emergency, Current Location=(42.1200°N, 72.6200°W), ETA=Immediate

---

### TC-DS-002: Vehicle Status Alert Display and Audio Notification

**TC ID**: TC-DS-002
**Name**: Verify critical vehicle alerts display with audio notification and proper escalation
**Related US/UC**: US-DI-002 / UC-DI-002
**Priority**: High
**Test Type**: Functional + Integration

**Preconditions**:
- Dispatcher is logged into dispatch console
- At least 1 vehicle with active telematics
- Alert notification system is operational
- Audio notification is enabled on dispatcher workstation
- Vehicle telematics system can trigger test alerts

**Test Steps**:
1. Trigger a harsh braking alert from Vehicle #247
2. Verify alert appears in dispatcher's active alert queue within 2 seconds
3. Verify audio notification tone plays (warning chime)
4. Verify alert displays with yellow highlight (warning level)
5. Verify alert shows event details (vehicle ID, driver, event type, timestamp, location)
6. Click alert to view full details panel
7. Verify map centers on vehicle location
8. Add dispatcher note: "Contact driver to verify safety"
9. Click "Acknowledge" button
10. Verify alert status changes to "Acknowledged"
11. Verify alert removed from active queue
12. Verify alert moved to "Acknowledged Alerts" history
13. Trigger a critical emergency alert (panic button)
14. Verify alert displays with red background and "CRITICAL" badge
15. Verify urgent audio alarm plays continuously
16. Verify alert auto-opens full details panel
17. Verify emergency response quick actions display (Call Driver, Dispatch 911, etc.)
18. Wait 2 minutes without acknowledging critical alert
19. Verify alert escalates to supervisor automatically
20. Verify supervisor receives notification

**Expected Results**:
- Step 2: Alert appears in queue within 2 seconds of event trigger
- Step 3: Audio notification plays distinct warning tone
- Step 4: Alert background is yellow for warning-level events
- Step 5: All event details display correctly with timestamp and location
- Step 8: Note added to alert record without errors
- Step 10: Alert status shows "Acknowledged" with timestamp
- Step 13: Critical alert has distinct red background and CRITICAL badge
- Step 15: Urgent audio alarm plays and continues until acknowledged
- Step 17: Quick action buttons are displayed and clickable
- Step 19: Alert auto-escalates to supervisor after 2-minute timeout
- Step 20: Supervisor receives SMS/email notification of escalated alert

**Acceptance Criteria**:
- All alerts display within 2 seconds of event trigger
- Audio notifications are distinct by severity (warning vs critical)
- Alert details display all required information
- Alerts can be acknowledged and archived
- Critical alerts auto-escalate after 2 minutes without acknowledgment
- Dispatcher notes are properly recorded
- No alert display or escalation failures

**Test Data**:
- Warning Alert: Vehicle #247, Harsh Braking, Speed: 45 mph → 0 mph in 2.3 seconds, Location: Route 405 Mile Marker 47
- Critical Alert: Vehicle #455, Emergency Button, Driver: John Smith, Location: I-95 North Mile Marker 47, Time: 2:47 PM

---

### TC-DS-003: Vehicle Marker Clustering for Large Fleet

**TC ID**: TC-DS-003
**Name**: Verify map clustering automatically groups nearby vehicles when fleet exceeds 50 vehicles
**Related US/UC**: US-DI-001 / UC-DI-001
**Priority**: Medium
**Test Type**: Functional + Performance

**Preconditions**:
- Live Fleet Map is open
- Map contains 60+ vehicles in close proximity (within 5 miles)
- Zoom level is at default/wide view
- Map clustering is enabled in system settings

**Test Steps**:
1. Load map with 60 vehicles within 5-mile radius
2. Verify map displays clustered vehicle groups (not individual markers)
3. Verify cluster numbers display (e.g., "45", "38", "22")
4. Verify clusters are color-coded by density
5. Click on cluster group with 45 vehicles
6. Verify map zooms in automatically
7. Verify cluster expands to show individual vehicle markers
8. Verify individual vehicles are color-coded by status
9. Click on specific vehicle marker
10. Verify vehicle details popup displays
11. Zoom out to original view
12. Verify clustering re-engages automatically
13. Add new vehicle to clustered area
14. Verify new vehicle is incorporated into cluster count
15. Remove vehicle from clustered area
16. Verify cluster count decreases automatically

**Expected Results**:
- Step 2: Map displays clusters instead of individual markers for 60+ vehicles
- Step 3: Cluster numbers accurately represent vehicle count in each group
- Step 5: Cluster expands on click without page reload
- Step 7: Individual vehicle markers visible after expansion
- Step 8: Vehicle color coding is correct for each marker
- Step 10: Vehicle details popup displays without errors
- Step 12: Clustering re-engages when zooming out
- Step 14: New vehicle is immediately reflected in cluster count
- Step 16: Cluster count updates immediately when vehicle removed

**Acceptance Criteria**:
- Clustering activates automatically when 50+ vehicles in viewport
- Cluster expansion/contraction is smooth and responsive (<1 second)
- Vehicle count in clusters is accurate
- Individual vehicles remain accessible after cluster expansion
- Clustering performance does not degrade with large datasets
- No UI lag or freezing during cluster operations

**Test Data**:
- 60 vehicles clustered in downtown area
- Vehicles within 5-mile radius (Boston area)
- Mix of statuses: 40 Active, 12 Idle, 5 Maintenance, 3 Emergency

---

### TC-DS-004: Geofence Violation Alert and Visualization

**TC ID**: TC-DS-004
**Name**: Verify geofence violation triggers alert and displays violation details on map
**Related US/UC**: US-DI-001 / UC-DI-001
**Priority**: High
**Test Type**: Functional + Integration

**Preconditions**:
- Geofence is defined for a customer location (e.g., restricted area)
- Vehicle #287 is active with GPS tracking
- Geofence boundaries are loaded in system
- Alert system is operational
- Vehicle is currently inside geofence

**Test Steps**:
1. Verify Vehicle #287 is displayed inside geofence boundary on map
2. Simulate vehicle moving toward and crossing geofence boundary
3. Verify vehicle exits geofence (GPS coordinates move outside boundary)
4. Verify geofence violation alert appears immediately
5. Verify alert displays with red background and pulsing border
6. Verify alert shows violation timestamp and location
7. Verify geofence boundary is highlighted on map in red
8. Verify vehicle marker is highlighted with pulsing red border
9. Click alert to view violation details
10. Verify details panel displays:
    - Violation time
    - Vehicle ID and driver name
    - Geofence name and boundary type
    - GPS coordinates of violation point
    - Reason field for dispatcher note
11. Dispatcher adds reason: "Customer requested vehicle divert to alternate address"
12. Dispatcher clicks "Acknowledge Violation"
13. Verify alert status changes to "Acknowledged"
14. Verify alert removed from active queue
15. Verify violation is logged to audit trail with timestamp

**Expected Results**:
- Step 3: Alert triggers within 2 seconds of GPS coordinates crossing boundary
- Step 4: Alert appears in active queue immediately
- Step 5: Alert has red background and pulsing indicator
- Step 7: Geofence boundary displays in red on map
- Step 9: Details panel opens with complete violation information
- Step 12: Acknowledgment recorded with timestamp
- Step 15: Violation logged with dispatcher action and notes

**Acceptance Criteria**:
- Geofence violation alerts trigger within 2 seconds of boundary crossing
- Violation location is accurate and displayed on map
- Dispatcher can acknowledge and document reason for violation
- Violation audit trail is complete and includes dispatcher notes
- Map visualization clearly shows violation boundary and vehicle
- No false positive geofence alerts

**Test Data**:
- Geofence: "Customer XYZ Restricted Area" (radius=1 mile, center=42.1015°N, 72.5898°W)
- Vehicle #287: Exit at GPS (42.1200°N, 72.5898°W) - outside boundary
- Violation reason: "Customer requested delivery at alternate location"

---

## Epic 2: Route Assignment and Optimization

### TC-DS-005: Dynamic Route Assignment with Drag-and-Drop

**TC ID**: TC-DS-005
**Name**: Verify route can be assigned to driver using drag-and-drop interface with validation
**Related US/UC**: US-DI-004 / UC-DI-004
**Priority**: High
**Test Type**: Functional + UI

**Preconditions**:
- Dispatcher is on Route Assignment dashboard
- At least 3 pending jobs exist in system
- At least 3 available drivers with sufficient HOS and capacity
- Driver mobile app can receive push notifications

**Test Steps**:
1. View pending jobs list (should show 3+ jobs requiring assignment)
2. View available drivers panel with status (location, HOS remaining, vehicle capacity)
3. Identify Job #1247: "8 pallets to Boston warehouse by 2:00 PM"
4. Identify available Driver Mike Torres: "10 miles from pickup, 9 hrs HOS remaining"
5. Drag Job #1247 from pending jobs list
6. Drop job onto Driver Mike Torres in available drivers list
7. Verify assignment confirmation dialog appears
8. Verify dialog displays:
    - Pickup: ABC Warehouse, 123 Industrial Dr
    - Delivery: XYZ Distribution, 456 Warehouse Blvd, Boston
    - Estimated drive time: 3.5 hours
    - HOS check: ✓ Sufficient (3.5 < 9)
    - Capacity check: ✓ Sufficient (8 pallets < 20 capacity)
    - ETA: 1:45 PM (before 2:00 PM deadline)
9. Click "Confirm Assignment" button
10. Verify route is created in system
11. Verify push notification sent to Mike's mobile app
12. Verify route appears in Mike's active routes list on dispatch console
13. Verify driver status changes to "En Route"
14. Verify pending job count decreases by 1
15. Wait for driver mobile app notification (simulate app response)
16. Verify driver accepts assignment in mobile app
17. Verify dispatch console updates showing "Accepted" status

**Expected Results**:
- Step 3: Pending jobs list displays job details and requirements
- Step 5-6: Drag-and-drop operation completes smoothly
- Step 7: Confirmation dialog appears within 2 seconds
- Step 8: All validation checks pass with green checkmarks
- Step 10: Route created with unique route ID
- Step 11: Push notification delivered to driver's mobile device
- Step 13: Driver status updates immediately to "En Route"
- Step 16: Driver acceptance recorded with timestamp
- Step 17: Dispatch console shows updated status

**Acceptance Criteria**:
- Drag-and-drop assignment is smooth and responsive
- All validation checks (HOS, capacity, delivery window) are performed
- Assignment confirmation displays all required information
- Driver receives push notification within 5 seconds
- Driver can accept/reject assignment in mobile app
- Dispatch console updates immediately upon driver acceptance
- Assignment history is recorded for performance analysis

**Test Data**:
- Job #1247: Pickup=ABC Warehouse, Delivery=XYZ Distribution Boston, Load=8 pallets, Deadline=2:00 PM
- Driver Mike Torres: Location=10 mi from pickup, HOS=9 hours, Vehicle=20-pallet capacity
- Estimated Drive Time: 3.5 hours (Route 405, I-90, I-91)

---

### TC-DS-006: HOS Violation Prevention on Route Assignment

**TC ID**: TC-DS-006
**Name**: Verify system prevents assignment if driver HOS is insufficient for route
**Related US/UC**: US-DI-004 / UC-DI-004
**Priority**: High
**Test Type**: Functional + Business Rules

**Preconditions**:
- Route Assignment dashboard is open
- Job requiring 4 hours of drive time is pending
- Driver has only 2.5 hours of HOS remaining
- HOS validation is enabled in system

**Test Steps**:
1. Identify Job #1248: "5 pallets requiring 4-hour drive time"
2. Identify Driver Sarah Johnson: "2.5 hours HOS remaining"
3. Attempt to assign Job #1248 to Sarah via drag-and-drop
4. Verify assignment validation runs
5. Verify HOS validation fails
6. Verify error message displays: "❌ Cannot assign - insufficient HOS remaining"
7. Verify error shows details: "Driver has 2.5 hours remaining, route requires 4 hours"
8. Verify assignment is blocked (route not created)
9. Verify system suggests alternative drivers with sufficient HOS
10. Select alternative driver (Tom Rodriguez: 9 hours HOS remaining)
11. Complete assignment to Tom Rodriguez
12. Verify assignment succeeds
13. Verify route created only for Tom Rodriguez, not Sarah

**Expected Results**:
- Step 4: Validation runs immediately upon drag-and-drop
- Step 6: Error message displays clearly and prominently
- Step 7: Error includes specific HOS requirement vs available
- Step 8: No route is created; assignment is completely blocked
- Step 9: System recommends drivers with sufficient HOS
- Step 12: Assignment to Tom Rodriguez succeeds without warnings
- Step 13: Only Tom's assignment is recorded; Sarah's is never created

**Acceptance Criteria**:
- HOS validation prevents assignments that would violate regulations
- Error message is clear and specific about HOS requirement
- System suggests compliant alternatives
- No partial or tentative assignments are created
- Business rule BR-DI-021 is enforced: "Routes cannot be assigned if driver HOS is insufficient"

**Test Data**:
- Job #1248: Distance=280 miles, Est. Drive Time=4 hours
- Driver Sarah Johnson: HOS Remaining=2.5 hours
- Driver Tom Rodriguez: HOS Remaining=9 hours (alternative)

---

### TC-DS-007: Route Optimization with Traffic-Based Re-Routing

**TC ID**: TC-DS-007
**Name**: Verify real-time traffic triggers automatic re-routing recommendation
**Related US/UC**: US-DI-005 / UC-DI-005
**Priority**: High
**Test Type**: Functional + Integration

**Preconditions**:
- Driver Sarah Johnson is on active route with 5 delivery stops
- Route has stops in Philadelphia area
- Real-time traffic data is available
- Route optimization service is operational
- Driver mobile app can receive route updates

**Test Steps**:
1. Verify Driver Sarah's active route: 5 stops, 4.2 hours total time, ETA 3:00 PM
2. Verify all stops have confirmed delivery time windows
3. Simulate major accident on I-76 eastbound affecting route
4. Verify system detects traffic incident via traffic data API
5. Verify system calculates new ETA: 3:45 PM (45-minute delay)
6. Verify system generates re-route recommendation
7. Verify alert appears to dispatcher: "Traffic delay on Route #3421 - Re-route available"
8. Click alert to view route comparison
9. Verify comparison displays:
    - Original route: 5 stops, 4.2 hours, ETA 3:00 PM
    - Optimized route: 5 stops (reordered), 3.8 hours, ETA 2:40 PM
    - Savings: 24 minutes
10. Verify map shows side-by-side comparison of routes
11. Verify all delivery time windows remain achievable with optimized route
12. Verify system shows stop sequence changes (which stops are reordered)
13. Click "Send Updated Route to Driver"
14. Verify push notification sent to Sarah's mobile app
15. Wait for driver to receive and accept route update
16. Verify driver mobile app shows updated turn-by-turn directions
17. Verify dispatch console shows "Route updated" status
18. Verify customer ETAs are recalculated and updated

**Expected Results**:
- Step 5: Traffic impact calculated within 1 minute of incident detection
- Step 7: Alert displays in dispatcher queue automatically
- Step 9: Route comparison shows all optimization details accurately
- Step 11: All delivery windows remain achievable (no conflicts)
- Step 14: Push notification delivered within 3 seconds of dispatcher approval
- Step 16: Updated navigation loaded on driver's mobile device
- Step 18: Customer notifications reflect new ETAs

**Acceptance Criteria**:
- Real-time traffic impacts trigger re-routing recommendations
- Re-optimization maintains all delivery time window commitments
- Driver receives route updates promptly via mobile app
- Optimization is transparent with clear before/after comparison
- Time and fuel savings are calculated and displayed
- System prevents sending routes that violate customer commitments
- No manual intervention required for obvious optimization opportunities

**Test Data**:
- Original Route: Stop 1 (10:30 AM), Stop 2 (12:15 PM), Stop 3 (1:45 PM), Stop 4 (3:00 PM), Stop 5 (4:15 PM)
- Traffic Incident: I-76 eastbound accident, 45-minute delay
- Optimized Route: Reorder to avoid congestion, ETA 2:40 PM (24 min savings)

---

### TC-DS-008: Manual Route Adjustment and Dispatcher Override

**TC ID**: TC-DS-008
**Name**: Verify dispatcher can manually adjust route sequence with override justification
**Related US/UC**: US-DI-005 / UC-DI-005
**Priority**: Medium
**Test Type**: Functional + Business Rules

**Preconditions**:
- Driver has active route with 5 stops
- Dispatcher wants to manually reorder stops
- Manual override feature is enabled
- Route optimization service is available (for comparison)

**Test Steps**:
1. Open active route for Driver Mike Torres
2. View current stop sequence: Stop 1→2→3→4→5
3. Click "Manual Reorder" button
4. Drag Stop 4 to position 2 (based on local knowledge/customer request)
5. Verify drag-and-drop reorders stops: Stop 1→4→2→3→5
6. Verify system recalculates drive time with new sequence
7. Verify new total time displays: 4.1 hours (vs original 4.2)
8. Verify system validates all time windows remain achievable
9. Dispatcher adds note: "Stop 4 requested early delivery by customer"
10. Click "Save Manual Override"
11. Verify system requires override justification (should already be populated)
12. Click "Send Updated Route to Driver"
13. Verify route update sent to Mike's mobile app
14. Verify driver receives notification of route change
15. Verify driver can view old vs new stop sequence
16. Dispatcher's note is visible to driver and in audit log

**Expected Results**:
- Step 5: Drag-and-drop reorder completes smoothly
- Step 6: Drive time recalculated with new sequence
- Step 8: Time window validation passes for all stops
- Step 11: Override justification requirement is enforced
- Step 13: Route update delivered to driver within 3 seconds
- Step 16: Override note is recorded in audit trail with timestamp

**Acceptance Criteria**:
- Dispatcher can manually adjust stop sequence using intuitive drag-and-drop
- System recalculates impact on drive time and ETAs
- Manual overrides require justification (enforces accountability)
- All time window constraints are validated
- Driver receives route updates promptly
- Manual override decisions are fully auditable
- Business rule BR-DI-031 is enforced: "Manual route overrides must include justification"

**Test Data**:
- Original Route: Stop 1 (10:30), Stop 2 (11:45), Stop 3 (1:00 PM), Stop 4 (2:30 PM), Stop 5 (4:00 PM)
- Override: Move Stop 4 to position 2 (customer requested early delivery)
- New Sequence: Stop 1→4→2→3→5 with recalculated times

---

### TC-DS-009: Customer ETA Update and Notification

**TC ID**: TC-DS-009
**Name**: Verify customer receives ETA update notification when delivery delay is detected
**Related US/UC**: US-DI-006 / UC-DI-006
**Priority**: High
**Test Type**: Functional + Integration

**Preconditions**:
- Driver Mike is on active route with delivery to Customer A (ABC Corp)
- Customer A has phone number on file (+1-555-0123)
- SMS notification service is operational
- Delivery window: 10:30 AM - 11:00 AM
- Real-time traffic data is available

**Test Steps**:
1. Verify delivery is scheduled for Customer A with ETA 10:30 AM
2. Verify customer SMS is stored: +1-555-0123
3. Simulate traffic delay (15 minutes) on route to Customer A
4. Verify system detects ETA change to 10:45 AM (15-minute delay)
5. Verify system checks delay threshold (>15 minutes = notify)
6. Verify alert appears to dispatcher: "Customer A delivery delayed - new ETA 10:45 AM"
7. Dispatcher clicks "Notify Customer" button
8. Verify system shows SMS template for delay notification
9. Verify template displays: "Delivery update: Due to traffic, new arrival time is 10:45 AM..."
10. Dispatcher reviews and clicks "Send Notification"
11. Verify SMS is sent to Customer A: +1-555-0123
12. Verify SMS delivery status shows "Sent" with timestamp
13. Verify customer receives SMS within 3 seconds
14. Verify SMS contains accurate ETA and apologetic tone
15. Simulate customer replying to SMS: "OK, thanks for letting me know"
16. Verify driver's reply appears in dispatch console
17. Driver Mike arrives and completes delivery at 10:43 AM (on time within window)
18. Verify system sends delivery confirmation SMS to customer

**Expected Results**:
- Step 5: Notification threshold is checked automatically
- Step 7: Alert appears to dispatcher for manual approval
- Step 11: SMS delivered to correct phone number
- Step 12: Delivery status shows "Sent" with timestamp
- Step 14: SMS message is professional and informative
- Step 16: Customer reply is captured and displayed
- Step 18: Delivery confirmation sent automatically

**Acceptance Criteria**:
- System detects ETA changes that exceed notification threshold (>15 minutes)
- Customers are notified of significant delays proactively
- SMS delivery is reliable and timestamped
- Dispatcher controls when notifications are sent (can approve/deny)
- Customer replies are captured and stored
- Delivery confirmation notifications are sent automatically
- Business rule BR-DI-034 is enforced: "Customers must be notified of delays >15 minutes"

**Test Data**:
- Customer A: ABC Corp, Phone: +1-555-0123, Original ETA: 10:30 AM
- Traffic Delay: 15 minutes (new ETA: 10:45 AM)
- SMS Message: "Delivery update: Due to traffic, new arrival time is 10:45 AM. We apologize for the inconvenience."

---

## Epic 3: Load Planning and Scheduling

### TC-DS-010: Vehicle Capacity Validation During Load Assignment

**TC ID**: TC-DS-010
**Name**: Verify system prevents overweight load assignment and calculates capacity accurately
**Related US/UC**: US-DI-007 / UC-DI-007
**Priority**: High
**Test Type**: Functional + Business Rules

**Preconditions**:
- Load Planning dashboard is open
- Vehicle #342 specifications are accurate in system (capacity: 10,000 lbs, 500 cu ft)
- Cargo orders with weight/dimensions are available
- Load validation is enabled

**Test Steps**:
1. Select Cargo Order #5521: Weight=4,200 lbs, Volume=180 cu ft, 6 pallets
2. Select Vehicle #342 for assignment (capacity: 10,000 lbs, 500 cu ft, 12 pallets)
3. Verify system calculates capacity utilization:
    - Weight: 4,200 / 10,000 = 42%
    - Volume: 180 / 500 = 36%
    - Pallets: 6 / 12 = 50%
4. Verify all capacity indicators show green (within limits)
5. Assign cargo to vehicle
6. Verify cargo successfully assigned
7. Identify second cargo Order #5522: Weight=2,800 lbs, Volume=120 cu ft, 4 pallets
8. Attempt to assign Order #5522 to same vehicle
9. Verify system recalculates capacity:
    - Total weight: 7,000 / 10,000 = 70%
    - Total volume: 300 / 500 = 60%
    - Total pallets: 10 / 12 = 83%
10. Verify all indicators still green (all within limits)
11. Assign Order #5522 successfully
12. Attempt to add third cargo Order #5523: Weight=4,000 lbs, Volume=140 cu ft
13. Verify system recalculates: 11,000 lbs total (exceeds 10,000 limit)
14. Verify system displays error: "❌ Exceeds vehicle GVWR - Max 10,000 lbs"
15. Verify system prevents assignment (no load created)
16. Dispatcher must select different vehicle or split load
17. Select Vehicle #355 (capacity: 15,000 lbs) for Order #5523
18. Verify assignment succeeds for Vehicle #355
19. Verify load manifest generated for both vehicles with complete cargo details

**Expected Results**:
- Step 3: Capacity calculations are accurate and display correctly
- Step 6: Cargo assigned successfully when within limits
- Step 10: Capacity indicators remain green with combined load
- Step 14: Error message is clear and specific about weight violation
- Step 15: Assignment is completely blocked (no partial load created)
- Step 18: Assignment to larger vehicle succeeds
- Step 19: Load manifests include all cargo and special handling notes

**Acceptance Criteria**:
- Vehicle capacity (weight, volume, pallet count) is validated before assignment
- System prevents overweight/oversize assignments
- Capacity calculations are accurate and transparent
- Error messages are specific about which constraint is violated
- Dispatcher can reassign to compliant vehicle without issues
- Load manifests are generated with all required details
- Business rule BR-DI-041 is enforced: "Vehicle GVWR cannot be exceeded (hard stop)"

**Test Data**:
- Vehicle #342: Capacity=10,000 lbs, 500 cu ft, 12 pallets
- Vehicle #355: Capacity=15,000 lbs, 600 cu ft, 15 pallets
- Cargo #5521: 4,200 lbs, 180 cu ft, 6 pallets
- Cargo #5522: 2,800 lbs, 120 cu ft, 4 pallets
- Cargo #5523: 4,000 lbs, 140 cu ft (fails on Vehicle #342, succeeds on #355)

---

### TC-DS-011: HAZMAT Cargo Assignment with Certification Validation

**TC ID**: TC-DS-011
**Name**: Verify HAZMAT cargo assignment validates driver certification and vehicle requirements
**Related US/UC**: US-DI-007 / UC-DI-007
**Priority**: High
**Test Type**: Functional + Business Rules

**Preconditions**:
- Load Planning dashboard is open
- HAZMAT cargo order exists in system
- At least 2 drivers available (one HAZMAT-certified, one not)
- Multiple vehicles available (some HAZMAT-certified, some not)

**Test Steps**:
1. Select HAZMAT Cargo Order #5524: Gasoline (Class 3, placard 1203)
2. Verify system flags cargo with HAZMAT indicator
3. System attempts to assign to Driver John Davis (no HAZMAT endorsement)
4. Verify system displays error: "❌ Driver lacks HAZMAT endorsement"
5. Verify assignment is blocked
6. System suggests Driver Tom Rodriguez (HAS HAZMAT endorsement)
7. Select Driver Tom Rodriguez
8. Verify system filters available vehicles to only HAZMAT-certified units
9. Verify only 2 of 5 vehicles appear (others not HAZMAT-certified)
10. Select Vehicle #412 (HAZMAT-certified tanker)
11. Verify system applies HAZMAT routing requirements (avoids tunnels, residential areas)
12. Verify load manifest includes:
    - HAZMAT placard information
    - Material Safety Data Sheet (SDS) reference
    - Emergency response procedures
    - Routing restrictions
13. Verify system generates HAZMAT shipping papers
14. Verify driver receives HAZMAT certification reminder notification
15. Verify dispatch console shows cargo marked as HAZMAT
16. Assign cargo successfully to Tom Rodriguez in Vehicle #412

**Expected Results**:
- Step 2: HAZMAT flag is prominently displayed
- Step 4: Certification validation prevents unqualified driver assignment
- Step 8: Only HAZMAT-certified vehicles are available for selection
- Step 12: Load manifest includes all required HAZMAT documentation
- Step 13: Shipping papers are generated automatically
- Step 14: Driver receives certification reminder
- Step 16: Assignment succeeds with all HAZMAT protocols in place

**Acceptance Criteria**:
- System validates driver HAZMAT certification before assignment
- System filters vehicle selection to HAZMAT-certified units only
- Load manifests include required HAZMAT documentation
- Shipping papers are generated automatically
- Drivers receive HAZMAT-specific instructions
- System prevents non-compliant assignments
- Business rule BR-DI-042 is enforced: "HAZMAT loads require certified driver and vehicle"

**Test Data**:
- Cargo #5524: Gasoline, Class 3, Placard 1203, Volume=50 gallons, Weight=300 lbs
- Driver John Davis: No HAZMAT endorsement (assignment blocked)
- Driver Tom Rodriguez: HAZMAT endorsement valid (assignment allowed)
- Vehicle #412: HAZMAT tanker, certified, capacity=1,000 gallons

---

### TC-DS-012: Multi-Day Trip Planning with HOS Compliance

**TC ID**: TC-DS-012
**Name**: Verify multi-day trip is planned with HOS-compliant rest schedules and route optimization
**Related US/UC**: US-DI-008 / UC-DI-008
**Priority**: High
**Test Type**: Functional + Business Rules

**Preconditions**:
- Long-haul delivery order exists: Boston to Los Angeles
- Driver Tom Rodriguez (qualified for long-haul) is available
- HOS regulations are configured (11-hour drive limit, 10-hour rest requirement)
- Truck stop database is populated with locations and services
- Route optimization service is operational

**Test Steps**:
1. Create multi-day trip from Boston, MA to Los Angeles, CA
2. Verify system calculates total distance: 2,982 miles
3. Verify system estimates drive time: 45 hours (with HOS compliance)
4. System plans trip with HOS compliance:
    - **Day 1**: Boston to Indianapolis (906 miles, 13.5 hours total time)
      - Drive: 10.5 hours (within 11-hour limit)
      - Fuel stop: 30 min
      - Meal break: 30 min
      - Rest: 10 hours overnight
    - **Day 2**: Indianapolis to Oklahoma City (882 miles, 13 hours total)
      - Drive: 11 hours (maximum allowed)
      - Fuel stop: 30 min
      - Meal break: 30 min
      - Rest: 10 hours overnight
    - **Day 3**: Oklahoma City to Los Angeles (1,194 miles, 17.5 hours total)
      - Drive: 11 hours
      - Fuel stop: 45 min
      - Meal break: 30 min
      - Arrival: 2:00 PM
5. Verify system calculates trip costs:
    - Fuel: 298 gallons @ $3.50/gal = $1,043
    - Tolls: $87
    - Lodging: 2 nights @ $85/night = $170
    - Per diem: 3 days @ $60/day = $180
    - **Total: $1,480**
6. Verify system recommends truck stops:
    - Night 1: TA Travel Center, Indianapolis
    - Night 2: Love's Truck Stop, Oklahoma City
7. Assign Driver Tom Rodriguez to trip
8. Verify trip plan sent to Tom's mobile app with:
    - Turn-by-turn navigation with waypoints
    - Scheduled rest stops and overnight locations
    - Fuel stop recommendations
    - Customer contact and delivery instructions
    - Emergency contacts
9. Tom accepts assignment
10. Monitor trip progress through system:
    - Tom completes Day 1 and checks in at Indianapolis (8:45 PM)
    - System logs rest period start time
    - System alerts Tom next morning: "10-hour rest complete - safe to resume"
    - Tom completes Day 2 and rests in Oklahoma City
    - Tom completes Day 3 and delivers in Los Angeles by 1:30 PM
11. Verify system records actual vs planned performance
12. Verify HOS compliance verified throughout trip (no violations)

**Expected Results**:
- Step 3: Total trip time accounts for HOS limits (not just raw driving time)
- Step 4: Each day respects 11-hour drive limit and includes 10-hour rest
- Step 5: Cost estimation is accurate and itemized
- Step 6: Recommended truck stops are verified and appropriate
- Step 8: Trip plan includes all necessary information and is mobile-optimized
- Step 10: System tracks trip progress accurately with rest period logging
- Step 12: HOS compliance verified - no violations detected

**Acceptance Criteria**:
- Multi-day trips are planned with full HOS compliance
- Trip plans include rest stops that comply with 10-hour rest requirement
- Cost estimation is accurate and includes all trip components
- Truck stops are recommended with actual amenities and parking availability
- Drivers receive complete trip plans on mobile app
- System monitors trip progress and alerts drivers of rest completion
- HOS compliance is verified throughout trip
- Business rule BR-DI-048 is enforced: "Trips must comply with 11-hour drive limit and 10-hour rest requirement"

**Test Data**:
- Route: Boston, MA to Los Angeles, CA
- Total Distance: 2,982 miles
- Total Drive Time: 45 hours (planning across 3 days)
- Driver: Tom Rodriguez (long-haul qualified)
- Fuel Price: $3.50/gallon
- Truck Stop Cost: $85/night

---

## Epic 4: Emergency Response Coordination

### TC-DS-013: Emergency Panic Button Alert and Response Protocol

**TC ID**: TC-DS-013
**Name**: Verify emergency panic button triggers immediate alert with response protocol
**Related US/UC**: US-DI-009 / UC-DI-009
**Priority**: High
**Test Type**: Functional + Integration

**Preconditions**:
- Driver John Smith is on active route in Vehicle #455
- Emergency alert system is operational
- Emergency contact database is current
- Roadside assistance provider integration is operational
- Dispatcher has phone and authorization to call 911

**Test Steps**:
1. Driver John Smith activates emergency panic button in Vehicle #455
2. Vehicle telematics system immediately sends emergency alert to dispatch
3. Verify dispatcher workstation triggers critical audio alarm (continuous siren)
4. Verify emergency alert popup displays on dispatcher screen with red flashing border
5. Verify popup displays:
    - 🚨 CRITICAL EMERGENCY - Vehicle #455
    - Driver: John Smith (CDL: MA-1234567)
    - Location: I-95 North, Mile Marker 47, Springfield, MA
    - GPS Coordinates: 42.1015° N, 72.5898° W
    - Time: 2:47 PM
    - Vehicle Status: Stopped, emergency flashers active
    - Nearest Emergency: Springfield Fire Dept (3.2 mi), Memorial Hospital (4.1 mi)
6. Dispatcher acknowledges alert within 15 seconds (stops alarm)
7. Dispatcher immediately attempts to contact John via hands-free call
8. John answers: "I've been in an accident - rear-ended at traffic light - I'm okay but shaken up"
9. Dispatcher assesses situation (driver status, vehicle condition, road conditions)
10. **Action 1**: Dispatcher calls 911: "Commercial vehicle accident on I-95 North MM 47"
    - Verify 911 call is placed and logged
    - Verify police dispatched with ETA display
11. **Action 2**: Dispatcher notifies Safety Officer Mike Davis
    - Verify auto-alert sent to Safety Officer
    - Verify Mike receives notification
12. **Action 3**: Dispatcher requests tow service
    - Verify tow request sent to roadside assistance provider
    - Verify tow truck dispatched with ETA
13. **Action 4**: Assess cargo and route continuation
    - Cargo: 10 pallets, undamaged
    - Nearest vehicle: #512 at depot (35 minutes)
14. Dispatcher provides John with response plan:
    - "Police ETA 8 minutes, tow truck 25 minutes, replacement vehicle 35 minutes"
    - "Stay in vehicle if safe, turn on flashers, set out triangles if you can safely exit"
15. Verify incident record created: INC-2025-0847
16. Dispatcher monitors situation:
    - Police arrive at 2:55 PM
    - Tow truck arrives at 3:12 PM
    - Replacement vehicle arrives at 3:22 PM
17. Verify cargo transferred safely from Vehicle #455 to #512
18. Verify backup driver (Sarah Chen) continues route with 45-minute delay
19. Verify customer notifications sent with new ETAs
20. Verify incident marked "Resolved" with complete documentation

**Expected Results**:
- Step 2: Alert arrives at dispatch within 1 second of panic button activation
- Step 3: Audio alarm plays continuously until acknowledged
- Step 6: Alert acknowledged within 15 seconds (requirement met)
- Step 8: Dispatcher able to contact driver immediately
- Step 10: 911 call is logged with timestamp and location
- Step 12: Tow service dispatched within 2 minutes
- Step 17: Cargo transferred without damage
- Step 20: Incident fully documented with timeline

**Acceptance Criteria**:
- Emergency alerts trigger immediately (<1 second) upon panic button activation
- Critical audio alarm plays continuously and demands acknowledgment
- Dispatcher can immediately contact driver
- Emergency response protocol executes with 911 and roadside assistance
- Incident is fully documented with timestamps and actions
- Cargo is protected and route continues with replacement vehicle
- Business rule BR-DI-055 is enforced: "Emergency alerts must be acknowledged within 60 seconds or auto-escalate"

**Test Data**:
- Vehicle #455: Location=I-95 North MM 47, GPS=42.1015°N, 72.5898°W
- Driver: John Smith, CDL=MA-1234567
- Incident: Rear-end collision, vehicle not drivable
- Cargo: 10 pallets electronics (intact)
- Police ETA: 8 minutes
- Tow ETA: 25 minutes
- Replacement Vehicle: #512, ETA=35 minutes

---

### TC-DS-014: Vehicle Breakdown and Tow Coordination

**TC ID**: TC-DS-014
**Name**: Verify vehicle breakdown triggers proper tow service and route reassignment
**Related US/UC**: US-DI-010 / UC-DI-010
**Priority**: High
**Test Type**: Functional + Integration

**Preconditions**:
- Driver Sarah Chen is on active route with Vehicle #287
- Vehicle #287 is equipped with diagnostic system
- Tow provider integration is operational
- Repair facility database is available
- Backup driver Mike Torres is available

**Test Steps**:
1. Driver Sarah reports via mobile app: "Check engine light on, losing power, pulling over"
2. System creates breakdown incident: BRK-2025-0324
3. Verify vehicle diagnostic system sends fault codes to dispatch:
    - P0087: Fuel Rail Pressure Too Low
    - P0190: Fuel Rail Pressure Sensor
4. Dispatcher receives breakdown alert with diagnostics
5. Dispatcher contacts Sarah: "What's happening with the vehicle?"
6. Sarah reports: "Engine sputtering, fuel smell, pulling over now"
7. Dispatcher instructs: "Pull over safely, turn off engine, stay clear if fuel leak"
8. Sarah confirms vehicle safely stopped on shoulder
9. Dispatcher assesses situation:
    - Diagnosis: Likely fuel system failure (leak or pump)
    - Driveable: No
    - Cargo: 12 pallets electronics (high-value)
    - Route: 3 of 5 deliveries completed
10. **Action 1**: Request roadside diagnostic
    - Dispatcher contacts roadside assistance
    - Technician dispatched, ETA 35 minutes
11. **Action 2**: Identify repair facility
    - System finds nearest Freightliner dealer: Keystone Truck Center (22 miles)
    - Full service bay available
12. **Action 3**: Request tow service
    - Dispatcher requests flatbed tow (fuel leak requires flatbed, not hook)
    - Tow truck dispatched, ETA 45 minutes
    - Destination: Keystone Truck Center
    - Estimated cost: $385
13. **Action 4**: Arrange cargo transfer
    - Verify nearest available vehicle: #412 at Harrisburg depot (28 miles)
    - Verify Driver Mike Torres available for route takeover
    - Dispatcher assigns Mike to complete Sarah's 2 remaining deliveries
14. Roadside technician arrives, diagnoses: Fuel line rupture, active leak
    - Repair estimate: $850 parts + labor, 4-6 hours repair
    - Makes vehicle safe for towing
15. Tow truck arrives at 48-minute mark
16. Vehicle #287 towed to Keystone Truck Center
17. Mike Torres arrives with Vehicle #412 at 10:40 AM
18. Sarah and Mike transfer cargo (30 minutes)
19. Mike departs to complete remaining deliveries at 11:10 AM
20. Dispatcher updates customer ETAs (2-hour delay notification)
21. Dispatcher creates work order for Vehicle #287 repair
22. Repair completed at 2:30 PM
23. Verify breakdown costs tracked: $385 tow + $850 repair estimate = $1,235
24. Verify costs linked to vehicle maintenance record
25. Verify breakdown incident closed with complete documentation

**Expected Results**:
- Step 2: Breakdown incident created immediately
- Step 3: Fault codes received and displayed to dispatcher
- Step 10: Technician dispatched within 2 minutes
- Step 12: Tow service coordinated with flatbed truck
- Step 14: Repair facility identified with accurate availability
- Step 17: Backup driver and vehicle arrive within estimated timeframe
- Step 20: Customers notified of delivery delays
- Step 23: Costs accurately calculated and recorded
- Step 24: Maintenance record updated for future analysis

**Acceptance Criteria**:
- Breakdown incidents are detected and logged immediately
- Fault codes are received and assist in diagnostics
- Tow service is coordinated appropriately (flatbed for fuel leaks, etc.)
- Cargo is safely transferred to backup vehicle
- Route continues with minimal operational impact
- Breakdown costs are tracked and linked to vehicle records
- Customer delivery is not abandoned due to vehicle failure
- Business rule BR-DI-067 is enforced: "Breakdown incidents must be logged with fault codes for trend analysis"

**Test Data**:
- Vehicle #287: 2022 Freightliner, Fuel system failure
- Location: Route 22 West, Mile Marker 15, Pennsylvania
- Fault Codes: P0087, P0190 (Fuel system)
- Tow Cost: $385 (flatbed required)
- Repair Estimate: $850 parts + labor (4-6 hours)
- Backup Vehicle: #412, 28 miles away, Driver Mike Torres

---

### TC-DS-015: Emergency HOS Violation Alert and Driver Fatigue Management

**TC ID**: TC-DS-015
**Name**: Verify system alerts dispatcher when driver approaches HOS limits
**Related US/UC**: US-DI-009 (extended)
**Priority**: High
**Test Type**: Functional + Business Rules

**Preconditions**:
- Driver Tom is on active route
- Tom has been driving for 10 hours 45 minutes (approaching 11-hour limit)
- HOS tracking is enabled
- Alert thresholds are configured (alert at 10h 45m)

**Test Steps**:
1. Verify driver Tom has driven: 10 hours 45 minutes
2. Verify system detects approaching HOS limit
3. Verify system sends alert to both driver and dispatcher:
    - Dispatcher receives: "⚠ Tom Rodriguez: 15 minutes drive time remaining (11h limit)"
    - Driver Tom receives mobile notification: "15 minutes drive time remaining"
4. Dispatcher verifies current location and remaining route distance
5. Remaining distance: 25 miles (would require ~35 minutes at normal speed)
6. Dispatcher must take action before Tom hits 11-hour limit
7. Dispatcher options:
    - Option A: Instruct Tom to stop at next safe location for 10-hour rest
    - Option B: Reassign remaining cargo to another driver
    - Option C: Move Tom to off-duty status (rest required)
8. Dispatcher selects Option A: "Tom, pull over at next truck stop for 10-hour rest. Stop in 5 minutes."
9. Tom receives instruction and confirms understanding
10. Tom drives 5 more minutes (total: 10h 50m) and pulls into truck stop
11. System logs rest period start: 10:50 AM
12. System displays: "⚠ Tom Rodriguez: Rest period in effect - Next available: 8:50 PM"
13. System prevents Tom from resuming driving until 10-hour rest period complete
14. Tom sleeps for 10 hours
15. System alerts Tom: "10-hour rest complete - Safe to resume driving"
16. Verify no HOS violations recorded
17. Verify dispatcher can now reassign Tom to new routes

**Expected Results**:
- Step 2: System detects approaching HOS limit at 10h 45m mark
- Step 3: Both driver and dispatcher receive timely alerts
- Step 8: Dispatcher can enforce mandatory stop
- Step 10: Driver complies with HOS limits
- Step 11: Rest period properly logged
- Step 16: No HOS violations appear on driver record
- Step 17: Driver can resume operations after adequate rest

**Acceptance Criteria**:
- System actively monitors HOS and alerts at appropriate thresholds (45 min before limit)
- Alerts go to both dispatcher and driver
- Dispatcher can enforce mandatory stops
- System prevents violations by blocking driving after 11-hour limit
- Rest periods are logged and tracked
- No violations recorded when driver complies with system guidance
- Business rule BR-DI-079 is enforced: "HOS violations must be reviewed by safety officer within 24 hours"

**Test Data**:
- Driver: Tom Rodriguez
- Current Drive Time: 10 hours 45 minutes
- HOS Limit: 11 hours
- Warning Threshold: 45 minutes before limit
- Alert Time: 10:45 AM
- Remaining Distance: 25 miles
- Rest Stop: Truck stop 5 miles ahead
- Rest Period Required: 10 hours

---

## Epic 5: Performance Monitoring and Reporting

### TC-DS-016: Dispatch Performance Dashboard Real-Time Metrics

**TC ID**: TC-DS-016
**Name**: Verify dispatch performance dashboard displays real-time KPIs and updates every 5 minutes
**Related US/UC**: US-DI-011 / UC-DI-011
**Priority**: Medium
**Test Type**: Functional + Performance

**Preconditions**:
- Dispatcher is logged into dispatch console
- Active fleet operations are underway (8:00 AM shift)
- Performance metrics calculation engine is operational
- Historical baseline data exists for comparison
- Dashboard refresh rate is configured for 5-minute intervals

**Test Steps**:
1. Dispatcher Sarah opens Dispatch Performance Dashboard at 8:00 AM
2. Verify dashboard loads within 3 seconds
3. Dashboard displays real-time KPIs:
    - **Fleet Activity**: Active Vehicles: 42/50 (84%), Idle: 5 (10%), Maintenance: 3 (6%)
    - **Deliveries**: Scheduled: 87, Completed: 23 (26%), In Progress: 42 (48%), Pending: 22 (25%)
    - **On-Time Rate**: 91% (21/23 completed) - Goal: 90% ✓
    - **Response Time**: Avg assignment: 4.2 min - Goal: <5 min ✓
    - **Emergency Response**: Avg: 47 sec - Goal: <60 sec ✓
4. Verify all metrics display with visual indicators (gauges, progress bars, color coding)
5. Verify goal targets are displayed for comparison
6. Verify trend charts show performance over last 4 hours
7. At 8:30 AM, verify dashboard updates automatically with new data
8. Verify metrics reflect new deliveries completed since 8:00 AM
9. Dashboard now shows: Completed: 35 (40%), On-Time: 93% (33/35)
10. Verify trend chart updates to show upward trend
11. Dispatcher clicks on "ETA Accuracy" metric to drill down
12. System shows breakdown by cause:
    - Traffic delays: 6 deliveries (8% late)
    - Driver delays: 2 deliveries (3% late)
    - Route optimization: 1 delivery (1% late)
13. Dispatcher identifies Route #3421 with 35-minute traffic delay
14. Dashboard shows comparison: Today vs Yesterday vs Last Week
    - Today (8:30 AM): 93% on-time
    - Yesterday (same time): 88% on-time
    - Last week: 89% on-time
15. Dispatcher sees alert: "⚠ Avg idle time increasing - now 15 min (was 12 min)"
16. At 9:00 AM, dashboard updates again with latest data
17. Verify all metrics refresh automatically (no manual refresh needed)
18. Dispatcher exports dashboard snapshot for management report
19. Verify exported report includes all metrics, timestamps, and trends

**Expected Results**:
- Step 2: Dashboard loads within 3 seconds
- Step 3: All KPIs display accurately and current
- Step 5: Goal targets are displayed for comparison
- Step 7: Dashboard updates automatically at 8:30 AM (5-minute interval)
- Step 9: Updated metrics reflect new deliveries
- Step 11: Drill-down view shows detailed breakdown
- Step 14: Historical comparison displays correctly
- Step 17: Auto-refresh works without user interaction
- Step 19: Export creates timestamped report with all data

**Acceptance Criteria**:
- Dashboard displays comprehensive KPIs covering fleet activity, deliveries, response times, and performance
- Metrics update automatically at least every 5 minutes
- Trend charts show performance over time
- Dispatcher can drill down into specific metrics to understand drivers
- Historical comparison provides context (vs previous day, week)
- Visual indicators (gauges, colors) make status immediately apparent
- Alerts notify dispatcher of metrics falling below thresholds
- Performance data can be exported for reporting
- Business rule BR-DI-069 is enforced: "Dashboard must update at least every 5 minutes during active operations"

**Test Data**:
- Initial Metrics (8:00 AM): 23 completed, 91% on-time, 4.2 min assignment time
- Updated Metrics (8:30 AM): 35 completed, 93% on-time, 4.1 min assignment time
- Goals: On-time=90%, Response<5min, Emergency<60sec
- Alerts: Idle time >15min

---

### TC-DS-017: Driver Performance Scorecard Comparison and Assignment Recommendation

**TC ID**: TC-DS-017
**Name**: Verify driver performance scorecards display and enable assignment recommendations
**Related US/UC**: US-DI-012 / UC-DI-012
**Priority**: Medium
**Test Type**: Functional + Analytics

**Preconditions**:
- Driver Performance dashboard is open
- At least 3 drivers with different performance profiles available
- Performance data from last 30 days is available
- Driver telematics data is current
- Performance scoring algorithm is operational

**Test Steps**:
1. Dispatcher opens Driver Performance dashboard
2. System displays all active drivers with performance scorecards:
    - **Mike Torres**: Score 94/100 (Excellent)
      - On-Time Rate: 96% (48/50)
      - Safety Score: 92/100 (2 harsh braking events)
      - Customer Rating: 4.8/5.0 (8 ratings)
      - HOS Compliance: 100% (no violations)
      - Avg Delivery vs Est: -5 min (early)
    - **Tom Rodriguez**: Score 78/100 (Good)
      - On-Time Rate: 84%
      - Safety Score: 75/100 (6 hard braking events)
      - Customer Rating: 4.2/5.0
    - **Sarah Chen**: Score 88/100 (Very Good)
      - On-Time Rate: 90%
      - Safety Score: 85/100
      - Customer Rating: 4.6/5.0
3. High-priority delivery arrives: "Time-sensitive electronics, must arrive by 2:00 PM, high value"
4. System recommends Mike Torres for high-priority route (top performer)
5. Dispatcher assigns route to Mike
6. Dispatcher clicks on Tom Rodriguez to investigate lower safety score
7. System displays detailed driving behavior:
    - Hard braking: 6 events in last 30 days
    - Speeding: 3 events >10 mph over limit
    - Pattern: Most events in afternoon (fatigue?)
8. Dispatcher adds note: "Safety score trending down - recommend refresher training"
9. System flags Tom for Safety Officer review
10. Dispatcher checks driver availability for next week:
    - Mike: 11 hours available (full day)
    - Tom: 5.5 hours available (half day - approaching 70-hour limit)
    - Sarah: 11 hours available (full day)
11. System recommends: "Tom Rodriguez requires 34-hour restart this weekend"
12. Dispatcher schedules Tom off-duty for HOS reset
13. Dispatcher exports driver performance summary for fleet manager meeting
14. System generates comparison report: Mike (94) vs Tom (78) vs Sarah (88)
15. Verify all performance metrics are accurate and current

**Expected Results**:
- Step 2: All driver scorecards display with complete metrics
- Step 4: System recommends top performer for high-priority route
- Step 7: Detailed behavior analysis is available
- Step 8: Note added to driver record for Safety Officer
- Step 10: Availability accurately reflects HOS status
- Step 11: System suggests HOS restart before violation
- Step 13: Export generated with performance metrics
- Step 15: Metrics are accurate and based on current data

**Acceptance Criteria**:
- Driver performance scorecards display comprehensive metrics
- System recommends top performers for high-priority routes
- Dispatcher can drill down into specific behavior patterns
- HOS status is accurately reflected for assignment planning
- System suggests preventive actions (training, HOS restart) before problems occur
- Performance notes are recorded for review by safety officer
- Performance data can be exported for management review
- Business rule BR-DI-077 is enforced: "Minimum performance score of 70/100 required for high-priority routes"

**Test Data**:
- Mike Torres: 94/100, 96% on-time, 92 safety score, 4.8 customer rating
- Tom Rodriguez: 78/100, 84% on-time, 75 safety score, 4.2 customer rating
- Sarah Chen: 88/100, 90% on-time, 85 safety score, 4.6 customer rating
- High-Priority Route: Time-sensitive, high-value, 2:00 PM deadline

---

### TC-DS-018: On-Time Performance Metric with Threshold Alert

**TC ID**: TC-DS-018
**Name**: Verify on-time delivery performance metric triggers alert when falls below acceptable threshold
**Related US/UC**: US-DI-011 / UC-DI-011
**Priority**: High
**Test Type**: Functional + Business Rules

**Preconditions**:
- Dispatch Performance Dashboard is open and displaying metrics
- On-time delivery goal is set to 90%
- Currently at 91% on-time rate (above threshold)
- Multiple deliveries are in progress
- Alert system is configured to trigger at threshold breach

**Test Steps**:
1. Verify current on-time delivery rate: 91% (21/23 completed) - ABOVE 90% goal
2. Verify metric displays with green indicator
3. Simulate late deliveries over next hour:
    - 3 additional deliveries completed
    - 2 arrive on-time (within 15-min window)
    - 1 arrives 30 minutes late (due to traffic)
4. Dashboard auto-updates at next 5-minute refresh cycle
5. Verify on-time rate recalculated: 23/26 = 88.5% (BELOW 90% goal)
6. Verify metric indicator changes from green to red (warning)
7. Verify alert notification appears: "⚠ On-time delivery rate has dropped below 90% goal"
8. Verify alert details show: "Current: 88.5%, Goal: 90%, Variance: -1.5%"
9. System displays contributing factors:
    - "Late deliveries in region: I-95 corridor (3 instances)"
    - "Traffic impact estimated: 35-45 minutes per route"
10. Dispatcher can drill down to see specific late deliveries
11. Dispatcher reviews options to improve metric:
    - Re-route active drivers away from congestion
    - Adjust future route assignments
    - Notify affected customers
12. Dispatcher takes corrective action: "Re-optimize active routes to avoid I-95"
13. System processes re-routing and calculates impact
14. Next deliveries on optimized routes arrive on-time
15. On-time rate begins recovering upward
16. At next refresh, verify metric shows: 90.5% (above threshold again)
17. Verify metric indicator changes back to green
18. Verify alert is cleared from active queue
19. Verify all actions are logged to audit trail

**Expected Results**:
- Step 5: On-time rate accurately recalculated with new data
- Step 6: Visual indicator changes to red/yellow warning
- Step 7: Alert notification appears to dispatcher
- Step 9: Causal analysis identifies contributing factors
- Step 12: Corrective action can be implemented
- Step 16: Metric recovers above threshold
- Step 17: Visual indicator returns to green
- Step 19: All actions logged with timestamps

**Acceptance Criteria**:
- System monitors on-time delivery rate in real-time
- Alerts trigger when metric drops below threshold
- Causal analysis helps dispatcher understand root cause
- Dispatcher can take corrective action
- Metrics update automatically to reflect improvements
- Alert clears when threshold is exceeded again
- All monitoring and actions are auditable
- Business rule BR-DI-071 is enforced: "On-time delivery target is 90% within 15-minute delivery window"

**Test Data**:
- Goal: 90% on-time delivery within 15-minute window
- Initial Rate: 91% (21/23 completed)
- Late Deliveries: 1 delivery 30 min late (due to I-95 traffic)
- Updated Rate: 88.5% (below threshold)
- Alert Trigger: When rate drops below 90%
- Corrective Action: Re-route to avoid congestion

---

### TC-DS-019: Shift Summary Report Generation and Export

**TC ID**: TC-DS-019
**Name**: Verify shift summary report is generated automatically at end of shift with all KPIs
**Related US/UC**: US-DI-011 / UC-DI-011
**Priority**: Medium
**Test Type**: Functional + Reporting

**Preconditions**:
- Dispatcher has been on shift for 9 hours (8:00 AM - 5:00 PM)
- Multiple deliveries were completed during shift
- Performance metrics have been tracked throughout shift
- Report generation service is operational

**Test Steps**:
1. At 5:00 PM (end of shift), dispatcher clicks "Generate Shift Summary Report"
2. System compiles complete shift performance data:
    - Shift duration: 9 hours
    - Start time: 8:00 AM, End time: 5:00 PM
3. System calculates shift KPIs:
    - **Deliveries Completed**: 87 (100% of scheduled)
    - **On-Time Rate**: 91% (79/87) ✓ Exceeded 90% goal
    - **Avg Route Assignment Time**: 4.2 minutes ✓ Met <5 min goal
    - **Emergencies Handled**: 2 (avg response: 52 sec) ✓ Met <60 sec goal
    - **Vehicle Utilization**: 84% ✓ Met 85% goal (slight shortfall but acceptable)
    - **Late Deliveries**: 8 (due to traffic: 6, driver delays: 2)
    - **Customer Complaints**: 1 (late delivery notification issue - resolved)
4. System generates executive summary:
    - Overall shift performance: EXCELLENT
    - Key achievements:
      - Exceeded on-time delivery target by 1 percentage point
      - Fast emergency response times (avg 52 sec)
      - High customer satisfaction
    - Areas for improvement:
      - Vehicle utilization slightly below target (84% vs 85%)
      - Late deliveries in I-95 corridor (5 of 8 late)
5. System highlights driver-level performance:
    - Mike Torres: 96% on-time, 5 assignments, top performer
    - Sarah Chen: 90% on-time, 4 assignments, consistent
    - Tom Rodriguez: 84% on-time, 3 assignments, needs coaching
6. System includes incident summary:
    - Emergency events: 2 handled appropriately
    - Breakdown: 1 vehicle (Vehicle #287, fuel line rupture)
    - False alerts: 0
7. Dispatcher reviews report on screen
8. Dispatcher clicks "Export as PDF"
9. System generates PDF report with all metrics, charts, and summary
10. PDF includes:
    - Shift timestamp (8:00 AM - 5:00 PM)
    - All KPI metrics with status (✓/✗)
    - Trend charts (last 4 hours)
    - Driver performance table
    - Incident summary
    - Recommendations for next shift
11. System saves PDF to reports folder: "Shift_Summary_20251110_Dispatcher_Sarah.pdf"
12. System sends PDF to dispatcher email automatically
13. System also sends copy to shift supervisor and fleet manager
14. Dispatcher can download PDF from report repository
15. Report is archived for historical trend analysis

**Expected Results**:
- Step 3: All shift metrics calculated accurately
- Step 4: Executive summary is insightful and actionable
- Step 9: PDF generated with professional formatting
- Step 11: Report saved with descriptive filename
- Step 12: Email sent automatically to dispatcher
- Step 13: Supervisor and manager copies sent
- Step 15: Report archived for long-term analysis

**Acceptance Criteria**:
- Shift summary reports are generated automatically at end of shift
- All KPI metrics are included and accurately calculated
- Reports include comparison to goals and targets
- Visualizations (charts) make trends clear
- Reports can be exported as PDF for sharing
- Reports are sent automatically to relevant stakeholders
- Reports are archived for historical analysis and trend identification
- Business rule BR-DI-074 is enforced: "Shift summary reports generated automatically at end of each shift"

**Test Data**:
- Shift: 8:00 AM - 5:00 PM (9 hours)
- Deliveries: 87 completed (100% of scheduled)
- On-Time Rate: 91% (goal: 90%)
- Emergencies: 2 (avg response: 52 sec, goal: <60 sec)
- Vehicle Util: 84% (goal: 85%)

---

### TC-DS-020: Real-Time Alert Response Time SLA Monitoring

**TC ID**: TC-DS-020
**Name**: Verify system tracks alert acknowledgment response time and meets SLA requirements
**Related US/UC**: US-DI-002 / UC-DI-002
**Priority**: High
**Test Type**: Functional + Performance

**Preconditions**:
- Alert system is operational
- SLA thresholds are configured:
  - Critical alerts: <60 seconds acknowledgment
  - Warning alerts: <5 minutes acknowledgment
- Multiple vehicles with active telematics
- Dispatcher is monitoring alert queue

**Test Steps**:
1. **Alert #1 - Critical**: Panic button activation at Vehicle #455 (2:47 PM)
   - System generates critical alert and logs timestamp: 2:47:00 PM
   - Alert appears on dispatcher screen at 2:47:01 PM
   - Dispatcher acknowledges alert at 2:47:45 PM
   - Response time: 45 seconds ✓ (within 60 sec SLA)
2. Verify system logs alert metrics:
   - Alert ID: ALERT-20251110-001
   - Type: Critical (Panic Button)
   - Generated: 2:47:00 PM
   - Acknowledged: 2:47:45 PM
   - Response Time: 45 seconds
   - Status: SLA MET ✓
3. **Alert #2 - Warning**: Harsh braking at Vehicle #247 (3:15 PM)
   - System generates warning alert at 3:15:00 PM
   - Dispatcher acknowledges at 3:16:30 PM
   - Response time: 90 seconds ✓ (within 5 min SLA)
4. **Alert #3 - Info**: Geofence violation at Vehicle #512 (3:45 PM)
   - System generates info alert at 3:45:00 PM
   - Dispatcher acknowledges at 3:47:15 PM
   - Response time: 135 seconds ✓ (info level SLA less critical)
5. **Alert #4 - Critical**: Emergency button at Vehicle #287 (4:30 PM)
   - System generates critical alert at 4:30:00 PM
   - Dispatcher distracted, does not acknowledge immediately
   - At 4:30:30 PM: No acknowledgment yet (30 sec)
   - At 4:30:45 PM: Still no acknowledgment (45 sec)
   - At 4:31:00 PM: Alert approaching SLA limit (60 sec)
   - Dispatcher clicks acknowledge at 4:31:15 PM
   - Response time: 75 seconds ✗ (EXCEEDS 60 sec SLA)
6. Verify system logs SLA violation:
   - Alert ID: ALERT-20251110-004
   - Type: Critical
   - Response Time: 75 seconds
   - Status: SLA MISSED ✗
   - Severity: HIGH (safety-critical alert)
7. System generates performance alert to dispatcher supervisor
8. System logs incident to audit trail for compliance review
9. At end of shift, generate Alert Response Time Report:
   - Total alerts: 50
   - Critical alerts: 15
   - Critical SLA Met: 14 (93%) ✓
   - Critical SLA Missed: 1 (7%) ✗
   - Warning alerts: 20
   - Warning SLA Met: 20 (100%) ✓
   - Info alerts: 15
   - Info SLA Met: 15 (100%) ✓
10. Verify overall dispatcher performance: 94% critical SLA compliance
11. Dispatcher supervisor reviews alert response time report
12. Supervisor provides feedback: "Good overall performance, 1 critical alert missed SLA - review circumstances"

**Expected Results**:
- Step 1: Alert response time recorded accurately to nearest second
- Step 2: SLA evaluation correct (45 sec < 60 sec = MET)
- Step 5: Response time tracked and compared to SLA
- Step 6: SLA violation properly logged with severity
- Step 7: Supervisor notified of missed SLA
- Step 9: Report accurately tallies all alerts and SLA performance
- Step 10: Compliance percentage calculated correctly

**Acceptance Criteria**:
- All alert response times are tracked with precision to seconds
- SLA thresholds are enforced (60 sec critical, 5 min warning, etc.)
- SLA violations are logged and flagged
- Supervisor is alerted of missed SLAs
- End-of-shift reports include SLA performance metrics
- Response time data is available for trend analysis
- Dispatcher performance is measured on alert response time SLA compliance
- Business rule BR-DI-007 is enforced: "Critical alerts must be acknowledged within 2 minutes or auto-escalate"

**Test Data**:
- Alert #1 (Critical): Response=45 sec (SLA<60 sec) ✓
- Alert #2 (Warning): Response=90 sec (SLA<5 min) ✓
- Alert #3 (Info): Response=135 sec
- Alert #4 (Critical): Response=75 sec (SLA<60 sec) ✗
- Shift Stats: 50 total alerts, 15 critical (14 met / 1 missed SLA)

---

## Test Execution Summary

**Total Test Cases**: 20
**Test Type Distribution**:
- Functional: 14
- Integration: 10
- Business Rules: 8
- Performance: 3
- UI: 2

**Priority Distribution**:
- High: 14 test cases
- Medium: 6 test cases

**Epic Coverage**:
1. Real-Time Vehicle Tracking: 5 test cases (TC-DS-001 to TC-DS-004)
2. Route Assignment and Optimization: 5 test cases (TC-DS-005 to TC-DS-009)
3. Load Planning and Scheduling: 3 test cases (TC-DS-010 to TC-DS-012)
4. Emergency Response Coordination: 3 test cases (TC-DS-013 to TC-DS-015)
5. Performance Monitoring and Reporting: 5 test cases (TC-DS-016 to TC-DS-020)

---

## Test Data Management

All test data should be maintained in a separate test data repository with:
- Vehicle data (IDs, capacity, location, status)
- Driver data (names, certifications, HOS status)
- Customer data (names, addresses, phone numbers)
- Route/delivery data (pickup/delivery locations, time windows)
- Cargo data (weights, dimensions, HAZMAT status)

Test data should include:
- Valid/happy path scenarios
- Edge cases (capacity limits, HOS violations)
- Error scenarios (missing data, service unavailable)
- Performance scenarios (large datasets, concurrent operations)

---

## Related Documents

- User Stories: `user-stories/04_DISPATCHER_USER_STORIES.md`
- Use Cases: `use-cases/04_DISPATCHER_USE_CASES.md`
- Workflows: `workflows/04_DISPATCHER_WORKFLOWS.md` (to be created)
- API Specifications: `api/dispatcher-endpoints.md` (to be created)

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-10 | QA Team | Initial dispatcher test cases created (20 test cases) |

---

*This document provides comprehensive test cases for validating all Dispatcher functionality including real-time tracking, route optimization, WebSocket dispatch, emergency response, and performance monitoring.*
