# Fleet Code Review System - Script Reference

Quick reference for all scripts in the review system.

## Deployment Scripts

### `00-azure-vm-deploy.sh`
**Purpose:** Deploy Azure VM with review tools pre-installed
**Usage:** `./00-azure-vm-deploy.sh`
**Runtime:** ~5 minutes
**Output:** VM IP, SSH connection script
**Cost:** ~$0.30-0.40 per 8-hour session

**Key Features:**
- Spot instance (80% cost savings)
- Cloud-init with all tools
- Auto-shutdown after 8 hours
- SSH key generation

## Agent Scripts

### `01-agent-security-auditor.sh`
**Purpose:** Security vulnerability analysis
**Runtime:** 3-5 minutes
**Output:** `01-security-audit-report.json`

**Checks:**
- npm audit vulnerabilities
- Snyk database (optional)
- GitLeaks secrets
- SQL injection patterns
- XSS vulnerabilities
- Auth/CORS/headers
- OWASP Top 10

### `02-agent-performance-analyzer.sh`
**Purpose:** Performance optimization analysis
**Runtime:** 5-8 minutes (includes build)
**Output:** `02-performance-report.json`

**Analyzes:**
- Bundle size/build time
- Heavy dependencies
- Lighthouse audit (optional)
- Image optimization
- Database queries
- React performance

### `03-agent-code-quality.sh`
**Purpose:** Code quality metrics
**Runtime:** 2-4 minutes
**Output:** `03-code-quality-report.json`

**Checks:**
- ESLint violations
- TypeScript strict mode
- Complexity metrics
- Code duplication
- Test coverage
- Code smells
- Documentation

### `04-agent-architecture-reviewer.sh`
**Purpose:** Architecture analysis
**Runtime:** 2-3 minutes
**Output:** `04-architecture-report.json`

**Reviews:**
- Dependency graphs
- Circular dependencies
- Layer violations
- Design patterns
- Scalability concerns
- API design

### `05-agent-compliance-checker.sh`
**Purpose:** Compliance validation
**Runtime:** 3-5 minutes
**Output:** `05-compliance-report.json`

**Validates:**
- WCAG accessibility
- GDPR compliance
- API standards
- Rate limiting
- FedRAMP requirements

## Orchestration Scripts

### `06-run-all-agents.sh`
**Purpose:** Run all 5 agents in parallel
**Usage:** `./06-run-all-agents.sh`
**Runtime:** 10-15 minutes
**Output:** All agent reports + logs

**Features:**
- Parallel execution
- Progress monitoring
- Failure handling
- Summary statistics

**Environment Variables:**
```bash
export REPO_DIR="/path/to/repo"          # Default: $(pwd)
export OUTPUT_DIR="/tmp/results"         # Default: /tmp/fleet-review-results
export APP_URL="https://your-app.com"    # Optional: for runtime tests
```

### `07-generate-report.sh`
**Purpose:** Generate comprehensive Markdown report
**Usage:** `./07-generate-report.sh`
**Runtime:** <1 minute
**Output:** `COMPREHENSIVE_REVIEW_REPORT.md`

**Generates:**
- Executive summary
- Prioritized findings
- Code examples
- Remediation timeline
- Best practices
- Metrics appendix

## Quick Start Scripts

### `quick-start-local.sh`
**Purpose:** One-command local execution
**Usage:** `./quick-start-local.sh`
**Runtime:** 10-15 minutes
**Output:** Full review + report

**Features:**
- Interactive setup
- Tool installation help
- Prerequisite checking
- Summary output

## Usage Examples

### Run Full Review Locally
```bash
cd /Users/andrewmorton/Documents/GitHub/fleet-local
./scripts/review-agents/quick-start-local.sh
```

### Run Individual Agent
```bash
export REPO_DIR="$(pwd)"
export OUTPUT_DIR="/tmp/fleet-review-results"
./scripts/review-agents/01-agent-security-auditor.sh
```

### Run with Custom Settings
```bash
export REPO_DIR="/path/to/fleet"
export OUTPUT_DIR="$HOME/reviews/$(date +%Y%m%d)"
export APP_URL="https://fleet.capitaltechalliance.com"
./scripts/review-agents/06-run-all-agents.sh
```

### Deploy to Azure and Run
```bash
# Deploy VM
./scripts/review-agents/00-azure-vm-deploy.sh

# Note the VM IP from output
VM_IP="<ip-from-output>"

# Connect and run
ssh -i ~/.ssh/azure_fleet_review_key azurereviewer@$VM_IP
git clone https://github.com/asmortongpt/Fleet.git fleet-local
cd fleet-local
./scripts/review-agents/06-run-all-agents.sh

# Download results
exit
scp -i ~/.ssh/azure_fleet_review_key \
  azurereviewer@$VM_IP:fleet-local/COMPREHENSIVE_REVIEW_REPORT.md ./
```

## Environment Variables

### Required
None - all have sensible defaults

### Optional
- `REPO_DIR` - Repository path (default: current directory)
- `OUTPUT_DIR` - Output directory (default: /tmp/fleet-review-results)
- `FINAL_REPORT` - Report path (default: COMPREHENSIVE_REVIEW_REPORT.md)
- `APP_URL` - Application URL for runtime tests
- `SNYK_TOKEN` - Snyk API token for enhanced scanning

### Azure VM Deployment
- `AZURE_RESOURCE_GROUP` - Resource group name (default: fleet-code-review-rg)
- `AZURE_LOCATION` - Azure region (default: eastus2)

## Output Files

### Agent Reports (JSON)
- `01-security-audit-report.json` - Security findings
- `02-performance-report.json` - Performance metrics
- `03-code-quality-report.json` - Quality analysis
- `04-architecture-report.json` - Architecture review
- `05-compliance-report.json` - Compliance validation

### Logs
- `agent-1-security.log` - Security agent execution log
- `agent-2-performance.log` - Performance agent log
- `agent-3-quality.log` - Quality agent log
- `agent-4-architecture.log` - Architecture agent log
- `agent-5-compliance.log` - Compliance agent log

### Reports
- `COMPREHENSIVE_REVIEW_REPORT.md` - Final aggregated report

### Temporary Files
- `npm-audit.json` - npm audit results
- `snyk-report.json` - Snyk results
- `eslint-security.json` - ESLint security results
- `gitleaks-report.json` - GitLeaks results
- `lighthouse-report.json` - Lighthouse results
- `pa11y-report.json` - Pa11y results
- `dependencies.json` - Dependency graph
- `complexity.json` - Complexity metrics
- `duplication.json` - Duplication analysis

## Exit Codes

- `0` - Success
- `1` - General error
- `2` - Missing dependencies
- `3` - Configuration error

## Debugging

### Enable Verbose Logging
```bash
set -x  # Add to top of script
export DEBUG=1
./scripts/review-agents/06-run-all-agents.sh
```

### Check Individual Agent
```bash
bash -x ./scripts/review-agents/01-agent-security-auditor.sh
```

### View Logs
```bash
# Real-time
tail -f /tmp/fleet-review-results/agent-1-security.log

# All logs
cat /tmp/fleet-review-results/*.log
```

## Common Issues

### "Command not found: jq"
```bash
# macOS
brew install jq

# Ubuntu
sudo apt-get install jq
```

### "npm audit fails"
```bash
# Ensure dependencies are installed
npm install

# Try manually
npm audit --json
```

### "Agent takes too long"
```bash
# Skip optional scans
unset APP_URL  # Skips Lighthouse/pa11y

# Run critical agents only
./scripts/review-agents/01-agent-security-auditor.sh
./scripts/review-agents/03-agent-code-quality.sh
./scripts/review-agents/05-agent-compliance-checker.sh
```

### "Build fails"
```bash
# Ensure dependencies installed
cd /path/to/fleet-local
npm install

# Test build manually
npm run build
```

## Performance Tips

### Speed Up Reviews
1. Run locally instead of VM
2. Skip optional scans (unset APP_URL)
3. Run critical agents only
4. Increase parallel limit

### Reduce Costs
1. Use local execution ($0)
2. Use spot instances (done by default)
3. Enable auto-shutdown (done by default)
4. Delete VM after use

## Security Notes

- Agents scan for secrets but don't expose them
- Reports contain code snippets (no sensitive data)
- Azure VM uses SSH keys only
- Storage account private access
- Auto-shutdown prevents runaway costs

## Maintenance

### Update Tools
```bash
npm update -g madge jscpd complexity-report lighthouse pa11y
```

### Update Scripts
```bash
cd /Users/andrewmorton/Documents/GitHub/fleet-local
git pull origin main
chmod +x scripts/review-agents/*.sh
```

### Cleanup
```bash
# Local
rm -rf /tmp/fleet-review-results

# Azure
az group delete --name fleet-code-review-rg --yes
```

---

**Last Updated:** December 2, 2025
**Version:** 1.0
