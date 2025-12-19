import React from 'react';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'text' | 'circular' | 'card';
  rows?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'default',
  rows = 1
}) => {
  const baseStyles = cn(
    "animate-pulse bg-muted rounded-md",
    className
  );

  if (variant === 'text') {
    return (
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className={cn(baseStyles, "h-4", i === rows - 1 && "w-3/4")}
          />
        ))}
      </div>
    );
  }

  if (variant === 'circular') {
    return <div className={cn(baseStyles, "rounded-full")} />;
  }

  if (variant === 'card') {
    return (
      <div className="rounded-lg border p-6 space-y-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-muted h-12 w-12" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-3 bg-muted rounded w-3/4" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-muted rounded w-full" />
          <div className="h-3 bg-muted rounded w-5/6" />
          <div className="h-3 bg-muted rounded w-2/3" />
        </div>
      </div>
    );
  }

  return <div className={baseStyles} />;
};

export const SkeletonRow: React.FC = () => {
  return (
    <div className="animate-pulse flex space-x-4 p-4 border-b">
      <div className="rounded-full bg-muted h-12 w-12" style={{ minHeight: '48px', minWidth: '48px' }}></div>
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 bg-muted rounded w-3/4"></div>
        <div className="h-4 bg-muted rounded w-1/2"></div>
      </div>
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="space-y-2" role="status" aria-label="Loading content">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export const SkeletonCard: React.FC = () => {
  return <Skeleton variant="card" />;
};
