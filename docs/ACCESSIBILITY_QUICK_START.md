# Accessibility Testing - Quick Start Guide

## Fleet Management Platform - WCAG 2.2 AA Compliance

**Production URL**: http://68.220.148.2

---

## Quick Start (5 Minutes)

### Run Automated Tests

```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet

# Run full accessibility test suite
./scripts/run-accessibility-tests.sh

# Run with visible browser (see tests in action)
./scripts/run-accessibility-tests.sh --headed

# Run in interactive UI mode
./scripts/run-accessibility-tests.sh --ui
```

### View Results

After running tests, an HTML report will be generated at:
```
test-results/accessibility/accessibility-report.html
```

The report will automatically open in your browser, showing:
- **Total violations** by severity (Critical, Serious, Moderate, Minor)
- **Page-by-page breakdown** with detailed violation information
- **Remediation guidance** with links to WCAG documentation
- **Visual examples** of each violation

---

## Manual Testing (30 Minutes)

### 1. Keyboard Navigation Test (10 minutes)

**Goal**: Navigate the entire site using only your keyboard (no mouse).

#### Steps:
1. Visit http://68.220.148.2
2. **Disconnect your mouse** or don't use it
3. Use these keys:
   - **Tab**: Move forward through interactive elements
   - **Shift+Tab**: Move backward
   - **Enter**: Activate buttons and links
   - **Space**: Activate buttons, check checkboxes
   - **Arrow keys**: Navigate menus and dropdowns
   - **Escape**: Close modals and menus

#### What to Check:
- [ ] Can you reach all interactive elements?
- [ ] Is there a visible focus indicator on every element?
- [ ] Is the focus order logical (follows visual layout)?
- [ ] Can you escape from all modals and menus?
- [ ] Are there any keyboard traps (can't get out)?

#### Special Features to Test:
- **DispatchConsole PTT**: Tab to PTT button, hold Spacebar to transmit
- **LeafletMap**: Tab to map, use Arrow keys to pan
- **Forms**: Tab through all fields, submit with Enter

---

### 2. Screen Reader Test (15 minutes)

**Goal**: Experience the site as a blind user would.

#### macOS - VoiceOver

**Enable VoiceOver**: Cmd+F5

**Key Commands**:
- **Ctrl+Option+A**: Start reading
- **Ctrl+Option+→**: Next item
- **Ctrl+Option+←**: Previous item
- **Ctrl+Option+U**: Open Web Rotor (view headings, links, etc.)
- **Ctrl+Option+Space**: Activate link/button

**Test Pages**:
1. Homepage: Verify page structure is announced
2. Login form: Verify all fields have labels
3. Dispatch console: Verify PTT button announces correctly
4. Map page: Verify map markers are announced

#### Windows - NVDA

**Download**: https://www.nvaccess.org/ (free)

**Key Commands**:
- **Insert+↓**: Start reading
- **H**: Next heading
- **K**: Next link
- **F**: Next form field
- **Insert+F7**: Elements list

**Test Same Pages as Above**

---

### 3. Color Contrast Test (5 minutes)

**Goal**: Ensure text is readable for users with low vision.

#### Using Browser DevTools:
1. Open Chrome DevTools (F12)
2. Inspect any text element
3. Look for "Contrast" in the Computed panel
4. Verify ratio meets WCAG AA:
   - **Normal text**: 4.5:1 minimum
   - **Large text** (≥18pt): 3:1 minimum

#### Using WebAIM Contrast Checker:
1. Visit: https://webaim.org/resources/contrastchecker/
2. Enter foreground and background colors
3. Check if it passes WCAG AA

#### Elements to Check:
- Body text
- Navigation links
- Button labels
- Form labels
- Status messages (success, error, warning)

---

## Common Issues & Fixes

### Issue: Form Input Missing Label

**Problem**:
```html
<input type="text" placeholder="Enter name" />
```

**Fix**:
```html
<label for="name">Name:</label>
<input id="name" type="text" placeholder="Enter name" />
```

---

### Issue: Button Missing Accessible Name

**Problem**:
```html
<button><Icon /></button>
```

**Fix**:
```html
<button aria-label="Close dialog"><Icon /></button>
```

---

### Issue: Image Missing Alt Text

**Problem**:
```html
<img src="logo.png" />
```

**Fix**:
```html
<!-- Informative image -->
<img src="logo.png" alt="Fleet Management Platform" />

<!-- Decorative image -->
<img src="decoration.png" alt="" />
```

---

### Issue: Poor Color Contrast

**Problem**:
- Light gray text on white background (2.1:1 ratio)

**Fix**:
- Use darker gray or black text (4.5:1+ ratio)
- Test with WebAIM Contrast Checker

---

### Issue: Missing Focus Indicator

**Problem**:
```css
button:focus {
  outline: none; /* Bad! */
}
```

**Fix**:
```css
button:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}
```

---

## Feature-Specific Testing

### DispatchConsole PTT Button

**Keyboard Test**:
1. Navigate to: http://68.220.148.2/dispatch
2. Tab to PTT button
3. Verify focus indicator is visible
4. Press and hold Spacebar
5. Verify "Transmitting..." state is announced
6. Release Spacebar
7. Verify return to default state

**Expected Behavior**:
- Button has `aria-label="Push to talk - hold spacebar or click and hold to speak"`
- When transmitting: `aria-pressed="true"` and label updates
- Focus indicator is visible with 3:1 contrast ratio
- Visual state change (not color-only)

---

### LeafletMap Keyboard Controls

**Keyboard Test**:
1. Navigate to: http://68.220.148.2/map
2. Tab to map container
3. Use Arrow keys to pan map
4. Tab through map markers
5. Press Enter to open marker popup

**Expected Behavior**:
- Map container receives focus
- Screen reader announces: "Interactive map, X vehicles"
- All markers are keyboard accessible
- Popups can be opened and closed with keyboard

---

### Multi-Layer Drilldown

**Keyboard Test**:
1. Tab to expandable section
2. Press Enter/Space to expand
3. Arrow Down to navigate children
4. Press Escape to collapse

**Expected Behavior**:
- `aria-expanded` attribute toggles
- Screen reader announces expand/collapse state
- Child items are navigable with keyboard
- Focus management is correct

---

## Automated Testing Details

### What Gets Tested

The automated test suite (`comprehensive-accessibility.spec.ts`) validates:

1. **Automated Page Scans** (9 pages):
   - Homepage, Login, Dashboard, Fleet, Vehicles, Map, Dispatch, Maintenance, Reports
   - Checks against WCAG 2.1 and 2.2 Level AA rules
   - Identifies violations with severity levels

2. **Keyboard Navigation**:
   - PTT button keyboard accessibility
   - Tab order and logical flow
   - Modal/dialog keyboard traps
   - Focus management

3. **ARIA Attributes**:
   - Form labels on all inputs
   - Accessible names on all buttons
   - Alt text on all images
   - Live regions for dynamic content

4. **Focus Management**:
   - Visible focus indicators
   - No keyboard traps
   - Focus return after modal close

5. **Color Contrast**:
   - Text contrast ratios (WCAG AA)
   - UI component contrast

### Violation Severity Levels

- **Critical**: Prevents users from accessing content (must fix immediately)
  - Example: Missing alt text on images, form inputs without labels

- **Serious**: Major accessibility barrier (fix before release)
  - Example: Poor color contrast, missing ARIA labels on complex widgets

- **Moderate**: Accessibility issue for some users (fix when possible)
  - Example: Skipped heading levels, duplicate IDs

- **Minor**: Minor accessibility issue (nice to fix)
  - Example: Missing language attribute, non-unique landmark labels

---

## Compliance Checklist

### Before Deploying to Production

- [ ] Run automated accessibility tests: `./scripts/run-accessibility-tests.sh`
- [ ] Zero critical violations
- [ ] Zero serious violations
- [ ] Manual keyboard navigation test passed
- [ ] Screen reader test passed (VoiceOver or NVDA)
- [ ] Color contrast test passed
- [ ] Focus indicators visible on all interactive elements
- [ ] All forms have labels and error handling
- [ ] All images have alt text
- [ ] ARIA attributes validated
- [ ] Documentation updated

### Ongoing Maintenance

- [ ] Run accessibility tests on every PR
- [ ] Include accessibility in code review checklist
- [ ] Test new features with keyboard + screen reader
- [ ] Monitor for accessibility regression
- [ ] Keep axe-core and Playwright dependencies updated

---

## Resources

### Tools
- **axe DevTools** (browser extension): https://www.deque.com/axe/devtools/
- **WAVE** (browser extension): https://wave.webaim.org/
- **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Color Oracle** (color blindness simulator): https://colororacle.org/

### Guidelines
- **WCAG 2.2 Quick Reference**: https://www.w3.org/WAI/WCAG22/quickref/
- **ARIA Authoring Practices**: https://www.w3.org/WAI/ARIA/apg/

### Training
- **WebAIM Articles**: https://webaim.org/articles/
- **A11ycasts YouTube**: https://www.youtube.com/playlist?list=PLNYkxOF6rcICWx0C9LVWWVqvHlYJyqw7g
- **MDN Accessibility**: https://developer.mozilla.org/en-US/docs/Web/Accessibility

### Documentation
- **Comprehensive Testing Guide**: `docs/ACCESSIBILITY_TESTING_GUIDE.md`
- **Test Suite**: `e2e/07-accessibility/comprehensive-accessibility.spec.ts`
- **Run Script**: `scripts/run-accessibility-tests.sh`

---

## Getting Help

### Common Commands

```bash
# Run full test suite
./scripts/run-accessibility-tests.sh

# Run with visible browser
./scripts/run-accessibility-tests.sh --headed

# Run in UI mode (interactive)
./scripts/run-accessibility-tests.sh --ui

# Generate report from existing results
./scripts/run-accessibility-tests.sh --report-only

# View help
./scripts/run-accessibility-tests.sh --help

# Run specific test
npx playwright test e2e/07-accessibility/comprehensive-accessibility.spec.ts

# View last report
open test-results/accessibility/accessibility-report.html
```

### Troubleshooting

**Tests won't run:**
- Check production server is running: `curl http://68.220.148.2`
- Install dependencies: `npm install`
- Check Playwright is installed: `npx playwright --version`

**Report not generated:**
- Check test-results directory exists
- Look for errors in test output
- Run with `--debug` flag for more info

**False positives:**
- Review violation details in HTML report
- Check if element is truly inaccessible
- Consult WCAG documentation for clarification
- Consider adding exception if justified

---

## Quick Reference Card

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| Tab | Next element |
| Shift+Tab | Previous element |
| Enter | Activate button/link |
| Space | Activate button/checkbox |
| Arrow keys | Navigate menus |
| Escape | Close modal/menu |

### VoiceOver (macOS)
| Command | Action |
|---------|--------|
| Cmd+F5 | Toggle VoiceOver |
| Ctrl+Option+A | Start reading |
| Ctrl+Option+→ | Next item |
| Ctrl+Option+U | Web Rotor |

### NVDA (Windows)
| Command | Action |
|---------|--------|
| Ctrl+Alt+N | Start NVDA |
| Insert+↓ | Start reading |
| H | Next heading |
| Insert+F7 | Elements list |

### WCAG Contrast Ratios
| Text Type | Minimum Ratio |
|-----------|---------------|
| Normal text (< 18pt) | 4.5:1 |
| Large text (≥ 18pt) | 3:1 |
| UI components | 3:1 |
| Focus indicators | 3:1 |

---

**Last Updated**: 2025-11-15
**Version**: 1.0
**Maintained by**: Fleet Development Team
