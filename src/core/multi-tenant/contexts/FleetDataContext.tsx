import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import logger from '@/utils/logger';

export interface Vehicle {
  id: string;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  status: 'active' | 'maintenance' | 'out_of_service' | 'reserved' | 'idle';
  driver?: string;
  driverId?: string;
  location: {
    lat: number | null;
    lng: number | null;
    address: string;
    lastUpdate: Date | null;
  }
  fuel: {
    level: number;
    capacity: number;
    efficiency: number
  }
  mileage: number;
  nextMaintenance: Date | null;
  department: string;
  ownership: 'owned' | 'leased' | null;
  batteryLevel?: number;
  features: string[]
}

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  phone: string;
  email: string;
  department: string;
  vehicleId?: string;
  status: 'active' | 'inactive' | 'on_leave';
  certifications: string[];
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  }
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  type: 'scheduled' | 'repair' | 'inspection' | 'recall';
  description: string;
  cost: number;
  date: Date;
  nextServiceDate?: Date;
  mileage: number;
  vendor: string;
  status: 'completed' | 'pending' | 'overdue';
}

interface FleetDataContextType {
  vehicles: Vehicle[];
  drivers: Driver[];
  maintenanceRecords: MaintenanceRecord[];
  isLoading: boolean;
  error: string | null;

  // Vehicle operations
  getVehicle: (id: string) => Vehicle | undefined;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  filterVehicles: (filter: Partial<Vehicle>) => Vehicle[];

  // Driver operations
  getDriver: (id: string) => Driver | undefined;
  updateDriver: (id: string, updates: Partial<Driver>) => void;
  assignDriver: (vehicleId: string, driverId: string) => void;
  unassignDriver: (vehicleId: string) => void;

  // Maintenance operations
  getMaintenanceHistory: (vehicleId: string) => MaintenanceRecord[];
  addMaintenanceRecord: (record: Omit<MaintenanceRecord, 'id'>) => void;

  // Data refresh
  refreshData: () => Promise<void>;
}

const FleetDataContext = createContext<FleetDataContextType | undefined>(undefined);

export const useFleetData = () => {
  const context = useContext(FleetDataContext);
  if (context === undefined) {
    throw new Error('useFleetData must be used within a FleetDataProvider');
  }
  return context;
};

interface FleetDataProviderProps {
  children: ReactNode;
}

export const FleetDataProvider: React.FC<FleetDataProviderProps> = ({ children }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // API configuration
  // Prefer same-origin `/api` (Vite proxies this in dev); allow overriding via VITE_API_URL.
  const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

  const fetchFleetData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch vehicles
      const vehiclesResponse = await fetch(`${API_BASE}/vehicles?limit=200`, { credentials: 'include' });
      if (!vehiclesResponse.ok) {
        throw new Error(`Failed to fetch vehicles: ${vehiclesResponse.status}`);
    }
      const vehiclesData = await vehiclesResponse.json();
      const vehicleRows = Array.isArray(vehiclesData) ? vehiclesData : vehiclesData.data || [];

      // Transform API data to match our interface
      const transformedVehicles: Vehicle[] = vehicleRows
        .filter((vehicle: any) => Boolean(vehicle?.id))
        .map((vehicle: any) => ({
        id: vehicle.id,
        plateNumber: vehicle.license_plate || vehicle.plate_number || '',
        make: vehicle.make || '',
        model: vehicle.model || '',
        year: Number(vehicle.year) || 0,
        vin: vehicle.vin || '',
        status: vehicle.status || 'active',
        driver: vehicle.assigned_driver || vehicle.driver_name,
        driverId: vehicle.driver_id,
        location: {
          lat: Number.isFinite(vehicle.coordinates?.lat)
            ? Number(vehicle.coordinates.lat)
            : Number.isFinite(vehicle.location?.lat)
              ? Number(vehicle.location.lat)
              : null,
          lng: Number.isFinite(vehicle.coordinates?.lng)
            ? Number(vehicle.coordinates.lng)
            : Number.isFinite(vehicle.location?.lng)
              ? Number(vehicle.location.lng)
              : null,
          address: vehicle.current_location || vehicle.location || '',
          lastUpdate: vehicle.last_updated ? new Date(vehicle.last_updated) : null
        },
        fuel: {
          level: Number(vehicle.fuel_level) || 0,
          capacity: Number(vehicle.fuel_capacity) || 0,
          efficiency: Number(vehicle.fuel_efficiency) || 0
        },
        mileage: vehicle.odometer_reading || vehicle.mileage || 0,
        nextMaintenance: vehicle.next_service_date ? new Date(vehicle.next_service_date) : null,
        department: vehicle.department || '',
        ownership: vehicle.ownership || null,
        batteryLevel: vehicle.battery_level,
        features: vehicle.features || []
      }));

      setVehicles(transformedVehicles);

      // Fetch drivers
      const driversResponse = await fetch(`${API_BASE}/drivers?limit=200`, { credentials: 'include' });
      if (!driversResponse.ok) {
        throw new Error(`Failed to fetch drivers: ${driversResponse.status}`);
      }
      const driversPayload = await driversResponse.json();
      const driverRows = Array.isArray(driversPayload) ? driversPayload : driversPayload.data || [];

      const transformedDrivers: Driver[] = driverRows.map((driver: any) => ({
        id: driver.id,
        name: `${driver.first_name || ''} ${driver.last_name || ''}`.trim(),
        licenseNumber: driver.license_number || '',
        phone: driver.phone || '',
        email: driver.email || '',
        department: driver.metadata?.department || 'Operations',
        vehicleId: driver.vehicle_id,
        status: driver.status || 'active',
        certifications: driver.metadata?.certifications || [],
        emergencyContact: driver.metadata?.emergency_contact || { name: '', phone: '', relationship: '' }
      }));

      setDrivers(transformedDrivers);

      // Fetch maintenance/work orders
      const maintenanceResponse = await fetch(`${API_BASE}/work-orders?limit=200`, { credentials: 'include' });
      if (!maintenanceResponse.ok) {
        throw new Error(`Failed to fetch maintenance records: ${maintenanceResponse.status}`);
      }
      const maintenancePayload = await maintenanceResponse.json();
      const maintenanceRows = Array.isArray(maintenancePayload) ? maintenancePayload : maintenancePayload.data || [];

      const transformedMaintenance: MaintenanceRecord[] = maintenanceRows.map((record: any) => ({
        id: record.id,
        vehicleId: record.vehicle_id,
        type: record.type || 'scheduled',
        description: record.description || record.title || 'Maintenance activity',
        cost: Number(record.actual_cost ?? record.estimated_cost ?? 0),
        date: new Date(record.actual_end || record.created_at || Date.now()),
        nextServiceDate: record.scheduled_end ? new Date(record.scheduled_end) : undefined,
        mileage: Number(record.odometer_reading || 0),
        vendor: record.metadata?.vendor || 'Internal Shop',
        status: record.status === 'completed' ? 'completed' : record.status === 'overdue' ? 'overdue' : 'pending'
      }));

      setMaintenanceRecords(transformedMaintenance);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch fleet data';
      setError(errorMessage);
      logger.error('Fleet data fetch error:', err)
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFleetData();
  }, []);

  const getVehicle = (id: string): Vehicle | undefined => {
    return vehicles.find(vehicle => vehicle.id === id);
  }

  const updateVehicle = (id: string, updates: Partial<Vehicle>) => {
    setVehicles(prev => prev.map(vehicle =>
      vehicle.id === id ? { ...vehicle, ...updates } : vehicle
    ))
  };

  const filterVehicles = (filter: Partial<Vehicle>): Vehicle[] => {
    return vehicles.filter(vehicle => {
      return Object.entries(filter).every(([key, value]) => {
        if (value === undefined || value === null || value === '') return true;
        return vehicle[key as keyof Vehicle] === value;
      });
    });
  };

  const getDriver = (id: string): Driver | undefined => {
    return drivers.find(driver => driver.id === id);
  }

  const updateDriver = (id: string, updates: Partial<Driver>) => {
    setDrivers(prev => prev.map(driver =>
      driver.id === id ? { ...driver, ...updates } : driver
    ))
  };

  const assignDriver = (vehicleId: string, driverId: string) => {
    // Update vehicle with driver assignment
    updateVehicle(vehicleId, { driverId });

    // Update driver with vehicle assignment
    updateDriver(driverId, { vehicleId });
  };

  const unassignDriver = (vehicleId: string) => {
    const vehicle = getVehicle(vehicleId);
    if (vehicle?.driverId) {
      updateDriver(vehicle.driverId, { vehicleId: undefined })
    }
    updateVehicle(vehicleId, { driverId: undefined, driver: undefined })
  };

  const getMaintenanceHistory = (vehicleId: string): MaintenanceRecord[] => {
    return maintenanceRecords.filter(record => record.vehicleId === vehicleId);
  }

  const addMaintenanceRecord = (record: Omit<MaintenanceRecord, 'id'>) => {
    const newRecord: MaintenanceRecord = {
      ...record,
      id: `MNT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    setMaintenanceRecords(prev => [...prev, newRecord]);
  };

  const refreshData = async () => {
    await fetchFleetData();
  }

  const value: FleetDataContextType = {
    vehicles,
    drivers,
    maintenanceRecords,
    isLoading,
    error,
    getVehicle,
    updateVehicle,
    filterVehicles,
    getDriver,
    updateDriver,
    assignDriver,
    unassignDriver,
    getMaintenanceHistory,
    addMaintenanceRecord,
    refreshData
  }

  return (
    <FleetDataContext.Provider value={value}>
      {children}
    </FleetDataContext.Provider>
  )
};
