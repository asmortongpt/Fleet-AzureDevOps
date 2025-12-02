# Input Validation Usage Guide

Complete guide for implementing secure input validation in the Fleet Management System using Zod schemas.

## Table of Contents

1. [Overview](#overview)
2. [Validation Architecture](#validation-architecture)
3. [Common Schemas](#common-schemas)
4. [Resource Schemas](#resource-schemas)
5. [Backend Implementation](#backend-implementation)
6. [Frontend Implementation](#frontend-implementation)
7. [Security Features](#security-features)
8. [Testing](#testing)
9. [Best Practices](#best-practices)

## Overview

The Fleet validation system provides:
- **Type-safe validation** using Zod schemas
- **XSS prevention** with automatic HTML sanitization
- **SQL injection protection** via parameterized queries
- **Comprehensive error messages** for debugging
- **Automatic type inference** for TypeScript
- **Security audit logging** for compliance

### Architecture

```
┌─────────────────────┐      ┌──────────────────────┐
│   Client Request    │─────►│  Express Middleware  │
│   (JSON payload)    │      │   validate(schema)   │
└─────────────────────┘      └──────────────────────┘
                                       │
                                       ▼
                             ┌──────────────────┐
                             │  Zod Schema      │
                             │  • Type check    │
                             │  • Format check  │
                             │  • Range check   │
                             │  • Sanitize XSS  │
                             └──────────────────┘
                                       │
                     ┌─────────────────┴─────────────────┐
                     ▼                                   ▼
              ✅ Valid Data                      ❌ Invalid Data
            (Continue to handler)             (Return 400 + errors)
```

## Validation Architecture

### Core Files

| File | Purpose | Lines |
|------|---------|-------|
| `api/src/validation/schemas.ts` | Zod schema definitions | 442 |
| `api/src/middleware/validation.ts` | Validation middleware | 464 |

### Schema Organization

```typescript
// Common reusable schemas
export const uuidSchema = z.string().uuid()
export const emailSchema = z.string().email()
export const vinSchema = z.string().length(17).regex(/^[A-HJ-NPR-Z0-9]{17}$/i)

// Resource-specific schemas
export const createVehicleSchema = z.object({ ... })
export const updateVehicleSchema = createVehicleSchema.partial()

// Query parameter schemas
export const paginationSchema = z.object({ ... })
export const dateRangeSchema = z.object({ ... })
```

## Common Schemas

### UUID Validation

```typescript
import { uuidSchema } from '../validation/schemas'

// Valid UUIDs only
const id = uuidSchema.parse('550e8400-e29b-41d4-a716-446655440000') // ✅
const invalid = uuidSchema.parse('not-a-uuid') // ❌ Throws ZodError
```

### Email Validation

```typescript
import { emailSchema } from '../validation/schemas'

// RFC 5322 compliant email validation
const email = emailSchema.parse('user@example.com') // ✅
const invalid = emailSchema.parse('invalid-email') // ❌ Throws ZodError
```

### Phone Number Validation

```typescript
import { phoneSchema } from '../validation/schemas'

// US phone numbers with flexible formatting
const phone1 = phoneSchema.parse('(555) 123-4567') // ✅
const phone2 = phoneSchema.parse('555-123-4567') // ✅
const phone3 = phoneSchema.parse('5551234567') // ✅
```

### VIN Validation

```typescript
import { vinSchema } from '../validation/schemas'

// 17-character Vehicle Identification Number
const vin = vinSchema.parse('1HGBH41JXMN109186') // ✅
const invalid = vinSchema.parse('ABC123') // ❌ Too short
```

### Date Range Validation

```typescript
import { dateRangeSchema } from '../validation/schemas'

// Ensures start_date is before end_date
const range = dateRangeSchema.parse({
  start_date: '2024-01-01',
  end_date: '2024-12-31'
}) // ✅

const invalidRange = dateRangeSchema.parse({
  start_date: '2024-12-31',
  end_date: '2024-01-01'
}) // ❌ Start after end
```

### Pagination Schema

```typescript
import { paginationSchema } from '../validation/schemas'

// Standard pagination parameters
const params = paginationSchema.parse({
  page: 1,
  limit: 50,
  sort: 'created_at',
  order: 'desc'
}) // ✅

// Defaults applied automatically
const defaults = paginationSchema.parse({}) // page=1, limit=50
```

## Resource Schemas

### Vehicle Schemas

#### Create Vehicle

```typescript
import { createVehicleSchema } from '../validation/schemas'

const newVehicle = {
  vin: '1HGBH41JXMN109186',
  make: 'Honda',
  model: 'Accord',
  year: 2023,
  license_plate: 'ABC-1234',
  status: 'active',
  mileage: 0,
  fuel_type: 'gasoline',
  purchase_price: 25000.00,
  purchase_date: '2023-01-15'
}

// Validate
const validated = createVehicleSchema.parse(newVehicle) // ✅

// Type inference
type Vehicle = z.infer<typeof createVehicleSchema>
```

#### Update Vehicle

```typescript
import { updateVehicleSchema } from '../validation/schemas'

// All fields optional (partial update)
const update = {
  mileage: 5000,
  status: 'maintenance'
}

const validated = updateVehicleSchema.parse(update) // ✅
```

### Driver Schemas

```typescript
import { createDriverSchema, updateDriverSchema } from '../validation/schemas'

const newDriver = {
  first_name: 'John',
  last_name: 'Smith',
  email: 'john.smith@example.com',
  phone: '(555) 123-4567',
  license_number: 'D1234567',
  license_state: 'FL',
  license_expiry: '2026-12-31',
  hire_date: '2023-01-15',
  status: 'active'
}

const validated = createDriverSchema.parse(newDriver) // ✅
```

### Work Order Schemas

```typescript
import { createWorkOrderSchema } from '../validation/schemas'

const workOrder = {
  vehicle_id: '550e8400-e29b-41d4-a716-446655440000',
  type: 'repair',
  priority: 'high',
  description: 'Replace brake pads',
  scheduled_date: '2024-12-05',
  estimated_hours: 2.5,
  status: 'pending'
}

const validated = createWorkOrderSchema.parse(workOrder) // ✅
```

### Vendor Schemas

```typescript
import { createVendorSchema } from '../validation/schemas'

const vendor = {
  name: 'Auto Parts Supply Co',
  contact_name: 'Jane Doe',
  email: 'jane@autoparts.com',
  phone: '(555) 987-6543',
  address: {
    street: '123 Main St',
    city: 'Miami',
    state: 'FL',
    zip: '33101'
  },
  type: 'parts_supplier',
  payment_terms: 'net30'
}

const validated = createVendorSchema.parse(vendor) // ✅
```

## Backend Implementation

### 1. Basic Middleware Usage

```typescript
import express from 'express'
import { validate } from '../middleware/validation'
import { createVehicleSchema, updateVehicleSchema } from '../validation/schemas'

const router = express.Router()

// Create vehicle - validate request body
router.post('/vehicles',
  validate(createVehicleSchema),
  async (req, res) => {
    // req.body is now typed and validated
    const vehicle = await db.vehicles.create(req.body)
    res.status(201).json(vehicle)
  }
)

// Update vehicle - validate params and body
router.put('/vehicles/:id',
  validate(uuidSchema, 'params', { field: 'id' }),
  validate(updateVehicleSchema),
  async (req, res) => {
    const vehicle = await db.vehicles.update(req.params.id, req.body)
    res.json(vehicle)
  }
)
```

### 2. Validate Different Targets

```typescript
import { validate } from '../middleware/validation'

// Validate request body (default)
router.post('/vehicles',
  validate(createVehicleSchema),
  handler
)

// Validate query parameters
router.get('/vehicles',
  validate(paginationSchema, 'query'),
  handler
)

// Validate URL parameters
router.get('/vehicles/:id',
  validate(uuidSchema, 'params', { field: 'id' }),
  handler
)

// Validate headers
router.post('/webhooks',
  validate(webhookHeaderSchema, 'headers'),
  handler
)
```

### 3. Custom Validation Options

```typescript
import { validate } from '../middleware/validation'

// Strip unknown fields
router.post('/vehicles',
  validate(createVehicleSchema, 'body', { stripUnknown: true }),
  handler
)

// Log validation failures
router.post('/vehicles',
  validate(createVehicleSchema, 'body', { logErrors: true }),
  handler
)

// Custom error messages
router.post('/vehicles',
  validate(createVehicleSchema, 'body', {
    errorMessage: 'Invalid vehicle data provided'
  }),
  handler
)
```

### 4. Error Handling

```typescript
// Automatic error response
router.post('/vehicles',
  validate(createVehicleSchema),
  async (req, res) => {
    // If validation fails, middleware returns:
    // {
    //   error: "Validation failed",
    //   issues: [
    //     {
    //       field: "vin",
    //       message: "Invalid VIN format",
    //       code: "invalid_string"
    //     }
    //   ]
    // }
  }
)
```

### 5. XSS Prevention

```typescript
// Automatic HTML sanitization
const maliciousData = {
  name: 'Vehicle <script>alert("XSS")</script>',
  description: '<img src=x onerror=alert(1)>'
}

// After validation:
// {
//   name: 'Vehicle ',
//   description: ''
// }
```

### 6. Complete CRUD Example

```typescript
import express from 'express'
import { validate } from '../middleware/validation'
import {
  createVehicleSchema,
  updateVehicleSchema,
  uuidSchema,
  paginationSchema
} from '../validation/schemas'
import { authenticateJWT, requirePermission } from '../middleware/auth'

const router = express.Router()

// List vehicles with pagination
router.get('/vehicles',
  authenticateJWT,
  validate(paginationSchema, 'query'),
  requirePermission('vehicles:view'),
  async (req, res) => {
    const { page, limit, sort, order } = req.query
    const vehicles = await db.vehicles.list({ page, limit, sort, order })
    res.json(vehicles)
  }
)

// Get single vehicle
router.get('/vehicles/:id',
  authenticateJWT,
  validate(uuidSchema, 'params', { field: 'id' }),
  requirePermission('vehicles:view'),
  async (req, res) => {
    const vehicle = await db.vehicles.findById(req.params.id)
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' })
    }
    res.json(vehicle)
  }
)

// Create vehicle
router.post('/vehicles',
  authenticateJWT,
  validate(createVehicleSchema),
  requirePermission('vehicles:create'),
  async (req, res) => {
    const vehicle = await db.vehicles.create({
      ...req.body,
      tenant_id: req.user.tenant_id,
      created_by: req.user.id
    })
    res.status(201).json(vehicle)
  }
)

// Update vehicle
router.put('/vehicles/:id',
  authenticateJWT,
  validate(uuidSchema, 'params', { field: 'id' }),
  validate(updateVehicleSchema),
  requirePermission('vehicles:edit'),
  async (req, res) => {
    const vehicle = await db.vehicles.update(req.params.id, req.body)
    res.json(vehicle)
  }
)

// Delete vehicle
router.delete('/vehicles/:id',
  authenticateJWT,
  validate(uuidSchema, 'params', { field: 'id' }),
  requirePermission('vehicles:delete'),
  async (req, res) => {
    await db.vehicles.delete(req.params.id)
    res.status(204).send()
  }
)

export default router
```

## Frontend Implementation

### 1. React Hook Form Integration

```typescript
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

// Define form schema
const createVehicleFormSchema = z.object({
  vin: z.string()
    .length(17, 'VIN must be exactly 17 characters')
    .regex(/^[A-HJ-NPR-Z0-9]{17}$/i, 'Invalid VIN format'),
  make: z.string().min(1, 'Make is required').max(100),
  model: z.string().min(1, 'Model is required').max(100),
  year: z.number()
    .int()
    .min(1900, 'Year must be 1900 or later')
    .max(new Date().getFullYear() + 2, 'Year cannot be more than 2 years in future'),
  license_plate: z.string().min(1).max(20),
  mileage: z.number().int().min(0)
})

type CreateVehicleForm = z.infer<typeof createVehicleFormSchema>

function CreateVehicleForm() {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<CreateVehicleForm>({
    resolver: zodResolver(createVehicleFormSchema)
  })

  const onSubmit = async (data: CreateVehicleForm) => {
    try {
      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Validation failed:', error.issues)
        return
      }

      const vehicle = await response.json()
      console.log('Vehicle created:', vehicle)
    } catch (error) {
      console.error('Failed to create vehicle:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>VIN</label>
        <input {...register('vin')} />
        {errors.vin && <span className="error">{errors.vin.message}</span>}
      </div>

      <div>
        <label>Make</label>
        <input {...register('make')} />
        {errors.make && <span className="error">{errors.make.message}</span>}
      </div>

      <div>
        <label>Model</label>
        <input {...register('model')} />
        {errors.model && <span className="error">{errors.model.message}</span>}
      </div>

      <div>
        <label>Year</label>
        <input type="number" {...register('year', { valueAsNumber: true })} />
        {errors.year && <span className="error">{errors.year.message}</span>}
      </div>

      <button type="submit">Create Vehicle</button>
    </form>
  )
}
```

### 2. Client-Side Validation Helper

```typescript
import { z } from 'zod'

/**
 * Validate data against schema on client side
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error }
    }
    throw error
  }
}

// Usage
const result = validateData(createVehicleFormSchema, formData)

if (result.success) {
  // Submit to API
  await createVehicle(result.data)
} else {
  // Show validation errors
  result.errors.issues.forEach(issue => {
    console.error(`${issue.path}: ${issue.message}`)
  })
}
```

### 3. API Error Handling

```typescript
import { z } from 'zod'

interface ValidationError {
  error: string
  issues: Array<{
    field: string
    message: string
    code: string
  }>
}

async function createVehicle(data: CreateVehicleForm) {
  try {
    const response = await fetch('/api/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      if (response.status === 400) {
        const error = await response.json() as ValidationError

        // Map backend errors to form fields
        const fieldErrors: Record<string, string> = {}
        error.issues.forEach(issue => {
          fieldErrors[issue.field] = issue.message
        })

        return { success: false, errors: fieldErrors }
      }

      throw new Error(`HTTP ${response.status}`)
    }

    const vehicle = await response.json()
    return { success: true, data: vehicle }
  } catch (error) {
    console.error('Failed to create vehicle:', error)
    throw error
  }
}
```

## Security Features

### 1. XSS Prevention

The validation middleware automatically strips HTML tags and sanitizes input:

```typescript
// Input
const maliciousInput = {
  name: '<script>alert("XSS")</script>',
  description: '<img src=x onerror=alert(1)>',
  notes: 'Normal text <b>bold</b> <script>evil()</script>'
}

// After validation
const sanitized = {
  name: '',
  description: '',
  notes: 'Normal text bold '
}
```

**Implementation**:
```typescript
// api/src/middleware/validation.ts
function sanitizeHtml(value: unknown): unknown {
  if (typeof value === 'string') {
    // Strip all HTML tags
    return value.replace(/<[^>]*>/g, '')
  }
  // Recursively sanitize objects and arrays
  // ...
}
```

### 2. SQL Injection Protection

The validation layer ensures **only validated data** reaches the database layer:

```typescript
// ❌ BAD - String concatenation (vulnerable)
const query = `SELECT * FROM vehicles WHERE vin = '${userInput}'`

// ✅ GOOD - Parameterized query with validated input
router.get('/vehicles',
  validate(vinSchema, 'query', { field: 'vin' }),
  async (req, res) => {
    // req.query.vin is validated and type-safe
    const result = await db.query(
      'SELECT * FROM vehicles WHERE vin = $1',
      [req.query.vin] // Parameterized - safe from SQL injection
    )
    res.json(result.rows)
  }
)
```

### 3. Type Safety

Zod schemas provide **automatic TypeScript type inference**:

```typescript
import { createVehicleSchema } from '../validation/schemas'

// Automatic type inference
type CreateVehicleInput = z.infer<typeof createVehicleSchema>

// TypeScript knows all fields and their types
const vehicle: CreateVehicleInput = {
  vin: '1HGBH41JXMN109186',
  make: 'Honda',
  model: 'Accord',
  year: 2023, // TypeScript: number
  mileage: 0, // TypeScript: number
  status: 'active' // TypeScript: 'active' | 'maintenance' | 'retired'
}
```

### 4. Security Audit Logging

All validation failures are logged for security monitoring:

```typescript
// api/src/middleware/validation.ts
if (!result.success) {
  // Log validation failure for security audit
  await logSecurityEvent({
    event: 'VALIDATION_FAILED',
    user_id: req.user?.id,
    ip_address: req.ip,
    user_agent: req.get('user-agent'),
    endpoint: req.path,
    method: req.method,
    validation_target: target,
    error_count: result.error.issues.length,
    fields: result.error.issues.map(i => i.path.join('.')),
    timestamp: new Date()
  })
}
```

**Query failed validations:**
```sql
-- View validation failures in last 24 hours
SELECT * FROM security_audit_logs
WHERE event = 'VALIDATION_FAILED'
AND timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;

-- Identify suspicious patterns (multiple failures from same IP)
SELECT ip_address, COUNT(*) as failure_count
FROM security_audit_logs
WHERE event = 'VALIDATION_FAILED'
AND timestamp > NOW() - INTERVAL '1 hour'
GROUP BY ip_address
HAVING COUNT(*) > 10
ORDER BY failure_count DESC;
```

## Testing

### Unit Tests

```typescript
import { describe, test, expect } from 'vitest'
import { createVehicleSchema, vinSchema, emailSchema } from '../validation/schemas'

describe('Vehicle Validation', () => {
  test('valid vehicle passes validation', () => {
    const validVehicle = {
      vin: '1HGBH41JXMN109186',
      make: 'Honda',
      model: 'Accord',
      year: 2023,
      license_plate: 'ABC-1234',
      status: 'active',
      mileage: 0,
      fuel_type: 'gasoline'
    }

    const result = createVehicleSchema.safeParse(validVehicle)
    expect(result.success).toBe(true)
  })

  test('invalid VIN fails validation', () => {
    const invalidVehicle = {
      vin: 'INVALID',
      make: 'Honda',
      model: 'Accord',
      year: 2023
    }

    const result = createVehicleSchema.safeParse(invalidVehicle)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['vin'])
    }
  })

  test('year validation enforces range', () => {
    const invalidYear = {
      vin: '1HGBH41JXMN109186',
      make: 'Honda',
      model: 'Accord',
      year: 1899 // Before 1900
    }

    const result = createVehicleSchema.safeParse(invalidYear)
    expect(result.success).toBe(false)
  })
})

describe('Common Schemas', () => {
  test('VIN schema validates format', () => {
    expect(vinSchema.safeParse('1HGBH41JXMN109186').success).toBe(true)
    expect(vinSchema.safeParse('ABC123').success).toBe(false)
    expect(vinSchema.safeParse('').success).toBe(false)
  })

  test('email schema validates format', () => {
    expect(emailSchema.safeParse('user@example.com').success).toBe(true)
    expect(emailSchema.safeParse('invalid-email').success).toBe(false)
    expect(emailSchema.safeParse('').success).toBe(false)
  })
})
```

### Integration Tests

```typescript
import request from 'supertest'
import app from '../app'
import { generateToken } from '../utils/auth'

describe('Vehicle API Validation', () => {
  const token = generateToken({ id: 'user-123', role: 'manager' })

  test('POST /vehicles validates required fields', async () => {
    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send({
        // Missing required fields
        make: 'Honda'
      })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Validation failed')
    expect(res.body.issues).toHaveLength(6) // Missing: vin, model, year, etc.
  })

  test('POST /vehicles accepts valid data', async () => {
    const validVehicle = {
      vin: '1HGBH41JXMN109186',
      make: 'Honda',
      model: 'Accord',
      year: 2023,
      license_plate: 'ABC-1234',
      status: 'active',
      mileage: 0,
      fuel_type: 'gasoline'
    }

    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send(validVehicle)

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject(validVehicle)
  })

  test('PUT /vehicles/:id validates UUID param', async () => {
    const res = await request(app)
      .put('/api/vehicles/not-a-uuid')
      .set('Authorization', `Bearer ${token}`)
      .send({ mileage: 5000 })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Validation failed')
  })

  test('GET /vehicles validates query params', async () => {
    const res = await request(app)
      .get('/api/vehicles?page=-1&limit=1000')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(400)
    expect(res.body.issues).toContainEqual(
      expect.objectContaining({
        field: 'page',
        message: expect.stringContaining('greater than or equal to 1')
      })
    )
  })
})
```

## Best Practices

### 1. Always Validate on Backend

```typescript
// ❌ BAD - Trust client-side validation only
router.post('/vehicles', async (req, res) => {
  // No validation!
  const vehicle = await db.vehicles.create(req.body)
  res.json(vehicle)
})

// ✅ GOOD - Always validate on backend
router.post('/vehicles',
  validate(createVehicleSchema),
  async (req, res) => {
    const vehicle = await db.vehicles.create(req.body)
    res.json(vehicle)
  }
)
```

### 2. Use Specific Schemas

```typescript
// ❌ BAD - Too permissive
const genericSchema = z.object({
  data: z.any() // Accepts anything!
})

// ✅ GOOD - Specific constraints
const createVehicleSchema = z.object({
  vin: z.string().length(17).regex(/^[A-HJ-NPR-Z0-9]{17}$/i),
  make: z.string().min(1).max(100),
  year: z.number().int().min(1900).max(2027)
})
```

### 3. Reuse Common Schemas

```typescript
// ✅ GOOD - Define once, reuse everywhere
const uuidSchema = z.string().uuid()
const emailSchema = z.string().email()
const phoneSchema = z.string().regex(/^\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/)

// Use in multiple schemas
const createUserSchema = z.object({
  id: uuidSchema,
  email: emailSchema,
  phone: phoneSchema
})

const createDriverSchema = z.object({
  id: uuidSchema,
  email: emailSchema,
  phone: phoneSchema
})
```

### 4. Provide Clear Error Messages

```typescript
// ❌ BAD - Generic error
const yearSchema = z.number()

// ✅ GOOD - Specific error messages
const yearSchema = z.number({
  required_error: 'Year is required',
  invalid_type_error: 'Year must be a number'
})
  .int('Year must be an integer')
  .min(1900, 'Year must be 1900 or later')
  .max(new Date().getFullYear() + 2, 'Year cannot be more than 2 years in future')
```

### 5. Use .partial() for Updates

```typescript
// Create schema - all fields required
const createVehicleSchema = z.object({
  vin: z.string().length(17),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int()
})

// Update schema - all fields optional
const updateVehicleSchema = createVehicleSchema.partial()

// Now you can update any subset of fields
const update = { mileage: 5000 } // ✅ Valid
```

### 6. Strip Unknown Fields

```typescript
// Prevent extra data from being saved
router.post('/vehicles',
  validate(createVehicleSchema, 'body', { stripUnknown: true }),
  async (req, res) => {
    // Only validated fields present in req.body
    const vehicle = await db.vehicles.create(req.body)
    res.json(vehicle)
  }
)
```

### 7. Log Validation Failures

```typescript
// Monitor suspicious activity
router.post('/vehicles',
  validate(createVehicleSchema, 'body', { logErrors: true }),
  handler
)

// Query logs
SELECT * FROM security_audit_logs
WHERE event = 'VALIDATION_FAILED'
AND user_id = 'suspicious-user-id'
ORDER BY timestamp DESC;
```

### 8. Test Edge Cases

```typescript
describe('Edge Cases', () => {
  test('handles null values', () => {
    const result = createVehicleSchema.safeParse({ vin: null })
    expect(result.success).toBe(false)
  })

  test('handles undefined values', () => {
    const result = createVehicleSchema.safeParse({ vin: undefined })
    expect(result.success).toBe(false)
  })

  test('handles empty strings', () => {
    const result = createVehicleSchema.safeParse({ vin: '' })
    expect(result.success).toBe(false)
  })

  test('handles whitespace-only strings', () => {
    const result = vinSchema.safeParse('   ')
    expect(result.success).toBe(false)
  })

  test('handles special characters', () => {
    const result = vinSchema.safeParse('1HGBH41JX<script>alert(1)</script>')
    expect(result.success).toBe(false)
  })
})
```

## Additional Resources

- [Zod Documentation](https://zod.dev)
- [Zod GitHub](https://github.com/colinhacks/zod)
- [React Hook Form + Zod](https://react-hook-form.com/get-started#SchemaValidation)
- [OWASP Input Validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- Source Files:
  - `api/src/validation/schemas.ts` - Schema definitions
  - `api/src/middleware/validation.ts` - Validation middleware
  - `api/src/routes/*.ts` - Example usage

---

**Document Version**: 1.0
**Last Updated**: 2025-12-02
**Validation System Coverage**: 100%
