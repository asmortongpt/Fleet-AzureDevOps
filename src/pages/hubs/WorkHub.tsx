import { Suspense, lazy, useState } from 'react'
import { HubLayout, HubPanel } from '@/components/layout/HubLayout'
import { Skeleton } from '@/components/ui/skeleton'
import { useFleetData } from '@/hooks/use-fleet-data'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Route,
  MapPin,
  CheckSquare,
  Clock,
  TrendingUp,
  Calendar,
  Navigation
} from 'lucide-react'

// Lazy load heavy components
const RouteManagement = lazy(() => import('@/components/modules/RouteManagement'))
const TaskManagement = lazy(() => import('@/components/modules/TaskManagement'))

/**
 * WorkHub - Routes, trips, and task management
 *
 * Combines:
 * - Routes list
 * - Trips list
 * - Tasks panel
 *
 * Primary use: Route planning, trip tracking, task management
 */
export default function WorkHub() {
  const fleetData = useFleetData()
  const [selectedTab, setSelectedTab] = useState<string>('overview')

  return (
    <HubLayout
      title="Work Management"
      description="Routes, trips, and task tracking"
    >
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="h-full flex flex-col">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="routes">Routes</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex-1 mt-6">
          <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Routes List */}
            <div>
              <HubPanel title="Active Routes" description="Today's scheduled routes">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    <RouteCard
                      routeId="R-101"
                      name="Downtown Delivery Loop"
                      driver="John Smith"
                      vehicle="101"
                      stops={12}
                      completed={8}
                      status="in-progress"
                    />
                    <RouteCard
                      routeId="R-102"
                      name="North Side Service"
                      driver="Jane Doe"
                      vehicle="205"
                      stops={8}
                      completed={8}
                      status="completed"
                    />
                    <RouteCard
                      routeId="R-103"
                      name="Airport Shuttle"
                      driver="Mike Johnson"
                      vehicle="312"
                      stops={6}
                      completed={2}
                      status="in-progress"
                    />
                  </div>
                </ScrollArea>
              </HubPanel>
            </div>

            {/* Trips List */}
            <div>
              <HubPanel title="Recent Trips" description="Last 24 hours">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    <TripCard
                      tripId="T-1523"
                      vehicle="101"
                      driver="John Smith"
                      start="8:45 AM"
                      end="11:30 AM"
                      distance="45.3 mi"
                      status="completed"
                    />
                    <TripCard
                      tripId="T-1524"
                      vehicle="205"
                      driver="Jane Doe"
                      start="9:15 AM"
                      end="2:45 PM"
                      distance="78.9 mi"
                      status="completed"
                    />
                    <TripCard
                      tripId="T-1525"
                      vehicle="312"
                      driver="Mike Johnson"
                      start="10:00 AM"
                      end="In Progress"
                      distance="23.1 mi"
                      status="in-progress"
                    />
                  </div>
                </ScrollArea>
              </HubPanel>
            </div>

            {/* Tasks Panel */}
            <div>
              <HubPanel title="Active Tasks" description="Today's work orders">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    <TaskCard
                      taskId="WO-456"
                      title="Vehicle Inspection"
                      assignee="Mike Johnson"
                      priority="high"
                      dueDate="Today, 4:00 PM"
                      status="in-progress"
                    />
                    <TaskCard
                      taskId="WO-457"
                      title="Fuel Card Reconciliation"
                      assignee="Sarah Williams"
                      priority="medium"
                      dueDate="Tomorrow"
                      status="pending"
                    />
                    <TaskCard
                      taskId="WO-458"
                      title="Tire Pressure Check"
                      assignee="John Smith"
                      priority="low"
                      dueDate="This Week"
                      status="pending"
                    />
                  </div>
                </ScrollArea>
              </HubPanel>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="routes" className="flex-1 mt-6">
          <Suspense fallback={<ContentSkeleton />}>
            <RouteManagement data={fleetData} />
          </Suspense>
        </TabsContent>

        <TabsContent value="tasks" className="flex-1 mt-6">
          <Suspense fallback={<ContentSkeleton />}>
            <TaskManagement />
          </Suspense>
        </TabsContent>
      </Tabs>
    </HubLayout>
  )
}

// Helper Components
interface RouteCardProps {
  routeId: string
  name: string
  driver: string
  vehicle: string
  stops: number
  completed: number
  status: 'pending' | 'in-progress' | 'completed'
}

function RouteCard({ routeId, name, driver, vehicle, stops, completed, status }: RouteCardProps) {
  const progress = (completed / stops) * 100

  return (
    <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Route className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{routeId}</span>
              </div>
              <p className="text-sm font-medium">{name}</p>
            </div>
            <StatusBadge status={status} />
          </div>

          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Driver: {driver}</span>
              <span>Vehicle: {vehicle}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Stops: {completed}/{stops}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
          </div>

          <div className="w-full bg-muted rounded-full h-1.5">
            <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface TripCardProps {
  tripId: string
  vehicle: string
  driver: string
  start: string
  end: string
  distance: string
  status: 'completed' | 'in-progress'
}

function TripCard({ tripId, vehicle, driver, start, end, distance, status }: TripCardProps) {
  return (
    <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Navigation className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{tripId}</span>
              </div>
              <p className="text-xs text-muted-foreground">Vehicle {vehicle} • {driver}</p>
            </div>
            <StatusBadge status={status} />
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">Start</p>
              <p className="font-medium">{start}</p>
            </div>
            <div>
              <p className="text-muted-foreground">End</p>
              <p className="font-medium">{end}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Distance</p>
              <p className="font-medium">{distance}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface TaskCardProps {
  taskId: string
  title: string
  assignee: string
  priority: 'low' | 'medium' | 'high'
  dueDate: string
  status: 'pending' | 'in-progress' | 'completed'
}

function TaskCard({ taskId, title, assignee, priority, dueDate, status }: TaskCardProps) {
  const priorityColors = {
    low: 'text-blue-500',
    medium: 'text-yellow-500',
    high: 'text-red-500'
  }

  return (
    <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-sm">{taskId}</span>
              </div>
              <p className="text-sm font-medium">{title}</p>
            </div>
            <Badge variant="outline" className={priorityColors[priority]}>
              {priority}
            </Badge>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Assignee: {assignee}</span>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{dueDate}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-7 text-xs flex-1">
              View Details
            </Button>
            {status !== 'completed' && (
              <Button size="sm" className="h-7 text-xs flex-1">
                Complete
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { variant: 'default' | 'secondary' | 'outline', label: string }> = {
    pending: { variant: 'secondary', label: 'Pending' },
    'in-progress': { variant: 'default', label: 'In Progress' },
    completed: { variant: 'outline', label: 'Completed' }
  }

  const config = variants[status] || variants.pending

  return <Badge variant={config.variant}>{config.label}</Badge>
}

function ContentSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
