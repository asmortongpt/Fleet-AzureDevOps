import { Component, ReactNode, ErrorInfo } from 'react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home, Bug, Clock } from 'lucide-react'
import { telemetryService } from '@/lib/telemetry'

import logger from '@/utils/logger';
interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showDetails?: boolean
  resetKeys?: any[]
  onReset?: () => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  errorCount: number
  retryCount: number
  isRetrying: boolean
  retryDelay: number
}

const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY = 1000 // 1 second
const MAX_RETRY_DELAY = 10000 // 10 seconds

// Global error tracking for debugging
const errorLog: Array<{ timestamp: string; error: string; stack?: string; componentStack?: string }> = []

// Expose error log globally for debugging
if (typeof window !== 'undefined') {
  (window as any).__FLEET_ERROR_LOG__ = errorLog
}

export class ErrorBoundary extends Component<Props, State> {
  private retryTimeoutId?: number

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      errorCount: 0,
      retryCount: 0,
      isRetrying: false,
      retryDelay: INITIAL_RETRY_DELAY,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const timestamp = new Date().toISOString()
    logger.error('ErrorBoundary caught error:', error, errorInfo)

    // Update error count and store error info
    this.setState((prev) => ({
      errorInfo,
      errorCount: prev.errorCount + 1,
    }))

    // Add to global error log
    const errorEntry = {
      timestamp,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack
    }
    errorLog.push(errorEntry)
    if (errorLog.length > 50) errorLog.shift()

    // Track error in Application Insights
    this.trackError(error, errorInfo)

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    // Store in localStorage for debugging
    this.storeErrorLog(error, errorInfo)
  }

  componentDidUpdate(prevProps: Props) {
    // Reset error boundary if resetKeys changed
    if (this.state.hasError && this.props.resetKeys) {
      const prevKeys = prevProps.resetKeys || []
      const currentKeys = this.props.resetKeys

      if (prevKeys.length !== currentKeys.length ||
          prevKeys.some((key, index) => key !== currentKeys[index])) {
        this.handleReset()
      }
    }
  }

  componentWillUnmount() {
    // Clear retry timeout
    if (this.retryTimeoutId) {
      window.clearTimeout(this.retryTimeoutId)
    }
  }

  /**
   * Track error in Application Insights
   */
  private trackError(error: Error, errorInfo: ErrorInfo) {
    try {
      telemetryService.trackException(error, 3, {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
        errorCount: this.state.errorCount,
        retryCount: this.state.retryCount,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      })

      // Also track as event for better querying
      telemetryService.trackEvent('ErrorBoundary_Error', {
        errorMessage: error.message,
        errorName: error.name,
        errorStack: error.stack?.substring(0, 500),
        componentStack: errorInfo.componentStack?.substring(0, 500),
        errorCount: this.state.errorCount.toString(),
        retryCount: this.state.retryCount.toString(),
      })
    } catch (trackingError) {
      logger.error('Failed to track error in Application Insights:', trackingError)
    }
  }

  /**
   * Store error log in localStorage
   */
  private storeErrorLog(error: Error, errorInfo: ErrorInfo) {
    try {
      const errorLog = {
        timestamp: new Date().toISOString(),
        error: {
          message: error.message,
          name: error.name,
          stack: error.stack,
        },
        errorInfo: {
          componentStack: errorInfo.componentStack,
        },
        userAgent: navigator.userAgent,
        url: window.location.href,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        errorCount: this.state.errorCount,
        retryCount: this.state.retryCount,
      }

      const existingLogs = JSON.parse(
        localStorage.getItem('fleet-error-logs') || '[]'
      )

      // Keep only last 20 errors
      const updatedLogs = [errorLog, ...existingLogs].slice(0, 20)

      localStorage.setItem('fleet-error-logs', JSON.stringify(updatedLogs))
    } catch (e) {
      logger.error('Failed to store error log:', e)
    }
  }

  /**
   * Reset error boundary state
   */
  private handleReset = () => {
    telemetryService.trackEvent('ErrorBoundary_Reset', {
      errorCount: this.state.errorCount.toString(),
      retryCount: this.state.retryCount.toString(),
    })

    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      isRetrying: false,
    })

    this.props.onReset?.()
  }

  /**
   * Retry with exponential backoff
   */
  private handleRetry = () => {
    const { retryCount, retryDelay } = this.state

    if (retryCount >= MAX_RETRIES) {
      alert('Maximum retry attempts reached. Please reload the page.')
      return
    }

    telemetryService.trackEvent('ErrorBoundary_Retry', {
      retryCount: retryCount.toString(),
      retryDelay: retryDelay.toString(),
    })

    this.setState({
      isRetrying: true,
      retryCount: retryCount + 1,
    })

    // Calculate next delay with exponential backoff
    const nextDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY)

    this.retryTimeoutId = window.setTimeout(() => {
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        isRetrying: false,
        retryDelay: nextDelay,
      })

      this.props.onReset?.()
    }, retryDelay)
  }

  /**
   * Reload the page
   */
  private handleReload = () => {
    telemetryService.trackEvent('ErrorBoundary_Reload')
    window.location.reload()
  }

  /**
   * Go to home page
   */
  private handleGoHome = () => {
    telemetryService.trackEvent('ErrorBoundary_GoHome')
    window.location.href = '/'
  }

  /**
   * Download error log
   */
  private handleDownloadLog = () => {
    try {
      const logs = localStorage.getItem('fleet-error-logs') || '[]'
      const blob = new Blob([logs], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `fleet-error-log-${new Date().toISOString()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      telemetryService.trackEvent('ErrorBoundary_DownloadLog')
    } catch (error) {
      logger.error('Failed to download error log:', error)
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { error, errorInfo, errorCount, retryCount, isRetrying, retryDelay } = this.state
      const showDetails = this.props.showDetails ?? import.meta.env.DEV
      const canRetry = retryCount < MAX_RETRIES

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full shadow-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-red-600 dark:text-red-400">
                Something Went Wrong
              </CardTitle>
              <CardDescription className="text-base mt-2">
                We encountered an unexpected error. Our team has been notified and is working to fix it.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Error Message */}
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Details</AlertTitle>
                <AlertDescription className="mt-2 font-mono text-sm">
                  {error?.message || 'An unexpected error occurred'}
                </AlertDescription>
              </Alert>

              {/* Error Count Warning */}
              {errorCount > 1 && (
                <Alert>
                  <Bug className="h-4 w-4" />
                  <AlertTitle>Multiple Errors Detected</AlertTitle>
                  <AlertDescription>
                    This error has occurred {errorCount} times. {retryCount > 0 && `(Retry attempt ${retryCount}/${MAX_RETRIES})`}
                    {!canRetry && ' Maximum retry attempts reached. Please reload the page or contact support.'}
                  </AlertDescription>
                </Alert>
              )}

              {/* Retry In Progress */}
              {isRetrying && (
                <Alert>
                  <Clock className="h-4 w-4 animate-spin" />
                  <AlertTitle>Retrying...</AlertTitle>
                  <AlertDescription>
                    Attempting to recover in {Math.round(retryDelay / 1000)} seconds...
                  </AlertDescription>
                </Alert>
              )}

              {/* Technical Details (Dev Mode) */}
              {showDetails && error && (
                <details className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <summary className="cursor-pointer font-semibold mb-2 flex items-center gap-2">
                    <Bug className="w-4 h-4" />
                    Technical Details (Development Only)
                  </summary>
                  <div className="space-y-3 mt-3">
                    <div>
                      <div className="text-sm font-semibold mb-1">Error Type:</div>
                      <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded">
                        {error.name}
                      </pre>
                    </div>
                    <div>
                      <div className="text-sm font-semibold mb-1">Stack Trace:</div>
                      <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-x-auto max-h-48 overflow-y-auto">
                        {error.stack}
                      </pre>
                    </div>
                    {errorInfo && (
                      <div>
                        <div className="text-sm font-semibold mb-1">
                          Component Stack:
                        </div>
                        <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-x-auto max-h-48 overflow-y-auto">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {canRetry && !isRetrying && (
                  <Button
                    onClick={this.handleRetry}
                    variant="default"
                    className="flex-1"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry ({retryCount}/{MAX_RETRIES})
                  </Button>
                )}
                <Button
                  onClick={this.handleReset}
                  variant="outline"
                  className="flex-1"
                  disabled={isRetrying}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="flex-1"
                  disabled={isRetrying}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Page
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1"
                  disabled={isRetrying}
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>

              {/* Download Log Button */}
              {showDetails && (
                <Button
                  onClick={this.handleDownloadLog}
                  variant="ghost"
                  className="w-full"
                  size="sm"
                >
                  <Bug className="w-4 h-4 mr-2" />
                  Download Error Log
                </Button>
              )}

              {/* Support Info */}
              <div className="text-center text-sm text-muted-foreground">
                <p>
                  If this problem persists, please contact support with the error
                  code:
                </p>
                <code className="mt-1 inline-block bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded font-mono">
                  {Date.now().toString(36).toUpperCase()}
                </code>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Hook to programmatically trigger error boundary
 */
export function useErrorHandler() {
  return (error: Error) => {
    throw error
  }
}

export default ErrorBoundary
