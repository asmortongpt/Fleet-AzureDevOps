/**
 * Microsoft Graph Integration Utilities
 *
 * Helper functions to integrate the Microsoft Graph Service with
 * the existing Microsoft Auth flow
 */

import { microsoftGraphService, MicrosoftGraphService } from '../services/microsoft-graph.service'
import { MicrosoftTokenResponse } from '../types/microsoft-graph.types'

/**
 * Store user tokens after successful OAuth callback
 *
 * Call this function in your OAuth callback handler after receiving
 * tokens from Microsoft
 *
 * @example
 * ```typescript
 * // In microsoft-auth.ts callback
 * const tokenResponse = await axios.post(tokenEndpoint, ...)
 * await storeUserGraphToken(user.id.toString(), user.tenant_id.toString(), tokenResponse.data)
 * ```
 */
export async function storeUserGraphToken(
  userId: string,
  tenantId: string,
  tokenResponse: MicrosoftTokenResponse
): Promise<void> {
  microsoftGraphService.storeUserToken(userId, tenantId, tokenResponse)
}

/**
 * Get Microsoft Graph client for a user
 *
 * Use this to get a Graph client instance for making API calls
 * on behalf of a user (delegated permissions)
 *
 * @example
 * ```typescript
 * const client = await getUserGraphClient(userId, tenantId)
 * const profile = await client.api('/me').get()
 * ```
 */
export async function getUserGraphClient(userId: string, tenantId: string) {
  return microsoftGraphService.getClientForUser(userId, tenantId)
}

/**
 * Get Microsoft Graph client for application
 *
 * Use this for app-only operations (application permissions)
 *
 * @example
 * ```typescript
 * const client = await getAppGraphClient()
 * const users = await client.api('/users').get()
 * ```
 */
export async function getAppGraphClient() {
  return microsoftGraphService.getClientForApp()
}

/**
 * Make a Graph API request for a user
 *
 * Simplified helper for making Graph API requests with automatic
 * retry and error handling
 *
 * @example
 * ```typescript
 * const events = await makeUserGraphRequest(
 *   userId,
 *   tenantId,
 *   '/me/events',
 *   'GET'
 * )
 * ```
 */
export async function makeUserGraphRequest<T = any>(
  userId: string,
  tenantId: string,
  endpoint: string,
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' = 'GET',
  body?: any
): Promise<T> {
  return microsoftGraphService.makeGraphRequestForUser(userId, tenantId, endpoint, method, body)
}

/**
 * Make a Graph API request with application credentials
 *
 * @example
 * ```typescript
 * const user = await makeAppGraphRequest('/users/user@domain.com', 'GET')
 * ```
 */
export async function makeAppGraphRequest<T = any>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' = 'GET',
  body?: any
): Promise<T> {
  return microsoftGraphService.makeGraphRequest(endpoint, method, body)
}

/**
 * Check if a user's token is still valid
 */
export function isUserTokenValid(userId: string, tenantId: string): boolean {
  return microsoftGraphService.validateToken(userId, tenantId)
}

/**
 * Revoke a user's token (e.g., on logout)
 */
export function revokeUserToken(userId: string, tenantId: string): void {
  microsoftGraphService.revokeToken(userId, tenantId)
}

/**
 * Refresh a user's access token
 *
 * Call this when you have a refresh token and need to get a new access token
 */
export async function refreshUserToken(
  userId: string,
  tenantId: string,
  refreshToken: string
): Promise<MicrosoftTokenResponse> {
  return microsoftGraphService.refreshToken(userId, tenantId, refreshToken)
}

/**
 * Get Graph service configuration status
 *
 * Useful for health checks and debugging
 */
export function getGraphServiceStatus() {
  return microsoftGraphService.getConfigStatus()
}

/**
 * Get token cache statistics
 *
 * Useful for monitoring and debugging
 */
export function getGraphCacheStats() {
  return microsoftGraphService.getCacheStats()
}

export default {
  storeUserGraphToken,
  getUserGraphClient,
  getAppGraphClient,
  makeUserGraphRequest,
  makeAppGraphRequest,
  isUserTokenValid,
  revokeUserToken,
  refreshUserToken,
  getGraphServiceStatus,
  getGraphCacheStats,
}
