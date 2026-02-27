import {
  MessageSquare,
  Send,
  AlertCircle,
  Radio,
  MapPin,
  Bell,
  Megaphone
} from "lucide-react"
import { useState, useMemo, useCallback } from "react"
import toast from "react-hot-toast"
import useSWR from "swr"

import { ProfessionalFleetMap, GISFacility } from "@/components/Maps/ProfessionalFleetMap"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/contexts"
import { apiFetcher } from "@/lib/api-fetcher"
import type { Vehicle } from "@/lib/types"
import { cn } from "@/lib/utils"
import { formatEnum } from "@/utils/format-enum"
import { formatDateTime } from '@/utils/format-helpers';

interface CommunicationLog {
  id: string;
  from_user_id?: string;
  to_user_id?: string;
  from_address?: string;
  to_address?: string;
  subject?: string;
  message_body?: string;
  status?: string;
  communication_type?: string;
  sent_at?: string;
  created_at?: string;
  metadata?: Record<string, any>;
}

interface ApiUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface AlertRow {
  id: string;
  alert_type: string;
  description?: string;
  severity?: string;
  created_at?: string;
  expires_at?: string;
}

interface GeofenceRow {
  id: string;
  name: string;
  radius?: number;
  centerLat?: number;
  centerLng?: number;
  isActive?: boolean;
  type?: string;
  metadata?: Record<string, any>;
}

// Types
interface Message {
  id: string;
  from: string;
  fromLocation: { lat: number; lng: number };
  subject: string;
  content: string;
  timestamp: string;
  priority: string;
  status: string;
  type: string;
}

interface ChatThread {
  id: string;
  participant: string;
  lastMessage: string;
  unread: number;
  active: boolean;
}

interface BroadcastZone {
  id: string;
  name: string;
  radius: number;
  center: { lat: number; lng: number };
  vehicles: number;
  active: boolean;
}

// Message Panel Component
const MessagePanel = ({ messages, onMessageSelect, onNewMessage }: { messages: Message[]; onMessageSelect: (msg: Message) => void; onNewMessage: () => void }) => {
  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'high': return 'text-red-600'
      case 'low': return 'text-emerald-400'
      default: return 'text-white/40'
    }
  }

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'broadcast': return <Radio className="h-4 w-4 text-amber-500" />
      case 'notification': return <Bell className="h-4 w-4 text-yellow-500" />
      default: return <MessageSquare className="h-4 w-4 text-emerald-400" />
    }
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Messages</h3>
          <Button size="sm" onClick={onNewMessage}>
            <Send className="h-4 w-4 mr-2" />
            New Message
          </Button>
        </div>
        {messages.map(msg => (
          <Card
            key={msg.id}
            className={cn(
              "p-3 cursor-pointer hover:bg-accent transition-colors",
              msg.status === 'unread' && "border-primary bg-primary/5"
            )}
            onClick={() => onMessageSelect(msg)}
          >
            <div className="flex items-start gap-2">
              {getTypeIcon(msg.type)}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{msg.from}</span>
                  <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                </div>
                <p className="text-sm font-medium mt-1">{msg.subject}</p>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{msg.content}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className={getPriorityColor(msg.priority)}>
                    {formatEnum(msg.priority)}
                  </Badge>
                  {msg.status === 'unread' && (
                    <Badge variant="default">New</Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </ScrollArea>
  )
}

// Chat Panel Component
const ChatPanel = ({ threads, onThreadSelect }: { threads: ChatThread[]; onThreadSelect: (thread: ChatThread) => void }) => {
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-2">
        <h3 className="font-semibold mb-3">Active Chats</h3>
        {threads.map(thread => (
          <Card
            key={thread.id}
            className={cn(
              "p-3 cursor-pointer hover:bg-accent transition-colors",
              thread.unread > 0 && "border-primary"
            )}
            onClick={() => onThreadSelect(thread)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {thread.active ? (
                    <div className="h-2 w-2 bg-green-500 rounded-full" />
                  ) : (
                    <div className="h-2 w-2 bg-white/30 rounded-full" />
                  )}
                  <span className="font-medium">{thread.participant}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                  {thread.lastMessage}
                </p>
              </div>
              {thread.unread > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {thread.unread}
                </Badge>
              )}
            </div>
          </Card>
        ))}
      </div>
    </ScrollArea>
  )
}

// Radio Panel Component
const BroadcastPanel = ({ zones, alerts }: { zones: BroadcastZone[]; alerts: AlertRow[] }) => {
  const [selectedZone, setSelectedZone] = useState<string>("")
  const [broadcastMessage, setBroadcastMessage] = useState("")

  const handleBroadcast = () => {
    const zoneName = zones.find(z => z.id === selectedZone)?.name || 'All Vehicles'
    toast.success(`Broadcast sent to ${zoneName}`)
    setBroadcastMessage("")
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-2">
        <h3 className="font-semibold mb-3">Radio Control</h3>

        <Card className="p-2">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Select Zone</label>
              <Select value={selectedZone} onValueChange={setSelectedZone}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Choose broadcast zone" />
                </SelectTrigger>
                <SelectContent>
                  {zones.map(zone => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name} ({zone.vehicles} vehicles)
                    </SelectItem>
                  ))}
                  <SelectItem value="all">All Vehicles</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Message</label>
              <Textarea
                placeholder="Enter broadcast message..."
                className="mt-1"
                rows={4}
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleBroadcast}
              disabled={!selectedZone || !broadcastMessage}
            >
              <Megaphone className="h-4 w-4 mr-2" />
              Send Radio
            </Button>
          </div>
        </Card>

        <div>
          <h4 className="text-sm font-medium mb-2">Radio Zones</h4>
          <div className="space-y-2">
            {zones.map(zone => (
              <Card key={zone.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{zone.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {zone.vehicles} vehicles • {zone.radius} mile radius
                    </div>
                  </div>
                  <Badge variant={zone.active ? 'default' : 'secondary'}>
                    {zone.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">Active Alerts</h4>
          <div className="space-y-2">
            {alerts.map(alert => (
              <Card key={alert.id} className={cn(
                "p-3",
                alert.severity === 'critical' && "border-red-500 bg-red-50 dark:bg-red-950/20",
                alert.severity === 'warning' && "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20"
              )}>
                <div className="flex items-start gap-2">
                  <AlertCircle className={cn(
                    "h-4 w-4 mt-0.5",
                    alert.severity === 'critical' && "text-red-600",
                    alert.severity === 'warning' && "text-yellow-600",
                    alert.severity === 'info' && "text-emerald-400"
                  )} />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{alert.description || alert.alert_type}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Active until {alert.expires_at ? formatDateTime(alert.expires_at) : '—'}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}

// Message Thread Panel (detailed view)
const MessageThreadPanel = ({ message, onViewOnMap }: { message: Message | null; onViewOnMap?: (message: Message) => void }) => {
  const [reply, setReply] = useState("")
  const [markedUnread, setMarkedUnread] = useState(false)

  const handleSendReply = () => {
    if (!reply.trim()) return
    toast.success(`Reply sent to ${message?.from}`)
    setReply("")
  }

  const handleMarkUnread = () => {
    setMarkedUnread(true)
    toast.success('Message marked as unread')
  }

  if (!message) {
    return (
      <div className="p-2 text-muted-foreground">
        Select a message to view thread
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-2">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">{message.subject}</h3>
            <Badge variant="outline" className={
              message.priority === 'high' ? 'text-red-600' :
              message.priority === 'low' ? 'text-emerald-400' :
              'text-white/40'
            }>
              {formatEnum(message.priority)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">From: {message.from}</p>
          <p className="text-xs text-muted-foreground">{message.timestamp}</p>
        </div>

        <Card className="p-2">
          <p className="text-sm">{message.content}</p>
        </Card>

        <div className="grid grid-cols-2 gap-2">
          <Card className="p-3">
            <div className="text-sm text-muted-foreground">Type</div>
            <div className="font-medium">{formatEnum(message.type)}</div>
          </Card>

          <Card className="p-3">
            <div className="text-sm text-muted-foreground">Status</div>
            <div className="font-medium">{markedUnread ? 'Unread' : formatEnum(message.status)}</div>
          </Card>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Reply</label>
          <Textarea
            placeholder="Type your reply..."
            rows={4}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />
          <Button className="w-full" onClick={handleSendReply} disabled={!reply.trim()}>
            <Send className="h-4 w-4 mr-2" />
            Send Reply
          </Button>
        </div>

        <div className="space-y-2">
          {message.fromLocation.lat !== 0 && message.fromLocation.lng !== 0 && (
            <Button variant="outline" className="w-full" onClick={() => onViewOnMap?.(message)}>
              <MapPin className="h-4 w-4 mr-2" />
              View on Map
            </Button>
          )}
          <Button variant="outline" className="w-full" onClick={handleMarkUnread} disabled={markedUnread}>
            Mark as Unread
          </Button>
        </div>
      </div>
    </ScrollArea>
  )
}

// Chat Thread Detail Component
const ChatThreadDetail = ({ thread, logs, userMap, currentUserId }: {
  thread: ChatThread | null;
  logs: CommunicationLog[];
  userMap: Map<string, string>;
  currentUserId?: string;
}) => {
  const [reply, setReply] = useState("")

  if (!thread) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Select a conversation to view messages</p>
        </div>
      </div>
    )
  }

  // Filter logs for this thread (messages between current user and participant)
  const threadMessages = logs
    .filter((log) => {
      const fromId = log.from_user_id
      const toId = log.to_user_id
      return (
        (fromId === thread.id && toId === currentUserId) ||
        (fromId === currentUserId && toId === thread.id)
      )
    })
    .sort((a, b) => {
      const aTime = a.sent_at || a.created_at || ''
      const bTime = b.sent_at || b.created_at || ''
      return new Date(aTime).getTime() - new Date(bTime).getTime()
    })

  const handleSendReply = () => {
    if (!reply.trim()) return
    toast.success(`Reply sent to ${thread.participant}`)
    setReply("")
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 border-b pb-3">
          <div className={`h-2 w-2 rounded-full ${thread.active ? 'bg-green-500' : 'bg-white/30'}`} />
          <h3 className="font-semibold">{thread.participant}</h3>
          {thread.unread > 0 && (
            <Badge variant="destructive">{thread.unread} unread</Badge>
          )}
        </div>

        {threadMessages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No messages in this conversation yet.
          </div>
        ) : (
          <div className="space-y-3">
            {threadMessages.map((msg) => {
              const isFromMe = msg.from_user_id === currentUserId
              const senderName = isFromMe ? 'You' : (userMap.get(msg.from_user_id || '') || msg.from_address || 'Unknown')
              const timestamp = msg.sent_at || msg.created_at
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "p-3 rounded-lg max-w-[80%]",
                    isFromMe
                      ? "ml-auto bg-primary/10 border border-primary/20"
                      : "bg-muted"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">{senderName}</span>
                    <span className="text-xs text-muted-foreground">
                      {timestamp ? formatDateTime(timestamp) : ''}
                    </span>
                  </div>
                  {msg.subject && (
                    <p className="text-xs text-muted-foreground font-medium mb-1">{msg.subject}</p>
                  )}
                  <p className="text-sm">{msg.message_body || ''}</p>
                </div>
              )
            })}
          </div>
        )}

        {/* Reply input */}
        <div className="border-t pt-3 space-y-2">
          <Textarea
            placeholder={`Reply to ${thread.participant}...`}
            rows={3}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />
          <Button className="w-full" onClick={handleSendReply} disabled={!reply.trim()}>
            <Send className="h-4 w-4 mr-2" />
            Send Reply
          </Button>
        </div>
      </div>
    </ScrollArea>
  )
}

// Main Communication Hub Component
export function CommunicationHub() {
  const { user } = useAuth()
  const [selectedEntity, setSelectedEntity] = useState<{ type: string; data: Message | ChatThread | null } | null>(null)
  const [activePanel, setActivePanel] = useState('messages')
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')

  const { data: logsResponse, error: logsError } = useSWR<CommunicationLog[]>(`/api/communication-logs?limit=200`, apiFetcher)
  const { data: usersResponse, error: usersError } = useSWR<ApiUser[]>(`/api/users?limit=500`, apiFetcher)
  const { data: geofencesResponse, error: geofencesError } = useSWR<GeofenceRow[]>(`/api/geofences?limit=200`, apiFetcher)
  const { data: alertsResponse, error: alertsError } = useSWR<AlertRow[]>(`/api/alerts?limit=20`, apiFetcher)
  const hasError = logsError || usersError || geofencesError || alertsError

  const logs = Array.isArray(logsResponse) ? logsResponse : []
  const users = Array.isArray(usersResponse) ? usersResponse : []
  const geofences = Array.isArray(geofencesResponse) ? geofencesResponse : []
  const alerts = Array.isArray(alertsResponse) ? alertsResponse : []

  const userMap = useMemo(() => {
    return new Map(users.map((u) => [u.id, `${u.first_name} ${u.last_name}`.trim()]))
  }, [users])

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return isNaN(date.getTime()) ? '' : formatDateTime(timestamp)
  }

  const messages: Message[] = useMemo(() => {
    return logs.map((log) => {
      const location = log.metadata?.location || {}
      const lat = Number(location.lat ?? location.latitude)
      const lng = Number(location.lng ?? location.longitude)
      return {
        id: log.id,
        from: userMap.get(log.from_user_id || '') || log.from_address || '—',
        fromLocation: {
          lat: Number.isFinite(lat) ? lat : 0,
          lng: Number.isFinite(lng) ? lng : 0
        },
        subject: log.subject || 'Message',
        content: log.message_body || '',
        timestamp: formatTimestamp(log.sent_at || log.created_at),
        priority: log.metadata?.priority || 'normal',
        status: log.status === 'read' ? 'read' : 'unread',
        type: log.communication_type || 'direct'
      }
    })
  }, [logs, userMap])

  const chatThreads: ChatThread[] = useMemo(() => {
    const threadMap = new Map<string, ChatThread & { lastTime?: string }>()
    logs.forEach((log) => {
      const fromId = log.from_user_id
      const toId = log.to_user_id
      const currentUserId = user?.id
      const counterpartId = currentUserId && fromId === currentUserId ? toId : fromId
      if (!counterpartId) return
      const key = counterpartId
      const existing = threadMap.get(key)
      const lastMessage = log.message_body || log.subject || ''
      const timestamp = log.sent_at || log.created_at || ''
      const unread = log.status === 'unread' && log.to_user_id === currentUserId ? 1 : 0

      if (!existing || (timestamp && existing.lastTime && new Date(timestamp) > new Date(existing.lastTime))) {
        threadMap.set(key, {
          id: key,
          participant: userMap.get(key) || log.from_address || '—',
          lastMessage,
          unread: (existing?.unread || 0) + unread,
          active: true,
          lastTime: timestamp
        })
      } else if (existing) {
        existing.unread += unread
        threadMap.set(key, existing)
      }
    })
    return Array.from(threadMap.values()).map(({ lastTime, ...thread }) => thread)
  }, [logs, user?.id, userMap])

  const broadcastZones: BroadcastZone[] = useMemo(() => {
    return geofences
      .filter((zone) => zone.type === 'broadcast')
      .map((zone) => ({
        id: zone.id,
        name: zone.name,
        radius: zone.radius ? Number(zone.radius) / 1609.34 : 0,
        center: {
          lat: Number(zone.centerLat) || 0,
          lng: Number(zone.centerLng) || 0
        },
        vehicles: Number(zone.metadata?.vehicles || 0),
        active: zone.isActive ?? true
      }))
  }, [geofences])

  // Convert messages to map markers
  const messageMarkers = useMemo(() => {
    return messages
      .filter(msg => {
        const matchesSearch = !searchQuery ||
          msg.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
          msg.subject.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesPriority = priorityFilter === 'all' || msg.priority === priorityFilter
        return matchesSearch && matchesPriority
      })
      .map(msg => ({
        id: msg.id,
        number: msg.from,
        status: msg.status === 'unread' ? 'active' : 'idle',
        make: msg.subject,
        model: msg.type,
        licensePlate: msg.timestamp,
        location: msg.fromLocation,
        fuelLevel: msg.priority === 'high' ? 100 : msg.priority === 'low' ? 30 : 60
      }))
  }, [messages, searchQuery, priorityFilter])

  // Convert broadcast zones to map markers
  const zoneMarkers = useMemo(() => {
    return broadcastZones.map(zone => ({
      id: zone.id,
      name: zone.name,
      location: zone.center,
      type: 'zone',
      radius: zone.radius,
      description: '',
      category: 'zone',
      status: zone.active ? 'active' : 'inactive'
    } as unknown as GISFacility))
  }, [broadcastZones])

  const handleMessageSelect = useCallback((messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message) {
      setSelectedEntity({ type: 'message', data: message });
    }
  }, [messages]);

  // Compose dialog state
  const [composeOpen, setComposeOpen] = useState(false)
  const [composeRecipient, setComposeRecipient] = useState('')
  const [composeSubject, setComposeSubject] = useState('')
  const [composeBody, setComposeBody] = useState('')

  const handleNewMessage = useCallback(() => {
    setActivePanel('messages')
    setSelectedEntity(null)
    setComposeRecipient('')
    setComposeSubject('')
    setComposeBody('')
    setComposeOpen(true)
  }, [])

  const handleSendComposedMessage = useCallback(() => {
    if (!composeRecipient || !composeBody.trim()) return
    const recipientName = users.find(u => u.id === composeRecipient)
    const name = recipientName ? `${recipientName.first_name} ${recipientName.last_name}` : 'recipient'
    toast.success(`Message sent to ${name}`)
    setComposeOpen(false)
    setComposeRecipient('')
    setComposeSubject('')
    setComposeBody('')
  }, [composeRecipient, composeBody, users])

  const handleViewOnMap = useCallback((message: Message) => {
    if (message.fromLocation.lat !== 0 && message.fromLocation.lng !== 0) {
      // Select the message so the map highlights the corresponding marker
      setSelectedEntity({ type: 'message', data: message })
      setActivePanel('messages')
      toast.success(`Showing ${message.from} on map at ${message.fromLocation.lat.toFixed(4)}, ${message.fromLocation.lng.toFixed(4)}`)
    }
  }, [])

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-destructive font-medium">Failed to load communication data</p>
        <p className="text-sm text-muted-foreground">
          {hasError instanceof Error ? hasError.message : 'An unexpected error occurred'}
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-2 border-b">
          <h2 className="text-base font-semibold">Communication Hub</h2>
        </div>
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="messages" value={activePanel} onValueChange={setActivePanel} className="w-full h-full">
            <TabsList className="grid grid-cols-3 m-2">
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="chats">Chats</TabsTrigger>
              <TabsTrigger value="broadcast">Radio</TabsTrigger>
            </TabsList>
            <TabsContent value="messages" className="h-[calc(100%-60px)]">
              <div className="flex h-full">
                <div className="w-1/3 border-r">
                  <div className="p-2 border-b">
                    <Input
                      placeholder="Search messages..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                      <SelectTrigger className="w-[120px] mt-2">
                        <SelectValue placeholder="Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <MessagePanel
                    messages={messages as unknown as Message[]}
                    onMessageSelect={(msg) => handleMessageSelect(msg.id)}
                    onNewMessage={handleNewMessage}
                  />
                </div>
                <div className="w-2/3">
                  <MessageThreadPanel message={selectedEntity?.type === 'message' ? selectedEntity.data as Message : null} onViewOnMap={handleViewOnMap} />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="chats" className="h-[calc(100%-60px)]">
              <div className="flex h-full">
                <div className="w-1/3 border-r">
                  <ChatPanel 
                    threads={chatThreads as unknown as ChatThread[]} 
                    onThreadSelect={(thread) => setSelectedEntity({ type: 'chat', data: thread })} 
                  />
                </div>
                <div className="w-2/3">
                  <ChatThreadDetail
                    thread={selectedEntity?.type === 'chat' ? selectedEntity.data as ChatThread : null}
                    logs={logs}
                    userMap={userMap}
                    currentUserId={user?.id}
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="broadcast" className="h-[calc(100%-60px)]">
              <BroadcastPanel zones={broadcastZones as unknown as BroadcastZone[]} alerts={alerts} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <div className="w-1/3 border-l">
        <ProfessionalFleetMap
          vehicles={messageMarkers as Vehicle[]}
          facilities={zoneMarkers}
          onVehicleSelect={handleMessageSelect}
        />
      </div>

      {/* Compose Message Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="compose-to">To</Label>
              <Select value={composeRecipient} onValueChange={setComposeRecipient}>
                <SelectTrigger id="compose-to">
                  <SelectValue placeholder="Select recipient" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.first_name} {u.last_name} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="compose-subject">Subject</Label>
              <Input
                id="compose-subject"
                placeholder="Message subject"
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="compose-body">Message</Label>
              <Textarea
                id="compose-body"
                placeholder="Type your message..."
                rows={5}
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendComposedMessage}
              disabled={!composeRecipient || !composeBody.trim()}
            >
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
