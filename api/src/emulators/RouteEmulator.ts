import { OptimizedRoute, RouteStop } from '../types/route.types';

/**
 * Route Emulator for Fleet Management System
 * Generates optimized delivery routes in Tallahassee, FL area
 */
export class RouteEmulator {
  private static instance: RouteEmulator;
  private routes: OptimizedRoute[] = [];
  private routeIdCounter = 1;
  private stopIdCounter = 1;

  // Tallahassee area addresses for realistic routing
  private readonly tallahasseeAddresses = [
    { address: '400 S Monroe St, Tallahassee, FL 32301', lat: 30.4383, lng: -84.2807, area: 'Downtown' },
    { address: '1500 Apalachee Pkwy, Tallahassee, FL 32301', lat: 30.4419, lng: -84.2542, area: 'East' },
    { address: '2415 N Monroe St, Tallahassee, FL 32303', lat: 30.4719, lng: -84.2900, area: 'North' },
    { address: '3425 Thomasville Rd, Tallahassee, FL 32309', lat: 30.5027, lng: -84.2537, area: 'Northeast' },
    { address: '1400 Village Square Blvd, Tallahassee, FL 32312', lat: 30.4813, lng: -84.3527, area: 'Northwest' },
    { address: '3521 Maclay Blvd S, Tallahassee, FL 32312', lat: 30.5168, lng: -84.3271, area: 'North' },
    { address: '600 W Gaines St, Tallahassee, FL 32304', lat: 30.4180, lng: -84.2917, area: 'FSU Campus' },
    { address: '1700 Halstead Blvd, Tallahassee, FL 32309', lat: 30.4988, lng: -84.2192, area: 'East' },
    { address: '4700 W Tennessee St, Tallahassee, FL 32304', lat: 30.4485, lng: -84.3541, area: 'West' },
    { address: '2900 Kerry Forest Pkwy, Tallahassee, FL 32309', lat: 30.5186, lng: -84.2402, area: 'Northeast' },
    { address: '1125 Easterwood Dr, Tallahassee, FL 32311', lat: 30.4238, lng: -84.3358, area: 'Southwest' },
    { address: '3111 Mahan Dr, Tallahassee, FL 32308', lat: 30.4755, lng: -84.2237, area: 'East' },
    { address: '6700 Thomasville Rd, Tallahassee, FL 32312', lat: 30.5569, lng: -84.2680, area: 'North' },
    { address: '1410 Market St, Tallahassee, FL 32312', lat: 30.5110, lng: -84.2527, area: 'Northeast' },
    { address: '2525 Capital Medical Blvd, Tallahassee, FL 32308', lat: 30.4877, lng: -84.2099, area: 'East' },
    { address: '3122 Dick Wilson Blvd, Tallahassee, FL 32311', lat: 30.4085, lng: -84.3181, area: 'Southwest' },
    { address: '1940 N Monroe St, Tallahassee, FL 32303', lat: 30.4644, lng: -84.2859, area: 'Midtown' },
    { address: '4960 Centre Pointe Pl, Tallahassee, FL 32308', lat: 30.4805, lng: -84.2000, area: 'East' },
    { address: '8280 Thomasville Rd, Tallahassee, FL 32312', lat: 30.5750, lng: -84.2720, area: 'North' },
    { address: '2020 Fleischmann Rd, Tallahassee, FL 32308', lat: 30.4598, lng: -84.2180, area: 'East' },
    { address: '5775 Thomasville Rd, Tallahassee, FL 32312', lat: 30.5405, lng: -84.2643, area: 'North' },
    { address: '3500 Shamrock St W, Tallahassee, FL 32309', lat: 30.5180, lng: -84.2830, area: 'North' },
    { address: '1801 Miccosukee Rd, Tallahassee, FL 32308', lat: 30.4602, lng: -84.2003, area: 'East' },
    { address: '215 Bull Headley Rd, Tallahassee, FL 32309', lat: 30.5230, lng: -84.2150, area: 'Northeast' },
    { address: '4750 N Monroe St, Tallahassee, FL 32303', lat: 30.5082, lng: -84.2772, area: 'North' },
  ];

  private constructor() {
    this.generateOptimizedRoutes();
  }

  public static getInstance(): RouteEmulator {
    if (!RouteEmulator.instance) {
      RouteEmulator.instance = new RouteEmulator();
    }
    return RouteEmulator.instance;
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * 2-opt optimization algorithm for TSP
   */
  private optimizeRoute(stops: RouteStop[]): { optimized: RouteStop[], savings: number } {
    if (stops.length <= 2) {
      return { optimized: stops, savings: 0 };
    }

    const originalDistance = this.calculateTotalDistance(stops);
    let bestRoute = [...stops];
    let bestDistance = originalDistance;
    let improved = true;

    while (improved) {
      improved = false;
      for (let i = 1; i < bestRoute.length - 2; i++) {
        for (let j = i + 1; j < bestRoute.length - 1; j++) {
          const newRoute = this.twoOptSwap(bestRoute, i, j);
          const newDistance = this.calculateTotalDistance(newRoute);

          if (newDistance < bestDistance) {
            bestRoute = newRoute;
            bestDistance = newDistance;
            improved = true;
          }
        }
      }
    }

    const savingsPercent = ((originalDistance - bestDistance) / originalDistance) * 100;
    return { optimized: bestRoute, savings: savingsPercent };
  }

  /**
   * Perform 2-opt swap
   */
  private twoOptSwap(route: RouteStop[], i: number, j: number): RouteStop[] {
    const newRoute = [...route.slice(0, i), ...route.slice(i, j + 1).reverse(), ...route.slice(j + 1)];
    return newRoute;
  }

  /**
   * Calculate total distance for a route
   */
  private calculateTotalDistance(stops: RouteStop[]): number {
    let totalDistance = 0;
    for (let i = 0; i < stops.length - 1; i++) {
      totalDistance += this.calculateDistance(
        stops[i].latitude,
        stops[i].longitude,
        stops[i + 1].latitude,
        stops[i + 1].longitude
      );
    }
    return totalDistance;
  }

  /**
   * Generate realistic ETA based on distance and traffic patterns
   */
  private calculateETA(distance: number, hour: number): number {
    // Average speed in mph based on time of day
    let avgSpeed = 30; // Default city driving speed

    // Rush hour adjustments
    if ((hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18)) {
      avgSpeed = 20; // Rush hour
    } else if (hour >= 22 || hour <= 5) {
      avgSpeed = 35; // Late night/early morning
    }

    // Add buffer for stops, traffic lights, etc.
    const drivingTime = (distance / avgSpeed) * 60; // Convert to minutes
    const bufferTime = drivingTime * 0.15; // 15% buffer

    return Math.round(drivingTime + bufferTime);
  }

  /**
   * Generate a single optimized route
   */
  private generateRoute(vehicleId: number, driverId: number, routeType: string, numStops: number): OptimizedRoute {
    const startHour = 8 + Math.floor(Math.random() * 10); // Start between 8 AM and 6 PM
    const startTime = new Date();
    startTime.setHours(startHour, Math.floor(Math.random() * 60), 0, 0);

    // Select random addresses for stops
    const shuffled = [...this.tallahasseeAddresses].sort(() => 0.5 - Math.random());
    const selectedAddresses = shuffled.slice(0, numStops);

    // Create unoptimized stops
    const stops: RouteStop[] = selectedAddresses.map((addr, index) => {
      const stopTypes: Array<'pickup' | 'delivery' | 'service' | 'break'> =
        ['pickup', 'delivery', 'service', 'break'];

      const stopType = index === numStops - 1 && Math.random() > 0.8
        ? 'break'
        : stopTypes[Math.floor(Math.random() * 3)];

      const duration = stopType === 'break' ? 15 : 10 + Math.floor(Math.random() * 20);

      return {
        id: this.stopIdCounter++,
        address: addr.address,
        latitude: addr.lat,
        longitude: addr.lng,
        stopType,
        scheduledTime: new Date(startTime.getTime() + (index * 30 * 60000)), // 30 min intervals
        duration,
        status: 'pending' as const,
        notes: this.generateStopNotes(stopType)
      };
    });

    // Optimize the route
    const { optimized, savings } = this.optimizeRoute(stops);

    // Calculate distances
    const originalDistance = this.calculateTotalDistance(stops);
    const optimizedDistance = this.calculateTotalDistance(optimized);

    // Calculate total duration
    let currentTime = startTime.getTime();
    const estimatedDuration = optimized.reduce((total, stop, index) => {
      if (index > 0) {
        const distance = this.calculateDistance(
          optimized[index - 1].latitude,
          optimized[index - 1].longitude,
          stop.latitude,
          stop.longitude
        );
        const travelTime = this.calculateETA(distance, new Date(currentTime).getHours());
        total += travelTime;
        currentTime += travelTime * 60000;
      }
      total += stop.duration;
      currentTime += stop.duration * 60000;

      // Update scheduled times based on optimization
      stop.scheduledTime = new Date(currentTime - stop.duration * 60000);

      return total;
    }, 0);

    // Randomly mark some routes as active or completed
    const statusOptions = ['planned', 'active', 'completed'];
    const status = statusOptions[Math.floor(Math.random() * statusOptions.length)] as any;

    // If completed, add actual times
    if (status === 'completed') {
      optimized.forEach((stop, index) => {
        stop.status = 'completed';
        stop.actualArrivalTime = new Date(stop.scheduledTime.getTime() + Math.random() * 10 * 60000 - 5 * 60000);
        stop.actualDepartureTime = new Date(stop.actualArrivalTime.getTime() + stop.duration * 60000);
      });
    } else if (status === 'active') {
      const completedStops = Math.floor(Math.random() * optimized.length);
      optimized.forEach((stop, index) => {
        if (index < completedStops) {
          stop.status = 'completed';
          stop.actualArrivalTime = new Date(stop.scheduledTime.getTime() + Math.random() * 10 * 60000 - 5 * 60000);
          stop.actualDepartureTime = new Date(stop.actualArrivalTime.getTime() + stop.duration * 60000);
        } else if (index === completedStops) {
          stop.status = 'in-progress';
          stop.actualArrivalTime = new Date();
        }
      });
    }

    const route: OptimizedRoute = {
      id: this.routeIdCounter++,
      vehicleId,
      driverId,
      routeType: routeType as any,
      status,
      stops: optimized,
      totalDistance: optimizedDistance,
      estimatedDuration,
      actualDuration: status === 'completed' ? estimatedDuration + Math.floor(Math.random() * 30 - 15) : undefined,
      startTime,
      endTime: status === 'completed' ? new Date(startTime.getTime() + estimatedDuration * 60000) : undefined,
      optimization: {
        originalDistance,
        optimizedDistance,
        savingsPercent: savings
      }
    };

    return route;
  }

  /**
   * Generate stop notes based on type
   */
  private generateStopNotes(stopType: string): string {
    const notes: { [key: string]: string[] } = {
      pickup: [
        'Package pickup - 2 boxes',
        'Document pickup - urgent',
        'Equipment pickup for repair',
        'Return pickup - customer request',
        'Sample pickup for testing'
      ],
      delivery: [
        'Signature required',
        'Leave at front door if no answer',
        'Fragile - handle with care',
        'Time-sensitive delivery',
        'Call customer on arrival'
      ],
      service: [
        'Maintenance check required',
        'Installation service',
        'Repair service - reported issue',
        'Inspection visit',
        'Customer training session'
      ],
      break: [
        'Lunch break',
        'Rest break',
        'Fuel stop',
        'Vehicle inspection',
        'Driver break'
      ]
    };

    const typeNotes = notes[stopType] || notes.delivery;
    return typeNotes[Math.floor(Math.random() * typeNotes.length)];
  }

  /**
   * Generate all optimized routes
   */
  private generateOptimizedRoutes(): void {
    const routeTypes = ['delivery', 'service', 'pickup', 'patrol'];

    // Generate 100 routes
    for (let i = 0; i < 100; i++) {
      const vehicleId = Math.floor(Math.random() * 50) + 1; // 50 vehicles
      const driverId = Math.floor(Math.random() * 75) + 1; // 75 drivers
      const routeType = routeTypes[Math.floor(Math.random() * routeTypes.length)];
      const numStops = Math.floor(Math.random() * 7) + 2; // 2-8 stops

      const route = this.generateRoute(vehicleId, driverId, routeType, numStops);
      this.routes.push(route);
    }
  }

  /**
   * Get all routes with optional filtering
   */
  public getRoutes(filters?: {
    status?: string;
    routeType?: string;
    vehicleId?: number;
    driverId?: number;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): { routes: OptimizedRoute[], total: number, page: number, totalPages: number } {
    let filteredRoutes = [...this.routes];

    // Apply filters
    if (filters) {
      if (filters.status) {
        filteredRoutes = filteredRoutes.filter(r => r.status === filters.status);
      }
      if (filters.routeType) {
        filteredRoutes = filteredRoutes.filter(r => r.routeType === filters.routeType);
      }
      if (filters.vehicleId) {
        filteredRoutes = filteredRoutes.filter(r => r.vehicleId === filters.vehicleId);
      }
      if (filters.driverId) {
        filteredRoutes = filteredRoutes.filter(r => r.driverId === filters.driverId);
      }
      if (filters.startDate) {
        filteredRoutes = filteredRoutes.filter(r => r.startTime >= filters.startDate!);
      }
      if (filters.endDate) {
        filteredRoutes = filteredRoutes.filter(r => r.startTime <= filters.endDate!);
      }
    }

    // Apply pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRoutes = filteredRoutes.slice(startIndex, endIndex);

    return {
      routes: paginatedRoutes,
      total: filteredRoutes.length,
      page,
      totalPages: Math.ceil(filteredRoutes.length / limit)
    };
  }

  /**
   * Get route by ID
   */
  public getRouteById(id: number): OptimizedRoute | undefined {
    return this.routes.find(r => r.id === id);
  }

  /**
   * Get routes by vehicle ID
   */
  public getRoutesByVehicle(vehicleId: number): OptimizedRoute[] {
    return this.routes.filter(r => r.vehicleId === vehicleId);
  }

  /**
   * Get routes by driver ID
   */
  public getRoutesByDriver(driverId: number): OptimizedRoute[] {
    return this.routes.filter(r => r.driverId === driverId);
  }

  /**
   * Create a new route
   */
  public createRoute(routeData: Partial<OptimizedRoute>): OptimizedRoute {
    const numStops = routeData.stops?.length || Math.floor(Math.random() * 7) + 2;
    const route = this.generateRoute(
      routeData.vehicleId || Math.floor(Math.random() * 50) + 1,
      routeData.driverId || Math.floor(Math.random() * 75) + 1,
      routeData.routeType || 'delivery',
      numStops
    );

    // Override with provided data
    if (routeData.stops) {
      const { optimized, savings } = this.optimizeRoute(routeData.stops);
      route.stops = optimized;
      route.optimization.savingsPercent = savings;
    }

    this.routes.push(route);
    return route;
  }

  /**
   * Update route (mark stops complete, update status, etc.)
   */
  public updateRoute(id: number, updates: Partial<OptimizedRoute>): OptimizedRoute | undefined {
    const route = this.routes.find(r => r.id === id);
    if (!route) {
return undefined;
}

    // Update route properties
    Object.assign(route, updates);

    // If updating stop statuses
    if (updates.stops) {
      route.stops = updates.stops;

      // Update route status based on stops
      const allCompleted = route.stops.every(s => s.status === 'completed');
      const anyInProgress = route.stops.some(s => s.status === 'in-progress');
      const anyCompleted = route.stops.some(s => s.status === 'completed');

      if (allCompleted) {
        route.status = 'completed';
        route.endTime = new Date();
        route.actualDuration = Math.floor((route.endTime.getTime() - route.startTime.getTime()) / 60000);
      } else if (anyInProgress || anyCompleted) {
        route.status = 'active';
      }
    }

    return route;
  }

  /**
   * Get optimization statistics
   */
  public getOptimizationStats(): {
    totalRoutes: number;
    averageSavings: number;
    totalDistanceSaved: number;
    routesByType: { [key: string]: number };
    routesByStatus: { [key: string]: number };
  } {
    const totalSavings = this.routes.reduce((sum, route) => {
      return sum + (route.optimization.originalDistance - route.optimization.optimizedDistance);
    }, 0);

    const averageSavings = this.routes.reduce((sum, route) => {
      return sum + route.optimization.savingsPercent;
    }, 0) / this.routes.length;

    const routesByType: { [key: string]: number } = {};
    const routesByStatus: { [key: string]: number } = {};

    this.routes.forEach(route => {
      routesByType[route.routeType] = (routesByType[route.routeType] || 0) + 1;
      routesByStatus[route.status] = (routesByStatus[route.status] || 0) + 1;
    });

    return {
      totalRoutes: this.routes.length,
      averageSavings: Math.round(averageSavings * 100) / 100,
      totalDistanceSaved: Math.round(totalSavings * 100) / 100,
      routesByType,
      routesByStatus
    };
  }

  /**
   * Update stop status
   */
  public updateStopStatus(routeId: number, stopId: number, status: 'pending' | 'in-progress' | 'completed' | 'skipped'): boolean {
    const route = this.routes.find(r => r.id === routeId);
    if (!route) {
return false;
}

    const stop = route.stops.find(s => s.id === stopId);
    if (!stop) {
return false;
}

    stop.status = status;

    if (status === 'in-progress') {
      stop.actualArrivalTime = new Date();
    } else if (status === 'completed') {
      if (!stop.actualArrivalTime) {
        stop.actualArrivalTime = new Date();
      }
      stop.actualDepartureTime = new Date();
    }

    // Update route status
    const allCompleted = route.stops.every(s => s.status === 'completed' || s.status === 'skipped');
    const anyInProgress = route.stops.some(s => s.status === 'in-progress');

    if (allCompleted) {
      route.status = 'completed';
      route.endTime = new Date();
      route.actualDuration = Math.floor((route.endTime.getTime() - route.startTime.getTime()) / 60000);
    } else if (anyInProgress || route.stops.some(s => s.status === 'completed')) {
      route.status = 'active';
    }

    return true;
  }
}

export default RouteEmulator;