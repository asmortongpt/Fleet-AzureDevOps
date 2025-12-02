# Fleet Testing - Quick Start Guide

**Agent 5: Test Coverage & QA Specialist**

This is your quick reference for running all test suites in the Fleet Management System.

---

## Prerequisites

```bash
# Install dependencies
npm install

# Install testing tools
cd api && npm install
cd ..

# Install Playwright browsers
npx playwright install --with-deps

# Install k6 (for load testing)
# macOS:
brew install k6

# Linux:
wget https://github.com/grafana/k6/releases/download/v0.47.0/k6-v0.47.0-linux-amd64.tar.gz
tar -xzf k6-v0.47.0-linux-amd64.tar.gz
sudo mv k6-v0.47.0-linux-amd64/k6 /usr/local/bin/

# Windows:
choco install k6
```

---

## Running Tests

### 1. Unit Tests

**Backend Unit Tests:**
```bash
cd api
npm run test:coverage
```
**Expected:** 95%+ coverage
**Duration:** 2-5 minutes

**Frontend Unit Tests:**
```bash
npm run test:unit
```
**Expected:** All tests pass
**Duration:** 1-3 minutes

### 2. Integration Tests

**API Integration Tests:**
```bash
cd api
npm test -- tests/integration
```
**Expected:** All 109 routes tested
**Duration:** 5-10 minutes

### 3. End-to-End Tests

**Smoke Tests (Quick):**
```bash
npm run test:smoke
```
**Expected:** Critical paths work
**Duration:** 2-3 minutes

**Full E2E Suite:**
```bash
npm run test
```
**Expected:** All user workflows pass
**Duration:** 10-15 minutes

**Accessibility Tests:**
```bash
npm run test:a11y
```
**Expected:** WCAG 2.2 AA compliance
**Duration:** 5-7 minutes

**Performance Tests:**
```bash
npm run test:performance
```
**Expected:** Lighthouse score > 90
**Duration:** 5-10 minutes

### 4. Security Tests

**OWASP Top 10 Tests:**
```bash
cd api
npm test -- tests/security/comprehensive-security-test.ts
```
**Expected:** No security vulnerabilities
**Duration:** 3-5 minutes

**OWASP ZAP Scan:**
```bash
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://localhost:5173
```
**Expected:** No critical issues
**Duration:** 10-15 minutes

### 5. Load Tests

**Baseline (100 users):**
```bash
cd api/tests/load
k6 run -e TEST_MODE=baseline -e BASE_URL=http://localhost:3000 k6-comprehensive-load-test.js
```
**Expected:** < 200ms avg response
**Duration:** 22 minutes

**Peak (1000 users):**
```bash
k6 run -e TEST_MODE=peak -e BASE_URL=http://localhost:3000 k6-comprehensive-load-test.js
```
**Expected:** < 500ms avg response
**Duration:** 35 minutes

**Spike Test:**
```bash
k6 run -e TEST_MODE=spike -e BASE_URL=http://localhost:3000 k6-comprehensive-load-test.js
```
**Expected:** Graceful degradation
**Duration:** 17 minutes

---

## All Tests at Once

**Run Everything:**
```bash
./scripts/run-all-tests.sh
```
**Expected:** All tests pass
**Duration:** 30-45 minutes

**Output:** Test reports in `test-reports/`

---

## Generating Tests

### Generate Unit Tests for Services

```bash
cd api
tsx scripts/generate-service-tests.ts
```

**What it does:**
- Analyzes all 106 services
- Generates unit test templates
- Creates tests in `src/__tests__/services/`
- Includes happy path, error cases, validation

**Next steps:**
1. Review generated tests
2. Fill in test data
3. Add assertions
4. Run `npm run test:coverage`

### Generate Integration Tests for Routes

```bash
cd api
tsx scripts/generate-integration-tests.ts
```

**What it does:**
- Analyzes all 109 routes
- Generates integration test templates
- Creates tests in `tests/integration/routes/`
- Includes auth, validation, tenant isolation

**Next steps:**
1. Review generated tests
2. Add test data
3. Configure test database
4. Run `npm test -- tests/integration`

---

## Pre-Commit Hooks

**Setup (One-time):**
```bash
npm install --save-dev husky lint-staged
npx husky install
chmod +x .husky/pre-commit
```

**What runs before each commit:**
1. Lint staged files
2. TypeScript type check
3. Unit tests for changed files
4. Security scan

**Duration:** 10-30 seconds

**Disable temporarily:**
```bash
git commit --no-verify -m "message"
```

---

## CI/CD Pipeline

**Azure DevOps Pipeline:**
- Location: `azure-pipelines/azure-pipelines-testing.yml`
- Triggers: Every push to main/develop
- Duration: 30-45 minutes

**Stages:**
1. Code Quality (5 mins)
2. Security Scan (5 mins)
3. Unit Tests (10 mins)
4. Integration Tests (10 mins)
5. Build (5 mins)
6. Deploy Test (2 mins)
7. Security Testing (10 mins)
8. E2E Tests (15 mins)
9. Load Testing (manual trigger, 60-90 mins)
10. Production Deploy

**Quality Gates:**
- ❌ Fail if coverage < 95%
- ❌ Fail if any tests fail
- ❌ Fail if build fails
- ❌ Fail if security issues

---

## Viewing Reports

### Coverage Reports

**Backend:**
```bash
cd api
npm run test:coverage
open coverage/index.html
```

**Frontend:**
```bash
npm run test:coverage
open coverage/index.html
```

### E2E Test Reports

```bash
npx playwright show-report
```

### Load Test Results

Load test results are printed to console during execution. For detailed metrics:

```bash
k6 run --out json=results.json k6-comprehensive-load-test.js
```

---

## Troubleshooting

### Tests Failing

**1. Clean Install:**
```bash
rm -rf node_modules package-lock.json
npm install
cd api
rm -rf node_modules package-lock.json
npm install
```

**2. Reset Test Database:**
```bash
cd api
npm run db:reset
```

**3. Clear Test Cache:**
```bash
npm run test:clear-cache
```

### Coverage Below Threshold

**Check what's missing:**
```bash
cd api
npm run test:coverage
cat coverage/coverage-summary.json | jq '.total'
```

**Generate missing tests:**
```bash
tsx scripts/generate-service-tests.ts
```

### E2E Tests Timing Out

**Increase timeout:**
```bash
npx playwright test --timeout=60000
```

**Run headed to debug:**
```bash
npm run test:headed
```

### Load Tests Failing

**Reduce concurrent users:**
```bash
k6 run -e TEST_MODE=baseline k6-comprehensive-load-test.js
```

**Check server is running:**
```bash
curl http://localhost:3000/api/health
```

---

## Quick Reference

### Test Commands

| Command | What it does | Duration |
|---------|-------------|----------|
| `npm run lint` | Check code style | 30s |
| `npm run test:unit` | Frontend unit tests | 1-3m |
| `cd api && npm run test:coverage` | Backend unit tests + coverage | 2-5m |
| `npm run test:smoke` | Quick smoke tests | 2-3m |
| `npm run test` | Full E2E suite | 10-15m |
| `npm run test:a11y` | Accessibility tests | 5-7m |
| `./scripts/run-all-tests.sh` | Everything | 30-45m |

### Coverage Thresholds

| Metric | Threshold |
|--------|-----------|
| Lines | 95% |
| Functions | 95% |
| Branches | 90% |
| Statements | 95% |

### Performance Targets

| Metric | Target |
|--------|--------|
| API p95 | < 200ms |
| API p99 | < 500ms |
| Page load | < 2s |
| Lighthouse Performance | 90+ |
| Lighthouse Accessibility | 100 |

---

## Key Files

| File | Purpose |
|------|---------|
| `TEST_COVERAGE_STRATEGY.md` | Complete testing strategy |
| `AGENT_5_COMPREHENSIVE_TESTING_COMPLETE.md` | Full implementation report |
| `api/scripts/generate-service-tests.ts` | Unit test generator |
| `api/scripts/generate-integration-tests.ts` | Integration test generator |
| `api/tests/load/k6-comprehensive-load-test.js` | Load testing suite |
| `api/tests/security/comprehensive-security-test.ts` | Security tests |
| `azure-pipelines/azure-pipelines-testing.yml` | CI/CD pipeline |
| `.husky/pre-commit` | Pre-commit hook |

---

## Support

**Need help?**
- Review full documentation in `TEST_COVERAGE_STRATEGY.md`
- Check implementation report in `AGENT_5_COMPREHENSIVE_TESTING_COMPLETE.md`
- Review test templates in generated test files

**Common Tasks:**

**Add tests for new feature:**
1. Write service code
2. Run `tsx scripts/generate-service-tests.ts`
3. Fill in generated test template
4. Run `npm run test:coverage`

**Fix failing test:**
1. Run test to see error
2. Check test file for what's expected
3. Fix code or update test
4. Re-run test

**Improve coverage:**
1. Run `npm run test:coverage`
2. Check `coverage/index.html`
3. Find uncovered lines
4. Add tests for those lines
5. Re-run coverage

---

**Quick Start Guide - Agent 5**
**Last Updated:** 2025-11-20
**Version:** 1.0
