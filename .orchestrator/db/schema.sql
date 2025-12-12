-- Fleet Agent Orchestration Database Schema
-- PostgreSQL 14+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  repo TEXT NOT NULL,
  default_branch TEXT NOT NULL DEFAULT 'main',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  epic_number INT NOT NULL,
  issue_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','in_progress','blocked','review','done','failed')),
  percent_complete INT NOT NULL CHECK (percent_complete BETWEEN 0 AND 100) DEFAULT 0,
  priority INT NOT NULL DEFAULT 100,
  estimated_hours DECIMAL(10,2) NOT NULL,
  actual_hours DECIMAL(10,2) DEFAULT 0,
  branch_name TEXT,
  pr_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  llm_model TEXT NOT NULL,
  role TEXT NOT NULL,
  vm_host TEXT,
  vm_resource_group TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_heartbeat TIMESTAMPTZ
);

-- Assignments table
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

-- Evidence table
CREATE TABLE IF NOT EXISTS evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('commit','pr','test','build','deployment','research','citation')),
  ref TEXT NOT NULL,
  summary TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Progress snapshots (for time-series analysis)
CREATE TABLE IF NOT EXISTS progress_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  overall_percent DECIMAL(5,2) NOT NULL,
  active_agents INT NOT NULL,
  tasks_pending INT NOT NULL,
  tasks_in_progress INT NOT NULL,
  tasks_done INT NOT NULL,
  velocity_multiplier DECIMAL(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_epic ON tasks(epic_number);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_assignments_task ON assignments(task_id);
CREATE INDEX idx_assignments_agent ON assignments(agent_id);
CREATE INDEX idx_assignments_status ON assignments(status);
CREATE INDEX idx_evidence_task ON evidence(task_id);
CREATE INDEX idx_evidence_agent ON evidence(agent_id);
CREATE INDEX idx_agents_active ON agents(active);
CREATE INDEX idx_progress_snapshots_project ON progress_snapshots(project_id, created_at DESC);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View: Agent status with current assignments
CREATE OR REPLACE VIEW agent_status AS
SELECT
  a.id,
  a.name,
  a.llm_model,
  a.role,
  a.vm_host,
  a.active,
  a.last_heartbeat,
  COUNT(DISTINCT asg.id) FILTER (WHERE asg.status = 'in_progress') as assignments_in_progress,
  AVG(asg.percent_complete) FILTER (WHERE asg.status = 'in_progress') as avg_progress,
  CASE
    WHEN a.last_heartbeat < now() - interval '5 minutes' THEN 'stale'
    WHEN a.last_heartbeat < now() - interval '2 minutes' THEN 'warning'
    ELSE 'healthy'
  END as health_status
FROM agents a
LEFT JOIN assignments asg ON a.id = asg.agent_id
GROUP BY a.id, a.name, a.llm_model, a.role, a.vm_host, a.active, a.last_heartbeat;

-- View: Epic progress summary
CREATE OR REPLACE VIEW epic_progress AS
SELECT
  epic_number,
  COUNT(*) as total_tasks,
  COUNT(*) FILTER (WHERE status = 'done') as completed_tasks,
  COUNT(*) FILTER (WHERE status = 'in_progress') as active_tasks,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_tasks,
  COUNT(*) FILTER (WHERE status = 'blocked') as blocked_tasks,
  SUM(estimated_hours) as total_estimated_hours,
  SUM(actual_hours) as total_actual_hours,
  ROUND(AVG(percent_complete), 2) as avg_percent_complete
FROM tasks
GROUP BY epic_number
ORDER BY epic_number;

-- View: Task dependencies (for scheduling)
CREATE OR REPLACE VIEW task_dependencies AS
SELECT
  t.id,
  t.title,
  t.status,
  t.epic_number,
  t.issue_number,
  t.parent_id,
  p.title as parent_title,
  p.status as parent_status,
  CASE
    WHEN p.id IS NULL OR p.status = 'done' THEN TRUE
    ELSE FALSE
  END as ready_to_start
FROM tasks t
LEFT JOIN tasks p ON t.parent_id = p.id;

COMMENT ON TABLE projects IS 'Git repositories managed by the orchestrator';
COMMENT ON TABLE tasks IS 'Individual work items (epics, issues) from the remediation plan';
COMMENT ON TABLE agents IS 'Autonomous coding agents (local + VMs + AKS)';
COMMENT ON TABLE assignments IS 'Assignment of tasks to agents with progress tracking';
COMMENT ON TABLE evidence IS 'Audit trail of all work performed (commits, PRs, tests)';
COMMENT ON TABLE progress_snapshots IS 'Time-series snapshots for velocity calculations';
