# Playwright Production Testing Guide

## Overview

This guide explains how to use the Playwright CI/CD automation system for testing the Fleet application against the production environment.

## Workflow Configuration

**File:** `.github/workflows/playwright-production.yml`

### Triggers

The workflow automatically runs on:

1. **Pull Requests** - When PRs are opened/updated targeting the `main` branch
   - Only runs if test files or source code changes
   - Posts results as PR comments

2. **Push to Main** - When code is merged to the `main` branch
   - Validates production after deployment

3. **Nightly Schedule** - Every night at 2 AM UTC
   - Catches regressions and monitors production health

4. **Manual Trigger** - On-demand via GitHub Actions UI
   - Allows testing specific suites or browsers
   - Useful for debugging or verification

## Test Execution

### Sharding Strategy

Tests are executed in **3 parallel shards** for faster completion:
- Shard 1: Tests 1-41
- Shard 2: Tests 42-82
- Shard 3: Tests 83-122

**Expected execution time:** ~10-15 minutes (vs 30+ minutes without sharding)

### Test Suites

| Suite | Tests | Description |
|-------|-------|-------------|
| `smoke` | 00-smoke-tests | Critical path validation |
| `main` | 01-main-modules | Core functionality |
| `management` | 02-management-modules | Asset & resource management |
| `procurement` | 03-procurement-communication-modules | Procurement workflows |
| `tools` | 04-tools-modules | Utility modules |
| `workflows` | 05-workflows | End-to-end workflows |
| `validation` | 06-form-validation | Form validation tests |
| `accessibility` | 07-accessibility | A11y compliance |
| `performance` | 08-performance | Performance benchmarks |
| `security` | 09-security | Security tests |
| `load` | 10-load-testing | Load testing |

### Retry Logic

- **1 retry** for flaky tests
- Tests that fail twice are marked as failed
- Helps reduce false negatives from network issues

## Manual Workflow Trigger

### Via GitHub UI

1. Navigate to: https://github.com/asmortongpt/Fleet/actions/workflows/playwright-production.yml
2. Click **"Run workflow"** button (top right)
3. Configure options:
   - **Use workflow from:** `main` (or your branch)
   - **Test suite to run:**
     - `all` (default) - Runs entire test suite
     - `smoke` - Quick smoke tests only
     - `main` - Main modules
     - `management` - Management features
     - `procurement` - Procurement workflows
     - `tools` - Tools modules
     - `workflows` - Complete workflows
     - `validation` - Form validation
     - `accessibility` - A11y tests
     - `performance` - Performance tests
     - `security` - Security tests
     - `load` - Load tests
   - **Browser to test:**
     - `chromium` (default) - Chrome/Edge
     - `firefox` - Firefox
     - `webkit` - Safari
     - `all` - All browsers (slower)
4. Click **"Run workflow"**

### Via GitHub CLI

```bash
# Run all tests
gh workflow run playwright-production.yml

# Run specific test suite
gh workflow run playwright-production.yml \
  -f test_suite=smoke \
  -f browser=chromium

# Run accessibility tests on all browsers
gh workflow run playwright-production.yml \
  -f test_suite=accessibility \
  -f browser=all
```

## Viewing Test Results

### During Execution

1. Go to [Actions](https://github.com/asmortongpt/Fleet/actions)
2. Click on the running workflow
3. View live logs for each shard

### After Completion

#### Test Summary

- Automatically posted to GitHub Step Summary
- Shows pass/fail counts and percentages
- Includes links to artifacts

#### HTML Report

1. Go to workflow run page
2. Scroll to **Artifacts** section
3. Download `playwright-report-merged`
4. Extract and open `index.html` in browser
5. Interactive report with:
   - Test results by file
   - Screenshots on failure
   - Trace viewer integration
   - Video playback

#### PR Comments

On pull requests, a comment is automatically posted with:
- Overall test status (✅ PASSED / ❌ FAILED)
- Test statistics table
- Pass rate percentage
- Links to artifacts

### Test Artifacts

| Artifact | Retention | Description |
|----------|-----------|-------------|
| `playwright-report-merged` | 30 days | Combined HTML report from all shards |
| `test-results-merged` | 30 days | JSON and JUnit XML results |
| `playwright-results-shard-N` | 7 days | Individual shard results |
| `playwright-traces-shard-N` | 7 days | Trace files (on failure) |
| `playwright-videos-shard-N` | 7 days | Test videos (on failure) |

## Troubleshooting

### Test Failures

#### 1. Check Test Logs

View the specific shard that failed:
```
Jobs > Playwright Tests (Shard X) > Run Playwright tests
```

#### 2. Download Trace Files

Traces provide detailed execution timeline:
1. Download `playwright-traces-shard-N` artifact
2. Extract ZIP file
3. Open trace in Playwright:
   ```bash
   npx playwright show-trace trace.zip
   ```

#### 3. Watch Test Videos

Videos show exactly what happened:
1. Download `playwright-videos-shard-N` artifact
2. Watch failed test videos

### Production Server Unavailable

If tests fail with "Production server is not accessible":

1. **Check server status:**
   ```bash
   curl -I http://68.220.148.2
   ```

2. **Verify network connectivity:**
   - GitHub Actions runners use public IPs
   - Check firewall rules allow GitHub IPs
   - Confirm server is running

3. **Review workflow logs:**
   - See "Verify production server availability" step
   - Check which retry attempt failed

### Flaky Tests

If tests pass on retry but fail initially:

1. **Review test code** for timing issues
2. **Add explicit waits** instead of timeouts
3. **Use Playwright locators** with auto-waiting
4. **Update test** to be more resilient

Example fix:
```typescript
// Bad - may fail if slow
await page.click('#submit-button')

// Good - waits for element to be ready
await page.getByRole('button', { name: 'Submit' }).click()
```

## Notification Setup (Optional)

### Slack Notifications

1. Create Slack webhook:
   - Go to Slack App settings
   - Create incoming webhook
   - Copy webhook URL

2. Add GitHub secret:
   ```
   Settings > Secrets and variables > Actions > New repository secret
   Name: SLACK_WEBHOOK_URL
   Value: https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   ```

3. Uncomment Slack notification step in workflow file (lines 397-419)

### Email Notifications

Email notifications are built into GitHub:
- Go to: https://github.com/settings/notifications
- Enable "Actions" notifications
- Choose "Email" as delivery method

## Performance Optimization

### Current Configuration

- **Shards:** 3 (optimal for 122 tests)
- **Workers per shard:** 1 (in CI)
- **Retries:** 1
- **Timeout:** 60s per test
- **Total timeout:** 30 minutes

### Tuning Recommendations

**Add more shards for larger test suites:**
```yaml
matrix:
  shard: [1, 2, 3, 4, 5]  # 5 shards
```

**Increase workers (if stable):**
```yaml
# In playwright.config.ts
workers: process.env.CI ? 2 : 4
```

**Adjust timeouts for slow tests:**
```typescript
test('slow operation', async ({ page }) => {
  test.setTimeout(120000)  // 2 minutes
  // ... test code
})
```

## Best Practices

### Writing Robust Tests

1. **Use semantic selectors:**
   ```typescript
   // Good
   await page.getByRole('button', { name: 'Submit' })
   await page.getByLabel('Email address')

   // Bad
   await page.locator('#btn-123')
   await page.locator('.form-input')
   ```

2. **Wait for state, not time:**
   ```typescript
   // Good
   await page.waitForURL('**/dashboard')
   await expect(page.getByText('Welcome')).toBeVisible()

   // Bad
   await page.waitForTimeout(5000)
   ```

3. **Isolate test data:**
   ```typescript
   test.beforeEach(async ({ page }) => {
     // Create unique test data
     await setupTestData()
   })

   test.afterEach(async ({ page }) => {
     // Clean up
     await cleanupTestData()
   })
   ```

4. **Use test fixtures:**
   ```typescript
   // Create reusable fixtures
   const test = base.extend({
     authenticatedPage: async ({ page }, use) => {
       await login(page)
       await use(page)
     }
   })
   ```

### Maintaining Tests

1. **Run tests locally before pushing:**
   ```bash
   npm run test:smoke
   ```

2. **Update snapshots when UI changes:**
   ```bash
   npm test -- --update-snapshots
   ```

3. **Review failed tests in Trace Viewer:**
   ```bash
   npx playwright show-trace test-results/*/trace.zip
   ```

4. **Monitor test health:**
   - Check nightly test results
   - Address flaky tests promptly
   - Keep coverage above 80%

## Security Considerations

### Secrets Management

- **Never commit credentials** to test files
- Use GitHub Secrets for sensitive data
- Production tests should not modify data

### Production Testing Safety

- Tests run in **read-only mode** against production
- No data modification or deletion
- Use dedicated test accounts (if needed)
- Monitor production during test execution

### Network Security

- Production server must allow GitHub Actions IPs
- Consider using staging environment for write tests
- Rate limiting may affect load tests

## Monitoring & Metrics

### Success Metrics

Track these metrics over time:
- **Pass rate:** Should be >95%
- **Execution time:** Should be <15 minutes
- **Flaky test rate:** Should be <5%
- **Coverage:** Should maintain 80%+

### Dashboard

View test trends:
1. Go to: https://github.com/asmortongpt/Fleet/actions/workflows/playwright-production.yml
2. Check "All workflows" view
3. Filter by branch/status
4. Export data for analysis

## Support

### Getting Help

1. **Check this guide** for common issues
2. **Review workflow logs** for error details
3. **Examine trace files** for test failures
4. **Search GitHub Issues** for similar problems
5. **Open new issue** with:
   - Workflow run URL
   - Error message
   - Steps to reproduce

### Useful Resources

- [Playwright Documentation](https://playwright.dev)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Fleet Testing Documentation](../docs/testing.md)
- [Workflow Run History](https://github.com/asmortongpt/Fleet/actions/workflows/playwright-production.yml)

## Changelog

### v1.0.0 - 2025-11-15

Initial release:
- ✅ Automated production testing
- ✅ Test sharding (3 shards)
- ✅ PR comment integration
- ✅ Artifact retention
- ✅ Retry logic
- ✅ Multiple trigger options
- ✅ Comprehensive reporting
