# Fleet Manager - Use Cases

**Role**: Fleet Manager
**Access Level**: Executive (Full system access)
**Primary Interface**: Web Dashboard
**Version**: 1.0
**Date**: November 10, 2025

---

## Table of Contents
1. [Vehicle Acquisition and Disposition](#epic-1-vehicle-acquisition-and-disposition)
2. [Fleet Analytics and Performance](#epic-2-fleet-analytics-and-performance)
3. [Vendor and Contract Management](#epic-3-vendor-and-contract-management)
4. [Budget and Cost Control](#epic-4-budget-and-cost-control)
5. [Compliance and Risk Management](#epic-5-compliance-and-risk-management)
6. [Strategic Planning](#epic-6-strategic-planning)

---

## Epic 1: Vehicle Acquisition and Disposition

### UC-FM-001: Plan Vehicle Acquisition Based on Fleet Analysis

**Use Case ID**: UC-FM-001
**Use Case Name**: Plan Vehicle Acquisition Based on Fleet Analysis
**Actor**: Fleet Manager (primary), Finance Manager (secondary)
**Priority**: High

#### Preconditions:
- Fleet Manager is logged into the fleet management system
- Vehicle cost history and maintenance data are current
- Depreciation schedules and market value data are available
- Capital budget approval workflows are configured

#### Trigger:
- Fleet Manager initiates annual fleet planning process
- Vehicle reaches replacement threshold criteria
- Management requests acquisition recommendation for specific use case

#### Main Success Scenario:
1. Fleet Manager navigates to Vehicle Acquisition Planning dashboard
2. System displays fleet composition analysis:
   - Total vehicles: 287
   - Average fleet age: 6.8 years
   - Vehicles exceeding 10-year threshold: 24 vehicles
   - Vehicles exceeding 200,000 miles: 38 vehicles
3. Fleet Manager applies filter criteria:
   - Age: >8 years
   - Mileage: >150,000 miles
   - Maintenance cost trend: Increasing >15% annually
4. System displays 42 vehicles matching criteria with replacement score:
   - Vehicle #127: Replacement Score 94/100 (Critical - replace immediately)
   - Vehicle #245: Replacement Score 87/100 (High priority)
   - Vehicle #156: Replacement Score 73/100 (Medium priority)
5. Fleet Manager selects top 10 vehicles for detailed analysis
6. System generates replacement recommendations with:
   - Current book value vs estimated market value
   - Projected remaining service life: 18 months
   - Cost-benefit analysis: Repair costs vs replacement costs
   - Estimated new vehicle acquisition cost: $42,000
   - Net cost of replacement: $35,600 (after trade-in value: $6,400)
7. Fleet Manager reviews 5-year total cost of ownership (TCO) comparison:
   - Keep existing vehicle: $28,400 (fuel, maintenance, repairs, insurance)
   - Replace with new vehicle: $31,200 (acquisition, fuel, maintenance, insurance)
   - Break-even analysis: New vehicle breaks even at year 3.2
8. Fleet Manager decides to replace 10 vehicles in current budget cycle
9. Fleet Manager creates replacement list with priority order based on:
   - Utilization rate (high-use vehicles prioritized)
   - Criticality to operations
   - Budget availability
10. System calculates total acquisition budget required: $420,000
11. Fleet Manager adds justification: "Critical fleet renewal - vehicles exceeding service life with high maintenance costs"
12. System generates acquisition package including:
    - Vehicle specifications and requirements
    - Estimated costs and ROI analysis
    - Implementation timeline
    - Risk assessment
13. Fleet Manager submits acquisition request through approval workflow
14. Finance Manager reviews and approves $420,000 capital request
15. Fleet Manager exports final acquisition plan document for board presentation

#### Alternative Flows:

**A1: Acquisition for Operational Expansion**
- 1a. If acquiring vehicles for business growth:
  - Fleet Manager needs 15 additional vehicles for new service territory
  - System recommends optimal vehicle types based on use case:
    - 8 medium-duty trucks for heavy delivery
    - 5 light-duty vans for residential delivery
    - 2 specialized refrigerated units for new temperature-controlled service
  - Fleet Manager models acquisition cost impact: $585,000
  - System calculates revenue potential and payback period: 3.2 years
  - Fleet Manager submits growth acquisition request

**A2: Emergency Replacement for Accident/Damage**
- 1a. If vehicle requires emergency replacement:
  - Vehicle #245 totaled in accident - insured loss: $28,000
  - Fleet Manager initiates emergency replacement request
  - System displays available demo units and rental options
  - Fleet Manager authorizes immediate rental while new vehicle ordered
  - Rental cost: $2,500/month vs acquisition cost: $40,000
  - Fleet Manager decides to expedite new vehicle order (lead time: 8 weeks)

**A3: Green Vehicle Transition Analysis**
- 1a. If acquiring electric or alternative fuel vehicles:
  - Fleet Manager requests EV acquisition analysis
  - System models EV vs traditional vehicle costs:
    - EV cost: $55,000
    - Traditional truck cost: $42,000
    - EV fuel savings: $4,200/year
    - EV maintenance savings: $1,800/year
    - Total annual savings: $6,000
  - Payback period: 2.2 years
  - Charging infrastructure cost: $8,000 per vehicle
  - Fleet Manager includes EV transition plan in acquisition strategy

#### Exception Flows:

**E1: Insufficient Capital Budget**
- If acquisition cost exceeds available budget:
  - Requested: $420,000 | Available: $300,000 | Shortfall: $120,000
  - Fleet Manager must prioritize: Top 7 vehicles instead of 10
  - System recalculates implementation timeline
  - Fleet Manager requests budget increase or phases acquisitions across 2 years
  - Decision documented in approval workflow

**E2: Market Data Unavailable**
- If market value data cannot be retrieved:
  - System displays error: "Market value data unavailable for 5 vehicles"
  - Fleet Manager manually researches market values using NADA/KBB
  - Fleet Manager enters estimated values with "Manual Entry" flag
  - System administrator investigates market data integration failure

**E3: Depreciation Schedule Inconsistent**
- If depreciation calculations appear incorrect:
  - Vehicle #127 shows negative depreciation (increasing in value)
  - Fleet Manager reports data anomaly to finance team
  - Finance team reviews depreciation assumptions and methodology
  - System administrator corrects calculation formula
  - All fleet valuations recalculated with corrected assumptions

#### Postconditions:
- Vehicle acquisition plan is created based on objective analysis
- Acquisition budget is calculated and justified
- Replacement timeline is established
- Capital request is submitted for approval
- Stakeholders are informed of acquisition strategy

#### Business Rules:
- BR-FM-001: Vehicles >10 years or >200,000 miles flagged for replacement evaluation
- BR-FM-002: Replacement score calculated from age, mileage, and maintenance cost trends
- BR-FM-003: TCO analysis must include 5-year projection minimum
- BR-FM-004: All acquisitions >$25,000 require formal capital approval
- BR-FM-005: Acquisition plan must include risk mitigation strategy
- BR-FM-006: Market valuation data updated quarterly from NADA/KBB sources

#### Related User Stories:
- US-FM-001: Vehicle Acquisition Planning
- US-FM-010: Fleet Total Cost of Ownership (TCO) Projection

---

### UC-FM-002: Register and Onboard New Vehicles

**Use Case ID**: UC-FM-002
**Use Case Name**: Register and Onboard New Vehicles
**Actor**: Fleet Manager (primary), Procurement Manager (secondary), IT Administrator (secondary)
**Priority**: High

#### Preconditions:
- New vehicle has arrived and is ready for registration
- Vehicle delivery receipt and title are on file
- Telematics hardware is available for installation
- VIN decoder service is operational
- Vehicle maintenance schedule templates exist

#### Trigger:
- New vehicle delivery is received from dealer
- Purchase order is marked as "Received"
- Fleet Manager initiates vehicle onboarding workflow

#### Main Success Scenario:
1. Fleet Manager opens New Vehicle Registration form
2. Fleet Manager enters vehicle delivery details:
   - Dealer: Capital Fleet Sales
   - Delivery date: 11/10/2025
   - Purchase order: PO-2025-14728
   - Invoice amount: $42,500
3. Fleet Manager enters vehicle identification:
   - VIN: 1HGCB41JXMN109186
   - License plate: CTF-4827
   - Make/Model: Freightliner Cascadia 2025
   - Color: White
4. System auto-decodes VIN and retrieves vehicle specifications:
   - Year: 2025
   - Engine: Cummins ISX 15-liter
   - Transmission: Allison automatic
   - GVWR: 33,000 lbs
   - Capacity: 20 pallets
   - Telematics-ready: Yes
5. Fleet Manager uploads vehicle documentation:
   - Title document (PDF)
   - Registration certificate
   - Manufacturer warranty card
   - Bill of sale
6. Fleet Manager assigns vehicle details:
   - Fleet ID: FLT-2025-0287 (auto-generated)
   - Assigned location: Boston depot
   - Assigned use: Long-haul delivery
   - Primary driver assignment: Available (to be assigned)
7. Fleet Manager sets initial service schedule:
   - First service: 1,000 miles (oil change, inspection)
   - System generates maintenance schedule based on manufacturer recommendations
8. Fleet Manager configures telematics equipment:
   - Device type: Samsara CM32
   - Install date: 11/12/2025
   - Install location: Driver-side dashboard
   - Features: GPS, harsh driving detection, ELD compliance
9. System schedules telematics installation appointment with maintenance team
10. Fleet Manager sets insurance coverage:
    - Policy number: POL-2025-08847
    - Carrier: National Commercial Insurance
    - Coverage: $1M liability, $100K collision
    - Effective date: 11/10/2025
11. System links vehicle to insurance policy in compliance tracking
12. Fleet Manager completes asset registration:
    - Asset tag: FLT-287
    - Depreciation schedule: 5-year MACRS
    - Acquisition cost: $42,500
    - Salvage estimate: $8,500
    - Useful life: 5 years
13. System creates vehicle master record and notifies:
    - Maintenance team: Vehicle ready for initial service
    - Dispatch team: Vehicle available for assignment
    - Finance team: Asset added to fleet ledger
    - Insurance team: New vehicle under policy
14. Fleet Manager generates vehicle Welcome document with:
    - Fleet ID and specifications
    - Maintenance schedule
    - Telematics user guide
    - Safety features overview
15. System marks vehicle as "In Service - Available for Assignment"
16. Vehicle appears in available vehicle pool for dispatcher assignment

#### Alternative Flows:

**A1: Used Vehicle Acquisition and Onboarding**
- 2a. If registering pre-owned vehicle:
  - VIN: 2FRWF5GS7GA123456 (2020 Ford Transit)
  - Fleet Manager enters additional details:
    - Previous owner information
    - Service history records
    - Known maintenance issues
    - Inspection report from pre-purchase inspection
  - System flags: "Used vehicle - verify service record completeness"
  - Extended warranty documents uploaded
  - System creates preliminary maintenance catch-up schedule

**A2: Specialized Equipment Vehicle**
- 2a. If vehicle requires specialized equipment:
  - Vehicle: Refrigerated box truck (temperature-controlled)
  - Fleet Manager specifies equipment:
    - Refrigeration unit: Thermo King SB-400
    - Temperature monitoring: -20°C to +25°C
    - Backup generator: 10 kW
  - System adds specialized maintenance requirements:
    - Refrigeration unit service: Every 50 hours
    - Temperature sensor calibration: Monthly
  - Additional safety certifications required for hazmat transport

**A3: Lease vs Purchase Vehicle**
- 2a. If vehicle is leased instead of purchased:
  - Fleet Manager selects "Lease" as acquisition type
  - Lease terms entered:
    - Lessor: GE Capital Fleet Services
    - Monthly payment: $1,250
    - Lease term: 36 months
    - Mileage limit: 90,000 miles/year
  - System tracks: Mileage overage fees, maintenance obligations
  - End-of-lease residual tracking configured
  - Insurance and maintenance responsibilities documented

#### Exception Flows:

**E1: VIN Decoder Service Unavailable**
- If VIN decoding fails:
  - System displays: "VIN decoder service temporarily unavailable"
  - Fleet Manager manually enters vehicle specifications
  - Fields: Manufacturer, Model, Year, Engine, Transmission, GVWR, etc.
  - System marks record: "Manual entry - verify specs"
  - Maintenance schedule created manually or from template
  - VIN decoder service retried when available

**E2: Duplicate Vehicle Registration**
- If vehicle already exists in system:
  - System displays warning: "Fleet ID FLT-287 already exists in system"
  - Fleet Manager investigates: Is this duplicate data entry?
  - System allows linking to existing record if data entry error
  - Or allows new registration if vehicle was previously deactivated
  - Fleet manager provides context for decision

**E3: Missing Required Documentation**
- If title or registration documents cannot be located:
  - System displays: "Missing required documents: Title"
  - Fleet Manager initiates document acquisition workflow
  - Vehicle marked as "Pending Documentation" (not yet active)
  - Reminder sent daily until documents received
  - Once documents received, vehicle activated and placed in service

**E4: Telematics Installation Delay**
- If telematics equipment unavailable:
  - System alerts: "Telematics device not available until 11/15/2025"
  - Fleet Manager decides: Activate vehicle without telematics immediately (manual tracking)
  - Or delay vehicle activation until telematics installed (better data)
  - Vehicle marked: "Active - Telematics Pending" until device installed
  - Driver notified of limited tracking capability

#### Postconditions:
- Vehicle is registered in fleet management system
- Vehicle specifications and documentation are recorded
- Asset is created in accounting system
- Insurance coverage is activated
- Telematics installation is scheduled
- Vehicle is placed in available vehicle pool for assignment
- All stakeholder teams are notified of new vehicle

#### Business Rules:
- BR-FM-007: All vehicles require completed VIN registration within 48 hours of delivery
- BR-FM-008: Title and registration documents required before insurance coverage
- BR-FM-009: Telematics installation must occur before vehicle assigned to drivers
- BR-FM-010: Vehicle depreciation schedule locked upon registration (cannot be modified)
- BR-FM-011: Used vehicles require pre-purchase inspection documentation
- BR-FM-012: Specialized vehicles require additional equipment documentation and certifications

#### Related User Stories:
- US-FM-002: New Vehicle Registration

---

### UC-FM-003: Manage Vehicle Disposition and Retirement

**Use Case ID**: UC-FM-003
**Use Case Name**: Manage Vehicle Disposition and Retirement
**Actor**: Fleet Manager (primary), Finance Manager (secondary), Disposal Vendor (external)
**Priority**: Medium

#### Preconditions:
- Vehicle is marked for disposition/retirement
- Current market value data is available
- Vehicle service and repair history is complete
- Disposal vendor relationships are established
- Accounting system is updated

#### Trigger:
- Vehicle reaches end of useful life (age/mileage thresholds)
- Vehicle declared total loss due to accident
- Vehicle disposition is scheduled in fleet plan
- Vehicle becomes excess capacity

#### Main Success Scenario:
1. Fleet Manager opens Vehicle Disposition dashboard
2. Fleet Manager selects Vehicle #127 for disposition:
   - Vehicle: 2014 Freightliner Cascadia (11 years old, 287,000 miles)
   - Reason for disposition: End of useful life
   - Current status: Fully depreciated book value ($0)
3. System retrieves vehicle disposition information:
   - Complete service history: 1,247 maintenance records
   - Accident history: 1 minor incident (2019)
   - Current condition rating: Fair (cosmetic wear, mechanical sound)
4. Fleet Manager requests market valuation:
   - System queries NADA/KBB market data
   - Estimated value: $12,000-$14,500
   - Kelly Blue Book quote: $13,200
   - Fleet Manager selects realistic market value: $13,000
5. Fleet Manager selects disposition method options:
   - Option 1: Auction (expected: 90-95% of market value = $11,700-$12,350)
   - Option 2: Trade-in with new vehicle purchase (expected: 85-90% = $11,050-$11,700)
   - Option 3: Direct sale to used truck dealer (expected: 80-85% = $10,400-$11,050)
   - Option 4: Donation for tax benefit (tax value: ~$6,500 at 50% of market value)
6. Fleet Manager selects Option 1 (Auction) for best price
7. Fleet Manager generates disposition package containing:
   - Complete service history and maintenance records
   - Accident/incident reports
   - Inspection photos (interior and exterior)
   - Title and registration
   - Warranty and equipment documentation
8. System calculates disposition timeline:
   - Preparation: 5 business days
   - Auction listing: 7-10 days
   - Auction event: 1 day
   - Payment and title transfer: 5 business days
   - Total timeline: 18-21 days
9. Fleet Manager contacts approved auction house: National Auto Auction
10. Fleet Manager submits vehicle for auction with details:
    - Estimated value: $13,000
    - Reserve price: $11,000 (minimum acceptable)
    - Condition description: Fair - mechanical sound, cosmetic wear
11. System creates work order for vehicle preparation:
    - Fuel tank empty: Requirement for auction
    - Deep cleaning: Mandatory
    - Final inspection: Document any outstanding issues
    - Title/paperwork staging: Ready for transfer
12. Maintenance team completes preparation (5 days)
13. Fleet Manager delivers vehicle to auction facility
14. Auction house lists vehicle and vehicle sells at auction for $12,800
15. Fleet Manager receives disposition proceeds: $12,800
16. Fleet Manager records disposition in system:
    - Disposition method: Auction
    - Sale price: $12,800
    - Gain/(Loss) vs book value: $12,800 (fully depreciated - full gain)
    - Proceeds to: General Fleet Reserve
17. System updates accounting:
    - Asset removed from balance sheet
    - Gain recorded in P&L: $12,800
    - Cash received: $12,800
18. Vehicle moved to "Retired - Sold" status in system
19. System archives all vehicle records for historical audit trail
20. Vehicle removed from active fleet dashboard

#### Alternative Flows:

**A1: Total Loss Insurance Claim**
- 4a. If vehicle is accident damage total loss:
  - Vehicle #245 damaged in collision (repair estimate: $24,000 > 80% of value)
  - Insurance company declares vehicle total loss
  - Fleet Manager receives insurance settlement: $28,000 (pre-accident value)
  - Fleet Manager reports total loss to system
  - Vehicle moves to "Insurance Claim - Total Loss" status
  - Salvage title transferred; vehicle disposed as scrap or salvage parts
  - Insurance proceeds recorded in accounting

**A2: Trade-In with New Vehicle Purchase**
- 6a. If vehicle traded in as part of new acquisition:
  - Vehicle #156 traded in with new vehicle purchase
  - Dealer offers: $10,500 trade-in credit
  - Applied to new vehicle purchase: Reduces cost by $10,500
  - New vehicle cost: $42,000 - $10,500 = $31,500
  - Fleet Manager records trade-in in accounting
  - Vehicle title transferred to dealer; disposed through dealer network

**A3: Donation for Tax Benefit**
- 6a. If vehicle donated to charity:
  - Vehicle #089 donated to local non-profit
  - Fair market value (tax deduction): $8,500
  - Fleet Manager receives donation receipt
  - Donation recorded as charitable contribution in accounting
  - Tax benefit realized: $8,500 * 25% tax rate = $2,125 tax savings
  - Vehicle title transferred; removed from fleet

**A4: Internal Redeployment**
- 2a. If vehicle retired from main operations but used for other purpose:
  - Vehicle #203 retired from revenue service (high mileage)
  - Fleet Manager assigns vehicle to: Training/Admin use
  - Vehicle marked as "Repurposed - Training Fleet"
  - Utilization reduced but vehicle retained
  - Tracking continues for maintenance and depreciation

#### Exception Flows:

**E1: Vehicle Has Outstanding Liens**
- If vehicle has outstanding loan:
  - Vehicle #127 still has $5,000 loan balance outstanding
  - Fleet Manager must pay loan payoff before sale
  - System calculates: Sale proceeds $12,800 - Payoff $5,000 = $7,800 net
  - Finance manager approves loan payoff
  - System pays loan directly to lender from proceeds
  - Title released to Fleet Manager after payoff

**E2: Market Value Below Loan Balance (Underwater)**
- If vehicle value less than outstanding loan:
  - Vehicle #134: Loan balance $15,000 | Market value $12,000
  - Fleet Manager faces $3,000 loss to disposition
  - Fleet Manager escalates to finance manager
  - Decision: Hold vehicle for improved market conditions or accept loss
  - If disposed: Loss recorded to P&L

**E3: Title Issues or Unclear Ownership**
- If vehicle has title complications:
  - Vehicle #089: Title has lien holder name mismatch
  - Fleet Manager contacts lender to resolve title issue
  - Lender provides lien release documentation
  - Title cleared; vehicle can proceed to disposition
  - Delays disposition timeline by 5-10 days

**E4: Environmental/Hazmat Contamination**
- If vehicle requires special handling:
  - Vehicle #202: Fuel system contains environmental contamination
  - Specialized disposal required per EPA guidelines
  - Fleet Manager contacts environmental disposal contractor
  - Higher disposal cost: $2,500 vs normal $300
  - Vehicle scrap proceeds: $1,200
  - Net cost: $1,300
  - Recorded as environmental remediation expense

#### Postconditions:
- Vehicle is removed from active fleet
- Disposition proceeds are received and recorded
- Vehicle title is transferred
- Asset is removed from accounting system
- Complete disposition documentation is archived
- Fleet capacity is adjusted downward

#### Business Rules:
- BR-FM-013: Vehicles must have clear title before disposition can proceed
- BR-FM-014: Disposition method selected to maximize recovery value
- BR-FM-015: Auction reserves set at 85% of estimated market value minimum
- BR-FM-016: All disposition proceeds recorded as gains/losses against book value
- BR-FM-017: Environmental/contamination issues must be disclosed to buyer
- BR-FM-018: Disposition documents archived for 7-year audit trail

#### Related User Stories:
- US-FM-003: Vehicle Disposition Management

---

## Epic 2: Fleet Analytics and Performance

### UC-FM-004: Monitor Real-Time Fleet Dashboard and KPIs

**Use Case ID**: UC-FM-004
**Use Case Name**: Monitor Real-Time Fleet Dashboard and KPIs
**Actor**: Fleet Manager (primary), Operations Manager (secondary)
**Priority**: High

#### Preconditions:
- Fleet Manager is logged into fleet management system
- Real-time telematics data is being collected
- Dashboard is configured with relevant KPIs
- WebSocket connection is active for live updates

#### Trigger:
- Fleet Manager opens fleet dashboard at start of day
- Fleet Manager checks status during operational hours
- System auto-refreshes dashboard every 5 minutes

#### Main Success Scenario:
1. Fleet Manager navigates to Executive Fleet Dashboard
2. System displays high-level fleet metrics (real-time updates):

   **Fleet Status Overview**:
   - Total fleet size: 287 vehicles
   - Active vehicles: 242 (84%)
   - In maintenance: 28 (10%)
   - Out of service: 17 (6%)
   - On-time delivery rate today: 91%
   - Safety incidents today: 0

   **Key Performance Indicators (KPIs)**:
   - Vehicle utilization rate: 84% (target: 85%)
   - Average cost per mile: $1.24 (target: $1.18)
   - Fuel efficiency: 6.8 MPG (target: 7.2 MPG)
   - Maintenance cost YTD: $847,200 (budget: $920,000) - On track
   - Driver safety score: 87/100 (target: 85+) - Exceeding
   - On-time delivery rate: 91% (target: 90%) - Exceeding

   **Fleet Health Indicators**:
   - Vehicles requiring maintenance: 12
   - Overdue inspections: 3
   - Insurance/registration expiring in 30 days: 8 vehicles
   - Recall alerts: 1 vehicle (braking system - non-critical)

3. Fleet Manager reviews vehicle maintenance alerts:
   - Vehicle #127: Service due 11/15/2025 (scheduled)
   - Vehicle #234: Check engine light (investigate)
   - Vehicle #156: Tire replacement recommended (non-urgent)

4. Fleet Manager drills down on cost per mile trend:
   - CPM Month-to-date: $1.24
   - CPM Last month: $1.22
   - CPM Trend: Up 1.6% (variance identified)

5. Fleet Manager investigates CPM drivers:
   - Fuel cost increase: +8% (fuel prices up $0.40/gal)
   - Maintenance increase: +12% (seasonal repairs and wear)
   - Driver efficiency: -2% (route utilization down)
   - Insurance/overhead: Flat

6. Fleet Manager takes action on CPM increase:
   - Identifies fuel cost as main driver (external market)
   - Identifies maintenance increase as expected (fleet aging)
   - Addresses driver efficiency gap: Routes underutilized due to weather delays

7. Fleet Manager reviews vehicle utilization by location:
   - Boston depot: 89% utilization (good)
   - Philadelphia depot: 82% utilization (acceptable)
   - New York depot: 74% utilization (below target)

8. Fleet Manager investigates New York underutilization:
   - Reason: New service territory (ramping up)
   - Plan: Utilization expected to reach 85% within 3 months
   - Action: Monitor closely and report to operations manager

9. Fleet Manager reviews safety metrics:
   - Driver safety score: 87/100 (improving from 84 last month)
   - Hard braking events: 12 this week (down from 18 last week)
   - Speeding violations: 5 this week (down from 8)
   - Positive trend in driver behavior

10. Fleet Manager customizes dashboard to focus on:
    - On-time delivery rate (critical metric)
    - Cost per mile (budget impact)
    - Safety score (compliance and insurance)
    - Vehicle utilization (capacity planning)

11. System saves dashboard configuration to Fleet Manager profile
12. Fleet Manager exports dashboard snapshot for executive briefing
13. Report includes 30-day trend analysis and KPI comparisons

#### Alternative Flows:

**A1: Alert Triggered - Critical KPI Below Threshold**
- 4a. If performance metric falls below acceptable level:
  - On-time delivery rate drops to 82% (below 90% target)
  - System triggers red alert on dashboard
  - Fleet Manager reviews recent delivery metrics
  - Identifies: Weather delays on I-95 corridor affecting 8 routes
  - Takes action: Re-routes subsequent vehicles to alternate routes
  - Monitors metric recovery

**A2: Customize Alerts and Thresholds**
- 2a. If Fleet Manager wants to adjust alert sensitivity:
  - Fleet Manager opens Alert Settings
  - Adjusts thresholds:
    - Cost per mile: Alert if >$1.30 (was $1.25)
    - Utilization: Alert if <80% (was 85%)
    - Safety score: Alert if <80 (was 85)
  - Enables/disables specific alert types
  - Settings saved to profile

**A3: Compare Performance Across Depots**
- 7a. If comparing multi-location performance:
  - Fleet Manager selects "Depot Performance Comparison"
  - System displays parallel metrics for all depots:
    - Boston: 89% util, $1.22 CPM, 93% on-time, 89 safety score
    - Philadelphia: 82% util, $1.28 CPM, 88% on-time, 85 safety score
    - New York: 74% util, $1.31 CPM, 84% on-time, 81 safety score
  - Identifies: New York underperforming across all metrics
  - Escalates to Regional Operations Manager for improvement plan

#### Exception Flows:

**E1: Real-Time Data Feed Interrupted**
- If telematics data stream fails:
  - Dashboard displays warning: "⚠ Real-time data delayed - 15 min old"
  - System falls back to cached data with timestamp
  - Fleet Manager can still view metrics with age warning
  - System retries connection every 60 seconds
  - When restored: Dashboard refreshes with current data

**E2: Metric Calculation Error**
- If KPI shows impossible value:
  - Cost per mile shows: $0.47 (impossibly low)
  - System administrator investigates calculation error
  - Error found in fuel cost aggregation query
  - Metric recalculated with corrected formula
  - Fleet Manager notified when metric corrected

**E3: Missing Data for Trend Analysis**
- If historical comparison data unavailable:
  - System cannot display "Last month" comparison
  - Dashboard shows: "Historical data not available"
  - Fleet Manager uses current month data only
  - Data restored from backup if possible

#### Postconditions:
- Fleet Manager has current visibility into fleet health and performance
- KPIs provide early warning of issues requiring attention
- Performance trends inform operational decisions
- Dashboard data supports executive reporting
- Alerts enable proactive problem identification

#### Business Rules:
- BR-FM-019: Dashboard updates minimum every 5 minutes during business hours
- BR-FM-020: Performance alerts triggered when metrics deviate >10% from targets
- BR-FM-021: On-time delivery target is 90% (within 15-minute window)
- BR-FM-022: Fleet utilization target is 85% during operational hours
- BR-FM-023: Vehicle safety score target is 85/100 or higher
- BR-FM-024: Cost per mile baseline adjusted annually for inflation and market conditions

#### Related User Stories:
- US-FM-004: Real-Time Fleet Dashboard

---

### UC-FM-005: Analyze Cost Per Mile and Optimize Fleet Economics

**Use Case ID**: UC-FM-005
**Use Case Name**: Analyze Cost Per Mile and Optimize Fleet Economics
**Actor**: Fleet Manager (primary), Finance Manager (secondary)
**Priority**: High

#### Preconditions:
- Complete cost data is available from all sources
- Mileage data is current and accurate
- Historical baseline data exists for comparison
- Depreciation schedules are updated

#### Trigger:
- Fleet Manager reviews monthly cost performance
- Annual cost optimization initiative begins
- Cost per mile exceeds target thresholds
- Fleet Manager evaluates fleet composition changes

#### Main Success Scenario:
1. Fleet Manager opens Cost Per Mile Analysis dashboard
2. System displays CPM calculation components:
   - Fuel cost: $0.42/mile (includes fuel surcharge and energy)
   - Maintenance/repairs: $0.28/mile (includes labor and parts)
   - Tires and wear items: $0.12/mile (includes replacement and repair)
   - Insurance: $0.18/mile (includes liability, collision, physical damage)
   - Depreciation: $0.15/mile (based on vehicle age, mileage, condition)
   - Driver labor: $0.06/mile (driver cost allocation)
   - Overhead/administration: $0.03/mile (allocated corporate overhead)

   **Total Cost Per Mile: $1.24/mile**
   - Target: $1.18/mile
   - Variance: +$0.06/mile (5.1% over target)

3. Fleet Manager reviews CPM by vehicle type:
   - Long-haul truck: $1.18/mile (on target)
   - Medium-duty truck: $1.32/mile (20% over target) ⚠
   - Light-duty van: $1.08/mile (beating target)
   - Specialized refrigerated unit: $1.45/mile (high cost justified by premium service)

4. Fleet Manager investigates medium-duty truck CPM issues:
   - Vehicles: 42 medium-duty trucks in fleet
   - Main cost driver: Maintenance cost $0.38/mile (vs $0.28 fleet average)
   - Root cause: Fleet averaging 7 years old with increased breakdown frequency
   - Fuel economy: 5.8 MPG (vs 6.8 fleet average) - older engines less efficient

5. Fleet Manager models replacement scenario:
   - Replace oldest 10 medium-duty trucks (avg 8.2 years old)
   - New truck cost: $38,000
   - Current truck trade-in value: $8,000
   - Net acquisition cost: $30,000 per truck = $300,000 total
   - Expected new truck CPM: $1.15/mile
   - Current truck CPM: $1.38/mile
   - Annual savings per truck: $0.23/mile * 30,000 miles/year = $6,900
   - Total annual savings for 10 trucks: $69,000
   - Payback period: 4.3 years
   - NPV over 5-year period: $37,500 positive ROI

6. Fleet Manager approves medium-duty truck replacement plan
7. Fleet Manager reviews CPM trends over 12-month period:
   - Jan: $1.19/mile
   - Feb: $1.22/mile (up 2.5% - winter maintenance)
   - Mar: $1.18/mile (seasonal improvement)
   - Apr-Oct: Average $1.20/mile (stable)
   - Nov: $1.24/mile (current - seasonal increase)

8. Fleet Manager compares CPM to industry benchmarks:
   - Light-duty fleet benchmark: $1.10/mile
   - Medium-duty fleet benchmark: $1.28/mile
   - Heavy-duty fleet benchmark: $1.35/mile
   - Fleet Manager's fleet (mixed): $1.24/mile (performing well)

9. Fleet Manager breaks down CPM by cost category over time:
   - Fuel cost trending down (6.9 to 6.8 MPG improvement)
   - Maintenance trending up (aging fleet - expected)
   - Tire costs stable
   - Insurance stable
   - Depreciation declining (older fleet)

10. Fleet Manager identifies optimization opportunities:
    - Fuel optimization: Route optimization saves 2-3%
    - Maintenance optimization: Preventive maintenance reduces unplanned repairs 15-20%
    - Driver training: EcoDriving training improves fuel economy 3-5%
    - Fleet rightsizing: Remove underutilized vehicles
    - Vendor consolidation: Negotiate volume discounts with preferred maintenance vendors

11. Fleet Manager creates CPM improvement plan:
    - Fuel savings target: $25,000/year (2.5% improvement)
    - Maintenance savings target: $35,000/year (4% improvement)
    - Total target savings: $60,000/year (4.8% improvement)
    - Target CPM: $1.18/mile (on budget)

12. Fleet Manager exports detailed CPM analysis report:
    - 12-month trend charts
    - Vehicle-by-vehicle analysis
    - Benchmark comparisons
    - ROI analysis for replacements
    - Savings plan and timeline

#### Alternative Flows:

**A1: Cost Per Hour Analysis (Non-Mileage Vehicles)**
- 2a. If analyzing non-mileage-based vehicles (forklifts, compressors, etc.):
  - System calculates cost per hour instead of per mile
  - Includes same cost components but normalized to operation hours
  - Enables comparison across vehicle types
  - Example: Forklift costs $12.50/hour vs target $10.00/hour

**A2: Comparative Analysis - Lease vs Own**
- 10a. If evaluating lease vs purchase for fleet vehicles:
  - Owned vehicle: $1.24/mile total cost
  - Leased vehicle: $1.08/mile total cost (includes maintenance in lease)
  - Lease more cost-effective for lower-mileage applications
  - Owned better for high-utilization vehicles
  - Fleet manager decides to lease underutilized vehicles, own core fleet

**A3: Green Vehicle CPM Comparison**
- 3a. If comparing electric vehicle costs:
  - EV truck: $0.98/mile total cost (electric, lower maintenance)
  - Diesel truck: $1.24/mile total cost
  - Savings: $0.26/mile (21% cost reduction)
  - Higher acquisition cost offset by fuel/maintenance savings
  - Fleet manager approves EV pilot program with 10 vehicles

#### Exception Flows:

**E1: Incomplete Cost Data**
- If costs missing from certain vehicles:
  - System displays: "⚠ CPM calculated with 95% of data - 3 vehicles missing maintenance costs"
  - Fleet Manager notifies maintenance team to submit missing data
  - CPM recalculated when data complete
  - Flag prevents reliance on incomplete analysis

**E2: Mileage Data Inconsistent**
- If odometer readings appear incorrect:
  - Vehicle #127 shows: Mileage decreased 500 miles
  - Fleet Manager investigates: Is this data entry error?
  - Corrects mileage reading if error found
  - CPM automatically recalculated with correct data

**E3: Depreciation Schedule Outdated**
- If depreciation assumptions need updating:
  - Vehicle salvage values decreased due to market change
  - Fleet Manager requests depreciation schedule update
  - Finance team reviews and updates salvage assumptions
  - Depreciation component of CPM recalculated fleet-wide

#### Postconditions:
- Fleet Manager understands cost structure by vehicle type
- Cost per mile is compared to targets and industry benchmarks
- Optimization opportunities are identified with ROI analysis
- Fleet composition decisions are supported by cost analysis
- Continuous cost reduction initiatives are implemented

#### Business Rules:
- BR-FM-025: CPM includes all direct and allocated indirect costs
- BR-FM-026: Fuel cost includes surcharge/fuel tax adjustments
- BR-FM-027: Maintenance cost includes parts, labor, and preventive maintenance
- BR-FM-028: Depreciation calculated using straight-line method over useful life
- BR-FM-029: CPM baseline adjusted annually for inflation and market conditions
- BR-FM-030: Vehicle-specific CPM tracked for make/model/year comparison

#### Related User Stories:
- US-FM-005: Cost Per Mile Analysis

---

### UC-FM-006: Track Vehicle Utilization and Identify Underused Assets

**Use Case ID**: UC-FM-006
**Use Case Name**: Track Vehicle Utilization and Identify Underused Assets
**Actor**: Fleet Manager (primary), Operations Manager (secondary)
**Priority**: Medium

#### Preconditions:
- Telematics data shows vehicle ignition status and operating hours
- Maintenance schedules are recorded
- Historical utilization baseline exists
- Fleet capacity data is current

#### Trigger:
- Fleet Manager reviews monthly utilization metrics
- Quarterly fleet optimization review process
- Fleet Manager evaluates fleet right-sizing opportunities

#### Main Success Scenario:
1. Fleet Manager opens Vehicle Utilization Report dashboard
2. System displays overall fleet utilization metrics:
   - Fleet average utilization: 84%
   - Calculation: Total hours in use / (24 hours * days - scheduled maintenance hours)
   - Target utilization: 85%
   - Status: On target (slightly below, but acceptable)

3. Fleet Manager reviews utilization by vehicle:
   - Vehicle #127: 92% utilization (excellent - high-use vehicle)
   - Vehicle #156: 78% utilization (below target)
   - Vehicle #203: 65% utilization (well below target - idle asset)
   - Vehicle #234: 88% utilization (good)
   - Vehicle #245: 73% utilization (below target)

4. Fleet Manager drills down on underutilized vehicles:
   - Vehicle #203: 65% utilization
     - Usage pattern: Parked 6+ days per month without operation
     - Assigned to: Regional territory with low demand
     - Cost: $2,400/month in fixed costs (insurance, depreciation, overhead)
     - Annual cost: $28,800 for vehicle with limited utilization

5. Fleet Manager evaluates options for Vehicle #203:
   - Option 1: Keep - serve as backup/overflow vehicle (cost: $28,800/year)
   - Option 2: Retire - reduce fleet size (savings: $28,800/year, but reduce capacity)
   - Option 3: Reassign - move to higher-demand territory (requires operational change)
   - Option 4: Lease out - generate revenue on unused capacity

6. Fleet Manager selects Option 3 (Reassign to higher-demand territory)
7. Fleet Manager updates operations plan:
   - Reassign Vehicle #203 from Territory B to Territory A
   - Territory A has 92% utilization - will absorb #203
   - Projected new utilization for #203: 88-90%
   - Operational change approved by Operations Manager

8. Fleet Manager reviews 12-month utilization trends:
   - Jan-Feb: Average 81% (winter - lower demand)
   - Mar-Sep: Average 86-89% (peak season - high demand)
   - Oct-Nov: Average 83-84% (seasonal decline)
   - Dec: Typically drops to 78% (holiday period)

9. Fleet Manager models utilization impact of fleet changes:
   - Current fleet: 287 vehicles at 84% average utilization
   - If retire 8 underutilized vehicles:
     - New fleet size: 279 vehicles
     - Projected utilization: 87% (improved)
     - Annual cost savings: $230,400
     - Slight capacity reduction but better overall efficiency

10. Fleet Manager prepares utilization optimization proposal:
    - Retire 8 vehicles with <70% utilization
    - Reassign 6 vehicles to higher-demand territories
    - Target new fleet utilization: 87%
    - Expected annual savings: $230,400
    - Timeline: 3-month implementation

11. Fleet Manager submits proposal to Executive Committee
12. Committee approves utilization optimization plan
13. Fleet Manager creates implementation plan with Operations Manager
14. System monitors actual utilization weekly during implementation

#### Alternative Flows:

**A1: Seasonal Utilization Pattern**
- 8a. If vehicle utilization varies significantly by season:
  - Vehicle #145: Summer utilization 95% | Winter utilization 42%
  - Fleet Manager models seasonal staffing patterns
  - Option: Lease seasonal vehicle instead of owning year-round
  - Or: Reassign seasonal vehicle to stable-demand territory during low season

**A2: New Vehicle or Startup Territory**
- 3a. If analyzing utilization during ramp-up period:
  - New territory launched with Vehicle #287
  - Current utilization: 35% (startup phase)
  - Expected ramp: 50% month 1, 70% month 2, 85% month 3
  - Fleet Manager tracks actual vs projected ramp
  - Reassessment scheduled for month 4

**A3: Backup/Emergency Vehicle Fleet**
- 6a. If maintaining intentionally underutilized backup vehicles:
  - Vehicle #089: 25% utilization (emergency backup fleet)
  - Fleet Manager justifies: Need 2 backup vehicles for emergency response
  - Cost justified as insurance against breakdowns: $24,000/year
  - Tracks actual emergency usage: 3 times per month average

#### Exception Flows:

**E1: Telematics Data Incomplete**
- If utilization data missing:
  - Vehicle #156: No telematics data for November (device offline)
  - System flags: "Utilization for #156 incomplete - based on October baseline"
  - Fleet Manager contacts IT to repair telematics
  - Recalculates utilization once data restored

**E2: Scheduled Maintenance Distorting Utilization**
- If excessive scheduled maintenance reduces available hours:
  - Vehicle #178: In scheduled service 40% of available days
  - Fleet Manager adjusts utilization calculation: Excludes scheduled maintenance
  - True utilization: 92% of available hours (when not in maintenance)
  - Identifies: Excessive maintenance schedule (may reduce frequency)

**E3: Utilization Data Shows Data Quality Issues**
- If calculations appear incorrect:
  - Vehicle #234 shows: 150% utilization (impossible - max 100%)
  - Fleet Manager reports calculation error
  - System administrator investigates: Finds duplicate hour counting
  - Recalculation corrects error; vehicle shows actual 84% utilization

#### Postconditions:
- Fleet Manager understands vehicle utilization across fleet
- Underutilized assets are identified for optimization
- Fleet right-sizing decisions are supported with data
- Capacity utilization trends inform acquisition/disposition decisions
- Fleet optimization initiatives improve asset efficiency

#### Business Rules:
- BR-FM-031: Utilization calculated as (hours in use / available hours) * 100%
- BR-FM-032: Available hours exclude scheduled maintenance and planned downtime
- BR-FM-033: Target utilization is 85% for operating fleet
- BR-FM-034: Vehicles <60% utilization flagged for optimization review
- BR-FM-035: Emergency/backup fleet may intentionally operate below target utilization
- BR-FM-036: Utilization trends monitored monthly; significant changes reviewed

#### Related User Stories:
- US-FM-006: Utilization Rate Reporting

---

## Epic 3: Vendor and Contract Management

### UC-FM-007: Track Vendor Performance and Manage Contracts

**Use Case ID**: UC-FM-007
**Use Case Name**: Track Vendor Performance and Manage Contracts
**Actor**: Fleet Manager (primary), Procurement Manager (secondary)
**Priority**: Medium

#### Preconditions:
- Vendor master data is current and complete
- Work order and maintenance history data exists
- Vendor performance metrics are being collected
- Contract terms and conditions are documented

#### Trigger:
- Fleet Manager begins vendor performance review process
- Contract renewal date approaches
- Performance issues identified with vendor
- Competitive bid process initiated

#### Main Success Scenario:
1. Fleet Manager opens Vendor Management dashboard
2. System displays all active vendors with contract status:
   - Vendor A: ABC Tire Services
     - Contract expiration: 03/31/2026 (4.5 months remaining)
     - Status: Active
     - Total annual spending: $187,200
   - Vendor B: Capital Truck Repair
     - Contract expiration: 12/31/2025 (pending renewal)
     - Status: Active
     - Total annual spending: $423,600
   - Vendor C: Oil Change Express
     - Contract expiration: 06/30/2025 (EXPIRED - 4 months past)
     - Status: Inactive
     - Total annual spending: $24,100

3. Fleet Manager creates alert: Vendor C contract expired - need renewal or replacement
4. Fleet Manager reviews vendor performance metrics for Capital Truck Repair:
   - Work orders completed: 342 in 12 months
   - Average turnaround time: 2.4 days (target: 2.0 days)
   - Quality rating (1-5 scale): 4.2 (good)
   - On-time completion rate: 91% (target: 95%)
   - Cost variance: -2% (actual costs 2% below quoted estimates)
   - Customer satisfaction: 4.3/5.0 (good)

5. Fleet Manager drills down on performance issues:
   - Turnaround time slightly above target (2.4 vs 2.0 days)
   - Root cause: Resource constraints during peak season
   - Pattern: Delays primarily Aug-Oct (peak maintenance season)
   - On-time completion 91% (4% below target)

6. Fleet Manager compares Capital Truck Repair to competitors:
   - Competitor A: Avg turnaround 1.8 days, quality 4.5, cost +5%
   - Competitor B: Avg turnaround 2.8 days, quality 3.8, cost -8%
   - Current vendor (Capital Truck): 2.4 days, 4.2 quality, cost -2%
   - Assessment: Capital Truck acceptable; slight improvement opportunity

7. Fleet Manager initiates contract renewal negotiation:
   - Current contract terms:
     - Volume discount: 15% on published rates
     - Payment terms: Net 30
     - Performance guarantee: 95% on-time completion
     - Annual price increase cap: 3%
   - New contract proposed terms:
     - Volume discount: 18% (improved - based on continued volume)
     - Payment terms: Net 45 (improved cash flow)
     - Performance guarantee: 95% on-time completion (firm requirement)
     - Annual price increase cap: 2.5% (tighter control)

8. Fleet Manager sends renewal proposal to Capital Truck Repair
9. Vendor negotiates terms; final agreement reached:
   - Volume discount: 17% (between initial 15% and requested 18%)
   - Payment terms: Net 45 (accepted)
   - Performance guarantee: 95% on-time (accepted)
   - Annual price increase cap: 2.5% (accepted)
   - Contract period: 3 years (expires 12/31/2028)

10. Fleet Manager documents vendor scorecard for renewal:
    - Performance summary: 4.2/5.0 overall
    - Strengths: Competitive pricing, good quality, responsive
    - Improvement areas: Turnaround time during peak season
    - Condition for renewal: Hire seasonal staff to reduce peak-season delays
    - Risk assessment: Low (established vendor, good performance)

11. System sends 90-day renewal notice to Oil Change Express:
    - Current contract expired 4 months ago
    - Fleet Manager decides to replace with new vendor (contract lapsed)
    - System initiates RFP (Request for Proposal) process
    - Sent to 5 competitive vendors for pricing and terms

12. Three vendors respond to RFP:
    - Vendor response summary:
      - Vendor D: $18,500/year, 95% on-time, quality 4.3
      - Vendor E: $22,100/year, 98% on-time, quality 4.6
      - Vendor F: $16,800/year, 88% on-time, quality 3.9

13. Fleet Manager evaluates RFP responses:
    - Best price: Vendor F ($16,800) but lowest quality (3.9)
    - Best quality: Vendor E ($22,100) with excellent on-time (98%)
    - Best value: Vendor D ($18,500) with good quality (4.3) and on-time (95%)

14. Fleet Manager selects Vendor D (best overall value)
15. Fleet Manager negotiates final contract terms:
    - Annual cost: $18,500 (20% reduction from expired contract)
    - Contract term: 2 years
    - On-time completion guarantee: 95%
    - Quality: 4.3+ average rating
    - Effective date: 12/01/2025

16. Fleet Manager documents vendor transition:
    - Current vendor (Oil Change Express): Services end 11/30/2025
    - New vendor (Vendor D): Services begin 12/01/2025
    - Notification sent to maintenance team of vendor change
    - Account setup completed with new vendor

#### Alternative Flows:

**A1: Underperforming Vendor Termination**
- 4a. If vendor performance significantly deteriorates:
  - Vendor performance score drops from 4.2 to 2.8 (quality issues)
  - Multiple customer complaints about poor repair quality
  - Fleet Manager documents performance issues
  - Fleet Manager provides formal notice to vendor: 30-day cure period
  - If issues not resolved: Initiate vendor termination
  - RFP sent to replacement vendors
  - Transition to new vendor within 60 days

**A2: Vendor Contract Amendment**
- 7a. If contract terms need mid-term adjustment:
  - Circumstances change: Fleet service territory expanded by 20%
  - Volume increases from 300 to 360 service events annually
  - Fleet Manager requests volume discount increase
  - Negotiates: Volume discount improved from 15% to 18%
  - Contract amendment signed; pricing adjusted retroactive

**A3: Emergency Vendor Addition**
- 1a. If specialized service needed outside current vendors:
  - Fleet needs emergency refrigeration unit repair (specialized)
  - No current vendor provides this service
  - Fleet Manager conducts quick search for specialists
  - Single vendor identified and emergency contract negotiated
  - Short-term contract (6 months) while evaluating long-term partnership

#### Exception Flows:

**E1: Performance Data Missing or Incomplete**
- If vendor metrics cannot be calculated:
  - Vendor D: Only 3 months of history (too new to evaluate)
  - System displays: "⚠ Insufficient data - re-evaluate after 12 months"
  - Fleet Manager makes renewal decision based on available data
  - Full assessment planned for 12-month anniversary

**E2: Vendor Violates Contract Terms**
- If vendor fails to meet performance guarantees:
  - Capital Truck Repair: On-time completion rate drops to 78% (vs 95% guaranteed)
  - Fleet Manager documents breach: "Multiple late completions - safety-critical repairs delayed"
  - Fleet Manager invokes contract remedy: 5% penalty on invoices
  - Provides formal corrective action notice: 30-day improvement period
  - If not improved: Proceed with vendor replacement

**E3: Contract Termination for Convenience**
- If Fleet Manager wants to replace vendor despite acceptable performance:
  - Competitor offers significantly better pricing: 25% reduction
  - Fleet Manager exercises contract termination clause
  - Provides required 60-day notice to current vendor
  - Transition plan implemented for smooth vendor change

#### Postconditions:
- Vendor performance is monitored and documented
- Contract renewal decisions are supported with performance data
- Vendor agreements are updated and enforceable
- Competitive pricing is maintained through periodic RFPs
- Underperforming vendors are identified and managed

#### Business Rules:
- BR-FM-037: All vendors tracked with performance scorecards (quality, cost, timeliness)
- BR-FM-038: Contract renewals initiated 90 days before expiration
- BR-FM-039: Performance bonuses/penalties applied based on achievement of metrics
- BR-FM-040: Vendor RFPs sent for contracts >$100K annually
- BR-FM-041: Vendor changes require 30-day transition notice minimum
- BR-FM-042: All vendor agreements document performance guarantees and remedies

#### Related User Stories:
- US-FM-007: Vendor Performance Tracking

---

### UC-FM-008: Analyze Parts Pricing and Negotiate Vendor Rates

**Use Case ID**: UC-FM-008
**Use Case Name**: Analyze Parts Pricing and Negotiate Vendor Rates
**Actor**: Fleet Manager (primary), Procurement Manager (secondary)
**Priority**: Low

#### Preconditions:
- Purchase order and parts invoicing data is complete
- Vendor pricing catalogs are available
- Historical pricing data exists for comparison
- Market pricing benchmarks are available

#### Trigger:
- Fleet Manager reviews parts cost trends
- Parts price increases noticed on invoices
- Annual vendor pricing negotiation period
- Significant fleet parts consumption identified

#### Main Success Scenario:
1. Fleet Manager opens Parts Pricing Analysis dashboard
2. System displays annual parts spending summary:
   - Total annual parts spending: $287,400
   - Number of different parts ordered: 1,247
   - Number of vendors: 12 primary vendors
   - Most frequently ordered parts:
     - Motor oil: 240 cases/year @ $18.50 = $4,440
     - Air filters: 180 units/year @ $22.75 = $4,095
     - Diesel filters: 156 units/year @ $28.50 = $4,446
     - Brake pads: 120 sets/year @ $125.00 = $15,000
     - Tires: 480 units/year @ $285.00 = $136,800

3. Fleet Manager reviews pricing trends for motor oil:
   - 12 months pricing history:
     - Jan: $18.50/case
     - Feb: $18.75/case (+1.4%)
     - Mar: $19.00/case (+1.3%)
     - Apr-Aug: $19.25/case (stable)
     - Sep: $19.50/case (+1.3%)
     - Oct: $19.75/case (+1.3%)
     - Nov: $20.00/case (+1.3%)
   - Trend: Consistent 1.3% monthly increases (cumulative 8% annual increase)
   - Root cause: Crude oil prices increase + vendor cost pass-through

4. Fleet Manager analyzes motor oil cost impact:
   - Current monthly volume: 20 cases
   - Current annual cost: 240 * $20.00 = $4,800
   - January cost would have been: 240 * $18.50 = $4,440
   - Annual increase: $360 (8.1% cost increase)

5. Fleet Manager compares vendors for motor oil:
   - Current vendor (Vendor A): $20.00/case (premium brand, fast delivery)
   - Competitor B: $18.75/case (good brand, standard delivery)
   - Competitor C: $17.50/case (economy brand, slow delivery)
   - Savings potential with Competitor B: $2.25 * 240 = $540/year (11% savings)
   - Quality trade-off: Lower-quality oil may reduce engine life

6. Fleet Manager investigates brake pad pricing:
   - Annual spending: $15,000 for 120 sets @ $125/set
   - Vendor pricing comparison:
     - Current vendor: $125.00/set (OEM quality, fast delivery)
     - Competitor A: $108.50/set (aftermarket quality, standard delivery)
     - Competitor B: $95.25/set (economy quality, slow delivery)
   - Savings potential with Competitor A: $16.50 * 120 = $1,980/year (13% savings)
   - OEM quality justified for premium service; aftermarket acceptable for standard fleet

7. Fleet Manager develops parts vendor consolidation strategy:
   - Current: 12 vendors for scattered purchasing
   - Proposed: 3 primary vendors with volume discounts
   - Strategy benefits:
     - Volume discount from primary vendors: 8-12% reduction
     - Simplified vendor management
     - Improved pricing power through consolidated volume
     - Estimated annual savings: $32,000-$42,000 (11-15%)

8. Fleet Manager prepares vendor consolidation proposal:
   - Identify top 3 parts vendors (by current volume):
     - Vendor A: Current spending $98,200 (34% of total)
     - Vendor B: Current spending $76,400 (27% of total)
     - Vendor C: Current spending $54,300 (19% of total)
   - Request consolidation RFP: 12-15% volume discount for 80%+ of fleet parts

9. Vendors respond with volume pricing:
   - Vendor A: Offers 12% discount if 40%+ of volume consolidated
   - Vendor B: Offers 14% discount if 35%+ of volume consolidated
   - Vendor C: Offers 10% discount if 25%+ of volume consolidated

10. Fleet Manager evaluates consolidation options:
    - Option 1: Consolidate with Vendor B (14% discount on $98K = $13,720/year savings)
    - Option 2: Split between A and B (average 13% = $21,450/year savings)
    - Option 3: Split between A, B, and C (average 12% = $19,200/year savings)
    - Selected: Option 2 (A and B) - balance purchasing power and vendor diversity

11. Fleet Manager negotiates final consolidation agreement:
    - Vendor A: $98K volume, 12% discount = $11,760/year savings
    - Vendor B: $76K volume, 14% discount = $10,640/year savings
    - Total savings: $22,400/year (7.8% overall cost reduction)
    - Other vendors: Retained for specialty items (5% of volume)

12. Fleet Manager creates parts vendor transition plan:
    - Effective date: 01/01/2026 (next calendar year)
    - Transition period: 60 days to move volume from other vendors
    - Communication: Maintenance team trained on new vendor catalogs
    - System: Parts purchasing rules updated for preferred vendors

#### Alternative Flows:

**A1: Identify Alternative Parts for Cost Reduction**
- 5a. If substitute parts can reduce costs:
  - Brake pads: OEM brand $125 vs equivalent aftermarket $95
  - Fleet Manager evaluates: Quality, warranty, lifetime cost
  - Aftermarket pads: 15% shorter life but 24% lower cost
  - Cost per mile: OEM $0.076 | Aftermarket $0.059 (savings 22%)
  - Fleet Manager approves aftermarket parts for fleet vehicles

**A2: Bulk Purchase Discount Negotiation**
- 8a. If high-volume purchase available:
  - Fleet Manager has 480 tires to purchase (winter seasonal need)
  - Vendor offers: $285/tire (regular) vs $260/tire (bulk 500+ order)
  - Bulk savings: 25 * 480 = $12,000
  - Fleet Manager commits to bulk order; saves $12,000

**A3: Parts Supplier Consolidation Failure**
- 10a. If preferred vendor cannot meet service needs:
  - Vendor B selected for consolidation but quality issues appear
  - Fleet Manager evaluates: Switch back to original vendors vs work with Vendor B
  - Discovers: Vendor B using lower-quality suppliers (not optimal)
  - Fleet Manager terminates consolidation agreement (negotiates exit)
  - Returns to dispersed vendor model with quality prioritized

#### Exception Flows:

**E1: Pricing Data Incomplete or Inaccurate**
- If parts pricing history missing:
  - Motor oil pricing: Missing 3 months of history (Jun-Aug 2024)
  - Trend analysis incomplete
  - Fleet Manager extrapolates missing months based on available data
  - Flag for manual verification once data complete

**E2: Vendor Refuses to Provide Bulk Discount**
- If consolidation negotiation fails:
  - Vendor declines 12% volume discount request
  - Cites: "Margin already thin; cannot reduce further"
  - Fleet Manager options: Accept no-discount consolidation or stay dispersed
  - Fleet Manager decides to maintain dispersed model (retains competitive pricing)

**E3: Quality Issues With Lower-Cost Alternative**
- If economy parts underperform:
  - Aftermarket brake pads fail prematurely (50% life of OEM pads)
  - Unplanned replacement costs offset savings
  - Fleet Manager reverts to OEM parts; accepts higher cost for reliability

#### Postconditions:
- Fleet Manager understands parts spending by category and vendor
- Parts pricing trends are identified and analyzed
- Vendor consolidation opportunities are identified with ROI
- Preferred vendor agreements include volume discounts
- Parts cost reduction initiatives are implemented

#### Business Rules:
- BR-FM-043: All parts purchases tracked by part type and vendor
- BR-FM-044: Pricing history maintained for minimum 24 months
- BR-FM-045: Volume consolidation RFPs sent annually for major parts categories
- BR-FM-046: OEM vs aftermarket parts evaluated for cost vs quality trade-off
- BR-FM-047: Parts vendor agreements include price increase caps (3% annual max)
- BR-FM-048: Emergency purchases outside preferred vendors require approval

#### Related User Stories:
- US-FM-008: Parts Pricing Analysis

---

## Epic 4: Budget and Cost Control

### UC-FM-009: Track Budget vs Actual Spending and Manage Variances

**Use Case ID**: UC-FM-009
**Use Case Name**: Track Budget vs Actual Spending and Manage Variances
**Actor**: Fleet Manager (primary), Finance Manager (secondary)
**Priority**: High

#### Preconditions:
- Annual fleet budget is approved and entered into system
- Actual spending data is current and complete
- Cost accounting categories are standardized
- Variance approval authority is defined

#### Trigger:
- Fleet Manager reviews monthly budget performance
- Significant variance (>10%) occurs for any category
- Mid-year budget review process
- End-of-quarter financial reporting

#### Main Success Scenario:
1. Fleet Manager opens Budget vs Actual dashboard
2. System displays annual budget summary (YTD - 10 months of fiscal year):

   **Annual Fleet Budget: $2,847,000**

   **Budget Performance (YTD - 10 months)**:
   - Fuel: Budget $750,000 | Actual $795,200 | Variance +$45,200 (+6.0%) ⚠
   - Maintenance/Repairs: Budget $580,000 | Actual $567,300 | Variance -$12,700 (-2.2%) ✓
   - Tires/Wear Items: Budget $120,000 | Actual $118,900 | Variance -$1,100 (-0.9%) ✓
   - Driver Salaries: Budget $650,000 | Actual $652,100 | Variance +$2,100 (+0.3%) ✓
   - Insurance: Budget $280,000 | Actual $280,000 | Variance $0 (0.0%) ✓
   - Registration/Permits: Budget $48,000 | Actual $47,200 | Variance -$800 (-1.7%) ✓
   - Equipment/Telematics: Budget $85,000 | Actual $82,400 | Variance -$2,600 (-3.1%) ✓
   - Depreciation: Budget $354,000 | Actual $354,000 | Variance $0 (0.0%) ✓

   **Total YTD Spending: $2,897,100 vs Budget $2,813,000 | Variance +$84,100 (+3.0%) ⚠**

3. Fleet Manager reviews fuel cost variance in detail:
   - YTD fuel budget: $750,000 (for 10 months = $75,000/month average)
   - YTD actual: $795,200 (= $79,520/month average)
   - Monthly variance: Average +$4,520/month

4. Fleet Manager investigates fuel cost variance drivers:
   - Fuel consumption (gallons): On target (no significant variance)
   - Fuel price per gallon: Actual $3.85 | Budget $3.45 | Variance +$0.40/gal (+11.6%)
   - Root cause: Fuel prices increased more than budgeted (market conditions)
   - Assessment: Variance due to external market factors, not operational inefficiency

5. Fleet Manager models fuel cost for remaining 2 months:
   - Forecast fuel prices: Remain at $3.85/gal through end of year
   - Projected remaining fuel cost (2 months): $159,040
   - Annual projected total: $795,200 + $159,040 = $954,240
   - Annual budget: $750,000
   - Projected year-end variance: +$204,240 (+27.2% over budget) ⚠

6. Fleet Manager evaluates fuel cost variance management options:
   - Option 1: Accept variance and report to executive (fuel price inflation)
   - Option 2: Reduce fuel consumption through efficiency initiatives (2-3% possible savings)
   - Option 3: Reduce other categories to offset fuel overage (trade-offs with other budgets)
   - Option 4: Request budget increase from Finance (provide market justification)

7. Fleet Manager selects Option 4 (Budget increase request with justification):
   - Rationale: Fuel prices beyond fleet manager's control (external market factor)
   - Supporting data: Fuel price increase $0.40/gal (11.6%) above budget
   - Projected impact: $204,240 additional annual cost
   - Request: Approval for fuel budget increase to $954,240
   - Contingency: Will implement efficiency initiatives to minimize further overage

8. Finance Manager reviews budget increase request:
   - Validates fuel price increases: Confirms $0.40/gal premium is accurate
   - Checks operational efficiency: Fleet miles on budget (no efficiency loss)
   - Approves partial increase: New fuel budget $900,000 (split difference with fleet manager)
   - Remaining variance ($54,240) to be managed through cost reduction initiatives

9. Fleet Manager adjusts budget and implements cost reduction initiatives:
   - Approved new fuel budget: $900,000
   - Remaining projected variance: $54,240
   - Cost reduction targets:
     - Fuel efficiency improvements: -2% consumption ($19,000 savings)
     - Equipment cost reductions: -$15,000 (defer non-critical equipment)
     - Maintenance efficiency: -$20,240 (preventive maintenance reduces emergency repairs)
   - Total mitigation target: $54,240 (aligns spending with adjusted budget)

10. Fleet Manager establishes monthly fuel cost monitoring:
    - Monthly fuel budget reset: $75,000
    - Alert threshold: >$80,000 in any month
    - Monthly reporting to Finance Manager
    - Variance tracking to identify trends

11. Fleet Manager reviews maintenance variance (positive variance):
    - YTD maintenance budget: $580,000
    - YTD actual: $567,300
    - Positive variance: -$12,700 (under budget)
    - Analysis: Preventive maintenance program working well
    - Fewer emergency repairs than expected
    - Fleet Manager notes: Continue current maintenance approach (cost-effective)

12. Fleet Manager projects year-end budget performance:
    - Fuel (adjusted): -$54,240 (after efficiency and budget adjustments)
    - Maintenance (actual): -$12,700 (under budget - continue)
    - Other categories: Tracking to budget
    - Projected year-end variance: Neutral to slight positive (on budget)

#### Alternative Flows:

**A1: Significant Budget Overage Requiring Immediate Action**
- 5a. If variance exceeds 15% for critical category:
  - Maintenance costs: Budget $580K | Actual $695K | Variance +$115K (+19.8%) ⚠⚠
  - Fleet Manager investigates: Unexpected major repairs
  - Root cause: 3 vehicle engine failures (unexpected failures - not age-related)
  - Assessment: These are non-recurring; unlikely to repeat same failures
  - Action: Submit variance explanation to Finance
  - Approval: One-time budget relief due to extraordinary repairs
  - Process improvement: Enhanced pre-purchase inspections for used vehicles

**A2: Favorable Variance - Opportunity to Reinvest Savings**
- 11a. If positive variance identified (spending below budget):
  - Equipment budget: $85K | Actual $67K | Savings: $18K (21%)
  - Fleet Manager identifies: Deferred telematics upgrades (will implement later)
  - Fleet Manager proposes: Reinvest $15K savings into critical maintenance backlog
  - Finance Manager approves reallocation
  - Improves fleet reliability without increasing overall spending

**A3: Mid-Year Budget Reforecast**
- 1a. If significant changes occur mid-year:
  - Unexpected: Fuel prices drop $0.50/gal (after initial increase)
  - Fleet Manager reforecasts: Fuel budget should be $650K for year (vs $750K original)
  - Finance Manager approves: Reduce fuel budget; reallocate $100K to maintenance reserves
  - More dynamic budget management reflects market conditions

#### Exception Flows:

**E1: Actual Cost Data Missing or Delayed**
- If monthly close-out not complete:
  - October actual spending: Not yet recorded by Finance
  - System displays: "⚠ October actual costs pending - September data current"
  - Fleet Manager uses September data for analysis
  - October estimated based on historical trends
  - October variance finalized once Finance processes data

**E2: Budget Categories Inconsistently Coded**
- If spending allocated to wrong budget categories:
  - Maintenance costs overstated; Equipment costs understated
  - Fleet Manager investigates: Discovers coding errors in cost allocation
  - Finance Administrator corrects historical allocation
  - Budget variance recalculated with corrected data
  - Process improvement: Strengthen cost coding controls

**E3: Budget Approved Mid-Year (Changed Circumstances)**
- If budget becomes outdated due to operational changes:
  - New service territory added mid-year (fleet size increased from 287 to 310)
  - Original budget designed for 287-vehicle fleet
  - Fleet Manager requests budget adjustment for 23 additional vehicles
  - Finance Manager approves pro-rata budget increase for 6 remaining months

#### Postconditions:
- Fleet Manager has current visibility into budget performance
- Cost variances are identified and explained
- Corrective actions are implemented for budget overages
- Budget is adjusted for significant market/operational changes
- Year-end spending aligns with approved budget

#### Business Rules:
- BR-FM-049: Budget variances >10% require written explanation
- BR-FM-050: Budget variances >15% require Finance Manager approval
- BR-FM-051: Mid-year budget adjustments limited to extraordinary circumstances
- BR-FM-052: Cost allocation errors corrected retroactively to prior months
- BR-FM-053: Monthly budget reviews conducted by 5th of following month
- BR-FM-054: Year-end budget reconciliation completed by 30 days after fiscal year-end

#### Related User Stories:
- US-FM-009: Budget vs Actual Tracking

---

### UC-FM-010: Model Total Cost of Ownership and Support Capital Planning

**Use Case ID**: UC-FM-010
**Use Case Name**: Model Total Cost of Ownership and Support Capital Planning
**Actor**: Fleet Manager (primary), Finance Manager (secondary), Executive Committee (secondary)
**Priority**: Medium

#### Preconditions:
- Historical cost data for similar vehicles is available
- Fleet utilization projections are defined
- Fuel price forecasts are available
- Capital approval workflow is configured

#### Trigger:
- Fleet Manager evaluates new vehicle acquisition options
- Annual capital planning process begins
- Major fleet composition change is under consideration
- EV transition analysis is requested

#### Main Success Scenario:
1. Fleet Manager initiates TCO (Total Cost of Ownership) analysis for vehicle replacement decision
2. Fleet Manager defines analysis scenario:
   - Decision: Replace 10 medium-duty trucks (2014-2016 vintage)
   - Current truck: Freightliner M2 diesel (7-9 years old, 200K+ miles)
   - Replacement options to evaluate:
     - Option A: Diesel truck (traditional replacement)
     - Option B: Electric truck (new technology)
     - Option C: Hybrid truck (emerging option)

3. Fleet Manager enters vehicle specifications and assumptions:
   - Analysis period: 5 years
   - Annual mileage: 35,000 miles (typical for medium-duty)
   - Fuel prices: $3.50/gal (diesel), $0.15/kWh (electricity) - escalating 2%/year
   - Maintenance cost escalation: 3%/year (inflation)
   - Inflation rate: 2.5%/year
   - Discount rate (cost of capital): 8%/year

4. System displays TCO component data for each option:

   **Option A: New Diesel Truck (Freightliner M2 2025)**
   - Acquisition cost: $42,000
   - Residual value (5 years, 175K miles): $14,500
   - Net acquisition cost: $27,500

   **Fuel Costs (5-year totals)**:
   - Annual miles: 35,000
   - Total miles over 5 years: 175,000
   - Fuel consumption: 25 MPG average
   - Gallons consumed: 7,000 gallons
   - Fuel cost: 7,000 gal * $3.50/gal (avg) = $24,500

   **Maintenance Costs (5-year totals)**:
   - Year 1: $2,500 (scheduled maintenance)
   - Years 2-5: Increasing $2,500 per year (age-related)
   - Total maintenance: $15,000
   - Plus unexpected repairs: $3,500 (estimated reserves)
   - Total maintenance budget: $18,500

   **Insurance (5-year totals)**:
   - Annual premium: $1,800
   - 5-year total: $9,000

   **Depreciation/Loss on Sale**:
   - Acquisition: $42,000
   - Residual value: $14,500
   - Depreciation: $27,500 (already counted in net acquisition cost)

   **Total 5-Year TCO - Option A (Diesel)**:
   - Net acquisition: $27,500
   - Fuel: $24,500
   - Maintenance: $18,500
   - Insurance: $9,000
   - **Total: $79,500 per vehicle**
   - **Cost per mile: $0.454/mile**

5. Fleet Manager evaluates Option B: New Electric Truck:
   - Acquisition cost: $58,000 (premium for electric drivetrain)
   - Residual value (5 years): $18,000 (better residual for newer tech)
   - Net acquisition cost: $40,000

   **Energy Costs (5-year totals)**:
   - Energy consumption: 1.8 kWh/mile (less efficient than diesel on miles/energy)
   - Total energy: 315,000 kWh
   - Energy cost: 315,000 kWh * $0.15/kWh (avg) = $47,250

   **Maintenance Costs (5-year totals)**:
   - Annual maintenance: $1,200 (lower - fewer moving parts)
   - 5-year total: $7,200
   - Fewer repair issues expected
   - Total maintenance: $7,200

   **Infrastructure Costs**:
   - Charging station installation: $8,000 (one-time)
   - Charging infrastructure amortized: $1,600/vehicle (shared across fleet)

   **Insurance (5-year totals)**:
   - Premium: $1,600/year (lower - safer tech)
   - 5-year total: $8,000

   **Federal Tax Credit**:
   - Electric vehicle tax credit: -$7,500 (reduces net acquisition)
   - Net acquisition after credit: $32,500

   **Total 5-Year TCO - Option B (Electric)**:
   - Net acquisition (after credit): $32,500
   - Energy: $47,250
   - Charging infrastructure: $1,600
   - Maintenance: $7,200
   - Insurance: $8,000
   - **Total: $96,550 per vehicle**
   - **Cost per mile: $0.552/mile**

6. Fleet Manager evaluates Option C: Hybrid Truck:
   - Acquisition cost: $51,000 (hybrid premium)
   - Residual value: $16,500
   - Net acquisition: $34,500

   **Fuel Costs (5-year totals)**:
   - Fuel efficiency: 32 MPG (improved with hybrid)
   - Gallons consumed: 5,469
   - Fuel cost: $19,142

   **Maintenance (5-year totals)**:
   - Higher than electric but lower than diesel
   - Total maintenance: $11,200

   **Insurance (5-year totals)**:
   - Premium: $1,700/year
   - 5-year total: $8,500

   **Total 5-Year TCO - Option C (Hybrid)**:
   - Net acquisition: $34,500
   - Fuel: $19,142
   - Maintenance: $11,200
   - Insurance: $8,500
   - **Total: $73,342 per vehicle**
   - **Cost per mile: $0.419/mile**

7. Fleet Manager compares TCO across options:

   **TCO Ranking (5-year totals)**:
   1. **Option C (Hybrid): $73,342 - Best total cost**
   2. Option A (Diesel): $79,500 - +$6,158 vs hybrid (+8.4%)
   3. Option B (Electric): $96,550 - +$23,208 vs hybrid (+31.6%)

   **Cost Per Mile Ranking**:
   1. **Option C (Hybrid): $0.419/mile - Best economics**
   2. Option A (Diesel): $0.454/mile - 8.4% higher
   3. Option B (Electric): $0.552/mile - 31.6% higher

8. Fleet Manager analyzes sensitivity for electric option:
   - Current assumption: Electricity $0.15/kWh
   - Scenario: Electricity drops to $0.10/kWh (excess green energy source)
   - Electric TCO recalculated: $91,483 (energy cost drops $31,500)
   - Still higher than hybrid but more competitive
   - Key driver: Energy cost assumptions critical for EV evaluation

9. Fleet Manager presents findings to Executive Committee:
   - **Recommendation: Hybrid trucks (Option C)**
   - **Financial justification:**
     - Best 5-year TCO: $73,342 per vehicle
     - Annual cost savings vs diesel: $1,231 per vehicle
     - Total savings for 10 vehicles over 5 years: $61,550
   - **Environmental consideration:**
     - Hybrid: 28% fuel consumption reduction
     - Partial electrification benefits with proven reliability
   - **Implementation timeline:** Phased replacement over 2 years (2026-2027)
   - **Capital requirement:** $51K * 10 vehicles = $510K
   - **Expected payback:** 4.1 years (from fuel savings alone)

10. Executive Committee approves hybrid truck acquisition plan
11. Fleet Manager adjusts capital budget for hybrid truck acquisition
12. System creates acquisition schedule for vehicle procurement
13. Fleet Manager documents TCO analysis for records

#### Alternative Flows:

**A1: EV Feasibility Analysis with Infrastructure Improvements**
- 5a. If evaluating EV with significant infrastructure investment:
  - EV truck acquisition: $58,000
  - Charging infrastructure: $25,000 (build robust charging network)
  - System recalculates: Infrastructure amortized as $5,000/vehicle
  - New EV TCO: $101,550 (infrastructure adds significant cost)
  - Conclusion: EV not cost-effective for current utilization
  - Recommendation: Defer EV transition until charging infrastructure developed by public sector

**A2: Vehicle Lease vs Purchase Comparison**
- 2a. If evaluating lease alternative:
  - Diesel truck purchase: $79,500 TCO
  - Diesel truck lease: $28,000 (3-year lease, then $0 residual)
  - Lease is significantly lower cost ($51,500 savings)
  - Trade-off: Lease ends after 3 years; must renew or purchase
  - Fleet Manager evaluates: Own for long-term stability; lease for flexibility
  - Decision: Lease high-mileage vehicles; own core fleet

**A3: Acquisition for New Service Line (Different Utilization)**
- 1a. If TCO changes based on different use case:
  - New service line: 50,000 miles/year (vs 35,000 standard)
  - Analysis period: Shorter vehicle life (5 years = 250K miles vs 175K)
  - Residual values decrease (more mileage wear)
  - Higher fuel consumption and maintenance costs
  - TCO comparison changes: Electric becomes less attractive (more energy used)
  - Recommendation: Diesel or hybrid for high-mileage use case

#### Exception Flows:

**E1: Fuel Price Forecast Uncertainty**
- If fuel price predictions highly uncertain:
  - Base case: Diesel $3.50/gal (diesel TCO: $79,500)
  - Downside: Diesel $3.00/gal (diesel TCO: $73,000)
  - Upside: Diesel $4.50/gal (diesel TCO: $89,000)
  - Fleet Manager performs sensitivity analysis
  - Result: Even in downside scenario, hybrid still cheapest option
  - Hybrid remains recommendation despite fuel price uncertainty

**E2: Vehicle Reliability Data Unavailable**
- If historical maintenance costs for new vehicle type missing:
  - New hybrid model: Insufficient data for maintenance estimates
  - System displays: "⚠ Maintenance data estimated - verify with manufacturer"
  - Fleet Manager requests maintenance estimates from manufacturer
  - Fleet Manager enters manufacturer data (conservative estimates)
  - Re-runs TCO analysis with updated data
  - Validates assumptions once real-world data accumulates

**E3: Residual Value Projections Change**
- If vehicle values decline faster than expected:
  - Original residual (5-year, 175K miles): $14,500
  - Market shift: Used truck prices decline 15%
  - New residual: $12,325
  - TCO increases by $2,175 per vehicle
  - Fleet Manager evaluates: Impact on recommendation (minor, hybrid still best)
  - Updates capital approval budget accordingly

#### Postconditions:
- Fleet Manager has comprehensive TCO analysis for acquisition decisions
- Capital requests are supported with financial justification
- Different vehicle options are evaluated on total cost basis
- Environmental and sustainability factors are included in analysis
- Long-term fleet economics are understood by executive team

#### Business Rules:
- BR-FM-055: TCO includes all direct and allocated costs over analysis period
- BR-FM-056: Analysis period minimum 5 years for major acquisitions
- BR-FM-057: Fuel price forecasts reviewed quarterly for accuracy
- BR-FM-058: Residual values validated against market data annually
- BR-FM-059: Sensitivity analysis performed for key assumptions
- BR-FM-060: TCO analysis retained for post-acquisition actual vs projected comparison

#### Related User Stories:
- US-FM-010: Fleet Total Cost of Ownership (TCO) Projection

---

## Epic 5: Compliance and Risk Management

### UC-FM-011: Monitor Regulatory Compliance and Manage Compliance Risks

**Use Case ID**: UC-FM-011
**Use Case Name**: Monitor Regulatory Compliance and Manage Compliance Risks
**Actor**: Fleet Manager (primary), Safety Officer (secondary), Legal Counsel (secondary)
**Priority**: High

#### Preconditions:
- Compliance tracking system is operational
- Vehicle inspection schedules are configured
- Driver certification tracking is current
- Regulatory requirements are documented

#### Trigger:
- Fleet Manager opens compliance dashboard
- Compliance item expiration date approaches (30/60/90 days)
- Annual compliance review process
- New regulation becomes effective

#### Main Success Scenario:
1. Fleet Manager opens Compliance Dashboard
2. System displays compliance status overview:

   **Compliance Health Score: 94/100** ✓ (Excellent)
   - Overall compliance rate: 94%
   - Critical items: 100% compliant
   - Non-critical items: 88% compliant

   **Compliance Categories Status**:
   - **Vehicle Inspections**: 287 vehicles | 281 current (98%) | 6 overdue
   - **Vehicle Registrations**: 287 vehicles | 287 current (100%)
   - **Insurance Coverage**: 287 vehicles | 287 current (100%)
   - **Emissions Testing**: 287 vehicles | 276 current (96%) | 11 pending
   - **Driver Certifications**: 156 drivers | 142 current (91%) | 14 expiring in 30 days
   - **Hours of Service (HOS)**: 156 drivers | 156 compliant (100%)
   - **Maintenance Records**: 287 vehicles | 287 current (100%)

   **Critical Alerts**:
   - 6 vehicle inspections overdue (require immediate attention)
   - 14 driver certifications expiring within 30 days (schedule renewals)
   - 11 emissions tests pending (schedule appointments)

3. Fleet Manager reviews vehicle inspection status:
   - Overdue inspections: 6 vehicles
   - Vehicle #127: Inspection overdue by 12 days
   - Vehicle #156: Inspection due in 2 days (pre-overdue alert)
   - Vehicle #203: Inspection overdue by 8 days
   - Others: Ranging from 2-14 days overdue

4. Fleet Manager initiates corrective action for overdue inspections:
   - Creates work order: "Schedule vehicle inspections - priority"
   - Assigns to maintenance manager
   - Deadline: All inspections completed by end of week (5 days)
   - System tracks: When inspections scheduled and completed

5. Fleet Manager reviews driver certification status:
   - 14 drivers with certifications expiring within 30 days:
     - 8 drivers with CDL medical certificates expiring in 15-30 days
     - 6 drivers with HAZMAT endorsements expiring in 20-25 days
   - System sends automated reminder emails to drivers
   - Fleet Manager assigns HR coordinator to schedule renewal appointments
   - Tracks: Certification renewal progress for each driver

6. Fleet Manager reviews regulatory compliance requirements:
   - DOT/FMCSA regulations: All compliant
   - State regulations: Emissions tests 11 pending (non-critical, within 30-day grace period)
   - Company policy: All exceedances within tolerance

7. Fleet Manager generates compliance audit report:
   - Report date: 11/10/2025
   - Audit period: Last 12 months
   - Overall compliance rate: 94% (target: 95%)
   - Critical items (safety): 100% compliant ✓
   - Items needing attention: Emissions tests (11 pending)
   - Recommended actions: Prioritize emissions testing
   - Report prepared for regulatory agency submission

8. Fleet Manager schedules 2026 compliance planning:
   - Projects inspection requirements for next 12 months:
     - Monthly vehicle inspections: 287 * 12 = 3,444 inspections required
     - Annual registrations: 287 due on anniversary dates
     - Emissions testing: State requirements (varies by vehicle age/type)
     - Driver certifications: Continuous tracking required
   - Budget planning: Allocate compliance resources

9. Fleet Manager establishes automated compliance monitoring:
   - System generates daily compliance status report
   - Alerts triggered 90 days before major expirations
   - Alerts triggered 30 days before critical expirations
   - Monthly compliance summary sent to executive team
   - Quarterly deep-dive compliance review with Safety Officer

#### Alternative Flows:

**A1: Non-Compliance Incident Requiring Corrective Action**
- 3a. If non-compliance discovered:
  - Vehicle #089: Inspection expired 45 days ago
  - Fleet Manager immediately grounds vehicle: "Out of service until inspected"
  - Dispatches vehicle to inspection facility (priority scheduling)
  - Root cause analysis: Why was vehicle missed?
  - Process improvement: Enhanced automated alerts
  - Inspection completed; vehicle returned to service

**A2: Regulatory Change Requires New Compliance Requirement**
- 1a. If new regulation becomes effective:
  - New state emissions standard: Effective 01/01/2026
  - Fleet Manager updates compliance tracking:
    - Adds new inspection requirement: All vehicles
    - Sets baseline requirement date: 01/31/2026 (30-day implementation window)
    - Schedules: Equipment/software upgrades needed
  - Communicates change to maintenance team
  - Tracks compliance as of effective date

**A3: Driver Certification Renewal Process**
- 5a. If driver certification approaching expiration:
  - Driver John Smith: CDL medical certificate expires 11/25/2025 (15 days)
  - System sends automated reminder: "Schedule medical exam"
  - HR coordinator contacts driver: "Schedule CDL medical exam by 11/20"
  - Driver schedules exam with approved medical examiner
  - Post-exam: Certification document uploaded to system
  - System verifies: New certificate validates immediately

#### Exception Flows:

**E1: Compliance Data Missing or Incomplete**
- If inspection records incomplete:
  - Vehicle #145: Inspection date missing from records
  - Fleet Manager contacts maintenance team for verification
  - Service documentation recovered from maintenance system
  - Record updated with correct inspection date
  - Compliance status automatically updated

**E2: Regulatory Requirement Ambiguous**
- If regulation interpretation unclear:
  - New state rule: Unclear if applies to your fleet vehicles
  - Fleet Manager consults Legal Counsel: "Does this regulation apply?"
  - Legal opinion: Yes, applies to this vehicle type
  - Fleet Manager updates compliance requirements
  - System tracks effective date and implementation deadline

**E3: Compliance Audit by External Agency**
- If regulatory agency conducts compliance inspection:
  - State DMV inspection: Spot check of fleet compliance
  - Fleet Manager provides documentation: Inspections, maintenance, registrations
  - Inspector verifies sample of 10 vehicles
  - Result: 1 minor violation (easily corrected)
  - Fleet Manager files correction notice and implements fix
  - Follow-up inspection confirms compliance

#### Postconditions:
- Fleet Manager has current visibility into compliance status
- Compliance risks are identified and managed proactively
- Expiring requirements are scheduled for renewal
- Non-compliance incidents are documented and corrected
- Regulatory audit trail is maintained

#### Business Rules:
- BR-FM-061: All vehicle inspections must be completed per regulatory schedule
- BR-FM-062: Driver certifications (CDL, medical, HAZMAT) tracked individually
- BR-FM-063: Non-compliance items must be corrected within 30 days
- BR-FM-064: Critical compliance items cannot be waived or deferred
- BR-FM-065: Regulatory changes implemented within required effective date
- BR-FM-066: Compliance documentation retained for 7-year audit trail

#### Related User Stories:
- US-FM-011: Regulatory Compliance Dashboard

---

## Epic 6: Strategic Planning

### UC-FM-012: Model Fleet Optimization Scenarios and Plan Strategic Fleet Evolution

**Use Case ID**: UC-FM-012
**Use Case Name**: Model Fleet Optimization Scenarios and Plan Strategic Fleet Evolution
**Actor**: Fleet Manager (primary), Executive Committee (secondary)
**Priority**: Medium

#### Preconditions:
- Historical usage and cost data is available
- Fleet utilization data by vehicle type is current
- Market data for new vehicles is available
- Strategic business plans are defined

#### Trigger:
- Annual strategic fleet planning process begins
- Major operational changes require fleet adjustment
- Significant market opportunity or threat identified
- Leadership requests fleet optimization analysis

#### Main Success Scenario:
1. Fleet Manager initiates strategic fleet planning process
2. Fleet Manager defines planning scenarios to evaluate:
   - **Scenario 1**: Status quo (maintain current fleet composition)
   - **Scenario 2**: Fleet optimization (retire low-utilization vehicles)
   - **Scenario 3**: Service expansion (add new vehicle types for new markets)
   - **Scenario 4**: Green transition (replace diesel with EV/hybrid fleet)

3. Fleet Manager models Scenario 1 (Status Quo):
   - Current fleet: 287 vehicles (mixed types and ages)
   - Fleet composition:
     - Long-haul trucks: 82 vehicles
     - Medium-duty trucks: 89 vehicles
     - Light-duty vans: 102 vehicles
     - Specialized units: 14 vehicles
   - 5-year projection:
     - Capital investment: $0 (no new acquisitions)
     - Operational costs: $2,847,000/year (current baseline)
     - Fleet average age increase: 6.8 to 9.8 years
     - Expected maintenance costs: Increase 15-20% (aging fleet)
     - Projected 5-year total cost: $14.8 million

4. Fleet Manager models Scenario 2 (Fleet Optimization):
   - Goal: Improve fleet utilization and reduce operating costs
   - Actions:
     - Retire 8 low-utilization vehicles (<65% utilization)
     - Optimized fleet: 279 vehicles
     - Improved average utilization: 84% → 87%
     - Improved average fleet age: 6.8 → 6.2 years (younger fleet)
   - Financial impact:
     - One-time capital savings: $320,000 (no vehicle replacements)
     - Annual operational savings: $230,000 (lower maintenance for younger fleet)
     - 5-year total savings vs status quo: $1.38 million
     - Implementation cost: $50,000 (transition and integration)
     - Net 5-year benefit: $1.33 million

5. Fleet Manager models Scenario 3 (Service Expansion):
   - Strategic opportunity: New refrigerated delivery service line
   - Required expansion:
     - Add 20 refrigerated trucks (specialized equipment)
     - Add 15 light-duty vans for last-mile delivery
     - Total new vehicles: 35
     - New fleet size: 322 vehicles
   - Financial model:
     - Capital investment: $1.25 million (new vehicles)
     - Additional annual revenue: $2.5 million (new service line)
     - Additional annual costs: $420,000 (operations and maintenance)
     - 5-year payback: Year 3.2 (from incremental revenue)
     - 5-year net present value: $3.8 million positive
   - Assessment: Strategically attractive; drives growth

6. Fleet Manager models Scenario 4 (Green Transition):
   - Strategic goal: Reduce emissions 50% by 2030
   - Phase 1 (5-year plan): Replace 40% of fleet with EVs/hybrids
   - Actions:
     - Replace all medium-duty trucks (89) with hybrids: 89 vehicles
     - Add electric long-haul pilots: 5 vehicles
     - Keep conventional light-duty vans (mature vehicles): 102 existing
     - Total new vehicles: 94
   - Financial model:
     - Capital investment: $3.8 million (higher acquisition cost of EVs/hybrids)
     - Annual fuel savings: $280,000 (lower energy costs)
     - Annual maintenance savings: $95,000 (fewer moving parts)
     - Total annual savings: $375,000
     - 5-year payback: Year 10.1 (long payback)
     - 5-year net present value: -$1.2 million (negative ROI)
   - Assessment: Not financially attractive but achieves environmental goals

7. Fleet Manager compares scenarios across key metrics:

   **Scenario Comparison (5-year totals)**:
   | Metric | Status Quo | Optimization | Expansion | Green Transition |
   |--------|-----------|--------------|-----------|------------------|
   | Total vehicles | 287 | 279 | 322 | 381 |
   | Capital investment | $0 | -$50K | $1,250K | $3,800K |
   | Annual operating cost | $2,847K | $2,617K | $3,267K | $2,472K |
   | 5-year total cost | $14,800K | $13,470K | $16,700K | $16,200K |
   | Utilization rate | 84% | 87% | 85% | 78% |
   | Fleet avg age (year 5) | 9.8 yrs | 6.2 yrs | 6.5 yrs | 4.2 yrs |
   | CO2 emissions | 100% baseline | 100% baseline | 105% | 50% |
   | 5-year NPV | $0 | $1,330K | $3,800K | -$1,200K |

8. Fleet Manager prepares strategic recommendation:
   - **Primary recommendation**: Scenario 2 + Scenario 3 (combined approach)
   - Rationale:
     - Optimize existing fleet (save $1.33M)
     - Pursue strategic expansion (gain $3.8M)
     - Balanced risk profile
     - Achieves operational efficiency and growth
   - Combined 5-year impact:
     - Capital requirement: $1.2M
     - 5-year net benefit: $5.13M
     - Average ROI: 18% annually

9. Fleet Manager presents scenarios to Executive Committee:
   - Scenario 1 (Status Quo): Maintain current position; highest costs long-term
   - Scenario 2 (Optimization): Efficiency play; achieves cost reduction
   - **Scenario 3 (Expansion): Growth opportunity; strategic value**
   - Scenario 4 (Green): Environmental leadership; financial burden without mandates
   - **Recommended: Combine Scenarios 2 + 3**

10. Executive Committee approves fleet strategy:
    - Approve Scenario 2 (Fleet optimization): Begin retiring underutilized vehicles
    - Approve Scenario 3 (Service expansion): Proceed with refrigerated truck line business case
    - Defer Scenario 4 (Green transition): Revisit when fuel price/technology improves

11. Fleet Manager creates detailed implementation roadmap:
    - Phase 1 (Year 1): Retire 8 underutilized vehicles; Procure 20 refrigerated trucks
    - Phase 2 (Year 2): Full refrigerated service deployment; Add 15 light-duty vans
    - Phase 3 (Years 3-5): Continue selective fleet optimization; Evaluate hybrid adoption

12. System tracks actual vs projected performance:
    - Monitors fleet utilization during optimization
    - Tracks new service line performance vs projection
    - Monitors fleet costs and revenue
    - Provides quarterly variance reporting

#### Alternative Flows:

**A1: Market Disruption Requires Strategic Shift**
- 1a. If external market conditions dramatically change:
  - Scenario: Autonomous vehicle technology becomes viable (unexpected)
  - Fleet Manager revises planning scenarios:
    - Scenario 5: Adopt autonomous vehicles (disruption scenario)
    - Re-evaluates competitive position
    - Accelerates EV transition as prerequisite for autonomous adoption
  - May require significant strategic pivot

**A2: Regulatory Mandate for Emissions Reduction**
- 1a. If government mandates emissions limits:
  - New regulation: All fleet vehicles must be electric by 2030
  - Fleet Manager re-prioritizes: Scenario 4 (Green Transition) becomes mandatory
  - Timeline accelerates: 5-year plan becomes required 6-year transition
  - Financial impact: No longer optional; cost becomes requirement

**A3: Business Contraction Requires Fleet Right-Sizing**
- 1a. If company experiences business downturn:
  - Revenue projection downgraded; Service line contraction
  - Fleet Manager models: Scenario 5 (Contraction)
    - Reduce fleet from 287 to 250 vehicles
    - Divest underperforming service lines
    - Cost reduction priority
  - Different scenario than optimistic expansion case

#### Exception Flows:

**E1: Uncertain Technology Performance**
- If EV/autonomous vehicle assumptions unclear:
  - Battery technology advancement: Uncertain timeline
  - EV charging infrastructure: Dependent on public investment
  - Fleet Manager performs sensitivity analysis:
    - Optimistic case: Technology matures rapidly
    - Pessimistic case: Technology development stalls
    - Base case: Moderate progress
  - Recommendation provides range of outcomes

**E2: Market Competitor Actions Unpredictable**
- If competitor strategy impacts planning:
  - Major competitor launches aggressive new service
  - Fleet Manager evaluates: Does this change our strategy?
  - May need to accelerate expansion (Scenario 3) to stay competitive
  - Or may indicate overheated market (reduce expansion risk)
  - Requires reassessment of strategic assumptions

**E3: Cost Assumptions Change Significantly**
- If vehicle costs or energy prices shift:
  - EV prices drop 20% faster than projected (battery tech breakthrough)
  - EV economics improve dramatically
  - Scenario 4 (Green Transition) becomes financially attractive
  - Fleet Manager recommends: Accelerate green transition timeline

#### Postconditions:
- Fleet Manager has comprehensive understanding of strategic fleet options
- Executive Committee has data-driven fleet strategy for approval
- Implementation roadmap is created with timeline and milestones
- Performance tracking is established for actual vs projected results
- Fleet composition evolves aligned with business strategy

#### Business Rules:
- BR-FM-067: Strategic fleet scenarios evaluated over minimum 5-year horizon
- BR-FM-068: All scenarios include financial projections (costs, revenue, ROI)
- BR-FM-069: Sensitivity analysis performed for key assumptions
- BR-FM-070: Environmental impact included in scenario analysis
- BR-FM-071: Implementation roadmap includes risk mitigation strategies
- BR-FM-072: Annual strategy review reassesses scenarios for validity

#### Related User Stories:
- US-FM-013: Fleet Composition Optimization
- US-FM-014: Carbon Footprint Reduction Planning

---

## Summary

### Use Case Statistics:
- **Total Use Cases**: 12
- **High Priority**: 5 use cases
- **Medium Priority**: 7 use cases
- **Low Priority**: 0 use cases

### Epic Distribution:
1. **Vehicle Acquisition and Disposition**: 3 use cases
2. **Fleet Analytics and Performance**: 3 use cases
3. **Vendor and Contract Management**: 2 use cases
4. **Budget and Cost Control**: 2 use cases
5. **Compliance and Risk Management**: 1 use case
6. **Strategic Planning**: 1 use case

### Key Fleet Management Capabilities:
- **Real-time fleet visibility** through dashboard KPI monitoring
- **Data-driven vehicle acquisition** decisions using TCO analysis
- **Cost optimization** through CPM analysis and vendor management
- **Utilization optimization** identifying underused assets
- **Compliance automation** preventing regulatory violations
- **Strategic planning** with scenario modeling for fleet evolution
- **Budget management** with variance tracking and controls
- **Vendor performance** monitoring and contract management

### Integration Requirements:
- **Telematics platforms** (GPS, vehicle health data, driver behavior)
- **Accounting systems** (cost data, depreciation, asset management)
- **Market data services** (vehicle valuations, fuel prices, benchmark data)
- **Compliance tracking systems** (inspections, certifications, regulations)
- **Route optimization** (for capacity and utilization planning)

---

## Related Documents

- **User Stories**: `user-stories/01_FLEET_MANAGER_USER_STORIES.md`
- **Test Cases**: `test-cases/01_FLEET_MANAGER_TEST_CASES.md` (to be created)
- **Workflows**: `workflows/01_FLEET_MANAGER_WORKFLOWS.md` (to be created)
- **UI Mockups**: `mockups/fleet-manager-dashboard/` (to be created)
- **API Specifications**: `api/fleet-manager-endpoints.md` (to be created)

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-10 | Requirements Team | Initial fleet manager use cases created |

---

*This document provides detailed use case scenarios supporting the Fleet Manager user stories and operational workflows.*
