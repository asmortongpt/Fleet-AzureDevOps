import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts"

interface ChartCardProps {
  title: string
  data: any[]
  type?: "line" | "area" | "bar"
  dataKey: string
  xAxisKey?: string
  color?: string
  subtitle?: string
  height?: number
}

export function ChartCard({ 
  title, 
  data, 
  type = "line",
  dataKey,
  xAxisKey = "name",
  color = "oklch(0.45 0.15 250)",
  subtitle,
  height = 300
}: ChartCardProps) {
  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 10, left: 10, bottom: 5 }
    }

    const axisStyle = {
      fontSize: 12,
      fill: "oklch(0.52 0.03 250)"
    }

    switch (type) {
      case "area":
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.005 250)" />
            <XAxis dataKey={xAxisKey} style={axisStyle} />
            <YAxis style={axisStyle} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "oklch(1 0 0)",
                border: "1px solid oklch(0.90 0.005 250)",
                borderRadius: "0.5rem",
                fontSize: "14px"
              }}
            />
            <Area 
              type="monotone" 
              dataKey={dataKey} 
              stroke={color} 
              strokeWidth={2}
              fillOpacity={1} 
              fill={`url(#gradient-${dataKey})`}
            />
          </AreaChart>
        )
      
      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.005 250)" />
            <XAxis dataKey={xAxisKey} style={axisStyle} />
            <YAxis style={axisStyle} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "oklch(1 0 0)",
                border: "1px solid oklch(0.90 0.005 250)",
                borderRadius: "0.5rem",
                fontSize: "14px"
              }}
            />
            <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        )
      
      default:
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.005 250)" />
            <XAxis dataKey={xAxisKey} style={axisStyle} />
            <YAxis style={axisStyle} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "oklch(1 0 0)",
                border: "1px solid oklch(0.90 0.005 250)",
                borderRadius: "0.5rem",
                fontSize: "14px"
              }}
            />
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke={color} 
              strokeWidth={2}
              dot={{ fill: color, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          {renderChart()}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
