/**
 * Sketchfab API Service
 * Provides access to Sketchfab's public 3D model library
 * API Documentation: https://sketchfab.com/developers/data-api
 */

import axios, { AxiosInstance } from 'axios';

import { logger } from './logger';

interface SketchfabSearchParams {
  q: string; // Search query
  type?: 'models';
  categories?: string; // 'vehicles-transportation'
  license?: string; // 'CC0', 'CC-BY', 'CC-BY-SA'
  downloadable?: boolean;
  animated?: boolean;
  staffpicked?: boolean;
  sound?: boolean;
  rigged?: boolean;
  count?: number; // Results per page (max 24)
  cursor?: string; // Pagination cursor
}

interface SketchfabModel {
  uid: string;
  name: string;
  description: string;
  viewerUrl: string;
  thumbnails: {
    images: Array<{
      url: string;
      width: number;
      height: number;
    }>;
  };
  user: {
    username: string;
    profileUrl: string;
    displayName: string;
  };
  license: {
    label: string;
    url: string;
  };
  isDownloadable: boolean;
  downloadCount: number;
  viewCount: number;
  likeCount: number;
  tags: Array<{
    name: string;
    slug: string;
  }>;
  faceCount: number;
  vertexCount: number;
  uri: string;
}

interface SketchfabSearchResponse {
  cursors: {
    next: string | null;
    previous: string | null;
  };
  next: string | null;
  previous: string | null;
  results: SketchfabModel[];
}

interface SketchfabDownloadResponse {
  gltf: {
    url: string;
    size: number;
  };
  usdz?: {
    url: string;
    size: number;
  };
}

/**
 * Sketchfab API Client
 * Rate Limits: 60 requests per minute (unauthenticated)
 */
export class SketchfabService {
  private api: AxiosInstance;
  private readonly BASE_URL = 'https://api.sketchfab.com/v3';
  private requestCount = 0;
  private requestWindowStart = Date.now();
  private readonly RATE_LIMIT = 50; // Conservative limit
  private readonly RATE_WINDOW = 60000; // 1 minute in ms

  constructor(apiToken?: string) {
    this.api = axios.create({
      baseURL: this.BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        ...(apiToken && { Authorization: `Token ${apiToken}` }),
      },
      timeout: 30000,
    });

    // Add rate limiting interceptor
    this.api.interceptors.request.use(async (config) => {
      await this.checkRateLimit();
      return config;
    });
  }

  /**
   * Rate limiting check
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.requestWindowStart;

    if (elapsed >= this.RATE_WINDOW) {
      // Reset window
      this.requestCount = 0;
      this.requestWindowStart = now;
    } else if (this.requestCount >= this.RATE_LIMIT) {
      // Wait until window resets
      const waitTime = this.RATE_WINDOW - elapsed;
      logger.warn(`Sketchfab rate limit reached. Waiting ${waitTime}ms`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      this.requestCount = 0;
      this.requestWindowStart = Date.now();
    }

    this.requestCount++;
  }

  /**
   * Search for vehicle models
   */
  async searchVehicles(
    query: string,
    options: {
      license?: 'CC0' | 'CC-BY' | 'CC-BY-SA';
      downloadable?: boolean;
      limit?: number;
      cursor?: string;
    } = {}
  ): Promise<SketchfabSearchResponse> {
    try {
      const params: SketchfabSearchParams = {
        q: query,
        type: 'models',
        categories: 'vehicles-transportation',
        downloadable: options.downloadable !== false, // Default to true
        count: Math.min(options.limit || 24, 24),
        ...(options.license && { license: options.license }),
        ...(options.cursor && { cursor: options.cursor }),
      };

      const response = await this.api.get<SketchfabSearchResponse>('/search', {
        params,
      });

      logger.info(
        `Sketchfab search: "${query}" returned ${response.data.results.length} results`
      );

      return response.data;
    } catch (error) {
      logger.error('Sketchfab search error:', error);
      throw new Error('Failed to search Sketchfab models');
    }
  }

  /**
   * Get model details by UID
   */
  async getModel(uid: string): Promise<SketchfabModel> {
    try {
      const response = await this.api.get<SketchfabModel>(`/models/${uid}`);
      return response.data;
    } catch (error) {
      logger.error(`Sketchfab get model error (${uid}):`, error);
      throw new Error('Failed to fetch Sketchfab model details');
    }
  }

  /**
   * Get download URLs for a model
   * Requires API token with download permissions
   */
  async getDownloadUrl(uid: string): Promise<SketchfabDownloadResponse> {
    try {
      const response = await this.api.get<SketchfabDownloadResponse>(
        `/models/${uid}/download`
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error(
          'Sketchfab API token required for downloads. Please provide a valid token.'
        );
      }
      logger.error(`Sketchfab download URL error (${uid}):`, error);
      throw new Error('Failed to get Sketchfab download URL');
    }
  }

  /**
   * Download model file (GLB format)
   */
  async downloadModel(
    uid: string,
    outputPath: string
  ): Promise<{ path: string; size: number }> {
    try {
      const downloadInfo = await this.getDownloadUrl(uid);

      if (!downloadInfo.gltf?.url) {
        throw new Error('No GLB download available for this model');
      }

      // Download the GLB file
      const response = await axios.get(downloadInfo.gltf.url, {
        responseType: 'arraybuffer',
        timeout: 300000, // 5 minutes for large files
      });

      const fs = await import('fs/promises');
      await fs.writeFile(outputPath, Buffer.from(response.data));

      logger.info(
        `Downloaded Sketchfab model ${uid} to ${outputPath} (${downloadInfo.gltf.size} bytes)`
      );

      return {
        path: outputPath,
        size: downloadInfo.gltf.size,
      };
    } catch (error) {
      logger.error(`Sketchfab download error (${uid}):`, error);
      throw error;
    }
  }

  /**
   * Search for specific vehicle makes/models
   */
  async searchByMakeModel(
    make: string,
    model: string,
    options: {
      license?: 'CC0' | 'CC-BY' | 'CC-BY-SA';
      limit?: number;
    } = {}
  ): Promise<SketchfabSearchResponse> {
    const query = `${make} ${model} car vehicle`;
    return this.searchVehicles(query, {
      ...options,
      downloadable: true,
    });
  }

  /**
   * Get popular free vehicle models
   */
  async getPopularVehicles(
    options: {
      license?: 'CC0' | 'CC-BY';
      limit?: number;
    } = {}
  ): Promise<SketchfabSearchResponse> {
    try {
      const params: SketchfabSearchParams = {
        q: 'car vehicle automobile',
        type: 'models',
        categories: 'vehicles-transportation',
        downloadable: true,
        staffpicked: true, // Get curated models
        count: Math.min(options.limit || 24, 24),
        ...(options.license && { license: options.license }),
      };

      const response = await this.api.get<SketchfabSearchResponse>('/search', {
        params,
      });

      return response.data;
    } catch (error) {
      logger.error('Sketchfab popular vehicles error:', error);
      throw new Error('Failed to fetch popular Sketchfab vehicles');
    }
  }

  /**
   * Get free CC0 models (no attribution required)
   */
  async getCC0Vehicles(limit: number = 24): Promise<SketchfabSearchResponse> {
    return this.getPopularVehicles({
      license: 'CC0',
      limit,
    });
  }
}

// Singleton instance
let sketchfabService: SketchfabService | null = null;

export function getSketchfabService(apiToken?: string): SketchfabService {
  if (!sketchfabService) {
    sketchfabService = new SketchfabService(
      apiToken || process.env.SKETCHFAB_API_KEY
    );
  }
  return sketchfabService;
}

export default SketchfabService;
