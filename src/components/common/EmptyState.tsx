/**
 * Empty State Component
 * Display when no data is available
 */

import { Inbox, Search, AlertTriangle, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
    icon?: 'inbox' | 'search' | 'alert' | 'custom'
    customIcon?: React.ReactNode
    title: string
    description?: string
    action?: {
        label: string
        onClick: () => void
    }
    className?: string
}

const iconMap = {
    inbox: Inbox,
    search: Search,
    alert: AlertTriangle,
}

export function EmptyState({
    icon = 'inbox',
    customIcon,
    title,
    description,
    action,
    className,
}: EmptyStateProps) {
    const Icon = iconMap[icon]

    return (
        <div className={cn(
            "flex flex-col items-center justify-center py-16 px-4 text-center",
            className
        )}>
            <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
                {customIcon || (Icon && <Icon className="w-8 h-8 text-slate-500" />)}
            </div>
            <h3 className="text-lg font-semibold text-slate-200 mb-2">{title}</h3>
            {description && (
                <p className="text-sm text-slate-400 max-w-sm mb-6">{description}</p>
            )}
            {action && (
                <Button onClick={action.onClick} className="gap-2">
                    <Plus className="w-4 h-4" />
                    {action.label}
                </Button>
            )}
        </div>
    )
}

// Preset empty states for common scenarios
export function NoVehiclesEmpty({ onAdd }: { onAdd?: () => void }) {
    return (
        <EmptyState
            icon="inbox"
            title="No vehicles found"
            description="Add your first vehicle to start tracking your fleet."
            action={onAdd ? { label: 'Add Vehicle', onClick: onAdd } : undefined}
        />
    )
}

export function NoDriversEmpty({ onAdd }: { onAdd?: () => void }) {
    return (
        <EmptyState
            icon="inbox"
            title="No drivers found"
            description="Add drivers to assign them to vehicles and routes."
            action={onAdd ? { label: 'Add Driver', onClick: onAdd } : undefined}
        />
    )
}

export function NoSearchResultsEmpty({ query }: { query: string }) {
    return (
        <EmptyState
            icon="search"
            title="No results found"
            description={`We couldn't find anything matching "${query}". Try a different search term.`}
        />
    )
}

export function ErrorState({
    title = "Something went wrong",
    description = "An unexpected error occurred. Please try again.",
    onRetry
}: {
    title?: string
    description?: string
    onRetry?: () => void
}) {
    return (
        <EmptyState
            icon="alert"
            title={title}
            description={description}
            action={onRetry ? { label: 'Try Again', onClick: onRetry } : undefined}
        />
    )
}
