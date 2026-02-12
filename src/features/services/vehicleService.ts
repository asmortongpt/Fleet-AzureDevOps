/**
 * Vehicle Service - Provides access to vehicle data from the API
 */

import { api } from '@/services/api';

export interface Vehicle {
  id: string;
  licensePlate?: string;
  vin?: string;
  make: string;
  model: string;
  year?: number;
  color?: string;
  mileage?: number;
  vehicle_status?: string;
  status?: string;
  assigned_driver_id?: string;
}

interface ApiResponse<T> {
  data: T[];
}

class VehicleService {
  /**
   * Fetch all vehicles from the API
   */
  async getAll(): Promise<Vehicle[]> {
    try {
      const response = await api.get<ApiResponse<Vehicle> | Vehicle[]>('/vehicles');
      // Handle both { data: [] } and direct array responses
      if (Array.isArray(response.data)) {
        return response.data.map(v => ({ ...v, id: String(v.id) }));
      }
      const data = response.data.data || [];
      return data.map(v => ({ ...v, id: String(v.id) }));
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      throw error;
    }
  }

  /**
   * Fetch a single vehicle by ID
   */
  async getById(id: string): Promise<Vehicle | null> {
    try {
      const response = await api.get<Vehicle>(`/vehicles/${id}`);
      return { ...response.data, id: String(response.data.id) };
    } catch (error) {
      console.error(`Error fetching vehicle ${id}:`, error);
      return null;
    }
  }
}

export const vehicleService = new VehicleService();
export default vehicleService;
