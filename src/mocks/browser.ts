/**
 * MSW Browser Setup
 * Production-grade API mocking for development and testing
 */

import { setupWorker } from 'msw/browser'

import { handlers } from './handlers'

// Create MSW worker with all handlers
export const worker = setupWorker(...handlers)

// Start worker in development mode
if (import.meta.env.DEV) {
  worker.start({
    onUnhandledRequest: 'bypass', // Allow real API calls to pass through
    serviceWorker: {
      url: '/mockServiceWorker.js',
    },
  }).then(() => {
    console.log('🔄 MSW: API mocking enabled')
    console.log('🔄 MSW: Intercepting /api/* requests')
  }).catch((error) => {
    console.error('❌ MSW: Failed to start', error)
  })
}
