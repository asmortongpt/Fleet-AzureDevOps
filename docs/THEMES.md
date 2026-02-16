# Theme System Documentation

## Overview

Fleet-CTA includes a comprehensive, accessible theme system that supports 8+ pre-configured themes and dynamic theme generation. The system is built with WCAG accessibility standards at its core, providing multiple theme variants including high-contrast and colorblind-friendly options.

## Quick Start

### Using a Theme

Users can select themes from the **Appearance Settings** page:

1. Navigate to **Settings** → **Appearance**
2. Find the **Theme Selection** card
3. Click on a theme to apply it
4. The theme is automatically saved to browser localStorage

### Accessing Accessibility Themes

To view specialized accessibility themes:

1. In the Theme Selection card, click the **Accessibility** button
2. Browse:
   - **High Contrast Light** - WCAG AAA+ (8.5:1 contrast ratio)
   - **High Contrast Dark** - WCAG AAA+ dark mode variant
   - **Deuteranopia Safe** - For red-green colorblindness
   - **Protanopia Safe** - For red-blindness
   - **Tritanopia Safe** - For blue-yellow colorblindness

### Validating Theme Contrast

To verify a theme meets accessibility standards:

1. Click **Check Contrast** button in the Contrast Validation section
2. View the WCAG level (A, AA, or AAA)
3. Review specific contrast ratios between color pairs
4. Check for any compliance issues

## Available Themes

### Standard Themes

| Theme | Variant | WCAG Level | Contrast Ratio | Use Case |
|-------|---------|-----------|----------------|----------|
| Light | light | AA | 4.5:1 | Default light mode |
| Dark | dark | AA | 4.5:1 | Dark mode alternative |
| Warm Light | light | AA | 4.5:1 | Warm color palette |
| Cool Light | light | AA | 4.5:1 | Cool color palette |

### Accessibility Themes

| Theme | Variant | WCAG Level | Contrast Ratio | For Users With |
|-------|---------|-----------|----------------|-----------------|
| High Contrast Light | high-contrast | AAA | 8.5:1 | Low vision |
| High Contrast Dark | high-contrast | AAA | 8.5:1 | Low vision (dark) |
| Deuteranopia Safe | deuteranopia | AAA | 7.5:1 | Red-green colorblindness (~1% of males) |
| Protanopia Safe | protanopia | AAA | 7.5:1 | Red-blindness (~0.5% of males) |
| Tritanopia Safe | tritanopia | AAA | 7.5:1 | Blue-yellow colorblindness (<0.001%) |

## Theme Structure

### Theme Object

```typescript
interface Theme {
  id: string                           // Unique identifier
  name: string                         // Display name
  variant: ThemeVariant               // light, dark, high-contrast, etc.
  colors: ThemeColors                 // Color palette
  typography?: Typography             // Optional typography settings
  spacing?: Spacing                   // Optional spacing scales
  borders?: Borders                   // Optional border styles
  shadows?: Shadows                   // Optional shadow definitions
  transitions?: Transitions           // Optional transition timings
  wcagLevel?: 'A' | 'AA' | 'AAA'     // WCAG compliance level
  contrastRatio?: number              // Minimum contrast ratio
}
```

### Color Palette

Every theme includes these essential colors:

```typescript
interface ThemeColors {
  primary: string              // Main brand color
  secondary: string            // Secondary brand color
  accent: string              // Accent/highlight color
  background: string          // Page background
  surface: string             // Surface/card background
  foreground: string          // Text color
  muted: string              // Muted text/borders
  mutedForeground: string    // Muted text
  border: string             // Border color
  success: string            // Success state (green)
  warning: string            // Warning state (yellow/orange)
  error: string              // Error state (red)
  info: string               // Info state (blue)
  destructive: string        // Destructive action (red)
}
```

## CSS Variables

Themes are applied via CSS custom properties. After theme selection, these variables are available:

```css
:root {
  --primary: #2563EB;
  --secondary: #7C3AED;
  --accent: #EC4899;
  --background: #FFFFFF;
  --surface: #F8FAFC;
  --foreground: #0F172A;
  /* ... and 8+ more */
}
```

### Using CSS Variables in Styles

```css
/* In your component styles */
.my-button {
  background-color: var(--primary);
  color: var(--background);
  border: 1px solid var(--border);
}
```

### Using in Tailwind

Tailwind classes automatically respect theme colors:

```tsx
<button className="bg-primary text-background hover:bg-secondary">
  Click me
</button>
```

## Programmatic Theme Access

### Using the Theme Hook

```tsx
import { useTheme } from '@/lib/themes'

export function MyComponent() {
  const { currentTheme, setTheme, themes } = useTheme()

  return (
    <div>
      <p>Current theme: {currentTheme.name}</p>
      <button onClick={() => setTheme('dark')}>
        Switch to Dark
      </button>
    </div>
  )
}
```

### Getting Available Themes

```tsx
import { useAvailableThemes } from '@/lib/themes'

export function ThemeList() {
  const themes = useAvailableThemes()

  return (
    <ul>
      {themes.map(theme => (
        <li key={theme.id}>{theme.name} (WCAG {theme.wcagLevel})</li>
      ))}
    </ul>
  )
}
```

### Accessing Current Theme Colors

```tsx
import { useCurrentTheme } from '@/lib/themes'

export function ColorDisplay() {
  const theme = useCurrentTheme()

  return (
    <div style={{ backgroundColor: theme.colors.primary }}>
      Primary color: {theme.colors.primary}
    </div>
  )
}
```

## Contrast Validation

### WCAG Levels

Fleet-CTA uses WCAG 2.1 contrast ratio standards:

- **WCAG A**: 3:1 minimum contrast ratio
- **WCAG AA**: 4.5:1 minimum contrast ratio (recommended)
- **WCAG AAA**: 7:1 minimum contrast ratio (enhanced)

### Validating Themes Programmatically

```typescript
import { validateThemeContrast } from '@/lib/themes'

const validation = validateThemeContrast(myTheme)

if (validation.valid) {
  console.log('Theme meets accessibility standards')
  console.log('Ratios:', validation.ratios)
} else {
  console.error('Issues found:', validation.issues)
}
```

### Calculating Contrast Ratios

```typescript
import { calculateContrastRatio, meetsWCAGLevel } from '@/lib/themes'

const ratio = calculateContrastRatio('#000000', '#FFFFFF') // Returns 21
const isAAA = meetsWCAGLevel('#000000', '#FFFFFF', 'AAA')  // Returns true
```

## Colorblind-Friendly Design

### Why Colorblind Themes Matter

Approximately 8% of males and 0.5% of females have some form of color vision deficiency. Our colorblind-safe themes use:

1. **Color differentiation** - Colors chosen visible to colorblind users
2. **Pattern differentiation** - Shapes and patterns supplement colors
3. **Text labels** - Explicit labels for color-coded information

### Deuteranopia (Red-Green Blindness)

- **Affects**: ~1% of males
- **Sees**: Blue and yellow well
- **Avoids**: Red/green distinction alone
- **Theme**: Uses blue/yellow/purple palettes

### Protanopia (Red-Blindness)

- **Affects**: ~0.5% of males
- **Sees**: Blue, cyan, and yellow
- **Avoids**: Red hues entirely
- **Theme**: Uses blue/cyan/yellow palettes

### Tritanopia (Blue-Yellow Blindness)

- **Affects**: <0.001% of population
- **Sees**: Red and cyan
- **Avoids**: Blue/yellow distinction
- **Theme**: Uses red/cyan/orange palettes

## High Contrast Theme

The High Contrast themes provide maximum readability for users with low vision:

- **Minimum contrast ratio**: 8.5:1
- **Pure black on white** (light variant)
- **Pure white on black** (dark variant)
- **WCAG AAA+** compliance

## Theme Persistence

Selected themes are automatically persisted to browser localStorage under the key `app-theme`. This means:

- User's theme choice survives page reloads
- Works across browser sessions
- Respects browser's localStorage limits
- Can be manually cleared if needed

## Creating Custom Themes

### Using the Theme Generator

```typescript
import { createCustomTheme } from '@/lib/themes'

const customTheme = createCustomTheme({
  primaryColor: '#FF6B35',
  secondaryColor: '#41B2E3',
  accentColor: '#F0A000',
  darkMode: false,
  highContrast: false,
  fontSize: 'medium',
  density: 'comfortable',
})

setTheme(customTheme)
```

### Dynamic Theme Generation from Colors

```typescript
import { generateThemeFromColor } from '@/lib/themes'

const theme = generateThemeFromColor({
  primaryColor: '#2563EB',
  secondaryColor: '#7C3AED',
  darkMode: true,
  highContrast: false,
  colorBlindMode: 'deuteranopia'
})
```

## Accessibility Features

### Reduced Motion Support

The theme system respects the `prefers-reduced-motion` CSS media query:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Focus Indicators

All themes include enhanced focus indicators for keyboard navigation:

```css
:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
```

### Pattern Differentiation

Colorblind-safe themes include SVG pattern definitions for additional visual distinction:

- **Success**: Diagonal lines
- **Warning**: Polka dots
- **Error**: Horizontal lines
- **Info**: Vertical lines

## Best Practices

### 1. Always Test Themes

```tsx
import { validateThemeContrast } from '@/lib/themes'

// Before deploying a new theme
const validation = validateThemeContrast(newTheme)
if (!validation.valid) {
  console.error('Theme has contrast issues:', validation.issues)
}
```

### 2. Provide Theme Options

Always offer multiple themes to users:
- Standard light and dark options
- At least one high-contrast option
- Colorblind-safe variants

### 3. Test with Real Users

Use real colorblind users for testing, not just color-blindness simulators.

### 4. Include Text with Color

Never rely on color alone to convey information:

```tsx
// Good
<div style={{ color: 'var(--error)' }}>
  <AlertIcon /> Error occurred
</div>

// Bad
<div style={{ color: 'var(--error)' }}>
  <!-- No icon or text -->
</div>
```

### 5. Provide Sufficient Contrast

Maintain at least WCAG AA (4.5:1) contrast for all text:

```typescript
const ratio = calculateContrastRatio(foreground, background)
if (ratio < 4.5) {
  console.warn('Text contrast insufficient for WCAG AA')
}
```

## Performance Considerations

- **CSS Variables**: Applied via `document.documentElement.style.setProperty()`
- **localStorage**: Persists 1-2 KB per theme selection
- **No runtime color conversion**: Pre-calculated palettes
- **Minimal DOM operations**: Single stylesheet update on theme change

## Browser Support

- ✅ Chrome/Edge 49+
- ✅ Firefox 31+
- ✅ Safari 9.1+
- ✅ iOS Safari 9.3+
- ✅ Android Browser 51+

CSS custom properties are supported in all modern browsers.

## Testing

### Unit Tests

Theme generation and contrast calculation tests:

```bash
npm test -- src/lib/themes/__tests__/theme-generator.test.ts
npm test -- src/lib/themes/__tests__/color-blind-palettes.test.ts
```

### E2E Tests

Theme switching and UI tests:

```bash
npx playwright test tests/e2e/theme-system.spec.ts
```

### Accessibility Tests

WCAG contrast compliance tests:

```bash
npx playwright test tests/a11y/theme-contrast.spec.ts
```

## Troubleshooting

### Theme Not Applying

1. Check browser console for errors
2. Verify theme ID exists: `getThemeById('theme-id')`
3. Clear localStorage: `localStorage.removeItem('app-theme')`
4. Reload page

### Colors Not Updating

1. Verify CSS variables are applied: `getComputedStyle(document.documentElement).getPropertyValue('--primary')`
2. Check for CSS specificity conflicts
3. Ensure theme provider wraps component tree

### Contrast Validation Failing

1. Use `validateThemeContrast()` to check ratios
2. Adjust color values to improve contrast
3. Consider using high-contrast theme variant

## Future Enhancements

- [ ] Custom theme builder UI
- [ ] Theme export/import functionality
- [ ] Per-component theme overrides
- [ ] Dynamic theme generation from image
- [ ] System theme preference detection
- [ ] Theme preview before applying

## Resources

- [WCAG 2.1 Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [Color Blind Awareness](https://www.colourblindawareness.org/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
