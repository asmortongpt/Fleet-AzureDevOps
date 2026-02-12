import React from "react"
import {
  CurrencyDollar,
  GasPump,
  Clock,
  TrendUp,
  Wrench,
  HeartHalf,
  Buildings
} from "@phosphor-icons/react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface DepartmentKPI {
  name: string
  vehicleCount: number
  avgFuelEfficiency: number
  avgHealthScore: number
  utilization: number
  costPerMile: number
}

interface KPIsTabProps {
  costPerMile: string
  fuelEfficiency: string
  downtimeRate: string
  utilization: number
  utilizationChange?: number
  fuelCostChange?: number
  maintenanceCostChange?: number
  fleetAvgFuelEfficiency?: number
  fleetAvgHealthScore?: number
  departments?: DepartmentKPI[]
}

export function KPIsTab({
  costPerMile,
  fuelEfficiency,
  downtimeRate,
  utilization,
  utilizationChange,
  fuelCostChange,
  maintenanceCostChange,
  fleetAvgFuelEfficiency,
  fleetAvgHealthScore,
  departments
}: KPIsTabProps) {
  const insights: Array<{
    title: string
    description: string
    tone: "success" | "warning" | "info"
    icon: React.ReactElement
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

  const fuelEffVal = fleetAvgFuelEfficiency ?? (fuelEfficiency ? parseFloat(fuelEfficiency) : null)
  const healthVal = fleetAvgHealthScore ?? null
  const fuelEffColor = fuelEffVal != null
    ? fuelEffVal >= 25 ? "text-green-500" : fuelEffVal >= 15 ? "text-yellow-500" : "text-red-500"
    : ""
  const healthColor = healthVal != null
    ? healthVal >= 80 ? "text-green-500" : healthVal >= 60 ? "text-yellow-500" : "text-red-500"
    : ""

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
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
            <p className={`text-base font-semibold ${fuelEffColor}`}>
              {fuelEffVal != null ? `${fuelEffVal.toFixed(1)} MPG` : `${fuelEfficiency} MPG`}
            </p>
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

        {/* Fleet Average Fuel Efficiency KPI */}
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <GasPump className="w-3 h-3" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Avg Fuel Efficiency</p>
            </div>
            <p className={`text-base font-semibold ${fuelEffColor}`}>
              {fuelEffVal != null ? `${fuelEffVal.toFixed(1)} MPG` : '--'}
            </p>
            {fuelEffVal != null && (
              <div className="mt-2">
                <Progress
                  value={Math.min(fuelEffVal / 40 * 100, 100)}
                  className="h-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {fuelEffVal >= 25 ? "Above target" : fuelEffVal >= 15 ? "Near target" : "Below target"} (target: 25 MPG)
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fleet Average Health Score KPI */}
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
                <HeartHalf className="w-3 h-3" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Fleet Health Score</p>
            </div>
            <p className={`text-base font-semibold ${healthColor}`}>
              {healthVal != null ? `${healthVal}/100` : '--'}
            </p>
            {healthVal != null && (
              <div className="mt-2">
                <Progress
                  value={healthVal}
                  className="h-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {healthVal >= 80 ? "Healthy fleet" : healthVal >= 60 ? "Needs attention" : "Critical - action required"}
                </p>
              </div>
            )}
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

      {/* Department Comparison */}
      {departments && departments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Buildings className="w-4 h-4" />
              Department Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Department</th>
                    <th className="text-right p-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vehicles</th>
                    <th className="text-right p-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg MPG</th>
                    <th className="text-right p-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Health Score</th>
                    <th className="text-right p-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Utilization</th>
                    <th className="text-right p-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cost/Mile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {departments.map((dept) => {
                    const deptMpgColor = dept.avgFuelEfficiency >= 25
                      ? "text-green-500"
                      : dept.avgFuelEfficiency >= 15
                        ? "text-yellow-500"
                        : "text-red-500"
                    const deptHealthColor = dept.avgHealthScore >= 80
                      ? "text-green-500"
                      : dept.avgHealthScore >= 60
                        ? "text-yellow-500"
                        : "text-red-500"

                    return (
                      <tr key={dept.name} className="hover:bg-muted/30 transition-colors">
                        <td className="p-2 text-sm font-medium">
                          <Badge variant="outline" className="font-normal">
                            {dept.name}
                          </Badge>
                        </td>
                        <td className="p-2 text-sm text-right">{dept.vehicleCount}</td>
                        <td className={`p-2 text-sm text-right font-medium ${deptMpgColor}`}>
                          {dept.avgFuelEfficiency.toFixed(1)}
                        </td>
                        <td className="p-2 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Progress value={dept.avgHealthScore} className="h-1.5 w-12" />
                            <span className={`text-sm font-medium ${deptHealthColor}`}>{dept.avgHealthScore}</span>
                          </div>
                        </td>
                        <td className="p-2 text-sm text-right">{dept.utilization}%</td>
                        <td className="p-2 text-sm text-right font-medium">${dept.costPerMile.toFixed(2)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
