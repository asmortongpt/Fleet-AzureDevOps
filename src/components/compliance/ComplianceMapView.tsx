import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  FileText,
  Calendar,
  Eye,
  Filter,
  Layers
} from 'lucide-react'
import React, { useState, useMemo, useCallback } from 'react'

import { UnifiedFleetMap } from '@/components/Maps/UnifiedFleetMap'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useVehicles, useFacilities } from '@/hooks/use-api'
import type { Vehicle, GISFacility } from '@/lib/types'
import { cn } from '@/lib/utils'

/**
 * Compliance Map View - Map-First Architecture
 *
 * Features:
 * - 70/30 split layout (map left, details right)
 * - Inspection zones with status overlays
 * - Violation tracking markers (color-coded by severity)
 * - Certification status overlay (expired/expiring soon)
 * - Regulatory zones with jurisdiction boundaries
 */

// Compliance zone types
interface ComplianceZone {
  id: string
  name: string
  type: 'inspection' | 'violation' | 'certification' | 'regulatory'
  status: 'compliant' | 'warning' | 'violation' | 'expired'
  severity: 'low' | 'medium' | 'high' | 'critical'
  location: { lat: number; lng: number }
  radius?: number
  vehicles: string[]
  dueDate?: string
  description: string
  jurisdiction?: string
}

// Mock compliance zones
const mockComplianceZones: ComplianceZone[] = [
  {
    id: 'zone-1',
    name: 'Annual Inspection Zone A',
    type: 'inspection',
    status: 'warning',
    severity: 'medium',
    location: { lat: 28.5421, lng: -81.3790 },
    radius: 5000,
    vehicles: ['veh-1', 'veh-2', 'veh-3'],
    dueDate: '2025-01-15',
    description: '3 vehicles due for annual inspection',
    jurisdiction: 'Orange County'
  },
  {
    id: 'zone-2',
    name: 'Emissions Testing Required',
    type: 'certification',
    status: 'expired',
    severity: 'high',
    location: { lat: 28.5383, lng: -81.3792 },
    radius: 3000,
    vehicles: ['veh-4'],
    dueDate: '2024-12-01',
    description: '1 vehicle with expired emissions certificate',
    jurisdiction: 'Orange County'
  },
  {
    id: 'zone-3',
    name: 'DOT Compliance Zone',
    type: 'regulatory',
    status: 'compliant',
    severity: 'low',
    location: { lat: 28.5450, lng: -81.3750 },
    radius: 8000,
    vehicles: ['veh-5', 'veh-6'],
    description: 'All DOT requirements current',
    jurisdiction: 'Federal DOT'
  },
  {
    id: 'zone-4',
    name: 'Speed Violation Hotspot',
    type: 'violation',
    status: 'violation',
    severity: 'critical',
    location: { lat: 28.5400, lng: -81.3850 },
    radius: 2000,
    vehicles: ['veh-7'],
    dueDate: '2024-12-20',
    description: 'Active violation - immediate attention required',
    jurisdiction: 'Orange County'
  }
]

// Compliance Details Panel Component
const ComplianceDetailsPanel: React.FC<{
  selectedZone: ComplianceZone | null
  onViewDetails: (zoneId: string) => void
}> = ({ selectedZone, onViewDetails }) => {
  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'low': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'high': return 'text-orange-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusBadgeVariant = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    switch(status) {
      case 'compliant': return 'default'
      case 'warning': return 'secondary'
      case 'violation': return 'destructive'
      case 'expired': return 'destructive'
      default: return 'outline'
    }
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'compliant': return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'warning': return <Clock className="h-5 w-5 text-yellow-600" />
      case 'violation': return <AlertTriangle className="h-5 w-5 text-red-600" />
      case 'expired': return <AlertTriangle className="h-5 w-5 text-red-600" />
      default: return <Shield className="h-5 w-5" />
    }
  }

  if (!selectedZone) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">Select a compliance zone on the map to view details</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* Zone Header */}
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-2">
              {getStatusIcon(selectedZone.status)}
              <div>
                <h3 className="font-semibold">{selectedZone.name}</h3>
                <p className="text-sm text-muted-foreground capitalize">
                  {selectedZone.type} Zone
                </p>
              </div>
            </div>
            <Badge variant={getStatusBadgeVariant(selectedZone.status)}>
              {selectedZone.status}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Zone Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Zone Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-muted-foreground">Severity</div>
                <div className={cn("font-semibold capitalize", getSeverityColor(selectedZone.severity))}>
                  {selectedZone.severity}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Vehicles</div>
                <div className="font-semibold">{selectedZone.vehicles.length}</div>
              </div>
              {selectedZone.jurisdiction && (
                <div className="col-span-2">
                  <div className="text-muted-foreground">Jurisdiction</div>
                  <div className="font-medium">{selectedZone.jurisdiction}</div>
                </div>
              )}
              {selectedZone.dueDate && (
                <div className="col-span-2">
                  <div className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Due Date
                  </div>
                  <div className="font-medium">{selectedZone.dueDate}</div>
                </div>
              )}
            </div>

            <Separator />

            <div>
              <div className="text-sm text-muted-foreground mb-1">Description</div>
              <p className="text-sm">{selectedZone.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Affected Vehicles */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Affected Vehicles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedZone.vehicles.map((vehicleId, index) => (
                <div
                  key={vehicleId}
                  className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                >
                  <div className="text-sm font-medium">Vehicle #{index + 1}</div>
                  <Badge variant="outline" className="text-xs">
                    {selectedZone.type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-2">
          <Button
            className="w-full"
            onClick={() => onViewDetails(selectedZone.id)}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Full Details
          </Button>
          <Button variant="outline" className="w-full">
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
          {selectedZone.status === 'violation' || selectedZone.status === 'expired' && (
            <Button variant="destructive" className="w-full">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Take Action
            </Button>
          )}
        </div>
      </div>
    </ScrollArea>
  )
}

// Main Compliance Map View Component
export function ComplianceMapView() {
  const [selectedZone, setSelectedZone] = useState<ComplianceZone | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // API hooks
  const { data: vehicles = [] } = useVehicles()
  const { data: facilities = [] } = useFacilities()

  // Filter compliance zones
  const filteredZones = useMemo(() => {
    return mockComplianceZones.filter(zone => {
      const matchesType = filterType === 'all' || zone.type === filterType
      const matchesStatus = filterStatus === 'all' || zone.status === filterStatus
      return matchesType && matchesStatus
    })
  }, [filterType, filterStatus])

  // Calculate zone statistics
  const zoneStats = useMemo(() => {
    return {
      total: mockComplianceZones.length,
      compliant: mockComplianceZones.filter(z => z.status === 'compliant').length,
      warning: mockComplianceZones.filter(z => z.status === 'warning').length,
      violation: mockComplianceZones.filter(z => z.status === 'violation' || z.status === 'expired').length,
    }
  }, [])

  const handleZoneSelect = useCallback((zoneId: string) => {
    const zone = mockComplianceZones.find(z => z.id === zoneId)
    setSelectedZone(zone || null)
  }, [])

  const handleViewDetails = useCallback((zoneId: string) => {
    console.log('View details for zone:', zoneId)
    // In production, this would navigate to detailed compliance view
  }, [])

  return (
    <div className="h-screen flex flex-col" data-testid="compliance-map-view">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Compliance Map</h1>
            <p className="text-sm text-muted-foreground">
              Monitor compliance zones, inspections, and violations
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40" data-testid="compliance-type-filter">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="inspection">Inspection</SelectItem>
                <SelectItem value="violation">Violation</SelectItem>
                <SelectItem value="certification">Certification</SelectItem>
                <SelectItem value="regulatory">Regulatory</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40" data-testid="compliance-status-filter">
                <Layers className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="compliant">Compliant</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="violation">Violation</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Content - 70/30 Split */}
      <div className="flex-1 grid grid-cols-[70%_30%]">
        {/* LEFT: Map View (70%) */}
        <div className="relative h-full border-r">
          <UnifiedFleetMap
            vehicles={vehicles as unknown as Vehicle[]}
            facilities={facilities as unknown as GISFacility[]}
            height="100%"
            onVehicleSelect={(vehicleId) => {
              // Find zone associated with vehicle
              const zone = filteredZones.find(z => z.vehicles.includes(vehicleId))
              if (zone) setSelectedZone(zone)
            }}
          />

          {/* Zone Statistics Overlay */}
          <div
            className="absolute top-4 left-4 bg-background/95 backdrop-blur rounded-lg p-4 shadow-lg z-10"
            data-testid="compliance-stats-overlay"
          >
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Compliance Zones
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full" />
                  <span className="text-sm">Compliant</span>
                </div>
                <span className="font-semibold" data-testid="zone-stat-compliant">
                  {zoneStats.compliant}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse" />
                  <span className="text-sm">Warning</span>
                </div>
                <span className="font-semibold" data-testid="zone-stat-warning">
                  {zoneStats.warning}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-sm">Violation</span>
                </div>
                <span className="font-semibold" data-testid="zone-stat-violation">
                  {zoneStats.violation}
                </span>
              </div>
            </div>
          </div>

          {/* Zone Markers on Map */}
          <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur rounded-lg p-3 shadow-lg z-10">
            <div className="text-xs text-muted-foreground mb-2">Active Zones</div>
            <div className="flex flex-wrap gap-2">
              {filteredZones.map(zone => (
                <Button
                  key={zone.id}
                  size="sm"
                  variant={selectedZone?.id === zone.id ? 'default' : 'outline'}
                  onClick={() => handleZoneSelect(zone.id)}
                  className="text-xs"
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  {zone.name}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Details Panel (30%) */}
        <div className="bg-background" data-testid="compliance-details-panel">
          <ComplianceDetailsPanel
            selectedZone={selectedZone}
            onViewDetails={handleViewDetails}
          />
        </div>
      </div>
    </div>
  )
}
