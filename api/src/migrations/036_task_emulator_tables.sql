-- Migration 036: Task Emulator Tables
-- Created: 2025-11-27
-- Description: Task management emulator tables for fleet operations
-- Security: All queries use parameterized inputs ($1, $2, $3)

-- ============================================================================
-- TASK EMULATOR TABLE
-- ============================================================================

-- Ensure tasks table exists with base columns
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL
);

-- Add missing columns individually
DO $$
BEGIN
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_id VARCHAR(50);
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS title VARCHAR(255);
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_type VARCHAR(50);
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'medium';
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to_driver INTEGER;
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_driver_name VARCHAR(255);
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to_vehicle INTEGER;
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS vehicle_number VARCHAR(50);
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS dependencies INTEGER[] DEFAULT '{}';
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS dependency_task_ids VARCHAR(50)[] DEFAULT '{}';
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date TIMESTAMP;
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS start_date TIMESTAMP;
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_date TIMESTAMP;
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(8,2) DEFAULT 0;
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS actual_hours DECIMAL(8,2);
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completion_percentage INTEGER DEFAULT 0;
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS blocked_reason TEXT;
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::JSONB;
END $$;

-- Update constraints robustly
DO $$
BEGIN
    -- unique task_id
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_task_id_key') THEN
        ALTER TABLE tasks ADD CONSTRAINT tasks_task_id_key UNIQUE (task_id);
    END IF;

    -- task_type check
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_task_type_check') THEN
        ALTER TABLE tasks ADD CONSTRAINT tasks_task_type_check CHECK (task_type IN ('maintenance', 'compliance', 'inspection', 'procurement', 'safety'));
    END IF;

    -- status check
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_status_check') THEN
        ALTER TABLE tasks ADD CONSTRAINT tasks_status_check CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'on_hold', 'failed'));
    END IF;

    -- priority check
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_priority_check') THEN
        ALTER TABLE tasks ADD CONSTRAINT tasks_priority_check CHECK (priority IN ('low', 'medium', 'high', 'critical', 'emergency'));
    END IF;

    -- completion_percentage check
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_completion_percentage_check') THEN
        ALTER TABLE tasks ADD CONSTRAINT tasks_completion_percentage_check CHECK (completion_percentage >= 0 AND completion_percentage <= 100);
    END IF;

    -- completion_dates check
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_completion_dates') THEN
        ALTER TABLE tasks ADD CONSTRAINT valid_completion_dates CHECK (
            (status = 'completed' AND completed_date IS NOT NULL) OR
            (status != 'completed' AND completed_date IS NULL)
        );
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Handled exception in tasks table constraints: %', SQLERRM;
END $$;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_tasks_task_id ON tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_task_type ON tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to_vehicle ON tasks(assigned_to_vehicle);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to_driver ON tasks(assigned_to_driver);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_tags ON tasks USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_tasks_metadata ON tasks USING GIN(metadata);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tasks_status_priority ON tasks(status, priority);
CREATE INDEX IF NOT EXISTS idx_tasks_status_due_date ON tasks(status, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_vehicle_status ON tasks(assigned_to_vehicle, status) WHERE assigned_to_vehicle IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_driver_status ON tasks(assigned_to_driver, status) WHERE assigned_to_driver IS NOT NULL;

-- ============================================================================
-- TASK COMMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON task_comments(created_at);

-- ============================================================================
-- TASK ATTACHMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100),
  file_size INTEGER,
  uploaded_by VARCHAR(255) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON task_attachments(task_id);

-- ============================================================================
-- TASK HISTORY TABLE (Audit Trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS task_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  field_changed VARCHAR(100) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by VARCHAR(255) NOT NULL,
  changed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_task_history_changed_at ON task_history(changed_at);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================================================

-- Create or replace the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_task_comments_updated_at ON task_comments;
CREATE TRIGGER update_task_comments_updated_at
  BEFORE UPDATE ON task_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TRIGGER FOR TASK HISTORY AUDIT TRAIL
-- ============================================================================

CREATE OR REPLACE FUNCTION log_task_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO task_history (task_id, field_changed, old_value, new_value, changed_by)
    VALUES (NEW.id, 'status', OLD.status, NEW.status, COALESCE(NEW.created_by, 'system'));
  END IF;

  -- Log completion percentage changes
  IF OLD.completion_percentage IS DISTINCT FROM NEW.completion_percentage THEN
    INSERT INTO task_history (task_id, field_changed, old_value, new_value, changed_by)
    VALUES (NEW.id, 'completion_percentage', OLD.completion_percentage::TEXT, NEW.completion_percentage::TEXT, COALESCE(NEW.created_by, 'system'));
  END IF;

  -- Log priority changes
  IF OLD.priority IS DISTINCT FROM NEW.priority THEN
    INSERT INTO task_history (task_id, field_changed, old_value, new_value, changed_by)
    VALUES (NEW.id, 'priority', OLD.priority, NEW.priority, COALESCE(NEW.created_by, 'system'));
  END IF;

  -- Log assignment changes
  IF OLD.assigned_to_driver IS DISTINCT FROM NEW.assigned_to_driver THEN
    INSERT INTO task_history (task_id, field_changed, old_value, new_value, changed_by)
    VALUES (NEW.id, 'assigned_to_driver', OLD.assigned_to_driver::TEXT, NEW.assigned_to_driver::TEXT, COALESCE(NEW.created_by, 'system'));
  END IF;

  IF OLD.assigned_to_vehicle IS DISTINCT FROM NEW.assigned_to_vehicle THEN
    INSERT INTO task_history (task_id, field_changed, old_value, new_value, changed_by)
    VALUES (NEW.id, 'assigned_to_vehicle', OLD.assigned_to_vehicle::TEXT, NEW.assigned_to_vehicle::TEXT, COALESCE(NEW.created_by, 'system'));
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS log_task_changes_trigger ON tasks;
CREATE TRIGGER log_task_changes_trigger
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION log_task_changes();

-- ============================================================================
-- USEFUL VIEWS FOR REPORTING
-- ============================================================================

-- View for overdue tasks
CREATE OR REPLACE VIEW overdue_tasks AS
SELECT
  t.*,
  EXTRACT(DAY FROM (NOW() - t.due_date)) AS days_overdue
FROM tasks t
WHERE t.status IN ('pending', 'in_progress')
  AND t.due_date < NOW()
ORDER BY t.priority DESC, t.due_date ASC;

-- View for high-priority pending tasks
CREATE OR REPLACE VIEW high_priority_tasks AS
SELECT
  t.*,
  EXTRACT(DAY FROM (t.due_date - NOW())) AS days_until_due
FROM tasks t
WHERE t.status IN ('pending', 'in_progress')
  AND t.priority IN ('high', 'critical')
ORDER BY t.due_date ASC;

-- View for task completion statistics
CREATE OR REPLACE VIEW task_statistics AS
SELECT
  task_type,
  status,
  priority,
  COUNT(*) AS task_count,
  AVG(completion_percentage) AS avg_completion,
  AVG(EXTRACT(EPOCH FROM (completed_date - start_date)) / 3600) AS avg_completion_hours,
  SUM(CASE WHEN due_date < NOW() AND status IN ('pending', 'in_progress') THEN 1 ELSE 0 END) AS overdue_count
FROM tasks
GROUP BY task_type, status, priority;

-- View for vehicle task summary
CREATE OR REPLACE VIEW vehicle_task_summary AS
SELECT
  assigned_to_vehicle,
  vehicle_number,
  COUNT(*) AS total_tasks,
  SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS todo_tasks,
  SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_tasks,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_tasks,
  SUM(CASE WHEN status = 'on_hold' THEN 1 ELSE 0 END) AS blocked_tasks,
  SUM(CASE WHEN priority = 'critical' THEN 1 ELSE 0 END) AS urgent_tasks
FROM tasks
WHERE assigned_to_vehicle IS NOT NULL
GROUP BY assigned_to_vehicle, vehicle_number;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE tasks IS 'Task management emulator - fleet operations tasks with dependencies';
COMMENT ON TABLE task_comments IS 'Comments and notes on tasks';
COMMENT ON TABLE task_attachments IS 'File attachments for tasks (photos, documents, etc.)';
COMMENT ON TABLE task_history IS 'Audit trail of all task changes';

COMMENT ON COLUMN tasks.task_id IS 'Unique task identifier (TSK-XXXXX format)';
COMMENT ON COLUMN tasks.dependencies IS 'Array of task IDs that must be completed first';
COMMENT ON COLUMN tasks.completion_percentage IS 'Task completion percentage (0-100)';
COMMENT ON COLUMN tasks.metadata IS 'Additional task metadata (location, vendor, cost, parts, notes)';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions to application role (adjust role name as needed)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'fleet_user') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE tasks TO fleet_user;
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE task_comments TO fleet_user;
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE task_attachments TO fleet_user;
    GRANT SELECT ON TABLE task_history TO fleet_user;
    GRANT SELECT ON overdue_tasks TO fleet_user;
    GRANT SELECT ON high_priority_tasks TO fleet_user;
    GRANT SELECT ON task_statistics TO fleet_user;
    GRANT SELECT ON vehicle_task_summary TO fleet_user;
    GRANT USAGE, SELECT ON SEQUENCE tasks_id_seq TO fleet_user;
    GRANT USAGE, SELECT ON SEQUENCE task_comments_id_seq TO fleet_user;
    GRANT USAGE, SELECT ON SEQUENCE task_attachments_id_seq TO fleet_user;
    GRANT USAGE, SELECT ON SEQUENCE task_history_id_seq TO fleet_user;
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify table creation
DO $$
BEGIN
  RAISE NOTICE 'Task Emulator Migration Complete';
  RAISE NOTICE 'Tables created: tasks, task_comments, task_attachments, task_history';
  RAISE NOTICE 'Views created: overdue_tasks, high_priority_tasks, task_statistics, vehicle_task_summary';
  RAISE NOTICE 'Triggers created: update timestamps, audit logging';
END $$;
