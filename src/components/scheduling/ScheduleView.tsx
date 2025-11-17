/**
 * Schedule View Component
 * Timeline view of schedules with filtering and quick actions
 */

import { useState, useMemo } from 'react'
import { format, parseISO, startOfDay, endOfDay, isWithinInterval, isSameDay } from 'date-fns'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import SearchIcon from 'lucide-react/dist/esm/icons/search'
import FilterIcon from 'lucide-react/dist/esm/icons/filter'
import MoreVerticalIcon from 'lucide-react/dist/esm/icons/more-vertical'
import CalendarIcon from 'lucide-react/dist/esm/icons/calendar'
import TruckIcon from 'lucide-react/dist/esm/icons/truck'
import WrenchIcon from 'lucide-react/dist/esm/icons/wrench'
import CheckCircleIcon from 'lucide-react/dist/esm/icons/check-circle'
import XCircleIcon from 'lucide-react/dist/esm/icons/x-circle'
import ClockIcon from 'lucide-react/dist/esm/icons/clock'
import UserIcon from 'lucide-react/dist/esm/icons/user'
import AlertCircleIcon from 'lucide-react/dist/esm/icons/alert-circle'
import { cn } from '@/lib/utils'
import { VehicleReservation, MaintenanceAppointment } from '@/types/scheduling'
import { Vehicle, Driver, Technician } from '@/lib/types'

interface ScheduleViewProps {
  reservations?: VehicleReservation[]
  appointments?: MaintenanceAppointment[]
  vehicles?: Vehicle[]
  drivers?: Driver[]
  technicians?: Technician[]
  isLoading?: boolean
  error?: Error | null
  onApproveReservation?: (id: string) => Promise<void>
  onRejectReservation?: (id: string) => Promise<void>
  onCancelReservation?: (id: string) => Promise<void>
  onCancelAppointment?: (id: string) => Promise<void>
  onReschedule?: (type: 'reservation' | 'maintenance', id: string) => void
  onViewDetails?: (type: 'reservation' | 'maintenance', id: string) => void
  className?: string
}

type ViewType = 'all' | 'reservations' | 'maintenance'
type FilterStatus = 'all' | 'pending' | 'confirmed' | 'active' | 'scheduled' | 'in_progress'

const STATUS_COLORS = {
  // Reservations
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
  active: 'bg-green-100 text-green-800 border-green-300',
  completed: 'bg-gray-100 text-gray-600 border-gray-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300',
  // Maintenance
  scheduled: 'bg-purple-100 text-purple-800 border-purple-300',
  in_progress: 'bg-orange-100 text-orange-800 border-orange-300',
}

const PRIORITY_COLORS = {
  low: 'bg-blue-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
}

export function ScheduleView({
  reservations = [],
  appointments = [],
  vehicles = [],
  drivers = [],
  technicians = [],
  isLoading = false,
  error = null,
  onApproveReservation,
  onRejectReservation,
  onCancelReservation,
  onCancelAppointment,
  onReschedule,
  onViewDetails,
  className,
}: ScheduleViewProps) {
  const [viewType, setViewType] = useState<ViewType>('all')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterVehicle, setFilterVehicle] = useState<string>('all')
  const [filterDriver, setFilterDriver] = useState<string>('all')
  const [filterTechnician, setFilterTechnician] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'all'>('week')

  // Combine and filter data
  const filteredData = useMemo(() => {
    let data: Array<{ type: 'reservation' | 'maintenance'; item: VehicleReservation | MaintenanceAppointment }> = []

    // Add reservations
    if (viewType === 'all' || viewType === 'reservations') {
      data = [
        ...data,
        ...reservations.map((r) => ({ type: 'reservation' as const, item: r })),
      ]
    }

    // Add appointments
    if (viewType === 'all' || viewType === 'maintenance') {
      data = [
        ...data,
        ...appointments.map((a) => ({ type: 'maintenance' as const, item: a })),
      ]
    }

    // Apply filters
    return data.filter(({ type, item }) => {
      // Status filter
      if (filterStatus !== 'all' && item.status !== filterStatus) {
        return false
      }

      // Vehicle filter
      if (filterVehicle !== 'all') {
        const vehicleId = type === 'reservation'
          ? (item as VehicleReservation).vehicle_id
          : (item as MaintenanceAppointment).vehicle_id
        if (vehicleId !== filterVehicle) return false
      }

      // Driver filter (reservations only)
      if (filterDriver !== 'all' && type === 'reservation') {
        if ((item as VehicleReservation).driver_id !== filterDriver) return false
      }

      // Technician filter (maintenance only)
      if (filterTechnician !== 'all' && type === 'maintenance') {
        if ((item as MaintenanceAppointment).assigned_technician_id !== filterTechnician) return false
      }

      // Date filter
      const startTime = type === 'reservation'
        ? new Date((item as VehicleReservation).start_time)
        : new Date((item as MaintenanceAppointment).scheduled_start)

      const now = new Date()
      if (dateFilter === 'today') {
        if (!isSameDay(startTime, now)) return false
      } else if (dateFilter === 'week') {
        const weekFromNow = new Date(now)
        weekFromNow.setDate(weekFromNow.getDate() + 7)
        if (!isWithinInterval(startTime, { start: now, end: weekFromNow })) return false
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const searchableText = [
          type === 'reservation' ? (item as VehicleReservation).purpose : (item as MaintenanceAppointment).appointment_type,
          item.make,
          item.model,
          item.license_plate,
          item.notes,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        if (!searchableText.includes(query)) return false
      }

      return true
    })
  }, [
    viewType,
    filterStatus,
    filterVehicle,
    filterDriver,
    filterTechnician,
    searchQuery,
    dateFilter,
    reservations,
    appointments,
  ])

  // Group by date
  const groupedByDate = useMemo(() => {
    const groups: Record<string, typeof filteredData> = {}

    filteredData.forEach((entry) => {
      const date = entry.type === 'reservation'
        ? format(new Date((entry.item as VehicleReservation).start_time), 'yyyy-MM-dd')
        : format(new Date((entry.item as MaintenanceAppointment).scheduled_start), 'yyyy-MM-dd')

      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(entry)
    })

    // Sort by date
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [filteredData])

  const handleQuickAction = async (
    action: 'approve' | 'reject' | 'cancel' | 'reschedule' | 'view',
    type: 'reservation' | 'maintenance',
    id: string
  ) => {
    try {
      if (action === 'approve' && type === 'reservation' && onApproveReservation) {
        await onApproveReservation(id)
      } else if (action === 'reject' && type === 'reservation' && onRejectReservation) {
        await onRejectReservation(id)
      } else if (action === 'cancel' && type === 'reservation' && onCancelReservation) {
        await onCancelReservation(id)
      } else if (action === 'cancel' && type === 'maintenance' && onCancelAppointment) {
        await onCancelAppointment(id)
      } else if (action === 'reschedule' && onReschedule) {
        onReschedule(type, id)
      } else if (action === 'view' && onViewDetails) {
        onViewDetails(type, id)
      }
    } catch (error) {
      console.error('Failed to perform action:', error)
    }
  }

  const renderReservationCard = (reservation: VehicleReservation) => (
    <Card key={reservation.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <TruckIcon className="h-4 w-4 text-blue-600" />
              <h4 className="font-semibold">
                {reservation.make} {reservation.model}
              </h4>
              <Badge variant="outline" className={cn('ml-2', STATUS_COLORS[reservation.status as keyof typeof STATUS_COLORS])}>
                {reservation.status}
              </Badge>
              {reservation.approval_status === 'pending' && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  Awaiting Approval
                </Badge>
              )}
            </div>

            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-3 w-3" />
                <span>
                  {format(new Date(reservation.start_time), 'MMM d, h:mm a')} -{' '}
                  {format(new Date(reservation.end_time), 'h:mm a')}
                </span>
              </div>
              {reservation.license_plate && (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                    {reservation.license_plate}
                  </span>
                </div>
              )}
              {reservation.reserved_by_name && (
                <div className="flex items-center gap-2">
                  <UserIcon className="h-3 w-3" />
                  <span>Reserved by: {reservation.reserved_by_name}</span>
                </div>
              )}
              {reservation.driver_name && (
                <div className="flex items-center gap-2">
                  <UserIcon className="h-3 w-3" />
                  <span>Driver: {reservation.driver_name}</span>
                </div>
              )}
              {reservation.purpose && (
                <div className="text-sm mt-1">
                  <strong>Purpose:</strong> {reservation.purpose}
                </div>
              )}
              {reservation.pickup_location && (
                <div className="text-xs text-muted-foreground">
                  From: {reservation.pickup_location}
                  {reservation.dropoff_location && ` → ${reservation.dropoff_location}`}
                </div>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVerticalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleQuickAction('view', 'reservation', reservation.id)}>
                View Details
              </DropdownMenuItem>
              {reservation.approval_status === 'pending' && onApproveReservation && (
                <>
                  <DropdownMenuItem
                    onClick={() => handleQuickAction('approve', 'reservation', reservation.id)}
                    className="text-green-600"
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Approve
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleQuickAction('reject', 'reservation', reservation.id)}
                    className="text-red-600"
                  >
                    <XCircleIcon className="h-4 w-4 mr-2" />
                    Reject
                  </DropdownMenuItem>
                </>
              )}
              {reservation.status !== 'cancelled' && reservation.status !== 'completed' && (
                <>
                  <DropdownMenuItem onClick={() => handleQuickAction('reschedule', 'reservation', reservation.id)}>
                    <ClockIcon className="h-4 w-4 mr-2" />
                    Reschedule
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleQuickAction('cancel', 'reservation', reservation.id)}
                    className="text-red-600"
                  >
                    <XCircleIcon className="h-4 w-4 mr-2" />
                    Cancel
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )

  const renderMaintenanceCard = (appointment: MaintenanceAppointment) => (
    <Card key={appointment.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <WrenchIcon className="h-4 w-4 text-purple-600" />
              <h4 className="font-semibold">{appointment.appointment_type || 'Maintenance'}</h4>
              <Badge variant="outline" className={cn('ml-2', STATUS_COLORS[appointment.status as keyof typeof STATUS_COLORS])}>
                {appointment.status}
              </Badge>
              {appointment.priority && (
                <div className="flex items-center gap-1">
                  <div className={cn('w-2 h-2 rounded-full', PRIORITY_COLORS[appointment.priority])} />
                  <span className="text-xs capitalize">{appointment.priority}</span>
                </div>
              )}
            </div>

            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-3 w-3" />
                <span>
                  {format(new Date(appointment.scheduled_start), 'MMM d, h:mm a')} -{' '}
                  {format(new Date(appointment.scheduled_end), 'h:mm a')}
                </span>
              </div>
              {appointment.vehicle_id && (
                <div className="flex items-center gap-2">
                  <TruckIcon className="h-3 w-3" />
                  <span>
                    {appointment.make} {appointment.model}
                    {appointment.license_plate && (
                      <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded ml-2">
                        {appointment.license_plate}
                      </span>
                    )}
                  </span>
                </div>
              )}
              {appointment.bay_name && (
                <div className="text-xs">
                  <strong>Bay:</strong> {appointment.bay_name}
                  {appointment.bay_number && ` (${appointment.bay_number})`}
                </div>
              )}
              {appointment.technician_name && (
                <div className="flex items-center gap-2">
                  <UserIcon className="h-3 w-3" />
                  <span>Technician: {appointment.technician_name}</span>
                </div>
              )}
              {appointment.work_order_number && (
                <div className="text-xs">
                  <strong>WO:</strong> #{appointment.work_order_number}
                </div>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVerticalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleQuickAction('view', 'maintenance', appointment.id)}>
                View Details
              </DropdownMenuItem>
              {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                <>
                  <DropdownMenuItem onClick={() => handleQuickAction('reschedule', 'maintenance', appointment.id)}>
                    <ClockIcon className="h-4 w-4 mr-2" />
                    Reschedule
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleQuickAction('cancel', 'maintenance', appointment.id)}
                    className="text-red-600"
                  >
                    <XCircleIcon className="h-4 w-4 mr-2" />
                    Cancel
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircleIcon className="h-4 w-4" />
        <AlertDescription>
          Failed to load schedule: {error.message}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Schedule Overview</CardTitle>
            <CardDescription>
              {filteredData.length} item{filteredData.length !== 1 ? 's' : ''} found
            </CardDescription>
          </div>
          <Tabs value={viewType} onValueChange={(v) => setViewType(v as ViewType)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="reservations">Reservations</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <Select value={dateFilter} onValueChange={(v: any) => setDateFilter(v)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterVehicle} onValueChange={setFilterVehicle}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Vehicle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vehicles</SelectItem>
              {vehicles.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.make} {v.model} ({v.licensePlate})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {viewType !== 'maintenance' && (
            <Select value={filterDriver} onValueChange={setFilterDriver}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Driver" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Drivers</SelectItem>
                {drivers.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {viewType !== 'reservations' && (
            <Select value={filterTechnician} onValueChange={setFilterTechnician}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Technician" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Technicians</SelectItem>
                {technicians.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No schedules found</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters or create a new reservation/appointment
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-6">
              {groupedByDate.map(([date, items]) => (
                <div key={date}>
                  <h3 className="font-semibold text-lg mb-3 sticky top-0 bg-background py-2 z-10">
                    {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                  </h3>
                  <div className="space-y-3">
                    {items.map(({ type, item }) =>
                      type === 'reservation'
                        ? renderReservationCard(item as VehicleReservation)
                        : renderMaintenanceCard(item as MaintenanceAppointment)
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
