/**
 * HubPage Component
 * 
 * Standardized layout wrapper for all hub pages in the consolidated architecture.
 * Provides consistent header, tab navigation, and content area.
 * 
 * Part of Phase 2 UI consolidation: 79 screens → 18 hubs
 */

import React, { ReactNode } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

export interface HubTab {
    id: string
    label: string
    icon?: ReactNode
    content: ReactNode
    disabled?: boolean
}

export interface HubPageProps {
    /** Hub title displayed in header */
    title: string
    /** Hub icon displayed next to title */
    icon?: ReactNode
    /** Hub description/subtitle */
    description?: string
    /** Array of tab configurations */
    tabs: HubTab[]
    /** Default active tab id */
    defaultTab?: string
    /** Action buttons in header */
    headerActions?: ReactNode
    /** Callback when tab changes */
    onTabChange?: (tabId: string) => void
    /** Additional className for container */
    className?: string
    /** Full height mode */
    fullHeight?: boolean
}

/**
 * HubPage provides a consistent layout for all major hub screens.
 * 
 * @example
 * <HubPage
 *   title="Fleet Hub"
 *   icon={<CarIcon />}
 *   description="Manage your fleet vehicles and tracking"
 *   tabs={[
 *     { id: 'map', label: 'Map', content: <FleetMap /> },
 *     { id: 'vehicles', label: 'Vehicles', content: <VehicleList /> },
 *     { id: 'telemetry', label: 'Telemetry', content: <TelemetryView /> },
 *   ]}
 *   defaultTab="map"
 *   headerActions={<Button>Add Vehicle</Button>}
 * />
 */
export function HubPage({
    title,
    icon,
    description,
    tabs,
    defaultTab,
    headerActions,
    onTabChange,
    className,
    fullHeight = true,
}: HubPageProps) {
    const activeTabId = defaultTab || tabs[0]?.id

    return (
        <div
            className={cn(
                'flex flex-col',
                fullHeight && 'h-full',
                className
            )}
            data-testid="hub-page"
        >
            {/* Hub Header */}
            <header
                className="flex items-center justify-between px-6 py-4 border-b bg-background"
                data-testid="hub-header"
            >
                <div className="flex items-center gap-3">
                    {icon && (
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                            {icon}
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
                        {description && (
                            <p className="text-sm text-muted-foreground">{description}</p>
                        )}
                    </div>
                </div>
                {headerActions && (
                    <div className="flex items-center gap-2" data-testid="hub-actions">
                        {headerActions}
                    </div>
                )}
            </header>

            {/* Tab Navigation */}
            <Tabs
                defaultValue={activeTabId}
                onValueChange={onTabChange}
                className="flex flex-col flex-1 min-h-0"
            >
                <TabsList
                    className="w-full justify-start rounded-none border-b bg-background px-6 h-12"
                    data-testid="hub-tabs"
                >
                    {tabs.map((tab) => (
                        <TabsTrigger
                            key={tab.id}
                            value={tab.id}
                            disabled={tab.disabled}
                            className="gap-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4"
                            data-testid={`hub-tab-${tab.id}`}
                        >
                            {tab.icon}
                            {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {/* Tab Content */}
                {tabs.map((tab) => (
                    <TabsContent
                        key={tab.id}
                        value={tab.id}
                        className="flex-1 min-h-0 m-0 outline-none"
                        data-testid={`hub-content-${tab.id}`}
                    >
                        {tab.content}
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    )
}

/**
 * HubSection provides consistent content sections within hub tabs.
 */
export interface HubSectionProps {
    title?: string
    description?: string
    actions?: ReactNode
    children: ReactNode
    className?: string
    padding?: boolean
}

export function HubSection({
    title,
    description,
    actions,
    children,
    className,
    padding = true,
}: HubSectionProps) {
    return (
        <section
            className={cn(
                'flex flex-col',
                padding && 'p-6',
                className
            )}
            data-testid="hub-section"
        >
            {(title || actions) && (
                <div className="flex items-center justify-between mb-4">
                    <div>
                        {title && (
                            <h2 className="text-lg font-medium text-foreground">{title}</h2>
                        )}
                        {description && (
                            <p className="text-sm text-muted-foreground">{description}</p>
                        )}
                    </div>
                    {actions && <div className="flex items-center gap-2">{actions}</div>}
                </div>
            )}
            <div className="flex-1 min-h-0">{children}</div>
        </section>
    )
}

export default HubPage
