# QA Test Execution Playbook
## Fleet Management System - Complete Testing Guide

**Purpose:** Step-by-step instructions for executing the complete test suite
**Audience:** QA Engineers, DevOps Engineers, Release Managers
**Last Updated:** 2025-12-31

---

## Pre-Requisites Checklist

Before starting test execution, ensure:

- [ ] Node.js v22.11.0+ installed
- [ ] Docker Desktop running (for database tests)
- [ ] All dependencies installed: `npm install`
- [ ] Environment variables configured (`.env` file)
- [ ] Production build available: `npm run build`
- [ ] Development server can start: `npm run dev`

---

## Quick Test Execution Commands

### Run Everything (Automated)

```bash
# Complete test suite (takes ~15-20 minutes)
./scripts/run-all-tests.sh

# OR manually:
npm run test:all
```

### Individual Test Suites

```bash
# 1. Unit Tests (5 minutes)
npm run test:unit

# 2. Unit Tests with Coverage (7 minutes)
npm run test:coverage

# 3. E2E Tests (10 minutes)
npm run test:e2e

# 4. Accessibility Tests (3 minutes)
npm run test:a11y

# 5. Security Scan (2 minutes)
npm audit

# 6. Performance Tests (5 minutes)
npm run test:performance
```

---

## Step-by-Step Test Execution

### STEP 1: Unit Tests with Coverage ✅

**Purpose:** Validate business logic, services, and utilities

**Duration:** ~7 minutes

**Commands:**

```bash
cd /Users/andrewmorton/Documents/GitHub/fleet-local

# Fix vitest version mismatch first
npm install --save-dev vitest@4.0.16 --legacy-peer-deps

# Run unit tests with coverage
npm run test:coverage

# View coverage report
open coverage/index.html
```

**Expected Output:**

```
✓ Test Suites: XX passed, XX total
✓ Tests:       XXX passed, XXX total
✓ Coverage:    ≥80% statements, ≥80% branches
```

**Success Criteria:**
- ✅ All unit tests pass (100%)
- ✅ Coverage ≥80% for statements
- ✅ Coverage ≥80% for branches
- ✅ Coverage ≥80% for functions
- ✅ Coverage ≥80% for lines

**Troubleshooting:**

```bash
# If tests fail due to database connection:
export DATABASE_URL="postgresql://test:test@localhost:5432/fleet_test"
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=test postgres:15

# If 3D tests fail:
npm install --save-dev canvas

# If tests timeout:
npm run test:unit -- --timeout=30000
```

**Deliverable:** `coverage/index.html`

---

### STEP 2: E2E Tests with Playwright ⏳

**Purpose:** Validate complete user workflows across all browsers

**Duration:** ~10 minutes

**Setup:**

```bash
# Install Playwright browsers (one-time)
npx playwright install

# Start development server in background
npm run dev &
export DEV_SERVER_PID=$!

# Wait for server to be ready
sleep 5
```

**Commands:**

```bash
# Run full E2E suite with HTML report
npm run test:e2e -- --reporter=html

# OR run individual test groups
npm run test:smoke           # Critical path (2 min)
npm run test:main            # Main modules (3 min)
npm run test:management      # Management features (4 min)
npm run test:workflows       # End-to-end workflows (5 min)
npm run test:validation      # Form validation (2 min)
```

**Cross-Browser Testing:**

```bash
# Test on all browsers (chromium, firefox, webkit)
npm run test:e2e:chromium
npm run test:e2e:firefox
npm run test:e2e:webkit

# Mobile testing
npm run test:e2e:mobile
```

**View Results:**

```bash
# Open HTML report
npm run test:e2e:report

# OR view in terminal
cat playwright-report/index.html
```

**Expected Output:**

```
✓ Smoke Tests:        10/10 passed
✓ Main Modules:       15/15 passed
✓ Management:         20/20 passed
✓ Workflows:          12/12 passed
✓ Validation:         15/15 passed
✓ Security:           12/12 passed
✓ Performance:        8/8 passed
─────────────────────────────────
Total:                92/96 passed (95.8%)
```

**Success Criteria:**
- ✅ ≥95% of tests passing (≥55/59 scenarios)
- ✅ No critical path failures
- ✅ All authentication flows working
- ✅ All CRUD operations functional
- ✅ Cross-browser compatibility confirmed

**Cleanup:**

```bash
# Stop development server
kill $DEV_SERVER_PID
```

**Troubleshooting:**

```bash
# If tests fail to find elements:
npm run test:e2e -- --headed  # See browser actions
npm run test:e2e -- --debug   # Step through tests

# If tests timeout:
npm run test:e2e -- --timeout=60000

# If screenshots/videos needed:
npm run test:e2e -- --reporter=html --screenshot=on --video=on
```

**Deliverables:**
- `playwright-report/index.html`
- `test-results/` (screenshots, videos, traces)

---

### STEP 3: Accessibility Testing ⏳

**Purpose:** Ensure WCAG AAA compliance and screen reader compatibility

**Duration:** ~3 minutes

**Setup:**

```bash
# Ensure dev server is running
npm run dev &
export DEV_SERVER_PID=$!
sleep 5
```

**Commands:**

```bash
# Run axe-core accessibility tests (integrated with Playwright)
npm run test:a11y

# Run pa11y-ci for comprehensive WCAG scan
npm run test:pa11y

# Test single page for quick validation
npm run test:pa11y:single
```

**Test Coverage:**

The accessibility tests will scan:
1. Dashboard (/)
2. Vehicle List (/vehicles)
3. Vehicle Detail (/vehicles/1)
4. Driver Management (/drivers)
5. Fuel Tracking (/fuel)
6. Maintenance (/maintenance)
7. Reports (/reports)
8. Settings (/settings)

**Expected Output:**

```
✓ Dashboard:          0 violations (WCAG AAA)
✓ Vehicle List:       0 violations (WCAG AAA)
✓ Vehicle Detail:     0 violations (WCAG AAA)
✓ Driver Management:  0 violations (WCAG AAA)
...
─────────────────────────────────────────
Total Critical:       0
Total Serious:        0
Total Moderate:       0 (acceptable)
Total Minor:          0 (acceptable)
```

**Success Criteria:**
- ✅ 0 critical accessibility violations
- ✅ 0 serious accessibility violations
- ✅ All interactive elements keyboard accessible
- ✅ All images have alt text
- ✅ Color contrast ratios ≥7:1 (AAA)
- ✅ ARIA labels correct
- ✅ Focus indicators visible

**View Results:**

```bash
# View detailed report
cat pa11y-screenshots/*.json
open test-results/accessibility-report.json
```

**Cleanup:**

```bash
kill $DEV_SERVER_PID
```

**Troubleshooting:**

```bash
# If pa11y fails to connect:
curl http://localhost:5173  # Verify server running

# If tests find violations:
# Review pa11y-screenshots/violations.json
# Fix issues in components
# Re-run: npm run test:a11y
```

**Deliverables:**
- `test-results/accessibility-report.json`
- `pa11y-screenshots/` directory

---

### STEP 4: Security Testing ⏳

**Purpose:** Identify vulnerabilities in dependencies and code

**Duration:** ~5 minutes

**Commands:**

```bash
# npm audit (built-in)
npm audit --json > test-results/security-npm-audit.json
npm audit

# Check for high/critical vulnerabilities
npm audit --audit-level=high

# Attempt auto-fix (review changes first!)
npm audit fix --dry-run
npm audit fix  # If safe

# Run security-focused E2E tests
npm run test:security

# Scan for hardcoded secrets (if git-secrets installed)
git secrets --scan --recursive
```

**Advanced Security Scanning (Optional):**

```bash
# Snyk (if installed)
npx snyk test --json > test-results/security-snyk.json

# OWASP Dependency Check (if installed)
dependency-check --project fleet --scan . --format JSON --out test-results/

# ESLint security plugin
npm run lint -- --config eslint-plugin-security
```

**Expected Output:**

```
✓ 0 vulnerabilities found
✓ All dependencies up to date
✓ No hardcoded secrets detected
✓ XSS protection tests passed
✓ CSRF protection tests passed
✓ SQL injection tests passed
✓ Auth bypass tests passed
```

**Success Criteria:**
- ✅ 0 critical vulnerabilities
- ✅ 0 high vulnerabilities
- ✅ No hardcoded secrets
- ✅ All security E2E tests pass
- ✅ CSP headers configured
- ✅ HTTPS enforced

**Troubleshooting:**

```bash
# If vulnerabilities found:
npm audit fix                    # Auto-fix if possible
npm audit fix --force            # Force fix (may break)
npm update                       # Update to latest compatible
npm outdated                     # Check for updates

# If secrets detected:
# Remove from code, add to .env
# Add patterns to .gitignore
# Use git-secrets pre-commit hook
```

**Deliverables:**
- `test-results/security-npm-audit.json`
- `test-results/security-snyk.json` (if using Snyk)
- `test-results/security-e2e-report.html`

---

### STEP 5: Performance Testing ⏳

**Purpose:** Validate page load times, bundle sizes, and Lighthouse scores

**Duration:** ~5 minutes

**Setup:**

```bash
# Build production bundle first
npm run build

# Start preview server
npm run preview &
export PREVIEW_SERVER_PID=$!
sleep 3
```

**Commands:**

```bash
# Run Lighthouse CI for all pages
npx lhci autorun --config=lighthouse-ci.json

# OR run Lighthouse manually for key pages
npx lighthouse http://localhost:4173 \
  --output=json \
  --output-path=test-results/lighthouse-dashboard.json

npx lighthouse http://localhost:4173/vehicles \
  --output=json \
  --output-path=test-results/lighthouse-vehicles.json

# Run performance-focused E2E tests
npm run test:performance

# Run load testing (map stress test)
npm run test:load:maps
```

**Test Pages:**

1. Dashboard (/)
2. Vehicle List (/vehicles)
3. Vehicle Detail (/vehicles/1)
4. 3D Virtual Garage (/showroom)
5. Reports (/reports)

**Expected Output:**

```
✓ Performance Score:     ≥90 (all pages)
✓ PWA Score:             100
✓ Accessibility Score:   100
✓ Best Practices Score:  ≥95
✓ SEO Score:             ≥95
✓ First Contentful Paint: <1.8s
✓ Largest Contentful Paint: <2.5s
✓ Time to Interactive:   <3.8s
✓ Total Blocking Time:   <200ms
✓ Cumulative Layout Shift: <0.1
```

**Success Criteria:**
- ✅ Performance score ≥90 (all pages)
- ✅ PWA score = 100
- ✅ Accessibility score = 100
- ✅ FCP < 1.8s
- ✅ LCP < 2.5s
- ✅ TTI < 3.8s
- ✅ TBT < 200ms
- ✅ CLS < 0.1
- ✅ Bundle size within budget (lighthouse-budget.json)

**View Results:**

```bash
# Lighthouse HTML reports
open .lighthouseci/*.html

# JSON reports
cat test-results/lighthouse-*.json | jq '.categories.performance.score'
```

**Cleanup:**

```bash
kill $PREVIEW_SERVER_PID
```

**Troubleshooting:**

```bash
# If performance score low:
npm run build:analyze       # Check bundle size
npm run build:report        # Detailed bundle analysis

# If PWA score low:
# Check service worker registration
# Check manifest.json
# Verify HTTPS

# If lighthouse fails:
# Ensure preview server running on port 4173
# Check no other services on port 4173
lsof -i :4173
```

**Deliverables:**
- `.lighthouseci/` reports
- `test-results/lighthouse-*.json`
- `test-results/performance-report.html`

---

### STEP 6: Build Quality Checks ✅

**Purpose:** Validate production build artifacts and configuration

**Duration:** ~3 minutes

**Commands:**

```bash
# Type checking (all code)
npm run typecheck:all

# Linting (with report)
npm run lint
npm run lint:report

# Production build
npm run build

# Build with bundle analysis
npm run build:analyze

# Verify bundle sizes
npm run build:check
```

**Expected Output:**

```
✓ TypeScript: 0 errors
✓ ESLint:     0 errors, 0 warnings
✓ Build:      Success
✓ Bundle:     Within budget
✓ Dist:       Generated successfully
```

**Success Criteria:**
- ✅ TypeScript compiles with 0 errors
- ✅ ESLint reports 0 errors
- ✅ Production build succeeds
- ✅ Bundle sizes within budget
- ✅ No console errors in build log
- ✅ All assets properly hashed

**View Results:**

```bash
# Type check results (terminal output)
npm run typecheck:all

# Lint report
open eslint-report.html

# Bundle analysis
open dist/stats.html

# Build artifacts
ls -lah dist/
```

**Troubleshooting:**

```bash
# If TypeScript errors:
npm run typecheck:all > typescript-errors.log
cat typescript-errors.log

# If build fails:
npm run build 2>&1 | tee build-error.log

# If bundle too large:
npm run build:analyze  # Identify large dependencies
# Consider code splitting or lazy loading
```

**Deliverables:**
- `eslint-report.html`
- `dist/` directory
- `dist/stats.html` (bundle analysis)

---

## Complete Test Report Generation

After completing all test steps, generate consolidated reports:

```bash
# Create test-reports directory
mkdir -p test-reports

# Consolidate all reports
cp coverage/index.html test-reports/coverage-report.html
cp playwright-report/index.html test-reports/e2e-report.html
cp test-results/accessibility-report.json test-reports/
cp test-results/security-npm-audit.json test-reports/
cp .lighthouseci/*.html test-reports/
cp eslint-report.html test-reports/

# Generate summary
cat > test-reports/README.md << 'EOF'
# Test Reports - Fleet Management System

## Report Index

1. [Unit Test Coverage](./coverage-report.html)
2. [E2E Test Results](./e2e-report.html)
3. [Accessibility Report](./accessibility-report.json)
4. [Security Audit](./security-npm-audit.json)
5. [Lighthouse Performance](./lh-report-*.html)
6. [ESLint Report](./eslint-report.html)

## Summary

- **Unit Tests:** PASSED/FAILED
- **E2E Tests:** XX/XX passed (XX%)
- **Accessibility:** 0 critical violations
- **Security:** 0 vulnerabilities
- **Performance:** Score XX/100
- **Build:** SUCCESS

## Sign-Off

- [ ] QA Lead
- [ ] Engineering Lead
- [ ] Product Owner

**Date:** $(date +%Y-%m-%d)
EOF

# Zip all reports
zip -r test-reports-$(date +%Y%m%d).zip test-reports/

echo "✅ All test reports generated!"
echo "📦 Archive: test-reports-$(date +%Y%m%d).zip"
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: QA Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install Dependencies
        run: npm ci

      - name: Run Unit Tests
        run: npm run test:coverage

      - name: Run E2E Tests
        run: |
          npm run build
          npm run test:e2e

      - name: Run Accessibility Tests
        run: npm run test:a11y

      - name: Security Audit
        run: npm audit --audit-level=high

      - name: Lighthouse CI
        run: |
          npm install -g @lhci/cli
          npm run build
          lhci autorun

      - name: Upload Reports
        uses: actions/upload-artifact@v4
        with:
          name: test-reports
          path: test-reports/
```

### Azure Pipelines

```yaml
trigger:
  - main
  - develop

pool:
  vmImage: 'ubuntu-latest'

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: '22.x'

  - script: npm ci
    displayName: 'Install Dependencies'

  - script: npm run test:coverage
    displayName: 'Unit Tests'

  - script: |
      npm run build
      npm run test:e2e
    displayName: 'E2E Tests'

  - script: npm run test:a11y
    displayName: 'Accessibility Tests'

  - script: npm audit
    displayName: 'Security Audit'

  - script: |
      npm run build
      npx lhci autorun
    displayName: 'Performance Tests'

  - task: PublishTestResults@2
    inputs:
      testResultsFormat: 'JUnit'
      testResultsFiles: '**/test-results/*.xml'

  - task: PublishCodeCoverageResults@2
    inputs:
      summaryFileLocation: 'coverage/cobertura-coverage.xml'
```

---

## Test Data Management

### Database Setup for Tests

```bash
# Start PostgreSQL test database
docker run -d \
  --name fleet-test-db \
  -p 5432:5432 \
  -e POSTGRES_USER=fleet_test \
  -e POSTGRES_PASSWORD=test_password \
  -e POSTGRES_DB=fleet_test \
  postgres:15

# Wait for DB to be ready
sleep 5

# Run migrations
export DATABASE_URL="postgresql://fleet_test:test_password@localhost:5432/fleet_test"
npm run db:migrate

# Seed test data
npm run db:seed:test
```

### Redis Setup for Tests

```bash
# Start Redis test instance
docker run -d \
  --name fleet-test-redis \
  -p 6379:6379 \
  redis:7-alpine

# Configure in .env.test
export REDIS_URL="redis://localhost:6379"
```

---

## Troubleshooting Guide

### Common Issues

#### Issue: "Cannot find module" errors

```bash
# Solution 1: Clean install
rm -rf node_modules package-lock.json
npm install

# Solution 2: Clear cache
npm cache clean --force
npm install
```

#### Issue: Tests timeout

```bash
# Solution: Increase timeout
npm run test:unit -- --timeout=60000
npm run test:e2e -- --timeout=90000
```

#### Issue: Port already in use

```bash
# Solution: Kill process on port
lsof -ti:5173 | xargs kill -9
lsof -ti:4173 | xargs kill -9
```

#### Issue: Database connection refused

```bash
# Solution: Restart Docker containers
docker restart fleet-test-db
docker logs fleet-test-db  # Check for errors
```

#### Issue: Playwright browsers not installed

```bash
# Solution: Install browsers
npx playwright install
npx playwright install-deps  # Install system dependencies
```

---

## Best Practices

### Before Running Tests

1. ✅ Pull latest code: `git pull origin main`
2. ✅ Install dependencies: `npm install`
3. ✅ Clean previous build: `rm -rf dist coverage test-results`
4. ✅ Check environment: `cat .env.test`
5. ✅ Verify Docker running: `docker ps`

### During Testing

1. ✅ Monitor resource usage: `top` or `htop`
2. ✅ Watch test output for errors
3. ✅ Take screenshots of failures
4. ✅ Log issues in test tracking system

### After Testing

1. ✅ Review all reports thoroughly
2. ✅ Document failures with reproduction steps
3. ✅ Create GitHub issues for blockers
4. ✅ Archive test reports
5. ✅ Update test documentation

---

## Quick Reference

### Essential Commands

```bash
# Full test suite
npm run test:all

# Unit tests only
npm run test:unit

# E2E tests only
npm run test:e2e

# Quick smoke test
npm run test:smoke

# Coverage report
npm run test:coverage

# Accessibility scan
npm run test:a11y

# Security audit
npm audit

# Performance test
npm run test:performance

# View Playwright report
npm run test:e2e:report

# Clean everything
rm -rf coverage test-results playwright-report dist node_modules
npm install
```

### File Locations

- **Test Files:** `tests/`, `src/**/__tests__/`, `api/tests/`
- **Reports:** `test-reports/`, `coverage/`, `playwright-report/`
- **Config:** `playwright.config.ts`, `vitest.config.ts`, `lighthouse-ci.json`
- **Logs:** `/tmp/unit-test-results.log`

---

## Contact & Support

**QA Team:** qa@capitaltechalliance.com
**DevOps Team:** devops@capitaltechalliance.com
**Documentation:** See `TEST_RESULTS.md` and `QUALITY_GATE_STATUS.md`

---

**Playbook Version:** 1.0
**Last Updated:** 2025-12-31
**Maintained By:** QA Automation Team
