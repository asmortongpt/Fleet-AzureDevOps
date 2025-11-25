import { Component, ReactNode } from 'react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: any
}

// Global error tracking for debugging
const errorLog: Array<{ timestamp: string; error: string; stack?: string; componentStack?: string }> = []

// Expose error log globally for debugging
if (typeof window !== 'undefined') {
  (window as any).__FLEET_ERROR_LOG__ = errorLog
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    const timestamp = new Date().toISOString()
    const errorEntry = {
      timestamp,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack
    }

    // Add to global error log
    errorLog.push(errorEntry)
    if (errorLog.length > 50) errorLog.shift() // Keep last 50 errors

    // Detailed console logging
    console.group(`[ErrorBoundary] Error caught at ${timestamp}`)
    console.error('Error:', error.message)
    console.error('Full Error Object:', error)
    console.error('Error Stack:', error.stack)
    console.error('Component Stack:', errorInfo?.componentStack)

    // Try to identify the source of common errors
    if (error.message.includes("Cannot read properties of undefined (reading 'length')")) {
      console.warn('DIAGNOSIS: This error typically occurs when accessing .length on undefined.')
      console.warn('Common causes:')
      console.warn('  1. API returned unexpected data format (not an array)')
      console.warn('  2. Data transform failed or returned undefined')
      console.warn('  3. Vehicle/Driver data missing expected properties (e.g., alerts array)')
      console.warn('Check localStorage for token:', localStorage.getItem('token') ? 'Present' : 'Missing')
      console.warn('Check window.__FLEET_API_RESPONSES__ for recent API responses')
    }

    console.groupEnd()

    // Store error info in state for display
    this.setState({ errorInfo })

    // Attempt to report to external service (if configured)
    this.reportError(error, errorInfo)
  }

  private reportError(error: Error, errorInfo: any) {
    try {
      // Log to console in a structured format that can be captured
      const errorReport = {
        type: 'FLEET_FRONTEND_ERROR',
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo?.componentStack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        localStorage: {
          hasToken: !!localStorage.getItem('token'),
          demoMode: localStorage.getItem('demo_mode')
        }
      }

      console.log('[ErrorBoundary] Error Report:', JSON.stringify(errorReport, null, 2))

      // If API URL is available, try to send error report
      const apiUrl = (window as any).__RUNTIME_CONFIG__?.VITE_API_URL
      if (apiUrl) {
        fetch(`${apiUrl}/api/v1/telemetry/client-error`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorReport)
        }).catch(() => {
          // Silently fail - we don't want error reporting to cause more errors
        })
      }
    } catch (e) {
      // Silently fail
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center min-h-screen p-4">
          <Alert variant="destructive" className="max-w-lg">
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription className="mt-2 space-y-4">
              <p className="font-mono text-sm bg-destructive/10 p-2 rounded overflow-auto max-h-20">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>

              <details className="text-xs">
                <summary className="cursor-pointer hover:text-destructive-foreground">
                  Show technical details
                </summary>
                <div className="mt-2 space-y-2">
                  <div>
                    <strong>Error Stack:</strong>
                    <pre className="bg-muted p-2 rounded overflow-auto max-h-40 text-xs mt-1">
                      {this.state.error?.stack || 'No stack trace available'}
                    </pre>
                  </div>
                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="bg-muted p-2 rounded overflow-auto max-h-40 text-xs mt-1">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                  <div className="text-muted-foreground">
                    <p>Debug Info:</p>
                    <ul className="list-disc list-inside">
                      <li>Token: {localStorage.getItem('token') ? 'Present' : 'Missing'}</li>
                      <li>Demo Mode: {localStorage.getItem('demo_mode') || 'Not set'}</li>
                      <li>Time: {new Date().toISOString()}</li>
                    </ul>
                  </div>
                </div>
              </details>

              <div className="flex gap-2">
                <Button
                  onClick={() => window.location.reload()}
                  className="flex-1"
                >
                  Reload Page
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    localStorage.setItem('demo_mode', 'true')
                    window.location.reload()
                  }}
                  className="flex-1"
                >
                  Try Demo Mode
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )
    }

    return this.props.children
  }
}
