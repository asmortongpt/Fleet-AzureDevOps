/**
 * Real Database API Service
 * Provides API calls to the backend for CRUD operations
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface DriverFormData {
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  license_number: string;
  license_state: string;
  license_expiry: string;
  status: string;
  department: string;
  hire_date: string;
  date_of_birth: string;
}

interface Driver extends DriverFormData {
  id: number;
  created_at: string;
  updated_at: string;
}

export const DriverAPI = {
  async create(data: DriverFormData): Promise<Driver> {
    const response = await fetch(`${API_BASE_URL}/drivers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to create driver' }));
      throw new Error(error.message || 'Failed to create driver');
    }

    return response.json();
  },

  async getAll(): Promise<Driver[]> {
    const response = await fetch(`${API_BASE_URL}/drivers`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch drivers');
    }

    return response.json();
  },

  async getById(id: number): Promise<Driver> {
    const response = await fetch(`${API_BASE_URL}/drivers/${id}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch driver');
    }

    return response.json();
  },

  async update(id: number, data: Partial<DriverFormData>): Promise<Driver> {
    const response = await fetch(`${API_BASE_URL}/drivers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to update driver');
    }

    return response.json();
  },

  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/drivers/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to delete driver');
    }
  },
};
