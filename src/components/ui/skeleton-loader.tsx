import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'card' | 'table' | 'dashboard';
  rows?: number;
}

/**
 * Skeleton Loader Component
 * Prevents blank screens during data fetching with progressive loading states
 *
 * Variants:
 * - default: Simple rectangular skeleton
 * - card: Card-style skeleton with header and content
 * - table: Table row skeleton
 * - dashboard: Dashboard grid skeleton
 */
export function Skeleton({
  className,
  variant = 'default',
  rows = 1,
  ...props
}: SkeletonProps) {
  if (variant === 'card') {
    return (
      <div className={cn('rounded-lg border bg-card', className)} {...props}>
        <div className="p-6 space-y-4">
          {/* Card Header */}
          <div className="space-y-2">
            <div className="h-5 w-2/5 bg-muted animate-pulse rounded" />
            <div className="h-4 w-3/5 bg-muted animate-pulse rounded" />
          </div>
          {/* Card Content */}
          <div className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="h-4 bg-muted animate-pulse rounded" style={{ width: `${Math.random() * 30 + 60}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={cn('space-y-2', className)} {...props}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4 border rounded-lg">
            <div className="h-10 w-10 bg-muted animate-pulse rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/4 bg-muted animate-pulse rounded" />
              <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
            </div>
            <div className="h-4 w-20 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'dashboard') {
    return (
      <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4', className)} {...props}>
        {Array.from({ length: rows || 4}).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-6">
            <div className="space-y-3">
              <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
              <div className="h-8 w-1/2 bg-muted animate-pulse rounded" />
              <div className="h-2 w-full bg-muted animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn('space-y-2', className)} {...props}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-muted animate-pulse rounded"
          style={{ width: `${Math.random() * 40 + 60}%` }}
        />
      ))}
    </div>
  );
}

/**
 * Pre-built skeleton components for common use cases
 */

export function VehicleListSkeleton() {
  return <Skeleton variant="table" rows={5} />;
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton variant="dashboard" rows={4} />
      <Skeleton variant="card" rows={3} />
    </div>
  );
}

export function DetailViewSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 p-6 rounded-lg">
        <div className="space-y-3">
          <div className="h-8 w-1/3 bg-white/20 animate-pulse rounded" />
          <div className="h-4 w-1/4 bg-white/20 animate-pulse rounded" />
        </div>
      </div>
      {/* Content skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton variant="card" rows={4} />
        <Skeleton variant="card" rows={4} />
        <Skeleton variant="card" rows={4} />
      </div>
    </div>
  );
}
