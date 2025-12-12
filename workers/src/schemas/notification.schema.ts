import { z } from 'zod';

export const notificationSchema = z.object({
  vehicleId: z.number().int().positive(),
  timestamp: z.string().datetime(),
  message: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high']),
  recipient: z.string().email(),
  tenantId: z.number().int().positive()
});

export type NotificationData = z.infer<typeof notificationSchema>;