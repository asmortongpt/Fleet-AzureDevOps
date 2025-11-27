import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { KPIStrip, KPIMetric } from "@/components/common/KPIStrip"
import { DataGrid } from "@/components/common/DataGrid"
import { ChartCard } from "@/components/ChartCard"
import {
  GasPump,
  CurrencyDollar,
  Gauge,
  TrendUp,
  CreditCard,
  MapPin,
  Plus
} from "@phosphor-icons/react"
import { useState } from "react"
import { useFleetData } from "@/hooks/use-fleet-data"
import { ColumnDef } from "@tanstack/react-table"
import { FuelTransaction } from "@/lib/types"

interface FuelManagementProps {
  data: ReturnType<typeof useFleetData>
}

export function FuelManagement({ data }: FuelManagementProps) {
  const transactions = data.fuelTransactions || []
  const [activeTab, setActiveTab] = useState<string>("records")

  const metrics = useMemo(() => {
    const totalCost = transactions.reduce((sum, t) => sum + t.totalCost, 0)
    const totalGallons = transactions.reduce((sum, t) => sum + t.gallons, 0)
    const avgPrice = totalGallons > 0 ? totalCost / totalGallons : 0
    const avgMpg = transactions.length > 0
      ? transactions.reduce((sum, t) => sum + t.mpg, 0) / transactions.length
      : 0

    return { totalCost, totalGallons, avgPrice, avgMpg }
  }, [transactions])

  const fuelColumns: ColumnDef<FuelTransaction>[] = useMemo(
    () => [
      {
        accessorKey: "vehicleNumber",
        header: "Vehicle",
        cell: ({ row }) => (
          <div className="font-medium">{row.original.vehicleNumber}</div>
        ),
      },
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => (
          <div className="text-sm">
            {new Date(row.original.date).toLocaleDateString()}
          </div>
        ),
      },
      {
        accessorKey: "station",
        header: "Station",
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {row.original.station}
          </div>
        ),
      },
      {
        accessorKey: "totalCost",
        header: "Total Cost",
        cell: ({ row }) => (
          <div className="font-semibold">
            ${row.original.totalCost.toFixed(2)}
          </div>
        ),
      },
      {
        accessorKey: "gallons",
        header: "Gallons",
        cell: ({ row }) => (
          <div className="text-sm">
            {row.original.gallons.toFixed(1)} gal
          </div>
        ),
      },
      {
        accessorKey: "pricePerGallon",
        header: "Price/Gal",
        cell: ({ row }) => (
          <div className="text-sm">
            ${row.original.pricePerGallon.toFixed(2)}
          </div>
        ),
      },
      {
        accessorKey: "mpg",
        header: "MPG",
        cell: ({ row }) => (
          <div className="text-sm font-medium">
            {row.original.mpg.toFixed(1)}
          </div>
        ),
      },
      {
        accessorKey: "paymentMethod",
        header: "Payment",
        cell: ({ row }) => (
          <Badge variant="outline" className="text-xs">
            {row.original.paymentMethod}
          </Badge>
        ),
      },
    ],
    []
  )

  const monthlyData = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
    return monthNames.map((name, i) => {
      const monthTransactions = transactions.filter(t => {
        const date = new Date(t.date)
        return date.getMonth() === i
      })
      return {
        name,
        cost: monthTransactions.reduce((sum, t) => sum + t.totalCost, 0)
      }
    }).filter(d => d.cost > 0)
  }, [transactions])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Fuel Management</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Transaction
        </Button>
      </div>

      <KPIStrip
        metrics={[
          {
            id: "total-cost",
            icon: <CurrencyDollar className="w-5 h-5 text-blue-500" />,
            label: "Total Fuel Cost (90d)",
            value: `$${metrics.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
            trend: {
              value: 8.3,
              direction: "up",
              isPositive: false
            },
            color: "text-blue-500"
          },
          {
            id: "total-gallons",
            icon: <GasPump className="w-5 h-5 text-green-500" />,
            label: "Total Gallons",
            value: Math.round(metrics.totalGallons).toLocaleString(),
            trend: {
              value: 5.1,
              direction: "up",
              isPositive: false
            },
            color: "text-green-500"
          },
          {
            id: "avg-price",
            icon: <TrendUp className="w-5 h-5 text-orange-500" />,
            label: "Avg Price/Gallon",
            value: `$${metrics.avgPrice.toFixed(2)}`,
            trend: {
              value: 2.4,
              direction: "down",
              isPositive: true
            },
            color: "text-orange-500"
          },
          {
            id: "fleet-mpg",
            icon: <Gauge className="w-5 h-5 text-purple-500" />,
            label: "Fleet Avg MPG",
            value: `${metrics.avgMpg.toFixed(1)}`,
            trend: {
              value: 1.8,
              direction: "up",
              isPositive: true
            },
            color: "text-purple-500"
          }
        ]}
        compact={true}
      />

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

          <Card>
            <CardHeader>
              <CardTitle>Recent Fuel Transactions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DataGrid
                data={transactions}
                columns={fuelColumns}
                enableSearch={true}
                searchPlaceholder="Search transactions..."
                enablePagination={true}
                pageSize={20}
                emptyMessage="No fuel transactions found"
                className="border-0"
              />
            </CardContent>
          </Card>
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
