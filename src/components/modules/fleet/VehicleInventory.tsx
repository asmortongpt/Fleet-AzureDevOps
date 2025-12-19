/**
 * VehicleInventory Component
 *
 * Per-vehicle inventory tracking component for managing parts and supplies
 * assigned or used for specific vehicles.
 *
 * Features:
 * - Vehicle-specific parts inventory
 * - Maintenance history integration
 * - Parts usage tracking
 * - Cost analytics per vehicle
 * - Quick reorder from vehicle view
 * - Compatibility verification
 *
 * @security Admin/Manager only - enforced via usePermissions
 */

import {
  MagnifyingGlass,
  Package,
  TrendUp,
  Warning,
  ArrowsClockwise,
  Plus,
  Wrench,
  CalendarBlank,
  CurrencyDollar
} from "@phosphor-icons/react"
import { useState, useMemo, useCallback } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePermissions } from "@/hooks/usePermissions"
import { useVehicleInventory } from "@/hooks/useVehicleInventory"
import { Part } from "@/lib/types"
import logger from '@/utils/logger';
interface VehicleInventoryProps {
  vehicleId: string
  vehicleNumber: string
  vehicleMake?: string
  vehicleModel?: string
}

export function VehicleInventory({
  vehicleId,
  vehicleNumber,
  vehicleMake = "",
  vehicleModel = ""
}: VehicleInventoryProps) {
  const { hasAnyRole, isLoading: permissionsLoading } = usePermissions()
  const {
    assignedParts,
    usageHistory,
    compatibleParts,
    maintenanceHistory,
    isLoading,
    assignPart,
    removePart,
    recordUsage,
    refetch
  } = useVehicleInventory(vehicleId)

  const canManage = hasAnyRole("Admin", "FleetManager", "MaintenanceManager")

  // State
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTab, setSelectedTab] = useState("assigned")
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [isUsageDialogOpen, setIsUsageDialogOpen] = useState(false)
  const [selectedPart, setSelectedPart] = useState<Part | null>(null)
  const [usageData, setUsageData] = useState({
    quantity: 0,
    workOrderId: "",
    notes: ""
  })

  // Filtered parts
  const filteredAssignedParts = useMemo(() => {
    if (!searchTerm) return assignedParts || []

    const search = searchTerm.toLowerCase()
    return (assignedParts || []).filter(part =>
      part.partNumber.toLowerCase().includes(search) ||
      part.name.toLowerCase().includes(search) ||
      part.manufacturer.toLowerCase().includes(search)
    )
  }, [assignedParts, searchTerm])

  const filteredCompatibleParts = useMemo(() => {
    if (!searchTerm) return compatibleParts || []

    const search = searchTerm.toLowerCase()
    return (compatibleParts || []).filter(part =>
      part.partNumber.toLowerCase().includes(search) ||
      part.name.toLowerCase().includes(search) ||
      part.manufacturer.toLowerCase().includes(search)
    )
  }, [compatibleParts, searchTerm])

  // Metrics
  const metrics = useMemo(() => {
    const parts = assignedParts || []
    const history = usageHistory || []
    const last30Days = new Date()
    last30Days.setDate(last30Days.getDate() - 30)

    const recentUsage = history.filter(
      h => new Date(h.date) >= last30Days
    )

    return {
      totalPartsAssigned: parts.length,
      totalValue: parts.reduce((sum, p) => sum + (p.quantityOnHand * p.unitCost), 0),
      lowStockParts: parts.filter(p => p.quantityOnHand <= p.reorderPoint).length,
      partsUsedLast30Days: recentUsage.reduce((sum, h) => sum + Math.abs(h.quantity), 0),
      costLast30Days: recentUsage.reduce((sum, h) => sum + (h.cost || 0), 0),
      maintenanceEvents: (maintenanceHistory || []).length
    }
  }, [assignedParts, usageHistory, maintenanceHistory])

  // Handlers
  const handleAssignPart = useCallback(async (part: Part) => {
    try {
      await assignPart(part.id)
      toast.success(`${part.name} assigned to vehicle`)
      setIsAssignDialogOpen(false)
    } catch (error) {
      toast.error("Failed to assign part")
      logger.error(error)
    }
  }, [assignPart])

  const handleRemovePart = useCallback(async (partId: string) => {
    if (!confirm("Remove this part from the vehicle?")) return

    try {
      await removePart(partId)
      toast.success("Part removed from vehicle")
    } catch (error) {
      toast.error("Failed to remove part")
      logger.error(error)
    }
  }, [removePart])

  const handleRecordUsage = useCallback(async () => {
    if (!selectedPart || !usageData.quantity) {
      toast.error("Please fill in required fields")
      return
    }

    try {
      await recordUsage({
        partId: selectedPart.id,
        partNumber: selectedPart.partNumber,
        type: "usage",
        quantity: -Math.abs(usageData.quantity), // Negative for usage
        workOrderId: usageData.workOrderId,
        notes: usageData.notes,
        date: new Date().toISOString(),
        performedBy: "Current User", // Replace with actual user
        cost: selectedPart.unitCost * usageData.quantity
      })

      toast.success("Usage recorded")
      setIsUsageDialogOpen(false)
      setUsageData({ quantity: 0, workOrderId: "", notes: "" })
      setSelectedPart(null)
    } catch (error) {
      toast.error("Failed to record usage")
      logger.error(error)
    }
  }, [selectedPart, usageData, recordUsage])

  const getStockStatus = useCallback((part: Part) => {
    if (part.quantityOnHand === 0) {
      return { label: "Out of Stock", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100" }
    }
    if (part.quantityOnHand <= part.reorderPoint) {
      return { label: "Low Stock", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100" }
    }
    return { label: "In Stock", color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100" }
  }, [])

  const getStockLevel = useCallback((part: Part) => {
    return Math.min((part.quantityOnHand / part.maxStockLevel) * 100, 100)
  }, [])

  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <ArrowsClockwise className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!canManage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            You do not have permission to view vehicle inventory
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6" role="main" aria-label="Vehicle Inventory">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">
            Vehicle Inventory - {vehicleNumber}
          </h3>
          <p className="text-sm text-muted-foreground">
            {vehicleMake} {vehicleModel} - Parts and supplies tracking
          </p>
        </div>
        <Button onClick={() => setIsAssignDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Assign Parts
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Assigned Parts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalPartsAssigned}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Package className="w-3 h-3" />
              Active
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Parts Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.totalValue.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mt-1">
              <CurrencyDollar className="w-3 h-3" />
              Total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {metrics.lowStockParts}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Warning className="w-3 h-3" />
              Need attention
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Parts Used (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.partsUsedLast30Days}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <TrendUp className="w-3 h-3" />
              Units
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cost (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.costLast30Days.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <CurrencyDollar className="w-3 h-3" />
              Parts cost
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.maintenanceEvents}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Wrench className="w-3 h-3" />
              Events
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="assigned">Assigned Parts</TabsTrigger>
          <TabsTrigger value="compatible">Compatible Parts</TabsTrigger>
          <TabsTrigger value="usage">Usage History</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        {/* Assigned Parts Tab */}
        <TabsContent value="assigned" className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search assigned parts..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <ArrowsClockwise className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part Number</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Stock Level</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Cost</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssignedParts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          No parts assigned to this vehicle.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAssignedParts.map(part => {
                        const status = getStockStatus(part)
                        return (
                          <TableRow key={part.id}>
                            <TableCell className="font-mono text-sm">{part.partNumber}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{part.name}</div>
                                <div className="text-xs text-muted-foreground">{part.manufacturer}</div>
                              </div>
                            </TableCell>
                            <TableCell className="capitalize">{part.category}</TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <Progress value={getStockLevel(part)} className="h-2" />
                                <div className="text-xs text-muted-foreground">
                                  {part.quantityOnHand} / {part.maxStockLevel}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold">{part.quantityOnHand}</span>
                            </TableCell>
                            <TableCell>${part.unitCost.toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge className={status.color} variant="secondary">
                                {status.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPart(part)
                                    setIsUsageDialogOpen(true)
                                  }}
                                >
                                  <Wrench className="w-4 h-4 mr-1" />
                                  Use
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemovePart(part.id)}
                                >
                                  Remove
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compatible Parts Tab */}
        <TabsContent value="compatible" className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search compatible parts..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Part Number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Unit Cost</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompatibleParts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No compatible parts found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCompatibleParts.map(part => {
                      const status = getStockStatus(part)
                      return (
                        <TableRow key={part.id}>
                          <TableCell className="font-mono text-sm">{part.partNumber}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{part.name}</div>
                              <div className="text-xs text-muted-foreground">{part.manufacturer}</div>
                            </div>
                          </TableCell>
                          <TableCell className="capitalize">{part.category}</TableCell>
                          <TableCell>{part.quantityOnHand} units</TableCell>
                          <TableCell>${part.unitCost.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge className={status.color} variant="secondary">
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAssignPart(part)}
                              disabled={part.quantityOnHand === 0}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Assign
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage History Tab */}
        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usage History</CardTitle>
              <CardDescription>Parts usage and consumption records</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Part</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Work Order</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(usageHistory || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No usage history available.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (usageHistory || []).map(record => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CalendarBlank className="w-4 h-4 text-muted-foreground" />
                            {new Date(record.date).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{record.partNumber}</div>
                        </TableCell>
                        <TableCell>{Math.abs(record.quantity)} units</TableCell>
                        <TableCell className="font-mono text-sm">
                          {record.workOrderId || "-"}
                        </TableCell>
                        <TableCell>${(record.cost || 0).toFixed(2)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {record.notes || "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance History</CardTitle>
              <CardDescription>Service events and parts replacements</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Service Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Technician</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(maintenanceHistory || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No maintenance history available.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (maintenanceHistory || []).map(event => (
                      <TableRow key={event.id}>
                        <TableCell>{new Date(event.createdDate).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{event.serviceType}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{event.priority}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{event.status}</Badge>
                        </TableCell>
                        <TableCell>${(event.cost || 0).toFixed(2)}</TableCell>
                        <TableCell>{event.assignedTo || "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assign Parts Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Parts to Vehicle</DialogTitle>
            <DialogDescription>
              Select compatible parts to assign to {vehicleNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="relative mb-4">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search parts..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompatibleParts.map(part => (
                  <TableRow key={part.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{part.name}</div>
                        <div className="text-xs text-muted-foreground">{part.partNumber}</div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{part.category}</TableCell>
                    <TableCell>{part.quantityOnHand} units</TableCell>
                    <TableCell>
                      <Badge className={getStockStatus(part).color} variant="secondary">
                        {getStockStatus(part).label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => handleAssignPart(part)}
                        disabled={part.quantityOnHand === 0}
                      >
                        Assign
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Record Usage Dialog */}
      {selectedPart && (
        <Dialog open={isUsageDialogOpen} onOpenChange={setIsUsageDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Parts Usage</DialogTitle>
              <DialogDescription>
                Record usage of {selectedPart.name} for {vehicleNumber}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Quantity Used</Label>
                <Input
                  type="number"
                  min="1"
                  max={selectedPart.quantityOnHand}
                  value={usageData.quantity}
                  onChange={e => setUsageData({ ...usageData, quantity: parseInt(e.target.value) || 0 })}
                  placeholder="Enter quantity..."
                />
                <p className="text-xs text-muted-foreground">
                  Available: {selectedPart.quantityOnHand} units
                </p>
              </div>

              <div className="space-y-2">
                <Label>Work Order # (Optional)</Label>
                <Input
                  value={usageData.workOrderId}
                  onChange={e => setUsageData({ ...usageData, workOrderId: e.target.value })}
                  placeholder="WO-12345"
                />
              </div>

              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Input
                  value={usageData.notes}
                  onChange={e => setUsageData({ ...usageData, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>

              <div className="bg-muted p-3 rounded-md">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unit Cost:</span>
                    <span className="font-medium">${selectedPart.unitCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quantity:</span>
                    <span className="font-medium">{usageData.quantity} units</span>
                  </div>
                  <div className="flex justify-between border-t pt-1 mt-1">
                    <span className="text-muted-foreground">Total Cost:</span>
                    <span className="font-bold">
                      ${(selectedPart.unitCost * usageData.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUsageDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRecordUsage}>Record Usage</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
