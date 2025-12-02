# Production-Grade Error Handling Guide

This guide covers the comprehensive error handling system implemented in the Fleet Management application.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Components](#components)
4. [Query Hooks](#query-hooks)
5. [Loading States](#loading-states)
6. [Error Boundaries](#error-boundaries)
7. [Best Practices](#best-practices)
8. [Examples](#examples)
9. [Testing](#testing)

## Overview

The error handling system provides:

- **User-Friendly Error Messages**: Automatic conversion of technical errors to readable messages
- **Toast Notifications**: Visual feedback for mutations (create, update, delete)
- **Loading States**: Skeleton loaders for better UX during data fetching
- **Error Boundaries**: Component crash protection with graceful fallbacks
- **Automatic Retry Logic**: Smart retry for network and server errors
- **Error Reporting**: Automatic logging and monitoring integration
- **Accessibility**: ARIA labels and screen reader support

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Application Root                      │
│                  (EnhancedErrorBoundary)                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  Query Error Boundary                    │
│           (Handles React Query Errors)                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Individual Components                       │
│    (useQueryWithErrorHandling hooks)                    │
│    - Automatic error messages                           │
│    - Toast notifications                                │
│    - Loading skeletons                                  │
│    - Retry logic                                        │
└─────────────────────────────────────────────────────────┘
```

## Components

### EnhancedErrorBoundary

Top-level error boundary that catches all React component errors.

**Location**: `/src/components/EnhancedErrorBoundary.tsx`

**Features**:
- Catches unhandled component errors
- Shows user-friendly error screen
- Logs errors to localStorage and external services
- Provides retry and reload options
- Downloads error logs for debugging
- Shows technical details in development mode

**Usage**:
```tsx
import { EnhancedErrorBoundary } from '@/components/EnhancedErrorBoundary';

<EnhancedErrorBoundary
  showDetails={import.meta.env.DEV}
  onError={(error, errorInfo) => {
    // Custom error handling
    console.error('Error:', error, errorInfo);
  }}
>
  <YourComponent />
</EnhancedErrorBoundary>
```

### QueryErrorBoundary

Specialized error boundary for React Query errors with reset functionality.

**Location**: `/src/components/errors/QueryErrorBoundary.tsx`

**Features**:
- Integrates with React Query error reset
- Network error detection
- Server error detection
- Troubleshooting tips
- One-click retry

**Usage**:
```tsx
import { QueryErrorBoundary } from '@/components/errors/QueryErrorBoundary';

<QueryErrorBoundary onReset={() => console.log('Error reset')}>
  <DataComponent />
</QueryErrorBoundary>
```

### Inline Error Displays

For showing errors without boundaries:

```tsx
import { QueryErrorDisplay, InlineQueryError } from '@/components/errors/QueryErrorBoundary';

// Full error card
<QueryErrorDisplay error={error} onRetry={refetch} />

// Compact inline error
<InlineQueryError error={error} onRetry={refetch} />
```

## Query Hooks

### Enhanced Data Hooks

All query hooks are wrapped with automatic error handling.

**Location**: `/src/hooks/useDataQueriesEnhanced.ts`

**Features**:
- Automatic error message extraction
- Toast notifications for mutations
- Smart retry logic (don't retry 4xx errors)
- Exponential backoff for retries
- Error logging and reporting
- Success notifications

**Available Hooks**:

#### Queries (Read Operations)
```tsx
// Vehicles
const { data, isLoading, isError, error, refetch } = useVehicles();
const { data } = useVehicle(id);

// Drivers
const { data } = useDrivers();
const { data } = useDriver(id);

// Work Orders
const { data } = useWorkOrders({ status: 'open' });
const { data } = useWorkOrder(id);

// Parts
const { data } = useParts();
const { data } = usePart(id);

// Vendors
const { data } = useVendors();
const { data } = useVendor(id);

// Facilities
const { data } = useFacilities();
```

#### Mutations (Write Operations)
```tsx
// Create
const createVehicle = useCreateVehicle({
  onSuccess: (data) => {
    console.log('Created:', data);
  },
});
createVehicle.mutate(vehicleData);

// Update
const updateVehicle = useUpdateVehicle({
  successMessage: 'Vehicle updated!',
  errorMessage: 'Failed to update vehicle',
});
updateVehicle.mutate({ id, ...updates });

// Delete
const deleteVehicle = useDeleteVehicle();
deleteVehicle.mutate(id);
```

### Custom Error Messages

Override default error messages:

```tsx
const { data } = useVehicles({
  errorMessage: 'Unable to load your vehicles. Please contact support.',
  showErrorToast: true,
});

const createVehicle = useCreateVehicle({
  successMessage: 'Vehicle added to your fleet!',
  errorMessage: 'Could not add vehicle. Please try again.',
  showSuccessToast: true,
});
```

### Disable Toast Notifications

```tsx
const { data } = useVehicles({
  showErrorToast: false,
});

const createVehicle = useCreateVehicle({
  showSuccessToast: false,
});
```

## Loading States

### Skeleton Components

**Location**: `/src/components/skeletons/SkeletonComponents.tsx`

**Available Skeletons**:

```tsx
import {
  Skeleton,
  SkeletonTable,
  SkeletonCard,
  SkeletonCardGrid,
  SkeletonStatCard,
  SkeletonDashboardStats,
  SkeletonForm,
  SkeletonList,
  SkeletonChart,
  SkeletonPageHeader,
  SkeletonDetailView,
  SkeletonDashboard,
  SkeletonAvatar,
  SkeletonText,
  SkeletonImage,
  SkeletonPage,
} from '@/components/skeletons/SkeletonComponents';

// Usage
if (isLoading) {
  return <SkeletonTable rows={5} />;
}
```

### Skeleton Examples

```tsx
// Table skeleton
<SkeletonTable rows={10} />

// Card grid
<SkeletonCardGrid cards={6} />

// Dashboard stats
<SkeletonDashboardStats cards={4} />

// Full page layouts
<SkeletonPage variant="dashboard" />
<SkeletonPage variant="detail" />
<SkeletonPage variant="list" />

// Custom skeleton
<Skeleton className="h-10 w-full" />
```

## Error Boundaries

### Best Practices

1. **Wrap at appropriate levels**:
   ```tsx
   // App level - catch all errors
   <EnhancedErrorBoundary>
     <QueryErrorBoundary>
       <App />
     </QueryErrorBoundary>
   </EnhancedErrorBoundary>

   // Module level - isolate module errors
   <QueryErrorBoundary>
     <VehicleManagementModule />
   </QueryErrorBoundary>

   // Component level - protect critical components
   <QueryErrorBoundary>
     <CriticalChart />
   </QueryErrorBoundary>
   ```

2. **Don't over-use**: Too many boundaries can hide errors
3. **Log errors**: Always log to help debugging
4. **Provide fallbacks**: Custom fallback UI when needed

## Best Practices

### For Queries

```tsx
function VehicleList() {
  const { data, isLoading, isError, error, refetch } = useVehicles({
    errorMessage: 'Failed to load vehicles',
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // 1. Show loading state
  if (isLoading) {
    return <SkeletonTable rows={10} />;
  }

  // 2. Show error state with retry
  if (isError) {
    return <QueryErrorDisplay error={error as Error} onRetry={refetch} />;
  }

  // 3. Show data
  return <Table data={data} />;
}
```

### For Mutations

```tsx
function CreateVehicleForm() {
  const createVehicle = useCreateVehicle({
    successMessage: 'Vehicle created successfully!',
    errorMessage: 'Failed to create vehicle',
    onSuccess: (data) => {
      // Reset form, navigate, etc.
      navigate(`/vehicles/${data.id}`);
    },
  });

  const handleSubmit = (formData: VehicleFormData) => {
    createVehicle.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}

      <Button
        type="submit"
        disabled={createVehicle.isPending}
      >
        {createVehicle.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating...
          </>
        ) : (
          'Create Vehicle'
        )}
      </Button>

      {/* Show error inline */}
      {createVehicle.isError && (
        <Alert variant="destructive">
          {(createVehicle.error as Error).message}
        </Alert>
      )}
    </form>
  );
}
```

### Error Message Hierarchy

1. **Custom message** (if provided)
2. **API error message** (from response)
3. **HTTP status message** (400, 404, 500, etc.)
4. **Generic fallback** ("An unexpected error occurred")

### Retry Logic

```tsx
// Automatic retry configuration
- Network errors: Retry up to 2 times
- Server errors (5xx): Retry up to 2 times
- Client errors (4xx): No retry
- Exponential backoff: 1s, 2s, 4s (max 10s)
```

## Examples

### Complete Component Example

```tsx
import { useState } from 'react';
import { useVehicles, useCreateVehicle, useUpdateVehicle } from '@/hooks/useDataQueriesEnhanced';
import { QueryErrorBoundary, QueryErrorDisplay } from '@/components/errors/QueryErrorBoundary';
import { SkeletonTable } from '@/components/skeletons/SkeletonComponents';
import { Button } from '@/components/ui/button';

export function VehicleManagement() {
  // Query with automatic error handling
  const { data: vehicles, isLoading, isError, error, refetch } = useVehicles();

  // Mutations with toast notifications
  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle();

  // Loading state
  if (isLoading) {
    return <SkeletonTable rows={10} />;
  }

  // Error state
  if (isError) {
    return <QueryErrorDisplay error={error as Error} onRetry={refetch} />;
  }

  return (
    <QueryErrorBoundary>
      <div className="space-y-4">
        <h1>Vehicles ({vehicles?.length})</h1>

        {/* Table or grid */}
        <VehicleTable data={vehicles} />

        {/* Actions */}
        <Button
          onClick={() => createVehicle.mutate(newVehicleData)}
          disabled={createVehicle.isPending}
        >
          Add Vehicle
        </Button>
      </div>
    </QueryErrorBoundary>
  );
}
```

### Interactive Example Component

See `/src/components/examples/ErrorHandlingExample.tsx` for a comprehensive interactive demo.

## Testing

### Simulating Errors

```tsx
// 1. Disconnect network
// - Open DevTools > Network tab
// - Set throttling to "Offline"
// - Trigger data fetch

// 2. Mock API errors
import { setupServer } from 'msw/node';
import { rest } from 'msw';

const server = setupServer(
  rest.get('/api/vehicles', (req, res, ctx) => {
    return res(ctx.status(500), ctx.json({ message: 'Server error' }));
  })
);

// 3. Component errors
function ErrorComponent() {
  throw new Error('Test error');
}
```

### Error Logs

```tsx
// Download error logs
import { useDownloadErrorLogs } from '@/hooks/useQueryWithErrorHandling';

const downloadLogs = useDownloadErrorLogs();
downloadLogs(); // Downloads JSON file with all errors

// Clear error logs
import { useClearErrorLogs } from '@/hooks/useQueryWithErrorHandling';

const clearLogs = useClearErrorLogs();
clearLogs();
```

### Manual Error Reporting

```tsx
import { useReportError } from '@/hooks/useQueryWithErrorHandling';

const reportError = useReportError();

try {
  dangerousOperation();
} catch (error) {
  reportError(error, {
    operation: 'dangerousOperation',
    userId: currentUser.id,
  });
}
```

## Error Monitoring Integration

The system integrates with error monitoring services:

### Sentry

```typescript
// Automatically sends errors if Sentry is configured
if (window.Sentry) {
  Sentry.captureException(error, {
    contexts: { query: { queryKey, operation } }
  });
}
```

### LogRocket

```typescript
// Automatically sends errors if LogRocket is configured
if (window.LogRocket) {
  LogRocket.captureException(error, {
    tags: { errorBoundary: true },
    extra: { componentStack }
  });
}
```

## Accessibility

All error handling components include:

- ARIA labels (`role="status"`, `role="alert"`)
- Screen reader text (`sr-only`)
- Keyboard navigation support
- Focus management
- High contrast support

## Summary

This error handling system provides:

- Zero-config error handling for all queries and mutations
- Automatic user-friendly error messages
- Toast notifications for user feedback
- Loading states with skeleton components
- Error boundaries for crash protection
- Automatic retry with exponential backoff
- Error logging and monitoring
- Full TypeScript support
- Accessibility compliance

For questions or issues, refer to the example component at `/src/components/examples/ErrorHandlingExample.tsx` or contact the development team.
