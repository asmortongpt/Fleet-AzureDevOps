/**
 * Runtime Validation Hooks for React Query
 *
 * Provides type-safe data fetching with automatic Zod validation.
 * Catches field name mismatches and type errors at runtime before UI breaks.
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query'
import { z, type ZodError } from 'zod'

/**
 * Extended error type with validation details
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public zodError: ZodError,
    public rawData: unknown
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

/**
 * Enhanced useQuery with Zod validation
 *
 * Validates API responses at runtime, catching:
 * - Field name mismatches (warranty_expiration vs warranty_expiry)
 * - Type mismatches (string vs number)
 * - Missing required fields
 * - Invalid enum values
 *
 * @example
 * const { data, error } = useValidatedQuery(
 *   ['vehicles'],
 *   () => fetch('/api/vehicles').then(r => r.json()),
 *   z.array(vehicleSchema)
 * )
 */
export function useValidatedQuery<T>(
  queryKey: readonly unknown[],
  fetcher: () => Promise<unknown>,
  schema: z.ZodSchema<T>,
  options?: Omit<UseQueryOptions<T, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<T, Error>({
    queryKey,
    queryFn: async () => {
      try {
        const rawData = await fetcher()

        // Runtime validation with Zod
        const validatedData = schema.parse(rawData)

        return validatedData
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error('[Validation Error] Schema validation failed:', {
            queryKey,
            issues: error.issues,
            rawData: error.message
          })

          throw new ValidationError(
            `Schema validation failed for query [${queryKey.join(', ')}]`,
            error,
            error
          )
        }
        throw error
      }
    },
    ...options
  })
}

/**
 * Safe validation variant - returns parsed data or null
 * Does NOT throw errors, useful for optional data
 *
 * @example
 * const { data } = useSafeValidatedQuery(
 *   ['optional-config'],
 *   () => fetch('/api/config').then(r => r.json()),
 *   configSchema
 * )
 * // data will be null if validation fails, instead of throwing
 */
export function useSafeValidatedQuery<T>(
  queryKey: readonly unknown[],
  fetcher: () => Promise<unknown>,
  schema: z.ZodSchema<T>,
  options?: Omit<UseQueryOptions<T | null, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<T | null, Error>({
    queryKey,
    queryFn: async () => {
      try {
        const rawData = await fetcher()
        const result = schema.safeParse(rawData)

        if (result.success) {
          return result.data
        }

        console.warn('[Safe Validation] Schema validation failed (returning null):', {
          queryKey,
          issues: result.error.issues
        })

        return null
      } catch (error) {
        console.error('[Safe Validation] Fetch error:', error)
        return null
      }
    },
    ...options
  })
}

/**
 * Enhanced useMutation with request/response validation
 *
 * Validates both mutation input and response data.
 * Prevents sending invalid data to API and catches response errors.
 *
 * @example
 * const createVehicle = useValidatedMutation(
 *   (data: CreateVehicle) => fetch('/api/vehicles', {
 *     method: 'POST',
 *     body: JSON.stringify(data)
 *   }).then(r => r.json()),
 *   createVehicleSchema,  // Input validation
 *   vehicleSchema         // Response validation
 * )
 */
export function useValidatedMutation<TInput, TResponse>(
  mutationFn: (input: TInput) => Promise<unknown>,
  inputSchema: z.ZodSchema<TInput>,
  responseSchema: z.ZodSchema<TResponse>,
  options?: Omit<UseMutationOptions<TResponse, Error, TInput>, 'mutationFn'>
) {
  return useMutation<TResponse, Error, TInput>({
    mutationFn: async (input: TInput) => {
      try {
        // Validate input before sending
        const validatedInput = inputSchema.parse(input)

        // Execute mutation with validated input
        const rawResponse = await mutationFn(validatedInput)

        // Validate response
        const validatedResponse = responseSchema.parse(rawResponse)

        return validatedResponse
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error('[Mutation Validation Error]:', {
            issues: error.issues,
            input,
            rawResponse: error.message
          })

          throw new ValidationError(
            'Mutation validation failed',
            error,
            error
          )
        }
        throw error
      }
    },
    ...options
  })
}

/**
 * Helper to invalidate queries after mutations
 * Use this pattern for cache updates
 *
 * @example
 * const queryClient = useQueryClient()
 * const createVehicle = useValidatedMutation(
 *   createVehicleFn,
 *   createVehicleSchema,
 *   vehicleSchema,
 *   {
 *     onSuccess: () => invalidateQueries(queryClient, ['vehicles'])
 *   }
 * )
 */
export function invalidateQueries(queryClient: ReturnType<typeof useQueryClient>, queryKey: readonly unknown[]) {
  return queryClient.invalidateQueries({ queryKey })
}

/**
 * Helper to update cache optimistically
 *
 * @example
 * const updateVehicle = useValidatedMutation(
 *   updateVehicleFn,
 *   updateVehicleSchema,
 *   vehicleSchema,
 *   {
 *     onMutate: async (newData) => {
 *       await optimisticUpdate(queryClient, ['vehicles', newData.id], newData)
 *     }
 *   }
 * )
 */
export async function optimisticUpdate<T>(
  queryClient: ReturnType<typeof useQueryClient>,
  queryKey: readonly unknown[],
  updater: T | ((old: T | undefined) => T)
) {
  // Cancel outgoing refetches
  await queryClient.cancelQueries({ queryKey })

  // Snapshot previous value
  const previousData = queryClient.getQueryData<T>(queryKey)

  // Optimistically update
  queryClient.setQueryData<T>(queryKey, updater)

  // Return rollback function
  return () => queryClient.setQueryData(queryKey, previousData)
}

/**
 * Prefetch data with validation
 * Useful for preloading data on hover or navigation
 *
 * @example
 * const queryClient = useQueryClient()
 * await prefetchValidated(
 *   queryClient,
 *   ['vehicle', id],
 *   () => fetch(`/api/vehicles/${id}`).then(r => r.json()),
 *   vehicleSchema
 * )
 */
export async function prefetchValidated<T>(
  queryClient: ReturnType<typeof useQueryClient>,
  queryKey: readonly unknown[],
  fetcher: () => Promise<unknown>,
  schema: z.ZodSchema<T>
) {
  return queryClient.prefetchQuery({
    queryKey,
    queryFn: async () => {
      const rawData = await fetcher()
      return schema.parse(rawData)
    }
  })
}

/**
 * Type guard to check if error is a ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError
}

/**
 * Extract human-readable validation error messages
 *
 * @example
 * if (isValidationError(error)) {
 *   const messages = getValidationMessages(error)
 *   console.log(messages) // ["warranty_expiration: Required", "year: Expected number, received string"]
 * }
 */
export function getValidationMessages(error: ValidationError): string[] {
  return error.zodError.issues.map(issue => {
    const path = issue.path.join('.')
    return `${path}: ${issue.message}`
  })
}
