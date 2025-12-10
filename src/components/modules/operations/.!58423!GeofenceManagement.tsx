import { Plus, MagnifyingGlass, MapPin, Pencil, Trash, Copy } from "@phosphor-icons/react"
import { useState } from "react"
import { toast } from "sonner"

import { UniversalMap } from "@/components/UniversalMap"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useFleetData } from "@/hooks/use-fleet-data"


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
