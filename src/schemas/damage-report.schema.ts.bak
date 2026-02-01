import { z } from 'zod';

export const DamageLocationSchema = z.object({
  area: z.string().min(1, 'Area is required'),
  specificLocation: z.string().optional(),
  coordinates: z.object({
    x: z.number().min(0).max(100),
    y: z.number().min(0).max(100)
  }).optional()
});

export const DamageItemSchema = z.object({
  id: z.string(),
  type: z.enum(['scratch', 'dent', 'crack', 'chip', 'tear', 'stain', 'missing', 'broken', 'other']),
  severity: z.enum(['minor', 'moderate', 'severe']),
  location: DamageLocationSchema,
  description: z.string().min(1, 'Description is required'),
  estimatedCost: z.number().min(0).optional(),
  images: z.array(z.string().url()).default([])
});

export const DamageReportSchema = z.object({
  id: z.string(),
  vehicleId: z.string(),
  inspectionId: z.string().optional(),
  reportDate: z.date(),
  reportedBy: z.object({
    id: z.string(),
    name: z.string(),
    role: z.enum(['customer', 'staff', 'inspector'])
  }),
  damages: z.array(DamageItemSchema).min(1, 'At least one damage item is required'),
  totalEstimatedCost: z.number().min(0).optional(),
  notes: z.string().optional(),
  status: z.enum(['pending', 'reviewed', 'approved', 'rejected', 'repaired']).default('pending'),
  metadata: z.object({
    createdAt: z.date(),
    updatedAt: z.date(),
    reviewedAt: z.date().optional(),
    reviewedBy: z.string().optional()
  })
});

export const CreateDamageReportSchema = DamageReportSchema.omit({
  id: true,
  metadata: true,
  status: true
}).extend({
  damages: z.array(DamageItemSchema.omit({ id: true })).min(1)
});

export const UpdateDamageReportSchema = DamageReportSchema.partial().omit({
  id: true,
  vehicleId: true,
  metadata: true
});

export type DamageLocation = z.infer<typeof DamageLocationSchema>;
export type DamageItem = z.infer<typeof DamageItemSchema>;
export type DamageReport = z.infer<typeof DamageReportSchema>;
export type CreateDamageReport = z.infer<typeof CreateDamageReportSchema>;
export type UpdateDamageReport = z.infer<typeof UpdateDamageReportSchema>;