-- ============================================================================
-- Fleet Management Orchestration Database Schema
-- ============================================================================
-- Production-first orchestration system for coordinating multi-agent builds
-- Created: 2025-11-26
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table: Top-level project tracking
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  repo TEXT NOT NULL,
  default_branch TEXT NOT NULL DEFAULT 'main',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tasks table: Hierarchical task breakdown
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','in_progress','blocked','review','done','failed')),
  percent_complete INT NOT NULL CHECK (percent_complete BETWEEN 0 AND 100) DEFAULT 0,
  priority INT NOT NULL DEFAULT 100,
  definition_of_done TEXT,
  dependencies JSONB DEFAULT '[]'::jsonb,
  verification_plan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Agents table: AI agent registry with LLM model tracking
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  llm_model TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  config JSONB DEFAULT '{}'::jsonb
);

-- Assignments table: Task-to-agent mappings with progress tracking
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending','in_progress','blocked','review','done','failed')),
  percent_complete INT NOT NULL CHECK (percent_complete BETWEEN 0 AND 100) DEFAULT 0,
  notes TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(task_id, agent_id)
);

-- Evidence table: Audit trail for all work artifacts
CREATE TABLE IF NOT EXISTS evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'pr', 'commit', 'test_report', 'deployment', 'research', etc.
  ref TEXT NOT NULL, -- URL, commit SHA, file path, etc.
  summary TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_assignments_task_id ON assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_assignments_agent_id ON assignments(agent_id);
CREATE INDEX IF NOT EXISTS idx_evidence_task_id ON evidence(task_id);
CREATE INDEX IF NOT EXISTS idx_evidence_agent_id ON evidence(agent_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assignments_updated_at ON assignments;
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Views for monitoring and reporting
-- ============================================================================

-- Active tasks view with agent assignments
CREATE OR REPLACE VIEW v_active_tasks AS
SELECT
  t.id,
  t.title,
  t.status,
  t.percent_complete,
  t.priority,
  p.name as project_name,
  a.name as agent_name,
  a.llm_model,
  ass.status as assignment_status,
  ass.started_at,
  t.created_at
FROM tasks t
JOIN projects p ON t.project_id = p.id
LEFT JOIN assignments ass ON t.id = ass.task_id
LEFT JOIN agents a ON ass.agent_id = a.id
WHERE t.status NOT IN ('done', 'failed')
ORDER BY t.priority DESC, t.created_at ASC;

-- Agent utilization view
CREATE OR REPLACE VIEW v_agent_utilization AS
SELECT
  a.id,
  a.name,
  a.role,
  a.llm_model,
  a.active,
  COUNT(CASE WHEN ass.status = 'in_progress' THEN 1 END) as active_tasks,
  COUNT(CASE WHEN ass.status = 'done' THEN 1 END) as completed_tasks,
  COUNT(CASE WHEN ass.status = 'failed' THEN 1 END) as failed_tasks,
  AVG(CASE WHEN ass.status = 'done' THEN ass.percent_complete END) as avg_completion_rate
FROM agents a
LEFT JOIN assignments ass ON a.id = ass.agent_id
GROUP BY a.id, a.name, a.role, a.llm_model, a.active;

-- Project progress view
CREATE OR REPLACE VIEW v_project_progress AS
SELECT
  p.id,
  p.name,
  p.repo,
  COUNT(t.id) as total_tasks,
  COUNT(CASE WHEN t.status = 'done' THEN 1 END) as completed_tasks,
  COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress_tasks,
  COUNT(CASE WHEN t.status = 'blocked' THEN 1 END) as blocked_tasks,
  COUNT(CASE WHEN t.status = 'failed' THEN 1 END) as failed_tasks,
  ROUND(AVG(t.percent_complete), 2) as overall_percent_complete
FROM projects p
LEFT JOIN tasks t ON p.id = t.project_id
GROUP BY p.id, p.name, p.repo;
