import React from "react";
import { useInspect } from "@/services/inspect/InspectContext";
import { Button } from "@/components/ui/button";

/**
 * Test component to verify the inspect system works
 * Can be removed after testing
 */
export const InspectTestButton: React.FC = () => {
  const { openInspect } = useInspect();

  return (
    <Button
      onClick={() => {
        openInspect({
          type: "vehicle",
          id: "test-vehicle-123",
          tab: "overview",
        });
      }}
      variant="outline"
      size="sm"
    >
      Test Inspect System
    </Button>
  );
};
