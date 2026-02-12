# Operations Pages - Deprecated

**Date**: 2026-01-29
**Status**: Consolidated into Hub pages

---

## Migration Notice

The standalone Operations pages have been consolidated into their respective Hub pages for better UX consistency and maintainability.

### Files Moved to `/pages/deprecated/Operations/`

1. **Vehicles.tsx** → **FleetHub** (`/pages/FleetHub.tsx`)
   - Add as new "Vehicles" or "Vehicle Operations" tab
   - Provides CRUD interface for vehicle management

2. **Drivers.tsx** → **DriversHub** (`/pages/DriversHub.tsx`)
   - Enhance "Overview" tab or add new "Driver Management" tab
   - Provides inline driver CRUD operations

3. **Maintenance.tsx** → **MaintenanceHub** (`/pages/MaintenanceHub.tsx`)
   - Enhance "Garage" tab or add new "Tasks" tab
   - Provides operational task management with filtering

4. **Routes.tsx** → **OperationsHub** (`/pages/OperationsHub.tsx`)
   - **Replace existing "Routes" tab content**
   - Provides full route management with real API integration
   - **Priority: HIGH** - Ready for immediate integration

---

## Consolidation Benefits

✅ **Consistency**: All operations accessed through hub tabs
✅ **Fewer pages**: Reduced from 46 → 15 pages (67% reduction)
✅ **Better UX**: Context remains within hub ecosystem
✅ **Maintainability**: Single source of truth for each feature
✅ **Performance**: Better lazy loading and code splitting

---

## Implementation Guide

### Quick Start - Routes (Recommended First)

Replace OperationsHub Routes tab with Operations/Routes component:

```tsx
// In src/pages/OperationsHub.tsx
import { RoutesOperations } from '@/pages/deprecated/Operations/Routes'

// Update Routes tab in tabs array
{
  id: 'routes',
  label: 'Routes',
  icon: <MapTrifold className="h-4 w-4" />,
  content: (
    <ErrorBoundary>
      <Suspense fallback={<div className="p-6">Loading routes...</div>}>
        <RoutesOperations />
      </Suspense>
    </ErrorBoundary>
  ),
}
```

### Add Vehicles Tab to FleetHub

```tsx
// In src/pages/FleetHub.tsx
import { VehiclesOperations } from '@/pages/deprecated/Operations/Vehicles'

// Add to tabs array (e.g., after 'overview' tab)
{
  id: 'vehicles',
  label: 'Vehicle Operations',
  icon: <Car className="h-4 w-4" />,
  content: (
    <ErrorBoundary>
      <VehiclesOperations />
    </ErrorBoundary>
  ),
}
```

### Enhance DriversHub

```tsx
// In src/pages/DriversHub.tsx
import { DriversOperations } from '@/pages/deprecated/Operations/Drivers'

// Option 1: Add new tab
{
  id: 'management',
  label: 'Driver Management',
  icon: <User className="h-4 w-4" />,
  content: (
    <ErrorBoundary>
      <DriversOperations />
    </ErrorBoundary>
  ),
}

// Option 2: Replace 'overview' tab content
// (requires more careful integration)
```

### Enhance MaintenanceHub

```tsx
// In src/pages/MaintenanceHub.tsx
import { MaintenanceOperations } from '@/pages/deprecated/Operations/Maintenance'

// Option 1: Add new "Tasks" tab
{
  id: 'tasks',
  label: 'Tasks',
  icon: <ClipboardText className="h-4 w-4" />,
  content: (
    <ErrorBoundary>
      <MaintenanceOperations />
    </ErrorBoundary>
  ),
}

// Option 2: Replace/enhance 'garage' tab content
```

---

## Testing Checklist

After integrating any component:

- [ ] Component renders without errors
- [ ] API calls work correctly
- [ ] Create/Edit/Delete operations function
- [ ] Search and filtering work
- [ ] Loading states display properly
- [ ] Error handling works
- [ ] Toast notifications appear
- [ ] Mobile responsive
- [ ] Accessibility (keyboard navigation, ARIA labels)

---

## Rollback Plan

If issues arise, you can temporarily restore a page:

```bash
# Restore a specific page
cd /Users/andrewmorton/Documents/GitHub/Fleet-CTA/src/pages
cp deprecated/Operations/Routes.tsx Operations/

# Add route back to router
# Re-export from Operations/index.ts
```

---

## Full Report

See `/tmp/operations-consolidation-report.md` for:
- Detailed analysis of each page
- Line-by-line comparison with hub content
- Risk assessment
- Timeline estimates
- Testing plans

---

## Questions?

Contact the development team or refer to:
- `/tmp/page-consolidation-analysis.md` - Overall consolidation strategy
- `/tmp/operations-consolidation-report.md` - This consolidation's details
- CLAUDE.md - Project architecture and patterns
