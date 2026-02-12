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
import useSWR from "swr"

import { ProfessionalFleetMap, GISFacility } from "@/components/Maps/ProfessionalFleetMap"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/contexts"
import { swrFetcher } from "@/lib/fetcher"
import { cn } from "@/lib/utils"
import type { Vehicle } from "@/lib/types"
import logger from '@/utils/logger';

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
const MessagePanel = ({ messages, onMessageSelect }: { messages: Message[]; onMessageSelect: (msg: Message) => void }) => {
  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'high': return 'text-red-600'
      case 'low': return 'text-blue-800'
      default: return 'text-slate-700'
    }
  }

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'broadcast': return <Radio className="h-4 w-4 text-purple-500" />
      case 'notification': return <Bell className="h-4 w-4 text-yellow-500" />
      default: return <MessageSquare className="h-4 w-4 text-blue-800" />
    }
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Messages</h3>
          <Button size="sm">
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
                    {msg.priority}
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
                    <div className="h-2 w-2 bg-gray-300 rounded-full" />
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
    logger.info("Broadcasting to zone:", { selectedZone, message: broadcastMessage })
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
                    alert.severity === 'info' && "text-blue-800"
                  )} />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{alert.description || alert.alert_type}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Active until {alert.expires_at ? new Date(alert.expires_at).toLocaleString() : 'N/A'}
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
const MessageThreadPanel = ({ message }: { message: Message | null }) => {
  const [reply, setReply] = useState("")

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
              message.priority === 'low' ? 'text-blue-800' :
              'text-slate-700'
            }>
              {message.priority}
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
            <div className="font-medium capitalize">{message.type}</div>
          </Card>

          <Card className="p-3">
            <div className="text-sm text-muted-foreground">Status</div>
            <div className="font-medium capitalize">{message.status}</div>
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
          <Button className="w-full">
            <Send className="h-4 w-4 mr-2" />
            Send Reply
          </Button>
        </div>

        <div className="space-y-2">
          <Button variant="outline" className="w-full">
            <MapPin className="h-4 w-4 mr-2" />
            View on Map
          </Button>
          <Button variant="outline" className="w-full">
            Mark as Unread
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

  const { data: logsResponse } = useSWR<{ data: CommunicationLog[] }>(`/api/communication-logs?limit=200`, swrFetcher)
  const { data: usersResponse } = useSWR<{ data: ApiUser[] }>(`/api/users?limit=500`, swrFetcher)
  const { data: geofencesResponse } = useSWR<{ data: GeofenceRow[] }>(`/api/geofences?limit=200`, swrFetcher)
  const { data: alertsResponse } = useSWR<{ alerts: AlertRow[] }>(`/api/alerts?limit=20`, swrFetcher)

  const logs = logsResponse?.data || []
  const users = usersResponse?.data || []
  const geofences = geofencesResponse?.data || []
  const alerts = alertsResponse?.alerts || []

  const userMap = useMemo(() => {
    return new Map(users.map((u) => [u.id, `${u.first_name} ${u.last_name}`.trim()]))
  }, [users])

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return isNaN(date.getTime()) ? '' : date.toLocaleString()
  }

  const messages: Message[] = useMemo(() => {
    return logs.map((log) => {
      const location = log.metadata?.location || {}
      const lat = Number(location.lat ?? location.latitude)
      const lng = Number(location.lng ?? location.longitude)
      return {
        id: log.id,
        from: userMap.get(log.from_user_id || '') || log.from_address || 'Unknown',
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
          participant: userMap.get(key) || log.from_address || 'Unknown',
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
                  />
                </div>
                <div className="w-2/3">
                  <MessageThreadPanel message={selectedEntity?.type === 'message' ? selectedEntity.data as Message : null} />
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
                  <div className="p-2 text-muted-foreground">
                    Chat thread details would be shown here
                  </div>
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
        />
      </div>
    </div>
  )
}
