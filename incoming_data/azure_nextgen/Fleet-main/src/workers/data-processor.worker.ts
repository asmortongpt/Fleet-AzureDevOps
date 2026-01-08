/**
 * Data Processor Web Worker
 *
 * Handles CPU-intensive operations off the main thread:
 * - Fleet data processing and aggregation
 * - Analytics calculations
 * - Report generation
 * - Data transformation
 * - Complex filtering and sorting
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface WorkerMessage {
  id: string;
  action: string;
  data: any;
}

interface WorkerResponse {
  id: string;
  action: string;
  result?: any;
  error?: string;
}

interface Vehicle {
  id: string;
  name: string;
  status: string;
  mileage: number;
  fuelLevel?: number;
  location?: { lat: number; lng: number };
  lastMaintenance?: string;
  [key: string]: any;
}

interface Analytics {
  totalVehicles: number;
  activeVehicles: number;
  maintenanceVehicles: number;
  retiredVehicles: number;
  averageMileage: number;
  totalMileage: number;
  fuelEfficiency: number;
  utilizationRate: number;
}

// ============================================================================
// MESSAGE HANDLER
// ============================================================================

self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  const { id, action, data } = event.data;

  try {
    let result: any;

    switch (action) {
      case 'processFleetData':
        result = processFleetData(data);
        break;

      case 'calculateAnalytics':
        result = calculateAnalytics(data);
        break;

      case 'filterVehicles':
        result = filterVehicles(data.vehicles, data.filters);
        break;

      case 'sortVehicles':
        result = sortVehicles(data.vehicles, data.sortBy, data.sortOrder);
        break;

      case 'generateReport':
        result = generateReport(data);
        break;

      case 'aggregateMetrics':
        result = aggregateMetrics(data);
        break;

      case 'calculateDistances':
        result = calculateDistances(data.locations);
        break;

      case 'processMaintenanceSchedule':
        result = processMaintenanceSchedule(data);
        break;

      case 'optimizeRoutes':
        result = optimizeRoutes(data.waypoints);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    const response: WorkerResponse = {
      id,
      action,
      result,
    };

    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      id,
      action,
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    self.postMessage(response);
  }
});

// ============================================================================
// DATA PROCESSING FUNCTIONS
// ============================================================================

/**
 * Process fleet data with transformations and enrichment
 */
function processFleetData(vehicles: Vehicle[]): Vehicle[] {
  return vehicles.map((vehicle) => {
    // Calculate derived fields
    const daysSinceLastMaintenance = vehicle.lastMaintenance
      ? Math.floor((Date.now() - new Date(vehicle.lastMaintenance).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const needsMaintenance = daysSinceLastMaintenance > 90;

    const fuelStatus = vehicle.fuelLevel
      ? vehicle.fuelLevel < 20
        ? 'critical'
        : vehicle.fuelLevel < 40
        ? 'low'
        : 'normal'
      : 'unknown';

    return {
      ...vehicle,
      processed: true,
      daysSinceLastMaintenance,
      needsMaintenance,
      fuelStatus,
      utilizationScore: calculateUtilizationScore(vehicle),
      healthScore: calculateHealthScore(vehicle),
    };
  });
}

/**
 * Calculate comprehensive analytics from fleet data
 */
function calculateAnalytics(vehicles: Vehicle[]): Analytics {
  const total = vehicles.length;
  const active = vehicles.filter((v) => v.status === 'active').length;
  const maintenance = vehicles.filter((v) => v.status === 'maintenance').length;
  const retired = vehicles.filter((v) => v.status === 'retired').length;

  const totalMileage = vehicles.reduce((sum, v) => sum + (v.mileage || 0), 0);
  const averageMileage = total > 0 ? totalMileage / total : 0;

  // Calculate fuel efficiency (example: miles per gallon equivalent)
  const vehiclesWithFuel = vehicles.filter((v) => v.fuelLevel !== undefined);
  const avgFuelLevel = vehiclesWithFuel.length > 0
    ? vehiclesWithFuel.reduce((sum, v) => sum + (v.fuelLevel || 0), 0) / vehiclesWithFuel.length
    : 0;

  const fuelEfficiency = avgFuelLevel > 0 ? (averageMileage / avgFuelLevel) * 100 : 0;

  // Calculate utilization rate
  const utilizationRate = total > 0 ? (active / total) * 100 : 0;

  return {
    totalVehicles: total,
    activeVehicles: active,
    maintenanceVehicles: maintenance,
    retiredVehicles: retired,
    averageMileage: Math.round(averageMileage),
    totalMileage: Math.round(totalMileage),
    fuelEfficiency: Math.round(fuelEfficiency * 10) / 10,
    utilizationRate: Math.round(utilizationRate * 10) / 10,
  };
}

/**
 * Filter vehicles based on multiple criteria
 */
function filterVehicles(vehicles: Vehicle[], filters: Record<string, any>): Vehicle[] {
  return vehicles.filter((vehicle) => {
    for (const [key, value] of Object.entries(filters)) {
      // Skip empty filters
      if (value === '' || value === null || value === undefined) {
        continue;
      }

      // Array filters (e.g., status in ['active', 'maintenance'])
      if (Array.isArray(value)) {
        if (!value.includes(vehicle[key])) {
          return false;
        }
        continue;
      }

      // Range filters (e.g., mileage between min and max)
      if (typeof value === 'object' && 'min' in value && 'max' in value) {
        const vehicleValue = vehicle[key] as number;
        if (vehicleValue < value.min || vehicleValue > value.max) {
          return false;
        }
        continue;
      }

      // String filters (case-insensitive partial match)
      if (typeof value === 'string' && typeof vehicle[key] === 'string') {
        if (!vehicle[key].toLowerCase().includes(value.toLowerCase())) {
          return false;
        }
        continue;
      }

      // Exact match for other types
      if (vehicle[key] !== value) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Sort vehicles by specified field
 */
function sortVehicles(
  vehicles: Vehicle[],
  sortBy: string,
  sortOrder: 'asc' | 'desc' = 'asc'
): Vehicle[] {
  const sorted = [...vehicles].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];

    // Handle null/undefined
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    // String comparison
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return aValue.localeCompare(bValue);
    }

    // Number comparison
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return aValue - bValue;
    }

    // Date comparison
    if (aValue instanceof Date && bValue instanceof Date) {
      return aValue.getTime() - bValue.getTime();
    }

    return 0;
  });

  return sortOrder === 'desc' ? sorted.reverse() : sorted;
}

/**
 * Generate comprehensive report
 */
function generateReport(data: { vehicles: Vehicle[]; period: string }): any {
  const { vehicles, period } = data;

  const analytics = calculateAnalytics(vehicles);

  // Group by status
  const byStatus = vehicles.reduce((acc, v) => {
    acc[v.status] = (acc[v.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Top vehicles by mileage
  const topMileage = [...vehicles]
    .sort((a, b) => (b.mileage || 0) - (a.mileage || 0))
    .slice(0, 10)
    .map((v) => ({ id: v.id, name: v.name, mileage: v.mileage }));

  // Vehicles needing maintenance
  const needsMaintenance = vehicles.filter((v) => {
    if (!v.lastMaintenance) return true;
    const days = Math.floor(
      (Date.now() - new Date(v.lastMaintenance).getTime()) / (1000 * 60 * 60 * 24)
    );
    return days > 90;
  });

  return {
    period,
    generatedAt: new Date().toISOString(),
    summary: analytics,
    distribution: {
      byStatus,
    },
    insights: {
      topMileage,
      needsMaintenance: needsMaintenance.map((v) => ({
        id: v.id,
        name: v.name,
        lastMaintenance: v.lastMaintenance,
      })),
    },
    recommendations: generateRecommendations(vehicles),
  };
}

/**
 * Aggregate metrics over time
 */
function aggregateMetrics(data: { metrics: any[]; groupBy: string }): any[] {
  const { metrics, groupBy } = data;

  const grouped = metrics.reduce((acc, metric) => {
    const key = metric[groupBy];
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(metric);
    return acc;
  }, {} as Record<string, any[]>);

  return Object.entries(grouped).map(([key, values]) => ({
    [groupBy]: key,
    count: values.length,
    sum: values.reduce((sum, v) => sum + (v.value || 0), 0),
    avg: values.reduce((sum, v) => sum + (v.value || 0), 0) / values.length,
    min: Math.min(...values.map((v) => v.value || 0)),
    max: Math.max(...values.map((v) => v.value || 0)),
  }));
}

/**
 * Calculate distances between locations (Haversine formula)
 */
function calculateDistances(locations: Array<{ lat: number; lng: number }>): number[] {
  const distances: number[] = [];

  for (let i = 0; i < locations.length - 1; i++) {
    const distance = haversineDistance(
      locations[i].lat,
      locations[i].lng,
      locations[i + 1].lat,
      locations[i + 1].lng
    );
    distances.push(distance);
  }

  return distances;
}

/**
 * Process maintenance schedule
 */
function processMaintenanceSchedule(data: { vehicles: Vehicle[] }): any[] {
  const { vehicles } = data;

  return vehicles
    .map((vehicle) => {
      if (!vehicle.lastMaintenance) {
        return {
          vehicleId: vehicle.id,
          vehicleName: vehicle.name,
          priority: 'high',
          daysOverdue: null,
          nextMaintenance: 'Overdue',
        };
      }

      const lastDate = new Date(vehicle.lastMaintenance);
      const daysSince = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + 90);

      const daysUntilNext = Math.floor((nextDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

      let priority: 'low' | 'medium' | 'high';
      if (daysUntilNext < 0) priority = 'high';
      else if (daysUntilNext < 14) priority = 'medium';
      else priority = 'low';

      return {
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        lastMaintenance: vehicle.lastMaintenance,
        daysSinceLastMaintenance: daysSince,
        nextMaintenance: nextDate.toISOString(),
        daysUntilNext,
        priority,
      };
    })
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return (
        priorityOrder[a.priority as keyof typeof priorityOrder] -
        priorityOrder[b.priority as keyof typeof priorityOrder]
      );
    });
}

/**
 * Optimize routes (simple greedy nearest neighbor algorithm)
 */
function optimizeRoutes(waypoints: Array<{ lat: number; lng: number; name: string }>): any {
  if (waypoints.length < 2) return waypoints;

  const optimized = [waypoints[0]];
  const remaining = waypoints.slice(1);

  while (remaining.length > 0) {
    const current = optimized[optimized.length - 1];
    let nearest = 0;
    let minDistance = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const distance = haversineDistance(
        current.lat,
        current.lng,
        remaining[i].lat,
        remaining[i].lng
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearest = i;
      }
    }

    optimized.push(remaining[nearest]);
    remaining.splice(nearest, 1);
  }

  const totalDistance = calculateDistances(optimized).reduce((sum, d) => sum + d, 0);

  return {
    waypoints: optimized,
    totalDistance: Math.round(totalDistance * 10) / 10,
    savings: calculateSavings(waypoints, optimized),
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate utilization score for a vehicle
 */
function calculateUtilizationScore(vehicle: Vehicle): number {
  let score = 50; // Base score

  // Adjust based on status
  if (vehicle.status === 'active') score += 20;
  else if (vehicle.status === 'maintenance') score -= 30;
  else if (vehicle.status === 'retired') score = 0;

  // Adjust based on fuel level
  if (vehicle.fuelLevel) {
    if (vehicle.fuelLevel > 70) score += 15;
    else if (vehicle.fuelLevel < 20) score -= 15;
  }

  // Adjust based on mileage (higher mileage = more utilized)
  if (vehicle.mileage) {
    if (vehicle.mileage > 100000) score += 10;
    else if (vehicle.mileage < 10000) score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate health score for a vehicle
 */
function calculateHealthScore(vehicle: Vehicle): number {
  let score = 80; // Base score

  // Recent maintenance is good
  if (vehicle.lastMaintenance) {
    const days = Math.floor(
      (Date.now() - new Date(vehicle.lastMaintenance).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days < 30) score += 20;
    else if (days > 90) score -= 20;
  } else {
    score -= 30; // Never maintained
  }

  // High mileage reduces score
  if (vehicle.mileage && vehicle.mileage > 150000) {
    score -= 15;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Generate recommendations based on fleet data
 */
function generateRecommendations(vehicles: Vehicle[]): string[] {
  const recommendations: string[] = [];

  const needsMaintenance = vehicles.filter((v) => {
    if (!v.lastMaintenance) return true;
    const days = Math.floor(
      (Date.now() - new Date(v.lastMaintenance).getTime()) / (1000 * 60 * 60 * 24)
    );
    return days > 90;
  });

  if (needsMaintenance.length > 0) {
    recommendations.push(
      `${needsMaintenance.length} vehicle(s) need maintenance. Schedule service soon.`
    );
  }

  const lowFuel = vehicles.filter((v) => v.fuelLevel && v.fuelLevel < 20);
  if (lowFuel.length > 0) {
    recommendations.push(`${lowFuel.length} vehicle(s) have low fuel. Refuel soon.`);
  }

  const highMileage = vehicles.filter((v) => v.mileage && v.mileage > 150000);
  if (highMileage.length > 0) {
    recommendations.push(
      `${highMileage.length} vehicle(s) have high mileage. Consider replacement.`
    );
  }

  const utilizationRate = (vehicles.filter((v) => v.status === 'active').length / vehicles.length) * 100;
  if (utilizationRate < 70) {
    recommendations.push('Fleet utilization is below 70%. Review deployment strategy.');
  }

  return recommendations;
}

/**
 * Haversine distance formula (in miles)
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate savings from route optimization
 */
function calculateSavings(
  original: Array<{ lat: number; lng: number }>,
  optimized: Array<{ lat: number; lng: number }>
): number {
  const originalDistance = calculateDistances(original).reduce((sum, d) => sum + d, 0);
  const optimizedDistance = calculateDistances(optimized).reduce((sum, d) => sum + d, 0);

  const savings = originalDistance - optimizedDistance;
  return Math.round(savings * 10) / 10;
}

// ============================================================================
// WORKER READY
// ============================================================================

console.log('[Worker] Data processor worker initialized');
