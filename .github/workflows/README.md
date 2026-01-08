# GitHub Actions Workflows

## Quality Gate Workflow

**File**: `quality-gate.yml`

### Purpose
Runs comprehensive quality checks on every push and pull request to ensure code quality.

### When It Runs
- Push to `main`, `develop`, `feature/*`, `fix/*` branches
- Pull requests to `main` or `develop`

### Checks
1. TypeScript validation (frontend & API)
2. ESLint code quality
3. Unit tests
4. Code coverage (60% minimum)
5. Security audit
6. Build verification

### Local Testing
```bash
npm run quality-check      # Run all quality checks
npm run pre-push-check     # Run pre-push checks
npm run quality-report     # Generate quality report
```

### Required for Merge
All checks must pass before code can be merged to protected branches.
