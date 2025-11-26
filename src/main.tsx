import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ErrorBoundary } from "react-error-boundary";

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'
import { TenantProvider } from './lib/tenantContext.tsx'
import { AuthProvider } from './components/providers/AuthProvider.tsx'
import { QueryProvider } from './components/providers/QueryProvider.tsx'
import { ThemeProvider } from './components/providers/ThemeProvider.tsx'
import { InspectProvider } from './services/inspect/InspectContext.tsx'
import { Login } from './pages/Login.tsx'
import { AuthCallback } from './pages/AuthCallback.tsx'
import { isAuthenticated } from './lib/microsoft-auth.ts'
import MobileEmulatorTestScreen from './components/testing/MobileEmulatorTestScreen.tsx'
import { startVersionChecker } from './lib/version-checker.ts'

import "./main.css"
import "./styles/theme.css"
import "./index.css"
import "leaflet/dist/leaflet.css"

// Start automatic version checking and cache refresh
startVersionChecker();

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // CRITICAL FIX: Always bypass authentication in DEV mode
  // Check DEV mode FIRST before calling isAuthenticated
  if (import.meta.env.DEV) {
    console.log('[PROTECTED_ROUTE] DEV mode detected - bypassing authentication')
    return <>{children}</>
  }

  const authenticated = isAuthenticated()
  console.log('[PROTECTED_ROUTE] Production mode - isAuthenticated:', authenticated)

  return authenticated ? <>{children}</> : <Navigate to="/login" replace />
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <QueryProvider>
      <ThemeProvider defaultTheme="system">
        <InspectProvider>
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
        </InspectProvider>
      </ThemeProvider>
    </QueryProvider>
   </ErrorBoundary>
)
