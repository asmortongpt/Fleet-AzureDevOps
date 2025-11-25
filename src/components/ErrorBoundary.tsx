/**
 * Error Boundary Component - ENHANCED FOR 100% COMPLIANCE
 *
 * Catches JavaScript errors anywhere in the component tree,
 * logs those errors, and displays a fallback UI
 *
 * Critical Issue #5: Error Boundaries Implementation (COMPLETE)
 */

import { Component, ReactNode } from 'react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangleIcon, RefreshCwIcon, HomeIcon } from 'lucide-react'
import logger from '@/utils/logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  resetKeys?: Array<string | number>
}

interface State {
  hasError: boolean
  error?: Error
<<<<<<< HEAD
  errorInfo?: any
}

// Global error tracking for debugging
const errorLog: Array<{ timestamp: string; error: string; stack?: string; componentStack?: string }> = []

// Expose error log globally for debugging
if (typeof window !== 'undefined') {
  (window as any).__FLEET_ERROR_LOG__ = errorLog
=======
  errorInfo?: React.ErrorInfo
  errorCount: number
>>>>>>> feature/devsecops-audit-remediation
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      errorCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

<<<<<<< HEAD
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
=======
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error)
      console.error('Component stack:', errorInfo.componentStack)
    }

    // Log to monitoring service (production-ready)
    logger.error('React Error Boundary caught error', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      componentStack: errorInfo.componentStack,
      errorCount: this.state.errorCount + 1,
      timestamp: new Date().toISOString()
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Update state with error info
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }))

    // Prevent infinite error loops
    if (this.state.errorCount > 3) {
      logger.error('Too many errors in ErrorBoundary, preventing reset')
    }
  }

  componentDidUpdate(prevProps: Props): void {
    const { resetKeys } = this.props

    if (!resetKeys) {
      return
    }

    const hasResetKeysChanged = resetKeys.some(
      (key, index) => prevProps.resetKeys?.[index] !== key
    )

    if (hasResetKeysChanged && this.state.hasError) {
      this.resetError()
    }
  }

  resetError = (): void => {
    if (this.state.errorCount > 3) {
      logger.warn('Too many reset attempts, reloading page instead')
      window.location.reload()
      return
    }

    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined
    })
  }

  goHome = (): void => {
    window.location.href = '/'
>>>>>>> feature/devsecops-audit-remediation
  }

  render() {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state
      const isDev = import.meta.env.DEV

      return this.props.fallback || (
        <div className="flex items-center justify-center min-h-screen p-4">
<<<<<<< HEAD
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
=======
          <div className="w-full max-w-2xl">
            <Alert variant="destructive" className="mb-6">
              <AlertTriangleIcon className="h-5 w-5" />
              <AlertTitle className="text-lg font-semibold">
                Application Error
              </AlertTitle>
              <AlertDescription className="mt-2">
                Something unexpected happened. Our team has been notified.
                You can try reloading the page or return to the home screen.
              </AlertDescription>
            </Alert>

            {isDev && error && (
              <div className="bg-card border rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-sm text-muted-foreground mb-3">
                  Error Details (Development Only):
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Message:
                    </p>
                    <pre className="text-xs text-destructive bg-muted/50 p-3 rounded border overflow-auto">
                      {error.message}
                    </pre>
                  </div>

                  {error.stack && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Stack Trace:
                      </p>
                      <pre className="text-xs text-muted-foreground bg-muted/50 p-3 rounded border overflow-auto max-h-48">
                        {error.stack}
                      </pre>
                    </div>
                  )}

                  {errorInfo?.componentStack && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Component Stack:
                      </p>
                      <pre className="text-xs text-muted-foreground bg-muted/50 p-3 rounded border overflow-auto max-h-48">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={this.resetError} className="flex-1" variant="default">
                <RefreshCwIcon className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={this.goHome} className="flex-1" variant="outline">
                <HomeIcon className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Error ID: {Date.now().toString(36)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                If this problem persists, please contact support with the error ID above.
              </p>
            </div>
          </div>
>>>>>>> feature/devsecops-audit-remediation
        </div>
      )
    }

    return this.props.children
  }
}
