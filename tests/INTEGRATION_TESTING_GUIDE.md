# Integration Testing Guide
## Fleet Management System - New Features

**Version**: 1.0
**Last Updated**: 2025-11-27
**Author**: Fleet Testing Team

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Test Categories](#test-categories)
5. [Running Tests](#running-tests)
6. [Writing New Tests](#writing-new-tests)
7. [Debugging Tests](#debugging-tests)
8. [CI/CD Integration](#cicd-integration)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Overview

This guide covers the comprehensive integration testing suite for the Fleet Management System's new features, including:

- **Task Management** - CRUD operations, AI prioritization, workflows
- **Dispatch Console** - Real-time PTT communication, WebSocket streaming
- **Inventory Management** - Parts tracking, per-vehicle inventory
- **AI Features** - Route optimization, predictive maintenance, anomaly detection
- **Emulator Endpoints** - GPS, OBD2, Route, and Cost simulation
- **Real-time Performance** - WebSocket, GPS updates, audio streaming

**Total Tests**: 194+
**Target Coverage**: >80%
**Achieved Coverage**: 87%

---

## Prerequisites

### Required Software
```bash
# Node.js 18+ and npm
node --version  # Should be v18.0.0 or higher
npm --version   # Should be v9.0.0 or higher

# Playwright browsers (for E2E tests)
npx playwright install

# Check installations
npx playwright --version
```

### Environment Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd fleet-local
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   # Copy example env file
   cp .env.example .env

   # Edit .env with your configuration
   # Required variables:
   # - API_URL (default: http://localhost:3000)
   # - WS_URL (default: ws://localhost:3000)
   # - APP_URL (default: http://localhost:5173)
   ```

4. **Start required services**:
   ```bash
   # Terminal 1: Start API server
   cd api
   npm run dev

   # Terminal 2: Start frontend
   npm run dev

   # Terminal 3: Run tests (commands below)
   ```

---

## Quick Start

### Run All Tests
```bash
# Run complete test suite
npm run test:all

# Or run categories individually
npm run test:e2e              # All E2E tests
npm run test:integration      # All API integration tests
npm run test:performance      # Performance benchmarks
```

### Run Specific Feature Tests
```bash
# Task Management
npm run test:e2e -- tests/e2e/task-management.spec.ts

# Dispatch Console
npm run test:e2e -- tests/e2e/dispatch-console.spec.ts

# Inventory Management
npm run test:e2e -- tests/e2e/inventory-management.spec.ts

# AI Features
npm run test:integration -- api/tests/integration/ai-features.test.ts

# Emulator Endpoints
npm run test:integration -- api/tests/integration/emulator-endpoints.test.ts

# WebSocket
npm run test:integration -- api/tests/integration/websocket.test.ts

# Performance
npm run test:performance -- tests/performance/real-time-features.spec.ts
```

### Generate Coverage Report
```bash
# E2E coverage
npm run test:coverage

# API integration coverage
cd api && npm run test:coverage

# Combined coverage report
npm run test:all && npm run coverage:report
```

---

## Test Categories

### 1. End-to-End (E2E) Tests

**Technology**: Playwright
**Location**: `tests/e2e/`
**Purpose**: Test complete user workflows through the UI

#### Test Files
- `task-management.spec.ts` (30 tests)
- `dispatch-console.spec.ts` (34 tests)
- `inventory-management.spec.ts` (30 tests)

#### Running E2E Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run in UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run specific browser
npm run test:e2e:chromium
npm run test:e2e:firefox
npm run test:e2e:webkit

# Run on mobile emulation
npm run test:e2e:mobile

# Generate HTML report
npm run test:e2e:report
```

#### E2E Test Structure
```typescript
test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Navigate to page
    await page.goto('/')
    await page.click('text=Feature')
  })

  test('should perform action', async ({ page }) => {
    // Arrange
    const element = page.locator('[data-testid="element"]')

    // Act
    await element.click()

    // Assert
    await expect(element).toHaveText('Expected Text')
  })
})
```

### 2. API Integration Tests

**Technology**: Vitest + Supertest
**Location**: `api/tests/integration/`
**Purpose**: Test API endpoints and backend logic

#### Test Files
- `ai-features.test.ts` (31 tests)
- `emulator-endpoints.test.ts` (35 tests)
- `websocket.test.ts` (19 tests)

#### Running API Tests
```bash
# Run all integration tests
npm run test:integration

# Run specific test file
npm run test:integration -- api/tests/integration/ai-features.test.ts

# Watch mode
npm run test:integration:watch

# With coverage
npm run test:integration:coverage
```

#### API Test Structure
```typescript
describe('API Endpoint', () => {
  it('should return expected data', async () => {
    // Arrange
    const payload = { field: 'value' }

    // Act
    const response = await request(API_URL)
      .post('/api/endpoint')
      .send(payload)
      .expect(200)

    // Assert
    expect(response.body).toHaveProperty('result')
    expect(response.body.result).toBe('expected')
  })
})
```

### 3. WebSocket Tests

**Technology**: Vitest + WS
**Location**: `api/tests/integration/websocket.test.ts`
**Purpose**: Test real-time WebSocket communication

#### Running WebSocket Tests
```bash
# Run WebSocket tests
npm run test:integration -- api/tests/integration/websocket.test.ts

# With verbose output
npm run test:integration -- api/tests/integration/websocket.test.ts --reporter=verbose
```

#### WebSocket Test Structure
```typescript
it('should connect and receive messages', async () => {
  return new Promise<void>((resolve, reject) => {
    const ws = new WebSocket(`${WS_URL}/api/ws`)

    ws.on('open', () => {
      ws.send(JSON.stringify({ type: 'subscribe', channel: 'gps' }))
    })

    ws.on('message', (data) => {
      const message = JSON.parse(data.toString())
      expect(message).toHaveProperty('type')
      resolve()
    })

    ws.on('error', reject)
    setTimeout(() => reject(new Error('Timeout')), 5000)
  })
})
```

### 4. Performance Tests

**Technology**: Playwright with performance metrics
**Location**: `tests/performance/`
**Purpose**: Verify performance benchmarks

#### Running Performance Tests
```bash
# Run performance tests
npm run test:performance

# Run specific performance category
npm run test:performance -- --grep "WebSocket"
npm run test:performance -- --grep "GPS Update"
npm run test:performance -- --grep "UI Rendering"
```

#### Performance Test Structure
```typescript
test('should load quickly', async ({ page }) => {
  const startTime = Date.now()

  await page.goto('/feature')
  await page.waitForSelector('[data-testid="loaded"]')

  const loadTime = Date.now() - startTime

  console.log(`Load time: ${loadTime}ms`)
  expect(loadTime).toBeLessThan(2000)
})
```

---

## Running Tests

### Local Development

#### Full Test Suite
```bash
# Run everything (takes ~30 minutes)
npm run test:all

# View results
npm run test:report
```

#### Watch Mode (for development)
```bash
# E2E tests with UI
npm run test:e2e:ui

# API tests in watch mode
cd api && npm run test:watch

# Auto-run tests on file changes
npm run test:integration:watch
```

#### Specific Test Suites
```bash
# Task Management only
npm run test:e2e -- --grep "Task Management"

# AI Features only
npm run test:integration -- --grep "AI Features"

# Performance only
npm run test:performance
```

### Debugging Tests

#### E2E Test Debugging
```bash
# Debug mode (pauses on failure)
npm run test:e2e -- --debug

# Headed mode with slow motion
npm run test:e2e -- --headed --slow-mo=1000

# Generate trace on failure
npm run test:e2e -- --trace on

# View trace
npx playwright show-trace trace.zip
```

#### API Test Debugging
```bash
# Run with verbose logging
DEBUG=* npm run test:integration

# Run single test
npm run test:integration -- --grep "specific test name"

# Use Node debugger
node --inspect-brk node_modules/.bin/vitest run
```

#### WebSocket Test Debugging
```bash
# Enable WebSocket logging
DEBUG=ws:* npm run test:integration -- websocket.test.ts

# Increase timeout for debugging
npm run test:integration -- websocket.test.ts --testTimeout=30000
```

### CI/CD Integration

#### GitHub Actions
```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Run API tests
        run: npm run test:integration

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

#### Running Tests in CI
```bash
# Set CI environment variable
export CI=true

# Run tests (uses different config in CI)
npm run test:all

# Results available in test-results/
```

---

## Writing New Tests

### E2E Test Template
```typescript
/**
 * Feature Name E2E Tests
 *
 * Tests cover:
 * - Key user workflow 1
 * - Key user workflow 2
 * - Error handling
 * - Accessibility
 */

import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.click('text=Feature')
  })

  test.describe('User Workflow', () => {
    test('should complete workflow successfully', async ({ page }) => {
      // Step 1
      await page.fill('[name="input"]', 'value')

      // Step 2
      await page.click('button:has-text("Submit")')

      // Verify
      await expect(page.locator('[data-testid="success"]')).toBeVisible()
    })
  })

  test.describe('Error Handling', () => {
    test('should show error for invalid input', async ({ page }) => {
      await page.fill('[name="input"]', 'invalid')
      await page.click('button:has-text("Submit")')

      await expect(page.locator('[data-testid="error"]')).toBeVisible()
    })
  })

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter')

      await expect(page.locator('[data-testid="result"]')).toBeVisible()
    })
  })
})
```

### API Test Template
```typescript
/**
 * API Endpoint Tests
 *
 * Tests cover:
 * - Successful requests
 * - Error handling
 * - Validation
 * - Performance
 */

import { describe, it, expect } from 'vitest'
import request from 'supertest'

const API_URL = process.env.API_URL || 'http://localhost:3000'

describe('Endpoint Name', () => {
  describe('Success Cases', () => {
    it('should return data for valid request', async () => {
      const response = await request(API_URL)
        .post('/api/endpoint')
        .send({ param: 'value' })
        .expect(200)

      expect(response.body).toHaveProperty('data')
      expect(response.body.data).toBeInstanceOf(Array)
    })
  })

  describe('Error Cases', () => {
    it('should return 400 for invalid parameters', async () => {
      const response = await request(API_URL)
        .post('/api/endpoint')
        .send({ invalid: 'data' })
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })
  })

  describe('Validation', () => {
    it('should validate required fields', async () => {
      const response = await request(API_URL)
        .post('/api/endpoint')
        .send({})
        .expect(400)

      expect(response.body.error).toContain('required')
    })
  })
})
```

### Best Practices for Writing Tests

1. **Use descriptive test names**
   ```typescript
   // ✅ Good
   test('should create task and display in list')

   // ❌ Bad
   test('test1')
   ```

2. **Use data-testid attributes**
   ```typescript
   // ✅ Good
   await page.click('[data-testid="submit-button"]')

   // ❌ Bad (brittle)
   await page.click('button.blue-btn >> nth=2')
   ```

3. **Wait for elements properly**
   ```typescript
   // ✅ Good
   await page.waitForSelector('[data-testid="loaded"]')
   await expect(page.locator('[data-testid="result"]')).toBeVisible()

   // ❌ Bad
   await page.waitForTimeout(1000)
   ```

4. **Clean up after tests**
   ```typescript
   test.afterEach(async ({ page }) => {
     // Delete test data
     // Close connections
     // Reset state
   })
   ```

5. **Make tests independent**
   ```typescript
   // ✅ Each test sets up its own data
   test('test 1', async () => {
     await createTestData()
     // ... test logic
   })

   // ❌ Tests depend on each other
   test('test 1', async () => { await createData() })
   test('test 2', async () => { // assumes data from test 1 })
   ```

---

## Debugging Tests

### Common Issues

#### Issue: Test Timeout
```bash
# Solution: Increase timeout
test('slow test', async ({ page }) => {
  // ... test logic
}, 60000) // 60 second timeout
```

#### Issue: Element Not Found
```bash
# Solution: Add proper waits
await page.waitForSelector('[data-testid="element"]')
await expect(page.locator('[data-testid="element"]')).toBeVisible()
```

#### Issue: WebSocket Connection Fails
```bash
# Check if server is running
curl http://localhost:3000/health

# Check WebSocket endpoint
wscat -c ws://localhost:3000/api/ws
```

#### Issue: API Test 404 Errors
```bash
# Verify API server is running on correct port
curl http://localhost:3000/api/health

# Check API_URL environment variable
echo $API_URL
```

### Debug Tools

#### Playwright Inspector
```bash
# Open Playwright Inspector
PWDEBUG=1 npm run test:e2e -- task-management.spec.ts
```

#### Trace Viewer
```bash
# Generate trace
npm run test:e2e -- --trace on

# View trace
npx playwright show-trace test-results/.../trace.zip
```

#### Video Recording
```bash
# Record video of tests
npm run test:e2e -- --video on

# Videos saved to test-results/
```

---

## Test Maintenance

### Updating Tests

1. **When UI changes**:
   - Update selectors (data-testid attributes)
   - Update expected text/values
   - Re-record visual snapshots if using

2. **When API changes**:
   - Update request payloads
   - Update response expectations
   - Update mock data

3. **When business logic changes**:
   - Update test scenarios
   - Add new test cases
   - Remove obsolete tests

### Code Review Checklist

- [ ] Tests follow naming conventions
- [ ] Tests are independent and isolated
- [ ] Proper setup/teardown implemented
- [ ] No hardcoded waits (use proper waits)
- [ ] Assertions are specific and meaningful
- [ ] Test documentation updated
- [ ] Coverage increased or maintained

---

## Troubleshooting

### Common Problems and Solutions

| Problem | Solution |
|---------|----------|
| Tests pass locally but fail in CI | Check for timing issues, increase timeouts, verify environment variables |
| Flaky tests | Add explicit waits, check for race conditions, ensure proper test isolation |
| Slow test execution | Run tests in parallel, optimize selectors, reduce unnecessary waits |
| WebSocket tests hang | Check connection URL, verify server running, add timeout guards |
| Coverage not generating | Ensure coverage tools installed, check file paths, verify source maps |

### Getting Help

1. **Check test logs**: Look in `test-results/` directory
2. **View trace files**: Use Playwright trace viewer
3. **Enable debug logging**: Set `DEBUG=*` environment variable
4. **Review documentation**: This guide and Playwright/Vitest docs
5. **Team support**: Contact testing team lead

---

## Appendix

### Test Commands Reference

```bash
# E2E Tests
npm run test:e2e                    # Run all E2E tests
npm run test:e2e:ui                 # Interactive UI mode
npm run test:e2e:headed             # See browser
npm run test:e2e:chromium           # Chrome only
npm run test:e2e:firefox            # Firefox only
npm run test:e2e:webkit             # Safari only
npm run test:e2e:mobile             # Mobile emulation
npm run test:e2e:report             # View HTML report

# API Integration Tests
npm run test:integration            # Run all API tests
npm run test:integration:watch      # Watch mode
npm run test:integration:coverage   # With coverage

# Performance Tests
npm run test:performance            # Run benchmarks

# Coverage
npm run test:coverage               # Generate coverage report

# All Tests
npm run test:all                    # Run complete suite
```

### Environment Variables

```bash
# Test Configuration
API_URL=http://localhost:3000       # API base URL
WS_URL=ws://localhost:3000          # WebSocket URL
APP_URL=http://localhost:5173       # Frontend URL
CI=false                            # CI mode flag
DEBUG=*                             # Enable debug logs

# Playwright
PWDEBUG=1                           # Enable debugging
HEADED=true                         # Run in headed mode
```

### File Structure

```
fleet-local/
├── tests/
│   ├── e2e/
│   │   ├── task-management.spec.ts
│   │   ├── dispatch-console.spec.ts
│   │   └── inventory-management.spec.ts
│   ├── performance/
│   │   └── real-time-features.spec.ts
│   ├── INTEGRATION_TESTING_GUIDE.md
│   └── COMPREHENSIVE_TEST_COVERAGE_REPORT.md
├── api/
│   └── tests/
│       ├── integration/
│       │   ├── ai-features.test.ts
│       │   ├── emulator-endpoints.test.ts
│       │   └── websocket.test.ts
│       └── setup.ts
└── playwright.config.ts
```

---

**Questions?** Contact the testing team or refer to the [Coverage Report](./COMPREHENSIVE_TEST_COVERAGE_REPORT.md)

**Last Updated**: 2025-11-27
**Version**: 1.0
