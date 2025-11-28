// Initialize Sentry before all other imports for proper error tracking
import { initSentry } from "./lib/sentry"
initSentry()

import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import * as Sentry from "@sentry/react"
import { AuthProvider } from "./components/providers/AuthProvider"
import { InspectProvider } from "./services/inspect/InspectContext"
import { useAuth } from "./hooks/useAuth"
import { SentryErrorBoundary } from "./components/errors/SentryErrorBoundary"
import App from "./App"
import Login from "./pages/Login"
import "./index.css"

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <div>Loading authentication...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// Use Sentry's BrowserRouter integration
const SentryRoutes = Sentry.withSentryRouting(Routes)

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SentryErrorBoundary level="page">
      <AuthProvider>
        <InspectProvider>
          <BrowserRouter>
            <SentryRoutes>
              <Route path="/login" element={<Login />} />
              <Route path="/auth/callback" element={<Login />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <SentryErrorBoundary level="section">
                      <App />
                    </SentryErrorBoundary>
                  </ProtectedRoute>
                }
              />
            </SentryRoutes>
          </BrowserRouter>
        </InspectProvider>
      </AuthProvider>
    </SentryErrorBoundary>
  </React.StrictMode>
)
