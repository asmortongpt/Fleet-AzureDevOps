/**
 * HubPage Component
 *
 * Standardized layout wrapper for all hub pages in the consolidated architecture.
 * Provides consistent header, tab navigation, and content area.
 *
 * Part of Phase 2 UI consolidation: 79 screens → 18 hubs
 */

import React, { ReactNode, useState } from 'react'

import { DrilldownBreadcrumbs } from '@/components/drilldown/DrilldownBreadcrumbs'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

export interface HubTab {
    id: string
    label: string
    icon?: ReactNode
    content: ReactNode
    disabled?: boolean
    badge?: string | number
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
    const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)

    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId)
        onTabChange?.(tabId)
    }

    return (
        <div
            className={cn(
                'flex flex-col bg-gradient-to-b from-background to-background/95',
                fullHeight && 'h-full',
                className
            )}
            data-testid="hub-page"
        >
            {/* Hub Header */}
            <header
                className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-border/50 bg-card/50 backdrop-blur-sm gap-3 sm:gap-4"
                data-testid="hub-header"
            >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    {icon && (
                        <div className="flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary shadow-sm shrink-0">
                            {icon}
                        </div>
                    )}
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight truncate">{title}</h1>
                        {description && (
                            <p className="text-sm text-muted-foreground mt-0.5 truncate">{description}</p>
                        )}
                    </div>
                </div>
                {headerActions && (
                    <div className="flex items-center gap-2 shrink-0" data-testid="hub-actions">
                        {headerActions}
                    </div>
                )}
            </header>

            {/* Breadcrumb Navigation */}
            <DrilldownBreadcrumbs />

            {/* Tab Navigation */}
            <Tabs
                value={activeTab}
                onValueChange={handleTabChange}
                className="flex flex-col flex-1 min-h-0"
            >
                <div className="border-b border-border/50 bg-card/30">
                    <TabsList
                        className="w-full justify-start rounded-none bg-transparent px-4 sm:px-6 h-12 sm:h-14 gap-1 overflow-x-auto no-scrollbar"
                        data-testid="hub-tabs"
                    >
                        {tabs.map((tab) => (
                            <TabsTrigger
                                key={tab.id}
                                value={tab.id}
                                disabled={tab.disabled}
                                className={cn(
                                    "relative gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                                    "data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm",
                                    "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-muted/50",
                                    "disabled:opacity-50 disabled:cursor-not-allowed",
                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                )}
                                data-testid={`hub-tab-${tab.id}`}
                            >
                                {tab.icon && <span className="shrink-0">{tab.icon}</span>}
                                <span className="truncate">{tab.label}</span>
                                {tab.badge !== undefined && (
                                    <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-primary/20 text-primary">
                                        {tab.badge}
                                    </span>
                                )}
                                {/* Active indicator line */}
                                <span className={cn(
                                    "absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-primary transition-opacity duration-200",
                                    activeTab === tab.id ? "opacity-100" : "opacity-0"
                                )} />
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                {/* Tab Content */}
                {tabs.map((tab) => (
                    <TabsContent
                        key={tab.id}
                        value={tab.id}
                        className="flex-1 min-h-0 m-0 outline-none animate-fade-in"
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
    animate?: boolean
}

export function HubSection({
    title,
    description,
    actions,
    children,
    className,
    padding = true,
    animate = true,
}: HubSectionProps) {
    return (
        <section
            className={cn(
                'flex flex-col',
                padding && 'p-4 sm:p-6',
                animate && 'animate-fade-in-up',
                className
            )}
            data-testid="hub-section"
        >
            {(title || actions) && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
                    <div className="min-w-0">
                        {title && (
                            <h2 className="text-lg sm:text-xl font-semibold text-foreground">{title}</h2>
                        )}
                        {description && (
                            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
                        )}
                    </div>
                    {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
                </div>
            )}
            <div className="flex-1 min-h-0">{children}</div>
        </section>
    )
}

/**
 * HubGrid provides responsive grid layout for hub content
 */
export interface HubGridProps {
    children: ReactNode
    className?: string
    columns?: 1 | 2 | 3 | 4
}

export function HubGrid({ children, className, columns = 4 }: HubGridProps) {
    const gridCols = {
        1: 'grid-cols-1',
        2: 'grid-cols-1 sm:grid-cols-2',
        3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    }

    return (
        <div className={cn('grid gap-4 sm:gap-6', gridCols[columns], className)}>
            {children}
        </div>
    )
}

export default HubPage
