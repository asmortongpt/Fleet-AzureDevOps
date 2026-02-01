import { Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { DriverDrilldownView, Driver } from './drilldown/DriverDrilldownView';
import { MaintenanceDrilldownView, MaintenanceRecord } from './drilldown/MaintenanceDrilldownView';
import { VehicleDrilldownView } from './drilldown/VehicleDrilldownView';
import { DrilldownPanel } from './shared/DrilldownPanel';

import { useDrilldown } from '@/contexts/DrilldownContext';
import { useMultiLevelDrilldown } from '@/hooks/useMultiLevelDrilldown';
import { api } from '@/services/api';
import { Vehicle } from '@/types';
import logger from '@/utils/logger';

/**
 * DrilldownSystem - Universal Multi-Level Drilldown with Excel Views
 *
 * This component automatically renders the correct Excel-style table
 * based on the drilldown type, with full filtering, sorting, and export.
 */
export function DrilldownSystem() {
  const drilldownContext = useDrilldown();
  const { levels: contextLevels } = drilldownContext;
  const { levels, isOpen, push, navigateToLevel, close } = useMultiLevelDrilldown();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // React to drilldown context changes
  useEffect(() => {
    if (contextLevels.length === 0) {
      close();
      return;
    }

    const currentDrilldown = contextLevels[contextLevels.length - 1];
    handleDrilldownRequest(currentDrilldown);
  }, [contextLevels]);

  const handleDrilldownRequest = async (drilldown: any) => {
    setLoading(true);
    setError(null);

    try {
      const component = await renderDrilldownComponent(drilldown);
      push(
        {
          id: drilldown.id,
          type: drilldown.type,
          label: drilldown.label,
          data: drilldown.data
        },
        component
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load drilldown');
      logger.error('Drilldown error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderDrilldownComponent = async (drilldown: any): Promise<React.ReactNode> => {
    const { type, data } = drilldown;

    switch (type) {
      case 'active-vehicles-excel':
      case 'fleet-overview':
        return renderVehicleDrilldown(data);

      case 'maintenance-records-excel':
        return renderMaintenanceDrilldown(data);

      case 'driver-details':
        return renderDriverDrilldown(data);

      case 'utilization-data-excel':
        return renderUtilizationDrilldown(data);

      case 'cost-analysis-excel':
        return renderCostAnalysisDrilldown(data);

      default:
        return <div className="p-3 text-center text-slate-400">
          <p>Drilldown type "{type}" not yet implemented</p>
          <p className="text-sm mt-2">Check DrilldownSystem.tsx to add this view</p>
        </div>;
    }
  };

  const renderVehicleDrilldown = async (data: any) => {
    try {
      // Fetch vehicles from API
      const response = await api.get('/vehicles');
      const vehicles: Vehicle[] = response.data.data || [];

      // Apply filters if provided
      let filteredVehicles = vehicles;
      if (data?.filter) {
        filteredVehicles = vehicles.filter((v: Vehicle) => {
          switch (data.filter) {
            case 'active':
              return v.status === 'active';
            case 'maintenance':
            case 'service':
              return v.status === 'service';
            case 'inactive':
            case 'offline':
              return v.status === 'offline';
            default:
              return true;
          }
        });
      }

      return (
        <VehicleDrilldownView
          vehicles={filteredVehicles}
          title={data?.filter ? `${data.filter.toUpperCase()} Vehicles` : 'All Vehicles'}
          onVehicleClick={(vehicle) => {
            // Second-level drilldown: individual vehicle details
            push(
              {
                id: `vehicle-${vehicle.number}`,
                type: 'vehicle-detail',
                label: `Vehicle ${vehicle.number}`,
                data: { vehicle }
              },
              <div className="p-3 bg-slate-900/95 rounded-lg">
                <h3 className="text-sm font-bold text-white mb-3">Vehicle Details: {vehicle.number}</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm text-slate-400">Make / Model</label>
                      <p className="text-sm text-white">{vehicle.make} {vehicle.model} ({vehicle.year})</p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">VIN</label>
                      <p className="text-sm text-white font-mono">{vehicle.vin}</p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">Status</label>
                      <p className="text-sm text-white capitalize">{vehicle.status}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm text-slate-400">Mileage</label>
                      <p className="text-sm text-white">{vehicle.mileage?.toLocaleString()} mi</p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">Driver</label>
                      <p className="text-sm text-white">{vehicle.assignedDriver || 'Unassigned'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">Facility</label>
                      <p className="text-sm text-white">{vehicle.department}</p>
                    </div>
                  </div>
                </div>
                {/* Could add more detailed tabs here: history, maintenance, etc. */}
              </div>
            );
          }}
        />
      );
    } catch (err) {
      logger.error('Failed to load vehicles:', err);
      return <div className="p-3 text-center text-red-400">Failed to load vehicle data</div>;
    }
  };

  const renderMaintenanceDrilldown = async (data: any) => {
    try {
      // In a real app, fetch from API
      // For now, generate mock data
      const mockRecords: MaintenanceRecord[] = Array.from({ length: 50 }, (_, i) => ({
        id: `maint-${i + 1}`,
        vehicle_id: `veh-${Math.floor(Math.random() * 100) + 1}`,
        unit_number: `TLH-${(Math.floor(Math.random() * 900) + 100)}`,
        service_type: ['Oil Change', 'Tire Rotation', 'Brake Service', 'Inspection'][Math.floor(Math.random() * 4)],
        description: 'Routine maintenance service',
        service_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        mileage: Math.floor(Math.random() * 100000) + 50000,
        cost: Math.floor(Math.random() * 1000) + 100,
        technician: ['John Smith', 'Jane Doe', 'Mike Johnson'][Math.floor(Math.random() * 3)],
        facility: ['Main Garage', 'North Bay', 'South Station'][Math.floor(Math.random() * 3)],
        status: ['completed', 'in-progress', 'scheduled'][Math.floor(Math.random() * 3)] as any,
        priority: ['routine', 'urgent', 'emergency'][Math.floor(Math.random() * 3)] as any,
        labor_hours: Math.random() * 8,
      }));

      return (
        <MaintenanceDrilldownView
          records={mockRecords}
          onRecordClick={(record) => {
            // Second-level drilldown: individual record details
            push(
              {
                id: `maintenance-${record.id}`,
                type: 'maintenance-detail',
                label: `Maintenance ${record.id}`,
                data: { record }
              },
              <div className="p-3 bg-slate-900/95 rounded-lg">
                <h3 className="text-sm font-bold text-white mb-3">Maintenance Record: {record.id}</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm text-slate-400">Vehicle</label>
                      <p className="text-sm text-white">{record.unit_number}</p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">Service Type</label>
                      <p className="text-sm text-white">{record.service_type}</p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">Status</label>
                      <p className="text-sm text-white capitalize">{record.status}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm text-slate-400">Cost</label>
                      <p className="text-sm text-emerald-400 font-semibold">${record.cost.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">Technician</label>
                      <p className="text-sm text-white">{record.technician}</p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">Facility</label>
                      <p className="text-sm text-white">{record.facility}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          }}
        />
      );
    } catch (err) {
      logger.error('Failed to load maintenance records:', err);
      return <div className="p-3 text-center text-red-400">Failed to load maintenance data</div>;
    }
  };

  const renderDriverDrilldown = async (data: any) => {
    try {
      // In a real app, fetch from API
      const response = await api.get('/drivers');
      const drivers: Driver[] = response.data.data || [];

      return (
        <DriverDrilldownView
          drivers={drivers}
          onDriverClick={(driver) => {
            // Second-level drilldown: individual driver profile
            push(
              {
                id: `driver-${driver.driver_id}`,
                type: 'driver-profile',
                label: `${driver.first_name} ${driver.last_name}`,
                data: { driver }
              },
              <div className="p-3 bg-slate-900/95 rounded-lg">
                <h3 className="text-sm font-bold text-white mb-3">Driver Profile: {driver.first_name} {driver.last_name}</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm text-slate-400">Email</label>
                      <p className="text-sm text-white">{driver.email}</p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">Phone</label>
                      <p className="text-sm text-white">{driver.phone}</p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">License</label>
                      <p className="text-sm text-white font-mono">{driver.license_number} ({driver.license_state})</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm text-slate-400">Status</label>
                      <p className="text-sm text-white capitalize">{driver.status.replace('-', ' ')}</p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">Assigned Vehicle</label>
                      <p className="text-sm text-white">{driver.assigned_vehicle || 'None'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">Performance</label>
                      <p className="text-sm text-emerald-400 font-semibold">{driver.performance_score}/100</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          }}
        />
      );
    } catch (err) {
      logger.error('Failed to load drivers:', err);
      return <div className="p-3 text-center text-red-400">Failed to load driver data</div>;
    }
  };

  const renderUtilizationDrilldown = async (data: any) => {
    return <div className="p-3 text-center text-slate-400">
      <p className="text-base">Utilization Data View</p>
      <p className="text-sm mt-2">Excel-style utilization analytics coming soon</p>
    </div>;
  };

  const renderCostAnalysisDrilldown = async (data: any) => {
    return <div className="p-3 text-center text-slate-400">
      <p className="text-base">Cost Analysis View</p>
      <p className="text-sm mt-2">Excel-style cost breakdown coming soon</p>
    </div>;
  };

  if (!isOpen || levels.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="flex items-center gap-3 bg-slate-900/95 border border-slate-700/60 rounded-lg px-3 py-2">
          <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
          <span className="text-white">Loading drilldown...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-slate-900/95 border border-red-500/60 rounded-lg px-3 py-2 max-w-md">
          <p className="text-red-400 font-semibold">Error loading drilldown</p>
          <p className="text-slate-300 text-sm mt-2">{error}</p>
          <button
            onClick={close}
            className="mt-2 px-2 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <DrilldownPanel
      levels={levels}
      onClose={close}
      onNavigateToLevel={navigateToLevel}
    />
  );
}
