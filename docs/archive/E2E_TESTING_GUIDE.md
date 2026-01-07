# E2E Testing Guide - Fleet Management System

## Overview

This guide covers the comprehensive End-to-End (E2E) testing framework for the Fleet Management System using Playwright. Our test suite includes 40+ test scenarios covering all critical user journeys.

## Table of Contents

- [Getting Started](#getting-started)
- [Test Structure](#test-structure)
- [Page Object Models](#page-object-models)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Best Practices](#best-practices)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Fleet Management System running locally or accessible remotely
- Playwright installed (included in devDependencies)

### Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Install system dependencies (Linux only)
npx playwright install-deps
```

### Configuration

The Playwright configuration is located in `playwright.config.ts`. Key settings:

- **Base URL**: `http://localhost:5173` (or set `APP_URL` env variable)
- **Test Directory**: `./tests/e2e`
- **Timeout**: 30 seconds per test
- **Retries**: 2 in CI, 1 locally
- **Workers**: 1 in CI, 4 locally

## Test Structure

### Directory Organization

```
tests/
├── e2e/                           # E2E test files
│   ├── comprehensive-auth.spec.ts
│   ├── comprehensive-vehicles.spec.ts
│   ├── comprehensive-dashboard.spec.ts
│   ├── 00-smoke-tests/           # Critical smoke tests
│   ├── 01-main-modules/          # Core functionality
│   ├── 02-management-modules/    # Management features
│   └── ...
├── page-objects/                  # Page Object Models
│   ├── BasePage.ts
│   ├── LoginPage.ts
│   ├── DashboardPage.ts
│   └── VehiclesPage.ts
├── fixtures/                      # Test fixtures and helpers
└── utils/                         # Test utilities
```

### Test Categories

1. **Smoke Tests** (`00-smoke-tests/`): Quick critical path tests
2. **Main Modules** (`01-main-modules/`): Core features (Dashboard, Fleet, Vehicles)
3. **Management** (`02-management-modules/`): Drivers, Maintenance, Assets
4. **Procurement** (`03-procurement-communication-modules/`): Orders, Communication
5. **Tools** (`04-tools-modules/`): Reports, Analytics, Settings
6. **Workflows** (`05-workflows/`): Multi-step processes
7. **Validation** (`06-form-validation/`): Form and data validation
8. **Accessibility** (`07-accessibility/`): A11y compliance
9. **Performance** (`08-performance/`): Load time, rendering
10. **Security** (`09-security/`): Auth, permissions, XSS
11. **Load Testing** (`10-load-testing/`): Stress and load tests

## Page Object Models

We use the Page Object Model (POM) pattern for maintainable tests. All POMs extend `BasePage`.

### BasePage

The `BasePage` class provides common functionality:

```typescript
import { BasePage } from '../page-objects/BasePage';

class MyPage extends BasePage {
  async goto() {
    await super.goto('/my-page');
  }
}
```

**Common Methods:**
- `goto(path)` - Navigate to a path
- `getByTestId(id)` - Get element by data-testid
- `waitForLoadingToFinish()` - Wait for all loading indicators
- `waitForToast(message)` - Wait for toast notification
- `fill(locator, value)` - Fill form field
- `waitForApiResponse(pattern)` - Wait for API call

### Available Page Objects

- **LoginPage**: Authentication flows
- **DashboardPage**: Main dashboard interactions
- **VehiclesPage**: Vehicle CRUD operations
- **DriversPage**: Driver management (to be implemented)
- **MaintenancePage**: Maintenance tracking (to be implemented)

### Example Usage

```typescript
import { test } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage';
import { VehiclesPage } from '../page-objects/VehiclesPage';

test('create new vehicle', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const vehiclesPage = new VehiclesPage(page);

  await loginPage.goto();
  await loginPage.quickLogin();

  await vehiclesPage.goto();
  await vehiclesPage.createVehicle({
    vin: 'TEST123',
    make: 'Toyota',
    model: 'Camry',
    year: '2023',
  });

  await vehiclesPage.verifyVehicleExists('TEST123');
});
```

## Running Tests

### All Tests

```bash
npm test                    # Run all E2E tests
npm run test:e2e           # Same as above
```

### Specific Categories

```bash
npm run test:smoke          # Smoke tests only
npm run test:main           # Main modules
npm run test:management     # Management features
npm run test:a11y           # Accessibility tests
npm run test:performance    # Performance tests
```

### Specific Test Files

```bash
npm run test:e2e:dashboard  # Dashboard tests
npm run test:e2e:vehicles   # Vehicle tests
npm run test:e2e:drivers    # Driver tests
npm run test:e2e:fuel       # Fuel tracking tests
```

### Browser-Specific

```bash
npm run test:e2e:chromium   # Chromium only
npm run test:e2e:firefox    # Firefox only
npm run test:e2e:webkit     # WebKit (Safari) only
npm run test:e2e:mobile     # Mobile devices
```

### Interactive Mode

```bash
npm run test:ui             # Open Playwright UI
npm run test:headed         # Run with browser visible
npm run test:debug          # Debug mode
```

### Generate Reports

```bash
npm run test:report         # Open HTML report
npm run test:e2e:report     # Same as above
```

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
  });

  test('should do something', async ({ page }) => {
    // Test implementation
  });

  test.afterEach(async ({ page }) => {
    // Cleanup after each test
  });
});
```

### Using Fixtures

```typescript
import { test } from '../fixtures';

test('authenticated test', async ({ authenticatedPage }) => {
  // Already logged in
  await authenticatedPage.goto('/dashboard');
});
```

### Best Practices

1. **Use Page Objects**: Never interact with page directly in tests
2. **Data-testid Selectors**: Prefer `data-testid` over CSS selectors
3. **Wait for Loading**: Always wait for loading indicators to finish
4. **Unique Test Data**: Use timestamps for unique test data
5. **Clean Up**: Delete test data in `afterEach`
6. **Descriptive Names**: Use clear, descriptive test names
7. **Single Assertion**: Test one thing per test (when possible)
8. **Independent Tests**: Tests should not depend on each other

### Accessibility Testing

```typescript
import { injectAxe, checkA11y } from '@axe-core/playwright';

test('should be accessible', async ({ page }) => {
  await page.goto('/vehicles');
  await injectAxe(page);
  await checkA11y(page);
});
```

### Visual Regression

```typescript
test('should match screenshot', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveScreenshot('dashboard.png');
});
```

### API Mocking

```typescript
test('should handle API error', async ({ page }) => {
  await page.route('**/api/vehicles', route => {
    route.fulfill({
      status: 500,
      body: JSON.stringify({ error: 'Server error' }),
    });
  });

  await page.goto('/vehicles');
  await expect(page.locator('[role="alert"]')).toBeVisible();
});
```

## CI/CD Integration

### GitHub Actions

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

### Environment Variables

```bash
APP_URL=http://localhost:5173  # Application URL
API_URL=http://localhost:3000  # API base URL
CI=true                        # CI environment flag
```

## Troubleshooting

### Tests Timing Out

- Increase timeout in `playwright.config.ts`
- Check network conditions
- Verify app is running
- Check for infinite loading states

### Flaky Tests

- Add explicit waits with `waitForLoadState()`
- Use `waitForSelector()` instead of `setTimeout()`
- Check for race conditions
- Disable animations in test environment

### Screenshots Not Matching

- Update screenshots: `npm run test:visual:update`
- Check for dynamic content (dates, times)
- Disable animations
- Use consistent viewport sizes

### Debugging

```bash
# Debug specific test
npx playwright test --debug comprehensive-auth.spec.ts

# Run with browser visible
npm run test:headed

# Slow motion mode
npx playwright test --slow-mo=1000

# Generate trace
npx playwright test --trace on
```

### Common Issues

**Issue**: "page.goto: Target closed"
**Solution**: Check for popup blockers, ensure proper async/await

**Issue**: "Timeout waiting for selector"
**Solution**: Verify element exists, check data-testid, use more specific selectors

**Issue**: "WebSocket connection failed"
**Solution**: Ensure dev server is running, check firewall settings

## Metrics and Coverage

### Current Test Coverage

- **Total Tests**: 40+
- **Auth Tests**: 12
- **Vehicle Tests**: 15
- **Dashboard Tests**: 8
- **Accessibility Tests**: 10
- **Visual Regression Tests**: 5+

### Test Execution Time

- **Smoke Tests**: ~2 minutes
- **Full Suite**: ~15-20 minutes (parallel)
- **Single Browser**: ~8-10 minutes

## Additional Resources

- [Playwright Documentation](https://playwright.dev)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Accessibility Testing](https://playwright.dev/docs/accessibility-testing)

## Support

For questions or issues:
- Check this guide
- Review existing tests for examples
- Consult Playwright documentation
- Ask the team on Slack

---

**Last Updated**: December 31, 2025
**Version**: 1.0.0
