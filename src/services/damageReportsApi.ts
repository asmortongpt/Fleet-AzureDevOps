import axios, { AxiosError } from 'axios'

// TypeScript Types
export interface DamageReport {
  id: string
  tenant_id: string
  vehicle_id: string
  reported_by?: string
  damage_description: string
  damage_severity: 'minor' | 'moderate' | 'severe'
  damage_location?: string
  photos?: string[]
  videos?: string[]
  lidar_scans?: string[]
  triposr_task_id?: string
  triposr_status?: 'pending' | 'processing' | 'completed' | 'failed'
  triposr_model_url?: string
  linked_work_order_id?: string
  inspection_id?: string
  status?: 'open' | 'in_progress' | 'resolved'
  created_at?: string
  updated_at?: string
}

export interface CreateDamageReportInput {
  vehicle_id: string
  reported_by?: string
  damage_description: string
  damage_severity: 'minor' | 'moderate' | 'severe'
  damage_location?: string
  photos?: string[]
  videos?: string[]
  lidar_scans?: string[]
  linked_work_order_id?: string
  inspection_id?: string
}

export interface UpdateDamageReportInput extends Partial<CreateDamageReportInput> {
  status?: 'open' | 'in_progress' | 'resolved'
  triposr_status?: 'pending' | 'processing' | 'completed' | 'failed'
  triposr_model_url?: string
}

export interface PaginationParams {
  page?: number
  limit?: number
  vehicle_id?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface UploadedFile {
  url: string
  type: 'photo' | 'video' | 'lidar'
  fileName: string
  size: number
}

export interface UploadMediaResponse {
  success: boolean
  message: string
  files: UploadedFile[]
  totalFiles: number
  successfulUploads: number
}

// API Base URL
const API_BASE_URL = '/api'

// Error Handler
const handleApiError = (error: AxiosError): never => {
  if (error.response) {
    // Server responded with error status
    const errorMessage =
      (error.response.data as any)?.error || 'An error occurred on the server'
    console.error('API Error:', errorMessage, error.response.data)
    throw new Error(errorMessage)
  } else if (error.request) {
    // Request was made but no response received
    console.error('Network Error:', error.request)
    throw new Error('Network error - please check your connection')
  } else {
    // Something else happened
    console.error('Request Error:', error.message)
    throw new Error('Failed to make request')
  }
}

// API Service
export const damageReportsApi = {
  /**
   * Get all damage reports with optional filtering and pagination
   */
  async getAll(
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<DamageReport>> {
    try {
      const response = await axios.get<PaginatedResponse<DamageReport>>(
        `${API_BASE_URL}/damage-reports`,
        { params }
      )
      return response.data
    } catch (error) {
      return handleApiError(error as AxiosError)
    }
  },

  /**
   * Get a single damage report by ID
   */
  async getById(id: string): Promise<DamageReport> {
    try {
      const response = await axios.get<DamageReport>(
        `${API_BASE_URL}/damage-reports/${id}`
      )
      return response.data
    } catch (error) {
      return handleApiError(error as AxiosError)
    }
  },

  /**
   * Create a new damage report
   */
  async create(data: CreateDamageReportInput): Promise<DamageReport> {
    try {
      const response = await axios.post<DamageReport>(
        `${API_BASE_URL}/damage-reports`,
        data
      )
      return response.data
    } catch (error) {
      return handleApiError(error as AxiosError)
    }
  },

  /**
   * Update an existing damage report
   */
  async update(id: string, data: UpdateDamageReportInput): Promise<DamageReport> {
    try {
      const response = await axios.put<DamageReport>(
        `${API_BASE_URL}/damage-reports/${id}`,
        data
      )
      return response.data
    } catch (error) {
      return handleApiError(error as AxiosError)
    }
  },

  /**
   * Delete a damage report
   */
  async delete(id: string): Promise<{ message: string }> {
    try {
      const response = await axios.delete<{ message: string }>(
        `${API_BASE_URL}/damage-reports/${id}`
      )
      return response.data
    } catch (error) {
      return handleApiError(error as AxiosError)
    }
  },

  /**
   * Upload media files (photos, videos, LiDAR scans)
   */
  async uploadMedia(formData: FormData): Promise<UploadMediaResponse> {
    try {
      const response = await axios.post<UploadMediaResponse>(
        `${API_BASE_URL}/damage-reports/upload-media`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              )
              console.log(`Upload progress: ${percentCompleted}%`)
            }
          },
        }
      )
      return response.data
    } catch (error) {
      return handleApiError(error as AxiosError)
    }
  },

  /**
   * Update TripoSR 3D model generation status
   */
  async updateTripoSRStatus(
    id: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    modelUrl?: string
  ): Promise<DamageReport> {
    try {
      const response = await axios.patch<DamageReport>(
        `${API_BASE_URL}/damage-reports/${id}/triposr-status`,
        {
          triposr_status: status,
          triposr_model_url: modelUrl,
        }
      )
      return response.data
    } catch (error) {
      return handleApiError(error as AxiosError)
    }
  },

  /**
   * Generate 3D model from photos (triggers TripoSR processing)
   */
  async generateModel(id: string): Promise<DamageReport> {
    try {
      // First update status to processing
      const report = await this.updateTripoSRStatus(id, 'processing')

      // In a real implementation, this would trigger a backend job
      // For now, we just update the status
      // The backend would handle the actual TripoSR API call

      return report
    } catch (error) {
      return handleApiError(error as AxiosError)
    }
  },

  /**
   * Get damage reports for a specific vehicle
   */
  async getByVehicle(
    vehicleId: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<DamageReport>> {
    return this.getAll({ ...params, vehicle_id: vehicleId })
  },
}

// Export default
export default damageReportsApi
