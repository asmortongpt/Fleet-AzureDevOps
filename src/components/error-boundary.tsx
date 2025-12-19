/**
 * Error Boundary Components with Sentry Integration
 * Catches React errors and reports them to Sentry with session replay
 */

import * as Sentry from '@sentry/react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import React, { Component, ErrorInfo, ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import logger from '@/utils/logger';
interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * Main Error Boundary with Sentry integration
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console
    logger.error('Error Boundary caught error:', error, errorInfo)

    // Update state with error info
    this.setState({
      error,
      errorInfo
    })

    // Report to Sentry
    Sentry.withScope((scope) => {
      // Add error boundary context
      scope.setContext('errorBoundary', {
        componentStack: errorInfo.componentStack,
        errorBoundaryName: 'RootErrorBoundary'
      })

      // Set tags for better filtering
      scope.setTag('error_boundary', 'true')
      scope.setTag('error_type', error.name)

      // Add breadcrumb
      Sentry.addBreadcrumb({
        category: 'error_boundary',
        message: 'Error caught by boundary',
        level: 'error',
        data: {
          errorName: error.name,
          errorMessage: error.message
        }
      })

      // Capture the exception
      Sentry.captureException(error)
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  handleReportFeedback = () => {
    Sentry.showReportDialog({
      eventId: Sentry.lastEventId(),
      title: 'Report an Issue',
      subtitle: 'Our team has been notified. If you\'d like to help, tell us what happened below.',
      subtitle2: '',
      labelName: 'Name',
      labelEmail: 'Email',
      labelComments: 'What happened?',
      labelClose: 'Close',
      labelSubmit: 'Submit Report'
    })
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-destructive" />
                <div>
                  <CardTitle className="text-2xl">Something went wrong</CardTitle>
                  <CardDescription>
                    An unexpected error occurred. Our team has been notified.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {import.meta.env.DEV && this.state.error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <p className="font-mono text-sm text-destructive mb-2">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm font-medium mb-2">
                        Component Stack
                      </summary>
                      <pre className="text-xs overflow-auto max-h-64 p-2 bg-black/5 rounded">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <Button onClick={this.handleReset} variant="default">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={this.handleGoHome} variant="outline">
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
                <Button onClick={this.handleReportFeedback} variant="outline">
                  Report Issue
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                Error ID: {Sentry.lastEventId() || 'N/A'}
              </p>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Route-level Error Boundary
 * Scoped to a specific route/section
 */
export class RouteErrorBoundary extends Component<Props & { routeName: string }, State> {
  constructor(props: Props & { routeName: string }) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error(`Route Error Boundary (${this.props.routeName}) caught error:`, error)

    this.setState({
      error,
      errorInfo
    })

    Sentry.withScope((scope) => {
      scope.setContext('routeErrorBoundary', {
        routeName: this.props.routeName,
        componentStack: errorInfo.componentStack
      })
      scope.setTag('error_boundary', 'route')
      scope.setTag('route_name', this.props.routeName)
      Sentry.captureException(error)
    })

    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex items-center justify-center p-8">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Error Loading {this.props.routeName}</CardTitle>
              <CardDescription>
                This section encountered an error. Try refreshing or go back.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={this.handleReset}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Component-level Error Boundary
 * For individual components that might fail
 */
export class ComponentErrorBoundary extends Component<Props & { componentName: string }, State> {
  constructor(props: Props & { componentName: string }) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error(`Component Error Boundary (${this.props.componentName}) caught error:`, error)

    this.setState({
      error,
      errorInfo
    })

    Sentry.withScope((scope) => {
      scope.setContext('componentErrorBoundary', {
        componentName: this.props.componentName,
        componentStack: errorInfo.componentStack
      })
      scope.setTag('error_boundary', 'component')
      scope.setTag('component_name', this.props.componentName)
      scope.setLevel('warning') // Component errors are less critical
      Sentry.captureException(error)
    })

    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="font-medium text-sm">Component Error</span>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            {this.props.componentName} failed to render.
          </p>
          <Button size="sm" variant="outline" onClick={this.handleReset}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
