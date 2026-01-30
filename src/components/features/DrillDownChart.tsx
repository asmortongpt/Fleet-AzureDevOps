/**
 * Interactive Drill-Down Chart Component
 *
 * Features:
 * - 3-layer clickable drill-down (Category → Subcategory → Detail)
 * - Breadcrumb navigation for current level
 * - Smooth animations and transitions
 * - Professional tooltip with context
 * - Back navigation support
 */

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'

import { cn } from '@/lib/utils'

// Sample 3-layer data structure
const COST_DATA = {
  level1: [
    { name: 'Fuel', value: 124200, color: '#D97706', percentage: 43.6 },
    { name: 'Maintenance', value: 89300, color: '#2563EB', percentage: 31.4 },
    { name: 'Insurance', value: 43200, color: '#9333EA', percentage: 15.2 },
    { name: 'Other', value: 27800, color: '#475569', percentage: 9.8 }
  ],
  level2: {
    'Fuel': [
      { name: 'Diesel', value: 68000, color: '#B45309', detail: 'Class 8 Trucks' },
      { name: 'Gasoline', value: 36200, color: '#EA580C', detail: 'Vans & Sedans' },
      { name: 'Electric Charging', value: 20000, color: '#F59E0B', detail: 'EV Fleet' }
    ],
    'Maintenance': [
      { name: 'Scheduled Service', value: 42000, color: '#1D4ED8', detail: 'Regular maintenance' },
      { name: 'Repairs', value: 28300, color: '#3B82F6', detail: 'Unscheduled fixes' },
      { name: 'Parts', value: 19000, color: '#60A5FA', detail: 'Replacement parts' }
    ],
    'Insurance': [
      { name: 'Liability', value: 24000, color: '#7C3AED', detail: 'Liability coverage' },
      { name: 'Collision', value: 12600, color: '#A78BFA', detail: 'Collision coverage' },
      { name: 'Comprehensive', value: 6600, color: '#C4B5FD', detail: 'Full coverage' }
    ],
    'Other': [
      { name: 'Registration', value: 12400, color: '#64748B', detail: 'Vehicle registration' },
      { name: 'Permits', value: 8900, color: '#94A3B8', detail: 'Operating permits' },
      { name: 'Miscellaneous', value: 6500, color: '#CBD5E1', detail: 'Other expenses' }
    ]
  },
  level3: {
    'Diesel': [
      { name: 'T-001', value: 4200, efficiency: '6.2 MPG' },
      { name: 'T-002', value: 3900, efficiency: '6.5 MPG' },
      { name: 'T-003', value: 4100, efficiency: '6.0 MPG' },
      { name: 'T-004', value: 3800, efficiency: '6.8 MPG' },
      { name: 'Others (45)', value: 52000, efficiency: 'Avg 6.3 MPG' }
    ],
    'Gasoline': [
      { name: 'V-001', value: 2200, efficiency: '18.2 MPG' },
      { name: 'V-002', value: 2100, efficiency: '18.5 MPG' },
      { name: 'S-001', value: 1800, efficiency: '24.1 MPG' },
      { name: 'Others (28)', value: 30100, efficiency: 'Avg 19.8 MPG' }
    ],
    'Electric Charging': [
      { name: 'EV-001', value: 1200, efficiency: '3.2 mi/kWh' },
      { name: 'EV-002', value: 1100, efficiency: '3.4 mi/kWh' },
      { name: 'EV-003', value: 1050, efficiency: '3.3 mi/kWh' },
      { name: 'Others (12)', value: 16650, efficiency: 'Avg 3.3 mi/kWh' }
    ]
  }
}

interface DrillDownChartProps {
  title: string
  subtitle?: string
  className?: string
}

interface Breadcrumb {
  label: string
  level: 1 | 2 | 3
  parent?: string
}

export function DrillDownChart({ title, subtitle, className }: DrillDownChartProps) {
  const [currentLevel, setCurrentLevel] = useState<1 | 2 | 3>(1)
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([
    { label: 'Cost Categories', level: 1 }
  ])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('')
  const [hoveredBar, setHoveredBar] = useState<string | null>(null)

  // Get current data based on level
  const getCurrentData = () => {
    if (currentLevel === 1) {
      return COST_DATA.level1
    } else if (currentLevel === 2) {
      return COST_DATA.level2[selectedCategory as keyof typeof COST_DATA.level2] || []
    } else {
      return COST_DATA.level3[selectedSubcategory as keyof typeof COST_DATA.level3] || []
    }
  }

  const currentData = getCurrentData()

  // Handle drill-down
  const handleBarClick = (entry: any) => {
    if (currentLevel === 1) {
      // Level 1 → Level 2
      setSelectedCategory(entry.name)
      setCurrentLevel(2)
      setBreadcrumbs([
        ...breadcrumbs,
        { label: entry.name, level: 2, parent: 'Cost Categories' }
      ])
    } else if (currentLevel === 2) {
      // Level 2 → Level 3
      setSelectedSubcategory(entry.name)
      setCurrentLevel(3)
      setBreadcrumbs([
        ...breadcrumbs,
        { label: entry.name, level: 3, parent: selectedCategory }
      ])
    }
  }

  // Navigate back
  const handleBreadcrumbClick = (index: number) => {
    const targetCrumb = breadcrumbs[index]
    setCurrentLevel(targetCrumb.level)
    setBreadcrumbs(breadcrumbs.slice(0, index + 1))

    if (targetCrumb.level === 1) {
      setSelectedCategory('')
      setSelectedSubcategory('')
    } else if (targetCrumb.level === 2) {
      setSelectedSubcategory('')
    }
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 shadow-sm">
          <p className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">{data.name}</p>
          <p className="text-sm font-bold text-blue-800 mb-1">
            ${(data.value / 1000).toFixed(1)}K
          </p>
          {data.percentage && (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {data.percentage}% of total
            </p>
          )}
          {data.detail && (
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {data.detail}
            </p>
          )}
          {data.efficiency && (
            <p className="text-sm font-medium text-emerald-600 mt-1">
              {data.efficiency}
            </p>
          )}
          {currentLevel < 3 && (
            <p className="text-xs text-blue-800 dark:text-blue-400 mt-2 font-medium">
              Click to drill down →
            </p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div className={cn("bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-3", className)}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">{title}</h3>
          {subtitle && (
            <p className="text-base text-slate-600 dark:text-slate-400">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 mb-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
        {breadcrumbs.map((crumb, index) => (
          <div key={index} className="flex items-center gap-2">
            <button
              onClick={() => handleBreadcrumbClick(index)}
              className={cn(
                "text-sm font-medium px-3 py-1.5 rounded-lg transition-all",
                index === breadcrumbs.length - 1
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              )}
            >
              {crumb.label}
            </button>
            {index < breadcrumbs.length - 1 && (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={currentData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            onClick={(data) => {
              if (data && data.activePayload && data.activePayload[0]) {
                handleBarClick(data.activePayload[0].payload)
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" className="dark:stroke-slate-700" />
            <XAxis
              dataKey="name"
              angle={-15}
              textAnchor="end"
              height={80}
              tick={{ fill: '#475569', fontSize: 14, fontWeight: 500 }}
              className="dark:fill-slate-400"
            />
            <YAxis
              tick={{ fill: '#475569', fontSize: 14, fontWeight: 500 }}
              className="dark:fill-slate-400"
              label={{
                value: 'Cost ($K)',
                angle: -90,
                position: 'insideLeft',
                fill: '#475569',
                fontSize: 14,
                fontWeight: 600
              }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
            />
            <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
            <Bar
              dataKey="value"
              radius={[4, 4, 0, 0]}
              onMouseEnter={(data) => setHoveredBar(data.name)}
              onMouseLeave={() => setHoveredBar(null)}
              cursor={currentLevel < 3 ? 'pointer' : 'default'}
            >
              {currentData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={'color' in entry && typeof entry.color === 'string' ? entry.color : '#2563EB'}
                  opacity={hoveredBar === null || hoveredBar === entry.name ? 1 : 0.5}
                  className="transition-opacity duration-200"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Level Indicator & Back Button */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600 dark:text-slate-400">
            Level {currentLevel} of 3
          </span>
          <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded">
            {currentLevel === 1 ? 'Categories' : currentLevel === 2 ? 'Subcategories' : 'Details'}
          </span>
        </div>
        {currentLevel > 1 && (
          <button
            onClick={() => handleBreadcrumbClick(breadcrumbs.length - 2)}
            className="flex items-center gap-2 px-2 py-2 text-sm font-medium text-blue-800 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to {breadcrumbs[breadcrumbs.length - 2]?.label}
          </button>
        )}
      </div>

      {/* Instruction */}
      {currentLevel < 3 && (
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 text-center">
          Click on any bar to drill down into details
        </p>
      )}
    </div>
  )
}
