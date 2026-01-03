# Autonomous Development Platform

Complete autonomous development system for rebuilding applications into production-ready solutions with AI-driven quality assurance, reflection loops, and comprehensive testing.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     AutoDev CLI Interface                       │
│  autodev ingest | plan | branch | rebuild | verify | deploy    │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    Orchestrator (State Machine)                 │
│  • Work Item Graph Management                                   │
│  • Dependency Resolution                                        │
│  • QA + Reflection Loops                                        │
│  • Branch-per-work-item Management                             │
└─────┬──────────┬──────────┬──────────┬──────────┬──────────────┘
      │          │          │          │          │
┌─────▼──┐ ┌────▼───┐ ┌────▼───┐ ┌───▼────┐ ┌──▼─────┐
│ Repo   │ │ Test   │ │Browser │ │Security│ │DevOps  │
│ Tools  │ │ Tools  │ │ Tools  │ │ Tools  │ │ Tools  │
│ MCP    │ │ MCP    │ │ MCP    │ │ MCP    │ │ MCP    │
│ Server │ │ Server │ │ Server │ │ Server │ │ Server │
└────────┘ └────────┘ └────────┘ └────────┘ └────────┘
     │          │          │          │          │
     └──────────┴──────────┴──────────┴──────────┘
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
┌───────▼────────┐              ┌───────────▼──────────┐
│  Memory Systems │              │   Task Queue         │
│  • RAG (pgvector)│              │   • Celery Workers   │
│  • CAG (specs)   │              │   • Redis Broker     │
└──────────────────┘              └──────────────────────┘
```

## Core Components

### 1. MCP Tool Servers (FastAPI Microservices)

#### Repo Tools (Port 8001)
- Filesystem operations (read, write, delete, list)
- Git operations (clone, pull, checkout, branch, commit, diff, status)
- AST scanning (Python, TypeScript, JavaScript)
- Dependency graph analysis
- Code search and pattern matching

#### Test Tools (Port 8002)
- Linting (ESLint, Ruff, Flake8)
- Type checking (TypeScript, mypy)
- Unit tests (Jest, Vitest, pytest)
- Integration tests
- Coverage analysis with thresholds
- JUnit XML and HTML report generation

#### Browser Tools (Port 8003)
- Playwright E2E testing
- HTML test reports
- Trace-on-first-retry
- Screenshot capture
- Cross-browser testing (Chromium, Firefox, WebKit)

#### Security Tools (Port 8004)
- SCA (Software Composition Analysis)
- Secret scanning
- SAST (Static Application Security Testing)
- License scanning
- OWASP ASVS verification
- CVE detection and reporting

#### DevOps Tools (Port 8005)
- Azure DevOps pipeline generation
- Terraform infrastructure code generation
- Docker image building
- Kubernetes manifest generation
- CI/CD template creation

### 2. Orchestrator (Python State Machine)

**State Machine:** `pending → queued → in_progress → verifying → reflection → completed`

**Key Features:**
- Durable state persistence (PostgreSQL)
- Celery for async task execution
- Retry logic with exponential backoff
- Work item dependency graph
- Topological sorting for execution order
- Concurrency control

**QA + Reflection Loop:**
```
implement → verify → evidence → security → reflection
                                              │
                                    "Is this the best?"
                                              │
                                    ├─ YES → complete
                                    └─ NO  → refine → implement
```

### 3. Memory Systems

#### RAG (Retrieval-Augmented Generation)
- **Technology:** PostgreSQL + pgvector
- **Vector Dimensions:** 1536 (OpenAI embeddings)
- **Namespaces:**
  - `rag_fleet_core`: Fleet Management System codebase
  - `rag_platform_core`: AutoDev platform internals
  - `rag_external_patterns`: Best practices and patterns

**Search Function:**
```sql
SELECT * FROM rag.search_embeddings(
    query_embedding := $1,
    search_namespace := 'rag_fleet_core',
    limit_count := 10
);
```

#### CAG (Codebase-as-Graph)
- **Structured Artifacts:** Stored as JSONB in PostgreSQL
- **Artifact Types:**
  - `architecture.md`: System architecture
  - `domain_model.json`: Domain entities and relationships
  - `api_contracts.md`: API specifications
  - `test_strategy.md`: Testing approach
  - `deployment_spec.md`: Infrastructure requirements
  - `security_requirements.md`: Security controls

### 4. CLI (`autodev`)

**Installation:**
```bash
cd cli && pip install -e .
```

**Commands:**

```bash
# Ingest codebase into RAG/CAG
autodev ingest --repo /path/to/repo

# Generate rebuild plan
autodev plan --repo /path/to/repo --output plan.json

# Create branches for work items
autodev branch --repo /path/to/repo --mode work-items

# Rebuild with QA loops
autodev rebuild --repo /path/to/repo --target production

# Run all quality gates
autodev verify --repo /path/to/repo --all

# Create pull requests
autodev pr --repo /path/to/repo --work-item WI-123

# Merge train (dependency-ordered)
autodev merge-train --repo /path/to/repo

# Deploy to Azure
autodev deploy --repo /path/to/repo --azure-devops
```

### 5. Quality Gates

**Coverage Thresholds:**
- Backend: ≥85% lines/branches
- Frontend: ≥70% lines/branches

**Security Gates:**
- Zero HIGH/CRITICAL CVEs
- No hardcoded secrets
- OWASP ASVS L2 compliance
- Parameterized SQL queries only

**No AI Fingerprints Gate:**
```bash
./scripts/gates/no_ai_fingerprints.sh <repo_path>
```

Detects and blocks:
- TODO/FIXME comments
- Placeholder functions
- Mock data arrays
- AI-generated code comments

**Playwright Configuration:**
- Trace on first retry (not always-on)
- HTML reports with screenshots
- Retries: 2
- Timeout: 30s per test

### 6. Branch-per-Work-Item

**Branch Naming:** `autodev/<type>-<slug>`

**Types:**
- `feature`: New functionality
- `bugfix`: Bug fixes
- `refactor`: Code improvements
- `test`: Test additions
- `docs`: Documentation
- `security`: Security fixes
- `performance`: Performance optimizations

**File Scope Restrictions:**
Each work item has an array of file patterns it can modify:
```json
{
  "work_item_id": "WI-123",
  "file_scope": [
    "src/modules/fleet/**/*",
    "tests/fleet/**/*"
  ]
}
```

**PR Automation:**
- Auto-generated PR description with evidence
- Test coverage reports attached
- Security scan results included
- Deployment checklist

**Merge Train:**
- Dependency-ordered merging
- Automatic rebasing on conflicts
- CI verification before merge
- Rollback on failure

## Quick Start

### Prerequisites

```bash
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com | sh
sudo systemctl enable docker
sudo systemctl start docker

# Install Make
sudo apt-get install make
```

### Setup

```bash
# Clone repository
git clone <repo-url> /workspace/fleet-autodev
cd /workspace/fleet-autodev

# Create environment file
cp .env.example .env
nano .env  # Add your API keys

# Build and start all services
make build
make up

# Verify services
make verify

# Install CLI
make install-cli
```

### Environment Variables

```bash
POSTGRES_PASSWORD=<secure_password>
ANTHROPIC_API_KEY=<your_anthropic_key>
OPENAI_API_KEY=<your_openai_key>
AZURE_DEVOPS_PAT=<your_azure_devops_pat>
```

### Run Demo App

```bash
# Navigate to demo app
cd examples/demo_app

# Run complete rebuild
autodev rebuild --repo . --target production

# This will:
# 1. Ingest codebase into RAG/CAG
# 2. Generate work items and dependency graph
# 3. Create branches for each work item
# 4. Implement features with QA loops
# 5. Run all quality gates
# 6. Create PRs with evidence
# 7. Execute merge train
# 8. Deploy to production
```

## Development Workflow

### 1. Ingest Codebase

```bash
autodev ingest --repo /path/to/fleet
# ✓ Scanning files...
# ✓ Generating embeddings...
# ✓ Extracting architecture...
# ✓ Creating domain model...
# ✓ Analyzing API contracts...
# ✓ Ingestion complete: 15,432 chunks in RAG
```

### 2. Generate Plan

```bash
autodev plan --repo /path/to/fleet --output rebuild_plan.json
# ✓ Analyzing codebase...
# ✓ Identifying gaps...
# ✓ Generating work items...
# ✓ Building dependency graph...
# ✓ Plan generated: 247 work items
```

**Plan Structure:**
```json
{
  "project_id": "fleet_rebuild",
  "work_items": [
    {
      "id": "WI-001",
      "title": "Implement authentication middleware",
      "type": "feature",
      "priority": 100,
      "depends_on": [],
      "file_scope": ["src/middleware/**/*"],
      "acceptance_criteria": [...]
    }
  ],
  "dependency_graph": {...}
}
```

### 3. Execute Rebuild

```bash
autodev rebuild --repo /path/to/fleet --target production

# Progress output:
# [1/247] WI-001: Implementing authentication middleware...
#   ├─ Implementation: ✓
#   ├─ Unit tests: ✓ (92% coverage)
#   ├─ Integration tests: ✓
#   ├─ Security scan: ✓ (0 HIGH/CRITICAL)
#   ├─ Linting: ✓
#   ├─ Type check: ✓
#   └─ Reflection: "High quality implementation" → COMPLETE
#
# [2/247] WI-002: Add authorization RBAC layer...
```

### 4. Verify Quality

```bash
autodev verify --repo /path/to/fleet --all

# Running quality gates:
# ✓ Linting (0 errors, 3 warnings)
# ✓ Type checking (0 errors)
# ✓ Unit tests (1,247 passed, 0 failed)
# ✓ Integration tests (183 passed, 0 failed)
# ✓ E2E tests (94 passed, 0 failed)
# ✓ Coverage (Backend: 91%, Frontend: 78%)
# ✓ Security scan (0 HIGH, 2 MEDIUM)
# ✓ No AI fingerprints
# ✓ OWASP ASVS L2
#
# Overall: PASS ✓
```

### 5. Deploy

```bash
autodev deploy --repo /path/to/fleet --azure-devops

# ✓ Generating Azure Pipelines...
# ✓ Generating Terraform configs...
# ✓ Pushing to Azure DevOps...
# ✓ Triggering deployment...
# ✓ Deployment complete!
```

## Monitoring

### Service Status

```bash
make status
# orchestrator     Up      0.0.0.0:8000->8000/tcp
# mcp-repo-tools   Up      0.0.0.0:8001->8001/tcp
# mcp-test-tools   Up      0.0.0.0:8002->8002/tcp
# postgres         Up      0.0.0.0:5432->5432/tcp
# redis            Up      0.0.0.0:6379->6379/tcp
# celery-worker    Up
# flower           Up      0.0.0.0:5555->5555/tcp
```

### Logs

```bash
# All logs
make logs

# Specific service
make logs-svc SVC=orchestrator

# Tail logs
make tail
```

### Celery Monitoring

```bash
# Open Flower UI
make flower
# Visit http://localhost:5555

# Celery inspect
docker-compose exec celery-worker celery -A tasks inspect active
```

### Database

```bash
# PostgreSQL shell
make db-shell

# Check RAG embeddings
SELECT namespace, COUNT(*) FROM rag.embeddings GROUP BY namespace;

# Check work items
SELECT status, COUNT(*) FROM orchestrator.work_items GROUP BY status;
```

## Testing

### Platform Verification

```bash
make test
# Runs comprehensive platform tests
```

### Demo App

```bash
make demo
# Runs full rebuild on demo application
```

## Backup & Recovery

### Database Backup

```bash
make backup-db
# Database backed up to backups/autodev-20260103-120000.sql
```

### Database Restore

```bash
make restore-db FILE=backups/autodev-20260103-120000.sql
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs
make logs-svc SVC=<service-name>

# Restart service
make restart-svc SVC=<service-name>

# Complete reset
make reset
```

### Database Connection Issues

```bash
# Check PostgreSQL
docker-compose exec postgres pg_isready -U autodev

# Check connections
docker-compose exec postgres psql -U autodev -d autodev -c "SELECT COUNT(*) FROM pg_stat_activity;"
```

### Celery Workers Not Processing

```bash
# Check Redis
docker-compose exec redis redis-cli ping

# Inspect Celery
docker-compose exec celery-worker celery -A tasks inspect active

# Restart workers
make restart-svc SVC=celery-worker
```

## Advanced Configuration

### Scaling Celery Workers

```yaml
# docker-compose.yml
celery-worker:
  deploy:
    replicas: 8  # Scale to 8 workers
```

Or via command line:
```bash
docker-compose up -d --scale celery-worker=8
```

### Custom MCP Servers

Add new MCP servers by creating:
1. `mcp/<server-name>/server.py`
2. `mcp/<server-name>/Dockerfile`
3. Add to `docker-compose.yml`
4. Update orchestrator to call new server

### Custom Quality Gates

Add gates in `scripts/gates/`:
```bash
#!/bin/bash
# scripts/gates/custom_gate.sh
# Exit 0 for pass, non-zero for fail
```

Register in orchestrator:
```python
# orchestrator/quality_gates.py
GATES = {
    "custom_gate": "/app/scripts/gates/custom_gate.sh"
}
```

## Production Deployment

### Azure VM Setup

```bash
# Create VM
az vm create \
  --resource-group autodev-rg \
  --name autodev-vm \
  --image Ubuntu2204 \
  --size Standard_D8s_v3 \
  --admin-username autodev \
  --generate-ssh-keys

# Install Docker
ssh autodev@<VM_IP>
curl -fsSL https://get.docker.com | sh

# Clone and deploy
git clone <repo-url> /opt/autodev
cd /opt/autodev
make prod  # Production mode with 4 workers
```

### Production Environment Variables

Store in Azure Key Vault:
```bash
az keyvault secret set --vault-name autodev-kv --name postgres-password --value <password>
az keyvault secret set --vault-name autodev-kv --name anthropic-api-key --value <key>
```

### HTTPS/TLS

```bash
# Install Certbot
sudo apt-get install certbot

# Get certificate
sudo certbot certonly --standalone -d autodev.yourdomain.com

# Update nginx in docker-compose.yml to mount certificates
```

## Architecture Decisions

### Why PostgreSQL + pgvector?
- Mature, reliable database
- Native vector similarity search
- ACID compliance for state management
- Rich JSON support for CAG artifacts
- Proven at scale

### Why Celery?
- Battle-tested task queue
- Python-native
- Rich feature set (retries, priorities, chaining)
- Excellent monitoring (Flower)
- Horizontal scalability

### Why FastAPI for MCP Servers?
- Modern Python async framework
- Automatic OpenAPI documentation
- High performance
- Type safety with Pydantic
- Easy to containerize

### Why Separate MCP Servers?
- Isolation (tool failures don't cascade)
- Independent scaling
- Technology flexibility
- Clear boundaries
- Easy testing

## Performance Benchmarks

**Ingestion:**
- 10,000 files: ~5 minutes
- 100,000 LOC: ~2 minutes
- Embedding generation: ~1 min per 1,000 chunks

**Rebuild:**
- Small project (< 10 work items): ~30 minutes
- Medium project (50-100 work items): ~4 hours
- Large project (200+ work items): ~12 hours

**Quality Gates:**
- Lint: ~30 seconds
- Type check: ~45 seconds
- Unit tests: ~2 minutes
- Integration tests: ~5 minutes
- E2E tests: ~10 minutes
- Security scan: ~3 minutes

## License

Proprietary - Capital Tech Alliance

## Support

For issues or questions:
- Email: andrew.m@capitaltechalliance.com
- Documentation: /docs
- Issues: GitHub Issues
