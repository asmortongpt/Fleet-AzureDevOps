/**
 * Vehicle Condition Types
 * 
 * Created: 2026-01-08
 */

export interface VehicleCondition {
  assetId: string;
  lastUpdated: Date;
  mileage: {
    current: number;
    unit: 'miles' | 'kilometers';
    lastRecorded: Date;
  };
  engine: {
    oilLife: number; // percentage 0-100
    lastOilChange: Date;
    nextOilChangeDue: number; // mileage
    oilType: string;
    coolantLevel: 'low' | 'normal' | 'high';
    coolantLastChecked: Date;
  };
  transmission: {
    fluidLevel: 'low' | 'normal' | 'high';
    lastService: Date;
    condition: 'good' | 'fair' | 'poor';
  };
  brakes: {
    frontPadLife: number; // percentage
    rearPadLife: number; // percentage
    fluidLevel: 'low' | 'normal' | 'high';
    lastInspection: Date;
  };
  tires: {
    frontLeft: TireCondition;
    frontRight: TireCondition;
    rearLeft: TireCondition;
    rearRight: TireCondition;
    spareCondition?: 'good' | 'fair' | 'poor' | 'missing';
    lastRotation?: Date;
  };
  battery: {
    health: number; // percentage 0-100
    voltage: number;
    lastTested: Date;
    manufactureDate?: Date;
    warrantyExpires?: Date;
  };
  fluids: {
    powerSteering: 'low' | 'normal' | 'high';
    washerFluid: 'low' | 'normal' | 'full';
    differentialOil?: 'low' | 'normal' | 'high';
  };
  filters: {
    airFilter: 'clean' | 'dirty' | 'replace';
    cabinFilter: 'clean' | 'dirty' | 'replace';
    fuelFilter?: 'good' | 'replace';
    lastReplaced: Date;
  };
  diagnostics: {
    checkEngineLightOn: boolean;
    diagnosticCodes: DiagnosticCode[];
    lastScan: Date;
  };
  nextScheduledService: {
    type: string;
    dueDate: Date;
    dueMileage: number;
    description: string;
  };
}

export interface TireCondition {
  treadDepth: number; // mm or 1/32 inch
  pressure: number; // PSI
  recommendedPressure: number;
  condition: 'good' | 'fair' | 'worn' | 'replace';
  brand?: string;
  model?: string;
  installedDate?: Date;
}

export interface DiagnosticCode {
  code: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  detectedDate: Date;
  resolved: boolean;
}

export interface ServiceRecord {
  id: string;
  assetId: string;
  date: Date;
  mileage: number;
  serviceType: ServiceType;
  description: string;
  performedBy: string;
  location: string;
  cost: number;
  parts: ServicePart[];
  labor: {
    hours: number;
    rate: number;
  };
  notes?: string;
  invoiceUrl?: string;
  nextServiceDue?: {
    date: Date;
    mileage: number;
  };
}

export type ServiceType =
  | 'oil_change'
  | 'tire_rotation'
  | 'brake_service'
  | 'transmission_service'
  | 'coolant_flush'
  | 'air_filter'
  | 'inspection'
  | 'repair'
  | 'diagnostic'
  | 'battery_replacement'
  | 'tire_replacement'
  | 'alignment'
  | 'other';

export interface ServicePart {
  name: string;
  partNumber?: string;
  quantity: number;
  cost: number;
  warranty?: {
    duration: number;
    unit: 'months' | 'miles' | 'kilometers';
  };
}

export interface MaintenanceSchedule {
  assetId: string;
  make: string;
  model: string;
  year: number;
  schedules: ScheduledMaintenance[];
}

export interface ScheduledMaintenance {
  type: ServiceType;
  name: string;
  description: string;
  intervalMileage?: number;
  intervalMonths?: number;
  priority: 'critical' | 'important' | 'routine';
  estimatedCost: {
    min: number;
    max: number;
  };
  estimatedDuration: number; // hours
}
