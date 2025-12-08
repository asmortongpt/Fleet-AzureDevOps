/**
 * Error Alert Component
 * @module ArcGIS/components/ErrorAlert
 */

import { Warning } from "@phosphor-icons/react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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
