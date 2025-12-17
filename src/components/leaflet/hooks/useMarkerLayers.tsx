/**
 * Hook for managing marker layers (vehicles, facilities, cameras)
 * Handles marker creation, updates, and cleanup
 */

import { useEffect, useCallback, useRef } from "react"

import { createVehicleIcon, createFacilityIcon, createCameraIcon } from "../utils/icons"
import { createVehiclePopup, createFacilityPopup, createCameraPopup } from "../utils/popups"

import type { Vehicle, GISFacility, TrafficCamera } from "@/lib/types"

import logger from '@/utils/logger';
export type MarkerType = "vehicle" | "facility" | "camera"

interface UseMarkerLayersProps {
  L: any
  isReady: boolean
  vehicleLayerRef: React.RefObject<any>
  facilityLayerRef: React.RefObject<any>
  cameraLayerRef: React.RefObject<any>
  vehicles: Vehicle[]
  facilities: GISFacility[]
  cameras: TrafficCamera[]
  showVehicles: boolean
  showFacilities: boolean
  showCameras: boolean
  onMarkerClick?: (id: string, type: MarkerType) => void
}

/**
 * Debounce function to prevent excessive updates
 */
function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args)
      }, delay)
    },
    [delay]
  )
}

export function useMarkerLayers({
  L,
  isReady,
  vehicleLayerRef,
  facilityLayerRef,
  cameraLayerRef,
  vehicles,
  facilities,
  cameras,
  showVehicles,
  showFacilities,
  showCameras,
  onMarkerClick,
}: UseMarkerLayersProps) {
  // Update vehicle markers
  const updateVehicleMarkers = useDebouncedCallback(() => {
    if (!vehicleLayerRef.current || !isReady || !L) return

    try {
      vehicleLayerRef.current.clearLayers()
      if (!showVehicles || vehicles.length === 0) return

      vehicles.forEach((vehicle) => {
        if (!vehicle.location?.lat || !vehicle.location?.lng) return
        if (vehicle.location.lat < -90 || vehicle.location.lat > 90) return
        if (vehicle.location.lng < -180 || vehicle.location.lng > 180) return

        try {
          const icon = createVehicleIcon(L, vehicle)
          const marker = L.marker([vehicle.location.lat, vehicle.location.lng], {
            icon,
            title: `${vehicle.name} - ${vehicle.status}`,
            keyboard: true,
            riseOnHover: true,
          })

          marker.bindPopup(createVehiclePopup(vehicle), {
            maxWidth: 300,
            minWidth: 220,
          })

          if (onMarkerClick) {
            marker.on("click", () => onMarkerClick(vehicle.id, "vehicle"))
          }

          vehicleLayerRef.current.addLayer(marker)
        } catch (err) {
          logger.error(`Error creating vehicle marker for ${vehicle.id}:`, err)
        }
      })
    } catch (err) {
      logger.error("Error updating vehicle markers:", err)
    }
  }, 150)

  // Update facility markers
  const updateFacilityMarkers = useDebouncedCallback(() => {
    if (!facilityLayerRef.current || !isReady || !L) return

    try {
      facilityLayerRef.current.clearLayers()
      if (!showFacilities || facilities.length === 0) return

      facilities.forEach((facility) => {
        if (!facility.location?.lat || !facility.location?.lng) return
        if (facility.location.lat < -90 || facility.location.lat > 90) return
        if (facility.location.lng < -180 || facility.location.lng > 180) return

        try {
          const icon = createFacilityIcon(L, facility)
          const marker = L.marker([facility.location.lat, facility.location.lng], {
            icon,
            title: `${facility.name} - ${facility.type}`,
            keyboard: true,
            riseOnHover: true,
          })

          marker.bindPopup(createFacilityPopup(facility), {
            maxWidth: 300,
            minWidth: 220,
          })

          if (onMarkerClick) {
            marker.on("click", () => onMarkerClick(facility.id, "facility"))
          }

          facilityLayerRef.current.addLayer(marker)
        } catch (err) {
          logger.error(`Error creating facility marker for ${facility.id}:`, err)
        }
      })
    } catch (err) {
      logger.error("Error updating facility markers:", err)
    }
  }, 150)

  // Update camera markers
  const updateCameraMarkers = useDebouncedCallback(() => {
    if (!cameraLayerRef.current || !isReady || !L) return

    try {
      cameraLayerRef.current.clearLayers()
      if (!showCameras || cameras.length === 0) return

      cameras.forEach((camera) => {
        if (typeof camera.latitude !== "number" || typeof camera.longitude !== "number") return
        if (camera.latitude < -90 || camera.latitude > 90) return
        if (camera.longitude < -180 || camera.longitude > 180) return

        try {
          const icon = createCameraIcon(L, camera)
          const marker = L.marker([camera.latitude, camera.longitude], {
            icon,
            title: `${camera.name}`,
            keyboard: true,
            riseOnHover: true,
          })

          marker.bindPopup(createCameraPopup(camera), {
            maxWidth: 350,
            minWidth: 240,
          })

          if (onMarkerClick) {
            marker.on("click", () => onMarkerClick(camera.id, "camera"))
          }

          cameraLayerRef.current.addLayer(marker)
        } catch (err) {
          logger.error(`Error creating camera marker for ${camera.id}:`, err)
        }
      })
    } catch (err) {
      logger.error("Error updating camera markers:", err)
    }
  }, 150)

  // Update markers when data changes
  useEffect(() => {
    updateVehicleMarkers()
  }, [vehicles, showVehicles, isReady, onMarkerClick])

  useEffect(() => {
    updateFacilityMarkers()
  }, [facilities, showFacilities, isReady, onMarkerClick])

  useEffect(() => {
    updateCameraMarkers()
  }, [cameras, showCameras, isReady, onMarkerClick])
}
