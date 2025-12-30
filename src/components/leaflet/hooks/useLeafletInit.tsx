/**
 * Hook for initializing Leaflet map
 * Handles library loading, map creation, and cleanup
 */

import { useEffect, useRef, useState } from "react"

import logger from '@/utils/logger';
// Leaflet library instance
let L: typeof import("leaflet") | null = null
let leafletCssLoaded = false

/**
 * Loads Leaflet library and assets
 */
async function ensureLeafletLoaded(): Promise<typeof import("leaflet")> {
  if (L) return L

  try {
    const leafletModule = await import("leaflet")
    L = leafletModule as any as typeof import("leaflet")

    if (!L || typeof L.map !== "function") {
      throw new Error("Leaflet library loaded but is missing core functionality")
    }

    // Load CSS
    if (!leafletCssLoaded && typeof window !== "undefined") {
      try {
        await import("leaflet/dist/leaflet.css")
        leafletCssLoaded = true
      } catch (cssError) {
        logger.warn("⚠️  Leaflet CSS could not be loaded:", cssError)
      }
    }

    // Fix icon paths
    try {
      const iconUrl = await import("leaflet/dist/images/marker-icon.png")
      const iconRetinaUrl = await import("leaflet/dist/images/marker-icon-2x.png")
      const shadowUrl = await import("leaflet/dist/images/marker-shadow.png")

      L.Icon.Default.mergeOptions({
        iconUrl: iconUrl.default,
        iconRetinaUrl: iconRetinaUrl.default,
        shadowUrl: shadowUrl.default,
      })
    } catch (iconError) {
      logger.warn("⚠️  Leaflet icons could not be loaded:", iconError)
    }

    logger.debug("✅ Leaflet loaded successfully")
    return L
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    logger.error("❌ Failed to load Leaflet:", errorMessage)
    throw new Error(`Leaflet initialization failed: ${errorMessage}`)
  }
}

interface TileLayerConfig {
  url: string
  attribution: string
  maxZoom?: number
  subdomains?: string[]
}

export const TILE_LAYERS: Record<string, TileLayerConfig> = {
  osm: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    maxZoom: 19,
    subdomains: ["a", "b", "c"],
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>',
    maxZoom: 19,
    subdomains: ["a", "b", "c", "d"],
  },
  topo: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors | Map style: &copy; <a href="https://opentopomap.org" target="_blank" rel="noopener noreferrer">OpenTopoMap</a>',
    maxZoom: 17,
    subdomains: ["a", "b", "c"],
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
    maxZoom: 19,
  },
}

interface UseLeafletInitProps {
  center: [number, number]
  zoom: number
  mapStyle: string
  onReady?: () => void
  onError?: (error: Error) => void
}

export function useLeafletInit({ center, zoom, mapStyle, onReady, onError }: UseLeafletInitProps) {
  const [isReady, setIsReady] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [mapError, setMapError] = useState<string | null>(null)
  const [libraryLoaded, setLibraryLoaded] = useState(false)

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const tileLayerRef = useRef<any>(null)
  const vehicleLayerRef = useRef<any>(null)
  const facilityLayerRef = useRef<any>(null)
  const cameraLayerRef = useRef<any>(null)
  const isMountedRef = useRef(true)

  // Initialize map
  useEffect(() => {
    isMountedRef.current = true
    let map: any = null
    let tileLayer: any = null

    async function initializeMap() {
      if (mapInstanceRef.current || !mapContainerRef.current) return

      try {
        const leaflet = await ensureLeafletLoaded()
        if (!leaflet) throw new Error("Failed to load Leaflet library")

        setLibraryLoaded(true)
        if (!isMountedRef.current || !mapContainerRef.current) return

        const tileConfig = TILE_LAYERS[mapStyle] ?? TILE_LAYERS.osm

        map = leaflet.map(mapContainerRef.current, {
          center,
          zoom,
          minZoom: 2,
          maxZoom: 19,
          zoomControl: true,
          attributionControl: true,
          preferCanvas: true,
        })

        tileLayer = leaflet.tileLayer(tileConfig.url, {
          attribution: tileConfig.attribution,
          maxZoom: tileConfig.maxZoom ?? 19,
          subdomains: tileConfig.subdomains ?? ["a", "b", "c"],
        })
        tileLayer.addTo(map)

        const vehicleLayer = leaflet.layerGroup()
        const facilityLayer = leaflet.layerGroup()
        const cameraLayer = leaflet.layerGroup()

        vehicleLayer.addTo(map)
        facilityLayer.addTo(map)
        cameraLayer.addTo(map)

        mapInstanceRef.current = map
        tileLayerRef.current = tileLayer
        vehicleLayerRef.current = vehicleLayer
        facilityLayerRef.current = facilityLayer
        cameraLayerRef.current = cameraLayer

        map.whenReady(() => {
          if (!isMountedRef.current) return
          setIsReady(true)
          setIsLoading(false)
          if (onReady) onReady()
        })

        map.on("error", () => {
          setMapError("Failed to load map tiles")
          if (onError) onError(new Error("Failed to load map tiles"))
        })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error"
        setMapError(`Failed to initialize map: ${errorMessage}`)
        setIsLoading(false)
        if (onError) onError(err as Error)
      }
    }

    initializeMap()

    return () => {
      isMountedRef.current = false
      if (tileLayer) tileLayer.remove()
      if (map) {
        map.off()
        map.remove()
      }
      mapInstanceRef.current = null
    }
  }, [])

  // Update tile layer when style changes
  useEffect(() => {
    if (!mapInstanceRef.current || !isReady || !L) return

    try {
      if (tileLayerRef.current) tileLayerRef.current.remove()

      const tileConfig = TILE_LAYERS[mapStyle] ?? TILE_LAYERS.osm
      const newTileLayer = L.tileLayer(tileConfig.url, {
        attribution: tileConfig.attribution,
        maxZoom: tileConfig.maxZoom ?? 19,
        subdomains: tileConfig.subdomains ?? ["a", "b", "c"],
      })

      newTileLayer.addTo(mapInstanceRef.current)
      tileLayerRef.current = newTileLayer
    } catch (err) {
      logger.error("❌ Error updating tile layer:", err)
    }
  }, [mapStyle, isReady])

  return {
    isReady,
    isLoading,
    mapError,
    libraryLoaded,
    mapContainerRef,
    mapInstanceRef,
    vehicleLayerRef,
    facilityLayerRef,
    cameraLayerRef,
    L,
  }
}