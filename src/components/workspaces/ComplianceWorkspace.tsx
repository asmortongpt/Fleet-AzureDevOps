import {
  FileText,
  AlertTriangle,
  Clock,
  Upload,
  Download,
  Search,
  Shield,
  FileCheck,
  AlertCircle,
  Calendar,
  User,
  MapPin,
  Settings,
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
import { useVehicles, useDrivers, useWorkOrders } from "@/hooks/use-api"
import { cn } from "@/lib/utils"

// Document Management Panel
const DocumentManagement = ({ _documents }: { _documents?: unknown }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [documentType, setDocumentType] = useState('all')
  const [sortBy, setSortBy] = useState('date')

  // Mock documents (in production, this would come from API)
  const mockDocuments = [
    {
      id: '1',
      name: 'Vehicle Registration - FL123',
      type: 'registration',
      status: 'valid',
      expiryDate: '2025-06-15',
      vehicle: 'FL-123',
      uploadedBy: 'John Smith',
      uploadedDate: '2024-01-10'
    },
    {
      id: '2',
      name: 'Insurance Policy - Fleet Coverage',
      type: 'insurance',
      status: 'expiring',
      expiryDate: '2025-01-30',
      uploadedBy: 'Sarah Johnson',
      uploadedDate: '2024-01-01'
    },
    {
      id: '3',
      name: 'DOT Annual Inspection Report',
      type: 'inspection',
      status: 'valid',
      expiryDate: '2025-08-20',
      uploadedBy: 'Mike Davis',
      uploadedDate: '2024-08-20'
    },
    {
      id: '4',
      name: 'Driver License - Driver001',
      type: 'license',
      status: 'expired',
      expiryDate: '2024-12-01',
      driver: 'Robert Brown',
      uploadedBy: 'Admin',
      uploadedDate: '2023-01-15'
    }
  ]

  const filteredDocuments = useMemo(() => {
    return mockDocuments.filter(doc => {
      const matchesSearch = !searchQuery ||
        doc.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = documentType === 'all' || doc.type === documentType
      return matchesSearch && matchesType
    })
  }, [searchQuery, documentType])

  const getStatusVariant = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    switch(status) {
      case 'valid': return 'default'
      case 'expiring': return 'secondary'
      case 'expired': return 'destructive'
      default: return 'outline'
    }
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Header with Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Document Management</h2>
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
          {filteredDocuments.map(doc => (
            <Card key={doc.id} data-testid={`document-card-${doc.id}`}>
              <CardContent className="p-4">
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
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
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

  // Mock incidents
  const mockIncidents = [
    {
      id: '1',
      title: 'Minor Collision - Parking Lot',
      type: 'collision',
      severity: 'minor',
      status: 'under_review',
      vehicle: 'FL-123',
      driver: 'John Doe',
      date: '2024-12-10',
      location: 'Main Office Parking'
    },
    {
      id: '2',
      title: 'Speeding Violation - Highway',
      type: 'violation',
      severity: 'low',
      status: 'resolved',
      vehicle: 'FL-456',
      driver: 'Jane Smith',
      date: '2024-12-08',
      location: 'I-95 North'
    },
    {
      id: '3',
      title: 'Equipment Damage - Forklift',
      type: 'damage',
      severity: 'moderate',
      status: 'open',
      vehicle: 'EQ-789',
      date: '2024-12-14',
      location: 'Warehouse B'
    }
  ]

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'low': return 'text-green-600'
      case 'minor': return 'text-yellow-600'
      case 'moderate': return 'text-orange-600'
      case 'major': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Incident Tracking</h2>
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
          {mockIncidents.map(incident => (
            <Card key={incident.id} data-testid={`incident-card-${incident.id}`}>
              <CardContent className="p-4">
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
        </div>
      </div>
    </ScrollArea>
  )
}

// Safety Compliance Panel
const SafetyCompliance = ({ vehicles, drivers }: { vehicles?: unknown[]; drivers?: unknown[] }) => {
  const _totalVehicles = vehicles?.length || 0
  const _totalDrivers = drivers?.length || 0

  const complianceMetrics = [
    {
      title: "Vehicle Inspections",
      completed: 45,
      total: 50,
      percentage: 90,
      status: 'good'
    },
    {
      title: "Driver Certifications",
      completed: 38,
      total: 42,
      percentage: 90,
      status: 'good'
    },
    {
      title: "Insurance Coverage",
      completed: 48,
      total: 50,
      percentage: 96,
      status: 'excellent'
    },
    {
      title: "Safety Training",
      completed: 32,
      total: 42,
      percentage: 76,
      status: 'warning'
    }
  ]

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'excellent': return 'text-green-600'
      case 'good': return 'text-blue-600'
      case 'warning': return 'text-yellow-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Safety & Compliance</h2>
          <p className="text-muted-foreground">Monitor compliance status and safety metrics</p>
        </div>

        {/* Compliance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="compliance-metrics">
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
  const { data: vehicles } = useVehicles()
  const { data: drivers } = useDrivers()
  const { data: workOrders } = useWorkOrders()
  const [activeView, setActiveView] = useState<'documents' | 'safety'>('documents')

  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 border-b">
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'documents' | 'safety')}>
          <TabsList>
            <TabsTrigger value="documents">Document Management</TabsTrigger>
            <TabsTrigger value="safety">Safety Compliance</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="flex-1 overflow-hidden">
        {activeView === 'documents' && <DocumentManagement />}
        {activeView === 'safety' && <SafetyCompliance vehicles={vehicles} drivers={drivers} />}
      </div>
    </div>
  )
}

export default ComplianceWorkspace
