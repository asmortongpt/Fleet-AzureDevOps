/**
 * PeopleCommunicationHub - Consolidated People & Communication Dashboard
 *
 * Consolidates:
 * - PeopleHub (HR, team management, employee data)
 * - CommunicationHub (messaging, notifications, announcements)
 * - WorkHub (tasks, schedules, collaboration)
 *
 * Features:
 * - Team and employee management
 * - Internal communication and messaging
 * - Task and schedule coordination
 * - Collaboration tools
 * - WCAG 2.1 AA accessibility
 * - Performance optimized
 */

import { useState, Suspense, lazy, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  MessageSquare,
  Briefcase,
  User,
  Mail,
  Phone,
  Calendar,
  CheckSquare,
  Bell,
  Send,
  Inbox,
  UserPlus,
  UserCheck,
  UserX,
  Clock,
  Award,
  Target,
  TrendingUp,
  AlertCircle,
  FileText,
  Video,
  Hash,
  Megaphone,
  Activity,
  BookOpen
} from 'lucide-react'
import HubPage from '@/components/ui/hub-page'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import logger from '@/utils/logger';
import {
  StatCard,
  ResponsiveBarChart,
  ResponsiveLineChart,
  ResponsivePieChart,
} from '@/components/visualizations'

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const fadeInVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

const staggerContainerVariant = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

// ============================================================================
// TAB CONTENT COMPONENTS
// ============================================================================

/**
 * People Tab - HR and team management
 */
const PeopleTabContent = memo(function PeopleTabContent() {
  return (
    <motion.div
      variants={staggerContainerVariant}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* People Statistics */}
      <motion.div variants={fadeInVariant} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Employees"
          value={127}
          icon={Users}
          change={8}
  trend="up"
          description="Active team members"
        />
        <StatCard
          title="On Duty"
          value={94}
          icon={UserCheck}
          change={5}
  trend="up"
          description="Currently working"
        />
        <StatCard
          title="On Leave"
          value={12}
          icon={UserX}
          description="PTO/vacation"
        />
        <StatCard
          title="Avg Tenure"
          value="3.2 yrs"
          icon={Award}
          trend={{ value: 0.4, isPositive: true }}
          description="Employee retention"
        />
      </motion.div>

      {/* Team Overview */}
      <motion.div variants={fadeInVariant}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Overview
            </CardTitle>
            <CardDescription>Department breakdown and headcount</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { department: 'Operations', headcount: 45, manager: 'John Smith', status: 'full' },
                { department: 'Maintenance', headcount: 32, manager: 'Jane Doe', status: 'full' },
                { department: 'Safety & Compliance', headcount: 18, manager: 'Bob Johnson', status: 'hiring' },
                { department: 'Administration', headcount: 15, manager: 'Alice Williams', status: 'full' },
                { department: 'Finance', headcount: 12, manager: 'Charlie Brown', status: 'full' },
                { department: 'IT & Analytics', headcount: 5, manager: 'David Lee', status: 'hiring' },
              ].map((dept) => (
                <div key={dept.department} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-semibold">{dept.department}</p>
                      <p className="text-sm text-muted-foreground">
                        Manager: {dept.manager} · {dept.headcount} employees
                      </p>
                    </div>
                  </div>
                  <Badge variant={dept.status === 'full' ? 'default' : 'secondary'}>
                    {dept.status === 'full' ? 'Fully Staffed' : 'Hiring'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={fadeInVariant} className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest HR updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { type: 'New Hire', name: 'Sarah Connor', department: 'Operations', date: '2026-01-28' },
                { type: 'Promotion', name: 'Mike Ross', department: 'Maintenance', date: '2026-01-25' },
                { type: 'Training Complete', name: 'Emily Davis', department: 'Safety', date: '2026-01-22' },
                { type: 'Anniversary', name: 'Tom Hardy', department: '5 years', date: '2026-01-20' },
              ].map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  <UserPlus className="h-5 w-5 text-green-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">{activity.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.name} · {activity.department}
                    </p>
                    <p className="text-xs text-muted-foreground">{activity.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Training & Development
            </CardTitle>
            <CardDescription>Ongoing training programs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { program: 'Safety Certification', enrolled: 45, completed: 38 },
                { program: 'Leadership Development', enrolled: 12, completed: 8 },
                { program: 'Technical Skills', enrolled: 28, completed: 22 },
                { program: 'Customer Service', enrolled: 35, completed: 35 },
              ].map((training) => (
                <div key={training.program} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{training.program}</p>
                    <p className="text-sm text-muted-foreground">
                      {training.completed}/{training.enrolled} ({Math.round((training.completed / training.enrolled) * 100)}%)
                    </p>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2 transition-all"
                      style={{ width: `${(training.completed / training.enrolled) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
})

/**
 * Communication Tab - Messaging and announcements
 */
const CommunicationTabContent = memo(function CommunicationTabContent() {
  return (
    <motion.div
      variants={staggerContainerVariant}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Communication Statistics */}
      <motion.div variants={fadeInVariant} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Unread Messages"
          value={24}
          icon={Inbox}
          description="Team inbox"
        />
        <StatCard
          title="Active Channels"
          value={12}
          icon={Hash}
          change={2}
  trend="up"
          description="Communication channels"
        />
        <StatCard
          title="Announcements"
          value={3}
          icon={Megaphone}
          description="This week"
        />
        <StatCard
          title="Response Time"
          value="<2 hrs"
          icon={Clock}
          change={15}
  trend="up"
          description="Avg response"
        />
      </motion.div>

      {/* Recent Messages */}
      <motion.div variants={fadeInVariant} className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Recent Messages
            </CardTitle>
            <CardDescription>Latest team communications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { from: 'John Smith', message: 'Vehicle 1234 maintenance scheduled for tomorrow', time: '10 min ago', unread: true },
                { from: 'Jane Doe', message: 'Weekly safety meeting rescheduled to 2pm', time: '1 hour ago', unread: true },
                { from: 'Bob Johnson', message: 'New compliance training materials available', time: '3 hours ago', unread: false },
                { from: 'Alice Williams', message: 'Fuel report for January is ready for review', time: 'Yesterday', unread: false },
              ].map((msg, index) => (
                <div key={index} className={`flex items-start gap-3 p-3 border rounded-lg ${msg.unread ? 'bg-blue-50 dark:bg-blue-950' : ''}`}>
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{msg.from}</p>
                      {msg.unread && <Badge variant="default">New</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{msg.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{msg.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Announcements
            </CardTitle>
            <CardDescription>Company-wide notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { title: 'Safety Week: January 27-31', type: 'Event', date: '2026-01-27' },
                { title: 'New Compliance Policy Effective Feb 1', type: 'Policy', date: '2026-01-25' },
                { title: 'Q4 Performance Bonuses Announced', type: 'HR', date: '2026-01-20' },
              ].map((announcement, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary">{announcement.type}</Badge>
                    <p className="text-xs text-muted-foreground">{announcement.date}</p>
                  </div>
                  <p className="font-medium">{announcement.title}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Communication Channels */}
      <motion.div variants={fadeInVariant}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Communication Channels
            </CardTitle>
            <CardDescription>Team channels and groups</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                { name: 'general', members: 127, unread: 5 },
                { name: 'operations', members: 45, unread: 2 },
                { name: 'maintenance', members: 32, unread: 0 },
                { name: 'safety-alerts', members: 127, unread: 1 },
                { name: 'dispatch', members: 28, unread: 8 },
                { name: 'management', members: 12, unread: 0 },
              ].map((channel) => (
                <div key={channel.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">#{channel.name}</p>
                      <p className="text-sm text-muted-foreground">{channel.members} members</p>
                    </div>
                  </div>
                  {channel.unread > 0 && (
                    <Badge variant="destructive">{channel.unread}</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
})

/**
 * Work Tab - Tasks, schedules, and collaboration
 */
const WorkTabContent = memo(function WorkTabContent() {
  // Handler for joining meetings
  const handleJoinMeeting = (eventName: string) => {
    toast.success(`Joining meeting: ${eventName}`)
    logger.info('Join meeting clicked:', eventName)
    // TODO: Add real meeting join functionality (Teams/Outlook integration)
  }

  return (
    <motion.div
      variants={staggerContainerVariant}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Work Statistics */}
      <motion.div variants={fadeInVariant} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Tasks"
          value={48}
          icon={CheckSquare}
          change={6}
  trend="down"
          description="Assigned to team"
        />
        <StatCard
          title="Completed This Week"
          value={32}
          icon={Target}
          change={12}
  trend="up"
          description="Task completion"
        />
        <StatCard
          title="Upcoming Deadlines"
          value={15}
          icon={Calendar}
          description="Next 7 days"
          variant="warning"
        />
        <StatCard
          title="Team Productivity"
          value="92%"
          icon={TrendingUp}
          change={5}
  trend="up"
          description="Task completion rate"
        />
      </motion.div>

      {/* Task Board */}
      <motion.div variants={fadeInVariant}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Task Board
            </CardTitle>
            <CardDescription>Team tasks organized by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  status: 'To Do',
                  count: 18,
                  tasks: [
                    { title: 'Schedule vehicle inspections', assignee: 'John Smith', priority: 'high' },
                    { title: 'Update driver schedules', assignee: 'Jane Doe', priority: 'medium' },
                    { title: 'Review maintenance reports', assignee: 'Bob Johnson', priority: 'low' },
                  ]
                },
                {
                  status: 'In Progress',
                  count: 15,
                  tasks: [
                    { title: 'Fuel cost analysis Q1', assignee: 'Alice Williams', priority: 'high' },
                    { title: 'Safety training preparation', assignee: 'Charlie Brown', priority: 'medium' },
                    { title: 'Vehicle assignment updates', assignee: 'David Lee', priority: 'low' },
                  ]
                },
                {
                  status: 'Completed',
                  count: 32,
                  tasks: [
                    { title: 'Monthly compliance audit', assignee: 'John Smith', priority: 'high' },
                    { title: 'Driver performance reviews', assignee: 'Jane Doe', priority: 'medium' },
                    { title: 'Inventory reconciliation', assignee: 'Bob Johnson', priority: 'low' },
                  ]
                },
              ].map((column) => (
                <div key={column.status} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{column.status}</h3>
                    <Badge variant="outline">{column.count}</Badge>
                  </div>
                  <div className="space-y-2">
                    {column.tasks.map((task, index) => (
                      <div key={index} className="p-3 border rounded-lg bg-card">
                        <p className="font-medium text-sm">{task.title}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-muted-foreground">{task.assignee}</p>
                          <Badge variant={
                            task.priority === 'high' ? 'destructive' :
                            task.priority === 'medium' ? 'secondary' : 'outline'
                          } className="text-xs">
                            {task.priority}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Schedule */}
      <motion.div variants={fadeInVariant}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              This Week's Schedule
            </CardTitle>
            <CardDescription>Important meetings and deadlines</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { event: 'Safety Committee Meeting', date: 'Monday, Jan 27', time: '10:00 AM', attendees: 12 },
                { event: 'Maintenance Planning Session', date: 'Tuesday, Jan 28', time: '2:00 PM', attendees: 8 },
                { event: 'Weekly Operations Review', date: 'Wednesday, Jan 29', time: '9:00 AM', attendees: 15 },
                { event: 'Budget Review Meeting', date: 'Thursday, Jan 30', time: '1:00 PM', attendees: 6 },
                { event: 'All Hands Town Hall', date: 'Friday, Jan 31', time: '3:00 PM', attendees: 127 },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-semibold">{item.event}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.date} · {item.time} · {item.attendees} attendees
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleJoinMeeting(item.event)}>Join</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
})

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PeopleCommunicationHub() {
  const [activeTab, setActiveTab] = useState('people')
  const { user } = useAuth()

  return (
    <HubPage
      title="People & Communication"
      description="Team management, internal communication, and work coordination"
      icon={Users}
    >
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="people" className="flex items-center gap-2" data-testid="hub-tab-people">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">People</span>
            </TabsTrigger>
            <TabsTrigger value="communication" className="flex items-center gap-2" data-testid="hub-tab-communication">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Communication</span>
            </TabsTrigger>
            <TabsTrigger value="work" className="flex items-center gap-2" data-testid="hub-tab-work">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">Work</span>
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TabsContent value="people" className="mt-6">
                <ErrorBoundary>
                  <PeopleTabContent />
                </ErrorBoundary>
              </TabsContent>

              <TabsContent value="communication" className="mt-6">
                <ErrorBoundary>
                  <CommunicationTabContent />
                </ErrorBoundary>
              </TabsContent>

              <TabsContent value="work" className="mt-6">
                <ErrorBoundary>
                  <WorkTabContent />
                </ErrorBoundary>
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </div>
    </HubPage>
  )
}
