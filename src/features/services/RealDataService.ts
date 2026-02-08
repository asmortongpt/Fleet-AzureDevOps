/**
 * RealDataService - Provides access to fleet vehicle and personnel data
 */

import { api } from '@/services/api';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vin?: string;
  color?: string;
  mileage?: number;
  vehicle_status?: string;
  status?: string;
  licensePlate?: string;
  assigned_driver_id?: string;
}

interface Person {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  role?: string;
}

interface ApiResponse<T> {
  data: T[];
}

export class RealDataService {
  private static instance: RealDataService;

  static getInstance(): RealDataService {
    if (!RealDataService.instance) {
      RealDataService.instance = new RealDataService();
    }
    return RealDataService.instance;
  }

  /**
   * Fetch all vehicles from the API
   */
  async getVehicles(): Promise<Vehicle[]> {
    try {
      const response = await api.get<ApiResponse<Vehicle> | Vehicle[]>('/api/v1/vehicles');
      // Handle both { data: [] } and direct array responses
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return response.data.vehicles || response.data.data || [];
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      return [];
    }
  }

  /**
   * Fetch all personnel/people from the API
   */
  async getPeople(): Promise<Person[]> {
    try {
      const response = await api.get<ApiResponse<Person> | Person[]>('/api/v1/drivers');
      // Handle both { data: [] } and direct array responses
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return response.data.drivers || response.data.data || [];
    } catch (error) {
      console.error('Error fetching people:', error);
      return [];
    }
  }
}

export default RealDataService;
