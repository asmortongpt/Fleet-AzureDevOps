/**
 * Virtual List Component
 *
 * High-performance virtualized list for rendering thousands of items
 * Uses @tanstack/react-virtual for efficient DOM management
 *
 * Features:
 * - Only renders visible items
 * - Smooth scrolling
 * - Variable item heights
 * - Horizontal and vertical scrolling
 * - Overscan for smoother experience
 */

import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, forwardRef } from 'react';

import { cn } from '@/lib/utils';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface VirtualListProps<T> {
  /**
   * Array of items to render
   */
  items: T[];

  /**
   * Height of the scrollable container (in pixels)
   */
  height: number;

  /**
   * Estimated height of each item (in pixels)
   * Can be a function for variable heights
   */
  itemHeight: number | ((index: number) => number);

  /**
   * Number of items to render outside visible area
   * Improves scroll performance
   * @default 5
   */
  overscan?: number;

  /**
   * Render function for each item
   */
  renderItem: (item: T, index: number) => React.ReactNode;

  /**
   * Custom className for the container
   */
  className?: string;

  /**
   * Custom className for each item
   */
  itemClassName?: string;

  /**
   * Width of the container (for horizontal scrolling)
   */
  width?: number;

  /**
   * Enable horizontal scrolling
   * @default false
   */
  horizontal?: boolean;

  /**
   * Callback when scroll position changes
   */
  onScroll?: (scrollOffset: number) => void;

  /**
   * Callback when items in viewport change
   */
  onViewportChange?: (startIndex: number, endIndex: number) => void;

  /**
   * Enable smooth scrolling
   * @default true
   */
  smoothScroll?: boolean;

  /**
   * Gap between items (in pixels)
   * @default 0
   */
  gap?: number;

  /**
   * Loading state
   */
  isLoading?: boolean;

  /**
   * Loading component
   */
  loadingComponent?: React.ReactNode;

  /**
   * Empty state component
   */
  emptyComponent?: React.ReactNode;

  /**
   * Scroll to index on mount
   */
  initialScrollIndex?: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

function VirtualListInner<T>(
  {
    items,
    height,
    itemHeight,
    overscan = 5,
    renderItem,
    className,
    itemClassName,
    width,
    horizontal = false,
    onScroll,
    onViewportChange,
    smoothScroll = true,
    gap = 0,
    isLoading = false,
    loadingComponent,
    emptyComponent,
    initialScrollIndex,
  }: VirtualListProps<T>,
  ref: React.Ref<HTMLDivElement>
) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Create virtualizer instance
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: typeof itemHeight === 'function' ? itemHeight : () => itemHeight,
    overscan,
    horizontal,
    gap,
    initialOffset: initialScrollIndex ? initialScrollIndex * (typeof itemHeight === 'number' ? itemHeight : 0) : undefined,
  });

  // Handle scroll events
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollOffset = horizontal
      ? e.currentTarget.scrollLeft
      : e.currentTarget.scrollTop;

    if (onScroll) {
      onScroll(scrollOffset);
    }
  };

  // Track viewport changes
  const virtualItems = virtualizer.getVirtualItems();
  if (virtualItems.length > 0 && onViewportChange) {
    const startIndex = virtualItems[0].index;
    const endIndex = virtualItems[virtualItems.length - 1].index;
    onViewportChange(startIndex, endIndex);
  }

  // Loading state
  if (isLoading) {
    return (
      <div
        className={cn(
          'flex items-center justify-center',
          className
        )}
        style={{ height, width }}
      >
        {loadingComponent || (
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        )}
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center',
          className
        )}
        style={{ height, width }}
      >
        {emptyComponent || (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <svg
              className="h-9 w-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <p className="text-sm">No items to display</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className={cn(
        'overflow-auto',
        smoothScroll && 'scroll-smooth',
        className
      )}
      style={{
        height,
        width: width || '100%',
      }}
      onScroll={handleScroll}
    >
      <div
        style={{
          height: horizontal ? '100%' : `${virtualizer.getTotalSize()}px`,
          width: horizontal ? `${virtualizer.getTotalSize()}px` : '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => {
          const item = items[virtualItem.index];

          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              className={cn(itemClassName)}
              style={{
                position: 'absolute',
                top: horizontal ? 0 : `${virtualItem.start}px`,
                left: horizontal ? `${virtualItem.start}px` : 0,
                width: horizontal ? `${virtualItem.size}px` : '100%',
                height: horizontal ? '100%' : `${virtualItem.size}px`,
              }}
            >
              {renderItem(item, virtualItem.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Use forwardRef to support ref forwarding
export const VirtualList = forwardRef(VirtualListInner) as <T>(
  props: VirtualListProps<T> & { ref?: React.Ref<HTMLDivElement> }
) => React.ReactElement;

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook to scroll to a specific index
 */
export function useVirtualScroll(parentRef: React.RefObject<HTMLDivElement>) {
  const scrollToIndex = (index: number, options?: { align?: 'start' | 'center' | 'end'; smooth?: boolean }) => {
    if (!parentRef.current) return;

    const element = parentRef.current.querySelector(`[data-index="${index}"]`) as HTMLElement;
    if (!element) return;

    const scrollOptions: ScrollIntoViewOptions = {
      block: options?.align || 'start',
      behavior: options?.smooth !== false ? 'smooth' : 'auto',
    };

    element.scrollIntoView(scrollOptions);
  };

  const scrollToTop = (smooth = true) => {
    if (!parentRef.current) return;

    parentRef.current.scrollTo({
      top: 0,
      left: 0,
      behavior: smooth ? 'smooth' : 'auto',
    });
  };

  const scrollToBottom = (smooth = true) => {
    if (!parentRef.current) return;

    parentRef.current.scrollTo({
      top: parentRef.current.scrollHeight,
      left: 0,
      behavior: smooth ? 'smooth' : 'auto',
    });
  };

  return {
    scrollToIndex,
    scrollToTop,
    scrollToBottom,
  };
}

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

/*
import { VirtualList } from '@/components/common/VirtualList';

function MyComponent() {
  const items = Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
  }));

  return (
    <VirtualList
      items={items}
      height={600}
      itemHeight={60}
      overscan={5}
      renderItem={(item, index) => (
        <div className="flex items-center gap-3 border-b p-2">
          <div className="h-8 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            {index + 1}
          </div>
          <div>
            <p className="font-medium">{item.name}</p>
            <p className="text-sm text-muted-foreground">ID: {item.id}</p>
          </div>
        </div>
      )}
    />
  );
}
*/

export default VirtualList;
