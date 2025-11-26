# Multi-Agent Fleet Orchestrator - Deployment Guide

## Overview

A complete, production-ready multi-agent orchestration system that autonomously diagnoses, fixes, and deploys the Fleet React application to Azure Static Web Apps.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   ORCHESTRATOR (Main Loop)                  │
│  - Coordinates all agents                                   │
│  - Runs quality gates                                       │
│  - Manages iteration lifecycle                              │
│  - Enforces safety controls                                 │
└─────────────────────────────────────────────────────────────┘
         │                  │                  │                  │
         ▼                  ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│    CODEX     │  │    JULES     │  │   DEVOPS     │  │  VERIFIER    │
│  (OpenAI)    │  │  (Gemini)    │  │   (Build)    │  │ (Playwright) │
│              │  │              │  │              │  │              │
│ - Diagnose   │  │ - Review     │  │ - Build      │  │ - Health     │
│ - Generate   │  │ - Approve    │  │ - Deploy     │  │ - Smoke test │
│   fixes      │  │ - Reject     │  │ - Create     │  │ - Console    │
│ - Assess     │  │   risky      │  │   artifacts  │  │   errors     │
│   risk       │  │   changes    │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

## Components Created

### Core Files

1. **agent_orch/orchestrator.py**
   - Main orchestration loop
   - Quality gate management
   - Agent coordination
   - Git operations
   - Metrics collection

2. **agent_orch/agents/codex_agent.py**
   - OpenAI GPT-4 integration
   - Error analysis
   - Fix generation
   - Risk assessment

3. **agent_orch/agents/jules_agent.py**
   - Google Gemini integration
   - Code review
   - Safety validation
   - Approval/rejection logic

4. **agent_orch/agents/devops_agent.py**
   - Build operations (npm)
   - Azure deployment
   - Artifact creation
   - Test execution

5. **agent_orch/agents/verifier_agent.py**
   - Playwright browser automation
   - Console error detection
   - Smoke testing
   - Health checks

### Configuration

6. **agent_orch/config.yaml**
   - Environment definitions (staging/prod)
   - Quality gates configuration
   - Agent parameters (models, temperature)
   - Safety controls
   - Stop conditions

7. **agent_orch/requirements.txt**
   - Python dependencies
   - AI SDKs (OpenAI, Google)
   - Playwright
   - Azure CLI

### Infrastructure

8. **infra/static-web-app.bicep**
   - Azure Static Web App definition
   - Build configuration
   - GitHub integration
   - Custom domain support

9. **.github/workflows/deploy-orchestrator.yml**
   - GitHub Actions workflow
   - Automated orchestration on push
   - PR comments with results
   - Artifact uploads

### Scripts

10. **scripts/smoke_test.sh**
    - Standalone smoke test script
    - Health checks
    - Content validation
    - Browser tests

11. **run_orchestrator.sh**
    - Convenience wrapper
    - Virtual environment activation
    - Environment variable loading

12. **test_orchestrator_setup.py**
    - Setup verification
    - Dependency checks
    - Agent initialization tests

### Documentation

13. **agent_orch/README.md**
    - Complete usage guide
    - Architecture diagrams
    - Configuration reference
    - Troubleshooting

14. **agent_orch/playwright.smoke.config.ts**
    - Playwright configuration
    - Browser settings
    - Timeout configuration

## Quick Start

### 1. Prerequisites

```bash
# Check Python version (requires 3.11+)
python3 --version

# Check Node.js version (requires 20+)
node --version

# Check git
git --version
```

### 2. Install Dependencies

```bash
# Navigate to project
cd /Users/andrewmorton/Documents/GitHub/fleet-local

# Create Python virtual environment
python3 -m venv agent_orch/venv

# Activate virtual environment
source agent_orch/venv/bin/activate

# Install Python packages
pip install -r agent_orch/requirements.txt

# Install Playwright browsers
playwright install chromium

# Install Node packages
npm install
```

### 3. Configure Environment

Ensure `~/.env` contains:

```bash
# AI Agents
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...

# Azure Deployment
AZURE_STATIC_WEB_APPS_API_TOKEN=...
```

### 4. Test Setup

```bash
# Run setup verification
python test_orchestrator_setup.py
```

Expected output:
```
============================================================
Testing Multi-Agent Orchestrator Setup
============================================================

Test 1: Environment Variables
  ✓ OPENAI_API_KEY: ******************** (set)
  ✓ GEMINI_API_KEY: ******************** (set)

Test 2: Import Agents
  ✓ CodexAgent imported
  ✓ JulesAgent imported
  ✓ DevOpsAgent imported
  ✓ VerifierAgent imported

Test 3: Initialize Agents
  ✓ CodexAgent initialized
  ✓ JulesAgent initialized
  ✓ DevOpsAgent initialized
  ✓ VerifierAgent initialized

Test 4: Configuration
  ✓ config.yaml found

============================================================
ALL TESTS PASSED ✓
============================================================
```

### 5. Run Orchestrator

```bash
# Option 1: Using wrapper script
./run_orchestrator.sh staging

# Option 2: Direct execution
source agent_orch/venv/bin/activate
export OPENAI_API_KEY="$(grep OPENAI_API_KEY ~/.env | cut -d'=' -f2)"
export GEMINI_API_KEY="$(grep GEMINI_API_KEY ~/.env | cut -d'=' -f2)"
export AZURE_STATIC_WEB_APPS_API_TOKEN="$(grep AZURE_STATIC_WEB_APPS_API_TOKEN ~/.env | cut -d'=' -f2)"
python agent_orch/orchestrator.py --environment staging
```

## Orchestration Flow

### Iteration Loop

Each iteration follows this sequence:

1. **Quality Gates** - Run all configured quality checks
   - ✓ Build succeeds
   - ✓ HTTP 200 response
   - ✓ No console errors

2. **Context Gathering** - Collect repository information
   - Read vite.config.ts
   - Read package.json
   - Capture build output

3. **Codex Analysis** - Diagnose issues
   - Analyze errors
   - Generate fixes
   - Assess risk

4. **Codex Validation** - Check fix safety
   - Verify no protected files
   - Validate risk level
   - Check confidence threshold

5. **Jules Review** - Code review
   - Review all patches
   - Approve or reject
   - Provide recommendations

6. **Apply Fixes** - Implement changes
   - Apply git patches
   - Create commit
   - Push to remote

7. **Build** - Rebuild application
   - npm run build
   - Check metrics
   - Validate output

8. **Deploy** - Push to Azure
   - Upload to Azure Static Web Apps
   - Return deployment URL
   - Verify deployment

9. **Verify** - Test deployment
   - Run smoke tests
   - Check console errors
   - Validate functionality

### Stop Conditions

The orchestrator stops when:

1. ✅ **All quality gates pass** - SUCCESS
2. ⚠️ **Max iterations reached** (5) - Need manual intervention
3. ⚠️ **No progress detected** - Same diagnosis twice
4. ❌ **Safety violation** - Attempting risky operations

## Quality Gates

### Configured Gates

```yaml
quality_gates:
  - name: build
    command: npm run build
    success_pattern: "✓ built in"

  - name: no_errors
    command: npm run build
    fail_pattern: "error|ERROR|Error"

  - name: health_check
    url: "${health_endpoint}"
    expect_status: 200

  - name: no_console_errors
    playwright_check: true
    fail_patterns:
      - "useLayoutEffect"
      - "Uncaught"
      - "TypeError"
```

## Safety Features

### Multi-Layer Protection

1. **Protected Files** - Never modifies:
   - `*.env`, `*.env.*`
   - `**/secrets/**`
   - `**/.azure/**`

2. **Protected Operations** - Blocks:
   - File deletions
   - Azure resource deletions
   - Force pushes to main
   - Secret modifications

3. **Risk Assessment** - Rejects:
   - HIGH risk changes
   - Low confidence fixes (<60%)
   - Modifications to protected files

4. **Two-Agent Review**:
   - Codex proposes fixes
   - Jules must approve
   - Both must agree

5. **Git History**:
   - All changes committed
   - Fully reversible
   - Audit trail maintained

## Outputs and Logs

### Log Files

Located in `agent_orch/logs/`:

- `orchestrator.log` - Main orchestration log
- `orchestration_metrics.json` - Detailed iteration metrics

### Metrics Structure

```json
{
  "iteration": 1,
  "timestamp": "2025-11-26T10:30:00",
  "steps": {
    "quality_gates": {
      "build": true,
      "health_check": false,
      "no_console_errors": false
    },
    "codex_diagnosis": {
      "root_cause": "React module loading order issue",
      "risk_level": "MEDIUM",
      "confidence": 0.85
    },
    "jules_review": {
      "approved": true,
      "confidence": 0.9
    },
    "build": {
      "success": true
    },
    "deployment": {
      "success": true,
      "url": "https://purple-river-0f465960f.3.azurestaticapps.net"
    },
    "smoke_test": {
      "overall_passed": true
    }
  }
}
```

## GitHub Actions Integration

### Automatic Triggers

The workflow runs on:
- Push to `main` branch
- Pull requests to `main`
- Manual workflow dispatch

### PR Comments

On pull requests, the orchestrator posts a summary:

```markdown
## 🤖 Multi-Agent Orchestrator Report

**Environment:** staging
**Iterations:** 2
**Status:** ✅ Success

### Quality Gates
- ✅ build
- ✅ health_check
- ✅ no_console_errors
```

## Azure Deployment

### Static Web App Configuration

The Bicep template creates:

- **Resource**: Azure Static Web App
- **SKU**: Free tier (upgradeable to Standard)
- **Location**: East US 2
- **Build**:
  - App Location: `/`
  - Output Location: `dist`
  - Build Command: `npm run build`

### Deployment Token

Get the deployment token:

```bash
# Via Azure Portal
# Go to Static Web App → Settings → Deployment tokens → Copy

# Via Azure CLI
az staticwebapp secrets list \
  --name fleet-management \
  --query "properties.apiKey" \
  -o tsv
```

Add to `~/.env`:
```bash
AZURE_STATIC_WEB_APPS_API_TOKEN=your-token-here
```

## Troubleshooting

### Common Issues

#### 1. "Missing required secrets"

```bash
# Check environment variables
echo $OPENAI_API_KEY
echo $GEMINI_API_KEY

# Load from ~/.env
export OPENAI_API_KEY="$(grep OPENAI_API_KEY ~/.env | cut -d'=' -f2)"
export GEMINI_API_KEY="$(grep GEMINI_API_KEY ~/.env | cut -d'=' -f2)"
```

#### 2. "Playwright not installed"

```bash
source agent_orch/venv/bin/activate
playwright install chromium
```

#### 3. "Build failed"

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
npm run build
```

#### 4. "Deployment token not available"

The orchestrator will skip deployment and only run build/test phases.
To enable deployment, set `AZURE_STATIC_WEB_APPS_API_TOKEN` in `~/.env`.

#### 5. "No progress detected"

If the orchestrator sees the same diagnosis twice, it stops to prevent infinite loops.
Review the logs and manually apply fixes if needed.

## Manual Deployment (Fallback)

If the orchestrator fails, deploy manually:

```bash
# Build locally
npm run build

# Deploy using Azure CLI
az staticwebapp deploy \
  --name fleet-management \
  --resource-group your-resource-group \
  --app-location . \
  --output-location dist \
  --deployment-token $AZURE_STATIC_WEB_APPS_API_TOKEN
```

## Production Deployment

For production:

1. Update `config.yaml` with prod settings
2. Set `AZURE_STATIC_WEB_APPS_API_TOKEN_PROD`
3. Configure GitHub environment protection
4. Run with `--environment prod`

```bash
python agent_orch/orchestrator.py --environment prod
```

## Monitoring

### Check Orchestrator Status

```bash
# View logs
tail -f agent_orch/logs/orchestrator.log

# View metrics
cat agent_orch/logs/orchestration_metrics.json | jq
```

### Check Deployment Status

```bash
# Health check
curl https://purple-river-0f465960f.3.azurestaticapps.net

# Run smoke tests
./scripts/smoke_test.sh https://purple-river-0f465960f.3.azurestaticapps.net
```

## Cost Optimization

### Azure Static Web Apps

- **Free tier**: $0/month
  - 100 GB bandwidth
  - 0.5 GB storage
  - Custom domains
  - SSL certificates

- **Standard tier**: ~$9/month
  - Unlimited bandwidth
  - Enterprise-grade CDN
  - Staging environments
  - SLA

### AI API Usage

Approximate costs per iteration:

- **OpenAI GPT-4**: ~$0.06 per iteration
- **Google Gemini**: ~$0.01 per iteration
- **Total per iteration**: ~$0.07

For 5 iterations: ~$0.35 total

## Next Steps

1. ✅ Complete multi-agent system created
2. ✅ All agents implemented and tested
3. ✅ Configuration and infrastructure ready
4. ✅ GitHub Actions workflow configured
5. ✅ Documentation complete

### To Deploy Now:

```bash
./run_orchestrator.sh staging
```

### To Enable CI/CD:

1. Add secrets to GitHub repository:
   - `OPENAI_API_KEY`
   - `GEMINI_API_KEY`
   - `AZURE_STATIC_WEB_APPS_API_TOKEN`

2. Push to main branch:
   ```bash
   git add .
   git commit -m "feat: Add multi-agent deployment orchestrator"
   git push origin main
   ```

3. GitHub Actions will automatically run the orchestrator

## Support

For issues or questions:
- **GitHub Issues**: https://github.com/asmortongpt/fleet/issues
- **Email**: andrew.m@capitaltechalliance.com
- **Documentation**: See `agent_orch/README.md`

---

**Generated by**: Claude Code (Multi-Agent Orchestrator)
**Date**: 2025-11-26
**Version**: 1.0.0
