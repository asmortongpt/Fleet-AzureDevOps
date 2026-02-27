/**
 * DrilldownPanel - Interactive analytics drilldown with hierarchical navigation
 * Features: Multi-level drilling, breadcrumb navigation, detail views
 */

import { X, ChevronRight, ArrowLeft, Download, Share } from 'lucide-react'
// motion removed - React 19 incompatible
import { memo, useState, useCallback } from 'react'

import { CostAnalyticsChart } from './CostAnalyticsChart'
import { EfficiencyMetricsChart } from './EfficiencyMetricsChart'

import { formatCurrency, formatNumber as formatNum } from '@/utils/format-helpers'
import { formatVehicleName } from '@/utils/vehicle-display'

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
    // formatCurrency imported from @/utils/format-helpers
    const formatPercent = (value?: number | string) => {
        if (value === null || value === undefined || value === '') return '—'
        if (typeof value === 'string') return value
        return `${value}%`
    }
    const formatNumber = (value?: number | string) => {
        if (value === null || value === undefined || value === '') return '—'
        if (typeof value === 'string') return value
        return formatNum(value)
    }

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
                <div className="flex items-center justify-center h-full text-white/70">
                    <p>No data selected</p>
                </div>
            )
        }

        switch (currentData.level) {
            case 'overview':
                return (
                    <div className="space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <CategoryCard
                                title="Cost Analysis"
                                value={formatCurrency(currentData?.data?.summary?.totalCost ?? currentData?.metadata?.summary?.totalCost)}
                                change={formatPercent(currentData?.metadata?.changes?.cost)}
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
                                value={formatPercent(currentData?.data?.summary?.utilization ?? currentData?.metadata?.summary?.utilization)}
                                change={formatPercent(currentData?.metadata?.changes?.utilization)}
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
                                value={formatNumber(currentData?.data?.summary?.efficiencyScore ?? currentData?.metadata?.summary?.efficiencyScore)}
                                change={formatPercent(currentData?.metadata?.changes?.efficiencyScore)}
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
                        <div className="space-y-2">
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
                                vehicles={currentData?.data?.topVehicles || currentData?.data?.vehicles || []}
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
                        <div className="space-y-2">
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
                    <div className="space-y-2">
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
                    <div className="space-y-2">
                        <DetailView data={currentData.data} />
                    </div>
                )

            default:
                return null
        }
    }

    return (
        <>
            {isOpen && (
                <div
                    className="fixed right-0 top-0 bottom-0 w-full md:w-2/3 lg:w-1/2 xl:w-2/5 bg-[#111111] border-l border-white/[0.04] z-50 flex flex-col"
                >
                    {/* Header */}
                    <div className="bg-[#1a1a1a] border-b border-white/[0.04] p-3">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                {breadcrumbs.length > 1 && (
                                    <button
                                        onClick={() => handleDrillUp(breadcrumbs.length - 2)}
                                        className="p-2 hover:bg-white/[0.08] rounded-lg transition-colors"
                                    >
                                        <ArrowLeft className="w-3 h-3 text-white/70" />
                                    </button>
                                )}
                                <h2 className="text-sm font-bold text-white">
                                    {currentData?.title || 'Analytics Drilldown'}
                                </h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/[0.08] rounded-lg transition-colors"
                                aria-label="Close drilldown panel"
                            >
                                <X className="w-4 h-4 text-white/70" />
                            </button>
                        </div>

                        {/* Breadcrumbs */}
                        {breadcrumbs.length > 0 && (
                            <div className="flex items-center gap-2 text-sm overflow-x-auto pb-2">
                                {breadcrumbs.map((crumb, index) => (
                                    <div key={crumb.title} className="flex items-center gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => handleDrillUp(index)}
                                            className={`px-3 py-1 rounded-lg transition-colors ${
                                                index === breadcrumbs.length - 1
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'bg-white/[0.06] text-white/60 hover:bg-white/[0.08]'
                                            }`}
                                        >
                                            {crumb.title}
                                        </button>
                                        {index < breadcrumbs.length - 1 && (
                                            <ChevronRight className="w-4 h-4 text-white/40" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Subtitle */}
                        {currentData?.subtitle && (
                            <p className="text-white/70 text-sm mt-2">{currentData.subtitle}</p>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-2">
                            <button
                                onClick={handleExport}
                                className="flex items-center gap-2 px-2 py-2 bg-white/[0.06] hover:bg-white/[0.08] text-white rounded-lg transition-colors text-sm"
                            >
                                <Download className="w-4 h-4" />
                                Export
                            </button>
                            <button
                                onClick={handleShare}
                                className="flex items-center gap-2 px-2 py-2 bg-white/[0.06] hover:bg-white/[0.08] text-white rounded-lg transition-colors text-sm"
                            >
                                <Share className="w-4 h-4" />
                                Share
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-3">
                        {renderContent()}
                    </div>
                </div>
            )}
        </>
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
        className="bg-[#1a1a1a]/60 hover:bg-white/[0.08]/60 border border-white/[0.04] rounded-lg p-3 text-left transition-colors group"
    >
        <h3 className="text-white/70 text-sm font-medium mb-2">{title}</h3>
        <p className="text-base font-bold text-white mb-1">{value}</p>
        <p className={`text-sm font-medium ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
            {change}
        </p>
        <div className="flex items-center gap-2 mt-2 text-emerald-700 text-sm group-hover:translate-x-1 transition-transform">
            <span>View details</span>
            <ChevronRight className="w-4 h-4" />
        </div>
    </button>
))

const VehicleList = memo<{ vehicles: any[]; onVehicleClick: (vehicle: any) => void }>(({ vehicles, onVehicleClick }) => (
    <div className="bg-[#1a1a1a]/40 rounded-lg p-2">
        <h3 className="text-white font-semibold mb-2">Top Cost Vehicles</h3>
        <div className="space-y-2">
            {vehicles.length === 0 && (
                <div className="text-sm text-white/70">No vehicles available.</div>
            )}
            {vehicles.map((vehicle) => (
                <button
                    key={vehicle.id}
                    onClick={() => onVehicleClick(vehicle)}
                    className="w-full bg-white/[0.04] hover:bg-white/[0.06] rounded-lg p-3 text-left transition-colors"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white font-medium">{vehicle.name || vehicle.displayName || vehicle.vehicleNumber || 'Vehicle'}</p>
                            <p className="text-white/70 text-sm">{vehicle.vin || vehicle.vehicleIdentificationNumber || '—'}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-white font-semibold">{vehicle.cost || vehicle.totalCost || vehicle.costTotal || '—'}</p>
                            <ChevronRight className="w-4 h-4 text-white/70 ml-auto" />
                        </div>
                    </div>
                </button>
            ))}
        </div>
    </div>
))

const VehicleDetailCard = memo<{ vehicle: any }>(({ vehicle }) => (
    <div className="bg-[#1a1a1a]/40 rounded-lg p-3">
        <h3 className="text-white font-semibold text-base mb-2">{vehicle.name || formatVehicleName(vehicle)}</h3>
        <div className="grid grid-cols-2 gap-2">
            <div>
                <p className="text-white/70 text-sm">VIN</p>
                <p className="text-white font-medium">{vehicle.vin}</p>
            </div>
            <div>
                <p className="text-white/70 text-sm">Total Cost</p>
                <p className="text-white font-medium">{vehicle.cost || '$12,450'}</p>
            </div>
        </div>
    </div>
))

const DetailView = memo<{ data: any }>(({ data }) => (
    <div className="bg-[#1a1a1a]/40 rounded-lg p-3">
        <h3 className="text-white font-semibold text-base mb-2">Detailed Breakdown</h3>
        <pre className="text-white/60 text-sm overflow-auto">
            {JSON.stringify(data, null, 2)}
        </pre>
    </div>
))

CategoryCard.displayName = 'CategoryCard'
VehicleList.displayName = 'VehicleList'
VehicleDetailCard.displayName = 'VehicleDetailCard'
DetailView.displayName = 'DetailView'
