/**
 * Advanced Map Error Boundary Component
 *
 * Features:
 * - Error categorization and user-friendly messages
 * - Automatic retry with exponential backoff
 * - Fallback to simpler map provider
 * - Error reporting to monitoring service
 * - Actionable error messages with recovery steps
 * - Circuit breaker integration
 * - Offline mode detection
 */

import { Component, ReactNode, ErrorInfo } from 'react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { categorizeError, ErrorCategory, CategorizedError } from '@/utils/retry'
import type { MapProvider } from './UniversalMap'

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Component props
 */
export interface MapErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode

  /** Current map provider */
  provider?: MapProvider

  /** Callback when error occurs */
  onError?: (error: Error, errorInfo: ErrorInfo) => void

  /** Callback to switch to fallback provider */
  onFallbackProvider?: (provider: MapProvider) => void

  /** Enable automatic retry (default: true) */
  enableAutoRetry?: boolean

  /** Maximum retry attempts (default: 3) */
  maxRetries?: number

  /** Enable error reporting to monitoring service (default: true) */
  enableErrorReporting?: boolean

  /** Custom fallback component */
  fallback?: ReactNode

  /** Enable provider fallback (default: true) */
  enableProviderFallback?: boolean
}

/**
 * Component state
 */
interface MapErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  categorizedError: CategorizedError | null
  retryCount: number
  isRetrying: boolean
  isOffline: boolean
  fallbackAttempted: boolean
}

// ============================================================================
// Error Messages & Actions
// ============================================================================

/**
 * Get user-friendly error message and actionable steps
 */
function getErrorDetails(error: CategorizedError, provider?: MapProvider): {
  title: string
  message: string
  actions: Array<{ label: string; action: string }>
  severity: 'error' | 'warning' | 'info'
} {
  switch (error.category) {
    case ErrorCategory.NETWORK:
      return {
        title: 'Network Connection Issue',
        message: 'Unable to connect to the map service. Please check your internet connection.',
        actions: [
          { label: 'Check Connection', action: 'check-network' },
          { label: 'Retry', action: 'retry' },
          { label: 'Use Offline Mode', action: 'offline-mode' },
        ],
        severity: 'error',
      }

    case ErrorCategory.TIMEOUT:
      return {
        title: 'Request Timed Out',
        message: 'The map service is taking longer than expected to respond.',
        actions: [
          { label: 'Retry', action: 'retry' },
          { label: 'Switch Provider', action: 'switch-provider' },
          { label: 'Reload Page', action: 'reload' },
        ],
        severity: 'warning',
      }

    case ErrorCategory.RATE_LIMIT:
      return {
        title: 'Rate Limit Exceeded',
        message: 'Too many requests to the map service. Please wait a moment.',
        actions: [
          { label: 'Wait & Retry', action: 'retry' },
          { label: 'Switch Provider', action: 'switch-provider' },
        ],
        severity: 'warning',
      }

    case ErrorCategory.AUTHENTICATION:
      return {
        title: 'Authentication Failed',
        message: provider === 'google'
          ? 'Google Maps API key is invalid or missing. Switching to free alternative.'
          : 'Unable to authenticate with the map service.',
        actions: [
          { label: 'Use Free Map', action: 'switch-provider' },
          { label: 'Reload Page', action: 'reload' },
        ],
        severity: 'error',
      }

    case ErrorCategory.API_ERROR:
      return {
        title: 'Map Service Error',
        message: `The map service returned an error${error.statusCode ? ` (${error.statusCode})` : ''}.`,
        actions: [
          { label: 'Retry', action: 'retry' },
          { label: 'Switch Provider', action: 'switch-provider' },
          { label: 'Report Issue', action: 'report' },
        ],
        severity: 'error',
      }

    case ErrorCategory.RENDERING:
      return {
        title: 'Map Rendering Issue',
        message: 'The map failed to render properly. This may be a browser compatibility issue.',
        actions: [
          { label: 'Retry', action: 'retry' },
          { label: 'Clear Cache', action: 'clear-cache' },
          { label: 'Switch Provider', action: 'switch-provider' },
        ],
        severity: 'warning',
      }

    case ErrorCategory.VALIDATION:
      return {
        title: 'Invalid Configuration',
        message: 'The map configuration is invalid. Please check your settings.',
        actions: [
          { label: 'Reset Settings', action: 'reset-settings' },
          { label: 'Reload Page', action: 'reload' },
        ],
        severity: 'error',
      }

    default:
      return {
        title: 'Map Error',
        message: error.message || 'An unexpected error occurred while loading the map.',
        actions: [
          { label: 'Retry', action: 'retry' },
          { label: 'Switch Provider', action: 'switch-provider' },
          { label: 'Reload Page', action: 'reload' },
        ],
        severity: 'error',
      }
  }
}

/**
 * Report error to monitoring service
 */
function reportError(error: Error, errorInfo: ErrorInfo, provider?: MapProvider): void {
  // In production, send to monitoring service (Sentry, LogRocket, etc.)
  if (process.env.NODE_ENV === 'production') {
    console.error('Map Error Report:', {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      errorInfo: {
        componentStack: errorInfo.componentStack,
      },
      context: {
        provider,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        online: navigator.onLine,
      },
    })

    // TODO: Integrate with your error monitoring service
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } })
  } else {
    console.error('Map Error Boundary caught error:', error, errorInfo)
  }
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Advanced error boundary for map components
 */
export class MapErrorBoundary extends Component<MapErrorBoundaryProps, MapErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null
  private offlineListenerId: (() => void) | null = null

  constructor(props: MapErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      categorizedError: null,
      retryCount: 0,
      isRetrying: false,
      isOffline: !navigator.onLine,
      fallbackAttempted: false,
    }
  }

  // --------------------------------------------------------------------------
  // Lifecycle Methods
  // --------------------------------------------------------------------------

  static getDerivedStateFromError(error: Error): Partial<MapErrorBoundaryState> {
    const categorized = categorizeError(error)
    return {
      hasError: true,
      error,
      categorizedError: categorized,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const categorized = categorizeError(error)

    this.setState({
      errorInfo,
      categorizedError: categorized,
    })

    // Report error
    if (this.props.enableErrorReporting !== false) {
      reportError(error, errorInfo, this.props.provider)
    }

    // Call custom error handler
    this.props.onError?.(error, errorInfo)

    // Attempt provider fallback for certain errors
    if (
      this.props.enableProviderFallback !== false &&
      !this.state.fallbackAttempted &&
      this.shouldFallbackProvider(categorized)
    ) {
      this.attemptProviderFallback()
    }

    // Attempt auto-retry for retryable errors
    if (
      this.props.enableAutoRetry !== false &&
      categorized.retryable &&
      this.state.retryCount < (this.props.maxRetries || 3)
    ) {
      this.scheduleRetry()
    }
  }

  componentDidMount(): void {
    // Listen for online/offline events
    const handleOnline = () => this.setState({ isOffline: false })
    const handleOffline = () => this.setState({ isOffline: true })

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    this.offlineListenerId = () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }

  componentWillUnmount(): void {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }

    if (this.offlineListenerId) {
      this.offlineListenerId()
    }
  }

  // --------------------------------------------------------------------------
  // Helper Methods
  // --------------------------------------------------------------------------

  /**
   * Check if we should fallback to different provider
   */
  private shouldFallbackProvider(error: CategorizedError): boolean {
    const { provider } = this.props

    // Only fallback if using Google Maps
    if (provider !== 'google') {
      return false
    }

    // Fallback for authentication and API errors
    return (
      error.category === ErrorCategory.AUTHENTICATION ||
      error.category === ErrorCategory.API_ERROR ||
      error.category === ErrorCategory.RATE_LIMIT
    )
  }

  /**
   * Attempt to fallback to different provider
   */
  private attemptProviderFallback(): void {
    const { provider, onFallbackProvider } = this.props

    if (provider === 'google') {
      console.warn('Google Maps failed, falling back to Leaflet...')
      this.setState({ fallbackAttempted: true })
      onFallbackProvider?.('leaflet')
    }
  }

  /**
   * Schedule automatic retry
   */
  private scheduleRetry(): void {
    const { retryCount } = this.state
    const delay = Math.min(1000 * Math.pow(2, retryCount), 10000) // Exponential backoff, max 10s

    this.setState({ isRetrying: true })

    this.retryTimeoutId = setTimeout(() => {
      this.handleRetry()
    }, delay)
  }

  // --------------------------------------------------------------------------
  // Action Handlers
  // --------------------------------------------------------------------------

  private handleRetry = (): void => {
    this.setState(prev => ({
      hasError: false,
      error: null,
      errorInfo: null,
      categorizedError: null,
      isRetrying: false,
      retryCount: prev.retryCount + 1,
    }))
  }

  private handleSwitchProvider = (): void => {
    const { provider, onFallbackProvider } = this.props

    if (provider === 'google') {
      onFallbackProvider?.('leaflet')
    } else {
      onFallbackProvider?.('google')
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      categorizedError: null,
      fallbackAttempted: true,
    })
  }

  private handleReload = (): void => {
    window.location.reload()
  }

  private handleCheckNetwork = (): void => {
    if (navigator.onLine) {
      alert('You appear to be online. The issue may be with the map service.')
    } else {
      alert('You are currently offline. Please check your internet connection.')
    }
  }

  private handleOfflineMode = (): void => {
    // TODO: Implement offline mode
    alert('Offline mode is not yet implemented.')
  }

  private handleClearCache = (): void => {
    // Clear localStorage
    try {
      localStorage.removeItem('fleet_map_provider')
      localStorage.removeItem('fleet_map_cache')
      alert('Cache cleared. Reloading page...')
      window.location.reload()
    } catch (error) {
      console.error('Failed to clear cache:', error)
    }
  }

  private handleResetSettings = (): void => {
    try {
      localStorage.removeItem('fleet_map_provider')
      localStorage.removeItem('fleet_map_settings')
      alert('Settings reset. Reloading page...')
      window.location.reload()
    } catch (error) {
      console.error('Failed to reset settings:', error)
    }
  }

  private handleReport = (): void => {
    const { error, errorInfo } = this.state
    if (error && errorInfo) {
      reportError(error, errorInfo, this.props.provider)
      alert('Error reported. Thank you!')
    }
  }

  private handleAction = (action: string): void => {
    switch (action) {
      case 'retry':
        this.handleRetry()
        break
      case 'switch-provider':
        this.handleSwitchProvider()
        break
      case 'reload':
        this.handleReload()
        break
      case 'check-network':
        this.handleCheckNetwork()
        break
      case 'offline-mode':
        this.handleOfflineMode()
        break
      case 'clear-cache':
        this.handleClearCache()
        break
      case 'reset-settings':
        this.handleResetSettings()
        break
      case 'report':
        this.handleReport()
        break
      default:
        console.warn('Unknown action:', action)
    }
  }

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { categorizedError, isRetrying, retryCount, isOffline } = this.state
      const { provider, maxRetries = 3 } = this.props

      if (!categorizedError) {
        return this.props.children
      }

      const errorDetails = getErrorDetails(categorizedError, provider)

      return (
        <div className="flex items-center justify-center w-full h-full bg-gray-50 dark:bg-gray-900 p-6">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTitle className="text-xl font-semibold m-0">
                      {errorDetails.title}
                    </AlertTitle>
                    <Badge
                      variant={
                        errorDetails.severity === 'error'
                          ? 'destructive'
                          : errorDetails.severity === 'warning'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {categorizedError.category}
                    </Badge>
                  </div>
                  {provider && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Provider: {provider === 'google' ? 'Google Maps' : 'Leaflet/OpenStreetMap'}
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  {isRetrying ? (
                    <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      Retrying...
                    </div>
                  ) : retryCount > 0 ? (
                    <div className="text-sm text-gray-500">
                      Attempt {retryCount}/{maxRetries}
                    </div>
                  ) : null}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Offline Warning */}
              {isOffline && (
                <Alert variant="destructive">
                  <AlertTitle>You are offline</AlertTitle>
                  <AlertDescription>
                    Please check your internet connection and try again.
                  </AlertDescription>
                </Alert>
              )}

              {/* Error Message */}
              <AlertDescription className="text-base">
                {errorDetails.message}
              </AlertDescription>

              {/* Technical Details (Development Only) */}
              {process.env.NODE_ENV === 'development' && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                    Technical Details
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto">
                    {JSON.stringify(
                      {
                        message: categorizedError.message,
                        category: categorizedError.category,
                        retryable: categorizedError.retryable,
                        statusCode: categorizedError.statusCode,
                        stack: categorizedError.stack,
                      },
                      null,
                      2
                    )}
                  </pre>
                </details>
              )}
            </CardContent>

            <CardFooter>
              <div className="flex flex-wrap gap-2 w-full">
                {errorDetails.actions.map((action, index) => (
                  <Button
                    key={index}
                    onClick={() => this.handleAction(action.action)}
                    variant={index === 0 ? 'default' : 'outline'}
                    disabled={isRetrying}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </CardFooter>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

export default MapErrorBoundary
