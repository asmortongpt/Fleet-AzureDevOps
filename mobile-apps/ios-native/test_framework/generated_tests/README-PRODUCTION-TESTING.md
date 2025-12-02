# Fleet Management System - Production Test Suite

This directory contains Playwright end-to-end tests for the Fleet Management System production deployment at `http://68.220.148.2`.

## Quick Start

### Option 1: Manual Authentication (Recommended)

The production app uses authentication (either email/password or Microsoft SSO). The easiest way to run tests is to manually log in once and save your session:

```bash
# Step 1: Run the manual authentication helper
npx playwright test manual-auth.spec.ts --project=chromium --headed --timeout=300000

# This will:
# - Open a browser window
# - Navigate to the production app
# - Wait for you to log in manually (using ANY method that works)
# - Save your authentication state to test-results/auth-state.json
# - Show you which navigation modules were detected

# Step 2: Run the full test suite using your saved authentication
STORAGE_STATE=test-results/auth-state.json npx playwright test --project=chromium

# Or run specific tests:
STORAGE_STATE=test-results/auth-state.json npx playwright test vehicles.spec.ts --project=chromium
```

### Option 2: Automated Authentication (If Credentials Work)

If you have working email/password credentials:

```bash
# Set environment variables
export TEST_USER_EMAIL="your-email@example.com"
export TEST_USER_PASSWORD="your-password"

# Run tests
npx playwright test --project=chromium
```

### Option 3: Test Against Localhost

```bash
# Start the development server
cd ../../../..
npm run dev

# In another terminal, run tests against localhost
BASE_URL=http://localhost:5000 npx playwright test --project=chromium
```

## Test Files

### Core Test Suites

- **vehicles.spec.ts** - Vehicle management module tests (CRUD, search, filters)
- **dispatch.spec.ts** - Dispatch console tests
- **accessibility.spec.ts** - WCAG 2.1 AA compliance tests using axe-core
- **performance.spec.ts** - Core Web Vitals and performance benchmarks
- **component_matrix.spec.ts** - Cross-component integration tests

### Authentication Helpers

- **manual-auth.spec.ts** - Interactive browser session for manual login
- **auth.setup.ts** - Automated authentication (if credentials work)

### Analysis Tools

- **inspect-app-v3.spec.ts** - Production app structure analysis tool

## Configuration

### Environment Variables

```bash
# Production URL (default)
BASE_URL=http://68.220.148.2

# Test credentials (if using automated auth)
TEST_USER_EMAIL=admin@demofleet.com
TEST_USER_PASSWORD=Demo@123

# Saved authentication state
STORAGE_STATE=test-results/auth-state.json
```

### Playwright Config

The `playwright.config.ts` has been configured for production testing with:
- Increased timeouts for network conditions (45s navigation, 20s actions)
- Production URL as default baseURL
- Support for saved authentication state
- Retry logic (1 retry by default)
- Screenshots and videos on failure
- Multiple browser support (Chromium, Firefox, WebKit)

## Common Issues & Solutions

### Issue: "Invalid credentials" error

**Solution:** Use the manual authentication helper:
```bash
npx playwright test manual-auth.spec.ts --project=chromium --headed --timeout=300000
```

Log in using Microsoft SSO or any method that works, then use the saved state for subsequent tests.

### Issue: "Navigation item not found"

The production app may have different module names than expected. To discover the actual navigation structure:

```bash
# Run the app inspection tool
npx playwright test inspect-app-v3.spec.ts --project=chromium

# Check the output for actual navigation items
cat test-results/full-navigation-analysis.json
```

Then update the test files with the correct module names.

### Issue: Tests timing out

Increase timeouts in `playwright.config.ts` or use:
```bash
npx playwright test --timeout=120000  # 2 minutes per test
```

### Issue: Microsoft SSO redirect

The production app redirects to Microsoft SSO. You MUST use manual authentication:

```bash
npx playwright test manual-auth.spec.ts --project=chromium --headed --timeout=300000
```

Complete the Microsoft login process, and the script will save your session.

## Test Execution Examples

### Run all tests with saved authentication
```bash
STORAGE_STATE=test-results/auth-state.json npx playwright test --project=chromium
```

### Run tests in headed mode (see browser)
```bash
STORAGE_STATE=test-results/auth-state.json npx playwright test --project=chromium --headed
```

### Run only accessibility tests
```bash
STORAGE_STATE=test-results/auth-state.json npx playwright test accessibility.spec.ts
```

### Run tests in debug mode
```bash
STORAGE_STATE=test-results/auth-state.json npx playwright test --debug
```

### Run tests with specific browser
```bash
STORAGE_STATE=test-results/auth-state.json npx playwright test --project=firefox
```

### Generate and view HTML report
```bash
STORAGE_STATE=test-results/auth-state.json npx playwright test
npx playwright show-report test-results/html-report
```

## CI/CD Integration

For automated testing in CI/CD pipelines:

1. **Store auth credentials as secrets** in your CI system
2. **Run auth setup first:**
   ```yaml
   - name: Setup authentication
     run: npx playwright test auth.setup.ts
     env:
       TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
       TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
   ```

3. **Run tests with saved state:**
   ```yaml
   - name: Run E2E tests
     run: npx playwright test --project=chromium
     env:
       STORAGE_STATE: test-results/auth-state.json
   ```

## Troubleshooting

### View test artifacts

After a test run:
```bash
# Screenshots
ls test-results/screenshots/

# Videos (on failure)
ls test-results/artifacts/

# Traces (for detailed debugging)
npx playwright show-trace test-results/artifacts/<test-name>/trace.zip
```

### Enable verbose logging

```bash
DEBUG=pw:api npx playwright test
```

### Clear saved authentication

```bash
rm -f test-results/auth-state.json
```

Then re-authenticate using `manual-auth.spec.ts`.

## Success Criteria

The test suite aims for **80%+ pass rate** (98/122 tests):

- ✅ All accessibility tests passing (WCAG 2.1 AA)
- ✅ Core navigation working
- ✅ Vehicle CRUD operations functional
- ✅ Performance within acceptable thresholds
- ✅ No critical console errors

## Support

If tests are failing due to selector mismatches:

1. Run the inspection tool to discover actual structure
2. Check screenshots in `test-results/screenshots/`
3. Review traces for detailed failure analysis
4. Update selectors in `test-helpers.ts` and test files

## Module Name Reference

Based on the Fleet Management app structure, common module names include:
- Dashboard
- Vehicles / Garage / Fleet
- Drivers / People
- Dispatch / Dispatch Console
- GPS Tracking / Live Map
- Maintenance / Predictive Maintenance
- Fuel Management
- Analytics / Reports

Run the inspection tool to discover the exact names used in your deployment.
