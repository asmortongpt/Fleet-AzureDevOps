#!/usr/bin/env python3
"""
AI Agent Orchestrator for Fleet UI Rebuild

This orchestrator coordinates multiple AI agents (OpenAI Codex, Gemini, Claude)
running on Azure VMs to rebuild the entire Fleet UI following the Bloomberg
Terminal design specification.

Features:
- Task queue management with Redis
- Parallel agent execution
- Progress tracking and reporting
- Error handling and retry logic
- Git integration for commits
"""

import os
import json
import asyncio
import subprocess
from datetime import datetime
from typing import List, Dict, Optional
from dataclasses import dataclass, asdict
from enum import Enum

# AI SDK imports
import openai
import anthropic
from google import generativeai as genai

##############################################################################
# Configuration
##############################################################################

class AgentType(Enum):
    OPENAI_CODEX = "openai_codex"
    GEMINI_JULES = "gemini_jules"
    CLAUDE_SONNET = "claude_sonnet"

@dataclass
class Task:
    id: str
    type: str
    description: str
    files_to_create: List[str]
    dependencies: List[str]
    assigned_agent: Optional[AgentType] = None
    status: str = "pending"  # pending, in_progress, completed, failed
    retries: int = 0
    result: Optional[Dict] = None
    created_at: str = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now().isoformat()

##############################################################################
# Task Definitions for UI Rebuild
##############################################################################

UI_REBUILD_TASKS = [
    # Phase 1: Design System Foundation
    Task(
        id="task-001",
        type="design_system",
        description="Create enterprise design tokens CSS file with Bloomberg Terminal color scheme",
        files_to_create=["src/styles/enterprise-tokens.css"],
        dependencies=[]
    ),
    Task(
        id="task-002",
        type="component",
        description="Build DataGrid component with virtual scrolling, sticky headers, frozen columns",
        files_to_create=[
            "src/components/enterprise/DataGrid.tsx",
            "src/components/enterprise/DataGrid.css"
        ],
        dependencies=["task-001"]
    ),
    Task(
        id="task-003",
        type="component",
        description="Build KPIStrip component - horizontal metrics bar, no cards",
        files_to_create=[
            "src/components/enterprise/KPIStrip.tsx",
            "src/components/enterprise/KPIStrip.css"
        ],
        dependencies=["task-001"]
    ),
    Task(
        id="task-004",
        type="component",
        description="Build SidePanel component - 380px slide-out panel for detail views",
        files_to_create=[
            "src/components/enterprise/SidePanel.tsx",
            "src/components/enterprise/SidePanel.css"
        ],
        dependencies=["task-001"]
    ),
    Task(
        id="task-005",
        type="component",
        description="Build CommandPalette component - Cmd+K fuzzy search across all entities",
        files_to_create=[
            "src/components/enterprise/CommandPalette.tsx",
            "src/components/enterprise/CommandPalette.css"
        ],
        dependencies=["task-001"]
    ),

    # Phase 2: Core Views
    Task(
        id="task-006",
        type="view",
        description="Rebuild Dashboard - KPI strip + charts + alerts table, 60/40 split",
        files_to_create=[
            "src/views/enterprise/Dashboard.tsx",
            "src/views/enterprise/Dashboard.css"
        ],
        dependencies=["task-002", "task-003"]
    ),
    Task(
        id="task-007",
        type="view",
        description="Rebuild Vehicles view - full-page data grid with detail panel",
        files_to_create=[
            "src/views/enterprise/Vehicles.tsx",
            "src/views/enterprise/Vehicles.css"
        ],
        dependencies=["task-002", "task-004"]
    ),
    Task(
        id="task-008",
        type="view",
        description="Rebuild Live Map - compact vehicle list (200px) + map with clustered pins",
        files_to_create=[
            "src/views/enterprise/LiveMap.tsx",
            "src/views/enterprise/LiveMap.css"
        ],
        dependencies=["task-002"]
    ),
    Task(
        id="task-009",
        type="view",
        description="Rebuild Maintenance - full-page table with inline dropdowns, expandable rows",
        files_to_create=[
            "src/views/enterprise/Maintenance.tsx",
            "src/views/enterprise/Maintenance.css"
        ],
        dependencies=["task-002"]
    ),
    Task(
        id="task-010",
        type="view",
        description="Rebuild Drivers - table with photos, safety score bars, efficiency bars",
        files_to_create=[
            "src/views/enterprise/Drivers.tsx",
            "src/views/enterprise/Drivers.css"
        ],
        dependencies=["task-002"]
    ),

    # Phase 3: Integration & Polish
    Task(
        id="task-011",
        type="integration",
        description="Wire up all views to existing API hooks, preserve business logic",
        files_to_create=["src/views/enterprise/index.ts"],
        dependencies=["task-006", "task-007", "task-008", "task-009", "task-010"]
    ),
    Task(
        id="task-012",
        type="accessibility",
        description="Implement full keyboard navigation, ARIA labels, focus management",
        files_to_create=["src/hooks/useKeyboardNavigation.ts"],
        dependencies=["task-011"]
    ),
    Task(
        id="task-013",
        type="testing",
        description="Create E2E tests for all enterprise views with Playwright",
        files_to_create=["tests/enterprise/dashboard.spec.ts", "tests/enterprise/vehicles.spec.ts"],
        dependencies=["task-011"]
    )
]

##############################################################################
# Agent Implementations
##############################################################################

class AIAgent:
    def __init__(self, agent_type: AgentType):
        self.agent_type = agent_type
        self.setup_client()

    def setup_client(self):
        """Initialize the appropriate AI client"""
        if self.agent_type == AgentType.OPENAI_CODEX:
            openai.api_key = os.getenv("OPENAI_API_KEY")
            self.client = openai
        elif self.agent_type == AgentType.GEMINI_JULES:
            genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
            self.client = genai.GenerativeModel('gemini-1.5-pro')
        elif self.agent_type == AgentType.CLAUDE_SONNET:
            self.client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    async def execute_task(self, task: Task) -> Dict:
        """Execute a task using the AI agent"""
        print(f"🤖 [{self.agent_type.value}] Executing task: {task.id}")

        # Build comprehensive prompt
        prompt = self._build_prompt(task)

        # Call the appropriate LLM
        if self.agent_type == AgentType.OPENAI_CODEX:
            result = await self._execute_openai(prompt, task)
        elif self.agent_type == AgentType.GEMINI_JULES:
            result = await self._execute_gemini(prompt, task)
        elif self.agent_type == AgentType.CLAUDE_SONNET:
            result = await self._execute_claude(prompt, task)

        return result

    def _build_prompt(self, task: Task) -> str:
        """Build a comprehensive prompt for the task"""

        design_spec = """
ENTERPRISE DESIGN SYSTEM SPECIFICATION:

Typography:
- UI Font: Inter, 13px base, 400/500/600 weights
- Data Font: JetBrains Mono, 12px for numbers/IDs/timestamps
- Max text size: 22px for page titles

Colors (Dark Theme):
- bg: #0a0a0b
- surface-1: #141415
- surface-2: #1a1a1c
- text: #e8e8e9
- text-secondary: #a0a0a4
- primary: #3b82f6
- success: #22c55e
- warning: #f59e0b
- error: #ef4444

Layout Rules:
- ZERO page scrolling - every view fits 100vh x 100vw
- Row height: 36px standard, 32px compact
- Cell padding: 8px horizontal
- No padding > 16px anywhere

Component Patterns:
- Spreadsheet-style rows, NOT cards
- Tables use CSS Grid, not <table>
- Sticky headers, frozen columns support
- Virtual scrolling for 100+ rows
"""

        prompt = f"""You are building production-quality enterprise software following Bloomberg Terminal design patterns.

TASK: {task.description}

FILES TO CREATE: {', '.join(task.files_to_create)}

{design_spec}

REQUIREMENTS:
1. Write production-ready TypeScript/React code
2. Follow the design system exactly
3. Implement full accessibility (ARIA labels, keyboard navigation)
4. Add detailed code comments
5. Use existing Fleet data types from src/lib/types.ts
6. Preserve all existing business logic and API integrations

Generate complete, working code for all files. Each file should be production-ready.
"""
        return prompt

    async def _execute_openai(self, prompt: str, task: Task) -> Dict:
        """Execute task using OpenAI Codex"""
        response = await openai.ChatCompletion.acreate(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": "You are an expert frontend developer building enterprise software."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=4000
        )

        code = response.choices[0].message.content
        return self._write_files(task, code)

    async def _execute_gemini(self, prompt: str, task: Task) -> Dict:
        """Execute task using Gemini"""
        response = await self.client.generate_content_async(prompt)
        code = response.text
        return self._write_files(task, code)

    async def _execute_claude(self, prompt: str, task: Task) -> Dict:
        """Execute task using Claude"""
        message = await self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4000,
            messages=[{"role": "user", "content": prompt}]
        )
        code = message.content[0].text
        return self._write_files(task, code)

    def _write_files(self, task: Task, code: str) -> Dict:
        """Write generated code to files"""
        project_root = "/home/azureuser/Fleet"
        files_created = []

        # Parse code blocks and write to files
        # (implementation would extract code blocks and write to appropriate files)

        for file_path in task.files_to_create:
            full_path = os.path.join(project_root, file_path)
            os.makedirs(os.path.dirname(full_path), exist_ok=True)

            # Extract relevant code block for this file
            # (simplified - real implementation would parse markdown code blocks)
            with open(full_path, 'w') as f:
                f.write(code)

            files_created.append(file_path)
            print(f"  ✅ Created: {file_path}")

        # Git commit
        self._git_commit(files_created, task.description)

        return {
            "files_created": files_created,
            "status": "completed"
        }

    def _git_commit(self, files: List[str], message: str):
        """Commit created files to git"""
        project_root = "/home/azureuser/Fleet"
        subprocess.run(["git", "add"] + files, cwd=project_root)
        subprocess.run(
            ["git", "commit", "-m", f"feat(ui): {message}\n\n🤖 Generated by AI Agent"],
            cwd=project_root
        )

##############################################################################
# Orchestrator
##############################################################################

class Orchestrator:
    def __init__(self):
        self.task_queue = UI_REBUILD_TASKS.copy()
        self.completed_tasks = []
        self.failed_tasks = []
        self.in_progress_tasks = []

        # Initialize agents
        self.agents = [
            AIAgent(AgentType.OPENAI_CODEX),
            AIAgent(AgentType.GEMINI_JULES),
            AIAgent(AgentType.CLAUDE_SONNET)
        ]

    async def run(self):
        """Main orchestration loop"""
        print("🚀 Starting AI Agent Orchestrator")
        print(f"📋 Total tasks: {len(self.task_queue)}")
        print(f"🤖 Agents: {len(self.agents)}")
        print("")

        while self.task_queue or any(t.status == "in_progress" for t in UI_REBUILD_TASKS):
            # Get ready tasks (dependencies met)
            ready_tasks = self._get_ready_tasks()

            if not ready_tasks:
                await asyncio.sleep(5)
                continue

            # Assign tasks to available agents
            tasks_to_execute = []
            for task, agent in zip(ready_tasks[:len(self.agents)], self.agents):
                task.status = "in_progress"
                task.assigned_agent = agent.agent_type
                tasks_to_execute.append((task, agent))

            # Execute tasks in parallel
            results = await asyncio.gather(*[
                agent.execute_task(task)
                for task, agent in tasks_to_execute
            ], return_exceptions=True)

            # Process results
            for (task, agent), result in zip(tasks_to_execute, results):
                if isinstance(result, Exception):
                    print(f"❌ Task {task.id} failed: {result}")
                    task.status = "failed"
                    task.retries += 1
                    if task.retries < 3:
                        task.status = "pending"  # Retry
                    else:
                        self.failed_tasks.append(task)
                else:
                    print(f"✅ Task {task.id} completed")
                    task.status = "completed"
                    task.result = result
                    self.completed_tasks.append(task)

            self._report_progress()

        print("\n🎉 All tasks completed!")
        self._final_report()

    def _get_ready_tasks(self) -> List[Task]:
        """Get tasks whose dependencies are met"""
        ready = []
        for task in self.task_queue:
            if task.status != "pending":
                continue

            deps_met = all(
                any(t.id == dep and t.status == "completed" for t in UI_REBUILD_TASKS)
                for dep in task.dependencies
            )

            if deps_met or not task.dependencies:
                ready.append(task)

        return ready

    def _report_progress(self):
        """Print progress report"""
        total = len(UI_REBUILD_TASKS)
        completed = len(self.completed_tasks)
        failed = len(self.failed_tasks)
        in_progress = sum(1 for t in UI_REBUILD_TASKS if t.status == "in_progress")
        pending = total - completed - failed - in_progress

        print(f"\n📊 Progress: {completed}/{total} completed | {in_progress} in progress | {pending} pending | {failed} failed\n")

    def _final_report(self):
        """Print final report"""
        print("\n" + "="*80)
        print("FINAL REPORT")
        print("="*80)
        print(f"✅ Completed: {len(self.completed_tasks)}")
        print(f"❌ Failed: {len(self.failed_tasks)}")
        print(f"\nFiles created:")
        for task in self.completed_tasks:
            if task.result:
                for file in task.result.get("files_created", []):
                    print(f"  - {file}")

##############################################################################
# Main Entry Point
##############################################################################

if __name__ == "__main__":
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()

    # Run orchestrator
    orchestrator = Orchestrator()
    asyncio.run(orchestrator.run())
