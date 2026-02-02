/**
 * Maintenance Tools
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

// Tool 1: fleet_list_maintenance_schedules
export const listMaintenanceSchedulesSchema = z.object({
  vehicle_id: VehicleIdSchema.optional(),
  status: z.enum(['scheduled', 'completed', 'overdue', 'cancelled']).optional(),
  upcoming_days: z.number().int().positive().max(365).optional(),
  response_format: ResponseFormatSchema
});

export async function listMaintenanceSchedules(args: z.infer<typeof listMaintenanceSchedulesSchema>): Promise<string> {
  try {
    const { response_format, ...params } = args;
    const schedules = await apiClient.listMaintenanceSchedules(params);
    return formatResponse(schedules, response_format);
  } catch (error) {
    return formatResponse(formatErrorResponse(error), args.response_format);
  }
}

// Tool 2: fleet_get_maintenance_history
export const getMaintenanceHistorySchema = z.object({
  vehicle_id: VehicleIdSchema,
  response_format: ResponseFormatSchema
});

export async function getMaintenanceHistory(args: z.infer<typeof getMaintenanceHistorySchema>): Promise<string> {
  try {
    const history = await apiClient.getMaintenanceHistory(args.vehicle_id);
    return formatResponse(history, args.response_format);
  } catch (error) {
    return formatResponse(formatErrorResponse(error), args.response_format);
  }
}

// Tool 3: fleet_get_service_recommendations
export const getServiceRecommendationsSchema = z.object({
  vehicle_id: VehicleIdSchema,
  response_format: ResponseFormatSchema
});

export async function getServiceRecommendations(args: z.infer<typeof getServiceRecommendationsSchema>): Promise<string> {
  try {
    const recommendations = await apiClient.getServiceRecommendations(args.vehicle_id);
    return formatResponse(recommendations, args.response_format);
  } catch (error) {
    return formatResponse(formatErrorResponse(error), args.response_format);
  }
}

// Tool 4: fleet_create_work_order
export const createWorkOrderSchema = z.object({
  vehicle_id: VehicleIdSchema,
  description: z.string().min(1).max(1000),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  response_format: ResponseFormatSchema
});

export async function createWorkOrder(args: z.infer<typeof createWorkOrderSchema>): Promise<string> {
  try {
    const { response_format, ...data } = args;
    const workOrder = await apiClient.createWorkOrder(data);
    return formatResponse(workOrder, response_format);
  } catch (error) {
    return formatResponse(formatErrorResponse(error), args.response_format);
  }
}
