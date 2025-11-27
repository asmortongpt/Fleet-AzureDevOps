# Multi-Agent Fleet Deployment Orchestrator

A fully autonomous multi-agent system that diagnoses, fixes, and deploys the Fleet React application to Azure Static Web Apps.

## Architecture

The system consists of four specialized agents working in concert:

### 1. Codex Agent (OpenAI GPT-4)
- **Role**: Error diagnosis and code fix generation
- **Responsibilities**:
  - Analyzes build errors and React module loading issues
  - Generates surgical fixes for vite.config.ts, package.json, etc.
  - Creates unified git patches
  - Assesses fix confidence and risk levels

### 2. Jules Agent (Google Gemini)
- **Role**: Code review and safety gatekeeper
- **Responsibilities**:
  - Reviews all proposed code changes
  - Validates safety and correctness
  - Rejects risky changes (deleting files, modifying secrets)
  - Approves safe, well-tested patterns

### 3. DevOps Agent
- **Role**: Build and deployment operations
- **Responsibilities**:
  - Runs `npm install && npm run build`
  - Deploys to Azure Static Web Apps
  - Creates deployment artifacts
  - Returns logs and deployment URLs

### 4. Verifier Agent (Playwright)
- **Role**: Deployment verification and testing
- **Responsibilities**:
  - HTTP health checks
  - Browser-based console error detection
  - Smoke tests (app loads, no white screen, no React errors)
  - Quality gate validation

## Prerequisites

### Required Environment Variables

Create or update `~/.env` with:

```bash
# AI Agent APIs
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...

# Azure Deployment
AZURE_STATIC_WEB_APPS_API_TOKEN=...
```

### Required Software

```bash
# Python 3.11+
python3 --version

# Node.js 20+
node --version

# Git
git --version
```

## Installation

### 1. Install Python Dependencies

```bash
cd /Users/andrewmorton/Documents/GitHub/fleet-local
pip install -r agent_orch/requirements.txt
```

### 2. Install Playwright Browsers

```bash
playwright install chromium
```

### 3. Install Node Dependencies

```bash
npm install
```

## Usage

### Local Execution

Run the orchestrator locally:

```bash
# Staging environment
python agent_orch/orchestrator.py --environment staging

# Production environment (requires approval)
python agent_orch/orchestrator.py --environment prod
```

### GitHub Actions (CI/CD)

The orchestrator runs automatically on:
- Push to `main` branch
- Pull requests to `main`
- Manual workflow dispatch

```bash
# Trigger manually via GitHub UI
# Go to Actions → Multi-Agent Deploy Orchestrator → Run workflow
```

### Command-Line Options

```bash
python agent_orch/orchestrator.py --help

Options:
  --environment {staging,prod}  Deployment environment (default: staging)
  --config CONFIG               Path to config file (default: agent_orch/config.yaml)
```

## How It Works

### Orchestration Loop

```
┌─────────────────────────────────────────────────────────────┐
│                    ITERATION START                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 1. RUN QUALITY GATES                                        │
│    - npm run build (check for errors)                       │
│    - HTTP health check                                      │
│    - Console error check (Playwright)                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    ┌──────────────┐
                    │ All Passed?  │
                    └──────────────┘
                       ↓       ↓
                     YES      NO
                       ↓       ↓
                   SUCCESS   ┌─────────────────────────────────┐
                             │ 2. GATHER CONTEXT               │
                             │    - Read vite.config.ts        │
                             │    - Read package.json          │
                             │    - Capture build output       │
                             └─────────────────────────────────┘
                                         ↓
                             ┌─────────────────────────────────┐
                             │ 3. CODEX AGENT - ANALYZE        │
                             │    - Diagnose root cause        │
                             │    - Generate fix patches       │
                             │    - Assess risk level          │
                             └─────────────────────────────────┘
                                         ↓
                             ┌─────────────────────────────────┐
                             │ 4. CODEX AGENT - VALIDATE       │
                             │    - Check fix safety           │
                             │    - Verify no protected files  │
                             └─────────────────────────────────┘
                                         ↓
                             ┌─────────────────────────────────┐
                             │ 5. JULES AGENT - REVIEW         │
                             │    - Review all patches         │
                             │    - Approve or reject          │
                             └─────────────────────────────────┘
                                         ↓
                                ┌───────────────┐
                                │  Approved?    │
                                └───────────────┘
                                   ↓       ↓
                                 YES      NO
                                   ↓       ↓
                   ┌───────────────┘    REJECT
                   ↓                      ↓
       ┌─────────────────────────────────┐
       │ 6. DEVOPS AGENT - APPLY FIXES   │
       │    - Apply git patches          │
       │    - Create commit              │
       └─────────────────────────────────┘
                   ↓
       ┌─────────────────────────────────┐
       │ 7. DEVOPS AGENT - BUILD         │
       │    - npm run build              │
       │    - Check build metrics        │
       └─────────────────────────────────┘
                   ↓
       ┌─────────────────────────────────┐
       │ 8. DEVOPS AGENT - DEPLOY        │
       │    - Deploy to Azure SWA        │
       │    - Return deployment URL      │
       └─────────────────────────────────┘
                   ↓
       ┌─────────────────────────────────┐
       │ 9. VERIFIER AGENT - TEST        │
       │    - Run smoke tests            │
       │    - Check console errors       │
       │    - Verify app loads           │
       └─────────────────────────────────┘
                   ↓
              NEXT ITERATION
```

### Stop Conditions

The orchestrator stops when:
1. **All quality gates pass** - SUCCESS ✅
2. **Max iterations reached** (5) - Give up gracefully
3. **No progress detected** - Same diagnosis twice in a row
4. **Safety violation** - Attempting to modify protected files

## Configuration

Edit `agent_orch/config.yaml` to customize:

### Environments

```yaml
environments:
  staging:
    azure_static_web_app_name: fleet-management-staging
    deployment_token_secret: AZURE_STATIC_WEB_APPS_API_TOKEN
    health_endpoint: https://purple-river-0f465960f.3.azurestaticapps.net
```

### Quality Gates

```yaml
quality_gates:
  - name: build
    command: npm run build
    success_pattern: "✓ built in"
  - name: health_check
    url: "${health_endpoint}"
    expect_status: 200
  - name: no_console_errors
    playwright_check: true
    fail_patterns:
      - "useLayoutEffect"
      - "Uncaught"
```

### Agent Configuration

```yaml
agent_config:
  codex:
    model: gpt-4-turbo-preview
    temperature: 0.2
  jules:
    model: gemini-1.5-pro
    temperature: 0.1
```

### Safety Controls

```yaml
safety:
  protected_files:
    - "*.env"
    - "*.env.*"
    - "**/secrets/**"
  protected_operations:
    - delete_azure_resources
    - modify_secrets
  require_approval_for:
    - prod_deployment
```

## Outputs

### Logs

All logs are saved to `agent_orch/logs/`:
- `orchestrator.log` - Main orchestration log
- `orchestration_metrics.json` - Detailed metrics for each iteration

### Metrics Example

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
      "confidence": 0.9,
      "risk_assessment": "LOW"
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

## Testing the Agents

Each agent can be tested independently:

### Test Codex Agent

```bash
export OPENAI_API_KEY=sk-...
python agent_orch/agents/codex_agent.py
```

### Test Jules Agent

```bash
export GEMINI_API_KEY=...
python agent_orch/agents/jules_agent.py
```

### Test DevOps Agent

```bash
python agent_orch/agents/devops_agent.py
```

### Test Verifier Agent

```bash
python agent_orch/agents/verifier_agent.py
```

## Troubleshooting

### "Missing required secrets"

Ensure all required environment variables are set in `~/.env`:
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `AZURE_STATIC_WEB_APPS_API_TOKEN`

### "Playwright not installed"

```bash
playwright install chromium
```

### "Build failed"

Check that Node.js dependencies are installed:
```bash
npm install
```

### "Deployment token not available"

Set the deployment token in `~/.env`:
```bash
AZURE_STATIC_WEB_APPS_API_TOKEN=your-token-here
```

## Safety Features

The orchestrator includes multiple safety layers:

1. **Protected Files** - Never modifies `.env`, secrets, or credentials
2. **Risky Operations** - Blocks file deletions, Azure resource deletions
3. **Two-Agent Review** - Codex proposes, Jules approves
4. **Confidence Threshold** - Rejects fixes with <60% confidence
5. **Risk Assessment** - Blocks HIGH risk changes
6. **Git History** - All changes are committed (reversible)
7. **Max Iterations** - Prevents infinite loops (max 5)

## Production Deployment

For production deployments:

1. Set `environment: prod` in the workflow
2. Ensure `AZURE_STATIC_WEB_APPS_API_TOKEN_PROD` is set
3. Manual approval is required (configured in GitHub)
4. All quality gates must pass
5. Smoke tests must pass in production

## License

MIT License - Capital Tech Alliance

## Support

For issues or questions:
- Create a GitHub issue
- Contact: andrew.m@capitaltechalliance.com
