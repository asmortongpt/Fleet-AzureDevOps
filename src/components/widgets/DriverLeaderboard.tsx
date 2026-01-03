/**
 * Driver Leaderboard Widget
 * Gamified driver performance ranking with scores and achievements
 */

import { useState } from 'react'
import {
    Trophy,
    Medal,
    Star,
    TrendUp,
    TrendDown,
    Minus,
    User,
    Shield,
    Timer,
    GasPump
} from '@phosphor-icons/react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

// Demo data
const DEMO_DRIVERS: DriverScore[] = [
    {
        id: '1',
        name: 'Marcus Johnson',
        score: 98,
        previousRank: 2,
        currentRank: 1,
        safetyScore: 99,
        efficiencyScore: 97,
        onTimeScore: 98,
        fuelScore: 96,
        tripsCompleted: 142,
        streak: 14,
        badges: ['Safety Star', 'Fuel Saver']
    },
    {
        id: '2',
        name: 'Sarah Chen',
        score: 96,
        previousRank: 1,
        currentRank: 2,
        safetyScore: 97,
        efficiencyScore: 95,
        onTimeScore: 96,
        fuelScore: 94,
        tripsCompleted: 128,
        streak: 7,
        badges: ['Punctual Pro']
    },
    {
        id: '3',
        name: 'James Wilson',
        score: 94,
        previousRank: 3,
        currentRank: 3,
        safetyScore: 95,
        efficiencyScore: 93,
        onTimeScore: 94,
        fuelScore: 92,
        tripsCompleted: 115,
        badges: ['Road Warrior']
    },
    {
        id: '4',
        name: 'Emily Davis',
        score: 91,
        previousRank: 5,
        currentRank: 4,
        safetyScore: 92,
        efficiencyScore: 90,
        onTimeScore: 91,
        fuelScore: 89,
        tripsCompleted: 98,
        streak: 3
    },
    {
        id: '5',
        name: 'Michael Brown',
        score: 89,
        previousRank: 4,
        currentRank: 5,
        safetyScore: 88,
        efficiencyScore: 90,
        onTimeScore: 88,
        fuelScore: 91,
        tripsCompleted: 105
    }
]

function RankBadge({ rank }: { rank: number }) {
    if (rank === 1) {
        return (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/20">
                <Trophy className="w-4 h-4 text-yellow-900" weight="fill" />
            </div>
        )
    }
    if (rank === 2) {
        return (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-300 to-slate-500 flex items-center justify-center shadow-lg shadow-slate-400/20">
                <Medal className="w-4 h-4 text-slate-700" weight="fill" />
            </div>
        )
    }
    if (rank === 3) {
        return (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-lg shadow-amber-600/20">
                <Medal className="w-4 h-4 text-amber-200" weight="fill" />
            </div>
        )
    }
    return (
        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-400">
            {rank}
        </div>
    )
}

function RankChange({ previous, current }: { previous: number; current: number }) {
    const change = previous - current
    if (change > 0) {
        return (
            <div className="flex items-center gap-1 text-emerald-400">
                <TrendUp className="w-3 h-3" weight="bold" />
                <span className="text-xs font-medium">+{change}</span>
            </div>
        )
    }
    if (change < 0) {
        return (
            <div className="flex items-center gap-1 text-red-400">
                <TrendDown className="w-3 h-3" weight="bold" />
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
    drivers = DEMO_DRIVERS,
    period = 'month',
    onPeriodChange,
    onDriverClick,
    className
}: DriverLeaderboardProps) {
    const [selectedPeriod, setSelectedPeriod] = useState(period)

    const handlePeriodChange = (newPeriod: string) => {
        setSelectedPeriod(newPeriod as typeof period)
        onPeriodChange?.(newPeriod)
    }

    return (
        <Card className={cn("bg-slate-900/95 border-slate-700 backdrop-blur-xl", className)}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-400" weight="fill" />
                        <CardTitle className="text-lg">Driver Leaderboard</CardTitle>
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
                    <div className="space-y-2 pr-4">
                        {drivers.map((driver, index) => (
                            <button
                                key={driver.id}
                                onClick={() => onDriverClick?.(driver)}
                                className={cn(
                                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all",
                                    "hover:bg-slate-800/50 text-left",
                                    index === 0 && "bg-yellow-500/5 border border-yellow-500/20"
                                )}
                            >
                                {/* Rank */}
                                <RankBadge rank={driver.currentRank} />

                                {/* Avatar & Name */}
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <Avatar className="h-10 w-10 border-2 border-slate-700">
                                        <AvatarImage src={driver.avatarUrl} />
                                        <AvatarFallback className="bg-slate-800 text-slate-300">
                                            {driver.name.split(' ').map(n => n[0]).join('')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <p className="font-medium text-white truncate">{driver.name}</p>
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <span>{driver.tripsCompleted} trips</span>
                                            {driver.streak && driver.streak > 0 && (
                                                <Badge variant="secondary" className="h-4 px-1.5 text-[10px] bg-emerald-500/20 text-emerald-400">
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
                                        "text-lg font-bold",
                                        driver.score >= 95 ? "text-emerald-400" :
                                            driver.score >= 85 ? "text-blue-400" :
                                                driver.score >= 75 ? "text-yellow-400" : "text-red-400"
                                    )}>
                                        {driver.score}
                                    </p>
                                    <p className="text-[10px] text-slate-500 uppercase">Score</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </ScrollArea>

                {/* Legend */}
                <div className="mt-4 pt-4 border-t border-slate-800 flex justify-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5" />
                        <span>Safety</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Timer className="w-3.5 h-3.5" />
                        <span>On-Time</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <GasPump className="w-3.5 h-3.5" />
                        <span>Efficiency</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default DriverLeaderboard
