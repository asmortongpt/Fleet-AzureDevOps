// Reservations Hub - Vehicle Booking & Calendar Management
// Displays: Reservation calendar, booking form, approval workflow

import React from 'react';
import { ReservationSystem } from './ReservationSystem';
import { Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export const ReservationsHub: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Calendar className="w-8 h-8 text-primary" />
            Vehicle Reservations
          </h1>
          <p className="text-muted-foreground mt-2">
            Book vehicles, manage reservations, sync with Outlook Calendar
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Approvals</p>
              <p className="text-2xl font-bold">8</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Reservations</p>
              <p className="text-2xl font-bold">15</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Available Vehicles</p>
              <p className="text-2xl font-bold">37</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold">142</p>
            </div>
            <AlertCircle className="w-8 h-8 text-primary" />
          </div>
        </div>
      </div>

      {/* Reservation System */}
      <ReservationSystem />
    </div>
  );
};

export default ReservationsHub;
