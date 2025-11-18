/**
 * Mobile Employee Dashboard Component
 * Mobile-optimized interface for vehicle assignment management (BR-11.1, BR-11.2, BR-11.3)
 *
 * Features:
 * - View own vehicle assignments (BR-11.1)
 * - View and acknowledge on-call periods (BR-11.2)
 * - Log callback trips with GPS (BR-11.3)
 * - Request mileage reimbursement
 * - Offline-ready data sync (BR-11.6)
 */

import React, { useState, useEffect } from 'react';
import {
  Car,
  Clock,
  MapPin,
  Phone,
  CheckCircle,
  AlertCircle,
  Navigation,
  CurrencyDollar,
  Calendar,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface Assignment {
  id: string;
  vehicle_id: string;
  assignment_type: string;
  lifecycle_state: string;
  commuting_authorized: boolean;
  unit_number: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  secured_parking_name?: string;
  secured_parking_address?: string;
  parking_latitude?: number;
  parking_longitude?: number;
}

interface OnCallPeriod {
  id: string;
  start_datetime: string;
  end_datetime: string;
  acknowledged_by_driver: boolean;
  callback_count: number;
  unit_number?: string;
  make?: string;
  model?: string;
}

interface CallbackTrip {
  id: string;
  trip_date: string;
  miles_driven: number;
  used_private_vehicle: boolean;
  reimbursement_amount: number;
  reimbursement_status: string;
  purpose: string;
}

const MobileEmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'assignments' | 'on-call' | 'trips'>('assignments');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCallbackForm, setShowCallbackForm] = useState(false);

  // Callback trip form state
  const [callbackForm, setCallbackForm] = useState({
    on_call_period_id: '',
    trip_date: new Date().toISOString().split('T')[0],
    miles_driven: '',
    purpose: '',
    notes: '',
    used_private_vehicle: true,
  });

  useEffect(() => {
    fetchDashboardData();
    // Set up periodic sync (every 5 minutes when online)
    const syncInterval = setInterval(() => {
      if (navigator.onLine) {
        fetchDashboardData();
      }
    }, 300000); // 5 minutes

    return () => clearInterval(syncInterval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/mobile/dashboard/employee', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
        // Cache for offline use
        localStorage.setItem('mobile_dashboard_cache', JSON.stringify({
          data,
          cached_at: new Date().toISOString(),
        }));
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      // Load from cache if offline
      const cached = localStorage.getItem('mobile_dashboard_cache');
      if (cached) {
        setDashboardData(JSON.parse(cached).data);
      }
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeOnCall = async (periodId: string) => {
    try {
      const response = await fetch(`/api/mobile/on-call/${periodId}/acknowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ acknowledged: true }),
      });

      if (response.ok) {
        fetchDashboardData(); // Refresh
        alert('On-call period acknowledged successfully');
      }
    } catch (error) {
      console.error('Error acknowledging on-call:', error);
      alert('Failed to acknowledge on-call period');
    }
  };

  const submitCallbackTrip = async () => {
    try {
      // Get GPS coordinates if available
      let coordinates = {};
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          coordinates = {
            start_latitude: position.coords.latitude,
            start_longitude: position.coords.longitude,
          };
        });
      }

      const response = await fetch('/api/mobile/callback-trip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...callbackForm,
          miles_driven: parseFloat(callbackForm.miles_driven),
          ...coordinates,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Callback trip logged successfully! Estimated reimbursement: $${result.estimated_reimbursement.toFixed(2)}`);
        setShowCallbackForm(false);
        fetchDashboardData();
        // Reset form
        setCallbackForm({
          on_call_period_id: '',
          trip_date: new Date().toISOString().split('T')[0],
          miles_driven: '',
          purpose: '',
          notes: '',
          used_private_vehicle: true,
        });
      }
    } catch (error) {
      console.error('Error submitting callback trip:', error);
      alert('Failed to log callback trip');
    }
  };

  const openNavigationToParking = (assignment: Assignment) => {
    if (assignment.parking_latitude && assignment.parking_longitude) {
      // Open native maps app
      const url = `https://www.google.com/maps/dir/?api=1&destination=${assignment.parking_latitude},${assignment.parking_longitude}`;
      window.open(url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center p-6">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Unable to load dashboard. Please check your connection.</p>
        </div>
      </div>
    );
  }

  const renderAssignmentsTab = () => (
    <div className="space-y-4">
      {dashboardData.assignments.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center">
          <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No vehicle assignments</p>
        </div>
      ) : (
        dashboardData.assignments.map((assignment: Assignment) => (
          <div key={assignment.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg text-gray-900">
                  {assignment.unit_number}
                </h3>
                <p className="text-sm text-gray-600">
                  {assignment.make} {assignment.model} {assignment.year}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                assignment.lifecycle_state === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {assignment.lifecycle_state}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <FileText className="w-4 h-4" />
                <span>License: {assignment.license_plate}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Type: {assignment.assignment_type.replace('_', ' ')}</span>
              </div>

              {assignment.commuting_authorized && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>Commuting Authorized</span>
                </div>
              )}

              {assignment.secured_parking_name && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-start gap-2 text-gray-700">
                    <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium">{assignment.secured_parking_name}</p>
                      <p className="text-xs text-gray-500">{assignment.secured_parking_address}</p>
                    </div>
                  </div>
                  {assignment.parking_latitude && (
                    <button
                      onClick={() => openNavigationToParking(assignment)}
                      className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
                    >
                      <Navigation className="w-4 h-4" />
                      Navigate to Parking
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderOnCallTab = () => (
    <div className="space-y-4">
      {dashboardData.notifications.unacknowledged_on_call > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <p className="text-sm font-medium text-yellow-800">
              You have {dashboardData.notifications.unacknowledged_on_call} unacknowledged on-call period(s)
            </p>
          </div>
        </div>
      )}

      {dashboardData.on_call_periods.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center">
          <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No upcoming on-call periods</p>
        </div>
      ) : (
        dashboardData.on_call_periods.map((period: OnCallPeriod) => {
          const startDate = new Date(period.start_datetime);
          const endDate = new Date(period.end_datetime);
          const isActive = new Date() >= startDate && new Date() <= endDate;

          return (
            <div key={period.id} className={`bg-white rounded-lg shadow p-4 ${
              isActive ? 'border-2 border-blue-500' : ''
            }`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {isActive ? '🔴 Active Now' : 'Upcoming'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {startDate.toLocaleDateString()} {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    <br />
                    to {endDate.toLocaleDateString()} {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {!period.acknowledged_by_driver ? (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                    Needs Ack
                  </span>
                ) : (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                )}
              </div>

              {period.unit_number && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <Car className="w-4 h-4" />
                  <span>{period.unit_number} - {period.make} {period.model}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                <Phone className="w-4 h-4" />
                <span>Callbacks: {period.callback_count}</span>
              </div>

              {!period.acknowledged_by_driver && (
                <button
                  onClick={() => acknowledgeOnCall(period.id)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
                >
                  Acknowledge On-Call Period
                </button>
              )}

              {isActive && (
                <button
                  onClick={() => {
                    setCallbackForm({ ...callbackForm, on_call_period_id: period.id });
                    setShowCallbackForm(true);
                  }}
                  className="w-full mt-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium"
                >
                  Log Callback Trip
                </button>
              )}
            </div>
          );
        })
      )}
    </div>
  );

  const renderTripsTab = () => (
    <div className="space-y-4">
      {dashboardData.notifications.pending_reimbursements > 0 && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CurrencyDollar className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Pending Reimbursements
                </p>
                <p className="text-xs text-blue-600">
                  {dashboardData.notifications.pending_reimbursements} trip(s) -
                  ${dashboardData.notifications.pending_reimbursement_amount.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {dashboardData.recent_callback_trips.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center">
          <Navigation className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No recent callback trips</p>
        </div>
      ) : (
        dashboardData.recent_callback_trips.map((trip: CallbackTrip) => (
          <div key={trip.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {new Date(trip.trip_date).toLocaleDateString()}
                </h3>
                <p className="text-sm text-gray-600">{trip.purpose}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                trip.reimbursement_status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : trip.reimbursement_status === 'approved'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {trip.reimbursement_status}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="text-gray-600">
                  {trip.miles_driven} miles
                </span>
                {trip.used_private_vehicle && (
                  <span className="text-blue-600">Private Vehicle</span>
                )}
              </div>
              {trip.reimbursement_amount > 0 && (
                <span className="font-semibold text-green-600">
                  ${trip.reimbursement_amount.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );

  // Callback trip form modal
  const renderCallbackForm = () => {
    if (!showCallbackForm) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
        <div className="bg-white rounded-t-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Log Callback Trip</h2>
              <button
                onClick={() => setShowCallbackForm(false)}
                className="text-gray-500 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trip Date
                </label>
                <input
                  type="date"
                  value={callbackForm.trip_date}
                  onChange={(e) => setCallbackForm({ ...callbackForm, trip_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Miles Driven
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={callbackForm.miles_driven}
                  onChange={(e) => setCallbackForm({ ...callbackForm, miles_driven: e.target.value })}
                  placeholder="15.5"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purpose
                </label>
                <input
                  type="text"
                  value={callbackForm.purpose}
                  onChange={(e) => setCallbackForm({ ...callbackForm, purpose: e.target.value })}
                  placeholder="Emergency response to incident"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={callbackForm.notes}
                  onChange={(e) => setCallbackForm({ ...callbackForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="private-vehicle"
                  checked={callbackForm.used_private_vehicle}
                  onChange={(e) => setCallbackForm({ ...callbackForm, used_private_vehicle: e.target.checked })}
                  className="w-4 h-4 text-blue-600"
                />
                <label htmlFor="private-vehicle" className="text-sm text-gray-700">
                  Used private vehicle (eligible for reimbursement)
                </label>
              </div>

              <button
                onClick={submitCallbackTrip}
                disabled={!callbackForm.miles_driven || !callbackForm.purpose}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium disabled:bg-gray-400"
              >
                Submit Callback Trip
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6 pb-8">
        <h1 className="text-2xl font-bold">My Fleet Dashboard</h1>
        <p className="text-blue-100 mt-1">{user?.email}</p>

        {/* Status badges */}
        <div className="mt-4 flex gap-2 flex-wrap">
          <div className="bg-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
            <Car className="w-4 h-4" />
            {dashboardData.assignments.length} Assignment(s)
          </div>
          {dashboardData.notifications.unacknowledged_on_call > 0 && (
            <div className="bg-yellow-500 px-3 py-1 rounded-full text-sm flex items-center gap-1 animate-pulse">
              <AlertCircle className="w-4 h-4" />
              {dashboardData.notifications.unacknowledged_on_call} Needs Ack
            </div>
          )}
          {navigator.onLine ? (
            <div className="bg-green-500 px-3 py-1 rounded-full text-xs">
              ● Online
            </div>
          ) : (
            <div className="bg-gray-500 px-3 py-1 rounded-full text-xs">
              ● Offline
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 flex">
        <button
          onClick={() => setActiveTab('assignments')}
          className={`flex-1 py-4 text-center font-medium ${
            activeTab === 'assignments'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600'
          }`}
        >
          Assignments
        </button>
        <button
          onClick={() => setActiveTab('on-call')}
          className={`flex-1 py-4 text-center font-medium ${
            activeTab === 'on-call'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600'
          }`}
        >
          On-Call
        </button>
        <button
          onClick={() => setActiveTab('trips')}
          className={`flex-1 py-4 text-center font-medium ${
            activeTab === 'trips'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600'
          }`}
        >
          Trips
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'assignments' && renderAssignmentsTab()}
        {activeTab === 'on-call' && renderOnCallTab()}
        {activeTab === 'trips' && renderTripsTab()}
      </div>

      {/* Callback form modal */}
      {renderCallbackForm()}
    </div>
  );
};

export default MobileEmployeeDashboard;
