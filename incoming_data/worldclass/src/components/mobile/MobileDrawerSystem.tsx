import { GripHorizontal } from 'lucide-react';
import { useState, useRef, ReactNode } from 'react';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

type SnapPoint = 'collapsed' | 'half' | 'full';

interface MobileDrawerSystemProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
  children: ReactNode;
  defaultSnapPoint?: SnapPoint;
  onSnapPointChange?: (snapPoint: SnapPoint) => void;
  showHandle?: boolean;
  className?: string;
}

export function MobileDrawerSystem({
  open = false,
  onOpenChange,
  title,
  description,
  children,
  defaultSnapPoint = 'half',
  onSnapPointChange,
  showHandle = true,
  className
}: MobileDrawerSystemProps) {
  const [snapPoint, setSnapPoint] = useState<SnapPoint>(defaultSnapPoint);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Height percentages for each snap point
  const snapHeights = {
    collapsed: '25vh',
    half: '50vh',
    full: '85vh'
  };

  const handleSnapPointChange = (newSnapPoint: SnapPoint) => {
    setSnapPoint(newSnapPoint);
    onSnapPointChange?.(newSnapPoint);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;

    const deltaY = currentY - startY;
    const threshold = 50; // Minimum swipe distance

    if (Math.abs(deltaY) > threshold) {
      if (deltaY > 0) {
        // Swipe down - collapse or close
        if (snapPoint === 'full') {
          handleSnapPointChange('half');
        } else if (snapPoint === 'half') {
          handleSnapPointChange('collapsed');
        } else {
          onOpenChange?.(false);
        }
      } else {
        // Swipe up - expand
        if (snapPoint === 'collapsed') {
          handleSnapPointChange('half');
        } else if (snapPoint === 'half') {
          handleSnapPointChange('full');
        }
      }
    }

    setIsDragging(false);
    setStartY(0);
    setCurrentY(0);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={cn(
          'p-0 overflow-hidden transition-all duration-300 ease-out',
          className
        )}
        style={{
          height: snapHeights[snapPoint],
          maxHeight: '95vh'
        }}
        data-testid="mobile-drawer-system"
        data-snap-point={snapPoint}
      >
        {/* Swipe Handle */}
        {showHandle && (
          <div
            className="flex items-center justify-center py-3 cursor-grab active:cursor-grabbing touch-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            data-testid="drawer-handle"
          >
            <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
          </div>
        )}

        {/* Header */}
        {(title || description) && (
          <SheetHeader className="px-4 pb-4 pt-2">
            {title && <SheetTitle>{title}</SheetTitle>}
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
        )}

        {/* Content with scroll */}
        <div
          ref={contentRef}
          className="overflow-y-auto px-4 pb-4"
          style={{
            height: showHandle || title || description
              ? `calc(${snapHeights[snapPoint]} - ${showHandle ? '3rem' : '0px'} - ${title || description ? '3rem' : '0px'})`
              : snapHeights[snapPoint]
          }}
          data-testid="drawer-content"
        >
          {children}
        </div>

        {/* Snap Point Indicators (optional visual feedback) */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1">
          {(['full', 'half', 'collapsed'] as SnapPoint[]).map((point) => (
            <button
              key={point}
              className={cn(
                'w-1.5 h-1.5 rounded-full transition-all',
                snapPoint === point ? 'bg-blue-500' : 'bg-slate-300'
              )}
              onClick={() => handleSnapPointChange(point)}
              aria-label={`Snap to ${point}`}
              data-testid={`snap-point-${point}`}
            />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Simplified version for basic use cases
interface SimpleMobileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: ReactNode;
  height?: string;
}

export function SimpleMobileDrawer({
  open,
  onOpenChange,
  title,
  children,
  height = '80vh'
}: SimpleMobileDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-auto max-h-[90vh] overflow-hidden"
        style={{ height }}
        data-testid="simple-mobile-drawer"
      >
        {/* Handle */}
        <div className="flex items-center justify-center py-3">
          <GripHorizontal className="h-5 w-5 text-slate-300" />
        </div>

        {title && (
          <SheetHeader className="px-4 pb-4">
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
        )}

        <div className="overflow-y-auto px-4 pb-4" style={{ maxHeight: `calc(${height} - 5rem)` }}>
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Hook for programmatic control
export function useMobileDrawer(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);
  const [snapPoint, setSnapPoint] = useState<SnapPoint>('half');

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen(!isOpen);

  const expandToFull = () => setSnapPoint('full');
  const collapseToHalf = () => setSnapPoint('half');
  const minimizeToCollapsed = () => setSnapPoint('collapsed');

  return {
    isOpen,
    setIsOpen,
    open,
    close,
    toggle,
    snapPoint,
    setSnapPoint,
    expandToFull,
    collapseToHalf,
    minimizeToCollapsed
  };
}