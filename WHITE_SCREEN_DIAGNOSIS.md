# White Screen Diagnosis

## Summary
The Fleet Management System is showing a white screen when accessed at http://localhost:5173

## Investigation Results

### ✅ Dev Server - WORKING
- Server running correctly on http://localhost:5173
- Responding with HTTP 200 OK
- HTML is loading correctly
- React dev tools injected

### ❌ Backend API - NOT RUNNING
All API endpoints returning ECONNREFUSED:
- `/api/csrf` - FAIL
- `/api/vehicles` - FAIL
- `/api/drivers` - FAIL
- `/api/facilities` - FAIL
- All other endpoints - FAIL

### ✅ Demo Mode Fallback - IMPLEMENTED
The code HAS proper fallback logic in `use-fleet-data.ts`:
```typescript
// Lines 93-109: Automatic demo mode activation
useEffect(() => {
  const isDemoMode = localStorage.getItem('demo_mode') === 'true'
  const hasApiErrors = vehiclesError || driversError || facilitiesError
  const isLoading = vehiclesLoading || driversLoading || facilitiesLoading
  const hasNoData = !vehiclesData && !driversData && !facilitiesData

  // Activate demo mode if:
  // 1. Explicitly enabled in localStorage, OR
  // 2. Loading finished but there's no data and no errors (API not configured), OR
  // 3. There are API errors
  if (isDemoMode || (!isLoading && hasNoData) || hasApiErrors) {
    if (!useDemoData) {
      setUseDemoData(true)
      logger.info('📊 Using demo data for walkthrough (API unavailable or demo mode active)')
    }
  }
}, [...])
```

### ✅ Sentry - NO ISSUE
- Sentry DSN not configured (expected in development)
- Just logs warning and continues (no crash)

## Root Cause Hypothesis

The white screen is likely caused by ONE of these:

1. **JavaScript Error During Render** - Something throwing before React can mount
2. **Missing Environment Variable** - Build-time variable causing crash
3. **Lazy Loading Failure** - One of the lazy-loaded components failing to load
4. **Demo Data Generation Error** - The demo data generator is crashing

## Next Steps

1. ✅ Check browser console for JavaScript errors
2. ✅ Enable localStorage demo mode explicitly
3. ✅ Check if demo data is generating properly
4. ✅ Test with a minimal component to isolate the issue

## Quick Fix to Try

Open browser console and run:
```javascript
localStorage.setItem('demo_mode', 'true')
location.reload()
```

Then check if the app loads with demo data.
