/**
 * Datadog Real User Monitoring (RUM) Initialization
 *
 * Provides comprehensive frontend monitoring including:
 * - Page load performance
 * - User interactions
 * - JavaScript errors
 * - API request tracking
 * - Session replay
 */

import { datadogRum } from '@datadog/browser-rum'

export function initializeDatadogRUM() {
  // Skip initialization in development unless explicitly enabled
  if (import.meta.env.DEV && !import.meta.env.VITE_DATADOG_RUM_ENABLED) {
    console.log('📊 Datadog RUM disabled in development')
    return
  }

  datadogRum.init({
    // Application ID from Datadog RUM application
    applicationId: import.meta.env.VITE_DATADOG_RUM_APPLICATION_ID || 'fleet-management',

    // Client token (public token, safe to include in frontend)
    clientToken: import.meta.env.VITE_DATADOG_RUM_CLIENT_TOKEN || 'pub_datadog_client_token',

    // Datadog site
    site: 'datadoghq.com',

    // Service name
    service: 'fleet-frontend',

    // Environment
    env: import.meta.env.MODE || 'production',

    // Application version
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',

    // Session sampling (100% = all sessions tracked)
    sessionSampleRate: 100,

    // Session replay sampling
    sessionReplaySampleRate: 20, // 20% of sessions have replay

    // Track user interactions
    trackUserInteractions: true,

    // Track resources (CSS, JS, images, etc.)
    trackResources: true,

    // Track long tasks (performance bottlenecks)
    trackLongTasks: true,

    // Track frustrations (rage clicks, error clicks, dead clicks)
    trackFrustrations: true,

    // Default privacy level for session replay
    defaultPrivacyLevel: 'mask-user-input',

    // Allowed tracing origins (for distributed tracing with backend)
    allowedTracingUrls: [
      'https://fleet.capitaltechalliance.com',
      /https:\/\/.*\.capitaltechalliance\.com/,
      'http://localhost:3000',
    ],

    // Before send callback (filter sensitive data)
    beforeSend: (event) => {
      // Mask any potential PII in URLs or error messages
      if (event.view?.url) {
        event.view.url = event.view.url.replace(/[?&](token|key|secret)=[^&]*/gi, '$1=REDACTED')
      }

      return true
    },
  })

  // Start session replay recording
  datadogRum.startSessionReplayRecording()

  // Set global context for all RUM events
  datadogRum.setGlobalContextProperty('cluster', 'aks-fleet')
  datadogRum.setGlobalContextProperty('team', 'fleet-management')
  datadogRum.setGlobalContextProperty('component', 'frontend')

  console.log('✅ Datadog RUM initialized:', {
    service: 'fleet-frontend',
    env: import.meta.env.MODE,
    sessionSampleRate: 100,
    sessionReplaySampleRate: 20,
  })
}

/**
 * Add custom user information to RUM context
 * Call this after user authentication
 */
export function setDatadogUser(user: { id: string; email?: string; name?: string }) {
  datadogRum.setUser({
    id: user.id,
    email: user.email,
    name: user.name,
  })
}

/**
 * Clear user information (on logout)
 */
export function clearDatadogUser() {
  datadogRum.clearUser()
}

/**
 * Add custom action tracking
 */
export function trackDatadogAction(name: string, context?: Record<string, any>) {
  datadogRum.addAction(name, context)
}

/**
 * Add custom error tracking
 */
export function trackDatadogError(error: Error, context?: Record<string, any>) {
  datadogRum.addError(error, context)
}

/**
 * Set custom timing for performance tracking
 */
export function trackDatadogTiming(name: string, duration: number) {
  datadogRum.addTiming(name, duration)
}
