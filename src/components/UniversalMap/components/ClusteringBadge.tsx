interface ClusteringBadgeProps {
  markerCount: number
}

export function ClusteringBadge({ markerCount }: ClusteringBadgeProps) {
  return (
    <div className="absolute bottom-4 left-4 z-40 bg-white/90 dark:bg-[var(--surface-3)]/90 px-3 py-1.5 rounded-md text-xs text-[var(--text-primary)] dark:text-[var(--text-secondary)]">
      Clustering {markerCount} markers
    </div>
  )
}
