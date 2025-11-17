# Driver - User Stories

**Role**: Driver
**Access Level**: Limited (Mobile-first, field operations)
**Primary Interface**: Mobile App (iOS/Android)
**Version**: 1.0
**Date**: November 11, 2025

---

## Epic 1: Pre-Trip and Post-Trip Inspections

### US-DR-001: Daily Vehicle Inspection - Pre-Trip
**As a** Driver
**I want to** complete my pre-trip vehicle inspection on my mobile device
**So that** I can verify vehicle safety before starting my route and comply with DOT regulations

**Priority**: High
**Story Points**: 8
**Sprint**: 1

#### Acceptance Criteria:
- [ ] I can access pre-trip inspection from mobile home screen with one tap
- [ ] Inspection form auto-loads for my assigned vehicle based on GPS/vehicle pairing
- [ ] I can complete standardized checklist (brakes, lights, tires, fluid levels, cargo area)
- [ ] I can take photos of any issues and annotate them
- [ ] I can use voice-to-text for defect descriptions
- [ ] System prevents me from marking "Pass" if critical items are failed
- [ ] I can electronically sign inspection with fingerprint/signature capture
- [ ] Inspection works offline and syncs when connectivity restored
- [ ] System timestamps inspection and captures GPS location
- [ ] Critical defects automatically notify dispatcher and maintenance
- [ ] I cannot start route/clock-in until inspection is completed and approved

#### Dependencies:
- Mobile app framework (React Native/Flutter)
- Offline data storage (SQLite)
- Vehicle-driver pairing system
- Photo compression and upload

#### Technical Notes:
- API Endpoint: POST `/api/inspections/pre-trip`
- Offline Support: IndexedDB for web, SQLite for native
- Sync Strategy: Queue inspections, sync on connectivity restoration
- Photo Size Limit: 5MB per photo, max 10 photos per inspection
- Required Fields: VIN/Fleet ID, odometer, fuel level, all checklist items

---

### US-DR-002: Post-Trip Inspection and Vehicle Handoff
**As a** Driver
**I want to** complete post-trip inspection at end of shift
**So that** I can document vehicle condition and ensure safe handoff to next driver or storage

**Priority**: High
**Story Points**: 5
**Sprint**: 1

#### Acceptance Criteria:
- [ ] I can access post-trip inspection from end-of-shift workflow
- [ ] Form includes final odometer reading, fuel level, and condition assessment
- [ ] I can report new damage or issues discovered during shift
- [ ] I can compare pre-trip vs post-trip condition with side-by-side view
- [ ] System calculates mileage driven and flags discrepancies with GPS data
- [ ] I can electronically sign post-trip inspection
- [ ] If defects found, I can immediately create maintenance work request
- [ ] System confirms inspection saved before allowing clock-out
- [ ] Inspection works offline with sync when connected
- [ ] Next driver receives notification of any reported issues

#### Dependencies:
- Pre-trip inspection completion (US-DR-001)
- Mileage tracking from telematics
- Work order creation module

#### Technical Notes:
- API Endpoint: POST `/api/inspections/post-trip`
- Validation: Compare odometer reading with GPS-based mileage (±10% tolerance)
- Workflow: Post-trip → Defect detection → Work order creation (optional) → Clock out
- Notification: Push notification to dispatcher and next assigned driver

---

### US-DR-003: Inspection History and Reference
**As a** Driver
**I want to** view my past inspection history
**So that** I can reference previous issues and track vehicle condition over time

**Priority**: Low
**Story Points**: 3
**Sprint**: 2

#### Acceptance Criteria:
- [ ] I can view list of my completed inspections (last 30 days)
- [ ] I can filter inspections by vehicle and date range
- [ ] Each inspection shows pass/fail status and critical issues
- [ ] I can view full inspection details including photos
- [ ] I can see resolution status of reported defects
- [ ] Search functionality to find specific issues or dates
- [ ] Inspection history loads quickly using pagination (20 per page)
- [ ] I can export my inspection history as PDF for personal records

#### Dependencies:
- Inspection data retention policy (minimum 90 days)
- Document generation service

#### Technical Notes:
- API Endpoint: GET `/api/inspections/history?driver={id}&page={n}`
- Pagination: 20 inspections per page
- Photo Loading: Thumbnail preview with full-size on demand
- Export: PDF generation with inspection summary table

---

## Epic 2: Hours of Service (HOS) Logging

### US-DR-004: Electronic Logging Device (ELD) - Duty Status
**As a** Driver
**I want to** log my duty status throughout the day using ELD functionality
**So that** I can comply with FMCSA Hours of Service regulations and avoid violations

**Priority**: High
**Story Points**: 13
**Sprint**: 1-2

#### Acceptance Criteria:
- [ ] I can easily switch duty status: Off Duty, Sleeper Berth, Driving, On Duty (Not Driving)
- [ ] System auto-switches to "Driving" when vehicle moves >5 mph
- [ ] System auto-switches to "On Duty" when vehicle stops but engine running
- [ ] I receive warning when approaching HOS limits (30 min before limit)
- [ ] Dashboard shows remaining drive time, on-duty time, and required breaks
- [ ] I can see my current 7-day and 8-day rolling totals
- [ ] System prevents me from driving if HOS limits reached
- [ ] I can add annotations explaining status changes
- [ ] FMCSA-compliant graph shows 24-hour timeline with color-coded statuses
- [ ] System works offline and syncs automatically
- [ ] I can certify my logs daily with electronic signature
- [ ] Logs are tamper-proof with audit trail of all changes

#### Dependencies:
- Telematics integration (vehicle speed, engine status, GPS)
- FMCSA ELD Technical Specification compliance
- Offline data storage with conflict resolution

#### Technical Notes:
- API Endpoint: POST `/api/hos/status-change`
- Standards: FMCSA 49 CFR Part 395 compliance
- Auto-Switch Logic: Speed >5mph for 1 minute = Driving
- HOS Rules: 11-hour drive limit, 14-hour on-duty limit, 30-min break after 8 hours
- Data Retention: 6 months on device, 3 years on server
- Certification: Daily log must be certified within 13 days

---

### US-DR-005: HOS Violation Warnings and Prevention
**As a** Driver
**I want to** receive proactive warnings about potential HOS violations
**So that** I can plan breaks and avoid violations that impact my record and company safety score

**Priority**: High
**Story Points**: 5
**Sprint**: 2

#### Acceptance Criteria:
- [ ] I receive push notification 60 minutes before HOS limit
- [ ] I receive escalating alerts at 30 min, 15 min, and 5 min before limit
- [ ] System shows countdown timer for remaining drive time
- [ ] Dashboard recommends optimal break times to maximize productivity
- [ ] I can see "safe to drive until" time based on current location and schedule
- [ ] System suggests nearby rest stops when break required
- [ ] Visual indicators (red/yellow/green) show HOS status at a glance
- [ ] Alerts include explanation of specific regulation being approached
- [ ] I can snooze non-critical alerts (with limits)
- [ ] Historical view shows near-violations to help improve planning

#### Dependencies:
- HOS calculation engine (US-DR-004)
- Push notification infrastructure
- Maps/POI integration for rest stops

#### Technical Notes:
- API Endpoint: GET `/api/hos/warnings`
- Notification: Firebase Cloud Messaging (FCM) / Apple Push Notification (APN)
- Calculation: Real-time countdown based on current duty status
- POI Data: Rest stops, truck stops, safe parking areas
- Alert Frequency: Every 15 minutes when within warning window

---

### US-DR-006: Weekly HOS Summary and Reset
**As a** Driver
**I want to** view my weekly HOS summary and understand reset requirements
**So that** I can plan my schedule and maximize available drive time

**Priority**: Medium
**Story Points**: 3
**Sprint**: 2

#### Acceptance Criteria:
- [ ] Dashboard shows current 7-day and 8-day rolling totals
- [ ] I can see hours used vs hours remaining for current cycle
- [ ] System shows when 34-hour restart becomes available
- [ ] Calendar view highlights required off-duty periods for reset
- [ ] I can forecast available drive time for upcoming days
- [ ] System explains reset rules in plain language
- [ ] I receive notification when restart completed and full hours available
- [ ] I can view HOS compliance percentage (target: 100%)
- [ ] Historical weekly summaries available for review

#### Dependencies:
- HOS logging system (US-DR-004)
- Reset calculation engine

#### Technical Notes:
- API Endpoint: GET `/api/hos/weekly-summary`
- Reset Rules: 34 consecutive hours off-duty (including two 1am-5am periods)
- Cycle Options: 60-hour/7-day or 70-hour/8-day
- Display: Interactive calendar with HOS visualization

---

## Epic 3: Incident and Damage Reporting

### US-DR-007: Accident and Incident Reporting
**As a** Driver
**I want to** immediately report accidents and safety incidents from my mobile device
**So that** dispatch and safety teams can respond quickly and documentation is captured in real-time

**Priority**: High
**Story Points**: 8
**Sprint**: 1

#### Acceptance Criteria:
- [ ] I can access emergency incident report with one tap from home screen
- [ ] Form includes incident type: accident, injury, property damage, near-miss, hazmat
- [ ] I can capture multiple photos and videos of scene
- [ ] GPS coordinates and timestamp automatically recorded
- [ ] I can record witness information and contact details
- [ ] System provides checklist of required actions (call police, notify dispatch, etc.)
- [ ] I can use voice recording to capture detailed description
- [ ] Report works offline and sends immediately when connection available
- [ ] Dispatch receives instant push notification with incident details
- [ ] System provides post-incident support resources (EAP, safety hotline)
- [ ] I can attach police report and insurance documents later

#### Dependencies:
- Emergency notification system
- File upload (photos/videos/documents)
- GPS location services

#### Technical Notes:
- API Endpoint: POST `/api/incidents/report`
- Offline Support: High priority - queue for immediate sync
- Media Upload: Compress photos/videos, upload in background
- Notification: Immediate alert to dispatcher, safety officer, fleet manager
- Auto-dial: One-tap calling to emergency services, dispatch, safety hotline
- Required Fields: Incident type, date/time, location, description, driver statement

---

### US-DR-008: Vehicle Damage Documentation
**As a** Driver
**I want to** document vehicle damage discovered during inspections or shift
**So that** I am not held responsible for pre-existing damage and maintenance can be scheduled

**Priority**: High
**Story Points**: 5
**Sprint**: 1

#### Acceptance Criteria:
- [ ] I can create damage report from inspection or standalone
- [ ] Interactive vehicle diagram allows me to mark damage location
- [ ] I can select damage type: dent, scratch, broken, missing, etc.
- [ ] I can take up to 10 photos of damage with zoom and annotation
- [ ] System compares against previous damage reports to identify new issues
- [ ] I can estimate damage severity: minor, moderate, major
- [ ] Damage report includes vehicle details, driver info, date, GPS location
- [ ] Works offline with sync when connected
- [ ] Maintenance team receives notification for moderate/major damage
- [ ] I receive confirmation when damage reviewed and work order created
- [ ] Historical damage reports show vehicle damage timeline

#### Dependencies:
- Vehicle diagram templates (by vehicle type)
- Image annotation tools
- Work order integration

#### Technical Notes:
- API Endpoint: POST `/api/vehicles/{id}/damage-report`
- Vehicle Diagram: SVG-based with clickable damage zones
- Photo Annotation: Drawing tools, arrows, text labels
- Comparison: Flag new damage by comparing with last inspection
- Notification: Auto-create work order for moderate/major damage

---

## Epic 4: Navigation and Route Following

### US-DR-009: Turn-by-Turn Navigation with Fleet Routing
**As a** Driver
**I want to** receive optimized turn-by-turn navigation for my assigned routes
**So that** I can efficiently reach destinations while following company-approved routes

**Priority**: High
**Story Points**: 8
**Sprint**: 2

#### Acceptance Criteria:
- [ ] I can view my assigned route with all scheduled stops
- [ ] Navigation provides turn-by-turn directions optimized for commercial vehicles
- [ ] System accounts for vehicle restrictions (height, weight, hazmat)
- [ ] I can see estimated arrival time (ETA) for each stop
- [ ] Route updates automatically based on traffic conditions
- [ ] I can report road closures or issues that update route for all drivers
- [ ] Navigation continues to work offline using cached maps
- [ ] I can reorder stops if permitted by route type (flexible vs fixed)
- [ ] System alerts me if I deviate significantly from assigned route
- [ ] I can request route changes from dispatcher with one tap
- [ ] Voice guidance works with minimal data usage

#### Dependencies:
- Telematics GPS data
- Commercial routing engine (e.g., Trimble, HERE)
- Offline map caching
- Real-time traffic data

#### Technical Notes:
- API Endpoint: GET `/api/routes/active`
- Routing Engine: Commercial-grade with truck restrictions
- Offline Maps: Download routes/regions for offline use
- Deviation Threshold: Alert if >0.5 miles off route
- Voice Guidance: Low-bandwidth audio files
- Stop Management: Mark complete, skip (with reason), add notes

---

### US-DR-010: Route Progress and Stop Management
**As a** Driver
**I want to** manage my route stops and update delivery status in real-time
**So that** dispatchers and customers have accurate information about delivery progress

**Priority**: Medium
**Story Points**: 5
**Sprint**: 2

#### Acceptance Criteria:
- [ ] Dashboard shows all stops in sequence with completion status
- [ ] I can mark stops as: Arrived, In Progress, Completed, Skipped
- [ ] I can capture proof of delivery: signature, photo, notes
- [ ] System automatically updates ETA for remaining stops
- [ ] I can add unscheduled stops with dispatcher approval
- [ ] Dispatcher sees real-time updates as I complete stops
- [ ] I can call customer directly from stop details
- [ ] System tracks actual vs scheduled arrival times
- [ ] I can report issues at stops: customer not available, access problems, etc.
- [ ] Completed stops show summary: arrival time, completion time, POD captured

#### Dependencies:
- Route assignment system
- Electronic signature capture
- Real-time sync infrastructure

#### Technical Notes:
- API Endpoint: PATCH `/api/routes/stops/{id}/status`
- Signature Capture: Canvas-based with timestamp and GPS
- Real-time Updates: WebSocket or polling (15-second intervals)
- Photo POD: Compress and upload, thumbnail preview
- Status Workflow: Assigned → Arrived → In Progress → Completed

---

## Epic 5: Fuel Management

### US-DR-011: Fuel Transaction Recording
**As a** Driver
**I want to** record fuel purchases and receive fuel optimization recommendations
**So that** fuel costs are tracked accurately and I can maximize fuel efficiency

**Priority**: Medium
**Story Points**: 5
**Sprint**: 3

#### Acceptance Criteria:
- [ ] I can log fuel transactions with gallons, price per gallon, and total cost
- [ ] I can scan/photograph fuel receipt for automatic data extraction (OCR)
- [ ] System validates odometer reading against last fuel-up
- [ ] I can select fuel type: diesel, gasoline, DEF, propane, CNG, electric (kWh)
- [ ] GPS location automatically captured for fuel station mapping
- [ ] System calculates MPG since last fill-up and shows trend
- [ ] I receive alerts if fuel purchased at non-preferred vendor (when alternatives available)
- [ ] Dashboard shows my fuel efficiency vs fleet average
- [ ] System suggests nearby fuel stops with current prices
- [ ] Fuel card integration auto-imports transactions (reduces manual entry)

#### Dependencies:
- OCR service for receipt scanning
- Fuel card integration (WEX, Comdata, etc.)
- Fuel price API
- Telematics odometer data

#### Technical Notes:
- API Endpoint: POST `/api/fuel/transactions`
- OCR: Azure Computer Vision or Google Cloud Vision API
- MPG Calculation: Gallons / (Current Odo - Previous Odo)
- Fuel Prices: OPIS or GasBuddy API for real-time pricing
- Validation: Flag transactions with >30% price variance or MPG outliers

---

### US-DR-012: Fuel Card and DEF Management
**As a** Driver
**I want to** manage my fuel card and DEF (Diesel Exhaust Fluid) purchases
**So that** I can refuel efficiently and maintain vehicle emissions systems

**Priority**: Low
**Story Points**: 3
**Sprint**: 3

#### Acceptance Criteria:
- [ ] I can view my fuel card number and PIN securely in app
- [ ] System shows fuel card spending limits and available balance
- [ ] I can report lost or stolen fuel card immediately
- [ ] DEF purchases tracked separately from diesel fuel
- [ ] System alerts me when DEF level low (based on telematics sensor)
- [ ] I can find nearest DEF pumps on route
- [ ] Fuel card transactions automatically sync to system within 24 hours
- [ ] I can dispute fuel card charges with photo/explanation
- [ ] System tracks fuel card violations (non-fuel purchases) for review

#### Dependencies:
- Fuel card provider API integration
- DEF level sensors from telematics
- Location-based DEF station database

#### Technical Notes:
- API Endpoint: GET `/api/fuel/card-info`
- Security: PCI-compliant storage, PIN masked by default
- DEF Tracking: Separate transaction category
- Card Replacement: Automated workflow to order replacement card
- Transaction Sync: Daily batch import from fuel card provider

---

## Epic 6: Mobile Communication

### US-DR-013: In-App Messaging with Dispatch
**As a** Driver
**I want to** communicate with dispatch and other drivers via in-app messaging
**So that** I can quickly resolve issues without unsafe phone calls while driving

**Priority**: High
**Story Points**: 8
**Sprint**: 2

#### Acceptance Criteria:
- [ ] I can send/receive messages with dispatch center
- [ ] Messages work offline and deliver when connectivity restored
- [ ] I can use pre-defined quick messages for common situations
- [ ] I can send photos and location with messages
- [ ] Voice-to-text available for hands-free messaging
- [ ] System reads incoming messages aloud if vehicle in motion
- [ ] I receive push notifications for urgent messages
- [ ] Message history retained for 30 days
- [ ] I can mark messages as read/unread
- [ ] Emergency messages have distinct alert sound and visual indicator
- [ ] I can initiate voice call from message thread

#### Dependencies:
- Real-time messaging infrastructure (WebSocket)
- Push notification service
- Text-to-speech (TTS) engine
- Offline message queue

#### Technical Notes:
- API Endpoint: POST `/api/messages`, WebSocket: `/ws/messages`
- Message Types: Standard, urgent, emergency, system notification
- Offline Queue: Store-and-forward architecture
- TTS: Device native TTS for reading messages while driving
- Quick Messages: Customizable templates (e.g., "Running 15 min late", "Break complete")
- Encryption: End-to-end encryption for message content

---

### US-DR-014: Document Access and Signature
**As a** Driver
**I want to** access required documents and provide electronic signatures
**So that** I can complete administrative tasks without returning to office

**Priority**: Medium
**Story Points**: 5
**Sprint**: 3

#### Acceptance Criteria:
- [ ] I can view documents assigned to me: policies, route sheets, delivery orders
- [ ] I can electronically sign documents using finger/stylus
- [ ] I can download documents for offline access
- [ ] System tracks document view/signature with timestamp and GPS
- [ ] I receive notifications when new documents require my signature
- [ ] Signed documents automatically uploaded and archived
- [ ] I can search document history by type or date
- [ ] Multi-page documents support pinch-zoom and page navigation
- [ ] I can add notes or comments to documents before signing
- [ ] Signature legally binding and audit-compliant

#### Dependencies:
- Document management system
- Electronic signature framework (e.g., DocuSign API)
- Offline document storage

#### Technical Notes:
- API Endpoint: GET `/api/documents/assigned`, POST `/api/documents/{id}/sign`
- Signature Capture: Canvas with pressure sensitivity
- Document Formats: PDF (primary), images, text
- Offline Access: Cache documents locally (encrypted)
- Compliance: ESIGN Act and UETA compliant
- Audit Trail: Document access, signature timestamp, GPS, IP address

---

### US-DR-015: Driver Performance Dashboard
**As a** Driver
**I want to** view my performance metrics and safety score
**So that** I can track my progress and identify areas for improvement

**Priority**: Medium
**Story Points**: 5
**Sprint**: 3

#### Acceptance Criteria:
- [ ] Dashboard shows my safety score (0-100) with breakdown by category
- [ ] I can see key metrics: MPG, on-time delivery %, HOS compliance %, inspection pass rate
- [ ] Performance trends displayed over time (weekly, monthly, quarterly)
- [ ] I can compare my metrics to fleet averages (anonymized)
- [ ] System highlights areas where I excel and areas needing improvement
- [ ] I can view detailed breakdown of safety events: hard braking, speeding, acceleration
- [ ] Gamification elements: badges, achievements, leaderboards (opt-in)
- [ ] I can set personal goals and track progress
- [ ] System provides tips and training resources based on performance gaps
- [ ] Performance reviews accessible before quarterly reviews with manager

#### Dependencies:
- Telematics scoring algorithm
- Performance calculation engine
- Training content management system

#### Technical Notes:
- API Endpoint: GET `/api/drivers/performance`
- Safety Score: Weighted algorithm based on events, violations, incidents
- Telematics Events: Hard braking (>8mph/s), harsh acceleration, speeding (+10mph)
- Refresh Frequency: Daily calculation, real-time trend display
- Gamification: Point system, monthly challenges, recognition badges
- Privacy: Drivers control visibility of their data in leaderboards

---

## Summary Statistics

**Total User Stories**: 15
**Total Story Points**: 88
**Estimated Sprints**: 3 (2-week sprints)
**Estimated Timeline**: 6-8 weeks

### Priority Breakdown:
- **High Priority**: 8 stories (54 points)
- **Medium Priority**: 6 stories (31 points)
- **Low Priority**: 1 story (3 points)

### Epic Breakdown:
1. Pre-Trip and Post-Trip Inspections: 3 stories (16 points)
2. Hours of Service (HOS) Logging: 3 stories (21 points)
3. Incident and Damage Reporting: 2 stories (13 points)
4. Navigation and Route Following: 2 stories (13 points)
5. Fuel Management: 2 stories (8 points)
6. Mobile Communication: 3 stories (18 points)

### Mobile-Specific Requirements:
- **Offline Capability**: 12 of 15 stories require offline functionality
- **Real-time Sync**: All stories with data entry include automatic synchronization
- **Photo/Video Capture**: 6 stories include media capture capabilities
- **GPS Integration**: 11 stories utilize GPS location services
- **Push Notifications**: 7 stories include alert/notification functionality
- **Voice Features**: 4 stories include voice-to-text or text-to-speech
- **Electronic Signature**: 4 stories require signature capture

### Compliance and Safety:
- FMCSA ELD Technical Specification compliance (US-DR-004)
- DOT inspection requirements (US-DR-001, US-DR-002)
- Electronic signature compliance - ESIGN Act (US-DR-014)
- Data retention: 6 months device, 3 years server (US-DR-004)
- Tamper-proof audit trails for all regulatory data

---

## Technical Architecture Notes

### Mobile Platform Support:
- **iOS**: Minimum iOS 14.0
- **Android**: Minimum Android 8.0 (API Level 26)
- **Framework**: React Native or Flutter for cross-platform development

### Offline-First Architecture:
- Local database: SQLite or Realm
- Sync mechanism: Queue-based with conflict resolution
- Background sync: Opportunistic when connectivity available
- Critical data: Priority queue for emergency/safety items

### Performance Requirements:
- App launch time: <3 seconds
- Form submission: <1 second (local save)
- Photo upload: Background, non-blocking
- Map load time: <2 seconds (cached)
- Battery impact: <10% per 8-hour shift

### Security Considerations:
- Biometric authentication (fingerprint/Face ID)
- Data encryption at rest (AES-256)
- Secure communication (TLS 1.3)
- PCI compliance for fuel card data
- HIPAA considerations for driver medical/injury data

### Integration Points:
- Telematics: Real-time vehicle data (speed, location, engine status)
- Fuel Cards: WEX, Comdata, FleetOne APIs
- Routing: Trimble, HERE, or Google Maps Platform (commercial)
- OCR: Azure Computer Vision or Google Cloud Vision
- Push Notifications: Firebase Cloud Messaging (FCM) / Apple Push Notification (APN)

---

## Related Documents
- Use Cases: `use-cases/02_DRIVER_USE_CASES.md`
- Test Cases: `test-cases/02_DRIVER_TEST_CASES.md`
- Workflows: `workflows/02_DRIVER_WORKFLOWS.md`
- Mobile UI/UX Specifications: `design/02_DRIVER_MOBILE_DESIGN.md`

---

*Previous: Fleet Manager User Stories (`01_FLEET_MANAGER_USER_STORIES.md`)*
*Next: Maintenance Technician User Stories (`03_MAINTENANCE_TECHNICIAN_USER_STORIES.md`)*
