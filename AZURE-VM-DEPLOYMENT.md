# 30-Agent Azure VM Deployment Guide

## Quick Start on Azure VM

### Option 1: Python Orchestrator (Recommended)

```bash
# SSH to Azure VM
ssh azureuser@<VM-IP>

# Clone repository
cd /tmp
git clone https://github.com/asmortongpt/Fleet-AzureDevOps.git fleet-remediation
cd fleet-remediation

# Set API key (use your own from ~/.env)
export ANTHROPIC_API_KEY="your-anthropic-api-key-here"

# Install dependencies
pip3 install aiohttp

# Run 30 agents
python3 orchestrator-30-agents.py
```

### Option 2: Bash Orchestrator

```bash
# Prerequisites
sudo apt-get update
sudo apt-get install -y curl jq git

# Run
export ANTHROPIC_API_KEY="your-anthropic-api-key-here"
export REPO_PATH="/tmp/fleet-remediation"
./orchestrate-30-agents.sh
```

## What the 30 Agents Fix

### Team 1: API Type Definitions (Agents 1-5)
- TensorFlow.js stub types
- OpenCV.js stub types
- SecretsManagementService
- ConfigurationManagementService
- VehicleService methods

### Team 2: API Routes (Agents 6-10)
- Vehicles route type conversions
- Dashboard RBAC permissions
- Drill-through query parameters
- Integrations health cache calls
- App initialization signatures

### Team 3: Services & Utilities (Agents 11-15)
- CacheService methods
- Drill-through validators
- Query builder
- Excel generator
- PDF generator

### Team 4: Repositories (Agents 16-20)
- FuelCardIntegration conversion
- LeaseTracking conversion
- Vehicle repository verification
- VehiclesRepository base
- AI safety detection stubs

### Team 5: Frontend (Agents 21-25)
- QueryErrorBoundary fix
- ComplianceHub DataPoint
- ComplianceReportingHub type guards
- Frontend TSConfig
- Frontend types

### Team 6: Build & Config (Agents 26-30)
- Dockerfile
- .dockerignore
- API package.json
- Root .npmrc
- GitHub workflow config

## Expected Results

All 30 agents will:
1. Read current file content
2. Apply specific fixes
3. Write fixed content back
4. Save results to `agent-results/`
5. Auto-commit and push to GitHub

## Verification

After completion, check:
```bash
# View results
ls -la agent-results/

# Check git status
git log -1
git status

# Verify workflows pass
gh run list --limit 3
```

## Troubleshooting

### API Rate Limits
If you hit rate limits, agents will retry automatically or fail gracefully.

### Git Authentication
Ensure GitHub credentials configured:
```bash
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
gh auth login
```

### Permission Issues
```bash
chmod +x orchestrate-30-agents.sh orchestrator-30-agents.py
```

## Architecture

```
orchestrator-30-agents.py
├─> 30 parallel async calls to Anthropic API
├─> Each agent reads file, generates fix
├─> Applies all fixes to repository
└─> Commits and pushes to GitHub
```

All processing happens on Azure VM using Claude Opus via external API.
