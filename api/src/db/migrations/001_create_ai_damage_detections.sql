-- ============================================================================
-- AI Damage Detection Tables
-- ============================================================================

-- Create ai_damage_detections table
CREATE TABLE IF NOT EXISTS ai_damage_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id VARCHAR(50) NOT NULL,
  detected_damages JSONB NOT NULL,
  overall_severity VARCHAR(20) NOT NULL CHECK (overall_severity IN ('minor', 'moderate', 'severe', 'critical')),
  total_estimated_cost JSONB NOT NULL,
  reported_by VARCHAR(255) NOT NULL,
  detection_date TIMESTAMP NOT NULL DEFAULT NOW(),
  model_version VARCHAR(50) NOT NULL,
  processing_time_ms INTEGER NOT NULL,
  image_url VARCHAR(1000),
  notes TEXT,
  location VARCHAR(255),
  incident_date TIMESTAMP,
  repair_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (repair_status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  repair_completed_by VARCHAR(255),
  repair_completed_date TIMESTAMP,
  work_orders_created JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_damage_detections_vehicle_id ON ai_damage_detections(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_ai_damage_detections_detection_date ON ai_damage_detections(detection_date DESC);
CREATE INDEX IF NOT EXISTS idx_ai_damage_detections_repair_status ON ai_damage_detections(repair_status);
CREATE INDEX IF NOT EXISTS idx_ai_damage_detections_overall_severity ON ai_damage_detections(overall_severity);
CREATE INDEX IF NOT EXISTS idx_ai_damage_detections_reported_by ON ai_damage_detections(reported_by);

-- Create GIN index for JSONB columns for fast queries
CREATE INDEX IF NOT EXISTS idx_ai_damage_detections_detected_damages ON ai_damage_detections USING GIN(detected_damages);

-- Add comment to table
COMMENT ON TABLE ai_damage_detections IS 'AI-powered vehicle damage detection records using YOLOv8 + ResNet-50';

-- Add column comments
COMMENT ON COLUMN ai_damage_detections.id IS 'Unique detection ID (UUID)';
COMMENT ON COLUMN ai_damage_detections.vehicle_id IS 'Vehicle ID that was inspected';
COMMENT ON COLUMN ai_damage_detections.detected_damages IS 'Array of detected damages with zones, types, severity, and costs';
COMMENT ON COLUMN ai_damage_detections.overall_severity IS 'Overall severity assessment: minor, moderate, severe, critical';
COMMENT ON COLUMN ai_damage_detections.total_estimated_cost IS 'Total estimated repair cost range (min, max, currency)';
COMMENT ON COLUMN ai_damage_detections.reported_by IS 'User ID who initiated the detection';
COMMENT ON COLUMN ai_damage_detections.detection_date IS 'When the AI detection was performed';
COMMENT ON COLUMN ai_damage_detections.model_version IS 'ML model version used (e.g., yolov8-resnet50-v1.2.0)';
COMMENT ON COLUMN ai_damage_detections.processing_time_ms IS 'ML processing time in milliseconds';
COMMENT ON COLUMN ai_damage_detections.image_url IS 'URL or path to the analyzed image';
COMMENT ON COLUMN ai_damage_detections.notes IS 'Additional notes from reporter';
COMMENT ON COLUMN ai_damage_detections.location IS 'Location where damage occurred';
COMMENT ON COLUMN ai_damage_detections.incident_date IS 'When the damage incident occurred';
COMMENT ON COLUMN ai_damage_detections.repair_status IS 'Repair status: pending, in_progress, completed, cancelled';
COMMENT ON COLUMN ai_damage_detections.repair_completed_by IS 'User ID who completed the repair';
COMMENT ON COLUMN ai_damage_detections.repair_completed_date IS 'When the repair was completed';
COMMENT ON COLUMN ai_damage_detections.work_orders_created IS 'Array of work order IDs created from this detection';

-- ============================================================================
-- Add AI detection fields to work_orders table
-- ============================================================================

-- Add columns to track AI-generated work orders
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS ai_detection_id UUID;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS ai_damage_id VARCHAR(100);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS damage_type VARCHAR(50);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS damage_zone VARCHAR(50);

-- Add foreign key constraint
ALTER TABLE work_orders ADD CONSTRAINT fk_work_orders_ai_detection
  FOREIGN KEY (ai_detection_id) REFERENCES ai_damage_detections(id) ON DELETE SET NULL;

-- Create index for AI work orders
CREATE INDEX IF NOT EXISTS idx_work_orders_ai_detection_id ON work_orders(ai_detection_id);

-- Add comments
COMMENT ON COLUMN work_orders.ai_detection_id IS 'Link to AI damage detection record that created this work order';
COMMENT ON COLUMN work_orders.ai_damage_id IS 'Specific damage ID from the AI detection';
COMMENT ON COLUMN work_orders.damage_type IS 'Type of damage: scratch, dent, crack, etc.';
COMMENT ON COLUMN work_orders.damage_zone IS 'Vehicle zone: front_bumper, hood, door, etc.';

-- ============================================================================
-- Create trigger to update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_ai_damage_detections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ai_damage_detections_updated_at
  BEFORE UPDATE ON ai_damage_detections
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_damage_detections_updated_at();

-- ============================================================================
-- Create view for damage detection summary
-- ============================================================================

CREATE OR REPLACE VIEW v_damage_detection_summary AS
SELECT
  d.id,
  d.vehicle_id,
  v.vehicle_number,
  v.make,
  v.model,
  d.overall_severity,
  jsonb_array_length(d.detected_damages) as damage_count,
  d.total_estimated_cost,
  d.repair_status,
  d.detection_date,
  d.reported_by,
  d.model_version,
  COUNT(wo.id) as work_orders_count
FROM ai_damage_detections d
LEFT JOIN vehicles v ON d.vehicle_id = v.id::text
LEFT JOIN work_orders wo ON wo.ai_detection_id = d.id
GROUP BY d.id, d.vehicle_id, v.vehicle_number, v.make, v.model,
         d.overall_severity, d.detected_damages, d.total_estimated_cost,
         d.repair_status, d.detection_date, d.reported_by, d.model_version;

COMMENT ON VIEW v_damage_detection_summary IS 'Summary view of AI damage detections with vehicle info and work order counts';
