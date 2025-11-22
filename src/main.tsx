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

// Telemetry module - STUBBED due to React 19 incompatibility
// The ApplicationInsights SDK crashes with: "Cannot set properties of undefined (setting 'Activity')"
// All telemetry functions are now no-op stubs that maintain API compatibility
import {
  initializeTelemetry,
  trackReactErrorBoundary,
  ErrorCategory,
} from './telemetry'

// Service worker registration - imported for manual initialization AFTER React mounts
// DO NOT import './registerServiceWorker.ts' directly as it auto-initializes
import { registerServiceWorker, showUpdateNotification, skipWaiting } from './registerServiceWorker.ts'

import "./main.css"
import "./styles/theme.css"
import "./index.css"
// TODO: Fix leaflet CSS import - causes Vite serving issues
// import "leaflet/dist/leaflet.css"

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

// =============================================================================
// REACT RENDERS FIRST - No blocking initialization before this point
// =============================================================================
console.log('[App] Starting React application...');

const root = createRoot(document.getElementById('root')!);
root.render(
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
);

console.log('[App] React mounted successfully');

// =============================================================================
// BACKGROUND SERVICES - Initialize AFTER React mounts with 500ms delay
// =============================================================================
setTimeout(async () => {
  console.log('[App] Initializing background services...');

  // Initialize Azure Application Insights telemetry (non-blocking)
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
  }).catch((err) => {
    console.warn('[Telemetry] Failed to initialize - continuing without telemetry:', err);
  });

  // Start automatic version checking and cache refresh
  try {
    startVersionChecker();
  } catch (err) {
    console.warn('[Version Checker] Failed to start:', err);
  }

  // Register service worker (production only or when explicitly enabled)
  const shouldRegisterSW =
    import.meta.env.PROD ||
    import.meta.env.VITE_ENABLE_SW === 'true';

  if (shouldRegisterSW && 'serviceWorker' in navigator) {
    try {
      const registration = await registerServiceWorker({
        onReady: () => {
          console.log('[App] Service Worker ready');
        },
        onUpdate: async () => {
          console.log('[App] New version available');
          const shouldUpdate = await showUpdateNotification();
          if (shouldUpdate) {
            skipWaiting();
            // Reload after a short delay to allow activation
            setTimeout(() => {
              window.location.reload();
            }, 100);
          }
        },
        onSuccess: () => {
          console.log('[App] Content cached for offline use');
        },
        onError: (error) => {
          console.error('[App] Service Worker error:', error);
        },
        onMessage: (event) => {
          if (event.data?.type === 'SW_ACTIVATED') {
            console.log('[App] Service Worker activated with version:', event.data.version);
          }
        },
      });
      if (registration) {
        console.log('[SW] Registered:', registration.scope);
      }
    } catch (error) {
      console.warn('[SW] Registration failed:', error);
    }
  } else if (!shouldRegisterSW) {
    console.log('[SW] Skipping registration in development mode');
  }

  console.log('[App] Background services initialized');
}, 500);
