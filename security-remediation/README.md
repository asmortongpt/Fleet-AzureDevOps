# Fleet Security Remediation System

**Automated security vulnerability remediation for production-grade applications**

---

## Overview

This system automatically identifies and fixes security vulnerabilities in the Fleet Management application, including:

- **XSS Protection**: Sanitizes user input and dangerous HTML rendering
- **CSRF Protection**: Adds CSRF tokens to all state-changing operations
- **SQL Injection**: Converts dynamic queries to parameterized format
- **Tenant Isolation**: Ensures all queries are properly scoped to tenants
- **Repository Pattern**: Implements data access layer separation

## Features

✅ **Real Fixes, Not File Checks** - Actually modifies code, not just verifies existence
✅ **AST-Based Transformations** - Uses TypeScript AST for reliable code changes
✅ **Atomic Operations** - Each fix is independent with rollback capability
✅ **Honest Reporting** - No inflated percentages or false claims
✅ **Verification-First** - Tests before marking complete
✅ **Incremental Commits** - Git commit after each verified fix
✅ **Real-time Dashboard** - Monitor progress with auto-refreshing HTML dashboard

## Quick Start

### Prerequisites

```bash
# Required versions
python3 --version  # 3.11+
node --version     # 20+
git --version      # 2.0+
```

### Installation

```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet

# Install Python dependencies
pip3 install -r security-remediation/requirements.txt

# Install Node dependencies (if not already)
npm install

# Make scripts executable
chmod +x security-remediation/master-orchestrator.py
chmod +x security-remediation/agents/*.py
```

### Run Dry-Run (Recommended First)

```bash
# Scan for vulnerabilities without making changes
python3 security-remediation/master-orchestrator.py --phase all --dry-run

# View results
cat security-remediation/reports/remediation-report.json
open security-remediation/reports/progress-dashboard.html
```

### Execute Remediation

```bash
# Phase 1: Critical security fixes (XSS, CSRF, SQL Injection)
python3 security-remediation/master-orchestrator.py --phase 1

# Phase 2: High priority architecture (Tenant Isolation, Repository Pattern)
python3 security-remediation/master-orchestrator.py --phase 2

# Run all phases
python3 security-remediation/master-orchestrator.py --phase all
```

## Architecture

```
security-remediation/
├── master-orchestrator.py          # Main coordinator
├── agents/                         # Remediation agents
│   ├── xss-agent.py               # XSS protection
│   ├── csrf-agent.py              # CSRF protection
│   ├── sql-injection-agent.py     # SQL injection fixes
│   ├── tenant-isolation-agent.py  # Tenant isolation
│   └── repository-generator.py    # Repository pattern
├── scanners/                       # Vulnerability scanners
│   ├── typescript-scanner.ts      # AST-based TS scanning
│   └── sql-scanner.py            # SQL query analysis
├── templates/                      # Code templates
│   └── repository.template.ts    # Repository class
├── tests/                         # Verification tests
│   └── verify-all-fixes.ts       # Comprehensive test suite
├── reports/                       # Generated reports
│   ├── remediation-report.json   # Detailed results
│   └── progress-dashboard.html   # Real-time dashboard
├── DEPLOYMENT_PLAYBOOK.md         # Deployment guide
├── SECURITY_REMEDIATION_ARCHITECTURE.md  # Architecture docs
└── README.md                      # This file
```

## Usage

### Command-Line Options

```bash
python3 security-remediation/master-orchestrator.py [OPTIONS]

Options:
  --phase {1,2,all}          Phase to execute (default: all)
                             1 = Critical (XSS, CSRF, SQL)
                             2 = High Priority (Tenant, Repository)
                             all = Both phases

  --dry-run                  Scan only, do not make changes

  --project-root PATH        Project root directory
                             (default: current directory)

Examples:
  # Dry run all phases
  python3 security-remediation/master-orchestrator.py --phase all --dry-run

  # Execute Phase 1 only
  python3 security-remediation/master-orchestrator.py --phase 1

  # Execute all phases
  python3 security-remediation/master-orchestrator.py --phase all
```

### Individual Agents

You can also run individual agents:

```bash
# XSS Protection Agent
python3 security-remediation/agents/xss-agent.py /path/to/project

# CSRF Protection Agent
python3 security-remediation/agents/csrf-agent.py /path/to/project

# SQL Injection Agent
python3 security-remediation/agents/sql-injection-agent.py /path/to/project

# Add --dry-run flag for scanning only
python3 security-remediation/agents/xss-agent.py /path/to/project --dry-run
```

## What Gets Fixed

### Phase 1: Critical Security (17-19 hours)

#### 1. XSS Protection (~6 hours, ~40 files)

**Before:**
```typescript
<div dangerouslySetInnerHTML={{ __html: userContent }} />
```

**After:**
```typescript
import { sanitizeHtml } from '@/utils/xss-sanitizer';
<div dangerouslySetInnerHTML={{ __html: sanitizeHtml(userContent) }} />
```

#### 2. CSRF Protection (~8 hours, ~171 routes)

**Before:**
```typescript
router.post('/api/vehicles', async (req, res) => {
  // handler logic
});
```

**After:**
```typescript
import { csrfProtection } from '../middleware/csrf';
router.post('/api/vehicles', csrfProtection, async (req, res) => {
  // handler logic
});
```

#### 3. SQL Injection (~3 hours, ~8 files)

**Before:**
```typescript
const query = `${baseQuery} LIMIT ${limit} OFFSET ${offset}`;
const result = await pool.query(query);
```

**After:**
```typescript
const query = `${baseQuery} LIMIT $1 OFFSET $2`;
const result = await pool.query(query, [limit, offset]);
```

### Phase 2: High Priority (26 hours)

#### 4. Tenant Isolation (~10 hours, ~40 files)

**Before:**
```typescript
const query = `SELECT * FROM vehicles WHERE id = $1`;
const result = await pool.query(query, [vehicleId]);
```

**After:**
```typescript
const query = `SELECT * FROM vehicles WHERE id = $1 AND tenant_id = $2`;
const result = await pool.query(query, [vehicleId, req.user.tenantId]);
```

#### 5. Repository Pattern (~16 hours, 22 new files)

Creates 22 missing repository files with proper tenant isolation and parameterized queries.

## Progress Tracking

### Real-Time Dashboard

The system generates a real-time HTML dashboard that auto-refreshes every 5 seconds:

```bash
open security-remediation/reports/progress-dashboard.html
```

**Dashboard Features:**
- Overall progress percentage
- Total tasks / completed / failed / skipped
- Elapsed time
- Fix summary by type (XSS, CSRF, SQL, etc.)
- Detailed results list with status badges

### JSON Report

Detailed results in machine-readable format:

```bash
cat security-remediation/reports/remediation-report.json
```

**Report Contents:**
- Timestamp and elapsed time
- Progress statistics
- Individual fix results
- Error details
- Summary by agent

### Log File

Complete execution log:

```bash
tail -f remediation.log
```

## Verification

### Level 1: Syntax

```bash
# TypeScript compilation
npx tsc --noEmit

# ESLint
npm run lint

# Prettier
npx prettier --check "src/**/*.{ts,tsx}"
```

### Level 2: Unit Tests

```bash
npm test
```

### Level 3: Integration Tests

```bash
# E2E tests
npx playwright test

# Security verification tests
npm test -- security-remediation/tests/verify-all-fixes.ts
```

### Level 4: Manual Review

```bash
# Review XSS fixes
grep -r "dangerouslySetInnerHTML" src/

# Review CSRF protection
grep -r "csrfProtection" api/src/routes/

# Review SQL queries
grep -r "pool.query" api/src/ server/src/
```

## Rollback

### Rollback Single Fix

```bash
git revert <commit-hash>
```

### Rollback Entire Phase

```bash
git revert <phase-start>..<phase-end>
```

### Rollback All Changes

```bash
git reset --hard pre-remediation-<date>
git push origin main --force  # Use with caution
```

## Troubleshooting

### Common Issues

**Issue:** Python module not found

```bash
# Solution: Install dependencies
pip3 install -r security-remediation/requirements.txt
```

**Issue:** TypeScript compilation errors

```bash
# Solution: Rebuild
npm run build
```

**Issue:** Git conflicts

```bash
# Solution: Stash, remediate, then reapply
git stash
python3 security-remediation/master-orchestrator.py --phase all
git stash pop
```

See [DEPLOYMENT_PLAYBOOK.md](./DEPLOYMENT_PLAYBOOK.md) for detailed troubleshooting.

## Azure VM Execution

For long-running remediation, use Azure VM:

```bash
# SSH into Azure VM
ssh azureuser@your-vm-ip

# Clone and setup
git clone https://github.com/andrewmorton/Fleet.git
cd Fleet
npm install

# Run in screen session
screen -S remediation
python3 security-remediation/master-orchestrator.py --phase all
# Ctrl+A, D to detach

# Monitor from local machine
ssh -L 8080:localhost:8080 azureuser@your-vm-ip
# On VM: cd ~/Fleet/security-remediation/reports && python3 -m http.server 8080
# On local: open http://localhost:8080/progress-dashboard.html
```

See [DEPLOYMENT_PLAYBOOK.md](./DEPLOYMENT_PLAYBOOK.md) for complete Azure VM setup.

## Success Criteria

✅ **Phase 1 Complete:**
- 0 dangerouslySetInnerHTML without sanitization
- 100% of POST/PUT/DELETE routes have CSRF protection
- 0 SQL queries with template literals

✅ **Phase 2 Complete:**
- 100% of queries include tenant_id
- 31 repositories exist and in use
- 0 direct database queries in routes

✅ **Production Ready:**
- All tests passing
- Manual security review approved
- Deployed to production
- Monitoring shows no issues

## Performance

### Expected Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| Phase 1 - Critical | 17-19 hours | ~181 fixes |
| Phase 2 - High Priority | 26 hours | ~62 fixes |
| **Total** | **43-45 hours** | **~243 fixes** |

**Note:** This is actual execution time, not calendar time. Agents run sequentially for safety.

### Resource Usage

- **CPU**: Moderate (TypeScript parsing, regex matching)
- **Memory**: ~2-4 GB (AST manipulation)
- **Disk**: ~1 GB (logs, reports, git history)
- **Network**: Minimal (git operations only)

## Contributing

This is an internal security remediation system. For improvements:

1. Create feature branch
2. Test changes thoroughly
3. Update documentation
4. Submit PR with detailed description

## Security

This system modifies production code. Always:

- Run dry-run first
- Review changes before committing
- Test thoroughly before deployment
- Keep backups of original code
- Follow deployment playbook

## License

Internal use only - Capital Tech Alliance

## Support

- **Documentation**: See `SECURITY_REMEDIATION_ARCHITECTURE.md`
- **Deployment**: See `DEPLOYMENT_PLAYBOOK.md`
- **Issues**: Contact Andrew Morton
- **Email**: andrew.m@capitaltechalliance.com

---

**Version:** 1.0
**Last Updated:** 2025-12-04
**Status:** Production-Ready
