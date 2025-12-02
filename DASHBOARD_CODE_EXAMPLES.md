# Dashboard Code Examples & Best Practices

## Table of Contents
1. [Basic Usage](#basic-usage)
2. [Component Examples](#component-examples)
3. [Custom Layouts](#custom-layouts)
4. [Integration Patterns](#integration-patterns)
5. [Performance Tips](#performance-tips)
6. [Common Pitfalls](#common-pitfalls)

---

## Basic Usage

### Simple Implementation
```tsx
import { FleetDashboardModern } from "@/components/modules/FleetDashboardModern"
import { useFleetData } from "@/hooks/use-fleet-data"
import "@/styles/dashboard-layout.css"

export function FleetPage() {
  const data = useFleetData()
  return <FleetDashboardModern data={data} />
}
```

### With Feature Flag
```tsx
import { FleetDashboard } from "@/components/modules/FleetDashboard"
import { FleetDashboardModern } from "@/components/modules/FleetDashboardModern"
import { useFleetData } from "@/hooks/use-fleet-data"
import { useFeatureFlag } from "@/hooks/useFeatureFlag"

export function FleetPage() {
  const data = useFleetData()
  const useModernDashboard = useFeatureFlag('modern-dashboard')

  return useModernDashboard
    ? <FleetDashboardModern data={data} />
    : <FleetDashboard data={data} />
}
```

### With Loading State
```tsx
import { FleetDashboardModern } from "@/components/modules/FleetDashboardModern"
import { useFleetData } from "@/hooks/use-fleet-data"
import { LoadingSpinner } from "@/components/LoadingSpinner"

export function FleetPage() {
  const data = useFleetData()

  if (data.loading) {
    return <LoadingSpinner message="Loading fleet data..." />
  }

  if (data.error) {
    return <ErrorMessage error={data.error} />
  }

  return <FleetDashboardModern data={data} />
}
```

---

## Component Examples

### CompactMetricCard

#### Basic Metric
```tsx
import { CompactMetricCard } from "@/components/dashboard/CompactMetricCard"
import { Car } from "@phosphor-icons/react"

<CompactMetricCard
  title="Total Vehicles"
  value={150}
  icon={<Car className="w-5 h-5" />}
  status="info"
/>
```

#### With Trend
```tsx
<CompactMetricCard
  title="Active Vehicles"
  value={127}
  change={5.2}
  trend="up"
  subtitle="on the road"
  icon={<Pulse className="w-5 h-5" />}
  status="success"
/>
```

#### With Click Handler
```tsx
<CompactMetricCard
  title="Service Required"
  value={12}
  change={3}
  trend="up"
  subtitle="needs attention"
  icon={<Wrench className="w-5 h-5" />}
  status="warning"
  onClick={() => {
    console.log('Navigate to service dashboard')
    // Navigate or open modal
  }}
/>
```

#### Custom Styling
```tsx
<CompactMetricCard
  title="Custom Metric"
  value="87%"
  icon={<Activity className="w-5 h-5" />}
  status="success"
  className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900"
/>
```

### MiniChart

#### Sparkline Chart
```tsx
import { MiniChart } from "@/components/dashboard/MiniChart"

const fuelData = [
  { label: "00:00", value: 75 },
  { label: "04:00", value: 72 },
  { label: "08:00", value: 68 },
  { label: "12:00", value: 65 },
  { label: "16:00", value: 70 },
  { label: "20:00", value: 73 },
]

<MiniChart
  title="Fuel Trend (24h)"
  data={fuelData}
  type="sparkline"
  color="green"
  currentValue="73%"
/>
```

#### Bar Chart
```tsx
const regionData = [
  { label: "North", value: 45 },
  { label: "South", value: 38 },
  { label: "East", value: 32 },
  { label: "West", value: 35 },
]

<MiniChart
  title="Regional Distribution"
  data={regionData}
  type="bar"
  color="blue"
  currentValue="4 regions"
/>
```

#### Line Chart
```tsx
const utilizationData = Array.from({ length: 7 }, (_, i) => ({
  label: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
  value: 60 + Math.random() * 30
}))

<MiniChart
  title="Utilization Rate"
  data={utilizationData}
  type="line"
  color="purple"
  currentValue="87%"
/>
```

#### Donut Chart
```tsx
import { MiniDonutChart } from "@/components/dashboard/MiniChart"

const statusData = [
  { label: "Active", value: 127, color: "bg-green-500" },
  { label: "Idle", value: 23, color: "bg-gray-500" },
  { label: "Charging", value: 15, color: "bg-blue-500" },
  { label: "Service", value: 8, color: "bg-amber-500" },
]

<MiniDonutChart
  title="Fleet Status"
  data={statusData}
  total={173}
/>
```

### CompactVehicleList

#### Basic List
```tsx
import { CompactVehicleList } from "@/components/dashboard/CompactVehicleList"

<CompactVehicleList
  vehicles={vehicles}
  onVehicleClick={(vehicle) => {
    console.log('Vehicle clicked:', vehicle)
    // Navigate or open details
  }}
  showRealtimeIndicator={true}
/>
```

#### With Max Height
```tsx
<CompactVehicleList
  vehicles={vehicles}
  maxHeight="400px"
  onVehicleClick={handleVehicleClick}
/>
```

#### Mini Version
```tsx
import { CompactVehicleListMini } from "@/components/dashboard/CompactVehicleList"

<CompactVehicleListMini
  vehicles={vehicles}
  maxItems={5}
  onVehicleClick={handleVehicleClick}
/>
```

### AlertsFeed

#### Full Alerts Feed
```tsx
import { AlertsFeed } from "@/components/dashboard/AlertsFeed"

const alerts = [
  {
    id: '1',
    type: 'critical',
    title: 'Low Battery Warning',
    message: 'Vehicle battery level critically low.',
    vehicleName: 'TRK-001',
    timestamp: new Date(),
    isRead: false
  },
  // ... more alerts
]

<AlertsFeed
  alerts={alerts}
  onAlertClick={(alert) => {
    console.log('Alert clicked:', alert)
    // Mark as read, show details
  }}
  showTimestamp={true}
/>
```

#### Activity Feed
```tsx
import { ActivityFeed } from "@/components/dashboard/AlertsFeed"

const activities = [
  {
    id: '1',
    type: 'vehicle:update',
    vehicleId: 'v123',
    vehicleName: 'TRK-001',
    description: 'Location updated',
    timestamp: new Date()
  },
  // ... more activities
]

<ActivityFeed
  activities={activities}
  maxHeight="300px"
  maxItems={10}
/>
```

---

## Custom Layouts

### Custom Stats Bar
```tsx
import { CompactMetricCard } from "@/components/dashboard/CompactMetricCard"
import "@/styles/dashboard-layout.css"

function CustomStatsBar() {
  return (
    <div className="dashboard-stats-bar">
      <CompactMetricCard title="Metric 1" value={100} icon={<Icon1 />} />
      <CompactMetricCard title="Metric 2" value={200} icon={<Icon2 />} />
      <CompactMetricCard title="Metric 3" value={300} icon={<Icon3 />} />
      {/* Add more as needed */}
    </div>
  )
}
```

### Custom Grid Layout
```tsx
function CustomDashboard() {
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        {/* Header content */}
      </div>

      <div className="dashboard-stats-bar">
        {/* Metrics */}
      </div>

      {/* Custom 3-column grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '16px',
        padding: '16px 24px',
        overflow: 'hidden'
      }}>
        <div className="compact-card">Column 1</div>
        <div className="compact-card">Column 2</div>
        <div className="compact-card">Column 3</div>
      </div>

      <div className="dashboard-footer">
        {/* Footer content */}
      </div>
    </div>
  )
}
```

### Hybrid Layout (Old + New)
```tsx
import { FleetDashboard } from "@/components/modules/FleetDashboard"
import { CompactMetricCard } from "@/components/dashboard/CompactMetricCard"

function HybridDashboard({ data }) {
  return (
    <div>
      {/* New metrics bar */}
      <div className="dashboard-stats-bar mb-4">
        <CompactMetricCard title="Total" value={data.total} />
        <CompactMetricCard title="Active" value={data.active} />
      </div>

      {/* Old dashboard (with modifications) */}
      <FleetDashboard data={data} />
    </div>
  )
}
```

---

## Integration Patterns

### With React Query
```tsx
import { useQuery } from '@tanstack/react-query'
import { FleetDashboardModern } from "@/components/modules/FleetDashboardModern"

function FleetPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['fleet-data'],
    queryFn: fetchFleetData,
    refetchInterval: 5000 // Real-time updates every 5s
  })

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />

  return <FleetDashboardModern data={data} />
}
```

### With Redux
```tsx
import { useSelector, useDispatch } from 'react-redux'
import { FleetDashboardModern } from "@/components/modules/FleetDashboardModern"

function FleetPage() {
  const vehicles = useSelector(state => state.fleet.vehicles)
  const facilities = useSelector(state => state.fleet.facilities)
  const dispatch = useDispatch()

  const data = {
    vehicles,
    facilities,
    addVehicle: (vehicle) => dispatch(addVehicle(vehicle)),
    // ... other methods
  }

  return <FleetDashboardModern data={data} />
}
```

### With WebSocket
```tsx
import { useWebSocket } from '@/hooks/useWebSocket'
import { FleetDashboardModern } from "@/components/modules/FleetDashboardModern"

function FleetPage() {
  const [vehicles, setVehicles] = useState([])

  const { status, lastMessage } = useWebSocket('ws://api.example.com/fleet', {
    onMessage: (message) => {
      if (message.type === 'vehicle_update') {
        setVehicles(prev => updateVehicle(prev, message.data))
      }
    }
  })

  const data = { vehicles, facilities, addVehicle }

  return <FleetDashboardModern data={data} />
}
```

---

## Performance Tips

### Memoize Expensive Calculations
```tsx
import { useMemo } from 'react'

function FleetPage() {
  const vehicles = useVehicles()

  // ✅ Good - Memoized
  const metrics = useMemo(() => ({
    total: vehicles.length,
    active: vehicles.filter(v => v.status === 'active').length,
    // ... other calculations
  }), [vehicles])

  // ❌ Bad - Recalculated on every render
  const metrics = {
    total: vehicles.length,
    active: vehicles.filter(v => v.status === 'active').length,
  }

  return <FleetDashboardModern data={{ vehicles, metrics }} />
}
```

### Use Callback for Event Handlers
```tsx
import { useCallback } from 'react'

function FleetPage() {
  // ✅ Good - Stable reference
  const handleVehicleClick = useCallback((vehicle) => {
    console.log('Vehicle clicked:', vehicle)
  }, [])

  // ❌ Bad - New function on every render
  const handleVehicleClick = (vehicle) => {
    console.log('Vehicle clicked:', vehicle)
  }

  return <CompactVehicleList onVehicleClick={handleVehicleClick} />
}
```

### Lazy Load Heavy Components
```tsx
import { lazy, Suspense } from 'react'

const FleetDashboardModern = lazy(() =>
  import("@/components/modules/FleetDashboardModern")
)

function FleetPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <FleetDashboardModern data={data} />
    </Suspense>
  )
}
```

### Virtual Scrolling is Built-In
```tsx
// CompactVehicleList already implements virtual scrolling
// No additional configuration needed for 1000+ items

<CompactVehicleList
  vehicles={thousandsOfVehicles} // Handles efficiently
  onVehicleClick={handleClick}
/>
```

---

## Common Pitfalls

### ❌ Don't: Inline Styles for Layout
```tsx
// Bad - Breaks responsive design
<div style={{ height: '800px', width: '1920px' }}>
  <FleetDashboardModern data={data} />
</div>
```

### ✅ Do: Use CSS Classes
```tsx
// Good - Responsive and maintainable
<div className="dashboard-container">
  <FleetDashboardModern data={data} />
</div>
```

### ❌ Don't: Mutate Data Directly
```tsx
// Bad - Causes rendering issues
const addVehicle = (vehicle) => {
  data.vehicles.push(vehicle) // Mutation!
}
```

### ✅ Do: Use Immutable Updates
```tsx
// Good - Triggers re-render correctly
const addVehicle = (vehicle) => {
  setVehicles(prev => [...prev, vehicle])
}
```

### ❌ Don't: Forget to Import CSS
```tsx
// Bad - Layout won't work
import { FleetDashboardModern } from "@/components/modules/FleetDashboardModern"

function App() {
  return <FleetDashboardModern data={data} />
}
```

### ✅ Do: Import CSS in Root
```tsx
// Good - In App.tsx or main.tsx
import "@/styles/dashboard-layout.css"
import { FleetDashboardModern } from "@/components/modules/FleetDashboardModern"

function App() {
  return <FleetDashboardModern data={data} />
}
```

### ❌ Don't: Override Fixed Heights
```tsx
// Bad - Breaks no-scroll layout
.dashboard-container {
  height: auto !important; /* Breaks layout */
}
```

### ✅ Do: Customize Within Constraints
```tsx
// Good - Adjust variables
:root {
  --header-height: 72px; /* Taller header */
  --stats-bar-height: 120px; /* More space for metrics */
}
```

---

## Advanced Patterns

### Custom Theme Colors
```css
/* In dashboard-layout.css or custom CSS file */
:root {
  --dashboard-accent: #3b82f6;
  --dashboard-success: #10b981;
  --dashboard-warning: #f59e0b;
  --dashboard-error: #ef4444;
}

.metric-icon-container.status-info {
  background: var(--dashboard-accent);
}
```

### Conditional Rendering
```tsx
function AdaptiveDashboard({ data, viewport }) {
  // Show different layout based on screen size
  if (viewport.width < 1600) {
    return <CompactDashboard data={data} />
  }

  return <FleetDashboardModern data={data} />
}
```

### Custom Metrics Grid
```tsx
// 6 metrics instead of 5
<div className="dashboard-stats-bar" style={{
  gridTemplateColumns: 'repeat(6, 1fr)'
}}>
  <CompactMetricCard title="Metric 1" value={1} />
  <CompactMetricCard title="Metric 2" value={2} />
  <CompactMetricCard title="Metric 3" value={3} />
  <CompactMetricCard title="Metric 4" value={4} />
  <CompactMetricCard title="Metric 5" value={5} />
  <CompactMetricCard title="Metric 6" value={6} />
</div>
```

### Dashboard Presets
```tsx
type DashboardPreset = 'manager' | 'analyst' | 'operations'

function FleetPage({ preset }: { preset: DashboardPreset }) {
  const config = useMemo(() => {
    switch (preset) {
      case 'manager':
        return { showCharts: true, showAlerts: true, showMap: false }
      case 'analyst':
        return { showCharts: true, showAlerts: false, showMap: false }
      case 'operations':
        return { showCharts: false, showAlerts: true, showMap: true }
    }
  }, [preset])

  return <CustomDashboard config={config} data={data} />
}
```

---

## Testing Examples

### Unit Test
```tsx
import { render, screen } from '@testing-library/react'
import { CompactMetricCard } from '@/components/dashboard/CompactMetricCard'

describe('CompactMetricCard', () => {
  it('renders metric value', () => {
    render(<CompactMetricCard title="Test" value={100} />)
    expect(screen.getByText('100')).toBeInTheDocument()
  })

  it('shows trend indicator', () => {
    render(<CompactMetricCard title="Test" value={100} change={5} trend="up" />)
    expect(screen.getByText('5%')).toBeInTheDocument()
  })
})
```

### Integration Test
```tsx
import { render, screen, waitFor } from '@testing-library/react'
import { FleetDashboardModern } from '@/components/modules/FleetDashboardModern'

describe('FleetDashboardModern', () => {
  it('renders all sections', async () => {
    const mockData = { vehicles: [], facilities: [] }

    render(<FleetDashboardModern data={mockData} />)

    await waitFor(() => {
      expect(screen.getByText('Fleet Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Total Vehicles')).toBeInTheDocument()
    })
  })
})
```

---

## Conclusion

This dashboard system provides:

✅ **Professional Design**: Enterprise-grade layouts
✅ **High Performance**: Virtual scrolling, memoization
✅ **Full Customization**: CSS variables, component props
✅ **Type Safety**: Full TypeScript support
✅ **Accessibility**: WCAG AAA compliance
✅ **Maintainability**: Modular, reusable components

Follow these examples and patterns for best results!
