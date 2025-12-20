import {
    MagnifyingGlass,
    Plus,
    Trash,
    Pencil,
    Copy,
    X,
    MapPin,
    Funnel
} from "@phosphor-icons/react"
import { useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Geofence } from "@/lib/types"

interface GeofenceControlPanelProps {
    isVisible: boolean;
    geofences: Geofence[];
    onGeofencesChange: (geofences: Geofence[]) => void;
    onClose: () => void;
}

export function GeofenceControlPanel({
    isVisible,
    geofences,
    onGeofencesChange,
    onClose
}: GeofenceControlPanelProps) {
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

    const filteredGeofences = geofences.filter(geofence => {
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
            name: newGeofence.name!,
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
            onGeofencesChange(geofences.map(g => g.id === geofence.id ? geofence : g))
            toast.success("Geofence updated successfully")
        } else {
            onGeofencesChange([...geofences, geofence])
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
        onGeofencesChange(geofences.filter(g => g.id !== geofenceId))
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
        onGeofencesChange([...geofences, duplicate])
        toast.success("Geofence duplicated")
    }

    const handleToggleActive = (geofenceId: string) => {
        onGeofencesChange(
            geofences.map(g =>
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

    if (!isVisible) return null;

    return (
        <>
            <Card className="fixed top-24 right-6 w-96 shadow-2xl z-40 border border-white/20 bg-white/80 backdrop-blur-xl animate-in slide-in-from-right-10 rounded-2xl overflow-hidden ring-1 ring-black/5 flex flex-col max-h-[calc(100vh-120px)]">
                <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-transparent pointer-events-none" />
                <CardHeader className="pb-4 border-b border-black/5 flex flex-row items-center justify-between space-y-0 relative z-10 bg-white/40 shrink-0">
                    <div>
                        <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
                            <div className="p-1.5 bg-blue-500/10 rounded-md border border-blue-500/20">
                                <MapPin weight="fill" className="text-blue-600 w-4 h-4" />
                            </div>
                            Geofences
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                            {geofences.filter(g => g.active).length} active monitoring
                        </p>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-black/5 rounded-full" onClick={() => {
                            resetForm();
                            setIsAddDialogOpen(true);
                        }}>
                            <Plus className="w-4 h-4 text-slate-700" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-black/5 rounded-full" onClick={onClose}>
                            <X className="w-4 h-4 text-slate-500" />
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="pt-4 flex-1 overflow-hidden flex flex-col">
                    {/* Filters */}
                    <div className="space-y-3 shrink-0 mb-4">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <MagnifyingGlass className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                                <Input
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8 h-8 text-sm"
                                />
                            </div>
                            <Select value={filterType} onValueChange={setFilterType}>
                                <SelectTrigger className="w-[100px] h-8 text-sm px-2">
                                    <Funnel className="w-3 h-3 mr-1" />
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="circle">Circle</SelectItem>
                                    <SelectItem value="polygon">Polygon</SelectItem>
                                    <SelectItem value="rectangle">Rect</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Geofence List */}
                    <div className="space-y-2 overflow-y-auto pr-2 flex-1">
                        {filteredGeofences.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                No geofences found.
                            </div>
                        ) : (
                            filteredGeofences.map(geofence => (
                                <div
                                    key={geofence.id}
                                    className="p-3 rounded-lg border border-slate-200 bg-white/50 hover:bg-white hover:border-slate-300 transition-all group"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full shrink-0"
                                                style={{ backgroundColor: geofence.color }}
                                            />
                                            <div className="font-medium text-sm truncate max-w-[140px]" title={geofence.name}>
                                                {geofence.name}
                                            </div>
                                        </div>
                                        <Switch
                                            checked={geofence.active}
                                            onCheckedChange={() => handleToggleActive(geofence.id)}
                                            className="scale-75 origin-right"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Badge variant="outline" className="text-[10px] h-4 px-1 py-0">
                                                {getTypeIcon(geofence.type)} {geofence.type}
                                            </Badge>
                                            {geofence.alertPriority !== "medium" && (
                                                <Badge variant="secondary" className="text-[10px] h-4 px-1 py-0 capitalize">
                                                    {geofence.alertPriority}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleEdit(geofence)}>
                                                <Pencil className="w-3 h-3" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleDuplicate(geofence)}>
                                                <Copy className="w-3 h-3" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:text-red-500" onClick={() => handleDelete(geofence.id)}>
                                                <Trash className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                setIsAddDialogOpen(open)
                if (!open) resetForm()
            }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{selectedGeofence ? "Edit Geofence" : "Create Geofence"}</DialogTitle>
                        <DialogDescription>
                            Define a geographic boundary
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
                                rows={2}
                            />
                        </div>

                        {newGeofence.type === "circle" && (
                            <div className="grid grid-cols-3 gap-4 bg-slate-50 p-3 rounded-md border">
                                <div className="space-y-2">
                                    <Label htmlFor="center-lat" className="text-xs">Latitude</Label>
                                    <Input
                                        id="center-lat"
                                        type="number"
                                        step="0.000001"
                                        value={newGeofence.center?.lat || ""}
                                        onChange={e => setNewGeofence({
                                            ...newGeofence,
                                            center: { lat: parseFloat(e.target.value), lng: newGeofence.center?.lng || 0 }
                                        })}
                                        className="h-8"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="center-lng" className="text-xs">Longitude</Label>
                                    <Input
                                        id="center-lng"
                                        type="number"
                                        step="0.000001"
                                        value={newGeofence.center?.lng || ""}
                                        onChange={e => setNewGeofence({
                                            ...newGeofence,
                                            center: { lat: newGeofence.center?.lat || 0, lng: parseFloat(e.target.value) }
                                        })}
                                        className="h-8"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="radius" className="text-xs">Radius (m)</Label>
                                    <Input
                                        id="radius"
                                        type="number"
                                        value={newGeofence.radius || 500}
                                        onChange={e => setNewGeofence({ ...newGeofence, radius: parseInt(e.target.value) })}
                                        className="h-8"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="alert-priority">Priority</Label>
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

                        <div className="space-y-3 border-t pt-3">
                            <Label className="text-xs text-muted-foreground uppercase">Trigger Events</Label>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="trigger-enter"
                                        checked={newGeofence.triggers?.onEnter}
                                        onCheckedChange={checked => setNewGeofence({
                                            ...newGeofence,
                                            triggers: { ...newGeofence.triggers!, onEnter: checked }
                                        })}
                                    />
                                    <Label htmlFor="trigger-enter" className="text-sm">Entry</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="trigger-exit"
                                        checked={newGeofence.triggers?.onExit}
                                        onCheckedChange={checked => setNewGeofence({
                                            ...newGeofence,
                                            triggers: { ...newGeofence.triggers!, onExit: checked }
                                        })}
                                    />
                                    <Label htmlFor="trigger-exit" className="text-sm">Exit</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="trigger-dwell"
                                        checked={newGeofence.triggers?.onDwell}
                                        onCheckedChange={checked => setNewGeofence({
                                            ...newGeofence,
                                            triggers: { ...newGeofence.triggers!, onDwell: checked }
                                        })}
                                    />
                                    <Label htmlFor="trigger-dwell" className="text-sm">Dwell</Label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveGeofence}>
                            {selectedGeofence ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
