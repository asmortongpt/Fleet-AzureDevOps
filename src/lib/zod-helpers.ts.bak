import { z } from 'zod';

// Email validation
export const emailSchema = z.string().email('Invalid email address');

// Phone number validation (basic international format)
export const phoneSchema = z.string().regex(
  /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{4,6}$/,
  'Invalid phone number'
);

// URL validation
export const urlSchema = z.string().url('Invalid URL');

// Date string validation (ISO 8601)
export const dateStringSchema = z.string().datetime({ offset: true });

// Positive number validation
export const positiveNumberSchema = z.number().positive('Must be a positive number');

// Non-empty string validation
export const nonEmptyStringSchema = z.string().min(1, 'Cannot be empty');

// Password validation (min 8 chars, at least one uppercase, lowercase, number, and special char)
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// UUID validation
export const uuidSchema = z.string().uuid('Invalid UUID');

// Slug validation (URL-friendly string)
export const slugSchema = z.string().regex(
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  'Invalid slug format'
);

// Hex color validation
export const hexColorSchema = z.string().regex(
  /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  'Invalid hex color'
);

// File size validation helper
export const maxFileSizeSchema = (maxSizeInBytes: number) =>
  z.number().max(maxSizeInBytes, `File size must not exceed ${maxSizeInBytes} bytes`);

// Array with min/max length
export const arrayWithLengthSchema = <T extends z.ZodTypeAny>(
  itemSchema: T,
  min: number,
  max: number
) =>
  z
    .array(itemSchema)
    .min(min, `Array must contain at least ${min} items`)
    .max(max, `Array must contain at most ${max} items`);

// Nullable but not undefined
export const nullableSchema = <T extends z.ZodTypeAny>(schema: T) =>
  z.union([schema, z.null()]);

// Optional or null
export const optionalOrNullSchema = <T extends z.ZodTypeAny>(schema: T) =>
  z.union([schema, z.null()]).optional();

// Enum from array
export const enumFromArray = <T extends readonly string[]>(values: T) =>
  z.enum(values as unknown as [string, ...string[]]);

// Numeric string (string that can be parsed to number)
export const numericStringSchema = z.string().regex(/^\d+$/, 'Must be a numeric string');

// Decimal string with precision
export const decimalStringSchema = (precision: number = 2) =>
  z.string().regex(
    new RegExp(`^\\d+(\\.\\d{1,${precision}})?$`),
    `Must be a decimal with up to ${precision} decimal places`
  );

// JSON string validation
export const jsonStringSchema = z.string().transform((str, ctx) => {
  try {
    return JSON.parse(str);
  } catch (e) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Invalid JSON string',
    });
    return z.NEVER;
  }
});

// Trimmed string
export const trimmedStringSchema = z.string().transform((val) => val.trim());

// Lowercase string
export const lowercaseStringSchema = z.string().transform((val) => val.toLowerCase());

// Uppercase string
export const uppercaseStringSchema = z.string().transform((val) => val.toUpperCase());

// Date range validation
export const dateRangeSchema = z.object({
  start: z.date(),
  end: z.date(),
}).refine((data) => data.start <= data.end, {
  message: 'Start date must be before or equal to end date',
  path: ['end'],
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('asc'),
});

// Coordinate validation
export const coordinateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

// Safe parse with error formatting
export function safeParse<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors = result.error.errors.map((err) => {
    const path = err.path.join('.');
    return path ? `${path}: ${err.message}` : err.message;
  });
  
  return { success: false, errors };
}

// Type-safe omit
export function omitFields<T extends z.ZodObject<any>, K extends keyof T['shape']>(
  schema: T,
  keys: K[]
): z.ZodObject<Omit<T['shape'], K>> {
  const shape = { ...schema.shape };
  keys.forEach((key) => delete shape[key]);
  return z.object(shape) as z.ZodObject<Omit<T['shape'], K>>;
}

// Type-safe pick
export function pickFields<T extends z.ZodObject<any>, K extends keyof T['shape']>(
  schema: T,
  keys: K[]
): z.ZodObject<Pick<T['shape'], K>> {
  const shape = {} as Pick<T['shape'], K>;
  keys.forEach((key) => {
    shape[key] = schema.shape[key];
  });
  return z.object(shape);
}

// Merge schemas with override
export function mergeSchemas<T extends z.ZodObject<any>, U extends z.ZodObject<any>>(
  base: T,
  override: U
): z.ZodObject<T['shape'] & U['shape']> {
  return base.merge(override);
}

// Conditional validation
export function conditionalSchema<T extends z.ZodTypeAny, U extends z.ZodTypeAny>(
  condition: (data: any) => boolean,
  trueSchema: T,
  falseSchema: U
) {
  return z.union([trueSchema, falseSchema]).superRefine((data, ctx) => {
    const shouldUseTrue = condition(data);
    const trueResult = trueSchema.safeParse(data);
    const falseResult = falseSchema.safeParse(data);
    
    if (shouldUseTrue && !trueResult.success) {
      trueResult.error.errors.forEach((err) => ctx.addIssue(err));
    } else if (!shouldUseTrue && !falseResult.success) {
      falseResult.error.errors.forEach((err) => ctx.addIssue(err));
    }
  });
}