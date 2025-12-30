/**
 * Sentry Error Boundary Component
 * Catches React component errors and reports them to Sentry
 * Provides user-friendly error UI with feedback options
 */

import * as Sentry from '@sentry/react'
import { AlertTriangle, RefreshCw, Home, Bug, ChevronDown, ChevronUp } from 'lucide-react'
import React, { Component, ReactNode } from 'react'

import { captureException, showFeedbackWidget } from '../../lib/sentry'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import logger from '@/utils/logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  showDetails?: boolean
  onReset?: () => void
  isolate?: boolean
  level?: 'page' | 'section' | 'component'
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  eventId: string | null
  showDetails: boolean
  errorCount: number
}

/**
 * Enhanced Error Boundary with Sentry Integration
 */
export class SentryErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: NodeJS.Timeout | null = null

  constructor(props: Props) {
    super(props)

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
      showDetails: false,
      errorCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state to trigger error UI
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { level = 'component' } = this.props

    // Log to console in development
    if (import.meta.env.DEV) {
      logger.error('Error caught by boundary:', error, errorInfo)
    }

    // Capture exception with Sentry
    const eventId = Sentry.withScope((scope) => {
      // Add error boundary context
      scope.setTag('error_boundary', true)
      scope.setTag('error_boundary_level', level)
      scope.setLevel('error')

      // Add component stack
      scope.setContext('react', {
        componentStack: errorInfo.componentStack,
        props: this.props.isolate ? '[ISOLATED]' : String(this.props)
      })

      // Capture the error
      return Sentry.captureException(error)
    })

    // Update state with error details
    this.setState((prevState) => ({
      errorInfo,
      eventId,
      errorCount: prevState.errorCount + 1
    }))

    // Auto-reset after multiple errors (potential infinite loop)
    if (this.state.errorCount >= 3) {
      logger.error('Multiple errors detected, auto-resetting in 5 seconds...')
      this.resetTimeoutId = setTimeout(() => {
        this.handleReset()
      }, 5000)
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
  }

  handleReset = () => {
    // Call custom reset handler if provided
    this.props.onReset?.()

    // Clear timeout if exists
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
      this.resetTimeoutId = null
    }

    // Reset error boundary state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
      showDetails: false,
      errorCount: 0
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  handleReportFeedback = () => {
    if (this.state.eventId) {
      showFeedbackWidget()
    }
  }

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }))
  }

  renderErrorDetails() {
    const { error, errorInfo, showDetails } = this.state

    if (!showDetails || !error) return null

    return (
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="space-y-2">
          <div>
            <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
              Error Message:
            </h4>
            <p className="text-sm text-red-600 dark:text-red-400 font-mono">
              {error.message}
            </p>
          </div>

          {import.meta.env.DEV && error.stack && (
            <div>
              <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                Stack Trace:
              </h4>
              <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto whitespace-pre-wrap font-mono">
                {error.stack}
              </pre>
            </div>
          )}

          {import.meta.env.DEV && errorInfo?.componentStack && (
            <div>
              <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                Component Stack:
              </h4>
              <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto whitespace-pre-wrap font-mono">
                {errorInfo.componentStack}
              </pre>
            </div>
          )}

          {this.state.eventId && (
            <div>
              <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                Error ID:
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                {this.state.eventId}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  render() {
    const { hasError, errorCount } = this.state
    const { children, fallback, showDetails: showDetailsProp, level = 'component' } = this.props

    if (!hasError) {
      return children
    }

    // Use custom fallback if provided
    if (fallback) {
      return <>{fallback}</>
    }

    // Different error UIs based on error boundary level
    if (level === 'page') {
      // Full page error
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-red-500" />
                <CardTitle>Something went wrong</CardTitle>
              </div>
              <CardDescription>
                We've encountered an unexpected error. The error has been automatically
                reported to our team.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {errorCount > 1 && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Multiple errors detected ({errorCount} times). The page may be
                      experiencing issues.
                    </p>
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={this.toggleDetails}
                  className="w-full justify-between"
                >
                  <span>Technical Details</span>
                  {this.state.showDetails ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>

                {this.renderErrorDetails()}
              </div>
            </CardContent>

            <CardFooter className="flex gap-2">
              <Button onClick={this.handleReset} variant="default" className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={this.handleGoHome} variant="outline" className="flex-1">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
              {this.state.eventId && (
                <Button onClick={this.handleReportFeedback} variant="outline" size="icon">
                  <Bug className="h-4 w-4" />
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      )
    } else if (level === 'section') {
      // Section error
      return (
        <Card className="m-4">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <CardTitle className="text-base">Section Error</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This section couldn't load properly.
            </p>
            {(showDetailsProp !== false || import.meta.env.DEV) && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={this.toggleDetails}
                  className="mt-2"
                >
                  {this.state.showDetails ? 'Hide' : 'Show'} Details
                </Button>
                {this.renderErrorDetails()}
              </>
            )}
          </CardContent>
          <CardFooter className="pt-3">
            <Button onClick={this.handleReset} size="sm">
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </CardFooter>
        </Card>
      )
    } else {
      // Component error (minimal UI)
      return (
        <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Component Error</span>
          </div>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Failed to render this component.
          </p>
          <Button
            onClick={this.handleReset}
            size="sm"
            variant="ghost"
            className="mt-2"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </div>
      )
    }
  }
}

/**
 * Sentry Error Boundary Hook for functional components
 */
export const useSentryErrorHandler = () => {
  return (_error: Error) => {
    captureException(_error)
  }
}

/**
 * HOC to wrap components with Sentry error boundary
 */
export function withSentryErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <SentryErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </SentryErrorBoundary>
  )

  WrappedComponent.displayName = `withSentryErrorBoundary(${Component.displayName || Component.name || 'Component'})`

  return WrappedComponent
}

// Export Sentry's own error boundary as well
export const SentryReactErrorBoundary = Sentry.ErrorBoundary