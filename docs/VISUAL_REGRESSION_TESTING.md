# Visual Regression Testing Guide

Comprehensive visual regression testing for Fleet-CTA to protect the new UI enhancements and catch visual regressions automatically.

## Overview

Visual regression testing automatically compares screenshots of components and pages to detect unintended visual changes. This ensures the beautiful new design remains consistent across all changes.

### Key Features

- **Automated screenshot testing** with Playwright
- **Multi-viewport coverage** (Desktop 1920x1080, Tablet 768x1024, Mobile 375x667)
- **Multiple component states** (default, hover, active, disabled, error, focus)
- **Page-level testing** for key routes
- **GitHub Actions integration** for automated testing on every PR
- **Brand color verification** to ensure design consistency
- **Accessibility checks** alongside visual tests
- **Percy cloud integration** for advanced visual diffing (optional)

## Test Coverage

### Component Tests

**Core Components** (`tests/visual/components-core.spec.ts`):
- Button (8 variants + states)
- Badge (all variants)
- Card (Base, Premium, Accent)
- Input (multiple states)
- Checkbox, Radio, Switch, Select
- Alert, Progress, Spinner
- Accordion, Tabs, Drawer
- Breadcrumb, Navigation Menu, Menubar

**Advanced Components** (`tests/visual/components-advanced.spec.ts`):
- Dashboard cards
- Data tables with interactions
- Charts and visualizations
- Complex forms and dialogs
- Sidebar and navigation
- Modal and overlay components
- Status indicators
- Responsive layouts
- Animation verification

### Page Tests

**Key Pages** (`tests/visual/pages-comprehensive.spec.ts`):
- Dashboard (complete layout, empty states, loading)
- Fleet Management (table views, filters, search)
- Driver Management (list, card states, details)
- Maintenance (schedule, status states)
- Reports & Analytics (charts, export options)
- Settings (tabs, forms)
- User Profile (view, edit modes)
- Global navigation and headers
- Multi-page workflows
- Error and edge states

### Coverage Statistics

- **Total test files**: 3
- **Total test cases**: 300+
- **Component tests**: 150+
- **Page-level tests**: 80+
- **Integration tests**: 70+
- **Viewports tested**: 3 (Desktop, Tablet, Mobile)
- **Component states**: 6+ per component
- **Brand color tests**: 2+ per page

## Quick Start

### Local Testing

Run all visual regression tests locally:

```bash
# Run all visual tests
npx playwright test tests/visual/

# Run specific test file
npx playwright test tests/visual/components-core.spec.ts

# Run with headed browser (see what's being tested)
npx playwright test tests/visual/ --headed

# Update snapshots (create/update baseline images)
npx playwright test tests/visual/ --update-snapshots

# Run with specific project (e.g., chromium only)
npx playwright test tests/visual/ --project=chromium
```

### Development Workflow

1. **Make UI changes** to components or pages
2. **Run tests locally** to see what breaks:
   ```bash
   npx playwright test tests/visual/
   ```
3. **Review diffs** in `tests/visual/diffs/` directory
4. **Update snapshots** if changes are intentional:
   ```bash
   npx playwright test tests/visual/ --update-snapshots
   ```
5. **Commit changes** including updated snapshots
6. **GitHub Actions** automatically verifies no unexpected regressions

### GitHub Actions Integration

Visual regression tests run automatically on:
- **Every push** to main, develop, and feature branches
- **Every pull request** to main and develop
- **Weekly schedule** (Sundays 2 AM UTC)

#### PR Comments

The workflow automatically posts a comment on PRs showing:
- Total tests run
- Number passed/failed
- Visual regressions detected
- Link to detailed report

#### Test Artifacts

After each run, these are available for download:
- `visual-regression-report/` - Summary report JSON
- `visual-regression-screenshots/` - All baseline snapshots
- `accessibility-report/` - Accessibility test results
- `playwright-report/` - Full HTML test report

## Configuration

### Playwright Configuration

Visual tests use the main `playwright.config.ts`:

```typescript
// Key settings for visual tests:
{
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'on',        // Capture screenshots
    video: 'on',             // Record video on failures
    actionTimeout: 10000,    // Action timeout
    navigationTimeout: 30000, // Navigation timeout
    viewport: { width: 1920, height: 1080 }, // Default viewport
  }
}
```

### Test Thresholds

Visual tests allow small pixel differences to account for:
- Anti-aliasing
- Font rendering differences
- Sub-pixel positioning

**Default thresholds**:
- `maxDiffPixels: 100` - Core components (button, badge, card)
- `maxDiffPixels: 150` - Forms and dialogs
- `maxDiffPixels: 200` - Dashboard and pages
- `maxDiffPixels: 300` - Complex pages with tables/charts

Adjust thresholds in test files if tests fail due to minor rendering differences.

## Brand Color Verification

Tests verify the new brand colors are correctly applied:

### Brand Colors Used

- **CTA Orange**: `#FF6B35` - Primary action buttons, gradients
- **Blue Skies**: `#41B2E3` - Secondary actions, navigation active states
- **Golden Hour**: `#F0A000` - Warning states, accents
- **Noon Red**: `#DD3903` - Error states, alerts
- **Navy**: `#2F3359` - Text, backgrounds

### Verification Tests

```typescript
test('Verify CTA Orange (#FF6B35) presence', async ({ page }) => {
  // Checks that orange color or gradient is applied correctly
})

test('Verify Blue Skies (#41B2E3) presence', async ({ page }) => {
  // Checks that blue color is applied to navigation and active states
})
```

## Common Issues & Solutions

### Issue: Tests Pass Locally But Fail in CI

**Cause**: Font rendering or OS differences

**Solution**:
```bash
# Ensure consistent font rendering
npm run test:visual -- --update-snapshots

# Run in Docker to match CI environment
docker run -it --rm -v $(pwd):/work mcr.microsoft.com/playwright:v1.40.0-focal
cd /work
npx playwright test tests/visual/
```

### Issue: Screenshots Are Too Different

**Cause**: Component rendered differently due to animation/loading

**Solution**:
1. Add explicit waits before screenshot:
   ```typescript
   await page.waitForLoadState('networkidle')
   await page.waitForTimeout(500) // Wait for animations
   ```
2. Disable animations in test CSS:
   ```typescript
   await page.addStyleTag({
     content: `* { animation: none !important; transition: none !important; }`
   })
   ```
3. Increase `maxDiffPixels` threshold if minor differences are acceptable

### Issue: "Unable to Compare" Error

**Cause**: Baseline snapshots don't exist

**Solution**:
```bash
# Create initial baselines
npx playwright test tests/visual/ --update-snapshots

# Commit snapshots
git add tests/visual/snapshots/
git commit -m "test: add visual regression baselines"
```

### Issue: Mobile Tests Show Horizontal Scroll

**Cause**: Content wider than viewport

**Solution**:
```typescript
// Add to page setup
await page.setViewportSize({ width: 375, height: 667 })
await page.addStyleTag({
  content: `html, body { overflow-x: hidden; }`
})
```

## Advanced Usage

### Percy Integration (Optional)

Percy provides cloud-based visual testing with advanced features:

1. **Install Percy**:
   ```bash
   npm install -D @percy/cli @percy/playwright
   ```

2. **Get Percy token** from https://percy.io

3. **Add to GitHub Secrets**:
   ```
   PERCY_TOKEN=<your-token>
   ```

4. **Update workflow** to enable Percy tests:
   ```yaml
   # In .github/workflows/visual-regression-testing.yml
   # Change: if: false to if: true
   ```

5. **Run locally**:
   ```bash
   npx percy exec -- npx playwright test tests/visual/
   ```

### Custom Assertions

Create custom assertions for brand colors and styling:

```typescript
// Example: Verify button has orange gradient
test('Button uses orange gradient', async ({ page }) => {
  const button = page.locator('button').first()
  const style = await button.evaluate(el => {
    return window.getComputedStyle(el).background
  })

  expect(style).toContain('#FF6B35')
  expect(style).toContain('gradient')
})
```

### Selective Testing

Run only specific component tests:

```bash
# Run only button tests
npx playwright test -g "Button"

# Run only desktop viewport
npx playwright test -g "desktop"

# Run only page tests
npx playwright test tests/visual/pages-comprehensive.spec.ts
```

## Maintenance

### Regular Tasks

**Weekly**:
- Review visual regression reports
- Investigate any failures
- Update snapshots for intentional changes

**Monthly**:
- Archive old test artifacts
- Update component demo routes if changed
- Review and adjust thresholds if needed

**Quarterly**:
- Review brand color verification
- Check accessibility compliance
- Analyze test coverage gaps

### Updating Snapshots

When intentional design changes are made:

```bash
# 1. Make your changes
# 2. Run tests to see what changed
npx playwright test tests/visual/

# 3. Review diffs in tests/visual/diffs/
# 4. If changes are correct, update baselines
npx playwright test tests/visual/ --update-snapshots

# 5. Commit the changes
git add tests/visual/components-core.spec.ts tests/visual/snapshots/
git commit -m "test: update visual regression baselines for new design"
```

## Troubleshooting

### View Test Details

```bash
# Open HTML report
npx playwright show-report

# View specific diff
open tests/visual/diffs/component-name.png

# Check test output
npx playwright test tests/visual/components-core.spec.ts --reporter=list
```

### Debug Tests

```bash
# Run single test with debugging
npx playwright test tests/visual/components-core.spec.ts -g "Button" --debug

# Pause on failure
npx playwright test tests/visual/ --debug

# Inspector mode
npx playwright test tests/visual/ --inspector
```

### Check Browser Differences

```bash
# Run on multiple browsers
npx playwright test tests/visual/ --project=chromium --project=firefox

# View browser-specific diffs
ls tests/visual/diffs/ | grep -E "(chromium|firefox|webkit)"
```

## Integration with CI/CD

### Local Pre-commit

Add to `.husky/pre-commit`:

```bash
#!/bin/sh
# Run visual tests before commit
npx playwright test tests/visual/ --reporter=list

if [ $? -ne 0 ]; then
  echo "Visual regression tests failed. Please review and fix."
  exit 1
fi
```

### Deployment Gate

Visual tests are run as part of the quality gate:

```yaml
# quality-gate.yml includes visual tests
- name: Run Visual Regression Tests
  run: npx playwright test tests/visual/
  if: github.event_name == 'pull_request'
```

### Baseline Management

Baselines are stored in Git and updated via:

```bash
# Automatic baseline update on main branch commits
git push # Triggers workflow that updates baselines
```

## Performance Tips

### Optimize Test Execution

```bash
# Run tests in parallel (default)
npx playwright test tests/visual/ --workers=4

# Run serially (useful for debugging)
npx playwright test tests/visual/ --workers=1

# Run with reduced timeout for faster feedback
npx playwright test tests/visual/ --timeout=30000
```

### Reduce Test Time

- Test only changed components
- Use `--headed` flag to see progress
- Disable video/trace for faster execution:

```bash
npx playwright test tests/visual/ --trace=off --video=off
```

## Resources

- **Playwright Docs**: https://playwright.dev/
- **Visual Testing Best Practices**: https://playwright.dev/docs/test-snapshots
- **Percy Docs**: https://docs.percy.io/
- **Brand Guidelines**: `/docs/BRAND_GUIDELINES.md`

## FAQ

**Q: How often should I update baselines?**
A: Update baselines immediately after intentional design changes. Never update before reviewing diffs.

**Q: Can I test dark/light mode?**
A: Yes! Add tests that switch theme before taking screenshots:
```typescript
await page.evaluate(() => {
  document.documentElement.classList.add('dark')
})
```

**Q: What about animated components?**
A: Disable animations before screenshot:
```typescript
await page.addStyleTag({
  content: '* { animation: none !important; }'
})
```

**Q: How do I test component variants?**
A: Create separate tests for each variant/state or use parameterization:
```typescript
for (const variant of variants) {
  test(`Button - ${variant}`, async ({ page }) => {
    // Set variant and test
  })
}
```

**Q: Can I compare with previous versions?**
A: Yes! Playwright stores diffs and Percy provides historical comparison.

---

## Summary

The visual regression testing suite provides:

✅ **300+ test cases** covering components and pages
✅ **Multi-viewport coverage** for responsive design
✅ **Automated GitHub Actions** workflow
✅ **Brand color verification** for design consistency
✅ **Cloud-based option** with Percy integration
✅ **Accessibility checks** alongside visual tests
✅ **Comprehensive documentation** for team

This ensures the beautiful new UI design is protected from regressions and maintained across all future changes.
