# Demo Walkthrough Setup Guide

## Quick Start for Demo Mode

The Fleet Management System now includes automatic demo mode with realistic mock data for demonstrations and walkthroughs when the API backend is not available.

### Automatic Demo Mode

Demo mode activates automatically when:
1. The API backend is not running or unavailable
2. You manually enable demo mode in browser console

### How Demo Mode Works

When demo mode is active, the application uses realistic mock data including:
- **50 Vehicles** across 5 major US cities (NYC, LA, Chicago, Atlanta, Seattle)
- **5 Facilities** (depots and service centers)
- **30 Drivers** with realistic profiles
- **30 Work Orders** with various statuses
- **100 Fuel Transactions** spanning 90 days
- **15 Routes** including in-progress and completed routes

### Enabling Demo Mode Manually

If you want to force demo mode (even when API is available):

```javascript
// In browser console
localStorage.setItem('demo_mode', 'true')
window.location.reload()
```

### Disabling Demo Mode

```javascript
// In browser console
localStorage.removeItem('demo_mode')
window.location.reload()
```

### Checking Demo Mode Status

Look for this console message when the app loads:
```
📊 Using demo data for walkthrough (API unavailable or demo mode active)
✅ Demo data initialized - 50 vehicles, 5 facilities, 30 drivers ready for walkthrough
```

## Demo Walkthrough Features

### Maps with Live Data

1. **GPS Tracking** - Navigate to GPS Tracking module
   - See all 50 vehicles plotted on the map across 5 cities
   - Vehicles show different statuses (active, idle, charging, service, emergency)
   - Click vehicle markers for detailed popups

2. **GIS Command Center** - Full map view with facilities
   - All 5 facility locations displayed
   - Vehicle distribution across facilities
   - Interactive map controls

### Working Features in Demo Mode

All these modules work with demo data:
- ✅ Fleet Dashboard - Overview metrics and charts
- ✅ GPS Tracking - Live vehicle locations on map
- ✅ Route Management - 15 sample routes
- ✅ Fuel Management - 100 fuel transactions
- ✅ Driver Performance - 30 driver profiles
- ✅ Work Orders - 30 maintenance orders
- ✅ Fleet Analytics - Charts and reports
- ✅ GIS Command Center - Interactive mapping

### Demo Data Distribution

**Vehicles by City:**
- New York: 10 vehicles (NYC-1001 to NYC-1010)
- Los Angeles: 10 vehicles (LOS-1011 to LOS-1020)
- Chicago: 10 vehicles (CHI-1021 to CHI-1030)
- Atlanta: 10 vehicles (ATL-1031 to ATL-1040)
- Seattle: 10 vehicles (SEA-1041 to SEA-1050)

**Vehicle Types:**
- Sedans (Honda Accord, Toyota Camry, Tesla Model 3)
- SUVs (Ford Explorer, Toyota Highlander)
- Trucks (Ford F-150, Chevy Silverado, Ram 1500)
- Vans (Mercedes Sprinter, Ford Transit, Dodge ProMaster)

**Facilities:**
1. HQ Depot - New York (8 service bays, 15 capacity)
2. West Coast Hub - Los Angeles (6 bays, 10 capacity)
3. Central Operations - Chicago (5 bays, 10 capacity)
4. East Service Center - Atlanta (4 bays, 8 capacity)
5. Northwest Facility - Seattle (5 bays, 7 capacity)

## Troubleshooting

### Maps Not Showing Vehicles

If maps load but show no vehicles:
1. Check browser console for demo mode message
2. Force enable demo mode (see above)
3. Refresh the page
4. Check that GPS Tracking module is loaded

### No Data in Dashboard

If dashboard shows zero metrics:
1. Open browser console
2. Check for API errors (red text)
3. Enable demo mode manually
4. Refresh the page

### API Errors

If you see API connection errors but want to use the app:
- Demo mode should activate automatically
- If not, manually enable it (see above)
- The app will work fully with realistic demo data

## Technical Details

### Demo Data Location
- Source: `/src/lib/demo-data.ts`
- Hook: `/src/hooks/use-fleet-data.ts`

### How It Works
1. App attempts to fetch data from API
2. If API fails or returns no data, demo mode activates
3. Mock data is generated once and cached in component state
4. All modules receive demo data through the same `useFleetData` hook

### Production vs Demo

The app seamlessly switches between modes:
- **Production**: Uses real API endpoints
- **Demo**: Uses generated mock data
- **Hybrid**: Falls back to demo if API unavailable

No code changes needed - it just works!

## Running the Full Demo Walkthrough

Follow the [DEMO_GUIDE.md](./docs/DEMO_GUIDE.md) for complete walkthrough scenarios:
1. Admin Overview (10 minutes)
2. Fleet Manager Operations (15 minutes)
3. Technician Workflows (12 minutes)
4. Driver Experience (8 minutes)

All scenarios work perfectly with demo data!

---

**Need Help?**
- See [docs/DEMO_GUIDE.md](./docs/DEMO_GUIDE.md) for complete walkthrough
- Check browser console for detailed status messages
- Verify demo mode is active (look for 📊 emoji in console)
