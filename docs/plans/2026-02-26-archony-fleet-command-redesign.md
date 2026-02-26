# ArchonY Fleet Command — Full Frontend Redesign

**Date**: 2026-02-26
**Status**: Design Approved
**Approach**: Design System First, Then Cascade
**Deliverable**: Production React Code

---

## 1. Brand Foundation

**Parent brand**: Capital Technology Alliance (CTA)
**Product brand**: ArchonY "Intelligent Performance"
**Fleet sub-brand**: ArchonY Fleet Command

### Color Palette

| Token | Name | Hex | Usage |
|-------|------|-----|-------|
| `--cta-midnight` | Midnight | `#1A0648` | App background, deepest surfaces |
| `--cta-daytime` | Daytime | `#1F3076` | Primary blue, active states, buttons |
| `--cta-blue-skies` | Blue Skies | `#00CCFE` | Interactive accent, links, focus rings |
| `--cta-noon` | Noon | `#FF4300` | Alerts, critical status, danger actions |
| `--cta-golden-hour` | Golden Hour | `#FDC016` | Warnings, highlights, badges |

### Extended Surface Scale (Dark Mode — Default)

| Token | Hex | Usage |
|-------|-----|-------|
| `--surface-0` | `#0D0320` | Deepest background |
| `--surface-1` | `#1A0648` | Main app background (Midnight) |
| `--surface-2` | `#221060` | Elevated cards, panels |
| `--surface-3` | `#2A1878` | Hover states on cards |
| `--surface-4` | `#332090` | Active/selected states |

### Extended Surface Scale (Light Mode)

| Token | Hex | Usage |
|-------|-----|-------|
| `--surface-0` | `#F5F5F7` | Page background |
| `--surface-1` | `#FFFFFF` | Main content |
| `--surface-2` | `#FAFAFA` | Cards |
| `--surface-3` | `#F0F0F2` | Hover |
| `--surface-4` | `#E8E8EC` | Active/selected |

### Border Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--border-subtle` | `rgba(0, 204, 254, 0.12)` | Subtle borders |
| `--border-default` | `rgba(0, 204, 254, 0.20)` | Default borders |
| `--border-strong` | `rgba(0, 204, 254, 0.35)` | Emphasized borders |

### Text Tokens

| Token | Dark Mode | Light Mode |
|-------|-----------|------------|
| `--text-primary` | `#FFFFFF` | `#1A0648` |
| `--text-secondary` | `rgba(255,255,255,0.65)` | `rgba(26,6,72,0.65)` |
| `--text-muted` | `rgba(255,255,255,0.40)` | `rgba(26,6,72,0.40)` |

### Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--success` | `#10B981` | Success states |
| `--error` | `#FF4300` | Error states (= Noon) |
| `--warning` | `#FDC016` | Warning states (= Golden Hour) |
| `--info` | `#00CCFE` | Info states (= Blue Skies) |

### Gradients

```css
--gradient-brand: linear-gradient(135deg, #1A0648 0%, #1F3076 25%, #00CCFE 50%, #FF4300 75%, #FDC016 100%);
--gradient-bar: linear-gradient(90deg, #1F3076, #00CCFE, #FF4300, #FDC016);
```

### Typography

| Role | Font | Weight | Size |
|------|------|--------|------|
| Display / Page titles | Cinzel | 600 | 28-32px |
| Section headers | Montserrat | 600 | 18-20px |
| Body text | Montserrat | 400 | 14px |
| Labels / captions | Montserrat | 500 | 12px |
| Monospace / data | JetBrains Mono | 400 | 13px |
| Monogram / logo | CS Gordon Sans | 700 | — |

### Spacing

8px grid: 4, 8, 12, 16, 24, 32, 48, 64px

### Border Radius

- Default: 6px
- Cards: 12px
- Modals: 16px
- Pills/badges: 9999px

### Shadows (Purple-Tinted)

```css
--shadow-sm: 0 1px 3px rgba(26, 6, 72, 0.3);
--shadow-md: 0 4px 12px rgba(26, 6, 72, 0.4);
--shadow-lg: 0 8px 24px rgba(26, 6, 72, 0.5);
--shadow-glow: 0 0 20px rgba(0, 204, 254, 0.15);
```

---

## 2. Layout Shell & Navigation

### Overall Layout

- **Nav Rail** (left, 64px collapsed / 240px expanded): Icon-only by default, text labels on expand
- **Command Bar** (top, 48px): Product name + global search (Cmd+K) + notifications + user
- **Main Content** (center, fluid): Hub-specific content with tabs
- **Detail Panel** (right, 380px, slide-in): Entity details on selection
- **Activity Bar** (bottom, 48px, collapsible): Real-time event ticker

### Navigation Rail

5 hub icons stacked vertically:
1. Fleet Command (map icon)
2. Safety & Compliance (shield icon)
3. Business Intelligence (chart icon)
4. People & Communication (users icon)
5. Admin & Configuration (settings icon)

Plus: Search, Help/AI Copilot, User Avatar at bottom.

Active indicator: 3px left edge gradient bar (`--gradient-bar`).
Hover: Tooltip (not flyout). Click: Navigate to hub.
Keyboard: `[` toggles expand/collapse. `1-5` switches hubs.

### Command Palette (Cmd+K)

Modal overlay for universal search + actions:
- Search entities (vehicles, drivers, work orders)
- Run actions (create work order, assign driver)
- Navigate (go to Safety hub)
- Query data (vehicles overdue for maintenance)
- Access settings

### Responsive Breakpoints

| Breakpoint | Behavior |
|------------|----------|
| ≥1440px | Full layout: rail + content + panel side-by-side |
| 1024-1439px | Rail icons only, panel overlays content |
| 768-1023px | Bottom tab bar, panel is full-screen sheet |
| <768px | Bottom tab bar (5 icons), full-width content |

---

## 3. Component Design

### Buttons

- **Primary**: bg `--cta-daytime`, white text, hover: lighten + glow
- **Secondary**: transparent, `--border-default` border, hover: bg `--surface-3`
- **Danger**: bg `--cta-noon`, white text, requires confirmation
- **Ghost**: no bg/border, `--cta-blue-skies` text, hover: underline
- All: 8px radius, 36px height (32px compact), 150ms transitions
- Focus ring: 2px solid `--cta-blue-skies`, 4px offset

### Cards

- bg `--surface-2`, border `--border-subtle`, 12px radius, `--shadow-sm`
- Hover: border → `--border-default`, shadow → `--shadow-md`
- Variants: Metric (left accent border), Status (top gradient bar), Interactive (drag handle), Glass (backdrop-filter blur for map overlays)

### Tables (AG Grid Restyled)

- Header: bg `--surface-3`, Montserrat 500, 12px, uppercase
- Rows: bg `--surface-2`, hover `--surface-3`, selected `--surface-4`
- Inline editing on double-click
- Column drag-to-reorder
- Bulk action bar on row selection
- Virtual scrolling for 10K+ rows

### Tabs

- Underline style, not boxed
- Active: 3px gradient underline, Montserrat 600, `--text-primary`
- Inactive: no underline, Montserrat 400, `--text-secondary`
- Animated underline slides between tabs (200ms)
- Keyboard: Arrow Left/Right

### Inputs

- bg `--surface-1`, border `--border-default`, 8px radius, 40px height
- Focus: border `--cta-blue-skies`, glow ring
- Error: border `--cta-noon`, error message below
- Disabled: opacity 0.5

### Notifications

| Tier | Style | Behavior |
|------|-------|----------|
| Critical | Full-width banner, `--cta-noon` | Persists until dismissed, sound |
| Warning | Toast, `--cta-golden-hour` accent | Auto-dismiss 10s |
| Info | Toast, `--cta-blue-skies` accent | Auto-dismiss 5s |
| Success | Inline confirmation | Auto-dismiss 3s |

---

## 4. Interaction Patterns

### Drag-and-Drop Dashboard

- Widget catalog: Fleet Health, Active Alerts, Cost Trend, Live Map, Activity Feed, Driver Scorecard, Maintenance Due, Fuel Chart, Compliance Status, Route Efficiency, Custom KPI
- 12-column snap grid
- Drag via ⋮⋮ handle, resize via corner grip
- Layouts persist per user (localStorage + backend sync)
- Implementation: `@dnd-kit/core`

### Kanban Boards

- Work orders and tasks: Pending → In Progress → Review → Complete
- Drag cards between columns to update status
- Columns configurable (add/remove/rename)

### Contextual Right-Click Menus

- Available on any entity (vehicle, driver, work order)
- Styled with `--surface-3`, `--shadow-lg`, backdrop blur

### Inline Editing

- Double-click or click edit icon to activate
- Saves on blur/Enter with optimistic UI (TanStack Query mutation)
- Subtle toast confirmation

### Multi-Select & Bulk Actions

- Click, Shift+Click (range), Cmd+Click (toggle)
- Floating action bar at bottom when rows selected

### Smart Filters

- Composable filter pills (AND/OR logic)
- Natural language input parsing
- Saveable as named Views, shareable via URL

### Data Visualization

- Auto-generated headline insights on each chart
- Brand gradient fills on area charts
- Click-to-drill-down on data points
- Comparison mode (previous period overlay)
- Cross-filtering between charts

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Cmd+K` | Command palette |
| `1-5` | Switch hub |
| `[` | Toggle sidebar |
| `/` | Focus search |
| `?` | Shortcuts cheat sheet |
| `Esc` | Close panel/modal |
| `N` | New (context-sensitive) |
| `J/K` | Navigate down/up in lists |
| `Enter` | Open selected |
| `E` | Edit selected |

---

## 5. Hub-Specific Layouts

### Hub 1: Fleet Command (Map-Centric)

- Split-pane: resizable vehicle list (280px) + live map (fluid)
- Vehicles color-coded: green (active), yellow (warning), red (alert), gray (offline)
- Alert vehicles pulse with `--cta-noon` ring
- Lasso-select tool for map multi-select
- Floating KPI strip on map (glass-morphism)
- Tabs: Overview (dashboard), Fleet (table), Drivers (cards/table/leaderboard), Operations (dispatch/routes), Maintenance (kanban/table), Assets (grid/lifecycle)

### Hub 2: Safety & Compliance (Alert-Driven)

- Critical alerts section at top (auto-sorted by severity)
- Compliance score gauge
- Incident trend chart with auto-generated insights
- Policy compliance heatmap (policy × entity matrix)
- HOS real-time progress bars (green → yellow → red)
- Visual policy rule builder (drag conditions)

### Hub 3: Business Intelligence (Data-Dense)

- Executive summary KPI row with sparklines
- AI-generated "Top Insights" sidebar
- Cross-filtering interactive charts
- Data Workbench: build custom queries with dropdowns
- Report builder with scheduled delivery
- Natural language report queries

### Hub 4: People & Communication (Collaboration)

- Three view modes: Org Chart, Card Grid, Table
- Unified communication inbox
- Message templates
- Task Kanban with drag-to-assign
- Workload heatmap

### Hub 5: Admin & Configuration (Power User)

- Two-column settings layout (nav left, content right)
- Searchable settings
- Visual notification rule builder
- Integration cards with OAuth flows
- Document library with drag-and-drop upload
- Data governance (retention, PII masking, GDPR)

---

## 6. Login & Onboarding

### Login Screen

- Dark ambient background with floating gradient orbs (CSS animation)
- Centered glass-morphism login card
- ArchonY logo + gradient bar + "Fleet Command" in Cinzel
- Email/password inputs + Azure AD button
- Smooth transition to app on success (scale + fade, 400ms)

### First-Run Wizard (4 Steps)

1. **Role Selection**: 6 role cards (Fleet Manager, Dispatcher, Maintenance, Safety, Analytics, Admin) — configures default hub and dashboard
2. **Dashboard Preferences**: Toggle/reorder pre-selected widgets based on role
3. **Notification Preferences**: Alert tiers, daily digest timing, quiet hours
4. **Launch**: Animated checkmark, keyboard shortcut tips, "Launch Fleet Command" button

### Progressive Feature Discovery

Tooltips introduced over first 3 sessions:
- Session 1: Cmd+K, click vehicles
- Session 2: Drag widgets, right-click actions
- Session 3: Saved views, keyboard shortcuts

### Session Resume

- Instant skeleton from localStorage cache
- API hydration within 200-400ms
- New-alerts banner if alerts since last session

---

## 7. Gradient Usage Rules

### Where to Use

- Active nav indicator (3px left bar)
- Active tab underlines (3px)
- Section dividers (thin line)
- Loading/progress bars
- Login background ambient orbs
- Chart area fills
- Skeleton shimmer animation

### Where NOT to Use

- Button backgrounds (use solid `--cta-daytime`)
- Text (illegible)
- Large surface fills (overwhelming)
- Card borders (too noisy — use single-color subtle borders)

---

## 8. Animation Specifications

| Element | Animation | Duration |
|---------|-----------|----------|
| Page/tab switch | Crossfade | 200ms |
| Panel slide-in | Slide right + fade | 250ms ease-out |
| Modal open | Scale 0.95→1.0 + fade | 200ms |
| Card hover | translateY -2px | 150ms |
| Button click | Scale 0.97→1.0 | 100ms |
| Toast enter | Slide up + fade | 300ms spring |
| Skeleton shimmer | Gradient sweep | 1.5s infinite |
| Tab underline | Slide to position | 200ms ease |
| KPI counter | Count-up | 600ms |
| Map vehicle | Smooth interpolation | 1s linear |
| Login → App | Scale 0.95 + fade | 400ms |

All animations respect `prefers-reduced-motion`.

---

## 9. Competitive Advantages

Features no fleet management platform currently offers:

1. **Command Palette (Cmd+K)** — Universal search + actions
2. **Full Keyboard Navigation** — Every action reachable via keyboard
3. **Dark-First Design** — Brand-native, not bolted on
4. **AI-Generated Insights** — Auto-headline charts, anomaly detection
5. **Drag-and-Drop Dashboards** — Per-role customizable widgets
6. **Natural Language Filters** — Type queries in plain English
7. **Kanban Work Orders** — Drag-and-drop status management
8. **3D Vehicle Visualization** — Three.js showroom (unique in industry)
9. **Progressive Onboarding** — Role-based setup wizard + feature discovery
10. **Contextual Right-Click Menus** — Quick actions on any entity
11. **Inline Editing** — Edit data in place without opening forms
12. **Cross-Filtering Charts** — Click one chart to filter all others
13. **Saveable/Shareable Views** — Named filter combinations as URLs

---

## 10. Implementation Approach

**Phase 1 — Design System Foundation**
- New CSS custom properties (tokens)
- Updated Tailwind config
- Base component restyling (button, card, input, table, tabs)
- Typography (Cinzel, Montserrat, JetBrains Mono)
- Dark/light mode toggle

**Phase 2 — Layout Shell**
- New navigation rail
- Command bar + command palette (Cmd+K)
- Detail panel system
- Activity bar
- Responsive breakpoints

**Phase 3 — Hub Redesign (Fleet Command first)**
- Fleet Command with split-pane map layout
- Drag-and-drop dashboard
- Kanban maintenance board
- Inline editing + bulk actions

**Phase 4 — Remaining Hubs**
- Safety & Compliance
- Business Intelligence
- People & Communication
- Admin & Configuration

**Phase 5 — Login & Onboarding**
- Login screen redesign
- First-run wizard
- Feature discovery tooltips

**Phase 6 — Polish**
- Animations & transitions
- Skeleton loading states
- Keyboard shortcuts system
- Natural language filter parsing
- Cross-filtering charts
