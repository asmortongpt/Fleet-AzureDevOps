import React from 'react';

import { Card } from "@/components/ui/card";

export function DataWorkbenchMetrics({ metrics }: any) {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {Object.entries(metrics).map(([key, value]) => (
        <Card key={key} className="p-4">
          <div className="text-sm text-muted-foreground">{key}</div>
          <div className="text-2xl font-bold">{String(value)}</div>
        </Card>
      ))}
    </div>
  );
}
