import { InfoIcon, Copy } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

interface CalculationTooltipProps {
  metricName: string;
  value: number | string;
  formula?: string;
  inputs?: Record<string, number>;
  dataSource?: string;
  lastUpdated?: Date | string;
}

export default function CalculationTooltip({
  metricName,
  value,
  formula = 'Calculated value',
  inputs = {},
  dataSource = 'Real-time data',
  lastUpdated = new Date()
}: CalculationTooltipProps) {
  
  const copyFormula = () => {
    navigator.clipboard.writeText(formula);
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString();
  };

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
          <InfoIcon className="h-3 w-3 text-muted-foreground" />
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80" side="top">
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-sm mb-1">{metricName}</h4>
            <p className="text-2xl font-bold">{value}</p>
          </div>

          <div className="border-t pt-2">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Calculation Formula</p>
                <code className="text-xs bg-muted px-2 py-1 rounded block font-mono">
                  {formula}
                </code>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 ml-2"
                onClick={copyFormula}
                title="Copy formula"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {Object.keys(inputs).length > 0 && (
            <div className="border-t pt-2">
              <p className="text-xs text-muted-foreground mb-2">Input Values</p>
              <div className="space-y-1">
                {Object.entries(inputs).map(([key, val]) => (
                  <div key={key} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{key}:</span>
                    <span className="font-mono font-semibold">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t pt-2 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Data Source:</span>
              <span className="font-medium">{dataSource}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Last Updated:</span>
              <span className="font-medium">{formatDate(lastUpdated)}</span>
            </div>
          </div>

          <div className="text-xs text-muted-foreground italic pt-1 border-t">
            Hover over any metric to see how it's calculated
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

// Example usage component
export function UtilizationMetric({ activeHours, totalHours }: { activeHours: number, totalHours: number }) {
  const utilization = totalHours > 0 ? (activeHours / totalHours * 100).toFixed(1) : 0;
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-2xl font-bold">{utilization}%</span>
      <CalculationTooltip
        metricName="Vehicle Utilization Rate"
        value={`${utilization}%`}
        formula="Utilization = (Active Hours / Total Hours) × 100"
        inputs={{
          'Active Hours': activeHours,
          'Total Hours': totalHours,
        }}
        dataSource="GPS Tracking + Ignition Data"
        lastUpdated={new Date()}
      />
    </div>
  );
}
