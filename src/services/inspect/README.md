# Universal Inspect/Drill-Down System

## Overview

The Universal Inspect/Drill-Down System provides a consistent, reusable way to view detailed information about entities across the Fleet Management application. It replaces ad-hoc modal implementations with a unified drawer-based interface.

## Architecture

### Core Components

1. **InspectContext** (`InspectContext.tsx`)
   - Provides global state management for inspect operations
   - Exposes `useInspect()` hook for accessing inspect functionality
   - Must wrap the application tree (already configured in `main.tsx`)

2. **InspectDrawer** (`InspectDrawer.tsx`)
   - The main UI component that renders the side drawer
   - Automatically opens when `openInspect()` is called
   - Uses shadcn/ui Sheet component for consistent styling

3. **InspectorRouter** (`InspectorRouter.tsx`)
   - Routes inspect targets to appropriate inspector components
   - Currently shows placeholders for all entity types
   - Will be expanded with actual inspectors in Phase 2

4. **Types** (`types.ts`)
   - Defines `InspectType` - supported entity types
   - Defines `InspectTarget` - the data structure for inspect operations

## Usage

### Opening an Inspect View

```typescript
import { useInspect } from "@/services/inspect/InspectContext";

function MyComponent() {
  const { openInspect } = useInspect();

  const handleViewDetails = () => {
    openInspect({
      type: "vehicle",
      id: "vehicle-123",
      tab: "maintenance",        // optional
      focusMetric: "fuel_cost"   // optional
    });
  };

  return <button onClick={handleViewDetails}>View Details</button>;
}
```

### Closing an Inspect View

```typescript
const { closeInspect } = useInspect();

closeInspect();
```

### Checking Current Inspect State

```typescript
const { target } = useInspect();

if (target) {
  console.log(`Currently inspecting ${target.type} with id ${target.id}`);
}
```

## Supported Entity Types

- `vehicle` - Vehicles in the fleet
- `driver` - Drivers/employees
- `trip` - Individual trips
- `route` - Route definitions
- `alert` - System alerts and notifications
- `task` - Work orders and tasks
- `dispatch` - Dispatch operations

## Integration Points

### Already Integrated

- ✅ `main.tsx` - InspectProvider wraps the app
- ✅ `App.tsx` - InspectDrawer component added

### Ready for Integration (Phase 2)

The following components should be updated to use the inspect system:

- Fleet Dashboard - vehicle cards
- GPS Tracking - map markers
- Vehicle Telemetry - metric charts
- Dispatch Console - dispatch items
- Driver Management - driver list
- Maintenance modules - work orders
- Real-time Event Hub - event items

## Adding New Inspectors (Phase 2)

To add a new inspector component:

1. Create inspector in `src/components/inspect/inspectors/`
   ```typescript
   // src/components/inspect/inspectors/VehicleInspector.tsx
   import { InspectTarget } from "@/services/inspect/types";

   export const VehicleInspector: React.FC<{ target: InspectTarget }> = ({ target }) => {
     // Fetch and display vehicle data
     return <div>Vehicle Inspector for {target.id}</div>;
   };
   ```

2. Update `InspectorRouter.tsx` to route to your inspector
   ```typescript
   case "vehicle":
     return <VehicleInspector target={target} />;
   ```

3. Add tab support if needed
   ```typescript
   const [activeTab, setActiveTab] = useState(target.tab || "overview");
   ```

## Testing

Use the `InspectTestButton` component to test the system:

```typescript
import { InspectTestButton } from "@/components/inspect/InspectTestButton";

function TestPage() {
  return <InspectTestButton />;
}
```

This button opens a test inspect view to verify the system is working.

## Design Principles

1. **Consistency** - All entity detail views use the same drawer interface
2. **Flexibility** - Support for tabs, focus metrics, and custom content
3. **Performance** - Lazy loading of inspector components
4. **Context-Aware** - Inspectors can access app-wide context
5. **Reusability** - Single implementation used everywhere

## Migration Path

### Phase 1: Foundation (Completed)
- ✅ Core context and provider
- ✅ Drawer component with routing
- ✅ Type definitions
- ✅ App integration

### Phase 2: Inspectors (Next)
- [ ] VehicleInspector
- [ ] DriverInspector
- [ ] TripInspector
- [ ] RouteInspector
- [ ] AlertInspector
- [ ] TaskInspector
- [ ] DispatchInspector

### Phase 3: Migration (Future)
- [ ] Update Fleet Dashboard
- [ ] Update GPS Tracking
- [ ] Update Vehicle Telemetry
- [ ] Update Dispatch Console
- [ ] Update Driver Management
- [ ] Update Maintenance modules
- [ ] Update Real-time Event Hub

## Benefits

1. **Reduced Code Duplication** - One drawer instead of many modals
2. **Better UX** - Consistent interaction patterns
3. **Easier Maintenance** - Single place to update inspect behavior
4. **Better Performance** - Shared component reduces bundle size
5. **Enhanced Features** - Easy to add global features like "Open in New Tab"

## Notes

- The system is designed to work alongside existing modals during migration
- Existing drilldown functionality will gradually be migrated to this system
- All inspector components should handle loading and error states
- Consider adding breadcrumb navigation for nested inspect operations
