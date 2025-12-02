import React from "react";
import { useInspect } from "@/services/inspect/InspectContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { InspectorRouter } from "./InspectorRouter";

export const InspectDrawer: React.FC = () => {
  const { target, closeInspect } = useInspect();

  return (
    <Sheet open={!!target} onOpenChange={(open) => !open && closeInspect()}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        {target && (
          <>
            <SheetHeader>
              <SheetTitle>
                {target.type.charAt(0).toUpperCase() + target.type.slice(1)} Details
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <InspectorRouter target={target} />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
