import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { ScrollArea } from '../ui/scroll-area'
import logger from '@/utils/logger';
import {
  Circle as CircleIcon,
  Square,
  Pentagon as PolygonIcon,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  MapPin,
  Plus,
  Download,
  Upload
} from 'lucide-react'

/**
 * Geofence shape types
 */
export type GeofenceType = 'circle' | 'polygon' | 'rectangle'

/**
 * Geofence data structure
 */
export interface Geofence {
  id: string
  name: string
  type: GeofenceType
  coordinates: any
  color: string
  radius?: number
  visible: boolean
  editable: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * Props for AdvancedGeofencing component
 */
export interface AdvancedGeofencingProps {
  /** Reference to Google Maps instance */
  map: google.maps.Map | null
  /** Callback when a geofence is created */
  onGeofenceCreate?: (geofence: Geofence) => void
  /** Callback when a geofence is updated */
  onGeofenceUpdate?: (geofence: Geofence) => void
  /** Callback when a geofence is deleted */
  onGeofenceDelete?: (id: string) => void
  /** Initial geofences to display */
  initialGeofences?: Geofence[]
}

/**
 * Advanced Geofencing Component
 *
 * Provides comprehensive geofencing tools with drawing capabilities,
 * editing, and management features for Google Maps.
 */
export const AdvancedGeofencing: React.FC<AdvancedGeofencingProps> = ({
  map,
  onGeofenceCreate,
  onGeofenceUpdate,
  onGeofenceDelete,
  initialGeofences = []
}) => {
  // State management
  const [geofences, setGeofences] = useState<Geofence[]>(initialGeofences)
  const [selectedGeofence, setSelectedGeofence] = useState<string | null>(null)
  const [drawingMode, setDrawingMode] = useState<google.maps.drawing.OverlayType | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Refs for Google Maps objects
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null)
  const shapesRef = useRef<Map<string, google.maps.Circle | google.maps.Polygon | google.maps.Rectangle>>(new Map())

  /**
   * Initialize drawing manager when map is ready
   */
  useEffect(() => {
    if (!map || !window.google?.maps?.drawing) return

    // Create drawing manager
    const drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: false, // We'll use custom controls
      circleOptions: {
        fillColor: '#FF6B6B',
        fillOpacity: 0.3,
        strokeWeight: 2,
        strokeColor: '#FF6B6B',
        clickable: true,
        editable: false,
        draggable: false,
        zIndex: 1
      },
      polygonOptions: {
        fillColor: '#4ECDC4',
        fillOpacity: 0.3,
        strokeWeight: 2,
        strokeColor: '#4ECDC4',
        clickable: true,
        editable: false,
        draggable: false,
        zIndex: 1
      },
      rectangleOptions: {
        fillColor: '#95E1D3',
        fillOpacity: 0.3,
        strokeWeight: 2,
        strokeColor: '#95E1D3',
        clickable: true,
        editable: false,
        draggable: false,
        zIndex: 1
      }
    })

    drawingManager.setMap(map)
    drawingManagerRef.current = drawingManager

    // Add event listeners for shape completion
    google.maps.event.addListener(drawingManager, 'circlecomplete', (circle: google.maps.Circle) => {
      handleCircleComplete(circle)
    })

    google.maps.event.addListener(drawingManager, 'polygoncomplete', (polygon: google.maps.Polygon) => {
      handlePolygonComplete(polygon)
    })

    google.maps.event.addListener(drawingManager, 'rectanglecomplete', (rectangle: google.maps.Rectangle) => {
      handleRectangleComplete(rectangle)
    })

    return () => {
      // Cleanup
      google.maps.event.clearInstanceListeners(drawingManager)
      drawingManager.setMap(null)
      drawingManagerRef.current = null
    }
  }, [map])

  /**
   * Handle circle completion
   */
  const handleCircleComplete = useCallback((circle: google.maps.Circle) => {
    const center = circle.getCenter()
    if (!center) return

    const newGeofence: Geofence = {
      id: `geofence_${Date.now()}`,
      name: `Zone ${geofences.length + 1}`,
      type: 'circle',
      coordinates: {
        lat: center.lat(),
        lng: center.lng()
      },
      radius: circle.getRadius(),
      color: '#FF6B6B',
      visible: true,
      editable: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Store the shape reference
    shapesRef.current.set(newGeofence.id, circle)

    // Add click listener to the circle
    google.maps.event.addListener(circle, 'click', () => {
      setSelectedGeofence(newGeofence.id)
    })

    // Update state
    setGeofences(prev => [...prev, newGeofence])
    onGeofenceCreate?.(newGeofence)

    // Reset drawing mode
    setIsDrawing(false)
    setDrawingMode(null)
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(null)
    }
  }, [geofences, onGeofenceCreate])

  /**
   * Handle polygon completion
   */
  const handlePolygonComplete = useCallback((polygon: google.maps.Polygon) => {
    const path = polygon.getPath()
    const coordinates = path.getArray().map(latLng => ({
      lat: latLng.lat(),
      lng: latLng.lng()
    }))

    const newGeofence: Geofence = {
      id: `geofence_${Date.now()}`,
      name: `Zone ${geofences.length + 1}`,
      type: 'polygon',
      coordinates,
      color: '#4ECDC4',
      visible: true,
      editable: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Store the shape reference
    shapesRef.current.set(newGeofence.id, polygon)

    // Add click listener to the polygon
    google.maps.event.addListener(polygon, 'click', () => {
      setSelectedGeofence(newGeofence.id)
    })

    // Update state
    setGeofences(prev => [...prev, newGeofence])
    onGeofenceCreate?.(newGeofence)

    // Reset drawing mode
    setIsDrawing(false)
    setDrawingMode(null)
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(null)
    }
  }, [geofences, onGeofenceCreate])

  /**
   * Handle rectangle completion
   */
  const handleRectangleComplete = useCallback((rectangle: google.maps.Rectangle) => {
    const bounds = rectangle.getBounds()
    if (!bounds) return

    const ne = bounds.getNorthEast()
    const sw = bounds.getSouthWest()

    const newGeofence: Geofence = {
      id: `geofence_${Date.now()}`,
      name: `Zone ${geofences.length + 1}`,
      type: 'rectangle',
      coordinates: {
        north: ne.lat(),
        east: ne.lng(),
        south: sw.lat(),
        west: sw.lng()
      },
      color: '#95E1D3',
      visible: true,
      editable: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Store the shape reference
    shapesRef.current.set(newGeofence.id, rectangle)

    // Add click listener to the rectangle
    google.maps.event.addListener(rectangle, 'click', () => {
      setSelectedGeofence(newGeofence.id)
    })

    // Update state
    setGeofences(prev => [...prev, newGeofence])
    onGeofenceCreate?.(newGeofence)

    // Reset drawing mode
    setIsDrawing(false)
    setDrawingMode(null)
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(null)
    }
  }, [geofences, onGeofenceCreate])

  /**
   * Start drawing a new geofence
   */
  const startDrawing = useCallback((type: GeofenceType) => {
    if (!drawingManagerRef.current) return

    let drawingType: google.maps.drawing.OverlayType | null = null

    switch (type) {
      case 'circle':
        drawingType = google.maps.drawing.OverlayType.CIRCLE
        break
      case 'polygon':
        drawingType = google.maps.drawing.OverlayType.POLYGON
        break
      case 'rectangle':
        drawingType = google.maps.drawing.OverlayType.RECTANGLE
        break
    }

    if (drawingType) {
      setIsDrawing(true)
      setDrawingMode(drawingType)
      drawingManagerRef.current.setDrawingMode(drawingType)
    }
  }, [])

  /**
   * Cancel drawing mode
   */
  const cancelDrawing = useCallback(() => {
    setIsDrawing(false)
    setDrawingMode(null)
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(null)
    }
  }, [])

  /**
   * Toggle geofence visibility
   */
  const toggleVisibility = useCallback((id: string) => {
    const shape = shapesRef.current.get(id)
    if (shape) {
      const geofence = geofences.find(g => g.id === id)
      if (geofence) {
        const newVisibility = !geofence.visible
        shape.setVisible(newVisibility)

        setGeofences(prev => prev.map(g =>
          g.id === id ? { ...g, visible: newVisibility, updatedAt: new Date() } : g
        ))
      }
    }
  }, [geofences])

  /**
   * Toggle geofence editing
   */
  const toggleEditing = useCallback((id: string) => {
    const shape = shapesRef.current.get(id)
    if (shape) {
      const geofence = geofences.find(g => g.id === id)
      if (geofence) {
        const newEditable = !geofence.editable
        shape.setEditable(newEditable)
        shape.setDraggable(newEditable)

        setGeofences(prev => prev.map(g =>
          g.id === id ? { ...g, editable: newEditable, updatedAt: new Date() } : g
        ))

        // If enabling editing, select this geofence
        if (newEditable) {
          setSelectedGeofence(id)
        }
      }
    }
  }, [geofences])

  /**
   * Delete a geofence
   */
  const deleteGeofence = useCallback((id: string) => {
    const shape = shapesRef.current.get(id)
    if (shape) {
      // Remove from map
      shape.setMap(null)
      google.maps.event.clearInstanceListeners(shape)
      shapesRef.current.delete(id)
    }

    // Update state
    setGeofences(prev => prev.filter(g => g.id !== id))
    if (selectedGeofence === id) {
      setSelectedGeofence(null)
    }
    onGeofenceDelete?.(id)
  }, [selectedGeofence, onGeofenceDelete])

  /**
   * Update geofence name
   */
  const updateGeofenceName = useCallback((id: string, name: string) => {
    setGeofences(prev => prev.map(g =>
      g.id === id ? { ...g, name, updatedAt: new Date() } : g
    ))

    const geofence = geofences.find(g => g.id === id)
    if (geofence) {
      onGeofenceUpdate?.({ ...geofence, name, updatedAt: new Date() })
    }
  }, [geofences, onGeofenceUpdate])

  /**
   * Export geofences as JSON
   */
  const exportGeofences = useCallback(() => {
    const dataStr = JSON.stringify(geofences, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)

    const exportFileDefaultName = `geofences_${new Date().toISOString()}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }, [geofences])

  /**
   * Import geofences from JSON
   */
  const importGeofences = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string)
        if (Array.isArray(imported)) {
          // Clear existing shapes from map
          shapesRef.current.forEach(shape => {
            shape.setMap(null)
            google.maps.event.clearInstanceListeners(shape)
          })
          shapesRef.current.clear()

          // Add imported geofences
          setGeofences(imported)

          // Recreate shapes on map
          imported.forEach((geofence: Geofence) => {
            recreateShape(geofence)
          })
        }
      } catch (error) {
        logger.error('Failed to import geofences:', error)
      }
    }
    reader.readAsText(file)
  }, [])

  /**
   * Recreate a shape on the map from geofence data
   */
  const recreateShape = useCallback((geofence: Geofence) => {
    if (!map) return

    let shape: google.maps.Circle | google.maps.Polygon | google.maps.Rectangle | null = null

    switch (geofence.type) {
      case 'circle':
        shape = new google.maps.Circle({
          map,
          center: geofence.coordinates,
          radius: geofence.radius,
          fillColor: geofence.color,
          fillOpacity: 0.3,
          strokeColor: geofence.color,
          strokeWeight: 2,
          clickable: true,
          editable: geofence.editable,
          draggable: geofence.editable,
          visible: geofence.visible
        })
        break

      case 'polygon':
        shape = new google.maps.Polygon({
          map,
          paths: geofence.coordinates,
          fillColor: geofence.color,
          fillOpacity: 0.3,
          strokeColor: geofence.color,
          strokeWeight: 2,
          clickable: true,
          editable: geofence.editable,
          draggable: geofence.editable,
          visible: geofence.visible
        })
        break

      case 'rectangle':
        shape = new google.maps.Rectangle({
          map,
          bounds: geofence.coordinates,
          fillColor: geofence.color,
          fillOpacity: 0.3,
          strokeColor: geofence.color,
          strokeWeight: 2,
          clickable: true,
          editable: geofence.editable,
          draggable: geofence.editable,
          visible: geofence.visible
        })
        break
    }

    if (shape) {
      shapesRef.current.set(geofence.id, shape)
      google.maps.event.addListener(shape, 'click', () => {
        setSelectedGeofence(geofence.id)
      })
    }
  }, [map])

  /**
   * Filter geofences by search query
   */
  const filteredGeofences = geofences.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  /**
   * Get icon for geofence type
   */
  const getTypeIcon = (type: GeofenceType) => {
    switch (type) {
      case 'circle':
        return <CircleIcon className="w-4 h-4" />
      case 'polygon':
        return <PolygonIcon className="w-4 h-4" />
      case 'rectangle':
        return <Square className="w-4 h-4" />
    }
  }

  /**
   * Get badge color for geofence type
   */
  const getTypeBadgeColor = (type: GeofenceType) => {
    switch (type) {
      case 'circle':
        return 'bg-red-100 text-red-800'
      case 'polygon':
        return 'bg-teal-100 text-teal-800'
      case 'rectangle':
        return 'bg-green-100 text-green-800'
    }
  }

  return (
    <div className="flex h-full">
      {/* Geofence Management Sidebar */}
      <Card className="w-96 h-full border-r rounded-none">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Geofences ({geofences.length})
            </span>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={exportGeofences}
                disabled={geofences.length === 0}
                title="Export geofences"
              >
                <Download className="w-4 h-4" />
              </Button>
              <label>
                <input
                  type="file"
                  accept=".json"
                  onChange={importGeofences}
                  className="hidden"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => e.currentTarget.parentElement?.click()}
                  title="Import geofences"
                >
                  <Upload className="w-4 h-4" />
                </Button>
              </label>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {/* Drawing Controls */}
          <div>
            <h4 className="text-sm font-medium mb-2">Create New Geofence</h4>
            <div className="grid grid-cols-3 gap-2">
              <Button
                size="sm"
                variant={isDrawing && drawingMode === google.maps.drawing.OverlayType.CIRCLE ? 'default' : 'outline'}
                onClick={() => isDrawing ? cancelDrawing() : startDrawing('circle')}
                className="flex flex-col gap-1 h-auto py-2"
              >
                <CircleIcon className="w-5 h-5" />
                <span className="text-xs">Circle</span>
              </Button>
              <Button
                size="sm"
                variant={isDrawing && drawingMode === google.maps.drawing.OverlayType.POLYGON ? 'default' : 'outline'}
                onClick={() => isDrawing ? cancelDrawing() : startDrawing('polygon')}
                className="flex flex-col gap-1 h-auto py-2"
              >
                <PolygonIcon className="w-5 h-5" />
                <span className="text-xs">Polygon</span>
              </Button>
              <Button
                size="sm"
                variant={isDrawing && drawingMode === google.maps.drawing.OverlayType.RECTANGLE ? 'default' : 'outline'}
                onClick={() => isDrawing ? cancelDrawing() : startDrawing('rectangle')}
                className="flex flex-col gap-1 h-auto py-2"
              >
                <Square className="w-5 h-5" />
                <span className="text-xs">Rectangle</span>
              </Button>
            </div>
            {isDrawing && (
              <p className="text-xs text-muted-foreground mt-2">
                Click and drag on the map to draw. Click again to cancel.
              </p>
            )}
          </div>

          {/* Search */}
          <Input
            type="text"
            placeholder="Search geofences..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />

          {/* Geofence List */}
          <ScrollArea className="h-[calc(100vh-320px)]">
            <div className="space-y-2">
              {filteredGeofences.map(geofence => (
                <div
                  key={geofence.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedGeofence === geofence.id
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedGeofence(geofence.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      {getTypeIcon(geofence.type)}
                      <Input
                        type="text"
                        value={geofence.name}
                        onChange={(e) => {
                          e.stopPropagation()
                          updateGeofenceName(geofence.id, e.target.value)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="h-7 px-2 flex-1"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={`text-xs ${getTypeBadgeColor(geofence.type)}`}
                    >
                      {geofence.type}
                    </Badge>

                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleVisibility(geofence.id)
                        }}
                        title={geofence.visible ? 'Hide' : 'Show'}
                      >
                        {geofence.visible ? (
                          <Eye className="w-3 h-3" />
                        ) : (
                          <EyeOff className="w-3 h-3" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleEditing(geofence.id)
                        }}
                        className={geofence.editable ? 'text-primary' : ''}
                        title={geofence.editable ? 'Lock' : 'Edit'}
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteGeofence(geofence.id)
                        }}
                        className="text-destructive hover:text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {geofence.type === 'circle' && geofence.radius && (
                    <div className="text-xs text-muted-foreground mt-2">
                      Radius: {(geofence.radius / 1000).toFixed(2)} km
                    </div>
                  )}
                </div>
              ))}

              {filteredGeofences.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">
                    {searchQuery ? 'No geofences found' : 'No geofences created yet'}
                  </p>
                  {!searchQuery && (
                    <p className="text-xs mt-1">
                      Click a shape button above to start drawing
                    </p>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}