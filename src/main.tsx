// Initialize Sentry before all other imports for proper error tracking
import { initSentry } from "./lib/sentry"
initSentry()

import * as Sentry from "@sentry/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter, Routes, Route } from "react-router-dom"

import App from "./App"
import { SentryErrorBoundary } from "./components/errors/SentryErrorBoundary"
import { AuthProvider } from "./components/providers/AuthProvider"
import { ThemeProvider } from "./components/providers/ThemeProvider"
import { InspectProvider } from "./services/inspect/InspectContext"
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

// Use Sentry's BrowserRouter integration
const SentryRoutes = Sentry.withSentryRouting(Routes)

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark">
      <QueryClientProvider client={queryClient}>
        <SentryErrorBoundary level="page">
          <AuthProvider>
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
          </AuthProvider>
        </SentryErrorBoundary>
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>
)
