# Minimalist Design System

## Overview

The Fleet Management Platform uses a **minimalist design philosophy** that prioritizes clarity, consistency, and calm user experience. This document outlines the complete design system for maintaining visual consistency across all components.

## Core Principles

1. **Clarity over decoration** - Remove unnecessary visual elements
2. **Whitespace is content** - Use spacing to create hierarchy
3. **Subtle color palette** - Muted colors with strategic accent colors
4. **Typography as UI** - Let text create structure
5. **Functional animations only** - Smooth, purposeful transitions
6. **Consistent spacing scale** - Mathematical progression (4, 8, 12, 16, 24, 32, 48px)
7. **Minimal borders** - Use subtle dividers and shadows

## Color System

### Background Colors
```css
--minimalist-bg-primary: #0f1419    /* Deep slate - main background */
--minimalist-bg-secondary: #1a1f29  /* Slightly lighter - cards */
--minimalist-bg-tertiary: #252b37   /* Hover states */
--minimalist-bg-elevated: #2d3340   /* Modals, dropdowns */
```

**Usage:**
- `bg-primary`: Page backgrounds
- `bg-secondary`: Card backgrounds
- `bg-tertiary`: Hover states, metric cards
- `bg-elevated`: Modals, dropdowns, elevated elements

### Text Colors
```css
--minimalist-text-primary: #e8eaed    /* High contrast text */
--minimalist-text-secondary: #9ca3af  /* Secondary text, labels */
--minimalist-text-tertiary: #6b7280   /* Muted text, hints */
```

**Usage:**
- `text-primary`: Headlines, important content
- `text-secondary`: Labels, supporting text
- `text-tertiary`: Hints, metadata, timestamps

### Border Colors
```css
--minimalist-border-subtle: #2d3340   /* Very subtle borders */
--minimalist-border-medium: #374151   /* Standard borders */
--minimalist-border-strong: #4b5563   /* Emphasized borders */
```

**Usage:**
- `border-subtle`: Default card borders
- `border-medium`: Hover states, emphasized borders
- `border-strong`: Strong separation, focused elements

### Accent Colors
```css
--minimalist-accent-blue: #3b82f6    /* Blue - primary actions */
--minimalist-accent-green: #10b981   /* Green - success states */
--minimalist-accent-amber: #f59e0b   /* Amber - warnings */
--minimalist-accent-red: #ef4444     /* Red - critical actions */
```

**Usage:**
- **Blue**: Primary buttons, links, primary actions
- **Green**: Success messages, positive trends, active status
- **Amber**: Warnings, upcoming items, attention needed
- **Red**: Errors, critical alerts, destructive actions

## Typography Scale

### Font Sizes
```css
--minimalist-text-xs: 0.6875rem      /* 11px - Small labels */
--minimalist-text-sm: 0.8125rem      /* 13px - Body text, buttons */
--minimalist-text-base: 0.875rem     /* 14px - Default */
--minimalist-text-md: 0.9375rem      /* 15px - Emphasized text */
--minimalist-text-lg: 1rem           /* 16px - Section headers */
--minimalist-text-xl: 1.125rem       /* 18px - Subsection headers */
--minimalist-text-2xl: 1.375rem      /* 22px - Page titles */
--minimalist-text-3xl: 1.75rem       /* 28px - Hero text */
```

### Font Weights
```css
--minimalist-font-normal: 400        /* Regular text */
--minimalist-font-medium: 500        /* Labels, emphasis */
--minimalist-font-semibold: 600      /* Headers, important text */
--minimalist-font-bold: 700          /* Strong emphasis */
```

### Usage Guidelines

**Page Titles:** text-xl (18px) + font-semibold
```tsx
<h1 className="text-xl font-semibold text-[var(--minimalist-text-primary)]">
  Fleet Manager Dashboard
</h1>
```

**Section Headers:** text-base (14px) + font-medium
```tsx
<h2 className="text-base font-medium text-[var(--minimalist-text-primary)]">
  Fleet Status
</h2>
```

**Body Text:** text-sm (13px) + font-normal
```tsx
<p className="text-sm text-[var(--minimalist-text-secondary)]">
  Operations Overview
</p>
```

**Labels:** text-sm (13px) + font-normal
```tsx
<span className="text-sm text-[var(--minimalist-text-secondary)]">
  Active Vehicles
</span>
```

**Metrics:** text-lg (16px) + font-semibold
```tsx
<span className="text-lg font-semibold text-[var(--minimalist-text-primary)]">
  142
</span>
```

## Spacing Scale

### Mathematical Progression
```css
--minimalist-space-1: 0.25rem   /* 4px - Tight spacing */
--minimalist-space-2: 0.5rem    /* 8px - Default gap */
--minimalist-space-3: 0.75rem   /* 12px - Space between sections */
--minimalist-space-4: 1rem      /* 16px - Card padding, button padding */
--minimalist-space-5: 1.25rem   /* 20px */
--minimalist-space-6: 1.5rem    /* 24px - Large gaps */
--minimalist-space-8: 2rem      /* 32px - Page margins */
--minimalist-space-10: 2.5rem   /* 40px */
--minimalist-space-12: 3rem     /* 48px - Extra large gaps */
```

### Usage Guidelines

**Card Padding:** `p-4` (16px)
```tsx
<Card className="p-4">
  {/* Content */}
</Card>
```

**Section Spacing:** `mb-6` (24px) between sections
```tsx
<header className="mb-6">
  {/* Header content */}
</header>
```

**Element Gaps:** `gap-2` (8px) for buttons, `gap-3` (12px) for cards
```tsx
<div className="flex gap-2">
  <Button>Action 1</Button>
  <Button>Action 2</Button>
</div>
```

## Component Patterns

### Card Component

**Basic Card:**
```tsx
<Card className="p-4">
  <div className="flex items-center gap-2 mb-3">
    <Icon className="w-4 h-4 text-[var(--minimalist-text-secondary)]" />
    <h2 className="text-base font-medium text-[var(--minimalist-text-primary)]">
      Section Title
    </h2>
  </div>

  <div className="space-y-3">
    {/* Content */}
  </div>
</Card>
```

**Metric Card:**
```tsx
<div className="bg-[var(--minimalist-bg-tertiary)] rounded-lg p-3 border border-[var(--minimalist-border-subtle)] hover:border-[var(--minimalist-border-medium)] transition-colors">
  <span className="text-sm text-[var(--minimalist-text-secondary)]">Label</span>
  <span className="text-lg font-semibold text-[var(--minimalist-text-primary)]">123</span>
</div>
```

### Button Component

**Primary Button:**
```tsx
<Button size="sm" className="bg-[var(--minimalist-accent-blue)] hover:bg-blue-600">
  <Icon className="w-4 h-4" />
  Action
</Button>
```

**Secondary Button:**
```tsx
<Button size="sm" variant="secondary">
  <Icon className="w-4 h-4" />
  Action
</Button>
```

**Outline Button:**
```tsx
<Button size="sm" variant="outline">
  <Icon className="w-4 h-4" />
  Action
</Button>
```

**Ghost Button:**
```tsx
<Button size="sm" variant="ghost">
  <Icon className="w-4 h-4" />
  Action
</Button>
```

### Status Indicators

**Dot Indicators:**
```tsx
<div className="flex items-center gap-2">
  <div className="w-2 h-2 rounded-full bg-green-500"></div>
  <span className="text-sm text-[var(--minimalist-text-secondary)]">Active</span>
</div>
```

**Color Coding:**
- **Green** (`bg-green-500`): Active, success, operational
- **Amber** (`bg-amber-500`): Warning, maintenance, upcoming
- **Red** (`bg-red-500`): Error, critical, out of service
- **Blue** (`bg-blue-500`): Info, in progress, scheduled
- **Gray** (`bg-[var(--minimalist-border-strong)]`): Inactive, idle, neutral

### Page Layout

**Standard Page Structure:**
```tsx
<div className="min-h-screen bg-[var(--minimalist-bg-primary)] p-4">
  {/* Page Header */}
  <header className="mb-6">
    <h1 className="text-xl font-semibold text-[var(--minimalist-text-primary)] mb-1">
      Page Title
    </h1>
    <p className="text-sm text-[var(--minimalist-text-secondary)]">
      Page description or subtitle
    </p>
  </header>

  {/* Action Buttons */}
  <div className="mb-4 flex flex-wrap gap-2">
    <Button size="sm">Primary Action</Button>
    <Button size="sm" variant="secondary">Secondary Action</Button>
  </div>

  {/* Content Grid */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <Card className="p-4">
      {/* Card content */}
    </Card>
    <Card className="p-4">
      {/* Card content */}
    </Card>
  </div>
</div>
```

## Icon Guidelines

### Icon Sizes
- **Small icons** (w-4 h-4 = 16px): Buttons, inline with text
- **Medium icons** (w-5 h-5 = 20px): Section headers, emphasis
- **Large icons** (w-6 h-6 = 24px): Hero sections, major actions

### Icon Colors
- **Primary context**: `text-[var(--minimalist-text-secondary)]`
- **Emphasis**: Match accent color (blue, green, amber, red)
- **Inactive**: `text-[var(--minimalist-text-tertiary)]`

```tsx
<AlertCircle className="w-4 h-4 text-[var(--minimalist-text-secondary)]" />
<Warning className="w-5 h-5 text-amber-400" />
<CheckCircle className="w-5 h-5 text-green-400" />
```

## Animation Guidelines

### Transition Speed
```css
--minimalist-transition-fast: 100ms ease    /* Hover states */
--minimalist-transition-normal: 150ms ease  /* Default transitions */
--minimalist-transition-slow: 200ms ease    /* Complex animations */
```

### Allowed Animations
**Hover States:**
```tsx
<div className="transition-colors duration-150 hover:border-[var(--minimalist-border-medium)]">
  {/* Content */}
</div>
```

**Card Entrance:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2 }}
>
  {/* Content */}
</motion.div>
```

### Forbidden Animations
- ❌ Backdrop blur effects
- ❌ Gradient animations
- ❌ Scale effects (except subtle hover: scale-[1.02])
- ❌ Spinning/rotating elements (except loading states)
- ❌ Bouncing effects
- ❌ Pulsing effects

## Anti-Patterns to Avoid

### ❌ Don't Use:
1. **Gradients**: `bg-gradient-to-r`, `bg-gradient-*`
2. **Heavy shadows**: `shadow-xl`, `shadow-2xl`
3. **Backdrop blur**: `backdrop-blur-*`
4. **Emoji in UI**: Replace with icons or colored dots
5. **Multiple border colors**: Stick to one border style per component
6. **Overly bright colors**: Use muted palette
7. **Animated text**: Keep text static and readable

### ✅ Do Use:
1. **Solid backgrounds**: `bg-[var(--minimalist-bg-secondary)]`
2. **Subtle shadows**: `shadow-sm` or none
3. **Simple borders**: `border border-[var(--minimalist-border-subtle)]`
4. **Icons**: From `@phosphor-icons/react`
5. **Consistent borders**: One border style per element
6. **Muted accent colors**: Strategic use of blue, green, amber, red
7. **Static, readable text**: Clear typography hierarchy

## Responsive Design

### Breakpoints
- **Mobile**: < 640px (default)
- **Tablet**: 640px - 1024px (md:)
- **Desktop**: > 1024px (lg:)

### Grid Patterns
```tsx
{/* Single column on mobile, two columns on desktop */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
  {/* Content */}
</div>

{/* Single column on mobile, three columns on large screens */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
  {/* Content */}
</div>
```

## Accessibility

### Focus States
All interactive elements should have clear focus indicators:
```tsx
<Button className="focus-visible:ring-2 focus-visible:ring-ring/50">
  Action
</Button>
```

### Color Contrast
- **Primary text on background**: 7:1 contrast ratio (WCAG AAA)
- **Secondary text on background**: 4.5:1 contrast ratio (WCAG AA)
- **Button text**: Always white on colored backgrounds

### Touch Targets
Minimum 44x44px for interactive elements:
```tsx
<Button size="touch" className="min-h-[44px] min-w-[44px]">
  Action
</Button>
```

## Checklist for New Components

When creating or updating components, verify:

- [ ] Uses minimalist color palette (no custom colors)
- [ ] Uses spacing scale (gap-2, gap-3, gap-4, p-4, mb-6, etc.)
- [ ] Uses typography scale (text-sm, text-base, text-lg, etc.)
- [ ] Icons are consistent size (w-4 h-4 or w-5 h-5)
- [ ] No gradients anywhere
- [ ] No backdrop-blur effects
- [ ] Shadows are subtle or absent
- [ ] Borders use subtle colors
- [ ] Transitions are fast (150ms or less)
- [ ] Text is readable with proper contrast
- [ ] Layout is responsive (mobile-first)
- [ ] Interactive elements have hover states
- [ ] Focus states are visible
- [ ] Touch targets are 44x44px minimum

## Examples

### Complete Dashboard Header
```tsx
<header className="mb-6">
  <h1 className="text-xl font-semibold text-[var(--minimalist-text-primary)] mb-1">
    Fleet Manager Dashboard
  </h1>
  <p className="text-sm text-[var(--minimalist-text-secondary)]">
    Operations Overview & Resource Management
  </p>
</header>
```

### Complete Metric Card
```tsx
<Card className="p-4">
  <div className="flex items-center gap-2 mb-3">
    <Icon className="w-4 h-4 text-[var(--minimalist-text-secondary)]" />
    <h3 className="text-base font-medium text-[var(--minimalist-text-primary)]">
      Fleet Status
    </h3>
  </div>

  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500"></div>
        <span className="text-sm text-[var(--minimalist-text-secondary)]">Active</span>
      </div>
      <span className="text-lg font-semibold text-[var(--minimalist-text-primary)]">
        142
      </span>
    </div>
  </div>
</Card>
```

### Complete Alert Card
```tsx
<div
  className={cn(
    "bg-[var(--minimalist-bg-tertiary)] rounded-lg p-3",
    "border border-red-500/20 hover:border-red-500/40",
    "transition-colors cursor-pointer"
  )}
  onClick={handleClick}
>
  <div className="flex items-start justify-between mb-2">
    <Warning className="w-5 h-5 text-red-400" />
    <span className="text-2xl font-semibold text-[var(--minimalist-text-primary)]">
      5
    </span>
  </div>
  <p className="text-sm text-[var(--minimalist-text-secondary)] mb-2">
    Overdue Maintenance
  </p>
  <Button
    size="sm"
    variant="outline"
    className="w-full text-red-400 border-red-400/30 hover:bg-red-500/10"
  >
    View Queue
  </Button>
</div>
```

## Maintenance

This design system should be:
1. **Applied consistently** across all new components
2. **Referenced** when updating existing components
3. **Updated** when new patterns emerge
4. **Validated** during code reviews

For questions or clarifications, refer to the implemented components in:
- `/src/components/ui/button.tsx`
- `/src/components/ui/card.tsx`
- `/src/components/dashboards/roles/FleetManagerDashboard.tsx`
- `/src/styles/minimalist-theme.css`
