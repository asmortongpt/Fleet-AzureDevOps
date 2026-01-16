/**
 * Vehicle API Handlers
 * MSW handlers for vehicle-related endpoints
 */

import { http, HttpResponse } from 'msw'
import { vehicles, calculateFleetMetrics } from '../data/vehicles'

export const vehicleHandlers = [
  // GET /api/vehicles - List all vehicles
  http.get('/api/vehicles', ({ request }) => {
    const url = new URL(request.url)
    const tenantId = url.searchParams.get('tenant_id')

    console.log('🔄 MSW: Intercepted GET /api/vehicles', { tenantId })

    return HttpResponse.json(vehicles, { status: 200 })
  }),

  // GET /api/vehicles/:id - Get single vehicle
  http.get('/api/vehicles/:id', ({ params }) => {
    const { id } = params
    const vehicle = vehicles.find(v => v.id === Number(id))

    console.log('🔄 MSW: Intercepted GET /api/vehicles/:id', { id })

    if (!vehicle) {
      return HttpResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      )
    }

    return HttpResponse.json(vehicle, { status: 200 })
  }),

  // GET /api/fleet/metrics - Fleet-wide metrics
  http.get('/api/fleet/metrics', () => {
    console.log('🔄 MSW: Intercepted GET /api/fleet/metrics')

    const metrics = calculateFleetMetrics()
    return HttpResponse.json(metrics, { status: 200 })
  }),

  // GET /api/fleet/status - Fleet status summary
  http.get('/api/fleet/status', () => {
    console.log('🔄 MSW: Intercepted GET /api/fleet/status')

    const metrics = calculateFleetMetrics()
    return HttpResponse.json({
      status: 'operational',
      ...metrics,
      lastUpdated: new Date().toISOString(),
    }, { status: 200 })
  }),

  // GET /api/drivers - List all drivers
  http.get('/api/drivers', () => {
    console.log('🔄 MSW: Intercepted GET /api/drivers')

    const drivers = vehicles
      .filter(v => v.driver)
      .map(v => ({ id: v.id, name: v.driver, vehicleId: v.id }))

    return HttpResponse.json(drivers, { status: 200 })
  }),

  // GET /api/work-orders - List work orders
  http.get('/api/work-orders', () => {
    console.log('🔄 MSW: Intercepted GET /api/work-orders')

    return HttpResponse.json([], { status: 200 })
  }),

  // GET /api/fuel-transactions - List fuel transactions
  http.get('/api/fuel-transactions', () => {
    console.log('🔄 MSW: Intercepted GET /api/fuel-transactions')

    return HttpResponse.json([], { status: 200 })
  }),

  // GET /api/facilities - List facilities
  http.get('/api/facilities', () => {
    console.log('🔄 MSW: Intercepted GET /api/facilities')

    return HttpResponse.json([], { status: 200 })
  }),

  // GET /api/maintenance-schedules - List maintenance schedules
  http.get('/api/maintenance-schedules', () => {
    console.log('🔄 MSW: Intercepted GET /api/maintenance-schedules')

    return HttpResponse.json([], { status: 200 })
  }),

  // GET /api/routes - List routes
  http.get('/api/routes', () => {
    console.log('🔄 MSW: Intercepted GET /api/routes')

    return HttpResponse.json([], { status: 200 })
  }),
]
