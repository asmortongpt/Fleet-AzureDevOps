/**
 * ArcGIS Integration Component - Refactored Production Ready
 *
 * Main coordinator for managing ArcGIS layer integrations with comprehensive
 * error handling, loading states, and React 19 compatibility.
 *
 * @module ArcGISIntegration
 * @version 3.0.0 (Refactored - SRP Compliant)
 */

import { useMemo } from "react"

import { EmptyState } from "./arcgis/components/EmptyState"
import { ErrorAlert } from "./arcgis/components/ErrorAlert"
import { ExamplesTab } from "./arcgis/components/ExamplesTab"
import { HeaderSection } from "./arcgis/components/HeaderSection"
import { HelpTab } from "./arcgis/components/HelpTab"
import { LayerCard } from "./arcgis/components/LayerCard"
import { LoadingState } from "./arcgis/components/LoadingState"
import { useArcGISLayers } from "./arcgis/hooks/useArcGISLayers"
import { useLayerActions } from "./arcgis/hooks/useLayerActions"
import { useLayerOperations } from "./arcgis/hooks/useLayerOperations"
import { exportLayersToFile } from "./arcgis/utils/layerUtils"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

/**
 * Main ArcGIS Integration Component - Refactored
 */
export function ArcGISIntegration() {
  // Load layers data
  const { layers, setLayers, loading, error, loadLayers } = useArcGISLayers()

  // Manage layer operation states
  const { layerOperations, updateLayerOperation } = useLayerOperations()

  // Layer actions
  const {
    handleToggleLayer,
    handleOpacityChange,
    handleDeleteLayer,
    handleDuplicateLayer,
    handleMoveLayerUp,
    handleMoveLayerDown,
  } = useLayerActions({ layers, setLayers, updateLayerOperation })

  // Computed values
  const enabledLayersCount = useMemo(() => layers.filter((l) => l.enabled).length, [layers])
  const hasLayers = layers.length > 0

  // Export handler
  const handleExport = () => exportLayersToFile(layers)

  return (
    <div className="space-y-6">
      {/* Header */}
      <HeaderSection
        enabledLayersCount={enabledLayersCount}
        hasLayers={hasLayers}
        onExport={handleExport}
        onRefresh={loadLayers}
      />

      {/* Global Error */}
      {error && <ErrorAlert error={error} />}

      {/* Main Content */}
      <Tabs defaultValue="layers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="layers">Active Layers ({layers.length})</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
          <TabsTrigger value="help">Help</TabsTrigger>
        </TabsList>

        <TabsContent value="layers" className="space-y-4">
          {loading ? (
            <LoadingState />
          ) : !hasLayers ? (
            <EmptyState />
          ) : (
            <div className="grid gap-4">
              {layers.map((layer, index) => (
                <LayerCard
                  key={layer.id}
                  layer={layer}
                  index={index}
                  totalLayers={layers.length}
                  operation={layerOperations.get(layer.id)}
                  onToggle={() => handleToggleLayer(layer.id)}
                  onOpacityChange={(opacity) => handleOpacityChange(layer.id, opacity)}
                  onDuplicate={() => handleDuplicateLayer(layer.id)}
                  onDelete={() => handleDeleteLayer(layer.id)}
                  onMoveUp={() => handleMoveLayerUp(layer.id)}
                  onMoveDown={() => handleMoveLayerDown(layer.id)}
                />
              ))}
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
