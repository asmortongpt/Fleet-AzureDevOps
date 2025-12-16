import { BrandingConfig } from '../types/branding.d';
import axios from 'axios';

import logger from '@/utils/logger';
/**
 * BrandingService is responsible for fetching and caching tenant-specific branding configurations.
 */
class BrandingService {
  private cache: Map<string, BrandingConfig> = new Map();

  /**
   * Fetches branding configuration for a specific tenant.
   * @param tenantId - The unique identifier for the tenant.
   * @returns Promise<BrandingConfig> - The branding configuration.
   */
  async getBrandingConfig(tenantId: string): Promise<BrandingConfig> {
    if (this.cache.has(tenantId)) {
      return this.cache.get(tenantId)!;
    }

    try {
      const response = await axios.get(`/api/branding/${tenantId}`);
      const brandingConfig: BrandingConfig = response.data;
      this.cache.set(tenantId, brandingConfig);
      return brandingConfig;
    } catch (error) {
      logger.error(`Failed to fetch branding config for tenant ${tenantId}`, error);
      throw new Error('Unable to load branding configuration.');
    }
  }

  /**
   * Clears the branding cache.
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export default new BrandingService();