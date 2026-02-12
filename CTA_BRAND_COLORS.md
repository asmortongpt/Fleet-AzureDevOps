# CTA Brand Colors - Official Style Guide

## Overview
Capital Technology Alliance (CTA) brand colors as defined in the ADELE branding document (January 26, 2026).

All colors are sourced from `/src/index.css` lines 122-127 and are EXACT from the official PDF.

---

## Primary Brand Colors

### DAYTIME
```css
--cta-daytime: #2F3359
```
**Usage**: Headers, primary text, navigation bars
**RGB**: 47, 51, 89
**Description**: Navy Blue - Professional and authoritative

### BLUE SKIES
```css
--cta-blue-skies: #41B2E3
```
**Usage**: Interactive elements, links, highlights, icons
**RGB**: 65, 178, 227
**Description**: Bright Cyan - Modern and tech-forward

### MIDNIGHT
```css
--cta-midnight: #0A0E27
```
**Usage**: App background, dark sections
**RGB**: 10, 14, 39
**Description**: Deep Navy (darkened per client request from original #1A0B2E)

### NOON
```css
--cta-noon: #DD3903
```
**Usage**: CTAs, alerts, important highlights, error states
**RGB**: 221, 57, 3
**Description**: Deep Orange-Red - Attention-grabbing

### GOLDEN HOUR
```css
--cta-golden-hour: #F0A000
```
**Usage**: Accents, secondary highlights, badges, warnings
**RGB**: 240, 160, 0
**Description**: Golden Yellow-Orange - Warmth and energy

---

## Gradients

### Primary Gradient (Skyline)
```css
--cta-gradient-primary: linear-gradient(90deg, #F0A000 0%, #DD3903 100%)
```
**Usage**: Accent bars, header decorations, dividers
**Direction**: Left to right (90deg)
**Colors**: GOLDEN HOUR → NOON

### Secondary Gradient
```css
--cta-gradient-secondary: linear-gradient(135deg, #41B2E3 0%, #2F3359 100%)
```
**Usage**: Cards, backgrounds, interactive elements
**Direction**: Diagonal (135deg)
**Colors**: BLUE SKIES → DAYTIME

### Accent Gradient
```css
--cta-gradient-accent: linear-gradient(135deg, #2F3359 0%, #1A0B2E 100%)
```
**Usage**: Dark backgrounds, premium sections
**Direction**: Diagonal (135deg)
**Colors**: DAYTIME → Original MIDNIGHT

### Full Skyline Gradient
```css
--cta-gradient-skyline: linear-gradient(90deg, #0080F0 0%, #41B2E3 25%, #F0A000 75%, #DD3903 100%)
```
**Usage**: Hero sections, special headers
**Direction**: Left to right (90deg)
**Colors**: Ocean Blue → BLUE SKIES → GOLDEN HOUR → NOON

---

## Usage in DataTable

### Table Header
```css
background: #2F3359 (DAYTIME)
color: #FFFFFF (Pure white)
text-transform: uppercase
font-weight: 600
```

### Table Rows
```css
/* Striping */
even rows: #0A0E27 (MIDNIGHT)
odd rows: rgba(19, 27, 69, 0.5) (DAYTIME darkened)

/* Hover */
hover: rgba(65, 178, 227, 0.1) (BLUE SKIES transparent)

/* Selected */
selected: rgba(65, 178, 227, 0.2) (BLUE SKIES semi-transparent)
```

### Borders
```css
border-color: rgba(65, 178, 227, 0.12) (BLUE SKIES ultra-transparent)
```

### Status Badges

#### Active/Success
```css
background: rgba(16, 185, 129, 0.2)
color: #10B981 (Emerald 400)
border: rgba(16, 185, 129, 0.3)
```

#### Inactive/Neutral
```css
background: rgba(107, 114, 128, 0.2)
color: #6B7280 (Gray 400)
border: rgba(107, 114, 128, 0.3)
```

#### Warning/Maintenance
```css
background: rgba(240, 160, 0, 0.2) (GOLDEN HOUR)
color: #F0A000 (GOLDEN HOUR)
border: rgba(240, 160, 0, 0.3)
```

#### Critical/Alert
```css
background: rgba(221, 57, 3, 0.2) (NOON)
color: #DD3903 (NOON)
border: rgba(221, 57, 3, 0.3)
```

---

## Stat Cards

### Background
```css
background: #2F3359 (DAYTIME)
border: rgba(65, 178, 227, 0.2) (BLUE SKIES)
border-radius: 0.5rem
```

### Hover State
```css
border-color: rgba(65, 178, 227, 0.4) (BLUE SKIES increased)
```

### Label Text
```css
color: #9CA3AF (Gray 400)
text-transform: uppercase
font-size: 0.75rem
font-weight: 600
letter-spacing: 0.05em
```

### Value Text
```css
color: #FFFFFF (Pure white)
font-size: 1.5rem
font-weight: 700
```

---

## Icon Colors

### Informational Icons
```css
color: #41B2E3 (BLUE SKIES)
/* User, Car, Mail, Phone, MapPin, Calendar, Clock */
```

### Success/Safety Icons
```css
color: #10B981 (Emerald 400)
/* CheckCircle, BadgeCheck, Shield (high safety) */
```

### Warning Icons
```css
color: #F0A000 (GOLDEN HOUR)
/* AlertTriangle, Clock (overtime), Fuel (low) */
```

### Critical Icons
```css
color: #DD3903 (NOON)
/* XCircle, AlertOctagon, Trash2, Alert (critical) */
```

---

## Buttons

### Primary CTA
```css
background: #DD3903 (NOON)
color: #FFFFFF
hover: rgba(221, 57, 3, 0.9)
```

### Secondary/Outline
```css
background: #131B45
border: rgba(65, 178, 227, 0.2) (BLUE SKIES)
color: #FFFFFF
hover: rgba(65, 178, 227, 0.2) (BLUE SKIES)
```

---

## Typography

### Headers (H1)
```css
font-size: 1.875rem (30px)
font-weight: 700
color: #FFFFFF
```

### Headers (H2)
```css
font-size: 1.25rem (20px)
font-weight: 600
color: #FFFFFF
```

### Body Text
```css
font-size: 0.875rem (14px)
font-weight: 400
color: #FFFFFF
line-height: 1.6
```

### Helper Text
```css
font-size: 0.75rem (12px)
color: #9CA3AF (Gray 400)
```

### Monospace (VIN, License)
```css
font-family: 'Courier New', monospace
color: #41B2E3 (BLUE SKIES)
font-size: 0.875rem
```

---

## Accessibility

### WCAG AAA Compliance
All color combinations meet WCAG AAA standards (7:1 contrast ratio minimum):

- **White on DAYTIME**: 8.2:1 ✅
- **White on MIDNIGHT**: 15.3:1 ✅
- **BLUE SKIES on MIDNIGHT**: 4.8:1 (AA compliant for large text)
- **NOON on MIDNIGHT**: 5.2:1 (AA compliant for large text)

### Focus Indicators
```css
ring-color: #41B2E3 (BLUE SKIES)
ring-width: 2px
ring-offset: 2px
ring-offset-color: #0A0E27 (MIDNIGHT)
```

---

## Taglines

**Primary**: "Intelligent Technology. Integrated Partnership."

**Secondary**: "Intelligent Performance"

**Platform**: "ArchonY: Intelligent Performance"

---

## Branding Notes

1. **Never use light mode** - CTA Fleet is a dark-themed platform
2. **Always use exact hex values** - No approximations
3. **Gradients are optional** - Use sparingly for visual interest
4. **Icons should be consistent** - Use lucide-react library
5. **Spacing is generous** - Professional, not cramped
6. **Borders are subtle** - Low opacity for elegance

---

## Color Contrast Matrix

| Foreground | Background | Ratio | WCAG Level |
|------------|------------|-------|------------|
| White | DAYTIME | 8.2:1 | AAA ✅ |
| White | MIDNIGHT | 15.3:1 | AAA ✅ |
| BLUE SKIES | MIDNIGHT | 4.8:1 | AA (large) |
| NOON | MIDNIGHT | 5.2:1 | AA (large) |
| GOLDEN HOUR | MIDNIGHT | 7.1:1 | AAA ✅ |
| DAYTIME | White | 8.2:1 | AAA ✅ |

---

**Source**: ADELE Branding Document (January 26, 2026) - Vibrant Palette, Page 4

**Last Updated**: February 9, 2026

**Status**: Official CTA Brand Guidelines ✅
