/**
 * LaborDetailsView - Level 3 drilldown for labor details
 * Shows detailed labor breakdown with technician hours and rates
 */

import React from 'react'
import { DrilldownContent } from '@/components/DrilldownPanel'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import useSWR from 'swr'
import { Users, Clock, DollarSign, Calendar } from 'lucide-react'

interface LaborDetailsViewProps {
  workOrderId: string
  workOrderNumber?: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function LaborDetailsView({ workOrderId, workOrderNumber }: LaborDetailsViewProps) {
  const { data: labor, error, isLoading, mutate } = useSWR(
    `/api/work-orders/${workOrderId}/labor`,
    fetcher
  )

  const totalHours = labor?.reduce((sum: number, entry: any) => sum + (entry.hours || 0), 0) || 0
  const totalCost = labor?.reduce((sum: number, entry: any) => sum + ((entry.hours * entry.rate) || 0), 0) || 0

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase()
  }

  return (
    <DrilldownContent loading={isLoading} error={error} onRetry={() => mutate()}>
      {labor && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">
              Labor Details {workOrderNumber && `for WO #${workOrderNumber}`}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {labor.length} technician{labor.length !== 1 ? 's' : ''} • {totalHours.toFixed(1)} hrs • ${totalCost.toFixed(2)}
            </p>
          </div>

          {labor.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">No labor entries recorded</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {labor.map((entry: any) => (
                <Card key={entry.id}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={entry.technician_avatar} alt={entry.technician_name} />
                            <AvatarFallback>{getInitials(entry.technician_name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{entry.technician_name}</p>
                            <p className="text-sm text-muted-foreground">{entry.role || 'Technician'}</p>
                          </div>
                        </div>
                        {entry.certified && (
                          <Badge variant="success">Certified</Badge>
                        )}
                      </div>

                      {entry.task_description && (
                        <p className="text-sm text-muted-foreground pl-12">
                          {entry.task_description}
                        </p>
                      )}

                      <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                        <div>
                          <p className="text-xs text-muted-foreground">Hours</p>
                          <p className="font-medium">{entry.hours?.toFixed(1) || '0.0'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Rate</p>
                          <p className="font-medium">${entry.rate?.toFixed(2) || '0.00'}/hr</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total</p>
                          <p className="font-medium text-primary">
                            ${((entry.hours * entry.rate) || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {entry.date && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(entry.date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Hours</span>
                  <span className="font-semibold">{totalHours.toFixed(1)} hrs</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="font-semibold">Total Labor Cost</span>
                  <span className="text-2xl font-bold text-primary">
                    ${totalCost.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DrilldownContent>
  )
}
