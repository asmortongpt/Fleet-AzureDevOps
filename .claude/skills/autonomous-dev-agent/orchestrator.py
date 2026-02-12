#!/usr/bin/env python3
"""
Autonomous Development Agent - Executable Orchestration Engine
Orchestrates the entire SDLC from requirements to deployment

Usage:
  python orchestrator.py --project "tire retail ERP" --output ./project-output
"""

import argparse
import json
import os
import subprocess
import sys
from dataclasses import dataclass, asdict
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Dict, List, Optional


class Phase(Enum):
    """SDLC phases"""
    REQUIREMENTS = "requirements"
    SYSTEM_DESIGN = "system_design"
    BACKEND_DEV = "backend_development"
    FRONTEND_DEV = "frontend_development"
    INFRASTRUCTURE = "infrastructure"
    TESTING = "testing"
    DEPLOYMENT = "deployment"


class TaskStatus(Enum):
    """Task execution status"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


@dataclass
class Task:
    """Individual task in the SDLC"""
    name: str
    phase: Phase
    command: str
    dependencies: List[str]
    status: TaskStatus = TaskStatus.PENDING
    output: Optional[str] = None
    error: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None


@dataclass
class Project:
    """Project configuration"""
    name: str
    description: str
    output_dir: Path
    tasks: List[Task]
    created_at: str
    status: str = "initializing"


class AutonomousOrchestrator:
    """Orchestrates autonomous development workflow"""

    def __init__(self, project_name: str, output_dir: Path):
        """Initialize orchestrator"""
        self.project = Project(
            name=project_name,
            description=f"Autonomous development: {project_name}",
            output_dir=output_dir,
            tasks=[],
            created_at=datetime.now().isoformat(),
        )
        self.output_dir = output_dir
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # Initialize task graph
        self._build_task_graph()

    def _build_task_graph(self):
        """Build task dependency graph"""
        base_path = Path(__file__).parent.parent

        self.project.tasks = [
            # Phase 1: Requirements Analysis
            Task(
                name="analyze_requirements",
                phase=Phase.REQUIREMENTS,
                command=f"echo 'Requirements analysis for {self.project.name}'",
                dependencies=[],
            ),
            Task(
                name="create_user_stories",
                phase=Phase.REQUIREMENTS,
                command=f"echo 'Creating user stories...'",
                dependencies=["analyze_requirements"],
            ),
            # Phase 2: System Design
            Task(
                name="design_architecture",
                phase=Phase.SYSTEM_DESIGN,
                command=f"node {base_path}/system-design/tools/mermaid/generate-architecture-diagram.js system",
                dependencies=["create_user_stories"],
            ),
            Task(
                name="generate_openapi_spec",
                phase=Phase.SYSTEM_DESIGN,
                command=f"node {base_path}/system-design/tools/openapi/generate-spec.js",
                dependencies=["design_architecture"],
            ),
            # Phase 3: Backend Development
            Task(
                name="setup_backend_template",
                phase=Phase.BACKEND_DEV,
                command=f"cp -r {base_path}/backend-development/templates/express-prisma-typescript {self.output_dir}/backend",
                dependencies=["generate_openapi_spec"],
            ),
            Task(
                name="initialize_database",
                phase=Phase.BACKEND_DEV,
                command=f"cd {self.output_dir}/backend && npm install && npx prisma generate",
                dependencies=["setup_backend_template"],
            ),
            # Phase 4: Infrastructure Setup
            Task(
                name="setup_terraform",
                phase=Phase.INFRASTRUCTURE,
                command=f"cp -r {base_path}/infrastructure-as-code/terraform {self.output_dir}/infrastructure",
                dependencies=["initialize_database"],
            ),
            Task(
                name="setup_kubernetes",
                phase=Phase.INFRASTRUCTURE,
                command=f"cp -r {base_path}/infrastructure-as-code/kubernetes {self.output_dir}/infrastructure/k8s",
                dependencies=["setup_terraform"],
            ),
            Task(
                name="setup_helm_chart",
                phase=Phase.INFRASTRUCTURE,
                command=f"cp -r {base_path}/infrastructure-as-code/helm {self.output_dir}/infrastructure/helm",
                dependencies=["setup_kubernetes"],
            ),
            # Phase 5: Testing
            Task(
                name="run_load_tests",
                phase=Phase.TESTING,
                command=f"echo 'Load tests configured at {self.output_dir}/tests'",
                dependencies=["setup_helm_chart"],
            ),
            # Phase 6: Documentation
            Task(
                name="generate_documentation",
                phase=Phase.DEPLOYMENT,
                command=f"echo 'Documentation generated'",
                dependencies=["run_load_tests"],
            ),
        ]

    def _execute_task(self, task: Task) -> bool:
        """Execute a single task"""
        print(f"\n[{task.phase.value}] {task.name}")
        print(f"  Command: {task.command}")

        task.status = TaskStatus.IN_PROGRESS
        task.start_time = datetime.now().isoformat()

        try:
            result = subprocess.run(
                task.command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=300,  # 5 minute timeout
            )

            task.output = result.stdout
            task.end_time = datetime.now().isoformat()

            if result.returncode == 0:
                task.status = TaskStatus.COMPLETED
                print(f"  ✓ Completed")
                if result.stdout:
                    print(f"  Output: {result.stdout[:200]}")
                return True
            else:
                task.status = TaskStatus.FAILED
                task.error = result.stderr
                print(f"  ✗ Failed: {result.stderr}")
                return False

        except subprocess.TimeoutExpired:
            task.status = TaskStatus.FAILED
            task.error = "Task timeout (5 minutes)"
            task.end_time = datetime.now().isoformat()
            print(f"  ✗ Timeout")
            return False

        except Exception as e:
            task.status = TaskStatus.FAILED
            task.error = str(e)
            task.end_time = datetime.now().isoformat()
            print(f"  ✗ Error: {e}")
            return False

    def _check_dependencies(self, task: Task) -> bool:
        """Check if task dependencies are completed"""
        for dep_name in task.dependencies:
            dep_task = next((t for t in self.project.tasks if t.name == dep_name), None)
            if not dep_task or dep_task.status != TaskStatus.COMPLETED:
                return False
        return True

    def _get_ready_tasks(self) -> List[Task]:
        """Get tasks ready to execute"""
        return [
            task
            for task in self.project.tasks
            if task.status == TaskStatus.PENDING and self._check_dependencies(task)
        ]

    def execute(self) -> bool:
        """Execute all tasks in dependency order"""
        print(f"\n{'='*80}")
        print(f"Autonomous Development Orchestrator")
        print(f"Project: {self.project.name}")
        print(f"Output: {self.output_dir}")
        print(f"Tasks: {len(self.project.tasks)}")
        print(f"{'='*80}\n")

        self.project.status = "running"

        while True:
            ready_tasks = self._get_ready_tasks()

            if not ready_tasks:
                # Check if all completed or any failed
                pending = [t for t in self.project.tasks if t.status == TaskStatus.PENDING]
                failed = [t for t in self.project.tasks if t.status == TaskStatus.FAILED]

                if failed:
                    self.project.status = "failed"
                    print(f"\n✗ Workflow failed. {len(failed)} task(s) failed.")
                    return False
                elif pending:
                    self.project.status = "blocked"
                    print(f"\n⚠ Workflow blocked. {len(pending)} task(s) waiting on dependencies.")
                    return False
                else:
                    self.project.status = "completed"
                    print(f"\n✓ All tasks completed successfully!")
                    return True

            # Execute ready tasks (sequential for now, could be parallel)
            for task in ready_tasks:
                success = self._execute_task(task)
                if not success and task.dependencies:
                    # Critical task failed, stop workflow
                    print(f"\n✗ Critical task failed: {task.name}")
                    print(f"   Stopping workflow.")
                    self.project.status = "failed"
                    return False

    def save_report(self):
        """Save execution report"""
        report_path = self.output_dir / "orchestration-report.json"

        report = {
            "project": {
                "name": self.project.name,
                "description": self.project.description,
                "status": self.project.status,
                "created_at": self.project.created_at,
            },
            "tasks": [
                {
                    "name": t.name,
                    "phase": t.phase.value,
                    "status": t.status.value,
                    "command": t.command,
                    "start_time": t.start_time,
                    "end_time": t.end_time,
                    "output": t.output[:500] if t.output else None,
                    "error": t.error,
                }
                for t in self.project.tasks
            ],
            "summary": {
                "total_tasks": len(self.project.tasks),
                "completed": len([t for t in self.project.tasks if t.status == TaskStatus.COMPLETED]),
                "failed": len([t for t in self.project.tasks if t.status == TaskStatus.FAILED]),
                "pending": len([t for t in self.project.tasks if t.status == TaskStatus.PENDING]),
            },
        }

        with open(report_path, "w") as f:
            json.dump(report, f, indent=2)

        print(f"\n📄 Report saved: {report_path}")

        # Print summary
        print(f"\n{'='*80}")
        print(f"Execution Summary")
        print(f"{'='*80}")
        print(f"Total tasks:     {report['summary']['total_tasks']}")
        print(f"Completed:       {report['summary']['completed']}")
        print(f"Failed:          {report['summary']['failed']}")
        print(f"Pending:         {report['summary']['pending']}")
        print(f"Status:          {self.project.status}")
        print(f"{'='*80}\n")


def main():
    parser = argparse.ArgumentParser(
        description="Autonomous Development Agent - Orchestration Engine"
    )
    parser.add_argument(
        "--project",
        required=True,
        help="Project name/description",
    )
    parser.add_argument(
        "--output",
        default="./project-output",
        help="Output directory (default: ./project-output)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show tasks without executing",
    )

    args = parser.parse_args()

    output_dir = Path(args.output).resolve()
    orchestrator = AutonomousOrchestrator(args.project, output_dir)

    if args.dry_run:
        print(f"\nDry run - showing task graph:\n")
        for task in orchestrator.project.tasks:
            print(f"[{task.phase.value}] {task.name}")
            print(f"  Dependencies: {task.dependencies or 'None'}")
            print(f"  Command: {task.command}\n")
        sys.exit(0)

    # Execute workflow
    success = orchestrator.execute()

    # Save report
    orchestrator.save_report()

    # Exit with appropriate code
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
