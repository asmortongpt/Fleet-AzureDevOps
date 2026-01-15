-- Migration: Seed City of Tallahassee Custom Reports
-- Description: Insert 35 dashboard reports for City of Tallahassee
-- Date: 2026-01-05

-- ============================================================================
-- City of Tallahassee Custom Reports (35 total)
-- ============================================================================

-- System user ID for seeding (you'll need to replace this with actual user UUID)
-- For now, using a placeholder that should be updated during deployment
DO $$
DECLARE
    cot_org_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    system_user_id UUID := '00000000-0000-0000-0000-000000000001'; -- Placeholder
BEGIN

-- ============================================================================
-- MAIN DASHBOARD REPORTS (8 reports)
-- ============================================================================

-- Report 1: Scheduled vs Non-Scheduled Repairs
INSERT INTO custom_reports (organization_id, created_by_user_id, title, description, domain, category, definition)
VALUES (
    cot_org_id,
    system_user_id,
    'Scheduled vs Non-Scheduled Repairs',
    'Hours and percentages by shop with 75/25 Industry Standard benchmark',
    'maintenance',
    'main_dashboard',
    jsonb_build_object(
        'datasource', jsonb_build_object(
            'type', 'sqlView',
            'view', 'vw_scheduled_vs_nonscheduled',
            'parameters', jsonb_build_object(
                'date_start', '{{dateRange.start}}',
                'date_end', '{{dateRange.end}}',
                'shop', '{{shop}}'
            )
        ),
        'filters', jsonb_build_array(
            jsonb_build_object('name', 'dateRange', 'type', 'dateRange', 'default', 'last_12_months', 'required', true),
            jsonb_build_object('name', 'shop', 'type', 'select', 'values', 'dynamic', 'default', 'All')
        ),
        'visuals', jsonb_build_array(
            jsonb_build_object(
                'id', 'kpi_scheduled_pct',
                'type', 'kpiTile',
                'title', 'Scheduled %',
                'measure', jsonb_build_object('field', 'scheduled_pct', 'format', 'percent'),
                'benchmark', 75,
                'layout', jsonb_build_object('x', 0, 'y', 0, 'w', 3, 'h', 2)
            ),
            jsonb_build_object(
                'id', 'breakdown_chart',
                'type', 'bar',
                'title', 'Scheduled vs Non-Scheduled by Shop',
                'encoding', jsonb_build_object(
                    'x', jsonb_build_object('field', 'shop_name', 'type', 'nominal'),
                    'y', jsonb_build_object('field', 'hours', 'type', 'quantitative'),
                    'color', jsonb_build_object('field', 'type', 'type', 'nominal')
                ),
                'layout', jsonb_build_object('x', 0, 'y', 2, 'w', 12, 'h', 4)
            )
        ),
        'exports', jsonb_build_array(
            jsonb_build_object('format', 'xlsx', 'dataset', 'detail')
        )
    )
);

-- Report 2: Mechanic Downtime Analysis
INSERT INTO custom_reports (organization_id, created_by_user_id, title, description, domain, category, definition)
VALUES (
    cot_org_id,
    system_user_id,
    'Mechanic Downtime Analysis',
    'Wrench-turning hours vs idle time by technician and shop',
    'maintenance',
    'main_dashboard',
    jsonb_build_object(
        'datasource', jsonb_build_object(
            'type', 'sqlView',
            'view', 'vw_mechanic_downtime',
            'parameters', jsonb_build_object(
                'date_start', '{{dateRange.start}}',
                'date_end', '{{dateRange.end}}',
                'shop', '{{shop}}'
            )
        ),
        'filters', jsonb_build_array(
            jsonb_build_object('name', 'dateRange', 'type', 'dateRange', 'default', 'last_month', 'required', true),
            jsonb_build_object('name', 'shop', 'type', 'select', 'values', 'dynamic', 'default', 'All')
        ),
        'visuals', jsonb_build_array(
            jsonb_build_object(
                'id', 'efficiency_chart',
                'type', 'bar',
                'title', 'Technician Efficiency (Wrench-Turning vs Idle)',
                'encoding', jsonb_build_object(
                    'x', jsonb_build_object('field', 'technician_name', 'type', 'nominal'),
                    'y', jsonb_build_object('field', 'hours', 'type', 'quantitative'),
                    'color', jsonb_build_object('field', 'activity_type', 'type', 'nominal')
                ),
                'layout', jsonb_build_object('x', 0, 'y', 0, 'w', 12, 'h', 6)
            )
        )
    )
);

-- Report 3: Monthly Operating Budget
INSERT INTO custom_reports (organization_id, created_by_user_id, title, description, domain, category, definition)
VALUES (
    cot_org_id,
    system_user_id,
    'Monthly Operating Budget',
    'Budget vs actual spend by month and cost category',
    'financial',
    'main_dashboard',
    jsonb_build_object(
        'datasource', jsonb_build_object(
            'type', 'sqlView',
            'view', 'vw_monthly_budget',
            'parameters', jsonb_build_object(
                'fiscal_year', '{{fiscalYear}}',
                'department', '{{department}}'
            )
        ),
        'filters', jsonb_build_array(
            jsonb_build_object('name', 'fiscalYear', 'type', 'select', 'values', jsonb_build_array('2025', '2026', '2027'), 'default', '2026'),
            jsonb_build_object('name', 'department', 'type', 'select', 'values', 'dynamic', 'default', 'All')
        ),
        'visuals', jsonb_build_array(
            jsonb_build_object(
                'id', 'budget_variance',
                'type', 'line',
                'title', 'Budget vs Actual by Month',
                'encoding', jsonb_build_object(
                    'x', jsonb_build_object('field', 'month', 'type', 'temporal'),
                    'y', jsonb_build_object('field', 'amount', 'type', 'quantitative'),
                    'color', jsonb_build_object('field', 'type', 'type', 'nominal', 'domain', jsonb_build_array('Budget', 'Actual'))
                ),
                'layout', jsonb_build_object('x', 0, 'y', 0, 'w', 12, 'h', 6)
            )
        )
    )
);

-- Report 4: Fuel & Parts Spend
INSERT INTO custom_reports (organization_id, created_by_user_id, title, description, domain, category, definition)
VALUES (
    cot_org_id,
    system_user_id,
    'Fuel & Parts Spend',
    'Monthly trends for fuel and parts expenditures with YoY comparison',
    'financial',
    'main_dashboard',
    jsonb_build_object(
        'datasource', jsonb_build_object(
            'type', 'sqlView',
            'view', 'vw_fuel_parts_spend',
            'parameters', jsonb_build_object(
                'date_start', '{{dateRange.start}}',
                'date_end', '{{dateRange.end}}'
            )
        ),
        'filters', jsonb_build_array(
            jsonb_build_object('name', 'dateRange', 'type', 'dateRange', 'default', 'last_24_months', 'required', true)
        ),
        'visuals', jsonb_build_array(
            jsonb_build_object(
                'id', 'spend_trend',
                'type', 'line',
                'title', 'Fuel & Parts Spend Trend',
                'encoding', jsonb_build_object(
                    'x', jsonb_build_object('field', 'month', 'type', 'temporal'),
                    'y', jsonb_build_object('field', 'amount', 'type', 'quantitative'),
                    'color', jsonb_build_object('field', 'category', 'type', 'nominal', 'domain', jsonb_build_array('Fuel', 'Parts'))
                ),
                'layout', jsonb_build_object('x', 0, 'y', 0, 'w', 12, 'h', 6)
            )
        )
    )
);

-- Report 5: Vehicle Lifecycle Costs
INSERT INTO custom_reports (organization_id, created_by_user_id, title, description, domain, category, definition)
VALUES (
    cot_org_id,
    system_user_id,
    'Vehicle Lifecycle Costs',
    'Total cost of ownership by vehicle age and type',
    'financial',
    'main_dashboard',
    jsonb_build_object(
        'datasource', jsonb_build_object(
            'type', 'sqlView',
            'view', 'vw_vehicle_lifecycle_costs',
            'parameters', jsonb_build_object(
                'vehicle_type', '{{vehicleType}}'
            )
        ),
        'filters', jsonb_build_array(
            jsonb_build_object('name', 'vehicleType', 'type', 'select', 'values', 'dynamic', 'default', 'All')
        ),
        'visuals', jsonb_build_array(
            jsonb_build_object(
                'id', 'lifecycle_chart',
                'type', 'scatter',
                'title', 'Cost vs Vehicle Age',
                'encoding', jsonb_build_object(
                    'x', jsonb_build_object('field', 'vehicle_age_years', 'type', 'quantitative'),
                    'y', jsonb_build_object('field', 'total_cost', 'type', 'quantitative'),
                    'color', jsonb_build_object('field', 'vehicle_type', 'type', 'nominal'),
                    'size', jsonb_build_object('field', 'mileage', 'type', 'quantitative')
                ),
                'layout', jsonb_build_object('x', 0, 'y', 0, 'w', 12, 'h', 6)
            )
        )
    )
);

-- Report 6: Fleet Availability
INSERT INTO custom_reports (organization_id, created_by_user_id, title, description, domain, category, definition)
VALUES (
    cot_org_id,
    system_user_id,
    'Fleet Availability',
    'Percentage of vehicles available vs out of service by department',
    'operations',
    'main_dashboard',
    jsonb_build_object(
        'datasource', jsonb_build_object(
            'type', 'sqlView',
            'view', 'vw_fleet_availability',
            'parameters', jsonb_build_object(
                'date', '{{date}}',
                'department', '{{department}}'
            )
        ),
        'filters', jsonb_build_array(
            jsonb_build_object('name', 'date', 'type', 'date', 'default', 'today', 'required', true),
            jsonb_build_object('name', 'department', 'type', 'select', 'values', 'dynamic', 'default', 'All')
        ),
        'visuals', jsonb_build_array(
            jsonb_build_object(
                'id', 'availability_kpi',
                'type', 'kpiTile',
                'title', 'Fleet Availability %',
                'measure', jsonb_build_object('field', 'availability_pct', 'format', 'percent'),
                'benchmark', 90,
                'layout', jsonb_build_object('x', 0, 'y', 0, 'w', 4, 'h', 2)
            ),
            jsonb_build_object(
                'id', 'by_department',
                'type', 'bar',
                'title', 'Availability by Department',
                'encoding', jsonb_build_object(
                    'x', jsonb_build_object('field', 'department', 'type', 'nominal'),
                    'y', jsonb_build_object('field', 'availability_pct', 'type', 'quantitative', 'scale', jsonb_build_object('domain', jsonb_build_array(0, 100)))
                ),
                'layout', jsonb_build_object('x', 0, 'y', 2, 'w', 12, 'h', 4)
            )
        )
    )
);

-- Report 7: PM Compliance Rate
INSERT INTO custom_reports (organization_id, created_by_user_id, title, description, domain, category, definition)
VALUES (
    cot_org_id,
    system_user_id,
    'PM Compliance Rate',
    'Preventive maintenance compliance by vehicle type and shop',
    'maintenance',
    'main_dashboard',
    jsonb_build_object(
        'datasource', jsonb_build_object(
            'type', 'sqlView',
            'view', 'vw_pm_compliance',
            'parameters', jsonb_build_object(
                'date_start', '{{dateRange.start}}',
                'date_end', '{{dateRange.end}}',
                'shop', '{{shop}}'
            )
        ),
        'filters', jsonb_build_array(
            jsonb_build_object('name', 'dateRange', 'type', 'dateRange', 'default', 'last_quarter', 'required', true),
            jsonb_build_object('name', 'shop', 'type', 'select', 'values', 'dynamic', 'default', 'All')
        ),
        'visuals', jsonb_build_array(
            jsonb_build_object(
                'id', 'compliance_kpi',
                'type', 'kpiTile',
                'title', 'PM Compliance %',
                'measure', jsonb_build_object('field', 'compliance_pct', 'format', 'percent'),
                'benchmark', 95,
                'layout', jsonb_build_object('x', 0, 'y', 0, 'w', 4, 'h', 2)
            ),
            jsonb_build_object(
                'id', 'compliance_by_type',
                'type', 'bar',
                'title', 'Compliance by Vehicle Type',
                'encoding', jsonb_build_object(
                    'x', jsonb_build_object('field', 'vehicle_type', 'type', 'nominal'),
                    'y', jsonb_build_object('field', 'compliance_pct', 'type', 'quantitative')
                ),
                'layout', jsonb_build_object('x', 0, 'y', 2, 'w', 12, 'h', 4)
            )
        )
    )
);

-- Report 8: Cost Per Mile Trend
INSERT INTO custom_reports (organization_id, created_by_user_id, title, description, domain, category, definition)
VALUES (
    cot_org_id,
    system_user_id,
    'Cost Per Mile Trend',
    'Monthly cost per mile by vehicle class with industry benchmarks',
    'financial',
    'main_dashboard',
    jsonb_build_object(
        'datasource', jsonb_build_object(
            'type', 'sqlView',
            'view', 'vw_cost_per_mile',
            'parameters', jsonb_build_object(
                'date_start', '{{dateRange.start}}',
                'date_end', '{{dateRange.end}}',
                'vehicle_class', '{{vehicleClass}}'
            )
        ),
        'filters', jsonb_build_array(
            jsonb_build_object('name', 'dateRange', 'type', 'dateRange', 'default', 'last_12_months', 'required', true),
            jsonb_build_object('name', 'vehicleClass', 'type', 'select', 'values', 'dynamic', 'default', 'All')
        ),
        'visuals', jsonb_build_array(
            jsonb_build_object(
                'id', 'cpm_trend',
                'type', 'line',
                'title', 'Cost Per Mile Trend',
                'encoding', jsonb_build_object(
                    'x', jsonb_build_object('field', 'month', 'type', 'temporal'),
                    'y', jsonb_build_object('field', 'cost_per_mile', 'type', 'quantitative'),
                    'color', jsonb_build_object('field', 'vehicle_class', 'type', 'nominal')
                ),
                'layout', jsonb_build_object('x', 0, 'y', 0, 'w', 12, 'h', 6)
            )
        )
    )
);

-- ============================================================================
-- DRIVER MEASURES REPORTS (9 reports)
-- ============================================================================

-- Report 9: Driver Safety Scores
INSERT INTO custom_reports (organization_id, created_by_user_id, title, description, domain, category, definition)
VALUES (
    cot_org_id,
    system_user_id,
    'Driver Safety Scores',
    'Composite safety scores by driver with incident history',
    'safety',
    'driver_measures',
    jsonb_build_object(
        'datasource', jsonb_build_object(
            'type', 'sqlView',
            'view', 'vw_driver_safety_scores',
            'parameters', jsonb_build_object(
                'date_start', '{{dateRange.start}}',
                'date_end', '{{dateRange.end}}',
                'department', '{{department}}'
            )
        ),
        'filters', jsonb_build_array(
            jsonb_build_object('name', 'dateRange', 'type', 'dateRange', 'default', 'last_12_months', 'required', true),
            jsonb_build_object('name', 'department', 'type', 'select', 'values', 'dynamic', 'default', 'All')
        ),
        'visuals', jsonb_build_array(
            jsonb_build_object(
                'id', 'avg_safety_score',
                'type', 'kpiTile',
                'title', 'Avg Safety Score',
                'measure', jsonb_build_object('field', 'avg_safety_score', 'format', 'decimal'),
                'benchmark', 85,
                'layout', jsonb_build_object('x', 0, 'y', 0, 'w', 3, 'h', 2)
            ),
            jsonb_build_object(
                'id', 'score_distribution',
                'type', 'bar',
                'title', 'Driver Safety Score Distribution',
                'encoding', jsonb_build_object(
                    'x', jsonb_build_object('field', 'driver_name', 'type', 'nominal'),
                    'y', jsonb_build_object('field', 'safety_score', 'type', 'quantitative')
                ),
                'layout', jsonb_build_object('x', 0, 'y', 2, 'w', 12, 'h', 4)
            ),
            jsonb_build_object(
                'id', 'detail_table',
                'type', 'table',
                'title', 'Driver Details',
                'columns', jsonb_build_array(
                    jsonb_build_object('field', 'driver_name', 'label', 'Driver'),
                    jsonb_build_object('field', 'safety_score', 'label', 'Score'),
                    jsonb_build_object('field', 'incidents', 'label', 'Incidents'),
                    jsonb_build_object('field', 'violations', 'label', 'Violations')
                ),
                'layout', jsonb_build_object('x', 0, 'y', 6, 'w', 12, 'h', 4)
            )
        )
    )
);

-- Report 10: Speeding Events
INSERT INTO custom_reports (organization_id, created_by_user_id, title, description, domain, category, definition)
VALUES (
    cot_org_id,
    system_user_id,
    'Speeding Events',
    'Speeding violations by driver, location, and severity',
    'safety',
    'driver_measures',
    jsonb_build_object(
        'datasource', jsonb_build_object(
            'type', 'sqlView',
            'view', 'vw_speeding_events',
            'parameters', jsonb_build_object(
                'date_start', '{{dateRange.start}}',
                'date_end', '{{dateRange.end}}'
            )
        ),
        'filters', jsonb_build_array(
            jsonb_build_object('name', 'dateRange', 'type', 'dateRange', 'default', 'last_month', 'required', true)
        ),
        'visuals', jsonb_build_array(
            jsonb_build_object(
                'id', 'speeding_heatmap',
                'type', 'map',
                'title', 'Speeding Hotspots',
                'encoding', jsonb_build_object(
                    'location', jsonb_build_object('field', 'lat_lng'),
                    'color', jsonb_build_object('field', 'severity', 'type', 'ordinal')
                ),
                'layout', jsonb_build_object('x', 0, 'y', 0, 'w', 8, 'h', 6)
            )
        )
    )
);

-- Report 11: Harsh Braking Analysis
INSERT INTO custom_reports (organization_id, created_by_user_id, title, description, domain, category, definition)
VALUES (
    cot_org_id,
    system_user_id,
    'Harsh Braking Analysis',
    'Harsh braking events by driver with frequency trends',
    'safety',
    'driver_measures',
    jsonb_build_object(
        'datasource', jsonb_build_object(
            'type', 'sqlView',
            'view', 'vw_harsh_braking',
            'parameters', jsonb_build_object(
                'date_start', '{{dateRange.start}}',
                'date_end', '{{dateRange.end}}'
            )
        ),
        'filters', jsonb_build_array(
            jsonb_build_object('name', 'dateRange', 'type', 'dateRange', 'default', 'last_quarter', 'required', true)
        ),
        'visuals', jsonb_build_array(
            jsonb_build_object(
                'id', 'harsh_braking_trend',
                'type', 'line',
                'title', 'Harsh Braking Trend',
                'encoding', jsonb_build_object(
                    'x', jsonb_build_object('field', 'week', 'type', 'temporal'),
                    'y', jsonb_build_object('field', 'event_count', 'type', 'quantitative')
                ),
                'layout', jsonb_build_object('x', 0, 'y', 0, 'w', 12, 'h', 6)
            )
        )
    )
);

-- Report 12: Idle Time by Driver
INSERT INTO custom_reports (organization_id, created_by_user_id, title, description, domain, category, definition)
VALUES (
    cot_org_id,
    system_user_id,
    'Idle Time by Driver',
    'Excessive idle time analysis with fuel waste estimates',
    'operations',
    'driver_measures',
    jsonb_build_object(
        'datasource', jsonb_build_object(
            'type', 'sqlView',
            'view', 'vw_idle_time_driver',
            'parameters', jsonb_build_object(
                'date_start', '{{dateRange.start}}',
                'date_end', '{{dateRange.end}}'
            )
        ),
        'filters', jsonb_build_array(
            jsonb_build_object('name', 'dateRange', 'type', 'dateRange', 'default', 'last_month', 'required', true)
        ),
        'visuals', jsonb_build_array(
            jsonb_build_object(
                'id', 'idle_ranking',
                'type', 'bar',
                'title', 'Top 20 Drivers by Idle Time',
                'encoding', jsonb_build_object(
                    'x', jsonb_build_object('field', 'driver_name', 'type', 'nominal'),
                    'y', jsonb_build_object('field', 'idle_hours', 'type', 'quantitative')
                ),
                'layout', jsonb_build_object('x', 0, 'y', 0, 'w', 12, 'h', 6)
            )
        )
    )
);

-- Report 13: License Expiration Tracking
INSERT INTO custom_reports (organization_id, created_by_user_id, title, description, domain, category, definition)
VALUES (
    cot_org_id,
    system_user_id,
    'License Expiration Tracking',
    'CDL and driver license expiration dates with alerts',
    'compliance',
    'driver_measures',
    jsonb_build_object(
        'datasource', jsonb_build_object(
            'type', 'sqlView',
            'view', 'vw_license_expiration',
            'parameters', jsonb_build_object(
                'days_ahead', '{{daysAhead}}'
            )
        ),
        'filters', jsonb_build_array(
            jsonb_build_object('name', 'daysAhead', 'type', 'number', 'default', 90, 'required', true)
        ),
        'visuals', jsonb_build_array(
            jsonb_build_object(
                'id', 'expiring_soon',
                'type', 'table',
                'title', 'Expiring Licenses',
                'columns', jsonb_build_array(
                    jsonb_build_object('field', 'driver_name', 'label', 'Driver'),
                    jsonb_build_object('field', 'license_type', 'label', 'Type'),
                    jsonb_build_object('field', 'expiration_date', 'label', 'Expires'),
                    jsonb_build_object('field', 'days_until_expiration', 'label', 'Days Until')
                ),
                'layout', jsonb_build_object('x', 0, 'y', 0, 'w', 12, 'h', 6)
            )
        )
    )
);

-- Report 14: Driver Training Completion
INSERT INTO custom_reports (organization_id, created_by_user_id, title, description, domain, category, definition)
VALUES (
    cot_org_id,
    system_user_id,
    'Driver Training Completion',
    'Training compliance by driver and course type',
    'compliance',
    'driver_measures',
    jsonb_build_object(
        'datasource', jsonb_build_object(
            'type', 'sqlView',
            'view', 'vw_driver_training',
            'parameters', jsonb_build_object(
                'department', '{{department}}'
            )
        ),
        'filters', jsonb_build_array(
            jsonb_build_object('name', 'department', 'type', 'select', 'values', 'dynamic', 'default', 'All')
        ),
        'visuals', jsonb_build_array(
            jsonb_build_object(
                'id', 'training_completion',
                'type', 'kpiTile',
                'title', 'Training Completion %',
                'measure', jsonb_build_object('field', 'completion_pct', 'format', 'percent'),
                'benchmark', 100,
                'layout', jsonb_build_object('x', 0, 'y', 0, 'w', 4, 'h', 2)
            )
        )
    )
);

-- Report 15: Hours of Service Compliance
INSERT INTO custom_reports (organization_id, created_by_user_id, title, description, domain, category, definition)
VALUES (
    cot_org_id,
    system_user_id,
    'Hours of Service Compliance',
    'CDL driver HOS violations and compliance rates',
    'compliance',
    'driver_measures',
    jsonb_build_object(
        'datasource', jsonb_build_object(
            'type', 'sqlView',
            'view', 'vw_hos_compliance',
            'parameters', jsonb_build_object(
                'date_start', '{{dateRange.start}}',
                'date_end', '{{dateRange.end}}'
            )
        ),
        'filters', jsonb_build_array(
            jsonb_build_object('name', 'dateRange', 'type', 'dateRange', 'default', 'last_month', 'required', true)
        ),
        'visuals', jsonb_build_array(
            jsonb_build_object(
                'id', 'hos_violations',
                'type', 'bar',
                'title', 'HOS Violations by Type',
                'encoding', jsonb_build_object(
                    'x', jsonb_build_object('field', 'violation_type', 'type', 'nominal'),
                    'y', jsonb_build_object('field', 'count', 'type', 'quantitative')
                ),
                'layout', jsonb_build_object('x', 0, 'y', 0, 'w', 12, 'h', 6)
            )
        )
    )
);

-- Report 16: Accident Rate by Driver
INSERT INTO custom_reports (organization_id, created_by_user_id, title, description, domain, category, definition)
VALUES (
    cot_org_id,
    system_user_id,
    'Accident Rate by Driver',
    'Preventable vs non-preventable accidents per driver',
    'safety',
    'driver_measures',
    jsonb_build_object(
        'datasource', jsonb_build_object(
            'type', 'sqlView',
            'view', 'vw_accident_rate_driver',
            'parameters', jsonb_build_object(
                'date_start', '{{dateRange.start}}',
                'date_end', '{{dateRange.end}}'
            )
        ),
        'filters', jsonb_build_array(
            jsonb_build_object('name', 'dateRange', 'type', 'dateRange', 'default', 'last_24_months', 'required', true)
        ),
        'visuals', jsonb_build_array(
            jsonb_build_object(
                'id', 'accident_table',
                'type', 'table',
                'title', 'Driver Accident History',
                'columns', jsonb_build_array(
                    jsonb_build_object('field', 'driver_name', 'label', 'Driver'),
                    jsonb_build_object('field', 'total_accidents', 'label', 'Total'),
                    jsonb_build_object('field', 'preventable', 'label', 'Preventable'),
                    jsonb_build_object('field', 'non_preventable', 'label', 'Non-Preventable')
                ),
                'layout', jsonb_build_object('x', 0, 'y', 0, 'w', 12, 'h', 6)
            )
        )
    )
);

-- Report 17: Fuel Economy by Driver
INSERT INTO custom_reports (organization_id, created_by_user_id, title, description, domain, category, definition)
VALUES (
    cot_org_id,
    system_user_id,
    'Fuel Economy by Driver',
    'MPG performance by driver with vehicle type normalization',
    'operations',
    'driver_measures',
    jsonb_build_object(
        'datasource', jsonb_build_object(
            'type', 'sqlView',
            'view', 'vw_fuel_economy_driver',
            'parameters', jsonb_build_object(
                'date_start', '{{dateRange.start}}',
                'date_end', '{{dateRange.end}}',
                'vehicle_type', '{{vehicleType}}'
            )
        ),
        'filters', jsonb_build_array(
            jsonb_build_object('name', 'dateRange', 'type', 'dateRange', 'default', 'last_quarter', 'required', true),
            jsonb_build_object('name', 'vehicleType', 'type', 'select', 'values', 'dynamic', 'default', 'All')
        ),
        'visuals', jsonb_build_array(
            jsonb_build_object(
                'id', 'mpg_ranking',
                'type', 'bar',
                'title', 'Driver MPG Performance',
                'encoding', jsonb_build_object(
                    'x', jsonb_build_object('field', 'driver_name', 'type', 'nominal'),
                    'y', jsonb_build_object('field', 'avg_mpg', 'type', 'quantitative')
                ),
                'layout', jsonb_build_object('x', 0, 'y', 0, 'w', 12, 'h', 6)
            )
        )
    )
);

-- ============================================================================
-- SAFETY REPORTS (7 reports)
-- ============================================================================

-- Report 18: Accident Trends
INSERT INTO custom_reports (organization_id, created_by_user_id, title, description, domain, category, definition)
VALUES (
    cot_org_id,
    system_user_id,
    'Accident Trends',
    'Monthly accident frequency and severity analysis',
    'safety',
    'safety',
    jsonb_build_object(
        'datasource', jsonb_build_object(
            'type', 'sqlView',
            'view', 'vw_accident_trends',
            'parameters', jsonb_build_object(
                'date_start', '{{dateRange.start}}',
                'date_end', '{{dateRange.end}}'
            )
        ),
        'filters', jsonb_build_array(
            jsonb_build_object('name', 'dateRange', 'type', 'dateRange', 'default', 'last_24_months', 'required', true)
        ),
        'visuals', jsonb_build_array(
            jsonb_build_object(
                'id', 'accident_trend',
                'type', 'line',
                'title', 'Accident Trend by Month',
                'encoding', jsonb_build_object(
                    'x', jsonb_build_object('field', 'month', 'type', 'temporal'),
                    'y', jsonb_build_object('field', 'accident_count', 'type', 'quantitative'),
                    'color', jsonb_build_object('field', 'severity', 'type', 'nominal')
                ),
                'layout', jsonb_build_object('x', 0, 'y', 0, 'w', 12, 'h', 6)
            )
        )
    )
);

-- Report 19: Injury/Illness Log
INSERT INTO custom_reports (organization_id, created_by_user_id, title, description, domain, category, definition)
VALUES (
    cot_org_id,
    system_user_id,
    'Injury/Illness Log',
    'OSHA-compliant injury and illness tracking',
    'safety',
    'safety',
    jsonb_build_object(
        'datasource', jsonb_build_object(
            'type', 'sqlView',
            'view', 'vw_injury_illness_log',
            'parameters', jsonb_build_object(
                'date_start', '{{dateRange.start}}',
                'date_end', '{{dateRange.end}}'
            )
        ),
        'filters', jsonb_build_array(
            jsonb_build_object('name', 'dateRange', 'type', 'dateRange', 'default', 'current_year', 'required', true)
        ),
        'visuals', jsonb_build_array(
            jsonb_build_object(
                'id', 'injury_table',
                'type', 'table',
                'title', 'Injury/Illness Log',
                'columns', jsonb_build_array(
                    jsonb_build_object('field', 'incident_date', 'label', 'Date'),
                    jsonb_build_object('field', 'employee_name', 'label', 'Employee'),
                    jsonb_build_object('field', 'incident_type', 'label', 'Type'),
                    jsonb_build_object('field', 'severity', 'label', 'Severity'),
                    jsonb_build_object('field', 'days_lost', 'label', 'Days Lost')
                ),
                'layout', jsonb_build_object('x', 0, 'y', 0, 'w', 12, 'h', 8)
            )
        ),
        'exports', jsonb_build_array(
            jsonb_build_object('format', 'xlsx', 'dataset', 'injury_table')
        )
    )
);

-- Report 20: Safety Inspection Results
INSERT INTO custom_reports (organization_id, created_by_user_id, title, description, domain, category, definition)
VALUES (
    cot_org_id,
    system_user_id,
    'Safety Inspection Results',
    'Vehicle safety inspection pass/fail rates and findings',
    'safety',
    'safety',
    jsonb_build_object(
        'datasource', jsonb_build_object(
            'type', 'sqlView',
            'view', 'vw_safety_inspections',
            'parameters', jsonb_build_object(
                'date_start', '{{dateRange.start}}',
                'date_end', '{{dateRange.end}}',
                'shop', '{{shop}}'
            )
        ),
        'filters', jsonb_build_array(
            jsonb_build_object('name', 'dateRange', 'type', 'dateRange', 'default', 'last_quarter', 'required', true),
            jsonb_build_object('name', 'shop', 'type', 'select', 'values', 'dynamic', 'default', 'All')
        ),
        'visuals', jsonb_build_array(
            jsonb_build_object(
                'id', 'pass_rate',
                'type', 'kpiTile',
                'title', 'Inspection Pass Rate',
                'measure', jsonb_build_object('field', 'pass_rate_pct', 'format', 'percent'),
                'benchmark', 95,
                'layout', jsonb_build_object('x', 0, 'y', 0, 'w', 4, 'h', 2)
            )
        )
    )
);

-- Report 21: DOT Compliance Status
INSERT INTO custom_reports (organization_id, created_by_user_id, title, description, domain, category, definition)
VALUES (
    cot_org_id,
    system_user_id,
    'DOT Compliance Status',
    'DOT inspection readiness and violation tracking',
    'compliance',
    'safety',
    jsonb_build_object(
        'datasource', jsonb_build_object(
            'type', 'sqlView',
            'view', 'vw_dot_compliance',
            'parameters', jsonb_build_object()
        ),
        'filters', jsonb_build_array(),
        'visuals', jsonb_build_array(
            jsonb_build_object(
                'id', 'compliance_score',
                'type', 'kpiTile',
                'title', 'DOT Compliance Score',
                'measure', jsonb_build_object('field', 'compliance_score', 'format', 'percent'),
                'benchmark', 98,
                'layout', jsonb_build_object('x', 0, 'y', 0, 'w', 4, 'h', 2)
            )
        )
    )
);

-- Report 22: Roadside Inspections
INSERT INTO custom_reports (organization_id, created_by_user_id, title, description, domain, category, definition)
VALUES (
    cot_org_id,
    system_user_id,
    'Roadside Inspections',
    'Roadside inspection history with OOS (Out of Service) rates',
    'compliance',
    'safety',
    jsonb_build_object(
        'datasource', jsonb_build_object(
            'type', 'sqlView',
            'view', 'vw_roadside_inspections',
            'parameters', jsonb_build_object(
                'date_start', '{{dateRange.start}}',
                'date_end', '{{dateRange.end}}'
            )
        ),
        'filters', jsonb_build_array(
            jsonb_build_object('name', 'dateRange', 'type', 'dateRange', 'default', 'last_12_months', 'required', true)
        ),
        'visuals', jsonb_build_array(
            jsonb_build_object(
                'id', 'oos_rate',
                'type', 'kpiTile',
                'title', 'Out of Service Rate',
                'measure', jsonb_build_object('field', 'oos_rate_pct', 'format', 'percent'),
                'benchmark', 5,
                'inverted', true,
                'layout', jsonb_build_object('x', 0, 'y', 0, 'w', 4, 'h', 2)
            )
        )
    )
);

-- Report 23: Safety Training Completion
INSERT INTO custom_reports (organization_id, created_by_user_id, title, description, domain, category, definition)
VALUES (
    cot_org_id,
    system_user_id,
    'Safety Training Completion',
    'Mandatory safety training compliance by department',
    'compliance',
    'safety',
    jsonb_build_object(
        'datasource', jsonb_build_object(
            'type', 'sqlView',
            'view', 'vw_safety_training',
            'parameters', jsonb_build_object(
                'department', '{{department}}'
            )
        ),
        'filters', jsonb_build_array(
            jsonb_build_object('name', 'department', 'type', 'select', 'values', 'dynamic', 'default', 'All')
        ),
        'visuals', jsonb_build_array(
            jsonb_build_object(
                'id', 'training_completion',
                'type', 'kpiTile',
                'title', 'Training Completion',
                'measure', jsonb_build_object('field', 'completion_pct', 'format', 'percent'),
                'benchmark', 100,
                'layout', jsonb_build_object('x', 0, 'y', 0, 'w', 4, 'h', 2)
            ),
            jsonb_build_object(
                'id', 'by_course',
                'type', 'bar',
                'title', 'Completion by Course',
                'encoding', jsonb_build_object(
                    'x', jsonb_build_object('field', 'course_name', 'type', 'nominal'),
                    'y', jsonb_build_object('field', 'completion_pct', 'type', 'quantitative')
                ),
                'layout', jsonb_build_object('x', 0, 'y', 2, 'w', 12, 'h', 4)
            )
        )
    )
);

-- Report 24: Workers' Comp Claims
INSERT INTO custom_reports (organization_id, created_by_user_id, title, description, domain, category, definition)
VALUES (
    cot_org_id,
    system_user_id,
    'Workers'' Comp Claims',
    'Workers compensation claim trends and costs',
    'safety',
    'safety',
    jsonb_build_object(
        'datasource', jsonb_build_object(
            'type', 'sqlView',
            'view', 'vw_workers_comp_claims',
            'parameters', jsonb_build_object(
                'date_start', '{{dateRange.start}}',
                'date_end', '{{dateRange.end}}'
            )
        ),
        'filters', jsonb_build_array(
            jsonb_build_object('name', 'dateRange', 'type', 'dateRange', 'default', 'last_24_months', 'required', true)
        ),
        'visuals', jsonb_build_array(
            jsonb_build_object(
                'id', 'claim_trend',
                'type', 'line',
                'title', 'Claims Over Time',
                'encoding', jsonb_build_object(
                    'x', jsonb_build_object('field', 'month', 'type', 'temporal'),
                    'y', jsonb_build_object('field', 'claim_count', 'type', 'quantitative')
                ),
                'layout', jsonb_build_object('x', 0, 'y', 0, 'w', 12, 'h', 6)
            )
        )
    )
);

-- ============================================================================
-- ELECTRIC INITIATIVE REPORTS (8 reports)
-- ============================================================================

-- Report 25: EV Fleet Overview
INSERT INTO custom_reports (organization_id, created_by_user_id, title, description, domain, category, definition)
VALUES (
    cot_org_id,
    system_user_id,
    'EV Fleet Overview',
    'Total EVs, charging infrastructure, and utilization rates',
    'electric',
    'electric',
    jsonb_build_object(
        'datasource', jsonb_build_object(
            'type', 'sqlView',
            'view', 'vw_ev_fleet_overview',
            'parameters', jsonb_build_object()
        ),
        'filters', jsonb_build_array(),
        'visuals', jsonb_build_array(
            jsonb_build_object(
                'id', 'total_evs',
                'type', 'kpiTile',
                'title', 'Total EVs',
                'measure', jsonb_build_object('field', 'total_evs', 'format', 'integer'),
                'layout', jsonb_build_object('x', 0, 'y', 0, 'w', 3, 'h', 2)
            ),
            jsonb_build_object(
                'id', 'charging_stations',
                'type', 'kpiTile',
                'title', 'Charging Stations',
                'measure', jsonb_build_object('field', 'charging_stations', 'format', 'integer'),
                'layout', jsonb_build_object('x', 3, 'y', 0, 'w', 3, 'h', 2)
            )
        )
    )
);

-- Report 26: Charging Infrastructure Utilization
INSERT INTO custom_reports (organization_id, created_by_user_id, title, description, domain, category, definition)
VALUES (
    cot_org_id,
    system_user_id,
    'Charging Infrastructure Utilization',
    'Charging station usage, wait times, and capacity',
    'electric',
    'electric',
    jsonb_build_object(
        'datasource', jsonb_build_object(
            'type', 'sqlView',
            'view', 'vw_charging_utilization',
            'parameters', jsonb_build_object(
                'date_start', '{{dateRange.start}}',
                'date_end', '{{dateRange.end}}'
            )
        ),
        'filters', jsonb_build_array(
            jsonb_build_object('name', 'dateRange', 'type', 'dateRange', 'default', 'last_month', 'required', true)
        ),
        'visuals', jsonb_build_array(
            jsonb_build_object(
                'id', 'utilization_chart',
                'type', 'bar',
                'title', 'Charging Station Utilization',
                'encoding', jsonb_build_object(
                    'x', jsonb_build_object('field', 'station_name', 'type', 'nominal'),
                    'y', jsonb_build_object('field', 'utilization_pct', 'type', 'quantitative')
                ),
                'layout', jsonb_build_object('x', 0, 'y', 0, 'w', 12, 'h', 6)
            )
        )
    )
);

-- Report 27: EV vs ICE Cost Comparison
INSERT INTO custom_reports (organization_id, created_by_user_id, title, description, domain, category, definition)
VALUES (
    cot_org_id,
    system_user_id,
    'EV vs ICE Cost Comparison',
    'Total cost of ownership: Electric vs Internal Combustion Engine',
    'electric',
    'electric',
    jsonb_build_object(
        'datasource', jsonb_build_object(
            'type', 'sqlView',
            'view', 'vw_ev_ice_cost_comparison',
            'parameters', jsonb_build_object(
                'vehicle_type', '{{vehicleType}}'
            )
        ),
        'filters', jsonb_build_array(
            jsonb_build_object('name', 'vehicleType', 'type', 'select', 'values', 'dynamic', 'default', 'All')
        ),
        'visuals', jsonb_build_array(
            jsonb_build_object(
                'id', 'cost_comparison',
                'type', 'bar',
                'title', 'Cost Per Mile: EV vs ICE',
                'encoding', jsonb_build_object(
                    'x', jsonb_build_object('field', 'vehicle_type', 'type', 'nominal'),
                    'y', jsonb_build_object('field', 'cost_per_mile', 'type', 'quantitative'),
                    'color', jsonb_build_object('field', 'fuel_type', 'type', 'nominal', 'domain', jsonb_build_array('Electric', 'Gasoline', 'Diesel'))
                ),
                'layout', jsonb_build_object('x', 0, 'y', 0, 'w', 12, 'h', 6)
            )
        )
    )
);

-- Report 28: Battery Health Monitoring
INSERT INTO custom_reports (organization_id, created_by_user_id, title, description, domain, category, definition)
VALUES (
    cot_org_id,
    system_user_id,
    'Battery Health Monitoring',
    'EV battery degradation and State of Health (SoH) tracking',
    'electric',
    'electric',
    jsonb_build_object(
        'datasource', jsonb_build_object(
            'type', 'sqlView',
            'view', 'vw_battery_health',
            'parameters', jsonb_build_object()
        ),
        'filters', jsonb_build_array(),
        'visuals', jsonb_build_array(
            jsonb_build_object(
                'id', 'soh_distribution',
                'type', 'scatter',
                'title', 'Battery SoH vs Vehicle Age',
                'encoding', jsonb_build_object(
                    'x', jsonb_build_object('field', 'vehicle_age_months', 'type', 'quantitative'),
                    'y', jsonb_build_object('field', 'soh_pct', 'type', 'quantitative'),
                    'color', jsonb_build_object('field', 'vehicle_model', 'type', 'nominal')
                ),
                'layout', jsonb_build_object('x', 0, 'y', 0, 'w', 12, 'h', 6)
            )
        )
    )
);

-- Report 29: EV Range Analysis
INSERT INTO custom_reports (organization_id, created_by_user_id, title, description, domain, category, definition)
VALUES (
    cot_org_id,
    system_user_id,
    'EV Range Analysis',
    'Actual range vs rated range with environmental factors',
    'electric',
    'electric',
    jsonb_build_object(
        'datasource', jsonb_build_object(
            'type', 'sqlView',
            'view', 'vw_ev_range_analysis',
            'parameters', jsonb_build_object(
                'date_start', '{{dateRange.start}}',
                'date_end', '{{dateRange.end}}'
            )
        ),
        'filters', jsonb_build_array(
            jsonb_build_object('name', 'dateRange', 'type', 'dateRange', 'default', 'last_quarter', 'required', true)
        ),
        'visuals', jsonb_build_array(
            jsonb_build_object(
                'id', 'range_comparison',
                'type', 'bar',
                'title', 'Rated vs Actual Range',
                'encoding', jsonb_build_object(
                    'x', jsonb_build_object('field', 'vehicle_model', 'type', 'nominal'),
                    'y', jsonb_build_object('field', 'range_miles', 'type', 'quantitative'),
                    'color', jsonb_build_object('field', 'range_type', 'type', 'nominal', 'domain', jsonb_build_array('Rated', 'Actual'))
                ),
                'layout', jsonb_build_object('x', 0, 'y', 0, 'w', 12, 'h', 6)
            )
        )
    )
);

-- Report 30: Greenhouse Gas Reduction
INSERT INTO custom_reports (organization_id, created_by_user_id, title, description, domain, category, definition)
VALUES (
    cot_org_id,
    system_user_id,
    'Greenhouse Gas Reduction',
    'CO2 emissions avoided by EV fleet vs ICE baseline',
    'electric',
    'electric',
    jsonb_build_object(
        'datasource', jsonb_build_object(
            'type', 'sqlView',
            'view', 'vw_ghg_reduction',
            'parameters', jsonb_build_object(
                'date_start', '{{dateRange.start}}',
                'date_end', '{{dateRange.end}}'
            )
        ),
        'filters', jsonb_build_array(
            jsonb_build_object('name', 'dateRange', 'type', 'dateRange', 'default', 'last_12_months', 'required', true)
        ),
        'visuals', jsonb_build_array(
            jsonb_build_object(
                'id', 'co2_saved',
                'type', 'kpiTile',
                'title', 'CO2 Saved (tons)',
                'measure', jsonb_build_object('field', 'co2_tons_saved', 'format', 'decimal'),
                'layout', jsonb_build_object('x', 0, 'y', 0, 'w', 4, 'h', 2)
            ),
            jsonb_build_object(
                'id', 'savings_trend',
                'type', 'area',
                'title', 'Cumulative CO2 Savings',
                'encoding', jsonb_build_object(
                    'x', jsonb_build_object('field', 'month', 'type', 'temporal'),
                    'y', jsonb_build_object('field', 'cumulative_co2_saved', 'type', 'quantitative')
                ),
                'layout', jsonb_build_object('x', 0, 'y', 2, 'w', 12, 'h', 4)
            )
        )
    )
);

-- Report 31: EV Maintenance Costs
INSERT INTO custom_reports (organization_id, created_by_user_id, title, description, domain, category, definition)
VALUES (
    cot_org_id,
    system_user_id,
    'EV Maintenance Costs',
    'EV maintenance spend vs ICE vehicles with breakdown by component',
    'electric',
    'electric',
    jsonb_build_object(
        'datasource', jsonb_build_object(
            'type', 'sqlView',
            'view', 'vw_ev_maintenance_costs',
            'parameters', jsonb_build_object(
                'date_start', '{{dateRange.start}}',
                'date_end', '{{dateRange.end}}'
            )
        ),
        'filters', jsonb_build_array(
            jsonb_build_object('name', 'dateRange', 'type', 'dateRange', 'default', 'last_12_months', 'required', true)
        ),
        'visuals', jsonb_build_array(
            jsonb_build_object(
                'id', 'cost_comparison',
                'type', 'bar',
                'title', 'Maintenance Cost: EV vs ICE',
                'encoding', jsonb_build_object(
                    'x', jsonb_build_object('field', 'vehicle_type', 'type', 'nominal'),
                    'y', jsonb_build_object('field', 'cost_per_mile', 'type', 'quantitative'),
                    'color', jsonb_build_object('field', 'fuel_type', 'type', 'nominal')
                ),
                'layout', jsonb_build_object('x', 0, 'y', 0, 'w', 12, 'h', 6)
            )
        )
    )
);

-- Report 32: Charging Cost Analysis
INSERT INTO custom_reports (organization_id, created_by_user_id, title, description, domain, category, definition)
VALUES (
    cot_org_id,
    system_user_id,
    'Charging Cost Analysis',
    'Electricity costs by charging station and time of use',
    'electric',
    'electric',
    jsonb_build_object(
        'datasource', jsonb_build_object(
            'type', 'sqlView',
            'view', 'vw_charging_costs',
            'parameters', jsonb_build_object(
                'date_start', '{{dateRange.start}}',
                'date_end', '{{dateRange.end}}'
            )
        ),
        'filters', jsonb_build_array(
            jsonb_build_object('name', 'dateRange', 'type', 'dateRange', 'default', 'last_month', 'required', true)
        ),
        'visuals', jsonb_build_array(
            jsonb_build_object(
                'id', 'cost_per_kwh',
                'type', 'kpiTile',
                'title', 'Avg Cost per kWh',
                'measure', jsonb_build_object('field', 'avg_cost_per_kwh', 'format', 'currency'),
                'layout', jsonb_build_object('x', 0, 'y', 0, 'w', 4, 'h', 2)
            )
        )
    )
);

-- ============================================================================
-- BIODIESEL REPORTS (3 reports)
-- ============================================================================

-- Report 33: Biodiesel Usage Tracking
INSERT INTO custom_reports (organization_id, created_by_user_id, title, description, domain, category, definition)
VALUES (
    cot_org_id,
    system_user_id,
    'Biodiesel Usage Tracking',
    'B20 blend consumption and cost per gallon trends',
    'biodiesel',
    'biodiesel',
    jsonb_build_object(
        'datasource', jsonb_build_object(
            'type', 'sqlView',
            'view', 'vw_biodiesel_usage',
            'parameters', jsonb_build_object(
                'date_start', '{{dateRange.start}}',
                'date_end', '{{dateRange.end}}'
            )
        ),
        'filters', jsonb_build_array(
            jsonb_build_object('name', 'dateRange', 'type', 'dateRange', 'default', 'last_12_months', 'required', true)
        ),
        'visuals', jsonb_build_array(
            jsonb_build_object(
                'id', 'usage_trend',
                'type', 'line',
                'title', 'Biodiesel Consumption (gallons)',
                'encoding', jsonb_build_object(
                    'x', jsonb_build_object('field', 'month', 'type', 'temporal'),
                    'y', jsonb_build_object('field', 'gallons', 'type', 'quantitative')
                ),
                'layout', jsonb_build_object('x', 0, 'y', 0, 'w', 12, 'h', 6)
            )
        )
    )
);

-- Report 34: Biodiesel vs Conventional Diesel Costs
INSERT INTO custom_reports (organization_id, created_by_user_id, title, description, domain, category, definition)
VALUES (
    cot_org_id,
    system_user_id,
    'Biodiesel vs Conventional Diesel Costs',
    'Cost comparison and savings/premium analysis',
    'biodiesel',
    'biodiesel',
    jsonb_build_object(
        'datasource', jsonb_build_object(
            'type', 'sqlView',
            'view', 'vw_biodiesel_cost_comparison',
            'parameters', jsonb_build_object(
                'date_start', '{{dateRange.start}}',
                'date_end', '{{dateRange.end}}'
            )
        ),
        'filters', jsonb_build_array(
            jsonb_build_object('name', 'dateRange', 'type', 'dateRange', 'default', 'last_12_months', 'required', true)
        ),
        'visuals', jsonb_build_array(
            jsonb_build_object(
                'id', 'cost_comparison',
                'type', 'line',
                'title', 'Cost per Gallon: Biodiesel vs Diesel',
                'encoding', jsonb_build_object(
                    'x', jsonb_build_object('field', 'month', 'type', 'temporal'),
                    'y', jsonb_build_object('field', 'cost_per_gallon', 'type', 'quantitative'),
                    'color', jsonb_build_object('field', 'fuel_type', 'type', 'nominal', 'domain', jsonb_build_array('B20 Biodiesel', 'Conventional Diesel'))
                ),
                'layout', jsonb_build_object('x', 0, 'y', 0, 'w', 12, 'h', 6)
            )
        )
    )
);

-- Report 35: Renewable Fuel Impact
INSERT INTO custom_reports (organization_id, created_by_user_id, title, description, domain, category, definition)
VALUES (
    cot_org_id,
    system_user_id,
    'Renewable Fuel Impact',
    'Environmental impact of biodiesel vs conventional diesel',
    'biodiesel',
    'biodiesel',
    jsonb_build_object(
        'datasource', jsonb_build_object(
            'type', 'sqlView',
            'view', 'vw_biodiesel_environmental_impact',
            'parameters', jsonb_build_object(
                'date_start', '{{dateRange.start}}',
                'date_end', '{{dateRange.end}}'
            )
        ),
        'filters', jsonb_build_array(
            jsonb_build_object('name', 'dateRange', 'type', 'dateRange', 'default', 'last_12_months', 'required', true)
        ),
        'visuals', jsonb_build_array(
            jsonb_build_object(
                'id', 'co2_reduction',
                'type', 'kpiTile',
                'title', 'CO2 Reduction (tons)',
                'measure', jsonb_build_object('field', 'co2_tons_reduced', 'format', 'decimal'),
                'layout', jsonb_build_object('x', 0, 'y', 0, 'w', 4, 'h', 2)
            ),
            jsonb_build_object(
                'id', 'impact_trend',
                'type', 'area',
                'title', 'Cumulative Environmental Savings',
                'encoding', jsonb_build_object(
                    'x', jsonb_build_object('field', 'month', 'type', 'temporal'),
                    'y', jsonb_build_object('field', 'cumulative_co2_reduced', 'type', 'quantitative')
                ),
                'layout', jsonb_build_object('x', 0, 'y', 2, 'w', 12, 'h', 4)
            )
        )
    )
);

END $$;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Total reports seeded: 35
-- - Main Dashboard: 8 reports
-- - Driver Measures: 9 reports
-- - Safety: 7 reports
-- - Electric Initiative: 8 reports
-- - Biodiesel: 3 reports
--
-- All reports are linked to City of Tallahassee organization
-- Organization UUID: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11
-- ============================================================================
