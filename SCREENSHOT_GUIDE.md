# Hub Pages Screenshot Guide

The development server is running at: **http://localhost:5174/**

## How to Access Hub Pages for Screenshots

The application uses the NavigationContext to control which page is displayed. Here's how to access each hub:

### Method 1: Use the Navigation Menu
1. Open http://localhost:5174/ in your browser
2. Look for the navigation sidebar (usually on the left)
3. Click on the hub you want to screenshot:
   - **Operations Hub** - Dispatch, routing, and task management
   - **Assets Hub** - Equipment and inventory management
   - **Maintenance Hub** - Garage services and predictive maintenance
   - **Compliance Hub** - DOT, IFTA, and safety compliance management

### Method 2: Direct Browser Console Commands
Open the browser console (F12) and run these commands to navigate directly:

```javascript
// Operations Hub
window.dispatchEvent(new CustomEvent('navigate', { detail: 'operations-hub-consolidated' }))

// Assets Hub
window.dispatchEvent(new CustomEvent('navigate', { detail: 'assets-hub-consolidated' }))

// Maintenance Hub
window.dispatchEvent(new CustomEvent('navigate', { detail: 'maintenance-hub-consolidated' }))

// Compliance Hub
window.dispatchEvent(new CustomEvent('navigate', { detail: 'compliance-hub-consolidated' }))
```

## Current Mock Data in Each Hub

### Operations Hub (`/pages/OperationsHub.tsx`)
**Dispatch Tab:**
- Active Jobs: 24 (6 starting within hour)
- In Transit: 18 (On schedule)
- Completed Today: 156 (Target: 160)
- Delayed: 3 (1 critical)
- On-Time Rate: 94%
- Driver Capacity: 78% utilized

**Routes Tab:**
- Active Routes: 45
- Optimized Today: 12 (28% savings)
- Avg Duration: 2.4 hrs

**Tasks Tab:**
- Open Tasks: 34
- In Progress: 12
- Completed: 89
- Overdue: 2

**Calendar Tab:**
- Scheduled Today: 24
- This Week: 156
- Driver Shifts: 42

### Assets Hub (`/pages/AssetsHub.tsx`)
**Assets Tab:**
- Total Assets: 256
- Active: 234
- In Maintenance: 18
- Retired: 4
- Utilization: 91%
- Total Value: $4.2M
- Depreciation: $320K
- Avg Age: 3.4 yrs

**Equipment Tab:**
- Heavy Equipment: 24
- In Use: 18
- Available: 4
- Service Due: 2

**Inventory Tab:**
- Total Items: 1,456
- Tracked: 1,420
- Low Stock: 24
- Reorder Pending: 8

### Maintenance Hub (`/pages/MaintenanceHub.tsx`)
**Garage Tab:**
- Work Orders: 12 (4 urgent)
- In Progress: 5 (2 technicians)
- Completed Today: 8 (+3)
- Parts Waiting: 3
- Bay Utilization: 75% (5 of 8 bays in use)
- Efficiency Score: 88%

**Predictive Tab:**
- Predictions Active: 156
- Alerts: 8
- Prevented Failures: 12
- Savings: $28K

**Calendar Tab:**
- Today: 4
- This Week: 18
- Overdue: 2

**Requests Tab:**
- New Requests: 6
- In Review: 4
- Approved: 8
- Completed: 45

### Compliance Hub (`/pages/ComplianceHub.tsx`)
**Dashboard Tab:**
- Overall Score: 94%
- DOT Compliance: 98%
- IFTA Compliance: 100%
- Violations: 2
- OSHA Status: 92%

**Map Tab:**
- Regions: 12
- Compliant Zones: 10
- Attention Needed: 2

**DOT Tab:**
- Vehicles Compliant: 152
- Inspections Due: 8
- HOS Violations: 0
- ELD Status: 100%

**IFTA Tab:**
- Quarters Filed: 4/4
- Miles Tracked: 2.4M
- Fuel Tax Due: $12,450

**OSHA Tab:**
- Forms Complete: 24
- Pending: 3
- Incidents YTD: 2
- Days Safe: 47

## Screenshot Tips

1. **Full Page Screenshots**: Use browser extensions like "Full Page Screenshot" for Chrome/Edge
2. **Tab Switching**: Each hub has multiple tabs - capture the main/default tab first
3. **Interactive Elements**: Hover over stat cards to show the hover state
4. **Window Size**: Use a consistent viewport (e.g., 1920x1080) for all screenshots
5. **Dark Theme**: The app uses a dark theme by default - ensure your browser is not forcing light mode

## Troubleshooting

If a hub page is not loading:
1. Check the browser console for errors (F12)
2. Verify the dev server is running: http://localhost:5174/
3. Make sure you have the correct role/permissions (try switching roles with the RoleSwitcher button)
4. Clear browser cache and reload
5. Check that all npm dependencies are installed: `npm install`

## Files Modified
All hub pages are located in `/src/pages/`:
- `OperationsHub.tsx`
- `AssetsHub.tsx`
- `MaintenanceHub.tsx`
- `ComplianceHub.tsx`

The navigation routing is configured in:
- `/src/lib/navigation.tsx` - Hub navigation items
- `/src/App.tsx` - Route mappings (lines 366-387)
