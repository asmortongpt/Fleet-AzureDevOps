# Accessibility Testing Guide
## Fleet Management Platform - WCAG 2.2 AA Compliance

**Last Updated**: 2025-11-15
**Version**: 1.0
**Production URL**: http://68.220.148.2

---

## Table of Contents
1. [Overview](#overview)
2. [Manual Testing Checklist](#manual-testing-checklist)
3. [Screen Reader Testing](#screen-reader-testing)
4. [Keyboard Navigation Testing](#keyboard-navigation-testing)
5. [Visual Accessibility Testing](#visual-accessibility-testing)
6. [Automated Testing](#automated-testing)
7. [Feature-Specific Tests](#feature-specific-tests)
8. [Reporting Issues](#reporting-issues)

---

## Overview

This guide provides comprehensive accessibility testing procedures for the Fleet Management Platform to ensure WCAG 2.2 Level AA compliance.

### Target Standards
- **WCAG 2.2 Level AA** (primary)
- **Section 508** compliance
- **ADA** digital accessibility requirements

### Testing Tools Required
- **Screen Readers**:
  - macOS: VoiceOver (built-in)
  - Windows: NVDA (free download)
  - Optional: JAWS (commercial)
- **Browser Extensions**:
  - axe DevTools
  - WAVE Evaluation Tool
  - Lighthouse (built into Chrome DevTools)
- **Color Tools**:
  - WebAIM Contrast Checker
  - Color Oracle (color blindness simulator)
- **Automated Tools**:
  - Playwright with axe-core (included in project)

---

## Manual Testing Checklist

### Phase 1: Initial Setup

- [ ] Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test at different zoom levels (100%, 150%, 200%)
- [ ] Test with Windows High Contrast Mode
- [ ] Test with Dark Mode enabled
- [ ] Disable mouse/trackpad to force keyboard-only navigation

### Phase 2: Keyboard Navigation

#### General Navigation
- [ ] **Tab key**: Moves forward through all interactive elements
- [ ] **Shift+Tab**: Moves backward through all interactive elements
- [ ] **Enter key**: Activates buttons and links
- [ ] **Space key**: Toggles checkboxes, activates buttons
- [ ] **Arrow keys**: Navigate within dropdown menus, radio groups
- [ ] **Escape key**: Closes dialogs, dropdowns, and modals
- [ ] **Home/End**: Jump to first/last items in lists

#### Focus Indicators
- [ ] All interactive elements have visible focus indicator
- [ ] Focus indicator has minimum 3:1 contrast ratio against background
- [ ] Focus indicator is at least 2px thick or has clear visual distinction
- [ ] Focus order is logical and follows visual layout
- [ ] No keyboard traps (can always escape from any element)

#### Skip Links
- [ ] "Skip to main content" link appears on first Tab press
- [ ] Skip links function correctly
- [ ] Skip links are visible when focused

### Phase 3: Screen Reader Testing

#### macOS VoiceOver Setup
1. Enable: System Settings > Accessibility > VoiceOver > Enable
2. Keyboard shortcut: Cmd+F5
3. Open Web Rotor: Ctrl+Option+U

#### Windows NVDA Setup
1. Download from: https://www.nvaccess.org/
2. Install and run
3. Browse mode: Default
4. Focus mode: Insert+Space

#### Screen Reader Checklist
- [ ] Page title is announced on page load
- [ ] Headings are properly nested (H1 > H2 > H3)
- [ ] Landmarks are announced (main, nav, aside, footer)
- [ ] Images have descriptive alt text
- [ ] Decorative images are hidden (alt="" or aria-hidden="true")
- [ ] Form inputs have associated labels
- [ ] Form errors are announced
- [ ] Dynamic content updates are announced via ARIA live regions
- [ ] Button states are announced (pressed, expanded, disabled)
- [ ] Links have descriptive text (avoid "click here")
- [ ] Tables have proper headers and captions
- [ ] Lists are properly structured (ul, ol, dl)

#### ARIA Attributes to Verify
- [ ] `aria-label` provides context where visual labels are insufficient
- [ ] `aria-labelledby` correctly references label elements
- [ ] `aria-describedby` provides additional context
- [ ] `aria-live` regions announce dynamic updates
- [ ] `aria-expanded` reflects accordion/dropdown state
- [ ] `aria-pressed` reflects toggle button state
- [ ] `aria-disabled` vs `disabled` attribute is used appropriately
- [ ] `aria-hidden="true"` hides decorative elements from screen readers
- [ ] `role` attributes are used correctly and sparingly

### Phase 4: Visual Accessibility

#### Color Contrast
- [ ] Normal text (< 18pt): Minimum 4.5:1 contrast ratio
- [ ] Large text (≥ 18pt or ≥ 14pt bold): Minimum 3:1 contrast ratio
- [ ] UI components (buttons, form fields): Minimum 3:1 contrast ratio
- [ ] Focus indicators: Minimum 3:1 contrast ratio
- [ ] Test with WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/

#### Color Blindness
- [ ] Information is not conveyed by color alone
- [ ] Status indicators use icons + color
- [ ] Charts/graphs use patterns + color
- [ ] Test with Color Oracle: https://colororacle.org/

#### Text Resize
- [ ] Text can be resized to 200% without loss of functionality
- [ ] No horizontal scrolling at 200% zoom
- [ ] Layout remains usable at 200% zoom
- [ ] Text does not overlap or become truncated

#### Visual Focus
- [ ] Focus indicator is visible on all interactive elements
- [ ] Focus indicator has 2px minimum thickness
- [ ] Focus indicator has 3:1 minimum contrast ratio
- [ ] Focus indicator is not obscured by other elements

### Phase 5: Forms & Interactions

#### Form Labels
- [ ] All form inputs have associated `<label>` elements
- [ ] Labels are visible (not placeholder-only)
- [ ] Required fields are clearly indicated
- [ ] Optional fields may be indicated
- [ ] Labels remain visible when input is focused

#### Form Validation
- [ ] Error messages are associated with inputs via `aria-describedby`
- [ ] Error messages are announced by screen readers
- [ ] Error messages are visible and clear
- [ ] Errors are not indicated by color alone
- [ ] Error summary appears at top of form
- [ ] Focus moves to first error on submit

#### Interactive Elements
- [ ] Buttons use `<button>` element (not `<div>` with onClick)
- [ ] Links use `<a>` element with href attribute
- [ ] Checkboxes are actual `<input type="checkbox">`
- [ ] Radio buttons are actual `<input type="radio">`
- [ ] Disabled elements are properly disabled (not just styled)
- [ ] Interactive elements have sufficient size (minimum 44x44 pixels)

### Phase 6: Content Structure

#### Headings
- [ ] Page has one H1 that describes main content
- [ ] Heading hierarchy is logical (don't skip levels)
- [ ] Headings are used for structure, not styling
- [ ] Use heading navigation in screen reader to verify structure

#### Landmarks
- [ ] Page has `<main>` landmark
- [ ] Navigation is in `<nav>` landmark
- [ ] Complementary content in `<aside>` landmark
- [ ] Footer content in `<footer>` landmark
- [ ] Multiple landmarks of same type have unique labels

#### Tables
- [ ] Data tables use `<table>` element
- [ ] Tables have `<caption>` describing content
- [ ] Headers use `<th>` with scope attribute
- [ ] Complex tables use header IDs and `headers` attribute
- [ ] Layout should not use tables (use CSS Grid/Flexbox)

### Phase 7: Media & Rich Content

#### Images
- [ ] All images have alt text
- [ ] Alt text is descriptive and concise
- [ ] Decorative images use alt=""
- [ ] Complex images (charts, diagrams) have long descriptions
- [ ] Image links describe destination, not just image

#### Video/Audio
- [ ] Videos have captions
- [ ] Videos have audio descriptions (for visual content)
- [ ] Audio-only content has transcripts
- [ ] Media players are keyboard accessible
- [ ] Auto-play is disabled or can be paused

#### Interactive Maps
- [ ] Map controls are keyboard accessible
- [ ] Map markers have text alternatives
- [ ] Important map information is available in text
- [ ] Zoom controls are accessible

---

## Screen Reader Testing

### VoiceOver (macOS) Test Procedure

#### Setup
```bash
# Enable VoiceOver
System Settings > Accessibility > VoiceOver > Enable
# Or use keyboard shortcut: Cmd+F5
```

#### Key Commands
| Command | Action |
|---------|--------|
| Cmd+F5 | Toggle VoiceOver on/off |
| Ctrl+Option+A | Start reading |
| Ctrl+Option+→ | Move to next item |
| Ctrl+Option+← | Move to previous item |
| Ctrl+Option+U | Open Web Rotor |
| Ctrl+Option+H | Next heading |
| Ctrl+Option+Shift+H | Previous heading |
| Ctrl+Option+L | Next link |
| Ctrl+Option+J | Next form control |
| Ctrl+Option+Space | Activate link/button |

#### Testing Steps
1. Enable VoiceOver (Cmd+F5)
2. Navigate to http://68.220.148.2
3. Use Ctrl+Option+A to have page announced
4. Verify page title is announced
5. Open Web Rotor (Ctrl+Option+U) to view:
   - Headings (should be logical hierarchy)
   - Links (should have descriptive text)
   - Form Controls (should have labels)
   - Landmarks (should include main, nav, etc.)
6. Navigate through page using Ctrl+Option+→
7. Verify all interactive elements are announced correctly
8. Test forms by filling out and submitting
9. Test dynamic content updates are announced

### NVDA (Windows) Test Procedure

#### Setup
```bash
# Download from: https://www.nvaccess.org/
# Install and run NVDA
# Default speech rate may be too fast - adjust in preferences
```

#### Key Commands
| Command | Action |
|---------|--------|
| Ctrl+Alt+N | Start NVDA |
| Insert+Q | Quit NVDA |
| Insert+↓ | Start reading |
| Insert+Space | Toggle browse/focus mode |
| H | Next heading |
| Shift+H | Previous heading |
| K | Next link |
| Shift+K | Previous link |
| F | Next form field |
| Shift+F | Previous form field |
| Insert+F7 | Elements list (like Web Rotor) |
| Enter | Activate link/button |

#### Testing Steps
1. Start NVDA (Ctrl+Alt+N)
2. Navigate to http://68.220.148.2
3. Use Insert+↓ to start reading page
4. Verify page title and structure
5. Press Insert+F7 to open Elements List:
   - Links tab: Check link text is descriptive
   - Headings tab: Check hierarchy is logical
   - Form fields tab: Check labels are present
   - Buttons tab: Check button labels are clear
6. Navigate by heading (H key)
7. Navigate by link (K key)
8. Navigate by form field (F key)
9. Test forms and dynamic content
10. Toggle browse/focus mode with Insert+Space as needed

---

## Keyboard Navigation Testing

### Complete Keyboard Navigation Test

#### 1. Homepage Navigation
**Test URL**: http://68.220.148.2

- [ ] Press Tab - Skip to main content link appears
- [ ] Press Enter - Focus jumps to main content
- [ ] Continue Tab through header navigation
- [ ] Verify all nav items are reachable
- [ ] Verify dropdown menus open with Enter/Space
- [ ] Verify dropdown menus navigate with Arrow keys
- [ ] Verify Escape closes dropdown menus
- [ ] Tab through main content links and buttons
- [ ] Verify focus order matches visual layout
- [ ] Tab to footer and verify all links are reachable
- [ ] Shift+Tab backward through entire page
- [ ] Verify no keyboard traps

#### 2. Form Navigation
- [ ] Tab to first form field
- [ ] Verify label is read by screen reader
- [ ] Type into field
- [ ] Tab to next field
- [ ] Test required field validation
- [ ] Submit form with Enter key
- [ ] Verify error messages appear and are announced
- [ ] Tab through error messages
- [ ] Verify focus moves to first error
- [ ] Fix errors and resubmit
- [ ] Verify success message is announced

#### 3. Modal Dialog Navigation
- [ ] Tab to button that opens modal
- [ ] Press Enter to open modal
- [ ] Verify focus moves into modal
- [ ] Tab through modal contents
- [ ] Verify focus stays within modal (focus trap)
- [ ] Press Escape to close modal
- [ ] Verify focus returns to trigger button
- [ ] Repeat test with clicking outside modal
- [ ] Repeat test with clicking close button

#### 4. Accordion/Collapsible Content
- [ ] Tab to accordion header
- [ ] Press Enter/Space to expand
- [ ] Verify `aria-expanded` changes to "true"
- [ ] Tab into expanded content
- [ ] Tab back to header
- [ ] Press Enter/Space to collapse
- [ ] Verify `aria-expanded` changes to "false"
- [ ] Verify content is hidden from screen reader

#### 5. Tab/Tablist Navigation
- [ ] Tab to first tab
- [ ] Press Right Arrow to move to next tab
- [ ] Press Left Arrow to move to previous tab
- [ ] Press Home to jump to first tab
- [ ] Press End to jump to last tab
- [ ] Verify tab panel content updates
- [ ] Tab into active tab panel
- [ ] Verify only active tab is in tab order

---

## Visual Accessibility Testing

### Color Contrast Testing

#### Tools
- **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Chrome DevTools**: Coverage tab > Show Contrast Ratio
- **Browser Extension**: WAVE or axe DevTools

#### Elements to Test
1. **Normal text**: Verify 4.5:1 minimum ratio
   - Body text
   - Navigation links
   - Button labels
   - Form labels
   - Table content

2. **Large text** (≥18pt or ≥14pt bold): Verify 3:1 minimum ratio
   - Headings
   - Large buttons
   - Hero text
   - Feature callouts

3. **UI Components**: Verify 3:1 minimum ratio
   - Button backgrounds vs page background
   - Form input borders vs background
   - Focus indicators vs background
   - Disabled state vs background
   - Icons vs background

4. **Status Indicators**: Verify 3:1 minimum ratio
   - Success messages (green)
   - Error messages (red)
   - Warning messages (yellow)
   - Info messages (blue)
   - Badge backgrounds

#### Test Procedure
1. Open page in Chrome
2. Open DevTools (F12)
3. Inspect text element
4. View "Contrast Ratio" in Computed styles
5. Verify ratio meets WCAG AA requirements
6. Test with WebAIM Contrast Checker for verification
7. Document any failures with:
   - Element description
   - Current contrast ratio
   - Required contrast ratio
   - Suggested color adjustments

### Color Blindness Testing

#### Simulation Tools
- **Color Oracle** (free, cross-platform): https://colororacle.org/
- **Chrome Extension**: Colorblindly
- **Figma Plugin**: Stark (for designers)

#### Color Blindness Types to Test
1. **Deuteranopia** (red-green, most common)
2. **Protanopia** (red-green)
3. **Tritanopia** (blue-yellow)
4. **Achromatopsia** (grayscale)

#### Test Procedure
1. Install Color Oracle
2. Navigate to http://68.220.148.2
3. Enable Deuteranopia simulation
4. Verify:
   - [ ] Status indicators still distinguishable (icons + color)
   - [ ] Charts use patterns + color
   - [ ] Links are underlined or otherwise distinguished
   - [ ] Form validation uses icons + color
   - [ ] Buttons have text labels, not just color
5. Repeat for Protanopia
6. Repeat for Tritanopia
7. Repeat for Achromatopsia (grayscale)
8. Document any elements that rely on color alone

### Text Resize Testing

#### Browser Zoom Test
1. Open http://68.220.148.2 in Chrome
2. Press Cmd/Ctrl + "+" to zoom to 150%
3. Verify:
   - [ ] No horizontal scrolling
   - [ ] Text remains readable
   - [ ] No overlapping content
   - [ ] Buttons remain clickable
   - [ ] Forms remain usable
4. Zoom to 200%
5. Repeat verification
6. Test zoom to 400% (WCAG 2.2 enhancement)

#### Text-Only Zoom Test (Firefox)
1. Open http://68.220.148.2 in Firefox
2. View > Zoom > Zoom Text Only
3. Press Cmd/Ctrl + "+" to zoom text to 200%
4. Verify:
   - [ ] Text does not overlap
   - [ ] Layout remains usable
   - [ ] Containers expand to fit text
   - [ ] No clipped text

---

## Feature-Specific Tests

### 1. DispatchConsole PTT (Push-to-Talk)

**Location**: `/dispatch` page
**Feature**: Spacebar PTT activation with WCAG 2.2 AA compliance

#### Keyboard Accessibility
- [ ] Tab to PTT button
- [ ] Verify focus indicator is visible (3:1 contrast)
- [ ] Press and hold Spacebar to activate PTT
- [ ] Verify `aria-pressed="true"` when transmitting
- [ ] Verify ARIA label updates to "Transmitting - release to stop"
- [ ] Release Spacebar to deactivate
- [ ] Verify `aria-pressed="false"` when not transmitting
- [ ] Verify ARIA label returns to default
- [ ] Test with mouse click and hold (alternative input)
- [ ] Test with touch and hold on mobile

#### Screen Reader Announcements
- [ ] VoiceOver announces: "Push to talk - hold spacebar or click and hold to speak, button"
- [ ] When activated, announces: "Transmitting - release to stop, pressed"
- [ ] When deactivated, announces: "Push to talk - hold spacebar or click and hold to speak, not pressed"
- [ ] Audio level changes are announced if ARIA live region present

#### Visual Accessibility
- [ ] PTT button has 3:1 contrast ratio against background
- [ ] Focus indicator has 3:1 contrast ratio
- [ ] Focus indicator is minimum 2px thick
- [ ] Button size is minimum 44x44 pixels (touch target)
- [ ] Button state change is visually clear (not color-only)
- [ ] "Transmitting..." text provides visual confirmation

#### Test Procedure
```
1. Navigate to http://68.220.148.2/dispatch
2. Enable VoiceOver/NVDA
3. Tab to PTT button
4. Verify announcement: "Push to talk - hold spacebar or click and hold to speak, button"
5. Press and hold Spacebar
6. Verify announcement: "Transmitting - release to stop, pressed"
7. Verify visual state change (button color, icon, text)
8. Release Spacebar
9. Verify announcement returns to default
10. Verify visual state returns to default
11. Repeat test with mouse click and hold
12. Verify audio level meter is visible during transmission
```

### 2. Multi-Layer Drilldown Navigation

**Location**: Various pages with hierarchical data
**Feature**: Keyboard-navigable expandable/collapsible sections

#### Keyboard Navigation
- [ ] Tab to parent item
- [ ] Press Enter/Space to expand
- [ ] Verify `aria-expanded="true"`
- [ ] Arrow Down to navigate child items
- [ ] Arrow Up to navigate back to parent
- [ ] Arrow Right to expand collapsed item
- [ ] Arrow Left to collapse expanded item
- [ ] Tab to next sibling or child item
- [ ] Shift+Tab to previous item
- [ ] Escape to close current level
- [ ] Home to jump to first item
- [ ] End to jump to last item

#### Screen Reader Support
- [ ] Screen reader announces: "Collapsed, expandable item"
- [ ] When expanded: "Expanded, item, 5 children"
- [ ] When navigating: "1 of 5, child item name"
- [ ] When collapsed: "Collapsed"
- [ ] Tree structure is announced correctly

#### Test Procedure
```
1. Tab to first expandable section
2. Verify screen reader announces collapsed state
3. Press Enter to expand
4. Verify aria-expanded changes to "true"
5. Verify screen reader announces expanded state
6. Arrow Down through child items
7. Verify each child is announced
8. Press Enter on child with children
9. Verify nested expansion works
10. Press Escape to collapse current level
11. Verify focus management
```

### 3. LeafletMap Keyboard Controls

**Location**: `/map` or `/fleet` page
**Feature**: Interactive map with vehicle markers

#### Keyboard Navigation
- [ ] Tab to map container
- [ ] Verify map receives focus
- [ ] Arrow keys pan the map
- [ ] Plus/Minus keys zoom in/out
- [ ] Tab through map markers
- [ ] Enter to activate marker popup
- [ ] Escape to close popup
- [ ] Tab through controls (zoom, layers, etc.)
- [ ] Space to activate map controls

#### Screen Reader Support
- [ ] Map container has ARIA label
- [ ] Markers have descriptive ARIA labels
- [ ] Marker count is announced
- [ ] Selected marker details are announced
- [ ] Map controls have labels
- [ ] Alternative text view is available

#### Test Procedure
```
1. Tab to map on /map page
2. Verify map container has focus
3. Verify screen reader announces: "Interactive map, 12 vehicles"
4. Use Arrow keys to pan map
5. Verify visual feedback
6. Tab to first marker
7. Verify announcement: "Vehicle 101, Main St & 1st Ave"
8. Press Enter to open popup
9. Verify popup content is announced
10. Tab through popup elements
11. Press Escape to close
12. Verify focus returns to marker
```

### 4. Form Accessibility

**Location**: All forms (login, vehicle creation, etc.)

#### Form Labels
- [ ] All inputs have visible `<label>` elements
- [ ] Labels are associated via `for` attribute
- [ ] Required fields marked with `required` attribute
- [ ] Required indicator is not color-only (use asterisk or text)
- [ ] Optional fields may be indicated
- [ ] Placeholder text is not used as sole label

#### Form Validation
- [ ] Inline errors appear below field
- [ ] Errors are associated via `aria-describedby`
- [ ] Error summary appears at top of form
- [ ] Focus moves to first error on submit
- [ ] Errors are not indicated by color alone (use icons)
- [ ] Success messages are announced

#### Test Procedure
```
1. Tab to first form field
2. Verify label is announced
3. Type invalid data
4. Tab to next field (or submit)
5. Verify error message appears
6. Verify error is announced by screen reader
7. Verify error has icon + text (not color-only)
8. Fix error
9. Verify error clears
10. Submit form
11. Verify success announcement
```

### 5. Image Accessibility

#### Images with Information
- [ ] All images have alt text
- [ ] Alt text describes content/function
- [ ] Alt text is concise (< 150 characters)
- [ ] Complex images have long descriptions
- [ ] Image links describe destination

#### Decorative Images
- [ ] Decorative images use alt=""
- [ ] Or use `aria-hidden="true"` on parent
- [ ] Icons with adjacent text use `aria-hidden="true"`

#### Test Procedure
```
1. View page source
2. Search for <img tags
3. Verify each has alt attribute
4. Verify alt text is meaningful
5. Verify decorative images have alt=""
6. Use screen reader to navigate images
7. Verify informative images are announced
8. Verify decorative images are skipped
```

---

## Automated Testing

### Running Automated Accessibility Tests

#### Prerequisites
```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet
npm install
```

#### Run All Accessibility Tests
```bash
# Run full accessibility test suite
npm run test:a11y

# Run accessibility tests in headed mode (see browser)
npm run test:a11y -- --headed

# Run accessibility tests in UI mode (interactive)
npm run test:a11y -- --ui

# Generate HTML report
npm run test:a11y -- --reporter=html
npm run test:report
```

#### Run Specific Accessibility Tests
```bash
# Test specific page
npx playwright test e2e/07-accessibility/dispatch-console.spec.ts

# Test with specific WCAG level
npx playwright test e2e/07-accessibility --grep "WCAG-AA"

# Test keyboard navigation only
npx playwright test e2e/07-accessibility --grep "keyboard"

# Test screen reader compatibility
npx playwright test e2e/07-accessibility --grep "aria"
```

#### View Results
```bash
# Open HTML report
npm run test:report

# View JSON results
cat playwright-report/results.json

# View accessibility violations
cat test-results/accessibility-violations.json
```

### Understanding Automated Test Results

#### Violation Severity Levels
- **Critical**: Prevents users from accessing content (e.g., no alt text on images)
- **Serious**: Major accessibility barrier (e.g., poor color contrast)
- **Moderate**: Accessibility issue that may be difficult for some users (e.g., missing aria-label)
- **Minor**: Minor accessibility issue (e.g., duplicate IDs)

#### Common Violations and Fixes

| Violation | Description | Fix |
|-----------|-------------|-----|
| `color-contrast` | Text contrast ratio too low | Darken text or lighten background |
| `label` | Form input missing label | Add `<label>` element with `for` attribute |
| `button-name` | Button missing accessible name | Add text content or `aria-label` |
| `link-name` | Link missing accessible name | Add text content or `aria-label` |
| `image-alt` | Image missing alt text | Add `alt` attribute |
| `aria-required-attr` | ARIA role missing required attribute | Add required ARIA attributes |
| `landmark-unique` | Duplicate landmark labels | Add unique `aria-label` to each |
| `heading-order` | Skipped heading level | Use proper heading hierarchy |
| `list` | List structure incorrect | Ensure `<li>` inside `<ul>` or `<ol>` |

---

## Reporting Issues

### Issue Template

```markdown
## Accessibility Issue

**Severity**: [Critical / Serious / Moderate / Minor]

**WCAG Criterion**: [e.g., 1.4.3 Contrast (Minimum)]

**Page/Component**: [URL or component name]

**Description**: [What is the issue?]

**Steps to Reproduce**:
1. Navigate to [URL]
2. [Action]
3. [Observed behavior]

**Expected Behavior**: [What should happen?]

**Actual Behavior**: [What actually happens?]

**Impact**: [Who is affected and how?]

**Suggested Fix**: [How to resolve?]

**Screenshots**: [If applicable]

**Testing Tools Used**: [Screen reader, axe, etc.]

**Browser/OS**: [Chrome 120 / macOS 14]
```

### Example Issue

```markdown
## Accessibility Issue

**Severity**: Serious

**WCAG Criterion**: 2.4.7 Focus Visible

**Page/Component**: Dispatch Console PTT Button

**Description**: PTT button focus indicator has insufficient contrast ratio

**Steps to Reproduce**:
1. Navigate to http://68.220.148.2/dispatch
2. Press Tab to focus PTT button
3. Observe focus indicator

**Expected Behavior**: Focus indicator should have 3:1 contrast ratio against background

**Actual Behavior**: Focus indicator has 2.1:1 contrast ratio (tested with Chrome DevTools)

**Impact**: Keyboard users may not clearly see which element has focus

**Suggested Fix**: Increase focus indicator border width to 3px or use higher contrast color

**Testing Tools Used**: Chrome DevTools Contrast Checker

**Browser/OS**: Chrome 120 / macOS 14
```

---

## Summary Checklist

### Before Deploying to Production

- [ ] Run automated accessibility tests (`npm run test:a11y`)
- [ ] Fix all critical and serious violations
- [ ] Manual keyboard navigation test (no mouse)
- [ ] Screen reader test (VoiceOver or NVDA)
- [ ] Color contrast test (WebAIM Contrast Checker)
- [ ] Text resize test (200% zoom)
- [ ] Color blindness simulation
- [ ] Focus indicator visibility test
- [ ] Form validation and error handling test
- [ ] ARIA attributes validation
- [ ] HTML semantic structure validation
- [ ] Mobile touch target size test
- [ ] Document remaining issues and remediation plan

### Ongoing Accessibility Maintenance

- [ ] Run automated tests on every PR
- [ ] Include accessibility in code review checklist
- [ ] Test new features with keyboard and screen reader
- [ ] Maintain accessibility testing documentation
- [ ] Train team on accessibility best practices
- [ ] Include users with disabilities in testing when possible
- [ ] Monitor for accessibility regression
- [ ] Update tests as WCAG evolves

---

## Resources

### Official Guidelines
- **WCAG 2.2**: https://www.w3.org/WAI/WCAG22/quickref/
- **Section 508**: https://www.section508.gov/
- **ARIA Authoring Practices**: https://www.w3.org/WAI/ARIA/apg/

### Testing Tools
- **axe DevTools**: https://www.deque.com/axe/devtools/
- **WAVE**: https://wave.webaim.org/
- **NVDA**: https://www.nvaccess.org/
- **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Color Oracle**: https://colororacle.org/

### Training Resources
- **WebAIM**: https://webaim.org/articles/
- **Deque University**: https://dequeuniversity.com/
- **A11ycasts**: https://www.youtube.com/playlist?list=PLNYkxOF6rcICWx0C9LVWWVqvHlYJyqw7g
- **MDN Accessibility**: https://developer.mozilla.org/en-US/docs/Web/Accessibility

### Support
- **WebAIM Email List**: https://webaim.org/discussion/
- **Accessibility Stack Exchange**: https://accessibility.stackexchange.com/
- **ARIA Discord**: https://discord.gg/accessibility

---

**Version History**
- v1.0 (2025-11-15): Initial accessibility testing guide
