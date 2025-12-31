/**
 * HubPage Component
 *
 * Standardized layout wrapper for all hub pages in the consolidated architecture.
 * Provides consistent header, tab navigation, and content area.
 * Enhanced with glassmorphism effects and smooth animations.
 *
 * Part of Phase 2 UI consolidation: 79 screens → 18 hubs
 */

import React, { ReactNode } from 'react'
import { motion } from 'framer-motion'

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
                <div className="flex items-center gap-3">
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
                            <p className="text-sm text-muted-foreground">{description}</p>
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

            {/* Tab Navigation - Enhanced with glassmorphism */}
            <Tabs
                defaultValue={activeTabId}
                onValueChange={onTabChange}
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
                        {tabs.map((tab, index) => (
                            <motion.div
                                key={tab.id}
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + index * 0.05, duration: 0.2 }}
                            >
                                <TabsTrigger
                                    value={tab.id}
                                    disabled={tab.disabled}
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
