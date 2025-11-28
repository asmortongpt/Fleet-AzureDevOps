# Fleet Multi-Agent Orchestration - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies

```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet/agent_orch

# Install Python dependencies
pip3 install -r requirements.txt
```

### Step 2: Set Environment Variables

```bash
# Add to ~/.zshrc or ~/.bashrc
export OPENAI_API_KEY="your-openai-api-key-here"

# Or use from global .env (recommended)
source ~/.env
```

### Step 3: Test Locally (Dry Run)

```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet/agent_orch

# Dry run - no actual changes
python3 orchestrator.py --config config.yaml --environment staging --dry-run

# Check logs
tail -f logs/orchestrator.log
```

### Step 4: Azure DevOps Setup

1. **Add Pipeline Variable**:
   - Go to Azure DevOps → Pipelines → Library
   - Create variable group: `fleet-orchestrator-secrets`
   - Add variable: `OPENAI_API_KEY` (mark as secret)

2. **Commit & Push**:

```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet

git add agent_orch/ azure-pipelines.yml scripts/smoke_test.sh
git commit -m "feat: Add multi-agent orchestration system

- CodexAgent: Error analysis & patch generation (GPT-4)
- JulesAgent: Security review & approval (GPT-4)
- DevOpsAgent: Azure/Kubernetes operations
- Quality gates, smoke tests, verification
- Auto-fix on build failures in staging
- Safe operations with backup branches

🤖 Generated with Claude Code"

git push origin main
```

3. **Trigger Pipeline**:
   - Push to `stage-a/requirements-inception` branch
   - Pipeline will automatically trigger
   - Watch "AI Orchestration" stage

## 📋 What Happens Next

### On Build Success
```
Build & Test ✅ → Docker Build ✅ → Deploy Staging ✅ → Deploy Prod (manual) ✅
```

### On Build Failure (Auto-Fix)
```
Build & Test ❌ → AI Orchestration 🤖 → Auto-Fix → Re-Build ✅ → Deploy ✅
```

## 🔍 Monitor Orchestration

### View Logs

```bash
# Real-time logs
tail -f /Users/andrewmorton/Documents/GitHub/Fleet/agent_orch/logs/orchestrator.log

# Latest verification report
ls -lt /Users/andrewmorton/Documents/GitHub/Fleet/agent_orch/logs/verification_*.json | head -1
```

### Azure DevOps

1. Go to Pipelines → Builds
2. Select latest build
3. View "AI Orchestration" stage
4. Check logs for:
   - Error analysis
   - Patch generation
   - Security review
   - Fix application

## ✅ Verify Installation

```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet/agent_orch

# Check Python version
python3 --version  # Should be 3.11+

# Check dependencies
pip3 list | grep -E "openai|pyyaml|requests"

# Test orchestrator help
python3 orchestrator.py --help

# Run smoke tests
bash ../scripts/smoke_test.sh https://fleet.capitaltechalliance.com
```

## 🔧 Troubleshooting

### "OPENAI_API_KEY not set"

```bash
echo $OPENAI_API_KEY  # Should print your key
# If empty, add to ~/.zshrc and reload:
source ~/.zshrc
```

### "Module not found"

```bash
pip3 install -r requirements.txt --upgrade
```

### "Permission denied"

```bash
chmod +x orchestrator.py
chmod +x ../scripts/smoke_test.sh
```

## 🎯 Next Steps

1. **Test with intentional failure**:
   - Introduce a build error
   - Push to `stage-a/requirements-inception`
   - Watch orchestrator auto-fix

2. **Customize config**:
   - Edit `agent_orch/config.yaml`
   - Adjust quality gates, timeouts, safety limits

3. **Add custom verification**:
   - Add endpoints to `verification.critical_flows`
   - Extend smoke tests in `scripts/smoke_test.sh`

## 📚 Documentation

- Full README: `agent_orch/README.md`
- Configuration: `agent_orch/config.yaml`
- Pipeline: `azure-pipelines.yml`

## 🆘 Support

Issues? Contact: andrew.m@capitaltechalliance.com

---

**🤖 Autonomous. Intelligent. Production-Ready.**
