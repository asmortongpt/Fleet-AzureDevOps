/**
 * GarageBayDrilldown - Comprehensive garage bay drilldown with full work order details
 *
 * Shows detailed information about:
 * - What work is being done (detailed description)
 * - When it will be complete (estimated completion date/time)
 * - What asset/vehicle is being worked on (vehicle #, make/model, mileage)
 * - Who needs to be contacted when complete (technician name, phone, email - all clickable)
 * - Work order number and priority
 * - Parts required and their status
 * - Labor hours (logged vs estimated)
 * - Progress bar with percentage complete
 */

import {
  Wrench,
  Calendar,
  DollarSign,
  Clock,
  Package,
  Users,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Car,
  Gauge,
  FileText,
  TrendingUp,
} from 'lucide-react'
import { useState } from 'react'
import useSWR from 'swr'

import { DrilldownContent } from '@/components/DrilldownPanel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useDrilldown } from '@/contexts/DrilldownContext'

interface GarageBayDrilldownProps {
  bayId: string
  bayNumber?: string
}

interface Vehicle {
  id: string
  vehicle_number: string
  make: string
  model: string
  year: number
  vin?: string
  license_plate?: string
  odometer_reading?: number
  engine_hours?: number
}

interface Technician {
  id: string
  name: string
  email: string
  phone: string
  avatar?: string
  role: string
  certifications?: string[]
}

interface Part {
  id: string
  name: string
  part_number: string
  quantity: number
  quantity_in_stock: number
  unit_cost: number
  supplier: string
  supplier_contact: string
  supplier_phone: string
  supplier_email: string
  delivery_date?: string
  status: 'ordered' | 'in_stock' | 'delivered' | 'backordered'
}

interface LaborEntry {
  id: string
  technician_id: string
  technician_name: string
  technician_avatar?: string
  hours_logged: number
  hours_estimated: number
  rate: number
  date: string
  task_description: string
  status: 'in_progress' | 'completed' | 'pending'
}

interface WorkOrder {
  id: string
  wo_number: string
  title: string
  description: string
  type: 'preventive' | 'corrective' | 'inspection' | 'emergency'
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled'
  vehicle: Vehicle
  primary_technician: Technician
  parts: Part[]
  labor: LaborEntry[]
  created_date: string
  scheduled_start: string
  scheduled_end: string
  estimated_completion: string
  actual_start?: string
  actual_end?: string
  progress_percentage: number
  estimated_cost: number
  actual_cost: number
  notes: string[]
}

interface GarageBay {
  id: string
  bay_number: string
  bay_name: string
  status: 'occupied' | 'available' | 'maintenance' | 'reserved'
  work_orders: WorkOrder[]
  capacity: number
  location: string
  equipment: string[]
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function GarageBayDrilldown({ bayId, bayNumber }: GarageBayDrilldownProps) {
  const { push } = useDrilldown()
  const [activeTab, setActiveTab] = useState('overview')

  // Fetch garage bay data
  const { data: bayData, error, isLoading, mutate } = useSWR<{ data: GarageBay }>(
    `/api/garage-bays/${bayId}`,
    fetcher
  )

  const bay = bayData?.data
  const currentWorkOrder = bay?.work_orders?.[0] // Primary active work order

  const handleViewWorkOrder = (workOrder: WorkOrder) => {
    push({
      id: `work-order-${workOrder.id}`,
      type: 'work-order',
      label: `WO #${workOrder.wo_number}`,
      data: { workOrderId: workOrder.id },
    })
  }

  const handleViewVehicle = (vehicle: Vehicle) => {
    push({
      id: `vehicle-${vehicle.id}`,
      type: 'vehicle',
      label: `${vehicle.make} ${vehicle.model}`,
      data: { vehicleId: vehicle.id },
    })
  }

  const handleViewPart = (part: Part) => {
    push({
      id: `part-${part.id}`,
      type: 'part',
      label: part.name,
      data: { partId: part.id },
    })
  }

  const getStatusColor = (status: string): 'default' | 'destructive' | 'outline' | 'secondary' => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered':
      case 'in_stock':
        return 'default'
      case 'in_progress':
      case 'occupied':
        return 'default'
      case 'pending':
      case 'ordered':
      case 'reserved':
        return 'secondary'
      case 'cancelled':
      case 'backordered':
        return 'destructive'
      case 'on_hold':
        return 'outline'
      default:
        return 'default'
    }
  }

  const getPriorityColor = (priority: string): 'default' | 'destructive' | 'outline' | 'secondary' => {
    switch (priority.toLowerCase()) {
      case 'critical':
      case 'emergency':
        return 'destructive'
      case 'high':
        return 'default'
      case 'medium':
        return 'outline'
      case 'low':
        return 'secondary'
      default:
        return 'default'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-500" />
      case 'pending':
      case 'on_hold':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const formatDate = (date: string | undefined) => {
    if (!date) return 'N/A'
    const d = new Date(date)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const totalPartsCost = currentWorkOrder?.parts.reduce((sum, part) => sum + (part.quantity * part.unit_cost), 0) || 0
  const totalLaborCost = currentWorkOrder?.labor.reduce((sum, entry) => sum + (entry.hours_logged * entry.rate), 0) || 0
  const estimatedLaborCost = currentWorkOrder?.labor.reduce((sum, entry) => sum + (entry.hours_estimated * entry.rate), 0) || 0
  const totalCost = totalPartsCost + totalLaborCost
  const totalHoursLogged = currentWorkOrder?.labor.reduce((sum, entry) => sum + entry.hours_logged, 0) || 0
  const totalHoursEstimated = currentWorkOrder?.labor.reduce((sum, entry) => sum + entry.hours_estimated, 0) || 0

  return (
    <DrilldownContent loading={isLoading} error={error} onRetry={() => mutate()}>
      {bay && (
        <div className="space-y-6">
          {/* Bay Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-2xl font-bold">Garage Bay {bay.bay_number}</h3>
              <p className="text-sm text-muted-foreground">{bay.bay_name}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={getStatusColor(bay.status)} className="capitalize">
                  {bay.status}
                </Badge>
                <Badge variant="outline">
                  <MapPin className="h-3 w-3 mr-1" />
                  {bay.location}
                </Badge>
                <Badge variant="outline">
                  Capacity: {bay.work_orders?.length || 0}/{bay.capacity}
                </Badge>
              </div>
            </div>
            <Wrench className="h-12 w-12 text-muted-foreground" />
          </div>

          {currentWorkOrder ? (
            <>
              {/* Current Work Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* What is being done */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      Work Being Done
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-semibold text-lg mb-1">{currentWorkOrder.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {currentWorkOrder.description}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Badge variant={getPriorityColor(currentWorkOrder.priority)} className="capitalize">
                        {currentWorkOrder.priority}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {currentWorkOrder.type}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* When complete */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Completion Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Estimated Completion</p>
                        <p className="font-semibold text-primary">
                          {formatDate(currentWorkOrder.estimated_completion)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Progress</p>
                        <div className="flex items-center gap-2">
                          <Progress value={currentWorkOrder.progress_percentage} className="flex-1" />
                          <span className="text-sm font-medium">{currentWorkOrder.progress_percentage}%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Vehicle being worked on */}
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleViewVehicle(currentWorkOrder.vehicle)}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      Vehicle
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-semibold text-lg">
                      {currentWorkOrder.vehicle.year} {currentWorkOrder.vehicle.make} {currentWorkOrder.vehicle.model}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Unit #{currentWorkOrder.vehicle.vehicle_number}
                    </p>
                    {currentWorkOrder.vehicle.odometer_reading && (
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <Gauge className="h-3 w-3" />
                        <span>{currentWorkOrder.vehicle.odometer_reading.toLocaleString()} miles</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Primary Technician Contact Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Primary Technician - Contact When Complete
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={currentWorkOrder.primary_technician.avatar} alt={currentWorkOrder.primary_technician.name} />
                      <AvatarFallback className="text-lg">
                        {currentWorkOrder.primary_technician.name.split(' ').map((n) => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold">{currentWorkOrder.primary_technician.name}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{currentWorkOrder.primary_technician.role}</p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => window.location.href = `tel:${currentWorkOrder.primary_technician.phone}`}
                        >
                          <Phone className="h-4 w-4" />
                          {currentWorkOrder.primary_technician.phone}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => window.location.href = `mailto:${currentWorkOrder.primary_technician.email}`}
                        >
                          <Mail className="h-4 w-4" />
                          {currentWorkOrder.primary_technician.email}
                        </Button>
                      </div>
                      {currentWorkOrder.primary_technician.certifications && currentWorkOrder.primary_technician.certifications.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {currentWorkOrder.primary_technician.certifications.map((cert, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cost Summary */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Parts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${totalPartsCost.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {currentWorkOrder.parts.length} item{currentWorkOrder.parts.length !== 1 ? 's' : ''}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Labor
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${totalLaborCost.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {totalHoursLogged.toFixed(1)} / {totalHoursEstimated.toFixed(1)} hrs
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Actual Cost
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">${totalCost.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Current total
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Estimated
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${currentWorkOrder.estimated_cost.toFixed(2)}</div>
                    <p className={`text-xs mt-1 ${totalCost > currentWorkOrder.estimated_cost ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {totalCost > currentWorkOrder.estimated_cost ? 'Over budget' : 'On budget'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Tabbed Detailed View */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="parts">Parts ({currentWorkOrder.parts.length})</TabsTrigger>
                  <TabsTrigger value="labor">Labor ({currentWorkOrder.labor.length})</TabsTrigger>
                  <TabsTrigger value="bay-equipment">Bay Equipment</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Work Order #{currentWorkOrder.wo_number}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">{currentWorkOrder.title}</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {currentWorkOrder.description}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div>
                          <p className="text-sm text-muted-foreground">Work Order Status</p>
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusIcon(currentWorkOrder.status)}
                            <Badge variant={getStatusColor(currentWorkOrder.status)} className="capitalize">
                              {currentWorkOrder.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Priority Level</p>
                          <Badge variant={getPriorityColor(currentWorkOrder.priority)} className="mt-1 capitalize">
                            {currentWorkOrder.priority}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Scheduled Start</p>
                          <p className="font-medium mt-1">{formatDate(currentWorkOrder.scheduled_start)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Scheduled End</p>
                          <p className="font-medium mt-1">{formatDate(currentWorkOrder.scheduled_end)}</p>
                        </div>
                        {currentWorkOrder.actual_start && (
                          <div>
                            <p className="text-sm text-muted-foreground">Actual Start</p>
                            <p className="font-medium mt-1">{formatDate(currentWorkOrder.actual_start)}</p>
                          </div>
                        )}
                        {currentWorkOrder.actual_end && (
                          <div>
                            <p className="text-sm text-muted-foreground">Actual End</p>
                            <p className="font-medium mt-1">{formatDate(currentWorkOrder.actual_end)}</p>
                          </div>
                        )}
                      </div>

                      {currentWorkOrder.notes && currentWorkOrder.notes.length > 0 && (
                        <div className="pt-4 border-t">
                          <h5 className="font-semibold mb-2 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            Notes ({currentWorkOrder.notes.length})
                          </h5>
                          <ul className="space-y-2">
                            {currentWorkOrder.notes.map((note, idx) => (
                              <li key={idx} className="text-sm p-2 rounded bg-muted/50">
                                {note}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Button onClick={() => handleViewWorkOrder(currentWorkOrder)} className="w-full">
                    View Full Work Order Details
                  </Button>
                </TabsContent>

                {/* Parts Tab */}
                <TabsContent value="parts" className="space-y-4">
                  {currentWorkOrder.parts.map((part) => (
                    <Card key={part.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleViewPart(part)}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Package className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="font-semibold">{part.name}</p>
                                <p className="text-xs text-muted-foreground">Part #: {part.part_number}</p>
                              </div>
                            </div>
                            <Badge variant={getStatusColor(part.status)} className="capitalize">
                              {part.status}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-4 gap-4 pt-2 border-t text-sm">
                            <div>
                              <p className="text-xs text-muted-foreground">Qty Needed</p>
                              <p className="font-medium">{part.quantity}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">In Stock</p>
                              <p className={`font-medium ${part.quantity_in_stock >= part.quantity ? 'text-green-600' : 'text-destructive'}`}>
                                {part.quantity_in_stock}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Unit Cost</p>
                              <p className="font-medium">${part.unit_cost.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Total</p>
                              <p className="font-medium text-primary">${(part.quantity * part.unit_cost).toFixed(2)}</p>
                            </div>
                          </div>

                          <div className="pt-2 border-t">
                            <p className="text-xs text-muted-foreground mb-2">Supplier Contact</p>
                            <div className="flex flex-col gap-1">
                              <p className="font-medium text-sm">{part.supplier}</p>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs gap-1"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    window.location.href = `tel:${part.supplier_phone}`
                                  }}
                                >
                                  <Phone className="h-3 w-3" />
                                  {part.supplier_phone}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs gap-1"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    window.location.href = `mailto:${part.supplier_email}`
                                  }}
                                >
                                  <Mail className="h-3 w-3" />
                                  {part.supplier_email}
                                </Button>
                              </div>
                            </div>
                            {part.delivery_date && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Expected: {formatDate(part.delivery_date)}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Total Parts Cost</span>
                        <span className="text-2xl font-bold text-primary">${totalPartsCost.toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Labor Tab */}
                <TabsContent value="labor" className="space-y-4">
                  {currentWorkOrder.labor.map((entry) => (
                    <Card key={entry.id}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={entry.technician_avatar} alt={entry.technician_name} />
                                <AvatarFallback>
                                  {entry.technician_name.split(' ').map((n) => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold">{entry.technician_name}</p>
                                <p className="text-xs text-muted-foreground">{entry.task_description}</p>
                              </div>
                            </div>
                            <Badge variant={getStatusColor(entry.status)} className="capitalize">
                              {entry.status.replace('_', ' ')}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-4 gap-4 pt-2 border-t text-sm">
                            <div>
                              <p className="text-xs text-muted-foreground">Hours Logged</p>
                              <p className="font-medium text-primary">{entry.hours_logged.toFixed(1)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Hours Estimated</p>
                              <p className="font-medium">{entry.hours_estimated.toFixed(1)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Rate</p>
                              <p className="font-medium">${entry.rate.toFixed(2)}/hr</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Total</p>
                              <p className="font-medium text-primary">${(entry.hours_logged * entry.rate).toFixed(2)}</p>
                            </div>
                          </div>

                          <div className="pt-2 border-t">
                            <p className="text-xs text-muted-foreground">
                              Date: {formatDate(entry.date)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Total Hours (Logged / Estimated)</span>
                          <span className="font-semibold">
                            {totalHoursLogged.toFixed(1)} / {totalHoursEstimated.toFixed(1)} hrs
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Estimated Labor Cost</span>
                          <span className="font-semibold">${estimatedLaborCost.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="font-semibold">Actual Labor Cost</span>
                          <span className="text-2xl font-bold text-primary">${totalLaborCost.toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Bay Equipment Tab */}
                <TabsContent value="bay-equipment" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Wrench className="h-5 w-5" />
                        Available Equipment
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {bay.equipment && bay.equipment.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                          {bay.equipment.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-3 rounded border">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span className="text-sm font-medium">{item}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          No equipment information available
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Bay Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Bay Number</p>
                          <p className="font-medium">{bay.bay_number}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Location</p>
                          <p className="font-medium">{bay.location}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Capacity</p>
                          <p className="font-medium">{bay.capacity} work orders</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Current Load</p>
                          <p className="font-medium">{bay.work_orders.length} active</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Wrench className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Bay Available</h3>
                <p className="text-sm text-muted-foreground">
                  This garage bay is currently not in use
                </p>
                <Badge variant="outline" className="mt-4">
                  Status: {bay.status}
                </Badge>
              </CardContent>
            </Card>
          )}

          {/* All Work Orders in Bay */}
          {bay.work_orders && bay.work_orders.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>All Work Orders in Bay ({bay.work_orders.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {bay.work_orders.map((wo, idx) => (
                    <div
                      key={wo.id}
                      className={`p-3 rounded border cursor-pointer hover:bg-muted/50 transition-colors ${idx === 0 ? 'border-primary' : ''}`}
                      onClick={() => handleViewWorkOrder(wo)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">WO #{wo.wo_number}</p>
                          <p className="text-sm text-muted-foreground">{wo.title}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusColor(wo.status)} className="capitalize">
                            {wo.status.replace('_', ' ')}
                          </Badge>
                          {idx === 0 && <Badge variant="default">Active</Badge>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </DrilldownContent>
  )
}
