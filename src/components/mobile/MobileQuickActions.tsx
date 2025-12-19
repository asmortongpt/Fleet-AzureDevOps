import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useRef, ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive';
  disabled?: boolean;
  badge?: string | number;
}

interface MobileQuickActionsProps {
  actions: QuickAction[];
  title?: string;
  className?: string;
  layout?: 'horizontal-scroll' | 'grid';
  columns?: 2 | 3 | 4;
}

export function MobileQuickActions({
  actions,
  title,
  className,
  layout = 'horizontal-scroll',
  columns = 2
}: MobileQuickActionsProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollAmount = container.offsetWidth * 0.8;

    if (direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleScrollEvent = () => {
    if (scrollContainerRef.current) {
      setScrollPosition(scrollContainerRef.current.scrollLeft);
    }
  };

  const showLeftArrow = scrollPosition > 10;
  const showRightArrow = scrollContainerRef.current
    ? scrollPosition < scrollContainerRef.current.scrollWidth - scrollContainerRef.current.offsetWidth - 10
    : false;

  if (layout === 'grid') {
    return (
      <div className={cn('space-y-3', className)} data-testid="mobile-quick-actions-grid">
        {title && (
          <h3 className="text-sm font-semibold text-slate-700 px-1">{title}</h3>
        )}
        <div
          className={cn(
            'grid gap-2',
            columns === 2 && 'grid-cols-2',
            columns === 3 && 'grid-cols-3',
            columns === 4 && 'grid-cols-4'
          )}
        >
          {actions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant || 'outline'}
              size="lg"
              onClick={action.onClick}
              disabled={action.disabled}
              className={cn(
                'h-20 flex flex-col items-center justify-center gap-2 relative',
                'active:scale-95 transition-all touch-manipulation'
              )}
              data-testid={`quick-action-${action.id}`}
            >
              <div className="text-slate-600">{action.icon}</div>
              <span className="text-xs font-medium leading-tight text-center">
                {action.label}
              </span>
              {action.badge && (
                <div className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {action.badge}
                </div>
              )}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative space-y-2', className)} data-testid="mobile-quick-actions-scroll">
      {title && (
        <h3 className="text-sm font-semibold text-slate-700 px-1">{title}</h3>
      )}

      <div className="relative">
        {/* Left scroll indicator */}
        {showLeftArrow && (
          <button
            onClick={() => handleScroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg"
            aria-label="Scroll left"
            data-testid="scroll-left"
          >
            <ChevronLeft className="h-5 w-5 text-slate-700" />
          </button>
        )}

        {/* Scrollable container */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScrollEvent}
          className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-1 py-2"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {actions.map((action) => (
            <Card
              key={action.id}
              className={cn(
                'flex-shrink-0 snap-start',
                'w-28 sm:w-32',
                action.disabled && 'opacity-50 pointer-events-none'
              )}
            >
              <CardContent className="p-0">
                <button
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className="w-full h-full p-4 flex flex-col items-center justify-center gap-2 relative active:scale-95 transition-all touch-manipulation"
                  data-testid={`quick-action-${action.id}`}
                >
                  <div className="text-slate-600">{action.icon}</div>
                  <span className="text-xs font-medium text-center leading-tight">
                    {action.label}
                  </span>
                  {action.badge && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {action.badge}
                    </div>
                  )}
                </button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Right scroll indicator */}
        {showRightArrow && (
          <button
            onClick={() => handleScroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg"
            aria-label="Scroll right"
            data-testid="scroll-right"
          >
            <ChevronRight className="h-5 w-5 text-slate-700" />
          </button>
        )}
      </div>
    </div>
  );
}

// Swipeable action buttons (like iOS swipe actions)
interface SwipeAction {
  id: string;
  label: string;
  icon?: ReactNode;
  color: 'blue' | 'red' | 'green' | 'yellow' | 'gray';
  onClick: () => void;
}

interface SwipeableActionCardProps {
  children: ReactNode;
  actions: SwipeAction[];
  threshold?: number;
  className?: string;
}

export function SwipeableActionCard({
  children,
  actions,
  threshold = 80,
  className
}: SwipeableActionCardProps) {
  const [offset, setOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);

  const colorClasses = {
    blue: 'bg-blue-500 text-white',
    red: 'bg-red-500 text-white',
    green: 'bg-green-500 text-white',
    yellow: 'bg-yellow-500 text-white',
    gray: 'bg-gray-500 text-white'
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;

    // Only allow left swipe
    if (diff < 0) {
      setOffset(Math.max(diff, -actions.length * 80));
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);

    if (offset < -threshold) {
      setOffset(-actions.length * 80); // Snap to show actions
    } else {
      setOffset(0); // Snap back
    }
  };

  const handleActionClick = (action: SwipeAction) => {
    action.onClick();
    setOffset(0); // Reset swipe
  };

  return (
    <div className={cn('relative overflow-hidden', className)} data-testid="swipeable-action-card">
      {/* Hidden action buttons */}
      <div className="absolute right-0 top-0 bottom-0 flex">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => handleActionClick(action)}
            className={cn(
              'w-20 flex flex-col items-center justify-center gap-1 text-sm font-medium',
              'active:opacity-80 transition-opacity touch-manipulation',
              colorClasses[action.color]
            )}
            data-testid={`swipe-action-${action.id}`}
          >
            {action.icon && <div>{action.icon}</div>}
            <span className="text-xs">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Swipeable content */}
      <div
        className="bg-white transition-transform duration-200 ease-out touch-none"
        style={{
          transform: `translateX(${offset}px)`
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
