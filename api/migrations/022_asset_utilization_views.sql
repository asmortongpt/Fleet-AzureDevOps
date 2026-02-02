-- api/migrations/022_asset_utilization_views.sql

BEGIN;

-- Creating materialized view for daily asset utilization
CREATE MATERIALIZED VIEW vw_asset_daily_utilization AS
SELECT
    asset_id,
    DATE_TRUNC('day', usage_start_time) AS usage_date,
    ROUND((SUM(EXTRACT(EPOCH FROM (usage_end_time - usage_start_time))) / 86400) * 100, 2) AS daily_utilization_percentage
FROM
    asset_usage
GROUP BY
    asset_id,
    usage_date;

-- Creating index for faster query performance on vw_asset_daily_utilization
CREATE INDEX idx_vw_asset_daily_utilization_asset_id
ON vw_asset_daily_utilization (asset_id);

CREATE INDEX idx_vw_asset_daily_utilization_usage_date
ON vw_asset_daily_utilization (usage_date);

-- Creating materialized view for asset ROI summary
CREATE MATERIALIZED VIEW vw_asset_roi_summary AS
SELECT
    a.asset_id,
    a.purchase_price + COALESCE(SUM(m.cost), 0) AS total_cost_of_ownership,
    (a.purchase_price + COALESCE(SUM(m.cost), 0)) / NULLIF(SUM(a.mileage), 0) AS cost_per_mile,
    (a.purchase_price) / (COALESCE(SUM(r.revenue), 0) - COALESCE(SUM(m.cost), 0)) AS payback_period,
    a.purchase_price * (1 - EXTRACT(YEAR FROM age(current_date, a.purchase_date)) * a.depreciation_rate / 100) AS current_value
FROM
    assets a
LEFT JOIN maintenance m ON a.asset_id = m.asset_id
LEFT JOIN revenue r ON a.asset_id = r.asset_id
GROUP BY
    a.asset_id;

-- Creating index for faster query performance on vw_asset_roi_summary
CREATE INDEX idx_vw_asset_roi_summary_asset_id
ON vw_asset_roi_summary (asset_id);

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_asset_views()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY vw_asset_daily_utilization;
    REFRESH MATERIALIZED VIEW CONCURRENTLY vw_asset_roi_summary;
EXCEPTION
    WHEN others THEN
        RAISE EXCEPTION 'Failed to refresh materialized views: %', SQLERRM;
END;
$$;

-- Granting necessary permissions
GRANT SELECT ON vw_asset_daily_utilization TO analytics_user;
GRANT SELECT ON vw_asset_roi_summary TO analytics_user;

COMMIT;