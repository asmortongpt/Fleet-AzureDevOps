# Fleet Manager - User Stories

**Role**: Fleet Manager
**Access Level**: Executive (Full system access)
**Primary Interface**: Web Dashboard
**Version**: 1.0
**Date**: November 11, 2025

---

## Epic 1: Vehicle Lifecycle Management

### US-FM-001: Vehicle Acquisition Planning
**As a** Fleet Manager
**I want to** analyze fleet composition and identify replacement needs
**So that** I can plan vehicle acquisitions strategically and maintain optimal fleet performance

**Priority**: High
**Story Points**: 8
**Sprint**: 1

#### Acceptance Criteria:
- [ ] I can view current fleet composition by vehicle type, age, and mileage
- [ ] System calculates replacement scores based on age, mileage, and maintenance costs
- [ ] I can see projected replacement timeline for next 12-36 months
- [ ] I can filter vehicles by criteria (age > 10 years, mileage > 200K miles, high maintenance cost)
- [ ] I can export replacement recommendations as PDF/Excel report
- [ ] System provides estimated acquisition budget based on selected vehicles
- [ ] I can mark vehicles for replacement and set target acquisition dates
- [ ] Dashboard shows cost-benefit analysis for replacement vs repair decisions

#### Dependencies:
- Vehicle cost history data
- Depreciation calculation engine
- Market value integration (KBB/NADA)

#### Technical Notes:
- API Endpoint: GET `/api/fleet/replacement-analysis`
- Report Generation: PDF export with charts and tables
- Data Sources: vehicles, maintenance_history, fuel_costs, depreciation_schedules

---

### US-FM-002: New Vehicle Registration
**As a** Fleet Manager
**I want to** register newly acquired vehicles in the system
**So that** they can be immediately tracked, maintained, and assigned to operations

**Priority**: High
**Story Points**: 5
**Sprint**: 1

#### Acceptance Criteria:
- [ ] I can enter vehicle details (VIN, make, model, year, license plate, acquisition cost)
- [ ] System auto-populates vehicle specifications from VIN decoder
- [ ] I can upload vehicle documentation (title, registration, purchase order)
- [ ] I can assign vehicle to specific location/depot
- [ ] I can set initial odometer reading and service schedule
- [ ] System generates unique fleet ID automatically
- [ ] I can configure telematics device association
- [ ] System sends confirmation notification to maintenance and dispatch teams
- [ ] Vehicle immediately appears in available vehicle pool

#### Dependencies:
- VIN decoder API integration
- Document storage (Azure Blob Storage)
- Telematics device inventory

#### Technical Notes:
- API Endpoint: POST `/api/vehicles`
- File Upload: Multi-part form data for documents
- VIN Decoder: NHTSA API or commercial service

---

### US-FM-003: Vehicle Disposition Management
**As a** Fleet Manager
**I want to** manage the disposition process for vehicles being retired
**So that** I can maximize resale value and ensure proper documentation for accounting

**Priority**: Medium
**Story Points**: 8
**Sprint**: 2

#### Acceptance Criteria:
- [ ] I can mark vehicles for disposition with reason (age, damage, replacement)
- [ ] System calculates current market value and recommends disposal method
- [ ] I can track disposition process (auction, trade-in, sale, scrap, donation)
- [ ] System generates disposition packet with all vehicle history
- [ ] I can record final disposition price and purchaser information
- [ ] System automatically updates accounting for asset disposal
- [ ] Disposed vehicles move to historical records and are removed from active fleet
- [ ] I receive notifications when disposition exceeds/falls short of book value

#### Dependencies:
- Market valuation service
- Accounting system integration
- Historical data archival process

#### Technical Notes:
- API Endpoint: PATCH `/api/vehicles/{id}/disposition`
- Workflow states: marked_for_disposal → listed → sold → archived
- Document generation: Complete vehicle history report

---

## Epic 2: Fleet Performance Analytics

### US-FM-004: Real-Time Fleet Dashboard
**As a** Fleet Manager
**I want to** view real-time fleet status and key performance indicators
**So that** I can monitor operations and identify issues requiring immediate attention

**Priority**: High
**Story Points**: 13
**Sprint**: 1-2

#### Acceptance Criteria:
- [ ] Dashboard shows total fleet size, active vehicles, and vehicles in maintenance
- [ ] I can see real-time vehicle locations on map
- [ ] Key metrics display: utilization rate, fuel efficiency, maintenance costs, safety incidents
- [ ] Dashboard shows vehicles requiring immediate attention (alerts, maintenance due, inspections due)
- [ ] I can filter dashboard by location, vehicle type, or date range
- [ ] Metrics update in real-time using WebSocket connections
- [ ] I can customize dashboard layout and save preferences
- [ ] Export dashboard snapshot as PDF for management reporting
- [ ] Trend indicators show week-over-week and month-over-month changes

#### Dependencies:
- Real-time telematics data
- Redis caching for performance
- WebSocket infrastructure

#### Technical Notes:
- API Endpoints: GET `/api/dashboard/fleet-manager`
- WebSocket: `/ws/fleet-status`
- Update Frequency: 30 seconds for vehicle locations, 5 minutes for aggregated metrics

---

### US-FM-005: Cost Per Mile Analysis
**As a** Fleet Manager
**I want to** analyze total cost of ownership per mile/hour for each vehicle
**So that** I can identify high-cost vehicles and optimize fleet composition

**Priority**: High
**Story Points**: 8
**Sprint**: 2

#### Acceptance Criteria:
- [ ] System calculates CPM including: fuel, maintenance, tires, insurance, depreciation, overhead
- [ ] I can view CPM trends over time (monthly, quarterly, annually)
- [ ] I can compare CPM across vehicle types, models, and years
- [ ] Dashboard highlights vehicles exceeding target CPM thresholds
- [ ] I can drill down into cost categories to identify drivers of high CPM
- [ ] I can export CPM reports with charts and comparative analysis
- [ ] System provides benchmarks against industry standards
- [ ] I can set CPM targets and receive alerts when exceeded

#### Dependencies:
- Complete cost data from all sources
- Depreciation schedules
- Benchmarking data

#### Technical Notes:
- API Endpoint: GET `/api/analytics/cost-per-mile`
- Calculation: Total Costs / Total Miles (period-based)
- Caching: Daily calculation with real-time approximation

---

### US-FM-006: Utilization Rate Reporting
**As a** Fleet Manager
**I want to** track vehicle utilization rates across the fleet
**So that** I can identify underutilized assets and optimize fleet size

**Priority**: Medium
**Story Points**: 5
**Sprint**: 2

#### Acceptance Criteria:
- [ ] System calculates utilization rate: (hours in use / available hours) * 100
- [ ] I can view utilization by vehicle, vehicle type, location, and time period
- [ ] Dashboard shows vehicles with <50% utilization (idle assets)
- [ ] I can see utilization trends to identify seasonal patterns
- [ ] System recommends fleet rightsizing based on utilization data
- [ ] I can export utilization reports with recommendations
- [ ] Utilization calculations exclude scheduled maintenance time
- [ ] Dashboard shows projected cost savings from fleet optimization

#### Dependencies:
- Accurate trip/route data
- Telematics ignition status
- Maintenance schedules

#### Technical Notes:
- API Endpoint: GET `/api/analytics/utilization`
- Calculation: Ignition-on hours / (24 * days - maintenance hours)
- Reporting Period: Daily, Weekly, Monthly, Annual

---

## Epic 3: Vendor and Contract Management

### US-FM-007: Vendor Performance Tracking
**As a** Fleet Manager
**I want to** track performance metrics for maintenance vendors and suppliers
**So that** I can make informed decisions about vendor relationships and contracts

**Priority**: Medium
**Story Points**: 8
**Sprint**: 3

#### Acceptance Criteria:
- [ ] I can view all active vendors with contract details and expiration dates
- [ ] System tracks vendor performance: turnaround time, quality ratings, cost variances
- [ ] I can see work order history and spending by vendor
- [ ] Dashboard shows vendor scorecards with multiple performance metrics
- [ ] I can add notes and ratings for vendor performance
- [ ] System alerts me 90/60/30 days before contract expiration
- [ ] I can compare vendors side-by-side for competitive analysis
- [ ] I can export vendor performance reports for procurement review

#### Dependencies:
- Work order system
- Vendor master data
- Quality ratings from technicians

#### Technical Notes:
- API Endpoint: GET `/api/vendors/performance`
- Metrics: Avg turnaround time, cost variance %, quality score (1-5), on-time completion %
- Alerting: Scheduled job for contract expiration notifications

---

### US-FM-008: Parts Pricing Analysis
**As a** Fleet Manager
**I want to** analyze parts pricing across vendors and time periods
**So that** I can identify cost-saving opportunities and negotiate better rates

**Priority**: Low
**Story Points**: 5
**Sprint**: 4

#### Acceptance Criteria:
- [ ] I can search for specific parts and see pricing history across all vendors
- [ ] System shows price trends over time for frequently purchased parts
- [ ] I can compare current vendor pricing vs market averages
- [ ] Dashboard highlights parts with significant price increases
- [ ] I can identify alternative parts/vendors for cost savings
- [ ] System calculates annual spending by part category
- [ ] I can export parts pricing analysis for vendor negotiations
- [ ] Alerts notify me when part prices increase >20% from baseline

#### Dependencies:
- Parts catalog standardization
- Purchase order history
- Market pricing data (optional)

#### Technical Notes:
- API Endpoint: GET `/api/parts/pricing-analysis`
- Data Source: work_order_items, purchase_orders, vendor_catalogs
- Alerting: Weekly price monitoring job

---

## Epic 4: Budget and Financial Management

### US-FM-009: Budget vs Actual Tracking
**As a** Fleet Manager
**I want to** compare actual fleet spending against budgeted amounts
**So that** I can manage costs and explain variances to leadership

**Priority**: High
**Story Points**: 8
**Sprint**: 2

#### Acceptance Criteria:
- [ ] I can set annual budget by category (fuel, maintenance, parts, insurance, etc.)
- [ ] Dashboard shows YTD spending vs budget with variance percentages
- [ ] System provides month-by-month comparison of budget vs actual
- [ ] I can drill down to transaction level for any budget category
- [ ] System highlights categories exceeding budget threshold (>90%)
- [ ] I can add notes explaining significant variances
- [ ] Forecasting shows projected year-end spending based on current trends
- [ ] I can export budget reports for executive review
- [ ] System allows budget reallocation between categories (with approval workflow)

#### Dependencies:
- Chart of accounts mapping
- Approval workflow engine
- Financial data from accounting system

#### Technical Notes:
- API Endpoint: GET `/api/budget/comparison`
- Storage: budget_allocations, actual_spending (aggregated)
- Calculation: Monthly and YTD variance analysis

---

### US-FM-010: Fleet Total Cost of Ownership (TCO) Projection
**As a** Fleet Manager
**I want to** project total cost of ownership for vehicles over their lifecycle
**So that** I can make data-driven acquisition decisions and support capital requests

**Priority**: Medium
**Story Points**: 13
**Sprint**: 3-4

#### Acceptance Criteria:
- [ ] I can enter vehicle specifications and projected usage parameters
- [ ] System calculates 5-year TCO including: acquisition, fuel, maintenance, insurance, disposal
- [ ] I can compare TCO for different vehicle options (e.g., gas vs EV vs hybrid)
- [ ] Dashboard shows break-even analysis for higher-cost vehicles with lower operating costs
- [ ] System incorporates inflation assumptions and fuel price forecasts
- [ ] I can adjust assumptions (annual miles, fuel prices, maintenance frequency)
- [ ] TCO calculation includes EV-specific factors (charging infrastructure, battery replacement)
- [ ] I can export TCO analysis as professional presentation for capital approval
- [ ] System provides sensitivity analysis showing impact of variable changes

#### Dependencies:
- Historical cost data by vehicle type
- Market pricing for new vehicles
- Fuel price forecasting
- EV infrastructure costs

#### Technical Notes:
- API Endpoint: POST `/api/analytics/tco-projection`
- Calculation Engine: Complex multi-factor model
- Output: Interactive charts with scenario comparison

---

## Epic 5: Compliance and Risk Management

### US-FM-011: Regulatory Compliance Dashboard
**As a** Fleet Manager
**I want to** monitor compliance with DOT, FMCSA, and state regulations
**So that** I can avoid fines, penalties, and operational shutdowns

**Priority**: High
**Story Points**: 8
**Sprint**: 2

#### Acceptance Criteria:
- [ ] Dashboard shows compliance status for: inspections, registrations, permits, driver certifications
- [ ] System highlights items expiring within 30/60/90 days
- [ ] I can view detailed compliance reports by vehicle or driver
- [ ] System tracks recurring compliance requirements automatically
- [ ] I receive email/SMS alerts for critical compliance items
- [ ] Dashboard shows historical compliance rate and trends
- [ ] I can generate audit-ready compliance reports
- [ ] System provides links to renewal portals and required forms
- [ ] Non-compliance items are escalated to appropriate personnel

#### Dependencies:
- Driver certification tracking
- Vehicle inspection schedules
- Registration/permit data

#### Technical Notes:
- API Endpoint: GET `/api/compliance/dashboard`
- Alerting: Daily compliance check job
- Integration: State DMV APIs (where available)

---

### US-FM-012: Insurance Claim Management
**As a** Fleet Manager
**I want to** track insurance claims from incident to resolution
**So that** I can manage insurance costs and ensure proper documentation

**Priority**: Medium
**Story Points**: 5
**Sprint**: 3

#### Acceptance Criteria:
- [ ] I can create insurance claims linked to safety incidents
- [ ] System tracks claim status: reported, under review, approved, denied, paid
- [ ] I can upload supporting documentation (photos, police reports, estimates)
- [ ] Dashboard shows open claims and estimated payout amounts
- [ ] I can record payments received and close claims
- [ ] System calculates loss ratio and tracks insurance mod rate impact
- [ ] I can export claims history for insurance renewal negotiations
- [ ] Alerts notify me when claims remain open >30 days without update

#### Dependencies:
- Safety incident module
- Document storage
- Integration with insurance carriers (optional)

#### Technical Notes:
- API Endpoint: POST `/api/insurance/claims`
- Workflow: incident → claim → documentation → resolution → payment
- Storage: insurance_claims, claim_documents

---

## Epic 6: Strategic Planning and Forecasting

### US-FM-013: Fleet Composition Optimization
**As a** Fleet Manager
**I want to** model different fleet composition scenarios
**So that** I can optimize fleet makeup for cost, efficiency, and performance

**Priority**: Medium
**Story Points**: 13
**Sprint**: 4-5

#### Acceptance Criteria:
- [ ] I can model "what-if" scenarios by changing fleet composition variables
- [ ] System projects costs, emissions, and performance for each scenario
- [ ] I can compare current fleet vs optimized fleet recommendations
- [ ] Dashboard shows ROI timeline for fleet composition changes
- [ ] System recommends optimal mix of vehicle types based on usage patterns
- [ ] I can factor in constraints (budget limits, vehicle availability, lead times)
- [ ] Scenarios include EV transition planning with charging infrastructure needs
- [ ] I can save and share scenarios with leadership for approval
- [ ] System provides implementation roadmap for approved scenarios

#### Dependencies:
- Historical usage and cost data
- Vehicle specifications database
- Market availability data
- EV charging cost calculator

#### Technical Notes:
- API Endpoint: POST `/api/planning/fleet-optimization`
- Calculation: Multi-objective optimization algorithm
- Storage: planning_scenarios (save/load functionality)

---

### US-FM-014: Carbon Footprint Reduction Planning
**As a** Fleet Manager
**I want to** track fleet emissions and plan reduction initiatives
**So that** I can meet sustainability goals and reduce environmental impact

**Priority**: Medium
**Story Points**: 8
**Sprint**: 4

#### Acceptance Criteria:
- [ ] Dashboard shows total fleet emissions (CO2, NOx, PM) by vehicle and type
- [ ] I can set emissions reduction targets and track progress
- [ ] System calculates emissions from fuel consumption data
- [ ] I can model emissions impact of EV adoption scenarios
- [ ] Dashboard shows carbon offset costs and sustainability metrics
- [ ] I can export sustainability reports for CSR/ESG reporting
- [ ] System recommends highest-impact emission reduction strategies
- [ ] Trend analysis shows progress toward emissions goals over time

#### Dependencies:
- Fuel consumption data
- EPA emissions factors by vehicle type
- EV specifications and charging energy sources

#### Technical Notes:
- API Endpoint: GET `/api/sustainability/emissions`
- Calculation: Fuel consumed * EPA emission factor for vehicle class
- Reporting: ISO 14064 compliant emissions reporting

---

## Summary Statistics

**Total User Stories**: 14
**Total Story Points**: 113
**Estimated Sprints**: 5 (2-week sprints)
**Estimated Timeline**: 10-12 weeks

### Priority Breakdown:
- **High Priority**: 7 stories (57 points)
- **Medium Priority**: 6 stories (51 points)
- **Low Priority**: 1 story (5 points)

### Epic Breakdown:
1. Vehicle Lifecycle Management: 3 stories (21 points)
2. Fleet Performance Analytics: 3 stories (26 points)
3. Vendor and Contract Management: 2 stories (13 points)
4. Budget and Financial Management: 2 stories (21 points)
5. Compliance and Risk Management: 2 stories (13 points)
6. Strategic Planning and Forecasting: 2 stories (21 points)

---

## Related Documents
- Use Cases: `use-cases/01_FLEET_MANAGER_USE_CASES.md`
- Test Cases: `test-cases/01_FLEET_MANAGER_TEST_CASES.md`
- Workflows: `workflows/01_FLEET_MANAGER_WORKFLOWS.md`

---

*Next: Driver User Stories (`02_DRIVER_USER_STORIES.md`)*
