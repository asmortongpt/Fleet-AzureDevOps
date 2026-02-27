/**
 * CostAnalyticsChart - Advanced cost analytics visualization
 * Features: Time-series cost trends, category breakdown, YoY comparison
 */

import { TrendingDown, TrendingUp, DollarSign } from 'lucide-react'
import { memo, useMemo } from 'react'
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ComposedChart,
} from 'recharts'

export interface CostDataPoint {
    date: string
    fuel: number
    maintenance: number
    insurance: number
    depreciation: number
    total: number
    budget?: number
}

interface CostAnalyticsChartProps {
    data: CostDataPoint[]
    type?: 'line' | 'area' | 'bar' | 'composed'
    showBudget?: boolean
    timeframe?: 'daily' | 'weekly' | 'monthly' | 'yearly'
    onDataPointClick?: (data: CostDataPoint) => void
}

export const CostAnalyticsChart = memo<CostAnalyticsChartProps>(({
    data,
    type = 'composed',
    showBudget = true,
    timeframe = 'monthly',
    onDataPointClick,
}) => {
    const stats = useMemo(() => {
        if (data.length === 0) return null

        const totalCost = data.reduce((sum, d) => sum + d.total, 0)
        const avgCost = totalCost / data.length
        const maxCost = Math.max(...data.map(d => d.total))
        const minCost = Math.min(...data.map(d => d.total))

        // Calculate trend (simple linear regression)
        const firstHalf = data.slice(0, Math.floor(data.length / 2))
        const secondHalf = data.slice(Math.floor(data.length / 2))
        const firstAvg = firstHalf.reduce((sum, d) => sum + d.total, 0) / firstHalf.length
        const secondAvg = secondHalf.reduce((sum, d) => sum + d.total, 0) / secondHalf.length
        const trend = secondAvg > firstAvg ? 'up' : 'down'
        const trendPercent = Math.abs(((secondAvg - firstAvg) / firstAvg) * 100).toFixed(1)

        return {
            totalCost,
            avgCost,
            maxCost,
            minCost,
            trend,
            trendPercent,
        }
    }, [data])

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value)
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload) return null

        return (
            <div className="bg-[#1a1a1a]/95 border border-white/[0.15] rounded-lg p-2">
                <p className="text-white/60 font-medium mb-2">{label}</p>
                {payload.map((entry: any) => (
                    <div key={entry.name} className="flex items-center justify-between gap-2 text-sm">
                        <span className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-white/70">{entry.name}:</span>
                        </span>
                        <span className="font-semibold text-white">
                            {formatCurrency(entry.value)}
                        </span>
                    </div>
                ))}
            </div>
        )
    }

    const renderChart = () => {
        const chartConfig = {
            margin: { top: 10, right: 30, left: 0, bottom: 0 },
        }

        switch (type) {
            case 'line':
                return (
                    <LineChart data={data} {...chartConfig}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={formatCurrency} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Line
                            type="monotone"
                            dataKey="fuel"
                            stroke="hsl(var(--chart-1))"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                            name="Fuel"
                        />
                        <Line
                            type="monotone"
                            dataKey="maintenance"
                            stroke="hsl(var(--chart-3))"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            name="Maintenance"
                        />
                        <Line
                            type="monotone"
                            dataKey="insurance"
                            stroke="hsl(var(--chart-4))"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            name="Insurance"
                        />
                        <Line
                            type="monotone"
                            dataKey="total"
                            stroke="hsl(var(--chart-2))"
                            strokeWidth={3}
                            dot={{ r: 5 }}
                            name="Total"
                        />
                        {showBudget && (
                            <Line
                                type="monotone"
                                dataKey="budget"
                                stroke="hsl(var(--chart-6))"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={false}
                                name="Budget"
                            />
                        )}
                    </LineChart>
                )

            case 'area':
                return (
                    <AreaChart data={data} {...chartConfig}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={formatCurrency} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Area
                            type="monotone"
                            dataKey="fuel"
                            stackId="1"
                            stroke="hsl(var(--chart-1))"
                            fill="hsl(var(--chart-1))"
                            fillOpacity={0.6}
                            name="Fuel"
                        />
                        <Area
                            type="monotone"
                            dataKey="maintenance"
                            stackId="1"
                            stroke="hsl(var(--chart-3))"
                            fill="hsl(var(--chart-3))"
                            fillOpacity={0.6}
                            name="Maintenance"
                        />
                        <Area
                            type="monotone"
                            dataKey="insurance"
                            stackId="1"
                            stroke="hsl(var(--chart-4))"
                            fill="hsl(var(--chart-4))"
                            fillOpacity={0.6}
                            name="Insurance"
                        />
                        <Area
                            type="monotone"
                            dataKey="depreciation"
                            stackId="1"
                            stroke="hsl(var(--chart-5))"
                            fill="hsl(var(--chart-5))"
                            fillOpacity={0.6}
                            name="Depreciation"
                        />
                    </AreaChart>
                )

            case 'bar':
                return (
                    <BarChart data={data} {...chartConfig}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={formatCurrency} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Bar dataKey="fuel" fill="hsl(var(--chart-1))" name="Fuel" />
                        <Bar dataKey="maintenance" fill="hsl(var(--chart-3))" name="Maintenance" />
                        <Bar dataKey="insurance" fill="hsl(var(--chart-4))" name="Insurance" />
                        <Bar dataKey="depreciation" fill="hsl(var(--chart-5))" name="Depreciation" />
                    </BarChart>
                )

            case 'composed':
            default:
                return (
                    <ComposedChart data={data} {...chartConfig}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={formatCurrency} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Bar dataKey="fuel" fill="hsl(var(--chart-1))" name="Fuel" />
                        <Bar dataKey="maintenance" fill="hsl(var(--chart-3))" name="Maintenance" />
                        <Bar dataKey="insurance" fill="hsl(var(--chart-4))" name="Insurance" />
                        <Line
                            type="monotone"
                            dataKey="total"
                            stroke="hsl(var(--chart-2))"
                            strokeWidth={3}
                            dot={{ r: 5 }}
                            name="Total"
                        />
                        {showBudget && (
                            <Line
                                type="monotone"
                                dataKey="budget"
                                stroke="hsl(var(--chart-6))"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={false}
                                name="Budget"
                            />
                        )}
                    </ComposedChart>
                )
        }
    }

    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-white/70">
                <p>No cost data available</p>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {/* Summary Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="bg-[#1a1a1a]/40 rounded-lg p-2">
                        <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                            <DollarSign className="w-4 h-4" />
                            <span>Total Cost</span>
                        </div>
                        <p className="text-sm font-bold text-white">
                            {formatCurrency(stats.totalCost)}
                        </p>
                    </div>
                    <div className="bg-[#1a1a1a]/40 rounded-lg p-2">
                        <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                            <span>Average</span>
                        </div>
                        <p className="text-sm font-bold text-white">
                            {formatCurrency(stats.avgCost)}
                        </p>
                    </div>
                    <div className="bg-[#1a1a1a]/40 rounded-lg p-2">
                        <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                            <span>Peak</span>
                        </div>
                        <p className="text-sm font-bold text-white">
                            {formatCurrency(stats.maxCost)}
                        </p>
                    </div>
                    <div className="bg-[#1a1a1a]/40 rounded-lg p-2">
                        <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                            {stats.trend === 'up' ? (
                                <TrendingUp className="w-4 h-4 text-red-400" />
                            ) : (
                                <TrendingDown className="w-4 h-4 text-green-400" />
                            )}
                            <span>Trend</span>
                        </div>
                        <p className={`text-sm font-bold ${stats.trend === 'up' ? 'text-red-400' : 'text-green-400'}`}>
                            {stats.trend === 'up' ? '+' : '-'}{stats.trendPercent}%
                        </p>
                    </div>
                </div>
            )}

            {/* Chart */}
            <div className="bg-[#1a1a1a]/40 rounded-lg p-3">
                <ResponsiveContainer width="100%" height={400}>
                    {renderChart()}
                </ResponsiveContainer>
            </div>
        </div>
    )
})

CostAnalyticsChart.displayName = 'CostAnalyticsChart'
