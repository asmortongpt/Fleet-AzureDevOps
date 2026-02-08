// Fleet Vehicle Reservation System - UI Component
// Features: Calendar view, booking form, availability check, approval workflow
// Integration: Outlook Calendar, Microsoft Graph API

import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar as CalendarIcon,
  Clock,
  Car,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Filter
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { OutlookEmailButton, CalendarEventButton } from '@/components/integrations/MicrosoftIntegration';
import { Dialog } from '@/components/shared/Dialog';
import { useAuth } from '@/contexts/AuthContext';

// TypeScript Interfaces
interface Reservation {
  id: string;
  vehicleId: string;
  vehicleName?: string;
  driverId: string;
  driverName?: string;
  driverEmail?: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'active' | 'completed' | 'cancelled' | 'rejected';
  purpose: string;
  department?: string;
  costCenter?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface Vehicle {
  id: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  status: 'active' | 'idle' | 'charging' | 'service' | 'emergency' | 'offline';
  available: boolean;
}

interface Driver {
  id: string;
  name: string;
  email: string;
  department: string;
  licenseNumber: string;
}

interface AvailabilityCheck {
  available: boolean;
  conflicts: Reservation[];
  alternativeVehicles: Vehicle[];
}

// API Functions
const API_BASE = '/api/v1';

async function fetchReservations(): Promise<Reservation[]> {
  const res = await fetch(`${API_BASE}/reservations`, { credentials: 'include' });
  const json = await res.json();
  return json.reservations || [];
}

async function fetchVehicles(): Promise<Vehicle[]> {
  const res = await fetch(`${API_BASE}/vehicles`, { credentials: 'include' });
  const json = await res.json();
  return json.vehicles || [];
}

async function checkAvailability(vehicleId: string, startDate: string, endDate: string): Promise<AvailabilityCheck> {
  const res = await fetch(`${API_BASE}/reservations/availability`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ vehicleId, startDate, endDate })
  });
  return res.json();
}

async function createReservation(data: Partial<Reservation>): Promise<Reservation> {
  const res = await fetch(`${API_BASE}/reservations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data)
  });
  return res.json();
}

async function updateReservationStatus(id: string, status: Reservation['status']): Promise<Reservation> {
  const res = await fetch(`${API_BASE}/reservations/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ status })
  });
  return res.json();
}

// Main Component
export const ReservationSystem: React.FC = () => {
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [showNewReservation, setShowNewReservation] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const queryClient = useQueryClient();

  // Fetch data
  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['reservations'],
    queryFn: fetchReservations,
    refetchInterval: 30000 // Refresh every 30s for real-time updates
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: fetchVehicles
  });

  // Filter reservations
  const filteredReservations = reservations.filter(r =>
    filterStatus === 'all' || r.status === filterStatus
  );

  // Status colors
  const statusColors = {
    pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    approved: 'bg-green-500/10 text-green-600 border-green-500/20',
    active: 'bg-blue-500/10 text-blue-800 border-blue-500/20',
    completed: 'bg-gray-500/10 text-slate-700 border-gray-500/20',
    cancelled: 'bg-red-500/10 text-red-600 border-red-500/20',
    rejected: 'bg-red-500/10 text-red-600 border-red-500/20'
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold">Vehicle Reservations</h1>
          <p className="text-muted-foreground mt-1">
            Book vehicles, manage reservations, sync with Outlook Calendar
          </p>
        </div>
        <button
          onClick={() => setShowNewReservation(true)}
          className="flex items-center gap-2 px-2 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          New Reservation
        </button>
      </div>

      {/* View Toggle & Filters */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setView('calendar')}
            className={`px-2 py-2 rounded-lg ${view === 'calendar' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
          >
            <CalendarIcon className="w-4 h-4 inline mr-2" />
            Calendar
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-2 py-2 rounded-lg ${view === 'list' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
          >
            List View
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-muted rounded-lg border border-border"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* List View */}
      {view === 'list' && (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-2 py-3 text-left text-sm font-semibold">Vehicle</th>
                <th className="px-2 py-3 text-left text-sm font-semibold">Driver</th>
                <th className="px-2 py-3 text-left text-sm font-semibold">Start Date</th>
                <th className="px-2 py-3 text-left text-sm font-semibold">End Date</th>
                <th className="px-2 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-2 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReservations.map((reservation) => (
                <tr
                  key={reservation.id}
                  onClick={() => setSelectedReservation(reservation)}
                  className="border-t border-border hover:bg-muted/50 cursor-pointer"
                >
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{reservation.vehicleName || reservation.vehicleId}</span>
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{reservation.driverName || reservation.driverId}</span>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-sm">
                    {new Date(reservation.startDate).toLocaleString()}
                  </td>
                  <td className="px-2 py-3 text-sm">
                    {new Date(reservation.endDate).toLocaleString()}
                  </td>
                  <td className="px-2 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${statusColors[reservation.status]}`}>
                      {reservation.status}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex gap-2">
                      {reservation.status === 'pending' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateReservationStatus(reservation.id, 'approved').then(() => {
                                queryClient.invalidateQueries({ queryKey: ['reservations'] });
                              });
                            }}
                            className="p-1 hover:bg-green-500/10 rounded"
                          >
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateReservationStatus(reservation.id, 'rejected').then(() => {
                                queryClient.invalidateQueries({ queryKey: ['reservations'] });
                              });
                            }}
                            className="p-1 hover:bg-red-500/10 rounded"
                          >
                            <XCircle className="w-4 h-4 text-red-600" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Calendar View */}
      {view === 'calendar' && (
        <ReservationCalendar
          reservations={filteredReservations}
          onSelectReservation={setSelectedReservation}
          onNewReservation={setShowNewReservation}
        />
      )}

      {/* New Reservation Modal */}
      {showNewReservation && (
        <NewReservationForm
          vehicles={vehicles}
          onClose={() => setShowNewReservation(false)}
          onSuccess={() => {
            setShowNewReservation(false);
            queryClient.invalidateQueries({ queryKey: ['reservations'] });
          }}
        />
      )}

      {/* Reservation Details Modal */}
      {selectedReservation && (
        <ReservationDetails
          reservation={selectedReservation}
          onClose={() => setSelectedReservation(null)}
          onUpdate={() => queryClient.invalidateQueries({ queryKey: ['reservations'] })}
        />
      )}
    </div>
  );
};

// Calendar View Component
const ReservationCalendar: React.FC<{
  reservations: Reservation[];
  onSelectReservation: (r: Reservation) => void;
  onNewReservation: (show: boolean) => void;
}> = ({ reservations, onSelectReservation, onNewReservation }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Generate calendar days
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    return days;
  };

  const days = getDaysInMonth();

  return (
    <div className="border border-border rounded-lg p-2">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          className="px-3 py-1 bg-muted rounded hover:bg-muted/80"
        >
          ← Previous
        </button>
        <h2 className="text-base font-semibold">
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          className="px-3 py-1 bg-muted rounded hover:bg-muted/80"
        >
          Next →
        </button>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-semibold text-sm text-muted-foreground py-2">
            {day}
          </div>
        ))}
        {days.map(day => {
          const dayReservations = reservations.filter(r => {
            const start = new Date(r.startDate);
            const end = new Date(r.endDate);
            return day >= start && day <= end;
          });

          return (
            <div
              key={day.toISOString()}
              className="border border-border rounded p-2 min-h-[100px] hover:bg-muted/50 cursor-pointer"
              onClick={() => onNewReservation(true)}
            >
              <div className="text-sm font-medium mb-1">{day.getDate()}</div>
              <div className="space-y-1">
                {dayReservations.slice(0, 2).map(r => (
                  <div
                    key={r.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectReservation(r);
                    }}
                    className={`text-xs px-1 py-0.5 rounded truncate ${statusColors[r.status]}`}
                  >
                    {r.vehicleName}
                  </div>
                ))}
                {dayReservations.length > 2 && (
                  <div className="text-xs text-muted-foreground">+{dayReservations.length - 2} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// New Reservation Form
const NewReservationForm: React.FC<{
  vehicles: Vehicle[];
  onClose: () => void;
  onSuccess: () => void;
}> = ({ vehicles, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    vehicleId: '',
    startDate: '',
    endDate: '',
    purpose: '',
    department: '',
    driverId: user?.id || '',
    driverName: user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : '',
    driverEmail: user?.email || ''
  });
  const [availability, setAvailability] = useState<AvailabilityCheck | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFormData((prev) => ({
      ...prev,
      driverId: prev.driverId || user.id || '',
      driverName: prev.driverName || `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
      driverEmail: prev.driverEmail || user.email || ''
    }));
  }, [user]);

  const checkAvail = async () => {
    if (!formData.vehicleId || !formData.startDate || !formData.endDate) return;
    setChecking(true);
    const result = await checkAvailability(formData.vehicleId, formData.startDate, formData.endDate);
    setAvailability(result);
    setChecking(false);
  };

  useEffect(() => {
    if (formData.vehicleId && formData.startDate && formData.endDate) {
      checkAvail();
    }
  }, [formData.vehicleId, formData.startDate, formData.endDate]);

  const handleSubmit = async () => {
    const reservation = await createReservation({
      ...formData,
      status: 'pending'
    });
    onSuccess();
  };

  return (
    <Dialog open={true} onClose={onClose} title="New Vehicle Reservation" variant="center" size="lg">
      <div className="space-y-2">
        {/* Vehicle Selector */}
        <div>
          <label className="block text-sm font-medium mb-1">Vehicle</label>
          <select
            value={formData.vehicleId}
            onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
            className="w-full px-3 py-2 bg-muted rounded-lg border border-border"
          >
            <option value="">Select a vehicle</option>
            {vehicles.filter(v => v.status === 'active').map(v => (
              <option key={v.id} value={v.id}>
                {v.year} {v.make} {v.model} ({v.vin})
              </option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date/Time</label>
            <input
              type="datetime-local"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-3 py-2 bg-muted rounded-lg border border-border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date/Time</label>
            <input
              type="datetime-local"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full px-3 py-2 bg-muted rounded-lg border border-border"
            />
          </div>
        </div>

        {/* Availability Check */}
        {checking && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4 animate-spin" />
            Checking availability...
          </div>
        )}
        {availability && !availability.available && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-red-600 font-medium mb-2">
              <AlertCircle className="w-4 h-4" />
              Vehicle not available for selected dates
            </div>
            {availability.conflicts.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Conflicts with {availability.conflicts.length} existing reservation(s)
              </div>
            )}
          </div>
        )}
        {availability && availability.available && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-green-600 font-medium">
              <CheckCircle className="w-4 h-4" />
              Vehicle is available!
            </div>
          </div>
        )}

        {/* Purpose */}
        <div>
          <label className="block text-sm font-medium mb-1">Purpose</label>
          <textarea
            value={formData.purpose}
            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
            className="w-full px-3 py-2 bg-muted rounded-lg border border-border"
            rows={3}
            placeholder="Brief description of vehicle use..."
          />
        </div>

        {/* Department */}
        <div>
          <label className="block text-sm font-medium mb-1">Department / Cost Center</label>
          <input
            type="text"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            className="w-full px-3 py-2 bg-muted rounded-lg border border-border"
            placeholder="e.g., Sales, IT, Operations"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-2">
          <button
            onClick={onClose}
            className="px-2 py-2 bg-muted rounded-lg hover:bg-muted/80"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!availability?.available}
            className="px-2 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            Submit for Approval
          </button>
        </div>
      </div>
    </Dialog>
  );
};

// Reservation Details Modal
const ReservationDetails: React.FC<{
  reservation: Reservation;
  onClose: () => void;
  onUpdate: () => void;
}> = ({ reservation, onClose, onUpdate }) => {
  return (
    <Dialog
      open={true}
      onClose={onClose}
      title="Reservation Details"
      variant="drawer"
      size="xl"
    >
      <div className="space-y-2">
        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 text-sm font-medium rounded-full border ${statusColors[reservation.status]}`}>
            {reservation.status.toUpperCase()}
          </span>
          {reservation.approvedBy && (
            <span className="text-sm text-muted-foreground">
              Approved by {reservation.approvedBy}
            </span>
          )}
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Vehicle</label>
            <p className="text-sm">{reservation.vehicleName || reservation.vehicleId}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Driver</label>
            <p className="text-sm">{reservation.driverName || reservation.driverId}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Start Date</label>
            <p className="text-sm">{new Date(reservation.startDate).toLocaleString()}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">End Date</label>
            <p className="text-sm">{new Date(reservation.endDate).toLocaleString()}</p>
          </div>
          <div className="col-span-2">
            <label className="text-sm font-medium text-muted-foreground">Purpose</label>
            <p className="text-base">{reservation.purpose}</p>
          </div>
        </div>

        {/* Outlook Integration */}
        <div className="border-t border-border pt-2">
          <h3 className="font-semibold mb-3">Calendar Integration</h3>
          {reservation.driverEmail ? (
            <div className="flex gap-2">
              <CalendarEventButton
                subject={`Vehicle Reservation: ${reservation.vehicleName}`}
                start={new Date(reservation.startDate)}
                end={new Date(reservation.endDate)}
                attendees={[reservation.driverEmail]}
              />
              <OutlookEmailButton
                to={reservation.driverEmail}
                subject={`Reservation Confirmation: ${reservation.vehicleName}`}
                body={`Your reservation for ${reservation.vehicleName} from ${new Date(reservation.startDate).toLocaleString()} to ${new Date(reservation.endDate).toLocaleString()} has been confirmed.`}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Driver email unavailable for calendar integration.</p>
          )}
        </div>
      </div>
    </Dialog>
  );
};

// Helper for status colors (define outside components or use consistent colors)
const statusColors = {
  pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  approved: 'bg-green-500/10 text-green-600 border-green-500/20',
  active: 'bg-blue-500/10 text-blue-800 border-blue-500/20',
  completed: 'bg-gray-500/10 text-slate-700 border-gray-500/20',
  cancelled: 'bg-red-500/10 text-red-600 border-red-500/20',
  rejected: 'bg-red-500/10 text-red-600 border-red-500/20'
};

export default ReservationSystem;
