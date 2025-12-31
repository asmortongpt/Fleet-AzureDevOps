import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InspectTarget } from "@/services/inspect/types";

type Props = {
  target: InspectTarget;
};

export const InspectorRouter: React.FC<Props> = ({ target }) => {
  const renderEntityInspector = () => {
    const entityTypeLabels: Record<string, string> = {
      vehicle: "Vehicle",
      driver: "Driver",
      trip: "Trip",
      route: "Route",
      alert: "Alert",
      task: "Task",
      dispatch: "Dispatch"
    };

    return (
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            {entityTypeLabels[target.type] || target.type} Inspector
            <Badge variant="outline">ID: {target.id}</Badge>
          </h2>
          <p className="text-muted-foreground mt-1">
            Detailed view for {entityTypeLabels[target.type]?.toLowerCase() || target.type} #{target.id}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Entity Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Type</dt>
                <dd className="text-lg font-semibold">{entityTypeLabels[target.type] || target.type}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">ID</dt>
                <dd className="text-lg font-semibold">{target.id}</dd>
              </div>
              {target.tab && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Active Tab</dt>
                  <dd className="text-lg">{target.tab}</dd>
                </div>
              )}
              {target.focusMetric && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Focus Metric</dt>
                  <dd className="text-lg">{target.focusMetric}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Use the navigation above to access detailed information, history, and analytics for this {entityTypeLabels[target.type]?.toLowerCase() || target.type}.
            </p>
          </CardContent>
        </Card>
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
      return renderEntityInspector();
    default:
      return (
        <div className="p-4 bg-destructive/10 rounded-md">
          <p className="text-sm text-destructive">Unknown inspect type: {target.type}</p>
        </div>
      );
  }
};
