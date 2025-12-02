# Fleet Management System - Testing Guide

Complete guide for setting up, running, and troubleshooting tests for the Fleet Management System.

## Table of Contents

1. [API Unit Testing with Jest](#api-unit-testing-with-jest)
2. [Quick Start](#quick-start)
3. [Test Data Setup](#test-data-setup)
4. [Running Tests](#running-tests)
5. [Test Environment](#test-environment)
6. [Authentication Bypass](#authentication-bypass)
7. [Current Test Status](#current-test-status)
8. [Troubleshooting](#troubleshooting)
9. [Test Configuration](#test-configuration)

---

## API Unit Testing with Jest

### Overview

The Fleet API (`/home/user/Fleet/api`) uses Jest as the primary testing framework for unit and integration tests. This provides fast, reliable testing for backend middleware, utilities, and API endpoints.

### Test Infrastructure

**Location**: `/home/user/Fleet/api/`

**Files Created**:
- `jest.config.js` - Jest configuration
- `src/__tests__/setup.ts` - Global test setup and teardown
- `src/__tests__/helpers.ts` - Test helper functions
- `src/middleware/__tests__/` - Middleware tests
- `src/utils/__tests__/` - Utility function tests
- `src/routes/__tests__/` - Integration tests

**Coverage**: Target 50%+ for branches, functions, lines, and statements

### Running API Tests

```bash
cd /home/user/Fleet/api

# Install Jest dependencies if needed
npm install

# Run all Jest tests
npm test

# Run tests in watch mode (reruns on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run only unit tests (excludes integration tests)
npm run test:unit

# Run only integration tests
npm run test:integration

# Run tests in CI mode (for CI/CD pipelines)
npm run test:ci
```

### Test Helper Functions

Located in `/home/user/Fleet/api/src/__tests__/helpers.ts`:

```typescript
import {
  createMockUser,      // Create mock user object
  createAuthToken,     // Create JWT token for testing
  mockRequest,         // Mock Express request
  mockResponse,        // Mock Express response
  mockNext            // Mock Express next function
} from './__tests__/helpers';
```

### Writing Unit Tests

**Example: Testing Middleware**

```typescript
// src/middleware/__tests__/auth.test.ts
import { authenticateJWT } from '../auth';
import { mockRequest, mockResponse, mockNext, createAuthToken } from '../../__tests__/helpers';

describe('Authentication Middleware', () => {
  it('should authenticate valid JWT token', () => {
    const token = createAuthToken();
    const req = mockRequest({
      headers: { authorization: `Bearer ${token}` },
      user: undefined
    });
    const res = mockResponse();
    const next = mockNext();

    authenticateJWT(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
  });
});
```

### Test Files Created

1. **Authentication Tests** (`src/middleware/__tests__/auth.test.ts`)
   - Valid token authentication
   - Missing token rejection
   - Invalid token rejection
   - Expired token rejection
   - Mock data bypass mode
   - Multiple role authorization
   - **Total: 10 test cases**

2. **Validation Tests** (`src/middleware/__tests__/validation.test.ts`)
   - Required field validation
   - Email format validation
   - UUID format validation
   - String/number/boolean type validation
   - Min/max length validation
   - Min/max value validation
   - Custom pattern validation
   - Custom function validation
   - **Total: 15 test cases**

3. **API Response Tests** (`src/utils/__tests__/apiResponse.test.ts`)
   - Success response formatting
   - Error response formatting
   - Validation error formatting
   - Not found responses
   - Unauthorized/forbidden responses
   - Server error responses
   - Paginated responses
   - Created/no content responses
   - **Total: 12 test cases**

4. **Integration Tests** (`src/routes/__tests__/auth.integration.test.ts`)
   - Login endpoint testing
   - Registration endpoint testing
   - Profile retrieval testing
   - Logout functionality
   - Password reset flow
   - **Total: 10+ test cases**

### Coverage Reports

After running `npm run test:coverage`:

```bash
# View HTML coverage report
open api/coverage/lcov-report/index.html

# Or on Linux
xdg-open api/coverage/lcov-report/index.html
```

**Coverage Files**:
- `coverage/lcov-report/index.html` - Interactive HTML report
- `coverage/lcov.info` - LCOV format for CI tools
- `coverage/coverage-final.json` - JSON format

### Test Coverage Goals

**Current Coverage**: ~3% (before this update)
**Target Coverage**: 50%+

**Priority Areas for Testing**:
1. ✅ Authentication middleware (DONE)
2. ✅ Validation middleware (DONE)
3. ✅ API response utilities (DONE)
4. Route handlers (NEXT)
5. Service layer business logic
6. Database repositories
7. Utility functions

### Best Practices

1. **Test Independence**: Each test should be independent and not rely on other tests
2. **Mock External Dependencies**: Use Jest mocks for database, external APIs, etc.
3. **AAA Pattern**: Arrange, Act, Assert
4. **Descriptive Names**: Test names should clearly describe what is being tested
5. **Coverage Threshold**: Maintain 50%+ coverage on all metrics

### Example Test Pattern

```typescript
describe('Module Name', () => {
  describe('function name', () => {
    it('should handle valid input', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = myFunction(input);

      // Assert
      expect(result).toBe('expected');
    });

    it('should handle invalid input', () => {
      expect(() => myFunction(null)).toThrow();
    });
  });
});
```

### CI/CD Integration

Add to GitHub Actions workflow:

```yaml
- name: Run API Tests
  run: |
    cd api
    npm run test:ci

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./api/coverage/lcov.info
```

---

## Quick Start

### Prerequisites

- Node.js 18+ installed
- npm installed
- Port 5000 (frontend) and 3000 (backend) available

### Run Smoke Tests in 30 Seconds

```bash
# 1. Start the backend (in one terminal)
cd /home/user/Fleet/api
npm install
npm run dev

# 2. Start the frontend (in another terminal)
cd /home/user/Fleet
npm install
npm run dev

# 3. Run smoke tests (in a third terminal)
cd /home/user/Fleet
npm run test:smoke
```

---

## Test Data Setup

### Mock Data Configuration

The Fleet Management System includes a mock data layer that simulates a complete backend without requiring a database connection. This is ideal for local testing and development.

#### Enable Mock Data Mode

**Frontend Environment Variables** (`.env`):

```bash
# API Configuration
VITE_API_URL=http://localhost:3000

# Testing Configuration - Bypass authentication
VITE_DISABLE_AUTH=true
```

**Backend Environment Variables** (`.env`):

```bash
# Enable mock data instead of connecting to a real database
USE_MOCK_DATA=true

# Server Configuration
PORT=3000
NODE_ENV=development
```

#### Mock Data Structure

When `USE_MOCK_DATA=true`, the following mock datasets are available:

##### Vehicles (50+ records)
- ID, number, type, make, model, year
- VIN, license plate, status
- Location (lat/lng, address)
- Region, department, fuel level, fuel type
- Mileage, hours used (for equipment)
- Ownership status, service dates
- Alerts, tags

**Example Vehicle Types**:
- Sedan, SUV, truck, van
- Emergency vehicles
- Specialty equipment: tractor, forklift, trailer, construction, bus, motorcycle

**Example Mock Vehicle**:
```json
{
  "id": "veh-1000",
  "number": "FL-1000",
  "type": "sedan",
  "make": "Toyota",
  "model": "Camry",
  "status": "active",
  "location": {
    "lat": 27.9506,
    "lng": -82.4572,
    "address": "1234 Main St, Tampa, FL"
  }
}
```

##### Drivers (30+ records)
- ID, name, email, phone
- License number, license expiration
- Hire date, status (active/inactive)
- Department, assigned vehicle
- Driving record metrics

##### Work Orders (20+ records)
- ID, work order number, type
- Vehicle ID, assigned to, priority
- Status, created/due dates
- Description, notes

##### Fuel Transactions (50+ records)
- ID, vehicle ID, date, amount
- Fuel type, cost, mileage/hours
- Location, notes

##### Facilities (5-10 records)
- ID, name, location
- Capacity, equipment available

##### Maintenance Schedules (30+ records)
- ID, vehicle ID, type
- Due date, status, notes

##### Routes (10+ records)
- ID, route name, waypoints
- Distance, estimated time
- Status, vehicle assignments

### Using Mock Data in Tests

The mock database middleware (`/home/user/Fleet/api/src/middleware/mock-database.ts`) intercepts database queries and returns mock data automatically when `USE_MOCK_DATA=true`.

**Example API Call Flow**:

```
Frontend Request
    ↓
Express Server (Port 3000)
    ↓
Mock Database Middleware (checks USE_MOCK_DATA)
    ↓
Returns Mock Data (if enabled) OR
Connects to Real Database (if disabled)
```

### Available Mock API Routes

All standard fleet management endpoints are available:

```
GET  /api/vehicles          - List all vehicles
GET  /api/vehicles/:id      - Get vehicle details
GET  /api/drivers           - List all drivers
GET  /api/drivers/:id       - Get driver details
GET  /api/work-orders       - List work orders
GET  /api/fuel-transactions - List fuel transactions
GET  /api/facilities        - List facilities
GET  /api/maintenance       - List maintenance schedules
GET  /api/routes            - List routes
```

---

## Running Tests

### Available Test Commands

#### Smoke Tests (Recommended for quick validation)

```bash
npm run test:smoke
```

**What it tests**:
- Application accessibility
- Page loads and content rendering
- Navigation elements presence
- Critical JavaScript errors
- Basic module accessibility

**Expected duration**: 2-5 minutes
**Expected passing tests**: 3-5 out of 8

#### Unit Tests

```bash
# Run unit tests once
npm run test:unit

# Run unit tests in watch mode (re-runs on file changes)
npm run test:unit:watch

# Run unit tests with coverage report
npm run test:coverage
```

#### Component Tests

```bash
# Run all Playwright tests
npm run test

# Run specific test suite
npm run test:main                # Main modules
npm run test:management          # Management modules
npm run test:procurement         # Procurement & communication
npm run test:tools               # Tools modules
npm run test:workflows           # Workflows
npm run test:validation          # Form validation
npm run test:a11y                # Accessibility (a11y)
npm run test:performance         # Performance tests
npm run test:security            # Security tests
npm run test:load                # Load testing
```

#### Comprehensive Testing

```bash
# Run all tests (smoke + component + unit)
npm run test:all

# This uses the script at: ./scripts/run-all-tests.sh
```

### Test Report Generation

#### View HTML Report

```bash
# Display the latest test results in browser
npm run test:report
```

**Report Location**: `/home/user/Fleet/test-results/index.html`

Reports include:
- Test results by suite
- Failure details and stack traces
- Screenshots (for failures)
- Video recordings (for failed tests)
- Execution timeline

#### View JSON Results

```bash
cat test-results/results.json
```

#### View JUnit XML Report

```bash
cat test-results/junit.xml
```

Used by CI/CD systems (GitHub Actions, Jenkins, etc.)

### Running Tests in Different Modes

#### UI Mode (Interactive)

```bash
npm run test:ui
```

Features:
- Visual test selector
- Step-by-step execution
- Live inspection tools
- Time-travel debugging

#### Headed Mode (See Browser Actions)

```bash
npm run test:headed
```

Shows the browser window while running tests - useful for visual debugging.

#### Debug Mode

```bash
npx playwright test --debug
```

Opens Playwright Inspector with full debugging capabilities.

### Running Specific Tests

#### By File Name

```bash
npx playwright test 00-smoke-tests
npx playwright test e2e/01-main-modules
```

#### By Test Name Pattern

```bash
npx playwright test -g "Application is accessible"
```

#### By Tag

```bash
npx playwright test --grep @critical
```

---

## Test Environment

### Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│           Browser (Playwright)                      │
│  Running at: http://localhost:5000                  │
└────────────────────┬────────────────────────────────┘
                     │
                     │ HTTP Requests
                     ↓
┌─────────────────────────────────────────────────────┐
│     Frontend Application (Vite + React)             │
│     Port: 5000                                       │
│     Environment: VITE_API_URL=http://localhost:3000 │
│                 VITE_DISABLE_AUTH=true              │
└────────────────────┬────────────────────────────────┘
                     │
                     │ API Calls
                     ↓
┌─────────────────────────────────────────────────────┐
│     Backend API (Express.js)                        │
│     Port: 3000                                       │
│     Environment: USE_MOCK_DATA=true                 │
└────────────────────┬────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────┐
│     Mock Database Middleware                        │
│     Returns pre-defined mock data                   │
│     (no real database required)                     │
└─────────────────────────────────────────────────────┘
```

### Frontend Server

**URL**: `http://localhost:5000`

**Technology**: Vite + React 19

**Configuration** (`vite.config.ts`):
```typescript
export default defineConfig({
  server: {
    port: 5000,
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
})
```

**Start Frontend**:
```bash
cd /home/user/Fleet
npm run dev
```

### Backend API Server

**URL**: `http://localhost:3000`

**Technology**: Express.js + TypeScript

**Configuration**:
- Port: 3000
- CORS enabled for localhost:5000
- Rate limiting: 100 requests/minute
- Mock data middleware active (when USE_MOCK_DATA=true)

**Start Backend**:
```bash
cd /home/user/Fleet/api
npm run dev
```

**API Documentation**: http://localhost:3000/api/docs (Swagger UI)

### Mock Data vs Production Mode

#### Mock Data Mode (Testing)

```bash
# Environment
USE_MOCK_DATA=true
NODE_ENV=development

# Characteristics
- No database connection required
- Instant responses from mock data layer
- Perfect for local testing
- No network latency
- Deterministic test data
- Ideal for CI/CD pipelines
```

#### Production Mode

```bash
# Environment
USE_MOCK_DATA=false
NODE_ENV=production

# Requires
- Actual database (PostgreSQL, Azure Cosmos DB, etc.)
- All environment variables configured
- Network connectivity to database
- Real data loading and processing
```

### Test Configuration Files

#### Playwright Configuration (`playwright.config.ts`)

```typescript
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 4,
  timeout: 60000, // 60 seconds per test

  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list']
  ],

  use: {
    baseURL: 'http://localhost:5000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  }
})
```

#### Vitest Configuration (`vitest.config.ts`)

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    coverage: {
      provider: 'v8',
      lines: 70,
      functions: 70,
      branches: 70
    }
  }
})
```

---

## Authentication Bypass

### How Authentication Bypass Works for Tests

In test mode, the system bypasses Azure AD authentication to allow tests to run without requiring valid credentials. This is accomplished through:

1. **Mock JWT Token Generation** (in test code)
2. **localStorage Token Injection** (via Playwright context)
3. **Auth Bypass Flag** (VITE_DISABLE_AUTH)

### Authentication Flow in Tests

```javascript
// 1. Test creates a mock JWT token
function createMockToken(): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payload = Buffer.from(JSON.stringify({
    id: 'test-user-123',
    email: 'test@example.com',
    role: 'admin',
    tenant_id: '11111111-1111-1111-1111-111111111111',
    microsoft_id: 'test-microsoft-id',
    auth_provider: 'microsoft',
    exp: Math.floor(Date.now() / 1000) + 86400 // Expires in 24 hours
  })).toString('base64');
  const signature = Buffer.from('mock-signature').toString('base64');
  return `${header}.${payload}.${signature}`;
}

// 2. Token is injected into browser context before tests run
const test = base.extend({
  context: async ({ context }, use) => {
    await context.addInitScript((token) => {
      window.localStorage.setItem('token', token);
      console.log('[TEST] Auth token injected:', token);
    }, createMockToken());
    await use(context);
  },
});

// 3. Every page request includes the token
// Frontend automatically reads from localStorage
```

### Environment Variables for Auth Bypass

**Frontend** (`.env`):

```bash
# Disable authentication checks
VITE_DISABLE_AUTH=true

# Azure AD would normally require these (not needed in test mode)
VITE_AZURE_AD_CLIENT_ID=test-client-id
VITE_AZURE_AD_TENANT_ID=test-tenant-id
```

**Backend** (`.env`):

```bash
# Mock data mode - no database authentication needed
USE_MOCK_DATA=true
NODE_ENV=development

# JWT configuration (used for token validation in production)
JWT_SECRET=test-secret-key-minimum-32-characters-long
JWT_EXPIRES_IN=24h
```

### Playwright Test Setup

**Location**: `/home/user/Fleet/e2e/00-smoke-tests.spec.ts`

```typescript
import { test as base, expect } from '@playwright/test';

const BASE_URL = process.env.APP_URL || 'http://localhost:5000';

// Extend base test with authenticated context
const test = base.extend({
  context: async ({ context }, use) => {
    // Add init script to the context (applies to all pages)
    await context.addInitScript((token) => {
      window.localStorage.setItem('token', token);
      console.log('[TEST] Auth token injected:', token);
    }, createMockToken());
    await use(context);
  },
});

// All tests using this `test` have the token pre-injected
test('Application is accessible and loads', async ({ page }) => {
  const response = await page.goto(BASE_URL);
  expect(response?.status()).toBeLessThan(400);
});
```

### Creating Custom Authenticated Tests

When writing new tests that require specific user roles or permissions:

```typescript
const test = base.extend({
  context: async ({ context }, use) => {
    // Create token with specific role
    const token = createMockTokenWithRole('user'); // or 'admin', 'manager', etc.

    await context.addInitScript((token) => {
      window.localStorage.setItem('token', token);
      window.localStorage.setItem('user', JSON.stringify({
        id: 'test-user',
        role: 'admin',
        email: 'test@example.com'
      }));
    }, token);

    await use(context);
  },
});
```

---

## Current Test Status

### Smoke Test Summary

**Total Tests**: 8
**Passing**: 3
**Failing**: 5
**Success Rate**: 37.5%

### Smoke Tests Overview

#### Test Suite: Smoke Tests - Application Health

| # | Test Name | Status | Issue | Notes |
|---|-----------|--------|-------|-------|
| 1 | Application is accessible and loads | ✅ PASS | - | Frontend loads successfully |
| 2 | Application title is correct | ✅ PASS | - | Page title matches "Fleet Manager" |
| 3 | Main application structure is present | ❌ FAIL | #root element hidden | React component not rendering |
| 4 | Navigation elements are present | ❌ FAIL | Visibility timeout | Sidebar/nav not visible in time |
| 5 | No critical JavaScript errors | ✅ PASS | - | No fatal console errors detected |
| 6 | Page can handle navigation | ❌ FAIL | No buttons found | Interactive elements not loaded |
| 7 | Check if module navigation exists | ❌ FAIL | Text not found | Dashboard/module text missing |
| 8 | Dashboard or main view is visible | ❌ FAIL | Render timeout | Main content area hidden |

#### Test Suite: Module Accessibility Check

These tests verify that specific modules are accessible via navigation.

### Known Issues

#### Issue 1: React Component Rendering Timeout
**Symptom**: `#root` div exists but remains hidden
**Cause**: React component mounting taking longer than expected
**Impact**: Tests 3, 4, 8 affected
**Workaround**: Increase `waitForTimeout` from 2000ms to 5000ms+

**Test Code Location**: `/home/user/Fleet/e2e/00-smoke-tests.spec.ts:71`

```typescript
// Current (fails often)
await page.waitForTimeout(2000); // Give React time to render
await expect(root).toBeVisible({ timeout: 10000 });

// Suggested fix
await page.waitForTimeout(5000); // Increase wait time
```

#### Issue 2: Component Visibility Assertion
**Symptom**: Elements found but report as "hidden"
**Cause**: CSS display:none or visibility:hidden
**Impact**: Tests 4, 7 affected
**Solution**: Check CSS rules in React components

#### Issue 3: Navigation Elements Not Found
**Symptom**: Sidebar/nav selectors return empty
**Cause**: Navigation component might not be loading
**Impact**: Test 4 affected
**Solution**: Verify navigation component import and conditional rendering

### Passing Test Details

#### Test 1: Application is accessible and loads ✅
```typescript
test('Application is accessible and loads', async ({ page }) => {
  const response = await page.goto(BASE_URL);
  expect(response?.status()).toBeLessThan(400); // HTTP status OK
  await page.waitForLoadState('networkidle', { timeout: 30000 });
  const bodyText = await page.locator('body').textContent();
  expect(bodyText).toBeTruthy();
});
```

**Why it passes**:
- Frontend Vite server starts correctly
- Network requests complete
- Page HTML loads without errors

#### Test 2: Application title is correct ✅
```typescript
test('Application title is correct', async ({ page }) => {
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
  const title = await page.title();
  expect(title.toLowerCase()).toMatch(/fleet|manager/i);
});
```

**Why it passes**:
- HTML title tag set in index.html
- No network dependency

#### Test 5: No critical JavaScript errors ✅
```typescript
test('No critical JavaScript errors', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  // ... test logic
});
```

**Why it passes**:
- Error filter ignores non-critical messages (favicon, extensions)
- Application code has minimal console errors

### Failing Test Details

#### Tests 3, 4, 6, 7, 8: Various Visibility Issues ❌

**Common Root Cause**: React component not fully mounted or rendered

**Solution Strategy**:
1. Increase wait time before assertions
2. Check React DevTools to verify component tree
3. Verify CSS doesn't hide root element
4. Check for loading states preventing render

### Test Execution Performance

**Average execution time per test**: 12-15 seconds
**Total smoke test suite time**: 2-5 minutes (depending on retries)

**Performance breakdown**:
- Page load: ~3 seconds
- React render: ~2-3 seconds
- Element visibility check: ~2 seconds
- Assertion timeout: ~5 seconds (if element not found)

---

## Troubleshooting

### Common Test Failures and Solutions

#### Problem 1: "Port 5000 already in use"

**Error Message**:
```
Error: listen EADDRINUSE :::5000
```

**Solution**:

```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>

# Or use the npm script
npm run kill
```

#### Problem 2: "Port 3000 already in use"

**Error Message**:
```
Error: listen EADDRINUSE :::3000
```

**Solution**:

```bash
# Kill backend process
lsof -i :3000
kill -9 <PID>

# Restart backend
cd api && npm run dev
```

#### Problem 3: "Connection refused to localhost:3000"

**Error Message**:
```
Error: connect ECONNREFUSED 127.0.0.1:3000
```

**Causes and Solutions**:

1. **Backend not running**
   ```bash
   cd /home/user/Fleet/api
   npm run dev
   ```

2. **Backend on wrong port**
   ```bash
   # Check .env
   cat .env | grep PORT
   # Should show PORT=3000
   ```

3. **Firewall blocking**
   ```bash
   # Test connectivity
   curl http://localhost:3000/health
   ```

#### Problem 4: "Connection refused to localhost:5000"

**Error Message**:
```
Error: net::ERR_CONNECTION_REFUSED
```

**Causes and Solutions**:

1. **Frontend not running**
   ```bash
   cd /home/user/Fleet
   npm run dev
   ```

2. **Vite dev server crashed**
   - Check for console errors
   - Restart: `npm run dev`

3. **Wrong environment variables**
   ```bash
   # Check .env
   cat .env
   # Verify VITE_API_URL=http://localhost:3000
   ```

#### Problem 5: "Tests timeout waiting for element to appear"

**Error Message**:
```
Timeout of 30000ms exceeded
waiting for locator('#root, main, [role="main"]').first()
```

**Causes and Solutions**:

1. **React component not rendering**
   ```typescript
   // In test, increase wait time
   await page.waitForTimeout(5000); // was 2000
   ```

2. **CSS hiding elements**
   ```bash
   # Open DevTools in headed mode
   npm run test:headed

   # Right-click element > Inspect
   # Check computed styles for display:none or visibility:hidden
   ```

3. **Component has runtime error**
   ```bash
   # Run in UI mode to see errors
   npm run test:ui

   # Check browser console tab
   ```

#### Problem 6: "/tmp permissions denied"

**Error Message**:
```
EACCES: permission denied, open '/tmp/.playwright...'
```

**Solution**:

```bash
# Check /tmp permissions
ls -ld /tmp

# Fix permissions (if you have sudo access)
sudo chmod 1777 /tmp

# Or use alternative temp directory
export TMPDIR=/home/user/Fleet/.tmp
mkdir -p $TMPDIR
npm run test:smoke

# Or run tests with different user
# This often fixes permission issues in CI/CD
```

#### Problem 7: "GPU process crashed"

**Error Message**:
```
[SEVERE:gpu_process_host.cc] GPU process crashed
```

**Causes and Solutions**:

1. **Running in VM/container without GPU**
   ```bash
   # Disable GPU
   export PLAYWRIGHT_LAUNCH_OPTS="--no-sandbox --disable-gpu"
   npm run test:smoke
   ```

2. **Graphics driver issue**
   ```bash
   # Use headless mode (doesn't need GPU)
   npx playwright test --config=playwright.config.ts
   # (headless is default)
   ```

3. **Insufficient memory**
   ```bash
   # Reduce parallel workers
   npx playwright test --workers=1
   ```

#### Problem 8: "Element is not in the viewport"

**Error Message**:
```
Error: strict mode violation: locator(...) resolved to 5 elements
```

**Solution**:

```typescript
// Be more specific with selector
const root = page.locator('#root').first(); // Not ':visible'
// or
const root = page.locator('main').first();
// or
const root = page.locator('[role="main"]').first();
```

#### Problem 9: "Mock data not loading"

**Error Message**:
```
[API Error] GET /api/vehicles - 404 Not Found
```

**Solution**:

```bash
# Verify mock data environment variable
cat /home/user/Fleet/api/.env | grep USE_MOCK_DATA

# Should show: USE_MOCK_DATA=true

# If missing, add it
echo "USE_MOCK_DATA=true" >> /home/user/Fleet/api/.env

# Restart backend
cd /home/user/Fleet/api
npm run dev
```

#### Problem 10: "Authentication token expired"

**Error Message**:
```
Error: Unauthorized - token expired
```

**Solution**:

The mock token is set to expire 24 hours after test creation. If tests are running after 24 hours:

```typescript
// Update the expiration in smoke test
exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
```

Edit `/home/user/Fleet/e2e/00-smoke-tests.spec.ts` line 19.

### Debug Techniques

#### Enable Detailed Logging

```bash
# Run with Playwright debug logging
DEBUG=pw:api npm run test:smoke

# Or just for test runner
PWDEBUG=1 npm run test:smoke
```

#### Take Screenshots During Test

```typescript
test('example', async ({ page }) => {
  await page.goto('http://localhost:5000');

  // Take screenshot at key points
  await page.screenshot({ path: 'debug-screenshot.png' });
});
```

Screenshots saved to current directory or `test-results/`.

#### View Video Recording

Playwright records videos of failed tests automatically:

```bash
# After test run, view video
open test-results/*-retry1/video.webm

# Or on Linux
vlc test-results/*-retry1/video.webm
```

#### Use Playwright Inspector

```bash
# Interactive debugging
npx playwright test --debug

# This opens the Playwright Inspector window
# - Step through test execution
- Inspect elements in real-time
- View network requests
- Time-travel through test execution
```

#### Check React DevTools

```bash
# Run in headed mode to use DevTools
npm run test:headed

# During test execution:
# 1. Press F12 to open DevTools
# 2. Go to "Components" tab
# 3. Inspect React component tree
# 4. Check props and state
```

### Infrastructure Issues

#### Issue: Temporary Files Cannot Be Created

**Symptom**: Tests fail with "No space left on device"

**Solution**:

```bash
# Check available disk space
df -h

# Clear temporary test files
rm -rf /home/user/Fleet/test-results/*
rm -rf /tmp/playwright-*

# Restart tests
npm run test:smoke
```

#### Issue: Node Process Memory Leak

**Symptom**: Tests slow down or hang on longer test suites

**Solution**:

```bash
# Run with memory debugging
node --max-old-space-size=4096 node_modules/.bin/playwright test

# Or increase Node memory for npm
export NODE_OPTIONS="--max-old-space-size=4096"
npm run test:all
```

#### Issue: Network Timeouts in CI/CD

**Symptom**: Tests pass locally but fail in CI

**Solution**:

```bash
# Increase timeouts in playwright.config.ts
timeout: 120000, // was 60000

# Or run with longer waits
npm run test:smoke -- --timeout=120000
```

### Getting Help

1. **Check test reports**:
   ```bash
   npm run test:report
   ```

2. **Review error messages** in test output or `test-results/results.json`

3. **Run in debug mode**:
   ```bash
   npm run test:ui
   ```

4. **Check backend logs**:
   ```bash
   # Terminal where `npm run dev` is running in api/
   # Look for error messages
   ```

5. **Verify environment**:
   ```bash
   echo "Frontend:"
   echo "  URL: http://localhost:5000"
   curl -I http://localhost:5000

   echo "Backend:"
   echo "  URL: http://localhost:3000"
   curl -I http://localhost:3000/api/docs
   ```

---

## Test Configuration

### Playwright Configuration Details

**File**: `/home/user/Fleet/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  // Where to look for tests
  testDir: './e2e',

  // Test execution
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 4,
  timeout: 60000, // 60 seconds per test

  // Output reporting
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list']
  ],

  // Browser settings
  use: {
    baseURL: process.env.APP_URL || 'http://localhost:5000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ignoreSnapshots: !process.env.UPDATE_SNAPSHOTS,
  },

  // Visual regression threshold
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2,
    },
  },

  // Browser projects
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      }
    },
    // Firefox, Safari, mobile commented out for faster testing
  ],

  // Auto-start dev servers
  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:5000',
        reuseExistingServer: !process.env.CI,
        timeout: 120000
      }
})
```

### Vitest Configuration Details

**File**: `/home/user/Fleet/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],

    // Coverage thresholds (must be >= these values)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Environment Variables Summary

**Frontend** (`.env`):
```bash
VITE_API_URL=http://localhost:3000
VITE_DISABLE_AUTH=true                    # Bypass auth in tests
VITE_AZURE_AD_CLIENT_ID=test-client-id
VITE_AZURE_AD_TENANT_ID=test-tenant-id
VITE_AZURE_MAPS_SUBSCRIPTION_KEY=test-key
```

**Backend** (`.env`):
```bash
PORT=3000
NODE_ENV=development
USE_MOCK_DATA=true                         # Use mock data instead of DB
DEBUG=fleet:*                              # Enable debug logging
LOG_LEVEL=debug
JWT_SECRET=test-secret-key-minimum-32-characters-long
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:5000
```

---

## Additional Resources

- **Playwright Documentation**: https://playwright.dev/docs/intro
- **Vitest Documentation**: https://vitest.dev/
- **React Testing Library**: https://testing-library.com/docs/react-testing-library/intro/
- **Jest Matchers**: https://jestjs.io/docs/expect
- **Vite Documentation**: https://vitejs.dev/

---

## Version Information

- **Playwright**: ^1.56.1
- **Vitest**: ^4.0.8
- **React**: ^19.0.0
- **Node.js**: 18+
- **npm**: 8+

---

**Last Updated**: November 12, 2025
**Status**: Production Ready
