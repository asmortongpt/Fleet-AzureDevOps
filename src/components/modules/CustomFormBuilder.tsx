import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, GripVertical, X, FileText, Save, Eye } from "lucide-react"

interface FormField {
  id: string
  type: "text" | "number" | "date" | "select" | "checkbox" | "textarea" | "signature" | "photo" | "file"
  label: string
  required: boolean
  options?: string[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
  conditionalOn?: {
    fieldId: string
    value: any
  }
}

interface CustomForm {
  id: string
  name: string
  description: string
  category: "osha" | "inspection" | "jsa" | "incident" | "custom"
  version: string
  status: "draft" | "published" | "archived"
  fields: FormField[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

export function CustomFormBuilder() {
  const [forms, setForms] = useState<CustomForm[]>([
    {
      id: "F001",
      name: "Daily Vehicle Inspection",
      description: "Pre-shift vehicle inspection checklist",
      category: "inspection",
      version: "1.2",
      status: "published",
      fields: [
        { id: "f1", type: "text", label: "Vehicle ID", required: true },
        { id: "f2", type: "text", label: "Driver Name", required: true },
        { id: "f3", type: "checkbox", label: "Tire Condition OK", required: true },
        { id: "f4", type: "checkbox", label: "Lights Functional", required: true },
        { id: "f5", type: "signature", label: "Driver Signature", required: true }
      ],
      createdBy: "admin@company.com",
      createdAt: "2024-01-15T08:00:00Z",
      updatedAt: "2024-02-20T10:30:00Z"
    }
  ])

  const [editingForm, setEditingForm] = useState<CustomForm | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const fieldTypes = [
    { value: "text", label: "Text Input" },
    { value: "number", label: "Number Input" },
    { value: "date", label: "Date Picker" },
    { value: "select", label: "Dropdown Select" },
    { value: "checkbox", label: "Checkbox" },
    { value: "textarea", label: "Text Area" },
    { value: "signature", label: "Signature Pad" },
    { value: "photo", label: "Photo Capture" },
    { value: "file", label: "File Upload" }
  ]

  const handleCreateForm = () => {
    const newForm: CustomForm = {
      id: `F${String(forms.length + 1).padStart(3, '0')}`,
      name: "New Form",
      description: "",
      category: "custom",
      version: "1.0",
      status: "draft",
      fields: [],
      createdBy: "current-user@company.com",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setEditingForm(newForm)
    setIsCreating(true)
  }

  const handleSaveForm = () => {
    if (editingForm) {
      if (isCreating) {
        setForms([...forms, editingForm])
      } else {
        setForms(forms.map(f => f.id === editingForm.id ? editingForm : f))
      }
      setEditingForm(null)
      setIsCreating(false)
    }
  }

  const handleAddField = () => {
    if (editingForm) {
      const newField: FormField = {
        id: `field_${Date.now()}`,
        type: "text",
        label: "New Field",
        required: false
      }
      setEditingForm({
        ...editingForm,
        fields: [...editingForm.fields, newField]
      })
    }
  }

  const handleRemoveField = (fieldId: string) => {
    if (editingForm) {
      setEditingForm({
        ...editingForm,
        fields: editingForm.fields.filter(f => f.id !== fieldId)
      })
    }
  }

  const handleUpdateField = (fieldId: string, updates: Partial<FormField>) => {
    if (editingForm) {
      setEditingForm({
        ...editingForm,
        fields: editingForm.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f)
      })
    }
  }

  const stats = {
    totalForms: forms.length,
    published: forms.filter(f => f.status === "published").length,
    draft: forms.filter(f => f.status === "draft").length,
    archived: forms.filter(f => f.status === "archived").length
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Custom Form Builder</h2>
          <p className="text-muted-foreground">
            Create custom inspection forms, OSHA reports, JSAs, and compliance documentation
          </p>
        </div>
        <Button onClick={handleCreateForm} size="lg">
          <Plus className="mr-2 h-5 w-5" />
          Create New Form
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Forms</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalForms}</div>
            <p className="text-xs text-muted-foreground">All categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.published}</div>
            <p className="text-xs text-muted-foreground">In active use</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft}</div>
            <p className="text-xs text-muted-foreground">In development</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Archived</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.archived}</div>
            <p className="text-xs text-muted-foreground">Legacy forms</p>
          </CardContent>
        </Card>
      </div>

      {editingForm ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{isCreating ? "Create New Form" : `Edit: ${editingForm.name}`}</CardTitle>
                <CardDescription>
                  Build custom forms with drag-and-drop fields, conditional logic, and validation rules
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setEditingForm(null); setIsCreating(false); }}>
                  Cancel
                </Button>
                <Button onClick={handleSaveForm}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Form
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="formName">Form Name</Label>
                <Input
                  id="formName"
                  value={editingForm.name}
                  onChange={(e) => setEditingForm({ ...editingForm, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={editingForm.category} onValueChange={(value: any) => setEditingForm({ ...editingForm, category: value })}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="osha">OSHA Form</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                    <SelectItem value="jsa">Job Safety Analysis</SelectItem>
                    <SelectItem value="incident">Incident Report</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={editingForm.description}
                  onChange={(e) => setEditingForm({ ...editingForm, description: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Form Fields ({editingForm.fields.length})</Label>
                <Button onClick={handleAddField} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Field
                </Button>
              </div>

              {editingForm.fields.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground">No fields added yet</p>
                  <Button onClick={handleAddField} variant="ghost" className="mt-2">
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Field
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {editingForm.fields.map((field, index) => (
                    <div key={field.id} className="flex items-start gap-3 p-4 border rounded-lg bg-muted/50">
                      <div className="cursor-move pt-2">
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 grid gap-3 md:grid-cols-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Field Type</Label>
                          <Select value={field.type} onValueChange={(value: any) => handleUpdateField(field.id, { type: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {fieldTypes.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-xs">Field Label</Label>
                          <Input
                            value={field.label}
                            onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                            placeholder="Enter field label"
                          />
                        </div>

                        <div className="space-y-2 flex items-end">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`required-${field.id}`}
                              checked={field.required}
                              onChange={(e) => handleUpdateField(field.id, { required: e.target.checked })}
                              className="rounded"
                            />
                            <Label htmlFor={`required-${field.id}`} className="text-xs cursor-pointer">
                              Required
                            </Label>
                          </div>
                        </div>

                        {field.type === "select" && (
                          <div className="space-y-2 md:col-span-4">
                            <Label className="text-xs">Options (comma-separated)</Label>
                            <Input
                              value={field.options?.join(", ") || ""}
                              onChange={(e) => handleUpdateField(field.id, { options: e.target.value.split(",").map(o => o.trim()) })}
                              placeholder="Option 1, Option 2, Option 3"
                            />
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveField(field.id)}
                        className="text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Forms</TabsTrigger>
            <TabsTrigger value="osha">OSHA</TabsTrigger>
            <TabsTrigger value="inspection">Inspections</TabsTrigger>
            <TabsTrigger value="jsa">JSA</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {forms.map((form) => (
                <Card key={form.id} className="hover:border-primary transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{form.name}</CardTitle>
                        <CardDescription className="mt-1">{form.description}</CardDescription>
                      </div>
                      <Badge variant={form.status === "published" ? "default" : form.status === "draft" ? "secondary" : "outline"}>
                        {form.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Fields</span>
                        <span className="font-medium">{form.fields.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Version</span>
                        <span className="font-medium">{form.version}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Category</span>
                        <Badge variant="outline">{form.category}</Badge>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditingForm(form)}>
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="osha">
            <Card>
              <CardHeader>
                <CardTitle>OSHA Forms</CardTitle>
                <CardDescription>OSHA 300, 300A, 301, and custom safety forms</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {forms.filter(f => f.category === "osha").length} OSHA forms available
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inspection">
            <Card>
              <CardHeader>
                <CardTitle>Inspection Forms</CardTitle>
                <CardDescription>Vehicle and equipment inspection checklists</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {forms.filter(f => f.category === "inspection").length} inspection forms available
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jsa">
            <Card>
              <CardHeader>
                <CardTitle>Job Safety Analysis Forms</CardTitle>
                <CardDescription>JSA and hazard assessment documentation</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {forms.filter(f => f.category === "jsa").length} JSA forms available
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
