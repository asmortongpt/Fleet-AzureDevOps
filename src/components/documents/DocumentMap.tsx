/**
 * DocumentMap Component
 *
 * Displays documents on an interactive map using the UniversalMap system.
 * Supports clustering, filtering, and interactive document previews.
 *
 * Features:
 * - Shows all geolocated documents as markers
 * - Color-coded by category
 * - Click to preview document
 * - Clustering for performance
 * - Filter by category, tags, or area
 * - Integration with UniversalMap (Leaflet/Google Maps)
 */

import { useState, useEffect, useMemo } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import type { Document, DocumentGeoData, DocumentCategory } from '@/lib/types'
import { DocumentMapPopup } from './DocumentMapPopup'
import { DocumentMapFilter } from './DocumentMapFilter'

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface DocumentMapProps {
  /** Array of geolocated documents */
  documents?: DocumentGeoData[]

  /** Array of document categories for filtering */
  categories?: DocumentCategory[]

  /** Initial center coordinates [lat, lng] */
  center?: [number, number]

  /** Initial zoom level */
  zoom?: number

  /** Enable marker clustering */
  enableClustering?: boolean

  /** Show filter panel */
  showFilters?: boolean

  /** Callback when document is clicked */
  onDocumentClick?: (documentId: string) => void

  /** Callback when map bounds change */
  onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number }) => void

  /** Custom CSS class */
  className?: string

  /** Map height */
  height?: string
}

// ============================================================================
// Helper Components
// ============================================================================

/**
 * Auto-fit bounds to show all documents
 */
function AutoFitBounds({ documents }: { documents: DocumentGeoData[] }) {
  const map = useMap()

  useEffect(() => {
    if (documents.length === 0) return

    const bounds = L.latLngBounds(
      documents
        .filter(d => d.location)
        .map(d => [d.location!.lat, d.location!.lng] as [number, number])
    )

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
    }
  }, [documents, map])

  return null
}

/**
 * Map event handler
 */
function MapEventHandler({ onBoundsChange }: { onBoundsChange?: (bounds: any) => void }) {
  const map = useMap()

  useEffect(() => {
    const handleMoveEnd = () => {
      if (onBoundsChange) {
        const bounds = map.getBounds()
        onBoundsChange({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest()
        })
      }
    }

    map.on('moveend', handleMoveEnd)
    return () => {
      map.off('moveend', handleMoveEnd)
    }
  }, [map, onBoundsChange])

  return null
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * DocumentMap - Interactive map for geolocated documents
 */
export function DocumentMap({
  documents = [],
  categories = [],
  center = [39.8283, -98.5795], // Center of USA
  zoom = 4,
  enableClustering = true,
  showFilters = true,
  onDocumentClick,
  onBoundsChange,
  className = '',
  height = '600px'
}: DocumentMapProps) {
  // --------------------------------------------------------------------------
  // State
  // --------------------------------------------------------------------------

  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [mapStyle, setMapStyle] = useState<'osm' | 'dark' | 'satellite'>('osm')

  // --------------------------------------------------------------------------
  // Filtering
  // --------------------------------------------------------------------------

  const filteredDocuments = useMemo(() => {
    let filtered = documents

    // Filter by categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(doc =>
        doc.categoryName && selectedCategories.includes(doc.categoryName)
      )
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(doc =>
        doc.fileName.toLowerCase().includes(query) ||
        doc.location?.address?.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [documents, selectedCategories, searchQuery])

  // --------------------------------------------------------------------------
  // Map Styling
  // --------------------------------------------------------------------------

  const tileLayerUrl = useMemo(() => {
    switch (mapStyle) {
      case 'dark':
        return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    }
  }, [mapStyle])

  const tileLayerAttribution = useMemo(() => {
    switch (mapStyle) {
      case 'dark':
        return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      case 'satellite':
        return 'Tiles &copy; Esri'
      default:
        return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }
  }, [mapStyle])

  // --------------------------------------------------------------------------
  // Marker Icons
  // --------------------------------------------------------------------------

  const createMarkerIcon = (categoryColor?: string) => {
    const color = categoryColor || '#3B82F6'

    return L.divIcon({
      className: 'custom-document-marker',
      html: `
        <div style="
          background-color: ${color};
          width: 32px;
          height: 32px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg
            style="transform: rotate(45deg); width: 16px; height: 16px; fill: white;"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M4 3C2.89543 3 2 3.89543 2 5V15C2 16.1046 2.89543 17 4 17H16C17.1046 17 18 16.1046 18 15V5C18 3.89543 17.1046 3 16 3H4ZM4 5H16V7H4V5ZM4 9H16V15H4V9Z"/>
          </svg>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    })
  }

  // --------------------------------------------------------------------------
  // Render Markers
  // --------------------------------------------------------------------------

  const markers = useMemo(() => {
    return filteredDocuments
      .filter(doc => doc.location)
      .map(doc => (
        <Marker
          key={doc.documentId}
          position={[doc.location!.lat, doc.location!.lng]}
          icon={createMarkerIcon(doc.categoryColor)}
          eventHandlers={{
            click: () => {
              if (onDocumentClick) {
                onDocumentClick(doc.documentId)
              }
            }
          }}
        >
          <Popup>
            <DocumentMapPopup document={doc} />
          </Popup>
        </Marker>
      ))
  }, [filteredDocuments, onDocumentClick])

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <div className={`relative ${className}`}>
      {/* Filter Panel */}
      {showFilters && (
        <DocumentMapFilter
          categories={categories}
          selectedCategories={selectedCategories}
          onCategoryChange={setSelectedCategories}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          mapStyle={mapStyle}
          onMapStyleChange={setMapStyle}
          totalDocuments={documents.length}
          filteredDocuments={filteredDocuments.length}
        />
      )}

      {/* Map */}
      <div style={{ height, width: '100%' }}>
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer url={tileLayerUrl} attribution={tileLayerAttribution} />

          {/* Auto-fit bounds */}
          {filteredDocuments.length > 0 && <AutoFitBounds documents={filteredDocuments} />}

          {/* Event handler */}
          {onBoundsChange && <MapEventHandler onBoundsChange={onBoundsChange} />}

          {/* Markers with clustering */}
          {enableClustering ? (
            <MarkerClusterGroup
              chunkedLoading
              maxClusterRadius={60}
              spiderfyOnMaxZoom={true}
              showCoverageOnHover={false}
              zoomToBoundsOnClick={true}
            >
              {markers}
            </MarkerClusterGroup>
          ) : (
            markers
          )}
        </MapContainer>
      </div>

      {/* Document count badge */}
      <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg text-sm z-[1000]">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-blue-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M4 3C2.89543 3 2 3.89543 2 5V15C2 16.1046 2.89543 17 4 17H16C17.1046 17 18 16.1046 18 15V5C18 3.89543 17.1046 3 16 3H4ZM4 5H16V7H4V5ZM4 9H16V15H4V9Z" />
          </svg>
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {filteredDocuments.length} {filteredDocuments.length === 1 ? 'document' : 'documents'}
          </span>
        </div>
      </div>
    </div>
  )
}
