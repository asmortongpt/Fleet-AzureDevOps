import { cn } from "@/lib/utils"

interface LoadingSkeletonProps {
  className?: string
  count?: number
}

export function LoadingSkeleton({ className, count = 1 }: LoadingSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "animate-pulse bg-gray-200 dark:bg-gray-700 rounded",
            className
          )}
        />
      ))}
    </>
  )
}

export function TableSkeleton() {
  return (
    <div className="space-y-3">
      <LoadingSkeleton className="h-12 w-full" />
      <LoadingSkeleton className="h-10 w-full" count={5} />
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="space-y-4 p-6 border rounded-lg">
      <LoadingSkeleton className="h-6 w-1/3" />
      <LoadingSkeleton className="h-4 w-full" count={3} />
    </div>
  )
}
