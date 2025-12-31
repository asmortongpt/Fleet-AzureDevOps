/**
 * Page Skeleton Components
 * Loading state placeholders for better UX
 */

import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

// Hub page skeleton with cards
export function HubPageSkeleton() {
    return (
        <div className="p-6 space-y-6 animate-fade-in">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                </div>
            </div>

            {/* Tabs skeleton */}
            <div className="flex gap-2">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-10 w-28" />
                ))}
            </div>

            {/* Stats cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <StatCardSkeleton key={i} />
                ))}
            </div>

            {/* Content area skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CardSkeleton className="h-80" />
                <CardSkeleton className="h-80" />
            </div>
        </div>
    )
}

// Stat card skeleton
export function StatCardSkeleton() {
    return (
        <div className="p-4 rounded-xl border border-white/10 bg-slate-900/50 space-y-3">
            <div className="flex justify-between items-start">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-16" />
        </div>
    )
}

// Generic card skeleton
export function CardSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn("rounded-xl border border-white/10 bg-slate-900/50 p-4", className)}>
            <div className="space-y-3 h-full">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-32 w-full" />
            </div>
        </div>
    )
}

// Table skeleton
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-2">
            {/* Header */}
            <div className="flex gap-4 p-3 border-b border-white/10">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-4 p-3 border-b border-white/5">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/4" />
                </div>
            ))}
        </div>
    )
}

// Map skeleton
export function MapSkeleton() {
    return (
        <div className="relative w-full h-full min-h-[400px] rounded-xl overflow-hidden bg-slate-900/80">
            <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-slate-900/50 via-slate-800/50 to-slate-900/50" />
            <div className="absolute top-4 left-4 space-y-2">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-8 w-32" />
            </div>
            <div className="absolute bottom-4 right-4">
                <Skeleton className="h-20 w-48" />
            </div>
        </div>
    )
}

// List skeleton
export function ListSkeleton({ items = 5 }: { items?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: items }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-white/5">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                </div>
            ))}
        </div>
    )
}
