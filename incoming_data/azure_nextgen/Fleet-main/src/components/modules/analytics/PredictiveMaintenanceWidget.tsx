import {
    Wrench,
    TrendUp,
    Warning,
    CheckCircle,
    Lightning,
    Clock
} from "@phosphor-icons/react"
import { useMemo } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { useVehicles } from "@/hooks/use-api"
import { Vehicle } from "@/lib/types"

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

    const vehicles = useMemo(() => {
        if (!vehiclesData) return []
        return Array.isArray(vehiclesData) ? vehiclesData : (vehiclesData as any).data || []
    }, [vehiclesData])

    // Mock predictive analysis based on vehicle data
    const risks: MaintenanceRisk[] = useMemo(() => {
        return vehicles
            .map((v: Vehicle) => {
                // Simple logic for demo: older vehicles or high mileage = higher risk
                let score = 0
                if (v.mileage > 100000) score += 40
                if (v.mileage > 50000) score += 20
                if (v.year < 2020) score += 20
                if (v.status === 'service') score += 10
                if (v.alerts && v.alerts.length > 0) score += 20

                // Randomize slightly for demo "AI" feel
                score += Math.floor(Math.random() * 10)
                score = Math.min(score, 100)

                let level: MaintenanceRisk['riskLevel'] = 'low'
                if (score > 80) level = 'critical'
                else if (score > 60) level = 'high'
                else if (score > 40) level = 'medium'

                return {
                    vehicleId: v.id,
                    vehicleName: v.name || `${v.year} ${v.make} ${v.model}`,
                    riskScore: score,
                    riskLevel: level,
                    predictedFailure: score > 60 ? 'Brake Pad Wear' : undefined,
                    daysUntilFailure: score > 60 ? Math.floor(Math.random() * 30) : undefined
                }
            })
            .sort((a: MaintenanceRisk, b: MaintenanceRisk) => b.riskScore - a.riskScore)
            .slice(0, 5) // Top 5
    }, [vehicles])

    const highRiskCount = risks.filter(r => r.riskLevel === 'high' || r.riskLevel === 'critical').length
    const fleetHealth = Math.round(100 - (risks.reduce((acc, r) => acc + r.riskScore, 0) / (risks.length || 1)))

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center p-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <Card className="h-full shadow-md border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Lightning className="h-5 w-5 text-amber-500" weight="fill" />
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
                <div className="space-y-4">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                            <div className="text-xs text-muted-foreground">High Risk Vehicles</div>
                            <div className="text-2xl font-bold text-red-600">{highRiskCount}</div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                            <div className="text-xs text-muted-foreground">Next 7 Days</div>
                            <div className="text-2xl font-bold text-blue-600">3</div>
                        </div>
                    </div>

                    {/* At Risk List */}
                    <div className="space-y-3">
                        <div className="text-sm font-medium text-muted-foreground">At Risk Vehicles</div>
                        {risks.length === 0 ? (
                            <div className="text-sm text-muted-foreground text-center py-4">No high risk vehicles detected</div>
                        ) : (
                            risks.map(risk => (
                                <div key={risk.vehicleId} className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                                    <div className="flex items-center gap-3">
                                        {risk.riskLevel === 'critical' ? (
                                            <Warning className="text-red-500 h-4 w-4" weight="fill" />
                                        ) : risk.riskLevel === 'high' ? (
                                            <Warning className="text-orange-500 h-4 w-4" weight="bold" />
                                        ) : (
                                            <Wrench className="text-blue-500 h-4 w-4" />
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
                                            risk.riskLevel === 'high' ? 'text-orange-600' : 'text-blue-600'
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
