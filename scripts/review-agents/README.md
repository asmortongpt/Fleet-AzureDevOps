# Fleet Management System - Autonomous Code Review Agents

A comprehensive, multi-agent code review system that automatically analyzes your codebase for security vulnerabilities, performance issues, code quality problems, architectural concerns, and compliance violations.

## Overview

This system deploys **5 specialized autonomous agents** that work in parallel to perform deep analysis:

1. **Security Auditor** - OWASP Top 10, vulnerability scanning, secrets detection
2. **Performance Analyzer** - Bundle analysis, Lighthouse audits, database optimization
3. **Code Quality Reviewer** - Complexity metrics, test coverage, code duplication
4. **Architecture Reviewer** - Dependency graphs, circular dependencies, design patterns
5. **Compliance Checker** - WCAG accessibility, GDPR/privacy, FedRAMP requirements

## Features

- ✅ **Parallel Execution** - All 5 agents run simultaneously for fast results
- ✅ **Azure VM Deployment** - Uses spot instances for 80% cost savings
- ✅ **Comprehensive Reports** - JSON + Markdown with actionable recommendations
- ✅ **Code Examples** - Every finding includes fix examples
- ✅ **Effort Estimation** - Remediation time estimates for planning
- ✅ **Priority Scoring** - Critical, High, Medium, Low severity levels
- ✅ **Zero Configuration** - Works out of the box with sensible defaults

## Quick Start

### Option 1: Local Execution (Fastest)

Run the agents on your local machine:

```bash
cd /Users/andrewmorton/Documents/GitHub/fleet-local

# Set optional environment variables
export APP_URL="https://fleet.capitaltechalliance.com"  # For runtime testing

# Run all agents
./scripts/review-agents/06-run-all-agents.sh

# View report
cat COMPREHENSIVE_REVIEW_REPORT.md
```

### Option 2: Azure VM Deployment (Recommended for large codebases)

Deploy to Azure VM with all tools pre-installed:

```bash
# 1. Deploy Azure VM with review tools
./scripts/review-agents/00-azure-vm-deploy.sh

# 2. SSH into VM (connection script created automatically)
/tmp/connect-review-vm.sh

# 3. Clone repository on VM
git clone https://github.com/yourusername/fleet-local.git
cd fleet-local

# 4. Run agents
./scripts/review-agents/06-run-all-agents.sh

# 5. Download results
exit
scp -i ~/.ssh/azure_fleet_review_key \
  azurereviewer@<VM_IP>:/tmp/fleet-review-results/*.json \
  ./review-results/

scp -i ~/.ssh/azure_fleet_review_key \
  azurereviewer@<VM_IP>:fleet-local/COMPREHENSIVE_REVIEW_REPORT.md \
  ./
```

## Requirements

### Local Execution
- Node.js 18+ and npm
- jq (JSON processor)
- Bash 4.0+

### Azure VM Deployment
- Azure CLI installed and authenticated
- SSH key pair (auto-generated if needed)

## Cost Estimation

### Local Execution
- **Cost:** $0 (uses your machine)
- **Time:** 10-15 minutes for typical codebase

### Azure VM (Spot Instance)
- **VM Cost:** ~$0.30-0.40 per review cycle (8 hours max)
- **Storage:** ~$0.01/month
- **Total:** Under $0.50 per review
- **Auto-shutdown:** Configured for 8 hours runtime

## Output Files

After running agents, you'll find:

```
/tmp/fleet-review-results/
├── 01-security-audit-report.json      # Security findings
├── 02-performance-report.json         # Performance analysis
├── 03-code-quality-report.json        # Code quality metrics
├── 04-architecture-report.json        # Architecture review
├── 05-compliance-report.json          # Compliance checks
├── agent-1-security.log               # Agent execution logs
├── agent-2-performance.log
├── agent-3-quality.log
├── agent-4-architecture.log
└── agent-5-compliance.log

COMPREHENSIVE_REVIEW_REPORT.md         # Final aggregated report
```

## Report Structure

The comprehensive report includes:

1. **Executive Summary** - High-level metrics and risk assessment
2. **Critical Issues** - Immediate security/functionality risks
3. **High Priority Issues** - Near-term concerns
4. **Medium Priority Issues** - Quality improvements
5. **Low Priority Issues** - Minor optimizations
6. **Remediation Timeline** - Phased approach with effort estimates
7. **Recommendations** - Best practices and next steps
8. **Appendix** - Detailed metrics and statistics

## Individual Agent Details

### 1. Security Auditor (`01-agent-security-auditor.sh`)

**Scans:**
- NPM audit for dependency vulnerabilities
- Snyk vulnerability database
- ESLint security plugin rules
- GitLeaks secrets detection
- SQL injection patterns
- XSS vulnerability patterns
- Authentication/authorization review
- CORS configuration
- Security headers (Helmet.js)
- OWASP Top 10 coverage

**Key Findings:**
- Hardcoded secrets or API keys
- Vulnerable dependencies
- Missing security controls
- Insecure coding patterns

### 2. Performance Analyzer (`02-agent-performance-analyzer.sh`)

**Analyzes:**
- Build time and bundle size
- Heavy dependencies (moment, lodash, d3, etc.)
- Unused dependencies
- Lighthouse performance audit (if URL provided)
- Image optimization opportunities
- Database query patterns (N+1 queries)
- React performance (memo, virtualization)
- Code splitting opportunities

**Key Findings:**
- Oversized bundles
- Unoptimized images
- Missing lazy loading
- Inefficient database queries

### 3. Code Quality Reviewer (`03-agent-code-quality.sh`)

**Checks:**
- ESLint violations
- TypeScript strict mode
- Cyclomatic complexity (>15 flag)
- Code duplication (>10% flag)
- Test coverage (target: 80%+)
- Code smells (long files, long functions, magic numbers)
- Debug console statements
- Documentation coverage

**Key Findings:**
- Complex functions needing refactoring
- Insufficient test coverage
- Code duplication hotspots
- Missing documentation

### 4. Architecture Reviewer (`04-agent-architecture-reviewer.sh`)

**Reviews:**
- Dependency graph and coupling
- Circular dependencies
- Layer architecture violations
- Design pattern usage
- Scalability concerns (caching, sync operations)
- N+1 query anti-patterns
- Missing pagination
- API design best practices
- Microservices readiness

**Key Findings:**
- Circular dependencies
- High coupling between modules
- Missing architectural patterns
- Scalability bottlenecks

### 5. Compliance Checker (`05-agent-compliance-checker.sh`)

**Validates:**
- WCAG 2.0 AA accessibility (pa11y)
- Missing alt text on images
- Form labels and ARIA
- Keyboard navigation
- GDPR compliance (privacy policy, cookie consent)
- Data export/deletion features
- API documentation (OpenAPI/Swagger)
- Rate limiting
- FedRAMP requirements (audit logging, TLS)

**Key Findings:**
- Accessibility violations
- GDPR compliance gaps
- Missing API standards
- FedRAMP non-compliance

## Configuration

### Environment Variables

```bash
# Required
export REPO_DIR="/path/to/fleet-local"           # Repository path

# Optional
export OUTPUT_DIR="/tmp/fleet-review-results"    # Output directory
export APP_URL="https://your-app.com"            # For runtime testing
export FINAL_REPORT="./REVIEW_REPORT.md"        # Report output path
export SNYK_TOKEN="your-snyk-token"              # For Snyk scanning

# Azure VM Deployment
export AZURE_RESOURCE_GROUP="fleet-review-rg"    # Resource group name
export AZURE_LOCATION="eastus2"                  # Azure region
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Code Review
on:
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * 1'  # Weekly on Monday 2 AM

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install dependencies
        run: |
          npm install -g madge jscpd complexity-report
          sudo apt-get install -y jq

      - name: Run code review agents
        run: ./scripts/review-agents/06-run-all-agents.sh
        env:
          APP_URL: ${{ secrets.STAGING_URL }}

      - name: Upload reports
        uses: actions/upload-artifact@v3
        with:
          name: code-review-reports
          path: |
            COMPREHENSIVE_REVIEW_REPORT.md
            /tmp/fleet-review-results/*.json

      - name: Comment PR with summary
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('COMPREHENSIVE_REVIEW_REPORT.md', 'utf8');
            const summary = report.split('---')[0];  // Executive summary
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## 🤖 Automated Code Review\n\n${summary}`
            });
```

## Troubleshooting

### "Command not found: jq"
Install jq: `brew install jq` (macOS) or `apt-get install jq` (Ubuntu)

### "Command not found: madge"
Install globally: `npm install -g madge`

### "Build failed" during performance analysis
Ensure all dependencies are installed: `npm install`

### Agents taking too long
- Run locally instead of VM for faster feedback
- Disable optional scans (Lighthouse, Snyk) by commenting them out
- Use `--quick` mode (add to agents if needed)

### Azure VM deployment fails
- Check Azure CLI authentication: `az login`
- Verify subscription: `az account show`
- Ensure sufficient quota for VM type

## Advanced Usage

### Run Individual Agents

```bash
# Security audit only
./scripts/review-agents/01-agent-security-auditor.sh

# Performance analysis only
./scripts/review-agents/02-agent-performance-analyzer.sh

# etc.
```

### Custom Output Directory

```bash
export OUTPUT_DIR="$HOME/fleet-reviews/$(date +%Y%m%d)"
./scripts/review-agents/06-run-all-agents.sh
```

### Exclude Specific Agents

Edit `06-run-all-agents.sh` and comment out agents you don't need:

```bash
# Agent 3: Code Quality Reviewer
# log_agent "Starting Agent 3: Code Quality Reviewer"
# bash "$SCRIPT_DIR/03-agent-code-quality.sh" > "$OUTPUT_DIR/agent-3-quality.log" 2>&1 &
# AGENT_PIDS+=($!)
```

## Security Considerations

- **Secrets Detection:** Agents scan for hardcoded secrets but DO NOT upload them
- **API Keys:** Snyk token is optional and only used locally
- **Azure VM:** Spot instances are automatically deallocated after 8 hours
- **SSH Keys:** Generated keys are stored in `~/.ssh/` with proper permissions
- **Reports:** Contain code snippets but not sensitive data

## Cleanup

### Local Cleanup
```bash
rm -rf /tmp/fleet-review-results
```

### Azure VM Cleanup
```bash
# Delete entire resource group (VM, storage, network)
az group delete --name fleet-review-rg --yes --no-wait

# Or delete just the VM
az vm delete --resource-group fleet-review-rg --name <vm-name> --yes
```

## Support

For issues or questions:
1. Check agent logs in `/tmp/fleet-review-results/agent-*.log`
2. Review individual JSON reports for details
3. Consult CLAUDE.md for project-specific context
4. Open GitHub issue with logs attached

## License

Part of the Fleet Management System project. Internal use only.

---

**Generated by Fleet Code Review System**
**Last Updated:** December 2, 2025
