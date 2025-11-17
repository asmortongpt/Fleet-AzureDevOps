/**
 * DriverDetailPanel - Level 2 drilldown for driver details
 * Shows comprehensive driver information, certifications, and stats
 */

import React from 'react'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { DrilldownContent } from '@/components/DrilldownPanel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import useSWR from 'swr'
import {
  User,
  Phone,
  Mail,
  Calendar,
  Award,
  TrendingUp,
  Shield,
  Activity,
  Route,
  AlertTriangle,
} from 'lucide-react'

interface DriverDetailPanelProps {
  driverId: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function DriverDetailPanel({ driverId }: DriverDetailPanelProps) {
  const { push } = useDrilldown()
  const { data: driver, error, isLoading, mutate } = useSWR(
    `/api/drivers/${driverId}`,
    fetcher
  )

  const handleViewPerformance = () => {
    push({
      id: `driver-performance-${driverId}`,
      type: 'driver-performance',
      label: 'Performance Metrics',
      data: { driverId, driverName: driver?.name },
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  return (
    <DrilldownContent loading={isLoading} error={error} onRetry={() => mutate()}>
      {driver && (
        <div className="space-y-6">
          {/* Driver Header */}
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={driver.avatar_url} alt={driver.name} />
              <AvatarFallback>{getInitials(driver.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <h3 className="text-2xl font-bold">{driver.name}</h3>
              <p className="text-sm text-muted-foreground">
                Employee ID: {driver.employee_id || 'N/A'}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={driver.status === 'active' ? 'success' : 'secondary'}>
                  {driver.status}
                </Badge>
                {driver.verified && (
                  <Badge variant="outline" className="gap-1">
                    <Shield className="h-3 w-3" />
                    Verified
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
                <span className="text-sm">{driver.email || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{driver.phone || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Joined {driver.hire_date ? new Date(driver.hire_date).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Performance Score */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Safety Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{driver.safety_score || 0}%</div>
                <Progress value={driver.safety_score || 0} className="mt-2" />
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
                <div className="text-2xl font-bold">
                  {driver.performance_score || 0}%
                </div>
                <Progress value={driver.performance_score || 0} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Driver Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Miles</p>
                  <p className="text-xl font-bold">
                    {driver.total_miles?.toLocaleString() || '0'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Trips</p>
                  <p className="text-xl font-bold">
                    {driver.total_trips?.toLocaleString() || '0'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hours Driven</p>
                  <p className="text-xl font-bold">
                    {driver.total_hours?.toLocaleString() || '0'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Incidents</p>
                  <p className="text-xl font-bold">{driver.incident_count || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Certifications */}
          {driver.certifications && driver.certifications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Certifications & Licenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {driver.certifications.map((cert: any, idx: number) => (
                    <li key={idx} className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-sm font-medium">{cert.name}</p>
                          {cert.number && (
                            <p className="text-xs text-muted-foreground">
                              #{cert.number}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          Expires:{' '}
                          {cert.expiry_date
                            ? new Date(cert.expiry_date).toLocaleDateString()
                            : 'N/A'}
                        </p>
                        {cert.expiry_date &&
                          new Date(cert.expiry_date) < new Date() && (
                            <Badge variant="destructive" className="mt-1">
                              Expired
                            </Badge>
                          )}
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Recent Violations */}
          {driver.violations && driver.violations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Recent Violations ({driver.violations.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {driver.violations.map((violation: any, idx: number) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 p-2 rounded bg-destructive/10"
                    >
                      <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{violation.type}</p>
                        <p className="text-xs text-muted-foreground">
                          {violation.date
                            ? new Date(violation.date).toLocaleDateString()
                            : 'N/A'}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
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
                  data: { driverId, driverName: driver.name },
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
