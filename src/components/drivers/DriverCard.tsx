
import {
    User,
    MapPin,
    TrendingUp,
    Truck
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface DriverCardProps {
    driver: {
        id: string
        name: string
        status: 'active' | 'inactive' | 'on_break' | 'off_duty'
        vehicle?: string
        location?: string
        performance?: {
            safetyScore: number
            onTimeRate: number
        }
        contact?: string
    }
    onClick?: () => void
    compact?: boolean
}

export function DriverCard({ driver, onClick, compact = false }: DriverCardProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-500'
            case 'on_break': return 'bg-yellow-500'
            case 'off_duty': return 'bg-gray-500'
            case 'inactive': return 'bg-red-500'
            default: return 'bg-blue-500'
        }
    }

    const getScoreColor = (score: number) => {
        if (score >= 90) return "text-green-500"
        if (score >= 80) return "text-yellow-500"
        return "text-red-500"
    }

    return (
        <Card
            className={cn(
                "cursor-pointer hover:bg-accent/50 transition-all border-l-4",
                driver.status === 'active' ? 'border-l-green-500' :
                    driver.status === 'on_break' ? 'border-l-yellow-500' : 'border-l-gray-300'
            )}
            onClick={onClick}
        >
            <CardContent className={cn("p-4", compact && "p-3")}>
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                                <User className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div className={cn(
                                "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
                                getStatusColor(driver.status)
                            )} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm">{driver.name}</h3>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Badge variant="outline" className="text-[10px] px-1 h-4">
                                    ID: {driver.id.slice(0, 4)}
                                </Badge>
                                {driver.vehicle && (
                                    <span className="flex items-center gap-1">
                                        • <Truck className="w-3 h-3" /> {driver.vehicle}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {driver.performance && (
                        <div className="text-right">
                            <div className={cn("text-lg font-bold", getScoreColor(driver.performance.safetyScore))}>
                                {driver.performance.safetyScore}
                            </div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Score</p>
                        </div>
                    )}
                </div>

                {!compact && (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-secondary/50 p-2 rounded-md">
                                <p className="text-muted-foreground mb-1 flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    On-Time
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">{driver.performance?.onTimeRate}%</span>
                                    <Progress value={driver.performance?.onTimeRate || 0} className="h-1.5 flex-1" />
                                </div>
                            </div>
                            <div className="bg-secondary/50 p-2 rounded-md">
                                <p className="text-muted-foreground mb-1 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    Location
                                </p>
                                <p className="font-medium truncate">{driver.location || "Unknown"}</p>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
