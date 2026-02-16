# Coverage Tracking Quick Start Guide

This guide helps you get started with the Fleet-CTA test coverage tracking system in 5 minutes.

## What You Get

✅ Automated coverage collection on every push
✅ Real-time coverage reports with PR comments
✅ Regression detection and alerts
✅ Visual dashboard with historical trends
✅ Coverage badges for README
✅ Detailed analysis and recommendations

## Quick Setup (First Time)

### 1. No Setup Required!

The coverage tracking system is already configured and will start working automatically on the next push to main or PR.

### 2. Verify Configuration

Check that Vitest coverage is configured:

```bash
# Frontend
npm run test:coverage

# Backend
cd api && npm run test:coverage
```

Both should generate:
- `coverage/index.html` - Interactive report
- `coverage/coverage-summary.json` - Machine-readable summary

### 3. View Your First Report

After the first GitHub Actions run:

1. Go to **Actions** tab in GitHub
2. Select **Coverage Tracking & Reporting** workflow
3. Click the latest run
4. Scroll to **Artifacts** section
5. Download coverage reports

## Using Coverage Tracking Daily

### Check Coverage Locally

Before committing:

```bash
# Frontend coverage
npm run test:coverage

# Backend coverage
cd api && npm run test:coverage
```

Open the HTML report:
```bash
# Frontend
open coverage/index.html

# Backend
open api/coverage/index.html
```

### Improve Coverage

1. **Identify gaps** in the HTML reports
2. **Write tests** for uncovered code
3. **Re-run coverage** to verify improvement
4. **Commit changes** with test files

Example:
```bash
# Run tests and coverage
npm run test:coverage

# Identify what needs tests
node scripts/coverage-analysis.js

# Add tests
# ... write new test files ...

# Verify improvement
npm run test:coverage
```

### Analyze Coverage

Run the analysis script:

```bash
npm run coverage:analyze
```

This shows:
- Current coverage percentage
- Pass/fail status
- Regression detection
- Recommendations

### Track Trends

View coverage trends over time:

```bash
npm run coverage:track
```

Maintains history in:
- `coverage-reports/coverage-history.csv` - Timeline data
- `coverage-reports/coverage-trends.json` - Trend analysis

### Generate Badges

Create coverage badges for README:

```bash
npm run coverage:badge
```

Then add to README.md:
```markdown
## Coverage

![Coverage](./public/badges/coverage.svg)

- ![Frontend Coverage](./public/badges/frontend-coverage.svg) Frontend
- ![Backend Coverage](./public/badges/backend-coverage.svg) Backend
```

### Full Report Suite

Generate all reports at once:

```bash
npm run coverage:report
```

Runs:
1. `test:coverage` - Generates coverage reports
2. `coverage:analyze` - Analyzes metrics
3. `coverage:track` - Tracks trends
4. `coverage:badge` - Creates badges

## GitHub Actions Integration

### PR Comments

When you open a PR, GitHub Actions automatically:

1. Generates coverage for your changes
2. Compares to main branch
3. Posts a comment showing:
   - Frontend coverage metrics
   - Backend coverage metrics
   - Status badges
   - Coverage delta

Example comment:
```
## 📊 Test Coverage Report

### Frontend Coverage
| Metric | Coverage | Status |
|--------|----------|--------|
| Lines | 68.5% | ⚠️ |
| Branches | 65.2% | ⚠️ |
| Functions | 70.1% | ✅ |
| Statements | 68.3% | ⚠️ |
```

### Dashboard

The coverage dashboard is automatically deployed to GitHub Pages showing:

- Current coverage percentages
- Visual progress bars
- Historical trends
- Status badges

**View dashboard:** After first successful run, available at GitHub Pages URL

### Artifacts

Each workflow run uploads:
- `frontend-coverage-report/` - Frontend HTML and LCOV reports
- `backend-coverage-report/` - Backend HTML and LCOV reports
- `coverage-analysis/` - Analysis results
- `coverage-dashboard/` - Dashboard files

Download from GitHub Actions → Coverage Tracking → Artifacts

## Coverage Targets

### Frontend: 70%+

**Focus areas:**
- UI Components (aim for 85%)
- Custom Hooks (aim for 80%)
- Utilities (aim for 75%)
- Pages/Routes (aim for 60%)

### Backend: 60%+

**Focus areas:**
- Security Middleware (aim for 95%)
- API Routes (aim for 85%)
- Services (aim for 70%)
- Utilities (aim for 65%)
- Database Layer (aim for 50%)

## Common Tasks

### "My PR has coverage regression"

Solution:
1. Review the PR comment showing regression
2. Identify which metrics decreased
3. Write tests for new uncovered code
4. Push changes
5. GitHub Actions will re-run and update comment

### "I want to check coverage before committing"

```bash
# Generate coverage report
npm run test:coverage

# Analyze coverage
npm run coverage:analyze

# View HTML report
open coverage/index.html
```

### "I want to see coverage trends"

```bash
# Track coverage over time
npm run coverage:track

# View trends
cat coverage-reports/coverage-trends.txt
```

### "I need to exclude files from coverage"

Edit `vitest.config.ts` or `api/vitest.config.ts`:

```typescript
coverage: {
  exclude: [
    'node_modules/',
    'dist/',
    'src/tests/**',
    'src/mocks/**',  // Add new exclusions here
  ]
}
```

### "Coverage is stuck at a low percentage"

1. Check if tests are running:
   ```bash
   npm test -- --reporter=verbose
   ```

2. Verify test files exist:
   ```bash
   find src -name "*.test.tsx" | wc -l
   ```

3. Review coverage report for uncovered areas:
   ```bash
   open coverage/index.html
   ```

4. Write tests for high-impact code

### "I want to temporarily lower coverage thresholds"

Edit vitest config:

```typescript
thresholds: {
  lines: 50,      // Lowered from 70
  branches: 45,   // Lowered from 70
  functions: 50,  // Lowered from 70
  statements: 50, // Lowered from 70
}
```

> **Warning:** This should be temporary. Increase targets back after fixing coverage.

## Viewing Reports

### HTML Coverage Report

Most detailed, interactive view:

```bash
# Frontend
open coverage/index.html

# Backend
open api/coverage/index.html
```

**Features:**
- Line-by-line coverage highlighting
- Branch coverage details
- Function coverage breakdown
- Statistics summary
- File tree navigation

### JSON Summary

Machine-readable format:

```json
{
  "total": {
    "lines": { "total": 1000, "covered": 700, "pct": 70.0 },
    "branches": { "total": 800, "covered": 560, "pct": 70.0 },
    "functions": { "total": 200, "covered": 140, "pct": 70.0 },
    "statements": { "total": 1000, "covered": 700, "pct": 70.0 }
  }
}
```

### CSV Format

Spreadsheet compatible:

```csv
timestamp,date,frontend_lines,frontend_branches,backend_lines,backend_branches
2025-02-15T10:30:00Z,02/15/2025,70.0,68.5,58.0,52.1
2025-02-16T09:45:00Z,02/16/2025,71.2,69.3,59.5,53.8
```

## Understanding Coverage Metrics

| Metric | Measures | Example |
|--------|----------|---------|
| **Lines** | % of code lines executed | Did every line run? |
| **Branches** | % of if/else paths taken | Did we test both cases? |
| **Functions** | % of functions called | Did we call this function? |
| **Statements** | % of statements executed | Similar to lines |

**Best practice:** Focus on branches (most thorough)

## Dashboard Features

### Real-Time Metrics
Shows current coverage percentage with:
- Color-coded status (green/yellow/red)
- Progress bars towards targets
- Comparison to thresholds

### Coverage Comparison
Side-by-side view of:
- Frontend vs Backend
- Lines vs Branches vs Functions
- Current vs Target

### Historical Trends
Shows coverage over time:
- Improvement rate
- Regression detection
- Trend direction

## Troubleshooting

### Coverage Not Generating

**Problem:** No coverage reports appear

**Solutions:**
```bash
# 1. Check if tests run at all
npm test

# 2. Run with verbose output
npm run test:coverage -- --reporter=verbose

# 3. Check for test files
find src -name "*.test.tsx" | head -5
```

### Low Coverage Percentage

**Problem:** Coverage stuck at 20-30%

**Causes:**
- Few tests written yet
- Test files not being found
- Tests not running
- Code not being imported

**Solution:**
```bash
# Write tests for key files
npm test -- --coverage

# Review what's uncovered
open coverage/index.html
```

### Regression Detected

**Problem:** PR fails due to coverage decrease

**Solution:**
1. Review PR comment
2. Identify decreased metrics
3. Add tests for new code
4. Push changes
5. Comment updates automatically

## Key Files

```
.
├── vitest.config.ts                    # Frontend coverage config
├── api/vitest.config.ts                # Backend coverage config
├── .github/workflows/
│   └── coverage-tracking.yml           # GitHub Actions workflow
├── scripts/
│   ├── coverage-analysis.js            # Analyze coverage
│   ├── track-coverage-trends.js        # Track trends
│   └── generate-coverage-badge.js      # Create badges
├── coverage/                           # Frontend reports (generated)
├── api/coverage/                       # Backend reports (generated)
├── coverage-reports/                   # Analysis & trends (generated)
└── public/
    ├── badges/                         # Coverage badges (generated)
    └── coverage-dashboard/             # Dashboard (generated)
```

## Next Steps

1. ✅ Understand current coverage (run `npm run test:coverage`)
2. ✅ Review coverage targets (70% frontend, 60% backend)
3. ✅ Set up PR comments (automatic via GitHub Actions)
4. ✅ View dashboard (GitHub Pages)
5. 📝 Improve coverage with new tests
6. 📈 Track trends over time
7. 🎯 Aim for higher targets

## Resources

- Full Documentation: [COVERAGE_TRACKING.md](./COVERAGE_TRACKING.md)
- Vitest Docs: https://vitest.dev/config/#coverage
- Istanbul/V8 Coverage: https://istanbul.js.org/
- GitHub Actions: https://docs.github.com/en/actions
- GitHub Pages: https://docs.github.com/en/pages

## Getting Help

**Questions?** Check:
1. This Quick Start guide
2. Full documentation (COVERAGE_TRACKING.md)
3. GitHub Actions workflow results
4. Coverage HTML reports
5. Workflow logs

---

That's it! You now have a complete coverage tracking system. Happy testing! 🚀
