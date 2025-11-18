/**
 * PartsBreakdownView - Level 3 drilldown for parts breakdown
 * Shows detailed parts list with costs and ability to drill into item history
 */

import React from 'react'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { DrilldownContent } from '@/components/DrilldownPanel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import useSWR from 'swr'
import { Package, CurrencyDollar, Hash, ArrowRight, TrendingUp } from 'lucide-react'

interface PartsBreakdownViewProps {
  workOrderId: string
  workOrderNumber?: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function PartsBreakdownView({ workOrderId, workOrderNumber }: PartsBreakdownViewProps) {
  const { push } = useDrilldown()
  const { data: parts, error, isLoading, mutate } = useSWR(
    `/api/work-orders/${workOrderId}/parts`,
    fetcher
  )

  const handleViewItemHistory = (part: any) => {
    push({
      id: `part-history-${part.id}`,
      type: 'part-history',
      label: part.name,
      data: { partId: part.id, part },
    })
  }

  const totalCost = parts?.reduce((sum: number, part: any) => sum + (part.quantity * part.unit_cost || 0), 0) || 0

  return (
    <DrilldownContent loading={isLoading} error={error} onRetry={() => mutate()}>
      {parts && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">
              Parts Breakdown {workOrderNumber && `for WO #${workOrderNumber}`}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {parts.length} item{parts.length !== 1 ? 's' : ''} • Total: ${totalCost.toFixed(2)}
            </p>
          </div>

          {parts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">No parts recorded</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {parts.map((part: any) => (
                <Card
                  key={part.id}
                  className="hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => handleViewItemHistory(part)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-muted-foreground" />
                            <span className="font-medium">{part.name}</span>
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </div>

                        {part.part_number && (
                          <div className="flex items-center gap-2 text-sm">
                            <Hash className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{part.part_number}</span>
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                          <div>
                            <p className="text-xs text-muted-foreground">Quantity</p>
                            <p className="font-medium">{part.quantity}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Unit Cost</p>
                            <p className="font-medium">${part.unit_cost?.toFixed(2) || '0.00'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Total</p>
                            <p className="font-medium text-primary">
                              ${((part.quantity * part.unit_cost) || 0).toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {part.supplier && (
                          <p className="text-xs text-muted-foreground pt-2 border-t">
                            Supplier: {part.supplier}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Total Parts Cost</span>
                <span className="text-2xl font-bold text-primary">
                  ${totalCost.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DrilldownContent>
  )
}
