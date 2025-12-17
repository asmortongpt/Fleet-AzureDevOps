/**
 * Vehicle 3D Models Service
 * Frontend API client for 3D model management
 */

import axios, { AxiosInstance } from 'axios';

import logger from '@/utils/logger';
export interface Vehicle3DModel {
  id: string;
  name: string;
  description?: string;
  vehicleType?: string;
  make?: string;
  model?: string;
  year?: number;
  fileUrl: string;
  fileFormat: string;
  fileSizeMb?: number;
  polyCount?: number;
  source: 'sketchfab' | 'azure-blob' | 'car3d' | 'custom' | 'triposr';
  sourceId?: string;
  license?: string;
  licenseUrl?: string;
  author?: string;
  authorUrl?: string;
  thumbnailUrl?: string;
  previewImages?: string[];
  usdzUrl?: string;
  qualityTier?: 'low' | 'medium' | 'high' | 'ultra';
  hasInterior?: boolean;
  hasEngine?: boolean;
  hasAnimations?: boolean;
  hasPbrMaterials?: boolean;
  supportsDamageMarkers?: boolean;
  damageZones?: any[];
  downloadCount?: number;
  viewCount?: number;
  isFeatured?: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ModelSearchParams {
  search?: string;
  vehicleType?: string;
  make?: string;
  source?: string;
  quality?: string;
  limit?: number;
  offset?: number;
}

export interface ModelsResponse {
  models: Vehicle3DModel[];
  total: number;
  limit: number;
  offset: number;
}

export interface UploadModelParams {
  file: File;
  name: string;
  description?: string;
  vehicleType?: string;
  make?: string;
  model?: string;
  year?: number;
  license?: string;
  quality?: 'low' | 'medium' | 'high';
  tags?: string[];
}

/**
 * Vehicle 3D Models API Client
 */
export class VehicleModelsService {
  private api: AxiosInstance;

  constructor(baseURL: string = '/api/v1') {
    this.api = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }

  /**
   * Get all models with filtering
   */
  async getModels(params: ModelSearchParams = {}): Promise<ModelsResponse> {
    const response = await this.api.get<ModelsResponse>('/models', { params });
    return response.data;
  }

  /**
   * Search models using full-text search
   */
  async searchModels(query: string, filters: Partial<ModelSearchParams> = {}): Promise<ModelsResponse> {
    const response = await this.api.get<ModelsResponse>('/models/search', {
      params: { q: query, ...filters },
    });
    return response.data;
  }

  /**
   * Get featured models
   */
  async getFeaturedModels(limit: number = 10): Promise<Vehicle3DModel[]> {
    const response = await this.api.get<{ models: Vehicle3DModel[] }>('/models/featured', {
      params: { limit },
    });
    return response.data.models;
  }

  /**
   * Get popular models
   */
  async getPopularModels(limit: number = 10): Promise<Vehicle3DModel[]> {
    const response = await this.api.get<{ models: Vehicle3DModel[] }>('/models/popular', {
      params: { limit },
    });
    return response.data.models;
  }

  /**
   * Get model by ID
   */
  async getModel(id: string): Promise<Vehicle3DModel> {
    const response = await this.api.get<{ model: Vehicle3DModel }>(`/models/${id}`);
    return response.data.model;
  }

  /**
   * Upload a custom model
   */
  async uploadModel(params: UploadModelParams): Promise<Vehicle3DModel> {
    const formData = new FormData();
    formData.append('model', params.file);
    formData.append('name', params.name);

    if (params.description) formData.append('description', params.description);
    if (params.vehicleType) formData.append('vehicleType', params.vehicleType);
    if (params.make) formData.append('make', params.make);
    if (params.model) formData.append('model', params.model);
    if (params.year) formData.append('year', params.year.toString());
    if (params.license) formData.append('license', params.license);
    if (params.quality) formData.append('quality', params.quality);
    if (params.tags) formData.append('tags', params.tags.join(','));

    const response = await this.api.post<{ model: Vehicle3DModel }>('/models/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000, // 5 minutes for large uploads
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          logger.debug(`Upload progress: ${percentCompleted}%`);
        }
      },
    });

    return response.data.model;
  }

  /**
   * Import model from Sketchfab
   */
  async importFromSketchfab(uid: string, saveToAzure: boolean = true): Promise<Vehicle3DModel> {
    const response = await this.api.post<{ model: Vehicle3DModel }>('/models/import-sketchfab', {
      uid,
      saveToAzure,
    });
    return response.data.model;
  }

  /**
   * Delete a model
   */
  async deleteModel(id: string): Promise<void> {
    await this.api.delete(`/models/${id}`);
  }

  /**
   * Assign model to vehicle
   */
  async assignModelToVehicle(vehicleId: string, modelId: string): Promise<void> {
    await this.api.post(`/models/vehicles/${vehicleId}/assign-model`, { modelId });
  }

  /**
   * Get download URL for a model
   */
  async getDownloadUrl(id: string): Promise<string> {
    const response = await this.api.get<{ downloadUrl: string }>(`/models/${id}/download`);
    return response.data.downloadUrl;
  }

  /**
   * Download a model file
   */
  async downloadModel(id: string, filename?: string): Promise<void> {
    const downloadUrl = await this.getDownloadUrl(id);

    // Trigger browser download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || `model-${id}.glb`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Singleton instance
let vehicleModelsService: VehicleModelsService | null = null;

export function getVehicleModelsService(): VehicleModelsService {
  if (!vehicleModelsService) {
    vehicleModelsService = new VehicleModelsService();
  }
  return vehicleModelsService;
}

export default VehicleModelsService;
