import { 
  GasPump, 
  CurrencyDollar,
  Gauge,
  TrendUp,
  CreditCard,
  MapPin,
  Plus
} from "@phosphor-icons/react"
import { useMemo , useState } from "react"

import { ChartCard } from "@/components/ChartCard"
import { MetricCard } from "@/components/MetricCard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useFleetData } from "@/hooks/use-fleet-data"

interface FuelManagementProps {
  data: ReturnType<typeof useFleetData>
}

export function FuelManagement() {
  const data = useFleetData()
  const transactions = data?.fuelTransactions || []
  const [activeTab, setActiveTab] = useState<string>("records")

  const metrics = useMemo(() => {
    const totalCost = transactions.reduce((sum, t) => sum + (t?.totalCost ?? 0), 0)
    const totalGallons = transactions.reduce((sum, t) => sum + (t?.gallons ?? 0), 0)
    const avgPrice = totalGallons > 0 ? totalCost / totalGallons : 0
    const avgMpg = transactions.length > 0
      ? transactions.reduce((sum, t) => sum + (t?.mpg ?? 0), 0) / transactions.length
      : 0

    return { totalCost, totalGallons, avgPrice, avgMpg }
  }, [transactions])

  const monthlyData = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
    return monthNames.map((name, i) => {
      const monthTransactions = transactions.filter(t => {
        if (!t?.date) return false
        const date = new Date(t.date)
        return date.getMonth() === i
      })
      return {
        name,
        cost: monthTransactions.reduce((sum, t) => sum + (t?.totalCost ?? 0), 0)
      }
    }).filter(d => d.cost > 0)
  }, [transactions])

  const recentTransactions = transactions.slice(0, 20)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Fuel Management</h1>
        <Button aria-label="Action button">
          <Plus className="w-4 h-4 mr-2" />
          Add Transaction
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Fuel Cost"
          value={`$${metrics.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          change={8.3}
          trend="up"
          subtitle="last 90 days"
          icon={<CurrencyDollar className="w-5 h-5" />}
          status="info"
        />
        <MetricCard
          title="Total Gallons"
          value={`${Math.round(metrics.totalGallons).toLocaleString()}`}
          change={5.1}
          trend="up"
          subtitle="consumed"
          icon={<GasPump className="w-5 h-5" />}
          status="info"
        />
        <MetricCard
          title="Avg Price/Gallon"
          value={`$${(metrics?.avgPrice ?? 0).toFixed(2)}`}
          change={2.4}
          trend="down"
          subtitle="trending down"
          icon={<TrendUp className="w-5 h-5" />}
          status="success"
        />
        <MetricCard
          title="Fleet Avg MPG"
          value={`${(metrics?.avgMpg ?? 0).toFixed(1)}`}
          change={1.8}
          trend="up"
          subtitle="improving"
          icon={<Gauge className="w-5 h-5" />}
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

        <TabsContent value="records" className="space-y-6">
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
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vehicle</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Station</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gallons</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Price/Gal</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Cost</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">MPG</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {recentTransactions.map(transaction => (
                    <tr
                      key={transaction?.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {transaction?.date ? new Date(transaction.date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {transaction?.vehicleNumber ?? 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {transaction?.station ?? 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {(transaction?.gallons ?? 0).toFixed(1)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        ${(transaction?.pricePerGallon ?? 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold">
                        ${(transaction?.totalCost ?? 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        {(transaction?.mpg ?? 0).toFixed(1)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge variant="outline" className="text-xs">
                          {transaction?.paymentMethod ?? 'N/A'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <Button variant="ghost" size="sm" aria-label="Action button">
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="cards">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
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
                <MapPin className="w-5 h-5" />
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

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Fuel Consumption by Vehicle Type"
              subtitle="Gallons consumed"
              data={[
                { name: "Sedan", value: 450 },
                { name: "SUV", value: 680 },
                { name: "Truck", value: 920 },
                { name: "Van", value: 540 }
              ]}
              dataKey="value"
              type="bar"
              color="oklch(0.45 0.15 250)"
            />

            <ChartCard
              title="MPG by Vehicle Type"
              subtitle="Fleet efficiency"
              data={[
                { name: "Sedan", mpg: 28 },
                { name: "SUV", mpg: 22 },
                { name: "Truck", mpg: 18 },
                { name: "Van", mpg: 20 }
              ]}
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
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-success/5">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <TrendUp className="w-4 h-4 text-success" />
                    Route Optimization Potential
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Implementing optimized routing could save approximately $2,400/month in fuel costs.
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Bulk Purchasing Agreements</h3>
                  <p className="text-sm text-muted-foreground">
                    Consider negotiating fleet contracts with preferred stations for volume discounts.
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
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
