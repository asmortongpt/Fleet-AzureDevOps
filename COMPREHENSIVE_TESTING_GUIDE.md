# CTAFleet Comprehensive Testing Guide

## Table of Contents
1. [Overview](#overview)
2. [Test Structure](#test-structure)
3. [Running Tests](#running-tests)
4. [Test Coverage](#test-coverage)
5. [Writing Tests](#writing-tests)
6. [CI/CD Integration](#cicd-integration)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The CTAFleet testing infrastructure provides comprehensive test coverage across all layers of the application:

- **Unit Tests**: Test individual functions and components in isolation
- **Integration Tests**: Test API endpoints and service interactions
- **E2E Tests**: Test complete user workflows from start to finish
- **Mobile Tests**: Test iOS and Android native applications
- **Security Tests**: Test authentication, authorization, and security vulnerabilities
- **Load Tests**: Test system performance under load
- **Accessibility Tests**: Ensure WCAG 2.1 AA compliance

### Test Coverage Goals

- **API**: >80% code coverage (lines, functions, branches, statements)
- **Frontend**: >70% code coverage
- **E2E**: All critical user journeys covered
- **Mobile**: Core functionality and offline sync tested
- **Security**: OWASP Top 10 vulnerabilities addressed

---

## Test Structure

### Directory Structure

```
/home/user/Fleet/
├── api/
│   └── tests/
│       ├── fixtures/          # Test data generators
│       │   └── index.ts
│       ├── helpers/           # Test utilities
│       │   └── test-helpers.ts
│       ├── services/          # Unit tests for services
│       │   ├── vehicle.service.test.ts
│       │   └── maintenance.service.test.ts
│       ├── integration/       # API integration tests
│       │   └── vehicles.api.test.ts
│       ├── security/          # Security tests
│       │   └── authentication.security.test.ts
│       ├── load/              # Load testing scripts
│       │   └── k6-load-test.js
│       └── setup.ts           # Test configuration
├── src/
│   └── tests/
│       ├── components/        # Component unit tests
│       │   └── VehicleCard.test.tsx
│       └── setup.ts           # Frontend test setup
├── e2e/                       # End-to-end tests
│   └── critical-user-journeys.spec.ts
├── mobile-apps/
│   ├── ios-native/
│   │   └── Tests/
│   │       └── FleetAppTests.swift
│   └── android/
│       └── app/src/androidTest/
│           └── FleetAppInstrumentedTests.kt
└── .github/workflows/
    └── comprehensive-test-suite.yml
```

---

## Running Tests

### Prerequisites

```bash
# Install dependencies
npm install

# API dependencies
cd api && npm install

# Install Playwright browsers
npx playwright install --with-deps

# Install k6 for load testing (Linux/Mac)
brew install k6  # Mac
# OR
sudo apt install k6  # Linux
```

### Unit Tests

#### API Unit Tests
```bash
cd api

# Run all unit tests
npm test

# Run specific test file
npm test tests/services/vehicle.service.test.ts

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

#### Frontend Unit Tests
```bash
# Run all frontend unit tests
npm run test:unit

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:unit:watch
```

### Integration Tests

```bash
cd api

# Run all integration tests
npm test tests/integration

# Run specific integration test
npm test tests/integration/vehicles.api.test.ts
```

### E2E Tests

```bash
# Run all E2E tests
npm run test

# Run specific test suite
npm run test:smoke          # Smoke tests
npm run test:main           # Main modules
npm run test:security       # Security tests
npm run test:performance    # Performance tests

# Run with UI
npm run test:ui

# Run headed (visible browser)
npm run test:headed

# Generate report
npm run test:report
```

### Security Tests

```bash
cd api

# Run security test suite
npm test tests/security

# Run npm audit
npm audit

# Check for vulnerabilities
npm audit --audit-level=moderate
```

### Load Tests

```bash
cd api/tests/load

# Run standard load test
k6 run k6-load-test.js

# Run with environment variables
k6 run --env BASE_URL=http://localhost:3000 k6-load-test.js

# Run spike test
k6 run --config spike-test.json k6-load-test.js

# Run soak test (2 hour endurance)
k6 run --config soak-test.json k6-load-test.js

# Output results to file
k6 run --out json=results.json k6-load-test.js
```

### Mobile Tests

#### iOS Tests
```bash
cd mobile-apps/ios-native

# Run unit tests
xcodebuild test \
  -workspace FleetApp.xcworkspace \
  -scheme FleetApp \
  -destination 'platform=iOS Simulator,name=iPhone 15,OS=17.0'

# Run UI tests
xcodebuild test \
  -workspace FleetApp.xcworkspace \
  -scheme FleetAppUITests \
  -destination 'platform=iOS Simulator,name=iPhone 15,OS=17.0'
```

#### Android Tests
```bash
cd mobile-apps/android

# Run unit tests
./gradlew test

# Run instrumented tests (requires emulator or device)
./gradlew connectedAndroidTest

# Run specific test
./gradlew test --tests com.fleet.app.FleetAppInstrumentedTests.testLoginWithValidCredentials
```

---

## Test Coverage

### Viewing Coverage Reports

#### API Coverage
```bash
cd api
npm run test:coverage

# Open HTML report
open coverage/index.html  # Mac
xdg-open coverage/index.html  # Linux
```

#### Frontend Coverage
```bash
npm run test:coverage

# Open HTML report
open coverage/index.html  # Mac
xdg-open coverage/index.html  # Linux
```

### Coverage Thresholds

Coverage thresholds are enforced in CI/CD:

**API (vitest.config.ts)**:
- Lines: 80%
- Functions: 80%
- Branches: 75%
- Statements: 80%

**Frontend (vitest.config.ts)**:
- Lines: 70%
- Functions: 70%
- Branches: 70%
- Statements: 70%

### Improving Coverage

1. Identify uncovered code:
   ```bash
   npm run test:coverage
   # Review HTML report for red/yellow highlighted code
   ```

2. Write tests for uncovered code
3. Re-run coverage to verify improvement

---

## Writing Tests

### API Unit Tests

#### Example: Testing a Service

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createMockVehicle } from '../fixtures';
import { DatabaseTestHelper } from '../helpers/test-helpers';

describe('VehicleService', () => {
  let dbHelper: DatabaseTestHelper;

  beforeEach(async () => {
    dbHelper = new DatabaseTestHelper(testPool);
    await dbHelper.cleanAllTables();
  });

  it('should create a new vehicle', async () => {
    const vehicleData = createMockVehicle();
    const result = await dbHelper.insertTestData('vehicles', vehicleData);

    expect(result[0]).toMatchObject({
      vehicle_number: vehicleData.vehicle_number,
      status: 'active',
    });
  });
});
```

### Frontend Component Tests

#### Example: Testing a React Component

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VehicleCard } from '@/components/VehicleCard';

describe('VehicleCard', () => {
  const mockVehicle = {
    id: 'test-1',
    vehicle_number: 'V-123',
    make: 'Ford',
    model: 'F-150',
  };

  it('should render vehicle information', () => {
    render(<VehicleCard vehicle={mockVehicle} />);
    expect(screen.getByText('V-123')).toBeInTheDocument();
  });

  it('should handle click events', async () => {
    const onEdit = vi.fn();
    render(<VehicleCard vehicle={mockVehicle} onEdit={onEdit} />);

    await userEvent.click(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalledWith(mockVehicle);
  });
});
```

### E2E Tests

#### Example: Testing a User Journey

```typescript
import { test, expect } from '@playwright/test';

test('should complete vehicle creation workflow', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'TestPassword123!');
  await page.click('button[type="submit"]');

  // Navigate to vehicles
  await page.click('text=Vehicles');
  await page.click('button:has-text("Add Vehicle")');

  // Fill form
  await page.fill('input[name="vehicle_number"]', 'V-123');
  await page.fill('input[name="vin"]', '1HGBH41JXMN12345');
  await page.click('button[type="submit"]');

  // Verify success
  await expect(page.locator('text=Vehicle created')).toBeVisible();
});
```

### Security Tests

```typescript
import { describe, it, expect } from 'vitest';
import bcrypt from 'bcrypt';

describe('Password Security', () => {
  it('should hash passwords securely', async () => {
    const password = 'SecurePassword123!';
    const hash = await bcrypt.hash(password, 10);

    expect(hash).not.toBe(password);
    expect(hash.startsWith('$2b$')).toBe(true);
  });

  it('should enforce password complexity', () => {
    const password = 'Password123!';
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*]/.test(password);

    expect(hasUpper && hasLower && hasNumber && hasSpecial).toBe(true);
  });
});
```

---

## CI/CD Integration

### Automated Test Execution

Tests run automatically on:
- **Push** to main, develop, or staging branches
- **Pull requests** to main, develop, or staging
- **Nightly** at 2 AM UTC (full test suite including load tests)
- **Manual trigger** via workflow_dispatch

### GitHub Actions Workflow

The comprehensive test suite includes:

1. **API Unit Tests** (15 min)
2. **Frontend Unit Tests** (15 min)
3. **Integration Tests** (20 min)
4. **E2E Tests** (30 min)
5. **Security Tests** (20 min)
6. **Load Tests** (30 min, nightly only)
7. **iOS Mobile Tests** (45 min)
8. **Android Mobile Tests** (45 min)

### Viewing Test Results

1. Navigate to GitHub Actions tab
2. Click on the workflow run
3. View individual job results
4. Download artifacts for detailed reports

### Required Status Checks

The following tests must pass before merging:
- ✅ API Unit Tests
- ✅ Frontend Unit Tests
- ✅ Integration Tests
- ✅ E2E Tests
- ✅ Security Tests

---

## Best Practices

### General

1. **Write tests first** (TDD approach when possible)
2. **Keep tests independent** - no test should depend on another
3. **Use descriptive test names** - describe what is being tested
4. **One assertion per test** when possible
5. **Clean up after tests** - ensure proper teardown

### API Tests

1. **Use test fixtures** for consistent test data
2. **Mock external services** to avoid flaky tests
3. **Test error cases** in addition to happy paths
4. **Verify database state** after mutations
5. **Use transactions** for test isolation

### Frontend Tests

1. **Test user behavior**, not implementation details
2. **Use accessibility queries** (getByRole, getByLabelText)
3. **Avoid testing library internals**
4. **Mock network requests** with MSW or similar
5. **Test responsive behavior** for different viewports

### E2E Tests

1. **Test critical paths** thoroughly
2. **Keep tests stable** - use reliable selectors
3. **Use page objects** for maintainability
4. **Minimize test interdependence**
5. **Run tests in isolation** when possible

### Mobile Tests

1. **Test offline scenarios** thoroughly
2. **Verify sync behavior** for data conflicts
3. **Test push notifications** and deep links
4. **Verify accessibility** (VoiceOver, TalkBack)
5. **Test on multiple devices** and OS versions

---

## Troubleshooting

### Common Issues

#### Tests Timing Out

```bash
# Increase timeout in test file
test('slow test', async () => {
  // ...
}, { timeout: 60000 }); // 60 second timeout
```

#### Database Connection Errors

```bash
# Verify database is running
docker ps | grep postgres

# Check connection string
echo $TEST_DB_HOST
echo $TEST_DB_PORT
```

#### Playwright Browser Issues

```bash
# Reinstall browsers
npx playwright install --with-deps

# Clear cache
rm -rf ~/.cache/ms-playwright
```

#### Coverage Not Updating

```bash
# Clear coverage cache
rm -rf coverage/
rm -rf .nyc_output/

# Re-run with coverage
npm run test:coverage
```

### Getting Help

1. Check test logs for error messages
2. Review test documentation
3. Search existing issues on GitHub
4. Ask in team Slack channel #engineering-testing
5. Create detailed bug report with:
   - Test command used
   - Full error output
   - Environment details (OS, Node version, etc.)
   - Steps to reproduce

---

## Performance Benchmarks

### Target Metrics

| Test Type | Target Duration | Max Duration |
|-----------|----------------|--------------|
| Unit Test (single) | <100ms | 500ms |
| Integration Test | <1s | 5s |
| E2E Test | <30s | 60s |
| Load Test | 10-30min | 60min |
| Full CI Pipeline | 30min | 60min |

### API Performance Targets

- **95th percentile**: <500ms
- **99th percentile**: <1000ms
- **Error rate**: <1%
- **Throughput**: >1000 requests/sec

### Frontend Performance Targets

- **Time to Interactive**: <3s
- **First Contentful Paint**: <1.5s
- **Largest Contentful Paint**: <2.5s
- **Cumulative Layout Shift**: <0.1

---

## Test Data Management

### Test Fixtures

Use provided fixtures for consistent test data:

```typescript
import { createMockVehicle, createMockUser, createBulkMockData } from '../fixtures';

// Single vehicle
const vehicle = createMockVehicle();

// Multiple vehicles
const vehicles = createBulkMockData(createMockVehicle, 10);

// With overrides
const electricVehicle = createMockVehicle({ fuel_type: 'electric' });
```

### Database Seeding

```bash
# Seed test database
cd api
npm run seed

# Verify seed data
npm run seed:verify
```

---

## Continuous Improvement

### Test Health Metrics

Monitor these metrics weekly:
- Test pass rate (target: >99%)
- Test execution time (target: <30min full suite)
- Code coverage percentage
- Flaky test count (target: 0)
- Test maintenance burden

### Monthly Reviews

1. Review and update test coverage
2. Identify and fix flaky tests
3. Optimize slow tests
4. Update test documentation
5. Review and update fixtures

---

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [k6 Load Testing](https://k6.io/docs/)
- [React Testing Library](https://testing-library.com/react)
- [XCTest Documentation](https://developer.apple.com/documentation/xctest)
- [Espresso Documentation](https://developer.android.com/training/testing/espresso)

---

**Last Updated**: 2025-11-19
**Version**: 1.0.0
**Maintained by**: QA & Engineering Team
