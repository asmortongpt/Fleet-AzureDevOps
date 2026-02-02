/**
 * Compliance Tools
 */

import { z } from 'zod';
import { FleetApiClient } from '../services/api-client.js';
import { formatErrorResponse } from '../services/error-handler.js';
import { ResponseFormatSchema, VehicleIdSchema, DriverIdSchema } from '../schemas/common.js';
import type { ResponseFormat } from '../types.js';

const apiClient = new FleetApiClient();

function formatResponse(data: unknown, format: ResponseFormat): string {
  if (format === 'markdown') {
    return '```json\n' + JSON.stringify(data, null, 2) + '\n```';
  }
  return JSON.stringify(data, null, 2);
}

// Tool 1: fleet_get_compliance_status
export const getComplianceStatusSchema = z.object({
  response_format: ResponseFormatSchema
});

export async function getComplianceStatus(args: z.infer<typeof getComplianceStatusSchema>): Promise<string> {
  try {
    const status = await apiClient.getComplianceStatus();
    return formatResponse(status, args.response_format);
  } catch (error) {
    return formatResponse(formatErrorResponse(error), args.response_format);
  }
}

// Tool 2: fleet_list_inspections
export const listInspectionsSchema = z.object({
  vehicle_id: VehicleIdSchema.optional(),
  status: z.enum(['scheduled', 'completed', 'failed', 'pending']).optional(),
  from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  response_format: ResponseFormatSchema
});

export async function listInspections(args: z.infer<typeof listInspectionsSchema>): Promise<string> {
  try {
    const { response_format, ...params } = args;
    const inspections = await apiClient.listInspections(params);
    return formatResponse(inspections, response_format);
  } catch (error) {
    return formatResponse(formatErrorResponse(error), args.response_format);
  }
}

// Tool 3: fleet_get_violations
export const getViolationsSchema = z.object({
  vehicle_id: VehicleIdSchema.optional(),
  driver_id: DriverIdSchema.optional(),
  from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  response_format: ResponseFormatSchema
});

export async function getViolations(args: z.infer<typeof getViolationsSchema>): Promise<string> {
  try {
    const { response_format, ...params } = args;
    const violations = await apiClient.getViolations(params);
    return formatResponse(violations, response_format);
  } catch (error) {
    return formatResponse(formatErrorResponse(error), args.response_format);
  }
}
