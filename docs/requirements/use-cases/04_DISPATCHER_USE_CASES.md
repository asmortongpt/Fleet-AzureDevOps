# Dispatcher - Use Cases

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

## Epic 1: Real-Time Vehicle Tracking

### UC-DI-001: Monitor Live Fleet Map

**Use Case ID**: UC-DI-001
**Use Case Name**: Monitor Live Fleet Map
**Actor**: Dispatcher (primary), Fleet Manager (secondary)
**Priority**: High

#### Preconditions:
- Dispatcher is logged into the dispatch console
- At least one vehicle is active with GPS telematics enabled
- WebSocket connection is established
- Map service API is operational

#### Trigger:
- Dispatcher opens the live fleet map dashboard
- System auto-refreshes map data every 10-30 seconds

#### Main Success Scenario:
1. Dispatcher navigates to the live fleet map view
2. System loads interactive map centered on active fleet geographic center
3. System displays all active vehicles as color-coded markers based on status:
   - Green: Active/in transit
   - Yellow: Idle/stopped
   - Orange: Maintenance required
   - Red: Emergency/breakdown
   - Blue: Completed/returning to depot
4. Dispatcher clicks on a vehicle marker
5. System displays popup with vehicle details:
   - Driver name and contact
   - Current load and destination
   - Estimated time of arrival (ETA)
   - Vehicle status and health
   - Last communication timestamp
6. Dispatcher enables traffic overlay layer
7. System displays current traffic conditions with color-coded congestion
8. Dispatcher filters vehicles by "Active deliveries only"
9. System updates map to show only vehicles with active delivery status
10. Dispatcher enables vehicle trail visualization for last 2 hours
11. System draws dotted path lines showing historical vehicle movement
12. Map auto-refreshes with latest GPS positions every 10-30 seconds via WebSocket

#### Alternative Flows:

**A1: View Vehicle Clusters (Large Fleet)**
- 2a. If fleet has 50+ vehicles in close proximity:
  - System clusters nearby vehicles into numbered groups
  - Dispatcher clicks cluster to zoom and expand individual vehicles
  - System reveals individual vehicle markers at higher zoom level

**A2: Geofence Violation Alert**
- 11a. If vehicle exits authorized geofence:
  - System highlights vehicle marker with pulsing red border
  - Alert panel displays geofence violation with timestamp
  - Dispatcher clicks alert to center map on violating vehicle
  - System displays geofence boundary and exit point

**A3: Emergency Button Activation**
- 11a. If driver activates panic/emergency button:
  - Vehicle marker changes to flashing red with alarm icon
  - System triggers audio alert at dispatch console
  - Emergency response panel auto-opens with vehicle details
  - Map centers on emergency vehicle location
  - System displays nearest emergency services and hospitals

#### Exception Flows:

**E1: GPS Signal Lost**
- If vehicle GPS signal is lost for >5 minutes:
  - System displays last known location with gray "stale data" marker
  - Timestamp shows age of last GPS update
  - System attempts to contact driver via messaging
  - Alert is logged for supervisor review

**E2: Map Service Unavailable**
- If map service API fails:
  - System displays error message: "Map service temporarily unavailable"
  - System falls back to simple list view of vehicle locations (lat/long)
  - System retries map service connection every 60 seconds
  - Dispatcher is notified when map service is restored

**E3: WebSocket Connection Interrupted**
- If real-time WebSocket connection drops:
  - System displays warning banner: "Real-time updates paused - reconnecting"
  - System switches to 30-second polling as backup
  - System automatically reconnects WebSocket when available
  - No data loss during reconnection

#### Postconditions:
- Dispatcher has current visibility of all active vehicle locations
- Vehicle status updates are received in real-time
- Alerts and exceptions are logged to system audit trail
- Map state preferences are saved to dispatcher profile

#### Business Rules:
- BR-DI-001: GPS updates must be <30 seconds old for "live" status
- BR-DI-002: Vehicles with stale GPS data (>5 min) must be flagged
- BR-DI-003: Emergency alerts must override all other map interactions
- BR-DI-004: Map must support minimum 500 concurrent vehicle markers
- BR-DI-005: Geofence violations must trigger immediate visual and audio alerts
- BR-DI-006: Map clustering activates automatically when >50 vehicles in viewport

#### Related User Stories:
- US-DI-001: Live Fleet Map Monitoring
- US-DI-002: Vehicle Status Alerts and Notifications

---

### UC-DI-002: Respond to Real-Time Vehicle Alerts

**Use Case ID**: UC-DI-002
**Use Case Name**: Respond to Real-Time Vehicle Alerts
**Actor**: Dispatcher (primary), Safety Officer (secondary)
**Priority**: High

#### Preconditions:
- Dispatcher is logged into dispatch console
- Vehicle telematics system is generating events
- Alert notification system is operational
- Audio notification is enabled on dispatcher workstation

#### Trigger:
- Vehicle telematics system detects critical event (emergency button, harsh braking, geofence violation, vehicle fault)
- System generates real-time alert

#### Main Success Scenario:
1. Telematics system detects harsh braking event from Vehicle #247
2. System generates "Warning" level alert with event details
3. Alert appears in dispatcher's active alert queue with yellow highlight
4. System plays distinct audio notification tone (warning chime)
5. Alert displays:
   - Vehicle ID and driver name
   - Event type: "Harsh Braking Detected"
   - Timestamp and location coordinates
   - Current speed: 45 mph → 0 mph in 2.3 seconds
   - Recommended action: "Contact driver to verify safety"
6. Dispatcher clicks alert to view full details
7. System displays alert details panel with map showing event location
8. Dispatcher clicks "Acknowledge" button
9. System removes alert from active queue and logs acknowledgment
10. System moves alert to "Acknowledged Alerts" history with timestamp
11. Dispatcher adds note: "Driver confirmed no incident - avoided obstacle"
12. System updates alert record with dispatcher notes and closes alert

#### Alternative Flows:

**A1: Critical/Emergency Alert**
- 2a. If event is critical (panic button, airbag deployment):
  - Alert displays with red background and "CRITICAL" badge
  - System plays urgent audio alarm (continuous tone until acknowledged)
  - Alert auto-opens full details panel
  - Map auto-centers on vehicle location
  - System displays emergency response quick actions:
    - "Call Driver"
    - "Dispatch 911"
    - "Request Roadside Assistance"
    - "Reassign Route"
  - Alert escalates to supervisor if not acknowledged in 2 minutes

**A2: Multiple Simultaneous Alerts**
- 2a. If multiple alerts occur simultaneously:
  - System prioritizes by severity (Critical > Warning > Info)
  - Critical alerts display first in queue
  - Alert counter badge shows total pending: "5 Active Alerts"
  - Dispatcher can sort alerts by time, severity, or vehicle
  - Bulk acknowledge option available for low-priority info alerts

**A3: Escalate Alert to Supervisor**
- 8a. If dispatcher determines alert requires supervisor intervention:
  - Dispatcher clicks "Escalate" button
  - System prompts for escalation reason (text input)
  - System notifies supervisor via push notification and email
  - Alert is flagged with "Escalated" badge
  - Alert remains in dispatcher queue until supervisor reviews

**A4: Filter Alerts by Severity**
- 6a. If dispatcher wants to focus on critical alerts:
  - Dispatcher selects filter: "Critical Only"
  - System hides warning and info level alerts
  - Alert counter shows filtered count
  - Dispatcher can toggle filter on/off

#### Exception Flows:

**E1: Alert Auto-Escalation (No Response)**
- If dispatcher does not acknowledge critical alert within 2 minutes:
  - System automatically escalates to dispatch supervisor
  - System sends SMS and email notification to supervisor
  - Alert is flagged with "Auto-Escalated - No Response" status
  - System logs missed alert to dispatcher performance record

**E2: False Alert / Driver Override**
- If driver reports alert is false positive:
  - Dispatcher selects "Mark as False Alert"
  - System prompts for reason (sensor malfunction, driver override, etc.)
  - Alert is logged with "False Positive" status
  - System tracks false alert rate by vehicle for maintenance review

**E3: Alert System Unavailable**
- If alert notification system fails:
  - System displays error banner: "Alert system degraded - check manually"
  - System falls back to polling vehicle events every 30 seconds
  - Email backup notifications sent for critical events
  - System alerts IT administrator of alert system failure

#### Postconditions:
- All alerts are acknowledged and documented
- Critical alerts trigger appropriate response actions
- Alert response times are tracked for performance metrics
- Alert history is available for safety analysis and compliance audits

#### Business Rules:
- BR-DI-007: Critical alerts must be acknowledged within 2 minutes or auto-escalate
- BR-DI-008: All alert acknowledgments must include dispatcher timestamp
- BR-DI-009: Emergency button alerts bypass all filters and display immediately
- BR-DI-010: Alert audio can be customized by severity level
- BR-DI-011: Alert history must be retained for 7 years for compliance
- BR-DI-012: Dispatchers can configure personal alert preferences (sound, popup, etc.)

#### Related User Stories:
- US-DI-002: Vehicle Status Alerts and Notifications
- US-DI-009: Emergency Response Management

---

### UC-DI-003: Communicate with Drivers via Messaging

**Use Case ID**: UC-DI-003
**Use Case Name**: Communicate with Drivers via Messaging
**Actor**: Dispatcher (primary), Driver (secondary)
**Priority**: High

#### Preconditions:
- Dispatcher is logged into dispatch console
- Driver has mobile app installed and logged in
- Driver's mobile device has cellular connectivity
- Messaging service (SMS gateway or push notification) is operational

#### Trigger:
- Dispatcher needs to send route update, instruction, or information to driver
- Driver sends message requiring dispatcher response

#### Main Success Scenario:
1. Dispatcher needs to notify Driver John Smith of traffic delay on Route 405
2. Dispatcher opens messaging panel and selects Driver John Smith
3. System displays conversation history with John Smith (last 30 days)
4. Dispatcher selects message template: "Traffic Delay Notification"
5. System populates message: "Traffic delay on Route 405. Expect 20 min delay. Customer has been notified. Continue current route."
6. Dispatcher customizes delay time to "30 min" and adds note: "Avoid I-95 northbound"
7. Dispatcher clicks "Send Message"
8. System sends message via push notification to driver's mobile app
9. System displays "Sent" status with timestamp: 10:42 AM
10. Driver receives notification on mobile device within 5 seconds
11. Driver opens message and taps quick reply: "👍 Acknowledged"
12. System displays "Delivered" status at 10:42 AM
13. System updates to "Read" status at 10:43 AM when driver opens message
14. System receives driver's acknowledgment reply
15. System displays reply in conversation thread with timestamp
16. Dispatcher confirms driver received and understood the message

#### Alternative Flows:

**A1: Broadcast Message to Multiple Drivers**
- 2a. If dispatcher needs to notify multiple drivers:
  - Dispatcher clicks "New Broadcast Message"
  - System displays driver selection interface with filters (region, route, status)
  - Dispatcher selects filter: "All active drivers in Northeast region" (12 drivers)
  - Dispatcher composes message: "Severe weather alert - reduce speed and use caution"
  - System shows preview: "This message will be sent to 12 drivers"
  - Dispatcher clicks "Send Broadcast"
  - System sends individual messages to all selected drivers
  - System displays delivery status for each driver in list view
  - Dispatcher can see which drivers have read the message

**A2: Send Location Waypoint to Driver**
- 4a. If dispatcher needs to send new pickup/delivery location:
  - Dispatcher clicks "Send Location" button
  - System displays map interface
  - Dispatcher searches for address: "123 Warehouse Blvd, Boston MA"
  - System geocodes address and displays marker on map
  - Dispatcher adds note: "New pickup - load 10 pallets"
  - Dispatcher clicks "Send to Driver"
  - System packages location data with navigation link
  - Driver receives message with embedded map link
  - Driver taps map link to open turn-by-turn navigation

**A3: Emergency Message with Priority Flag**
- 4a. If message is urgent/emergency:
  - Dispatcher selects message priority: "Emergency"
  - Message displays with red "URGENT" badge
  - System sends push notification with high-priority flag (bypasses Do Not Disturb)
  - Driver's device triggers urgent notification sound
  - Message requires driver acknowledgment
  - System escalates to phone call if not acknowledged in 5 minutes

**A4: Driver-Initiated Message Requiring Response**
- 1a. If driver sends message to dispatcher:
  - System displays incoming message notification with driver name
  - Message appears in dispatcher's message queue
  - Dispatcher clicks notification to open conversation
  - Driver's message: "Customer not at delivery location. What should I do?"
  - Dispatcher responds: "Contact customer at 555-0123. Wait 15 min, then return to depot with load."
  - System logs conversation for audit trail

#### Exception Flows:

**E1: Message Delivery Failed**
- If message fails to deliver (no cellular connectivity):
  - System displays "Failed to Deliver" status
  - System automatically retries delivery every 60 seconds for 15 minutes
  - If still undelivered, system escalates with warning to dispatcher
  - Dispatcher is prompted to try alternative contact method (phone call)
  - System logs failed delivery attempt with reason

**E2: Driver Mobile App Offline**
- If driver's mobile app is not running or logged out:
  - System falls back to SMS delivery as backup
  - Message is sent via SMS gateway to driver's registered phone number
  - System displays "Sent via SMS" status
  - Driver replies via SMS and message is received in dispatch console
  - System logs communication method change

**E3: Messaging Service Outage**
- If push notification service is unavailable:
  - System displays error: "Messaging service temporarily unavailable"
  - System offers alternative: "Send via SMS" or "Call Driver"
  - Dispatcher selects SMS as backup method
  - System sends message via SMS gateway
  - System notifies IT of messaging service outage

#### Postconditions:
- Message is delivered to driver and delivery status is confirmed
- Driver acknowledgment is recorded (if required)
- Full conversation history is logged for compliance and audit
- Communication timeline is available for dispute resolution

#### Business Rules:
- BR-DI-013: All driver communications must be logged for 3 years minimum
- BR-DI-014: Emergency messages must bypass all notification filters
- BR-DI-015: Message delivery must be confirmed within 30 seconds
- BR-DI-016: Drivers must acknowledge critical messages within 5 minutes
- BR-DI-017: Broadcast messages cannot exceed 200 characters
- BR-DI-018: Location waypoints must include geocoded coordinates
- BR-DI-019: Message templates must be approved by operations manager

#### Related User Stories:
- US-DI-003: Driver Communication and Messaging

---

## Epic 2: Route Assignment and Optimization

### UC-DI-004: Assign Routes to Available Drivers

**Use Case ID**: UC-DI-004
**Use Case Name**: Assign Routes to Available Drivers
**Actor**: Dispatcher (primary), Driver (secondary)
**Priority**: High

#### Preconditions:
- Dispatcher is logged into dispatch console
- Pending jobs/routes exist in the system
- At least one driver is available and on-duty
- Driver HOS data is current and accurate
- Vehicle capacity data is up-to-date

#### Trigger:
- New delivery orders arrive requiring route assignment
- Dispatcher begins daily route planning and assignment process
- Driver becomes available and ready for new assignment

#### Main Success Scenario:
1. Dispatcher navigates to Route Assignment dashboard at 6:00 AM
2. System displays pending jobs requiring assignment (15 delivery orders)
3. System shows available drivers with status panel:
   - Driver name, current location, HOS remaining, vehicle capacity, status
4. Dispatcher selects Job #1247: "Deliver 8 pallets to Boston warehouse by 2:00 PM"
5. System calculates recommended drivers based on:
   - Proximity to pickup location
   - Available HOS (must have 4+ hours for this route)
   - Vehicle capacity (must accommodate 8 pallets)
   - Current workload
6. System recommends Driver Mike Torres (10 miles from pickup, 9 hrs HOS remaining, empty truck)
7. Dispatcher drags Job #1247 and drops onto Mike Torres in driver list
8. System validates assignment:
   - ✓ HOS sufficient (estimated 3.5 hours drive time < 9 hours available)
   - ✓ Vehicle capacity sufficient (8 pallets < 20 pallet capacity)
   - ✓ Delivery window achievable (ETA 1:45 PM < 2:00 PM deadline)
9. System displays assignment confirmation dialog with route details:
   - Pickup: ABC Warehouse, 123 Industrial Dr
   - Delivery: XYZ Distribution, 456 Warehouse Blvd, Boston
   - Estimated drive time: 3.5 hours
   - Estimated completion: 1:45 PM
10. Dispatcher clicks "Confirm Assignment"
11. System creates route and sends push notification to Mike Torres' mobile app
12. Driver Mike receives assignment notification: "New Route Assigned - 8 pallets to Boston"
13. Driver taps notification to view full route details with turn-by-turn navigation
14. Driver clicks "Accept Assignment" in mobile app
15. System updates driver status to "En Route" and route status to "In Progress"
16. Dispatcher sees confirmation that Mike has accepted the route

#### Alternative Flows:

**A1: Multi-Stop Route Assignment**
- 4a. If route has multiple delivery stops:
  - Dispatcher selects Jobs #1247, #1248, #1249 (3 stops in Boston area)
  - Dispatcher drags all jobs to Driver Mike Torres
  - System automatically optimizes stop sequence for shortest route
  - System calculates total drive time: 5.2 hours
  - System displays optimized route with stops in order:
    1. Pickup at ABC Warehouse
    2. Delivery Stop 1: XYZ Distribution (1:45 PM)
    3. Delivery Stop 2: DEF Logistics (2:30 PM)
    4. Delivery Stop 3: GHI Supply (3:45 PM)
  - Dispatcher confirms multi-stop assignment
  - Driver receives route with all stops and optimized sequence

**A2: Manual Override of System Recommendation**
- 6a. If dispatcher prefers different driver than system recommendation:
  - Dispatcher ignores system recommendation
  - Dispatcher manually assigns job to Driver Sarah Johnson instead
  - System displays warning: "⚠ Driver is 45 miles from pickup - ETA may be delayed"
  - Dispatcher adds override justification: "Sarah has existing route nearby"
  - System logs manual override with reason
  - Assignment proceeds normally

**A3: HOS Limit Exceeded Warning**
- 8a. If assignment would exceed driver's HOS limits:
  - System displays error: "❌ Cannot assign - insufficient HOS remaining"
  - System shows: "Driver has 2.5 hours remaining, route requires 3.5 hours"
  - Dispatcher must select different driver or split route into multiple assignments
  - System prevents assignment until HOS conflict is resolved

**A4: Vehicle Capacity Exceeded**
- 8a. If assignment exceeds vehicle capacity:
  - System displays warning: "⚠ Load exceeds vehicle capacity"
  - System shows: "Route requires 8 pallets, vehicle capacity is 5 pallets"
  - Dispatcher options:
    - Assign partial load and create second route for remaining cargo
    - Assign to driver with larger vehicle
    - Split into two separate deliveries
  - System prevents overloading violation

**A5: Reassign Route in Real-Time**
- 1a. If driver breaks down or becomes unavailable during active route:
  - Dispatcher clicks "Reassign Route" on active route
  - System shows current route progress: "2 of 5 stops completed"
  - System recommends nearest available driver to take over
  - Dispatcher confirms reassignment
  - System notifies original driver: "Route reassigned due to vehicle issue"
  - System notifies new driver: "New assignment - take over 3 remaining stops"
  - System updates customer ETAs automatically

#### Exception Flows:

**E1: Driver Rejects Assignment**
- If driver rejects assignment in mobile app:
  - System notifies dispatcher: "Mike Torres rejected route assignment"
  - System prompts dispatcher for reason
  - Dispatcher contacts driver to understand reason
  - Driver explains: "Vehicle has mechanical issue - cannot accept route"
  - Dispatcher logs reason and reassigns to different driver
  - System flags original driver as unavailable until issue resolved

**E2: No Available Drivers**
- If no drivers meet route requirements:
  - System displays message: "No available drivers match route requirements"
  - System shows limiting factors: "All drivers either on-route or insufficient HOS"
  - Dispatcher options:
    - Delay route to later time when driver available
    - Escalate to fleet manager for additional driver resources
    - Subcontract to external carrier
  - System logs unassigned route for management review

**E3: Route Assignment Service Unavailable**
- If route optimization service fails:
  - System displays error: "Route optimization temporarily unavailable"
  - System allows manual assignment without ETA calculation
  - Dispatcher enters estimated drive time manually
  - System logs manual assignment for later optimization review
  - System retries optimization service when available

#### Postconditions:
- Route is assigned to driver and assignment is confirmed
- Driver has received route details and navigation instructions
- Customer ETA is calculated and can be communicated
- Route status is tracked in real-time
- Assignment history is logged for performance analysis

#### Business Rules:
- BR-DI-020: Driver must accept assignment within 10 minutes or route is auto-unassigned
- BR-DI-021: Routes cannot be assigned if driver HOS is insufficient
- BR-DI-022: Vehicle capacity cannot be exceeded (hard limit)
- BR-DI-023: Manual assignment overrides must include justification
- BR-DI-024: Multi-stop routes are auto-optimized for shortest drive time
- BR-DI-025: Driver can reject assignment with valid reason only
- BR-DI-026: Reassigned routes maintain delivery priority and time windows

#### Related User Stories:
- US-DI-004: Dynamic Route Assignment
- US-DI-007: Load Capacity Planning

---

### UC-DI-005: Optimize and Re-Route Active Deliveries

**Use Case ID**: UC-DI-005
**Use Case Name**: Optimize and Re-Route Active Deliveries
**Actor**: Dispatcher (primary), Driver (secondary)
**Priority**: High

#### Preconditions:
- Driver is on active route with multiple stops
- Real-time traffic data is available
- Route optimization service is operational
- Driver mobile app can receive route updates

#### Trigger:
- Traffic conditions change significantly affecting route ETA
- New high-priority stop is added to existing route
- Dispatcher manually initiates route re-optimization
- Customer changes delivery time window

#### Main Success Scenario:
1. Driver Sarah Johnson is on active route with 5 delivery stops in Philadelphia
2. Real-time traffic system detects major accident on I-76 eastbound
3. System calculates traffic will delay current route by 45 minutes
4. System automatically generates re-route recommendation
5. System displays alert to dispatcher: "Traffic delay on Route #3421 - Re-route available"
6. Dispatcher clicks alert to view route comparison:
   - Original route: 5 stops, 4.2 hours, ETA 3:00 PM
   - Optimized route: 5 stops (reordered), 3.8 hours, ETA 2:40 PM
   - Savings: 24 minutes drive time, avoids I-76 accident
7. System shows side-by-side map comparison of original vs optimized route
8. System highlights:
   - Stop sequence changes: Stop 3 and Stop 4 are swapped
   - Alternative highway route uses Route 1 instead of I-76
   - All delivery time windows still met
9. Dispatcher reviews customer time window constraints - all still achievable
10. Dispatcher clicks "Send Updated Route to Driver"
11. System sends push notification to Sarah's mobile app: "New optimized route available - saves 24 min"
12. Driver taps notification to view updated route
13. Driver compares old vs new route and taps "Accept Updated Route"
14. System updates driver's navigation with new turn-by-turn directions
15. System recalculates all customer ETAs based on new route
16. Dispatcher monitors route progress with updated timeline

#### Alternative Flows:

**A1: Add Emergency Stop to Existing Route**
- 1a. If urgent pickup/delivery must be added to active route:
  - Dispatcher clicks "Add Stop" on Sarah's active route
  - Dispatcher enters new stop details: "Emergency medical supplies pickup"
  - System calculates optimal insertion point in route sequence
  - System recommends: "Insert as Stop 2 (after current stop, before Stop 2)"
  - System recalculates route: 6 stops, 4.5 hours total
  - System checks if all delivery windows still achievable
  - Dispatcher marks new stop as "High Priority"
  - System sends route update to driver with new stop highlighted
  - Driver receives notification: "URGENT: New high-priority stop added to route"

**A2: Manual Route Adjustment by Dispatcher**
- 6a. If dispatcher wants to manually adjust stop sequence:
  - Dispatcher clicks "Manual Reorder" on route
  - System displays drag-and-drop interface with current stops
  - Dispatcher drags Stop 4 to position 2 (based on local knowledge)
  - System recalculates drive time with new sequence: 4.1 hours
  - System validates all time windows still achievable
  - Dispatcher adds note: "Customer requested earlier delivery"
  - System sends updated route to driver

**A3: Customer Requests Earlier/Later Delivery**
- 1a. If customer calls to change delivery window:
  - Customer requests delivery moved from 2:00 PM to 11:00 AM
  - Dispatcher updates delivery time window in system
  - System automatically re-optimizes route to prioritize this stop
  - System moves stop to earlier in sequence
  - System validates new route meets all time windows
  - If achievable: System sends route update to driver
  - If not achievable: Dispatcher contacts customer to negotiate alternative time

**A4: Driver Suggests Route Modification**
- 1a. If driver has local knowledge of better route:
  - Driver sends message: "Construction on Main St - suggest avoiding"
  - Dispatcher opens route editor
  - Dispatcher adds waypoint to avoid Main St construction
  - System recalculates route with waypoint constraint
  - Dispatcher sends updated route to driver
  - System logs driver feedback for future route planning

#### Exception Flows:

**E1: Optimized Route Violates Time Windows**
- If re-optimization causes missed delivery windows:
  - System displays warning: "⚠ Optimized route misses delivery window for Stop 3"
  - System shows: "New ETA 2:45 PM exceeds customer window of 2:30 PM"
  - Dispatcher options:
    - Reject optimization and keep original route
    - Contact customer to extend time window
    - Remove problematic stop and reassign to different driver
  - System prevents sending route update that violates commitments

**E2: Driver Rejects Route Update**
- If driver rejects optimized route:
  - Driver taps "Reject Route Update" with reason: "Already committed to customer on current sequence"
  - System notifies dispatcher of rejection with driver's reason
  - Dispatcher decides whether to require route change or allow driver discretion
  - If allowed: Driver continues on original route
  - If required: Dispatcher calls driver to discuss and resolve

**E3: Route Optimization Service Failure**
- If optimization engine is unavailable:
  - System displays error: "Route optimization temporarily unavailable"
  - Dispatcher can view traffic conditions manually
  - Dispatcher can send text waypoint updates to driver
  - System falls back to manual route planning
  - System notifies IT of optimization service failure

**E4: All Alternative Routes Also Delayed**
- If traffic affects all possible routes:
  - System analyzes all alternatives and finds all delayed
  - System recommends: "All routes delayed - recommend 30 min delay"
  - Dispatcher options:
    - Delay entire route and notify all customers
    - Continue on least-delayed route
    - Dispatch second driver to handle some stops
  - Dispatcher makes decision and implements action plan

#### Postconditions:
- Driver has most efficient route given current conditions
- All customer delivery windows are achievable
- Customer ETAs are updated to reflect new route
- Route optimization decisions are logged for analysis
- Fuel and time savings are tracked for performance metrics

#### Business Rules:
- BR-DI-027: Route optimization cannot violate customer delivery time windows
- BR-DI-028: High-priority stops must take precedence in route sequence
- BR-DI-029: Re-optimization triggered automatically if delay exceeds 15 minutes
- BR-DI-030: Driver can suggest route modifications but dispatcher has final approval
- BR-DI-031: Manual route overrides must include justification
- BR-DI-032: Customer time window changes require immediate route recalculation
- BR-DI-033: Route optimization must consider traffic, distance, and priority

#### Related User Stories:
- US-DI-005: Route Optimization and Re-routing
- US-DI-006: Customer ETA Communication

---

### UC-DI-006: Manage Customer Delivery ETAs

**Use Case ID**: UC-DI-006
**Use Case Name**: Manage Customer Delivery ETAs
**Actor**: Dispatcher (primary), Customer (secondary)
**Priority**: Medium

#### Preconditions:
- Active delivery routes with customer destinations
- Customer contact information is on file
- Real-time vehicle location tracking is operational
- SMS/Email notification service is functional

#### Trigger:
- Customer delivery is assigned to driver and route begins
- ETA changes significantly (>15 minutes variance)
- Customer requests ETA update
- Delivery is completed

#### Main Success Scenario:
1. Driver Mike Torres begins Route #3421 with 3 customer deliveries
2. System calculates initial ETAs based on route optimization:
   - Customer A: ABC Corp - ETA 10:30 AM
   - Customer B: XYZ Inc - ETA 12:15 PM
   - Customer C: DEF Ltd - ETA 2:45 PM
3. Dispatcher views delivery dashboard showing all active deliveries with ETAs
4. System displays each delivery with status indicator:
   - Green: On-time (within 15 min of window)
   - Yellow: Potential delay (15-30 min variance)
   - Red: At risk of missing window (>30 min variance)
5. All three deliveries show green "On-time" status
6. Dispatcher enables automatic customer notifications
7. System sends automated SMS to Customer A (ABC Corp):
   - "Your delivery from Capital Tech Alliance is on schedule. Estimated arrival: 10:30 AM. Track here: [link]"
8. Customer A receives SMS and clicks tracking link
9. Customer views live map showing driver location and updated ETA
10. Driver completes delivery to Customer A at 10:28 AM (on-time)
11. System automatically sends delivery confirmation SMS to Customer A:
    - "Your delivery was completed at 10:28 AM. Signature: John Smith. Thank you!"
12. Driver continues to Customer B
13. Traffic delay occurs - system recalculates ETA for Customer B: now 12:45 PM (30 min delay)
14. System alerts dispatcher: "Customer B delivery delayed - new ETA 12:45 PM"
15. Dispatcher reviews and approves sending delay notification
16. System sends SMS to Customer B:
    - "Delivery update: Due to traffic, new arrival time is 12:45 PM (30 min delay). We apologize for the inconvenience."
17. Customer B replies via SMS: "OK, thanks for letting me know"
18. Driver arrives and completes delivery at 12:43 PM
19. System updates on-time performance metrics: 67% on-time (2/3 within window)

#### Alternative Flows:

**A1: Customer Requests ETA Update**
- 1a. If customer calls dispatch requesting ETA:
  - Customer calls: "When will my delivery arrive?"
  - Dispatcher searches for delivery by customer name "ABC Corp"
  - System displays delivery details with current ETA: 10:35 AM
  - System shows driver is currently 8 miles away (approximately 15 minutes)
  - Dispatcher communicates to customer: "Your delivery is on schedule for 10:35 AM"
  - Dispatcher offers to send SMS tracking link
  - Customer accepts and receives SMS with live tracking link

**A2: Significant Delay Requires Rescheduling**
- 13a. If delay exceeds acceptable window:
  - System recalculates ETA for Customer C: 4:15 PM (delivery window closes at 3:00 PM)
  - System alerts dispatcher: "❌ Customer C delivery will miss time window"
  - Dispatcher options:
    - Contact customer to extend time window
    - Reschedule delivery for next day
    - Reassign to different driver who can meet window
  - Dispatcher calls Customer C
  - Customer agrees to extend window to 4:30 PM
  - Dispatcher updates delivery window in system
  - System sends confirmation SMS: "Delivery rescheduled - new arrival time 4:15 PM"

**A3: Driver Arrival Notification (Proximity Alert)**
- 8a. When driver is within 10 minutes of delivery:
  - System detects driver is 2 miles from Customer B location
  - System automatically sends "driver nearby" SMS:
    - "Your delivery driver is 10 minutes away. Please ensure someone is available to receive."
  - Customer acknowledges and prepares receiving area
  - Driver arrives and delivery proceeds smoothly

**A4: Multiple Deliveries to Same Customer**
- 1a. If customer has multiple deliveries scheduled:
  - System groups deliveries by customer location
  - Dashboard shows: "Customer ABC Corp - 3 deliveries today"
  - Dispatcher can view all deliveries with separate ETAs
  - System sends consolidated notification: "You have 3 deliveries scheduled today at 10:30 AM, 2:15 PM, and 4:00 PM"

#### Exception Flows:

**E1: Customer Contact Information Missing**
- If customer has no phone/email on file:
  - System displays warning: "Cannot send ETA - no customer contact info"
  - Dispatcher must manually contact customer or skip notification
  - System logs missing contact info for data quality review
  - Dispatcher adds note: "Customer notified by phone - update contact info"

**E2: SMS/Email Delivery Failure**
- If notification fails to deliver:
  - System displays error: "SMS delivery failed - invalid phone number"
  - System logs failed delivery attempt
  - Dispatcher manually calls customer as backup
  - System flags customer record for contact info verification

**E3: ETA Calculation Unavailable**
- If real-time traffic data is unavailable:
  - System falls back to estimated drive time without traffic
  - System displays warning: "ETA estimate may be inaccurate - no traffic data"
  - Dispatcher manually adjusts ETA based on experience
  - System adds buffer time to ETA for safety margin

**E4: Customer Self-Service Portal Down**
- If tracking link fails to load:
  - Customer receives error: "Tracking temporarily unavailable"
  - System provides alternative: Call dispatch at 555-0123 for status
  - System sends SMS update when portal is restored
  - Dispatcher manually provides updates if requested

#### Postconditions:
- Customers are informed of accurate delivery ETAs
- Delays and exceptions are communicated proactively
- Delivery confirmations are sent automatically
- On-time performance metrics are tracked
- Customer satisfaction is improved through communication

#### Business Rules:
- BR-DI-034: Customers must be notified of delays >15 minutes
- BR-DI-035: ETA updates sent automatically when variance exceeds threshold
- BR-DI-036: Delivery confirmations sent within 5 minutes of completion
- BR-DI-037: Proximity alerts sent when driver is 10 minutes away
- BR-DI-038: Customer time windows cannot be changed without customer approval
- BR-DI-039: Failed notifications must have manual backup communication
- BR-DI-040: ETA accuracy tracked as KPI (target: 85% within 15 min window)

#### Related User Stories:
- US-DI-006: Customer ETA Communication

---

## Epic 3: Load Planning and Scheduling

### UC-DI-007: Plan and Assign Vehicle Loads

**Use Case ID**: UC-DI-007
**Use Case Name**: Plan and Assign Vehicle Loads
**Actor**: Dispatcher (primary), Driver (secondary)
**Priority**: Medium

#### Preconditions:
- Cargo/order data exists in system with weight and dimension specs
- Vehicle capacity specifications are accurate and current
- Vehicles are available for load assignment
- Loading dock/warehouse system integration is functional

#### Trigger:
- New cargo orders arrive requiring vehicle assignment
- Dispatcher begins daily load planning process
- Warehouse requests load plan for outbound shipments

#### Main Success Scenario:
1. Dispatcher navigates to Load Planning dashboard at 7:00 AM
2. System displays pending cargo orders requiring vehicle assignment (20 orders)
3. Dispatcher selects Cargo Order #5521:
   - Description: Industrial equipment parts
   - Weight: 4,200 lbs
   - Volume: 180 cubic feet
   - Pallet count: 6 pallets (48" x 40" each)
   - Special requirements: Fragile, climate controlled
   - Destination: Chicago, IL
   - Required delivery: Today by 5:00 PM
4. Dispatcher clicks "Assign to Vehicle"
5. System displays available vehicles filtered by requirements:
   - ✓ Climate controlled
   - ✓ Capacity ≥ 4,200 lbs
   - ✓ Can reach Chicago by 5:00 PM
6. System recommends Vehicle #342 (Refrigerated Box Truck):
   - Current status: Empty, at main depot
   - Weight capacity: 10,000 lbs (58% utilized with this load)
   - Volume capacity: 500 cubic feet (36% utilized)
   - Pallet capacity: 12 pallets (50% utilized)
   - Climate control: Yes
   - Estimated drive time to Chicago: 4.5 hours
   - ETA if dispatched now: 2:30 PM (well before 5:00 PM deadline)
7. Dispatcher assigns cargo to Vehicle #342
8. System updates vehicle load summary:
   - Current weight: 4,200 / 10,000 lbs (42%)
   - Current volume: 180 / 500 cu ft (36%)
   - Current pallets: 6 / 12 (50%)
9. Dispatcher checks for additional cargo going to Chicago area
10. System suggests Order #5522 (same destination, compatible cargo):
    - Weight: 2,800 lbs
    - Volume: 120 cubic feet
    - Pallets: 4 pallets
11. Dispatcher adds Order #5522 to same vehicle
12. System recalculates load capacity:
    - Total weight: 7,000 / 10,000 lbs (70%)
    - Total volume: 300 / 500 cu ft (60%)
    - Total pallets: 10 / 12 (83%)
    - ✓ All limits within safe operating range
13. Dispatcher assigns Driver Mike Torres to Vehicle #342
14. System generates load manifest PDF with:
    - Complete cargo list with weights and dimensions
    - Loading sequence for optimal weight distribution
    - Special handling instructions
    - Delivery addresses and sequence
15. System sends load manifest to Mike's mobile app
16. Mike reviews manifest and confirms load acceptance
17. Warehouse receives load manifest and begins loading Vehicle #342

#### Alternative Flows:

**A1: Cargo Exceeds Single Vehicle Capacity**
- 6a. If cargo cannot fit in any single vehicle:
  - System displays warning: "Cargo exceeds largest vehicle capacity"
  - System recommends: "Split into 2 loads or use third-party carrier"
  - Dispatcher options:
    - Split cargo across 2 vehicles
    - Arrange for larger rental truck
    - Subcontract to freight carrier with appropriate equipment
  - Dispatcher selects "Split Load"
  - System automatically divides cargo into 2 balanced loads
  - System assigns each load to separate vehicle

**A2: Hazmat Cargo Requirements**
- 3a. If cargo contains hazardous materials:
  - System flags cargo with HAZMAT indicator
  - System checks driver certifications - must have HAZMAT endorsement
  - System filters vehicles to only show HAZMAT-certified units
  - System applies HAZMAT routing requirements (avoid tunnels, residential areas)
  - System adds placarding requirements to load manifest
  - System generates HAZMAT shipping papers
  - System alerts dispatcher to verify safety compliance

**A3: Mixed LTL (Less Than Truckload) Consolidation**
- 9a. If multiple small shipments going to same region:
  - Dispatcher selects "Consolidate Loads" feature
  - System identifies 8 small orders all destined for Chicago area
  - System calculates total combined weight, volume, pallets
  - System verifies all cargo compatible (no hazmat conflicts, temp requirements match)
  - System creates consolidated load plan:
    - Total weight: 8,500 lbs (85% capacity)
    - Total volume: 420 cu ft (84% capacity)
    - 8 delivery stops in optimized sequence
  - System generates multi-stop route with all delivery locations
  - Single vehicle handles all 8 deliveries efficiently

**A4: Overweight Warning and Adjustment**
- 11a. If adding cargo would exceed weight limit:
  - Dispatcher attempts to add 4,000 lb cargo to vehicle already at 7,000 lbs
  - System displays error: "❌ Exceeds vehicle GVWR - Max 10,000 lbs"
  - System calculates: 7,000 + 4,000 = 11,000 lbs (110% - illegal)
  - System prevents assignment
  - Dispatcher must assign additional cargo to different vehicle

#### Exception Flows:

**E1: Vehicle Capacity Data Incorrect**
- If dispatcher discovers vehicle capacity is wrong:
  - Dispatcher reports: "Vehicle #342 actual capacity is 8,000 lbs, not 10,000"
  - System flags load plan for review
  - Dispatcher recalculates load: 7,000 / 8,000 = 87.5% (still acceptable)
  - System administrator updates vehicle specifications
  - System alerts fleet manager to verify all vehicle capacity data

**E2: Cargo Dimensions Unknown**
- If cargo weight/dimensions are missing from order:
  - System displays warning: "Missing cargo specifications - cannot validate load"
  - Dispatcher must contact warehouse or customer for specs
  - Dispatcher enters estimated specs with "Estimated" flag
  - System allows assignment but flags for verification
  - Warehouse verifies actual specs during loading
  - Driver confirms load is within safe limits before departing

**E3: No Available Vehicles Meet Requirements**
- If no vehicles can accommodate cargo:
  - System displays: "No vehicles available meeting requirements"
  - System shows limiting factors:
    - All climate-controlled vehicles currently assigned
    - Earliest availability: 3:00 PM (Vehicle #355 returns)
  - Dispatcher options:
    - Delay shipment until vehicle available
    - Rent external vehicle
    - Subcontract to third-party carrier
  - Dispatcher escalates to fleet manager for decision

**E4: Load Plan Optimization Service Unavailable**
- If load optimization engine fails:
  - System displays error: "Load optimization temporarily unavailable"
  - Dispatcher manually calculates load capacity percentages
  - System allows manual load assignment with warning
  - Dispatcher enters manual load details
  - System logs manual load plan for safety review

#### Postconditions:
- Cargo is assigned to appropriate vehicle within capacity limits
- Load manifest is generated with all required details
- Driver receives load plan and delivery instructions
- Warehouse has loading sequence for efficient loading
- Load safety compliance is verified and documented

#### Business Rules:
- BR-DI-041: Vehicle GVWR cannot be exceeded (hard stop)
- BR-DI-042: HAZMAT loads require certified driver and vehicle
- BR-DI-043: Climate-controlled cargo must be assigned to refrigerated units
- BR-DI-044: Load weight distribution must be balanced (60/40 front/rear max)
- BR-DI-045: Fragile cargo must be marked on load manifest
- BR-DI-046: Overweight loads require special permits (>80,000 lbs GVW)
- BR-DI-047: Load manifests must include emergency contact info

#### Related User Stories:
- US-DI-007: Load Capacity Planning

---

### UC-DI-008: Schedule Multi-Day Long-Haul Trips

**Use Case ID**: UC-DI-008
**Use Case Name**: Schedule Multi-Day Long-Haul Trips
**Actor**: Dispatcher (primary), Driver (secondary), Safety Officer (secondary)
**Priority**: Medium

#### Preconditions:
- Long-haul route exists requiring multi-day travel
- Driver HOS regulations and limits are configured
- Truck stop and rest area database is available
- Driver is qualified for long-haul operations

#### Trigger:
- Long-distance delivery order requires multi-day trip planning
- Customer requests cross-country shipment
- Regular scheduled long-haul route needs driver assignment

#### Main Success Scenario:
1. Dispatcher receives order for shipment from Boston, MA to Los Angeles, CA
2. System calculates total distance: 2,982 miles
3. System estimates drive time: 45 hours actual driving (excluding rest)
4. Dispatcher selects "Create Multi-Day Trip"
5. System plans trip based on HOS regulations (11-hour drive limit, 10-hour rest):
   - Day 1: Boston to Indianapolis, IN (906 miles, 13.5 hours total time)
     - Drive: 10.5 hours
     - Fuel stop: 30 min (Harrisburg, PA)
     - Meal break: 30 min
     - Rest stop: 10 hours overnight (Indianapolis truck stop)
   - Day 2: Indianapolis to Oklahoma City, OK (882 miles, 13 hours total)
     - Drive: 11 hours
     - Fuel stop: 30 min (St. Louis, MO)
     - Meal break: 30 min
     - Rest stop: 10 hours overnight (Oklahoma City)
   - Day 3: Oklahoma City to Los Angeles, CA (1,194 miles, 17.5 hours total)
     - Drive: 11 hours
     - Fuel stop: 45 min (Albuquerque, NM)
     - Meal break: 30 min
     - Arrival: Los Angeles by 2:00 PM
6. System calculates trip costs:
   - Fuel: 298 gallons @ $3.50/gal = $1,043
   - Tolls: $87
   - Lodging: 2 nights @ $85/night = $170
   - Per diem: 3 days @ $60/day = $180
   - Total estimated cost: $1,480
7. System recommends truck stops for overnight rest:
   - Night 1: TA Travel Center, Indianapolis (secure parking, amenities)
   - Night 2: Love's Truck Stop, Oklahoma City (fuel discount program)
8. Dispatcher assigns Driver Tom Rodriguez (experienced long-haul driver)
9. System sends complete trip plan to Tom's mobile app:
   - Turn-by-turn navigation with all waypoints
   - Scheduled rest stops and overnight locations
   - Fuel stop recommendations
   - Customer contact info and delivery instructions
   - Emergency contacts and roadside assistance numbers
10. Tom reviews trip plan and accepts assignment
11. System tracks trip progress in real-time
12. Tom completes Day 1 and checks in at Indianapolis rest stop at 8:45 PM
13. System logs rest period start time
14. System alerts Tom next morning at 6:45 AM: "10-hour rest complete - safe to resume driving"
15. Tom completes trip and delivers in Los Angeles on Day 3 at 1:30 PM (ahead of schedule)
16. System records actual vs planned performance for future trip optimization

#### Alternative Flows:

**A1: Team Driver Assignment (Continuous Operation)**
- 8a. If customer requires faster delivery with team drivers:
  - Dispatcher assigns two drivers: Tom Rodriguez and Sarah Chen
  - System plans trip with drivers alternating:
    - Tom drives first 11 hours while Sarah rests (sleeper berth)
    - Sarah drives next 11 hours while Tom rests
    - Continuous operation reduces trip from 3 days to 1.5 days
  - System calculates increased cost: 2 driver salaries but faster delivery
  - System monitors HOS for both drivers independently
  - Trip completes in 40 hours total time vs 72 hours

**A2: Weather Delay Requires Trip Replanning**
- 12a. If severe weather affects planned route:
  - System detects winter storm warning on I-70 through Kansas
  - System alerts dispatcher: "Weather delay - recommend alternate route"
  - Dispatcher reviews alternate route via I-40 (southern route)
  - Alternate route adds 120 miles but avoids storm
  - System recalculates: Day 2 extended by 2 hours
  - System adjusts Day 3 schedule and updates driver ETA
  - Dispatcher approves route change
  - System sends updated route to Tom's navigation

**A3: Driver Requests Additional Rest Stop**
- 12a. If driver needs unscheduled rest:
  - Tom sends message: "Need to stop earlier - fatigued"
  - Tom has driven 8 hours (3 hours remaining on 11-hour limit)
  - Dispatcher approves early rest stop
  - System finds nearest truck stop: 25 miles ahead
  - System recalculates Day 1 completion: 812 miles instead of 906
  - System adjusts Day 2 to compensate: adds 94 miles
  - Safety takes priority over schedule

**A4: Save Trip Template for Recurring Routes**
- 16a. If this is a regular recurring route:
  - Dispatcher selects "Save as Template"
  - System saves: "Boston to LA - 3-day trip template"
  - Template includes:
    - Optimized stop sequence
    - Recommended fuel stops
    - Preferred overnight locations
    - Historical average costs
  - Future trips use template as starting point
  - Dispatcher only adjusts for specific variations

#### Exception Flows:

**E1: Driver Exceeds HOS During Trip**
- If driver approaches HOS violation:
  - System monitors Tom's drive time in real-time
  - At 10 hours 45 minutes of driving, system alerts Tom: "15 min drive time remaining"
  - At 11 hours, system alerts Tom: "⚠ HOS limit reached - must stop within 5 minutes"
  - If Tom does not stop, system alerts dispatcher and safety officer
  - System logs potential HOS violation for investigation
  - Dispatcher contacts Tom to verify compliance

**E2: Vehicle Breakdown During Long-Haul Trip**
- If vehicle breaks down mid-trip:
  - Tom reports: "Engine warning light - vehicle losing power"
  - Tom is currently in St. Louis, MO (Day 2, 500 miles remaining)
  - Dispatcher coordinates roadside assistance and towing
  - Dispatcher arranges replacement vehicle or transfer to another truck
  - If cargo can be transferred: Send nearby driver to meet and transfer load
  - If not: Arrange tow to nearest repair facility and delay delivery
  - System notifies customer of delay with new ETA
  - Dispatcher logs breakdown and updates trip status

**E3: No Available Overnight Parking**
- If recommended truck stop is full:
  - Tom arrives at Indianapolis truck stop - lot full, no parking available
  - Tom contacts dispatcher for alternate location
  - System searches for nearby truck stops with availability
  - System finds alternate: 15 miles further (Pilot Travel Center)
  - Dispatcher approves alternate location
  - Tom drives 15 additional miles (still within HOS limits)
  - System updates overnight location in trip plan

**E4: Trip Cost Significantly Exceeds Estimate**
- If actual costs exceed budget:
  - Fuel prices increase $1.00/gallon during trip
  - Actual fuel cost: $1,341 vs estimated $1,043 (28% over)
  - System alerts dispatcher to cost overrun
  - Dispatcher documents price variance
  - System updates future trip cost estimates
  - Fleet manager reviews whether to adjust customer billing

#### Postconditions:
- Multi-day trip is planned with HOS-compliant rest schedules
- Driver has complete trip plan with all stops and waypoints
- Trip costs are estimated and tracked
- Trip progress is monitored in real-time
- HOS compliance is verified throughout trip
- Actual performance data improves future trip planning

#### Business Rules:
- BR-DI-048: Trips must comply with 11-hour drive limit and 10-hour rest requirement
- BR-DI-049: Overnight rest stops must be at secure, approved truck stops
- BR-DI-050: Trip plans cannot exceed 70 hours on-duty in 8-day period
- BR-DI-051: Drivers must take 30-minute break after 8 hours of driving
- BR-DI-052: Weather delays require route replanning and customer notification
- BR-DI-053: Team driver operations require both drivers to have sleeper berth certification
- BR-DI-054: Trip costs must be tracked and compared to estimates for accuracy improvement

#### Related User Stories:
- US-DI-008: Multi-Day Trip Planning

---

## Epic 4: Emergency Response Coordination

### UC-DI-009: Coordinate Emergency Response for Vehicle Incident

**Use Case ID**: UC-DI-009
**Use Case Name**: Coordinate Emergency Response for Vehicle Incident
**Actor**: Dispatcher (primary), Driver (secondary), Safety Officer (secondary), Emergency Services (external)
**Priority**: High

#### Preconditions:
- Vehicle is equipped with emergency/panic button
- Emergency alert system is operational
- Emergency contact database is current
- Roadside assistance provider integration is functional
- Dispatcher has authorization to contact emergency services

#### Trigger:
- Driver activates emergency/panic button in vehicle
- Severe vehicle fault detected (airbag deployment, rollover sensor)
- Driver reports emergency via mobile app or radio
- Third-party reports incident involving fleet vehicle

#### Main Success Scenario:
1. Driver John Smith activates emergency panic button in Vehicle #455
2. Vehicle telematics system immediately sends emergency alert to dispatch
3. Dispatcher workstation triggers critical audio alarm (continuous siren)
4. Emergency alert popup displays on dispatcher screen with red flashing border:
   - 🚨 CRITICAL EMERGENCY - Vehicle #455
   - Driver: John Smith (CDL: MA-1234567)
   - Location: I-95 North, Mile Marker 47, Springfield, MA
   - GPS Coordinates: 42.1015° N, 72.5898° W
   - Time: 2:47 PM
   - Vehicle Status: Stopped, emergency flashers active
   - Nearest Emergency: Springfield Fire Dept (3.2 mi), Memorial Hospital (4.1 mi)
5. Dispatcher acknowledges alert within 15 seconds (stops alarm)
6. Dispatcher immediately attempts to contact John via hands-free call
7. John answers: "I've been in an accident - rear-ended at traffic light - I'm okay but shaken up"
8. Dispatcher assesses situation:
   - Driver status: Conscious, alert, no injuries reported
   - Vehicle status: Rear damage, not drivable
   - Other parties: One other vehicle involved
   - Road conditions: Vehicle blocking right lane of I-95
9. Dispatcher initiates emergency response protocol:
   - **Action 1**: Contact local police for traffic control and accident report
     - Dispatcher calls 911: "Commercial vehicle accident on I-95 North MM 47"
     - Police dispatched, ETA 8 minutes
   - **Action 2**: Notify safety officer of incident
     - System auto-sends emergency alert to Safety Officer Mike Davis
     - Mike acknowledges and begins incident investigation workflow
   - **Action 3**: Request tow service
     - Dispatcher requests tow via roadside assistance integration
     - Tow truck dispatched, ETA 25 minutes
   - **Action 4**: Arrange replacement vehicle if cargo salvageable
     - Dispatcher checks cargo status: 10 pallets, undamaged
     - Nearest available vehicle: #512 at depot (35 minutes away)
10. Dispatcher updates John with response plan:
    - "Police ETA 8 minutes, tow truck 25 minutes, replacement vehicle 35 minutes"
    - "Stay in vehicle if safe, turn on flashers, set out triangles if you can safely exit"
11. Dispatcher creates incident record in system:
    - Incident ID: INC-2025-0847
    - Type: Rear-end collision
    - Driver statement: "Stopped at red light, struck from behind by passenger car"
    - Response actions logged with timestamps
12. Dispatcher monitors situation in real-time:
    - Police arrive at 2:55 PM (8 min response time)
    - Tow truck arrives at 3:12 PM (25 min)
    - Replacement driver Sarah Chen arrives at 3:22 PM
13. Cargo transferred from Vehicle #455 to Vehicle #512
14. Sarah continues delivery route with 45-minute delay
15. Dispatcher sends customer delay notifications with new ETAs
16. John is transported to depot for drug/alcohol testing (post-accident protocol)
17. Dispatcher updates incident record to "Resolved" at 4:15 PM
18. Safety officer receives complete incident documentation for investigation
19. System generates incident timeline report for insurance claim

#### Alternative Flows:

**A1: Driver Injured - Medical Emergency**
- 7a. If driver reports injury or does not respond:
  - Dispatcher calls driver - no answer (2 attempts)
  - Dispatcher immediately calls 911 for ambulance dispatch
  - Dispatcher provides exact GPS coordinates to 911 operator
  - Dispatcher notifies driver's emergency contact (family)
  - Dispatcher sends supervisor to incident scene
  - Ambulance arrives and transports driver to hospital
  - Dispatcher coordinates with hospital to verify driver status
  - Safety officer initiates injury investigation and OSHA reporting

**A2: Hazmat Cargo Involved in Incident**
- 8a. If vehicle is carrying hazardous materials:
  - System detects HAZMAT flag on Vehicle #455 cargo
  - System displays HAZMAT placard info and material safety data sheets
  - Dispatcher alerts 911 of hazmat situation: "Placard 1203 - Gasoline"
  - Dispatcher provides SDS and emergency response guide to first responders
  - HAZMAT team is dispatched
  - Dispatcher establishes evacuation perimeter per DOT guidelines
  - Environmental contractor contacted for cleanup
  - State environmental agency notified per regulations

**A3: Multi-Vehicle Pileup / Mass Casualty**
- 1a. If incident involves multiple vehicles with injuries:
  - Driver reports: "Major pileup - multiple vehicles - people injured"
  - Dispatcher immediately calls 911 with mass casualty alert
  - Dispatcher requests multiple ambulances and fire response
  - Dispatcher contacts fleet manager and safety director
  - Dispatcher monitors emergency radio scanner for updates
  - Incident command system established at scene
  - Dispatcher coordinates with on-scene commander
  - All company resources mobilized to support response

**A4: Vehicle Fire Emergency**
- 1a. If emergency involves vehicle fire:
  - Driver activates emergency button and reports: "Smoke in cab - pulling over"
  - Dispatcher instructs: "Exit vehicle immediately, move to safe distance"
  - Dispatcher calls 911: "Vehicle fire, I-95 North MM 47, commercial truck"
  - Fire department dispatched
  - Dispatcher ensures driver is at safe distance (100+ feet)
  - If HAZMAT cargo: Dispatcher provides material info to fire department
  - Dispatcher monitors until fire is extinguished
  - Total loss expected - cargo and vehicle insurance claims initiated

#### Exception Flows:

**E1: Emergency Services Not Available**
- If 911 call fails or services unavailable:
  - Dispatcher attempts alternate emergency numbers
  - Dispatcher contacts local police non-emergency line
  - Dispatcher contacts state highway patrol
  - Dispatcher sends nearby company vehicle to assist
  - Dispatcher escalates to fleet manager and safety officer
  - All actions logged with explanation of delay

**E2: GPS Location Inaccurate or Unavailable**
- If GPS coordinates are missing or wrong:
  - Dispatcher asks driver for location description
  - Driver provides: "I-95 North, just past Exit 7, near blue water tower"
  - Dispatcher uses landmarks to triangulate location
  - Dispatcher provides best-known location to emergency services
  - Emergency services use cell tower triangulation as backup
  - Dispatcher stays on phone with driver to guide responders

**E3: Roadside Assistance Unavailable**
- If tow provider cannot respond in reasonable time:
  - Primary provider: "No trucks available - 3 hour wait"
  - Dispatcher contacts backup tow providers (list of 5 approved vendors)
  - Secondary provider confirms 45-minute ETA
  - Dispatcher authorizes higher cost for faster response
  - Driver is kept informed of revised timeline

**E4: False Alarm / Accidental Activation**
- If driver reports panic button was accidental:
  - Driver answers immediately: "False alarm - hit button by accident - all is fine"
  - Dispatcher verifies: "Are you sure everything is okay? Say 'yes' if safe, 'no' if in danger"
  - Driver confirms: "Yes, everything fine, normal delivery in progress"
  - Dispatcher logs incident as false alarm with driver confirmation
  - Safety officer reviews false alarm rate - may retrain driver if excessive
  - Alert remains in system for audit purposes

#### Postconditions:
- Driver safety is verified and documented
- Emergency services responded and incident stabilized
- Vehicle is recovered or secured
- Cargo is protected or transferred to continue delivery
- Complete incident documentation created for investigation
- Insurance claim process initiated
- Customer notifications sent regarding any delivery delays
- Post-accident drug/alcohol testing completed per DOT regulations

#### Business Rules:
- BR-DI-055: Emergency alerts must be acknowledged within 60 seconds or auto-escalate
- BR-DI-056: Driver safety is highest priority - cargo and schedule are secondary
- BR-DI-057: All emergency incidents require 911 contact if injuries or road hazards
- BR-DI-058: Post-accident drug/alcohol testing required for all accidents per DOT
- BR-DI-059: HAZMAT incidents require immediate notification to state environmental agency
- BR-DI-060: Emergency incident timeline must be documented to the minute
- BR-DI-061: Driver emergency contacts must be notified of any injury within 30 minutes

#### Related User Stories:
- US-DI-009: Emergency Response Management
- US-DI-002: Vehicle Status Alerts and Notifications

---

### UC-DI-010: Coordinate Vehicle Breakdown and Towing

**Use Case ID**: UC-DI-010
**Use Case Name**: Coordinate Vehicle Breakdown and Towing
**Actor**: Dispatcher (primary), Driver (secondary), Maintenance Technician (secondary)
**Priority**: Medium

#### Preconditions:
- Vehicle experiences mechanical failure requiring roadside assistance
- Driver is in communication with dispatch
- Roadside assistance provider integration is available
- Repair facility network database is current

#### Trigger:
- Driver reports vehicle breakdown or mechanical issue
- Vehicle diagnostic system triggers critical fault alert
- Vehicle becomes disabled and cannot continue route

#### Main Success Scenario:
1. Driver Sarah Chen reports via mobile app: "Check engine light on, losing power, pulling over"
2. System creates breakdown incident: BRK-2025-0324
3. Dispatcher receives breakdown alert with vehicle diagnostics:
   - Vehicle #287 (2022 Freightliner Cascadia)
   - Location: Route 22 West, Mile Marker 15, Pennsylvania
   - Fault codes: P0087 (Fuel Rail Pressure Too Low), P0190 (Fuel Rail Pressure Sensor)
   - Last known speed: 45 mph → 20 mph (decreasing)
4. Dispatcher contacts Sarah: "What's happening with the vehicle?"
5. Sarah reports: "Engine sputtering, losing power, strong fuel smell"
6. Dispatcher instructs: "Pull over safely, turn off engine, stay clear of vehicle if fuel leak"
7. Sarah confirms vehicle stopped safely on shoulder, engine off, she is in safe location
8. Dispatcher assesses situation:
   - Diagnosis: Likely fuel system failure (fuel leak or pump failure)
   - Driveable: No - unsafe to continue
   - Cargo: 12 pallets of electronics (high value, time-sensitive)
   - Route progress: 3 of 5 deliveries completed
9. Dispatcher initiates breakdown response protocol:
   - **Action 1**: Request roadside diagnostic
     - Dispatcher contacts roadside assistance: "Possible fuel leak, needs assessment"
     - Technician dispatched, ETA 35 minutes
   - **Action 2**: Identify repair facility
     - System searches for nearest authorized Freightliner dealer
     - Best option: "Keystone Truck Center" - 22 miles away, full service bay available
   - **Action 3**: Request tow service
     - Dispatcher requests flatbed tow truck (fuel leak requires flatbed, not hook)
     - Tow truck dispatched, ETA 45 minutes
     - Destination: Keystone Truck Center
     - Estimated tow cost: $385
   - **Action 4**: Arrange cargo transfer and route reassignment
     - Nearest available vehicle: #412 at Harrisburg depot (28 miles away)
     - Driver Mike Torres available for route takeover
     - Dispatcher assigns Mike to complete Sarah's remaining 2 deliveries
10. Roadside technician arrives at 35 minutes, assesses issue:
    - Diagnosis confirmed: Fuel line rupture, active leak
    - Repair estimate: $850 parts + labor, 4-6 hours repair time
    - Technician makes safe for towing (fuel line clamped, leak stopped)
11. Tow truck arrives at 48 minutes
12. Vehicle #287 towed to Keystone Truck Center, arrival 10:15 AM
13. Mike Torres arrives with Vehicle #412 at 10:40 AM
14. Sarah and Mike transfer cargo from Vehicle #287 to #412 (30 minutes)
15. Mike departs to complete remaining deliveries at 11:10 AM
16. Dispatcher updates customer ETAs - 2 hour delay
17. Dispatcher creates work order for Vehicle #287 repair
18. Dispatcher updates Sarah's assignment - transport back to depot with Mike after deliveries
19. Repair completed at 2:30 PM - Vehicle #287 released and driven back to depot
20. Total breakdown resolution time: 4.5 hours

#### Alternative Flows:

**A1: Breakdown in Remote Area (Limited Services)**
- 2a. If breakdown occurs in rural area far from repair facilities:
  - Location: Rural Montana, 90 miles from nearest truck service
  - Dispatcher contacts mobile mechanic services
  - If parts unavailable locally:
    - Dispatcher arranges emergency parts delivery (overnight shipping)
    - Driver arranges overnight lodging
    - Cargo transferred to another truck if time-sensitive
  - Extended repair time: 1-2 days for parts and repair
  - Dispatcher manages customer expectations and delay notifications

**A2: Tire Blowout Requiring Immediate Assistance**
- 1a. If breakdown is tire-related:
  - Driver reports: "Tire blowout, right rear outside tire"
  - Dispatcher determines: Driveable slowly to safe parking area
  - Dispatcher requests mobile tire service instead of tow
  - Tire service arrives with replacement tire
  - Repair completed on-site in 45 minutes
  - Driver continues route with minimal delay (1 hour total)
  - Lower cost solution: $275 vs $850+ for tow and repair

**A3: Breakdown Vehicle Blocking Traffic - Emergency Priority**
- 7a. If vehicle cannot move off roadway safely:
  - Vehicle stalled in middle lane of busy highway
  - Dispatcher contacts state police for traffic control
  - Police arrive and establish safety perimeter
  - Dispatcher requests emergency priority tow service
  - Tow truck bypasses other calls, arrives in 15 minutes
  - Vehicle cleared from roadway quickly to restore traffic flow
  - Higher priority service incurs surcharge: $450 vs $385

**A4: Cargo Must Arrive Today - Extreme Time Pressure**
- 9a. If cargo is critical and cannot be delayed:
  - Customer requires delivery today by 5:00 PM (4 hours remaining)
  - Transfer to replacement truck would take 3 hours (too long)
  - Dispatcher arranges alternate solution:
    - Hire local courier service with appropriate vehicle
    - Transfer cargo to courier at breakdown location
    - Courier completes delivery on time
    - Higher cost but maintains customer commitment
  - Original vehicle still towed for repair as normal

#### Exception Flows:

**E1: No Tow Trucks Available**
- If all tow providers are busy:
  - Primary provider: "All trucks on other calls - 4 hour wait"
  - Dispatcher contacts all approved backup providers
  - All providers report extended delays
  - Dispatcher options:
    - Approve non-contracted tow provider (higher cost, no guarantee)
    - Wait for next available slot
    - Attempt field repair with mobile mechanic
  - Dispatcher escalates to fleet manager for decision
  - Fleet manager approves non-contracted provider to minimize delay

**E2: Repair Facility Cannot Accept Vehicle**
- If recommended repair shop is closed or full:
  - Keystone Truck Center: "We're fully booked - cannot accept until tomorrow"
  - Dispatcher searches for alternate authorized dealer
  - Next option: 45 miles further away
  - Dispatcher options:
    - Use farther facility (higher tow cost)
    - Use non-dealer repair shop (may void warranty)
    - Park vehicle at breakdown location overnight, repair next day
  - Dispatcher selects based on urgency and cost

**E3: Breakdown Costs Exceed Budget Authority**
- If repair estimate is very high:
  - Repair shop provides estimate: "$4,200 for transmission replacement"
  - Estimate exceeds dispatcher authority limit ($2,000)
  - Dispatcher must escalate to fleet manager for approval
  - Fleet manager reviews options:
    - Approve repair
    - Tow vehicle to company shop for lower-cost repair
    - Evaluate if vehicle should be totaled/replaced
  - Decision impacts timeline and requires customer notification

**E4: Driver Cannot Wait with Vehicle**
- If driver must leave vehicle location:
  - Driver Sarah has HOS limit approaching (30 minutes remaining)
  - Tow truck ETA is 45 minutes (Sarah will violate HOS if she waits)
  - Dispatcher arranges driver pickup:
    - Uber/taxi to transport Sarah to hotel for required 10-hour rest
    - Dispatcher coordinates with tow driver to secure vehicle
    - Tow proceeds without driver present
    - Vehicle keys left with tow driver or shop
  - Sarah resumes duty after rest period

#### Postconditions:
- Vehicle is safely towed to appropriate repair facility
- Cargo is protected and deliveries completed (or rescheduled)
- Driver is safely relocated and assigned new duties or rest
- Breakdown costs are tracked and linked to vehicle maintenance record
- Customers are notified of any delivery delays
- Work order created for vehicle repair
- Breakdown trends analyzed to identify problem vehicles

#### Business Rules:
- BR-DI-062: Driver safety takes priority over cargo protection
- BR-DI-063: Fuel leaks require flatbed tow, not hook/chain tow
- BR-DI-064: High-value cargo requires secure transfer with signature documentation
- BR-DI-065: Breakdown costs >$2,000 require fleet manager approval
- BR-DI-066: Vehicles must be towed to authorized repair facilities when under warranty
- BR-DI-067: Breakdown incidents must be logged with fault codes for trend analysis
- BR-DI-068: Customer notification required for delays >1 hour

#### Related User Stories:
- US-DI-010: Breakdown and Tow Coordination

---

## Epic 5: Performance Monitoring and Reporting

### UC-DI-011: Monitor Real-Time Dispatch Performance Metrics

**Use Case ID**: UC-DI-011
**Use Case Name**: Monitor Real-Time Dispatch Performance Metrics
**Actor**: Dispatcher (primary), Fleet Manager (secondary)
**Priority**: Medium

#### Preconditions:
- Dispatcher is logged into dispatch console
- Active fleet operations are underway
- Performance metrics calculation engine is operational
- Historical baseline data exists for comparison

#### Trigger:
- Dispatcher opens performance dashboard at start of shift
- Automated dashboard refresh every 5 minutes
- Dispatcher checks metrics during operational decision-making

#### Main Success Scenario:
1. Dispatcher Sarah opens Dispatch Performance Dashboard at 8:00 AM
2. System displays real-time key performance indicators (KPIs):

   **Fleet Activity Metrics**:
   - Active Vehicles: 42 / 50 (84% utilization)
   - Idle Vehicles: 5 / 50 (10%)
   - Maintenance/Unavailable: 3 / 50 (6%)
   - Goal: 85% utilization ✓ On target

   **Today's Delivery Performance**:
   - Scheduled Deliveries: 87
   - Completed: 23 (26%)
   - In Progress: 42 (48%)
   - Pending Assignment: 22 (25%)
   - On-Time Delivery Rate: 91% (21/23 completed)
   - Goal: 90% ✓ Exceeding target

   **Response Time Metrics**:
   - Avg Route Assignment Time: 4.2 minutes (from job creation to driver acceptance)
   - Goal: <5 minutes ✓ On target
   - Avg Emergency Response Time: 47 seconds
   - Goal: <60 seconds ✓ On target

   **Driver Productivity**:
   - Avg Deliveries per Driver: 2.1 today (tracking for 4.5 target by EOD)
   - Avg Drive Time per Delivery: 38 minutes
   - Avg Idle Time: 12 minutes per stop

   **Customer Satisfaction**:
   - ETA Accuracy: 87% (within 15-minute window)
   - Goal: 85% ✓ Exceeding target
   - Customer Complaints Today: 1
   - Goal: <3 per day ✓ On target

3. Dispatcher reviews trend charts showing performance over last 4 hours:
   - On-time delivery rate trending upward (started at 85%, now at 91%)
   - Vehicle utilization steady at 84%
   - No significant issues detected
4. Dispatcher notices "ETA Accuracy" metric is slightly below yesterday (87% vs 92%)
5. Dispatcher drills down into ETA accuracy details
6. System shows breakdown by cause:
   - Traffic delays: 6 deliveries (8% late)
   - Driver delays: 2 deliveries (3% late)
   - Route optimization issues: 1 delivery (1% late)
7. Dispatcher identifies Route #3421 had significant traffic delay (35 minutes late)
8. Dispatcher reviews if re-routing could have prevented delay
9. Dashboard shows comparison to previous shift and previous week:
   - Previous shift (last night): 88% on-time (current shift performing better)
   - Same day last week: 89% on-time (current shift comparable)
10. Dispatcher sees alert: "⚠ Avg idle time increasing - now 15 min (was 12 min)"
11. Dispatcher investigates - identifies 3 drivers with idle time >20 minutes
12. Dispatcher contacts drivers to understand reason and reduce idle time
13. Dashboard updates in real-time as new deliveries complete
14. At 12:00 PM, dispatcher reviews midday performance:
    - 52 deliveries completed (60% of daily target)
    - On-time rate: 90% (47/52)
    - On pace to meet daily goals
15. Dispatcher exports dashboard snapshot for end-of-shift report

#### Alternative Flows:

**A1: Performance Metric Falls Below Acceptable Threshold**
- 10a. If critical metric drops below goal:
  - On-time delivery rate drops to 82% (below 90% goal)
  - Dashboard displays red warning indicator
  - System triggers alert notification to dispatcher
  - Dispatcher reviews recent late deliveries to identify pattern
  - Common cause: Traffic on I-95 corridor affecting 5 routes
  - Dispatcher takes corrective action:
    - Re-route active drivers away from I-95
    - Notify customers of affected deliveries
    - Adjust future route assignments to avoid congestion
  - Dispatcher monitors metric recovery

**A2: Customize Dashboard for Specific Priorities**
- 1a. If dispatcher wants to focus on specific metrics:
  - Dispatcher clicks "Customize Dashboard"
  - Dispatcher selects priority metrics to display:
    - Emergency response time (primary focus)
    - Geofence violations
    - HOS compliance rate
  - Dispatcher moves less critical metrics to secondary view
  - Dashboard rearranges to show priority metrics prominently
  - Customization saved to dispatcher profile

**A3: Compare Performance Across Multiple Dispatchers**
- 9a. If dispatcher supervisor wants to compare dispatcher performance:
  - Supervisor views team performance dashboard
  - System shows metrics by dispatcher:
    - Sarah: 91% on-time, 4.2 min assignment time
    - Mike: 88% on-time, 5.8 min assignment time
    - Tom: 94% on-time, 3.5 min assignment time (top performer)
  - Supervisor identifies Tom's best practices for team training
  - Supervisor provides coaching to Mike on route assignment efficiency

**A4: End-of-Shift Performance Summary**
- 15a. At end of shift (5:00 PM):
  - Dispatcher clicks "Generate Shift Summary Report"
  - System compiles complete shift performance:
    - Total deliveries: 87 (100% of scheduled)
    - On-time rate: 91% (79/87) ✓ Exceeded goal
    - Avg assignment time: 4.2 min ✓ Met goal
    - Emergencies handled: 2 (avg response time: 52 seconds)
    - Vehicle utilization: 84% ✓ Met goal
  - System highlights achievements and areas for improvement
  - Report exported as PDF and emailed to dispatcher and supervisor
  - Report archived for historical trend analysis

#### Exception Flows:

**E1: Real-Time Data Feed Interrupted**
- If data stream fails:
  - Dashboard displays warning: "⚠ Real-time data delayed - last update 8 minutes ago"
  - System falls back to cached data with timestamp
  - Dispatcher manually refreshes data
  - System retries data connection every 60 seconds
  - When connection restored: Dashboard displays "✓ Real-time data restored"
  - No data loss during outage

**E2: Performance Metric Calculation Error**
- If metric displays obviously incorrect value:
  - On-time rate shows 150% (impossible - max is 100%)
  - Dispatcher reports error to system administrator
  - System administrator investigates calculation error
  - Faulty data point excluded from metric calculation
  - Correct value recalculated and displayed: 91%
  - System logs error for developer debugging

**E3: Historical Comparison Data Unavailable**
- If baseline data is missing:
  - System cannot display "Previous week" comparison
  - Dashboard shows message: "Historical data not available"
  - Dispatcher uses current shift data only
  - System administrator investigates missing data
  - Data restored from backup if possible

**E4: Dashboard Performance Degradation**
- If dashboard loads slowly or times out:
  - Dashboard takes >30 seconds to load (normally <3 seconds)
  - Dispatcher experiences lag when clicking metrics
  - System displays "Performance degraded - optimizing"
  - System reduces update frequency from 5 minutes to 10 minutes
  - Dispatcher can still access critical metrics
  - IT team investigates server load and optimizes query performance

#### Postconditions:
- Dispatcher has current visibility into operational performance
- Performance issues are identified and addressed proactively
- Metrics trends inform decision-making
- Shift performance is documented for management review
- Areas for improvement are identified for future optimization

#### Business Rules:
- BR-DI-069: Dashboard must update at least every 5 minutes during active operations
- BR-DI-070: Performance alerts triggered when metrics drop >10% below goals
- BR-DI-071: On-time delivery target is 90% within 15-minute delivery window
- BR-DI-072: Emergency response time must be <60 seconds (alert acknowledgment)
- BR-DI-073: Vehicle utilization target is 85% during business hours
- BR-DI-074: Shift summary reports generated automatically at end of each shift
- BR-DI-075: Performance metrics retained for 2 years for trend analysis

#### Related User Stories:
- US-DI-011: Dispatch Performance Dashboard

---

### UC-DI-012: Monitor and Evaluate Driver Performance

**Use Case ID**: UC-DI-012
**Use Case Name**: Monitor and Evaluate Driver Performance
**Actor**: Dispatcher (primary), Safety Officer (secondary), Fleet Manager (secondary)
**Priority**: Medium

#### Preconditions:
- Drivers are actively operating vehicles with telematics
- Driver performance data is being collected and calculated
- Driver HOS and behavior data is current
- Performance scoring algorithm is configured

#### Trigger:
- Dispatcher reviews driver assignments for upcoming routes
- Driver performance issues are observed
- Weekly driver performance review process
- Fleet manager requests driver performance report

#### Main Success Scenario:
1. Dispatcher needs to assign high-value time-sensitive delivery requiring top performer
2. Dispatcher opens Driver Performance dashboard
3. System displays all active drivers with performance scorecards:

   **Driver: Mike Torres**
   - Overall Performance Score: 94/100 (Excellent)
   - Current Status: Available
   - Location: Main depot
   - HOS Remaining: 10.5 hours

   **Performance Metrics (Last 30 Days)**:
   - On-Time Delivery Rate: 96% (48/50 deliveries)
   - Completed Deliveries: 50 assigned, 50 completed (100%)
   - Safety Score: 92/100
     - Hard braking events: 2 (low)
     - Speeding incidents: 1 (low)
     - Harsh acceleration: 0 (excellent)
   - Customer Satisfaction: 4.8/5.0 (8 ratings)
   - HOS Compliance Rate: 100% (no violations)
   - Avg Delivery Time vs Estimated: -5 minutes (consistently early)
   - Vehicle Inspection Compliance: 100% (30/30 inspections completed)

4. Dispatcher compares to other available drivers:

   **Driver: Tom Rodriguez**
   - Overall Performance Score: 78/100 (Good)
   - On-Time Rate: 84%
   - Safety Score: 75/100 (6 hard braking events)
   - Customer Rating: 4.2/5.0

   **Driver: Sarah Chen**
   - Overall Performance Score: 88/100 (Very Good)
   - On-Time Rate: 90%
   - Safety Score: 85/100
   - Customer Rating: 4.6/5.0

5. Dispatcher selects Mike Torres for high-priority route based on top performance
6. Dispatcher clicks on Tom Rodriguez to investigate lower safety score
7. System displays detailed driving behavior events:
   - Hard braking: 6 events in last 30 days (trend: decreasing)
   - Speeding: 3 events >10 mph over limit
   - Pattern: Most events occur in afternoon (fatigue factor?)
8. Dispatcher adds note to Tom's record: "Safety score trending down - recommend refresher training"
9. System flags Tom for safety officer review
10. Dispatcher checks driver availability for tomorrow's routes
11. System shows HOS status for all drivers:
    - Mike Torres: 11 hours available (full day)
    - Tom Rodriguez: 5.5 hours available (half day only - approaching 70-hour limit)
    - Sarah Chen: 11 hours available (full day)
12. Dispatcher uses this info to plan route assignments
13. System recommends: "Tom Rodriguez requires 34-hour restart this weekend"
14. Dispatcher schedules Tom off-duty for 34-hour HOS reset
15. Dispatcher exports driver performance summary for weekly fleet manager meeting

#### Alternative Flows:

**A1: Driver Performance Below Acceptable Standards**
- 6a. If driver has consistently poor performance:
  - Driver John Davis: Overall Score 62/100 (Needs Improvement)
  - On-Time Rate: 72% (below 80% minimum)
  - Safety Score: 58/100 (multiple harsh driving events)
  - Customer Rating: 3.8/5.0 (below 4.0 target)
  - HOS Violations: 2 in last 30 days
  - Dispatcher escalates to fleet manager and safety officer
  - System recommends:
    - Immediate safety retraining
    - Supervised ride-along with senior driver
    - Performance improvement plan (PIP)
  - Dispatcher restricts John to low-priority local routes until improvement shown
  - Performance monitored weekly for 30 days

**A2: Recognize and Reward Top Performer**
- 5a. If dispatcher wants to recognize excellent performance:
  - Mike Torres: Consistent 94+ score for 3 months
  - Zero safety incidents, 96% on-time rate, excellent customer feedback
  - Dispatcher nominates Mike for "Driver of the Month"
  - Dispatcher adds commendation to Mike's record: "Exceptional performance - assigned high-value routes consistently"
  - Fleet manager approves $200 performance bonus
  - Mike's profile flagged as "Preferred Driver for Priority Routes"

**A3: Driver Requests Performance Feedback**
- 1a. If driver wants to understand their performance:
  - Driver Sarah Chen asks: "How am I doing this month?"
  - Dispatcher opens Sarah's performance scorecard
  - Dispatcher shares positive feedback:
    - "You're at 88/100 overall - very good performance"
    - "90% on-time rate, excellent safety score"
    - "Customers rate you 4.6/5.0 - great feedback"
  - Dispatcher provides improvement suggestions:
    - "Work on reducing idle time - avg 18 min vs 12 min goal"
    - "Continue excellent work on inspections and HOS compliance"
  - Sarah appreciates transparent feedback and commits to improvement

**A4: Analyze Team Performance Trends**
- 1a. If dispatcher wants to view overall team trends:
  - Dispatcher clicks "Team Performance View"
  - System displays aggregate metrics for all drivers:
    - Team Avg On-Time Rate: 87% (goal: 85%) ✓
    - Team Avg Safety Score: 82/100 (goal: 80+) ✓
    - Team Customer Rating: 4.4/5.0
    - HOS Compliance Rate: 94% (6% with violations - needs improvement)
  - Dispatcher identifies: HOS violations are trending up
  - Dispatcher recommends to fleet manager:
    - ELD training refresher for all drivers
    - Review route planning to ensure HOS achievable
    - Implement HOS alerts for drivers approaching limits

#### Exception Flows:

**E1: Performance Data Missing or Incomplete**
- If driver has insufficient data for scoring:
  - New driver hired 2 weeks ago - only 8 deliveries completed
  - System displays: "⚠ Limited data - score based on small sample"
  - Dispatcher views available metrics but treats score as preliminary
  - System recommends: "Re-evaluate after 30 deliveries or 30 days"
  - Dispatcher assigns driver to standard routes (not high-priority)

**E2: Telematics Data Unavailable**
- If safety score cannot be calculated:
  - Vehicle telematics system offline for 5 days
  - Safety score shows: "N/A - Insufficient telematics data"
  - Dispatcher can view other metrics (on-time rate, HOS compliance)
  - Dispatcher notes limitation and makes assignment based on available data
  - IT team investigates telematics outage

**E3: Driver Disputes Performance Rating**
- If driver claims performance score is inaccurate:
  - Driver Tom reports: "I don't have 6 hard braking events - must be error"
  - Dispatcher reviews detailed event log with timestamps
  - Dispatcher finds 2 events were false positives (speed bumps triggering sensor)
  - Dispatcher submits data correction request
  - Safety officer reviews and approves correction
  - Tom's safety score recalculated: 78 → 82 (improved)
  - Tom is notified of correction and updated score

**E4: Performance Scoring Algorithm Failure**
- If scoring system produces nonsensical results:
  - Driver shows 150/100 score (impossible)
  - System administrator investigates calculation error
  - Bug found in performance formula (division by zero error)
  - All driver scores recalculated with corrected formula
  - Dispatcher notified when scores are corrected

#### Postconditions:
- Dispatcher has accurate view of driver performance for assignment decisions
- Top performers are identified and utilized for critical routes
- Underperforming drivers are flagged for coaching and improvement
- Performance trends inform training and operational improvements
- Driver performance data is available for fleet management decisions

#### Business Rules:
- BR-DI-076: Driver performance scores updated daily based on rolling 30-day window
- BR-DI-077: Minimum performance score of 70/100 required for high-priority routes
- BR-DI-078: Drivers with safety scores <70 require mandatory retraining
- BR-DI-079: HOS violations must be reviewed by safety officer within 24 hours
- BR-DI-080: Customer ratings <4.0/5.0 trigger performance review
- BR-DI-081: Performance improvement plans (PIP) required for scores <65 for 2 consecutive months
- BR-DI-082: Driver performance data retained for 3 years for compliance and analysis

#### Related User Stories:
- US-DI-012: Driver Performance Monitoring

---

## Summary

### Use Case Statistics:
- **Total Use Cases**: 12
- **High Priority**: 6 use cases
- **Medium Priority**: 6 use cases
- **Low Priority**: 0 use cases

### Epic Distribution:
1. **Real-Time Vehicle Tracking**: 3 use cases
2. **Route Assignment and Optimization**: 3 use cases
3. **Load Planning and Scheduling**: 2 use cases
4. **Emergency Response Coordination**: 2 use cases
5. **Performance Monitoring and Reporting**: 2 use cases

### Key Integration Points:
- **Telematics Platforms**: Geotab, Samsara, Verizon Connect (real-time GPS and vehicle data)
- **Mapping Services**: Google Maps Platform, Mapbox (live maps and routing)
- **Communication**: Twilio (SMS), Bandwidth (voice), push notifications
- **Route Optimization**: Google Routes API, Vroom, OR-Tools
- **Roadside Assistance**: Agero, Urgently, NationSafe
- **Traffic Data**: Google Traffic, INRIX
- **Weather**: Weather.gov API, WeatherStack

### Dispatch-Specific Capabilities:
- **WebSocket-based real-time updates** for instant fleet visibility
- **Radio integration** for voice dispatch (optional WebRTC/Push-to-Talk)
- **Geofencing** with automated alerts and actions
- **HOS-aware route assignment** preventing violations
- **Emergency response protocols** with <60 second acknowledgment requirement
- **Dynamic re-routing** based on real-time traffic and conditions
- **Load capacity management** with weight/volume validation
- **Multi-day trip planning** with rest stop and HOS compliance
- **Customer ETA tracking** with automated notifications
- **Performance dashboards** with real-time KPI monitoring

---

## Related Documents

- **User Stories**: `user-stories/04_DISPATCHER_USER_STORIES.md`
- **Test Cases**: `test-cases/04_DISPATCHER_TEST_CASES.md` (to be created)
- **Workflows**: `workflows/04_DISPATCHER_WORKFLOWS.md` (to be created)
- **UI Mockups**: `mockups/dispatcher-dashboard/` (to be created)
- **API Specifications**: `api/dispatcher-endpoints.md` (to be created)

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-10 | Requirements Team | Initial dispatcher use cases created |

---

*This document provides detailed use case scenarios supporting the Dispatcher user stories and operational workflows.*
