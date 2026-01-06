import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { TenantBranding, DEFAULT_BRANDING } from './types';

interface BrandingContextType {
  branding: TenantBranding;
  applyBranding: (branding: TenantBranding) => void;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

/**
 * BrandingProvider Component
 *
 * Provides tenant branding throughout the application.
 * Automatically applies CSS custom properties to :root when branding changes.
 *
 * Usage:
 * ```tsx
 * <BrandingProvider branding={tenantBranding}>
 *   <App />
 * </BrandingProvider>
 * ```
 */
export const BrandingProvider: React.FC<{
  branding?: TenantBranding;
  children: ReactNode;
}> = ({ branding = DEFAULT_BRANDING, children }) => {

  const applyBranding = (brandingConfig: TenantBranding) => {
    const root = document.documentElement;

    // Apply primary colors
    root.style.setProperty('--brand-primary', brandingConfig.primaryColor);
    root.style.setProperty('--brand-primary-dark', brandingConfig.primaryDark);
    root.style.setProperty('--brand-primary-light', brandingConfig.primaryLight);

    // Apply status colors if customized
    if (brandingConfig.statusGood) {
      root.style.setProperty('--good', brandingConfig.statusGood);
    }
    if (brandingConfig.statusWarn) {
      root.style.setProperty('--warn', brandingConfig.statusWarn);
    }
    if (brandingConfig.statusBad) {
      root.style.setProperty('--bad', brandingConfig.statusBad);
    }

    // Apply UI customization if provided
    if (brandingConfig.accentColor) {
      root.style.setProperty('--accent', brandingConfig.accentColor);
    }
    if (brandingConfig.panelBackground) {
      root.style.setProperty('--panel', brandingConfig.panelBackground);
    }
    if (brandingConfig.textColor) {
      root.style.setProperty('--text', brandingConfig.textColor);
    }
    if (brandingConfig.mutedTextColor) {
      root.style.setProperty('--muted', brandingConfig.mutedTextColor);
    }
    if (brandingConfig.borderColor) {
      root.style.setProperty('--border', brandingConfig.borderColor);
    }

    // Apply typography if provided
    if (brandingConfig.fontFamily) {
      root.style.setProperty('--font', brandingConfig.fontFamily);
    }

    // Apply custom CSS variables
    if (brandingConfig.customCSSVars) {
      Object.entries(brandingConfig.customCSSVars).forEach(([key, value]) => {
        root.style.setProperty(key, value);
      });
    }

    // Update favicon if provided
    if (brandingConfig.faviconUrl) {
      const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (favicon) {
        favicon.href = brandingConfig.faviconUrl;
      }
    }

    // Update document title
    document.title = brandingConfig.tenantName;
  };

  // Apply branding on mount and when branding changes
  useEffect(() => {
    applyBranding(branding);
  }, [branding]);

  return (
    <BrandingContext.Provider value={{ branding, applyBranding }}>
      {children}
    </BrandingContext.Provider>
  );
};

/**
 * useBranding Hook
 *
 * Access current tenant branding from any component.
 *
 * Usage:
 * ```tsx
 * const { branding } = useBranding();
 * return <img src={branding.logoUrl} alt={branding.tenantName} />;
 * ```
 */
export const useBranding = (): BrandingContextType => {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within BrandingProvider');
  }
  return context;
};
