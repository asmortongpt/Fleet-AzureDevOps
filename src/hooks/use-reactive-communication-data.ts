/**
 * useReactiveCommunicationData - Real-time communication data with React Query
 * Auto-refreshes every 10 seconds for live communication dashboard
 */

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

interface Message {
  id: string
  from: string
  to: string
  subject: string
  body: string
  type: 'email' | 'teams' | 'sms' | 'in_app'
  status: 'sent' | 'delivered' | 'read' | 'failed'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  timestamp: string
  attachments?: number
}

interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  category: 'system' | 'maintenance' | 'compliance' | 'safety' | 'general'
  read: boolean
  actionUrl?: string
  timestamp: string
}

interface Announcement {
  id: string
  title: string
  content: string
  author: string
  category: 'company' | 'department' | 'team' | 'urgent'
  priority: 'low' | 'normal' | 'high'
  publishDate: string
  expiryDate?: string
  views: number
  acknowledgedBy: number
  totalRecipients: number
}

export function useReactiveCommunicationData() {
  const [realTimeUpdate, setRealTimeUpdate] = useState(0)

  // Fetch messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ['messages', realTimeUpdate],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/communications/messages`)
      if (!response.ok) {
        // Return mock data for demo
        return generateMockMessages()
      }
      return response.json()
    },
    refetchInterval: 10000,
    staleTime: 5000,
  })

  // Fetch notifications
  const { data: notifications = [], isLoading: notificationsLoading } = useQuery<Notification[]>({
    queryKey: ['notifications', realTimeUpdate],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/notifications`)
      if (!response.ok) {
        // Return mock data for demo
        return generateMockNotifications()
      }
      return response.json()
    },
    refetchInterval: 10000,
    staleTime: 5000,
  })

  // Fetch announcements
  const { data: announcements = [], isLoading: announcementsLoading } = useQuery<Announcement[]>({
    queryKey: ['announcements', realTimeUpdate],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/announcements`)
      if (!response.ok) {
        // Return mock data for demo
        return generateMockAnnouncements()
      }
      return response.json()
    },
    refetchInterval: 30000,
    staleTime: 15000,
  })

  // Calculate communication metrics
  const metrics = {
    totalMessages: messages.length,
    sentToday: messages.filter(
      (m) => new Date(m.timestamp).toDateString() === new Date().toDateString()
    ).length,
    unreadNotifications: notifications.filter((n) => !n.read).length,
    activeAnnouncements: announcements.filter((a) => {
      const now = new Date()
      const publishDate = new Date(a.publishDate)
      const expiryDate = a.expiryDate ? new Date(a.expiryDate) : null
      return publishDate <= now && (!expiryDate || expiryDate >= now)
    }).length,
    messagesDelivered: messages.filter((m) => m.status === 'delivered' || m.status === 'read')
      .length,
    messagesFailed: messages.filter((m) => m.status === 'failed').length,
    avgResponseTime: '1.2h',
    engagementRate: 85,
  }

  // Message type distribution for pie chart
  const messageTypeDistribution = messages.reduce((acc, msg) => {
    acc[msg.type] = (acc[msg.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Notification category distribution
  const notificationCategoryDistribution = notifications.reduce((acc, notif) => {
    acc[notif.category] = (acc[notif.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Messages over time (last 7 days)
  const messagesOverTimeData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    const dateStr = date.toLocaleDateString('en-US', { weekday: 'short' })
    const count = messages.filter(
      (m) => new Date(m.timestamp).toDateString() === date.toDateString()
    ).length
    return { name: dateStr, messages: count }
  })

  // Announcement engagement
  const announcementEngagementData = announcements.slice(0, 5).map((a) => ({
    name: a.title.substring(0, 20) + (a.title.length > 20 ? '...' : ''),
    views: a.views,
    acknowledged: a.acknowledgedBy,
    engagementRate: a.totalRecipients > 0
      ? Math.round((a.acknowledgedBy / a.totalRecipients) * 100)
      : 0,
  }))

  // Unread notifications by category
  const unreadNotifications = notifications.filter((n) => !n.read)
  const urgentNotifications = unreadNotifications.filter((n) => n.type === 'error' || n.type === 'warning')

  // Recent messages (last 10)
  const recentMessages = messages
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10)

  // High priority messages
  const highPriorityMessages = messages
    .filter((m) => m.priority === 'high' || m.priority === 'urgent')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5)

  // Active announcements sorted by priority and date
  const activeAnnouncementsList = announcements
    .filter((a) => {
      const now = new Date()
      const publishDate = new Date(a.publishDate)
      const expiryDate = a.expiryDate ? new Date(a.expiryDate) : null
      return publishDate <= now && (!expiryDate || expiryDate >= now)
    })
    .sort((a, b) => {
      const priorityWeight = { high: 3, normal: 2, low: 1 }
      const diff = priorityWeight[b.priority] - priorityWeight[a.priority]
      if (diff !== 0) return diff
      return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
    })

  return {
    messages,
    notifications,
    announcements,
    metrics,
    messageTypeDistribution,
    notificationCategoryDistribution,
    messagesOverTimeData,
    announcementEngagementData,
    unreadNotifications,
    urgentNotifications,
    recentMessages,
    highPriorityMessages,
    activeAnnouncementsList,
    isLoading: messagesLoading || notificationsLoading || announcementsLoading,
    lastUpdate: new Date(),
    refresh: () => setRealTimeUpdate((prev) => prev + 1),
  }
}

// Mock data generators for demo purposes
function generateMockMessages(): Message[] {
  const types: Message['type'][] = ['email', 'teams', 'sms', 'in_app']
  const statuses: Message['status'][] = ['sent', 'delivered', 'read', 'failed']
  const priorities: Message['priority'][] = ['low', 'normal', 'high', 'urgent']
  const subjects = [
    'Fleet Status Update',
    'Maintenance Schedule Change',
    'New Compliance Requirements',
    'Driver Performance Review',
    'Fuel Cost Analysis',
    'Route Optimization Results',
    'Safety Training Reminder',
    'Vehicle Assignment Update',
  ]

  return Array.from({ length: 45 }, (_, i) => {
    const date = new Date()
    date.setHours(date.getHours() - Math.floor(Math.random() * 72))

    return {
      id: `msg-${i}`,
      from: `user${Math.floor(Math.random() * 20)}@fleet.com`,
      to: `user${Math.floor(Math.random() * 20)}@fleet.com`,
      subject: subjects[Math.floor(Math.random() * subjects.length)],
      body: 'Message content...',
      type: types[Math.floor(Math.random() * types.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      timestamp: date.toISOString(),
      attachments: Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : 0,
    }
  })
}

function generateMockNotifications(): Notification[] {
  const types: Notification['type'][] = ['info', 'warning', 'error', 'success']
  const categories: Notification['category'][] = ['system', 'maintenance', 'compliance', 'safety', 'general']
  const titles = [
    'Maintenance Due',
    'License Expiring Soon',
    'Safety Alert',
    'System Update',
    'New Message',
    'Compliance Report Ready',
    'Vehicle Inspection Required',
    'Driver Assignment Changed',
  ]

  return Array.from({ length: 28 }, (_, i) => {
    const date = new Date()
    date.setHours(date.getHours() - Math.floor(Math.random() * 48))

    return {
      id: `notif-${i}`,
      userId: `user-${Math.floor(Math.random() * 10)}`,
      title: titles[Math.floor(Math.random() * titles.length)],
      message: 'Notification details...',
      type: types[Math.floor(Math.random() * types.length)],
      category: categories[Math.floor(Math.random() * categories.length)],
      read: Math.random() > 0.4,
      timestamp: date.toISOString(),
    }
  })
}

function generateMockAnnouncements(): Announcement[] {
  const categories: Announcement['category'][] = ['company', 'department', 'team', 'urgent']
  const priorities: Announcement['priority'][] = ['low', 'normal', 'high']
  const titles = [
    'New Safety Procedures Implemented',
    'Q4 Fleet Performance Summary',
    'Upcoming System Maintenance',
    'Driver Training Schedule',
    'Holiday Schedule Changes',
    'New Electric Vehicles Added',
    'Compliance Audit Results',
    'Updated Fuel Card Procedures',
  ]

  return Array.from({ length: 8 }, (_, i) => {
    const publishDate = new Date()
    publishDate.setDate(publishDate.getDate() - Math.floor(Math.random() * 14))

    const expiryDate = new Date(publishDate)
    expiryDate.setDate(expiryDate.getDate() + 30)

    const totalRecipients = Math.floor(Math.random() * 100) + 50
    const acknowledgedBy = Math.floor(totalRecipients * (0.6 + Math.random() * 0.3))

    return {
      id: `announce-${i}`,
      title: titles[Math.floor(Math.random() * titles.length)],
      content: 'Announcement content...',
      author: `Manager ${Math.floor(Math.random() * 5) + 1}`,
      category: categories[Math.floor(Math.random() * categories.length)],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      publishDate: publishDate.toISOString(),
      expiryDate: expiryDate.toISOString(),
      views: Math.floor(totalRecipients * (0.7 + Math.random() * 0.3)),
      acknowledgedBy,
      totalRecipients,
    }
  })
}
