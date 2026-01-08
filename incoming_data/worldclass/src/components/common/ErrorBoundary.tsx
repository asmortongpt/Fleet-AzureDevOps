/**
 * Error Boundary Component - Production Error Handling
 *
 * Features:
 * - Catches React component errors
 * - Prevents entire app crash
 * - Displays user-friendly error UI
 * - Error logging and reporting
 * - Reset functionality
 * - Error details for development
 *
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */

import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';
import React, { Component, ErrorInfo, ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }

    // Update state with error details
    this.setState((prevState) => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, send error to logging service
    if (!import.meta.env.DEV) {
      this.logErrorToService(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Reset error boundary when resetKeys change
    const { resetKeys } = this.props;
    if (resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => key !== prevProps.resetKeys![index]
      );
      if (hasResetKeyChanged && this.state.hasError) {
        this.resetErrorBoundary();
      }
    }
  }

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  toggleDetails = () => {
    this.setState((prevState) => ({
      showDetails: !prevState.showDetails,
    }));
  };

  goHome = () => {
    window.location.href = '/';
  };

  logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // TODO: Integrate with error logging service (e.g., Sentry, LogRocket, Azure Application Insights)
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Example: Send to API endpoint
    // fetch('/api/log-error', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorData),
    // }).catch(console.error);

    console.log('[ErrorBoundary] Would log to service:', errorData);
  };

  render() {
    const { hasError, error, errorInfo, errorCount, showDetails } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
          <Card className="max-w-2xl w-full shadow-lg border-red-200 dark:border-red-900">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <CardTitle className="text-red-900 dark:text-red-100">
                    Something Went Wrong
                  </CardTitle>
                  <CardDescription>
                    {errorCount > 1
                      ? `This error has occurred ${errorCount} times`
                      : 'An unexpected error occurred'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Error Message */}
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="font-mono text-sm text-red-900 dark:text-red-100">
                  {error?.message || 'Unknown error'}
                </p>
              </div>

              {/* User Instructions */}
              <div className="text-sm text-muted-foreground space-y-2">
                <p>We've been notified of this issue and are working to fix it.</p>
                <p>Here's what you can try:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Refresh the page or try again</li>
                  <li>Go back to the home page</li>
                  <li>Clear your browser cache</li>
                  <li>Contact support if the issue persists</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 flex-wrap">
                <Button onClick={this.resetErrorBoundary} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
                <Button onClick={this.goHome} variant="outline" className="gap-2">
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>
              </div>

              {/* Error Details (Development/Debug) */}
              {import.meta.env.DEV && error && (
                <div className="pt-4 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={this.toggleDetails}
                    className="gap-2 text-xs"
                  >
                    {showDetails ? (
                      <>
                        <ChevronUp className="h-3 w-3" />
                        Hide Error Details
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3" />
                        Show Error Details (Development)
                      </>
                    )}
                  </Button>

                  {showDetails && (
                    <div className="mt-4 space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Error Stack:</h4>
                        <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-x-auto border">
                          {error.stack}
                        </pre>
                      </div>

                      {errorInfo?.componentStack && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Component Stack:</h4>
                          <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-x-auto border">
                            {errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Error ID (for support reference) */}
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  Error ID: {Date.now().toString(36)}
                  {errorCount > 1 && ` (Count: ${errorCount})`}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return children;
  }
}

/**
 * Hook-based wrapper for functional components
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const displayName = Component.displayName || Component.name || 'Component';

  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${displayName})`;

  return WrappedComponent;
}
