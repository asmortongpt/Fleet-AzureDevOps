import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { ChatsCircle, PaperPlaneTilt, Users, Bell, CheckCircle } from "@phosphor-icons/react"
import { MSTeamsMessage } from "@/lib/types"
import { msOfficeService } from "@/lib/msOfficeIntegration"
import { toast } from "sonner"

export function TeamsIntegration() {
  const [messages, setMessages] = useState<MSTeamsMessage[]>([])
  const [selectedChannel, setSelectedChannel] = useState("fleet-ops")
  const [isComposeOpen, setIsComposeOpen] = useState(false)
  const [newMessage, setNewMessage] = useState({
    subject: "",
    content: "",
    mentions: [] as string[]
  })

  const channels = [
    { id: "fleet-ops", name: "Fleet Operations", unread: 3 },
    { id: "maintenance", name: "Maintenance Team", unread: 1 },
    { id: "management", name: "Fleet Management", unread: 0 },
    { id: "alerts", name: "Critical Alerts", unread: 2 }
  ]

  const channelMessages = (messages || []).filter(m => m.channelId === selectedChannel)

  const handleSendMessage = async () => {
    if (!newMessage.subject || !newMessage.content) {
      toast.error("Please fill in subject and message")
      return
    }

    try {
      const message = await msOfficeService.sendTeamsMessage(
        selectedChannel,
        newMessage.subject,
        newMessage.content,
        newMessage.mentions
      )

      setMessages(current => [...(current || []), message])
      toast.success("Message posted to Teams")
      setIsComposeOpen(false)
      setNewMessage({ subject: "", content: "", mentions: [] })
    } catch (error) {
      toast.error("Failed to send message")
    }
  }

  const handleNotifyMaintenance = async (priority: "low" | "medium" | "high" | "urgent") => {
    try {
      const message = await msOfficeService.createTeamsNotification(
        "maintenance",
        "Maintenance Alert",
        `A ${priority} priority maintenance issue requires attention.`,
        priority
      )

      setMessages(current => [...(current || []), message])
      toast.success("Notification sent to maintenance team")
    } catch (error) {
      toast.error("Failed to send notification")
    }
  }

  return (
    <div className="h-[calc(100vh-12rem)] flex gap-6">
      <div className="w-64 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChatsCircle className="w-5 h-5" />
              Channels
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-3">
            {channels.map(channel => (
              <Button
                key={channel.id}
                variant={selectedChannel === channel.id ? "secondary" : "ghost"}
                className="w-full justify-between"
                onClick={() => setSelectedChannel(channel.id)}
              >
                <span className="text-sm"># {channel.name}</span>
                {channel.unread > 0 && (
                  <Badge variant="default" className="ml-2">
                    {channel.unread}
                  </Badge>
                )}
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => handleNotifyMaintenance("urgent")}
            >
              <Bell className="w-4 h-4" />
              Alert Team
            </Button>
            <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                >
                  <PaperPlaneTilt className="w-4 h-4" />
                  Compose
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Post to Teams Channel</DialogTitle>
                  <DialogDescription>
                    Send a message to the selected channel
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="message-subject">Subject</Label>
                    <Input
                      id="message-subject"
                      value={newMessage.subject}
                      onChange={e => setNewMessage({ ...newMessage, subject: e.target.value })}
                      placeholder="Message subject"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message-content">Message</Label>
                    <Textarea
                      id="message-content"
                      value={newMessage.content}
                      onChange={e => setNewMessage({ ...newMessage, content: e.target.value })}
                      placeholder="Type your message..."
                      rows={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="channel-select">Channel</Label>
                    <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                      <SelectTrigger id="channel-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {channels.map(channel => (
                          <SelectItem key={channel.id} value={channel.id}>
                            # {channel.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsComposeOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSendMessage}>
                    <PaperPlaneTilt className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span># {channels.find(c => c.id === selectedChannel)?.name}</span>
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-normal">
              <Users className="w-4 h-4" />
              <span>12 members</span>
            </div>
          </CardTitle>
          <CardDescription>Team collaboration and notifications</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 px-6">
            {channelMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="p-4 bg-muted rounded-full mb-4">
                  <ChatsCircle className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
                <p className="text-muted-foreground max-w-md">
                  Start the conversation by posting your first message to this channel.
                </p>
                <Button className="mt-4" onClick={() => setIsComposeOpen(true)}>
                  Post Message
                </Button>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                {channelMessages.map(message => (
                  <div key={message.id} className="space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                        {message.author.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{message.author}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {message.subject && (
                          <div className="font-medium mb-1">{message.subject}</div>
                        )}
                        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                        {message.reactions && message.reactions.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {message.reactions.map((reaction, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {reaction.emoji} {reaction.count}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <Separator />
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
