# Fleet-CTA E2E Tests - Quick Reference

## 🚀 Quick Start (60 seconds)

```bash
# Terminal 1: Start Frontend
npm run dev
# Opens on http://localhost:5173

# Terminal 2: Start Backend
cd api && npm run dev
# Runs on http://localhost:3001

# Terminal 3: Run Tests
npm test:e2e
# Or: npx playwright test
```

## 📋 Common Commands

### Run Tests

```bash
# All tests
npx playwright test

# Specific suite
npx playwright test 01-authentication-flows.spec.ts
npx playwright test 02-fleet-dashboard-operations.spec.ts
npx playwright test 03-driver-management.spec.ts
npx playwright test 04-reporting-and-export.spec.ts
npx playwright test 05-mobile-responsive.spec.ts
npx playwright test 06-error-recovery.spec.ts
npx playwright test 07-cross-module-workflows.spec.ts

# Matching pattern
npx playwright test -g "should login"
npx playwright test -g "Fleet"
```

### Debug & Visualization

```bash
# Interactive UI mode
npx playwright test --ui

# Debug mode (step through)
npx playwright test --debug

# Watch browser (headed mode)
npx playwright test --headed

# Slow motion
npx playwright test --headed --slow-mo=500

# Show report
npx playwright show-report
```

### Specific Browsers

```bash
# Chrome
npx playwright test --project=chromium

# Firefox
npx playwright test --project=firefox

# Safari
npx playwright test --project=webkit

# All browsers
npx playwright test --project=chromium --project=firefox --project=webkit
```

### Performance

```bash
# Serial (1 worker)
npx playwright test --workers=1

# 4 workers
npx playwright test --workers=4

# List output (shows duration)
npx playwright test --reporter=list
```

## 🔐 Test Credentials

```
Email:    admin@fleet.local
Password: Fleet@2026
```

## 📁 Test Files

| File | Tests | Coverage |
|------|-------|----------|
| `01-authentication-flows.spec.ts` | 20+ | Login, session, validation |
| `02-fleet-dashboard-operations.spec.ts` | 30+ | Vehicles, tracking, analytics |
| `03-driver-management.spec.ts` | 30+ | Drivers, performance |
| `04-reporting-and-export.spec.ts` | 25+ | Reports, exports |
| `05-mobile-responsive.spec.ts` | 20+ | Mobile, responsive |
| `06-error-recovery.spec.ts` | 25+ | Errors, recovery |
| `07-cross-module-workflows.spec.ts` | 15+ | End-to-end workflows |

## 🧪 Test Helper Functions

```typescript
import {
  login,
  logout,
  waitForNetworkIdle,
  clickNavMenuItem,
  search,
  applyFilter,
  submitForm,
  exportData,
  hasErrorMessage,
  getErrorMessages,
  waitForTableToLoad,
  getTableRows,
  waitForModal,
  closeModal,
} from './helpers/test-setup';

// Login
await login(page, DEFAULT_CREDENTIALS);

// Navigate
await clickNavMenuItem(page, 'Fleet');
await waitForNetworkIdle(page);

// Search & Filter
await search(page, 'unit-101');
await applyFilter(page, 'Status', 'Active');

// Tables
await waitForTableToLoad(page, 'table', 1);
const rows = await getTableRows(page, 'table');

// Forms
await submitForm(page, { email: 'test@test.com', password: 'pass' }, 'Submit');

// Export
const filename = await exportData(page, 'CSV');

// Error handling
const hasError = await hasErrorMessage(page);
const errors = await getErrorMessages(page);
```

## 🐛 Troubleshooting

### Tests timeout
```bash
# Check if servers running
curl http://localhost:5173
curl http://localhost:3001/api/health

# Run with more time
npx playwright test --timeout=60000

# Debug specific test
npx playwright test 01-authentication-flows.spec.ts -g "should login" --debug
```

### Login fails
```bash
# Check credentials
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fleet.local","password":"Fleet@2026"}'

# Reset database
cd api && npm run db:reset
```

### Navigation issues
```bash
# Run headed to see what's happening
npx playwright test --headed

# Verbose output
npx playwright test --reporter=list

# Check page source
npx playwright test -g "specific-test" --debug
```

### Memory errors
```bash
# Run serially (1 worker)
npx playwright test --workers=1

# Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096" npx playwright test
```

## 📊 Viewing Results

```bash
# Open HTML report
npx playwright show-report

# List all artifacts
ls -la test-results/

# View video
open test-results/videos/*.webm

# View trace
npx playwright show-trace test-results/trace.zip
```

## 🎯 Test Structure Template

```typescript
import { test, expect } from '@playwright/test';
import { login, DEFAULT_CREDENTIALS, waitForNetworkIdle } from './helpers/test-setup';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, DEFAULT_CREDENTIALS);
  });

  test('should do something', async ({ page }) => {
    // Setup
    // Act
    // Assert
    expect(true).toBeTruthy();
  });
});
```

## 🔄 Workflow Examples

### Login Workflow
```typescript
await login(page, DEFAULT_CREDENTIALS);
// Returns: logged in, at dashboard
```

### Fleet Search Workflow
```typescript
await clickNavMenuItem(page, 'Fleet');
await waitForNetworkIdle(page);
await search(page, '101');
await waitForNetworkIdle(page);
// Returns: filtered fleet list
```

### Report Export Workflow
```typescript
await clickNavMenuItem(page, 'Fleet');
await waitForNetworkIdle(page);
const filename = await exportData(page, 'CSV');
// Returns: exported file name or null
```

### Error Handling
```typescript
const hasError = await hasErrorMessage(page, 3000);
if (hasError) {
  const errors = await getErrorMessages(page);
  console.log(errors);
}
```

## 📝 Writing New Tests

### 1. Create file: `tests/e2e/NN-feature.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { login, DEFAULT_CREDENTIALS, waitForNetworkIdle } from './helpers/test-setup';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, DEFAULT_CREDENTIALS);
  });

  test('should [action] [expected]', async ({ page }) => {
    // Test code
  });
});
```

### 2. Run test
```bash
npx playwright test tests/e2e/NN-feature.spec.ts
```

### 3. Debug if needed
```bash
npx playwright test tests/e2e/NN-feature.spec.ts --debug
```

## 🎬 Recording Videos

Videos auto-record in `test-results/`:

```bash
# View videos
open test-results/*.webm

# Slow down video (500ms delay)
npx playwright test --headed --slow-mo=500
```

## 📸 Screenshots

Captured automatically on test completion:

```bash
# Manual screenshot
await page.screenshot({ path: 'screenshot.png', fullPage: true });

# View screenshots
open test-results/*.png
```

## 🚦 CI/CD Mode

Run tests as they would in CI:

```bash
CI=true npx playwright test

# Equivalent to:
npx playwright test --workers=1 --retries=2
```

## 📈 Performance Monitoring

```bash
# Show test duration
npx playwright test --reporter=list

# Example output:
# ✓ should login (2.3s)
# ✓ should load fleet (3.1s)
```

## 🔗 Related Documentation

- **Main Guide**: `E2E_TEST_GUIDE.md` (comprehensive 400+ lines)
- **Technical Details**: `tests/e2e/README.md`
- **Summary**: `E2E_TESTS_SUMMARY.md`

## 🌐 URLs

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`
- API Health: `http://localhost:3001/api/health`
- Reports: `playwright-report/index.html`

## 💡 Pro Tips

1. **Use `--ui` mode for interactive debugging**
   ```bash
   npx playwright test --ui
   ```

2. **Use `--headed` to see browser**
   ```bash
   npx playwright test --headed
   ```

3. **Use `-g` to run matching tests**
   ```bash
   npx playwright test -g "login"
   ```

4. **Use `--debug` to step through**
   ```bash
   npx playwright test --debug
   ```

5. **Check `test-results/` for artifacts**
   - Videos: `.webm` files
   - Screenshots: `.png` files
   - Traces: `.zip` files

## ⚡ Quick Test Counts

```
Total Tests:     100+
Auth:           20+
Fleet:          30+
Drivers:        30+
Reports:        25+
Mobile:         20+
Errors:         25+
Cross-Module:   15+
```

## 📞 Need Help?

1. Check `E2E_TEST_GUIDE.md` - Troubleshooting section
2. Run test with `--debug` flag
3. Check server logs
4. Open `playwright-report/` for test details

## 🎯 Success Indicators

- ✓ All servers running (frontend, backend)
- ✓ Test credentials working
- ✓ Database seeded with data
- ✓ Tests passing 95%+
- ✓ No timeout errors
- ✓ No API 500 errors

## 🚀 Get Started Now

```bash
# 1. Ensure servers running (see Quick Start)

# 2. Run all tests
npm test:e2e

# 3. View report
npx playwright show-report

# 4. Done!
```

---

**Last Updated:** February 2025
**Test Count:** 100+
**Pass Rate Target:** 95%+
**Execution Time:** 5-15 minutes (depending on parallelization)
