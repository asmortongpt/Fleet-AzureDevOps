import { ComponentProps } from "react"

import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "bg-muted/60 animate-pulse rounded-lg",
        className
      )}
      {...props}
    />
  )
}

// Text skeleton with realistic line appearance
interface SkeletonTextProps extends ComponentProps<"div"> {
  lines?: number
  lastLineWidth?: "full" | "3/4" | "1/2" | "1/4"
}

function SkeletonText({
  lines = 3,
  lastLineWidth = "3/4",
  className,
  ...props
}: SkeletonTextProps) {
  const widthClasses = {
    full: "w-full",
    "3/4": "w-3/4",
    "1/2": "w-1/2",
    "1/4": "w-1/4",
  }

  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 ? widthClasses[lastLineWidth] : "w-full"
          )}
        />
      ))}
    </div>
  )
}

// Card skeleton for loading states
function SkeletonCard({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton-card"
      className={cn(
        "rounded-md border border-border/50 bg-card/50 p-2 sm:p-3 space-y-2",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-10 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonText lines={2} lastLineWidth="3/4" />
    </div>
  )
}

// Stat card skeleton
function SkeletonStatCard({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton-stat-card"
      className={cn(
        "rounded-md border border-border/50 bg-card/50 p-2 space-y-3",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-24" />
    </div>
  )
}

// Avatar skeleton
interface SkeletonAvatarProps extends ComponentProps<"div"> {
  size?: "sm" | "default" | "lg" | "xl"
}

function SkeletonAvatar({
  size = "default",
  className,
  ...props
}: SkeletonAvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    default: "h-8 w-10",
    lg: "h-9 w-12",
    xl: "h-16 w-16",
  }

  return (
    <Skeleton
      className={cn(sizeClasses[size], "rounded-full shrink-0", className)}
      {...props}
    />
  )
}

// Table row skeleton
function SkeletonTableRow({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton-table-row"
      className={cn(
        "flex items-center gap-2 py-3 px-2 border-b border-border/30",
        className
      )}
      {...props}
    >
      <Skeleton className="h-4 w-4 rounded" />
      <SkeletonAvatar size="sm" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
      <Skeleton className="h-8 w-8 rounded-lg" />
    </div>
  )
}

// List skeleton for multiple items
interface SkeletonListProps extends ComponentProps<"div"> {
  count?: number
  variant?: "card" | "stat" | "row"
}

function SkeletonList({
  count = 3,
  variant = "card",
  className,
  ...props
}: SkeletonListProps) {
  const SkeletonComponent = {
    card: SkeletonCard,
    stat: SkeletonStatCard,
    row: SkeletonTableRow,
  }[variant]

  return (
    <div
      data-slot="skeleton-list"
      className={cn(
        variant === "row" ? "divide-y divide-border/30" : "space-y-3 sm:space-y-2",
        className
      )}
      {...props}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </div>
  )
}

// Grid skeleton for dashboard layouts
interface SkeletonGridProps extends ComponentProps<"div"> {
  count?: number
  columns?: 2 | 3 | 4
}

function SkeletonGrid({
  count = 4,
  columns = 4,
  className,
  ...props
}: SkeletonGridProps) {
  const columnClasses = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  }

  return (
    <div
      data-slot="skeleton-grid"
      className={cn("grid gap-3 sm:gap-2", columnClasses[columns], className)}
      {...props}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonStatCard key={i} />
      ))}
    </div>
  )
}

// Chart/visualization skeleton
function SkeletonChart({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton-chart"
      className={cn(
        "rounded-md border border-border/50 bg-card/50 p-2 sm:p-3",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="h-5 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>
      <Skeleton className="h-48 sm:h-64 w-full rounded-lg" />
    </div>
  )
}

// Hub page skeleton
function SkeletonHubPage({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton-hub-page"
      className={cn("p-2 sm:p-3 space-y-2 sm:space-y-2", className)}
      {...props}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-lg shrink-0" />
        ))}
      </div>

      {/* Stats grid */}
      <SkeletonGrid count={4} columns={4} />

      {/* Content cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-2">
        <SkeletonChart />
        <SkeletonCard />
        <SkeletonChart />
      </div>
    </div>
  )
}

export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonStatCard,
  SkeletonAvatar,
  SkeletonTableRow,
  SkeletonList,
  SkeletonGrid,
  SkeletonChart,
  SkeletonHubPage,
}
