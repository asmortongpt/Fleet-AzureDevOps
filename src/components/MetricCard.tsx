import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendUp, TrendDown, Minus } from "@phosphor-icons/react"
import { motion } from "framer-motion"

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  trend?: "up" | "down" | "neutral"
  subtitle?: string
  icon?: React.ReactNode
  status?: "success" | "warning" | "error" | "info"
}

export function MetricCard({
  title,
  value,
  change,
  trend = "neutral",
  subtitle,
  icon,
  status
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (trend === "up") return <TrendUp className="w-2.5 h-2.5" weight="bold" />
    if (trend === "down") return <TrendDown className="w-2.5 h-2.5" weight="bold" />
    return <Minus className="w-2.5 h-2.5" weight="bold" />
  }

  const getTrendColor = () => {
    if (trend === "up") return "text-success"
    if (trend === "down") return "text-destructive"
    return "text-muted-foreground"
  }

  const getStatusColor = () => {
    if (status === "success") return "bg-success/10 text-success border-success/20"
    if (status === "warning") return "bg-warning/10 text-warning border-warning/20"
    if (status === "error") return "bg-destructive/10 text-destructive border-destructive/20"
    if (status === "info") return "bg-accent/10 text-accent border-accent/20"
    return "bg-muted text-muted-foreground"
  }

  return (
    <Card className="hover:shadow-md transition-shadow duration-200 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0.5 px-2 pt-2 gap-2">
        <CardTitle className="text-[10px] font-medium text-muted-foreground truncate min-w-0 flex-1" title={title}>
          {title}
        </CardTitle>
        {icon && (
          <div className={`p-1 rounded ${getStatusColor()} shrink-0`}>
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent className="px-2 pb-2">
        <motion.div
          className="text-base font-semibold metric-number truncate"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          title={String(value)}
        >
          {value}
        </motion.div>
        <div className="flex items-center gap-1 mt-0.5">
          {change !== undefined && (
            <Badge
              variant="outline"
              className={`${getTrendColor()} border-current/20 gap-0.5 text-[8px] h-3.5 px-0.5`}
            >
              {getTrendIcon()}
              <span className="font-medium">
                {Math.abs(change)}%
              </span>
            </Badge>
          )}
          {subtitle && (
            <p className="text-[9px] text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
