'use client';

import { AlertCircle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';
import React, { ErrorInfo } from 'react';

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onReset?: () => void;
}

/**
 * Fallback UI component displayed when an error is caught
 * Shows user-friendly error message with recovery options
 */
export function ErrorFallback({ error, errorInfo, onReset }: ErrorFallbackProps) {
  const [showDetails, setShowDetails] = React.useState(false);
  const isDevelopment = process.env.NODE_ENV === 'development';

  const handleReload = () => {
    if (onReset) {
      onReset();
    }
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-2">
      <div className="max-w-2xl w-full">
        {/* Error Card */}
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-destructive/10 border-b border-destructive/20 p-3">
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0">
                <div className="w-12 h-9 bg-destructive/20 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-sm font-semibold text-foreground mb-2">
                  Oops! Something went wrong
                </h1>
                <p className="text-muted-foreground">
                  We encountered an unexpected error. Don&apos;t worry, your data is safe.
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-3 space-y-2">
            {/* Error Message */}
            {error && (
              <div className="bg-muted/50 rounded-md p-2 border border-border">
                <h2 className="text-sm font-medium text-foreground mb-2">Error Details</h2>
                <p className="text-sm text-muted-foreground font-mono break-words">
                  {error.message || 'An unknown error occurred'}
                </p>
              </div>
            )}

            {/* Development Details */}
            {isDevelopment && errorInfo && (
              <div className="space-y-2">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  {showDetails ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                  {showDetails ? 'Hide' : 'Show'} Technical Details
                </button>

                {showDetails && (
                  <div className="bg-muted/50 rounded-md p-2 border border-border">
                    <h3 className="text-sm font-medium text-foreground mb-2">Component Stack</h3>
                    <pre className="text-xs text-muted-foreground font-mono overflow-x-auto whitespace-pre-wrap">
                      {errorInfo.componentStack}
                    </pre>

                    {error?.stack && (
                      <>
                        <h3 className="text-sm font-medium text-foreground mt-2 mb-2">Stack Trace</h3>
                        <pre className="text-xs text-muted-foreground font-mono overflow-x-auto whitespace-pre-wrap">
                          {error.stack}
                        </pre>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Suggestions */}
            <div className="bg-primary/5 rounded-md p-2 border border-primary/20">
              <h2 className="text-sm font-medium text-foreground mb-2">What you can do:</h2>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Reload the page to try again</li>
                <li>Go back to the home page</li>
                <li>Clear your browser cache and cookies</li>
                <li>Contact support if the problem persists</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleReload}
                className="flex-1 inline-flex items-center justify-center gap-2 px-2 py-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              <button
                onClick={handleGoHome}
                className="flex-1 inline-flex items-center justify-center gap-2 px-2 py-2.5 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <Home className="w-4 h-4" />
                Go to Home
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-muted/30 border-t border-border px-3 py-2">
            <p className="text-xs text-muted-foreground text-center">
              If this issue continues, please contact{' '}
              <a
                href="mailto:support@capitaltechalliance.com"
                className="text-primary hover:underline"
              >
                support@capitaltechalliance.com
              </a>
            </p>
          </div>
        </div>

        {/* Additional Info */}
        {isDevelopment && (
          <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              <strong>Development Mode:</strong> Error details are visible because you&apos;re in development mode.
              In production, users will see a simplified error message.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
