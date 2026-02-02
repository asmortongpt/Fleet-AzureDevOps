/**
 * API Client Tests
 * FEAT-007: Comprehensive test suite for API client
 *
 * Test Coverage:
 * - Request/response handling
 * - Error handling and retry logic
 * - CSRF token management
 * - Authentication flow
 * - Timeout handling
 * - Network error recovery
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { apiClient, APIError } from '../api-client'

// Mock fetch globally
global.fetch = vi.fn()

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset fetch mock
    ;(global.fetch as any).mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GET Requests', () => {
    it('should make successful GET request', async () => {
      const mockData = { vehicles: [] }
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData
      })

      const result = await apiClient.get('/api/vehicles')
      expect(result).toEqual(mockData)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/vehicles'),
        expect.objectContaining({
          method: 'GET',
          credentials: 'include'
        })
      )
    })

    it('should handle query parameters', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ([])
      })

      await apiClient.get('/api/vehicles', { status: 'active', limit: '10' })
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('status=active'),
        expect.any(Object)
      )
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=10'),
        expect.any(Object)
      )
    })
  })

  describe('POST Requests', () => {
    it('should make successful POST request', async () => {
      const mockData = { id: '123', name: 'Test Vehicle' }
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockData
      })

      const payload = { name: 'Test Vehicle' }
      const result = await apiClient.post('/api/vehicles', payload)

      expect(result).toEqual(mockData)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/vehicles'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(payload),
          credentials: 'include'
        })
      )
    })

    it('should sanitize input data', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      })

      await apiClient.post('/api/vehicles', {
        name: '  Test Vehicle  ',
        description: '  Some description  '
      })

      const callArgs = (global.fetch as any).mock.calls[0][1]
      const body = JSON.parse(callArgs.body)
      expect(body.name).toBe('Test Vehicle')
      expect(body.description).toBe('Some description')
    })
  })

  describe('PUT Requests', () => {
    it('should make successful PUT request', async () => {
      const mockData = { id: '123', name: 'Updated Vehicle' }
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      })

      const payload = { name: 'Updated Vehicle' }
      const result = await apiClient.put('/api/vehicles/123', payload)

      expect(result).toEqual(mockData)
    })
  })

  describe('DELETE Requests', () => {
    it('should make successful DELETE request', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 204
      })

      const result = await apiClient.delete('/api/vehicles/123')
      expect(result).toEqual({})
    })
  })

  describe('Error Handling', () => {
    it('should throw APIError on 404', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' })
      })

      await expect(apiClient.get('/api/vehicles/999')).rejects.toThrow(APIError)
      await expect(apiClient.get('/api/vehicles/999')).rejects.toThrow('Not found')
    })

    it('should throw APIError on 400 with validation errors', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid input' })
      })

      await expect(apiClient.post('/api/vehicles', {})).rejects.toThrow('Invalid input')
    })

    it('should throw APIError on 500 server error', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' })
      })

      await expect(apiClient.get('/api/vehicles')).rejects.toThrow(APIError)
    })

    it('should handle network errors', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      await expect(apiClient.get('/api/vehicles')).rejects.toThrow()
    })
  })

  describe('Retry Logic', () => {
    it('should retry on 5xx errors', async () => {
      // First call fails with 500
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' })
      })

      // Second call succeeds
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'success' })
      })

      const result = await apiClient.get('/api/vehicles')
      expect(result).toEqual({ data: 'success' })
      expect(global.fetch).toHaveBeenCalledTimes(2)
    }, 10000)

    it('should retry on network errors', async () => {
      // First call fails with network error
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      // Second call succeeds
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'success' })
      })

      const result = await apiClient.get('/api/vehicles')
      expect(result).toEqual({ data: 'success' })
      expect(global.fetch).toHaveBeenCalledTimes(2)
    }, 10000)

    it('should not retry on 4xx errors', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Bad request' })
      })

      await expect(apiClient.get('/api/vehicles')).rejects.toThrow()
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('should exhaust retries after max attempts', async () => {
      // All calls fail with 500
      ;(global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' })
      })

      await expect(apiClient.get('/api/vehicles')).rejects.toThrow()
      // Should be called: initial + 3 retries = 4 times
      expect(global.fetch).toHaveBeenCalledTimes(4)
    }, 15000)
  })

  describe('Timeout Handling', () => {
    it('should timeout after specified duration', async () => {
      vi.useFakeTimers()

      // Mock a delayed response
      ;(global.fetch as any).mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ data: 'late' })
        }), 40000))
      )

      const promise = apiClient.get('/api/vehicles')

      // Fast-forward past timeout
      vi.advanceTimersByTime(31000)

      await expect(promise).rejects.toThrow()

      vi.useRealTimers()
    }, 10000)

    it('should retry on timeout', async () => {
      vi.useFakeTimers()

      // First call times out
      ;(global.fetch as any).mockImplementationOnce(
        () => new Promise((_, reject) =>
          setTimeout(() => reject(Object.assign(new Error('AbortError'), { name: 'AbortError' })), 35000)
        )
      )

      // Second call succeeds quickly
      ;(global.fetch as any).mockImplementationOnce(
        () => Promise.resolve({
          ok: true,
          json: async () => ({ data: 'success' })
        })
      )

      const promise = apiClient.get('/api/vehicles')

      // Advance past first timeout
      await vi.advanceTimersByTimeAsync(36000)
      // Advance past retry delay
      await vi.advanceTimersByTimeAsync(2000)

      const result = await promise
      expect(result).toEqual({ data: 'success' })

      vi.useRealTimers()
    }, 15000)
  })

  describe('Authentication', () => {
    it('should redirect to login on 401', async () => {
      const originalLocation = window.location
      delete (window as any).location
      window.location = { ...originalLocation, href: '' } as any

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' })
      })

      await expect(apiClient.get('/api/vehicles')).rejects.toThrow()
      expect(window.location.href).toBe('/login')

      window.location = originalLocation
    })
  })

  describe('CSRF Protection', () => {
    beforeEach(() => {
      // Mock CSRF token endpoint
      ;(global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('csrf-token')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ csrfToken: 'test-token-123' })
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({})
        })
      })
    })

    it('should include CSRF token in state-changing requests', async () => {
      await apiClient.post('/api/vehicles', { name: 'Test' })

      const postCall = (global.fetch as any).mock.calls.find((call: any) =>
        call[0].includes('/api/vehicles') && call[1].method === 'POST'
      )

      expect(postCall[1].headers['X-CSRF-Token']).toBe('test-token-123')
    })

    it('should not include CSRF token in GET requests', async () => {
      await apiClient.get('/api/vehicles')

      const getCall = (global.fetch as any).mock.calls.find((call: any) =>
        call[0].includes('/api/vehicles')
      )

      expect(getCall[1].headers['X-CSRF-Token']).toBeUndefined()
    })

    it('should refresh CSRF token on 403 error', async () => {
      let callCount = 0

      ;(global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('csrf-token')) {
          callCount++
          return Promise.resolve({
            ok: true,
            json: async () => ({ csrfToken: `token-${callCount}` })
          })
        }

        // First POST fails with CSRF error
        if (callCount === 1) {
          return Promise.resolve({
            ok: false,
            status: 403,
            json: async () => ({ error: 'CSRF validation failed' })
          })
        }

        // Second POST succeeds
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true })
        })
      })

      const result = await apiClient.post('/api/vehicles', { name: 'Test' })
      expect(result).toEqual({ success: true })
      expect(callCount).toBeGreaterThan(1) // Token was refreshed
    })
  })

  describe('Batch Requests', () => {
    it('should execute batch requests', async () => {
      const mockResponse = {
        results: [
          { success: true, data: { vehicles: [] }, status: 200 },
          { success: true, data: { drivers: [] }, status: 200 }
        ]
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const requests = [
        { method: 'GET' as const, url: '/api/vehicles' },
        { method: 'GET' as const, url: '/api/drivers' }
      ]

      const results = await apiClient.batch(requests)
      expect(results).toEqual(mockResponse.results)
    })

    it('should validate batch request URLs', async () => {
      const requests = [
        { method: 'GET' as const, url: 'https://external.com/api' }
      ]

      await expect(apiClient.batch(requests)).rejects.toThrow('Invalid batch request URLs')
    })

    it('should limit batch size', async () => {
      const requests = Array.from({ length: 51 }, (_, i) => ({
        method: 'GET' as const,
        url: `/api/resource/${i}`
      }))

      await expect(apiClient.batch(requests)).rejects.toThrow('Maximum 50 requests per batch')
    })
  })

  describe('Vehicle Endpoints', () => {
    it('should fetch vehicles list', async () => {
      const mockVehicles = [{ id: '1', name: 'Vehicle 1' }]
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVehicles
      })

      const result = await apiClient.vehicles.list()
      expect(result).toEqual(mockVehicles)
    })

    it('should fetch single vehicle', async () => {
      const mockVehicle = { id: '1', name: 'Vehicle 1' }
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVehicle
      })

      const result = await apiClient.vehicles.get('1')
      expect(result).toEqual(mockVehicle)
    })

    it('should create vehicle', async () => {
      const mockVehicle = { id: '1', name: 'New Vehicle' }
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVehicle
      })

      const result = await apiClient.vehicles.create({ name: 'New Vehicle' })
      expect(result).toEqual(mockVehicle)
    })
  })
})
