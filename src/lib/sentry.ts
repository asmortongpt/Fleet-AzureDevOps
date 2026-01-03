/**
 * Sentry Error Tracking Configuration for Frontend
 * TEMPORARILY DISABLED - Sentry v10 API migration needed
 */

import logger from '@/utils/logger'

export const initSentry = () => {
  logger.warn('Sentry monitoring temporarily disabled - requires v10 API migration')
  // TODO: Migrate to @sentry/react v10 API
  // - reactRouterV6Instrumentation -> browser.reactRouterInstrumentation
  // - Replay -> browser.replayIntegration
  // - startTransaction -> startSpan
  // - getCurrentHub -> getClient
}

export const logError = (error: Error, context?: any) => {
  logger.error('Sentry (disabled):', error, context)
}

export const setUser = (user: any) => {
  logger.debug('Sentry setUser (disabled):', logger.redact(user))
}

export const captureException = (error: Error) => {
  logger.error('Sentry captureException (disabled):', error)
}

export const captureMessage = (message: string, level: string = 'info') => {
  logger.debug('Sentry captureMessage (disabled):', message, level)
}

export const addBreadcrumb = (breadcrumb: any) => {
  logger.debug('Sentry breadcrumb (disabled):', breadcrumb)
}

export const startTransaction = (context: any) => {
  logger.debug('Sentry transaction (disabled):', context)
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
  logger.debug('Sentry feedback widget (disabled)')
}
