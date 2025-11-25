/**
 * DocumentMapCluster Component
 *
 * Advanced document clustering visualization with:
 * - Server-side clustering using PostGIS ST_ClusterDBSCAN
 * - Custom cluster markers with document counts
 * - Click to expand cluster
 * - Color-coded by density
 */

import { useState, useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import type { DocumentCluster, DocumentCategory } from '@/lib/types'

export interface DocumentMapClusterProps {
  /** Array of document clusters from server */
  clusters: DocumentCluster[]

  /** Array of document categories for color coding */
  categories?: DocumentCategory[]

  /** Initial center coordinates */
  center?: [number, number]

  /** Initial zoom level */
  zoom?: number

  /** Callback when cluster is clicked */
  onClusterClick?: (clusterId: number) => void

  /** Callback when document is clicked */
  onDocumentClick?: (documentId: string) => void

  /** Custom CSS class */
  className?: string

  /** Map height */
  height?: string
}

/**
 * Get cluster color based on document count (heatmap style)
 */
function getClusterColor(count: number, maxCount: number): string {
  const ratio = count / maxCount

  if (ratio > 0.7) return '#DC2626' // Red (high density)
  if (ratio > 0.4) return '#F59E0B' // Orange (medium-high)
  if (ratio > 0.2) return '#3B82F6' // Blue (medium)
  return '#10B981' // Green (low)
}

/**
 * Get cluster radius based on document count
 */
function getClusterRadius(count: number, maxCount: number): number {
  const ratio = count / maxCount
  const minRadius = 20
  const maxRadius = 60

  return minRadius + (maxRadius - minRadius) * ratio
}

/**
 * Auto-fit bounds to show all clusters
 */
function AutoFitBounds({ clusters }: { clusters: DocumentCluster[] }) {
  const map = useMap()

  useEffect(() => {
    if (clusters.length === 0) return

    const bounds = clusters.map(c => [c.centerLat, c.centerLng] as [number, number])

    if (bounds.length > 0) {
      const L = require('leaflet')
      const latLngBounds = L.latLngBounds(bounds)
      map.fitBounds(latLngBounds, { padding: [50, 50], maxZoom: 15 })
    }
  }, [clusters, map])

  return null
}

/**
 * DocumentMapCluster - Visualize document clusters on map
 */
export function DocumentMapCluster({
  clusters,
  categories = [],
  center = [39.8283, -98.5795],
  zoom = 4,
  onClusterClick,
  onDocumentClick,
  className = '',
  height = '600px'
}: DocumentMapClusterProps) {
  const [selectedCluster, setSelectedCluster] = useState<DocumentCluster | null>(null)
  const [mapStyle] = useState<'osm' | 'dark'>('osm')

  // Calculate max cluster size for scaling
  const maxClusterCount = useMemo(() => {
    return clusters.length > 0 ? Math.max(...clusters.map(c => c.documentCount)) : 1
  }, [clusters])

  // Tile layer configuration
  const tileLayerUrl =
    mapStyle === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

  const tileLayerAttribution =
    mapStyle === 'dark'
      ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

  // Handle cluster click
  const handleClusterClick = (cluster: DocumentCluster) => {
    setSelectedCluster(cluster)
    if (onClusterClick) {
      onClusterClick(cluster.clusterId)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <div style={{ height, width: '100%' }}>
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer url={tileLayerUrl} attribution={tileLayerAttribution} />

          {/* Auto-fit bounds */}
          {clusters.length > 0 && <AutoFitBounds clusters={clusters} />}

          {/* Render cluster circles */}
          {clusters.map(cluster => {
            const radius = getClusterRadius(cluster.documentCount, maxClusterCount)
            const color = getClusterColor(cluster.documentCount, maxClusterCount)

            return (
              <CircleMarker
                key={cluster.clusterId}
                center={[cluster.centerLat, cluster.centerLng]}
                radius={radius}
                pathOptions={{
                  fillColor: color,
                  fillOpacity: 0.6,
                  color: 'white',
                  weight: 3
                }}
                eventHandlers={{
                  click: () => handleClusterClick(cluster)
                }}
              >
                <Popup maxWidth={400} minWidth={300}>
                  <div className="p-2">
                    {/* Cluster header */}
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">
                          Cluster #{cluster.clusterId}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {cluster.documentCount} documents
                        </p>
                      </div>
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: color }}
                      >
                        {cluster.documentCount}
                      </div>
                    </div>

                    {/* Document list */}
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {cluster.documents.map(doc => (
                        <div
                          key={doc.documentId}
                          className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                          onClick={() => {
                            if (onDocumentClick) {
                              onDocumentClick(doc.documentId)
                            }
                          }}
                        >
                          <div className="flex items-start gap-2">
                            <svg
                              className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M4 3C2.89543 3 2 3.89543 2 5V15C2 16.1046 2.89543 17 4 17H16C17.1046 17 18 16.1046 18 15V5C18 3.89543 17.1046 3 16 3H4ZM4 5H16V7H4V5ZM4 9H16V15H4V9Z" />
                            </svg>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 text-sm truncate">
                                {doc.fileName}
                              </p>
                              {doc.location?.address && (
                                <p className="text-xs text-gray-600 mt-1 truncate">
                                  {doc.location?.address}
                                </p>
                              )}
                              {doc.location && (
                                <p className="text-xs text-gray-500 mt-1 font-mono">
                                  {doc.location?.lat.toFixed(4)}, {doc.location?.lng.toFixed(4)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Cluster center coordinates */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500 font-mono">
                        Center: {cluster.centerLat.toFixed(4)}, {cluster.centerLng.toFixed(4)}
                      </p>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg z-[1000]">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-3">
          Document Density
        </h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#DC2626]" />
            <span className="text-xs text-gray-600 dark:text-gray-400">High (70%+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#F59E0B]" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Medium-High (40-70%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#3B82F6]" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Medium (20-40%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#10B981]" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Low (&lt;20%)</span>
          </div>
        </div>
      </div>

      {/* Total clusters badge */}
      <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg text-sm z-[1000]">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {clusters.length} {clusters.length === 1 ? 'cluster' : 'clusters'}
          </span>
        </div>
      </div>
    </div>
  )
}
