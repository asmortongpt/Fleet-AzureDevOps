import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'
import { TenantProvider } from './lib/tenantContext.tsx'
import { AuthProvider } from './components/providers/AuthProvider.tsx'
import { QueryProvider } from './components/providers/QueryProvider.tsx'
import { ThemeProvider } from './components/providers/ThemeProvider.tsx'
import { Login } from './pages/Login.tsx'
import { AuthCallback } from './pages/AuthCallback.tsx'
import { isAuthenticated } from './lib/microsoft-auth.ts'
import MobileEmulatorTestScreen from './components/testing/MobileEmulatorTestScreen.tsx'
import { startVersionChecker } from './lib/version-checker.ts'

// Azure Application Insights Telemetry
import {
  initializeTelemetry,
  trackReactErrorBoundary,
  captureException,
  ErrorCategory,
} from './telemetry'

// Service Worker registration - auto-initializes on import
import './registerServiceWorker.ts'

import "./main.css"
import "./styles/theme.css"
import "./index.css"
// TODO: Fix leaflet CSS import - causes Vite serving issues
// import "leaflet/dist/leaflet.css"

// Initialize Azure Application Insights telemetry
// This sets up:
// - Auto page view tracking
// - AJAX request monitoring
// - JavaScript exception tracking
// - Performance metrics collection
// - Core Web Vitals (LCP, FID/INP, CLS)
// - 10% sampling for production
initializeTelemetry({
  enableWebVitals: true,
  enableLongTaskObserver: true,
  // Enable periodic memory monitoring only in production
  enablePerformanceMonitoring: import.meta.env.PROD,
  performanceMonitoringInterval: 60000, // 1 minute
});

// Start automatic version checking and cache refresh
startVersionChecker();

// Error handler for the root error boundary
// This logs errors to Application Insights
function handleRootError(error: Error, info: React.ErrorInfo) {
  trackReactErrorBoundary(error, info, 'RootErrorBoundary');
  console.error('[ROOT_ERROR_BOUNDARY] Error caught:', error, info);
}

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const authenticated = isAuthenticated()
  console.log('[PROTECTED_ROUTE] isAuthenticated:', authenticated)

  // In DEV mode or test environment, always allow access
  if (import.meta.env.DEV) {
    console.log('[PROTECTED_ROUTE] DEV mode - allowing access')
    return <>{children}</>
  }

  return authenticated ? <>{children}</> : <Navigate to="/login" replace />
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback} onError={handleRootError}>
    <QueryProvider>
      <ThemeProvider defaultTheme="system">
        <BrowserRouter>
          <TenantProvider>
            <AuthProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/auth/success" element={<AuthCallback />} />
                <Route path="/test/mobile-emulator" element={<MobileEmulatorTestScreen />} />
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <App />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </AuthProvider>
          </TenantProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryProvider>
   </ErrorBoundary>
)
