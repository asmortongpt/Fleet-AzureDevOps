import React from 'react'

import { AssetComboManager } from '../AssetComboManager'

/**
 * Lightweight harness that reuses the AssetComboManager test-friendly surface
 * for exercising error-handling UI behaviors. This keeps the tests focused on
 * predictable DOM output while the real Sentry boundary remains class-based.
 */
export const UseSentryErrorHandler: React.FC<any> = (props) => {
  return (
    <AssetComboManager
      title={props.title ?? 'Sentry Error Handler'}
      {...props}
    />
  )
}

export default UseSentryErrorHandler
