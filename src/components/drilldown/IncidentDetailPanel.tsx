/**
 * IncidentDetailPanel - Level 2 drilldown for incident details
 * Shows comprehensive incident information with evidence, timeline, involved parties, and related records
 */

import {
  AlertTriangle,
  Calendar,
  MapPin,
  Car,
  User,
  FileText,
  Camera,
  History,
  Shield,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Phone,
  Mail,
  Download,
  ExternalLink,
} from 'lucide-react'
import { useState } from 'react'
import useSWR from 'swr'

import { DrilldownContent } from '@/components/DrilldownPanel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useDrilldown } from '@/contexts/DrilldownContext'

interface IncidentDetailPanelProps {
  incidentId: string
}

interface IncidentData {
  id: string
  incident_number: string
  title: string
  description: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'reported' | 'under_review' | 'investigating' | 'resolved' | 'closed'
  date: string
  time?: string
  location: string
  latitude?: number
  longitude?: number
  weather_conditions?: string
  road_conditions?: string
  vehicle_id?: string
  vehicle_name?: string
  driver_id?: string
  driver_name?: string
  driver_avatar?: string
  reported_by?: string
  reported_date?: string
  estimated_cost?: number
  actual_cost?: number
  injuries?: number
  fatalities?: number
  police_report_number?: string
  insurance_claim_number?: string
  insurance_claim_status?: string
}

interface Evidence {
  id: string
  type: 'photo' | 'video' | 'document' | 'audio'
  url: string
  filename: string
  description?: string
  uploaded_by?: string
  uploaded_date: string
  thumbnail_url?: string
}

interface InvolvedParty {
  id: string
  type: 'driver' | 'passenger' | 'pedestrian' | 'witness' | 'third_party'
  name: string
  contact_phone?: string
  contact_email?: string
  statement?: string
  injuries?: string
  role?: string
}

interface TimelineEvent {
  id: string
  event_type: string
  description: string
  timestamp: string
  user_name?: string
  user_avatar?: string
  metadata?: Record<string, any>
}

interface RelatedRecord {
  id: string
  type: 'work_order' | 'inspection' | 'violation' | 'claim'
  title: string
  date: string
  status?: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function IncidentDetailPanel({ incidentId }: IncidentDetailPanelProps) {
  const { push } = useDrilldown()
  const [activeTab, setActiveTab] = useState('overview')

  // Main incident data
  const { data: incident, error, isLoading, mutate } = useSWR<IncidentData>(
    `/api/incidents/${incidentId}`,
    fetcher
  )

  // Evidence (photos, videos, documents)
  const { data: evidence } = useSWR<Evidence[]>(
    incidentId ? `/api/incidents/${incidentId}/evidence` : null,
    fetcher
  )

  // Involved parties
  const { data: involvedParties } = useSWR<InvolvedParty[]>(
    incidentId ? `/api/incidents/${incidentId}/involved-parties` : null,
    fetcher
  )

  // Timeline/audit trail
  const { data: timeline } = useSWR<TimelineEvent[]>(
    incidentId ? `/api/incidents/${incidentId}/timeline` : null,
    fetcher
  )

  // Related records
  const { data: relatedRecords } = useSWR<RelatedRecord[]>(
    incidentId ? `/api/incidents/${incidentId}/related` : null,
    fetcher
  )

  const handleViewVehicle = () => {
    if (incident?.vehicle_id) {
      push({
        id: `vehicle-${incident.vehicle_id}`,
        type: 'vehicle',
        label: incident.vehicle_name || 'Vehicle Details',
        data: { vehicleId: incident.vehicle_id },
      })
    }
  }

  const handleViewDriver = () => {
    if (incident?.driver_id) {
      push({
        id: `driver-${incident.driver_id}`,
        type: 'driver',
        label: incident.driver_name || 'Driver Details',
        data: { driverId: incident.driver_id },
      })
    }
  }

  const handleViewRelatedRecord = (record: RelatedRecord) => {
    push({
      id: `${record.type}-${record.id}`,
      type: record.type,
      label: record.title,
      data: { id: record.id, recordType: record.type },
    })
  }

  const handleViewLocation = () => {
    if (incident?.latitude && incident?.longitude) {
      window.open(
        `https://www.google.com/maps?q=${incident.latitude},${incident.longitude}`,
        '_blank'
      )
    }
  }

  const getSeverityColor = (severity: string): 'default' | 'destructive' | 'outline' | 'secondary' => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'destructive'
      case 'high':
        return 'destructive'
      case 'medium':
        return 'default'
      case 'low':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getStatusColor = (status: string): 'default' | 'destructive' | 'outline' | 'secondary' => {
    switch (status?.toLowerCase()) {
      case 'resolved':
      case 'closed':
        return 'default'
      case 'investigating':
      case 'under_review':
        return 'default'
      case 'reported':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
      case 'closed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'investigating':
      case 'under_review':
        return <Clock className="h-5 w-5 text-blue-500" />
      case 'reported':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getEvidenceIcon = (type: string) => {
    switch (type) {
      case 'photo':
        return <Camera className="h-4 w-4" />
      case 'video':
        return <Camera className="h-4 w-4" />
      case 'document':
        return <FileText className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <DrilldownContent loading={isLoading} error={error} onRetry={() => mutate()}>
      {incident && (
        <div className="space-y-6">
          {/* Incident Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-2xl font-bold">Incident #{incident.incident_number}</h3>
              <p className="text-sm text-muted-foreground">{incident.title}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant={getSeverityColor(incident.severity)}>
                  {incident.severity} Severity
                </Badge>
                <Badge variant={getStatusColor(incident.status)}>
                  {incident.status.replace('_', ' ')}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {incident.type}
                </Badge>
                {(incident.injuries || 0) > 0 && (
                  <Badge variant="destructive">
                    {incident.injuries} Injury{incident.injuries !== 1 ? 'ies' : 'y'}
                  </Badge>
                )}
              </div>
            </div>
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">
                  {new Date(incident.date).toLocaleDateString()}
                </div>
                {incident.time && (
                  <p className="text-xs text-muted-foreground mt-1">{incident.time}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Cost
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">
                  ${incident.actual_cost?.toFixed(2) || incident.estimated_cost?.toFixed(2) || '0.00'}
                </div>
                {incident.estimated_cost && incident.actual_cost && incident.actual_cost !== incident.estimated_cost && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Est: ${incident.estimated_cost.toFixed(2)}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Evidence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{evidence?.length || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">files attached</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Involved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{involvedParties?.length || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">parties</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabbed Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="evidence">Evidence ({evidence?.length || 0})</TabsTrigger>
              <TabsTrigger value="parties">Parties ({involvedParties?.length || 0})</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="related">Related</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              {/* Incident Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Incident Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <p className="font-medium capitalize">{incident.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Severity</p>
                      <Badge variant={getSeverityColor(incident.severity)}>
                        {incident.severity}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge variant={getStatusColor(incident.status)}>
                        {incident.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Reported By</p>
                      <p className="font-medium">{incident.reported_by || 'N/A'}</p>
                      {incident.reported_date && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(incident.reported_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Location */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-medium">{incident.location}</p>
                    {(incident.latitude && incident.longitude) && (
                      <Button
                        variant="link"
                        className="p-0 h-auto text-sm"
                        onClick={handleViewLocation}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View on Map
                      </Button>
                    )}
                  </div>
                  {(incident.weather_conditions || incident.road_conditions) && (
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                      {incident.weather_conditions && (
                        <div>
                          <p className="text-sm text-muted-foreground">Weather</p>
                          <p className="font-medium">{incident.weather_conditions}</p>
                        </div>
                      )}
                      {incident.road_conditions && (
                        <div>
                          <p className="text-sm text-muted-foreground">Road Conditions</p>
                          <p className="font-medium">{incident.road_conditions}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Vehicle and Driver */}
              <div className="grid grid-cols-2 gap-4">
                {incident.vehicle_id && (
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleViewVehicle}>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Car className="h-4 w-4" />
                        Vehicle
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="font-medium">{incident.vehicle_name || 'Unknown'}</p>
                      <Button variant="link" className="p-0 h-auto text-sm mt-1">
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {incident.driver_id && (
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleViewDriver}>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Driver
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        {incident.driver_avatar && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={incident.driver_avatar} alt={incident.driver_name} />
                            <AvatarFallback>
                              {incident.driver_name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div>
                          <p className="font-medium">{incident.driver_name || 'Unknown'}</p>
                          <Button variant="link" className="p-0 h-auto text-sm">
                            View Profile
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Description */}
              {incident.description && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Description
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{incident.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* Insurance & Legal */}
              {(incident.police_report_number || incident.insurance_claim_number) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Insurance & Legal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {incident.police_report_number && (
                      <div>
                        <p className="text-sm text-muted-foreground">Police Report Number</p>
                        <p className="font-medium">{incident.police_report_number}</p>
                      </div>
                    )}
                    {incident.insurance_claim_number && (
                      <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground">Insurance Claim Number</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="font-medium">{incident.insurance_claim_number}</p>
                          {incident.insurance_claim_status && (
                            <Badge variant="outline">
                              {incident.insurance_claim_status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Evidence Tab */}
            <TabsContent value="evidence" className="space-y-4">
              {evidence && evidence.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {evidence.map((item) => (
                    <Card key={item.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        {item.type === 'photo' && item.thumbnail_url && (
                          <div className="aspect-video bg-muted relative">
                            <img
                              src={item.thumbnail_url}
                              alt={item.filename}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        )}
                        <div className="p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            {getEvidenceIcon(item.type)}
                            <span className="text-sm font-medium truncate">{item.filename}</span>
                          </div>
                          {item.description && (
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          )}
                          <div className="flex items-center justify-between pt-2 border-t">
                            <div className="text-xs text-muted-foreground">
                              {new Date(item.uploaded_date).toLocaleDateString()}
                            </div>
                            <Button variant="ghost" size="sm" className="h-6 px-2">
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">No evidence files attached</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Parties Tab */}
            <TabsContent value="parties" className="space-y-4">
              {involvedParties && involvedParties.length > 0 ? (
                <div className="space-y-3">
                  {involvedParties.map((party) => (
                    <Card key={party.id}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{party.name}</p>
                                <Badge variant="outline" className="capitalize">
                                  {party.type.replace('_', ' ')}
                                </Badge>
                              </div>
                              {party.role && (
                                <p className="text-sm text-muted-foreground">{party.role}</p>
                              )}
                            </div>
                          </div>

                          {(party.contact_phone || party.contact_email) && (
                            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                              {party.contact_phone && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                  <span>{party.contact_phone}</span>
                                </div>
                              )}
                              {party.contact_email && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                  <span className="truncate">{party.contact_email}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {party.injuries && (
                            <div className="pt-2 border-t">
                              <p className="text-sm text-muted-foreground">Injuries</p>
                              <p className="text-sm font-medium text-destructive">{party.injuries}</p>
                            </div>
                          )}

                          {party.statement && (
                            <div className="pt-2 border-t">
                              <p className="text-sm text-muted-foreground">Statement</p>
                              <p className="text-sm mt-1">{party.statement}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">No involved parties recorded</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="space-y-4">
              {timeline && timeline.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Activity Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {timeline.map((event, index) => (
                        <div key={event.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="rounded-full bg-primary/10 p-2">
                              {getStatusIcon(event.event_type)}
                            </div>
                            {index < timeline.length - 1 && (
                              <div className="w-px h-full bg-border mt-2" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">{event.description}</p>
                                {event.user_name && (
                                  <p className="text-sm text-muted-foreground">by {event.user_name}</p>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(event.timestamp).toLocaleString()}
                              </span>
                            </div>
                            {event.metadata && Object.keys(event.metadata).length > 0 && (
                              <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                                {Object.entries(event.metadata).map(([key, value]) => (
                                  <div key={key}>
                                    <span className="font-medium">{key}:</span> {String(value)}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">No timeline events recorded</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Related Tab */}
            <TabsContent value="related" className="space-y-4">
              {relatedRecords && relatedRecords.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Related Records
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {relatedRecords.map((record) => (
                        <div
                          key={record.id}
                          className="p-3 rounded border hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => handleViewRelatedRecord(record)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium capitalize">{record.type.replace('_', ' ')}</p>
                              <p className="text-sm text-muted-foreground">{record.title}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">
                                {new Date(record.date).toLocaleDateString()}
                              </p>
                              {record.status && (
                                <Badge variant="outline" className="mt-1">
                                  {record.status}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">No related records found</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            {incident.vehicle_id && (
              <Button onClick={handleViewVehicle} className="w-full">
                <Car className="h-4 w-4 mr-2" />
                View Vehicle
              </Button>
            )}
            {incident.driver_id && (
              <Button onClick={handleViewDriver} variant="outline" className="w-full">
                <User className="h-4 w-4 mr-2" />
                View Driver
              </Button>
            )}
          </div>
        </div>
      )}
    </DrilldownContent>
  )
}
