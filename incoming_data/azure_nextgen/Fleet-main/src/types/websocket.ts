/**
 * WebSocket Types and Event Schemas
 * Production-grade type definitions with Zod validation
 */

import { z } from 'zod';

/* ============================================================
   WebSocket Event Types
   ============================================================ */

export enum WSEventType {
  // Connection Events
  PING = 'ping',
  PONG = 'pong',
  CONNECTION_STATUS = 'connection:status',

  // Vehicle Events
  VEHICLE_LOCATION = 'vehicle:location',
  VEHICLE_STATUS = 'vehicle:status',
  VEHICLE_TELEMETRY = 'vehicle:telemetry',
  VEHICLE_ALERT = 'vehicle:alert',

  // Fleet Events
  FLEET_STATUS = 'fleet:status',
  FLEET_SUMMARY = 'fleet:summary',

  // Maintenance Events
  MAINTENANCE_ALERT = 'maintenance:alert',
  MAINTENANCE_DUE = 'maintenance:due',
  MAINTENANCE_COMPLETE = 'maintenance:complete',

  // Driver Events
  DRIVER_STATUS = 'driver:status',
  DRIVER_LOCATION = 'driver:location',
  DRIVER_ALERT = 'driver:alert',

  // Geofence Events
  GEOFENCE_BREACH = 'geofence:breach',
  GEOFENCE_ENTER = 'geofence:enter',
  GEOFENCE_EXIT = 'geofence:exit',

  // Fuel Events
  FUEL_ALERT = 'fuel:alert',
  FUEL_TRANSACTION = 'fuel:transaction',

  // Notification Events
  NOTIFICATION = 'notification',
  ALERT = 'alert',

  // System Events
  SYSTEM_STATUS = 'system:status',
  SYSTEM_ALERT = 'system:alert',
}

/* ============================================================
   Zod Validation Schemas
   ============================================================ */

// Base Message Schema
export const baseMessageSchema = z.object({
  type: z.string(),
  timestamp: z.string().datetime(),
  id: z.string().optional(),
});

// Vehicle Location Schema
export const vehicleLocationSchema = z.object({
  vehicleId: z.string(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speed: z.number().min(0).optional(),
  heading: z.number().min(0).max(360).optional(),
  altitude: z.number().optional(),
  accuracy: z.number().min(0).optional(),
  timestamp: z.string().datetime(),
});

// Vehicle Status Schema
export const vehicleStatusSchema = z.object({
  vehicleId: z.string(),
  status: z.enum(['active', 'idle', 'maintenance', 'offline', 'service']),
  battery: z.number().min(0).max(100).optional(),
  fuel: z.number().min(0).max(100).optional(),
  odometer: z.number().min(0).optional(),
  engineHours: z.number().min(0).optional(),
  timestamp: z.string().datetime(),
});

// Vehicle Telemetry Schema
export const vehicleTelemetrySchema = z.object({
  vehicleId: z.string(),
  rpm: z.number().min(0).optional(),
  speed: z.number().min(0).optional(),
  engineTemp: z.number().optional(),
  oilPressure: z.number().optional(),
  coolantTemp: z.number().optional(),
  batteryVoltage: z.number().optional(),
  fuelLevel: z.number().min(0).max(100).optional(),
  diagnosticCodes: z.array(z.string()).optional(),
  timestamp: z.string().datetime(),
});

// Maintenance Alert Schema
export const maintenanceAlertSchema = z.object({
  vehicleId: z.string(),
  alertType: z.enum(['due', 'overdue', 'critical', 'scheduled', 'completed']),
  service: z.string(),
  description: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  dueDate: z.string().datetime().optional(),
  odometer: z.number().optional(),
  estimatedCost: z.number().optional(),
  timestamp: z.string().datetime(),
});

// Fleet Status Schema
export const fleetStatusSchema = z.object({
  totalVehicles: z.number().min(0),
  active: z.number().min(0),
  idle: z.number().min(0),
  maintenance: z.number().min(0),
  offline: z.number().min(0),
  alerts: z.number().min(0),
  averageSpeed: z.number().min(0).optional(),
  totalMiles: z.number().min(0).optional(),
  fuelEfficiency: z.number().min(0).optional(),
  timestamp: z.string().datetime(),
});

// Driver Status Schema
export const driverStatusSchema = z.object({
  driverId: z.string(),
  status: z.enum(['active', 'inactive', 'on_break', 'off_duty']),
  vehicleId: z.string().optional(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
  hoursWorked: z.number().min(0).optional(),
  timestamp: z.string().datetime(),
});

// Geofence Breach Schema
export const geofenceBreachSchema = z.object({
  vehicleId: z.string(),
  geofenceId: z.string(),
  geofenceName: z.string(),
  breachType: z.enum(['enter', 'exit', 'dwell']),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  timestamp: z.string().datetime(),
});

// Fuel Alert Schema
export const fuelAlertSchema = z.object({
  vehicleId: z.string(),
  alertType: z.enum(['low', 'critical', 'theft', 'anomaly']),
  currentLevel: z.number().min(0).max(100),
  threshold: z.number().min(0).max(100).optional(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
  timestamp: z.string().datetime(),
});

// Notification Schema
export const notificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  message: z.string(),
  type: z.enum(['info', 'warning', 'error', 'success']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  category: z.string().optional(),
  actionUrl: z.string().optional(),
  timestamp: z.string().datetime(),
});

/* ============================================================
   TypeScript Types (inferred from Zod schemas)
   ============================================================ */

export type VehicleLocation = z.infer<typeof vehicleLocationSchema>;
export type VehicleStatus = z.infer<typeof vehicleStatusSchema>;
export type VehicleTelemetry = z.infer<typeof vehicleTelemetrySchema>;
export type MaintenanceAlert = z.infer<typeof maintenanceAlertSchema>;
export type FleetStatus = z.infer<typeof fleetStatusSchema>;
export type DriverStatus = z.infer<typeof driverStatusSchema>;
export type GeofenceBreach = z.infer<typeof geofenceBreachSchema>;
export type FuelAlert = z.infer<typeof fuelAlertSchema>;
export type Notification = z.infer<typeof notificationSchema>;

/* ============================================================
   WebSocket Message Type
   ============================================================ */

export interface WebSocketMessage<T = any> {
  type: WSEventType | string;
  payload: T;
  timestamp: string;
  id?: string;
}

/* ============================================================
   Connection Status
   ============================================================ */

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnecting' | 'disconnected' | 'error';

/* ============================================================
   WebSocket Options
   ============================================================ */

export interface WebSocketClientOptions {
  url: string;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  debug?: boolean;
  protocols?: string | string[];
  queueOfflineMessages?: boolean;
  maxQueueSize?: number;
}

/* ============================================================
   Event Handler Types
   ============================================================ */

export type MessageHandler<T = any> = (payload: T, message: WebSocketMessage<T>) => void;
export type ConnectionHandler = () => void;
export type ErrorHandler = (error: Error | Event) => void;

/* ============================================================
   Subscription Options
   ============================================================ */

export interface SubscriptionOptions {
  once?: boolean;
  filter?: (message: WebSocketMessage) => boolean;
}

/* ============================================================
   WebSocket Stats
   ============================================================ */

export interface WebSocketStats {
  messagesSent: number;
  messagesReceived: number;
  reconnects: number;
  errors: number;
  lastConnectedAt: Date | null;
  lastDisconnectedAt: Date | null;
  uptime: number;
  latency: number | null;
}

/* ============================================================
   Schema Validators Map
   ============================================================ */

export const schemaValidators: Record<WSEventType, z.ZodSchema | null> = {
  [WSEventType.PING]: null,
  [WSEventType.PONG]: null,
  [WSEventType.CONNECTION_STATUS]: null,
  [WSEventType.VEHICLE_LOCATION]: vehicleLocationSchema,
  [WSEventType.VEHICLE_STATUS]: vehicleStatusSchema,
  [WSEventType.VEHICLE_TELEMETRY]: vehicleTelemetrySchema,
  [WSEventType.VEHICLE_ALERT]: null,
  [WSEventType.FLEET_STATUS]: fleetStatusSchema,
  [WSEventType.FLEET_SUMMARY]: null,
  [WSEventType.MAINTENANCE_ALERT]: maintenanceAlertSchema,
  [WSEventType.MAINTENANCE_DUE]: maintenanceAlertSchema,
  [WSEventType.MAINTENANCE_COMPLETE]: maintenanceAlertSchema,
  [WSEventType.DRIVER_STATUS]: driverStatusSchema,
  [WSEventType.DRIVER_LOCATION]: null,
  [WSEventType.DRIVER_ALERT]: null,
  [WSEventType.GEOFENCE_BREACH]: geofenceBreachSchema,
  [WSEventType.GEOFENCE_ENTER]: geofenceBreachSchema,
  [WSEventType.GEOFENCE_EXIT]: geofenceBreachSchema,
  [WSEventType.FUEL_ALERT]: fuelAlertSchema,
  [WSEventType.FUEL_TRANSACTION]: null,
  [WSEventType.NOTIFICATION]: notificationSchema,
  [WSEventType.ALERT]: null,
  [WSEventType.SYSTEM_STATUS]: null,
  [WSEventType.SYSTEM_ALERT]: null,
};

/* ============================================================
   Utility Functions
   ============================================================ */

/**
 * Validate WebSocket message payload
 */
export function validateMessage<T>(type: WSEventType, payload: unknown): T {
  const validator = schemaValidators[type];

  if (!validator) {
    return payload as T;
  }

  const result = validator.safeParse(payload);

  if (!result.success) {
    throw new Error(`Invalid message payload for ${type}: ${result.error.message}`);
  }

  return result.data as T;
}

/**
 * Create a WebSocket message
 */
export function createMessage<T>(type: WSEventType | string, payload: T): WebSocketMessage<T> {
  return {
    type,
    payload,
    timestamp: new Date().toISOString(),
    id: crypto.randomUUID(),
  };
}
