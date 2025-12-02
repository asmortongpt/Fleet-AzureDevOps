# Fleet Manager - Test Cases

**Role**: Fleet Manager
**Access Level**: Executive (Full system access)
**Primary Interface**: Web Dashboard
**Version**: 1.0
**Date**: November 10, 2025

---

## Test Case Overview

**Total Test Cases**: 25
**Test Coverage Areas**:
- Functional Tests (FT): 12 cases
- Integration Tests (IT): 6 cases
- Performance Tests (PT): 4 cases
- Security Tests (ST): 3 cases

**Test Case ID Format**: TC-FM-XXX

---

## FUNCTIONAL TESTS

### TC-FM-001: Vehicle Acquisition Planning - Fleet Composition Analysis

**Test Case ID**: TC-FM-001
**Name**: Verify Fleet Composition Analysis and Filtering
**Related US/UC**: US-FM-001, UC-FM-001
**Priority**: High
**Test Type**: Functional Test
**Category**: Vehicle Lifecycle Management

#### Preconditions:
- Fleet Manager is logged into the system with valid credentials
- Fleet contains 287 vehicles with complete maintenance and cost history
- Market value data is current (updated within 30 days)
- Depreciation schedules are configured and active
- System has at least 30 days of historical data

#### Test Steps:
1. Navigate to Vehicle Acquisition Planning dashboard
2. Verify dashboard displays:
   - Total fleet size: 287 vehicles
   - Average fleet age calculation
   - Count of vehicles >10 years old
   - Count of vehicles >200,000 miles
3. Apply filter: Age > 8 years AND Mileage > 150,000 miles AND Maintenance Cost Trend increasing >15% annually
4. Verify system displays filtered vehicle list with replacement scores
5. Click on vehicle #127 to view detailed analysis
6. Verify detailed view shows:
   - Current book value
   - Estimated market value
   - Projected remaining service life
   - Cost-benefit analysis: Repair vs Replace
7. Select top 10 vehicles for acquisition planning
8. Verify system generates replacement recommendations with:
   - New vehicle acquisition cost estimates
   - Net cost of replacement (after trade-in value)
   - 5-year TCO comparison

#### Expected Results:
- Dashboard loads in <3 seconds
- Filter operation completes in <2 seconds
- Replacement scores calculated accurately (94/100 for critical vehicles)
- Cost-benefit analysis displayed with proper formatting
- All calculations accurate to 2 decimal places
- Export function available for report generation

#### Acceptance Criteria:
- All filter criteria applied correctly and return expected vehicle count
- Replacement scores range 0-100 with clear priority levels
- TCO calculations include all required cost categories
- System allows selection of 10+ vehicles without performance degradation
- Report exports successfully in PDF and Excel formats

#### Test Data:
- Vehicle #127: 11-year-old Freightliner, 287,000 miles, annual maintenance cost increase 18%
- Vehicle #245: 10.5-year-old Peterbilt, 267,500 miles, annual maintenance cost increase 16%
- Vehicle #156: 8.8-year-old Volvo, 198,750 miles, annual maintenance cost increase 12%
- Budget available: $420,000
- Vehicles with <5% maintenance increase: Filtered out

---

### TC-FM-002: New Vehicle Registration - VIN Decoder Integration

**Test Case ID**: TC-FM-002
**Name**: Register New Vehicle with VIN Auto-Population
**Related US/UC**: US-FM-002, UC-FM-002
**Priority**: High
**Test Type**: Functional Test
**Category**: Vehicle Lifecycle Management

#### Preconditions:
- Fleet Manager is logged in with vehicle registration permissions
- VIN decoder service is operational
- Vehicle delivery receipt is received from dealer
- Telematics hardware inventory shows available devices
- Document upload storage is configured

#### Test Steps:
1. Open New Vehicle Registration form
2. Enter vehicle delivery details:
   - Dealer: Capital Fleet Sales
   - Delivery date: 11/10/2025
   - Purchase order: PO-2025-14728
   - Invoice amount: $42,500
3. Enter VIN: 1HGCB41JXMN109186
4. Click "Decode VIN" button
5. Verify system auto-populates:
   - Make: Freightliner
   - Model: Cascadia 2025
   - Year: 2025
   - Engine: Cummins ISX 15-liter
   - Transmission: Allison automatic
   - GVWR: 33,000 lbs
6. Enter license plate: CTF-4827
7. Upload vehicle documentation (title, registration, warranty, bill of sale)
8. Assign vehicle to location: Boston depot
9. Assign use type: Long-haul delivery
10. Configure telematics: Samsara CM32 device
11. Set insurance coverage and policy details
12. Click "Complete Registration"
13. Verify system generates Fleet ID automatically (format: FLT-YYYY-XXXX)

#### Expected Results:
- VIN decoding completes in <5 seconds
- All vehicle specifications populated correctly
- Fleet ID generated in expected format
- System sends notifications to:
  - Maintenance team
  - Dispatch team
  - Finance team
  - Insurance team
- Vehicle appears in available vehicle pool within 30 seconds
- All documents stored in Azure Blob Storage with correct references

#### Acceptance Criteria:
- VIN decoder returns 100% accurate data
- Fleet ID is unique and never duplicates
- All required documents successfully uploaded
- Document references linked to vehicle record
- Telematics installation scheduled within 48 hours
- Vehicle status changes from "Pending" to "In Service - Available for Assignment"

#### Test Data:
- Valid VIN: 1HGCB41JXMN109186
- License plate: CTF-4827
- Purchase cost: $42,500
- Depreciation method: 5-year MACRS
- Salvage estimate: $8,500
- Insurance policy: POL-2025-08847

---

### TC-FM-003: Real-Time Fleet Dashboard - Performance and Updates

**Test Case ID**: TC-FM-003
**Name**: Verify Real-Time Fleet Dashboard Functionality and Metrics
**Related US/UC**: US-FM-004
**Priority**: High
**Test Type**: Functional Test
**Category**: Fleet Performance Analytics

#### Preconditions:
- Fleet Manager is logged in
- Real-time telematics data feed is active
- WebSocket connections are established
- Redis caching is operational
- 287 vehicles have current tracking data
- At least 5 vehicles have maintenance alerts/inspections due

#### Test Steps:
1. Navigate to Real-Time Fleet Dashboard
2. Verify dashboard displays within 3 seconds:
   - Total fleet size: 287
   - Active vehicles count
   - Vehicles in maintenance count
3. Verify real-time vehicle locations displayed on map
4. Verify key metrics are visible:
   - Utilization rate (%)
   - Fuel efficiency (MPG)
   - Maintenance costs ($)
   - Safety incidents (count)
5. Identify and verify vehicles requiring immediate attention:
   - Vehicles with alerts
   - Maintenance due dates
   - Inspections due
6. Apply filter: By location (Boston depot)
7. Apply filter: By vehicle type (Freightliner trucks)
8. Apply filter: By date range (last 7 days)
9. Customize dashboard layout by:
   - Moving widget to new position
   - Resizing widget
   - Hiding widget
10. Save dashboard preferences
11. Refresh page and verify saved layout persists
12. Export dashboard snapshot as PDF
13. Monitor WebSocket updates - verify metrics update in real-time
14. Verify trend indicators show week-over-week and month-over-month changes

#### Expected Results:
- Dashboard loads in <3 seconds with all widgets
- Map displays with vehicle location accuracy within 100 meters
- Metrics update every 30 seconds for vehicle locations
- Metrics update every 5 minutes for aggregated metrics
- Filters apply and reduce displayed vehicles within <2 seconds
- Dashboard layout customization saves and persists across sessions
- PDF export includes all visible metrics and current timestamp
- WebSocket connections maintain without disconnects
- Trend indicators display with visual indicators (up/down arrows)
- No memory leaks during 1-hour session

#### Acceptance Criteria:
- All 287 vehicles displayed with current status
- Real-time updates visible without page refresh
- Custom dashboard preferences persisted in database
- PDF export file generated successfully
- Filters function independently and in combination
- Performance remains consistent with 287 vehicles

#### Test Data:
- 287 vehicles with mixed status (210 active, 45 in maintenance, 32 idle)
- 8 vehicles with critical alerts
- 12 vehicles with maintenance due within 7 days
- Average fleet utilization: 68%
- Fleet-wide fuel efficiency: 6.2 MPG (target: 6.5 MPG)

---

### TC-FM-004: Cost Per Mile Analysis - Calculation Accuracy

**Test Case ID**: TC-FM-004
**Name**: Verify Cost Per Mile Calculation and Trend Analysis
**Related US/UC**: US-FM-005
**Priority**: High
**Test Type**: Functional Test
**Category**: Fleet Performance Analytics

#### Preconditions:
- Fleet Manager is logged in
- Complete cost data available for 287 vehicles
- Depreciation schedules are configured
- Industry benchmarking data is current
- 12+ months of historical data available
- CPM calculation engine is configured

#### Test Steps:
1. Navigate to Cost Per Mile Analysis dashboard
2. Verify system displays CPM including:
   - Fuel costs
   - Maintenance costs
   - Tire costs
   - Insurance costs
   - Depreciation costs
   - Overhead allocation
3. Select vehicle #127 to view CPM details
4. Verify CPM trends are displayed for:
   - Monthly trend (last 12 months)
   - Quarterly trend (last 4 quarters)
   - Annual trend (last 3 years)
5. Compare CPM across vehicle types:
   - Select: Freightliner trucks vs Peterbilt trucks
   - Verify comparison displayed side-by-side
6. Compare CPM across models and years
7. Identify vehicles exceeding target CPM thresholds
8. Drill down into cost categories for vehicle #245 (high CPM)
9. Verify system provides industry benchmarks
10. Set CPM target alert threshold: $0.65 per mile
11. Verify vehicles exceeding threshold are highlighted
12. Export CPM report with charts and comparative analysis

#### Expected Results:
- CPM calculations accurate to 0.01 per mile
- All cost categories properly allocated
- Trends display correctly for all time periods
- Vehicle comparisons show accurate CPM deltas
- Benchmarking data properly sourced and labeled
- Alerts triggered correctly for threshold breaches
- Report exports with professional formatting
- Drill-down analysis shows cost component breakdown

#### Acceptance Criteria:
- CPM calculated as: Total Costs / Total Miles within 0.01 variance
- All cost components included: fuel, maintenance, tires, insurance, depreciation, overhead
- Trend data accurate for 12+ month periods
- Benchmarking data sourced from verified industry sources
- Threshold alerts trigger when CPM exceeds set limit
- Export report includes charts, tables, and detailed cost breakdown

#### Test Data:
- Vehicle #127 CPM: $0.68/mile (current month)
- Vehicle #127 CPM trend: $0.62 → $0.65 → $0.67 → $0.68 (last 4 months)
- Industry benchmark: $0.63/mile (similar vehicle class)
- Target threshold: $0.65/mile
- 8 vehicles exceeding target threshold
- Total fleet CPM: $0.64/mile

---

### TC-FM-005: Utilization Rate Reporting - Calculation and Recommendations

**Test Case ID**: TC-FM-005
**Name**: Verify Utilization Rate Calculation and Fleet Rightsizing Analysis
**Related US/UC**: US-FM-006
**Priority**: Medium
**Test Type**: Functional Test
**Category**: Fleet Performance Analytics

#### Preconditions:
- Fleet Manager is logged in
- Accurate trip/route data for 287 vehicles
- Telematics ignition status data available
- Maintenance schedules properly configured
- 60+ days of historical utilization data available

#### Test Steps:
1. Navigate to Utilization Rate Reporting dashboard
2. Verify system calculates utilization rate using formula:
   - (Hours in use / Available hours) × 100
3. View utilization by vehicle (display vehicle #127)
4. Verify utilization shows: 78% with 624 utilization hours (30-day period)
5. View utilization by vehicle type:
   - Freightliner trucks: 82% average
   - Peterbilt trucks: 71% average
   - Vans: 45% average
6. View utilization by location:
   - Boston depot: 79% average
   - New York depot: 68% average
   - Philadelphia depot: 55% average
7. View utilization trends over time:
   - Daily trend (last 30 days)
   - Weekly trend (last 12 weeks)
   - Monthly trend (last 12 months)
8. Identify vehicles with <50% utilization (idle assets)
9. Verify system displays 23 vehicles with <50% utilization
10. View system recommendations for fleet rightsizing
11. Verify calculations exclude scheduled maintenance time
12. Export utilization report with recommendations
13. Verify projected cost savings from fleet optimization

#### Expected Results:
- Utilization calculated as: Hours on / (24 × Days - Maintenance hours)
- Calculations accurate to 1% precision
- Trends display correctly for all time periods
- Idle asset identification (<50% utilization) correct
- Maintenance time properly excluded from calculations
- Fleet rightsizing recommendations generated
- Cost savings projections calculated accurately
- Report exports with detailed analysis and visualizations

#### Acceptance Criteria:
- Utilization calculations verified against telematics raw data
- Maintenance time properly excluded from available hours
- <50% utilization vehicles correctly identified (23 vehicles)
- Fleet rightsizing recommendations based on utilization patterns
- Seasonal patterns identified in trend analysis
- Projected savings calculation accurate to nearest $100
- Export includes recommendations with financial impact

#### Test Data:
- Vehicle #127 utilization: 78% (624 hours / 800 available hours)
- Vehicle #245 utilization: 38% (304 hours / 800 available hours)
- 23 vehicles with <50% utilization
- Average fleet utilization: 68%
- Vehicles identified for right-sizing: 6 vans
- Projected savings from fleet right-sizing: $240,000/year

---

### TC-FM-006: Vendor Performance Tracking - Scorecard and Analysis

**Test Case ID**: TC-FM-006
**Name**: Verify Vendor Performance Tracking and Scorecard Generation
**Related US/UC**: US-FM-007
**Priority**: Medium
**Test Type**: Functional Test
**Category**: Vendor and Contract Management

#### Preconditions:
- Fleet Manager is logged in
- 15+ active vendors with contracts in system
- Work order history available with vendor assignments
- Quality ratings data available from technicians
- Contract management module is operational

#### Test Steps:
1. Navigate to Vendor Performance dashboard
2. Verify all active vendors displayed with:
   - Vendor name and contact information
   - Contract details (dates, terms)
   - Contract expiration dates
3. Select vendor "ABC Maintenance Services" to view details
4. Verify vendor performance metrics displayed:
   - Average turnaround time: 2.3 days
   - Quality rating: 4.4/5.0
   - Cost variance: +3.2% vs budget
   - On-time completion rate: 94%
   - Work order count: 156 (YTD)
   - Total spending: $127,500 (YTD)
5. View work order history for selected vendor (display last 10)
6. Add performance note: "Excellent response time this quarter"
7. Assign quality rating: 4.5/5.0
8. Verify system shows alerts for contract expiration:
   - 90 days before expiration
   - 60 days before expiration
   - 30 days before expiration
9. Compare vendors side-by-side:
   - ABC Maintenance vs XYZ Fleet Services vs DEF Truck Repair
10. Generate vendor performance scorecard
11. Export vendor performance report for procurement

#### Expected Results:
- All active vendors displayed with complete information
- Performance metrics calculated from work order data
- Turnaround time calculated as: (Close Date - Create Date)
- Quality score aggregated from technician ratings
- Cost variance calculated as: (Actual vs Budget) / Budget × 100
- On-time completion tracked and calculated
- Contract expiration alerts triggered at correct intervals
- Vendor comparison shows clear performance deltas
- Scorecard generated with professional formatting
- Report exports successfully in PDF/Excel format

#### Acceptance Criteria:
- All vendors have complete contract and performance data
- Performance metrics accurate within 1% variance
- Turnaround time calculation excludes weekends/holidays
- Quality ratings aggregated correctly from 3+ reviews
- Cost variance calculated accurately for budget comparison
- Contract expiration alerts trigger at 90/60/30-day intervals
- Vendor comparison shows at least 3 metrics
- Performance notes persist and are timestamped

#### Test Data:
- 15 active vendors with contracts
- ABC Maintenance Services: 156 work orders, 2.3-day avg turnaround, 4.4/5 quality
- XYZ Fleet Services: 98 work orders, 1.8-day avg turnaround, 4.7/5 quality
- DEF Truck Repair: 45 work orders, 3.2-day avg turnaround, 3.8/5 quality
- 3 contracts expiring within 90 days
- Total vendor spending YTD: $487,300

---

### TC-FM-007: Budget vs Actual Tracking - Variance Analysis

**Test Case ID**: TC-FM-007
**Name**: Verify Budget vs Actual Comparison and Variance Analysis
**Related US/UC**: US-FM-009
**Priority**: High
**Test Type**: Functional Test
**Category**: Budget and Financial Management

#### Preconditions:
- Fleet Manager is logged in with budget management permissions
- Annual budget is set for all categories
- Current spending data is up-to-date
- Chart of accounts mapping is configured
- Approval workflow is active

#### Test Steps:
1. Navigate to Budget vs Actual dashboard
2. Verify YTD budget vs actual display:
   - Fuel budget: $1,200,000 vs Actual: $1,187,500 (variance: -1.0%)
   - Maintenance budget: $800,000 vs Actual: $856,200 (variance: +7.0%)
   - Parts budget: $400,000 vs Actual: $412,100 (variance: +3.0%)
   - Insurance budget: $600,000 vs Actual: $600,000 (variance: 0%)
   - Depreciation budget: $500,000 vs Actual: $500,000 (variance: 0%)
3. Verify system highlights categories exceeding 90% of budget
4. Display month-by-month comparison:
   - January: Budget $157,500 vs Actual $152,400
   - February: Budget $157,500 vs Actual $161,200
   - March: Budget $157,500 vs Actual $159,800
   - (Continue through current month)
5. Drill down into Maintenance category (7% variance)
6. Verify transaction-level details showing:
   - Work orders by vendor
   - Parts costs by category
   - Labor costs
7. Add variance explanation note: "Transmission repairs for 3 vehicles"
8. View forecasting for year-end spending based on trends
9. Verify projected year-end spending: $3,287,600
10. Compare vs budget: $3,100,000
11. Request budget reallocation from underspent category (Fuel: -1.0%)
12. Submit reallocation for approval workflow
13. Verify budget change audit trail
14. Export budget report for executive review

#### Expected Results:
- Dashboard displays all budget categories with variance
- Variance calculation: (Actual - Budget) / Budget × 100
- Categories exceeding 90% threshold are highlighted
- Month-by-month comparison shows trend analysis
- Drill-down provides transaction-level detail
- Variance notes persist with timestamp and user attribution
- Forecasting uses YTD data to project year-end
- Budget reallocation submitted to approval workflow
- Approval audit trail recorded
- Export includes all metrics, charts, and notes

#### Acceptance Criteria:
- Budget vs Actual variance calculated accurately to 0.1%
- All budget categories displayed and tracked
- Thresholds (90% warning, 100% error) trigger correctly
- Month-by-month comparison shows all 12+ months
- Transaction drill-down accurate to individual transaction level
- Variance notes linked to budget line items
- Forecasting projection accurate within 2% of actual year-end
- Budget reallocation requires proper approvals
- Audit trail complete with all changes tracked

#### Test Data:
- YTD budget: $3,100,000
- YTD actual: $3,156,800
- Fuel variance: -1.0% (underspent)
- Maintenance variance: +7.0% (overspent - transmission repairs)
- 1 category at >90% threshold
- Forecasted year-end: $3,287,600 vs budget $3,100,000
- Reallocation request: $15,000 from fuel to maintenance

---

### TC-FM-008: Regulatory Compliance Dashboard - Alert Monitoring

**Test Case ID**: TC-FM-008
**Name**: Verify Regulatory Compliance Tracking and Alerting
**Related US/UC**: US-FM-011
**Priority**: High
**Test Type**: Functional Test
**Category**: Compliance and Risk Management

#### Preconditions:
- Fleet Manager is logged in with compliance monitoring permissions
- All 287 vehicles have compliance data configured
- Driver certification tracking system is active
- Vehicle inspection schedules are configured
- Alert notification system is operational

#### Test Steps:
1. Navigate to Regulatory Compliance dashboard
2. Verify dashboard displays compliance status for:
   - Vehicle inspections: 287 total, 4 due within 30 days
   - Vehicle registrations: 287 total, 6 expiring within 30 days
   - Vehicle permits: 287 total, 2 expiring within 30 days
   - Driver certifications: 156 drivers, 8 expiring within 30 days
3. Verify system highlights items expiring within:
   - 30 days (warning level 1)
   - 60 days (warning level 2)
   - 90 days (warning level 3)
4. Select vehicle #127 to view detailed compliance report
5. Verify report shows:
   - Last inspection date: 10/15/2025
   - Next inspection due: 10/15/2026 (on schedule)
   - Registration expires: 11/30/2025 (30 days - ALERT)
   - Permits valid until: 06/30/2026
6. Identify vehicles with critical compliance issues
7. Verify system displays 4 vehicles with inspections due within 30 days
8. Verify 6 vehicles with registration expirations within 30 days
9. Generate audit-ready compliance report
10. Verify report shows historical compliance rate and trends
11. Enable email alerts for critical compliance items
12. Test SMS alert notification (optional if configured)
13. Verify links to renewal portals are available
14. Check that non-compliance items are escalated to appropriate personnel
15. View compliance trend over last 12 months

#### Expected Results:
- Dashboard loads with real-time compliance status
- All compliance items properly categorized and tracked
- Alert thresholds (30/60/90 days) trigger correctly
- Detailed compliance reports generated with all data
- Audit-ready reports include comprehensive compliance history
- Email/SMS alerts sent to configured recipients
- Escalation workflow triggered for critical items
- Renewal portal links functional and current
- Trend analysis shows compliance performance over time
- System integrates with external DMV/licensing APIs where available

#### Acceptance Criteria:
- 100% of vehicles have compliance status tracked
- Compliance item expiration dates accurate within 1 day
- Alert thresholds trigger at correct intervals
- Audit reports include all required compliance documentation
- Email alerts delivered within 5 minutes of threshold breach
- SMS alerts sent for critical non-compliance items
- Escalation workflow routes to correct personnel
- Renewal links tested and functional
- Historical compliance data archived and accessible

#### Test Data:
- 287 total vehicles tracked
- 4 vehicles with inspections due within 30 days
- 6 vehicles with registration expiring within 30 days
- 2 vehicles with permits expiring within 30 days
- 8 drivers with certifications expiring within 30 days
- Historical compliance rate: 99.2%
- 1 vehicle with critical non-compliance (overdue inspection)

---

### TC-FM-009: Insurance Claim Management - Workflow and Tracking

**Test Case ID**: TC-FM-009
**Name**: Verify Insurance Claim Creation and Status Tracking
**Related US/UC**: US-FM-012
**Priority**: Medium
**Test Type**: Functional Test
**Category**: Compliance and Risk Management

#### Preconditions:
- Fleet Manager is logged in with claim management permissions
- Safety incident module is operational
- Document storage is configured
- Insurance claim workflow is defined
- 0-2 open claims in the system

#### Test Steps:
1. Navigate to Insurance Claim Management dashboard
2. Create new insurance claim:
   - Select incident: Vehicle #245 collision on 10/22/2025
   - Claim type: Vehicle damage - collision
   - Incident description: "Side impact collision with utility vehicle at intersection"
   - Estimated damage: $8,500
3. Link claim to safety incident record
4. Upload supporting documentation:
   - Accident photo (interior)
   - Accident photo (exterior)
   - Police report PDF
   - Mechanic's repair estimate
5. Assign claim status: "Reported" (initial status)
6. Enter insurance policy details:
   - Policy number: POL-2025-08847
   - Carrier: National Commercial Insurance
   - Coverage: $1M liability, $100K collision
7. Verify claim displayed on dashboard with status: "Reported"
8. Update claim status to "Under Review"
9. Update claim status to "Approved"
10. Record insurance payout: $8,200 (approved amount)
11. Update claim status to "Paid"
12. Close claim
13. Verify system calculates:
    - Loss ratio impact
    - Insurance modification rate (mod rate) impact
14. Export claims history for insurance renewal negotiations
15. Check for age-of-claim alert (verify for claims >30 days old without update)

#### Expected Results:
- New claim created and assigned unique claim ID
- All documentation uploaded and linked to claim
- Claim status workflow follows defined states: reported → under review → approved → denied/paid → closed
- Insurance policy information linked correctly
- Payout amount recorded and reconciled
- Loss ratio calculated: (Claim payout / Annual premium) × 100
- Mod rate impact calculated and tracked
- Claim appears on dashboard with accurate status
- Audit trail records all status changes with timestamp and user
- Claims history export includes all details
- Age-of-claim alerts trigger after 30 days without update

#### Acceptance Criteria:
- All claim documentation uploads successfully
- Claim status transitions follow defined workflow
- Loss ratio and mod rate calculations accurate
- Claims appear on dashboard with current status
- Audit trail complete with all changes
- Export includes full claim details and supporting docs
- Age-of-claim alerts trigger correctly
- Claim closure removes from open claims list

#### Test Data:
- New claim: Vehicle #245 collision damage $8,500
- Insurance carrier: National Commercial Insurance
- Policy coverage: $1M liability, $100K collision
- Approved payout: $8,200
- Policy premium: $45,000/year
- Loss ratio: 18.2% ($8,200 / $45,000)
- Current open claims: 2 claims

---

### TC-FM-010: Fleet Composition Optimization - Scenario Modeling

**Test Case ID**: TC-FM-010
**Name**: Verify Fleet Optimization Scenario Modeling and Comparison
**Related US/UC**: US-FM-013
**Priority**: Medium
**Test Type**: Functional Test
**Category**: Strategic Planning and Forecasting

#### Preconditions:
- Fleet Manager is logged in with planning permissions
- Historical usage and cost data available for 287 vehicles
- Vehicle specifications database is current
- Market availability data is updated
- EV charging cost calculator configured
- Planning scenario save/load functionality available

#### Test Steps:
1. Navigate to Fleet Composition Optimization tool
2. Create scenario 1: "Current Fleet"
   - 200 traditional diesel trucks
   - 50 lighter duty vans
   - 37 specialized vehicles
3. Create scenario 2: "Partial EV Transition"
   - 170 traditional diesel trucks
   - 80 electric delivery vans
   - 37 specialized vehicles
4. Create scenario 3: "Full EV Transition"
   - 100 traditional diesel trucks
   - 150 electric delivery vans
   - 37 specialized vehicles
5. Configure variables for each scenario:
   - Fleet size
   - Vehicle type mix
   - Annual miles per vehicle
   - Fuel/energy costs
   - Maintenance costs
6. Apply constraints:
   - Budget limit: $850,000/year
   - Vehicle availability: Standard lead time 8 weeks
   - Charging infrastructure: $2,500 per charging station
7. Run optimization calculation for all scenarios
8. Verify system projects for each scenario:
   - Total annual costs
   - Fleet emissions (CO2 equivalent)
   - Performance metrics (utilization, MPG, etc.)
   - ROI timeline
9. Compare scenarios side-by-side:
   - Scenario 1 (Current): $3,287,600/year, 1,247 tons CO2/year
   - Scenario 2 (Partial EV): $3,145,200/year, 892 tons CO2/year
   - Scenario 3 (Full EV): $2,987,400/year, 324 tons CO2/year
10. View recommended fleet composition based on optimization algorithm
11. View implementation roadmap for approved scenario
12. Adjust scenario variables and recalculate
13. Save scenario 2 for later review
14. Load saved scenario and verify data persists
15. Share scenario with leadership for approval

#### Expected Results:
- All 3 scenarios created with proper variable configuration
- Optimization algorithm processes all constraints
- Cost projections calculated for each scenario
- Emissions calculations accurate for each vehicle type
- Performance metrics calculated for each scenario
- ROI timeline shows payback period for higher-cost scenarios
- Scenario comparison displays clear deltas
- Implementation roadmap generated with timeline
- Scenarios save and load correctly
- Variables adjusted and recalculation completes in <10 seconds
- Share functionality enables collaboration with leadership

#### Acceptance Criteria:
- Scenario variables properly configured and validated
- Optimization algorithm includes all constraint checks
- Cost projections accurate within 2% of historical data
- Emissions calculated using EPA factors for vehicle types
- ROI calculation includes total lifecycle costs
- Side-by-side comparison shows performance deltas clearly
- Implementation roadmap includes timeline and dependencies
- Saved scenarios persist in database
- Variable changes trigger recalculation automatically
- Share function includes audit trail of access

#### Test Data:
- 287 total vehicles in fleet
- Scenario 1 costs: $3,287,600/year
- Scenario 2 costs: $3,145,200/year (4.3% savings)
- Scenario 3 costs: $2,987,400/year (9.1% savings)
- Scenario 3 emissions: 324 tons CO2/year (73.9% reduction)
- EV charging infrastructure: $2,500/station
- Current CO2 emissions: 1,247 tons/year

---

### TC-FM-011: Carbon Footprint Reduction Planning - Emissions Tracking

**Test Case ID**: TC-FM-011
**Name**: Verify Emissions Tracking and Reduction Goal Planning
**Related US/UC**: US-FM-014
**Priority**: Medium
**Test Type**: Functional Test
**Category**: Strategic Planning and Forecasting

#### Preconditions:
- Fleet Manager is logged in with sustainability permissions
- Fuel consumption data available for all vehicles
- EPA emissions factors configured for all vehicle types
- EV specifications configured in system
- 12+ months of historical emissions data available

#### Test Steps:
1. Navigate to Carbon Footprint dashboard
2. Verify dashboard displays total fleet emissions:
   - CO2: 1,247 metric tons/year
   - NOx: 12.4 metric tons/year
   - PM (particulate matter): 1.8 metric tons/year
3. View emissions breakdown by:
   - Vehicle type (diesel trucks: 78%, vans: 15%, specialized: 7%)
   - Individual vehicle (top 10 highest emitters)
4. Set emissions reduction targets:
   - CO2 reduction target: 25% by 2027
   - Target year: 2027
   - Baseline year: 2023
5. Verify baseline emissions: 1,247 tons CO2 (2023 actual)
6. Calculate target emissions: 935 tons CO2 (2027 goal)
7. Model EV adoption scenario impact on emissions:
   - Replace 80 diesel vans with electric vans
   - Projected CO2 reduction: 215 tons/year (17.2%)
8. Verify system calculates:
   - Emissions from fuel consumption: (Gallons consumed × EPA factor)
   - EV charging emissions based on grid mix (varies by location)
9. Dashboard shows progress toward goals:
   - Current year emissions: 1,187 tons CO2 (2.4% reduction so far)
   - On pace for target: No (need 25% by 2027)
10. View carbon offset options and costs
11. Calculate carbon offset costs:
    - Remaining emissions to offset: 252 tons (if EV adoption proceeds)
    - Offset cost: $15.00/ton = $3,780/year
12. Export sustainability report for CSR/ESG reporting
13. View recommended emission reduction strategies ranked by impact
14. Verify trend analysis showing progress toward goals
15. Compare fleet to industry benchmarks

#### Expected Results:
- Emissions calculated using EPA emissions factors
- CO2 emissions: Gallons × 10.15 kg CO2/gallon / 1,000 = metric tons
- Emissions data updated based on fuel consumption input
- Vehicle-level emissions calculated and aggregated
- EV emissions calculated based on grid energy sources
- Reduction targets properly configured and tracked
- Offset cost calculation: Emissions (metric tons) × Price per ton
- Benchmarking data sourced from EPA Fleet Performance data
- Progress toward goal displayed as percentage
- Trend analysis shows month-over-month/year-over-year changes
- Reports export with professional ESG formatting

#### Acceptance Criteria:
- Emissions calculations verified against EPA methodology
- All vehicle types have correct emission factors
- EV emissions account for grid mix variability
- Baseline emissions accurately recorded
- Reduction targets clearly defined and trackable
- Progress dashboard updated weekly with latest fuel data
- Offset calculations accurate to nearest $100
- Recommended strategies ranked by cost-effectiveness
- Trend analysis shows accurate progress
- ESG reports include all required emissions data

#### Test Data:
- Current CO2 emissions: 1,247 metric tons/year
- Current NOx emissions: 12.4 metric tons/year
- Current PM emissions: 1.8 metric tons/year
- 2027 CO2 target: 935 metric tons (25% reduction)
- Baseline year: 2023
- YTD emissions: 1,187 tons (2.4% reduction achieved)
- EV adoption impact: 215 tons CO2 reduction
- Carbon offset cost: $15/metric ton
- Remaining offset need: 252 tons = $3,780

---

### TC-FM-012: Vehicle Disposition - Sale and Asset Removal

**Test Case ID**: TC-FM-012
**Name**: Verify Vehicle Disposition Process and Asset Accounting
**Related US/UC**: US-FM-003, UC-FM-003
**Priority**: Medium
**Test Type**: Functional Test
**Category**: Vehicle Lifecycle Management

#### Preconditions:
- Fleet Manager is logged in with disposition permissions
- Vehicle #127 is marked for disposition
- Market value data is current
- Accounting system integration is active
- Disposal vendor relationships are established

#### Test Steps:
1. Navigate to Vehicle Disposition dashboard
2. Select Vehicle #127 for disposition:
   - Vehicle: 2014 Freightliner Cascadia
   - Age: 11 years, 287,000 miles
   - Current status: Fully depreciated (book value: $0)
   - Reason for disposition: End of useful life
3. Request market valuation:
   - System queries NADA/KBB data
   - Retrieved market value: $12,000-$14,500
   - Selected market value: $13,000
4. Review disposition method options:
   - Auction: Expected 90-95% of market value = $11,700-$12,350
   - Trade-in: Expected 85-90% = $11,050-$11,700
   - Direct sale: Expected 80-85% = $10,400-$11,050
   - Donation: Tax value ~$6,500 (50% of market value)
5. Select Option 1 (Auction)
6. Generate disposition package:
   - Complete service history (1,247 maintenance records)
   - Accident history (1 minor incident in 2019)
   - Inspection photos
   - Title and registration documents
   - Equipment documentation
7. Calculate disposition timeline:
   - Preparation: 5 business days
   - Auction listing: 7-10 days
   - Auction event: 1 day
   - Payment and title transfer: 5 business days
   - Total: 18-21 days
8. Submit vehicle to approved auction house
9. Set parameters:
   - Estimated value: $13,000
   - Reserve price: $11,000
   - Condition: Fair - mechanical sound, cosmetic wear
10. Create work order for vehicle preparation
11. Verify preparation tasks:
    - Fuel tank emptying
    - Deep cleaning
    - Final inspection
    - Paperwork staging
12. After auction completion, record disposition result:
    - Auction proceeds: $12,800
13. Update claim in system:
    - Disposition method: Auction
    - Sale price: $12,800
    - Gain/(Loss) vs book value: $12,800 (fully depreciated)
14. Verify accounting updates:
    - Asset removed from balance sheet
    - Gain recorded in P&L: $12,800
    - Cash received: $12,800
15. Verify vehicle status changed to "Retired - Sold"
16. Verify vehicle removed from active fleet dashboard

#### Expected Results:
- Disposition package generated with all required documents
- Market valuation retrieved and displayed with sources
- Disposition method options calculated with expected proceeds
- Timeline calculated with each step's duration
- Auction submission successful with proper parameters
- Preparation work order created and tracked
- Disposition proceeds recorded accurately
- Accounting system updated for asset disposal
- Vehicle status transitions from active to retired
- Vehicle removed from all active dashboards and reports
- Historical records archived for audit trail
- Gain/Loss on disposition calculated accurately

#### Acceptance Criteria:
- Disposition package includes all required documentation
- Market valuation sources cited and current
- All disposition method proceeds calculated accurately
- Timeline realistic with all steps included
- Preparation tasks tracked to completion
- Accounting entries made with proper account codes
- Gain/Loss calculation verified by finance
- Vehicle fully removed from active tracking
- Historical data archived and accessible for audit
- Asset disposal approval workflow followed

#### Test Data:
- Vehicle #127: 2014 Freightliner Cascadia, 287,000 miles
- Book value: $0 (fully depreciated)
- Market value: $13,000
- Auction proceeds: $12,800
- Gain on disposition: $12,800
- Disposal costs: $0 (covered by auction house)
- Timeline: 18-21 days actual
- Disposal method: Auction house (National Auto Auction)

---

## INTEGRATION TESTS

### TC-FM-013: Real-Time Telematics Data Integration - WebSocket Synchronization

**Test Case ID**: TC-FM-013
**Name**: Verify Real-Time Telematics Data Integration and WebSocket Updates
**Related US/UC**: US-FM-004
**Priority**: High
**Test Type**: Integration Test
**Category**: Fleet Performance Analytics

#### Preconditions:
- Fleet Manager is logged in
- Telematics platform is operational (Samsara, Verizon, etc.)
- WebSocket connections established
- Redis caching layer active
- 287 vehicles with telematics devices installed
- At least 210 vehicles are actively in use

#### Test Steps:
1. Establish WebSocket connection to `/ws/fleet-status` endpoint
2. Verify connection established within 2 seconds
3. Monitor live vehicle location updates (30-second interval)
4. Verify vehicle position accuracy within 100 meters
5. Simulate vehicle movement event (e.g., vehicle exits depot)
6. Verify location update received via WebSocket within 35 seconds
7. Monitor ignition on/off events
8. Verify ignition events trigger:
   - Vehicle status change (active/idle)
   - Trip start/end tracking
   - Utilization calculation update
9. Monitor harsh driving detection events:
   - Harsh acceleration
   - Harsh braking
   - Harsh cornering
   - Speeding events
10. Verify harsh driving events logged within 5 seconds
11. Monitor fuel level changes from telematics
12. Verify fuel level updates trigger:
    - Fuel economy calculations
    - Fuel refill detection
    - Fuel consumption tracking
13. Test error handling - simulate telematics service interruption
14. Verify system gracefully degrades and logs error
15. Verify automatic reconnection attempt within 30 seconds
16. Monitor Redis cache hit rate for vehicle data
17. Verify Redis cache improves dashboard load time by >50%
18. Verify cache TTL appropriate (5 minutes for vehicle status)
19. Test WebSocket disconnection and reconnection
20. Verify no data loss during connection interruption

#### Expected Results:
- WebSocket connection established within 2 seconds
- Location updates received every 30 seconds with <5 second variance
- Location accuracy within 100 meters (typical GPS accuracy)
- Ignition events trigger status changes immediately
- Harsh driving events logged within 5 seconds of occurrence
- Fuel level changes tracked and calculations updated
- Redis cache reduces database queries by >50%
- Service interruptions handled gracefully with logging
- Automatic reconnection completes within 30 seconds
- No data loss during connection transitions
- WebSocket maintains connection for >24 hours without restart

#### Acceptance Criteria:
- All 287 vehicles receive real-time location updates
- Vehicle position accuracy verified against GPS baseline
- Ignition events trigger corresponding system updates
- Harsh driving events logged with correct timestamp
- Fuel data integrated with consumption calculations
- Redis cache improves performance measurably
- Error handling prevents system crashes
- Automatic reconnection functional and logged
- Connection stability verified over extended period
- Data integrity maintained through connection transitions

#### Test Data:
- 287 vehicles connected to telematics platform
- 210 active vehicles (location updating)
- 77 vehicles idle (status "Not in use")
- Location update interval: 30 seconds
- 8 harsh driving events logged during test
- 3 fuel refill events detected during test
- Redis cache TTL: 5 minutes
- Telematics API response time: <500ms average

---

### TC-FM-014: VIN Decoder API Integration - Data Accuracy and Fallback

**Test Case ID**: TC-FM-014
**Name**: Verify VIN Decoder Integration and Data Accuracy
**Related US/UC**: US-FM-002, UC-FM-002
**Priority**: High
**Test Type**: Integration Test
**Category**: Vehicle Lifecycle Management

#### Preconditions:
- VIN decoder service is configured (NHTSA API or commercial provider)
- Fleet Manager is logged in with vehicle registration permissions
- 10+ test VINs from various manufacturers prepared
- Fallback manual entry process configured

#### Test Steps:
1. Test VIN decoding with valid VIN: 1HGCB41JXMN109186
2. Verify system queries VIN decoder API
3. Verify API returns complete vehicle data:
   - Make: Freightliner
   - Model: Cascadia
   - Year: 2025
   - Body type: Truck
   - Engine size and type: Cummins ISX 15-liter
   - Transmission: Allison automatic
   - GVWR: 33,000 lbs
   - Other specifications
4. Test VIN decoding with 10 additional VINs from different manufacturers
5. Verify all decoding results accurate (100% match to known specs)
6. Test VIN with special characters and case-sensitivity
7. Verify system normalizes VIN format correctly
8. Simulate VIN decoder service unavailable
9. Verify system displays graceful error message
10. Verify fallback manual entry form appears
11. Fleet Manager manually enters vehicle specifications
12. Verify manual entry form has all required fields
13. Verify system marks record as "Manual entry - verify specs"
14. Configure retry mechanism for failed VIN decodes
15. Verify system retries every 5 minutes up to 10 attempts
16. Test VIN with known errors/corrections
17. Verify system identifies and handles edge cases
18. Test batch VIN processing (10 vehicles in bulk registration)
19. Verify batch processing completes in <30 seconds
20. Verify all VINs processed with success/failure status

#### Expected Results:
- VIN decoding completes in <5 seconds per vehicle
- All vehicle specifications retrieved and populated correctly
- VIN format normalized and validated
- All special characters handled correctly
- Case-insensitivity verified (VIN is normalized to uppercase)
- Service interruption handled with graceful error message
- Fallback manual entry fully functional
- Retry mechanism functions with proper backoff
- Edge cases handled (invalid VIN format, missing data, etc.)
- Batch processing efficient and reliable
- API integration logging complete for troubleshooting
- VIN decoding accuracy verified at 100%

#### Acceptance Criteria:
- VIN decoder API integration tested with 10+ VINs
- All test VINs decoded with 100% accuracy
- API response time <5 seconds per VIN
- Fallback manual entry works seamlessly
- Error handling prevents registration failure
- Retry mechanism functions without manual intervention
- Batch processing works for up to 50 vehicles
- VIN decoding results logged for audit trail
- API credentials securely stored and managed
- Integration logging enabled for troubleshooting

#### Test Data:
- Valid VIN examples: 1HGCB41JXMN109186, 2FRWF5GS7GA123456, 5GAEV23W06J160251
- Invalid VIN examples: INVALID123456789, 123456789101112131, 1HGCB41JX (too short)
- Batch test: 25 vehicles for bulk registration
- Expected API response time: 2-4 seconds
- VIN decoder retry interval: 5 minutes
- Maximum retry attempts: 10

---

### TC-FM-015: Accounting System Integration - Asset and Cost Synchronization

**Test Case ID**: TC-FM-015
**Name**: Verify Accounting System Integration for Vehicle Assets and Costs
**Related US/UC**: US-FM-002, US-FM-009
**Priority**: High
**Test Type**: Integration Test
**Category**: Budget and Financial Management

#### Preconditions:
- Fleet management system is integrated with accounting system
- Chart of accounts is configured and mapped
- Depreciation calculation engine is operational
- Cost data feeds are active
- Accounting system API is accessible
- Test environment has matching accounting records

#### Test Steps:
1. Register new vehicle (TC-FM-002 scenario):
   - Vehicle: 2025 Freightliner Cascadia
   - Purchase price: $42,500
   - Useful life: 5 years
   - Salvage value: $8,500
2. Verify system creates asset record in accounting system:
   - Asset ID: FLT-2025-0287
   - Cost: $42,500
   - Depreciation method: MACRS 5-year
   - Depreciation schedule: Created automatically
3. Verify monthly depreciation expense recorded:
   - Monthly depreciation: $42,500 / 60 months = $708.33
   - Account: "Depreciation Expense" (account code: 5150)
   - Contra account: "Accumulated Depreciation" (account code: 1250)
4. Verify fuel costs recorded in accounting:
   - Fuel transaction from dispatch: $250.50 (45 gallons @ $5.56/gal)
   - Account: "Fuel Expense" (account code: 5210)
5. Verify maintenance costs recorded:
   - Work order cost: $1,200 (oil change, tire rotation)
   - Account: "Maintenance and Repairs" (account code: 5220)
6. Verify insurance costs recorded:
   - Monthly insurance: $500
   - Account: "Vehicle Insurance" (account code: 5240)
7. Test vehicle disposition (TC-FM-012 scenario):
   - Vehicle #127 sold at auction for $12,800
8. Verify accounting system updated:
   - Asset removed from balance sheet
   - Gain on sale recorded: $12,800
   - Cash received: $12,800
9. Verify budget cost feed integration:
   - YTD costs retrieved from accounting
   - Budget vs actual comparison accurate
10. Verify depreciation schedule recalculation:
    - If salvage value adjusted, depreciation recalculated
    - Schedule updated in both systems
11. Test month-end reconciliation:
    - Fleet system costs vs accounting system costs
    - Verify difference <$100 (tolerance)
12. Generate reconciliation report
13. Verify cost allocation by vehicle:
    - Each vehicle tracked with associated costs
    - Allocation methodology consistent with accounting
14. Test year-end closing process:
    - Final depreciation entries made
    - Asset dispositions finalized
    - P&L entries closed to retained earnings
15. Verify audit trail complete for all transactions

#### Expected Results:
- Asset record created in accounting system within 5 seconds
- Monthly depreciation calculated and recorded automatically
- All cost transactions recorded in correct accounts
- Vehicle disposition updates balance sheet correctly
- Budget vs actual comparison matches accounting data
- Reconciliation completes with tolerance <$100
- Cost allocation accurate by vehicle
- Year-end closing processes correctly
- Audit trail complete and searchable
- API integration reliable with >99.9% uptime

#### Acceptance Criteria:
- Asset registration in accounting system 100% complete
- Monthly depreciation calculated per MACRS schedule
- All costs recorded within 24 hours of occurrence
- Vehicle disposition accounting entries correct
- Month-end reconciliation tolerance <$100
- Cost allocation verified by sample audit
- Year-end closing completed without errors
- Audit trail searchable and complete
- Integration latency <2 seconds per transaction
- Error handling prevents data loss

#### Test Data:
- New vehicle: $42,500 cost, 5-year life, $8,500 salvage
- Monthly depreciation: $708.33
- Monthly fuel costs: $2,400-$3,200 (fleet average)
- Monthly maintenance: $800-$1,200
- Monthly insurance: $5,000 (fleet total)
- Vehicle disposition: $12,800 proceeds, $0 book value, $12,800 gain
- YTD costs: $3,156,800
- Reconciliation tolerance: <$100

---

### TC-FM-016: Market Value Data Integration - Valuation and Benchmarking

**Test Case ID**: TC-FM-016
**Name**: Verify Market Valuation Data Integration and Benchmarking
**Related US/UC**: US-FM-001, US-FM-003
**Priority**: Medium
**Test Type**: Integration Test
**Category**: Vehicle Lifecycle Management

#### Preconditions:
- Market valuation data provider is configured (NADA, KBB, or similar)
- Market data API is operational and accessible
- Fleet contains vehicles from multiple years and types
- Test data with known market values prepared

#### Test Steps:
1. Request vehicle valuation:
   - Vehicle: 2014 Freightliner Cascadia, 287,000 miles
   - Condition: Fair (mechanical sound, cosmetic wear)
2. Verify system queries market data provider
3. Verify system retrieves:
   - Low market value: $12,000
   - Mid market value: $13,000
   - High market value: $14,500
   - Source: NADA/KBB with date updated
4. Test valuation for 10 different vehicle types:
   - Freightliner trucks
   - Peterbilt trucks
   - Commercial vans
   - Specialized vehicles
   - Hybrid/Electric vehicles
5. Verify all valuations within expected ranges
6. Test mileage impact on valuation:
   - Same vehicle with different mileage
   - Higher mileage = lower valuation
   - Valuation decrease consistent with market trends
7. Test condition impact on valuation:
   - Same vehicle with different conditions (Excellent, Good, Fair, Poor)
   - Condition impacts valuation proportionally
8. Retrieve benchmarking data:
   - Vehicle type average market value
   - Year-over-year value trend
   - Regional valuation differences (if applicable)
9. Verify benchmarking data accuracy:
   - Freightliner Cascadia 2014: Benchmark $12,500-$13,500
   - Fleet vehicle matches benchmark
10. Compare current fleet market values:
    - Total fleet value calculation
    - Average vehicle value by type
    - Value trend over time
11. Test market data update frequency:
    - Verify data updated quarterly (or per contract)
    - Check last update date in system
12. Verify stale data handling:
    - Data >90 days old flagged as "outdated"
    - Alert sent to request fresh valuation
13. Test bulk valuation request:
    - Request market values for all 287 fleet vehicles
    - Bulk operation completes in <60 seconds
14. Verify valuation caching:
    - Valuation requests cached for same vehicle/mileage/condition
    - Cache timeout: 30 days (or per data provider)
15. Test valuation with incomplete data:
    - Request valuation with missing condition or mileage
    - System requests required data
    - Does not return incomplete valuation

#### Expected Results:
- Market valuation retrieved from API in <5 seconds
- Valuation data includes low/mid/high range with source
- All test vehicles valued within expected market ranges
- Mileage impact on valuation verified (consistent decline)
- Condition impact on valuation verified
- Benchmarking data accurate and current
- Bulk valuation operation efficient
- Caching improves performance for repeated requests
- Stale data detection functional
- API integration reliable with >99% uptime

#### Acceptance Criteria:
- Valuation API response time <5 seconds per vehicle
- All 287 vehicles can be valued in <60 seconds (bulk)
- Valuation range accuracy within 5% of manual research
- Benchmarking data sourced from credible providers
- Mileage and condition factors applied correctly
- Bulk valuation cache reduces repeat API calls by >80%
- Stale data alerts trigger at correct interval
- Missing data handling prevents invalid valuations
- Integration logging complete for troubleshooting
- Data provider credentials securely managed

#### Test Data:
- Vehicle #127: 2014 Freightliner, 287,000 miles, Fair condition = $13,000
- Vehicle #245: 2014 Peterbilt, 267,500 miles, Good condition = $14,200
- Vehicle #156: 2016 Volvo, 198,750 miles, Good condition = $18,500
- Benchmark 2014 Freightliner: $12,500-$13,500
- Bulk valuation: 287 vehicles in <60 seconds
- Valuation cache: 30-day TTL
- Data update frequency: Quarterly

---

### TC-FM-017: Compliance Database Integration - License and Inspection Tracking

**Test Case ID**: TC-FM-017
**Name**: Verify Compliance Data Integration with DMV and Regulatory Databases
**Related US/UC**: US-FM-011
**Priority**: High
**Test Type**: Integration Test
**Category**: Compliance and Risk Management

#### Preconditions:
- Compliance data provider is configured (state DMV APIs where available)
- Fleet contains 287 vehicles with complete registration data
- Vehicle inspection history available
- Driver certification tracking system active
- Compliance alert system operational

#### Test Steps:
1. Sync vehicle registration data with state DMV:
   - Vehicle: CTF-4827 (2025 Freightliner Cascadia)
   - License plate: CTF-4827
   - Verify registration status: Active
   - Verify expiration date: 11/30/2025 (30 days - ALERT)
2. Query DMV for all 287 vehicle registrations
3. Verify registration status for each vehicle:
   - Active: 281 vehicles
   - Expiring within 30 days: 6 vehicles
   - Expired: 0 vehicles
4. Retrieve vehicle inspection records:
   - Vehicle #127: Last inspection 10/15/2025
   - Next inspection due: 10/15/2026 (on schedule)
   - Inspection status: Passed
5. Query inspection database for all 287 vehicles
6. Identify vehicles with:
   - Overdue inspections: 0 vehicles
   - Inspections due within 30 days: 4 vehicles
7. Verify driver license status integration:
   - Driver #001: License valid, expires 05/30/2026
   - Commercial endorsement: Valid
   - Medical certification: Valid, expires 12/15/2025
8. Query driver database for all 156 drivers
9. Identify drivers with:
   - Expired licenses: 0 drivers
   - Licenses expiring within 30 days: 8 drivers
   - Medical certification expiring within 30 days: 3 drivers
10. Verify permit data integration:
    - Vehicle permits tracked by type (hazmat, oversized, etc.)
    - Permits expiring within 30 days: 2 permits
11. Verify safety incident data integration:
    - Safety incidents retrieved from incident database
    - Linked to corresponding insurance claims
12. Test alert generation for critical compliance items:
    - System generates alerts for expiring registrations (<30 days)
    - System generates alerts for overdue inspections
    - System generates alerts for expiring licenses/certifications
13. Verify alert delivery to appropriate personnel:
    - Fleet Manager: All alerts
    - Maintenance Manager: Inspection-related alerts
    - HR Manager: Driver certification alerts
14. Test compliance report generation:
    - Generate report of all compliance items status
    - Include expiration dates and risk levels
    - Export as PDF for audit trail
15. Verify historical compliance data tracking:
    - Query compliance records for past 24 months
    - Verify complete audit trail

#### Expected Results:
- DMV registration data syncs within 2 hours of update
- Registration status accurate for all 287 vehicles
- Inspection records retrieved and compared to schedule
- Driver license status verified for all 156 drivers
- Alerts generated for all critical compliance items
- Alert delivery within 5 minutes of alert trigger
- Compliance reports generated with complete data
- Historical data searchable for 24+ months
- API integration logging complete
- System gracefully handles missing/unavailable data

#### Acceptance Criteria:
- DMV data integration successful for all vehicles
- Inspection data accurate and current (within 1 day)
- Driver license status verified through DMV
- Alert generation triggers at correct intervals (30/60/90 days)
- Alert delivery to correct recipients confirmed
- Compliance reports include all required items
- Historical data retention meets regulatory requirements
- Missing data flagged but does not prevent report generation
- Integration error logging enables troubleshooting
- Compliance data privacy/security maintained

#### Test Data:
- 287 vehicles with valid registrations
- 6 vehicles with registration expiring within 30 days
- 4 vehicles with inspections due within 30 days
- 156 drivers in compliance tracking
- 8 drivers with certifications expiring within 30 days
- 3 drivers with medical cert expiring within 30 days
- 2 vehicle permits expiring within 30 days
- 0 overdue inspections or expired registrations

---

## PERFORMANCE TESTS

### TC-FM-018: Dashboard Load Performance - Concurrent User Simulation

**Test Case ID**: TC-FM-018
**Name**: Verify Dashboard Performance Under Load
**Related US/UC**: US-FM-004
**Priority**: High
**Test Type**: Performance Test
**Category**: Fleet Performance Analytics

#### Preconditions:
- Fleet dashboard is deployed and operational
- 287 vehicles with real-time data feeds
- Performance monitoring tools configured
- Database indexes optimized
- CDN or caching layer operational

#### Test Steps:
1. Establish baseline single-user load time
   - Load dashboard with 1 user
   - Measure page load time
   - Target: <3 seconds
2. Simulate concurrent user load:
   - 5 concurrent Fleet Managers accessing dashboard
   - Measure average page load time
   - Verify <5 second response time
3. Increase concurrent load:
   - 10 concurrent Fleet Managers
   - Measure page load time
   - Verify <5 second response time
4. Increase concurrent load:
   - 25 concurrent Fleet Managers
   - Measure page load time
   - Verify <7 second response time
5. Monitor dashboard metrics during load:
   - Real-time vehicle location updates
   - Key metric updates (utilization, fuel efficiency, etc.)
   - Widget rendering performance
6. Test filter operation under load:
   - Apply filter: By location, vehicle type, date range
   - Measure filter response time
   - Verify <2 second response with full dataset
7. Test drill-down operation under load:
   - Click vehicle detail link
   - Measure detail page load time
   - Verify <2 second response
8. Monitor server metrics during test:
   - CPU utilization
   - Memory utilization
   - Database connection count
   - API response times
9. Verify database query performance:
   - Monitor slow query log
   - Verify no queries >5 seconds
   - Verify database optimization effective
10. Test WebSocket performance under load:
    - Verify 25 concurrent WebSocket connections
    - Monitor memory usage per connection
    - Verify no connection drops
11. Measure network bandwidth consumption:
    - Single user baseline
    - 25 concurrent users
    - Verify bandwidth within acceptable range
12. Test cache effectiveness:
    - Monitor cache hit rate
    - Target: >80% hit rate for vehicle data
13. Load test duration: 30 minutes of sustained load
14. Verify no performance degradation over time
15. Capture performance metrics for analysis and optimization

#### Expected Results:
- Single user dashboard load: <3 seconds
- 5 concurrent users dashboard load: <5 seconds
- 10 concurrent users dashboard load: <5 seconds
- 25 concurrent users dashboard load: <7 seconds
- Filter operation: <2 seconds with 287 vehicles
- Detail page load: <2 seconds
- WebSocket connections: 25+ concurrent without drops
- Cache hit rate: >80% for vehicle data
- Database queries: All <5 seconds (no slow queries)
- CPU utilization: <70% at peak load
- Memory utilization: <80% at peak load
- Sustained 30-minute load: No performance degradation
- Network bandwidth: <10 Mbps per user

#### Acceptance Criteria:
- Dashboard meets all load performance targets
- No timeout errors during sustained load
- WebSocket connections stable for 30+ minutes
- Cache effectiveness verified with >80% hit rate
- Database performance verified with no slow queries
- Server resources remain within acceptable limits
- Performance consistent from start to end of test
- All metrics logged for optimization analysis
- Load test results documented for future baselines

#### Test Data:
- 287 vehicles with real-time data
- Concurrent user scenarios: 1, 5, 10, 25 users
- Test duration: 30 minutes per scenario
- Target page load time: <7 seconds (25 users)
- Target filter response: <2 seconds
- Cache TTL: 5 minutes for vehicle data
- Database connection pool: 50 connections

---

### TC-FM-019: Report Generation Performance - Large Dataset Export

**Test Case ID**: TC-FM-019
**Name**: Verify Report Generation Performance for Large Datasets
**Related US/UC**: US-FM-001, US-FM-004, US-FM-009
**Priority**: Medium
**Test Type**: Performance Test
**Category**: Fleet Performance Analytics

#### Preconditions:
- Report generation engine is operational
- 287 vehicles with 12+ months of data
- Cost history data available for all vehicles
- Compliance data complete and current
- PDF/Excel export libraries configured

#### Test Steps:
1. Generate fleet composition report (287 vehicles):
   - Include: Vehicle type, age, mileage, replacement score
   - Format: PDF with charts
   - Measure generation time
   - Target: <10 seconds
2. Generate cost per mile report (287 vehicles, 12 months):
   - Include: Monthly CPM trends, comparisons, benchmarks
   - Format: Excel with charts
   - Measure generation time
   - Target: <15 seconds
3. Generate budget vs actual report (12 months, 5 categories):
   - Include: Month-by-month comparison, variance analysis
   - Format: PDF with charts and tables
   - Measure generation time
   - Target: <10 seconds
4. Generate utilization report (287 vehicles, 12 months):
   - Include: Vehicle utilization trends, idle asset analysis
   - Format: Excel with detailed breakdown
   - Measure generation time
   - Target: <15 seconds
5. Generate compliance report (287 vehicles, 156 drivers):
   - Include: All compliance items, expiration dates, audit trail
   - Format: PDF, audit-ready
   - Measure generation time
   - Target: <20 seconds
6. Generate vendor performance report (15 vendors, 12 months):
   - Include: Performance metrics, work order history, scorecards
   - Format: PDF with comparisons
   - Measure generation time
   - Target: <10 seconds
7. Generate TCO projection report (5 vehicle scenarios):
   - Include: Cost projections, charts, sensitivity analysis
   - Format: PDF, professional presentation
   - Measure generation time
   - Target: <15 seconds
8. Test report scheduling (batch generation):
   - Schedule reports to generate overnight
   - Generate: 10 reports concurrently
   - Measure total time
   - Target: <120 seconds
9. Monitor system resources during report generation:
   - CPU utilization
   - Memory utilization
   - Disk I/O
10. Verify export file quality:
    - PDF formatting correct and readable
    - Excel formulas calculate correctly
    - Charts display properly
    - Tables formatted consistently
11. Test concurrent report generation:
    - 5 users generating different reports
    - Measure performance
    - Verify <20 second impact on other users
12. Verify file download performance:
    - Export file size: 2-5 MB typical
    - Download time: <5 seconds
13. Test email delivery of generated reports:
    - Schedule report to email recipient
    - Verify delivery <30 seconds after generation
14. Monitor database during report generation:
    - Query count and duration
    - Verify no locks or slowdowns
15. Verify report storage and archival:
    - Reports stored in blob storage
    - Historical reports accessible
    - Cleanup of old reports functional

#### Expected Results:
- All reports generate within specified time targets
- Report quality verified (formatting, content, charts)
- System resources remain within acceptable limits
- Batch report generation completes efficiently
- File downloads complete in <5 seconds
- Email delivery of reports <30 seconds
- Database performance not significantly impacted
- No errors during concurrent report generation
- Reports properly stored and archived
- Performance consistent across different report types

#### Acceptance Criteria:
- All report types generate successfully
- PDF reports export with correct formatting
- Excel reports have working formulas and charts
- Report generation times meet targets (±20%)
- Batch generation completes within 2 minutes
- Concurrent report generation supported
- Email delivery functional and reliable
- Database not overloaded by report generation
- Reports accessible from archival storage
- Performance monitoring data logged for analysis

#### Test Data:
- 287 vehicles with complete historical data
- 12 months of cost/utilization data
- 156 drivers with compliance records
- 15 active vendors with work order history
- 5 TCO scenarios for projection report
- Report file sizes: 2-5 MB typical
- Concurrent report generation: 5 users

---

### TC-FM-020: API Response Time Under Load - Endpoint Performance

**Test Case ID**: TC-FM-020
**Name**: Verify API Response Times Under Load
**Related US/UC**: US-FM-001, US-FM-004, US-FM-005
**Priority**: High
**Test Type**: Performance Test
**Category**: Fleet Performance Analytics

#### Preconditions:
- Fleet management REST API is deployed
- All endpoints operational
- Load testing tools configured (JMeter, LoadRunner, etc.)
- API rate limiting configured
- Performance monitoring active

#### Test Steps:
1. Establish single-request baseline for each endpoint:
   - GET `/api/fleet/replacement-analysis` (no parameters)
   - Measure response time
   - Target: <1 second
2. Test: GET `/api/dashboard/fleet-manager`
   - Load dashboard data for 287 vehicles
   - Measure response time
   - Target: <2 seconds
3. Test: GET `/api/analytics/cost-per-mile`
   - Query CPM data for all 287 vehicles, 12 months
   - Measure response time
   - Target: <3 seconds
4. Test: GET `/api/analytics/utilization`
   - Query utilization data for all 287 vehicles
   - Measure response time
   - Target: <2 seconds
5. Test: GET `/api/budget/comparison`
   - Query budget vs actual for full year, 5 categories
   - Measure response time
   - Target: <2 seconds
6. Test: GET `/api/compliance/dashboard`
   - Query compliance status for 287 vehicles, 156 drivers
   - Measure response time
   - Target: <2 seconds
7. Test: GET `/api/vendors/performance`
   - Query vendor metrics for 15 vendors, 12 months
   - Measure response time
   - Target: <1 second
8. Simulate concurrent API requests:
   - 10 concurrent requests to `/api/dashboard/fleet-manager`
   - Measure average response time
   - Verify all requests <3 seconds
9. Simulate concurrent API requests:
   - 25 concurrent requests to mixed endpoints
   - Measure average response time
   - Verify all requests <5 seconds
10. Simulate concurrent API requests:
    - 50 concurrent requests to all endpoints
    - Measure response time distribution
    - Verify 95th percentile <5 seconds
11. Test POST endpoint: `POST /api/analytics/tco-projection`
    - Send TCO calculation request
    - Measure response time
    - Target: <5 seconds
12. Test API rate limiting:
    - Send 100 requests in 10 seconds
    - Verify rate limiting activated
    - Verify appropriate HTTP 429 responses
13. Monitor error handling under load:
    - Verify no 500 errors during load test
    - Verify proper 429 rate limit responses
    - Verify no dropped requests
14. Test API caching effectiveness:
    - Repeat requests to same endpoint
    - Verify cache hits reduce response time by >50%
15. Measure API gateway performance:
    - Verify gateway adds <100ms latency
    - Verify gateway handles load properly

#### Expected Results:
- Single-request baseline met for all endpoints
- Concurrent request handling maintains <5 second responses
- Rate limiting activates appropriately
- Error handling graceful with proper HTTP responses
- API caching improves performance for repeat requests
- No 500 errors or dropped requests under load
- API gateway adds minimal latency
- 95th percentile response time <5 seconds at 50 concurrent
- Performance consistent throughout test duration
- Database query optimization effective

#### Acceptance Criteria:
- All endpoints respond within target time (<3 seconds typical)
- 10 concurrent requests: All <3 seconds
- 25 concurrent requests: All <5 seconds
- 50 concurrent requests: 95th percentile <5 seconds
- Rate limiting functional with HTTP 429 responses
- No errors (500) during sustained load
- Caching improves performance by >50%
- API gateway latency <100ms
- Error handling verified for edge cases
- Performance data logged for analysis

#### Test Data:
- 287 vehicles in dataset
- 156 drivers in dataset
- 15 vendors in dataset
- 12 months of historical data
- Concurrent request scenarios: 10, 25, 50 users
- Rate limit: 100 requests per 10 seconds
- Test duration: 30 minutes per scenario

---

## SECURITY TESTS

### TC-FM-021: Role-Based Access Control - Permission Verification

**Test Case ID**: TC-FM-021
**Name**: Verify Role-Based Access Control for Fleet Manager Role
**Related US/UC**: All Fleet Manager user stories
**Priority**: High
**Test Type**: Security Test
**Category**: Authorization and Access Control

#### Preconditions:
- Fleet Manager user account created and active
- Other role accounts available for testing (Driver, Dispatcher, Finance Manager)
- RBAC system is properly configured
- All protected endpoints require authentication
- Role permissions are defined in system configuration

#### Test Steps:
1. Test Fleet Manager permissions - Verify CAN access:
   - Vehicle Acquisition Planning dashboard
   - Real-Time Fleet Dashboard
   - Cost Per Mile Analysis
   - Utilization Rate Reporting
   - Vendor Performance tracking
   - Budget vs Actual Tracking
   - Regulatory Compliance Dashboard
   - Insurance Claim Management
   - Fleet Composition Optimization
   - Carbon Footprint tracking
   - All vehicle management features
2. Test Fleet Manager permissions - Verify CAN:
   - Create new vehicle registrations
   - Modify vehicle disposition
   - Manage vendor relationships
   - Set budget targets
   - Generate compliance reports
   - Create insurance claims
   - Export data and reports
3. Test Fleet Manager permissions - Verify CANNOT:
   - Access Finance Manager exclusive features
   - Access HR Management features
   - Access System Administration features
   - Modify system configuration
   - Access other organization's data
4. Login as Driver role and verify:
   - Cannot access Vehicle Acquisition Planning
   - Cannot access Budget vs Actual
   - Cannot access Vendor Performance
   - CAN access their own vehicle assignment
   - CAN access trip history
5. Login as Dispatcher role and verify:
   - Cannot access Financial planning features
   - Cannot access Compliance Dashboard
   - CAN access Real-Time Fleet Dashboard (read-only)
   - CAN assign vehicles
   - Cannot create/modify acquisition requests
6. Login as Finance Manager and verify:
   - CAN access Budget vs Actual
   - CAN approve budget reallocation
   - Cannot execute vehicle acquisitions
   - CAN view financial reports
7. Test endpoint-level access control:
   - GET `/api/dashboard/fleet-manager` - Fleet Manager allowed
   - GET `/api/dashboard/fleet-manager` - Driver denied (403)
   - POST `/api/vehicles` - Fleet Manager allowed
   - POST `/api/vehicles` - Driver denied (403)
8. Test data-level access control:
   - Fleet Manager A accesses all 287 vehicles in their fleet
   - Fleet Manager B (different fleet) cannot access Fleet Manager A's vehicles
9. Test write access controls:
   - Fleet Manager CAN write to vehicle records
   - Driver CANNOT write to vehicle records
   - Dispatcher CAN write to limited fields only
10. Verify permission changes after role modification:
    - Remove Fleet Manager role from user
    - Verify access denied to Fleet Manager features
    - Restore Fleet Manager role
    - Verify access restored
11. Test session-based access control:
    - Fleet Manager logs in
    - Token/session created with proper permissions
    - Token expires after 8 hours
    - Refresh token extends session
    - Logout destroys session
12. Test concurrent session limits:
    - Fleet Manager logs in from device A
    - Fleet Manager logs in from device B
    - Verify both sessions active simultaneously
    - Verify both sessions have proper permissions
13. Test permission audit logging:
    - Fleet Manager accesses sensitive data
    - Verify access logged with timestamp, user, resource
    - Log entries retained for 12+ months
14. Verify permission inheritance:
    - Fleet Manager inherits from "Executive" role
    - Verify all inherited permissions functional
    - Verify role hierarchy prevents privilege escalation

#### Expected Results:
- Fleet Manager has access to all documented features
- Fleet Manager cannot access other roles' features
- Other roles properly restricted from Fleet Manager features
- Endpoint-level access control prevents unauthorized API calls
- Data-level access control prevents cross-fleet access
- Permission audit logs complete
- Session management prevents unauthorized access
- Role modification immediately reflects permission changes
- Permission checks consistently enforced across all endpoints

#### Acceptance Criteria:
- All documented Fleet Manager permissions functional
- All permission denials return proper HTTP 403 responses
- Audit logs capture all permission-related actions
- Session tokens properly validated on each request
- Role changes take effect immediately
- No unauthorized access to protected resources
- Permission matrix documented and verified
- Regular access control audits scheduled
- All edge cases tested (expired tokens, invalid tokens, etc.)

#### Test Data:
- Fleet Manager user: manager@fleet.com
- Driver user: driver@fleet.com
- Dispatcher user: dispatcher@fleet.com
- Finance Manager user: finance@fleet.com
- Fleet 1 vehicles: 287 (Fleet Manager A's fleet)
- Fleet 2 vehicles: 245 (Fleet Manager B's fleet)

---

### TC-FM-022: Data Encryption and Secure Transmission - HTTPS and TLS Verification

**Test Case ID**: TC-FM-022
**Name**: Verify Data Encryption and Secure Transmission
**Related US/UC**: All Fleet Manager user stories
**Priority**: High
**Test Type**: Security Test
**Category**: Data Security

#### Preconditions:
- HTTPS/TLS 1.2+ is configured on all endpoints
- SSL certificates are valid and properly installed
- Sensitive data encryption configured (vehicle data, financial data)
- API endpoints require HTTPS
- Database connections encrypted
- Backup data encrypted at rest

#### Test Steps:
1. Verify HTTPS enforcement:
   - Navigate to HTTP version of application
   - Verify automatic redirect to HTTPS
   - Verify HTTP requests return 301 redirect
2. Verify TLS version:
   - Connect to application using TLS 1.0
   - Verify connection rejected
   - Connect using TLS 1.2
   - Verify connection accepted
   - Connect using TLS 1.3
   - Verify connection accepted
3. Verify SSL certificate validity:
   - Check certificate expiration date
   - Verify not expired
   - Verify certificate issued by trusted CA
   - Verify certificate matches domain
4. Verify cipher suite strength:
   - Check TLS cipher suites in use
   - Verify no weak ciphers (RC4, DES, etc.)
   - Verify only strong ciphers enabled (AES-256-GCM, etc.)
5. Test API endpoint encryption:
   - Send API request with sensitive data (vehicle cost information)
   - Capture network traffic (Wireshark, Fiddler)
   - Verify data encrypted in transit
   - Verify unencrypted data not visible in network capture
6. Verify database encryption:
   - Query database to verify encrypted data
   - Verify sensitive fields encrypted at rest:
     - Cost data
     - Driver information
     - Vehicle location history
     - Compliance data
7. Verify backup encryption:
   - Access backup storage (Azure Blob Storage, etc.)
   - Verify backups encrypted
   - Verify encryption key management
8. Test data in transit during WebSocket connection:
   - Establish WebSocket connection for real-time updates
   - Verify WebSocket uses WSS (WebSocket Secure)
   - Capture traffic - verify encryption
   - Verify vehicle location data encrypted in real-time updates
9. Verify API token security:
   - Test authentication token transmission
   - Verify token sent over HTTPS only
   - Verify token never logged in plain text
   - Verify token expires appropriately
10. Test file upload encryption:
    - Upload document (vehicle title, insurance policy)
    - Verify file encrypted during transmission
    - Verify file stored encrypted in blob storage
11. Verify password transmission:
    - Login attempt with credentials
    - Capture traffic - verify password hashed before transmission
    - Verify password never transmitted in plain text
12. Test encryption key management:
    - Verify encryption keys stored securely (not in code)
    - Verify key rotation policy (90 days recommended)
    - Verify old keys retained for decryption of old data
13. Verify HSTS (HTTP Strict Transport Security):
    - Check HSTS header in response
    - Verify HSTS max-age appropriate (>6 months)
    - Verify includeSubDomains flag present
14. Test sensitive data in logs:
    - Generate test transactions
    - Examine application logs
    - Verify no sensitive data (costs, locations, etc.) in logs
    - Verify only sanitized/hashed data logged

#### Expected Results:
- All traffic redirected to HTTPS automatically
- TLS 1.2+ only accepted
- SSL certificate valid and from trusted CA
- No weak cipher suites enabled
- All sensitive data encrypted in transit
- Database encryption at rest verified
- Backups encrypted with secure key management
- WebSocket uses WSS for real-time updates
- API tokens transmitted securely
- File uploads encrypted
- Passwords hashed before transmission
- HSTS header present with appropriate values
- No sensitive data in application logs

#### Acceptance Criteria:
- 100% of traffic encrypted with TLS 1.2+
- SSL certificate valid for 12+ months
- Only strong cipher suites in use
- All sensitive data encrypted at rest
- Encryption keys securely managed
- Password hashing verified (bcrypt/Argon2)
- Backup encryption keys accessible for disaster recovery
- HSTS header enforces secure transport
- No sensitive data leakage in logs
- Penetration testing confirms no encryption weaknesses

#### Test Data:
- HTTPS endpoint: https://fleet.capitaltechalliance.com
- HTTP endpoint: http://fleet.capitaltechalliance.com (should redirect)
- TLS versions tested: 1.0 (reject), 1.2 (accept), 1.3 (accept)
- Sample sensitive data: Vehicle costs, driver salaries, location history
- Certificate issued to: fleet.capitaltechalliance.com
- Certificate expires: 2026-10-15

---

### TC-FM-023: Authentication and Session Management - Token Validation

**Test Case ID**: TC-FM-023
**Name**: Verify Authentication and Secure Session Management
**Related US/UC**: All Fleet Manager user stories
**Priority**: High
**Test Type**: Security Test
**Category**: Authentication and Authorization

#### Preconditions:
- Authentication system (Azure AD) is configured
- Session management configured with secure tokens
- Password policy enforced
- MFA support available
- Session timeout configured (8 hours)
- Logout functionality removes session

#### Test Steps:
1. Test valid login:
   - Enter credentials: manager@fleet.com / [valid password]
   - Verify successful authentication
   - Verify token/session created
   - Verify user redirected to dashboard
2. Test invalid password:
   - Enter credentials: manager@fleet.com / [invalid password]
   - Verify authentication fails
   - Verify error message: "Invalid credentials" (generic, no user enumeration)
   - Verify no session created
3. Test invalid username:
   - Enter credentials: nonexistent@fleet.com / [any password]
   - Verify authentication fails
   - Verify same error message (prevents user enumeration)
   - Verify no session created
4. Test SQL injection attempt:
   - Enter username: ' OR '1'='1
   - Verify SQL injection blocked
   - Verify authentication fails
   - Verify no session created
5. Test brute force protection:
   - Attempt 5 failed logins in 30 seconds
   - Verify account locked after 5 failed attempts
   - Verify lockout duration: 15 minutes
   - Attempt login after lockout
   - Verify "Account temporarily locked" message
6. Test session token validation:
   - Login successfully
   - Receive authentication token
   - Include token in API request header
   - Verify request accepted and processed
7. Test expired token:
   - Set system time forward (past token expiration)
   - Include expired token in API request
   - Verify request rejected with 401 Unauthorized
   - Verify user required to re-authenticate
8. Test modified token:
   - Obtain valid token
   - Modify token value slightly
   - Include modified token in API request
   - Verify token validation fails
   - Verify request rejected with 401
9. Test token refresh:
   - Login and receive token
   - Call refresh endpoint to extend session
   - Verify new token generated
   - Verify old token still valid temporarily
   - Verify new token valid
10. Test logout functionality:
    - Login successfully
    - Click Logout button
    - Verify session destroyed
    - Attempt to use old token
    - Verify request rejected with 401
11. Test concurrent sessions:
    - Login from device A
    - Login from device B (same user)
    - Verify both sessions active
    - Verify both tokens independently valid
    - Logout from device A
    - Verify device B session still active
12. Test session storage security:
    - Login and capture token
    - Verify token not stored in localStorage (if possible, use SessionStorage)
    - Verify token stored securely (HttpOnly cookie recommended)
    - Verify token not accessible via JavaScript
13. Test Azure AD integration:
    - Verify SSO functionality with Azure AD
    - Test MFA if configured
    - Verify conditional access policies enforced
14. Verify password policy enforcement:
    - Test password requirements:
      - Minimum 8 characters
      - Must contain uppercase, lowercase, number, special char
      - Cannot reuse last 5 passwords
      - Must change every 90 days
15. Test session timeout:
    - Login successfully
    - Wait for session timeout period (e.g., 8 hours)
    - Simulate system time forward
    - Attempt API request
    - Verify request rejected due to session timeout
    - Verify user must re-authenticate

#### Expected Results:
- Valid credentials accepted and session created
- Invalid credentials rejected consistently (no user enumeration)
- Brute force attacks prevented with account lockout
- Session tokens validated on every request
- Expired tokens rejected with 401 response
- Modified tokens rejected with 401 response
- Token refresh extends session appropriately
- Logout destroys session completely
- Concurrent sessions supported
- Tokens stored securely (not accessible via JavaScript)
- Session timeout enforced after configured period
- Password policy enforced on all accounts
- Azure AD integration functional

#### Acceptance Criteria:
- All login attempts validated against authentication provider
- Brute force protection prevents account compromise
- Session tokens cryptographically secure
- Token expiration enforced consistently
- Session logout removes all tokens
- Concurrent sessions do not interfere
- Password policy enforced for all users
- MFA supported if configured
- SSO integration functional
- Audit logs track all authentication events
- Session management prevents session fixation attacks

#### Test Data:
- Test user: manager@fleet.com
- Valid password: ComplexPass123!
- Invalid password: wrongpassword123
- Session timeout: 8 hours
- Token refresh expiration: 7 days
- Brute force lockout: 5 attempts, 15-minute duration
- Password policy: 8+ chars, uppercase, lowercase, number, special

---

## Test Execution Summary

**Total Test Cases**: 25
- Functional Tests: 12 (TC-FM-001 through TC-FM-012)
- Integration Tests: 5 (TC-FM-013 through TC-FM-017)
- Performance Tests: 4 (TC-FM-018 through TC-FM-021)
- Security Tests: 3 (TC-FM-021 through TC-FM-023)

**Test Coverage**:
- Vehicle Lifecycle Management: 5 tests
- Fleet Performance Analytics: 5 tests
- Vendor and Contract Management: 2 tests
- Budget and Financial Management: 2 tests
- Compliance and Risk Management: 3 tests
- Strategic Planning and Forecasting: 2 tests
- Performance and Load Testing: 4 tests
- Security and Authorization: 3 tests

**Estimated Execution Time**:
- Manual testing: 80-100 hours
- Automated testing: 40-60 hours
- Load testing: 16-20 hours
- Total: 136-180 hours (3-4 weeks with team of 2-3 QA engineers)

---

## Test Environment Requirements

**Hardware**:
- Load testing machine: 16 GB RAM, 8-core CPU
- Database server: 32 GB RAM, SSD storage
- Application server: 16 GB RAM, 4-core CPU minimum

**Software**:
- Browser: Chrome, Firefox, Safari (latest versions)
- Load testing tool: Apache JMeter or LoadRunner
- API testing: Postman or RestAssured
- Network monitoring: Wireshark or Fiddler
- Database: SQL Server with test data

**Network**:
- 100 Mbps+ internet connection
- VPN access to test environment
- Firewall rules allowing test traffic

---

## Test Data Management

**Data Retention**:
- Test data should be preserved for 30 days post-testing
- High-value edge cases documented in test data repository
- Sensitive data (PII, financial) redacted for security

**Data Cleanup**:
- Automated cleanup of test transactions post-execution
- Backup of test results and logs for audit trail
- Archive test environment data for compliance

---

*Document Version: 1.0*
*Last Updated: November 10, 2025*
*Next Review: January 10, 2026*
