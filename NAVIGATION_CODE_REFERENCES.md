# Navigation System - Code References & Snippets

## Key Source Files with Line Numbers

### 1. Navigation Context (State Management)
**File:** `/src/contexts/NavigationContext.tsx`

**Problem Areas:**
```typescript
// Lines 64-69: navigateTo() function exists but NOT USED by sidebar
const navigateTo = useCallback((moduleId: string) => {
    const path = moduleId === 'live-fleet-dashboard' ? '/' : `/${moduleId}`;
    navigate(path);  // ← Updates URL
    // State update happens via useEffect
}, [navigate]);

// Lines 32-35: useEffect watches URL changes
useEffect(() => {
    const moduleId = getModuleFromPath(location.pathname);
    setActiveModuleState(moduleId);  // ← This only fires on URL change
}, [location.pathname]);
```

**Issue:** `navigateTo()` updates URL, but sidebar doesn't call it - calls `setActiveModule()` directly instead.

---

### 2. Sidebar Navigation Handler
**File:** `/src/components/layout/CommandCenterSidebar.tsx`

**Problem Code (Line 29-35):**
```typescript
const NavButton = ({ item }: { item: any }) => (
    <Button
        key={item.id}
        variant="ghost"
        onClick={() => {
            setActiveModule(item.id);  // ← PROBLEM: Direct state mutation
        }}
        className={cn(
            "w-full justify-start h-10 mb-1 rounded-lg transition-all duration-200",
            isSidebarOpen ? "px-3" : "px-0 justify-center",
            activeModule === item.id
                ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_10px_rgba(37,99,235,0.1)]"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
        title={!isSidebarOpen ? item.label : undefined}
    >
        <div className={cn("w-5 h-5 flex items-center justify-center", activeModule === item.id ? "text-blue-400" : "text-slate-500")}>
            {item.icon}
        </div>
        {isSidebarOpen && <span className="ml-3 font-medium text-sm truncate">{item.label}</span>}
    </Button>
);
```

**What it should be:**
```typescript
const NavButton = ({ item }: { item: any }) => (
    <Button
        key={item.id}
        variant="ghost"
        onClick={() => {
            navigateTo(item.id);  // ← FIXED: Use navigateTo instead
        }}
        // ... rest of code
    >
```

**Settings Button (Lines 112-122)** - This one works correctly:
```typescript
<Button
    variant="ghost"
    onClick={() => navigate('/settings')}  // ← Correctly uses navigate()
    className={cn(
        "w-full justify-start h-11 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted",
        isSidebarOpen ? "px-4" : "px-0 justify-center"
    )}
>
    <Settings className="w-5 h-5" />
    {isSidebarOpen && <span className="ml-3 font-medium">Settings</span>}
</Button>
```

---

### 3. App Module Rendering
**File:** `/src/App.tsx`

**Problem Area (Lines 208-262):**
```typescript
const renderModule = () => {
    // ... access check code ...
    
    switch (activeModule) {
      case "live-fleet-dashboard":
        return <LiveFleetDashboard />
      // ... many more cases ...
      case "google-maps-test":
        return <GoogleMapsTestPage />  // ← Returns same reference every time
      // ... more cases ...
      default:
        return <CommandCenter />
    }
}

// In return statement (line 420):
<Suspense fallback={<div className="h-full w-full flex items-center justify-center"><LoadingSpinner /></div>}>
    {renderModule()}  // ← Component gets re-rendered but not re-mounted
</Suspense>
```

**Problem:** When `renderModule()` returns the same component reference, React doesn't re-mount it.

**Solution - Add key (Quick Fix):**
```typescript
<Suspense fallback={<div className="h-full w-full flex items-center justify-center"><LoadingSpinner /></div>}>
    <div key={activeModule}>  // ← Force component re-mount on module change
        {renderModule()}
    </div>
</Suspense>
```

---

### 4. Lazy Component Loading
**File:** `/src/App.tsx` (Lines 111)

**Current:**
```typescript
const GoogleMapsTestPage = lazy(() => import("@/pages/GoogleMapsTest"))
```

**When this lazy loads:**
- First visit: Component suspends, loading spinner shows, then component mounts
- Switch to another module: Lazy component suspended
- Return to GoogleMapsTest: Without key prop, React tries to reuse old instance
- Result: Component doesn't fully re-initialize

---

### 5. GoogleMapsTest Page Definition
**File:** `/src/pages/GoogleMapsTest.tsx`

```typescript
export default function GoogleMapsTestPage() {
  const { data: vehiclesData, isLoading } = useVehicles()  // ← Cached query

  const vehicles = vehiclesData?.data || []

  return (
    <div className="p-6 space-y-6">
      {/* ... JSX ... */}
    </div>
  )
}
```

**Issue:** If query is cached and component doesn't re-mount, old data persists.

---

### 6. Navigation Items Configuration
**File:** `/src/lib/navigation.tsx` (Lines 144-151)

```typescript
{
    id: "google-maps-test",
    label: "Google Maps Test",
    icon: <MapTrifold className="w-5 h-5" />,
    section: "tools",
    category: "Admin",
    roles: ['SuperAdmin', 'Admin', 'FleetAdmin']  // ← Role-based!
}
```

**Problem:** Role filtering happens in NavigationContext, but also checked again in App.tsx renderModule().

---

### 7. Main.tsx Setup
**File:** `/src/main.tsx` (Lines 89-102)

```typescript
<BrowserRouter>
  <GlobalCommandPalette />
  <SentryRoutes>
    <Route
      path="/*"
      element={
        <SentryErrorBoundary level="section">
          <NavigationProvider>  // ← Provider inside catch-all route
            <App />
          </NavigationProvider>
        </SentryErrorBoundary>
      }
    />
  </SentryRoutes>
</BrowserRouter>
```

**Issue:** The `/*` catch-all route means all paths are handled identically.

---

## Complete Navigation Flow Diagram

```
User Interaction
    ↓
NavButton.onClick()
    ├─→ [CORRECT PATH - Settings] → navigate("/settings")
    │   ↓
    │   URL changes
    │   ↓
    │   NavigationContext.useEffect() fires
    │   ↓
    │   activeModule updates
    │   ↓
    │   App re-renders new component
    │   ↓
    │   ✓ Works correctly
    │
    └─→ [BROKEN PATH - GoogleMapsTest] → setActiveModule()
        ↓
        Only internal state updates
        ↓
        URL DOES NOT change
        ↓
        NavigationContext.useEffect() does NOT fire
        ↓
        App still re-renders but...
        ↓
        React sees same component reference
        ↓
        ❌ Component not re-mounted
```

---

## React Rendering Details

### Why "No Change" Occurs

When React renders:
```typescript
function renderModule() {
  switch (activeModule) {
    case "google-maps-test":
      return <GoogleMapsTestPage />  // Same function reference
  }
}

// Render 1: activeModule = "google-maps-test"
renderModule() → <GoogleMapsTestPage /> ← Mounts component

// Click different module
// Render 2: activeModule = "fleet-hub-consolidated"
renderModule() → <FleetHubPage /> ← Unmounts GoogleMapsTest

// Click GoogleMapsTest again
// Render 3: activeModule = "google-maps-test"
renderModule() → <GoogleMapsTestPage /> ← React compares:
//                                        - Same reference? YES
//                                        - Same props? YES
//                                        - Action? No re-mount needed
//                                        Result: DOM stays same, NO CHANGE
```

### With Key Prop Fix

```typescript
<div key={activeModule}>  // React tracks this key
  {renderModule()}
</div>

// Render 1: key="google-maps-test"
// Render 3: key="google-maps-test" (same key again)
// Result: React still won't re-mount because key is same

// BETTER FIX: Wrap component with key
function renderModule() {
  return (
    <div key={activeModule}>
      {/* actual rendering */}
    </div>
  )
}
```

---

## Access Control Flow

### NavigationContext Filtering (Lines 38-58)
```typescript
const visibleNavItems = useMemo(() => {
    if (!user) return [];

    return navigationItems.filter(item => {
        // 1. Role Check
        if (item.roles && item.roles.length > 0) {
            if (isSuperAdmin()) return true;  // SuperAdmin sees all

            const allowedRoles = item.roles as UserRole[];
            if (!allowedRoles.includes(user.role)) return false;  // ← Filters out GoogleMapsTest if not admin
        }
        return true;
    });
}, [user, isSuperAdmin]);
```

### App.tsx Access Check (Lines 183-190)
```typescript
const hasAccessToModule = useMemo(() => {
    if (!currentNavItem) return true
    if (currentNavItem.roles || currentNavItem.permissions) {
      return canAccess(currentNavItem.roles as any, currentNavItem.permissions)
    }
    return true
}, [currentNavItem, canAccess])

// If access denied (lines 193-205):
if (!hasAccessToModule) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gray-50 rounded-lg">
      <Shield className="w-16 h-16 text-red-500 mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
      {/* ... */}
    </div>
  )
}
```

**Problem:** Two independent checks create inconsistency:
1. If not in visibleNavItems → Can't click (not in menu)
2. If in visibleNavItems but fails hasAccessToModule → Can click but get Access Denied

---

## Summary of Files to Modify

For a complete fix, these files need changes:

1. **`/src/components/layout/CommandCenterSidebar.tsx`**
   - Line 34: Change `setActiveModule(item.id)` to `navigateTo(item.id)`

2. **`/src/App.tsx`**
   - Line 111-112: Add key prop to component
   - Line 420: Wrap renderModule() output with div that has key={activeModule}

3. **`/src/contexts/NavigationContext.tsx`** (Optional - export navigateTo)
   - Export `navigateTo` so sidebar can use it
   - Make it available in context

4. **`/src/lib/navigation.tsx`** (Optional - cleanup)
   - Consider moving role check to single location
