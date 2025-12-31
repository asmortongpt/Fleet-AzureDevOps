# Feature #7: Real API Connections - Migration Guide

## Overview

Feature #7 replaces demo/mock data with real backend API connections throughout the Fleet Management System. This document provides a comprehensive guide for migrating from the hybrid (demo + API) mode to production API-only mode.

## What Changed

### 1. API Client Enhancements

**File:** `src/lib/api-client.ts`

**New Features:**
- ✅ Exponential backoff retry logic (3 attempts with jitter)
- ✅ Automatic retry on 5xx server errors
- ✅ Automatic retry on network failures
- ✅ Automatic retry on timeout errors
- ✅ Request timeout configuration (30s default)
- ✅ Enhanced error transformation with detailed context
- ✅ Improved CSRF token management

**Breaking Changes:**
- None - all changes are backwards compatible

### 2. API Hooks (React Query)

**File:** `src/hooks/use-api.ts`

**New Features:**
- ✅ Complete mutation implementations for all resources
- ✅ Proper TypeScript types for mutations
- ✅ Real API calls instead of stubs
- ✅ Optimistic updates for better UX
- ✅ Automatic cache invalidation

**Resources with Full CRUD:**
- Vehicles
- Drivers
- Work Orders
- Facilities
- Routes
- Maintenance Schedules
- Fuel Transactions

### 3. Fleet Data Hook

**File:** `src/hooks/use-fleet-data.ts`

**Breaking Changes:**
- ❌ **REMOVED:** Demo mode fallback
- ❌ **REMOVED:** `isDemoMode()` function
- ❌ **REMOVED:** Demo data generators integration
- ✅ **NEW:** Production API-only mode
- ✅ **NEW:** Better error handling
- ✅ **NEW:** Loading state management

**Migration Required:**
```typescript
// BEFORE (hybrid mode)
const { vehicles, isLoading } = useFleetData()
// Would return demo data if API failed

// AFTER (production mode)
const { vehicles, isLoading } = useFleetData()
// Always uses API, shows loading state or error
```

### 4. Error Handling Components

**New Files:**
- `src/components/errors/APIErrorBoundary.tsx`
- `src/components/errors/APIRetryButton.tsx`
- `src/components/errors/APIStatusIndicator.tsx`

**Features:**
- ✅ Automatic error recovery with retry
- ✅ Network status detection
- ✅ User-friendly error messages
- ✅ Session expiry handling
- ✅ Visual status indicators

### 5. Environment Configuration

**File:** `.env.example`

**New Variables:**
```bash
# Backend API Configuration
VITE_API_URL=                    # Backend API base URL
VITE_API_TIMEOUT=30000          # Request timeout (ms)
VITE_API_MAX_RETRIES=3          # Max retry attempts
VITE_API_RETRY_BASE_DELAY=1000  # Retry delay (ms)
VITE_API_DEBUG=false            # Enable debug logging

# React Query Configuration
VITE_QUERY_CACHE_TIME=600000    # 10 minutes
VITE_QUERY_STALE_TIME=300000    # 5 minutes
VITE_QUERY_REFETCH_ON_FOCUS=false

# Feature Flags
VITE_USE_MOCK_DATA=false        # MUST be false in production
VITE_DEBUG_FLEET_DATA=false     # Enable for debugging
```

## Migration Steps

### Step 1: Update Environment Variables

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Configure your API endpoint:
```bash
# For development with local backend
VITE_API_URL=http://localhost:3001

# For production
VITE_API_URL=https://api.your-domain.com
```

3. Ensure mock data is disabled:
```bash
VITE_USE_MOCK_DATA=false
```

### Step 2: Ensure Backend API is Running

The frontend now **requires** a running backend API. Ensure:

1. Backend server is running on the configured URL
2. All endpoints are accessible
3. CORS is properly configured
4. Authentication is set up

To start the backend:
```bash
cd api
npm install
npm run dev
```

### Step 3: Update Code Using Fleet Data

If you're using `useFleetData()` in custom components:

**Before:**
```typescript
const { vehicles } = useFleetData()
// Vehicles might be demo data
```

**After:**
```typescript
const { vehicles, isLoading } = useFleetData()

if (isLoading) {
  return <LoadingSpinner />
}

// Vehicles are always from API
```

### Step 4: Add Error Boundaries

Wrap your components with the new error boundary:

```typescript
import { APIErrorBoundary } from '@/components/errors'

function App() {
  return (
    <APIErrorBoundary>
      <YourComponents />
    </APIErrorBoundary>
  )
}
```

### Step 5: Test All Features

Run comprehensive tests:

```bash
# Unit tests
npm run test:unit

# E2E tests
npm run test:e2e

# API client tests
npm test -- api-client.test
```

## Removed Features

### Demo Mode

**Removed:** The demo mode toggle and fallback mechanism has been completely removed.

**Why:**
- Reduces complexity
- Eliminates confusion between demo and real data
- Forces proper error handling
- Ensures consistent behavior

**Alternative:**
- Use the backend emulator for development
- Seed the database with test data
- Use proper development/staging environments

### Mock Data Generators

**Status:** Still present but deprecated

**Files:**
- `src/lib/demo-data.ts` - No longer used by `useFleetData`
- `src/services/mockData.ts` - No longer used by `useFleetData`

**Note:** These files are kept for backwards compatibility with other components but should not be used for new development.

## Troubleshooting

### Issue: "Network Error" on all requests

**Solution:**
1. Check that backend API is running
2. Verify `VITE_API_URL` is correct
3. Check browser console for CORS errors
4. Ensure network connectivity

### Issue: "CSRF Validation Failed"

**Solution:**
1. Clear browser cookies
2. Restart both frontend and backend
3. Check that CSRF endpoints are accessible

### Issue: "Session Expired" errors

**Solution:**
1. Check authentication configuration
2. Verify httpOnly cookies are working
3. Check token expiry settings

### Issue: Infinite loading states

**Solution:**
1. Check React Query DevTools for query status
2. Verify API endpoints return proper responses
3. Check network tab for failed requests
4. Enable debug logging: `VITE_DEBUG_FLEET_DATA=true`

## API Endpoints Required

Your backend must implement these endpoints:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/register` - User registration
- `GET /api/v1/csrf-token` - Get CSRF token

### Vehicles
- `GET /api/vehicles` - List vehicles
- `GET /api/vehicles/:id` - Get vehicle
- `POST /api/vehicles` - Create vehicle
- `PUT /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Delete vehicle

### Drivers
- `GET /api/drivers` - List drivers
- `GET /api/drivers/:id` - Get driver
- `POST /api/drivers` - Create driver
- `PUT /api/drivers/:id` - Update driver
- `DELETE /api/drivers/:id` - Delete driver

### Work Orders
- `GET /api/work-orders` - List work orders
- `GET /api/work-orders/:id` - Get work order
- `POST /api/work-orders` - Create work order
- `PUT /api/work-orders/:id` - Update work order
- `DELETE /api/work-orders/:id` - Delete work order

### Facilities
- `GET /api/facilities` - List facilities
- `GET /api/facilities/:id` - Get facility
- `POST /api/facilities` - Create facility
- `PUT /api/facilities/:id` - Update facility
- `DELETE /api/facilities/:id` - Delete facility

### Routes
- `GET /api/routes` - List routes
- `GET /api/routes/:id` - Get route
- `POST /api/routes` - Create route
- `PUT /api/routes/:id` - Update route
- `DELETE /api/routes/:id` - Delete route

### Maintenance
- `GET /api/maintenance-schedules` - List schedules
- `POST /api/maintenance-schedules` - Create schedule
- `PUT /api/maintenance-schedules/:id` - Update schedule
- `DELETE /api/maintenance-schedules/:id` - Delete schedule

### Fuel
- `GET /api/fuel-transactions` - List transactions
- `POST /api/fuel-transactions` - Create transaction
- `PUT /api/fuel-transactions/:id` - Update transaction
- `DELETE /api/fuel-transactions/:id` - Delete transaction

### Batch Operations
- `POST /api/v1/batch` - Execute batch requests

## Performance Considerations

### Caching Strategy

React Query automatically caches responses:
- **Stale Time:** 5 minutes (data considered fresh)
- **Cache Time:** 10 minutes (data kept in memory)
- **Refetch on Focus:** Disabled (prevents unnecessary requests)

### Retry Strategy

Automatic retries use exponential backoff:
- **Attempt 1:** Immediate
- **Attempt 2:** ~1-2 seconds delay
- **Attempt 3:** ~2-4 seconds delay
- **Attempt 4:** ~4-8 seconds delay

### Request Deduplication

React Query automatically deduplicates simultaneous requests to the same endpoint.

## Security Considerations

### CSRF Protection

All state-changing requests (POST, PUT, DELETE) include CSRF tokens:
- Token fetched from `/api/v1/csrf-token`
- Stored in memory (not localStorage)
- Included in `X-CSRF-Token` header
- Automatically refreshed on validation failure

### Authentication

Uses httpOnly cookies for authentication:
- No token storage in JavaScript
- Prevents XSS attacks
- Automatic logout on 401 errors
- Session management by backend

## Monitoring and Debugging

### Enable Debug Mode

```bash
# In .env
VITE_API_DEBUG=true
VITE_DEBUG_FLEET_DATA=true
```

Then check browser console for detailed logs.

### Use React Query DevTools

Already included in development builds:
- Open browser dev tools
- Look for React Query icon in bottom right
- Inspect query states, cache, and mutations

### API Status Indicator

Add to your UI for real-time status:

```typescript
import { APIStatusIndicator } from '@/components/errors'

<APIStatusIndicator showLabel />
```

## Testing

### Run All Tests

```bash
npm run test:all
```

### Test Specific Features

```bash
# API client tests
npm test -- api-client.test

# Component tests
npm run test:unit

# E2E tests
npm run test:e2e
```

### Manual Testing Checklist

- [ ] Can fetch vehicles list
- [ ] Can create new vehicle
- [ ] Can update vehicle
- [ ] Can delete vehicle
- [ ] Same for drivers, work orders, etc.
- [ ] Error messages display correctly
- [ ] Retry works on failures
- [ ] Loading states work
- [ ] Session expiry redirects to login
- [ ] CSRF protection works
- [ ] Network errors handled gracefully

## Rollback Procedure

If you need to rollback:

1. Checkout previous commit:
```bash
git log --oneline | grep "before FEAT-007"
git checkout <commit-hash>
```

2. Or revert the changes:
```bash
git revert <feat-007-commit-hash>
```

3. Restore environment variables:
```bash
VITE_USE_MOCK_DATA=true  # Re-enable demo mode
```

## Support

For issues or questions:
1. Check this migration guide
2. Review error logs in browser console
3. Check backend API logs
4. Review API client tests for examples
5. Contact the development team

## Summary

Feature #7 transforms the Fleet Management System from a hybrid demo/API system to a production-ready, API-only application with:

- ✅ Robust error handling and automatic retry
- ✅ Production-grade API client
- ✅ Comprehensive test coverage
- ✅ User-friendly error messages
- ✅ Real-time status monitoring
- ✅ Security best practices

The migration is straightforward but requires a running backend API. Follow this guide carefully to ensure a smooth transition.
