import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { cn } from '@/lib/utils'

export interface DrilldownChartProps {
    title: string
    data: any[]
    type: 'bar' | 'pie'
    dataKey: string
    categoryKey: string
    drilldownType: string
    colors?: string[]
    className?: string
    height?: number
    unit?: string
}

const DEFAULT_COLORS = [
    '#3b82f6', // blue-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
]

export function DrilldownChart({
    title,
    data,
    type,
    dataKey,
    categoryKey,
    drilldownType,
    colors = DEFAULT_COLORS,
    className,
    height = 300,
    unit = ''
}: DrilldownChartProps) {
    const { push } = useDrilldown()

    const handleDrilldown = (entry: any) => {
        if (!entry) return

        // Recharts payload structure varies by chart type
        const payload = entry.payload || entry

        push({
            id: `${drilldownType}-${Date.now()}`,
            type: drilldownType,
            label: `${payload[categoryKey]} Details`,
            data: {
                category: payload[categoryKey],
                value: payload[dataKey],
                fullData: payload
            }
        })
    }

    return (
        <Card className={cn("overflow-hidden", className)}>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div style={{ height }}>
                    <ResponsiveContainer width="100%" height="100%">
                        {type === 'bar' ? (
                            <BarChart data={data} layout="horizontal" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey={categoryKey}
                                    tick={{ fontSize: 12 }}
                                    interval={0}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value.toLocaleString()}${unit}`}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                    contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar
                                    dataKey={dataKey}
                                    radius={[4, 4, 0, 0]}
                                    onClick={(data) => handleDrilldown(data)}
                                    cursor="pointer"
                                >
                                    {data.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        ) : (
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey={dataKey}
                                    nameKey={categoryKey}
                                    onClick={(data) => handleDrilldown(data)}
                                    cursor="pointer"
                                >
                                    {data.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number) => [`${value.toLocaleString()}${unit}`, '']}
                                    contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        )}
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
