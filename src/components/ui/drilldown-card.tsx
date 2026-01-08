/**
 * DrilldownCard - Interactive Data Visualization with Deep Drilldown
 *
 * Provides multi-level data exploration with breadcrumb navigation,
 * allowing users to drill from summary to detail level.
 *
 * Features:
 * - Breadcrumb navigation for drill path
 * - Smooth transitions between levels
 * - Back/forward navigation
 * - Export functionality at any level
 * - Responsive design with charts and tables
 *
 * Created: 2026-01-08
 */

import { ArrowLeft, ChevronRight, Download, ExternalLink } from 'lucide-react'
import React, { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SmartTooltip } from '@/components/ui/smart-tooltip'
import { cn } from '@/lib/utils'

export interface DrilldownLevel {
  id: string
  title: string
  description?: string
  component: React.ReactNode
  metadata?: {
    count?: number
    total?: string
    lastUpdated?: string
  }
}

interface DrilldownCardProps {
  levels: DrilldownLevel[]
  initialLevel?: string
  onLevelChange?: (levelId: string) => void
  onExport?: (levelId: string) => void
  className?: string
  showExport?: boolean
}

/**
 * DrilldownCard - Deep data exploration with breadcrumb navigation
 *
 * @example
 * <DrilldownCard
 *   levels={[
 *     {
 *       id: 'overview',
 *       title: 'Fleet Overview',
 *       description: 'All vehicles across your fleet',
 *       component: <FleetSummaryChart />,
 *       metadata: { count: 156, total: '156 vehicles' }
 *     },
 *     {
 *       id: 'region',
 *       title: 'By Region',
 *       description: 'Vehicles grouped by region',
 *       component: <RegionBreakdown />
 *     },
 *     {
 *       id: 'details',
 *       title: 'Vehicle Details',
 *       description: 'Individual vehicle information',
 *       component: <VehicleTable />
 *     }
 *   ]}
 *   onExport={(level) => exportData(level)}
 *   showExport
 * />
 */
export function DrilldownCard({
  levels,
  initialLevel,
  onLevelChange,
  onExport,
  className,
  showExport = false,
}: DrilldownCardProps) {
  const [levelHistory, setLevelHistory] = useState<string[]>([
    initialLevel || levels[0]?.id || '',
  ])

  const currentLevelId = levelHistory[levelHistory.length - 1]
  const currentLevel = levels.find((l) => l.id === currentLevelId)
  const currentIndex = levels.findIndex((l) => l.id === currentLevelId)

  const drillDown = (levelId: string) => {
    setLevelHistory((prev) => [...prev, levelId])
    onLevelChange?.(levelId)
  }

  const drillUp = () => {
    if (levelHistory.length > 1) {
      const newHistory = levelHistory.slice(0, -1)
      setLevelHistory(newHistory)
      onLevelChange?.(newHistory[newHistory.length - 1])
    }
  }

  const jumpToLevel = (index: number) => {
    const newHistory = levelHistory.slice(0, index + 1)
    setLevelHistory(newHistory)
    onLevelChange?.(newHistory[newHistory.length - 1])
  }

  const handleExport = () => {
    if (currentLevelId && onExport) {
      onExport(currentLevelId)
    }
  }

  if (!currentLevel) {
    return null
  }

  return (
    <Card className={cn('relative', className)}>
      <CardHeader>
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            {levelHistory.length > 1 && (
              <SmartTooltip content="Go back to previous level">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={drillUp}
                  className="h-7 w-7 p-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </SmartTooltip>
            )}

            <nav aria-label="Drilldown breadcrumb" className="flex items-center gap-1">
              {levelHistory.map((historyLevelId, index) => {
                const level = levels.find((l) => l.id === historyLevelId)
                if (!level) return null

                const isLast = index === levelHistory.length - 1

                return (
                  <React.Fragment key={historyLevelId}>
                    {index > 0 && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <button
                      onClick={() => jumpToLevel(index)}
                      disabled={isLast}
                      className={cn(
                        'text-sm font-medium transition-colors',
                        isLast
                          ? 'text-foreground cursor-default'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {level.title}
                    </button>
                  </React.Fragment>
                )
              })}
            </nav>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {currentLevel.metadata?.count !== undefined && (
              <Badge variant="secondary" className="text-xs">
                {currentLevel.metadata.count} items
              </Badge>
            )}

            {showExport && onExport && (
              <SmartTooltip content={`Export ${currentLevel.title} data`}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="h-8"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </SmartTooltip>
            )}
          </div>
        </div>

        {/* Level Title */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-xl">{currentLevel.title}</CardTitle>
            {currentLevel.description && (
              <CardDescription className="mt-1">
                {currentLevel.description}
              </CardDescription>
            )}
          </div>
        </div>

        {/* Metadata */}
        {currentLevel.metadata && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
            {currentLevel.metadata.total && (
              <span>{currentLevel.metadata.total}</span>
            )}
            {currentLevel.metadata.lastUpdated && (
              <span>Updated {currentLevel.metadata.lastUpdated}</span>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* Dynamic Content */}
        <div className="transition-all duration-200">
          {currentLevel.component}
        </div>

        {/* Navigation Hints */}
        {currentIndex < levels.length - 1 && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Click on items above to drill down into {levels[currentIndex + 1]?.title.toLowerCase()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * DrilldownProvider - Context for managing drilldown state across components
 *
 * Use this when you need drilldown functionality across multiple
 * cards or components on the same page.
 *
 * @example
 * <DrilldownProvider>
 *   <DrilldownCard levels={fleetLevels} />
 *   <DrilldownCard levels={maintenanceLevels} />
 * </DrilldownProvider>
 */
interface DrilldownContextValue {
  drillTo: (levelId: string) => void
  currentLevel: string
  breadcrumb: string[]
}

const DrilldownContext = React.createContext<DrilldownContextValue | null>(null)

export function DrilldownProvider({ children }: { children: React.ReactNode }) {
  const [breadcrumb, setBreadcrumb] = useState<string[]>(['overview'])

  const drillTo = (levelId: string) => {
    setBreadcrumb((prev) => [...prev, levelId])
  }

  return (
    <DrilldownContext.Provider
      value={{
        drillTo,
        currentLevel: breadcrumb[breadcrumb.length - 1],
        breadcrumb,
      }}
    >
      {children}
    </DrilldownContext.Provider>
  )
}

export function useDrilldown() {
  const context = React.useContext(DrilldownContext)
  if (!context) {
    throw new Error('useDrilldown must be used within DrilldownProvider')
  }
  return context
}
