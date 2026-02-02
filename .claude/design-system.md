# Fleet Management Frontend Design System

## Stack
- React 18 + TypeScript
- Tailwind CSS
- Radix UI primitives
- Recharts for data visualization
- Framer Motion for animations

## 1) Visual Foundation

### 1.1 Spacing Scale (Tailwind)
```
2px  → gap-0.5, p-0.5
4px  → gap-1, p-1
8px  → gap-2, p-2
12px → gap-3, p-3
16px → gap-4, p-4
20px → gap-5, p-5
24px → gap-6, p-6
32px → gap-8, p-8
40px → gap-10, p-10
48px → gap-12, p-12
64px → gap-16, p-16
```

**Application:**
- Within group (label + input): `gap-2` (8px)
- Between form fields: `gap-4` (16px)
- Between sections: `gap-8` (32px)
- Card padding: `p-4` (sm), `p-6` (default), `p-8` (lg)
- Page gutters: `px-4` (mobile), `px-6` (tablet), `px-8` (desktop)

### 1.2 Typography System

**Type Scale:**
```
Display: text-5xl (48px) - Rare, hero sections only
H1:      text-3xl (30px) - Page title, 1 per page
H2:      text-xl  (20px) - Section heading
H3:      text-lg  (18px) - Subsection, font-semibold
Body:    text-base (16px) - Default
Small:   text-sm  (14px) - Secondary text
Caption: text-xs  (12px) - Minimum, metadata only
```

**Line Heights:**
```
Headings: leading-tight (1.25)
Body:     leading-normal (1.5)
```

**Weights:**
```
Regular:  font-normal (400)
Medium:   font-medium (500)
Semibold: font-semibold (600)
Bold:     font-bold (700) - Rare
```

**Rules:**
- ONE H1 per page
- H2/H3 reflect structure, not aesthetics
- Max 5 text styles per screen
- Never use text smaller than 12px in application code

### 1.3 Color System (Semantic Tokens)

```typescript
// Surfaces
bg-white           // Light surface
bg-slate-50        // Light subtle
bg-slate-900       // Dark surface
bg-slate-800       // Dark subtle

// Text
text-slate-900     // Primary on light
text-slate-600     // Muted on light
text-white         // Primary on dark
text-slate-300     // Muted on dark

// Borders
border-slate-200   // Light
border-slate-700   // Dark

// Brand (Primary Actions)
bg-blue-600        // Primary button
hover:bg-blue-700  // Primary hover
text-blue-600      // Links

// States
bg-emerald-600     // Success
bg-amber-600       // Warning
bg-red-600         // Danger/Error

// Focus
ring-blue-500      // Focus ring (always visible)
ring-offset-2      // Focus ring offset
```

**Rules:**
- Never use color alone to convey meaning
- Red = errors only
- Focus rings always visible (2px blue)

### 1.4 Layout Rules

**Max Widths:**
```
Reading pages: max-w-3xl  (768px)
Forms:         max-w-2xl  (672px)
Dashboards:    max-w-7xl  (1280px)
```

**Grid:**
- 12-column grid for complex layouts
- Two-column for nav + content
- Single column for forms

**Alignment:**
- Labels: top-aligned (safest)
- Buttons: right-aligned for confirm/destructive
- Content: left-aligned (never center unless marketing)

## 2) Interaction Design

### 2.1 Button Hierarchy

**Primary (1 per view):**
```tsx
<button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
  Save changes
</button>
```

**Secondary:**
```tsx
<button className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg font-medium">
  Cancel
</button>
```

**Destructive:**
```tsx
<button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium">
  Delete project
</button>
```

**Button Copy Rules:**
- ✅ "Invite members" (verb + object)
- ❌ "Invite"
- ✅ "Save billing info"
- ❌ "Submit"

### 2.2 Forms

**Field Structure:**
```tsx
<div className="space-y-2">
  <label htmlFor="email" className="block text-sm font-medium text-slate-700">
    Email address
  </label>
  <input
    id="email"
    type="email"
    autocomplete="email"
    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
    aria-describedby="email-error email-help"
  />
  <p id="email-help" className="text-sm text-slate-500">
    We'll use this for login and notifications
  </p>
  {error && (
    <p id="email-error" className="text-sm text-red-600" role="alert">
      Email address must include @
    </p>
  )}
</div>
```

**Rules:**
- Label always visible
- Helper text only when it reduces confusion
- Validate on blur and submit (not on every keystroke)
- Error messages include what happened + how to fix
- Never clear fields on error
- Use correct autocomplete attributes

**Error Messages:**
- ✅ "Email address must include @"
- ✅ "Password must be at least 12 characters"
- ❌ "Invalid"
- ❌ "Required"

### 2.3 Feedback States

**Loading (< 300ms):** No spinner
**Loading (300ms-1s):** Inline spinner
**Loading (> 1s):** Skeleton preserving layout

**Empty State Template:**
```tsx
<div className="text-center py-12">
  <Icon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
  <h3 className="text-lg font-semibold text-slate-900 mb-2">
    No invoices yet
  </h3>
  <p className="text-sm text-slate-600 mb-6">
    You haven't created any invoices.
  </p>
  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
    Create invoice
  </button>
</div>
```

**Error State Template:**
```tsx
<div className="text-center py-12">
  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
  <h3 className="text-lg font-semibold text-slate-900 mb-2">
    Couldn't load invoices
  </h3>
  <p className="text-sm text-slate-600 mb-6">
    Check your connection and try again.
  </p>
  <div className="flex gap-3 justify-center">
    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
      Retry
    </button>
    <button className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg">
      Contact support
    </button>
  </div>
</div>
```

## 3) Accessibility

### 3.1 Semantic HTML
- ✅ `<button>` not `<div onClick>`
- ✅ `<label for>` or wrapping label
- ✅ `<nav>`, `<main>`, `<header>`, `<section>`

### 3.2 ARIA (use less, not more)
- Only when native HTML can't do it
- Ensure relationships correct: `aria-describedby` points to existing element
- Update dynamic states: `aria-expanded`, `aria-invalid`

### 3.3 Forms & Errors
```tsx
<input
  aria-invalid={!!error}
  aria-describedby={error ? "field-error" : undefined}
/>
{error && (
  <p id="field-error" role="alert">
    {error}
  </p>
)}
```

### 3.4 Focus Management
- Modal open → focus first interactive item
- Modal close → return focus to trigger
- Submit error → focus first invalid field
- Route change → focus top heading (h1)

### 3.5 Keyboard
- Tab reaches all interactive items
- Escape closes modals
- Enter submits forms
- Arrow keys for menus/listboxes

## 4) Responsive Design

### 4.1 Breakpoints
```
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
```

### 4.2 Touch Targets
- Minimum: `w-11 h-11` (44×44px)
- Spacing between controls to prevent accidental taps

### 4.3 Responsive Patterns
**Tables:**
```tsx
{/* Desktop */}
<table className="hidden md:table">...</table>

{/* Mobile - stacked cards */}
<div className="md:hidden space-y-4">
  {data.map(row => (
    <div className="p-4 bg-white rounded-lg border">
      <div className="font-semibold">{row.name}</div>
      <div className="text-sm text-slate-600">{row.value}</div>
    </div>
  ))}
</div>
```

## 5) Component Design

### 5.1 Component Contract
Every component must have:
- Purpose (what problem it solves)
- Props with types
- Variants (size, intent)
- States (loading/disabled)
- A11y behavior documented
- Usage example
- Anti-example (what not to do)

### 5.2 Standard Variants
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
}
```

## 6) Data-Heavy UI

### 6.1 Tables
Must include:
- Loading skeleton rows
- Empty state
- Sort with visible indication
- Accessible row actions
- Bulk actions (if applicable)

### 6.2 Filters
- Visible applied filters
- "Clear all" button
- Filter chips show active state

### 6.3 Search
- Debounce 200-300ms
- Show "no results" state
- Allow clearing easily
- Highlight matched terms (optional)

## 7) Performance UX

### 7.1 Avoid Layout Shift
- Reserve space for images: `aspect-ratio`
- Skeletons match final content dimensions

### 7.2 Animation
- Durations: 120-250ms
- Use `transition-all duration-200` sparingly
- Respect `prefers-reduced-motion`

## 8) UI Spec Template

Every new screen must include:

**Goal:** What user accomplishes
**Primary action:** Main CTA
**Secondary actions:** Supporting actions
**Layout:** Header, sections, grids
**Components reused:** List of existing components
**States:** loading / empty / error / success
**Accessibility:** Focus rules, keyboard, labels
**Responsive:** Mobile behavior, table behavior
**Copy:** Button labels, error messages

## 9) QA Checklist

### Accessibility
- [ ] All actions reachable by keyboard
- [ ] Focus states visible (2px ring)
- [ ] Modal focus trap correct
- [ ] Inputs have labels
- [ ] Errors linked to inputs via aria-describedby
- [ ] Contrast meets 4.5:1 minimum

### UX
- [ ] One primary action per screen
- [ ] Loading states prevent confusion
- [ ] Errors explain + offer retry
- [ ] Empty state provides next step
- [ ] Button copy is specific (verb + object)

### Responsive
- [ ] Works on 320px width
- [ ] Tap targets ≥ 44×44px
- [ ] No overflow or clipped text
- [ ] Tables collapse to cards on mobile

### Performance
- [ ] No layout shift
- [ ] Skeletons preserve dimensions
- [ ] Images sized/optimized
- [ ] List virtualization if > 100 rows
