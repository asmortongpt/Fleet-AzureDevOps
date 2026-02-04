import {
    Wrench,
    Warning,
    Lightning
} from "@phosphor-icons/react"
import { useMemo } from "react"
import useSWR from "swr"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useVehicles } from "@/hooks/use-api"
import { Vehicle } from "@/lib/types"

import { AlertTriangle, Zap } from 'lucide-react';
interface MaintenanceRisk {
    vehicleId: string
    vehicleName: string
    riskScore: number // 0-100
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
    predictedFailure?: string
    daysUntilFailure?: number
}

export function PredictiveMaintenanceWidget() {
    const { data: vehiclesData, isLoading } = useVehicles()
    const { data: predictions = [] } = useSWR<any[]>(
        "/api/predictive-maintenance?limit=100",
        (url: string) =>
            fetch(url, { credentials: 'include' })
                .then((r) => r.json())
                .then((data) => data?.data ?? data),
        { shouldRetryOnError: false }
    )

    const vehicles = useMemo(() => {
        if (!vehiclesData) return []
        return Array.isArray(vehiclesData) ? vehiclesData : (vehiclesData as any).data || []
    }, [vehiclesData])

    const predictionList = useMemo(() => {
        return Array.isArray(predictions) ? predictions : (predictions as any)?.data || []
    }, [predictions])

    const vehiclesById = useMemo(() => {
        return vehicles.reduce<Record<string, Vehicle>>((acc, v: Vehicle) => {
            acc[String(v.id)] = v
            return acc
        }, {})
    }, [vehicles])

    // Predictive analysis based on API data
    const risks: MaintenanceRisk[] = useMemo(() => {
        return predictionList
            .map((prediction: any) => {
                const confidence = Number(prediction.confidence_score ?? prediction.confidence ?? 0)
                const score = Math.max(0, Math.min(100, Math.round(confidence)))
                let level: MaintenanceRisk['riskLevel'] = 'low'
                if (score > 80) level = 'critical'
                else if (score > 60) level = 'high'
                else if (score > 40) level = 'medium'

                const vehicle = vehiclesById[String(prediction.vehicle_id)]
                const vehicleName =
                    prediction.vehicle_name ||
                    prediction.vehicle_unit ||
                    vehicle?.name ||
                    (vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Unknown Vehicle')

                const predictedDate = prediction.predicted_failure_date
                    ? new Date(prediction.predicted_failure_date)
                    : null
                const daysUntilFailure = predictedDate
                    ? Math.max(0, Math.ceil((predictedDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                    : undefined

                return {
                    vehicleId: prediction.vehicle_id || vehicle?.id || '',
                    vehicleName,
                    riskScore: score,
                    riskLevel: level,
                    predictedFailure: prediction.component || prediction.prediction_type || undefined,
                    daysUntilFailure
                }
            })
            .sort((a: MaintenanceRisk, b: MaintenanceRisk) => b.riskScore - a.riskScore)
            .slice(0, 5)
    }, [predictionList, vehiclesById])

    const highRiskCount = risks.filter(r => r.riskLevel === 'high' || r.riskLevel === 'critical').length
    const next7Days = risks.filter(r => r.daysUntilFailure !== undefined && r.daysUntilFailure <= 7).length
    const fleetHealth = Math.round(100 - (risks.reduce((acc, r) => acc + r.riskScore, 0) / (risks.length || 1)))

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center p-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <Card className="h-full shadow-md border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <Zap className="h-5 w-5 text-amber-500" />
                            Predictive Maintenance
                        </CardTitle>
                        <CardDescription>AI-driven failure prediction</CardDescription>
                    </div>
                    <Badge variant={fleetHealth > 80 ? "outline" : "destructive"}>
                        Fleet Health: {fleetHealth}%
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                            <div className="text-xs text-muted-foreground">High Risk Vehicles</div>
                            <div className="text-sm font-bold text-red-600">{highRiskCount}</div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                        <div className="text-xs text-muted-foreground">Next 7 Days</div>
                            <div className="text-sm font-bold text-blue-800">{next7Days}</div>
                        </div>
                    </div>

                    {/* At Risk List */}
                    <div className="space-y-3">
                        <div className="text-sm font-medium text-muted-foreground">At Risk Vehicles</div>
                        {risks.length === 0 ? (
                            <div className="text-sm text-muted-foreground text-center py-2">No high risk vehicles detected</div>
                        ) : (
                            risks.map(risk => (
                                <div key={risk.vehicleId} className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                                    <div className="flex items-center gap-3">
                                        {risk.riskLevel === 'critical' ? (
                                            <AlertTriangle className="text-red-500 h-4 w-4" />
                                        ) : risk.riskLevel === 'high' ? (
                                            <AlertTriangle className="text-orange-500 h-4 w-4" />
                                        ) : (
                                            <Wrench className="text-blue-800 h-4 w-4" />
                                        )}
                                        <div>
                                            <div className="text-sm font-semibold">{risk.vehicleName}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {risk.predictedFailure ? `Risk: ${risk.predictedFailure}` : 'Routine Check'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-sm font-bold ${risk.riskLevel === 'critical' ? 'text-red-600' :
                                            risk.riskLevel === 'high' ? 'text-orange-600' : 'text-blue-800'
                                            }`}>
                                            {risk.riskScore}%
                                        </div>
                                        {risk.daysUntilFailure !== undefined && (
                                            <div className="text-[10px] text-muted-foreground">
                                                ~{risk.daysUntilFailure} days
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <Button variant="outline" className="w-full text-xs h-8">
                        View Analysis Report
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
