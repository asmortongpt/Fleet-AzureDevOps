# Safety Hub - Critical Fixes Required

## ⚠️ CRITICAL: TypeScript Compilation Blocked

**Status:** 🔴 **4 TypeScript Errors Preventing Build**

---

## Fix #1: Icon Import Error (BLOCKING)

**File:** `src/components/drilldown/SafetyHubDrilldowns.tsx`
**Line:** 9

```diff
- import { AlertTriangle } from '@phosphor-icons/react'
+ import { AlertTriangle } from 'lucide-react'
```

**Also update line 6:**
```diff
  import {
-   Warning,
+   // Warning, (remove - not used with lucide)
    ShieldCheck,
```

---

## Fix #2: Missing Label Property (BLOCKING)

**File:** `src/components/hubs/safety/SafetyHub.tsx`

### Location 1: Line 415-424
```diff
  const handleIncidentMarkerClick = (incident: SafetyIncident) => {
    push({
      id: `incident-${incident.id}`,
      type: 'incident',
+     label: `Incident: ${incident.type}`,
      data: {
        incidentId: incident.id,
        ...incident
      }
    })
  }
```

### Location 2: Line 427-437
```diff
  const handleHazardZoneClick = (zone: HazardZone) => {
    push({
      id: `hazard-zone-${zone.id}`,
      type: 'hazard-zone',
+     label: zone.name,
      data: {
        hazardZoneId: zone.id,
        ...zone
      }
    })
  }
```

---

## Fix #3: Remove Explicit `any` Type

**File:** `src/components/drilldown/HazardZoneDetailPanel.tsx`
**Line:** 68

```diff
  interface ZoneEvent {
    id: string
    event_type: 'entry' | 'exit' | 'violation' | 'update'
    description: string
    timestamp: string
    vehicle_id?: string
    vehicle_name?: string
-   metadata?: Record<string, any>
+   metadata?: Record<string, unknown>
  }
```

---

## Fix #4: Security - Add noopener/noreferrer

**File:** `src/components/drilldown/HazardZoneDetailPanel.tsx`
**Line:** 212-215

```diff
  const handleViewLocation = () => {
    if (zone?.location.lat && zone?.location.lng) {
      window.open(
        `https://www.google.com/maps?q=${zone.location.lat},${zone.location.lng}`,
-       '_blank'
+       '_blank',
+       'noopener,noreferrer'
      )
    }
  }
```

---

## Fix #5: Clean Up Unused Variables

**File:** `src/components/hubs/safety/SafetyHub.tsx`

### Location 1: Line 349 (remove entirely)
```diff
- const openIncidents = useMemo(() => {
-   return demoIncidents.filter(i => i.status === "open" || i.status === "investigating")
- }, [])
```

### Location 2: Line 404 (prefix with underscore)
```diff
- } catch (error) {
+ } catch (_error) {
    toast.error("Error", {
      description: "Failed to validate incident against policies"
    })
  }
```

---

## Fix #6: Auto-fix Import Ordering

Run ESLint auto-fix:

```bash
npx eslint --fix src/components/hubs/safety/SafetyHub.tsx
npx eslint --fix src/components/drilldown/SafetyHubDrilldowns.tsx
npx eslint --fix src/components/drilldown/HazardZoneDetailPanel.tsx
```

---

## Verification Commands

After applying fixes:

```bash
# 1. Check TypeScript compilation
npx tsc --noEmit

# 2. Check ESLint
npx eslint src/components/hubs/safety/SafetyHub.tsx src/components/drilldown/HazardZoneDetailPanel.tsx src/components/drilldown/SafetyHubDrilldowns.tsx

# 3. Test the components
npm run dev
# Navigate to Safety Hub and test:
# - Click incident markers on map
# - Click hazard zones
# - Verify drilldown panels open
# - Check console for errors
```

---

## Expected Results After Fixes

✅ TypeScript compilation: **0 errors**
✅ ESLint: **0 errors, ~2 warnings** (import order auto-fixed)
✅ Security: **No vulnerabilities**
✅ Functionality: **All drilldowns working**

---

## Time Estimate

- Fix #1-3: **5 minutes** (search/replace)
- Fix #4: **2 minutes** (add parameters)
- Fix #5: **2 minutes** (delete/edit lines)
- Fix #6: **1 minute** (run command)
- Verification: **5 minutes** (test in browser)

**Total: ~15 minutes**

---

## Priority

🔴 **URGENT** - These fixes are required for:
1. TypeScript compilation to succeed
2. Production deployment
3. Drilldown navigation to function properly

Apply these fixes before any other Safety Hub work.
