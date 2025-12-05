import { Package, CurrencyDollar, TrendDown } from "@phosphor-icons/react"
import { MetricsBar } from "@/components/shared/MetricCard"

interface AssetStatsBarProps {
  totalAssets: number
  activeAssets: number
  maintenanceAssets: number
  totalValue: number
}

export function AssetStatsBar({
  totalAssets,
  activeAssets,
  maintenanceAssets,
  totalValue
}: AssetStatsBarProps) {
  const metrics = [
    {
      label: "Total Assets",
      value: totalAssets,
      icon: <Package className="w-5 h-5" />,
      variant: "primary" as const
    },
    {
      label: "Active Assets",
      value: activeAssets,
      icon: <Package className="w-5 h-5" />,
      variant: "success" as const
    },
    {
      label: "In Maintenance",
      value: maintenanceAssets,
      icon: <TrendDown className="w-5 h-5" />,
      variant: "warning" as const
    },
    {
      label: "Total Value",
      value: `$${totalValue.toLocaleString()}`,
      icon: <CurrencyDollar className="w-5 h-5" />,
      variant: "primary" as const
    }
  ]

  return <MetricsBar metrics={metrics} columns={{ base: 1, sm: 2, lg: 4 }} />
}
