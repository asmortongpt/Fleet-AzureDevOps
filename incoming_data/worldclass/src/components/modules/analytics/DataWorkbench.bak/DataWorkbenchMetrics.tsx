import { Card } from "@/components/ui/card";

interface MetricsProps {
  metrics: Record<string, string | number>;
}

export function DataWorkbenchMetrics({ metrics }: MetricsProps) {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {Object.entries(metrics ?? {}).map(([key, value]) => (
        <Card key={key} className="p-4">
          <div className="text-sm text-muted-foreground">{key}</div>
          <div className="text-2xl font-bold">{String(value)}</div>
        </Card>
      ))}
    </div>
  );
}