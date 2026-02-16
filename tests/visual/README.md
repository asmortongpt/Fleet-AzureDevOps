# Visual Regression Testing with Percy

Comprehensive visual regression testing suite for Fleet-CTA using Percy.io and Playwright.

## Quick Start

```bash
# 1. Start dev server
npm run dev

# 2. In another terminal, run visual tests
npm run visual:test

# 3. View results
open playwright-report/index.html
```

## Test Suites

### Component Tests (`components/ui-components.spec.ts`)
- 76+ UI components across all variants
- Buttons, badges, cards, forms, alerts, etc.
- All states: default, hover, active, disabled, loading
- Responsive breakpoints: mobile (375px), tablet (768px), desktop (1920px)

**Coverage:**
- ✅ Button variants (default, destructive, outline, secondary, success, warning)
- ✅ Badge components (all color variants, pill style)
- ✅ Card components (basic, premium, with accents)
- ✅ Form elements (inputs, textarea, checkbox, radio, select)
- ✅ Alert components (info, success, warning, error)
- ✅ Progress bars and loaders
- ✅ Tooltips and popovers
- ✅ Tables and data displays
- ✅ Navigation elements
- ✅ Empty states
- ✅ Modals and dialogs
- ✅ Accordion and tabs

### Page Tests (`pages/main-pages.spec.ts`)
- Dashboard (KPIs, charts, alerts)
- Fleet Management (list, grid, map views)
- Driver Management (profiles, metrics)
- Maintenance & Telematics
- Common page elements (header, sidebar, footer)
- Error and loading states

**Coverage:**
- ✅ Desktop, tablet, and mobile layouts
- ✅ Responsive breakpoint testing
- ✅ Dynamic content hiding (timestamps, user-specific data)
- ✅ Full page and component area snapshots

## Available Commands

### Basic Testing

```bash
# Run all visual tests
npm run visual:test

# Run with visible browser
npm run visual:test:headed

# Run in debug mode (interactive)
npm run visual:test:debug

# Test only components
npm run visual:test:components

# Test only pages
npm run visual:test:pages
```

### Percy Integration

```bash
# Run with Percy cloud integration
export PERCY_TOKEN=<your-token>
npm run visual:percy

# Or with helper script
PERCY_TOKEN=xxx npm run visual:percy
```

### Advanced

```bash
# Update baselines (after intentional changes)
npm run visual:test:update

# Run with helper script
npm run visual:run

# Run with visible browser via script
npm run visual:run:headed

# Test specific components only
npm run visual:run:components

# Test specific pages only
npm run visual:run:pages
```

## Test Structure

```
tests/visual/
├── components/
│   └── ui-components.spec.ts          # All UI components
├── pages/
│   └── main-pages.spec.ts             # Main application pages
├── helpers/
│   └── visual-test-utils.ts           # Shared utilities
└── README.md                           # This file
```

## Helper Functions

The `visual-test-utils.ts` provides utilities for:

- **Breakpoint definitions** - Mobile, tablet, desktop sizes
- **disableAnimations()** - Disables CSS animations for consistent snapshots
- **waitForNetworkIdle()** - Waits for network requests to complete
- **waitForImages()** - Ensures images are loaded
- **hideSelectors()** - Hides dynamic content
- **takePerrySnapshot()** - Takes a Percy snapshot with configuration
- **testComponentAcrossBreakpoints()** - Tests at all breakpoints

## Writing Visual Tests

### Basic Test

```typescript
import { test } from '@playwright/test';
import {
  takePerrySnapshot,
  disableAnimations,
  waitForNetworkIdle,
} from '../helpers/visual-test-utils';

test('button component', async ({ page }) => {
  await disableAnimations(page);
  await page.goto('http://localhost:5173/components/button');
  await waitForNetworkIdle(page);

  await takePerrySnapshot(page, {
    name: 'Button Component',
    breakpoints: ['mobile', 'tablet', 'desktop'],
  });
});
```

### Responsive Test

```typescript
test('dashboard responsive', async ({ page }) => {
  await page.goto('http://localhost:5173/dashboard');

  for (const breakpoint of ['mobile', 'tablet', 'desktop']) {
    const bp = BREAKPOINTS[breakpoint];
    await page.setViewportSize({ width: bp.width, height: bp.height });
    await page.waitForTimeout(500);

    await takePerrySnapshot(page, {
      name: `Dashboard - ${bp.name}`,
      breakpoints: [breakpoint],
    });
  }
});
```

### Test with Hidden Content

```typescript
test('fleet list', async ({ page }) => {
  await page.goto('http://localhost:5173/fleet');

  // Hide timestamps that change
  await hideSelectors(page, ['.timestamp', '[data-testid="last-sync"]']);

  await takePerrySnapshot(page, {
    name: 'Fleet List',
    breakpoints: ['desktop'],
  });
});
```

## Percy.io Integration

### Setup

1. Create account at [percy.io](https://percy.io)
2. Create project "Fleet-CTA"
3. Get PERCY_TOKEN from project settings
4. Add to GitHub Secrets

```bash
# Local development
export PERCY_TOKEN=<your-token>
npm run visual:percy
```

### Workflow

1. Create PR with UI changes
2. Percy runs automatically
3. Review visual diffs in Percy dashboard
4. Approve or request changes
5. Merge when approved

See [docs/PERCY_SETUP.md](../../docs/PERCY_SETUP.md) for detailed guide.

## Breakpoints

| Name | Width | Height | Device |
|------|-------|--------|--------|
| Mobile | 375px | 812px | iPhone 12 Pro |
| Tablet | 768px | 1024px | iPad Air |
| Desktop | 1920px | 1080px | MacBook Pro |

## Best Practices

1. **Always disable animations**
   ```typescript
   await disableAnimations(page);
   ```

2. **Hide dynamic content**
   ```typescript
   await hideSelectors(page, ['.timestamp', '.user-id']);
   ```

3. **Wait for network idle**
   ```typescript
   await waitForNetworkIdle(page);
   ```

4. **Use meaningful names**
   ```typescript
   name: 'Button - Primary - Hover State' // Good
   name: 'btn' // Bad
   ```

5. **Test all breakpoints**
   ```typescript
   breakpoints: ['mobile', 'tablet', 'desktop']
   ```

6. **Keep tests focused**
   ```typescript
   // Test one component or page area per test
   // Not entire app in one test
   ```

## Troubleshooting

### Percy token not found
```bash
export PERCY_TOKEN=<your-token>
npm run visual:percy
```

### Snapshots look different locally
- Hide dynamic timestamps
- Disable animations
- Ensure consistent data
- Use web-safe fonts

### Tests timeout
```bash
npx playwright test tests/visual/ --timeout=60000
```

### No baselines
```bash
# Create initial baselines
npm run visual:test:update
```

### Slow CI
```bash
# Use parallel workers
npx playwright test tests/visual/ --workers=4

# Test only desktop in CI
# Only mobile/tablet locally
```

## CI/CD

Tests run automatically on:
- Every pull request
- Every push to main/develop
- Weekly scheduled runs

Configuration: `.github/workflows/visual-regression-testing.yml`

## Performance

- Component tests: ~2-3 minutes
- Page tests: ~3-5 minutes
- Full suite: ~5-8 minutes
- With Percy: +2-3 minutes

## Files Modified

- `.github/workflows/visual-regression-testing.yml` - Enhanced workflow
- `.percyrc.json` - Percy configuration
- `percy.config.js` - Percy project settings
- `package.json` - Added visual test scripts
- `tests/visual/` - New test directory structure

## Documentation

Comprehensive guide: [docs/PERCY_SETUP.md](../../docs/PERCY_SETUP.md)

Topics covered:
- Quick start guide
- Configuration details
- Writing visual tests
- Running tests locally and CI
- Baseline approval workflow
- Troubleshooting
- Best practices

## Support

- Percy Docs: https://docs.percy.io
- Playwright Docs: https://playwright.dev
- GitHub Issues: Ask team for help
- Documentation: See docs/PERCY_SETUP.md

## Status

✅ **Production Ready**
- All 76+ UI components covered
- All main pages tested
- Responsive breakpoints included
- Percy cloud integration enabled
- GitHub Actions workflow configured

**Last Updated**: February 2026

**Maintained By**: Development Team
