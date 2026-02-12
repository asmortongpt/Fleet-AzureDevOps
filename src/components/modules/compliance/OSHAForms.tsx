import {
  Plus
} from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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
import { Textarea } from "@/components/ui/textarea"
import { secureFetch } from "@/hooks/use-api"
import { useAuth } from "@/hooks/useAuth"
import logger from "@/utils/logger"


interface OSHAForm {
  id: string
  tenantId: string
  caseNumber?: string
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
  const { user } = useAuth()
  const [forms, setForms] = useState<OSHAForm[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
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

  const mapStatusFromApi = (status?: string): OSHAForm["status"] => {
    const normalized = (status || '').toLowerCase()
    if (normalized === 'open') return 'submitted'
    if (normalized === 'investigating') return 'under-review'
    if (normalized === 'closed') return 'closed'
    return 'draft'
  }

  const mapStatusToApi = (status: OSHAForm["status"]): string => {
    switch (status) {
      case 'submitted':
        return 'open'
      case 'under-review':
        return 'investigating'
      case 'approved':
      case 'closed':
        return 'closed'
      default:
        return 'open'
    }
  }

  const mapFormFromApi = (row: any): OSHAForm => {
    const metadata = row.metadata && typeof row.metadata === 'object' ? row.metadata : {}
    return {
      id: row.id,
      tenantId: row.tenant_id,
      caseNumber: row.case_number,
      formType: metadata.formType || 'incident',
      title: metadata.title || row.case_number || 'OSHA Log Entry',
      description: row.incident_description || '',
      incidentDate: row.incident_date,
      reportedDate: row.reported_date || row.incident_date,
      location: row.location || '',
      department: metadata.department || '',
      employeeId: row.employee_id || undefined,
      employeeName: row.employee_name || metadata.employeeName,
      injuryType: row.injury_type || metadata.injuryType,
      bodyPart: row.body_part_affected || metadata.bodyPart,
      severity: metadata.severity || 'moderate',
      daysAway: row.days_away_from_work || 0,
      daysRestricted: row.days_restricted_duty || 0,
      requiresMedicalAttention: Boolean(metadata.requiresMedicalAttention || row.is_recordable),
      rootCause: metadata.rootCause,
      correctiveAction: metadata.correctiveAction,
      preventiveMeasures: metadata.preventiveMeasures,
      witnesses: Array.isArray(metadata.witnesses) ? metadata.witnesses : [],
      photos: Array.isArray(metadata.photos) ? metadata.photos : [],
      status: mapStatusFromApi(row.status),
      submittedBy: row.reported_by || metadata.submittedBy || '',
      submittedAt: row.reported_date || row.created_at || '',
      reviewedBy: metadata.reviewedBy,
      reviewedAt: metadata.reviewedAt,
      approvedBy: metadata.approvedBy,
      approvedAt: metadata.approvedAt,
      notes: metadata.notes
    }
  }

  const buildPayload = (form: Partial<OSHAForm>) => {
    const caseNumber = form.caseNumber || `OSHA-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`
    return {
      case_number: caseNumber,
      incident_date: form.incidentDate,
      incident_description: form.description || form.title || 'OSHA incident',
      employee_id: form.employeeId || null,
      employee_name: form.employeeName || null,
      job_title: null,
      body_part_affected: form.bodyPart || null,
      injury_type: form.injuryType || null,
      is_recordable: form.requiresMedicalAttention || form.severity !== 'minor',
      is_lost_time: (form.daysAway || 0) > 0,
      days_away_from_work: form.daysAway || 0,
      days_restricted_duty: form.daysRestricted || 0,
      location: form.location || null,
      vehicle_id: null,
      reported_date: form.reportedDate || form.incidentDate || null,
      status: mapStatusToApi(form.status as OSHAForm["status"]),
      metadata: {
        formType: form.formType,
        title: form.title,
        department: form.department,
        severity: form.severity,
        requiresMedicalAttention: form.requiresMedicalAttention,
        rootCause: form.rootCause,
        correctiveAction: form.correctiveAction,
        preventiveMeasures: form.preventiveMeasures,
        witnesses: form.witnesses || [],
        photos: form.photos || [],
        notes: form.notes,
        submittedBy: form.submittedBy || user?.email || user?.id,
        reviewedBy: form.reviewedBy,
        approvedBy: form.approvedBy
      }
    }
  }

  const loadForms = async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const response = await secureFetch('/api/osha-compliance/300-log')
      if (!response.ok) {
        throw new Error(`Failed to load OSHA forms (${response.status})`)
      }
      const payload = await response.json()
      const rows = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : []
      setForms(rows.map(mapFormFromApi))
    } catch (error: any) {
      setLoadError(error?.message || 'Failed to load OSHA forms')
      logger.error('OSHA forms load failed', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadForms()
  }, [])

  const filteredForms = (forms || []).filter(form => {
    const matchesSearch =
      form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (form.employeeName && form.employeeName.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = filterType === "all" || form.formType === filterType
    const matchesStatus = filterStatus === "all" || form.status === filterStatus

    return matchesSearch && matchesType && matchesStatus
  })

  const handleSaveForm = async () => {
    if (!newForm.title || !newForm.incidentDate || !newForm.location) {
      toast.error("Please fill in required fields")
      return
    }
    try {
      const payload = buildPayload(newForm)
      if (selectedForm) {
        const response = await secureFetch(`/api/osha-compliance/300-log/${selectedForm.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        })
        if (!response.ok) {
          throw new Error('Failed to update OSHA form')
        }
        const updated = await response.json()
        setForms(current => (current || []).map(f => (f.id === selectedForm.id ? mapFormFromApi(updated) : f)))
        toast.success("Form updated successfully")
      } else {
        const response = await secureFetch('/api/osha-compliance/300-log', {
          method: 'POST',
          body: JSON.stringify(payload)
        })
        if (!response.ok) {
          throw new Error('Failed to create OSHA form')
        }
        const created = await response.json()
        setForms(current => [...(current || []), mapFormFromApi(created)])
        toast.success("Form created successfully")
      }

      setIsAddDialogOpen(false)
      resetForm()
    } catch (error) {
      logger.error('OSHA form save failed', error)
      toast.error("Failed to save form")
    }
  }

  const handleSubmit = async (formId: string) => {
    const target = forms.find(f => f.id === formId)
    if (!target) return
    try {
      const payload = buildPayload({ ...target, status: "submitted" })
      const response = await secureFetch(`/api/osha-compliance/300-log/${formId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      })
      if (!response.ok) throw new Error('Failed to submit form')
      const updated = await response.json()
      setForms(current => (current || []).map(f => (f.id === formId ? mapFormFromApi(updated) : f)))
      toast.success("Form submitted for review")
    } catch (error) {
      logger.error('OSHA form submit failed', error)
      toast.error("Failed to submit form")
    }
  }

  const handleApprove = async (formId: string) => {
    const target = forms.find(f => f.id === formId)
    if (!target) return
    try {
      const payload = buildPayload({
        ...target,
        status: "approved",
        approvedBy: user?.email || user?.id,
        approvedAt: new Date().toISOString()
      })
      const response = await secureFetch(`/api/osha-compliance/300-log/${formId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      })
      if (!response.ok) throw new Error('Failed to approve form')
      const updated = await response.json()
      setForms(current => (current || []).map(f => (f.id === formId ? mapFormFromApi(updated) : f)))
      toast.success("Form approved")
    } catch (error) {
      logger.error('OSHA form approve failed', error)
      toast.error("Failed to approve form")
    }
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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">OSHA Safety Forms</h2>
          <p className="text-muted-foreground">
            Manage workplace safety incidents, near-misses, and compliance documentation
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-xs">
          {isLoading && <span className="text-muted-foreground">Loading OSHA forms…</span>}
          {loadError && <span className="text-destructive">{loadError}</span>}
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
            <div className="grid gap-2 py-2">
              <div className="grid grid-cols-2 gap-2">
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

              <div className="grid grid-cols-3 gap-2">
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

              <div className="grid grid-cols-2 gap-2">
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

              <div className="grid grid-cols-2 gap-2">
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
