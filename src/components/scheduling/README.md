# Scheduling Module Components

Production-ready React components for Fleet management scheduling with comprehensive features including vehicle reservations, maintenance appointments, and timeline views.

## Components

### 1. SchedulingCalendar

Interactive calendar component with day, week, and month views for displaying vehicle reservations and maintenance appointments.

**Features:**
- Day, week, and month view modes
- Color-coded events by type and status
- Click on time slots to create new appointments
- Event click handlers for details
- Conflict visualization
- Responsive design
- Accessibility support

**Props:**
```typescript
interface SchedulingCalendarProps {
  reservations?: VehicleReservation[]
  appointments?: MaintenanceAppointment[]
  isLoading?: boolean
  error?: Error | null
  onEventClick?: (event: ScheduleEvent) => void
  onTimeSlotClick?: (date: Date) => void
  onCreateReservation?: (date: Date) => void
  onCreateMaintenance?: (date: Date) => void
  defaultView?: CalendarView
  className?: string
}
```

**Usage:**
```tsx
import { SchedulingCalendar } from '@/components/scheduling'

function MyPage() {
  const { data: reservations, isLoading } = useReservations()
  const { data: appointments } = useMaintenanceAppointments()

  return (
    <SchedulingCalendar
      reservations={reservations}
      appointments={appointments}
      isLoading={isLoading}
      onEventClick={(event) => {
        console.log('Event clicked:', event)
      }}
      onCreateReservation={(date) => {
        // Open reservation modal
      }}
      onCreateMaintenance={(date) => {
        // Open maintenance modal
      }}
      defaultView="week"
    />
  )
}
```

### 2. VehicleReservationModal

Form modal for creating and editing vehicle reservations with real-time availability checking.

**Features:**
- React Hook Form with Zod validation
- Real-time conflict detection
- Date/time pickers with business logic
- Driver and vehicle selection
- Location and mileage tracking
- Purpose and notes fields
- Loading and error states
- Accessible form controls

**Props:**
```typescript
interface VehicleReservationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateReservationRequest) => Promise<void>
  reservation?: VehicleReservation
  vehicles?: Vehicle[]
  drivers?: Driver[]
  isLoading?: boolean
  onCheckAvailability?: (
    vehicleId: string,
    startTime: Date,
    endTime: Date
  ) => Promise<{ available: boolean; conflicts?: any[] }>
}
```

**Usage:**
```tsx
import { VehicleReservationModal } from '@/components/scheduling'
import { useVehicles, useDrivers } from '@/hooks/use-api'

function MyComponent() {
  const [open, setOpen] = useState(false)
  const { data: vehicles } = useVehicles()
  const { data: drivers } = useDrivers()

  const handleSubmit = async (data: CreateReservationRequest) => {
    await apiClient.reservations.create(data)
    // Refresh data
  }

  const checkAvailability = async (vehicleId, startTime, endTime) => {
    const response = await apiClient.scheduling.checkConflicts({
      vehicleId,
      startTime,
      endTime,
    })
    return response
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>New Reservation</Button>
      <VehicleReservationModal
        open={open}
        onOpenChange={setOpen}
        onSubmit={handleSubmit}
        vehicles={vehicles}
        drivers={drivers}
        onCheckAvailability={checkAvailability}
      />
    </>
  )
}
```

### 3. MaintenanceAppointmentModal

Form modal for scheduling maintenance appointments with service bay and technician assignment.

**Features:**
- Appointment type selection with duration presets
- Service bay availability checking
- Technician assignment with specialization display
- Priority levels (low, medium, high, urgent)
- Business hours validation (7 AM - 7 PM weekdays)
- Real-time conflict detection
- Duration estimation
- Notes and special instructions

**Props:**
```typescript
interface MaintenanceAppointmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateMaintenanceRequest) => Promise<void>
  appointment?: MaintenanceAppointment
  vehicles?: Vehicle[]
  appointmentTypes?: AppointmentType[]
  serviceBays?: ServiceBay[]
  technicians?: Technician[]
  isLoading?: boolean
  onCheckAvailability?: (data: {
    serviceBayId?: string
    technicianId?: string
    startTime: Date
    endTime: Date
  }) => Promise<{ available: boolean; conflicts?: any[] }>
}
```

**Usage:**
```tsx
import { MaintenanceAppointmentModal } from '@/components/scheduling'

function MyComponent() {
  const [open, setOpen] = useState(false)
  const { data: vehicles } = useVehicles()
  const { data: appointmentTypes } = useAppointmentTypes()
  const { data: serviceBays } = useServiceBays()
  const { data: technicians } = useTechnicians()

  const handleSubmit = async (data: CreateMaintenanceRequest) => {
    await apiClient.maintenance.create(data)
  }

  const checkAvailability = async (data) => {
    const response = await apiClient.scheduling.checkAvailability(data)
    return response
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Schedule Maintenance</Button>
      <MaintenanceAppointmentModal
        open={open}
        onOpenChange={setOpen}
        onSubmit={handleSubmit}
        vehicles={vehicles}
        appointmentTypes={appointmentTypes}
        serviceBays={serviceBays}
        technicians={technicians}
        onCheckAvailability={checkAvailability}
      />
    </>
  )
}
```

### 4. ScheduleView

Timeline view component with advanced filtering and quick actions.

**Features:**
- Grouped by date display
- Multiple view modes (all, reservations, maintenance)
- Advanced filtering:
  - Status filter
  - Vehicle filter
  - Driver filter (reservations)
  - Technician filter (maintenance)
  - Date range filter
  - Search functionality
- Quick actions dropdown:
  - Approve/reject reservations
  - Cancel appointments
  - Reschedule
  - View details
- Card-based layout with hover effects
- Responsive design

**Props:**
```typescript
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
```

**Usage:**
```tsx
import { ScheduleView } from '@/components/scheduling'

function MySchedulePage() {
  const { data: reservations, isLoading } = useReservations()
  const { data: appointments } = useMaintenanceAppointments()
  const { data: vehicles } = useVehicles()
  const { data: drivers } = useDrivers()
  const { data: technicians } = useTechnicians()

  const handleApprove = async (id: string) => {
    await apiClient.reservations.approve(id)
    // Refresh data
  }

  const handleReschedule = (type, id) => {
    // Open appropriate modal for rescheduling
  }

  return (
    <ScheduleView
      reservations={reservations}
      appointments={appointments}
      vehicles={vehicles}
      drivers={drivers}
      technicians={technicians}
      isLoading={isLoading}
      onApproveReservation={handleApprove}
      onRejectReservation={handleReject}
      onCancelReservation={handleCancel}
      onCancelAppointment={handleCancelMaintenance}
      onReschedule={handleReschedule}
      onViewDetails={handleViewDetails}
    />
  )
}
```

## Complete Integration Example

```tsx
import { useState } from 'react'
import {
  SchedulingCalendar,
  VehicleReservationModal,
  MaintenanceAppointmentModal,
  ScheduleView,
} from '@/components/scheduling'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useVehicles, useDrivers } from '@/hooks/use-api'

export function SchedulingPage() {
  const [view, setView] = useState<'calendar' | 'timeline'>('calendar')
  const [reservationModalOpen, setReservationModalOpen] = useState(false)
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>()

  // Data fetching
  const { data: reservations, isLoading: loadingReservations } = useReservations()
  const { data: appointments, isLoading: loadingAppointments } = useMaintenanceAppointments()
  const { data: vehicles } = useVehicles()
  const { data: drivers } = useDrivers()
  const { data: technicians } = useTechnicians()
  const { data: serviceBays } = useServiceBays()
  const { data: appointmentTypes } = useAppointmentTypes()

  // Handlers
  const handleCreateReservation = async (data: CreateReservationRequest) => {
    await apiClient.reservations.create(data)
    // Refresh reservations list
  }

  const handleCreateMaintenance = async (data: CreateMaintenanceRequest) => {
    await apiClient.maintenance.create(data)
    // Refresh appointments list
  }

  const handleCheckVehicleAvailability = async (vehicleId, startTime, endTime) => {
    const response = await apiClient.scheduling.checkConflicts({
      vehicleId,
      startTime,
      endTime,
    })
    return {
      available: response.conflicts.length === 0,
      conflicts: response.conflicts,
    }
  }

  const handleCheckMaintenanceAvailability = async (data) => {
    const response = await apiClient.scheduling.checkAvailability(data)
    return response
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Fleet Scheduling</h1>

      <Tabs value={view} onValueChange={(v: any) => setView(v)}>
        <TabsList className="mb-6">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="timeline">Timeline View</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <SchedulingCalendar
            reservations={reservations}
            appointments={appointments}
            isLoading={loadingReservations || loadingAppointments}
            onCreateReservation={(date) => {
              setSelectedDate(date)
              setReservationModalOpen(true)
            }}
            onCreateMaintenance={(date) => {
              setSelectedDate(date)
              setMaintenanceModalOpen(true)
            }}
            onEventClick={(event) => {
              // Handle event click - could open detail modal
              console.log('Event clicked:', event)
            }}
          />
        </TabsContent>

        <TabsContent value="timeline">
          <ScheduleView
            reservations={reservations}
            appointments={appointments}
            vehicles={vehicles}
            drivers={drivers}
            technicians={technicians}
            isLoading={loadingReservations || loadingAppointments}
            onApproveReservation={async (id) => {
              await apiClient.reservations.approve(id)
            }}
            onRejectReservation={async (id) => {
              await apiClient.reservations.reject(id)
            }}
            onCancelReservation={async (id) => {
              await apiClient.reservations.cancel(id)
            }}
            onCancelAppointment={async (id) => {
              await apiClient.maintenance.cancel(id)
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <VehicleReservationModal
        open={reservationModalOpen}
        onOpenChange={setReservationModalOpen}
        onSubmit={handleCreateReservation}
        vehicles={vehicles}
        drivers={drivers}
        onCheckAvailability={handleCheckVehicleAvailability}
      />

      <MaintenanceAppointmentModal
        open={maintenanceModalOpen}
        onOpenChange={setMaintenanceModalOpen}
        onSubmit={handleCreateMaintenance}
        vehicles={vehicles}
        appointmentTypes={appointmentTypes}
        serviceBays={serviceBays}
        technicians={technicians}
        onCheckAvailability={handleCheckMaintenanceAvailability}
      />
    </div>
  )
}
```

## Type Definitions

All type definitions are available in `/src/types/scheduling.ts`:

- `VehicleReservation`
- `MaintenanceAppointment`
- `AppointmentType`
- `ServiceBay`
- `CreateReservationRequest`
- `CreateMaintenanceRequest`
- And more...

## API Integration

The components expect the following API endpoints:

### Reservations
- `GET /api/reservations` - List reservations
- `POST /api/reservations` - Create reservation
- `PUT /api/reservations/:id` - Update reservation
- `POST /api/reservations/:id/approve` - Approve reservation
- `POST /api/reservations/:id/reject` - Reject reservation
- `DELETE /api/reservations/:id` - Cancel reservation

### Maintenance Appointments
- `GET /api/maintenance-appointments` - List appointments
- `POST /api/maintenance-appointments` - Create appointment
- `PUT /api/maintenance-appointments/:id` - Update appointment
- `DELETE /api/maintenance-appointments/:id` - Cancel appointment

### Scheduling Utilities
- `POST /api/scheduling/check-conflicts` - Check for scheduling conflicts
- `GET /api/scheduling/available-vehicles` - Get available vehicles
- `GET /api/scheduling/available-bays` - Get available service bays

## Styling

All components use Tailwind CSS and are fully responsive. They integrate with the existing design system and support dark mode.

## Accessibility

- ARIA labels and roles
- Keyboard navigation support
- Screen reader friendly
- Focus management
- Error announcements

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Dependencies

- React 19
- react-hook-form ^7.54.2
- @hookform/resolvers ^4.1.3
- zod ^3.25.76
- date-fns ^3.6.0
- lucide-react ^0.484.0
- Radix UI components
- Tailwind CSS

## Future Enhancements

- Drag-and-drop rescheduling
- Recurring appointments
- Email/calendar sync
- Conflict resolution suggestions
- Bulk operations
- Export to PDF/Excel
- Mobile app support
