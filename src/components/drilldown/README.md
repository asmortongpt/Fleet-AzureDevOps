# Fleet Management Drilldown System

A comprehensive multi-layer drilldown system for the Fleet Management application that enables users to navigate through hierarchical data with smooth animations and excellent UX.

## Overview

The drilldown system provides a consistent way to explore nested data across the application. It features:

- **4-level hierarchies** for vehicles, drivers, and maintenance
- **3-level hierarchy** for facilities
- **Smooth animations** using Framer Motion
- **Keyboard shortcuts** for navigation
- **WCAG 2.2 AA accessibility** compliance
- **Type-safe helpers** for easy integration
- **Responsive design** that works on all screen sizes

## Architecture

### Component Hierarchy

```
DrilldownManager (Root)
├── DrilldownProvider (Context)
├── DrilldownBreadcrumbs (Navigation)
└── DrilldownPanel (Container)
    └── DrilldownContent (Dynamic content router)
        ├── Vehicle Drilldowns
        │   ├── VehicleDetailPanel (Level 2)
        │   ├── VehicleTripsList (Level 3)
        │   └── TripTelemetryView (Level 4)
        ├── Driver Drilldowns
        │   ├── DriverDetailPanel (Level 2)
        │   ├── DriverPerformanceView (Level 3)
        │   └── DriverTripsView (Level 4)
        ├── Maintenance Drilldowns
        │   ├── WorkOrderDetailPanel (Level 2)
        │   ├── PartsBreakdownView (Level 3)
        │   └── LaborDetailsView (Level 3)
        └── Facility Drilldowns
            ├── FacilityDetailPanel (Level 2)
            └── FacilityVehiclesView (Level 3)
```

## Drilldown Paths

### Vehicle Drilldown (4 levels)
1. **Fleet List** → Click vehicle card
2. **Vehicle Details** → Shows status, info, stats → Click "View Trips"
3. **Trip History** → List of trips → Click trip
4. **Telemetry Data** → GPS points, speed, fuel consumption

### Driver Drilldown (4 levels)
1. **Drivers List** → Click driver row
2. **Driver Profile** → Stats, certifications → Click "Performance"
3. **Performance Metrics** → Safety, efficiency scores → Click "Trips"
4. **Individual Trips** → Trip details with incidents

### Maintenance Drilldown (4 levels)
1. **Work Orders List** → Click work order
2. **Work Order Details** → Overview, timeline → Click "Parts" or "Labor"
3. **Parts/Labor Breakdown** → Detailed breakdown → Click item
4. **Item History** → Historical data and costs

### Facility Drilldown (3 levels)
1. **Facilities List** → Click facility card
2. **Facility Details** → Capacity, utilization → Click "Vehicles"
3. **Facility Vehicles** → List with utilization metrics

## Installation

The drilldown system is already integrated into the app via `App.tsx`. No additional setup required.

## Usage

### Basic Usage

```tsx
import { useDrilldownHelpers } from '@/hooks/use-drilldown-helpers'

function VehicleCard({ vehicle }) {
  const drilldown = useDrilldownHelpers()

  return (
    <Card onClick={() => drilldown.openVehicleDetail(vehicle.id, vehicle.name)}>
      <CardContent>
        <h3>{vehicle.name}</h3>
        <p>{vehicle.status}</p>
      </CardContent>
    </Card>
  )
}
```

### Advanced Usage

```tsx
import { useDrilldown } from '@/components/DrilldownManager'

function CustomComponent() {
  const { push, pop, reset, currentLevel, levels, canGoBack } = useDrilldown()

  const openCustomView = () => {
    push({
      id: 'custom-123',
      type: 'custom-type',
      label: 'Custom View',
      data: { anyData: 'you need' }
    })
  }

  return (
    <div>
      <button onClick={openCustomView}>Open</button>
      <button onClick={pop} disabled={!canGoBack}>Back</button>
      <button onClick={reset}>Close All</button>
      <span>Depth: {levels.length}</span>
    </div>
  )
}
```

## API Reference

### useDrilldownHelpers()

Convenience hook with pre-configured methods for all drilldown types.

#### Vehicle Methods
- `openVehicleDetail(vehicleId: string, vehicleName: string)` - Open vehicle details
- `openVehicleTrips(vehicleId: string, vehicleName: string)` - Open trip history
- `openTripTelemetry(tripId: string, trip?: any)` - Open telemetry data

#### Driver Methods
- `openDriverDetail(driverId: string, driverName: string)` - Open driver profile
- `openDriverPerformance(driverId: string, driverName: string)` - Open performance
- `openDriverTrips(driverId: string, driverName: string)` - Open trip history

#### Maintenance Methods
- `openWorkOrderDetail(workOrderId: string, workOrderNumber: string)` - Open work order
- `openWorkOrderParts(workOrderId: string, workOrderNumber: string)` - Open parts
- `openWorkOrderLabor(workOrderId: string, workOrderNumber: string)` - Open labor

#### Facility Methods
- `openFacilityDetail(facilityId: string, facilityName: string)` - Open facility
- `openFacilityVehicles(facilityId: string, facilityName: string)` - Open vehicles

### useDrilldown()

Low-level hook for direct context access.

#### Properties
- `levels: DrilldownLevel[]` - Array of all drilldown levels
- `currentLevel: DrilldownLevel | null` - Currently active level
- `canGoBack: boolean` - Whether user can navigate back
- `canGoForward: boolean` - Whether forward navigation is available

#### Methods
- `push(level: Omit<DrilldownLevel, 'timestamp'>)` - Add new level
- `pop()` - Remove current level (go back one)
- `reset()` - Clear all levels (close panel)
- `goToLevel(index: number)` - Jump to specific level

### DrilldownLevel Interface

```typescript
interface DrilldownLevel {
  id: string          // Unique identifier
  type: string        // Type for routing to correct component
  label: string       // Display name in breadcrumbs
  data: any          // Arbitrary data passed to component
  timestamp: number  // Auto-added timestamp
}
```

## Components

### DrilldownPanel

Main container for drilldown content with animations.

**Features:**
- Slide-in animation from right
- Backdrop with click-to-close
- Keyboard shortcuts (Esc, Backspace)
- Body scroll lock when open
- Responsive width (full on mobile, 2/3 on tablet, 1/2 on desktop)

### DrilldownBreadcrumbs

Navigation breadcrumbs showing current path.

**Features:**
- Clickable levels for quick navigation
- Home button to reset
- Auto-hides when no drilldown active
- ARIA labels for accessibility

### DrilldownContent

Helper component for loading/error states.

**Props:**
- `loading?: boolean` - Show loading spinner
- `error?: Error | null` - Show error message
- `onRetry?: () => void` - Retry callback
- `children: React.ReactNode` - Content when loaded

**Usage:**
```tsx
<DrilldownContent loading={isLoading} error={error} onRetry={() => mutate()}>
  {data && <YourContent data={data} />}
</DrilldownContent>
```

## Data Fetching

All drilldown components use SWR for data fetching:

```tsx
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function MyDrilldown({ id }) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/resource/${id}`,
    fetcher
  )

  return (
    <DrilldownContent loading={isLoading} error={error} onRetry={() => mutate()}>
      {data && <div>{data.name}</div>}
    </DrilldownContent>
  )
}
```

## Keyboard Shortcuts

- **Esc** - Close all drilldown panels
- **Backspace** - Go back one level (when not in input field)

## Accessibility

All components are WCAG 2.2 AA compliant:

- ✅ Keyboard navigation support
- ✅ ARIA labels and roles
- ✅ Focus management
- ✅ Screen reader announcements
- ✅ High contrast support
- ✅ Reduced motion support (via Framer Motion)

## Styling

Uses Tailwind CSS with shadcn/ui components:

- Consistent with app theme
- Dark mode support
- Responsive breakpoints
- Custom animations via Framer Motion

## Performance

- Lazy data loading (only fetches when drilldown opens)
- Efficient re-renders (memoized context values)
- Smooth animations (GPU-accelerated)
- Automatic cleanup on unmount

## Testing

To test drilldowns:

1. Navigate to any list view (vehicles, drivers, etc.)
2. Click on an item to open Level 2
3. Click action buttons to drill deeper
4. Use breadcrumbs to navigate back
5. Press Esc to close
6. Test keyboard navigation

## Troubleshooting

### Drilldown doesn't open
- Ensure `DrilldownManager` wraps your app
- Check that you're calling the correct helper method
- Verify the ID and name parameters are correct

### Data not loading
- Check API endpoint URLs
- Verify SWR fetcher function
- Check browser console for errors
- Ensure backend routes exist

### Animations choppy
- Check if reduced motion is enabled
- Verify Framer Motion is installed
- Check for CSS conflicts

### Keyboard shortcuts not working
- Ensure DrilldownPanel is mounted
- Check if focus is in an input field
- Verify no other components are preventing default

## Future Enhancements

Potential improvements:

- [ ] Forward navigation history
- [ ] Persistent drilldown state in URL
- [ ] Customizable panel width
- [ ] Multiple simultaneous panels
- [ ] Swipe gestures on mobile
- [ ] Print view for drilldown content
- [ ] Export drilldown data
- [ ] Bookmarkable drilldown paths

## Contributing

When adding new drilldown types:

1. Create component in `/src/components/drilldown/`
2. Add type handler to `DrilldownManager`
3. Add helper method to `useDrilldownHelpers`
4. Export from `index.ts`
5. Update this README
6. Add integration examples

## License

Part of the Fleet Management application.
