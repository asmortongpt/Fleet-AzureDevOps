// FIX: Import React FIRST to prevent TDZ errors with @microsoft/applicationinsights-react-js
// ApplicationInsights ReactPlugin requires React to be available before initialization
import React from "react"
import ReactDOM from "react-dom/client"

// DEMO MODE: Disabled by default - SSO-first production deployment
// To enable demo mode for development, manually set: localStorage.setItem('demo_mode', 'true')
if (typeof window !== 'undefined' && !localStorage.getItem('demo_mode')) {
  localStorage.setItem('demo_mode', 'false');
  console.log('[Fleet] SSO authentication required - demo mode disabled');
}

// Initialize Sentry before all other imports for proper error tracking
import { BrowserRouter, Routes, Route } from "react-router-dom"

import App from "./App"
import { Login } from "./pages/Login"
import { GlobalCommandPalette } from "./components/common/GlobalCommandPalette"
import { SentryErrorBoundary } from "./components/errors/SentryErrorBoundary"
import { ThemeProvider } from "./components/providers/ThemeProvider"
import ProtectedRoute from "./components/ProtectedRoute"
import { AuthProvider } from "./contexts/AuthContext"
import { DrilldownProvider } from "./contexts/DrilldownContext"
import { FeatureFlagProvider } from "./contexts/FeatureFlagContext"
import { TenantProvider } from "./contexts/TenantContext"
import { initSentry } from "./lib/sentry"
initSentry()

// Initialize Application Insights for production telemetry
import telemetryService from "./lib/telemetry"

const reactPlugin = telemetryService.initialize()
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { InspectProvider } from "./services/inspect/InspectContext"
import { NavigationProvider } from "./contexts/NavigationContext"
import { BrandingProvider } from "./shared/branding/BrandingProvider"

// Professional theme with high contrast colors - fixes green-on-green readability
import "./styles/professional-theme-fix.css"
import "./index.css"
import "./styles/design-tokens-responsive.css"
import "./styles/responsive-utilities.css"
import "./styles/dark-mode-enhancements.css"
import "./styles/fleet-theme.css"

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

// @ts-ignore
import { registerSW } from 'virtual:pwa-register'

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
