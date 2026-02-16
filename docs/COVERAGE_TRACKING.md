# Test Coverage Tracking & Reporting

This document describes the comprehensive test coverage tracking system for Fleet-CTA, including metrics collection, GitHub Actions integration, dashboard deployment, and reporting.

## Overview

The coverage tracking system provides:

- **Automated metric collection** on every push to main branch
- **Real-time coverage reports** with detailed breakdowns
- **Regression detection** to prevent coverage decreases
- **GitHub Pages dashboard** for historical trends
- **PR comments** with coverage delta information
- **Email alerts** on significant regressions

## Coverage Targets

### Frontend Coverage Goals

| Metric | Target | Current |
|--------|--------|---------|
| Lines | 70% | - |
| Branches | 70% | - |
| Functions | 70% | - |
| Statements | 70% | - |

**Key Frontend Components to Prioritize:**
- UI Components: 85% (heavily used, critical path)
- Custom Hooks: 80% (logic-heavy, frequent changes)
- Utilities: 75% (foundational code)
- Pages/Routes: 60% (integration level)

### Backend Coverage Goals

| Metric | Target | Current |
|--------|--------|---------|
| Lines | 60% | - |
| Branches | 55% | - |
| Functions | 60% | - |
| Statements | 60% | - |

**Key Backend Components to Prioritize:**
- Security Middleware: 95%+ (auth.ts, rbac.ts, csrf.ts, rate-limit.ts)
- API Routes: 85% (business logic)
- Services: 70% (core functionality)
- Utilities: 65% (supporting code)
- Database Layer: 50% (integration tests)

## How It Works

### 1. Coverage Collection (GitHub Actions)

**Workflow:** `.github/workflows/coverage-tracking.yml`

On every push to main and PR:

1. Frontend coverage is generated via `npm run test:coverage`
2. Backend coverage is generated via `cd api && npm run test:coverage`
3. Both reports are uploaded as artifacts
4. Coverage analysis scripts process the data

### 2. Coverage Analysis

**Scripts:**
- `scripts/coverage-analysis.js` - Analyzes coverage and detects regressions
- `scripts/track-coverage-trends.js` - Maintains historical coverage data
- `scripts/generate-coverage-badge.js` - Creates visual badges

### 3. Dashboard & Reporting

**Features:**
- Real-time coverage metrics display
- Historical trends over time
- File-by-file breakdown
- Regression alerts
- PR comments with coverage delta

## Configuration

### Vitest Configuration

**Frontend (`vitest.config.ts`):**
```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'text-summary', 'json', 'json-summary', 'html', 'lcov', 'csv'],
  reportsDirectory: './coverage',
  thresholds: {
    lines: 70,
    functions: 70,
    branches: 70,
    statements: 70,
  },
  all: true,
  clean: true,
  skipFull: false,
}
```

**Backend (`api/vitest.config.ts`):**
```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'text-summary', 'json', 'json-summary', 'html', 'lcov', 'csv'],
  reportsDirectory: './coverage',
  lines: 80,
  functions: 80,
  branches: 75,
  statements: 80,
  all: true,
  clean: true,
  skipFull: false,
}
```

## Using the Coverage Tracking System

### Generating Coverage Reports Locally

**Frontend:**
```bash
npm run test:coverage
```

Generates reports in `./coverage/` including:
- `index.html` - Interactive HTML report
- `coverage-summary.json` - Machine-readable summary
- `lcov.info` - LCOV format for integration
- `coverage.csv` - Spreadsheet format

**Backend:**
```bash
cd api
npm run test:coverage
```

Generates reports in `./api/coverage/`

### Analyzing Coverage

**View HTML reports:**
```bash
# Frontend
open coverage/index.html

# Backend
open api/coverage/index.html
```

**Run coverage analysis script:**
```bash
node scripts/coverage-analysis.js
```

Generates:
- Console report with visual indicators
- `coverage-reports/coverage-analysis.json` - Detailed analysis
- `coverage-reports/coverage-baseline.json` - Baseline for regression detection

### Tracking Coverage Trends

**Run trend tracking script:**
```bash
node scripts/track-coverage-trends.js
```

Maintains:
- `coverage-reports/coverage-history.csv` - Historical data
- `coverage-reports/coverage-trends.json` - Trend analysis
- `coverage-reports/coverage-trends.txt` - Human-readable trends

### Generating Coverage Badges

**Generate badge SVGs:**
```bash
node scripts/generate-coverage-badge.js
```

Creates:
- `public/badges/coverage.svg` - Overall coverage
- `public/badges/frontend-coverage.svg`
- `public/badges/backend-coverage.svg`
- `public/COVERAGE_BADGES.md` - Markdown for README

**Add to README.md:**
```markdown
## Coverage

![Coverage](./public/badges/coverage.svg)

- ![Frontend](./public/badges/frontend-coverage.svg) Frontend
- ![Backend](./public/badges/backend-coverage.svg) Backend
```

## Dashboard

### Accessing the Dashboard

The coverage dashboard is deployed to GitHub Pages automatically when:
- A push occurs on the main branch
- Coverage reports are generated
- Dashboard build succeeds

**URL:** `https://github.com/pages/andrewmorton/Fleet-CTA/coverage-dashboard/`

### Dashboard Features

- **Real-time metrics** - Current coverage percentages
- **Visual indicators** - Green/yellow/red status badges
- **Coverage comparison** - Frontend vs Backend side-by-side
- **Progress bars** - Visual representation of coverage towards targets
- **Status summary** - Overall pass/fail status
- **Metrics breakdown** - Lines, branches, functions, statements

### Dashboard Data

The dashboard displays:
- Latest coverage metrics from main branch
- Coverage by category (lines, branches, functions)
- Historical trend (if available)
- Time of last update

## Regression Detection

### How It Works

1. Coverage is collected on every push
2. Current metrics are compared to baseline
3. If coverage decreases by >2% in any metric:
   - Regression is detected
   - Workflow fails (if strict mode enabled)
   - PR comment includes regression warning
   - Console output highlights the regression

### Baseline Management

**Baseline file:** `coverage-reports/coverage-baseline.json`

Automatically updated after each successful analysis.

Format:
```json
{
  "timestamp": "2025-02-15T10:30:00Z",
  "frontend": {
    "lines": 65.3,
    "branches": 62.1,
    "functions": 64.8,
    "statements": 65.2
  },
  "backend": {
    "lines": 58.2,
    "branches": 52.5,
    "functions": 59.1,
    "statements": 58.0
  }
}
```

## PR Coverage Comments

When a PR is created, the GitHub Actions workflow:

1. Generates coverage reports for the PR branch
2. Compares to main branch baseline
3. Posts a comment showing:
   - Coverage metrics (lines, branches, functions, statements)
   - Status badges (✅ pass, ⚠️ warning, ❌ fail)
   - Coverage delta vs baseline
   - Download links to detailed reports

Example:
```
## 📊 Test Coverage Report

### Frontend Coverage
| Metric | Coverage | Status |
|--------|----------|--------|
| Lines | 68.5% | ⚠️ |
| Branches | 65.2% | ⚠️ |
| Functions | 70.1% | ✅ |
| Statements | 68.3% | ⚠️ |

### Backend Coverage
| Metric | Coverage | Status |
|--------|----------|--------|
| Lines | 62.1% | ✅ |
| Branches | 58.5% | ✅ |
| Functions | 61.3% | ✅ |
| Statements | 61.8% | ✅ |
```

## GitHub Actions Workflows

### Coverage Tracking Workflow

**File:** `.github/workflows/coverage-tracking.yml`

**Triggers:**
- Every push to main branch
- Every pull request to main branch
- Weekly schedule (Monday 9 AM UTC)

**Jobs:**

1. **collect-coverage** - Generates coverage reports
   - Frontend coverage via Vitest
   - Backend coverage via Vitest
   - Uploads artifacts

2. **analyze-coverage** - Analyzes metrics and detects regressions
   - Processes coverage summaries
   - Calculates metrics
   - Posts PR comments
   - Saves baseline

3. **build-dashboard** - Builds the coverage dashboard
   - Generates HTML dashboard
   - Creates trend data
   - Prepares for GitHub Pages deployment

4. **deploy-dashboard** - Deploys dashboard to GitHub Pages
   - Uploads dashboard files
   - Makes dashboard accessible

5. **summary** - Generates summary report
   - Lists all artifacts
   - Links to dashboard
   - Provides next steps

### Viewing Workflow Results

**GitHub Actions tab:**
1. Go to your repository
2. Click "Actions" tab
3. Select "Coverage Tracking & Reporting" workflow
4. Click the latest run
5. View job results and download artifacts

**Artifacts available:**
- `frontend-coverage-report` - HTML and LCOV reports
- `backend-coverage-report` - HTML and LCOV reports
- `coverage-analysis` - Analysis results and metrics
- `coverage-dashboard` - Dashboard files

## Best Practices

### Adding Tests to Improve Coverage

1. **Identify gaps** - Review HTML coverage reports
   - Look for red/uncovered lines
   - Check branch coverage
   - Review function coverage

2. **Prioritize by risk** - Focus on high-impact code first:
   - Security middleware
   - Core business logic
   - Critical paths

3. **Write meaningful tests:**
   ```typescript
   // Good: Tests specific behavior
   it('should reject invalid JWT tokens', () => {
     const token = 'invalid.token.here';
     expect(() => validateJWT(token)).toThrow();
   });

   // Bad: Generic test that doesn't validate behavior
   it('works', () => {
     expect(validateJWT('token')).toBeDefined();
   });
   ```

4. **Use test data** - Create realistic test scenarios
5. **Cover edge cases** - Test boundaries and error conditions

### Maintaining Coverage

- **Review PRs** for coverage impact
- **Address regressions** immediately
- **Update tests** when code changes
- **Document uncovered code** if necessary
- **Set stretch goals** - Aim higher than minimum targets

### Understanding Coverage Reports

**Coverage types:**

- **Line coverage** - % of lines executed
  - Useful for overall metric
  - Can miss logical branches

- **Branch coverage** - % of conditional branches taken
  - More thorough than line coverage
  - Catches untested conditions

- **Function coverage** - % of functions called
  - Identifies untested modules
  - Less granular than line coverage

- **Statement coverage** - Similar to line coverage
  - Slightly different calculation
  - Usually similar to line coverage

**Best practice:** Focus on branches > lines for quality

## Troubleshooting

### Coverage Report Not Generated

**Problem:** `coverage/coverage-summary.json` not found

**Solutions:**
1. Verify tests are actually running:
   ```bash
   npm run test:coverage -- --reporter=verbose
   ```

2. Check for excluded files:
   - Review `vitest.config.ts` exclude patterns
   - Ensure test files aren't excluded

3. Ensure test files exist:
   ```bash
   find src -name "*.test.tsx" -o -name "*.spec.ts"
   ```

### Coverage Regression Detected

**Problem:** PR fails due to coverage regression

**Solutions:**
1. Add tests for new code
2. Review coverage gap analysis
3. Check for accidentally deleted tests
4. Temporarily lower threshold if refactoring
5. Run `npm run test:coverage` locally to verify

### Dashboard Not Updating

**Problem:** Dashboard shows stale data

**Solutions:**
1. Check GitHub Actions workflow results
2. Verify artifacts are being uploaded
3. Check GitHub Pages settings (should deploy from `/public`)
4. Clear browser cache
5. Wait for workflow to complete (can take 2-3 minutes)

## Advanced Usage

### Custom Coverage Configuration

**Modify thresholds in vitest.config.ts:**
```typescript
thresholds: {
  lines: 80,     // Require 80% line coverage
  functions: 85, // Require 85% function coverage
  branches: 75,  // Require 75% branch coverage
  statements: 80 // Require 80% statement coverage
}
```

### Excluding Files from Coverage

**In vitest.config.ts:**
```typescript
exclude: [
  'node_modules/',
  'dist/',
  '**/*.test.ts',
  '**/*.mock.ts',
  'src/tests/fixtures/**',
]
```

### Generating LCOV Reports

LCOV reports can be integrated with other tools:

```bash
# Frontend
npm run test:coverage -- --reporter=lcov

# Backend
cd api
npm run test:coverage -- --reporter=lcov
```

Then upload to:
- Codecov
- Coveralls
- SonarQube
- etc.

### CI/CD Integration

The coverage workflow integrates with:
- **GitHub Actions** - Automatic execution
- **Pull Requests** - Comments with coverage info
- **GitHub Pages** - Dashboard deployment
- **Artifacts** - Report storage

## Metrics & Targets

### Coverage Metrics Explanation

| Metric | What it measures | Importance |
|--------|------------------|-----------|
| Lines | % of code lines executed | High - basic metric |
| Branches | % of decision branches | Very High - catches missing logic |
| Functions | % of functions called | Medium - identifies untested modules |
| Statements | % of statements executed | High - similar to lines |

### Target Justification

**Frontend 70%+:**
- High user-facing criticality
- Complex component interactions
- UI state management
- Accessibility requirements

**Backend 60%+:**
- Database integration (harder to test)
- External API interactions
- Configuration code
- Non-critical utilities

**Security Middleware 95%+:**
- Authentication/authorization
- CSRF protection
- Rate limiting
- Data validation

## Roadmap

### Phase 1: Foundation ✅
- [x] Vitest coverage configuration
- [x] GitHub Actions workflow
- [x] Coverage analysis scripts
- [x] Badge generation
- [x] GitHub Pages dashboard

### Phase 2: Enhancement (In Progress)
- [ ] Codecov integration
- [ ] Email alerts on regression
- [ ] SonarQube integration
- [ ] Coverage history charts
- [ ] Component-level reports

### Phase 3: Advanced
- [ ] Mutation testing
- [ ] Performance impact analysis
- [ ] Automated test generation recommendations
- [ ] Team dashboard with contributor stats
- [ ] Historical trend predictions

## Resources

- [Vitest Coverage Documentation](https://vitest.dev/config/#coverage)
- [V8 Coverage Provider](https://istanbul.js.org/)
- [LCOV Format](https://github.com/linux-test-project/lcov)
- [Codecov Docs](https://docs.codecov.io/)
- [SonarQube Coverage](https://docs.sonarqube.org/latest/user-guide/coverage/)

## Support

For questions or issues with coverage tracking:

1. Check this documentation
2. Review GitHub Actions workflow runs
3. Check coverage reports in artifacts
4. Review coverage-analysis.json for details
5. Open an issue with coverage tracking tag

## Summary

The comprehensive coverage tracking system provides:

✅ **Automated collection** of coverage metrics on every push
✅ **Real-time reporting** with PR comments and artifacts
✅ **Regression detection** to prevent coverage decreases
✅ **Visual dashboard** deployed to GitHub Pages
✅ **Historical tracking** of coverage trends
✅ **Clear targets** for frontend (70%) and backend (60%)
✅ **Security focus** with 95%+ coverage for middleware

This ensures code quality is maintained and improved over time while keeping the team informed of coverage status and trends.
