import {
  CurrencyDollar,
  GasPump,
  Clock,
  TrendUp,
  Wrench
} from "@phosphor-icons/react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface KPIsTabProps {
  costPerMile: string
  fuelEfficiency: string
  downtimeRate: string
  utilization: number
  utilizationChange?: number
  fuelCostChange?: number
  maintenanceCostChange?: number
}

export function KPIsTab({
  costPerMile,
  fuelEfficiency,
  downtimeRate,
  utilization,
  utilizationChange,
  fuelCostChange,
  maintenanceCostChange
}: KPIsTabProps) {
  const insights: Array<{
    title: string
    description: string
    tone: "success" | "warning" | "info"
    icon: JSX.Element
  }> = []

  if (utilizationChange !== undefined) {
    const improving = utilizationChange >= 0
    insights.push({
      title: improving ? "Fleet Utilization Improving" : "Fleet Utilization Declining",
      description: `Utilization ${improving ? "increased" : "decreased"} by ${Math.abs(utilizationChange).toFixed(1)}% compared to the prior period.`,
      tone: improving ? "success" : "warning",
      icon: <TrendUp className="w-3 h-3" />
    })
  }

  if (fuelCostChange !== undefined) {
    const rising = fuelCostChange >= 0
    insights.push({
      title: rising ? "Fuel Costs Rising" : "Fuel Costs Improving",
      description: `Fuel expenses ${rising ? "increased" : "decreased"} by ${Math.abs(fuelCostChange).toFixed(1)}% over the prior period.`,
      tone: rising ? "warning" : "success",
      icon: <GasPump className="w-3 h-3" />
    })
  }

  if (maintenanceCostChange !== undefined) {
    const rising = maintenanceCostChange >= 0
    insights.push({
      title: rising ? "Maintenance Costs Increasing" : "Maintenance Costs Decreasing",
      description: `Maintenance spend ${rising ? "increased" : "decreased"} by ${Math.abs(maintenanceCostChange).toFixed(1)}% over the prior period.`,
      tone: rising ? "warning" : "success",
      icon: <Wrench className="w-3 h-3" />
    })
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <CurrencyDollar className="w-3 h-3" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Cost per Mile</p>
            </div>
            <p className="text-base font-semibold">${costPerMile}</p>
            <p className="text-sm text-muted-foreground mt-1">fleet average</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-accent/10 text-accent">
                <GasPump className="w-3 h-3" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Fuel Efficiency</p>
            </div>
            <p className="text-base font-semibold">{fuelEfficiency} MPG</p>
            <p className="text-sm text-muted-foreground mt-1">fleet average</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-warning/10 text-warning">
                <Clock className="w-3 h-3" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Downtime Rate</p>
            </div>
            <p className="text-base font-semibold">{downtimeRate}%</p>
            <p className="text-sm text-muted-foreground mt-1">of total fleet</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-success/10 text-success">
                <TrendUp className="w-3 h-3" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Utilization</p>
            </div>
            <p className="text-base font-semibold">{utilization}%</p>
            <p className="text-sm text-muted-foreground mt-1">fleet efficiency</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
        </CardHeader>
        <CardContent>
          {insights.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Trend insights will appear once historical data is available.
            </div>
          ) : (
            <div className="space-y-2">
              {insights.map((insight) => (
                <div key={insight.title} className="flex items-start gap-2 p-2 border rounded-lg">
                  <div
                    className={`p-2 rounded-lg ${
                      insight.tone === "success"
                        ? "bg-success/10 text-success"
                        : insight.tone === "warning"
                          ? "bg-warning/10 text-warning"
                          : "bg-accent/10 text-accent"
                    }`}
                  >
                    {insight.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{insight.title}</h4>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
