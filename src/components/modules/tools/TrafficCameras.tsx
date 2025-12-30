/**
 * TrafficCameras Component - Rebuilt from scratch
 *
 * Production-ready traffic camera monitoring with:
 * - Real-time camera location visualization
 * - Advanced filtering and search
 * - React 19 compatibility
 * - Full TypeScript type safety
 * - Comprehensive error handling
 * - Optimized performance
 * - WCAG 2.2 AA accessibility
 * - Automatic data synchronization
 * - Proper cleanup on unmount
 * - Bulletproof state management
 *
 * @module TrafficCameras
 */

import {
  MagnifyingGlass,
  VideoCamera,
  MapPin,
  ArrowsClockwise,
  CheckCircle,
  WarningCircle,
  CircleDashed,
  XCircle,
  Info
} from "@phosphor-icons/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import React, { useState, useCallback, useMemo, useRef, useEffect } from "react"
import { toast } from "sonner"

import { UniversalMap, UniversalMapProps } from "@/components/UniversalMap"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { useInterval } from "@/hooks"
import { apiClient } from "@/lib/api-client"
import { TrafficCamera, CameraDataSource } from "@/lib/types"

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Camera status filter options
 */
export type CameraStatusFilter = "all" | "operational" | "offline"

/**
 * Component state interface
 */
interface TrafficCamerasState {
  cameras: TrafficCamera[]
  sources: CameraDataSource[]
  selectedCamera: TrafficCamera | null
  searchTerm: string
  statusFilter: CameraStatusFilter
  sourceFilter: string
  isLoading: boolean
  isSyncing: boolean
  error: string | null
  lastSyncTime: Date | null
}

/**
 * Camera statistics
 */
interface CameraStats {
  total: number
  operational: number
  offline: number
  enabled: number
  disabled: number
}

// ============================================================================
// Constants & Configuration
// ============================================================================

const AUTO_SYNC_INTERVAL = 300000 // 5 minutes

/**
 * Initial component state
 */
const getInitialState = (): TrafficCamerasState => ({
  cameras: [],
  sources: [],
  selectedCamera: null,
  searchTerm: "",
  statusFilter: "all",
  sourceFilter: "all",
  isLoading: false,
  isSyncing: false,
  error: null,
  lastSyncTime: null
})

// ============================================================================
// Main Component
// ============================================================================

/**
 * TrafficCameras - Real-time traffic camera monitoring
 *
 * Features:
 * - Interactive map with camera locations
 * - Real-time camera status monitoring
 * - Advanced search and filtering
 * - Automatic data synchronization
 * - Camera feed access
 * - Source management
 *
 * @returns {JSX.Element} The traffic cameras component
 */
export function TrafficCameras(): JSX.Element {
  // ========== State Management ==========
  const [state, setState] = useState<TrafficCamerasState>(getInitialState())

  // ========== Refs ==========
  const isMountedRef = useRef(true)
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // ========== TanStack Query Hooks ==========
  const queryClient = useQueryClient()
  
  /**
   * Query for loading cameras and data sources
   */
  const { data: camerasData = [], isLoading: camerasLoading } = useQuery({
    queryKey: ["trafficCameras", "cameras"],
    queryFn: async () => {
      const result = await apiClient.trafficCameras.list()
      return result as TrafficCamera[]
    },
    gcTime: 5 * 60 * 1000 // 5 minutes
  })

  const { data: sourcesData = [], isLoading: sourcesLoading } = useQuery({
    queryKey: ["trafficCameras", "sources"],
    queryFn: async () => {
      const result = await apiClient.trafficCameras.sources()
      return result as CameraDataSource[]
    },
    gcTime: 5 * 60 * 1000 // 5 minutes
  })

  /**
   * Mutation for syncing camera data
   */
  const syncMutation = useMutation({
    mutationFn: async () => {
      return apiClient.trafficCameras.sync()
    },
    onSuccess: () => {
      setState(prev => ({ ...prev, isSyncing: false, lastSyncTime: new Date() }))
      queryClient.invalidateQueries({ queryKey: ["trafficCameras", "cameras"] })
      queryClient.invalidateQueries({ queryKey: ["trafficCameras", "sources"] })
      toast.success("Camera data synchronized successfully")
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "Failed to sync camera data"
      setState(prev => ({ ...prev, isSyncing: false, error: errorMessage }))
      toast.error(errorMessage)
    }
  })

  // ========== Lifecycle: Initialization ==========
  /**
   * Update state when query data changes
   */
  useEffect(() => {
    if (!camerasLoading && !sourcesLoading) {
      setState(prev => ({
        ...prev,
        cameras: camerasData || [],
        sources: sourcesData || [],
        isLoading: false,
        error: null,
        lastSyncTime: prev.lastSyncTime || new Date()
      }))
    } else {
      setState(prev => ({ ...prev, isLoading: camerasLoading || sourcesLoading }))
    }
  }, [camerasData, sourcesData, camerasLoading, sourcesLoading])

  /**
   * Initialize component on mount
   */
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // ========== Lifecycle: Auto-Sync Interval ==========
  /**
   * Set up automatic synchronization interval
   */
  useInterval(
    () => {
      if (!state.isSyncing) {
        syncMutation.mutate()
      }
    },
    AUTO_SYNC_INTERVAL,
    isMountedRef.current
  )

  // ========== Cleanup on Unmount ==========
  /**
   * Clean up timeout on unmount
   */
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
        syncTimeoutRef.current = null
      }
    }
  }, [])

  // ========== Sync Handler ==========
  /**
   * Trigger manual camera sync
   */
  const handleSync = useCallback(async () => {
    setState(prev => ({ ...prev, isSyncing: true, error: null }))
    toast.info("Starting camera synchronization...")
    syncMutation.mutate()
  }, [syncMutation])

  // ========== Camera Selection ==========

  /**
   * Handle camera selection
   */
  const handleCameraClick = useCallback((camera: TrafficCamera) => {
    setState(prev => ({
      ...prev,
      selectedCamera: prev.selectedCamera?.id === camera.id ? null : camera
    }))
  }, [])

  /**
   * Open camera feed in new window
   */
  const handleViewFeed = useCallback((camera: TrafficCamera, event: React.MouseEvent) => {
    event.stopPropagation()

    if (camera.cameraUrl) {
      window.open(camera.cameraUrl, '_blank', 'noopener,noreferrer')
    } else if (camera.streamUrl) {
      window.open(camera.streamUrl, '_blank', 'noopener,noreferrer')
    } else if (camera.imageUrl) {
      window.open(camera.imageUrl, '_blank', 'noopener,noreferrer')
    } else {
      toast.error("No camera feed available for this camera")
    }
  }, [])

  // ========== Filtering & Search ==========

  /**
   * Filtered cameras based on search and filters
   */
  const filteredCameras = useMemo(() => {
    return state.cameras.filter(camera => {
      // Status filter
      if (state.statusFilter === "operational" && !camera.operational) return false
      if (state.statusFilter === "offline" && camera.operational) return false

      // Source filter
      if (state.sourceFilter !== "all" && camera.sourceId !== state.sourceFilter) return false

      // Search filter
      if (state.searchTerm) {
        const search = state.searchTerm.toLowerCase()
        return (
          camera.name.toLowerCase().includes(search) ||
          camera.address?.toLowerCase().includes(search) ||
          camera.crossStreets?.toLowerCase().includes(search) ||
          camera.crossStreet1?.toLowerCase().includes(search) ||
          camera.crossStreet2?.toLowerCase().includes(search)
        )
      }

      return true
    })
  }, [state.cameras, state.statusFilter, state.sourceFilter, state.searchTerm])

  // ========== Statistics ==========

  /**
   * Camera statistics
   */
  const stats = useMemo((): CameraStats => {
    const total = state.cameras.length
    const operational = state.cameras.filter(c => c.operational).length
    const offline = total - operational
    const enabled = state.cameras.filter(c => c.enabled).length
    const disabled = total - enabled

    return {
      total,
      operational,
      offline,
      enabled,
      disabled
    }
  }, [state.cameras])

  // ========== Map Integration ==========

  /**
   * Get map center from filtered cameras
   */
  const mapCenter = useMemo((): [number, number] | undefined => {
    const camerasWithCoords = filteredCameras.filter(
      c => c.latitude != null && c.longitude != null
    )

    if (camerasWithCoords.length === 0) {
      // Default to Tallahassee, FL
      return [-84.2807, 30.4383]
    }

    // Use first camera's coordinates
    const firstCamera = camerasWithCoords[0]
    return firstCamera ? [firstCamera.longitude as number, firstCamera.latitude as number] : undefined
  }, [filteredCameras])

  // ========== Render Helpers ==========

  /**
   * Format last sync time
   */
  const formatLastSync = useCallback((date: Date | null): string => {
    if (!date) return "Never"

    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return "Just now"
    if (minutes === 1) return "1 minute ago"
    if (minutes < 60) return `${minutes} minutes ago`

    const hours = Math.floor(minutes / 60)
    if (hours === 1) return "1 hour ago"
    if (hours < 24) return `${hours} hours ago`

    return date.toLocaleString()
  }, [])

  // ========== Data Loading Handler ==========
  const reloadData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["trafficCameras", "cameras"] })
    queryClient.invalidateQueries({ queryKey: ["trafficCameras", "sources"] })
  }, [queryClient])

  // ========== Render ==========

  // Loading state
  if (state.isLoading && state.cameras.length === 0) {
    return (
      <div
        className="flex items-center justify-center min-h-[500px]"
        role="status"
        aria-live="polite"
      >
        <div className="text-center">
          <CircleDashed className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground">Loading traffic cameras...</p>
          <p className="text-sm text-muted-foreground mt-2">
            Fetching camera data from sources
          </p>
        </div>
      </div>
    )
  }

  // Error state (without data)
  if (state.error && state.cameras.length === 0) {
    return (
      <div
        className="flex items-center justify-center min-h-[500px]"
        role="alert"
        aria-live="assertive"
      >
        <div className="text-center max-w-md">
          <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Failed to Load Cameras</h3>
          <p className="text-sm text-muted-foreground mb-4">{state.error}</p>
          <Button onClick={reloadData}>
            <ArrowsClockwise className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" role="main" aria-label="Traffic Cameras">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Traffic Cameras</h1>
          <p className="text-muted-foreground mt-1">
            Real-time traffic camera monitoring across the region
          </p>
          {state.lastSyncTime && (
            <p className="text-xs text-muted-foreground mt-1">
              Last updated: {formatLastSync(state.lastSyncTime)}
            </p>
          )}
        </div>
        <Button onClick={handleSync} disabled={state.isSyncing}>
          <ArrowsClockwise
            className={`w-4 h-4 mr-2 ${state.isSyncing ? 'animate-spin' : ''}`}
          />
          {state.isSyncing ? 'Syncing...' : 'Sync Cameras'}
        </Button>
      </div>

      {/* Error Banner (with existing data) */}
      {state.error && state.cameras.length > 0 && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <WarningCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-destructive">Sync Error</h4>
                <p className="text-sm text-muted-foreground mt-1">{state.error}</p>
              </div>
              <Button variant="outline" size="sm" onClick={reloadData}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Cameras</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <VideoCamera className="w-8 h-8 text-primary" weight="fill" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Operational</p>
                <p className="text-3xl font-bold text-green-600">{stats.operational}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" weight="fill" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Offline</p>
                <p className="text-3xl font-bold text-red-600">{stats.offline}</p>
              </div>
              <WarningCircle className="w-8 h-8 text-red-600" weight="fill" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Enabled</p>
                <p className="text-3xl font-bold text-blue-600">{stats.enabled}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-600" weight="fill" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search cameras..."
                value={state.searchTerm}
                onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
                className="pl-9"
                aria-label="Search cameras by name or location"
              />
            </div>
            <Select
              value={state.statusFilter}
              onValueChange={(value: CameraStatusFilter) => setState(prev => ({ ...prev, statusFilter: value }))}
            >
              <SelectTrigger aria-label="Filter by camera status">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="operational">Operational Only</SelectItem>
                <SelectItem value="offline">Offline Only</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={state.sourceFilter}
              onValueChange={(value) => setState(prev => ({ ...prev, sourceFilter: value }))}
            >
              <SelectTrigger aria-label="Filter by data source">
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {state.sources.map(source => (
                  <SelectItem key={source.id} value={source.id}>{source.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Map View */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <UniversalMap
            cameras={filteredCameras}
            showCameras={true}
            showVehicles={false}
            showFacilities={false}
            mapStyle="default"
            className="h-[500px]"
            center={mapCenter}
            zoom={10}
            onCameraClick={handleCameraClick}
            selectedCamera={state.selectedCamera}
          />
        </CardContent>
      </Card>

      {/* Camera Details (if selected) */}
      {state.selectedCamera && (
        <Card>
          <CardHeader>
            <CardTitle>{state.selectedCamera.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{state.selectedCamera.address || 'N/A'}</p>
                  {state.selectedCamera.crossStreets && (
                    <p className="text-sm text-muted-foreground">{state.selectedCamera.crossStreets}</p>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={(e) => handleViewFeed(state.selectedCamera as TrafficCamera, e)}
                  >
                    <VideoCamera className="w-4 h-4 mr-2" />
                    View Feed
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={state.selectedCamera.operational ? "default" : "destructive"}>
                  {state.selectedCamera.operational ? "Operational" : "Offline"}
                </Badge>
                <Badge variant={state.selectedCamera.enabled ? "default" : "secondary"}>
                  {state.selectedCamera.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              {state.selectedCamera.sourceId && (
                <div>
                  <p className="text-sm text-muted-foreground">Data Source</p>
                  <p className="font-medium">
                    {state.sources.find(s => s.id === state.selectedCamera?.sourceId)?.name || 'Unknown'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State for Filtered Results */}
      {filteredCameras.length === 0 && !state.isLoading && (
        <Card>
          <CardContent className="pt-6 text-center">
            <Info className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No cameras found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              No cameras match your current filters or search terms.
            </p>
            <Button
              variant="outline"
              onClick={() => setState(prev => ({
                ...prev,
                searchTerm: '',
                statusFilter: 'all',
                sourceFilter: 'all'
              }))}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}