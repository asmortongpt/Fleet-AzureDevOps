import React, { createContext, useContext, useState, useEffect } from 'react';

import BrandingService from '../services/branding.service';
import { BrandingConfig } from '../types/branding.d';

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
        // Silent failure for branding config - will use defaults
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