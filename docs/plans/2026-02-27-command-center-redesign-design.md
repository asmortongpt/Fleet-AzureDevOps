# Command Center Redesign — Design Document

**Date**: 2026-02-27
**Branch**: design/figma-redesign
**Status**: Approved

## Problem

The current UI looks like a generic dashboard template. Every hub page has the same layout (4 stat cards + 2 equal sections). No distinctive identity, low data density, wasted space. CSS-only changes (glass effects, accent colors) didn't address the structural problems.

## Design Direction

"Command Center" — inspired by Bloomberg (data density), Tesla (cinematic minimalism), Linear (developer-grade polish). Each page gets a unique layout based on its data type. The app should feel like mission control for fleet operations.

## Constraints

- Dark mode only (emerald accent, no blues/purples)
- Existing design token system (--surface-0 through --surface-5, --text-primary/secondary/tertiary)
- React/TypeScript, existing component library (shadcn/ui, Recharts, AG Grid)
- Must work with existing API data — no new backend endpoints
- Responsive: desktop-first, mobile-friendly

---

## 1. Layout Shell

### Header (48px, down from 56px)
- Remove "CTA Fleet" brand text (redundant with icon rail logo)
- Search bar becomes dominant element, full width minus action buttons
- Right: live clock + notification bell + user avatar (compact)
- Breadcrumb trail appears inline when inside a hub

### Icon Rail (64px, same width)
- Active category: filled icon with emerald dot indicator
- Hover: tooltip (not flyout by default)
- Click: opens flyout with module cards showing descriptions + live counts
- Flyout modules show: icon, label, count badge (e.g. "Vehicles — 93 active")

### Content Transitions
- Hub pages slide in with 200ms ease-out
- Map persists underneath with blur/dim when hub is active

---

## 2. Dashboard (Map Home)

### Live Ticker Bar (replaces FloatingKPIStrip)
- Full-width, pinned to top of map area
- Translucent glass: rgba(8,8,10,0.85), backdrop-blur-xl
- 6 metrics in single row with inline sparkline mini-charts
- Format: `[icon] Label  Value  ▲change  [sparkline]`
- Clickable — each metric opens its hub
- Green pulse animation on recently-updated metrics

### Map Canvas
- Full-bleed, unchanged
- Vehicle markers: size hierarchy (active=larger, idle=smaller)
- Selected vehicle: pulsing ring indicator

### Vehicle Rail (right panel, 360px)
- Compact vehicle rows: `[status dot] [make/model] [location] [battery/fuel bar]`
- Grouped by status: Active > Idle > Offline
- Click vehicle: map centers + inline detail expands (no separate panel)
- Search/filter bar at top

### Bottom Timeline (40px collapsed, 240px expanded)
- Collapsed: 3 most recent events as one-liner text
- Expanded: proper timeline with color-coded event types
- Colors: dispatches=emerald, alerts=amber, maintenance=gray, compliance=red

---

## 3. Fleet Operations Hub

### Hero Metrics Strip (replaces StatCard grid)
- Full-width bar, no card containers
- 4 metrics: 36px value, 11px uppercase label, trend arrow + percentage
- Colored left border per metric (emerald/amber/red/gray)

### Split Layout
- **Left 60%**: Vehicle data table
  - Inline status dots, sparkline mileage, fuel/battery bars, location text
  - Sortable columns, row hover highlights
  - No card wrapping — clean table
- **Right 40%**: Stacked info panels
  1. Fleet Health donut chart (120px compact) with inline legend
  2. Active Alerts list (3-5 most urgent, color coded)
  3. HOS Compliance progress bars

### Tab Navigation
- Vertical sidebar within content area (left 180px)
- Tabs: Overview, Fleet, Drivers, Assets, Operations, Maintenance
- Active: emerald left border + brighter background
- Persistent while scrolling content

---

## 4. Business Management Hub

### Hero Banner (120px tall)
- Full-width dark panel
- 4 financial metrics in 42px font
- 10px uppercase labels below each
- Trend sparklines (12 months) next to each value
- Subtle gradient background

### Three-Column Content
- **Column 1 (40%)**: Cost Trend area chart, full height, gradient fill, interactive tooltips
- **Column 2 (30%)**: Cost Breakdown horizontal bar chart, sorted descending, dollar labels
- **Column 3 (30%)**: Recent Transactions compact list — date, vendor, amount, category badge

### Tabs
- Horizontal (fewer tabs: Financial, Procurement, Analytics, Reports)

---

## 5. Admin & Configuration Hub

### Sidebar-within-content
- Left 200px: vertical nav (Admin, Configuration, Governance, Integrations, Documents)
- Right: content changes per selection

### Admin View
- Top: inline metrics strip — `26 users | 40% active | 3 integrations | 98.2% uptime`
- User Management: full-width data table with search, role badges, status dots, last active
- System Status: horizontal bar of service health indicators (green/amber/red dots)

---

## 6. Compliance & Safety Hub

### Urgency-Based Layout
- Top: alert banner if critical items — "3 certifications expiring this week"
- Kanban columns: Compliant | Expiring Soon | Non-Compliant | Overdue
- Cards: driver name, cert type, expiry date, color-coded by urgency

### Compliance Timeline
- Below kanban: horizontal scrollable timeline of events (submitted, approved, expired)

---

## 7. People & Communication Hub

### Directory Grid
- Inline metrics: Total Employees, On Duty, Avg Tenure (no cards)
- People grid: avatar + name + role + department + status dot, 3-4 columns
- Click: profile flyout (not new page)

### Communication Tab
- Message thread list (Slack-style), not generic cards

---

## Component Changes Required

| Component | Current | New |
|-----------|---------|-----|
| StatCard | Card container with icon, value, label | Raw metric (no card) — value + label + trend inline |
| HubPage | Header + horizontal tabs + content | Header + per-hub layout (vertical tabs / split / hero banner) |
| Section | Glass card with header + content | Varies by context — table containers, chart wrappers, info panels |
| CompactHeader | 56px, brand + search + 2 buttons | 48px, search-dominant, breadcrumbs, clock |
| FloatingKPIStrip | Floating chips over map | Full-width ticker bar, glass background, sparklines |
| Vehicle list | Card-based side panel | Compact row-based rail (360px) |
| BottomDrawer | Expandable activity drawer | Persistent timeline bar (40px/240px) |

## New Components Needed

- `HeroMetrics` — full-width inline metric strip (used by Fleet Ops, Admin)
- `HeroBanner` — large metric display panel (used by Business Management)
- `VerticalTabs` — sidebar tab navigation (used by Fleet Ops, Admin)
- `TickerBar` — live metrics with sparklines (used by Dashboard)
- `KanbanBoard` — urgency columns (used by Compliance)
- `CompactTable` — dense data table with inline visualizations
- `TimelineStrip` — horizontal event timeline
- `VehicleRail` — compact vehicle list for dashboard

## Files to Modify

### Core Layout
- `src/components/layout/CompactHeader.tsx`
- `src/components/layout/SinglePageShell.tsx`
- `src/components/layout/FloatingKPIStrip.tsx`
- `src/components/layout/BottomDrawer.tsx`
- `src/components/layout/PanelManager.tsx`
- `src/components/layout/FlyoutMenu.tsx`

### Hub Pages (complete rewrites)
- `src/pages/FleetOperationsHub.tsx`
- `src/pages/BusinessManagementHub.tsx`
- `src/pages/AdminConfigurationHub.tsx`
- `src/pages/ComplianceSafetyHub.tsx`
- `src/pages/PeopleCommunicationHub.tsx`

### Shared UI Components
- `src/components/ui/hub-page.tsx` (major rework — per-hub layouts)
- `src/components/visualizations/StatCard.tsx` (replaced by HeroMetrics)
- `src/components/ui/section.tsx` (context-dependent variants)

### New Components
- `src/components/ui/hero-metrics.tsx`
- `src/components/ui/hero-banner.tsx`
- `src/components/ui/vertical-tabs.tsx`
- `src/components/ui/ticker-bar.tsx`
- `src/components/ui/kanban-board.tsx`
- `src/components/ui/compact-table.tsx`
- `src/components/ui/timeline-strip.tsx`
- `src/components/ui/vehicle-rail.tsx`
