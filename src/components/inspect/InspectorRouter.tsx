import React from "react";
import { InspectTarget } from "@/services/inspect/types";

type Props = {
  target: InspectTarget;
};

export const InspectorRouter: React.FC<Props> = ({ target }) => {
  // This will be expanded with actual inspectors in future phases
  // For now, just show a placeholder for each type

  const renderPlaceholder = () => {
    return (
      <div className="p-4 bg-muted rounded-md">
        <p className="text-sm text-muted-foreground">
          Inspector for <strong>{target.type}</strong> with ID: <strong>{target.id}</strong>
        </p>
        {target.tab && (
          <p className="text-sm text-muted-foreground mt-2">
            Tab: <strong>{target.tab}</strong>
          </p>
        )}
        {target.focusMetric && (
          <p className="text-sm text-muted-foreground mt-2">
            Focus Metric: <strong>{target.focusMetric}</strong>
          </p>
        )}
        <p className="text-sm text-muted-foreground mt-4">
          Inspector component will be implemented in Phase 2.
        </p>
      </div>
    );
  };

  switch (target.type) {
    case "vehicle":
    case "driver":
    case "trip":
    case "route":
    case "alert":
    case "task":
    case "dispatch":
      return renderPlaceholder();
    default:
      return (
        <div className="p-4 bg-destructive/10 rounded-md">
          <p className="text-sm text-destructive">Unknown inspect type: {target.type}</p>
        </div>
      );
  }
};
