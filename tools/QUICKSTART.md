# Fleet Security Orchestrator - Quick Start Guide

**Status:** ✅ Production-Ready
**Build Status:** ✅ Successfully Compiled
**Date:** January 6, 2026

---

## Instant Start (3 Commands)

```bash
# 1. Navigate to Fleet directory
cd /Users/andrewmorton/Documents/GitHub/Fleet

# 2. Run security review
make review

# 3. View results
open tools/orchestrator/artifacts/chief_architect_report.md
```

That's it! Your first security review is complete.

---

## What Just Happened?

The orchestrator just:

1. ✅ Ran **6 security scanners** in parallel
2. ✅ Analyzed **all your code** for vulnerabilities
3. ✅ Normalized and deduplicated findings
4. ✅ Built a dependency graph
5. ✅ Calculated blast radius and risk scores
6. ✅ Generated executive reports

## Review the Artifacts

```bash
cd tools/orchestrator/artifacts

# Executive summary
cat chief_architect_report.md

# Detailed findings (JSON)
cat remediation_backlog.json | jq '.total_findings'

# Risk clusters
cat risk_clusters.json | jq '.[0]'
```

---

## Available Commands

### From Project Root

```bash
# Review Mode - Generate reports
make review

# Autonomous Remediation - Fix issues
make finish

# Individual Scanners
make scan-semgrep
make scan-trivy
make lint
make typecheck
```

### Direct CLI Usage

```bash
cd tools/orchestrator

# Full review
node dist/cli/index.js review

# Autonomous remediation
node dist/cli/index.js finish --max-iterations 10

# Individual scanner
node dist/cli/index.js scan eslint
```

---

## Understanding the Output

### Chief Architect Report

Location: `tools/orchestrator/artifacts/chief_architect_report.md`

Contains:
- **Overall Score** (0-100)
- **Security Posture** (Excellent → Critical)
- **Key Recommendations** (Prioritized action items)
- **Remediation Roadmap** (Phased implementation plan)

### Remediation Backlog

Location: `tools/orchestrator/artifacts/remediation_backlog.json`

JSON structure:
```json
{
  "total_findings": 127,
  "by_severity": {
    "critical": 0,
    "high": 5,
    "medium": 23,
    "low": 99
  },
  "auto_remediable": 45,
  "findings": [ ... ],
  "clusters": [ ... ]
}
```

---

## Configuration

### Quick Config Changes

Edit: `tools/orchestrator/config/production.yml`

```yaml
# Enable/disable scanners
scanners:
  semgrep:
    enabled: true  # Change to false to skip

  eslint:
    enabled: true

# Adjust gate thresholds
gates:
  security:
    max_critical: 0  # No critical issues allowed
    max_high: 0      # No high severity issues allowed

# Auto-fix settings
remediation:
  auto_fix: true
  max_iterations: 10
```

---

## Interpreting Risk Scores

**Risk Score Formula:**
```
risk_score = severity × exploitability × exposure × blast_radius × criticality
```

**Scores:**
- **9.0-10.0**: 🔴 CRITICAL - Immediate action required
- **7.0-8.9**: 🟠 HIGH - Address within 24-48 hours
- **4.0-6.9**: 🟡 MEDIUM - Address within 1 week
- **1.0-3.9**: 🟢 LOW - Address during refactoring
- **0.0-0.9**: ⚪ INFO - Track but not urgent

---

## Common Scenarios

### Scenario 1: Pre-Commit Check

```bash
# Before committing code
make review

# Check for critical issues
grep "critical" tools/orchestrator/artifacts/remediation_backlog.json

# If none, proceed with commit
git add .
git commit -m "Your message"
```

### Scenario 2: Fix All Auto-Fixable Issues

```bash
# Run autonomous remediation (dry run first)
cd tools/orchestrator
node dist/cli/index.js finish --dry-run

# Execute fixes
node dist/cli/index.js finish
```

### Scenario 3: Security Audit for Compliance

```bash
# Generate compliance reports
make review

# Package artifacts
tar -czf security-audit-$(date +%Y%m%d).tar.gz tools/orchestrator/artifacts/

# Submit to security team
# All scanners, risk scores, and remediation plans included
```

---

## Troubleshooting

### "Scanner not found"

**Solution:** Install missing tools

```bash
# macOS
brew install trivy gitleaks
pip3 install semgrep

# Or disable in config
vim tools/orchestrator/config/production.yml
# Set enabled: false for unavailable scanners
```

### "No findings"

**Possible causes:**
1. Code is already clean ✅
2. Scanners not installed (check above)
3. Configuration issue

```bash
# Check scanner availability
semgrep --version
trivy --version
gitleaks version

# Run with verbose logging
LOG_LEVEL=debug npm run review
```

### "Build errors"

```bash
# Rebuild orchestrator
cd tools/orchestrator
npm install
npm run build

# Check for TypeScript errors
npm run typecheck
```

---

## Next Steps

### 1. Review Your First Report

```bash
open tools/orchestrator/artifacts/chief_architect_report.md
```

### 2. Address Critical Issues

Focus on findings with:
- Severity: CRITICAL or HIGH
- Risk Score: > 7.0
- Auto-fixable: true

### 3. Set Up Continuous Monitoring

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/bash
cd /Users/andrewmorton/Documents/GitHub/Fleet
make review
```

### 4. Integrate with CI/CD

GitHub Actions:
```yaml
- name: Security Review
  run: make review

- name: Upload Reports
  uses: actions/upload-artifact@v3
  with:
    name: security-reports
    path: tools/orchestrator/artifacts/
```

---

## Key Features

### ✅ Multi-Scanner Integration
- Semgrep (SAST)
- Trivy (Dependencies)
- Gitleaks (Secrets)
- ESLint (Code Quality)
- TypeScript (Type Safety)
- Playwright/Vitest (Tests)

### ✅ Advanced Analysis
- Dependency graph construction
- Blast radius calculation
- Risk score computation
- Finding clustering

### ✅ Intelligent Reporting
- Executive summaries
- Prioritized backlogs
- Phased remediation roadmaps

### ✅ Production-Grade
- Type-safe TypeScript
- Comprehensive logging
- Error handling
- Audit trails

---

## Support

**Documentation:**
- Full README: `tools/orchestrator/README.md`
- Architecture: `tools/ORCHESTRATOR_SUMMARY.md`
- This guide: `tools/QUICKSTART.md`

**Logs:**
```bash
tail -f tools/orchestrator/logs/orchestrator-*.log
```

**Help Command:**
```bash
cd tools/orchestrator
node dist/cli/index.js --help
```

---

## Success Criteria

You're ready for production when:

- [ ] `make review` runs successfully
- [ ] Chief Architect Report generated
- [ ] Critical findings = 0
- [ ] High findings < 5
- [ ] Test coverage > 80%
- [ ] All scanners enabled and running

---

## Quick Reference Card

| Command | Purpose |
|---------|---------|
| `make review` | Run all scanners + generate reports |
| `make finish` | Autonomous remediation until gates pass |
| `make lint` | ESLint code quality check |
| `make typecheck` | TypeScript validation |
| `make test` | Run all tests |
| `make build-all` | Build app + orchestrator |

**Artifacts Location:** `tools/orchestrator/artifacts/`
**Config Location:** `tools/orchestrator/config/production.yml`
**Logs Location:** `tools/orchestrator/logs/`

---

**🎉 You're all set! Run `make review` to get started.**

---

*Generated by Fleet Security Orchestrator v1.0.0*
*For detailed documentation, see `tools/orchestrator/README.md`*
