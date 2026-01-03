import { z } from 'zod';

export const RATE_LIMITS = z.object({
  API_REQUESTS_PER_15_MIN: z.number().int().positive(),
  AUTH_ATTEMPTS_PER_15_MIN: z.number().int().positive(),
  FILE_UPLOAD_MAX_SIZE_MB: z.number().int().positive()
}).parse({
  API_REQUESTS_PER_15_MIN: 100,
  AUTH_ATTEMPTS_PER_15_MIN: 5,
  FILE_UPLOAD_MAX_SIZE_MB: 10
}) as const;

export const PAGINATION = z.object({
  DEFAULT_PAGE_SIZE: z.number().int().positive(),
  MAX_PAGE_SIZE: z.number().int().positive()
}).parse({
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 500
}) as const;

export const CACHE_TTL = z.object({
  VEHICLE_LIST: z.number().int().positive(),
  USER_PROFILE: z.number().int().positive(),
  STATIC_DATA: z.number().int().positive()
}).parse({
  VEHICLE_LIST: 300,      // 5 minutes
  USER_PROFILE: 3600,     // 1 hour
  STATIC_DATA: 86400      // 24 hours
}) as const;