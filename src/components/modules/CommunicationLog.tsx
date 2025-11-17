import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Plus, 
  MagnifyingGlass, 
  Envelope, 
  Phone, 
  ChatsCircle,
  DeviceMobile,
  Users,
  Calendar,
  CheckCircle,
  Clock
} from "@phosphor-icons/react"
import { CommunicationLog as CommunicationLogType } from "@/lib/types"
import { toast } from "sonner"

export function CommunicationLog() {
  const [logs, setLogs] = useState<CommunicationLogType[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const [newLog, setNewLog] = useState<Partial<CommunicationLogType>>({
    type: "email",
    participants: [],
    subject: "",
    summary: "",
    followUpRequired: false
  })

  const [participantInput, setParticipantInput] = useState("")

  const filteredLogs = (logs || []).filter(log => {
    const matchesSearch = 
      log.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.participants.some(p => p.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = filterType === "all" || log.type === filterType

    return matchesSearch && matchesType
  })

  const handleAddParticipant = () => {
    if (participantInput.trim()) {
      setNewLog(prev => ({
        ...prev,
        participants: [...(prev.participants || []), participantInput.trim()]
      }))
      setParticipantInput("")
    }
  }

  const handleRemoveParticipant = (index: number) => {
    setNewLog(prev => ({
      ...prev,
      participants: (prev.participants || []).filter((_, i) => i !== index)
    }))
  }

  const handleSaveLog = () => {
    if (!newLog.subject || !newLog.summary || (newLog.participants || []).length === 0) {
      toast.error("Please fill in required fields")
      return
    }

    const log: CommunicationLogType = {
      id: `log-${Date.now()}`,
      tenantId: "tenant-demo",
      type: newLog.type as CommunicationLogType["type"],
      date: new Date().toISOString(),
      participants: newLog.participants || [],
      subject: newLog.subject,
      summary: newLog.summary,
      relatedVehicleId: newLog.relatedVehicleId,
      relatedVendorId: newLog.relatedVendorId,
      relatedWorkOrderId: newLog.relatedWorkOrderId,
      followUpRequired: newLog.followUpRequired || false,
      followUpDate: newLog.followUpDate,
      createdBy: "Current User"
    }

    setLogs(current => [...(current || []), log])
    toast.success("Communication logged successfully")
    setIsAddDialogOpen(false)
    resetForm()
  }

  const handleMarkFollowUpComplete = (logId: string) => {
    setLogs(current =>
      (current || []).map(log =>
        log.id === logId
          ? { ...log, followUpRequired: false }
          : log
      )
    )
    toast.success("Follow-up marked as complete")
  }

  const resetForm = () => {
    setNewLog({
      type: "email",
      participants: [],
      subject: "",
      summary: "",
      followUpRequired: false
    })
    setParticipantInput("")
  }

  const getTypeIcon = (type: CommunicationLogType["type"]) => {
    const icons = {
      email: <Envelope className="w-4 h-4" />,
      teams: <ChatsCircle className="w-4 h-4" />,
      phone: <Phone className="w-4 h-4" />,
      sms: <DeviceMobile className="w-4 h-4" />,
      "in-person": <Users className="w-4 h-4" />
    }
    return icons[type]
  }

  const getTypeColor = (type: CommunicationLogType["type"]) => {
    const colors = {
      email: "bg-blue-100 text-blue-700",
      teams: "bg-purple-100 text-purple-700",
      phone: "bg-green-100 text-green-700",
      sms: "bg-cyan-100 text-cyan-700",
      "in-person": "bg-orange-100 text-orange-700"
    }
    return colors[type]
  }

  const followUpCount = (logs || []).filter(l => l.followUpRequired).length
  const todayLogs = (logs || []).filter(l => {
    const logDate = new Date(l.date).toDateString()
    const today = new Date().toDateString()
    return logDate === today
  }).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Communication Log</h2>
          <p className="text-muted-foreground">Track all fleet-related communications and follow-ups</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Log Communication
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Log New Communication</DialogTitle>
              <DialogDescription>
                Record communication details for audit trail
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="log-type">Type *</Label>
                  <Select
                    value={newLog.type}
                    onValueChange={value => setNewLog({ ...newLog, type: value as CommunicationLogType["type"] })}
                  >
                    <SelectTrigger id="log-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="teams">Microsoft Teams</SelectItem>
                      <SelectItem value="phone">Phone Call</SelectItem>
                      <SelectItem value="sms">SMS/Text</SelectItem>
                      <SelectItem value="in-person">In-Person</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="log-subject">Subject *</Label>
                  <Input
                    id="log-subject"
                    value={newLog.subject}
                    onChange={e => setNewLog({ ...newLog, subject: e.target.value })}
                    placeholder="Communication topic"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Participants *</Label>
                <div className="flex gap-2">
                  <Input
                    value={participantInput}
                    onChange={e => setParticipantInput(e.target.value)}
                    placeholder="Add participant name or email"
                    onKeyPress={e => e.key === "Enter" && (e.preventDefault(), handleAddParticipant())}
                  />
                  <Button type="button" variant="outline" onClick={handleAddParticipant}>
                    Add
                  </Button>
                </div>
                {(newLog.participants || []).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(newLog.participants || []).map((participant, idx) => (
                      <Badge key={idx} variant="secondary" className="gap-1">
                        {participant}
                        <button
                          onClick={() => handleRemoveParticipant(idx)}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="log-summary">Summary *</Label>
                <Textarea
                  id="log-summary"
                  value={newLog.summary}
                  onChange={e => setNewLog({ ...newLog, summary: e.target.value })}
                  placeholder="Brief summary of the communication..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="related-vehicle">Related Vehicle</Label>
                  <Input
                    id="related-vehicle"
                    value={newLog.relatedVehicleId}
                    onChange={e => setNewLog({ ...newLog, relatedVehicleId: e.target.value })}
                    placeholder="Vehicle ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="related-vendor">Related Vendor</Label>
                  <Input
                    id="related-vendor"
                    value={newLog.relatedVendorId}
                    onChange={e => setNewLog({ ...newLog, relatedVendorId: e.target.value })}
                    placeholder="Vendor ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="related-workorder">Related Work Order</Label>
                  <Input
                    id="related-workorder"
                    value={newLog.relatedWorkOrderId}
                    onChange={e => setNewLog({ ...newLog, relatedWorkOrderId: e.target.value })}
                    placeholder="Work Order ID"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="follow-up"
                    checked={newLog.followUpRequired}
                    onCheckedChange={checked => setNewLog({ ...newLog, followUpRequired: checked as boolean })}
                  />
                  <Label htmlFor="follow-up" className="cursor-pointer">
                    Follow-up required
                  </Label>
                </div>

                {newLog.followUpRequired && (
                  <div className="space-y-2">
                    <Label htmlFor="follow-up-date">Follow-up Date</Label>
                    <Input
                      id="follow-up-date"
                      type="date"
                      value={newLog.followUpDate?.split("T")[0] || ""}
                      onChange={e => setNewLog({ ...newLog, followUpDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                    />
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button onClick={handleSaveLog}>
                Save Log
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Communications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(logs || []).length}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <ChatsCircle className="w-3 h-3" />
              All time
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{todayLogs}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Calendar className="w-3 h-3" />
              Logged today
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Follow-ups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{followUpCount}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Clock className="w-3 h-3" />
              Require action
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">96%</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <CheckCircle className="w-3 h-3" />
              Follow-ups completed
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search communications..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="teams">Teams</SelectItem>
            <SelectItem value="phone">Phone</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="in-person">In-Person</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Communication History ({filteredLogs.length})</CardTitle>
          <CardDescription>Complete audit trail of all fleet communications</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Participants</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead>Follow-up</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No communications logged. Start tracking conversations with vendors and team members.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      {new Date(log.date).toLocaleDateString()}
                      <div className="text-xs text-muted-foreground">
                        {new Date(log.date).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(log.type)} variant="secondary">
                        <span className="flex items-center gap-1">
                          {getTypeIcon(log.type)}
                          {log.type}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{log.subject}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {log.participants.slice(0, 2).map((p, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {p}
                          </Badge>
                        ))}
                        {log.participants.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{log.participants.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                      {log.summary}
                    </TableCell>
                    <TableCell>
                      {log.followUpRequired ? (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                          <Clock className="w-3 h-3 mr-1" />
                          {log.followUpDate ? new Date(log.followUpDate).toLocaleDateString() : "Required"}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {log.followUpRequired && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkFollowUpComplete(log.id)}
                        >
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
