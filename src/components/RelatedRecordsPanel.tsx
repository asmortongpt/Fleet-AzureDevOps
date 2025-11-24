/**
 * Related Records Panel
 * Displays connected entities for any record with bidirectional navigation
 *
 * Use this component in any detail view to show:
 * - Assigned drivers/vehicles
 * - Related work orders
 * - Maintenance history
 * - Fuel transactions
 * - Parts used
 * - Linked documents
 *
 * Created: 2025-11-23
 */

import React, { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Car, User, Wrench, GasPump, Package, FileText,
  ArrowRight, CaretRight, Link as LinkIcon, Stack,
  Warning, Clock, CurrencyDollar, MapPin, Truck
} from '@phosphor-icons/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  useEntityLinking,
  EntityType,
  EntityReference,
  LinkedEntities
} from '@/contexts/EntityLinkingContext'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES
// ============================================================================

interface RelatedRecordsPanelProps {
  entityType: EntityType
  entityId: string
  title?: string
  className?: string
  compact?: boolean
  showCounts?: boolean
  maxItemsPerSection?: number
  excludeTypes?: EntityType[]
  onNavigate?: (ref: EntityReference) => void
}

interface SectionConfig {
  type: EntityType
  key: keyof LinkedEntities
  label: string
  icon: React.ElementType
  color: string
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline'
}

// ============================================================================
// SECTION CONFIGURATION
// ============================================================================

const SECTION_CONFIGS: SectionConfig[] = [
  { type: 'vehicle', key: 'vehicles', label: 'Vehicles', icon: Car, color: 'text-blue-500', badgeVariant: 'default' },
  { type: 'driver', key: 'drivers', label: 'Drivers', icon: User, color: 'text-green-500', badgeVariant: 'secondary' },
  { type: 'work-order', key: 'workOrders', label: 'Work Orders', icon: Wrench, color: 'text-orange-500', badgeVariant: 'outline' },
  { type: 'maintenance', key: 'maintenanceRecords', label: 'Maintenance', icon: Clock, color: 'text-purple-500', badgeVariant: 'secondary' },
  { type: 'fuel', key: 'fuelTransactions', label: 'Fuel', icon: GasPump, color: 'text-amber-500', badgeVariant: 'outline' },
  { type: 'part', key: 'parts', label: 'Parts', icon: Package, color: 'text-cyan-500', badgeVariant: 'secondary' },
  { type: 'vendor', key: 'vendors', label: 'Vendors', icon: Truck, color: 'text-indigo-500', badgeVariant: 'outline' },
  { type: 'invoice', key: 'invoices', label: 'Invoices', icon: CurrencyDollar, color: 'text-emerald-500', badgeVariant: 'default' },
  { type: 'asset', key: 'assets', label: 'Assets', icon: Stack, color: 'text-slate-500', badgeVariant: 'secondary' },
  { type: 'alert', key: 'alerts', label: 'Alerts', icon: Warning, color: 'text-red-500', badgeVariant: 'destructive' },
  { type: 'document', key: 'documents', label: 'Documents', icon: FileText, color: 'text-gray-500', badgeVariant: 'outline' },
  { type: 'facility', key: 'facilities', label: 'Facilities', icon: MapPin, color: 'text-teal-500', badgeVariant: 'secondary' }
]

// ============================================================================
// RELATED RECORD ITEM
// ============================================================================

interface RelatedRecordItemProps {
  reference: EntityReference
  config: SectionConfig
  compact?: boolean
  onNavigate: (ref: EntityReference) => void
}

function RelatedRecordItem({ reference, config, compact, onNavigate }: RelatedRecordItemProps) {
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 4 }}
      onClick={() => onNavigate(reference)}
      className={cn(
        "flex items-center gap-3 p-2 rounded-md cursor-pointer",
        "hover:bg-muted/50 transition-all group border border-transparent",
        "hover:border-primary/20"
      )}
    >
      <div className={cn("p-1.5 rounded-md bg-muted", config.color)}>
        <Icon className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-medium truncate group-hover:text-primary transition-colors",
          compact ? "text-xs" : "text-sm"
        )}>
          {reference.label}
        </p>
        {reference.data?.status && !compact && (
          <p className="text-xs text-muted-foreground capitalize">
            {reference.data.status}
          </p>
        )}
      </div>

      <CaretRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  )
}

// ============================================================================
// RELATED RECORDS SECTION
// ============================================================================

interface RelatedRecordsSectionProps {
  config: SectionConfig
  items: EntityReference[]
  maxItems: number
  compact?: boolean
  onNavigate: (ref: EntityReference) => void
  onViewAll: () => void
}

function RelatedRecordsSection({
  config,
  items,
  maxItems,
  compact,
  onNavigate,
  onViewAll
}: RelatedRecordsSectionProps) {
  const Icon = config.icon
  const displayItems = items.slice(0, maxItems)
  const hasMore = items.length > maxItems

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn("w-4 h-4", config.color)} />
          <span className="text-sm font-medium">{config.label}</span>
          <Badge variant={config.badgeVariant} className="text-xs">
            {items.length}
          </Badge>
        </div>
        {hasMore && (
          <Button variant="ghost" size="sm" onClick={onViewAll} className="h-6 text-xs">
            View all
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        )}
      </div>

      <div className="space-y-1">
        <AnimatePresence mode="popLayout">
          {displayItems.map((item, index) => (
            <RelatedRecordItem
              key={`${item.type}-${item.id}-${index}`}
              reference={item}
              config={config}
              compact={compact}
              onNavigate={onNavigate}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function RelatedRecordsPanel({
  entityType,
  entityId,
  title = 'Related Records',
  className,
  compact = false,
  showCounts = true,
  maxItemsPerSection = 5,
  excludeTypes = [],
  onNavigate: customNavigate
}: RelatedRecordsPanelProps) {
  const { getLinkedEntities, navigateToEntity, navigateToRelated } = useEntityLinking()

  const linkedEntities = useMemo(() =>
    getLinkedEntities(entityType, entityId),
    [entityType, entityId, getLinkedEntities]
  )

  const handleNavigate = (ref: EntityReference) => {
    if (customNavigate) {
      customNavigate(ref)
    } else {
      navigateToEntity(ref)
    }
  }

  const handleViewAll = (targetType: EntityType) => {
    navigateToRelated(entityType, entityId, targetType)
  }

  // Filter sections to only show those with items
  const activeSections = useMemo(() => {
    return SECTION_CONFIGS.filter(config => {
      if (excludeTypes.includes(config.type)) return false
      const items = linkedEntities[config.key]
      return items && items.length > 0
    })
  }, [linkedEntities, excludeTypes])

  // Calculate total count
  const totalCount = useMemo(() => {
    return activeSections.reduce((sum, config) => {
      return sum + (linkedEntities[config.key]?.length || 0)
    }, 0)
  }, [activeSections, linkedEntities])

  if (activeSections.length === 0) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardContent className="p-6 text-center">
          <LinkIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No related records found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <LinkIcon className="w-4 h-4" />
            {title}
          </CardTitle>
          {showCounts && (
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="secondary" className="text-xs">
                  {totalCount} linked
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs space-y-1">
                  {activeSections.map(config => (
                    <div key={config.type} className="flex justify-between gap-4">
                      <span>{config.label}:</span>
                      <span className="font-medium">{linkedEntities[config.key]?.length || 0}</span>
                    </div>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className={compact ? "h-[300px]" : "h-[400px]"}>
          <div className="p-4 space-y-4">
            {activeSections.map((config, index) => (
              <React.Fragment key={config.type}>
                {index > 0 && <Separator />}
                <RelatedRecordsSection
                  config={config}
                  items={linkedEntities[config.key] || []}
                  maxItems={maxItemsPerSection}
                  compact={compact}
                  onNavigate={handleNavigate}
                  onViewAll={() => handleViewAll(config.type)}
                />
              </React.Fragment>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// COMPACT INLINE VERSION
// ============================================================================

interface RelatedRecordsInlineProps {
  entityType: EntityType
  entityId: string
  types?: EntityType[]
  maxItems?: number
  className?: string
}

export function RelatedRecordsInline({
  entityType,
  entityId,
  types = ['driver', 'vehicle', 'work-order'],
  maxItems = 3,
  className
}: RelatedRecordsInlineProps) {
  const { getLinkedEntities, navigateToEntity } = useEntityLinking()

  const linkedEntities = useMemo(() =>
    getLinkedEntities(entityType, entityId),
    [entityType, entityId, getLinkedEntities]
  )

  const relevantConfigs = SECTION_CONFIGS.filter(c => types.includes(c.type))

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {relevantConfigs.map(config => {
        const items = linkedEntities[config.key] || []
        if (items.length === 0) return null

        const Icon = config.icon
        const displayItems = items.slice(0, maxItems)

        return (
          <div key={config.type} className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-md bg-muted",
                  "cursor-pointer hover:bg-muted/80 transition-colors"
                )}>
                  <Icon className={cn("w-3 h-3", config.color)} />
                  <span className="text-xs">{items.length}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs space-y-1">
                  <p className="font-medium">{config.label}</p>
                  {displayItems.map((item, i) => (
                    <div
                      key={i}
                      onClick={() => navigateToEntity(item)}
                      className="cursor-pointer hover:text-primary"
                    >
                      {item.label}
                    </div>
                  ))}
                  {items.length > maxItems && (
                    <p className="text-muted-foreground">
                      +{items.length - maxItems} more
                    </p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        )
      })}
    </div>
  )
}

export default RelatedRecordsPanel
