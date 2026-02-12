/**
 * Common Zod schemas for Fleet CTA MCP tools
 */

import { z } from 'zod';

export const ResponseFormatSchema = z.enum(['json', 'markdown']).default('json');

export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(500).default(50)
}).optional();

export const DateRangeSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
}).optional();

export const VehicleIdSchema = z.number().int().positive();

export const DriverIdSchema = z.number().int().positive();

export const RouteIdSchema = z.number().int().positive();
