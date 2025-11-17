# TanStack Query Setup Summary

## Overview
TanStack Query (formerly React Query) has been successfully set up in the Fleet Management application with production-ready configuration.

## Changes Made

### 1. Dependencies
✅ **Already Installed**: `@tanstack/react-query` v5.83.1 (in dependencies)
✅ **Added**: `@tanstack/react-query-devtools` v5.83.1 (in devDependencies)

### 2. Configuration File Created
**Location**: `/home/user/Fleet/src/config/query-client.ts`

**Features**:
- Centralized QueryClient instance with optimized defaults
- Smart caching configuration (5min staleTime, 10min gcTime)
- Intelligent retry logic (no retries on 4xx errors, up to 3 retries on 5xx)
- Exponential backoff with max 30s delay
- Environment-aware refetching (window focus only in production)
- Query key factory for consistent key management across the app
- Pre-defined query keys for: fleet, vehicles, drivers, maintenance, facilities, routes

**Default Query Options**:
```typescript
{
  staleTime: 1000 * 60 * 5,        // 5 minutes
  gcTime: 1000 * 60 * 10,          // 10 minutes
  retry: smart retry logic,         // No retry on 4xx, up to 3 retries on 5xx
  retryDelay: exponential backoff,  // 1s, 2s, 4s, etc. (max 30s)
  refetchOnWindowFocus: prod only,
  refetchOnMount: false,
  refetchOnReconnect: true,
  networkMode: 'online'
}
```

### 3. App Integration
**Modified**: `/home/user/Fleet/src/main.tsx`

**Changes**:
- Added `QueryClientProvider` wrapping the entire app
- Added `ReactQueryDevtools` (development only)
- Imported and configured the queryClient instance

**Provider Hierarchy** (outer to inner):
```
ErrorBoundary
  → QueryClientProvider  ← NEW
    → BrowserRouter
      → TenantProvider
        → AuthProvider
          → Routes
```

### 4. Example Usage Hook
**Created**: `/home/user/Fleet/src/hooks/example-tanstack-query-usage.ts`

**Examples Include**:
- ✅ Basic query hook (`useVehicles`)
- ✅ Single item query hook (`useVehicle`)
- ✅ Mutation with optimistic updates (`useUpdateVehicle`)
- ✅ Create mutation (`useCreateVehicle`)
- ✅ Infinite query for pagination (`useInfiniteVehicles`)

## How to Use

### Basic Query Example
```typescript
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/config/query-client'

function VehicleList() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.vehicles.list(),
    queryFn: async () => {
      const res = await fetch('/api/vehicles')
      return res.json()
    }
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return <div>{/* render vehicles */}</div>
}
```

### Mutation Example
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/config/query-client'

function UpdateVehicleButton({ vehicleId }) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data) => fetch(`/api/vehicles/${vehicleId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({
        queryKey: queryKeys.vehicles.detail(vehicleId)
      })
    }
  })

  return (
    <button onClick={() => mutation.mutate({ status: 'active' })}>
      Update Vehicle
    </button>
  )
}
```

## DevTools Access

In **development mode**, you can access React Query DevTools:
- Automatically appears as a floating icon in the bottom-right corner
- Click to expand and inspect:
  - Active queries and their states
  - Cached data
  - Query invalidations
  - Network activity
  - Performance metrics

## Query Key Factory Usage

The query key factory ensures consistent keys across your app:

```typescript
import { queryKeys } from '@/config/query-client'

// ✅ Good - using factory
queryKeys.vehicles.list()           // ['vehicles', 'list']
queryKeys.vehicles.list({ status }) // ['vehicles', 'list', { status }]
queryKeys.vehicles.detail(id)       // ['vehicles', 'detail', id]

// ❌ Avoid - manual keys (prone to typos)
['vehicles', 'list']
['vehicle', id]  // typo!
```

## Benefits

1. **Automatic Caching**: Data is cached and reused across components
2. **Background Refetching**: Stale data is automatically refreshed
3. **Optimistic Updates**: UI updates before server confirms (better UX)
4. **Automatic Retry**: Failed requests retry with exponential backoff
5. **Request Deduplication**: Multiple identical requests are combined
6. **Garbage Collection**: Unused cache is automatically cleaned
7. **DevTools**: Powerful debugging tools in development
8. **Type Safety**: Full TypeScript support

## Next Steps

1. **Migrate existing API calls** to use TanStack Query hooks
2. **Add query keys** to the factory for any new data types
3. **Create custom hooks** following the examples in `example-tanstack-query-usage.ts`
4. **Configure error handling** with toast notifications if desired
5. **Add loading states** using the `isLoading` and `isFetching` flags
6. **Implement optimistic updates** for better UX on mutations

## Files Modified/Created

### Created:
- `/home/user/Fleet/src/config/query-client.ts` - Query client configuration
- `/home/user/Fleet/src/hooks/example-tanstack-query-usage.ts` - Usage examples

### Modified:
- `/home/user/Fleet/package.json` - Added devtools dependency
- `/home/user/Fleet/src/main.tsx` - Integrated QueryClientProvider

## Resources

- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Query Keys Guide](https://tanstack.com/query/latest/docs/react/guides/query-keys)
- [Mutations Guide](https://tanstack.com/query/latest/docs/react/guides/mutations)
- [DevTools](https://tanstack.com/query/latest/docs/react/devtools)

---

**Status**: ✅ **Complete and Ready for Use**

All tasks completed successfully. TanStack Query is now fully integrated and ready to use throughout the application.
