/**
 * HubPage Component
 *
 * Standardized layout wrapper for all hub pages.
 * Provides consistent header, tab navigation, and content area.
 */

import React, { ReactNode, useState } from 'react'

import { DrilldownBreadcrumbs } from '@/components/drilldown/DrilldownBreadcrumbs'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

export interface HubTabConfig {
    id: string
    label: string
    icon?: ReactNode
    content: ReactNode
    disabled?: boolean
    badge?: string | number
    ariaLabel?: string
}

export type HubTab = HubTabConfig

export interface HubTabItemProps {
    value: string
    label: string
    icon?: ReactNode
    disabled?: boolean
    children: ReactNode
}

export function HubTabItem({ children }: HubTabItemProps) {
    return <>{children}</>
}

export interface HubPageProps {
    title: string
    icon?: ReactNode | React.ComponentType<{ className?: string }>
    description?: string
    tabs?: HubTab[]
    defaultTab?: string
    headerActions?: ReactNode
    onTabChange?: (tabId: string) => void
    className?: string
    fullHeight?: boolean
    children?: ReactNode
    gradient?: string
    ctaOwnerOnly?: boolean
    superAdminOnly?: boolean
}

export function HubPage({
    title,
    icon,
    description,
    tabs = [],
    defaultTab,
    headerActions,
    onTabChange,
    className,
    fullHeight = true,
    children
}: HubPageProps) {
    const childTabs: HubTab[] = []
    React.Children.forEach(children, (child) => {
        if (React.isValidElement(child)) {
            const props = child.props as HubTabItemProps
            if (props.value && props.label) {
                childTabs.push({
                    id: props.value,
                    label: props.label,
                    icon: props.icon,
                    disabled: props.disabled,
                    content: props.children,
                    ariaLabel: props.label
                })
            }
        }
    })

    const allTabs = [...tabs, ...childTabs]
    const [activeTab, setActiveTab] = useState(defaultTab || allTabs[0]?.id)

    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId)
        onTabChange?.(tabId)
    }

    return (
        <div
            className={cn(
                'flex flex-col bg-background',
                fullHeight && 'h-full',
                className
            )}
            data-testid="hub-page"
        >
            {/* Hub Header */}
            <header
                className="relative flex items-center justify-between px-4 py-2 border-b bg-card/70 backdrop-blur-xl animate-fade-in"
                data-testid="hub-header"
                style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                }}
            >
                {/* Skyline gradient accent bar at top */}
                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.4), rgba(255,255,255,0.1))' }} />
                <div className="flex items-center gap-2 min-w-0">
                    {icon && (
                        <div
                            className="flex items-center justify-center w-7 h-7 rounded-lg text-white shadow-sm"
                            style={{ background: '#333' }}
                        >
                            {React.isValidElement(icon) ? icon : React.createElement(icon as React.ComponentType<{ className: string }>, { className: 'h-4 w-4' })}
                        </div>
                    )}
                    <h1 className="text-sm font-bold text-foreground">{title}</h1>
                </div>
                {headerActions && (
                    <div className="flex items-center gap-2" data-testid="hub-actions">
                        {headerActions}
                    </div>
                )}
            </header>

            {/* Breadcrumb Navigation */}
            <DrilldownBreadcrumbs />

            {/* Tab Navigation or Direct Children */}
            {allTabs.length > 0 ? (
                <Tabs
                    value={activeTab}
                    onValueChange={handleTabChange}
                    className="flex flex-col flex-1 min-h-0"
                >
                    <TabsList
                        className="w-full justify-start rounded-none border-b px-4 h-8 bg-card/30"
                        data-testid="hub-tabs"
                    >
                        {allTabs.map((tab) => (
                            <TabsTrigger
                                key={tab.id}
                                value={tab.id}
                                disabled={tab.disabled}
                                aria-label={tab.ariaLabel || tab.label}
                                className="gap-2 rounded-none px-3 text-xs data-[state=active]:border-b-2 data-[state=active]:border-white data-[state=active]:text-white transition-all duration-150"
                                data-testid={`hub-tab-${tab.id}`}
                            >
                                {tab.icon && (React.isValidElement(tab.icon) ? tab.icon : typeof tab.icon === 'function' ? React.createElement(tab.icon as React.ComponentType<{ className: string }>, { className: 'h-4 w-4' }) : null)}
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {allTabs.map((tab) => (
                        <TabsContent
                            key={tab.id}
                            value={tab.id}
                            className="flex-1 min-h-0 m-0 outline-none overflow-hidden"
                            data-testid={`hub-content-${tab.id}`}
                        >
                            {tab.content}
                        </TabsContent>
                    ))}
                </Tabs>
            ) : (
                <div className="flex flex-col flex-1 min-h-0 p-2 overflow-hidden">
                    {children}
                </div>
            )}
        </div>
    )
}

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
                padding && 'p-2',
                className
            )}
            data-testid="hub-section"
        >
            {(title || actions) && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-1">
                    <div className="min-w-0">
                        {title && (
                            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
                        )}
                        {description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                        )}
                    </div>
                    {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
                </div>
            )}
            <div className="flex-1 min-h-0">{children}</div>
        </section>
    )
}

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
        <div className={cn('grid gap-4', gridCols[columns], className)}>
            {children}
        </div>
    )
}

export default HubPage
