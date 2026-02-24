/**
 * DriverDetailPanel - Level 2 drilldown for driver details
 * Shows comprehensive driver information, certifications, and stats
 */

import {
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  Shield,
  Activity,
  Route,
  AlertTriangle,
} from 'lucide-react'
import useSWR from 'swr'

import { DrilldownContent } from '@/components/DrilldownPanel'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { apiFetcher } from '@/lib/api-fetcher'
import { formatEnum } from '@/utils/format-enum'
import { formatDate } from '@/utils/format-helpers'

interface DriverDetailPanelProps {
  driverId: string
}

interface DriverData {
  first_name?: string
  last_name?: string
  status: string
  email?: string
  phone?: string
  hire_date?: string
  safety_score?: number | string
  performance_score?: number | string
  license_number?: string
  license_state?: string
  license_expiry_date?: string
  cdl?: boolean
  cdl_class?: string | null
  role?: string
  department?: string
  emergency_contact_name?: string | null
  emergency_contact_phone?: string | null
}

export function DriverDetailPanel({ driverId }: DriverDetailPanelProps) {
  const { push } = useDrilldown()
  const { data: driver, error, isLoading, mutate } = useSWR<DriverData>(
    `/api/drivers/${driverId}`,
    apiFetcher
  )

  const driverName = driver
    ? `${driver.first_name || ''} ${driver.last_name || ''}`.trim() || 'Unknown'
    : 'Unknown'

  const handleViewPerformance = () => {
    push({
      id: `driver-performance-${driverId}`,
      type: 'driver-performance',
      label: 'Performance Metrics',
      data: { driverId, driverName },
    })
  }

  const getInitials = (name: string) => {
    if (!name) return '??'
    return name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  return (
    <DrilldownContent loading={isLoading} error={error} onRetry={() => mutate()}>
      {driver && (
        <div className="space-y-2">
          {/* Driver Header */}
          <div className="flex items-start gap-2">
            <Avatar className="h-20 w-20">
              <AvatarFallback>{getInitials(driverName)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <h3 className="text-sm font-bold">{driverName}</h3>
              <p className="text-sm text-muted-foreground">
                {driver.role || 'Driver'} · {driver.department || '—'}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={driver.status === 'active' ? 'default' : 'secondary'}>
                  {formatEnum(driver.status)}
                </Badge>
                {driver.cdl && (
                  <Badge variant="outline" className="gap-1">
                    <Shield className="h-3 w-3" />
                    CDL {driver.cdl_class || ''}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{driver.email || '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{driver.phone || '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Joined {formatDate(driver.hire_date)}
                </span>
              </div>
              {driver.license_number && (
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    License: {driver.license_number} ({driver.license_state})
                    {driver.license_expiry_date && ` · Exp: ${formatDate(driver.license_expiry_date)}`}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Score */}
          <div className="grid grid-cols-2 gap-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Safety Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold">{Number(driver.safety_score) || 0}%</div>
                <Progress value={Number(driver.safety_score) || 0} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold">
                  {Number(driver.performance_score) || 0}%
                </div>
                <Progress value={Number(driver.performance_score) || 0} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Emergency Contact */}
          {driver.emergency_contact_name && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm font-medium">{driver.emergency_contact_name}</p>
                {driver.emergency_contact_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{driver.emergency_contact_phone}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={handleViewPerformance} className="w-full">
              <TrendingUp className="h-4 w-4 mr-2" />
              View Performance
            </Button>
            <Button
              onClick={() =>
                push({
                  id: `driver-trips-${driverId}`,
                  type: 'driver-trips',
                  label: 'Trip History',
                  data: { driverId, driverName },
                })
              }
              variant="outline"
              className="w-full"
            >
              <Route className="h-4 w-4 mr-2" />
              View Trips
            </Button>
          </div>
        </div>
      )}
    </DrilldownContent>
  )
}