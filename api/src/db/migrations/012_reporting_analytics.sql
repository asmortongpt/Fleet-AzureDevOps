-- ============================================================================
-- Migration: 012_reporting_analytics.sql
-- Description: Reporting, Analytics, and Performance Caching
-- Author: Claude Code
-- Date: 2026-01-08
-- ============================================================================
-- Tables: 6
--   1. saved_reports - User-saved report configurations
--   2. report_executions - Report execution history and results
--   3. dashboards - Custom user dashboards with widget layouts
--   4. kpi_targets - KPI goals and target tracking
--   5. benchmark_data - Industry benchmark comparisons
--   6. analytics_cache - Pre-computed analytics for performance
-- ============================================================================

-- ============================================================================
-- Table: saved_reports
-- Purpose: User-saved report configurations and templates
-- ============================================================================

CREATE TABLE IF NOT EXISTS saved_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Report identification
    report_name VARCHAR(200) NOT NULL,
    report_description TEXT,
    report_category VARCHAR(50) CHECK (report_category IN (
        'fleet_utilization', 'maintenance', 'fuel', 'driver_performance',
        'financial', 'compliance', 'safety', 'telematics', 'custom'
    )),

    -- Report type and output
    report_type VARCHAR(30) NOT NULL CHECK (report_type IN (
        'tabular', 'chart', 'map', 'dashboard', 'custom'
    )),
    output_format VARCHAR(20) DEFAULT 'pdf' CHECK (output_format IN (
        'pdf', 'excel', 'csv', 'json', 'html'
    )),

    -- Report configuration
    data_source VARCHAR(100) NOT NULL,  -- 'vehicles', 'maintenance', 'trips', etc.
    query_definition JSONB NOT NULL,  -- Complete query config
    -- Structure: {
    --   filters: [{field, operator, value}],
    --   groupBy: ['field1', 'field2'],
    --   aggregations: [{field, function: 'sum|avg|count'}],
    --   sortBy: [{field, direction: 'asc|desc'}],
    --   limit: 100
    -- }

    -- Visualization settings
    chart_type VARCHAR(30) CHECK (chart_type IN (
        'bar', 'line', 'pie', 'scatter', 'heatmap', 'gauge', 'table', 'map', NULL
    )),
    chart_config JSONB,  -- Chart.js or similar config
    -- Structure: {xAxis, yAxis, colors, legend, tooltips, etc.}

    -- Date range handling
    date_range_type VARCHAR(30) DEFAULT 'custom' CHECK (date_range_type IN (
        'today', 'yesterday', 'last_7_days', 'last_30_days', 'this_month',
        'last_month', 'this_quarter', 'last_quarter', 'this_year', 'last_year',
        'custom', 'all_time'
    )),
    custom_date_from DATE,
    custom_date_to DATE,

    -- Scheduling
    is_scheduled BOOLEAN DEFAULT FALSE,
    schedule_frequency VARCHAR(20) CHECK (schedule_frequency IN (
        'hourly', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly', NULL
    )),
    schedule_cron VARCHAR(100),  -- For advanced scheduling
    schedule_time TIME,
    schedule_day_of_week INTEGER CHECK (schedule_day_of_week BETWEEN 0 AND 6),
    schedule_day_of_month INTEGER CHECK (schedule_day_of_month BETWEEN 1 AND 31),
    next_scheduled_run TIMESTAMPTZ,
    last_scheduled_run TIMESTAMPTZ,

    -- Distribution
    auto_email_recipients TEXT[] DEFAULT '{}',  -- Email addresses
    auto_email_subject VARCHAR(200),
    auto_email_body TEXT,

    -- Access control
    is_public BOOLEAN DEFAULT FALSE,
    owner_id UUID NOT NULL REFERENCES users(id),
    shared_with_users UUID[] DEFAULT '{}',
    shared_with_roles TEXT[] DEFAULT '{}',

    -- Usage tracking
    execution_count INTEGER DEFAULT 0,
    last_executed_at TIMESTAMPTZ,
    last_executed_by UUID REFERENCES users(id),
    average_execution_time_seconds DECIMAL(8, 2),

    -- Favorites and organization
    is_favorite BOOLEAN DEFAULT FALSE,
    folder_path TEXT,  -- '/Fleet Reports/Maintenance'
    tags TEXT[] DEFAULT '{}',

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_template BOOLEAN DEFAULT FALSE,

    -- Metadata
    notes TEXT,
    custom_fields JSONB DEFAULT '{}'::jsonb,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_saved_reports_tenant ON saved_reports(tenant_id);
CREATE INDEX idx_saved_reports_owner ON saved_reports(owner_id);
CREATE INDEX idx_saved_reports_category ON saved_reports(report_category, is_active);
CREATE INDEX idx_saved_reports_scheduled ON saved_reports(next_scheduled_run)
    WHERE is_scheduled = TRUE AND is_active = TRUE;
CREATE INDEX idx_saved_reports_tags ON saved_reports USING GIN(tags);
CREATE INDEX idx_saved_reports_name_search ON saved_reports USING GIN(to_tsvector('english', report_name || ' ' || COALESCE(report_description, '')));

-- Trigger: Update timestamp
CREATE TRIGGER update_saved_reports_timestamp
    BEFORE UPDATE ON saved_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE saved_reports IS 'User-saved report configurations with scheduling and distribution';
COMMENT ON COLUMN saved_reports.query_definition IS 'Complete report query configuration including filters, grouping, aggregations';
COMMENT ON COLUMN saved_reports.schedule_cron IS 'Advanced scheduling using cron syntax (e.g., "0 9 * * 1" for Mondays at 9am)';

-- ============================================================================
-- Table: report_executions
-- Purpose: Report execution history, caching, and audit trail
-- ============================================================================

CREATE TABLE IF NOT EXISTS report_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Report reference
    saved_report_id UUID REFERENCES saved_reports(id) ON DELETE SET NULL,
    report_name VARCHAR(200) NOT NULL,
    report_category VARCHAR(50),

    -- Execution details
    execution_trigger VARCHAR(30) NOT NULL CHECK (execution_trigger IN (
        'manual', 'scheduled', 'api', 'webhook'
    )),
    executed_by UUID REFERENCES users(id),
    executed_at TIMESTAMPTZ DEFAULT NOW(),

    -- Execution parameters (may differ from saved report)
    parameters_used JSONB,  -- Actual params used for this execution
    date_range_from DATE,
    date_range_to DATE,

    -- Execution results
    status VARCHAR(20) DEFAULT 'running' CHECK (status IN (
        'queued', 'running', 'completed', 'failed', 'cancelled', 'timeout'
    )),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    execution_time_seconds DECIMAL(8, 2),

    -- Results caching
    result_data JSONB,  -- Actual report data
    result_row_count INTEGER,
    result_size_kb INTEGER,
    cache_key VARCHAR(100),
    cache_expires_at TIMESTAMPTZ,

    -- Output file
    output_format VARCHAR(20),
    output_file_url TEXT,
    output_file_size_kb INTEGER,

    -- Performance metrics
    query_time_ms INTEGER,
    render_time_ms INTEGER,
    total_records_scanned INTEGER,
    memory_used_mb DECIMAL(8, 2),

    -- Error handling
    error_message TEXT,
    error_stack_trace TEXT,

    -- Distribution tracking
    emailed_to TEXT[] DEFAULT '{}',
    email_sent_at TIMESTAMPTZ,
    email_delivery_status VARCHAR(20) CHECK (email_delivery_status IN (
        'pending', 'sent', 'delivered', 'bounced', 'failed', NULL
    )),

    -- Metadata
    custom_fields JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX idx_report_executions_tenant ON report_executions(tenant_id);
CREATE INDEX idx_report_executions_saved_report ON report_executions(saved_report_id, executed_at DESC);
CREATE INDEX idx_report_executions_executed_by ON report_executions(executed_by, executed_at DESC);
CREATE INDEX idx_report_executions_status ON report_executions(status, executed_at DESC)
    WHERE status IN ('queued', 'running');
CREATE INDEX idx_report_executions_cache ON report_executions(cache_key, cache_expires_at)
    WHERE status = 'completed' AND cache_expires_at > NOW();
CREATE INDEX idx_report_executions_trigger ON report_executions(execution_trigger, executed_at DESC);

-- Trigger: Auto-update report execution stats in saved_reports
CREATE OR REPLACE FUNCTION update_report_execution_stats() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND NEW.saved_report_id IS NOT NULL THEN
        UPDATE saved_reports
        SET
            execution_count = execution_count + 1,
            last_executed_at = NEW.completed_at,
            last_executed_by = NEW.executed_by,
            average_execution_time_seconds = (
                COALESCE(average_execution_time_seconds * execution_count, 0) + NEW.execution_time_seconds
            ) / (execution_count + 1)
        WHERE id = NEW.saved_report_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_update_report_stats
    AFTER INSERT OR UPDATE ON report_executions
    FOR EACH ROW
    WHEN (NEW.status = 'completed')
    EXECUTE FUNCTION update_report_execution_stats();

-- Comments
COMMENT ON TABLE report_executions IS 'Report execution history with result caching and performance metrics';
COMMENT ON COLUMN report_executions.cache_key IS 'Hash of report config + parameters for caching identical reports';
COMMENT ON COLUMN report_executions.result_data IS 'Cached report data - may be NULL for large reports stored as files';

-- ============================================================================
-- Table: dashboards
-- Purpose: Custom user dashboards with widget layouts
-- ============================================================================

CREATE TABLE IF NOT EXISTS dashboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Dashboard identification
    dashboard_name VARCHAR(200) NOT NULL,
    dashboard_description TEXT,
    dashboard_icon VARCHAR(50),  -- Icon identifier or emoji

    -- Dashboard type
    dashboard_type VARCHAR(30) DEFAULT 'custom' CHECK (dashboard_type IN (
        'overview', 'executive', 'operations', 'maintenance', 'safety',
        'financial', 'custom'
    )),

    -- Layout configuration
    layout_type VARCHAR(20) DEFAULT 'grid' CHECK (layout_type IN (
        'grid', 'freeform', 'tabs', 'accordion'
    )),
    grid_columns INTEGER DEFAULT 12,
    widgets JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Structure: [{
    --   id, type, title, position: {x, y, w, h},
    --   config: {report_id, chart_type, refresh_interval, filters},
    --   styling: {backgroundColor, borderColor}
    -- }]

    -- Refresh settings
    auto_refresh_enabled BOOLEAN DEFAULT TRUE,
    auto_refresh_interval_seconds INTEGER DEFAULT 300,  -- 5 minutes
    last_refreshed_at TIMESTAMPTZ,

    -- Access control
    is_default BOOLEAN DEFAULT FALSE,  -- Default dashboard for user
    is_public BOOLEAN DEFAULT FALSE,
    owner_id UUID NOT NULL REFERENCES users(id),
    shared_with_users UUID[] DEFAULT '{}',
    shared_with_roles TEXT[] DEFAULT '{}',

    -- Display settings
    theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    color_scheme VARCHAR(50),  -- 'blue', 'green', 'corporate', etc.
    show_filters BOOLEAN DEFAULT TRUE,
    show_date_range BOOLEAN DEFAULT TRUE,
    show_export_button BOOLEAN DEFAULT TRUE,

    -- Date range for all widgets
    default_date_range VARCHAR(30) DEFAULT 'last_30_days',
    custom_date_from DATE,
    custom_date_to DATE,

    -- Usage tracking
    view_count INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMPTZ,
    last_viewed_by UUID REFERENCES users(id),

    -- Organization
    folder_path TEXT,
    tags TEXT[] DEFAULT '{}',
    sort_order INTEGER DEFAULT 0,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_template BOOLEAN DEFAULT FALSE,

    -- Metadata
    notes TEXT,
    custom_fields JSONB DEFAULT '{}'::jsonb,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_dashboards_tenant ON dashboards(tenant_id);
CREATE INDEX idx_dashboards_owner ON dashboards(owner_id);
CREATE INDEX idx_dashboards_type ON dashboards(dashboard_type, is_active);
CREATE INDEX idx_dashboards_default ON dashboards(owner_id, is_default) WHERE is_default = TRUE;
CREATE INDEX idx_dashboards_tags ON dashboards USING GIN(tags);
CREATE INDEX idx_dashboards_widgets ON dashboards USING GIN(widgets);

-- Trigger: Update timestamp
CREATE TRIGGER update_dashboards_timestamp
    BEFORE UPDATE ON dashboards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Ensure only one default dashboard per user
CREATE OR REPLACE FUNCTION enforce_single_default_dashboard() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = TRUE THEN
        UPDATE dashboards
        SET is_default = FALSE
        WHERE owner_id = NEW.owner_id
          AND id != NEW.id
          AND is_default = TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_one_default_dashboard
    BEFORE INSERT OR UPDATE ON dashboards
    FOR EACH ROW
    WHEN (NEW.is_default = TRUE)
    EXECUTE FUNCTION enforce_single_default_dashboard();

-- Comments
COMMENT ON TABLE dashboards IS 'Custom user dashboards with configurable widget layouts and auto-refresh';
COMMENT ON COLUMN dashboards.widgets IS 'Array of widget configurations with positions, data sources, and styling';

-- ============================================================================
-- Table: kpi_targets
-- Purpose: KPI goals and target tracking with alerting
-- ============================================================================

CREATE TABLE IF NOT EXISTS kpi_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- KPI identification
    kpi_name VARCHAR(200) NOT NULL,
    kpi_category VARCHAR(50) NOT NULL CHECK (kpi_category IN (
        'utilization', 'maintenance', 'fuel_efficiency', 'safety',
        'cost', 'compliance', 'driver_performance', 'sustainability'
    )),
    kpi_description TEXT,

    -- Measurement
    metric_type VARCHAR(50) NOT NULL,  -- 'vehicle_uptime', 'mpg', 'accidents_per_mile', etc.
    measurement_unit VARCHAR(50),  -- '%', 'mpg', 'accidents/million miles', '$', etc.
    data_source VARCHAR(100) NOT NULL,  -- Table/view where data comes from

    -- Target values
    target_value DECIMAL(12, 2) NOT NULL,
    target_operator VARCHAR(10) NOT NULL CHECK (target_operator IN ('>=', '>', '<=', '<', '=')),
    warning_threshold DECIMAL(12, 2),  -- Alert when approaching target miss
    critical_threshold DECIMAL(12, 2),  -- Critical alert

    -- Current performance
    current_value DECIMAL(12, 2),
    last_calculated_at TIMESTAMPTZ,
    calculation_frequency VARCHAR(20) DEFAULT 'daily' CHECK (calculation_frequency IN (
        'realtime', 'hourly', 'daily', 'weekly', 'monthly'
    )),

    -- Performance status
    status VARCHAR(20) GENERATED ALWAYS AS (
        CASE
            WHEN current_value IS NULL THEN 'unknown'
            WHEN target_operator = '>=' AND current_value >= target_value THEN 'on_track'
            WHEN target_operator = '>' AND current_value > target_value THEN 'on_track'
            WHEN target_operator = '<=' AND current_value <= target_value THEN 'on_track'
            WHEN target_operator = '<' AND current_value < target_value THEN 'on_track'
            WHEN target_operator = '=' AND current_value = target_value THEN 'on_track'
            WHEN critical_threshold IS NOT NULL AND (
                (target_operator IN ('>=', '>') AND current_value < critical_threshold) OR
                (target_operator IN ('<=', '<') AND current_value > critical_threshold)
            ) THEN 'critical'
            WHEN warning_threshold IS NOT NULL AND (
                (target_operator IN ('>=', '>') AND current_value < warning_threshold) OR
                (target_operator IN ('<=', '<') AND current_value > warning_threshold)
            ) THEN 'warning'
            ELSE 'off_track'
        END
    ) STORED,

    percent_to_target DECIMAL(5, 2) GENERATED ALWAYS AS (
        CASE
            WHEN target_value = 0 THEN NULL
            ELSE (current_value / target_value * 100)
        END
    ) STORED,

    -- Time period
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN (
        'daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'rolling_30_day',
        'rolling_90_day', 'ytd', 'custom'
    )),
    period_start_date DATE,
    period_end_date DATE,

    -- Historical tracking
    historical_values JSONB DEFAULT '[]'::jsonb,
    -- Structure: [{date, value, status}]

    -- Scope
    applies_to VARCHAR(30) CHECK (applies_to IN (
        'entire_fleet', 'vehicle_group', 'single_vehicle', 'driver', 'department', 'location'
    )),
    scope_id UUID,  -- ID of vehicle, driver, department, etc.

    -- Alerting
    alert_on_warning BOOLEAN DEFAULT TRUE,
    alert_on_critical BOOLEAN DEFAULT TRUE,
    alert_recipients TEXT[] DEFAULT '{}',
    last_alert_sent_at TIMESTAMPTZ,

    -- Visualization
    chart_type VARCHAR(30) DEFAULT 'gauge' CHECK (chart_type IN (
        'gauge', 'progress_bar', 'line_chart', 'number', 'trend'
    )),
    color_good VARCHAR(7) DEFAULT '#22c55e',  -- Green
    color_warning VARCHAR(7) DEFAULT '#f59e0b',  -- Orange
    color_critical VARCHAR(7) DEFAULT '#ef4444',  -- Red

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Metadata
    notes TEXT,
    custom_fields JSONB DEFAULT '{}'::jsonb,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_kpi_targets_tenant ON kpi_targets(tenant_id);
CREATE INDEX idx_kpi_targets_category ON kpi_targets(kpi_category, is_active);
CREATE INDEX idx_kpi_targets_status ON kpi_targets(status) WHERE is_active = TRUE;
CREATE INDEX idx_kpi_targets_scope ON kpi_targets(applies_to, scope_id);
CREATE INDEX idx_kpi_targets_period ON kpi_targets(period_start_date, period_end_date);
CREATE INDEX idx_kpi_targets_calculation ON kpi_targets(calculation_frequency, last_calculated_at)
    WHERE is_active = TRUE;

-- Trigger: Update timestamp
CREATE TRIGGER update_kpi_targets_timestamp
    BEFORE UPDATE ON kpi_targets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE kpi_targets IS 'KPI goals and target tracking with automated status calculation and alerting';
COMMENT ON COLUMN kpi_targets.status IS 'Auto-calculated: on_track, warning, critical, off_track, unknown';
COMMENT ON COLUMN kpi_targets.historical_values IS 'Array of historical performance data for trending';

-- ============================================================================
-- Table: benchmark_data
-- Purpose: Industry benchmark comparisons
-- ============================================================================

CREATE TABLE IF NOT EXISTS benchmark_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Benchmark identification
    benchmark_name VARCHAR(200) NOT NULL,
    benchmark_category VARCHAR(50) NOT NULL CHECK (benchmark_category IN (
        'utilization', 'maintenance', 'fuel_efficiency', 'safety',
        'cost', 'compliance', 'driver_performance', 'sustainability'
    )),

    -- Benchmark source
    data_source VARCHAR(100) NOT NULL,  -- 'NAFA', 'NTEA', 'AFLA', 'Internal', etc.
    source_url TEXT,
    data_year INTEGER NOT NULL,
    data_period VARCHAR(50),  -- 'Q1 2026', 'Annual 2025', etc.

    -- Industry segment
    industry_segment VARCHAR(100),  -- 'Government', 'Utilities', 'Construction', etc.
    fleet_size_category VARCHAR(50),  -- '1-50', '51-200', '201-500', '500+'
    geographic_region VARCHAR(100),  -- 'US National', 'Florida', 'Southeast', etc.

    -- Metric details
    metric_name VARCHAR(200) NOT NULL,
    metric_description TEXT,
    measurement_unit VARCHAR(50),

    -- Benchmark values
    percentile_10 DECIMAL(12, 2),  -- Bottom 10% (worst performers)
    percentile_25 DECIMAL(12, 2),  -- Bottom quartile
    percentile_50 DECIMAL(12, 2),  -- Median
    percentile_75 DECIMAL(12, 2),  -- Top quartile
    percentile_90 DECIMAL(12, 2),  -- Top 10% (best performers)
    average_value DECIMAL(12, 2),
    sample_size INTEGER,

    -- Our performance
    our_value DECIMAL(12, 2),
    our_percentile DECIMAL(5, 2),  -- Where we rank
    gap_to_median DECIMAL(12, 2),
    gap_to_top_quartile DECIMAL(12, 2),

    -- Analysis
    performance_rating VARCHAR(20) GENERATED ALWAYS AS (
        CASE
            WHEN our_percentile IS NULL THEN NULL
            WHEN our_percentile >= 75 THEN 'excellent'
            WHEN our_percentile >= 50 THEN 'good'
            WHEN our_percentile >= 25 THEN 'fair'
            ELSE 'needs_improvement'
        END
    ) STORED,

    -- Trend
    year_over_year_change DECIMAL(12, 2),
    trend_direction VARCHAR(20) CHECK (trend_direction IN ('improving', 'stable', 'declining', NULL)),

    -- Methodology
    calculation_methodology TEXT,
    data_collection_method VARCHAR(100),
    confidence_level DECIMAL(3, 2) CHECK (confidence_level >= 0 AND confidence_level <= 1),

    -- Status
    is_current BOOLEAN DEFAULT TRUE,

    -- Metadata
    notes TEXT,
    custom_fields JSONB DEFAULT '{}'::jsonb,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_benchmark_data_tenant ON benchmark_data(tenant_id);
CREATE INDEX idx_benchmark_data_category ON benchmark_data(benchmark_category, is_current);
CREATE INDEX idx_benchmark_data_source ON benchmark_data(data_source, data_year DESC);
CREATE INDEX idx_benchmark_data_industry ON benchmark_data(industry_segment, fleet_size_category);
CREATE INDEX idx_benchmark_data_performance ON benchmark_data(performance_rating) WHERE is_current = TRUE;

-- Trigger: Update timestamp
CREATE TRIGGER update_benchmark_data_timestamp
    BEFORE UPDATE ON benchmark_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE benchmark_data IS 'Industry benchmark data for comparing fleet performance against peers';
COMMENT ON COLUMN benchmark_data.our_percentile IS 'Our ranking percentile - higher is better (e.g., 75 means better than 75% of fleets)';

-- ============================================================================
-- Table: analytics_cache
-- Purpose: Pre-computed analytics for dashboard performance
-- ============================================================================

CREATE TABLE IF NOT EXISTS analytics_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Cache identification
    cache_key VARCHAR(200) NOT NULL,  -- Hash of query + parameters
    cache_category VARCHAR(50) NOT NULL CHECK (cache_category IN (
        'dashboard', 'report', 'kpi', 'widget', 'api_endpoint'
    )),

    -- Data source
    source_type VARCHAR(50) NOT NULL,  -- 'vehicle_metrics', 'fuel_summary', etc.
    source_query_hash VARCHAR(64),  -- SHA256 of actual SQL query

    -- Aggregation period
    aggregation_level VARCHAR(30) NOT NULL CHECK (aggregation_level IN (
        'realtime', 'hourly', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
    )),
    data_start_date DATE,
    data_end_date DATE,

    -- Cached data
    cached_result JSONB NOT NULL,
    result_type VARCHAR(30) CHECK (result_type IN (
        'single_value', 'time_series', 'grouped_summary', 'raw_data'
    )),
    row_count INTEGER,
    data_size_kb INTEGER,

    -- Freshness tracking
    computed_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    is_expired BOOLEAN GENERATED ALWAYS AS (expires_at < NOW()) STORED,
    ttl_seconds INTEGER,

    -- Refresh strategy
    refresh_strategy VARCHAR(30) DEFAULT 'on_demand' CHECK (refresh_strategy IN (
        'on_demand', 'scheduled', 'event_driven', 'never'
    )),
    next_refresh_at TIMESTAMPTZ,
    last_refreshed_at TIMESTAMPTZ,

    -- Usage tracking
    hit_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMPTZ,
    access_frequency_per_hour DECIMAL(8, 2),

    -- Performance metrics
    computation_time_ms INTEGER,
    source_rows_scanned INTEGER,

    -- Invalidation tracking
    invalidated_at TIMESTAMPTZ,
    invalidation_reason TEXT,
    auto_invalidate_on_tables TEXT[] DEFAULT '{}',  -- Tables that trigger invalidation

    -- Scope
    scope_type VARCHAR(30) CHECK (scope_type IN (
        'tenant_wide', 'user_specific', 'role_specific', 'entity_specific'
    )),
    scope_id UUID,

    -- Metadata
    custom_fields JSONB DEFAULT '{}'::jsonb,

    CONSTRAINT unique_cache_key_per_tenant UNIQUE (tenant_id, cache_key)
);

-- Indexes
CREATE INDEX idx_analytics_cache_tenant ON analytics_cache(tenant_id);
CREATE INDEX idx_analytics_cache_key ON analytics_cache(cache_key, tenant_id);
CREATE INDEX idx_analytics_cache_category ON analytics_cache(cache_category, is_expired);
CREATE INDEX idx_analytics_cache_expiration ON analytics_cache(expires_at)
    WHERE expires_at > NOW();
CREATE INDEX idx_analytics_cache_refresh ON analytics_cache(next_refresh_at)
    WHERE refresh_strategy = 'scheduled' AND expires_at > NOW();
CREATE INDEX idx_analytics_cache_hit_count ON analytics_cache(hit_count DESC, last_accessed_at DESC);
CREATE INDEX idx_analytics_cache_invalidate_tables ON analytics_cache USING GIN(auto_invalidate_on_tables);

-- Trigger: Update access stats
CREATE OR REPLACE FUNCTION update_cache_access_stats() RETURNS TRIGGER AS $$
BEGIN
    NEW.hit_count := NEW.hit_count + 1;
    NEW.last_accessed_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_cache_hits
    BEFORE UPDATE ON analytics_cache
    FOR EACH ROW
    WHEN (OLD.last_accessed_at IS DISTINCT FROM NEW.last_accessed_at)
    EXECUTE FUNCTION update_cache_access_stats();

-- Function: Invalidate cache by table
CREATE OR REPLACE FUNCTION invalidate_analytics_cache_by_table(
    p_table_name TEXT
) RETURNS INTEGER AS $$
DECLARE
    invalidated_count INTEGER;
BEGIN
    UPDATE analytics_cache
    SET
        invalidated_at = NOW(),
        invalidation_reason = 'Data source table updated: ' || p_table_name
    WHERE p_table_name = ANY(auto_invalidate_on_tables)
      AND invalidated_at IS NULL
      AND expires_at > NOW();

    GET DIAGNOSTICS invalidated_count = ROW_COUNT;
    RETURN invalidated_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION invalidate_analytics_cache_by_table IS 'Invalidates cached analytics when source data changes';

-- Function: Clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_analytics_cache() RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM analytics_cache
    WHERE expires_at < NOW() - INTERVAL '7 days'  -- Keep expired for 7 days for debugging
      OR (hit_count = 0 AND computed_at < NOW() - INTERVAL '30 days');

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION clean_expired_analytics_cache IS 'Removes stale cache entries older than 7 days';

-- Comments
COMMENT ON TABLE analytics_cache IS 'Pre-computed analytics cache for high-performance dashboards and reports';
COMMENT ON COLUMN analytics_cache.cache_key IS 'Hash of query + parameters for fast lookup';
COMMENT ON COLUMN analytics_cache.auto_invalidate_on_tables IS 'Array of table names that trigger cache invalidation when updated';

-- ============================================================================
-- Helper function: Get cached or compute analytics
-- ============================================================================

CREATE OR REPLACE FUNCTION get_or_compute_analytics(
    p_cache_key VARCHAR(200),
    p_tenant_id UUID,
    p_ttl_seconds INTEGER DEFAULT 3600
) RETURNS JSONB AS $$
DECLARE
    cached_data JSONB;
BEGIN
    -- Try to get from cache
    SELECT cached_result INTO cached_data
    FROM analytics_cache
    WHERE cache_key = p_cache_key
      AND tenant_id = p_tenant_id
      AND expires_at > NOW()
    LIMIT 1;

    IF cached_data IS NOT NULL THEN
        -- Update hit count
        UPDATE analytics_cache
        SET last_accessed_at = NOW()
        WHERE cache_key = p_cache_key AND tenant_id = p_tenant_id;

        RETURN cached_data;
    ELSE
        -- Return NULL indicating cache miss - caller should compute and cache
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_or_compute_analytics IS 'Fast lookup for cached analytics - returns NULL on cache miss';

-- ============================================================================
-- END OF MIGRATION 012
-- ============================================================================
