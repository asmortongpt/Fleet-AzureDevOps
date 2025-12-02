# Quick Start: Modern Fleet Dashboard

## Installation (3 Steps)

### Step 1: Import the CSS
Add to your main app file (e.g., `App.tsx` or `main.tsx`):

```tsx
import "@/styles/dashboard-layout.css"
```

### Step 2: Use the Modern Dashboard
Replace your current FleetDashboard import:

```tsx
// OLD
import { FleetDashboard } from "@/components/modules/FleetDashboard"

// NEW
import { FleetDashboardModern } from "@/components/modules/FleetDashboardModern"

// In your component
function FleetPage() {
  const data = useFleetData()

  return <FleetDashboardModern data={data} />
}
```

### Step 3: Verify Layout
Open your browser at 1920x1080 resolution and verify:
- ✅ No scrolling required
- ✅ All sections visible
- ✅ Stats bar shows 5 metrics
- ✅ Map and charts are side-by-side
- ✅ Footer shows connection status

## That's It!

The dashboard is fully functional with:
- Real-time updates
- Search and filtering
- Click-through navigation
- Responsive design
- Dark mode support

## Optional: Feature Flag Implementation

For gradual rollout:

```tsx
import { FleetDashboard } from "@/components/modules/FleetDashboard"
import { FleetDashboardModern } from "@/components/modules/FleetDashboardModern"

function FleetPage() {
  const data = useFleetData()
  const useModern = true // Change to false to revert

  return useModern
    ? <FleetDashboardModern data={data} />
    : <FleetDashboard data={data} />
}
```

## Component Reuse

Use individual components elsewhere:

```tsx
import { CompactMetricCard } from "@/components/dashboard/CompactMetricCard"
import { MiniChart } from "@/components/dashboard/MiniChart"
import { CompactVehicleList } from "@/components/dashboard/CompactVehicleList"
import { AlertsFeed } from "@/components/dashboard/AlertsFeed"

// Build custom dashboards
```

## Customization

### Change Colors
Edit `dashboard-layout.css`:
```css
:root {
  --grid-unit: 8px;  /* Change base spacing */
  --header-height: 60px;  /* Adjust header */
  /* etc. */
}
```

### Adjust Grid Layout
Modify `.dashboard-main-grid` in CSS:
```css
.dashboard-main-grid {
  grid-template-columns: 1.2fr 0.8fr; /* Change ratio */
}
```

## Troubleshooting

### Content is cut off
- Check viewport height is >= 1080px
- Verify all CSS is imported
- Check for conflicting styles

### Charts not showing
- Ensure data is being passed correctly
- Check console for errors
- Verify Framer Motion is installed

### Performance issues
- Virtual scrolling should handle 1000+ vehicles
- Check React DevTools profiler
- Verify memoization is working

## Support

See `DASHBOARD_REDESIGN_SUMMARY.md` for:
- Complete architecture details
- All component APIs
- Performance metrics
- Migration strategies
