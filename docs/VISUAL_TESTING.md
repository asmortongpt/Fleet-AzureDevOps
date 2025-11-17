# Visual Regression Testing Guide

Comprehensive guide for visual regression testing of map components using Playwright.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Running Tests](#running-tests)
- [Writing Visual Tests](#writing-visual-tests)
- [Updating Baselines](#updating-baselines)
- [Reviewing Visual Diffs](#reviewing-visual-diffs)
- [CI/CD Integration](#cicd-integration)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Visual regression testing ensures that UI changes don't inadvertently break the visual appearance of map components. Our test suite uses Playwright to capture screenshots and compare them against baseline images.

### What's Covered

- ✅ All map components (UniversalMap, LeafletMap, GoogleMap, MapboxMap)
- ✅ Multiple map providers (Leaflet, Google Maps)
- ✅ All map styles (OSM, Dark, Topo, Satellite, etc.)
- ✅ Different marker types and states (vehicles, facilities, cameras)
- ✅ Loading and error states
- ✅ Responsive layouts (mobile, tablet, desktop)
- ✅ Dark/light themes
- ✅ Different zoom levels
- ✅ Interactive states (hover, click, focus)
- ✅ Cross-browser testing (Chrome, Firefox, Safari)

## Getting Started

### Prerequisites

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install --with-deps
```

### Directory Structure

```
tests/visual/
├── helpers/
│   └── visual-test-helpers.ts    # Reusable test utilities
├── fixtures/
│   └── map-test-data.ts          # Test data fixtures
├── UniversalMap.visual.spec.ts   # UniversalMap component tests
├── LeafletMap.visual.spec.ts     # LeafletMap component tests
├── cross-browser.visual.spec.ts  # Cross-browser tests
└── *-snapshots/                  # Baseline screenshots (auto-generated)
```

## Running Tests

### Basic Commands

```bash
# Run all visual tests (Chromium only)
npm run test:visual

# Run visual tests with UI mode (recommended for development)
npm run test:visual:ui

# Run visual tests in headed mode (see browser)
npm run test:visual:headed

# Run cross-browser visual tests
npm run test:visual:cross-browser

# Run mobile visual tests
npm run test:visual:mobile

# Debug a specific test
npm run test:visual:debug
```

### Running Specific Tests

```bash
# Run tests for a specific file
npx playwright test tests/visual/UniversalMap.visual.spec.ts --project=visual-chromium

# Run a specific test by name
npx playwright test -g "should render empty map" --project=visual-chromium

# Run tests for a specific describe block
npx playwright test -g "Default State" --project=visual-chromium
```

### Viewing Reports

```bash
# View test report (HTML)
npm run test:visual:report

# View last test report
npx playwright show-report
```

## Writing Visual Tests

### Basic Visual Test

```typescript
import { test } from '@playwright/test';
import {
  waitForMapLoad,
  stabilizeMap,
  takeVisualSnapshot,
  disableAnimations,
} from './helpers/visual-test-helpers';

test('should render map correctly', async ({ page }) => {
  await page.goto('/');
  await disableAnimations(page);
  await waitForMapLoad(page);
  await stabilizeMap(page);
  await takeVisualSnapshot(page, 'my-map-test');
});
```

### Testing Different States

```typescript
test('should render all vehicle statuses', async ({ page }) => {
  // Inject test data
  await page.evaluate((vehicles) => {
    (window as any).__TEST_DATA__ = { vehicles, facilities: [], cameras: [] };
  }, VEHICLE_STATUS_EXAMPLES);

  await page.reload();
  await waitForMapLoad(page);
  await waitForMarkers(page, VEHICLE_STATUS_EXAMPLES.length);
  await stabilizeMap(page);
  await takeVisualSnapshot(page, 'vehicle-statuses');
});
```

### Testing Responsive Layouts

```typescript
import { VIEWPORTS } from './helpers/visual-test-helpers';

test('should render correctly on mobile', async ({ page }) => {
  await page.setViewportSize(VIEWPORTS.mobile);
  await page.goto('/');
  await waitForMapLoad(page);
  await stabilizeMap(page);
  await takeVisualSnapshot(page, 'map-mobile');
});
```

### Testing Interactive States

```typescript
test('should render marker popup', async ({ page }) => {
  await page.goto('/');
  await waitForMapLoad(page);
  await waitForMarkers(page, 1);

  // Click marker to open popup
  const marker = page.locator('[class*="marker"]').first();
  await marker.click();
  await page.waitForTimeout(500);

  await takeVisualSnapshot(page, 'marker-popup');
});
```

### Testing Themes

```typescript
import { compareThemes } from './helpers/visual-test-helpers';

test('should compare light vs dark themes', async ({ page }) => {
  await page.goto('/');
  await waitForMapLoad(page);
  await stabilizeMap(page);

  // Takes screenshots of both light and dark themes
  await compareThemes(page, 'theme-comparison');
});
```

## Updating Baselines

### When to Update

Update baselines when:
- You intentionally change the visual appearance
- You update map styles or markers
- You add new features that change the UI
- Initial baseline images don't exist

### How to Update

```bash
# Update all baselines
npm run test:visual:update

# Update baselines for a specific test
npx playwright test tests/visual/UniversalMap.visual.spec.ts --update-snapshots --project=visual-chromium

# Update baselines for a specific test case
npx playwright test -g "should render empty map" --update-snapshots --project=visual-chromium
```

### Committing Baselines

```bash
# Add updated baseline images to git
git add tests/visual/**/*-snapshots/

# Commit with descriptive message
git commit -m "chore: update visual baselines for new map styles"

# Push to remote
git push
```

**Note**: Baseline images should be committed to version control to ensure consistent testing across environments.

## Reviewing Visual Diffs

### In UI Mode (Recommended)

```bash
# Start Playwright in UI mode
npm run test:visual:ui

# Features:
# - Side-by-side comparison of expected vs actual
# - Diff highlighting
# - Interactive test exploration
# - One-click baseline updates
```

### In HTML Report

```bash
# Generate and view HTML report
npm run test:visual:report

# Features:
# - Test results summary
# - Screenshot comparisons
# - Detailed error messages
# - Timeline view
```

### Understanding Diff Images

When a test fails, Playwright generates three images:

1. **Expected** (`*-expected.png`): The baseline image
2. **Actual** (`*-actual.png`): The current screenshot
3. **Diff** (`*-diff.png`): Highlighted differences

## CI/CD Integration

### GitHub Actions

Visual tests run automatically on:
- Pull requests (Chromium only by default)
- Pushes to main/master (full cross-browser suite)
- Manual workflow dispatch

### Workflow Configuration

See `.github/workflows/visual-regression.yml` for the complete configuration.

### Triggering Full Visual Tests

Add the `visual-full` label to your PR to run cross-browser and mobile tests.

### Updating Baselines in CI

Include `[update-baselines]` in your commit message to automatically update baselines in CI:

```bash
git commit -m "feat: update map marker styles [update-baselines]"
```

### Viewing CI Results

1. Go to Actions tab in GitHub
2. Select the "Visual Regression Testing" workflow
3. Download artifacts to view screenshots and reports

## Best Practices

### 1. Disable Animations

Always disable animations for consistent screenshots:

```typescript
import { disableAnimations, stabilizeMap } from './helpers/visual-test-helpers';

test('my visual test', async ({ page }) => {
  await disableAnimations(page);
  await stabilizeMap(page);
  // ... rest of test
});
```

### 2. Wait for Map to Load

Maps require async tile loading. Always wait:

```typescript
import { waitForMapLoad, waitForMarkers } from './helpers/visual-test-helpers';

test('map with markers', async ({ page }) => {
  await page.goto('/');
  await waitForMapLoad(page);
  await waitForMarkers(page, expectedCount);
  // ... take screenshot
});
```

### 3. Use Consistent Test Data

Use fixtures from `fixtures/map-test-data.ts`:

```typescript
import { MULTIPLE_VEHICLES, MULTIPLE_FACILITIES } from './fixtures/map-test-data';

test('map with test data', async ({ page }) => {
  await page.evaluate((data) => {
    (window as any).__TEST_DATA__ = data;
  }, { vehicles: MULTIPLE_VEHICLES, facilities: MULTIPLE_FACILITIES });
  // ... rest of test
});
```

### 4. Set Appropriate Thresholds

Different scenarios need different thresholds:

```typescript
// Static content - strict threshold
await takeVisualSnapshot(page, 'static-ui', {
  threshold: 0.1,
  maxDiffPixels: 50,
});

// Dynamic content (maps, charts) - lenient threshold
await takeVisualSnapshot(page, 'map-view', {
  threshold: 0.3,
  maxDiffPixels: 200,
});
```

### 5. Mask Dynamic Content

Mask elements that change frequently:

```typescript
await expect(page).toHaveScreenshot('map-with-timestamp.png', {
  mask: [page.locator('.timestamp'), page.locator('.live-data')],
});
```

### 6. Test at Multiple Breakpoints

```typescript
import { VIEWPORTS, takeResponsiveSnapshots } from './helpers/visual-test-helpers';

test('responsive map', async ({ page }) => {
  await page.goto('/');
  await waitForMapLoad(page);

  await takeResponsiveSnapshots(
    page,
    'map-responsive',
    ['mobile', 'tablet', 'desktop', 'desktopLarge']
  );
});
```

### 7. Name Screenshots Descriptively

```typescript
// ❌ Bad
await takeVisualSnapshot(page, 'test1');

// ✅ Good
await takeVisualSnapshot(page, 'universal-map-vehicle-emergency-status');
```

## Troubleshooting

### Tests Fail Locally But Pass in CI

**Problem**: Different rendering across environments

**Solutions**:
1. Update baselines on the same OS as CI (Linux)
2. Use consistent browser versions
3. Increase threshold for environment-specific variations

```typescript
await takeVisualSnapshot(page, 'test', {
  threshold: 0.25, // More lenient
  maxDiffPixels: 200,
});
```

### Flaky Visual Tests

**Problem**: Screenshots differ between runs

**Solutions**:
1. Ensure animations are disabled
2. Add proper wait conditions
3. Stabilize map view

```typescript
await disableAnimations(page);
await waitForMapLoad(page);
await stabilizeMap(page);
await page.waitForTimeout(500); // Additional settling time
```

### Font Rendering Differences

**Problem**: Fonts render differently across browsers

**Solutions**:
1. Increase threshold for text-heavy screenshots
2. Use system fonts that render consistently
3. Mask text elements if necessary

```typescript
await takeVisualSnapshot(page, 'text-content', {
  threshold: 0.2,
  mask: [page.locator('.dynamic-text')],
});
```

### Map Tiles Not Loading

**Problem**: Blank map in screenshots

**Solutions**:
1. Increase timeout for map loading
2. Check network connectivity
3. Verify tile server URLs

```typescript
await waitForMapLoad(page, 60000); // Increase timeout
await page.waitForLoadState('networkidle');
```

### Baselines Out of Sync

**Problem**: Merge conflicts in baseline images

**Solutions**:
1. Always update baselines on latest main branch
2. Update one component at a time
3. Use `[update-baselines]` commit message

```bash
git checkout main
git pull origin main
git checkout your-feature-branch
git merge main
npm run test:visual:update
git add tests/visual/**/*-snapshots/
git commit -m "chore: update visual baselines [update-baselines]"
```

### Cross-Browser Differences

**Problem**: Tests pass on Chrome but fail on Firefox/Safari

**Solutions**:
1. Use browser-specific baselines (automatic)
2. Adjust thresholds per browser
3. Test consistently

Each browser project has its own snapshots directory:
```
tests/visual/UniversalMap.visual.spec.ts-snapshots/
├── chromium/
├── firefox/
└── webkit/
```

## Performance Considerations

### Parallel Execution

Visual tests run in parallel by default. Configure workers in `playwright.config.ts`:

```typescript
export default defineConfig({
  workers: process.env.CI ? 1 : 4, // Fewer workers in CI
});
```

### Selective Testing

Run only affected tests:

```bash
# Test specific component
npx playwright test tests/visual/LeafletMap.visual.spec.ts

# Test specific scenario
npx playwright test -g "Loading States"
```

### Caching

Playwright caches browsers. Keep them updated:

```bash
# Update browsers
npx playwright install --with-deps
```

## Helpful Resources

- [Playwright Visual Comparisons](https://playwright.dev/docs/test-snapshots)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright CI/CD](https://playwright.dev/docs/ci)
- [Playwright Trace Viewer](https://playwright.dev/docs/trace-viewer)

## Getting Help

If you encounter issues:

1. Check this documentation
2. Review test examples in `tests/visual/`
3. Run tests in UI mode for interactive debugging
4. Check Playwright documentation
5. Ask the team in #testing channel

---

**Happy Testing!** 🎨✨
