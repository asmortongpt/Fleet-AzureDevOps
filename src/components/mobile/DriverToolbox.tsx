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
import { toast } from 'sonner';

import { offlineSyncService } from '../../services/offline-sync.service';
import { pushNotificationService } from '../../services/push-notifications.service';

import { formatNumber, formatTime } from '@/utils/format-helpers';
import logger from '@/utils/logger';
import { formatVehicleShortName } from '@/utils/vehicle-display';

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
        logger.error('Failed to parse active vehicle:', error);
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

      // Fetch unread message count from API (falls back to 0 if offline or unavailable)
      let unreadCount = 0;
      try {
        const msgResponse = await fetch('/api/communications?status=unread&limit=1', {
          credentials: 'include',
          signal: AbortSignal.timeout(3000),
        });
        if (msgResponse.ok) {
          const msgData = await msgResponse.json();
          // Extract count from response envelope or array length
          const data = msgData?.data ?? msgData;
          unreadCount = Number(msgData?.meta?.total ?? (Array.isArray(data) ? data.length : 0));
        }
      } catch {
        // Silently fall back to 0 when offline or API unavailable
      }

      setStats({
        assignedVehicles: vehicles.length,
        pendingInspections: inspections.filter(i => i.syncStatus === 'pending').length,
        activeWorkOrders: workOrders.filter(w => w.status === 'in_progress').length,
        unreadMessages: unreadCount,
        pendingSyncCount: pendingCount,
      });
    } catch (error) {
      logger.error('Failed to load dashboard data:', error);
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
      toast.info('Please select a vehicle first');
      return;
    }
    window.location.href = `/mobile/inspection/${activeVehicle.id}`;
  };

  const handleReportDamage = () => {
    if (!activeVehicle) {
      toast.info('Please select a vehicle first');
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
      toast.info('Vehicle location not available');
    }
  };

  const handleManualSync = async () => {
    try {
      await offlineSyncService.syncWhenOnline();
      setLastSyncTime(new Date());
    } catch (error) {
      logger.error('Manual sync failed:', error);
      toast.error('Sync failed. Please check your connection.');
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
      color: 'bg-emerald-500/50',
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
      color: 'bg-amber-500',
      action: () => window.location.href = '/mobile/osha-report',
    },
    {
      id: 'history',
      title: 'Trip History',
      icon: Clock,
      color: 'bg-emerald-500',
      action: () => window.location.href = '/mobile/trip-history',
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--surface-0)] pb-20">
      {/* Header */}
      <div className="bg-[var(--surface-2)] text-white p-3 rounded-b-3xl border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-sm font-bold text-white">Driver Toolbox</h1>
            <p className="text-[var(--text-secondary)] text-sm">
              {isOffline ? 'Working Offline' : 'Connected'}
            </p>
          </div>
          <button
            onClick={handleManualSync}
            className="bg-white/[0.06] hover:bg-white/[0.1] p-3 rounded-full transition-colors"
            disabled={isOffline}
            aria-label="Sync now"
          >
            <CheckCircle className={isOffline ? 'text-[var(--text-tertiary)]' : 'text-white'} size={24} />
          </button>
        </div>

        {/* Active Vehicle Card */}
        {activeVehicle ? (
          <div className="bg-white/[0.05] rounded-md p-2 mt-2 border border-[var(--border-subtle)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Active Vehicle</p>
                <p className="text-sm font-semibold text-white">
                  {activeVehicle.vehicleNumber} - {formatVehicleShortName(activeVehicle)}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">{activeVehicle.licensePlate}</p>
              </div>
              <div className="text-right">
                {activeVehicle.mileage && (
                  <p className="text-sm text-white">{formatNumber(activeVehicle.mileage)} mi</p>
                )}
                {activeVehicle.fuelLevel && (
                  <p className="text-sm text-white">{activeVehicle.fuelLevel}% Fuel</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/[0.05] rounded-md p-2 mt-2 text-center border border-[var(--border-subtle)]">
            <p className="text-[var(--text-secondary)]">No vehicle assigned</p>
            <button className="mt-2 bg-white/[0.06] hover:bg-white/[0.1] px-2 py-2 rounded-lg text-sm transition-colors text-white">
              Select Vehicle
            </button>
          </div>
        )}
      </div>

      {/* Stats Overview */}
      <div className="px-3 py-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[var(--surface-2)] rounded-md p-2 border border-[var(--border-subtle)]">
            <p className="text-[var(--text-secondary)] text-sm">Assigned Vehicles</p>
            <p className="text-sm font-bold text-white">{stats.assignedVehicles}</p>
          </div>
          <div className="bg-[var(--surface-2)] rounded-md p-2 border border-[var(--border-subtle)]">
            <p className="text-[var(--text-secondary)] text-sm">Active Work Orders</p>
            <p className="text-sm font-bold text-orange-500">{stats.activeWorkOrders}</p>
          </div>
          <div className="bg-[var(--surface-2)] rounded-md p-2 border border-[var(--border-subtle)]">
            <p className="text-[var(--text-secondary)] text-sm">Pending Inspections</p>
            <p className="text-sm font-bold text-emerald-500">{stats.pendingInspections}</p>
          </div>
          <div className="bg-[var(--surface-2)] rounded-md p-2 border border-[var(--border-subtle)]">
            <p className="text-[var(--text-secondary)] text-sm">Pending Sync</p>
            <p className="text-sm font-bold text-amber-500">{stats.pendingSyncCount}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-3">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={action.action}
                className="relative bg-[var(--surface-2)] rounded-lg p-3 border border-[var(--border-subtle)] hover:bg-[#161616] transition-all active:scale-95"
              >
                <div className={`${action.color} w-12 h-9 rounded-md flex items-center justify-center mb-3`}>
                  <Icon className="text-white" size={24} />
                </div>
                <p className="text-[var(--text-primary)] font-medium text-left">{action.title}</p>
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
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 flex items-center">
            <CheckCircle className="text-emerald-500 mr-2" size={20} />
            <p className="text-sm text-emerald-400">
              Last synced: {formatTime(lastSyncTime)}
            </p>
          </div>
        </div>
      )}

      {/* Debug Controls (remove in production) */}
      {import.meta.env.DEV && (
        <div className="px-3 py-2">
          <button
            onClick={handleTestNotification}
            className="w-full bg-white/[0.06] hover:bg-white/[0.1] text-[var(--text-primary)] py-3 rounded-lg text-sm font-medium transition-colors"
          >
            Test Notification
          </button>
        </div>
      )}

      {/* Offline Warning Banner */}
      {isOffline && (
        <div className="fixed bottom-20 left-0 right-0 mx-3 bg-yellow-500 text-white px-2 py-3 rounded-lg z-50">
          <p className="text-sm font-medium text-center">
            You are currently offline. Data will sync when connection is restored.
          </p>
        </div>
      )}
    </div>
  );
};

export default DriverToolbox;
