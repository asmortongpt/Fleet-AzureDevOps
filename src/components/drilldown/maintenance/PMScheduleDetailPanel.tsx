/**
 * PM Schedule Detail Panel - Preventive Maintenance schedule drilldown
 * Extracted from MaintenanceHubDrilldowns.tsx for better modularity
 */

import {
  Wrench,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Car,
  DollarSign,
  History,
  Building,
} from 'lucide-react'
import { useState } from 'react'
import useSWR from 'swr'

import type { PreventiveMaintenanceSchedule, ServiceHistoryRecord } from './types'

import { DrilldownContent } from '@/components/DrilldownPanel'
import { DrilldownCard, DrilldownCardGrid } from '@/components/drilldown/DrilldownCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDrilldown } from '@/contexts/DrilldownContext'

const authFetch = (input: RequestInfo | URL, init: RequestInit = {}) =>
  fetch(input, { credentials: 'include', ...init })



const fetcher = (url: string) => authFetch(url).then((r) => r.json())

export interface PMScheduleDetailPanelProps {
  scheduleId: string
}

export function PMScheduleDetailPanel({ scheduleId }: PMScheduleDetailPanelProps) {
  const { push } = useDrilldown()
  const [activeTab, setActiveTab] = useState('overview')

  const { data: schedule, error, isLoading } = useSWR<PreventiveMaintenanceSchedule>(
    `/api/maintenance/drilldowns/pm-schedules/${scheduleId}`,
    fetcher
  )

  const { data: serviceHistory } = useSWR<ServiceHistoryRecord[]>(
    schedule?.vehicleId ? `/api/maintenance/drilldowns/vehicles/${schedule.vehicleId}/service-history?serviceType=${schedule.serviceType}` : null,
    fetcher
  )

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'outline'
      case 'upcoming':
        return 'secondary'
      case 'due-soon':
        return 'default'
      case 'overdue':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  return (
    <DrilldownContent loading={isLoading} error={error}>
      {schedule && (
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h3 className="text-sm font-bold">{schedule.serviceType}</h3>
              <p className="text-sm text-muted-foreground">
                {schedule.vehicleNumber} • {schedule.vehicleMake} {schedule.vehicleModel} ({schedule.vehicleYear})
              </p>
              <div className="flex items-center gap-2">
                <Badge variant={getStatusVariant(schedule.status)}>
                  {schedule.status}
                </Badge>
                <Badge variant="outline">{schedule.frequency}</Badge>
              </div>
            </div>
            <Calendar className="w-12 h-9 text-muted-foreground" />
          </div>

          {/* Quick Stats */}
          <DrilldownCardGrid columns={3} gap="sm">
            <DrilldownCard
              title="Days Until Due"
              value={schedule.daysUntilDue > 0 ? schedule.daysUntilDue : 'Overdue'}
              icon={<Clock className="w-3 h-3" />}
              color={schedule.daysUntilDue < 0 ? 'danger' : schedule.daysUntilDue <= 7 ? 'warning' : 'primary'}
              variant="compact"
            />
            <DrilldownCard
              title="Current Mileage"
              value={schedule.currentMileage.toLocaleString()}
              icon={<Car className="w-3 h-3" />}
              color="primary"
              variant="compact"
            />
            <DrilldownCard
              title="Est. Cost"
              value={`$${schedule.estimatedCost.toFixed(0)}`}
              icon={<DollarSign className="w-3 h-3" />}
              color="success"
              variant="compact"
            />
          </DrilldownCardGrid>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full h-auto grid-cols-2 md:grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="provider">Provider</TabsTrigger>
              <TabsTrigger value="vehicle">Vehicle</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Schedule Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Service Type</p>
                      <p className="font-medium">{schedule.serviceType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Frequency</p>
                      <p className="font-medium">{schedule.frequency}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Next Due Date</p>
                      <p className="font-medium">{new Date(schedule.nextDueDate).toLocaleDateString()}</p>
                    </div>
                    {schedule.nextDueMileage && (
                      <div>
                        <p className="text-sm text-muted-foreground">Next Due Mileage</p>
                        <p className="font-medium">{schedule.nextDueMileage.toLocaleString()} mi</p>
                      </div>
                    )}
                  </div>

                  {schedule.lastServiceDate && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground mb-2">Last Service</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Date</p>
                          <p className="font-medium">{new Date(schedule.lastServiceDate).toLocaleDateString()}</p>
                        </div>
                        {schedule.lastServiceMileage && (
                          <div>
                            <p className="text-xs text-muted-foreground">Mileage</p>
                            <p className="font-medium">{schedule.lastServiceMileage.toLocaleString()} mi</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {schedule.serviceDescription && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Description</p>
                      <p className="text-sm">{schedule.serviceDescription}</p>
                    </div>
                  )}

                  {schedule.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm">{schedule.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {schedule.assignedTechnician && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Assigned Technician
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">{schedule.assignedTechnician}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Service History Tab */}
            <TabsContent value="history" className="space-y-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Service History ({schedule.serviceType})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {serviceHistory && serviceHistory.length > 0 ? (
                    <div className="space-y-3">
                      {serviceHistory.slice(0, 5).map((record) => (
                        <div
                          key={record.id}
                          className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                          onClick={() =>
                            push({
                              id: `service-record-${record.id}`,
                              type: 'service-record-detail',
                              label: `WO #${record.workOrderNumber}`,
                              data: { serviceRecordId: record.id },
                            })
                          }
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-sm font-medium">
                                  {record.workOrderNumber}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {record.status}
                                </Badge>
                              </div>
                              <p className="text-sm">{record.description}</p>
                              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(record.serviceDate).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Car className="w-3 h-3" />
                                  {record.mileage.toLocaleString()} mi
                                </span>
                                <span className="flex items-center gap-1">
                                  <DollarSign className="w-3 h-3" />
                                  ${record.totalCost.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {serviceHistory.length > 5 && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() =>
                            push({
                              id: `vehicle-service-history-${schedule.vehicleId}`,
                              type: 'vehicle-service-history',
                              label: `${schedule.vehicleNumber} Service History`,
                              data: { vehicleId: schedule.vehicleId, serviceType: schedule.serviceType },
                            })
                          }
                        >
                          View All {serviceHistory.length} Records
                        </Button>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      No service history available
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Service Provider Tab */}
            <TabsContent value="provider" className="space-y-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Service Provider
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="font-medium text-sm">{schedule.serviceProvider}</p>
                    <p className="text-sm text-muted-foreground">{schedule.serviceProviderContact.address}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{schedule.serviceProviderContact.name}</p>
                        <p className="text-xs text-muted-foreground">Primary Contact</p>
                      </div>
                    </div>

                    <a
                      href={`tel:${schedule.serviceProviderContact.phone}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                    >
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{schedule.serviceProviderContact.phone}</p>
                        <p className="text-xs text-muted-foreground">Click to call</p>
                      </div>
                    </a>

                    <a
                      href={`mailto:${schedule.serviceProviderContact.email}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                    >
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{schedule.serviceProviderContact.email}</p>
                        <p className="text-xs text-muted-foreground">Click to email</p>
                      </div>
                    </a>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      push({
                        id: `vendor-${schedule.serviceProvider}`,
                        type: 'service-vendor-detail',
                        label: schedule.serviceProvider,
                        data: { vendorName: schedule.serviceProvider },
                      })
                    }
                  >
                    View Provider Details
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Vehicle Tab */}
            <TabsContent value="vehicle" className="space-y-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Car className="w-4 h-4" />
                    Vehicle Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Vehicle Number</p>
                      <p className="font-medium">{schedule.vehicleNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Current Mileage</p>
                      <p className="font-medium">{schedule.currentMileage.toLocaleString()} mi</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Make/Model</p>
                      <p className="font-medium">
                        {schedule.vehicleMake} {schedule.vehicleModel}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Year</p>
                      <p className="font-medium">{schedule.vehicleYear}</p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      push({
                        id: `vehicle-${schedule.vehicleId}`,
                        type: 'vehicle-detail',
                        label: schedule.vehicleNumber,
                        data: { vehicleId: schedule.vehicleId },
                      })
                    }
                  >
                    View Full Vehicle Details
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              className="flex-1"
              onClick={() =>
                push({
                  id: `schedule-work-order-${scheduleId}`,
                  type: 'create-work-order',
                  label: 'Schedule Service',
                  data: { scheduleId, schedule },
                })
              }
            >
              <Wrench className="w-4 h-4 mr-2" />
              Schedule Service
            </Button>
          </div>
        </div>
      )}
    </DrilldownContent>
  )
}
