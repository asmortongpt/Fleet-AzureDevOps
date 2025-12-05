# Fleet Frontend Refactoring Orchestrator

**Multi-Agent Build System for Database-Driven, Production-Only Refactoring**

This orchestration system coordinates specialized AI agents to systematically refactor the Fleet frontend, eliminating architectural technical debt while maintaining production quality and zero downtime.

---

## Quick Start

### Prerequisites

1. **Database Access**
   - Azure SQL Database connection string configured in `~/.env`
   - PostgreSQL client (`psql`) installed

2. **API Keys**
   - Anthropic API key (`ANTHROPIC_API_KEY`)
   - OpenAI API key (`OPENAI_API_KEY`)
   - GitHub PAT (`GITHUB_PAT`) with repo permissions

3. **Tools**
   - Python 3.10+ with `psycopg2`, `anthropic`, `openai`
   - GitHub CLI (`gh`) authenticated
   - Git configured

### Installation

```bash
# 1. Install Python dependencies
pip install psycopg2-binary anthropic openai python-dotenv

# 2. Verify database connection
psql -h ppmo.database.windows.net -U CloudSA40e5e252 -d ppmosql -c "SELECT version();"

# 3. Initialize database schema
cd /Users/andrewmorton/Documents/GitHub/fleet-local/orchestrator
psql -h ppmo.database.windows.net -U CloudSA40e5e252 -d ppmosql -f db/schema.sql

# 4. Seed initial data (project, agents, tasks)
psql -h ppmo.database.windows.net -U CloudSA40e5e252 -d ppmosql -f db/seed.sql

# 5. Verify seeding
psql -h ppmo.database.windows.net -U CloudSA40e5e252 -d ppmosql -c "
SELECT
  p.name as project,
  COUNT(DISTINCT t.id) as total_tasks,
  COUNT(DISTINCT a.id) as total_agents
FROM projects p
LEFT JOIN tasks t ON t.project_id = p.id
LEFT JOIN agents a ON a.active = true
WHERE p.id = '11111111-1111-1111-1111-111111111111'
GROUP BY p.name;
"
```

### Run Orchestrator

```bash
# Load environment variables and run
python3 orchestrator.py

# Monitor progress in another terminal
watch -n 10 cat status.json
```

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Orchestrator (Main)                       │
│  - Loads tasks from DB                                       │
│  - Assigns to agents                                         │
│  - Monitors progress                                         │
│  - Enforces quality gates                                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ├─────────────────┐
                            │                 │
                ┌───────────▼──────┐  ┌──────▼──────────┐
                │   Database       │  │  Agent Executor │
                │  (PostgreSQL)    │  │  (LLM Interface)│
                │                  │  │                 │
                │  - projects      │  │  - Claude API   │
                │  - tasks         │  │  - OpenAI API   │
                │  - agents        │  │  - Task exec    │
                │  - assignments   │  │  - Git/GitHub   │
                │  - evidence      │  └─────────────────┘
                └──────────────────┘
                            │
                ┌───────────▼──────────────────┐
                │      Specialized Agents      │
                │                              │
                │  - architect-prime          │
                │  - typescript-specialist    │
                │  - component-architect      │
                │  - hooks-specialist         │
                │  - refactoring-expert       │
                │  - test-engineer            │
                │  - code-reviewer            │
                │  - pr-manager               │
                │  - zod-specialist           │
                └──────────────────────────────┘
                            │
                ┌───────────▼──────────────────┐
                │       GitHub/Azure           │
                │                              │
                │  - Branches                  │
                │  - Pull Requests             │
                │  - CI/CD Pipelines           │
                │  - Code Review               │
                └──────────────────────────────┘
```

### Database Schema

See `db/schema.sql` for full schema. Key tables:

- **projects** - Top-level projects (e.g., "Fleet Frontend Refactoring")
- **tasks** - Hierarchical task structure with dependencies
- **agents** - Specialized AI agents (role, LLM model, capabilities)
- **assignments** - Maps agents to tasks with progress tracking
- **evidence** - Audit trail (PRs, commits, test reports, citations)

### Agent Roles

| Agent | Role | LLM | Capabilities | Max Tasks |
|-------|------|-----|--------------|-----------|
| architect-prime | planner | claude-sonnet-4-5 | architecture, decomposition | 1 |
| typescript-specialist | coder | claude-sonnet-4-5 | typescript, strict-mode | 3 |
| eslint-specialist | coder | gpt-4.5-preview | eslint, quality | 2 |
| component-architect | coder | claude-sonnet-4-5 | react, components | 3 |
| hooks-specialist | coder | claude-sonnet-4-5 | hooks, state | 3 |
| refactoring-expert | coder | claude-sonnet-4-5 | refactoring, SRP | 5 |
| test-engineer | tester | gpt-4.5-preview | testing, coverage | 3 |
| code-reviewer | reviewer | claude-sonnet-4-5 | review, quality | 5 |
| pr-manager | devops | gpt-4.5-preview | github, ci-cd | 10 |
| zod-specialist | coder | claude-sonnet-4-5 | zod, validation | 3 |

---

## Execution Flow

### 1. Initialization

```sql
-- Database initialized with schema
CREATE TABLE projects, tasks, agents, assignments, evidence

-- Seed data inserted
INSERT INTO projects VALUES ('Fleet Frontend Refactoring', ...)
INSERT INTO agents VALUES ('typescript-specialist', ...)
INSERT INTO tasks VALUES ('Phase 1: TypeScript Strict Mode', ...)
```

### 2. Main Loop

```python
while True:
    # Get ready tasks (dependencies met)
    ready_tasks = db.get_ready_tasks(project_id, limit=10)

    if not ready_tasks:
        break  # All done

    # Assign tasks to agents
    for task in ready_tasks:
        agent = find_suitable_agent(task)
        db.assign_task(task.id, agent.id)

    # Execute tasks in parallel
    await asyncio.gather(*[
        executor.execute_task(task, agent, db)
        for task, agent in assignments
    ])

    # Update progress
    status = db.get_project_status(project_id)
    print_status(status)
```

### 3. Task Execution

```python
async def execute_task(task, agent, db):
    # 1. Create git branch
    branch = create_task_branch(task)

    # 2. Build prompt for agent
    prompt = build_task_prompt(task, agent)

    # 3. Execute via LLM (Claude or OpenAI)
    result = await execute_with_llm(prompt, agent.llm_model)

    # 4. Process result (implement changes)
    success = process_result(result, task, agent, db)

    if success:
        # 5. Create PR
        pr_url = create_pull_request(task, branch)

        # 6. Add evidence
        db.add_evidence(task.id, agent.id, "pr", pr_url, "PR created")

        # 7. Mark complete
        db.mark_task_complete(task.id, agent.id)
```

### 4. Quality Gates

Every task must pass:

- **Gate A:** Unit & integration tests pass
- **Gate B:** Static analysis (lint, types, security)
- **Gate C:** Code review (reviewer agent approval)
- **Gate D:** E2E tests pass against live build

### 5. Merge & Deploy

```bash
# CI/CD pipeline triggered on PR creation
1. Lint → npm run lint
2. Type check → tsc --noEmit
3. Unit tests → npm test
4. Build → npm run build
5. E2E tests → npm run test:e2e
6. Security scan → npm audit

# If all pass → Auto-merge (if configured)
# Then → Deploy to staging → Smoke tests → Deploy to production
```

---

## Status Monitoring

### Real-Time Status

The orchestrator continuously writes `status.json`:

```json
{
  "project": "Fleet Frontend Architectural Refactoring",
  "repo": "asmortongpt/Fleet",
  "overall_percent_complete": 42,
  "tasks": [
    {
      "id": "task-phase1-...",
      "title": "Phase 1: Enable TypeScript Strict Mode & ESLint",
      "status": "done",
      "percent_complete": 100,
      "assignee": {
        "agent": "typescript-specialist",
        "llm_model": "claude-sonnet-4-5"
      },
      "links": {
        "pr": "https://github.com/asmortongpt/Fleet/pull/123",
        "branch": "refactor/enable-typescript-strict-mode"
      }
    },
    ...
  ],
  "agents": [
    {
      "name": "typescript-specialist",
      "role": "coder",
      "llm_model": "claude-sonnet-4-5",
      "active": true,
      "assignments_in_progress": 2,
      "utilization": 0.67
    },
    ...
  ],
  "quality_gates": {
    "tests": "pass",
    "lint": "pass",
    "types": "pass",
    "security": "pass",
    "prod_validator": "pass"
  },
  "notes": [
    "Phase 1 complete: TypeScript strict mode enabled",
    "Phase 2 in progress: Creating shared components",
    "3 agents active, 5 tasks in progress"
  ]
}
```

### Watch Progress

```bash
# Terminal 1: Run orchestrator
python3 orchestrator.py

# Terminal 2: Monitor status
watch -n 10 cat status.json

# Terminal 3: Monitor database
watch -n 10 'psql -h ppmo.database.windows.net -U CloudSA40e5e252 -d ppmosql -c "
SELECT status, COUNT(*) as count
FROM tasks
WHERE project_id = '\''11111111-1111-1111-1111-111111111111'\''
GROUP BY status
"'
```

---

## Task Phases

See `TASK_PLAN.md` for complete details. Summary:

1. **Phase 1** (24h): TypeScript Strict Mode & ESLint
2. **Phase 2** (40h): Shared Components (DataTable, DialogForm, FilterPanel, PageHeader)
3. **Phase 3** (32h): Shared Hooks (useFilters, useExport, useMetrics)
4. **Phase 4** (50h): Refactor DataWorkbench monolith
5. **Phase 5** (50h): Refactor AssetManagement monolith
6. **Phase 6** (50h): Refactor IncidentManagement monolith
7. **Phase 7** (40h): Zod Schema Implementation
8. **Phase 8** (24h): Folder Structure Reorganization
9. **Phase 9** (60h): Test Coverage Expansion (80%+ goal)

**Total:** 360+ hours

---

## Parallelization Strategy

The orchestrator maximizes parallel execution:

```
Phase 1
  ├─→ Phase 2 (parallel)
  ├─→ Phase 3 (parallel)
  └─→ Phase 7 (parallel)

Phase 2 + Phase 3
  ├─→ Phase 4 (parallel)
  ├─→ Phase 5 (parallel)
  └─→ Phase 6 (parallel)

Phase 4 + Phase 5 + Phase 6
  └─→ Phase 8

Phase 2 + Phase 3 + Phase 4 + Phase 5 + Phase 6
  └─→ Phase 9
```

**Max parallel agents:** 10
**Typical concurrency:** 5-7 agents active simultaneously

---

## Failure Handling

### Retry Strategy

```python
MAX_RETRIES = 3
BACKOFF = [1, 5, 15]  # minutes

for attempt in range(MAX_RETRIES):
    try:
        result = await execute_task(task, agent, db)
        if result:
            return  # Success
    except Exception as e:
        if attempt < MAX_RETRIES - 1:
            await asyncio.sleep(BACKOFF[attempt] * 60)
            continue
        else:
            escalate_to_cto_agent(task, error=e)
```

### Escalation

After 3 failures:
1. Escalate to `architect-prime` (CTO agent)
2. Generate detailed failure report
3. Flag for human intervention
4. Pause dependent tasks

---

## Security Considerations

All code adheres to security principles from `~/.env`:

- ✅ Parameterized queries only ($1, $2, $3) - never string concatenation
- ✅ No hardcoded secrets - use env vars or Azure Key Vault
- ✅ bcrypt/argon2 for passwords (cost >= 12)
- ✅ Validate ALL inputs (whitelist approach), escape output
- ✅ execFile() with arrays, never exec() with user input
- ✅ Non-root containers, readOnlyRootFilesystem: true
- ✅ Security headers (Helmet), HTTPS everywhere
- ✅ Threat model BEFORE coding

---

## Troubleshooting

### Database Connection Fails

```bash
# Test connection
psql -h ppmo.database.windows.net -U CloudSA40e5e252 -d ppmosql -c "SELECT 1"

# Check credentials in ~/.env
cat ~/.env | grep AZURE_SQL
```

### GitHub Auth Fails

```bash
# Test GitHub CLI
gh auth status

# Re-authenticate
gh auth login
```

### Agent Execution Fails

```bash
# Check API keys
echo $ANTHROPIC_API_KEY | head -c 20
echo $OPENAI_API_KEY | head -c 20

# Test API connectivity
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{"model":"claude-sonnet-4-5","max_tokens":1024,"messages":[{"role":"user","content":"test"}]}'
```

### Task Stuck in "in_progress"

```sql
-- Reset stuck task
UPDATE tasks SET status = 'pending', started_at = NULL WHERE id = '<task-id>';
UPDATE assignments SET status = 'pending', started_at = NULL WHERE task_id = '<task-id>';
```

---

## Files Reference

```
orchestrator/
├── README.md                 # This file
├── TASK_PLAN.md              # Comprehensive task breakdown
├── orchestrator.py           # Main orchestration engine
├── db/
│   ├── schema.sql            # Database schema
│   └── seed.sql              # Seed data (project, agents, tasks)
└── status.json               # Real-time status output (generated)
```

---

## Next Steps

1. ✅ **Initialize Database**
   ```bash
   psql -h ppmo.database.windows.net -U CloudSA40e5e252 -d ppmosql -f db/schema.sql
   psql -h ppmo.database.windows.net -U CloudSA40e5e252 -d ppmosql -f db/seed.sql
   ```

2. ✅ **Verify Environment**
   ```bash
   # Check API keys
   echo $ANTHROPIC_API_KEY $OPENAI_API_KEY $GITHUB_PAT

   # Check database access
   psql -h ppmo.database.windows.net -U CloudSA40e5e252 -d ppmosql -c "SELECT COUNT(*) FROM agents"
   ```

3. ✅ **Run Orchestrator**
   ```bash
   python3 orchestrator.py
   ```

4. ✅ **Monitor Progress**
   ```bash
   watch -n 10 cat status.json
   ```

5. ✅ **Review PRs**
   - Check GitHub for auto-created PRs
   - Verify CI/CD passes
   - Human review if needed

---

## Support

For issues or questions:
- Check `TASK_PLAN.md` for task details
- Review `db/schema.sql` for database structure
- Examine `status.json` for real-time progress
- Query database for detailed task state

---

**Remember:** You are the conductor, not the implementer. Coordinate, monitor, and ensure quality - let the specialized agents do the work.

---

**Document Version:** 1.0
**Last Updated:** 2025-12-04
**Owner:** Primary Orchestrator (Architect Prime)
