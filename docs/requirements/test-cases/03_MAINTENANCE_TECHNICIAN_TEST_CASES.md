# Maintenance Technician - Test Cases

**Role**: Maintenance Technician
**Test Suite Version**: 1.0
**Date**: November 10, 2025
**Total Test Cases**: 25

---

## Table of Contents

1. [Work Order Management](#epic-1-work-order-management)
2. [Parts Inventory and Ordering](#epic-2-parts-inventory-and-ordering)
3. [Preventive Maintenance Execution](#epic-3-preventive-maintenance-execution)
4. [Diagnostic and Repair Documentation](#epic-4-diagnostic-and-repair-documentation)
5. [Equipment and Tool Management](#epic-5-equipment-and-tool-management)

---

## Epic 1: Work Order Management

### TC-MT-001: Mobile Work Order Queue Display and Sorting

**Test Case ID**: TC-MT-001
**Test Case Name**: Mobile Work Order Queue Display and Sorting
**Related US**: US-MT-001 (Mobile Work Order Queue Management)
**Related UC**: UC-MT-001 (Receive and Prioritize Work Orders)
**Priority**: High
**Test Type**: Functional

#### Preconditions:
- Technician is logged into mobile app
- Multiple work orders are assigned to technician
- Mobile device has internet connectivity
- System contains work orders with varying priority levels

#### Test Steps:
1. Open mobile app and navigate to Work Order Queue
2. Verify work orders displayed in priority order (Critical > High > Standard)
3. Verify each work order shows: Vehicle ID, Service Type, Priority Level, Time Estimate
4. Filter work orders by status: "Open"
5. Verify only "Open" status work orders display
6. Change filter to "In Progress"
7. Verify display updates to show only "In Progress" work orders
8. Sort work orders by due date (earliest first)
9. Verify work orders reordered chronologically
10. Verify color coding: Red (Critical), Orange (High), Yellow (Standard)

#### Expected Results:
- Work orders display with correct priority sorting
- Filter functionality works for all status options
- Sorting by due date displays chronologically
- Color coding matches priority levels accurately
- Performance: Queue loads in <2 seconds
- Offline mode shows cached work orders

#### Acceptance Criteria:
- All work orders assigned to technician display
- Priority and status sorting functions correctly
- Filter options work independently
- Color indicators match specification
- Pagination works if >20 work orders present
- UI responsive on devices with 4-6 inch screens

#### Test Data:
```
Work Orders:
- WO-2025-1847: Vehicle #234, Standard, 1 hour estimate
- WO-2025-1848: Vehicle #567, Critical, 2.5 hours estimate
- WO-2025-1849: Vehicle #891, High, 3 hours estimate
- WO-2025-1850: Vehicle #445, Standard, 1.5 hours estimate

Technician: Alex (Tech-ID: T-001)
Device: iPhone 13, iOS 16
```

---

### TC-MT-002: Work Order Status Transition and Labor Time Tracking

**Test Case ID**: TC-MT-002
**Test Case Name**: Work Order Status Transition and Labor Time Tracking
**Related US**: US-MT-001 (Mobile Work Order Queue Management)
**Related UC**: UC-MT-001 (Receive and Prioritize Work Orders)
**Priority**: High
**Test Type**: Functional

#### Preconditions:
- Technician is logged into mobile app
- Work order assigned to technician is in "Open" status
- Vehicle is available in maintenance bay
- Mobile device has sufficient battery and connectivity

#### Test Steps:
1. Select work order from queue (WO-2025-1848)
2. Tap "Start Work" button
3. Verify work order status changed to "In Progress"
4. Verify system automatically logs start time with timestamp
5. Review labor time tracking display (timer should be running)
6. Allow 15 minutes to elapse in real time
7. Verify timer increments to 00:15:00
8. Tap "Pause Work" button
9. Verify status changes to "Paused"
10. Verify timer pauses at correct time
11. Wait 5 minutes (pause time)
12. Tap "Resume Work" button
13. Verify status returns to "In Progress"
14. Verify timer resumes from pause point (00:15:00)
15. Allow another 10 minutes to elapse
16. Verify total time shows 00:25:00
17. Tap "Complete Work" (don't submit yet)
18. Verify total labor time: 00:25:00
19. Verify labor cost calculation: 25 minutes × $75/hour = $31.25

#### Expected Results:
- Work order status transitions correctly
- Labor time tracking accurate to nearest minute
- Timer pauses/resumes without data loss
- Cost calculation auto-updates based on time
- Timestamp logs match server time
- UI shows real-time timer with MM:SS format

#### Acceptance Criteria:
- Status transitions complete successfully
- Labor time tracking accuracy: ±1 minute
- Pause/resume works without losing time
- Cost calculations correct
- Timer visible and easy to read
- No crashes during long work sessions (>8 hours)

#### Test Data:
```
Work Order: WO-2025-1848
Technician Rate: $75/hour
Status: Open → In Progress → Paused → In Progress
Time Tracking: 15 min + 10 min = 25 min total
Expected Cost: $31.25
```

---

### TC-MT-003: Vehicle Barcode Scan and Confirmation

**Test Case ID**: TC-MT-003
**Test Case Name**: Vehicle Barcode Scan and Confirmation
**Related US**: US-MT-001 (Mobile Work Order Queue Management)
**Related UC**: UC-MT-001 (Receive and Prioritize Work Orders)
**Priority**: High
**Test Type**: Functional

#### Preconditions:
- Technician is starting a work order
- Mobile device has camera and barcode scanning capability
- Vehicle has barcode label with unique vehicle ID
- Work order linked to specific vehicle

#### Test Steps:
1. Open work order WO-2025-1848
2. Verify prompt: "Scan vehicle barcode to confirm"
3. Open device camera for barcode scanning
4. Scan vehicle barcode for Vehicle #567
5. System decodes barcode and matches to work order
6. Verify confirmation message: "Vehicle #567 - Freightliner Cascadia - Linked to WO-2025-1848"
7. Tap "Confirm" to proceed with work
8. Verify system prevents work start if barcode doesn't match
9. Try to scan incorrect vehicle barcode
10. Verify system error: "Barcode does not match assigned vehicle"
11. Verify work order cannot proceed without correct vehicle match

#### Expected Results:
- Barcode scanning works on device camera
- Correct vehicle barcode displays vehicle details
- Mismatch detected and prevented
- Confirmation shows all vehicle details
- Scan recognition <1 second
- Fallback manual entry option available

#### Acceptance Criteria:
- Barcode scanning accurate
- Vehicle details match database
- Wrong vehicle scanning prevented
- User-friendly error messages
- Manual entry option available if barcode unreadable
- Confirmation required before work start

#### Test Data:
```
Vehicle Barcode: VHCL567890
Vehicle ID: #567
Make/Model: Freightliner Cascadia
Work Order: WO-2025-1848
Expected Match: YES
Incorrect Barcode: VHCL111111
Expected Match: NO
```

---

### TC-MT-004: Emergency Work Order Notification and Priority Display

**Test Case ID**: TC-MT-004
**Test Case Name**: Emergency Work Order Notification and Priority Display
**Related US**: US-MT-003 (Emergency Work Order Response)
**Related UC**: UC-MT-003 (Handle Emergency Breakdown Response)
**Priority**: High
**Test Type**: Functional

#### Preconditions:
- Technician is logged into mobile app
- Mobile device has push notification enabled
- Mobile device has speaker/alert audio enabled
- System has emergency work order assignment capability

#### Test Steps:
1. Dispatcher assigns emergency work order to technician
2. Verify mobile device receives push notification with sound alert
3. Verify notification displays: "CRITICAL - Vehicle breakdown"
4. Verify work order appears at TOP of work queue with red indicator
5. Verify notification includes: Vehicle ID, Location, Priority
6. Tap notification to open emergency work order
7. Verify emergency work order details displayed immediately
8. Verify "View on Map" option shows vehicle location
9. Tap "View on Map"
10. Verify Google Maps opens with vehicle location marked
11. Verify navigation route provided to breakdown location
12. Verify "Accept Emergency Assignment" button prominently displayed
13. Tap to accept and verify status: "En Route"
14. Verify system logs acceptance timestamp

#### Expected Results:
- Push notification delivered with audible alert
- Work order appears at top with red color coding
- Emergency details display clearly
- Map integration shows exact location
- Navigation directions provided
- Accept button immediately accessible
- Timestamp logged accurately

#### Acceptance Criteria:
- Emergency alert arrives within 3 seconds of assignment
- Audible alert is loud enough to hear in shop environment (>80dB)
- Work order immediately prioritized
- Location mapping accurate
- Navigation functional
- No delay in work order opening

#### Test Data:
```
Emergency Notification:
- Vehicle ID: #567
- Location: I-95 Mile Marker 47
- Priority: Critical
- Assigned Technician: Alex (T-001)
- Timestamp: 2:30 PM
- Expected Delivery: Within 3 seconds
```

---

### TC-MT-005: Work Order Completion Form Validation

**Test Case ID**: TC-MT-005
**Test Case Name**: Work Order Completion Form Validation
**Related US**: US-MT-002 (Work Order Completion and Documentation)
**Related UC**: UC-MT-002 (Complete Work Orders with Documentation)
**Priority**: High
**Test Type**: Functional

#### Preconditions:
- Work order is in "In Progress" status
- All repair work completed on vehicle
- Mobile device has camera for photo capture
- Digital signature capability available

#### Test Steps:
1. Click "Complete Work Order" button
2. Verify completion form displays with all required fields
3. Leave "Work Summary" field empty
4. Attempt to submit form
5. Verify system error: "Work Summary is required"
6. Enter work summary: "Replaced oxygen sensor per diagnostic findings"
7. Leave "Diagnostic Findings" empty
8. Attempt to submit form
9. Verify system error: "Diagnostic Findings is required"
10. Enter findings: "Original fault P0420 - Faulty oxygen sensor confirmed"
11. Verify "Photos" section shows 0 images
12. Attempt to submit form without photos
13. Verify system error: "Minimum 3 photos required"
14. Capture 3 photos of repair work
15. Verify photos upload successfully
16. Verify all required fields now have data
17. Verify "Submit" button enabled
18. Attempt to submit without digital signature
19. Verify system prompts for signature capture
20. Provide digital signature on signature pad
21. Verify signature captured and stored
22. Tap "Submit Work Order"

#### Expected Results:
- Form validates all required fields
- Clear error messages for missing fields
- Cannot submit with incomplete data
- Photos upload successfully
- Digital signature required and captured
- Form submission succeeds with all data
- Confirmation message displays

#### Acceptance Criteria:
- All required field validation working
- Error messages clear and actionable
- Photo upload function works
- Minimum 3 photos enforced
- Digital signature mandatory
- Form prevents submission with incomplete data
- Success message shows upon completion

#### Test Data:
```
Work Order: WO-2025-1848
Required Fields:
- Work Summary: "Replaced oxygen sensor..."
- Parts Used: ["Oxygen Sensor", "Dielectric Grease"]
- Diagnostic Findings: "P0420 - Faulty O2 sensor"
- Photos: 3+ images
- Signature: Digital signature captured

Calculated Costs:
- Labor: 3.25 hours × $75/hr = $243.75
- Parts: $148.50 + $12.00 = $160.50
- Total: $404.25
```

---

## Epic 2: Parts Inventory and Ordering

### TC-MT-006: Parts Availability Search and Real-Time Inventory Check

**Test Case ID**: TC-MT-006
**Test Case Name**: Parts Availability Search and Real-Time Inventory Check
**Related US**: US-MT-004 (Parts Inventory Check and Reservation)
**Related UC**: UC-MT-004 (Check Parts Availability and Reserve)
**Priority**: High
**Test Type**: Functional

#### Preconditions:
- Technician is working on active work order
- Parts inventory system is operational
- Real-time inventory data available
- Technician has access to mobile app or web dashboard

#### Test Steps:
1. Navigate to "Check Parts" on work order
2. Enter part search criteria: Part #LSU04-0259
3. System searches parts database
4. Verify results display: Part name, quantity on hand, locations
5. Verify inventory shows: Main Depot (8 units), Boston Warehouse (12 units)
6. Verify location details: "Bay B12 - 3 minutes walk"
7. Verify pricing displayed: "$148.50 per unit"
8. Try alternative search: Barcode scan of part label
9. Verify system recognizes barcode and returns same part
10. Try partial search: "Oxygen Sensor"
11. Verify multiple results displayed with compatible alternatives
12. Select primary part and verify selection confirmation
13. Verify inventory updates in real-time if stock changes
14. Search for out-of-stock part: "Transmission Filter TF-440A"
15. Verify system shows: "0 units at Main Depot"
16. Verify alternative parts suggested: "Equivalent: Denso 234-9010 (4 units in stock)"

#### Expected Results:
- Part search works by part number, barcode, and description
- Real-time inventory levels accurate
- Multiple location inventory visible
- Pricing displayed correctly
- Alternative parts suggested when primary unavailable
- Search completion <2 seconds
- Barcode scanning works reliably

#### Acceptance Criteria:
- All search methods functional
- Inventory accurate within 30 seconds
- Location information helpful
- Pricing correct
- Alternative parts appropriate
- UI responsive during search
- No data loss on network interruption

#### Test Data:
```
Primary Part: LSU04-0259 (Bosch Oxygen Sensor)
Search Methods: Part number, barcode, description
Inventory:
  - Main Depot: 8 units, Bay B12
  - Boston Warehouse: 12 units
  - Philadelphia Depot: 0 units
Price: $148.50/unit
Alternative: Denso 234-9010 ($132.00)

Out of Stock: TF-440A (Transmission Filter)
Alternative: Denso TF-440 equivalent
```

---

### TC-MT-007: Parts Reservation and Expiration Handling

**Test Case ID**: TC-MT-007
**Test Case Name**: Parts Reservation and Expiration Handling
**Related US**: US-MT-004 (Parts Inventory Check and Reservation)
**Related UC**: UC-MT-004 (Check Parts Availability and Reserve)
**Priority**: High
**Test Type**: Functional

#### Preconditions:
- Technician has located available part
- Parts inventory system with reservation capability
- System clock functional and accurate
- Mobile device with time synchronization

#### Test Steps:
1. Select part for reservation: LSU04-0259
2. Click "Reserve Part" button
3. Verify system creates reservation
4. Verify confirmation message: "Reserved for 2 hours - Expires 3:30 PM"
5. Verify location details: "Bay B12"
6. Navigate away from parts screen
7. After 1 hour 45 minutes, verify part still reserved
8. Attempt to view work order at 3:25 PM
9. Verify reservation still active: "Reserved - Expires 3:30 PM (5 minutes)"
10. Retrieve part from Bay B12 before expiration
11. Scan part barcode to issue from inventory
12. Verify system confirms issue: "Part issued to WO-2025-1848"
13. Let time advance to 3:35 PM (5 minutes past expiration)
14. Simulate unretrieved reservation
15. Verify system auto-releases: "Part LSU04-0259 reservation expired"
16. Verify inventory available again: "8 units available"
17. System notifies technician: "Your reservation expired - re-reserve if needed"

#### Expected Results:
- Reservation created successfully
- Reservation timer displays accurately
- Reservation holds part for 2 hours
- Auto-release occurs at expiration
- Notification sent at expiration
- Expired parts re-available for other technicians
- Inventory count updated correctly

#### Acceptance Criteria:
- Reservation time accurate
- Auto-expiration works after 2 hours
- Notification sent to technician
- Inventory restored after expiration
- No manual intervention needed
- Clear messaging about reservation status

#### Test Data:
```
Part: LSU04-0259
Quantity: 1 unit
Reservation Time: 2 hours
Creation Time: 1:30 PM
Expiration Time: 3:30 PM
Work Order: WO-2025-1848
Technician: Alex (T-001)
```

---

### TC-MT-008: Parts Issue Transaction and Inventory Update

**Test Case ID**: TC-MT-008
**Test Case Name**: Parts Issue Transaction and Inventory Update
**Related US**: US-MT-005 (Parts Issue and Return)
**Related UC**: UC-MT-005 (Issue and Return Parts from Inventory)
**Priority**: High
**Test Type**: Functional

#### Preconditions:
- Part is reserved or located in inventory
- Barcode scanner available
- Work order is active
- Inventory system operational

#### Test Steps:
1. Navigate to parts location Bay B12
2. Retrieve part and scan barcode: LSU04-0259
3. System displays: "Bosch Oxygen Sensor - Quantity available: 8"
4. Select quantity: 1 unit
5. Verify system prompts: "Confirm issue to WO-2025-1848?"
6. Confirm issue
7. Verify transaction record created:
   - Transaction ID: PRT-2025-8471
   - Type: ISSUE
   - Part: LSU04-0259
   - Quantity: 1
   - Issued to: Alex (Technician)
   - Work order: WO-2025-1848
   - Time: 2:45 PM
8. Verify inventory updated: 8 → 7 units
9. Verify part cost added to work order: $148.50
10. Navigate to work order to verify part linked
11. Verify part shows in "Parts Used" section
12. Complete work order with this part
13. Verify part cost reflected in final invoice

#### Expected Results:
- Barcode scan recognized correctly
- Quantity selection works
- Confirmation required before issue
- Transaction recorded with all details
- Inventory updated in real-time
- Cost added to work order
- Part linked to correct work order
- No duplicate entries

#### Acceptance Criteria:
- Transaction recorded accurately
- Inventory levels correct
- Cost calculations accurate
- Work order tracking correct
- No orphaned transactions
- History maintained for audit

#### Test Data:
```
Part: LSU04-0259 (Bosch Oxygen Sensor)
Barcode: [barcode image]
Initial Inventory: 8 units
Quantity Issued: 1
Final Inventory: 7 units
Cost/Unit: $148.50
Work Order: WO-2025-1848
Technician: Alex
```

---

### TC-MT-009: Parts Return and Inventory Correction

**Test Case ID**: TC-MT-009
**Test Case Name**: Parts Return and Inventory Correction
**Related US**: US-MT-005 (Parts Issue and Return)
**Related UC**: UC-MT-005 (Issue and Return Parts from Inventory)
**Priority**: Medium
**Test Type**: Functional

#### Preconditions:
- Part has been issued to work order
- Part is unused or defective
- Barcode available for return
- Return window within 24 hours of issue

#### Test Steps:
1. Technician takes 2 brake pads from inventory
2. System issues: 2 units of brake pad (Part #BP-220)
3. Installation begins, technician installs 1 brake pad
4. 1 brake pad remains unused
5. Technician returns to parts area with unused pad
6. Scan barcode on unused brake pad
7. System displays: "Return unused part to inventory?"
8. Confirm return
9. Verify return transaction recorded:
   - Transaction ID: PRT-2025-8472
   - Type: RETURN
   - Part: BP-220
   - Quantity: 1
   - Returned by: Alex
   - Work order: WO-2025-1848
   - Time: 3:15 PM
10. Verify inventory updated: 6 → 7 units
11. Verify work order cost adjusted: 2 × $45 → 1 × $45 = $45
12. Complete work order and verify final cost reflects 1 brake pad only

#### Expected Results:
- Return transaction recorded
- Inventory restored for returned part
- Work order cost adjusted
- Transaction history complete
- No inventory discrepancies
- Cost calculation corrected

#### Acceptance Criteria:
- Return accepted within 24 hours
- Inventory accurate after return
- Cost recalculated correctly
- Transaction audit trail complete
- System prevents return of used parts (if applicable)

#### Test Data:
```
Part: BP-220 (Brake Pads)
Issued Quantity: 2
Used Quantity: 1
Returned Quantity: 1
Cost/Unit: $45.00
Initial Inventory: 6
After Issue: 4
After Return: 5
Work Order Cost: 1 × $45.00 = $45.00
```

---

### TC-MT-010: Emergency Parts Ordering and Approval Workflow

**Test Case ID**: TC-MT-010
**Test Case Name**: Emergency Parts Ordering and Approval Workflow
**Related US**: US-MT-006 (Emergency Parts Ordering)
**Related UC**: UC-MT-006 (Request Emergency Parts Ordering)
**Priority**: Medium
**Test Type**: Functional

#### Preconditions:
- Critical part is out of stock
- Work order is active and time-sensitive
- Parts manager has approval authority
- Vendor integration operational

#### Test Steps:
1. Technician identifies need for part TF-440A
2. Check inventory: "0 units in stock"
3. Click "Request Emergency Order"
4. System displays emergency parts request form
5. Select part: TF-440A (Transmission Fluid Filter)
6. Specify urgency: "Same-day needed"
7. System checks vendor availability:
   - Vendor 1: Same-day, cost $89 + $25 rush
   - Vendor 2: Next-day, cost $89
8. Technician selects: "Vendor 1 - Same-day"
9. System calculates total: $114
10. Technician adds justification: "Vehicle in shop - customer waiting"
11. Click "Request Approval"
12. System routes to Parts Manager
13. Parts Manager Mike receives notification
14. Parts Manager reviews request
15. Parts Manager approves: "Approved - Vendor 1 - Same-day"
16. System places order: PO #PO-2025-4521
17. System sends tracking info: "Delivery ETA: 2:30 PM, Tracking: RUSH-98765"
18. System notifies technician: "Parts ordered - arrival expected 2:30 PM"
19. Parts arrive on time
20. Technician receives notification: "Emergency part TF-440A arriving"
21. Verify cost added to work order: $114 (part + rush fee)

#### Expected Results:
- Emergency order request submitted successfully
- Vendor options display with pricing
- Approval workflow functions
- Approval decision made within 15 minutes
- Order placed with vendor automatically
- Tracking information provided
- Technician notified of delivery
- Cost added to work order with rush charge visible

#### Acceptance Criteria:
- Emergency request process intuitive
- Approval workflow quick (<15 min)
- Vendor integration working
- Tracking updates accurate
- Cost transparency clear
- Notification received on time

#### Test Data:
```
Part: TF-440A (Transmission Fluid Filter)
Inventory: 0 units
Urgency: Same-day
Vendor Options:
  1. Same-day delivery: $89 + $25 rush = $114
  2. Next-day: $89
  3. 2-day: $85
Selected: Vendor 1
Approval: Yes
Justification: Valid
PO #: PO-2025-4521
ETA: 2:30 PM
Status: Delivered on time
```

---

## Epic 3: Preventive Maintenance Execution

### TC-MT-011: PM Checklist Execution and Task Validation

**Test Case ID**: TC-MT-011
**Test Case Name**: PM Checklist Execution and Task Validation
**Related US**: US-MT-007 (PM Schedule and Checklist Execution)
**Related UC**: UC-MT-007 (Execute Preventive Maintenance Checklist)
**Priority**: High
**Test Type**: Functional

#### Preconditions:
- PM work order assigned for specific vehicle
- Vehicle-specific digital checklist available
- Vehicle is in maintenance bay
- Manufacturer specifications current

#### Test Steps:
1. Open PM work order: WO-2025-1850 (50K mile Service A)
2. Verify vehicle specification: "Freightliner Cascadia - 2022"
3. Scan vehicle barcode to confirm
4. System loads digital PM checklist
5. Verify checklist organized by system: Engine, Air, Transmission, Brakes, etc.
6. Verify first task displays: "Change engine oil and filter"
7. Verify detailed instructions visible
8. Verify safety warning displayed: "⚠ Hot oil - allow engine cool"
9. Verify specifications shown: "5 quarts 15W-40 synthetic"
10. Verify estimated time: "15 minutes"
11. Complete oil change task
12. Click "Mark Complete"
13. System prompts: "Capture photo as documentation"
14. Capture photo of new oil filter
15. Photo uploads successfully
16. System displays next task
17. Continue through multiple tasks with varying requirements
18. For measurement task (brake pad): Enter reading "2.2 mm"
19. System validates against spec: "Minimum: 1.5 mm"
20. System displays: "✓ Within specification"
21. For out-of-spec item (tire pressure): Record "75 psi" (Spec: 80 psi)
22. System alerts: "⚠ Low - Adjust"
23. Make correction and re-record: "80 psi"
24. System validates: "✓ Within specification"
25. Complete all 25 PM tasks
26. System displays summary:
    - Service Completed: 25/25 tasks
    - Time spent: 2 hours 45 minutes
    - Issues found: None
    - Follow-up required: No
27. Provide digital signature for completion
28. System generates PM report with photos and measurements

#### Expected Results:
- Checklist loads specific to vehicle type
- All tasks display with instructions and specs
- Measurements validated against specifications
- Photos captured and stored
- Out-of-spec items flagged for correction
- Comprehensive summary generated
- Report includes all documentation
- Digital signature captured and stored

#### Acceptance Criteria:
- Checklist complete and accurate
- All tasks functional
- Validation rules working
- Photo upload successful
- Signature required and captured
- Report generation complete
- Next PM date calculated and scheduled

#### Test Data:
```
Vehicle: Freightliner Cascadia #445 (2022)
Service Type: Service A (50K mile interval)
Work Order: WO-2025-1850
Tasks: 25 total
Completed: 25
Failed: 0
Time: 2 hours 45 minutes
Photos: 8 captured
Measurements: 12 readings, all within spec
Next PM: 100,000 miles or Aug 15, 2026
```

---

### TC-MT-012: Out-of-Spec Measurement Detection and Correction

**Test Case ID**: TC-MT-012
**Test Case Name**: Out-of-Spec Measurement Detection and Correction
**Related US**: US-MT-007 (PM Schedule and Checklist Execution)
**Related UC**: UC-MT-007 (Execute Preventive Maintenance Checklist)
**Priority**: High
**Test Type**: Functional

#### Preconditions:
- PM checklist active with measurement tasks
- Measurement task requires numeric input
- Specification ranges defined
- Digital signature capability available

#### Test Steps:
1. PM task: "Check engine oil pressure"
2. Specification displayed: "50-65 psi at idle"
3. Technician records reading: "42 psi"
4. System analyzes: "⚠ LOW - Below specification (50-65 psi)"
5. System displays alert and prevents marking "Complete"
6. Technician must take corrective action
7. Technician notes: "Low pressure detected - engine condition suspect"
8. System creates flag: "⚠ Follow-up: Engine pressure investigation"
9. Technician performs additional check (engine compression test)
10. Retakes pressure reading: "56 psi"
11. System validates: "✓ Within specification (50-65 psi)"
12. System allows task to be marked "Complete"
13. Continue with next task: "Check brake pad thickness"
14. Specification: "Minimum: 1.5 mm"
15. Technician measures: "1.2 mm"
16. System alerts: "⚠ BELOW MINIMUM - Brake pads worn"
17. System blocks task completion
18. Technician applies corrective action: "Replace brake pads"
19. After replacement, retake measurement: "8.0 mm"
20. System validates: "✓ Within specification"
21. Mark task complete
22. System tracks all corrective actions
23. PM summary shows: "2 out-of-spec items found and corrected"
24. Sign off on PM completion

#### Expected Results:
- Out-of-spec measurements detected
- Alerts prevent task completion
- Technician forced to correct issues
- All corrective actions tracked
- Measurements re-validated
- Summary documents all corrections
- No work-arounds possible

#### Acceptance Criteria:
- Measurement validation working
- Out-of-spec prevention enforced
- Clear alert messaging
- Correction process documented
- Final measurements validated
- PM summary accurate
- Audit trail complete

#### Test Data:
```
Measurement 1: Oil Pressure
- Specification: 50-65 psi
- Initial Reading: 42 psi (FAIL)
- Corrective Action: Engine inspection
- Final Reading: 56 psi (PASS)

Measurement 2: Brake Pad Thickness
- Specification: >1.5 mm
- Initial Reading: 1.2 mm (FAIL)
- Corrective Action: Replace pads
- Final Reading: 8.0 mm (PASS)

PM Result: 25 tasks complete, 2 items corrected
```

---

### TC-MT-013: Fluid Analysis Sample Collection and Labeling

**Test Case ID**: TC-MT-013
**Test Case Name**: Fluid Analysis Sample Collection and Labeling
**Related US**: US-MT-008 (Fluid Analysis Sample Collection)
**Related UC**: UC-MT-008 (Collect Fluid Analysis Samples)
**Priority**: Medium
**Test Type**: Functional

#### Preconditions:
- PM checklist indicates fluid sampling required
- Sample bottles with barcodes available
- Fluid analysis lab integration operational
- Bluetooth label printer available

#### Test Steps:
1. PM reaches Fluid Analysis section
2. System displays: "Collect engine oil sample for analysis"
3. Specify sample requirements:
   - Type: Engine oil
   - Container: Glass vial
   - Minimum: 50 mL
   - Sampling point: From oil dipstick
4. Technician retrieves sample bottle
5. Scan barcode on sample bottle
6. System links barcode to vehicle and service:
   - Vehicle ID: #445
   - Service: Oil analysis
   - Mileage: 50,000
   - Date: 11/10/2025
7. Technician collects oil sample during oil change
8. Technician records observations:
   - Color: Dark brown (normal)
   - Odor: Slight burning (normal)
   - Viscosity: Normal
   - Contamination: None visible
9. System generates sample label with all details
10. Technician affixes label to sample bottle
11. Technician places sample in shipping envelope
12. Scan barcode on envelope
13. System creates tracking record:
    - Tracking #: LAB-SAMPLE-98765
    - Expected delivery: Nov 11
    - Expected results: Nov 15 (5-day turnaround)
14. Place envelope in outbound shipment bin
15. Monitor tracking status in system
16. Lab receives sample: Tracking updated to "Received"
17. Technician notified: "Oil analysis sample received - results expected by Nov 15"
18. Lab completes analysis by Nov 15
19. Lab results received in system
20. Results display: TAN, Viscosity, Iron content, Water content
21. Results linked to vehicle history
22. Next oil analysis scheduled for 100,000 miles

#### Expected Results:
- Sample collection process intuitive
- Barcode linking automatic
- Label generation accurate
- Tracking integration working
- Results received on schedule
- Results linked to vehicle history
- Notifications timely

#### Acceptance Criteria:
- Sample tracking accurate
- Label information correct
- Barcode linking successful
- Lab results received
- Results displayed clearly
- Tracking timeframe met
- Historical records maintained

#### Test Data:
```
Vehicle: Freightliner Cascadia #445
Sample Type: Engine Oil
Collection Date: 11/10/2025
Mileage: 50,000
Sample Barcode: [barcode]
Tracking #: LAB-SAMPLE-98765
Shipped: 11/10/2025
Received: 11/11/2025
Expected Results: 11/15/2025
Results:
  - TAN: 2.8 (Normal: <3.0)
  - Viscosity: 35 cSt (Normal: 30-40)
  - Iron: 42 ppm (Normal: <50)
```

---

## Epic 4: Diagnostic and Repair Documentation

### TC-MT-014: OBD-II Adapter Connection and DTC Reading

**Test Case ID**: TC-MT-014
**Test Case Name**: OBD-II Adapter Connection and DTC Reading
**Related US**: US-MT-009 (OBD-II Diagnostic Code Reading and Analysis)
**Related UC**: UC-MT-009 (Read and Analyze Diagnostic Trouble Codes)
**Priority**: High
**Test Type**: Functional

#### Preconditions:
- Vehicle is equipped with OBD-II port
- Technician has Bluetooth OBD-II adapter
- Mobile app has diagnostic scanning capability
- Vehicle has active fault codes

#### Test Steps:
1. Technician retrieves Bluetooth OBD-II adapter
2. Connect adapter to vehicle OBD-II port
3. Open diagnostic app on mobile device
4. System scans for available Bluetooth devices
5. Select OBD-II adapter from list
6. Verify Bluetooth connection successful
7. System displays: "OBD-II Adapter Connected - Vehicle: 2022 Freightliner Cascadia"
8. Tap "Read Diagnostic Codes"
9. System scans vehicle for active and pending codes
10. Verify system displays Diagnostic Code Report:
    - Code: P0420
    - Description: Catalyst System Efficiency Below Threshold
    - Severity: Warning (yellow)
    - First detected: 3 days ago
    - Occurrence count: 1
11. Display common causes for P0420:
    - Faulty downstream O2 sensor
    - Catalytic converter failure
    - Exhaust leak
12. View freeze frame data:
    - Engine load: 45%
    - Coolant temp: 195°F
    - Oxygen sensor voltage: 0.1V (low)
    - Fuel trim: +8%
13. View live data stream:
    - Bank 1 O2 sensor voltage: 0.15V (should vary 0.0-1.0V)
    - Bank 2 O2 sensor voltage: 0.82V (normal)
    - Converter temp: 385°C (normal)
14. Verify system provides troubleshooting flowchart
15. Follow flowchart steps for diagnosis
16. Diagnose faulty O2 sensor
17. Replace oxygen sensor
18. Clear fault code P0420 via adapter
19. Verify code cleared: "Code deleted from vehicle memory"
20. Perform test drive (5 miles)
21. Rescan vehicle after test drive
22. Verify result: "✓ No active fault codes detected"

#### Expected Results:
- Bluetooth adapter connects successfully
- All active and pending codes display
- Code details accurate and complete
- Freeze frame data readable
- Live data stream updates in real-time
- Troubleshooting flowchart provided
- Code clearing successful
- Post-repair scan confirms fix

#### Acceptance Criteria:
- Adapter connection reliable
- Code reading accurate
- Data display clear and organized
- Flowchart functional
- Code clearing successful
- No false readings
- Scan time <5 seconds per code

#### Test Data:
```
Vehicle: 2022 Freightliner Cascadia #567
OBD Protocol: ISO 15765
Active Codes:
  - P0420: Catalyst System Efficiency Below Threshold

Freeze Frame:
  - Engine Load: 45%
  - Coolant Temp: 195°F
  - O2 Voltage: 0.1V (low)
  - Fuel Trim: +8%

Live Data:
  - Bank 1 O2: 0.15V (static - faulty)
  - Bank 2 O2: 0.82V (normal)
  - Converter Temp: 385°C (normal)

Diagnosis: Faulty O2 sensor
Repair: Sensor replacement
Post-repair: No codes
```

---

### TC-MT-015: Fault Code Troubleshooting and Root Cause Analysis

**Test Case ID**: TC-MT-015
**Test Case Name**: Fault Code Troubleshooting and Root Cause Analysis
**Related US**: US-MT-009 (OBD-II Diagnostic Code Reading and Analysis)
**Related UC**: UC-MT-009 (Read and Analyze Diagnostic Trouble Codes)
**Priority**: High
**Test Type**: Functional

#### Preconditions:
- Vehicle has multiple fault codes
- OBD-II adapter connected
- Technician has advanced diagnostic experience
- Access to repair procedures and TSBs

#### Test Steps:
1. Vehicle presents with 3 fault codes:
   - P0420: Catalyst System Efficiency
   - P0130: O2 Sensor Circuit
   - P0101: Mass Airflow Sensor
2. System displays all codes in order of severity
3. System analyzes: "Potential common cause - O2 sensor may cause both P0420 and P0130"
4. System suggests: "Start with P0130 O2 sensor - may fix other codes"
5. Follow diagnostic flowchart for P0130:
   - Step 1: Test O2 sensor signal
   - Step 2: Check sensor wiring and connectors
   - Step 3: Test PCM input
6. Technician performs Step 1: "O2 sensor voltage static at 0.15V"
7. Diagnosis: "Faulty O2 sensor confirmed"
8. Step 2: Inspect wiring - "No issues found"
9. Determine root cause: "O2 sensor failure is primary issue"
10. Replace O2 sensor
11. Clear code P0130
12. Test drive and rescan
13. Results show:
    - P0130: ✓ Resolved
    - P0420: ✓ Resolved (common cause)
    - P0101: ✗ Still present
14. Focus on P0101 Mass Airflow Sensor
15. Check air filter: "Heavily contaminated"
16. Replace air filter
17. Clear code P0101
18. Test drive and rescan
19. Verify: "✓ All codes resolved"
20. Document in report: Root cause analysis showing cascade effect

#### Expected Results:
- Multiple codes analyzed for common cause
- Root cause identification accurate
- Troubleshooting flowchart functional
- Diagnostic steps logical
- Code resolution confirmed
- Cascade effects documented
- Final report complete and accurate

#### Acceptance Criteria:
- Common cause analysis working
- Troubleshooting efficient
- Root cause identified correctly
- All codes resolved
- Documentation complete
- Report shows diagnostic logic
- Post-repair verification successful

#### Test Data:
```
Vehicle: 2022 Freightliner Cascadia
Codes:
  1. P0420: Catalyst System Efficiency
  2. P0130: O2 Sensor Circuit (PRIMARY)
  3. P0101: Mass Airflow Sensor (SECONDARY)

Root Cause Analysis:
  - Primary: Faulty O2 sensor
  - Secondary: Contaminated air filter
  - Cascade: O2 sensor failure caused P0420

Repairs:
  1. Replace O2 sensor → Resolves P0420 and P0130
  2. Replace air filter → Resolves P0101

Post-Repair: All codes cleared, test drive successful
```

---

### TC-MT-016: Warranty Claim Documentation and Photo Evidence

**Test Case ID**: TC-MT-016
**Test Case Name**: Warranty Claim Documentation and Photo Evidence
**Related US**: US-MT-010 (Warranty Claim Documentation)
**Related UC**: UC-MT-010 (Document Warranty Claims and Submit)
**Priority**: Medium
**Test Type**: Functional

#### Preconditions:
- Vehicle is under manufacturer warranty
- Component failure is warranty-eligible
- Photos of failed component available
- Maintenance records current

#### Test Steps:
1. Discover component failure: Alternator dead
2. Check vehicle warranty status:
   - Vehicle: 2022 Freightliner Cascadia
   - Powertrain: 3 years / 300,000 miles
   - Electrical: 3 years / 100,000 miles
3. Verify alternator covered: "Electrical warranty"
4. Check eligibility:
   - Purchase date: 11/10/2020
   - Current date: 11/10/2025 (5 years - EXPIRED by time)
   - Mileage: 75,000 / 100,000 (within limit)
   - Status: ⚠ Out of time but within mileage
5. Create warranty claim: WO-2025-1851
6. Capture required photos:
   - Photo 1: Failed alternator removed from vehicle
   - Photo 2: Seized bearing evident
   - Photo 3: OEM part number visible
   - Photo 4: New replacement alternator installed
7. Document failure description:
   - Component: Alternator (Bosch OEM #000123)
   - Failure mode: Output voltage dropping <12V
   - Description: "Bearing seized - unit dead"
   - Failure date: 11/10/2025
   - Mileage: 75,000 miles
8. Generate warranty claim package:
   - Claim #: WARRANTY-2025-1847
   - Component: Alternator
   - Cost: $485 (parts + labor)
   - Warranty value: $485 (if approved)
9. Document maintenance history:
   - Oil changes: Current and on schedule
   - Service intervals: Followed per OEM
   - No missed maintenance
10. Add justification: "Premature alternator failure - proper maintenance documented"
11. Submit claim to manufacturer portal
12. System routes claim to Freightliner warranty
13. Manufacturer receives and reviews claim
14. Manufacturer decision: "APPROVED - Goodwill coverage 80%"
15. Reimbursement: $388 (80% of $485)
16. Customer responsibility: $97
17. System tracks payment received
18. Work order marked complete

#### Expected Results:
- Photos captured and stored securely
- Claim documentation complete
- Warranty eligibility determined correctly
- Claim submitted successfully
- Manufacturer decision received
- Reimbursement processed
- Customer cost calculated correctly

#### Acceptance Criteria:
- Photo evidence clear and complete
- Failure documentation thorough
- Claim submission successful
- Approval tracking functional
- Cost breakdown accurate
- Audit trail complete

#### Test Data:
```
Vehicle: 2022 Freightliner Cascadia #445
Warranty: Electrical (3 years / 100K miles)
Purchase Date: 11/10/2020
Current: 11/10/2025 (5 years - time expired)
Mileage: 75,000 miles (within limit)

Component: Alternator (Bosch #000123)
Failure: Bearing seized - no output
Failure Date: 11/10/2025

Claim: WARRANTY-2025-1847
Repair Cost: $485
Approved: Yes (80% goodwill)
Reimbursement: $388
Customer Cost: $97
```

---

## Epic 5: Equipment and Tool Management

### TC-MT-017: Tool Checkout and Calibration Status Verification

**Test Case ID**: TC-MT-017
**Test Case Name**: Tool Checkout and Calibration Status Verification
**Related US**: US-MT-011 (Tool and Equipment Checkout)
**Related UC**: UC-MT-011 (Check Out Tools and Equipment)
**Priority**: Low
**Test Type**: Functional

#### Preconditions:
- Tool inventory system operational
- Tools have barcodes assigned
- Barcode scanner available
- Tool tracking system connected

#### Test Steps:
1. Begin transmission diagnostic work (WO-2025-1852)
2. Navigate to tool storage area
3. Search for "Transmission dipstick gauge"
4. System displays available tools:
   - Tool ID: TL-445
   - Description: Transmission Fluid Level Gauge
   - Status: Available
   - Location: Tool rack, position B3
   - Last calibration: 10/15/2025 (current)
5. Walk to Tool rack position B3
6. Scan barcode on tool: TL-445
7. System displays: "Transmission Dipstick Gauge - Checkout to Alex?"
8. Confirm checkout
9. System records checkout:
   - Tool: TL-445
   - Technician: Alex
   - Work order: WO-2025-1852
   - Checkout time: 8:35 AM
   - Expected return: Today
   - Calibration: ✓ Current (due 01/15/2026)
10. Technician takes tool and proceeds with work
11. Use tool for transmission dipstick check
12. Work order completed at 11:45 AM
13. Return tool to storage
14. Scan tool barcode: TL-445
15. System displays: "Return tool TL-445?"
16. Confirm return
17. System records return:
    - Tool: TL-445
    - Checkout duration: 3 hours 10 minutes
    - Return time: 11:46 AM
    - Condition: Good (no damage)
18. System updates tool availability
19. System displays summary:
    - Tool used for: WO-2025-1852
    - Duration: 3 hrs 10 min
    - Condition: Good

#### Expected Results:
- Tool search finds available tools
- Calibration status displayed
- Barcode checkout successful
- Checkout duration tracked
- Return processed successfully
- Tool availability updated
- No tools lost or misplaced

#### Acceptance Criteria:
- Tool search functional
- Calibration status accurate
- Checkout/return seamless
- Duration tracking accurate
- Tool condition noted
- Availability updated in real-time
- Audit trail complete

#### Test Data:
```
Tool: TL-445 (Transmission Dipstick Gauge)
Status: Available
Location: Rack B3
Calibration: Current (expires 01/15/2026)
Checkout: 8:35 AM
Return: 11:46 AM
Duration: 3 hours 10 minutes
Condition: Good
Work Order: WO-2025-1852
Technician: Alex (T-001)
```

---

### TC-MT-018: Tool Calibration Alert and Overdue Management

**Test Case ID**: TC-MT-018
**Test Case Name**: Tool Calibration Alert and Overdue Management
**Related US**: US-MT-011 (Tool and Equipment Checkout)
**Related UC**: UC-MT-011 (Check Out Tools and Equipment)
**Priority**: Low
**Test Type**: Functional

#### Preconditions:
- Tool inventory system with calibration tracking
- Tools with calibration schedules
- Notification system operational
- Tool manager available

#### Test Steps:
1. Technician attempts to checkout precision torque wrench
2. System checks tool: TL-520 (Torque Wrench 25-150 Nm)
3. System displays calibration status:
   - Last calibration: 10/01/2025
   - Due calibration: 01/01/2026
   - Days until due: 52 days
4. Calibration is current - checkout allowed
5. Try to checkout pressure gauge: TL-615
6. System displays warning:
   - Last calibration: 09/01/2025
   - Due calibration: 12/01/2025
   - Days until due: 21 days
   - Status: ⚠ EXPIRING SOON
7. System allows checkout but displays alert:
   - "⚠ Calibration expires in 21 days"
   - "Tool can be used but schedule recalibration"
8. Technician proceeds with checkout
9. Tool manager receives automatic notification:
   - Tool: TL-615 needs calibration within 21 days
10. Checkout pressure gauge for use
11. Attempt to checkout flow meter: TL-730
12. System displays:
    - Last calibration: 05/01/2025
    - Due calibration: 08/01/2025
    - Days until due: -101 days (OVERDUE)
    - Status: ✗ CALIBRATION OVERDUE
13. System blocks checkout: "Tool calibration overdue - cannot use"
14. Tool removed from service: "DO NOT USE - Calibration overdue"
15. Tool manager notified immediately
16. Tool manager schedules calibration service
17. Tool sent for recalibration
18. Upon return with current calibration cert, tool re-enabled

#### Expected Results:
- Calibration status tracked accurately
- Warning alerts for soon-to-expire calibration
- Checkout blocked for overdue calibration
- Notifications sent proactively
- Tool removed from service when overdue
- Calibration history maintained

#### Acceptance Criteria:
- Calibration dates tracked accurately
- Alerts generated 30+ days before expiration
- Overdue tools blocked from use
- Notifications timely
- Tool manager notified automatically
- Audit trail maintained

#### Test Data:
```
Tool 1: TL-520 (Torque Wrench)
  Last Calibration: 10/01/2025
  Due: 01/01/2026 (52 days remaining) → ALLOW

Tool 2: TL-615 (Pressure Gauge)
  Last Calibration: 09/01/2025
  Due: 12/01/2025 (21 days remaining) → WARN

Tool 3: TL-730 (Flow Meter)
  Last Calibration: 05/01/2025
  Due: 08/01/2025 (101 days overdue) → BLOCK
```

---

### TC-MT-019: Safety Equipment Inspection Checklist Execution

**Test Case ID**: TC-MT-019
**Test Case Name**: Safety Equipment Inspection Checklist Execution
**Related US**: US-MT-012 (Safety Equipment Inspection)
**Related UC**: UC-MT-012 (Perform Safety Equipment Inspections)
**Priority**: Medium
**Test Type**: Functional

#### Preconditions:
- Safety inspection schedule is current
- Equipment available in shop
- Digital safety checklist loaded
- Technician is qualified for inspections

#### Test Steps:
1. System generates daily safety inspection reminder: 7:30 AM
2. Acknowledge reminder and open safety inspection WO: WO-SAFETY-DAILY-001
3. System displays daily safety checklist:
   - Hydraulic Lifts (3 items)
   - Air Compressor System (3 items)
   - Emergency Equipment (3 items)
   - General Shop Safety (3 items)
4. Begin Lift #1 inspection:
   - Visual check: No damage → ✓ PASS
   - Operational: Lifts smoothly → ✓ PASS
   - Safety valve: Relief correct → ✓ PASS
5. Document with photos - all pass
6. Inspect Lift #2 and #3 - both pass
7. Inspect air compressor:
   - Pressure gauge: 125 psi (Spec: 100-130) → ✓ PASS
   - Safety relief: Functions → ✓ PASS
   - Hoses: No cracks → ✓ PASS
8. Document pressure reading: "125 psi"
9. Check emergency equipment:
   - Fire extinguisher #1: Last serviced 03/2025 → ✓ PASS
   - Fire extinguisher #2: Last serviced 06/2024 → ✗ FAIL (OVERDUE)
   - First aid kit: Current → ✓ PASS
   - Eye wash: Functional → ✓ PASS
10. System flags fire extinguisher #2: "FAILED - Overdue service"
11. Create alert: "Fire extinguisher #2 requires service - SCHEDULE IMMEDIATELY"
12. Complete general shop safety:
    - Main aisle clear → ✓ PASS
    - Electrical outlets: Good → ✓ PASS
    - Emergency exits: Clear → ✓ PASS
    - Slip hazards: None → ✓ PASS
13. Inspection summary:
    - Total items: 12
    - Passed: 11
    - Failed: 1
14. Create corrective action:
    - Item: Service fire extinguisher #2
    - Severity: Medium
    - Deadline: Before tomorrow
    - Assigned: Safety Manager
15. Provide digital signature
16. Mark fire extinguisher #2 "OUT OF SERVICE"
17. Inspection history maintained for OSHA compliance

#### Expected Results:
- Inspection checklist complete and organized
- All items inspected per schedule
- Failed items flagged automatically
- Corrective actions created
- Photos/readings documented
- Digital signature captured
- OSHA records maintained

#### Acceptance Criteria:
- Inspection process systematic
- Failed items immediately flagged
- Corrective actions documented
- Digital signature required
- Audit trail complete
- Next inspection scheduled
- Compliance records maintained

#### Test Data:
```
Inspection: Daily Safety (WO-SAFETY-DAILY-001)
Date: 11/10/2025
Technician: Alex (T-001)

Items Inspected: 12
- Hydraulic Lifts: 3 (all PASS)
- Air Compressor: 3 (all PASS)
- Emergency Equipment: 3 (2 PASS, 1 FAIL)
- General Safety: 3 (all PASS)

Failed Item: Fire Extinguisher #2
- Issue: Calibration overdue (last service 06/2024)
- Action: Schedule service immediately
- Status: OUT OF SERVICE

Summary: 11/12 PASS, 1/12 FAIL
```

---

### TC-MT-020: Critical Safety Equipment Failure Response

**Test Case ID**: TC-MT-020
**Test Case Name**: Critical Safety Equipment Failure Response
**Related US**: US-MT-012 (Safety Equipment Inspection)
**Related UC**: UC-MT-012 (Perform Safety Equipment Inspections)
**Priority**: High
**Test Type**: Functional

#### Preconditions:
- Safety inspection in progress
- Equipment malfunction detected
- Safety officer available
- Equipment lockout capability

#### Test Steps:
1. Monthly safety inspection scheduled
2. Technician inspects hydraulic lift #1
3. During operational check, discover:
   - Hydraulic fluid leaking from base
   - Pressure gauge fluctuating
   - Safety relief valve not responding
4. System recognizes critical failure:
   - Alert: "⚠ CRITICAL - Hydraulic lift failure detected"
5. Technician immediately stops inspection:
   - "Lift #1 is unsafe - discontinue use"
6. System marks equipment: "OUT OF SERVICE - DO NOT USE"
7. Technician creates work order: "URGENT - Repair hydraulic lift #1 - CRITICAL"
8. System sets priority: "CRITICAL"
9. System notifies Safety Officer immediately:
   - Alert sent via email, phone, and in-app
   - "Critical safety equipment failure - Hydraulic Lift #1"
   - Details: Fluid leak, pressure issues
10. Technician ropes off lift with "OUT OF SERVICE" warning
11. Safety Officer John receives notification within 2 minutes
12. Safety Officer acknowledges and reviews incident:
    - Equipment: Hydraulic Lift #1
    - Issue: Fluid leak and pressure failure
    - Risk: Load drop - safety hazard
    - Action required: Immediate repair before use
13. Safety Officer contacts maintenance contractor
14. Contractor inspects and repairs lift
15. Repair completed next morning
16. System receives repair completion notification
17. Safety Officer re-inspects lift to verify repair
18. Lift cleared for use: "✓ PASSED - Ready for service"
19. System removes "OUT OF SERVICE" flag
20. Incident logged for OSHA compliance

#### Expected Results:
- Critical failure detected immediately
- Equipment marked out of service automatically
- Safety officer notified within minutes
- Work order created with critical priority
- Equipment physically secured (roped off)
- Repair tracked to completion
- Return-to-service process verified
- Incident documented for audit

#### Acceptance Criteria:
- Failure detection automatic and accurate
- Immediate notification to safety officer
- Equipment lockout effective
- Critical work order created
- Repair tracking complete
- Verification process before return to service
- Full incident audit trail

#### Test Data:
```
Equipment: Hydraulic Lift #1
Failure: Fluid leak + pressure loss
Detection: During monthly inspection
Severity: CRITICAL
Response: Immediate

Timeline:
- 10:15 AM: Failure detected
- 10:16 AM: Equipment marked OUT OF SERVICE
- 10:18 AM: Safety Officer notified
- 10:30 AM: Safety Officer reviews incident
- 11:00 AM: Contractor contacted
- 11:30 AM: Contractor on-site
- 2:00 PM: Repair completed
- 2:30 PM: Verification passed
- 2:35 PM: Cleared for use

Incident: LOGGED for OSHA compliance
```

---

## Summary

### Test Case Statistics

**Total Test Cases**: 20 (of 25 planned)

**By Epic**:
1. Work Order Management: 5 test cases (TC-MT-001 to TC-MT-005)
2. Parts Inventory and Ordering: 5 test cases (TC-MT-006 to TC-MT-010)
3. Preventive Maintenance Execution: 3 test cases (TC-MT-011 to TC-MT-013)
4. Diagnostic and Repair Documentation: 3 test cases (TC-MT-014 to TC-MT-016)
5. Equipment and Tool Management: 4 test cases (TC-MT-017 to TC-MT-020)

**By Priority**:
- High Priority: 13 test cases
- Medium Priority: 5 test cases
- Low Priority: 2 test cases

**By Test Type**:
- Functional: 20 test cases
- Integration: Ready for expansion
- Performance: Ready for expansion
- Security: Ready for expansion

### Coverage Areas

#### Functional Coverage
- Mobile app work order queue and filtering
- Labor time tracking (start, pause, resume, stop)
- Vehicle barcode verification
- Emergency notifications and prioritization
- Work order completion with validation
- Parts search and availability
- Parts reservation with expiration
- Parts issue and inventory tracking
- Emergency parts ordering with approval
- PM checklist execution with validation
- OBD-II diagnostics and DTC reading
- Warranty claim documentation
- Tool checkout and calibration
- Safety inspections with failure detection

#### Data Validation
- Required field validation
- Numeric range validation (measurements, time)
- Calibration status tracking
- Inventory level accuracy
- Cost calculations
- Timestamp logging

#### Integration Points
- Mobile app connectivity
- Barcode scanning
- OBD-II adapter Bluetooth
- Parts inventory system
- Warranty portal submission
- Lab sample tracking
- Tool inventory system
- Safety equipment tracking

### Test Data Requirements

#### Vehicles
- Freightliner Cascadia #445 (2022) - PM vehicle
- Freightliner Cascadia #567 (2022) - Emergency/Diagnostic vehicle
- Standard fleet vehicles #234, #891 - Queue testing

#### Users
- Technician Alex (T-001) - Primary test user
- Parts Manager Mike - Approval workflows
- Safety Officer John - Safety inspections
- Dispatcher - Emergency assignments

#### Test Environment
- Mobile devices: iPhone, Android
- Barcode scanning capability
- Bluetooth connectivity
- Network connectivity (online/offline)
- Lab integration capability
- GPS/Navigation integration

---

## Related Documents

- **User Stories**: `user-stories/03_MAINTENANCE_TECHNICIAN_USER_STORIES.md`
- **Use Cases**: `use-cases/03_MAINTENANCE_TECHNICIAN_USE_CASES.md`
- **Workflows**: `workflows/03_MAINTENANCE_TECHNICIAN_WORKFLOWS.md`
- **API Specifications**: `api/maintenance-endpoints.md`

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-10 | Testing Team | Initial comprehensive test cases created |

---

*This document provides 20 comprehensive test cases covering all major Maintenance Technician features with detailed preconditions, test steps, expected results, and acceptance criteria.*
