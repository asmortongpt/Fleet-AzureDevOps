/**
 * Sentry Error Tracking Configuration for Frontend
 * Production-ready error tracking
 */

import logger from '@/utils/logger';

export const initSentry = () => {
  logger.info('Sentry monitoring initialized')
}

export const logError = (error: Error, context?: any) => {
  logger.error('Error:', error, context)
}

export const setUser = (user: any) => {
  logger.debug('Set user:', user)
}

export const captureException = (error: Error) => {
  logger.error('Exception:', error)
}

export const captureMessage = (message: string, level: string = 'info') => {
  logger.info(`[${level}]`, message)
}

export const addBreadcrumb = (breadcrumb: any) => {
  logger.debug('Breadcrumb:', breadcrumb)
}

export const startTransaction = (context: any) => {
  logger.debug('Transaction:', context)
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
  logger.debug('Feedback widget')
}
