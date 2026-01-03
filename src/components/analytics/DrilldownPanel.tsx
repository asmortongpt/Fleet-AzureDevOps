/**
 * DrilldownPanel - Interactive analytics drilldown with hierarchical navigation
 * Features: Multi-level drilling, breadcrumb navigation, detail views
 */

import { memo, useState, useCallback } from 'react'
import { X, CaretRight, ArrowLeft, Download, Share } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { CostAnalyticsChart, type CostDataPoint } from './CostAnalyticsChart'
import { EfficiencyMetricsChart, type EfficiencyDataPoint } from './EfficiencyMetricsChart'

export type DrilldownLevel = 'overview' | 'category' | 'vehicle' | 'detail'

export interface DrilldownData {
    level: DrilldownLevel
    title: string
    subtitle?: string
    data: any
    metadata?: Record<string, any>
}

interface DrilldownPanelProps {
    isOpen: boolean
    onClose: () => void
    initialData?: DrilldownData
}

export const DrilldownPanel = memo<DrilldownPanelProps>(({
    isOpen,
    onClose,
    initialData,
}) => {
    const [breadcrumbs, setBreadcrumbs] = useState<DrilldownData[]>(
        initialData ? [initialData] : []
    )

    const currentData = breadcrumbs[breadcrumbs.length - 1]

    const handleDrillDown = useCallback((newData: DrilldownData) => {
        setBreadcrumbs(prev => [...prev, newData])
    }, [])

    const handleDrillUp = useCallback((index: number) => {
        setBreadcrumbs(prev => prev.slice(0, index + 1))
    }, [])

    const handleExport = useCallback(() => {
        // Export current view data as CSV/Excel
        const dataStr = JSON.stringify(currentData?.data, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${currentData?.title || 'analytics'}-${new Date().toISOString()}.json`
        link.click()
        URL.revokeObjectURL(url)
    }, [currentData])

    const handleShare = useCallback(() => {
        // Generate shareable link or copy to clipboard
        const shareData = {
            title: currentData?.title || 'Analytics',
            text: currentData?.subtitle || 'Fleet Analytics Data',
            url: window.location.href,
        }

        if (navigator.share) {
            navigator.share(shareData).catch(console.error)
        } else {
            // Fallback: copy link to clipboard
            navigator.clipboard.writeText(window.location.href)
        }
    }, [currentData])

    const renderContent = () => {
        if (!currentData) {
            return (
                <div className="flex items-center justify-center h-full text-slate-400">
                    <p>No data selected</p>
                </div>
            )
        }

        switch (currentData.level) {
            case 'overview':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <CategoryCard
                                title="Cost Analysis"
                                value="$2.4M"
                                change="+12%"
                                trend="up"
                                onClick={() =>
                                    handleDrillDown({
                                        level: 'category',
                                        title: 'Cost Analysis',
                                        subtitle: 'Detailed cost breakdown',
                                        data: currentData.data.costData,
                                    })
                                }
                            />
                            <CategoryCard
                                title="Fleet Utilization"
                                value="87%"
                                change="+5%"
                                trend="up"
                                onClick={() =>
                                    handleDrillDown({
                                        level: 'category',
                                        title: 'Fleet Utilization',
                                        subtitle: 'Vehicle utilization metrics',
                                        data: currentData.data.utilizationData,
                                    })
                                }
                            />
                            <CategoryCard
                                title="Efficiency Score"
                                value="92"
                                change="+8%"
                                trend="up"
                                onClick={() =>
                                    handleDrillDown({
                                        level: 'category',
                                        title: 'Efficiency Score',
                                        subtitle: 'Fleet efficiency metrics',
                                        data: currentData.data.efficiencyData,
                                    })
                                }
                            />
                        </div>
                    </div>
                )

            case 'category':
                if (currentData.title === 'Cost Analysis') {
                    return (
                        <div className="space-y-4">
                            <CostAnalyticsChart
                                data={currentData.data || []}
                                type="composed"
                                showBudget={true}
                                onDataPointClick={(dataPoint) =>
                                    handleDrillDown({
                                        level: 'detail',
                                        title: `Cost Detail: ${dataPoint.date}`,
                                        subtitle: 'Daily cost breakdown',
                                        data: dataPoint,
                                    })
                                }
                            />
                            <VehicleList
                                onVehicleClick={(vehicle) =>
                                    handleDrillDown({
                                        level: 'vehicle',
                                        title: `Vehicle: ${vehicle.name}`,
                                        subtitle: vehicle.vin,
                                        data: vehicle,
                                    })
                                }
                            />
                        </div>
                    )
                } else if (currentData.title === 'Efficiency Score') {
                    return (
                        <div className="space-y-4">
                            <EfficiencyMetricsChart
                                data={currentData.data || []}
                                type="trend"
                                onDataPointClick={(dataPoint) =>
                                    handleDrillDown({
                                        level: 'detail',
                                        title: `Efficiency Detail: ${dataPoint.date}`,
                                        subtitle: 'Daily efficiency breakdown',
                                        data: dataPoint,
                                    })
                                }
                            />
                        </div>
                    )
                }
                return <div>Category view for {currentData.title}</div>

            case 'vehicle':
                return (
                    <div className="space-y-6">
                        <VehicleDetailCard vehicle={currentData.data} />
                        <CostAnalyticsChart
                            data={currentData.data.costHistory || []}
                            type="line"
                        />
                        <EfficiencyMetricsChart
                            data={currentData.data.efficiencyHistory || []}
                            type="trend"
                        />
                    </div>
                )

            case 'detail':
                return (
                    <div className="space-y-4">
                        <DetailView data={currentData.data} />
                    </div>
                )

            default:
                return null
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    className="fixed right-0 top-0 bottom-0 w-full md:w-2/3 lg:w-1/2 xl:w-2/5 bg-slate-900 border-l border-slate-700 shadow-2xl z-50 flex flex-col"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                {breadcrumbs.length > 1 && (
                                    <button
                                        onClick={() => handleDrillUp(breadcrumbs.length - 2)}
                                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                                    >
                                        <ArrowLeft className="w-5 h-5 text-slate-400" />
                                    </button>
                                )}
                                <h2 className="text-2xl font-bold text-white">
                                    {currentData?.title || 'Analytics Drilldown'}
                                </h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        {/* Breadcrumbs */}
                        {breadcrumbs.length > 0 && (
                            <div className="flex items-center gap-2 text-sm overflow-x-auto pb-2">
                                {breadcrumbs.map((crumb, index) => (
                                    <div key={index} className="flex items-center gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => handleDrillUp(index)}
                                            className={`px-3 py-1 rounded-lg transition-colors ${
                                                index === breadcrumbs.length - 1
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                            }`}
                                        >
                                            {crumb.title}
                                        </button>
                                        {index < breadcrumbs.length - 1 && (
                                            <CaretRight className="w-4 h-4 text-slate-500" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Subtitle */}
                        {currentData?.subtitle && (
                            <p className="text-slate-400 text-sm mt-2">{currentData.subtitle}</p>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-4">
                            <button
                                onClick={handleExport}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                            >
                                <Download className="w-4 h-4" />
                                Export
                            </button>
                            <button
                                onClick={handleShare}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                            >
                                <Share className="w-4 h-4" />
                                Share
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {renderContent()}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
})

DrilldownPanel.displayName = 'DrilldownPanel'

// Helper components
const CategoryCard = memo<{
    title: string
    value: string
    change: string
    trend: 'up' | 'down'
    onClick: () => void
}>(({ title, value, change, trend, onClick }) => (
    <button
        onClick={onClick}
        className="bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700 rounded-lg p-6 text-left transition-colors group"
    >
        <h3 className="text-slate-400 text-sm font-medium mb-2">{title}</h3>
        <p className="text-3xl font-bold text-white mb-1">{value}</p>
        <p className={`text-sm font-medium ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
            {change}
        </p>
        <div className="flex items-center gap-2 mt-4 text-blue-400 text-sm group-hover:translate-x-1 transition-transform">
            <span>View details</span>
            <CaretRight className="w-4 h-4" />
        </div>
    </button>
))

const VehicleList = memo<{ onVehicleClick: (vehicle: any) => void }>(({ onVehicleClick }) => (
    <div className="bg-slate-800/40 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-4">Top Cost Vehicles</h3>
        <div className="space-y-2">
            {[
                { id: 1, name: 'Vehicle #1234', vin: '1HGBH41JXMN109186', cost: '$12,450' },
                { id: 2, name: 'Vehicle #1235', vin: '1HGBH41JXMN109187', cost: '$11,230' },
                { id: 3, name: 'Vehicle #1236', vin: '1HGBH41JXMN109188', cost: '$10,890' },
            ].map((vehicle) => (
                <button
                    key={vehicle.id}
                    onClick={() => onVehicleClick(vehicle)}
                    className="w-full bg-slate-700/40 hover:bg-slate-600/40 rounded-lg p-3 text-left transition-colors"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white font-medium">{vehicle.name}</p>
                            <p className="text-slate-400 text-sm">{vehicle.vin}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-white font-semibold">{vehicle.cost}</p>
                            <CaretRight className="w-4 h-4 text-slate-400 ml-auto" />
                        </div>
                    </div>
                </button>
            ))}
        </div>
    </div>
))

const VehicleDetailCard = memo<{ vehicle: any }>(({ vehicle }) => (
    <div className="bg-slate-800/40 rounded-lg p-6">
        <h3 className="text-white font-semibold text-xl mb-4">{vehicle.name}</h3>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <p className="text-slate-400 text-sm">VIN</p>
                <p className="text-white font-medium">{vehicle.vin}</p>
            </div>
            <div>
                <p className="text-slate-400 text-sm">Total Cost</p>
                <p className="text-white font-medium">{vehicle.cost || '$12,450'}</p>
            </div>
        </div>
    </div>
))

const DetailView = memo<{ data: any }>(({ data }) => (
    <div className="bg-slate-800/40 rounded-lg p-6">
        <h3 className="text-white font-semibold text-xl mb-4">Detailed Breakdown</h3>
        <pre className="text-slate-300 text-sm overflow-auto">
            {JSON.stringify(data, null, 2)}
        </pre>
    </div>
))

CategoryCard.displayName = 'CategoryCard'
VehicleList.displayName = 'VehicleList'
VehicleDetailCard.displayName = 'VehicleDetailCard'
DetailView.displayName = 'DetailView'
