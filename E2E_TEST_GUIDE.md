# Fleet-CTA E2E Testing Guide

## Quick Start

### 1. Ensure Servers are Running

**Terminal 1 - Frontend:**
```bash
npm install --legacy-peer-deps
npm run dev
# Should be accessible at http://localhost:5173
```

**Terminal 2 - Backend:**
```bash
cd api
npm install
npm run dev
# Should be accessible at http://localhost:3001
```

### 2. Run E2E Tests

```bash
# Run all E2E tests
chmod +x run-e2e-tests.sh
./run-e2e-tests.sh --all

# Or use npm directly
npm test:e2e
```

## Comprehensive Testing Guide

### Test Suite Overview

The E2E test suite is organized into 7 major categories with 100+ tests:

```
tests/e2e/
├── helpers/
│   └── test-setup.ts           # Common test utilities
├── 01-authentication-flows.spec.ts     # 20+ auth tests
├── 02-fleet-dashboard-operations.spec.ts # 30+ fleet tests
├── 03-driver-management.spec.ts        # 30+ driver tests
├── 04-reporting-and-export.spec.ts     # 25+ reporting tests
├── 05-mobile-responsive.spec.ts        # 20+ mobile tests
├── 06-error-recovery.spec.ts           # 25+ error tests
├── 07-cross-module-workflows.spec.ts    # 15+ workflow tests
└── README.md                   # Detailed documentation
```

### Test Categories and Coverage

#### 1. Authentication Flows (20+ tests)

Tests user authentication, session management, and form validation.

**Key scenarios:**
- Valid/invalid login attempts
- Session persistence
- Session timeout handling
- Password field validation
- Error message display
- Network error recovery

**Run specific tests:**
```bash
npx playwright test 01-authentication-flows.spec.ts

# Run single test
npx playwright test 01-authentication-flows.spec.ts -g "should accept valid credentials"
```

**Expected results:**
- ✓ Login with valid credentials succeeds
- ✓ Invalid credentials show error
- ✓ Session persists across page reloads
- ✓ Protected routes redirect to login
- ✓ Password visibility toggle works

---

#### 2. Fleet Dashboard Operations (30+ tests)

Tests complete fleet management workflows including vehicles, tracking, and analytics.

**Key scenarios:**
- Vehicle list display and filtering
- Real-time GPS tracking
- Vehicle telemetry data
- Fleet analytics and KPIs
- Data export (CSV, PDF, Excel)
- Sorting and pagination
- Adding new vehicles
- Vehicle health scoring
- Maintenance status tracking
- Fuel consumption analysis

**Run tests:**
```bash
npx playwright test 02-fleet-dashboard-operations.spec.ts
```

**Expected results:**
- ✓ Fleet dashboard loads with vehicle data
- ✓ Vehicles can be filtered by status/location
- ✓ GPS map displays vehicle positions
- ✓ Telemetry data shows in real-time
- ✓ Data exports in multiple formats
- ✓ Analytics charts render correctly

---

#### 3. Driver Management (30+ tests)

Tests complete driver lifecycle including onboarding, performance tracking, and compliance.

**Key scenarios:**
- Driver list and search
- Driver performance metrics
- Safety ratings and violations
- Hours of service compliance
- Vehicle assignment
- Training records
- Document management
- Incident tracking
- Driver comparison
- Performance trends

**Run tests:**
```bash
npx playwright test 03-driver-management.spec.ts
```

**Expected results:**
- ✓ Driver list displays with search
- ✓ Performance metrics visible
- ✓ Safety violations tracked
- ✓ Vehicle assignments shown
- ✓ Documents accessible
- ✓ Incidents logged and displayed

---

#### 4. Reporting and Export (25+ tests)

Tests report generation, scheduling, and export functionality.

**Key scenarios:**
- Report template selection
- Custom report builder
- Field selection and filtering
- Date range specification
- Report preview
- Export in multiple formats
- Scheduled reports
- Report history
- Email distribution
- Report sharing

**Run tests:**
```bash
npx playwright test 04-reporting-and-export.spec.ts
```

**Expected results:**
- ✓ Report templates available
- ✓ Custom reports can be built
- ✓ Reports export as CSV/PDF/Excel
- ✓ Scheduled reports execute
- ✓ Reports can be emailed
- ✓ Report history accessible

---

#### 5. Mobile and Responsive Design (20+ tests)

Tests responsive layout and mobile-specific workflows.

**Key scenarios:**
- Login on mobile devices
- Dashboard on various screen sizes
- Mobile navigation (hamburger menu)
- Touch target sizing (min 44x44px)
- Text sizing and readability
- No horizontal scroll
- Form inputs on mobile
- Orientation changes
- Touch interactions
- Performance on mobile networks

**Run tests:**
```bash
npx playwright test 05-mobile-responsive.spec.ts

# Test on specific device
npx playwright test 05-mobile-responsive.spec.ts -g "iPhone"
```

**Tested viewports:**
- Mobile Small (375×667 - iPhone SE)
- Mobile Medium (390×844 - iPhone 12)
- Mobile Large (428×926 - iPhone Plus)
- Tablet (768×1024 - iPad)
- Tablet Landscape (1024×768)
- Desktop (1920×1080)

**Expected results:**
- ✓ All content visible on mobile without horizontal scroll
- ✓ Touch targets are min 44px
- ✓ Text is readable (≥12px)
- ✓ Forms usable on mobile
- ✓ Navigation accessible
- ✓ Orientation changes handled

---

#### 6. Error Recovery and Resilience (25+ tests)

Tests error handling, network resilience, and graceful degradation.

**Key scenarios:**
- Network timeouts
- API error responses (400, 401, 403, 404, 500, 503)
- Network offline/reconnection
- Form validation errors
- Automatic retry logic
- Session expiration
- Data loading errors
- Empty states
- Error boundaries
- Graceful degradation

**Run tests:**
```bash
npx playwright test 06-error-recovery.spec.ts
```

**Expected results:**
- ✓ Network errors handled gracefully
- ✓ API errors show appropriate messages
- ✓ Failed requests retry automatically
- ✓ Offline state indicated to user
- ✓ Session expiration redirects to login
- ✓ Empty states display properly

---

#### 7. Cross-Module Workflows (15+ tests)

Tests complete end-to-end workflows spanning multiple modules.

**Key scenarios:**
- Complete fleet operations workflow
- Driver management across modules
- Maintenance and service workflows
- Operations and dispatch workflows
- Compliance and safety workflows
- Financial tracking across modules
- Realistic daily operations
- State preservation across navigation

**Run tests:**
```bash
npx playwright test 07-cross-module-workflows.spec.ts
```

**Example workflow tested:**
1. Login
2. View fleet overview
3. Check driver status
4. Review maintenance needs
5. Dispatch operations
6. Generate report
7. Navigate back to fleet

**Expected results:**
- ✓ All modules work together seamlessly
- ✓ Data is consistent across modules
- ✓ Navigation between modules works
- ✓ State preserved across navigation
- ✓ Complete workflows executable without errors

---

## Running Tests with Different Options

### Run All Tests

```bash
# Default - all tests with retries
npx playwright test

# Without retries
npx playwright test --workers=1 --retries=0

# Verbose output
npx playwright test --reporter=list
```

### Run Specific Tests

```bash
# Run single file
npx playwright test 01-authentication-flows.spec.ts

# Run tests matching pattern
npx playwright test -g "should login"

# Run specific test suite
npx playwright test 02-fleet-dashboard-operations.spec.ts -g "Fleet Dashboard"
```

### Debug and Visualization

```bash
# Interactive UI mode
npx playwright test --ui

# Debug mode (pauses on each action)
npx playwright test --debug

# Headed mode (see browser)
npx playwright test --headed

# Headed + verbose
npx playwright test --headed --reporter=list

# Slow motion (500ms between actions)
npx playwright test --headed --slow-mo=500
```

### Browser Selection

```bash
# Chromium only (default)
npx playwright test --project=chromium

# Firefox
npx playwright test --project=firefox

# WebKit (Safari)
npx playwright test --project=webkit

# All browsers
npx playwright test --project=chromium --project=firefox --project=webkit
```

### Parallel Execution

```bash
# Run tests in parallel (default)
npx playwright test

# Run tests serially (1 worker)
npx playwright test --workers=1

# Run with 4 workers
npx playwright test --workers=4
```

## Viewing Test Results

### HTML Report

```bash
# Generate and open report
npx playwright show-report

# Or open directly
open playwright-report/index.html
```

The HTML report shows:
- Test summary (passed, failed, skipped)
- Individual test details
- Screenshots for each test
- Video recordings
- Trace files for debugging

### JSON Results

Located at `test-results/results.json`:

```bash
jq . test-results/results.json  # Pretty print JSON
```

### Videos and Screenshots

Located in `test-results/`:

```bash
ls -la test-results/
# Videos: *.webm files
# Screenshots: *.png files
# Traces: *.zip files
```

## Test Data and Environment

### Default Test Credentials

```
Email: admin@fleet.local
Password: Fleet@2026
Tenant: 8e33a492-9b42-4e7a-8654-0572c9773b71 (if needed)
```

### Database Seeding

Tests use real data from the seeded database. To ensure clean data:

```bash
# Reset and seed database
cd api
npm run db:reset
npm run db:seed

# Or
npm run seed:reset
```

### Environment Variables

Tests use these variables from `.env`:

```
VITE_API_URL=http://localhost:3001
VITE_AZURE_AD_CLIENT_ID=...
VITE_AZURE_AD_TENANT_ID=...
VITE_GOOGLE_MAPS_API_KEY=...
```

## Troubleshooting

### Tests Timeout

**Problem:** Tests timeout waiting for elements or navigation.

**Solutions:**
```bash
# Increase timeout
npx playwright test --timeout=60000

# Run with debug to see what's happening
npx playwright test --debug

# Check if servers are running
curl http://localhost:5173
curl http://localhost:3001/api/health
```

### Authentication Fails

**Problem:** Login tests fail.

**Solutions:**
```bash
# Verify test credentials exist in database
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fleet.local","password":"Fleet@2026"}'

# Clear browser cookies between test runs
# Tests automatically do this, but can manually verify

# Check if auth bypass is enabled for tests
# SKIP_AUTH=true npm run dev
```

### Navigation Issues

**Problem:** Tests can't find menu items or elements.

**Solutions:**
```bash
# Run in headed mode to see what's happening
npx playwright test --headed

# Run specific test with debug
npx playwright test tests/e2e/02-fleet-dashboard-operations.spec.ts --debug

# Check page source for expected elements
npx playwright test --reporter=list  # Verbose output
```

### API Connection Issues

**Problem:** Tests fail with network errors.

**Solutions:**
```bash
# Check backend health
curl http://localhost:3001/api/health

# Check CORS settings
curl -H "Origin: http://localhost:5173" http://localhost:3001/api/health

# Check if database is connected
curl http://localhost:3001/api/vehicles

# Review backend logs
cd api && npm run dev  # Shows logs
```

### Memory Issues

**Problem:** Tests fail due to out-of-memory errors.

**Solutions:**
```bash
# Run fewer workers
npx playwright test --workers=1

# Run specific test file instead of all
npx playwright test 01-authentication-flows.spec.ts

# Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096" npx playwright test
```

## Performance Testing

### Measure Test Duration

```bash
# Tests print duration to console
npx playwright test --reporter=list

# Example output:
# ✓ should accept valid credentials (2.3s)
```

### Identify Slow Tests

```bash
# Run with JSON reporter and analyze
npx playwright test --reporter=json | jq '.suites[].suites[].tests[] | {title, duration}' | sort -k2
```

### Profile Test Execution

```bash
# Run with trace (captures all network/DOM events)
npx playwright test --headed

# Open trace in viewer
npx playwright show-trace test-results/trace.zip
```

## Continuous Integration

Tests are configured for CI in `playwright.config.ts`:

```typescript
retries: process.env.CI ? 2 : 1,
workers: process.env.CI ? 1 : undefined,
```

To run in CI mode locally:

```bash
CI=true npx playwright test
```

## Best Practices

### 1. Test Independence
- Each test should be independent
- Don't rely on test execution order
- Use `test.beforeEach()` for setup

### 2. Waits
```typescript
// ✓ Good - wait for network to settle
await waitForNetworkIdle(page);

// ✗ Bad - arbitrary wait
await page.waitForTimeout(5000);

// ✓ Good - wait for specific element
await expect(element).toBeVisible({ timeout: 5000 });

// ✗ Bad - no timeout
await page.click(selector);
```

### 3. Selectors
```typescript
// ✓ Good - semantic
page.locator('button:has-text("Login")');

// ✓ Good - test ID
page.locator('[data-testid="login-button"]');

// ✗ Bad - brittle
page.locator('div > div > div > button');

// ✗ Bad - index-based
page.locator('button').nth(0);
```

### 4. Error Handling
```typescript
// ✓ Good - handle both success and failure
if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
  await element.click();
}

// ✗ Bad - assumes element exists
await element.click(); // Will fail if not visible
```

### 5. Test Data
```typescript
// ✓ Good - use realistic data
await search(page, '101');  // Real unit number

// ✗ Bad - random/meaningless data
await search(page, 'asdfgh123');
```

## Advanced Usage

### Custom Test Fixtures

Create custom fixtures for common workflows:

```typescript
// fixtures/auth.ts
import { test as base } from '@playwright/test';

export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    await login(page, DEFAULT_CREDENTIALS);
    await use(page);
  },
});

// Usage
test('should load fleet', async ({ authenticatedPage }) => {
  await clickNavMenuItem(authenticatedPage, 'Fleet');
  // ...
});
```

### API Mocking

Mock specific API responses:

```typescript
await page.route('**/api/vehicles', (route) => {
  route.fulfill({
    status: 200,
    body: JSON.stringify({
      data: [{ id: 1, unitNumber: '101' }]
    })
  });
});
```

### Visual Regression Testing

Compare visual appearance:

```typescript
await page.goto('http://localhost:5173/fleet');
await expect(page).toHaveScreenshot('fleet-dashboard.png');
```

## Reporting Issues

When reporting test failures:

1. **Include:**
   - Test name and file
   - Error message/screenshot
   - Browser and version
   - Steps to reproduce
   - Video recording (if available)

2. **Attach:**
   - Test output log
   - Trace file (trace.zip)
   - Screenshot (from test-results/)
   - Video (from test-results/)

3. **Check before reporting:**
   - Servers are running
   - Test credentials are correct
   - Database is seeded
   - Network connectivity OK
   - Run test locally with --debug flag

## Summary

The Fleet-CTA E2E test suite provides comprehensive coverage of all major user workflows with:

- **100+ automated tests** across 7 test suites
- **Real API integration** - tests against actual backend
- **Multiple browsers** - Chromium, Firefox, WebKit support
- **Mobile testing** - responsive design validation
- **Error scenarios** - network, API, and user error handling
- **Cross-module workflows** - end-to-end transaction testing
- **Detailed reporting** - HTML, JSON, JUnit, videos, traces

Tests are designed to be:
- **Reliable** - handle timing, network latency, dynamic content
- **Fast** - parallel execution, network optimization
- **Maintainable** - semantic selectors, reusable helpers
- **Comprehensive** - happy paths + error scenarios
- **Documented** - descriptive names, clear comments

For questions or issues, refer to the troubleshooting section or check server logs.
