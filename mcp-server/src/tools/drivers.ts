/**
 * Driver Management Tools
 */

import { z } from 'zod';
import { FleetApiClient } from '../services/api-client.js';
import { formatErrorResponse } from '../services/error-handler.js';
import { ResponseFormatSchema, DriverIdSchema } from '../schemas/common.js';
import type { ResponseFormat } from '../types.js';

const apiClient = new FleetApiClient();

function formatResponse(data: unknown, format: ResponseFormat): string {
  if (format === 'markdown') {
    return '```json\n' + JSON.stringify(data, null, 2) + '\n```';
  }
  return JSON.stringify(data, null, 2);
}

// Tool 1: fleet_list_drivers
export const listDriversSchema = z.object({
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(500).default(50),
  response_format: ResponseFormatSchema
});

export async function listDrivers(args: z.infer<typeof listDriversSchema>): Promise<string> {
  try {
    const { response_format, ...params } = args;
    const drivers = await apiClient.listDrivers(params);
    return formatResponse(drivers, response_format);
  } catch (error) {
    return formatResponse(formatErrorResponse(error), args.response_format);
  }
}

// Tool 2: fleet_get_driver
export const getDriverSchema = z.object({
  driver_id: DriverIdSchema,
  response_format: ResponseFormatSchema
});

export async function getDriver(args: z.infer<typeof getDriverSchema>): Promise<string> {
  try {
    const driver = await apiClient.getDriver(args.driver_id);
    return formatResponse(driver, args.response_format);
  } catch (error) {
    return formatResponse(formatErrorResponse(error), args.response_format);
  }
}

// Tool 3: fleet_get_driver_schedule
export const getDriverScheduleSchema = z.object({
  driver_id: DriverIdSchema,
  response_format: ResponseFormatSchema
});

export async function getDriverSchedule(args: z.infer<typeof getDriverScheduleSchema>): Promise<string> {
  try {
    const schedule = await apiClient.getDriverSchedule(args.driver_id);
    return formatResponse(schedule, args.response_format);
  } catch (error) {
    return formatResponse(formatErrorResponse(error), args.response_format);
  }
}

// Tool 4: fleet_get_driver_safety_score
export const getDriverSafetyScoreSchema = z.object({
  driver_id: DriverIdSchema,
  response_format: ResponseFormatSchema
});

export async function getDriverSafetyScore(args: z.infer<typeof getDriverSafetyScoreSchema>): Promise<string> {
  try {
    const safetyData = await apiClient.getDriverSafetyScore(args.driver_id);
    return formatResponse(safetyData, args.response_format);
  } catch (error) {
    return formatResponse(formatErrorResponse(error), args.response_format);
  }
}
