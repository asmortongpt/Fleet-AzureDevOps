/**
 * Vehicle Comparison Mode
 * Side-by-side comparison of two vehicles in the 3D Garage
 */

import { useState, useMemo } from 'react'
import {
    Car,
    ArrowsLeftRight,
    X,
    Check,
    Warning,
    GasPump,
    Gauge,
    Calendar
} from '@phosphor-icons/react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface ComparisonVehicle {
    id: string
    name: string
    make: string
    model: string
    year: number
    licensePlate?: string
    mileage?: number
    fuelLevel?: number
    oilLife?: number
    brakeLife?: number
    tireHealth?: number
    batteryHealth?: number
    status?: string
    department?: string
    lastService?: string
}

interface VehicleComparisonProps {
    vehicles: ComparisonVehicle[]
    onClose?: () => void
}

function ComparisonBar({
    label,
    value1,
    value2,
    unit = '%',
    higherIsBetter = true
}: {
    label: string
    value1?: number
    value2?: number
    unit?: string
    higherIsBetter?: boolean
}) {
    const v1 = value1 ?? 0
    const v2 = value2 ?? 0
    const winner = higherIsBetter ? (v1 > v2 ? 1 : v1 < v2 ? 2 : 0) : (v1 < v2 ? 1 : v1 > v2 ? 2 : 0)

    return (
        <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
                <span>{label}</span>
            </div>
            <div className="flex items-center gap-3">
                {/* Vehicle 1 */}
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <span className={cn(
                            "text-sm font-semibold",
                            winner === 1 ? "text-emerald-400" : "text-slate-300"
                        )}>
                            {v1}{unit}
                        </span>
                        {winner === 1 && <Check className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <Progress value={v1} className="h-2" />
                </div>

                {/* Divider */}
                <div className="w-px h-8 bg-slate-700" />

                {/* Vehicle 2 */}
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        {winner === 2 && <Check className="w-4 h-4 text-emerald-400" />}
                        <span className={cn(
                            "text-sm font-semibold ml-auto",
                            winner === 2 ? "text-emerald-400" : "text-slate-300"
                        )}>
                            {v2}{unit}
                        </span>
                    </div>
                    <Progress value={v2} className="h-2" />
                </div>
            </div>
        </div>
    )
}

export function VehicleComparison({ vehicles, onClose }: VehicleComparisonProps) {
    const [vehicle1Id, setVehicle1Id] = useState<string>(vehicles[0]?.id || '')
    const [vehicle2Id, setVehicle2Id] = useState<string>(vehicles[1]?.id || '')

    const vehicle1 = useMemo(() => vehicles.find(v => v.id === vehicle1Id), [vehicles, vehicle1Id])
    const vehicle2 = useMemo(() => vehicles.find(v => v.id === vehicle2Id), [vehicles, vehicle2Id])

    return (
        <Card className="bg-slate-900/95 border-slate-700 backdrop-blur-xl">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ArrowsLeftRight className="w-5 h-5 text-blue-400" />
                        <CardTitle className="text-lg">Vehicle Comparison</CardTitle>
                    </div>
                    {onClose && (
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Vehicle Selectors */}
                <div className="grid grid-cols-2 gap-4">
                    <Select value={vehicle1Id} onValueChange={setVehicle1Id}>
                        <SelectTrigger className="bg-slate-800 border-slate-700">
                            <SelectValue placeholder="Select vehicle 1" />
                        </SelectTrigger>
                        <SelectContent>
                            {vehicles.filter(v => v.id !== vehicle2Id).map(v => (
                                <SelectItem key={v.id} value={v.id}>
                                    {v.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={vehicle2Id} onValueChange={setVehicle2Id}>
                        <SelectTrigger className="bg-slate-800 border-slate-700">
                            <SelectValue placeholder="Select vehicle 2" />
                        </SelectTrigger>
                        <SelectContent>
                            {vehicles.filter(v => v.id !== vehicle1Id).map(v => (
                                <SelectItem key={v.id} value={v.id}>
                                    {v.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Vehicle Headers */}
                {vehicle1 && vehicle2 && (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                                <Car className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                                <h3 className="font-bold text-white">{vehicle1.year} {vehicle1.make}</h3>
                                <p className="text-sm text-slate-400">{vehicle1.model}</p>
                                <Badge variant="outline" className="mt-2">{vehicle1.licensePlate}</Badge>
                            </div>
                            <div className="text-center p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                                <Car className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                                <h3 className="font-bold text-white">{vehicle2.year} {vehicle2.make}</h3>
                                <p className="text-sm text-slate-400">{vehicle2.model}</p>
                                <Badge variant="outline" className="mt-2">{vehicle2.licensePlate}</Badge>
                            </div>
                        </div>

                        {/* Comparison Stats */}
                        <ScrollArea className="h-64">
                            <div className="space-y-4 pr-4">
                                <ComparisonBar
                                    label="Mileage"
                                    value1={vehicle1.mileage ? vehicle1.mileage / 1000 : 0}
                                    value2={vehicle2.mileage ? vehicle2.mileage / 1000 : 0}
                                    unit="k mi"
                                    higherIsBetter={false}
                                />
                                <ComparisonBar
                                    label="Oil Life"
                                    value1={vehicle1.oilLife}
                                    value2={vehicle2.oilLife}
                                />
                                <ComparisonBar
                                    label="Brake Life"
                                    value1={vehicle1.brakeLife}
                                    value2={vehicle2.brakeLife}
                                />
                                <ComparisonBar
                                    label="Tire Health"
                                    value1={vehicle1.tireHealth}
                                    value2={vehicle2.tireHealth}
                                />
                                <ComparisonBar
                                    label="Battery Health"
                                    value1={vehicle1.batteryHealth}
                                    value2={vehicle2.batteryHealth}
                                />
                                <ComparisonBar
                                    label="Fuel Level"
                                    value1={vehicle1.fuelLevel}
                                    value2={vehicle2.fuelLevel}
                                />
                            </div>
                        </ScrollArea>

                        {/* Summary */}
                        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                            <div className="flex items-center gap-2 text-sm">
                                <Gauge className="w-4 h-4 text-blue-400" />
                                <span className="text-slate-400">
                                    Overall: <span className="text-white font-medium">
                                        {vehicle1.name} vs {vehicle2.name}
                                    </span>
                                </span>
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}

export default VehicleComparison
