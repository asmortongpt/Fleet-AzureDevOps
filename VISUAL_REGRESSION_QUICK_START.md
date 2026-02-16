# Visual Regression Testing - Quick Start Guide

## What Was Implemented

A comprehensive visual regression testing suite with **300+ automated tests** to protect the new Fleet-CTA UI enhancements.

### Files Created

```
✅ tests/visual/components-core.spec.ts          (150+ tests)
✅ tests/visual/components-advanced.spec.ts      (140+ tests)
✅ tests/visual/pages-comprehensive.spec.ts      (80+ tests)
✅ tests/visual/visual-test-utils.ts             (Utilities)
✅ .github/workflows/visual-regression-testing.yml (CI/CD)
✅ percy.config.js                                (Cloud config)
✅ docs/VISUAL_REGRESSION_TESTING.md              (Guide)
```

## Quick Start Commands

### 1. Run All Visual Tests

```bash
# Run all 300+ visual regression tests
npx playwright test tests/visual/

# Run with visible browser (see what's being tested)
npx playwright test tests/visual/ --headed

# Run specific test file
npx playwright test tests/visual/components-core.spec.ts

# View detailed HTML report
npx playwright show-report
```

### 2. Create Initial Baselines

```bash
# Run with --update-snapshots to create baseline images
npx playwright test tests/visual/ --update-snapshots

# Commit baselines to git
git add tests/visual/snapshots/
git commit -m "test: add visual regression test baselines"
```

### 3. Local Development Workflow

```bash
# 1. Make UI changes
# 2. Run tests to see what changed
npx playwright test tests/visual/

# 3. Review diffs in tests/visual/diffs/
# 4. If changes are correct, update baselines
npx playwright test tests/visual/ --update-snapshots

# 5. Commit
git add tests/visual/snapshots/ tests/visual/components-*.spec.ts
git commit -m "test: update visual regression baselines for [feature name]"
```

## Test Coverage

### Components (150+ tests)
- Button (8 variants)
- Badge, Card, Input
- Forms: Checkbox, Radio, Switch, Select
- Alerts, Progress, Spinner
- Accordion, Tabs, Drawer
- Navigation, Breadcrumb, Menubar

### Pages (80+ tests)
- Dashboard
- Fleet Management
- Driver Management
- Maintenance
- Reports
- Settings
- User Profile
- Navigation flows

### Responsive Coverage
- ✅ Desktop (1920x1080)
- ✅ Tablet (768x1024)
- ✅ Mobile (375x667)

### Component States
- ✅ Default
- ✅ Hover
- ✅ Focus
- ✅ Active
- ✅ Disabled
- ✅ Error/Validation

## GitHub Actions Integration

Tests automatically run on:
- Every push to main/develop/feature/fix
- Every pull request to main/develop
- Weekly schedule (Sunday 2 AM)

PR comments show:
- ✅ Tests passed/failed
- 🎨 Visual changes detected
- 📊 Detailed diff reports

## Key Features

✅ **Automated**: Runs on every PR
✅ **Multi-viewport**: Desktop, tablet, mobile
✅ **State-based**: Tests all component states
✅ **Brand colors**: Verifies design consistency
✅ **Accessibility**: Checks contrast and layout
✅ **Reports**: Visual diffs and summaries
✅ **Cloud-ready**: Optional Percy integration

## Common Commands

```bash
# Run tests matching pattern
npx playwright test -g "Button"
npx playwright test -g "dashboard"

# Debug mode (interactive)
npx playwright test tests/visual/ --debug

# Run single browser only
npx playwright test tests/visual/ --project=chromium

# Disable video for faster execution
npx playwright test tests/visual/ --video=off

# View available tests
npx playwright test tests/visual/ --list
```

## Directory Structure

```
tests/visual/
├── components-core.spec.ts      (20 test groups, 150+ tests)
├── components-advanced.spec.ts  (24 test groups, 140+ tests)
├── pages-comprehensive.spec.ts  (35 test groups, 80+ tests)
├── visual-test-utils.ts         (Reusable utilities)
├── snapshots/                   (Baseline images)
│   ├── button-desktop.png
│   ├── button-mobile.png
│   └── ... (300+ baseline images)
├── diffs/                       (Visual difference reports)
│   └── ... (Generated on test failure)
└── ... (Other artifacts)
```

## Troubleshooting

**Tests fail locally?**
```bash
# Update snapshots if changes are intentional
npx playwright test tests/visual/ --update-snapshots

# Or run in Docker for CI-consistent environment
docker run -it mcr.microsoft.com/playwright:v1.40.0-focal
```

**Screenshot looks different?**
```bash
# Check specific diff
open tests/visual/diffs/component-name.png

# Increase threshold if minor rendering differences
# Edit maxDiffPixels in test file
```

**Can't find baseline?**
```bash
# Create initial baselines
npx playwright test tests/visual/ --update-snapshots
```

## Next Steps

1. **Run tests** to create baselines:
   ```bash
   npx playwright test tests/visual/ --update-snapshots
   ```

2. **Review baselines** in snapshots directory

3. **Commit to Git**:
   ```bash
   git add tests/visual/
   git commit -m "test: add visual regression test baselines"
   git push
   ```

4. **GitHub Actions** will automatically verify future changes

## Resources

- **Full Documentation**: `/docs/VISUAL_REGRESSION_TESTING.md`
- **Setup Summary**: `/VISUAL_REGRESSION_SETUP_SUMMARY.md`
- **Playwright Docs**: https://playwright.dev/
- **Percy Docs**: https://docs.percy.io/

## Statistics

| Metric | Count |
|--------|-------|
| Test Files | 3 |
| Test Cases | 300+ |
| Components Tested | 45+ |
| Pages Tested | 12+ |
| Viewport Sizes | 3 |
| States per Component | 6+ |
| Brand Colors | 5 |
| Estimated Runtime | 15-20 min |

## Support

See `/docs/VISUAL_REGRESSION_TESTING.md` for:
- Detailed configuration
- Custom assertions
- Percy cloud integration
- Maintenance procedures
- Advanced troubleshooting

---

**Ready to use!** Start with: `npx playwright test tests/visual/`
