-- ============================================================================
-- Fleet Frontend Refactoring Orchestration Database Schema
-- Multi-Agent Build System with Progress Tracking
-- ============================================================================

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS evidence CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS agents CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- ============================================================================
-- PROJECTS TABLE
-- Tracks high-level projects (e.g., "Fleet Frontend Refactoring")
-- ============================================================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  repo TEXT NOT NULL,
  default_branch TEXT NOT NULL DEFAULT 'main',
  github_url TEXT,
  azure_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL CHECK (status IN ('planning','active','paused','completed','failed')) DEFAULT 'planning',
  percent_complete INT NOT NULL CHECK (percent_complete BETWEEN 0 AND 100) DEFAULT 0
);

-- ============================================================================
-- TASKS TABLE
-- Hierarchical task structure with parent-child relationships
-- Stores percent_complete for granular progress tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','in_progress','blocked','review','done','failed')) DEFAULT 'pending',
  percent_complete INT NOT NULL CHECK (percent_complete BETWEEN 0 AND 100) DEFAULT 0,
  priority INT NOT NULL DEFAULT 100,
  dependencies JSONB DEFAULT '[]'::jsonb, -- Array of task IDs that must complete first
  dod TEXT, -- Definition of Done
  inputs TEXT, -- Required inputs
  outputs TEXT, -- Expected outputs
  verification_plan TEXT, -- How to verify completion
  estimated_hours INT,
  actual_hours INT,
  branch_name TEXT,
  pr_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- ============================================================================
-- AGENTS TABLE
-- Specialized agents: planner, coder, tester, reviewer, researcher, etc.
-- Tracks which LLM model powers each agent
-- ============================================================================
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  llm_model TEXT NOT NULL, -- e.g., claude-sonnet-4-5, gpt-4.5-preview
  role TEXT NOT NULL, -- e.g., coder, tester, reviewer, planner, devops
  capabilities JSONB DEFAULT '{}'::jsonb, -- JSON array of capabilities
  max_concurrent_tasks INT NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- ASSIGNMENTS TABLE
-- Maps agents to tasks with status and percent_complete tracking
-- Allows resumability after interruptions
-- ============================================================================
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending','in_progress','blocked','review','done','failed')) DEFAULT 'pending',
  percent_complete INT NOT NULL CHECK (percent_complete BETWEEN 0 AND 100) DEFAULT 0,
  notes TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  retry_count INT DEFAULT 0,
  error_log TEXT,
  UNIQUE(task_id, agent_id)
);

-- ============================================================================
-- EVIDENCE TABLE
-- Audit trail: PRs, commits, test reports, reviews, research citations
-- Provides observability and traceability
-- ============================================================================
CREATE TABLE IF NOT EXISTS evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- pr, commit, test_report, review, citation, decision
  ref TEXT NOT NULL, -- URL, commit SHA, file path, citation URL
  summary TEXT,
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional structured data
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_assignments_task_id ON assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_assignments_agent_id ON assignments(agent_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
CREATE INDEX IF NOT EXISTS idx_evidence_task_id ON evidence(task_id);
CREATE INDEX IF NOT EXISTS idx_evidence_agent_id ON evidence(agent_id);
CREATE INDEX IF NOT EXISTS idx_evidence_type ON evidence(type);

-- ============================================================================
-- FUNCTIONS FOR AUTO-UPDATE TIMESTAMPS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-updating timestamps
CREATE TRIGGER update_projects_modtime BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_tasks_modtime BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_assignments_modtime BEFORE UPDATE ON assignments FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ============================================================================
-- FUNCTION: Calculate Overall Project Percent Complete
-- Aggregates percent_complete from all root-level tasks
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_project_percent_complete(project_uuid UUID)
RETURNS INT AS $$
DECLARE
  overall_percent INT;
BEGIN
  SELECT COALESCE(AVG(percent_complete)::INT, 0)
  INTO overall_percent
  FROM tasks
  WHERE project_id = project_uuid AND parent_id IS NULL;

  RETURN overall_percent;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Get Next Ready Tasks
-- Returns tasks that are ready to be assigned (all dependencies met)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_ready_tasks(project_uuid UUID, limit_count INT DEFAULT 10)
RETURNS TABLE(
  task_id UUID,
  task_title TEXT,
  task_priority INT,
  estimated_hours INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.title, t.priority, t.estimated_hours
  FROM tasks t
  WHERE t.project_id = project_uuid
    AND t.status = 'pending'
    -- All dependencies must be done
    AND NOT EXISTS (
      SELECT 1 FROM tasks dep
      WHERE dep.id IN (SELECT jsonb_array_elements_text(t.dependencies)::UUID)
        AND dep.status != 'done'
    )
  ORDER BY t.priority DESC, t.created_at ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE projects IS 'High-level projects tracked by the orchestration system';
COMMENT ON TABLE tasks IS 'Hierarchical task structure with percent_complete tracking';
COMMENT ON TABLE agents IS 'Specialized AI agents with specific roles and LLM models';
COMMENT ON TABLE assignments IS 'Maps agents to tasks with granular progress tracking';
COMMENT ON TABLE evidence IS 'Audit trail of all work products (PRs, commits, tests, etc.)';
