import { Component, ReactNode, ErrorInfo } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorCount: number;
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('EnhancedErrorBoundary caught error:', error, errorInfo);

    // Update error count
    this.setState((prev) => ({
      errorInfo,
      errorCount: prev.errorCount + 1,
    }));

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Report to error tracking service (Sentry, LogRocket, etc.)
    this.reportError(error, errorInfo);

    // Store in localStorage for debugging
    try {
      const errorLog = {
        timestamp: new Date().toISOString(),
        error: {
          message: error.message,
          stack: error.stack,
        },
        errorInfo: {
          componentStack: errorInfo.componentStack,
        },
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      const existingLogs = JSON.parse(
        localStorage.getItem('ctafleet-error-logs') || '[]'
      );

      // Keep only last 10 errors
      const updatedLogs = [errorLog, ...existingLogs].slice(0, 10);

      localStorage.setItem('ctafleet-error-logs', JSON.stringify(updatedLogs));
    } catch (e) {
      console.error('Failed to store error log:', e);
    }
  }

  private reportError(error: Error, errorInfo: ErrorInfo) {
    // Integrate with your error reporting service
    // Example: Sentry
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }

    // Example: LogRocket
    if (typeof window !== 'undefined' && (window as any).LogRocket) {
      (window as any).LogRocket.captureException(error, {
        tags: {
          errorBoundary: true,
        },
        extra: {
          componentStack: errorInfo.componentStack,
        },
      });
    }

    // You can also send to your own API
    fetch('/api/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: {
          message: error.message,
          stack: error.stack,
        },
        errorInfo: {
          componentStack: errorInfo.componentStack,
        },
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      }),
    }).catch((err) => {
      console.error('Failed to report error:', err);
    });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleDownloadLog = () => {
    const logs = localStorage.getItem('ctafleet-error-logs') || '[]';
    const blob = new Blob([logs], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ctafleet-error-log-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, errorCount } = this.state;
      const showDetails = this.props.showDetails ?? import.meta.env.DEV;

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
                We encountered an unexpected error. Don't worry, we've logged this
                issue and will work to fix it.
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
                    This error has occurred {errorCount} times. Consider reloading
                    the page or contacting support if the problem persists.
                  </AlertDescription>
                </Alert>
              )}

              {/* Technical Details (Dev Mode) */}
              {showDetails && error && (
                <details className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <summary className="cursor-pointer font-semibold mb-2 flex items-center gap-2">
                    <Bug className="w-4 h-4" />
                    Technical Details
                  </summary>
                  <div className="space-y-3 mt-3">
                    <div>
                      <div className="text-sm font-semibold mb-1">Stack Trace:</div>
                      <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-x-auto">
                        {error.stack}
                      </pre>
                    </div>
                    {errorInfo && (
                      <div>
                        <div className="text-sm font-semibold mb-1">
                          Component Stack:
                        </div>
                        <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-x-auto">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={this.handleReset}
                  variant="default"
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Page
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1"
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
      );
    }

    return this.props.children;
  }
}

// Export a hook to programmatically trigger error boundary
export function useErrorHandler() {
  return (error: Error) => {
    throw error;
  };
}
