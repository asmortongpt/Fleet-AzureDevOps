/**
 * Error Alert Component
 * @module ArcGIS/components/ErrorAlert
 */

import { AlertTriangle } from "lucide-react"

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
      <AlertTriangle className="w-4 h-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  )
}
