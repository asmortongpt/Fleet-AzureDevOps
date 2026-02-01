#!/usr/bin/env python3
"""
CTAFleet Spider Certification Orchestrator
Multi-agent coordination system with database-driven task management
"""

import os
import sys
import json
import asyncio
import psycopg2
from psycopg2.extras import RealDictCursor, Json
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum
import subprocess
import uuid

# ============================================================================
# Configuration
# ============================================================================

DB_CONFIG = {
    'host': 'localhost',
    'port': 5433,
    'database': 'orchestration',
    'user': 'orchestrator',
    'password': 'orch_pass_2026'
}

# Agent type to LLM model mapping
AGENT_MODEL_MAP = {
    'inventory': 'sonnet',  # Complex code analysis
    'ui-test': 'sonnet',    # Needs good reasoning for UI flows
    'api-test': 'haiku',    # Fast, straightforward endpoint testing
    'service-test': 'sonnet', # Complex service interactions
    'integration-test': 'sonnet', # External integrations need care
    'ai-test': 'opus',      # Testing AI requires best model
    'evidence-collector': 'haiku', # File aggregation
    'scoring': 'sonnet',    # Rubric application
    'gate-enforcer': 'opus', # Critical decision making
    'remediation': 'sonnet' # Code fixes
}

# ============================================================================
# Data Models
# ============================================================================

class ProjectStatus(Enum):
    CREATED = 'created'
    RUNNING = 'running'
    GATING = 'gating'
    REMEDIATING = 'remediating'
    COMPLETED = 'completed'
    FAILED = 'failed'

class AgentStatus(Enum):
    IDLE = 'idle'
    RUNNING = 'running'
    WAITING = 'waiting'
    COMPLETED = 'completed'
    FAILED = 'failed'

class TaskStatus(Enum):
    PENDING = 'pending'
    ASSIGNED = 'assigned'
    IN_PROGRESS = 'in_progress'
    COMPLETED = 'completed'
    FAILED = 'failed'
    BLOCKED = 'blocked'

@dataclass
class Project:
    project_id: str
    name: str
    description: str
    status: str
    certification_type: str = 'full_spider'
    preconditions_validated: bool = False
    total_items: int = 0
    tested_items: int = 0
    passed_items: int = 0
    failed_items: int = 0
    min_score_threshold: int = 990
    avg_score: Optional[float] = None
    certified: bool = False

@dataclass
class Agent:
    agent_id: str
    project_id: str
    name: str
    agent_type: str
    model: str
    status: str = 'idle'
    capabilities: Dict = None
    tasks_assigned: int = 0
    tasks_completed: int = 0
    tasks_failed: int = 0

@dataclass
class Task:
    task_id: str
    project_id: str
    name: str
    task_type: str
    phase: str
    status: str = 'pending'
    priority: int = 5
    description: Optional[str] = None
    input_data: Optional[Dict] = None
    output_data: Optional[Dict] = None
    assigned_to_agent: Optional[str] = None
    evidence_required: bool = True
    score: Optional[int] = None
    gate_passed: Optional[bool] = None

# ============================================================================
# Database Manager
# ============================================================================

class DatabaseManager:
    """Handles all database operations for orchestration"""

    def __init__(self, config: Dict):
        self.config = config
        self.conn = None

    def connect(self):
        """Establish database connection"""
        try:
            self.conn = psycopg2.connect(**self.config)
            self.conn.autocommit = True
            print(f"✅ Connected to orchestration database")
            return True
        except Exception as e:
            print(f"❌ Database connection failed: {e}")
            return False

    def disconnect(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
            print("Database connection closed")

    def execute(self, query: str, params: tuple = None, fetch: bool = False):
        """Execute a query"""
        try:
            with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(query, params)
                if fetch:
                    return cur.fetchall()
                return cur.rowcount
        except Exception as e:
            print(f"❌ Query execution failed: {e}")
            print(f"Query: {query}")
            raise

    # Project operations
    def create_project(self, name: str, description: str) -> str:
        """Create a new certification project"""
        query = """
        INSERT INTO projects (name, description, status, created_at)
        VALUES (%s, %s, 'created', NOW())
        RETURNING project_id::text
        """
        result = self.execute(query, (name, description), fetch=True)
        project_id = result[0]['project_id']
        print(f"✅ Created project: {project_id}")
        return project_id

    def get_project(self, project_id: str) -> Optional[Dict]:
        """Get project details"""
        query = "SELECT * FROM projects WHERE project_id = %s"
        result = self.execute(query, (project_id,), fetch=True)
        return dict(result[0]) if result else None

    def update_project_status(self, project_id: str, status: str):
        """Update project status"""
        query = "UPDATE projects SET status = %s WHERE project_id = %s"
        self.execute(query, (status, project_id))
        print(f"Project {project_id} → {status}")

    def update_project_progress(self, project_id: str):
        """Refresh project progress metrics"""
        query = "SELECT update_project_progress(%s)"
        self.execute(query, (project_id,))

    # Agent operations
    def create_agent(self, project_id: str, name: str, agent_type: str) -> str:
        """Spawn a new agent"""
        model = AGENT_MODEL_MAP.get(agent_type, 'sonnet')

        query = """
        INSERT INTO agents (project_id, name, agent_type, model, status, created_at)
        VALUES (%s, %s, %s, %s, 'idle', NOW())
        RETURNING agent_id::text
        """
        result = self.execute(query, (project_id, name, agent_type, model), fetch=True)
        agent_id = result[0]['agent_id']
        print(f"✅ Spawned agent: {name} ({agent_type}) using {model}")
        return agent_id

    def get_agent(self, agent_id: str) -> Optional[Dict]:
        """Get agent details"""
        query = "SELECT * FROM agents WHERE agent_id = %s"
        result = self.execute(query, (agent_id,), fetch=True)
        return dict(result[0]) if result else None

    def update_agent_status(self, agent_id: str, status: str):
        """Update agent status"""
        query = "UPDATE agents SET status = %s WHERE agent_id = %s"
        self.execute(query, (status, agent_id))

    def list_agents(self, project_id: str) -> List[Dict]:
        """List all agents for a project"""
        query = "SELECT * FROM agents WHERE project_id = %s ORDER BY created_at"
        return [dict(row) for row in self.execute(query, (project_id,), fetch=True)]

    # Task operations
    def create_task(self, project_id: str, name: str, task_type: str,
                   phase: str, input_data: Dict = None, priority: int = 5) -> str:
        """Create a new task"""
        query = """
        INSERT INTO tasks (project_id, name, task_type, phase, status, priority, input_data, created_at)
        VALUES (%s, %s, %s, %s, 'pending', %s, %s, NOW())
        RETURNING task_id::text
        """
        result = self.execute(query, (
            project_id, name, task_type, phase, priority, Json(input_data or {})
        ), fetch=True)
        task_id = result[0]['task_id']
        return task_id

    def get_task(self, task_id: str) -> Optional[Dict]:
        """Get task details"""
        query = "SELECT * FROM tasks WHERE task_id = %s"
        result = self.execute(query, (task_id,), fetch=True)
        return dict(result[0]) if result else None

    def assign_task(self, task_id: str, agent_id: str):
        """Assign a task to an agent"""
        query = """
        UPDATE tasks
        SET assigned_to_agent = %s, status = 'assigned', assigned_at = NOW()
        WHERE task_id = %s
        """
        self.execute(query, (agent_id, task_id))

        # Create assignment record
        assign_query = """
        INSERT INTO assignments (project_id, agent_id, task_id, status, assigned_at)
        SELECT project_id, %s, task_id, 'assigned', NOW()
        FROM tasks WHERE task_id = %s
        """
        self.execute(assign_query, (agent_id, task_id))

        # Update agent task count
        update_agent = "UPDATE agents SET tasks_assigned = tasks_assigned + 1 WHERE agent_id = %s"
        self.execute(update_agent, (agent_id,))

    def update_task_status(self, task_id: str, status: str, output_data: Dict = None):
        """Update task status and optional output"""
        if output_data:
            query = """
            UPDATE tasks
            SET status = %s, output_data = %s, completed_at = CASE WHEN %s = 'completed' THEN NOW() ELSE completed_at END
            WHERE task_id = %s
            """
            self.execute(query, (status, Json(output_data), status, task_id))
        else:
            query = """
            UPDATE tasks
            SET status = %s, completed_at = CASE WHEN %s = 'completed' THEN NOW() ELSE completed_at END
            WHERE task_id = %s
            """
            self.execute(query, (status, status, task_id))

    def get_pending_tasks(self, project_id: str, phase: str = None) -> List[Dict]:
        """Get all pending tasks, optionally filtered by phase"""
        if phase:
            query = """
            SELECT * FROM tasks
            WHERE project_id = %s AND phase = %s AND status = 'pending'
            ORDER BY priority, created_at
            """
            params = (project_id, phase)
        else:
            query = """
            SELECT * FROM tasks
            WHERE project_id = %s AND status = 'pending'
            ORDER BY priority, created_at
            """
            params = (project_id,)

        return [dict(row) for row in self.execute(query, params, fetch=True)]

    # Inventory operations
    def create_inventory_item(self, project_id: str, item_type: str, name: str,
                             path: str = None, technical_details: Dict = None) -> str:
        """Add an item to the inventory"""
        query = """
        INSERT INTO inventory_items (project_id, item_type, name, path, technical_details, created_at)
        VALUES (%s, %s, %s, %s, %s, NOW())
        RETURNING item_id::text
        """
        result = self.execute(query, (
            project_id, item_type, name, path, Json(technical_details or {})
        ), fetch=True)
        return result[0]['item_id']

    def get_inventory_count(self, project_id: str) -> int:
        """Get total inventory items"""
        query = "SELECT COUNT(*) as count FROM inventory_items WHERE project_id = %s"
        result = self.execute(query, (project_id,), fetch=True)
        return result[0]['count']

    # Evidence operations
    def register_evidence(self, project_id: str, item_id: str, evidence_type: str,
                         file_path: str, description: str = None) -> str:
        """Register an evidence artifact"""
        query = """
        INSERT INTO evidence (project_id, item_id, evidence_type, file_path, description, created_at)
        VALUES (%s, %s, %s, %s, %s, NOW())
        RETURNING evidence_id::text
        """
        result = self.execute(query, (
            project_id, item_id, evidence_type, file_path, description
        ), fetch=True)
        return result[0]['evidence_id']

# ============================================================================
# Agent Spawner
# ============================================================================

class AgentSpawner:
    """Spawns and manages specialized agents"""

    def __init__(self, db: DatabaseManager):
        self.db = db
        self.active_agents = {}

    def spawn_agent_set(self, project_id: str) -> Dict[str, str]:
        """Spawn the complete set of specialized agents"""

        agent_specs = [
            ('inventory', 'Inventory Builder'),
            ('ui-test', 'UI Test Spider'),
            ('api-test', 'API Test Runner'),
            ('service-test', 'Service Test Runner'),
            ('integration-test', 'Integration Tester'),
            ('ai-test', 'AI Feature Verifier'),
            ('evidence-collector', 'Evidence Aggregator'),
            ('scoring', 'Scoring Engine'),
            ('gate-enforcer', 'Gate Enforcer'),
            ('remediation', 'Remediation Agent')
        ]

        agents = {}
        print(f"\n🚀 Spawning {len(agent_specs)} specialized agents...")

        for agent_type, name in agent_specs:
            agent_id = self.db.create_agent(project_id, name, agent_type)
            agents[agent_type] = agent_id
            self.active_agents[agent_id] = {
                'type': agent_type,
                'name': name,
                'model': AGENT_MODEL_MAP[agent_type]
            }

        print(f"✅ Agent set spawned: {len(agents)} agents ready\n")
        return agents

    def execute_agent_task(self, agent_id: str, task_id: str):
        """Execute a task using Claude Code agent invocation"""

        agent = self.db.get_agent(agent_id)
        task = self.db.get_task(task_id)

        if not agent or not task:
            print(f"❌ Agent or task not found")
            return False

        print(f"\n🤖 Executing {agent['name']} on task: {task['name']}")

        # Update statuses
        self.db.update_agent_status(agent_id, 'running')
        self.db.update_task_status(task_id, 'in_progress')

        # Build agent prompt based on task type
        prompt = self._build_agent_prompt(agent, task)

        # In a real implementation, this would invoke Claude via API or subagent
        # For now, we'll simulate the execution

        print(f"   Agent Type: {agent['agent_type']}")
        print(f"   Model: {agent['model']}")
        print(f"   Phase: {task['phase']}")

        # Simulate task execution (in production, this calls Claude API)
        # result = self._invoke_claude_agent(agent['model'], prompt, task['input_data'])

        # For now, mark as completed (will be replaced with real invocation)
        self.db.update_task_status(task_id, 'completed', {'simulated': True})
        self.db.update_agent_status(agent_id, 'idle')

        print(f"✅ Task completed\n")
        return True

    def _build_agent_prompt(self, agent: Dict, task: Dict) -> str:
        """Build specialized prompt for each agent type"""

        base = f"""
You are the {agent['name']} for CTAFleet Spider Certification.

Task: {task['name']}
Phase: {task['phase']}
Type: {task['task_type']}

Description: {task.get('description', 'No description')}

Input Data: {json.dumps(task.get('input_data'), indent=2)}

CRITICAL REQUIREMENTS:
- No "PASS" without evidence artifacts
- If untestable: mark UNKNOWN/BLOCKED = FAIL
- Correctness gate: 1000/1000 (mandatory)
- Accuracy gate: 1000/1000 where applicable
- Report findings in structured JSON

Execute this task and return:
1. Status (completed/failed/blocked)
2. Evidence artifacts (file paths)
3. Findings/results
4. Next actions required
"""
        return base

# ============================================================================
# Orchestrator Main Class
# ============================================================================

class SpiderOrchestrator:
    """Main orchestration controller"""

    def __init__(self):
        self.db = DatabaseManager(DB_CONFIG)
        self.spawner = None
        self.project_id = None
        self.agents = {}

    def initialize(self):
        """Initialize the orchestrator"""
        print("=" * 80)
        print("🕷️  CTAFleet Spider Certification Orchestrator")
        print("=" * 80)
        print()

        if not self.db.connect():
            print("❌ Failed to connect to database. Exiting.")
            return False

        self.spawner = AgentSpawner(self.db)
        print("✅ Orchestrator initialized\n")
        return True

    def create_certification_project(self, name: str, description: str) -> str:
        """Create a new certification project"""
        self.project_id = self.db.create_project(name, description)
        print(f"📊 Project created: {name}")
        print(f"   ID: {self.project_id}\n")
        return self.project_id

    def spawn_agents(self):
        """Spawn all required agents"""
        if not self.project_id:
            print("❌ No active project. Create a project first.")
            return False

        self.agents = self.spawner.spawn_agent_set(self.project_id)
        return True

    def run_phase_0_preconditions(self):
        """Phase 0: Validate preconditions"""
        print("=" * 80)
        print("PHASE 0: PRECONDITION VALIDATION")
        print("=" * 80)
        print()

        # Create precondition validation tasks
        tasks = [
            ('Validate environment URLs', 'Environment validation'),
            ('Check test credentials', 'Credentials check'),
            ('Verify dataset access', 'Dataset validation'),
            ('Test observability hooks', 'Observability check'),
            ('Validate AI constraints', 'AI validation')
        ]

        for task_name, description in tasks:
            task_id = self.db.create_task(
                self.project_id,
                task_name,
                'validation',
                'phase_0',
                {'description': description},
                priority=1
            )
            print(f"📋 Created task: {task_name}")

        print(f"\n✅ Phase 0 tasks created\n")

    def run_certification(self):
        """Execute the full spider certification"""

        # Phase 0: Preconditions
        self.run_phase_0_preconditions()

        # Update project status
        self.db.update_project_status(self.project_id, 'running')

        print("\n✅ Certification orchestration initialized")
        print(f"   Agents: {len(self.agents)}")
        print(f"   Project ID: {self.project_id}")
        print()

        return True

    def shutdown(self):
        """Cleanup and shutdown"""
        print("\n🛑 Shutting down orchestrator...")
        self.db.disconnect()

# ============================================================================
# Main Entry Point
# ============================================================================

def main():
    orchestrator = SpiderOrchestrator()

    if not orchestrator.initialize():
        sys.exit(1)

    try:
        # Create project
        orchestrator.create_certification_project(
            "CTAFleet Full Spider Certification",
            "Complete platform certification with ≥990 score requirement"
        )

        # Spawn agents
        orchestrator.spawn_agents()

        # Run certification
        orchestrator.run_certification()

        print("\n" + "=" * 80)
        print("✅ Orchestration framework ready for full certification execution")
        print("=" * 80)

    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        orchestrator.shutdown()

if __name__ == '__main__':
    main()
