# Live Testing Guide

**Generated:** 2025-12-24T22:45:00-05:00
**Branch:** test/e2e-framework

---

## Quick Start

### Run Headed Tests (Watch Mode)
```bash
# Run all E2E tests with headed browser
npm run test:e2e:ui

# Run specific project in headed mode
npx playwright test --project=chromium --headed

# Run smoke tests with visual feedback
npx playwright test --project=smoke --headed
```

### Debug Mode
```bash
# Run with Playwright inspector
npx playwright test --debug

# Run specific test file in debug
npx playwright test tests/e2e/fleet-dashboard.spec.ts --debug
```

---

## Available Test Commands

| Command | Description |
|---------|-------------|
| `npm run test:e2e` | Run all E2E tests (headless) |
| `npm run test:e2e:ui` | Run with Playwright UI Mode |
| `npm run test:e2e:report` | Open HTML test report |
| `npm run test:e2e:chromium` | Run Chrome only |
| `npm run test:e2e:firefox` | Run Firefox only |
| `npm run test:e2e:mobile` | Run mobile browsers |
| `npm run test:e2e:dashboard` | Fleet dashboard tests |
| `npm run test:e2e:vehicles` | Vehicle management tests |
| `npm run test:e2e:drivers` | Driver management tests |
| `npm run test:e2e:rbac` | Role-based access tests |

---

## Playwright UI Mode

The most powerful way to debug tests:

```bash
npm run test:e2e:ui
```

This opens an interactive browser where you can:
- See test execution in real-time
- Step through test steps
- Inspect DOM elements
- View network requests
- Time travel through snapshots

---

## Test Artifacts

All test runs generate artifacts in:
- `test-results/` - Screenshots, videos, traces
- `playwright-report/` - HTML report

### View Report
```bash
npm run test:e2e:report
```

### View Traces
```bash
npx playwright show-trace test-results/<test-name>/trace.zip
```

---

## Headed Mode Configuration

The Playwright config supports headed mode:

```typescript
// playwright.config.ts
projects: [
  {
    name: 'chromium',
    use: {
      ...devices['Desktop Chrome'],
      viewport: { width: 1920, height: 1080 },
    }
  }
]
```

Run with `--headed` flag:
```bash
npx playwright test --project=chromium --headed
```

---

## Test Patterns

### Smoke Tests
Quick validation of critical paths:
```bash
npm run test:e2e -- --project=smoke
```

### Visual Regression
Screenshot comparison tests:
```bash
npm run test:e2e -- --project=visual-chromium
npx playwright test --update-snapshots  # Update baselines
```

### Accessibility
a11y compliance tests:
```bash
npm run test:e2e -- --project=a11y
```

### Performance
Page load and metrics:
```bash
npm run test:e2e -- --project=performance
```

---

## Troubleshooting

### Browser Not Launching
```bash
npx playwright install chromium
```

### Tests Timing Out
Increase timeout in config or per-test:
```typescript
test.setTimeout(60000);
```

### Display Issues (Headless Linux)
```bash
apt-get install xvfb
xvfb-run npx playwright test
```

---

## Remote Testing (Azure VM)

### Option A: noVNC Setup
1. Install Xfce desktop
2. Start VNC server
3. Access via noVNC in browser
4. Run headed tests

### Option B: RDP
1. Enable RDP on VM
2. Connect via Remote Desktop
3. Run headed tests in terminal

---

## Evidence Requirements

For production readiness certification:
1. ✅ All smoke tests passing
2. ✅ RBAC allow/deny tests passing
3. ✅ Screenshot evidence in test-results/
4. ✅ HTML report available
5. ✅ Trace files for failed tests
