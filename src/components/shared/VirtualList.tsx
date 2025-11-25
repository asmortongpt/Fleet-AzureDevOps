import { useRef, useState, useEffect, ReactNode } from 'react';
interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
  EmptyComponent?: ReactNode;
}

/**
 * VirtualList Component
 * Efficiently renders large lists by only rendering visible items
 * Uses windowing technique to improve performance
 */
export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 3,
  className = '',
  onScroll,
  EmptyComponent,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = items.length * itemHeight;

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);

  const offsetY = startIndex * itemHeight;

  const handleScroll = () => {
    if (containerRef.current) {
      const newScrollTop = containerRef.current.scrollTop;
      setScrollTop(newScrollTop);
      onScroll?.(newScrollTop);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  if (items.length === 0 && EmptyComponent) {
    return <div className={className}>{EmptyComponent}</div>;
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative',
      }}
    >
      <div
        style={{
          height: totalHeight,
          position: 'relative',
        }}
      >
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Dynamic height virtual list (more complex, uses measured heights)
 */
interface DynamicVirtualListProps<T> {
  items: T[];
  containerHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
  estimatedItemHeight?: number;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
  EmptyComponent?: ReactNode;
}

export function DynamicVirtualList<T>({
  items,
  containerHeight,
  renderItem,
  estimatedItemHeight = 50,
  overscan = 3,
  className = '',
  onScroll,
  EmptyComponent,
}: DynamicVirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [itemHeights, setItemHeights] = useState<number[]>(
    new Array(items.length).fill(estimatedItemHeight)
  );

  const measurementCache = useRef<Map<number, number>>(new Map());

  // Calculate cumulative heights
  const cumulativeHeights = itemHeights.reduce<number[]>((acc, height, index) => {
    acc[index] = (acc[index - 1] || 0) + height;
    return acc;
  }, []);

  const totalHeight = cumulativeHeights[cumulativeHeights.length - 1] || 0;

  // Binary search to find start index
  const findStartIndex = (scrollTop: number): number => {
    let left = 0;
    let right = cumulativeHeights.length - 1;

    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (cumulativeHeights[mid] < scrollTop) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    return Math.max(0, left - overscan);
  };

  const startIndex = findStartIndex(scrollTop);

  // Find end index
  let endIndex = startIndex;
  let currentHeight = cumulativeHeights[startIndex] || 0;
  while (
    endIndex < items.length - 1 &&
    currentHeight < scrollTop + containerHeight
  ) {
    endIndex++;
    currentHeight = cumulativeHeights[endIndex];
  }

  endIndex = Math.min(items.length - 1, endIndex + overscan);

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const offsetY = startIndex > 0 ? cumulativeHeights[startIndex - 1] : 0;

  const handleScroll = () => {
    if (containerRef.current) {
      const newScrollTop = containerRef.current.scrollTop;
      setScrollTop(newScrollTop);
      onScroll?.(newScrollTop);
    }
  };

  // Measure item heights
  const measureItem = (index: number, element: HTMLElement | null) => {
    if (element && !measurementCache.current.has(index)) {
      const height = element.getBoundingClientRect().height;
      measurementCache.current.set(index, height);

      setItemHeights((prev) => {
        const newHeights = [...prev];
        newHeights[index] = height;
        return newHeights;
      });
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  if (items.length === 0 && EmptyComponent) {
    return <div className={className}>{EmptyComponent}</div>;
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative',
      }}
    >
      <div
        style={{
          height: totalHeight,
          position: 'relative',
        }}
      >
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = startIndex + index;
            return (
              <div
                key={actualIndex}
                ref={(el) => measureItem(actualIndex, el)}
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Grid Virtual List (for grid layouts)
 */
interface VirtualGridProps<T> {
  items: T[];
  itemWidth: number;
  itemHeight: number;
  containerWidth: number;
  containerHeight: number;
  gap?: number;
  renderItem: (item: T, index: number) => ReactNode;
  overscan?: number;
  className?: string;
}

export function VirtualGrid<T>({
  items,
  itemWidth,
  itemHeight,
  containerWidth,
  containerHeight,
  gap = 0,
  renderItem,
  overscan = 3,
  className = '',
}: VirtualGridProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // Calculate columns
  const columns = Math.floor((containerWidth + gap) / (itemWidth + gap));

  // Calculate rows
  const rows = Math.ceil(items.length / columns);
  const totalHeight = rows * (itemHeight + gap) - gap;

  // Calculate visible range
  const startRow = Math.max(0, Math.floor(scrollTop / (itemHeight + gap)) - overscan);
  const endRow = Math.min(
    rows - 1,
    Math.ceil((scrollTop + containerHeight) / (itemHeight + gap)) + overscan
  );

  const startIndex = startRow * columns;
  const endIndex = Math.min(items.length - 1, (endRow + 1) * columns - 1);

  const visibleItems = items.slice(startIndex, endIndex + 1);

  const offsetY = startRow * (itemHeight + gap);

  const handleScroll = () => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative',
      }}
    >
      <div
        style={{
          height: totalHeight,
          position: 'relative',
        }}
      >
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, ${itemWidth}px)`,
            gap: `${gap}px`,
          }}
        >
          {visibleItems.map((item, index) => (
            <div key={startIndex + index}>{renderItem(item, startIndex + index)}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
