import { ComponentProps, ReactNode } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface MobileCardProps extends ComponentProps<"div"> {
  title: string
  subtitle?: string
  badge?: ReactNode
  fields: Array<{
    label: string
    value: ReactNode
    icon?: ReactNode
  }>
  actions?: ReactNode
  onClick?: () => void
}

export function MobileCard({
  title,
  subtitle,
  badge,
  fields,
  actions,
  onClick,
  className,
  ...props
}: MobileCardProps) {
  return (
    <Card
      className={cn(
        "md:hidden hover:shadow-md transition-shadow touch-target",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
      {...props}
    >
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate">{title}</h3>
            {subtitle && (
              <p className="text-sm text-muted-foreground truncate">
                {subtitle}
              </p>
            )}
          </div>
          {badge && <div className="flex-shrink-0">{badge}</div>}
        </div>

        {/* Fields */}
        <div className="grid grid-cols-2 gap-3">
          {fields.map((field, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {field.icon && (
                  <span className="flex-shrink-0">{field.icon}</span>
                )}
                <span className="font-medium uppercase tracking-wide">
                  {field.label}
                </span>
              </div>
              <div className="text-sm font-medium truncate">
                {field.value}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex gap-2 pt-2 border-t touch-spacing">
            {actions}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
