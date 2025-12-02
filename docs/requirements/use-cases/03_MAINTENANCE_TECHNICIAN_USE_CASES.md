# Maintenance Technician - Use Cases

**Role**: Maintenance Technician
**Access Level**: Operational (Maintenance module focus)
**Primary Interface**: 70% Mobile, 30% Web Dashboard
**Version**: 1.0
**Date**: November 10, 2025

---

## Table of Contents
1. [Work Order Management](#epic-1-work-order-management)
2. [Parts Inventory and Ordering](#epic-2-parts-inventory-and-ordering)
3. [Preventive Maintenance Execution](#epic-3-preventive-maintenance-execution)
4. [Diagnostic and Repair Documentation](#epic-4-diagnostic-and-repair-documentation)
5. [Equipment and Tool Management](#epic-5-equipment-and-tool-management)

---

## Epic 1: Work Order Management

### UC-MT-001: Receive and Prioritize Work Orders

**Use Case ID**: UC-MT-001
**Use Case Name**: Receive and Prioritize Work Orders
**Actor**: Maintenance Technician (primary), Dispatcher (secondary)
**Priority**: High

#### Preconditions:
- Technician is logged into mobile app or dashboard
- Work orders exist in system requiring assignment
- Mobile device has internet connectivity
- Push notification service is operational

#### Trigger:
- Work orders assigned to technician
- Emergency breakdown notification received
- Technician opens work order queue at start of shift

#### Main Success Scenario:
1. Maintenance Technician Alex opens mobile app at 8:00 AM
2. System displays assigned work order queue for today:
   - WO-2025-1847: Routine maintenance (Vehicle #234, Priority: Standard)
   - WO-2025-1848: Emergency repair (Vehicle #567, Priority: Critical)
   - WO-2025-1849: Parts replacement (Vehicle #891, Priority: High)
   - WO-2025-1850: Preventive service (Vehicle #445, Priority: Standard)
3. System sorts by priority level with color coding:
   - Red: Critical/Emergency (appears at top)
   - Orange: High priority
   - Yellow: Standard priority
4. Technician reviews emergency work order first:
   - WO-2025-1848: Vehicle #567 - Engine fault codes detected
   - Issue: P0420 Catalyst System Efficiency Below Threshold
   - Estimated time: 2-3 hours
   - Parts required: Oxygen sensor, diagnostic check
5. System shows vehicle location: "Main depot, bay 3"
6. Technician taps "Start Work" on emergency order
7. System logs start time: 8:15 AM
8. System starts automatic labor time tracking
9. Technician scans vehicle barcode to confirm correct vehicle
10. System confirms: "Vehicle #567 - Freightliner Cascadia - linked to WO-2025-1848"
11. Technician views detailed work order specifications
12. System displays:
    - Work description and safety warnings
    - Last maintenance history for this vehicle
    - Parts inventory status
    - Estimated completion time
13. Technician acknowledges critical safety warning for high-temperature engine work
14. Technician begins diagnostics on Vehicle #567

#### Alternative Flows:

**A1: Receive Emergency Breakdown Alert During Active Work**
- 1a. If critical emergency arrives while technician is working:
  - System displays urgent push notification: "CRITICAL - Vehicle breakdown en route"
  - Notification includes vehicle location and ETA to depot
  - Technician reviews emergency vs current work priority
  - If current work can be paused safely:
    - Technician clicks "Pause Current Work"
    - System logs pause time and reason
    - Technician redirects to emergency work order
  - If current work cannot be paused:
    - Technician acknowledges notification and continues
    - System escalates emergency to secondary technician

**A2: Multiple Work Orders with Same Estimated Time**
- 2a. If several orders have similar priority and duration:
  - System suggests optimization: "WO-1849 and WO-1850 share vehicle location"
  - Technician can batch process related work orders
  - Technician views all associated work order details together
  - System calculates combined completion time and efficiency gains

**A3: Work Order Details Incomplete or Missing**
- 6a. If work order lacks critical information:
  - System displays warning: "⚠ Incomplete work order - missing parts list"
  - Technician clicks "Request Details"
  - System notifies dispatcher/work order creator
  - Technician can proceed with available information or defer work

#### Exception Flows:

**E1: Mobile App Offline - Work Orders Cached**
- If internet connectivity lost:
  - System displays cached work orders from last sync
  - Technician can view and work on offline queue
  - System queues actions for sync when connected
  - Timestamp shows "Last sync: 12 minutes ago"

**E2: Work Order Assignment Changed/Cancelled**
- If work order is reassigned while viewing:
  - System displays alert: "This work order was reassigned to Mike Torres"
  - Technician can keep working if intentional or cancel
  - If cancelled: System logs cancellation and releases technician time

**E3: Vehicle Not Available at Expected Location**
- If vehicle is not at indicated location:
  - Technician reports: "Vehicle #567 not in bay 3"
  - System searches for alternate vehicle location
  - Dispatcher is notified to locate vehicle
  - Technician proceeds with next available work order or waits

#### Postconditions:
- Work order is claimed by technician
- Labor time tracking has begun
- Work order status updated to "In Progress"
- Vehicle confirmed linked to work order
- All safety warnings acknowledged

#### Business Rules:
- BR-MT-001: Emergency work orders must be started within 15 minutes of assignment
- BR-MT-002: Work order cannot be started without acknowledging safety warnings
- BR-MT-003: Vehicle barcode must be scanned to confirm work order linkage
- BR-MT-004: Priority cannot be manually changed (set by dispatcher)
- BR-MT-005: Labor time tracking is automatic from work order start

#### Related User Stories:
- US-MT-001: Mobile Work Order Queue Management

---

### UC-MT-002: Complete Work Orders with Documentation

**Use Case ID**: UC-MT-002
**Use Case Name**: Complete Work Orders with Documentation
**Actor**: Maintenance Technician (primary), Parts Manager (secondary)
**Priority**: High

#### Preconditions:
- Work order is in "In Progress" status
- All repair work is completed
- Parts used have been tracked
- Digital signature capability available
- Mobile device has photo capture capability

#### Trigger:
- Technician completes repair work on vehicle
- All maintenance tasks finished for work order
- Vehicle ready for return to service

#### Main Success Scenario:
1. Technician Alex completes repair work on Vehicle #567 at 11:30 AM
2. System shows current work order duration: 3 hours 15 minutes (labor time tracked automatically)
3. Technician clicks "Complete Work Order" button
4. System displays work order completion form:
   - Summary of work performed (required)
   - Parts used (required)
   - Diagnostic findings (required)
   - Photos (min 3 required)
   - Notes for follow-up (optional)
5. Technician enters work summary: "Replaced faulty oxygen sensor on bank 2. Cleared fault code. Performed test drive - vehicle operating normally."
6. System auto-calculates labor cost:
   - 3.25 hours × $75/hour = $243.75
   - Display shows: "Labor cost: $243.75"
7. Technician selects parts used from inventory:
   - Scans barcode for "Oxygen Sensor - Part #LSU04-0259"
   - System shows part cost: $148.50
   - Quantity: 1
   - System updates: "Parts total: $148.50"
8. Technician selects related parts:
   - Adds: "Dielectric grease" (cost: $12.00)
   - Total repair cost: $243.75 (labor) + $160.50 (parts) = $404.25
9. Technician records diagnostic findings:
   - Original fault: "P0420 Catalyst System Efficiency Below Threshold"
   - Root cause: "Faulty oxygen sensor providing incorrect feedback"
   - Resolution: "Sensor replacement and reprogramming"
10. Technician captures photos:
    - Photo 1: Removed oxygen sensor showing corrosion
    - Photo 2: New sensor installation
    - Photo 3: Vehicle in test drive area
    - System stores photos to Azure Blob Storage
11. Technician records test drive results:
    - Distance: 5 miles
    - Duration: 12 minutes
    - Issues noted: "None - vehicle performing normally"
12. Technician reviews work order summary on screen
13. System displays digital signature pad
14. Technician signs completion:
    - Signature captured and stored (non-repudiation)
15. System displays: "Work order completion verified - Press SUBMIT"
16. Technician clicks "Submit Work Order"
17. System validates all required fields complete:
    - ✓ Work summary provided
    - ✓ Parts documented
    - ✓ Diagnostic findings recorded
    - ✓ Minimum 3 photos attached
    - ✓ Digital signature captured
18. System posts work order to system:
    - Inventory reduced for parts used
    - Labor hours logged to technician record
    - Parts costs and labor added to vehicle maintenance history
    - Work order status changed to "Completed"
    - Customer can view completed work order in portal
19. System sends notification to dispatcher: "Work Order WO-2025-1848 completed"
20. Vehicle #567 marked as "Ready for Service"

#### Alternative Flows:

**A1: Parts Used Not Yet Received - Continue Work**
- 5a. If required parts haven't been received from inventory:
  - Technician clicks "Require Part Lookup"
  - System searches inventory for part barcode
  - If not found: "Part #LSU04-0259 not in stock"
  - Technician options:
    - Complete work order with partial repairs noted
    - Request emergency part ordering
    - Flag vehicle for completion when parts arrive

**A2: Work Not Fully Complete - Create Follow-up Work Order**
- 1a. If technician discovers additional issues during repair:
  - Technician notes: "Found additional transmission fluid leak - requires transmission service"
  - Technician can complete current work order
  - System offers to create follow-up work order
  - Technician clicks "Create Follow-up WO"
  - System generates WO-2025-1851 for transmission service
  - Original WO-2025-1848 marked as "Completed - Follow-up Required"

**A3: Customer Adds Work During Service (Scope Creep)**
- 1a. If customer requests additional work while vehicle in shop:
  - Dispatcher sends message: "Customer wants wheel alignment while vehicle here"
  - Technician can add work to current order or create new order
  - If adding to current order: scope expanded, labor estimate increases
  - System recalculates total cost and time estimate
  - Customer must approve additional charges before technician proceeds

**A4: Work Order Completion While Offline**
- 16a. If internet lost during completion submission:
  - System queues work order completion data locally
  - System displays: "Completion pending sync"
  - Work order data stored in mobile device cache
  - When connectivity restored: System automatically syncs to server
  - Notification confirms: "Work order WO-2025-1848 synced - completed"

#### Exception Flows:

**E1: Required Field Missing - Cannot Submit**
- If technician attempts to submit without all required fields:
  - System displays error: "Cannot submit - missing required fields"
  - System highlights empty fields:
    - Work summary: EMPTY
    - Diagnostic findings: EMPTY
  - Technician must complete missing fields before resubmitting

**E2: Parts Inventory System Unavailable**
- If parts database cannot be reached:
  - Technician can enter parts manually
  - System displays warning: "Parts inventory offline - manual entry"
  - Technician enters: "Oxygen Sensor" + cost "$148.50"
  - Manual entry flagged for inventory verification when system restored

**E3: Photo Upload Fails**
- If photo upload to cloud storage fails:
  - System displays error: "Failed to upload 2 of 3 photos"
  - Technician can:
    - Retry upload
    - Continue without photos (not recommended)
    - Mark as "Pending upload" and sync later
  - System queues photos for retry when connection better

**E4: Digital Signature Capture Fails**
- If signature pad is unavailable:
  - System offers alternative: "Biometric authentication"
  - Technician uses fingerprint instead of signature
  - If biometric unavailable: PIN entry
  - Completion recorded with authentication method noted

#### Postconditions:
- All work documented with complete details
- Photos and diagnostic data stored securely
- Parts inventory reduced for items used
- Labor hours recorded to technician account
- Work order marked complete and closed
- Vehicle ready for customer pickup or return to service
- Customer notification sent with completion summary

#### Business Rules:
- BR-MT-006: Work order cannot be submitted without all required fields complete
- BR-MT-007: Digital signature required for completion (no exceptions)
- BR-MT-008: Minimum 3 photos required per work order
- BR-MT-009: Parts must be barcode-scanned or manually approved by supervisor
- BR-MT-010: Labor cost auto-calculated from time tracking (cannot be manually overridden)
- BR-MT-011: Work order completion syncs within 10 seconds of submission (when online)

#### Related User Stories:
- US-MT-002: Work Order Completion and Documentation

---

### UC-MT-003: Handle Emergency Breakdown Response

**Use Case ID**: UC-MT-003
**Use Case Name**: Handle Emergency Breakdown Response
**Actor**: Maintenance Technician (primary), Dispatcher (secondary)
**Priority**: High

#### Preconditions:
- Technician is on-duty and reachable
- Vehicle is disabled and unable to operate
- Mobile app is connected for real-time communication
- Roadside equipment and tools available

#### Trigger:
- Driver activates emergency breakdown alert
- Dispatcher assigns emergency work order
- Critical vehicle fault detected requiring immediate attention

#### Main Success Scenario:
1. Dispatcher sends emergency breakdown assignment to Technician Alex:
   - "CRITICAL: Vehicle #567 broken down on Route I-95, MM 47"
   - Location: GPS coordinates and address provided
   - Driver contact: John Smith - on-scene and safe
2. System displays loud alert with red notification on technician's mobile app
3. System provides navigation instructions to breakdown location
4. Technician taps "Accept Emergency Assignment"
5. System starts labor tracking and updates dispatcher: "Alex en route - ETA 18 minutes"
6. Technician drives to location and arrives at 2:35 PM
7. Technician contacts driver John via in-app messaging: "Alex arriving in 2 minutes - stay in vehicle"
8. Upon arrival, technician assesses vehicle:
   - Engine check lights on
   - Visible fuel leak under vehicle
   - Vehicle is disabled/not driveable
9. Technician connects OBD-II Bluetooth adapter to vehicle
10. System reads fault codes: P0087 (Fuel Rail Pressure Too Low)
11. Technician documents findings in mobile app:
    - Photos of fuel leak
    - Fault codes recorded
    - Preliminary diagnosis: "Fuel line rupture"
12. Technician assesses repair feasibility:
    - Quick fix possible (temporary fuel line clamp)
    - Would allow vehicle to limp back to depot (5 miles)
    - Better solution: Full fuel line replacement (requires parts)
13. Technician contacts dispatcher with status: "Fuel line ruptured - can limp back with temporary fix or tow required"
14. Dispatcher approves: "Temporary fix and limp back to depot"
15. Technician applies temporary fuel line clamp and seals leak
16. Technician performs test: Engine starts successfully
17. Technician documents: "Temporary fuel line clamp applied - vehicle operational for 5-mile return to depot"
18. Technician clears fault codes with OBD-II adapter
19. Driver John restarts vehicle and verifies operation
20. Technician escorts vehicle back to depot at safe speed
21. Upon depot arrival, technician creates permanent work order for full fuel line replacement
22. Technician marks emergency response as complete
23. System logs total response time: 47 minutes (from assignment to breakdown stabilized)

#### Alternative Flows:

**A1: Vehicle Cannot Be Moved - Requires Towing**
- 12a. If vehicle cannot be safely operated:
  - Technician determines: "Engine damage - vehicle non-operable"
  - Technician contacts dispatcher: "Cannot limp - need tow truck"
  - Dispatcher arranges towing to repair facility
  - Technician waits with driver and vehicle until tow arrives
  - Technician transfers vehicle information to tow driver
  - Work order updated with "Towed to facility" status

**A2: Driver Injury Requires Medical Attention**
- 4a. If driver is injured during breakdown:
  - Technician assesses injury: "Driver has back pain from impact"
  - Technician calls 911 for ambulance
  - Technician calls dispatcher to notify of medical emergency
  - Technician documents incident: photos, injury description
  - Technician waits with driver until ambulance arrives
  - Work order marked as "Medical emergency - escalated"

**A3: Road Safety Hazard - Traffic Control Needed**
- 8a. If vehicle blocking traffic lane:
  - Vehicle stalled in middle of 2-lane highway
  - Technician contacts dispatcher: "Vehicle blocking traffic - need state police"
  - Dispatcher calls state police for traffic control
  - Police arrive and establish safety perimeter
  - Technician performs roadside repair with traffic protection
  - Reduces risk to technician and driver

**A4: Technician Must Assess but Cannot Repair On-Scene**
- 12a. If breakdown requires shop equipment:
  - Technician assesses: "Transmission issues - requires transmission jacks"
  - Technician stabilizes vehicle for safe towing
  - Technician documents findings for shop technician
  - Tow arranged for full diagnosis at facility

#### Exception Flows:

**E1: Navigation to Breakdown Location Fails**
- If GPS location is incorrect or unavailable:
  - Driver provides verbal directions: "Past mile marker 47, near blue water tower"
  - Technician uses landmarks to navigate
  - Technician contacts driver: "Can you see my vehicle coming?"
  - Manual navigation used as backup

**E2: Parts Required Not Available On Road**
- If needed parts must be obtained:
  - Technician determines: "Fuel injector replacement required"
  - Dispatcher contacts parts supplier
  - Technician waits for parts delivery or arranges towing
  - Time delay documented

**E3: Weather Conditions Unsafe for Roadside Repair**
- If dangerous weather develops:
  - Severe thunderstorm with lightning
  - Technician ensures driver safety: Move to safe shelter
  - Technician postpones repairs until weather clears
  - If vehicle blocking traffic: Request immediate towing

**E4: Communication with Dispatcher Lost**
- If radio/mobile connection unavailable:
  - Technician uses last known information to assess situation
  - Technician stabilizes vehicle and driver
  - Technician attempts to contact dispatcher via alternate method
  - When connection restored, provides full update

#### Postconditions:
- Driver and vehicle are safe and stabilized
- Temporary or permanent repairs completed if feasible
- Vehicle either limps to depot or is towed
- Complete documentation with photos and findings captured
- Work order created for permanent repair if needed
- Dispatcher notified of resolution
- Emergency response time tracked for performance metrics

#### Business Rules:
- BR-MT-012: Driver safety is absolute priority - repairs are secondary
- BR-MT-013: Roadside emergency repairs cannot delay >2 hours (must tow if needed)
- BR-MT-014: All emergency responses documented with timestamp and location
- BR-MT-015: Technician communication with dispatcher required every 15 minutes
- BR-MT-016: Temporary/field repairs must be flagged for permanent shop repair
- BR-MT-017: Response time target: <45 minutes from assignment to on-scene

#### Related User Stories:
- US-MT-003: Emergency Work Order Response

---

## Epic 2: Parts Inventory and Ordering

### UC-MT-004: Check Parts Availability and Reserve

**Use Case ID**: UC-MT-004
**Use Case Name**: Check Parts Availability and Reserve
**Actor**: Maintenance Technician (primary), Parts Manager (secondary)
**Priority**: High

#### Preconditions:
- Technician is working on active work order
- Parts inventory system is operational
- Parts catalog is current and accurate
- Real-time inventory levels available

#### Trigger:
- Technician needs parts for work order
- Parts reservation required before availability expires
- Technician scanning part barcode

#### Main Success Scenario:
1. Technician Alex is working on WO-2025-1848: Oxygen sensor replacement
2. Work order specifies required part: "Bosch LSU 4.2 Oxygen Sensor"
3. Technician clicks "Check Parts" on mobile work order
4. System displays parts search interface
5. Technician scans part barcode or searches by part number
6. System searches inventory database:
   - Part #LSU04-0259 (Oxygen Sensor - Bosch)
   - Location: Auto Warehouse - Main Depot
7. System displays real-time inventory:
   - Main Depot: 8 units in stock, bay B12
   - Regional Warehouse (Boston): 12 units, available for next-day pickup
   - Status: IN STOCK at current location
8. System shows pricing: "$148.50 per unit"
9. Technician taps "Reserve Part"
10. System reserves 1 unit for work order WO-2025-1848
11. System displays: "Reserved for 2 hours - Expires 3:30 PM"
12. System provides location: "Bay B12 - 3 minutes walk from current bay"
13. Technician walks to parts location and retrieves reserved part
14. Technician scans part barcode to issue from inventory
15. System confirms: "Part issued to WO-2025-1848"
16. Inventory automatically updated: 8 → 7 units remaining
17. Part cost added to work order: $148.50
18. Technician proceeds with part installation

#### Alternative Flows:

**A1: Part Not In Stock - Check Alternatives**
- 7a. If primary part unavailable:
  - System displays: "LSU04-0259 - 0 units in stock"
  - System suggests: "Equivalent alternative: Denso 234-9010 (in stock: 4 units)"
  - Technician can:
    - Use alternative part (different cost: $132.00)
    - Wait for stock replenishment (next delivery: 2 hours)
    - Emergency order from vendor (extra cost)
  - If technician selects alternative:
    - System updates work order with new part
    - Cost recalculated automatically

**A2: Part Reserved but Not Picked Up - Auto-Release**
- 12a. If reserved part not picked up within 2 hours:
  - System auto-releases reservation at expiration
  - Notification sent to technician: "Your reservation for LSU04-0259 has expired"
  - Technician must reserve again if still needed
  - Prevents inventory hoarding

**A3: Multiple Quantities Needed**
- 10a. If work order requires multiple units:
  - Technician requests: 2 units of brake pads
  - System checks availability: "5 units available"
  - Technician reserves 2 units
  - System ensures sufficient quantity for other work orders

**A4: Cross-Location Part Search**
- 6a. If technician wants to check other depot locations:
  - System displays inventory at all affiliated locations
  - Main Depot: 8 units
  - Boston Warehouse: 12 units
  - Philadelphia Depot: 0 units
  - Technician can request transfer from Boston location
  - Estimated delivery: Next-day or via courier (additional cost)

#### Exception Flows:

**E1: Inventory System Offline - Manual Lookup**
- If parts database unavailable:
  - Technician calls parts desk: "Looking for LSU04-0259"
  - Parts manager confirms: "We have 8 in stock, bay B12"
  - Technician retrieves part manually
  - Work order updated when system restored

**E2: Part Barcode Scan Fails**
- If barcode reader malfunctions:
  - Technician manually enters part number: LSU04-0259
  - System searches database with manual entry
  - Part found and reserved successfully
  - Technician notes barcode scanner issue for IT

**E3: Reserved Part Physically Unavailable**
- If part location is empty despite system showing in stock:
  - Technician reports: "Bay B12 empty - part not found"
  - System investigates inventory discrepancy
  - Technician notified of actual shortage
  - Technician uses alternative part or waits for restock

**E4: Parts Pricing Cannot Be Calculated**
- If cost data missing from parts database:
  - System displays: "Part cost: [Unknown]"
  - Technician can proceed with work but cost flagged
  - Parts manager will backfill cost data
  - Work order cost updated when available

#### Postconditions:
- Part is reserved and held for technician
- Location information provided for retrieval
- Inventory reduced if part removed from stock
- Part cost added to work order
- Technician has required part for repair

#### Business Rules:
- BR-MT-018: Parts must be barcode-scanned to confirm issue from inventory
- BR-MT-019: Reservation auto-releases after 2 hours if not picked up
- BR-MT-020: Alternative parts require technician approval
- BR-MT-021: Cross-location transfers arranged by parts manager
- BR-MT-022: Pricing auto-calculated from parts database (no manual override)

#### Related User Stories:
- US-MT-004: Parts Inventory Check and Reservation

---

### UC-MT-005: Issue and Return Parts from Inventory

**Use Case ID**: UC-MT-005
**Use Case Name**: Issue and Return Parts from Inventory
**Actor**: Maintenance Technician (primary), Parts Manager (secondary)
**Priority**: High

#### Preconditions:
- Technician has reserved part or is retrieving from inventory
- Barcode scanning available
- Parts transaction system operational

#### Trigger:
- Technician is retrieving parts for work order
- Unused parts returned after job completion
- Defective parts flagged for warranty return

#### Main Success Scenario:
1. Technician Alex is working on WO-2025-1848: Oxygen sensor replacement
2. Technician walks to parts location: Bay B12
3. Technician scans part barcode: LSU04-0259
4. System displays: "Bosch Oxygen Sensor - on-hand: 8 units"
5. Technician selects quantity: 1
6. System prompts: "Confirm issue to WO-2025-1848 - Oxygen Sensor Replacement?"
7. Technician confirms: "Yes"
8. System records transaction:
   - Transaction ID: PRT-2025-8471
   - Type: ISSUE
   - Part: LSU04-0259
   - Quantity: 1
   - Issued to: Alex (Technician)
   - Linked to: WO-2025-1848
   - Time: 2:45 PM
9. System updates inventory: 8 → 7 units remaining
10. Technician receives part and proceeds with installation
11. At work order completion:
    - Oxygen sensor installed successfully
    - Part usage confirmed in work order documentation
    - Part cost ($148.50) added to work order total
12. No returns needed - part fully used

#### Alternative Flows:

**A1: Extra Parts Issued - Return Unused Quantity**
- 1a. If technician takes 2 units but only uses 1:
  - Technician receives: 2 brake pads
  - Installs and uses: 1 brake pad
  - Remaining: 1 brake pad unused
  - Technician returns to parts location
  - Technician scans barcode on unused part
  - System prompts: "Return unused part to inventory?"
  - Technician confirms return
  - System records: RETURN transaction
  - Inventory updated: 4 → 5 units
  - Work order adjusted: only 1 unit charged

**A2: Defective/Warranty Return of Failed Part**
- 1a. If installed part fails and requires return:
  - Technician notes: "Alternator failed 2 weeks after installation"
  - Technician removes failed part
  - System prompts: "Mark as defective/warranty return?"
  - Technician confirms and provides failure reason
  - System records: WARRANTY_RETURN transaction
  - Part flagged for manufacturer return
  - No cost to vehicle account (warranty covers)

**A3: Core Return for Rebuildable Parts**
- 1a. If replacing core part (battery, starter, etc.):
  - Technician removes old alternator
  - Issues new alternator: 1 unit, cost $385
  - System prompts: "Core return value: $50"
  - Old core must be returned within 30 days
  - Technician stores old alternator in core area
  - Upon return: Credit issued (new cost: $335 net)

**A4: Multiple Parts Return at Once**
- 1a. If technician returns several unused parts:
  - Unused parts: 2 brake pads, 1 oxygen sensor, 3 filters
  - Technician scans each part barcode
  - System batches all returns together
  - Multiple RETURN transactions recorded
  - Inventory updated for all items at once

#### Exception Flows:

**E1: Part Barcode Unreadable**
- If barcode is damaged:
  - Technician enters part number manually: LSU04-0259
  - System searches database with manual entry
  - Transaction recorded with manual entry noted
  - Part still issued/returned successfully

**E2: Inventory Count Mismatch**
- If physical count differs from system:
  - Technician finds only 7 units but system shows 8
  - Technician notifies parts manager
  - Discrepancy investigated and inventory corrected
  - Transaction proceeds with actual quantity

**E3: Part Cannot Be Located**
- If part is not where system indicates:
  - Technician searches alternate locations
  - Part may have been moved or misstocked
  - Parts manager helps locate physical part
  - Inventory records updated when found

**E4: Work Order Not Found for Parts Issue**
- If work order link broken:
  - System cannot find WO-2025-1848
  - Technician can still issue part but it's unlinked
  - Transaction recorded with note: "Work order not linked"
  - Parts manager reconciles transaction later

#### Postconditions:
- Parts issued/returned tracked in inventory system
- Part cost linked to work order
- Inventory levels updated in real-time
- Transaction history maintained for audit
- Returns processed and credited appropriately

#### Business Rules:
- BR-MT-023: All part transactions must be barcode-scanned (no manual counting)
- BR-MT-024: Returns must be initiated within 24 hours of issue
- BR-MT-025: Defective parts flagged for warranty return automatically
- BR-MT-026: Core returns have 30-day window for credit
- BR-MT-027: Inventory discrepancies escalated to parts manager
- BR-MT-028: All transactions logged with technician, timestamp, and work order link

#### Related User Stories:
- US-MT-005: Parts Issue and Return

---

### UC-MT-006: Request Emergency Parts Ordering

**Use Case ID**: UC-MT-006
**Use Case Name**: Request Emergency Parts Ordering
**Actor**: Maintenance Technician (primary), Parts Manager (secondary)
**Priority**: Medium

#### Preconditions:
- Critical part is out of stock
- Work order is active and time-sensitive
- Parts manager is available for approval
- Vendor integration available for rush orders

#### Trigger:
- Required part not available in inventory
- Vehicle downtime is critical
- Customer requires same-day or next-day completion

#### Main Success Scenario:
1. Technician Alex is working on transmission service (WO-2025-1849)
2. System checks transmission fluid: Filter part #TF-440A
3. Inventory check: "0 units in stock"
4. Technician clicks "Request Emergency Order"
5. System displays emergency parts request form
6. Technician selects part: TF-440A (Transmission Fluid Filter)
7. Technician specifies urgency: "Same-day needed"
8. System checks vendor availability:
   - Vendor 1: Same-day delivery available, cost $89 + $25 rush fee
   - Vendor 2: Next-day delivery, cost $89
   - Vendor 3: 2-day delivery, cost $85
9. Technician selects: "Vendor 1 - Same-day delivery"
10. System calculates: Total cost $114 (part + rush fee)
11. Technician adds business justification: "Vehicle in shop - customer waiting"
12. System routes request to Parts Manager for approval
13. Parts Manager Mike reviews request:
    - Part needed: TF-440A
    - Urgency: Same-day
    - Cost: $114 (vs. standard $89)
    - Justification: Valid
14. Parts Manager approves: "Approved - Vendor 1 - Same-day delivery"
15. System automatically places order with Vendor 1:
    - PO #PO-2025-4521 created
    - Delivery target: Today by 5:00 PM
16. System sends tracking info to technician:
    - Estimated delivery: 2:30 PM
    - Tracking number: RUSH-98765
    - Status: In transit
17. Technician continues with other parts of repair while waiting
18. At 2:25 PM, system notifies: "Emergency part TF-440A arriving - 5 minutes"
19. Technician completes other work and receives delivered part at 2:30 PM
20. Technician installs part and completes work order
21. Work order cost includes: Original estimate + $25 rush charge
22. Customer notified of rush part charge and approves

#### Alternative Flows:

**A1: Emergency Part Denied - Suggest Alternatives**
- 14a. If cost justification insufficient:
  - Parts Manager reviews: "$25 rush charge seems excessive"
  - Parts Manager denies same-day, approves next-day
  - System notifies technician: "Rush order denied - next-day approved"
  - Technician can:
    - Accept next-day delivery
    - Use alternative part if available
    - Escalate to supervisor for cost override

**A2: Emergency Part Not Available from Any Vendor**
- 8a. If no vendor can supply part:
  - System shows: "Part TF-440A unavailable from all vendors"
  - Technician options:
    - Use compatible alternative part (if available)
    - Delay work order until part available (notify customer)
    - Source from used/recycled parts supplier
  - Technician selects best option

**A3: Multiple Emergency Parts Needed**
- 6a. If work discovers multiple missing parts:
  - Technician identifies: 2 transmission sensors needed
  - Technician creates batch emergency order request
  - System consolidates order: Both parts from same vendor
  - Single delivery reduces costs
  - Combined rush charge: $40 vs $25+25

**A4: Part Arrives Damaged or Incorrect**
- 18a. If delivered part is defective:
  - Technician inspects: "Part appears damaged"
  - Technician initiates return with vendor
  - Vendor replacement expedited (no additional charge)
  - Alternative part sourced while replacement in transit

#### Exception Flows:

**E1: Parts Manager Not Available for Approval**
- If approval authority unavailable:
  - Approval routes to supervisor/backup authority
  - If no one available: Auto-approval triggered for urgent requests >$50
  - Escalation logged for review
  - Order proceeds with all details documented

**E2: Vendor Order System Down**
- If vendor integration offline:
  - Parts Manager manually places order with vendor
  - System queues electronic order for sync
  - Technician notified of manual order status
  - Email/phone confirmation of order placement

**E3: Customer Refuses to Approve Rush Charges**
- If customer declines $25 rush fee:
  - Technician cancels rush order
  - System reverts to standard delivery (next-day)
  - Customer agrees to delay in completion
  - Work order timeline adjusted

**E4: Vehicle Warranty Covers Emergency Part**
- If part should be covered under warranty:
  - System flag: "Check warranty coverage for TF-440A"
  - Parts Manager contacts customer/manufacturer
  - If covered: No charge to customer
  - Emergency order cost covered by warranty claim

#### Postconditions:
- Emergency part order placed with vendor
- Technician notified of delivery timeline
- Work order temporarily paused until part arrives
- Customer informed of delay and any additional charges
- Upon arrival, part integrated into completed repair

#### Business Rules:
- BR-MT-029: Emergency orders require parts manager approval
- BR-MT-030: Rush charges must not exceed 50% of part cost
- BR-MT-031: Estimated delivery times required before approval
- BR-MT-032: Customer approval required for charges >$100
- BR-MT-033: Standard orders processed within 4 hours

#### Related User Stories:
- US-MT-006: Emergency Parts Ordering

---

## Epic 3: Preventive Maintenance Execution

### UC-MT-007: Execute Preventive Maintenance Checklist

**Use Case ID**: UC-MT-007
**Use Case Name**: Execute Preventive Maintenance Checklist
**Actor**: Maintenance Technician (primary), Fleet Manager (secondary)
**Priority**: High

#### Preconditions:
- Preventive maintenance work order is assigned
- Digital PM checklist is available for vehicle type
- Vehicle is in maintenance bay
- Manufacturer specifications are up-to-date

#### Trigger:
- PM service scheduled for specific vehicle
- Vehicle reaches maintenance interval (time/mileage)
- Technician begins PM work order

#### Main Success Scenario:
1. Technician Alex receives PM work order: WO-2025-1850 (Vehicle #445 - Preventive Maintenance Service A)
2. System displays: "Freightliner Cascadia - 50,000 mile Service A"
3. Technician scans vehicle barcode to confirm correct vehicle
4. System loads digital PM checklist specific to:
   - Vehicle: Freightliner Cascadia
   - Service type: Service A (50K mile interval)
   - Year/model: 2022
5. System displays organized PM tasks by system:
   - **Engine Oil System**: Oil and filter change, fluid level check
   - **Air System**: Air filter replacement, turbo inspection
   - **Transmission**: Fluid level check, external inspection
   - **Braking System**: Brake pad inspection, brake fluid check
   - **Electrical System**: Battery test, wiper inspection
   - **Cooling System**: Coolant level and condition check
   - **Suspension**: Shock/spring inspection
6. Technician begins with Engine Oil System section
7. System displays first task: "Change engine oil and filter"
   - Detailed instructions provided
   - Safety warnings: "Hot oil - allow engine cool first"
   - Specifications: "5 quarts 15W-40 synthetic"
   - Estimated time: 15 minutes
8. Technician completes oil change
9. Technician marks task: "✓ Complete"
10. System prompts: "Take photo as documentation"
11. Technician captures photo of new oil filter installed
12. System displays next task: "Check engine oil pressure"
    - Specification: 50-65 psi at idle
    - Required reading: Digital pressure gauge on-vehicle
13. Technician connects pressure gauge and records reading: "58 psi"
14. System validates: "✓ Within specification (50-65 psi)"
15. Technician continues through all tasks in sequence
16. For critical measurements, system alerts if out of spec:
    - Brake pad thickness: "2.2 mm (Minimum: 1.5 mm) - ✓ Pass"
    - Tire pressure: "Left front 75 psi (Spec: 80 psi) - ⚠ Low - Adjust"
17. For out-of-spec item, technician takes corrective action
18. After each section, technician provides digital signature confirming completion
19. Throughout checklist, technician captures photos:
    - Air filter removal and replacement
    - Belt condition inspection
    - Brake system visual inspection
    - Fluids and filter changes
20. Upon checklist completion, system displays summary:
    - **Service Completed**: 25 of 25 tasks
    - **Time spent**: 2 hours 45 minutes
    - **Parts used**: Oil filter, engine oil, air filter, cabin air filter
    - **Measurements taken**: 12 readings, all within spec
    - **Issues found**: None
    - **Follow-up required**: No
21. System calculates next PM due date:
    - Current mileage: 50,000
    - Next service: 100,000 miles or 12 months (whichever first)
    - Next PM date estimate: August 15, 2026
22. Technician provides digital signature for PM completion
23. System generates PM report with:
    - All photos attached
    - Measurements documented
    - Parts replaced listed
    - Technician signature
    - Recommendations for future maintenance
24. Vehicle marked "Ready for Service"

#### Alternative Flows:

**A1: Issue Found During PM - Create Follow-up Work Order**
- 19a. If PM inspection reveals defect:
  - Inspection finds: "Worn brake pads - 1.8 mm (still above minimum)"
  - Note: "Recommend replacement at next interval"
  - Technician flags for follow-up
  - System creates: "Recommend brake pad replacement at 60,000 miles"
  - Follow-up work order generated (not urgent, planned maintenance)

**A2: Critical Safety Issue Found - Vehicle Out of Service**
- 19a. If critical safety defect found:
  - Technician discovers: "Brake fluid dark and contaminated"
  - Safety risk: Vehicle cannot be trusted on road
  - Technician immediately stops PM process
  - Technician creates urgent work order: "Brake system flush and bleed"
  - Vehicle marked "OUT OF SERVICE - Do Not Operate"
  - Dispatcher notified to pull vehicle from active service
  - Brake system repaired before return to service

**A3: PM Task Not Applicable to This Vehicle**
- 16a. If task is not required for this vehicle:
  - Checklist includes: "Check 4-wheel drive transfer case"
  - Vehicle is 2-wheel drive only
  - Technician marks: "N/A - Not applicable to this vehicle"
  - Task skipped, not counted against completion rate
  - System adjusts total task count

**A4: Component Requires Specialized Equipment Not Available**
- 16a. If technician lacks required equipment:
  - PM specifies: "Transmission fluid analysis" (requires lab)
  - Technician cannot perform on-site
  - Technician collects fluid sample in labeled container
  - Technician ships sample to fluid analysis lab
  - Task marked: "Sample collected - sent for lab analysis"
  - Results documented when lab report received

#### Exception Flows:

**E1: Digital Checklist Downloaded But No Internet**
- If offline PM execution:
  - Technician synced checklist before losing connection
  - Checklist available in cached mobile app
  - Technician completes PM with offline app
  - All data stored locally
  - When connected: Data syncs automatically to server

**E2: Manufacturer Specifications Missing or Outdated**
- If spec data incomplete:
  - Checklist shows: "Transmission fluid capacity: [Unknown]"
  - Technician contacts supervisor for correct specification
  - Technician refers to service manual if available
  - Task completed with best available information
  - Admin updates specification database for future use

**E3: Measurement Equipment Malfunction**
- If pressure gauge/tools fail:
  - Digital tire pressure gauge not reading
  - Technician uses analog backup gauge
  - Reading recorded: "78 psi (analog gauge)"
  - Note added: "Digital gauge malfunction - analog used"
  - Equipment sent for recalibration

**E4: Vehicle Parts Unavailable During PM**
- If parts needed are out of stock:
  - Air filter out of stock during oil change PM
  - Technician completes all other PM tasks
  - Technician notes: "Air filter replacement deferred - out of stock"
  - Follow-up work order created for air filter when available

#### Postconditions:
- All PM tasks completed and documented
- Measurements recorded and validated against specs
- Photos captured for all critical service points
- Vehicle history updated with PM completion
- Next PM due date calculated and scheduled
- Technician digitally signed completion
- Vehicle ready for return to service

#### Business Rules:
- BR-MT-034: Digital signature required for PM completion
- BR-MT-035: Minimum 5 photos required per PM service
- BR-MT-036: Out-of-spec measurements must have corrective action documented
- BR-MT-037: PM cannot be marked complete with unsigned critical warnings
- BR-MT-038: Next PM due date auto-calculated and scheduled
- BR-MT-039: Critical safety issues must halt PM and create urgent work order

#### Related User Stories:
- US-MT-007: PM Schedule and Checklist Execution

---

### UC-MT-008: Collect Fluid Analysis Samples

**Use Case ID**: UC-MT-008
**Use Case Name**: Collect Fluid Analysis Samples
**Actor**: Maintenance Technician (primary), Fluid Lab (secondary)
**Priority**: Medium

#### Preconditions:
- Preventive maintenance service is in progress
- Fluid sampling is scheduled for this PM interval
- Sample bottles with barcodes available
- Fluid lab integration is operational

#### Trigger:
- PM checklist indicates fluid sampling required
- Technician reaches fluid service phase in PM
- Condition-based maintenance triggers oil analysis

#### Main Success Scenario:
1. Technician Alex is performing PM Service A on Vehicle #445
2. PM checklist reaches Fluid Analysis section
3. System indicates: "Collect engine oil sample for analysis"
4. System displays fluid analysis requirements:
   - Sample type: Engine oil
   - Container: Small glass vial with closure cap
   - Minimum quantity: 50 mL
   - Sampling point: From oil dipstick area during oil change
   - Lab: Advanced Fluid Analysis Lab
5. Technician retrieves sample bottle from lab kit
6. Technician scans barcode on sample bottle
7. System links barcode to:
   - Vehicle ID: #445
   - Service: Oil analysis
   - Mileage: 50,000
   - Date: November 10, 2025
8. Technician collects oil sample from engine (during oil change procedure)
9. Technician records observations:
   - Oil color: Dark brown (normal)
   - Oil odor: Slight burning smell (normal - age-related)
   - Viscosity: Flows normally from dipstick
   - Contamination: None visible
10. System generates sample label:
    - Vehicle: Freightliner Cascadia #445
    - Fluid type: Engine Oil (15W-40 Synthetic)
    - Mileage: 50,000 miles
    - Collection date: 11/10/2025
    - Collector: Alex (Technician)
    - Lab destination: Advanced Fluid Analysis Lab
11. Technician affixes label to sample bottle
12. Technician places sealed sample in shipping envelope
13. Technician scans barcode envelope
14. System creates tracking record:
    - Tracking #: LAB-SAMPLE-98765
    - Expected delivery: November 11, 2025
    - Expected results: November 15, 2025 (5-day turnaround)
15. Technician places envelope in outbound shipment bin
16. At end of day, lab samples collected and shipped
17. System tracks shipment status
18. November 11: Samples received at lab
19. System updated: "Sample LAB-SAMPLE-98765 received at lab"
20. Technician notified: "Oil analysis sample received - results expected by Nov 15"
21. November 15: Lab analyzes sample and generates report
22. System receives lab results:
    - Total acid number (TAN): 2.8 (Normal: <3.0)
    - Viscosity: 35 cSt (Normal: 30-40 cSt range)
    - Iron content: 42 ppm (Normal: <50 ppm)
    - Water content: <200 ppm (Normal: <500 ppm)
    - Conclusion: Oil in excellent condition - continue normal intervals
23. System displays results to fleet manager
24. Results added to Vehicle #445 maintenance history
25. Next oil analysis: Recommended at 100,000 miles

#### Alternative Flows:

**A1: Lab Results Show Abnormal Levels - Alert Issued**
- 25a. If lab results indicate problem:
  - Results show: "Iron content: 285 ppm (Abnormal: >100 ppm indicates wear)"
  - Alert generated: "⚠ Oil analysis abnormality - Excessive wear metals detected"
  - System recommends: "Vehicle may have internal engine damage - recommend shop inspection"
  - Automatic work order created: "Engine wear investigation - follow-up to oil analysis"
  - Fleet manager notified of potential mechanical issue
  - Vehicle scheduled for diagnostic inspection

**A2: Multiple Fluid Types Sampled (Transmission, Differential)**
- 4a. If PM requires multiple fluid samples:
  - Technician collects 3 samples:
    - Engine oil
    - Transmission fluid
    - Differential fluid
  - System creates 3 separate sample tracking records
  - Single shipment contains all 3 samples with individual labels
  - Lab processes all samples in parallel
  - Results consolidated in single report

**A3: Sample Delayed in Transit - Expedite Replacement**
- 17a. If sample is lost or damaged:
  - Tracking shows: Sample stuck in UPS system for 5 days
  - System alerts: "Sample LAB-SAMPLE-98765 delivery delayed"
  - Technician can submit replacement sample
  - Lab provides expedited analysis (3-day turnaround)
  - Original shipping cost refunded

**A4: Condition-Based Sampling Between Intervals**
- 1a. If condition-based monitoring triggers early sampling:
  - Vehicle has abnormal oil pressure: 35 psi (normally 50+)
  - Technician initiates out-of-cycle oil sample
  - System creates urgent sample with priority flag
  - Lab expedites analysis: 2-day turnaround vs standard 5-day
  - Results help diagnose pressure issue

#### Exception Flows:

**E1: Lab Integration Fails - Manual Sample Tracking**
- If lab API unavailable:
  - Technician collects sample and labels manually
  - Sample shipped to lab with printed tracking form
  - Technician manually logs: "Sample shipped - tracking manual"
  - When lab integration restored: Results manually entered

**E2: Sample Container Contaminated During Collection**
- If improper sample collection:
  - Sample comes in contact with water or contaminant
  - Technician notices and discards sample
  - New sample collected in fresh container
  - Original sample discarded, only fresh sample submitted

**E3: Lab Requests Additional Sample for Verification**
- If lab results unclear:
  - Lab contacts: "Please provide another sample for confirmation"
  - Technician must collect new sample (may require vehicle recall)
  - New sample expedited to lab
  - Confirmed results provided within 3 days

**E4: Technician Forgets to Collect Sample**
- If sample not collected during PM:
  - PM completed but sample collection missed
  - Within 24 hours: Technician can still collect sample
  - Vehicle brought back to bay
  - Fresh sample collected and submitted
  - Timestamp noted as "Delayed collection - 12 hours post-service"

#### Postconditions:
- Fluid sample collected and labeled with vehicle/service info
- Sample shipped to lab with tracking
- Lab results received and analyzed
- Results linked to vehicle maintenance history
- Abnormal findings trigger automatic alerts and work orders
- Next sampling interval scheduled

#### Business Rules:
- BR-MT-040: Fluid samples must be collected with proper container and labeling
- BR-MT-041: Lab results received within 5-7 days of sample submission
- BR-MT-042: Abnormal lab results trigger automatic investigation work order
- BR-MT-043: Sample tracking maintained for 10 years per compliance
- BR-MT-044: All fluid samples linked to specific vehicle and mileage

#### Related User Stories:
- US-MT-008: Fluid Analysis Sample Collection

---

## Epic 4: Diagnostic and Repair Documentation

### UC-MT-009: Read and Analyze Diagnostic Trouble Codes

**Use Case ID**: UC-MT-009
**Use Case Name**: Read and Analyze Diagnostic Trouble Codes
**Actor**: Maintenance Technician (primary), Fleet Manager (secondary)
**Priority**: High

#### Preconditions:
- Vehicle is equipped with OBD-II port
- Technician has Bluetooth OBD-II adapter
- Diagnostic scanning software available
- Vehicle has active or pending fault codes

#### Trigger:
- Technician begins diagnostic work for fault symptom
- Check engine light is illuminated
- Work order specifies DTC reading and analysis

#### Main Success Scenario:
1. Technician Alex is working on WO-2025-1848: Oxygen sensor replacement
2. Vehicle #567 has check engine light illuminated
3. Technician retrieves Bluetooth OBD-II adapter from tool kit
4. Technician connects adapter to vehicle OBD-II port (under dashboard)
5. System initializes Bluetooth connection to mobile app
6. System displays: "OBD-II Adapter Connected - Vehicle: 2022 Freightliner Cascadia"
7. Technician taps: "Read Diagnostic Codes"
8. System scans vehicle for active and pending codes
9. System displays Diagnostic Code Report:

   **ACTIVE FAULT CODES**:
   - **Code 1: P0420 - Catalyst System Efficiency Below Threshold**
     - Severity: Warning (yellow)
     - First detected: 3 days ago
     - Occurrence count: 1 (has occurred once)
     - Common causes:
       1. Faulty downstream O2 sensor
       2. Catalytic converter failure
       3. Exhaust leak
     - OEM recommended repair: Replace O2 sensor and retest

   **PENDING CODES** (detected but not yet active):
   - None currently

10. Technician reviews freeze frame data:
    - Engine load: 45%
    - Coolant temp: 195°F (normal)
    - Oxygen sensor voltage: 0.1V (low - indicates sensor failure)
    - Fuel trim: +8% (slightly rich)

11. System displays live sensor data stream:
    - Bank 1 O2 sensor voltage: 0.15V (should vary 0.0-1.0V)
    - Bank 2 O2 sensor voltage: 0.82V (normal)
    - Catalytic converter temp: 385°C (normal)

12. System provides repair flowchart for P0420:
    - Step 1: Test downstream O2 sensor voltage
    - Step 2: If voltage static (not varying), replace sensor
    - Step 3: If voltage normal, test catalytic converter efficiency
    - Step 4: Test for exhaust leaks
    - Step 5: Retest after repair

13. Technician follows flowchart:
    - Step 1: Measures sensor voltage - confirms static at 0.15V
    - Diagnosis: Faulty O2 sensor
    - Required repair: O2 sensor replacement

14. Technician removes faulty oxygen sensor and inspects:
    - Sensor tip shows carbon buildup
    - Connector slightly corroded
    - Sensor definitely failed

15. Technician documents finding: "Oxygen sensor electrode buildup causing signal failure"

16. Technician installs replacement O2 sensor (Part #LSU04-0259)

17. Technician uses OBD-II adapter to clear fault code P0420

18. System confirms code cleared and deleted from vehicle memory

19. Technician performs test drive (5 miles at varying speeds)

20. Test drive data captured in system:
    - Time: 12 minutes
    - Distance: 5 miles
    - Speed range: 0-55 mph
    - No new fault codes detected

21. Technician rescans vehicle after test drive

22. System displays: "✓ No active fault codes detected"

23. Technician creates diagnostic report:
    - Initial code: P0420
    - Root cause: Faulty oxygen sensor
    - Resolution: Sensor replaced
    - Post-repair verification: Test drive successful, no codes
    - Recommendation: Monitor for code recurrence

24. Report attached to WO-2025-1848

#### Alternative Flows:

**A1: Multiple Fault Codes Present - Prioritize by Root Cause**
- 9a. If vehicle has multiple codes:
  - Code P0420: Catalyst efficiency
  - Code P0130: O2 sensor circuit
  - Code P0101: Mass airflow sensor
  - System prioritizes: "Start with P0130 O2 sensor - may fix both P0420 and P0130"
  - Common cause analysis helps prioritize repairs

**A2: Pending Code - Monitor and Retest**
- 9a. If pending code detected (not yet active):
  - System shows: "Pending: P0506 - Idle Air Control System"
  - Pending code not confirmed yet
  - Technician options:
    - Monitor condition during test drive
    - Clear code and rescan (code must reoccur to be confirmed)
    - Document as "intermittent" and schedule follow-up

**A3: Code Cannot Be Resolved - Escalate for Advanced Diagnostics**
- 14a. If troubleshooting flowchart doesn't resolve code:
  - Technician follows all steps but code returns
  - Technician escalates to fleet manager: "Code P0420 recurring despite sensor replacement"
  - Advanced diagnostics scheduled:
    - Catalytic converter efficiency test (bench equipment)
    - Vehicle sent to specialized repair facility
    - System tracks escalation and follow-up

**A4: Code Related to Emissions Compliance**
- 9a. If code is emissions-related:
  - Technician notes: "This is emissions-critical code"
  - Vehicle may be at risk of EPA non-compliance
  - Repair is urgent - vehicle cannot be operated safely
  - Must be completed before vehicle returns to service

#### Exception Flows:

**E1: OBD-II Adapter Not Connecting**
- If Bluetooth adapter fails:
  - System displays: "Cannot connect to OBD-II adapter"
  - Technician tries:
    - Adapter battery check (recharge if needed)
    - Bluetooth reset on mobile app
    - Physical adapter reseated in OBD port
  - If adapter fails completely: Technician cannot read codes this shift
  - Dispatcher/supervisor contacted for equipment replacement

**E2: Vehicle Fault Code Database Outdated**
- If code definitions are old:
  - System shows: "P0420 - Unknown code" (database missing this code)
  - Technician can manually search online database
  - System administrator updates fault code database
  - Common codes cached for offline use

**E3: Technician Clears Codes Before Full Diagnosis**
- If codes cleared prematurely:
  - Technician clears P0420 without taking measurements
  - Code may return if not truly fixed
  - System warning: "Diagnose before clearing - don't hide problem"
  - Technician should document diagnosis first

**E4: Vehicle Diagnostic System Reports Multiple Generic Codes**
- If vehicle returns ambiguous codes:
  - System shows 10+ generic codes (P0XXXX range)
  - Indicates broader electrical or sensor issue
  - Technician escalates to diagnostic specialist
  - May require vehicle to be sent for full electrical scan

#### Postconditions:
- All active fault codes read and documented
- Root cause analysis completed
- Repair action determined from diagnostic flowchart
- Repair completed and verified
- Test drive performed confirming fix
- Code cleared and post-repair scan confirms no new codes
- Diagnostic report attached to work order

#### Business Rules:
- BR-MT-045: Fault codes must be documented before clearing
- BR-MT-046: Test drive required after repair to verify code resolution
- BR-MT-047: Recurring codes after repair escalated to supervisor
- BR-MT-048: Emissions-critical codes halt vehicle operation
- BR-MT-049: Diagnostic report must include freeze frame data and root cause

#### Related User Stories:
- US-MT-009: OBD-II Diagnostic Code Reading and Analysis

---

### UC-MT-010: Document Warranty Claims and Submit

**Use Case ID**: UC-MT-010
**Use Case Name**: Document Warranty Claims and Submit
**Actor**: Maintenance Technician (primary), Parts Manager (secondary)
**Priority**: Medium

#### Preconditions:
- Vehicle is under manufacturer warranty
- Repair is warranty-eligible (time/mileage within coverage)
- Required documentation available (failed part, photos, repair info)
- Warranty claim submission system operational

#### Trigger:
- Part fails during ownership period
- Technician suspects warranty-covered failure
- Manufacturer requires claim submission for reimbursement

#### Main Success Scenario:
1. Technician Alex discovers alternator failure during repair work
2. Vehicle #445 is 2022 Freightliner Cascadia - current mileage: 75,000 miles
3. System shows vehicle warranty:
   - Powertrain warranty: 3 years / 300,000 miles
   - Electrical warranty: 3 years / 100,000 miles
   - Alternator covered under electrical warranty
4. Purchase date: 11/10/2020 - Vehicle is 4+ years old but within mileage
5. Technician creates warranty claim:
   - Work order: WO-2025-1851 - Alternator replacement
6. System displays warranty claim form
7. Technician documents failure:
   - Component: Alternator (OEM Bosch model #000123)
   - Failure mode: Output voltage dropping below 12V - won't charge battery
   - Failure description: "Alternator bearing seized - unit dead"
   - Failure date: 11/10/2025
   - Mileage at failure: 75,000 miles
8. System checks warranty eligibility:
   - Warranty type: Electrical
   - Coverage: 3 years / 100,000 miles
   - Current: 4 years / 75,000 miles
   - Status: ⚠ Out of time warranty but within mileage limit
   - **Eligibility: CONDITIONAL - Contact manufacturer**
9. Technician documents required evidence:
   - Failed alternator photo (showing part number and condition)
   - Voltage test results (documentation of failure)
   - Repair invoice showing alternator replacement
   - Vehicle maintenance history (proper maintenance performed)
10. Technician captures photos:
    - Photo 1: Failed alternator removed from vehicle
    - Photo 2: Seized bearing evident
    - Photo 3: OEM part number label visible
    - Photo 4: New replacement alternator installed
11. Technician documents maintenance history:
    - No missed maintenance intervals
    - Regular oil changes performed
    - No signs of abuse or neglect
12. System generates claim package:
    - Claim #: WARRANTY-2025-1847
    - Component: Alternator
    - Original cost: $485 (parts + labor)
    - Warranty claim value: $485 (if approved)
13. Technician adds business justification:
    - "Premature alternator failure - vehicle maintained per OEM specifications"
    - "Request goodwill warranty consideration due to minor time extension"
14. System routes claim to Freightliner warranty portal
15. Manufacturer receives claim: WARRANTY-2025-1847
16. Manufacturer reviews:
    - Warranty eligibility: Technically expired (time-based)
    - Mileage: Well within limit (75K vs 100K coverage)
    - Maintenance: Proper records on file
    - Failure evidence: Clear - original part failure confirmed
17. Manufacturer decision: **APPROVED - Goodwill Coverage**
    - Coverage: 80% ($388) due to time extension
    - Deductible: $97 customer responsibility
18. System notifies technician: "WARRANTY-2025-1847 APPROVED"
    - Reimbursement amount: $388
    - Customer cost: $97 (parts + labor, net of warranty)
19. System tracks claim payment
20. Upon receipt of manufacturer payment, work order marked complete
21. Customer invoiced: $97 (covered by warranty: $388)

#### Alternative Flows:

**A1: Warranty Claim Denied - Appeal with Additional Evidence**
- 17a. If manufacturer initially denies:
  - Denial reason: "Time-based warranty expired"
  - Technician appeals with additional evidence:
    - Service records showing proper maintenance
    - Industry data showing alternator should last >4 years
    - Request for goodwill consideration
  - Manufacturer reviews appeal
  - Claim re-evaluated and approved for partial coverage

**A2: Warranty Coverage Varies by Component**
- 3a. If different parts have different warranty terms:
  - Powertrain: 3 years / 300,000 miles
  - Electrical: 3 years / 100,000 miles
  - Wear items: 1 year / 25,000 miles (brake pads, filters, etc.)
  - Technician must verify correct warranty for specific component

**A3: Warranty Void Due to Improper Maintenance**
- 17a. If maintenance records show neglect:
  - Vehicle records show missed oil changes
  - Warranty investigation reveals poor maintenance
  - Claim status: DENIED - Maintenance violation
  - Manufacturer will not cover failure
  - Customer responsible for full repair cost

**A4: Used Vehicle - Warranty Transferability**
- 1a. If vehicle is used/second owner:
  - Warranty coverage may be reduced or void depending on manufacturer
  - System checks: Vehicle transferability: "2-year warranty for 2nd owner"
  - Current: 4 years - exceeds 2nd-owner coverage
  - Claim: DENIED - Not covered for 2nd owner
  - Fleet manager appeals for exceptions

#### Exception Flows:

**E1: Failed Part Cannot Be Located/Photographed**
- If original part discarded before documentation:
  - Technician realizes: "I already discarded the old alternator!"
  - Claim cannot be submitted without failed part evidence
  - Warranty submission delayed
  - Technician creates note: "Failed part not retained for future claims"
  - Policy updated: Require retention of failed components for 30 days

**E2: Warranty Claim System Integration Fails**
- If manufacturer portal is offline:
  - Technician cannot submit electronically
  - Technician prints claim paperwork and mails to manufacturer
  - Manual processing takes 2-3 weeks vs 1-2 days electronic
  - System queues claim for electronic submission when portal restored

**E3: Conflicting Maintenance Records**
- If technician records don't match manufacturer database:
  - Technician claims: "Vehicle maintained per schedule"
  - Manufacturer records show: "No service records on file"
  - Discrepancy creates claim hold
  - Fleet manager provides proof of maintenance (receipts, invoices)
  - Claim reprocessed with correct records

**E4: Multiple Component Failure (Cascade Failure)**
- If alternator failure caused secondary damage:
  - Alternator seized, caused battery over-discharge
  - Battery now also dead/damaged
  - Warranty claim should cover:
    - Primary failure: Alternator (warranty)
    - Secondary damage: Battery (should also be covered)
  - Technician documents cascade relationship
  - Both components included in single warranty claim

#### Postconditions:
- Warranty claim documented with all required evidence
- Claim submitted to manufacturer
- Approval/denial status tracked
- Reimbursement received upon approval
- Customer charged appropriately (warranty portion covered)
- Failed component retained for historical record

#### Business Rules:
- BR-MT-050: Warranty claims require photo evidence of failed component
- BR-MT-051: Warranty eligibility verified before repair authorization
- BR-MT-052: Maintenance records must be current and accurate for claim approval
- BR-MT-053: Failed components retained for 30 days pending claim approval
- BR-MT-054: Claims submitted within 5 business days of repair completion

#### Related User Stories:
- US-MT-010: Warranty Claim Documentation

---

## Epic 5: Equipment and Tool Management

### UC-MT-011: Check Out Tools and Equipment

**Use Case ID**: UC-MT-011
**Use Case Name**: Check Out Tools and Equipment
**Actor**: Maintenance Technician (primary), Tool Manager (secondary)
**Priority**: Low

#### Preconditions:
- Tool inventory system is operational
- Tools have barcodes assigned
- Barcode scanner available on mobile device or dedicated device
- Tool tracking system is connected

#### Trigger:
- Technician needs specialized tool for repair work
- Technician begins work order requiring equipment checkout

#### Main Success Scenario:
1. Technician Alex begins transmission diagnostic work (WO-2025-1852)
2. Work order specifies: "Transmission fluid analysis and adjustments"
3. System suggests required tools:
   - Transmission dipstick gauge (specialized)
   - Torque wrench 25-150 Nm range
   - Transmission lift jack
4. Technician navigates to tool storage area
5. Technician searches for "Transmission dipstick gauge"
6. System displays available tools:
   - Tool ID: TL-445
   - Description: Transmission Fluid Level Gauge (Freightliner specific)
   - Status: Available
   - Location: Tool rack, position B3
   - Last calibration: 10/15/2025 (current)
7. Technician walks to Tool rack position B3
8. Technician scans barcode on tool: TL-445
9. System displays: "Transmission Dipstick Gauge - Checkout to Alex?"
10. Technician confirms: "Yes"
11. System records checkout:
    - Tool: TL-445
    - Technician: Alex
    - Work order: WO-2025-1852
    - Checkout time: 8:35 AM
    - Expected return: Today (end of work order)
    - Calibration status: ✓ Current (due 01/15/2026)
12. Technician takes tool and proceeds to work
13. Technician uses transmission dipstick gauge for fluid level check
14. Work order completed at 11:45 AM
15. Technician returns tool to storage
16. Technician scans tool barcode: TL-445
17. System displays: "Return tool TL-445?"
18. Technician confirms: "Yes"
19. System records return:
    - Tool: TL-445
    - Technician: Alex
    - Checkout duration: 3 hours 10 minutes
    - Return time: 11:46 AM
    - Tool condition: Good (no damage reported)
20. System updates tool availability: TL-445 now available for next technician

#### Alternative Flows:

**A1: Tool Calibration Due During Checkout**
- 11a. If tool calibration expiring soon:
  - System displays warning: "⚠ Calibration expires in 15 days"
  - Tool can be checked out but flag noted
  - Technician sees reminder: "Schedule calibration before next use"
  - Tool manager alerted to schedule calibration service

**A2: Tool Not Returned Within Expected Time**
- 14a. If technician keeps tool >24 hours:
  - System generates alert: "Tool TL-445 checked out >24 hours"
  - Tool manager receives notification
  - Tool manager contacts Alex: "Is tool still needed or can be returned?"
  - If needed: Extension granted with note
  - If forgotten: Gentle reminder to return

**A3: Multiple Tools Needed for Single Work Order**
- 3a. If technician needs several tools:
  - Technician checks out:
    - Transmission dipstick gauge
    - Torque wrench 25-150 Nm
    - Transmission lift jack
  - System batches all checkouts to same work order
  - Technician can return all at once when work complete

**A4: Tool Already Checked Out by Another Technician**
- 6a. If tool is in use elsewhere:
  - System shows: "TL-445 currently checked out to Mike Torres (since 7:30 AM)"
  - Expected return: "11:45 AM (same as this work order)"
  - Technician options:
    - Wait for return
    - Borrow equivalent tool if available
    - Delay work order
  - System tracks demand for tool (may need second unit)

#### Exception Flows:

**E1: Tool Barcode Not Scanning**
- If barcode reader fails:
  - Technician manually enters tool ID: TL-445
  - System finds tool by ID
  - Checkout proceeds with manual entry noted
  - Scanner sent for repair

**E2: Tool Reported as Damaged During Checkout**
- If tool has visible damage:
  - Technician scans tool, system shows: "Last condition: Good"
  - Technician discovers damage: "Wrench bent - cannot use"
  - Technician marks tool as: "Damaged - Do Not Use"
  - System flags for tool repair
  - Tool removed from circulation
  - Tool manager notified

**E3: Tool Not Returned - Search Required**
- If tool disappears:
  - System shows checkout: TL-445 to Alex, 3 days ago
  - Tool never scanned as returned
  - Alert: "Tool TL-445 missing"
  - Tool manager searches shop
  - If not found: Report filed as missing/lost
  - Depreciation recorded, replacement tool ordered

#### Postconditions:
- Tool checked out to technician and work order
- Tool available for use on job
- Checkout duration tracked
- Tool returned and availability updated
- Tool condition noted upon return
- Usage history maintained for tool maintenance planning

#### Business Rules:
- BR-MT-055: All tool checkouts require barcode scan
- BR-MT-056: Tool calibration must be current for use
- BR-MT-057: Tools checked out >24 hours trigger manager notification
- BR-MT-058: Tool damage reported immediately upon discovery
- BR-MT-059: Tool usage tracked for maintenance and replacement planning

#### Related User Stories:
- US-MT-011: Tool and Equipment Checkout

---

### UC-MT-012: Perform Safety Equipment Inspections

**Use Case ID**: UC-MT-012
**Use Case Name**: Perform Safety Equipment Inspections
**Actor**: Maintenance Technician (primary), Safety Officer (secondary)
**Priority**: Medium

#### Preconditions:
- Safety inspection schedule is current
- Equipment to be inspected is available in shop
- Digital safety checklist loaded in system
- Technician is qualified for OSHA safety inspections

#### Trigger:
- Daily, weekly, or monthly safety inspection is due
- System generates reminder at scheduled interval
- Dispatcher assigns safety inspection work order

#### Main Success Scenario:
1. System generates daily safety inspection reminder at 7:30 AM: "Daily Safety Inspection Due"
2. Technician Alex acknowledges and opens safety inspection work order: WO-SAFETY-DAILY-001
3. System displays daily safety inspection checklist:
   - **Hydraulic Lifts** (equipment lift #1, #2, #3)
   - **Air Compressor System** (main compressor)
   - **Emergency Equipment** (fire extinguishers, first aid kit)
   - **General Shop Safety** (aisles clear, slip hazards, etc.)
4. Technician begins with Lift #1 inspection:
   - Visual check: No visible cracks or damage to frame ✓ PASS
   - Operational check: Lift up and down smoothly ✓ PASS
   - Safety valve test: Relief pressure correct ✓ PASS
   - Documentation: Photos taken of lift status
5. Technician proceeds to Lift #2 and #3 - both pass
6. Technician inspects air compressor system:
   - Pressure gauge reading: 125 psi (spec: 100-130 psi) ✓ PASS
   - Safety relief valve test: Functions correctly ✓ PASS
   - Hose inspection: No cracks or leaks visible ✓ PASS
   - Documentation: Reading noted in system
7. Technician checks emergency equipment:
   - Fire extinguisher #1: Last serviced 03/2025, still valid ✓ PASS
   - Fire extinguisher #2: Last serviced 06/2024 (⚠ OVERDUE - Service required)
   - First aid kit: Supplies current and accessible ✓ PASS
   - Eye wash station: Functional and accessible ✓ PASS
8. System flags fire extinguisher #2: "FAILED - Overdue service"
9. Technician creates alert: "Fire extinguisher #2 requires service - schedule immediately"
10. Technician completes general shop safety check:
    - Main aisle clear of obstacles ✓ PASS
    - Electrical outlets in good condition ✓ PASS
    - Emergency exits clearly marked and accessible ✓ PASS
    - Slip hazards: None observed ✓ PASS
11. Inspection summary:
    - Total items inspected: 12
    - Passed: 11
    - Failed: 1 (fire extinguisher #2)
12. System creates corrective action item:
    - Item: Schedule fire extinguisher service
    - Severity: Medium
    - Deadline: Before next day
    - Assigned to: Safety Manager
13. Technician provides digital signature confirming inspection completion
14. System generates inspection report with date and technician name
15. Inspection history maintained for OSHA compliance
16. Fire extinguisher marked OUT OF SERVICE and roped off
17. Safety manager arranges service vendor for fire extinguisher
18. Service completed next day, extinguisher re-certified
19. Technician re-inspects and confirms: Fire extinguisher #2 ✓ PASS
20. System closes corrective action item

#### Alternative Flows:

**A1: Critical Safety Equipment Failure - Immediate Lockout**
- 7a. If critical equipment failure discovered:
  - Technician discovers: Hydraulic lift #1 leaking fluid
  - Technician immediately stops inspection
  - System marks lift: "OUT OF SERVICE - DO NOT USE"
  - Equipment roped off and locked
  - Safety officer contacted immediately
  - Work order created: "Repair hydraulic lift #1 - URGENT"
  - Technician diverts work to other lifts or postpones work

**A2: Monthly/Quarterly Comprehensive Inspection**
- 1a. If more detailed inspection required:
  - System displays expanded monthly checklist
  - Additional items beyond daily inspection
  - Load testing of lifts (100% capacity)
  - Pressure hose replacement intervals checked
  - Electrical grounding verification
  - More extensive documentation required
  - Estimated time: 3 hours vs 30 minutes daily

**A3: New Equipment Added to Shop**
- 1a. If new safety equipment installed:
  - New pneumatic hoist installed
  - Inspection schedule updated to include new equipment
  - Technician trained on new equipment inspection procedures
  - New equipment added to daily/weekly/monthly schedules
  - Baseline inspection documented

**A4: Inspection Deferred Due to Operational Constraint**
- 1a. If inspection cannot be completed due to work schedule:
  - Technician notes: "Cannot perform inspection - critical work in progress"
  - System allows deferment with reason documentation
  - Inspection rescheduled for next available time
  - Supervisor approval required for deferment
  - Deferred inspections tracked and prioritized

#### Exception Flows:

**E1: Inspector Lacks Qualification for Certain Equipment**
- If technician not trained for specialized equipment:
  - System blocks inspection: "Specialized equipment - requires certified inspector"
  - Technician notifies safety officer
  - Qualified inspector assigned
  - Specialized inspection scheduled and completed by qualified person

**E2: Required Inspection Equipment (Test Gauge) Unavailable**
- If calibrated test gauge is missing:
  - Inspection continues with available equipment
  - Pressure gauge reading taken with backup gauge
  - System notes: "Backup gauge used - primary not available"
  - Primary equipment recalibration scheduled

**E3: Safety Documentation System Offline**
- If digital system unavailable:
  - Technician completes paper inspection checklist
  - Technician manually documents findings with pen and paper
  - Upon system restoration: Technician manually enters data
  - Backup documentation maintained

**E4: Discrepancy Between Daily and Previous Inspection**
- If today's inspection shows different results than yesterday:
  - Yesterday: Fire extinguisher #1 PASS
  - Today: Fire extinguisher #1 appears FAILED (low pressure)
  - System alerts: "Fire extinguisher pressure drop detected"
  - Immediate investigation: Possible slow leak
  - Equipment may have developed fault overnight
  - Equipment marked OUT OF SERVICE for investigation

#### Postconditions:
- All equipment inspected per schedule
- Inspection results documented with photos/readings
- Failed equipment marked OUT OF SERVICE
- Corrective action items created for failures
- Inspection report filed for OSHA compliance
- Technician digitally signed inspection completion
- Next inspection date scheduled

#### Business Rules:
- BR-MT-060: Daily safety inspections must be completed before first maintenance operation
- BR-MT-061: Failed equipment must be immediately marked OUT OF SERVICE
- BR-MT-062: Corrective actions for failures must be assigned and tracked
- BR-MT-063: All inspections signed digitally for compliance documentation
- BR-MT-064: Inspection records retained for minimum 5 years (OSHA requirement)
- BR-MT-065: Critical equipment failures reported to safety officer within 15 minutes

#### Related User Stories:
- US-MT-012: Safety Equipment Inspection

---

## Summary

### Use Case Statistics:
- **Total Use Cases**: 12
- **High Priority**: 7 use cases
- **Medium Priority**: 4 use cases
- **Low Priority**: 1 use case

### Epic Distribution:
1. **Work Order Management**: 3 use cases
2. **Parts Inventory and Ordering**: 3 use cases
3. **Preventive Maintenance Execution**: 2 use cases
4. **Diagnostic and Repair Documentation**: 2 use cases
5. **Equipment and Tool Management**: 2 use cases

### Key Integration Points:
- **Mobile App**: Work order queue, labor tracking, photo capture, digital signatures
- **OBD-II Adapters**: Bluetooth diagnostic scanning, DTC reading
- **Parts Inventory**: Real-time stock levels, barcode scanning, cost tracking
- **Manufacturer Warranty Portals**: Claim submission, approval tracking
- **Fluid Analysis Labs**: Sample tracking, lab result integration
- **Tool Inventory**: Barcode tracking, checkout/return, calibration management
- **Shop Equipment**: Lift diagnostics, compressor monitoring, safety sensors

### Maintenance Technician-Specific Capabilities:
- **Mobile-First Interface**: 70% mobile, 30% web dashboard
- **Offline Capability**: Work queue, photos, documentation stored locally
- **Barcode Scanning**: Vehicles, parts, tools, samples
- **Labor Time Tracking**: Automatic from work order start/stop
- **Photo Documentation**: 3+ photos per work order required
- **Digital Signatures**: Completion, PM sign-off, warranty claims
- **OBD-II Integration**: Bluetooth adapter with live data stream
- **Preventive Maintenance Checklists**: Digital guided procedures with measurements
- **Parts Reservation**: Real-time availability, cross-location search
- **Emergency Response**: Roadside breakdown response, rapid assignment
- **Tool Checkout**: Tracking, calibration status, usage history
- **Safety Compliance**: OSHA-compliant equipment inspections, digital logs

---

## Related Documents

- **User Stories**: `user-stories/03_MAINTENANCE_TECHNICIAN_USER_STORIES.md`
- **Test Cases**: `test-cases/03_MAINTENANCE_TECHNICIAN_TEST_CASES.md` (to be created)
- **Workflows**: `workflows/03_MAINTENANCE_TECHNICIAN_WORKFLOWS.md` (to be created)
- **Mobile App Specifications**: `technical/MOBILE_APP_SPECIFICATIONS.md`
- **API Specifications**: `api/maintenance-endpoints.md` (to be created)

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-10 | Requirements Team | Initial maintenance technician use cases created |

---

*This document provides detailed use case scenarios supporting the Maintenance Technician user stories and operational workflows.*
