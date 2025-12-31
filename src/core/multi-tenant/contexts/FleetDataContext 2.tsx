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
    lat: number;
    lng: number;
    address: string;
    lastUpdate: Date;
  };
  fuel: {
    level: number;
    capacity: number;
    efficiency: number;
  };
  mileage: number;
  nextMaintenance: Date;
  department: string;
  ownership: 'owned' | 'leased';
  batteryLevel?: number;
  features: string[];
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
  };
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
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5557/api';

  const fetchFleetData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch vehicles
      const vehiclesResponse = await fetch(`${API_BASE}/vehicles`);
      if (!vehiclesResponse.ok) {
        throw new Error(`Failed to fetch vehicles: ${vehiclesResponse.status}`);
      }
      const vehiclesData = await vehiclesResponse.json();

      // Transform API data to match our interface
      const transformedVehicles: Vehicle[] = vehiclesData.map((vehicle: any) => ({
        id: vehicle.id || `VEH-${Math.random().toString(36).substr(2, 9)}`,
        plateNumber: vehicle.license_plate || vehicle.plate_number || '',
        make: vehicle.make || '',
        model: vehicle.model || '',
        year: vehicle.year || new Date().getFullYear(),
        vin: vehicle.vin || '',
        status: vehicle.status || 'active',
        driver: vehicle.assigned_driver || vehicle.driver_name,
        driverId: vehicle.driver_id,
        location: {
          lat: vehicle.coordinates?.lat || vehicle.location?.lat || 30.4518,
          lng: vehicle.coordinates?.lng || vehicle.location?.lng || -84.27277,
          address: vehicle.current_location || vehicle.location || 'Tallahassee, FL',
          lastUpdate: new Date(vehicle.last_updated || Date.now())
        },
        fuel: {
          level: vehicle.fuel_level || 0,
          capacity: vehicle.fuel_capacity || 100,
          efficiency: vehicle.fuel_efficiency || 25
        },
        mileage: vehicle.odometer_reading || vehicle.mileage || 0,
        nextMaintenance: new Date(vehicle.next_service_date || Date.now() + 30 * 24 * 60 * 60 * 1000),
        department: vehicle.department || 'General Fleet',
        ownership: vehicle.ownership || 'owned',
        batteryLevel: vehicle.battery_level,
        features: vehicle.features || []
      }));

      setVehicles(transformedVehicles);

      // TODO: Fetch drivers and maintenance records from API
      // For now, using mock data
      setDrivers([]);
      setMaintenanceRecords([]);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch fleet data';
      setError(errorMessage);
      logger.error('Fleet data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFleetData();
  }, []);

  const getVehicle = (id: string): Vehicle | undefined => {
    return vehicles.find(vehicle => vehicle.id === id);
  };

  const updateVehicle = (id: string, updates: Partial<Vehicle>) => {
    setVehicles(prev => prev.map(vehicle =>
      vehicle.id === id ? { ...vehicle, ...updates } : vehicle
    ));
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
  };

  const updateDriver = (id: string, updates: Partial<Driver>) => {
    setDrivers(prev => prev.map(driver =>
      driver.id === id ? { ...driver, ...updates } : driver
    ));
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
      updateDriver(vehicle.driverId, { vehicleId: undefined });
    }
    updateVehicle(vehicleId, { driverId: undefined, driver: undefined });
  };

  const getMaintenanceHistory = (vehicleId: string): MaintenanceRecord[] => {
    return maintenanceRecords.filter(record => record.vehicleId === vehicleId);
  };

  const addMaintenanceRecord = (record: Omit<MaintenanceRecord, 'id'>) => {
    const newRecord: MaintenanceRecord = {
      ...record,
      id: `MNT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    setMaintenanceRecords(prev => [...prev, newRecord]);
  };

  const refreshData = async () => {
    await fetchFleetData();
  };

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
  };

  return (
    <FleetDataContext.Provider value={value}>
      {children}
    </FleetDataContext.Provider>
  );
};