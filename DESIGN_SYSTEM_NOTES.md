# Design System Notes

**Generated:** 2025-12-24T22:45:00-05:00
**Branch:** ui/design-system

---

## Existing Foundation

The project has a comprehensive design system already in place:

### Design Tokens (`src/styles/design-tokens.ts`)
- ✅ Color palette (primary, secondary, neutral, semantic)
- ✅ Typography scale (xs through 5xl)
- ✅ Spacing scale (0-16 in 4px increments)
- ✅ Border radius and width
- ✅ Shadows (sm through 2xl)
- ✅ Animations (duration, easing)
- ✅ Tailwind config integration

### UI Components (`src/components/ui/` - 62 components)
- ✅ Form: button, input, select, checkbox, radio, textarea
- ✅ Layout: card, dialog, sheet, accordion, tabs
- ✅ Data: table, virtual-table, chart, kpi-card
- ✅ Navigation: breadcrumb, navigation-menu, sidebar
- ✅ Feedback: alert, toast (sonner), progress
- ✅ Overlay: popover, tooltip, dropdown-menu

### Style Files (`src/styles/` - 12 files)
- design-system.css
- design-tokens-responsive.css
- enterprise-tokens.css
- dark-mode-enhancements.css
- accessibility-colors.css

---

## New Components Added

### HubPage (`src/components/ui/hub-page.tsx`)
Standardized layout wrapper for consolidated hub architecture:
- Header with icon, title, description
- Tabbed navigation for sub-views
- Action buttons slot
- Full height mode
- data-testid attributes for testing

---

## Usage Guidelines

### Typography
```tsx
// Headings
<h1 className="text-2xl font-semibold">Hub Title</h1>
<h2 className="text-lg font-medium">Section Title</h2>
<p className="text-sm text-muted-foreground">Description</p>
```

### Spacing
```tsx
// Padding/margins use spacing scale
<div className="p-4">       // 16px padding
<div className="gap-6">     // 24px gap
<div className="mb-8">      // 32px margin-bottom
```

### Colors
```tsx
// Semantic colors
<div className="bg-primary text-primary-foreground">
<div className="text-muted-foreground">
<div className="border-destructive">
```

---

## Standardization Checklist

- [x] Design tokens defined
- [x] Core UI components available
- [x] HubPage component created
- [ ] All screens using HubPage pattern
- [ ] Consistent loading/empty/error states
- [ ] Dark mode fully tested
- [ ] Accessibility audit complete
