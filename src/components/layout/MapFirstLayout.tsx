import { ReactNode } from 'react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

interface MapFirstLayoutProps {
  mapComponent: ReactNode;
  sidePanel: ReactNode;
  drawerContent?: ReactNode;
}

export function MapFirstLayout({
  mapComponent,
  sidePanel,
  drawerContent,
}: MapFirstLayoutProps) {
  return (
    <div
      className="flex flex-col lg:flex-row h-screen w-full overflow-hidden"
      data-testid="map-first-layout"
    >
      {/* Map Section - 70% on desktop, 50vh on mobile */}
      <div className="w-full lg:w-[70%] h-[50vh] lg:h-full bg-slate-100 relative">
        {mapComponent}
      </div>

      {/* Side Panel - 30% on desktop, 50vh on mobile */}
      <div className="w-full lg:w-[30%] h-[50vh] lg:h-full bg-white shadow-lg overflow-y-auto">
        <div className="p-6">
          {sidePanel}
        </div>

        {/* Drawer trigger for mobile - shows detailed content */}
        {drawerContent && (
          <div className="lg:hidden p-4 border-t">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full"
                  data-testid="map-drawer-trigger"
                >
                  View Details
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh]">
                <div className="mt-4 overflow-y-auto h-full">
                  {drawerContent}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        )}
      </div>
    </div>
  );
}
