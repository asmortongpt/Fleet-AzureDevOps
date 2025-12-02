-- Migration 007: ML-Powered Analytics & Intelligence
-- Created: 2025-11-11
-- Description: Driver Scorecard, Fleet Utilization Optimizer, and Cost Analysis Command Center

-- ============================================================================
-- DRIVER SCORECARD TABLES
-- ============================================================================

-- Driver scores - Real-time driver performance tracking
CREATE TABLE IF NOT EXISTS driver_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,

  -- Score components (0-100 each)
  safety_score DECIMAL(5,2) DEFAULT 0,
  efficiency_score DECIMAL(5,2) DEFAULT 0,
  compliance_score DECIMAL(5,2) DEFAULT 0,
  overall_score DECIMAL(5,2) DEFAULT 0,

  -- Safety metrics
  incidents_count INTEGER DEFAULT 0,
  violations_count INTEGER DEFAULT 0,
  harsh_braking_count INTEGER DEFAULT 0,
  harsh_acceleration_count INTEGER DEFAULT 0,
  harsh_cornering_count INTEGER DEFAULT 0,
  speeding_events_count INTEGER DEFAULT 0,

  -- Efficiency metrics
  avg_fuel_economy DECIMAL(10,2),
  idle_time_hours DECIMAL(10,2) DEFAULT 0,
  optimal_route_adherence DECIMAL(5,2) DEFAULT 100,

  -- Compliance metrics
  hos_violations_count INTEGER DEFAULT 0,
  inspection_completion_rate DECIMAL(5,2) DEFAULT 100,
  documentation_compliance DECIMAL(5,2) DEFAULT 100,

  -- Performance trends
  trend VARCHAR(20) DEFAULT 'stable' CHECK (trend IN ('improving', 'stable', 'declining')),
  rank_position INTEGER,
  percentile DECIMAL(5,2),

  -- Time period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_driver_period UNIQUE (driver_id, period_start, period_end)
);

CREATE INDEX idx_driver_scores_tenant_id ON driver_scores(tenant_id);
CREATE INDEX idx_driver_scores_driver_id ON driver_scores(driver_id);
CREATE INDEX idx_driver_scores_overall_score ON driver_scores(overall_score DESC);
CREATE INDEX idx_driver_scores_period ON driver_scores(period_start, period_end);

-- Driver achievements - Gamification badges
CREATE TABLE IF NOT EXISTS driver_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,

  achievement_type VARCHAR(100) NOT NULL,
  achievement_name VARCHAR(255) NOT NULL,
  achievement_description TEXT,
  icon VARCHAR(50),
  points INTEGER DEFAULT 0,

  -- Achievement data
  metric_value DECIMAL(10,2),
  threshold_met DECIMAL(10,2),

  earned_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_driver_achievement UNIQUE (driver_id, achievement_type, earned_at)
);

CREATE INDEX idx_driver_achievements_tenant_id ON driver_achievements(tenant_id);
CREATE INDEX idx_driver_achievements_driver_id ON driver_achievements(driver_id);
CREATE INDEX idx_driver_achievements_type ON driver_achievements(achievement_type);
CREATE INDEX idx_driver_achievements_earned_at ON driver_achievements(earned_at DESC);

-- ============================================================================
-- FLEET UTILIZATION TABLES
-- ============================================================================

-- Vehicle utilization metrics
CREATE TABLE IF NOT EXISTS utilization_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,

  -- Utilization data
  total_hours DECIMAL(10,2) DEFAULT 0,
  active_hours DECIMAL(10,2) DEFAULT 0,
  idle_hours DECIMAL(10,2) DEFAULT 0,
  maintenance_hours DECIMAL(10,2) DEFAULT 0,
  utilization_rate DECIMAL(5,2) DEFAULT 0, -- Percentage

  -- Usage data
  total_miles DECIMAL(10,2) DEFAULT 0,
  trips_count INTEGER DEFAULT 0,
  avg_trip_length DECIMAL(10,2) DEFAULT 0,

  -- Efficiency metrics
  revenue_per_hour DECIMAL(10,2),
  cost_per_mile DECIMAL(10,2),
  roi DECIMAL(10,2),

  -- Recommendations
  recommendation TEXT,
  recommendation_type VARCHAR(50), -- 'retire', 'reassign', 'optimize', 'maintain'
  potential_savings DECIMAL(10,2),

  -- Time period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_vehicle_period UNIQUE (vehicle_id, period_start, period_end)
);

CREATE INDEX idx_utilization_metrics_tenant_id ON utilization_metrics(tenant_id);
CREATE INDEX idx_utilization_metrics_vehicle_id ON utilization_metrics(vehicle_id);
CREATE INDEX idx_utilization_metrics_utilization_rate ON utilization_metrics(utilization_rate);
CREATE INDEX idx_utilization_metrics_period ON utilization_metrics(period_start, period_end);

-- Fleet optimization recommendations
CREATE TABLE IF NOT EXISTS fleet_optimization_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  recommendation_type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),

  -- Impact analysis
  potential_savings DECIMAL(10,2),
  implementation_cost DECIMAL(10,2),
  payback_period_months INTEGER,
  confidence_score DECIMAL(5,2), -- ML model confidence

  -- Related entities
  vehicle_ids UUID[],
  driver_ids UUID[],

  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'implemented', 'rejected')),

  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by UUID REFERENCES users(id),

  metadata JSONB
);

CREATE INDEX idx_fleet_optimization_tenant_id ON fleet_optimization_recommendations(tenant_id);
CREATE INDEX idx_fleet_optimization_status ON fleet_optimization_recommendations(status);
CREATE INDEX idx_fleet_optimization_priority ON fleet_optimization_recommendations(priority);

-- ============================================================================
-- COST ANALYSIS TABLES
-- ============================================================================

-- Comprehensive cost tracking
CREATE TABLE IF NOT EXISTS cost_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Cost categories
  cost_category VARCHAR(100) NOT NULL,
  cost_subcategory VARCHAR(100),

  -- Entity relations
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  route_id UUID,
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,

  -- Cost details
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  description TEXT,

  -- Tracking
  transaction_date DATE NOT NULL,
  invoice_number VARCHAR(100),
  is_budgeted BOOLEAN DEFAULT FALSE,
  is_anomaly BOOLEAN DEFAULT FALSE,

  -- Analysis
  cost_per_mile DECIMAL(10,2),
  cost_per_hour DECIMAL(10,2),
  variance_from_budget DECIMAL(10,2),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  metadata JSONB
);

CREATE INDEX idx_cost_tracking_tenant_id ON cost_tracking(tenant_id);
CREATE INDEX idx_cost_tracking_category ON cost_tracking(cost_category);
CREATE INDEX idx_cost_tracking_vehicle_id ON cost_tracking(vehicle_id);
CREATE INDEX idx_cost_tracking_driver_id ON cost_tracking(driver_id);
CREATE INDEX idx_cost_tracking_transaction_date ON cost_tracking(transaction_date DESC);
CREATE INDEX idx_cost_tracking_is_anomaly ON cost_tracking(is_anomaly) WHERE is_anomaly = TRUE;

-- Budget tracking
CREATE TABLE IF NOT EXISTS budget_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  budget_category VARCHAR(100) NOT NULL,
  allocated_amount DECIMAL(10,2) NOT NULL,
  spent_amount DECIMAL(10,2) DEFAULT 0,
  remaining_amount DECIMAL(10,2),

  fiscal_year INTEGER NOT NULL,
  fiscal_quarter INTEGER CHECK (fiscal_quarter BETWEEN 1 AND 4),

  alert_threshold DECIMAL(5,2) DEFAULT 90, -- Alert at 90% spent

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_budget_period UNIQUE (tenant_id, budget_category, fiscal_year, fiscal_quarter)
);

CREATE INDEX idx_budget_allocations_tenant_id ON budget_allocations(tenant_id);
CREATE INDEX idx_budget_allocations_fiscal_year ON budget_allocations(fiscal_year);

-- ============================================================================
-- ML PREDICTIONS & FORECASTING
-- ============================================================================

-- ML predictions storage
CREATE TABLE IF NOT EXISTS ml_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  prediction_type VARCHAR(100) NOT NULL, -- 'cost_forecast', 'utilization_forecast', 'maintenance_prediction', etc.
  entity_type VARCHAR(50), -- 'vehicle', 'driver', 'fleet', 'route'
  entity_id UUID,

  -- Prediction data
  predicted_value DECIMAL(10,2),
  confidence_score DECIMAL(5,2),
  prediction_date DATE NOT NULL,

  -- Model info
  model_name VARCHAR(100),
  model_version VARCHAR(50),
  training_date TIMESTAMP,

  -- Features used
  features JSONB,

  -- Actual vs predicted (for model improvement)
  actual_value DECIMAL(10,2),
  prediction_error DECIMAL(10,2),

  created_at TIMESTAMP DEFAULT NOW(),

  metadata JSONB
);

CREATE INDEX idx_ml_predictions_tenant_id ON ml_predictions(tenant_id);
CREATE INDEX idx_ml_predictions_type ON ml_predictions(prediction_type);
CREATE INDEX idx_ml_predictions_entity ON ml_predictions(entity_type, entity_id);
CREATE INDEX idx_ml_predictions_date ON ml_predictions(prediction_date);

-- ML model performance tracking
CREATE TABLE IF NOT EXISTS ml_model_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  model_name VARCHAR(100) NOT NULL,
  model_version VARCHAR(50) NOT NULL,
  model_type VARCHAR(100) NOT NULL,

  -- Performance metrics
  accuracy DECIMAL(5,2),
  precision_score DECIMAL(5,2),
  recall DECIMAL(5,2),
  f1_score DECIMAL(5,2),
  mean_absolute_error DECIMAL(10,2),
  root_mean_squared_error DECIMAL(10,2),

  -- Training info
  training_samples INTEGER,
  training_duration_seconds INTEGER,
  training_date TIMESTAMP NOT NULL,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  deployment_date TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),

  metadata JSONB
);

CREATE INDEX idx_ml_model_performance_tenant_id ON ml_model_performance(tenant_id);
CREATE INDEX idx_ml_model_performance_model ON ml_model_performance(model_name, model_version);
CREATE INDEX idx_ml_model_performance_active ON ml_model_performance(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================

CREATE TRIGGER update_driver_scores_updated_at BEFORE UPDATE ON driver_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_utilization_metrics_updated_at BEFORE UPDATE ON utilization_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cost_tracking_updated_at BEFORE UPDATE ON cost_tracking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_allocations_updated_at BEFORE UPDATE ON budget_allocations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

DO $$
DECLARE
  table_name text;
BEGIN
  FOR table_name IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN (
      'driver_scores', 'driver_achievements', 'utilization_metrics',
      'fleet_optimization_recommendations', 'cost_tracking', 'budget_allocations',
      'ml_predictions', 'ml_model_performance'
    )
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE %I TO fleet_user', table_name);
  END LOOP;
END $$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE driver_scores IS 'ML-based driver performance scoring with gamification';
COMMENT ON TABLE driver_achievements IS 'Achievement badges and gamification for driver engagement';
COMMENT ON TABLE utilization_metrics IS 'Vehicle utilization tracking and optimization insights';
COMMENT ON TABLE fleet_optimization_recommendations IS 'AI-generated fleet optimization recommendations';
COMMENT ON TABLE cost_tracking IS 'Comprehensive cost tracking across all categories';
COMMENT ON TABLE budget_allocations IS 'Budget planning and variance tracking';
COMMENT ON TABLE ml_predictions IS 'ML model predictions for forecasting and optimization';
COMMENT ON TABLE ml_model_performance IS 'Track ML model accuracy and performance over time';
