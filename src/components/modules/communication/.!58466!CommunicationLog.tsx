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
import { useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { CommunicationLog as CommunicationLogType } from "@/lib/types"


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
