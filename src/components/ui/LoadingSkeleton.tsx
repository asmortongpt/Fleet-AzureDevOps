import { Skeleton } from "./skeleton";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

/**
 * LoadingSkeleton - Comprehensive loading skeletons for all major UI sections
 *
 * Provides loading states for:
 * - Map loading
 * - Vehicle list loading
 * - Dashboard cards loading
 * - Table loading
 * - Detail panels
 */

interface LoadingSkeletonProps {
  className?: string;
}

/**
 * MapLoadingSkeleton - Loading state for map component
 */
export function MapLoadingSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div className={cn("relative w-full h-full bg-gray-100 overflow-hidden", className)}>
      {/* Map background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="grid grid-cols-8 grid-rows-8 h-full w-full">
          {Array.from({ length: 64 }).map((_, i) => (
            <div key={i} className="border border-gray-300" />
          ))}
        </div>
      </div>

      {/* Loading overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          {/* Animated map icon */}
          <motion.div
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
            className="w-16 h-16 rounded-full border-4 border-blue-500 border-t-transparent"
          />
          <div className="text-center">
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </motion.div>
      </div>

      {/* Shimmer markers */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-8 h-8 bg-blue-300 rounded-full"
          style={{
            top: `${20 + i * 15}%`,
            left: `${15 + i * 18}%`,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
}

/**
 * VehicleListLoadingSkeleton - Loading state for vehicle list
 */
export function VehicleListLoadingSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div className={cn("space-y-3 p-4", className)}>
      {/* Search bar skeleton */}
      <Skeleton className="h-10 w-full mb-4" />

      {/* Filter chips */}
      <div className="flex gap-2 mb-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-20" />
        ))}
      </div>

      {/* Vehicle items */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center gap-4 p-3 border rounded-lg"
        >
          {/* Avatar */}
          <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />

          {/* Content */}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>

          {/* Status badge */}
          <Skeleton className="h-6 w-16 rounded-full" />
        </motion.div>
      ))}
    </div>
  );
}

/**
 * DashboardCardsLoadingSkeleton - Loading state for dashboard cards
 */
export function DashboardCardsLoadingSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6", className)}>
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="border rounded-lg p-6 space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>

          {/* Value */}
          <Skeleton className="h-10 w-32" />

          {/* Trend */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>

          {/* Chart preview */}
          <div className="flex items-end gap-1 h-12">
            {[...Array(7)].map((_, j) => (
              <Skeleton
                key={j}
                className="flex-1"
                style={{ height: `${30 + Math.random() * 70}%` }}
              />
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/**
 * TableLoadingSkeleton - Loading state for data tables
 */
export function TableLoadingSkeleton({
  className,
  rows = 10,
  columns = 5
}: LoadingSkeletonProps & { rows?: number; columns?: number }) {
  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      {/* Table header */}
      <div className="grid gap-4 p-4 bg-gray-50 border-b" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {[...Array(columns)].map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>

      {/* Table rows */}
      <div className="divide-y">
        {[...Array(rows)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.02 }}
            className="grid gap-4 p-4"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {[...Array(columns)].map((_, j) => (
              <Skeleton key={j} className="h-4 w-full" />
            ))}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/**
 * DetailPanelLoadingSkeleton - Loading state for detail panels/drawers
 */
export function DetailPanelLoadingSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div className={cn("space-y-6 p-6", className)}>
      {/* Header */}
      <div className="space-y-3">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-5 w-1/2" />
      </div>

      {/* Image/media section */}
      <Skeleton className="h-48 w-full rounded-lg" />

      {/* Info sections */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="space-y-3"
        >
          {/* Section title */}
          <Skeleton className="h-6 w-32" />

          {/* Key-value pairs */}
          <div className="space-y-2">
            {[...Array(4)].map((_, j) => (
              <div key={j} className="flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </motion.div>
      ))}

      {/* Action buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
      </div>
    </div>
  );
}

/**
 * ChartLoadingSkeleton - Loading state for charts
 */
export function ChartLoadingSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div className={cn("border rounded-lg p-6 space-y-4", className)}>
      {/* Chart header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>

      {/* Chart area */}
      <div className="relative h-64">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-3 w-10" />
          ))}
        </div>

        {/* Chart bars/lines */}
        <div className="ml-16 h-full flex items-end gap-2">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="flex-1 bg-gray-200 rounded-t"
              initial={{ height: 0 }}
              animate={{ height: `${30 + Math.random() * 70}%` }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            />
          ))}
        </div>

        {/* X-axis labels */}
        <div className="ml-16 mt-2 flex justify-between">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-3 w-8" />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 justify-center">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * FormLoadingSkeleton - Loading state for forms
 */
export function FormLoadingSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div className={cn("space-y-6 p-6", className)}>
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="space-y-2"
        >
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </motion.div>
      ))}

      <div className="flex gap-3 pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

/**
 * GridLoadingSkeleton - Generic grid loading skeleton
 */
export function GridLoadingSkeleton({
  className,
  items = 6,
  columns = 3
}: LoadingSkeletonProps & { items?: number; columns?: number }) {
  return (
    <div
      className={cn("grid gap-6", className)}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {[...Array(items)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          className="border rounded-lg p-4 space-y-3"
        >
          <Skeleton className="h-32 w-full rounded-md" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </motion.div>
      ))}
    </div>
  );
}
