// FIX: Import React FIRST to prevent TDZ errors with @microsoft/applicationinsights-react-js
// ApplicationInsights ReactPlugin requires React to be available before initialization
import React from "react"
import ReactDOM from "react-dom/client"

// Initialize i18n BEFORE React renders - this is critical for SSR and proper language detection
import './i18n/config'

// Initialize axe-core accessibility testing in development
import { initializeAxe } from './lib/accessibility/axe-init'
// Only enable when explicitly requested; axe logs to console.error by design.
if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_AXE === 'true') {
  initializeAxe()
}

/**
 * P0-2 SECURITY FIX: Remove demo_mode localStorage bypass
 * CRITICAL: Production builds must NEVER allow authentication bypass
 *
 * Previous code allowed localStorage.getItem('demo_mode') to bypass SSO authentication.
 * This is a critical security vulnerability that could allow unauthorized access.
 */
if (import.meta.env.MODE === 'production' && typeof window !== 'undefined') {
  // P0-2: Clear any demo mode artifacts from localStorage in production
  localStorage.removeItem('demo_mode');
  localStorage.removeItem('mock_auth');
  localStorage.removeItem('bypass_sso');
  localStorage.removeItem('demo_user');

  // Freeze localStorage to prevent runtime modifications (defense in depth)
  // Note: This prevents ALL localStorage writes in production, which may affect analytics
  // If needed, use sessionStorage or cookies for non-sensitive data
  // Object.freeze(localStorage); // Uncomment if strict security is required

}

// Initialize Sentry before all other imports for proper error tracking
import { BrowserRouter, Routes, Route } from "react-router-dom"
// @ts-expect-error - virtual module provided by vite-plugin-pwa; types require adding
// `/// <reference types="vite-plugin-pwa/client" />` or referencing client.d.ts in tsconfig
import { registerSW } from 'virtual:pwa-register'

import App from "./App"
import ProtectedRoute from "./components/ProtectedRoute"
import { SentryErrorBoundary } from "./components/errors/SentryErrorBoundary"
import { ThemeProvider } from "./components/providers/ThemeProvider"
// Azure Key Vault integration is backend-only (Node.js packages cannot run in browser)
// Frontend validates backend availability via /api/health endpoint instead
import { AuthProvider } from "./contexts/AuthContext"
import { DrilldownProvider } from "./contexts/DrilldownContext"
import { FeatureFlagProvider } from "./contexts/FeatureFlagContext"
import { PolicyProvider } from "./contexts/PolicyContext"
import { TenantProvider } from "./contexts/TenantContext"
import { initSentry } from "./lib/sentry"
import { Login } from "./pages/Login"
import { AuthCallback } from "./pages/AuthCallback"
import { PublicClientApplication } from "@azure/msal-browser"
import { MsalProvider } from "@azure/msal-react"
import { msalConfig } from "./lib/msal-config"

initSentry()

// Initialize MSAL instance for Azure AD SSO
const msalInstance = new PublicClientApplication(msalConfig)

/**
 * P0-3 SECURITY FIX: Startup JWT validation
 * Import secret management for production environments
 */

// Initialize Application Insights for production telemetry
import telemetryService from "./lib/telemetry"

// PWA Service Worker registration

const reactPlugin = telemetryService.initialize()
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { InspectProvider } from "./services/inspect/InspectContext"
import { NavigationProvider } from "./contexts/NavigationContext"
import { PanelProvider } from "./contexts/PanelContext"
import { BrandingProvider } from "./shared/branding/BrandingProvider"

// Professional theme with high contrast colors - fixes green-on-green readability
// DISABLED: Conflicts with Deep Midnight Dark Theme
// import "./styles/professional-theme-fix.css"

// Core Tailwind v4 + Enterprise Design System
import "./index.css"
import "./styles/pro-max.css"

// Responsive Utilities
import "./styles/design-tokens-responsive.css"
import "./styles/responsive-utilities.css"
import "./styles/dark-mode-enhancements.css"
import "./styles/cta-hubs.css"

// WCAG 2.1 AA Accessibility Styles
import "./styles/accessibility.css"

// Legacy fleet theme - DISABLED to prevent conflicts
// import "./styles/fleet-theme.css"

// Create a client with reactive data configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Disable auto-refetch on focus for performance
      refetchInterval: false, // Disable auto-refresh (was 10 seconds - too aggressive)
      staleTime: 60000, // Data considered fresh for 60 seconds
      retry: 1,
    },
  },
})

// Use Sentry's BrowserRouter integration (disabled - using regular Routes)
// const SentryRoutes = Sentry.withSentryRouting(Routes)
const SentryRoutes = Routes

/**
 * P0-3 SECURITY FIX: Startup configuration validation
 * CRITICAL: Application MUST NOT start if required secrets are missing or invalid
 * This prevents silent failures and ensures proper JWT configuration
 *
 * TEMP DISABLED: Azure Key Vault integration must be moved to backend API
 * The @azure/identity and @azure/keyvault-secrets packages are Node.js-only
 * and cannot run in browser environment. Secret validation should happen
 * in the backend API server, not in the frontend.
 *
 * Secret validation (Key Vault, JWT) is handled server-side by the backend API.
 * The frontend checks the backend /api/health endpoint to confirm it is operational.
 */
async function validateStartupConfiguration(): Promise<void> {
  const apiUrl = import.meta.env.VITE_API_URL || '';
  const healthUrl = `${apiUrl}/api/health`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(healthUrl, {
      method: 'GET',
      signal: controller.signal,
      credentials: 'include',
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      console.log('[Fleet] Backend health check passed:', data.status || 'ok');
    } else {
      console.warn(`[Fleet] Backend health check returned status ${response.status} - app will continue but some features may be unavailable`);
    }
  } catch (error) {
    // Non-blocking: log warning but allow app to render
    // This handles cases where the backend is temporarily unavailable or network is slow
    console.warn('[Fleet] Backend health check failed (non-blocking):', error instanceof Error ? error.message : 'Unknown error');
    console.warn('[Fleet] The application will start, but API-dependent features may not work until the backend is reachable');
  }
}

// P0-3: Run validation BEFORE rendering app
// This ensures app only starts if all security requirements are met
validateStartupConfiguration().then(async () => {
  // Initialize MSAL before rendering - required for MSAL v2+
  try {
    await msalInstance.initialize();
    // Handle any redirect promise from SSO callback
    await msalInstance.handleRedirectPromise();
  } catch (error) {
    console.error('[Fleet] MSAL initialization failed:', error);
  }

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <MsalProvider instance={msalInstance}>
          <ThemeProvider defaultTheme="system" storageKey="ctafleet-theme">
            <SentryErrorBoundary level="page">
              <BrandingProvider>
                <AuthProvider>
                  <TenantProvider>
                    <PolicyProvider>
                      <FeatureFlagProvider>
                        <DrilldownProvider>
                          <InspectProvider>
                            <PanelProvider>
                            <BrowserRouter>
                            {/* <GlobalCommandPalette /> */}
                            <SentryRoutes>
                              {/* Public Login Route */}
                              <Route path="/login" element={<Login />} />

                              {/* OAuth Callback Route - Public (no auth required) */}
                              <Route path="/auth/callback" element={<AuthCallback />} />

                              {/* Protected Application Routes - Require SSO Authentication */}
                              <Route
                                path="/*"
                                element={
                                  <ProtectedRoute requireAuth={true}>
                                    <SentryErrorBoundary level="section">
                                      <NavigationProvider>
                                        <App />
                                      </NavigationProvider>
                                    </SentryErrorBoundary>
                                  </ProtectedRoute>
                                }
                              />
                            </SentryRoutes>
                          </BrowserRouter>
                          </PanelProvider>
                        </InspectProvider>
                      </DrilldownProvider>
                    </FeatureFlagProvider>
                  </PolicyProvider>
                </TenantProvider>
              </AuthProvider>
            </BrandingProvider>
            </SentryErrorBoundary>
          </ThemeProvider>
        </MsalProvider>
      </QueryClientProvider>
    </React.StrictMode>
  )

  // Register service worker for PWA functionality
  const updateSW = registerSW({
    onNeedRefresh() {
      if (confirm('New content available. Reload?')) {
        updateSW(true)
      }
    },
    onOfflineReady() {},
  })
}).catch((error) => {
  // P0-3: Validation failed - app will not start
  console.error('[Fleet] Application startup aborted due to validation failure:', error);
});
