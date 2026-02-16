# Custom Theme Builder Guide

## Overview

Fleet-CTA allows administrators and advanced users to create custom themes using the theme builder API. This guide covers creating, generating, and managing custom themes.

## Creating a Theme Programmatically

### Basic Theme Creation

```typescript
import { createCustomTheme } from '@/lib/themes'

const myTheme = createCustomTheme({
  primaryColor: '#FF6B35',      // Main brand color
  secondaryColor: '#41B2E3',    // Secondary color
  accentColor: '#F0A000',       // Accent/highlight
  darkMode: false,              // Light or dark background
  highContrast: false,          // Enhanced contrast
  fontSize: 'medium',           // Font size setting
  density: 'comfortable',       // Spacing density
})

// Apply the theme
setTheme(myTheme)
```

### Advanced Theme Generation

```typescript
import { generateThemeFromColor } from '@/lib/themes'

// Generate with specific requirements
const accessibleTheme = generateThemeFromColor({
  primaryColor: '#0173B2',
  secondaryColor: '#DE8F05',
  darkMode: false,
  highContrast: true,          // Maximum contrast
  colorBlindMode: 'deuteranopia', // Colorblind safe
})
```

## Theme Color Selection

### Choosing Primary Color

**Primary color** should:
- Be your brand color
- Contrast well with white (for light mode)
- Contrast well with black (for dark mode)
- Have sufficient saturation (~50-90%)
- Not be pure red/green/yellow alone

**Good choices**:
- Blue: `#0173B2`, `#2563EB`, `#005BA6`
- Purple: `#7C3AED`, `#6366F1`, `#A78BFA`
- Orange: `#DE8F05`, `#D97706`, `#F59E0B`

**Avoid**:
- Pure red `#FF0000` (problematic for colorblind users)
- Pure green `#00FF00` (problematic for colorblind users)
- Low contrast combinations

### Choosing Secondary Color

**Secondary color** should:
- Complement your primary color
- Be visually distinct from primary
- Work on same background as primary
- Provide good contrast with text

**Good complementary pairs**:
- Blue + Purple
- Blue + Orange
- Orange + Teal
- Purple + Yellow

### Choosing Accent Color

**Accent color** should:
- Be used sparingly for highlights
- Have high contrast with both primary and secondary
- Draw attention without being overwhelming
- Be distinct from success/warning/error colors

## Contrast Validation

### Validating Your Theme

```typescript
import { validateThemeContrast } from '@/lib/themes'

const validation = validateThemeContrast(myTheme)

if (validation.valid) {
  console.log('✅ Theme is accessible!')
  console.log('Contrast ratios:', validation.ratios)
} else {
  console.error('❌ Accessibility issues found:')
  validation.issues.forEach(issue => {
    console.error(`  - ${issue}`)
  })
}
```

### Checking Specific Color Pairs

```typescript
import { calculateContrastRatio, meetsWCAGLevel } from '@/lib/themes'

// Check if colors meet WCAG AA
const ratio = calculateContrastRatio('#0173B2', '#FFFFFF')
console.log(`Contrast ratio: ${ratio.toFixed(2)}:1`)

if (meetsWCAGLevel('#0173B2', '#FFFFFF', 'AA')) {
  console.log('✅ Meets WCAG AA')
} else if (meetsWCAGLevel('#0173B2', '#FFFFFF', 'A')) {
  console.log('⚠️  Meets WCAG A only')
} else {
  console.log('❌ Does not meet WCAG A')
}
```

## Custom Theme Builder UI

### Implementing a Theme Builder Component

```tsx
import { useState } from 'react'
import { createCustomTheme, useTheme } from '@/lib/themes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function ThemeBuilder() {
  const { setTheme, validateContrast } = useTheme()
  const [config, setConfig] = useState({
    primaryColor: '#2563EB',
    secondaryColor: '#7C3AED',
    accentColor: '#EC4899',
    darkMode: false,
    highContrast: false,
    fontSize: 'medium' as const,
    density: 'comfortable' as const,
  })
  const [validation, setValidation] = useState<any>(null)

  const handleColorChange = (field: string, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }))
  }

  const handlePreview = () => {
    const theme = createCustomTheme(config)
    setTheme(theme)

    // Validate
    const result = validateContrast()
    setValidation(result)
  }

  const handleSave = () => {
    const theme = createCustomTheme(config)
    setTheme(theme)
    // Save to backend if needed
    console.log('Theme saved:', theme)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Custom Theme Builder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Color Inputs */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primary"
                  type="color"
                  value={config.primaryColor}
                  onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                  className="w-12 h-10"
                />
                <Input
                  type="text"
                  value={config.primaryColor}
                  onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                  placeholder="#0000FF"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary">Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="secondary"
                  type="color"
                  value={config.secondaryColor}
                  onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                  className="w-12 h-10"
                />
                <Input
                  type="text"
                  value={config.secondaryColor}
                  onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accent">Accent Color</Label>
              <div className="flex gap-2">
                <Input
                  id="accent"
                  type="color"
                  value={config.accentColor}
                  onChange={(e) => handleColorChange('accentColor', e.target.value)}
                  className="w-12 h-10"
                />
                <Input
                  type="text"
                  value={config.accentColor}
                  onChange={(e) => handleColorChange('accentColor', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-2">
            <Label>
              <input
                type="checkbox"
                checked={config.darkMode}
                onChange={(e) => handleColorChange('darkMode', e.target.checked)}
              />
              {' '}Dark Mode
            </Label>
            <Label>
              <input
                type="checkbox"
                checked={config.highContrast}
                onChange={(e) => handleColorChange('highContrast', e.target.checked)}
              />
              {' '}High Contrast
            </Label>
          </div>

          {/* Validation Results */}
          {validation && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold mb-2">Validation Results</h4>
              <p>
                {validation.valid ? '✅ Valid' : '❌ Invalid'} -
                {Object.entries(validation.ratios).map(([pair, ratio]) => (
                  <div key={pair} className="text-sm">
                    {pair}: {ratio}
                  </div>
                ))}
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2">
            <Button onClick={handlePreview} variant="outline">
              Preview
            </Button>
            <Button onClick={handleSave}>
              Save Theme
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Live Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div
              className="p-4 rounded text-white text-sm"
              style={{ backgroundColor: config.primaryColor }}
            >
              Primary
            </div>
            <div
              className="p-4 rounded text-white text-sm"
              style={{ backgroundColor: config.secondaryColor }}
            >
              Secondary
            </div>
            <div
              className="p-4 rounded text-white text-sm"
              style={{ backgroundColor: config.accentColor }}
            >
              Accent
            </div>
            <div
              className="p-4 rounded text-sm border"
              style={{
                backgroundColor: config.darkMode ? '#1a1a1a' : '#ffffff',
                color: config.darkMode ? '#ffffff' : '#000000',
              }}
            >
              Background
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

## Exporting Themes

### As JSON

```typescript
import { exportThemeAsJSON } from '@/lib/themes'

const theme = getThemeById('my-theme')
const json = exportThemeAsJSON(theme)

// Save to file
const blob = new Blob([json], { type: 'application/json' })
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = 'my-theme.json'
a.click()
```

### As CSS

```typescript
import { generateThemeCSS } from '@/lib/themes'

const theme = getThemeById('my-theme')
const css = generateThemeCSS(theme)

// Save to file
const blob = new Blob([css], { type: 'text/css' })
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = 'my-theme.css'
a.click()
```

## Importing Themes

### From JSON

```typescript
import type { Theme } from '@/lib/themes'

async function importTheme(file: File) {
  const text = await file.text()
  const theme: Theme = JSON.parse(text)

  // Validate before using
  const validation = validateThemeContrast(theme)
  if (!validation.valid) {
    console.error('Imported theme has issues:', validation.issues)
    return
  }

  // Apply theme
  setTheme(theme)
}
```

## Best Practices

### 1. Start with an Existing Theme

```typescript
import { THEME_LIGHT } from '@/lib/themes'

// Modify an existing theme
const customTheme: Theme = {
  ...THEME_LIGHT,
  id: 'custom-branding',
  name: 'Corporate Branding',
  colors: {
    ...THEME_LIGHT.colors,
    primary: '#FF6B35',    // Your brand color
    secondary: '#41B2E3',  // Your secondary color
  },
}
```

### 2. Always Validate

```typescript
const validation = validateThemeContrast(myTheme)
if (!validation.valid) {
  throw new Error(`Theme validation failed: ${validation.issues.join(', ')}`)
}
```

### 3. Test with Real Users

- Get colorblind users to test
- Test with old eyes (presbyopia)
- Test with different displays
- Test in different lighting conditions

### 4. Document Your Choices

```typescript
/**
 * Ocean Theme
 * - Primary: Ocean blue for trust and calm
 * - Secondary: Teal for complementary support
 * - Accent: Gold for premium feel
 *
 * WCAG Level: AA (4.5:1 minimum contrast)
 * Colorblind safe: Yes (Deuteranopia tested)
 * Created: 2024-02-15
 * Maintainer: Design Team
 */
```

### 5. Version Your Themes

```typescript
const THEME_OCEAN_V2: Theme = {
  id: 'ocean-v2',
  name: 'Ocean (2024)',
  // ... updated colors ...
}
```

## Troubleshooting

### Theme Not Applying

1. Check theme ID: `getThemeById('theme-id')`
2. Verify colors are valid hex: `/^#[0-9A-Fa-f]{6}$/`
3. Ensure theme object has all required fields
4. Clear cache: `localStorage.removeItem('app-theme')`

### Contrast Issues

```typescript
// Increase brightness of light colors
const improvedColor = adjustBrightness('#CCCCCC', +10)

// Decrease brightness of dark colors
const improvedColor = adjustBrightness('#333333', -10)
```

### Performance Issues

- Limit to 20 custom themes per user
- Use CSS variables instead of inline styles
- Pre-generate CSS on server if possible
- Cache theme CSS in localStorage

## Advanced: Creating Themed Components

```tsx
// Use theme colors in component styles
import { useCurrentTheme } from '@/lib/themes'

export function ThemedComponent() {
  const theme = useCurrentTheme()

  return (
    <div
      style={{
        '--primary': theme.colors.primary,
        '--secondary': theme.colors.secondary,
        '--accent': theme.colors.accent,
      } as React.CSSProperties}
    >
      {/* Component uses CSS variables */}
    </div>
  )
}
```

## API Reference

### `createCustomTheme(config: CustomThemeConfig): Theme`

Creates a custom theme from configuration.

```typescript
const theme = createCustomTheme({
  primaryColor: '#FF6B35',
  secondaryColor: '#41B2E3',
  accentColor: '#F0A000',
  darkMode: false,
  highContrast: false,
  fontSize: 'medium',
  density: 'comfortable',
})
```

### `generateThemeFromColor(options: ThemeGenerationOptions): Theme`

Generates a theme from color inputs with specific options.

```typescript
const theme = generateThemeFromColor({
  primaryColor: '#0173B2',
  secondaryColor: '#DE8F05',
  darkMode: false,
  highContrast: true,
  colorBlindMode: 'deuteranopia',
})
```

### `validateThemeContrast(theme: Theme): ValidationResult`

Validates theme contrast ratios.

```typescript
const validation = validateThemeContrast(theme)
// Returns: { valid: boolean, issues: string[], ratios: Record<string, number> }
```

### `generateThemeCSS(theme: Theme): string`

Generates CSS for a theme.

```typescript
const css = generateThemeCSS(theme)
// Returns CSS string with variables and utilities
```

## Resources

- [Color Theory Basics](https://www.smashingmagazine.com/2021/07/color-theory/)
- [WCAG Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Color Harmonies](https://www.interaction-design.org/literature/article/color-theory-for-designers)
- [Accessible Colors](https://accessible-colors.com/)

## Examples

See `src/lib/themes/preset-themes.ts` for 9 pre-built theme examples.

## Contributing Custom Themes

To contribute a custom theme to Fleet-CTA:

1. Create and validate your theme
2. Test with colorblind users
3. Document design decisions
4. Submit PR with theme + tests
5. Get approval from accessibility team

## Questions?

See [THEMES.md](./THEMES.md) for general information or contact the design system team.
