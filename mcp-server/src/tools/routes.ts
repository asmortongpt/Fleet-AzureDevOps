/**
 * Route & Dispatch Tools
 */

import { z } from 'zod';
import { FleetApiClient } from '../services/api-client.js';
import { formatErrorResponse } from '../services/error-handler.js';
import { ResponseFormatSchema, RouteIdSchema, DriverIdSchema } from '../schemas/common.js';
import type { ResponseFormat } from '../types.js';

const apiClient = new FleetApiClient();

function formatResponse(data: unknown, format: ResponseFormat): string {
  if (format === 'markdown') {
    return '```json\n' + JSON.stringify(data, null, 2) + '\n```';
  }
  return JSON.stringify(data, null, 2);
}

// Tool 1: fleet_list_routes
export const listRoutesSchema = z.object({
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  driver_id: DriverIdSchema.optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  response_format: ResponseFormatSchema
});

export async function listRoutes(args: z.infer<typeof listRoutesSchema>): Promise<string> {
  try {
    const { response_format, ...params } = args;
    const routes = await apiClient.listRoutes(params);
    return formatResponse(routes, response_format);
  } catch (error) {
    return formatResponse(formatErrorResponse(error), args.response_format);
  }
}

// Tool 2: fleet_get_route_details
export const getRouteDetailsSchema = z.object({
  route_id: RouteIdSchema,
  response_format: ResponseFormatSchema
});

export async function getRouteDetails(args: z.infer<typeof getRouteDetailsSchema>): Promise<string> {
  try {
    const route = await apiClient.getRouteDetails(args.route_id);
    return formatResponse(route, args.response_format);
  } catch (error) {
    return formatResponse(formatErrorResponse(error), args.response_format);
  }
}

// Tool 3: fleet_optimize_route
export const optimizeRouteSchema = z.object({
  start_location: z.string().min(1),
  end_location: z.string().min(1),
  waypoints: z.array(z.string()).optional(),
  response_format: ResponseFormatSchema
});

export async function optimizeRoute(args: z.infer<typeof optimizeRouteSchema>): Promise<string> {
  try {
    const { response_format, ...data } = args;
    const optimization = await apiClient.optimizeRoute(data);
    return formatResponse(optimization, response_format);
  } catch (error) {
    return formatResponse(formatErrorResponse(error), args.response_format);
  }
}
