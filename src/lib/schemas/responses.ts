/**
 * Response Wrapper Zod Schemas
 *
 * Standard response schemas for consistent API responses.
 * All API endpoints should return one of these wrapper types.
 */

import { z } from 'zod'

/**
 * Success response wrapper
 * Wraps successful API responses with a success flag and data
 *
 * @example
 * const vehicleResponseSchema = successResponseSchema(vehicleSchema)
 * // Returns: { success: true, data: Vehicle }
 */
export function successResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.literal(true),
    data: dataSchema
  })
}

/**
 * Type helper for success responses
 */
export type SuccessResponse<T> = {
  success: true
  data: T
}

/**
 * Error detail schema
 * Provides structured error information
 */
export const errorDetailSchema = z.object({
  message: z.string(),
  code: z.string().optional(),
  field: z.string().optional(), // Field that caused the error (for validation errors)
  details: z.unknown().optional() // Additional error context
})

/**
 * Type for error details
 */
export type ErrorDetail = z.infer<typeof errorDetailSchema>

/**
 * Error response schema
 * Standard error response structure
 */
export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
    details: z.unknown().optional(),
    errors: z.array(errorDetailSchema).optional() // Multiple validation errors
  })
})

/**
 * Type for error responses
 */
export type ErrorResponse = z.infer<typeof errorResponseSchema>

/**
 * Union of success or error response
 * Use this for endpoints that can return either success or error
 *
 * @example
 * const vehicleResponseSchema = apiResponseSchema(vehicleSchema)
 */
export function apiResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.union([
    successResponseSchema(dataSchema),
    errorResponseSchema
  ])
}

/**
 * Type helper for API responses (success or error)
 */
export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse

/**
 * Created response schema (HTTP 201)
 * Used for POST requests that create new resources
 */
export function createdResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
    location: z.string().url().optional() // URL of created resource
  })
}

/**
 * Type for created responses
 */
export type CreatedResponse<T> = {
  success: true
  data: T
  location?: string
}

/**
 * Updated response schema
 * Used for PUT/PATCH requests
 */
export function updatedResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
    message: z.string().optional()
  })
}

/**
 * Type for updated responses
 */
export type UpdatedResponse<T> = {
  success: true
  data: T
  message?: string
}

/**
 * Deleted response schema
 * Used for DELETE requests
 */
export const deletedResponseSchema = z.object({
  success: z.literal(true),
  message: z.string().default('Resource deleted successfully'),
  deleted_id: z.union([z.number(), z.string()]).optional()
})

/**
 * Type for deleted responses
 */
export type DeletedResponse = z.infer<typeof deletedResponseSchema>

/**
 * No content response schema (HTTP 204)
 * Used for successful requests with no response body
 */
export const noContentResponseSchema = z.void()

/**
 * Validation error response schema
 * Specialized error response for input validation failures
 */
export const validationErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    message: z.string().default('Validation failed'),
    code: z.string().default('VALIDATION_ERROR'),
    errors: z.array(
      z.object({
        field: z.string(),
        message: z.string(),
        code: z.string().optional()
      })
    )
  })
})

/**
 * Type for validation error responses
 */
export type ValidationErrorResponse = z.infer<typeof validationErrorResponseSchema>

/**
 * Unauthorized error response (HTTP 401)
 */
export const unauthorizedErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    message: z.string().default('Unauthorized'),
    code: z.string().default('UNAUTHORIZED')
  })
})

/**
 * Forbidden error response (HTTP 403)
 */
export const forbiddenErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    message: z.string().default('Forbidden'),
    code: z.string().default('FORBIDDEN')
  })
})

/**
 * Not found error response (HTTP 404)
 */
export const notFoundErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    message: z.string().default('Resource not found'),
    code: z.string().default('NOT_FOUND'),
    resource: z.string().optional(),
    id: z.union([z.number(), z.string()]).optional()
  })
})

/**
 * Type for not found errors
 */
export type NotFoundError = z.infer<typeof notFoundErrorSchema>

/**
 * Conflict error response (HTTP 409)
 */
export const conflictErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    message: z.string().default('Resource conflict'),
    code: z.string().default('CONFLICT'),
    conflicting_field: z.string().optional()
  })
})

/**
 * Rate limit error response (HTTP 429)
 */
export const rateLimitErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    message: z.string().default('Rate limit exceeded'),
    code: z.string().default('RATE_LIMIT_EXCEEDED'),
    retry_after: z.number().optional() // Seconds until retry allowed
  })
})

/**
 * Type for rate limit errors
 */
export type RateLimitError = z.infer<typeof rateLimitErrorSchema>

/**
 * Server error response (HTTP 500)
 */
export const serverErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    message: z.string().default('Internal server error'),
    code: z.string().default('INTERNAL_ERROR'),
    request_id: z.string().optional() // For error tracking
  })
})

/**
 * Type for server errors
 */
export type ServerError = z.infer<typeof serverErrorSchema>

/**
 * Helper to check if response is successful
 * Type guard for success responses
 */
export function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is SuccessResponse<T> {
  return response.success === true
}

/**
 * Helper to check if response is an error
 * Type guard for error responses
 */
export function isErrorResponse<T>(
  response: ApiResponse<T>
): response is ErrorResponse {
  return response.success === false
}

/**
 * Helper to extract data from response
 * Throws if response is an error
 */
export function unwrapResponse<T>(response: ApiResponse<T>): T {
  if (isSuccessResponse(response)) {
    return response.data
  }
  throw new Error(response.error.message)
}
