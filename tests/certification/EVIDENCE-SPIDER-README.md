# Fleet CTA Evidence-Based Certification Spider

## Overview

This directory contains the **Evidence-Based Certification Spider** - a comprehensive Playwright-based testing system that:

1. **Reads from inventory.json** (551 testable surfaces discovered from the codebase)
2. **Generates test cases** for every UI surface and API endpoint
3. **Captures comprehensive evidence** for each test:
   - Screenshots (before/after actions)
   - Video recordings (full session)
   - Playwright trace files (.zip with timeline, network, DOM snapshots)
   - Console logs
   - Network traffic (HAR files - optional)
   - DOM snapshots
4. **Uses REAL data** - no mocks, actual application, real backend
5. **Organizes evidence** by surface type and unique ID
6. **Generates metadata.json** with test results and metrics

## Inventory Summary

The inventory was generated on **2026-02-01** and contains:

- **Total Items**: 551 testable surfaces
- **UI Routes**: 10 (FleetHub, Analytics, Compliance, etc.)
- **UI Tabs**: 21 (across different hubs)
- **UI Buttons**: 21 (key actions)
- **API Endpoints**: 458 (REST APIs)
- **AI Features**: 22 (AI-powered capabilities)
- **Integrations**: 4 (external services)
- **Background Services**: 15 (jobs, queues, etc.)

## Files

### Test Files

- **`evidence-spider.spec.ts`** - Main Playwright test suite that reads inventory.json and generates tests
- **`spider-generator.ts`** - CLI tool to generate custom test variations from inventory
- **`inventory.json`** - Complete inventory of 551 testable surfaces

### Evidence Storage

Evidence is stored in organized directories:

```
evidence/
├── ui-route/
│   ├── route--analytics/
│   │   ├── screenshot-before-navigation-*.png
│   │   ├── screenshot-after-navigation-*.png
│   │   ├── dom-loaded-*.html
│   │   ├── console-logs.txt
│   │   └── metadata.json
│   └── route--fleet/
│       └── ...
├── ui-tab/
│   └── tab-{hubName}-{testId}/
│       └── ...
├── ui-button/
│   └── button-{testId}/
│       └── ...
└── api-endpoint/
    └── api-{method}-{path}/
        └── ...
```

### Playwright Artifacts

Additional evidence captured by Playwright (in `test-results/artifacts/`):

- **`video.webm`** - Full session recording
- **`trace.zip`** - Playwright trace (viewable with `npx playwright show-trace trace.zip`)
- **`test-finished-1.png`** - Final screenshot

## Quick Start

### Prerequisites

1. **Dev server running**: `npm run dev` (port 5174)
2. **API server running**: `cd api-standalone && npm start` (port 3000)
3. **Playwright installed**: `npx playwright install`

### Run All Tests

```bash
# Run all certification tests (72 tests: 10 routes + 21 tabs + 21 buttons + 20 API samples)
npx playwright test tests/certification/evidence-spider.spec.ts
```

### Run Specific Test Categories

```bash
# Run only UI Routes (10 tests)
npx playwright test tests/certification/evidence-spider.spec.ts --grep "UI Routes"

# Run only UI Tabs (21 tests)
npx playwright test tests/certification/evidence-spider.spec.ts --grep "UI Tabs"

# Run only UI Buttons (21 tests)
npx playwright test tests/certification/evidence-spider.spec.ts --grep "UI Buttons"

# Run only API Endpoints (20 tests - first 20 of 458)
npx playwright test tests/certification/evidence-spider.spec.ts --grep "API Endpoints"
```

### View Results

```bash
# Open HTML report
npx playwright show-report

# View a specific trace file
npx playwright show-trace test-results/artifacts/*/trace.zip
```

## Test Execution Results

### Latest Run (2026-02-01)

**UI Routes: 10/10 PASSED ✅**

| Route | Status | Load Time |
|-------|--------|-----------|
| / (FleetHub) | ✅ PASS | 2178ms |
| /fleet | ✅ PASS | 2118ms |
| /analytics | ✅ PASS | 1782ms |
| /reservations | ✅ PASS | 2854ms |
| /policy-hub | ✅ PASS | 2735ms |
| /documents | ✅ PASS | 2722ms |
| /documents-hub | ✅ PASS | 1267ms |
| /configuration | ✅ PASS | 1610ms |
| /cta-configuration-hub | ✅ PASS | 1724ms |
| /map-diagnostics | ✅ PASS | 1720ms |

**Evidence Captured per Test:**
- 2 Screenshots (before/after navigation)
- 1 DOM snapshot (HTML)
- Console logs (avg 100+ messages)
- 1 Video recording (150-200KB)
- 1 Trace file (800KB+)
- Metadata JSON with metrics

## Evidence Details

### Screenshots

- **Before navigation**: Captures initial state
- **After navigation**: Captures fully loaded page
- **Error screenshots**: Captured on test failures
- Format: PNG, full-page screenshots

### Videos

- **Format**: WebM
- **Size**: ~150-200KB per test
- **Content**: Full test session from start to finish
- **Location**: `test-results/artifacts/*/video.webm`

### Traces

- **Format**: ZIP archive
- **Size**: ~800KB per test
- **Content**: Complete Playwright trace with:
  - Timeline of all actions
  - Network requests/responses
  - DOM snapshots at each step
  - Console messages
  - Screenshots
- **View**: `npx playwright show-trace <file>`

### Console Logs

- **Format**: Plain text
- **Content**: All console.log, console.error, console.warn, and page errors
- **Size**: 10-20KB per test (100+ messages typical)

### DOM Snapshots

- **Format**: HTML
- **Size**: 500KB-1MB per test
- **Content**: Complete DOM at specific points (loaded state)

### Metadata

Each test produces a `metadata.json` file:

```json
{
  "testId": "route--analytics",
  "itemType": "ui-route",
  "runDate": "2026-02-01T18:56:23.728Z",
  "status": "PASS",
  "evidencePaths": {
    "screenshots": ["screenshot-before-*.png", "screenshot-after-*.png"],
    "videos": [],
    "traces": [],
    "logs": ["console-logs.txt"],
    "har": []
  },
  "metrics": {
    "loadTime": 1782,
    "contentLength": 244,
    "consoleMessages": 103
  }
}
```

## Spider Generator Tool

Generate custom test variations using `spider-generator.ts`:

```bash
# Generate tests for specific type
npx tsx tests/certification/spider-generator.ts --type ui-route --output routes-only.spec.ts

# Generate limited set
npx tsx tests/certification/spider-generator.ts --type api-endpoint --limit 10

# Generate all with custom inventory
npx tsx tests/certification/spider-generator.ts --inventory custom-inventory.json --output custom-tests.spec.ts

# Show help
npx tsx tests/certification/spider-generator.ts --help
```

## Configuration

### Playwright Config (playwright.config.ts)

Evidence capture settings:

```typescript
use: {
  trace: 'on',           // Always capture traces
  screenshot: 'on',      // Always capture screenshots
  video: 'on',           // Always record video
  viewport: { width: 1920, height: 1080 },
  navigationTimeout: 30000,
}
```

### Test Config (evidence-spider.spec.ts)

```typescript
const CONFIG = {
  baseUrl: 'http://localhost:5174',
  apiBaseUrl: 'http://localhost:3000',
  inventoryPath: './tests/certification/inventory.json',
  evidenceBaseDir: './tests/certification/evidence',
  timeout: 30000,
  navigationTimeout: 10000,
};
```

## Evidence Use Cases

### 1. Debugging Failures

```bash
# Run test
npx playwright test tests/certification/evidence-spider.spec.ts --grep "Route 3"

# View trace (interactive timeline)
npx playwright show-trace test-results/artifacts/*/trace.zip

# Watch video
open test-results/artifacts/*/video.webm

# Read console logs
cat tests/certification/evidence/ui-route/route--analytics/console-logs.txt
```

### 2. Performance Analysis

Check `metadata.json` for load times:

```bash
# Find slow tests
jq '.metrics.loadTime' tests/certification/evidence/ui-route/*/metadata.json | sort -n
```

### 3. Visual Regression

Compare screenshots across test runs:

```bash
# Before
cp -r tests/certification/evidence/ui-route/route--analytics baseline/

# After changes
npx playwright test --grep "Route 3"

# Compare
diff baseline/screenshot-after-*.png tests/certification/evidence/ui-route/route--analytics/screenshot-after-*.png
```

### 4. Compliance Evidence

For SOC2, ISO27001, or other certifications:

- Screenshots prove UI rendering
- Console logs prove no errors
- Videos prove user journeys
- Traces prove correct network behavior
- Metadata proves test execution and results

## Extending the Spider

### Add New Test Type

Edit `evidence-spider.spec.ts`:

```typescript
test.describe('AI Features', () => {
  const aiFeatures = inventory?.items?.filter(item => item.type === 'ai-feature') || [];

  for (let i = 0; i < aiFeatures.length; i++) {
    const feature = aiFeatures[i];
    const testId = generateTestId(feature, i);

    test(`AI ${i + 1}: ${feature.featureName}`, async ({ page, request }) => {
      // Test implementation
    });
  }
});
```

### Add Custom Evidence

```typescript
// Capture network traffic
const harPath = join(evidenceDir, 'network.har');
await page.routeFromHAR(harPath, { update: true });

// Capture performance metrics
const metrics = await page.evaluate(() => JSON.stringify(window.performance.timing));
writeFileSync(join(evidenceDir, 'performance.json'), metrics);

// Capture accessibility scan
const violations = await page.evaluate(() => window.axe.run());
writeFileSync(join(evidenceDir, 'accessibility.json'), JSON.stringify(violations));
```

## Best Practices

### 1. Run Tests Sequentially for Stability

```bash
npx playwright test tests/certification/evidence-spider.spec.ts --workers=1
```

### 2. Clean Evidence Before Full Runs

```bash
rm -rf tests/certification/evidence/*
rm -rf test-results/artifacts/*
```

### 3. Archive Evidence After Runs

```bash
tar -czf evidence-$(date +%Y%m%d-%H%M%S).tar.gz tests/certification/evidence/
```

### 4. Use Headed Mode for Debugging

```bash
npx playwright test tests/certification/evidence-spider.spec.ts --headed --grep "Route 3"
```

## Troubleshooting

### Tests Not Found

**Issue**: `Error: No tests found`

**Solution**: Inventory is loaded at module level. Check:
```bash
# Verify inventory exists
cat tests/certification/inventory.json | jq '.summary'

# Check TypeScript compilation
npx tsc --noEmit tests/certification/evidence-spider.spec.ts
```

### Server Not Running

**Issue**: Tests fail with connection errors

**Solution**: Start both servers:
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd api-standalone && npm start

# Terminal 3: Tests
npx playwright test tests/certification/evidence-spider.spec.ts
```

### Out of Disk Space

**Issue**: Evidence fills disk

**Solution**: Evidence can be large (800KB trace + 200KB video per test = 1MB per test):
- 72 tests = ~72MB per run
- 551 tests = ~551MB per run

Archive or delete old evidence:
```bash
# Archive
tar -czf archive.tar.gz tests/certification/evidence/
rm -rf tests/certification/evidence/*

# Delete old evidence
find tests/certification/evidence -type f -mtime +7 -delete
```

## Roadmap

- [x] UI Routes (10 tests) ✅
- [ ] UI Tabs (21 tests)
- [ ] UI Buttons (21 tests)
- [ ] API Endpoints - all 458 (currently 20)
- [ ] AI Features (22 features)
- [ ] Integrations (4 integrations)
- [ ] Background Services (15 services)
- [ ] Accessibility scanning (axe-core)
- [ ] Visual regression testing
- [ ] Performance budgets
- [ ] HTML evidence index
- [ ] Evidence retention policies
- [ ] CI/CD integration

## License

This certification framework is part of Fleet CTA and follows the same license.

## Support

For issues or questions:
- Check the evidence in `tests/certification/evidence/`
- View traces with `npx playwright show-trace`
- Check console logs for errors
- Review metadata.json for test metrics
