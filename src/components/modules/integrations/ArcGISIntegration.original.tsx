/**
 * ArcGIS Integration Component - Refactored Production Ready
 *
 * Main coordinator for managing ArcGIS layer integrations with comprehensive
 * error handling, loading states, and React 19 compatibility.
 *
 * @module ArcGISIntegration
 * @version 2.1.0 (Refactored)
 */

import {
  Plus,
  Trash,
  Eye,
  EyeSlash,
  GlobeHemisphereWest,
  CheckCircle,
  Warning,
  ArrowClockwise,
  Download,
  DotsThree,
  Copy,
  CaretUp,
  CaretDown,
  Info,
  XCircle,
} from "@phosphor-icons/react"
import { useState, useEffect, useCallback, useMemo, useRef } from "react"

import { ExamplesTab } from "./arcgis/components/ExamplesTab"
import { HelpTab } from "./arcgis/components/HelpTab"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient } from "@/lib/api-client"
import type { ArcGISLayerConfig } from "@/lib/arcgis/types"


type LayerHealth = "healthy" | "warning" | "error" | "unknown"

interface LayerWithStatus extends ArcGISLayerConfig {
  health?: LayerHealth
  lastChecked?: Date
}

interface LayerOperationState {
  loading: boolean
  error: string | null
}

/**
 * Main ArcGIS Integration Component - Refactored
 */
export function ArcGISIntegration() {
  const [layers, setLayers] = useState<LayerWithStatus[]>([])
  const [globalLoading, setGlobalLoading] = useState(true)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [layerOperations, setLayerOperations] = useState<Map<string, LayerOperationState>>(new Map())
  const abortControllerRef = useRef<AbortController | null>(null)

  // Load layers from API
  const loadLayers = useCallback(async (retryCount = 0) => {
    const maxRetries = 3
    try {
      setGlobalLoading(true)
      setGlobalError(null)
      abortControllerRef.current = new AbortController()

      const layersData = await apiClient.arcgisLayers.list()
      setLayers(
        layersData.map((layer) => ({
          ...layer,
          health: "unknown" as LayerHealth,
        }))
      )
    } catch (error) {
      console.error("Failed to load ArcGIS layers:", error)
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000
        setTimeout(() => loadLayers(retryCount + 1), delay)
      } else {
        setGlobalError(error instanceof Error ? error.message : "Failed to load ArcGIS layers")
      }
    } finally {
      setGlobalLoading(false)
    }
  }, [])

  useEffect(() => {
    loadLayers()
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [loadLayers])

  // Update operation state
  const updateLayerOperation = useCallback((layerId: string, state: Partial<LayerOperationState>) => {
    setLayerOperations((prev) => {
      const newMap = new Map(prev)
      const current = newMap.get(layerId) || { loading: false, error: null }
      newMap.set(layerId, { ...current, ...state })
      return newMap
    })
  }, [])

  // Toggle layer
  const handleToggleLayer = useCallback(
    async (layerId: string) => {
      const layer = layers.find((l) => l.id === layerId)
      if (!layer) return

      setLayers((prev) =>
        prev.map((l) => (l.id === layerId ? { ...l, enabled: !l.enabled, updatedAt: new Date().toISOString() } : l))
      )

      updateLayerOperation(layerId, { loading: true, error: null })

      try {
        await apiClient.arcgisLayers.update(layer.id, { enabled: !layer.enabled })
        updateLayerOperation(layerId, { loading: false })
      } catch (error) {
        setLayers((prev) => prev.map((l) => (l.id === layerId ? { ...l, enabled: layer.enabled } : l)))
        updateLayerOperation(layerId, {
          loading: false,
          error: error instanceof Error ? error.message : "Failed to update layer",
        })
      }
    },
    [layers, updateLayerOperation]
  )

  // Update opacity
  const handleOpacityChange = useCallback((layerId: string, opacity: number) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, opacity, updatedAt: new Date().toISOString() } : l))
    )
  }, [])

  // Delete layer
  const handleDeleteLayer = useCallback(
    async (layerId: string) => {
      const layer = layers.find((l) => l.id === layerId)
      if (!layer) return

      if (!confirm(`Are you sure you want to remove "${layer.name}"?`)) return

      const originalLayers = [...layers]
      setLayers((prev) => prev.filter((l) => l.id !== layerId))

      try {
        await apiClient.arcgisLayers.delete(layerId)
      } catch (error) {
        setLayers(originalLayers)
        updateLayerOperation(layerId, {
          loading: false,
          error: error instanceof Error ? error.message : "Failed to delete layer",
        })
      }
    },
    [layers, updateLayerOperation]
  )

  // Duplicate layer
  const handleDuplicateLayer = useCallback(
    async (layerId: string) => {
      const layer = layers.find((l) => l.id === layerId)
      if (!layer) return

      const duplicatedLayer: ArcGISLayerConfig = {
        ...layer,
        id: `arcgis-${Date.now()}`,
        name: `${layer.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      try {
        setLayers((prev) => [...prev, { ...duplicatedLayer, health: "unknown" }])
        await apiClient.arcgisLayers.create(duplicatedLayer)
      } catch (error) {
        setLayers((prev) => prev.filter((l) => l.id !== duplicatedLayer.id))
      }
    },
    [layers]
  )

  // Move layer
  const handleMoveLayerUp = useCallback((layerId: string) => {
    setLayers((prev) => {
      const index = prev.findIndex((l) => l.id === layerId)
      if (index <= 0) return prev
      const newLayers = [...prev]
      ;[newLayers[index], newLayers[index - 1]] = [newLayers[index - 1], newLayers[index]]
      return newLayers
    })
  }, [])

  const handleMoveLayerDown = useCallback((layerId: string) => {
    setLayers((prev) => {
      const index = prev.findIndex((l) => l.id === layerId)
      if (index < 0 || index >= prev.length - 1) return prev
      const newLayers = [...prev]
      ;[newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]]
      return newLayers
    })
  }, [])

  // Export layers
  const handleExportLayers = useCallback(() => {
    const exportData = {
      version: "2.0",
      exportedAt: new Date().toISOString(),
      layers: layers.map(({ health, lastChecked, ...layer }) => layer),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `arcgis-layers-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [layers])

  // Health badge helper
  const getHealthBadge = (health?: LayerHealth) => {
    switch (health) {
      case "healthy":
        return (
          <Badge variant="default" className="text-xs bg-green-600">
            <CheckCircle className="w-3 h-3 mr-1" weight="fill" />
            Healthy
          </Badge>
        )
      case "error":
        return (
          <Badge variant="destructive" className="text-xs">
            <XCircle className="w-3 h-3 mr-1" weight="fill" />
            Error
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-xs">
            <Info className="w-3 h-3 mr-1" />
            Unknown
          </Badge>
        )
    }
  }

  const enabledLayersCount = useMemo(() => layers.filter((l) => l.enabled).length, [layers])
  const hasLayers = layers.length > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">ArcGIS Integration</h1>
          <p className="text-muted-foreground mt-1">
            Plug and play custom ArcGIS map layers{hasLayers && ` • ${enabledLayersCount} active`}
          </p>
        </div>
        <div className="flex gap-2">
          {hasLayers && (
            <>
              <Button variant="outline" size="sm" onClick={handleExportLayers} aria-label="Action button">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={() => loadLayers()} aria-label="Action button">
                <ArrowClockwise className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </>
          )}
          <Button aria-label="Action button">
            <Plus className="w-4 h-4 mr-2" />
            Add Layer
          </Button>
        </div>
      </div>

      {globalError && (
        <Alert variant="destructive">
          <Warning className="w-4 h-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{globalError}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs defaultValue="layers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="layers">Active Layers ({layers.length})</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
          <TabsTrigger value="help">Help</TabsTrigger>
        </TabsList>

        <TabsContent value="layers" className="space-y-4">
          {globalLoading ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ArrowClockwise className="w-16 h-16 text-muted-foreground mb-4 animate-spin" />
                <h3 className="text-lg font-semibold mb-2">Loading Layers...</h3>
              </CardContent>
            </Card>
          ) : !hasLayers ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <GlobeHemisphereWest className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No ArcGIS Layers Yet</h3>
                <p className="text-muted-foreground text-center max-w-md mb-4">
                  Add your first ArcGIS layer to visualize custom data
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {layers.map((layer, index) => {
                const operation = layerOperations.get(layer.id)
                return (
                  <Card key={layer.id} className={operation?.loading ? "opacity-60" : ""}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <CardTitle className="text-lg">{layer.name}</CardTitle>
                            <Badge variant="outline" className="text-xs">
                              {layer.layerType}
                            </Badge>
                            {layer.enabled ? (
                              <Badge variant="default" className="text-xs bg-success">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                Inactive
                              </Badge>
                            )}
                            {getHealthBadge(layer.health)}
                          </div>
                          {layer.description && <CardDescription>{layer.description}</CardDescription>}
                          <p className="text-xs text-muted-foreground mt-2 font-mono truncate">{layer.serviceUrl}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => handleMoveLayerUp(layer.id)} aria-label="Action button"
                              disabled={index === 0 || operation?.loading}
                            >
                              <CaretUp className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => handleMoveLayerDown(layer.id)} aria-label="Action button"
                              disabled={index === layers.length - 1 || operation?.loading}
                            >
                              <CaretDown className="w-3 h-3" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleLayer(layer.id)} aria-label="Action button"
                            disabled={operation?.loading}
                          >
                            {layer.enabled ? <Eye className="w-4 h-4" /> : <EyeSlash className="w-4 h-4" />}
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" disabled={operation?.loading} aria-label="Action button">
                                <DotsThree className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleDuplicateLayer(layer.id)}>
                                <Copy className="w-4 h-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteLayer(layer.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-sm">Opacity</Label>
                            <span className="text-sm font-medium">{Math.round(layer.opacity * 100)}%</span>
                          </div>
                          <Slider
                            value={[layer.opacity * 100]}
                            onValueChange={([value]) => handleOpacityChange(layer.id, value / 100)}
                            max={100}
                            step={1}
                            disabled={!layer.enabled || operation?.loading}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="examples">
          <ExamplesTab />
        </TabsContent>

        <TabsContent value="help">
          <HelpTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
