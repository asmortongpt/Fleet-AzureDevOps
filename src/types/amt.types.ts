// src/types/amt.types.ts

// FedRAMP/SOC 2 compliance: Ensure all interfaces include tenant_id for multi-tenant isolation

// Interface for ScanSession
export interface ScanSession {
  tenant_id: string;
  session_id: string;
  start_time: Date;
  end_time: Date;
  user_id: string;
  device_id: string;
}

// Interface for ScanEvent
export interface ScanEvent {
  tenant_id: string;
  event_id: string;
  session_id: string;
  timestamp: Date;
  asset_id: string;
  event_type: 'CHECKIN' | 'CHECKOUT';
}

// Interface for CheckoutRecord
export interface CheckoutRecord {
  tenant_id: string;
  record_id: string;
  asset_id: string;
  user_id: string;
  checkout_time: Date;
  expected_return_time: Date;
  actual_return_time?: Date;
  condition_on_return?: AssetCondition;
}

// Enum for AssetCondition
export enum AssetCondition {
  NEW = 'NEW',
  GOOD = 'GOOD',
  FAIR = 'FAIR',
  POOR = 'POOR',
  DAMAGED = 'DAMAGED'
}

// Interface for AssetLocation
export interface AssetLocation {
  tenant_id: string;
  location_id: string;
  name: string;
  latitude: number;
  longitude: number;
}

// Interface for Geofence
export interface Geofence {
  tenant_id: string;
  geofence_id: string;
  name: string;
  coordinates: Array<{ latitude: number; longitude: number }>;
}

// Interface for GeofenceRule
export interface GeofenceRule {
  tenant_id: string;
  rule_id: string;
  geofence_id: string;
  rule_type: 'ENTRY' | 'EXIT';
  action: string; // Define specific actions as needed
}

// Interface for GeofenceAlert
export interface GeofenceAlert {
  tenant_id: string;
  alert_id: string;
  geofence_id: string;
  triggered_at: Date;
  asset_id: string;
  rule_id: string;
}

// Interface for UtilizationReport
export interface UtilizationReport {
  tenant_id: string;
  report_id: string;
  asset_id: string;
  period_start: Date;
  period_end: Date;
  utilization_percentage: number;
}

// Interface for AssetDocument
export interface AssetDocument {
  tenant_id: string;
  document_id: string;
  asset_id: string;
  document_type: string;
  url: string;
  uploaded_at: Date;
}

// Interface for License
export interface License {
  tenant_id: string;
  license_id: string;
  name: string;
  valid_from: Date;
  valid_until: Date;
  asset_id: string;
}

// Interface for LicenseAllocation
export interface LicenseAllocation {
  tenant_id: string;
  allocation_id: string;
  license_id: string;
  user_id: string;
  allocated_at: Date;
  deallocated_at?: Date;
}

// Mock logger class to replace external dependency
class MockLogger {
  error(message: string, error: unknown): void {
    console.error(message, error);
  }
}

// Mock validation function to replace external dependency
function mockValidateInput(input: unknown): boolean {
  return !!input;
}

// Example function to demonstrate error handling and logging
function _exampleFunction(input: unknown): void {
  const logger = new MockLogger();

  try {
    // Validate input
    if (!mockValidateInput(input)) {
      throw new Error('Invalid input');
    }

    // Process input
    // ...
  } catch (error) {
    logger?.error('Error in exampleFunction:', error);
    // Handle error appropriately
  }
}