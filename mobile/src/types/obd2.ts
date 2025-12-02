/**
 * OBD2 Data Types for Fleet Mobile App
 * Complete TypeScript interfaces for OBD2 diagnostics and live data
 */

// ============================================================================
// DTC (Diagnostic Trouble Code) Types
// ============================================================================

export enum DTCSeverity {
  CRITICAL = 'critical',
  WARNING = 'warning',
  INFORMATIONAL = 'informational',
}

export enum DTCStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  PERMANENT = 'permanent',
  CLEARED = 'cleared',
}

export enum DTCCategory {
  POWERTRAIN = 'P', // Engine and transmission
  CHASSIS = 'C', // ABS, steering, suspension
  BODY = 'B', // Body systems
  NETWORK = 'U', // Network and communication
}

export interface DTCCode {
  code: string; // e.g., "P0301"
  description: string;
  severity: DTCSeverity;
  status: DTCStatus;
  category: DTCCategory;
  detectedAt: Date;
  freezeFrameData?: FreezeFrameData;
  possibleCauses?: string[];
  recommendedActions?: string[];
}

// ============================================================================
// Freeze Frame Data
// ============================================================================

export interface FreezeFrameData {
  code: string; // Associated DTC code
  timestamp: Date;
  rpm: number;
  speed: number;
  coolantTemp: number;
  engineLoad: number;
  throttlePosition: number;
  fuelPressure: number;
  intakeAirTemp: number;
  maf: number; // Mass Air Flow
  shortTermFuelTrim: number;
  longTermFuelTrim: number;
}

// ============================================================================
// Live PID Data Types
// ============================================================================

export interface LivePIDData {
  timestamp: Date;
  rpm: number; // PID 0x0C - Engine RPM
  speed: number; // PID 0x0D - Vehicle Speed (km/h or mph)
  coolantTemp: number; // PID 0x05 - Engine Coolant Temperature (°C)
  engineLoad: number; // PID 0x04 - Calculated Engine Load (%)
  throttlePosition: number; // PID 0x11 - Throttle Position (%)
  fuelLevel: number; // PID 0x2F - Fuel Tank Level Input (%)
  fuelPressure: number; // PID 0x0A - Fuel Pressure (kPa)
  intakeAirTemp: number; // PID 0x0F - Intake Air Temperature (°C)
  maf: number; // PID 0x10 - Mass Air Flow (g/s)
  oilTemp?: number; // PID 0x5C - Engine Oil Temperature (°C)
  oilPressure?: number; // Not standardized, manufacturer-specific
  batteryVoltage: number; // PID 0x42 - Control Module Voltage (V)
  ambientAirTemp?: number; // PID 0x46 - Ambient Air Temperature (°C)

  // Fuel System
  shortTermFuelTrim: number; // PID 0x06 - Short Term Fuel Trim - Bank 1 (%)
  longTermFuelTrim: number; // PID 0x07 - Long Term Fuel Trim - Bank 1 (%)
  fuelSystemStatus: FuelSystemStatus;

  // Timing
  timingAdvance: number; // PID 0x0E - Timing Advance (° before TDC)

  // Pressure
  barometricPressure: number; // PID 0x33 - Barometric Pressure (kPa)
  intakeManifoldPressure: number; // PID 0x0B - Intake Manifold Absolute Pressure (kPa)

  // Oxygen Sensors
  o2Sensor1: O2SensorData;
  o2Sensor2?: O2SensorData;

  // Distance/Runtime
  distanceSinceClear: number; // PID 0x31 - Distance traveled since codes cleared (km)
  runtimeSinceStart: number; // PID 0x1F - Run time since engine start (seconds)

  // EGR
  egrError?: number; // PID 0x2D - EGR Error (%)

  // Evaporative System
  evapVaporPressure?: number; // PID 0x32 - Evap. System Vapor Pressure (Pa)
}

export enum FuelSystemStatus {
  OPEN_LOOP_INSUFFICIENT_TEMP = 'open_loop_insufficient_temp',
  CLOSED_LOOP = 'closed_loop',
  OPEN_LOOP_ENGINE_LOAD = 'open_loop_engine_load',
  OPEN_LOOP_SYSTEM_FAILURE = 'open_loop_system_failure',
  CLOSED_LOOP_FAULT = 'closed_loop_fault',
}

export interface O2SensorData {
  voltage: number; // Volts
  shortTermFuelTrim: number; // Percentage
}

// ============================================================================
// Readiness Monitors
// ============================================================================

export interface ReadinessMonitors {
  misfire: MonitorStatus;
  fuelSystem: MonitorStatus;
  components: MonitorStatus;
  catalyst?: MonitorStatus; // Spark ignition only
  heatedCatalyst?: MonitorStatus;
  evaporativeSystem?: MonitorStatus;
  secondaryAirSystem?: MonitorStatus;
  acRefrigerant?: MonitorStatus;
  oxygenSensor?: MonitorStatus;
  oxygenSensorHeater?: MonitorStatus;
  egrSystem?: MonitorStatus;
  noxScrMonitor?: MonitorStatus; // Compression ignition only
  boostPressure?: MonitorStatus;
  exhaustGasSensor?: MonitorStatus;
  pmFilterMonitoring?: MonitorStatus;
}

export enum MonitorStatus {
  COMPLETE = 'complete',
  INCOMPLETE = 'incomplete',
  NOT_SUPPORTED = 'not_supported',
}

// ============================================================================
// OBD2 Adapter Connection
// ============================================================================

export enum AdapterType {
  BLUETOOTH = 'bluetooth',
  WIFI = 'wifi',
  USB = 'usb',
}

export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}

export interface OBD2Adapter {
  id: string;
  name: string;
  type: AdapterType;
  macAddress?: string; // For Bluetooth
  ipAddress?: string; // For WiFi
  protocol: OBD2Protocol;
  firmwareVersion?: string;
}

export enum OBD2Protocol {
  AUTO = 'auto',
  SAE_J1850_PWM = 'SAE J1850 PWM',
  SAE_J1850_VPW = 'SAE J1850 VPW',
  ISO_9141_2 = 'ISO 9141-2',
  ISO_14230_4_KWP = 'ISO 14230-4 KWP',
  ISO_14230_4_KWP_FAST = 'ISO 14230-4 KWP (fast)',
  ISO_15765_4_CAN = 'ISO 15765-4 CAN',
  ISO_15765_4_CAN_B = 'ISO 15765-4 CAN (11-bit ID, 250 kbaud)',
  ISO_15765_4_CAN_C = 'ISO 15765-4 CAN (29-bit ID, 250 kbaud)',
  ISO_15765_4_CAN_D = 'ISO 15765-4 CAN (29-bit ID, 500 kbaud)',
}

export interface AdapterConnection {
  adapter: OBD2Adapter;
  status: ConnectionStatus;
  connectedAt?: Date;
  lastDataReceived?: Date;
  errorMessage?: string;
  signalStrength?: number; // For Bluetooth/WiFi (0-100)
}

// ============================================================================
// Live Data Streaming
// ============================================================================

export interface LiveDataStream {
  isStreaming: boolean;
  frequency: number; // Hz (updates per second)
  pids: string[]; // List of PIDs being monitored
  lastUpdate: Date;
  data: LivePIDData;
}

export interface LiveDataSubscription {
  id: string;
  pids: string[];
  frequency: number;
  callback: (data: Partial<LivePIDData>) => void;
}

// ============================================================================
// Vehicle Information
// ============================================================================

export interface VehicleInfo {
  vin: string; // Vehicle Identification Number
  make: string;
  model: string;
  year: number;
  engineType: EngineType;
  fuelType: FuelType;
  transmission: TransmissionType;
  odometer: number; // Miles or km
  lastServiceDate?: Date;
  lastServiceOdometer?: number;
}

export enum EngineType {
  SPARK_IGNITION = 'spark_ignition', // Gasoline
  COMPRESSION_IGNITION = 'compression_ignition', // Diesel
  HYBRID = 'hybrid',
  ELECTRIC = 'electric',
}

export enum FuelType {
  GASOLINE = 'gasoline',
  DIESEL = 'diesel',
  E85 = 'e85',
  CNG = 'cng',
  LPG = 'lpg',
  ELECTRIC = 'electric',
  HYBRID_GASOLINE = 'hybrid_gasoline',
  HYBRID_DIESEL = 'hybrid_diesel',
}

export enum TransmissionType {
  MANUAL = 'manual',
  AUTOMATIC = 'automatic',
  CVT = 'cvt',
  DCT = 'dct',
}

// ============================================================================
// Vehicle Diagnostics State
// ============================================================================

export interface VehicleDiagnostics {
  connection: AdapterConnection;
  vehicleInfo: VehicleInfo;
  dtcCodes: DTCCode[];
  readinessMonitors: ReadinessMonitors;
  liveData?: LiveDataStream;
  healthScore: number; // 0-100
  lastDiagnosticTime: Date;
  milStatus: boolean; // Malfunction Indicator Lamp (Check Engine Light)
  dtcCount: number;
}

// ============================================================================
// Commands and Actions
// ============================================================================

export interface ClearCodesRequest {
  vehicleId: string;
  confirmedBy: string; // User ID
  reason?: string;
}

export interface ClearCodesResponse {
  success: boolean;
  clearedCodes: string[];
  remainingCodes: string[];
  timestamp: Date;
  errorMessage?: string;
}

export interface DiagnosticReport {
  vehicleId: string;
  timestamp: Date;
  dtcCodes: DTCCode[];
  liveData: LivePIDData;
  readinessMonitors: ReadinessMonitors;
  healthScore: number;
  recommendations: string[];
  generatedBy: string; // User ID or 'system'
  format: 'pdf' | 'json' | 'csv';
}

// ============================================================================
// Historical Data
// ============================================================================

export interface HistoricalDataPoint {
  timestamp: Date;
  rpm: number;
  speed: number;
  coolantTemp: number;
  fuelLevel: number;
  engineLoad: number;
}

export interface HistoricalDataQuery {
  vehicleId: string;
  startTime: Date;
  endTime: Date;
  pids?: string[]; // Optional filter for specific PIDs
  aggregation?: 'raw' | 'minute' | 'hour' | 'day';
}

// ============================================================================
// Gauge Configuration
// ============================================================================

export interface GaugeConfig {
  id: string;
  label: string;
  unit: string;
  minValue: number;
  maxValue: number;
  warningThreshold: number;
  criticalThreshold: number;
  colorZones: ColorZone[];
  precision: number; // Decimal places
}

export interface ColorZone {
  from: number;
  to: number;
  color: string;
  label: 'normal' | 'warning' | 'critical';
}

// ============================================================================
// Predefined Gauge Configurations
// ============================================================================

export const GAUGE_CONFIGS: Record<string, GaugeConfig> = {
  rpm: {
    id: 'rpm',
    label: 'RPM',
    unit: 'RPM',
    minValue: 0,
    maxValue: 8000,
    warningThreshold: 6000,
    criticalThreshold: 7000,
    precision: 0,
    colorZones: [
      { from: 0, to: 5000, color: '#10b981', label: 'normal' },
      { from: 5000, to: 6500, color: '#f59e0b', label: 'warning' },
      { from: 6500, to: 8000, color: '#ef4444', label: 'critical' },
    ],
  },
  speed: {
    id: 'speed',
    label: 'Speed',
    unit: 'MPH',
    minValue: 0,
    maxValue: 140,
    warningThreshold: 100,
    criticalThreshold: 120,
    precision: 0,
    colorZones: [
      { from: 0, to: 80, color: '#10b981', label: 'normal' },
      { from: 80, to: 100, color: '#f59e0b', label: 'warning' },
      { from: 100, to: 140, color: '#ef4444', label: 'critical' },
    ],
  },
  coolantTemp: {
    id: 'coolantTemp',
    label: 'Coolant Temp',
    unit: '°F',
    minValue: 0,
    maxValue: 300,
    warningThreshold: 230,
    criticalThreshold: 260,
    precision: 0,
    colorZones: [
      { from: 0, to: 220, color: '#10b981', label: 'normal' },
      { from: 220, to: 250, color: '#f59e0b', label: 'warning' },
      { from: 250, to: 300, color: '#ef4444', label: 'critical' },
    ],
  },
  fuelLevel: {
    id: 'fuelLevel',
    label: 'Fuel Level',
    unit: '%',
    minValue: 0,
    maxValue: 100,
    warningThreshold: 20,
    criticalThreshold: 10,
    precision: 0,
    colorZones: [
      { from: 0, to: 15, color: '#ef4444', label: 'critical' },
      { from: 15, to: 30, color: '#f59e0b', label: 'warning' },
      { from: 30, to: 100, color: '#10b981', label: 'normal' },
    ],
  },
  oilPressure: {
    id: 'oilPressure',
    label: 'Oil Pressure',
    unit: 'PSI',
    minValue: 0,
    maxValue: 100,
    warningThreshold: 20,
    criticalThreshold: 10,
    precision: 0,
    colorZones: [
      { from: 0, to: 15, color: '#ef4444', label: 'critical' },
      { from: 15, to: 25, color: '#f59e0b', label: 'warning' },
      { from: 25, to: 100, color: '#10b981', label: 'normal' },
    ],
  },
  batteryVoltage: {
    id: 'batteryVoltage',
    label: 'Battery',
    unit: 'V',
    minValue: 0,
    maxValue: 16,
    warningThreshold: 12.5,
    criticalThreshold: 11.8,
    precision: 1,
    colorZones: [
      { from: 0, to: 12.2, color: '#ef4444', label: 'critical' },
      { from: 12.2, to: 12.8, color: '#f59e0b', label: 'warning' },
      { from: 12.8, to: 16, color: '#10b981', label: 'normal' },
    ],
  },
};

// ============================================================================
// Common DTC Code Descriptions
// ============================================================================

export const COMMON_DTC_DESCRIPTIONS: Record<string, { description: string; severity: DTCSeverity; causes: string[] }> = {
  P0300: {
    description: 'Random/Multiple Cylinder Misfire Detected',
    severity: DTCSeverity.CRITICAL,
    causes: ['Faulty spark plugs', 'Faulty ignition coils', 'Fuel system issues', 'Vacuum leaks'],
  },
  P0301: {
    description: 'Cylinder 1 Misfire Detected',
    severity: DTCSeverity.CRITICAL,
    causes: ['Bad spark plug', 'Faulty ignition coil', 'Fuel injector problem', 'Low compression'],
  },
  P0302: {
    description: 'Cylinder 2 Misfire Detected',
    severity: DTCSeverity.CRITICAL,
    causes: ['Bad spark plug', 'Faulty ignition coil', 'Fuel injector problem', 'Low compression'],
  },
  P0303: {
    description: 'Cylinder 3 Misfire Detected',
    severity: DTCSeverity.CRITICAL,
    causes: ['Bad spark plug', 'Faulty ignition coil', 'Fuel injector problem', 'Low compression'],
  },
  P0304: {
    description: 'Cylinder 4 Misfire Detected',
    severity: DTCSeverity.CRITICAL,
    causes: ['Bad spark plug', 'Faulty ignition coil', 'Fuel injector problem', 'Low compression'],
  },
  P0420: {
    description: 'Catalyst System Efficiency Below Threshold (Bank 1)',
    severity: DTCSeverity.WARNING,
    causes: ['Faulty catalytic converter', 'Exhaust leak', 'Faulty oxygen sensor', 'Engine misfire'],
  },
  P0430: {
    description: 'Catalyst System Efficiency Below Threshold (Bank 2)',
    severity: DTCSeverity.WARNING,
    causes: ['Faulty catalytic converter', 'Exhaust leak', 'Faulty oxygen sensor', 'Engine misfire'],
  },
  P0171: {
    description: 'System Too Lean (Bank 1)',
    severity: DTCSeverity.WARNING,
    causes: ['Vacuum leak', 'Faulty MAF sensor', 'Faulty oxygen sensor', 'Fuel pump issues'],
  },
  P0174: {
    description: 'System Too Lean (Bank 2)',
    severity: DTCSeverity.WARNING,
    causes: ['Vacuum leak', 'Faulty MAF sensor', 'Faulty oxygen sensor', 'Fuel pump issues'],
  },
  P0442: {
    description: 'Evaporative Emission System Leak Detected (Small Leak)',
    severity: DTCSeverity.INFORMATIONAL,
    causes: ['Loose gas cap', 'Cracked EVAP hose', 'Faulty purge valve', 'Leaking fuel tank'],
  },
  P0455: {
    description: 'Evaporative Emission System Leak Detected (Large Leak)',
    severity: DTCSeverity.WARNING,
    causes: ['Missing gas cap', 'Damaged EVAP hose', 'Faulty purge valve', 'Fuel tank leak'],
  },
  P0128: {
    description: 'Coolant Thermostat (Coolant Temperature Below Thermostat Regulating Temperature)',
    severity: DTCSeverity.WARNING,
    causes: ['Faulty thermostat', 'Low coolant level', 'Faulty coolant temperature sensor'],
  },
  P0401: {
    description: 'Exhaust Gas Recirculation Flow Insufficient Detected',
    severity: DTCSeverity.WARNING,
    causes: ['Clogged EGR passages', 'Faulty EGR valve', 'Vacuum hose leak'],
  },
  P0505: {
    description: 'Idle Control System Malfunction',
    severity: DTCSeverity.WARNING,
    causes: ['Dirty throttle body', 'Faulty IAC valve', 'Vacuum leak', 'Carbon buildup'],
  },
  P0340: {
    description: 'Camshaft Position Sensor Circuit Malfunction',
    severity: DTCSeverity.CRITICAL,
    causes: ['Faulty camshaft position sensor', 'Wiring issues', 'Timing belt/chain problem'],
  },
  P0335: {
    description: 'Crankshaft Position Sensor Circuit Malfunction',
    severity: DTCSeverity.CRITICAL,
    causes: ['Faulty crankshaft position sensor', 'Wiring issues', 'Damaged reluctor wheel'],
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert Celsius to Fahrenheit
 */
export const celsiusToFahrenheit = (celsius: number): number => {
  return (celsius * 9) / 5 + 32;
};

/**
 * Convert km/h to mph
 */
export const kmhToMph = (kmh: number): number => {
  return kmh * 0.621371;
};

/**
 * Convert kPa to PSI
 */
export const kpaToPsi = (kpa: number): number => {
  return kpa * 0.145038;
};

/**
 * Get DTC category from code
 */
export const getDTCCategory = (code: string): DTCCategory => {
  const firstChar = code.charAt(0).toUpperCase();
  return firstChar as DTCCategory;
};

/**
 * Check if DTC code is valid format
 */
export const isValidDTCCode = (code: string): boolean => {
  const dtcRegex = /^[PCBU][0-3][0-9A-F]{3}$/i;
  return dtcRegex.test(code);
};
