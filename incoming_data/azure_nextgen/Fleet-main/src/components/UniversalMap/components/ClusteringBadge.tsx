interface ClusteringBadgeProps {
  markerCount: number
}

export function ClusteringBadge({ markerCount }: ClusteringBadgeProps) {
  return (
    <div className="absolute bottom-4 left-4 z-40 bg-white/90 dark:bg-gray-800/90 px-3 py-1.5 rounded-md shadow-md text-xs text-gray-600 dark:text-gray-300">
      Clustering {markerCount} markers
    </div>
  )
}
