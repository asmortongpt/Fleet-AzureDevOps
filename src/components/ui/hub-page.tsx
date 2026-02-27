/**
 * HubPage — Premium hub layout
 *
 * Large title, gradient icon badge, segmented tab bar,
 * generous spacing, smooth content transitions.
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
            {/* ── Hub Header ── */}
            <header
                className="relative px-7 pt-6 pb-5"
                style={{ background: 'var(--surface-0)' }}
                data-testid="hub-header"
            >
                {/* Ambient glow */}
                <div
                    className="absolute top-0 left-0 w-[500px] h-[200px] pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at 0% 0%, rgba(16,185,129,0.06) 0%, transparent 70%)' }}
                />

                <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-5 min-w-0">
                        {icon && (
                            <div
                                className="flex items-center justify-center w-12 h-12 rounded-2xl shrink-0"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(16,185,129,0.18) 0%, rgba(16,185,129,0.06) 100%)',
                                    border: '1px solid rgba(16,185,129,0.22)',
                                    boxShadow: '0 0 24px rgba(16,185,129,0.10), inset 0 1px 1px rgba(255,255,255,0.05)',
                                    color: '#10b981',
                                }}
                            >
                                {React.isValidElement(icon) ? icon : React.createElement(icon as React.ComponentType<{ className: string }>, { className: 'h-6 w-6' })}
                            </div>
                        )}
                        <div className="min-w-0">
                            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{title}</h1>
                            {description && (
                                <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>{description}</p>
                            )}
                        </div>
                    </div>
                    {headerActions && (
                        <div className="flex items-center gap-2" data-testid="hub-actions">
                            {headerActions}
                        </div>
                    )}
                </div>

                {/* Bottom gradient line */}
                <div
                    className="absolute bottom-0 left-0 right-0 h-px"
                    style={{ background: 'linear-gradient(90deg, rgba(16,185,129,0.25) 0%, rgba(16,185,129,0.06) 30%, transparent 60%)' }}
                />
            </header>

            {/* Breadcrumbs */}
            <DrilldownBreadcrumbs />

            {/* ── Tab Navigation ── */}
            {allTabs.length > 0 ? (
                <Tabs
                    value={activeTab}
                    onValueChange={handleTabChange}
                    className="flex flex-col flex-1 min-h-0"
                >
                    <div
                        className="px-7 py-1.5"
                        style={{
                            background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                        }}
                    >
                        <TabsList
                            className="h-auto p-1 rounded-xl gap-1 bg-white/[0.03] border border-white/[0.05] w-auto inline-flex"
                            data-testid="hub-tabs"
                        >
                            {allTabs.map((tab) => (
                                <TabsTrigger
                                    key={tab.id}
                                    value={tab.id}
                                    disabled={tab.disabled}
                                    aria-label={tab.ariaLabel || tab.label}
                                    className={cn(
                                        "gap-2 px-4 py-2 text-[13px] font-medium rounded-lg transition-all duration-150",
                                        "text-white/35 hover:text-white/55",
                                        "data-[state=active]:bg-white/[0.08] data-[state=active]:text-white data-[state=active]:shadow-sm",
                                    )}
                                    data-testid={`hub-tab-${tab.id}`}
                                >
                                    {tab.icon && (React.isValidElement(tab.icon) ? tab.icon : typeof tab.icon === 'function' ? React.createElement(tab.icon as React.ComponentType<{ className: string }>, { className: 'h-4 w-4' }) : null)}
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

                    {allTabs.map((tab) => (
                        <TabsContent
                            key={tab.id}
                            value={tab.id}
                            className="flex-1 min-h-0 m-0 outline-none overflow-y-auto"
                            style={{ background: 'var(--surface-0)' }}
                            data-testid={`hub-content-${tab.id}`}
                        >
                            {tab.content}
                        </TabsContent>
                    ))}
                </Tabs>
            ) : (
                <div className="flex flex-col flex-1 min-h-0 p-7 overflow-y-auto" style={{ background: 'var(--surface-0)' }}>
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
                padding && 'p-5',
                className
            )}
            data-testid="hub-section"
        >
            {(title || actions) && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-2">
                    <div className="min-w-0">
                        {title && (
                            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
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
        <div className={cn('grid gap-4', gridCols[columns], className)}>
            {children}
        </div>
    )
}

export default HubPage
