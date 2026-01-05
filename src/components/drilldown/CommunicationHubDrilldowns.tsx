/**
 * CommunicationHubDrilldowns - Deep drilldown components for Communication hub
 *
 * Each stat card in CommunicationHub drills down to a filtered list of actual records.
 * From the list, users can click individual items to view full details.
 */
import {
  ChatCircle,
  EnvelopeSimple,
  Robot,
  Bell,
  Archive,
  Envelope,
  PaperPlaneTilt,
  Clock,
  CheckCircle,
  Warning,
  Star,
  Paperclip,
  Eye,
  Flag,
  Calendar,
  TrendUp,
  Hash,
  Users,
  Sparkle,
  ArrowRight,
} from '@phosphor-icons/react'
import { formatDistanceToNow } from 'date-fns'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useDrilldown } from '@/contexts/DrilldownContext'

// ============================================================================
// MOCK DATA - In production, this would come from API
// ============================================================================

const mockEmails = [
  {
    id: 'email-1',
    subject: 'Weekly Fleet Performance Report',
    from: 'reports@fleetops.io',
    fromName: 'Fleet Reports',
    to: ['fleet-managers@company.com'],
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    body: 'Dear Fleet Managers,\n\nPlease find attached the weekly fleet performance report for your review. Key highlights include...',
    isRead: true,
    hasAttachments: true,
    attachments: [{ id: 'att-1', name: 'Fleet_Report_Week52.pdf', size: 245000, type: 'application/pdf' }],
    folder: 'Inbox',
    labels: ['Reports', 'Weekly'],
  },
  {
    id: 'email-2',
    subject: 'Urgent: Maintenance Required - VH-1234',
    from: 'maintenance@fleetops.io',
    fromName: 'Maintenance Alerts',
    to: ['dispatch@company.com'],
    date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    body: 'Vehicle VH-1234 requires immediate brake inspection. The vehicle has been flagged by the predictive maintenance system.',
    isRead: false,
    priority: 'high',
    relatedVehicleId: 'VH-1234',
    folder: 'Inbox',
    labels: ['Maintenance', 'Urgent'],
  },
  {
    id: 'email-3',
    subject: 'Invoice #INV-2024-0892 - Parts Supply',
    from: 'billing@autoparts-supplier.com',
    fromName: 'AutoParts Supplier',
    to: ['accounts@company.com'],
    date: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    body: 'Please find attached invoice for recent parts order. Payment due within 30 days.',
    isRead: true,
    hasReceipt: true,
    hasAttachments: true,
    attachments: [{ id: 'att-2', name: 'Invoice_INV-2024-0892.pdf', size: 89000, type: 'application/pdf' }],
    relatedVendorId: 'vendor-1',
    relatedVendorName: 'AutoParts Supplier',
    relatedInvoiceId: 'INV-2024-0892',
    folder: 'Inbox',
    labels: ['Invoice', 'Vendor'],
  },
  {
    id: 'email-4',
    subject: 'Driver Certification Renewal - John Smith',
    from: 'hr@company.com',
    fromName: 'HR Department',
    to: ['fleet-ops@company.com'],
    date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    body: 'Driver John Smith\'s CDL certification is due for renewal in 30 days. Please ensure compliance.',
    isRead: true,
    relatedDriverId: 'driver-js-001',
    folder: 'Inbox',
    labels: ['Compliance', 'Driver'],
  },
  {
    id: 'email-5',
    subject: 'New Safety Bulletin - Winter Driving Guidelines',
    from: 'safety@fleetops.io',
    fromName: 'Safety Department',
    to: ['all-drivers@company.com'],
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    body: 'Please review the attached winter driving safety guidelines. All drivers must acknowledge receipt.',
    isRead: false,
    hasAttachments: true,
    attachments: [{ id: 'att-3', name: 'Winter_Safety_Guide_2024.pdf', size: 1250000, type: 'application/pdf' }],
    folder: 'Inbox',
    labels: ['Safety', 'Training'],
  },
  {
    id: 'email-6',
    subject: 'Fuel Card Transaction Summary',
    from: 'fuelcard@provider.com',
    fromName: 'Fuel Card Provider',
    to: ['fleet-finance@company.com'],
    date: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
    body: 'Your weekly fuel card transaction summary is ready for review. Total spend: $4,567.89',
    isRead: true,
    hasReceipt: true,
    folder: 'Inbox',
    labels: ['Fuel', 'Finance'],
  },
]

const mockConversations = [
  { id: 'conv-1', user: 'John Smith', topic: 'Vehicle location query', status: 'resolved', time: new Date(Date.now() - 2 * 60 * 1000).toISOString(), messages: 5, satisfaction: 5 },
  { id: 'conv-2', user: 'Jane Doe', topic: 'Fuel card PIN reset', status: 'active', time: new Date(Date.now() - 5 * 60 * 1000).toISOString(), messages: 3, satisfaction: null },
  { id: 'conv-3', user: 'Bob Wilson', topic: 'Route optimization request', status: 'resolved', time: new Date(Date.now() - 12 * 60 * 1000).toISOString(), messages: 8, satisfaction: 4 },
  { id: 'conv-4', user: 'Alice Brown', topic: 'Maintenance ETA inquiry', status: 'resolved', time: new Date(Date.now() - 18 * 60 * 1000).toISOString(), messages: 4, satisfaction: 5 },
  { id: 'conv-5', user: 'Mike Johnson', topic: 'DOT compliance question', status: 'escalated', time: new Date(Date.now() - 45 * 60 * 1000).toISOString(), messages: 12, satisfaction: 3 },
  { id: 'conv-6', user: 'Sarah Davis', topic: 'Schedule change request', status: 'resolved', time: new Date(Date.now() - 60 * 60 * 1000).toISOString(), messages: 6, satisfaction: 5 },
]

const mockTeamsMessages = [
  { id: 'msg-1', channel: '#dispatch', author: 'John Smith', content: 'Route 45 completed ahead of schedule', time: new Date(Date.now() - 5 * 60 * 1000).toISOString(), reactions: 3 },
  { id: 'msg-2', channel: '#maintenance', author: 'Mike Tech', content: 'VH-5678 brake service completed', time: new Date(Date.now() - 15 * 60 * 1000).toISOString(), reactions: 2 },
  { id: 'msg-3', channel: '#drivers', author: 'Jane Driver', content: 'Traffic delay on I-95, ETA updated', time: new Date(Date.now() - 25 * 60 * 1000).toISOString(), reactions: 0 },
  { id: 'msg-4', channel: '#safety', author: 'Safety Team', content: 'New incident reported - details pending', time: new Date(Date.now() - 45 * 60 * 1000).toISOString(), reactions: 5 },
  { id: 'msg-5', channel: '#general', author: 'HR Dept', content: 'Holiday schedule reminder', time: new Date(Date.now() - 60 * 60 * 1000).toISOString(), reactions: 12 },
]

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

interface EmailListItemProps {
  email: typeof mockEmails[0]
  onClick: () => void
}

function EmailListItem({ email, onClick }: EmailListItemProps) {
  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-slate-800/50 ${
        !email.isRead ? 'bg-blue-900/20 border-l-2 border-blue-500' : 'bg-slate-900/30'
      }`}
      onClick={onClick}
    >
      <div className="flex-shrink-0 mt-1">
        {email.priority === 'high' ? (
          <Warning className="w-5 h-5 text-red-400" />
        ) : email.hasReceipt ? (
          <CheckCircle className="w-5 h-5 text-emerald-400" />
        ) : (
          <Envelope className={`w-5 h-5 ${!email.isRead ? 'text-blue-400' : 'text-slate-500'}`} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`font-medium truncate ${!email.isRead ? 'text-white' : 'text-slate-300'}`}>
            {email.fromName || email.from}
          </span>
          <span className="text-xs text-slate-500 flex-shrink-0">
            {formatDistanceToNow(new Date(email.date), { addSuffix: true })}
          </span>
        </div>
        <div className={`text-sm truncate ${!email.isRead ? 'font-semibold text-white' : 'text-slate-400'}`}>
          {email.subject}
        </div>
        <div className="text-xs text-slate-500 truncate mt-1">
          {email.body.substring(0, 80)}...
        </div>
        <div className="flex items-center gap-2 mt-2">
          {!email.isRead && (
            <Badge className="bg-blue-500/20 text-blue-400 text-[10px]">Unread</Badge>
          )}
          {email.hasAttachments && (
            <Paperclip className="w-3 h-3 text-slate-500" />
          )}
          {email.labels?.slice(0, 2).map(label => (
            <Badge key={label} variant="outline" className="text-[10px] border-slate-700">
              {label}
            </Badge>
          ))}
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0 mt-2" />
    </div>
  )
}

interface ConversationListItemProps {
  conversation: typeof mockConversations[0]
  onClick: () => void
}

function ConversationListItem({ conversation, onClick }: ConversationListItemProps) {
  const statusColors = {
    resolved: 'text-emerald-400 border-emerald-500',
    active: 'text-blue-400 border-blue-500',
    escalated: 'text-amber-400 border-amber-500',
  }

  return (
    <div
      className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg cursor-pointer hover:bg-slate-800/50 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
          {conversation.user.split(' ').map(n => n[0]).join('')}
        </div>
        <div className="min-w-0">
          <div className="font-medium text-white truncate">{conversation.user}</div>
          <div className="text-xs text-slate-400 truncate">{conversation.topic}</div>
          <div className="text-xs text-slate-500 mt-1">
            {conversation.messages} messages • {formatDistanceToNow(new Date(conversation.time), { addSuffix: true })}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <Badge variant="outline" className={`text-xs ${statusColors[conversation.status as keyof typeof statusColors]}`}>
          {conversation.status}
        </Badge>
        {conversation.satisfaction && (
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Star className="w-3 h-3 text-yellow-500" weight="fill" />
            {conversation.satisfaction}/5
          </div>
        )}
      </div>
    </div>
  )
}

interface MessageListItemProps {
  message: typeof mockTeamsMessages[0]
  onClick: () => void
}

function MessageListItem({ message, onClick }: MessageListItemProps) {
  return (
    <div
      className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg cursor-pointer hover:bg-slate-800/50 transition-colors"
      onClick={onClick}
    >
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
        {message.author.split(' ').map(n => n[0]).join('')}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white">{message.author}</span>
          <Badge variant="outline" className="text-[10px] border-slate-700">{message.channel}</Badge>
        </div>
        <div className="text-sm text-slate-300 mt-1">{message.content}</div>
        <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
          <span>{formatDistanceToNow(new Date(message.time), { addSuffix: true })}</span>
          {message.reactions > 0 && (
            <span className="flex items-center gap-1">
              👍 {message.reactions}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// DRILLDOWN COMPONENTS
// ============================================================================

export function AiAgentDrilldown() {
  const { push, currentLevel } = useDrilldown()
  const filterType = currentLevel?.data?.filter || 'all'

  const filteredConversations = filterType === 'satisfaction'
    ? mockConversations.filter(c => c.satisfaction && c.satisfaction >= 4)
    : filterType === 'active'
    ? mockConversations.filter(c => c.status === 'active')
    : mockConversations

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-emerald-900/30 border-emerald-700/50 cursor-pointer hover:border-emerald-500/50 transition-colors"
              onClick={() => push({ type: 'ai-satisfaction', data: { filter: 'satisfaction', title: 'High Satisfaction' } } as any)}>
          <CardContent className="p-4 text-center">
            <Robot className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">94%</div>
            <div className="text-xs text-slate-400">Satisfaction</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-900/30 border-blue-700/50">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-400">1.2s</div>
            <div className="text-xs text-slate-400">Avg Response</div>
          </CardContent>
        </Card>
        <Card className="bg-purple-900/30 border-purple-700/50">
          <CardContent className="p-4 text-center">
            <ChatCircle className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-400">{filteredConversations.length}</div>
            <div className="text-xs text-slate-400">Conversations</div>
          </CardContent>
        </Card>
      </div>

      {/* Conversation List */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkle className="w-5 h-5 text-purple-400" />
              AI Conversations
            </div>
            <Badge variant="outline" className="text-xs">
              {filteredConversations.length} total
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {filteredConversations.map(conv => (
                <ConversationListItem
                  key={conv.id}
                  conversation={conv}
                  onClick={() => push({
                    id: conv.id,
                    type: 'ai-conversation-detail',
                    label: `Chat with ${conv.user}`,
                    data: {
                      conversationId: conv.id,
                      user: conv.user,
                      topic: conv.topic,
                      status: conv.status,
                      messages: conv.messages,
                      satisfaction: conv.satisfaction,
                      time: conv.time,
                    }
                  })}
                />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Usage Breakdown */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg">Query Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { name: 'Fleet Status', value: 45, color: 'bg-blue-500' },
            { name: 'Maintenance', value: 28, color: 'bg-emerald-500' },
            { name: 'Compliance', value: 18, color: 'bg-purple-500' },
            { name: 'Other', value: 9, color: 'bg-slate-500' },
          ].map(cat => (
            <div key={cat.name} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">{cat.name}</span>
                <span className="text-white font-medium">{cat.value}%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${cat.value}%` }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export function MessagesDrilldown() {
  const { push, currentLevel } = useDrilldown()
  const filterType = currentLevel?.data?.filter || 'all'

  const channelActivity = [
    { channel: '#dispatch', messages: 89, active: true, unread: 5 },
    { channel: '#maintenance', messages: 56, active: true, unread: 2 },
    { channel: '#drivers', messages: 45, active: true, unread: 8 },
    { channel: '#safety', messages: 28, active: false, unread: 0 },
    { channel: '#general', messages: 16, active: false, unread: 0 },
  ]

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-blue-900/30 border-blue-700/50">
          <CardContent className="p-4 text-center">
            <ChatCircle className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">234</div>
            <div className="text-xs text-slate-400">Messages Today</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Hash className="w-6 h-6 text-slate-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-slate-300">12</div>
            <div className="text-xs text-slate-400">Channels</div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-900/30 border-emerald-700/50">
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-emerald-400">48</div>
            <div className="text-xs text-slate-400">Active Users</div>
          </CardContent>
        </Card>
      </div>

      {/* Channel Activity */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg">Channel Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {channelActivity.map(ch => (
            <div
              key={ch.channel}
              className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg cursor-pointer hover:bg-slate-800/50 transition-colors"
              onClick={() => push({
                id: ch.channel,
                type: 'channel-messages',
                label: ch.channel,
                data: { channel: ch.channel, filter: 'channel' }
              })}
            >
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${ch.active ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                <span className="text-slate-300 font-medium">{ch.channel}</span>
                {ch.unread > 0 && (
                  <Badge className="bg-blue-500 text-white text-xs">{ch.unread}</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white font-medium">{ch.messages} msgs</span>
                <ArrowRight className="w-4 h-4 text-slate-600" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Messages */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg flex items-center justify-between">
            Recent Messages
            <Badge variant="outline" className="text-xs">{mockTeamsMessages.length} shown</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {mockTeamsMessages.map(msg => (
                <MessageListItem
                  key={msg.id}
                  message={msg}
                  onClick={() => push({
                    id: msg.id,
                    type: 'message-detail',
                    label: `Message from ${msg.author}`,
                    data: {
                      messageId: msg.id,
                      channel: msg.channel,
                      author: msg.author,
                      content: msg.content,
                      time: msg.time,
                      reactions: msg.reactions,
                    }
                  })}
                />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

export function EmailDrilldown() {
  const { push, currentLevel } = useDrilldown()
  const filterType = currentLevel?.data?.filter || 'all'

  // Filter emails based on drilldown context
  const filteredEmails = filterType === 'sent'
    ? mockEmails // In real app, filter to sent emails
    : filterType === 'unread'
    ? mockEmails.filter(e => !e.isRead)
    : filterType === 'receipts'
    ? mockEmails.filter(e => e.hasReceipt)
    : filterType === 'scheduled'
    ? mockEmails.slice(0, 3) // Mock scheduled emails
    : mockEmails

  const emailTemplates = [
    { id: 'tpl-1', name: 'Weekly Fleet Report', usageCount: 156, lastUsed: '2 days ago' },
    { id: 'tpl-2', name: 'Maintenance Reminder', usageCount: 89, lastUsed: '1 day ago' },
    { id: 'tpl-3', name: 'Safety Bulletin', usageCount: 45, lastUsed: '3 days ago' },
    { id: 'tpl-4', name: 'Driver Notification', usageCount: 234, lastUsed: 'Today' },
  ]

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-3">
        <Card
          className="bg-blue-900/30 border-blue-700/50 cursor-pointer hover:border-blue-500/50 transition-colors"
          onClick={() => push({ type: 'email', data: { filter: 'sent', title: 'Sent Today' } } as any)}
        >
          <CardContent className="p-4 text-center">
            <PaperPlaneTilt className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">156</div>
            <div className="text-xs text-slate-400">Sent Today</div>
          </CardContent>
        </Card>
        <Card
          className="bg-slate-800/50 border-slate-700 cursor-pointer hover:border-slate-500/50 transition-colors"
          onClick={() => push({ type: 'email-templates', data: { filter: 'templates', title: 'Templates' } } as any)}
        >
          <CardContent className="p-4 text-center">
            <EnvelopeSimple className="w-6 h-6 text-slate-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-slate-300">24</div>
            <div className="text-xs text-slate-400">Templates</div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-900/30 border-emerald-700/50">
          <CardContent className="p-4 text-center">
            <Eye className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-emerald-400">42%</div>
            <div className="text-xs text-slate-400">Open Rate</div>
          </CardContent>
        </Card>
        <Card
          className="bg-amber-900/30 border-amber-700/50 cursor-pointer hover:border-amber-500/50 transition-colors"
          onClick={() => push({ type: 'scheduled-emails', data: { filter: 'scheduled', title: 'Scheduled' } } as any)}
        >
          <CardContent className="p-4 text-center">
            <Calendar className="w-6 h-6 text-amber-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-amber-400">12</div>
            <div className="text-xs text-slate-400">Scheduled</div>
          </CardContent>
        </Card>
      </div>

      {/* Email List */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Envelope className="w-5 h-5 text-blue-400" />
              {filterType === 'sent' ? 'Sent Emails' :
               filterType === 'unread' ? 'Unread Emails' :
               filterType === 'receipts' ? 'Receipt Emails' :
               filterType === 'scheduled' ? 'Scheduled Emails' :
               'Recent Emails'}
            </div>
            <Badge variant="outline" className="text-xs">
              {filteredEmails.length} emails
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {filteredEmails.map(email => (
                <EmailListItem
                  key={email.id}
                  email={email as any}
                  onClick={() => push({
                    id: email.id,
                    type: 'email-detail',
                    label: email.subject,
                    data: {
                      emailId: email.id,
                      subject: email.subject,
                      from: email.from,
                      fromName: email.fromName,
                      to: email.to,
                      date: email.date,
                      body: email.body,
                      isRead: email.isRead,
                      hasAttachments: email.hasAttachments,
                      attachments: email.attachments,
                      labels: email.labels,
                      folder: email.folder,
                      priority: (email as any).priority,
                      relatedVendorId: (email as any).relatedVendorId,
                      relatedVendorName: (email as any).relatedVendorName,
                      relatedInvoiceId: (email as any).relatedInvoiceId,
                      hasReceipt: email.hasReceipt,
                    }
                  })}
                />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Email Templates */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg">Email Templates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {emailTemplates.map(template => (
            <div
              key={template.id}
              className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg cursor-pointer hover:bg-slate-800/50 transition-colors"
              onClick={() => push({
                id: template.id,
                type: 'email-template-detail',
                label: template.name,
                data: { templateId: template.id, name: template.name, usageCount: template.usageCount }
              })}
            >
              <div className="flex items-center gap-3">
                <EnvelopeSimple className="w-5 h-5 text-slate-500" />
                <div>
                  <div className="font-medium text-white">{template.name}</div>
                  <div className="text-xs text-slate-500">Used {template.usageCount} times • Last: {template.lastUsed}</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Campaign Performance */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <TrendUp className="w-5 h-5 text-emerald-400" />
            Campaign Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { name: 'Weekly Fleet Update', sent: 156, opened: 72, rate: 46 },
            { name: 'Maintenance Reminder', sent: 48, opened: 38, rate: 79 },
            { name: 'Safety Bulletin', sent: 156, opened: 52, rate: 33 },
          ].map(campaign => (
            <div
              key={campaign.name}
              className="space-y-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => push({
                id: campaign.name,
                type: 'campaign-detail',
                label: campaign.name,
                data: { campaign }
              })}
            >
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">{campaign.name}</span>
                <span className="text-white">{campaign.rate}% opened</span>
              </div>
              <Progress value={campaign.rate} className="h-2 bg-slate-700" />
              <div className="flex justify-between text-xs text-slate-500">
                <span>{campaign.sent} sent</span>
                <span>{campaign.opened} opened</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export function HistoryDrilldown() {
  const { push, currentLevel } = useDrilldown()
  const filterType = currentLevel?.data?.filter || 'all'

  const history = [
    { id: 'hist-1', type: 'email', subject: 'Weekly Fleet Report', recipients: 45, time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), status: 'delivered' },
    { id: 'hist-2', type: 'sms', subject: 'Route Update Alert', recipients: 12, time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), status: 'delivered' },
    { id: 'hist-3', type: 'push', subject: 'Maintenance Reminder', recipients: 8, time: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), status: 'delivered' },
    { id: 'hist-4', type: 'email', subject: 'Safety Bulletin', recipients: 156, time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), status: 'delivered' },
    { id: 'hist-5', type: 'email', subject: 'Fuel Report', recipients: 23, time: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(), status: 'delivered' },
    { id: 'hist-6', type: 'sms', subject: 'Dispatch Update', recipients: 8, time: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(), status: 'failed' },
  ]

  const flaggedMessages = history.filter(h => h.status === 'failed')

  const filteredHistory = filterType === 'flagged'
    ? flaggedMessages
    : filterType === 'archived'
    ? history // Mock archived
    : history

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-emerald-900/30 border-emerald-700/50">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-emerald-400">456</div>
            <div className="text-xs text-slate-400">This Week</div>
          </CardContent>
        </Card>
        <Card
          className="bg-amber-900/30 border-amber-700/50 cursor-pointer hover:border-amber-500/50 transition-colors"
          onClick={() => push({ type: 'flagged', data: { filter: 'flagged', title: 'Flagged' } } as any)}
        >
          <CardContent className="p-4 text-center">
            <Flag className="w-6 h-6 text-amber-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-amber-400">{flaggedMessages.length}</div>
            <div className="text-xs text-slate-400">Flagged</div>
          </CardContent>
        </Card>
        <Card
          className="bg-slate-800/50 border-slate-700 cursor-pointer hover:border-slate-500/50 transition-colors"
          onClick={() => push({ type: 'archived', data: { filter: 'archived', title: 'Archived' } } as any)}
        >
          <CardContent className="p-4 text-center">
            <Archive className="w-6 h-6 text-slate-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-slate-300">3.2K</div>
            <div className="text-xs text-slate-400">Archived</div>
          </CardContent>
        </Card>
      </div>

      {/* Communication History */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChatCircle className="w-5 h-5 text-blue-400" />
              {filterType === 'flagged' ? 'Flagged Messages' :
               filterType === 'archived' ? 'Archived Messages' :
               'Communication History'}
            </div>
            <Badge variant="outline" className="text-xs">{filteredHistory.length} items</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {filteredHistory.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg cursor-pointer hover:bg-slate-800/50 transition-colors"
                  onClick={() => push({
                    id: item.id,
                    type: item.type === 'email' ? 'email-detail' : 'message-detail',
                    label: item.subject,
                    data: {
                      id: item.id,
                      subject: item.subject,
                      type: item.type,
                      recipients: item.recipients,
                      time: item.time,
                      status: item.status,
                    }
                  })}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {item.type === 'email' ? (
                      <Envelope className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    ) : item.type === 'sms' ? (
                      <ChatCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <Bell className="w-5 h-5 text-purple-400 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="font-medium text-white truncate">{item.subject}</div>
                      <div className="text-xs text-slate-400">
                        {item.recipients} recipients • {formatDistanceToNow(new Date(item.time), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        item.status === 'delivered' ? 'text-emerald-400 border-emerald-500' :
                        item.status === 'failed' ? 'text-red-400 border-red-500' :
                        'text-slate-400 border-slate-500'
                      }`}
                    >
                      {item.status}
                    </Badge>
                    <ArrowRight className="w-4 h-4 text-slate-600" />
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
