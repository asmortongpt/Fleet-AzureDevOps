/**
 * Fleet Management System - Clean Production App
 *
 * Simple, professional layout:
 * - Full-screen Fleet Dashboard by default
 * - No sidebar navigation (module switching via dedicated nav component if needed)
 * - Dark theme
 * - Production-ready for clients
 */

import { useEffect, useState } from "react"
import { ErrorBoundary } from "react-error-boundary"

import { FleetDashboard } from "@/components/modules/fleet/FleetDashboard"
import { SentryErrorBoundary } from "@/components/errors/SentryErrorBoundary"
import { DrilldownProvider } from "@/contexts/DrilldownContext"
import { InspectDrawer } from "@/components/inspect/InspectDrawer"
import { InspectProvider } from "@/services/inspect/InspectContext"
import { useFleetData } from "@/hooks/use-fleet-data"
import telemetryService from "@/lib/telemetry"

function AppErrorFallback({ error }: { error: Error }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-card border rounded-lg p-6">
        <h1 className="text-2xl font-bold text-destructive mb-4">Application Error</h1>
        <p className="text-muted-foreground mb-4">
          An unexpected error occurred. Please refresh the page to continue.
        </p>
        <pre className="bg-muted p-4 rounded text-sm overflow-auto">
          {error.message}
        </pre>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 w-full bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
        >
          Reload Application
        </button>
      </div>
    </div>
  )
}

function App() {
  const [reactPlugin] = useState(() => telemetryService.initialize())
  const fleetData = useFleetData()

  // Initialize fleet data on mount
  useEffect(() => {
    fleetData.initializeData()
  }, [fleetData.initializeData])

  // Initialize telemetry tracking
  useEffect(() => {
    telemetryService.trackPageView('Fleet Dashboard Loaded')
  }, [])

  return (
    <ErrorBoundary FallbackComponent={AppErrorFallback}>
      <SentryErrorBoundary level="page">
        <DrilldownProvider>
          <InspectProvider>
            <div className="min-h-screen bg-background">
              {/* Full-screen Fleet Dashboard - Production Ready */}
              <FleetDashboard data={fleetData} />

              {/* Inspect Drawer for detailed entity views */}
              <InspectDrawer />
            </div>
          </InspectProvider>
        </DrilldownProvider>
      </SentryErrorBoundary>
    </ErrorBoundary>
  )
}

export default App
