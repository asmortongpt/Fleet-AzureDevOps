import { 
  Fuel, 
  DollarSign,
  Gauge,
  TrendingUp,
  CreditCard,
  MapPin,
  Plus
} from "lucide-react"
import { useMemo , useState } from "react"

import { ChartCard } from "@/components/ChartCard"
import { MetricCard } from "@/components/MetricCard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useDrilldown } from "@/contexts/DrilldownContext"
import { useFleetData } from "@/hooks/use-fleet-data"

/** Normalized fuel transaction shape used by this component */
interface NormalizedFuelTransaction {
  id: string
  vehicleId: string
  vehicleNumber: string
  driverId: string
  date: string
  fuelType: string
  gallons: number
  costPerGallon: number
  totalCost: number
  odometer: number
  stationName: string
  stationBrand: string | null
  vendorName: string
  receiptNumber: string
  paymentMethod: string
  isFullFill: boolean | null
  mpg: number
  mpgCalculated: number | null
  vehicleType: string
}

/** Maps raw API response (snake_case) or legacy camelCase to a consistent shape */
function normalizeFuelTransaction(raw: Record<string, unknown>): NormalizedFuelTransaction {
  return {
    id: String(raw.id ?? ''),
    vehicleId: String(raw.vehicle_id ?? raw.vehicleId ?? ''),
    vehicleNumber: String(raw.receipt_number ?? raw.vehicleNumber ?? raw.vehicle_id ?? '').slice(0, 12) || 'N/A',
    driverId: String(raw.driver_id ?? raw.driverId ?? ''),
    date: String(raw.transaction_date ?? raw.date ?? raw.created_at ?? ''),
    fuelType: String(raw.fuel_type ?? raw.fuelType ?? 'unknown'),
    gallons: Number(raw.gallons ?? raw.amount ?? raw.quantity ?? 0),
    costPerGallon: Number(raw.cost_per_gallon ?? raw.price_per_gallon ?? raw.pricePerGallon ?? raw.pricePerUnit ?? 0),
    totalCost: Number(raw.total_cost ?? raw.totalCost ?? raw.cost ?? 0),
    odometer: Number(raw.odometer ?? 0),
    stationName: String(raw.station_name ?? raw.stationName ?? raw.station ?? raw.location ?? 'N/A'),
    stationBrand: raw.station_brand ?? raw.stationBrand ? String(raw.station_brand ?? raw.stationBrand) : null,
    vendorName: String(raw.vendor_name ?? raw.vendorName ?? ''),
    receiptNumber: String(raw.receipt_number ?? raw.receiptNumber ?? ''),
    paymentMethod: String(raw.payment_method ?? raw.paymentMethod ?? 'N/A'),
    isFullFill: raw.is_full_fill != null ? Boolean(raw.is_full_fill) : raw.isFullFill != null ? Boolean(raw.isFullFill) : null,
    mpg: Number(raw.mpg ?? 0),
    mpgCalculated: raw.mpg_calculated != null ? Number(raw.mpg_calculated) : raw.mpgCalculated != null ? Number(raw.mpgCalculated) : null,
    vehicleType: String(raw.vehicle_type ?? raw.vehicleType ?? 'Other'),
  }
}

export function FuelManagement() {
  const data = useFleetData()
  const { push } = useDrilldown()
  const [activeTab, setActiveTab] = useState<string>("records")

  // Normalize all transactions once at the data boundary
  const transactions = useMemo(
    () => (data?.fuelTransactions || []).map((t: Record<string, unknown>) => normalizeFuelTransaction(t)),
    [data?.fuelTransactions]
  )

  const handleTransactionClick = (tx: NormalizedFuelTransaction) => {
    push({
      type: 'fuel-transaction',
      label: `${tx.vehicleNumber} - ${tx.date ? new Date(tx.date).toLocaleDateString() : 'N/A'}`,
      data: { transactionId: tx.id, vehicleNumber: tx.vehicleNumber, totalCost: tx.totalCost }
    })
  }

  const handleVehicleClick = (vehicleId: string) => {
    push({
      type: 'vehicle',
      label: vehicleId,
      data: { vehicleNumber: vehicleId }
    })
  }

  const metrics = useMemo(() => {
    const totalCost = transactions.reduce((sum, t) => sum + t.totalCost, 0)
    const totalGallons = transactions.reduce((sum, t) => sum + t.gallons, 0)
    const avgPrice = totalGallons > 0 ? totalCost / totalGallons : 0
    const txWithMpg = transactions.filter(t => (t.mpgCalculated ?? t.mpg) > 0)
    const avgMpg = txWithMpg.length > 0
      ? txWithMpg.reduce((sum, t) => sum + (t.mpgCalculated ?? t.mpg), 0) / txWithMpg.length
      : 0

    return { totalCost, totalGallons, avgPrice, avgMpg }
  }, [transactions])

  const monthlyData = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return monthNames.map((name, i) => {
      const monthTx = transactions.filter(t => {
        if (!t.date) return false
        return new Date(t.date).getMonth() === i
      })
      return {
        name,
        cost: monthTx.reduce((sum, t) => sum + t.totalCost, 0)
      }
    }).filter(d => d.cost > 0)
  }, [transactions])

  const recentTransactions = transactions.slice(0, 20)

  const fuelByType = useMemo(() => {
    const typeMap: Record<string, { gallons: number; totalMpg: number; count: number }> = {}
    transactions.forEach(t => {
      if (!typeMap[t.vehicleType]) typeMap[t.vehicleType] = { gallons: 0, totalMpg: 0, count: 0 }
      typeMap[t.vehicleType].gallons += t.gallons
      const mpg = t.mpgCalculated ?? t.mpg
      if (mpg > 0) {
        typeMap[t.vehicleType].totalMpg += mpg
        typeMap[t.vehicleType].count += 1
      }
    })
    return Object.entries(typeMap).map(([name, v]) => ({
      name,
      value: Math.round(v.gallons),
      mpg: v.count > 0 ? Math.round((v.totalMpg / v.count) * 10) / 10 : 0,
    }))
  }, [transactions])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold tracking-tight">Fuel Management</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Transaction
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        <MetricCard
          title="Total Fuel Cost"
          value={`$${Number(metrics.totalCost || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          change={8.3}
          trend="up"
          subtitle="last 90 days"
          icon={<DollarSign className="w-3 h-3" />}
          status="info"
        />
        <MetricCard
          title="Total Gallons"
          value={`${Math.round(Number(metrics.totalGallons || 0)).toLocaleString()}`}
          change={5.1}
          trend="up"
          subtitle="consumed"
          icon={<Fuel className="w-3 h-3" />}
          status="info"
        />
        <MetricCard
          title="Avg Price/Gallon"
          value={`$${Number(metrics?.avgPrice || 0).toFixed(2)}`}
          change={2.4}
          trend="down"
          subtitle="trending down"
          icon={<TrendingUp className="w-3 h-3" />}
          status="success"
        />
        <MetricCard
          title="Fleet Avg MPG"
          value={`${Number(metrics?.avgMpg || 0).toFixed(1)}`}
          change={1.8}
          trend="up"
          subtitle="improving"
          icon={<Gauge className="w-3 h-3" />}
          status="success"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="records">Records</TabsTrigger>
          <TabsTrigger value="cards">Fleet Cards</TabsTrigger>
          <TabsTrigger value="stations">Stations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="optimization">Cost Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="space-y-2">
          <ChartCard
            title="Monthly Fuel Costs"
            subtitle="Fuel expenditure trend"
            data={monthlyData}
            dataKey="cost"
            type="bar"
            color="oklch(0.65 0.15 160)"
            height={250}
          />

          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-2 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="px-2 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vehicle</th>
                    <th className="px-2 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Station</th>
                    <th className="px-2 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Brand</th>
                    <th className="px-2 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gallons</th>
                    <th className="px-2 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fill</th>
                    <th className="px-2 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Price/Gal</th>
                    <th className="px-2 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Cost</th>
                    <th className="px-2 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">MPG</th>
                    <th className="px-2 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Calc MPG</th>
                    <th className="px-2 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment</th>
                    <th className="px-2 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {recentTransactions.map(tx => {
                    const mpgVal = tx.mpgCalculated
                    const mpgColor = mpgVal != null
                      ? mpgVal >= 25
                        ? "text-green-500 bg-green-500/10 border-green-500/20"
                        : mpgVal >= 15
                          ? "text-yellow-500 bg-yellow-500/10 border-yellow-500/20"
                          : "text-red-500 bg-red-500/10 border-red-500/20"
                      : ""

                    return (
                    <tr
                      key={tx.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => handleTransactionClick(tx)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && handleTransactionClick(tx)}
                    >
                      <td className="px-2 py-3 text-sm text-muted-foreground">
                        {tx.date ? new Date(tx.date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td
                        className="px-2 py-3 text-sm font-medium text-primary hover:underline"
                        onClick={(e) => { e.stopPropagation(); handleVehicleClick(tx.vehicleId) }}
                      >
                        {tx.vehicleNumber}
                      </td>
                      <td className="px-2 py-3 text-sm text-muted-foreground">
                        {tx.stationName}
                      </td>
                      <td className="px-2 py-3 text-sm">
                        {tx.stationBrand ? (
                          <Badge variant="outline" className="text-xs">
                            {tx.stationBrand}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">--</span>
                        )}
                      </td>
                      <td className="px-2 py-3 text-sm text-right">
                        {tx.gallons.toFixed(1)}
                      </td>
                      <td className="px-2 py-3 text-sm text-center">
                        {tx.isFullFill != null ? (
                          <Badge
                            variant="outline"
                            className={tx.isFullFill
                              ? "text-xs bg-green-500/10 text-green-500 border-green-500/20"
                              : "text-xs bg-gray-500/10 text-gray-400 border-gray-500/20"
                            }
                          >
                            {tx.isFullFill ? "Full" : "Partial"}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">--</span>
                        )}
                      </td>
                      <td className="px-2 py-3 text-sm text-right">
                        ${tx.costPerGallon.toFixed(2)}
                      </td>
                      <td className="px-2 py-3 text-sm text-right font-semibold">
                        ${tx.totalCost.toFixed(2)}
                      </td>
                      <td className="px-2 py-3 text-sm text-right font-medium">
                        {(tx.mpgCalculated ?? tx.mpg).toFixed(1)}
                      </td>
                      <td className="px-2 py-3 text-sm text-right">
                        {mpgVal != null ? (
                          <Badge variant="outline" className={`text-xs ${mpgColor}`}>
                            {mpgVal.toFixed(1)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">--</span>
                        )}
                      </td>
                      <td className="px-2 py-3 text-sm">
                        <Badge variant="outline" className="text-xs">
                          {tx.paymentMethod}
                        </Badge>
                      </td>
                      <td className="px-2 py-3 text-sm text-right">
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="cards">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-3 h-3" />
                Fleet Card Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Manage fleet fuel cards, track card usage, set spending limits, and monitor transactions.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-3 h-3" />
                Preferred Fueling Stations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Configure preferred fueling locations, negotiate bulk pricing, and track station performance.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            <ChartCard
              title="Fuel Consumption by Vehicle Type"
              subtitle="Gallons consumed"
              data={fuelByType.length > 0 ? fuelByType : [{ name: "No Data", value: 0 }]}
              dataKey="value"
              type="bar"
              color="oklch(0.45 0.15 250)"
            />

            <ChartCard
              title="MPG by Vehicle Type"
              subtitle="Fleet efficiency"
              data={fuelByType.length > 0 ? fuelByType : [{ name: "No Data", mpg: 0 }]}
              dataKey="mpg"
              type="bar"
              color="oklch(0.55 0.18 290)"
            />
          </div>
        </TabsContent>

        <TabsContent value="optimization">
          <Card>
            <CardHeader>
              <CardTitle>Fuel Cost Optimization Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="p-2 border rounded-lg bg-success/5">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-success" />
                    Route Optimization Potential
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Implementing optimized routing could save approximately $2,400/month in fuel costs.
                  </p>
                </div>
                <div className="p-2 border rounded-lg">
                  <h3 className="font-semibold mb-2">Bulk Purchasing Agreements</h3>
                  <p className="text-sm text-muted-foreground">
                    Consider negotiating fleet contracts with preferred stations for volume discounts.
                  </p>
                </div>
                <div className="p-2 border rounded-lg">
                  <h3 className="font-semibold mb-2">Vehicle Replacement Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    12 vehicles in the fleet have below-average fuel efficiency and may be candidates for replacement.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
