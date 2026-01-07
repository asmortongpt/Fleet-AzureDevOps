# 32-Agent Module Enhancement Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the 32-agent autonomous module enhancement system to Azure VM. The system uses Grok AI to analyze, design, implement, test, and document improvements across all Fleet Management System modules.

## System Architecture

```
Azure VM (fleet-build-test-vm)
    ├── Azure Key Vault (secrets management)
    ├── 32 Autonomous Agents (Python + Grok AI)
    ├── Module Branches (Git)
    └── Status Monitoring (Real-time dashboard)
```

### Key Features

- **32 Parallel Agents**: One agent per module for autonomous enhancement
- **Secure by Design**: All secrets from Azure Key Vault, no hardcoded credentials
- **Grok AI Powered**: Using X.AI's Grok Beta model for analysis and design
- **Dual Version Control**: Pushes to both GitHub and Azure DevOps
- **Real-time Monitoring**: Live status dashboard during deployment

## Prerequisites

### Azure Resources

1. **Azure VM**: `fleet-build-test-vm` in `FLEET-AI-AGENTS` resource group
2. **Azure Key Vault**: Storing API keys and secrets
3. **Azure DevOps**: Repository and PAT configured

### Required Secrets in Key Vault

The following secrets must be present in Azure Key Vault:

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `grok-api-key` | X.AI Grok API key | `xai-...` |
| `github-pat` | GitHub Personal Access Token | `ghp_...` |
| `azure-devops-pat` | Azure DevOps PAT | `...` |
| `azure-client-id` | Azure App Client ID | `...` |
| `azure-tenant-id` | Azure Tenant ID | `...` |
| `azure-client-secret` | Azure App Secret | `...` |

### Local Prerequisites

- **Python 3.8+** with `requests` library
- **Git** configured with user credentials
- **Azure CLI** (`az`) installed and authenticated
- **SSH access** to Azure VM (if deploying remotely)

## Installation

### 1. Clone Repository

```bash
# On Azure VM
git clone https://github.com/asmortongpt/fleet.git
cd fleet
```

### 2. Verify Scripts

```bash
# Make scripts executable
chmod +x scripts/*.sh
chmod +x scripts/*.py

# Verify scripts exist
ls -la scripts/
# Expected:
#   - deploy-module-enhancement.sh
#   - fetch-secrets.sh
#   - create-module-branches.sh
#   - agent-template.py
#   - monitor-deployment.py
```

### 3. Configure Azure Key Vault

```bash
# Set your Key Vault name (if different)
export AZURE_KEY_VAULT_NAME="fleet-secrets-vault"

# Login to Azure
az login

# Verify access to Key Vault
az keyvault secret list --vault-name $AZURE_KEY_VAULT_NAME
```

### 4. Install Python Dependencies

```bash
python3 -m pip install --upgrade pip
python3 -m pip install requests
```

## Deployment

### Option 1: Full Automated Deployment

This is the recommended approach for deploying all 32 agents at once.

```bash
# Navigate to repository
cd /path/to/fleet

# Run deployment orchestrator
./scripts/deploy-module-enhancement.sh
```

**What happens:**
1. ✓ Checks prerequisites (Python, Git, Azure CLI)
2. ✓ Fetches secrets from Azure Key Vault
3. ✓ Creates 32 module branches
4. ✓ Deploys 32 Python agents in parallel
5. ✓ Monitors progress and aggregates results
6. ✓ Generates deployment summary
7. ✓ Securely deletes secrets file

**Duration**: ~45-90 minutes (depending on Grok API rate limits)

### Option 2: Step-by-Step Deployment

For more control, run each phase separately:

#### Step 1: Fetch Secrets

```bash
# Fetch secrets from Azure Key Vault
SECRETS_FILE=$(./scripts/fetch-secrets.sh)

# Source secrets into environment
source "$SECRETS_FILE"

# Verify secrets loaded
echo "GROK_API_KEY: ${GROK_API_KEY:0:10}..."
```

#### Step 2: Create Module Branches

```bash
# Create all 32 module branches
./scripts/create-module-branches.sh
```

**Result**: 32 branches created with names like:
- `module/fleet-hub`
- `module/drivers-hub`
- `module/maintenance-hub`
- ... (29 more)

#### Step 3: Deploy Single Agent (Test)

```bash
# Test with one module first
git checkout module/fleet-hub
./scripts/agent-template.py fleet-hub module/fleet-hub
```

#### Step 4: Deploy All Agents

```bash
# Launch all 32 agents in parallel
for module in fleet-hub drivers-hub maintenance-hub # ... all 32
do
    git checkout "module/${module}"
    ./scripts/agent-template.py "$module" "module/${module}" > "agent-${module}.log" 2>&1 &
done

# Wait for completion
wait
```

### Option 3: Remote Deployment (from local machine)

```bash
# SSH to Azure VM and deploy
ssh azureuser@fleet-build-test-vm.eastus.cloudapp.azure.com << 'EOF'
cd fleet
./scripts/deploy-module-enhancement.sh
EOF
```

## Monitoring

### Real-time Dashboard

While deployment is running, monitor progress with:

```bash
# In a separate terminal
./scripts/monitor-deployment.py
```

**Dashboard shows:**
- Overall progress (completed/running/failed)
- Phase breakdown (analysis/design/implementation/testing/documentation)
- Per-module status and progress bars
- Auto-refreshes every 5 seconds

### Generate Final Report

```bash
# After deployment completes
./scripts/monitor-deployment.py --report
```

Generates JSON report with full statistics and status details.

## What Each Agent Does

### Phase 1: As-Is Analysis (10-15 min)
- Analyzes current module implementation
- Reviews frontend (`src/pages/`) and backend (`api/src/routes/`)
- Documents current features, architecture, security
- Generates `AS_IS_ANALYSIS.md`

### Phase 2: To-Be Design (10-15 min)
- Designs enhancements based on As-Is analysis
- Proposes improved architecture and features
- Focuses on AI/ML, real-time, security, UX improvements
- Generates `TO_BE_DESIGN.md`

### Phase 3: Implementation Guidance (10-15 min)
- Provides implementation roadmap
- Generates code examples and migration scripts
- Prioritizes high-impact changes
- Generates `IMPLEMENTATION_LOG.md`

### Phase 4: Testing Strategy (5-10 min)
- Creates comprehensive test plan
- Defines unit, integration, security, performance tests
- Generates `TEST_PLAN.md`

### Phase 5: Documentation (5 min)
- Generates enhancement summary
- Aggregates all deliverables
- Generates `ENHANCEMENT_SUMMARY.md`

### Phase 6: Commit & Push (2-5 min)
- Commits all documentation to module branch
- Pushes to GitHub
- Pushes to Azure DevOps

## Output Structure

After deployment, each module branch contains:

```
modules/
├── fleet-hub/
│   ├── README.md                      # Module overview
│   ├── ENHANCEMENT_SUMMARY.md         # Agent summary
│   ├── docs/
│   │   ├── AS_IS_ANALYSIS.md          # Current state
│   │   ├── TO_BE_DESIGN.md            # Enhancement design
│   │   ├── IMPLEMENTATION_LOG.md      # Implementation guide
│   │   └── TEST_PLAN.md               # Testing strategy
│   └── status/
│       └── agent-status.json          # Real-time status
├── drivers-hub/
│   └── ... (same structure)
└── ... (30 more modules)
```

## Security Best Practices

### ✅ What We Do

- **Azure Key Vault**: All secrets stored securely
- **Runtime Fetching**: Secrets fetched only when needed
- **Secure Deletion**: Secrets file shredded after use
- **No Hardcoding**: Zero credentials in code or Git
- **Environment Variables**: Secrets only in memory

### ❌ What We Don't Do

- Never commit secrets to Git
- Never hardcode API keys
- Never log sensitive data
- Never store secrets in plain text files

### Secrets Lifecycle

```
Azure Key Vault → fetch-secrets.sh → /tmp/secrets.env → source → Memory → shred
                                                                          ↓
                                                                    (deleted)
```

## Troubleshooting

### Problem: Azure CLI not authenticated

```bash
az login
az account show
```

### Problem: Key Vault access denied

```bash
# Check access policies
az keyvault show --name fleet-secrets-vault

# Grant access (if needed)
az keyvault set-policy --name fleet-secrets-vault \
  --upn your-email@domain.com \
  --secret-permissions get list
```

### Problem: Git authentication fails

```bash
# Configure Git credentials
git config --global user.name "Your Name"
git config --global user.email "your-email@domain.com"

# Test GitHub access
git ls-remote https://github.com/asmortongpt/fleet.git
```

### Problem: Grok API rate limit

```bash
# Agents include rate limiting (2-second delays)
# If rate limited, agents will retry automatically
# Monitor with: ./scripts/monitor-deployment.py
```

### Problem: Branch already exists

```bash
# Delete local branch
git branch -D module/fleet-hub

# Delete remote branch
git push origin --delete module/fleet-hub

# Re-run branch creation
./scripts/create-module-branches.sh
```

### Problem: Agent fails mid-execution

```bash
# Check agent log
cat deployment-status/agent-logs/fleet-hub.log

# Check status file
cat modules/fleet-hub/status/agent-status.json

# Restart specific agent
git checkout module/fleet-hub
./scripts/agent-template.py fleet-hub module/fleet-hub
```

## Post-Deployment

### Review Agent Output

```bash
# List all module branches
git branch --list 'module/*'

# Review specific module
git checkout module/fleet-hub
cat modules/fleet-hub/ENHANCEMENT_SUMMARY.md
cat modules/fleet-hub/docs/AS_IS_ANALYSIS.md
cat modules/fleet-hub/docs/TO_BE_DESIGN.md
```

### Create Pull Requests

```bash
# For high-priority modules, create PRs
gh pr create \
  --base main \
  --head module/fleet-hub \
  --title "Enhancement: Fleet Hub Module" \
  --body "$(cat modules/fleet-hub/ENHANCEMENT_SUMMARY.md)"
```

### Aggregate Results

```bash
# Generate final deployment report
./scripts/monitor-deployment.py --report

# Review deployment summary
cat DEPLOYMENT_SUMMARY_*.md
```

## Advanced Configuration

### Custom Grok Model

```bash
# Edit scripts/agent-template.py
# Change: GROK_MODEL = "grok-beta"
# To: GROK_MODEL = "grok-2-latest"
```

### Adjust Rate Limiting

```bash
# Edit scripts/agent-template.py
# Change: time.sleep(2)  # Between API calls
# To: time.sleep(5)  # More conservative
```

### Deploy to Different VM

```bash
# SSH to target VM
ssh azureuser@your-vm.cloudapp.azure.com

# Clone repo and deploy
git clone https://github.com/asmortongpt/fleet.git
cd fleet
./scripts/deploy-module-enhancement.sh
```

### Customize Module List

```bash
# Edit scripts/create-module-branches.sh
# Modify MODULES array to include/exclude modules
```

## Performance Optimization

### Parallel Execution

Agents are launched in batches of 8 to avoid overwhelming the API:

```bash
# In deploy-module-enhancement.sh
if (( agent_count % 8 == 0 )); then
    sleep 5  # Wait between batches
fi
```

### Retry Logic

Agents automatically retry failed API calls:

```python
# In agent-template.py
try:
    response = requests.post(GROK_API_URL, ...)
    response.raise_for_status()
except Exception as e:
    # Log and retry
```

## Cost Estimation

### Grok API Costs

- **Model**: Grok Beta
- **Tokens per module**: ~20,000 tokens (combined input/output)
- **Total tokens**: 32 modules × 20,000 = 640,000 tokens
- **Estimated cost**: ~$6-10 (check current pricing)

### Azure VM Costs

- **VM Size**: Standard D4s v3 (recommended)
- **Runtime**: 1-2 hours
- **Cost**: ~$0.50-1.00 per deployment

## Support and Maintenance

### Log Files

```bash
# Main deployment log
cat deployment-*.log

# Individual agent logs
cat deployment-status/agent-logs/*.log

# Git logs
git log --all --graph --oneline
```

### Clean Up

```bash
# Delete all module branches (if needed)
git branch --list 'module/*' | xargs git branch -D

# Delete remote branches
git branch -r --list 'origin/module/*' | sed 's/origin\///' | xargs git push origin --delete

# Clean deployment artifacts
rm -rf deployment-status/
rm deployment-*.log
```

## Next Steps

1. **Review**: Check all 32 module enhancement documents
2. **Prioritize**: Identify high-impact improvements
3. **Implement**: Start with top-priority modules
4. **Test**: Run comprehensive testing on staging
5. **Deploy**: Roll out to production incrementally
6. **Monitor**: Track performance and user feedback
7. **Iterate**: Continuous improvement cycle

## Resources

- **Grok AI Documentation**: https://docs.x.ai/
- **Azure Key Vault**: https://docs.microsoft.com/azure/key-vault/
- **Fleet Repository**: https://github.com/asmortongpt/fleet
- **Azure DevOps**: https://dev.azure.com/CapitalTechAlliance/FleetManagement

## Contact

For issues or questions:
- **Repository Issues**: https://github.com/asmortongpt/fleet/issues
- **Azure Support**: Azure Portal → Support
- **Grok Support**: support@x.ai

---

**🤖 32-Agent Module Enhancement System**
**Powered by Grok AI | Secured by Azure Key Vault**
**Version 1.0 | 2025-12-31**
