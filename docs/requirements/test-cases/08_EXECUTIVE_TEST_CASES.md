# Executive Test Cases

**Role**: Executive / Stakeholder
**Test Scope**: Executive dashboards, KPI monitoring, reporting, budget approval, analytics
**Version**: 1.0
**Date**: November 10, 2025
**Total Test Cases**: 25

---

## Test Case Index

### KPI Dashboard and Monitoring (TC-EX-001 to TC-EX-005)
- TC-EX-001: Executive Dashboard Load Performance
- TC-EX-002: Executive Dashboard KPI Display Accuracy
- TC-EX-003: Dashboard Metric Drill-Down Navigation
- TC-EX-004: Dashboard Auto-Refresh Functionality
- TC-EX-005: Dashboard PDF Export

### Multi-Location Comparison (TC-EX-006 to TC-EX-010)
- TC-EX-006: Location Comparison Table Display
- TC-EX-007: Location Ranking and Sorting
- TC-EX-008: Location Performance Filtering
- TC-EX-009: Location Outlier Identification
- TC-EX-010: Location Comparison Export

### Real-Time Alerts (TC-EX-011 to TC-EX-015)
- TC-EX-011: Critical Alert Delivery (Push Notification)
- TC-EX-012: Alert Acknowledgment and Status Tracking
- TC-EX-013: Alert Details and Context Display
- TC-EX-014: Multi-Channel Alert Delivery (Email/SMS/Push)
- TC-EX-015: Alert Configuration and Preferences

### Budget and Financial Analysis (TC-EX-016 to TC-EX-020)
- TC-EX-016: Budget Variance Analysis Display
- TC-EX-017: Capital Expenditure Approval Workflow
- TC-EX-018: Budget Adjustment Request Approval
- TC-EX-019: ROI Analysis and Reporting
- TC-EX-020: Financial Report Export

### Strategic Reporting and Forecasting (TC-EX-021 to TC-EX-025)
- TC-EX-021: Monthly Executive Summary Report Generation
- TC-EX-022: Board Presentation Builder
- TC-EX-023: Long-Term Fleet Forecast (3-5 Years)
- TC-EX-024: Sustainability and ESG Metrics Dashboard
- TC-EX-025: Fleet Performance Benchmarking

---

## KPI Dashboard and Monitoring

### TC-EX-001: Executive Dashboard Load Performance

**Test Case ID**: TC-EX-001
**Test Case Name**: Executive Dashboard Load Performance
**Related User Story**: US-EX-001 (Enterprise Fleet Performance Dashboard)
**Related Use Case**: UC-EX-001 (Access Enterprise Fleet Performance Dashboard)
**Priority**: High
**Test Type**: Performance / Functional
**Test Author**: QA Team
**Created Date**: November 10, 2025

#### Preconditions:
- Executive user is authenticated and logged into system with valid credentials
- Multi-factor authentication (MFA) has been completed
- User has Executive role with appropriate permissions
- Real-time data aggregation pipeline is operational
- Redis caching layer is functioning
- Executive dashboard API endpoint is available
- Network connectivity is stable

#### Test Steps:
1. Navigate to Fleet Management web application
2. Log in with executive credentials
3. Complete multi-factor authentication
4. Click on "Dashboard" menu option
5. Navigate to "Executive Dashboard" view
6. Record the page load start time
7. Wait for dashboard to fully render (all metrics visible)
8. Record the page load completion time
9. Calculate total load time (completion - start)
10. Verify all primary KPI metrics are displayed on dashboard
11. Open browser developer tools and check Network tab for:
    - Total page size
    - Number of API calls
    - Cache hit/miss statistics
12. Load dashboard a second time and record load time
13. Compare first load vs. subsequent load performance

#### Expected Results:
- Initial dashboard load time: <2 seconds for primary metrics
- Subsequent dashboard load time: <1.5 seconds (with caching)
- No network errors or failed API calls
- All metrics render without visual glitches
- Cached data utilized for performance optimization
- API response includes cache headers (X-Cache-Status)

#### Acceptance Criteria:
- AC1: Dashboard primary metrics load in <2 seconds (95% of loads)
- AC2: Full dashboard (with all detail metrics) loads in <5 seconds
- AC3: Cached dashboard load time <1.5 seconds
- AC4: No broken images or missing chart elements
- AC5: All API calls complete successfully (HTTP 200)
- AC6: Network waterfall shows proper caching strategy

#### Test Data:
- Executive User: exec@fleet.local
- Browser: Chrome Latest
- Network Condition: Normal (no throttling)
- Device: Desktop

---

### TC-EX-002: Executive Dashboard KPI Display Accuracy

**Test Case ID**: TC-EX-002
**Test Case Name**: Executive Dashboard KPI Display Accuracy
**Related User Story**: US-EX-001 (Enterprise Fleet Performance Dashboard)
**Related Use Case**: UC-EX-001 (Access Enterprise Fleet Performance Dashboard)
**Priority**: High
**Test Type**: Functional / Data Validation
**Test Author**: QA Team
**Created Date**: November 10, 2025

#### Preconditions:
- Executive dashboard is loaded and fully rendered
- System has current KPI data (updated within last 15 minutes)
- Test data environment has known fleet metrics:
  - 285 active vehicles
  - 1,240 drivers
  - 52 locations
  - Expected fleet utilization: 87%
  - Expected cost per mile: $2.34
- Direct database access available for validation

#### Test Steps:
1. Load Executive Dashboard
2. Observe displayed KPI metrics:
   - Fleet Overview (total vehicles, drivers, locations)
   - Fleet Utilization Rate
   - Cost Per Mile
   - On-Time Delivery Rate
   - Safety Score
   - Incident Rate
   - Monthly Operating Cost
   - Fuel Costs
   - Maintenance Costs
   - DOT Compliance Rate
   - Driver HOS Violation Rate
   - Vehicle Inspection Compliance
3. Query database directly for current KPI values:
   - SELECT fleet_utilization FROM metrics WHERE date = TODAY()
   - SELECT cost_per_mile FROM metrics WHERE date = TODAY()
   - SELECT on_time_rate FROM metrics WHERE date = TODAY()
   - SELECT safety_score FROM metrics WHERE date = TODAY()
4. Compare database values with dashboard display values
5. Verify color coding is applied correctly:
   - Green for on-target metrics
   - Yellow for concerning trends
   - Red for below-threshold metrics
6. Validate trend indicators are present (↑/↓/→)
7. Check that trend calculation is correct (+2% up, -3% down, etc.)
8. Verify comparison to previous period is displayed
9. Confirm read-only status - no edit controls visible

#### Expected Results:
- All displayed KPI values match database source data (±0.1% tolerance)
- Color coding is applied correctly per business rules
- Trend indicators accurately reflect change from previous period
- Previous period comparison data is displayed and accurate
- Dashboard is completely read-only with no input fields
- All metrics have timestamp showing last update

#### Acceptance Criteria:
- AC1: All KPI values accurate within ±0.1% of source data
- AC2: Color coding matches business rules (Green/Yellow/Red)
- AC3: Trend indicators correctly show direction and magnitude
- AC4: Previous period comparisons are accurate
- AC5: No edit controls or input fields visible on dashboard
- AC6: Data timestamp shows update within last 15 minutes

#### Test Data:
- Fleet Utilization: 87% (↑2% from last week) - Expected GREEN
- Cost Per Mile: $2.34 (↓3% from last week) - Expected GREEN
- On-Time Delivery Rate: 92% (↑1% from last week) - Expected GREEN
- Safety Score: 88/100 (stable) - Expected YELLOW
- Incident Rate: 0.8 per 100K miles (↓0.1 from last week) - Expected GREEN

---

### TC-EX-003: Dashboard Metric Drill-Down Navigation

**Test Case ID**: TC-EX-003
**Test Case Name**: Dashboard Metric Drill-Down Navigation
**Related User Story**: US-EX-001 (Enterprise Fleet Performance Dashboard)
**Related Use Case**: UC-EX-001 (Access Enterprise Fleet Performance Dashboard)
**Priority**: High
**Test Type**: Functional / Navigation
**Test Author**: QA Team
**Created Date**: November 10, 2025

#### Preconditions:
- Executive dashboard is fully loaded with all KPI metrics visible
- Executive user is authenticated with read-only permissions
- Database contains detailed metric breakdown data:
  - Safety Score components (hard braking, speeding, etc.)
  - Cost breakdown (fuel, maintenance, insurance, etc.)
  - Utilization details (hours active, trips, downtime)
- JavaScript enabled in browser

#### Test Steps:
1. Load Executive Dashboard
2. Locate "Safety Score" metric (showing 88/100)
3. Click on Safety Score metric card
4. Verify drill-down panel opens showing detailed breakdown:
   - Hard braking events: 12 (improving)
   - Speeding incidents: 8 (increasing)
   - Vehicle defect-related incidents: 3
   - Driver behavior incidents: 5
5. Verify drill-down data totals correctly relate to overall score
6. Check that drill-down view is read-only (no edit controls)
7. Close drill-down panel by clicking close button or clicking outside panel
8. Verify dashboard returns to main view
9. Click on "Cost Per Mile" metric to drill down
10. Verify cost components are displayed:
    - Fuel cost per mile: $1.02
    - Maintenance cost per mile: $0.68
    - Insurance cost per mile: $0.42
    - Other costs per mile: $0.22
11. Verify sum of components equals total Cost Per Mile ($2.34)
12. Verify drill-down includes trend data for each component
13. Close drill-down and verify dashboard is responsive

#### Expected Results:
- Drill-down panel opens smoothly without page reload
- Drill-down displays detailed metrics matching source data
- Breakdown components sum correctly to overall metric
- No edit controls visible in drill-down view
- Drill-down panel is closeable and dashboard returns to normal
- Navigation is responsive and intuitive
- All drill-down data has timestamps

#### Acceptance Criteria:
- AC1: Drill-down opens within 1 second of click
- AC2: All drill-down data accurate and properly formatted
- AC3: Drill-down components sum to parent metric (±0.1%)
- AC4: No modify capabilities in drill-down view
- AC5: Smooth close animation and return to dashboard
- AC6: Mobile drill-down view is readable on small screens

#### Test Data:
- Safety Score: 88/100
  - Hard braking: 12 events
  - Speeding: 8 events
  - Vehicle defects: 3 events
  - Driver behavior: 5 events
- Cost Per Mile: $2.34
  - Fuel: $1.02 (43.6%)
  - Maintenance: $0.68 (29.1%)
  - Insurance: $0.42 (17.9%)
  - Other: $0.22 (9.4%)

---

### TC-EX-004: Dashboard Auto-Refresh Functionality

**Test Case ID**: TC-EX-004
**Test Case Name**: Dashboard Auto-Refresh Functionality
**Related User Story**: US-EX-001 (Enterprise Fleet Performance Dashboard)
**Related Use Case**: UC-EX-001 (Access Enterprise Fleet Performance Dashboard)
**Priority**: High
**Test Type**: Functional / Real-Time
**Test Author**: QA Team
**Created Date**: November 10, 2025

#### Preconditions:
- Executive dashboard is fully loaded
- Browser WebSocket connections are enabled
- Real-time metric aggregation service is operational
- Test data environment allows controlled metric updates:
  - Can artificially update KPI values for testing
  - 15-minute cache refresh interval configured
- Browser developer tools available to monitor WebSocket traffic

#### Test Steps:
1. Load Executive Dashboard and record all visible KPI values
2. Note the exact time (T0)
3. Update test database metrics:
   - Increase Fleet Utilization from 87% to 88%
   - Decrease Cost Per Mile from $2.34 to $2.33
   - Update timestamp to current time
4. Wait 5 minutes (observe dashboard)
5. Verify dashboard still shows old values (87% utilization, $2.34 CPM)
6. Open browser DevTools and monitor Network → WebSocket traffic
7. At T0 + 15 minutes, verify WebSocket message received with updated metrics
8. Verify dashboard automatically updates without page reload:
   - Fleet Utilization: 87% → 88% (↑1%)
   - Cost Per Mile: $2.34 → $2.33 (↓0.4%)
9. Verify trend indicators update correctly
10. Check dashboard refresh occurs smoothly without visual glitches
11. Verify no manual refresh button click was required
12. Wait another 15 minutes and verify refresh cycle repeats
13. Simulate network disruption by throttling WebSocket
14. Verify dashboard continues to display last known values
15. Restore network connection and verify automatic reconnection

#### Expected Results:
- Dashboard updates automatically every 15 minutes
- Update occurs via WebSocket without page reload
- KPI values update smoothly with visual transitions
- Trend indicators recalculate based on new data
- Timestamp shows current update time
- Dashboard continues functioning if WebSocket temporarily disconnects
- Automatic reconnection occurs within 60 seconds

#### Acceptance Criteria:
- AC1: Auto-refresh occurs every 15 minutes (±30 seconds)
- AC2: Updates delivered via WebSocket (no page refresh)
- AC3: All metrics update simultaneously
- AC4: Trend indicators recalculate correctly
- AC5: Visual update is smooth (no flickering)
- AC6: Temporary network loss handled gracefully
- AC7: Automatic reconnection within 60 seconds

#### Test Data:
- Fleet Utilization: 87% → 88% (update after 15 minutes)
- Cost Per Mile: $2.34 → $2.33 (update after 15 minutes)
- Safety Score: 88/100 → 89/100 (update after 15 minutes)
- Update timestamp: Current time (auto-calculated)

---

### TC-EX-005: Dashboard PDF Export

**Test Case ID**: TC-EX-005
**Test Case Name**: Dashboard PDF Export
**Related User Story**: US-EX-001 (Enterprise Fleet Performance Dashboard)
**Related Use Case**: UC-EX-001 (Access Enterprise Fleet Performance Dashboard)
**Priority**: High
**Test Type**: Functional / Export
**Test Author**: QA Team
**Created Date**: November 10, 2025

#### Preconditions:
- Executive dashboard is fully loaded with all metrics visible
- Executive user has export permissions
- PDF generation service is operational (wkhtmltopdf)
- Browser is configured to handle PDF downloads
- Current date/time is available for report dating

#### Test Steps:
1. Load Executive Dashboard with current KPI metrics
2. Locate "Export" button (typically in dashboard header)
3. Click Export button
4. Verify export menu appears with options:
   - Export as PDF
   - Export as PowerPoint
   - Export as Excel
5. Select "Export as PDF"
6. Observe system processes export request
7. Verify PDF download completes successfully
8. Open downloaded PDF file in PDF viewer
9. Verify PDF contains:
   - Title: "Executive Fleet Dashboard"
   - Report date/time of export
   - All primary KPI metrics with current values
   - Visual charts and graphs (utilization trend, cost trend, safety trend)
   - Color-coded status indicators
   - Fleet overview summary
10. Verify PDF is professionally formatted:
    - Proper page layout with margins
    - Legible fonts and sizing
    - Corporate branding/logo
    - Professional color scheme
11. Verify PDF is read-only (no interactive elements)
12. Check PDF file size is reasonable (<5MB)
13. Verify no sensitive data (PII) is included
14. Print PDF to physical printer to verify print quality

#### Expected Results:
- Export completes successfully within 60 seconds
- PDF file downloads with proper filename (e.g., "Executive_Dashboard_2025-11-10.pdf")
- PDF contains all major dashboard metrics and visualizations
- PDF is professionally formatted and branded
- PDF is read-only with no interactive content
- File size is reasonable (<5MB)
- Print quality is clear and legible
- No PII or sensitive driver data in PDF

#### Acceptance Criteria:
- AC1: PDF export completes within 60 seconds
- AC2: PDF filename includes report date
- AC3: PDF contains all primary KPI metrics
- AC4: Charts and visualizations render correctly in PDF
- AC5: PDF is professionally formatted with branding
- AC6: No editable content in PDF
- AC7: File size <5MB
- AC8: Print quality meets executive standards

#### Test Data:
- Export Date/Time: 2025-11-10 14:30:00
- PDF Filename: Executive_Dashboard_2025-11-10.pdf
- Metrics to Export:
  - Fleet Overview (285 vehicles, 1,240 drivers, 52 locations)
  - KPI Summary (utilization, CPM, on-time, safety)
  - Trend Charts (cost, utilization, safety trends)

---

## Multi-Location Comparison

### TC-EX-006: Location Comparison Table Display

**Test Case ID**: TC-EX-006
**Test Case Name**: Location Comparison Table Display
**Related User Story**: US-EX-002 (Multi-Location Fleet Comparison)
**Related Use Case**: UC-EX-002 (Monitor Multi-Location Fleet Performance)
**Priority**: High
**Test Type**: Functional / Data Display
**Test Author**: QA Team
**Created Date**: November 10, 2025

#### Preconditions:
- Executive is logged into system with appropriate permissions
- Multi-location performance data is available in system
- 52 fleet locations are configured and active:
  - Boston Hub, Atlanta Hub, Chicago Hub, LA Distribution, Denver Center, etc.
- Location hierarchy is properly configured (regions, business units)
- Current performance metrics available for all locations

#### Test Steps:
1. Navigate to "Location Performance Comparison" dashboard
2. System displays location selection screen
3. Select comparison scope: "All Locations"
4. Click "View Comparison"
5. Verify location comparison table loads
6. Verify table displays all 52 locations with columns:
   - Location Name
   - Utilization Rate %
   - Cost Per Mile $
   - On-Time Delivery %
   - Safety Score
   - YTD Cost $
   - Status Indicator (color-coded)
7. Verify data accuracy by checking sample locations:
   - Boston Hub: 91% utilization, $2.11 CPM, 94% on-time, 92 safety, $320K YTD
   - Atlanta Hub: 85% utilization, $2.48 CPM, 88% on-time, 85 safety, $385K YTD
   - LA Distribution: 82% utilization, $2.67 CPM, 86% on-time, 78 safety, $520K YTD
8. Verify color-coded status indicators:
   - Green: Boston (top performer)
   - Yellow: Atlanta (below target utilization)
   - Red: LA (multiple metrics below acceptable)
9. Verify table is scrollable if locations exceed screen height
10. Verify column headers are visible and readable
11. Check that table data is current (within 15-minute update window)
12. Verify no edit controls visible in table cells
13. Verify location names are clickable for drill-down access

#### Expected Results:
- All 52 locations display in comparison table
- Table data matches source database values (±0.1% tolerance)
- Color-coding applied correctly per business rules
- Top 3 and bottom 3 performers highlighted
- Outliers visually apparent (red flags on worst performers)
- Table is readable and well-formatted
- Data is current and accurate
- Read-only display with no edit capability

#### Acceptance Criteria:
- AC1: All 52 locations display in table
- AC2: All metrics accurate within ±0.1% of source data
- AC3: Color-coding highlights top and bottom performers
- AC4: Outliers clearly identified visually
- AC5: Table renders without errors
- AC6: Data current within 15 minutes
- AC7: No edit controls visible
- AC8: Table responsive on different screen sizes

#### Test Data:
- Boston Hub: 91% util, $2.11 CPM, 94% on-time, 92 safety, $320K YTD - GREEN
- Atlanta Hub: 85% util, $2.48 CPM, 88% on-time, 85 safety, $385K YTD - YELLOW
- Chicago Hub: 89% util, $2.29 CPM, 91% on-time, 90 safety, $412K YTD - GREEN
- LA Distribution: 82% util, $2.67 CPM, 86% on-time, 78 safety, $520K YTD - RED
- Denver Center: 88% util, $2.34 CPM, 92% on-time, 88 safety, $298K YTD - GREEN

---

### TC-EX-007: Location Ranking and Sorting

**Test Case ID**: TC-EX-007
**Test Case Name**: Location Ranking and Sorting
**Related User Story**: US-EX-002 (Multi-Location Fleet Comparison)
**Related Use Case**: UC-EX-002 (Monitor Multi-Location Fleet Performance)
**Priority**: High
**Test Type**: Functional / Sorting
**Test Author**: QA Team
**Created Date**: November 10, 2025

#### Preconditions:
- Location comparison table is displayed with all 52 locations
- Column headers are clickable for sorting
- Test data contains varied metrics for proper sorting validation
- Database supports dynamic sorting without page reload

#### Test Steps:
1. Load Location Comparison table with all locations displayed
2. Record initial order of locations
3. Click on "Cost Per Mile" column header
4. Verify table re-sorts by Cost Per Mile in ascending order (lowest cost first)
5. Verify Boston Hub ($2.11) appears near top of sorted list
6. Verify LA Distribution ($2.67) appears near bottom of sorted list
7. Click "Cost Per Mile" header again
8. Verify table now sorts in descending order (highest cost first)
9. Verify LA Distribution now appears at top
10. Click on "Utilization Rate" column header
11. Verify table sorts by utilization (highest to lowest)
12. Verify Boston Hub (91%) appears at top
13. Verify LA Distribution (82%) appears lower
14. Click on "Safety Score" column header
15. Verify table sorts by safety score (highest to lowest)
16. Verify Boston Hub (92) appears at top
17. Verify LA Distribution (78) appears at bottom
18. Click on "On-Time Delivery %" header
19. Verify table sorts correctly (highest to lowest)
20. Click header again to reverse sort (lowest to highest)
21. Verify sort indicator (arrow) shows current sort direction
22. Verify sort completion is responsive (<2 seconds)

#### Expected Results:
- Table sorts dynamically when column header clicked
- Sort order toggles between ascending/descending on repeated clicks
- Sort indicator arrow shows current sort direction
- Data maintains accuracy during sort
- Sort completes within 2 seconds without page reload
- All locations remain visible after sort
- Top 3 and bottom 3 performers correctly positioned in sort order

#### Acceptance Criteria:
- AC1: Clicking column header sorts table by that column
- AC2: Repeated clicks toggle sort direction
- AC3: Sort indicator shows direction (↑/↓)
- AC4: Sort completes within 2 seconds
- AC5: All locations remain visible after sort
- AC6: Sorted data is accurate
- AC7: No page reload during sort
- AC8: Multi-column sort preserved for consistency

#### Test Data:
Sort Verification by Cost Per Mile:
- Ascending: Boston ($2.11), Denver ($2.34), Chicago ($2.29), Atlanta ($2.48), LA ($2.67)
- Descending: LA ($2.67), Atlanta ($2.48), Chicago ($2.29), Denver ($2.34), Boston ($2.11)

Sort Verification by Utilization:
- Descending: Boston (91%), Chicago (89%), Denver (88%), Atlanta (85%), LA (82%)
- Ascending: LA (82%), Atlanta (85%), Denver (88%), Chicago (89%), Boston (91%)

---

### TC-EX-008: Location Performance Filtering

**Test Case ID**: TC-EX-008
**Test Case Name**: Location Performance Filtering
**Related User Story**: US-EX-002 (Multi-Location Fleet Comparison)
**Related Use Case**: UC-EX-002 (Monitor Multi-Location Fleet Performance)
**Priority**: High
**Test Type**: Functional / Filtering
**Test Author**: QA Team
**Created Date**: November 10, 2025

#### Preconditions:
- Location comparison table is displayed with all 52 locations
- Filter controls are visible and functional
- Available filter options:
  - Region (Northeast, Southeast, Midwest, Southwest, West)
  - Vehicle Type (Standard, Refrigerated, Tanker, Specialty)
  - Performance Level (Top Performers, Average, Underperforming)
  - Time Period (Last Month, Last Quarter, Last Year)
- Database supports dynamic filtering

#### Test Steps:
1. Load Location Comparison table (all 52 locations visible)
2. Locate filter panel in dashboard
3. Select filter: "Region = Northeast Region Only"
4. Click "Apply Filters"
5. Verify table now shows only Northeast region locations (approximately 12 locations)
6. Verify Boston Hub remains visible (Northeast location)
7. Verify LA Distribution is hidden (West region)
8. Verify filter chip/tag shows "Region: Northeast" in filter bar
9. Remove region filter by clicking X on filter chip
10. Verify table reloads showing all 52 locations again
11. Select filter: "Vehicle Type = Refrigerated Only"
12. Click "Apply Filters"
13. Verify table shows only locations with refrigerated fleet
14. Verify count reduced to ~15 locations with refrigerated operations
15. Select additional filter: "Performance Level = Underperforming"
16. Click "Apply Filters"
17. Verify table now shows only underperforming locations with refrigerated fleet
18. Verify LA Distribution appears in filtered results
19. Verify both filter chips visible in filter bar
20. Select filter: "Time Period = Last 3 Months"
21. Click "Apply Filters"
22. Verify metrics recalculate for selected time period
23. Verify metrics may change based on 3-month window
24. Verify filter combination updates all visible metrics
25. Click "Clear All Filters"
26. Verify all 52 locations display again

#### Expected Results:
- Filters apply dynamically without page reload
- Table updates immediately to show filtered results
- Filter chips/tags display current filters
- Multiple filters can be combined
- Filter combinations work correctly (AND logic)
- Metrics recalculate based on selected time period
- Filter removal/clearing works properly
- All 52 locations return after clearing filters
- Filtered views complete within 5 seconds

#### Acceptance Criteria:
- AC1: Single filter applies correctly and updates table
- AC2: Multiple filters can be combined
- AC3: Filter results are accurate
- AC4: Filters apply within 5 seconds
- AC5: Filter chips show current active filters
- AC6: Filters can be removed individually
- AC7: "Clear All Filters" returns to unfiltered view
- AC8: Time period filter updates metrics correctly

#### Test Data:
- Northeast Region: Boston, Philadelphia, New York, etc. (~12 locations)
- Refrigerated Fleet: Boston, Chicago, Atlanta, etc. (~15 locations)
- Underperforming: LA, Phoenix, Las Vegas, etc. (~8 locations)
- Performance Level Filter Thresholds:
  - Top Performers: All metrics >90% or above avg
  - Average: Metrics within ±10% of average
  - Underperforming: <80% on any safety metric or <85% utilization

---

### TC-EX-009: Location Outlier Identification

**Test Case ID**: TC-EX-009
**Test Case Name**: Location Outlier Identification
**Related User Story**: US-EX-002 (Multi-Location Fleet Comparison)
**Related Use Case**: UC-EX-002 (Monitor Multi-Location Fleet Performance)
**Priority**: Medium
**Test Type**: Functional / Analytics
**Test Author**: QA Team
**Created Date**: November 10, 2025

#### Preconditions:
- Location comparison table displays all 52 locations
- System has calculated performance statistics:
  - Average metrics across all locations
  - Standard deviation for each metric
  - Top 3 and bottom 3 performers identified
- Outlier thresholds configured:
  - Top performer: >1 standard deviation above mean
  - Bottom performer: >1 standard deviation below mean
- Visual highlighting is enabled

#### Test Steps:
1. Load Location Comparison table with all 52 locations
2. Observe visual highlighting of top performers (GREEN)
3. Verify Boston Hub is highlighted as top performer:
   - Above average on utilization, CPM, on-time, safety metrics
   - Status indicator shows GREEN
4. Observe visual highlighting of bottom performers (RED)
5. Verify LA Distribution is highlighted as underperformer:
   - Below average on multiple metrics
   - Status indicator shows RED
6. Scroll through table and identify all highlighted locations
7. Verify system highlights exactly top 3 and bottom 3 performers
8. Click on top performer (Boston) row
9. Verify drill-down details show Boston's strengths:
   - Highest utilization (91% vs 87% avg)
   - Lowest cost per mile ($2.11 vs $2.34 avg)
   - Highest on-time rate (94% vs 92% avg)
   - Highest safety score (92 vs 88 avg)
10. Close drill-down and click on bottom performer (LA)
11. Verify drill-down details show LA's problems:
    - Lowest utilization (82% vs 87% avg)
    - Highest cost per mile ($2.67 vs $2.34 avg)
    - Lowest on-time rate (86% vs 92% avg)
    - Lowest safety score (78 vs 88 avg)
12. Verify system provides insight text:
    - For top performers: "Performance exceeds benchmarks by X%"
    - For bottom performers: "Performance below target by X%"
13. Verify variance calculations are accurate:
    - Calculate standard deviation for each metric
    - Verify outliers are >1 std dev from mean
14. Verify sorting by any metric correctly positions outliers

#### Expected Results:
- Top 3 performers clearly highlighted in GREEN
- Bottom 3 performers clearly highlighted in RED
- Outlier identification is accurate mathematically
- Average calculations are correct across all metrics
- Drill-down shows reason for outlier status
- Insight text provides actionable information
- System shows all outliers in at least one metric category
- Color-coded visual makes outliers immediately apparent

#### Acceptance Criteria:
- AC1: Top 3 performers correctly identified and highlighted
- AC2: Bottom 3 performers correctly identified and highlighted
- AC3: Outlier calculations mathematically accurate
- AC4: Drill-down provides detailed explanation
- AC5: Insights explain performance gaps
- AC6: Visual highlighting is clear and obvious
- AC7: Color-coding follows business rules (GREEN/RED)
- AC8: Outlier identification updates with data refresh

#### Test Data:
Location Performance Statistics:
- Average Utilization: 87%
- Average Cost Per Mile: $2.34
- Average On-Time Rate: 92%
- Average Safety Score: 88

Top Performers (GREEN):
- Boston: 91% util, $2.11 CPM, 94% on-time, 92 safety
- Denver: 88% util, $2.34 CPM, 92% on-time, 88 safety
- Chicago: 89% util, $2.29 CPM, 91% on-time, 90 safety

Bottom Performers (RED):
- LA: 82% util, $2.67 CPM, 86% on-time, 78 safety
- Phoenix: 80% util, $2.75 CPM, 85% on-time, 75 safety
- Las Vegas: 81% util, $2.71 CPM, 84% on-time, 76 safety

---

### TC-EX-010: Location Comparison Export

**Test Case ID**: TC-EX-010
**Test Case Name**: Location Comparison Export
**Related User Story**: US-EX-002 (Multi-Location Fleet Comparison)
**Related Use Case**: UC-EX-002 (Monitor Multi-Location Fleet Performance)
**Priority**: High
**Test Type**: Functional / Export
**Test Author**: QA Team
**Created Date**: November 10, 2025

#### Preconditions:
- Location comparison table is displayed with filtered or unfiltered locations
- User has export permissions
- Export service is operational (for Excel, PDF, PowerPoint)
- Current location metrics are available

#### Test Steps:
1. Load Location Comparison table
2. Apply filters: "Region = Northeast, Vehicle Type = Standard"
3. Locate "Export" button in table header
4. Click "Export" button
5. Verify export menu appears with options:
   - Export as Excel (.xlsx)
   - Export as PDF
   - Export as PowerPoint
6. Select "Export as Excel"
7. Observe system processes export request
8. Verify Excel file downloads successfully
9. Open downloaded Excel file
10. Verify Excel contains:
    - Sheet 1: Location Comparison Table with all columns
    - Sheet 2: Summary Statistics
    - Sheet 3: Top/Bottom Performers Analysis
11. Verify Excel data matches on-screen values:
    - Location names, utilization rates, CPM, on-time %, safety scores
    - YTD costs and status indicators
12. Verify Excel formatting:
    - Headers are bold and colored
    - Data rows are properly formatted
    - Color-coded status (GREEN/YELLOW/RED) preserved
    - Numbers formatted with appropriate decimals
13. Verify filter applied is noted in Excel (e.g., "Filtered by: Northeast Region")
14. Close Excel and return to application
15. Click Export again and select "Export as PDF"
16. Verify PDF downloads successfully
17. Open PDF and verify:
    - Contains location comparison table
    - Professional formatting with company branding
    - Includes summary analysis of top/bottom performers
    - Date/time of export is shown
18. Return to app and click Export, select "Export as PowerPoint"
19. Verify PowerPoint file downloads
20. Open PowerPoint and verify:
    - Contains location comparison slide
    - Charts showing performance metrics
    - Summary analysis
    - Professional presentation format

#### Expected Results:
- Export completes successfully for all format options
- Exported files contain accurate data matching on-screen view
- Excel file includes multiple sheets with analysis
- PDF is professionally formatted with branding
- PowerPoint includes charts and visualizations
- All formats preserve color-coding and highlighting
- Exported files are properly named with date
- No sensitive data (PII) included in exports

#### Acceptance Criteria:
- AC1: Excel export completes and contains all data
- AC2: PDF export is professionally formatted
- AC3: PowerPoint export includes visualizations
- AC4: Exported data matches on-screen values
- AC5: Color-coding preserved in Excel exports
- AC6: Files properly named with date stamp
- AC7: Exports complete within 60 seconds
- AC8: All export formats available and functional

#### Test Data:
- Export Date: 2025-11-10
- Filtered View: Northeast Region, Standard Vehicles
- Exported Locations: ~12 Northeast locations
- Excel Filename: Location_Comparison_2025-11-10.xlsx
- PDF Filename: Location_Comparison_2025-11-10.pdf
- PowerPoint Filename: Location_Comparison_2025-11-10.pptx

---

## Real-Time Alerts

### TC-EX-011: Critical Alert Delivery (Push Notification)

**Test Case ID**: TC-EX-011
**Test Case Name**: Critical Alert Delivery (Push Notification)
**Related User Story**: US-EX-003 (Real-Time Alert Monitoring)
**Related Use Case**: UC-EX-003 (Respond to Critical Executive Alerts)
**Priority**: High
**Test Type**: Functional / Real-Time
**Test Author**: QA Team
**Created Date**: November 10, 2025

#### Preconditions:
- Executive user is logged into system or has mobile app installed
- Push notification service is operational (Firebase Cloud Messaging)
- Device has push notifications enabled
- Executive alert preferences configured for critical alerts
- Test environment can trigger test alerts without impacting production
- Test device is configured with test credentials

#### Test Steps:
1. Ensure executive's mobile app is installed and user is logged in
2. Verify mobile device has push notifications enabled in settings
3. Trigger test critical alert in system:
   - Alert Type: Vehicle Accident
   - Severity: CRITICAL
   - Vehicle: #247
   - Location: I-95 North, Mile Marker 47
4. Set system time to 2:47 PM ET (matching alert time)
5. Observe mobile device for push notification
6. Verify push notification arrives within 5 seconds of alert trigger
7. Verify notification content includes:
   - Alert type: "🚨 CRITICAL: Vehicle #247 Major Accident"
   - Location: "I-95 North, Mile Marker 47"
   - Timestamp: "2:47 PM ET"
8. Verify notification sound/vibration occurs on device
9. Verify notification appears in notification center
10. Tap notification to open alert details
11. Verify alert details screen displays:
    - Incident type: Vehicle accident
    - Location with GPS coordinates
    - Vehicles involved: 1 company vehicle + 1 other vehicle
    - Driver status: Conscious, alert, appeared uninjured
    - Current response status: Dispatcher coordinating
    - ETA for emergency services
    - Cargo status
    - Estimated cost implications
12. Verify system timestamp matches alert creation time
13. Verify alert includes recommended actions:
    - Contact driver to confirm status
    - Notify insurance carrier
    - Coordinate cargo transfer
    - Notify affected customers
14. Test with device in locked state - verify notification still appears
15. Test with app in background - verify notification shows

#### Expected Results:
- Push notification delivered within 5 seconds of alert trigger
- Notification contains critical alert information
- Sound/vibration alerts user to critical nature
- Notification appears in notification center
- Tapping notification opens full alert details
- Alert details display all critical information
- Timestamp is accurate
- Alert works with locked device and backgrounded app

#### Acceptance Criteria:
- AC1: Push notification delivered within 5 seconds
- AC2: Notification includes alert type and location
- AC3: Notification sound/vibration activates
- AC4: Notification persists in notification center
- AC5: Alert details display complete information
- AC6: Alert timestamps accurate
- AC7: Works with locked device
- AC8: Works with backgrounded app

#### Test Data:
- Alert Type: CRITICAL - Vehicle Accident
- Vehicle ID: #247
- Location: I-95 North, Mile Marker 47, Springfield, MA
- GPS Coordinates: 42.1234, -72.6789
- Driver: Mike Torres
- Alert Time: 2:47 PM ET
- Notification Title: "🚨 CRITICAL: Vehicle #247 Major Accident"
- Notification Body: "I-95 North, MM 47 - Tap to view details"

---

### TC-EX-012: Alert Acknowledgment and Status Tracking

**Test Case ID**: TC-EX-012
**Test Case Name**: Alert Acknowledgment and Status Tracking
**Related User Story**: US-EX-003 (Real-Time Alert Monitoring)
**Related Use Case**: UC-EX-003 (Respond to Critical Executive Alerts)
**Priority**: High
**Test Type**: Functional / Workflow
**Test Author**: QA Team
**Created Date**: November 10, 2025

#### Preconditions:
- Executive is logged into dashboard with alerts visible
- Multiple test alerts are created with different statuses:
  - Alert 1: NEW (unacknowledged)
  - Alert 2: ACKNOWLEDGED (acknowledged but not resolved)
  - Alert 3: RESOLVED (closed)
- Alert status tracking is enabled
- Database tracks alert acknowledgment with timestamp and user

#### Test Steps:
1. Load Executive Alert Dashboard
2. Verify alert list displays with status indicators:
   - NEW alerts shown with icon/badge
   - ACKNOWLEDGED alerts shown differently
   - RESOLVED alerts shown as closed/archived
3. Locate NEW alert: "CRITICAL: Vehicle #247 Major Accident"
4. Verify alert shows status: "NEW" with timestamp
5. Click "Acknowledge" button on NEW alert
6. Verify system records acknowledgment:
   - Status changes to "ACKNOWLEDGED"
   - Timestamp recorded (current time)
   - User recorded (logged-in executive)
7. Verify acknowledgment note can be added
8. Type note: "Approving emergency response actions"
9. Click "Save Acknowledgment"
10. Verify note is saved and visible in alert
11. Verify alert moves to ACKNOWLEDGED section in dashboard
12. Verify acknowledgment timestamp visible in alert details
13. Verify acknowledged alert still shows recommended actions (not yet resolved)
14. Click on ACKNOWLEDGED alert to view full details
15. Verify acknowledgment note is displayed
16. Verify option to view "Approval Actions" or "Recommended Actions"
17. Click "View Approval Actions"
18. Verify system shows approved actions:
    - Initiate insurance claim - APPROVED
    - Send customer delay notifications - APPROVED
    - Notify safety officer for investigation - APPROVED
19. Verify each approved action shows:
    - Action description
    - Status (APPROVED/IN PROGRESS/COMPLETED)
    - Timestamp of approval
    - User who approved
20. Move alert to RESOLVED status:
    - Select "Mark as Resolved"
    - Add resolution note: "Emergency response completed"
    - Verify status changes to RESOLVED
21. Verify RESOLVED alert moves to archive/closed section
22. Verify alert can still be viewed for audit trail

#### Expected Results:
- Alert acknowledgment updates status immediately
- Acknowledgment timestamp is recorded
- User information is captured with acknowledgment
- Acknowledgment notes can be added and saved
- Approved actions are tracked with status
- Alert status flows: NEW → ACKNOWLEDGED → RESOLVED
- All status transitions are logged to audit trail
- Resolved alerts can still be accessed for history

#### Acceptance Criteria:
- AC1: Acknowledge action changes status to ACKNOWLEDGED
- AC2: Acknowledgment timestamp and user recorded
- AC3: Acknowledgment notes can be added and saved
- AC4: Approved actions tracked with timestamps
- AC5: Status transitions logged to audit trail
- AC6: Resolved alerts archived but accessible
- AC7: Multiple alerts can be tracked simultaneously
- AC8: Status history available for each alert

#### Test Data:
Alert 1 - NEW:
- ID: ALERT-001
- Type: CRITICAL - Vehicle Accident
- Status: NEW
- Vehicle: #247
- Timestamp: 2:47 PM ET

Alert 2 - ACKNOWLEDGED:
- ID: ALERT-002
- Type: HIGH - Budget Variance
- Status: ACKNOWLEDGED
- Acknowledged at: 3:15 PM ET
- User: Executive User 1

Alert 3 - RESOLVED:
- ID: ALERT-003
- Type: MEDIUM - Maintenance Due
- Status: RESOLVED
- Resolved at: 4:00 PM ET
- Resolution note: "Service scheduled for tomorrow"

---

### TC-EX-013: Alert Details and Context Display

**Test Case ID**: TC-EX-013
**Test Case Name**: Alert Details and Context Display
**Related User Story**: US-EX-003 (Real-Time Alert Monitoring)
**Related Use Case**: UC-EX-003 (Respond to Critical Executive Alerts)
**Priority**: High
**Test Type**: Functional / Data Display
**Test Author**: QA Team
**Created Date**: November 10, 2025

#### Preconditions:
- Executive alerts dashboard is loaded
- Multiple test alerts are available with different types:
  - Vehicle accident alert
  - Budget variance alert
  - Compliance violation alert
- Alert details service is operational
- Related data (vehicle info, financial data, compliance records) is accessible

#### Test Steps:
1. Load Executive Alert Dashboard
2. Click on CRITICAL alert: "Vehicle #247 Major Accident"
3. Verify alert details panel opens showing:
   - Alert Title: "🚨 CRITICAL: Vehicle #247 Major Accident"
   - Alert Type: Vehicle Accident
   - Severity: CRITICAL (with color coding)
   - Timestamp: 2:47 PM ET (Nov 10, 2025)
   - Location: I-95 North, Mile Marker 47, Springfield, MA
   - GPS Coordinates: 42.1234, -72.6789
4. Verify vehicle information displayed:
   - Vehicle ID: #247
   - Vehicle Type: Tractor-Trailer
   - Driver Name: Mike Torres
   - Driver Contact: 555-0147
5. Verify incident details:
   - Vehicles involved: 1 company vehicle + 1 other vehicle
   - Driver status: Conscious, alert, appeared uninjured
   - Estimated damage cost: $50K+
6. Verify current response status:
   - Police ETA: 8 minutes
   - Ambulance ETA: 10 minutes
   - Dispatcher Status: Coordinating emergency services
7. Verify cargo status:
   - Cargo Type: 10 pallets (undamaged)
   - Destination: Chicago Hub
   - Customer: ABC Distribution
8. Verify recommended actions with status:
   - ✓ Contact driver to confirm status (COMPLETED)
   - ⧖ Notify insurance carrier (PENDING)
   - ⧖ Coordinate cargo transfer (IN PROGRESS)
   - ⧖ Notify affected customers (PENDING - 3 customers)
9. Click on "3 customers impacted" link
10. Verify system shows affected customers:
    - Customer 1: ABC Distribution
    - Customer 2: XYZ Logistics
    - Customer 3: DEF Shipping
11. Verify delay notification options:
    - Auto-notify via email (AVAILABLE)
    - Auto-notify via SMS (AVAILABLE)
    - Send custom message (AVAILABLE)
12. Close alert details for vehicle accident alert
13. Click on HIGH alert: "Budget Variance - Fleet Fuel Costs"
14. Verify budget alert details display:
    - Alert Type: Budget Variance
    - Metric: Fuel Costs
    - Variance: $150K over budget (15% overage)
    - YTD Budget: $1.0M
    - YTD Actual: $1.15M
15. Verify budget variance context:
    - Variance Reason: Unexpected fuel price increase
    - Variance Analysis: 12% increase in fuel prices (external factor)
    - Contributed Units: All locations affected
16. Verify linked reports:
    - Link to "Budget Variance Report"
    - Link to "Fuel Cost Analysis"
    - Link to "Budget Adjustment Request"
17. Click on "Budget Variance Report" link
18. Verify system navigates to detailed budget report (not closing alert details)
19. Return to alert details and verify all information still visible
20. Verify alert information is read-only (no edit controls)

#### Expected Results:
- Alert details panel displays complete information
- Vehicle/incident information is accurate and relevant
- Status information shows current situation and ETAs
- Recommended actions clearly listed with status
- Related data (customers, affected items) accessible
- Links to related reports/details functional
- All data is read-only presentation
- Context is clear and actionable for executive decision-making

#### Acceptance Criteria:
- AC1: Alert details complete and accurate
- AC2: Vehicle/incident information displayed
- AC3: Response status and ETAs shown
- AC4: Recommended actions listed with status
- AC5: Related data accessible via links
- AC6: Financial impact estimated
- AC7: Customer impact shown
- AC8: All information read-only

#### Test Data:
Alert 1 - Vehicle Accident:
- Vehicle: #247, Tractor-Trailer
- Driver: Mike Torres
- Location: I-95 North, MM 47
- Damage Estimate: $50K+
- Status: CRITICAL
- Recommended Actions: 4 total (1 completed, 3 pending)

Alert 2 - Budget Variance:
- Metric: Fuel Costs
- Variance: $150K over (15%)
- Budget: $1.0M YTD
- Actual: $1.15M YTD
- Reason: Fuel price increase
- Status: HIGH

---

### TC-EX-014: Multi-Channel Alert Delivery (Email/SMS/Push)

**Test Case ID**: TC-EX-014
**Test Case Name**: Multi-Channel Alert Delivery (Email/SMS/Push)
**Related User Story**: US-EX-003 (Real-Time Alert Monitoring)
**Related Use Case**: UC-EX-003 (Respond to Critical Executive Alerts)
**Priority**: High
**Test Type**: Functional / Integration
**Test Author**: QA Team
**Created Date**: November 10, 2025

#### Preconditions:
- Executive user is configured with:
  - Email: exec@fleet.local
  - Mobile number: 555-0100
  - Mobile app installed with push notifications enabled
- Notification services are operational:
  - SendGrid for email
  - Twilio for SMS
  - Firebase Cloud Messaging for push
- Executive alert preferences are configured for multi-channel delivery
- Test alert can be triggered without impacting production

#### Test Steps:
1. Verify executive alert preferences:
   - Email notifications: ENABLED
   - SMS notifications: ENABLED
   - Push notifications: ENABLED
   - Alert threshold: CRITICAL and HIGH severity
2. Trigger test CRITICAL alert: "Vehicle #247 Major Accident"
3. Check email inbox for alert notification within 30 seconds
4. Verify email contains:
   - Subject: "[CRITICAL] Fleet Alert: Vehicle #247 Major Accident"
   - From: alerts@fleet-management.com
   - Alert type, severity, location, vehicle info
   - Quick action link: "View Alert Details"
   - Timestamp of alert
5. Click email link to verify it navigates to alert dashboard
6. Verify SMS text message received on mobile within 30 seconds
7. Verify SMS contains:
   - Message: "CRITICAL: Vehicle #247 accident at I-95 North MM47. Mike Torres. Details: [link]"
   - From: Fleet Management System
   - Link to alert details (SMS-shortened URL)
8. Verify push notification received on mobile within 5 seconds
9. Verify push notification contains:
   - Title: "🚨 CRITICAL: Vehicle #247 Major Accident"
   - Body: "I-95 North, MM 47 - Tap to view details"
10. Verify notification sound plays (if enabled)
11. Verify all three channels deliver simultaneously (within 5 seconds)
12. Trigger test HIGH alert: "Budget Variance"
13. Verify email is sent for HIGH alert (per preferences)
14. Verify SMS is sent for HIGH alert (per preferences)
15. Verify push notification is sent for HIGH alert
16. Trigger test MEDIUM alert: "Maintenance Reminder"
17. Verify email is NOT sent (configured for CRITICAL/HIGH only)
18. Verify SMS is NOT sent (configured for CRITICAL/HIGH only)
19. Verify push notification is NOT sent (configured for CRITICAL/HIGH only)
20. Verify dashboard alert appears (notification preferences don't limit dashboard display)
21. Modify preferences to disable SMS notifications
22. Trigger test CRITICAL alert: "New Vehicle Incident"
23. Verify email is delivered
24. Verify push notification is delivered
25. Verify SMS is NOT delivered (disabled)
26. Verify dashboard alert still appears

#### Expected Results:
- CRITICAL alerts delivered via all three channels
- HIGH alerts delivered per user preferences
- MEDIUM alerts delivered via dashboard only (if configured)
- All channels deliver within 5 seconds of alert trigger
- Email contains formatted message with action link
- SMS contains condensed message with link
- Push notification appears on locked device
- User can disable/enable channels per preference
- Notification delivery tracked in audit log

#### Acceptance Criteria:
- AC1: CRITICAL alerts delivered via email within 30 seconds
- AC2: CRITICAL alerts delivered via SMS within 30 seconds
- AC3: CRITICAL alerts delivered via push within 5 seconds
- AC4: HIGH alerts delivered per user preferences
- AC5: Preferences allow granular control per severity level
- AC6: Email contains formatted message with link
- AC7: SMS contains condensed message with link
- AC8: Delivery channels can be disabled individually

#### Test Data:
Executive Profile:
- Email: exec@fleet.local
- Phone: 555-0100
- Preferences:
  - Email: CRITICAL, HIGH enabled
  - SMS: CRITICAL, HIGH enabled
  - Push: CRITICAL, HIGH enabled
  - Disable MEDIUM and LOW

Alert:
- Type: CRITICAL - Vehicle Accident
- Vehicle: #247
- Location: I-95 North, MM 47
- Driver: Mike Torres
- Estimated Impact: $50K+

---

### TC-EX-015: Alert Configuration and Preferences

**Test Case ID**: TC-EX-015
**Test Case Name**: Alert Configuration and Preferences
**Related User Story**: US-EX-003 (Real-Time Alert Monitoring)
**Related Use Case**: UC-EX-003 (Respond to Critical Executive Alerts)
**Priority**: Medium
**Test Type**: Functional / Configuration
**Test Author**: QA Team
**Created Date**: November 10, 2025

#### Preconditions:
- Executive user is logged into system
- User has access to Settings/Preferences page
- Alert threshold configuration page is accessible
- Current preferences exist with default settings:
  - Email enabled for CRITICAL and HIGH
  - SMS enabled for CRITICAL only
  - Push enabled for all severities
  - Alert acknowledgment timeout: 15 minutes

#### Test Steps:
1. Navigate to Settings → Alert Preferences
2. Verify current notification settings displayed:
   - Email notifications: Enabled for CRITICAL, HIGH
   - SMS notifications: Enabled for CRITICAL only
   - Push notifications: Enabled for all severities
3. Expand "Alert Threshold Settings"
4. Verify alert threshold configuration shows:
   - Major Accident: CRITICAL severity
   - Budget Variance >20%: HIGH severity
   - Compliance Violation: CRITICAL severity
   - Maintenance Overdue >3 days: MEDIUM severity
   - Vehicle Performance Issue: MEDIUM severity
5. Click "Configure Thresholds" button
6. Modify threshold: "Budget Variance >20%" to ">15%"
7. Click "Save Changes"
8. Verify success message: "Alert thresholds updated"
9. Trigger test budget variance of 18% (between old and new threshold)
10. Verify alert is now triggered (because threshold is now >15%)
11. Verify alert severity is HIGH (as configured)
12. Configure notification channels:
    - Email: Select "CRITICAL and HIGH" (already selected)
    - SMS: Select "CRITICAL, HIGH, and MEDIUM"
    - Push: Select "CRITICAL only"
13. Click "Save Preferences"
14. Verify success message: "Notification preferences updated"
15. Trigger test MEDIUM alert
16. Verify email is NOT sent (configured for CRITICAL/HIGH only)
17. Verify SMS is sent (configured for CRITICAL/HIGH/MEDIUM)
18. Verify push is NOT sent (configured for CRITICAL only)
19. Verify dashboard alert appears regardless of notification settings
20. Configure "Alert Escalation":
    - If alert not acknowledged within: 15 minutes
    - Escalate to: CTO and CFO
    - Send reminder notification
21. Click "Save"
22. Trigger test alert and don't acknowledge
23. Wait 15 minutes
24. Verify escalation occurs:
    - CTO and CFO receive notifications
    - Reminder notification sent to original executive
25. Test "Quiet Hours" setting:
    - Enable quiet hours: 6 PM - 8 AM
    - All notifications except CRITICAL should be silent
26. Set system time to 7 PM (within quiet hours)
27. Trigger test HIGH alert
28. Verify notification is sent but marked as "silent" (no sound)
29. Verify CRITICAL alert still produces sound during quiet hours
30. Reset quiet hours and verify normal behavior

#### Expected Results:
- Alert threshold settings can be modified
- Modified thresholds apply immediately
- Notification channels can be configured per severity
- Preferences update successfully
- New preferences apply to future alerts
- Escalation rules work as configured
- Quiet hours suppress notifications appropriately
- CRITICAL alerts always deliver despite quiet hours
- All preference changes logged to audit trail

#### Acceptance Criteria:
- AC1: Alert thresholds can be configured
- AC2: Notification channels can be enabled/disabled
- AC3: Preferences apply to new alerts immediately
- AC4: Escalation rules can be configured
- AC5: Quiet hours can be set
- AC6: CRITICAL alerts bypass quiet hours
- AC7: All changes logged to audit trail
- AC8: Preferences can be reset to defaults

#### Test Data:
Default Thresholds:
- Major Accident: CRITICAL
- Budget Variance >20%: HIGH (modified to >15%)
- Compliance Violation: CRITICAL
- Maintenance Overdue >3 days: MEDIUM
- Vehicle Performance Issue: MEDIUM

Notification Preferences:
- Email: CRITICAL, HIGH (default)
- SMS: CRITICAL only (modified to CRITICAL, HIGH, MEDIUM)
- Push: All severities (modified to CRITICAL only)

Escalation Settings:
- Acknowledgment timeout: 15 minutes
- Escalate to: CTO, CFO

Quiet Hours:
- Start: 6 PM
- End: 8 AM
- Exception: CRITICAL alerts always deliver

---

## Budget and Financial Analysis

### TC-EX-016: Budget Variance Analysis Display

**Test Case ID**: TC-EX-016
**Test Case Name**: Budget Variance Analysis Display
**Related User Story**: US-EX-008 (Budget Variance Analysis)
**Related Use Case**: UC-EX-004 (Review Budget Variance Analysis)
**Priority**: High
**Test Type**: Functional / Financial Analysis
**Test Author**: QA Team
**Created Date**: November 10, 2025

#### Preconditions:
- Executive user is logged into system with appropriate permissions
- Budget variance analysis dashboard is accessible
- Test data configured with known budget and actual spending:
  - Fuel Budget: $1.0M YTD, Actual: $1.02M (+2%)
  - Maintenance Budget: $500K YTD, Actual: $475K (-5%)
  - Capital Budget: $2.0M YTD, Actual: $1.8M (-10%)
  - Insurance Budget: $300K YTD, Actual: $305K (+1.7%)
- Fleet Manager notes available for significant variances
- Year-to-date actuals are current

#### Test Steps:
1. Navigate to "Budget Analysis" → "Variance Analysis" dashboard
2. Verify dashboard displays budget vs. actual summary:
   - Shows all major cost categories
   - Displays YTD budget, actual, and variance for each
3. Observe budget category breakdown:
   - Fuel: Budget $1.0M, Actual $1.02M, Variance +$20K (+2%) - GREEN
   - Maintenance: Budget $500K, Actual $475K, Variance -$25K (-5%) - GREEN
   - Capital: Budget $2.0M, Actual $1.8M, Variance -$200K (-10%) - GREEN
   - Insurance: Budget $300K, Actual $305K, Variance +$5K (+1.7%) - YELLOW
4. Verify color-coding applied correctly:
   - ≤10% variance: GREEN
   - 10-20% variance: YELLOW
   - >20% variance: RED
5. Verify variance is displayed as both:
   - Dollar variance ($20K)
   - Percentage variance (+2%)
6. Verify each category shows trend indicators
7. Verify "Variance by Location" view available
8. Click "View by Location"
9. Verify variance analysis shows:
   - Boston: Fuel variance $5K, Maintenance variance -$8K, etc.
   - LA: Fuel variance $12K, Maintenance variance -$3K, etc.
   - Other locations show their respective variances
10. Click on "Fuel" category to drill down
11. Verify fuel cost breakdown displays:
    - Diesel costs: $580K actual vs $550K budget (+$30K)
    - Gasoline costs: $380K actual vs $400K budget (-$20K)
    - Fuel surcharge: $60K actual vs $50K budget (+$10K)
12. Verify each fuel subcategory shows variance
13. Click on highest variance item (Diesel +$30K)
14. Verify drill-down shows detail:
    - Diesel unit price: $3.50/gallon actual vs $3.25 budget
    - Gallons consumed: 165,714 gallons actual vs 169,230 budget
    - Total: 165,714 × $3.50 = $580K actual
    - Budget: 169,230 × $3.25 = $550K budget
15. Verify Fleet Manager notes visible for variance:
    - "Unexpected spike in fuel prices during Q3 (external factor)"
    - "Improved consumption efficiency by 2.4% year-over-year"
16. Click on "Budget Adjustment Request" button
17. Verify system shows available adjustment options
18. View "Projected Year-End Position" section
19. Verify system calculates:
    - Current YTD variance by category
    - Monthly average variance
    - Projected YTD variance if trend continues
    - Projected full-year surplus/deficit
20. Verify projection accuracy:
    - Fuel: $20K variance × 12/11 months = ~$22K projected
    - Total projected variance shown with confidence level

#### Expected Results:
- Budget variance dashboard displays accurate variance data
- Color-coding highlights significant variances (>10%)
- Variance shown in both dollar and percentage terms
- Drill-down available for all major categories
- Fleet Manager notes explain variances
- Year-end projections calculated based on trends
- Data current and accurate (within 24 hours)
- Read-only display with no edit controls
- Variance by location analysis functional

#### Acceptance Criteria:
- AC1: Budget vs. actual values accurate within ±0.1%
- AC2: Variance calculations correct (budget - actual)
- AC3: Color-coding follows threshold rules (10%, 20%)
- AC4: Drill-down displays detailed breakdown
- AC5: Fleet Manager notes visible for major variances
- AC6: Year-end projections calculated correctly
- AC7: All variances >10% highlighted
- AC8: Data current within 24 hours

#### Test Data:
Budget Variance Summary:
- Fuel: $1.0M budget, $1.02M actual, +$20K (+2%) - GREEN
- Maintenance: $500K budget, $475K actual, -$25K (-5%) - GREEN
- Capital: $2.0M budget, $1.8M actual, -$200K (-10%) - GREEN
- Insurance: $300K budget, $305K actual, +$5K (+1.7%) - YELLOW

Location Breakdown:
- Boston: Total variance +$8K (under budget)
- LA: Total variance +$35K (over budget)
- Chicago: Total variance -$12K (under budget)

---

### TC-EX-017: Capital Expenditure Approval Workflow

**Test Case ID**: TC-EX-017
**Test Case Name**: Capital Expenditure Approval Workflow
**Related User Story**: US-EX-009 (Capital Expenditure Approval Dashboard)
**Related Use Case**: UC-EX-005 (Approve Capital Expenditure Requests)
**Priority**: High
**Test Type**: Functional / Workflow
**Test Author**: QA Team
**Created Date**: November 10, 2025

#### Preconditions:
- Executive user is logged into system with approval authority
- Capital expenditure approval dashboard is accessible
- Test capital requests exist with different dollar amounts:
  - Request 1: $45K (auto-approve threshold <$50K)
  - Request 2: $150K (requires executive approval >$50K)
  - Request 3: $500K (high-value, requires executive + CFO approval)
- Request details include: description, ROI analysis, location, vehicle type
- Approval workflow engine is operational
- Notification system functional

#### Test Steps:
1. Navigate to "Capital Approval" → "Approval Queue" dashboard
2. Verify dashboard displays capital requests pending approval
3. Observe request summary showing:
   - Request ID: CAP-001 to CAP-003
   - Description (e.g., "Vehicle Fleet Refresh - Boston Hub")
   - Requested Amount
   - Location
   - Status (PENDING, APPROVED, REJECTED)
   - Priority
4. Filter to show "Pending Approval Only"
5. Verify display shows:
   - CAP-002: $150K (Vehicle acquisition) - PENDING MY APPROVAL
   - CAP-003: $500K (Fleet modernization) - PENDING MY APPROVAL
   - CAP-001: $45K (Maintenance equipment) - AUTO-APPROVED
6. Click on CAP-002 ($150K request)
7. Verify request details panel shows:
   - Title: "Boston Hub Vehicle Acquisition"
   - Amount: $150K
   - Description: "Purchase 10 new tractor units for Boston operations"
   - Business Justification: "Replace aging fleet, improve safety/efficiency"
   - ROI Analysis: "Payback period 4.2 years, NPV +$180K, IRR 18%"
   - Fleet Manager Recommendation: APPROVED
   - Budget Impact: "$150K from approved capital budget"
   - Approval Status: "Pending Executive approval"
   - Approval Authority: "Executive (threshold >$50K)"
8. Review ROI metrics displayed:
   - Capital Cost: $150K
   - Annual Cost Savings: $35K
   - Annual Additional Revenue: $20K
   - Payback Period: 4.2 years
   - Net Present Value: +$180K
   - Internal Rate of Return: 18%
9. Click "Approve" button
10. Verify approval confirmation dialog appears:
    - "Approve $150K Boston Hub Vehicle Acquisition?"
    - Shows approval authority: "This decision will be logged under your approval"
11. Click "Confirm Approval"
12. Verify system processes approval:
    - Status changes to APPROVED
    - Approval timestamp recorded
    - User recorded (logged-in executive)
    - Approval moves request to next stage (procurement)
13. Verify notification sent:
    - Fleet Manager receives "Capital request CAP-002 approved"
    - Procurement team receives "Capital request ready for procurement"
14. Return to approval queue and click on CAP-003 ($500K)
15. Verify high-value request shows:
    - Amount: $500K
    - Approval Authority: "Requires Executive AND CFO approval"
    - Current Status: "Pending Executive approval (1 of 2)"
16. Review request details:
    - Description: "Enterprise-wide fleet modernization program"
    - ROI Analysis: "Payback 3.8 years, NPV +$1.2M, IRR 22%"
    - Budget Impact: "Exceeds single-year budget - multi-year funding"
17. Click "Approve" button
18. System shows approval note:
    - "Approved by Executive. Pending CFO approval (1 of 2)"
    - CFO receives notification of pending approval
19. Simulate CFO logging in and approving
20. Verify final approval triggers:
    - Status changes to APPROVED (2 of 2)
    - Request automatically moves to procurement
    - All stakeholders notified
21. Return to approval queue
22. Click on CAP-001 ($45K)
23. Verify auto-approved request shows:
    - Status: AUTO-APPROVED
    - Reason: "Below $50K threshold - auto-approved"
    - Auto-approval timestamp: Previous day/time
    - Approved by: "System (Automatic)"
24. Test rejection workflow:
    - Create test request CAP-004: $80K
    - Click Reject button
    - Enter rejection reason: "Insufficient budget for current fiscal year"
    - Click Confirm Rejection
25. Verify rejection processed:
    - Status changes to REJECTED
    - Fleet Manager notified with rejection reason
    - Request can be resubmitted
26. Verify "Historical Approvals" view shows:
    - Past approved requests
    - Past rejected requests
    - Approval decision details and timestamps

#### Expected Results:
- Capital requests display in approval queue with status
- Request details include ROI analysis and justification
- Approval workflow routes based on dollar thresholds
- <$50K auto-approved without executive action
- >$50K requires executive approval
- >$500K requires multi-level approval
- Approvals recorded with timestamp and user
- Notifications sent to stakeholders
- Approved requests move to procurement
- Rejected requests returned for revision
- Approval history accessible

#### Acceptance Criteria:
- AC1: Approval queue displays pending requests
- AC2: Request details complete and accurate
- AC3: Auto-approval works for <$50K requests
- AC4: Executive approval required for >$50K
- AC5: Multi-level approval works for >$500K
- AC6: Approvals timestamped and logged
- AC7: Notifications sent correctly
- AC8: Approved requests move to procurement

#### Test Data:
Capital Requests:
- CAP-001: $45K (Auto-approve) - Maintenance equipment
- CAP-002: $150K (Executive approval) - Vehicle acquisition
- CAP-003: $500K (Executive + CFO) - Fleet modernization
- CAP-004: $80K (Executive approval for rejection test)

Approval Thresholds:
- <$50K: Auto-approved
- $50K-$250K: Executive approval
- >$250K: Executive + CFO approval

---

### TC-EX-018: Budget Adjustment Request Approval

**Test Case ID**: TC-EX-018
**Test Case Name**: Budget Adjustment Request Approval
**Related User Story**: US-EX-008 (Budget Variance Analysis)
**Related Use Case**: UC-EX-004 (Approve Budget Adjustments)
**Priority**: High
**Test Type**: Functional / Workflow
**Test Author**: QA Team
**Created Date**: November 10, 2025

#### Preconditions:
- Executive user is logged into system with approval authority
- Budget variance dashboard shows significant variances (>10%)
- Fleet Manager has submitted budget adjustment requests:
  - Request 1: Increase Fuel budget by $50K (variance: +$20K actual, +10%)
  - Request 2: Decrease Maintenance budget by $25K (variance: -$25K actual, -5%)
- Adjustment justifications provided by Fleet Manager
- Current budget allocations available in system

#### Test Steps:
1. Navigate to "Budget Analysis" dashboard
2. Identify budget variance requiring adjustment
3. Locate "Fuel" category showing +$20K variance (+2%)
4. Click on "Request Budget Adjustment" button
5. Verify adjustment request form opens showing:
   - Budget Category: Fuel
   - Current YTD Budget: $1.0M
   - Current YTD Actual: $1.02M
   - Variance: +$20K (+2%)
   - Requested Adjustment: [input field]
   - Justification: [text field]
6. Examine Fleet Manager's justification for variance:
   - "Unexpected spike in fuel prices during Q3"
   - "Regional fuel prices increased 8-12% above forecast"
   - "Expected to moderate in Q4"
7. Enter adjustment amount: "+$50K" (new budget: $1.05M)
8. Enter approval reason: "Market-based fuel price increase - temporary"
9. Click "Review & Submit"
10. Verify adjustment summary displayed:
    - New Budget: $1.05M
    - New Variance: +$20K to -$30K (projected with adjustment)
    - Impact on Total Fleet Budget: +$50K
    - Remaining Available Budget: [calculated]
11. Click "Submit for Approval"
12. Verify confirmation:
    - Adjustment submitted for review
    - Finance Director will review
    - Notification sent to Finance Director
13. Simulate Finance Director login and review
14. Navigate to "Pending Budget Adjustments"
15. Verify adjustment request displayed:
    - Requesting Manager: Fleet Manager
    - Category: Fuel
    - Adjustment Amount: +$50K
    - Justification: Visible with Fleet Manager notes
    - Current YTD Variance: +$20K
16. Click "Approve Adjustment"
17. Verify approval process:
    - Status changes to APPROVED
    - New budget becomes effective immediately
    - Dashboard metrics update with new budget
    - Notifications sent to all stakeholders
18. Return to variance dashboard
19. Verify fuel variance display updates:
    - Budget now shows $1.05M (adjusted)
    - Variance now shows -$30K (improvement with adjusted budget)
    - Status changes to GREEN (variance within acceptable range)
20. Test rejection of adjustment request
21. Create second adjustment: Increase Fuel budget by $100K
22. Finance Director reviews and clicks "Request More Information"
23. Verify info request process:
    - Status changes to "INFO REQUESTED"
    - Fleet Manager notified
    - Request enters clarification loop
24. Simulate Fleet Manager providing additional information:
    - "Q4 fuel prices expected to decline 3-5%"
    - "Recommend temporary adjustment of +$50K only"
25. Finance Director reviews additional info
26. Click "Reject Adjustment"
27. Verify rejection process:
    - Status changes to REJECTED
    - Reason recorded: "Q4 price moderation expected - adjustment not warranted"
    - Fleet Manager notified with feedback
28. Return to variance dashboard
29. Verify rejected adjustment has not been applied
30. Verify "Budget Adjustment History" shows:
    - Approved adjustments with effective dates
    - Rejected adjustments with reasons
    - Pending adjustments under review

#### Expected Results:
- Budget adjustments can be requested for variances
- Adjustment justifications are visible and reviewable
- Approval workflow routes to Finance Director
- Adjustments can be approved, rejected, or require more info
- Approved adjustments become effective immediately
- Dashboard metrics update with adjusted budgets
- Adjustment history maintained
- Notifications sent to stakeholders
- Audit trail captured for all decisions

#### Acceptance Criteria:
- AC1: Budget adjustment request form accessible
- AC2: Justifications provided by Fleet Manager visible
- AC3: Adjustment calculation displayed
- AC4: Approval workflow routes to Finance Director
- AC5: Approvals/rejections processed correctly
- AC6: Dashboard updates with approved adjustments
- AC7: Adjustment history maintained
- AC8: Stakeholders notified of decisions

#### Test Data:
Fuel Budget Adjustment:
- Current Budget: $1.0M
- Current Actual: $1.02M
- Variance: +$20K (+2%)
- Requested Adjustment: +$50K
- New Budget: $1.05M
- New Projected Variance: -$30K

Maintenance Budget Adjustment (Test):
- Current Budget: $500K
- Current Actual: $475K
- Variance: -$25K (-5%)
- Requested Adjustment: -$25K
- New Budget: $475K

---

### TC-EX-019: ROI Analysis and Reporting

**Test Case ID**: TC-EX-019
**Test Case Name**: ROI Analysis and Reporting
**Related User Story**: US-EX-004 (Fleet Investment ROI Analysis)
**Related Use Case**: UC-EX-006 (Analyze Investment ROI)
**Priority**: High
**Test Type**: Functional / Analytics
**Test Author**: QA Team
**Created Date**: November 10, 2025

#### Preconditions:
- Executive user is logged into system
- ROI Analysis dashboard is accessible
- Test capital investments tracked in system:
  - Investment 1: EV Fleet Transition ($2M) - In Progress
  - Investment 2: Telematics System ($500K) - Completed
  - Investment 3: Maintenance Optimization Program ($300K) - Completed
- Actual cost savings data available for completed investments
- ROI calculations operational (NPV, IRR, payback period)

#### Test Steps:
1. Navigate to "ROI Analysis" dashboard
2. Verify dashboard displays investment portfolio:
   - Shows all active and completed investments
   - Displays investment name, amount, type, status
3. Observe investment summary:
   - Total Invested (YTD): $2.8M
   - Total ROI Achieved: $400K
   - Average Payback Period: 3.2 years
4. Examine detailed investment metrics:
   - Investment 2 (Telematics): $500K invested, $200K savings achieved, Payback: 2.5 years, ROI: 40%
   - Investment 3 (Maintenance): $300K invested, $200K savings achieved, Payback: 1.5 years, ROI: 67%
5. Click on "Telematics System" investment
6. Verify investment details displayed:
   - Investment Description: "Fleet Telematics and Monitoring System"
   - Amount Invested: $500K
   - Investment Date: 2024-01-15
   - Status: COMPLETED
   - Projected Payback Period: 3.0 years
   - Actual Payback Period: 2.5 years (better than projected)
7. Verify ROI metrics:
   - Projected Annual Savings: $180K
   - Actual Annual Savings: $200K (exceeded projection)
   - Year 1 Savings: $200K
   - Year 2 Savings: $200K (projected)
   - Net Present Value (NPV): +$280K
   - Internal Rate of Return (IRR): 18%
   - Return on Investment: 40%
8. Verify cost breakdown:
   - Hardware/Equipment: $300K
   - Software Licenses (annual): $50K
   - Implementation: $100K
   - Training: $50K
   - Total: $500K
9. Verify savings breakdown:
   - Fuel efficiency improvement: $80K/year
   - Reduced idle time: $45K/year
   - Improved routing: $50K/year
   - Safety improvement: $25K/year
   - Total: $200K/year
10. Click "Sensitivity Analysis" for Telematics investment
11. Verify sensitivity scenarios:
    - Best Case (fuel prices +10%): ROI 45%, NPV +$320K
    - Base Case (current): ROI 40%, NPV +$280K
    - Worst Case (fuel prices -10%): ROI 35%, NPV +$240K
12. Close sensitivity analysis and return to investment list
13. Click on "EV Fleet Transition" (in-progress investment)
14. Verify in-progress investment details:
    - Status: IN PROGRESS (26% complete)
    - Amount Invested to Date: $520K (of $2M total)
    - Projected Completion: Q4 2025
    - Vehicles Replaced to Date: 75 (of 285 total)
15. Verify projected ROI for in-progress investment:
    - Projected Payback Period: 4.2 years
    - Projected Annual Savings (at full deployment): $420K
    - Projected NPV: +$1.2M
    - Projected IRR: 16%
16. Verify current ROI trajectory:
    - Current savings: $105K (based on 75 deployed vehicles)
    - On track for projected payback period: YES
    - Green indicator showing positive trajectory
17. Click "Compare Investments" button
18. Verify comparison view displays:
    - Telematics vs. Maintenance vs. EV Transition (side-by-side)
    - Payback periods compared
    - NPV compared
    - IRR compared
    - Annual savings compared
19. Verify comparison analysis:
    - Maintenance program: Fastest payback (1.5 years), moderate ROI (67%)
    - Telematics: Moderate payback (2.5 years), good ROI (40%)
    - EV Transition: Longest payback (4.2 years), strategic ROI (16% but high NPV)
20. Click "Generate ROI Report"
21. Verify report generation options:
    - Report Type: Executive Summary / Detailed Analysis / Sensitivity Analysis
    - Time Period: Current / Year-to-date / Historical
    - Investment Selection: All / Selected investments
22. Select "Executive Summary" with "All Investments"
23. Click "Generate"
24. Verify report includes:
    - Investment portfolio overview
    - Completed vs. in-progress breakdown
    - Total ROI achieved
    - Key metrics summary
    - Charts showing payback periods and NPV
    - Comparison to targets
25. Export report as PDF
26. Verify PDF contains professional formatting and visualizations

#### Expected Results:
- ROI dashboard displays all investments with key metrics
- Completed investments show actual results vs. projected
- In-progress investments show current trajectory vs. projections
- ROI calculations accurate (NPV, IRR, payback period)
- Sensitivity analysis shows scenario outcomes
- Comparison view shows relative performance
- Reports generate with professional formatting
- Trend data shows ROI achievement over time

#### Acceptance Criteria:
- AC1: All investments display with complete metrics
- AC2: ROI calculations mathematically accurate
- AC3: Actual vs. projected comparisons available
- AC4: In-progress ROI trajectory tracked
- AC5: Sensitivity analysis shows scenarios
- AC6: Comparison view functional
- AC7: Reports generate within 60 seconds
- AC8: PDF export professional quality

#### Test Data:
Investment 1 - Telematics System:
- Amount: $500K
- Status: COMPLETED
- Actual Payback: 2.5 years
- Actual ROI: 40%
- Actual NPV: +$280K
- Actual Savings: $200K/year

Investment 2 - Maintenance Program:
- Amount: $300K
- Status: COMPLETED
- Actual Payback: 1.5 years
- Actual ROI: 67%
- Actual NPV: +$230K
- Actual Savings: $200K/year

Investment 3 - EV Transition:
- Amount: $2.0M
- Status: IN PROGRESS (26% complete)
- Invested to Date: $520K
- Projected Payback: 4.2 years
- Projected ROI: 16%
- Projected NPV: +$1.2M
- Projected Annual Savings: $420K (at full deployment)

---

### TC-EX-020: Financial Report Export

**Test Case ID**: TC-EX-020
**Test Case Name**: Financial Report Export
**Related User Story**: US-EX-006 (Monthly Executive Summary Report)
**Related Use Case**: UC-EX-008 (Generate Financial Reports)
**Priority**: High
**Test Type**: Functional / Export
**Test Author**: QA Team
**Created Date**: November 10, 2025

#### Preconditions:
- Executive user is logged into system
- Budget variance dashboard is displayed with current data
- ROI analysis dashboard is displayed
- Report generation service is operational
- Multiple export formats supported (PDF, Excel, PowerPoint)
- Current month's financial data complete

#### Test Steps:
1. Navigate to "Budget Analysis" dashboard
2. Locate "Generate Financial Report" button
3. Click button to open report generation wizard
4. Verify wizard shows report type options:
   - Budget Variance Report
   - Capital Investment ROI Report
   - Monthly Financial Summary
   - Quarterly Financial Review
   - Custom Report Builder
5. Select "Monthly Financial Summary"
6. Verify wizard advances to date selection:
   - Select Month: November 2025
   - Report Type: YTD Summary with Monthly Detail
7. Select "All Categories" for budget reporting
8. Verify available visualizations to include:
   - Budget vs. Actual chart
   - Variance trend chart
   - Investment ROI summary
   - Savings achievement chart
9. Click "Select All" visualizations
10. Advance to export format selection
11. Verify export options:
    - PDF (professional presentation)
    - Excel (detailed data)
    - PowerPoint (executive presentation)
    - CSV (data import)
12. Select PDF export format
13. Click "Generate Report"
14. Verify report generation starts:
    - Progress indicator shows generation status
    - Estimated completion time displayed
15. Wait for report generation to complete (target <60 seconds)
16. Verify download starts automatically
17. Open generated PDF report
18. Verify PDF content includes:
    - Title: "Monthly Financial Summary - November 2025"
    - Executive Summary section
    - Budget variance analysis with charts
    - Category breakdown (Fuel, Maintenance, Capital, Insurance)
    - ROI analysis section
    - Trend analysis comparing to prior months
    - Recommendations section
    - Report date and data currency timestamp
19. Verify charts render properly in PDF:
    - Budget vs. actual bar charts
    - Variance trend line chart
    - Pie charts for budget allocation
    - All data labels readable
20. Return to application
21. Generate another report in Excel format
22. Verify Excel download starts
23. Open Excel file
24. Verify Excel workbook contains:
    - Sheet 1: Summary (high-level metrics)
    - Sheet 2: Budget Detail (category breakdown)
    - Sheet 3: Variance Analysis (detailed calculations)
    - Sheet 4: ROI Summary (investment metrics)
25. Verify Excel formatting:
    - Headers bold and colored
    - Numbers formatted with appropriate decimals
    - Currency formatted correctly
    - Thousands separators applied
26. Verify Excel includes formulas:
    - Variance = Budget - Actual
    - Percentage = Variance / Budget × 100
    - Monthly projections based on YTD trend
27. Return to application
28. Generate PowerPoint export
29. Verify PowerPoint download starts
30. Open PowerPoint presentation
31. Verify PowerPoint contains:
    - Title slide: "November 2025 Financial Summary"
    - Executive summary slide
    - Budget vs. actual slide with chart
    - Category breakdown slide
    - ROI achievement slide
    - Variance analysis slide
    - Trend comparison slide
    - Recommendations slide
32. Verify PowerPoint includes:
    - Company branding
    - Professional design
    - All charts properly embedded
    - Speaker notes for key slides

#### Expected Results:
- Report generation wizard guides through configuration
- Multiple export formats available
- PDF reports are professionally formatted
- Excel reports contain detailed data and formulas
- PowerPoint presentations ready for boardroom
- All exports contain accurate data
- Exports complete within 60 seconds
- File naming includes date stamp
- No sensitive PII in exported reports

#### Acceptance Criteria:
- AC1: Report wizard functional with all options
- AC2: PDF exports professional quality
- AC3: Excel exports include formulas and formatting
- AC4: PowerPoint exports presentation-ready
- AC5: All exports accurate and current
- AC6: Exports complete within 60 seconds
- AC7: Filenames include date stamp
- AC8: All formats available and working

#### Test Data:
- Report Month: November 2025
- Report Type: Monthly Financial Summary
- Budget Category: All Categories
- Data Currency: Current (Nov 10, 2025)
- Visualizations: Budget vs. Actual, Variance Trend, ROI, Savings
- Export Formats: PDF, Excel, PowerPoint

---

## Strategic Reporting and Forecasting

### TC-EX-021: Monthly Executive Summary Report Generation

**Test Case ID**: TC-EX-021
**Test Case Name**: Monthly Executive Summary Report Generation
**Related User Story**: US-EX-006 (Monthly Executive Summary Report)
**Related Use Case**: UC-EX-008 (Generate Executive Summary)
**Priority**: High
**Test Type**: Functional / Report Generation
**Test Author**: QA Team
**Created Date**: November 10, 2025

#### Preconditions:
- Executive user is logged into system
- Report generation service is operational
- KPI metrics are current and complete for reporting month
- Current date is within first 5 days of new month (for auto-generation test)
- Previous month data complete in database
- Trend analysis data available for YTD and prior year comparisons

#### Test Steps:
1. Navigate to "Reporting" → "Executive Summary Reports"
2. Verify report library shows available reports
3. Observe auto-generated draft report for current month:
   - "November 2025 Executive Summary" (draft status)
   - Auto-generated on Nov 1, 2025
   - Status: DRAFT (awaiting executive review and narrative)
4. Click on draft report to review
5. Verify report structure includes:
   - Executive Summary (auto-generated narrative)
   - Key Metrics Dashboard
   - Trends Analysis
   - Major Incidents Summary
   - Financial Performance
   - Strategic Initiatives Status
   - Recommendations
6. Review Executive Summary section:
   - System-generated narrative highlighting key findings:
     - "Fleet utilization at 87%, up 2% from October"
     - "Cost per mile improved 3% vs. prior month"
     - "Safety incidents decreased year-over-year"
   - Space for executive comments/customization
7. Click on "Key Metrics Dashboard" section
8. Verify metrics displayed with:
   - Current month values
   - Prior month comparison
   - Year-over-year comparison
   - Trend indicators
9. Review "Trends Analysis" section:
   - Cost per mile trending downward (3-month trend)
   - Utilization stable above target
   - Safety score stable
10. Review "Major Incidents" summary:
    - Significant accidents or operational issues
    - Impact assessment
    - Response actions taken
11. Review "Financial Performance":
    - Budget vs. actual by category
    - Key variances identified
    - Variance explanations from Fleet Manager
12. Review "Strategic Initiatives":
    - EV Fleet Transition: 26% complete, on track
    - Telematics Implementation: ROI tracking well
    - Driver Training Program: 95% completion rate
13. Click "Customize Report" to edit executive narrative
14. Verify editor opens for Executive Summary section
15. Add custom commentary:
    - "Excellent safety performance this month with zero major incidents"
    - "Fleet acquisition plan on track for Q4 deployment"
    - "Recommend focus on LA location improvement initiatives"
16. Save executive commentary
17. Verify report updates with custom narrative
18. Click "Add Attachment" to add supplementary documents
19. Verify ability to attach:
    - Budget variance explanations from Finance
    - Driver safety training completion certificates
    - Maintenance completion reports
20. Select existing file and attach to report
21. Click "Review & Finalize"
22. Verify finalization screen shows:
    - Report complete with all sections
    - Charts and visualizations rendered
    - Executive commentary added
    - All data current and accurate
23. Click "Finalize Report"
24. Verify report status changes from DRAFT to FINAL
25. Verify finalized report shows:
    - Finalization date/time
    - Finalized by: (logged-in executive name)
    - Report version (e.g., v1.0)
26. Click "Generate PDF for Board Presentation"
27. Verify professional PDF generates:
    - Executive Summary page
    - Key metrics with charts
    - Trend analysis with visualizations
    - Financial performance analysis
    - Strategic initiatives status
    - Recommendations
    - Professional formatting and branding
    - Report date and executive sign-off
28. Download PDF
29. Open PDF to verify quality
30. Click "Share Report"
31. Verify sharing options:
    - Share with specific board members
    - Share with executive team
    - Share with Finance Director
    - Download link generation
32. Select "Share with Board Members"
33. Verify email notifications sent to recipients
34. Navigate to "Report Archive"
35. Verify previous month reports available:
    - October 2025 Executive Summary (final)
    - September 2025 Executive Summary (final)
    - Ability to compare reports month-over-month

#### Expected Results:
- Monthly report auto-generates by first day of month
- Draft report displays system-generated narrative
- Executive can customize and enhance narrative
- Report includes all required sections
- Finalization workflow functional
- PDF export professional quality
- Report sharing available
- Previous reports archived and accessible
- Report generation completes within 120 seconds

#### Acceptance Criteria:
- AC1: Report auto-generates by month 1st
- AC2: All required sections included
- AC3: System-generated narrative accurate
- AC4: Executive customization functional
- AC5: Finalization workflow operational
- AC6: PDF export professional quality
- AC7: Report sharing functional
- AC8: Archive contains previous reports

#### Test Data:
- Report Month: November 2025
- Report Status: Auto-generated as DRAFT on Nov 1
- Executive: VP of Operations
- Sections: 6 main sections with subsections
- Finalization Date: Nov 10, 2025
- Distribution: Board members, Finance Director

---

### TC-EX-022: Board Presentation Builder

**Test Case ID**: TC-EX-022
**Test Case Name**: Board Presentation Builder
**Related User Story**: US-EX-007 (Board Presentation Builder)
**Related Use Case**: UC-EX-009 (Create Board Presentation)
**Priority**: Medium
**Test Type**: Functional / Presentation Generation
**Test Author**: QA Team
**Created Date**: November 10, 2025

#### Preconditions:
- Executive user is logged into system
- Presentation builder interface is accessible
- Slide template library available with pre-built slides
- Dashboard data and visualizations current
- PowerPoint export functionality operational

#### Test Steps:
1. Navigate to "Reporting" → "Presentation Builder"
2. Verify builder interface displays:
   - Slide library on left panel
   - Main editing canvas in center
   - Slide preview on right panel
3. Click "Create New Presentation"
4. Verify blank presentation created with:
   - Title slide (editable)
   - Slide counter showing "1 of 1"
5. Edit title slide:
   - Title: "November 2025 Fleet Operations Review"
   - Subtitle: "Board of Directors Briefing"
   - Date: "November 10, 2025"
6. Click "Next Slide" or use "+" button to add new slide
7. Select from slide library:
   - "KPI Summary Slide" template
8. Verify template loads with placeholder content:
   - Title: "Key Performance Indicators"
   - Placeholders for 6 KPI metrics
9. Customize KPI slide:
   - Drag-and-drop KPI metrics from dashboard:
     - Fleet Utilization Rate
     - Cost Per Mile
     - On-Time Delivery Rate
     - Safety Score
     - Incident Rate
     - DOT Compliance
10. Verify KPI values auto-populate from current data
11. Verify metrics display with trend indicators
12. Verify color-coding (GREEN/YELLOW/RED) applied
13. Add next slide - "Location Performance Comparison"
14. Drag-and-drop locations to include:
    - Boston Hub (top performer)
    - LA Distribution (underperformer)
    - Chicago Hub (average)
15. Select visualization: "Comparison Bar Chart"
16. Verify chart displays location metrics side-by-side
17. Add next slide - "Financial Performance"
18. Select template: "Budget vs. Actual Slide"
19. Customize with current month data:
    - Budget allocation by category
    - Actual spending by category
    - Variance analysis
20. Verify chart displays budget vs. actual
21. Add next slide - "ROI Achievement"
22. Select template: "Investment Performance Slide"
23. Customize with active investments:
    - Telematics System (completed)
    - EV Transition (in progress)
    - Maintenance Program (completed)
24. Add visualization: "ROI Comparison Chart"
25. Verify chart shows payback periods and NPV
26. Add next slide - "Strategic Initiatives"
27. Select template: "Project Status Slide"
28. Customize with initiatives:
    - EV Fleet Transition: 26% complete, on track
    - Telematics System: 100% complete, ROI positive
    - Driver Training Program: 95% complete
29. Use drag-and-drop to arrange initiatives
30. Add next slide - "Key Findings and Recommendations"
31. Select template: "Text + Bullet Points Slide"
32. Add bullet points:
    - "Fleet safety and efficiency metrics exceeding targets"
    - "Budget performance favorable with cost reductions in maintenance"
    - "Strategic investments delivering positive ROI"
    - "Recommend accelerated EV transition investment"
33. Add final slide - "Questions?"
34. Select template: "Closing Slide"
35. Click "Save Presentation"
36. Verify save options:
    - Save as Draft
    - Save as Template (for future use)
37. Save as Draft: "Board_Briefing_Nov2025"
38. Verify presentation saved and accessible
39. Click "Preview Presentation"
40. Verify full presentation preview:
    - All slides displayed in order
    - All data and visualizations correct
    - Professional formatting maintained
    - No placeholder text visible
41. Click "Export to PowerPoint"
42. Verify PowerPoint export dialog:
    - Filename: "Board_Briefing_Nov2025.pptx"
    - Format: PowerPoint (.pptx)
43. Click "Export"
44. Verify PowerPoint file downloads
45. Open PowerPoint presentation
46. Verify all slides present:
    - Title slide with formatted text
    - KPI slide with metrics and trend indicators
    - Location comparison with chart
    - Financial performance with budget visualization
    - ROI achievement with investment metrics
    - Strategic initiatives with status
    - Key findings with recommendations
    - Closing slide
47. Verify professional formatting:
    - Consistent branding and colors
    - Readable fonts and sizing
    - Charts properly embedded with labels
    - Data current and accurate
48. Verify speaker notes available:
    - Click on notes section
    - Verify system-generated speaker notes for each slide:
      - Key talking points
      - Supporting data
      - Recommended narrative
49. Return to Presentation Builder
50. Click "Load Saved Template"
51. Verify ability to load previously saved templates
52. Verify template dropdown shows:
    - "Board_Briefing_Nov2025" (custom)
    - Pre-built templates (Standard Board Briefing, etc.)

#### Expected Results:
- Presentation builder interface intuitive and functional
- Slide templates available and customizable
- Dashboard data integrates seamlessly into slides
- Drag-and-drop functionality works smoothly
- Charts and visualizations display correctly
- PowerPoint export professional quality
- Speaker notes generated automatically
- Presentations can be saved and reused
- Multiple presentation scenarios supported

#### Acceptance Criteria:
- AC1: Drag-and-drop slide creation functional
- AC2: Dashboard data integrates into slides
- AC3: Slide templates customizable
- AC4: Charts render correctly
- AC5: PowerPoint export professional quality
- AC6: Speaker notes auto-generated
- AC7: Presentations saveable and reloadable
- AC8: Professional branding maintained

#### Test Data:
- Presentation Title: "November 2025 Fleet Operations Review"
- Audience: Board of Directors
- Date: November 10, 2025
- Slides: 8 total (title, KPI, location comparison, financial, ROI, initiatives, findings, closing)
- Metrics Included: All primary KPIs + location performance + financial data + ROI

---

### TC-EX-023: Long-Term Fleet Forecast (3-5 Years)

**Test Case ID**: TC-EX-023
**Test Case Name**: Long-Term Fleet Forecast (3-5 Years)
**Related User Story**: US-EX-005 (Long-Term Fleet Forecast)
**Related Use Case**: UC-EX-007 (View Long-Term Forecast)
**Priority**: Medium
**Test Type**: Functional / Forecasting
**Test Author**: QA Team
**Created Date**: November 10, 2025

#### Preconditions:
- Executive user is logged into system
- Forecasting dashboard is accessible
- Historical trend data available (3+ years)
- Forecasting algorithm operational (time series analysis)
- Business growth plans and strategic initiatives configured

#### Test Steps:
1. Navigate to "Strategic Planning" → "Long-Term Forecasting"
2. Verify forecasting dashboard displays:
   - Forecast Period: 3-5 years (2026-2030)
   - Forecast Date: Based on current data (Nov 2025)
   - Confidence Level: Medium (±15%)
3. Observe forecast summary metrics:
   - Projected Fleet Size (2030): 325 vehicles (14% growth)
   - Projected Total Fleet Cost (2030): $4.2M/year (18% growth)
   - Projected EV Penetration (2030): 85%
   - Projected Emissions Reduction: 60% from 2025 baseline
4. Click on "Fleet Size Forecast"
5. Verify chart displays:
   - Historical fleet size 2022-2025 (actual)
   - Projected fleet size 2026-2030 (forecast line)
   - Growth trend showing 14% CAGR
   - Confidence interval showing ±10-15% variance
6. Review forecast assumptions shown:
   - Annual Growth Rate: 3% (based on business plans)
   - Vehicle Replacement Cycle: 8 years
   - EV Adoption Rate: 15% annually
   - Retirement Rate: 12% annually (vehicles reaching end of life)
7. Click on "Total Cost Forecast"
8. Verify cost forecast breakdown:
   - Capital Costs: Rising due to EV transition
   - Fuel Costs: Declining due to EV adoption
   - Maintenance Costs: Increasing (aging fleet + new tech)
   - Insurance Costs: Slightly increasing
   - Total Fleet Cost growing from $3.6M (2025) to $4.2M (2030)
9. Click "View by Scenario"
10. Verify scenario selector shows:
    - Conservative (2% growth, 10% EV adoption)
    - Moderate (3% growth, 15% EV adoption) - BASE CASE
    - Aggressive (4% growth, 20% EV adoption)
11. Select "Conservative Scenario"
12. Verify forecast adjusts:
    - Fleet Size 2030: 310 vehicles (9% growth)
    - Total Cost 2030: $3.9M (14% growth)
    - EV Penetration 2030: 65%
13. Select "Aggressive Scenario"
14. Verify forecast adjusts:
    - Fleet Size 2030: 340 vehicles (19% growth)
    - Total Cost 2030: $4.5M (25% growth)
    - EV Penetration 2030: 95%
15. Return to "Moderate Scenario" (base case)
16. Click "Adjust Assumptions"
17. Verify adjustable parameters:
    - Annual Growth Rate: [slider 0-5%]
    - EV Adoption Rate: [slider 0-20% annually]
    - Inflation Rate: [input 0-5%]
    - Fuel Price Growth: [input ±10%]
18. Adjust Annual Growth Rate to 4%
19. Verify forecast recalculates in real-time:
    - Fleet Size 2030 updates to ~335 vehicles
    - Total Cost 2030 updates to $4.35M
    - Chart animates to show new trajectory
20. Adjust Inflation Rate to 3%
21. Verify cost forecast increases slightly due to inflation impact
22. Adjust EV Adoption Rate to 20%
23. Verify fuel cost projections decrease significantly
24. Click "Reset to Base Case"
25. Verify parameters return to default moderate assumptions
26. Click "Capital Requirements"
27. Verify capital needs forecast displays:
    - Year 2026: $450K (10 new vehicles)
    - Year 2027: $480K (12 new vehicles, EV transition)
    - Year 2028: $520K (15 new vehicles, EV transition)
    - Year 2029: $550K (18 new vehicles, EV transition)
    - Year 2030: $580K (20 new vehicles, EV transition)
28. Observe capital requirement trend showing increased investment for EV transition
29. Click "Incorporate Initiatives"
30. Verify ability to include planned initiatives:
    - EV Transition Program: $2.0M total investment, 2026-2030
    - Telematics Expansion: $200K total investment
    - Driver Training Program: $150K/year ongoing
31. Add EV Transition initiative to forecast
32. Verify capital requirements increase to account for initiative:
    - Year 2026: $650K (new vehicles + EV investment)
    - Year 2027: $700K
    - Year 2028: $750K
    - Year 2029: $800K
    - Year 2030: $850K
33. Click "Show Confidence Intervals"
34. Verify forecast displays uncertainty bands:
    - Best case scenario (green optimistic band)
    - Base case (line in middle)
    - Worst case scenario (red pessimistic band)
    - Confidence level: 80% (forecast within bands)
35. Click "Generate Forecast Report"
36. Verify report generation wizard:
    - Scenario selection (all 3 or custom)
    - Include sensitivity analysis
    - Include assumptions documentation
37. Select all scenarios and include sensitivity analysis
38. Click "Generate Report"
39. Verify comprehensive forecast report generated:
    - Executive summary of forecast
    - Detailed forecasts by metric (fleet size, cost, EV adoption)
    - Scenario comparisons
    - Sensitivity analysis showing impact of key assumptions
    - Capital requirements timeline
    - Narrative explaining forecast methodology and drivers
40. Export report as PDF
41. Verify PDF contains professional visualizations:
    - Forecast trend charts
    - Scenario comparison charts
    - Sensitivity tornado chart (showing assumption impact)
    - Capital requirements bar chart
    - Narrative explanation

#### Expected Results:
- Long-term forecast displays 3-5 year projections
- Multiple scenarios available (conservative, moderate, aggressive)
- Assumptions can be adjusted for custom forecasts
- Real-time recalculation as assumptions change
- Confidence intervals show uncertainty
- Capital requirements projected
- Initiatives can be incorporated
- Reports generate with professional formatting
- All forecasts backed by clear assumptions

#### Acceptance Criteria:
- AC1: Forecast displays 3-5 year projections
- AC2: Multiple scenarios available
- AC3: Assumptions adjustable with real-time recalc
- AC4: Confidence intervals displayed
- AC5: Capital requirements projected
- AC6: Initiatives can be incorporated
- AC7: Reports generate professionally
- AC8: Methodology transparent and documented

#### Test Data:
- Forecast Period: 2026-2030
- Base Case Assumptions:
  - Annual Growth: 3%
  - EV Adoption: 15%/year
  - Inflation: 2%
  - Fuel Price Growth: 1%/year
- Projected 2030 Metrics (Moderate):
  - Fleet Size: 325 vehicles (14% growth)
  - Total Cost: $4.2M (18% growth)
  - EV Penetration: 85%
  - Emissions Reduction: 60%

---

### TC-EX-024: Sustainability and ESG Metrics Dashboard

**Test Case ID**: TC-EX-024
**Test Case Name**: Sustainability and ESG Metrics Dashboard
**Related User Story**: US-EX-011 (Sustainability and ESG Metrics)
**Related Use Case**: UC-EX-010 (Track Sustainability Metrics)
**Priority**: Medium
**Test Type**: Functional / Analytics
**Test Author**: QA Team
**Created Date**: November 10, 2025

#### Preconditions:
- Executive user is logged into system
- Sustainability dashboard is accessible
- Emissions calculation engine operational (EPA factors)
- Fleet composition data complete (fuel types, ages)
- Sustainability targets configured (e.g., 25% reduction by 2030)
- ESG reporting framework compliance enabled

#### Test Steps:
1. Navigate to "Sustainability" → "ESG Metrics Dashboard"
2. Verify dashboard displays environmental KPIs:
   - Total Fleet Emissions (CO2): 8,500 metric tons/year
   - Emissions Trend: -5% vs. prior year (POSITIVE)
   - Status: On track toward 2030 target
3. Observe emissions breakdown:
   - Diesel vehicles: 6,200 metric tons CO2 (73%)
   - Gasoline vehicles: 1,800 metric tons CO2 (21%)
   - EV vehicles: 500 metric tons CO2 equivalent (6%)
4. Click on "Emissions by Vehicle Type"
5. Verify detailed emissions display:
   - Class 8 Trucks: 4,500 metric tons (53%)
   - Class 6-7 Trucks: 2,100 metric tons (25%)
   - Vans: 1,200 metric tons (14%)
   - Light Duty: 700 metric tons (8%)
6. Observe emissions calculation methodology:
   - Fuel consumption × EPA emission factors
   - Example: 165K gallons diesel × 22.4 lbs CO2/gallon ÷ 2,000 = 1,848 metric tons
7. Click on "Emissions Reduction Progress"
8. Verify progress toward sustainability target:
   - 2030 Target: 25% reduction from 2025 baseline
   - Current Reduction: 5% (from 2025 to current)
   - Remaining to Target: 20% (over 5 years)
9. Review emissions reduction initiatives and their impact:
   - EV Transition: Projected 15% reduction
   - Route Optimization: Projected 3% reduction
   - Idle Time Reduction: Projected 2% reduction
   - Vehicle Age Management: Projected 5% reduction
10. Click on "EV Adoption Rate"
11. Verify EV metrics displayed:
    - Total EV Vehicles: 75 (26% of fleet)
    - Additional EV Vehicles Deployed (YTD): 20
    - On-Track for 2030 Target: 85% EV penetration
    - EV Adoption Rate: 15% annually (on target)
12. Observe EV contribution to emissions reduction:
    - EV vehicles eliminating ~500 tons CO2/year
    - Projected impact at 85% EV penetration: ~6,000 ton reduction
13. Click on "Fuel Efficiency Metrics"
14. Verify fuel efficiency data:
    - Average Fleet MPG: 8.2 miles/gallon
    - Target Fleet MPG: 8.5 miles/gallon
    - Efficiency Trend: +0.3 MPG improvement YoY
15. Observe efficiency by vehicle class:
    - Class 8 Trucks: 6.8 MPG (target 7.0)
    - Class 6-7 Trucks: 7.5 MPG (target 7.8)
    - Vans: 11.2 MPG (target 11.5)
    - Light Duty: 18.5 MPG (target 19.0)
16. Click on "Idle Time Analysis"
17. Verify idle time metrics:
    - Fleet Average Idle Time: 8.2% of operating time
    - Target: <7% idle time
    - Improvement Initiatives: Smart idle reduction technology
    - Potential Savings: 2% additional fuel efficiency
18. Click on "Renewable Energy Usage"
19. Verify renewable energy integration:
    - EV Charging from Renewable: 35% of total EV charging
    - Renewable Energy Source: Solar + Wind (regional partnerships)
    - Potential Growth: 50% renewable by 2027
20. Click on "Carbon Offset Programs"
21. Verify carbon offset tracking:
    - Purchased Carbon Offsets (YTD): 500 metric tons CO2 equivalent
    - Offset Cost: $5,000 (at $10/ton)
    - Offset Projects: Renewable energy credits + forestry conservation
22. Click on "ESG Compliance Reporting"
23. Verify ESG reporting framework options:
    - GRI (Global Reporting Initiative): Full report
    - SASB (Sustainability Accounting Standards): Industry-specific
    - CDP (Carbon Disclosure Project): Climate action reporting
    - ISO 14064: GHG verification protocol
24. Select "GRI Reporting"
25. Verify GRI report framework:
    - Environmental metrics (emissions, waste, energy)
    - Social metrics (safety, workforce development)
    - Governance metrics (compliance, ethics)
26. Click "Generate ESG Report"
27. Verify report generation options:
    - Report Scope: Full company / Fleet operations only
    - Reporting Period: Fiscal year / Calendar year
    - Verification Level: Self-assessment / Third-party
28. Select "Fleet Operations Only" and "Fiscal Year"
29. Click "Generate Report"
30. Verify comprehensive ESG report generated:
    - Emissions data and reduction progress
    - EV adoption and alternative fuel vehicles
    - Energy efficiency metrics
    - Safety incident reductions
    - Workforce training on sustainability
    - Governance and compliance procedures
    - Carbon offsetting initiatives
31. Export report as PDF
32. Verify PDF contains professional ESG presentation:
    - Executive summary of sustainability performance
    - Detailed metrics with trend charts
    - Goals and progress tracking
    - Initiatives and their impact
    - Comparison to industry benchmarks
    - Transparent disclosure of methodology
33. Navigate to "Sustainability Targets"
34. Verify target configuration dashboard:
    - 2030 CO2 Reduction Target: 25%
    - 2030 EV Penetration Target: 85%
    - 2027 Renewable Energy Target: 50% of EV charging
35. Click "View Target Progress"
36. Verify progress visualization:
    - CO2 Reduction: 5% achieved, 20% remaining
    - EV Penetration: 26% achieved, 59% remaining
    - Renewable Energy: 35% achieved, 15% remaining
37. Navigate to "Sustainability Benchmarking"
38. Verify industry comparison:
    - Our Emissions Intensity: 12.5 kg CO2 per $1K revenue
    - Industry Average: 14.2 kg CO2 per $1K revenue
    - Our EV Adoption: 26%
    - Industry Average: 8%
    - Competitive Advantage: Above average on both metrics

#### Expected Results:
- Sustainability dashboard displays comprehensive environmental metrics
- Emissions calculations accurate using EPA factors
- EV adoption and impact tracked and projected
- Fuel efficiency metrics monitored
- Sustainability targets configured and tracked
- ESG compliance reports generated in multiple frameworks
- Progress toward 2030 targets clearly visualized
- Industry benchmarking available
- Reports export professionally

#### Acceptance Criteria:
- AC1: Emissions data accurate and current
- AC2: EV adoption metrics tracked
- AC3: Fuel efficiency monitored
- AC4: Sustainability targets visible and tracked
- AC5: ESG reports generate professionally
- AC6: Multiple reporting frameworks available
- AC7: Benchmarking data available
- AC8: Progress toward targets clearly shown

#### Test Data:
- Total Fleet Emissions: 8,500 metric tons CO2/year
- EV Fleet: 75 vehicles (26%)
- Fleet Efficiency: 8.2 MPG average
- Idle Time: 8.2% of operating time
- 2030 Targets:
  - CO2 Reduction: 25% (from 2025 baseline)
  - EV Penetration: 85%
  - Renewable Energy: 50%

---

### TC-EX-025: Fleet Performance Benchmarking

**Test Case ID**: TC-EX-025
**Test Case Name**: Fleet Performance Benchmarking
**Related User Story**: US-EX-010 (Fleet Performance Benchmarking)
**Related Use Case**: UC-EX-011 (Compare to Industry Benchmarks)
**Priority**: Medium
**Test Type**: Functional / Analytics
**Test Author**: QA Team
**Created Date**: November 10, 2025

#### Preconditions:
- Executive user is logged into system
- Benchmarking dashboard is accessible
- Industry benchmark data current (quarterly updates)
- Fleet metrics complete and accurate
- Benchmarking data normalized for fleet size and industry sector
- Multiple industry data sources available (NAFA, ATA)

#### Test Steps:
1. Navigate to "Analytics" → "Performance Benchmarking"
2. Verify benchmarking dashboard displays:
   - Our Fleet Metrics (current)
   - Industry Averages (by size and sector)
   - Percentile Rankings
   - Performance Gaps
3. Observe benchmark comparison for key metrics:
   - Cost Per Mile:
     - Our Fleet: $2.34
     - Industry Average: $2.45
     - Our Percentile: 58th (better than average)
     - Gap: -$0.11 (-4.5%) FAVORABLE
   - Fleet Utilization:
     - Our Fleet: 87%
     - Industry Average: 82%
     - Our Percentile: 72nd (well above average)
     - Gap: +5% FAVORABLE
   - On-Time Delivery:
     - Our Fleet: 92%
     - Industry Average: 88%
     - Our Percentile: 68th (above average)
     - Gap: +4% FAVORABLE
   - Safety Incident Rate:
     - Our Fleet: 0.8 per 100K miles
     - Industry Average: 1.2 per 100K miles
     - Our Percentile: 75th (significantly better)
     - Gap: -0.4 (-33%) FAVORABLE
4. Click on "Cost Per Mile" benchmark
5. Verify detailed comparison:
   - Histogram showing distribution of all fleet CPM values
   - Our CPM marked on histogram (58th percentile)
   - Shows top quartile (best) performance at ~$2.15
   - Shows bottom quartile (worst) performance at ~$2.75
6. Click on "Filter by Fleet Size"
7. Verify fleet size filter options:
   - Small Fleet (25-50 vehicles)
   - Medium Fleet (51-150 vehicles)
   - Large Fleet (151-300 vehicles)
   - Enterprise Fleet (300+ vehicles)
8. Select "Large Fleet" (our fleet is 285 vehicles)
9. Verify benchmarks recalculate for large fleets only:
   - Cost Per Mile for Large Fleets: $2.38
   - Our Fleet: $2.34
   - Our Percentile: 62nd (among large fleets)
10. Click on "Filter by Industry Sector"
11. Verify industry sector options:
    - For-Hire Trucking
    - Private Trucking (our category)
    - Specialized Transportation
    - Public Sector
12. Select "Private Trucking"
13. Verify benchmarks adjust for private fleet sector:
    - Cost Per Mile: $2.35 (slightly lower than general average)
    - Our Fleet: $2.34
    - Our Percentile: 53rd (in line with similar companies)
14. Click on "Time Period Comparison"
15. Verify historical benchmark comparison:
    - Q1 2025: Our CPM $2.42, Industry $2.48, Percentile 55th
    - Q2 2025: Our CPM $2.38, Industry $2.46, Percentile 57th
    - Q3 2025: Our CPM $2.34, Industry $2.45, Percentile 58th (current)
16. Observe CPM improvement trend YoY:
    - Our improvement: -3.5% better (from $2.42 to $2.34)
    - Industry improvement: -1.2% better
    - We're improving faster than industry average
17. Click on "Utilization Rate" benchmark
18. Verify utilization comparison:
    - Our Fleet: 87%
    - Small Fleets: 79%
    - Medium Fleets: 84%
    - Large Fleets: 86%
    - Enterprise Fleets: 88%
    - Our Percentile: 72nd overall
    - Strong performance for our size category
19. Click on "Safety Incident Rate" benchmark
20. Verify safety performance:
    - Our Rate: 0.8 per 100K miles
    - Industry Average: 1.2 per 100K miles
    - Our Percentile: 75th (top quartile)
    - Safety improvement: -33% better than industry
    - Status: EXCELLENT
21. Click on "Performance Gaps"
22. Verify gap analysis displays:
    - Metrics where we exceed benchmarks (STRONG):
      - Utilization: +5% above average
      - Safety: -33% incident rate below average
      - Fuel Efficiency: +3.8% better than average
    - Metrics where we trail benchmarks (IMPROVEMENT AREAS):
      - Maintenance Costs: +8% above average
      - Vehicle Age: -1.5 years (fleet slightly newer, favorable)
23. Click on "Maintenance Costs" gap
24. Verify maintenance cost analysis:
    - Our Maintenance Costs: $0.68/mile
    - Industry Average: $0.63/mile
    - Gap: +$0.05 (+7.9%) UNFAVORABLE
    - Potential annual impact: ~$8K excess maintenance costs
25. Verify explanations for gap:
    - Our fleet may be older on average (actually 8.2 years vs 8.0 industry)
    - Or preventive maintenance program is more comprehensive
    - Or technician labor costs higher in our regions
26. Click on "Recommended Actions"
27. Verify system provides gap-closing recommendations:
    - "Analyze maintenance costs by vehicle type for opportunities"
    - "Implement preventive maintenance intervals review"
    - "Benchmark against regional competitors specifically"
    - "Consider third-party maintenance provider options"
28. Click on "Performance Goals"
29. Verify goal-setting interface:
    - Set target: Match industry average on maintenance costs
    - Set timeline: By end of Q2 2026
    - Assign responsibility: Fleet Manager
    - Define action plan: Detailed steps to close gap
30. Click on "Export Benchmark Report"
31. Verify report generation options:
    - Report Type: Executive Summary / Detailed Analysis
    - Metrics: Select specific or all
    - Benchmarks: Internal only / With industry comparison
    - Format: PDF / Excel / PowerPoint
32. Select "Executive Summary with Industry Comparison" in PDF
33. Click "Generate Report"
34. Verify benchmark report generated with:
    - Executive summary of our performance vs. industry
    - Percentile rankings for all metrics
    - Performance gaps identified
    - Recommended improvements
    - Charts comparing our metrics to distribution
    - Data quality and source documentation

#### Expected Results:
- Benchmarking dashboard compares our fleet to industry standards
- Multiple industry data sources available (NAFA, ATA)
- Percentile rankings show competitive positioning
- Performance gaps identified with context
- Filters available for fleet size and industry sector
- Historical trend comparison available
- Recommendations provided for improvement
- Reports generate professionally
- All benchmarking data current and credible

#### Acceptance Criteria:
- AC1: Benchmarks available for all key metrics
- AC2: Industry data current (quarterly updates)
- AC3: Percentile rankings calculated correctly
- AC4: Filters work for fleet size and sector
- AC5: Historical trends available
- AC6: Performance gaps identified
- AC7: Reports generate professionally
- AC8: Data sources transparent and credible

#### Test Data:
Our Fleet Metrics:
- Cost Per Mile: $2.34 (58th percentile)
- Utilization: 87% (72nd percentile)
- On-Time Delivery: 92% (68th percentile)
- Safety Rate: 0.8/100K miles (75th percentile)
- Maintenance Costs: $0.68/mile (25th percentile - unfavorable)

Industry Averages (Private Trucking, Large Fleet):
- Cost Per Mile: $2.38
- Utilization: 86%
- On-Time Delivery: 88%
- Safety Rate: 1.2/100K miles
- Maintenance Costs: $0.63/mile

---

## Test Execution Summary

**Total Test Cases**: 25
- KPI Dashboard and Monitoring: 5 test cases (TC-EX-001 to TC-EX-005)
- Multi-Location Comparison: 5 test cases (TC-EX-006 to TC-EX-010)
- Real-Time Alerts: 5 test cases (TC-EX-011 to TC-EX-015)
- Budget and Financial Analysis: 5 test cases (TC-EX-016 to TC-EX-020)
- Strategic Reporting and Forecasting: 5 test cases (TC-EX-021 to TC-EX-025)

**Test Coverage Areas**:
- Executive dashboard functionality and performance
- KPI accuracy and real-time updates
- Multi-location performance analysis and comparison
- Alert delivery and management
- Budget variance analysis and approvals
- Capital expenditure approval workflow
- ROI analysis and financial reporting
- Executive summary report generation
- Board presentation builder
- Long-term forecasting and scenario analysis
- Sustainability and ESG metrics tracking
- Industry benchmarking and competitive analysis

**Test Types**:
- Functional: 20 test cases
- Performance: 2 test cases
- Data Validation: 1 test case
- Integration: 1 test case
- Financial Analysis: 1 test case

**Priority Distribution**:
- High Priority: 17 test cases
- Medium Priority: 8 test cases

**Estimated Execution Time**: 60-80 hours for manual testing
- Setup and preconditions: 8 hours
- Test execution: 45-60 hours
- Defect investigation and reporting: 7-12 hours

---

*Document Version: 1.0*
*Created: November 10, 2025*
*Last Updated: November 10, 2025*
*Test Team: QA Department*
