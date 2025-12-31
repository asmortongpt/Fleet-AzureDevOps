/**
 * EfficiencyMetricsChart - Vehicle efficiency and utilization metrics
 * Features: MPG trends, utilization rates, idle time, efficiency scores
 */

import { memo, useMemo } from 'react'
import {
    ComposedChart,
    Line,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
} from 'recharts'
import { Gauge, Lightning, Clock, Activity } from '@phosphor-icons/react'

export interface EfficiencyDataPoint {
    date: string
    mpg: number
    utilization: number
    idleTime: number
    efficiencyScore: number
    vehicleCount: number
}

export interface EfficiencyRadarData {
    category: string
    value: number
    fullMark: 100
}

interface EfficiencyMetricsChartProps {
    data: EfficiencyDataPoint[]
    radarData?: EfficiencyRadarData[]
    type?: 'trend' | 'radar'
    onDataPointClick?: (data: EfficiencyDataPoint) => void
}

export const EfficiencyMetricsChart = memo<EfficiencyMetricsChartProps>(({
    data,
    radarData,
    type = 'trend',
    onDataPointClick,
}) => {
    const stats = useMemo(() => {
        if (data.length === 0) return null

        const avgMPG = data.reduce((sum, d) => sum + d.mpg, 0) / data.length
        const avgUtilization = data.reduce((sum, d) => sum + d.utilization, 0) / data.length
        const avgIdleTime = data.reduce((sum, d) => sum + d.idleTime, 0) / data.length
        const avgEfficiencyScore = data.reduce((sum, d) => sum + d.efficiencyScore, 0) / data.length

        // Calculate improvement over time
        const firstHalf = data.slice(0, Math.floor(data.length / 2))
        const secondHalf = data.slice(Math.floor(data.length / 2))
        const firstEfficiency = firstHalf.reduce((sum, d) => sum + d.efficiencyScore, 0) / firstHalf.length
        const secondEfficiency = secondHalf.reduce((sum, d) => sum + d.efficiencyScore, 0) / secondHalf.length
        const improvement = ((secondEfficiency - firstEfficiency) / firstEfficiency) * 100

        return {
            avgMPG: avgMPG.toFixed(1),
            avgUtilization: avgUtilization.toFixed(0),
            avgIdleTime: avgIdleTime.toFixed(1),
            avgEfficiencyScore: avgEfficiencyScore.toFixed(0),
            improvement: improvement.toFixed(1),
        }
    }, [data])

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload) return null

        return (
            <div className="bg-slate-800/95 border border-slate-700 rounded-lg p-4 shadow-xl">
                <p className="text-slate-300 font-medium mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between gap-4 text-sm">
                        <span className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-slate-400">{entry.name}:</span>
                        </span>
                        <span className="font-semibold text-white">
                            {entry.dataKey === 'mpg' ? `${entry.value} MPG` :
                             entry.dataKey === 'utilization' ? `${entry.value}%` :
                             entry.dataKey === 'idleTime' ? `${entry.value} hrs` :
                             entry.value}
                        </span>
                    </div>
                ))}
            </div>
        )
    }

    const renderTrendChart = () => (
        <ComposedChart
            data={data}
            onClick={onDataPointClick}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
            <YAxis yAxisId="left" stroke="#94a3b8" fontSize={12} />
            <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />

            <Bar
                yAxisId="left"
                dataKey="utilization"
                fill="#3b82f6"
                fillOpacity={0.6}
                name="Utilization %"
            />
            <Bar
                yAxisId="left"
                dataKey="idleTime"
                fill="#ef4444"
                fillOpacity={0.6}
                name="Idle Time (hrs)"
            />
            <Line
                yAxisId="right"
                type="monotone"
                dataKey="mpg"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="MPG"
            />
            <Line
                yAxisId="left"
                type="monotone"
                dataKey="efficiencyScore"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ r: 4 }}
                name="Efficiency Score"
            />
        </ComposedChart>
    )

    const renderRadarChart = () => {
        if (!radarData || radarData.length === 0) {
            return (
                <div className="flex items-center justify-center h-full text-slate-400">
                    <p>No radar data available</p>
                </div>
            )
        }

        return (
            <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="category" stroke="#94a3b8" fontSize={12} />
                <PolarRadiusAxis stroke="#94a3b8" fontSize={12} />
                <Radar
                    name="Efficiency Metrics"
                    dataKey="value"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                />
                <Tooltip content={<CustomTooltip />} />
            </RadarChart>
        )
    }

    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-slate-400">
                <p>No efficiency data available</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Summary Stats */}
            {stats && type === 'trend' && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-slate-800/40 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                            <Gauge className="w-4 h-4" />
                            <span>Avg MPG</span>
                        </div>
                        <p className="text-2xl font-bold text-white">
                            {stats.avgMPG}
                        </p>
                    </div>
                    <div className="bg-slate-800/40 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                            <Activity className="w-4 h-4" />
                            <span>Utilization</span>
                        </div>
                        <p className="text-2xl font-bold text-white">
                            {stats.avgUtilization}%
                        </p>
                    </div>
                    <div className="bg-slate-800/40 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                            <Clock className="w-4 h-4" />
                            <span>Idle Time</span>
                        </div>
                        <p className="text-2xl font-bold text-white">
                            {stats.avgIdleTime}h
                        </p>
                    </div>
                    <div className="bg-slate-800/40 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                            <Lightning className="w-4 h-4" />
                            <span>Efficiency</span>
                        </div>
                        <p className="text-2xl font-bold text-white">
                            {stats.avgEfficiencyScore}
                        </p>
                    </div>
                    <div className="bg-slate-800/40 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                            <span>Improvement</span>
                        </div>
                        <p className={`text-2xl font-bold ${parseFloat(stats.improvement) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {parseFloat(stats.improvement) >= 0 ? '+' : ''}{stats.improvement}%
                        </p>
                    </div>
                </div>
            )}

            {/* Chart */}
            <div className="bg-slate-800/40 rounded-lg p-6">
                <ResponsiveContainer width="100%" height={400}>
                    {type === 'trend' ? renderTrendChart() : renderRadarChart()}
                </ResponsiveContainer>
            </div>
        </div>
    )
})

EfficiencyMetricsChart.displayName = 'EfficiencyMetricsChart'
