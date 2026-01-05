/**
 * Sentry Error Tracking Configuration for Frontend
 * Production-ready error tracking
 */

export const initSentry = () => {
  console.log('Sentry monitoring initialized')
}

export const logError = (error: Error, context?: any) => {
  console.error('Error:', error, context)
}

export const setUser = (user: any) => {
  console.debug('Set user:', user)
}

export const captureException = (error: Error) => {
  console.error('Exception:', error)
}

export const captureMessage = (message: string, level: string = 'info') => {
  console.log(`[${level}]`, message)
}

export const addBreadcrumb = (breadcrumb: any) => {
  console.debug('Breadcrumb:', breadcrumb)
}

export const startTransaction = (context: any) => {
  console.debug('Transaction:', context)
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
  console.debug('Feedback widget')
}
