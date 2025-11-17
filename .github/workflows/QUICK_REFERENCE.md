# Playwright CI/CD Quick Reference

## Manual Test Trigger

### GitHub UI
```
1. Go to: Actions → Playwright Production Tests
2. Click "Run workflow"
3. Select options → Click "Run workflow"
```

### GitHub CLI
```bash
# All tests
gh workflow run playwright-production.yml

# Specific suite
gh workflow run playwright-production.yml -f test_suite=smoke

# All browsers
gh workflow run playwright-production.yml -f browser=all
```

## View Results

### Live Status
```
Actions → Click workflow run → View job logs
```

### Reports
```
Workflow run → Artifacts → Download "playwright-report-merged"
Extract → Open index.html
```

### PR Comments
```
Automatic comment on PR with test results
```

## Test Locally

```bash
# All tests
npm test

# Specific suites
npm run test:smoke
npm run test:main
npm run test:a11y
npm run test:performance

# UI mode
npm run test:ui

# View report
npm run test:report
```

## Troubleshooting

### Test failed?
1. Check job logs
2. Download trace artifact
3. Run: `npx playwright show-trace trace.zip`

### Server unavailable?
```bash
curl -I http://68.220.148.2
```

### Flaky test?
- Check for timing issues
- Use semantic selectors
- Add explicit waits

## Artifacts

| Name | Retention | Contains |
|------|-----------|----------|
| playwright-report-merged | 30 days | HTML report |
| test-results-merged | 30 days | JSON/XML results |
| playwright-traces-shard-* | 7 days | Debug traces |
| playwright-videos-shard-* | 7 days | Test videos |

## Key Metrics

- Tests run: 122+
- Shards: 3 (parallel)
- Avg time: 10-15 min
- Retries: 1
- Timeout: 30 min max

## URLs

- Workflow: https://github.com/asmortongpt/Fleet/actions/workflows/playwright-production.yml
- Production: http://68.220.148.2
- Full Guide: [PLAYWRIGHT_TESTING_GUIDE.md](./PLAYWRIGHT_TESTING_GUIDE.md)

## Test Suites

| Command | Suite | Description |
|---------|-------|-------------|
| `test:smoke` | 00 | Critical paths |
| `test:main` | 01 | Main modules |
| `test:management` | 02 | Management features |
| `test:procurement` | 03 | Procurement flows |
| `test:tools` | 04 | Tool modules |
| `test:workflows` | 05 | Complete workflows |
| `test:validation` | 06 | Form validation |
| `test:a11y` | 07 | Accessibility |
| `test:performance` | 08 | Performance |
| `test:security` | 09 | Security |
| `test:load` | 10 | Load testing |

## Schedule

- **Pull Requests**: Automatic on PR open/update
- **Push to main**: Automatic on merge
- **Nightly**: 2 AM UTC daily
- **Manual**: Anytime via Actions UI

## Status Badges

```markdown
[![Playwright Tests](https://github.com/asmortongpt/Fleet/actions/workflows/playwright-production.yml/badge.svg)](https://github.com/asmortongpt/Fleet/actions/workflows/playwright-production.yml)
```
