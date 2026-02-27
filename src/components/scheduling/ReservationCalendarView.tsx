/**
 * ReservationCalendarView - Calendar-style view for vehicle reservations.
 *
 * Provides week and list views with status filtering, week navigation,
 * and approve/reject/cancel actions. Self-contained data fetching via fetch + useEffect.
 */

import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Clock,
  Car,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { useState, useMemo, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

import { EmailButton } from '@/components/email/EmailButton'
import { VehicleReservationModal } from '@/components/scheduling/VehicleReservationModal'
import { Button } from '@/components/ui/button'
import { getCsrfToken } from '@/hooks/use-api'
import { cn } from '@/lib/utils'
import type { CreateReservationRequest } from '@/types/scheduling'
import { formatEnum } from '@/utils/format-enum'
import { formatDateTime, formatNumber, formatTime as formatTimeHelper } from '@/utils/format-helpers'
import { formatVehicleName } from '@/utils/vehicle-display'

// ============================================================================
// Types
// ============================================================================

interface Reservation {
  id: string
  vehicle_id: string
  vehicle_name?: string
  driver_id?: string
  driver_name?: string
  start_date: string
  end_date: string
  purpose?: string
  status: 'pending' | 'approved' | 'active' | 'completed' | 'rejected' | 'cancelled'
  notes?: string
  created_at?: string
}

interface Vehicle {
  id: string
  name?: string
  make?: string
  model?: string
  year?: number
  license_plate?: string
}

type ViewMode = 'week' | 'list'
type StatusFilter = 'all' | 'pending' | 'approved' | 'active'

// ============================================================================
// Helpers
// ============================================================================

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

/** Return the Monday of the week containing `date`. */
function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  // Sunday is 0, Monday is 1, ..., Saturday is 6
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Format a Date to short display like "Feb 17". */
function shortDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Format a Date to ISO date string (YYYY-MM-DD) for comparison. */
function toDateKey(date: Date): string {
  return date.toISOString().split('T')[0]
}

/** Format a time string from an ISO date — delegates to centralized helper. */
function formatTime(isoStr: string): string {
  const result = formatTimeHelper(isoStr)
  return result === '\u2014' ? '--' : result
}

/** Get the status color classes for a reservation status. */
function statusColors(status: Reservation['status']) {
  switch (status) {
    case 'pending':
      return {
        bg: 'bg-amber-500/20',
        border: 'border-amber-500/30',
        text: 'text-amber-400',
        badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      }
    case 'approved':
      return {
        bg: 'bg-emerald-500/20',
        border: 'border-emerald-500/30',
        text: 'text-emerald-400',
        badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      }
    case 'active':
      return {
        bg: 'bg-emerald-500/30',
        border: 'border-emerald-500/40',
        text: 'text-emerald-300',
        badge: 'bg-emerald-500/30 text-emerald-300 border-emerald-500/40',
      }
    case 'completed':
      return {
        bg: 'bg-white/[0.06]',
        border: 'border-white/[0.04]',
        text: 'text-white/40',
        badge: 'bg-white/[0.06] text-white/40 border-white/[0.04]',
      }
    case 'rejected':
      return {
        bg: 'bg-red-500/20',
        border: 'border-red-500/30',
        text: 'text-red-400',
        badge: 'bg-red-500/20 text-red-400 border-red-500/30',
      }
    case 'cancelled':
      return {
        bg: 'bg-white/[0.04]',
        border: 'border-white/[0.06]',
        text: 'text-white/30',
        badge: 'bg-white/[0.04] text-white/30 border-white/[0.06]',
      }
    default:
      return {
        bg: 'bg-white/[0.06]',
        border: 'border-white/[0.04]',
        text: 'text-white/40',
        badge: 'bg-white/[0.06] text-white/40 border-white/[0.04]',
      }
  }
}

// ============================================================================
// Component
// ============================================================================

export function ReservationCalendarView() {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getMonday(new Date()))
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [prefillDate, setPrefillDate] = useState<Date | null>(null)

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const [reservations, setReservations] = useState<Reservation[] | null>(null)
  const [reservationsLoading, setReservationsLoading] = useState(true)
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null)

  const weekEnd = useMemo(() => {
    const d = new Date(currentWeekStart)
    d.setDate(d.getDate() + 7)
    return d
  }, [currentWeekStart])

  const fetchReservations = useCallback(async () => {
    setReservationsLoading(true)
    try {
      const res = await fetch(
        `/api/reservations?start_date=${currentWeekStart.toISOString()}&end_date=${weekEnd.toISOString()}`,
        { credentials: 'include' }
      )
      if (res.ok) {
        const json = await res.json()
        setReservations(json.reservations ?? [])
      }
    } catch {
      // keep previous data on error
    } finally {
      setReservationsLoading(false)
    }
  }, [currentWeekStart, weekEnd])

  useEffect(() => {
    fetchReservations()
  }, [fetchReservations])

  useEffect(() => {
    let cancelled = false
    async function loadVehicles() {
      try {
        const res = await fetch('/api/vehicles?limit=100', { credentials: 'include' })
        if (res.ok && !cancelled) {
          const json = await res.json()
          setVehicles(json.data ?? [])
        }
      } catch {
        // ignore
      }
    }
    loadVehicles()
    return () => { cancelled = true }
  }, [])

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  const vehicleMap = useMemo(() => {
    const map = new Map<string, Vehicle>()
    if (Array.isArray(vehicles)) {
      vehicles.forEach((v) => map.set(v.id, v))
    }
    return map
  }, [vehicles])

  /** Resolve a display name for a vehicle. */
  const vehicleName = (r: Reservation): string => {
    if (r.vehicle_name) return r.vehicle_name
    const v = vehicleMap.get(r.vehicle_id)
    if (v) {
      if (v.name) return v.name
      return formatVehicleName(v)
    }
    return 'Vehicle'
  }

  const filteredReservations = useMemo(() => {
    if (!Array.isArray(reservations)) return []
    if (statusFilter === 'all') return reservations
    return reservations.filter((r) => r.status === statusFilter)
  }, [reservations, statusFilter])

  const pendingCount = useMemo(() => {
    if (!Array.isArray(reservations)) return 0
    return reservations.filter((r) => r.status === 'pending').length
  }, [reservations])

  /** Build a map of date keys to reservations falling on that day. */
  const dayReservations = useMemo(() => {
    const map = new Map<string, Reservation[]>()
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekStart)
      d.setDate(d.getDate() + i)
      map.set(toDateKey(d), [])
    }
    filteredReservations.forEach((r) => {
      const start = new Date(r.start_date)
      const end = new Date(r.end_date)
      // Place reservation on each day it overlaps within this week
      for (let i = 0; i < 7; i++) {
        const d = new Date(currentWeekStart)
        d.setDate(d.getDate() + i)
        const dayStart = new Date(d)
        dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(d)
        dayEnd.setHours(23, 59, 59, 999)
        if (start <= dayEnd && end >= dayStart) {
          const key = toDateKey(d)
          const existing = map.get(key) || []
          // Avoid duplicates (multi-day reservations)
          if (!existing.find((e) => e.id === r.id)) {
            existing.push(r)
            map.set(key, existing)
          }
        }
      }
    })
    return map
  }, [filteredReservations, currentWeekStart])

  // ---------------------------------------------------------------------------
  // Week navigation
  // ---------------------------------------------------------------------------

  const goToPreviousWeek = () => {
    setCurrentWeekStart((prev) => {
      const d = new Date(prev)
      d.setDate(d.getDate() - 7)
      return d
    })
    setSelectedReservation(null)
  }

  const goToNextWeek = () => {
    setCurrentWeekStart((prev) => {
      const d = new Date(prev)
      d.setDate(d.getDate() + 7)
      return d
    })
    setSelectedReservation(null)
  }

  const weekEndDisplay = new Date(currentWeekStart)
  weekEndDisplay.setDate(weekEndDisplay.getDate() + 6)
  const weekLabel = `${shortDate(currentWeekStart)} - ${shortDate(weekEndDisplay)}, ${weekEndDisplay.getFullYear()}`

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const handleApprove = async (id: string, action: 'approve' | 'reject') => {
    try {
      const csrf = await getCsrfToken()
      const res = await fetch(`/api/reservations/${id}/approve`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) {
        toast.error(`Failed to ${action} reservation`)
        return
      }
      toast.success(`Reservation ${action}d`)
      fetchReservations()
      if (selectedReservation?.id === id) setSelectedReservation(null)
    } catch {
      toast.error(`Failed to ${action} reservation`)
    }
  }

  const handleCancel = async (id: string) => {
    try {
      const csrf = await getCsrfToken()
      const res = await fetch(`/api/reservations/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'X-CSRF-Token': csrf },
      })
      if (!res.ok) {
        toast.error('Failed to cancel reservation')
        return
      }
      toast.success('Reservation cancelled')
      fetchReservations()
      if (selectedReservation?.id === id) setSelectedReservation(null)
    } catch {
      toast.error('Failed to cancel reservation')
    }
  }

  const handleCreateReservation = async (data: CreateReservationRequest) => {
    try {
      const csrf = await getCsrfToken()
      const res = await fetch('/api/reservations', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        body: JSON.stringify({
          vehicle_id: data.vehicleId,
          driver_id: data.driverId || undefined,
          reservation_type: data.reservationType,
          start_time: data.startTime,
          end_time: data.endTime,
          pickup_location: data.pickupLocation,
          dropoff_location: data.dropoffLocation,
          estimated_miles: data.estimatedMiles,
          purpose: data.purpose,
          notes: data.notes,
        }),
      })
      if (!res.ok) {
        toast.error('Failed to create reservation')
        throw new Error('Failed to create reservation')
      }
      toast.success('Reservation created')
      fetchReservations()
    } catch (err) {
      toast.error('Failed to create reservation')
      throw err
    }
  }

  const handleOpenCreateModal = (date?: Date) => {
    setPrefillDate(date ?? null)
    setShowCreateModal(true)
  }

  const handleCloseCreateModal = (open: boolean) => {
    if (!open) {
      setShowCreateModal(false)
      setPrefillDate(null)
    }
  }

  // ---------------------------------------------------------------------------
  // Status filter chips
  // ---------------------------------------------------------------------------

  const STATUS_FILTERS: { key: StatusFilter; label: string; color: string }[] = [
    { key: 'all', label: 'All', color: 'text-white/60' },
    { key: 'pending', label: 'Pending', color: 'text-amber-400' },
    { key: 'approved', label: 'Approved', color: 'text-emerald-400' },
    { key: 'active', label: 'Active', color: 'text-emerald-300' },
  ]

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const isEmpty = filteredReservations.length === 0

  return (
    <div className="space-y-4">
      {/* ---- Pending approval banner ---- */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span className="text-sm text-amber-400">
            {formatNumber(pendingCount)} reservation{pendingCount !== 1 ? 's' : ''} awaiting approval
          </span>
        </div>
      )}

      {/* ---- Header row ---- */}
      <div className="flex flex-wrap items-center gap-3">
        {/* View toggle */}
        <div className="flex rounded-lg border border-white/[0.04] overflow-hidden">
          <button
            type="button"
            onClick={() => setViewMode('week')}
            className={cn(
              'px-3 py-1.5 text-xs font-medium transition-colors',
              viewMode === 'week'
                ? 'bg-white/[0.1] text-white/90'
                : 'bg-white/[0.03] text-white/40 hover:text-white/60'
            )}
          >
            Week
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={cn(
              'px-3 py-1.5 text-xs font-medium transition-colors border-l border-white/[0.04]',
              viewMode === 'list'
                ? 'bg-white/[0.1] text-white/90'
                : 'bg-white/[0.03] text-white/40 hover:text-white/60'
            )}
          >
            List
          </button>
        </div>

        {/* Week navigation */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goToPreviousWeek}
            className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-colors"
            aria-label="Previous week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-white/80 font-medium min-w-[180px] text-center tabular-nums">
            {weekLabel}
          </span>
          <button
            type="button"
            onClick={goToNextWeek}
            className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-colors"
            aria-label="Next week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Status filter chips */}
        <div className="flex items-center gap-1 ml-auto">
          {STATUS_FILTERS.map((sf) => (
            <button
              key={sf.key}
              type="button"
              onClick={() => setStatusFilter(sf.key)}
              className={cn(
                'px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors border',
                statusFilter === sf.key
                  ? `${sf.color} border-current bg-white/[0.06]`
                  : 'text-white/30 border-transparent hover:text-white/50 hover:bg-white/[0.04]'
              )}
            >
              {sf.label}
            </button>
          ))}
        </div>

        {/* New Reservation button */}
        <Button
          size="sm"
          onClick={() => handleOpenCreateModal()}
          className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-emerald-500/30 gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          New Reservation
        </Button>
      </div>

      {/* ---- Loading state ---- */}
      {reservationsLoading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
          <p className="text-sm text-white/40">Loading reservations...</p>
        </div>
      )}

      {/* ---- Empty state ---- */}
      {!reservationsLoading && isEmpty && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Calendar className="w-10 h-10 text-white/20" />
          <p className="text-sm text-white/40">No reservations for this week</p>
          <Button
            size="sm"
            onClick={() => handleOpenCreateModal()}
            className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-emerald-500/30 gap-1.5 mt-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Reservation
          </Button>
        </div>
      )}

      {/* ---- Week view ---- */}
      {!reservationsLoading && !isEmpty && viewMode === 'week' && (
        <div className="grid grid-cols-7 gap-px bg-white/[0.04] rounded-xl border border-white/[0.04] overflow-hidden">
          {/* Column headers */}
          {Array.from({ length: 7 }, (_, i) => {
            const d = new Date(currentWeekStart)
            d.setDate(d.getDate() + i)
            const isToday = toDateKey(d) === toDateKey(new Date())
            return (
              <div
                key={i}
                className={cn(
                  'px-2 py-2 text-center border-b border-white/[0.06]',
                  isToday ? 'bg-emerald-500/10' : 'bg-white/[0.02]'
                )}
              >
                <div className="text-[10px] font-medium text-white/40 uppercase">
                  {DAY_NAMES[i]}
                </div>
                <div
                  className={cn(
                    'text-sm font-semibold mt-0.5',
                    isToday ? 'text-emerald-400' : 'text-white/80'
                  )}
                >
                  {d.getDate()}
                </div>
              </div>
            )
          })}

          {/* Day cells */}
          {Array.from({ length: 7 }, (_, i) => {
            const d = new Date(currentWeekStart)
            d.setDate(d.getDate() + i)
            const key = toDateKey(d)
            const dayItems = dayReservations.get(key) || []
            const isToday = key === toDateKey(new Date())

            return (
              <div
                key={key}
                onClick={(e) => {
                  // Only open modal if clicking on the empty area, not on a reservation button
                  if ((e.target as HTMLElement).closest('button')) return
                  handleOpenCreateModal(d)
                }}
                className={cn(
                  'min-h-[120px] p-1.5 space-y-1 cursor-pointer hover:bg-white/[0.02] transition-colors',
                  isToday ? 'bg-emerald-500/[0.03]' : 'bg-[#1a1a1a]'
                )}
              >
                {dayItems.map((r) => {
                  const colors = statusColors(r.status)
                  const isSelected = selectedReservation?.id === r.id
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() =>
                        setSelectedReservation(isSelected ? null : r)
                      }
                      className={cn(
                        'w-full text-left px-1.5 py-1 rounded-md border transition-all text-[10px] leading-tight',
                        colors.bg,
                        colors.border,
                        colors.text,
                        isSelected && 'ring-1 ring-white/30'
                      )}
                    >
                      <div className="font-medium truncate">
                        {vehicleName(r)}
                      </div>
                      <div className="opacity-70 truncate">
                        {formatTime(r.start_date)} - {formatTime(r.end_date)}
                      </div>
                      {r.purpose && (
                        <div className="opacity-50 truncate mt-0.5">
                          {r.purpose}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      {/* ---- Inline detail for selected reservation (week view) ---- */}
      {viewMode === 'week' && selectedReservation && (
        <div className="rounded-xl border border-white/[0.04] bg-[#1a1a1a] p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-sm font-semibold text-white/90 flex items-center gap-2">
                <Car className="w-4 h-4 text-white/40" />
                {vehicleName(selectedReservation)}
              </h4>
              {selectedReservation.driver_name && (
                <p className="text-xs text-white/50 mt-0.5">
                  {selectedReservation.driver_name}
                </p>
              )}
            </div>
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-[10px] font-medium border',
                statusColors(selectedReservation.status).badge
              )}
            >
              {formatEnum(selectedReservation.status)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-white/40 block">Start</span>
              <span className="text-white/80">{formatDateTime(selectedReservation.start_date)}</span>
            </div>
            <div>
              <span className="text-white/40 block">End</span>
              <span className="text-white/80">{formatDateTime(selectedReservation.end_date)}</span>
            </div>
            {selectedReservation.purpose && (
              <div className="col-span-2">
                <span className="text-white/40 block">Purpose</span>
                <span className="text-white/80">{selectedReservation.purpose}</span>
              </div>
            )}
            {selectedReservation.notes && (
              <div className="col-span-2">
                <span className="text-white/40 block">Notes</span>
                <span className="text-white/60">{selectedReservation.notes}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            {selectedReservation.status === 'pending' && (
              <>
                <Button
                  size="sm"
                  onClick={() => handleApprove(selectedReservation.id, 'approve')}
                  className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-emerald-500/30 gap-1"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleApprove(selectedReservation.id, 'reject')}
                  className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/30 gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Reject
                </Button>
              </>
            )}
            {(selectedReservation.status === 'pending' ||
              selectedReservation.status === 'approved') && (
              <button
                type="button"
                onClick={() => handleCancel(selectedReservation.id)}
                className="px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/60 hover:bg-white/[0.06] transition-colors"
              >
                Cancel Reservation
              </button>
            )}
            <EmailButton
              context={{
                type: 'reservation_confirmation',
                entityName: vehicleName(selectedReservation),
                recipientName: selectedReservation.driver_name,
                details: `Reserved ${formatDateTime(selectedReservation.start_date)} to ${formatDateTime(selectedReservation.end_date)}.${selectedReservation.purpose ? ` Purpose: ${selectedReservation.purpose}.` : ''}`,
              }}
              label="Email"
              size="sm"
              variant="ghost"
              className="text-white/40 hover:text-white/60"
            />
          </div>
        </div>
      )}

      {/* ---- Create Reservation Modal ---- */}
      <VehicleReservationModal
        open={showCreateModal}
        onOpenChange={handleCloseCreateModal}
        onSubmit={handleCreateReservation}
        vehicles={(Array.isArray(vehicles) ? vehicles : []).map((v) => ({
          id: String(v.id),
          make: v.make ?? '',
          model: v.model ?? '',
          year: v.year ?? 0,
          licensePlate: v.license_plate ?? '',
        })) as any}
        reservation={prefillDate ? {
          start_time: prefillDate.toISOString(),
          end_time: new Date(prefillDate.getTime() + 8 * 60 * 60 * 1000).toISOString(),
        } as any : undefined}
      />

      {/* ---- List view ---- */}
      {!reservationsLoading && !isEmpty && viewMode === 'list' && (
        <div className="rounded-xl border border-white/[0.04] overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_0.8fr_0.7fr_1fr] gap-px bg-white/[0.02] px-4 py-2.5 border-b border-white/[0.06]">
            {['Vehicle', 'Driver', 'Start', 'End', 'Purpose', 'Status', 'Actions'].map(
              (header) => (
                <div key={header} className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                  {header}
                </div>
              )
            )}
          </div>

          {/* Table rows */}
          {filteredReservations.map((r) => {
            const colors = statusColors(r.status)
            return (
              <div
                key={r.id}
                className="grid grid-cols-[1.5fr_1fr_1fr_1fr_0.8fr_0.7fr_1fr] gap-px px-4 py-2.5 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors items-center"
              >
                <div className="text-xs text-white/80 font-medium truncate flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                  {vehicleName(r)}
                </div>
                <div className="text-xs text-white/60 truncate">
                  {r.driver_name || '--'}
                </div>
                <div className="text-xs text-white/60 tabular-nums">
                  {formatDateTime(r.start_date)}
                </div>
                <div className="text-xs text-white/60 tabular-nums">
                  {formatDateTime(r.end_date)}
                </div>
                <div className="text-xs text-white/50 truncate">
                  {r.purpose || '--'}
                </div>
                <div>
                  <span
                    className={cn(
                      'inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border',
                      colors.badge
                    )}
                  >
                    {formatEnum(r.status)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {r.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleApprove(r.id, 'approve')}
                        className="p-1 rounded text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                        title="Approve"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApprove(r.id, 'reject')}
                        className="p-1 rounded text-red-400 hover:bg-red-500/20 transition-colors"
                        title="Reject"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  {(r.status === 'pending' || r.status === 'approved') && (
                    <button
                      type="button"
                      onClick={() => handleCancel(r.id)}
                      className="px-1.5 py-0.5 rounded text-[10px] text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
