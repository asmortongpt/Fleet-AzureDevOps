import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import React from "react";

import { cn } from "@/lib/utils";

export interface KPIMetric {
  id: string;
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
    isPositive?: boolean;
  };
  color?: string;
  onClick?: () => void;
}

interface KPIStripProps {
  metrics: KPIMetric[];
  className?: string;
  compact?: boolean;
}

export const KPIStrip: React.FC<KPIStripProps> = ({
  metrics,
  className,
  compact = true
}) => {
  const getTrendIcon = (trend: KPIMetric["trend"]) => {
    if (!trend) return null;

    const color = trend.isPositive
      ? "text-green-500"
      : trend.isPositive === false
        ? "text-red-500"
        : "text-gray-500";

    switch (trend.direction) {
      case "up":
        return <TrendingUp className={cn("w-3 h-3", color)} />;
      case "down":
        return <TrendingDown className={cn("w-3 h-3", color)} />;
      default:
        return <Minus className={cn("w-3 h-3", color)} />;
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 p-2 bg-background border rounded-lg overflow-x-auto",
        compact ? "h-16" : "h-20",
        className
      )}
    >
      {metrics.map((metric, index) => (
        <React.Fragment key={metric.id}>
          <div
            className={cn(
              "flex items-center gap-3 px-3 min-w-fit",
              metric.onClick && "cursor-pointer hover:bg-accent/50 rounded-md transition-colors",
              compact ? "py-1" : "py-2"
            )}
            onClick={metric.onClick}
          >
            {/* Icon */}
            <div className={cn("flex-shrink-0", metric.color)}>
              {metric.icon}
            </div>

            {/* Value and Label */}
            <div className="flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-1">
                <span className={cn(
                  "font-bold tabular-nums",
                  compact ? "text-lg" : "text-xl"
                )}>
                  {metric.value}
                </span>
                {metric.trend && (
                  <div className="flex items-center gap-0.5">
                    {getTrendIcon(metric.trend)}
                    <span className={cn(
                      "text-xs tabular-nums",
                      metric.trend.isPositive
                        ? "text-green-500"
                        : metric.trend.isPositive === false
                          ? "text-red-500"
                          : "text-gray-500"
                    )}>
                      {Math.abs(metric.trend.value)}%
                    </span>
                  </div>
                )}
              </div>
              <span className={cn(
                "text-muted-foreground truncate",
                compact ? "text-xs" : "text-sm"
              )}>
                {metric.label}
              </span>
            </div>
          </div>

          {/* Separator */}
          {index < metrics.length - 1 && (
            <div className="h-10 w-px bg-border flex-shrink-0" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};