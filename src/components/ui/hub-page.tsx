/**
 * HubPage Component
 *
 * Standardized layout wrapper for all hub pages in the consolidated architecture.
 * Provides consistent header, tab navigation, and content area.
 * Enhanced with glassmorphism effects and smooth animations.
 *
 * Part of Phase 2 UI consolidation: 79 screens → 18 hubs
 */

import { motion } from 'framer-motion'
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
    /** Accessible label for screen readers */
    ariaLabel?: string
}

// Backward compatibility alias
export type HubTab = HubTabConfig

/**
 * HubTabItem - Component version for child-based API
 * This is a "marker" component that gets processed by HubPage
 */
export interface HubTabItemProps {
    value: string
    label: string
    icon?: ReactNode
    disabled?: boolean
    children: ReactNode
}

export function HubTabItem({ children }: HubTabItemProps) {
    // This component is a "marker" - its props are extracted by parent
    // It just renders children directly when used standalone
    return <>{children}</>
}

export interface HubPageProps {
    /** Hub title displayed in header */
    title: string
    /** Hub icon displayed next to title */
    icon?: ReactNode
    /** Hub description/subtitle */
    description?: string
    /** Array of tab configurations */
    tabs?: HubTab[]
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
    /** HubTabItems as children */
    children?: ReactNode
    /** Custom gradient CSS class for header */
    gradient?: string
    /** Restrict access to CTA owners only */
    ctaOwnerOnly?: boolean
    /** Restrict access to super admins only */
    superAdminOnly?: boolean
}

/**
 * HubPage provides a consistent layout for all major hub screens.
 */
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
    // Parse children to convert HubTabItems into tabs
    const childTabs: HubTab[] = []
    React.Children.forEach(children, (child) => {
        if (React.isValidElement(child)) {
            // We assume valid elements are intended as tabs if they have value/label
            // Strictly checking for HubTabItem type can be brittle with HMR/bundlers
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
                'flex flex-col bg-gradient-to-b from-background to-background/95',
                fullHeight && 'h-full',
                className
            )}
            data-testid="hub-page"
        >
            {/* Hub Header - Enhanced with glassmorphism */}
            <motion.header
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={cn(
                    "flex items-center justify-between px-6 py-4 border-b",
                    "bg-gradient-to-r from-slate-900/80 via-slate-800/60 to-slate-900/80",
                    "backdrop-blur-md border-slate-700/50",
                    "shadow-lg"
                )}
                data-testid="hub-header"
            >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    {icon && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                            className={cn(
                                "flex items-center justify-center w-10 h-10 rounded-lg",
                                "bg-primary/20 backdrop-blur-sm border border-primary/30",
                                "text-primary shadow-lg"
                            )}
                        >
                            {icon}
                        </motion.div>
                    )}
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 }}
                    >
                        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
                        {description && (
                            <p className="text-sm text-muted-foreground mt-0.5 truncate">{description}</p>
                        )}
                    </motion.div>
                </div>
                {headerActions && (
                    <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-2"
                        data-testid="hub-actions"
                    >
                        {headerActions}
                    </motion.div>
                )}
            </motion.header>

            {/* Breadcrumb Navigation */}
            <DrilldownBreadcrumbs />

            {/* Tab Navigation */}
            <Tabs
                value={activeTab}
                onValueChange={handleTabChange}
                className="flex flex-col flex-1 min-h-0"
            >
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25, duration: 0.3 }}
                >
                    <TabsList
                        className={cn(
                            "w-full justify-start rounded-none border-b px-6 h-12",
                            "bg-gradient-to-b from-slate-900/60 to-slate-900/40",
                            "backdrop-blur-sm border-slate-700/50",
                            "shadow-md"
                        )}
                        data-testid="hub-tabs"
                    >
                        {allTabs.map((tab, index) => (
                            <motion.div
                                key={tab.id}
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + index * 0.05, duration: 0.2 }}
                            >
                                <TabsTrigger
                                    value={tab.id}
                                    disabled={tab.disabled}
                                    aria-label={tab.ariaLabel || tab.label}
                                    className={cn(
                                        "gap-2 rounded-none px-4",
                                        "data-[state=active]:bg-gradient-to-b data-[state=active]:from-primary/10 data-[state=active]:to-transparent",
                                        "data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary",
                                        "transition-all duration-200"
                                    )}
                                    data-testid={`hub-tab-${tab.id}`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </TabsTrigger>
                            </motion.div>
                        ))}
                    </TabsList>
                </motion.div>

                {/* Tab Content */}
                {allTabs.map((tab) => (
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
