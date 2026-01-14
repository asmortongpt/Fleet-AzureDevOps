/**
 * Enhanced Error Boundary Component
 *
 * Production-grade error handling with:
 * - Automatic retry logic
 * - Error reporting to monitoring services
 * - User-friendly error messages
 * - Recovery suggestions
 * - Fallback UI options
 *
 * Meets FAANG-level quality standards
 */

import { Warning, ArrowClockwise, House, EnvelopeSimple } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import React, { Component, ErrorInfo, ReactNode } from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showDetails?: boolean
  resetKeys?: Array<string | number>
  resetOnPropsChange?: boolean
  isolate?: boolean
  level?: 'page' | 'section' | 'component'
  maxRetries?: number
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorCount: number
  retryCount: number
  errorId: string
  errorTimestamp: Date
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null
  private previousResetKeys: Array<string | number> = []

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      retryCount: 0,
      errorId: '',
      errorTimestamp: new Date()
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    return {
      hasError: true,
      error,
      errorId,
      errorTimestamp: new Date()
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError } = this.props
    const { errorCount } = this.state

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught Error')
      console.error('Error:', error)
      console.error('Error Info:', errorInfo)
      console.error('Component Stack:', errorInfo.componentStack)
      console.groupEnd()
    }

    // Update error state
    this.setState({
      errorInfo,
      errorCount: errorCount + 1
    })

    // Report to monitoring service (Sentry, DataDog, etc.)
    this.reportError(error, errorInfo)

    // Call custom error handler
    onError?.(error, errorInfo)

    // Auto-retry for transient errors
    if (this.shouldAutoRetry(error)) {
      this.scheduleReset()
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props
    const { hasError } = this.state

    if (hasError) {
      // Reset on prop changes if configured
      if (resetOnPropsChange && prevProps.children !== this.props.children) {
        this.resetErrorBoundary()
      }

      // Reset if resetKeys changed
      if (resetKeys && this.previousResetKeys !== resetKeys) {
        if (resetKeys.some((key, idx) => key !== this.previousResetKeys[idx])) {
          this.resetErrorBoundary()
        }
      }
    }

    this.previousResetKeys = resetKeys || []
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
  }

  private shouldAutoRetry(error: Error): boolean {
    const { maxRetries = 3 } = this.props
    const { retryCount } = this.state

    // Don't retry if max retries exceeded
    if (retryCount >= maxRetries) return false

    // List of retryable error patterns
    const retryableErrors = [
      'NetworkError',
      'Failed to fetch',
      'Load failed',
      'ChunkLoadError',
      'Loading chunk',
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND'
    ]

    return retryableErrors.some(pattern =>
      error.message?.includes(pattern) || error.name?.includes(pattern)
    )
  }

  private scheduleReset = () => {
    const { retryCount } = this.state
    const delay = Math.min(1000 * Math.pow(2, retryCount), 30000) // Exponential backoff, max 30s

    this.resetTimeoutId = window.setTimeout(() => {
      this.setState(prevState => ({
        retryCount: prevState.retryCount + 1
      }), () => {
        this.resetErrorBoundary()
      })
    }, delay)
  }

  private reportError(error: Error, errorInfo: ErrorInfo) {
    const { errorId, errorTimestamp } = this.state

    // Prepare error report
    const errorReport = {
      errorId,
      timestamp: errorTimestamp.toISOString(),
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    }

    // Send to monitoring service
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack
          }
        },
        extra: errorReport
      })
    }

    // Send to custom analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: true,
        error_id: errorId
      })
    }

    // Log to server
    this.logErrorToServer(errorReport)
  }

  private async logErrorToServer(errorReport: any) {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorReport)
      })
    } catch {
      // Fail silently - don't throw in error boundary
    }
  }

  private resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
      this.resetTimeoutId = null
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    })
  }

  private getErrorType(error: Error): string {
    if (error.message?.includes('NetworkError') || error.message?.includes('fetch')) {
      return 'network'
    }
    if (error.message?.includes('ChunkLoadError') || error.message?.includes('Loading')) {
      return 'loading'
    }
    if (error.message?.includes('Permission') || error.message?.includes('403')) {
      return 'permission'
    }
    if (error.message?.includes('404')) {
      return 'notfound'
    }
    return 'unknown'
  }

  private renderErrorUI() {
    const { level = 'component', showDetails, fallback } = this.props
    const { error, errorInfo, errorId, retryCount, errorTimestamp } = this.state

    if (fallback) {
      return fallback
    }

    const errorType = this.getErrorType(error!)

    return (
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`
            ${level === 'page' ? 'min-h-screen' : level === 'section' ? 'min-h-[400px]' : 'min-h-[200px]'}
            flex items-center justify-center p-2 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800
          `}
        >
          <Card className="w-full max-w-2xl shadow-sm border-red-200 dark:border-red-800">
            <CardHeader className="text-center">
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
                className="inline-flex mx-auto mb-2"
              >
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <Warning className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
              </motion.div>

              <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {errorType === 'network' && 'Connection Problem'}
                {errorType === 'loading' && 'Loading Error'}
                {errorType === 'permission' && 'Access Denied'}
                {errorType === 'notfound' && 'Page Not Found'}
                {errorType === 'unknown' && 'Something Went Wrong'}
              </CardTitle>

              <CardDescription className="text-base mt-2">
                {errorType === 'network' && 'We\'re having trouble connecting to our servers.'}
                {errorType === 'loading' && 'Some resources failed to load properly.'}
                {errorType === 'permission' && 'You don\'t have permission to access this resource.'}
                {errorType === 'notfound' && 'The requested resource could not be found.'}
                {errorType === 'unknown' && 'An unexpected error occurred. Our team has been notified.'}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-2">
              {retryCount > 0 && (
                <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800">
                  <AlertTitle className="text-sm font-medium">Auto-retry in progress</AlertTitle>
                  <AlertDescription className="text-sm">
                    Attempt {retryCount} of 3. The system is automatically trying to recover...
                  </AlertDescription>
                </Alert>
              )}

              {showDetails && error && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">
                    Technical Details
                  </summary>
                  <div className="mt-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <div className="space-y-2 text-xs font-mono">
                      <div>
                        <span className="text-slate-500">Error ID:</span>{' '}
                        <span className="text-slate-700 dark:text-slate-300">{errorId}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Timestamp:</span>{' '}
                        <span className="text-slate-700 dark:text-slate-300">
                          {errorTimestamp.toISOString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Message:</span>{' '}
                        <span className="text-red-600 dark:text-red-400">{error.message}</span>
                      </div>
                      {error.stack && (
                        <div className="mt-2">
                          <span className="text-slate-500">Stack Trace:</span>
                          <pre className="mt-1 text-[10px] text-slate-600 dark:text-slate-400 overflow-auto max-h-32">
                            {error.stack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </details>
              )}

              <div className="pt-2">
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  What you can try:
                </h3>
                <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                  {errorType === 'network' && (
                    <>
                      <li>• Check your internet connection</li>
                      <li>• Try refreshing the page</li>
                      <li>• Wait a few moments and try again</li>
                    </>
                  )}
                  {errorType === 'loading' && (
                    <>
                      <li>• Clear your browser cache</li>
                      <li>• Disable browser extensions</li>
                      <li>• Try a different browser</li>
                    </>
                  )}
                  {errorType === 'permission' && (
                    <>
                      <li>• Verify you're logged in</li>
                      <li>• Contact your administrator</li>
                      <li>• Request access to this resource</li>
                    </>
                  )}
                  {(errorType === 'notfound' || errorType === 'unknown') && (
                    <>
                      <li>• Return to the previous page</li>
                      <li>• Go to the home page</li>
                      <li>• Contact support if the problem persists</li>
                    </>
                  )}
                </ul>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={this.resetErrorBoundary}
                className="gap-2"
                variant="default"
              >
                <ArrowClockwise className="w-4 h-4" />
                Try Again
              </Button>

              <Button
                onClick={() => window.location.href = '/'}
                className="gap-2"
                variant="outline"
              >
                <House className="w-4 h-4" />
                Go Home
              </Button>

              {level === 'page' && (
                <Button
                  onClick={() => window.location.href = 'mailto:support@fleet.gov'}
                  className="gap-2"
                  variant="outline"
                >
                  <EnvelopeSimple className="w-4 h-4" />
                  Contact Support
                </Button>
              )}
            </CardFooter>

            {errorId && (
              <div className="px-3 pb-2">
                <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                  Reference this ID when contacting support: <code className="font-mono">{errorId}</code>
                </p>
              </div>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>
    )
  }

  render() {
    const { hasError } = this.state
    const { children, isolate } = this.props

    if (hasError) {
      return this.renderErrorUI()
    }

    // Wrap in error isolation container if specified
    if (isolate) {
      return (
        <div className="error-boundary-container" data-error-boundary="active">
          {children}
        </div>
      )
    }

    return children
  }
}

// Export convenience wrapper components
export const PageErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <EnhancedErrorBoundary level="page" showDetails={process.env.NODE_ENV === 'development'}>
    {children}
  </EnhancedErrorBoundary>
)

export const SectionErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <EnhancedErrorBoundary level="section">
    {children}
  </EnhancedErrorBoundary>
)

export const ComponentErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <EnhancedErrorBoundary level="component">
    {children}
  </EnhancedErrorBoundary>
)