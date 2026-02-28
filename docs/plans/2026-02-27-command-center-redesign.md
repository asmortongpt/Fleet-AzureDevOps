# Command Center Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the generic dashboard template into a distinctive command center with unique layouts per hub page, higher data density, and premium visual identity.

**Architecture:** Create 7 new shared UI components (HeroMetrics, VerticalTabs, TickerBar, etc.), then rework the layout shell (header, dashboard), then rewrite each of the 5 hub pages with their unique layouts. Each hub gets a layout matched to its data type rather than a one-size-fits-all card grid.

**Tech Stack:** React 19, TypeScript, TailwindCSS v4, shadcn/ui (Radix), Recharts, existing design tokens (CSS custom properties)

---

## Phase 1: New Shared Components

### Task 1: HeroMetrics Component

**Files:**
- Create: `src/components/ui/hero-metrics.tsx`

**Step 1: Create HeroMetrics component**

```tsx
/**
 * HeroMetrics — Full-width inline metric strip
 *
 * No card containers. Raw numbers on dark background.
 * Colored left border per metric. 36px values, 11px labels, trend arrows.
 */
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface HeroMetric {
  label: string
  value: string | number
  icon: LucideIcon
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  accent?: 'emerald' | 'amber' | 'rose' | 'gray'
}

interface HeroMetricsProps {
  metrics: HeroMetric[]
  className?: string
}

const accentColors = {
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#ef4444',
  gray: '#6b7280',
}

export function HeroMetrics({ metrics, className }: HeroMetricsProps) {
  return (
    <div className={cn('flex w-full', className)}>
      {metrics.map((m, i) => {
        const color = accentColors[m.accent || 'emerald']
        const TrendIcon = m.trend === 'up' ? TrendingUp : m.trend === 'down' ? TrendingDown : Minus
        return (
          <div
            key={i}
            className="flex-1 flex items-center gap-4 px-6 py-5 relative"
            style={{ borderLeft: `3px solid ${color}` }}
          >
            <div className="flex flex-col min-w-0">
              <div className="text-[36px] font-bold tracking-tight text-white leading-none tabular-nums">
                {m.value}
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/35 mt-1.5">
                {m.label}
              </span>
            </div>
            {m.change !== undefined && (
              <div className={cn(
                'flex items-center gap-1 text-xs font-medium',
                m.trend === 'up' && 'text-emerald-400',
                m.trend === 'down' && 'text-rose-400',
                m.trend === 'neutral' && 'text-white/30',
              )}>
                <TrendIcon className="h-3.5 w-3.5" />
                <span>{m.change > 0 ? '+' : ''}{m.change}%</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
```

**Step 2: Verify build**

Run: `npx vite build 2>&1 | tail -5`
Expected: Build succeeds (unused component is fine)

**Step 3: Commit**

```bash
git add src/components/ui/hero-metrics.tsx
git commit -m "feat: add HeroMetrics component — full-width inline metric strip"
```

---

### Task 2: HeroBanner Component

**Files:**
- Create: `src/components/ui/hero-banner.tsx`

**Step 1: Create HeroBanner component**

```tsx
/**
 * HeroBanner — Large metric display panel (120px)
 *
 * 42px numbers, sparkline trends, gradient background.
 * Used by Business Management hub.
 */
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/utils'

export interface BannerMetric {
  label: string
  value: string
  icon: LucideIcon
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  sparkData?: { v: number }[]
}

interface HeroBannerProps {
  metrics: BannerMetric[]
  className?: string
}

export function HeroBanner({ metrics, className }: HeroBannerProps) {
  return (
    <div
      className={cn('w-full rounded-2xl overflow-hidden', className)}
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex divide-x divide-white/[0.06]">
        {metrics.map((m, i) => {
          const TrendIcon = m.trend === 'up' ? TrendingUp : m.trend === 'down' ? TrendingDown : null
          const trendColor = m.trend === 'up' ? '#10b981' : m.trend === 'down' ? '#ef4444' : '#6b7280'
          return (
            <div key={i} className="flex-1 px-8 py-7 flex items-center gap-5">
              <div className="flex flex-col min-w-0">
                <div className="text-[42px] font-bold tracking-tight text-white leading-none tabular-nums">
                  {m.value}
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/30 mt-2">
                  {m.label}
                </span>
              </div>
              <div className="flex flex-col items-end gap-2 ml-auto">
                {m.change !== undefined && TrendIcon && (
                  <div className="flex items-center gap-1 text-xs font-medium" style={{ color: trendColor }}>
                    <TrendIcon className="h-3 w-3" />
                    <span>{m.change > 0 ? '+' : ''}{m.change}%</span>
                  </div>
                )}
                {m.sparkData && m.sparkData.length > 0 && (
                  <div className="w-20 h-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={m.sparkData}>
                        <Line type="monotone" dataKey="v" stroke={trendColor} strokeWidth={1.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/ui/hero-banner.tsx
git commit -m "feat: add HeroBanner component — large metric display panel"
```

---

### Task 3: VerticalTabs Component

**Files:**
- Create: `src/components/ui/vertical-tabs.tsx`

**Step 1: Create VerticalTabs component**

```tsx
/**
 * VerticalTabs — Sidebar tab navigation within content area
 *
 * 180px left sidebar with tabs. Active tab has emerald left border.
 * Used by Fleet Ops and Admin hubs.
 */
import { ReactNode, useState } from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface VTab {
  id: string
  label: string
  icon?: LucideIcon
  badge?: string | number
  content: ReactNode
}

interface VerticalTabsProps {
  tabs: VTab[]
  defaultTab?: string
  onTabChange?: (tabId: string) => void
  className?: string
}

export function VerticalTabs({ tabs, defaultTab, onTabChange, className }: VerticalTabsProps) {
  const [active, setActive] = useState(defaultTab || tabs[0]?.id)

  const handleChange = (id: string) => {
    setActive(id)
    onTabChange?.(id)
  }

  const activeTab = tabs.find(t => t.id === active)

  return (
    <div className={cn('flex h-full', className)}>
      {/* Sidebar */}
      <nav className="w-[180px] shrink-0 border-r border-white/[0.06] py-2 flex flex-col gap-0.5">
        {tabs.map(tab => {
          const isActive = tab.id === active
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => handleChange(tab.id)}
              className={cn(
                'flex items-center gap-3 w-full px-4 py-2.5 text-[13px] font-medium transition-colors relative',
                isActive
                  ? 'text-white bg-white/[0.05]'
                  : 'text-white/40 hover:text-white/60 hover:bg-white/[0.02]',
              )}
            >
              {isActive && (
                <div
                  className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full"
                  style={{ background: '#10b981' }}
                />
              )}
              {Icon && <Icon className="h-4 w-4 shrink-0" />}
              <span className="truncate">{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="ml-auto text-[10px] font-semibold text-white/25 tabular-nums">
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Content */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        {activeTab?.content}
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/ui/vertical-tabs.tsx
git commit -m "feat: add VerticalTabs component — sidebar tab navigation"
```

---

### Task 4: TickerBar Component

**Files:**
- Create: `src/components/ui/ticker-bar.tsx`

**Step 1: Create TickerBar component**

```tsx
/**
 * TickerBar — Live metrics bar with sparklines
 *
 * Full-width glass bar pinned to top of map.
 * 6 metrics with inline sparklines, clickable to open hubs.
 */
import { LucideIcon } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/utils'

export interface TickerMetric {
  label: string
  value: string | number
  icon: LucideIcon
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  sparkData?: { v: number }[]
  onClick?: () => void
}

interface TickerBarProps {
  metrics: TickerMetric[]
  className?: string
}

export function TickerBar({ metrics, className }: TickerBarProps) {
  return (
    <div
      className={cn(
        'flex items-center w-full rounded-xl overflow-hidden',
        className,
      )}
      style={{
        background: 'rgba(8,8,10,0.85)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {metrics.map((m, i) => {
        const Icon = m.icon
        const trendColor = m.trend === 'up' ? '#10b981' : m.trend === 'down' ? '#ef4444' : '#6b7280'
        return (
          <button
            key={i}
            onClick={m.onClick}
            className="flex-1 flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.03] transition-colors"
          >
            <Icon className="h-4 w-4 text-white/30 shrink-0" />
            <span className="text-[11px] text-white/40 font-medium">{m.label}</span>
            <span className="text-[14px] font-bold text-white tabular-nums">{m.value}</span>
            {m.change !== undefined && (
              <span className="text-[10px] font-medium" style={{ color: trendColor }}>
                {m.change > 0 ? '▲' : m.change < 0 ? '▼' : '–'}{Math.abs(m.change)}%
              </span>
            )}
            {m.sparkData && m.sparkData.length > 0 && (
              <div className="w-12 h-4 ml-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={m.sparkData}>
                    <Line type="monotone" dataKey="v" stroke={trendColor} strokeWidth={1} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/ui/ticker-bar.tsx
git commit -m "feat: add TickerBar component — live metrics with sparklines"
```

---

### Task 5: KanbanBoard Component

**Files:**
- Create: `src/components/ui/kanban-board.tsx`

**Step 1: Create KanbanBoard component**

```tsx
/**
 * KanbanBoard — Urgency-based column layout
 *
 * Used by Compliance hub. Cards grouped by status columns.
 */
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface KanbanColumn {
  id: string
  title: string
  count: number
  accent: string // hex color
  items: KanbanItem[]
}

export interface KanbanItem {
  id: string
  title: string
  subtitle?: string
  badge?: string
  badgeColor?: string
  meta?: string
  onClick?: () => void
}

interface KanbanBoardProps {
  columns: KanbanColumn[]
  className?: string
}

export function KanbanBoard({ columns, className }: KanbanBoardProps) {
  return (
    <div className={cn('flex gap-4 overflow-x-auto pb-2', className)}>
      {columns.map(col => (
        <div key={col.id} className="flex-1 min-w-[240px] flex flex-col">
          {/* Column header */}
          <div className="flex items-center gap-2 px-3 py-2 mb-2">
            <div className="w-2 h-2 rounded-full" style={{ background: col.accent }} />
            <span className="text-[12px] font-semibold text-white/60 uppercase tracking-[0.08em]">
              {col.title}
            </span>
            <span className="text-[11px] font-bold text-white/25 tabular-nums ml-auto">
              {col.count}
            </span>
          </div>

          {/* Cards */}
          <div className="flex flex-col gap-2">
            {col.items.map(item => (
              <button
                key={item.id}
                onClick={item.onClick}
                className="text-left px-4 py-3 rounded-lg transition-colors hover:bg-white/[0.04]"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-medium text-white/80 truncate">{item.title}</span>
                  {item.badge && (
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                      style={{
                        background: `${item.badgeColor || col.accent}20`,
                        color: item.badgeColor || col.accent,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                {item.subtitle && (
                  <p className="text-[11px] text-white/35 mt-1">{item.subtitle}</p>
                )}
                {item.meta && (
                  <p className="text-[10px] text-white/20 mt-1.5">{item.meta}</p>
                )}
              </button>
            ))}
            {col.items.length === 0 && (
              <div className="px-4 py-8 text-center text-[12px] text-white/15">
                No items
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/ui/kanban-board.tsx
git commit -m "feat: add KanbanBoard component — urgency-based column layout"
```

---

### Task 6: TimelineStrip Component

**Files:**
- Create: `src/components/ui/timeline-strip.tsx`

**Step 1: Create TimelineStrip component**

```tsx
/**
 * TimelineStrip — Horizontal scrollable event timeline
 *
 * Color-coded events with timestamps. Used by dashboard bottom bar and compliance hub.
 */
import { cn } from '@/lib/utils'

export interface TimelineEvent {
  id: string
  label: string
  time: string
  type: 'dispatch' | 'alert' | 'maintenance' | 'compliance' | 'info'
}

interface TimelineStripProps {
  events: TimelineEvent[]
  collapsed?: boolean
  onToggle?: () => void
  className?: string
}

const typeColors: Record<string, string> = {
  dispatch: '#10b981',
  alert: '#f59e0b',
  maintenance: '#6b7280',
  compliance: '#ef4444',
  info: '#3b82f6',
}

export function TimelineStrip({ events, collapsed = true, onToggle, className }: TimelineStripProps) {
  if (collapsed) {
    return (
      <button
        onClick={onToggle}
        className={cn(
          'flex items-center gap-4 w-full h-10 px-5',
          className,
        )}
        style={{
          background: 'rgba(255,255,255,0.02)',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <span className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.1em]">Activity</span>
        <div className="flex items-center gap-4 overflow-hidden flex-1">
          {events.slice(0, 3).map(e => (
            <div key={e.id} className="flex items-center gap-2 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: typeColors[e.type] }} />
              <span className="text-[11px] text-white/40">{e.label}</span>
              <span className="text-[10px] text-white/20">{e.time}</span>
            </div>
          ))}
        </div>
        <span className="text-[10px] text-white/20">▲</span>
      </button>
    )
  }

  return (
    <div
      className={cn('flex flex-col', className)}
      style={{
        background: 'rgba(255,255,255,0.02)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <button
        onClick={onToggle}
        className="flex items-center gap-2 px-5 h-8 hover:bg-white/[0.02]"
      >
        <span className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.1em]">Activity</span>
        <span className="text-[10px] text-white/20 ml-auto">▼</span>
      </button>
      <div className="px-5 pb-4 flex flex-col gap-2 overflow-y-auto max-h-[200px]">
        {events.map(e => (
          <div key={e.id} className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: typeColors[e.type] }} />
            <span className="text-[12px] text-white/60 flex-1">{e.label}</span>
            <span className="text-[11px] text-white/25 tabular-nums shrink-0">{e.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/ui/timeline-strip.tsx
git commit -m "feat: add TimelineStrip component — horizontal event timeline"
```

---

### Task 7: VehicleRail Component

**Files:**
- Create: `src/components/ui/vehicle-rail.tsx`

**Step 1: Create VehicleRail component**

```tsx
/**
 * VehicleRail — Compact vehicle list for dashboard right panel
 *
 * 360px width. Grouped by status. Compact rows with status dot,
 * make/model, location, fuel/battery bar.
 */
import { useState } from 'react'
import { Search, MapPin, Battery, Fuel, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface RailVehicle {
  id: string
  name: string
  status: 'active' | 'idle' | 'offline'
  location?: string
  fuelPercent?: number
  batteryPercent?: number
  onClick?: () => void
}

interface VehicleRailProps {
  vehicles: RailVehicle[]
  selectedId?: string
  onSelect?: (id: string) => void
  className?: string
}

const statusColors = {
  active: '#10b981',
  idle: '#f59e0b',
  offline: '#6b7280',
}

const statusLabels = {
  active: 'Active',
  idle: 'Idle',
  offline: 'Offline',
}

export function VehicleRail({ vehicles, selectedId, onSelect, className }: VehicleRailProps) {
  const [search, setSearch] = useState('')
  const [expandedGroup, setExpandedGroup] = useState<string | null>('active')

  const filtered = vehicles.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.location?.toLowerCase().includes(search.toLowerCase())
  )

  const groups = (['active', 'idle', 'offline'] as const).map(status => ({
    status,
    vehicles: filtered.filter(v => v.status === status),
  })).filter(g => g.vehicles.length > 0)

  return (
    <div className={cn('w-[360px] h-full flex flex-col bg-[var(--surface-1)] border-l border-white/[0.05]', className)}>
      {/* Search */}
      <div className="px-4 py-3 border-b border-white/[0.05]">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04]">
          <Search className="h-3.5 w-3.5 text-white/25" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search vehicles..."
            className="bg-transparent text-[12px] text-white/80 placeholder:text-white/20 outline-none flex-1"
          />
        </div>
      </div>

      {/* Vehicle groups */}
      <div className="flex-1 overflow-y-auto">
        {groups.map(group => (
          <div key={group.status}>
            <button
              onClick={() => setExpandedGroup(expandedGroup === group.status ? null : group.status)}
              className="flex items-center gap-2 w-full px-4 py-2 hover:bg-white/[0.02]"
            >
              <div className="w-2 h-2 rounded-full" style={{ background: statusColors[group.status] }} />
              <span className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.08em]">
                {statusLabels[group.status]}
              </span>
              <span className="text-[10px] text-white/20 tabular-nums">{group.vehicles.length}</span>
              {expandedGroup === group.status
                ? <ChevronUp className="h-3 w-3 text-white/20 ml-auto" />
                : <ChevronDown className="h-3 w-3 text-white/20 ml-auto" />
              }
            </button>
            {expandedGroup === group.status && group.vehicles.map(v => (
              <button
                key={v.id}
                onClick={() => { v.onClick?.(); onSelect?.(v.id) }}
                className={cn(
                  'flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors',
                  selectedId === v.id ? 'bg-white/[0.05]' : 'hover:bg-white/[0.02]',
                )}
              >
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: statusColors[v.status] }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium text-white/75 truncate">{v.name}</div>
                  {v.location && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="h-2.5 w-2.5 text-white/20" />
                      <span className="text-[10px] text-white/25 truncate">{v.location}</span>
                    </div>
                  )}
                </div>
                {v.batteryPercent !== undefined && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Battery className="h-3 w-3 text-white/20" />
                    <div className="w-10 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${v.batteryPercent}%`,
                          background: v.batteryPercent > 20 ? '#10b981' : '#ef4444',
                        }}
                      />
                    </div>
                  </div>
                )}
                {v.fuelPercent !== undefined && !v.batteryPercent && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Fuel className="h-3 w-3 text-white/20" />
                    <div className="w-10 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${v.fuelPercent}%`,
                          background: v.fuelPercent > 25 ? '#10b981' : '#f59e0b',
                        }}
                      />
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/ui/vehicle-rail.tsx
git commit -m "feat: add VehicleRail component — compact vehicle list for dashboard"
```

---

## Phase 2: Layout Shell Rework

### Task 8: CompactHeader Redesign

**Files:**
- Modify: `src/components/layout/CompactHeader.tsx` (71 lines — full rewrite)

**Step 1: Rewrite CompactHeader**

Remove "CTA Fleet" brand text. Make search bar dominant. Add breadcrumbs, live clock. Tighten to 48px height.

Read the current file, then rewrite it keeping the same imports/hooks but with the new layout:
- No brand text (logo is in IconRail)
- Search bar takes left 60% of space
- Breadcrumb trail inline (from NavigationContext or DrilldownContext)
- Right side: compact clock (HH:MM), notification bell, user avatar
- Height: h-12 (48px)

**Step 2: Verify build passes**

Run: `npx vite build 2>&1 | tail -5`

**Step 3: Commit**

```bash
git add src/components/layout/CompactHeader.tsx
git commit -m "feat: redesign CompactHeader — search-dominant, 48px, breadcrumbs"
```

---

### Task 9: Dashboard Layout — TickerBar + VehicleRail + TimelineStrip

**Files:**
- Modify: `src/components/layout/SinglePageShell.tsx` (94 lines)
- Modify: `src/components/layout/FloatingKPIStrip.tsx` (186 lines — replace with TickerBar)
- Modify: `src/components/layout/BottomDrawer.tsx` (77 lines — replace with TimelineStrip)

**Step 1: Replace FloatingKPIStrip with TickerBar integration**

Read FloatingKPIStrip.tsx. It fetches dashboard stats from `/api/dashboard/stats`. Rewrite it to use the new TickerBar component, passing the same data through as TickerMetric objects. Keep the same data fetching logic.

**Step 2: Replace BottomDrawer with TimelineStrip integration**

Read BottomDrawer.tsx. Rewrite to use TimelineStrip component. Keep the same activity data source.

**Step 3: Update SinglePageShell to integrate VehicleRail**

In SinglePageShell, when `moduleContent` is null (map mode), the layout becomes:
- TickerBar pinned at top of map area
- MapCanvas fills remaining space
- VehicleRail on right (360px, conditionally shown on desktop)
- TimelineStrip at bottom

**Step 4: Verify build + visual check**

Run: `npx vite build 2>&1 | tail -5`
Visual: Open localhost:5174, verify dashboard shows ticker bar at top, vehicle rail on right, timeline at bottom.

**Step 5: Commit**

```bash
git add src/components/layout/SinglePageShell.tsx src/components/layout/FloatingKPIStrip.tsx src/components/layout/BottomDrawer.tsx
git commit -m "feat: dashboard command center — ticker bar, vehicle rail, timeline strip"
```

---

## Phase 3: Hub Page Rewrites

### Task 10: FleetOperationsHub Redesign

**Files:**
- Modify: `src/pages/FleetOperationsHub.tsx` (2116 lines)

**Step 1: Read the current file and understand its data fetching**

Read FleetOperationsHub.tsx. Identify:
- What API hooks/queries it uses for data
- What state management it has
- What the Overview tab currently renders

**Step 2: Rewrite the Overview tab**

Replace the current Overview tab content:
- Remove StatCard grid. Use HeroMetrics strip (4 metrics: fleet health, driver safety score, active work orders, HOS compliance)
- Replace two equal section grid with split layout: left 60% vehicle table, right 40% stacked panels
- Use VerticalTabs for tab navigation instead of horizontal HubPage tabs
- Keep all existing data hooks — only change the rendering

**Step 3: Rewrite remaining tabs**

Each tab content should use the same split/dense layout principle — tables and lists instead of card grids where possible.

**Step 4: Verify build + visual check**

Run: `npx vite build 2>&1 | tail -5`
Visual: Navigate to Fleet Operations hub, verify hero metrics, split layout, vertical tabs.

**Step 5: Commit**

```bash
git add src/pages/FleetOperationsHub.tsx
git commit -m "feat: redesign Fleet Operations — hero metrics, split layout, vertical tabs"
```

---

### Task 11: BusinessManagementHub Redesign

**Files:**
- Modify: `src/pages/BusinessManagementHub.tsx` (1374 lines)

**Step 1: Read current file, identify data hooks**

**Step 2: Rewrite Financial tab**

- Replace StatCard grid with HeroBanner (42px numbers, sparkline trends)
- Replace two-section grid with 3-column layout: cost trend chart (40%) + cost breakdown horizontal bars (30%) + recent transactions list (30%)
- Keep horizontal tabs (fewer tabs)

**Step 3: Verify build + visual check**

**Step 4: Commit**

```bash
git add src/pages/BusinessManagementHub.tsx
git commit -m "feat: redesign Business Management — hero banner, 3-column financial layout"
```

---

### Task 12: AdminConfigurationHub Redesign

**Files:**
- Modify: `src/pages/AdminConfigurationHub.tsx` (1394 lines)

**Step 1: Read current file, identify data hooks**

**Step 2: Rewrite Admin tab**

- Sidebar-within-content layout using VerticalTabs (Admin, Configuration, Governance, Integrations, Documents)
- Inline metrics strip (no cards): `26 users | 40% active | 3 integrations | 98.2% uptime`
- Full-width user management data table with search, role badges, status dots
- System status as horizontal health indicator bar

**Step 3: Verify build + visual check**

**Step 4: Commit**

```bash
git add src/pages/AdminConfigurationHub.tsx
git commit -m "feat: redesign Admin — sidebar tabs, inline metrics, dense tables"
```

---

### Task 13: ComplianceSafetyHub Redesign

**Files:**
- Modify: `src/pages/ComplianceSafetyHub.tsx` (1658 lines)

**Step 1: Read current file, identify data hooks**

**Step 2: Rewrite Compliance tab**

- Alert banner at top if critical items exist
- KanbanBoard with 4 columns: Compliant, Expiring Soon, Non-Compliant, Overdue
- Cards show driver name, cert type, expiry date
- Below kanban: TimelineStrip showing compliance events

**Step 3: Verify build + visual check**

**Step 4: Commit**

```bash
git add src/pages/ComplianceSafetyHub.tsx
git commit -m "feat: redesign Compliance — urgency kanban, alert banner, timeline"
```

---

### Task 14: PeopleCommunicationHub Redesign

**Files:**
- Modify: `src/pages/PeopleCommunicationHub.tsx` (1028 lines)

**Step 1: Read current file, identify data hooks**

**Step 2: Rewrite People tab**

- Inline metrics (no cards): Total Employees, On Duty, Avg Tenure
- Directory grid: avatar + name + role + department + status dot, 3-4 columns
- Click opens profile flyout

**Step 3: Rewrite Communication tab**

- Message thread list (Slack-style compact rows) instead of card layout

**Step 4: Verify build + visual check**

**Step 5: Commit**

```bash
git add src/pages/PeopleCommunicationHub.tsx
git commit -m "feat: redesign People — directory grid, inline metrics, thread list"
```

---

## Phase 4: Polish & Verify

### Task 15: Full Visual QA

**Step 1: Build check**

Run: `npm run build`
Expected: Zero errors

**Step 2: Type check**

Run: `npm run typecheck`
Expected: Zero errors

**Step 3: Visual verification of all pages**

Use Playwright to screenshot all 5 hub pages + dashboard in dark mode. Verify:
- Dashboard: ticker bar visible at top, vehicle rail on right, timeline at bottom
- Fleet Ops: hero metrics strip, split layout, vertical tabs
- Business: hero banner with large numbers, 3-column content
- Admin: vertical sidebar tabs, inline metrics, data table
- Compliance: kanban columns, alert banner
- People: directory grid, inline metrics

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: command center redesign — complete UI overhaul across all pages"
```
