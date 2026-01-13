/**
 * Route type definitions for Fleet Management System
 */

export interface RouteStop {
  id: number;
  address: string;
  latitude: number;
  longitude: number;
  stopType: 'pickup' | 'delivery' | 'service' | 'break';
  scheduledTime: Date;
  actualArrivalTime?: Date;
  actualDepartureTime?: Date;
  duration: number; // minutes
  status: 'pending' | 'in-progress' | 'completed' | 'skipped';
  notes?: string;
}

export interface OptimizedRoute {
  id: number;
  vehicleId: number;
  driverId: number;
  routeType: 'delivery' | 'service' | 'pickup' | 'patrol';
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  stops: RouteStop[];
  totalDistance: number; // miles
  estimatedDuration: number; // minutes
  actualDuration?: number;
  startTime: Date;
  endTime?: Date;
  optimization: {
    originalDistance: number;
    optimizedDistance: number;
    savingsPercent: number;
  };
}

export interface RouteFilters {
  status?: string;
  routeType?: string;
  vehicleId?: number;
  driverId?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface RouteResponse {
  routes: OptimizedRoute[];
  total: number;
  page: number;
  totalPages: number;
}

export interface OptimizationStats {
  totalRoutes: number;
  averageSavings: number;
  totalDistanceSaved: number;
  routesByType: { [key: string]: number };
  routesByStatus: { [key: string]: number };
}

export interface UpdateStopStatusRequest {
  status: 'pending' | 'in-progress' | 'completed' | 'skipped';
  actualArrivalTime?: string;
  actualDepartureTime?: string;
  notes?: string;
}