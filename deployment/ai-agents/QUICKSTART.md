# Fleet AI Agents - Quick Start Guide

## 🚀 Deploy AI Agents in 3 Steps

### Step 1: Verify Prerequisites (2 minutes)

```bash
# Check Azure CLI
az account show

# Verify API keys are set
echo "Anthropic: ${ANTHROPIC_API_KEY:0:10}..."
echo "OpenAI: ${OPENAI_API_KEY:0:10}..."
echo "Gemini: ${GEMINI_API_KEY:0:10}..."

# If not set, load from global env
source ~/.env
```

### Step 2: Deploy Agents (10 minutes setup + 1-2 hours execution)

```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet/deployment/ai-agents
./deploy-agents.sh
```

**What happens**:
1. Creates Azure resource group `fleet-completion-agents-rg`
2. Deploys 5 VMs (Standard_B2s, Ubuntu 22.04)
3. Installs Node.js, Python, Git, Azure CLI on each VM
4. Clones Fleet repository
5. Installs dependencies
6. Starts AI agents

**Expected output**:
```
╔══════════════════════════════════════════════════════════════╗
║   Azure VM Fleet Completion AI Agents - Deployment          ║
╚══════════════════════════════════════════════════════════════╝

Step 1: Creating Resource Group...
✓ Resource group created

Step 2: Creating Network Security Group...
✓ Network security group created

Step 3: Creating Virtual Network...
✓ Virtual network created

Step 4: Deploying AI Agent VMs (5 VMs)...
Deploying Agent 1: enterprise-data-table (using Claude 3.5 Sonnet)
  ✓ VM created: fleet-enterprise-data-table-vm (IP: x.x.x.x)
[... 4 more agents ...]

╔══════════════════════════════════════════════════════════════╗
║                 DEPLOYMENT COMPLETE                          ║
╚══════════════════════════════════════════════════════════════╝
```

### Step 3: Monitor Progress (1-2 hours)

```bash
# One-time check
python3 monitor-dashboard.py

# Continuous monitoring (refreshes every 30 seconds)
watch -n 30 python3 monitor-dashboard.py
```

**Expected output**:
```
╔══════════════════════════════════════════════════════════════╗
║   Fleet AI Agents - Real-Time Monitoring Dashboard          ║
║   Updated: 2025-11-28 12:57:00                              ║
╚══════════════════════════════════════════════════════════════╝

VM Summary:
────────────────────────────────────────────────────────────────
Agent 1: Enterprise Data Table
  VM: fleet-enterprise-data-table-vm
  Status: VM running
  IP: x.x.x.x
  LLM: Claude 3.5 Sonnet
  Output: EnterpriseDataTable.tsx
  Agent Status: COMPLETED
  Completed: 2025-11-28T13:45:00

[... 4 more agents ...]

Overall Progress: ████████████████████████████████ 100% (5/5 agents completed)
```

## 📊 What Each Agent Does

| Agent | LLM | Output File | Features |
|-------|-----|-------------|----------|
| **Agent 1** | Claude 3.5 Sonnet | `src/components/tables/EnterpriseDataTable.tsx` | Sorting, filtering, pagination, virtual scrolling, export, saved views |
| **Agent 2** | GPT-4 Turbo | `src/components/charts/ChartLibrary.tsx` | 15+ chart types with export and dark mode |
| **Agent 3** | Gemini 1.5 Pro | `src/components/forms/FormComponents.tsx` | 15+ input types with validation |
| **Agent 4** | Claude 3.5 Sonnet | `vite.config.optimized.ts`, `src/lib/react-query-setup.ts`, `src/lib/performance-monitoring.ts` | Performance optimizations |
| **Agent 5** | GPT-4 Turbo | `.storybook/*`, `src/**/*.stories.tsx` | Storybook documentation |

## ✅ Verify Completion

Once all agents show "COMPLETED" status:

```bash
# Pull latest changes
git fetch origin
git log origin/stage-a/requirements-inception --oneline | head -10
```

**Expected commits** (5 new commits):
```
abc1234 docs: Add Storybook documentation for all components
def5678 feat: Add performance optimizations and monitoring
ghi9012 feat: Add complete form component system
jkl3456 feat: Add advanced chart library with 15+ chart types
mno7890 feat: Add enterprise data table with all features
```

## 🔧 Integration

Follow the detailed [Integration Plan](INTEGRATION_PLAN.md):

```bash
# 1. Pull changes
git pull origin stage-a/requirements-inception

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Build
npm run build

# 4. Test
npm run test

# 5. Run Storybook
npm run storybook

# 6. Merge to main
git checkout main
git merge stage-a/requirements-inception --no-ff
```

## 🧹 Cleanup

When done:

```bash
./stop-agents.sh
```

This will delete all Azure resources (VMs, network, IPs, etc.).

## 🆘 Troubleshooting

### Agent not starting?

```bash
# SSH to VM
ssh -i ~/.ssh/fleet-agents-key azureuser@<PUBLIC_IP>

# Check logs
tail -f ~/agent.log
systemctl status fleet-agent
```

### Agent failed?

```bash
# Check status JSON
ssh -i ~/.ssh/fleet-agents-key azureuser@<PUBLIC_IP> \
  'cat ~/fleet-agent/fleet/agent*-status.json'
```

### Need to re-run an agent?

```bash
# SSH to VM
ssh -i ~/.ssh/fleet-agents-key azureuser@<PUBLIC_IP>

# Restart agent
cd ~/fleet-agent/fleet
source ../venv/bin/activate
python agent.py
```

## 💰 Cost

- **VM Cost**: 5 VMs × $0.04/hour = **$0.20/hour**
- **2-hour run**: **~$0.40**
- **Storage**: **~$0.10**
- **Total**: **~$0.50 - $1.00**

## 📞 Support

- **Email**: andrew.m@capitaltechalliance.com
- **Docs**: [README.md](README.md)
- **Integration Guide**: [INTEGRATION_PLAN.md](INTEGRATION_PLAN.md)

---

**Ready to deploy?** Run `./deploy-agents.sh` 🚀
