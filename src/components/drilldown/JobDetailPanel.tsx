/**
 * JobDetailPanel - Comprehensive job/dispatch detail view for Operations Hub
 * Shows complete job information with WHO, WHAT, WHEN, and HOW TO CONTACT
 */

import {
  Package,
  User,
  Truck,
  Phone,
  Mail,
  Clock,
  MapPin,
  Navigation,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Building2,
  FileText,
  TrendingUp,
  Route
} from 'lucide-react'
import useSWR from 'swr'

import { DrilldownContent } from '@/components/DrilldownPanel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { useDrilldown } from '@/contexts/DrilldownContext'

interface JobDetailPanelProps {
  jobId: string
}

interface JobData {
  id: string
  number: string
  title: string
  description?: string
  status: 'active' | 'pending' | 'completed' | 'delayed' | 'cancelled'
  priority: 'high' | 'medium' | 'low'

  // Vehicle assignment
  vehicleId?: string
  vehicleName?: string
  vehicleNumber?: string

  // Driver assignment
  driverId?: string
  driverName?: string
  driverPhone?: string
  driverEmail?: string

  // Customer information
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  customerAddress?: string

  // Location details
  origin?: string
  destination?: string
  currentLocation?: string

  // Timing
  scheduledStart?: string
  scheduledEnd?: string
  actualStart?: string
  actualEnd?: string
  estimatedCompletion?: string
  delayMinutes?: number

  // Progress
  completionPercent?: number
  stopsTotal?: number
  stopsCompleted?: number

  // Route information
  routeId?: string
  routeName?: string
  distance?: number
  estimatedDuration?: number

  // Additional details
  notes?: string
  specialInstructions?: string
  cargo?: string
  weight?: number
  hazmat?: boolean

  // History
  createdAt?: string
  createdBy?: string
  updatedAt?: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// Demo data for fallback
const demoJobData: Record<string, JobData> = {
  'job-001': {
    id: 'job-001',
    number: 'JOB-1001',
    title: 'Downtown Delivery Route',
    description: 'Multi-stop delivery route covering downtown Tallahassee area',
    status: 'active',
    priority: 'high',
    vehicleId: 'veh-demo-1001',
    vehicleName: 'Ford F-150 #1001',
    vehicleNumber: 'V-1001',
    driverId: 'drv-001',
    driverName: 'John Smith',
    driverPhone: '(850) 555-0101',
    driverEmail: 'john.smith@fleet.com',
    customerName: 'Acme Corporation',
    customerPhone: '(850) 555-0200',
    customerEmail: 'dispatch@acmecorp.com',
    customerAddress: '456 Oak Ave, Tallahassee, FL 32301',
    origin: '123 Main St, Tallahassee, FL 32301',
    destination: '456 Oak Ave, Tallahassee, FL 32301',
    currentLocation: '234 Commerce Blvd, Tallahassee, FL 32301',
    scheduledStart: '2026-01-03T08:00:00',
    scheduledEnd: '2026-01-03T16:00:00',
    actualStart: '2026-01-03T08:15:00',
    estimatedCompletion: '2026-01-03T15:45:00',
    completionPercent: 65,
    stopsTotal: 12,
    stopsCompleted: 8,
    routeId: 'route-001',
    routeName: 'Downtown Morning Circuit',
    distance: 45.5,
    estimatedDuration: 480,
    cargo: 'Office supplies and electronics',
    weight: 850,
    hazmat: false,
    specialInstructions: 'Deliver to loading dock B. Contact security upon arrival.',
    notes: 'Customer requested morning delivery window',
    createdAt: '2026-01-02T18:00:00',
    createdBy: 'Operations Manager',
    updatedAt: '2026-01-03T08:15:00'
  },
  'job-002': {
    id: 'job-002',
    number: 'JOB-1002',
    title: 'Airport Cargo Pickup',
    description: 'Urgent cargo pickup from Tallahassee Airport',
    status: 'delayed',
    priority: 'high',
    vehicleId: 'veh-demo-1002',
    vehicleName: 'Chevrolet Silverado #1002',
    vehicleNumber: 'V-1002',
    driverId: 'drv-002',
    driverName: 'Sarah Johnson',
    driverPhone: '(850) 555-0102',
    driverEmail: 'sarah.johnson@fleet.com',
    customerName: 'FastShip Logistics',
    customerPhone: '(850) 555-0201',
    customerEmail: 'ops@fastship.com',
    customerAddress: 'Tallahassee Airport, Cargo Terminal',
    origin: 'Tallahassee Airport',
    destination: 'Distribution Center, 789 Industrial Pkwy',
    currentLocation: 'I-10 Exit 203 (delayed due to traffic)',
    scheduledStart: '2026-01-03T10:00:00',
    scheduledEnd: '2026-01-03T12:00:00',
    actualStart: '2026-01-03T10:25:00',
    estimatedCompletion: '2026-01-03T12:30:00',
    delayMinutes: 25,
    completionPercent: 40,
    stopsTotal: 2,
    stopsCompleted: 1,
    distance: 28.0,
    estimatedDuration: 120,
    cargo: 'Time-sensitive medical supplies',
    weight: 320,
    hazmat: false,
    specialInstructions: 'URGENT: Temperature-controlled cargo. Do not leave unattended.',
    notes: 'Traffic incident on I-4 causing delay',
    createdAt: '2026-01-03T09:00:00',
    createdBy: 'Dispatch Supervisor',
    updatedAt: '2026-01-03T10:45:00'
  }
}

export function JobDetailPanel({ jobId }: JobDetailPanelProps) {
  const { push } = useDrilldown()

  const { data: job, error, isLoading, mutate } = useSWR<JobData>(
    `/api/jobs/${jobId}`,
    fetcher,
    {
      fallbackData: demoJobData[jobId],
      shouldRetryOnError: false
    }
  )

  const handleViewDriver = () => {
    if (job?.driverId) {
      push({
        id: `driver-${job.driverId}`,
        type: 'driver',
        label: job.driverName || `Driver ${job.driverId}`,
        data: { driverId: job.driverId }
      })
    }
  }

  const handleViewVehicle = () => {
    if (job?.vehicleId) {
      push({
        id: `vehicle-${job.vehicleId}`,
        type: 'vehicle',
        label: job.vehicleName || `Vehicle ${job.vehicleId}`,
        data: { vehicleId: job.vehicleId }
      })
    }
  }

  const handleViewRoute = () => {
    if (job?.routeId) {
      push({
        id: `route-${job.routeId}`,
        type: 'route',
        label: job.routeName || `Route ${job.routeId}`,
        data: { routeId: job.routeId }
      })
    }
  }

  const handleCallDriver = () => {
    if (job?.driverPhone) {
      window.location.href = `tel:${job.driverPhone}`
    }
  }

  const handleEmailDriver = () => {
    if (job?.driverEmail) {
      window.location.href = `mailto:${job.driverEmail}`
    }
  }

  const handleCallCustomer = () => {
    if (job?.customerPhone) {
      window.location.href = `tel:${job.customerPhone}`
    }
  }

  const handleEmailCustomer = () => {
    if (job?.customerEmail) {
      window.location.href = `mailto:${job.customerEmail}`
    }
  }

  const getStatusColor = (status: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
    switch (status) {
      case 'active': return 'default'
      case 'completed': return 'secondary'
      case 'delayed': return 'destructive'
      case 'pending': return 'outline'
      default: return 'outline'
    }
  }

  const getPriorityColor = (priority: string): 'destructive' | 'default' | 'secondary' => {
    switch (priority) {
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'secondary'
    }
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <DrilldownContent loading={isLoading} error={error} onRetry={() => mutate()}>
      {job && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-blue-500" />
                <div>
                  <h3 className="text-2xl font-bold">{job.title}</h3>
                  <p className="text-sm text-muted-foreground">Job #{job.number}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getStatusColor(job.status)}>
                  {job.status}
                </Badge>
                <Badge variant={getPriorityColor(job.priority)}>
                  {job.priority} priority
                </Badge>
                {job.hazmat && (
                  <Badge variant="destructive">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    HAZMAT
                  </Badge>
                )}
              </div>
            </div>
            {job.status === 'active' && (
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">{job.completionPercent}%</div>
                <div className="text-sm text-muted-foreground">Complete</div>
              </div>
            )}
          </div>

          {job.description && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">{job.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Progress */}
          {job.status === 'active' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Overall Completion</span>
                    <span className="text-sm text-muted-foreground">{job.completionPercent}%</span>
                  </div>
                  <Progress value={job.completionPercent} className="h-3" />
                </div>

                {job.stopsTotal && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Stops Completed</p>
                      <p className="text-xl font-bold">{job.stopsCompleted} / {job.stopsTotal}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Current Location</p>
                      <p className="text-sm font-medium">{job.currentLocation || 'Unknown'}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* WHO: Driver Assignment */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                WHO: Assigned Driver
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {job.driverId ? (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-lg">{job.driverName}</p>
                        <p className="text-sm text-muted-foreground">Driver ID: {job.driverId}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={handleViewDriver}>
                        View Profile
                      </Button>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`tel:${job.driverPhone}`}
                          className="text-sm text-blue-600 hover:underline font-medium"
                          onClick={(e) => {
                            e.preventDefault()
                            handleCallDriver()
                          }}
                        >
                          {job.driverPhone || 'N/A'}
                        </a>
                        {job.driverPhone && (
                          <Button size="sm" variant="ghost" onClick={handleCallDriver}>
                            Call
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`mailto:${job.driverEmail}`}
                          className="text-sm text-blue-600 hover:underline"
                          onClick={(e) => {
                            e.preventDefault()
                            handleEmailDriver()
                          }}
                        >
                          {job.driverEmail || 'N/A'}
                        </a>
                        {job.driverEmail && (
                          <Button size="sm" variant="ghost" onClick={handleEmailDriver}>
                            Email
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No driver assigned</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* WHAT: Vehicle Assignment */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                WHAT: Assigned Vehicle
              </CardTitle>
            </CardHeader>
            <CardContent>
              {job.vehicleId ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-lg">{job.vehicleName}</p>
                    <p className="text-sm text-muted-foreground">Vehicle #{job.vehicleNumber}</p>
                    {job.cargo && (
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground">Cargo</p>
                        <p className="text-sm font-medium">{job.cargo}</p>
                        {job.weight && (
                          <p className="text-xs text-muted-foreground mt-1">{job.weight} lbs</p>
                        )}
                      </div>
                    )}
                  </div>
                  <Button size="sm" variant="outline" onClick={handleViewVehicle}>
                    View Details
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No vehicle assigned</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* WHEN: Schedule & Timing */}
          <Card className="border-l-4 border-l-amber-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                WHEN: Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Scheduled Start</p>
                  <p className="font-medium">{formatDateTime(job.scheduledStart)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Scheduled End</p>
                  <p className="font-medium">{formatDateTime(job.scheduledEnd)}</p>
                </div>
                {job.actualStart && (
                  <div>
                    <p className="text-sm text-muted-foreground">Actual Start</p>
                    <p className="font-medium">{formatDateTime(job.actualStart)}</p>
                  </div>
                )}
                {job.estimatedCompletion && job.status === 'active' && (
                  <div>
                    <p className="text-sm text-muted-foreground">Est. Completion</p>
                    <p className="font-medium">{formatDateTime(job.estimatedCompletion)}</p>
                  </div>
                )}
                {job.actualEnd && (
                  <div>
                    <p className="text-sm text-muted-foreground">Actual End</p>
                    <p className="font-medium">{formatDateTime(job.actualEnd)}</p>
                  </div>
                )}
                {job.delayMinutes && job.delayMinutes > 0 && (
                  <div className="col-span-2">
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Delayed by {job.delayMinutes} minutes
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* WHERE: Location & Route */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                WHERE: Locations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Origin</p>
                <p className="font-medium">{job.origin || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Destination</p>
                <p className="font-medium">{job.destination || 'N/A'}</p>
              </div>
              {job.currentLocation && job.status === 'active' && (
                <div>
                  <p className="text-sm text-muted-foreground">Current Location</p>
                  <p className="font-medium text-blue-600">{job.currentLocation}</p>
                </div>
              )}
              {job.routeId && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Route</p>
                      <p className="font-medium">{job.routeName || `Route ${job.routeId}`}</p>
                      {job.distance && (
                        <p className="text-xs text-muted-foreground">{job.distance} miles</p>
                      )}
                    </div>
                    <Button size="sm" variant="outline" onClick={handleViewRoute}>
                      <Navigation className="h-4 w-4 mr-2" />
                      View Route
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* HOW TO CONTACT: Customer Information */}
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                HOW TO CONTACT: Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {job.customerName ? (
                <>
                  <div>
                    <p className="font-semibold text-lg">{job.customerName}</p>
                    {job.customerAddress && (
                      <p className="text-sm text-muted-foreground">{job.customerAddress}</p>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`tel:${job.customerPhone}`}
                        className="text-sm text-blue-600 hover:underline font-medium"
                        onClick={(e) => {
                          e.preventDefault()
                          handleCallCustomer()
                        }}
                      >
                        {job.customerPhone || 'N/A'}
                      </a>
                      {job.customerPhone && (
                        <Button size="sm" variant="ghost" onClick={handleCallCustomer}>
                          Call
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`mailto:${job.customerEmail}`}
                        className="text-sm text-blue-600 hover:underline"
                        onClick={(e) => {
                          e.preventDefault()
                          handleEmailCustomer()
                        }}
                      >
                        {job.customerEmail || 'N/A'}
                      </a>
                      {job.customerEmail && (
                        <Button size="sm" variant="ghost" onClick={handleEmailCustomer}>
                          Email
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No customer information available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Special Instructions */}
          {job.specialInstructions && (
            <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="h-5 w-5" />
                  Special Instructions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium">{job.specialInstructions}</p>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {job.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{job.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 text-xs">
                {job.createdAt && (
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p>{formatDateTime(job.createdAt)}</p>
                    {job.createdBy && <p className="text-muted-foreground">by {job.createdBy}</p>}
                  </div>
                )}
                {job.updatedAt && (
                  <div>
                    <p className="text-muted-foreground">Last Updated</p>
                    <p>{formatDateTime(job.updatedAt)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DrilldownContent>
  )
}
