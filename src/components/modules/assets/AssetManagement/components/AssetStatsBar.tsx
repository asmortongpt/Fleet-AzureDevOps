import { Package, CurrencyDollar, TrendDown } from "@phosphor-icons/react"

import { Card } from "@/components/ui/card"

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
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
      <Card className="p-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Package className="w-3 h-3 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold">{totalAssets}</p>
            <p className="text-xs text-muted-foreground">Total Assets</p>
          </div>
        </div>
      </Card>

      <Card className="p-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-success/10">
            <Package className="w-3 h-3 text-success" />
          </div>
          <div>
            <p className="text-sm font-bold">{activeAssets}</p>
            <p className="text-xs text-muted-foreground">Active Assets</p>
          </div>
        </div>
      </Card>

      <Card className="p-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-warning/10">
            <TrendDown className="w-3 h-3 text-warning" />
          </div>
          <div>
            <p className="text-sm font-bold">{maintenanceAssets}</p>
            <p className="text-xs text-muted-foreground">In Maintenance</p>
          </div>
        </div>
      </Card>

      <Card className="p-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <CurrencyDollar className="w-3 h-3 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold">${totalValue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Value</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
