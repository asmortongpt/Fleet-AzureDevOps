import React from 'react';

interface SkeletonLoaderProps {
  variant?: 'text' | 'rectangular' | 'circular' | 'table';
  width?: string | number;
  height?: string | number;
  rows?: number;
  className?: string;
}

/**
 * Skeleton Loader Component
 * Nielsen's Heuristic #1: Visibility of System Status
 * Provides clear visual feedback during async operations
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'text',
  width = '100%',
  height,
  rows = 1,
  className = '',
}) => {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700';

  const getHeightClass = () => {
    if (height) return '';
    switch (variant) {
      case 'text':
        return 'h-4';
      case 'rectangular':
        return 'h-32';
      case 'circular':
        return 'h-12 w-12';
      case 'table':
        return 'h-16';
      default:
        return 'h-4';
    }
  };

  const getShapeClass = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'text':
      case 'rectangular':
      case 'table':
      default:
        return 'rounded';
    }
  };

  if (variant === 'table') {
    return (
      <div className={`space-y-2 ${className}`}>
        {/* Table Header Skeleton */}
        <div className={`${baseClasses} ${getShapeClass()} h-12 w-full mb-4`} />
        {/* Table Rows */}
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className={`${baseClasses} ${getShapeClass()} h-16 w-full`} />
        ))}
      </div>
    );
  }

  if (rows > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} ${getHeightClass()} ${getShapeClass()}`}
            style={{ width, height }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${getHeightClass()} ${getShapeClass()} ${className}`}
      style={{ width, height }}
    />
  );
};

export default SkeletonLoader;
