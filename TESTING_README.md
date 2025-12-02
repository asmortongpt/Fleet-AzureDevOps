# Comprehensive Testing Suite - Fleet Management System

This repository contains a comprehensive testing suite covering all 54 modules of the Fleet Management System, including visual regression testing, API testing, accessibility testing, and end-to-end workflow testing.

## Test Coverage

- **Module Tests:** All 54 modules with visual snapshots
- **Workflow Tests:** 10 end-to-end business workflows
- **Form Validation:** Comprehensive validation testing for all forms
- **Accessibility:** WCAG 2.1 Level AA compliance testing
- **API Tests:** Python-based API integration tests
- **Visual Regression:** 120+ visual snapshots across all modules
- **Mobile Responsive:** Mobile viewport testing
- **Keyboard Navigation:** Full keyboard accessibility testing

## Test Structure

```
Fleet/
├── e2e/                                 # Playwright E2E tests
│   ├── helpers/
│   │   └── test-helpers.ts             # Reusable test utilities
│   ├── 01-main-modules.spec.ts         # MAIN section (11 modules)
│   ├── 02-management-modules.spec.ts   # MANAGEMENT section (15 modules)
│   ├── 03-procurement-communication-modules.spec.ts  # PROCUREMENT + COMMUNICATION (13 modules)
│   ├── 04-tools-modules.spec.ts        # TOOLS section (15 modules)
│   ├── 05-workflows.spec.ts            # End-to-end workflows
│   ├── 06-form-validation.spec.ts      # Form validation tests
│   └── 07-accessibility.spec.ts        # Accessibility tests
├── tests/
│   ├── api/
│   │   └── python/                     # Python API tests
│   │       ├── conftest.py             # Pytest configuration
│   │       ├── test_auth_api.py        # Authentication tests
│   │       ├── test_vehicles_api.py    # Vehicle API tests
│   │       ├── requirements.txt        # Python dependencies
│   │       └── pytest.ini              # Pytest settings
│   ├── comprehensive-test.spec.ts      # Legacy comprehensive tests
│   └── fixtures/                       # Test data
├── playwright.config.ts                # Playwright configuration
├── COMPREHENSIVE_TEST_PLAN.md          # Detailed test plan
└── TESTING_README.md                   # This file
```

## Prerequisites

### Node.js Dependencies

```bash
npm install
```

Key dependencies:
- `@playwright/test` - E2E testing framework
- `@axe-core/playwright` - Accessibility testing
- `playwright` - Browser automation

### Python Dependencies (for API tests)

```bash
cd tests/api/python
pip install -r requirements.txt
```

Key dependencies:
- `pytest` - Testing framework
- `requests` - HTTP client
- `faker` - Test data generation
- `pytest-playwright` - Playwright integration

### Browsers

Install Playwright browsers:

```bash
npx playwright install
```

## Running Tests

### Run All E2E Tests

```bash
# Run all Playwright tests
npx playwright test

# Run with UI mode (interactive)
npx playwright test --ui

# Run specific test file
npx playwright test e2e/01-main-modules.spec.ts

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Run Tests by Category

```bash
# Main modules only
npx playwright test e2e/01-main-modules

# Management modules
npx playwright test e2e/02-management-modules

# Workflows
npx playwright test e2e/05-workflows

# Form validation
npx playwright test e2e/06-form-validation

# Accessibility
npx playwright test e2e/07-accessibility
```

### Run Python API Tests

```bash
cd tests/api/python

# Run all API tests
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest test_vehicles_api.py

# Run specific test
pytest test_vehicles_api.py::TestVehicleAPI::test_get_all_vehicles

# Run smoke tests only
pytest -m smoke

# Run integration tests
pytest -m integration
```

### Visual Regression Testing

#### First Time Setup (Create Baselines)

```bash
# Generate baseline screenshots
UPDATE_SNAPSHOTS=1 npx playwright test
```

#### Verify Visual Changes

```bash
# Run tests and compare against baselines
npx playwright test

# If there are intentional changes, update baselines
UPDATE_SNAPSHOTS=1 npx playwright test
```

#### View Visual Diff Report

```bash
npx playwright show-report
```

### Accessibility Testing

```bash
# Run all accessibility tests
npx playwright test e2e/07-accessibility

# Run specific accessibility test
npx playwright test e2e/07-accessibility -g "Fleet Dashboard"

# View accessibility report
npx playwright show-report
```

## Test Reports

### HTML Report

After running tests, view the HTML report:

```bash
npx playwright show-report
```

The report includes:
- Test results (pass/fail)
- Screenshots on failure
- Video recordings (on failure)
- Test traces
- Visual diff comparisons

### JSON Report

Test results are also saved in JSON format:

```
test-results/results.json
```

### JUnit XML Report

For CI/CD integration:

```
test-results/junit.xml
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npx playwright test

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

### Python API Tests in CI

```yaml
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install Python dependencies
        run: |
          cd tests/api/python
          pip install -r requirements.txt

      - name: Run API tests
        run: |
          cd tests/api/python
          pytest -v
```

## Configuration

### Playwright Configuration

Edit `playwright.config.ts` to customize:

- Test timeout
- Number of retries
- Browser configurations
- Screenshot/video settings
- Base URL
- Visual snapshot threshold

### Python Test Configuration

Edit `tests/api/python/pytest.ini` to customize:

- Test discovery patterns
- Markers
- Output verbosity
- Test parallelization

## Writing New Tests

### Adding E2E Tests

Use the helper functions from `e2e/helpers/test-helpers.ts`:

```typescript
import { test, expect } from '@playwright/test';
import {
  navigateToModule,
  takeVisualSnapshot,
  waitForPageReady,
} from './helpers/test-helpers';

test('New module test', async ({ page }) => {
  await page.goto('http://localhost:5000');
  await waitForPageReady(page);

  await navigateToModule(page, 'Module Name');
  await takeVisualSnapshot(page, 'module-name-default');

  // Add your test logic
});
```

### Adding Python API Tests

Use the fixtures from `conftest.py`:

```python
import pytest

def test_new_api_endpoint(api_client, api_base_url):
    response = api_client.get(f"{api_base_url}/new-endpoint")
    assert response.status_code == 200

    data = response.json()
    assert 'expected_field' in data
```

## Debugging Tests

### Debug in UI Mode

```bash
npx playwright test --ui
```

### Debug Specific Test

```bash
npx playwright test --debug e2e/01-main-modules.spec.ts
```

### View Test Trace

```bash
npx playwright show-trace test-results/.../trace.zip
```

### Python Test Debugging

```bash
# Run with print statements visible
pytest -s

# Run with debugger
pytest --pdb

# Run specific test with verbose output
pytest -vv test_file.py::test_function
```

## Best Practices

### E2E Tests

1. **Use helper functions** - Keep tests DRY with shared utilities
2. **Wait for page ready** - Always wait for network idle before interactions
3. **Take visual snapshots** - Capture visual state for regression testing
4. **Use descriptive names** - Name snapshots clearly (e.g., `module-name-state`)
5. **Test user workflows** - Test complete business processes, not just individual pages
6. **Handle dynamic data** - Account for varying data in assertions
7. **Keep tests independent** - Each test should be able to run in isolation

### Accessibility Tests

1. **Run on all pages** - Every page should be scanned
2. **Fix critical violations** - Prioritize critical and serious issues
3. **Test keyboard navigation** - Verify all functionality is keyboard-accessible
4. **Check focus management** - Ensure focus is always visible and logical
5. **Verify ARIA labels** - All interactive elements need accessible names

### Visual Regression Tests

1. **Disable animations** - Use `animations: 'disabled'` for consistent snapshots
2. **Wait for stability** - Ensure page is fully rendered before capturing
3. **Use appropriate thresholds** - Allow small acceptable differences
4. **Update intentionally** - Only update baselines for actual design changes
5. **Test responsive views** - Capture mobile, tablet, and desktop views

## Troubleshooting

### Tests Timing Out

- Increase timeout in `playwright.config.ts`
- Check if application is running
- Verify network connectivity

### Visual Regression Failures

- Review diff in HTML report
- Check if changes are intentional
- Update snapshots if changes are expected: `UPDATE_SNAPSHOTS=1 npx playwright test`

### API Tests Failing

- Verify API server is running
- Check base URL configuration
- Verify authentication token

### Accessibility Violations

- Review violations in console output
- Use browser DevTools to inspect elements
- Refer to WCAG guidelines for fixes

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Pytest Documentation](https://docs.pytest.org/)

## Support

For questions or issues with the test suite, please:

1. Check this README
2. Review the test plan in `COMPREHENSIVE_TEST_PLAN.md`
3. Open an issue in the repository
4. Contact the QA team

---

**Last Updated:** 2025-11-12
**Version:** 1.0
**Maintainers:** QA Team
