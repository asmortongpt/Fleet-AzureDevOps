# Cursor AI - Complete Application Review Guide

## Overview

Cursor is an AI-powered IDE that can provide code reviews, but for a comprehensive review of the entire Fleet Management System, we'll combine multiple tools and approaches.

---

## Option 1: Cursor IDE Review (Quick, 15-30 minutes)

### What Cursor CAN Do

**Strengths**:
- ✅ Review specific files or folders with AI
- ✅ Identify bugs, security issues, performance problems
- ✅ Suggest improvements and refactoring
- ✅ Generate documentation and tests
- ✅ Explain complex code sections
- ✅ Multi-file awareness (with indexed codebase)

**Limitations**:
- ⚠️ Works best on files/folders, not entire large codebases at once
- ⚠️ Context window limits (~200k tokens in best models)
- ⚠️ No automated report generation
- ⚠️ Manual review process

### How to Use Cursor for Fleet Review

**1. Install Cursor**:
```bash
# Download from: https://cursor.sh
# Or via Homebrew:
brew install --cask cursor

# Open Fleet codebase
cd /Users/andrewmorton/Documents/GitHub/fleet-local
cursor .
```

**2. Configure Cursor for Best Results**:
```
Settings → Cursor Settings → Models
- Use: Claude Opus 4 or GPT-4 Turbo
- Enable: Long context mode
- Index: Full codebase
```

**3. Systematic Review Queries**:

**Backend API Review**:
```
Cursor Chat:

"Review the entire backend API in /api directory and provide:
1. Security vulnerabilities (SQL injection, XSS, CSRF, auth issues)
2. Performance bottlenecks
3. Code quality issues
4. Missing error handling
5. Unoptimized database queries
6. API design problems
7. Missing tests

Focus on production-readiness and enterprise security."
```

**Frontend Review**:
```
Cursor Chat:

"Review the React frontend in /src directory and provide:
1. Performance issues (bundle size, lazy loading, memoization)
2. Accessibility problems (WCAG compliance)
3. Security issues (XSS, CSRF protection)
4. Component architecture improvements
5. State management issues
6. Missing PropTypes/TypeScript issues
7. UX/UI best practices violations

Prioritize Core Web Vitals and mobile responsiveness."
```

**Database Schema Review**:
```
Cursor Chat:

"Review the database schema in /api/src/db/schema.ts and migrations:
1. Normalization issues
2. Missing indexes
3. Performance problems
4. Data integrity constraints
5. Missing foreign keys
6. Scalability concerns
7. Migration safety

Focus on production PostgreSQL best practices."
```

**Infrastructure Review**:
```
Cursor Chat:

"Review Kubernetes manifests in /k8s directory:
1. Security issues (privileged containers, secrets management)
2. Resource limits and requests
3. Health checks and probes
4. Network policies
5. RBAC configuration
6. High availability setup
7. Disaster recovery

Focus on production-grade AKS deployment."
```

**4. Generate Review Report**:
```
Cursor Chat:

"Compile all findings into a comprehensive markdown report with:
- Executive summary
- Critical issues (P0)
- High priority issues (P1)
- Medium priority issues (P2)
- Low priority issues (P3)
- Recommendations with code examples
- Estimated remediation time

Save to CURSOR_REVIEW_REPORT.md"
```

---

## Option 2: Azure VM + Autonomous Agents (Recommended, 2-4 hours)

Based on your updated CLAUDE.md instructions, this is the **preferred approach** for comprehensive reviews.

### Architecture

```
Azure VM (Development Environment)
├── Agent 1: Security Auditor
│   ├── OWASP Top 10 scanning
│   ├── Dependency vulnerability scan
│   └── Code security analysis
│
├── Agent 2: Performance Analyzer
│   ├── Backend API profiling
│   ├── Frontend bundle analysis
│   └── Database query optimization
│
├── Agent 3: Code Quality Reviewer
│   ├── ESLint/TypeScript analysis
│   ├── Code complexity metrics
│   └── Test coverage analysis
│
├── Agent 4: Architecture Reviewer
│   ├── Design pattern analysis
│   ├── Scalability assessment
│   └── Technical debt evaluation
│
└── Agent 5: Compliance Checker
    ├── WCAG accessibility
    ├── GDPR/privacy compliance
    └── API standards compliance
```

### Setup Instructions

**1. Deploy Azure Development VM**:
```bash
# Create VM for development tasks
az vm create \
  --resource-group fleet-dev \
  --name fleet-review-vm \
  --image Ubuntu2204 \
  --size Standard_D8s_v3 \
  --admin-username azureuser \
  --generate-ssh-keys \
  --public-ip-sku Standard

# Install Node.js, Docker, kubectl, etc.
ssh azureuser@<vm-ip> << 'EOF'
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git docker.io
sudo usermod -aG docker $USER
EOF
```

**2. Clone Fleet Repository on VM**:
```bash
ssh azureuser@<vm-ip>
git clone https://github.com/asmortongpt/Fleet.git
cd Fleet
npm install
cd api && npm install
```

**3. Deploy Review Agents**:
```bash
# Use Task tool with multiple agents in parallel
# See detailed script below
```

### Agent Deployment Script

Save as: `/Users/andrewmorton/Documents/GitHub/fleet-local/scripts/deploy-review-agents.sh`

```bash
#!/bin/bash
# Deploy autonomous review agents to Azure VM

VM_IP="<your-vm-ip>"
SSH_USER="azureuser"

# Agent 1: Security Auditor
ssh $SSH_USER@$VM_IP << 'EOF'
cd Fleet

# Install security tools
npm install -g snyk eslint-plugin-security npm-audit-html

# Run security scans
echo "=== Security Audit ==="
npm audit --json > security-audit.json
snyk test --json > snyk-report.json
eslint --plugin security api/src > eslint-security.txt

echo "Security scan complete"
EOF

# Agent 2: Performance Analyzer
ssh $SSH_USER@$VM_IP << 'EOF'
cd Fleet

# Install performance tools
npm install -g webpack-bundle-analyzer lighthouse clinic

# Analyze bundle size
npm run build
npx webpack-bundle-analyzer dist/stats.json --report bundle-report.html

# Run Lighthouse
npx lighthouse https://fleet.capitaltechalliance.com \
  --output=html --output-path=lighthouse-report.html

echo "Performance analysis complete"
EOF

# Agent 3: Code Quality Reviewer
ssh $SSH_USER@$VM_IP << 'EOF'
cd Fleet

# Install quality tools
npm install -g eslint @typescript-eslint/eslint-plugin complexity-report

# Run ESLint
npx eslint . --ext .ts,.tsx --format json > eslint-report.json

# TypeScript strict mode check
npx tsc --noEmit --strict > typescript-strict.txt 2>&1

# Complexity analysis
npx complexity-report api/src > complexity-report.txt

echo "Code quality review complete"
EOF

# Agent 4: Architecture Reviewer
ssh $SSH_USER@$VM_IP << 'EOF'
cd Fleet

# Install architecture tools
npm install -g madge dependency-cruiser

# Dependency graph
npx madge --image dependency-graph.png api/src
npx dependency-cruiser --output-type dot api/src | dot -T svg > architecture.svg

# Find circular dependencies
npx madge --circular api/src > circular-deps.txt

echo "Architecture review complete"
EOF

# Agent 5: Compliance Checker
ssh $SSH_USER@$VM_IP << 'EOF'
cd Fleet

# Install compliance tools
npm install -g pa11y-ci axe-cli

# WCAG accessibility scan
npx pa11y-ci --sitemap https://fleet.capitaltechalliance.com/sitemap.xml \
  --json > accessibility-report.json

# Axe accessibility
npx axe https://fleet.capitaltechalliance.com --save axe-report.json

echo "Compliance check complete"
EOF

# Collect all reports
echo "=== Collecting Reports ==="
scp -r $SSH_USER@$VM_IP:~/Fleet/*-report.* ./review-output/

echo "✅ All agents complete! Reports in ./review-output/"
```

**4. Generate Unified Review Report**:

Create: `/Users/andrewmorton/Documents/GitHub/fleet-local/scripts/generate-review-report.py`

```python
#!/usr/bin/env python3
"""
Aggregate all agent reports into unified review document
"""

import json
import os
from datetime import datetime

def load_security_report():
    """Load security audit findings"""
    with open('review-output/security-audit.json') as f:
        return json.load(f)

def load_performance_report():
    """Load performance metrics"""
    with open('review-output/lighthouse-report.json') as f:
        return json.load(f)

def load_code_quality():
    """Load code quality metrics"""
    with open('review-output/eslint-report.json') as f:
        return json.load(f)

def generate_report():
    """Generate unified markdown report"""

    security = load_security_report()
    performance = load_performance_report()
    quality = load_code_quality()

    report = f"""# Fleet Management System - Comprehensive Review
**Date**: {datetime.now().strftime('%Y-%m-%d')}
**Reviewed By**: Autonomous Agent System

---

## Executive Summary

**Overall Health**: {calculate_health_score(security, performance, quality)}/100

**Critical Issues**: {count_critical_issues(security, quality)}
**High Priority**: {count_high_issues(security, quality)}
**Medium Priority**: {count_medium_issues(security, quality)}

---

## Security Assessment

{format_security_findings(security)}

---

## Performance Analysis

{format_performance_findings(performance)}

---

## Code Quality

{format_quality_findings(quality)}

---

## Recommendations

{generate_recommendations(security, performance, quality)}

---

## Remediation Timeline

**Immediate (This Week)**:
- Critical security vulnerabilities
- Performance issues affecting users

**Short-term (This Month)**:
- High priority bugs
- Code quality improvements

**Long-term (This Quarter)**:
- Architecture improvements
- Technical debt reduction

"""

    with open('COMPREHENSIVE_REVIEW_REPORT.md', 'w') as f:
        f.write(report)

    print("✅ Report generated: COMPREHENSIVE_REVIEW_REPORT.md")

if __name__ == '__main__':
    generate_report()
```

---

## Option 3: Hybrid Approach (Best of Both Worlds)

Combine Cursor's interactive review with Azure VM automated scanning:

**Phase 1: Automated Scanning (Azure VM - 2 hours)**
- Deploy all 5 agents on Azure VM
- Run automated security, performance, quality scans
- Generate baseline reports

**Phase 2: Interactive Review (Cursor - 1 hour)**
- Open reports in Cursor
- Use AI to analyze findings
- Prioritize issues
- Generate remediation plan

**Phase 3: Deep Dive (Cursor - 1 hour)**
- Review critical issues with Cursor AI
- Get code fix suggestions
- Validate architecture decisions
- Document best practices

---

## Cursor-Specific Commands for Fleet Review

### Security Review
```
@fleet-local Review security vulnerabilities in the authentication system.
Focus on JWT validation, password hashing, and session management.
```

### Performance Review
```
@fleet-local Analyze performance bottlenecks in the API routes.
Check for N+1 queries, missing indexes, and slow endpoints.
```

### Code Quality Review
```
@fleet-local Review code quality in the vehicle management module.
Look for: code duplication, complex functions, missing tests, type safety issues.
```

### Architecture Review
```
@fleet-local Evaluate the overall architecture and identify technical debt.
Assess scalability, maintainability, and design patterns used.
```

---

## Deliverables

Regardless of approach, you should get:

**1. Security Report**
- OWASP Top 10 compliance
- Dependency vulnerabilities
- Authentication/authorization issues
- Secrets management review

**2. Performance Report**
- API response times
- Database query performance
- Frontend bundle size
- Lighthouse scores
- Core Web Vitals

**3. Code Quality Report**
- ESLint/TypeScript errors
- Complexity metrics
- Test coverage
- Code duplication

**4. Architecture Report**
- Design pattern analysis
- Dependency graph
- Circular dependencies
- Scalability assessment

**5. Compliance Report**
- WCAG accessibility
- GDPR compliance
- API standards
- Security best practices

**6. Remediation Plan**
- Prioritized issue list
- Code fix examples
- Estimated timelines
- Resource requirements

---

## Estimated Timelines

| Approach | Setup | Review | Report | Total |
|----------|-------|--------|--------|-------|
| **Cursor Only** | 10 min | 1-2 hours | 30 min | 2-3 hours |
| **Azure VM Agents** | 30 min | 2-4 hours | 30 min | 3-5 hours |
| **Hybrid** | 30 min | 2-3 hours | 30 min | 3-4 hours |

---

## Cost Analysis

**Cursor**:
- Free (with limits) or $20/month Pro
- No infrastructure costs

**Azure VM Agents**:
- VM cost: ~$1-2 for 4-hour review (Standard_D8s_v3 spot instance)
- Egress: Negligible
- **Total**: ~$2-3 per comprehensive review

**Hybrid**:
- Cursor Pro: $20/month
- Azure VM: $2-3 per review
- **Best value for thorough reviews**

---

## Recommendation

**For Fleet Management System**, I recommend:

**Hybrid Approach**:
1. Deploy 5 autonomous agents on Azure VM for automated scanning
2. Use Cursor for interactive deep-dive on findings
3. Generate comprehensive report with remediation plan

**Timeline**: 3-4 hours
**Cost**: ~$22-23 (Cursor Pro + Azure VM)
**Output**: Production-ready review with actionable insights

This gives you:
- ✅ Automated comprehensive scanning
- ✅ AI-powered analysis of findings
- ✅ Interactive code exploration
- ✅ Prioritized remediation plan
- ✅ Best practices recommendations

---

## Next Steps

1. **Choose Your Approach** (Cursor, Azure VM, or Hybrid)
2. **Setup Environment** (Install Cursor or deploy Azure VM)
3. **Run Review** (Follow scripts and commands above)
4. **Generate Report** (Use provided templates)
5. **Create Remediation Plan** (Prioritize and fix issues)

Would you like me to:
- Deploy the Azure VM agents now?
- Create the review scripts?
- Set up Cursor review queries?
