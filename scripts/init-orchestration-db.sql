-- Fleet Showroom Multi-LLM Orchestration Database Schema
-- This creates the database structure for production-grade task orchestration

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  repo TEXT NOT NULL,
  default_branch TEXT NOT NULL DEFAULT 'main',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  parent_id UUID REFERENCES tasks(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','in_progress','blocked','review','done','failed')),
  percent_complete INT NOT NULL CHECK (percent_complete BETWEEN 0 AND 100) DEFAULT 0,
  priority INT NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider TEXT NOT NULL,        -- e.g., 'anthropic','openai','google','mistral','groq'
  llm_model TEXT NOT NULL,       -- resolved model id
  role TEXT NOT NULL,            -- coder, reviewer, tester, planner, researcher, devops, security, perf, pr-manager
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id),
  agent_id UUID REFERENCES agents(id),
  status TEXT NOT NULL CHECK (status IN ('pending','in_progress','blocked','review','done','failed')),
  percent_complete INT NOT NULL CHECK (percent_complete BETWEEN 0 AND 100) DEFAULT 0,
  notes TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Evidence table
CREATE TABLE IF NOT EXISTS evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id),
  agent_id UUID REFERENCES agents(id),
  type TEXT NOT NULL,            -- test_results, benchmark, screenshot, link, pr, commit, doc, research
  ref TEXT NOT NULL,             -- URL/PR#/commit SHA/path
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert initial project
INSERT INTO projects (name, repo)
VALUES ('Fleet Showroom', 'fleet-showroom')
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_assignments_task_id ON assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_assignments_agent_id ON assignments(agent_id);
CREATE INDEX IF NOT EXISTS idx_evidence_task_id ON evidence(task_id);
