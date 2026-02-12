/**
 * GoogleMapView - Real-time Google Maps integration for Fleet Management
 * Features:
 * - Display vehicles on Google Maps
 * - Custom markers with status colors
 * - Click markers to see vehicle details
 * - Real-time position updates
 * - Route visualization
 * - Marker clustering for performance
 */

import { MarkerClusterer } from '@googlemaps/markerclusterer'
import { Wrapper, Status } from '@googlemaps/react-wrapper'
import { AlertCircle, Navigation } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'

import { Spinner } from '@/components/ui/spinner'
import { Vehicle } from '@/types/Vehicle'


// ============================================================================
// TYPES
// ============================================================================

export interface GoogleMapViewProps {
  vehicles: Vehicle[]
  center?: google.maps.LatLngLiteral
  zoom?: number
  onMarkerClick?: (vehicle: Vehicle) => void
  showClustering?: boolean
  showRoutes?: boolean
  routes?: google.maps.LatLngLiteral[][]
  className?: string
}

interface MapComponentProps {
  center: google.maps.LatLngLiteral
  zoom: number
  children?: React.ReactNode
}

// ============================================================================
// MAP COMPONENT - Wrapper around Google Maps
// ============================================================================

const MapComponent: React.FC<MapComponentProps> = ({ center, zoom, children }) => {
  const ref = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)

  useEffect(() => {
    if (ref.current && !map) {
      const newMap = new google.maps.Map(ref.current, {
        center,
        zoom,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      })
      setMap(newMap)
    }
  }, [ref, map, center, zoom])

  // Update center when prop changes
  useEffect(() => {
    if (map) {
      map.setCenter(center)
    }
  }, [map, center])

  // Update zoom when prop changes
  useEffect(() => {
    if (map) {
      map.setZoom(zoom)
    }
  }, [map, zoom])

  return (
    <>
      <div ref={ref} className="w-full h-full" />
      {React.Children.map(children, (child) => {
        if (React.isValidElement<{ map?: google.maps.Map }>(child)) {
          return React.cloneElement(child, { map })
        }
      })}
    </>
  )
}

// ============================================================================
// VEHICLE MARKER COMPONENT
// ============================================================================

interface VehicleMarkerProps {
  vehicle: Vehicle
  map?: google.maps.Map
  onClick?: (vehicle: Vehicle) => void
}

const resolveVehiclePosition = (vehicle: Vehicle) => {
  const lat =
    (vehicle as any)?.location?.lat ??
    (vehicle as any)?.location?.latitude ??
    (vehicle as any)?.latitude ??
    (vehicle as any)?.current_latitude ??
    (vehicle as any)?.lat
  const lng =
    (vehicle as any)?.location?.lng ??
    (vehicle as any)?.location?.longitude ??
    (vehicle as any)?.longitude ??
    (vehicle as any)?.current_longitude ??
    (vehicle as any)?.lng

  const latNum = typeof lat === 'string' ? parseFloat(lat) : Number(lat)
  const lngNum = typeof lng === 'string' ? parseFloat(lng) : Number(lng)

  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
    return null
  }

  return { lat: latNum, lng: lngNum }
}

const VehicleMarker: React.FC<VehicleMarkerProps> = ({ vehicle, map, onClick }) => {
  const markerRef = useRef<google.maps.Marker | null>(null)
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null)

  // Get marker color based on vehicle status
  const getMarkerColor = (status: Vehicle['status']): string => {
    switch (status) {
      case 'active':
        return '#10b981' // green
      case 'idle':
        return '#3b82f6' // blue
      case 'charging':
        return '#f59e0b' // amber
      case 'service':
        return '#ef4444' // red
      case 'emergency':
        return '#dc2626' // dark red
      case 'offline':
        return '#6b7280' // gray
      default:
        return '#6b7280'
    }
  }

  // Create custom marker icon
  const createMarkerIcon = (status: Vehicle['status'], type: Vehicle['type']): google.maps.Icon => {
    const color = getMarkerColor(status)

    // SVG marker with vehicle icon
    const svg = `
      <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 0C8.954 0 0 8.954 0 20c0 14.5 20 30 20 30s20-15.5 20-30C40 8.954 31.046 0 20 0z"
              fill="${color}" stroke="#ffffff" stroke-width="2"/>
        <circle cx="20" cy="20" r="12" fill="#ffffff"/>
        <text x="20" y="25" text-anchor="middle" font-size="14" font-weight="bold" fill="${color}">
          ${type === 'truck' ? '🚛' : type === 'van' ? '🚐' : type === 'bus' ? '🚌' : '🚗'}
        </text>
      </svg>
    `

    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      scaledSize: new google.maps.Size(40, 50),
      anchor: new google.maps.Point(20, 50)
    }
  }

  useEffect(() => {
    if (!map || markerRef.current) return

    const position = resolveVehiclePosition(vehicle)
    if (!position) return

    // Create marker
    const marker = new google.maps.Marker({
      position,
      map,
      title: vehicle.name || `Vehicle ${vehicle.number}`,
      icon: createMarkerIcon(vehicle.status, vehicle.type),
      animation: google.maps.Animation.DROP
    })

    // Create info window
    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 12px; min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #1f2937;">
            ${vehicle.name || `Vehicle ${vehicle.number}`}
          </h3>
          <div style="font-size: 14px; color: #6b7280; line-height: 1.6;">
            <div><strong>Status:</strong> <span style="color: ${getMarkerColor(vehicle.status)}; text-transform: capitalize;">${vehicle.status}</span></div>
            <div><strong>Type:</strong> ${vehicle.type}</div>
            <div><strong>Make:</strong> ${vehicle.make} ${vehicle.model}</div>
            <div><strong>Driver:</strong> ${vehicle.assignedDriver || vehicle.driver || 'Unassigned'}</div>
            <div><strong>Fuel:</strong> ${vehicle.fuelLevel}%</div>
            <div><strong>Location:</strong> ${vehicle.location?.address || (vehicle as any).location_address || '—'}</div>
          </div>
        </div>
      `
    })

    // Add click listener
    marker.addListener('click', () => {
      infoWindow.open(map, marker)
      onClick?.(vehicle)
    })

    markerRef.current = marker
    infoWindowRef.current = infoWindow

    return () => {
      marker.setMap(null)
      infoWindow.close()
    }
  }, [map, vehicle, onClick])

  // Update marker position when vehicle moves
  useEffect(() => {
    if (markerRef.current) {
      const position = resolveVehiclePosition(vehicle)
      if (position) {
        markerRef.current.setPosition(position)
      }
      markerRef.current.setIcon(createMarkerIcon(vehicle.status, vehicle.type))
    }
  }, [vehicle])

  return null
}

// ============================================================================
// MARKER CLUSTER COMPONENT
// ============================================================================

interface MarkerClusterProps {
  map?: google.maps.Map
  children: React.ReactElement<VehicleMarkerProps>[]
}

const MarkerCluster: React.FC<MarkerClusterProps> = ({ map, children }) => {
  const clustererRef = useRef<MarkerClusterer | null>(null)

  useEffect(() => {
    if (!map) return

    const markers: google.maps.Marker[] = []

    // Get all markers from children
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.props.map) {
        // Markers are created by VehicleMarker components
      }
    })

    if (!clustererRef.current && markers.length > 0) {
      clustererRef.current = new MarkerClusterer({
        map,
        markers
      })
    }

    return () => {
      clustererRef.current?.clearMarkers()
    }
  }, [map, children])

  return <>{children}</>
}

// ============================================================================
// ROUTE POLYLINE COMPONENT
// ============================================================================

interface RoutePolylineProps {
  map?: google.maps.Map
  path: google.maps.LatLngLiteral[]
  color?: string
}

const RoutePolyline: React.FC<RoutePolylineProps> = ({ map, path, color = '#3b82f6' }) => {
  const polylineRef = useRef<google.maps.Polyline | null>(null)

  useEffect(() => {
    if (!map || polylineRef.current) return

    const polyline = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: color,
      strokeOpacity: 0.8,
      strokeWeight: 4,
      map
    })

    polylineRef.current = polyline

    return () => {
      polyline.setMap(null)
    }
  }, [map, path, color])

  return null
}

// ============================================================================
// LOADING & ERROR COMPONENTS
// ============================================================================

const LoadingComponent: React.FC = () => (
  <div className="flex items-center justify-center w-full h-full bg-slate-900">
    <div className="text-center">
      <Spinner className="w-4 h-4 text-blue-800 mb-2" />
      <p className="text-slate-700">Loading Google Maps...</p>
    </div>
  </div>
)

const ErrorComponent: React.FC<{ error: Error }> = ({ error }) => (
  <div className="flex items-center justify-center w-full h-full bg-slate-900">
    <div className="text-center max-w-md p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
      <AlertCircle className="w-12 h-9 text-red-500 mx-auto mb-2" />
      <h3 className="text-base font-bold text-white mb-2">Map Loading Error</h3>
      <p className="text-sm text-slate-700 mb-2">{error.message}</p>
      <p className="text-xs text-slate-500">
        Please check your Google Maps API key configuration.
      </p>
    </div>
  </div>
)

// ============================================================================
// RENDER FUNCTION
// ============================================================================

const render = (status: Status): React.ReactElement => {
  switch (status) {
    case Status.LOADING:
      return <LoadingComponent />
    case Status.FAILURE:
      return <ErrorComponent error={new Error('Failed to load Google Maps')} />
    case Status.SUCCESS:
      return <></>
  }
}

// ============================================================================
// MAIN GOOGLE MAP VIEW COMPONENT
// ============================================================================

export const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  vehicles,
  center,
  zoom = 12,
  onMarkerClick,
  showClustering = true,
  showRoutes = false,
  routes = [],
  className = ''
}) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  // Calculate center from vehicles if not provided
  const mapCenter = center || (vehicles.length > 0 ? {
    lat: vehicles[0].location.lat || vehicles[0].location.latitude || 39.8283,
    lng: vehicles[0].location.lng || vehicles[0].location.longitude || -98.5795
  } : { lat: 39.8283, lng: -98.5795 }) // Center of USA as fallback

  if (!apiKey) {
    return (
      <ErrorComponent error={new Error('Google Maps API key is not configured. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file.')} />
    )
  }

  const markers = vehicles.map((vehicle) => (
    <VehicleMarker
      key={vehicle.id}
      vehicle={vehicle}
      onClick={onMarkerClick}
    />
  ))

  return (
    <div className={`relative w-full h-full ${className}`}>
      <Wrapper
        apiKey={apiKey}
        render={render}
        libraries={['places', 'geometry', 'marker']}
      >
        <MapComponent center={mapCenter} zoom={zoom}>
          {showClustering ? (
            <MarkerCluster>{markers}</MarkerCluster>
          ) : (
            markers
          )}
          {showRoutes && routes.map((route, index) => (
            <RoutePolyline
              key={index}
              path={route}
              color={index % 2 === 0 ? '#3b82f6' : '#8b5cf6'}
            />
          ))}
        </MapComponent>
      </Wrapper>

      {/* Map Controls Overlay */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur rounded-lg shadow-sm p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-blue-800" />
          <span className="text-sm font-medium text-gray-900">
            {vehicles.length} Vehicle{vehicles.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="space-y-1 text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Active ({vehicles.filter(v => v.status === 'active').length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Idle ({vehicles.filter(v => v.status === 'idle').length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Service ({vehicles.filter(v => v.status === 'service').length})</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GoogleMapView
