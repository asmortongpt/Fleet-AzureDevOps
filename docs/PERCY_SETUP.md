# Percy.io Visual Regression Testing Setup

A comprehensive guide to visual regression testing in Fleet-CTA using Percy.io and Playwright.

## Overview

This document describes the complete setup for visual regression testing using:
- **Percy.io** - Cloud-based visual regression testing service
- **@percy/cli** - Command-line interface for Percy
- **@percy/playwright** - Playwright integration for Percy snapshots
- **Playwright** - Automated browser testing framework

### Key Features

- **Automatic visual diffing** - Detect unintended UI changes
- **Responsive testing** - Test across mobile (375px), tablet (768px), and desktop (1920px) breakpoints
- **GitHub integration** - PR comments with visual diffs
- **Parallel execution** - Fast feedback on UI changes
- **Historical baselines** - Track visual changes over time
- **Team collaboration** - Review and approve changes as a team

---

## Quick Start

### 1. Install Dependencies

```bash
npm install --legacy-peer-deps @percy/cli @percy/playwright
```

### 2. Create Percy Account

1. Visit [percy.io](https://percy.io)
2. Sign up / Log in with GitHub
3. Create new project named "Fleet-CTA"
4. Copy your **PERCY_TOKEN** from project settings

### 3. Configure GitHub Secrets

Add to your GitHub repository secrets:
- **PERCY_TOKEN**: Your token from percy.io

```bash
# In GitHub Settings → Secrets and variables → Actions
# Add: PERCY_TOKEN = <your-token-from-percy>
```

### 4. Run Visual Tests Locally

```bash
# Start dev server in one terminal
npm run dev

# In another terminal, run Percy tests
export PERCY_TOKEN=<your-token>
npx percy exec -- npx playwright test tests/visual/

# Or with specific test file
npx percy exec -- npx playwright test tests/visual/components/ui-components.spec.ts
```

### 5. Run on GitHub Actions

Visual tests automatically run on:
- Every pull request (`.github/workflows/visual-regression-testing.yml`)
- Every push to `main` and `develop`
- Weekly scheduled runs (Sundays at 2 AM UTC)

---

## Project Structure

```
tests/visual/
├── components/
│   └── ui-components.spec.ts         # All 76+ UI component snapshots
├── pages/
│   └── main-pages.spec.ts            # Dashboard, Fleet, Drivers, Maintenance pages
├── breakpoints/                      # Breakpoint-specific tests (optional)
└── helpers/
    └── visual-test-utils.ts          # Shared utilities and helpers
```

### Component Snapshots (`tests/visual/components/ui-components.spec.ts`)

Tests all UI components with comprehensive coverage:

#### Button Components
- All variants (default, destructive, outline, secondary, success, warning)
- Loading states
- Sizes (small, medium, large)

#### Badge Components
- All color variants
- Pill vs rectangular styles
- Status indicators

#### Card Components
- Basic card layout
- Premium card styling
- Orange and blue accent cards

#### Form Elements
- Input fields (default, focused, disabled, error states)
- Textareas
- Checkboxes and radio buttons
- Select dropdowns
- Multi-select components

#### Alert Components
- Info, success, warning, error alerts
- With icons and close buttons
- Different layouts

#### Progress & Loading
- Progress bars (0%, 25%, 50%, 100%)
- Spinner loaders
- Skeleton screens

#### Tooltips & Popovers
- Tooltip positioning (top, bottom, left, right)
- Popover placement
- Interactive states

#### Tables
- Basic table layout
- Sortable columns
- Responsive tables

#### Navigation
- Breadcrumb trails
- Pagination
- Navigation menus

#### Empty States
- No data state
- No results
- Error illustrations

#### Modals & Dialogs
- Basic modal
- Confirmation dialogs
- Alert dialogs

#### Accordion
- Expanded/collapsed states
- Multiple sections
- Animations disabled

#### Tabs
- Active/inactive states
- Tab switching
- Content areas

### Page Snapshots (`tests/visual/pages/main-pages.spec.ts`)

Tests all critical application pages:

#### Dashboard Page
- Full desktop layout
- Tablet responsive layout
- Mobile responsive layout
- KPI cards area
- Charts and graphs
- Alerts and notifications

#### Fleet Management Page
- List view (desktop, tablet, mobile)
- Grid view
- Map view with markers
- Filters and controls
- Sorting options

#### Driver Management Page
- List view (desktop and mobile)
- Driver profile details
- Performance metrics
- Safety scores
- Documents section

#### Maintenance & Telematics Page
- Maintenance schedule view
- Service records history
- Telematics data visualization
- Real-time metrics

#### Common Elements
- Page header and navigation
- Sidebar menu
- Footer
- Breadcrumbs
- User profile dropdown

#### Error & Empty States
- 404 error page
- Loading state placeholders
- No data screens

### Responsive Breakpoints

All tests include snapshots for three breakpoints:

| Breakpoint | Width | Height | Device Type |
|-----------|-------|--------|-------------|
| Mobile    | 375px | 812px  | iPhone 12 Pro |
| Tablet    | 768px | 1024px | iPad Air |
| Desktop   | 1920px| 1080px | Desktop |

---

## Visual Test Utilities (`tests/visual/helpers/visual-test-utils.ts`)

Shared helper functions for visual testing:

### Core Functions

#### `takePerrySnapshot(page, options)`
Takes a Percy snapshot with consistent settings.

```typescript
await takePerrySnapshot(page, {
  name: 'Component - Desktop',
  breakpoints: ['mobile', 'tablet', 'desktop'],
  waitForSelector: '.component-container',
  minHeight: 600,
});
```

#### `disableAnimations(page)`
Disables all CSS animations and transitions for consistent snapshots.

```typescript
await disableAnimations(page);
```

#### `waitForNetworkIdle(page)`
Waits for network requests to complete.

```typescript
await waitForNetworkIdle(page);
```

#### `waitForImages(page)`
Ensures all images are loaded before snapshot.

```typescript
await waitForImages(page);
```

#### `hideSelectors(page, selectors)`
Hides specific elements (timestamps, dynamic data) before snapshot.

```typescript
await hideSelectors(page, ['.timestamp', '[data-testid="last-sync"]']);
```

#### `testComponentAcrossBreakpoints(page, name)`
Tests a component at all responsive breakpoints.

```typescript
await testComponentAcrossBreakpoints(page, 'Button Component');
```

### Breakpoint Definitions

```typescript
export const BREAKPOINTS = {
  mobile: { name: 'Mobile (375px)', width: 375, height: 812 },
  tablet: { name: 'Tablet (768px)', width: 768, height: 1024 },
  desktop: { name: 'Desktop (1920px)', width: 1920, height: 1080 },
};
```

---

## Writing Visual Tests

### Basic Visual Test

```typescript
import { test } from '@playwright/test';
import {
  takePerrySnapshot,
  disableAnimations,
  waitForNetworkIdle,
} from '../helpers/visual-test-utils';

test('button component - all variants', async ({ page }) => {
  // Setup
  await disableAnimations(page);

  // Navigate
  await page.goto('http://localhost:5173/components/button');

  // Wait for content
  await waitForNetworkIdle(page);

  // Take snapshot
  await takePerrySnapshot(page, {
    name: 'Button Component',
    breakpoints: ['mobile', 'tablet', 'desktop'],
  });
});
```

### Responsive Test

```typescript
test('dashboard - responsive layout', async ({ page }) => {
  await page.goto('http://localhost:5173/dashboard');

  for (const breakpoint of ['mobile', 'tablet', 'desktop']) {
    const bp = BREAKPOINTS[breakpoint];
    await page.setViewportSize({ width: bp.width, height: bp.height });

    await takePerrySnapshot(page, {
      name: `Dashboard - ${bp.name}`,
      breakpoints: [breakpoint],
    });
  }
});
```

### Test with Dynamic Content

```typescript
test('fleet list - hiding timestamps', async ({ page }) => {
  await page.goto('http://localhost:5173/fleet');

  // Hide dynamic timestamps
  await hideSelectors(page, ['.last-updated', '.sync-time']);

  await takePerrySnapshot(page, {
    name: 'Fleet List',
    breakpoints: ['desktop'],
  });
});
```

### Test with Waiting for Specific Elements

```typescript
test('modal - visual state', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  // Open modal
  await page.click('[data-testid="open-modal"]');

  // Wait for modal to appear
  await takePerrySnapshot(page, {
    name: 'Modal Dialog',
    breakpoints: ['mobile', 'tablet', 'desktop'],
    waitForSelector: '[data-testid="modal-content"]',
  });
});
```

---

## Running Tests

### Local Development

```bash
# 1. Start dev server
npm run dev

# 2. In another terminal, run visual tests
export PERCY_TOKEN=<your-token>

# Run all visual tests
npx percy exec -- npx playwright test tests/visual/

# Run specific test file
npx percy exec -- npx playwright test tests/visual/components/ui-components.spec.ts

# Run specific test
npx percy exec -- npx playwright test tests/visual/components/ui-components.spec.ts -g "button"

# With headed browser (see what's happening)
npx percy exec -- npx playwright test tests/visual/ --headed

# Parallel workers
npx percy exec -- npx playwright test tests/visual/ --workers=4
```

### CI/CD (GitHub Actions)

Tests run automatically on:
1. **Pull requests** - Visual diffs appear in PR comments
2. **Pushes to main** - Updates baselines on main branch
3. **Scheduled runs** - Weekly regression check

View results at: https://percy.io/dashboard/projects/Fleet-CTA

---

## Percy.io Configuration (`percy.config.js`)

Key settings in `percy.config.js`:

```javascript
module.exports = {
  project: {
    name: 'Fleet-CTA',
    staticDir: './dist',
  },

  snapshot: {
    // Responsive breakpoints
    widths: [375, 768, 1920],

    // Minimum height for viewport
    minHeight: 1024,

    // Disable animations
    additionalJs: `
      document.body.style.animation = 'none';
      document.querySelectorAll('*').forEach(el => {
        el.style.animation = 'none';
        el.style.transition = 'none';
      });
    `,
  },

  // Approval threshold
  approval: {
    threshold: 0.5, // 0.5% pixel difference
  },

  // Environment URLs
  development: {
    baseUrl: 'http://localhost:5173',
  },
  staging: {
    baseUrl: process.env.STAGING_URL || 'https://staging.fleet-cta.dev',
  },
  production: {
    baseUrl: 'https://proud-bay-0fdc8040f.3.azurestaticapps.net',
  },
};
```

### Configuration Options

| Option | Purpose | Example |
|--------|---------|---------|
| `project.name` | Project identifier | `'Fleet-CTA'` |
| `snapshot.widths` | Responsive breakpoints | `[375, 768, 1920]` |
| `snapshot.minHeight` | Minimum viewport height | `1024` |
| `approval.threshold` | Pixel diff threshold for approval | `0.5` |
| `discovery.network.stripQueryString` | Include query params in URLs | `false` |

---

## Baseline Approval Workflow

### Step 1: Create PR with Visual Changes

```bash
git checkout -b feature/button-redesign
# Make UI changes
git commit -m "feat: redesign button component"
git push origin feature/button-redesign
```

### Step 2: Review Visual Diffs on Percy

1. Percy CI check runs automatically on PR
2. Review diffs at **Percy → Pull Requests** in GitHub
3. Click "Percy Check" in PR checks to see detailed diffs

### Step 3: Approve or Request Changes

#### Approve Changes (Team Lead)
1. Visit [percy.io/dashboard](https://percy.io/dashboard)
2. Navigate to Fleet-CTA project
3. Click PR number
4. Review visual changes
5. Click **"Approve"** to accept changes

#### Request Changes
1. If changes need modification, request changes in PR
2. Developer makes corrections
3. Percy automatically re-runs tests
4. Team approves when satisfied

### Step 4: Merge PR

Once Percy check passes and changes are approved:

```bash
git merge feature/button-redesign
git push origin main
```

### Step 5: Update Baselines on Main

After merge, GitHub Action automatically:
1. Creates new snapshots as baselines
2. Commits to main branch (if configured)
3. Updates Percy project baseline

---

## Common Workflows

### Create Initial Baselines

When starting Percy integration:

```bash
# Run tests to create baselines
npx percy exec -- npx playwright test tests/visual/

# All snapshots will be new baselines (no comparisons)
```

### Update Baseline for Intentional Changes

After design system update:

```bash
# Run with update baselines flag
npx percy exec -- npx playwright test tests/visual/ --update-snapshots
```

### Debug Failing Visual Test

```bash
# Run with headed browser to see what's happening
npx percy exec -- npx playwright test tests/visual/components/ui-components.spec.ts -g "button" --headed

# Keep browser open for debugging
npx percy exec -- npx playwright test tests/visual/ --debug
```

### Re-run Last PR

```bash
# If CI failed, re-run from GitHub Actions
# Go to: Actions → Visual Regression Testing → Re-run jobs
```

---

## Troubleshooting

### Percy Token Not Found

```bash
# Error: PERCY_TOKEN not set
export PERCY_TOKEN=<your-token-from-percy>
npx percy exec -- npx playwright test tests/visual/
```

### Snapshots Look Different Locally vs CI

**Causes:**
- Font rendering differences (use web-safe fonts)
- Time-dependent content (hide timestamps)
- Random data (mock consistent data)
- Animation timing (disable animations before snapshot)

**Solution:**
```typescript
// Always hide dynamic content
await hideSelectors(page, [
  '.timestamp',
  '[data-testid="last-sync"]',
  '.random-id',
]);

// Disable animations
await disableAnimations(page);

// Wait for stable state
await waitForNetworkIdle(page);
```

### Tests Timeout

```bash
# Increase timeout for slow environments
npx percy exec -- npx playwright test tests/visual/ --timeout=60000
```

### CI Pipeline Taking Too Long

**Optimization:**
```typescript
// Use parallel workers
npx percy exec -- npx playwright test tests/visual/ --workers=4

// Skip non-critical breakpoints in CI
if (process.env.CI) {
  breakpoints = ['desktop']; // Only desktop in CI
} else {
  breakpoints = ['mobile', 'tablet', 'desktop']; // Full coverage locally
}
```

### No Baselines Available

```bash
# If Percy says "No baselines", re-create them:
npx percy exec -- npx playwright test tests/visual/ --update-snapshots
```

---

## Best Practices

### 1. Disable Animations
Always disable animations for visual tests:
```typescript
await disableAnimations(page);
```

### 2. Hide Dynamic Content
Hide timestamps, IDs, or other dynamic content:
```typescript
await hideSelectors(page, ['.timestamp', '.user-id']);
```

### 3. Wait for Network
Ensure content is loaded:
```typescript
await waitForNetworkIdle(page);
```

### 4. Test Responsive Breakpoints
Always test at least mobile and desktop:
```typescript
breakpoints: ['mobile', 'desktop']
```

### 5. Meaningful Snapshot Names
Use descriptive names for easy identification:
```typescript
// Good
name: 'Button - Primary Variant - Hover State'

// Bad
name: 'button'
```

### 6. Keep Tests Isolated
Each test should be independent:
```typescript
test.beforeEach(async ({ page }) => {
  await disableAnimations(page);
});
```

### 7. Use Semantic Selectors
Prefer data attributes over class names:
```typescript
// Good
await page.waitForSelector('[data-testid="modal-content"]');

// Bad
await page.waitForSelector('.modal-dialog-wrapper-v2-dark');
```

### 8. Review Diffs Carefully
Always review visual diffs before approval:
- Intentional design changes ✅ Approve
- Unintended regressions ❌ Request changes
- Minor anti-aliasing differences ✅ Approve

---

## GitHub Actions Workflow

File: `.github/workflows/visual-regression-testing.yml`

### Jobs

1. **visual-regression** - Main visual regression tests
   - Runs on every PR and push
   - Creates screenshots and compares against baselines
   - Uploads artifacts for inspection

2. **percy-tests** - Percy cloud integration (optional)
   - Runs with Percy token
   - Provides cloud-based diffing
   - Creates Percy build

3. **accessibility-visual** - Visual + accessibility checks
   - Runs accessibility tests alongside visual tests
   - Ensures WCAG 2.1 Level AA compliance

4. **visual-summary** - Summary reporting
   - Aggregates all visual test results
   - Creates PR comment with summary
   - Blocks merge if regressions detected

### PR Checks

Visual test results appear as:
- **Percy Check** (if using Percy cloud)
- **Accessibility Check** (if A11y enabled)
- **Visual Regression Summary** (detailed report)

---

## Integration with Other Systems

### GitHub Checks API
Percy automatically creates GitHub checks:
- ✅ Passed (no regressions)
- ⚠️ Review (visual changes detected)
- ❌ Failed (regressions or errors)

### Slack Integration (Optional)
Notify Slack on visual test results:
1. Connect Percy to Slack workspace
2. Configure channel: `#visual-tests`
3. Receive notifications on new findings

### CI/CD Blocking
Merge is blocked until Percy passes:
```yaml
# In GitHub branch protection rules
Status checks that must pass:
- Percy Check
- Accessibility Check
- Visual Regression Tests
```

---

## Performance Tips

### Reduce Test Duration

```typescript
// Use only critical breakpoints in CI
if (process.env.CI) {
  BREAKPOINTS = { desktop }; // 1 breakpoint
} else {
  BREAKPOINTS = { mobile, tablet, desktop }; // 3 breakpoints
}

// Parallel workers
npx percy exec -- npx playwright test tests/visual/ --workers=4
```

### Efficient Network Waiting

```typescript
// Don't wait for all network requests
// Use specific element waiting instead
await page.waitForSelector('[data-testid="content-loaded"]', { timeout: 5000 });
```

### Reuse Page Context

```typescript
// Create page once, test multiple components
test('all buttons', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Test multiple components without navigation
  await testButton(page, 'primary');
  await testButton(page, 'secondary');
  await testButton(page, 'tertiary');
});
```

---

## Maintenance & Updates

### Weekly Baseline Reviews
- Review Percy dashboard weekly
- Check for new regressions
- Approve intentional changes

### Component Library Updates
When updating design system:

```bash
# 1. Make design changes
# 2. Update visual tests if needed
# 3. Run: npx percy exec -- npx playwright test tests/visual/
# 4. Approve new baselines in Percy
# 5. Merge changes
```

### Version Control
Keep Percy baselines in sync with main branch:

```bash
# After major merge
git pull origin main
npx percy exec -- npx playwright test tests/visual/
# Approve changes in Percy if all look good
```

---

## Additional Resources

- **Percy Documentation**: https://docs.percy.io
- **Playwright Docs**: https://playwright.dev
- **Visual Regression Testing Guide**: https://docs.percy.io/guides/visual-regression-testing
- **GitHub Actions**: https://docs.github.com/en/actions

---

## Support & Contact

For questions or issues:
1. Check Percy documentation
2. Review test utilities in `tests/visual/helpers/visual-test-utils.ts`
3. Check existing test examples
4. Contact development team

---

## Checklist for New Developers

When setting up Percy on a new machine:

- [ ] Install dependencies: `npm install --legacy-peer-deps`
- [ ] Export PERCY_TOKEN: `export PERCY_TOKEN=<your-token>`
- [ ] Run dev server: `npm run dev`
- [ ] Test visual tests locally: `npx percy exec -- npx playwright test tests/visual/`
- [ ] Review Percy dashboard: https://percy.io/dashboard
- [ ] Set up GitHub token in `.env` (optional for status checks)

---

**Last Updated**: February 2026

**Maintained By**: Development Team

**Status**: ✅ Production Ready
