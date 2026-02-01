'use client';

/**
 * Example component demonstrating the usage of:
 * - useApiData hook
 * - LoadingSpinner component
 * - ErrorPanel component
 * - EmptyState component
 *
 * This can be used as a reference for implementing similar patterns
 * throughout the application.
 */

import { useState } from 'react';

import { EmptyState, SearchEmptyState } from '../EmptyState';
import { ErrorPanel } from '../ErrorPanel';
import { LoadingSpinner } from '../LoadingSpinner';
import { api } from "@/lib/api-client";
import { useApiData } from '../../lib/hooks/useApiData';

// Local Incident type definition for this example
interface Incident {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'closed';
  priority: 'critical' | 'high' | 'medium' | 'low';
  created_at: string;
}


export function IncidentsExample() {
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all');

  // Use the custom hook to fetch data with loading/error/data states
  const { data, loading, error, refetch } = useApiData<Incident[]>(
    () => {
      const endpoint = filter === 'all'
        ? '/incidents'
        : `/incidents?status=${filter}`;
      return api.get(endpoint);
    },
    {
      // Refetch when filter changes
      dependencies: [filter],
      // Optional: callbacks for success/error
      onSuccess: (data: Incident[]) => {
        console.log(`Loaded ${data.length} incidents`);
      },
      onError: (error: Error) => {
        console.error('Failed to load incidents:', error);
      },
    }
  );

  // Loading state - shows centered spinner with message
  if (loading) {
    return <LoadingSpinner message="Loading incidents..." />;
  }

  // Error state - shows error panel with retry button
  if (error) {
    return (
      <ErrorPanel
        error={error}
        onRetry={refetch}
        title="Failed to load incidents"
      />
    );
  }

  // Empty state - shows when no data
  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon="incident"
        title="No incidents found"
        description={
          filter === 'all'
            ? "There are no incidents at this time"
            : `There are no ${filter} incidents`
        }
        action={{
          label: "Create Incident",
          onClick: () => {
            // Navigate to create page or open modal
            console.log('Create incident');
          }
        }}
        secondaryAction={
          filter !== 'all' ? {
            label: "Show All",
            onClick: () => setFilter('all')
          } : undefined
        }
      />
    );
  }

  // Success state - render the data
  return (
    <div className="space-y-2">
      {/* Header with filters and refresh */}
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-bold">
          Incidents ({data.length})
        </h1>

        <div className="flex items-center gap-2">
          {/* Filter buttons */}
          <div className="flex gap-2">
            <FilterButton
              active={filter === 'all'}
              onClick={() => setFilter('all')}
            >
              All
            </FilterButton>
            <FilterButton
              active={filter === 'open'}
              onClick={() => setFilter('open')}
            >
              Open
            </FilterButton>
            <FilterButton
              active={filter === 'closed'}
              onClick={() => setFilter('closed')}
            >
              Closed
            </FilterButton>
          </div>

          {/* Refresh button */}
          <button
            onClick={refetch}
            className="rounded-md bg-primary px-2 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Incidents list */}
      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
        {data.map((incident) => (
          <IncidentCard key={incident.id} incident={incident} />
        ))}
      </div>
    </div>
  );
}

// Helper component for filter buttons
function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:bg-muted/80'
      }`}
    >
      {children}
    </button>
  );
}

// Example incident card component
function IncidentCard({ incident }: { incident: Incident }) {
  return (
    <div className="rounded-lg border border-border bg-card p-2">
      <div className="mb-2 flex items-start justify-between">
        <h3 className="font-semibold text-card-foreground">
          {incident.title}
        </h3>
        <span
          className={`rounded px-2 py-1 text-xs font-medium ${
            incident.status === 'open'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
              : incident.status === 'in_progress'
              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
              : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
          }`}
        >
          {incident.status.replace('_', ' ')}
        </span>
      </div>

      <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
        {incident.description}
      </p>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span
          className={`rounded px-2 py-1 font-medium ${
            incident.priority === 'critical'
              ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
              : incident.priority === 'high'
              ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
              : incident.priority === 'medium'
              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
          }`}
        >
          {incident.priority}
        </span>
        <span>{new Date(incident.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

/**
 * Alternative example with inline loading and error states
 * Useful for smaller components where full-screen states aren't appropriate
 */
export function IncidentsInlineExample() {
  const { data, loading, error, refetch } = useApiData<Incident[]>(
    () => api.get('/incidents')
  );

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <h2 className="mb-2 text-base font-bold">Recent Incidents</h2>

      {/* Inline loading state */}
      {loading && (
        <div className="flex items-center justify-center py-3">
          <LoadingSpinner size="sm" message="Loading..." />
        </div>
      )}

      {/* Inline error state */}
      {error && (
        <div className="py-2">
          <ErrorPanel
            error={error}
            onRetry={refetch}
            size="sm"
          />
        </div>
      )}

      {/* Inline empty state */}
      {!loading && !error && (!data || data.length === 0) && (
        <EmptyState
          icon="incident"
          title="No incidents"
          description="There are no recent incidents"
          size="sm"
        />
      )}

      {/* Data display */}
      {!loading && !error && data && data.length > 0 && (
        <div className="space-y-3">
          {data.slice(0, 5).map((incident) => (
            <div
              key={incident.id}
              className="flex items-center justify-between border-b border-border pb-3 last:border-b-0 last:pb-0"
            >
              <div>
                <p className="font-medium">{incident.title}</p>
                <p className="text-xs text-muted-foreground">
                  {incident.priority} priority
                </p>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(incident.created_at).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Example with search functionality
 * Demonstrates SearchEmptyState component
 */
export function IncidentsSearchExample() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data, loading, error, refetch } = useApiData<Incident[]>(
    () => api.get(`/incidents?search=${searchQuery}`),
    {
      dependencies: [searchQuery],
    }
  );

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorPanel error={error} onRetry={refetch} />;

  return (
    <div className="space-y-2">
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search incidents..."
        className="w-full rounded-md border border-input bg-background px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />

      {!data || data.length === 0 ? (
        searchQuery ? (
          <SearchEmptyState
            query={searchQuery}
            onClear={() => setSearchQuery('')}
          />
        ) : (
          <EmptyState
            icon="search"
            title="Start searching"
            description="Enter a search query to find incidents"
          />
        )
      ) : (
        <div className="space-y-3">
          {data.map((incident) => (
            <IncidentCard key={incident.id} incident={incident} />
          ))}
        </div>
      )}
    </div>
  );
}
