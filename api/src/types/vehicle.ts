export interface Vehicle {
  id: number;
  tenant_id: number;
  number?: string;
  make: string;
  model: string;
  year?: number;
  vin?: string;
  license_plate?: string;
  status?: string;
  mileage?: number;
  odometer?: number;
  fuel_level?: number;
  location?: any;
  assigned_driver_id?: number;
  assignedDriver?: string;
  department?: string;
  metadata?: Record<string, any>;
  created_at?: Date;
  updated_at?: Date;
}
