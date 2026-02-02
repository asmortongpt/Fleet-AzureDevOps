/**
 * CommunicationHubDrilldowns - Deep drilldown components for Communication hub
 *
 * Each stat card in CommunicationHub drills down to a filtered list of actual records.
 * From the list, users can click individual items to view full details.
 */
import { MessageCircle, Mail, Bot, Bell, Archive, Send, Clock, CheckCircle, AlertTriangle, Star, Paperclip, Eye, Flag, Calendar, TrendingUp, Hash, Users, Sparkles, ArrowRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useDrilldown } from '@/contexts/DrilldownContext'

// ============================================================================
// TODO: Replace with real API calls
// All data should come from the useReactiveCommunicationData hook
// ============================================================================

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

interface EmailListItemProps {
  email: {
    id: string
    subject: string
    from: string
    fromName?: string
    to: string[]
    date: string
    body: string
    isRead: boolean
    hasAttachments?: boolean
    attachments?: Array<{ id: string; name: string; size: number; type: string }>
    folder: string
    labels?: string[]
    priority?: string
    hasReceipt?: boolean
    relatedVehicleId?: string
    relatedDriverId?: string
    relatedVendorId?: string
    relatedVendorName?: string
    relatedInvoiceId?: string
  }
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
          <AlertTriangle className="w-3 h-3 text-red-400" />
        ) : email.hasReceipt ? (
          <CheckCircle className="w-3 h-3 text-emerald-700" />
        ) : (
          <Mail className={`w-3 h-3 ${!email.isRead ? 'text-blue-700' : 'text-slate-500'}`} />
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
        <div className={`text-sm truncate ${!email.isRead ? 'font-semibold text-white' : 'text-slate-700'}`}>
          {email.subject}
        </div>
        <div className="text-xs text-slate-500 truncate mt-1">
          {email.body.substring(0, 80)}...
        </div>
        <div className="flex items-center gap-2 mt-2">
          {!email.isRead && (
            <Badge className="bg-blue-500/20 text-blue-700 text-[10px]">Unread</Badge>
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
  conversation: {
    id: string
    user: string
    topic: string
    status: string
    time: string
    messages: number
    satisfaction: number | null
  }
  onClick: () => void
}

function ConversationListItem({ conversation, onClick }: ConversationListItemProps) {
  const statusColors = {
    resolved: 'text-emerald-700 border-emerald-500',
    active: 'text-blue-700 border-blue-500',
    escalated: 'text-amber-400 border-amber-500',
  }

  return (
    <div
      className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg cursor-pointer hover:bg-slate-800/50 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
          {conversation.user.split(' ').map(n => n[0]).join('')}
        </div>
        <div className="min-w-0">
          <div className="font-medium text-white truncate">{conversation.user}</div>
          <div className="text-xs text-slate-700 truncate">{conversation.topic}</div>
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
            <Star className="w-3 h-3 text-yellow-500" />
            {conversation.satisfaction}/5
          </div>
        )}
      </div>
    </div>
  )
}

interface MessageListItemProps {
  message: {
    id: string
    channel: string
    author: string
    content: string
    time: string
    reactions: number
  }
  onClick: () => void
}

function MessageListItem({ message, onClick }: MessageListItemProps) {
  return (
    <div
      className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg cursor-pointer hover:bg-slate-800/50 transition-colors"
      onClick={onClick}
    >
      <div className="w-4 h-4 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
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

  // TODO: Replace with real API call - useReactiveCommunicationData hook
  const conversations: ConversationListItemProps['conversation'][] = []

  const filteredConversations = filterType === 'satisfaction'
    ? conversations.filter(c => c.satisfaction && c.satisfaction >= 4)
    : filterType === 'active'
    ? conversations.filter(c => c.status === 'active')
    : conversations

  return (
    <div className="space-y-2">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-emerald-900/30 border-emerald-700/50 cursor-pointer hover:border-emerald-500/50 transition-colors"
              onClick={() => push({ type: 'ai-satisfaction', data: { filter: 'satisfaction', title: 'High Satisfaction' } } as any)}>
          <CardContent className="p-2 text-center">
            <Bot className="w-4 h-4 text-emerald-700 mx-auto mb-2" />
            <div className="text-sm font-bold text-white">94%</div>
            <div className="text-xs text-slate-700">Satisfaction</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-900/30 border-blue-700/50">
          <CardContent className="p-2 text-center">
            <Clock className="w-4 h-4 text-blue-700 mx-auto mb-2" />
            <div className="text-sm font-bold text-blue-700">1.2s</div>
            <div className="text-xs text-slate-700">Avg Response</div>
          </CardContent>
        </Card>
        <Card className="bg-purple-900/30 border-purple-700/50">
          <CardContent className="p-2 text-center">
            <MessageCircle className="w-4 h-4 text-purple-400 mx-auto mb-2" />
            <div className="text-sm font-bold text-purple-400">{filteredConversations.length}</div>
            <div className="text-xs text-slate-700">Conversations</div>
          </CardContent>
        </Card>
      </div>

      {/* Conversation List */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-purple-400" />
              AI Conversations
            </div>
            <Badge variant="outline" className="text-xs">
              {filteredConversations.length} total
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-2">
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
          <CardTitle className="text-white text-sm">Query Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
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

  // TODO: Replace with real API call - useReactiveCommunicationData hook
  const messages: MessageListItemProps['message'][] = []

  const channelActivity = [
    { channel: '#dispatch', messages: 0, active: false, unread: 0 },
    { channel: '#maintenance', messages: 0, active: false, unread: 0 },
    { channel: '#drivers', messages: 0, active: false, unread: 0 },
    { channel: '#safety', messages: 0, active: false, unread: 0 },
    { channel: '#general', messages: 0, active: false, unread: 0 },
  ]

  return (
    <div className="space-y-2">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-blue-900/30 border-blue-700/50">
          <CardContent className="p-2 text-center">
            <MessageCircle className="w-4 h-4 text-blue-700 mx-auto mb-2" />
            <div className="text-sm font-bold text-white">234</div>
            <div className="text-xs text-slate-700">Messages Today</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-2 text-center">
            <Hash className="w-4 h-4 text-slate-700 mx-auto mb-2" />
            <div className="text-sm font-bold text-slate-300">12</div>
            <div className="text-xs text-slate-700">Channels</div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-900/30 border-emerald-700/50">
          <CardContent className="p-2 text-center">
            <Users className="w-4 h-4 text-emerald-700 mx-auto mb-2" />
            <div className="text-sm font-bold text-emerald-700">48</div>
            <div className="text-xs text-slate-700">Active Users</div>
          </CardContent>
        </Card>
      </div>

      {/* Channel Activity */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm">Channel Activity</CardTitle>
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
          <CardTitle className="text-white text-sm flex items-center justify-between">
            Recent Messages
            <Badge variant="outline" className="text-xs">{messages.length} shown</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] pr-2">
            <div className="space-y-2">
              {messages.length === 0 ? (
                <div className="text-center text-slate-500 py-8">No messages available</div>
              ) : (
                messages.map(msg => (
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
                ))
              )}
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

  // TODO: Replace with real API call - useReactiveCommunicationData hook
  const emails: EmailListItemProps['email'][] = []

  // Filter emails based on drilldown context
  const filteredEmails = filterType === 'sent'
    ? emails // In real app, filter to sent emails
    : filterType === 'unread'
    ? emails.filter(e => !e.isRead)
    : filterType === 'receipts'
    ? emails.filter(e => e.hasReceipt)
    : filterType === 'scheduled'
    ? emails.slice(0, 3) // Mock scheduled emails
    : emails

  // TODO: Replace with real API call
  const emailTemplates: Array<{ id: string; name: string; usageCount: number; lastUsed: string }> = []

  return (
    <div className="space-y-2">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-3">
        <Card
          className="bg-blue-900/30 border-blue-700/50 cursor-pointer hover:border-blue-500/50 transition-colors"
          onClick={() => push({ type: 'email', data: { filter: 'sent', title: 'Sent Today' } } as any)}
        >
          <CardContent className="p-2 text-center">
            <Send className="w-4 h-4 text-blue-700 mx-auto mb-2" />
            <div className="text-sm font-bold text-white">156</div>
            <div className="text-xs text-slate-700">Sent Today</div>
          </CardContent>
        </Card>
        <Card
          className="bg-slate-800/50 border-slate-700 cursor-pointer hover:border-slate-500/50 transition-colors"
          onClick={() => push({ type: 'email-templates', data: { filter: 'templates', title: 'Templates' } } as any)}
        >
          <CardContent className="p-2 text-center">
            <Mail className="w-4 h-4 text-slate-700 mx-auto mb-2" />
            <div className="text-sm font-bold text-slate-300">24</div>
            <div className="text-xs text-slate-700">Templates</div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-900/30 border-emerald-700/50">
          <CardContent className="p-2 text-center">
            <Eye className="w-4 h-4 text-emerald-700 mx-auto mb-2" />
            <div className="text-sm font-bold text-emerald-700">42%</div>
            <div className="text-xs text-slate-700">Open Rate</div>
          </CardContent>
        </Card>
        <Card
          className="bg-amber-900/30 border-amber-700/50 cursor-pointer hover:border-amber-500/50 transition-colors"
          onClick={() => push({ type: 'scheduled-emails', data: { filter: 'scheduled', title: 'Scheduled' } } as any)}
        >
          <CardContent className="p-2 text-center">
            <Calendar className="w-4 h-4 text-amber-400 mx-auto mb-2" />
            <div className="text-sm font-bold text-amber-400">12</div>
            <div className="text-xs text-slate-700">Scheduled</div>
          </CardContent>
        </Card>
      </div>

      {/* Email List */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-3 h-3 text-blue-700" />
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
          <ScrollArea className="h-[400px] pr-2">
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
          <CardTitle className="text-white text-sm">Email Templates</CardTitle>
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
                <Mail className="w-3 h-3 text-slate-500" />
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
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <TrendingUp className="w-3 h-3 text-emerald-700" />
            Campaign Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
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

  // TODO: Replace with real API call - useReactiveCommunicationData hook
  const history: Array<{
    id: string
    type: string
    subject: string
    recipients: number
    time: string
    status: string
  }> = []

  const flaggedMessages = history.filter(h => h.status === 'failed')

  const filteredHistory = filterType === 'flagged'
    ? flaggedMessages
    : filterType === 'archived'
    ? history // Mock archived
    : history

  return (
    <div className="space-y-2">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-emerald-900/30 border-emerald-700/50">
          <CardContent className="p-2 text-center">
            <CheckCircle className="w-4 h-4 text-emerald-700 mx-auto mb-2" />
            <div className="text-sm font-bold text-emerald-700">456</div>
            <div className="text-xs text-slate-700">This Week</div>
          </CardContent>
        </Card>
        <Card
          className="bg-amber-900/30 border-amber-700/50 cursor-pointer hover:border-amber-500/50 transition-colors"
          onClick={() => push({ type: 'flagged', data: { filter: 'flagged', title: 'Flagged' } } as any)}
        >
          <CardContent className="p-2 text-center">
            <Flag className="w-4 h-4 text-amber-400 mx-auto mb-2" />
            <div className="text-sm font-bold text-amber-400">{flaggedMessages.length}</div>
            <div className="text-xs text-slate-700">Flagged</div>
          </CardContent>
        </Card>
        <Card
          className="bg-slate-800/50 border-slate-700 cursor-pointer hover:border-slate-500/50 transition-colors"
          onClick={() => push({ type: 'archived', data: { filter: 'archived', title: 'Archived' } } as any)}
        >
          <CardContent className="p-2 text-center">
            <Archive className="w-4 h-4 text-slate-700 mx-auto mb-2" />
            <div className="text-sm font-bold text-slate-300">3.2K</div>
            <div className="text-xs text-slate-700">Archived</div>
          </CardContent>
        </Card>
      </div>

      {/* Communication History */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-3 h-3 text-blue-700" />
              {filterType === 'flagged' ? 'Flagged Messages' :
               filterType === 'archived' ? 'Archived Messages' :
               'Communication History'}
            </div>
            <Badge variant="outline" className="text-xs">{filteredHistory.length} items</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-2">
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
                      <Mail className="w-3 h-3 text-blue-700 flex-shrink-0" />
                    ) : item.type === 'sms' ? (
                      <MessageCircle className="w-3 h-3 text-emerald-700 flex-shrink-0" />
                    ) : (
                      <Bell className="w-3 h-3 text-purple-400 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="font-medium text-white truncate">{item.subject}</div>
                      <div className="text-xs text-slate-700">
                        {item.recipients} recipients • {formatDistanceToNow(new Date(item.time), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        item.status === 'delivered' ? 'text-emerald-700 border-emerald-500' :
                        item.status === 'failed' ? 'text-red-400 border-red-500' :
                        'text-slate-700 border-slate-500'
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
