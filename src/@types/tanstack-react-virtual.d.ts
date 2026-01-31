declare module '@tanstack/react-virtual' {
  
export interface VirtualItem {
    index: number;
    start: number;
    end: number;
    size: number;
    key: string | number;
  }

  export interface VirtualizerOptions<TScrollElement extends Element = Element, TItemElement extends Element = Element> {
    count: number;
    getScrollElement: () => TScrollElement | null;
    estimateSize: (index: number) => number;
    overscan?: number;
    horizontal?: boolean;
    paddingStart?: number;
    paddingEnd?: number;
    scrollPaddingStart?: number;
    scrollPaddingEnd?: number;
    initialOffset?: number;
    getItemKey?: (index: number) => string | number;
    rangeExtractor?: (range: Range) => number[];
    scrollMargin?: number;
    measureElement?: (element: TItemElement, entry: ResizeObserverEntry | undefined, instance: Virtualizer<TScrollElement, TItemElement>) => number;
    initialRect?: { width: number; height: number };
    onChange?: (instance: Virtualizer<TScrollElement, TItemElement>) => void;
    lanes?: number;
    isScrollingResetDelay?: number;
    enabled?: boolean;
    isRtl?: boolean;
  }

  export interface Range {
    startIndex: number;
    endIndex: number;
    overscan: number;
    count: number;
  }

  export interface Virtualizer<TScrollElement extends Element = Element, TItemElement extends Element = Element> {
    options: VirtualizerOptions<TScrollElement, TItemElement>;
    scrollElement: TScrollElement | null;
    isScrolling: boolean;
    scrollDirection: 'forward' | 'backward' | null;
    scrollOffset: number;
    scrollRect: { width: number; height: number };
    getVirtualItems: () => VirtualItem[];
    getTotalSize: () => number;
    scrollToOffset: (offset: number, options?: { align?: 'start' | 'center' | 'end' | 'auto'; behavior?: 'auto' | 'smooth' }) => void;
    scrollToIndex: (index: number, options?: { align?: 'start' | 'center' | 'end' | 'auto'; behavior?: 'auto' | 'smooth' }) => void;
    scrollBy: (delta: number, options?: { behavior?: 'auto' | 'smooth' }) => void;
    getTotalSize: () => number;
    measure: () => void;
    measureElement: (element: TItemElement | null) => void;
    getOffsetForIndex: (index: number, align?: 'start' | 'center' | 'end' | 'auto') => number;
    getOffsetForAlignment: (toOffset: number, align: 'start' | 'center' | 'end' | 'auto') => number;
    isDynamicMode: () => boolean;
    calculateRange: () => Range;
    getIndexes: () => number[];
    indexFromElement: (element: TItemElement) => number;
    resizeItem: (index: number, size: number) => void;
    resetAfterIndex: (index: number, shouldForceUpdate?: boolean) => void;
    resetAfterElement: (element: TItemElement, shouldForceUpdate?: boolean) => void;
    getVirtualItemForOffset: (offset: number) => VirtualItem;
    getOffsetForIndexFn: (index: number, align?: 'start' | 'center' | 'end' | 'auto') => number;
    shouldAdjustScrollPositionOnItemSizeChange: (item: VirtualItem, previousSize: number, nextSize: number) => boolean;
  }

  export function useVirtualizer<TScrollElement extends Element = Element, TItemElement extends Element = Element>(
    options: VirtualizerOptions<TScrollElement, TItemElement>
  ): Virtualizer<TScrollElement, TItemElement>;

  export const defaultRangeExtractor: (range: Range) => number[];
}