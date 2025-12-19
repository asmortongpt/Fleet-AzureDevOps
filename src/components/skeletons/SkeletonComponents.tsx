/**
 * Production-Grade Skeleton Loading Components
 *
 * Provides accessible, themeable skeleton loaders for various UI patterns
 */

import React from 'react';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

/**
 * Base skeleton component
 */
export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-200 dark:bg-gray-700',
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

/**
 * Skeleton for table rows
 */
export const SkeletonTableRow: React.FC = () => {
  return (
    <div className="flex items-center space-x-4 p-4 border-b border-gray-200 dark:border-gray-700">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-8 w-20" />
    </div>
  );
};

/**
 * Skeleton for full table
 */
export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Table header */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 flex-1" />
        </div>
      </div>
      {/* Table rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonTableRow key={i} />
      ))}
    </div>
  );
};

/**
 * Skeleton for card component
 */
export const SkeletonCard: React.FC = () => {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="flex space-x-2 pt-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  );
};

/**
 * Skeleton for card grid
 */
export const SkeletonCardGrid: React.FC<{ cards?: number }> = ({ cards = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: cards }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};

/**
 * Skeleton for stat/metric card
 */
export const SkeletonStatCard: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
};

/**
 * Skeleton for dashboard stats row
 */
export const SkeletonDashboardStats: React.FC<{ cards?: number }> = ({ cards = 4 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: cards }).map((_, i) => (
        <SkeletonStatCard key={i} />
      ))}
    </div>
  );
};

/**
 * Skeleton for form
 */
export const SkeletonForm: React.FC<{ fields?: number }> = ({ fields = 5 }) => {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex space-x-4 pt-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
};

/**
 * Skeleton for list item
 */
export const SkeletonListItem: React.FC = () => {
  return (
    <div className="flex items-center space-x-4 p-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
      <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-full max-w-md" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <Skeleton className="h-8 w-8 rounded flex-shrink-0" />
    </div>
  );
};

/**
 * Skeleton for list
 */
export const SkeletonList: React.FC<{ items?: number }> = ({ items = 5 }) => {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
      {Array.from({ length: items }).map((_, i) => (
        <SkeletonListItem key={i} />
      ))}
    </div>
  );
};

/**
 * Skeleton for chart/graph
 */
export const SkeletonChart: React.FC<{ height?: string }> = ({
  height = 'h-64'
}) => {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className={cn('w-full', height)} />
        <div className="flex justify-center space-x-6">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton for page header
 */
export const SkeletonPageHeader: React.FC = () => {
  return (
    <div className="space-y-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex space-x-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      <div className="flex space-x-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 flex-1 max-w-md" />
      </div>
    </div>
  );
};

/**
 * Skeleton for detail view
 */
export const SkeletonDetailView: React.FC = () => {
  return (
    <div className="space-y-6">
      <SkeletonPageHeader />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <SkeletonCard />
          <SkeletonChart />
          <SkeletonTable rows={3} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <SkeletonCard />
          <SkeletonList items={3} />
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton for dashboard page
 */
export const SkeletonDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <SkeletonPageHeader />
      <SkeletonDashboardStats cards={4} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonChart />
        <SkeletonChart />
      </div>

      <SkeletonTable rows={5} />
    </div>
  );
};

/**
 * Skeleton for avatar
 */
export const SkeletonAvatar: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  return <Skeleton className={cn('rounded-full', sizeClasses[size])} />;
};

/**
 * Skeleton for text lines
 */
export const SkeletonText: React.FC<{ lines?: number }> = ({ lines = 3 }) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 ? 'w-2/3' : 'w-full'
          )}
        />
      ))}
    </div>
  );
};

/**
 * Skeleton for image
 */
export const SkeletonImage: React.FC<{
  aspectRatio?: 'square' | 'video' | 'portrait';
  className?: string;
}> = ({ aspectRatio = 'video', className }) => {
  const ratioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
  };

  return (
    <Skeleton
      className={cn('w-full', ratioClasses[aspectRatio], className)}
    />
  );
};

/**
 * Full page skeleton loader
 */
export const SkeletonPage: React.FC<{ variant?: 'dashboard' | 'detail' | 'list' }> = ({
  variant = 'dashboard'
}) => {
  switch (variant) {
    case 'dashboard':
      return <SkeletonDashboard />;
    case 'detail':
      return <SkeletonDetailView />;
    case 'list':
      return (
        <div className="space-y-6">
          <SkeletonPageHeader />
          <SkeletonTable rows={10} />
        </div>
      );
    default:
      return <SkeletonDashboard />;
  }
};
