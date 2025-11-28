import { useEffect, useRef, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'

const PROFESSIONAL_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9e6ff' }] }
]

export function ProfessionalFleetMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)

  useEffect(() => {
    new Loader({ apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '', version: 'weekly' })
      .load()
      .then(() => {
        if (!mapRef.current) return
        setMap(new google.maps.Map(mapRef.current, {
          center: { lat: 30.4383, lng: -84.2807 },
          zoom: 12,
          styles: PROFESSIONAL_STYLES,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true
        }))
      })
  }, [])

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-lg shadow-2xl" />
      {map && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4">
          <h3 className="font-semibold text-gray-800">Fleet Status</h3>
          <div className="mt-2 space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span>Active: 42</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
