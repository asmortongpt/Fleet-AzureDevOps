# Accountant / Finance Manager - Workflows

**Role**: Accountant / Finance Manager
**Access Level**: Financial (Read-only operations, full financial data)
**Primary Interface**: Web Dashboard
**Version**: 1.0
**Date**: November 11, 2025

---

## Table of Contents
1. [Invoice Processing Workflows](#invoice-processing-workflows)
2. [Approval Workflows](#approval-workflows)
3. [Fuel Reconciliation Workflows](#fuel-reconciliation-workflows)
4. [Budget Management Workflows](#budget-management-workflows)
5. [Depreciation Workflows](#depreciation-workflows)
6. [IFTA Reporting Workflows](#ifta-reporting-workflows)

---

## Invoice Processing Workflows

### WF-AC-001: Vendor Invoice Reception and OCR Extraction

**Workflow ID**: WF-AC-001
**Name**: Vendor Invoice Reception and OCR Extraction
**Priority**: High
**Frequency**: Daily (Event-driven)

#### Trigger:
- Invoice received via email from vendor
- Invoice manually uploaded by accountant
- Batch invoice import file processed
- EDI (X12/835) invoice received

#### Actors:
- **Primary**: Accountant
- **Secondary**: Vendor, Email System, OCR Service, Document Storage

#### Steps:
1. Invoice receipt detected (email, upload, EDI, or batch)
2. System routes to document processing queue
3. Invoice file extracted and stored in document repository
4. OCR/AI service analyzes invoice image/PDF
5. System extracts key data fields:
   - Vendor name and ID
   - Invoice number
   - Invoice date
   - Invoice amount (total)
   - Line items (descriptions, quantities, unit prices)
   - PO reference numbers
   - Tax amount
   - Payment terms
6. System performs data quality validation:
   - Required fields present
   - Amount calculations correct
   - Date format valid
   - OCR confidence score >85%
7. Extracted data presented to accountant for review
8. Accountant confirms or corrects extracted data
9. Invoice record created in accounting system

#### Decision Points:
- **Is invoice EDI-formatted?**
  - Yes: Skip OCR, parse structured EDI data directly → Proceed to Step 6
  - No: Continue with OCR processing → Step 3
- **Does OCR confidence exceed 85%?**
  - Yes: Present for accountant review → Step 7
  - No: Request manual data entry → Exception Flow E1
- **Are required fields complete?**
  - Yes: Create invoice record → Step 9
  - No: Return to accountant for completion → Accountant corrects

#### System Actions:
- Email integration: Detect and extract invoice attachments from inbox
- OCR Processing: Azure Form Recognizer or AWS Textract
- Data Validation: Rules engine validates extracted fields
- Duplicate Detection: Check for duplicate invoice numbers (same vendor, 30-day window)
- Storage: Save original invoice image + extracted data + OCR confidence score
- Logging: Complete audit trail (receipt time, processing time, user actions)

#### Notifications:
- **To Accountant**: Email with extracted data summary for review (if manual verification needed)
- **To Vendor**: (Optional) Confirmation that invoice received and processing
- **To Finance Team**: Daily digest of processed invoices (summary count)

#### Expected Output:
- Invoice record with complete extracted data
- High-quality invoice image stored for 7-year retention
- OCR extraction confidence scores recorded
- Duplicate flag if similar invoice detected

#### SLA:
- Invoice processing time: <2 hours from receipt
- OCR extraction accuracy: >95%
- Data available for matching: Same business day

---

### WF-AC-002: Invoice 3-Way Matching and Validation

**Workflow ID**: WF-AC-002
**Name**: Invoice 3-Way Matching and Validation
**Priority**: High
**Frequency**: Daily (Event-driven)

#### Trigger:
- Invoice record created in accounting system
- Accountant manually initiates matching process
- Batch matching job runs daily

#### Actors:
- **Primary**: Accountant
- **Secondary**: Purchase Order System, Receiving System, Vendor Master, GL System

#### Steps:
1. Invoice extracted and ready for matching
2. System queries Purchase Order (PO) database
3. Attempt to match PO by:
   - Vendor ID (exact match)
   - Invoice amount within tolerance (±5%)
   - Line item quantities/descriptions
4. If PO found: Retrieve PO amount, terms, and cost allocation
5. System queries Receiving/Goods Receipt database
6. Attempt to match Receipt by:
   - Same PO number
   - Receipt date ≤ Invoice date
   - Quantity received matches PO
7. System performs 3-way comparison:
   - **PO Amount** vs **Receipt Amount** vs **Invoice Amount**
8. Calculate variances:
   - PO-to-Receipt variance
   - PO-to-Invoice variance
   - Receipt-to-Invoice variance
9. Evaluate variance tolerance rules:
   - <2% variance: Auto-match successful
   - 2-5% variance: Flag for review
   - >5% variance: Requires investigation
10. System displays matching results to accountant
11. Accountant reviews exceptions and variances
12. Accountant approves match or investigates discrepancy
13. Match record created linking PO → Receipt → Invoice

#### Decision Points:
- **Is exact PO match found?**
  - Yes: Retrieve PO details → Step 4
  - No: Mark as non-PO invoice → Alternative Flow A1
- **Is Receipt match found?**
  - Yes: Proceed with 3-way match → Step 7
  - No: 2-way match (PO vs Invoice) → Alternative Flow A2
- **Are variances within tolerance?**
  - <2%: Auto-match → Step 12
  - 2-5%: Flag for review → Accountant investigates
  - >5%: Require investigation → Exception Flow E1
- **Is vendor on approved list?**
  - Yes: Proceed with coding → Next Workflow
  - No: Exception Flow E2

#### System Actions:
- PO Lookup: Query PO system with vendor ID, amount range, line item matching
- Receiving Lookup: Query goods receipt database
- Variance Calculation: (Invoice - PO) / PO * 100
- Tolerance Rules: Applied based on category (maintenance vs fuel vs parts)
- Unmatched Tracking: Flag invoices without PO for investigation
- Alerts: Notify accountant of significant variances requiring review

#### Notifications:
- **To Accountant**: Summary of matched/unmatched invoices (email or dashboard alert)
- **To Procurement**: If missing PO or high variance detected (for process improvement)
- **To AP Manager**: Daily summary of matching exceptions

#### Expected Output:
- 3-way match validation result (success/failure/review)
- Variance amounts and percentages documented
- Match exception log for audit trail
- Approved/rejected match status

#### SLA:
- 3-way matching: <4 hours
- Manual variance investigation: <24 hours
- Match approval: <1 business day

---

### WF-AC-003: Invoice GL Coding and Cost Center Allocation

**Workflow ID**: WF-AC-003
**Name**: Invoice GL Coding and Cost Center Allocation
**Priority**: High
**Frequency**: Daily (Event-driven)

#### Trigger:
- Invoice passed 3-way matching (or non-PO invoice approved)
- Accountant initiates GL coding process
- Batch auto-coding job runs for simple invoices

#### Actors:
- **Primary**: Accountant
- **Secondary**: Chart of Accounts Master, Cost Center Master, Vehicle Master, GL System

#### Steps:
1. Invoice record opened for GL coding
2. System retrieves Chart of Accounts (COA) master
3. System identifies applicable GL accounts based on:
   - Expense category (fuel, maintenance, parts, insurance, etc.)
   - PO coding (if matched)
   - Invoice description/keywords
4. System suggests primary GL account with confidence score
5. Accountant reviews suggested account
6. Accountant selects appropriate GL account(s):
   - Single account: Simple invoice (e.g., fuel card charges)
   - Multiple accounts: Split invoice (e.g., parts + labor)
7. Accountant allocates amount to GL account(s)
8. System retrieves Cost Center Master
9. Accountant assigns cost center:
   - By vehicle (if vehicle-specific expense)
   - By department/location (if shared services)
   - By project (if capital project work)
10. For split allocations:
    - Line 1: Amount + GL Account + Cost Center
    - Line 2: Amount + GL Account + Cost Center
    - Verify total = Invoice total
11. System validates GL coding:
    - GL account exists in COA ✓
    - GL account active and not locked ✓
    - Cost center valid and available ✓
    - Total amount matches invoice ✓
    - Mandatory fields completed ✓
12. Accountant adds notes/comments for approval trail
13. Accountant marks invoice as "Coded" status
14. Invoice ready for approval workflow

#### Decision Points:
- **Is invoice single-expense or split allocation?**
  - Single: Assign one GL account + cost center → Step 6
  - Split: Allocate multiple GL accounts/cost centers → Step 10
- **Is GL account suggestion >85% confidence?**
  - Yes: Accept suggestion → Step 7
  - No: Accountant manually selects → Step 6
- **Are GL coding rules satisfied?**
  - Yes: Proceed to approval → Step 14
  - No: Return for correction → Accountant corrects
- **Is cost center valid for vehicle/department?**
  - Yes: Accept allocation → Step 13
  - No: Select alternative cost center → Validation fails

#### System Actions:
- GL Suggestion Engine: ML-based recommendation based on vendor, description, amount
- GL Validation: Rules engine checks account validity, active status, coding rules
- Cost Center Lookup: Retrieve valid cost centers, vehicle assignments
- Budget Check: Verify cost center budget availability (warning if approaching limit)
- Auto-Coding: For routine categories (fuel, tire changes), suggest GL + cost center
- Audit Trail: Record all GL coding changes with timestamp and user
- Allocation Balancing: Verify split allocations sum to invoice total

#### Notifications:
- **To Accountant**: Suggested GL coding with confidence score
- **To AP Manager**: Daily GL coding summary for review
- **To Accounting Partner**: If GL account is archived or deprecated (flag for review)

#### Expected Output:
- Invoice GL-coded with primary and secondary accounts (if split)
- Cost center allocation documented
- Accounting treatment notes recorded
- Invoice status changed to "Coded and Ready for Approval"

#### SLA:
- GL coding completion: <4 hours
- Batch auto-coding (simple invoices): <1 hour
- Manual coding complexity issues: <24 hours

---

## Approval Workflows

### WF-AC-004: Multi-Level Invoice Approval Routing

**Workflow ID**: WF-AC-004
**Name**: Multi-Level Invoice Approval Routing
**Priority**: High
**Frequency**: Daily (Event-driven)

#### Trigger:
- Accountant submits invoice for approval
- Invoice amount/category changes, re-routing required
- Scheduled escalation timer expires (SLA not met)

#### Actors:
- **Primary**: Accountant, Approvers (Manager, Director, VP Finance)
- **Secondary**: Workflow Engine, Notification Service, Audit System

#### Steps:
1. Accountant submits coded invoice for approval
2. System calculates approval level required:
   - Amount threshold analysis
   - Category/type analysis (maintenance, fuel, capital, etc.)
   - Approval rules evaluation
3. System determines approval chain:
   - <$1,000: Manager approval only
   - $1,000-$5,000: Manager → Director approval
   - >$5,000: Manager → Director → VP Finance approval
4. System identifies assigned approver for first level:
   - Default: Manager of cost center or department
   - Alternative: Team lead or supervisor
   - Backup: Next-level manager if primary unavailable
5. System checks for approval conflicts:
   - Is approver the vendor? → Route to next level
   - Is approver the cost center owner? → Verify no conflict
   - Does approver have access to cost center? → Verify authority
6. System sends first-level approval notification:
   - Email with invoice summary and approval link
   - In-app notification with invoice details
   - Action buttons: Approve / Request Info / Reject
7. Approver receives email at ~8:00 AM
8. Approver reviews invoice details:
   - Vendor name and trustworthiness
   - Invoice amount reasonableness
   - GL coding appropriateness
   - Receipt/PO match
   - Cost center owner approval (if delegated)
9. Approver clicks "Approve" button
10. System records approval:
    - Approver name and email
    - Approval timestamp (date/time)
    - Decision: Approved
    - Comments (optional): Free-text notes
11. If multi-level approval required:
    - System automatically routes to next-level approver
    - New approval notification sent
    - Repeat Steps 7-10 for each level
12. Final approver completes last approval
13. System updates invoice status to "Fully Approved"
14. Invoice eligible for payment processing
15. System sends confirmation to accountant
16. Accounting system updated for payment batch

#### Decision Points:
- **What is invoice amount and category?**
  - Determine approval threshold → Route to appropriate level(s)
- **Is primary approver available?**
  - Yes: Send to primary → Step 6
  - No: Route to backup/next-level → Alternative Flow A1
- **Does approver approve invoice?**
  - Approve: Record approval → Continue to next level (if needed)
  - Request Info: Send query to accountant → Alternative Flow A2
  - Reject: Return to accountant → Alternative Flow A3
- **Is this the final approval level?**
  - Yes: Update status to "Fully Approved" → Step 14
  - No: Route to next-level approver → Step 11
- **Has approval SLA been exceeded?**
  - No: Continue normal process → Step 8
  - Yes: Trigger escalation → Alternative Flow A4

#### System Actions:
- Approval Rules Engine: Evaluate amount thresholds and approval hierarchy
- Approver Assignment: Match invoice to responsible manager/director/VP
- Conflict Detection: Identify and resolve conflicts of interest
- Notification Queue: Send email and in-app notifications with invoice details
- Approval Tracking: Record all approval actions with timestamp and user identity
- Escalation Timer: 24-hour SLA per approval level, auto-escalate if exceeded
- Status Updates: Invoice status changes through workflow states
- Audit Log: Complete audit trail for compliance and forensics

#### Notifications:
- **To Approvers**: Email with invoice details and approval deadline
  - Subject: "Invoice Approval Required: [Vendor] - $[Amount]"
  - Body: Invoice amount, GL coding, PO match, attached invoice image
  - Action: Clickable approval link to approval page
  - Escalation: Reminder at 12 hours, 18 hours, 24 hours if not approved
- **To Next-Level Approver**: When first level approved (if multi-level)
  - Subject: "Secondary Approval Required: [Vendor] - $[Amount]"
- **To Accountant**: When approval workflow completes
  - Subject: "Invoice [Number] Approved - Ready for Payment"
- **To Finance Manager**: Daily summary of pending approvals by approver

#### Expected Output:
- Invoice approval status: "Fully Approved"
- Complete approval audit trail (all approvers, timestamps, comments)
- Invoice eligible for payment batch processing
- Approval metrics tracked for SLA reporting

#### SLA:
- First-level approval: <24 business hours
- Multi-level approval total time: <48 business hours
- Escalation if no action: >24 hours triggers escalation to next level
- Final approval to payment: <5 business days

---

### WF-AC-005: Invoice Rejection and Correction Workflow

**Workflow ID**: WF-AC-005
**Name**: Invoice Rejection and Correction Workflow
**Priority**: High
**Frequency**: As needed (event-driven)

#### Trigger:
- Approver clicks "Reject" on invoice
- Accountant identifies error/discrepancy during submission
- System detects policy violation or exception

#### Actors:
- **Primary**: Accountant, Approver
- **Secondary**: Vendor (for clarification), Procurement (for PO issues)

#### Steps:
1. Approver or system identifies issue with invoice
2. Rejection reason provided:
   - Wrong GL account (approver corrects)
   - Price variance too high (requires investigation)
   - Missing supporting documentation
   - Policy violation (personal expense charged, etc.)
   - Duplicate invoice (already paid)
3. Detailed rejection comments sent to accountant
4. Invoice status changed to "Rejected"
5. System sends notification to accountant with rejection reason
6. Accountant reviews rejection and decides action:
   - Correct coding and resubmit
   - Contact vendor for clarification
   - Obtain supporting documentation
   - Dispute if approver incorrect
7. Accountant takes corrective action:
   - Recodes invoice to different GL accounts
   - Obtains vendor credit memo for overage
   - Requests PO amendment if needed
   - Adds missing documentation
8. Accountant resubmits corrected invoice
9. System re-routes to original approver or new approver (if conditions changed)
10. Approver reviews corrected invoice
11. If satisfied, approver approves corrected invoice
12. If still issues, repeat rejection/correction cycle
13. Once approved, invoice continues to payment processing

#### Decision Points:
- **Can accountant correct issue immediately?**
  - Yes: Correct and resubmit → Step 8
  - No: Contact vendor or procurement → Contact and wait for response
- **Is issue approver error or invoice error?**
  - Invoice error: Accountant corrects → Resubmit
  - Approver error: Dispute with supervisor → Alternative Flow A1
- **Is issue material or minor?**
  - Minor (GL account mismatch): Accountant corrects and resubmits
  - Material (price variance): Requires investigation and approval

#### System Actions:
- Rejection Tracking: Record all rejections with reason and timestamp
- Status Management: Update invoice to "Rejected" status
- Resubmission Queue: Re-route corrected invoices through approval workflow
- Document Management: Track all versions of invoice (original + corrected)
- Audit Trail: Maintain complete history of rejection/correction cycles
- Escalation: If >3 rejection cycles, escalate to management

#### Notifications:
- **To Accountant**: Email with rejection reason and approver comments
- **To Approver**: Email confirming rejection recorded
- **To Finance Manager**: Alert if invoice rejected multiple times
- **To Vendor**: (Optional) Notification if vendor action required

#### Expected Output:
- Rejected invoice record marked with reason
- Corrected invoice version with audit trail
- Complete rejection/correction history documented
- Invoice approved and ready for payment (after corrections)

#### SLA:
- Rejection notification to accountant: <2 hours
- Accountant corrective action: <24 hours
- Corrected invoice resubmission: <48 hours
- Approval of corrected invoice: <24 hours

---

## Fuel Reconciliation Workflows

### WF-AC-006: Monthly Fuel Card Transaction Reconciliation

**Workflow ID**: WF-AC-006
**Name**: Monthly Fuel Card Transaction Reconciliation
**Priority**: High
**Frequency**: Monthly (Last business day of month)

#### Trigger:
- Monthly fuel reconciliation process initiated
- Accountant manually starts fuel reconciliation
- Scheduled job runs on 28th of each month
- Fuel card provider data received and ready for import

#### Actors:
- **Primary**: Accountant
- **Secondary**: Fuel Card Provider (WEX, Voyager, Comdata), Telematics System, Driver Records, GL System

#### Steps:
1. Fuel reconciliation initiated by accountant or scheduled job
2. System imports fuel card transaction file from provider:
   - File format: CSV, XML, or API feed
   - Data includes: Date, time, amount, pump location, card number
   - Vehicle assigned to card via fuel card provider master
3. System retrieves driver-reported fuel entries for period:
   - From fleet management system or mobile app
   - Data includes: Vehicle, date, location, gallons, amount, driver name
4. System prepares for matching:
   - Card transactions: 847 total for month
   - Driver entries: 812 expected
5. System auto-matches transactions using criteria:
   - Vehicle number (exact match from card-to-vehicle mapping)
   - Date within ±2 hours (account for time zone differences)
   - Amount within ±$5.00 (account for rounding)
   - Location (optional: verify within 50 miles of expected route)
6. System generates match results:
   - Matched: 812 transactions (95.9%)
   - Unmatched: 35 transactions (4.1%)
7. Accountant reviews matched transactions summary:
   - Total fuel gallons: 8,247
   - Total fuel cost: $31,247.50
   - Average cost/gallon: $3.79
   - Average MPG: 18.96
8. Accountant investigates unmatched transactions:
   - Card charge but no driver entry (35 transactions)
   - Possible reasons:
     - Driver forgot to log (most common)
     - Personal vehicle charged to fleet card
     - Card used for non-fuel (restaurant, tolls, carwash)
     - System lag (entry will arrive next day)
9. Accountant contacts driver for clarification:
   - "Did you fuel Vehicle #287 on Oct 15 at 1:47 PM?"
   - Driver confirms: "Yes, at TA truck stop"
   - Accountant creates missing driver entry
10. Accountant investigates mismatched amounts:
    - Driver entry shows 75 gallons @ $0.90/gal but charge is $67.50
    - Calculation: 75 × $0.90 = $67.50 (matches)
    - But typical fuel: ~$1.80-$3.80/gal
    - Issue: Driver entered wrong quantity
    - Accountant corrects driver entry to 37.5 gallons
11. System re-matches with corrections:
    - Matched: 835 transactions (98.6%)
    - Unmatched: 12 transactions (1.4%)
12. Accountant reviews remaining unmatched:
    - Personal vehicle charges (8 transactions): Exclude
    - Rental vehicle charges (2): Exclude
    - Non-fuel charges (2 carwashes): Exclude
13. Accountant marks 12 as "Non-Fleet - Exclude"
14. System recalculates final reconciliation:
    - Fleet fuel transactions: 835 / 835 (100% match)
    - Variance: <0.1% (well within tolerance)
15. System analyzes fuel performance metrics:
    - Cost per mile: $0.20 (vs $0.19 budget)
    - Cost per gallon trend: $3.79 (up from $3.65 early October)
    - MPG trend: 18.96 (vs 18.5 target) - Good
16. System checks for fraud/anomalies:
    - High-cost outliers: 2 transactions >$300 (legitimate bulk stops)
    - Duplicate charges: None
    - Geographic anomalies: None
    - Pricing outliers: None
17. Accountant exports reconciliation report:
    - CSV with all transactions
    - Summary metrics
    - Fraud detection results
    - Exception log
18. System generates GL entries:
    - Debit: Account 61-5100 (Fuel Expense) $31,247.50
    - Credit: Account 20-1050 (Fuel Card Payable) $31,247.50
19. Accountant approves reconciliation
20. GL entries post to financial system
21. Monthly fuel reconciliation complete

#### Decision Points:
- **Is transaction match rate >95%?**
  - Yes: Proceed to anomaly checking → Step 16
  - No: Alert accountant to investigate root cause → Alternative Flow A1
- **Are unmatched transactions reconciled?**
  - Yes: All unmatched reviewed and categorized → Step 13
  - No: Keep "Pending" for next cycle → Alternative Flow A2
- **Is variance within tolerance (<1%)?**
  - Yes: Approve reconciliation → Step 20
  - No: Investigate and correct → Exception Flow E1
- **Are fraud/anomalies detected?**
  - Yes: Investigate and document → Accountant reviews
  - No: Proceed to GL posting → Step 19

#### System Actions:
- Fuel Card Import: Parse CSV/XML files from provider, validate data format
- Transaction Matching: Fuzzy matching algorithm on vehicle + timestamp + amount
- Unmatched Tracking: Flag transactions not matched, categorize reason
- Fraud Detection: ML-based detection of duplicate charges, unusual locations, pricing outliers
- Performance Metrics: Calculate cost/mile, cost/gallon, MPG, fuel price trends
- GL Integration: Generate and post journal entries to GL
- Report Generation: Export reconciliation data in multiple formats
- Archive: Store reconciliation data for audit and regulatory compliance

#### Notifications:
- **To Accountant**: Daily fuel reconciliation alert (if >100 unmatched transactions)
- **To Accountant**: Monthly summary report for review/approval
- **To Finance Manager**: Monthly fuel performance metrics and variances
- **To Fleet Manager**: Any MPG anomalies or cost increases detected
- **To Driver**: (Optional) Alert if personal vehicle charge detected

#### Expected Output:
- Monthly fuel reconciliation report (matched/unmatched/excluded)
- Fuel performance metrics (cost/mile, MPG, cost trends)
- GL journal entries for fuel expense posting
- Fraud/anomaly investigation log
- Reconciliation archive for audit trail

#### SLA:
- Fuel card data import: Within 5 business days of month-end
- Initial matching: <1 business day
- Unmatched investigation: <3 business days
- Final reconciliation approval: <5 business days of month-end
- GL posting: <10 business days of month-end

---

### WF-AC-007: Fuel Price Variance and Anomaly Investigation

**Workflow ID**: WF-AC-007
**Name**: Fuel Price Variance and Anomaly Investigation
**Priority**: Medium
**Frequency**: Monthly (as-needed)

#### Trigger:
- Fuel reconciliation detects price variance >10%
- Fraud detection algorithm flags suspicious transaction
- Accountant manually reviews anomaly report
- Duplicate charge detected

#### Actors:
- **Primary**: Accountant
- **Secondary**: Fuel Card Provider, Fleet Manager, Driver, Finance Manager

#### Steps:
1. System detects anomaly during fuel reconciliation
2. Anomaly flagged for review:
   - Type: Price variance, duplicate, location, frequency
   - Details: Transaction amount, location, vehicle, date/time
3. Examples of anomalies:
   - **Price Spike**: $7.50/gallon (vs average $3.79) at "Nowhere Station, AK"
   - **Duplicate**: Two identical $67.80 charges on 10/15 at 1:47 PM and 1:50 PM
   - **Non-Fuel**: Charge at "Tony's Italian Restaurant" coded as fuel
   - **Unusual Volume**: 400 gallons at 1 location (vs typical 40-50)
4. Accountant reviews anomaly details:
   - Transaction amount and date/time
   - Vehicle and driver
   - Location (geographic coordinates)
   - Card number
   - Merchant category/description
5. Accountant investigates based on anomaly type:
   - **Price Spike Investigation**: Verify location justifies premium (remote area)
   - **Duplicate Investigation**: Contact card provider to identify card reader error
   - **Non-Fuel Investigation**: Verify merchant coding and determine if valid
   - **Volume Investigation**: Confirm if bulk fuel or tank refill legitimacy
6. For price spike anomaly:
   - Location: Nowhere Station, AK
   - Rationale: Alaska fuel prices 50-100% higher than continental US
   - Legitimate explanation: Vehicle traveling through Alaska
   - Action: Approve transaction as normal
7. For duplicate charge anomaly:
   - Card charged twice at same pump in 3-minute window
   - Contact WEX: "Card reader malfunction caused duplicate charge"
   - WEX confirms and disputes one charge
   - Credit applied to next statement
   - Corrected entry marked as "Duplicate - Excluded"
8. For non-fuel charge (restaurant):
   - Charge: Vehicle #412 at "Tony's Italian Place" for $87.95
   - Investigation: Vehicle is commercial truck, shouldn't be at restaurant
   - Driver denies eating at restaurant
   - Action: Report as fraud to WEX
   - WEX disputes charge and issues credit
   - Card reissued to prevent future fraud
9. Accountant documents investigation:
   - Anomaly type and details
   - Investigation performed
   - Resolution and action taken
   - Evidence (provider confirmation, driver statement, etc.)
10. Accountant updates transaction status:
    - Approved: If legitimate
    - Excluded: If non-fleet or erroneous
    - Disputed: If fraudulent (in dispute resolution)
11. Accountant updates reconciliation:
    - Remove excluded transactions
    - Recalculate variance and metrics
    - Update GL entries if amounts changed
12. Investigation log archived with reconciliation

#### Decision Points:
- **What is anomaly type?**
  - Price: Location verification → Approve/investigate
  - Duplicate: Card provider investigation → Dispute if confirmed
  - Non-Fuel: Category verification → Fraud alert if confirmed
  - Volume: Legitimacy check → Approve or investigate
- **Is explanation reasonable and documented?**
  - Yes: Approve and continue reconciliation
  - No: Escalate to Finance Manager → Alternative Flow A1
- **Is fraud suspected?**
  - Yes: Report to WEX and law enforcement → Exception Flow E1
  - No: Handle as data error → Correction and exclusion

#### System Actions:
- Anomaly Detection: ML algorithm identifies price outliers, duplicates, and category mismatches
- Alerting: Flag anomalies for accountant review
- Transaction Isolation: Pull transaction details including image/receipt
- Correlation Analysis: Identify related transactions (same card, location, timeframe)
- Fraud Scoring: Calculate fraud likelihood based on multiple factors
- Provider Integration: Send disputes to card provider system
- Exclusion Management: Track excluded transactions separately
- Trend Analysis: Monitor fuel prices by location and time period

#### Notifications:
- **To Accountant**: Alert when anomaly detected (email + dashboard)
- **To Fuel Card Provider**: Dispute notification for confirmed fraud
- **To Fleet Manager**: Alert if vehicle/driver pattern shows issues
- **To Finance Manager**: Summary of anomalies and frauds detected
- **To Law Enforcement**: If significant fraud detected (>$10K)

#### Expected Output:
- Anomaly investigation log with findings and resolution
- Excluded/disputed transactions recorded
- Corrected reconciliation totals
- Fraud alert documentation (if applicable)
- GL entries adjusted for corrections

#### SLA:
- Anomaly detection: Real-time
- Initial investigation: <24 hours
- Provider response: <5 business days
- Resolution: <10 business days
- GL adjustment: <15 business days

---

## Budget Management Workflows

### WF-AC-008: Annual Budget Planning and Approval

**Workflow ID**: WF-AC-008
**Name**: Annual Budget Planning and Approval
**Priority**: High
**Frequency**: Annual (Typically Q3 for next fiscal year)

#### Trigger:
- Fiscal year planning cycle begins
- Budget submission deadline approaches
- Accountant initiates new budget creation
- Prior year budget template selected for update

#### Actors:
- **Primary**: Accountant
- **Secondary**: Finance Manager, Department Heads, CFO, Historical Data System, GL System

#### Steps:
1. Budget planning cycle initiated (typically July for January FY)
2. System retrieves prior year actual expenses by category:
   - Fuel: $245,000
   - Maintenance: $180,000
   - Parts: $95,000
   - Insurance: $156,000
   - Depreciation: $425,000
   - Total: $1,101,000
3. Accountant creates new annual budget:
   - Selects "Copy Prior Year + 5% Growth" template
   - Or creates from scratch with current projections
4. Accountant enters budget by category:
   - **Category**: Fuel
     - Prior Year Actual: $245,000
     - Proposed Budget: $257,250 (5% increase)
   - **Category**: Maintenance
     - Prior Year Actual: $180,000
     - Proposed Budget: $189,000 (5% increase)
   - **Category**: Parts
     - Prior Year Actual: $95,000
     - Proposed Budget: $100,000 (5% increase)
   - **Category**: Insurance
     - Prior Year Actual: $156,000
     - Proposed Budget: $156,000 (0% - fixed rate)
   - **Category**: Depreciation
     - Prior Year Actual: $425,000
     - Proposed Budget: $430,000 (new vehicle depreciation)
5. Accountant allocates budget monthly to account for seasonality:
   - **Fuel**: Higher in winter (more heating/congestion), lower in summer
   - **Maintenance**: Quarterly spike (inspection cycles)
   - **Parts**: As-needed, relatively flat
   - **Insurance**: Monthly allocation (fixed payment)
   - **Depreciation**: Monthly allocation (fixed)
6. Accountant allocates budget by cost center:
   - Sales Fleet: $550,000 (50%)
   - Operations Fleet: $330,000 (30%)
   - Equipment: $220,000 (20%)
7. Accountant creates budget scenarios:
   - **Conservative**: 10% reduction (lower activity or efficiency gains)
   - **Expected**: 5% increase (most likely scenario)
   - **Aggressive**: 15% increase (high growth or inflation)
8. System validates budget against guidelines:
   - Total budget within company cap? ✓
   - No category >50% variance from prior year? ✓
   - All cost centers represented? ✓
9. Accountant reviews budget summary:
   - Total Budget: $1,158,500 (5.2% increase)
   - Variance from prior year: +$57,500
   - Cost center allocation: Verified
   - Monthly distribution: Reviewed
10. Accountant submits budget for approval workflow:
    - Changes status to "Submitted"
    - Adds notes: "Includes new vehicle depreciation and inflation adjustment"
11. System routes budget to Finance Manager for review
12. Finance Manager reviews budget:
    - Compares to company strategic plan
    - Checks alignment with prior guidance
    - Verifies cost center allocations
13. Finance Manager approves or requests changes:
    - "Approved with note: Monitor fuel prices quarterly"
14. System routes to CFO for final approval
15. CFO approves budget:
    - Final authority on overall spending
    - Can override category amounts
16. System activates approved budget:
    - Budget status: "Approved - Active"
    - Budget locked for modifications
    - Available for variance reporting
17. System notifies accountant and finance team:
    - Budget approved and activated
    - Ready for monthly tracking
    - Variance thresholds set at ±10%
18. Archive prior budget version and maintain history

#### Decision Points:
- **Is budget within company guidelines?**
  - Yes: Proceed to approval workflow → Step 11
  - No: Return to accountant for revision → Step 3
- **Is budget approval delegated or escalated?**
  - Normal: Manager → CFO approval
  - Significant variance: Add CEO approval → Alternative Flow A1
- **Are any cost centers flagged for high variance?**
  - Yes: Require director approval for that cost center
  - No: Standard approval → Step 11
- **Is new capital approved?**
  - Yes: Include depreciation impact
  - No: Use historical depreciation

#### System Actions:
- Historical Data Retrieval: Pull prior year actual expenses by category and cost center
- Budget Template: Copy/adjust prior year or create from scratch
- Scenario Modeling: Create conservative/expected/aggressive scenarios
- Allocation Rules: Monthly distribution based on historical patterns
- Validation Rules: Check budget totals, variances, cost center coverage
- Approval Workflow: Route through management hierarchy
- Version Control: Track all budget versions with change history
- Locking: Prevent changes after approval (maintain integrity)
- Notifications: Alert stakeholders of approval milestones

#### Notifications:
- **To Accountant**: Budget submission deadline reminder (30 days prior)
- **To Finance Manager**: Budget submitted for review
- **To CFO**: Budget ready for final approval
- **To Department Heads**: Approved budget allocated to their cost centers
- **To Finance Team**: Annual budget activated, variance tracking begins

#### Expected Output:
- Approved annual budget by category and cost center
- Monthly budget allocation schedule
- Budget scenario analysis document
- Approval audit trail (who approved, when)
- Budget locking for fiscal year
- Variance thresholds established for monitoring

#### SLA:
- Budget planning period: July-August (2 months)
- Initial submission: August 31
- Approval workflow: <2 weeks
- Budget activation: September 15 (in time for Q4 start)
- Final approval: <30 days from submission

---

### WF-AC-009: Monthly Budget vs Actual Variance Analysis

**Workflow ID**: WF-AC-009
**Name**: Monthly Budget vs Actual Variance Analysis
**Priority**: High
**Frequency**: Monthly (5th business day of following month)

#### Trigger:
- Month-end close process completes
- Budget vs actual variance report runs
- Accountant initiates variance analysis
- Variance threshold exceeded automatically triggers alert

#### Actors:
- **Primary**: Accountant
- **Secondary**: Finance Manager, Department Heads, GL System, Transaction System

#### Steps:
1. Month-end close completed for October 2025
2. System consolidates actual expenditures by category:
   - Fuel: Actual $28,500 vs Budget $22,000 = +$6,500 (29.5% unfavorable)
   - Maintenance: Actual $16,200 vs Budget $15,700 = +$500 (3.2% unfavorable)
   - Parts: Actual $8,900 vs Budget $8,500 = +$400 (4.7% unfavorable)
   - Insurance: Actual $13,000 vs Budget $13,000 = $0 (0.0% - on budget)
   - Depreciation: Actual $35,800 vs Budget $35,800 = $0 (0.0% - on budget)
   - **Total**: Actual $102,400 vs Budget $95,000 = +$7,400 (7.8% unfavorable)
3. System calculates variances:
   - Dollar variance: Actual - Budget
   - Percentage variance: (Actual - Budget) / Budget × 100
   - Favorable (<0) or Unfavorable (>0)
4. System identifies categories exceeding variance thresholds:
   - Threshold: >10% triggers investigation
   - Fuel: 29.5% - FLAG (exceeds threshold)
   - Maintenance: 3.2% - OK
   - Parts: 4.7% - OK
5. Dashboard displays budget vs actual summary:
   - YTD cumulative variance
   - Month-over-month trend
   - Variances by category and cost center
6. Accountant investigates Fuel variance (highest):
   - Budget: $22,000 (October planning assumption)
   - Actual: $28,500 (recorded fuel charges)
   - Variance: +$6,500 (29.5% over)
   - Root causes to investigate:
     - Fuel price increased (market factor)
     - Increased miles driven (operational factor)
     - Fraud or unauthorized charges (control issue)
7. Accountant analyzes fuel consumption data:
   - Miles driven: 12,450 miles (vs 12,000 budget)
   - Average MPG: 18.95 mpg (vs 18.5 budget - good)
   - Fuel gallons: 657 gallons (vs 649 budget)
   - Fuel cost/gallon: $43.35 (vs $33.90 budget - HIGH)
8. Root cause identified: Fuel prices elevated in October
   - Budget price assumption: $3.39/gallon
   - Actual average price: $4.33/gallon
   - Variance: +$0.94/gallon (+27.7% price increase)
9. Accountant documents variance explanation:
   - "October fuel prices elevated due to global market conditions"
   - "Fuel gallons consistent with budget expectations"
   - "MPG trending favorably vs target"
   - "Variance due to external market factors, not operational issues"
10. Accountant forecasts year-end fuel spending:
    - Run-rate: Current monthly overage × remaining months
    - Year-end projection: $335,000 (vs $264,000 budget)
    - Full-year variance: +$71,000 (26.9% over)
11. Accountant adds corrective action note:
    - "Monitor fuel prices weekly"
    - "Consider fuel hedging strategy for Q4"
    - "Flag for management decision on budget revision"
12. Accountant prepares variance report:
    - Current month variance analysis
    - YTD cumulative variance and trend
    - Year-end forecast
    - Variance explanations by category
13. Accountant sends report to Finance Manager:
    - Highlights significant variances
    - Provides root cause analysis
    - Includes forecasts and recommendations
14. Finance Manager reviews variance report:
    - Concurs with fuel price analysis
    - Requests weekly fuel price monitoring
    - Decision: Continue monitoring (no budget revision needed)
15. System updates budget monitoring for November:
    - Establishes new fuel price assumption: $4.25/gallon
    - Monitors for further price movements
16. Accountant prepares management commentary:
    - For inclusion in monthly financial report
    - Explains significant variances
    - Provides outlook for remainder of year
17. Variance analysis archived for audit trail

#### Decision Points:
- **Is variance within acceptable threshold?**
  - Yes: Monitor and continue → No investigation needed
  - No: Investigate root cause → Accountant analysis
- **Is variance due to operational or external factors?**
  - Operational: Can be controlled → Recommend corrective action
  - External (market, weather): Cannot control → Update forecast
- **Does variance warrant budget revision?**
  - Yes: <3 months remaining, major variance → Request budget modification
  - No: Monitor and adjust next year → Continue with original budget
- **Is corrective action feasible?**
  - Yes: Implement immediately → Update operational targets
  - No: Update forecast and accept variance → Report to management

#### System Actions:
- Data Consolidation: Pull actual transactions from GL by category
- Variance Calculation: Compute dollar and percentage variances
- Threshold Monitoring: Alert on variances >10%
- Trend Analysis: Compare monthly variances over time
- Forecasting: Project year-end spending based on current run-rate
- Exception Reporting: Highlight major variances for investigation
- Commentary: Allow accountant to add explanatory notes
- Report Generation: Create formatted variance report
- Distribution: Email report to finance stakeholders
- Archiving: Store variance analysis for historical comparison

#### Notifications:
- **To Accountant**: Monthly variance report ready for review (email)
- **To Finance Manager**: Variance summary with major exceptions highlighted
- **To CFO**: (For significant variances >15%) Monthly variance briefing
- **To Department Heads**: Cost center variance report (their costs only)
- **To Executive Team**: Summary of material variances for monthly report

#### Expected Output:
- Monthly budget vs actual variance report (by category and cost center)
- Variance explanations and root cause analysis
- Year-to-date cumulative variance trend
- Year-end spending forecast
- Management commentary for financial reporting
- Variance investigation documentation

#### SLA:
- Month-end close: 3 business days after month-end
- Initial variance report: 4 business days after month-end
- Investigation of flagged variances: <5 business days
- Management variance briefing: <7 business days
- Final variance report distribution: <10 business days

---

## Depreciation Workflows

### WF-AC-010: Vehicle Depreciation Schedule Creation and Maintenance

**Workflow ID**: WF-AC-010
**Name**: Vehicle Depreciation Schedule Creation and Maintenance
**Priority**: High
**Frequency**: Triggered (New vehicle acquisition), Recurring (Monthly batch)

#### Trigger:
- New vehicle acquired and added to fleet inventory
- Vehicle major overhaul extends useful life
- Vehicle disposal/retirement from fleet
- Monthly depreciation calculation batch job
- Year-end depreciation review and adjustments

#### Actors:
- **Primary**: Accountant
- **Secondary**: Fleet Manager, Fixed Asset Module, GL System, Depreciation Engine

#### Steps:
1. Fleet Manager acquires new vehicle:
   - Vehicle: 2025 Freightliner Cascadia
   - VIN: 1HSCWJPR2KH339823
   - Acquisition Cost: $185,000 (includes delivery/setup)
   - Date Placed in Service: 2025-10-15

2. Fleet Manager provides acquisition details to accountant

3. Accountant determines depreciation parameters:
   - Useful Life: 7 years (standard for Class 8 trucks)
   - Depreciation Method: Straight-line
   - Salvage Value: $35,000 (estimated)
   - GL Asset Account: 12-1520 (Fleet Equipment - Trucks)
   - GL Depreciation Account: 61-6100 (Depreciation Expense)
   - GL Accumulated Depreciation: 12-1530

4. Accountant creates fixed asset record:
   - Asset ID: FA-2025-0847
   - Description: 2025 Freightliner Cascadia Truck
   - VIN: 1HSCWJPR2KH339823
   - Category: Trucks
   - Status: Active
   - Location: Fleet Yard 1

5. System calculates depreciation parameters:
   - Depreciable Base: $185,000 - $35,000 = $150,000
   - Useful Life: 7 years = 84 months
   - Monthly Depreciation: $150,000 ÷ 84 = $1,785.71
   - Partial Month: 16 days in October (10/15-10/31)
   - Partial Month Depreciation: $1,785.71 × (16/31) = $922.81

6. System generates depreciation schedule:
   - Oct 2025: $922.81 (partial - 16 days)
   - Nov 2025: $1,785.71 (full month)
   - Dec 2025: $1,785.71 (full month)
   - Jan 2026 - Sep 2032: $1,785.71 (full months)
   - Oct 2032: $1,785.71 (final month, fully depreciated)
   - Total Depreciation: $150,000
   - Salvage Value: $35,000

7. Accountant reviews depreciation schedule:
   - Confirms parameters correct
   - Verifies calculations
   - Reviews schedule by month
   - Month | Depreciation | Accumulated | Book Value
   - Oct 2025 | $922.81 | $922.81 | $184,077.19
   - Nov 2025 | $1,785.71 | $2,708.52 | $182,291.48
   - ...continues through Oct 2032...
   - Oct 2032 | $1,785.71 | $150,000.00 | $35,000.00

8. Accountant activates depreciation schedule:
   - Status: "Active"
   - Effective Date: 2025-10-15
   - Schedule ready for monthly batch processing

9. System runs monthly depreciation batch job (28th of month):
   - Queries all active vehicles with depreciation schedules
   - Calculates current month depreciation for each vehicle
   - New Freightliner: $922.81 (Oct partial)
   - Existing vehicles: $47,577.19
   - Total October depreciation: $48,500.00

10. System generates GL journal entry:
    - Debit: Account 61-6100 (Depreciation Expense) $48,500.00
    - Credit: Account 12-1530 (Accumulated Depreciation) $48,500.00

11. Accountant reviews depreciation batch results:
    - 47 vehicles on active depreciation schedule
    - 12 vehicles fully depreciated (book value = salvage value)
    - 2 vehicles under major overhaul (depreciation suspended)
    - No adjustments needed for this month ✓

12. Accountant approves depreciation posting

13. GL entries post to financial system

14. Dashboard updated showing:
    - Total Fleet Asset Value: $2,847,500
    - Total Accumulated Depreciation: $1,234,200 (43.4%)
    - Total Book Value: $1,613,300 (56.6%)
    - Monthly Depreciation Expense: $48,500

#### Decision Points:
- **Is depreciation method appropriate?**
  - Straight-line: Use for standard vehicles → Standard calculation
  - Declining-balance: Use for high-tech/specialized → Accelerated calculation
  - Units of production: Use if mileage-based → Mileage-driven calculation
- **Is useful life estimate reasonable?**
  - Yes: Create schedule → Proceed to batch processing
  - No: Adjust and recalculate → Update schedule
- **Is salvage value realistic?**
  - Yes: Use in calculation
  - No: Adjust estimate and recalculate
- **Is vehicle status changing?**
  - Active: Continue monthly depreciation
  - Disposed: Stop depreciation, record gain/loss
  - Overhaul: Suspend depreciation temporarily

#### System Actions:
- Asset Master Setup: Create fixed asset record with GL accounts
- Depreciation Calculation: Compute schedule using selected method
- Schedule Generation: Create month-by-month depreciation table
- Batch Processing: Monthly depreciation calculation for all active vehicles
- GL Integration: Generate and post journal entries
- Book Value Tracking: Update book value as depreciation accrues
- Reporting: Display fleet asset summary and depreciation details
- Maintenance: Handle adjustments, disposals, useful life changes

#### Notifications:
- **To Accountant**: New depreciation schedule created (confirmation)
- **To Finance Manager**: Monthly depreciation posting summary
- **To Fleet Manager**: Vehicle book value reports
- **To Tax Department**: Depreciation schedules for tax return preparation

#### Expected Output:
- Fixed asset record with depreciation parameters
- Month-by-month depreciation schedule
- GL journal entries posted monthly
- Fleet asset summary report (value, accumulated depreciation, book value)
- Depreciation tracking by vehicle type and acquisition year

#### SLA:
- New vehicle depreciation setup: <5 business days of acquisition
- Monthly depreciation batch: 28th of each month
- GL posting: <2 business days after batch
- Depreciation reporting: <3 business days after month-end

---

### WF-AC-011: Asset Disposal and Gain/Loss Recognition

**Workflow ID**: WF-AC-011
**Name**: Asset Disposal and Gain/Loss Recognition
**Priority**: Medium
**Frequency**: As-needed (Event-driven - vehicle disposal)

#### Trigger:
- Vehicle reaches end of useful life
- Vehicle becomes uneconomical to maintain
- Vehicle involved in accident (total loss)
- Vehicle is sold or scrapped
- Lease expires (for leased vehicles)

#### Actors:
- **Primary**: Accountant
- **Secondary**: Fleet Manager, Salvage/Buyer, Insurance Company (if applicable), GL System

#### Steps:
1. Fleet Manager determines vehicle should be disposed:
   - Vehicle: 2019 Ford Transit Van
   - Asset ID: FA-2019-0456
   - Reason: End of useful life (100K miles, 6 years old)
   - Disposal Date: 2025-11-30
   - Disposal Method: Sold to salvage company

2. Fleet Manager provides disposal details:
   - Sale Price: $8,500 (negotiated with salvage buyer)
   - Cost: Vehicle acquisition $28,000
   - Accumulated Depreciation: $26,200
   - Book Value: $1,800
   - Expected Gain/Loss: $8,500 - $1,800 = $6,700 (gain)

3. Accountant records vehicle disposal:
   - Removes vehicle from active depreciation schedule
   - Sets disposal date: 2025-11-30
   - Sets disposal method: Sale

4. System stops monthly depreciation accrual:
   - Final depreciation through October 2025: $26,200 accumulated
   - November depreciation: Stopped (partial month, Oct 1-30 only)
   - Schedule status: "Closed - Disposed"

5. Accountant records sale transaction:
   - Invoice from salvage company received: $8,500
   - Scheduled payment: Within 30 days

6. System calculates gain/loss on disposal:
   - Book Value (at disposal): $1,800
   - Proceeds: $8,500
   - Gain/(Loss): $8,500 - $1,800 = +$6,700 (gain)

7. Accountant records GL entries:
   - Remove asset from balance sheet:
     - Credit: Account 12-1520 (Fleet Equipment) $28,000
     - Debit: Account 12-1530 (Accumulated Depreciation) $26,200
   - Record cash receipt:
     - Debit: Account 10-1020 (Cash) $8,500
   - Record gain on disposal:
     - Debit: Account 12-1520 (for reduction) $28,000 + Credit: Account 12-1530 $26,200
     - Debit: Account 10-1020 (Cash) $8,500
     - Credit: Account 80-7010 (Gain on Asset Disposal) $6,700

8. System updates fixed asset module:
   - Asset status: "Disposed"
   - Removal date: 2025-11-30
   - Gain/Loss: $6,700 (gain)
   - Final book value: $0

9. Dashboard updated:
   - Total Fleet Assets reduced by original cost: $28,000
   - Total Accumulated Depreciation reduced: $26,200
   - Gain on disposal recorded: $6,700
   - Total Book Value reduced: $1,800

10. Accountant generates disposal report:
    - Vehicle details and acquisition cost
    - Accumulated depreciation
    - Disposal date and proceeds
    - Gain/loss recognition
    - GL entry documentation

11. Accountant files disposal documentation:
    - Bill of sale or salvage documentation
    - Depreciation history
    - Gain/loss calculation
    - GL posting confirmation

#### Decision Points:
- **Is disposal price reasonable?**
  - Yes: Record at sale price → Steps 7-11
  - No: Investigate (possibly fraud or error) → Alternative Flow A1
- **Is gain/loss expected?**
  - Small (<5% of book value): Normal, record as-is
  - Large (>5% of book value): Investigate reason → Alternative Flow A2
- **Is vehicle fully depreciated?**
  - Yes: Gain = Sale Price - Salvage Value
  - No: Gain/Loss = Sale Price - Book Value

#### System Actions:
- Depreciation Suspension: Stop monthly depreciation accrual
- Gain/Loss Calculation: Compute disposal gain or loss
- GL Entry Generation: Debit/credit accounts for asset removal and gain/loss
- Asset Removal: Update asset master to "disposed" status
- Report Generation: Create disposal documentation
- Audit Trail: Record all disposal steps and approvals

#### Notifications:
- **To Accountant**: Disposal notification and gain/loss calculation
- **To Finance Manager**: Asset disposal report for review
- **To Fleet Manager**: Confirmation of asset removal from fleet inventory
- **To Tax Department**: Gain/loss information for tax return

#### Expected Output:
- Closed depreciation schedule for disposed vehicle
- Gain/(loss) on asset disposal recognized
- GL entries posted removing asset and recording gain/loss
- Disposal documentation filed
- Updated fleet asset summary

#### SLA:
- Disposal setup: <2 business days after decision
- GL posting: <5 business days after sale closing
- Tax reporting information: <30 days for year-end filings

---

## IFTA Reporting Workflows

### WF-AC-012: Quarterly IFTA Report Generation and Filing

**Workflow ID**: WF-AC-012
**Name**: Quarterly IFTA Report Generation and Filing
**Priority**: High
**Frequency**: Quarterly (Jan 31, Apr 30, Jul 31, Oct 31 deadlines)

#### Trigger:
- Quarter ends (Mar 31, Jun 30, Sep 30, Dec 31)
- IFTA filing deadline approaches (typically 30 days after quarter)
- Accountant manually initiates IFTA report generation
- Scheduled job generates preliminary report 45 days after quarter-end

#### Actors:
- **Primary**: Accountant
- **Secondary**: Telematics System, Fuel Card System, GPS Tracking, State Tax Authorities, GL System

#### Steps:
1. Q3 ends (September 30, 2025)
2. IFTA filing deadline: October 31, 2025 (30 days after quarter)
3. Accountant initiates IFTA report generation on October 15
4. System consolidates IFTA data for Q3 period (Jul 1 - Sep 30):
   - Miles driven by jurisdiction (state/province)
   - Fuel purchased by jurisdiction
   - Fuel tax rates by jurisdiction
   - Vehicles registered for IFTA

5. System retrieves miles driven by jurisdiction from telematics:
   - **Miles Summary**:
     - Ohio: 12,400 miles
     - Kentucky: 8,200 miles
     - Indiana: 6,500 miles
     - Michigan: 4,900 miles
     - Pennsylvania: 3,800 miles
     - Total: 35,800 miles
   - Data source: GPS tracking of vehicle routes

6. System retrieves fuel purchased by jurisdiction from fuel card data:
   - **Fuel Purchased Summary**:
     - Ohio: 2,100 gallons
     - Kentucky: 1,400 gallons
     - Indiana: 1,050 gallons
     - Michigan: 800 gallons
     - Pennsylvania: 650 gallons
     - Total: 6,000 gallons

7. System calculates tax liability by jurisdiction:
   - Tax Rate by State (IFTA tax rates - examples):
     - Ohio: $0.2825/gallon
     - Kentucky: $0.2825/gallon
     - Indiana: $0.2825/gallon
     - Michigan: $0.3130/gallon
     - Pennsylvania: $0.3160/gallon

8. Calculations for each jurisdiction:
   - **Ohio**: 2,100 gallons × $0.2825 = $593.25 tax
   - **Kentucky**: 1,400 gallons × $0.2825 = $395.50 tax
   - **Indiana**: 1,050 gallons × $0.2825 = $296.63 tax
   - **Michigan**: 800 gallons × $0.3130 = $250.40 tax
   - **Pennsylvania**: 650 gallons × $0.3160 = $205.40 tax
   - **Total IFTA Tax Liability**: $1,741.18

9. System performs IFTA calculations (alternative method):
   - Gallons used = Miles driven ÷ MPG
   - Tax owed = (Gallons used - Gallons purchased) × Tax rate
   - This identifies if tax is owed or credit due

10. System displays preliminary IFTA report:
    - Period: July 1 - September 30, 2025
    - Vehicles included: 18 trucks registered for IFTA
    - Miles driven: 35,800 miles by jurisdiction
    - Fuel purchased: 6,000 gallons by jurisdiction
    - Estimated tax liability: $1,741.18
    - Data completeness: 100% of miles and fuel recorded

11. Accountant reviews IFTA report for accuracy:
    - Validates mile totals against fleet records
    - Confirms fuel purchases match fuel card reconciliation
    - Identifies any anomalies or gaps
    - Verifies vehicle IFTA registrations current

12. System validates data completeness:
    - All vehicles have current IFTA registration? ✓
    - All miles recorded with jurisdiction? ✓
    - All fuel purchases recorded with jurisdiction? ✓
    - No missing or incomplete records? ✓

13. Accountant handles special cases:
    - Exempt vehicles (certain under-weight): Excluded from IFTA
    - Tax-exempt fuel: Separated from taxable fuel
    - Vehicles recently added/removed: Prorated accordingly

14. Accountant approves IFTA report:
    - Confirms accuracy of miles and fuel data
    - Validates tax calculations
    - Approves for filing

15. System generates IFTA report in state-required format:
    - IFTA-compliant XML or PDF format
    - Includes all required fields per IFTA standards
    - Multiple jurisdictions in single report file

16. Accountant exports IFTA report:
    - PDF version: For review and records
    - XML version: For e-filing with state authorities
    - Summary spreadsheet: For internal records

17. Accountant files IFTA report with state authority:
    - Method: E-file through state tax authority portal
    - States: Multiple state filing (multistate vehicle registration)
    - Deadline: October 31, 2025 (must be received by state)

18. System sends filing confirmation:
    - Filing receipt number
    - Filing date/time
    - State authority confirmation

19. Accountant records IFTA payment obligation:
    - Due date: Varies by state (typically within 30 days of quarter)
    - Amount: $1,741.18
    - Status: Pending payment authorization

20. System generates GL entry for IFTA tax:
    - Debit: Account 61-6200 (IFTA Tax Expense) $1,741.18
    - Credit: Account 20-2050 (IFTA Tax Payable) $1,741.18

21. GL entry posts to financial system
22. IFTA filing archived for compliance record

#### Decision Points:
- **Is data completeness >98%?**
  - Yes: Proceed with report generation → Step 10
  - No: Investigate missing data → Exception Flow E1
- **Are tax calculations correct?**
  - Yes: Approve for filing → Step 14
  - No: Correct calculations and recalculate → Step 8
- **Are all vehicles properly registered for IFTA?**
  - Yes: Include in report
  - No: Exclude or note in filing → Exception Flow E2
- **Is filing deadline imminent?**
  - Yes (<5 days): Expedite filing → Accelerated process
  - No: Normal filing process → Continue

#### System Actions:
- Telematics Integration: Pull miles by jurisdiction from GPS data
- Fuel Card Integration: Pull fuel purchase data by location
- Tax Rate Lookup: Retrieve current IFTA tax rates by jurisdiction
- Calculation Engine: Compute tax liability by state
- Data Validation: Check completeness and accuracy
- Report Generation: Create IFTA-compliant report format
- E-filing: Submit report to state tax authority portal
- Payment Processing: Generate payment file for IFTA taxes
- Archive: Store IFTA reports for compliance (minimum 5 years)
- Notification: Alert accountant of filing and payment due dates

#### Notifications:
- **To Accountant**:
  - 45 days before deadline: Preliminary IFTA report ready for review
  - 30 days before deadline: Reminder to review and approve
  - 15 days before deadline: Final reminder if not filed
  - 5 days before deadline: Urgent reminder
- **To Finance Manager**: Quarterly IFTA tax liability summary
- **To State Tax Authorities**: IFTA report filing submission
- **To Accounting**: IFTA tax GL entry posted (GL notification)

#### Expected Output:
- Quarterly IFTA report (by jurisdiction, vehicles, miles, fuel, tax)
- IFTA filing receipt (confirmation of state filing)
- GL entry for IFTA tax liability
- IFTA payment obligation record
- Archive of filed IFTA reports (for audit trail)

#### SLA:
- IFTA data collection: Within 10 days of quarter-end
- Preliminary report generation: Within 20 days of quarter-end
- Accountant review: <10 days
- Final report filing: <30 days of quarter-end (before deadline)
- Payment processing: Within 15 days of quarter-end (varies by state)
- Record archive: Same day as filing

---

## Workflow Summary

### Quick Reference Table

| Workflow ID | Name | Trigger | Frequency | Primary Actors | Key Decision Points |
|---|---|---|---|---|---|
| WF-AC-001 | Invoice Reception & OCR | Invoice receipt (email/upload/EDI) | Daily | Accountant, OCR Service | EDI vs OCR? Quality >85%? |
| WF-AC-002 | 3-Way Invoice Matching | Invoice processing | Daily | Accountant, PO/Receipt Systems | PO found? Variance tolerance? |
| WF-AC-003 | GL Coding & Allocation | Post-matching | Daily | Accountant, GL Master | Single vs split? Valid GL account? |
| WF-AC-004 | Multi-Level Approval | Submit for approval | Daily | Accountant, Approvers | Amount threshold? Conflicts? SLA? |
| WF-AC-005 | Rejection & Correction | Approval rejection | As-needed | Accountant, Approver | Correctable? Material issue? |
| WF-AC-006 | Fuel Reconciliation | Month-end | Monthly | Accountant, Fuel Card Provider | Match rate >95%? Variance <1%? |
| WF-AC-007 | Fuel Anomaly Investigation | Anomaly detected | Monthly | Accountant, Card Provider | Legitimate? Fraud? Correctable? |
| WF-AC-008 | Budget Planning | Budget cycle | Annual | Accountant, Finance Manager, CFO | Within guidelines? Approval needed? |
| WF-AC-009 | Budget Variance Analysis | Month-end | Monthly | Accountant, Finance Manager | Variance >10%? Correctable? |
| WF-AC-010 | Depreciation Schedule | New asset/Monthly | Triggered/Monthly | Accountant, Fleet Manager | Life estimate OK? Partial month? |
| WF-AC-011 | Asset Disposal | Vehicle disposal | As-needed | Accountant, Fleet Manager | Book value gain/loss? Justified? |
| WF-AC-012 | IFTA Report & Filing | Quarter-end | Quarterly | Accountant, Tax Authority | Data complete? Calculations correct? |

---

## Related Documents

- User Stories: `user-stories/06_ACCOUNTANT_USER_STORIES.md`
- Use Cases: `use-cases/06_ACCOUNTANT_USE_CASES.md`
- Test Cases: `test-cases/06_ACCOUNTANT_TEST_CASES.md` (future)
- Data Model: `data-model/FINANCIAL_SCHEMA.md` (future)
- Business Rules: `business-rules/ACCOUNTING_RULES.md` (future)

---

## Document Control

**Version**: 1.0
**Date**: November 11, 2025
**Author**: Fleet Accounting Requirements Team
**Last Updated**: November 11, 2025
**Status**: Draft - Ready for Review
**Review Date**: November 18, 2025

---

*End of Accountant Workflow Documentation*
