import React, { createContext, useContext, useState, useEffect } from 'react';

import BrandingService from '../services/branding.service';
import { BrandingConfig } from '../types/branding.d';

import logger from '@/utils/logger';

interface BrandingContextProps {
  brandingConfig: BrandingConfig | null;
}

const BrandingContext = createContext<BrandingContextProps>({ brandingConfig: null });

export const BrandingProvider: React.FC<{ tenantId: string; children?: React.ReactNode }> = ({ tenantId, children }) => {
  const [brandingConfig, setBrandingConfig] = useState<BrandingConfig | null>(null);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const config = await BrandingService.getBrandingConfig(tenantId);
        setBrandingConfig(config);
      } catch (error) {
        // Branding config failed - will use defaults
        logger.warn('Failed to load branding config, using defaults', { tenantId, error: String(error) })
      }
    };

    fetchBranding();
  }, [tenantId]);

  return (
    <BrandingContext.Provider value={{ brandingConfig }}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => useContext(BrandingContext);