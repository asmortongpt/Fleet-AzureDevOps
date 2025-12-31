/**
 * API Retry Button Component
 * FEAT-007: Manual retry button for failed API requests
 *
 * Features:
 * - Manual retry trigger
 * - Loading state indicator
 * - Retry count display
 * - Customizable appearance
 */

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface APIRetryButtonProps {
  onRetry: () => Promise<void> | void
  maxRetries?: number
  className?: string
  variant?: 'default' | 'outline' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  children?: React.ReactNode
}

export function APIRetryButton({
  onRetry,
  maxRetries = 3,
  className,
  variant = 'outline',
  size = 'default',
  children
}: APIRetryButtonProps) {
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const handleRetry = async () => {
    if (retryCount >= maxRetries) {
      return
    }

    setIsRetrying(true)
    setRetryCount(prev => prev + 1)

    try {
      await onRetry()
      // Reset on successful retry
      setRetryCount(0)
    } catch (error) {
      // Error will be handled by caller
    } finally {
      setIsRetrying(false)
    }
  }

  const isDisabled = retryCount >= maxRetries || isRetrying

  return (
    <Button
      onClick={handleRetry}
      disabled={isDisabled}
      variant={variant}
      size={size}
      className={cn('gap-2', className)}
    >
      <RefreshCw className={cn('h-4 w-4', isRetrying && 'animate-spin')} />
      {children || (
        <>
          Retry
          {retryCount > 0 && ` (${maxRetries - retryCount} left)`}
        </>
      )}
    </Button>
  )
}
