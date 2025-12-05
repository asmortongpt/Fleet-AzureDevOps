import { ChartCard } from "@/components/ChartCard"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface UtilizationByType {
  name: string
  utilization: number
  count: number
}

interface UtilizationTabProps {
  utilizationByType: UtilizationByType[]
}

export function UtilizationTab({ utilizationByType }: UtilizationTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartCard
        title="Utilization by Vehicle Type"
        subtitle="Average utilization percentage by category"
        type="bar"
        data={utilizationByType}
        dataKey="utilization"
        color="oklch(0.65 0.15 160)"
      />
      <Card>
        <CardHeader>
          <CardTitle>Fleet Composition</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {utilizationByType.map(type => (
              <div key={type.name}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{type.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {type.count} vehicles
                    </Badge>
                  </div>
                  <span className="text-sm font-semibold">{type.utilization}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      type.utilization >= 80 ? "bg-success" :
                      type.utilization >= 60 ? "bg-accent" :
                      "bg-warning"
                    }`}
                    style={{ width: `${type.utilization}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
