import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Warning,
  Wrench,
  Calendar,
  TrendUp,
  Lightning
} from "@phosphor-icons/react"
import { Vehicle } from "@/lib/types"
import { useFleetData } from "@/hooks/use-fleet-data"

interface PredictiveMaintenanceProps {
  data: ReturnType<typeof useFleetData>
}

export function PredictiveMaintenance({ data }: PredictiveMaintenanceProps) {
  const vehicles = data.vehicles || []
  const predictiveVehicles = vehicles
    .filter(v => ((v.alerts || [])).length > 0 || Math.random() > 0.7)
    .slice(0, 15)
    .map(v => ({
      ...v,
      predictedIssue: ["Brake Wear", "Oil Change Due", "Tire Replacement", "Battery Health", "Transmission Service"][Math.floor(Math.random() * 5)],
      confidence: Math.floor(Math.random() * 30 + 70),
      daysUntilFailure: Math.floor(Math.random() * 60 + 5),
      estimatedCost: Math.floor(Math.random() * 1500 + 200)
    }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Predictive Maintenance</h1>
        <p className="text-muted-foreground mt-2">
          AI-powered predictions to prevent vehicle downtime and optimize maintenance scheduling
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-warning/10 text-warning">
                <Warning className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">At Risk</p>
            </div>
            <p className="text-3xl font-semibold">{predictiveVehicles.length}</p>
            <p className="text-sm text-muted-foreground mt-1">vehicles need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
                <Lightning className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Critical</p>
            </div>
            <p className="text-3xl font-semibold">
              {predictiveVehicles.filter(v => v.daysUntilFailure < 15).length}
            </p>
            <p className="text-sm text-muted-foreground mt-1">urgent attention required</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-success/10 text-success">
                <TrendUp className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Potential Savings</p>
            </div>
            <p className="text-3xl font-semibold">
              ${Math.floor(predictiveVehicles.length * 450).toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground mt-1">vs reactive maintenance</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Predictive Maintenance Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {predictiveVehicles.map(vehicle => (
              <div 
                key={vehicle.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${
                    vehicle.daysUntilFailure < 15 
                      ? "bg-destructive/10 text-destructive" 
                      : "bg-warning/10 text-warning"
                  }`}>
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium">{vehicle.number}</p>
                    <p className="text-sm text-muted-foreground">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div>
                    <p className="font-medium">{vehicle.predictedIssue}</p>
                    <p className="text-sm text-muted-foreground">
                      {vehicle.confidence}% confidence
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {vehicle.daysUntilFailure} days
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Est. ${vehicle.estimatedCost}
                    </p>
                  </div>

                  <Button size="sm" variant="outline">
                    Schedule Service
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-accent/5">
              <h3 className="font-semibold mb-2">Proactive Scheduling</h3>
              <p className="text-sm text-muted-foreground">
                Schedule maintenance for 8 vehicles before predicted issues occur, saving approximately $3,600 in emergency repairs.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Parts Inventory Optimization</h3>
              <p className="text-sm text-muted-foreground">
                Pre-order commonly needed parts based on predictions to reduce vehicle downtime by 40%.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
