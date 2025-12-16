/**
 * Sentry Error Tracking Configuration for Frontend
 * TEMPORARILY DISABLED - Sentry v10 API migration needed
 */

export const initSentry = () => {
  console.warn('Sentry monitoring temporarily disabled - requires v10 API migration')
  // TODO: Migrate to @sentry/react v10 API
  // - reactRouterV6Instrumentation -> browser.reactRouterInstrumentation  
  // - Replay -> browser.replayIntegration
  // - startTransaction -> startSpan
  // - getCurrentHub -> getClient
}

export const logError = (error: Error, context?: any) => {
  console.error('Sentry (disabled):', error, context)
}

export const setUser = (user: any) => {
  console.log('Sentry setUser (disabled):', user)
}

export const captureException = (error: Error) => {
  console.error('Sentry captureException (disabled):', error)
}

export const captureMessage = (message: string, level: string = 'info') => {
  console.log('Sentry captureMessage (disabled):', message, level)
}

export const addBreadcrumb = (breadcrumb: any) => {
  console.log('Sentry breadcrumb (disabled):', breadcrumb)
}

export const startTransaction = (context: any) => {
  console.log('Sentry transaction (disabled):', context)
  return {
    finish: () => {},
    setStatus: () => {},
    setData: () => {}
  }
}

export const getCurrentHub = () => {
  return {
    getScope: () => ({
      setContext: () => {},
      setUser: () => {},
      setTag: () => {}
    })
  }
}

export const showFeedbackWidget = () => {
  console.log('Sentry feedback widget (disabled)')
}
