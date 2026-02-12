/**
 * Driver Leaderboard Widget
 * Gamified driver performance ranking with scores and achievements
 */

import { Trophy, Medal, TrendingUp, TrendingDown, Minus, Shield, Timer, Fuel } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDrivers } from '@/hooks/use-api'
import { cn } from '@/lib/utils'

interface DriverScore {
    id: string
    name: string
    avatarUrl?: string
    score: number
    previousRank: number
    currentRank: number
    safetyScore: number
    efficiencyScore: number
    onTimeScore: number
    fuelScore: number
    tripsCompleted: number
    streak?: number
    badges?: string[]
}

interface DriverLeaderboardProps {
    drivers?: DriverScore[]
    period?: 'week' | 'month' | 'quarter' | 'year'
    onPeriodChange?: (period: string) => void
    onDriverClick?: (driver: DriverScore) => void
    className?: string
}

function RankBadge({ rank }: { rank: number }) {
    if (rank === 1) {
        return (
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-sm shadow-yellow-500/20">
                <Trophy className="w-4 h-4 text-yellow-900" />
            </div>
        )
    }
    if (rank === 2) {
        return (
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-slate-300 to-slate-500 flex items-center justify-center shadow-sm shadow-slate-400/20">
                <Medal className="w-4 h-4 text-slate-700" />
            </div>
        )
    }
    if (rank === 3) {
        return (
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-sm shadow-amber-600/20">
                <Medal className="w-4 h-4 text-amber-200" />
            </div>
        )
    }
    return (
        <div className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-700">
            {rank}
        </div>
    )
}

function RankChange({ previous, current }: { previous: number; current: number }) {
    const change = previous - current
    if (change > 0) {
        return (
            <div className="flex items-center gap-1 text-emerald-700">
                <TrendingUp className="w-3 h-3" />
                <span className="text-xs font-medium">+{change}</span>
            </div>
        )
    }
    if (change < 0) {
        return (
            <div className="flex items-center gap-1 text-red-400">
                <TrendingDown className="w-3 h-3" />
                <span className="text-xs font-medium">{change}</span>
            </div>
        )
    }
    return (
        <div className="flex items-center gap-1 text-slate-500">
            <Minus className="w-3 h-3" />
            <span className="text-xs">—</span>
        </div>
    )
}

export function DriverLeaderboard({
    drivers,
    period = 'month',
    onPeriodChange,
    onDriverClick,
    className
}: DriverLeaderboardProps) {
    const { data: apiDrivers = [] } = useDrivers()
    const [selectedPeriod, setSelectedPeriod] = useState(period)

    const leaderboardDrivers = useMemo<DriverScore[]>(() => {
        const source = drivers && drivers.length > 0 ? drivers : (apiDrivers as any[])
        if (!source || source.length === 0) return []

        const normalized = source.map((driver: any, index: number) => {
            const safetyScore = Number(driver.safetyScore || driver.safety_score || 0)
            const efficiencyScore = Number(driver.efficiencyScore || driver.efficiency_score || 0)
            const onTimeScore = Number(driver.onTimeScore || driver.on_time_score || 0)
            const fuelScore = Number(driver.fuelScore || driver.fuel_score || 0)
            const score = [safetyScore, efficiencyScore, onTimeScore, fuelScore]
                .filter((value) => Number.isFinite(value))
                .reduce((sum, value) => sum + value, 0)

            return {
                id: String(driver.id || `driver-${index}`),
                name: driver.name || `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || driver.email || 'Unknown Driver',
                avatarUrl: driver.avatar || driver.avatarUrl,
                score: score || safetyScore,
                previousRank: index + 1,
                currentRank: index + 1,
                safetyScore,
                efficiencyScore,
                onTimeScore,
                fuelScore,
                tripsCompleted: Number(driver.tripsCompleted || driver.trips_completed || 0),
                streak: Number(driver.streak || 0) || undefined,
                badges: driver.badges || []
            } as DriverScore
        })

        return normalized
            .sort((a, b) => b.score - a.score)
            .map((driver, index) => ({ ...driver, currentRank: index + 1 }))
    }, [drivers, apiDrivers])

    const handlePeriodChange = (newPeriod: string) => {
        setSelectedPeriod(newPeriod as typeof period)
        onPeriodChange?.(newPeriod)
    }

    return (
        <Card className={cn("bg-slate-900/95 border-slate-700 backdrop-blur-xl", className)}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Trophy className="w-3 h-3 text-yellow-400" />
                        <CardTitle className="text-sm">Driver Leaderboard</CardTitle>
                    </div>
                    <Tabs value={selectedPeriod} onValueChange={handlePeriodChange}>
                        <TabsList className="h-8 bg-slate-800">
                            <TabsTrigger value="week" className="text-xs px-2 h-6">Week</TabsTrigger>
                            <TabsTrigger value="month" className="text-xs px-2 h-6">Month</TabsTrigger>
                            <TabsTrigger value="quarter" className="text-xs px-2 h-6">Quarter</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-80">
                    <div className="space-y-2 pr-2">
                        {leaderboardDrivers.length === 0 ? (
                            <div className="text-sm text-muted-foreground">No driver data available.</div>
                        ) : leaderboardDrivers.map((driver, index) => (
                            <button
                                key={driver.id}
                                onClick={() => onDriverClick?.(driver)}
                                className={cn(
                                    "w-full flex items-center gap-3 p-3 rounded-md transition-all",
                                    "hover:bg-slate-800/50 text-left",
                                    index === 0 && "bg-yellow-500/5 border border-yellow-500/20"
                                )}
                            >
                                {/* Rank */}
                                <RankBadge rank={driver.currentRank} />

                                {/* Avatar & Name */}
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <Avatar className="h-8 w-10 border-2 border-slate-700">
                                        <AvatarImage src={driver.avatarUrl} />
                                        <AvatarFallback className="bg-slate-800 text-slate-300">
                                            {driver.name.split(' ').map(n => n[0]).join('')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <p className="font-medium text-white truncate">{driver.name}</p>
                                        <div className="flex items-center gap-2 text-xs text-slate-700">
                                            <span>{driver.tripsCompleted} trips</span>
                                            {driver.streak && driver.streak > 0 && (
                                                <Badge variant="secondary" className="h-4 px-1.5 text-[10px] bg-emerald-500/20 text-emerald-700">
                                                    🔥 {driver.streak} day streak
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Rank Change */}
                                <div className="w-12 text-center">
                                    <RankChange previous={driver.previousRank} current={driver.currentRank} />
                                </div>

                                {/* Score */}
                                <div className="text-right">
                                    <p className={cn(
                                        "text-sm font-bold",
                                        driver.score >= 95 ? "text-emerald-700" :
                                            driver.score >= 85 ? "text-blue-700" :
                                                driver.score >= 75 ? "text-yellow-400" : "text-red-400"
                                    )}>
                                        {driver.score}
                                    </p>
                                    <p className="text-[10px] text-gray-800 uppercase">Score</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </ScrollArea>

                {/* Legend */}
                <div className="mt-2 pt-2 border-t border-slate-800 flex justify-center gap-2 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5" />
                        <span>Safety</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Timer className="w-3.5 h-3.5" />
                        <span>On-Time</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Fuel className="w-3.5 h-3.5" />
                        <span>Efficiency</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default DriverLeaderboard
