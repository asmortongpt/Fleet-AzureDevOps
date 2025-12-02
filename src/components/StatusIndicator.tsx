import { Badge } from "@/components/ui/badge"
import { CheckCircle, Warning, XCircle, Circle } from "@phosphor-icons/react"
import { motion } from "framer-motion"

interface StatusIndicatorProps {
  status: "healthy" | "warning" | "critical" | "offline"
  label: string
  uptime?: string
}

export function StatusIndicator({ status, label, uptime }: StatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "healthy":
        return {
          icon: <CheckCircle className="w-4 h-4" weight="fill" />,
          color: "text-success bg-success/10 border-success/20",
          text: "Healthy"
        }
      case "warning":
        return {
          icon: <Warning className="w-4 h-4" weight="fill" />,
          color: "text-warning bg-warning/10 border-warning/20",
          text: "Warning"
        }
      case "critical":
        return {
          icon: <XCircle className="w-4 h-4" weight="fill" />,
          color: "text-destructive bg-destructive/10 border-destructive/20",
          text: "Critical"
        }
      case "offline":
        return {
          icon: <Circle className="w-4 h-4" />,
          color: "text-muted-foreground bg-muted border-border",
          text: "Offline"
        }
    }
  }

  const config = getStatusConfig()

  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-lg border bg-card">
      <div className="flex items-center gap-3">
        <motion.div
          animate={status === "healthy" ? {} : { scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className={config.color}
        >
          {config.icon}
        </motion.div>
        <div>
          <p className="text-sm font-medium">{label}</p>
          {uptime && (
            <p className="text-xs text-muted-foreground">{uptime}</p>
          )}
        </div>
      </div>
      <Badge variant="outline" className={`${config.color} border-current/20`}>
        {config.text}
      </Badge>
    </div>
  )
}
