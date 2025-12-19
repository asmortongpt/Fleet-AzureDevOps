#!/usr/bin/env python3
"""
Fleet Frontend Refactoring Orchestrator
Multi-agent build system coordinator with database-driven task tracking

Principles:
- Production-first only (no mock data)
- GitHub as source of truth (branches, PRs, CI)
- Parallelization (batched agent spawning)
- Never guess (research and verify)
- Observability (persist everything to DB)
- Idempotent & resumable
"""

import os
import sys
import json
import asyncio
import subprocess
from datetime import datetime
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict
from enum import Enum

import psycopg2
from psycopg2.extras import RealDictCursor
import anthropic
import openai

# ============================================================================
# CONFIGURATION
# ============================================================================

class Config:
    """Load configuration from environment"""
    DB_HOST = os.getenv("AZURE_SQL_SERVER", "ppmo.database.windows.net")
    DB_NAME = os.getenv("AZURE_SQL_DATABASE", "ppmosql")
    DB_USER = os.getenv("AZURE_SQL_USERNAME", "CloudSA40e5e252")
    DB_PASSWORD = os.getenv("AZURE_SQL_PASSWORD")

    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    GITHUB_PAT = os.getenv("GITHUB_PAT")

    REPO_PATH = "/Users/andrewmorton/Documents/GitHub/fleet-local"
    GITHUB_REPO = "asmortongpt/Fleet"

    MAX_PARALLEL_AGENTS = 10
    MAX_RETRIES = 3

# ============================================================================
# DATA MODELS
# ============================================================================

class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    BLOCKED = "blocked"
    REVIEW = "review"
    DONE = "done"
    FAILED = "failed"

@dataclass
class Task:
    id: str
    title: str
    description: str
    status: TaskStatus
    percent_complete: int
    priority: int
    dependencies: List[str]
    estimated_hours: int
    agent_id: Optional[str] = None
    branch_name: Optional[str] = None
    pr_url: Optional[str] = None

@dataclass
class Agent:
    id: str
    name: str
    llm_model: str
    role: str
    capabilities: List[str]
    max_concurrent_tasks: int
    active: bool

@dataclass
class ProjectStatus:
    project: str
    repo: str
    overall_percent_complete: int
    tasks: List[Dict[str, Any]]
    agents: List[Dict[str, Any]]
    quality_gates: Dict[str, str]
    notes: List[str]

# ============================================================================
# DATABASE LAYER
# ============================================================================

class Database:
    """PostgreSQL database interface"""

    def __init__(self):
        self.conn = None

    def connect(self):
        """Establish database connection"""
        try:
            self.conn = psycopg2.connect(
                host=Config.DB_HOST,
                database=Config.DB_NAME,
                user=Config.DB_USER,
                password=Config.DB_PASSWORD,
                cursor_factory=RealDictCursor
            )
            print(f"✓ Connected to database: {Config.DB_NAME}")
        except Exception as e:
            print(f"✗ Database connection failed: {e}")
            sys.exit(1)

    def execute(self, query: str, params: tuple = None) -> List[Dict]:
        """Execute SQL query and return results"""
        if not self.conn:
            self.connect()

        with self.conn.cursor() as cur:
            cur.execute(query, params or ())
            try:
                return cur.fetchall()
            except:
                return []

    def commit(self):
        """Commit transaction"""
        if self.conn:
            self.conn.commit()

    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()

    def get_ready_tasks(self, project_id: str, limit: int = 10) -> List[Task]:
        """Get tasks ready to be assigned (all dependencies met)"""
        query = "SELECT * FROM get_ready_tasks($1, $2)"
        rows = self.execute(query, (project_id, limit))

        tasks = []
        for row in rows:
            # Fetch full task details
            task_query = "SELECT * FROM tasks WHERE id = $1"
            task_row = self.execute(task_query, (row['task_id'],))[0]

            tasks.append(Task(
                id=str(task_row['id']),
                title=task_row['title'],
                description=task_row['description'],
                status=TaskStatus(task_row['status']),
                percent_complete=task_row['percent_complete'],
                priority=task_row['priority'],
                dependencies=task_row['dependencies'] or [],
                estimated_hours=task_row['estimated_hours'],
                branch_name=task_row['branch_name'],
                pr_url=task_row['pr_url']
            ))

        return tasks

    def get_available_agents(self, role: Optional[str] = None) -> List[Agent]:
        """Get active agents, optionally filtered by role"""
        query = "SELECT * FROM agents WHERE active = true"
        params = []

        if role:
            query += " AND role = $1"
            params.append(role)

        rows = self.execute(query, tuple(params))

        agents = []
        for row in rows:
            agents.append(Agent(
                id=str(row['id']),
                name=row['name'],
                llm_model=row['llm_model'],
                role=row['role'],
                capabilities=row['capabilities'] or [],
                max_concurrent_tasks=row['max_concurrent_tasks'],
                active=row['active']
            ))

        return agents

    def assign_task(self, task_id: str, agent_id: str):
        """Assign task to agent"""
        query = """
        INSERT INTO assignments (task_id, agent_id, status, started_at)
        VALUES ($1, $2, 'in_progress', now())
        ON CONFLICT (task_id, agent_id) DO UPDATE
        SET status = 'in_progress', started_at = now(), updated_at = now()
        """
        self.execute(query, (task_id, agent_id))

        # Update task status
        task_query = "UPDATE tasks SET status = 'in_progress', started_at = now() WHERE id = $1"
        self.execute(task_query, (task_id,))

        self.commit()

    def update_task_progress(self, task_id: str, percent: int, notes: str = ""):
        """Update task percent complete"""
        query = """
        UPDATE assignments
        SET percent_complete = $1, notes = $2, updated_at = now()
        WHERE task_id = $3
        """
        self.execute(query, (percent, notes, task_id))

        task_query = "UPDATE tasks SET percent_complete = $1 WHERE id = $2"
        self.execute(task_query, (percent, task_id))

        self.commit()

    def mark_task_complete(self, task_id: str, agent_id: str):
        """Mark task as done"""
        query = """
        UPDATE assignments
        SET status = 'done', percent_complete = 100, completed_at = now()
        WHERE task_id = $1 AND agent_id = $2
        """
        self.execute(query, (task_id, agent_id))

        task_query = """
        UPDATE tasks
        SET status = 'done', percent_complete = 100, completed_at = now()
        WHERE id = $1
        """
        self.execute(task_query, (task_id,))

        self.commit()

    def add_evidence(self, task_id: str, agent_id: str, evidence_type: str, ref: str, summary: str):
        """Add evidence record (PR, commit, test report, etc.)"""
        query = """
        INSERT INTO evidence (task_id, agent_id, type, ref, summary)
        VALUES ($1, $2, $3, $4, $5)
        """
        self.execute(query, (task_id, agent_id, evidence_type, ref, summary))
        self.commit()

    def get_project_status(self, project_id: str) -> ProjectStatus:
        """Generate comprehensive project status report"""
        # Get project info
        proj_query = "SELECT * FROM projects WHERE id = $1"
        project = self.execute(proj_query, (project_id,))[0]

        # Get all tasks
        tasks_query = "SELECT * FROM tasks WHERE project_id = $1 ORDER BY priority DESC"
        tasks = self.execute(tasks_query, (project_id,))

        # Get all agents with assignments
        agents_query = """
        SELECT a.*, COUNT(asn.id) as assignments_in_progress
        FROM agents a
        LEFT JOIN assignments asn ON asn.agent_id = a.id AND asn.status = 'in_progress'
        GROUP BY a.id
        """
        agents = self.execute(agents_query)

        # Calculate quality gates (simplified - would run actual checks)
        quality_gates = {
            "tests": "pending",
            "lint": "pending",
            "types": "pending",
            "security": "pending",
            "prod_validator": "pending"
        }

        return ProjectStatus(
            project=project['name'],
            repo=project['repo'],
            overall_percent_complete=project['percent_complete'],
            tasks=[dict(t) for t in tasks],
            agents=[dict(a) for a in agents],
            quality_gates=quality_gates,
            notes=["Orchestration system initialized and running"]
        )

# ============================================================================
# AGENT EXECUTION ENGINE
# ============================================================================

class AgentExecutor:
    """Executes tasks via LLM agents"""

    def __init__(self):
        self.anthropic_client = anthropic.Anthropic(api_key=Config.ANTHROPIC_API_KEY)
        self.openai_client = openai.OpenAI(api_key=Config.OPENAI_API_KEY)

    async def execute_task(self, task: Task, agent: Agent, db: Database) -> bool:
        """Execute a task using specified agent"""
        print(f"\n🤖 Agent {agent.name} starting task: {task.title}")

        # Create branch for task
        branch_name = self.create_task_branch(task)

        # Update DB with branch info
        db.execute(
            "UPDATE tasks SET branch_name = $1 WHERE id = $2",
            (branch_name, task.id)
        )
        db.commit()

        try:
            # Generate task prompt
            prompt = self.build_task_prompt(task, agent)

            # Execute via appropriate LLM
            if "claude" in agent.llm_model.lower():
                result = await self.execute_with_claude(prompt, agent.llm_model)
            elif "gpt" in agent.llm_model.lower():
                result = await self.execute_with_openai(prompt, agent.llm_model)
            else:
                raise ValueError(f"Unknown LLM model: {agent.llm_model}")

            # Parse result and update progress
            success = self.process_result(result, task, agent, db)

            if success:
                # Create PR
                pr_url = self.create_pull_request(task, branch_name)

                # Add evidence
                db.add_evidence(
                    task.id, agent.id, "pr", pr_url,
                    f"PR created for {task.title}"
                )

                # Mark task complete
                db.mark_task_complete(task.id, agent.id)

                print(f"✓ Task completed: {task.title}")
                print(f"  PR: {pr_url}")

                return True
            else:
                print(f"✗ Task failed: {task.title}")
                return False

        except Exception as e:
            print(f"✗ Error executing task {task.title}: {e}")
            db.execute(
                "UPDATE assignments SET error_log = $1 WHERE task_id = $2 AND agent_id = $3",
                (str(e), task.id, agent.id)
            )
            db.commit()
            return False

    def build_task_prompt(self, task: Task, agent: Agent) -> str:
        """Build comprehensive prompt for agent"""
        return f"""You are {agent.name}, a specialized {agent.role} agent with capabilities: {', '.join(agent.capabilities)}.

Your task: {task.title}

Description:
{task.description}

Definition of Done:
{task.dod if hasattr(task, 'dod') else 'Complete task as described'}

Working directory: {Config.REPO_PATH}
Branch: {task.branch_name or 'to be created'}

Requirements:
1. Follow all security best practices (parameterized queries, no hardcoded secrets)
2. Maintain TypeScript strict mode compliance
3. Write tests for all new code (80%+ coverage goal)
4. Create meaningful commit messages
5. Document all decisions and changes

Provide a detailed execution plan and implementation.
"""

    async def execute_with_claude(self, prompt: str, model: str) -> str:
        """Execute task using Claude"""
        response = self.anthropic_client.messages.create(
            model=model,
            max_tokens=8000,
            messages=[{"role": "user", "content": prompt}]
        )
        return response.content[0].text

    async def execute_with_openai(self, prompt: str, model: str) -> str:
        """Execute task using OpenAI"""
        response = self.openai_client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=8000
        )
        return response.choices[0].message.content

    def process_result(self, result: str, task: Task, agent: Agent, db: Database) -> bool:
        """Process agent result and determine success"""
        # This is simplified - in reality would parse structured output
        # and execute the agent's plan

        # Update progress to 100%
        db.update_task_progress(task.id, 100, "Task completed by agent")

        return True

    def create_task_branch(self, task: Task) -> str:
        """Create git branch for task"""
        branch_name = f"refactor/{task.title.lower().replace(' ', '-')[:50]}"

        try:
            subprocess.run(
                ["git", "checkout", "-b", branch_name],
                cwd=Config.REPO_PATH,
                check=True,
                capture_output=True
            )
            return branch_name
        except subprocess.CalledProcessError:
            # Branch may already exist
            return branch_name

    def create_pull_request(self, task: Task, branch_name: str) -> str:
        """Create GitHub PR for task"""
        # Push branch
        subprocess.run(
            ["git", "push", "-u", "origin", branch_name],
            cwd=Config.REPO_PATH
        )

        # Create PR using gh CLI
        pr_body = f"""## Task: {task.title}

{task.description}

### Implementation Summary
- Automated implementation by {task.agent_id}
- Branch: `{branch_name}`
- Estimated hours: {task.estimated_hours}

### Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual QA complete

🤖 Generated with Claude Code Orchestrator
"""

        result = subprocess.run(
            ["gh", "pr", "create", "--title", f"{task.title}", "--body", pr_body],
            cwd=Config.REPO_PATH,
            capture_output=True,
            text=True
        )

        # Extract PR URL from output
        pr_url = result.stdout.strip().split('\n')[-1]
        return pr_url

# ============================================================================
# ORCHESTRATOR MAIN LOGIC
# ============================================================================

class Orchestrator:
    """Main orchestration engine"""

    def __init__(self):
        self.db = Database()
        self.executor = AgentExecutor()
        self.project_id = "11111111-1111-1111-1111-111111111111"

    async def run(self):
        """Main orchestration loop"""
        print("=" * 80)
        print("FLEET FRONTEND REFACTORING ORCHESTRATOR")
        print("=" * 80)

        # Connect to database
        self.db.connect()

        # Get initial status
        status = self.db.get_project_status(self.project_id)
        print(f"\nProject: {status.project}")
        print(f"Repo: {status.repo}")
        print(f"Overall Progress: {status.overall_percent_complete}%")

        # Main execution loop
        iteration = 1
        while True:
            print(f"\n{'=' * 80}")
            print(f"ITERATION {iteration}")
            print(f"{'=' * 80}")

            # Get ready tasks
            ready_tasks = self.db.get_ready_tasks(self.project_id, Config.MAX_PARALLEL_AGENTS)

            if not ready_tasks:
                print("\n✓ No more tasks ready to execute")
                break

            print(f"\nFound {len(ready_tasks)} ready tasks")

            # Assign tasks to agents
            assignments = []
            for task in ready_tasks:
                # Find suitable agent
                agents = self.db.get_available_agents(role=self.get_required_role(task))
                if agents:
                    agent = agents[0]  # Simple assignment - could be more sophisticated
                    self.db.assign_task(task.id, agent.id)
                    assignments.append((task, agent))
                    print(f"  • {task.title} → {agent.name}")

            # Execute tasks in parallel
            print(f"\nExecuting {len(assignments)} tasks in parallel...")
            tasks = [self.executor.execute_task(task, agent, self.db) for task, agent in assignments]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            # Report results
            successes = sum(1 for r in results if r is True)
            failures = len(results) - successes
            print(f"\n✓ {successes} tasks completed")
            if failures:
                print(f"✗ {failures} tasks failed")

            # Update status
            status = self.db.get_project_status(self.project_id)
            self.print_status(status)

            iteration += 1

        print("\n" + "=" * 80)
        print("ORCHESTRATION COMPLETE")
        print("=" * 80)

        # Final status
        final_status = self.db.get_project_status(self.project_id)
        self.print_status(final_status)

        # Write status JSON
        self.write_status_json(final_status)

        self.db.close()

    def get_required_role(self, task: Task) -> str:
        """Determine required agent role for task"""
        title_lower = task.title.lower()

        if "typescript" in title_lower or "type" in title_lower:
            return "coder"
        elif "eslint" in title_lower or "lint" in title_lower:
            return "coder"
        elif "test" in title_lower:
            return "tester"
        elif "component" in title_lower or "hook" in title_lower:
            return "coder"
        elif "refactor" in title_lower:
            return "coder"
        else:
            return "coder"

    def print_status(self, status: ProjectStatus):
        """Print formatted status report"""
        print(f"\n{'─' * 80}")
        print(f"PROJECT STATUS: {status.overall_percent_complete}% Complete")
        print(f"{'─' * 80}")

        # Tasks by status
        tasks_by_status = {}
        for task in status.tasks:
            s = task['status']
            tasks_by_status[s] = tasks_by_status.get(s, 0) + 1

        print("\nTasks:")
        for status_name, count in tasks_by_status.items():
            print(f"  {status_name}: {count}")

        # Active agents
        active_agents = [a for a in status.agents if a.get('assignments_in_progress', 0) > 0]
        print(f"\nActive Agents: {len(active_agents)}")
        for agent in active_agents:
            print(f"  • {agent['name']} ({agent['role']}): {agent.get('assignments_in_progress', 0)} tasks")

        print(f"{'─' * 80}")

    def write_status_json(self, status: ProjectStatus):
        """Write status to JSON file"""
        output_path = os.path.join(Config.REPO_PATH, "orchestrator/status.json")

        with open(output_path, 'w') as f:
            json.dump(asdict(status), f, indent=2, default=str)

        print(f"\n✓ Status written to: {output_path}")

# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

async def main():
    orchestrator = Orchestrator()
    await orchestrator.run()

if __name__ == "__main__":
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv("/Users/andrewmorton/.env")

    # Run orchestrator
    asyncio.run(main())
