# Accountant / Finance Manager - Test Cases

**Role**: Accountant / Finance Manager
**Test Suite Version**: 1.0
**Date Created**: November 10, 2025
**Test Coverage**: User Stories US-AC-001 through US-AC-012
**Total Test Cases**: 24

---

## Table of Contents

1. [Invoice Processing Tests (TC-AC-001 to TC-AC-005)](#invoice-processing-tests)
2. [Approval Workflow Tests (TC-AC-006 to TC-AC-010)](#approval-workflow-tests)
3. [Fuel Reconciliation Tests (TC-AC-011 to TC-AC-014)](#fuel-reconciliation-tests)
4. [Cost Center Reporting Tests (TC-AC-015 to TC-AC-017)](#cost-center-reporting-tests)
5. [Budget Management Tests (TC-AC-018 to TC-AC-020)](#budget-management-tests)
6. [Depreciation Tests (TC-AC-021 to TC-AC-022)](#depreciation-tests)
7. [IFTA Reporting Tests (TC-AC-023 to TC-AC-024)](#ifta-reporting-tests)

---

## Invoice Processing Tests

### TC-AC-001: Process Valid Vendor Invoice with 3-Way Match

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-AC-001 |
| **Test Case Name** | Process Valid Vendor Invoice with 3-Way Match |
| **Related User Story** | US-AC-001: Vendor Invoice Processing |
| **Related Use Case** | UC-AC-001: Process Vendor Invoices |
| **Priority** | High |
| **Test Type** | Functional |
| **Automated** | Yes |

#### Preconditions
- Accountant is logged into the accounting system
- Purchase order PO-2025-0847 exists for $3,250.00
- Vendor "ABC Truck Parts" is on approved vendor list
- GL chart of accounts is configured with accounts 61-3201 and 61-3210
- Cost center "Fleet Operations" is defined
- Invoice receipt mechanism is operational (email integration)

#### Test Steps
1. Simulate receipt of invoice email from ABC Truck Parts with attachment
2. Verify system automatically detects and extracts invoice using OCR
3. Review extracted data: Vendor, Invoice Number (INV-45892), Date (2025-11-08), Amount ($3,247.50)
4. Verify system searches and matches to PO-2025-0847
5. Confirm 3-way match results display correctly:
   - PO Amount: $3,250.00
   - Receipt Amount: $3,247.50
   - Invoice Amount: $3,247.50
   - Status: MATCH (variance within 1%)
6. Verify vendor validation passes (approved vendor ✓)
7. Enter GL account coding:
   - Line 1: $2,400.00 → Account 61-3201 (Tire & Wheel Maintenance)
   - Line 2: $847.50 → Account 61-3210 (Routine Maintenance Labor)
8. Assign cost center: "Fleet Operations"
9. Add note: "4 tires + service - matched to Vehicle #287 maintenance"
10. Click "Submit for Approval"
11. Verify invoice status changes to "Pending Approval"
12. Verify approval notification is sent to assigned approver

#### Expected Results
- Invoice is created in system with all data extracted accurately
- 3-way match validates successfully with variance documented
- Vendor validated against approved vendor list
- GL accounts and cost center assigned correctly
- All required fields populated and validated
- Invoice transitions to approval workflow
- Audit trail records all actions with timestamps

#### Acceptance Criteria
- [ ] OCR extraction accuracy >95% (verified by accountant)
- [ ] 3-way match completed without error
- [ ] Vendor validation passed
- [ ] GL coding saved correctly (verified in database)
- [ ] Cost center allocation recorded
- [ ] Invoice submitted to next workflow step
- [ ] Approval notification sent to approver

#### Test Data
```
Vendor: ABC Truck Parts
Invoice Number: INV-45892
Invoice Date: 2025-11-08
Invoice Amount: $3,247.50
PO Number: PO-2025-0847
PO Amount: $3,250.00
Variance: $2.50 (0.077%) ✓ Within Tolerance
GL Accounts: 61-3201, 61-3210
Cost Center: Fleet Operations
Line Items: 4 Tires ($2,400), Service Labor ($847.50)
```

---

### TC-AC-002: Invoice Amount Exceeds PO Amount by >5%

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-AC-002 |
| **Test Case Name** | Invoice Amount Exceeds PO Amount by >5% |
| **Related User Story** | US-AC-001: Vendor Invoice Processing |
| **Related Use Case** | UC-AC-001: Process Vendor Invoices (A2) |
| **Priority** | High |
| **Test Type** | Functional |
| **Automated** | Yes |

#### Preconditions
- Accountant is logged into the system
- PO-2025-0850 exists for $3,250.00
- Corresponding invoice INV-45893 shows amount $3,600.00
- Business rule BR-AC-003 is active (>5% variance requires investigation)

#### Test Steps
1. Upload invoice INV-45893 from vendor
2. System extracts invoice amount: $3,600.00
3. System matches to PO-2025-0850: $3,250.00
4. System calculates variance: +$350.00 (10.8% over)
5. Verify system displays warning: "⚠ Invoice exceeds PO by $350.00"
6. Verify system shows detailed variance breakdown:
   - PO Amount: $3,250.00
   - Invoice Amount: $3,600.00
   - Variance: +$350.00 (10.8%)
   - Variance Type: EXCEEDS (flagged for review)
7. Accountant reviews variance explanation
8. Accountant contacts vendor and receives explanation: "Additional expedited freight charge $350.00"
9. Accountant enters variance note: "Additional freight charge approved by Fleet Manager"
10. Accountant approves additional charge with documentation
11. Accountant adjusts GL coding to include freight:
    - Original line: $3,250.00 → Account 61-3201
    - New freight line: $350.00 → Account 61-3299 (Freight & Shipping)
12. Submit invoice with variance documented
13. Verify approval routing includes flag for variance review

#### Expected Results
- System detects variance >5% and displays warning
- Variance details are displayed with clear breakdown
- Accountant can add variance explanation and documentation
- System allows approval with variance documented
- Audit trail records variance and resolution
- GL coding adjusted for additional charges

#### Acceptance Criteria
- [ ] Variance detected and warning displayed
- [ ] Variance breakdown shown with percentages
- [ ] Accountant can enter variance explanation
- [ ] Additional GL line created for freight
- [ ] Total invoice amount matches PO + freight
- [ ] Variance documented in audit trail
- [ ] Invoice can be submitted with variance noted

#### Test Data
```
Invoice Number: INV-45893
PO Number: PO-2025-0850
PO Amount: $3,250.00
Invoice Amount: $3,600.00
Variance: +$350.00
Variance %: 10.8%
Variance Reason: Expedited freight charge
GL Accounts Updated: 61-3201 ($3,250), 61-3299 ($350)
```

---

### TC-AC-003: OCR Data Extraction Error - Manual Correction

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-AC-003 |
| **Test Case Name** | OCR Data Extraction Error - Manual Correction |
| **Related User Story** | US-AC-001: Vendor Invoice Processing |
| **Related Use Case** | UC-AC-001: Process Vendor Invoices (E3) |
| **Priority** | High |
| **Test Type** | Functional |
| **Automated** | No |

#### Preconditions
- Accountant is logged into the system
- OCR service is operational and invoice PDF is available
- Business rule BR-AC-006 is active (OCR data must be visually verified)
- Manual correction interface is available

#### Test Steps
1. Upload invoice PDF with OCR extraction
2. System extracts data showing amount: $32,475.00 (should be $3,247.50)
3. Verify system displays extracted data on screen for manual verification
4. Accountant reviews invoice image and detects OCR error
5. Accountant identifies error: "$32,475.00" (extra "2" digit)
6. Click on amount field to edit
7. Correct extracted amount from $32,475.00 to $3,247.50
8. Verify system validates corrected amount
9. Review other extracted fields (vendor, date, PO, etc.) for accuracy
10. Confirm all corrections are accurate
11. Submit corrected invoice
12. Verify system records correction in audit trail
13. Verify system flags this invoice for OCR model improvement

#### Expected Results
- OCR error is detected and displayed for correction
- Accountant can manually edit extracted fields
- Corrected data is validated
- Correction is recorded in audit trail with who/when/what changed
- System flags invoice for OCR model improvement training
- Invoice proceeds with corrected data

#### Acceptance Criteria
- [ ] OCR extracted data displayed for verification
- [ ] Editable fields available for manual correction
- [ ] Correction saved and validated
- [ ] Audit trail records correction (user, timestamp, original/corrected value)
- [ ] OCR model flag recorded for improvement
- [ ] Invoice processes with corrected data

#### Test Data
```
Vendor: XYZ Services
Invoice Number: INV-45900
OCR Extracted Amount: $32,475.00 (ERROR)
Correct Amount: $3,247.50
PO Number: PO-2025-0855
Other Fields: Extracted correctly
Correction User: John Accountant
Correction Time: 2025-11-09 10:15 AM
```

---

### TC-AC-004: Invoice from Unauthorized Vendor

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-AC-004 |
| **Test Case Name** | Invoice from Unauthorized Vendor |
| **Related User Story** | US-AC-001: Vendor Invoice Processing |
| **Related Use Case** | UC-AC-001: Process Vendor Invoices (E2) |
| **Priority** | High |
| **Test Type** | Functional |
| **Automated** | Yes |

#### Preconditions
- Accountant is logged into the system
- Vendor "XYZ Supplies" is NOT on approved vendor list
- Approved vendor list is current and configured
- Procurement department access is available
- Business rule BR-AC-002 is active (approved vendors only)

#### Test Steps
1. Upload invoice INV-45901 from XYZ Supplies for $2,500.00
2. System extracts vendor name: "XYZ Supplies"
3. System searches approved vendor list for "XYZ Supplies"
4. System displays error: "❌ Vendor 'XYZ Supplies' not on approved vendor list"
5. Invoice blocked from processing - cannot proceed
6. Accountant reviews invoice details and notes:
   - Invoice is for legitimate fleet maintenance supplies
   - Vendor is new but authorized by procurement
7. Accountant contacts Procurement department
8. Procurement confirms: "XYZ Supplies is approved single-source vendor for hydraulic seals"
9. Procurement adds XYZ Supplies to approved vendor master data
10. Accountant resubmits invoice INV-45901
11. System re-validates vendor against updated approved vendor list
12. Vendor validation passes
13. Invoice proceeds through normal 3-way match process
14. Complete invoice processing

#### Expected Results
- System validates vendor against approved vendor list
- Unauthorized vendor invoice is blocked with clear error message
- Vendor can be authorized and added to approved list
- Invoice can be resubmitted after vendor authorization
- Processing completes successfully with vendor now approved
- Audit trail records vendor authorization action

#### Acceptance Criteria
- [ ] Approved vendor validation performed at receipt
- [ ] Unauthorized vendor error displayed with reason
- [ ] Invoice blocked until vendor authorized
- [ ] Procurement can update approved vendor master
- [ ] Resubmitted invoice validates successfully
- [ ] Audit trail records vendor authorization (user, timestamp, reason)

#### Test Data
```
Vendor: XYZ Supplies
Invoice Number: INV-45901
Invoice Amount: $2,500.00
Initial Status: NOT APPROVED
Authorization: Procurement confirms single-source status
Updated Status: APPROVED
GL Account: 61-3250 (Fleet Supplies)
Cost Center: Vehicle Fleet Operations
```

---

### TC-AC-005: Split Invoice Across Multiple Cost Centers

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-AC-005 |
| **Test Case Name** | Split Invoice Across Multiple Cost Centers |
| **Related User Story** | US-AC-001: Vendor Invoice Processing |
| **Related Use Case** | UC-AC-001: Process Vendor Invoices (A4) |
| **Priority** | Medium |
| **Test Type** | Functional |
| **Automated** | No |

#### Preconditions
- Accountant is logged into the system
- Invoice INV-45902 for $3,247.50 contains charges for multiple departments
- Multiple cost centers are defined: "Fleet Operations" and "Equipment Maintenance"
- GL chart supports multi-line invoice allocation

#### Test Steps
1. Upload invoice INV-45902 from vendor with mixed charges
2. System detects invoice contains charges for multiple departments:
   - Vehicle #287 maintenance (Fleet Operations): $2,200.00
   - Equipment repairs (Equipment Maintenance): $1,047.50
3. Verify total: $2,200.00 + $1,047.50 = $3,247.50 ✓
4. Accountant initiates split allocation
5. Create first invoice line:
   - Amount: $2,200.00
   - GL Account: 61-3201 (Tire & Wheel Maintenance)
   - Cost Center: Fleet Operations
6. Create second invoice line:
   - Amount: $1,047.50
   - GL Account: 61-4150 (Equipment Maintenance)
   - Cost Center: Equipment Maintenance
7. Verify system validates both allocations total equals invoice total
8. Verify system allows separate approval routing:
   - Line 1 ($2,200) routes to Fleet Operations Manager
   - Line 2 ($1,047.50) routes to Equipment Manager
9. Submit split invoice
10. Verify both lines proceed through approval workflow
11. Verify each line can be approved independently

#### Expected Results
- System allows split allocation of invoice across multiple lines
- Each line can have different GL account and cost center
- System validates total allocation equals invoice amount
- Each line is routed to appropriate approver
- Lines can be approved independently
- Audit trail shows allocation details

#### Acceptance Criteria
- [ ] Multiple invoice lines created with different allocations
- [ ] GL accounts assigned per line
- [ ] Cost centers assigned per line
- [ ] Total allocation validated (equals invoice amount)
- [ ] Each line routed to appropriate approver
- [ ] Independent approval available per line
- [ ] Audit trail records allocation details

#### Test Data
```
Invoice Number: INV-45902
Invoice Amount: $3,247.50
Line 1: $2,200.00
  - GL Account: 61-3201
  - Cost Center: Fleet Operations
  - Approver: Fleet Operations Manager
Line 2: $1,047.50
  - GL Account: 61-4150
  - Cost Center: Equipment Maintenance
  - Approver: Equipment Manager
Vendor: ABC Truck Parts
Description: Mixed maintenance charges
```

---

## Approval Workflow Tests

### TC-AC-006: Multi-Level Invoice Approval Routing

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-AC-006 |
| **Test Case Name** | Multi-Level Invoice Approval Routing |
| **Related User Story** | US-AC-002: Approval Workflow Management |
| **Related Use Case** | UC-AC-002: Approve Multi-Level Invoice Workflows |
| **Priority** | High |
| **Test Type** | Functional |
| **Automated** | Yes |

#### Preconditions
- Accountant has submitted invoice INV-45892 for $3,247.50
- Approval workflow is configured with amount thresholds
- Approval hierarchy defined: Manager < Director < VP
- Email notification system is operational
- Approvers have active access to system

#### Test Steps
1. Accountant submits invoice INV-45892 ($3,247.50) for approval
2. System calculates approval level required:
   - Amount: $3,247.50
   - Thresholds: <$1K (Manager), $1K-$5K (Manager + Director), >$5K (Manager + Director + VP)
   - Required: Manager approval + Director approval
3. System routes to first approver: Operations Manager Lisa Park
4. Verify system sends email notification to Lisa:
   - Subject: "Invoice Approval Required: ABC Truck Parts - $3,247.50"
   - Includes: Vendor, amount, GL coding, cost center, invoice image link
   - Action button: "Review and Approve"
5. Lisa receives notification and clicks approval link
6. Lisa reviews invoice details on approval page
7. Lisa verifies:
   - Vendor is approved ✓
   - Amount is reasonable ✓
   - GL coding is correct ✓
   - Cost center is appropriate ✓
   - Receipt matched ✓
8. Lisa clicks "Approve" button
9. System records approval:
   - Approver: Lisa Park
   - Time: 2025-11-09 10:32 AM
   - Decision: Approved
10. System automatically routes to second approver: Fleet Director John Martinez
11. System sends notification to John about secondary approval needed
12. John reviews and approves within 4 hours
13. System records second-level approval with timestamp
14. Invoice status changes to "Fully Approved"
15. System adds invoice to next scheduled payment run
16. System sends confirmation to accountant

#### Expected Results
- Approval workflow routes to correct approvers based on amount
- Email notifications sent with invoice details
- Approvers can review and approve invoices
- System records all approvals with timestamps
- Approval decisions are documented
- Invoice progresses to payment when fully approved

#### Acceptance Criteria
- [ ] Correct approvers identified based on amount thresholds
- [ ] Email notifications sent with invoice details
- [ ] Approvers can access and approve invoices
- [ ] Approval recorded with approver name and timestamp
- [ ] Approval decision documented
- [ ] Invoice transitions to "Fully Approved" status
- [ ] Confirmation sent to accountant

#### Test Data
```
Invoice Number: INV-45892
Invoice Amount: $3,247.50
GL Account: 61-3201, 61-3210
Cost Center: Fleet Operations
Approver 1: Lisa Park (Manager)
Approver 1 Decision: Approved at 2025-11-09 10:32 AM
Approver 2: John Martinez (Director)
Approver 2 Decision: Approved at 2025-11-09 2:30 PM
Final Status: Fully Approved
```

---

### TC-AC-007: Invoice Approval - Approver Requests Additional Information

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-AC-007 |
| **Test Case Name** | Invoice Approval - Approver Requests Additional Information |
| **Related User Story** | US-AC-002: Approval Workflow Management |
| **Related Use Case** | UC-AC-002: Approve Multi-Level Invoice Workflows (A1) |
| **Priority** | High |
| **Test Type** | Functional |
| **Automated** | No |

#### Preconditions
- Invoice INV-45892 is pending approval with Lisa Park
- Approval notification has been sent to approver
- Approver has opened invoice for review
- Business rule BR-AC-014 allows "Request Information" action

#### Test Steps
1. Approver Lisa Park opens invoice for approval
2. Lisa has question about invoice content
3. Lisa clicks "Request Additional Information" button
4. Lisa enters question: "Can you confirm these are the tires for Vehicle #287?"
5. System creates inquiry record linked to invoice
6. System sends notification to accountant with question
7. Accountant receives inquiry: Question from Lisa Park on Invoice INV-45892
8. Accountant reviews work order and confirms correct vehicle assignment
9. Accountant responds: "Yes, confirmed - Work Order WO-2025-1847"
10. Accountant attaches WO document as supporting evidence
11. System sends response notification to approver Lisa
12. Lisa receives response with accountant's answer
13. Lisa reviews response and supporting documentation
14. Lisa confirms she now has sufficient information
15. Lisa clicks "Approve" to approve invoice with previous inquiry resolved
16. System records approval with note: "Approved after clarification on vehicle assignment"
17. Invoice proceeds to next approval level (Director)

#### Expected Results
- Approver can request additional information without rejecting invoice
- Question is communicated to accountant with notification
- Accountant can respond with explanation and supporting documents
- Response is communicated back to approver
- Approver can approve after receiving information
- Inquiry and resolution are documented in audit trail

#### Acceptance Criteria
- [ ] "Request Information" option available to approver
- [ ] Question recorded with accountant notification
- [ ] Accountant can respond with explanation
- [ ] Supporting documents can be attached
- [ ] Response sent to approver with notification
- [ ] Approver can approve after information received
- [ ] Inquiry/response documented in audit trail

#### Test Data
```
Invoice Number: INV-45892
Approver: Lisa Park
Question: "Can you confirm these are the tires for Vehicle #287?"
Accountant Response: "Yes, confirmed - Work Order WO-2025-1847"
Supporting Document: Work Order WO-2025-1847
Approval Decision: Approved after clarification
Approval Time: 2025-11-09 2:15 PM
```

---

### TC-AC-008: Invoice Approval - Approver Rejects with Reason

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-AC-008 |
| **Test Case Name** | Invoice Approval - Approver Rejects with Reason |
| **Related User Story** | US-AC-002: Approval Workflow Management |
| **Related Use Case** | UC-AC-002: Approve Multi-Level Invoice Workflows (A2) |
| **Priority** | High |
| **Test Type** | Functional |
| **Automated** | No |

#### Preconditions
- Invoice INV-45892 is pending approval
- Approver Lisa Park has reviewed invoice
- Approver has concerns about invoice validity
- Business rule allows invoice rejection and resubmission

#### Test Steps
1. Approver Lisa Park opens invoice INV-45892 for review
2. Lisa notices potential issue: duplicate shipping charges
3. Lisa clicks "Reject" button
4. System displays rejection form with required reason field
5. Lisa enters rejection reason: "Need to verify this vendor didn't double-bill for shipping"
6. Lisa submits rejection
7. System records rejection:
   - Approver: Lisa Park
   - Time: 2025-11-09 1:45 PM
   - Reason: "Need to verify this vendor didn't double-bill for shipping"
   - Status: Rejected
8. System returns invoice to accountant in "Rejected" status
9. Accountant receives notification: "Invoice INV-45892 rejected by Lisa Park"
10. Accountant reviews rejection reason and contacts vendor
11. Vendor confirms: "Shipping was included in unit prices - no separate shipping charge"
12. Accountant obtains vendor confirmation in writing
13. Accountant updates invoice note: "Vendor confirmed shipping included in unit prices - no double-billing"
14. Accountant resubmits invoice for approval
15. Invoice returns to Lisa Park with accountant's clarification
16. Lisa reviews response and confirms shipping is not duplicated
17. Lisa approves invoice with confidence

#### Expected Results
- Approver can reject invoice with documented reason
- Rejection reason is recorded and communicated to accountant
- Invoice returns to accountant for correction
- Accountant can respond with additional investigation
- Invoice can be resubmitted after correction
- Approval can be granted after resolution
- Complete audit trail of rejection and resolution

#### Acceptance Criteria
- [ ] Reject option available to approver
- [ ] Rejection reason required and recorded
- [ ] Accountant notified of rejection with reason
- [ ] Invoice status changed to "Rejected"
- [ ] Accountant can investigate and respond
- [ ] Invoice can be resubmitted after correction
- [ ] Complete audit trail recorded

#### Test Data
```
Invoice Number: INV-45892
Approver: Lisa Park
Rejection Reason: "Need to verify this vendor didn't double-bill for shipping"
Rejection Time: 2025-11-09 1:45 PM
Accountant Response: "Vendor confirmed shipping included in unit prices"
Resubmission Time: 2025-11-09 3:30 PM
Final Approval: Approved at 2025-11-09 4:00 PM
```

---

### TC-AC-009: Invoice Approval SLA Escalation

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-AC-009 |
| **Test Case Name** | Invoice Approval SLA Escalation |
| **Related User Story** | US-AC-002: Approval Workflow Management |
| **Related Use Case** | UC-AC-002: Approve Multi-Level Invoice Workflows (A4) |
| **Priority** | High |
| **Test Type** | Functional |
| **Automated** | Yes |

#### Preconditions
- Invoice INV-45892 assigned to Lisa Park for approval on 2025-11-09 10:15 AM
- Approval SLA is configured: 24 business hours (next business day close of business)
- Escalation rules are active
- SLA monitoring job runs daily

#### Test Steps
1. Invoice submitted to Lisa Park for approval on 2025-11-09 10:15 AM
2. SLA deadline set: 2025-11-10 4:00 PM (24 business hours)
3. Accounting monitors invoice until 2025-11-10 3:59 PM - no approval received
4. At 2025-11-10 4:00 PM, SLA threshold exceeded
5. System triggers SLA escalation:
   - Sends escalation notification to Lisa's manager
   - Copies Director to expedite approval pathway
   - Marks invoice as "Escalated - Pending"
6. Escalation notification to Lisa's manager: "Invoice INV-45892 pending approval >24 hours - escalating"
7. Director receives notification and sees escalated invoice
8. Director prioritizes invoice due to escalation flag
9. Director reviews and approves invoice immediately
10. System records escalation:
    - Escalation Time: 2025-11-10 4:00 PM
    - Escalation Reason: "SLA Exceeded"
    - Escalation Action: "Routed to Director"
11. System notifies Lisa: "Invoice INV-45892 escalated due to approval delay"
12. Invoice status changes to "Approved"

#### Expected Results
- System monitors invoice approval SLA
- Escalation triggered when SLA exceeded
- Escalation notification sent to appropriate managers
- Invoice routed to manager's supervisor for approval
- Escalation decision recorded with timestamp
- Process improvement notification sent to approver

#### Acceptance Criteria
- [ ] SLA monitoring active (24 business hours)
- [ ] Escalation triggered at SLA threshold
- [ ] Escalation notification sent with clear reason
- [ ] Invoice routed to higher authority
- [ ] Escalation recorded in audit trail
- [ ] Process improvement feedback to approver
- [ ] Invoice approved and processed

#### Test Data
```
Invoice Number: INV-45892
Invoice Amount: $3,247.50
Approver: Lisa Park
SLA Deadline: 2025-11-10 4:00 PM (24 hours from 2025-11-09 10:15 AM)
Escalation Time: 2025-11-10 4:00 PM
Escalation Trigger: SLA Exceeded
Escalated To: Director John Martinez
Final Approval: 2025-11-10 4:30 PM
```

---

### TC-AC-010: Emergency Approval Override

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-AC-010 |
| **Test Case Name** | Emergency Approval Override |
| **Related User Story** | US-AC-002: Approval Workflow Management |
| **Related Use Case** | UC-AC-002: Approve Multi-Level Invoice Workflows (A3) |
| **Priority** | Medium |
| **Test Type** | Functional |
| **Automated** | No |

#### Preconditions
- Critical situation requiring urgent approval
- Invoice INV-45903 for emergency maintenance part ($8,500.00)
- Approver availability would delay payment >2 hours
- Emergency approval process is defined with audit trail

#### Test Steps
1. Fleet reports critical breakdown of Vehicle #301 - vehicle out of service
2. Emergency maintenance vendor requires payment authorization before delivery
3. Accountant logs in and prepares invoice INV-45903 ($8,500.00)
4. Accountant recognizes urgency and checks "Urgent Approval Request" checkbox
5. System displays urgency reason field
6. Accountant enters reason: "Critical vehicle breakdown - vehicle out of service - payment required for emergency delivery"
7. Accountant selects approval authority: "Director Approval Required" (due to invoice amount)
8. System flags invoice as URGENT and routes to Director immediately
9. System sends URGENT notification to Director with HIGH PRIORITY flag
10. Director receives notification: "URGENT - Invoice INV-45903 requires emergency approval"
11. Director reviews invoice within 30 minutes (vs normal 4-hour SLA)
12. Director approves emergency invoice
13. System records emergency override:
    - Urgent Flag: Yes
    - Reason: "Critical vehicle breakdown - vehicle out of service - payment required for emergency delivery"
    - Override User: Director John Martinez
    - Override Time: 2025-11-09 2:15 PM
    - Justification: Emergency maintenance approved
14. System processes payment immediately (bypasses scheduled payment batch)
15. System audits override decision with full documentation

#### Expected Results
- Emergency approval flag available with required justification
- Urgent invoices routed immediately to decision maker
- Approver receives urgent notification
- Approval documented with override reason
- Emergency invoices can bypass standard scheduling
- Complete audit trail of emergency decision

#### Acceptance Criteria
- [ ] Urgent flag can be set with justification
- [ ] Urgent notification sent to approver
- [ ] Expedited approval available (vs standard SLA)
- [ ] Override documented with reason
- [ ] Emergency approval recorded in audit trail
- [ ] Payment can be processed immediately
- [ ] Full audit trail of emergency action

#### Test Data
```
Invoice Number: INV-45903
Invoice Amount: $8,500.00
Emergency Reason: "Critical vehicle breakdown - vehicle out of service"
Urgent Flag: Yes
Priority Level: URGENT (HIGH)
Approver: Director John Martinez
Approval Time: 2025-11-09 2:15 PM (30 minutes vs 4-hour SLA)
Override Justification: Emergency maintenance - immediate payment required
Payment Processing: Immediate (vs scheduled batch)
```

---

## Fuel Reconciliation Tests

### TC-AC-011: Monthly Fuel Card Reconciliation - Auto-Match Success

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-AC-011 |
| **Test Case Name** | Monthly Fuel Card Reconciliation - Auto-Match Success |
| **Related User Story** | US-AC-003: Fuel Card Reconciliation |
| **Related Use Case** | UC-AC-003: Reconcile Fuel Card Transactions |
| **Priority** | High |
| **Test Type** | Functional |
| **Automated** | Yes |

#### Preconditions
- Fuel card provider data feed (WEX) is configured
- Driver fueling transactions are recorded in fleet system
- Vehicle assignment data is current
- Reconciliation dates are established (last business day of month)
- Fuel price history is available
- Monthly reconciliation process is ready to execute

#### Test Steps
1. Initiate monthly fuel reconciliation process on 2025-10-31
2. System imports fuel card transactions from WEX file:
   - Total transactions: 847
   - Date range: October 1-31, 2025
   - Data fields: Date, time, location, amount, vehicle ID
3. System imports driver-reported fuel entries from fleet system
4. System executes auto-matching algorithm:
   - Match criteria: Vehicle number + date ±2 hours + amount ±$5.00
5. System completes matching:
   - Successfully matched: 812 transactions (95.9%)
   - Unmatched: 35 transactions (4.1%)
6. Display reconciliation summary:
   - Status: 812 matched, 35 pending review
   - Match rate: 95.9%
7. System generates fuel metrics:
   - Total gallons purchased: 8,247 gallons
   - Total fleet miles: 156,400 miles
   - Average MPG: 18.96 (vs 18.5 target) ✓
   - Total fuel cost: $31,247.50
   - Cost per mile: $0.20
   - Cost per gallon: $3.79 average
8. System displays fraud/anomaly checks:
   - High-cost outliers: 2 transactions >$300 (reviewed as legitimate)
   - Duplicate charges: None detected ✓
   - Geographic anomalies: None detected ✓
   - Price outliers: None detected ✓
9. Accountant reviews unmatched transactions (35):
   - Identifies 8 personal fueling charges (exclude from fleet)
   - Identifies 2 rental vehicle fuel stops (exclude)
   - Identifies 2 credit adjustments (non-fuel, exclude)
   - Identifies remaining 23 as driver entry delays or timing mismatches
10. Accountant marks non-fleet transactions as excluded
11. System recalculates final reconciliation:
    - Fleet transactions reconciled: 835 / 835 (100%)
    - Variance: -$0.32 (0.001% - within tolerance)
12. System generates GL entries:
    - Debit: Account 61-5100 (Fuel Expense) $31,247.50
    - Credit: Account 20-1050 (Fuel Card Payable) $31,247.50
13. Accountant approves reconciliation
14. System records completion status: Complete
15. Generates next month reconciliation schedule

#### Expected Results
- Fuel card transactions imported successfully
- Auto-matching algorithm matches 95%+ of transactions
- Unmatched transactions identified for review
- Fraud/anomaly checks completed with no issues
- Fuel metrics calculated and compared to targets
- GL entries generated for accounting posting
- Reconciliation completed and approved

#### Acceptance Criteria
- [ ] 847 fuel card transactions imported
- [ ] 812 transactions matched (95.9%)
- [ ] Match criteria enforced (vehicle + date ±2h + amount ±$5)
- [ ] Fraud/anomaly checks passed
- [ ] Fuel metrics calculated and within expected ranges
- [ ] GL entries generated correctly
- [ ] Reconciliation approved and status "Complete"

#### Test Data
```
Report Period: October 1-31, 2025
Fuel Card Provider: WEX
Total Transactions: 847
Auto-Matched: 812 (95.9%)
Unmatched: 35 (4.1%)
Total Gallons: 8,247 gallons
Total Miles: 156,400 miles
Average MPG: 18.96 (Target: 18.5) ✓
Total Cost: $31,247.50
Cost per Mile: $0.20
Cost per Gallon: $3.79
Final Match Rate: 835/835 (100%)
Variance: -$0.32 (0.001%)
```

---

### TC-AC-012: Fuel Reconciliation - Identify and Resolve Duplicate Charge

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-AC-012 |
| **Test Case Name** | Fuel Reconciliation - Identify and Resolve Duplicate Charge |
| **Related User Story** | US-AC-003: Fuel Card Reconciliation |
| **Related Use Case** | UC-AC-003: Reconcile Fuel Card Transactions (A2) |
| **Priority** | High |
| **Test Type** | Functional |
| **Automated** | Yes |

#### Preconditions
- Fuel card reconciliation is in progress
- Duplicate charge detection is enabled in matching algorithm
- Duplicate charge example in test data: Two charges $67.80 on same pump at 1:47 PM and 1:50 PM

#### Test Steps
1. During fuel card import, system detects duplicate charges:
   - Transaction 1: Vehicle #287, Date: 2025-10-15, Time: 1:47 PM, Amount: $67.80, Location: Shell Station #1234
   - Transaction 2: Vehicle #287, Date: 2025-10-15, Time: 1:50 PM, Amount: $67.80, Location: Shell Station #1234
2. System identifies duplicate pattern:
   - Same vehicle, same location, same amount
   - Time difference: 3 minutes (likely duplicate)
3. System marks as potential duplicate: "⚠ Duplicate charge detected"
4. System displays duplicate pair for review:
   - Shows both transactions side-by-side
   - Highlights matching criteria (Vehicle, Time, Amount, Location)
   - Suggests one should be removed
5. Accountant reviews duplicate charge:
   - Confirms both transactions are identical
   - Verifies driver only filled once on this date
6. Accountant marks one transaction as "Duplicate - Remove"
7. System removes duplicate from reconciliation:
   - Keeps first transaction (1:47 PM)
   - Removes second transaction (1:50 PM duplicate)
8. System records duplicate resolution:
   - Date: 2025-10-31 3:30 PM
   - Duplicate Removed: $67.80
   - Justification: Same vehicle, location, amount, and time
9. System recalculates reconciliation totals (reduced by $67.80)
10. Fuel card transaction count adjusted: 847 → 846 (one duplicate removed)
11. System documents in audit trail: "Duplicate charge removed: Transaction ID 45892 (duplicate of 45891)"

#### Expected Results
- Duplicate charges detected by matching algorithm
- Duplicate pairs identified with clear indication
- Accountant can review and confirm duplicates
- Duplicate transactions can be removed from reconciliation
- System recalculates totals after removal
- Audit trail documents duplicate resolution

#### Acceptance Criteria
- [ ] Duplicate detection algorithm active
- [ ] Duplicate pairs identified (same vehicle, location, amount, time)
- [ ] Accountant can review duplicate candidates
- [ ] Duplicates can be marked and removed
- [ ] Reconciliation totals recalculated
- [ ] Audit trail records removal (who, when, which transaction)

#### Test Data
```
Vehicle: #287
Transaction 1: 2025-10-15, 1:47 PM, $67.80, Shell Station #1234
Transaction 2: 2025-10-15, 1:50 PM, $67.80, Shell Station #1234 (DUPLICATE)
Time Difference: 3 minutes (indicates duplicate)
Action: Remove Transaction 2 (duplicate of Transaction 1)
Reconciliation Impact: Total reduced by $67.80
Transaction Count: 847 → 846
```

---

### TC-AC-013: Fuel Reconciliation - Investigate Fuel Price Spike

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-AC-013 |
| **Test Case Name** | Fuel Reconciliation - Investigate Fuel Price Spike |
| **Related User Story** | US-AC-003: Fuel Card Reconciliation |
| **Related Use Case** | UC-AC-003: Reconcile Fuel Card Transactions (A1) |
| **Priority** | Medium |
| **Test Type** | Functional |
| **Automated** | Yes |

#### Preconditions
- Fuel reconciliation is in progress
- Fuel price anomaly detection is enabled
- Test data includes unusual price spike: $7.50/gallon
- Average fuel price for period: $3.79/gallon

#### Test Steps
1. System analyzes fuel transactions during reconciliation
2. Average fuel price calculated: $3.79/gallon (October 2025 market)
3. System detects anomaly in fuel prices:
   - Most transactions: $3.65-$3.95/gallon
   - One transaction anomaly: $7.50/gallon
   - Variance: +$3.71/gallon (98% above average)
4. System displays warning: "⚠ Fuel price 98% above average for this transaction"
5. System provides details for this anomalous transaction:
   - Vehicle: #301
   - Date: 2025-10-22
   - Location: "Nowhere Station, AK" (Alaska)
   - Amount: $450.00
   - Quantity: 60 gallons
   - Price per gallon: $7.50
6. Accountant investigates anomaly
7. Accountant researches location: Nowhere Station is in remote Alaska
8. Accountant verifies: Alaska fuel prices are documented as extremely high due to remote location and shipping costs
9. Accountant confirms this transaction is legitimate
10. Accountant approves anomalous transaction with note: "Legitimate Alaska remote location fuel - high price justified"
11. System records anomaly investigation:
    - Anomaly Detected: $7.50/gallon price (98% above average)
    - Investigation: Location confirmed as remote Alaska
    - Resolution: Legitimate - transaction approved
    - Approver: John Accountant
    - Date: 2025-10-31 2:45 PM
12. System proceeds with reconciliation including anomalous transaction

#### Expected Results
- Fuel price anomalies detected during reconciliation
- System flags high-price outliers for review
- Accountant can investigate price spike and approve if legitimate
- Resolution documented with justification
- Transaction included in reconciliation with anomaly noted

#### Acceptance Criteria
- [ ] Fuel price anomaly detection active
- [ ] Outlier prices flagged (>X% above average)
- [ ] Anomalous transaction details displayed
- [ ] Accountant can approve legitimate anomalies
- [ ] Resolution documented with justification
- [ ] Transaction processed despite price anomaly

#### Test Data
```
Anomaly Transaction:
  Vehicle: #301
  Date: 2025-10-22
  Location: Nowhere Station, AK
  Amount: $450.00
  Quantity: 60 gallons
  Price per Gallon: $7.50
  Average Price: $3.79/gallon
  Variance: +$3.71/gallon (98% above average)
  Investigation Result: Legitimate (remote Alaska location)
  Approval: Approved with justification
```

---

### TC-AC-014: Fuel Reconciliation - Driver Fuel Entry Error Detection

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-AC-014 |
| **Test Case Name** | Fuel Reconciliation - Driver Fuel Entry Error Detection |
| **Related User Story** | US-AC-003: Fuel Card Reconciliation |
| **Related Use Case** | UC-AC-003: Reconcile Fuel Card Transactions (Main Flow, Step 8) |
| **Priority** | High |
| **Test Type** | Functional |
| **Automated** | Yes |

#### Preconditions
- Fuel reconciliation in progress
- Driver fuel entry system is available with submitted entries
- Test case includes driver entry with obvious data entry error
- Fuel card charge: $67.50 vs Driver entry: 75 gallons @ $0.90/gal

#### Test Steps
1. During auto-matching process, system identifies discrepancy:
   - Fuel card charge: $67.50 (Vehicle #312, 2025-10-22)
   - Driver fuel entry: 75 gallons @ $0.90/gallon = $67.50 (amounts match)
   - Issue: Fuel price ($0.90/gal) is unrealistically low
   - Current market rate: ~$3.79/gallon
2. System calculates actual gallons from card charge:
   - Card amount: $67.50
   - Market price: ~$1.80/gallon (Oct 22 station average)
   - Calculated gallons: $67.50 ÷ $1.80 = 37.5 gallons
3. System detects discrepancy: Driver entry (75 gal) vs Calculated (37.5 gal)
4. System flags entry: "⚠ Driver entry amount inconsistent with fuel card charge"
5. System displays comparison:
   - Driver Entry: 75 gallons @ $0.90/gal = $67.50
   - Card Charge: $67.50
   - Calculated Gallons: 37.5 gallons @ $1.80/gal
   - Discrepancy: Driver entry error (100% over actual gallons)
6. Accountant reviews discrepancy details
7. Accountant contacts driver: "Your fuel log shows 75 gallons but card charge is $67.50 - this doesn't match market prices. Can you verify?"
8. Driver reviews and corrects entry: "Oops, I made a typo. It was 37.5 gallons - half tank"
9. Accountant updates driver fuel entry:
   - Old entry: 75 gallons
   - New entry: 37.5 gallons
   - Unit price clarification: $1.80/gallon (not $0.90)
   - Corrected total: 37.5 gallons × $1.80/gallon = $67.50 ✓
10. System re-matches transaction with corrected driver entry
11. Transaction now matches properly: Card $67.50 = Driver entry $67.50
12. System records correction:
    - Driver: John Smith
    - Vehicle: #312
    - Date: 2025-10-31 (correction date)
    - Original Entry: 75 gallons
    - Corrected Entry: 37.5 gallons
    - Correction Reason: Driver data entry error (1.5x typo)
13. Reconciliation updated with corrected entry

#### Expected Results
- Driver entry discrepancies detected during matching
- System identifies likely data entry errors
- Accountant can correct driver entries with validation
- Corrected entries match fuel card charges
- Correction documented in audit trail
- Reconciliation continues with corrected data

#### Acceptance Criteria
- [ ] Driver entry discrepancies detected
- [ ] Mismatch between entry and card charge identified
- [ ] Accountant notified of discrepancy
- [ ] Driver can verify and correct entry
- [ ] Corrected entry re-validated
- [ ] Audit trail records correction (user, original, corrected)

#### Test Data
```
Vehicle: #312
Date: 2025-10-22
Card Charge: $67.50
Original Driver Entry: 75 gallons @ $0.90/gal
Issue: Unrealistic fuel price ($0.90/gal vs $1.80/gal market)
Calculated Actual Gallons: 37.5 gallons
Corrected Driver Entry: 37.5 gallons @ $1.80/gal = $67.50 ✓
Driver: John Smith
Correction Justification: Data entry error (driver typo - entered 75 instead of 37.5)
```

---

## Cost Center Reporting Tests

### TC-AC-015: Generate Cost Center Report - Monthly Summary

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-AC-015 |
| **Test Case Name** | Generate Cost Center Report - Monthly Summary |
| **Related User Story** | US-AC-004: Cost Center Reporting |
| **Related Use Case** | UC-AC-004: Generate Cost Center Reports |
| **Priority** | High |
| **Test Type** | Functional |
| **Automated** | Yes |

#### Preconditions
- Cost centers are defined: "Fleet Operations", "Regional Distribution", "Equipment Maintenance"
- Vehicles are assigned to cost centers
- All October 2025 transactions are posted to GL
- Cost allocation rules are configured
- Report generation tool is operational

#### Test Steps
1. Accountant opens Cost Center Reporting dashboard
2. Selects report type: "Monthly Summary by Cost Center"
3. Selects period: October 2025
4. System generates cost allocation:
   - Retrieves all transactions for October 2025
   - Allocates to appropriate cost centers based on vehicle assignment
   - Calculates costs by category: Fuel, Maintenance, Parts, Insurance, Depreciation
5. System displays summary report:

   **Fleet Operations**
   - Fuel: $8,500.00
   - Maintenance: $12,200.00
   - Parts: $5,400.00
   - Insurance: $3,200.00
   - Depreciation: $8,900.00
   - **Total: $38,200.00**

   **Regional Distribution**
   - Fuel: $6,200.00
   - Maintenance: $8,900.00
   - Parts: $3,100.00
   - Insurance: $2,100.00
   - Depreciation: $5,600.00
   - **Total: $25,900.00**

   **Equipment Maintenance**
   - Fuel: $2,800.00
   - Maintenance: $4,500.00
   - Parts: $1,800.00
   - Insurance: $900.00
   - Depreciation: $2,100.00
   - **Total: $12,100.00**

6. System displays drill-down capability - accountant can click on any cost center to see detailed transactions
7. Accountant clicks on "Fleet Operations - Maintenance" to drill down
8. System displays transaction detail:
   - All maintenance transactions assigned to Fleet Operations in October
   - Includes vendor, date, amount, GL account, description
   - Format: Detail table with sort/filter options
9. Accountant exports report to Excel format
10. System generates downloadable Excel file with:
    - Summary sheet with cost center totals
    - Detail sheets for each cost center
    - Pivot table for analysis
    - Line item transactions

#### Expected Results
- Cost center report generated with all transactions allocated correctly
- Summary shows costs by category for each cost center
- Drill-down capability available for detailed review
- Export to Excel with pivot tables available
- Report accurate and complete

#### Acceptance Criteria
- [ ] All cost centers included in report
- [ ] Costs allocated correctly by cost center
- [ ] Costs breakdown by category (Fuel, Maint, Parts, Insurance, Depreciation)
- [ ] Monthly totals calculated correctly
- [ ] Drill-down available to transaction detail
- [ ] Export to Excel functional with pivot tables
- [ ] Report accurate (verified against GL)

#### Test Data
```
Period: October 2025
Report Type: Monthly Summary by Cost Center
Cost Centers: Fleet Operations, Regional Distribution, Equipment Maintenance
Total Fuel Costs: $17,500.00
Total Maintenance Costs: $25,600.00
Total Parts Costs: $10,300.00
Total Insurance Costs: $6,200.00
Total Depreciation Costs: $16,600.00
Total Fleet Costs: $76,200.00
```

---

### TC-AC-016: Cost Center Report - Period-over-Period Comparison

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-AC-016 |
| **Test Case Name** | Cost Center Report - Period-over-Period Comparison |
| **Related User Story** | US-AC-004: Cost Center Reporting |
| **Related Use Case** | UC-AC-004: Generate Cost Center Reports |
| **Priority** | Medium |
| **Test Type** | Functional |
| **Automated** | Yes |

#### Preconditions
- Cost center reports available for both September and October 2025
- Cost data complete and accurate for both periods
- Comparison analysis tool is operational

#### Test Steps
1. Accountant selects report type: "Period-over-Period Comparison"
2. Selects periods: September 2025 vs October 2025
3. Selects cost center: "Fleet Operations"
4. System generates comparison report:

   | Category | September | October | Variance $ | Variance % |
   |----------|-----------|---------|-----------|-----------|
   | Fuel | $8,200.00 | $8,500.00 | +$300.00 | +3.7% |
   | Maintenance | $11,800.00 | $12,200.00 | +$400.00 | +3.4% |
   | Parts | $5,100.00 | $5,400.00 | +$300.00 | +5.9% |
   | Insurance | $3,200.00 | $3,200.00 | $0.00 | 0.0% |
   | Depreciation | $8,900.00 | $8,900.00 | $0.00 | 0.0% |
   | **Total** | **$37,200.00** | **$38,200.00** | **+$1,000.00** | **+2.7%** |

5. System highlights variances and trends
6. System identifies largest drivers of variance:
   - Fuel: +3.7% (higher fuel prices in October)
   - Parts: +5.9% (additional tire inventory)
   - Maintenance: +3.4% (seasonal maintenance increase)
7. Accountant reviews variance drivers
8. Accountant adds variance commentary:
   - "Fuel variance due to market price increase (Sept: $3.65, Oct: $3.79 avg)"
   - "Parts variance due to proactive tire inventory purchase for Q4"
   - "Maintenance variance normal for seasonal increase"
9. System allows comparison across multiple periods (Q3 2025 vs Q4 2025)
10. Accountant generates quarterly comparison report
11. System displays trends over time
12. Accountant exports comparison report to Excel with charts

#### Expected Results
- Period-over-period comparison generated accurately
- Variances calculated (dollars and percentages)
- Variance drivers identified
- Accountant can add commentary
- Multi-period comparison available
- Export to Excel with trend charts

#### Acceptance Criteria
- [ ] Both periods data retrieved and compared
- [ ] Variances calculated correctly ($ and %)
- [ ] Largest variance drivers highlighted
- [ ] Accountant can add variance notes
- [ ] Multi-period comparison available
- [ ] Excel export with charts functional

#### Test Data
```
Comparison Periods: September 2025 vs October 2025
Cost Center: Fleet Operations
Total September: $37,200.00
Total October: $38,200.00
Total Variance: +$1,000.00 (+2.7%)
Variance Drivers:
  - Fuel: +3.7% (market prices)
  - Parts: +5.9% (tire inventory)
  - Maintenance: +3.4% (seasonal)
```

---

### TC-AC-017: Cost Allocation Split - Multi-Vehicle Assignment

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-AC-017 |
| **Test Case Name** | Cost Allocation Split - Multi-Vehicle Assignment |
| **Related User Story** | US-AC-004: Cost Center Reporting |
| **Related Use Case** | UC-AC-004: Generate Cost Center Reports |
| **Priority** | Medium |
| **Test Type** | Functional |
| **Automated** | Yes |

#### Preconditions
- Vehicles can be assigned to multiple cost centers
- Cost allocation percentage rules are configured
- System can split costs proportionally
- Test vehicle shares use between two departments

#### Test Steps
1. Identify vehicle that is shared across multiple cost centers
   - Vehicle #305: Used 60% by Fleet Operations, 40% by Equipment Maintenance
2. Retrieve all October 2025 transactions for Vehicle #305
3. System allocates costs based on usage percentages:
   - Total Fuel Cost: $1,000.00
     - 60% → Fleet Operations: $600.00
     - 40% → Equipment Maintenance: $400.00
   - Total Maintenance: $2,000.00
     - 60% → Fleet Operations: $1,200.00
     - 40% → Equipment Maintenance: $800.00
4. System applies allocation rules to all cost categories
5. System validates total allocation = original transaction amount
6. Generate cost center report including shared vehicle allocation
7. Verify Fleet Operations report includes 60% of Vehicle #305 costs
8. Verify Equipment Maintenance report includes 40% of Vehicle #305 costs
9. System allows adjustment of allocation percentages if needed
10. Accountant modifies allocation: 55% / 45% (adjusted usage)
11. System recalculates and updates cost center reports

#### Expected Results
- Shared vehicle costs allocated by percentage
- All categories allocated proportionally
- Total allocation equals original transaction amount
- Both cost centers report correctly allocated amounts
- Allocation percentages can be adjusted
- Reports updated with adjusted allocations

#### Acceptance Criteria
- [ ] Shared vehicle identified with allocation percentages
- [ ] All cost categories allocated by percentage
- [ ] Total allocated = original transaction (no rounding errors)
- [ ] Both cost centers report allocated amounts
- [ ] Allocation percentages updatable
- [ ] Report generation reflects allocations

#### Test Data
```
Shared Vehicle: #305
Allocation: 60% Fleet Operations, 40% Equipment Maintenance
October Fuel: $1,000.00
  - Fleet Operations: $600.00 (60%)
  - Equipment Maintenance: $400.00 (40%)
October Maintenance: $2,000.00
  - Fleet Operations: $1,200.00 (60%)
  - Equipment Maintenance: $800.00 (40%)
```

---

## Budget Management Tests

### TC-AC-018: Create Annual Budget with Seasonality

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-AC-018 |
| **Test Case Name** | Create Annual Budget with Seasonality |
| **Related User Story** | US-AC-007: Annual Budget Planning |
| **Related Use Case** | UC-AC-007: Create Annual Budgets |
| **Priority** | High |
| **Test Type** | Functional |
| **Automated** | No |

#### Preconditions
- Accountant is logged into budget planning module
- Prior year budget data available (2024)
- Historical spending data available
- Cost center definitions complete
- Budget approval workflow configured

#### Test Steps
1. Accountant opens Budget Planning tool
2. Selects "Create New Annual Budget" for 2026
3. Selects option to copy 2025 budget and adjust by percentage
4. Specifies overall increase: +3.5% (due to projected inflation and volume growth)
5. System applies 3.5% increase to all categories:
   - Base 2025 Fuel Budget: $100,000 × 1.035 = $103,500
   - Base 2025 Maintenance Budget: $150,000 × 1.035 = $155,250
   - Base 2025 Parts Budget: $80,000 × 1.035 = $82,800
   - Base 2025 Insurance Budget: $120,000 × 1.035 = $124,200
6. Accountant manually adjusts for seasonality:
   - Fuel: Higher consumption in winter months (Dec-Feb)
     - Jan: +15% above average
     - Feb: +12% above average
     - Jul-Aug: -10% below average (reduced operation)
   - Maintenance: Higher in spring (Apr-Jun) for preventive maintenance
     - Apr-Jun: +20% above average
   - Parts: Distributed evenly
7. System displays monthly allocation:

   | Month | Fuel | Maint | Parts | Insurance |
   |-------|------|-------|-------|-----------|
   | Jan | $10,160 | $12,500 | $6,900 | $10,350 |
   | Feb | $9,660 | $12,500 | $6,900 | $10,350 |
   | Mar | $8,100 | $12,500 | $6,900 | $10,350 |
   | Apr | $8,100 | $15,000 | $6,900 | $10,350 |
   | May | $8,100 | $15,000 | $6,900 | $10,350 |
   | Jun | $8,100 | $15,000 | $6,900 | $10,350 |
   | Jul | $7,610 | $12,500 | $6,900 | $10,350 |
   | Aug | $7,610 | $12,500 | $6,900 | $10,350 |
   | Sep | $8,100 | $12,500 | $6,900 | $10,350 |
   | Oct | $8,100 | $12,500 | $6,900 | $10,350 |
   | Nov | $9,160 | $12,500 | $6,900 | $10,350 |
   | Dec | $10,160 | $12,500 | $6,900 | $10,350 |
   | **Total** | **$103,500** | **$155,250** | **$82,800** | **$124,200** |

8. Allocate budget across cost centers:
   - Fleet Operations: 50% of all categories
   - Regional Distribution: 35% of all categories
   - Equipment Maintenance: 15% of all categories
9. Accountant creates scenario variations:
   - Conservative (3% growth): $340,650 total
   - Expected (3.5% growth): $345,750 total
   - Aggressive (5% growth): $360,900 total
10. System validates budget totals against company guidelines
11. Accountant submits budget for approval
12. System changes status to "Submitted"
13. Budget ready for management review and approval

#### Expected Results
- Annual budget created with seasonality adjustments
- Monthly allocations reflect seasonal patterns
- Budget allocated across cost centers
- Multiple scenarios generated
- Budget submitted for approval workflow
- Validation checks pass

#### Acceptance Criteria
- [ ] Annual budget created for 2026
- [ ] Base budget calculated with +3.5% increase
- [ ] Monthly seasonality adjustments applied
- [ ] Monthly totals sum to annual budget
- [ ] Cost centers allocated proportionally
- [ ] Scenario variations generated
- [ ] Budget validation passed
- [ ] Budget submitted status recorded

#### Test Data
```
Budget Year: 2026
Base Year: 2025
Growth Rate: 3.5%
Total Budget: $345,750
  - Fuel: $103,500
  - Maintenance: $155,250
  - Parts: $82,800
  - Insurance: $124,200
Cost Center Allocation:
  - Fleet Operations: 50%
  - Regional Distribution: 35%
  - Equipment Maintenance: 15%
Scenarios: Conservative (3%), Expected (3.5%), Aggressive (5%)
Status: Submitted for Approval
```

---

### TC-AC-019: Monitor Budget Variance in Real-Time

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-AC-019 |
| **Test Case Name** | Monitor Budget Variance in Real-Time |
| **Related User Story** | US-AC-008: Budget Variance Analysis |
| **Related Use Case** | UC-AC-008: Monitor Budget Variance |
| **Priority** | High |
| **Test Type** | Functional |
| **Automated** | Yes |

#### Preconditions
- 2025 budget is approved and active
- November 2025 transactions are being posted daily
- Budget variance monitoring is enabled
- Dashboard alert thresholds configured (>10% warning, >15% alert)

#### Test Steps
1. Accountant opens Budget Variance Dashboard on November 10, 2025
2. System displays current month budget vs actual (Month-to-Date):

   | Category | Budget (MTD) | Actual (MTD) | Variance $ | Variance % | Status |
   |----------|-------------|------------|-----------|-----------|--------|
   | Fuel | $8,500 | $9,200 | +$700 | +8.2% | ⚠ Monitor |
   | Maint | $12,900 | $14,100 | +$1,200 | +9.3% | ⚠ Monitor |
   | Parts | $6,800 | $7,100 | +$300 | +4.4% | OK |
   | Insurance | $10,350 | $10,350 | $0 | 0.0% | OK |
   | Depreciation | $7,400 | $7,400 | $0 | 0.0% | OK |
   | **Total** | **$45,950** | **$48,150** | **+$2,200** | **+4.8%** | **OK** |

3. System also displays Year-to-Date variance:

   | Category | Budget (YTD) | Actual (YTD) | Variance $ | Variance % | Status |
   |----------|-------------|------------|-----------|-----------|--------|
   | Fuel | $91,000 | $94,500 | +$3,500 | +3.8% | OK |
   | Maint | $137,600 | $143,200 | +$5,600 | +4.1% | OK |
   | Parts | $72,800 | $75,400 | +$2,600 | +3.6% | OK |
   | Insurance | $110,700 | $110,700 | $0 | 0.0% | OK |
   | Depreciation | $79,200 | $79,200 | $0 | 0.0% | OK |
   | **Total** | **$491,300** | **$503,000** | **+$11,700** | **+2.4%** | **OK** |

4. System highlights categories exceeding >10% threshold for MTD
5. Dashboard shows system is forecasting year-end spending based on current run rate
6. Year-end forecast calculation:
   - Current monthly burn rate (Nov 10): $4,815/day
   - Months remaining: 1.67 (Nov 10-30 plus December)
   - Remaining forecast: $4,815 × 51 = $245,565
   - Year-end total forecast: $503,000 + $245,565 = $748,565
   - Budget: $740,000
   - Forecast variance: +$8,565 (+1.2% over budget)
7. System displays forecast vs budget
8. Accountant receives alerts for categories approaching >90% of annual budget
9. System shows specific alerts:
   - "Fuel approaching budget limit: 93.8% of annual budget used" (with 7.7 weeks remaining)
10. Accountant adds variance explanation notes:
    - Fuel: "Increased rates in Oct-Nov due to market prices; forecast to normalize in Dec"
    - Maintenance: "Seasonal increase for winter preparation; normal pattern"
    - Parts: "Proactive tire inventory purchase in September; normalized in Oct-Nov"
11. System exports variance report with commentary for management review

#### Expected Results
- Real-time budget vs actual dashboard displayed
- MTD and YTD variances calculated and shown
- Variances displayed as dollars and percentages
- Categories exceeding thresholds highlighted
- Year-end forecast calculated
- Alerts generated for approaching budget limits
- Accountant can add variance commentary

#### Acceptance Criteria
- [ ] Budget vs actual variance calculated correctly
- [ ] MTD and YTD variances displayed
- [ ] Variance thresholds monitored (>10%)
- [ ] Categories approaching limits highlighted
- [ ] Year-end forecast calculated
- [ ] Alerts generated for >90% budget usage
- [ ] Commentary notes recorded

#### Test Data
```
Monitoring Date: November 10, 2025
Budget Year: 2025
MTD Period: November 1-10
MTD Fuel Variance: +$700 (+8.2%)
MTD Maintenance Variance: +$1,200 (+9.3%)
YTD Total Variance: +$11,700 (+2.4%)
Year-end Forecast: $748,565
Annual Budget: $740,000
Forecast Variance: +$8,565 (+1.2%)
```

---

### TC-AC-020: Budget Variance Drill-Down to Transaction Level

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-AC-020 |
| **Test Case Name** | Budget Variance Drill-Down to Transaction Level |
| **Related User Story** | US-AC-008: Budget Variance Analysis |
| **Related Use Case** | UC-AC-008: Monitor Budget Variance |
| **Priority** | Medium |
| **Test Type** | Functional |
| **Automated** | Yes |

#### Preconditions
- Budget variance dashboard is displayed
- Fuel category shows +$700 variance for MTD
- Detailed transaction-level data is available
- Drill-down capability is enabled

#### Test Steps
1. Accountant views MTD Fuel variance: Budget $8,500 vs Actual $9,200 (+$700)
2. Accountant clicks on Fuel category to drill down
3. System displays detailed breakdown by subcategory:
   - Unleaded Gasoline: Budget $5,000, Actual $5,200 (+$200 +4%)
   - Diesel: Budget $3,500, Actual $4,000 (+$500 +14.3%)
4. Accountant notices large diesel variance (+14.3%)
5. Accountant clicks on Diesel to drill down further
6. System displays transaction-level detail:

   | Date | Vehicle | Location | Gallons | Price/Gal | Amount | Notes |
   |------|---------|----------|---------|-----------|--------|-------|
   | 11/1 | #287 | Shell | 35 | $1.85 | $64.75 | Normal |
   | 11/2 | #301 | Speedway | 42 | $1.88 | $78.96 | Normal |
   | 11/3 | #305 | TA Truck Stop | 50 | $1.95 | $97.50 | High price |
   | 11/5 | #312 | Love's | 38 | $1.92 | $72.96 | Normal |
   | 11/6 | #287 | Shell | 40 | $1.98 | $79.20 | Market increase |
   | 11/8 | #301 | Speedway | 45 | $2.05 | $92.25 | Market increase |
   | 11/9 | #305 | Loves | 48 | $2.08 | $99.84 | Market increase |
   | 11/10 | #312 | Shell | 35 | $2.10 | $73.50 | Market increase |
   | **Total** | | | **333 gals** | **$1.99 avg** | **$659.00** | |

7. System calculates analysis:
   - Average price Nov 1-10: $1.99/gallon
   - October average (budgeted): $1.75/gallon
   - Price increase impact: +$8/gallon × 333 gallons = +$240 of the $500 variance
   - Remaining variance: +$260 (likely volume increase)
8. Accountant explains variance:
   - Primary cause: Fuel price increase (Nov market prices higher than Oct)
   - Secondary cause: Additional volume (more miles driven - seasonal increase)
9. Accountant adds note: "Fuel variance explained by market prices (+$240) and seasonal volume increase (+$260); expect to normalize in December"
10. System records drill-down analysis
11. Accountant completes variance investigation

#### Expected Results
- Drill-down from category to subcategory available
- Further drill-down to transaction-level detail available
- Transaction details show date, vehicle, location, quantity, price, amount
- Variance drivers identified (price vs volume)
- Accountant can add detailed explanation
- Complete audit trail of investigation

#### Acceptance Criteria
- [ ] Category drill-down to subcategories available
- [ ] Subcategory drill-down to transactions available
- [ ] Transaction-level detail includes all relevant data
- [ ] Price and volume impacts calculated
- [ ] Variance drivers identified
- [ ] Accountant can add explanation notes
- [ ] Investigation recorded in audit trail

#### Test Data
```
Category: Fuel
MTD Variance: +$700
Subcategory: Diesel
Subcategory Variance: +$500 (+14.3%)
Transactions (Nov 1-10): 8 diesel fill-ups
Total Diesel Purchased: 333 gallons
Average Price: $1.99/gallon (vs $1.75 budgeted)
Price Impact: +$240 (+$0.24/gallon × 333 gal)
Volume Impact: +$260 (additional gallons)
Variance Drivers: Market price increase + seasonal volume
```

---

## Depreciation Tests

### TC-AC-021: Calculate Monthly Depreciation - Straight-Line Method

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-AC-021 |
| **Test Case Name** | Calculate Monthly Depreciation - Straight-Line Method |
| **Related User Story** | US-AC-005: Depreciation Schedule Management |
| **Related Use Case** | UC-AC-005: Manage Depreciation Schedules |
| **Priority** | High |
| **Test Type** | Functional |
| **Automated** | Yes |

#### Preconditions
- Vehicle master data is complete with acquisition information
- Depreciation schedules configured with methods (straight-line, declining balance)
- Depreciation calculation process runs monthly on last day of month
- GL chart of accounts configured with depreciation accounts

#### Test Steps
1. System identifies Vehicle #201 for depreciation calculation:
   - Acquisition Cost: $45,000
   - Acquisition Date: January 15, 2023
   - Useful Life: 5 years (60 months)
   - Salvage Value: $5,000
   - Depreciation Method: Straight-Line
2. System calculates straight-line depreciation:
   - Depreciable Amount: $45,000 - $5,000 = $40,000
   - Monthly Depreciation: $40,000 ÷ 60 months = $666.67
3. Verify accumulated depreciation through November 2025:
   - Months: Jan 2023 through Nov 2025 = 34 months
   - Accumulated Depreciation: $666.67 × 34 = $22,666.78
4. Calculate current book value:
   - Original Cost: $45,000
   - Accumulated Depreciation: $22,666.78
   - Current Book Value: $45,000 - $22,666.78 = $22,333.22
5. System generates November 2025 depreciation journal entry:
   - Debit: Account 61-6201 (Depreciation Expense) $666.67
   - Credit: Account 10-2401 (Accumulated Depreciation) $666.67
6. Verify November depreciation recorded
7. System displays vehicle depreciation schedule:
   - Shows original cost, useful life, salvage value
   - Shows accumulated depreciation through Nov 2025
   - Shows current book value
   - Shows remaining depreciable life: 26 months (to Jan 2028)
8. System generates depreciation report for all vehicles
9. Report shows:
   - Vehicle ID, Cost, Method, Monthly Expense, Accumulated Depreciation, Book Value
10. System generates GL entries for all vehicles' monthly depreciation
11. System posts entries to GL

#### Expected Results
- Monthly depreciation calculated correctly using straight-line method
- Journal entries generated for GL posting
- Book values calculated and displayed
- Depreciation report generated with all vehicles
- GL entries posted accurately
- Accumulated depreciation tracked correctly

#### Acceptance Criteria
- [ ] Straight-line depreciation calculated correctly
- [ ] Monthly depreciation amount: $666.67
- [ ] Journal entries created (Debit Exp, Credit Accum Depr)
- [ ] Book value calculated: $22,333.22
- [ ] Depreciation report includes all vehicles
- [ ] GL entries posted to correct accounts
- [ ] Accumulated depreciation balance accurate

#### Test Data
```
Vehicle: #201
Acquisition Cost: $45,000
Acquisition Date: January 15, 2023
Useful Life: 5 years (60 months)
Salvage Value: $5,000
Depreciation Method: Straight-Line
Depreciable Amount: $40,000
Monthly Depreciation: $666.67
Months Elapsed: 34 (Jan 2023 - Nov 2025)
Accumulated Depreciation: $22,666.78
Current Book Value: $22,333.22
Remaining Life: 26 months
GL Accounts: 61-6201 (Expense), 10-2401 (Accum Depr)
```

---

### TC-AC-022: Depreciation Adjustment - Major Overhaul Extends Useful Life

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-AC-022 |
| **Test Case Name** | Depreciation Adjustment - Major Overhaul Extends Useful Life |
| **Related User Story** | US-AC-005: Depreciation Schedule Management |
| **Related Use Case** | UC-AC-005: Manage Depreciation Schedules |
| **Priority** | Medium |
| **Test Type** | Functional |
| **Automated** | No |

#### Preconditions
- Vehicle #205 is in depreciation schedule
- Major engine overhaul was completed in October 2025
- Overhaul cost: $8,500
- Project extended useful life by 2 years (24 months)
- Accountant has authorization to adjust depreciation

#### Test Steps
1. Accountant reviews Vehicle #205 depreciation schedule:
   - Original Acquisition: Jan 2021
   - Original Useful Life: 5 years
   - Remaining Life (pre-overhaul): 1 year
   - Current Book Value: $5,000
2. Accountant notes major engine overhaul completed in October 2025:
   - Overhaul Cost: $8,500
   - Work Order: WO-2025-1925
   - Expected Life Extension: 2 years (24 months)
3. Accountant initiates depreciation adjustment
4. System identifies impact:
   - Engine overhaul should be capitalized (not expensed)
   - Cost adds to asset basis
   - New useful life estimated
5. Accountant enters adjustment:
   - Capitalized Overhaul Cost: $8,500
   - New Useful Life Estimate: 7 years total (was 5, now 7 due to overhaul)
   - Revised Remaining Life: 3 years (36 months, from current date)
6. System recalculates depreciation:
   - New Asset Value: $5,000 (current book) + $8,500 (overhaul) = $13,500
   - New Salvage Value: $3,000 (estimated)
   - New Depreciable Amount: $13,500 - $3,000 = $10,500
   - New Monthly Depreciation: $10,500 ÷ 36 months = $291.67 (vs $666.67 previously)
7. System updates depreciation schedule
8. System generates journal entry for overhaul capitalization:
   - Debit: Account 10-1201 (Vehicles) $8,500
   - Credit: Account 20-2050 (Accounts Payable) $8,500
9. System updates monthly depreciation going forward:
   - Previous: $666.67/month
   - New: $291.67/month
   - Change: -$375.00/month (reflecting lower depreciation with extended life)
10. System displays updated depreciation schedule with note:
    - "Depreciation adjusted 2025-10-31: Engine overhaul $8,500 capitalized; useful life extended to 7 years total"
11. System shows depreciation impact:
    - Year 2025 savings: $375 × 3 months (Nov-Dec+Oct adj) = adjustment
    - Future monthly savings: $375/month for 36 months

#### Expected Results
- Overhaul cost capitalized to asset
- Depreciation schedule adjusted for extended life
- Monthly depreciation recalculated and reduced
- Journal entries created for GL posting
- Adjustment documented with work order reference
- Schedule updated with explanation

#### Acceptance Criteria
- [ ] Overhaul cost capitalized (not expensed)
- [ ] New useful life set to 7 years
- [ ] New monthly depreciation calculated: $291.67
- [ ] Depreciation schedule updated
- [ ] Journal entries created correctly
- [ ] Adjustment documented with WO reference
- [ ] System shows life extension impact

#### Test Data
```
Vehicle: #205
Original Acquisition: January 2021
Original Cost: $50,000
Original Useful Life: 5 years
Pre-Overhaul Book Value: $5,000
Engine Overhaul Date: October 2025
Overhaul Cost: $8,500
Work Order: WO-2025-1925
New Useful Life: 7 years total
New Asset Value: $13,500 ($5,000 + $8,500)
New Depreciable Amount: $10,500
New Monthly Depreciation: $291.67
Previous Monthly Depreciation: $666.67
Monthly Savings: $375.00
New Remaining Life: 36 months
```

---

## IFTA Reporting Tests

### TC-AC-023: Generate Quarterly IFTA Report

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-AC-023 |
| **Test Case Name** | Generate Quarterly IFTA Report |
| **Related User Story** | US-AC-009: IFTA Reporting |
| **Related Use Case** | UC-AC-009: Generate IFTA Reports |
| **Priority** | High |
| **Test Type** | Functional |
| **Automated** | Yes |

#### Preconditions
- GPS/telematics mileage data by jurisdiction is available
- Fuel purchase records with location data are complete
- IFTA tax rate tables are current
- Vehicle IFTA registration status is configured
- Q4 2025 (Oct-Dec) data is complete
- IFTA reporting system is operational

#### Test Steps
1. Accountant initiates IFTA report generation for Q4 2025 (Oct 1 - Dec 31)
2. System imports mileage data by jurisdiction from GPS/telematics:
   - Florida: 15,000 miles
   - Georgia: 8,500 miles
   - South Carolina: 6,200 miles
   - North Carolina: 4,800 miles
   - Virginia: 3,500 miles
   - Total: 38,000 miles
3. System imports fuel purchase records with location data:
   - Purchases in FL: 8,200 gallons @ $3.79 avg = $31,078
   - Purchases in GA: 4,100 gallons @ $3.82 avg = $15,662
   - Purchases in SC: 3,200 gallons @ $3.75 avg = $12,000
   - Purchases in NC: 2,400 gallons @ $3.81 avg = $9,144
   - Purchases in VA: 1,800 gallons @ $3.80 avg = $6,840
   - Total Fuel Purchased: 19,700 gallons
4. System applies IFTA tax rate tables (current for Q4 2025):
   - Florida: $0.1475 / gallon
   - Georgia: $0.0938 / gallon
   - South Carolina: $0.1675 / gallon
   - North Carolina: $0.1055 / gallon
   - Virginia: $0.1725 / gallon
5. System calculates fuel tax owed by jurisdiction:
   - FL: 15,000 miles ÷ 6.5 MPG = 2,308 gal expected - 8,200 gal purchased = (5,892) excess fuel (credit)
     Tax: (5,892 gal × $0.1475) = ($869) credit
   - GA: 8,500 miles ÷ 6.5 MPG = 1,308 gal expected - 4,100 gal purchased = (2,792) excess fuel (credit)
     Tax: (2,792 gal × $0.0938) = ($262) credit
   - SC: 6,200 miles ÷ 6.5 MPG = 954 gal expected - 3,200 gal purchased = (2,246) excess fuel (credit)
     Tax: (2,246 gal × $0.1675) = ($376) credit
   - NC: 4,800 miles ÷ 6.5 MPG = 738 gal expected - 2,400 gal purchased = (1,662) excess fuel (credit)
     Tax: (1,662 gal × $0.1055) = ($175) credit
   - VA: 3,500 miles ÷ 6.5 MPG = 538 gal expected - 1,800 gal purchased = (1,262) excess fuel (credit)
     Tax: (1,262 gal × $0.1725) = ($218) credit

6. System totals IFTA tax summary:
   - Total Tax Credits: $1,900
   - Net Tax Owed: -$1,900 (credit to company)
7. System generates IFTA-compliant quarterly report with:
   - IFTA Quarterly Report form (standard format)
   - Detailed mileage by jurisdiction
   - Detailed fuel purchases by jurisdiction
   - Tax calculations by jurisdiction
   - Summary of tax owed/credits
   - Supporting documentation
8. System validates data completeness:
   - All vehicles reporting ✓
   - All jurisdictions covered ✓
   - Data accuracy verified ✓
9. System provides data quality dashboard:
   - GPS mileage: 38,000 miles
   - Fuel purchases: 19,700 gallons
   - MPG implied: 1.93 (38,000 ÷ 19,700)
   - Expected MPG: 6.5
   - Flag: "⚠ Implied MPG is 3.4x lower than expected - data quality issue"
10. Accountant investigates discrepancy
11. Accountant finds data entry error: Fuel purchased in FL should be 2,200 gallons (not 8,200)
12. Accountant corrects fuel purchase record
13. System recalculates IFTA report with corrected data
14. New calculation shows net tax owed: +$1,200 (company owes)
15. Accountant reviews and approves IFTA report
16. System generates export for filing with tax authorities

#### Expected Results
- IFTA report generated with mileage by jurisdiction
- Fuel purchases allocated by jurisdiction
- Tax calculations completed for each jurisdiction
- Summary showing tax owed or credits
- Data quality validation performed
- Report exported in IFTA-compliant format
- Filing-ready documentation generated

#### Acceptance Criteria
- [ ] All jurisdictions included in report
- [ ] Mileage allocation verified (38,000 total)
- [ ] Fuel allocation verified (19,700 gallons)
- [ ] Tax rates applied correctly
- [ ] Tax calculations accurate
- [ ] Data quality validation passed
- [ ] Report exported to filing format
- [ ] Supporting documentation included

#### Test Data
```
Report Period: Q4 2025 (Oct 1 - Dec 31)
Total Miles: 38,000
Total Fuel: 19,700 gallons
Average MPG: 1.93 (initial, corrected to 17.3)

By Jurisdiction:
Florida: 15,000 miles, 8,200 gal (corrected to 2,200), tax $0.1475
Georgia: 8,500 miles, 4,100 gal, tax $0.0938
South Carolina: 6,200 miles, 3,200 gal, tax $0.1675
North Carolina: 4,800 miles, 2,400 gal, tax $0.1055
Virginia: 3,500 miles, 1,800 gal, tax $0.1725

Net Tax Owed: +$1,200 (after correction)
```

---

### TC-AC-024: IFTA Filing Deadline Reminders

| Field | Value |
|-------|-------|
| **Test Case ID** | TC-AC-024 |
| **Test Case Name** | IFTA Filing Deadline Reminders |
| **Related User Story** | US-AC-009: IFTA Reporting |
| **Related Use Case** | UC-AC-009: Generate IFTA Reports |
| **Priority** | Medium |
| **Test Type** | Functional |
| **Automated** | Yes |

#### Preconditions
- IFTA filing deadlines configured in system
- Q4 2025 IFTA report has been generated and is ready for filing
- Notification system is operational
- Accountant's email is configured for notifications
- Q4 2025 deadline: February 28, 2026

#### Test Steps
1. System identifies Q4 2025 IFTA filing deadline: February 28, 2026
2. Accountant is responsible for IFTA filing
3. System automatically tracks deadline as date approaches
4. At 60 days before deadline (January 1, 2026):
   - System sends notification: "IFTA Q4 2025 filing due February 28, 2026 (60 days)"
   - Email to Accountant: "Reminder: Q4 2025 IFTA Report filing due in 60 days"
   - Action item: Begin data validation and final review
5. At 30 days before deadline (January 29, 2026):
   - System sends notification: "IFTA Q4 2025 filing due February 28, 2026 (30 days)"
   - Email to Accountant: "Reminder: Q4 2025 IFTA Report filing due in 30 days"
   - Action item: Finalize report and begin filing submission process
6. At 15 days before deadline (February 13, 2026):
   - System sends notification: "IFTA Q4 2025 filing due February 28, 2026 (15 days)"
   - Email to Accountant: "Reminder: Q4 2025 IFTA Report filing due in 15 days"
   - Action item: Submit filing to state tax authorities
7. At 5 days before deadline (February 23, 2026):
   - System sends URGENT notification: "IFTA Q4 2025 filing DUE IN 5 DAYS - February 28, 2026"
   - Email to Accountant: "URGENT: Q4 2025 IFTA Report filing due in 5 days"
   - Action item: Complete submission and confirmation
8. Accountant submits IFTA filing to state tax authorities on February 26, 2026
9. Accountant records filing date and confirmation in system
10. System archives Q4 2025 IFTA report and confirmation for audit purposes
11. System records filing as complete
12. System creates reminder for next filing (Q1 2026 due May 31, 2026)

#### Expected Results
- Deadline reminders sent at 60/30/15/5 days before deadline
- Reminders include filing deadline information
- Accountant is notified via email
- Reminders escalate in urgency as deadline approaches
- Filing can be recorded in system
- Filing documented and archived for audit
- Next quarter deadline tracked

#### Acceptance Criteria
- [ ] 60-day reminder sent on January 1, 2026
- [ ] 30-day reminder sent on January 29, 2026
- [ ] 15-day reminder sent on February 13, 2026
- [ ] 5-day reminder sent on February 23, 2026
- [ ] Reminders include deadline and deadline date
- [ ] Email notifications delivered successfully
- [ ] Filing can be recorded in system
- [ ] Audit trail documents filing date and confirmation

#### Test Data
```
IFTA Report Period: Q4 2025
Filing Deadline: February 28, 2026
Reminder Dates:
  - 60 days: January 1, 2026
  - 30 days: January 29, 2026
  - 15 days: February 13, 2026
  - 5 days: February 23, 2026
Accountant: John Smith
Filing Date: February 26, 2026
Filing Status: Complete
Next Deadline: May 31, 2026 (Q1 2026)
```

---

## Test Summary

**Total Test Cases**: 24
**Priority Breakdown**:
- High Priority: 17 test cases (71%)
- Medium Priority: 7 test cases (29%)

**Test Coverage by Feature**:
1. Invoice Processing: 5 test cases (TC-AC-001 to TC-AC-005)
2. Approval Workflows: 5 test cases (TC-AC-006 to TC-AC-010)
3. Fuel Reconciliation: 4 test cases (TC-AC-011 to TC-AC-014)
4. Cost Center Reporting: 3 test cases (TC-AC-015 to TC-AC-017)
5. Budget Management: 3 test cases (TC-AC-018 to TC-AC-020)
6. Depreciation: 2 test cases (TC-AC-021 to TC-AC-022)
7. IFTA Reporting: 2 test cases (TC-AC-023 to TC-AC-024)

**Test Types**:
- Functional: 21 test cases
- Non-functional: 3 test cases

**Automation**:
- Automated: 16 test cases
- Manual: 8 test cases

---

## Related Documents
- User Stories: `user-stories/06_ACCOUNTANT_USER_STORIES.md`
- Use Cases: `use-cases/06_ACCOUNTANT_USE_CASES.md`
- Data Model: `data-model/FINANCIAL_SCHEMA.md`
- Workflows: `workflows/06_ACCOUNTANT_WORKFLOWS.md`

---

*Test Plan Complete - Ready for Execution and Quality Assurance*
