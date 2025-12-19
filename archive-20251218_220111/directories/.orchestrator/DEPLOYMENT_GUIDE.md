# Fleet Agent Orchestration System - Deployment Guide

## Overview

This orchestration system coordinates 16+ autonomous coding agents across 3 Azure VMs to achieve 100x+ velocity on the Fleet architecture remediation project.

## Architecture

```
┌──────────────────────────────────────────────────────┐
│  Orchestrator VM (fleet-agent-orchestrator)          │
│  172.191.51.49 | Standard_D8s_v3 (8 vCPUs, 32GB)    │
│                                                      │
│  ┌────────────────────────────────────────────┐     │
│  │  PostgreSQL (Task Database)                │     │
│  │  - Projects, Tasks, Agents, Assignments    │     │
│  └────────────────────────────────────────────┘     │
│                                                      │
│  ┌────────────────────────────────────────────┐     │
│  │  Redis (Task Queue)                        │     │
│  │  - Distributed work queue                  │     │
│  └────────────────────────────────────────────┘     │
│                                                      │
│  ┌────────────────────────────────────────────┐     │
│  │  Orchestrator API (Express/TypeScript)     │     │
│  │  - REST API + WebSocket                    │     │
│  │  - Task assignment logic                   │     │
│  │  - Progress tracking                       │     │
│  │  - Git coordination                        │     │
│  └────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
  ┌──────────┐    ┌──────────┐    ┌──────────┐
  │ Worker 1 │    │ Worker 2 │    │   AKS    │
  │ Agents   │    │ Agents   │    │ Agents   │
  │  D-E     │    │  F-G     │    │  H-Z     │
  └──────────┘    └──────────┘    └──────────┘
```

## Prerequisites

1. **Azure CLI** authenticated
2. **SSH access** to all 3 VMs
3. **GitHub PAT** with repo access
4. **Docker** installed locally (for testing)

## Files Created

### Database
- `.orchestrator/db/schema.sql` - PostgreSQL schema with projects, tasks, agents, assignments, evidence

### API
- `.orchestrator/api/src/server.ts` - Express server with REST + WebSocket
- `.orchestrator/api/src/db.ts` - PostgreSQL connection pool
- `.orchestrator/api/src/routes/tasks.ts` - Task management endpoints
- `.orchestrator/api/src/routes/agents.ts` - Agent registration & heartbeat
- `.orchestrator/api/src/routes/assignments.ts` - Task assignment & progress
- `.orchestrator/api/src/routes/progress.ts` - Progress summaries & metrics
- `.orchestrator/api/src/routes/git.ts` - Git coordination & evidence
- `.orchestrator/api/src/seed-tasks.ts` - Seed 27 tasks from remediation plan
- `.orchestrator/api/package.json` - Dependencies
- `.orchestrator/api/tsconfig.json` - TypeScript config
- `.orchestrator/api/Dockerfile` - Multi-stage Docker build

### Infrastructure
- `.orchestrator/docker-compose.yml` - PostgreSQL + Redis + API + Dashboard
- `.orchestrator/scripts/setup-orchestrator.sh` - VM setup script
- `.orchestrator/scripts/deploy-to-azure-vm.sh` - Deployment automation

## Deployment Steps

### Option 1: Manual Deployment (Recommended for First Run)

#### Step 1: Deploy Orchestrator Hub

```bash
# SSH to orchestrator VM
az vm run-command invoke \
  --resource-group FLEET-AI-AGENTS \
  --name fleet-agent-orchestrator \
  --command-id RunShellScript \
  --scripts "curl -fsSL https://raw.githubusercontent.com/asmortongpt/Fleet/main/.orchestrator/scripts/setup-orchestrator.sh | bash"
```

Or manually:

```bash
# SSH directly
ssh azureuser@172.191.51.49

# Clone repo
git clone https://github.com/asmortongpt/Fleet.git /opt/fleet
cd /opt/fleet/.orchestrator

# Create .env file
cat > .env << EOF
ORCHESTRATOR_DB_PASSWORD=YourSecurePassword123!
GITHUB_PAT=your_github_pat_token
NODE_ENV=production
EOF

# Start services
docker-compose up -d postgres redis

# Wait for database (30 seconds)
sleep 30

# Install API dependencies
cd api
npm install --legacy-peer-deps

# Build API
npm run build

# Seed database
npm run seed

# Start orchestrator
cd ..
docker-compose up -d orchestrator

# Verify
docker ps
curl http://localhost:3000/health
```

#### Step 2: Verify Orchestrator

```bash
# Check services
docker ps

# Check logs
docker-compose logs orchestrator

# Test API
curl http://172.191.51.49:3000/api/tasks
curl http://172.191.51.49:3000/api/agents
curl http://172.191.51.49:3000/api/progress/summary
```

#### Step 3: Deploy Worker Agents (TODO - Next Phase)

Worker agent deployment scripts will:
1. Clone Fleet repo to each worker VM
2. Start autonomous-coder agents as Docker containers
3. Configure agents to report to orchestrator
4. Assign tasks from the queue

### Option 2: Automated Deployment

```bash
# Set GitHub PAT
export GITHUB_PAT=your_github_pat_here

# Run deployment script
cd /Users/andrewmorton/Documents/GitHub/Fleet/.orchestrator/scripts
chmod +x deploy-to-azure-vm.sh
./deploy-to-azure-vm.sh
```

## API Endpoints

### Tasks
- `GET /api/tasks` - List all tasks (filter by status, epic)
- `GET /api/tasks/:id` - Get task details
- `GET /api/tasks/ready/list` - Get tasks ready to start
- `PATCH /api/tasks/:id/progress` - Update task progress
- `PATCH /api/tasks/:id/git` - Update branch/PR info

### Agents
- `GET /api/agents` - List all agents
- `GET /api/agents/:id` - Get agent details
- `POST /api/agents/heartbeat` - Register/update agent (heartbeat)
- `POST /api/agents/:id/deactivate` - Deactivate agent

### Assignments
- `GET /api/assignments` - List all assignments
- `POST /api/assignments` - Assign task to agent
- `PATCH /api/assignments/:id/progress` - Update assignment progress

### Progress
- `GET /api/progress/summary` - Overall progress summary
- `GET /api/progress/agents` - Agent utilization metrics
- `POST /api/progress/snapshot` - Create progress snapshot
- `GET /api/progress/history/:project_id` - Progress history

### Git
- `GET /api/git/merge-queue` - Get tasks ready to merge
- `GET /api/git/branches` - Get active branches
- `POST /api/git/evidence` - Record evidence (commit, PR, test)
- `GET /api/git/evidence/:task_id` - Get evidence for task

### WebSocket
- `ws://172.191.51.49:3000/ws` - Real-time progress updates

## Database Schema

### Tables
- **projects** - Git repositories
- **tasks** - Work items (Epics, Issues) from ARCHITECTURE_REMEDIATION_PLAN.md
- **agents** - Autonomous coding agents (local + VM + AKS)
- **assignments** - Task→Agent mappings with progress
- **evidence** - Audit trail (commits, PRs, tests, builds)
- **progress_snapshots** - Time-series for velocity calculation

### Views
- **agent_status** - Agent health with assignments
- **epic_progress** - Progress summary per epic
- **task_dependencies** - Task readiness based on dependencies

## Seeded Data

The seed script populates:
- 1 project (Fleet)
- 27 tasks across 5 epics (592 hours total)
- 3 existing agents (agent-a, agent-b, agent-c)

Tasks include:
- **Epic 1:** Backend Repository Layer (7 issues, 160h)
- **Epic 2:** DI Container Integration (5 issues, 60h)
- **Epic 3:** Frontend Components (5 issues, 120h)
- **Epic 4:** Zod Schemas (5 issues, 40h) - 100% COMPLETE ✅
- **Epic 5:** Testing & Quality (6 issues, 152h)

## Security

All security requirements followed:
- ✅ Parameterized queries only ($1, $2, $3)
- ✅ No hardcoded secrets (env vars only)
- ✅ Helmet security headers
- ✅ CORS with strict origins
- ✅ Non-root Docker containers
- ✅ Health checks and graceful shutdown

## Monitoring

### Health Checks
```bash
# API health
curl http://172.191.51.49:3000/health

# Database health
docker exec fleet-orchestrator-db pg_isready -U orchestrator

# Redis health
docker exec fleet-orchestrator-redis redis-cli ping
```

### Logs
```bash
# All services
docker-compose logs -f

# Orchestrator API only
docker-compose logs -f orchestrator

# Database
docker-compose logs -f postgres
```

### Metrics
```bash
# Progress summary
curl http://172.191.51.49:3000/api/progress/summary | jq

# Agent utilization
curl http://172.191.51.49:3000/api/progress/agents | jq

# Merge queue
curl http://172.191.51.49:3000/api/git/merge-queue | jq
```

## Troubleshooting

### API not responding
```bash
docker-compose restart orchestrator
docker-compose logs orchestrator
```

### Database connection errors
```bash
docker-compose restart postgres
docker exec fleet-orchestrator-db psql -U orchestrator -d fleet_orchestrator -c "SELECT 1"
```

### Reset database
```bash
docker-compose down -v
docker-compose up -d postgres redis
sleep 10
cd api && npm run seed
```

## Next Steps

1. ✅ Deploy orchestrator hub (this guide)
2. ⏳ Deploy worker agents to fleet-dev-agent-01
3. ⏳ Deploy worker agents to agent-settings
4. ⏳ Build and deploy dashboard
5. ⏳ Configure AKS agents (Phase 3)
6. ⏳ Start autonomous execution

## Expected Performance

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Active Agents | 3 | 16+ | 5.3x |
| Velocity | 18.8x | 100x+ | 5.3x faster |
| ETA | 3 weeks | 5-7 days | 4x faster |

---

**Status:** Orchestrator infrastructure ready for deployment
**Created:** December 10, 2025
**Updated:** December 10, 2025
