# Visual Regression Testing Suite

Comprehensive visual regression testing for map components using Playwright.

## Quick Start

```bash
# Run visual tests
npm run test:visual

# Run visual tests in UI mode (recommended for development)
npm run test:visual:ui

# Update baselines
npm run test:visual:update

# View test report
npm run test:visual:report
```

## Test Files

### Component Tests

- **`UniversalMap.visual.spec.ts`** - Comprehensive tests for UniversalMap component
  - Default states
  - Vehicle status variations
  - Loading and error states
  - Zoom levels
  - Interactive states
  - Responsive layouts
  - Theme variations
  - Clustering
  - Edge cases

- **`LeafletMap.visual.spec.ts`** - Leaflet-specific tests
  - All map styles (OSM, Dark, Topo, Satellite)
  - Custom marker rendering
  - Popup styles
  - Controls and attribution
  - Performance with many markers

- **`cross-browser.visual.spec.ts`** - Cross-browser compatibility tests
  - Chromium, Firefox, WebKit
  - Mobile devices (iPhone, Pixel, iPad)
  - High DPI displays
  - Font rendering consistency

### Test Utilities

- **`helpers/visual-test-helpers.ts`** - Reusable test utilities
  - Viewport configurations
  - Wait strategies
  - Screenshot utilities
  - Map interaction helpers
  - Browser state management

- **`fixtures/map-test-data.ts`** - Test data fixtures
  - Vehicle data (various types and statuses)
  - Facility data
  - Camera data
  - Map configuration scenarios

## Test Coverage

### Components
- ✅ UniversalMap
- ✅ LeafletMap
- ✅ GoogleMap (via UniversalMap)
- ✅ MapboxMap (via UniversalMap)

### States
- ✅ Empty map
- ✅ Single marker
- ✅ Multiple markers
- ✅ All marker types
- ✅ Loading states
- ✅ Error states

### Markers
- ✅ Vehicle markers (6 status types)
- ✅ Facility markers (4 types)
- ✅ Camera markers (operational/offline)
- ✅ Marker popups
- ✅ Marker hover states

### Responsiveness
- ✅ Mobile (320px - 414px)
- ✅ Tablet (768px - 1024px)
- ✅ Desktop (1366px - 2560px)

### Themes
- ✅ Light theme
- ✅ Dark theme
- ✅ Theme switching

### Browsers
- ✅ Chromium
- ✅ Firefox
- ✅ WebKit (Safari)

### Zoom Levels
- ✅ City (13)
- ✅ Region (10)
- ✅ Street (16)

### Interactions
- ✅ Marker clicks
- ✅ Marker hovers
- ✅ Popup display
- ✅ Focus states

## Directory Structure

```
tests/visual/
├── README.md                          # This file
├── helpers/
│   └── visual-test-helpers.ts         # Reusable utilities
├── fixtures/
│   └── map-test-data.ts               # Test data
├── UniversalMap.visual.spec.ts        # UniversalMap tests
├── LeafletMap.visual.spec.ts          # LeafletMap tests
├── cross-browser.visual.spec.ts       # Cross-browser tests
└── *-snapshots/                       # Baseline images (auto-generated)
    ├── chromium/
    ├── firefox/
    └── webkit/
```

## Configuration

Visual testing is configured in `playwright.config.ts`:

```typescript
{
  name: 'visual-chromium',
  testDir: './tests/visual',
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2,
      animations: 'disabled',
    },
  },
}
```

## Writing New Tests

### Basic Template

```typescript
import { test } from '@playwright/test';
import {
  waitForMapLoad,
  stabilizeMap,
  takeVisualSnapshot,
  disableAnimations,
} from './helpers/visual-test-helpers';

test('my new visual test', async ({ page }) => {
  await page.goto('/');
  await disableAnimations(page);
  await waitForMapLoad(page);
  await stabilizeMap(page);
  await takeVisualSnapshot(page, 'my-test-name');
});
```

### Best Practices

1. **Always disable animations** for consistent screenshots
2. **Wait for map to load** before taking screenshots
3. **Use consistent test data** from fixtures
4. **Name screenshots descriptively**
5. **Set appropriate thresholds** based on content type
6. **Mask dynamic content** that changes frequently
7. **Test at multiple breakpoints** for responsive components

## CI/CD Integration

Visual tests run automatically on:
- Pull requests (Chromium only)
- Pushes to main (full cross-browser suite)
- Manual workflow dispatch

See `.github/workflows/visual-regression.yml` for configuration.

## Documentation

Full documentation available at `/docs/VISUAL_TESTING.md`:
- Getting started guide
- Running tests
- Writing tests
- Updating baselines
- Reviewing diffs
- CI/CD integration
- Best practices
- Troubleshooting

## Troubleshooting

### Tests failing locally?

```bash
# Update baselines
npm run test:visual:update

# Run in UI mode to see differences
npm run test:visual:ui
```

### Need to debug a test?

```bash
# Run in debug mode
npm run test:visual:debug

# Run specific test
npx playwright test -g "test name" --project=visual-chromium --debug
```

### Cross-browser differences?

Each browser has its own baseline snapshots. Update per browser:

```bash
# Update Firefox baselines
npx playwright test --project=visual-firefox --update-snapshots

# Update WebKit baselines
npx playwright test --project=visual-webkit --update-snapshots
```

## Resources

- [Full Documentation](/docs/VISUAL_TESTING.md)
- [Playwright Visual Comparisons](https://playwright.dev/docs/test-snapshots)
- [Test Helpers Source](./helpers/visual-test-helpers.ts)
- [Test Fixtures Source](./fixtures/map-test-data.ts)

---

For questions or issues, see the [full documentation](/docs/VISUAL_TESTING.md) or ask in #testing.
