/**
 * Vehicle Management Tools
 */

import { z } from 'zod';
import { FleetApiClient } from '../services/api-client.js';
import { formatErrorResponse } from '../services/error-handler.js';
import { ResponseFormatSchema, VehicleIdSchema } from '../schemas/common.js';
import type { ResponseFormat } from '../types.js';

const apiClient = new FleetApiClient();

function formatResponse(data: unknown, format: ResponseFormat): string {
  if (format === 'markdown') {
    return '```json\n' + JSON.stringify(data, null, 2) + '\n```';
  }
  return JSON.stringify(data, null, 2);
}

// Tool 1: fleet_list_vehicles
export const listVehiclesSchema = z.object({
  status: z.enum(['active', 'maintenance', 'retired', 'reserved']).optional(),
  type: z.string().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(500).default(50),
  response_format: ResponseFormatSchema
});

export async function listVehicles(args: z.infer<typeof listVehiclesSchema>): Promise<string> {
  try {
    const { response_format, ...params } = args;
    const vehicles = await apiClient.listVehicles(params);
    return formatResponse(vehicles, response_format);
  } catch (error) {
    return formatResponse(formatErrorResponse(error), args.response_format);
  }
}

// Tool 2: fleet_get_vehicle
export const getVehicleSchema = z.object({
  vehicle_id: VehicleIdSchema,
  response_format: ResponseFormatSchema
});

export async function getVehicle(args: z.infer<typeof getVehicleSchema>): Promise<string> {
  try {
    const vehicle = await apiClient.getVehicle(args.vehicle_id);
    return formatResponse(vehicle, args.response_format);
  } catch (error) {
    return formatResponse(formatErrorResponse(error), args.response_format);
  }
}

// Tool 3: fleet_get_vehicle_location
export const getVehicleLocationSchema = z.object({
  vehicle_id: VehicleIdSchema,
  response_format: ResponseFormatSchema
});

export async function getVehicleLocation(args: z.infer<typeof getVehicleLocationSchema>): Promise<string> {
  try {
    const location = await apiClient.getVehicleLocation(args.vehicle_id);
    return formatResponse(location, args.response_format);
  } catch (error) {
    return formatResponse(formatErrorResponse(error), args.response_format);
  }
}

// Tool 4: fleet_get_vehicle_status
export const getVehicleStatusSchema = z.object({
  vehicle_id: VehicleIdSchema,
  response_format: ResponseFormatSchema
});

export async function getVehicleStatus(args: z.infer<typeof getVehicleStatusSchema>): Promise<string> {
  try {
    const status = await apiClient.getVehicleStatus(args.vehicle_id);
    return formatResponse(status, args.response_format);
  } catch (error) {
    return formatResponse(formatErrorResponse(error), args.response_format);
  }
}

// Tool 5: fleet_get_vehicle_telemetry
export const getVehicleTelemetrySchema = z.object({
  vehicle_id: VehicleIdSchema,
  response_format: ResponseFormatSchema
});

export async function getVehicleTelemetry(args: z.infer<typeof getVehicleTelemetrySchema>): Promise<string> {
  try {
    const telemetry = await apiClient.getVehicleTelemetry(args.vehicle_id);
    return formatResponse(telemetry, args.response_format);
  } catch (error) {
    return formatResponse(formatErrorResponse(error), args.response_format);
  }
}
