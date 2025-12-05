/**
 * Error Alert Component
 * @module ArcGIS/components/ErrorAlert
 */

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Warning } from "@phosphor-icons/react"

interface ErrorAlertProps {
  error: string
}

/**
 * Display error alert
 */
export function ErrorAlert({ error }: ErrorAlertProps) {
  return (
    <Alert variant="destructive">
      <Warning className="w-4 h-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  )
}
