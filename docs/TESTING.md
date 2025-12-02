# Fleet Management System - Testing Documentation

## Table of Contents

1. [Overview](#overview)
2. [Test Structure](#test-structure)
3. [Running Tests](#running-tests)
4. [Backend Tests](#backend-tests)
5. [Frontend Tests](#frontend-tests)
6. [End-to-End Tests](#end-to-end-tests)
7. [Code Quality](#code-quality)
8. [Coverage Reports](#coverage-reports)
9. [CI/CD Integration](#cicd-integration)
10. [Writing New Tests](#writing-new-tests)

## Overview

The Fleet Management System has comprehensive test coverage across all layers:

- **Unit Tests**: Service layer logic and ML models
- **Integration Tests**: API routes and database operations
- **Component Tests**: React components with React Testing Library
- **E2E Tests**: Complete user workflows with Playwright
- **Security Tests**: Authentication, authorization, and vulnerability testing
- **Migration Tests**: Database schema validation

## Test Structure

```
Fleet/
├── api/
│   ├── tests/
│   │   ├── setup.ts                 # Test configuration
│   │   ├── routes/                  # API integration tests
│   │   │   ├── asset-management.test.ts
│   │   │   ├── task-management.test.ts
│   │   │   └── incident-management.test.ts
│   │   ├── services/                # Service unit tests
│   │   │   ├── alert-engine.service.test.ts
│   │   │   └── vehicle-identification.service.test.ts
│   │   ├── ml-models/               # ML model validation
│   │   │   └── driver-scoring.test.ts
│   │   ├── security/                # Security tests
│   │   │   └── auth.security.test.ts
│   │   ├── migrations/              # Database migration tests
│   │   │   └── migration.test.ts
│   │   └── performance/             # Performance tests
│   └── vitest.config.ts             # Test configuration
├── src/
│   └── tests/
│       ├── setup.ts                 # Frontend test setup
│       └── components/              # React component tests
│           └── AssetManagement.test.tsx
└── e2e/
    └── asset-management.spec.ts     # E2E tests
```

## Running Tests

### Backend Tests

```bash
cd api

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test asset-management.test.ts

# Run tests matching pattern
npm test -- --grep "Asset Management"
```

### Frontend Tests

```bash
# Run all frontend tests
npm test

# Run in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### End-to-End Tests

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests
npm run test:e2e

# Run E2E tests in headed mode
npm run test:e2e:headed

# Run specific test file
npx playwright test asset-management.spec.ts

# Open Playwright UI
npx playwright test --ui
```

### Run All Tests

```bash
# From root directory
npm run test:all
```

## Backend Tests

### API Integration Tests

Tests all API routes with authentication, authorization, and multi-tenant isolation.

**Example: Asset Management Tests**

```typescript
describe('Asset Management API', () => {
  it('should create a new asset with valid data', async () => {
    const response = await request(app)
      .post('/api/asset-management')
      .set('Authorization', `Bearer ${authToken}`)
      .send(assetData)
      .expect(201)

    expect(response.body.asset).toBeDefined()
  })
})
```

**Features Tested:**
- CRUD operations
- Multi-tenant isolation
- Authentication & authorization
- Input validation
- Error handling
- Database transactions

### Service Layer Tests

Unit tests for business logic with mocked dependencies.

**Example: Alert Engine Tests**

```typescript
describe('AlertEngineService', () => {
  it('should create an alert successfully', async () => {
    const alert = await service.createAlert(tenantId, alertData)
    expect(alert.severity).toBe('warning')
  })
})
```

### ML Model Tests

Validates scoring algorithms, edge cases, and mathematical correctness.

**Example: Driver Scoring Tests**

```typescript
describe('DriverScoringModel', () => {
  it('should calculate perfect score for ideal driver', () => {
    const score = model.calculateScore(perfectMetrics)
    expect(score.overallScore).toBeGreaterThanOrEqual(90)
  })
})
```

### Security Tests

Tests for common vulnerabilities and security best practices.

**Tested:**
- SQL injection prevention
- XSS prevention
- Authentication bypass attempts
- Multi-tenant data isolation
- Rate limiting
- CSRF protection
- Input validation

### Database Migration Tests

Validates database schema, indexes, and constraints.

**Example:**

```typescript
it('should have created assets table', async () => {
  const result = await testPool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_name = 'assets'
    )
  `)
  expect(result.rows[0].exists).toBe(true)
})
```

## Frontend Tests

### Component Tests

Uses React Testing Library and Vitest for component testing.

**Example:**

```typescript
describe('AssetManagement Component', () => {
  it('should fetch and display assets on mount', async () => {
    renderWithRouter(<AssetManagement />)

    await waitFor(() => {
      expect(screen.getByText('Test Vehicle')).toBeDefined()
    })
  })
})
```

**Testing Philosophy:**
- Test user behavior, not implementation
- Query by accessible roles and labels
- Wait for async updates
- Mock API calls
- Test error states

## End-to-End Tests

### Playwright Tests

Tests complete user workflows in a real browser.

**Example:**

```typescript
test('should create a new asset', async ({ page }) => {
  await page.goto(`${APP_URL}/asset-management`)
  await page.click('button:has-text("Add Asset")')
  await page.fill('input[name="asset_name"]', 'E2E Test Vehicle')
  await page.click('button[type="submit"]')

  await expect(page.locator('text=Asset created successfully')).toBeVisible()
})
```

**Scenarios Tested:**
- User authentication flows
- CRUD operations
- Form validation
- Navigation
- Error handling
- Responsive behavior

## Code Quality

### ESLint

Enforces code style and catches common errors.

```bash
# Run linter
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

**Configuration:**
- TypeScript support
- React hooks validation
- Security best practices
- No console.log in production

### Prettier

Ensures consistent code formatting.

```bash
# Check formatting
npm run format:check

# Format code
npm run format
```

## Coverage Reports

### Generate Coverage Reports

```bash
cd api
npm run test:coverage
```

**Coverage Targets:**
- Lines: 80%+
- Functions: 80%+
- Branches: 75%+
- Statements: 80%+

### View Coverage Reports

After running tests with coverage:

```bash
# HTML report
open coverage/index.html

# Text report in terminal
cat coverage/coverage-summary.txt
```

### Coverage by Module

The coverage report shows:
- Overall coverage percentage
- Per-file coverage details
- Uncovered lines highlighted
- Branch coverage details

## CI/CD Integration

### GitHub Actions

Tests run automatically on:
- Every pull request
- Push to main branch
- Manual workflow dispatch

**Workflow Steps:**
1. Checkout code
2. Setup Node.js
3. Install dependencies
4. Run linter
5. Run backend tests
6. Run frontend tests
7. Run E2E tests
8. Generate coverage reports
9. Upload coverage to Codecov
10. Fail PR if tests fail

### Pre-commit Hooks

Optional: Set up pre-commit hooks to run tests locally.

```bash
# Install husky
npm install --save-dev husky

# Set up pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm test"
```

## Writing New Tests

### Backend API Tests

1. **Create test file**: `api/tests/routes/your-feature.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../../src/server'
import { generateTestToken, cleanupDatabase } from '../setup'

describe('Your Feature API', () => {
  let authToken: string

  beforeAll(async () => {
    authToken = generateTestToken()
  })

  it('should perform action', async () => {
    const response = await request(app)
      .get('/api/your-endpoint')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)

    expect(response.body).toBeDefined()
  })
})
```

### Frontend Component Tests

1. **Create test file**: `src/tests/components/YourComponent.test.tsx`

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import YourComponent from '../../components/YourComponent'

describe('YourComponent', () => {
  it('should render correctly', () => {
    render(<YourComponent />)
    expect(screen.getByText('Expected Text')).toBeDefined()
  })
})
```

### E2E Tests

1. **Create test file**: `e2e/your-feature.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Your Feature E2E', () => {
  test('should complete user workflow', async ({ page }) => {
    await page.goto('http://localhost:5000/your-feature')
    await page.click('button:has-text("Action")')
    await expect(page.locator('text=Success')).toBeVisible()
  })
})
```

## Best Practices

### Test Organization

- **Group related tests** using `describe` blocks
- **Use meaningful test names** that describe behavior
- **Follow AAA pattern**: Arrange, Act, Assert
- **Keep tests isolated** and independent
- **Clean up after tests** in `afterEach` or `afterAll`

### Test Data

- Use **test data generators** from `setup.ts`
- **Don't use production data** in tests
- **Clean up test data** after each test
- Use **unique identifiers** to avoid conflicts

### Mocking

- **Mock external dependencies** (APIs, databases)
- **Don't mock what you're testing**
- **Use realistic mock data**
- **Mock at the right level** (service vs. API)

### Assertions

- Use **specific assertions** (not just truthy checks)
- **Test error cases** as well as happy paths
- **Verify side effects** (database updates, API calls)
- **Check error messages** for clarity

## Troubleshooting

### Common Issues

**Tests fail in CI but pass locally**
- Check environment variables
- Verify database seeding
- Check for timezone issues
- Ensure clean state between tests

**Slow tests**
- Use `beforeAll` instead of `beforeEach` when possible
- Mock slow external services
- Optimize database queries
- Run tests in parallel

**Flaky tests**
- Add proper `waitFor` for async operations
- Avoid hard-coded timeouts
- Check for race conditions
- Ensure proper cleanup

**Coverage not meeting targets**
- Identify uncovered code in reports
- Add tests for edge cases
- Test error paths
- Remove dead code

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Supertest](https://github.com/ladjs/supertest)
- [Testing Best Practices](https://testingjavascript.com/)

## Support

For questions or issues with testing:
1. Check this documentation
2. Review existing test examples
3. Check CI logs for detailed errors
4. Contact the development team

---

**Last Updated**: 2024-01-01
**Maintained By**: Fleet Development Team
