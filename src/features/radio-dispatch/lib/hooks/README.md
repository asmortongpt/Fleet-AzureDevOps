# API Hooks & Components Usage Guide

This guide demonstrates how to use the enhanced API client, custom hooks, and reusable components for loading/error/empty states.

## Table of Contents

1. [Enhanced API Client](#enhanced-api-client)
2. [useApiData Hook](#useapidata-hook)
3. [Loading Components](#loading-components)
4. [Error Components](#error-components)
5. [Empty State Components](#empty-state-components)
6. [Complete Examples](#complete-examples)

## Enhanced API Client

The `lib/api.ts` client now includes:
- **Automatic retry logic** (3 retries with exponential backoff)
- **Timeout handling** (30 second default)
- **Better error messages** for different failure types
- **Request logging** (development only)

### Basic Usage

```typescript
import { api } from '@/lib/api';

// Simple GET request with automatic retry
const incidents = await api.get<Incident[]>('/incidents');

// Custom timeout and retry configuration
const data = await api.get('/slow-endpoint', {
  timeout: 60000,  // 60 seconds
  retries: 5,      // 5 retry attempts
});

// Skip retry for specific requests
const result = await api.post('/quick-action', data, {
  skipRetry: true,
});
```

### Error Handling

The API client throws `ApiError` with helpful methods:

```typescript
try {
  const data = await api.get('/protected-resource');
} catch (error) {
  if (error instanceof ApiError) {
    if (error.isAuthError()) {
      // Handle authentication errors
      router.push('/login');
    } else if (error.isNetworkError()) {
      // Handle network errors
      showToast('Please check your internet connection');
    } else if (error.isServerError()) {
      // Handle server errors
      showToast('Server error. Please try again later.');
    }
  }
}
```

## useApiData Hook

The `useApiData` hook wraps API calls with loading/error/data states.

### Basic Usage

```typescript
import { useApiData } from '@/lib/hooks/useApiData';
import { api, type Incident } from '@/lib/api';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorPanel } from '@/components/ErrorPanel';
import { EmptyState } from '@/components/EmptyState';

function IncidentsList() {
  const { data, loading, error, refetch } = useApiData<Incident[]>(
    () => api.get('/incidents')
  );

  if (loading) return <LoadingSpinner message="Loading incidents..." />;
  if (error) return <ErrorPanel error={error} onRetry={refetch} />;
  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon="incident"
        title="No incidents found"
        description="There are no active incidents at this time"
      />
    );
  }

  return (
    <div className="space-y-4">
      {data.map(incident => (
        <IncidentCard key={incident.id} incident={incident} />
      ))}
    </div>
  );
}
```

### With Dependencies

Re-fetch when dependencies change:

```typescript
function FilteredIncidents({ status, priority }: FilterProps) {
  const { data, loading, error } = useApiData(
    () => api.get(`/incidents?status=${status}&priority=${priority}`),
    {
      dependencies: [status, priority], // Refetch when these change
    }
  );

  // ... render logic
}
```

### With Callbacks

```typescript
const { data, loading, error, refetch } = useApiData(
  () => api.get<Incident[]>('/incidents'),
  {
    onSuccess: (data) => {
      console.log(`Loaded ${data.length} incidents`);
      toast.success('Incidents loaded');
    },
    onError: (error) => {
      console.error('Failed to load incidents:', error);
      if (error.isAuthError()) {
        router.push('/login');
      }
    },
  }
);
```

### Manual Fetching

Disable auto-fetch and trigger manually:

```typescript
const { data, loading, error, refetch } = useApiData(
  () => api.get('/incidents'),
  {
    autoFetch: false, // Don't fetch on mount
  }
);

// Trigger fetch manually
<button onClick={refetch}>Load Incidents</button>
```

### Multiple API Calls

Use `useApiDataMultiple` for parallel fetching:

```typescript
import { useApiDataMultiple } from '@/lib/hooks/useApiData';

function Dashboard() {
  const [incidentsState, assetsState, tasksState] = useApiDataMultiple([
    () => api.get<Incident[]>('/incidents'),
    () => api.get<Asset[]>('/assets'),
    () => api.get<Task[]>('/tasks'),
  ]);

  if (incidentsState.loading || assetsState.loading || tasksState.loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <IncidentsList incidents={incidentsState.data} />
      <AssetMap assets={assetsState.data} />
      <TaskBoard tasks={tasksState.data} />
    </div>
  );
}
```

### Paginated Data

Use `useApiDataPaginated` for paginated endpoints:

```typescript
import { useApiDataPaginated } from '@/lib/hooks/useApiData';

function PaginatedIncidents() {
  const {
    data,
    loading,
    error,
    page,
    pageSize,
    totalPages,
    hasMore,
    nextPage,
    prevPage,
    goToPage,
  } = useApiDataPaginated<Incident>(
    (page, pageSize) => api.get(`/incidents?page=${page}&size=${pageSize}`),
    {
      initialPage: 1,
      initialPageSize: 20,
    }
  );

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorPanel error={error} />;

  return (
    <div>
      <IncidentsList incidents={data} />
      <Pagination
        page={page}
        totalPages={totalPages}
        onNext={nextPage}
        onPrev={prevPage}
        onGoToPage={goToPage}
        hasMore={hasMore}
      />
    </div>
  );
}
```

## Loading Components

### LoadingSpinner

Basic spinner with optional message:

```typescript
import { LoadingSpinner } from '@/components/LoadingSpinner';

// Basic
<LoadingSpinner />

// With message and custom size
<LoadingSpinner size="lg" message="Loading data..." />

// Full screen
<LoadingSpinner fullScreen message="Please wait..." />
```

### LoadingSpinnerInline

For buttons and inline use:

```typescript
import { LoadingSpinnerInline } from '@/components/LoadingSpinner';

<button disabled={loading}>
  {loading && <LoadingSpinnerInline />}
  {loading ? 'Saving...' : 'Save'}
</button>
```

### LoadingOverlay

Overlay existing content:

```typescript
import { LoadingOverlay } from '@/components/LoadingSpinner';

<div className="relative">
  {loading && <LoadingOverlay message="Updating..." />}
  <YourContent />
</div>
```

### Skeleton

Placeholder for content:

```typescript
import { Skeleton } from '@/components/LoadingSpinner';

{loading ? (
  <div className="space-y-2">
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
  </div>
) : (
  <ContentText />
)}
```

### LoadingDots

Alternative loading indicator:

```typescript
import { LoadingDots } from '@/components/LoadingSpinner';

<div className="flex items-center gap-2">
  <span>Processing</span>
  <LoadingDots />
</div>
```

## Error Components

### ErrorPanel

Main error display with retry:

```typescript
import { ErrorPanel } from '@/components/ErrorPanel';

// Basic usage
<ErrorPanel error={error} onRetry={refetch} />

// Custom size
<ErrorPanel error={error} onRetry={refetch} size="lg" />

// Full screen
<ErrorPanel error={error} onRetry={refetch} fullScreen />

// Custom title
<ErrorPanel
  error={error}
  onRetry={refetch}
  title="Failed to load dashboard"
/>
```

### ErrorPanelInline

Compact inline error:

```typescript
import { ErrorPanelInline } from '@/components/ErrorPanel';

{error && <ErrorPanelInline error={error} onRetry={refetch} />}
```

### ErrorToast

For toast notifications:

```typescript
import { ErrorToast } from '@/components/ErrorPanel';
import { toast } from 'sonner';

toast.error(<ErrorToast error={error} onRetry={refetch} />);
```

## Empty State Components

### EmptyState

Main empty state component:

```typescript
import { EmptyState } from '@/components/EmptyState';

// Basic
<EmptyState
  icon="inbox"
  title="No items found"
  description="There are no items to display"
/>

// With action
<EmptyState
  icon="incident"
  title="No incidents"
  description="Get started by creating your first incident"
  action={{
    label: "Create Incident",
    onClick: () => router.push('/incidents/new')
  }}
  secondaryAction={{
    label: "Learn More",
    onClick: () => openHelpModal()
  }}
/>

// Custom size
<EmptyState
  icon="users"
  title="No team members"
  size="lg"
/>
```

### SearchEmptyState

For search results:

```typescript
import { SearchEmptyState } from '@/components/EmptyState';

<SearchEmptyState
  query={searchQuery}
  onClear={() => setSearchQuery('')}
/>
```

### FilterEmptyState

For filtered results:

```typescript
import { FilterEmptyState } from '@/components/EmptyState';

<FilterEmptyState
  onClear={() => setFilters({})}
/>
```

### EmptyStateCompact

Compact horizontal layout:

```typescript
import { EmptyStateCompact } from '@/components/EmptyState';

<EmptyStateCompact icon="activity" title="No activity" />
```

### EmptyStateListItem

For use within lists:

```typescript
import { EmptyStateListItem } from '@/components/EmptyState';

{items.length === 0 ? (
  <EmptyStateListItem
    icon="incident"
    title="No incidents"
    description="Create your first incident to get started"
  />
) : (
  items.map(item => <ListItem key={item.id} {...item} />)
)}
```

## Complete Examples

### Full Page with All States

```typescript
'use client';

import { useApiData } from '@/lib/hooks/useApiData';
import { api, type Incident } from '@/lib/api';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorPanel } from '@/components/ErrorPanel';
import { EmptyState } from '@/components/EmptyState';
import { useRouter } from 'next/navigation';

export default function IncidentsPage() {
  const router = useRouter();

  const { data, loading, error, refetch } = useApiData<Incident[]>(
    () => api.get('/incidents'),
    {
      onSuccess: (data) => {
        console.log(`Loaded ${data.length} incidents`);
      },
      onError: (error) => {
        if (error.isAuthError()) {
          router.push('/login');
        }
      },
    }
  );

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading incidents..." />;
  }

  if (error) {
    return <ErrorPanel error={error} onRetry={refetch} fullScreen />;
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon="incident"
        title="No incidents found"
        description="Get started by creating your first incident"
        action={{
          label: "Create Incident",
          onClick: () => router.push('/incidents/new')
        }}
        secondaryAction={{
          label: "View Documentation",
          onClick: () => window.open('/docs/incidents', '_blank')
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Incidents ({data.length})</h1>
        <button onClick={refetch} className="btn-primary">
          Refresh
        </button>
      </div>

      {data.map(incident => (
        <IncidentCard key={incident.id} incident={incident} />
      ))}
    </div>
  );
}
```

### Form with Loading State

```typescript
'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { LoadingSpinnerInline } from '@/components/LoadingSpinner';
import { ErrorPanelInline } from '@/components/ErrorPanel';
import { toast } from 'sonner';

export function CreateIncidentForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      const incident = await api.post('/incidents', {
        title: formData.get('title'),
        description: formData.get('description'),
      });

      toast.success('Incident created successfully');
      router.push(`/incidents/${incident.id}`);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <ErrorPanelInline error={error} />}

      <input name="title" placeholder="Title" required />
      <textarea name="description" placeholder="Description" />

      <button type="submit" disabled={loading}>
        {loading && <LoadingSpinnerInline />}
        {loading ? 'Creating...' : 'Create Incident'}
      </button>
    </form>
  );
}
```

### Search with Filtering

```typescript
'use client';

import { useState, useMemo } from 'react';
import { useApiData } from '@/lib/hooks/useApiData';
import { api, type Incident } from '@/lib/api';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorPanel } from '@/components/ErrorPanel';
import { SearchEmptyState } from '@/components/EmptyState';

export function SearchableIncidents() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data, loading, error, refetch } = useApiData<Incident[]>(
    () => api.get('/incidents')
  );

  const filteredData = useMemo(() => {
    if (!data || !searchQuery) return data;

    return data.filter(incident =>
      incident.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data, searchQuery]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorPanel error={error} onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search incidents..."
        className="input"
      />

      {filteredData && filteredData.length === 0 && searchQuery ? (
        <SearchEmptyState
          query={searchQuery}
          onClear={() => setSearchQuery('')}
        />
      ) : (
        filteredData?.map(incident => (
          <IncidentCard key={incident.id} incident={incident} />
        ))
      )}
    </div>
  );
}
```

### Optimistic Updates

```typescript
'use client';

import { useApiData } from '@/lib/hooks/useApiData';
import { api, type Incident } from '@/lib/api';
import { LoadingOverlay } from '@/components/LoadingSpinner';
import { toast } from 'sonner';

export function IncidentActions({ incident }: { incident: Incident }) {
  const [updating, setUpdating] = useState(false);

  const { refetch } = useApiData<Incident[]>(() => api.get('/incidents'));

  async function updateStatus(status: string) {
    setUpdating(true);

    try {
      await api.patch(`/incidents/${incident.id}`, { status });
      toast.success('Status updated');
      refetch(); // Refresh the list
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="relative">
      {updating && <LoadingOverlay message="Updating status..." />}

      <div className="flex gap-2">
        <button onClick={() => updateStatus('in_progress')}>
          In Progress
        </button>
        <button onClick={() => updateStatus('completed')}>
          Complete
        </button>
      </div>
    </div>
  );
}
```

## Best Practices

1. **Always handle all three states**: loading, error, and empty data
2. **Provide retry functionality** for error states
3. **Use meaningful messages** in loading and empty states
4. **Consider UX**: Full screen for page loads, inline for smaller components
5. **Add user actions** in empty states to guide next steps
6. **Use TypeScript generics** for type-safe data handling
7. **Implement proper error boundaries** for unexpected errors
8. **Log errors appropriately** for debugging and monitoring

## Testing

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { useApiData } from '@/lib/hooks/useApiData';

describe('useApiData', () => {
  it('shows loading state initially', () => {
    const { result } = renderHook(() =>
      useApiData(() => api.get('/test'))
    );

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('shows data after successful fetch', async () => {
    const mockData = [{ id: 1, name: 'Test' }];
    vi.spyOn(api, 'get').mockResolvedValue(mockData);

    const { result } = renderHook(() =>
      useApiData(() => api.get('/test'))
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBe(null);
    });
  });
});
```
