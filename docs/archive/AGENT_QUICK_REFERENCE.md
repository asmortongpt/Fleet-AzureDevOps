# 32-Agent System - Quick Reference Card

## 🚀 One-Command Deployment

```bash
cd /path/to/fleet
./scripts/deploy-module-enhancement.sh
```

## 📋 Pre-Deployment Checklist

```bash
# 1. Verify Azure CLI
az login && az account show

# 2. Verify Key Vault access
az keyvault secret list --vault-name fleet-secrets-vault

# 3. Verify Git
git status && git remote -v

# 4. Verify Python
python3 --version && python3 -c "import requests"
```

## 🔑 Required Secrets in Key Vault

| Secret Name | Purpose |
|-------------|---------|
| `grok-api-key` | X.AI Grok API |
| `github-pat` | GitHub push access |
| `azure-devops-pat` | Azure DevOps push |
| `azure-client-id` | Azure authentication |
| `azure-tenant-id` | Azure authentication |
| `azure-client-secret` | Azure authentication |

## 📊 Monitor Deployment

```bash
# Real-time dashboard
./scripts/monitor-deployment.py

# Generate report after completion
./scripts/monitor-deployment.py --report
```

## 🗂️ Output Files

Each of 32 module branches will contain:

```
modules/<module-name>/
├── ENHANCEMENT_SUMMARY.md      # ⭐ Start here
├── docs/
│   ├── AS_IS_ANALYSIS.md       # Current state
│   ├── TO_BE_DESIGN.md         # Enhancement design
│   ├── IMPLEMENTATION_LOG.md   # Code implementation
│   └── TEST_PLAN.md            # Testing strategy
└── status/
    └── agent-status.json       # Real-time status
```

## ⏱️ Timeline

- **Single Agent**: 35-45 minutes
- **32 Agents (parallel)**: 45-90 minutes
- **Total Cost**: ~$7-11 USD

## 🔍 Check Results

```bash
# List all module branches
git branch --list 'module/*'

# Review specific module
git checkout module/fleet-hub
cat modules/fleet-hub/ENHANCEMENT_SUMMARY.md

# View all summaries
find modules -name "ENHANCEMENT_SUMMARY.md" -exec echo "=== {} ===" \; -exec cat {} \;
```

## 🚨 Emergency Stop

```bash
# Find deployment processes
ps aux | grep agent-template.py

# Kill all agents
pkill -f agent-template.py

# Return to base branch
git checkout main
```

## 🐛 Troubleshooting Quick Fixes

```bash
# Azure not logged in
az login

# Key Vault access denied
az keyvault set-policy --name fleet-secrets-vault \
  --upn $(az account show --query user.name -o tsv) \
  --secret-permissions get list

# Git auth failed
git config --global credential.helper store

# Python requests missing
python3 -m pip install requests

# Branch exists error
git branch -D module/<name>
git push origin --delete module/<name>
```

## 📝 Manual Single Agent Run

```bash
# 1. Get secrets
SECRETS_FILE=$(./scripts/fetch-secrets.sh)
source "$SECRETS_FILE"

# 2. Checkout module branch
git checkout module/fleet-hub

# 3. Run agent
./scripts/agent-template.py fleet-hub module/fleet-hub

# 4. Check results
ls -la modules/fleet-hub/docs/
```

## 🎯 Agent Workflow (Each Module)

```
1. Analysis    (10-15 min) → AS_IS_ANALYSIS.md
2. Design      (10-15 min) → TO_BE_DESIGN.md
3. Implement   (10-15 min) → IMPLEMENTATION_LOG.md
4. Test        (5-10 min)  → TEST_PLAN.md
5. Document    (5 min)     → ENHANCEMENT_SUMMARY.md
6. Push        (2-5 min)   → GitHub + Azure DevOps
```

## 📂 Important Files

| File | Purpose |
|------|---------|
| `/AGENT_DEPLOYMENT_GUIDE.md` | Complete deployment guide |
| `/scripts/AGENT_SYSTEM_README.md` | System documentation |
| `/scripts/deploy-module-enhancement.sh` | Main deployment script |
| `/scripts/agent-template.py` | AI agent template |
| `/scripts/monitor-deployment.py` | Real-time monitor |
| `/scripts/fetch-secrets.sh` | Key Vault integration |
| `/scripts/create-module-branches.sh` | Branch creator |

## 🔐 Security Reminder

✅ **DO**:
- Use Azure Key Vault for all secrets
- Delete secrets file after use (automatic)
- Use environment variables only
- Review code before deployment

❌ **DON'T**:
- Hardcode API keys
- Commit secrets to Git
- Store secrets in plain text
- Skip security reviews

## 📞 Get Help

1. **Check logs**: `cat deployment-*.log`
2. **Agent logs**: `cat deployment-status/agent-logs/*.log`
3. **Status files**: `cat modules/*/status/agent-status.json`
4. **Create issue**: https://github.com/asmortongpt/fleet/issues

## 🎉 Post-Deployment

```bash
# 1. Review all modules
git branch --list 'module/*' | wc -l  # Should be 32

# 2. Find high-priority items
grep -r "high.priority" modules/*/docs/

# 3. Create PRs for top modules
gh pr create --base main --head module/fleet-hub \
  --title "Enhancement: Fleet Hub" \
  --body "$(cat modules/fleet-hub/ENHANCEMENT_SUMMARY.md)"

# 4. Generate final report
./scripts/monitor-deployment.py --report
```

## 💡 Pro Tips

- **Run in tmux/screen** for long sessions
- **Monitor in separate terminal** for real-time updates
- **Review summaries first** before diving into details
- **Prioritize by business value** not technical complexity
- **Test incrementally** don't deploy all at once

## 🔄 Re-run Failed Modules

```bash
# Find failed modules
find modules -name "agent-status.json" -exec jq -r 'select(.status=="failed") | .module' {} \;

# Re-run specific module
git checkout module/<failed-module>
./scripts/agent-template.py <failed-module> module/<failed-module>
```

---

**Keep this card handy during deployment!**

**🤖 32-Agent Module Enhancement System**
**Version 1.0 | 2025-12-31**
