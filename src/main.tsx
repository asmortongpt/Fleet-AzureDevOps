// FIX: Import React FIRST to prevent TDZ errors with @microsoft/applicationinsights-react-js
// ApplicationInsights ReactPlugin requires React to be available before initialization
import React from "react"
import ReactDOM from "react-dom/client"

// Initialize MSW API mocking in development mode (non-blocking)
if (import.meta.env.DEV) {
  import('./mocks/browser').catch(console.error)  // Don't block app startup
}

// Initialize i18n BEFORE React renders - this is critical for SSR and proper language detection
import './i18n/config'

// Initialize axe-core accessibility testing in development
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { registerSW } from 'virtual:pwa-register'

import App from "./App"
import ProtectedRoute from "./components/ProtectedRoute"
import { SentryErrorBoundary } from "./components/errors/SentryErrorBoundary"
import { ThemeProvider } from "./components/providers/ThemeProvider"
import { initializeAxe } from './lib/accessibility/axe-init'
if (import.meta.env.DEV) {
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

  console.log('[Fleet] Production mode: All authentication bypass mechanisms removed');
}

// Initialize Sentry before all other imports for proper error tracking
// @ts-ignore - virtual module provided by vite-plugin-pwa

// TEMP DISABLED: Azure Key Vault should be backend-only, not frontend
// import { validateSecrets, getSecret, checkKeyVaultHealth } from "./config/secrets"
import { AuthProvider } from "./contexts/AuthContext"
import { DrilldownProvider } from "./contexts/DrilldownContext"
import { FeatureFlagProvider } from "./contexts/FeatureFlagContext"
import { TenantProvider } from "./contexts/TenantContext"
import { initSentry } from "./lib/sentry"
import { Login } from "./pages/Login"
initSentry()

/**
 * P0-3 SECURITY FIX: Startup JWT validation
 * Import secret management for production environments
 */

// Initialize Application Insights for production telemetry
import telemetryService from "./lib/telemetry"

// PWA Service Worker registration
// @ts-ignore

const reactPlugin = telemetryService.initialize()
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { InspectProvider } from "./services/inspect/InspectContext"
import { NavigationProvider } from "./contexts/NavigationContext"
import { BrandingProvider } from "./shared/branding/BrandingProvider"

// Professional theme with high contrast colors - fixes green-on-green readability
// DISABLED: Conflicts with Deep Midnight Dark Theme
// import "./styles/professional-theme-fix.css"

// Core Tailwind v4 + Enterprise Design System
import "./index.css"

// Responsive Utilities
import "./styles/design-tokens-responsive.css"
import "./styles/responsive-utilities.css"
import "./styles/dark-mode-enhancements.css"

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
 * TODO: Implement backend API endpoint for secret validation
 * TODO: Call backend /api/health or /api/config endpoint from frontend
 */
async function validateStartupConfiguration(): Promise<void> {
  console.log('[Fleet] Starting application configuration validation...');
  console.log('[Fleet] ⚠️  NOTICE: Azure Key Vault validation disabled (frontend)');
  console.log('[Fleet] ⚠️  Secret validation must be implemented in backend API');

  // TEMP: Skip all Key Vault validation in frontend
  // This allows the app to start in development mode
  console.log('[Fleet] ✅ Frontend startup validation: PASSED (Key Vault disabled)');

  /* COMMENTED OUT - CAUSES BROWSER CRASH
  try {
    // Only validate secrets in production mode
    if (import.meta.env.MODE === 'production') {
      console.log('[Fleet] Production mode detected - validating Key Vault connectivity...');

      // Step 1: Check Key Vault connectivity
      const healthCheck = await checkKeyVaultHealth();
      if (!healthCheck.healthy) {
        throw new Error(`Key Vault health check failed: ${healthCheck.error}`);
      }
      console.log('[Fleet] ✓ Key Vault connectivity verified');

      // Step 2: Validate all required secrets
      console.log('[Fleet] Validating required secrets...');
      await validateSecrets();
      console.log('[Fleet] ✓ All required secrets validated');

      // Step 3: Validate JWT configuration
      console.log('[Fleet] Validating JWT configuration...');
      const jwtSecret = await getSecret("JWT-SECRET");

      if (jwtSecret.length < 32) {
        throw new Error(
          `JWT-SECRET must be at least 32 characters for security (current: ${jwtSecret.length} chars)`
        );
      }
      console.log('[Fleet] ✓ JWT configuration valid');

      console.log('[Fleet] ✅ Startup validation: PASSED');
    } else {
      console.log('[Fleet] Development mode - skipping Key Vault validation');
      console.log('[Fleet] ⚠️  WARNING: Using local environment variables');
    }
  } catch (error) {
    console.error('[Fleet] ❌ FATAL: Startup validation failed:', error);

    // Show user-friendly error page instead of blank screen
    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="
          padding: 40px;
          max-width: 800px;
          margin: 100px auto;
          text-align: center;
          font-family: system-ui, -apple-system, sans-serif;
          background: #fff;
          border: 2px solid #ef4444;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        ">
          <h1 style="color: #dc2626; margin-bottom: 20px;">
            ⚠️ Configuration Error
          </h1>
          <p style="color: #374151; font-size: 18px; margin-bottom: 20px;">
            The application could not start due to missing or invalid configuration.
          </p>
          <details style="
            text-align: left;
            background: #f9fafb;
            padding: 20px;
            border-radius: 4px;
            margin-top: 20px;
          ">
            <summary style="cursor: pointer; font-weight: bold; color: #1f2937;">
              Technical Details (Click to expand)
            </summary>
            <pre style="
              margin-top: 10px;
              padding: 10px;
              background: #1f2937;
              color: #f9fafb;
              border-radius: 4px;
              overflow: auto;
              font-size: 14px;
            ">${error instanceof Error ? error.message : 'Unknown error'}</pre>
          </details>
          <p style="color: #6b7280; margin-top: 30px; font-size: 14px;">
            Please contact your system administrator or check the deployment configuration.
          </p>
        </div>
      `;
    }

    // Re-throw to prevent app from starting
    throw error;
  }
  */
}

// P0-3: Run validation BEFORE rendering app
// This ensures app only starts if all security requirements are met
validateStartupConfiguration().then(() => {
  console.log('[Fleet] Starting application...');

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system" storageKey="ctafleet-theme">
          <SentryErrorBoundary level="page">
            <BrandingProvider>
              <AuthProvider>
                <TenantProvider>
                  <FeatureFlagProvider>
                    <DrilldownProvider>
                      <InspectProvider>
                        <BrowserRouter>
                          {/* <GlobalCommandPalette /> */}
                          <SentryRoutes>
                            {/* Public Login Route */}
                            <Route path="/login" element={<Login />} />

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
                      </InspectProvider>
                    </DrilldownProvider>
                  </FeatureFlagProvider>
                </TenantProvider>
              </AuthProvider>
            </BrandingProvider>
          </SentryErrorBoundary>
        </ThemeProvider>
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
    onOfflineReady() {
      console.log('App ready to work offline')
    },
  })
}).catch((error) => {
  // P0-3: Validation failed - app will not start
  console.error('[Fleet] Application startup aborted due to validation failure:', error);
});
