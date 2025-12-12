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
}

export function KPIsTab({ costPerMile, fuelEfficiency, downtimeRate, utilization }: KPIsTabProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <CurrencyDollar className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Cost per Mile</p>
            </div>
            <p className="text-3xl font-semibold">${costPerMile}</p>
            <p className="text-sm text-muted-foreground mt-1">fleet average</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-accent/10 text-accent">
                <GasPump className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Fuel Efficiency</p>
            </div>
            <p className="text-3xl font-semibold">{fuelEfficiency} MPG</p>
            <p className="text-sm text-muted-foreground mt-1">fleet average</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-warning/10 text-warning">
                <Clock className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Downtime Rate</p>
            </div>
            <p className="text-3xl font-semibold">{downtimeRate}%</p>
            <p className="text-sm text-muted-foreground mt-1">of total fleet</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-success/10 text-success">
                <TrendUp className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Utilization</p>
            </div>
            <p className="text-3xl font-semibold">{utilization}%</p>
            <p className="text-sm text-muted-foreground mt-1">fleet efficiency</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <div className="p-2 rounded-lg bg-success/10 text-success">
                <TrendUp className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Fleet Utilization Improving</h4>
                <p className="text-sm text-muted-foreground">
                  Fleet utilization has increased by 3.2% compared to last period, indicating better resource allocation.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <div className="p-2 rounded-lg bg-warning/10 text-warning">
                <GasPump className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Fuel Costs Rising</h4>
                <p className="text-sm text-muted-foreground">
                  Fuel expenses have increased by 8.5%. Consider fuel efficiency training or route optimization.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <div className="p-2 rounded-lg bg-success/10 text-success">
                <Wrench className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Maintenance Costs Decreasing</h4>
                <p className="text-sm text-muted-foreground">
                  Maintenance expenses down by 2.3%, suggesting effective preventive maintenance practices.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
