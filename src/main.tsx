// Initialize demo mode FIRST to prevent API errors
if (typeof window !== 'undefined' && !localStorage.getItem('demo_mode')) {
  localStorage.setItem('demo_mode', 'true');
  localStorage.setItem('demo_role', 'fleet_manager');
  console.log('[Fleet] Demo mode enabled by default');
}

// Initialize Sentry before all other imports for proper error tracking
import { initSentry } from "./lib/sentry"
initSentry()

import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import * as Sentry from "@sentry/react"
import { AuthProvider } from "./components/providers/AuthProvider"
import { InspectProvider } from "./services/inspect/InspectContext"
import { DrilldownProvider } from "./contexts/DrilldownContext"
import { useAuth } from "./hooks/useAuth"
import { SentryErrorBoundary } from "./components/errors/SentryErrorBoundary"
import App from "./App"
import Login from "./pages/Login"
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // TEMPORARILY DISABLED: Authentication bypassed for direct dashboard access
  // const { isAuthenticated, isLoading } = useAuth()

  // if (isLoading) {
  //   return <div>Loading authentication...</div>
  // }

  // if (!isAuthenticated) {
  //   return <Navigate to="/login" replace />
  // }

  return <>{children}</>
}

// Use Sentry's BrowserRouter integration (disabled - using regular Routes)
// const SentryRoutes = Sentry.withSentryRouting(Routes)
const SentryRoutes = Routes

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SentryErrorBoundary level="page">
        <AuthProvider>
          <DrilldownProvider>
            <InspectProvider>
              <BrowserRouter>
                <SentryRoutes>
                  <Route
                    path="/*"
                    element={
                      <SentryErrorBoundary level="section">
                        <App />
                      </SentryErrorBoundary>
                    }
                  />
                </SentryRoutes>
              </BrowserRouter>
            </InspectProvider>
          </DrilldownProvider>
        </AuthProvider>
      </SentryErrorBoundary>
    </QueryClientProvider>
  </React.StrictMode>
)
