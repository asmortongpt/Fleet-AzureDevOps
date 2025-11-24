import { Loader2 } from 'lucide-react'

/**
 * Module Loading Spinner
 * Displays while lazy-loaded modules are being fetched
 */
export function ModuleLoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px] w-full">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading module...</p>
      </div>
    </div>
  )
}

export default ModuleLoadingSpinner
