# Accountant / Finance Manager - Use Cases

**Role**: Accountant / Finance Manager
**Access Level**: Financial (Read-only operations, full financial data)
**Primary Interface**: Web Dashboard (100% desktop)
**Version**: 1.0
**Date**: November 11, 2025

---

## Table of Contents
1. [Invoice Processing and Approval](#epic-1-invoice-processing-and-approval)
2. [Fuel Cost Analysis](#epic-2-fuel-cost-analysis)
3. [Depreciation and Asset Tracking](#epic-3-depreciation-and-asset-tracking)
4. [Budget Management and Variance Analysis](#epic-4-budget-management-and-variance-analysis)
5. [Tax Reporting and Compliance](#epic-5-tax-reporting-and-compliance)
6. [Vendor Payment Management](#epic-6-vendor-payment-management)

---

## Epic 1: Invoice Processing and Approval

### UC-AC-001: Process Vendor Invoices

**Use Case ID**: UC-AC-001
**Use Case Name**: Process Vendor Invoices
**Actor**: Accountant (primary), Vendor (secondary)
**Priority**: High

#### Preconditions:
- Accountant is logged into the accounting system
- Invoice receipt mechanism is operational (email, manual upload, EDI)
- Work order management system is accessible
- Purchase order database is current and searchable
- GL chart of accounts is configured

#### Trigger:
- Invoice received from vendor via email, file upload, or EDI
- Accountant manually initiates invoice entry
- Batch invoice import process runs

#### Main Success Scenario:
1. Accountant receives email from Maintenance vendor "ABC Truck Parts" with invoice attachment
2. System detects invoice and extracts key data using OCR:
   - Vendor: ABC Truck Parts
   - Invoice Number: INV-45892
   - Date: 2025-11-08
   - Amount: $3,247.50
   - Items: Replacement tires (4), brake pads, oil change service
3. System attempts to match invoice to existing purchase orders
4. System finds matching PO #2025-0847 for $3,250.00 (Invoice is $2.50 under, variance within tolerance)
5. System displays 3-way match results:
   - PO Amount: $3,250.00
   - Receipt Amount: $3,247.50 (tires received in warehouse on 2025-11-07)
   - Invoice Amount: $3,247.50
   - Status: ✓ MATCH - All three documents align
6. Accountant reviews invoice details on screen:
   - Confirms vendor is on approved vendor list ✓
   - Confirms pricing matches PO ✓
   - Notes: "4 tires + service - matched to Vehicle #287 maintenance"
7. Accountant categorizes expenses by GL account:
   - $2,400.00 → Account 61-3201 (Tire & Wheel Maintenance)
   - $847.50 → Account 61-3210 (Routine Maintenance Labor)
8. Accountant assigns cost center: "Vehicle Fleet Operations"
9. Accountant adds note: "Part of quarterly tire rotation schedule"
10. System validates all required fields are complete ✓
11. Accountant clicks "Submit for Approval"
12. System routes invoice to first-level approver: Operations Manager Lisa Park
13. Lisa reviews and approves within 2 hours
14. System automatically routes to second-level approver for invoices >$2,500: Fleet Director
15. Fleet Director reviews and approves
16. Invoice status changes to "Approved" and becomes eligible for payment
17. System generates payment file for check run scheduled for 2025-11-15

#### Alternative Flows:

**A1: Invoice Received via Email with Multiple Attachments**
- 1a. If email contains multiple invoices:
  - System extracts all invoice PDFs and processes separately
  - System creates individual invoice records for each
  - Accountant reviews OCR results for accuracy
  - Accountant can approve or reject each invoice independently

**A2: Invoice Amount Exceeds PO Amount**
- 5a. If invoice is $350 over PO:
  - System displays warning: "⚠ Invoice exceeds PO by $350.00"
  - System shows breakdown:
    - PO Amount: $3,250.00
    - Invoice Amount: $3,600.00
    - Variance: +$350.00 (10.8% over)
  - Accountant investigates discrepancy by contacting vendor
  - Vendor explains: "Additional expedited freight charge added after original PO"
  - Accountant reviews and approves additional charge with note
  - System adjusts cost allocation to include freight
  - Invoice processed with variance documented

**A3: EDI (Electronic Data Interchange) Invoice Receipt**
- 1a. If invoice received via EDI integration:
  - System automatically parses EDI X12 835 or 810 format
  - System populates all fields from structured EDI data (100% accuracy)
  - No OCR needed - data extracted directly from EDI
  - 3-way match performed automatically
  - Accountant reviews clean match in 30 seconds
  - No manual data entry required

**A4: Split Invoice Across Multiple Cost Centers**
- 8a. If invoice contains charges for multiple departments:
  - Invoice contains: Parts for Vehicle #287 (Fleet Ops) and repairs for Equipment (Maintenance)
  - Accountant splits invoice into two lines:
    - Line 1: $2,200 → Account 61-3201, Cost Center "Fleet Operations"
    - Line 2: $1,047.50 → Account 61-4150, Cost Center "Equipment Maintenance"
  - System validates both allocations and total matches invoice
  - Each line approved separately based on amount and cost center approval hierarchy

#### Exception Flows:

**E1: PO Does Not Exist**
- If invoice cannot be matched to PO:
  - System displays: "⚠ No matching PO found for Invoice INV-45892"
  - Accountant must manually enter receipt information:
    - Item descriptions, quantities, unit prices
    - Receiving date and condition
  - Accountant verifies items received and in good condition
  - Accountant obtains supervisory approval for non-PO invoice
  - System flags for PO process improvement review

**E2: Vendor Not on Approved List**
- If invoice from unauthorized vendor:
  - System displays: "❌ Vendor 'XYZ Supplies' not on approved vendor list"
  - Accountant contacts procurement
  - Procurement confirms this is authorized single-source vendor
  - Procurement adds vendor to approved list or provides authorization code
  - Accountant enters authorization and invoice processes normally

**E3: OCR Data Extraction Error**
- If OCR misreads invoice data:
  - Amount shows as "$32,475.00" (should be "$3,247.50")
  - System displays extracted data for manual verification
  - Accountant manually corrects extracted fields
  - System updates OCR model with correction for future improvement
  - Invoice processes with corrected amounts

**E4: Invoice Image Quality Too Poor**
- If PDF is low quality and OCR cannot read:
  - System displays warning: "❌ Cannot extract data from invoice image quality"
  - Accountant can:
    - Request better quality copy from vendor
    - Manually enter all invoice data
  - System flags document for IT to investigate vendor invoice delivery process

#### Postconditions:
- Invoice is validated and matched to supporting documents
- All required data is captured and categorized
- Invoice is routed through appropriate approval workflow
- Invoice is eligible for payment when approved
- Complete audit trail is recorded (who, what, when, why)

#### Business Rules:
- BR-AC-001: All vendor invoices must be matched to PO, receipt, or work order before approval
- BR-AC-002: Approved vendors only - invoices from non-approved vendors require procurement authorization
- BR-AC-003: Price variance >5% requires accountant investigation and documentation
- BR-AC-004: All GL account coding must match COA (Chart of Accounts) approved list
- BR-AC-005: Invoice images must be retained for 7 years minimum
- BR-AC-006: OCR extracted data must be visually verified by accountant for accuracy
- BR-AC-007: Cost center assignments must match vehicle or department ownership

#### Related User Stories:
- US-AC-001: Vendor Invoice Processing
- US-AC-002: Approval Workflow Management

---

### UC-AC-002: Approve Multi-Level Invoice Workflows

**Use Case ID**: UC-AC-002
**Use Case Name**: Approve Multi-Level Invoice Workflows
**Actor**: Accountant (primary), Approvers (secondary), Fleet Manager (secondary)
**Priority**: High

#### Preconditions:
- Invoice has been processed and coded by accountant
- Approval workflow is configured based on amount and category thresholds
- Approvers have access to approval system
- Email notification system is operational

#### Trigger:
- Accountant submits invoice for approval
- Invoice automatically routed to assigned approver
- Approval escalation deadline passes

#### Main Success Scenario:
1. Accountant submits invoice INV-45892 for $3,247.50 for approval
2. System calculates approval level required:
   - Amount: $3,247.50
   - Category: Maintenance
   - Rule: <$5,000 requires Manager approval
   - Rule: >$2,500 also requires Director approval
3. System routes invoice to Operations Manager Lisa Park (first approver)
4. System sends email notification to Lisa:
   - Subject: "Invoice Approval Required: ABC Truck Parts - $3,247.50"
   - Details: Vendor, amount, GL coding, cost center, attached invoice image
   - Action button: "Review and Approve" (links to approval page)
5. Lisa receives email on 2025-11-09 at 10:15 AM
6. Lisa clicks approval link and opens invoice approval page
7. Lisa reviews invoice details:
   - Vendor: ABC Truck Parts (approved vendor ✓)
   - Amount: $3,247.50 (reasonable price ✓)
   - GL Coding: Accounts 61-3201 and 61-3210 (correct ✓)
   - Cost Center: Fleet Operations (appropriate ✓)
   - Receipt: Matched to receiving report ✓
8. Lisa has options:
   - Approve
   - Request Additional Information
   - Reject
9. Lisa clicks "Approve" button
10. System records approval:
    - Approver: Lisa Park
    - Time: 2025-11-09 10:32 AM
    - Decision: Approved
    - Comments: "Approved - maintenance work completed as scheduled"
11. System automatically routes to next level: Fleet Director John Martinez
12. System sends notification to John: "Invoice Approval Required (Secondary): ABC Truck Parts"
13. John reviews within 4 hours (2025-11-09 2:30 PM)
14. John approves invoice
15. System records second-level approval
16. Invoice status changes to "Fully Approved"
17. System adds invoice to next scheduled payment run
18. System sends confirmation email to accountant: "Invoice INV-45892 approved and scheduled for payment"

#### Alternative Flows:

**A1: Approver Requests Additional Information**
- 9a. If approver has questions about invoice:
  - Lisa clicks "Request Information"
  - Lisa types question: "Can you confirm these are the tires for Vehicle #287?"
  - System sends inquiry notification to accountant
  - Accountant reviews work order and confirms correct vehicle
  - Accountant responds: "Yes, confirmed - Work Order WO-2025-1847"
  - Invoice marked as "Awaiting Approval - Info Provided"
  - Lisa re-approves with additional confidence
  - Invoice proceeds through workflow

**A2: Approver Rejects Invoice**
- 9a. If approver rejects invoice:
  - Lisa clicks "Reject"
  - Lisa provides reason: "Need to verify this vendor didn't double-bill for shipping"
  - System returns invoice to accountant with rejection reason
  - Invoice status changes to "Rejected"
  - Accountant contacts vendor: "Your invoice shows $300 shipping - was this charged separately?"
  - Vendor confirms shipping was included in unit prices
  - Accountant corrects invoice or obtains vendor credit memo
  - Accountant resubmits for approval
  - Lisa approves corrected invoice

**A3: Emergency Approval Override**
- 1a. If invoice is urgent and normal workflow too slow:
  - Critical maintenance part for broken-down vehicle
  - Accountant checks "Urgent Approval Request"
  - System sends expedited notification to Director with URGENT flag
  - Director approves within 30 minutes (vs normal 4 hours)
  - Accountant processes payment immediately
  - System audits override with timestamp and justification

**A4: Escalation Due to No Response**
- 12a. If approver doesn't respond within SLA:
  - Lisa Park assigned approval on 2025-11-09 10:15 AM
  - SLA: Approval within 24 business hours
  - No approval received by 2025-11-10 4:00 PM (26 hours)
  - System triggers escalation:
    - Sends escalation notification to Lisa's manager
    - Copies Director to expedite approval
    - Marks invoice as "Escalated - Pending"
  - Director reviews and approves to unblock workflow
  - System notifies Lisa of escalation for process improvement

#### Exception Flows:

**E1: Approver Leaves Organization**
- If assigned approver is no longer available:
  - Lisa Park marked as "Inactive" in system (resigned)
  - System displays: "⚠ Assigned approver Lisa Park is inactive"
  - System automatically routes to backup approver: Lisa's manager Robert Chen
  - Robert reviews and approves
  - Accounting team updates approval hierarchy

**E2: Circular Approval Requirement (Conflict)**
- If approver is the vendor or has conflict of interest:
  - Accountant is primary contact for ABC Truck Parts
  - Invoice approval would normally route to Accountant
  - System detects conflict: "⚠ Cannot assign approval to vendor contact"
  - System routes to next level in hierarchy instead
  - Conflict documented in audit trail

**E3: Approval System Unavailable**
- If approval workflow system is down:
  - System displays: "Approval system temporarily unavailable"
  - Accountant can manually track approvals via spreadsheet
  - When system restored, accountant uploads manual approvals
  - System reconciles and processes invoices
  - Backup email approval process used until system restored

**E4: Approver Disagrees with GL Coding**
- If approver thinks coding is wrong:
  - Director John: "This should be Account 61-4150, not 61-3210"
  - System allows Director to:
    - Approve with suggested GL change
    - Return to accountant for recoding
  - Director comments: "Please recode brake labor to 61-4150"
  - Accountant reviews and agrees
  - Accountant recodes invoice and resubmits
  - Director re-approves corrected coding

#### Postconditions:
- Invoice has received all required approvals
- All approval decisions are recorded with timestamp and approver identity
- Invoice is eligible for payment processing
- Approval audit trail is complete for compliance

#### Business Rules:
- BR-AC-008: Invoices <$1,000 require single manager approval
- BR-AC-009: Invoices $1,000-$5,000 require manager approval
- BR-AC-010: Invoices >$5,000 require both manager and director approval
- BR-AC-011: Invoices >$10,000 require VP Finance approval
- BR-AC-012: Approval decisions must be made within 24 business hours (SLA)
- BR-AC-013: Escalation triggered if approval exceeds SLA
- BR-AC-014: All approval decisions must be documented with reason
- BR-AC-015: Vendors cannot approve their own invoices

#### Related User Stories:
- US-AC-002: Approval Workflow Management

---

## Epic 2: Fuel Cost Analysis

### UC-AC-003: Reconcile Fuel Card Transactions

**Use Case ID**: UC-AC-003
**Use Case Name**: Reconcile Fuel Card Transactions
**Actor**: Accountant (primary), Driver (secondary)
**Priority**: High

#### Preconditions:
- Fuel card provider data feeds are configured (WEX, Voyager, Comdata)
- Driver fueling transactions are recorded in fleet system
- Vehicle assignment data is current
- Fuel price history is available
- Reconciliation dates are established (typically monthly)

#### Trigger:
- Monthly fuel card reconciliation process begins (last business day of month)
- Accountant manually initiates fuel reconciliation
- Automated daily reconciliation alerts detect discrepancies

#### Main Success Scenario:
1. Accountant opens Fuel Reconciliation dashboard on 2025-10-31
2. System displays monthly fuel reconciliation summary:
   - Reporting Period: October 1-31, 2025
   - Fuel Card Provider: WEX
   - Transaction Status: 847 transactions received, 812 matched (95.9%)
3. System auto-imports fuel card transactions:
   - Transactions from WEX file: 847 total
   - Data includes: date, time, location, amount, vehicle ID (pump assignment)
4. System matches card transactions to driver-reported fuel entries:
   - Match criteria: Vehicle number, date ±2 hours, amount ±$5.00
   - 812 transactions matched (95.9%)
   - 35 transactions unmatched (4.1% pending review)
5. Accountant clicks "Review Unmatched Transactions"
6. System displays unmatched transactions in detail:
   - Trans 1: Card charge $67.80 (Vehicle #287) on 10/15 at 1:47 PM
     → No driver entry found
     → Unmatched reason: Driver may have forgotten to log
   - Trans 2: Driver entry for Vehicle #312 (75 gallons) on 10/22
     → Card charge: $67.50
     → Mismatch: 75 gallons doesn't match $67.50 (would be $1.80/gal - unrealistic)
     → Likely data entry error: Driver entered wrong amount
7. Accountant investigates high-priority discrepancies:
   - Review driver behavior for Vehicle #287 (missing entry)
   - Calculate expected consumption based on route and MPG
   - Driver typically fills every 250 miles
   - October 15 route was 240 miles - fuel stop makes sense
   - Accountant contacts driver: "Did you fuel Vehicle #287 on Oct 15?"
   - Driver confirms: "Yes, at TA truck stop near Cincinnati at 1:45 PM - sorry I forgot to log"
   - Accountant manually adds missing driver entry for $67.80
8. Accountant investigates Vehicle #312 discrepancy:
   - Reviews driver entry: 75 gallons @ $0.90/gal = $67.50 (entry made 10/22)
   - Card charge: $67.50 on 10/22 (matches)
   - Issue identified: Driver entered 75 gallons but only purchased ~37.5 gallons ($67.50 ÷ $1.80/gal avg)
   - Accountant contacts driver: "Your fuel log shows 75 gallons but card charge is $67.50"
   - Driver corrects: "Oops, meant to enter 37.5 gallons - fuel was half tank"
   - Accountant updates driver entry to correct amount
9. System re-matches all transactions with corrections:
   - Now 835 of 847 matched (98.6%)
   - 12 transactions still unmatched:
     - 8 personal fueling charges (drivers' personal vehicles - excluded from fleet)
     - 2 fuel stops for rental vehicles (not in our fleet)
     - 2 credit adjustments (not fuel - ignore for reconciliation)
10. Accountant marks remaining 12 as "Non-Fleet - Exclude"
11. System recalculates final reconciliation:
    - Fleet fuel transactions reconciled: 835 / 835 (100%)
    - Total fuel cost reconciled: $31,247.50
    - Fuel cost variance: -$0.32 (0.001% - well within tolerance)
12. System calculates fuel metrics:
    - Total gallons purchased: 8,247 gallons
    - Total fleet miles: 156,400 miles
    - Average MPG: 18.96 mpg (tracking well vs 18.5 target)
    - Total fuel cost: $31,247.50
    - Cost per mile: $0.20 (tracking vs budget)
    - Cost per gallon: $3.79 avg (market prices ranged $3.65-$3.95)
13. System displays fraud/anomaly checks:
    - High-cost outliers: 2 transactions >$300 (legitimate bulk fuel stops)
    - Duplicate charges: None detected
    - Geographic anomalies: None detected
    - Price outliers: None detected
14. Accountant reviews fuel price trends:
    - Early October: $3.65-$3.72
    - Mid October: $3.75-$3.82
    - Late October: $3.80-$3.95
    - Trend: Gradual increase matching market movement
15. Accountant exports reconciliation report:
    - CSV file with all fuel transactions
    - Summary metrics and variance analysis
    - Fraud detection results
    - Approved for GL posting
16. System generates GL entries:
    - Debit: Account 61-5100 (Fuel Expense) $31,247.50
    - Credit: Account 20-1050 (Fuel Card Payable) $31,247.50
17. Accountant clicks "Approve Reconciliation"
18. System records completion:
    - Reconciliation status: Complete
    - Date completed: 2025-10-31 4:15 PM
    - Prepares for next month cycle

#### Alternative Flows:

**A1: Significant Price Spike Detected**
- 9a. If fuel price shows unusual spike:
  - One transaction: $7.50/gallon (vs average $3.79)
  - System displays warning: "⚠ Fuel price 98% above average"
  - Accountant investigates location: "Nowhere Station, AK" (remote Alaska)
  - Explanation confirmed: Alaska fuel prices extremely high (justified)
  - Accountant approves transaction as legitimate

**A2: Duplicate Charge Detected**
- 10a. If system detects same charge twice:
  - Two charges: $67.80 on 10/15 at 1:47 PM and 1:50 PM (same pump location)
  - System marks as potential duplicate: "⚠ Duplicate charge detected"
  - Accountant contacts WEX: "Two charges for same vehicle in 3 minutes?"
  - WEX investigation: Card reader malfunction created duplicate
  - WEX issues credit memo for $67.80
  - Credit applied to next month's statement

**A3: Card Fraud Suspected**
- 10a. If unusual charges detected:
  - Charge: Vehicle #412 at restaurant "Tony's Italian Place" for $87.95
  - Vehicle #412 is a truck - shouldn't be at restaurant
  - Charge type "Fuel" but merchant code indicates restaurant
  - System alerts accountant: "⚠ Fraudulent charge suspected"
  - Accountant verifies: Driver confirms didn't eat at restaurant
  - Accountant reports to WEX fraud department
  - Card disputed and credit issued
  - WEX reissues replacement card

#### Exception Flows:

**E1: Fuel Card Data Feed Delayed**
- If WEX data doesn't arrive on time:
  - 2025-10-31 reconciliation deadline approaches
  - WEX system update: "Delayed batch processing - data available 11/2"
  - Accountant extends reconciliation deadline to 2025-11-02
  - Pending transactions marked as "Provisional" until finalized
  - Month closes with provisional fuel accrual
  - Final reconciliation completed when WEX data received

**E2: High Percentage of Unmatched Transactions**
- If matching rate drops below 85%:
  - Only 75% of 847 transactions matched
  - System alerts: "⚠ Match rate 75% below 90% threshold"
  - Accountant investigates systematic issue:
    - Driver ELDs not syncing properly?
    - Fuel card provider data quality issue?
    - Driver training issue with fuel logging?
  - Root cause investigation reveals: ELD system outage on 10/15-10/16
  - Accountant manually reconciles transactions for outage period
  - IT corrects ELD issue
  - Process improves for next month

**E3: Reconciliation Variance Exceeds Tolerance**
- If variance is >1% of total fuel cost:
  - Variance calculated: +$512.30 (1.6% over expected)
  - System displays: "⚠ Variance $512.30 (1.6%) exceeds 1.0% tolerance"
  - Accountant investigates causes:
    - Check for undetected duplicate charges
    - Verify all unmatched transactions reviewed
    - Check if card was used for non-fuel (restaurants, etc.)
  - Root cause: Found $487 in carwash charges coded to fuel by mistake
  - Corrects coding to separate account
  - Recalculates variance: +$25.30 (0.08% - within tolerance)
  - Proceeds with reconciliation

#### Postconditions:
- All fuel transactions are matched and validated
- Fraud and anomalies are identified and resolved
- Fuel metrics and trends are calculated
- GL entries are generated for monthly accounting
- Reconciliation report is archived for compliance

#### Business Rules:
- BR-AC-016: Fuel reconciliation must be completed monthly within 5 business days of month-end
- BR-AC-017: Transaction matching rate must achieve 95%+ (auto-error if <90%)
- BR-AC-018: Price variance >10% requires investigation and documentation
- BR-AC-019: Non-fleet charges must be separated and processed separately
- BR-AC-020: Duplicate charges must be identified and disputed immediately
- BR-AC-021: All unmatched transactions must be individually reviewed and documented
- BR-AC-022: Fuel prices tracked to identify budget variances and market trends

#### Related User Stories:
- US-AC-003: Fuel Card Reconciliation

---

## Epic 3: Depreciation and Asset Tracking

### UC-AC-004: Manage Vehicle Depreciation Schedules

**Use Case ID**: UC-AC-004
**Use Case Name**: Manage Vehicle Depreciation Schedules
**Actor**: Accountant (primary), Fleet Manager (secondary)
**Priority**: High

#### Preconditions:
- Vehicle acquisition records are complete and accurate
- Useful life and depreciation method determined for each vehicle
- GL depreciation accounts are configured
- Monthly batch job scheduler is operational
- Fixed asset module is accessible

#### Trigger:
- New vehicle is acquired and added to fleet
- Monthly depreciation calculation process (28th of month)
- Year-end depreciation review and adjustments
- Vehicle is disposed (retirement from fleet)

#### Main Success Scenario:
1. Fleet Manager purchases new vehicle: 2025 Freightliner Cascadia
2. Fleet Manager provides acquisition details to accountant:
   - Make/Model: 2025 Freightliner Cascadia
   - VIN: 1HSCWJPR2KH339823
   - Date Placed in Service: 2025-10-15
   - Acquisition Cost: $185,000 (includes delivery and setup)
   - Useful Life: 7 years (standard for Class 8 trucks)
   - Estimated Salvage Value: $35,000
   - Depreciation Method: Straight-line (most common for fleet)
3. Accountant creates fixed asset record:
   - Asset ID: FA-2025-0847
   - GL Account: 12-1520 (Fleet Equipment - Trucks)
   - Depreciation Account: 61-6100 (Depreciation Expense)
   - Accumulated Depreciation: 12-1530
4. Accountant calculates depreciation schedule:
   - Depreciable base: $185,000 - $35,000 = $150,000
   - Useful life: 7 years = 84 months
   - Monthly depreciation: $150,000 ÷ 84 = $1,785.71
   - Start date: 2025-10-15 (partial month: 16 days)
   - First month depreciation: $1,785.71 × (16/31) = $922.81
5. System creates monthly depreciation schedule:
   - Oct 2025: $922.81 (partial month)
   - Nov 2025-Sep 2032: $1,785.71 (full months)
   - Oct 2032: $1,785.71 (final full month)
   - Total months: 84
6. Accountant reviews depreciation schedule detail:
   - Month: Oct 2025 | Depreciation: $922.81 | Accumulated: $922.81 | Book Value: $184,077.19
   - Month: Nov 2025 | Depreciation: $1,785.71 | Accumulated: $2,708.52 | Book Value: $182,291.48
   - ...continues monthly through Sep 2032...
   - Month: Oct 2032 | Depreciation: $1,785.71 | Accumulated: $150,000.00 | Book Value: $35,000.00
7. System displays depreciation dashboard showing all fleet vehicles:
   - Total Fleet Asset Value: $2,847,500
   - Total Accumulated Depreciation: $1,234,200 (43.4%)
   - Total Book Value: $1,613,300 (56.6%)
   - Monthly depreciation expense: $48,500
8. System runs monthly depreciation batch job on 2025-10-28:
   - Calculates October depreciation for all vehicles
   - New Freightliner: $922.81
   - Existing vehicles: $47,577.19
   - Total October depreciation: $48,500.00
9. System generates GL journal entries:
   - Debit: Account 61-6100 (Depreciation Expense) $48,500.00
   - Credit: Account 12-1530 (Accumulated Depreciation) $48,500.00
10. Accountant reviews depreciation report:
    - 47 vehicles on active depreciation schedule
    - 12 vehicles fully depreciated (book value = salvage value)
    - No depreciation adjustments needed
    - All calculations verified ✓
11. Accountant approves depreciation posting
12. GL entries automatically post to financial system
13. Balance sheet updated with new accumulated depreciation and book values

#### Alternative Flows:

**A1: Major Overhaul Extends Useful Life**
- 1a. If significant capital improvement is made:
  - Vehicle #245 (2018 truck) had major engine rebuild in October 2025
  - Original life: 7 years = through Oct 2025 (now fully depreciated)
  - Cost of major overhaul: $45,000 (major parts and labor)
  - Overhaul extends useful life: Additional 3 years
  - Accountant capitalizes overhaul cost:
    - Debit: Account 12-1520 (Fleet Equipment) $45,000
    - Credit: Account 20-1000 (Accounts Payable) $45,000
  - Accountant recalculates depreciation:
    - New depreciable base: $45,000 (overhaul cost only)
    - Useful life: 3 years (expected useful life of overhaul)
    - Monthly depreciation: $45,000 ÷ 36 = $1,250
    - New depreciation schedule created from Nov 2025
  - System adjusts monthly depreciation starting Nov 2025

**A2: Vehicle Disposal - Retirement from Fleet**
- 1a. When vehicle is sold or scrapped:
  - Vehicle #125 (2015 truck) sold to salvage company
  - Sale price: $18,500 (matches estimated salvage value)
  - Removal from fleet: 2025-11-08
  - Accountant records disposal:
    - Accumulated depreciation to date: $142,000
    - Book value at disposal: $43,000 ($185,000 cost - $142,000 accum deprec)
    - Sale proceeds: $18,500
    - Loss on disposal: $24,500 ($43,000 book value - $18,500 proceeds)
  - Accountant generates GL entries:
    - Debit: Account 20-1050 (Cash) $18,500
    - Debit: Account 61-6210 (Loss on Disposal) $24,500
    - Credit: Account 12-1520 (Fleet Equipment) $185,000
    - Credit: Account 12-1530 (Accumulated Depreciation) $142,000
  - System removes vehicle from depreciation schedule
  - Vehicle marked as "Retired" in fixed asset database

**A3: Change Depreciation Method Mid-Life**
- 2a. If accounting policy changes depreciation method:
  - All remaining fleet vehicles were straight-line
  - Company adopts 150% declining balance for tax purposes
  - Accountant reviews policy change with CFO (significant accounting decision)
  - Accountant updates vehicle depreciation method
  - System recalculates remaining depreciation using new method
  - Cumulative effect of change calculated for disclosure
  - Financial statements note accounting policy change

#### Exception Flows:

**E1: Salvage Value Estimate Was Incorrect**
- If actual disposal value differs from estimate:
  - Vehicle #125 estimated salvage: $35,000
  - Actual sale: $28,750 (condition was worse than expected)
  - Difference: $6,250 unexpected loss
  - Accountant calculates adjustment:
    - Loss on disposal: $24,500 (from scenario above)
    - Additional loss from salvage estimate error: $6,250
    - Total loss: $30,750
  - Fleet manager reviews to understand why estimate was wrong
  - Future estimates adjusted based on actual results
  - Gain/loss variance tracked for process improvement

**E2: Depreciation Calculation Error Discovered**
- If error found in past depreciation:
  - Audit discovers: Vehicle #456 was depreciated for 15 months instead of 14
  - Over-depreciation: One month × $1,500/month = $1,500
  - Accountant corrects with reversing entry:
    - Debit: Account 12-1530 (Accumulated Depreciation) $1,500
    - Credit: Account 61-6100 (Depreciation Expense) $1,500
  - Future depreciation recalculated correctly
  - Audit trail documents error and correction

**E3: New Tax Rule Requires Different Depreciation**
- If tax code changes affect MACRS depreciation:
  - New tax rule: Class 8 trucks now qualify for 5-year MACRS vs 7-year
  - Accountant updates tax depreciation schedule
  - Book depreciation remains 7-year straight-line
  - Creates deferred tax liability for difference
  - Tax provision calculation adjusted
  - Financial statement disclosure required for tax rate difference

#### Postconditions:
- Fixed asset record is created with complete depreciation schedule
- Monthly depreciation is automatically calculated and posted
- Fleet book values are accurate and current
- Balance sheet reflects correct asset and depreciation values
- Tax and financial reporting uses consistent depreciation

#### Business Rules:
- BR-AC-023: Depreciation method must be consistent across same asset class
- BR-AC-024: Useful life estimates must follow IRS guidelines or company policy
- BR-AC-025: Salvage value cannot exceed 25% of original cost
- BR-AC-026: Major capital improvements ($>$5,000) must be capitalized and depreciated
- BR-AC-027: Repairs and maintenance must be expensed, not capitalized
- BR-AC-028: Fully depreciated assets cannot generate further depreciation
- BR-AC-029: Depreciation schedule locked after 5 years for audit compliance

#### Related User Stories:
- US-AC-005: Depreciation Schedule Management

---

### UC-AC-005: Analyze Total Cost of Ownership (TCO)

**Use Case ID**: UC-AC-005
**Use Case Name**: Analyze Total Cost of Ownership (TCO)
**Actor**: Accountant (primary), Fleet Manager (secondary)
**Priority**: Medium

#### Preconditions:
- Complete vehicle cost history is available (all transactions)
- Depreciation schedules are current
- Vehicle maintenance and repair records are accessible
- Fuel consumption data is available
- Insurance costs are captured
- Disposal/resale values are known

#### Trigger:
- Fleet manager requests TCO analysis for replacement decision
- Annual TCO analysis process begins
- Accountant performs ad-hoc TCO comparison for similar vehicles

#### Main Success Scenario:
1. Fleet Manager asks: "Should we replace Vehicle #287 (2018 truck, 245k miles)?"
2. Fleet Manager wants to understand total economic impact of ownership
3. Accountant opens TCO Analysis tool
4. Accountant selects vehicle: "2018 Freightliner Cascadia (VIN: 1HSCWJPR2KH339823)"
5. System retrieves complete cost history from 2018 to present (7 years):
   - Original acquisition cost: $178,000
   - Upgrades/improvements: $12,500 (new sleeper cab interior, custom paint)
   - Total depreciable cost: $190,500
6. System calculates cost components over 7-year life:
   - **Depreciation**: $155,500 (from $190,500 to $35,000 salvage value)
   - **Fuel Costs**: $287,400 (245k miles ÷ 6.2 MPG × $3.65 avg fuel cost)
   - **Maintenance & Repairs**: $84,200
     - Routine maintenance (oil changes, filters): $18,400
     - Tire replacements: $22,600
     - Parts and component repairs: $31,800
     - Major repairs (transmission, engine work): $11,400
   - **Insurance Costs**: $42,100 (7 years × $6,014/year)
   - **Registration & Licensing**: $3,500 (annual fees)
   - **Tolls & Road Charges**: $2,100 (pay-per-mile on interstates)
7. System calculates total cost of ownership:
   - **Total Cost of Ownership**: $574,700 over 7 years
8. System calculates unit cost metrics:
   - **Cost per Mile**: $574,700 ÷ 245,000 miles = **$2.35/mile**
   - **Cost per Year**: $574,700 ÷ 7 years = **$82,100/year**
   - **Cost per Day**: $574,700 ÷ 2,555 days = **$224.90/day**
   - **Cost per Hour**: $574,700 ÷ 12,275 hours = **$46.83/hour**
9. System displays cost breakdown by year:
   - Year 1 (2018): $95,400 (new vehicle - high depreciation + acquisition setup)
   - Year 2 (2019): $82,600 (steady state)
   - Year 3 (2020): $80,900 (depreciation slowing)
   - Year 4 (2021): $82,100 (maintenance increasing)
   - Year 5 (2022): $84,200 (more repairs)
   - Year 6 (2023): $86,500 (major repairs, increasing age)
   - Year 7 (2024): $93,000 (significant maintenance, nearing end of life)
10. Fleet Manager asks: "What if we replace it now with new 2025 truck?"
11. Accountant creates comparison scenario:
    - **Current Vehicle #287 (Keep)**:
      - Projected costs next 3 years: $270,600 (maintenance ramping up)
      - Estimated residual value in 3 years: $8,000 (barely salvage value)
      - Total 3-year cost: $278,600
    - **New 2025 Truck (Replace)**:
      - Acquisition cost: $185,000
      - Projected costs next 3 years (depreciation + fuel + maintenance): $245,800
      - Estimated residual value in 3 years: $95,000
      - Total 3-year cost: $335,800
      - Advantage of keeping old truck: $57,200 savings
12. Fleet Manager reconsiders: "But is the old truck reliable?"
13. Accountant reviews reliability metrics:
    - Vehicle #287 breakdowns in last 12 months: 3
    - Average downtime per breakdown: 4 hours
    - Total downtime cost (lost revenue): $8,400
    - Repair costs: $11,200
    - Last major repair: 8 months ago (suggests ongoing issues)
14. Accountant includes reliability analysis:
    - Old truck: High reliability risk, potential unplanned downtime
    - New truck: Warranty coverage, predictable costs, higher reliability
15. Accountant recommends:
    - "TCO favors keeping old truck ($57k savings)"
    - "BUT: Reliability risk and downtime exposure argue for replacement"
    - "Recommend replacing for operational certainty despite higher costs"
16. Accountant generates TCO report:
    - Side-by-side comparison of options
    - Cost breakdown and unit metrics
    - Sensitivity analysis (varying depreciation, fuel prices)
    - Reliability and risk factors
    - Strategic recommendation
17. Fleet Manager receives report and uses for replacement decision

#### Alternative Flows:

**A1: Compare Multiple Vehicle Types**
- 1a. If comparing different vehicle types:
  - Accountant analyzes:
    - 3 Freightliner trucks (similar age and mileage)
    - 2 Volvo trucks (competitor brand)
    - 1 Peterbilt truck (premium brand)
  - System calculates TCO for each:
    - Freightliner avg: $2.35/mile
    - Volvo avg: $2.42/mile (+3%)
    - Peterbilt avg: $2.51/mile (+7%)
  - Freightliner shows lowest lifetime cost
  - Recommendation: Continue standardizing on Freightliner

**A2: Electric Vehicle (EV) vs Gas Analysis**
- 1a. If evaluating EV adoption:
  - Accountant compares:
    - Existing gas truck TCO: $2.35/mile
    - New EV truck: $320,000 acquisition (vs $185,000 gas)
    - EV electricity cost: $0.35/kWh (vs $0.60/mile fuel)
    - EV maintenance: 30% lower (fewer moving parts)
  - System calculates EV TCO: $2.18/mile
  - EV breakeven: 4.2 years (vs 7-year useful life of gas)
  - Government tax credits: $40,000 (reduces EV cost)
  - Adjusted EV cost: $1.98/mile
  - Recommendation: EVs competitive starting year 3 with proper usage

**A3: Lease vs Buy Analysis**
- 1a. If evaluating lease vs ownership:
  - Accountant models lease scenario:
    - Monthly lease: $3,500 × 60 months = $210,000
    - Maintenance included in lease
    - No residual value uncertainty
    - Mileage limits: 100,000 miles (flexible terms available)
  - Comparison:
    - Buy TCO: $574,700 (245,000 miles, 7 years)
    - Lease cost: $210,000 (60,000 miles, 5 years, then new vehicle)
    - Extended buy TCO (add 2 more years): $850,000 for 320,000 miles
  - Lease advantage: Lower 5-year cost, predictable
  - Buy advantage: Higher mileage utilization, residual value option

#### Exception Flows:

**E1: Complete Historical Data Not Available**
- If cost history is incomplete:
  - Vehicle #287 missing maintenance records for 2020-2021 (previous owner)
  - System displays: "⚠ Historical cost data incomplete for 2020-2021 period"
  - Accountant estimates missing costs based on:
    - Industry averages for similar vehicles
    - Maintenance patterns before and after gap
    - Mileage-based projections
  - Accountant notes uncertainty in report
  - TCO calculated with estimated components clearly marked
  - Notes recommend verifying with previous owner if possible

**E2: Residual Value Significantly Overestimated**
- If actual resale value is much lower:
  - Vehicle #287 book value at 7 years: $35,000 (salvage estimate)
  - Market assessment at end of life: only $12,000
  - $23,000 difference from estimate
  - Accountant recalculates TCO with actual value
  - TCO increases by $23,000 (additional loss on disposal)
  - Fleet manager reviews why salvage estimate was too high
  - Future projections adjusted for vehicle types showing bias

**E3: Major Cost Category Discovered Missing**
- If cost component not included in initial analysis:
  - Accountant discovers: Training costs for new EV vehicle ($8,000)
  - EV-specific infrastructure: Charging station installation ($15,000)
  - Insurance increase for new technology: +$2,000/year
  - Accountant recalculates with all components
  - EV cost advantage reduced but still competitive

#### Postconditions:
- Complete lifecycle cost analysis is calculated
- Unit cost metrics (per mile, per year, per hour) are established
- Comparison scenarios are available for decision support
- Cost trends over vehicle life are documented
- Recommendations are provided for replacement decisions

#### Business Rules:
- BR-AC-030: TCO must include all cost categories: depreciation, fuel, maintenance, insurance, registration
- BR-AC-031: Unit costs calculated on both per-mile and per-year basis for decision making
- BR-AC-032: Sensitivity analysis performed varying key assumptions (fuel prices, repair costs)
- BR-AC-033: Residual values based on historical data or third-party valuations (not optimistic estimates)
- BR-AC-034: EV and gas vehicle comparisons must include tax incentives and total energy cost
- BR-AC-035: Reliability and downtime risk assessed alongside financial metrics
- BR-AC-036: TCO analysis archived for comparison with actual disposal results

#### Related User Stories:
- US-AC-006: Total Cost of Ownership (TCO) Analysis

---

## Epic 4: Budget Management and Variance Analysis

### UC-AC-006: Create and Monitor Annual Budget

**Use Case ID**: UC-AC-006
**Use Case Name**: Create and Monitor Annual Budget
**Actor**: Accountant (primary), Fleet Manager (secondary), Finance Director (secondary)
**Priority**: High

#### Preconditions:
- Prior year spending data is available for historical analysis
- Cost center definitions are established
- Budget approval workflow is configured
- Monthly actual spending is being tracked and posted
- Budget variance reporting tools are operational

#### Trigger:
- Annual budget planning process begins (typically September-October for January year)
- Fleet manager requests budget update due to operational changes
- Mid-year budget review and adjustment (July-August)

#### Main Success Scenario:
1. Accountant begins 2026 annual budget planning process on 2025-09-01
2. Accountant reviews 2025 actual spending to date (9 months completed):
   - Fuel: $284,000 actual vs $360,000 annual budget
   - Maintenance: $192,000 actual vs $200,000 budget
   - Insurance: $48,600 actual (9/12) vs $64,800 annual budget
   - Total operating: $524,600 actual (9 months) vs $624,800 budget
3. Accountant projects full-year 2025 based on 9-month actual:
   - Projected fuel: $284,000 × 12/9 = $379,000 (over budget by $19k)
   - Projected maintenance: $192,000 × 12/9 = $256,000 (over budget by $56k)
   - Projected total: $699,700 vs $624,800 budget (12% over)
4. Accountant collects input from Fleet Manager for 2026 budget:
   - Fleet Manager expectations: "Continue current fleet size (50 vehicles)"
   - Anticipated changes: "Reduce average age (retiring 5 old trucks, acquiring 3 new ones)"
   - Fuel efficiency improvement: "New trucks should improve MPG by 8%"
   - Maintenance reduction: "Newer fleet should reduce repair costs by 10%"
5. Accountant creates 2026 budget based on 2025 trends with adjustments:

   **2026 Budget Categories:**
   - Fuel & Lubricants: $350,000 (vs $379k projected 2025 actual)
     - Adjustment: Reduce 5% for improved MPG and newer fleet
   - Maintenance & Repairs: $230,000 (vs $256k projected 2025 actual)
     - Adjustment: Reduce 10% for newer vehicles, increase 3% for inflation
   - Tires & Wheels: $45,000 (vs $48k projected 2025)
   - Insurance: $66,000 (12 months)
   - Registration & Licensing: $3,500
   - Tolls & Road Charges: $2,500
   - Depreciation: $520,000 (accounting entry only)
   - Total Operating: $697,000
   - Total with Depreciation: $1,217,000

6. Accountant allocates budget monthly to account for seasonality:
   - Fuel: Higher in winter (heating, reduced MPG), lower in summer
   - Month allocation: Jan-Feb: $32,000; Mar-May: $28,000; Jun-Aug: $26,000; Sep-Oct: $29,000; Nov-Dec: $31,500
   - Maintenance: Higher in spring (snow removal, pre-season checks), lower in summer
   - Month allocation varies by anticipated fleet utilization

7. Accountant allocates budget across cost centers:
   - Fleet Operations (vehicles): $600,000 (86%)
   - Administrative (office): $15,000 (2%)
   - Safety & Compliance: $28,000 (4%)
   - IT Systems: $12,000 (2%)
   - Contingency Reserve: $42,000 (6%)

8. Accountant creates three budget scenarios for management review:

   **Conservative Scenario** (Fuel $340k, Maintenance $210k):
   - Total Operating: $661,000
   - Rationale: If efficiency improves more than expected

   **Expected Scenario** (Fuel $350k, Maintenance $230k):
   - Total Operating: $697,000
   - Rationale: Most likely based on current trends

   **Aggressive Scenario** (Fuel $365k, Maintenance $250k):
   - Total Operating: $726,500
   - Rationale: If new vehicles don't improve efficiency as planned

9. Accountant submits 2026 budget to Finance Director for review
10. Finance Director reviews against corporate targets:
    - Corporate target growth: 0% (maintain prior year level)
    - Proposed budget: +$27,300 (4% increase over 2025 original budget)
    - Variance: Exceeds target, needs justification
11. Accountant provides justification:
    - Fleet size same (50 vehicles)
    - Main increase: Depreciation on new vehicles (+$40k)
    - Offset by: Maintenance reduction on newer fleet (-$26k)
    - Net impact on operating cash: +$14k (2%)
12. Finance Director approves expected scenario budget
13. Finance Director requires 10% contingency reduction:
    - Reduces contingency from $42,000 to $32,000
    - New total: $687,000 operating budget
14. Accountant finalizes budget:
    - Submits to board approval (if required by company policy)
    - Board approves budget on 2025-10-15
15. System activates 2026 budget:
    - Monthly targets loaded
    - Actual-to-budget tracking begins Jan 1, 2026
    - Variance reporting enabled

#### Alternative Flows:

**A1: Mid-Year Budget Review and Adjustment**
- 1a. If significant operational change requires budget adjustment:
  - July 2026: Fleet expanded by 5 vehicles (unexpected growth)
  - Operations requires 10% budget increase
  - Accountant performs mid-year budget review
  - Accountant revises budget upward:
    - Fuel: $350k → $385k (+$35k for 10% more vehicles)
    - Maintenance: $230k → $253k (+$23k)
    - New 2026 budget total: $720k (vs original $687k)
  - Finance Director approves budget increase
  - Remaining 6 months of year operate under revised budget
  - Full-year 2026 budget updated to $720k

**A2: Copy Prior Year Budget as Starting Point**
- 1a. If accountant wants to use prior year as base:
  - Accountant clicks "Copy Prior Year Budget"
  - System loads 2025 budget as template: $624,800
  - Accountant applies increases for inflation: +3% = $643,544
  - Accountant adjusts for operational changes:
    - New vehicles efficiency improvement: -5% = $32,000 reduction
    - Final 2026 budget: $611,544
  - Much faster than building from scratch
  - Still requires review and adjustment for changes

**A3: Scenario Modeling for "What-If" Analysis**
- 8a. If accountant wants to evaluate multiple options:
  - Scenario 1: "Keep current fleet" - No new vehicle purchases
  - Scenario 2: "Replace 5 vehicles" - Higher depreciation, lower maintenance
  - Scenario 3: "Add 10 new vehicles and retire 15 old ones" - Major changes
  - System calculates total cost for each scenario
  - Finance Director evaluates strategic options based on costs
  - Selected scenario becomes approved budget

#### Exception Flows:

**E1: Budget Approval Rejected**
- If Finance Director rejects budget:
  - Director: "Budget exceeds corporate target - reduce by 10%"
  - Accountant recuts budget removing 10%:
    - Reduce contingency: -$3,200
    - Reduce maintenance: -$7,100 (target high-cost repairs for deferral)
    - Reduce depreciation to reflect lower capitalization: -$4,700
    - Revised total: $617,300
  - Accountant resubmits revised budget
  - Director approves revised version

**E2: Key Cost Assumptions Change Significantly**
- If external factors impact budget mid-planning:
  - Oil prices spike to $150/barrel (was expecting $90)
  - Fuel cost projections increase 40%
  - Accountant revises fuel budget: $350k → $490k (major increase)
  - Accountant escalates to Finance Director
  - Director may:
    - Approve higher fuel budget
    - Request operational changes to reduce fuel usage
    - Defer vehicle purchases to reduce mileage
  - Final budget reflects decision made at director level

**E3: Budget Data Cannot Be Locked (System Issue)**
- If system won't finalize budget:
  - System displays error: "Cannot lock budget - validation failed"
  - Accountant investigates: Cost center allocation doesn't total 100%
  - Accountant corrects allocation percentages to total exactly 100%
  - System successfully locks budget
  - Finance team notified of issue for system improvements

#### Postconditions:
- Approved annual budget is established and activated
- Monthly targets and cost center allocations are set
- Budget variance tracking begins
- Dashboard shows actual vs budget monthly
- Contingency reserves are designated

#### Business Rules:
- BR-AC-037: Annual budget must be approved by Finance Director before January 1
- BR-AC-038: Budget variance reporting begins first business day of year
- BR-AC-039: Budget cannot exceed corporate growth targets without CEO approval
- BR-AC-040: Monthly allocations must account for seasonality and business cycles
- BR-AC-041: Contingency reserve allocated (5-10% of total budget)
- BR-AC-042: Mid-year budget reviews permitted if business changes >5%
- BR-AC-043: Prior year budget history retained for 5 years for trend analysis

#### Related User Stories:
- US-AC-007: Annual Budget Planning
- US-AC-008: Budget Variance Analysis

---

### UC-AC-007: Monitor Budget Variance and Take Corrective Action

**Use Case ID**: UC-AC-007
**Use Case Name**: Monitor Budget Variance and Take Corrective Action
**Actor**: Accountant (primary), Fleet Manager (secondary), Finance Director (secondary)
**Priority**: High

#### Preconditions:
- Active annual budget is loaded and assigned
- Monthly actual transactions are posted to GL
- Variance threshold rules are configured (warning levels)
- Variance reporting dashboard is accessible
- Email notification system is operational

#### Trigger:
- End of month close process (variance reporting generated automatically)
- Accountant opens variance dashboard for real-time monitoring
- Variance alert triggered when threshold exceeded

#### Main Success Scenario:
1. Accountant opens Budget Variance Dashboard on 2026-10-31 (end of October)
2. System displays October 2026 variance summary:

   **October 2026 Budget vs Actual**:
   - Fuel: Budget $29,000 | Actual $31,200 | Variance $2,200 (7.6% unfavorable)
   - Maintenance: Budget $18,500 | Actual $17,800 | Variance ($700) (3.8% favorable)
   - Tires: Budget $3,750 | Actual $4,100 | Variance $350 (9.3% unfavorable)
   - Insurance: Budget $5,500 | Actual $5,500 | Variance $0 (0%)
   - Other: Budget $2,250 | Actual $2,100 | Variance ($150) (6.7% favorable)
   - **Total October**: Budget $59,000 | Actual $60,700 | Variance $1,700 (2.9% unfavorable)

3. Accountant reviews Year-to-Date (YTD) variance:
   - Fuel: Budget $280,000 | Actual $294,500 | Variance $14,500 (5.2% unfavorable)
   - Maintenance: Budget $185,000 | Actual $178,300 | Variance ($6,700) (3.6% favorable)
   - Tires: Budget $37,500 | Actual $40,200 | Variance $2,700 (7.2% unfavorable)
   - Insurance: Budget $45,833 | Actual $45,833 | Variance $0 (0%)
   - Other: Budget $18,750 | Actual $17,950 | Variance ($800) (4.3% favorable)
   - **Total YTD**: Budget $567,083 | Actual $576,783 | Variance $9,700 (1.7% unfavorable)

4. Accountant notes:
   - Overall variance 1.7% unfavorable is within acceptable range (±3% tolerance)
   - Fuel variance 5.2% unfavorable exceeds tolerance - requires investigation
   - Maintenance favorable variance suggests good cost control
   - Tires unfavorable variance also exceeds tolerance

5. Accountant drills down into Fuel variance:
   - System shows fuel consumption trending:
     - Expected: 8,247 gallons YTD
     - Actual: 8,632 gallons YTD (385 gallons over)
     - Variance: +4.7% volume increase
   - Average fuel price:
     - Expected: $3.40/gallon
     - Actual: $3.415/gallon (minimal variance)
   - Root cause: Volume increase, not price
   - Accountant investigates reasons:
     - Fleet size same (50 vehicles)
     - Miles driven: 154,800 actual vs 151,200 budgeted (+2.4%)
     - Overall fleet MPG: 17.94 actual vs 18.3 budgeted (-1.8%)
   - Issues identified:
     - Two new drivers with poor fuel efficiency
     - Two vehicles recently had engine issues affecting MPG
     - Route assignments slightly longer than planned

6. Accountant consults with Fleet Manager to understand drivers:
   - Two new drivers: Sarah Chen and Mike Rodriguez
   - Both averaging 16.5 MPG vs fleet average 17.94 MPG
   - Fleet Manager explains:
     - New drivers still learning efficient driving techniques
     - Both drivers handle more local/stop-and-go routes (lower MPG)
     - Sarah has completed 3 weeks safety training - will improve
     - Mike will complete training next month
   - Fleet Manager estimates: Both drivers will improve to 17.5+ MPG within 2 months

7. Accountant documents fuel variance analysis:
   - Root cause: New driver training phase (temporary issue)
   - Timeline: Improve by December 2026
   - Forecast: YTD fuel variance expected to reduce to 3-4% by year-end
   - Action: Monitor driver MPG trends monthly
   - No budget adjustment recommended (temporary issue resolves naturally)

8. Accountant investigates Tire variance:
   - Budget: $37,500 (10 months)
   - Actual: $40,200 (7.2% over)
   - Analysis: Fleet had unexpected tire replacements:
     - September: 3 vehicles had premature tire failures (quality issue)
     - One supplier provided defective tires (investigation ongoing)
     - Total cost: $4,200 (should have been ~$3,600)
     - Supplier dispute: Requesting credit/replacement
   - Accountant contacts Procurement:
     - Procurement confirms supplier agrees to issue $2,100 credit
     - Credit will be received in November (reduce November tire expense)
   - Adjusted tire variance: $2,700 - $2,100 credit = $600 remaining
   - Favorable factor: Other tire replacements come in under budget
   - Action: Monitor supplier quality; continue using credit when received

9. Accountant calculates full-year forecast:
   - Current YTD: $576,783 (10 months actual)
   - Remaining 2 months budget: $118,417
   - Forecast additional variance (worst case, no improvement):
     - Fuel additional: +$3,700 (2 months × historical 5.2% variance)
     - Tires additional: +$600 (2 months, before credit is applied)
     - Other categories: Neutral
   - **Projected full-year cost**: $699,100 (vs $685,500 budget = 2% over)

10. Accountant documents variance report and submits to Finance Director:
    - **Key Findings**:
      - Overall YTD variance: 1.7% unfavorable ($9,700)
      - Fuel variance: 5.2% due to new driver training (temporary)
      - Tire variance: 7.2% due to supplier quality issue (being resolved)
      - Maintenance: 3.6% favorable (good cost control)
      - Projected full-year variance: 2% unfavorable (acceptable)
    - **Corrective Actions Taken**:
      - New drivers enrolled in fuel efficiency training
      - Supplier dispute filed for $2,100 credit on defective tires
      - Route optimization reviewed to address longer mileage
      - Monthly monitoring increased for fuel and tire categories
    - **Forecast**: Variance expected to improve to <1% by year-end

11. Finance Director reviews report:
    - Approves variance explanation and corrective actions
    - Notes: "Monitor new driver MPG - if not improving by November, escalate"
    - Approves continuing without budget adjustment
    - Variance acceptable given operational factors

#### Alternative Flows:

**A1: Variance Exceeds Threshold - Requires Intervention**
- 4a. If variance exceeds acceptable threshold (>3%):
  - Fuel variance reaches 8% unfavorable ($22,400)
  - System displays alert: "⚠ Fuel variance exceeds 5% threshold"
  - Accountant escalates to Fleet Manager and Finance Director
  - Director requires action plan within 3 days:
    - Reduce fleet miles by 10% (reschedule routes)
    - Implement idle time reduction program
    - Purchase route optimization software
    - Retire lowest-MPG vehicles
  - Director approves action plan
  - Accountant monitors weekly instead of monthly
  - Recalculates forecast with corrective action impact

**A2: Favorable Variance - Investigate for Sustainability**
- 3a. If significant favorable variance:
  - Maintenance shows 8% favorable ($14,800 saved)
  - Accountant investigates to ensure not deferred maintenance:
    - Are we doing less preventive maintenance?
    - Are repairs being postponed to future periods?
    - Or is fleet genuinely in better condition?
  - Fleet Manager confirms: "New preventive maintenance program working - fewer breakdowns"
  - Accountant accepts favorable variance as sustainable
  - Recommends budget reduction for next year based on improved efficiency

**A3: Multiple Categories Over Budget - Broad Corrective Action**
- 2a. If multiple categories exceed budget:
  - Fuel, tires, and maintenance all 5%+ over budget
  - Suggests fleet is aging and less efficient overall
  - Finance Director directs:
    - Accelerate vehicle replacement (retire oldest 5 vehicles)
    - Bring forward purchase of 8 new vehicles (not planned until 2027)
    - Additional depreciation in 2026: $45,000
    - Expected maintenance reduction 2027: $60,000
    - Payback period: <1 year
  - Board approves capital expenditure increase
  - 2026 budget increased for vehicle purchases
  - 2027 budget reduced for lower maintenance costs

#### Exception Flows:

**E1: Actual Transactions Not Fully Posted**
- If GL close is incomplete:
  - Month-end close incomplete - missing week of October transactions
  - System displays warning: "⚠ Actual costs incomplete for October"
  - Accountant waits for GL close to complete
  - System recalculates variance once all transactions posted
  - Variance report delayed 2-3 days until month-end close complete

**E2: Budget Data Corrupt or Changed Unexpectedly**
- If budget numbers change without approval:
  - October budget was $59,000
  - System shows $65,000 (changed without accountant action)
  - Accountant investigates: Finds unauthorized budget adjustment
  - Accountant rolls back to approved budget: $59,000
  - Audit trail identifies who made unauthorized change
  - Access controls reviewed to prevent future unauthorized changes

**E3: Variance Report Doesn't Explain Variance Correctly**
- If variance reason is unclear:
  - Tires show $3,700 variance
  - Analysis shows 2 large purchases, but no explanation for amounts
  - Accountant investigates supporting documents:
    - Purchase order: 16 tires × $387 = $6,192 (not matching invoice)
    - Invoice received: $5,900 (quantity discount applied)
    - Received correctly - report miscalculated amount
  - Accountant corrects variance calculation
  - Variance reduced from $3,700 to $3,300

#### Postconditions:
- Monthly variance is calculated and analyzed
- Unfavorable variances are investigated and explained
- Corrective actions are documented
- Full-year forecast is updated based on trends
- Variance trend is tracked for management decision-making

#### Business Rules:
- BR-AC-044: Budget variance reports must be generated within 5 days of month-end close
- BR-AC-045: Variances >3% from budget require investigation and documentation
- BR-AC-046: Corrective action plans required for variances >5%
- BR-AC-047: Fleet manager approval required for variance explanations
- BR-AC-048: Favorable variances >3% require sustainability assessment
- BR-AC-049: Variance thresholds may be adjusted by Finance Director seasonally
- BR-AC-050: Full-year forecast updated monthly based on YTD trends

#### Related User Stories:
- US-AC-008: Budget Variance Analysis

---

## Epic 5: Tax Reporting and Compliance

### UC-AC-008: Generate IFTA Quarterly Tax Reports

**Use Case ID**: UC-AC-008
**Use Case Name**: Generate IFTA Quarterly Tax Reports
**Actor**: Accountant (primary), Fleet Manager (secondary)
**Priority**: High

#### Preconditions:
- GPS/telematics mileage data by jurisdiction is available
- Fuel purchase records with location data are current
- IFTA tax rate tables are up-to-date by state/province
- Vehicle IFTA registration status is current
- Quarterly filing deadlines are configured in system

#### Trigger:
- End of calendar quarter (quarterly IFTA filing deadline approaches)
- Accountant manually initiates IFTA report generation
- Automated reminder system triggers 30 days before filing deadline

#### Main Success Scenario:
1. Accountant receives system reminder: "IFTA Q3 (July-September) filing due 2025-11-03"
2. Current date is 2025-10-20 (14 days before deadline)
3. Accountant opens IFTA Reporting module
4. System displays Q3 IFTA data summary:
   - Reporting Period: July 1 - September 30, 2025
   - Vehicles tracked: 47 of 50 fleet vehicles (3 are non-commercial exempt)
   - Data completeness: 98.2% (GPS and fuel records)
   - IFTA filing status: Ready to review
5. System displays mileage by jurisdiction (from GPS telematics):
   - Massachusetts: 12,450 miles (24.3%)
   - Connecticut: 3,200 miles (6.2%)
   - New York: 9,875 miles (19.2%)
   - Pennsylvania: 8,920 miles (17.3%)
   - New Jersey: 6,300 miles (12.3%)
   - Maryland: 4,450 miles (8.7%)
   - Other (VA, DC, DE): 5,705 miles (11.1%)
   - **Total Miles**: 50,900 miles

6. System displays fuel purchased by jurisdiction (from fuel card and driver reports):
   - Fuel purchased in MA: 2,845 gallons
   - Fuel purchased in CT: 780 gallons
   - Fuel purchased in NY: 2,210 gallons
   - Fuel purchased in PA: 2,415 gallons
   - Fuel purchased in NJ: 1,650 gallons
   - Fuel purchased in MD: 1,180 gallons
   - Fuel purchased in other states: 1,520 gallons
   - **Total Fuel Purchased**: 12,600 gallons

7. System calculates IFTA tax liability by jurisdiction:
   - **Calculation Logic**: (Gallons consumed in state) - (Gallons purchased in state) × (Tax rate per state) = Tax owed or credit
   - Gallons consumed estimated as: (Miles in state) ÷ (Fleet average MPG 18.2) = Gallons consumed
   - **Massachusetts**:
     - Miles driven: 12,450 | Gallons consumed: 684 | Fuel purchased: 2,845 | Credit: (2,845-684) × $0.26 = ($561)
   - **Connecticut**:
     - Miles driven: 3,200 | Gallons consumed: 176 | Fuel purchased: 780 | Credit: (780-176) × $0.36 = ($218)
   - **New York**:
     - Miles driven: 9,875 | Gallons consumed: 542 | Fuel purchased: 2,210 | Credit: (2,210-542) × $0.33 = ($551)
   - **Pennsylvania**:
     - Miles driven: 8,920 | Gallons consumed: 490 | Fuel purchased: 2,415 | Credit: (2,415-490) × $0.55 = ($1,059)
   - **New Jersey**:
     - Miles driven: 6,300 | Gallons consumed: 346 | Fuel purchased: 1,650 | Credit: (1,650-346) × $0.38 = ($497)
   - **Maryland**:
     - Miles driven: 4,450 | Gallons consumed: 244 | Fuel purchased: 1,180 | Credit: (1,180-244) × $0.34 = ($318)
   - **Other States**:
     - Miles driven: 5,705 | Gallons consumed: 313 | Fuel purchased: 1,520 | Tax: (Varies by state)
   - **Summary**:
     - Total taxes owed: $423
     - Total credits: $3,204
     - **Net position**: $2,781 credit (overpaid in prior quarters, or excess fuel purchased)

8. Accountant reviews data quality:
   - Missing GPS data: 1.8% (acceptable - within tolerance)
   - Fuel data completeness: 99.1% (excellent)
   - Data anomalies detected: None
   - Verification: ✓ Data ready for filing

9. Accountant validates compliance:
   - All vehicles have current IFTA registration: ✓
   - All states represented in mileage: ✓
   - No vehicles in non-IFTA jurisdictions: ✓
   - Odometer readings traceable: ✓

10. System generates IFTA Form Schedule A-1 (standard quarterly form):
    - Jurisdiction-by-jurisdiction breakdown
    - Mileage, fuel, and tax calculations
    - Signature block for accountant
    - Filing reference number

11. Accountant reviews generated report line-by-line:
    - Verifies totals match system calculations
    - Spot-checks 5 transactions manually (sample verification)
    - Confirms no data entry errors
    - Signs report electronically

12. System displays filing options:
    - **Option 1**: File electronically with state IFTA administrator (3-state pool)
    - **Option 2**: Print and mail paper forms
    - **Option 3**: Use certified tax service to file

13. Accountant selects Option 1: Electronic filing
    - System prepares IFTA XML file per state standards
    - File ready for submission to state tax portal

14. Accountant initiates electronic filing:
    - System connects to state tax authority portal (secured connection)
    - Submits IFTA report electronically
    - Receives filing confirmation with reference number: IFTA-MA-2025-Q3-001247

15. System records filing:
    - Filing status: **Submitted**
    - Date submitted: 2025-10-20
    - Due date: 2025-11-03
    - Days early: 14 days
    - Reference number: IFTA-MA-2025-Q3-001247

16. System triggers payment processing:
    - Amount due: $423
    - Payment method: ACH transfer to state account
    - Payment scheduled: 2025-10-27 (7 days before due date)

17. Accountant archives IFTA records:
    - Original supporting documents (fuel receipts, GPS logs)
    - Calculations and work papers
    - Filing confirmation
    - Payment proof (once processed)

#### Alternative Flows:

**A1: Filing Deadline Extension Required**
- 2a. If timely filing not possible:
  - System detects incomplete data: 15% GPS records missing
  - Accountant cannot verify mileage with confidence
  - Accountant files for 30-day extension with state
  - Extension approved: New deadline 2025-12-03
  - Accountant waits for missing data to be corrected
  - Files complete report on 2025-11-25 (before extended deadline)

**A2: Multi-State IFTA Pool Filing (Pooled Reporting)**
- 7a. If company is part of IFTA pool:
  - Company is member of Northeast IFTA pool with 5 other carriers
  - Designated pool administrator files single consolidated report
  - Accountant submits company's quarterly data to pool administrator
  - Pool administrator aggregates all member data
  - Pool administrator files single consolidated IFTA report with each state
  - Company receives allocation of pool's net tax position
  - More efficient than filing individually in each state

**A3: Tax Exemption for Certain Vehicles**
- 1a. If some vehicles are IFTA-exempt:
  - School buses: 5 vehicles (IFTA-exempt)
  - Government vehicles: 3 vehicles (IFTA-exempt)
  - Private use vehicles: 2 vehicles (IFTA-exempt)
  - System correctly excludes exempt vehicles from IFTA calculation
  - Only 40 commercial vehicles included in IFTA report
  - Non-exempt status verified before filing

#### Exception Flows:

**E1: Significant Data Discrepancy Found**
- If mileage and fuel data don't reconcile:
  - Total fuel purchased: 12,600 gallons
  - Calculated fuel consumption (mileage ÷ MPG): 12,480 gallons
  - Discrepancy: 120 gallons (0.9% - normally acceptable)
  - But discrepancy of 5% or higher flags error:
    - Investigate fuel data quality
    - Verify MPG calculation
    - Check for data entry errors
  - If error found, correct data before filing
  - If no error found, file with discrepancy documented and explained

**E2: IFTA Registration Lapsed**
- If vehicle IFTA registration not current:
  - Vehicle #287 IFTA registration expired 2025-09-30
  - System detects: "⚠ Vehicle IFTA registration expired"
  - Vehicle cannot be included in IFTA mileage
  - Accountant removes vehicle from Q3 report
  - Fleet Manager is notified to renew registration
  - Impact: 2,100 miles in Q3 not claimed
  - Accountant documents reason for variance

**E3: State Tax Rules Changed Mid-Quarter**
- If tax rate changed during quarter:
  - State increases fuel tax rate effective mid-quarter
  - Old rate: $0.26/gallon through Sept 15
  - New rate: $0.29/gallon Sept 16-30
  - System recalculates with prorated rates
  - Some fuel purchased before Sept 15 taxed at old rate
  - Some fuel purchased after Sept 15 taxed at new rate
  - Calculation more complex but system handles automatically

**E4: Filing Portal Unavailable at Deadline**
- If state's online filing system is down:
  - Oct 20: Accountant attempts electronic filing
  - Portal displays error: "System under maintenance - try again after 5 PM"
  - Accountant waits until 6 PM, attempts again - still down
  - State announces: Portal will be down until 2025-10-22
  - Accountant files extension request to protect against late filing penalties
  - Files report when portal is restored on 2025-10-23
  - Filing made within extended deadline

#### Postconditions:
- IFTA quarterly report is generated and filed with appropriate states
- Tax liability is paid on schedule or credit applied to future quarters
- Filing confirmation is received and archived
- Supporting documentation is maintained for audit purposes
- IFTA payment is reconciled and posted to GL

#### Business Rules:
- BR-AC-051: IFTA quarterly reports must be filed by deadline (within 30 days of quarter-end)
- BR-AC-052: GPS mileage data must be 95%+ complete for reliable IFTA filing
- BR-AC-053: Fuel tax credits are applied to subsequent quarter tax liability
- BR-AC-054: All vehicles must have current IFTA registration status
- BR-AC-055: Fleet average MPG must be recalculated quarterly for accurate fuel consumption
- BR-AC-056: IFTA records must be retained for 6 years for tax authority audits
- BR-AC-057: IFTA extension filing required if data not available by deadline

#### Related User Stories:
- US-AC-009: IFTA Reporting

---

### UC-AC-009: Track Tax Exemption Certificates and Manage Exempt Fuel

**Use Case ID**: UC-AC-009
**Use Case Name**: Track Tax Exemption Certificates and Manage Exempt Fuel
**Actor**: Accountant (primary), Fleet Manager (secondary)
**Priority**: Medium

#### Preconditions:
- Tax exemption certificate system is operational
- Fuel transactions are categorized as taxable or exempt
- Vehicle type classifications are current
- Exemption certificate expiration dates are tracked
- Exemption eligibility rules are configured

#### Trigger:
- New exemption certificate is received from customer or supplier
- Quarterly exemption review process begins
- Certificate expiration date approaches (60-day notice)
- Accountant manually reviews exemption transactions

#### Main Success Scenario:
1. Accountant manages tax exemption for fleet vehicles
2. Main exemption category: Agricultural use exemption (some vehicles support ag operations)
3. Agricultural vehicles are exempt from state fuel taxes in several jurisdictions
4. Accountant maintains exemption certificate database:
   - Vehicle #15 (Fuel tank truck): Agricultural exemption in Massachusetts (Exp: 2026-06-30)
   - Vehicle #28 (Delivery truck): Agricultural exemption in Connecticut (Exp: 2025-12-31)
   - Vehicle #42 (Tractor unit): Agricultural exemption in New York (Exp: 2026-03-31)
5. Accountant tracks eligible fuel transactions:
   - Sept 2025: Vehicle #28 fuel purchase in Connecticut: 240 gallons @ $3.75 = $900
   - System marks transaction as "Tax-Exempt (Agricultural)"
   - Tax savings: 240 gallons × $0.36/gal (CT rate) = $86.40
6. System tracks exemption expiration dates:
   - Vehicle #28 exemption expires 2025-12-31 (72 days remaining)
   - System alerts accountant: "Exemption expires in 60 days"
   - Accountant receives reminder to renew certificate
7. Accountant contacts exemption certificate holder:
   - Agricultural operation confirms continued eligibility
   - Exemption certificate renewed: New expiration date 2026-12-31
8. Accountant uploads renewed certificate to system
9. System updates exemption record:
   - New expiration date: 2026-12-31
   - Status: Current
   - Tax savings tracking continues
10. System generates exemption benefit report (quarterly):
    - Total exempt fuel transactions: 3,450 gallons
    - States: MA (1,200 gal), CT (840 gal), NY (1,410 gal)
    - Tax savings:
      - MA: 1,200 × $0.26 = $312
      - CT: 840 × $0.36 = $302.40
      - NY: 1,410 × $0.33 = $465.30
      - **Total tax savings**: $1,079.70 quarterly
      - **Annual tax savings**: $4,319 (projected)
11. Accountant validates exemption accuracy:
    - Spot-check 10 transactions to verify eligible vehicles purchased fuel
    - Verify fuel was for eligible purposes
    - Confirm certificates were current at time of transaction
    - All validations: ✓ Passed
12. Accountant calculates impact on IFTA reporting:
    - Exempt fuel is excluded from IFTA fuel tax calculations
    - Fuel purchased: 12,600 gallons total
    - Taxable fuel: 12,600 - 3,450 = 9,150 gallons
    - Exemption correctly reduces IFTA liability

#### Alternative Flows:

**A1: Non-Eligible Fuel Marked as Tax-Exempt (Error Prevention)**
- 5a. If driver tries to claim exemption on ineligible purchase:
  - Vehicle #50 (standard commercial vehicle, non-agricultural) fuel purchase
  - Driver incorrectly marks as "Tax-Exempt"
  - System validation: "⚠ Vehicle #50 is not registered for agricultural exemption"
  - System prevents marking as tax-exempt
  - Fuel correctly classified as taxable
  - Error prevented system ensures compliance

**A2: Exemption Certificate Lost or Damaged**
- 8a. If certificate document is missing:
  - Accountant searches for Vehicle #15 agricultural exemption certificate
  - Cannot locate original document (lost in office move)
  - Accountant contacts exemption authority for duplicate
  - Authority provides certified copy within 2 weeks
  - Accountant uploads certified copy to system
  - Exemption status: Continues without interruption

**A3: Exemption Revoked Due to Ineligible Use**
- 8a. If vehicle no longer qualifies for exemption:
  - Vehicle #28 was used primarily for agricultural delivery
  - Fleet Manager notifies: Vehicle reassigned to general commercial use (not ag-related)
  - Vehicle no longer qualifies for agricultural exemption
  - Accountant revokes exemption effective immediately
  - System removes exemption from Vehicle #28
  - Future fuel purchases at Vehicle #28 classified as taxable
  - Prior tax-exempt transactions remain valid

#### Exception Flows:

**E1: Exemption Certificate Deemed Invalid by Tax Authority**
- If auditor questions exemption validity:
  - State tax auditor: "Agricultural exemption not properly documented"
  - Requires more detailed proof of agricultural use
  - Accountant must provide:
    - Purchase order or invoice for agricultural products
    - Agricultural customer name and contact
    - Description of agricultural operations
  - Accountant provides supporting documentation
  - Auditor accepts documentation
  - Exemption upheld, no penalties assessed

**E2: Over-Claim of Exemptions (Data Quality Issue)**
- If exemptions exceed reasonable limits:
  - Review shows: 40% of fuel purchases marked as tax-exempt
  - Fleet size: 50 vehicles | Exempt vehicles: 3
  - Expectation: <10% of fuel should be exempt
  - 40% is unusually high - indicates error
  - Accountant investigates: Finds data entry errors
  - Multiple non-exempt vehicles incorrectly marked exempt
  - Accountant corrects transactions
  - Exempt percentage recalculates to 6.5% (reasonable)

**E3: Exemption Benefit Cannot Be Substantiated During Audit**
- If audit reveals inadequate documentation:
  - Auditor questions $4,319 annual tax savings claimed
  - Accountant must provide all exemption certificates
  - Accountant must match each exempt transaction to certificate on file
  - 3 transactions cannot be matched to valid certificate (dates don't match)
  - Amount in question: $247 (0.1% of total savings)
  - Accountant provides explanation and acknowledges minor error
  - Accepts assessment of tax and interest on $247
  - Improves documentation procedures to prevent future errors

#### Postconditions:
- Tax exemption certificates are maintained and current
- Exempt fuel transactions are properly identified and tracked
- Tax savings from exemptions are quantified and reported
- Audit trail documents exemption basis and validity
- IFTA reporting correctly excludes exempt fuel from tax calculation

#### Business Rules:
- BR-AC-058: Exemption certificates must be renewed before expiration
- BR-AC-059: Exemption cannot be claimed without current valid certificate on file
- BR-AC-060: Fuel transactions must be properly categorized as taxable or exempt
- BR-AC-061: Exemption documentation must be retained for audit period (6 years minimum)
- BR-AC-062: Ineligible exemption claims are subject to tax, interest, and penalties
- BR-AC-063: Exemption benefit tracking required for cost savings documentation
- BR-AC-064: Expired exemptions must be immediately removed from system

#### Related User Stories:
- US-AC-010: Tax Exemption Management

---

## Epic 6: Vendor Payment Management

### UC-AC-010: Process Vendor Payments and Payment Batches

**Use Case ID**: UC-AC-010
**Use Case Name**: Process Vendor Payments and Payment Batches
**Actor**: Accountant (primary), Finance Manager (secondary), Bank (secondary)
**Priority**: High

#### Preconditions:
- Approved invoices are available in system
- Vendor banking information is current and validated
- Bank integration for ACH/check processing is configured
- Payment terms are established for vendors
- Cash availability is confirmed

#### Trigger:
- Scheduled payment run date (typically weekly or bi-weekly)
- Accountant manually initiates payment processing
- Invoices reach due date or early payment discount deadline

#### Main Success Scenario:
1. Accountant begins payment processing on 2025-10-20 (scheduled payment run date)
2. System displays pending payment summary:
   - Total approved invoices awaiting payment: $87,450
   - Cash available: $250,000 (confirmed with finance team)
   - Payment priority: Invoices due within 7 days: $45,200
3. Accountant opens payment batch processing module
4. System displays approved invoices eligible for payment:
   - Vendors with invoices due within 10 days (payment window)
   - Invoices NOT currently in dispute or on hold
   - Invoices past invoice date (not prepayment)

   **Eligible Invoices**:
   - ABC Truck Parts: $3,247.50 (Due 2025-11-08) - 19 days, early payment discount available 2/10 Net 30
   - XYZ Fuel Company: $1,850.00 (Due 2025-10-31) - Due within 11 days, no discount
   - Maintenance Contractor: $8,500.00 (Due 2025-10-29) - Due within 9 days, take 2% discount: Save $170
   - Tire Supplier: $4,100.00 (Due 2025-11-05) - Due within 16 days, Net 60 terms
   - ...additional vendors listed...
   - **Total pending**: $87,450

5. Accountant applies payment selection filters:
   - Due within 10 days: $45,200
   - Early payment discount available: $12,800
   - Payment method preference: ACH (72% of vendors), Check (28%)

6. Accountant selects vendors for this payment batch:
   - Select all "Due within 10 days": $45,200 selected
   - Add ABC Truck Parts to capture 2/10 discount: +$3,247.50 selected
   - Hold Tire Supplier (due 11/5, can pay next week): Deselected
   - Add other discount-eligible vendors: +$9,553.00 selected

   **Payment Batch Total**: $57,950.50 (Payable Oct 22)

7. Accountant reviews payment batch details:

   **Batch Summary**:
   - Payment date: 2025-10-22 (2 business days)
   - Total vendors: 14
   - Total amount: $57,950.50
   - Estimated discounts captured: $340
   - Payment methods: ACH (12 vendors, $47,320), Check (2 vendors, $10,630)

   **Vendor List** (sample):
   - ABC Truck Parts: $3,247.50 (ACH) | Original due: 11/8 | Discount: $65 (2/10)
   - XYZ Fuel: $1,850.00 (ACH) | Original due: 10/31 | Standard terms
   - Maintenance: $8,500.00 (Check) | Original due: 10/29 | Discount: $170 (2%)
   - ...additional vendors...

8. Accountant performs batch validation:
   - ✓ All invoices approved
   - ✓ All vendors on approved vendor list
   - ✓ All banking information current
   - ✓ Sufficient cash available
   - ✓ No duplicate payments
   - ✓ Invoice amounts match GL coding
   - **Validation Status**: All checks passed ✓

9. Accountant generates payment files:
   - **ACH File**: NACHA format for 12 vendors
     - File name: "ACH_20251020_PaymentRun_001.ACH"
     - File includes all bank routing numbers, account numbers, amounts
     - File encrypted and digitally signed
   - **Check Batch**: 2 vendors requiring checks
     - Batch number: CHK-20251020-001
     - Check numbers: 7401-7402
     - Remittance details printed with each check

10. Accountant submits payment batch for approval:
    - Batch amount: $57,950.50
    - Approval required: Finance Manager (>$50K threshold)
    - Accountant routes batch to Finance Manager David Chen

11. Finance Manager receives approval request:
    - Reviews batch details
    - Confirms vendor payment terms are being respected
    - Confirms discounts are being captured appropriately
    - Approves payment batch: "Approved for payment 2025-10-22"

12. Accountant confirms approval and releases payment:
    - System displays: "Approval confirmed - Ready to send to bank"
    - Accountant clicks "Process Payment"
    - System securely submits ACH file to company's bank
    - System prints check batch for physical signing

13. Bank confirms payment file received:
    - File status: "Received - Processing"
    - File timestamp: 2025-10-20 3:45 PM
    - Expected processing: 2025-10-22 (ACH standard 1-2 business day processing)

14. Accountant updates invoice payment status:
    - System marks invoices as "Payment Processed"
    - Expected payment date entered: 2025-10-22 for ACH, 2025-10-20 for checks
    - Status changed from "Approved" to "Paid/Scheduled for Payment"

15. System generates payment register:
    - ACH Payment Register for accounting records
    - Vendor remittance information
    - GL entries for payment (automatically generated):
      - Debit: Accounts Payable $57,950.50
      - Credit: Checking Account $57,950.50

16. Accountant reconciles bank transaction when received:
    - Bank confirms ACH processing: 2025-10-22
    - Twelve vendors' accounts debited successfully
    - ACH batch total matches: $47,320.00 ✓
    - Checks cleared: 2025-10-22 (Physical delivery and processing)

17. Accountant closes payment batch:
    - Status: Completed
    - Date completed: 2025-10-22
    - Actual payment vs. scheduled: On-time
    - Batch archived for audit and historical records

#### Alternative Flows:

**A1: Early Payment Discount Opportunity**
- 6a. If early payment discount significantly improves cash position:
  - Vendor offers: 3/5 Net 30 (3% discount if paid within 5 days)
  - Invoice amount: $25,000
  - Discount: $750 (3%)
  - Standard terms: Payment in 20 days
  - Early payment option: Payment in 5 days
  - Accountant calculates ROI: $750 benefit for accelerating payment by 15 days
  - Accountant approves early payment and includes in next payment batch
  - Discount captured: $750

**A2: Partial Payment (Split Invoice Across Multiple Batches)**
- 5a. If invoice is disputed or partially approved:
  - Invoice total: $5,000
  - Approved amount: $4,500 (disputed $500)
  - Accountant processes payment batch with $4,500
  - Remaining $500 held pending dispute resolution
  - After dispute resolved, $500 included in following week's batch

**A3: Payment Hold / Dispute Resolution**
- 3a. If invoice payment is disputed:
  - Fleet Manager reports: "Maintenance work incomplete - missing parts"
  - Invoice from Maintenance Contractor: $8,500
  - Accountant places on hold pending completion
  - Invoice status: "On Hold - Disputed"
  - System excludes from payment batch
  - After vendor completes work, status changes to "Approved"
  - Payment processed in next batch

**A4: Vendor Bank Information Changes**
- 9a. If vendor provides new bank account:
  - ABC Truck Parts notifies: "New bank account effective 11/1"
  - Accountant updates vendor file with new banking information
  - System validates new bank account information with vendor
  - Old bank account flagged as inactive
  - Future payments route to new account
  - Current payment batch uses old account (already approved)

#### Exception Flows:

**E1: Insufficient Cash for Full Batch**
- If cash available drops below batch total:
  - Payment batch total: $57,950
  - Available cash: $42,000 (insufficient)
  - Accountant must reduce batch:
    - Prioritize invoices due first
    - Include only $42,000 of highest-priority invoices
    - Remaining invoices deferred to next week's batch
  - Reduced batch of $42,000 approved and processed
  - Following week increases cash flow and remaining invoices paid

**E2: ACH File Rejected by Bank**
- If bank rejects payment file:
  - Bank error message: "Routing number invalid for 2 vendors"
  - Accountant contacts bank for details
  - Bank provides routing numbers to verify
  - Accountant corrects vendor routing information
  - Regenerates ACH file with corrected routing numbers
  - Resubmits to bank successfully

**E3: Payment Already Processed - Duplicate Prevention**
- If invoice was already paid but appears in pending list:
  - System shows: Invoice INV-45892 pending payment
  - Accountant verifies if previously paid
  - Bank statement check: Invoice already cleared 9/15
  - Status corrected in system: "Already Paid"
  - System prevents including in payment batch
  - Duplicate payment prevented

**E4: Vendor Bank Information Missing/Invalid**
- If vendor has no banking information for ACH:
  - Accountant selects vendor for ACH payment
  - System error: "No valid ACH routing number on file for vendor"
  - Accountant options:
    - Obtain updated banking information from vendor
    - Switch payment method to check
    - Hold payment pending vendor bank information
  - Accountant calls vendor: "Can you provide ACH routing number?"
  - Vendor provides information
  - Accountant updates vendor file
  - Payment proceeds via ACH

#### Postconditions:
- Payment batch is prepared, approved, and submitted to bank
- ACH payments process in 1-2 business days
- Checks are printed, signed, and sent to vendors
- Invoice status is updated to "Paid"
- GL entries are posted for payment
- Payment audit trail is complete
- Bank reconciliation occurs when payments clear

#### Business Rules:
- BR-AC-065: Payment batches must be reviewed and approved by Finance Manager (>$50K)
- BR-AC-066: Early payment discounts must be captured if ROI positive (>2%)
- BR-AC-067: Payment cannot exceed vendor's invoice amount
- BR-AC-068: All payment methods require valid vendor banking information
- BR-AC-069: ACH payments subject to NACHA file format requirements
- BR-AC-070: Check payments require dual authorization signatures (>$25K)
- BR-AC-071: Payment batch records retained for 7 years minimum

#### Related User Stories:
- US-AC-011: Payment Processing and Batching

---

### UC-AC-011: Generate Cost per Mile and KPI Reports

**Use Case ID**: UC-AC-011
**Use Case Name**: Generate Cost per Mile and KPI Reports
**Actor**: Accountant (primary), Fleet Manager (secondary), Executive (secondary)
**Priority**: Medium

#### Preconditions:
- Complete vehicle transaction history is available
- Mileage data from telematics or odometer readings is current
- Cost categories are properly classified and allocated
- Budget targets and industry benchmarks are configured
- Reporting dashboard is operational

#### Trigger:
- Month-end reporting process
- Fleet manager requests cost analysis for strategic decisions
- Executive dashboard refresh for performance review
- Accountant initiates ad-hoc KPI analysis

#### Main Success Scenario:
1. Accountant opens Cost per Mile dashboard on 2025-10-31 (month-end)
2. System retrieves October 2025 operational data:
   - Fleet size: 50 vehicles
   - Total miles driven: 15,640 miles (average 312 miles/vehicle)
   - Total costs: $59,200
3. System calculates October cost per mile metrics:

   **Cost Per Mile Breakdown** (October 2025):
   - Fuel: $31,200 ÷ 15,640 = **$1.99/mile**
   - Maintenance: $17,800 ÷ 15,640 = **$1.14/mile**
   - Tires: $4,100 ÷ 15,640 = **$0.26/mile**
   - Insurance: $5,500 ÷ 15,640 = **$0.35/mile**
   - Other: $700 ÷ 15,640 = **$0.04/mile**
   - **Total Operating Cost per Mile: $3.78/mile**
   - (Does not include depreciation, which is non-cash accounting entry)

4. System compares to benchmarks:
   - Industry average for fleet size 40-60: $3.85/mile
   - Company target: $3.75/mile
   - October performance: $3.78/mile (0.3% unfavorable vs target)
   - Benchmark: 1.8% better than industry average ✓

5. System displays year-to-date (YTD) cost per mile:
   - YTD miles: 156,400 (10 months)
   - YTD costs: $576,783
   - **YTD Cost per Mile: $3.69/mile**
   - Target: $3.75/mile
   - Performance: 1.6% favorable vs target ✓ On track

6. System displays cost per mile trends (last 12 months):
   - Nov 2024: $3.82/mile (high due to winter fuel costs)
   - Dec 2024: $3.91/mile (highest - holiday season, winter weather)
   - Jan 2025: $3.85/mile (winter continues)
   - Feb 2025: $3.74/mile (improving as temps warm)
   - Mar 2025: $3.68/mile (spring, better efficiency)
   - Apr 2025: $3.61/mile (lowest - optimal season)
   - May 2025: $3.63/mile
   - Jun 2025: $3.72/mile
   - Jul 2025: $3.77/mile
   - Aug 2025: $3.81/mile
   - Sep 2025: $3.75/mile
   - Oct 2025: $3.78/mile
   - **12-month average: $3.75/mile** (matches target exactly)

7. System displays cost per mile by vehicle type:
   - Class 8 Trucks (30 vehicles): $4.12/mile (higher - larger vehicles, fuel-heavy)
   - Box Trucks (12 vehicles): $3.25/mile (lighter, more efficient)
   - Vans (8 vehicles): $2.98/mile (smallest, most efficient)
   - **Fleet Average: $3.78/mile**

8. System displays cost breakdown by category (pie chart):
   - Fuel: 52.7% ($1.99/mile)
   - Maintenance: 30.2% ($1.14/mile)
   - Tires: 6.9% ($0.26/mile)
   - Insurance: 9.3% ($0.35/mile)
   - Other: 0.9% ($0.04/mile)

9. Accountant identifies cost drivers and outliers:
   - Fuel costs: 52.7% of total (typical, expected)
   - Vehicle #287: $6.50/mile (highest - poor MPG, high mileage)
   - Vehicle #412: $2.10/mile (most efficient)
   - Differential: Vehicle #287 costs 3x more per mile than #412

10. Accountant investigates Vehicle #287:
    - Vehicle type: 2018 Freightliner (Class 8 truck)
    - October miles: 1,240
    - October costs: $8,060
    - MPG: 6.8 (fleet average 7.8)
    - Issues identified:
      - Recent engine repairs (affecting efficiency)
      - Older vehicle (7 years old)
      - Multiple maintenance issues (tires, alignment)
    - Recommendation: Flag for replacement (TCO analysis would be warranted)

11. System generates Key Performance Indicator (KPI) report:

    **Fleet KPI Summary - October 2025**:
    - **Cost per Mile**: $3.78 (Target: $3.75) - 0.3% unfavorable
    - **Fuel Efficiency (MPG)**: 7.84 (Target: 7.80) - 0.5% favorable
    - **Maintenance Cost per Mile**: $1.14 (Target: $1.10) - 3.6% unfavorable
    - **On-Time Delivery Rate**: 92% (Target: 90%) ✓ Exceeding
    - **Vehicle Utilization**: 312 miles/vehicle (Target: 310) ✓ Exceeding
    - **Cost per Hour**: $47.20 (comparison metric for executive reporting)
    - **Cost per Day**: $234.00 (average daily fleet operating cost)

12. Accountant compares to prior year same period:
    - **October 2024 Cost per Mile**: $3.95
    - **October 2025 Cost per Mile**: $3.78
    - **Improvement**: $0.17/mile (4.3% reduction) ✓ Excellent trend

13. Accountant analyzes factors driving improvement:
    - Fleet age: Average 4.8 years (vs 5.2 years last October)
    - Mix: Fewer heavy trucks, more efficient vans
    - Maintenance: Improved preventive maintenance reducing breakdowns
    - Fuel prices: Slightly lower than prior year

14. Accountant generates executive summary report:

    **Executive Summary - Fleet Cost Performance**:
    - **Year-to-Date Cost per Mile**: $3.69
    - **Target**: $3.75
    - **Performance**: 1.6% favorable (Exceeding target)
    - **12-Month Trend**: Steady at target ($3.75 average)
    - **Year-over-Year**: 4.3% improvement vs Oct 2024
    - **Key Drivers**: Fleet modernization, improved maintenance, driver training
    - **Outlook**: On track to achieve annual $3.75/mile target
    - **Recommendations**:
      - Retire Vehicle #287 (outlier at $6.50/mile)
      - Continue current fleet maintenance strategy
      - Monitor fuel prices quarterly

15. Accountant exports reports:
    - PDF executive summary for Finance Director
    - Excel detailed report for Fleet Manager
    - CSV data for dashboard integration
    - All reports include charts and trend analyses

#### Alternative Flows:

**A1: Analyze Cost per Mile by Route or Customer**
- 3a. If cost analysis by operational segment is needed:
  - Northeast region routes: $3.62/mile (efficient)
  - Midwest routes: $3.85/mile (higher fuel costs)
  - Customer "ABC Corp" account: $3.71/mile
  - Accountant identifies regional cost variations
  - Routes inefficiency factors analyzed
  - Recommendations provided for regional optimization

**A2: Cost per Mile Benchmark Comparison**
- 4a. If comparing to other companies:
  - Accountant accesses industry benchmark database
  - Benchmarks by fleet size and vehicle type
  - Company performance: $3.78/mile
  - Industry peer: $3.85/mile (better than peers by 1.8%)
  - Top performer in industry: $3.55/mile
  - Gap to top performer: $0.23/mile (6%)
  - Analysis shows company is above average but not best-in-class

**A3: What-If Scenario Analysis**
- 2a. If accountant evaluates cost reduction initiatives:
  - Current state: $3.78/mile (50 vehicles)
  - Scenario 1: Replace 5 old vehicles with new efficient models
    - Estimated savings: $0.12/mile
    - New cost: $3.66/mile (2.9% reduction)
  - Scenario 2: Implement fuel efficiency training program
    - Estimated savings: $0.08/mile
    - New cost: $3.70/mile (1.9% reduction)
  - Scenario 3: Both initiatives combined
    - Estimated savings: $0.19/mile
    - New cost: $3.59/mile (4.8% reduction)
  - Finance Director evaluates which initiatives to pursue

#### Exception Flows:

**E1: Mileage Data Incomplete or Missing**
- If odometer readings are missing:
  - 5 vehicles have missing October mileage data
  - System displays warning: "⚠ Mileage data incomplete (90% complete)"
  - Accountant estimates missing mileage from:
    - Historical average monthly mileage
    - Fuel consumption (gallons ÷ historical MPG)
    - Telematics data (GPS distance traveled)
  - Estimated mileage included with notation "Estimated"
  - Report clearly indicates data completeness: "90% actual, 10% estimated"
  - Fleet Manager requested to provide missing odometer readings

**E2: Cost Allocation to Wrong Vehicle**
- If transaction incorrectly assigned:
  - Maintenance charge allocated to Vehicle #412 but should be #421
  - System calculates incorrect cost per mile for both vehicles
  - Accountant discovers discrepancy during review
  - Corrects allocation: Charge moved to correct vehicle
  - Cost per mile recalculated for both vehicles
  - Report regenerated with correct allocations

**E3: KPI Threshold Significantly Exceeded**
- If performance degrades sharply:
  - Cost per mile spikes to $4.50/mile (20% worse than target)
  - System triggers alert: "⚠ Cost per mile 20% above target"
  - Accountant investigates root cause:
    - Fuel prices spike nationwide
    - Multiple vehicle breakdowns creating repair costs
    - Route inefficiency due to hiring temporary drivers
  - Accountant documents reasons
  - Escalates to Fleet Manager for corrective action
  - Projects recovery timeline based on interventions

#### Postconditions:
- Cost per mile metrics are calculated and analyzed
- Performance is compared to targets and benchmarks
- Trends are identified and documented
- Executive summary is provided for decision-making
- Reports are archived for historical tracking

#### Business Rules:
- BR-AC-072: Cost per mile calculated monthly by vehicle type and fleet
- BR-AC-073: Cost per mile includes all operating costs (fuel, maintenance, tires, insurance)
- BR-AC-074: Cost per mile excludes depreciation (non-cash accounting entry)
- BR-AC-075: Mileage data must be 95%+ complete for accurate reporting
- BR-AC-076: Cost per mile targets must align with annual budget
- BR-AC-077: KPI reports generated automatically at month-end
- BR-AC-078: Year-over-year comparisons require same period basis (Apr 2025 vs Apr 2024)

#### Related User Stories:
- US-AC-004: Cost Center Reporting
- US-AC-006: Total Cost of Ownership (TCO) Analysis

---

## Summary

### Use Case Statistics:
- **Total Use Cases**: 11
- **High Priority**: 6 use cases
- **Medium Priority**: 5 use cases

### Epic Distribution:
1. **Invoice Processing and Approval**: 2 use cases
2. **Fuel Cost Analysis**: 1 use case
3. **Depreciation and Asset Tracking**: 2 use cases
4. **Budget Management and Variance Analysis**: 2 use cases
5. **Tax Reporting and Compliance**: 2 use cases
6. **Vendor Payment Management**: 2 use cases

### Key Integration Points:
- **Accounting Systems**: QuickBooks Online/Desktop, SAP, NetSuite, Microsoft Dynamics
- **Banking**: ACH file processing, check printing, bank reconciliation
- **Document Processing**: OCR (Azure Form Recognizer, AWS Textract), EDI (X12/810)
- **Fuel Card Providers**: WEX, Voyager, Comdata
- **Telematics**: GPS mileage data, vehicle diagnostics
- **Tax Services**: IFTA filing systems, IRS e-filing services
- **Reporting**: Real-time dashboard, PDF/Excel export, email notifications

### Accountant-Specific Capabilities:
- **Invoice OCR and 3-way matching** for automated vendor invoice processing
- **Multi-level approval workflows** with SLA tracking and escalation
- **Fuel reconciliation** with fraud detection and anomaly analysis
- **Fixed asset depreciation** with multiple methods (straight-line, declining balance, MACRS)
- **Total cost of ownership (TCO)** analysis for fleet replacement decisions
- **Budget management** with monthly variance analysis and forecasting
- **IFTA tax reporting** with quarterly compliance and payment tracking
- **Tax exemption management** with certificate tracking and compliance
- **Payment batch processing** with early payment discount optimization
- **Cost per mile KPI tracking** with benchmarking and trend analysis

---

## Related Documents

- **User Stories**: `user-stories/06_ACCOUNTANT_USER_STORIES.md`
- **Test Cases**: `test-cases/06_ACCOUNTANT_TEST_CASES.md` (to be created)
- **Workflows**: `workflows/06_ACCOUNTANT_WORKFLOWS.md` (to be created)
- **Data Model**: `data-model/FINANCIAL_SCHEMA.md` (to be created)
- **API Specifications**: `api/accountant-endpoints.md` (to be created)

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-11 | Requirements Team | Initial accountant use cases created |

---

*This document provides detailed use case scenarios supporting the Accountant/Finance Manager user stories and financial management workflows.*
