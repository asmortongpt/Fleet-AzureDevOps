// Reservations Hub - Vehicle Booking & Calendar Management
// Displays: Reservation calendar, booking form, approval workflow

import { Calendar, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import React from 'react';
import useSWR from 'swr';

import { apiFetcher } from '@/lib/api-fetcher';
import { useVehicles } from '@/hooks/use-api';

import { ReservationSystem } from './ReservationSystem';

interface Reservation {
  id: string;
  status?: string;
  start_datetime?: string;
  end_datetime?: string;
  vehicle_id?: string;
  created_at?: string;
}

export const ReservationsHub: React.FC = () => {
  const { data: reservationsRaw, isLoading: reservationsLoading } = useSWR<Reservation[]>(
    '/api/reservations?limit=500',
    apiFetcher,
    { shouldRetryOnError: false }
  );
  const { data: vehiclesRaw, isLoading: vehiclesLoading } = useVehicles();

  const reservations = Array.isArray(reservationsRaw) ? reservationsRaw : [];
  const vehicles = Array.isArray(vehiclesRaw) ? vehiclesRaw : [];

  // Derive stats from real data
  const pendingApprovals = reservations.filter(
    (r) => r.status === 'pending' || r.status === 'pending_approval'
  ).length;

  const now = new Date();
  const activeReservations = reservations.filter((r) => {
    if (r.status === 'cancelled' || r.status === 'rejected') return false;
    const start = r.start_datetime ? new Date(r.start_datetime) : null;
    const end = r.end_datetime ? new Date(r.end_datetime) : null;
    if (start && end) return start <= now && end >= now;
    return r.status === 'active' || r.status === 'confirmed' || r.status === 'approved';
  }).length;

  // Vehicles not currently reserved
  const reservedVehicleIds = new Set(
    reservations
      .filter((r) => {
        const start = r.start_datetime ? new Date(r.start_datetime) : null;
        const end = r.end_datetime ? new Date(r.end_datetime) : null;
        if (start && end) return start <= now && end >= now;
        return r.status === 'active' || r.status === 'confirmed' || r.status === 'approved';
      })
      .map((r) => r.vehicle_id)
      .filter(Boolean)
  );
  const availableVehicles = vehicles.filter((v: any) => !reservedVehicleIds.has(v.id)).length;

  // Reservations this month
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const thisMonth = reservations.filter((r) => {
    const created = r.created_at ? new Date(r.created_at) : r.start_datetime ? new Date(r.start_datetime) : null;
    if (!created) return false;
    return created >= monthStart && created <= monthEnd;
  }).length;

  const isLoading = reservationsLoading || vehiclesLoading;

  return (
    <div className="space-y-2 p-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold flex items-center gap-3">
            <Calendar className="w-4 h-4 text-primary" />
            Vehicle Reservations
          </h1>
          <p className="text-muted-foreground mt-2">
            Book vehicles, manage reservations, sync with Outlook Calendar
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <div className="bg-card border border-border rounded-lg p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Approvals</p>
              <p className="text-sm font-bold">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin inline" /> : pendingApprovals}
              </p>
            </div>
            <Clock className="w-4 h-4 text-yellow-500" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Reservations</p>
              <p className="text-sm font-bold">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin inline" /> : activeReservations}
              </p>
            </div>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Available Vehicles</p>
              <p className="text-sm font-bold">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin inline" /> : availableVehicles}
              </p>
            </div>
            <Calendar className="w-4 h-4 text-blue-800" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="text-sm font-bold">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin inline" /> : thisMonth}
              </p>
            </div>
            <AlertCircle className="w-4 h-4 text-primary" />
          </div>
        </div>
      </div>

      {/* Reservation System */}
      <ReservationSystem />
    </div>
  );
};

export default ReservationsHub;
