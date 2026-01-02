// Initialize demo mode FIRST to prevent API errors
if (typeof window !== 'undefined' && !localStorage.getItem('demo_mode')) {
  localStorage.setItem('demo_mode', 'true');
  localStorage.setItem('demo_role', 'fleet_manager');
  console.log('[Fleet] Demo mode enabled by default');
}

// Initialize Sentry before all other imports for proper error tracking
import { initSentry } from "./lib/sentry"
initSentry()

// Initialize Application Insights for production telemetry
import telemetryService from "./lib/telemetry"
const reactPlugin = telemetryService.initialize()

import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { AuthProvider } from "./contexts/AuthContext"
import { TenantProvider } from "./contexts/TenantContext"
import { FeatureFlagProvider } from "./contexts/FeatureFlagContext"
import { InspectProvider } from "./services/inspect/InspectContext"
import { DrilldownProvider } from "./contexts/DrilldownContext"
import { NavigationProvider } from "./contexts/NavigationContext"
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
    </QueryClientProvider>
  </React.StrictMode>
)
