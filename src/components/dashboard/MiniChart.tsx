import { motion } from "framer-motion"
import { useMemo } from "react"

import { cn } from "@/lib/utils"

interface DataPoint {
  label: string
  value: number
}

interface MiniChartProps {
  title: string
  data: DataPoint[]
  type?: "bar" | "line" | "sparkline"
  color?: "blue" | "green" | "amber" | "red" | "purple"
  currentValue?: string | number
  className?: string
}

export function MiniChart({
  title,
  data,
  type = "bar",
  color = "blue",
  currentValue,
  className
}: MiniChartProps) {
  const maxValue = useMemo(() => Math.max(...data.map(d => d.value), 1), [data])

  const colorClasses = {
    blue: "bg-blue-500 dark:bg-blue-400",
    green: "bg-green-500 dark:bg-green-400",
    amber: "bg-amber-500 dark:bg-amber-400",
    red: "bg-red-500 dark:bg-red-400",
    purple: "bg-purple-500 dark:bg-purple-400"
  }

  const bgColorClasses = {
    blue: "bg-blue-100 dark:bg-blue-950",
    green: "bg-green-100 dark:bg-green-950",
    amber: "bg-amber-100 dark:bg-amber-950",
    red: "bg-red-100 dark:bg-red-950",
    purple: "bg-purple-100 dark:bg-purple-950"
  }

  if (type === "sparkline") {
    return (
      <div className={cn("compact-card", className)}>
        <div className="compact-card-header">
          <div className="compact-card-title">{title}</div>
          {currentValue && (
            <div className="text-sm font-bold text-foreground">{currentValue}</div>
          )}
        </div>
        <div className="compact-card-content">
          <div className="sparkline">
            {data.map((point, index) => {
              const height = (point.value / maxValue) * 100
              return (
                <motion.div
                  key={index}
                  className={cn("sparkline-bar", colorClasses[color])}
                  style={{ height: `${height}%` }}
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  title={`${point.label}: ${point.value}`}
                />
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  if (type === "bar") {
    return (
      <div className={cn("compact-card", className)}>
        <div className="compact-card-header">
          <div className="compact-card-title">{title}</div>
          {currentValue && (
            <div className="text-sm font-bold text-foreground">{currentValue}</div>
          )}
        </div>
        <div className="compact-card-content">
          <div className="flex flex-col gap-1 h-full justify-end">
            {data.slice(0, 5).map((point, index) => {
              const percentage = (point.value / maxValue) * 100
              return (
                <motion.div
                  key={index}
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <div className="text-[10px] text-muted-foreground w-12 truncate">
                    {point.label}
                  </div>
                  <div className="flex-1 h-4 bg-muted rounded-sm overflow-hidden">
                    <motion.div
                      className={cn("h-full", colorClasses[color])}
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                    />
                  </div>
                  <div className="text-[10px] font-semibold text-foreground w-8 text-right">
                    {point.value}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // Line chart (simplified)
  return (
    <div className={cn("compact-card", className)}>
      <div className="compact-card-header">
        <div className="compact-card-title">{title}</div>
        {currentValue && (
          <div className="text-sm font-bold text-foreground">{currentValue}</div>
        )}
      </div>
      <div className="compact-card-content">
        <div className="relative h-full">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <motion.polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={colorClasses[color]}
              points={data.map((point, index) => {
                const x = (index / (data.length - 1)) * 100
                const y = 100 - (point.value / maxValue) * 90
                return `${x},${y}`
              }).join(" ")}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, ease: "easeInOut" }}
            />
            <motion.polygon
              fill="currentColor"
              fillOpacity="0.1"
              className={colorClasses[color]}
              points={`0,100 ${data.map((point, index) => {
                const x = (index / (data.length - 1)) * 100
                const y = 100 - (point.value / maxValue) * 90
                return `${x},${y}`
              }).join(" ")} 100,100`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            />
          </svg>
        </div>
      </div>
    </div>
  )
}

// Donut Chart for status distribution
interface DonutChartProps {
  title: string
  data: Array<{ label: string; value: number; color: string }>
  total?: number
  className?: string
}

export function MiniDonutChart({ title, data, total, className }: DonutChartProps) {
  const totalValue = total || data.reduce((sum, item) => sum + item.value, 0)

  let currentAngle = 0
  const segments = data.map(item => {
    const percentage = (item.value / totalValue) * 100
    const angle = (item.value / totalValue) * 360
    const startAngle = currentAngle
    currentAngle += angle

    return {
      ...item,
      percentage,
      startAngle,
      angle
    }
  })

  return (
    <div className={cn("compact-card", className)}>
      <div className="compact-card-header">
        <div className="compact-card-title">{title}</div>
        <div className="text-sm font-bold text-foreground">{totalValue}</div>
      </div>
      <div className="compact-card-content">
        <div className="flex items-center gap-3">
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {segments.map((segment, index) => {
                const radius = 40
                const centerX = 50
                const centerY = 50
                const startAngle = (segment.startAngle * Math.PI) / 180
                const endAngle = ((segment.startAngle + segment.angle) * Math.PI) / 180

                const x1 = centerX + radius * Math.cos(startAngle)
                const y1 = centerY + radius * Math.sin(startAngle)
                const x2 = centerX + radius * Math.cos(endAngle)
                const y2 = centerY + radius * Math.sin(endAngle)

                const largeArcFlag = segment.angle > 180 ? 1 : 0

                const pathData = [
                  `M ${centerX} ${centerY}`,
                  `L ${x1} ${y1}`,
                  `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                  'Z'
                ].join(' ')

                return (
                  <motion.path
                    key={index}
                    d={pathData}
                    fill="currentColor"
                    className={segment.color}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  />
                )
              })}
              <circle cx="50" cy="50" r="25" fill="hsl(var(--card))" />
            </svg>
          </div>
          <div className="flex-1 space-y-1">
            {segments.map((segment, index) => (
              <motion.div
                key={index}
                className="flex items-center justify-between text-[10px]"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className="flex items-center gap-1">
                  <div className={cn("w-2 h-2 rounded-full", segment.color)} />
                  <span className="text-muted-foreground truncate">{segment.label}</span>
                </div>
                <span className="font-semibold text-foreground">{segment.value}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
