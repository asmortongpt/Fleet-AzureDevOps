'use client';

import { cn } from '@/lib/utils';
import {
  Inbox,
  FileX,
  Search,
  Database,
  Radio,
  AlertTriangle,
  Users,
  MapPin,
  FileText,
  Activity,
  type LucideIcon,
} from 'lucide-react';
import { ReactNode } from 'react';

export interface EmptyStateProps {
  /**
   * Icon to display - can be a Lucide icon component or a preset string
   */
  icon?: LucideIcon | 'inbox' | 'file' | 'search' | 'database' | 'radio' | 'incident' | 'users' | 'map' | 'document' | 'activity';
  /**
   * Title of the empty state
   */
  title: string;
  /**
   * Description or additional context
   */
  description?: string;
  /**
   * Primary action button
   */
  action?: {
    label: string;
    onClick: () => void;
  };
  /**
   * Secondary action (rendered as a link)
   */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /**
   * Size variant
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Additional content to render below description
   */
  children?: ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
}

// Preset icon mapping
const iconPresets: Record<string, LucideIcon> = {
  inbox: Inbox,
  file: FileX,
  search: Search,
  database: Database,
  radio: Radio,
  incident: AlertTriangle,
  users: Users,
  map: MapPin,
  document: FileText,
  activity: Activity,
};

/**
 * Empty state component for displaying when no data is available
 *
 * @example
 * ```tsx
 * // Basic usage
 * <EmptyState
 *   icon="inbox"
 *   title="No incidents found"
 *   description="There are no active incidents at this time"
 * />
 *
 * // With action button
 * <EmptyState
 *   icon="incident"
 *   title="No incidents"
 *   description="Get started by creating your first incident"
 *   action={{
 *     label: "Create Incident",
 *     onClick: () => router.push('/incidents/new')
 *   }}
 * />
 *
 * // In a data fetching scenario
 * const { data, loading, error } = useApiData<Incident[]>(() => api.get('/incidents'));
 *
 * if (loading) return <LoadingSpinner />;
 * if (error) return <ErrorPanel error={error} />;
 * if (!data || data.length === 0) {
 *   return <EmptyState icon="incident" title="No incidents" />;
 * }
 * ```
 */
export function EmptyState({
  icon = 'inbox',
  title,
  description,
  action,
  secondaryAction,
  size = 'md',
  children,
  className,
}: EmptyStateProps) {
  // Resolve icon
  const IconComponent = typeof icon === 'string' ? iconPresets[icon] : icon;

  const sizeClasses = {
    sm: {
      container: 'py-8',
      icon: 'h-10 w-10',
      iconContainer: 'p-2',
      title: 'text-base',
      description: 'text-xs',
      button: 'px-3 py-1.5 text-xs',
      secondaryButton: 'text-xs',
    },
    md: {
      container: 'py-12',
      icon: 'h-16 w-16',
      iconContainer: 'p-3',
      title: 'text-xl',
      description: 'text-sm',
      button: 'px-4 py-2 text-sm',
      secondaryButton: 'text-sm',
    },
    lg: {
      container: 'py-16',
      icon: 'h-20 w-20',
      iconContainer: 'p-4',
      title: 'text-2xl',
      description: 'text-base',
      button: 'px-6 py-3 text-base',
      secondaryButton: 'text-base',
    },
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        sizeClasses[size].container,
        className
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'mb-4 rounded-full bg-muted',
          sizeClasses[size].iconContainer
        )}
      >
        <IconComponent
          className={cn('text-muted-foreground', sizeClasses[size].icon)}
        />
      </div>

      {/* Title */}
      <h3
        className={cn(
          'mb-2 font-semibold text-foreground',
          sizeClasses[size].title
        )}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          className={cn(
            'mb-6 max-w-md text-muted-foreground',
            sizeClasses[size].description
          )}
        >
          {description}
        </p>
      )}

      {/* Custom children */}
      {children && <div className="mb-6">{children}</div>}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          {action && (
            <button
              onClick={action.onClick}
              className={cn(
                'inline-flex items-center gap-2 rounded-md bg-primary font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                sizeClasses[size].button
              )}
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className={cn(
                'font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded',
                sizeClasses[size].secondaryButton
              )}
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Search-specific empty state variant
 * Optimized for search/filter results
 *
 * @example
 * ```tsx
 * <SearchEmptyState
 *   query={searchQuery}
 *   onClear={() => setSearchQuery('')}
 * />
 * ```
 */
export function SearchEmptyState({
  query,
  onClear,
  className,
}: {
  query: string;
  onClear?: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={`We couldn't find any results matching "${query}". Try adjusting your search.`}
      action={
        onClear
          ? {
              label: 'Clear Search',
              onClick: onClear,
            }
          : undefined
      }
      className={className}
    />
  );
}

/**
 * Filter-specific empty state variant
 * Optimized for filtered results
 *
 * @example
 * ```tsx
 * <FilterEmptyState
 *   onClear={() => setFilters({})}
 * />
 * ```
 */
export function FilterEmptyState({
  onClear,
  className,
}: {
  onClear?: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      icon={Search}
      title="No matching results"
      description="No items match your current filters. Try adjusting or clearing them."
      action={
        onClear
          ? {
              label: 'Clear Filters',
              onClick: onClear,
            }
          : undefined
      }
      className={className}
    />
  );
}

/**
 * Compact empty state for smaller containers
 * Shows just icon and title in a horizontal layout
 *
 * @example
 * ```tsx
 * <EmptyStateCompact
 *   icon="activity"
 *   title="No activity"
 * />
 * ```
 */
export function EmptyStateCompact({
  icon = 'inbox',
  title,
  className,
}: {
  icon?: LucideIcon | string;
  title: string;
  className?: string;
}) {
  const IconComponent = typeof icon === 'string' ? iconPresets[icon] : icon;

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-3 py-8 text-muted-foreground',
        className
      )}
    >
      <IconComponent className="h-6 w-6" />
      <p className="text-sm font-medium">{title}</p>
    </div>
  );
}

/**
 * List item empty state - for use within lists or tables
 * More compact than full empty state
 *
 * @example
 * ```tsx
 * {items.length === 0 ? (
 *   <EmptyStateListItem
 *     icon="incident"
 *     title="No incidents"
 *     description="Create your first incident to get started"
 *   />
 * ) : (
 *   items.map(item => <ListItem key={item.id} {...item} />)
 * )}
 * ```
 */
export function EmptyStateListItem({
  icon = 'inbox',
  title,
  description,
  className,
}: {
  icon?: LucideIcon | string;
  title: string;
  description?: string;
  className?: string;
}) {
  const IconComponent = typeof icon === 'string' ? iconPresets[icon] : icon;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 text-center',
        className
      )}
    >
      <div className="mb-3 rounded-full bg-muted p-2">
        <IconComponent className="h-8 w-8 text-muted-foreground" />
      </div>
      <h4 className="mb-1 text-sm font-medium text-foreground">{title}</h4>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
