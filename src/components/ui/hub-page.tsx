/**
 * HubPage — Premium hub layout
 *
 * Gradient-accented header, frosted tab bar with emerald active indicator,
 * smooth content transitions, staggered child animations.
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
    title: ReactNode
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
                'flex flex-col',
                fullHeight && 'h-full',
                className
            )}
            style={{ background: 'var(--surface-0)' }}
            data-testid="hub-page"
        >
            {/* Premium Hub Header */}
            <header
                className="premium-hub-header flex items-center justify-between"
                data-testid="hub-header"
            >
                <div className="flex items-center gap-4 min-w-0">
                    {icon && (
                        <div className="premium-hub-icon">
                            {React.isValidElement(icon) ? icon : React.createElement(icon as React.ComponentType<{ className: string }>, { className: 'h-5 w-5' })}
                        </div>
                    )}
                    <div className="min-w-0">
                        <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{title}</h1>
                        {description && (
                            <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{description}</p>
                        )}
                    </div>
                </div>
                {headerActions && (
                    <div className="flex items-center gap-2" data-testid="hub-actions">
                        {headerActions}
                    </div>
                )}
            </header>

            {/* Breadcrumbs */}
            <DrilldownBreadcrumbs />

            {/* Tab Navigation or Direct Children */}
            {allTabs.length > 0 ? (
                <Tabs
                    value={activeTab}
                    onValueChange={handleTabChange}
                    className="flex flex-col flex-1 min-h-0"
                >
                    <TabsList
                        className="premium-tabs w-full justify-start rounded-none h-11"
                        data-testid="hub-tabs"
                    >
                        {allTabs.map((tab) => (
                            <TabsTrigger
                                key={tab.id}
                                value={tab.id}
                                disabled={tab.disabled}
                                aria-label={tab.ariaLabel || tab.label}
                                className="premium-tab-trigger gap-2 px-4 text-[13px] font-medium rounded-none border-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none"
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
                            className="flex-1 min-h-0 m-0 outline-none overflow-y-auto"
                            style={{ background: 'var(--surface-0)' }}
                            data-testid={`hub-content-${tab.id}`}
                        >
                            <div className="premium-stagger">
                                {tab.content}
                            </div>
                        </TabsContent>
                    ))}
                </Tabs>
            ) : (
                <div className="flex flex-col flex-1 min-h-0 p-6 overflow-y-auto" style={{ background: 'var(--surface-0)' }}>
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
}: HubSectionProps) {
    return (
        <section
            className={cn(
                'flex flex-col',
                padding && 'p-4',
                className
            )}
            data-testid="hub-section"
        >
            {(title || actions) && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                    <div className="min-w-0">
                        {title && (
                            <h2 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
                        )}
                        {description && (
                            <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{description}</p>
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
        <div className={cn('grid gap-4 premium-stagger', gridCols[columns], className)}>
            {children}
        </div>
    )
}

export default HubPage
