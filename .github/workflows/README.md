# GitHub Actions Workflows

This directory contains the CI/CD workflows for the Fleet Management System.

## Quality Gate Workflow

**File**: `quality-gate.yml`

This workflow runs comprehensive quality checks on every push and pull request to ensure code quality and prevent regressions.

### When It Runs

- **Push**: On commits to `main`, `develop`, or any `feature/*` or `fix/*` branches
- **Pull Request**: When PRs are created targeting `main` or `develop`

### Jobs

#### 1. Quality Check Job

Runs the core quality validation checks:

**Steps:**
1. Checkout code
2. Setup Node.js 20.x
3. Install dependencies
4. TypeScript type checking (Frontend)
5. TypeScript type checking (API)
6. ESLint code quality validation
7. Run unit tests
8. Generate coverage report
9. Check coverage threshold (60% minimum)
10. Security audit
11. Build verification
12. Upload coverage to Codacy
13. Upload coverage artifacts
14. Upload build artifacts
15. Generate quality gate summary

**Requirements:**
- All TypeScript checks must pass (0 errors)
- ESLint must pass (0 errors)
- All unit tests must pass
- Coverage must be ≥60%
- Build must succeed

#### 2. Complexity Analysis Job

Analyzes code complexity to prevent overly complex functions:

**Steps:**
1. Checkout code
2. Setup Node.js
3. Run complexity analysis (threshold: 10)

**Note:** Currently runs as informational, doesn't block merges

#### 3. E2E Smoke Tests Job

Runs critical end-to-end smoke tests:

**Steps:**
1. Checkout code
2. Setup Node.js
3. Install dependencies
4. Install Playwright browsers
5. Run smoke test suite
6. Upload test results

**Depends On:** Quality Check job must pass first

**Note:** Runs in parallel after quality checks pass

### Artifacts

The workflow generates and stores:

1. **Coverage Report** (30 days retention)
   - lcov.info
   - HTML coverage report
   - JSON coverage summary

2. **Build Output** (7 days retention)
   - Compiled dist/ folder
   - Build manifests

3. **Playwright Report** (30 days retention)
   - E2E test results
   - Screenshots on failures
   - Trace files

### Integration with Codacy

The workflow automatically uploads coverage reports to Codacy for:
- Coverage tracking over time
- Trend analysis
- Pull request annotations
- Quality insights

**Setup Required:**
Add `CODACY_PROJECT_TOKEN` to GitHub repository secrets.

### Required Secrets

| Secret | Description | Required For |
|--------|-------------|--------------|
| `CODACY_PROJECT_TOKEN` | Codacy project token | Coverage upload |

### Status Badges

Add these to README.md:

```markdown
![Quality Gates](https://github.com/CapitalTechHub/Fleet/actions/workflows/quality-gate.yml/badge.svg)
```

### Branch Protection Rules

Configure branch protection to require this workflow:

1. Go to Settings → Branches
2. Add rule for `main`
3. Check "Require status checks to pass before merging"
4. Select:
   - `quality-check`
   - `complexity-analysis`
   - `e2e-smoke-tests`

### Local Testing

Run the same checks locally before pushing:

```bash
# Run all quality checks
npm run quality-check

# Run pre-push checks (includes coverage)
npm run pre-push-check

# Generate quality report
npm run quality-report
```

### Debugging Failed Workflows

1. **TypeScript Errors**: Run `npm run typecheck:all` locally
2. **ESLint Errors**: Run `npm run lint` and fix issues
3. **Test Failures**: Run `npm run test:unit` to reproduce
4. **Coverage Too Low**: Run `npm run test:coverage` and add tests
5. **Build Failure**: Run `npm run build` to see the error

### Performance Optimization

The workflow is optimized for speed:
- Uses npm cache for faster installs
- Runs jobs in parallel where possible
- Only uploads artifacts when needed
- Uses `--legacy-peer-deps` flag for dependency resolution

### Future Enhancements

Planned improvements:
- [ ] Add dependency caching between jobs
- [ ] Implement incremental TypeScript builds
- [ ] Add visual regression testing
- [ ] Integrate security scanning (Snyk/Dependabot)
- [ ] Add performance budgets
- [ ] Implement canary deployments

---

**Last Updated**: 2026-01-07
**Owner**: DevOps Team
**Contact**: andrew.m@capitaltechalliance.com
