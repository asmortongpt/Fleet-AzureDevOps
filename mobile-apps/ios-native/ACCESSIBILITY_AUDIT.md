# Accessibility Audit and Compliance Guide

## Overview

This document outlines the accessibility features, compliance standards, and testing procedures for the Fleet Manager iOS native application. The app is designed to meet WCAG 2.1 Level AA and Section 508 compliance requirements.

## Table of Contents

1. [Compliance Standards](#compliance-standards)
2. [Implemented Features](#implemented-features)
3. [VoiceOver Support](#voiceover-support)
4. [Dynamic Type Support](#dynamic-type-support)
5. [Reduce Motion Support](#reduce-motion-support)
6. [High Contrast Support](#high-contrast-support)
7. [Keyboard Navigation](#keyboard-navigation)
8. [Testing Procedures](#testing-procedures)
9. [Accessibility Checklist](#accessibility-checklist)
10. [Common Issues and Solutions](#common-issues-and-solutions)

---

## Compliance Standards

### WCAG 2.1 Level AA Compliance

The Fleet Manager iOS app adheres to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards:

#### Perceivable
- **1.1.1 Non-text Content**: All images, icons, and non-text content have text alternatives
- **1.3.1 Info and Relationships**: Semantic structure is properly conveyed to assistive technologies
- **1.3.2 Meaningful Sequence**: Reading order is logical and meaningful
- **1.4.3 Contrast (Minimum)**: Text has a contrast ratio of at least 4.5:1
- **1.4.4 Resize Text**: Text can be resized up to 200% without loss of functionality
- **1.4.5 Images of Text**: Text is used instead of images of text where possible
- **1.4.10 Reflow**: Content reflows for different screen sizes and orientations
- **1.4.11 Non-text Contrast**: UI components have contrast ratio of at least 3:1
- **1.4.12 Text Spacing**: No loss of content when text spacing is modified
- **1.4.13 Content on Hover or Focus**: Additional content on hover/focus is dismissible and persistent

#### Operable
- **2.1.1 Keyboard**: All functionality is available via keyboard
- **2.1.2 No Keyboard Trap**: Keyboard focus can be moved away from all components
- **2.1.4 Character Key Shortcuts**: Keyboard shortcuts can be disabled or remapped
- **2.4.3 Focus Order**: Navigation order is logical and sequential
- **2.4.6 Headings and Labels**: Headings and labels are descriptive
- **2.4.7 Focus Visible**: Keyboard focus indicator is visible
- **2.5.1 Pointer Gestures**: All multipoint or path-based gestures have single-pointer alternatives
- **2.5.2 Pointer Cancellation**: Up-event activation or abort/undo capability
- **2.5.3 Label in Name**: Accessible name matches visible text label
- **2.5.4 Motion Actuation**: Motion-based functionality can be disabled

#### Understandable
- **3.1.1 Language of Page**: Language is programmatically specified
- **3.2.3 Consistent Navigation**: Navigation is consistent across screens
- **3.2.4 Consistent Identification**: Components with same functionality are identified consistently
- **3.3.1 Error Identification**: Errors are identified and described in text
- **3.3.2 Labels or Instructions**: Labels and instructions are provided
- **3.3.3 Error Suggestion**: Error correction suggestions are provided
- **3.3.4 Error Prevention**: Submissions can be reviewed and corrected

#### Robust
- **4.1.2 Name, Role, Value**: UI components have appropriate names, roles, and values
- **4.1.3 Status Messages**: Status messages are programmatically determinable

### Section 508 Compliance

The app meets Section 508 standards (36 CFR 1194) for federal accessibility:

- **§1194.21(a)**: Text labels or text equivalents for all non-text elements
- **§1194.21(b)**: Equivalent text alternatives for multimedia presentations
- **§1194.21(c)**: Color is not the sole method of conveying information
- **§1194.21(d)**: Documents are organized for readability without stylesheets
- **§1194.21(e)**: Redundant text links for server-side image maps
- **§1194.21(f)**: Client-side image maps with redundant text links
- **§1194.21(g)**: Row and column headers for data tables
- **§1194.21(h)**: Markup for data table associations
- **§1194.21(i)**: Frames are titled with descriptive text
- **§1194.21(j)**: No screen flicker rate between 2 Hz and 55 Hz
- **§1194.21(k)**: Text-only page when compliance cannot be achieved
- **§1194.21(l)**: Forms are accessible with labels and instructions

---

## Implemented Features

### AccessibilityManager.swift

The `AccessibilityManager` class provides centralized accessibility functionality:

```swift
let accessibilityManager = AccessibilityManager.shared

// Check VoiceOver status
if accessibilityManager.isVoiceOverRunning {
    // Provide additional audio feedback
}

// Check Reduce Motion
if accessibilityManager.isReduceMotionEnabled {
    // Use simplified animations
}

// Announce to VoiceOver
accessibilityManager.announce("Action completed", priority: .high)

// Scale fonts for Dynamic Type
let scaledSize = accessibilityManager.scaledFontSize(16)
```

### Key Features

1. **VoiceOver Support**
   - All UI elements have descriptive labels
   - Proper heading hierarchy
   - Custom actions for complex gestures
   - Accessibility announcements for important events

2. **Dynamic Type**
   - All text scales with user preferences
   - Layout adapts to larger text sizes
   - Supports accessibility size categories (up to AXXXLarge)

3. **Reduce Motion**
   - Alternative animations when reduce motion is enabled
   - Static transitions instead of animated ones
   - No parallax or motion-based UI

4. **High Contrast**
   - Increased contrast when high contrast mode is enabled
   - Border emphasis on interactive elements
   - No reliance on color alone for information

5. **Minimum Touch Targets**
   - All interactive elements are at least 44x44 points
   - Adequate spacing between touch targets
   - Extended touch areas for small visual elements

---

## VoiceOver Support

### Implementation Guidelines

#### 1. Accessibility Labels

Every interactive element must have a descriptive label:

```swift
Button(action: { }) {
    Image(systemName: "plus")
}
.accessibilityLabel("Add Vehicle")
```

#### 2. Accessibility Hints

Provide hints for complex interactions:

```swift
Button("Submit") { }
    .accessibilityLabel("Submit form")
    .accessibilityHint("Double tap to submit the vehicle inspection form")
```

#### 3. Accessibility Values

For elements with dynamic values:

```swift
Slider(value: $fuelLevel, in: 0...100)
    .accessibilityLabel("Fuel Level")
    .accessibilityValue("\(Int(fuelLevel)) percent")
```

#### 4. Heading Hierarchy

Mark important headings:

```swift
Text("Vehicle Details")
    .font(.title)
    .accessibilityAddTraits(.isHeader)
```

#### 5. Group Related Elements

Combine related elements for better VoiceOver flow:

```swift
HStack {
    Image(systemName: "car")
    Text("Vehicle 123")
}
.accessibilityElement(children: .combine)
.accessibilityLabel("Vehicle 123")
```

#### 6. Hide Decorative Elements

```swift
Image(systemName: "background.pattern")
    .accessibilityHidden(true)
```

#### 7. Custom Actions

Provide custom actions for swipe gestures:

```swift
.accessibilityAction(named: "Delete") {
    deleteItem()
}
.accessibilityAction(named: "Edit") {
    editItem()
}
```

### VoiceOver Announcements

Use announcements for important events:

```swift
// Success announcement
accessibilityManager.announce("Vehicle saved successfully", priority: .high)

// Error announcement
accessibilityManager.announce("Error: Unable to connect to server", priority: .high)

// Screen change
accessibilityManager.notifyScreenChanged()

// Layout change
accessibilityManager.notifyLayoutChanged(focusOn: newElement)
```

---

## Dynamic Type Support

### Font Scaling

All fonts must scale with user preferences:

```swift
// Using AccessibilityManager
Text("Hello")
    .font(.system(size: accessibilityManager.scaledFontSize(16)))

// Using scaled system font
Text("Hello")
    .font(.body) // Automatically scales
```

### Layout Adaptation

Layouts should adapt to larger text:

```swift
// Use adaptive layouts
VStack(spacing: 8) {
    if accessibilityManager.isAccessibilityCategory {
        // Vertical layout for large text
        VStack {
            label
            value
        }
    } else {
        // Horizontal layout for normal text
        HStack {
            label
            Spacer()
            value
        }
    }
}
```

### Supported Size Categories

- Extra Small (XS)
- Small (S)
- Medium (M)
- Large (L) - Default
- Extra Large (XL)
- Extra Extra Large (XXL)
- Extra Extra Extra Large (XXXL)
- Accessibility Medium (AX Medium)
- Accessibility Large (AX Large)
- Accessibility Extra Large (AX XLarge)
- Accessibility Extra Extra Large (AX XXLarge)
- Accessibility Extra Extra Extra Large (AX XXXLarge)

---

## Reduce Motion Support

### Implementation

Check reduce motion status and provide alternatives:

```swift
// Using AccessibilityManager
accessibilityManager.withOptionalAnimation(.spring()) {
    isExpanded.toggle()
}

// Manual check
if accessibilityManager.isReduceMotionEnabled {
    // No animation
    isExpanded.toggle()
} else {
    withAnimation(.spring()) {
        isExpanded.toggle()
    }
}
```

### Animation Guidelines

1. **Avoid Parallax Effects**: No depth-based animations
2. **Reduce Transitions**: Use fade or simple transitions
3. **No Auto-Play**: Don't auto-play videos or animations
4. **User Control**: Let users control all motion
5. **Disable Particles**: Turn off particle effects
6. **Simplify Gestures**: Provide non-gesture alternatives

### Reduce Motion Alternatives

| Motion Effect | Alternative |
|--------------|-------------|
| Spring animation | Instant state change |
| Slide transition | Fade transition |
| Rotation | Instant rotation |
| Scale animation | Cross-fade |
| Parallax scrolling | Standard scrolling |

---

## High Contrast Support

### Contrast Ratios

#### WCAG 2.1 Level AA Requirements

- **Normal Text**: Minimum 4.5:1 contrast ratio
- **Large Text** (18pt+ or 14pt+ bold): Minimum 3:1 contrast ratio
- **UI Components**: Minimum 3:1 contrast ratio
- **Graphical Objects**: Minimum 3:1 contrast ratio

#### WCAG 2.1 Level AAA Requirements

- **Normal Text**: Minimum 7:1 contrast ratio
- **Large Text**: Minimum 4.5:1 contrast ratio

### Implementation

```swift
// Check high contrast mode
if accessibilityManager.isHighContrastEnabled {
    // Use higher contrast colors
    foregroundColor = .black
    backgroundColor = .white
    borderWidth = 2
} else {
    foregroundColor = .primary
    backgroundColor = .systemBackground
    borderWidth = 1
}

// Using helper method
Text("Important")
    .foregroundColor(
        accessibilityManager.contrastAwareColor(
            normal: .gray,
            highContrast: .black
        )
    )
```

### High Contrast Guidelines

1. **Increase Border Width**: Make borders more prominent
2. **Add Borders**: Add borders to borderless elements
3. **Stronger Colors**: Use more saturated colors
4. **No Gradient Backgrounds**: Use solid colors
5. **Clear Indicators**: Make selection states obvious
6. **Text Outlines**: Add outlines to text on images

---

## Keyboard Navigation

### Focus Management

Ensure logical tab order and visible focus indicators:

```swift
// Custom focus state
@FocusState private var focusedField: Field?

enum Field {
    case email
    case password
}

// Apply focus
TextField("Email", text: $email)
    .focused($focusedField, equals: .email)

SecureField("Password", text: $password)
    .focused($focusedField, equals: .password)

// Move focus programmatically
focusedField = .password
```

### Focus Indicators

All focusable elements must have visible focus indicators:

```swift
TextField("Search", text: $searchText)
    .overlay(
        RoundedRectangle(cornerRadius: 8)
            .stroke(
                focusedField == .search ? Color.blue : Color.clear,
                lineWidth: 2
            )
    )
```

### Keyboard Shortcuts

Provide keyboard shortcuts for common actions:

```swift
Button("New Vehicle") { }
    .keyboardShortcut("n", modifiers: .command)

Button("Save") { }
    .keyboardShortcut("s", modifiers: .command)
```

---

## Testing Procedures

### Manual Testing

#### VoiceOver Testing

1. **Enable VoiceOver**:
   - Settings → Accessibility → VoiceOver → On
   - Or triple-click side button (if enabled)

2. **Navigation**:
   - Swipe right: Next element
   - Swipe left: Previous element
   - Two-finger swipe up: Read from top
   - Two-finger swipe down: Read from current position

3. **Activation**:
   - Double-tap: Activate element
   - Double-tap and hold: Activate and hold
   - Three-finger triple-tap: Screen curtain

4. **Test Checklist**:
   - [ ] All interactive elements are reachable
   - [ ] All elements have descriptive labels
   - [ ] Heading hierarchy is correct
   - [ ] Images have alt text
   - [ ] Forms have proper labels
   - [ ] Errors are announced
   - [ ] Success messages are announced
   - [ ] Loading states are communicated

#### Dynamic Type Testing

1. **Change Text Size**:
   - Settings → Accessibility → Display & Text Size → Larger Text
   - Adjust slider to maximum

2. **Test Checklist**:
   - [ ] All text scales properly
   - [ ] No text truncation
   - [ ] Layout adapts to larger text
   - [ ] Buttons remain tappable
   - [ ] No overlapping content
   - [ ] Scrolling works correctly

#### Reduce Motion Testing

1. **Enable Reduce Motion**:
   - Settings → Accessibility → Motion → Reduce Motion → On

2. **Test Checklist**:
   - [ ] No jarring animations
   - [ ] Smooth transitions
   - [ ] No parallax effects
   - [ ] No auto-playing content
   - [ ] Alternatives for motion-based features

#### High Contrast Testing

1. **Enable High Contrast**:
   - Settings → Accessibility → Display & Text Size → Increase Contrast → On

2. **Test Checklist**:
   - [ ] Sufficient contrast ratios
   - [ ] Clear element boundaries
   - [ ] Visible focus indicators
   - [ ] No information conveyed by color alone
   - [ ] Text is readable on all backgrounds

### Automated Testing

#### Xcode Accessibility Inspector

1. Open Xcode → Xcode → Open Developer Tool → Accessibility Inspector
2. Select target device/simulator
3. Inspect each screen
4. Run audit
5. Review issues and warnings

#### UI Tests with Accessibility

```swift
func testAccessibilityLabels() {
    let app = XCUIApplication()
    app.launch()

    // Test button labels
    XCTAssertTrue(app.buttons["Add Vehicle"].exists)

    // Test heading hierarchy
    XCTAssertTrue(app.staticTexts["Dashboard"].exists)

    // Test values
    let fuelLevel = app.sliders["Fuel Level"]
    XCTAssertTrue(fuelLevel.exists)
    XCTAssertEqual(fuelLevel.value as? String, "50 percent")
}
```

---

## Accessibility Checklist

### Screen-by-Screen Review

#### ✅ Login Screen
- [ ] Email field has label and placeholder
- [ ] Password field has label and toggle visibility
- [ ] Sign in button has descriptive label
- [ ] Error messages are announced
- [ ] Biometric authentication is labeled
- [ ] Remember me toggle has label and value
- [ ] Forgot password link has label
- [ ] Connection status is communicated
- [ ] Loading state is announced

#### ✅ Dashboard Screen
- [ ] Page title is marked as heading
- [ ] Metric cards have labels and values
- [ ] Quick action buttons have labels and hints
- [ ] Refresh gesture has alternative
- [ ] Offline indicator is announced
- [ ] Chart data is accessible
- [ ] Statistics are communicated
- [ ] Navigation is logical

#### ✅ Vehicle List Screen
- [ ] Search field has label
- [ ] Filter button has label and hint
- [ ] Sort button has label and hint
- [ ] Vehicle cards are grouped
- [ ] Status badges have labels
- [ ] Fuel level is communicated
- [ ] Pull to refresh has alternative
- [ ] Empty state is announced
- [ ] Error state is communicated

#### ✅ Vehicle Detail Screen
- [ ] Page title includes vehicle number
- [ ] All sections have headings
- [ ] Info rows have labels and values
- [ ] Map has description
- [ ] Action buttons have labels and hints
- [ ] Progress bars have labels and values
- [ ] Alerts are announced
- [ ] Tags are labeled
- [ ] Back navigation is clear

#### ✅ Vehicle Inspection Screen
- [ ] Form fields have labels
- [ ] Required fields are indicated
- [ ] Validation errors are clear
- [ ] Photo capture has alternatives
- [ ] Pass/Fail buttons have clear labels
- [ ] Notes field has label
- [ ] Submit button has confirmation
- [ ] Progress is communicated

### Component-Level Checklist

#### Buttons
- [ ] Minimum 44x44pt touch target
- [ ] Descriptive label
- [ ] Clear purpose hint
- [ ] Disabled state is communicated
- [ ] Loading state is announced

#### Form Fields
- [ ] Descriptive label
- [ ] Current value is announced
- [ ] Placeholder text is clear
- [ ] Error messages are associated
- [ ] Helper text is accessible
- [ ] Required fields are indicated

#### Images
- [ ] Informative images have alt text
- [ ] Decorative images are hidden
- [ ] Complex images have descriptions
- [ ] Icons are labeled or supplemented

#### Lists
- [ ] List items are navigable
- [ ] Row actions are accessible
- [ ] Empty state is announced
- [ ] Loading state is communicated
- [ ] Item count is available

#### Modals/Sheets
- [ ] Modal title is heading
- [ ] Dismiss button has label
- [ ] Focus moves to modal on open
- [ ] Focus returns on close
- [ ] Content is accessible

---

## Common Issues and Solutions

### Issue: Truncated Text with Dynamic Type

**Problem**: Text is cut off when using larger text sizes.

**Solution**:
```swift
// Bad
Text("Long text here")
    .frame(height: 44)

// Good
Text("Long text here")
    .lineLimit(nil)
    .fixedSize(horizontal: false, vertical: true)
```

### Issue: VoiceOver Reading Wrong Order

**Problem**: Elements are read in incorrect order.

**Solution**:
```swift
// Use proper stacking and grouping
VStack(alignment: .leading) {
    Text("Title")
        .accessibilityAddTraits(.isHeader)
    Text("Description")
}
.accessibilityElement(children: .contain)
```

### Issue: Button Too Small to Tap

**Problem**: Interactive elements are smaller than 44x44 points.

**Solution**:
```swift
Button(action: { }) {
    Image(systemName: "heart")
}
.frame(minWidth: 44, minHeight: 44)
// Or use helper
.accessibleTouchTarget()
```

### Issue: Color-Only Information

**Problem**: Information conveyed by color alone (e.g., red = error).

**Solution**:
```swift
// Bad
Text("Error")
    .foregroundColor(.red)

// Good
HStack {
    Image(systemName: "exclamationmark.triangle.fill")
    Text("Error: Invalid input")
}
.foregroundColor(.red)
```

### Issue: No Focus Indicator

**Problem**: Can't see which element has keyboard focus.

**Solution**:
```swift
@FocusState private var isFocused: Bool

TextField("Email", text: $email)
    .focused($isFocused)
    .overlay(
        RoundedRectangle(cornerRadius: 8)
            .stroke(isFocused ? Color.blue : Color.clear, lineWidth: 2)
    )
```

### Issue: Missing Error Announcements

**Problem**: Errors appear but aren't announced to VoiceOver.

**Solution**:
```swift
if let error = errorMessage {
    Text(error)
        .onAppear {
            accessibilityManager.announce(
                "Error: \(error)",
                priority: .high
            )
        }
}
```

### Issue: Animations Causing Motion Sickness

**Problem**: Animations are too fast or complex.

**Solution**:
```swift
// Use AccessibilityManager
accessibilityManager.withOptionalAnimation {
    isExpanded.toggle()
}

// Or check manually
let animation = accessibilityManager.isReduceMotionEnabled
    ? nil
    : .spring()
withAnimation(animation) {
    isExpanded.toggle()
}
```

---

## Resources

### Apple Documentation

- [Accessibility for iOS](https://developer.apple.com/accessibility/ios/)
- [VoiceOver Programming Guide](https://developer.apple.com/library/archive/documentation/Accessibility/Conceptual/AccessibilityMacOSX/)
- [Supporting Dynamic Type](https://developer.apple.com/design/human-interface-guidelines/foundations/typography)

### WCAG Guidelines

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Understanding WCAG 2.1](https://www.w3.org/WAI/WCAG21/Understanding/)

### Section 508 Standards

- [Section 508 Standards](https://www.section508.gov/)
- [ICT Accessibility Standards](https://www.access-board.gov/ict/)

### Testing Tools

- Xcode Accessibility Inspector
- VoiceOver
- [Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Color Oracle](https://colororacle.org/) (Color blindness simulator)

---

## Certification and Compliance

### Compliance Statement

The Fleet Manager iOS application has been designed and tested to meet:

- ✅ WCAG 2.1 Level AA
- ✅ Section 508 Standards
- ✅ Apple Accessibility Guidelines

### Last Audit Date

**Date**: 2025-11-11
**Auditor**: Development Team
**Status**: Compliant

### Contact

For accessibility concerns or to report accessibility issues:

**Email**: accessibility@capitaltechalliance.com
**Phone**: 1-800-FLEET-ACCESS

---

*This document should be reviewed and updated quarterly or when significant changes are made to the application.*
