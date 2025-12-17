import { ReactNode, useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronUp, Maximize2 } from "lucide-react";
import { cn } from '@/lib/utils';
import { MobileDrawerSystem } from '@/components/mobile/MobileDrawerSystem';

interface MapFirstLayoutProps {
  mapComponent: ReactNode;
  sidePanel: ReactNode;
  drawerContent?: ReactNode;
  mapControls?: ReactNode;
  mapRatio?: number; // Percentage of width for map on desktop (default 70)
}

export function MapFirstLayout({
  mapComponent,
  sidePanel,
  drawerContent,
  mapControls,
  mapRatio = 70,
}: MapFirstLayoutProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);

  const sidePanelRatio = 100 - mapRatio;

  return (
    <div
      className="flex flex-col md:flex-row h-screen w-full overflow-hidden bg-slate-50"
      data-testid="map-first-layout"
    >
      {/* Map Section - Responsive breakpoints */}
      <div
        className={cn(
          'relative bg-slate-100',
          // Mobile (320px-767px): Split screen or fullscreen
          isMapFullscreen
            ? 'fixed inset-0 z-50 w-full h-full'
            : 'w-full h-[45vh] sm:h-[50vh]',
          // Tablet (768px-1023px): 60/40 split
          'md:h-full md:w-[60%]',
          // Desktop (1024px+): Custom ratio
          'lg:w-[70%]'
        )}
        style={{
          width: isMapFullscreen ? '100%' : undefined,
          // Override width on large screens with custom ratio
          ...(window.innerWidth >= 1024 && !isMapFullscreen ? { width: `${mapRatio}%` } : {})
        }}
        data-testid="map-section"
      >
        {mapComponent}

        {/* Map Controls Overlay */}
        {mapControls && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="pointer-events-auto">
              {mapControls}
            </div>
          </div>
        )}

        {/* Fullscreen Toggle - Mobile/Tablet Only */}
        <div className="lg:hidden absolute top-4 right-4 z-40">
          <Button
            variant="default"
            size="icon"
            onClick={() => setIsMapFullscreen(!isMapFullscreen)}
            className="h-10 w-10 rounded-full shadow-lg bg-white text-slate-900 hover:bg-slate-100"
            data-testid="map-fullscreen-toggle"
          >
            <Maximize2 className="h-5 w-5" />
          </Button>
        </div>

        {/* Quick Access to Side Panel - Mobile Only */}
        {!isMapFullscreen && (
          <div className="md:hidden absolute bottom-4 left-1/2 -translate-x-1/2 z-40">
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsDrawerOpen(true)}
              className="shadow-lg rounded-full px-4 h-10"
              data-testid="open-drawer-btn"
            >
              <ChevronUp className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </div>
        )}
      </div>

      {/* Side Panel - Desktop/Tablet */}
      <div
        className={cn(
          'bg-white shadow-lg overflow-hidden',
          // Mobile: Hidden (drawer instead)
          'hidden md:flex md:flex-col',
          // Tablet: 40% width
          'md:w-[40%]',
          // Desktop: Custom ratio
          'lg:w-[30%]'
        )}
        style={{
          // Override width on large screens with custom ratio
          ...(window.innerWidth >= 1024 ? { width: `${sidePanelRatio}%` } : {})
        }}
        data-testid="side-panel-desktop"
      >
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-5 lg:p-6">
            {sidePanel}
          </div>
        </div>

        {/* Extended Details - Desktop Only */}
        {drawerContent && (
          <div className="hidden lg:block border-t border-slate-200 p-4 bg-slate-50">
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer list-none font-semibold text-sm">
                <span>Extended Details</span>
                <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
              </summary>
              <div className="mt-3 text-sm">
                {drawerContent}
              </div>
            </details>
          </div>
        )}
      </div>

      {/* Mobile Drawer - Mobile Only */}
      <MobileDrawerSystem
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        title="Fleet Details"
        defaultSnapPoint="half"
        className="md:hidden"
      >
        <div className="space-y-4">
          {sidePanel}
          {drawerContent && (
            <>
              <div className="border-t border-slate-200 my-4" />
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Additional Details</h3>
                {drawerContent}
              </div>
            </>
          )}
        </div>
      </MobileDrawerSystem>
    </div>
  );
}
