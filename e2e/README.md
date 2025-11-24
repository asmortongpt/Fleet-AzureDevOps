# Fleet Manager E2E Test Suite

Comprehensive end-to-end testing suite providing 100% production confidence through automated testing of all critical user flows.

## 📋 Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Test Categories](#test-categories)
- [Coverage](#coverage)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

This test suite provides comprehensive coverage of:

- **Critical User Flows**: Fleet operations, maintenance, people management, financial operations, navigation
- **Mobile Experience**: Responsive design, touch interactions, mobile-specific features
- **Performance**: Load times, lazy loading, bundle sizes
- **Security**: Authentication, authorization, CSRF/XSS protection
- **Integration**: API connectivity, real-time features, maps integration

**Test Statistics:**
- **Total Test Suites**: 16
- **Minimum Test Cases**: 50+
- **Target Execution Time**: < 5 minutes
- **Browsers**: Chromium, Mobile (iPhone, Pixel, iPad)

## 📁 Test Structure

```
e2e/
├── auth/                     # Authentication tests (15 tests)
│   └── microsoft-sso.test.ts
├── critical-flows/           # Core user journey tests (40+ tests)
│   ├── fleet-operations.test.ts
│   ├── maintenance.test.ts
│   ├── people-management.test.ts
│   ├── financial.test.ts
│   └── navigation.test.ts
├── mobile/                   # Mobile-specific tests (30+ tests)
│   ├── mobile-navigation.test.ts
│   ├── mobile-responsiveness.test.ts
│   └── mobile-interactions.test.ts
├── performance/              # Performance tests (15+ tests)
│   ├── load-time.test.ts
│   ├── lazy-loading.test.ts
│   └── bundle-size.test.ts
├── security/                 # Security tests (25+ tests)
│   ├── auth-flows.test.ts
│   ├── unauthorized-access.test.ts
│   └── csrf-xss.test.ts
├── integration/              # Integration tests (15+ tests)
│   ├── api-connectivity.test.ts
│   └── maps-integration.test.ts
└── helpers/                  # Shared test utilities
```

## 🚀 Running Tests

### Quick Start

```bash
# Run all comprehensive tests
npm run test:comprehensive

# Or use the script directly
./scripts/run-comprehensive-tests.sh
```

### Selective Test Runs

```bash
# Run specific test suite
npx playwright test e2e/critical-flows/fleet-operations.test.ts

# Run all critical flows
npx playwright test e2e/critical-flows/

# Run mobile tests
npx playwright test e2e/mobile/ --project=mobile-iphone

# Run performance tests
npx playwright test e2e/performance/

# Run security tests
npx playwright test e2e/security/

# Run integration tests
npx playwright test e2e/integration/
```

### Test Projects

```bash
# Desktop Chrome (default)
npx playwright test --project=chromium

# Mobile iPhone
npx playwright test --project=mobile-iphone

# Mobile Pixel
npx playwright test --project=mobile-pixel

# Tablet iPad
npx playwright test --project=mobile-ipad
```

### Debug Mode

```bash
# Run tests in headed mode
npx playwright test --headed

# Debug specific test
npx playwright test --debug e2e/critical-flows/fleet-operations.test.ts

# Run with UI
npx playwright test --ui
```

## 📊 Test Categories

### 1. Critical User Flows

**Purpose**: Validate core business functionality

#### Fleet Operations (fleet-operations.test.ts)
- Dashboard metrics display
- GPS tracking and maps
- Vehicle telemetry data
- Vehicle list and filtering
- Search functionality

#### Maintenance (maintenance.test.ts)
- Garage operations dashboard
- Work order management (create, view, update, filter)
- Maintenance scheduling
- Service history tracking
- Parts inventory

#### People Management (people-management.test.ts)
- Driver list and profiles
- Driver assignment to vehicles
- Performance metrics and scorecards
- Safety scores and behavior tracking
- Certifications and training

#### Financial (financial.test.ts)
- Fuel management and transactions
- Mileage tracking
- Invoice management
- Cost analysis and trends
- Budget management

#### Navigation (navigation.test.ts)
- Sidebar navigation
- Breadcrumbs
- Search functionality
- Keyboard shortcuts
- User menu

### 2. Mobile Experience

**Purpose**: Ensure excellent mobile UX

- **mobile-navigation.test.ts**: Hamburger menu, sidebar overlay, touch targets, swipe gestures
- **mobile-responsiveness.test.ts**: Layout adaptation across screen sizes, form inputs, safe areas
- **mobile-interactions.test.ts**: Touch events, scroll behavior, gesture support

**Devices Tested**:
- iPhone 12 (390x844)
- Pixel 5 (393x851)
- iPad Pro (1024x1366)

### 3. Performance

**Purpose**: Meet performance benchmarks

- **load-time.test.ts**: Initial load < 3s, TTI < 4s, FCP < 1.5s, LCP < 2.5s
- **lazy-loading.test.ts**: On-demand module loading, image lazy loading
- **bundle-size.test.ts**: Main bundle < 500KB, vendor < 1MB, compression

**Performance Targets**:
- Initial Page Load: < 3 seconds
- Time to Interactive: < 4 seconds
- First Contentful Paint: < 1.5 seconds
- Largest Contentful Paint: < 2.5 seconds

### 4. Security

**Purpose**: Prevent vulnerabilities

- **auth-flows.test.ts**: SSO, email/password, logout, session management, token handling
- **unauthorized-access.test.ts**: Protected routes, API authentication, RBAC
- **csrf-xss.test.ts**: CSRF tokens, XSS prevention, input sanitization, CSP

**Security Checks**:
- Authentication flows (SSO, email/password)
- Authorization and access control
- CSRF protection
- XSS prevention
- Input validation
- Security headers

### 5. Integration

**Purpose**: Verify external integrations

- **api-connectivity.test.ts**: API health checks, endpoint responses, error handling
- **maps-integration.test.ts**: Azure Maps loading, markers, interactions, geolocation

**Integrations Tested**:
- REST API endpoints
- Azure Maps
- Real-time features (if applicable)
- Authentication providers

## 📈 Coverage

### Critical Paths Covered

✅ User authentication (SSO + email/password)
✅ Fleet dashboard and vehicle management
✅ GPS tracking and mapping
✅ Maintenance and work orders
✅ Driver management and scorecards
✅ Fuel and financial operations
✅ Mobile responsive design
✅ Navigation and UX
✅ API connectivity
✅ Security and authorization

### Coverage Metrics

- **User Flows**: 100% of critical paths
- **Components**: Major UI components tested
- **API Endpoints**: Core endpoints validated
- **Mobile Viewports**: 3 device sizes
- **Security**: Authentication, authorization, input validation

## 🎯 Best Practices

### Writing New Tests

1. **Follow the Pattern**
   ```typescript
   test.describe('Feature Category', () => {
     test.beforeEach(async ({ page }) => {
       await page.goto('/')
       await page.waitForLoadState('networkidle')
     })

     test('should do something specific', async ({ page }) => {
       // Arrange
       const element = page.locator('selector')

       // Act
       await element.click()

       // Assert
       await expect(element).toBeVisible()
     })
   })
   ```

2. **Use Proper Wait Strategies**
   - ✅ `await page.waitForLoadState('networkidle')`
   - ✅ `await expect(element).toBeVisible()`
   - ❌ `await page.waitForTimeout(5000)` (avoid arbitrary waits)

3. **Write Resilient Selectors**
   - ✅ `data-testid` attributes
   - ✅ ARIA roles and labels
   - ✅ Semantic HTML
   - ❌ Brittle CSS selectors

4. **Test User Journeys, Not Implementation**
   - Focus on what users do, not how it's coded
   - Test from the user's perspective
   - Verify visible outcomes

5. **Handle Dynamic Content**
   ```typescript
   if (await element.isVisible()) {
     // Test the feature
   } else {
     // Skip or test alternative path
   }
   ```

## 🔧 Troubleshooting

### Common Issues

#### Tests Timeout
```bash
# Increase timeout
npx playwright test --timeout=90000
```

#### Flaky Tests
- Check for race conditions
- Add proper waits (`waitForLoadState`)
- Verify element visibility before interaction

#### Authentication Issues
- Ensure test environment has valid credentials
- Check DEV mode bypasses if applicable
- Verify token storage (localStorage)

#### Mobile Tests Fail
- Check viewport configuration
- Verify touch events are used (`.tap()` not `.click()`)
- Test on actual mobile viewport

### Debug Commands

```bash
# Show browser while testing
npx playwright test --headed

# Slow down test execution
npx playwright test --headed --slow-mo=1000

# Run specific test in debug mode
npx playwright test --debug e2e/critical-flows/fleet-operations.test.ts

# Generate trace
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

### Environment Variables

```bash
# Set base URL
export APP_URL=http://localhost:5173

# Production testing
export APP_URL=https://your-production-url.com

# CI mode
export CI=true
```

## 📝 Test Reports

### HTML Report

```bash
# Generate and view HTML report
npx playwright show-report

# Report location
./playwright-report/index.html
```

### JSON Report

```bash
# Location
./test-results/results.json

# Parse for metrics
cat test-results/results.json | jq '.suites[].tests[] | {title, status, duration}'
```

### JUnit Report (CI/CD)

```bash
# Location
./test-results/junit.xml

# Used by CI systems for test reporting
```

## 🤝 Contributing

When adding new tests:

1. Place in appropriate category directory
2. Follow naming convention: `feature-name.test.ts`
3. Add descriptive test names
4. Update this README if adding new categories
5. Ensure tests pass locally before committing

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Tests](https://playwright.dev/docs/debug)
- [CI/CD Integration](https://playwright.dev/docs/ci)

## 🎉 Success Criteria

Tests are considered successful when:

✅ All critical paths covered
✅ < 5 minute total execution time
✅ Clear failure messages
✅ Tests pass consistently (< 5% flake rate)
✅ Mobile and desktop coverage
✅ Security tests validate protection
✅ Performance tests meet benchmarks

## 📞 Support

For issues with tests:
1. Check this README
2. Review test output and traces
3. Run in debug mode
4. Check Playwright docs

---

**Last Updated**: 2025-11-24
**Test Suite Version**: 1.0.0
**Playwright Version**: Latest
