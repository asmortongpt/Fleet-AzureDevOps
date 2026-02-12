import {
  FileText,
  AlertTriangle,
  Clock,
  Upload,
  Download,
  Search,
  FileCheck,
  Calendar,
  User,
  MapPin,
  Eye,
  Edit,
  Trash2,
  Plus
} from "lucide-react"
import { useState, useMemo } from "react"
import useSWR from "swr"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useVehicles, useDrivers, useWorkOrders } from "@/hooks/use-api"
import { swrFetcher } from "@/lib/fetcher"
import { cn } from "@/lib/utils"

// Document Management Panel
const DocumentManagement = ({ vehicles, drivers }: { vehicles: any[]; drivers: any[] }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [documentType, setDocumentType] = useState('all')
  const [sortBy, setSortBy] = useState('date')

  const { data: documentsResponse } = useSWR<{ data: any[] }>(
    '/api/documents?limit=200',
    swrFetcher
  )

  const rawDocuments = documentsResponse?.data
  const documents: any[] = Array.isArray(rawDocuments)
    ? rawDocuments
    : Array.isArray((rawDocuments as any)?.data)
      ? (rawDocuments as any).data
      : []

  const vehicleMap = useMemo(() => {
    const safeVehicles = Array.isArray(vehicles) ? vehicles : []
    return new Map(
      safeVehicles.map((vehicle: any) => [
        vehicle.id,
        vehicle.unit_number || vehicle.unitNumber || vehicle.number || vehicle.name || vehicle.vin || 'Unknown'
      ])
    )
  }, [vehicles])

  const driverMap = useMemo(() => {
    const safeDrivers = Array.isArray(drivers) ? drivers : []
    return new Map(
      safeDrivers.map((driver: any) => [
        driver.id,
        `${driver.first_name || driver.firstName || ''} ${driver.last_name || driver.lastName || ''}`.trim() || driver.name || 'Unknown'
      ])
    )
  }, [drivers])

  const normalizedDocuments = useMemo(() => {
    const safeDocuments = Array.isArray(documents) ? documents : []
    return safeDocuments.map((doc: any) => {
      const expiryDate = doc.expiry_date || doc.expires_at || doc.expiryDate
      const expiry = expiryDate ? new Date(expiryDate) : null
      const now = new Date()
      let status = 'valid'
      if (expiry) {
        if (expiry < now) status = 'expired'
        else if ((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) <= 30) status = 'expiring'
      }

      return {
        id: doc.id,
        name: doc.file_name || doc.name || doc.title || 'Untitled Document',
        type: doc.document_type || doc.type || doc.category || 'other',
        status,
        expiryDate: expiry ? expiry.toLocaleDateString() : 'N/A',
        vehicle: doc.vehicle_id ? vehicleMap.get(doc.vehicle_id) : undefined,
        driver: doc.driver_id ? driverMap.get(doc.driver_id) : undefined,
        uploadedBy: doc.uploaded_by_name || doc.uploaded_by || '',
        uploadedDate: doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : (doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'N/A')
      }
    })
  }, [documents, vehicleMap, driverMap])

  const filteredDocuments = useMemo(() => {
    return normalizedDocuments.filter(doc => {
      const matchesSearch = !searchQuery ||
        doc.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = documentType === 'all' || doc.type === documentType
      return matchesSearch && matchesType
    })
  }, [normalizedDocuments, searchQuery, documentType])

  const sortedDocuments = useMemo(() => {
    const docs = [...filteredDocuments]
    if (sortBy === 'name') {
      return docs.sort((a, b) => a.name.localeCompare(b.name))
    }
    if (sortBy === 'status') {
      return docs.sort((a, b) => a.status.localeCompare(b.status))
    }
    return docs.sort((a, b) => new Date(b.uploadedDate).getTime() - new Date(a.uploadedDate).getTime())
  }, [filteredDocuments, sortBy])

  const getStatusVariant = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (status) {
      case 'valid': return 'default'
      case 'expiring': return 'secondary'
      case 'expired': return 'destructive'
      default: return 'outline'
    }
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-2">
        {/* Header with Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold">Document Management</h2>
            <p className="text-muted-foreground">Manage compliance documents and certificates</p>
          </div>
          <Button data-testid="upload-document-btn">
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="document-search"
            />
          </div>
          <Select value={documentType} onValueChange={setDocumentType}>
            <SelectTrigger className="w-48" data-testid="document-type-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Documents</SelectItem>
              <SelectItem value="registration">Registration</SelectItem>
              <SelectItem value="insurance">Insurance</SelectItem>
              <SelectItem value="inspection">Inspection</SelectItem>
              <SelectItem value="license">Licenses</SelectItem>
              <SelectItem value="permit">Permits</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Sort by Date</SelectItem>
              <SelectItem value="name">Sort by Name</SelectItem>
              <SelectItem value="status">Sort by Status</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Document List */}
        <div className="space-y-3">
          {sortedDocuments.length === 0 ? (
            <div className="text-center text-muted-foreground py-3">No documents available</div>
          ) : (
            sortedDocuments.map(doc => (
              <Card key={doc.id} data-testid={`document-card-${doc.id}`}>
                <CardContent className="p-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{doc.name}</h4>
                          <Badge variant={getStatusVariant(doc.status)}>
                            {doc.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <FileCheck className="h-3 w-3 mr-1" />
                            Type: {doc.type}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            Expires: {doc.expiryDate}
                          </div>
                          {doc.vehicle && (
                            <div className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              Vehicle: {doc.vehicle}
                            </div>
                          )}
                          {doc.driver && (
                            <div className="flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              Driver: {doc.driver}
                            </div>
                          )}
                          <div className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            By: {doc.uploadedBy || 'N/A'}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {doc.uploadedDate}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" aria-label="View document">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Download document">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Edit document">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Delete document">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </ScrollArea>
  )
}

// Incident Tracking Panel
const IncidentTracking = ({ vehicles, drivers }: { vehicles: any[]; drivers: any[] }) => {
  const [statusFilter, setStatusFilter] = useState('all')

  const { data: incidentsResponse } = useSWR<{ data: any[] }>(
    '/api/safety-incidents?limit=200',
    swrFetcher
  )

  const vehicleMap = useMemo(() => {
    const safeVehicles = Array.isArray(vehicles) ? vehicles : []
    return new Map(
      safeVehicles.map((vehicle: any) => [
        vehicle.id,
        vehicle.unit_number || vehicle.unitNumber || vehicle.number || vehicle.name || vehicle.vin || 'Unknown'
      ])
    )
  }, [vehicles])

  const driverMap = useMemo(() => {
    const safeDrivers = Array.isArray(drivers) ? drivers : []
    return new Map(
      safeDrivers.map((driver: any) => [
        driver.id,
        `${driver.first_name || driver.firstName || ''} ${driver.last_name || driver.lastName || ''}`.trim() || driver.name || 'Unknown'
      ])
    )
  }, [drivers])

  const incidents = useMemo(() => {
    const rawIncidents = incidentsResponse?.data
    const safeIncidents: any[] = Array.isArray(rawIncidents)
      ? rawIncidents
      : Array.isArray((rawIncidents as any)?.data)
        ? (rawIncidents as any).data
        : []
    return safeIncidents.map((incident: any) => {
      const occurredAt = incident.occurred_at || incident.date || incident.created_at
      return {
        id: incident.id,
        title: incident.title || incident.summary || incident.description || 'Incident',
        type: incident.type || incident.category || 'general',
        severity: incident.severity || incident.priority || 'low',
        status: incident.status || 'open',
        vehicle: incident.vehicle_id ? vehicleMap.get(incident.vehicle_id) : undefined,
        driver: incident.driver_id ? driverMap.get(incident.driver_id) : undefined,
        date: occurredAt ? new Date(occurredAt).toLocaleDateString() : 'N/A',
        location: incident.location || incident.address || 'N/A'
      }
    })
  }, [incidentsResponse, vehicleMap, driverMap])

  const filteredIncidents = useMemo(() => {
    if (statusFilter === 'all') return incidents
    return incidents.filter(incident => incident.status === statusFilter)
  }, [incidents, statusFilter])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-600'
      case 'minor': return 'text-yellow-600'
      case 'moderate': return 'text-orange-600'
      case 'major': return 'text-red-600'
      default: return 'text-slate-700'
    }
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold">Incident Tracking</h2>
            <p className="text-muted-foreground">Track and manage safety incidents</p>
          </div>
          <Button data-testid="create-incident-btn">
            <Plus className="h-4 w-4 mr-2" />
            Report Incident
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48" data-testid="incident-status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Incidents</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Incident List */}
        <div className="space-y-3">
          {filteredIncidents.length === 0 ? (
            <div className="text-center text-muted-foreground py-3">No incidents available</div>
          ) : (
            filteredIncidents.map(incident => (
            <Card key={incident.id} data-testid={`incident-card-${incident.id}`}>
              <CardContent className="p-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className={cn("h-4 w-4", getSeverityColor(incident.severity))} />
                      <h4 className="font-semibold">{incident.title}</h4>
                      <Badge variant="outline" className="capitalize">
                        {incident.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <div>Type: {incident.type}</div>
                      <div>Severity: <span className={getSeverityColor(incident.severity)}>{incident.severity}</span></div>
                      <div>Vehicle: {incident.vehicle}</div>
                      <div>Date: {incident.date}</div>
                      {incident.driver && <div>Driver: {incident.driver}</div>}
                      <div>Location: {incident.location}</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
            ))
          )}
        </div>
      </div>
    </ScrollArea>
  )
}

// Safety Compliance Panel
const SafetyCompliance = ({ vehicles, drivers }: { vehicles?: unknown[]; drivers?: unknown[] }) => {
  const _totalVehicles = vehicles?.length || 0
  const _totalDrivers = drivers?.length || 0

  const { data: analytics } = useSWR<any>('/api/analytics', swrFetcher)

  const complianceMetrics = useMemo(() => {
    const fleet = analytics?.fleet
    const driversData = analytics?.drivers
    const maintenance = analytics?.maintenance
    const safety = analytics?.safety

    const vehicleTotal = Number(fleet?.totalVehicles ?? _totalVehicles ?? 0)
    const vehicleActive = Number(fleet?.activeVehicles ?? 0)
    const driverTotal = Number(driversData?.totalDrivers ?? _totalDrivers ?? 0)
    const driverActive = Number(driversData?.activeDrivers ?? 0)
    const totalIncidents = Number(safety?.totalIncidents ?? 0)
    const incidents30 = Number(safety?.incidentsLast30Days ?? 0)
    const totalWorkOrders = Number(maintenance?.totalWorkOrders ?? 0)
    const completedWorkOrders = Number(maintenance?.completedThisMonth ?? 0)

    const calcPercent = (completed: number, total: number) =>
      total > 0 ? Math.round((completed / total) * 100) : 0

    return [
      {
        title: "Active Vehicles",
        completed: vehicleActive,
        total: vehicleTotal,
        percentage: calcPercent(vehicleActive, vehicleTotal),
      },
      {
        title: "Active Drivers",
        completed: driverActive,
        total: driverTotal,
        percentage: calcPercent(driverActive, driverTotal),
      },
      {
        title: "Incidents (30 Days)",
        completed: incidents30,
        total: totalIncidents,
        percentage: calcPercent(incidents30, totalIncidents),
      },
      {
        title: "Work Orders Completed",
        completed: completedWorkOrders,
        total: totalWorkOrders,
        percentage: calcPercent(completedWorkOrders, totalWorkOrders),
      }
    ]
  }, [_totalVehicles, _totalDrivers, analytics])

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600'
    if (percentage >= 75) return 'text-blue-800'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-2">
        <div>
          <h2 className="text-sm font-bold">Safety & Compliance</h2>
          <p className="text-muted-foreground">Monitor compliance status and safety metrics</p>
        </div>

        {/* Compliance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2" data-testid="compliance-metrics">
          {complianceMetrics.map((metric, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{metric.title}</span>
                  <Badge variant="outline" className={getStatusColor(metric.percentage)}>
                    {metric.total > 0 ? `${metric.percentage}%` : 'N/A'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">
                      {metric.total > 0 ? `${metric.completed} / ${metric.total}` : 'No data'}
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className={cn(
                        "h-2 rounded-full transition-all",
                        metric.percentage >= 90 && "bg-green-500",
                        metric.percentage >= 75 && metric.percentage < 90 && "bg-blue-500",
                        metric.percentage >= 60 && metric.percentage < 75 && "bg-yellow-500",
                        metric.percentage < 60 && "bg-red-500"
                      )}
                      style={{ width: `${metric.total > 0 ? metric.percentage : 0}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ScrollArea>
  )
}
// Main ComplianceWorkspace component
export function ComplianceWorkspace() {
  const { data: vehiclesData } = useVehicles()
  const { data: driversData } = useDrivers()
  const { data: workOrders } = useWorkOrders()
  const [activeView, setActiveView] = useState<'documents' | 'safety'>('documents')

  // Extract arrays from API response structure {data: [], meta: {}}
  const vehicles = Array.isArray(vehiclesData) ? vehiclesData : ((vehiclesData as any)?.data || [])
  const drivers = Array.isArray(driversData) ? driversData : ((driversData as any)?.data || [])

  return (
    <div className="h-screen flex flex-col">
      <div className="p-2 border-b">
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'documents' | 'safety')}>
          <TabsList>
            <TabsTrigger value="documents">Document Management</TabsTrigger>
            <TabsTrigger value="safety">Safety Compliance</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="flex-1 overflow-hidden">
        {activeView === 'documents' && <DocumentManagement vehicles={vehicles} drivers={drivers} />}
        {activeView === 'safety' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 h-full">
            <div className="border-r border-border/40">
              <SafetyCompliance vehicles={vehicles} drivers={drivers} />
            </div>
            <IncidentTracking vehicles={vehicles} drivers={drivers} />
          </div>
        )}
      </div>
    </div>
  )
}

export default ComplianceWorkspace
