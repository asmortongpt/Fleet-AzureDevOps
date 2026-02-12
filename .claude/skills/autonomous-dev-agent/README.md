# Autonomous Development Agent - Orchestration Engine

Executable orchestration engine that autonomously manages the complete SDLC from requirements to deployment.

## Features

✅ **Task Dependency Management** - Executes tasks in correct order
✅ **Phase-based Workflow** - Organizes work into SDLC phases
✅ **Error Handling** - Stops workflow on critical failures
✅ **Progress Tracking** - Real-time execution status
✅ **Execution Reports** - JSON reports with detailed metrics
✅ **Dry Run Mode** - Preview task graph before execution

## Installation

No dependencies required - uses Python 3.8+ standard library.

```bash
chmod +x orchestrator.py
```

## Usage

### Basic Execution

```bash
# Run complete autonomous workflow
./orchestrator.py --project "E-Commerce Platform" --output ./my-project

# Specify custom output directory
./orchestrator.py --project "SaaS Application" --output /path/to/output
```

### Dry Run

```bash
# Preview task graph without executing
./orchestrator.py --project "My App" --dry-run
```

## Workflow Phases

The orchestrator executes tasks across 7 SDLC phases:

### 1. Requirements Analysis
- Analyze project requirements
- Create user stories
- Define acceptance criteria

### 2. System Design
- Generate architecture diagrams (Mermaid)
- Create OpenAPI specifications
- Design database schema

### 3. Backend Development
- Setup Express + Prisma + TypeScript template
- Initialize database with Prisma
- Generate type-safe client

### 4. Frontend Development *(planned)*
- Setup React + TypeScript + Vite template
- Configure state management
- Create component library

### 5. Infrastructure Setup
- Configure Terraform modules
- Setup Kubernetes manifests
- Create Helm charts

### 6. Testing
- Configure load testing (k6)
- Setup integration tests
- Run test suites

### 7. Deployment
- Generate documentation
- Create deployment guides
- Prepare production configs

## Task Dependency Graph

```
analyze_requirements
  └── create_user_stories
        └── design_architecture
              └── generate_openapi_spec
                    └── setup_backend_template
                          └── initialize_database
                                └── setup_terraform
                                      └── setup_kubernetes
                                            └── setup_helm_chart
                                                  └── run_load_tests
                                                        └── generate_documentation
```

## Output Structure

```
project-output/
├── backend/
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   └── Dockerfile
├── infrastructure/
│   ├── terraform/
│   ├── k8s/
│   └── helm/
├── docs/
│   ├── architecture.mmd
│   └── api-spec.yaml
├── tests/
│   └── load-tests/
└── orchestration-report.json
```

## Execution Report

After execution, a detailed JSON report is generated:

```json
{
  "project": {
    "name": "E-Commerce Platform",
    "status": "completed",
    "created_at": "2026-02-10T10:30:00"
  },
  "tasks": [
    {
      "name": "setup_backend_template",
      "phase": "backend_development",
      "status": "completed",
      "start_time": "2026-02-10T10:31:15",
      "end_time": "2026-02-10T10:31:20",
      "output": "Backend template copied successfully",
      "error": null
    }
  ],
  "summary": {
    "total_tasks": 11,
    "completed": 11,
    "failed": 0,
    "pending": 0
  }
}
```

## Task Status States

- **PENDING** - Waiting for dependencies
- **IN_PROGRESS** - Currently executing
- **COMPLETED** - Successfully finished
- **FAILED** - Execution failed
- **SKIPPED** - Intentionally skipped

## Error Handling

### Critical Failures
Tasks with dependencies are considered critical. If they fail, the workflow stops.

### Non-Critical Failures
Tasks without dependencies may fail without stopping the workflow.

### Timeouts
Each task has a 5-minute timeout. Exceeding this marks the task as failed.

## Customization

### Adding Custom Tasks

Edit `orchestrator.py` and add tasks to `_build_task_graph()`:

```python
Task(
    name="my_custom_task",
    phase=Phase.BACKEND_DEV,
    command="echo 'Custom task'",
    dependencies=["setup_backend_template"],
)
```

### Parallel Execution

Modify `execute()` to run independent tasks in parallel:

```python
from concurrent.futures import ThreadPoolExecutor

with ThreadPoolExecutor(max_workers=4) as executor:
    futures = [executor.submit(self._execute_task, task) for task in ready_tasks]
```

## Integration with Other Skills

### Research Agent
```python
Task(
    name="research_tech_stack",
    phase=Phase.SYSTEM_DESIGN,
    command=f"python {base_path}/research-agent/scripts/research_live.py --tech-stack '{project_name}' --requirements 'auth,api'",
    dependencies=["analyze_requirements"],
)
```

### Load Testing
```python
Task(
    name="run_load_tests",
    phase=Phase.TESTING,
    command=f"k6 run {base_path}/system-design/tools/load-testing/api-load-test.js",
    dependencies=["deploy_to_staging"],
)
```

## Examples

### Full Autonomous Build

```bash
# Build complete application autonomously
./orchestrator.py \
  --project "Tire Retail ERP System" \
  --output ./tire-retail-erp

# Output:
# ================================================================================
# Autonomous Development Orchestrator
# Project: Tire Retail ERP System
# Output: ./tire-retail-erp
# Tasks: 11
# ================================================================================
#
# [requirements] analyze_requirements
#   Command: echo 'Requirements analysis for Tire Retail ERP System'
#   ✓ Completed
#
# [requirements] create_user_stories
#   Command: echo 'Creating user stories...'
#   ✓ Completed
#
# [system_design] design_architecture
#   Command: node .../generate-architecture-diagram.js system
#   ✓ Completed
# ...
```

### Dry Run Preview

```bash
./orchestrator.py --project "My App" --dry-run

# Output:
# Dry run - showing task graph:
#
# [requirements] analyze_requirements
#   Dependencies: None
#   Command: echo 'Requirements analysis for My App'
#
# [requirements] create_user_stories
#   Dependencies: ['analyze_requirements']
#   Command: echo 'Creating user stories...'
# ...
```

## Monitoring

### Real-time Progress

The orchestrator prints real-time progress:

```
[backend_development] setup_backend_template
  Command: cp -r .../express-prisma-typescript ./output/backend
  ✓ Completed
  Output: Directory copied successfully
```

### Final Summary

```
================================================================================
Execution Summary
================================================================================
Total tasks:     11
Completed:       11
Failed:          0
Pending:         0
Status:          completed
================================================================================
```

## Troubleshooting

### "Task timeout (5 minutes)"
- Increase timeout in `_execute_task()`
- Check if task is hanging
- Break task into smaller sub-tasks

### "Workflow blocked"
- Check dependency graph
- Verify previous tasks completed
- Review orchestration report

### "Critical task failed"
- Check task error message
- Verify tool availability (node, npm, k6)
- Check file permissions

## Future Enhancements

- [ ] Parallel task execution
- [ ] CI/CD integration (GitHub Actions)
- [ ] Real-time web dashboard
- [ ] Rollback on failure
- [ ] Resume from checkpoint
- [ ] Multi-project orchestration

## License

MIT
