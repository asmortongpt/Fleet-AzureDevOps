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
import { Plus, MagnifyingGlass, MapPin, Pencil, Trash, Copy } from "@phosphor-icons/react"
import { UniversalMap } from "@/components/UniversalMap"
import { useFleetData } from "@/hooks/use-fleet-data"
import { useState } from "react"
import { toast } from "sonner"

interface Geofence {
  id: string
  tenantId: string
  name: string
  description: string
  type: "circle" | "polygon" | "rectangle"
  center?: { lat: number; lng: number }
  radius?: number // meters for circle
  coordinates?: { lat: number; lng: number }[] // for polygon/rectangle
  color: string
  active: boolean
  triggers: {
    onEnter: boolean
    onExit: boolean
    onDwell: boolean
    dwellTimeMinutes?: number
  }
  notifyUsers: string[]
  notifyRoles: string[]
  alertPriority: "low" | "medium" | "high" | "critical"
  createdBy: string
  createdAt: string
  lastModified: string
}

export function GeofenceManagement() {
  const fleetData = useFleetData()
  const vehicles = fleetData.vehicles || []
  const facilities = fleetData.facilities || []

  const [geofences, setGeofences] = useState<Geofence[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedGeofence, setSelectedGeofence] = useState<Geofence | null>(null)

  const [newGeofence, setNewGeofence] = useState<Partial<Geofence>>({
    name: "",
    description: "",
    type: "circle",
    color: "#3B82F6",
    active: true,
    triggers: {
      onEnter: true,
      onExit: true,
      onDwell: false
    },
    notifyUsers: [],
    notifyRoles: [],
    alertPriority: "medium"
  })

  const filteredGeofences = (geofences || []).filter(geofence => {
    const matchesSearch = 
      geofence.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      geofence.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || geofence.type === filterType

    return matchesSearch && matchesType
  })

  const handleSaveGeofence = () => {
    if (!newGeofence.name) {
      toast.error("Please enter a geofence name")
      return
    }

    if (newGeofence.type === "circle" && !newGeofence.center) {
      toast.error("Please set a center point for the circle geofence")
      return
    }

    const geofence: Geofence = {
      id: selectedGeofence?.id || `geofence-${Date.now()}`,
      tenantId: "tenant-demo",
      name: newGeofence.name,
      description: newGeofence.description || "",
      type: newGeofence.type as Geofence["type"],
      center: newGeofence.center,
      radius: newGeofence.radius || 500,
      coordinates: newGeofence.coordinates || [],
      color: newGeofence.color || "#3B82F6",
      active: newGeofence.active !== false,
      triggers: newGeofence.triggers || {
        onEnter: true,
        onExit: true,
        onDwell: false
      },
      notifyUsers: newGeofence.notifyUsers || [],
      notifyRoles: newGeofence.notifyRoles || [],
      alertPriority: newGeofence.alertPriority || "medium",
      createdBy: "Current User",
      createdAt: selectedGeofence?.createdAt || new Date().toISOString(),
      lastModified: new Date().toISOString()
    }

    if (selectedGeofence) {
      setGeofences(current => 
        (current || []).map(g => g.id === geofence.id ? geofence : g)
      )
      toast.success("Geofence updated successfully")
    } else {
      setGeofences(current => [...(current || []), geofence])
      toast.success("Geofence created successfully")
    }

    setIsAddDialogOpen(false)
    resetForm()
  }

  const handleEdit = (geofence: Geofence) => {
    setSelectedGeofence(geofence)
    setNewGeofence(geofence)
    setIsAddDialogOpen(true)
  }

  const handleDelete = (geofenceId: string) => {
    setGeofences(current => (current || []).filter(g => g.id !== geofenceId))
    toast.success("Geofence deleted")
  }

  const handleDuplicate = (geofence: Geofence) => {
    const duplicate: Geofence = {
      ...geofence,
      id: `geofence-${Date.now()}`,
      name: `${geofence.name} (Copy)`,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    }
    setGeofences(current => [...(current || []), duplicate])
    toast.success("Geofence duplicated")
  }

  const handleToggleActive = (geofenceId: string) => {
    setGeofences(current =>
      (current || []).map(g =>
        g.id === geofenceId ? { ...g, active: !g.active } : g
      )
    )
  }

  const resetForm = () => {
    setSelectedGeofence(null)
    setNewGeofence({
      name: "",
      description: "",
      type: "circle",
      color: "#3B82F6",
      active: true,
      triggers: {
        onEnter: true,
        onExit: true,
        onDwell: false
      },
      notifyUsers: [],
      notifyRoles: [],
      alertPriority: "medium"
    })
  }

  const getTypeIcon = (type: Geofence["type"]) => {
    const icons = {
      circle: "○",
      polygon: "▱",
      rectangle: "▭"
    }
    return icons[type]
  }

  const getPriorityColor = (priority: Geofence["alertPriority"]) => {
    const colors = {
      low: "bg-gray-100 text-gray-700",
      medium: "bg-blue-100 text-blue-700",
      high: "bg-orange-100 text-orange-700",
      critical: "bg-red-100 text-red-700"
    }
    return colors[priority]
  }

  const activeGeofences = (geofences || []).filter(g => g.active).length
  const totalEvents = (geofences || []).reduce((sum, g) => {
    let count = 0
    if (g.triggers.onEnter) count++
    if (g.triggers.onExit) count++
    if (g.triggers.onDwell) count++
    return sum + count
  }, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Geofence Management</h2>
          <p className="text-muted-foreground">Create and manage geographic boundaries with automated alerts</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Geofence
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedGeofence ? "Edit Geofence" : "Create New Geofence"}</DialogTitle>
              <DialogDescription>
                Define a geographic boundary with automatic entry/exit/dwell detection
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="geofence-name">Name *</Label>
                  <Input
                    id="geofence-name"
                    value={newGeofence.name}
                    onChange={e => setNewGeofence({ ...newGeofence, name: e.target.value })}
                    placeholder="Warehouse A"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="geofence-type">Type</Label>
                  <Select
                    value={newGeofence.type}
                    onValueChange={value => setNewGeofence({ ...newGeofence, type: value as Geofence["type"] })}
                  >
                    <SelectTrigger id="geofence-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="circle">Circle</SelectItem>
                      <SelectItem value="polygon">Polygon</SelectItem>
                      <SelectItem value="rectangle">Rectangle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="geofence-description">Description</Label>
                <Textarea
                  id="geofence-description"
                  value={newGeofence.description}
                  onChange={e => setNewGeofence({ ...newGeofence, description: e.target.value })}
                  placeholder="Main warehouse facility in downtown..."
                  rows={2}
                />
              </div>

              {newGeofence.type === "circle" && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="center-lat">Center Latitude</Label>
                    <Input
                      id="center-lat"
                      type="number"
                      step="0.000001"
                      value={newGeofence.center?.lat || ""}
                      onChange={e => setNewGeofence({
                        ...newGeofence,
                        center: { lat: parseFloat(e.target.value), lng: newGeofence.center?.lng || 0 }
                      })}
                      placeholder="27.9506"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="center-lng">Center Longitude</Label>
                    <Input
                      id="center-lng"
                      type="number"
                      step="0.000001"
                      value={newGeofence.center?.lng || ""}
                      onChange={e => setNewGeofence({
                        ...newGeofence,
                        center: { lat: newGeofence.center?.lat || 0, lng: parseFloat(e.target.value) }
                      })}
                      placeholder="-82.4572"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="radius">Radius (meters)</Label>
                    <Input
                      id="radius"
                      type="number"
                      value={newGeofence.radius || 500}
                      onChange={e => setNewGeofence({ ...newGeofence, radius: parseInt(e.target.value) })}
                      placeholder="500"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Label>Trigger Events</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="trigger-enter" className="cursor-pointer flex-1">
                      Alert on Entry
                    </Label>
                    <Switch
                      id="trigger-enter"
                      checked={newGeofence.triggers?.onEnter}
                      onCheckedChange={checked => setNewGeofence({
                        ...newGeofence,
                        triggers: { ...newGeofence.triggers!, onEnter: checked }
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="trigger-exit" className="cursor-pointer flex-1">
                      Alert on Exit
                    </Label>
                    <Switch
                      id="trigger-exit"
                      checked={newGeofence.triggers?.onExit}
                      onCheckedChange={checked => setNewGeofence({
                        ...newGeofence,
                        triggers: { ...newGeofence.triggers!, onExit: checked }
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="trigger-dwell" className="cursor-pointer flex-1">
                      Alert on Dwell (extended stay)
                    </Label>
                    <Switch
                      id="trigger-dwell"
                      checked={newGeofence.triggers?.onDwell}
                      onCheckedChange={checked => setNewGeofence({
                        ...newGeofence,
                        triggers: { ...newGeofence.triggers!, onDwell: checked }
                      })}
                    />
                  </div>
                  {newGeofence.triggers?.onDwell && (
                    <div className="ml-6 space-y-2">
                      <Label htmlFor="dwell-time">Dwell Time (minutes)</Label>
                      <Input
                        id="dwell-time"
                        type="number"
                        value={newGeofence.triggers?.dwellTimeMinutes || 15}
                        onChange={e => setNewGeofence({
                          ...newGeofence,
                          triggers: { ...newGeofence.triggers!, dwellTimeMinutes: parseInt(e.target.value) }
                        })}
                        placeholder="15"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="alert-priority">Alert Priority</Label>
                  <Select
                    value={newGeofence.alertPriority}
                    onValueChange={value => setNewGeofence({ ...newGeofence, alertPriority: value as Geofence["alertPriority"] })}
                  >
                    <SelectTrigger id="alert-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    type="color"
                    value={newGeofence.color}
                    onChange={e => setNewGeofence({ ...newGeofence, color: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="active" className="cursor-pointer">
                  Active
                </Label>
                <Switch
                  id="active"
                  checked={newGeofence.active !== false}
                  onCheckedChange={checked => setNewGeofence({ ...newGeofence, active: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button onClick={handleSaveGeofence}>
                {selectedGeofence ? "Update" : "Create"} Geofence
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Geofences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(geofences || []).length}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <MapPin className="w-3 h-3" />
              Defined areas
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Geofences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeGeofences}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <MapPin className="w-3 h-3" />
              Monitoring
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Trigger Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalEvents}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <MapPin className="w-3 h-3" />
              Configured
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Events Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <MapPin className="w-3 h-3" />
              Triggered
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search geofences..."
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
            <SelectItem value="circle">Circle</SelectItem>
            <SelectItem value="polygon">Polygon</SelectItem>
            <SelectItem value="rectangle">Rectangle</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Geofence Map Visualization</CardTitle>
          <CardDescription>
            View vehicles and facilities with geofence boundaries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] rounded-lg overflow-hidden border">
            <UniversalMap
              vehicles={vehicles}
              facilities={facilities}
              showVehicles={true}
              showFacilities={true}
              mapStyle="road"
              className="w-full h-full"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Geofences ({filteredGeofences.length})</CardTitle>
          <CardDescription>Geographic boundaries with automated monitoring</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Triggers</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGeofences.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No geofences found. Create your first geofence to start monitoring vehicle locations.
                  </TableCell>
                </TableRow>
              ) : (
                filteredGeofences.map(geofence => (
                  <TableRow key={geofence.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded" 
                          style={{ backgroundColor: geofence.color }}
                        />
                        <div>
                          <div className="font-medium">{geofence.name}</div>
                          <div className="text-xs text-muted-foreground">{geofence.description}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xl">{getTypeIcon(geofence.type)}</span>
                      <span className="ml-2 text-sm capitalize">{geofence.type}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {geofence.triggers.onEnter && (
                          <Badge variant="outline" className="text-xs">Entry</Badge>
                        )}
                        {geofence.triggers.onExit && (
                          <Badge variant="outline" className="text-xs">Exit</Badge>
                        )}
                        {geofence.triggers.onDwell && (
                          <Badge variant="outline" className="text-xs">
                            Dwell ({geofence.triggers.dwellTimeMinutes}m)
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(geofence.alertPriority)} variant="secondary">
                        {geofence.alertPriority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={geofence.active}
                          onCheckedChange={() => handleToggleActive(geofence.id)}
                        />
                        <span className="text-sm text-muted-foreground">
                          {geofence.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(geofence)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicate(geofence)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(geofence.id)}
                        >
                          <Trash className="w-4 h-4 text-red-600" />
                        </Button>
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
