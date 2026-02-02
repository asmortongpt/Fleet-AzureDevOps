/**
 * API Client for Fleet CTA Backend
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../constants.js';
import { FleetApiError } from './error-handler.js';
import type {
  Vehicle,
  Driver,
  MaintenanceSchedule,
  WorkOrder,
  Inspection,
  ComplianceStatus,
  FleetStats,
  CostAnalysis,
  UtilizationReport,
  Route,
  PaginatedResponse
} from '../types.js';

export class FleetApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string = API_BASE_URL) {
    this.client = axios.create({
      baseURL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        if (error.response) {
          throw new FleetApiError(
            error.response.data?.message || error.message,
            error.response.status,
            error.response.data
          );
        }
        throw new FleetApiError(error.message);
      }
    );
  }

  private async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(endpoint, config);
    return response.data;
  }

  private async post<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(endpoint, data, config);
    return response.data;
  }

  // Vehicle Management
  async listVehicles(params?: {
    status?: string;
    type?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<Vehicle> | Vehicle[]> {
    return this.get<PaginatedResponse<Vehicle> | Vehicle[]>('/vehicles', { params });
  }

  async getVehicle(id: number): Promise<Vehicle> {
    return this.get<Vehicle>(`/vehicles/${id}`);
  }

  async getVehicleLocation(id: number): Promise<Vehicle['location']> {
    const vehicle = await this.get<Vehicle>(`/vehicles/${id}`);
    return vehicle.location;
  }

  async getVehicleStatus(id: number): Promise<{ id: number; status: string; details: unknown }> {
    const vehicle = await this.get<Vehicle>(`/vehicles/${id}`);
    return {
      id: vehicle.id,
      status: vehicle.status,
      details: vehicle
    };
  }

  async getVehicleTelemetry(id: number): Promise<unknown> {
    return this.get(`/vehicles/${id}/telemetry`);
  }

  // Driver Management
  async listDrivers(params?: {
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<Driver> | Driver[]> {
    return this.get<PaginatedResponse<Driver> | Driver[]>('/drivers', { params });
  }

  async getDriver(id: number): Promise<Driver> {
    return this.get<Driver>(`/drivers/${id}`);
  }

  async getDriverSchedule(id: number): Promise<unknown> {
    return this.get(`/drivers/${id}/schedule`);
  }

  async getDriverSafetyScore(id: number): Promise<{ driver_id: number; safety_score: number; violations: unknown[] }> {
    const driver = await this.get<Driver>(`/drivers/${id}`);
    // In a real implementation, this would call a dedicated safety endpoint
    return {
      driver_id: driver.id,
      safety_score: driver.safety_score || 0,
      violations: [] // Would come from /drivers/:id/violations
    };
  }

  // Maintenance
  async listMaintenanceSchedules(params?: {
    vehicle_id?: number;
    status?: string;
    upcoming_days?: number;
  }): Promise<MaintenanceSchedule[]> {
    return this.get<MaintenanceSchedule[]>('/maintenance-schedules', { params });
  }

  async getMaintenanceHistory(vehicleId: number): Promise<WorkOrder[]> {
    return this.get<WorkOrder[]>(`/vehicles/${vehicleId}/maintenance-history`);
  }

  async getServiceRecommendations(vehicleId: number): Promise<unknown> {
    return this.get(`/vehicles/${vehicleId}/service-recommendations`);
  }

  async createWorkOrder(data: {
    vehicle_id: number;
    description: string;
    priority: string;
    scheduled_date?: string;
  }): Promise<WorkOrder> {
    return this.post<WorkOrder>('/work-orders', data);
  }

  // Compliance
  async getComplianceStatus(): Promise<ComplianceStatus> {
    return this.get<ComplianceStatus>('/compliance/status');
  }

  async listInspections(params?: {
    vehicle_id?: number;
    status?: string;
    from_date?: string;
  }): Promise<Inspection[]> {
    return this.get<Inspection[]>('/inspections', { params });
  }

  async getViolations(params?: {
    vehicle_id?: number;
    driver_id?: number;
    from_date?: string;
  }): Promise<unknown[]> {
    return this.get<unknown[]>('/compliance/violations', { params });
  }

  // Analytics & Reporting
  async getFleetStats(): Promise<FleetStats> {
    return this.get<FleetStats>('/stats');
  }

  async getCostAnalysis(params?: {
    start_date?: string;
    end_date?: string;
    vehicle_id?: number;
  }): Promise<CostAnalysis> {
    return this.get<CostAnalysis>('/analytics/costs', { params });
  }

  async getUtilizationReport(params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<UtilizationReport[]> {
    return this.get<UtilizationReport[]>('/analytics/utilization', { params });
  }

  async getFuelEfficiency(params?: {
    vehicle_id?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<unknown> {
    return this.get('/analytics/fuel-efficiency', { params });
  }

  // Routes & Dispatch
  async listRoutes(params?: {
    status?: string;
    driver_id?: number;
    date?: string;
  }): Promise<Route[]> {
    return this.get<Route[]>('/routes', { params });
  }

  async getRouteDetails(id: number): Promise<Route> {
    return this.get<Route>(`/routes/${id}`);
  }

  async optimizeRoute(data: {
    start_location: string;
    end_location: string;
    waypoints?: string[];
  }): Promise<unknown> {
    return this.post('/routes/optimize', data);
  }
}
