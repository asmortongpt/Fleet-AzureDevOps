# Drilldown System Integration Examples

This document shows how to integrate drilldown functionality into existing pages.

## Quick Start

1. Import the drilldown helper hook:
```tsx
import { useDrilldownHelpers } from '@/hooks/use-drilldown-helpers'
```

2. Use the helpers in your component:
```tsx
function MyComponent() {
  const drilldown = useDrilldownHelpers()

  return (
    <div onClick={() => drilldown.openVehicleDetail('vehicle-123', 'Truck #42')}>
      Click to view vehicle details
    </div>
  )
}
```

## Integration Examples

### Vehicle List/Table Integration

```tsx
import { useDrilldownHelpers } from '@/hooks/use-drilldown-helpers'
import { Card } from '@/components/ui/card'

function VehicleList({ vehicles }) {
  const drilldown = useDrilldownHelpers()

  return (
    <div className="grid gap-4">
      {vehicles.map((vehicle) => (
        <Card
          key={vehicle.id}
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => drilldown.openVehicleDetail(vehicle.id, vehicle.name)}
        >
          <div className="p-4">
            <h3>{vehicle.name}</h3>
            <p>{vehicle.make} {vehicle.model}</p>
          </div>
        </Card>
      ))}
    </div>
  )
}
```

### Driver Performance Integration

```tsx
import { useDrilldownHelpers } from '@/hooks/use-drilldown-helpers'
import { Button } from '@/components/ui/button'

function DriverCard({ driver }) {
  const drilldown = useDrilldownHelpers()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{driver.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Button
            onClick={() => drilldown.openDriverDetail(driver.id, driver.name)}
            className="w-full"
          >
            View Profile
          </Button>
          <Button
            onClick={() => drilldown.openDriverPerformance(driver.id, driver.name)}
            variant="outline"
            className="w-full"
          >
            View Performance
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

### Maintenance Work Orders Integration

```tsx
import { useDrilldownHelpers } from '@/hooks/use-drilldown-helpers'
import { Badge } from '@/components/ui/badge'

function WorkOrderTable({ workOrders }) {
  const drilldown = useDrilldownHelpers()

  return (
    <table>
      <thead>
        <tr>
          <th>WO Number</th>
          <th>Status</th>
          <th>Vehicle</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {workOrders.map((wo) => (
          <tr
            key={wo.id}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => drilldown.openWorkOrderDetail(wo.id, wo.wo_number)}
          >
            <td>{wo.wo_number}</td>
            <td>
              <Badge>{wo.status}</Badge>
            </td>
            <td>{wo.vehicle_name}</td>
            <td>
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  drilldown.openWorkOrderDetail(wo.id, wo.wo_number)
                }}
              >
                View Details
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

### Facility Dashboard Integration

```tsx
import { useDrilldownHelpers } from '@/hooks/use-drilldown-helpers'

function FacilityDashboard({ facilities }) {
  const drilldown = useDrilldownHelpers()

  return (
    <div className="grid grid-cols-3 gap-4">
      {facilities.map((facility) => (
        <Card
          key={facility.id}
          className="cursor-pointer hover:shadow-lg"
          onClick={() => drilldown.openFacilityDetail(facility.id, facility.name)}
        >
          <CardHeader>
            <CardTitle>{facility.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {facility.current_vehicles} / {facility.capacity} vehicles
              </p>
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  drilldown.openFacilityVehicles(facility.id, facility.name)
                }}
                variant="outline"
                size="sm"
              >
                View Vehicles
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

### Map Marker Integration

```tsx
import { useDrilldownHelpers } from '@/hooks/use-drilldown-helpers'

function VehicleMapMarker({ vehicle }) {
  const drilldown = useDrilldownHelpers()

  return (
    <Marker
      position={[vehicle.lat, vehicle.lng]}
      eventHandlers={{
        click: () => {
          drilldown.openVehicleDetail(vehicle.id, vehicle.name)
        }
      }}
    >
      <Popup>
        <div>
          <h4>{vehicle.name}</h4>
          <Button
            size="sm"
            onClick={() => drilldown.openVehicleTrips(vehicle.id, vehicle.name)}
          >
            View Trips
          </Button>
        </div>
      </Popup>
    </Marker>
  )
}
```

## Available Drilldown Methods

### Vehicle Methods
- `openVehicleDetail(vehicleId, vehicleName)` - Open vehicle detail panel
- `openVehicleTrips(vehicleId, vehicleName)` - Open trip history
- `openTripTelemetry(tripId, trip?)` - Open trip telemetry details

### Driver Methods
- `openDriverDetail(driverId, driverName)` - Open driver profile
- `openDriverPerformance(driverId, driverName)` - Open performance metrics
- `openDriverTrips(driverId, driverName)` - Open driver trip history

### Maintenance Methods
- `openWorkOrderDetail(workOrderId, workOrderNumber)` - Open work order details
- `openWorkOrderParts(workOrderId, workOrderNumber)` - Open parts breakdown
- `openWorkOrderLabor(workOrderId, workOrderNumber)` - Open labor details

### Facility Methods
- `openFacilityDetail(facilityId, facilityName)` - Open facility details
- `openFacilityVehicles(facilityId, facilityName)` - Open facility vehicles list

## Advanced Usage

### Using Direct Context Access

If you need more control, you can use the drilldown context directly:

```tsx
import { useDrilldown } from '@/components/DrilldownManager'

function AdvancedComponent() {
  const { push, pop, reset, currentLevel, levels } = useDrilldown()

  const handleCustomDrilldown = () => {
    push({
      id: 'custom-view',
      type: 'custom',
      label: 'Custom View',
      data: { customData: 'value' }
    })
  }

  return (
    <div>
      <button onClick={handleCustomDrilldown}>Open Custom View</button>
      <button onClick={pop} disabled={!currentLevel}>Go Back</button>
      <button onClick={reset}>Close All</button>
      <p>Current depth: {levels.length}</p>
    </div>
  )
}
```

### Adding Drilldown to Custom Tables

```tsx
import { useDrilldownHelpers } from '@/hooks/use-drilldown-helpers'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

function DataTable({ data, type }) {
  const drilldown = useDrilldownHelpers()

  const handleRowClick = (row) => {
    switch (type) {
      case 'vehicles':
        drilldown.openVehicleDetail(row.id, row.name)
        break
      case 'drivers':
        drilldown.openDriverDetail(row.id, row.name)
        break
      case 'work-orders':
        drilldown.openWorkOrderDetail(row.id, row.wo_number)
        break
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow
            key={row.id}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => handleRowClick(row)}
          >
            <TableCell>{row.name}</TableCell>
            <TableCell>
              <Badge>{row.status}</Badge>
            </TableCell>
            <TableCell>
              <Button size="sm">View Details</Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

## Keyboard Shortcuts

The drilldown system supports keyboard shortcuts:
- **Esc** - Close all drilldown panels
- **Backspace** - Go back one level (when not in input field)

## Accessibility

All drilldown components include:
- ARIA labels and roles
- Keyboard navigation support
- Focus management
- Screen reader announcements

## Best Practices

1. **Always provide meaningful labels** - Use descriptive names for breadcrumb navigation
2. **Use helper hooks** - They provide type safety and consistency
3. **Handle loading states** - The DrilldownContent component handles this automatically
4. **Stop event propagation** - When nesting clickable elements, use `e.stopPropagation()`
5. **Test with keyboard** - Ensure all drilldown actions are keyboard accessible
