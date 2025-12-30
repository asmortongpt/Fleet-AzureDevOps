import {
  Plus,
  MagnifyingGlass,
  Warning,
  CheckCircle,
  Clock,
  FileText,
  Download,
  Cube
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


interface OSHAForm {
  id: string
  tenantId: string
  formType: "300" | "300A" | "301" | "incident" | "near-miss" | "jsa" | "inspection" | "custom"
  title: string
  description: string
  incidentDate: string
  reportedDate: string
  location: string
  department: string
  employeeId?: string
  employeeName?: string
  injuryType?: string
  bodyPart?: string
  severity: "minor" | "moderate" | "serious" | "critical" | "fatal"
  daysAway?: number
  daysRestricted?: number
  requiresMedicalAttention: boolean
  rootCause?: string
  correctiveAction?: string
  preventiveMeasures?: string
  witnesses: string[]
  photos: string[]
  status: "draft" | "submitted" | "under-review" | "approved" | "closed"
  submittedBy: string
  submittedAt: string
  reviewedBy?: string
  reviewedAt?: string
  approvedBy?: string
  approvedAt?: string
  notes?: string
}

export function OSHAForms() {
  const [forms, setForms] = useState<OSHAForm[]>([])
  const [_activeModule, setActiveModule] = useState("dashboard")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedForm, setSelectedForm] = useState<OSHAForm | null>(null)

  const [newForm, setNewForm] = useState<Partial<OSHAForm>>({
    formType: "incident",
    severity: "moderate",
    requiresMedicalAttention: false,
    witnesses: [],
    photos: [],
    status: "draft"
  })

  const filteredForms = (forms || []).filter(form => {
    const matchesSearch =
      form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (form.employeeName && form.employeeName.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = filterType === "all" || form.formType === filterType
    const matchesStatus = filterStatus === "all" || form.status === filterStatus

    return matchesSearch && matchesType && matchesStatus
  })

  const handleSaveForm = () => {
    if (!newForm.title || !newForm.incidentDate || !newForm.location) {
      toast.error("Please fill in required fields")
      return
    }

    const form: OSHAForm = {
      id: selectedForm?.id || `osha-${Date.now()}`,
      tenantId: "tenant-demo",
      formType: newForm.formType as OSHAForm["formType"],
      title: newForm.title,
      description: newForm.description || "",
      incidentDate: newForm.incidentDate,
      reportedDate: newForm.reportedDate || new Date().toISOString().split("T")[0],
      location: newForm.location,
      department: newForm.department || "",
      employeeId: newForm.employeeId,
      employeeName: newForm.employeeName,
      injuryType: newForm.injuryType,
      bodyPart: newForm.bodyPart,
      severity: newForm.severity as OSHAForm["severity"],
      daysAway: newForm.daysAway,
      daysRestricted: newForm.daysRestricted,
      requiresMedicalAttention: newForm.requiresMedicalAttention || false,
      rootCause: newForm.rootCause,
      correctiveAction: newForm.correctiveAction,
      preventiveMeasures: newForm.preventiveMeasures,
      witnesses: newForm.witnesses || [],
      photos: newForm.photos || [],
      status: newForm.status as OSHAForm["status"],
      submittedBy: "Current User",
      submittedAt: selectedForm?.submittedAt || new Date().toISOString(),
      reviewedBy: newForm.reviewedBy,
      reviewedAt: newForm.reviewedAt,
      approvedBy: newForm.approvedBy,
      approvedAt: newForm.approvedAt,
      notes: newForm.notes
    }

    if (selectedForm) {
      setForms(current =>
        (current || []).map(f => (f.id === form.id ? form : f))
      )
      toast.success("Form updated successfully")
    } else {
      setForms(current => [...(current || []), form])
      toast.success("Form created successfully")
    }

    setIsAddDialogOpen(false)
    resetForm()
  }

  const handleSubmit = (formId: string) => {
    setForms(current =>
      (current || []).map(f =>
        f.id === formId
          ? { ...f, status: "submitted" as const, submittedAt: new Date().toISOString() }
          : f
      )
    )
    toast.success("Form submitted for review")
  }

  const handleApprove = (formId: string) => {
    setForms(current =>
      (current || []).map(f =>
        f.id === formId
          ? {
              ...f,
              status: "approved" as const,
              approvedBy: "Safety Officer",
              approvedAt: new Date().toISOString()
            }
          : f
      )
    )
    toast.success("Form approved")
  }

  const handleEdit = (form: OSHAForm) => {
    setSelectedForm(form)
    setNewForm(form)
    setIsAddDialogOpen(true)
  }

  const handleViewIn3D = (form: OSHAForm) => {
    if (form.photos && form.photos.length > 0) {
      // Navigate to Virtual Garage 3D viewer
      setActiveModule("virtual-garage")
      toast.success(`Opening 3D viewer with ${form.photos.length} photos`)
    } else {
      toast.error("No photos available for 3D visualization")
    }
  }

  const resetForm = () => {
    setSelectedForm(null)
    setNewForm({
      formType: "incident",
      severity: "moderate",
      requiresMedicalAttention: false,
      witnesses: [],
      photos: [],
      status: "draft"
    })
  }

  const getFormTypeLabel = (type: OSHAForm["formType"]) => {
    const labels = {
      "300": "OSHA 300 Log",
      "300A": "OSHA 300A Summary",
      "301": "OSHA 301 Injury Report",
      incident: "Incident Report",
      "near-miss": "Near Miss Report",
      jsa: "Job Safety Analysis",
      inspection: "Safety Inspection",
      custom: "Custom Form"
    }
    return labels[type]
  }

  const getSeverityColor = (severity: OSHAForm["severity"]) => {
    const colors = {
      minor: "bg-green-100 text-green-700",
      moderate: "bg-yellow-100 text-yellow-700",
      serious: "bg-orange-100 text-orange-700",
      critical: "bg-red-100 text-red-700",
      fatal: "bg-black text-white"
    }
    return colors[severity]
  }

  const getStatusColor = (status: OSHAForm["status"]) => {
    const colors = {
      draft: "bg-gray-100 text-gray-700",
      submitted: "bg-blue-100 text-blue-700",
      "under-review": "bg-yellow-100 text-yellow-700",
      approved: "bg-green-100 text-green-700",
      closed: "bg-purple-100 text-purple-700"
    }
    return colors[status]
  }

  const totalForms = (forms || []).length
  const pendingReview = (forms || []).filter(f => f.status === "submitted" || f.status === "under-review").length
  const approvedForms = (forms || []).filter(f => f.status === "approved").length
  const criticalIncidents = (forms || []).filter(f => f.severity === "critical" || f.severity === "fatal").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">OSHA Safety Forms</h2>
          <p className="text-muted-foreground">
            Manage workplace safety incidents, near-misses, and compliance documentation
          </p>
        </div>
        <Dialog
          open={isAddDialogOpen}
          onOpenChange={open => {
            setIsAddDialogOpen(open)
            if (!open) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Form
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedForm ? "Edit Form" : "Create New OSHA Form"}
              </DialogTitle>
              <DialogDescription>
                Document workplace incidents, injuries, and safety observations
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="form-type">Form Type *</Label>
                  <Select
                    value={newForm.formType}
                    onValueChange={value =>
                      setNewForm({ ...newForm, formType: value as OSHAForm["formType"] })
                    }
                  >
                    <SelectTrigger id="form-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="300">OSHA 300 Log</SelectItem>
                      <SelectItem value="300A">OSHA 300A Summary</SelectItem>
                      <SelectItem value="301">OSHA 301 Injury Report</SelectItem>
                      <SelectItem value="incident">Incident Report</SelectItem>
                      <SelectItem value="near-miss">Near Miss Report</SelectItem>
                      <SelectItem value="jsa">Job Safety Analysis</SelectItem>
                      <SelectItem value="inspection">Safety Inspection</SelectItem>
                      <SelectItem value="custom">Custom Form</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="severity">Severity *</Label>
                  <Select
                    value={newForm.severity}
                    onValueChange={value =>
                      setNewForm({ ...newForm, severity: value as OSHAForm["severity"] })
                    }
                  >
                    <SelectTrigger id="severity">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minor">Minor</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="serious">Serious</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="fatal">Fatal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={newForm.title || ""}
                  onChange={e => setNewForm({ ...newForm, title: e.target.value })}
                  placeholder="Brief description of the incident"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newForm.description || ""}
                  onChange={e => setNewForm({ ...newForm, description: e.target.value })}
                  placeholder="Detailed description of what happened..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="incident-date">Incident Date *</Label>
                  <Input
                    id="incident-date"
                    type="date"
                    value={newForm.incidentDate || ""}
                    onChange={e => setNewForm({ ...newForm, incidentDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={newForm.location || ""}
                    onChange={e => setNewForm({ ...newForm, location: e.target.value })}
                    placeholder="Warehouse A, Bay 3"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={newForm.department || ""}
                    onChange={e => setNewForm({ ...newForm, department: e.target.value })}
                    placeholder="Operations"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employee-name">Employee Name</Label>
                  <Input
                    id="employee-name"
                    value={newForm.employeeName || ""}
                    onChange={e => setNewForm({ ...newForm, employeeName: e.target.value })}
                    placeholder="John Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employee-id">Employee ID</Label>
                  <Input
                    id="employee-id"
                    value={newForm.employeeId || ""}
                    onChange={e => setNewForm({ ...newForm, employeeId: e.target.value })}
                    placeholder="EMP12345"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="injury-type">Injury Type</Label>
                  <Input
                    id="injury-type"
                    value={newForm.injuryType || ""}
                    onChange={e => setNewForm({ ...newForm, injuryType: e.target.value })}
                    placeholder="Laceration, Strain, Burn..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="body-part">Body Part Affected</Label>
                  <Input
                    id="body-part"
                    value={newForm.bodyPart || ""}
                    onChange={e => setNewForm({ ...newForm, bodyPart: e.target.value })}
                    placeholder="Left hand"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveForm}>
                {selectedForm ? "Update Form" : "Create Form"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}