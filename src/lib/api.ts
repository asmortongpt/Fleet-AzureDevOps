/**
 * API wrapper - re-exports from api-client for backward compatibility
 *
 * This file provides a simplified apiRequest function that components
 * can use for basic GET requests. For more complex API operations,
 * import apiClient directly from api-client.ts
 */

import { apiClient } from './api-client'

/**
 * Simple API request function for GET requests
 * @param url - The API endpoint to call
 * @param options - Optional request options (method, body, etc.)
 * @returns Promise with the API response data
 */
export async function apiRequest(url: string, options?: RequestInit): Promise<any> {
  if (options?.method && options.method.toUpperCase() !== 'GET') {
    // For non-GET requests, use the appropriate apiClient method
    switch (options.method.toUpperCase()) {
      case 'POST':
        return apiClient.post(url, options.body)
      case 'PUT':
        return apiClient.put(url, options.body)
      case 'DELETE':
        return apiClient.delete(url)
      default:
        return apiClient.get(url)
    }
  }

  // Default to GET
  return apiClient.get(url)
}

// Re-export apiClient for direct access
export { apiClient } from './api-client'
export { APIError } from './api-client'

// Named export for compatibility
export const api = apiClient

// Export HTTP methods for axios-like interface
export const get = apiClient.get.bind(apiClient)
export const post = apiClient.post.bind(apiClient)
export const put = apiClient.put.bind(apiClient)
export const patch = apiClient.patch.bind(apiClient)
export const delete_ = apiClient.delete.bind(apiClient)

// Create axios-like wrapper object for compatibility
const axiosCompat = {
  get: apiClient.get.bind(apiClient),
  post: apiClient.post.bind(apiClient),
  put: apiClient.put.bind(apiClient),
  patch: apiClient.patch.bind(apiClient),
  delete: apiClient.delete.bind(apiClient),
  request: apiRequest,
}

export default axiosCompat
