# Fleet Manager - Workflows

**Role**: Fleet Manager
**Access Level**: Executive (Full system access)
**Primary Interface**: Web Dashboard
**Version**: 1.0
**Date**: November 11, 2025

---

## Table of Contents

1. [Vehicle Lifecycle Workflows](#vehicle-lifecycle-workflows)
2. [Financial Management Workflows](#financial-management-workflows)
3. [Vendor and Contract Workflows](#vendor-and-contract-workflows)
4. [Compliance and Risk Workflows](#compliance-and-risk-workflows)
5. [Strategic Planning Workflows](#strategic-planning-workflows)
6. [Workflow Standards](#workflow-standards)

---

## Vehicle Lifecycle Workflows

### WF-FM-001: Vehicle Acquisition Planning

**Workflow ID**: WF-FM-001
**Name**: Vehicle Acquisition Planning
**Owner**: Fleet Manager
**Priority**: High
**Version**: 1.0

#### Trigger Events
- Scheduled annual fleet planning process
- Vehicle reaches replacement threshold (age > 10 years OR mileage > 200,000 miles)
- Management requests acquisition analysis for specific use case
- Budget cycle opens for capital planning

#### Actors
- Fleet Manager (Primary)
- Finance Manager (Secondary)
- Executive Approver (Secondary)
- System Administrator (Support)

#### Steps

1. **Initiate Fleet Analysis**
   - Fleet Manager navigates to Vehicle Acquisition Planning dashboard
   - System loads current fleet composition data
   - Display filters available: age, mileage, maintenance cost trends, utilization

2. **Apply Analysis Criteria**
   - Fleet Manager applies filter criteria (e.g., age > 8 years, mileage > 150K)
   - System queries vehicle database against criteria
   - System calculates replacement scores based on:
     - Age weighting: 40%
     - Mileage weighting: 35%
     - Maintenance cost trends: 25%

3. **Review Replacement Recommendations**
   - System displays vehicles matching criteria with replacement scores
   - Fleet Manager reviews detailed analysis for top candidates
   - Cost-benefit analysis presented: repair costs vs replacement costs

4. **Calculate Total Cost of Ownership**
   - System generates 5-year TCO projection
   - Includes: acquisition, fuel, maintenance, insurance, disposal
   - Comparison shown: keep existing vs replace with new vehicle
   - Break-even analysis calculated

5. **Select Vehicles for Replacement**
   - Fleet Manager prioritizes replacement candidates
   - Fleet Manager creates replacement list with order
   - Fleet Manager selects vehicle type/specs if replacement chosen

6. **Calculate Budget Requirements**
   - System calculates total acquisition budget
   - System includes: acquisition cost, trade-in allowances, implementation costs
   - Financing options evaluated if needed

7. **Document Justification**
   - Fleet Manager adds business justification
   - Fleet Manager notes strategic considerations
   - Fleet Manager documents risk mitigation strategy

8. **Generate Acquisition Package**
   - System creates acquisition proposal document
   - Includes: vehicle specs, cost analysis, ROI, timeline, risk assessment
   - Format: Professional PDF report

9. **Submit for Approval**
   - Fleet Manager submits acquisition request
   - Routing: Finance Manager → Executive Approver
   - System tracks approval status and timeline

10. **Receive Approval Decision**
    - Approver reviews acquisition package
    - System notifies Fleet Manager of approval/rejection
    - If rejected, Fleet Manager can revise and resubmit

#### Decision Points

| Decision | Condition | Path |
|----------|-----------|------|
| **Proceed with Acquisition?** | Replacement score > 75 | Yes: Continue to step 4; No: Archive recommendation |
| **Budget Available?** | Requested budget ≤ approved budget | Yes: Step 6; No: Prioritize subset or request increase |
| **Financing Required?** | Acquisition cost > cash on hand | Yes: Evaluate financing options; No: Continue |
| **Approval Received?** | Approver approves request | Yes: Proceed to procurement; No: Revise and resubmit |

#### System Actions

- Query fleet database for vehicles matching criteria
- Calculate replacement scores using formula
- Retrieve market valuation data (NADA/KBB APIs)
- Calculate depreciation schedules
- Generate TCO projections
- Create PDF acquisition package
- Route approval workflow
- Update project tracking system
- Send notifications to stakeholders

#### Notifications

- **To Fleet Manager**: Criteria applied, recommendations ready for review
- **To Finance Manager**: Acquisition request submitted for review
- **To Executive Approver**: Approval request with acquisition package
- **To Fleet Manager**: Approval status (approved/rejected)
- **To Procurement Manager**: Acquisition approved, ready for vendor sourcing

#### Success Criteria
- Acquisition plan created with objective analysis
- Budget calculated and justified
- Replacement timeline established
- Approval obtained or feedback documented
- All stakeholders informed

#### Related Workflows
- WF-FM-002: New Vehicle Registration
- WF-FM-005: Budget Approval Process

---

### WF-FM-002: New Vehicle Registration and Onboarding

**Workflow ID**: WF-FM-002
**Name**: New Vehicle Registration and Onboarding
**Owner**: Fleet Manager
**Priority**: High
**Version**: 1.0

#### Trigger Events
- New vehicle delivery received from dealer
- Purchase order marked as "Received"
- Fleet Manager initiates onboarding workflow

#### Actors
- Fleet Manager (Primary)
- Procurement Manager (Secondary)
- IT Administrator (Secondary)
- Maintenance Team (Secondary)
- Dispatch Team (Secondary)
- Finance Team (Secondary)

#### Steps

1. **Create Vehicle Registration**
   - Fleet Manager opens New Vehicle Registration form
   - Fleet Manager enters delivery details:
     - Dealer name and contact
     - Delivery date
     - Purchase order number
     - Invoice/acquisition cost

2. **Enter Vehicle Identification**
   - Fleet Manager enters VIN
   - Fleet Manager enters license plate
   - Fleet Manager enters make, model, year, color

3. **Auto-Decode VIN**
   - System sends VIN to decoder service (NHTSA API)
   - System retrieves vehicle specifications:
     - Engine type and displacement
     - Transmission type
     - GVWR and capacity
     - Telematics capability
     - Manufacturer maintenance schedule

4. **Upload Documentation**
   - Fleet Manager uploads required documents:
     - Title document (PDF)
     - Registration certificate
     - Manufacturer warranty card
     - Bill of sale
   - System stores documents in Azure Blob Storage
   - System verifies document completeness

5. **Assign Vehicle Details**
   - Fleet Manager assigns vehicle location (depot/facility)
   - Fleet Manager specifies primary use (delivery, passenger, specialized)
   - Fleet Manager selects vehicle class/category
   - System auto-generates Fleet ID (FLT-YYYY-NNNN)

6. **Configure Service Schedule**
   - Fleet Manager selects service template (based on vehicle type)
   - System generates maintenance schedule from template
   - First service scheduled: Initial inspection + oil change
   - Subsequent services: Based on manufacturer recommendations

7. **Configure Telematics**
   - Fleet Manager selects telematics device type
   - Fleet Manager specifies installation location
   - Fleet Manager enables features: GPS, harsh driving, ELD compliance
   - System schedules installation appointment with maintenance team

8. **Set Insurance Coverage**
   - Fleet Manager enters insurance policy details:
     - Policy number
     - Carrier name
     - Coverage types and limits
     - Effective date
   - System links vehicle to insurance policy

9. **Create Asset Record**
   - Fleet Manager enters depreciation parameters:
     - Depreciation method (MACRS, straight-line)
     - Acquisition cost
     - Salvage estimate
     - Useful life (years)
   - System creates asset record in GL and tracks depreciation

10. **Generate Welcome Documentation**
    - System creates vehicle Welcome document
    - Includes: Fleet ID, specs, maintenance schedule, telematics guide
    - Document provided to assigned driver

11. **Notify All Stakeholders**
    - System sends notifications:
      - Maintenance team: Schedule first service
      - Dispatch team: Vehicle available for assignment
      - Finance team: Asset added to ledger
      - Insurance team: New vehicle under policy

12. **Mark Vehicle as Available**
    - System updates vehicle status to "In Service - Available"
    - Vehicle appears in dispatcher's available vehicle pool
    - Fleet Manager confirms successful onboarding

#### Decision Points

| Decision | Condition | Path |
|----------|-----------|------|
| **VIN Decode Successful?** | API response successful | Yes: Step 4; No: Go to E1 (manual entry) |
| **Documentation Complete?** | All required docs uploaded | Yes: Step 5; No: Flag as pending, continue |
| **Telematics Available?** | Device in stock | Yes: Schedule installation; No: Go to E4 (delay) |
| **Ready for Service?** | All setup complete | Yes: Mark available; No: Mark pending |

#### System Actions

- Send VIN to decoder service
- Store documents in blob storage
- Auto-generate Fleet ID
- Create maintenance schedule from template
- Schedule telematics installation work order
- Create GL asset record
- Update insurance policy linking
- Send email notifications to stakeholders
- Update vehicle availability status
- Sync data to dispatch system

#### Notifications

- **To Fleet Manager**: Vehicle registration complete, ready for assignment
- **To Maintenance Team**: New vehicle ready for first service
- **To Dispatch Team**: New vehicle available in vehicle pool
- **To Finance Team**: New asset created (asset ID, cost, depreciation schedule)
- **To Insurance Team**: New vehicle under policy (effective date)
- **To Assigned Driver**: Welcome documentation and vehicle guide

#### Exception Flows

**E1: VIN Decoder Service Unavailable**
- System displays error message
- Fleet Manager manually enters vehicle specifications
- System marks record: "Manual entry - verify specs"
- VIN decoder service retried when available
- System updates specifications when decoder succeeds

**E2: Duplicate Vehicle Registration**
- System detects Fleet ID already exists
- Fleet Manager investigates: duplicate entry or reactivation?
- If duplicate: Link to existing record
- If reactivation: Update status to "Active"
- Continue from step 5

**E3: Missing Required Documentation**
- System flags missing documents
- Vehicle marked as "Pending Documentation"
- Daily reminder sent to Fleet Manager
- Vehicle not released to service until documents received
- Once received, vehicle activated

**E4: Telematics Installation Delay**
- System alerts device unavailable until specified date
- Fleet Manager chooses:
  - Activate vehicle immediately without telematics (manual tracking)
  - Delay activation until telematics installed
- Vehicle marked as "Pending Telematics" if delayed
- Maintenance team schedules installation when device available

#### Success Criteria
- Vehicle registered in system with all specs
- Documentation stored and accessible
- Asset created in accounting system
- Insurance coverage activated
- Telematics installation scheduled
- Vehicle available for assignment
- All stakeholders notified

#### Related Workflows
- WF-FM-001: Vehicle Acquisition Planning
- WF-FM-010: Telematics Installation and Activation

---

### WF-FM-003: Vehicle Disposition and Retirement

**Workflow ID**: WF-FM-003
**Name**: Vehicle Disposition and Retirement
**Owner**: Fleet Manager
**Priority**: Medium
**Version**: 1.0

#### Trigger Events
- Vehicle reaches end of useful life (age > 12 years OR mileage > 250,000)
- Vehicle declared total loss due to accident
- Scheduled disposition in fleet plan
- Vehicle becomes excess capacity

#### Actors
- Fleet Manager (Primary)
- Finance Manager (Secondary)
- Maintenance Manager (Secondary)
- Disposal Vendor (External)
- Accounting Manager (Secondary)

#### Steps

1. **Initiate Disposition Process**
   - Fleet Manager opens Vehicle Disposition dashboard
   - Fleet Manager selects vehicle for disposition
   - Fleet Manager specifies reason: end of life, accident, excess capacity

2. **Retrieve Vehicle History**
   - System loads complete vehicle record:
     - Service history (all maintenance records)
     - Accident/incident history
     - Current condition rating
     - Outstanding maintenance items

3. **Request Market Valuation**
   - System queries market valuation service (NADA/KBB)
   - System displays estimated value range
   - System shows comparable vehicles and pricing trends
   - Fleet Manager selects realistic market value estimate

4. **Review Disposition Options**
   - Fleet Manager reviews disposition methods:
     - Auction (90-95% of market value)
     - Trade-in with new vehicle (85-90%)
     - Direct sale to dealer (80-85%)
     - Donation (tax benefit, typically 50% of value)
   - Fleet Manager analyzes financial impact of each option
   - Fleet Manager selects preferred disposition method

5. **Generate Disposition Package**
   - System creates comprehensive disposition package:
     - Complete service history
     - Accident/incident reports
     - Inspection photos (interior, exterior, under hood)
     - Title and registration copies
     - Warranty documentation
     - Equipment list

6. **Calculate Disposition Timeline**
   - System estimates timeline:
     - Vehicle preparation: 5 business days
     - Listing/advertising: 7-10 days
     - Sale process: 5-10 days
     - Payment and title transfer: 5 business days
     - Total estimated: 22-35 days

7. **Contact Disposal Vendor**
   - Fleet Manager contacts selected vendor/auction house
   - Fleet Manager submits vehicle details:
     - Estimated value
     - Reserve price (minimum acceptable)
     - Condition description
     - Preferred sale date

8. **Schedule Vehicle Preparation**
   - System creates work order for vehicle preparation:
     - Fuel tank empty
     - Interior cleaning
     - Damage documentation
     - Final inspection
   - Maintenance team executes preparation work order

9. **Track Disposition Status**
   - System updates disposition status: Listed
   - Fleet Manager monitors sale progress
   - System notifies Fleet Manager of offers/interest
   - Fleet Manager manages negotiations if direct sale

10. **Record Disposition Results**
    - Disposition completed by vendor or sale finalized
    - Fleet Manager enters final disposition details:
      - Sale price
      - Purchaser information
      - Sale date
      - Title transfer status

11. **Update Accounting Records**
    - System calculates gain/loss on disposition:
      - Book value vs sale price
      - Gain/loss posted to GL
    - System creates accounting entry for asset removal
    - Fleet Manager confirms accounting entry

12. **Archive Vehicle Record**
    - System moves vehicle to historical records
    - Vehicle removed from active fleet
    - Vehicle removed from dashboard reporting
    - Vehicle becomes searchable in historical data only

13. **Send Final Notifications**
    - System notifies Finance team of disposition completion
    - System notifies Accounting team of GL entries
    - System archives all disposition documents
    - Fleet Manager confirms successful completion

#### Decision Points

| Decision | Condition | Path |
|----------|-----------|------|
| **Market Data Available?** | API returns valid valuation | Yes: Step 4; No: Go to E1 (manual) |
| **Disposition Method?** | Selection made | Execute selected method path |
| **Preparation Complete?** | Work order finished | Yes: Submit to vendor; No: Wait |
| **Sale Completed?** | Vehicle sold or donated | Yes: Step 11; No: Continue monitoring |
| **Accounting Correct?** | GL entries reviewed | Yes: Archive; No: Correct and retry |

#### System Actions

- Query market valuation service
- Generate disposition package document
- Calculate estimated timeline
- Create work order for vehicle preparation
- Update disposition status tracking
- Generate GL accounting entries
- Calculate gain/loss on asset disposal
- Move vehicle to historical records
- Send email notifications
- Archive disposition documents

#### Notifications

- **To Fleet Manager**: Disposition options available, recommendation
- **To Maintenance Team**: Work order for vehicle preparation
- **To Disposal Vendor**: Vehicle ready for pickup/submission
- **To Finance Manager**: Disposition completed, final price
- **To Accounting Manager**: GL entries for asset disposal and gain/loss
- **To Fleet Manager**: Disposition completed, historical record archived

#### Exception Flows

**E1: Market Valuation Data Unavailable**
- System unable to retrieve market data
- Fleet Manager manually researches KBB/NADA
- Fleet Manager enters estimated value with "Manual" flag
- System administrator investigates API failure
- Valuation updated when service restored

**E2: Vehicle Does Not Sell**
- Vehicle remains unsold after extended period
- Fleet Manager reviews options:
  - Reduce reserve price and relist
  - Change disposition method
  - Donate vehicle instead
- System updates disposition status and timeline

**E3: Title Transfer Delayed**
- Buyer awaiting title documents
- Accounting waits to finalize GL entry
- System sends reminder notifications
- Fleet Manager follows up with vendor/buyer
- Title transferred and confirmed before archiving

**E4: Accounting Discrepancy**
- Book value vs sale price creates unexpected loss
- Finance Manager reviews GL entry
- Fleet Manager documents reason for loss
- Accounting Manager approves GL entry
- Entry finalized and vehicle archived

#### Success Criteria
- Vehicle disposition method selected
- Disposition package created with complete history
- Vehicle sold or disposed with maximum value recovery
- Accounting entries correct and balanced
- Vehicle removed from active fleet
- Historical record maintained
- All stakeholders notified

#### Related Workflows
- WF-FM-001: Vehicle Acquisition Planning (replacement)
- WF-FM-009: Accounting and Asset Management

---

## Financial Management Workflows

### WF-FM-004: Fleet Budget Planning and Approval

**Workflow ID**: WF-FM-004
**Name**: Fleet Budget Planning and Approval
**Owner**: Fleet Manager
**Priority**: High
**Version**: 1.0

#### Trigger Events
- Annual budget cycle opens
- Mid-year budget review triggered
- Significant operational change requires budget adjustment
- Finance Manager requests budget update

#### Actors
- Fleet Manager (Primary)
- Finance Manager (Secondary)
- CFO/Finance Director (Approver)
- Department Heads (Secondary)

#### Steps

1. **Access Budget Planning Dashboard**
   - Fleet Manager opens Budget Planning module
   - System displays previous year budget and actuals
   - System shows year-to-date spending vs current budget
   - Historical trends displayed for analysis

2. **Review Historical Spending**
   - Fleet Manager reviews budget categories:
     - Fuel and lubrication
     - Maintenance and repairs
     - Tires and parts
     - Vehicle insurance
     - Vehicle depreciation
     - Telematics and technology
     - Driver training and safety
     - Licenses and permits
   - System highlights unusual trends or spikes
   - Fleet Manager analyzes variance causes

3. **Calculate Baseline Budget**
   - Fleet Manager enters baseline assumptions:
     - Fleet size (planned additions/dispositions)
     - Expected miles/hours of operation
     - Fuel price forecast
     - Labor cost inflation
     - Parts cost trends
     - Insurance rate changes
   - System calculates baseline budget for each category
   - System shows 3-year projection

4. **Make Budget Adjustments**
   - Fleet Manager adjusts category budgets:
     - Increases due to fleet expansion
     - Decreases due to optimization initiatives
     - Special items (major repairs, technology)
   - Fleet Manager adds justifications for material changes
   - System recalculates total fleet budget
   - System identifies areas exceeding targets

5. **Model Cost Scenarios**
   - Fleet Manager creates "what-if" scenarios:
     - Scenario A: Conservative (current staffing, no optimization)
     - Scenario B: Base case (planned improvements)
     - Scenario C: Aggressive (major efficiency initiatives)
   - System calculates budget impact for each scenario
   - Fleet Manager compares scenarios

6. **Identify Cost Reduction Opportunities**
   - System recommends cost reduction initiatives:
     - Vendor consolidation (savings: $XX)
     - Fuel optimization (savings: $XX)
     - Preventive maintenance improvements (savings: $XX)
     - Fleet right-sizing (savings: $XX)
   - Fleet Manager evaluates feasibility and impact
   - Fleet Manager includes approved initiatives in budget

7. **Prepare Budget Justification**
   - Fleet Manager documents budget narrative:
     - Fleet composition changes
     - Operational changes
     - Major capital acquisitions
     - Efficiency initiatives
     - Risk mitigation measures
   - Fleet Manager creates executive summary
   - System generates supporting charts and data

8. **Route for Approval**
   - Fleet Manager submits budget to Finance Manager
   - Finance Manager reviews for reasonableness
   - Finance Manager routes to CFO/Finance Director
   - System tracks approval workflow status

9. **Receive Approval or Feedback**
   - Approver reviews budget package
   - System notifies Fleet Manager of approval status
   - If rejected: Fleet Manager receives feedback
   - Fleet Manager can revise and resubmit

10. **Lock and Distribute Budget**
    - Budget approved and locked in system
    - System distributes budget to all stakeholders:
      - Finance: For accounting system
      - Maintenance: For work order budgets
      - Dispatch: For operational planning
    - System enables budget tracking and alerts
    - Monthly reporting begins

#### Decision Points

| Decision | Condition | Path |
|----------|-----------|------|
| **Budget Increase Justified?** | Includes clear justification | Yes: Route for approval; No: Revise |
| **Variance Analysis Complete?** | Prior year variances explained | Yes: Continue; No: Complete analysis |
| **Approval Received?** | Approver approves request | Yes: Lock budget; No: Revise and resubmit |
| **Cost Reduction Target Met?** | Total budget ≤ target | Yes: Submit; No: Add initiatives |

#### System Actions

- Load historical budget and spending data
- Calculate baseline budgets for all categories
- Generate trend analysis charts
- Model cost scenarios
- Generate cost reduction recommendations
- Create budget justification documents
- Route approval workflow
- Lock budget once approved
- Distribute budget to stakeholders
- Enable budget tracking and reporting

#### Notifications

- **To Fleet Manager**: Budget planning period opened
- **To Finance Manager**: Budget submitted for review
- **To CFO/Finance Director**: Approval request with budget package
- **To Fleet Manager**: Budget approval status
- **To Stakeholders**: Budget approved and locked (effective date)
- **To Finance**: Budget loaded in accounting system

#### Success Criteria
- Comprehensive budget created with all categories
- Historical analysis and justifications documented
- Budget approved within organizational targets
- Budget distributed to all stakeholders
- Tracking and reporting enabled

#### Related Workflows
- WF-FM-005: Budget Approval Process
- WF-FM-006: Monthly Budget vs Actual Review

---

### WF-FM-005: Capital Acquisition Approval Process

**Workflow ID**: WF-FM-005
**Name**: Capital Acquisition Approval Process
**Owner**: Fleet Manager
**Priority**: High
**Version**: 1.0

#### Trigger Events
- Acquisition request submitted by Fleet Manager
- Budget cycle includes capital allocation
- Emergency acquisition request (accident/damage replacement)
- Lease vs buy decision required

#### Actors
- Fleet Manager (Requestor)
- Finance Manager (Reviewer)
- CFO/Finance Director (Approver)
- Executive Committee (Strategic Approver)

#### Steps

1. **Submit Acquisition Request**
   - Fleet Manager submits acquisition request with:
     - Vehicle specifications
     - Cost analysis (acquisition, financing, insurance)
     - ROI analysis and payback period
     - Operational justification
     - Implementation timeline
   - System validates request completeness

2. **Route to Finance Manager**
   - System sends request to Finance Manager
   - Finance Manager reviews for:
     - Budget availability
     - Financial feasibility
     - Lease vs buy recommendation
     - Funding source identification
   - Finance Manager can request clarifications

3. **Finance Manager Assessment**
   - Finance Manager compares options:
     - Purchase with cash
     - Finance with loan/lease
     - Evaluate tax implications
   - Finance Manager adds financial analysis
   - Finance Manager forwards with recommendation

4. **Executive Review**
   - CFO/Finance Director reviews:
     - Strategic alignment with fleet plan
     - ROI and payback period
     - Impact on annual budget
     - Cash flow implications
   - Executive Committee reviews if > $250K
   - System tracks review timeline

5. **Approval Decision**
   - Approver approves or denies request
   - If approved: Authorization provided for procurement
   - If denied: Feedback sent to Fleet Manager
   - If conditional: Approver outlines conditions

6. **Document Approval**
   - System creates approval record
   - Approval memo generated and distributed
   - Budget reserved for acquisition
   - Procurement authorization issued

7. **Notify Procurement Team**
   - Procurement receives authorization
   - Procurement identifies vendors
   - Procurement requests quotes
   - Procurement selects vendor and negotiates

8. **Execute Purchase**
   - Procurement issues purchase order
   - System tracks PO status
   - Vehicle ordered from vendor
   - Fleet Manager monitors delivery timeline

#### Decision Points

| Decision | Condition | Path |
|----------|-----------|------|
| **Budget Available?** | Requested amount ≤ available budget | Yes: Approve; No: Condition on budget adjustment |
| **Financial Feasible?** | Lease vs buy analyzed | Yes: Approve; No: Recommend lease |
| **Strategic Alignment?** | Fits fleet plan | Yes: Approve; No: Deny or condition |
| **Amount Exceeds Threshold?** | > $250K | Yes: Executive Committee review; No: CFO approval sufficient |

#### System Actions

- Validate request completeness
- Route approval workflow
- Calculate lease vs buy scenarios
- Reserve budget
- Generate approval authorization
- Issue procurement notice
- Track PO and delivery status
- Update asset tracking

#### Notifications

- **To Fleet Manager**: Request submitted and in approval
- **To Finance Manager**: Request ready for review
- **To CFO/Finance Director**: Executive approval required
- **To Executive Committee**: Strategic review required (if > $250K)
- **To Fleet Manager**: Approval decision
- **To Procurement**: Authorization to proceed

#### Success Criteria
- Request approved with clear authorization
- Financial analysis completed
- Budget reserved
- Procurement authorized to proceed
- All stakeholders notified

#### Related Workflows
- WF-FM-001: Vehicle Acquisition Planning
- WF-FM-004: Fleet Budget Planning and Approval
- WF-FM-002: New Vehicle Registration

---

### WF-FM-006: Monthly Budget vs Actual Review

**Workflow ID**: WF-FM-006
**Name**: Monthly Budget vs Actual Review
**Owner**: Fleet Manager
**Priority**: Medium
**Version**: 1.0

#### Trigger Events
- Month end (automatic)
- Finance Manager requests budget review
- Variance threshold exceeded (>10%)
- Mid-month review requested

#### Actors
- Fleet Manager (Primary)
- Finance Manager (Secondary)
- Accounting Manager (Secondary)
- CFO (Secondary)

#### Steps

1. **Access Budget Review Dashboard**
   - Fleet Manager opens Budget vs Actual dashboard
   - System displays month-to-date and YTD comparison
   - Budget categories displayed with variance analysis

2. **Review Variance Analysis**
   - System calculates variances for all categories:
     - Favorable variances (under budget)
     - Unfavorable variances (over budget)
   - System highlights material variances (>10%)
   - Fleet Manager reviews variance explanations

3. **Investigate Significant Variances**
   - Fleet Manager drills down into high-variance categories
   - Fleet Manager identifies causes:
     - Seasonal patterns
     - One-time expenses
     - Process changes
     - Vendor price changes
     - Operational changes
   - Fleet Manager documents findings

4. **Prepare Variance Explanations**
   - Fleet Manager documents variance explanations:
     - Cause of variance
     - Expected duration
     - Corrective action (if needed)
     - Impact on year-end forecast
   - System calculates forecast impact
   - Fleet Manager adds notes and recommendations

5. **Forecast Year-End Results**
   - System projects year-end spending based on:
     - Current month actuals
     - Seasonal patterns
     - Known future commitments
   - System shows projected budget variance at year-end
   - Fleet Manager evaluates forecast accuracy

6. **Identify Budget Reallocation Needs**
   - Fleet Manager identifies categories likely to exceed budget
   - Fleet Manager identifies categories with savings
   - Fleet Manager prepares reallocation request if needed:
     - From: Category with surplus
     - To: Category over budget
     - Amount: Specific dollar amount
     - Justification: Reason for reallocation

7. **Route for Approval**
   - If reallocation > $50K: Route to Finance Manager
   - Finance Manager reviews reallocation request
   - Finance Manager approves or requests revision
   - System tracks approval status

8. **Submit Monthly Report**
   - System generates monthly budget report:
     - Budget vs actual by category
     - Variance analysis and explanations
     - Year-end forecast
     - Any reallocations requested/approved
   - Fleet Manager reviews and submits to Finance Manager
   - Finance Manager presents to CFO

9. **Distribute Report**
   - System distributes report to:
     - Finance team
     - Accounting team
     - Department heads (excerpt)
     - Executive management (summary)
   - Report filed in finance records

#### Decision Points

| Decision | Condition | Path |
|----------|-----------|------|
| **Material Variance?** | Variance > 10% | Yes: Investigate and document; No: Note and continue |
| **Reallocation Needed?** | Category likely to exceed budget | Yes: Prepare request; No: Continue |
| **Reallocation > $50K?** | Amount triggers approval | Yes: Route for approval; No: Self-approve |
| **Forecast On Track?** | YTD trend continuing | Yes: Maintain budget; No: Adjust forecast |

#### System Actions

- Calculate budget variances for all categories
- Generate variance analysis charts
- Project year-end spending based on trends
- Calculate reallocation scenarios
- Route approval workflow
- Generate monthly budget report
- Distribute report to stakeholders

#### Notifications

- **To Fleet Manager**: Month-end budget review ready for analysis
- **To Finance Manager**: Monthly budget report submitted
- **To Finance Manager**: Budget reallocation request (if > $50K)
- **To CFO**: Monthly report summary
- **To Stakeholders**: Budget report distributed

#### Success Criteria
- Variance analysis completed for all categories
- Material variances explained and documented
- Year-end forecast provided
- Budget reallocations approved if needed
- Monthly report filed
- Stakeholders informed of budget status

#### Related Workflows
- WF-FM-004: Fleet Budget Planning and Approval
- WF-FM-009: Financial Reporting

---

## Vendor and Contract Workflows

### WF-FM-007: Vendor Onboarding and Contract Management

**Workflow ID**: WF-FM-007
**Name**: Vendor Onboarding and Contract Management
**Owner**: Fleet Manager
**Priority**: Medium
**Version**: 1.0

#### Trigger Events
- New maintenance vendor identified
- Procurement requests vendor approval
- Fleet Manager evaluates new vendor
- Contract renewal cycle begins

#### Actors
- Fleet Manager (Primary)
- Procurement Manager (Secondary)
- Finance Manager (Secondary)
- Vendor (External)
- Insurance/Risk Manager (Secondary)

#### Steps

1. **Identify Vendor Requirements**
   - Fleet Manager specifies vendor requirements:
     - Service type (maintenance, parts, specialized)
     - Service locations required
     - Response time requirements
     - Quality standards
     - Insurance/certifications required
     - Volume commitments

2. **Source Vendor Candidates**
   - Procurement requests vendor quotes
   - Procurement identifies 2-3 qualified vendors
   - Procurement collects pricing, terms, references
   - Fleet Manager reviews vendor options

3. **Evaluate Vendor Capabilities**
   - Fleet Manager assesses vendor:
     - Capabilities and capacity
     - Technical expertise
     - Quality certifications
     - Geographic coverage
     - Technology/systems compatibility
     - Financial stability
   - Fleet Manager checks references
   - Fleet Manager visits facility if major vendor

4. **Negotiate Contract Terms**
   - Fleet Manager/Procurement negotiates:
     - Service level agreements (SLAs)
     - Response times and turnaround times
     - Pricing and volume discounts
     - Payment terms (net 15, 30, etc.)
     - Term length (1, 3, 5 years)
     - Renewal conditions
     - Insurance requirements
     - Dispute resolution procedures
   - Procurement finalizes pricing with vendor
   - Procurement and Vendor sign contract

5. **Set Up Vendor in System**
   - Fleet Manager creates vendor master record:
     - Vendor name, contact, location
     - Service types and capabilities
     - Primary contacts and escalation
     - Payment terms and information
     - Insurance policy on file
     - Certifications/qualifications
   - System links to contracts
   - System enables vendor in work order module

6. **Establish Performance Metrics**
   - Fleet Manager defines performance scorecard:
     - Turnaround time target
     - Quality rating expectations
     - On-time completion target
     - Cost variance threshold
     - Customer satisfaction target
   - System configures metric tracking
   - System sets up alert thresholds

7. **Communicate Expectations**
   - Fleet Manager meets with vendor
   - Fleet Manager reviews contract terms and expectations
   - Fleet Manager discusses performance metrics
   - Fleet Manager provides fleet overview and vehicle types
   - Vendor confirms understanding and capacity

8. **Activate Vendor**
   - System marks vendor as "Active"
   - Vendor available for work order assignment
   - Technicians can select vendor for maintenance work
   - Vendor integrated with parts ordering system

9. **Monitor Vendor Performance**
   - System tracks vendor performance metrics continuously
   - System calculates performance scorecard monthly
   - Fleet Manager reviews vendor dashboard
   - System alerts if vendor underperforming

10. **Track Contract Expiration**
    - System monitors contract expiration dates
    - System sends alerts: 90, 60, 30 days before expiration
    - Fleet Manager evaluates vendor performance
    - Fleet Manager decides: renew, replace, or renegotiate

#### Decision Points

| Decision | Condition | Path |
|----------|-----------|------|
| **Vendor Qualified?** | Meets all requirements | Yes: Negotiate; No: Reject and try next |
| **Contract Terms Acceptable?** | Pricing and terms within parameters | Yes: Execute; No: Renegotiate or reject |
| **Performance Meets Standards?** | Score > target | Yes: Continue; No: Address issues (WF-FM-008) |
| **Renew Contract?** | Performance good, strategically aligned | Yes: Renew; No: Solicit new vendor |

#### System Actions

- Create vendor master record
- Link contracts to vendor record
- Configure performance metric tracking
- Enable vendor in work order system
- Track vendor performance continuously
- Generate performance scorecard monthly
- Alert on contract expiration
- Archive inactive vendors

#### Notifications

- **To Fleet Manager**: Vendor evaluation request
- **To Vendor**: Contract approved, welcome to system
- **To Technicians**: Vendor available for work orders
- **To Finance**: Vendor activated for payment processing
- **To Fleet Manager**: Monthly vendor performance scorecard
- **To Fleet Manager**: Contract expiration alerts (90, 60, 30 days)

#### Exception Flows

**E1: Vendor Unable to Meet Requirements**
- Vendor indicates cannot meet SLA targets
- Fleet Manager revisits requirements with vendor
- Fleet Manager considers adjusting expectations
- Or Fleet Manager rejects vendor and tries next candidate

**E2: Insurance/Certification Missing**
- Vendor cannot provide required insurance
- Fleet Manager escalates to Risk/Insurance team
- Fleet Manager can approve temporary exception with conditions
- Vendor must obtain insurance before full activation

**E3: Contract Terms Unacceptable**
- Critical terms cannot be agreed upon
- Fleet Manager escalates to Procurement and Finance
- Fleet Manager documents blocking issues
- Decision made: Renegotiate or reject vendor

#### Success Criteria
- Vendor qualifications verified
- Contract negotiated and executed
- Vendor integrated into system
- Performance metrics defined and tracking active
- Vendor activated for work orders
- All stakeholders notified

#### Related Workflows
- WF-FM-008: Vendor Performance Management
- WF-FM-009: Work Order Management

---

### WF-FM-008: Vendor Performance Management and Remediation

**Workflow ID**: WF-FM-008
**Name**: Vendor Performance Management and Remediation
**Owner**: Fleet Manager
**Priority**: Medium
**Version**: 1.0

#### Trigger Events
- Monthly vendor scorecard shows underperformance
- Performance metric falls below threshold
- Quality issue reported by technician
- Customer complaint about vendor service
- Contract renewal decision pending

#### Actors
- Fleet Manager (Primary)
- Vendor Manager (Secondary)
- Vendor (External)
- Finance Manager (Secondary)

#### Steps

1. **Identify Performance Issue**
   - System dashboard flags underperforming vendor
   - Alert triggered when metric falls below threshold
   - Fleet Manager notified of specific issue:
     - Turnaround time exceeding target
     - Quality ratings declining
     - On-time completion below target
     - Cost variance exceeding tolerance

2. **Analyze Performance Data**
   - Fleet Manager reviews vendor performance details:
     - Recent work orders and metrics
     - Trend analysis (improving or declining)
     - Specific work orders with issues
     - Root cause analysis (if available)
   - Fleet Manager compares to contract SLAs

3. **Assess Issue Severity**
   - Fleet Manager classifies issue:
     - Critical: Impacts safety or operations
     - High: Affects multiple vehicles or operations
     - Medium: Isolated incidents
     - Low: Minor issues, easily resolved
   - Fleet Manager determines escalation level

4. **Contact Vendor**
   - Fleet Manager contacts vendor manager
   - Fleet Manager discusses performance issue:
     - Specific metrics affected
     - Impact on operations
     - Required improvements
     - Timeline for improvement
   - Vendor provides explanation

5. **Develop Improvement Plan**
   - If issue not critical: Fleet Manager and Vendor develop improvement plan:
     - Specific improvements required
     - Timeline for achieving improvements
     - Resources needed from vendor
     - Metrics to track improvement
   - Improvement plan documented
   - Both parties sign agreement

6. **Monitor Improvement Progress**
   - System tracks improved metrics weekly
   - Fleet Manager reviews progress monthly
   - System alerts if performance not improving
   - Fleet Manager sends progress reports to vendor

7. **Escalate if Not Improving**
   - If performance doesn't improve after 30 days:
     - Fleet Manager escalates to vendor senior management
     - Fleet Manager documents all performance issues
     - Fleet Manager issues formal performance notice
     - Fleet Manager may begin vendor replacement process

8. **Consider Vendor Replacement**
   - If critical issue or severe underperformance:
     - Fleet Manager initiates vendor replacement
     - Fleet Manager identifies replacement vendor
     - Fleet Manager begins transition plan
     - New vendor parallels old vendor (both active) during transition
   - If performance recovers: Continue with vendor
   - If performance doesn't recover: Complete replacement

9. **Document Outcome**
   - System updates vendor record with performance history
   - Improvement plan results documented
   - Metrics show improved or replacement decision
   - Fleet Manager files all correspondence and evidence

#### Decision Points

| Decision | Condition | Path |
|----------|-----------|------|
| **Performance Critical?** | Issue impacts safety or major operations | Yes: Immediate escalation; No: Follow improvement path |
| **Vendor Responsive?** | Willing to address issues | Yes: Develop improvement plan; No: Escalate |
| **Improvement Achieved?** | Metrics meet targets after 30 days | Yes: Continue; No: Escalate/replace |
| **Strategic Relationship?** | Vendor important to fleet strategy | Yes: Intensive improvement efforts; No: Replace quickly |

#### System Actions

- Alert Fleet Manager of performance issues
- Track improvement metrics weekly
- Generate performance comparison reports
- Document vendor correspondence
- Track improvement plan status
- Escalate if no improvement
- Generate replacement vendor evaluation

#### Notifications

- **To Fleet Manager**: Performance alert when threshold breached
- **To Vendor**: Formal performance notification
- **To Finance Manager**: Significant vendor issues
- **To Vendor**: Improvement plan confirmation
- **To Fleet Manager**: Improvement progress reports
- **To Vendor Senior Mgmt**: Escalation notice

#### Exception Flows

**E1: Vendor Unresponsive**
- Fleet Manager cannot reach vendor manager
- Fleet Manager escalates to vendor CEO/President
- Fleet Manager issues formal termination notice if no response
- Fleet Manager begins immediate replacement process

**E2: Critical Safety Issue**
- Quality issue affects vehicle safety
- Fleet Manager immediately stops vendor use
- Fleet Manager pulls all vendor's recent work for inspection
- Vehicles repaired if necessary at vendor's expense
- Formal termination initiated

**E3: Financial Dispute**
- Vendor overcharges or inflates costs
- Fleet Manager escalates to Finance Manager
- Finance reviews all vendor invoices
- Finance may withhold payment pending investigation
- Vendor account reconciled or terminated

#### Success Criteria
- Performance issue identified and documented
- Improvement plan developed and agreed upon
- Performance monitored and tracked
- Improvements achieved or vendor replaced
- Outcome documented in vendor record

#### Related Workflows
- WF-FM-007: Vendor Onboarding and Contract Management
- WF-FM-009: Work Order Management

---

## Compliance and Risk Workflows

### WF-FM-009: Regulatory Compliance Monitoring

**Workflow ID**: WF-FM-009
**Name**: Regulatory Compliance Monitoring
**Owner**: Fleet Manager
**Priority**: High
**Version**: 1.0

#### Trigger Events
- Daily compliance check job runs
- Compliance item expiration approaching (90, 60, 30 days)
- Safety audit scheduled
- Regulatory inspection required

#### Actors
- Fleet Manager (Primary)
- Compliance Manager (Secondary)
- Driver Management (Secondary)
- Maintenance Manager (Secondary)
- Regulatory Body (External)

#### Steps

1. **Monitor Compliance Status**
   - System runs daily compliance check
   - System evaluates all tracked compliance items:
     - Vehicle inspections (annual, monthly)
     - Registrations and permits
     - Driver certifications (CDL, medical)
     - Insurance policies
     - Safety certifications
     - Hazmat permits (if applicable)
     - Maintenance schedules
   - System calculates days to expiration for each item

2. **Identify Expiring Compliance Items**
   - System flags items expiring within threshold periods:
     - Critical: Expired or expires within 7 days
     - Warning: Expires within 30 days
     - Notice: Expires within 90 days
   - System generates compliance alert dashboard
   - Fleet Manager reviews compliance status

3. **Route Expiration Alerts**
   - System sends alerts to responsible parties:
     - 90 days before: Notification alert
     - 60 days before: Reminder alert
     - 30 days before: Urgent alert
     - 7 days before: Critical alert
   - Responsible parties notified:
     - Driver manager for driver certifications
     - Maintenance for vehicle inspections
     - Finance for insurance renewals
     - Fleet Manager for overall compliance

4. **Track Renewal Progress**
   - Responsible parties initiate renewal actions
   - System tracks renewal status:
     - Application submitted
     - Inspection scheduled
     - Renewal approved
     - Certificate received
   - Fleet Manager monitors critical items

5. **Review Compliance Reports**
   - Fleet Manager accesses compliance dashboard
   - Dashboard shows:
     - Current compliance status
     - Items expiring within 90 days
     - Overdue items (critical)
     - Historical compliance rate
     - Compliance trends
   - Fleet Manager generates compliance reports for:
     - Board presentations
     - Insurance renewals
     - Regulatory audits

6. **Prepare for Audits/Inspections**
   - When regulatory audit scheduled:
     - Fleet Manager gathers all compliance documentation
     - System generates audit-ready compliance package
     - Fleet Manager ensures all items current
     - Fleet Manager prepares vehicle fleet for inspection

7. **Conduct Audit/Inspection**
   - Regulatory body conducts audit/inspection
   - Fleet Manager documents any findings
   - System records audit results

8. **Address Non-Compliance**
   - If items found non-compliant:
     - Fleet Manager develops remediation plan
     - Fleet Manager submits corrective action plan
     - Fleet Manager tracks corrective actions
     - System follows up on completion

9. **Document Compliance**
   - System maintains compliance audit trail:
     - All compliance items and dates
     - Renewal documents
     - Inspection results
     - Audit findings
     - Corrective actions
   - Documents stored and easily retrievable

#### Decision Points

| Decision | Condition | Path |
|----------|-----------|------|
| **Item Expired?** | Expiration date passed | Yes: Critical escalation; No: Continue monitoring |
| **Renewal in Progress?** | Status tracked and on target | Yes: Monitor; No: Escalate |
| **Audit Scheduled?** | Regulatory inspection coming | Yes: Prepare package; No: Standard monitoring |
| **Non-Compliance Found?** | Audit identifies issues | Yes: Develop remediation; No: Continue compliance |

#### System Actions

- Run daily compliance check job
- Calculate days to expiration for all items
- Generate compliance alert dashboard
- Send expiration notifications
- Track renewal status
- Generate compliance reports
- Create audit-ready compliance package
- Maintain compliance audit trail
- Alert on critical non-compliance

#### Notifications

- **To Fleet Manager**: Daily compliance status summary
- **To Driver Manager**: Driver certification expiration alerts
- **To Maintenance Manager**: Vehicle inspection due alerts
- **To Finance Manager**: Insurance renewal alerts
- **To Fleet Manager**: Critical non-compliance alerts
- **To Regulatory Body**: Compliance documentation (upon request)

#### Exception Flows

**E1: Item Expired Without Renewal**
- System detects expired compliance item
- Critical alert sent to Fleet Manager
- Fleet Manager immediately initiates emergency renewal
- Vehicle/driver pulled from service if safety critical
- System escalates to compliance manager

**E2: Regulatory Inspection Fails**
- Audit identifies non-compliance issues
- Fleet Manager develops remediation plan
- Fleet Manager submits corrective action plan
- Fleet Manager tracks completion
- System alerts on remediation progress

**E3: Missing Documentation**
- Compliance item due for renewal, docs not located
- Fleet Manager searches document repository
- If not found: Fleet Manager requests reissue from issuer
- Fleet Manager documents timeline and follow-up

#### Success Criteria
- All compliance items tracked and monitored
- Expiration alerts sent timely
- Renewals completed before expiration
- 100% compliance maintained
- Audit-ready documentation always available
- Non-compliance issues resolved quickly

#### Related Workflows
- WF-FM-010: Safety Incident Management
- WF-FM-012: Maintenance Scheduling

---

### WF-FM-010: Safety Incident and Claims Management

**Workflow ID**: WF-FM-010
**Name**: Safety Incident and Claims Management
**Owner**: Fleet Manager
**Priority**: High
**Version**: 1.0

#### Trigger Events
- Driver reports accident or safety incident
- Third-party claim submitted
- Vehicle damage reported
- Safety violation or near-miss logged
- Insurance claim notification received

#### Actors
- Fleet Manager (Primary)
- Driver (Primary)
- Safety Manager (Secondary)
- Insurance Agent (Secondary)
- Finance Manager (Secondary)
- Legal Team (Secondary)

#### Steps

1. **Report Incident**
   - Driver reports incident immediately:
     - Safety hotline or mobile app
     - Details: Date, time, location, involved parties
     - Vehicle damage assessment
     - Photos and vehicle inspection
   - System creates incident record with auto-timestamp

2. **Immediate Response**
   - System alerts Fleet Manager of incident
   - Fleet Manager assesses severity:
     - Injury reported: Initiate medical response
     - Vehicle damage: Assign tow/repair
     - Third party involved: Notify insurance immediately
   - Fleet Manager ensures driver and public safety

3. **Gather Incident Information**
   - Fleet Manager collects incident details:
     - Detailed driver statement
     - Witness information (if third party involved)
     - Police report (if filed)
     - Vehicle damage photos
     - Scene photos
   - System stores documentation
   - Fleet Manager uploads documents to incident record

4. **Insurance Notification**
   - Fleet Manager notifies insurance carrier
   - Fleet Manager provides incident summary
   - Insurance agent initiates claim process
   - Insurance agent assigns claim number
   - System links insurance claim to incident

5. **Determine Root Cause**
   - Safety Manager investigates incident
   - Root cause analysis performed:
     - Driver error, mechanical failure, road conditions, etc.
     - Contributing factors identified
     - Pattern analysis (repeat driver, vehicle type, location)
   - System documents root cause findings

6. **Create Insurance Claim**
   - Insurance agent creates formal claim
   - Claim details entered:
     - Claim number and date
     - Estimated damage/loss amount
     - Coverage applicable
     - Reserve amount set
   - System tracks claim status

7. **Vehicle Repair**
   - If vehicle damaged, initiate repair:
     - Obtain repair estimates
     - Assign to approved repair vendor
     - Insurance approves repair cost
     - Vehicle taken to shop
   - System tracks repair progress and cost

8. **Track Claim Status**
   - Fleet Manager monitors claim progression:
     - Claim status: Reported, under review, approved, denied, paid
     - Estimate approval
     - Repair authorization
     - Final settlement
   - Insurance provides regular updates
   - System captures all communications

9. **Document Lessons Learned**
   - Safety Manager identifies improvement opportunities:
     - Driver training needed
     - Maintenance improvements
     - Process changes
     - Equipment upgrades
   - System creates improvement action items
   - Training scheduled if needed

10. **Close Claim**
    - Claim resolved with payment
    - Vehicle repaired and returned to service
    - Final settlement recorded
    - Claim marked as closed
    - System archives documentation

11. **Update Loss Ratio**
    - System calculates updated loss ratio
    - Loss ratio impacts insurance rates
    - System projects insurance renewal impact
    - Fleet Manager tracks loss ratio trends

#### Decision Points

| Decision | Condition | Path |
|----------|-----------|------|
| **Injury Reported?** | Medical attention needed | Yes: Emergency response; No: Proceed with investigation |
| **Third Party Involved?** | Other vehicle/property damaged | Yes: Police/insurance immediately; No: Internal investigation |
| **Claim Approved?** | Insurance approves coverage | Yes: Proceed with repair; No: Document denial, appeal if needed |
| **Vehicle Repairable?** | Damage economical to repair | Yes: Repair; No: Total loss declaration |

#### System Actions

- Create incident record with timestamp
- Alert Fleet Manager and Safety Manager
- Send insurance notification
- Track insurance claim status
- Store incident documentation
- Calculate loss ratio impact
- Generate safety trend reports
- Create improvement action items

#### Notifications

- **To Fleet Manager**: Incident reported, immediate action needed
- **To Safety Manager**: Incident investigation assigned
- **To Insurance Agent**: Claim notification and details
- **To Driver**: Incident acknowledgment and next steps
- **To Vehicle Repair**: Work order for vehicle repair
- **To Fleet Manager**: Claim status updates
- **To Fleet Manager**: Claim resolved and closed

#### Exception Flows

**E1: Claim Denied by Insurance**
- Insurance denies claim coverage
- Fleet Manager works with insurance to understand reason
- Fleet Manager may appeal denial
- Legal team involved if significant amount
- Fleet Manager documents impact on budget

**E2: Vehicle Total Loss**
- Damage exceeds repair threshold
- Insurance declares total loss
- Vehicle value determined and paid
- Vehicle marked for disposition
- System initiates replacement acquisition if operational need

**E3: Injury Litigation**
- Third party claims injury
- Legal team engaged immediately
- Insurance attorney assigned
- Fleet Manager provides all documentation
- System maintains confidential litigation file

**E4: Driver Violation/Recklessness**
- Investigation reveals driver negligence
- Safety Manager recommends disciplinary action
- Driver training or termination initiated
- System documents outcome
- Fleet Manager follows HR procedures

#### Success Criteria
- Incident documented and reported immediately
- Insurance claim filed and tracked
- Root cause identified
- Vehicle repaired or disposed
- Claim resolved
- Lessons learned captured
- Safety improvements implemented

#### Related Workflows
- WF-FM-009: Regulatory Compliance Monitoring
- WF-FM-011: Driver Management

---

## Strategic Planning Workflows

### WF-FM-011: Fleet Optimization Analysis

**Workflow ID**: WF-FM-011
**Name**: Fleet Optimization Analysis
**Owner**: Fleet Manager
**Priority**: Medium
**Version**: 1.0

#### Trigger Events
- Annual strategic planning cycle
- Major operational change planned
- Cost reduction initiative launched
- Utilization analysis shows optimization opportunity
- EV transition planning initiated

#### Actors
- Fleet Manager (Primary)
- Finance Manager (Secondary)
- Operations Manager (Secondary)
- Sustainability Officer (Secondary)
- Executive Management (Approver)

#### Steps

1. **Define Optimization Objectives**
   - Fleet Manager identifies optimization goals:
     - Cost reduction target (e.g., reduce TCO by 10%)
     - Utilization improvement (e.g., increase from 65% to 75%)
     - Emissions reduction (e.g., reduce CO2 by 20%)
     - Service improvement (e.g., reduce response time)
   - System documents optimization scenarios

2. **Gather Baseline Data**
   - System collects current fleet data:
     - Fleet composition (vehicle types, age, mileage)
     - Utilization rates by vehicle
     - Cost data by category
     - Emissions data
     - Performance metrics
     - Historical trends
   - System stores baseline scenario

3. **Analyze Current Performance**
   - Fleet Manager analyzes current state:
     - Vehicles contributing to high costs (cost per mile)
     - Underutilized vehicles (< 50% utilization)
     - High-maintenance vehicles
     - Vehicles exceeding emissions targets
   - System generates analysis dashboards
   - Fleet Manager identifies optimization opportunities

4. **Model Optimization Scenarios**
   - Fleet Manager creates "what-if" scenarios:
     - Scenario A: Replace high-cost vehicles with newer models
     - Scenario B: Reduce fleet size by eliminating underutilized vehicles
     - Scenario C: Transition portion of fleet to EVs
     - Scenario D: Vendor consolidation for maintenance
   - System calculates impact for each scenario:
     - Cost impact (savings/investment)
     - Utilization impact
     - Emissions impact
     - Timeline and implementation complexity

5. **Compare Scenarios**
   - Fleet Manager compares scenarios against objectives
   - System highlights:
     - Best scenario for cost reduction
     - Best scenario for utilization
     - Best scenario for sustainability
     - Balanced scenario addressing all objectives
   - Fleet Manager selects preferred scenario

6. **Calculate ROI and Payback**
   - System calculates financial impact:
     - Investment required (if vehicles to acquire)
     - Annual savings
     - Payback period
     - 5-year NPV
     - 10-year impact
   - System shows break-even timeline
   - Fleet Manager evaluates financial feasibility

7. **Develop Implementation Plan**
   - Fleet Manager creates implementation timeline:
     - Phase 1: Vehicle dispositions
     - Phase 2: Vehicle acquisitions
     - Phase 3: Vendor transitions
     - Phase 4: Measurement and optimization
   - Fleet Manager identifies milestones and dependencies
   - Fleet Manager estimates costs and resource needs

8. **Address Operational Constraints**
   - Fleet Manager evaluates constraints:
     - Service coverage requirements
     - Lead time for vehicle acquisition
     - Availability of new technology (EV infrastructure)
     - Driver training needs
     - Operational disruption risks
   - Fleet Manager develops mitigation strategies
   - System documents constraints and solutions

9. **Prepare Business Case**
   - Fleet Manager develops business case:
     - Executive summary
     - Current state analysis
     - Optimization objectives
     - Proposed scenario with rationale
     - Financial projections (ROI, payback)
     - Implementation plan and timeline
     - Risk assessment
     - Recommendation
   - System generates business case document

10. **Present to Leadership**
    - Fleet Manager presents business case to executive management
    - Fleet Manager responds to questions and concerns
    - Leadership decides: Approve, reject, or modify scenario
    - Fleet Manager documents decision

11. **Finalize and Execute**
    - If approved, Fleet Manager finalizes plan details
    - Fleet Manager creates detailed implementation tasks
    - Fleet Manager assigns owners to each task
    - System tracks implementation progress
    - Fleet Manager reports progress regularly

#### Decision Points

| Decision | Condition | Path |
|----------|-----------|------|
| **Optimization Feasible?** | Scenario achieves objectives | Yes: Calculate ROI; No: Try different scenario |
| **ROI Acceptable?** | Payback < 5 years | Yes: Prepare business case; No: Revise scenario |
| **Operational Feasible?** | Constraints can be managed | Yes: Develop implementation; No: Modify scenario |
| **Leadership Approved?** | Executive agrees on direction | Yes: Execute; No: Revise and resubmit |

#### System Actions

- Collect baseline fleet and performance data
- Model optimization scenarios with financial calculations
- Generate scenario comparison reports
- Calculate ROI and payback period
- Create business case document
- Track implementation progress
- Monitor actual results vs projections
- Generate optimization realization reports

#### Notifications

- **To Fleet Manager**: Baseline data collected, ready for analysis
- **To Finance Manager**: Business case ready for review
- **To Executive Management**: Approval request with business case
- **To Fleet Manager**: Leadership decision on optimization scenario
- **To Project Team**: Implementation tasks assigned
- **To Stakeholders**: Monthly implementation progress reports

#### Exception Flows

**E1: Scenario Doesn't Meet Objectives**
- None of the modeled scenarios meet optimization targets
- Fleet Manager revisits objectives with leadership
- Fleet Manager adjusts constraints if possible
- Fleet Manager models additional scenarios
- Fleet Manager recommends alternative approach if no good scenario exists

**E2: Implementation Challenges Arise**
- Vehicle supply delays for new acquisitions
- EV infrastructure not available in required locations
- Vendor transitions more complex than anticipated
- Fleet Manager adjusts implementation timeline
- Fleet Manager may modify scenario if necessary

**E3: Market Conditions Change**
- Fuel prices drop significantly (reducing EV ROI)
- Used vehicle prices decline (improving disposition values)
- Fleet Manager recalculates ROI impact
- Fleet Manager may recommend scenario revision

#### Success Criteria
- Multiple optimization scenarios modeled and compared
- Baseline and financial data accurately captured
- ROI and payback calculated for preferred scenario
- Implementation plan developed with realistic timeline
- Leadership approval obtained
- Implementation tracked and monitored

#### Related Workflows
- WF-FM-001: Vehicle Acquisition Planning
- WF-FM-003: Vehicle Disposition and Retirement
- WF-FM-012: Sustainability and Emissions Tracking

---

### WF-FM-012: Sustainability and Emissions Tracking

**Workflow ID**: WF-FM-012
**Name**: Sustainability and Emissions Tracking
**Owner**: Fleet Manager
**Priority**: Medium
**Version**: 1.0

#### Trigger Events
- Monthly emissions reporting cycle
- Corporate sustainability targets set
- EV transition analysis requested
- Annual sustainability report due
- Carbon offset program initiated

#### Actors
- Fleet Manager (Primary)
- Sustainability Officer (Primary)
- Finance Manager (Secondary)
- Executive Management (Secondary)

#### Steps

1. **Collect Emissions Data**
   - System collects fuel consumption data:
     - Fuel type (gasoline, diesel, hybrid, EV)
     - Gallons/liters consumed per vehicle
     - kWh consumed for EVs
     - Data source: telematics and fuel cards
   - System calculates data for reporting period (monthly/quarterly)

2. **Calculate Emissions by Vehicle**
   - System applies EPA emission factors:
     - CO2 emissions per gallon by fuel type and vehicle class
     - NOx emissions by vehicle type
     - Particulate matter (PM) emissions
   - System calculates total emissions per vehicle
   - System categorizes by vehicle type

3. **Aggregate Fleet Emissions**
   - System aggregates emissions across fleet:
     - Total CO2 emissions
     - Total NOx emissions
     - Total PM emissions
     - Emissions per mile
     - Emissions per hour
   - System compares to prior periods (month/month, year/year)

4. **Compare to Targets**
   - System compares fleet emissions to:
     - Organizational sustainability targets
     - Industry benchmarks
     - Regulatory requirements (if applicable)
     - Previous year performance
   - System identifies progress toward goals

5. **Analyze Emission Drivers**
   - Fleet Manager analyzes what drives emissions:
     - Vehicle type contribution (e.g., heavy trucks = 60% of emissions)
     - Vehicle age contribution (older vehicles = higher emissions)
     - Usage patterns (seasonal variations)
     - Operational changes
   - System provides breakdown analysis

6. **Identify Reduction Opportunities**
   - Fleet Manager evaluates reduction strategies:
     - EV adoption (with payback analysis)
     - Hybrid vehicle conversion
     - Reduced idling policies
     - Route optimization (reduces miles)
     - Driver training (eco-driving)
     - Fuel blends or alternative fuels
   - System calculates emission reduction per strategy
   - System calculates cost per ton of CO2 reduced

7. **Plan Emissions Reduction**
   - Fleet Manager develops reduction plan:
     - Specific reduction initiatives
     - Emission reduction targets (tons CO2/year)
     - Investment required
     - Timeline for implementation
     - Success metrics
   - System models carbon offset costs if needed

8. **Report Emissions**
   - System generates sustainability report:
     - Current period emissions
     - YTD emissions
     - Comparison to targets and benchmarks
     - Trend analysis
     - Reduction initiatives and progress
     - Compliance status
   - Report format: Professional PDF for stakeholders

9. **Present to Leadership**
   - Sustainability Officer presents emissions data to executive management
   - Discusses progress toward targets
   - Reviews reduction initiatives
   - Discusses EV transition timeline if applicable
   - Gets approval for new initiatives

10. **Monitor Implementation**
    - Fleet Manager tracks reduction initiatives:
      - EV acquisitions and deployment
      - Driver training completion
      - Route optimization adoption
      - Fuel blend transition
    - System tracks emissions impact of each initiative
    - Monthly reporting on initiative progress

11. **Report on Carbon Offsets**
    - If needed, arrange carbon offset purchases
    - System tracks offset purchases and credits
    - System certifies offset validity
    - System includes offset credits in sustainability reporting

#### Decision Points

| Decision | Condition | Path |
|----------|-----------|------|
| **On Track to Target?** | Emissions trend toward goal | Yes: Continue current initiatives; No: Accelerate or add initiatives |
| **EV Transition Justified?** | Financial and environmental case strong | Yes: Plan EV transition; No: Focus on other initiatives |
| **Carbon Offset Needed?** | Unable to reduce emissions enough internally | Yes: Arrange offsets; No: Continue reduction initiatives |

#### System Actions

- Collect fuel consumption and telematics data
- Apply EPA emission factors
- Calculate emissions per vehicle and fleet total
- Compare to targets and benchmarks
- Generate sustainability report
- Track reduction initiative implementation
- Calculate offset requirements if needed
- Trend analysis and forecasting

#### Notifications

- **To Fleet Manager**: Monthly emissions data collected and analyzed
- **To Sustainability Officer**: Emissions report ready for review
- **To Executive Management**: Emissions status summary
- **To Fleet Manager**: Reduction initiative progress tracking
- **To Executive Management**: Annual sustainability report
- **To Stakeholders**: Sustainability progress (quarterly/annually)

#### Exception Flows

**E1: Emissions Increasing Despite Initiatives**
- Reduction initiatives not achieving targets
- Fleet Manager investigates root cause
- Fleet Manager may accelerate other initiatives
- Fleet Manager may revisit reduction strategies
- Finance approves additional investment if needed

**E2: Regulatory Requirements Change**
- New emissions regulations enacted
- Fleet Manager updates targets and compliance requirements
- Fleet Manager accelerates reduction initiatives if needed
- Fleet Manager evaluates impact on fleet strategy

**E3: Cost of Carbon Offsets Exceeds Budget**
- Calculated offset cost exceeds approved budget
- Fleet Manager escalates to finance/management
- Fleet Manager may increase reduction initiatives to offset fewer credits needed
- Finance may approve additional budget
- Decision made: Increase initiatives or buy offsets

#### Success Criteria
- Emissions data collected and calculated accurately
- Fleet emissions compared to targets and benchmarks
- Reduction opportunities identified
- Reduction initiatives tracked and measured
- Progress toward sustainability goals documented
- Stakeholders informed of emissions status and progress

#### Related Workflows
- WF-FM-011: Fleet Optimization Analysis
- WF-FM-001: Vehicle Acquisition Planning (EV focus)

---

## Workflow Standards

### Workflow Naming Convention

**Format**: WF-[ROLE]-[###]

- **WF**: Workflow indicator
- **[ROLE]**: FM = Fleet Manager
- **[###]**: Sequential number (001-999)

### Standard Workflow Components

All workflows include:

1. **Header Information**
   - Workflow ID and Name
   - Owner and Priority
   - Version and last updated date

2. **Trigger Events**
   - What events initiate the workflow
   - Scheduled vs event-driven triggers

3. **Actors**
   - Primary actor (usually owner)
   - Secondary actors (contributors)
   - External actors (vendors, regulators)

4. **Steps**
   - Numbered steps in logical sequence
   - Decision points clearly marked
   - System actions vs manual actions identified

5. **Decision Points**
   - Table format for clarity
   - Condition, decision, and path taken
   - Alternative flows identified

6. **System Actions**
   - What the system automatically does
   - API calls, database updates
   - Integrations with other systems
   - Reports and documents generated

7. **Notifications**
   - Who is notified at each step
   - Type of notification (email, alert, dashboard)
   - Content and timing

8. **Exception Flows**
   - Alternative paths when issues arise
   - Error handling
   - Escalation procedures

9. **Success Criteria**
   - What defines successful workflow completion
   - Deliverables and outcomes

10. **Related Workflows**
    - Links to related workflows
    - Inputs and outputs between workflows

### Workflow Diagram Format

Workflows use Mermaid flowchart diagrams for visual representation:

```
graph TD
    A[Start/Trigger] -->|Condition| B[Step 1]
    B -->|Success| C[Step 2]
    B -->|Error| E[Exception Handling]
    C -->|Decision Yes| D[Step 3]
    C -->|Decision No| F[Alternative Path]
    D --> G[End/Success]
    E --> G
    F --> G
```

### Workflow Integration Points

Workflows integrate at:

- **Input**: Data/documents from prior workflows
- **Output**: Data/documents for subsequent workflows
- **Approval**: Routing to decision-makers
- **Notifications**: Multi-actor coordination
- **System Actions**: Automated integrations

### Workflow Review and Approval

All workflows follow this review process:

1. Fleet Manager documents workflow
2. Process owner reviews for accuracy
3. Stakeholders review for completeness
4. Management approves workflow
5. System administrator implements automation
6. Quarterly reviews and updates

---

## Appendix: Workflow Quick Reference

| ID | Name | Priority | Owner | Trigger |
|---|---|---|---|---|
| WF-FM-001 | Vehicle Acquisition Planning | High | Fleet Mgr | Annual planning or replacement threshold |
| WF-FM-002 | Vehicle Registration & Onboarding | High | Fleet Mgr | Vehicle delivery received |
| WF-FM-003 | Vehicle Disposition & Retirement | Medium | Fleet Mgr | End of life or total loss |
| WF-FM-004 | Fleet Budget Planning & Approval | High | Fleet Mgr | Budget cycle opens |
| WF-FM-005 | Capital Acquisition Approval | High | Fleet Mgr | Acquisition request submitted |
| WF-FM-006 | Monthly Budget vs Actual Review | Medium | Fleet Mgr | Month end or threshold breach |
| WF-FM-007 | Vendor Onboarding & Contract | Medium | Fleet Mgr | New vendor identified |
| WF-FM-008 | Vendor Performance Management | Medium | Fleet Mgr | Underperformance detected |
| WF-FM-009 | Regulatory Compliance Monitoring | High | Fleet Mgr | Daily check or audit |
| WF-FM-010 | Safety Incident & Claims | High | Fleet Mgr | Incident reported |
| WF-FM-011 | Fleet Optimization Analysis | Medium | Fleet Mgr | Strategic planning cycle |
| WF-FM-012 | Sustainability & Emissions | Medium | Fleet Mgr | Monthly reporting cycle |

---

**Document Version**: 1.0
**Last Updated**: November 11, 2025
**Next Review**: February 11, 2026

Related Documents:
- User Stories: `user-stories/01_FLEET_MANAGER_USER_STORIES.md`
- Use Cases: `use-cases/01_FLEET_MANAGER_USE_CASES.md`
- Test Cases: `test-cases/01_FLEET_MANAGER_TEST_CASES.md`

---

*Document End*
