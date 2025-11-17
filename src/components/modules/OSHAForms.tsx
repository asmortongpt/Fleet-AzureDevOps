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
  FirstAid,
  Warning,
  CheckCircle,
  Clock,
  FileText,
  Download,
  Cube
} from "@phosphor-icons/react"
import { useState } from "react"
import { toast } from "sonner"

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
  const [activeModule, setActiveModule] = useState("dashboard")
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
                  value={newForm.title}
                  onChange={e => setNewForm({ ...newForm, title: e.target.value })}
                  placeholder="Brief description of the incident"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newForm.description}
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
                    value={newForm.incidentDate}
                    onChange={e => setNewForm({ ...newForm, incidentDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={newForm.location}
                    onChange={e => setNewForm({ ...newForm, location: e.target.value })}
                    placeholder="Warehouse A, Bay 3"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={newForm.department}
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
                    value={newForm.employeeName}
                    onChange={e => setNewForm({ ...newForm, employeeName: e.target.value })}
                    placeholder="John Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employee-id">Employee ID</Label>
                  <Input
                    id="employee-id"
                    value={newForm.employeeId}
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
                    value={newForm.injuryType}
                    onChange={e => setNewForm({ ...newForm, injuryType: e.target.value })}
                    placeholder="Laceration, Strain, Burn..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="body-part">Body Part Affected</Label>
                  <Input
                    id="body-part"
                    value={newForm.bodyPart}
                    onChange={e => setNewForm({ ...newForm, bodyPart: e.target.value })}
                    placeholder="Left hand, Back, Head..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="days-away">Days Away from Work</Label>
                  <Input
                    id="days-away"
                    type="number"
                    value={newForm.daysAway || ""}
                    onChange={e =>
                      setNewForm({ ...newForm, daysAway: parseInt(e.target.value) || undefined })
                    }
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="days-restricted">Days Restricted Duty</Label>
                  <Input
                    id="days-restricted"
                    type="number"
                    value={newForm.daysRestricted || ""}
                    onChange={e =>
                      setNewForm({
                        ...newForm,
                        daysRestricted: parseInt(e.target.value) || undefined
                      })
                    }
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="medical-attention"
                  checked={newForm.requiresMedicalAttention}
                  onCheckedChange={checked =>
                    setNewForm({ ...newForm, requiresMedicalAttention: checked as boolean })
                  }
                />
                <Label htmlFor="medical-attention" className="cursor-pointer">
                  Requires Medical Attention
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="root-cause">Root Cause Analysis</Label>
                <Textarea
                  id="root-cause"
                  value={newForm.rootCause}
                  onChange={e => setNewForm({ ...newForm, rootCause: e.target.value })}
                  placeholder="What caused this incident?"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="corrective-action">Corrective Action Taken</Label>
                <Textarea
                  id="corrective-action"
                  value={newForm.correctiveAction}
                  onChange={e => setNewForm({ ...newForm, correctiveAction: e.target.value })}
                  placeholder="What actions were taken to address this?"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preventive-measures">Preventive Measures</Label>
                <Textarea
                  id="preventive-measures"
                  value={newForm.preventiveMeasures}
                  onChange={e => setNewForm({ ...newForm, preventiveMeasures: e.target.value })}
                  placeholder="How will this be prevented in the future?"
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveForm}>
                {selectedForm ? "Update" : "Create"} Form
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Forms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalForms}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <FileText className="w-3 h-3" />
              All time
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingReview}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Clock className="w-3 h-3" />
              Awaiting action
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedForms}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <CheckCircle className="w-3 h-3" />
              Closed out
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Critical Incidents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalIncidents}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Warning className="w-3 h-3" />
              High severity
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search forms..."
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
            <SelectItem value="300">OSHA 300</SelectItem>
            <SelectItem value="300A">OSHA 300A</SelectItem>
            <SelectItem value="301">OSHA 301</SelectItem>
            <SelectItem value="incident">Incident</SelectItem>
            <SelectItem value="near-miss">Near Miss</SelectItem>
            <SelectItem value="jsa">JSA</SelectItem>
            <SelectItem value="inspection">Inspection</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="under-review">Under Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Safety Forms ({filteredForms.length})</CardTitle>
          <CardDescription>OSHA compliance and workplace safety documentation</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Form Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredForms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No forms found. Create your first OSHA form to track workplace safety.
                  </TableCell>
                </TableRow>
              ) : (
                filteredForms.map(form => (
                  <TableRow key={form.id}>
                    <TableCell>
                      <Badge variant="outline">{getFormTypeLabel(form.formType)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{form.title}</div>
                        <div className="text-xs text-muted-foreground">{form.location}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(form.incidentDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {form.employeeName || <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>
                      <Badge className={getSeverityColor(form.severity)} variant="secondary">
                        {form.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(form.status)} variant="secondary">
                        {form.status.replace("-", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(form)}>
                          Edit
                        </Button>
                        {form.status === "draft" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSubmit(form.id)}
                          >
                            Submit
                          </Button>
                        )}
                        {form.status === "submitted" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleApprove(form.id)}
                          >
                            Approve
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                        {form.photos && form.photos.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewIn3D(form)}
                            title="View damage in 3D"
                          >
                            <Cube className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
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
