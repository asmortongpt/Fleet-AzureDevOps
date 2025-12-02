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
import { Switch } from "@/components/ui/switch"
import {
  Plus,
  MagnifyingGlass,
  Robot,
  Play,
  Pause,
  CheckCircle,
  Warning,
  Brain,
  Lightning,
  Eye,
  ShieldCheck
} from "@phosphor-icons/react"
import { toast } from "sonner"
import type { Policy, PolicyType, PolicyMode, PolicyStatus } from "@/lib/policy-engine/types"

export function PolicyEngineWorkbench() {
  const [policies, setPolicies] = useState<Policy[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null)

  const [newPolicy, setNewPolicy] = useState<Partial<Policy>>({
    type: "safety",
    mode: "monitor",
    status: "draft",
    confidenceScore: 0.85,
    requiresDualControl: false,
    requiresMFAForExecution: false,
    conditions: [],
    actions: [],
    scope: {},
    tags: [],
    relatedPolicies: [],
    executionCount: 0,
    violationCount: 0
  })

  const filteredPolicies = (policies || []).filter(policy => {
    const matchesSearch =
      policy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || policy.type === filterType
    const matchesStatus = filterStatus === "all" || policy.status === filterStatus

    return matchesSearch && matchesType && matchesStatus
  })

  const handleSavePolicy = () => {
    if (!newPolicy.name || !newPolicy.description) {
      toast.error("Please fill in required fields")
      return
    }

    const policy: Policy = {
      id: selectedPolicy?.id || `policy-${Date.now()}`,
      tenantId: "tenant-demo",
      name: newPolicy.name,
      description: newPolicy.description,
      type: newPolicy.type as PolicyType,
      version: selectedPolicy?.version || "1.0.0",
      status: newPolicy.status as PolicyStatus,
      mode: newPolicy.mode as PolicyMode,
      conditions: newPolicy.conditions || [],
      actions: newPolicy.actions || [],
      scope: newPolicy.scope || {},
      confidenceScore: newPolicy.confidenceScore || 0.85,
      requiresDualControl: newPolicy.requiresDualControl || false,
      requiresMFAForExecution: newPolicy.requiresMFAForExecution || false,
      createdBy: "Current User",
      createdAt: selectedPolicy?.createdAt || new Date().toISOString(),
      lastModifiedBy: "Current User",
      lastModifiedAt: new Date().toISOString(),
      tags: newPolicy.tags || [],
      category: newPolicy.category || "general",
      relatedPolicies: newPolicy.relatedPolicies || [],
      executionCount: selectedPolicy?.executionCount || 0,
      violationCount: selectedPolicy?.violationCount || 0
    }

    if (selectedPolicy) {
      setPolicies(current => (current || []).map(p => (p.id === policy.id ? policy : p)))
      toast.success("Policy updated successfully")
    } else {
      setPolicies(current => [...(current || []), policy])
      toast.success("Policy created successfully")
    }

    setIsAddDialogOpen(false)
    resetForm()
  }

  const handleActivate = (policyId: string) => {
    setPolicies(current =>
      (current || []).map(p =>
        p.id === policyId ? { ...p, status: "active" as const } : p
      )
    )
    toast.success("Policy activated")
  }

  const handleDeactivate = (policyId: string) => {
    setPolicies(current =>
      (current || []).map(p =>
        p.id === policyId ? { ...p, status: "draft" as const } : p
      )
    )
    toast.success("Policy deactivated")
  }

  const handleTest = (policyId: string) => {
    toast.info("Starting policy simulation in sandbox environment...")
    // Simulate testing
    setTimeout(() => {
      setPolicies(current =>
        (current || []).map(p =>
          p.id === policyId ? { ...p, status: "testing" as const } : p
        )
      )
      toast.success("Policy test completed successfully")
    }, 2000)
  }

  const handleEdit = (policy: Policy) => {
    setSelectedPolicy(policy)
    setNewPolicy(policy)
    setIsAddDialogOpen(true)
  }

  const resetForm = () => {
    setSelectedPolicy(null)
    setNewPolicy({
      type: "safety",
      mode: "monitor",
      status: "draft",
      confidenceScore: 0.85,
      requiresDualControl: false,
      requiresMFAForExecution: false,
      conditions: [],
      actions: [],
      scope: {},
      tags: [],
      relatedPolicies: [],
      executionCount: 0,
      violationCount: 0
    })
  }

  const getPolicyTypeLabel = (type: PolicyType) => {
    const labels: Record<PolicyType, string> = {
      safety: "Safety",
      dispatch: "Dispatch",
      privacy: "Privacy",
      "ev-charging": "EV Charging",
      payments: "Payments",
      maintenance: "Maintenance",
      osha: "OSHA",
      environmental: "Environmental",
      "data-retention": "Data Retention",
      security: "Security",
      "vehicle-use": "Vehicle Use",
      "driver-behavior": "Driver Behavior"
    }
    return labels[type]
  }

  const getModeColor = (mode: PolicyMode) => {
    const colors = {
      monitor: "bg-blue-100 text-blue-700",
      "human-in-loop": "bg-yellow-100 text-yellow-700",
      autonomous: "bg-green-100 text-green-700"
    }
    return colors[mode]
  }

  const getStatusColor = (status: PolicyStatus) => {
    const colors = {
      draft: "bg-gray-100 text-gray-700",
      testing: "bg-blue-100 text-blue-700",
      approved: "bg-green-100 text-green-700",
      active: "bg-green-500 text-white",
      deprecated: "bg-orange-100 text-orange-700",
      archived: "bg-gray-100 text-gray-700"
    }
    return colors[status]
  }

  const getModeIcon = (mode: PolicyMode) => {
    const icons = {
      monitor: <Eye className="w-4 h-4" />,
      "human-in-loop": <ShieldCheck className="w-4 h-4" />,
      autonomous: <Lightning className="w-4 h-4" />
    }
    return icons[mode]
  }

  const totalPolicies = (policies || []).length
  const activePolicies = (policies || []).filter(p => p.status === "active").length
  const totalExecutions = (policies || []).reduce((sum, p) => sum + p.executionCount, 0)
  const totalViolations = (policies || []).reduce((sum, p) => sum + p.violationCount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Policy Engine Workbench</h2>
          <p className="text-muted-foreground">
            AI-driven compliance automation with Monitor, Human-in-Loop, and Autonomous modes
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
              Create Policy
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedPolicy ? "Edit Policy" : "Create New Policy"}
              </DialogTitle>
              <DialogDescription>
                Define automated compliance rules with AI-powered execution
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="policy-name">Policy Name *</Label>
                  <Input
                    id="policy-name"
                    value={newPolicy.name}
                    onChange={e => setNewPolicy({ ...newPolicy, name: e.target.value })}
                    placeholder="Speed Limit Enforcement"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="policy-type">Policy Type *</Label>
                  <Select
                    value={newPolicy.type}
                    onValueChange={value =>
                      setNewPolicy({ ...newPolicy, type: value as PolicyType })
                    }
                  >
                    <SelectTrigger id="policy-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="safety">Safety</SelectItem>
                      <SelectItem value="dispatch">Dispatch</SelectItem>
                      <SelectItem value="privacy">Privacy</SelectItem>
                      <SelectItem value="ev-charging">EV Charging</SelectItem>
                      <SelectItem value="payments">Payments</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="osha">OSHA</SelectItem>
                      <SelectItem value="environmental">Environmental</SelectItem>
                      <SelectItem value="data-retention">Data Retention</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="vehicle-use">Vehicle Use</SelectItem>
                      <SelectItem value="driver-behavior">Driver Behavior</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="policy-description">Description *</Label>
                <Textarea
                  id="policy-description"
                  value={newPolicy.description}
                  onChange={e => setNewPolicy({ ...newPolicy, description: e.target.value })}
                  placeholder="Enforce speed limits and generate alerts when exceeded..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="policy-mode">Execution Mode</Label>
                  <Select
                    value={newPolicy.mode}
                    onValueChange={value =>
                      setNewPolicy({ ...newPolicy, mode: value as PolicyMode })
                    }
                  >
                    <SelectTrigger id="policy-mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monitor">Monitor (Log Only)</SelectItem>
                      <SelectItem value="human-in-loop">Human-in-Loop (Require Approval)</SelectItem>
                      <SelectItem value="autonomous">Autonomous (Auto-Execute)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="policy-status">Status</Label>
                  <Select
                    value={newPolicy.status}
                    onValueChange={value =>
                      setNewPolicy({ ...newPolicy, status: value as PolicyStatus })
                    }
                  >
                    <SelectTrigger id="policy-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="testing">Testing</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="deprecated">Deprecated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confidence-score">AI Confidence Threshold</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="confidence-score"
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={newPolicy.confidenceScore}
                    onChange={e =>
                      setNewPolicy({
                        ...newPolicy,
                        confidenceScore: parseFloat(e.target.value)
                      })
                    }
                    className="flex-1"
                  />
                  <span className="text-sm font-medium min-w-[3rem]">
                    {Math.round((newPolicy.confidenceScore || 0.85) * 100)}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Minimum confidence level required for automated actions
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="dual-control" className="cursor-pointer">
                      Dual Control
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Require two authorized approvals
                    </p>
                  </div>
                  <Switch
                    id="dual-control"
                    checked={newPolicy.requiresDualControl}
                    onCheckedChange={checked =>
                      setNewPolicy({ ...newPolicy, requiresDualControl: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="mfa-execution" className="cursor-pointer">
                      MFA for Execution
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Require multi-factor authentication
                    </p>
                  </div>
                  <Switch
                    id="mfa-execution"
                    checked={newPolicy.requiresMFAForExecution}
                    onCheckedChange={checked =>
                      setNewPolicy({ ...newPolicy, requiresMFAForExecution: checked })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={newPolicy.category}
                  onChange={e => setNewPolicy({ ...newPolicy, category: e.target.value })}
                  placeholder="Regulatory, Operational, Safety..."
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
              <Button onClick={handleSavePolicy}>
                {selectedPolicy ? "Update" : "Create"} Policy
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Policies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPolicies}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Robot className="w-3 h-3" />
              All policies
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Policies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activePolicies}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <CheckCircle className="w-3 h-3" />
              Enforcing
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Executions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalExecutions}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Brain className="w-3 h-3" />
              All time
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Violations Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{totalViolations}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Warning className="w-3 h-3" />
              Flagged
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search policies..."
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
            <SelectItem value="safety">Safety</SelectItem>
            <SelectItem value="dispatch">Dispatch</SelectItem>
            <SelectItem value="osha">OSHA</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="testing">Testing</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="deprecated">Deprecated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Policies ({filteredPolicies.length})</CardTitle>
          <CardDescription>
            AI-powered compliance automation with configurable execution modes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Policy Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Executions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPolicies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No policies found. Create your first policy to start automated compliance monitoring.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPolicies.map(policy => (
                  <TableRow key={policy.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{policy.name}</div>
                        <div className="text-xs text-muted-foreground">v{policy.version}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getPolicyTypeLabel(policy.type)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getModeColor(policy.mode)} variant="secondary">
                        <span className="flex items-center gap-1">
                          {getModeIcon(policy.mode)}
                          {policy.mode}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium">
                          {Math.round(policy.confidenceScore * 100)}%
                        </div>
                        {policy.requiresDualControl && (
                          <Badge variant="outline" className="text-xs">
                            Dual
                          </Badge>
                        )}
                        {policy.requiresMFAForExecution && (
                          <Badge variant="outline" className="text-xs">
                            MFA
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{policy.executionCount} runs</div>
                        {policy.violationCount > 0 && (
                          <div className="text-xs text-orange-600">
                            {policy.violationCount} violations
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(policy.status)} variant="secondary">
                        {policy.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {policy.status === "draft" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTest(policy.id)}
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(policy)}>
                              Edit
                            </Button>
                          </>
                        )}
                        {policy.status === "approved" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleActivate(policy.id)}
                          >
                            Activate
                          </Button>
                        )}
                        {policy.status === "active" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeactivate(policy.id)}
                          >
                            <Pause className="w-4 h-4" />
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
