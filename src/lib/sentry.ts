/**
 * Sentry Error Tracking Configuration for Frontend
 * Provides comprehensive error tracking for the Fleet Management UI
 */

import { CaptureConsole } from '@sentry/integrations'
import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'
import { useEffect } from 'react'
import {
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes
} from 'react-router-dom'

/**
 * Filter sensitive data from error context
 */
const filterSensitiveData = (data: any): any => {
  if (!data) return data

  const sensitiveKeys = [
    'password', 'token', 'secret', 'api_key', 'apikey',
    'authorization', 'cookie', 'session', 'credit_card',
    'ssn', 'social_security', 'bank_account', 'email'
  ]

  const filtered = { ...data }

  for (const key in filtered) {
    const lowerKey = key.toLowerCase()

    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      filtered[key] = '[REDACTED]'
    } else if (typeof filtered[key] === 'object' && filtered[key] !== null) {
      filtered[key] = filterSensitiveData(filtered[key])
    }
  }

  return filtered
}

/**
 * Initialize Sentry for React application
 */
export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN

  if (!dsn) {
    console.log('⚠️ Sentry DSN not configured - error tracking disabled')
    return
  }

  try {
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE || 'development',
      release: import.meta.env.VITE_SENTRY_RELEASE || 'fleet-ui@1.0.0',

      // Performance monitoring
      tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,

      // Session replay
      replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 0.5, // 10% in production, 50% in development
      replaysOnErrorSampleRate: 1.0, // Always record session on error

      integrations: [
        // Browser tracing for performance monitoring
        new BrowserTracing({
          // Set tracingOrigins to control what URLs are traced
          tracingOrigins: [
            'localhost',
            /^\//,
            import.meta.env.VITE_API_URL || 'http://localhost:3001'
          ],
          // Capture interactions like clicks
          markBackgroundTransactions: true,
          // React Router v6 instrumentation (v10 API compatibility pending)
          routingInstrumentation: Sentry.reactRouterV6Instrumentation(
            useEffect,
            useLocation,
            useNavigationType,
            createRoutesFromChildren,
            matchRoutes
          )
        }),

        // Capture console errors and warnings
        new CaptureConsole({
          levels: import.meta.env.DEV ? ['error'] : ['error', 'warn']
        }),

        // Session replay
        new Sentry.Replay({
          // Mask all text content for privacy
          maskAllText: import.meta.env.PROD,
          // Block all media for privacy
          blockAllMedia: import.meta.env.PROD,
          // Sample rate for network requests/responses in replays
          networkDetailAllowUrls: [
            window.location.origin,
            import.meta.env.VITE_API_URL || 'http://localhost:3001'
          ]
        })
      ],

      // Breadcrumb configuration
      beforeBreadcrumb(breadcrumb) {
        // Filter out noisy breadcrumbs
        if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
          return null
        }

        // Filter navigation breadcrumbs in production
        if (import.meta.env.PROD && breadcrumb.category === 'navigation') {
          // Only keep navigation to error pages
          if (!breadcrumb.data?.to?.includes('error')) {
            return null
          }
        }

        // Filter sensitive data from breadcrumb
        if (breadcrumb.data) {
          breadcrumb.data = filterSensitiveData(breadcrumb.data)
        }

        return breadcrumb
      },

      // Error filtering and enhancement
      beforeSend(event, hint) {
        // Skip certain errors
        const error = hint.originalException

        // Don't report ResizeObserver errors
        if (error && error.toString().includes('ResizeObserver')) {
          return null
        }

        // Don't report network errors in development
        if (import.meta.env.DEV && error && error.toString().includes('NetworkError')) {
          return null
        }

        // Filter sensitive data from the event
        if (event.request) {
          event.request = filterSensitiveData(event.request) as any
        }
        if (event.contexts) {
          event.contexts = filterSensitiveData(event.contexts) as any
        }
        if (event.extra) {
          event.extra = filterSensitiveData(event.extra)
        }

        // Add custom tags
        event.tags = {
          ...event.tags,
          ui_version: '1.0.0',
          browser: navigator.userAgent.includes('Chrome') ? 'chrome' :
                   navigator.userAgent.includes('Firefox') ? 'firefox' :
                   navigator.userAgent.includes('Safari') ? 'safari' : 'other'
        }

        return event
      },

      // Ignore specific errors
      ignoreErrors: [
        // Browser errors
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',
        'Non-Error promise rejection captured',
        'Non-Error exception captured',

        // Network errors
        /^Failed to fetch$/,
        /^NetworkError/,
        /^Request aborted/,
        'Load failed',

        // React errors that are usually harmless
        "Cannot read properties of null (reading 'useContext')",
        "Cannot read properties of undefined (reading 'useContext')",

        // Extension errors
        'Extension context invalidated',
        'chrome-extension://',
        'moz-extension://',

        // Common third-party errors
        'top.GLOBALS',
        'LaunchDarkly',
        'Non-Error promise rejection'
      ],

      // Maximum breadcrumbs to store
      maxBreadcrumbs: 50,

      // Attach stack trace to messages
      attachStacktrace: true,

      // Auto session tracking
      autoSessionTracking: true
    })

    console.log('✅ Sentry initialized successfully for React')

    // Set initial context
    Sentry.setContext('browser', {
      name: navigator.appName,
      version: navigator.appVersion,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      onLine: navigator.onLine,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      colorDepth: window.screen.colorDepth
    })

  } catch (error) {
    console.error('Failed to initialize Sentry:', error)
  }
}

/**
 * Capture an exception with context
 */
export const captureException = (error: Error, context?: Record<string, any>) => {
  console.error('Error captured:', error)

  if (!import.meta.env.VITE_SENTRY_DSN) {
    return
  }

  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, filterSensitiveData(value))
      })
    }
    Sentry.captureException(error)
  })
}

/**
 * Capture a message with severity
 */
export const captureMessage = (
  message: string,
  level: 'info' | 'warning' | 'error' = 'info'
) => {
  if (!import.meta.env.VITE_SENTRY_DSN) {
    console.log(`[${level.toUpperCase()}] ${message}`)
    return
  }

  const sentryLevel = level === 'info' ? 'info' :
                      level === 'warning' ? 'warning' : 'error'
  Sentry.captureMessage(message, sentryLevel)
}

/**
 * Add a breadcrumb for user actions
 */
export const addBreadcrumb = (
  message: string,
  category: string,
  data?: Record<string, any>
) => {
  if (!import.meta.env.VITE_SENTRY_DSN) {
    return
  }

  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    data: data ? filterSensitiveData(data) : undefined,
    timestamp: Date.now() / 1000
  })
}

/**
 * Set user context for error tracking
 */
export const setUser = (user: {
  id: string
  email?: string
  username?: string
  role?: string
} | null) => {
  if (!import.meta.env.VITE_SENTRY_DSN) {
    return
  }

  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
      ip_address: '{{auto}}'
    })

    // Add role as a tag for easier filtering
    if (user.role) {
      Sentry.setTag('user.role', user.role)
    }
  } else {
    Sentry.setUser(null)
  }
}

/**
 * Start a performance transaction
 */
export const startTransaction = (name: string, op: string = 'navigation') => {
  if (!import.meta.env.VITE_SENTRY_DSN) {
    return null
  }

  return Sentry.startTransaction({ name, op })
}

/**
 * Profile a component render
 */
export const profileComponent = (componentName: string) => {
  return {
    onRender: (
      id: string,
      phase: 'mount' | 'update',
      actualDuration: number,
      baseDuration: number
    ) => {
      if (!import.meta.env.VITE_SENTRY_DSN) {
        return
      }

      // Only track slow renders
      if (actualDuration > 16) { // More than one frame (16ms)
        addBreadcrumb('Slow component render', 'ui.render', {
          component: componentName,
          phase,
          actualDuration: Math.round(actualDuration),
          baseDuration: Math.round(baseDuration),
          id
        })

        // Report very slow renders as issues
        if (actualDuration > 100) {
          captureMessage(
            `Slow render detected: ${componentName} took ${Math.round(actualDuration)}ms`,
            'warning'
          )
        }
      }
    }
  }
}

/**
 * Track API errors
 */
export const trackApiError = (
  endpoint: string,
  method: string,
  status: number,
  error: any
) => {
  addBreadcrumb('API Error', 'api', {
    endpoint,
    method,
    status,
    error: error?.message || 'Unknown error'
  })

  // Capture server errors
  if (status >= 500) {
    captureException(
      new Error(`API Error: ${method} ${endpoint} returned ${status}`),
      {
        api: {
          endpoint,
          method,
          status,
          response: error
        }
      }
    )
  }
}

/**
 * Track user interactions
 */
export const trackInteraction = (
  action: string,
  category: string,
  label?: string,
  value?: any
) => {
  addBreadcrumb(action, `ui.${category}`, {
    label,
    value: filterSensitiveData(value)
  })
}

/**
 * Create feedback widget
 */
export const showFeedbackWidget = (options?: {
  name?: string
  email?: string
  [key: string]: any
}) => {
  const user = Sentry.getCurrentHub().getScope()?.getUser()

  const widget = Sentry.showReportDialog({
    user: {
      name: options?.name || user?.username || '',
      email: options?.email || user?.email || ''
    },
    title: 'Report an Issue',
    subtitle: 'Help us improve by reporting bugs and issues',
    subtitle2: 'Our team will look into this as soon as possible',
    labelName: 'Name',
    labelEmail: 'Email',
    labelComments: 'What happened?',
    labelClose: 'Close',
    labelSubmit: 'Submit Report',
    errorGeneric: 'An error occurred while submitting your report. Please try again.',
    successMessage: 'Thank you for your feedback! We\'ll look into this issue.',
    ...options
  })

  return widget
}

// Export Sentry for direct use if needed
export { Sentry }