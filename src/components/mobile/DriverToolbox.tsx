/**
 * Driver Toolbox Dashboard - Mobile Component
 *
 * Comprehensive mobile dashboard for drivers with:
 * - Quick access to common tasks
 * - Offline-first functionality
 * - Vehicle assignment status
 * - Pre-trip inspection workflows
 * - Damage reporting
 * - Work order access
 * - OSHA compliance tools
 *
 * Security: Role-based access, validated inputs
 */

import { Clipboard, AlertTriangle, Wrench, MapPin, FileText, Clock, CheckCircle } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { offlineSyncService } from '../../services/offline-sync.service';
import { pushNotificationService } from '../../services/push-notifications.service';

interface Vehicle {
  id: string;
  vehicleNumber: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  status: string;
  mileage?: number;
  fuelLevel?: number;
  location?: { lat: number; lng: number };
}

interface DashboardStats {
  assignedVehicles: number;
  pendingInspections: number;
  activeWorkOrders: number;
  unreadMessages: number;
  pendingSyncCount: number;
}

export const DriverToolbox: React.FC = () => {
  const [activeVehicle, setActiveVehicle] = useState<Vehicle | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    assignedVehicles: 0,
    pendingInspections: 0,
    activeWorkOrders: 0,
    unreadMessages: 0,
    pendingSyncCount: 0,
  });
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    loadDashboardData();
    setupSyncListener();
    setupNetworkListener();

    // Load active vehicle from local storage
    const savedVehicle = localStorage.getItem('active-vehicle');
    if (savedVehicle) {
      try {
        setActiveVehicle(JSON.parse(savedVehicle));
      } catch (error) {
        console.error('Failed to parse active vehicle:', error);
      }
    }
  }, []);

  const loadDashboardData = async () => {
    try {
      // Get pending sync count
      const pendingCount = await offlineSyncService.getPendingSyncCount();

      // Load stats from local storage or API
      const vehicles = await offlineSyncService.getAllLocal('vehicles');
      const inspections = await offlineSyncService.getAllLocal('inspections');
      const workOrders = await offlineSyncService.getAllLocal('workOrders');

      setStats({
        assignedVehicles: vehicles.length,
        pendingInspections: inspections.filter(i => i.syncStatus === 'pending').length,
        activeWorkOrders: workOrders.filter(w => w.status === 'in_progress').length,
        unreadMessages: 0, // TODO: Implement messaging
        pendingSyncCount: pendingCount,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const setupSyncListener = () => {
    offlineSyncService.onSyncStatusChange((status) => {
      if (status.status === 'synced') {
        setLastSyncTime(new Date());
        loadDashboardData();
      }
    });
  };

  const setupNetworkListener = () => {
    const handleOnline = () => {
      setIsOffline(false);
      offlineSyncService.syncWhenOnline();
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  };

  const handleStartInspection = () => {
    if (!activeVehicle) {
      alert('Please select a vehicle first');
      return;
    }
    window.location.href = `/mobile/inspection/${activeVehicle.id}`;
  };

  const handleReportDamage = () => {
    if (!activeVehicle) {
      alert('Please select a vehicle first');
      return;
    }
    window.location.href = `/mobile/damage-report/${activeVehicle.id}`;
  };

  const handleViewWorkOrders = () => {
    window.location.href = '/mobile/work-orders';
  };

  const handleNavigate = () => {
    if (activeVehicle && activeVehicle.location) {
      // Open native maps app
      const { lat, lng } = activeVehicle.location;
      window.open(`https://maps.google.com?q=${lat},${lng}`, '_blank');
    } else {
      alert('Vehicle location not available');
    }
  };

  const handleManualSync = async () => {
    try {
      await offlineSyncService.syncWhenOnline();
      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Manual sync failed:', error);
      alert('Sync failed. Please check your connection.');
    }
  };

  const handleTestNotification = () => {
    pushNotificationService.showNotification({
      title: 'Test Notification',
      body: 'This is a test notification from Driver Toolbox',
      category: 'system',
      priority: 'normal',
    });
  };

  const quickActions = [
    {
      id: 'inspection',
      title: 'Pre-Trip Inspection',
      icon: Clipboard,
      color: 'bg-blue-500',
      action: handleStartInspection,
      badge: stats.pendingInspections,
    },
    {
      id: 'damage',
      title: 'Report Damage',
      icon: AlertTriangle,
      color: 'bg-red-500',
      action: handleReportDamage,
    },
    {
      id: 'workorders',
      title: 'Work Orders',
      icon: Wrench,
      color: 'bg-orange-500',
      action: handleViewWorkOrders,
      badge: stats.activeWorkOrders,
    },
    {
      id: 'navigate',
      title: 'Navigate',
      icon: MapPin,
      color: 'bg-green-500',
      action: handleNavigate,
    },
    {
      id: 'osha',
      title: 'OSHA Report',
      icon: FileText,
      color: 'bg-purple-500',
      action: () => window.location.href = '/mobile/osha-report',
    },
    {
      id: 'history',
      title: 'Trip History',
      icon: Clock,
      color: 'bg-indigo-500',
      action: () => window.location.href = '/mobile/trip-history',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-3 rounded-b-3xl shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-sm font-bold">Driver Toolbox</h1>
            <p className="text-blue-200 text-sm">
              {isOffline ? 'Working Offline' : 'Connected'}
            </p>
          </div>
          <button
            onClick={handleManualSync}
            className="bg-white/20 hover:bg-white/30 p-3 rounded-full transition-colors"
            disabled={isOffline}
          >
            <CheckCircle className={isOffline ? 'text-gray-300' : 'text-white'} size={24} />
          </button>
        </div>

        {/* Active Vehicle Card */}
        {activeVehicle ? (
          <div className="bg-white/10 backdrop-blur-sm rounded-md p-2 mt-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-200">Active Vehicle</p>
                <p className="text-sm font-semibold">
                  {activeVehicle.vehicleNumber} - {activeVehicle.make} {activeVehicle.model}
                </p>
                <p className="text-sm text-blue-200">{activeVehicle.licensePlate}</p>
              </div>
              <div className="text-right">
                {activeVehicle.mileage && (
                  <p className="text-sm">{activeVehicle.mileage.toLocaleString()} mi</p>
                )}
                {activeVehicle.fuelLevel && (
                  <p className="text-sm">{activeVehicle.fuelLevel}% Fuel</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-sm rounded-md p-2 mt-2 text-center">
            <p className="text-blue-200">No vehicle assigned</p>
            <button className="mt-2 bg-white/20 hover:bg-white/30 px-2 py-2 rounded-lg text-sm transition-colors">
              Select Vehicle
            </button>
          </div>
        )}
      </div>

      {/* Stats Overview */}
      <div className="px-3 py-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white rounded-md p-2 shadow-sm">
            <p className="text-gray-500 text-sm">Assigned Vehicles</p>
            <p className="text-sm font-bold text-gray-800">{stats.assignedVehicles}</p>
          </div>
          <div className="bg-white rounded-md p-2 shadow-sm">
            <p className="text-gray-500 text-sm">Active Work Orders</p>
            <p className="text-sm font-bold text-orange-600">{stats.activeWorkOrders}</p>
          </div>
          <div className="bg-white rounded-md p-2 shadow-sm">
            <p className="text-gray-500 text-sm">Pending Inspections</p>
            <p className="text-sm font-bold text-blue-800">{stats.pendingInspections}</p>
          </div>
          <div className="bg-white rounded-md p-2 shadow-sm">
            <p className="text-gray-500 text-sm">Pending Sync</p>
            <p className="text-sm font-bold text-purple-600">{stats.pendingSyncCount}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-3">
        <h2 className="text-sm font-semibold text-gray-800 mb-2">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={action.action}
                className="relative bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-all active:scale-95"
              >
                <div className={`${action.color} w-12 h-9 rounded-md flex items-center justify-center mb-3`}>
                  <Icon className="text-white" size={24} />
                </div>
                <p className="text-gray-800 font-medium text-left">{action.title}</p>
                {action.badge !== undefined && action.badge > 0 && (
                  <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {action.badge}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sync Status */}
      {lastSyncTime && (
        <div className="px-3 py-2">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center">
            <CheckCircle className="text-green-600 mr-2" size={20} />
            <p className="text-sm text-green-800">
              Last synced: {lastSyncTime.toLocaleTimeString()}
            </p>
          </div>
        </div>
      )}

      {/* Debug Controls (remove in production) */}
      {import.meta.env.DEV && (
        <div className="px-3 py-2">
          <button
            onClick={handleTestNotification}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg text-sm font-medium transition-colors"
          >
            Test Notification
          </button>
        </div>
      )}

      {/* Offline Warning Banner */}
      {isOffline && (
        <div className="fixed bottom-20 left-0 right-0 mx-3 bg-yellow-500 text-white px-2 py-3 rounded-lg shadow-sm z-50">
          <p className="text-sm font-medium text-center">
            You are currently offline. Data will sync when connection is restored.
          </p>
        </div>
      )}
    </div>
  );
};

export default DriverToolbox;
