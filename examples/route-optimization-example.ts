/**
 * Route Optimization Examples
 * Demonstrates how to use the route optimization API
 */

// Example 1: Basic Route Optimization
async function basicOptimization() {
  const stops = [
    {
      name: 'Warehouse',
      address: '100 Industrial Pkwy, Boston, MA',
      latitude: 42.3601,
      longitude: -71.0589,
      serviceMinutes: 0 // Starting point
    },
    {
      name: 'Customer A',
      address: '123 Main St, Boston, MA',
      latitude: 42.3584,
      longitude: -71.0598,
      serviceMinutes: 15,
      weight: 150,
      packages: 10
    },
    {
      name: 'Customer B',
      address: '456 Broadway, Cambridge, MA',
      latitude: 42.3736,
      longitude: -71.1097,
      serviceMinutes: 20,
      weight: 200,
      packages: 15
    },
    {
      name: 'Customer C',
      address: '789 Commonwealth Ave, Brookline, MA',
      latitude: 42.3505,
      longitude: -71.0787,
      serviceMinutes: 15,
      weight: 175,
      packages: 12
    }
  ]

  const response = await fetch('/api/route-optimization/optimize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({
      jobName: 'Daily Deliveries - Nov 10, 2025',
      stops,
      goal: 'balance',
      considerTraffic: true,
      considerCapacity: true
    })
  })

  const result = await response.json()
  console.log('Optimization Complete:', result)
  return result
}

// Example 2: Time Window Constraints
async function timeWindowOptimization() {
  const stops = [
    {
      name: 'Early Morning Delivery',
      address: '100 Harbor Blvd, Boston, MA',
      latitude: 42.3541,
      longitude: -71.0510,
      serviceMinutes: 20,
      earliestArrival: '07:00',
      latestArrival: '09:00',
      priority: 1
    },
    {
      name: 'Mid-Morning Delivery',
      address: '200 State St, Boston, MA',
      latitude: 42.3588,
      longitude: -71.0568,
      serviceMinutes: 15,
      earliestArrival: '09:30',
      latestArrival: '11:30',
      priority: 2
    },
    {
      name: 'Afternoon Delivery',
      address: '300 Congress St, Boston, MA',
      latitude: 42.3522,
      longitude: -71.0437,
      serviceMinutes: 25,
      earliestArrival: '13:00',
      latestArrival: '16:00',
      priority: 1
    }
  ]

  const response = await fetch('/api/route-optimization/optimize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({
      jobName: 'Time-Sensitive Deliveries',
      stops,
      goal: 'minimize_time',
      considerTraffic: true,
      considerTimeWindows: true,
      maxRouteDuration: 480 // 8 hours
    })
  })

  return await response.json()
}

// Example 3: Multi-Vehicle Optimization
async function multiVehicleOptimization() {
  const stops = Array.from({ length: 30 }, (_, i) => ({
    name: `Stop ${i + 1}`,
    address: `${i + 1}00 Main St, Boston, MA`,
    latitude: 42.36 + (Math.random() - 0.5) * 0.1,
    longitude: -71.06 + (Math.random() - 0.5) * 0.1,
    serviceMinutes: 15,
    weight: 100 + Math.random() * 200,
    packages: 5 + Math.floor(Math.random() * 15)
  }))

  const response = await fetch('/api/route-optimization/optimize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({
      jobName: 'Large Delivery Run',
      stops,
      vehicleIds: [1, 2, 3, 4, 5], // Use specific vehicles
      goal: 'minimize_cost',
      considerTraffic: true,
      considerCapacity: true,
      maxStopsPerRoute: 10,
      maxVehicles: 5
    })
  })

  return await response.json()
}

// Example 4: Electric Vehicle Route Optimization
async function evOptimization() {
  const stops = [
    {
      name: 'Stop 1',
      address: '123 Electric Ave, Boston, MA',
      latitude: 42.3601,
      longitude: -71.0589,
      serviceMinutes: 15
    },
    {
      name: 'Stop 2',
      address: '456 Battery Ln, Cambridge, MA',
      latitude: 42.3736,
      longitude: -71.1097,
      serviceMinutes: 20
    },
    {
      name: 'Charging Station',
      address: '789 Charge St, Somerville, MA',
      latitude: 42.3876,
      longitude: -71.0995,
      serviceMinutes: 30 // Charging time
    }
  ]

  const response = await fetch('/api/route-optimization/optimize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({
      jobName: 'EV Route Planning',
      stops,
      vehicleIds: [10], // Electric vehicle ID
      goal: 'minimize_distance',
      considerTraffic: true,
      considerCapacity: false,
      maxRouteDuration: 240 // 4 hours for battery range
    })
  })

  return await response.json()
}

// Example 5: Get Job Status
async function getJobStatus(jobId: number) {
  const response = await fetch(`/api/route-optimization/jobs/${jobId}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  })

  const data = await response.json()
  console.log('Job Status:', data.job.status)
  console.log('Routes:', data.routes.length)
  console.log('Stops:', data.stops.length)

  return data
}

// Example 6: Update Route in Real-Time
async function updateRouteStatus(routeId: number) {
  const response = await fetch(`/api/route-optimization/routes/${routeId}/update`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({
      status: 'active',
      actualStartTime: new Date().toISOString(),
      notes: 'Driver departed warehouse'
    })
  })

  return await response.json()
}

// Example 7: Mark Stop as Complete
async function completeStop(routeId: number, stopId: number) {
  const response = await fetch(
    `/api/route-optimization/routes/${routeId}/stops/${stopId}/complete`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        arrivalTime: new Date().toISOString(),
        departureTime: new Date(Date.now() + 15 * 60000).toISOString(),
        notes: 'Package delivered to reception'
      })
    }
  )

  return await response.json()
}

// Example 8: Get Optimization Statistics
async function getStats() {
  const response = await fetch('/api/route-optimization/stats', {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  })

  const stats = await response.json()
  console.log('Total Jobs:', stats.summary.total_jobs)
  console.log('Total Distance Saved:', stats.summary.total_distance, 'miles')
  console.log('Total Cost Savings:', `$${stats.summary.total_savings}`)
  console.log('Average Optimization Score:', stats.summary.avg_optimization_score)

  return stats
}

// Example 9: Batch Optimization
async function batchOptimization() {
  const jobs = [
    {
      jobName: 'North Route',
      stops: [
        /* stops in north area */
      ]
    },
    {
      jobName: 'South Route',
      stops: [
        /* stops in south area */
      ]
    },
    {
      jobName: 'West Route',
      stops: [
        /* stops in west area */
      ]
    }
  ]

  const results = await Promise.all(
    jobs.map((job) =>
      fetch('/api/route-optimization/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...job,
          goal: 'balance',
          considerTraffic: true
        })
      }).then((r) => r.json())
    )
  )

  return results
}

// Example 10: CSV Import
function parseCSV(csvText: string) {
  const lines = csvText.split('\n')
  const stops = []

  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const [name, address, lat, lng, serviceMinutes, weight, priority] = line.split(',')

    stops.push({
      name: name.trim(),
      address: address.trim(),
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      serviceMinutes: parseInt(serviceMinutes) || 15,
      weight: weight ? parseFloat(weight) : undefined,
      priority: parseInt(priority) || 1
    })
  }

  return stops
}

async function optimizeFromCSV(csvFile: File) {
  const text = await csvFile.text()
  const stops = parseCSV(text)

  const response = await fetch('/api/route-optimization/optimize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({
      jobName: `Import from ${csvFile.name}`,
      stops,
      goal: 'balance',
      considerTraffic: true,
      considerCapacity: true
    })
  })

  return await response.json()
}

// Export examples
export {
  basicOptimization,
  timeWindowOptimization,
  multiVehicleOptimization,
  evOptimization,
  getJobStatus,
  updateRouteStatus,
  completeStop,
  getStats,
  batchOptimization,
  optimizeFromCSV,
  parseCSV
}
