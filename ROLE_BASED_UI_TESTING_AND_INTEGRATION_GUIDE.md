# Role-Based UI Testing & API Integration Guide

## Overview
This guide provides comprehensive instructions for testing the role-based UI system and integrating it with backend APIs.

**Status:** Quick-action buttons wired with proper navigation and API integration patterns
**Last Updated:** 2026-01-14

---

## Table of Contents
1. [Quick-Action Navigation Patterns](#quick-action-navigation-patterns)
2. [API Integration Examples](#api-integration-examples)
3. [Navigation State Handling](#navigation-state-handling)
4. [Test User Creation](#test-user-creation)
5. [Testing Checklist](#testing-checklist)
6. [Troubleshooting](#troubleshooting)

---

## 1. Quick-Action Navigation Patterns

### Pattern Overview
All quick-action buttons now use `react-router-dom`'s `useNavigate` hook with state passing for context-aware navigation.

### Implementation Examples

#### Fleet Manager Dashboard
```typescript
const navigate = useNavigate();

// Navigate with filter state
const handleViewOverdue = () => {
  navigate('/maintenance-hub-consolidated', {
    state: { filter: 'overdue' }
  });
  toast.info('Loading overdue maintenance queue...');
};

// Navigate with action state
const handleCreateWorkOrder = () => {
  navigate('/maintenance-hub-consolidated', {
    state: { action: 'create-work-order' }
  });
  toast.info('Opening work order form...');
};

// Navigate with multiple state params
const handleScheduleMaintenance = () => {
  navigate('/maintenance-hub-consolidated', {
    state: { view: 'schedule', filter: 'upcoming' }
  });
  toast.info('Opening maintenance scheduler...');
};
```

#### Driver Dashboard
```typescript
const navigate = useNavigate();

// Navigate with action and ID
const handleStartTrip = (tripId: number) => {
  navigate('/operations-hub-consolidated', {
    state: { action: 'start-trip', tripId }
  });
  toast.info(`Starting Trip #${tripId}...`);
};

// Navigate with entity context
const handleLogFuel = () => {
  navigate('/fleet-hub-consolidated', {
    state: { action: 'log-fuel', vehicleId: assignedVehicle.id }
  });
  toast.info('Opening fuel log form...');
};
```

### Navigation State Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `action` | string | Action to perform on target page | `'create-work-order'`, `'assign-driver'` |
| `filter` | string | Pre-apply filter on target page | `'overdue'`, `'upcoming'`, `'active'` |
| `view` | string | Which view/tab to show | `'schedule'`, `'map'`, `'list'` |
| `tripId` | number | Trip entity ID | `4523` |
| `vehicleId` | number | Vehicle entity ID | `1042` |

---

## 2. API Integration Examples

### Data Loading Pattern

#### useEffect with Parallel Fetching
```typescript
useEffect(() => {
  const fetchDashboardData = async () => {
    try {
      const [maintenanceRes, fleetRes, costRes] = await Promise.all([
        fetch('/api/maintenance/alerts'),
        fetch('/api/fleet/stats'),
        fetch('/api/costs/summary?period=monthly')
      ]);

      const maintenanceData = await maintenanceRes.json();
      const fleetData = await fleetRes.json();
      const costData = await costRes.json();

      setOverdueCount(maintenanceData.overdue_count);
      setUpcomingCount(maintenanceData.upcoming_count);
      setOpenWorkOrders(maintenanceData.open_work_orders);
      setFleetStats(fleetData);
      setCostSummary(costData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    }
  };

  fetchDashboardData();
}, []);
```

#### Using React Query (Recommended)
```typescript
import { useQuery } from '@tanstack/react-query';

// In component:
const { data: maintenanceAlerts, isLoading, error } = useQuery({
  queryKey: ['maintenance', 'alerts'],
  queryFn: async () => {
    const response = await fetch('/api/maintenance/alerts');
    if (!response.ok) throw new Error('Failed to fetch alerts');
    return response.json();
  },
  refetchInterval: 30000, // Refetch every 30 seconds
});

const { data: fleetStats } = useQuery({
  queryKey: ['fleet', 'stats'],
  queryFn: () => fetch('/api/fleet/stats').then(r => r.json())
});

// Use in JSX:
{isLoading && <LoadingSkeleton />}
{error && <ErrorMessage error={error} />}
{maintenanceAlerts && (
  <div>{maintenanceAlerts.overdue_count} items</div>
)}
```

### POST Requests (Form Submissions)

#### Inspection Submission Example
```typescript
const handleCompleteInspection = async () => {
  const allCompleted = inspectionItems.every(item => item.completed);
  if (!allCompleted) {
    toast.error('Please complete all inspection items');
    return;
  }

  toast.loading('Submitting inspection...');

  try {
    const response = await fetch('/api/inspections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        vehicle_id: assignedVehicle.id,
        inspection_items: inspectionItems.map(item => ({
          item: item.id,
          status: item.completed ? 'pass' : 'fail'
        })),
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Inspection submission failed');
    }

    toast.success('Pre-trip inspection completed!');

    // Reset checklist after successful submission
    setInspectionItems(prev =>
      prev.map(item => ({ ...item, completed: false }))
    );
  } catch (error) {
    console.error('Inspection submission failed:', error);
    toast.error(error.message || 'Failed to submit inspection');
  }
};
```

#### Report Export Example
```typescript
const handleExportReport = async () => {
  toast.loading('Generating daily report...');

  try {
    const response = await fetch('/api/reports/daily', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        date: new Date().toISOString(),
        format: 'pdf'
      })
    });

    if (!response.ok) throw new Error('Export failed');

    // Handle file download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fleet-report-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    toast.success('Report generated successfully!');
  } catch (error) {
    console.error('Export failed:', error);
    toast.error('Failed to generate report');
  }
};
```

### Real-Time Updates (WebSocket)

```typescript
useEffect(() => {
  const ws = new WebSocket('ws://localhost:3001/fleet-status');

  ws.onopen = () => {
    console.log('WebSocket connected');
  };

  ws.onmessage = (event) => {
    const update = JSON.parse(event.data);

    // Update state based on message type
    switch (update.type) {
      case 'vehicle_status':
        setFleetStats(prev => ({
          ...prev,
          [update.status]: update.count
        }));
        break;

      case 'maintenance_alert':
        setOverdueCount(prev => prev + 1);
        toast.warning(`New maintenance alert: ${update.vehicle_name}`);
        break;

      case 'trip_update':
        // Update trip status in real-time
        setTodaysTrips(prev =>
          prev.map(trip =>
            trip.id === update.trip_id
              ? { ...trip, status: update.status }
              : trip
          )
        );
        break;
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected');
  };

  return () => {
    ws.close();
  };
}, []);
```

---

## 3. Navigation State Handling

### Receiving Navigation State

```typescript
import { useLocation } from 'react-router-dom';

export function MaintenanceHub() {
  const location = useLocation();
  const state = location.state as {
    action?: string;
    filter?: string;
    view?: string;
    vehicleId?: number;
  } | null;

  useEffect(() => {
    if (state?.action === 'create-work-order') {
      setShowWorkOrderDialog(true);
    }

    if (state?.filter === 'overdue') {
      setActiveFilter('overdue');
      // Optionally fetch filtered data
      fetchMaintenanceRecords({ status: 'overdue' });
    }

    if (state?.action === 'report-issue' && state?.vehicleId) {
      setShowIncidentReport(true);
      setSelectedVehicleId(state.vehicleId);
    }

    // Clear state after processing to prevent re-triggering on route change
    window.history.replaceState({}, document.title);
  }, [state]);

  return (
    <div>
      {/* Your hub content */}
      {showWorkOrderDialog && <WorkOrderDialog />}
      {showIncidentReport && <IncidentReportForm vehicleId={selectedVehicleId} />}
    </div>
  );
}
```

### URL Query Parameters (Alternative)

```typescript
// Passing params via URL
navigate(`/maintenance-hub-consolidated?filter=overdue&action=create`);

// Reading params
const [searchParams] = useSearchParams();
const filter = searchParams.get('filter'); // 'overdue'
const action = searchParams.get('action'); // 'create'

useEffect(() => {
  if (action === 'create') {
    setShowWorkOrderDialog(true);
  }
}, [action]);
```

---

## 4. Test User Creation

### SQL Scripts

#### Create Test Users for Each Role
```sql
-- Fleet Manager
INSERT INTO users (email, password_hash, full_name, role, tenant_id, created_at)
VALUES (
  'fleet.manager@test.com',
  '$2b$12$LQ...', -- bcrypt hash of 'password123'
  'John Fleet Manager',
  'fleet_manager',
  1,
  NOW()
);

-- Driver
INSERT INTO users (email, password_hash, full_name, role, tenant_id, created_at)
VALUES (
  'driver@test.com',
  '$2b$12$LQ...',
  'Jane Driver',
  'driver',
  1,
  NOW()
);

-- Dispatcher
INSERT INTO users (email, password_hash, full_name, role, tenant_id, created_at)
VALUES (
  'dispatcher@test.com',
  '$2b$12$LQ...',
  'Mike Dispatcher',
  'Dispatcher',
  1,
  NOW()
);

-- Maintenance Manager
INSERT INTO users (email, password_hash, full_name, role, tenant_id, created_at)
VALUES (
  'mechanic@test.com',
  '$2b$12$LQ...',
  'Bob Mechanic',
  'Mechanic',
  1,
  NOW()
);

-- Admin
INSERT INTO users (email, password_hash, full_name, role, tenant_id, created_at)
VALUES (
  'admin@test.com',
  '$2b$12$LQ...',
  'Sarah Admin',
  'admin',
  1,
  NOW()
);
```

#### Generate Password Hashes (Node.js)
```javascript
const bcrypt = require('bcrypt');

async function generateHash(password) {
  const hash = await bcrypt.hash(password, 12);
  console.log(hash);
}

generateHash('password123');
```

### Assign Driver to Vehicle
```sql
-- Assign vehicle to driver for testing
INSERT INTO driver_vehicle_assignments (driver_id, vehicle_id, assigned_date, status)
SELECT
  u.id,
  1042,
  NOW(),
  'active'
FROM users u
WHERE u.email = 'driver@test.com';
```

---

## 5. Testing Checklist

### Role-Based Dashboard Rendering

#### ✅ Fleet Manager (`fleet_manager`)
- [ ] Dashboard shows "Fleet Manager Dashboard" title
- [ ] Attention Needed section displays 3 alert cards
- [ ] Fleet Status shows 4 status categories
- [ ] Cost Summary displays fuel, maintenance, and cost/mile metrics
- [ ] Quick actions: Assign Driver, Create Work Order, Daily Report
- [ ] All alerts are clickable and navigate correctly
- [ ] No console errors on load

#### ✅ Driver (`driver`)
- [ ] Dashboard shows "My Dashboard" with driver name
- [ ] Only 1 assigned vehicle is displayed
- [ ] Today's trips section shows trip list
- [ ] Pre-trip inspection checklist is interactive
- [ ] Quick actions: Log Fuel, Report Issue
- [ ] Inspection items toggle on click
- [ ] Complete Inspection button is disabled until all items checked
- [ ] No access to admin features

#### ✅ Dispatcher (`Dispatcher`)
- [ ] Dashboard shows dispatcher-focused view
- [ ] Live operations overview visible
- [ ] Emergency alert creation accessible
- [ ] Active dispatch channels displayed
- [ ] No access to financial data

#### ✅ Maintenance Manager (`maintenance_manager` / `Mechanic`)
- [ ] Dashboard shows maintenance-focused view
- [ ] Work queue (open, in progress, completed) visible
- [ ] Overdue maintenance list displayed
- [ ] Parts inventory status shown
- [ ] Quick work order creation accessible

#### ✅ Admin (`admin` / `super_admin`)
- [ ] Full tabbed interface visible (not role-specific dashboard)
- [ ] System health metrics displayed
- [ ] User breakdown by role shown
- [ ] Security alerts visible
- [ ] Access to all navigation items

### Navigation Menu Filtering

#### Test Steps:
1. Log in as `fleet.manager@test.com`
   - [ ] Verify navigation shows: Fleet Hub, Operations Hub, Maintenance Hub, Drivers Hub, Analytics Hub, Reports Hub, Documents Hub, Procurement Hub, Assets Hub, Communication Hub, Financial Hub
   - [ ] Verify navigation does NOT show: Admin Hub, Services Status, CTA Configuration, Data Governance

2. Log in as `driver@test.com`
   - [ ] Verify navigation shows ONLY: Fleet Hub, Operations Hub, Documents Hub
   - [ ] Verify all other items are hidden

3. Log in as `admin@test.com`
   - [ ] Verify all navigation items are visible
   - [ ] Verify Admin Hub is accessible

### Quick-Action Navigation

#### Fleet Manager Actions:
- [ ] "View Queue" (Overdue Maintenance) → Navigates to `/maintenance-hub-consolidated` with `filter: 'overdue'`
- [ ] "Schedule" (Upcoming Maintenance) → Navigates to `/maintenance-hub-consolidated` with `view: 'schedule', filter: 'upcoming'`
- [ ] "Assign" (Work Orders) → Navigates to `/maintenance-hub-consolidated` with `action: 'create-work-order'`
- [ ] "Assign Driver" → Navigates to `/drivers-hub-consolidated` with `action: 'assign-driver'`
- [ ] "Create Work Order" → Navigates to `/maintenance-hub-consolidated` with `action: 'create-work-order'`
- [ ] "Daily Report" → Shows loading toast, then success toast

#### Driver Actions:
- [ ] "Start Trip" → Navigates to `/operations-hub-consolidated` with `action: 'start-trip', tripId`
- [ ] "View Route" → Navigates to `/operations-hub-consolidated` with `action: 'view-route', tripId`
- [ ] "Log Fuel" → Navigates to `/fleet-hub-consolidated` with `action: 'log-fuel', vehicleId`
- [ ] "Report Issue" → Navigates to `/maintenance-hub-consolidated` with `action: 'report-issue', vehicleId`
- [ ] "Complete Inspection" → Submits form (mock delay), shows success toast, resets checklist

### Role Switching (Demo Mode)
- [ ] Switch from fleet_manager → driver: Dashboard and nav menu update immediately
- [ ] Switch from driver → admin: Full interface appears
- [ ] Switch from admin → driver: Limited view renders
- [ ] No console errors during role switches

### Permission Enforcement
- [ ] Driver cannot manually navigate to `/admin-hub-consolidated` (redirected or 403)
- [ ] Driver cannot access API endpoints they shouldn't (401/403 responses)
- [ ] Navigation items for unauthorized roles return nothing from `getNavigationItemsForRole()`

---

## 6. Troubleshooting

### Dashboard Not Rendering

**Symptom:** FleetHub shows blank screen or error

**Checks:**
1. Open browser console (F12) and check for errors
2. Verify user object exists: `console.log(user)` in FleetHub.tsx
3. Check role normalization: Does `user.role` match expected format?
4. Verify dashboard component imports are correct

**Fix:**
```typescript
// Add debugging in FleetHub.tsx
console.log('User:', user);
console.log('Normalized Role:', userRole);
console.log('Should Show Role Dashboard:', shouldShowRoleDashboard());
```

### Navigation Menu Empty

**Symptom:** Sidebar shows no navigation items

**Checks:**
1. Verify `user` is defined in NavigationContext
2. Check `getNavigationItemsForRole()` return value
3. Ensure navigation items have correct `id` field

**Fix:**
```typescript
// In NavigationContext.tsx
console.log('User Role:', user?.role);
console.log('Accessible Item IDs:', getNavigationItemsForRole(user.role));
console.log('Navigation Items:', navigationItems);
console.log('Visible Nav Items:', visibleNavItems);
```

### Navigation State Not Working

**Symptom:** Clicking quick-action navigates but target page doesn't respond

**Checks:**
1. Verify target page uses `useLocation()` hook
2. Check `location.state` is being read correctly
3. Ensure state processing happens in `useEffect`

**Fix:**
```typescript
// In target page (e.g., MaintenanceHub.tsx)
const location = useLocation();
console.log('Location State:', location.state);

useEffect(() => {
  console.log('Processing state:', state);
  // Your state handling logic
}, [state]);
```

### Role Not Recognized

**Symptom:** User gets "viewer" access instead of their actual role

**Checks:**
1. Verify role string format in database (snake_case vs PascalCase)
2. Check if role exists in `ROLE_NAVIGATION_CONFIG`
3. Ensure role normalization logic is working

**Fix:**
```typescript
// In role-navigation.ts, add logging:
export function getNavigationItemsForRole(userRole: string): string[] {
  console.log('Original Role:', userRole);

  const normalizedRole = userRole.toLowerCase().replace(/-/g, '_');
  console.log('Normalized Role:', normalizedRole);

  if (ROLE_NAVIGATION_CONFIG[userRole]) {
    console.log('Found exact match');
    return ROLE_NAVIGATION_CONFIG[userRole];
  }

  if (ROLE_NAVIGATION_CONFIG[normalizedRole]) {
    console.log('Found normalized match');
    return ROLE_NAVIGATION_CONFIG[normalizedRole];
  }

  console.warn(`Unknown role "${userRole}", falling back to viewer`);
  return ROLE_NAVIGATION_CONFIG.viewer;
}
```

### API Integration Not Working

**Symptom:** Dashboard data not loading from API

**Checks:**
1. Open Network tab in DevTools
2. Verify API requests are being made
3. Check response status codes
4. Verify CORS settings if API is on different domain

**Fix:**
```typescript
// Add detailed error logging
useEffect(() => {
  const fetchDashboardData = async () => {
    try {
      console.log('Fetching dashboard data...');

      const response = await fetch('/api/maintenance/alerts');
      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      console.log('Data received:', data);

      setOverdueCount(data.overdue_count);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    }
  };

  fetchDashboardData();
}, []);
```

---

## Integration Timeline

### Phase 1: API Endpoints (Week 1)
1. Create `/api/maintenance/alerts` endpoint
2. Create `/api/fleet/stats` endpoint
3. Create `/api/costs/summary` endpoint
4. Create `/api/drivers/me/vehicle` endpoint
5. Create `/api/drivers/me/trips/today` endpoint

### Phase 2: Navigation State Handling (Week 1)
1. Update MaintenanceHub to handle `filter`, `action`, `view` state
2. Update OperationsHub to handle trip-related state
3. Update FleetHub to handle fuel logging state
4. Update DriversHub to handle assignment state

### Phase 3: WebSocket Integration (Week 2)
1. Set up WebSocket server
2. Implement vehicle status updates
3. Implement maintenance alerts
4. Implement trip status updates
5. Add reconnection logic

### Phase 4: Testing (Week 2)
1. Create test users
2. Execute testing checklist
3. Fix any identified issues
4. Performance testing
5. User acceptance testing

---

## API Endpoints Reference

### Required Endpoints

| Endpoint | Method | Description | Response Example |
|----------|--------|-------------|------------------|
| `/api/maintenance/alerts` | GET | Get maintenance alerts | `{ overdue_count: 5, upcoming_count: 12, open_work_orders: 8 }` |
| `/api/fleet/stats` | GET | Get fleet statistics | `{ active_vehicles: 142, maintenance_vehicles: 18, idle_vehicles: 5, out_of_service: 3 }` |
| `/api/costs/summary` | GET | Get cost summary (query: `period`) | `{ fuel_cost: 42315, fuel_trend: 12, maintenance_cost: 18230, maintenance_trend: -5, cost_per_mile: 2.34 }` |
| `/api/drivers/me/vehicle` | GET | Get driver's assigned vehicle | `{ id: 1042, name: "Vehicle #1042", ... }` |
| `/api/drivers/me/trips/today` | GET | Get driver's trips for today | `[{ id: 4523, route_name: "Downtown Delivery", ... }]` |
| `/api/inspections` | POST | Submit pre-trip inspection | `{ success: true, inspection_id: 789 }` |
| `/api/reports/daily` | POST | Generate daily report | Binary PDF file |

---

## Success Metrics

### Usability Targets
- ✅ Time to complete common task: < 30 seconds
- ✅ Clicks to complete task: ≤ 2 for 80% of workflows
- ✅ Dashboard load time: < 2 seconds

### Adoption Targets
- Dashboard as starting page: > 80% of users
- Quick actions usage: > 60% of common tasks
- User satisfaction score: > 4/5

### Operational Improvements
- Overdue maintenance reduction (visibility)
- Work order resolution time improvement
- Emergency response time improvement

---

**Last Updated:** 2026-01-14
**Status:** ✅ Quick-action buttons fully wired with navigation patterns
**Next:** API endpoint implementation
