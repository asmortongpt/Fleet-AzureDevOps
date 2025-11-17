# Accessibility Validation System - Fleet Management Platform

## Overview

This comprehensive accessibility validation system ensures the Fleet Management Platform meets **WCAG 2.2 Level AA** compliance standards. The system includes automated testing, manual testing guides, and detailed reporting.

**Production URL**: http://68.220.148.2

---

## Quick Start

### Run Automated Tests (2 minutes)

```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet

# Run full accessibility test suite
./scripts/run-accessibility-tests.sh
```

This will:
1. ✅ Check production server is accessible
2. ✅ Install dependencies if needed
3. ✅ Run automated accessibility scans on 9 major pages
4. ✅ Generate interactive HTML report
5. ✅ Display summary with severity breakdown
6. ✅ Open report in your browser

### View Results

After tests complete, view the detailed HTML report:
```bash
open test-results/accessibility/accessibility-report.html
```

---

## What's Included

### 1. Automated Testing Script
**File**: `e2e/07-accessibility/comprehensive-accessibility.spec.ts`

**Features**:
- Scans 9 major pages (Homepage, Login, Dashboard, Fleet, Vehicles, Map, Dispatch, Maintenance, Reports)
- Uses axe-core with WCAG 2.1 & 2.2 AA rules
- Tests keyboard navigation (Tab order, focus management, PTT button)
- Validates ARIA attributes (labels, roles, live regions)
- Checks focus indicators (visibility, contrast)
- Verifies color contrast (WCAG AA standards)
- Tests custom components (DispatchConsole, LeafletMap)
- Generates detailed HTML report with remediation guidance

**Coverage**:
- ✅ 100+ automated accessibility checks per page
- ✅ Keyboard navigation validation
- ✅ Screen reader compatibility
- ✅ Focus management
- ✅ Color contrast verification
- ✅ ARIA attribute validation
- ✅ Form accessibility

### 2. Shell Script Runner
**File**: `scripts/run-accessibility-tests.sh`

**Features**:
- Checks production URL accessibility
- Manages dependencies automatically
- Runs Playwright tests with axe-core
- Generates HTML and JSON reports
- Displays color-coded summary
- Opens report in browser
- Provides next steps guidance

**Options**:
```bash
./scripts/run-accessibility-tests.sh --help    # Show help
./scripts/run-accessibility-tests.sh --headed  # Visible browser
./scripts/run-accessibility-tests.sh --ui      # Interactive mode
./scripts/run-accessibility-tests.sh --report-only  # Regenerate report
```

### 3. Manual Testing Guide
**File**: `docs/ACCESSIBILITY_TESTING_GUIDE.md`

**Contents**:
- Complete manual testing checklist (keyboard, screen reader, visual)
- VoiceOver (macOS) testing procedures
- NVDA (Windows) testing procedures
- Color contrast testing
- Color blindness simulation
- Text resize testing
- Feature-specific test cases (PTT, LeafletMap, forms)
- Common violations and fixes
- Issue reporting template

**Sections**:
- ✅ Keyboard Navigation Testing (Tab, Enter, Space, Arrow keys)
- ✅ Screen Reader Testing (VoiceOver, NVDA)
- ✅ Visual Accessibility (Color contrast, text resize, focus indicators)
- ✅ Forms & Interactions (Labels, validation, error messages)
- ✅ Content Structure (Headings, landmarks, tables)
- ✅ Media & Rich Content (Images, video, maps)

### 4. Quick Start Guide
**File**: `docs/ACCESSIBILITY_QUICK_START.md`

**Contents**:
- 5-minute quick start
- 30-minute manual testing guide
- Common issues and fixes
- Feature-specific testing procedures
- Keyboard shortcuts reference
- WCAG compliance checklist

---

## Test Results & Reporting

### HTML Report

The automated tests generate a comprehensive HTML report with:

**Summary Dashboard**:
- Total pages tested
- Violation counts by severity (Critical, Serious, Moderate, Minor)
- Compliance status (Pass/Fail)

**Page-by-Page Breakdown**:
- Violations per page
- Detailed violation descriptions
- Affected HTML elements
- Code snippets with highlighting
- Remediation guidance
- Links to WCAG documentation

**Violations Table**:
- Sortable and filterable
- Severity badges (color-coded)
- Element selectors (CSS)
- Quick links to documentation

**Visual Design**:
- Professional gradient header
- Color-coded severity indicators
- Expandable violation details
- Responsive layout
- Print-friendly

### JSON Reports

Individual JSON reports are saved for each page:
```
test-results/accessibility/
├── homepage-accessibility.json
├── login-accessibility.json
├── dashboard-accessibility.json
├── fleet-accessibility.json
├── vehicles-accessibility.json
├── map-accessibility.json
├── dispatch-accessibility.json
├── maintenance-accessibility.json
├── reports-accessibility.json
└── summary.json
```

### Summary JSON

The `summary.json` contains:
```json
{
  "timestamp": "2025-11-15T...",
  "totalPages": 9,
  "totalViolations": 0,
  "critical": 0,
  "serious": 0,
  "moderate": 0,
  "minor": 0,
  "reports": [...]
}
```

---

## Violation Severity Levels

### Critical (Must Fix Immediately)
**Impact**: Prevents users from accessing content
**Examples**:
- Images missing alt text
- Form inputs without labels
- Buttons without accessible names
- Headings out of order (H1 → H3, skipping H2)
- Color contrast < 3:1 for large text or UI components

**Action**: Fix before any deployment

### Serious (Fix Before Release)
**Impact**: Major accessibility barrier for some users
**Examples**:
- Poor color contrast (< 4.5:1 for normal text)
- Missing ARIA labels on complex widgets
- Keyboard navigation broken
- Focus indicators invisible
- Live regions not announcing updates

**Action**: Fix before production release

### Moderate (Fix When Possible)
**Impact**: Makes content difficult for some users
**Examples**:
- Skipped heading levels (H2 → H4)
- Duplicate IDs
- Missing landmark labels
- Non-descriptive link text ("click here")
- Form fields missing autocomplete

**Action**: Include in next sprint

### Minor (Nice to Fix)
**Impact**: Minor inconvenience for some users
**Examples**:
- Missing language attribute
- Non-unique landmark labels
- Redundant ARIA roles
- Missing page title suffix

**Action**: Fix as time permits

---

## Feature-Specific Testing

### DispatchConsole PTT Button

**What's Tested**:
- ✅ Spacebar activation (hold to transmit)
- ✅ Focus indicator visibility (3:1 contrast)
- ✅ Dynamic ARIA labels ("Transmitting - release to stop")
- ✅ `aria-pressed` state changes
- ✅ Visual state changes (not color-only)
- ✅ Keyboard accessibility
- ✅ Screen reader announcements

**Test Procedure**:
1. Navigate to `/dispatch`
2. Tab to PTT button
3. Hold Spacebar to transmit
4. Verify ARIA label updates
5. Verify visual state change
6. Release Spacebar
7. Verify return to default state

**Expected ARIA**:
```html
<button
  aria-label="Push to talk - hold spacebar or click and hold to speak"
  aria-pressed="false"
>
  <!-- When transmitting -->
  aria-pressed="true"
  aria-label="Transmitting - release to stop"
</button>
```

### LeafletMap Keyboard Controls

**What's Tested**:
- ✅ Tab to map container
- ✅ Arrow key panning
- ✅ +/- zoom controls
- ✅ Tab through markers
- ✅ Enter to open popups
- ✅ Escape to close popups
- ✅ ARIA labels on markers

**Test Procedure**:
1. Navigate to `/map`
2. Tab to map container
3. Use Arrow keys to pan
4. Tab to first marker
5. Press Enter to open popup
6. Press Escape to close

### Multi-Layer Drilldown Navigation

**What's Tested**:
- ✅ Expandable sections with Enter/Space
- ✅ `aria-expanded` attribute toggles
- ✅ Arrow key navigation through children
- ✅ Escape to collapse
- ✅ Focus management
- ✅ Screen reader announcements

### Forms

**What's Tested**:
- ✅ All inputs have visible labels
- ✅ Labels associated via `for` attribute
- ✅ Required fields marked with `required`
- ✅ Error messages via `aria-describedby`
- ✅ Error summary at top of form
- ✅ Focus moves to first error on submit
- ✅ Success messages announced

---

## Compliance Checklist

### Before Deploying to Production

- [ ] Run automated tests: `./scripts/run-accessibility-tests.sh`
- [ ] Review HTML report for violations
- [ ] Fix all critical violations (0 critical)
- [ ] Fix all serious violations (0 serious)
- [ ] Perform manual keyboard navigation test
- [ ] Perform screen reader test (VoiceOver or NVDA)
- [ ] Verify color contrast with WebAIM Contrast Checker
- [ ] Test at 200% zoom (no horizontal scroll)
- [ ] Test with color blindness simulator
- [ ] Verify focus indicators visible on all interactive elements
- [ ] Verify all forms have labels and error handling
- [ ] Verify all images have alt text
- [ ] Verify ARIA attributes correct
- [ ] Document any remaining issues with remediation plan

### Ongoing Maintenance

- [ ] Run accessibility tests on every PR
- [ ] Include accessibility in code review checklist
- [ ] Test new features with keyboard + screen reader
- [ ] Monitor for accessibility regression
- [ ] Update dependencies (axe-core, Playwright)
- [ ] Train team on accessibility best practices
- [ ] Include users with disabilities in testing when possible

---

## Common Issues & Fixes

### Issue: Missing Alt Text
❌ **Before**:
```html
<img src="vehicle.png" />
```

✅ **After**:
```html
<img src="vehicle.png" alt="Vehicle 101 - White Ford F-150" />
```

### Issue: Form Input Without Label
❌ **Before**:
```html
<input type="text" placeholder="Enter name" />
```

✅ **After**:
```html
<label for="name">Name:</label>
<input id="name" type="text" placeholder="Enter name" />
```

### Issue: Button Without Accessible Name
❌ **Before**:
```html
<button><CloseIcon /></button>
```

✅ **After**:
```html
<button aria-label="Close dialog">
  <CloseIcon aria-hidden="true" />
</button>
```

### Issue: Poor Color Contrast
❌ **Before**:
```css
.text {
  color: #999; /* 2.1:1 ratio - FAIL */
  background: #fff;
}
```

✅ **After**:
```css
.text {
  color: #666; /* 5.7:1 ratio - PASS */
  background: #fff;
}
```

### Issue: Missing Focus Indicator
❌ **Before**:
```css
button:focus {
  outline: none; /* Bad! */
}
```

✅ **After**:
```css
button:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}
```

---

## Running Tests

### Full Test Suite
```bash
./scripts/run-accessibility-tests.sh
```

### With Visible Browser (See Tests Run)
```bash
./scripts/run-accessibility-tests.sh --headed
```

### Interactive UI Mode (Debug)
```bash
./scripts/run-accessibility-tests.sh --ui
```

### Generate Report Only (No Tests)
```bash
./scripts/run-accessibility-tests.sh --report-only
```

### Run Specific Test
```bash
npx playwright test e2e/07-accessibility/comprehensive-accessibility.spec.ts --grep "PTT"
```

### View Last Report
```bash
open test-results/accessibility/accessibility-report.html
```

---

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Accessibility Tests

on: [push, pull_request]

jobs:
  accessibility:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: ./scripts/run-accessibility-tests.sh
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: accessibility-report
          path: test-results/accessibility/
```

### Azure DevOps Pipeline Example
```yaml
- task: Npm@1
  inputs:
    command: 'install'
  displayName: 'Install dependencies'

- script: ./scripts/run-accessibility-tests.sh
  displayName: 'Run accessibility tests'

- task: PublishTestResults@2
  inputs:
    testResultsFiles: 'test-results/accessibility/summary.json'
  displayName: 'Publish accessibility results'
  condition: always()
```

---

## Resources

### Tools
- **axe DevTools**: https://www.deque.com/axe/devtools/
- **WAVE**: https://wave.webaim.org/
- **VoiceOver** (macOS): Built-in (Cmd+F5)
- **NVDA** (Windows): https://www.nvaccess.org/
- **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Color Oracle**: https://colororacle.org/

### Guidelines
- **WCAG 2.2 Quick Reference**: https://www.w3.org/WAI/WCAG22/quickref/
- **WCAG 2.2 Understanding**: https://www.w3.org/WAI/WCAG22/Understanding/
- **ARIA Authoring Practices**: https://www.w3.org/WAI/ARIA/apg/
- **Section 508**: https://www.section508.gov/

### Training
- **WebAIM**: https://webaim.org/articles/
- **Deque University**: https://dequeuniversity.com/
- **A11ycasts (YouTube)**: https://www.youtube.com/playlist?list=PLNYkxOF6rcICWx0C9LVWWVqvHlYJyqw7g
- **MDN Accessibility**: https://developer.mozilla.org/en-US/docs/Web/Accessibility

### Community
- **WebAIM Discussion List**: https://webaim.org/discussion/
- **A11y Slack**: https://web-a11y.slack.com/
- **Accessibility Stack Exchange**: https://accessibility.stackexchange.com/

---

## File Structure

```
Fleet/
├── docs/
│   ├── ACCESSIBILITY_TESTING_GUIDE.md      # Comprehensive manual testing guide
│   └── ACCESSIBILITY_QUICK_START.md        # Quick start for developers
├── e2e/
│   └── 07-accessibility/
│       └── comprehensive-accessibility.spec.ts  # Automated test suite
├── scripts/
│   └── run-accessibility-tests.sh          # Shell script to run tests
├── test-results/
│   └── accessibility/
│       ├── accessibility-report.html       # Interactive HTML report
│       ├── summary.json                    # Summary of all violations
│       └── [page]-accessibility.json       # Individual page reports
└── ACCESSIBILITY_VALIDATION_README.md      # This file
```

---

## Support

### Common Questions

**Q: Why do tests fail even though the app looks accessible?**
A: Visual appearance doesn't equal accessibility. Screen reader users, keyboard-only users, and users with disabilities may experience the app differently.

**Q: Can I ignore minor violations?**
A: Minor violations should be fixed when possible, but they won't block deployment. Focus on critical and serious issues first.

**Q: How do I test with a screen reader?**
A: See `docs/ACCESSIBILITY_TESTING_GUIDE.md` for detailed VoiceOver (macOS) and NVDA (Windows) instructions.

**Q: What's the difference between automated and manual testing?**
A: Automated tests catch ~30-50% of accessibility issues. Manual testing (keyboard, screen reader) is essential for comprehensive validation.

**Q: How often should I run accessibility tests?**
A: Run on every PR and before every deployment. Include in your CI/CD pipeline.

### Getting Help

1. Review the HTML report for detailed remediation guidance
2. Consult the manual testing guide: `docs/ACCESSIBILITY_TESTING_GUIDE.md`
3. Check WCAG documentation: https://www.w3.org/WAI/WCAG22/quickref/
4. Use browser DevTools (axe or WAVE extension)
5. Test with real users who have disabilities when possible

---

## Summary

This accessibility validation system provides:

✅ **Automated Testing**: Scans 9 pages with 100+ checks each
✅ **Manual Testing Guide**: Comprehensive checklist for keyboard, screen reader, and visual testing
✅ **Interactive Reports**: HTML report with detailed violation information
✅ **Shell Script Runner**: Easy-to-use command-line interface
✅ **Quick Start Guide**: Get started in 5 minutes
✅ **Feature-Specific Tests**: Validates custom components (PTT, LeafletMap, etc.)
✅ **Remediation Guidance**: Links to WCAG documentation for every violation
✅ **CI/CD Ready**: Integrate into GitHub Actions, Azure DevOps, or other pipelines

**Goal**: Ensure the Fleet Management Platform is accessible to all users, regardless of ability.

**Standard**: WCAG 2.2 Level AA Compliance

**Commitment**: Zero critical violations before production deployment

---

**Last Updated**: 2025-11-15
**Version**: 1.0
**Maintained by**: Fleet Development Team
