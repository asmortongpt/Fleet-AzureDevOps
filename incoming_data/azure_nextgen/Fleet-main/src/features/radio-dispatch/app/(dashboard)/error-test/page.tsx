'use client';

import React, { useState } from 'react';

import { ErrorBoundary } from '@/components/ErrorBoundary';

/**
 * Error Boundary Test Page
 *
 * This page allows you to test the ErrorBoundary component by triggering errors.
 * Access at: /error-test
 *
 * IMPORTANT: Remove or protect this page in production!
 */

function ErrorTrigger({ shouldThrow = false }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('This is a test error thrown from ErrorTrigger component');
  }

  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
      <p className="text-green-700">✓ No error - component rendering normally</p>
    </div>
  );
}

export default function ErrorTestPage() {
  const [triggerError, setTriggerError] = useState(false);

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Error Boundary Test Page
        </h1>
        <p className="text-muted-foreground">
          This page demonstrates the ErrorBoundary component in action.
        </p>
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            ⚠️ <strong>Development Only:</strong> Remove or protect this page in production!
          </p>
        </div>
      </div>

      {/* Test Controls */}
      <div className="mb-8 space-y-4">
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test 1: Basic Error Boundary</h2>
          <p className="text-muted-foreground mb-4">
            Click the button below to trigger an error and see the ErrorBoundary in action.
          </p>

          <div className="mb-4">
            <button
              onClick={() => setTriggerError(!triggerError)}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
            >
              {triggerError ? 'Reset Error' : 'Trigger Error'}
            </button>
          </div>

          <ErrorBoundary>
            <ErrorTrigger shouldThrow={triggerError} />
          </ErrorBoundary>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test 2: Async Error (Not Caught)</h2>
          <p className="text-muted-foreground mb-4">
            Error boundaries don&apos;t catch async errors. This demonstrates proper error handling:
          </p>

          <button
            onClick={async () => {
              try {
                // Simulate async operation that fails
                await new Promise((_, reject) =>
                  setTimeout(() => reject(new Error('Async error')), 1000)
                );
              } catch (error) {
                console.error('Async error caught:', error);
                alert('Async error caught! Check console.');
              }
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Trigger Async Error (Caught with try-catch)
          </button>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test 3: Event Handler Error (Not Caught)</h2>
          <p className="text-muted-foreground mb-4">
            Error boundaries don&apos;t catch errors in event handlers. Use try-catch:
          </p>

          <button
            onClick={() => {
              try {
                throw new Error('Event handler error');
              } catch (error) {
                console.error('Event error caught:', error);
                alert('Event handler error caught! Check console.');
              }
            }}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
          >
            Trigger Event Handler Error (Caught with try-catch)
          </button>
        </div>
      </div>

      {/* Documentation */}
      <div className="bg-muted/50 border border-border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">What Error Boundaries Catch</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-green-600 mb-2">✓ Catches</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Errors during render</li>
              <li>• Errors in lifecycle methods</li>
              <li>• Errors in constructors</li>
              <li>• Errors in child components</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-red-600 mb-2">✗ Does Not Catch</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Event handlers (use try-catch)</li>
              <li>• Async code (use try-catch)</li>
              <li>• Server-side rendering errors</li>
              <li>• Errors in error boundary itself</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="mt-8 text-center">
        <a
          href="/"
          className="text-primary hover:underline"
        >
          ← Back to Dashboard
        </a>
      </div>
    </div>
  );
}
