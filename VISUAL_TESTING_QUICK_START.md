# Visual Testing Quick Start

## Run Tests

```bash
# Start dev server (required)
npm run dev

# Run full comprehensive visual test suite
npm run test:comprehensive

# Run with browser visible (debugging)
npm run test:comprehensive:headed

# Generate and open HTML report
npm run test:comprehensive:report
```

## What Gets Tested

✅ **50+ Pages**: All hubs, modules, and system pages
✅ **3 Viewports**: Desktop (1920x1080), Tablet (768x1024), Mobile (375x667)
✅ **2 Themes**: Light and Dark mode
✅ **All Features**: Tabs, modals, search, filters, tables, charts, navigation
✅ **All Links**: Validated for 404 errors
✅ **Accessibility**: Focus states and keyboard navigation

## Test Results

Results are saved to:
- **Screenshots**: `test-results/visual/*.png`
- **HTML Report**: `test-results/visual-test-report.html`
- **JSON Summary**: `test-results/visual-test-summary.json`

## View Report

```bash
# Generate report from screenshots
npx tsx scripts/generate-visual-report.ts

# Open in browser
open test-results/visual-test-report.html
```

## Test Credentials

- **Email**: admin@fleet.local
- **Password**: Fleet@2026

## Common Commands

```bash
# Test specific test group
npx playwright test e2e/comprehensive-visual-test.spec.ts -g "Desktop"
npx playwright test e2e/comprehensive-visual-test.spec.ts -g "Hub Pages"
npx playwright test e2e/comprehensive-visual-test.spec.ts -g "Mobile"

# Debug specific test
npx playwright test e2e/comprehensive-visual-test.spec.ts -g "Test All Hub Pages" --debug

# Run with UI mode
npx playwright test e2e/comprehensive-visual-test.spec.ts --ui
```

## Test Duration

- **Full Suite**: ~15-20 minutes (18 test scenarios)
- **Desktop Only**: ~8-10 minutes
- **Mobile/Tablet**: ~4-5 minutes
- **Single Hub**: ~30 seconds

## CI/CD Integration

```yaml
# Add to .github/workflows/visual-tests.yml
- name: Run Visual Tests
  run: npm run test:comprehensive

- name: Upload Results
  uses: actions/upload-artifact@v3
  with:
    name: visual-screenshots
    path: test-results/visual/
```

## Troubleshooting

**Test fails with timeout?**
```bash
# Increase timeout
playwright test e2e/comprehensive-visual-test.spec.ts --timeout=120000
```

**Can't see what's happening?**
```bash
# Run in headed mode
npm run test:comprehensive:headed
```

**Need to update credentials?**
Edit `e2e/comprehensive-visual-test.spec.ts`:
```typescript
const TEST_USER = {
  email: 'your-email@example.com',
  password: 'YourPassword'
}
```

## Interpreting Results

### Console Output
- ✓ = Success
- ⚠ = Warning (non-critical)
- ❌ = Error (test failure)
- 📸 = Screenshot captured
- 🔍 = Testing page

### HTML Report
- **All Screenshots Tab**: Complete gallery
- **Desktop/Tablet/Mobile Tabs**: Filter by viewport
- **Hub/Module Tabs**: Filter by page type
- **Click any image**: View full size

## Test Coverage Summary

```
Pages Tested:
├── 12 Hub Pages (Fleet, Operations, Maintenance, Drivers, etc.)
├── 40+ Module Pages (Garage, Fuel, Routes, Parts, etc.)
└── System Pages (Settings, Profile)

Features Tested:
├── Navigation (All links)
├── Tabs (Every tab on every page)
├── Modals (Add/Edit dialogs)
├── Search (Search functionality)
├── Filters (Filter panels)
├── Tables (Pagination, sorting)
├── Charts (Data visualizations)
└── Forms (Input validation)

Viewports:
├── Desktop: 1920x1080
├── Tablet: 768x1024
└── Mobile: 375x667

Themes:
├── Light Mode
└── Dark Mode
```

## Next Steps

1. **Run the test**: `npm run test:comprehensive`
2. **Review results**: Check console output
3. **Open report**: `npm run test:comprehensive:report`
4. **Fix issues**: Address any visual regressions
5. **Commit baseline**: Update screenshots if changes are intentional

## Support

For detailed documentation, see: `VISUAL_TESTING_GUIDE.md`

---

**Test File Location**: `/Users/andrewmorton/Documents/GitHub/Fleet/e2e/comprehensive-visual-test.spec.ts`

**Report Generator**: `/Users/andrewmorton/Documents/GitHub/Fleet/scripts/generate-visual-report.ts`
