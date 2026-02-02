/**
 * Analytics & Reporting Tools
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

// Tool 1: fleet_get_fleet_stats
export const getFleetStatsSchema = z.object({
  response_format: ResponseFormatSchema
});

export async function getFleetStats(args: z.infer<typeof getFleetStatsSchema>): Promise<string> {
  try {
    const stats = await apiClient.getFleetStats();
    return formatResponse(stats, args.response_format);
  } catch (error) {
    return formatResponse(formatErrorResponse(error), args.response_format);
  }
}

// Tool 2: fleet_get_cost_analysis
export const getCostAnalysisSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  vehicle_id: VehicleIdSchema.optional(),
  response_format: ResponseFormatSchema
});

export async function getCostAnalysis(args: z.infer<typeof getCostAnalysisSchema>): Promise<string> {
  try {
    const { response_format, ...params } = args;
    const analysis = await apiClient.getCostAnalysis(params);
    return formatResponse(analysis, response_format);
  } catch (error) {
    return formatResponse(formatErrorResponse(error), args.response_format);
  }
}

// Tool 3: fleet_get_utilization_report
export const getUtilizationReportSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  response_format: ResponseFormatSchema
});

export async function getUtilizationReport(args: z.infer<typeof getUtilizationReportSchema>): Promise<string> {
  try {
    const { response_format, ...params } = args;
    const report = await apiClient.getUtilizationReport(params);
    return formatResponse(report, response_format);
  } catch (error) {
    return formatResponse(formatErrorResponse(error), args.response_format);
  }
}

// Tool 4: fleet_get_fuel_efficiency
export const getFuelEfficiencySchema = z.object({
  vehicle_id: VehicleIdSchema.optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  response_format: ResponseFormatSchema
});

export async function getFuelEfficiency(args: z.infer<typeof getFuelEfficiencySchema>): Promise<string> {
  try {
    const { response_format, ...params } = args;
    const efficiency = await apiClient.getFuelEfficiency(params);
    return formatResponse(efficiency, response_format);
  } catch (error) {
    return formatResponse(formatErrorResponse(error), args.response_format);
  }
}
