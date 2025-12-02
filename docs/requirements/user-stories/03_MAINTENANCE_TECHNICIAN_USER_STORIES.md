# Maintenance Technician - User Stories

**Role**: Maintenance Technician
**Access Level**: Operational (Maintenance module focus)
**Primary Interface**: 70% Mobile, 30% Web Dashboard
**Version**: 1.0
**Date**: November 10, 2025

---

## Epic 1: Work Order Management

### US-MT-001: Mobile Work Order Queue Management
**As a** Maintenance Technician
**I want to** view and manage my assigned work orders from my mobile device
**So that** I can efficiently prioritize and complete maintenance tasks throughout my shift

**Priority**: High
**Story Points**: 8
**Sprint**: 1

#### Acceptance Criteria:
- [ ] I can view all work orders assigned to me, sorted by priority and due date
- [ ] Work order list shows: vehicle ID, service type, priority level, time estimate, parts status
- [ ] I can filter work orders by status (open, in-progress, awaiting parts, completed)
- [ ] I can change work order status with single tap (start work, pause, complete)
- [ ] System tracks actual labor time automatically when I start/stop work orders
- [ ] I can scan vehicle barcode/QR code to quickly open associated work order
- [ ] Dashboard shows my daily productivity metrics (work orders completed, labor hours)
- [ ] I receive push notifications for urgent/emergency work orders
- [ ] Offline mode allows me to access work orders when connectivity is limited

#### Dependencies:
- Mobile app with offline capability
- Barcode/QR code scanning functionality
- Push notification infrastructure
- Work order assignment logic

#### Technical Notes:
- API Endpoint: GET `/api/work-orders/technician/{tech_id}`
- Offline Storage: IndexedDB for mobile work order cache
- Real-time Updates: WebSocket for new work order assignments
- Push Notifications: Firebase Cloud Messaging (FCM)

---

### US-MT-002: Work Order Completion and Documentation
**As a** Maintenance Technician
**I want to** document work performed, parts used, and vehicle condition
**So that** accurate service records are maintained and billing is correct

**Priority**: High
**Story Points**: 13
**Sprint**: 1-2

#### Acceptance Criteria:
- [ ] I can record all work performed with detailed notes and time spent per task
- [ ] I can add parts used by scanning part barcodes or searching parts catalog
- [ ] System auto-calculates labor cost based on my labor rate and time spent
- [ ] I can capture photos of repairs, damage, or completed work (min 5 photos per work order)
- [ ] I can record diagnostic trouble codes (DTCs) and diagnostic findings
- [ ] Digital signature capture confirms work completion
- [ ] I can add notes for follow-up work or pending issues discovered
- [ ] System validates that all required fields are completed before allowing submission
- [ ] Completed work orders immediately sync to main system (or queue when offline)
- [ ] I can email/text work order summary to driver or dispatcher

#### Dependencies:
- Parts catalog with barcode integration
- Photo upload and storage (Azure Blob Storage)
- Diagnostic code database (OBD-II/proprietary codes)
- Digital signature component
- Email/SMS notification service

#### Technical Notes:
- API Endpoint: PATCH `/api/work-orders/{id}/complete`
- File Upload: Multi-part form for photos (max 10MB per photo)
- Validation: Required fields check before submission
- Sync Strategy: Queue-based sync for offline completions

---

### US-MT-003: Emergency Work Order Response
**As a** Maintenance Technician
**I want to** receive and respond to emergency breakdown work orders
**So that** vehicles can be returned to service quickly and safely

**Priority**: High
**Story Points**: 5
**Sprint**: 1

#### Acceptance Criteria:
- [ ] I receive immediate push notification for emergency work orders with audible alert
- [ ] Emergency work orders appear at top of my queue with red priority indicator
- [ ] I can view vehicle location on map and get navigation directions
- [ ] I can communicate with dispatcher via in-app chat or radio integration
- [ ] I can update work order status to "en route," "on scene," "diagnosing," "repairing"
- [ ] System tracks response time from notification to arrival
- [ ] I can quickly mark vehicle as "out of service" or "cleared for duty"
- [ ] I can request additional technician support or tow truck through the app
- [ ] System logs all emergency response activities for review

#### Dependencies:
- Real-time GPS and navigation integration
- Push notification with priority levels
- In-app messaging or radio dispatch integration
- Vehicle location tracking

#### Technical Notes:
- API Endpoint: GET `/api/work-orders/emergency`
- Push Priority: Critical level with custom sound
- Location Services: Google Maps API or similar
- Response Time Tracking: Automated timestamp logging

---

## Epic 2: Parts Inventory and Ordering

### US-MT-004: Parts Inventory Check and Reservation
**As a** Maintenance Technician
**I want to** check parts availability and reserve parts for my work orders
**So that** I don't waste time searching for unavailable parts and can complete jobs efficiently

**Priority**: High
**Story Points**: 8
**Sprint**: 2

#### Acceptance Criteria:
- [ ] I can search parts catalog by part number, description, or vehicle make/model
- [ ] System shows real-time inventory levels at my location and nearby locations
- [ ] I can scan part barcode to instantly check availability
- [ ] I can reserve parts for specific work orders to prevent allocation to other jobs
- [ ] System shows alternative/compatible parts if primary part is out of stock
- [ ] I can view parts location in warehouse (bin/shelf location)
- [ ] I receive notifications when reserved parts are ready for pickup
- [ ] I can see parts pricing and work order budget impact
- [ ] System suggests commonly needed parts based on work order type

#### Dependencies:
- Real-time inventory management system
- Parts catalog with cross-reference data
- Barcode scanning capability
- Warehouse bin location mapping

#### Technical Notes:
- API Endpoint: GET `/api/parts/search` and POST `/api/parts/reserve`
- Real-time Inventory: WebSocket updates for stock levels
- Barcode Format: Support for multiple standards (UPC, EAN, Code 128)
- Reservation Timeout: Auto-release after 2 hours if not picked up

---

### US-MT-005: Parts Issue and Return
**As a** Maintenance Technician
**I want to** issue parts from inventory and return unused parts
**So that** inventory records are accurate and parts are not wasted

**Priority**: High
**Story Points**: 5
**Sprint**: 2

#### Acceptance Criteria:
- [ ] I can scan part barcode to issue from inventory to work order
- [ ] System prompts for quantity and automatically updates inventory levels
- [ ] I can associate issued parts with specific work order line items
- [ ] I can return unused parts and system adds them back to inventory
- [ ] System tracks core returns for rebuildable parts (batteries, starters, alternators)
- [ ] I can mark parts as defective/warranty return with reason code
- [ ] System validates that parts issued match work order requirements
- [ ] I can view my parts issue history and current "checked out" parts
- [ ] Mobile app works in low-connectivity areas (sync when connected)

#### Dependencies:
- Barcode scanning hardware (mobile device camera or dedicated scanner)
- Inventory transaction logging
- Core tracking system
- Warranty claim integration

#### Technical Notes:
- API Endpoint: POST `/api/parts/issue` and POST `/api/parts/return`
- Transaction Types: Issue, return, core_return, warranty_return
- Offline Queue: Store transactions locally and sync when connected
- Inventory Adjustment: Real-time or near-real-time updates

---

### US-MT-006: Emergency Parts Ordering
**As a** Maintenance Technician
**I want to** request rush orders for critical parts not in stock
**So that** vehicle downtime is minimized and urgent repairs can be completed

**Priority**: Medium
**Story Points**: 5
**Sprint**: 3

#### Acceptance Criteria:
- [ ] I can create emergency parts request directly from work order
- [ ] System shows estimated delivery times from multiple vendors
- [ ] I can specify urgency level (same day, next day, standard)
- [ ] Request routes to parts manager or purchasing for approval
- [ ] I receive real-time notifications on order status and delivery updates
- [ ] I can provide alternate part numbers or specifications
- [ ] System shows cost impact and requires justification for rush orders
- [ ] I can track inbound parts shipments and estimated arrival time
- [ ] System notifies me when parts arrive and are ready for pickup

#### Dependencies:
- Vendor catalog integration
- Approval workflow engine
- Shipping/tracking integration (UPS, FedEx, etc.)
- Email/SMS notifications

#### Technical Notes:
- API Endpoint: POST `/api/parts/emergency-order`
- Workflow: Request → Approval → Order → Tracking → Delivery
- Integration: Vendor APIs for real-time pricing and availability
- Notification Strategy: Multi-channel (push, email, SMS)

---

## Epic 3: Preventive Maintenance Execution

### US-MT-007: PM Schedule and Checklist Execution
**As a** Maintenance Technician
**I want to** follow digital PM checklists with guided procedures
**So that** all required maintenance tasks are completed consistently and safely

**Priority**: High
**Story Points**: 13
**Sprint**: 2-3

#### Acceptance Criteria:
- [ ] I can access vehicle-specific PM checklist based on service interval (A, B, C service)
- [ ] Checklist is organized by system (engine, transmission, brakes, electrical, etc.)
- [ ] Each task shows detailed instructions, specifications, and safety warnings
- [ ] I can mark tasks as complete, not applicable, or failed with notes
- [ ] I can capture photos/videos of inspection points and issues found
- [ ] System validates critical measurements (tire pressure, fluid levels, brake thickness)
- [ ] I can flag items requiring follow-up work orders
- [ ] System calculates next PM due date/mileage based on completed service
- [ ] Digital signature confirms PM completion and vehicle roadworthiness
- [ ] Completed checklist generates comprehensive PM report
- [ ] I can access manufacturer service bulletins and technical documents

#### Dependencies:
- PM checklist templates by vehicle type and service interval
- Manufacturer specifications database
- Photo/video capture and storage
- Technical service bulletin (TSB) integration
- Digital signature capability

#### Technical Notes:
- API Endpoint: GET `/api/pm/checklist/{vehicle_id}/{service_type}`
- Checklist Engine: Dynamic generation based on vehicle make/model/year
- Validation Rules: Min/max ranges for measurements with alerts
- Document Storage: Link to relevant TSBs and repair procedures

---

### US-MT-008: Fluid Analysis Sample Collection
**As a** Maintenance Technician
**I want to** collect and document fluid samples during PM services
**So that** oil analysis can detect early signs of component wear and prevent failures

**Priority**: Medium
**Story Points**: 5
**Sprint**: 3

#### Acceptance Criteria:
- [ ] System prompts for fluid sample collection during appropriate PM intervals
- [ ] I can scan sample bottle barcode to associate with vehicle and service
- [ ] I can record fluid condition observations (color, odor, contamination)
- [ ] System generates sample labels with vehicle ID, fluid type, mileage, date
- [ ] I can document sample collection location (engine, transmission, differential, etc.)
- [ ] System tracks sample shipment to lab and expected result timeframe
- [ ] I receive notifications when lab results are available
- [ ] Abnormal lab results trigger automatic work order creation
- [ ] I can view historical fluid analysis trends for vehicle

#### Dependencies:
- Fluid analysis lab integration or manual entry
- Label printing capability (Bluetooth label printer)
- Barcode generation and scanning
- Automated work order creation workflow

#### Technical Notes:
- API Endpoint: POST `/api/fluid-analysis/sample`
- Lab Integration: API or email-based result import
- Alert Thresholds: Configurable limits for wear metals, viscosity, etc.
- Trend Analysis: Historical charting of key fluid analysis parameters

---

## Epic 4: Diagnostic and Repair Documentation

### US-MT-009: OBD-II Diagnostic Code Reading and Analysis
**As a** Maintenance Technician
**I want to** read, interpret, and document diagnostic trouble codes
**So that** I can accurately diagnose issues and recommend appropriate repairs

**Priority**: High
**Story Points**: 8
**Sprint**: 2

#### Acceptance Criteria:
- [ ] I can connect to vehicle OBD-II port via Bluetooth adapter
- [ ] System reads and displays all active and pending DTCs
- [ ] Each DTC shows: code, description, freeze frame data, and common causes
- [ ] I can view live data stream from vehicle sensors
- [ ] System provides troubleshooting flowcharts for each DTC
- [ ] I can record initial DTC reading and post-repair verification
- [ ] I can clear codes after repairs and verify fix with test drive data
- [ ] System links DTCs to relevant TSBs and repair procedures
- [ ] I can save DTC reports and attach to work orders
- [ ] System tracks DTC recurrence rates by vehicle

#### Dependencies:
- OBD-II Bluetooth adapter compatibility
- DTC database (generic and manufacturer-specific codes)
- Troubleshooting flowchart content
- TSB integration
- Live data logging capability

#### Technical Notes:
- API Endpoint: POST `/api/diagnostics/dtc-reading`
- OBD Protocol Support: ISO 15765, ISO 14230, SAE J1850, etc.
- Data Storage: dtc_readings table with freeze frame JSON
- Integration: Mitchell1, AllData, or similar repair information

---

### US-MT-010: Warranty Claim Documentation
**As a** Maintenance Technician
**I want to** document warranty repairs and submit claims to manufacturers
**So that** warranty costs are recovered and proper documentation is maintained

**Priority**: Medium
**Story Points**: 8
**Sprint**: 3

#### Acceptance Criteria:
- [ ] System checks vehicle warranty status before repair authorization
- [ ] I can flag work order as potential warranty claim with failure description
- [ ] System guides me through required warranty documentation (photos, failed parts, etc.)
- [ ] I can capture detailed failure mode description and root cause analysis
- [ ] System validates that repair is within warranty coverage (time/miles)
- [ ] I can upload required supporting documents (repair authorization, inspection reports)
- [ ] Failed parts are tracked for return to manufacturer or destruction
- [ ] System generates warranty claim package for submission
- [ ] I can track claim status from submission to payment
- [ ] Denied claims can be appealed with additional documentation

#### Dependencies:
- Warranty database by vehicle (time/mileage limits, covered components)
- Manufacturer warranty portals or email submission
- Failed parts tracking system
- Document management for claims

#### Technical Notes:
- API Endpoint: POST `/api/warranty/claim`
- Validation: Check warranty_coverage table for eligibility
- Workflow States: draft → submitted → under_review → approved/denied → paid
- Integration: Manufacturer warranty portals (where available)

---

## Epic 5: Equipment and Tool Management

### US-MT-011: Tool and Equipment Checkout
**As a** Maintenance Technician
**I want to** check out specialized tools and equipment for my jobs
**So that** tool inventory is tracked and equipment is available when needed

**Priority**: Low
**Story Points**: 5
**Sprint**: 4

#### Acceptance Criteria:
- [ ] I can search tool inventory by name, category, or tool ID
- [ ] I can scan tool barcode to check out to my account
- [ ] System shows tool availability and current location (shop/locker/checked out)
- [ ] I can associate tool checkout with specific work order
- [ ] System tracks calibration status for precision tools and test equipment
- [ ] I receive alerts when calibration is due on checked-out equipment
- [ ] I can check tools back in by scanning barcode
- [ ] System sends reminders for overdue tool returns (>24 hours)
- [ ] I can report damaged or missing tools with incident notes
- [ ] Tool usage history is tracked for maintenance and replacement planning

#### Dependencies:
- Tool inventory database with barcodes
- Calibration schedule tracking
- Barcode scanning capability
- Notification system for overdue items

#### Technical Notes:
- API Endpoint: POST `/api/tools/checkout` and POST `/api/tools/return`
- Tracking: tool_transactions table with checkout/return timestamps
- Calibration: Alert when due_calibration_date < current_date + 30 days
- Reporting: Tool utilization reports for purchase planning

---

### US-MT-012: Safety Equipment Inspection
**As a** Maintenance Technician
**I want to** perform and document required safety equipment inspections
**So that** shop safety is maintained and OSHA compliance is achieved

**Priority**: Medium
**Story Points**: 5
**Sprint**: 4

#### Acceptance Criteria:
- [ ] I can access digital safety inspection checklists (lifts, hoists, air compressors, etc.)
- [ ] System schedules inspections based on regulatory requirements (daily, weekly, monthly)
- [ ] I can mark inspection items as pass/fail with corrective action notes
- [ ] Failed items trigger work orders for repair and equipment out-of-service status
- [ ] I can capture photos of safety issues or corrective actions
- [ ] Digital signature confirms inspection completion
- [ ] System maintains permanent inspection records for audits
- [ ] Dashboard shows upcoming inspections and overdue items
- [ ] Inspection reports can be exported for OSHA audits
- [ ] Critical safety equipment failures send immediate alerts to shop foreman

#### Dependencies:
- Safety equipment inventory
- Regulatory inspection schedule requirements
- Work order creation workflow
- Audit reporting capability

#### Technical Notes:
- API Endpoint: POST `/api/safety/inspection`
- Inspection Types: Daily (lifts), Weekly (fire extinguishers), Monthly (fall protection)
- Compliance: OSHA 1910 standards tracking
- Alerting: Immediate escalation for critical failures

---

---

## Summary Statistics

**Total User Stories**: 12
**Total Story Points**: 88
**Estimated Sprints**: 4 (2-week sprints)
**Estimated Timeline**: 8-10 weeks

### Priority Breakdown:
- **High Priority**: 7 stories (60 points)
- **Medium Priority**: 4 stories (23 points)
- **Low Priority**: 1 story (5 points)

### Epic Breakdown:
1. Work Order Management: 3 stories (26 points)
2. Parts Inventory and Ordering: 3 stories (18 points)
3. Preventive Maintenance Execution: 2 stories (18 points)
4. Diagnostic and Repair Documentation: 2 stories (16 points)
5. Equipment and Tool Management: 2 stories (10 points)

### Mobile vs Desktop Distribution:
- **Mobile-Primary**: 10 stories (70 points) - Field work, inspections, diagnostics
- **Desktop-Primary**: 2 stories (18 points) - Detailed analysis, reporting

---

## Technical Implementation Notes

### Mobile Application Requirements:
- **Offline Capability**: Critical for shop areas with poor connectivity
  - Local database: IndexedDB or SQLite
  - Sync queue for pending transactions
  - Conflict resolution for concurrent edits

- **Barcode/QR Scanning**: Vehicle IDs, parts, tools
  - Camera-based scanning (built-in device camera)
  - Support for multiple barcode formats
  - Fallback manual entry option

- **Photo/Video Capture**: Repair documentation
  - Compression before upload (max 2MB per photo)
  - Annotation capability (markup tools)
  - Batch upload with progress indicator

- **Digital Signatures**: Work order completion
  - Touch/stylus signature pad
  - Biometric authentication option
  - Signature image storage and display

### Integration Points:
1. **OBD-II Adapters**: Bluetooth connectivity for diagnostic readings
2. **Parts Catalog**: Real-time inventory and pricing
3. **Manufacturer TSBs**: Technical service bulletin access
4. **Warranty Systems**: Claim submission and tracking
5. **Label Printers**: Bluetooth printing for fluid samples, parts tags

### Performance Requirements:
- Work order list load time: <2 seconds
- Photo upload: <5 seconds per photo (on 4G connection)
- Barcode scan recognition: <1 second
- Offline mode: Full work order access and completion capability
- Sync time: <10 seconds for typical work order completion

---

## User Experience Considerations

### Mobile-First Design:
- Large touch targets (min 44x44px) for gloved hands
- High contrast for outdoor visibility
- Voice input option for hands-free note-taking
- Simplified navigation (max 3 taps to any function)

### Technician Efficiency:
- Quick actions: Swipe gestures for common tasks
- Smart defaults: Auto-populate known values
- Minimal typing: Barcode scanning, dropdowns, pre-filled values
- Contextual help: Inline tooltips and help videos

### Safety Focus:
- Critical alerts: Prominent visual and audible warnings
- Safety checklist: Cannot be bypassed for certain repairs
- Lockout/tagout tracking: Equipment out-of-service management
- Hazmat documentation: Required for certain repairs

---

## Training and Support Requirements

### Technician Training:
1. Mobile app navigation and work order completion (2 hours)
2. Parts inventory management and ordering (1 hour)
3. Diagnostic tool integration and DTC analysis (2 hours)
4. PM checklist execution and documentation (1 hour)
5. Safety equipment inspection procedures (1 hour)

### Support Documentation:
- Quick reference guides (laminated cards for shop)
- Video tutorials for complex workflows
- In-app help system with search
- FAQ for common issues and troubleshooting

### Ongoing Support:
- Help desk for technical issues (phone/email)
- Monthly tips and best practices newsletter
- Quarterly system updates and new feature training
- Annual refresher training

---

## Compliance and Audit Requirements

### Documentation Retention:
- Work orders: 7 years (legal and warranty requirements)
- PM checklists: 5 years (manufacturer and DOT requirements)
- Safety inspections: 5 years (OSHA requirements)
- Warranty claims: 10 years (manufacturer requirements)
- Diagnostic reports: 3 years (operational requirements)

### Audit Trail:
- All work order changes logged with user, timestamp, and reason
- Parts transactions tracked with complete chain of custody
- Digital signatures non-repudiation (cannot be altered after signing)
- System access logs for security audits

### Reporting Requirements:
- Monthly maintenance cost reports by vehicle
- Quarterly PM compliance rates
- Annual safety inspection compliance
- Warranty recovery metrics
- Technician productivity reports

---

## Related Documents
- Use Cases: `use-cases/03_MAINTENANCE_TECHNICIAN_USE_CASES.md`
- Test Cases: `test-cases/03_MAINTENANCE_TECHNICIAN_TEST_CASES.md`
- Workflows: `workflows/03_MAINTENANCE_TECHNICIAN_WORKFLOWS.md`
- Mobile App Specifications: `technical/MOBILE_APP_SPECIFICATIONS.md`

---

*Previous: Driver User Stories (`02_DRIVER_USER_STORIES.md`)*
*Next: Dispatcher User Stories (`04_DISPATCHER_USER_STORIES.md`)*
