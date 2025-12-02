# Drilldown System - Quick Start Guide

## 🚀 5-Minute Integration

### Step 1: Import the Helper Hook

```tsx
import { useDrilldownHelpers } from '@/hooks/use-drilldown-helpers'
```

### Step 2: Use in Your Component

```tsx
function MyComponent() {
  const drilldown = useDrilldownHelpers()

  // Your component code
}
```

### Step 3: Add Click Handlers

```tsx
// Vehicle drilldown
<Card onClick={() => drilldown.openVehicleDetail(vehicle.id, vehicle.name)}>
  {vehicle.name}
</Card>

// Driver drilldown
<Row onClick={() => drilldown.openDriverDetail(driver.id, driver.name)}>
  {driver.name}
</Row>

// Work order drilldown
<Cell onClick={() => drilldown.openWorkOrderDetail(wo.id, wo.wo_number)}>
  WO #{wo.wo_number}
</Cell>

// Facility drilldown
<Card onClick={() => drilldown.openFacilityDetail(facility.id, facility.name)}>
  {facility.name}
</Card>
```

## 📋 Available Methods

### Vehicles
```tsx
drilldown.openVehicleDetail(vehicleId, vehicleName)
drilldown.openVehicleTrips(vehicleId, vehicleName)
drilldown.openTripTelemetry(tripId, trip?)
```

### Drivers
```tsx
drilldown.openDriverDetail(driverId, driverName)
drilldown.openDriverPerformance(driverId, driverName)
drilldown.openDriverTrips(driverId, driverName)
```

### Maintenance
```tsx
drilldown.openWorkOrderDetail(workOrderId, workOrderNumber)
drilldown.openWorkOrderParts(workOrderId, workOrderNumber)
drilldown.openWorkOrderLabor(workOrderId, workOrderNumber)
```

### Facilities
```tsx
drilldown.openFacilityDetail(facilityId, facilityName)
drilldown.openFacilityVehicles(facilityId, facilityName)
```

## 🎯 Common Patterns

### Table Row Click

```tsx
<TableRow
  className="cursor-pointer hover:bg-muted/50"
  onClick={() => drilldown.openVehicleDetail(row.id, row.name)}
>
  <TableCell>{row.name}</TableCell>
  <TableCell>{row.status}</TableCell>
</TableRow>
```

### Card Click

```tsx
<Card
  className="cursor-pointer hover:shadow-lg transition-shadow"
  onClick={() => drilldown.openDriverDetail(driver.id, driver.name)}
>
  <CardHeader>
    <CardTitle>{driver.name}</CardTitle>
  </CardHeader>
  <CardContent>
    <p>{driver.role}</p>
  </CardContent>
</Card>
```

### Button Click

```tsx
<Button onClick={() => drilldown.openWorkOrderDetail(wo.id, wo.wo_number)}>
  View Work Order
</Button>
```

### Map Marker Click

```tsx
<Marker
  position={[vehicle.lat, vehicle.lng]}
  eventHandlers={{
    click: () => drilldown.openVehicleDetail(vehicle.id, vehicle.name)
  }}
/>
```

### Nested Clicks (Stop Propagation)

```tsx
<Card onClick={() => drilldown.openVehicleDetail(vehicle.id, vehicle.name)}>
  <CardHeader>
    <CardTitle>{vehicle.name}</CardTitle>
  </CardHeader>
  <CardContent>
    <Button
      onClick={(e) => {
        e.stopPropagation() // Prevent card click
        drilldown.openVehicleTrips(vehicle.id, vehicle.name)
      }}
    >
      View Trips
    </Button>
  </CardContent>
</Card>
```

## ⌨️ Keyboard Shortcuts

- **Esc** - Close all panels
- **Backspace** - Go back one level

## 📍 File Locations

- **Components**: `/src/components/drilldown/`
- **Helper Hook**: `/src/hooks/use-drilldown-helpers.ts`
- **Context**: `/src/contexts/DrilldownContext.tsx`
- **Manager**: `/src/components/DrilldownManager.tsx`
- **Documentation**: `/src/components/drilldown/README.md`

## 🔧 API Endpoints Needed

Ensure these endpoints exist in your backend:

```
GET /api/vehicles/:id
GET /api/vehicles/:id/trips
GET /api/trips/:id/telemetry
GET /api/drivers/:id
GET /api/drivers/:id/performance
GET /api/drivers/:id/trips
GET /api/work-orders/:id
GET /api/work-orders/:id/parts
GET /api/work-orders/:id/labor
GET /api/facilities/:id
GET /api/facilities/:id/vehicles
```

## ✅ Integration Checklist

- [ ] Import `useDrilldownHelpers` hook
- [ ] Add click handlers to clickable elements
- [ ] Test drilldown opens correctly
- [ ] Verify data loads from API
- [ ] Test breadcrumb navigation
- [ ] Test keyboard shortcuts
- [ ] Test on mobile/tablet/desktop
- [ ] Verify accessibility with keyboard-only navigation

## 🐛 Troubleshooting

**Panel doesn't open?**
- Check DrilldownManager wraps your app (it does!)
- Verify correct method is called
- Check console for errors

**Data doesn't load?**
- Verify API endpoint exists
- Check network tab in DevTools
- Verify ID parameter is correct

**Need help?**
- See `/src/components/drilldown/README.md` for full docs
- See `/src/components/drilldown/INTEGRATION_EXAMPLES.md` for examples
- Check existing implementations in the codebase

## 📚 Resources

- **Full Documentation**: `/src/components/drilldown/README.md`
- **Integration Examples**: `/src/components/drilldown/INTEGRATION_EXAMPLES.md`
- **Implementation Summary**: `/DRILLDOWN_IMPLEMENTATION_SUMMARY.md`

## 🎉 You're Ready!

Start adding drilldowns to your components now. It's as simple as:

```tsx
import { useDrilldownHelpers } from '@/hooks/use-drilldown-helpers'

const drilldown = useDrilldownHelpers()

<div onClick={() => drilldown.openVehicleDetail(id, name)}>
  Click me!
</div>
```
