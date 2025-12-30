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

import { ProfessionalFleetMap, GISFacility } from "@/components/Maps/ProfessionalFleetMap"
import type { Vehicle } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

// Mock communication data
const mockMessages = [
  {
    id: "msg-1",
    from: "Driver 001",
    fromLocation: { lat: 38.9072, lng: -77.0369 },
    subject: "Route delay",
    content: "Traffic on I-66, ETA +15 mins",
    timestamp: "2 min ago",
    priority: "normal",
    status: "read",
    type: "direct"
  },
  {
    id: "msg-2",
    from: "Dispatcher",
    fromLocation: { lat: 38.9369, lng: -77.0899 },
    subject: "Weather Alert",
    content: "Heavy rain expected in zone 3",
    timestamp: "5 min ago",
    priority: "high",
    status: "unread",
    type: "broadcast"
  },
  {
    id: "msg-3",
    from: "Driver 007",
    fromLocation: { lat: 38.8816, lng: -77.0910 },
    subject: "Delivery confirmed",
    content: "Package delivered successfully at Gate B",
    timestamp: "12 min ago",
    priority: "normal",
    status: "read",
    type: "direct"
  },
  {
    id: "msg-4",
    from: "Maintenance",
    fromLocation: { lat: 38.9216, lng: -77.0147 },
    subject: "Service reminder",
    content: "Vehicle #45 due for inspection",
    timestamp: "1 hour ago",
    priority: "low",
    status: "read",
    type: "notification"
  }
] as const;

const mockChatThreads = [
  { id: "thread-1", participant: "Fleet Supervisor", lastMessage: "Copy that, will route around", unread: 0, active: true },
  { id: "thread-2", participant: "Driver 005", lastMessage: "On my way to pickup", unread: 2, active: true },
  { id: "thread-3", participant: "Maintenance Team", lastMessage: "Scheduled for tomorrow", unread: 0, active: false },
  { id: "thread-4", participant: "Dispatch Center", lastMessage: "New route assigned", unread: 1, active: true }
] as const;

const mockBroadcastZones = [
  { id: "zone-1", name: "Downtown", radius: 5, center: { lat: 38.9072, lng: -77.0369 }, vehicles: 12, active: true },
  { id: "zone-2", name: "North District", radius: 8, center: { lat: 38.9369, lng: -77.0899 }, vehicles: 8, active: true },
  { id: "zone-3", name: "South District", radius: 6, center: { lat: 38.8816, lng: -77.0910 }, vehicles: 15, active: false }
] as const;

const mockAlerts = [
  { id: "alert-1", type: "weather", message: "Heavy rain in Zone 3", severity: "warning", activeUntil: "6:00 PM" },
  { id: "alert-2", type: "traffic", message: "Accident on I-495", severity: "critical", activeUntil: "4:30 PM" },
  { id: "alert-3", type: "maintenance", message: "Fleet inspection tomorrow", severity: "info", activeUntil: "Tomorrow" }
] as const;

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
      case 'low': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'broadcast': return <Radio className="h-4 w-4 text-purple-500" />
      case 'notification': return <Bell className="h-4 w-4 text-yellow-500" />
      default: return <MessageSquare className="h-4 w-4 text-blue-500" />
    }
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-2">
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
      <div className="p-4 space-y-2">
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

// Broadcast Panel Component
const BroadcastPanel = ({ zones }: { zones: BroadcastZone[] }) => {
  const [selectedZone, setSelectedZone] = useState<string>("")
  const [broadcastMessage, setBroadcastMessage] = useState("")

  const handleBroadcast = () => {
    console.log("Broadcasting to zone:", selectedZone, "Message:", broadcastMessage)
    setBroadcastMessage("")
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <h3 className="font-semibold mb-3">Broadcast Control</h3>

        <Card className="p-4">
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
              Send Broadcast
            </Button>
          </div>
        </Card>

        <div>
          <h4 className="text-sm font-medium mb-2">Broadcast Zones</h4>
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
            {mockAlerts.map(alert => (
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
                    alert.severity === 'info' && "text-blue-600"
                  )} />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{alert.message}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Active until {alert.activeUntil}
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
      <div className="p-4 text-muted-foreground">
        Select a message to view thread
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">{message.subject}</h3>
            <Badge variant="outline" className={
              message.priority === 'high' ? 'text-red-600' :
              message.priority === 'low' ? 'text-blue-600' :
              'text-gray-600'
            }>
              {message.priority}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">From: {message.from}</p>
          <p className="text-xs text-muted-foreground">{message.timestamp}</p>
        </div>

        <Card className="p-4">
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
  const [selectedEntity, setSelectedEntity] = useState<{ type: string; data: Message | ChatThread | null } | null>(null)
  const [activePanel, setActivePanel] = useState('messages')
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')

  // Convert messages to map markers
  const messageMarkers = useMemo(() => {
    return mockMessages
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
  }, [searchQuery, priorityFilter])

  // Convert broadcast zones to map markers
  const zoneMarkers = useMemo(() => {
    return mockBroadcastZones.map(zone => ({
      id: zone.id,
      name: zone.name,
      location: zone.center,
      type: 'zone',
      radius: zone.radius,
      description: '',
      category: 'zone',
      status: zone.active ? 'active' : 'inactive'
    } as GISFacility))
  }, [])

  const handleMessageSelect = useCallback((messageId: string) => {
    const message = mockMessages.find(m => m.id === messageId);
    if (message) {
      setSelectedEntity({ type: 'message', data: message });
    }
  }, []);

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Communication Hub</h2>
        </div>
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="messages" value={activePanel} onValueChange={setActivePanel} className="w-full h-full">
            <TabsList className="grid grid-cols-3 m-4">
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="chats">Chats</TabsTrigger>
              <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
            </TabsList>
            <TabsContent value="messages" className="h-[calc(100%-60px)]">
              <div className="flex h-full">
                <div className="w-1/3 border-r">
                  <div className="p-4 border-b">
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
                    messages={mockMessages as unknown as Message[]} 
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
                    threads={mockChatThreads as unknown as ChatThread[]} 
                    onThreadSelect={(thread) => setSelectedEntity({ type: 'chat', data: thread })} 
                  />
                </div>
                <div className="w-2/3">
                  <div className="p-4 text-muted-foreground">
                    Chat thread details would be shown here
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="broadcast" className="h-[calc(100%-60px)]">
              <BroadcastPanel zones={mockBroadcastZones as unknown as BroadcastZone[]} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <div className="w-1/3 border-l">
        <ProfessionalFleetMap
          vehicles={messageMarkers as unknown as Vehicle[]}
          facilities={zoneMarkers}
        />
      </div>
    </div>
  )
}