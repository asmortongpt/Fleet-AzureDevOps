import { z } from 'zod';

export const telemetrySchema = z.object({
  vehicleId: z.number().int().positive(),
  timestamp: z.string().datetime(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speed: z.number().min(0).max(200),
  fuelLevel: z.number().min(0).max(100),
  engineRpm: z.number().min(0).max(8000).optional(),
  tenantId: z.number().int().positive()
});

export type TelemetryData = z.infer<typeof telemetrySchema>;