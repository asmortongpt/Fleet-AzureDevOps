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
import {
  useVehicles,
  useDrivers,
  useIncidents,
  useInspections,
  useCertifications,
  useTrainingProgress,
  useDocuments,
  useInsurancePolicies
} from "@/hooks/use-api"
import { cn } from "@/lib/utils"

// Document Management Panel
const DocumentManagement = ({ vehicles, drivers }: { vehicles: any[]; drivers: any[] }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [documentType, setDocumentType] = useState('all')
  const [sortBy, setSortBy] = useState('date')

  const { data: documents = [] } = useDocuments({ limit: 200 })

  const vehicleMap = useMemo(() => {
    return new Map(
      (vehicles || []).map((vehicle: any) => [
        vehicle.id,
        vehicle.unit_number || vehicle.unitNumber || vehicle.number || vehicle.name || vehicle.vin || 'Unknown'
      ])
    )
  }, [vehicles])

  const driverMap = useMemo(() => {
    return new Map(
      (drivers || []).map((driver: any) => [
        driver.id,
        `${driver.first_name || driver.firstName || ''} ${driver.last_name || driver.lastName || ''}`.trim() || driver.name || 'Unknown'
      ])
    )
  }, [drivers])

  const normalizedDocuments = useMemo(() => {
    return documents.map((doc: any) => {
      const expiryDate = doc.expiry_date || doc.expires_at || doc.expiryDate
      const expiry = expiryDate ? new Date(expiryDate) : null
      const now = new Date()
      let status = 'valid'
      if (expiry) {
        if (expiry < now) status = 'expired'
        else if ((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) <= 30) status = 'expiring'
      }

      const uploadedAt = doc.uploaded_at || doc.created_at
      return {
        id: doc.id,
        name: doc.file_name || doc.name || doc.title || 'Untitled Document',
        type: doc.document_type || doc.type || doc.category || 'other',
        status,
        expiryDate: expiry ? expiry.toLocaleDateString() : 'N/A',
        vehicle: doc.vehicle_id ? vehicleMap.get(doc.vehicle_id) : undefined,
        driver: doc.driver_id ? driverMap.get(doc.driver_id) : undefined,
        uploadedBy: doc.uploaded_by_name || 'System',
        uploadedDate: uploadedAt ? new Date(uploadedAt).toLocaleDateString() : 'N/A',
        uploadedAt: uploadedAt ? new Date(uploadedAt) : null
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
    return docs.sort((a, b) => (b.uploadedAt?.getTime() || 0) - (a.uploadedAt?.getTime() || 0))
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
          {sortedDocuments.map(doc => (
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
                          By: {doc.uploadedBy}
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
          ))}
        </div>
      </div>
    </ScrollArea>
  )
}

// Incident Tracking Panel
const IncidentTracking = () => {
  const [statusFilter, setStatusFilter] = useState('all')
  const { data: incidents = [] } = useIncidents()

  const normalizedIncidents = useMemo(() => {
    return incidents.map((incident: any) => ({
      id: incident.id,
      title: incident.title || incident.number || incident.description || 'Incident',
      type: incident.type || 'incident',
      severity: incident.severity || 'low',
      status: incident.status || 'open',
      vehicle: incident.vehicle_unit || incident.vehicle_number || incident.vehicle_id || incident.vehicleId || 'Unknown',
      driver: incident.driver_name || incident.driverName,
      date: incident.incident_date ? new Date(incident.incident_date).toLocaleDateString() : 'N/A',
      location: incident.location || 'Unknown'
    }))
  }, [incidents])

  const filteredIncidents = useMemo(() => {
    if (statusFilter === 'all') return normalizedIncidents
    return normalizedIncidents.filter((incident) => incident.status === statusFilter)
  }, [normalizedIncidents, statusFilter])

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
          {filteredIncidents.map(incident => (
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
          ))}
          {filteredIncidents.length === 0 && (
            <div className="text-sm text-muted-foreground">No incidents match the selected filter.</div>
          )}
        </div>
      </div>
    </ScrollArea>
  )
}

// Safety Compliance Panel
const SafetyCompliance = ({
  vehicles = [],
  drivers = [],
  inspections = [],
  certifications = [],
  trainingProgress = [],
  insurancePolicies = []
}: {
  vehicles?: any[];
  drivers?: any[];
  inspections?: any[];
  certifications?: any[];
  trainingProgress?: any[];
  insurancePolicies?: any[];
}) => {
  const totalVehicles = vehicles.length
  const totalDrivers = drivers.length

  const completedInspections = inspections.filter((inspection: any) =>
    inspection.status === 'completed' || inspection.completed_at || inspection.completedAt
  ).length

  const activeCertifications = certifications.filter((cert: any) => {
    if (cert.status && cert.status !== 'active') return false
    if (!cert.expiry_date && !cert.expiryDate) return true
    const expiry = new Date(cert.expiry_date || cert.expiryDate)
    return expiry.getTime() >= Date.now()
  })

  const certifiedDrivers = new Set(activeCertifications.map((cert: any) => cert.driver_id || cert.driverId)).size

  const trainedDrivers = new Set(
    trainingProgress
      .filter((progress: any) => Number(progress.progress || 0) >= 100 || Number(progress.score || 0) >= 70)
      .map((progress: any) => progress.driver_id || progress.driverId)
  ).size

  const coveredVehiclesRaw = insurancePolicies.reduce((sum: number, policy: any) => {
    const count = Number(policy.active_vehicle_count ?? policy.covered_vehicle_count ?? 0)
    return sum + (Number.isFinite(count) ? count : 0)
  }, 0)
  const coveredVehicles = Math.min(totalVehicles, coveredVehiclesRaw)

  const buildStatus = (percentage: number) => {
    if (percentage >= 95) return 'excellent'
    if (percentage >= 85) return 'good'
    if (percentage >= 70) return 'warning'
    return 'critical'
  }

  const complianceMetrics = [
    {
      title: "Vehicle Inspections",
      completed: completedInspections,
      total: totalVehicles,
      percentage: totalVehicles > 0 ? Math.round((completedInspections / totalVehicles) * 100) : 0,
      status: buildStatus(totalVehicles > 0 ? (completedInspections / totalVehicles) * 100 : 0)
    },
    {
      title: "Driver Certifications",
      completed: certifiedDrivers,
      total: totalDrivers,
      percentage: totalDrivers > 0 ? Math.round((certifiedDrivers / totalDrivers) * 100) : 0,
      status: buildStatus(totalDrivers > 0 ? (certifiedDrivers / totalDrivers) * 100 : 0)
    },
    {
      title: "Insurance Coverage",
      completed: coveredVehicles,
      total: totalVehicles,
      percentage: totalVehicles > 0 ? Math.round((coveredVehicles / totalVehicles) * 100) : 0,
      status: buildStatus(totalVehicles > 0 ? (coveredVehicles / totalVehicles) * 100 : 0)
    },
    {
      title: "Safety Training",
      completed: trainedDrivers,
      total: totalDrivers,
      percentage: totalDrivers > 0 ? Math.round((trainedDrivers / totalDrivers) * 100) : 0,
      status: buildStatus(totalDrivers > 0 ? (trainedDrivers / totalDrivers) * 100 : 0)
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600'
      case 'good': return 'text-blue-800'
      case 'warning': return 'text-yellow-600'
      case 'critical': return 'text-red-600'
      default: return 'text-slate-700'
    }
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
                  <Badge variant="outline" className={getStatusColor(metric.status)}>
                    {metric.percentage}%
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{metric.completed} / {metric.total}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className={cn(
                        "h-2 rounded-full transition-all",
                        metric.status === 'excellent' && "bg-green-500",
                        metric.status === 'good' && "bg-blue-500",
                        metric.status === 'warning' && "bg-yellow-500",
                        metric.status === 'critical' && "bg-red-500"
                      )}
                      style={{ width: `${metric.percentage}%` }}
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
  const { data: inspectionsData } = useInspections()
  const { data: certificationsData } = useCertifications()
  const { data: trainingProgressData } = useTrainingProgress()
  const { data: insurancePoliciesData } = useInsurancePolicies()
  const [activeView, setActiveView] = useState<'documents' | 'safety'>('documents')

  // Extract arrays from API response structure {data: [], meta: {}}
  const vehicles = Array.isArray(vehiclesData) ? vehiclesData : ((vehiclesData as any)?.data || [])
  const drivers = Array.isArray(driversData) ? driversData : ((driversData as any)?.data || [])
  const inspections = Array.isArray(inspectionsData) ? inspectionsData : ((inspectionsData as any)?.data || [])
  const certifications = Array.isArray(certificationsData) ? certificationsData : ((certificationsData as any)?.data || [])
  const trainingProgress = Array.isArray(trainingProgressData) ? trainingProgressData : ((trainingProgressData as any)?.data || [])
  const insurancePolicies = Array.isArray(insurancePoliciesData) ? insurancePoliciesData : ((insurancePoliciesData as any)?.data || [])

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
          <SafetyCompliance
            vehicles={vehicles}
            drivers={drivers}
            inspections={inspections}
            certifications={certifications}
            trainingProgress={trainingProgress}
            insurancePolicies={insurancePolicies}
          />
        )}
      </div>
    </div>
  )
}

export default ComplianceWorkspace
