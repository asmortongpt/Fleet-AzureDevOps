import { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface ResponsiveTableProps<T> {
  data: T[]
  desktopView: ReactNode
  mobileCardRender: (item: T) => ReactNode
  emptyState?: ReactNode
  className?: string
}

export function ResponsiveTable<T>({
  data,
  desktopView,
  mobileCardRender,
  emptyState,
  className,
}: ResponsiveTableProps<T>) {
  if (data.length === 0 && emptyState) {
    return <div className={className}>{emptyState}</div>
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop Table View */}
      <div className="hidden md:block">{desktopView}</div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {data.map((item, index) => (
          <div key={index}>{mobileCardRender(item)}</div>
        ))}
      </div>
    </div>
  )
}
