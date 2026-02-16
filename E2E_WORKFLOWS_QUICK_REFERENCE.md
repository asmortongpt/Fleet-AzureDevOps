# E2E Workflow Tests - Quick Reference Guide

## Test Files at a Glance

```
tests/e2e/
├── 08-fleet-workflows.spec.ts                    (40 tests)
├── 09-driver-workflows.spec.ts                   (40 tests)
├── 10-maintenance-telematics-workflows.spec.ts   (50 tests)
├── 11-alerts-multitenant-workflows.spec.ts       (35 tests)
├── 12-error-recovery-advanced-workflows.spec.ts  (40 tests)
└── helpers/
    └── test-setup.ts                             (35+ helper functions)
```

## Workflow Coverage Map

### Fleet Management (40 tests)
```typescript
test.describe('Fleet Management Workflows', () => {
  // NEW VEHICLE ADDITION (8 tests)
  - Navigate fleet management
  - Add vehicle form
  - Validate VIN/plate
  - Add vehicle
  - Verify in list
  - Search for vehicle

  // VEHICLE ASSIGNMENT (8 tests)
  - Navigate vehicle detail
  - Assign driver
  - Select from list
  - Verify assignment
  - Confirm in detail

  // STATUS TRANSITIONS (6 tests)
  - Change to Maintenance
  - Verify status change
  - Verify in API

  // BULK OPERATIONS (6 tests)
  - Sort by column
  - Filter by status
  - Export CSV
  - Paginate

  // SEARCH & DISCOVERY (4 tests)
  - Search by VIN
  - Search by plate
  - Clear search
  - No results handling
})
```

### Driver Management (40 tests)
```typescript
test.describe('Driver Management Workflows', () => {
  // ONBOARDING (10 tests)
  - Navigate drivers
  - Open add form
  - Fill details
  - Verify creation
  - Assign to vehicle

  // LICENSE RENEWAL (8 tests)
  - Show license info
  - Open renewal form
  - Update expiry
  - Verify renewal

  // CERTIFICATIONS (8 tests)
  - Add certification
  - Set type/expiry
  - Save cert
  - Display in profile

  // PERFORMANCE (6 tests)
  - Show metrics
  - Safety score
  - Violation history
  - Filter by time

  // LIST & SEARCH (4 tests)
  - Display drivers
  - Search by name
  - Filter by status
  - Sort by column
})
```

### Maintenance & Telematics (50 tests)
```typescript
test.describe('Maintenance & Telematics Workflows', () => {
  // SCHEDULED MAINTENANCE (10 tests)
  - Navigate maintenance
  - Open add form
  - Select vehicle
  - Set type/date
  - Save record

  // UNSCHEDULED MAINTENANCE (8 tests)
  - Create urgent request
  - Assign technician
  - Set priority
  - Submit request

  // REAL-TIME TRACKING (8 tests)
  - Navigate tracking
  - Show GPS position
  - Show speed/direction
  - Show alerts
  - Update in real-time

  // ROUTE COMPLIANCE (10 tests)
  - Navigate routes
  - Show route details
  - Check in waypoint
  - Complete route
  - Export report

  // PERFORMANCE ANALYSIS (7 tests)
  - Navigate analytics
  - Show metrics
  - Select time range
  - Generate report
})
```

### Alerts & Multi-Tenant (35 tests)
```typescript
test.describe('Alerts & Multi-Tenant Workflows', () => {
  // ALERT HANDLING (10 tests)
  - Navigate alerts
  - Show alert details
  - Acknowledge alert
  - Add comment
  - Filter by severity
  - Export report

  // NOTIFICATION PREFERENCES (10 tests)
  - Navigate settings
  - Enable/disable alerts
  - Set severity threshold
  - Email/SMS/in-app options
  - Save preferences

  // MULTI-TENANT ISOLATION (15 tests)
  - Isolate vehicle list
  - Block other tenant search
  - Isolate drivers
  - Isolate alerts/maintenance
  - Verify API isolation
  - Block tenant switching
  - Role-based access
  - Audit logging
})
```

### Error Recovery & Advanced (40 tests)
```typescript
test.describe('Error Recovery & Advanced Workflows', () => {
  // VALIDATION ERRORS (8 tests)
  - Show empty field error
  - Persist user input
  - Clear errors on fix
  - Show multiple errors
  - Allow resubmission

  // NETWORK ERRORS (8 tests)
  - Handle offline mode
  - Show error message
  - Allow retry
  - Preserve form data
  - Prevent duplicates
  - Timeout handling

  // PERMISSION CONTROL (8 tests)
  - Restrict unauth access
  - Show access denied
  - Disable UI elements
  - Block API calls
  - Log attempts

  // COMPLEX WORKFLOWS (8 tests)
  - Full vehicle lifecycle
  - Driver assignment
  - Concurrent updates
  - Rapid submissions
  - Modal handling
})
```

## Running Tests

### Run All Workflow Tests
```bash
npx playwright test tests/e2e/0[8-9]-*.spec.ts tests/e2e/1[0-2]-*.spec.ts
```

### Run Specific Workflow
```bash
# Fleet workflows
npx playwright test 08-fleet-workflows.spec.ts

# Driver workflows
npx playwright test 09-driver-workflows.spec.ts

# Maintenance & telematics
npx playwright test 10-maintenance-telematics-workflows.spec.ts

# Alerts & multi-tenant
npx playwright test 11-alerts-multitenant-workflows.spec.ts

# Error recovery
npx playwright test 12-error-recovery-advanced-workflows.spec.ts
```

### Run Specific Test
```bash
npx playwright test 08-fleet-workflows.spec.ts -g "should successfully add vehicle"
```

### Run with Options
```bash
# With UI
npx playwright test 08-fleet-workflows.spec.ts --ui

# Headed mode (see browser)
npx playwright test 08-fleet-workflows.spec.ts --headed

# Debug mode
npx playwright test 08-fleet-workflows.spec.ts --debug

# Headed + verbose
npx playwright test 08-fleet-workflows.spec.ts --headed --debug
```

## Helper Functions Quick Reference

### Authentication
```typescript
await login(page, DEFAULT_CREDENTIALS);
await logout(page);
await isAuthenticated(page);
```

### Navigation
```typescript
await navigateTo(page, '/vehicles');
await clickNavMenuItem(page, 'Fleet');
```

### Data Operations
```typescript
await waitForTableToLoad(page, 'table', 1);
const rows = await getTableRows(page, 'table');
await search(page, 'search term');
await applyFilter(page, 'Status', 'Active');
```

### Forms & Modals
```typescript
await submitForm(page, formData, 'Submit');
await waitForModal(page, 'Add Vehicle');
await closeModal(page);
```

### Error Handling
```typescript
const hasError = await hasErrorMessage(page);
const errors = await getErrorMessages(page);
```

### Export & API
```typescript
await exportData(page, 'CSV');
await checkApiResponse(page, '/api/vehicles', 200);
```

### Accessibility
```typescript
const issues = await verifyAccessibility(page);
```

## Test Credentials

```
Email:    admin@fleet.local
Password: Fleet@2026
```

Or pass custom credentials:
```typescript
await login(page, {
  email: 'user@example.com',
  password: 'password123'
});
```

## Common Test Patterns

### Wait for Content
```typescript
await waitForNetworkIdle(page);
await page.waitForLoadState('domcontentloaded');
await expect(page).toHaveURL(/expected-url/);
```

### Handle Optional Elements
```typescript
const button = page.locator('button:has-text("Action")');
const isVisible = await button.isVisible({ timeout: 2000 }).catch(() => false);
if (isVisible) {
  await button.click();
}
```

### Fill & Submit Form
```typescript
const input = page.locator('input[name="fieldName"]');
await input.fill('value');
const submitButton = page.locator('button[type="submit"]');
await submitButton.click();
```

### Read Table Data
```typescript
await waitForTableToLoad(page, 'table');
const rows = await getTableRows(page, 'table');
const hasRow = rows.some(row => row.Name === 'TestName');
```

## Troubleshooting

### Tests Timing Out
```bash
# Increase timeout
npx playwright test 08-fleet-workflows.spec.ts --timeout=60000

# Check servers
curl http://localhost:5173
curl http://localhost:3001/api/health
```

### Authentication Issues
```bash
# Clear cookies
# Update test user credentials in database
# Verify test user exists in DB
```

### API Errors
```bash
# Verify backend running
curl http://localhost:3001/api/health

# Check API logs
# Verify database connection
```

### Element Not Found
```bash
# Use headed mode to see browser
npx playwright test 08-fleet-workflows.spec.ts --headed

# Use debug mode to step through
npx playwright test 08-fleet-workflows.spec.ts --debug

# Update element selectors if page changed
```

## Test Structure

Each test follows this pattern:
```typescript
test('should do something specific', async ({ page }) => {
  // 1. Setup/Navigate
  await navigateTo(page, '/path');

  // 2. Act (user interaction)
  await button.click();

  // 3. Wait (for network/UI updates)
  await waitForNetworkIdle(page);

  // 4. Assert (verify result)
  expect(page.url()).toContain('expected');
  expect(await hasErrorMessage(page)).toBeFalsy();
});
```

## Key Points

- ✓ Tests are independent (no test depends on another)
- ✓ Tests use real data, not mocks
- ✓ Tests verify both UI and API
- ✓ Tests handle optional elements gracefully
- ✓ Tests check for errors and exceptions
- ✓ Tests clean up after themselves (logout)
- ✓ Tests use descriptive names
- ✓ Tests run in parallel by default

## Documentation

- Detailed guide: `/tests/e2e/README.md`
- Full summary: `/E2E_WORKFLOW_TESTS_SUMMARY.md`
- This quick ref: `/E2E_WORKFLOWS_QUICK_REFERENCE.md`

## Coverage Summary

| Module | Tests | Coverage |
|--------|-------|----------|
| Fleet Management | 40 | Add, assign, status, bulk ops, search |
| Driver Management | 40 | Onboard, license, certs, performance |
| Maintenance & Telematics | 50 | Schedule, track, routes, analytics |
| Alerts & Multi-tenant | 35 | Alerts, preferences, isolation |
| Error Recovery | 40 | Validation, network, permissions |
| **Total** | **175+** | **All major workflows** |

---

**Need help?** Check the full README at `/tests/e2e/README.md`
