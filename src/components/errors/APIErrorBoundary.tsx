/**
 * API Error Boundary Component
 * FEAT-007: Comprehensive error handling for API errors
 *
 * Features:
 * - Catches and displays API errors gracefully
 * - Automatic retry with exponential backoff
 * - User-friendly error messages
 * - Network status detection
 * - Session expiry handling
 */

import { Component, ReactNode } from 'react'
import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  isOnline: boolean
  retryCount: number
}

export class APIErrorBoundary extends Component<Props, State> {
  private maxRetries = 3
  private retryTimeout: NodeJS.Timeout | null = null

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isOnline: navigator.onLine,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('APIErrorBoundary caught error:', error, errorInfo)
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    this.setState({
      error,
      errorInfo
    })
  }

  componentDidMount() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline)
    window.addEventListener('offline', this.handleOffline)
  }

  componentWillUnmount() {
    window.removeEventListener('online', this.handleOnline)
    window.removeEventListener('offline', this.handleOffline)
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout)
    }
  }

  handleOnline = () => {
    this.setState({ isOnline: true })
    // Auto-retry when coming back online
    if (this.state.hasError) {
      this.handleRetry()
    }
  }

  handleOffline = () => {
    this.setState({ isOnline: false })
  }

  handleRetry = () => {
    if (this.state.retryCount >= this.maxRetries) {
      return
    }

    const delay = Math.min(1000 * Math.pow(2, this.state.retryCount), 10000)

    this.setState(prev => ({
      retryCount: prev.retryCount + 1
    }))

    this.retryTimeout = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null
      })
    }, delay)
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  getErrorMessage(): { title: string; description: string; canRetry: boolean } {
    const { error, isOnline } = this.state

    if (!isOnline) {
      return {
        title: 'No Internet Connection',
        description: 'Please check your network connection and try again.',
        canRetry: false
      }
    }

    if (!error) {
      return {
        title: 'Unknown Error',
        description: 'An unexpected error occurred. Please try again.',
        canRetry: true
      }
    }

    // Check for specific error types
    const message = error.message.toLowerCase()

    if (message.includes('timeout') || message.includes('took too long')) {
      return {
        title: 'Request Timeout',
        description: 'The server took too long to respond. This might be due to slow network or high server load.',
        canRetry: true
      }
    }

    if (message.includes('network') || message.includes('failed to fetch')) {
      return {
        title: 'Network Error',
        description: 'Unable to reach the server. Please check your connection.',
        canRetry: true
      }
    }

    if (message.includes('401') || message.includes('unauthorized')) {
      return {
        title: 'Session Expired',
        description: 'Your session has expired. Please log in again.',
        canRetry: false
      }
    }

    if (message.includes('403') || message.includes('forbidden')) {
      return {
        title: 'Access Denied',
        description: 'You don\'t have permission to access this resource.',
        canRetry: false
      }
    }

    if (message.includes('404') || message.includes('not found')) {
      return {
        title: 'Resource Not Found',
        description: 'The requested resource could not be found.',
        canRetry: false
      }
    }

    if (message.includes('500') || message.includes('server error')) {
      return {
        title: 'Server Error',
        description: 'The server encountered an error. Our team has been notified.',
        canRetry: true
      }
    }

    return {
      title: 'Error',
      description: error.message || 'An unexpected error occurred.',
      canRetry: true
    }
  }

  render() {
    const { children, fallback } = this.props
    const { hasError, retryCount, isOnline } = this.state

    if (!hasError) {
      return children
    }

    if (fallback) {
      return fallback
    }

    const { title, description, canRetry } = this.getErrorMessage()
    const canStillRetry = retryCount < this.maxRetries && canRetry

    return (
      <div className="flex items-center justify-center min-h-[400px] p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              {!isOnline ? (
                <WifiOff className="h-8 w-8 text-yellow-500" />
              ) : (
                <AlertCircle className="h-8 w-8 text-destructive" />
              )}
              <div>
                <CardTitle>{title}</CardTitle>
                <CardDescription className="mt-1.5">{description}</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {!isOnline && (
              <Alert>
                <WifiOff className="h-4 w-4" />
                <AlertTitle>Offline</AlertTitle>
                <AlertDescription>
                  You are currently offline. The app will automatically reconnect when your network is restored.
                </AlertDescription>
              </Alert>
            )}

            {retryCount > 0 && canStillRetry && (
              <Alert>
                <RefreshCw className="h-4 w-4" />
                <AlertTitle>Retrying...</AlertTitle>
                <AlertDescription>
                  Attempt {retryCount} of {this.maxRetries}
                </AlertDescription>
              </Alert>
            )}

            {import.meta.env.DEV && this.state.error && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  Technical Details (Dev Mode)
                </summary>
                <pre className="mt-2 rounded-lg bg-muted p-4 text-xs overflow-auto max-h-60">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </CardContent>

          <CardFooter className="flex gap-2">
            {canStillRetry && (
              <Button
                onClick={this.handleRetry}
                variant="default"
                className="flex-1"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry ({this.maxRetries - retryCount} left)
              </Button>
            )}
            <Button
              onClick={this.handleReset}
              variant="outline"
              className="flex-1"
            >
              Dismiss
            </Button>
            {!canRetry && (
              <Button
                onClick={this.handleReload}
                variant="default"
                className="flex-1"
              >
                Reload Page
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    )
  }
}
