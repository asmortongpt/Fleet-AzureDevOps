/**
 * TypeScript interfaces for Fleet CTA MCP Server
 */

export interface Vehicle {
  id: number;
  vin: string;
  license_plate: string;
  make: string;
  model: string;
  year: number;
  type: string;
  status: string;
  mileage: number;
  fuel_type: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    timestamp: string;
  };
}

export interface Driver {
  id: number;
  name: string;
  license_number: string;
  license_state: string;
  license_expiry: string;
  status: string;
  email?: string;
  phone?: string;
  safety_score?: number;
}

export interface MaintenanceSchedule {
  id: number;
  vehicle_id: number;
  service_type: string;
  scheduled_date: string;
  status: string;
  mileage_threshold?: number;
  description?: string;
  cost_estimate?: number;
}

export interface WorkOrder {
  id: number;
  vehicle_id: number;
  work_order_number: string;
  description: string;
  status: string;
  priority: string;
  created_date: string;
  scheduled_date?: string;
  completed_date?: string;
  cost?: number;
}

export interface Inspection {
  id: number;
  vehicle_id: number;
  inspector_id?: number;
  inspection_type: string;
  inspection_date: string;
  status: string;
  passed: boolean;
  notes?: string;
}

export interface ComplianceStatus {
  total_vehicles: number;
  compliant_vehicles: number;
  non_compliant_vehicles: number;
  upcoming_inspections: number;
  expired_documents: number;
}

export interface FleetStats {
  total_vehicles: number;
  active_vehicles: number;
  in_maintenance: number;
  total_drivers: number;
  active_drivers: number;
  total_mileage: number;
  fuel_consumption: number;
  maintenance_costs: number;
}

export interface CostAnalysis {
  total_cost: number;
  fuel_costs: number;
  maintenance_costs: number;
  insurance_costs: number;
  depreciation: number;
  cost_per_vehicle: number;
  cost_per_mile: number;
  period: string;
}

export interface UtilizationReport {
  vehicle_id: number;
  vehicle_name: string;
  total_trips: number;
  total_miles: number;
  idle_time_hours: number;
  utilization_percentage: number;
  days_active: number;
}

export interface Route {
  id: number;
  name: string;
  driver_id?: number;
  vehicle_id?: number;
  status: string;
  start_location: string;
  end_location: string;
  scheduled_start: string;
  scheduled_end?: string;
  distance_miles?: number;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export type ResponseFormat = 'json' | 'markdown';

export interface ToolOptions {
  response_format?: ResponseFormat;
}
