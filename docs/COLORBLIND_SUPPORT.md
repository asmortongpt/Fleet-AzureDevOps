# Colorblind-Friendly Design Guide

## Overview

Fleet-CTA includes specialized themes and design guidelines for supporting users with color vision deficiency (CVD). This guide explains how to design and implement colorblind-accessible features.

## Types of Color Blindness

### Deuteranopia (Red-Green, ~1% of males)

**What they see**: Colors appear shifted toward blue/yellow spectrum.

**Red** → Appears as dark brown or black
**Green** → Appears as tan or light brown
**Can see**: Blue, yellow, white, black, gray

**Example**:
- ❌ Red/green stoplight alone
- ✅ Red/green stoplight + symbols (stop/go)
- ✅ Using blue/yellow/purple palette

### Protanopia (Red-Blind, ~0.5% of males)

**What they see**: No perception of red wavelengths.

**Red** → Appears as black or very dark
**Can see**: Yellow, blue, cyan, white, gray

**Example**:
- ❌ Red danger indicators alone
- ✅ Red danger + warning icon
- ✅ Using blue/cyan/yellow palette

### Tritanopia (Blue-Yellow, <0.001%)

**What they see**: Yellow and blue are indistinguishable.

**Yellow** → Appears as pink or white
**Blue** → Appears as pink or red
**Can see**: Red, cyan, white, gray

**Example**:
- ❌ Blue/yellow distinction alone
- ✅ Blue/yellow + text labels
- ✅ Using red/cyan/orange palette

## Fleet-CTA Colorblind Themes

### Deuteranopia Safe Theme

```typescript
import { THEME_DEUTERANOPIA } from '@/lib/themes'

// Primary: Blue (#0173B2) - highly visible
// Secondary: Orange (#DE8F05) - golden orange
// Accent: Purple (#CC78BC) - pattern-differentiated
```

**Use when**: Supporting users with red-green colorblindness

### Protanopia Safe Theme

```typescript
import { THEME_PROTANOPIA } from '@/lib/themes'

// Primary: Deep Blue (#005BA6)
// Secondary: Bright Yellow (#FFBE00)
// Accent: Cyan (#00B4D8)
```

**Use when**: Supporting users with red-blindness

### Tritanopia Safe Theme

```typescript
import { THEME_TRITANOPIA } from '@/lib/themes'

// Primary: Red (#E81828)
// Secondary: Cyan (#00C9A7)
// Accent: Orange-Red (#D55E00)
```

**Use when**: Supporting users with blue-yellow colorblindness

## Design Principles

### 1. Never Use Color Alone

Always combine color with another visual indicator:

```tsx
// ❌ BAD - Color only
<div style={{ color: 'red' }}>Error</div>

// ✅ GOOD - Color + Icon
<div style={{ color: 'var(--error)' }}>
  <ErrorIcon /> Error occurred
</div>

// ✅ GOOD - Color + Pattern
<svg>
  <rect fill="var(--error)" width="100" height="100" />
  <pattern id="error-pattern">
    <line stroke="currentColor" opacity="0.5" />
  </pattern>
</svg>

// ✅ GOOD - Color + Text
<span style={{ color: 'var(--error)' }}>
  ⚠️ Error: Please review this field
</span>
```

### 2. Use Sufficient Contrast

Ensure at least WCAG AA contrast (4.5:1):

```typescript
import { calculateContrastRatio, meetsWCAGLevel } from '@/lib/themes'

const ratio = calculateContrastRatio('#0173B2', '#FFFFFF')
console.assert(ratio >= 4.5, 'Insufficient contrast')
```

### 3. Use Colorblind-Safe Palettes

**AVOID** these color combinations:
- Red + Green (Deuteranopia)
- Red + Black (Protanopia)
- Yellow + Blue (Tritanopia)

**PREFER** these combinations:
- Blue + Yellow + Purple (Deuteranopia safe)
- Blue + Cyan + Yellow (Protanopia safe)
- Red + Cyan + Orange (Tritanopia safe)

### 4. Include Pattern Differentiation

For critical status indicators, add patterns:

```tsx
// Use patterns from theme
export function StatusBadge({ status }: { status: 'success' | 'error' | 'warning' }) {
  const patterns = {
    success: 'url(#pattern-success)', // Diagonal lines
    error: 'url(#pattern-error)',     // Horizontal lines
    warning: 'url(#pattern-warning)', // Dots
  }

  return (
    <div
      style={{
        backgroundColor: `var(--${status})`,
        backgroundImage: patterns[status],
      }}
    />
  )
}
```

### 5. Provide Explicit Labels

Always label color-coded elements:

```tsx
// ✅ Good
<div className="flex items-center gap-2">
  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--success)' }} />
  <span>Operating normally</span>
</div>

// ❌ Bad
<div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--success)' }} />
```

## Implementation Examples

### Status Indicators

```tsx
import { useTheme } from '@/lib/themes'

interface StatusIndicatorProps {
  status: 'success' | 'warning' | 'error' | 'info'
  label: string
}

export function StatusIndicator({ status, label }: StatusIndicatorProps) {
  const { currentTheme } = useTheme()

  const statusConfig = {
    success: { icon: CheckCircle2, text: 'Success' },
    warning: { icon: AlertCircle, text: 'Warning' },
    error: { icon: XCircle, text: 'Error' },
    info: { icon: Info, text: 'Information' },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div className="flex items-center gap-2">
      <Icon
        className="w-5 h-5"
        style={{ color: currentTheme.colors[status] }}
        aria-hidden="true"
      />
      <span>
        {config.text}: {label}
      </span>
    </div>
  )
}
```

### Data Visualization

```tsx
import { LineChart, Line, Bar, BarChart } from 'recharts'
import { THEME_DEUTERANOPIA, THEME_PROTANOPIA } from '@/lib/themes'

interface AccessibleChartProps {
  data: any[]
  colorBlindMode?: 'deuteranopia' | 'protanopia' | 'tritanopia'
}

export function AccessibleChart({
  data,
  colorBlindMode = 'deuteranopia'
}: AccessibleChartProps) {
  // Select palette based on colorblind mode
  const palettes = {
    deuteranopia: ['#0173B2', '#DE8F05', '#CC78BC'],
    protanopia: ['#005BA6', '#FFBE00', '#00B4D8'],
    tritanopia: ['#E81828', '#00C9A7', '#D55E00'],
  }

  const colors = palettes[colorBlindMode]

  return (
    <BarChart data={data}>
      <Bar dataKey="value1" fill={colors[0]} />
      <Bar dataKey="value2" fill={colors[1]} />
      <Bar dataKey="value3" fill={colors[2]} />
    </BarChart>
  )
}
```

### Alert Messages

```tsx
interface AlertProps {
  type: 'success' | 'warning' | 'error' | 'info'
  title: string
  message: string
  icon?: React.ReactNode
}

export function Alert({ type, title, message, icon }: AlertProps) {
  const { currentTheme } = useTheme()

  const config = {
    success: {
      icon: <CheckCircle2 />,
      title: 'Success',
      bg: 'bg-green-50',
    },
    warning: {
      icon: <AlertTriangle />,
      title: 'Warning',
      bg: 'bg-yellow-50',
    },
    error: {
      icon: <X />,
      title: 'Error',
      bg: 'bg-red-50',
    },
    info: {
      icon: <Info />,
      title: 'Information',
      bg: 'bg-blue-50',
    },
  }

  const c = config[type]

  return (
    <div
      className={`p-4 rounded-lg border-l-4 ${c.bg}`}
      style={{
        borderLeftColor: currentTheme.colors[type],
        backgroundColor: `${currentTheme.colors[type]}10`, // 10% opacity
      }}
      role="alert"
    >
      <div className="flex gap-3">
        <div style={{ color: currentTheme.colors[type] }}>
          {icon || c.icon}
        </div>
        <div>
          <h3 className="font-semibold">{title || c.title}</h3>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  )
}
```

### Table Row Highlighting

```tsx
interface TableRowProps {
  status: 'normal' | 'warning' | 'critical'
  children: React.ReactNode
}

export function AccessibleTableRow({ status, children }: TableRowProps) {
  const { currentTheme } = useTheme()

  const statusConfig = {
    normal: { label: 'Normal' },
    warning: { label: 'Warning' },
    critical: { label: 'Critical' },
  }

  const config = statusConfig[status]
  const color = currentTheme.colors[status === 'normal' ? 'success' : status === 'warning' ? 'warning' : 'error']

  return (
    <tr
      className="border-l-4"
      style={{
        borderLeftColor: color,
        // Also use pattern for distinction
        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, ${color}10 10px, ${color}10 11px)`,
      }}
      data-status={status}
      aria-label={`Row with ${config.label} status`}
    >
      {children}
    </tr>
  )
}
```

## Testing Colorblind Accessibility

### Manual Testing

1. **Use a colorblindness simulator**:
   - [Color Oracle](https://colororacle.org/) - Desktop app
   - [Coblis](https://www.color-blindness.com/coblis-color-blindness-simulator/) - Web tool
   - [Daltonize](https://www.daltonize.org/) - Browser extension

2. **Test with colorblind users**:
   - Recruit real users with CVD for testing
   - Ask if your interface is usable
   - Document feedback and iterate

3. **Verify contrast ratios**:
   ```bash
   npx playwright test tests/a11y/theme-contrast.spec.ts
   ```

### Automated Testing

```typescript
import { calculateContrastRatio, meetsWCAGLevel } from '@/lib/themes'

describe('Colorblind Accessibility', () => {
  it('should have sufficient contrast for deuteranopia', () => {
    const ratio = calculateContrastRatio('#0173B2', '#FFFFFF')
    expect(meetsWCAGLevel('#0173B2', '#FFFFFF', 'AAA')).toBe(true)
  })

  it('should use colorblind-safe colors', () => {
    const theme = getThemeById('deuteranopia')
    // Verify colors don't use red/green distinction alone
    expect(theme.colors.primary).not.toBe('#FF0000')
    expect(theme.colors.secondary).not.toBe('#00FF00')
  })
})
```

## Accessibility Checklist

- [ ] Color is never the only means of conveying information
- [ ] All status indicators have icons or text labels
- [ ] Contrast ratios meet WCAG AA minimum (4.5:1)
- [ ] High contrast theme variant is available
- [ ] At least one colorblind-safe theme is provided
- [ ] Data visualizations use colorblind-safe palettes
- [ ] Tested with real colorblind users
- [ ] Tested with colorblindness simulator
- [ ] Documentation available in help/settings
- [ ] Pattern differentiation used for critical statuses

## Resources

### Tools
- [Color Oracle](https://colororacle.org/) - Desktop CVD simulator
- [Coblis](https://www.color-blindness.com/coblis-color-blindness-simulator/) - Online simulator
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) - Contrast validation
- [Accessible Colors](https://accessible-colors.com/) - Color combination helper

### References
- [Color Blind Awareness](https://www.colourblindawareness.org/)
- [WCAG 2.1 Color Contrast](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [A11y Color Accessibility](https://www.a11yproject.com/posts/2024-01-08-accessible-colors/)
- [Scientific Color Maps](https://www.fabiocrameri.ch/wp-content/uploads/2021/03/Crameri-2021-SciVis.pdf)

## Examples from Fleet-CTA

### Vehicle Status Indicators

```tsx
// In vehicle tracking component
<div className="flex gap-2 items-center">
  <div
    className="w-3 h-3 rounded-full animate-pulse"
    style={{ backgroundColor: 'var(--success)' }}
  />
  <span>In Transit</span>
</div>
```

### Maintenance Alerts

```tsx
// Uses color + icon + pattern
<Alert
  type="warning"
  title="Maintenance Required"
  message="Oil change due in 500 miles"
  icon={<Wrench />}
/>
```

### Fleet Health Dashboard

```tsx
// Uses colorblind-safe palette
<AccessibleChart
  data={healthData}
  colorBlindMode="deuteranopia"
/>
```

## Contributing

When adding new features that use color:

1. Submit designs that respect colorblind limitations
2. Include contrast ratio validation in tests
3. Test with at least 2 colorblindness simulators
4. Update this guide with new patterns
5. Get approval from accessibility team

## Questions?

See [THEMES.md](./THEMES.md) for general theme documentation, or contact the accessibility team for specific guidance.
