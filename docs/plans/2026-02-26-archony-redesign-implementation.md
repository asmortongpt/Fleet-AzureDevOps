# ArchonY Fleet Command — Full Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Completely redesign the Fleet-CTA frontend to match the ArchonY brand identity — new color palette, typography, layout shell, interaction patterns, and hub-by-hub redesign.

**Architecture:** Design-system-first approach. Replace CSS custom properties and design tokens, update Tailwind v4 theme, restyle all shadcn/ui base components, rebuild the layout shell (nav rail, command bar, detail panel, activity bar), then cascade through each hub. Add drag-and-drop via @dnd-kit, enhance command palette, add keyboard shortcuts system.

**Tech Stack:** React 19, TypeScript, Vite 7, Tailwind v4, shadcn/ui (Radix), @dnd-kit/core (new), Framer Motion, Recharts, AG Grid, Cinzel + Montserrat + JetBrains Mono (Google Fonts)

---

## Phase 1: Design System Foundation

### Task 1.1: Install Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install @dnd-kit packages for drag-and-drop**

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities --legacy-peer-deps
```

**Step 2: Verify install succeeded**

```bash
npm ls @dnd-kit/core
```
Expected: `@dnd-kit/core@x.x.x`

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @dnd-kit for drag-and-drop support"
```

---

### Task 1.2: Add Google Fonts to index.html

**Files:**
- Modify: `index.html`

**Step 1: Add Google Fonts link tags**

In `index.html`, after the existing `<link rel="preconnect">` tags (around line 91), add:

```html
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Montserrat:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

**Step 2: Verify fonts load**

```bash
npm run dev
```

Open browser, check Network tab → Fonts → confirm Cinzel, Montserrat, JetBrains Mono are loading.

**Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add Cinzel, Montserrat, JetBrains Mono font imports"
```

---

### Task 1.3: Create ArchonY CSS Custom Properties

**Files:**
- Create: `src/styles/archony-tokens.css`
- Modify: `src/main.tsx` (add import)

**Step 1: Create the token CSS file**

Create `src/styles/archony-tokens.css` with all ArchonY design tokens as CSS custom properties:

```css
/* ArchonY Fleet Command — Design Tokens */
/* Brand: Capital Technology Alliance / ArchonY "Intelligent Performance" */

:root {
  /* === Brand Colors === */
  --cta-midnight: #1A0648;
  --cta-daytime: #1F3076;
  --cta-blue-skies: #00CCFE;
  --cta-noon: #FF4300;
  --cta-golden-hour: #FDC016;

  /* === Semantic Colors === */
  --success: #10B981;
  --error: #FF4300;
  --warning: #FDC016;
  --info: #00CCFE;

  /* === Gradients === */
  --gradient-brand: linear-gradient(135deg, #1A0648 0%, #1F3076 25%, #00CCFE 50%, #FF4300 75%, #FDC016 100%);
  --gradient-bar: linear-gradient(90deg, #1F3076, #00CCFE, #FF4300, #FDC016);

  /* === Typography === */
  --font-display: 'Cinzel', 'Times New Roman', serif;
  --font-body: 'Montserrat', 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* === Font Sizes === */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.8125rem;  /* 13px */
  --text-base: 0.875rem; /* 14px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.75rem;   /* 28px */
  --text-4xl: 2rem;      /* 32px */

  /* === Spacing (8px grid) === */
  --space-0: 0;
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-5: 1.25rem;  /* 20px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;     /* 32px */
  --space-10: 2.5rem;  /* 40px */
  --space-12: 3rem;    /* 48px */
  --space-16: 4rem;    /* 64px */

  /* === Border Radius === */
  --radius-sm: 4px;
  --radius-default: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  /* === Z-Index === */
  --z-base: 0;
  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-fixed: 1030;
  --z-modal-backdrop: 1040;
  --z-modal: 1050;
  --z-popover: 1060;
  --z-tooltip: 1070;
  --z-command-palette: 1080;

  /* === Transitions === */
  --transition-fast: 100ms ease;
  --transition-default: 150ms ease;
  --transition-medium: 200ms ease;
  --transition-slow: 300ms ease;
  --transition-spring: 300ms cubic-bezier(0.34, 1.56, 0.64, 1);

  /* === Nav Dimensions === */
  --nav-rail-width: 64px;
  --nav-rail-expanded: 240px;
  --command-bar-height: 48px;
  --detail-panel-width: 380px;
  --activity-bar-height: 48px;
  --tab-bar-height: 44px;
}

/* === Dark Mode (Default) === */
:root,
[data-theme="dark"] {
  --surface-0: #0D0320;
  --surface-1: #1A0648;
  --surface-2: #221060;
  --surface-3: #2A1878;
  --surface-4: #332090;

  --text-primary: #FFFFFF;
  --text-secondary: rgba(255, 255, 255, 0.65);
  --text-muted: rgba(255, 255, 255, 0.40);
  --text-inverse: #1A0648;

  --border-subtle: rgba(0, 204, 254, 0.08);
  --border-default: rgba(0, 204, 254, 0.15);
  --border-strong: rgba(0, 204, 254, 0.25);
  --border-focus: rgba(0, 204, 254, 0.50);

  --shadow-sm: 0 1px 3px rgba(26, 6, 72, 0.3);
  --shadow-md: 0 4px 12px rgba(26, 6, 72, 0.4);
  --shadow-lg: 0 8px 24px rgba(26, 6, 72, 0.5);
  --shadow-glow: 0 0 20px rgba(0, 204, 254, 0.15);
  --shadow-glow-strong: 0 0 30px rgba(0, 204, 254, 0.25);

  color-scheme: dark;
}

/* === Light Mode === */
[data-theme="light"] {
  --surface-0: #F5F5F7;
  --surface-1: #FFFFFF;
  --surface-2: #FAFAFA;
  --surface-3: #F0F0F2;
  --surface-4: #E8E8EC;

  --text-primary: #1A0648;
  --text-secondary: rgba(26, 6, 72, 0.65);
  --text-muted: rgba(26, 6, 72, 0.40);
  --text-inverse: #FFFFFF;

  --border-subtle: rgba(26, 6, 72, 0.06);
  --border-default: rgba(26, 6, 72, 0.12);
  --border-strong: rgba(26, 6, 72, 0.20);
  --border-focus: rgba(31, 48, 118, 0.50);

  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.08);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.10);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
  --shadow-glow: 0 0 20px rgba(31, 48, 118, 0.10);
  --shadow-glow-strong: 0 0 30px rgba(31, 48, 118, 0.15);

  color-scheme: light;
}

/* === ArchonY Animations === */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(0, 204, 254, 0); }
  50% { box-shadow: 0 0 12px 4px rgba(0, 204, 254, 0.3); }
}

@keyframes alert-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 67, 0, 0); }
  50% { box-shadow: 0 0 12px 4px rgba(255, 67, 0, 0.4); }
}

@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes slide-in-right {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes slide-in-up {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scale-in {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes count-up {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* === Skeleton Shimmer === */
.archony-skeleton {
  background: linear-gradient(
    90deg,
    var(--surface-2) 25%,
    var(--surface-3) 50%,
    var(--surface-2) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-md);
}

/* === Gradient Bar (brand signature) === */
.archony-gradient-bar {
  height: 3px;
  background: var(--gradient-bar);
  border-radius: var(--radius-full);
}

/* === Active Nav Indicator === */
.archony-nav-active {
  position: relative;
}
.archony-nav-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 25%;
  bottom: 25%;
  width: 3px;
  background: var(--gradient-bar);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

/* === Focus Ring === */
.archony-focus-ring:focus-visible {
  outline: 2px solid var(--cta-blue-skies);
  outline-offset: 2px;
  border-radius: var(--radius-md);
}

/* === Glass Morphism === */
.archony-glass {
  background: rgba(34, 16, 96, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border-subtle);
}

[data-theme="light"] .archony-glass {
  background: rgba(255, 255, 255, 0.8);
}

/* === Reduced Motion === */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Step 2: Import the token file in main.tsx**

In `src/main.tsx`, add this import near the top with the other CSS imports:

```typescript
import './styles/archony-tokens.css';
```

**Step 3: Verify tokens are loaded**

```bash
npm run dev
```

Open browser DevTools → Elements → `<html>` → Computed → verify `--cta-midnight: #1A0648` exists.

**Step 4: Commit**

```bash
git add src/styles/archony-tokens.css src/main.tsx
git commit -m "feat: add ArchonY design tokens (colors, typography, spacing, animations)"
```

---

### Task 1.4: Update TypeScript Design Tokens

**Files:**
- Modify: `src/styles/colors.ts`
- Modify: `src/styles/design-tokens.ts`
- Modify: `src/styles/typography.ts`

**Step 1: Replace colors.ts with ArchonY palette**

Rewrite `src/styles/colors.ts` to export the new brand colors as a typed object:

```typescript
export const archonyColors = {
  // Brand palette
  midnight: '#1A0648',
  daytime: '#1F3076',
  blueSkies: '#00CCFE',
  noon: '#FF4300',
  goldenHour: '#FDC016',

  // Surfaces (dark mode)
  surface: {
    0: '#0D0320',
    1: '#1A0648',
    2: '#221060',
    3: '#2A1878',
    4: '#332090',
  },

  // Surfaces (light mode)
  surfaceLight: {
    0: '#F5F5F7',
    1: '#FFFFFF',
    2: '#FAFAFA',
    3: '#F0F0F2',
    4: '#E8E8EC',
  },

  // Semantic
  success: '#10B981',
  error: '#FF4300',
  warning: '#FDC016',
  info: '#00CCFE',

  // Text (dark mode)
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255, 255, 255, 0.65)',
    muted: 'rgba(255, 255, 255, 0.40)',
  },

  // Gradients
  gradients: {
    brand: 'linear-gradient(135deg, #1A0648 0%, #1F3076 25%, #00CCFE 50%, #FF4300 75%, #FDC016 100%)',
    bar: 'linear-gradient(90deg, #1F3076, #00CCFE, #FF4300, #FDC016)',
  },
} as const;

export type ArchonyColor = keyof typeof archonyColors;
```

**Step 2: Update typography.ts**

Add/update font family definitions in `src/styles/typography.ts`:

```typescript
export const archonyTypography = {
  fontFamily: {
    display: "'Cinzel', 'Times New Roman', serif",
    body: "'Montserrat', 'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.8125rem',   // 13px
    base: '0.875rem',  // 14px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.75rem',  // 28px
    '4xl': '2rem',     // 32px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;
```

**Step 3: Run typecheck**

```bash
npm run typecheck
```

Expected: No errors from the token files. There may be existing errors elsewhere — focus only on errors in files we changed.

**Step 4: Commit**

```bash
git add src/styles/colors.ts src/styles/typography.ts
git commit -m "feat: update TS design tokens with ArchonY brand colors and typography"
```

---

### Task 1.5: Update Theme Provider for ArchonY

**Files:**
- Modify: `src/lib/themes/preset-themes.ts`
- Modify: `src/lib/themes/types.ts` (if needed)
- Modify: `src/components/providers/ThemeProvider.tsx`

**Step 1: Read the existing preset-themes.ts and ThemeProvider.tsx**

Read both files to understand the current theme structure before modifying.

**Step 2: Update preset-themes.ts**

Replace the existing dark and light theme presets with ArchonY-branded versions. The dark theme should be the default. Map the ArchonY colors into whatever shape the existing theme system expects.

Key mappings:
- Primary → `--cta-daytime` (#1F3076)
- Accent → `--cta-blue-skies` (#00CCFE)
- Background → `--surface-0` through `--surface-4`
- Text → `--text-primary`, `--text-secondary`, `--text-muted`
- Destructive → `--cta-noon` (#FF4300)
- Warning → `--cta-golden-hour` (#FDC016)

**Step 3: Ensure dark mode is the default**

In ThemeProvider.tsx, ensure the default theme is `"dark"` (not `"system"` or `"light"`).

**Step 4: Run the dev server and verify**

```bash
npm run dev
```

Check that the app loads with the dark ArchonY color scheme. Background should be deep purple-midnight, not gray/slate.

**Step 5: Commit**

```bash
git add src/lib/themes/ src/components/providers/ThemeProvider.tsx
git commit -m "feat: update theme presets to ArchonY brand (dark-first)"
```

---

### Task 1.6: Restyle Core UI Components — Button

**Files:**
- Modify: `src/components/ui/button.tsx`

**Step 1: Read the current button.tsx**

Understand the existing variant system (cva/class-variance-authority pattern).

**Step 2: Update button variants**

Replace color classes with ArchonY tokens. The button should use these variants:

- `default` (Primary): `bg-[#1F3076] text-white hover:bg-[#263a8a]` + glow on hover
- `secondary`: `bg-transparent border border-[rgba(0,204,254,0.15)] text-white hover:bg-[#2A1878]`
- `destructive`: `bg-[#FF4300] text-white hover:bg-[#e63d00]`
- `ghost`: `bg-transparent text-[#00CCFE] hover:underline`
- `outline`: `border border-[rgba(0,204,254,0.15)] bg-transparent hover:bg-[#221060]`
- `link`: `text-[#00CCFE] underline-offset-4 hover:underline`

All buttons: `rounded-lg` (8px), `h-9` (36px default), `transition-all duration-150`, focus ring: `focus-visible:ring-2 focus-visible:ring-[#00CCFE] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A0648]`

**Step 3: Verify visually**

```bash
npm run dev
```

Navigate to any page with buttons. Verify they match the new brand.

**Step 4: Commit**

```bash
git add src/components/ui/button.tsx
git commit -m "feat: restyle Button component with ArchonY brand"
```

---

### Task 1.7: Restyle Core UI Components — Card

**Files:**
- Modify: `src/components/ui/card.tsx`

**Step 1: Read current card.tsx**

**Step 2: Update card styles**

- `Card`: `bg-[#221060] border border-[rgba(0,204,254,0.08)] rounded-xl shadow-[0_1px_3px_rgba(26,6,72,0.3)] hover:border-[rgba(0,204,254,0.15)] hover:shadow-[0_4px_12px_rgba(26,6,72,0.4)] transition-all duration-200`
- `CardHeader`: `font-['Montserrat'] font-semibold text-white`
- `CardDescription`: `text-[rgba(255,255,255,0.65)] font-['Montserrat']`
- `CardContent`: padding `p-6`
- `CardFooter`: `border-t border-[rgba(0,204,254,0.08)]`

**Step 3: Verify and commit**

```bash
git add src/components/ui/card.tsx
git commit -m "feat: restyle Card component with ArchonY brand"
```

---

### Task 1.8: Restyle Core UI Components — Input, Textarea, Select

**Files:**
- Modify: `src/components/ui/input.tsx`
- Modify: `src/components/ui/textarea.tsx`
- Modify: `src/components/ui/select.tsx`

**Step 1: Read all three files**

**Step 2: Update input styles**

- Background: `bg-[#1A0648]`
- Border: `border border-[rgba(0,204,254,0.15)]`
- Border radius: `rounded-lg` (8px)
- Height: `h-10` (40px)
- Text: `text-white font-['Montserrat'] text-sm`
- Placeholder: `placeholder:text-[rgba(255,255,255,0.40)]`
- Focus: `focus:border-[#00CCFE] focus:ring-[0_0_0_3px_rgba(0,204,254,0.15)]`
- Error: `data-[invalid]:border-[#FF4300]`
- Disabled: `disabled:opacity-50 disabled:cursor-not-allowed`

Apply the same pattern to textarea and select.

**Step 3: Verify and commit**

```bash
git add src/components/ui/input.tsx src/components/ui/textarea.tsx src/components/ui/select.tsx
git commit -m "feat: restyle Input, Textarea, Select with ArchonY brand"
```

---

### Task 1.9: Restyle Core UI Components — Tabs

**Files:**
- Modify: `src/components/ui/tabs.tsx`

**Step 1: Read current tabs.tsx**

**Step 2: Update tabs to underline style**

- `TabsList`: `bg-transparent border-b border-[rgba(0,204,254,0.08)] rounded-none p-0 h-auto gap-0`
- `TabsTrigger`:
  - Base: `rounded-none border-b-[3px] border-transparent px-4 py-3 font-['Montserrat'] text-sm font-normal text-[rgba(255,255,255,0.65)] transition-all duration-200`
  - Active: `data-[state=active]:border-b-[3px] data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:shadow-none`
  - The active border should use the gradient bar. Since CSS gradient borders require a workaround, use `data-[state=active]:border-[#00CCFE]` as a simpler approach, or use a pseudo-element with `background: var(--gradient-bar)`.
  - Hover: `hover:text-[rgba(255,255,255,0.85)]`

**Step 3: Verify and commit**

```bash
git add src/components/ui/tabs.tsx
git commit -m "feat: restyle Tabs to underline style with ArchonY brand"
```

---

### Task 1.10: Restyle Core UI Components — Dialog, Sheet, Dropdown, Tooltip

**Files:**
- Modify: `src/components/ui/dialog.tsx`
- Modify: `src/components/ui/sheet.tsx`
- Modify: `src/components/ui/dropdown-menu.tsx`
- Modify: `src/components/ui/tooltip.tsx`
- Modify: `src/components/ui/popover.tsx`
- Modify: `src/components/ui/context-menu.tsx`

**Step 1: Read all files**

**Step 2: Update overlay/popup component styles**

For all popup-style components (dialog, dropdown, context menu, popover):
- Background: `bg-[#2A1878]`
- Border: `border border-[rgba(0,204,254,0.15)]`
- Shadow: `shadow-[0_8px_24px_rgba(26,6,72,0.5)]`
- Text: `text-white`
- Backdrop: `backdrop-blur-sm` for dialogs/sheets
- Overlay: `bg-black/60`
- Animation: scale-in for modals, none for dropdowns/tooltips (they rely on Radix animations)

For sheet (detail panel):
- Background: `bg-[#221060]`
- Border-left: `border-l border-[rgba(0,204,254,0.15)]`
- Width: `w-[380px]` for side sheets

For tooltips:
- Background: `bg-[#332090]`
- Text: `text-sm text-white`
- Compact padding: `px-3 py-1.5`

**Step 3: Verify and commit**

```bash
git add src/components/ui/dialog.tsx src/components/ui/sheet.tsx src/components/ui/dropdown-menu.tsx src/components/ui/tooltip.tsx src/components/ui/popover.tsx src/components/ui/context-menu.tsx
git commit -m "feat: restyle Dialog, Sheet, Dropdown, Tooltip, Popover, ContextMenu"
```

---

### Task 1.11: Restyle Core UI Components — Badge, Alert, Progress, Skeleton

**Files:**
- Modify: `src/components/ui/badge.tsx`
- Modify: `src/components/ui/alert.tsx`
- Modify: `src/components/ui/progress.tsx`
- Modify: `src/components/ui/skeleton.tsx`

**Step 1: Read all files**

**Step 2: Update badge**

Variants:
- `default`: `bg-[#1F3076] text-white`
- `success`: `bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30`
- `warning`: `bg-[#FDC016]/20 text-[#FDC016] border-[#FDC016]/30`
- `destructive`: `bg-[#FF4300]/20 text-[#FF4300] border-[#FF4300]/30`
- `info`: `bg-[#00CCFE]/20 text-[#00CCFE] border-[#00CCFE]/30`
- `outline`: `border-[rgba(0,204,254,0.15)] text-[rgba(255,255,255,0.65)]`

All badges: `rounded-full px-2.5 py-0.5 text-xs font-medium font-['Montserrat']`

**Step 3: Update alert**

- Default: `bg-[#221060] border-[rgba(0,204,254,0.15)]`
- Destructive: `bg-[#FF4300]/10 border-[#FF4300]/30 text-[#FF4300]`

**Step 4: Update progress bar**

- Track: `bg-[#221060] h-2 rounded-full`
- Indicator: `bg-gradient-to-r from-[#1F3076] via-[#00CCFE] to-[#00CCFE]` (brand gradient for progress)

**Step 5: Update skeleton**

- Use the `.archony-skeleton` class from `archony-tokens.css`
- `bg-[#221060] animate-[shimmer_1.5s_infinite]`

**Step 6: Commit**

```bash
git add src/components/ui/badge.tsx src/components/ui/alert.tsx src/components/ui/progress.tsx src/components/ui/skeleton.tsx
git commit -m "feat: restyle Badge, Alert, Progress, Skeleton with ArchonY brand"
```

---

### Task 1.12: Restyle Remaining UI Components (Batch)

**Files:**
- Modify: `src/components/ui/accordion.tsx`
- Modify: `src/components/ui/checkbox.tsx`
- Modify: `src/components/ui/radio-group.tsx`
- Modify: `src/components/ui/switch.tsx`
- Modify: `src/components/ui/slider.tsx`
- Modify: `src/components/ui/toggle.tsx`
- Modify: `src/components/ui/toggle-group.tsx`
- Modify: `src/components/ui/separator.tsx`
- Modify: `src/components/ui/table.tsx`
- Modify: `src/components/ui/scroll-area.tsx`
- Modify: `src/components/ui/pagination.tsx`
- Modify: `src/components/ui/breadcrumb.tsx`
- Modify: `src/components/ui/navigation-menu.tsx`
- Modify: `src/components/ui/menubar.tsx`

**Step 1: Read each file**

**Step 2: Apply ArchonY colors consistently**

For each component, replace:
- Any `slate-*` classes → ArchonY surface/text tokens
- Any `blue-*` → `--cta-daytime` or `--cta-blue-skies`
- Any `green-*` (for success) → `--success` (#10B981)
- Any `red-*` (for error) → `--cta-noon` (#FF4300)
- Any generic `bg-background` → `bg-[var(--surface-1)]` or `bg-[var(--surface-2)]`
- Any `text-foreground` → `text-[var(--text-primary)]`
- Any `ring-ring` → `ring-[#00CCFE]`
- Any `border-border` → `border-[var(--border-default)]`

Key patterns:
- Checkbox/Radio/Switch checked state: `bg-[#00CCFE]` (Blue Skies)
- Table header: `bg-[#2A1878] text-[rgba(255,255,255,0.65)] uppercase text-xs tracking-wider font-['Montserrat'] font-medium`
- Table row hover: `hover:bg-[#2A1878]`
- Separator: `bg-[rgba(0,204,254,0.08)]`

**Step 3: Commit**

```bash
git add src/components/ui/accordion.tsx src/components/ui/checkbox.tsx src/components/ui/radio-group.tsx src/components/ui/switch.tsx src/components/ui/slider.tsx src/components/ui/toggle.tsx src/components/ui/toggle-group.tsx src/components/ui/separator.tsx src/components/ui/table.tsx src/components/ui/scroll-area.tsx src/components/ui/pagination.tsx src/components/ui/breadcrumb.tsx src/components/ui/navigation-menu.tsx src/components/ui/menubar.tsx
git commit -m "feat: restyle all remaining base UI components with ArchonY brand"
```

---

### Task 1.13: Update Custom Components (KPI Card, Stat Card, Hub Page, etc.)

**Files:**
- Modify: `src/components/ui/kpi-card.tsx`
- Modify: `src/components/ui/stat-card.tsx`
- Modify: `src/components/ui/hub-page.tsx`
- Modify: `src/components/ui/section.tsx`
- Modify: `src/components/ui/chart-card.tsx`
- Modify: `src/components/ui/drilldown-card.tsx`
- Modify: `src/components/ui/empty-state.tsx`
- Modify: `src/components/ui/loading-states.tsx`
- Modify: `src/components/ui/LoadingSkeleton.tsx`
- Modify: `src/components/ui/data-table.tsx`

**Step 1: Read each file**

**Step 2: Apply ArchonY styling**

- KPI Card: Left accent border (3px, brand color), large number in Montserrat 600 32px, label in text-secondary 12px
- Stat Card: Similar pattern with sparkline support
- Hub Page: Title in Cinzel 28px, gradient bar below title
- Section: Header in Montserrat 600 18px
- Chart Card: bg-[#221060], gradient-tinted chart colors
- Drilldown Card: hover lift effect (translateY -2px)
- Empty State: Centered layout with subtle illustration area
- Loading States: Use .archony-skeleton class
- Data Table: Apply AG Grid-consistent header/row styling

**Step 3: Commit**

```bash
git add src/components/ui/kpi-card.tsx src/components/ui/stat-card.tsx src/components/ui/hub-page.tsx src/components/ui/section.tsx src/components/ui/chart-card.tsx src/components/ui/drilldown-card.tsx src/components/ui/empty-state.tsx src/components/ui/loading-states.tsx src/components/ui/LoadingSkeleton.tsx src/components/ui/data-table.tsx
git commit -m "feat: restyle custom UI components (KPI, Stats, Hub, Charts) with ArchonY brand"
```

---

## Phase 2: Layout Shell

### Task 2.1: Redesign Navigation Rail (IconRail)

**Files:**
- Modify: `src/components/layout/IconRail.tsx`
- Modify: `src/lib/navigation.tsx`

**Step 1: Read IconRail.tsx and navigation.tsx**

**Step 2: Redesign the icon rail**

The navigation rail should be:
- 64px wide (collapsed, icon-only)
- bg-[#0D0320] (surface-0, deepest)
- Fixed left, full height
- Top: ArchonY compact logo (just "CTA" monogram or small ArchonY mark)
- Below logo: 3px gradient divider bar
- Hub icons stacked vertically with 8px gap
- Active icon: left 3px gradient bar indicator (`.archony-nav-active`), icon tinted `--cta-blue-skies`
- Inactive: icon in `--text-secondary`, hover: `--text-primary`
- Bottom: Search icon, Help icon, User avatar
- Tooltip on hover (showing hub name), NOT flyout menu
- Keyboard: `1-5` switches hubs, `[` toggles expand

Hub icons (Lucide):
1. Fleet Command → `Map` icon
2. Safety & Compliance → `ShieldCheck` icon
3. Business Intelligence → `BarChart3` icon
4. People & Comms → `Users` icon
5. Admin & Config → `Settings` icon

**Step 3: Update navigation.tsx**

Update hub definitions to match the new 5-hub simplified model with ArchonY naming:
- "Fleet Command" (not "Fleet Hub")
- "Safety & Compliance"
- "Business Intelligence" (not "Financial Hub")
- "People & Communication"
- "Admin & Configuration"

**Step 4: Verify and commit**

```bash
git add src/components/layout/IconRail.tsx src/lib/navigation.tsx
git commit -m "feat: redesign navigation rail with ArchonY brand and simplified 5-hub model"
```

---

### Task 2.2: Redesign Command Bar (CompactHeader)

**Files:**
- Modify: `src/components/layout/CompactHeader.tsx`

**Step 1: Read CompactHeader.tsx**

**Step 2: Redesign as Command Bar**

- Height: 48px
- bg-[#0D0320] (same as nav rail)
- border-bottom: 1px solid var(--border-subtle)
- Left: "ArchonY Fleet Command" in Cinzel 14px, white, with subtle gradient underline
- Center: Search input — always visible. `bg-[#1A0648] border border-[rgba(0,204,254,0.08)] rounded-lg px-4 h-8`. Placeholder: "Search vehicles, drivers, routes... (⌘K)". Width: 400px max, responsive.
- Right: Notification bell (Lucide `Bell` icon) with count badge (`--cta-noon` bg, white text, rounded-full). User avatar (32px circle).

**Step 3: Verify and commit**

```bash
git add src/components/layout/CompactHeader.tsx
git commit -m "feat: redesign Command Bar header with ArchonY brand"
```

---

### Task 2.3: Enhance Command Palette

**Files:**
- Modify: `src/components/layout/CommandPalette.tsx`

**Step 1: Read the existing CommandPalette.tsx**

**Step 2: Enhance with ArchonY styling and features**

Visual redesign:
- Overlay: `bg-black/60 backdrop-blur-sm`
- Panel: `bg-[#221060] border border-[rgba(0,204,254,0.15)] rounded-xl shadow-[0_8px_24px_rgba(26,6,72,0.5)]`
- Width: `max-w-[640px]`
- Search input: Full-width, no border, bg transparent, Montserrat 16px
- Results: grouped by category (Navigation, Vehicles, Drivers, Actions, Settings)
- Each result item: `hover:bg-[#2A1878] rounded-lg px-3 py-2`
- Keyboard navigation: J/K or arrow keys, Enter to select
- Category headers: `text-xs uppercase tracking-wider text-[rgba(255,255,255,0.40)] font-['Montserrat'] font-medium`

Functional enhancements (if not already present):
- Search across: hub names, vehicle names/IDs, driver names, work order IDs
- Action items: "Create Work Order", "Add Vehicle", "Generate Report"
- Recent items section at top

**Step 3: Verify Cmd+K opens the palette**

**Step 4: Commit**

```bash
git add src/components/layout/CommandPalette.tsx
git commit -m "feat: enhance Command Palette with ArchonY design and improved search"
```

---

### Task 2.4: Redesign Single Page Shell

**Files:**
- Modify: `src/components/layout/SinglePageShell.tsx`

**Step 1: Read SinglePageShell.tsx**

**Step 2: Update the layout structure**

The shell should enforce:
```
[NavRail 64px] [Main Content fluid] [DetailPanel 380px (conditional)]
[ActivityBar 48px (bottom, collapsible)]
```

- Root: `bg-[#0D0320]` (surface-0), `h-screen w-screen overflow-hidden`
- Content area: `bg-[#1A0648]` (surface-1), `rounded-tl-lg` (subtle radius where it meets nav rail)
- Remove any references to old flyout menu or different layout modes
- Ensure the detail panel (PanelManager) slides in from right

**Step 3: Verify and commit**

```bash
git add src/components/layout/SinglePageShell.tsx
git commit -m "feat: redesign SinglePageShell with ArchonY layout structure"
```

---

### Task 2.5: Redesign Detail Panel (PanelManager)

**Files:**
- Modify: `src/components/layout/PanelManager.tsx`

**Step 1: Read PanelManager.tsx**

**Step 2: Update panel styling**

- Width: 380px
- bg-[#221060]
- border-left: 1px solid var(--border-subtle)
- Slide-in animation: `animate-[slide-in-right_250ms_ease-out]`
- Header: entity icon + name + close button
- Gradient divider below header (3px gradient bar)
- Scrollable content area
- Action buttons row at bottom (sticky)

**Step 3: Verify and commit**

```bash
git add src/components/layout/PanelManager.tsx
git commit -m "feat: redesign Detail Panel with ArchonY styling and slide-in animation"
```

---

### Task 2.6: Create Activity Bar

**Files:**
- Create: `src/components/layout/ActivityBar.tsx`
- Modify: `src/components/layout/SinglePageShell.tsx` (integrate)

**Step 1: Create ActivityBar component**

A bottom bar (48px) showing real-time events:
- bg-[#0D0320]
- border-top: 1px solid var(--border-subtle)
- Horizontal scrolling event ticker
- Each event: icon + text + timestamp, color-coded by severity
- Click event → opens detail panel for that entity
- Collapse/expand toggle (chevron icon)
- Collapsible: when collapsed, just the top border + expand arrow visible

**Step 2: Integrate into SinglePageShell**

Add ActivityBar at the bottom of the main content area.

**Step 3: Verify and commit**

```bash
git add src/components/layout/ActivityBar.tsx src/components/layout/SinglePageShell.tsx
git commit -m "feat: create Activity Bar with real-time event ticker"
```

---

### Task 2.7: Add Keyboard Shortcuts System

**Files:**
- Create: `src/hooks/use-keyboard-shortcuts.ts`
- Modify: `src/components/ui/keyboard-shortcuts-dialog.tsx`
- Modify: `src/App.tsx` or `src/components/layout/SinglePageShell.tsx` (register global shortcuts)

**Step 1: Create keyboard shortcuts hook**

```typescript
// src/hooks/use-keyboard-shortcuts.ts
import { useEffect } from 'react';

type Shortcut = {
  key: string;
  meta?: boolean;
  shift?: boolean;
  ctrl?: boolean;
  handler: () => void;
  description: string;
};

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Only allow meta/ctrl shortcuts inside inputs
        if (!e.metaKey && !e.ctrlKey) return;
      }

      for (const shortcut of shortcuts) {
        const metaMatch = shortcut.meta ? (e.metaKey || e.ctrlKey) : true;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

        if (metaMatch && shiftMatch && keyMatch) {
          e.preventDefault();
          shortcut.handler();
          return;
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts]);
}
```

**Step 2: Register global shortcuts in the shell**

In SinglePageShell or App.tsx:
- `Cmd+K` → open command palette
- `1-5` → switch hubs
- `[` → toggle sidebar
- `/` → focus search
- `?` → open shortcuts dialog
- `Esc` → close panel/modal
- `N` → new (context-sensitive)

**Step 3: Update keyboard-shortcuts-dialog.tsx**

Restyle with ArchonY brand. Show all available shortcuts grouped by category.

**Step 4: Verify `?` opens the dialog**

**Step 5: Commit**

```bash
git add src/hooks/use-keyboard-shortcuts.ts src/components/ui/keyboard-shortcuts-dialog.tsx src/components/layout/SinglePageShell.tsx
git commit -m "feat: add global keyboard shortcuts system with ArchonY-styled dialog"
```

---

### Task 2.8: Update Mobile Layout (MobileTabBar)

**Files:**
- Modify: `src/components/layout/MobileTabBar.tsx`

**Step 1: Read MobileTabBar.tsx**

**Step 2: Restyle for ArchonY**

- bg-[#0D0320]
- border-top: 1px solid var(--border-subtle)
- 5 tab icons matching the nav rail hubs
- Active tab: `--cta-blue-skies` icon color + label
- Inactive: `--text-muted` icon color
- Safe area padding for iOS notch

**Step 3: Commit**

```bash
git add src/components/layout/MobileTabBar.tsx
git commit -m "feat: restyle MobileTabBar with ArchonY brand"
```

---

## Phase 3: Fleet Command Hub Redesign

### Task 3.1: Redesign FleetOperationsHub — Structure & Overview Tab

**Files:**
- Modify: `src/pages/FleetOperationsHub.tsx`

**Step 1: Read the current FleetOperationsHub.tsx** (this is ~1500 lines)

**Step 2: Update the hub structure**

- Page title: "Fleet Command" in Cinzel 28px
- Gradient bar below title
- Tabs: Overview | Fleet | Drivers | Operations | Maintenance | Assets
- Tabs use the new underline style
- All backgrounds/borders use ArchonY tokens

**Step 3: Redesign the Overview tab as a drag-and-drop dashboard**

Import `@dnd-kit/core` and `@dnd-kit/sortable`. Create a widget grid system:
- Default widgets based on role: Fleet Health, Active Alerts, Cost Trend, Live Map Preview, Recent Activity
- Each widget is a card with a drag handle (⋮⋮)
- "Add Widget" button opens a widget catalog dialog
- "Reset Layout" button restores defaults
- Layout persists to localStorage

**Step 4: Verify and commit**

```bash
git add src/pages/FleetOperationsHub.tsx
git commit -m "feat: redesign FleetOperationsHub with ArchonY brand and drag-and-drop dashboard"
```

---

### Task 3.2: Fleet Tab — Split-Pane Map Layout

**Files:**
- Modify: `src/pages/FleetOperationsHub.tsx` (Fleet tab section)
- Modify: `src/components/layout/MapCanvas.tsx`

**Step 1: Implement split-pane layout**

- Left: Vehicle list (280px, resizable via drag divider)
- Right: Live map (fluid)
- Vehicle list: search input at top, scrollable list below
- Each vehicle row: status dot (green/yellow/red/gray), vehicle name, driver, location
- Click vehicle → map centers + detail panel opens
- Hover vehicle → map highlights with pulsing ring

**Step 2: Update MapCanvas styling**

- Floating KPI strip at bottom of map (glass-morphism)
- Layer toggle buttons in bottom-right (Satellite, Traffic, Weather, Geofences)
- Map tiles should work well with the dark theme

**Step 3: Commit**

```bash
git add src/pages/FleetOperationsHub.tsx src/components/layout/MapCanvas.tsx
git commit -m "feat: implement split-pane map layout for Fleet tab"
```

---

### Task 3.3: Drivers Tab — Card Grid with Views

**Files:**
- Modify: `src/pages/FleetOperationsHub.tsx` (Drivers tab section)

**Step 1: Create driver card component**

Each driver card:
- Avatar placeholder (initials circle)
- Name in Montserrat 600
- Performance score with progress bar
- Assigned vehicle
- Location + status
- HOS remaining
- Action buttons: Message, Assign

**Step 2: Add view toggles**

Three views: Card Grid (default), Table, Leaderboard
- Toggle buttons in top-right of tab

**Step 3: Commit**

```bash
git add src/pages/FleetOperationsHub.tsx
git commit -m "feat: redesign Drivers tab with card grid and multiple view modes"
```

---

### Task 3.4: Maintenance Tab — Kanban Board

**Files:**
- Modify: `src/pages/FleetOperationsHub.tsx` (Maintenance tab section)

**Step 1: Create Kanban board with @dnd-kit**

Columns: Pending → In Progress → Review → Complete
- Each column: header with count, scrollable card list
- Cards: WO number, description, vehicle, assignee, due date
- Drag between columns to update status
- Toggle: Kanban ↔ Table view

**Step 2: Wire drag-and-drop to API calls**

When a card is dropped in a new column, fire a TanStack Query mutation to update the work order status.

**Step 3: Commit**

```bash
git add src/pages/FleetOperationsHub.tsx
git commit -m "feat: add drag-and-drop Kanban board for Maintenance tab"
```

---

## Phase 4: Remaining Hub Redesigns

### Task 4.1: Redesign ComplianceSafetyHub

**Files:**
- Modify: `src/pages/ComplianceSafetyHub.tsx`

**Step 1: Read the current file**

**Step 2: Apply ArchonY styling**

- Title: "Safety & Compliance" in Cinzel 28px
- Critical alerts section at top with `--cta-noon` left border + pulse animation
- Compliance score gauge (radial progress using Recharts)
- Incident trend chart with auto-generated insight headline
- HOS progress bars (green → golden-hour → noon as limits approach)
- Policy compliance matrix table
- All colors/typography/spacing per design system

**Step 3: Commit**

```bash
git add src/pages/ComplianceSafetyHub.tsx
git commit -m "feat: redesign ComplianceSafetyHub with ArchonY brand and alert-driven layout"
```

---

### Task 4.2: Redesign BusinessManagementHub

**Files:**
- Modify: `src/pages/BusinessManagementHub.tsx`

**Step 1: Read the current file**

**Step 2: Apply ArchonY styling**

- Title: "Business Intelligence" in Cinzel 28px
- Executive summary KPI row with sparklines
- Cost breakdown stacked area chart with brand gradient fills
- "Top Insights" sidebar panel (AI-generated recommendations placeholder)
- Data Workbench: query builder with dropdowns
- Report templates library
- All colors/typography/spacing per design system

**Step 3: Commit**

```bash
git add src/pages/BusinessManagementHub.tsx
git commit -m "feat: redesign BusinessManagementHub with ArchonY brand and insights panel"
```

---

### Task 4.3: Redesign PeopleCommunicationHub

**Files:**
- Modify: `src/pages/PeopleCommunicationHub.tsx`

**Step 1: Read the current file**

**Step 2: Apply ArchonY styling**

- Title: "People & Communication" in Cinzel 28px
- Team directory with three views: Org Chart, Card Grid, Table
- Quick actions panel (Send Message, Assign Task, Schedule Meeting)
- Recent activity feed
- Communication inbox (unified messages view)
- Task Kanban with drag-to-assign
- All colors/typography/spacing per design system

**Step 3: Commit**

```bash
git add src/pages/PeopleCommunicationHub.tsx
git commit -m "feat: redesign PeopleCommunicationHub with ArchonY brand"
```

---

### Task 4.4: Redesign AdminConfigurationHub

**Files:**
- Modify: `src/pages/AdminConfigurationHub.tsx`

**Step 1: Read the current file**

**Step 2: Apply ArchonY styling**

- Title: "Admin & Configuration" in Cinzel 28px
- Two-column settings layout (nav left 240px, content right)
- Searchable settings navigation
- User management table with inline role editing
- Integration cards with connection status indicators
- Document library with folder tree
- Data governance section
- All colors/typography/spacing per design system

**Step 3: Commit**

```bash
git add src/pages/AdminConfigurationHub.tsx
git commit -m "feat: redesign AdminConfigurationHub with ArchonY brand and two-column layout"
```

---

## Phase 5: Login & Onboarding

### Task 5.1: Redesign Login Page

**Files:**
- Modify: `src/pages/Login.tsx`
- Modify: `src/pages/SSOLogin.tsx`

**Step 1: Read Login.tsx and SSOLogin.tsx**

**Step 2: Redesign Login**

- Full viewport dark background: `bg-[#0D0320]`
- Animated background: CSS dot grid pattern at 5% opacity + two blurred gradient orbs (one `--cta-daytime`, one `--cta-blue-skies`) at 15% opacity, slowly drifting (60s CSS animation loop)
- Centered login card: glass-morphism (`bg-[rgba(34,16,96,0.6)] backdrop-blur-[20px]`), max-width 420px, rounded-2xl, border subtle
- ArchonY logo at top of card (white, can be text "ARCHON·Y" in CS Gordon Sans or image)
- Gradient bar (3px) below logo
- "Fleet Command" subtitle in Cinzel 20px, text-secondary
- Email input (48px height for login page)
- Password input (48px height)
- "Sign In" primary button (full-width, 48px, bg-[#1F3076])
- "— or —" divider
- "Sign in with Azure AD" secondary button (full-width, 48px, bg-[#2A1878], Microsoft icon)
- "Forgot password?" ghost link
- Footer: "capitaltechalliance.com/enterprise"

**Step 3: Add login → app transition animation**

On successful auth, card scales to 0.95 and fades out while main app fades in (400ms transition via Framer Motion).

**Step 4: Commit**

```bash
git add src/pages/Login.tsx src/pages/SSOLogin.tsx
git commit -m "feat: redesign Login page with ArchonY brand, ambient background, glass-morphism card"
```

---

### Task 5.2: Create First-Run Onboarding Wizard

**Files:**
- Create: `src/components/onboarding/OnboardingWizard.tsx`
- Create: `src/components/onboarding/RoleSelection.tsx`
- Create: `src/components/onboarding/DashboardPreferences.tsx`
- Create: `src/components/onboarding/NotificationPreferences.tsx`
- Create: `src/components/onboarding/OnboardingComplete.tsx`
- Modify: `src/App.tsx` (integrate onboarding check)

**Step 1: Create the wizard container**

4-step wizard:
1. Role Selection (6 cards: Fleet Manager, Dispatcher, Maintenance, Safety, Analytics, Admin)
2. Dashboard Preferences (toggle/reorder pre-selected widgets)
3. Notification Preferences (alert tiers, digest timing, quiet hours)
4. Complete (animated checkmark, keyboard shortcut tips)

- Progress indicator: 4 dots, active dot filled with `--cta-blue-skies`
- Navigation: Back/Next buttons, Skip Setup link
- Persist selection to localStorage + API call to save user preferences
- Trigger condition: Check localStorage/API for `onboarding_completed` flag

**Step 2: Integrate into App.tsx**

After login, check if user has completed onboarding. If not, show wizard overlay.

**Step 3: Commit**

```bash
git add src/components/onboarding/ src/App.tsx
git commit -m "feat: create first-run onboarding wizard with role-based dashboard setup"
```

---

### Task 5.3: Add Progressive Feature Discovery Tooltips

**Files:**
- Create: `src/components/onboarding/FeatureTooltip.tsx`
- Create: `src/hooks/use-feature-discovery.ts`
- Modify: `src/components/layout/SinglePageShell.tsx` (integrate)

**Step 1: Create feature discovery system**

- Track which tooltips have been shown via localStorage
- Show one tooltip per page load, maximum
- Each tooltip: floating card with arrow, "Got it" button, "Don't show tips" link
- Tooltips positioned relative to their target element

Tooltip sequence:
1. Session 1: "Try ⌘K to search anything" (targets command bar search)
2. Session 1: "Click any vehicle to see details" (targets first vehicle in list)
3. Session 2: "Drag widgets to customize your dashboard" (targets dashboard)
4. Session 2: "Right-click for quick actions" (targets table row)
5. Session 3: "Save filter combinations as Views" (targets filter bar)
6. Session 3: "Press ? to see keyboard shortcuts" (targets bottom-left)

**Step 2: Commit**

```bash
git add src/components/onboarding/ src/hooks/use-feature-discovery.ts src/components/layout/SinglePageShell.tsx
git commit -m "feat: add progressive feature discovery tooltip system"
```

---

## Phase 6: Polish & Cross-Cutting Concerns

### Task 6.1: Add Contextual Right-Click Menus

**Files:**
- Create: `src/components/ui/entity-context-menu.tsx`
- Modify: Components that render vehicle/driver/work-order rows to wrap with context menu

**Step 1: Create EntityContextMenu component**

Uses Radix `ContextMenu` (already installed). Renders entity-type-specific actions:

Vehicle: Locate on Map, Edit, Create Work Order, Assign Driver, View History, Export, Archive
Driver: View Profile, Message, Assign Vehicle, View HOS, Performance Report
Work Order: View Details, Change Status, Assign, Print, Duplicate

Styled with ArchonY tokens.

**Step 2: Integrate into table rows and card components**

Wrap vehicle/driver/work-order rows and cards with the context menu trigger.

**Step 3: Commit**

```bash
git add src/components/ui/entity-context-menu.tsx
git commit -m "feat: add contextual right-click menus for vehicles, drivers, work orders"
```

---

### Task 6.2: Add Smart Filter Bar

**Files:**
- Create: `src/components/filters/SmartFilterBar.tsx`
- Create: `src/components/filters/FilterPill.tsx`
- Create: `src/hooks/use-saved-views.ts`

**Step 1: Create composable filter system**

- Filter bar with "Add filter" button
- Each filter = pill showing: [Field ▼ Operator ▼ Value ✕]
- Multiple pills combine with AND logic
- "Save as View" button: saves filter combination with a name
- "Load View" dropdown: list of saved views
- Views persist in localStorage + optionally synced to backend

**Step 2: Style with ArchonY tokens**

Pills: `bg-[#2A1878] border border-[rgba(0,204,254,0.15)] rounded-full px-3 py-1`
Remove button: `hover:bg-[#FF4300]/20`

**Step 3: Commit**

```bash
git add src/components/filters/ src/hooks/use-saved-views.ts
git commit -m "feat: add composable smart filter bar with saved views"
```

---

### Task 6.3: Update AG Grid Theme

**Files:**
- Create: `src/styles/ag-grid-archony.css`
- Modify: `src/main.tsx` (add import)

**Step 1: Create AG Grid custom theme**

Override AG Grid's CSS variables to match ArchonY:

```css
.ag-theme-archony {
  --ag-background-color: #1A0648;
  --ag-header-background-color: #2A1878;
  --ag-odd-row-background-color: #1A0648;
  --ag-row-hover-color: #2A1878;
  --ag-selected-row-background-color: #332090;
  --ag-range-selection-background-color: rgba(0, 204, 254, 0.1);
  --ag-border-color: rgba(0, 204, 254, 0.08);
  --ag-secondary-border-color: rgba(0, 204, 254, 0.05);
  --ag-header-foreground-color: rgba(255, 255, 255, 0.65);
  --ag-foreground-color: #FFFFFF;
  --ag-secondary-foreground-color: rgba(255, 255, 255, 0.65);
  --ag-accent-color: #00CCFE;
  --ag-font-family: 'Montserrat', sans-serif;
  --ag-font-size: 13px;
  --ag-header-font-family: 'Montserrat', sans-serif;
  --ag-header-font-size: 12px;
  --ag-header-font-weight: 500;
  --ag-row-height: 44px;
  --ag-header-height: 40px;
  --ag-cell-horizontal-padding: 16px;
  --ag-border-radius: 8px;
  --ag-input-focus-border-color: #00CCFE;
  --ag-checkbox-checked-color: #00CCFE;
}
```

**Step 2: Import in main.tsx and update AG Grid instances to use `ag-theme-archony` class**

**Step 3: Commit**

```bash
git add src/styles/ag-grid-archony.css src/main.tsx
git commit -m "feat: create ArchonY custom theme for AG Grid"
```

---

### Task 6.4: Update Recharts Theme

**Files:**
- Create: `src/lib/chart-theme.ts`
- Modify: `src/components/ui/chart.tsx`

**Step 1: Create chart theme configuration**

```typescript
export const archonyChartTheme = {
  colors: ['#00CCFE', '#1F3076', '#FF4300', '#FDC016', '#10B981', '#8B5CF6'],
  backgroundColor: '#221060',
  gridColor: 'rgba(0, 204, 254, 0.08)',
  textColor: 'rgba(255, 255, 255, 0.65)',
  tooltipBackground: '#2A1878',
  tooltipBorder: 'rgba(0, 204, 254, 0.15)',
  areaGradient: {
    start: 'rgba(0, 204, 254, 0.3)',
    end: 'rgba(0, 204, 254, 0.0)',
  },
};
```

**Step 2: Update chart.tsx to apply theme**

**Step 3: Commit**

```bash
git add src/lib/chart-theme.ts src/components/ui/chart.tsx
git commit -m "feat: create ArchonY Recharts theme with brand colors"
```

---

### Task 6.5: Update Sonner Toast Theme

**Files:**
- Modify: `src/components/ui/sonner.tsx`

**Step 1: Read sonner.tsx**

**Step 2: Update toast styling**

```typescript
<Toaster
  theme="dark"
  toastOptions={{
    style: {
      background: '#2A1878',
      border: '1px solid rgba(0, 204, 254, 0.15)',
      color: '#FFFFFF',
      fontFamily: "'Montserrat', sans-serif",
    },
    classNames: {
      success: 'border-l-4 border-l-[#10B981]',
      error: 'border-l-4 border-l-[#FF4300]',
      warning: 'border-l-4 border-l-[#FDC016]',
      info: 'border-l-4 border-l-[#00CCFE]',
    },
  }}
/>
```

**Step 3: Commit**

```bash
git add src/components/ui/sonner.tsx
git commit -m "feat: restyle Sonner toasts with ArchonY brand"
```

---

### Task 6.6: Final Visual Audit & Cleanup

**Files:**
- All modified files from previous tasks

**Step 1: Run the dev server**

```bash
npm run dev
```

**Step 2: Visual audit checklist**

Walk through every hub and check:
- [ ] No `slate-*` classes remain in visible UI
- [ ] No `emerald-*` or `green-*` accent classes (replaced with ArchonY colors)
- [ ] All text is legible on dark backgrounds
- [ ] All interactive elements have visible focus states
- [ ] Buttons, cards, inputs match the design spec
- [ ] Typography: page titles in Cinzel, everything else in Montserrat
- [ ] Navigation rail active indicator uses gradient bar
- [ ] Tabs use underline style (not boxed)
- [ ] No stray white backgrounds on the dark theme
- [ ] Charts use brand color palette
- [ ] AG Grid uses ArchonY theme class
- [ ] Toasts show correct brand styling

**Step 3: Fix any remaining inconsistencies found in the audit**

**Step 4: Run typecheck and lint**

```bash
npm run typecheck
npm run lint
```

Fix any errors.

**Step 5: Commit**

```bash
git add -A
git commit -m "fix: visual audit cleanup — resolve remaining style inconsistencies"
```

---

### Task 6.7: Run Tests

**Step 1: Run frontend tests**

```bash
npm test -- --run
```

Fix any test failures caused by the redesign (likely snapshot tests or tests that assert specific CSS classes).

**Step 2: Run build**

```bash
npm run build
```

Ensure production build succeeds.

**Step 3: Commit any test fixes**

```bash
git add -A
git commit -m "test: fix tests affected by ArchonY redesign"
```

---

## Summary

| Phase | Tasks | Key Deliverables |
|-------|-------|------------------|
| 1. Design System | 1.1–1.13 | Tokens, fonts, all 107 UI components restyled |
| 2. Layout Shell | 2.1–2.8 | Nav rail, command bar, command palette, detail panel, activity bar, keyboard shortcuts, mobile |
| 3. Fleet Command | 3.1–3.4 | Dashboard, split-pane map, driver cards, kanban maintenance |
| 4. Other Hubs | 4.1–4.4 | Safety, Business, People, Admin hubs restyled |
| 5. Login & Onboarding | 5.1–5.3 | Login page, onboarding wizard, feature discovery |
| 6. Polish | 6.1–6.7 | Context menus, filters, AG Grid theme, charts, toasts, audit, tests |

**Total: 32 tasks across 6 phases**
