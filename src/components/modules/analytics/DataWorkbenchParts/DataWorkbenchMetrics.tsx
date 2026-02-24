import { Card } from "@/components/ui/card";

interface MetricsProps {
  metrics: Record<string, string | number>;
}

export function DataWorkbenchMetrics({ metrics }: MetricsProps) {
  return (
    <div className="grid grid-cols-4 gap-2 mb-3">
      {Object.entries(metrics ?? {}).map(([key, value]) => (
        <Card key={key} className="p-2">
          <div className="text-sm text-muted-foreground">{key}</div>
          <div className="text-sm font-bold">{String(value)}</div>
        </Card>
      ))}
    </div>
  );
}