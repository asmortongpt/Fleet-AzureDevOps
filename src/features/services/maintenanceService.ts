/**
 * Maintenance Service - Provides access to maintenance records from the API
 */

import { api } from '@/services/api';
import { Vehicle } from './vehicleService';

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  serviceType: string;
  serviceDate: Date;
  mileageAtService?: number;
  cost?: number;
  vendor?: string;
  description?: string;
  status: string;
  vehicle?: Vehicle;
}

interface CreateMaintenanceRecord {
  vehicleId: string;
  serviceType: string;
  serviceDate: Date;
  mileageAtService?: number;
  cost?: number;
  vendor?: string;
  description?: string;
  status: string;
}

interface ApiResponse<T> {
  data: T[];
}

class MaintenanceService {
  /**
   * Fetch all maintenance records from the API
   */
  async getAll(): Promise<MaintenanceRecord[]> {
    try {
      const response = await api.get<ApiResponse<MaintenanceRecord> | MaintenanceRecord[]>('/api/v1/work-orders');
      // Handle both { data: [] } and direct array responses
      if (Array.isArray(response.data)) {
        return response.data.map(r => ({ ...r, id: String(r.id) }));
      }
      const data = response.data.work_orders || response.data.data || [];
      return data.map(r => ({ ...r, id: String(r.id) }));
    } catch (error) {
      console.error('Error fetching maintenance records:', error);
      throw error;
    }
  }

  /**
   * Create a new maintenance record
   */
  async create(record: CreateMaintenanceRecord): Promise<MaintenanceRecord> {
    try {
      const response = await api.post<MaintenanceRecord>('/api/v1/work-orders', record);
      return { ...response.data, id: String(response.data.id) };
    } catch (error) {
      console.error('Error creating maintenance record:', error);
      throw error;
    }
  }

  /**
   * Update an existing maintenance record
   */
  async update(id: string, data: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> {
    try {
      const response = await api.put<MaintenanceRecord>(`/api/v1/work-orders/${id}`, data);
      return { ...response.data, id: String(response.data.id) };
    } catch (error) {
      console.error(`Error updating maintenance record ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a maintenance record
   */
  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/api/v1/work-orders/${id}`);
    } catch (error) {
      console.error(`Error deleting maintenance record ${id}:`, error);
      throw error;
    }
  }
}

export const maintenanceService = new MaintenanceService();
export default maintenanceService;
