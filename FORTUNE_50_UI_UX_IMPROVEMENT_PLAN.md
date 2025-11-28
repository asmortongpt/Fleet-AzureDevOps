# Fortune 50 Production-Grade UI/UX Improvement Plan
## Fleet Management System - Complete Transformation

**Date**: 2025-11-28
**Target**: Enterprise-grade system worthy of Fortune 50 companies
**Benchmark**: Bloomberg Terminal, Datadog, Grafana, Azure Portal, AWS Console

---

## 🎯 Executive Summary

This document outlines **all required changes** to transform the Fleet Management System from a functional application into a Fortune 50 production-grade platform. The improvements are organized by priority tier and impact.

### Current State Assessment
- ✅ Basic functionality working
- ✅ React/TypeScript architecture solid
- ⚠️ UI/UX not production-ready
- ⚠️ Dark mode exists but needs refinement
- ❌ No design system consistency
- ❌ Performance optimizations incomplete
- ❌ Accessibility compliance gaps

### Target State
- Enterprise-grade visual design
- Sub-200ms interactions
- WCAG AAA compliance
- Consistent design language
- Professional data visualization
- Zero-scroll dashboard layouts
- Predictable, intuitive UX

---

## 📊 TIER 1: CRITICAL - Visual Design Foundation

### 1.1 Design System Implementation
**Impact**: HIGH | **Effort**: 2 weeks | **Priority**: P0

#### Color System Overhaul
```css
/* Current: Basic oklch colors */
--primary: oklch(0.45 0.15 250);

/* Required: Complete semantic color palette */
:root {
  /* Brand Colors - Professional Blue Palette */
  --brand-primary: oklch(0.55 0.18 240);
  --brand-secondary: oklch(0.48 0.15 250);
  --brand-accent: oklch(0.65 0.20 220);

  /* Semantic Colors - Full Range */
  --success-50: oklch(0.95 0.05 160);
  --success-100: oklch(0.90 0.08 160);
  --success-200: oklch(0.85 0.10 160);
  --success-300: oklch(0.75 0.12 160);
  --success-400: oklch(0.65 0.15 160);
  --success-500: oklch(0.55 0.18 160); /* Primary success */
  --success-600: oklch(0.45 0.18 160);
  --success-700: oklch(0.35 0.16 160);
  --success-800: oklch(0.25 0.14 160);
  --success-900: oklch(0.15 0.10 160);

  /* Warning Colors - 10 shades */
  --warning-50 through --warning-900

  /* Error Colors - 10 shades */
  --error-50 through --error-900

  /* Info Colors - 10 shades */
  --info-50 through --info-900

  /* Neutral Grays - 20 shades for precision */
  --gray-0: oklch(1 0 0);          /* Pure white */
  --gray-25: oklch(0.98 0.002 250);
  --gray-50: oklch(0.96 0.004 250);
  /* ... up to */
  --gray-950: oklch(0.10 0.01 250);
  --gray-1000: oklch(0 0 0);       /* Pure black */

  /* Data Visualization Palette - 12 distinct colors */
  --viz-blue: oklch(0.55 0.20 240);
  --viz-green: oklch(0.60 0.18 160);
  --viz-yellow: oklch(0.75 0.20 85);
  --viz-orange: oklch(0.65 0.22 60);
  --viz-red: oklch(0.55 0.24 25);
  --viz-purple: oklch(0.50 0.20 300);
  --viz-pink: oklch(0.65 0.22 340);
  --viz-teal: oklch(0.60 0.18 180);
  --viz-indigo: oklch(0.50 0.20 270);
  --viz-cyan: oklch(0.65 0.20 200);
  --viz-lime: oklch(0.70 0.20 130);
  --viz-amber: oklch(0.70 0.22 75);
}

.dark {
  /* Complete dark mode palette with WCAG AAA compliance */
  --brand-primary: oklch(0.65 0.18 240);    /* Brighter in dark mode */
  --brand-secondary: oklch(0.58 0.15 250);

  /* All semantic colors adjusted for dark backgrounds */
  --success-500: oklch(0.65 0.18 160);      /* Increased luminance */
  /* ... full palette */
}
```

**Action Items**:
- [ ] Create `/src/styles/design-tokens.css` with complete color system
- [ ] Generate TypeScript types from CSS variables
- [ ] Create Storybook documentation for all colors
- [ ] Implement color contrast checker utility
- [ ] Create color picker component for admin customization

#### Typography System
```css
/* Current: Basic font-family */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Required: Complete type scale with mathematical progression */
:root {
  /* Font Families */
  --font-sans: 'Inter Variable', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  --font-display: 'Cal Sans', 'Inter Variable', sans-serif;

  /* Type Scale - Perfect Fourth (1.333) */
  --text-xs: 0.75rem;      /* 12px */
  --text-sm: 0.875rem;     /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-lg: 1.125rem;     /* 18px */
  --text-xl: 1.25rem;      /* 20px */
  --text-2xl: 1.5rem;      /* 24px */
  --text-3xl: 1.875rem;    /* 30px */
  --text-4xl: 2.25rem;     /* 36px */
  --text-5xl: 3rem;        /* 48px */
  --text-6xl: 3.75rem;     /* 60px */
  --text-7xl: 4.5rem;      /* 72px */

  /* Line Heights - Optimized for readability */
  --leading-none: 1;
  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  --leading-loose: 2;

  /* Font Weights */
  --font-thin: 100;
  --font-extralight: 200;
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  --font-extrabold: 800;
  --font-black: 900;

  /* Letter Spacing - Optical adjustments */
  --tracking-tighter: -0.05em;
  --tracking-tight: -0.025em;
  --tracking-normal: 0;
  --tracking-wide: 0.025em;
  --tracking-wider: 0.05em;
  --tracking-widest: 0.1em;
}

/* Professional Typography Classes */
.heading-display {
  font-family: var(--font-display);
  font-size: var(--text-6xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
}

.heading-1 {
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
}

.body-large {
  font-size: var(--text-lg);
  line-height: var(--leading-relaxed);
}

.metric-number {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum' 1, 'ss01' 1;
}
```

**Action Items**:
- [ ] Implement Inter Variable font (supports all weights dynamically)
- [ ] Add JetBrains Mono for code/metrics
- [ ] Create typography showcase page
- [ ] Audit all text elements and apply consistent classes
- [ ] Implement responsive typography scaling

#### Spacing System - 8px Grid
```css
/* Current: Basic grid units */
--grid-unit: 8px;

/* Required: Complete spacing scale */
:root {
  --space-0: 0;
  --space-px: 1px;
  --space-0_5: 0.125rem;  /* 2px */
  --space-1: 0.25rem;     /* 4px */
  --space-1_5: 0.375rem;  /* 6px */
  --space-2: 0.5rem;      /* 8px - base unit */
  --space-2_5: 0.625rem;  /* 10px */
  --space-3: 0.75rem;     /* 12px */
  --space-3_5: 0.875rem;  /* 14px */
  --space-4: 1rem;        /* 16px */
  --space-5: 1.25rem;     /* 20px */
  --space-6: 1.5rem;      /* 24px */
  --space-7: 1.75rem;     /* 28px */
  --space-8: 2rem;        /* 32px */
  --space-9: 2.25rem;     /* 36px */
  --space-10: 2.5rem;     /* 40px */
  --space-11: 2.75rem;    /* 44px */
  --space-12: 3rem;       /* 48px */
  --space-14: 3.5rem;     /* 56px */
  --space-16: 4rem;       /* 64px */
  --space-20: 5rem;       /* 80px */
  --space-24: 6rem;       /* 96px */
  --space-28: 7rem;       /* 112px */
  --space-32: 8rem;       /* 128px */
  --space-36: 9rem;       /* 144px */
  --space-40: 10rem;      /* 160px */
  --space-44: 11rem;      /* 176px */
  --space-48: 12rem;      /* 192px */
  --space-52: 13rem;      /* 208px */
  --space-56: 14rem;      /* 224px */
  --space-60: 15rem;      /* 240px */
  --space-64: 16rem;      /* 256px */
  --space-72: 18rem;      /* 288px */
  --space-80: 20rem;      /* 320px */
  --space-96: 24rem;      /* 384px */
}
```

**Action Items**:
- [ ] Replace all hardcoded pixel values with spacing tokens
- [ ] Create spacing utility classes
- [ ] Audit component spacing consistency
- [ ] Document spacing usage in design system

### 1.2 Professional Shadow System
**Impact**: MEDIUM | **Effort**: 3 days | **Priority**: P0

```css
/* Current: Basic shadows */
box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);

/* Required: Elevation system matching Material Design 3 */
:root {
  /* Shadows - Light Mode */
  --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1),
               0 1px 2px -1px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
               0 2px 4px -2px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
               0 4px 6px -4px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
               0 8px 10px -6px rgba(0, 0, 0, 0.1);
  --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  --shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);

  /* Colored Shadows for States */
  --shadow-primary: 0 4px 14px 0 rgba(59, 130, 246, 0.25);
  --shadow-success: 0 4px 14px 0 rgba(34, 197, 94, 0.25);
  --shadow-warning: 0 4px 14px 0 rgba(251, 191, 36, 0.25);
  --shadow-error: 0 4px 14px 0 rgba(239, 68, 68, 0.25);
}

.dark {
  /* Enhanced shadows for dark mode */
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.3),
               0 1px 2px -1px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4),
               0 2px 4px -2px rgba(0, 0, 0, 0.4);
  /* ... enhanced for visibility */
}

/* Elevation Classes */
.elevation-0 { box-shadow: none; }
.elevation-1 { box-shadow: var(--shadow-sm); }
.elevation-2 { box-shadow: var(--shadow-md); }
.elevation-3 { box-shadow: var(--shadow-lg); }
.elevation-4 { box-shadow: var(--shadow-xl); }
.elevation-5 { box-shadow: var(--shadow-2xl); }
```

**Action Items**:
- [ ] Apply appropriate elevation to all cards
- [ ] Use colored shadows for interactive states
- [ ] Ensure dark mode shadow visibility
- [ ] Create elevation showcase

### 1.3 Border Radius System
```css
/* Current: Simple radius */
--radius: 0.5rem;

/* Required: Complete radius scale */
:root {
  --radius-none: 0;
  --radius-sm: 0.25rem;    /* 4px */
  --radius-md: 0.375rem;   /* 6px */
  --radius-lg: 0.5rem;     /* 8px */
  --radius-xl: 0.75rem;    /* 12px */
  --radius-2xl: 1rem;      /* 16px */
  --radius-3xl: 1.5rem;    /* 24px */
  --radius-full: 9999px;   /* Pill shape */
}
```

---

## 📊 TIER 2: LAYOUT & STRUCTURE

### 2.1 No-Scroll Dashboard Layouts
**Impact**: HIGH | **Effort**: 1 week | **Priority**: P0

#### Dashboard Grid System
```tsx
/* Current: Basic grid */
<div className="dashboard-modern">
  {/* Content */}
</div>

/* Required: Sophisticated grid with resize handles */
interface DashboardLayout {
  mode: '1920x1080' | '2560x1440' | '3840x2160'
  gridRows: string
  gridColumns: string
  areas: Record<string, GridArea>
}

const layouts: Record<string, DashboardLayout> = {
  '1920x1080': {
    mode: '1920x1080',
    gridRows: '64px 120px 1fr 64px',
    gridColumns: '1fr 1fr 360px',
    areas: {
      header: { row: 1, col: '1 / -1' },
      statsBar: { row: 2, col: '1 / -1' },
      mapView: { row: 3, col: '1 / 2' },
      chartsGrid: { row: 3, col: '2 / 3' },
      alerts: { row: 3, col: 3 },
      footer: { row: 4, col: '1 / -1' }
    }
  },
  '2560x1440': {
    // Optimized for 2K displays
  },
  '3840x2160': {
    // Optimized for 4K displays
  }
}

// Component with responsive detection
export function AdaptiveDashboard() {
  const layout = useResponsiveLayout()

  return (
    <div
      className="dashboard-adaptive"
      style={{
        display: 'grid',
        gridTemplateRows: layout.gridRows,
        gridTemplateColumns: layout.gridColumns,
        height: '100vh',
        overflow: 'hidden'
      }}
    >
      <DashboardHeader style={{ gridArea: 'header' }} />
      <StatsBar style={{ gridArea: 'statsBar' }} />
      <MapView style={{ gridArea: 'mapView' }} />
      <ChartsGrid style={{ gridArea: 'chartsGrid' }} />
      <AlertsFeed style={{ gridArea: 'alerts' }} />
      <DashboardFooter style={{ gridArea: 'footer' }} />
    </div>
  )
}
```

**Action Items**:
- [ ] Implement responsive layout detection
- [ ] Create layouts for 1080p, 2K, 4K
- [ ] Add drag-and-drop grid customization
- [ ] Save user layout preferences
- [ ] Add "Reset to Default" layout button

### 2.2 Component Density Controls
**Impact**: MEDIUM | **Effort**: 1 week | **Priority**: P1

```tsx
/* Current: Fixed density */
<CompactMetricCard title="Active Vehicles" value={142} />

/* Required: User-controllable density */
type ComponentDensity = 'compact' | 'comfortable' | 'spacious'

interface DensitySettings {
  global: ComponentDensity
  overrides: Record<string, ComponentDensity>
}

// Density CSS Variables
:root[data-density="compact"] {
  --component-padding: var(--space-2);
  --component-gap: var(--space-2);
  --text-size-multiplier: 0.9;
}

:root[data-density="comfortable"] {
  --component-padding: var(--space-4);
  --component-gap: var(--space-4);
  --text-size-multiplier: 1.0;
}

:root[data-density="spacious"] {
  --component-padding: var(--space-6);
  --component-gap: var(--space-6);
  --text-size-multiplier: 1.1;
}

// Density Provider
export function DensityProvider({ children }: PropsWithChildren) {
  const [density, setDensity] = useDensitySetting()

  useEffect(() => {
    document.documentElement.dataset.density = density
  }, [density])

  return (
    <DensityContext.Provider value={{ density, setDensity }}>
      {children}
    </DensityContext.Provider>
  )
}
```

**Action Items**:
- [ ] Implement density context provider
- [ ] Add density selector to settings
- [ ] Update all components to respect density
- [ ] Test all three density modes
- [ ] Document density usage

### 2.3 Sidebar Navigation Enhancement
**Impact**: MEDIUM | **Effort**: 5 days | **Priority**: P1

```tsx
/* Current: Basic sidebar */
<nav className="sidebar">
  {navigationItems.map(item => <NavItem {...item} />)}
</nav>

/* Required: Professional collapsible sidebar */
interface NavigationItem {
  id: string
  label: string
  icon: ReactNode
  href?: string
  badge?: { text: string; variant: 'info' | 'warning' | 'error' }
  children?: NavigationItem[]
  shortcut?: string
  isNew?: boolean
  isBeta?: boolean
}

export function ProfessionalSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const { currentRoute } = useRouter()

  return (
    <aside
      className={cn(
        "sidebar-professional",
        isCollapsed && "sidebar-collapsed"
      )}
      style={{
        width: isCollapsed ? '64px' : '280px',
        transition: 'width 200ms cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {/* Logo Section */}
      <div className="sidebar-header">
        <FleetLogo collapsed={isCollapsed} />
        <IconButton
          onClick={() => setIsCollapsed(!isCollapsed)}
          icon={isCollapsed ? <CaretRight /> : <CaretLeft />}
        />
      </div>

      {/* Navigation Tree */}
      <ScrollArea className="sidebar-content">
        <NavigationTree
          items={navigationItems}
          currentRoute={currentRoute}
          collapsed={isCollapsed}
          expandedGroups={expandedGroups}
          onToggleGroup={(id) => {
            const next = new Set(expandedGroups)
            next.has(id) ? next.delete(id) : next.add(id)
            setExpandedGroups(next)
          }}
        />
      </ScrollArea>

      {/* User Profile */}
      <div className="sidebar-footer">
        <UserProfile collapsed={isCollapsed} />
      </div>
    </aside>
  )
}

// Navigation Item Component
function NavigationTreeItem({
  item,
  currentRoute,
  collapsed,
  depth = 0
}: NavigationTreeItemProps) {
  const isActive = currentRoute === item.href
  const hasChildren = item.children && item.children.length > 0

  return (
    <div className="nav-item-wrapper">
      <NavLink
        to={item.href}
        className={cn(
          "nav-item",
          isActive && "nav-item-active",
          `nav-item-depth-${depth}`
        )}
      >
        <span className="nav-item-icon">{item.icon}</span>
        {!collapsed && (
          <>
            <span className="nav-item-label">{item.label}</span>
            {item.badge && <Badge {...item.badge} />}
            {item.isNew && <Badge text="NEW" variant="info" />}
            {item.isBeta && <Badge text="BETA" variant="warning" />}
            {item.shortcut && (
              <kbd className="nav-item-shortcut">{item.shortcut}</kbd>
            )}
            {hasChildren && (
              <CaretDown className="nav-item-caret" />
            )}
          </>
        )}
      </NavLink>

      {hasChildren && !collapsed && (
        <div className="nav-item-children">
          {item.children.map(child => (
            <NavigationTreeItem
              key={child.id}
              item={child}
              currentRoute={currentRoute}
              collapsed={collapsed}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

**Action Items**:
- [ ] Implement collapsible sidebar with animations
- [ ] Add keyboard shortcuts display
- [ ] Implement nested navigation groups
- [ ] Add "New" and "Beta" badges
- [ ] Add notification badges for updates
- [ ] Implement sidebar search
- [ ] Add favorites/pinned items section

---

## 📊 TIER 3: INTERACTIVE COMPONENTS

### 3.1 Professional Data Tables
**Impact**: HIGH | **Effort**: 2 weeks | **Priority**: P1

```tsx
/* Current: Basic table */
<table>
  <tbody>
    {vehicles.map(v => <tr key={v.id}><td>{v.number}</td></tr>)}
  </tbody>
</table>

/* Required: Enterprise data table with all features */
interface DataTableProps<TData> {
  data: TData[]
  columns: ColumnDef<TData>[]
  // Pagination
  pagination?: {
    pageSize: number
    currentPage: number
    totalRows: number
    onPageChange: (page: number) => void
  }
  // Sorting
  sorting?: {
    sortBy: string
    sortDirection: 'asc' | 'desc'
    onSortChange: (sortBy: string) => void
  }
  // Filtering
  filters?: FilterConfig[]
  onFilterChange?: (filters: Record<string, any>) => void
  // Selection
  selectable?: boolean
  selectedRows?: Set<string>
  onSelectionChange?: (selected: Set<string>) => void
  // Row Actions
  rowActions?: RowAction<TData>[]
  // Bulk Actions
  bulkActions?: BulkAction<TData>[]
  // Column Visibility
  columnVisibility?: Record<string, boolean>
  onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void
  // Column Reordering
  columnOrder?: string[]
  onColumnOrderChange?: (order: string[]) => void
  // Resizable Columns
  columnSizes?: Record<string, number>
  onColumnSizeChange?: (sizes: Record<string, number>) => void
  // Virtualization
  virtualized?: boolean
  rowHeight?: number
  // Export
  exportable?: boolean
  exportFormats?: ('csv' | 'xlsx' | 'pdf')[]
  // Density
  density?: 'compact' | 'comfortable' | 'spacious'
  // Loading State
  isLoading?: boolean
  loadingRows?: number
  // Empty State
  emptyState?: ReactNode
  // Sticky Header
  stickyHeader?: boolean
  // Zebra Striping
  striped?: boolean
  // Hover State
  highlightOnHover?: boolean
}

export function EnterpriseDataTable<TData>({
  data,
  columns,
  pagination,
  sorting,
  filters,
  selectable,
  selectedRows = new Set(),
  onSelectionChange,
  rowActions,
  bulkActions,
  columnVisibility,
  columnOrder,
  columnSizes,
  virtualized,
  exportable,
  density = 'comfortable',
  isLoading,
  emptyState,
  stickyHeader,
  striped,
  highlightOnHover
}: DataTableProps<TData>) {
  // Implementation with all features
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      columnVisibility,
      rowSelection: selectedRows,
      columnOrder,
      columnSizing: columnSizes
    }
  })

  return (
    <div className="data-table-container">
      {/* Table Toolbar */}
      <DataTableToolbar
        filters={filters}
        selectedCount={selectedRows.size}
        bulkActions={bulkActions}
        exportable={exportable}
        columnVisibility={columnVisibility}
      />

      {/* Table */}
      {virtualized ? (
        <VirtualizedTable table={table} />
      ) : (
        <StandardTable
          table={table}
          striped={striped}
          highlightOnHover={highlightOnHover}
        />
      )}

      {/* Pagination */}
      {pagination && (
        <DataTablePagination {...pagination} />
      )}
    </div>
  )
}
```

**Features to Implement**:
- [ ] Column sorting (single + multi-column)
- [ ] Advanced filtering (text, date, number, select)
- [ ] Column resizing with drag handles
- [ ] Column reordering via drag-and-drop
- [ ] Column visibility toggle
- [ ] Row selection (single + multi-select)
- [ ] Bulk actions toolbar
- [ ] Export to CSV, Excel, PDF
- [ ] Virtual scrolling for 10,000+ rows
- [ ] Inline editing
- [ ] Row expansion for details
- [ ] Saved views/filters
- [ ] Global search
- [ ] Column freezing (pin left/right)

### 3.2 Advanced Chart Components
**Impact**: HIGH | **Effort**: 2 weeks | **Priority**: P1

```tsx
/* Current: Basic MiniChart */
<MiniChart type="line" data={[1, 2, 3]} />

/* Required: Professional chart library */
import {
  LineChart,
  BarChart,
  AreaChart,
  PieChart,
  DonutChart,
  ScatterChart,
  HeatmapChart,
  GaugeChart,
  SparklineChart
} from '@/components/charts'

interface ChartProps {
  data: ChartDataPoint[]
  // Visual
  colors?: string[]
  theme?: 'light' | 'dark'
  height?: number | string
  width?: number | string
  // Axes
  xAxis?: AxisConfig
  yAxis?: AxisConfig
  secondaryYAxis?: AxisConfig
  // Interaction
  interactive?: boolean
  zoomable?: boolean
  brushable?: boolean
  crosshair?: boolean
  // Tooltip
  tooltip?: TooltipConfig
  // Legend
  legend?: LegendConfig
  // Annotations
  annotations?: Annotation[]
  // Reference Lines
  referenceLines?: ReferenceLine[]
  // Animation
  animated?: boolean
  animationDuration?: number
  animationEasing?: EasingFunction
  // Responsive
  responsive?: boolean
  maintainAspectRatio?: boolean
  // Export
  exportable?: boolean
  // Accessibility
  ariaLabel?: string
  ariaDescription?: string
}

// Example: Professional Line Chart
<LineChart
  data={telemetryData}
  xAxis={{
    type: 'time',
    label: 'Time',
    format: 'HH:mm:ss'
  }}
  yAxis={{
    label: 'Speed (mph)',
    min: 0,
    max: 120,
    ticks: 6
  }}
  secondaryYAxis={{
    label: 'RPM',
    min: 0,
    max: 6000
  }}
  tooltip={{
    enabled: true,
    format: (value, dataPoint) => {
      return `${dataPoint.time}: ${value} mph`
    },
    crosshair: true
  }}
  legend={{
    position: 'bottom',
    interactive: true
  }}
  annotations={[
    {
      type: 'line',
      yValue: 65,
      label: 'Speed Limit',
      color: 'red',
      dashArray: [5, 5]
    }
  ]}
  zoomable
  brushable
  exportable
  animated
/>
```

**Chart Types Needed**:
- [ ] Line Chart (single + multi-series)
- [ ] Area Chart (stacked + unstacked)
- [ ] Bar Chart (vertical + horizontal)
- [ ] Column Chart
- [ ] Pie Chart
- [ ] Donut Chart with center metric
- [ ] Gauge Chart
- [ ] Sparkline Chart
- [ ] Heatmap
- [ ] Scatter Plot
- [ ] Bubble Chart
- [ ] Candlestick Chart
- [ ] Waterfall Chart
- [ ] Funnel Chart
- [ ] Sankey Diagram
- [ ] Tree Map

**Chart Features**:
- [ ] Real-time data updates
- [ ] Zoom and pan
- [ ] Brush selection
- [ ] Crosshair cursor
- [ ] Rich tooltips with HTML
- [ ] Export to PNG, SVG, PDF
- [ ] Responsive sizing
- [ ] Animation on load
- [ ] Theme support (light/dark)
- [ ] Accessibility (ARIA labels, keyboard nav)

### 3.3 Form Components with Validation
**Impact**: MEDIUM | **Effort**: 1 week | **Priority**: P2

```tsx
/* Current: Basic Input */
<Input type="text" />

/* Required: Complete form system */
<Form onSubmit={handleSubmit}>
  <FormField
    name="vehicleNumber"
    label="Vehicle Number"
    required
    validation={{
      pattern: /^[A-Z0-9]{1,10}$/,
      message: "Must be 1-10 alphanumeric characters"
    }}
    hint="Enter the vehicle identification number"
    placeholder="ABC123"
  />

  <FormField
    name="vin"
    label="VIN"
    required
    validation={{
      custom: async (value) => {
        const isValid = await validateVIN(value)
        if (!isValid) return "Invalid VIN checksum"
        return true
      }
    }}
    asyncValidation
    debounce={500}
  />

  <FormField
    name="assignedDriver"
    label="Assigned Driver"
    type="combobox"
    options={drivers}
    searchable
    creatable
    multiple={false}
    placeholder="Search drivers..."
  />

  <FormField
    name="maintenanceSchedule"
    label="Maintenance Schedule"
    type="date-range"
    minDate={new Date()}
    maxDate={addYears(new Date(), 1)}
  />

  <FormField
    name="mileage"
    label="Current Mileage"
    type="number"
    min={0}
    step={1}
    unit="miles"
    formatThousands
  />

  <FormActions>
    <Button variant="ghost" onClick={onCancel}>Cancel</Button>
    <Button type="submit" disabled={!isValid}>Save Vehicle</Button>
  </FormActions>
</Form>
```

**Form Components Needed**:
- [ ] Text Input (with prefix/suffix support)
- [ ] Textarea (with character count)
- [ ] Number Input (with increment/decrement buttons)
- [ ] Date Picker (single date)
- [ ] Date Range Picker
- [ ] Time Picker
- [ ] DateTime Picker
- [ ] Select (native dropdown)
- [ ] Combobox (searchable select)
- [ ] Multi-Select
- [ ] Radio Group
- [ ] Checkbox Group
- [ ] Toggle Switch
- [ ] Slider (single + range)
- [ ] File Upload (with drag-and-drop)
- [ ] Color Picker
- [ ] Rich Text Editor
- [ ] Phone Number Input (with country code)
- [ ] Currency Input
- [ ] Percentage Input

**Form Features**:
- [ ] Client-side validation
- [ ] Async validation
- [ ] Field dependencies
- [ ] Conditional fields
- [ ] Auto-save drafts
- [ ] Form state persistence
- [ ] Multi-step forms
- [ ] Progress indicators
- [ ] Field masking
- [ ] Smart defaults

---

## 📊 TIER 4: PERFORMANCE OPTIMIZATION

### 4.1 Code Splitting & Lazy Loading
**Impact**: HIGH | **Effort**: 1 week | **Priority**: P1

```tsx
/* Current: Basic lazy loading */
const FleetDashboard = lazy(() => import("@/components/modules/FleetDashboard"))

/* Required: Comprehensive code splitting strategy */

// 1. Route-based splitting (already done)
// 2. Component-level splitting for heavy components
const ProfessionalFleetMap = lazy(() =>
  import("@/components/Maps/ProfessionalFleetMap")
)

const EnterpriseDataTable = lazy(() =>
  import("@/components/tables/EnterpriseDataTable")
)

// 3. Library splitting - load on demand
const loadChartLibrary = () => import('recharts')
const loadPDFLibrary = () => import('jspdf')
const loadExcelLibrary = () => import('xlsx')

// 4. Prefetching for likely navigation
function usePreloadRoutes() {
  useEffect(() => {
    // Preload dashboard when user hovers navigation
    const dashboardLink = document.querySelector('[href="/dashboard"]')
    dashboardLink?.addEventListener('mouseenter', () => {
      import("@/components/modules/FleetDashboard")
    })
  }, [])
}

// 5. Webpack magic comments for chunk naming
const GarageService = lazy(() =>
  import(
    /* webpackChunkName: "garage" */
    /* webpackPrefetch: true */
    "@/components/modules/GarageService"
  )
)
```

**Optimization Targets**:
- [ ] Initial bundle < 200KB (gzipped)
- [ ] Route chunks < 100KB each
- [ ] Component chunks < 50KB each
- [ ] Library chunks split appropriately
- [ ] Critical CSS inlined
- [ ] Non-critical CSS lazy loaded
- [ ] Prefetch likely routes
- [ ] Implement service worker caching

### 4.2 React Performance Optimizations
**Impact**: HIGH | **Effort**: 1 week | **Priority**: P1

```tsx
/* Current: No memoization */
export function FleetDashboardModern({ data }: Props) {
  const vehicles = data.vehicles
  return <div>{vehicles.map(v => <VehicleCard vehicle={v} />)}</div>
}

/* Required: Full memoization strategy */

// 1. Memoize expensive computations
export function FleetDashboardModern({ data }: Props) {
  const vehicles = data.vehicles

  const aggregatedStats = useMemo(() => {
    return {
      totalVehicles: vehicles.length,
      activeVehicles: vehicles.filter(v => v.status === 'active').length,
      avgMileage: vehicles.reduce((sum, v) => sum + v.mileage, 0) / vehicles.length,
      maintenanceDue: vehicles.filter(v => v.maintenanceDue).length
    }
  }, [vehicles])

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v =>
      v.status === statusFilter &&
      v.region === regionFilter
    )
  }, [vehicles, statusFilter, regionFilter])

  return (
    <DashboardLayout stats={aggregatedStats}>
      <VehicleList vehicles={filteredVehicles} />
    </DashboardLayout>
  )
}

// 2. Memoize components
const VehicleCard = memo(({ vehicle }: { vehicle: Vehicle }) => {
  return (
    <Card>
      <h3>{vehicle.number}</h3>
      <p>{vehicle.status}</p>
    </Card>
  )
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if specific fields change
  return (
    prevProps.vehicle.id === nextProps.vehicle.id &&
    prevProps.vehicle.status === nextProps.vehicle.status &&
    prevProps.vehicle.mileage === nextProps.vehicle.mileage
  )
})

// 3. Memoize callbacks
const handleVehicleClick = useCallback((vehicleId: string) => {
  drilldown.push({
    type: 'vehicle',
    id: vehicleId,
    title: `Vehicle ${vehicleId}`
  })
}, [drilldown])

// 4. Use React.memo for list items
const MemoizedVehicleRow = memo(VehicleRow)

function VehicleList({ vehicles }: { vehicles: Vehicle[] }) {
  return (
    <div>
      {vehicles.map(v => (
        <MemoizedVehicleRow key={v.id} vehicle={v} />
      ))}
    </div>
  )
}

// 5. Virtual scrolling for large lists
import { useVirtualizer } from '@tanstack/react-virtual'

function VirtualizedVehicleList({ vehicles }: { vehicles: Vehicle[] }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: vehicles.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5
  })

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative'
        }}
      >
        {virtualizer.getVirtualItems().map(virtualRow => {
          const vehicle = vehicles[virtualRow.index]
          return (
            <div
              key={vehicle.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`
              }}
            >
              <VehicleRow vehicle={vehicle} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

**Performance Checklist**:
- [ ] Memoize all expensive computations with useMemo
- [ ] Memoize all callback functions with useCallback
- [ ] Wrap list item components with React.memo
- [ ] Implement virtual scrolling for lists > 100 items
- [ ] Use production builds for deployment
- [ ] Enable React Concurrent Features
- [ ] Implement code splitting for all routes
- [ ] Lazy load heavy dependencies
- [ ] Optimize images (WebP, AVIF)
- [ ] Use responsive images with srcset
- [ ] Implement service worker for offline support

### 4.3 Network Performance
**Impact**: MEDIUM | **Effort**: 5 days | **Priority**: P2

```typescript
/* Current: Basic fetch */
const response = await fetch('/api/vehicles')
const data = await response.json()

/* Required: Optimized data fetching */

// 1. Implement React Query for caching
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

function useVehicles(filters?: VehicleFilters) {
  return useQuery({
    queryKey: ['vehicles', filters],
    queryFn: () => fetchVehicles(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  })
}

// 2. Implement optimistic updates
function useUpdateVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateVehicle,
    onMutate: async (updatedVehicle) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['vehicles'] })

      // Snapshot previous value
      const previousVehicles = queryClient.getQueryData(['vehicles'])

      // Optimistically update
      queryClient.setQueryData(['vehicles'], (old: Vehicle[]) => {
        return old.map(v =>
          v.id === updatedVehicle.id ? { ...v, ...updatedVehicle } : v
        )
      })

      return { previousVehicles }
    },
    onError: (err, updatedVehicle, context) => {
      // Rollback on error
      queryClient.setQueryData(['vehicles'], context.previousVehicles)
    },
    onSettled: () => {
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    }
  })
}

// 3. Implement request deduplication
const fetchVehicles = memoize(async (filters: VehicleFilters) => {
  const response = await fetch(`/api/vehicles?${new URLSearchParams(filters)}`)
  return response.json()
}, {
  maxAge: 5000 // Dedupe requests within 5 seconds
})

// 4. Implement pagination and infinite scroll
function useInfiniteVehicles() {
  return useInfiniteQuery({
    queryKey: ['vehicles', 'infinite'],
    queryFn: ({ pageParam = 0 }) => fetchVehicles({ page: pageParam, limit: 50 }),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length : undefined
    }
  })
}

// 5. Prefetch related data
function VehicleCard({ vehicleId }: { vehicleId: string }) {
  const queryClient = useQueryClient()

  const prefetchVehicleDetails = () => {
    queryClient.prefetchQuery({
      queryKey: ['vehicle', vehicleId],
      queryFn: () => fetchVehicleDetails(vehicleId)
    })
  }

  return (
    <Card onMouseEnter={prefetchVehicleDetails}>
      {/* Card content */}
    </Card>
  )
}
```

**Network Optimizations**:
- [ ] Implement React Query for all API calls
- [ ] Add request caching with appropriate TTLs
- [ ] Implement optimistic updates
- [ ] Add request deduplication
- [ ] Implement pagination for large datasets
- [ ] Add infinite scroll for feeds
- [ ] Prefetch likely data on hover/focus
- [ ] Implement WebSocket for real-time updates
- [ ] Add retry logic with exponential backoff
- [ ] Implement request cancellation
- [ ] Compress API responses (gzip/brotli)
- [ ] Use HTTP/2 server push
- [ ] Implement GraphQL for flexible data fetching

---

## 📊 TIER 5: ACCESSIBILITY (WCAG AAA)

### 5.1 Color Contrast Compliance
**Impact**: HIGH | **Effort**: 1 week | **Priority**: P1

```css
/* Current: Some contrast issues */
.text-muted-foreground {
  color: oklch(0.70 0.03 250); /* Ratio: 4.8:1 (WCAG AA) */
}

/* Required: WCAG AAA compliance (7:1 for normal text, 4.5:1 for large) */
.dark {
  /* Normal text - 7:1 ratio minimum */
  --text-primary: oklch(0.98 0.005 250);     /* 19:1 ratio ✓ */
  --text-secondary: oklch(0.85 0.02 250);    /* 12:1 ratio ✓ */
  --text-tertiary: oklch(0.72 0.03 250);     /* 7.2:1 ratio ✓ */

  /* Large text (18pt+) - 4.5:1 ratio minimum */
  --text-heading: oklch(0.95 0.005 250);     /* 16:1 ratio ✓ */
  --text-subtitle: oklch(0.80 0.02 250);     /* 9.5:1 ratio ✓ */

  /* Interactive elements - 3:1 ratio minimum */
  --border-interactive: oklch(0.40 0.01 250); /* 3.2:1 ratio ✓ */
  --focus-ring: oklch(0.65 0.18 240);        /* 5.1:1 ratio ✓ */
}

/* Contrast checker utility */
function checkContrast(foreground: string, background: string): {
  ratio: number
  wcagLevel: 'AAA' | 'AA' | 'Fail'
  passes: {
    normalTextAAA: boolean
    normalTextAA: boolean
    largeTextAAA: boolean
    largeTextAA: boolean
  }
} {
  const ratio = calculateContrastRatio(foreground, background)

  return {
    ratio,
    wcagLevel: ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'Fail',
    passes: {
      normalTextAAA: ratio >= 7,
      normalTextAA: ratio >= 4.5,
      largeTextAAA: ratio >= 4.5,
      largeTextAA: ratio >= 3
    }
  }
}
```

**Action Items**:
- [ ] Audit all text colors for WCAG AAA compliance
- [ ] Create contrast checker utility
- [ ] Add automated contrast testing
- [ ] Provide high contrast theme option
- [ ] Ensure all interactive elements meet 3:1 ratio

### 5.2 Keyboard Navigation
**Impact**: HIGH | **Effort**: 1 week | **Priority**: P0

```tsx
/* Current: Limited keyboard support */
<button onClick={handleClick}>Click me</button>

/* Required: Full keyboard navigation */

// 1. Focus management
import { useFocusTrap, useFocusReturn } from '@/hooks/focus'

function Modal({ isOpen, onClose }: ModalProps) {
  const modalRef = useFocusTrap(isOpen)
  const returnFocus = useFocusReturn()

  useEffect(() => {
    if (!isOpen) returnFocus()
  }, [isOpen, returnFocus])

  return (
    <div ref={modalRef} role="dialog" aria-modal="true">
      <h2 id="modal-title">Modal Title</h2>
      <p id="modal-description">Modal content</p>
      <button onClick={onClose}>Close</button>
    </div>
  )
}

// 2. Keyboard shortcuts
import { useHotkeys } from 'react-hotkeys-hook'

function FleetDashboard() {
  useHotkeys('/', () => focusSearch())
  useHotkeys('ctrl+k', () => openCommandPalette())
  useHotkeys('g d', () => navigate('/dashboard'))
  useHotkeys('g v', () => navigate('/vehicles'))
  useHotkeys('?', () => showKeyboardShortcuts())

  return <DashboardContent />
}

// 3. Roving tabindex for lists
function VehicleList({ vehicles }: { vehicles: Vehicle[] }) {
  const [focusedIndex, setFocusedIndex] = useState(0)

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex(Math.min(focusedIndex + 1, vehicles.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(Math.max(focusedIndex - 1, 0))
        break
      case 'Home':
        e.preventDefault()
        setFocusedIndex(0)
        break
      case 'End':
        e.preventDefault()
        setFocusedIndex(vehicles.length - 1)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        handleSelect(vehicles[focusedIndex])
        break
    }
  }

  return (
    <div role="list" onKeyDown={handleKeyDown}>
      {vehicles.map((vehicle, index) => (
        <div
          key={vehicle.id}
          role="listitem"
          tabIndex={index === focusedIndex ? 0 : -1}
          onFocus={() => setFocusedIndex(index)}
        >
          {vehicle.number}
        </div>
      ))}
    </div>
  )
}

// 4. Skip links
function AppLayout() {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <a href="#navigation" className="skip-link">
        Skip to navigation
      </a>
      <Header />
      <Sidebar id="navigation" />
      <main id="main-content">
        <Outlet />
      </main>
    </>
  )
}
```

**Keyboard Navigation Requirements**:
- [ ] All interactive elements keyboard accessible
- [ ] Logical tab order throughout application
- [ ] Visible focus indicators (not just :focus-visible)
- [ ] Skip links for main content/navigation
- [ ] Keyboard shortcuts for common actions
- [ ] Arrow key navigation in lists/grids
- [ ] Escape key closes modals/dialogs
- [ ] Enter/Space activates buttons
- [ ] Keyboard shortcut help modal (?)

### 5.3 Screen Reader Support
**Impact**: HIGH | **Effort**: 1 week | **Priority**: P1

```tsx
/* Current: Missing ARIA labels */
<button onClick={handleDelete}>
  <Trash />
</button>

/* Required: Complete ARIA implementation */

// 1. Semantic HTML
<nav aria-label="Primary navigation">
  <ul>
    <li><a href="/dashboard">Dashboard</a></li>
  </ul>
</nav>

<main aria-labelledby="page-title">
  <h1 id="page-title">Fleet Dashboard</h1>
</main>

// 2. ARIA labels for icons
<button
  onClick={handleDelete}
  aria-label="Delete vehicle"
>
  <Trash aria-hidden="true" />
</button>

// 3. ARIA live regions
<div aria-live="polite" aria-atomic="true">
  {notifications.map(n => (
    <Notification key={n.id} {...n} />
  ))}
</div>

// 4. ARIA for complex widgets
<div
  role="tablist"
  aria-label="Dashboard views"
>
  <button
    role="tab"
    aria-selected={selectedTab === 'overview'}
    aria-controls="overview-panel"
    id="overview-tab"
  >
    Overview
  </button>
  <button
    role="tab"
    aria-selected={selectedTab === 'analytics'}
    aria-controls="analytics-panel"
    id="analytics-tab"
  >
    Analytics
  </button>
</div>

<div
  role="tabpanel"
  id="overview-panel"
  aria-labelledby="overview-tab"
  hidden={selectedTab !== 'overview'}
>
  {/* Panel content */}
</div>

// 5. Loading states
<div role="status" aria-live="polite" aria-busy={isLoading}>
  {isLoading ? (
    <span>Loading vehicles...</span>
  ) : (
    <span>{vehicles.length} vehicles loaded</span>
  )}
</div>

// 6. Error announcements
function ErrorAnnouncement({ error }: { error: string }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="sr-only"
    >
      Error: {error}
    </div>
  )
}

// 7. Form field descriptions
<label htmlFor="vehicle-number">
  Vehicle Number
  <span aria-label="required">*</span>
</label>
<input
  id="vehicle-number"
  aria-required="true"
  aria-invalid={hasError}
  aria-describedby="vehicle-number-error vehicle-number-hint"
/>
<span id="vehicle-number-hint">Enter 1-10 alphanumeric characters</span>
{hasError && (
  <span id="vehicle-number-error" role="alert">
    Vehicle number is required
  </span>
)}
```

**ARIA Requirements**:
- [ ] All images have alt text
- [ ] Icon buttons have aria-label
- [ ] Form fields have labels
- [ ] Error messages use role="alert"
- [ ] Loading states use aria-busy
- [ ] Live regions for dynamic content
- [ ] Landmarks (nav, main, aside, footer)
- [ ] Heading hierarchy (h1, h2, h3)
- [ ] Tables have captions and th elements
- [ ] Lists use proper list markup

---

## 📊 TIER 6: ADVANCED FEATURES

### 6.1 Command Palette
**Impact**: MEDIUM | **Effort**: 1 week | **Priority**: P2

```tsx
/* Required: Spotlight-style command palette */
import { CommandPalette } from '@/components/CommandPalette'

interface Command {
  id: string
  label: string
  description?: string
  keywords?: string[]
  icon?: ReactNode
  shortcut?: string
  category: 'navigation' | 'action' | 'search' | 'recent'
  action: () => void
}

const commands: Command[] = [
  // Navigation
  {
    id: 'nav-dashboard',
    label: 'Go to Dashboard',
    keywords: ['home', 'main'],
    icon: <House />,
    shortcut: 'g d',
    category: 'navigation',
    action: () => navigate('/dashboard')
  },
  {
    id: 'nav-vehicles',
    label: 'Go to Vehicles',
    keywords: ['fleet', 'cars'],
    icon: <Car />,
    shortcut: 'g v',
    category: 'navigation',
    action: () => navigate('/vehicles')
  },

  // Actions
  {
    id: 'add-vehicle',
    label: 'Add New Vehicle',
    description: 'Register a new vehicle in the fleet',
    icon: <Plus />,
    category: 'action',
    action: () => openAddVehicleDialog()
  },

  // Search
  {
    id: 'search-vehicles',
    label: 'Search Vehicles',
    icon: <MagnifyingGlass />,
    shortcut: '/',
    category: 'search',
    action: () => focusVehicleSearch()
  },

  // Settings
  {
    id: 'toggle-theme',
    label: 'Toggle Dark Mode',
    icon: <Moon />,
    category: 'action',
    action: () => toggleTheme()
  }
]

export function AppWithCommandPalette() {
  const [isOpen, setIsOpen] = useState(false)

  useHotkeys('ctrl+k, cmd+k', () => setIsOpen(true))

  return (
    <>
      <App />
      <CommandPalette
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        commands={commands}
        placeholder="Type a command or search..."
        recentLimit={5}
      />
    </>
  )
}
```

**Features**:
- [ ] Fuzzy search across commands
- [ ] Recent commands tracking
- [ ] Keyboard navigation
- [ ] Command categories
- [ ] Custom command registration
- [ ] Shortcuts display
- [ ] Dynamic command loading

### 6.2 Customizable Dashboards
**Impact**: HIGH | **Effort**: 2 weeks | **Priority**: P2

```tsx
/* Required: Drag-and-drop dashboard builder */
import { DashboardBuilder } from '@/components/DashboardBuilder'

interface DashboardWidget {
  id: string
  type: 'metric' | 'chart' | 'table' | 'map' | 'alert-feed'
  title: string
  config: Record<string, any>
  layout: {
    x: number
    y: number
    w: number
    h: number
  }
}

interface DashboardTemplate {
  id: string
  name: string
  description: string
  widgets: DashboardWidget[]
  layout: {
    cols: number
    rowHeight: number
  }
}

export function CustomizableDashboard() {
  const [widgets, setWidgets] = useState<DashboardWidget[]>([])
  const [isEditMode, setIsEditMode] = useState(false)

  return (
    <div className="dashboard-container">
      <DashboardToolbar>
        <Button onClick={() => setIsEditMode(!isEditMode)}>
          {isEditMode ? 'Exit Edit Mode' : 'Customize Dashboard'}
        </Button>
        <Button onClick={saveLayout}>Save Layout</Button>
        <Button onClick={resetLayout}>Reset to Default</Button>
      </DashboardToolbar>

      <GridLayout
        widgets={widgets}
        onLayoutChange={setWidgets}
        editable={isEditMode}
        cols={12}
        rowHeight={60}
        draggableHandle=".widget-drag-handle"
      >
        {widgets.map(widget => (
          <Widget
            key={widget.id}
            {...widget}
            editable={isEditMode}
            onRemove={() => removeWidget(widget.id)}
            onConfigure={() => configureWidget(widget.id)}
          />
        ))}
      </GridLayout>

      {isEditMode && (
        <WidgetLibrary
          onAddWidget={(type) => addWidget(type)}
        />
      )}
    </div>
  )
}
```

**Features**:
- [ ] Drag-and-drop widget placement
- [ ] Resizable widgets
- [ ] Widget library
- [ ] Save custom layouts
- [ ] Multiple dashboard templates
- [ ] Share dashboards with team
- [ ] Export/import dashboard configs
- [ ] Widget configuration UI
- [ ] Responsive layouts

### 6.3 Advanced Filtering System
**Impact**: MEDIUM | **Effort**: 1 week | **Priority**: P2

```tsx
/* Required: Power user filtering */
interface FilterRule {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'starts_with' | 'ends_with' |
           'greater_than' | 'less_than' | 'between' | 'is_null' | 'is_not_null' |
           'in' | 'not_in'
  value: any
}

interface FilterGroup {
  operator: 'AND' | 'OR'
  rules: (FilterRule | FilterGroup)[]
}

export function AdvancedFilterBuilder() {
  const [filter, setFilter] = useState<FilterGroup>({
    operator: 'AND',
    rules: []
  })

  return (
    <FilterBuilder
      filter={filter}
      onChange={setFilter}
      fields={[
        { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] },
        { name: 'mileage', label: 'Mileage', type: 'number' },
        { name: 'lastService', label: 'Last Service', type: 'date' },
        { name: 'assignedDriver', label: 'Assigned Driver', type: 'text' }
      ]}
      onApply={(filter) => applyFilter(filter)}
      savedFilters={[
        { name: 'High Mileage Vehicles', filter: highMileageFilter },
        { name: 'Maintenance Due', filter: maintenanceDueFilter }
      ]}
      exportable
    />
  )
}
```

**Features**:
- [ ] Visual query builder
- [ ] Nested filter groups (AND/OR)
- [ ] All comparison operators
- [ ] Saved filter presets
- [ ] Filter sharing
- [ ] Filter export/import
- [ ] Natural language parsing
- [ ] Query validation

---

## 📊 TIER 7: POLISH & REFINEMENT

### 7.1 Micro-interactions
**Impact**: MEDIUM | **Effort**: 1 week | **Priority**: P3

```css
/* Current: No animations */
.button { background: blue; }

/* Required: Smooth micro-interactions */
.button {
  background: var(--primary);
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.button:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.button:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}

/* Loading skeleton animations */
@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--gray-200) 0%,
    var(--gray-100) 50%,
    var(--gray-200) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
}

/* Toast notifications slide in */
@keyframes toast-slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast {
  animation: toast-slide-in 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

/* Number counting animation */
function CountingNumber({ value, duration = 1000 }: Props) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let start = 0
    const end = value
    const increment = end / (duration / 16)

    const timer = setInterval(() => {
      start += increment
      if (start >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)

    return () => clearInterval(timer)
  }, [value, duration])

  return <span>{count.toLocaleString()}</span>
}
```

**Animations Needed**:
- [ ] Button hover/active states
- [ ] Card hover effects
- [ ] Loading skeleton shimmer
- [ ] Toast slide-in animations
- [ ] Modal fade-in/scale
- [ ] Dropdown slide-down
- [ ] Number counting up
- [ ] Progress bar fill
- [ ] Checkbox check mark
- [ ] Toggle switch slide
- [ ] Page transitions
- [ ] List item stagger

### 7.2 Empty States & Error States
**Impact**: MEDIUM | **Effort**: 3 days | **Priority**: P2

```tsx
/* Current: Generic messages */
{vehicles.length === 0 && <p>No vehicles found</p>}

/* Required: Beautiful empty states */
function EmptyVehicleList() {
  return (
    <div className="empty-state">
      <div className="empty-state-illustration">
        <Car size={96} weight="duotone" />
      </div>
      <h3 className="empty-state-title">No vehicles yet</h3>
      <p className="empty-state-description">
        Get started by adding your first vehicle to the fleet.
      </p>
      <div className="empty-state-actions">
        <Button onClick={openAddVehicleDialog}>
          <Plus /> Add Vehicle
        </Button>
        <Button variant="ghost" onClick={openImportDialog}>
          <Upload /> Import from CSV
        </Button>
      </div>
    </div>
  )
}

/* Error states with recovery */
function VehicleListError({ error, retry }: ErrorStateProps) {
  return (
    <div className="error-state">
      <div className="error-state-illustration">
        <WarningCircle size={96} weight="duotone" color="var(--error-500)" />
      </div>
      <h3 className="error-state-title">Failed to load vehicles</h3>
      <p className="error-state-description">
        {error.message || 'An unexpected error occurred'}
      </p>
      <div className="error-state-actions">
        <Button onClick={retry}>
          <ArrowClockwise /> Try Again
        </Button>
        <Button variant="ghost" onClick={contactSupport}>
          Contact Support
        </Button>
      </div>
      {error.stack && (
        <details className="error-state-details">
          <summary>Technical Details</summary>
          <pre>{error.stack}</pre>
        </details>
      )}
    </div>
  )
}
```

**States Needed**:
- [ ] Empty state for each list/table
- [ ] No search results state
- [ ] Network error state
- [ ] Permission denied state
- [ ] 404 not found page
- [ ] 500 server error page
- [ ] Offline state
- [ ] Maintenance mode state

### 7.3 Help & Onboarding
**Impact**: LOW | **Effort**: 1 week | **Priority**: P3

```tsx
/* Required: Product tours and help system */
import { TourProvider, Tour, TourStep } from '@/components/Tour'

const dashboardTour: TourStep[] = [
  {
    target: '[data-tour="stats-bar"]',
    title: 'Fleet Statistics',
    content: 'View real-time statistics about your fleet at a glance.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="vehicle-map"]',
    title: 'Live Vehicle Tracking',
    content: 'See the real-time location of all your vehicles on the map.',
    placement: 'right'
  },
  {
    target: '[data-tour="alerts-feed"]',
    title: 'Alerts & Notifications',
    content: 'Stay informed about important events and maintenance needs.',
    placement: 'left'
  }
]

export function DashboardWithTour() {
  const [showTour, setShowTour] = useState(false)

  return (
    <TourProvider>
      <Dashboard />
      <Tour
        steps={dashboardTour}
        isOpen={showTour}
        onComplete={() => setShowTour(false)}
      />
      <HelpButton onClick={() => setShowTour(true)} />
    </TourProvider>
  )
}

// Contextual help tooltips
<Tooltip
  content="The VIN (Vehicle Identification Number) is a unique 17-character code assigned to every vehicle."
  trigger={<InfoCircle />}
/>

// Help documentation
<HelpPanel>
  <HelpSearch />
  <HelpCategories>
    <HelpCategory title="Getting Started">
      <HelpArticle title="Adding Your First Vehicle" />
      <HelpArticle title="Understanding the Dashboard" />
    </HelpCategory>
    <HelpCategory title="Features">
      <HelpArticle title="GPS Tracking" />
      <HelpArticle title="Maintenance Scheduling" />
    </HelpCategory>
  </HelpCategories>
</HelpPanel>
```

---

## 📊 IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Weeks 1-4)
**Goal**: Establish design system and core infrastructure

- [ ] Week 1: Design tokens (colors, typography, spacing, shadows)
- [ ] Week 2: Component library foundation (buttons, inputs, cards)
- [ ] Week 3: Layout system (grid, spacing, responsive)
- [ ] Week 4: Dark mode refinement and accessibility audit

**Deliverables**:
- Complete design system documentation
- Storybook with all components
- WCAG AAA compliance report
- Performance baseline metrics

### Phase 2: Core Components (Weeks 5-8)
**Goal**: Build professional-grade core components

- [ ] Week 5: Enterprise data table
- [ ] Week 6: Advanced chart library
- [ ] Week 7: Form system with validation
- [ ] Week 8: Navigation and sidebar

**Deliverables**:
- Fully functional data table with all features
- Chart library with 15+ chart types
- Complete form component suite
- Professional navigation system

### Phase 3: Dashboard Layouts (Weeks 9-10)
**Goal**: Implement no-scroll, responsive dashboards

- [ ] Week 9: Dashboard grid system and layouts (1080p, 2K, 4K)
- [ ] Week 10: Customizable dashboard builder

**Deliverables**:
- 3 responsive dashboard layouts
- Drag-and-drop customization
- Saved layout persistence

### Phase 4: Performance & Polish (Weeks 11-12)
**Goal**: Optimize and refine

- [ ] Week 11: Code splitting, lazy loading, caching
- [ ] Week 12: Micro-interactions, empty states, error handling

**Deliverables**:
- Initial load < 200KB
- Lighthouse score > 95
- Smooth 60fps interactions

### Phase 5: Advanced Features (Weeks 13-14)
**Goal**: Add power user features

- [ ] Week 13: Command palette, keyboard shortcuts
- [ ] Week 14: Advanced filtering, saved views

**Deliverables**:
- Full keyboard navigation
- Command palette with 50+ commands
- Advanced filter builder

### Phase 6: Testing & Documentation (Weeks 15-16)
**Goal**: Ensure production readiness

- [ ] Week 15: Comprehensive testing (unit, integration, E2E)
- [ ] Week 16: Documentation, help system, onboarding

**Deliverables**:
- 80%+ test coverage
- Complete user documentation
- Product tour for new users

---

## 📊 SUCCESS METRICS

### Performance Targets
- [ ] Initial Load Time: < 2 seconds (currently ~5s)
- [ ] Time to Interactive: < 3 seconds (currently ~8s)
- [ ] First Contentful Paint: < 1 second
- [ ] Largest Contentful Paint: < 2.5 seconds
- [ ] Cumulative Layout Shift: < 0.1
- [ ] Bundle Size (gzipped): < 200KB initial, < 100KB per route
- [ ] Lighthouse Score: 95+ (Performance, Accessibility, Best Practices, SEO)

### Accessibility Targets
- [ ] WCAG AAA Compliance: 100% of components
- [ ] Keyboard Navigation: 100% of features accessible
- [ ] Screen Reader Support: All content announced correctly
- [ ] Color Contrast: 7:1 minimum for normal text
- [ ] Focus Indicators: Visible on all interactive elements

### User Experience Targets
- [ ] No-Scroll Dashboards: 100% of content visible at 1920x1080
- [ ] Interaction Speed: < 100ms for all clicks/taps
- [ ] Animation Frame Rate: Consistent 60fps
- [ ] Error Recovery: Clear messaging and recovery options
- [ ] Help Availability: Contextual help on every screen

### Developer Experience Targets
- [ ] Component Library: 100+ reusable components
- [ ] Storybook Coverage: All components documented
- [ ] TypeScript Coverage: 100% type safety
- [ ] Test Coverage: 80%+ (unit + integration)
- [ ] Documentation: Complete API docs and usage guides

---

## 📊 RISK ASSESSMENT

### High Risk
1. **Performance Regression**: Adding features may slow down the app
   - Mitigation: Continuous performance monitoring, budget alerts

2. **Breaking Changes**: Refactoring may break existing functionality
   - Mitigation: Comprehensive test suite, feature flags

3. **Scope Creep**: Improvements may expand beyond plan
   - Mitigation: Strict prioritization, phase-based delivery

### Medium Risk
1. **Design Inconsistency**: Multiple developers may implement differently
   - Mitigation: Strict design system, code reviews

2. **Accessibility Gaps**: Complex components may miss a11y requirements
   - Mitigation: Automated testing, manual audits

### Low Risk
1. **Browser Compatibility**: Modern CSS may not work in older browsers
   - Mitigation: Progressive enhancement, polyfills

---

## 📊 CONCLUSION

This plan transforms the Fleet Management System from a functional application into a **Fortune 50 production-grade platform**. The improvements span:

1. **Design System**: Complete visual language with 10-shade color palettes
2. **Components**: Enterprise-grade tables, charts, forms
3. **Performance**: Sub-200KB bundles, < 2s load times
4. **Accessibility**: WCAG AAA compliance
5. **Features**: Command palette, customizable dashboards, advanced filtering
6. **Polish**: Micro-interactions, empty states, help system

**Estimated Timeline**: 16 weeks (4 months)
**Team Size**: 2-3 developers + 1 designer
**Budget**: $200,000 - $300,000 (fully loaded costs)

**Next Steps**:
1. Review and approve this plan
2. Assemble team
3. Set up project tracking
4. Begin Phase 1: Foundation

This plan ensures the Fleet Management System meets the standards of companies like Bloomberg, Microsoft, AWS, and other Fortune 50 enterprises.
