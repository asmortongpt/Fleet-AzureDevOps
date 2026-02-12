import { 
  AlertTriangle,
  Wrench,
  Calendar,
  TrendingUp,
  Zap
} from "lucide-react"
import { useMemo } from "react"
import useSWR from "swr"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useFleetData } from "@/hooks/use-fleet-data"

interface PredictiveMaintenanceProps {
  data: ReturnType<typeof useFleetData>
}

interface PredictiveRecord {
  id: string
  vehicle_id?: string
  asset_id?: string
  component?: string
  prediction_type?: string
  confidence_score?: number
  confidence?: number
  risk_score?: number
  predicted_failure_date?: string
  estimated_cost?: number
  cost_estimate?: number
  status?: string
}

const fetcher = (url: string) =>
  fetch(url, { credentials: "include" })
    .then((res) => res.json())
    .then((data) => data?.data ?? data)

export function PredictiveMaintenance() {
  const data = useFleetData()
  const vehicles = data.vehicles || []
  const { data: predictionsRaw } = useSWR<PredictiveRecord[]>(
    "/api/predictive-maintenance?limit=200",
    fetcher,
    { shouldRetryOnError: false }
  )

  const predictions = useMemo(() => {
    return Array.isArray(predictionsRaw) ? predictionsRaw : []
  }, [predictionsRaw])

  const vehiclesById = useMemo(() => {
    return vehicles.reduce<Record<string, any>>((acc, vehicle) => {
      acc[String(vehicle.id)] = vehicle
      return acc
    }, {})
  }, [vehicles])

  const predictiveVehicles = useMemo(() => {
    return predictions.map((prediction) => {
      const vehicle = prediction.vehicle_id ? vehiclesById[String(prediction.vehicle_id)] : null
      const confidence = Number(
        prediction.confidence_score ??
        prediction.confidence ??
        prediction.risk_score ??
        0
      )
      const predictedDate = prediction.predicted_failure_date
        ? new Date(prediction.predicted_failure_date)
        : null
      const daysUntilFailure = predictedDate
        ? Math.max(0, Math.ceil((predictedDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : undefined

      return {
        ...vehicle,
        id: prediction.vehicle_id || vehicle?.id || prediction.id,
        predictedIssue: prediction.component || prediction.prediction_type || "Maintenance",
        confidence: Math.round(confidence),
        daysUntilFailure,
        estimatedCost: Number(prediction.estimated_cost ?? prediction.cost_estimate ?? 0)
      }
    })
  }, [predictions, vehiclesById])

  const criticalCount = predictiveVehicles.filter(v => v.daysUntilFailure !== undefined && v.daysUntilFailure < 15).length
  const estimatedSavings = predictiveVehicles.reduce((sum, v) => sum + (v.estimatedCost || 0), 0)

  return (
    <div className="space-y-2">
      <div>
        <h1 className="text-base font-semibold tracking-tight">Predictive Maintenance</h1>
        <p className="text-muted-foreground mt-2">
          AI-powered predictions to prevent vehicle downtime and optimize maintenance scheduling
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-warning/10 text-warning">
                <AlertTriangle className="w-3 h-3" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">At Risk</p>
            </div>
            <p className="text-base font-semibold">{predictiveVehicles.length}</p>
            <p className="text-sm text-muted-foreground mt-1">vehicles need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
                <Zap className="w-3 h-3" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Critical</p>
            </div>
            <p className="text-base font-semibold">
              {criticalCount}
            </p>
            <p className="text-sm text-muted-foreground mt-1">urgent attention required</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-success/10 text-success">
                <TrendingUp className="w-3 h-3" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Potential Savings</p>
            </div>
            <p className="text-base font-semibold">
              ${Math.round(estimatedSavings).toLocaleString()}
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
            {predictiveVehicles.length === 0 ? (
              <div className="text-sm text-muted-foreground">No predictive alerts available.</div>
            ) : (
              predictiveVehicles.map(vehicle => (
                <div 
                  key={vehicle.id}
                  className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${
                      vehicle.daysUntilFailure !== undefined && vehicle.daysUntilFailure < 15
                        ? "bg-destructive/10 text-destructive"
                        : "bg-warning/10 text-warning"
                    }`}>
                      <Wrench className="w-3 h-3" />
                    </div>
                    <div>
                      <p className="font-medium">{vehicle.number || vehicle.unit_number || vehicle.name || "Vehicle"}</p>
                      <p className="text-sm text-muted-foreground">
                        {[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") || "Details unavailable"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div>
                      <p className="font-medium">{vehicle.predictedIssue}</p>
                      <p className="text-sm text-muted-foreground">
                        {vehicle.confidence ?? 0}% confidence
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {vehicle.daysUntilFailure !== undefined ? `${vehicle.daysUntilFailure} days` : "—"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {vehicle.estimatedCost ? `Est. $${vehicle.estimatedCost.toLocaleString()}` : "Est. —"}
                      </p>
                    </div>

                    <Button size="sm" variant="outline">
                      Schedule Service
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          {predictiveVehicles.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No predictive maintenance insights available yet.
            </div>
          ) : (
            <div className="space-y-2">
              <div className="p-2 border rounded-lg bg-accent/5">
                <h3 className="font-semibold mb-2">Proactive Scheduling</h3>
                <p className="text-sm text-muted-foreground">
                  Schedule maintenance for {predictiveVehicles.length} vehicles before predicted issues occur to reduce emergency repairs by approximately ${Math.round(estimatedSavings).toLocaleString()}.
                </p>
              </div>
              <div className="p-2 border rounded-lg">
                <h3 className="font-semibold mb-2">Parts Inventory Optimization</h3>
                <p className="text-sm text-muted-foreground">
                  Align parts procurement with the top predicted components to minimize vehicle downtime.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
