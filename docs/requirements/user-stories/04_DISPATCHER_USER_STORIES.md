# Dispatcher - User Stories

**Role**: Dispatcher
**Access Level**: Operational (Live operations focus)
**Primary Interface**: Web Dashboard + Mobile App (50/50 split)
**Version**: 1.0
**Date**: November 10, 2025

---

## Epic 1: Real-Time Vehicle Tracking

### US-DI-001: Live Fleet Map Monitoring
**As a** Dispatcher
**I want to** view real-time locations of all active vehicles on a dynamic map
**So that** I can monitor fleet status and make informed routing decisions

**Priority**: High
**Story Points**: 13
**Sprint**: 1-2

#### Acceptance Criteria:
- [ ] I can view all active vehicles on an interactive map with current locations
- [ ] Vehicle markers show color-coded status (active, idle, maintenance, emergency)
- [ ] I can click vehicle markers to see detailed info (driver, load, destination, ETA)
- [ ] Map auto-refreshes every 10-30 seconds with latest GPS positions
- [ ] I can filter vehicles by status, type, route, or assigned depot
- [ ] Map shows traffic conditions and route congestion overlays
- [ ] I can view vehicle trails showing path traveled over last X hours
- [ ] Geofence boundaries are displayed with alerts for violations
- [ ] I can toggle map layers (satellite, terrain, traffic, weather)
- [ ] Map supports clustering for large fleet views
- [ ] Emergency/panic button activations are highlighted prominently

#### Dependencies:
- Real-time telematics integration
- GPS data stream with <30 second latency
- Map service API (Google Maps / Mapbox)
- WebSocket infrastructure for live updates

#### Technical Notes:
- API Endpoint: GET `/api/dispatch/fleet-map`
- WebSocket: `/ws/vehicle-locations`
- Update Frequency: 10-30 seconds based on vehicle speed
- Map Library: Mapbox GL JS or Google Maps JavaScript API
- Data Format: GeoJSON with vehicle metadata

---

### US-DI-002: Vehicle Status Alerts and Notifications
**As a** Dispatcher
**I want to** receive real-time alerts for critical vehicle events
**So that** I can respond immediately to emergencies and operational issues

**Priority**: High
**Story Points**: 8
**Sprint**: 1

#### Acceptance Criteria:
- [ ] I receive instant notifications for: emergency button, breakdown, accident, geofence violation
- [ ] Alerts display with severity levels (critical, warning, info) and distinct audio cues
- [ ] I can acknowledge alerts to remove them from active queue
- [ ] Alert history is logged with timestamp, vehicle, event type, and response actions
- [ ] I can configure which alert types I want to receive
- [ ] Alerts show vehicle location on map and recommended actions
- [ ] I can escalate alerts to supervisor or emergency services
- [ ] System tracks alert response time and resolution time
- [ ] Alerts can be filtered by severity, vehicle, or time range
- [ ] Mobile push notifications are sent for critical alerts when away from desk

#### Dependencies:
- Real-time event processing system
- Push notification service (Firebase / APNs)
- Telematics event triggers
- WebSocket for instant alerts

#### Technical Notes:
- API Endpoint: GET `/api/dispatch/alerts`, POST `/api/dispatch/alerts/{id}/acknowledge`
- WebSocket: `/ws/alerts`
- Notification Priority: Critical (sound + popup), Warning (popup), Info (badge)
- Event Types: panic_button, harsh_braking, geofence_exit, vehicle_fault, unauthorized_use

---

### US-DI-003: Driver Communication and Messaging
**As a** Dispatcher
**I want to** communicate with drivers via text messaging and radio integration
**So that** I can provide route updates, instructions, and emergency information

**Priority**: High
**Story Points**: 8
**Sprint**: 2

#### Acceptance Criteria:
- [ ] I can send text messages to individual drivers or groups
- [ ] I can see message delivery status (sent, delivered, read)
- [ ] Drivers can respond to messages with predefined quick replies
- [ ] System maintains conversation history for each driver
- [ ] I can send location waypoints and route updates directly to driver app
- [ ] Radio integration allows voice dispatch (if hardware available)
- [ ] I can broadcast emergency messages to all drivers simultaneously
- [ ] Templates are available for common messages (delay notification, route change, etc.)
- [ ] Messages are logged for audit and compliance purposes
- [ ] I receive notifications when drivers send messages requiring response

#### Dependencies:
- SMS gateway integration (Twilio / Bandwidth)
- Driver mobile app with messaging
- Push notification infrastructure
- Radio system integration (optional)

#### Technical Notes:
- API Endpoints: POST `/api/dispatch/messages`, GET `/api/dispatch/messages/conversations/{driverId}`
- Message Storage: messages table with thread grouping
- SMS Provider: Twilio API for two-way messaging
- Push Notifications: For immediate driver alerts
- Audio Integration: WebRTC for radio over IP (optional)

---

## Epic 2: Route Assignment and Optimization

### US-DI-004: Dynamic Route Assignment
**As a** Dispatcher
**I want to** assign routes and jobs to available drivers
**So that** I can optimize fleet utilization and meet customer delivery commitments

**Priority**: High
**Story Points**: 13
**Sprint**: 2-3

#### Acceptance Criteria:
- [ ] I can view all pending jobs/routes requiring assignment
- [ ] System shows available drivers with status, location, HOS remaining, and vehicle capacity
- [ ] I can drag-and-drop jobs to assign them to specific drivers
- [ ] System calculates estimated drive time and arrival time for each assignment
- [ ] I can reassign routes in real-time if priorities change
- [ ] Driver receives assignment notification on mobile app with route details
- [ ] I can view driver's current route and add stops dynamically
- [ ] System warns if assignment exceeds driver HOS limits or vehicle capacity
- [ ] I can manually override system recommendations with justification
- [ ] Assignment history is tracked for performance analysis
- [ ] Multi-stop routes are optimized for most efficient sequence

#### Dependencies:
- Job/order management system
- Route optimization engine
- HOS tracking and calculations
- Driver mobile app for assignment receipt

#### Technical Notes:
- API Endpoints: GET `/api/dispatch/pending-jobs`, POST `/api/dispatch/assign-route`
- Optimization: Google Maps Directions API or custom routing engine
- HOS Calculation: Real-time remaining drive time for 11/14 hour rules
- WebSocket: `/ws/route-assignments` for real-time updates
- Drag-Drop UI: React Beautiful DnD or similar library

---

### US-DI-005: Route Optimization and Re-routing
**As a** Dispatcher
**I want to** optimize multi-stop routes and re-route vehicles based on real-time conditions
**So that** I can minimize drive time, fuel costs, and meet time commitments

**Priority**: High
**Story Points**: 13
**Sprint**: 3-4

#### Acceptance Criteria:
- [ ] System automatically optimizes multi-stop routes for shortest time or distance
- [ ] I can manually adjust stop sequence with drag-and-drop
- [ ] Real-time traffic data triggers automatic re-routing recommendations
- [ ] I can send updated routes directly to driver's navigation app
- [ ] System calculates fuel savings and time savings for optimized routes
- [ ] I can set optimization preferences (fastest, shortest, fuel-efficient, avoid tolls)
- [ ] Route optimization considers delivery time windows and appointment times
- [ ] I can view before/after comparison of original vs optimized routes
- [ ] System warns of ETA changes that may impact customer commitments
- [ ] Historical route data improves future optimization recommendations

#### Dependencies:
- Route optimization algorithm (Google Routes API / OR-Tools)
- Real-time traffic data
- Customer appointment/time window data
- Turn-by-turn navigation integration

#### Technical Notes:
- API Endpoints: POST `/api/dispatch/optimize-route`, PATCH `/api/dispatch/routes/{id}/update`
- Optimization Engine: Google Routes Optimization API or Vroom open-source
- Calculation: Traveling Salesman Problem (TSP) solver
- Constraints: Time windows, vehicle capacity, driver HOS, priority stops
- Output: Optimized stop sequence with turn-by-turn directions

---

### US-DI-006: Customer ETA Communication
**As a** Dispatcher
**I want to** track and communicate accurate ETAs to customers
**So that** I can improve customer satisfaction and manage expectations

**Priority**: Medium
**Story Points**: 5
**Sprint**: 3

#### Acceptance Criteria:
- [ ] System calculates real-time ETA for each delivery based on current vehicle location
- [ ] I can view all deliveries with current ETA and scheduled appointment time
- [ ] System highlights deliveries at risk of missing time window
- [ ] I can send automated ETA updates to customers via SMS or email
- [ ] Customers receive notifications when driver is X minutes away
- [ ] I can manually adjust ETA and add delay reasons (traffic, breakdown, etc.)
- [ ] Dashboard shows on-time performance metrics
- [ ] ETA calculations factor in current traffic, driver status, and remaining stops
- [ ] I can view customer delivery history and communication log
- [ ] Proof of delivery is automatically sent to customer after completion

#### Dependencies:
- Customer contact database
- SMS/Email gateway
- Real-time traffic and route data
- Driver mobile app with POD capture

#### Technical Notes:
- API Endpoints: GET `/api/dispatch/deliveries/eta`, POST `/api/dispatch/notify-customer`
- ETA Calculation: Current location + remaining distance / avg speed + traffic delay
- Notification Templates: Configurable message templates
- Customer Portal: Optional self-service ETA tracking link
- Performance Metrics: On-time %, avg early/late minutes

---

## Epic 3: Load Planning and Scheduling

### US-DI-007: Load Capacity Planning
**As a** Dispatcher
**I want to** manage vehicle load capacity and cargo assignments
**So that** I can maximize vehicle utilization and ensure safe loading

**Priority**: Medium
**Story Points**: 8
**Sprint**: 3

#### Acceptance Criteria:
- [ ] I can view vehicle capacity specifications (weight, volume, pallet count)
- [ ] System shows current load status for each vehicle (empty, partial, full)
- [ ] I can assign cargo to vehicles and track remaining capacity
- [ ] System warns when load exceeds vehicle weight or volume limits
- [ ] I can view load distribution and balance for safe transport
- [ ] Load details include: weight, dimensions, special handling requirements, hazmat status
- [ ] I can reassign loads between vehicles if capacity conflicts arise
- [ ] System recommends optimal vehicle selection based on cargo requirements
- [ ] Load manifests can be printed or sent to driver mobile app
- [ ] Historical load data helps predict future capacity needs

#### Dependencies:
- Vehicle specifications database
- Cargo/order management system
- Weight and dimension tracking
- Hazmat compliance rules

#### Technical Notes:
- API Endpoints: GET `/api/dispatch/vehicles/capacity`, POST `/api/dispatch/assign-load`
- Capacity Calculation: Sum of cargo weights/volumes vs vehicle GVWR/capacity
- Validation: Real-time capacity checks before assignment
- Load Types: Palletized, loose cargo, liquid bulk, hazmat
- Alerts: Overweight, oversize, hazmat incompatibility warnings

---

### US-DI-008: Multi-Day Trip Planning
**As a** Dispatcher
**I want to** plan and schedule multi-day trips with overnight stops
**So that** I can efficiently manage long-haul operations and driver rest requirements

**Priority**: Medium
**Story Points**: 8
**Sprint**: 4

#### Acceptance Criteria:
- [ ] I can create multi-day trips with multiple origin and destination points
- [ ] System recommends rest stop locations based on HOS regulations
- [ ] I can schedule overnight stops with hotel/parking reservations
- [ ] Trip plan shows daily mileage, drive time, and fuel stops
- [ ] System calculates total trip cost (fuel, tolls, lodging, per diem)
- [ ] I can assign backup drivers for team driving operations
- [ ] Driver receives complete trip plan with all stops and reservations
- [ ] System monitors trip progress and alerts for schedule deviations
- [ ] I can modify trip plan in real-time if conditions change
- [ ] Trip templates can be saved for recurring long-haul routes

#### Dependencies:
- HOS regulation engine
- Hotel/truck stop location database
- Fuel pricing and toll calculation
- Route planning with rest stop optimization

#### Technical Notes:
- API Endpoints: POST `/api/dispatch/trips/multi-day`, GET `/api/dispatch/trips/{id}/progress`
- HOS Planning: Calculate required rest breaks and 10-hour sleeper berth periods
- Cost Estimation: Fuel (miles * MPG * fuel price) + tolls + lodging + per diem
- Integration: Truck stop finder APIs, hotel booking APIs (optional)
- Compliance: Ensure 11-hour drive limit, 14-hour on-duty limit, 10-hour rest requirement

---

## Epic 4: Emergency Response Coordination

### US-DI-009: Emergency Response Management
**As a** Dispatcher
**I want to** coordinate rapid response to vehicle emergencies and breakdowns
**So that** I can ensure driver safety and minimize operational disruption

**Priority**: High
**Story Points**: 8
**Sprint**: 2

#### Acceptance Criteria:
- [ ] I receive immediate alerts when driver activates emergency/panic button
- [ ] Emergency alert shows vehicle location, driver info, and nearest emergency services
- [ ] I can initiate emergency response protocol with one click (911, roadside assistance)
- [ ] System provides pre-scripted emergency communication templates
- [ ] I can dispatch nearest available vehicle to assist if appropriate
- [ ] All emergency events are logged with timeline of actions taken
- [ ] I can communicate with driver via hands-free calling or messaging
- [ ] Emergency contacts (supervisor, safety officer, family) are notified automatically
- [ ] I can track emergency response status from alert to resolution
- [ ] Post-incident reports are generated for safety review

#### Dependencies:
- Emergency button integration in vehicles
- Automated calling/911 integration
- Roadside assistance provider API
- Emergency contact database

#### Technical Notes:
- API Endpoints: POST `/api/dispatch/emergency/activate`, GET `/api/dispatch/emergency/{id}/status`
- Priority: Critical - bypasses all other alerts
- Communication: Automated SMS/call to emergency contacts
- Service Integration: Roadside assistance dispatch (e.g., Agero, NationSafe)
- Escalation: Auto-escalate to supervisor if not acknowledged in 2 minutes
- Logging: Complete audit trail with timestamps and actions

---

### US-DI-010: Breakdown and Tow Coordination
**As a** Dispatcher
**I want to** coordinate vehicle breakdowns and towing services
**So that** I can get disabled vehicles to repair facilities quickly and safely

**Priority**: Medium
**Story Points**: 5
**Sprint**: 3

#### Acceptance Criteria:
- [ ] I can log breakdown events with vehicle location and issue description
- [ ] System shows nearest tow providers, repair shops, and estimated arrival times
- [ ] I can request tow service directly through integrated providers
- [ ] Driver receives updates on tow ETA and instructions
- [ ] I can track tow truck location in real-time once dispatched
- [ ] System recommends repair facility based on issue type and vendor contracts
- [ ] I can reassign driver's route to another vehicle/driver
- [ ] Breakdown costs are tracked and linked to maintenance records
- [ ] Customer notifications are sent for delayed deliveries due to breakdown
- [ ] Breakdown trends are analyzed to identify problem vehicles

#### Dependencies:
- Tow service provider integration
- Repair facility network database
- Route reassignment system
- Customer notification system

#### Technical Notes:
- API Endpoints: POST `/api/dispatch/breakdowns`, POST `/api/dispatch/request-tow`
- Tow Provider APIs: Agero, Urgently, or manual dispatch
- Location Services: Nearest facility search based on GPS coordinates
- Cost Tracking: Tow fees, storage fees, estimated repair costs
- Workflow: Breakdown logged → Tow requested → Driver safe → Vehicle towed → Route reassigned

---

## Epic 5: Performance Monitoring and Reporting

### US-DI-011: Dispatch Performance Dashboard
**As a** Dispatcher
**I want to** monitor key dispatch performance metrics in real-time
**So that** I can optimize operations and meet service level agreements

**Priority**: Medium
**Story Points**: 8
**Sprint**: 4

#### Acceptance Criteria:
- [ ] Dashboard shows key metrics: active vehicles, completed deliveries, on-time %, avg response time
- [ ] I can view metrics by time period (today, this week, this month)
- [ ] System displays goals/targets for each metric with progress indicators
- [ ] I can drill down into specific metrics to see contributing factors
- [ ] Dashboard highlights areas requiring attention (late deliveries, idle vehicles)
- [ ] Real-time charts show trends throughout the day
- [ ] I can export dashboard data for reporting to management
- [ ] Performance comparisons show this period vs previous period
- [ ] Alerts notify me when metrics fall below acceptable thresholds
- [ ] Dashboard is customizable based on my KPI priorities

#### Dependencies:
- Real-time data aggregation
- Historical performance data
- KPI target configuration
- Charting library

#### Technical Notes:
- API Endpoint: GET `/api/dispatch/performance/dashboard`
- Metrics Tracked:
  - Active vehicles / total fleet
  - Deliveries completed today / scheduled
  - On-time delivery % (within time window)
  - Avg dispatch-to-driver acceptance time
  - Avg customer ETA accuracy
  - Emergency response time
  - Vehicle utilization rate
- Update Frequency: Real-time with 5-minute aggregation
- Visualization: Line charts, gauges, progress bars, heat maps

---

### US-DI-012: Driver Performance Monitoring
**As a** Dispatcher
**I want to** monitor individual driver performance and behavior
**So that** I can recognize top performers and address issues proactively

**Priority**: Medium
**Story Points**: 5
**Sprint**: 4

#### Acceptance Criteria:
- [ ] I can view performance scorecards for each driver
- [ ] Metrics include: on-time %, completed deliveries, safety incidents, customer ratings
- [ ] System highlights drivers with exceptional performance or concerning trends
- [ ] I can see real-time driver status (available, on route, on break, off duty)
- [ ] HOS compliance status shows remaining drive time for each driver
- [ ] I can view driver behavior scores (harsh braking, speeding, idle time)
- [ ] Performance data can be filtered by date range, route, or vehicle type
- [ ] I can add notes to driver records for coaching or recognition
- [ ] System recommends driver assignments based on performance and route requirements
- [ ] Reports can be exported for safety officer or fleet manager review

#### Dependencies:
- Driver behavior data from telematics
- HOS tracking system
- Customer rating/feedback system
- Performance calculation engine

#### Technical Notes:
- API Endpoint: GET `/api/dispatch/drivers/performance`
- Performance Metrics:
  - On-time delivery rate
  - Completed trips / assigned trips
  - Safety score (0-100 based on driving events)
  - Customer satisfaction rating
  - HOS compliance rate
  - Avg delivery time vs estimated
  - Vehicle inspection compliance
- Scoring Algorithm: Weighted composite score across multiple factors
- Alerts: Notify supervisor of drivers below acceptable performance thresholds

---

## Summary Statistics

**Total User Stories**: 12
**Total Story Points**: 102
**Estimated Sprints**: 4 (2-week sprints)
**Estimated Timeline**: 8-10 weeks

### Priority Breakdown:
- **High Priority**: 7 stories (69 points)
- **Medium Priority**: 5 stories (33 points)
- **Low Priority**: 0 stories (0 points)

### Epic Breakdown:
1. Real-Time Vehicle Tracking: 3 stories (29 points)
2. Route Assignment and Optimization: 3 stories (31 points)
3. Load Planning and Scheduling: 2 stories (16 points)
4. Emergency Response Coordination: 2 stories (13 points)
5. Performance Monitoring and Reporting: 2 stories (13 points)

### Mobile vs Desktop Usage:
- **Desktop Primary**: Real-time monitoring, route planning, multi-vehicle coordination
- **Mobile Primary**: Field communication, quick status checks, emergency response while mobile
- **Split**: 50% desktop (control center), 50% mobile (field supervision)

---

## Dispatch-Specific Features

### Radio Integration (US-DI-003 Extended):
- **Two-Way Radio**: Integration with existing radio systems for voice dispatch
- **Push-to-Talk (PTT)**: WebRTC-based PTT for digital radio over cellular
- **Channel Management**: Multiple dispatch channels for different regions/teams
- **Emergency Override**: Ability to break into all channels for critical announcements
- **Recording**: Automatic recording of radio communications for compliance

### Geofencing Capabilities (US-DI-001 Extended):
- **Custom Geofences**: Create circular or polygon geofences for facilities, restricted areas, customer sites
- **Automated Actions**: Trigger notifications, status changes, or alerts on geofence entry/exit
- **Time-Based Geofences**: Enforce operating hours or restricted access periods
- **Compliance Zones**: Track entry/exit from DOT inspection stations, weigh stations, border crossings
- **Customer Site Tracking**: Automatic check-in/check-out for proof of service

### Integration Points:
- **Telematics Providers**: Geotab, Samsara, Verizon Connect, Teletrac Navman
- **Mapping Services**: Google Maps Platform, Mapbox, HERE Technologies
- **Communication**: Twilio (SMS), Bandwidth (voice), Zello (radio over IP)
- **Traffic Data**: Google Traffic, INRIX, TomTom Traffic
- **Weather**: Weather.gov API, WeatherStack
- **Roadside Assistance**: Agero, Urgently, NationSafe
- **Route Optimization**: Google Routes API, Vroom, OR-Tools

---

## Workflow Examples

### Morning Dispatch Workflow:
1. Review overnight activity and vehicle readiness (US-DI-001)
2. Check pending jobs and driver availability (US-DI-004)
3. Assign routes to drivers based on location and capacity (US-DI-004, US-DI-007)
4. Optimize multi-stop routes for efficiency (US-DI-005)
5. Send route assignments to driver mobile apps (US-DI-004)
6. Monitor real-time progress throughout the day (US-DI-001, US-DI-011)
7. Handle exceptions, emergencies, and route changes (US-DI-005, US-DI-009)
8. Communicate ETAs to customers (US-DI-006)
9. Review end-of-day performance metrics (US-DI-011, US-DI-012)

### Emergency Response Workflow:
1. Receive emergency alert with location and driver info (US-DI-002)
2. Acknowledge alert and assess situation (US-DI-009)
3. Contact driver via hands-free communication (US-DI-003)
4. Dispatch emergency services if needed (US-DI-009)
5. Coordinate roadside assistance or tow service (US-DI-010)
6. Reassign driver's route to available backup (US-DI-004)
7. Notify customers of delivery delays (US-DI-006)
8. Document incident and timeline (US-DI-009)
9. Follow up with safety officer and fleet manager

---

## Related Documents
- Use Cases: `use-cases/04_DISPATCHER_USE_CASES.md`
- Test Cases: `test-cases/04_DISPATCHER_TEST_CASES.md`
- Workflows: `workflows/04_DISPATCHER_WORKFLOWS.md`
- UI Mockups: `mockups/dispatcher-dashboard/`

---

## Appendix: Regulatory Compliance

### Hours of Service (HOS) Monitoring:
- **11-Hour Drive Limit**: Track remaining drive time before mandatory break
- **14-Hour On-Duty Limit**: Monitor total on-duty time including non-driving tasks
- **10-Hour Rest Requirement**: Ensure drivers have adequate rest before next shift
- **70-Hour/8-Day Limit**: Track weekly on-duty hours and 34-hour restart requirements
- **30-Minute Break Rule**: Enforce break requirements after 8 hours of driving

### DOT/FMCSA Compliance:
- **Vehicle Inspection Reports (DVIR)**: Ensure pre-trip and post-trip inspections completed
- **Electronic Logging Device (ELD)**: Integration with ELD systems for HOS tracking
- **Weigh Station Bypass**: Integration with PrePass or Drivewyze for efficient bypass
- **IFTA Reporting**: Track fuel purchases and mileage by jurisdiction

---

*Next: Safety Officer User Stories (`05_SAFETY_OFFICER_USER_STORIES.md`)*
