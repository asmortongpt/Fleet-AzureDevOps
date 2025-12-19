# Fleet Management Multi-Agent Orchestration System

**Autonomous AI-powered deployment automation with self-healing capabilities**

## Overview

This orchestration system uses three AI agents to automatically detect, analyze, and fix build/deployment issues in the Fleet Management application:

- **CodexAgent** (GPT-4): Analyzes errors and generates code fixes as unified git patches
- **JulesAgent** (GPT-4): Reviews patches for security and best practices
- **DevOpsAgent**: Executes Azure/Kubernetes operations safely

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Orchestrator.py                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  CodexAgent  │  │  JulesAgent  │  │ DevOpsAgent  │      │
│  │   (GPT-4)    │  │   (GPT-4)    │  │  (Azure/K8s) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                 │                  │              │
│         ▼                 ▼                  ▼              │
│  ┌──────────────────────────────────────────────────┐      │
│  │             Tool Modules                         │      │
│  │  • ShellExecutor  • GitOperations  • Verifier    │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
         ┌────────────────────────────────┐
         │   Azure DevOps Pipeline        │
         │   • Build & Test               │
         │   • AI Auto-Fix (on failure)   │
         │   • Docker Build & Push        │
         │   • Deploy to AKS              │
         │   • Verification & Smoke Tests │
         └────────────────────────────────┘
```

## Features

### ✨ Core Capabilities

- **Autonomous Error Detection**: Automatically detects build/deployment failures
- **AI-Powered Analysis**: GPT-4 analyzes errors and generates targeted fixes
- **Security-First Reviews**: All patches reviewed for security vulnerabilities
- **Safe Operations**: Forbidden command blocking, backup branches, dry-run mode
- **Quality Gates**: Automated testing at each stage (lint, test, build)
- **Health Monitoring**: Post-deployment verification and smoke tests
- **Iterative Fixing**: Up to 10 iterations with progress detection

### 🔒 Safety Features

- Never deletes Azure resources
- Never rotates secrets
- Blocks dangerous commands (rm -rf /, kubectl delete namespace, etc.)
- Creates backup branches before changes
- Validates patches for security issues
- Parameterized queries enforcement
- No hardcoded secrets

### 🎯 Target Issues

The orchestrator is designed to fix:

- **Build failures** (dependency issues, configuration errors)
- **OOM/SIGKILL errors** (switches from ACR 4GB to DevOps 7GB agents)
- **Lint/test failures** (code quality issues)
- **Deployment issues** (Kubernetes misconfigurations)

## Quick Start

### Prerequisites

1. **Python 3.11+**
2. **Node.js 20+**
3. **Azure CLI** (logged in)
4. **OpenAI API Key** (GPT-4 access)

### Installation

```bash
cd agent_orch

# Install Python dependencies
pip install -r requirements.txt

# Verify installation
python orchestrator.py --help
```

### Configuration

1. **Set environment variables**:

```bash
export OPENAI_API_KEY="sk-..."
export AZURE_SUBSCRIPTION_ID="..."  # Optional, uses az cli default
```

2. **Edit `config.yaml`** to customize:
   - Quality gate commands
   - Deployment endpoints
   - Safety limits
   - Agent parameters

### Local Testing (Dry Run)

Test the orchestrator without making actual changes:

```bash
# Dry run mode - no actual execution
python orchestrator.py --config config.yaml --environment staging --dry-run

# Check logs
tail -f logs/orchestrator.log
```

### Production Run

Run the orchestrator for real:

```bash
# For staging environment
python orchestrator.py --config config.yaml --environment staging

# For production (requires manual approval in pipeline)
python orchestrator.py --config config.yaml --environment prod
```

## Azure DevOps Integration

The orchestration is integrated into the Azure DevOps pipeline (`azure-pipelines.yml`).

### Pipeline Stages

1. **Build & Test** - Run quality gates
2. **AI Orchestration** - Auto-fix on failure (staging only)
3. **Docker Build & Push** - Build and push to ACR
4. **Deploy Staging** - Deploy to AKS staging
5. **Deploy Production** - Deploy to AKS prod (manual approval)

### Required Pipeline Variables

In Azure DevOps → Pipelines → Library → Variable Groups, create:

```yaml
Variable Group: "fleet-orchestrator-secrets"
Variables:
  - OPENAI_API_KEY: "sk-..." (secret)
  - AZURE_SUBSCRIPTION_ID: "..." (optional)
```

### Trigger Orchestration

The AI Orchestration stage triggers automatically when:

- Branch is `stage-a/requirements-inception`
- Build & Test stage **fails**

```yaml
condition: and(failed(), eq(variables['Build.SourceBranch'], 'refs/heads/stage-a/requirements-inception'))
```

## Configuration Reference

### config.yaml Structure

```yaml
agents:
  orchestrator:
    max_iterations: 10
    max_no_progress_iterations: 3
    dry_run: false

  codex:
    model: "gpt-4"
    temperature: 0.2
    max_tokens: 4000

  jules:
    model: "gpt-4"
    temperature: 0.1
    max_tokens: 2000

quality_gates:
  install:
    command: "npm install --legacy-peer-deps"
    timeout: 600
    required: true

  build:
    command: "npm run build"
    timeout: 900
    required: true

deployment:
  environments:
    staging:
      health_endpoint: "https://fleet-staging.capitaltechalliance.com/health"

safety:
  forbidden_commands:
    - "rm -rf /"
    - "kubectl delete namespace"
    - "az group delete"
```

## File Structure

```
agent_orch/
├── config.yaml              # Main configuration
├── requirements.txt         # Python dependencies
├── orchestrator.py          # Main orchestrator
├── agents/
│   ├── __init__.py
│   ├── codex_agent.py      # Error analysis & patch generation
│   ├── jules_agent.py      # Security review & approval
│   └── devops_agent.py     # Azure/K8s operations
├── tools/
│   ├── __init__.py
│   ├── shell.py            # Safe shell execution
│   ├── git.py              # Git operations
│   └── verifier.py         # Deployment verification
└── logs/
    ├── orchestrator.log    # Main log file
    └── verification_*.json # Verification reports
```

## Operational Guide

### How It Works

1. **Trigger**: Azure DevOps pipeline detects build failure
2. **Analysis**: CodexAgent analyzes error logs and relevant files
3. **Patch Generation**: CodexAgent creates unified git patch
4. **Review**: JulesAgent reviews patch for security and quality
5. **Application**: Git patch applied if approved
6. **Commit**: Changes committed with descriptive message
7. **Re-test**: Quality gates re-run
8. **Iterate**: Repeat up to 10 times or until success

### Success Criteria

Orchestration succeeds when:

- ✅ All required quality gates pass
- ✅ Health endpoints return 200 OK
- ✅ Critical flows verified
- ✅ Smoke tests pass

### Failure Scenarios

Orchestration stops if:

- ❌ Max iterations reached (10)
- ❌ No progress detected (3 iterations)
- ❌ Patch rejected by JulesAgent
- ❌ Forbidden operation attempted

### Monitoring

**Check orchestration status**:

```bash
# View logs
tail -f agent_orch/logs/orchestrator.log

# Check latest verification report
ls -lt agent_orch/logs/verification_*.json | head -1
cat $(ls -t agent_orch/logs/verification_*.json | head -1)
```

**Azure DevOps Pipeline**:

1. Go to Pipelines → Builds
2. Select latest build
3. View "AI Orchestration" stage logs

### Manual Intervention

If orchestration fails, you can:

1. **Review logs**: `agent_orch/logs/orchestrator.log`
2. **Check backup branch**: `backup/pre-orchestration-YYYYMMDD_HHMMSS`
3. **Manual fix**: Apply fix manually and push
4. **Re-trigger**: Push to trigger new pipeline run

## Troubleshooting

### "OPENAI_API_KEY not set"

```bash
export OPENAI_API_KEY="sk-..."
# Or add to ~/.bashrc or ~/.zshrc
```

### "Failed to fetch from remote"

```bash
# Ensure git remote is configured
git remote -v

# Pull latest changes
git pull origin main
```

### "Patch validation failed"

The generated patch may be invalid. Check logs:

```bash
grep "Patch validation" agent_orch/logs/orchestrator.log
```

Common causes:
- Files changed externally during orchestration
- Patch format issue (AI generation error)

**Solution**: Re-run orchestrator or apply fix manually.

### "No progress detected"

The orchestrator made multiple attempts but didn't fix the issue.

**Check**:
1. Review error analysis in logs
2. Verify the issue is fixable by code changes
3. May require infrastructure/config changes outside code

### Pipeline Permission Errors

If Azure DevOps can't push fixes:

1. Enable "Allow scripts to access the OAuth token"
2. Grant "Contribute" permission to build service account

## Advanced Usage

### Custom Quality Gates

Add custom gates in `config.yaml`:

```yaml
quality_gates:
  security_scan:
    command: "npm audit --audit-level=high"
    timeout: 120
    required: true
```

### Custom Verification Endpoints

```yaml
deployment:
  environments:
    staging:
      verification_endpoints:
        - url: "https://fleet-staging.capitaltechalliance.com/api/vehicles"
          expected_status: 200
          timeout: 10
```

### Extend Agents

Subclass base agents to add custom logic:

```python
from agents.codex_agent import CodexAgent

class CustomCodexAgent(CodexAgent):
    def generate_patch(self, error_log, current_files, context=None):
        # Add custom pre-processing
        context = context or {}
        context['custom_data'] = self._get_custom_data()
        
        return super().generate_patch(error_log, current_files, context)
```

## Security Considerations

### Secrets Management

- ✅ Use Azure Key Vault for secrets
- ✅ Environment variables for API keys
- ❌ Never commit secrets to git
- ❌ Never pass secrets in patch content

### Code Review

- All patches reviewed by JulesAgent
- Security checklist enforced
- Suspicious patterns blocked

### Audit Trail

- All operations logged
- Git history preserved
- Verification reports saved

## Performance

**Typical orchestration times**:

- Error analysis: ~10-30 seconds
- Patch generation: ~20-60 seconds
- Review: ~10-20 seconds
- Quality gates: ~3-15 minutes
- **Total**: ~5-20 minutes per iteration

## Cost Estimation

**OpenAI API costs** (GPT-4):

- Error analysis: ~1,000-3,000 tokens (~$0.03-$0.09)
- Patch generation: ~2,000-4,000 tokens (~$0.06-$0.12)
- Review: ~1,000-2,000 tokens (~$0.03-$0.06)

**Per orchestration run**: ~$0.15-$0.30

**Per month** (assuming 10 runs/day): ~$50-$100

## Roadmap

- [ ] Support for multiple LLM providers (Claude, Gemini)
- [ ] Parallel patch generation with voting
- [ ] Infrastructure-as-Code fixes (Terraform, Bicep)
- [ ] Advanced metrics and dashboards
- [ ] Slack/Teams notifications
- [ ] Cost optimization recommendations

## Support

For issues or questions:

1. Check logs: `agent_orch/logs/orchestrator.log`
2. Review documentation: This README
3. Contact: andrew.m@capitaltechalliance.com

## License

Proprietary - Capital Tech Alliance LLC

---

**🤖 Built with AI, Secured by AI, Deployed by AI**
