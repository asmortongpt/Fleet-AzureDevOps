# Fleet Code Review System - Deployment Guide

## System Architecture

This autonomous code review system consists of:

### Core Components

1. **Azure VM Deployment Script** (`00-azure-vm-deploy.sh`)
   - Creates Azure Spot VM (Standard_D4s_v3)
   - Installs all review tools via cloud-init
   - Configures auto-shutdown (8 hours)
   - Cost: ~$0.30-0.40 per review cycle

2. **5 Specialized Review Agents** (01-05 scripts)
   - Each agent runs independently in parallel
   - Generates JSON reports with structured findings
   - Includes severity levels, remediation steps, code examples
   - Estimates effort for each issue

3. **Orchestration System** (`06-run-all-agents.sh`)
   - Launches all agents in parallel
   - Monitors progress and handles failures
   - Aggregates results from all agents

4. **Report Generator** (`07-generate-report.sh`)
   - Combines all JSON reports into comprehensive Markdown
   - Prioritizes findings by severity
   - Creates actionable remediation timeline
   - Includes executive summary for stakeholders

## Deployment Options

### Option A: Local Execution (Recommended for Development)

**Pros:**
- Zero cost
- Immediate results
- No network dependencies
- Easy debugging

**Cons:**
- Requires local tool installation
- May be slower on large codebases

**Steps:**
```bash
cd /Users/andrewmorton/Documents/GitHub/fleet-local
./scripts/review-agents/quick-start-local.sh
```

### Option B: Azure VM (Recommended for Production)

**Pros:**
- Isolated environment
- Pre-configured tools
- Consistent results
- Cost-effective (spot instances)

**Cons:**
- Requires Azure account
- Setup time (~5 minutes)
- Network latency for large repos

**Steps:**
```bash
# Deploy VM
./scripts/review-agents/00-azure-vm-deploy.sh

# Connect and run
ssh -i ~/.ssh/azure_fleet_review_key azurereviewer@<VM_IP>
cd fleet-local
./scripts/review-agents/06-run-all-agents.sh

# Download results
scp -i ~/.ssh/azure_fleet_review_key \
  azurereviewer@<VM_IP>:fleet-local/COMPREHENSIVE_REVIEW_REPORT.md ./
```

### Option C: CI/CD Integration

**Use Cases:**
- Automated PR reviews
- Scheduled weekly audits
- Release quality gates

**GitHub Actions Example:**
See `README.md` for full GitHub Actions workflow.

## Tool Requirements

### Required Tools
- **Node.js 18+** and **npm**
- **jq** (JSON processor)
- **Bash 4.0+**

### Optional Tools (for enhanced scanning)
- **madge** - Dependency graph analysis
- **jscpd** - Code duplication detection
- **complexity-report** - Cyclomatic complexity
- **lighthouse** - Performance audits
- **pa11y** - Accessibility testing
- **gitleaks** - Secrets detection
- **snyk** - Vulnerability scanning

### Installation

#### macOS
```bash
brew install jq node
npm install -g madge jscpd complexity-report lighthouse pa11y
```

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install -y jq nodejs npm
npm install -g madge jscpd complexity-report lighthouse pa11y
```

#### Azure VM (Automated)
Cloud-init script handles all installations automatically.

## Agent Details

### Agent 1: Security Auditor
**Runtime:** 3-5 minutes
**Output:** `01-security-audit-report.json`

**Scans:**
- NPM audit (dependency vulnerabilities)
- Snyk database (if token provided)
- ESLint security rules
- GitLeaks (secrets detection)
- SQL injection patterns
- XSS vulnerabilities
- Authentication/authorization
- CORS configuration
- Security headers
- OWASP Top 10 coverage

### Agent 2: Performance Analyzer
**Runtime:** 5-8 minutes (includes build)
**Output:** `02-performance-report.json`

**Analyzes:**
- Build time and bundle size
- Heavy/unused dependencies
- Lighthouse audit (if URL provided)
- Image optimization
- Database query patterns
- React performance patterns
- Code splitting opportunities

### Agent 3: Code Quality Reviewer
**Runtime:** 2-4 minutes
**Output:** `03-code-quality-report.json`

**Checks:**
- ESLint violations
- TypeScript strict mode
- Cyclomatic complexity
- Code duplication
- Test coverage
- Code smells
- Documentation coverage

### Agent 4: Architecture Reviewer
**Runtime:** 2-3 minutes
**Output:** `04-architecture-report.json`

**Reviews:**
- Dependency graph
- Circular dependencies
- Layer violations
- Design patterns
- Scalability concerns
- API design
- Microservices readiness

### Agent 5: Compliance Checker
**Runtime:** 3-5 minutes
**Output:** `05-compliance-report.json`

**Validates:**
- WCAG 2.0 AA accessibility
- ARIA labels and keyboard navigation
- GDPR compliance
- Cookie consent
- API standards
- Rate limiting
- FedRAMP requirements

## Cost Analysis

### Local Execution
- **Compute:** $0 (your machine)
- **Time:** 10-15 minutes
- **Total:** $0

### Azure VM (Spot Instance)
- **VM (D4s_v3 Spot):** $0.0336/hour × 1 hour = $0.034
- **Storage (128GB):** $0.012/month ≈ $0.0004/day
- **Network Egress:** <$0.01
- **Auto-shutdown:** 8 hours max
- **Total per review:** ~$0.30-0.40

### CI/CD (GitHub Actions)
- **Public repos:** Free (2,000 minutes/month)
- **Private repos:** $0.008/minute
- **Estimated time:** 15 minutes
- **Cost per run:** $0.12 (private repos)

## Output Structure

```
/tmp/fleet-review-results/
├── 01-security-audit-report.json       # Security findings
│   ├── findings.critical[]             # Critical issues
│   ├── findings.high[]                 # High priority
│   ├── findings.medium[]               # Medium priority
│   ├── findings.low[]                  # Low priority
│   ├── scans.npmAudit                  # NPM audit results
│   ├── scans.snyk                      # Snyk results
│   ├── scans.eslintSecurity            # ESLint security
│   └── scans.secretsDetection          # GitLeaks results
│
├── 02-performance-report.json          # Performance analysis
│   ├── metrics.bundleAnalysis          # Bundle size/time
│   ├── metrics.lighthouseScores        # Lighthouse results
│   └── optimizations[]                 # Recommendations
│
├── 03-code-quality-report.json         # Code quality
│   ├── metrics.complexity              # Cyclomatic complexity
│   ├── metrics.testCoverage            # Coverage %
│   ├── metrics.duplication             # Duplication %
│   └── metrics.codeSmells              # Code smells
│
├── 04-architecture-report.json         # Architecture
│   ├── architecture.dependencyGraph    # Module dependencies
│   ├── architecture.circularDependencies[]
│   ├── architecture.designPatterns     # Patterns used
│   └── architecture.scalability        # Scalability issues
│
├── 05-compliance-report.json           # Compliance
│   ├── compliance.wcag                 # Accessibility
│   ├── compliance.gdpr                 # Privacy
│   ├── compliance.apiStandards         # API compliance
│   └── compliance.fedramp              # FedRAMP
│
└── agent-*.log                         # Execution logs

COMPREHENSIVE_REVIEW_REPORT.md          # Final aggregated report
├── Executive Summary
├── Critical Issues (Priority 1)
├── High Priority Issues (Priority 2)
├── Medium Priority Issues (Priority 3)
├── Low Priority Issues (Priority 4)
├── Remediation Timeline
├── Recommendations
└── Appendix (Metrics)
```

## JSON Schema (Each Report)

```json
{
  "agent": "Agent Name",
  "timestamp": "2025-12-02T18:30:00Z",
  "repository": "/path/to/repo",
  "findings": {
    "critical": [
      {
        "category": "security|performance|quality|architecture|compliance",
        "severity": "critical",
        "title": "Issue title",
        "description": "Detailed description",
        "remediation": "How to fix",
        "effort": "X-Y hours",
        "file": "path/to/file",
        "codeExample": "// Code example (optional)"
      }
    ],
    "high": [...],
    "medium": [...],
    "low": [...],
    "info": [...]
  },
  "summary": {
    "totalIssues": 25,
    "criticalCount": 2,
    "highCount": 5,
    "mediumCount": 10,
    "lowCount": 8,
    "infoCount": 0
  },
  "metrics": {
    // Agent-specific metrics
  },
  "remediationTime": "120 hours"
}
```

## Best Practices

### Running Reviews

1. **Frequency:**
   - Before major releases
   - Weekly scheduled scans
   - On pull requests to main/production branches
   - After significant dependency updates

2. **Baseline:**
   - Run initial review to establish baseline
   - Track metrics over time
   - Set improvement targets

3. **Prioritization:**
   - Critical: Fix immediately (security, breaking bugs)
   - High: Fix within sprint (1-2 weeks)
   - Medium: Fix within quarter
   - Low: Technical debt backlog

### Interpreting Results

**Risk Levels:**
- **🔴 High Risk:** >0 critical OR >10 high issues
- **🟠 Moderate Risk:** 1-10 high issues
- **🟡 Low Risk:** Only medium/low issues
- **🟢 No Risk:** Minimal issues

**Coverage Targets:**
- Test Coverage: >80%
- Code Duplication: <10%
- Lighthouse Score: >90
- WCAG Compliance: 100% (no errors)

### Remediation Strategy

**Phase 1: Security & Compliance (Week 1-2)**
- Fix all critical security issues
- Address FedRAMP compliance gaps
- Implement missing security controls

**Phase 2: High Priority (Week 3-4)**
- Resolve high priority vulnerabilities
- Fix major performance issues
- Address accessibility violations

**Phase 3: Medium Priority (Week 5-8)**
- Code quality improvements
- Refactoring for maintainability
- Architecture enhancements

**Phase 4: Low Priority (Ongoing)**
- Code smell cleanup
- Documentation improvements
- Technical debt reduction

## Troubleshooting

### Common Issues

**1. "npm audit finds 0 vulnerabilities" but Snyk finds many**
- Snyk has more comprehensive database
- Some vulnerabilities not in NPM registry yet
- Consider both results

**2. "Lighthouse fails with timeout"**
- App may be slow to load
- Increase timeout in agent script
- Or skip Lighthouse by removing APP_URL

**3. "Agent fails with 'command not found'"**
- Install missing tool globally
- Check PATH environment variable
- Use `which <command>` to verify

**4. "False positives in security scan"**
- Review finding context
- Some patterns may be safe in your context
- Document exceptions in code comments

**5. "Test coverage report not found"**
- Ensure tests run successfully first
- Check for `coverage/` directory
- Configure coverage in package.json

### Debug Mode

Enable verbose logging:
```bash
set -x  # Add to top of agent script
export DEBUG=1
./scripts/review-agents/06-run-all-agents.sh
```

Check individual agent logs:
```bash
tail -f /tmp/fleet-review-results/agent-1-security.log
```

### Performance Optimization

**For Faster Reviews:**
1. Skip optional scans (Lighthouse, pa11y)
2. Run critical agents only (1, 3, 5)
3. Use local execution instead of VM
4. Increase parallel agent count

**For Deeper Analysis:**
1. Add Snyk token for enhanced vulnerability scanning
2. Enable all optional tools
3. Increase timeout values
4. Run on powerful VM (D8s_v3 vs D4s_v3)

## Maintenance

### Update Review Tools

```bash
# Update global npm packages
npm update -g madge jscpd complexity-report lighthouse pa11y

# Update GitLeaks
wget https://github.com/gitleaks/gitleaks/releases/latest/download/gitleaks_linux_x64.tar.gz
tar -xzf gitleaks_linux_x64.tar.gz -C /usr/local/bin/
```

### Update Agent Scripts

```bash
cd /Users/andrewmorton/Documents/GitHub/fleet-local
git pull origin main
chmod +x scripts/review-agents/*.sh
```

### Clean Up Old Results

```bash
# Local
find /tmp/fleet-review-results -type f -mtime +30 -delete

# Azure (old VMs)
az vm list --query "[?tags.Purpose=='CodeReview']" -o table
az vm delete --ids <vm-id> --yes
```

## Security Considerations

### Data Privacy
- Reports may contain code snippets
- Do not commit reports with secrets to git
- Use `.gitignore` to exclude reports
- Sanitize reports before sharing externally

### Access Control
- Azure VM uses SSH keys only (no passwords)
- Keys stored in `~/.ssh/` with 600 permissions
- VM auto-shutdown prevents runaway costs
- Storage account uses private access only

### Secrets Management
- Agents detect but don't expose secrets
- GitLeaks output sanitized in reports
- Snyk token optional (not required)
- Use Azure Key Vault for production tokens

## Support & Contact

For issues or questions:
1. Check `README.md` for common solutions
2. Review agent logs in `/tmp/fleet-review-results/`
3. Consult individual JSON reports for details
4. Open GitHub issue with:
   - Agent logs
   - Error messages
   - System info (`uname -a`, `node -v`)

---

**Document Version:** 1.0
**Last Updated:** December 2, 2025
**Maintained By:** Fleet Development Team
