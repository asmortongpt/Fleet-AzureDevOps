// Initialize demo mode FIRST to prevent API errors
if (typeof window !== 'undefined' && !localStorage.getItem('demo_mode')) {
  localStorage.setItem('demo_mode', 'true');
  localStorage.setItem('demo_role', 'fleet_manager');
  console.log('[Fleet] Demo mode enabled by default');
}

// =============================================================================
// SECURITY & MONITORING INITIALIZATION
// Initialize security and monitoring features before application code
// =============================================================================

// Security Features
import { initCSPReporting } from "./lib/security/csp"
import { initSRI } from "./lib/security/sri"
import { initSecurityHeaders } from "./lib/security/headers"
import { initSanitization } from "./lib/security/sanitize"

// Monitoring Features
import { initSentry } from "./lib/monitoring/sentry"
import { initTelemetry } from "./lib/monitoring/telemetry"
import { initPerformanceMonitoring } from "./lib/monitoring/performance-monitoring"
import { initRUM } from "./lib/monitoring/rum"

// Initialize security features (order matters)
initCSPReporting()
initSRI()
initSecurityHeaders()
initSanitization()

// Initialize monitoring features (order matters)
initSentry() // Error tracking first
initTelemetry() // Distributed tracing
initPerformanceMonitoring() // Web Vitals
initRUM() // Real User Monitoring

// Legacy telemetry (keeping for backwards compatibility)
import telemetryService from "./lib/telemetry"
const reactPlugin = telemetryService.initialize()

import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

// i18n Internationalization
import './i18n/config'

import { AuthProvider } from "./contexts/AuthContext"
import { TenantProvider } from "./contexts/TenantContext"
import { FeatureFlagProvider } from "./contexts/FeatureFlagContext"
import { InspectProvider } from "./services/inspect/InspectContext"
import { DrilldownProvider } from "./contexts/DrilldownContext"
import { NavigationProvider } from "./contexts/NavigationContext"
import { ThemeProvider } from "./components/providers/ThemeProvider"
import { SentryErrorBoundary } from "./components/errors/SentryErrorBoundary"
import { GlobalCommandPalette } from "./components/common/GlobalCommandPalette"
import App from "./App"
import "./index.css"
import "./styles/design-tokens-responsive.css"
import "./styles/responsive-utilities.css"
import "./styles/dark-mode-enhancements.css"

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

// Use Sentry's BrowserRouter integration (disabled - using regular Routes)
// const SentryRoutes = Sentry.withSentryRouting(Routes)
const SentryRoutes = Routes

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="ctafleet-theme">
        <SentryErrorBoundary level="page">
          <AuthProvider>
            <TenantProvider>
              <FeatureFlagProvider>
                <DrilldownProvider>
                  <InspectProvider>
                    <BrowserRouter>
                      <GlobalCommandPalette />
                      <SentryRoutes>
                        <Route
                          path="/*"
                          element={
                            <SentryErrorBoundary level="section">
                              <NavigationProvider>
                                <App />
                              </NavigationProvider>
                            </SentryErrorBoundary>
                          }
                        />
                      </SentryRoutes>
                    </BrowserRouter>
                  </InspectProvider>
                </DrilldownProvider>
              </FeatureFlagProvider>
            </TenantProvider>
          </AuthProvider>
        </SentryErrorBoundary>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
)
