/**
 * InventoryManagement Component
 *
 * Enterprise-grade inventory management interface for fleet parts and supplies.
 * Implements Fortune 50 UI/UX standards with comprehensive stock tracking,
 * barcode scanning simulation, and real-time alerts.
 *
 * Features:
 * - Multi-category inventory tracking
 * - Low stock alerts and reorder notifications
 * - Barcode scanning simulation
 * - Advanced search and filtering
 * - Bulk operations
 * - Export capabilities
 * - Role-based access control
 *
 * @security Admin/Manager only - enforced via usePermissions
 */

import { useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Plus,
  MagnifyingGlass,
  Package,
  TrendUp,
  TrendDown,
  Warning,
  Barcode,
  DownloadSimple,
  DotsThreeVertical,
  PencilSimple,
  Trash,
  ShoppingCart,
  ArrowsClockwise,
  FunnelSimple
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { usePermissions } from "@/hooks/usePermissions"
import { useInventory } from "@/hooks/useInventory"
import { Part, InventoryTransaction } from "@/lib/types"

interface InventoryFilters {
  category: string
  status: "all" | "in-stock" | "low-stock" | "out-of-stock" | "overstocked"
  searchTerm: string
  sortBy: "name" | "quantity" | "value" | "last-used"
  sortOrder: "asc" | "desc"
}

export function InventoryManagement() {
  const { hasAnyRole, isLoading: permissionsLoading } = usePermissions()
  const {
    parts,
    isLoading,
    addPart,
    updatePart,
    deletePart,
    createTransaction,
    refetch
  } = useInventory()

  // Permission check
  const canManage = hasAnyRole("Admin", "FleetManager", "MaintenanceManager")

  // State
  const [filters, setFilters] = useState<InventoryFilters>({
    category: "all",
    status: "all",
    searchTerm: "",
    sortBy: "name",
    sortOrder: "asc"
  })
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isBarcodeDialogOpen, setIsBarcodeDialogOpen] = useState(false)
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false)
  const [selectedPart, setSelectedPart] = useState<Part | null>(null)
  const [newPart, setNewPart] = useState<Partial<Part>>({
    partNumber: "",
    name: "",
    description: "",
    category: "other",
    manufacturer: "",
    compatibleVehicles: [],
    quantityOnHand: 0,
    minStockLevel: 10,
    maxStockLevel: 100,
    reorderPoint: 20,
    unitCost: 0,
    location: "",
    alternateVendors: []
  })
  const [barcodeInput, setBarcodeInput] = useState("")
  const [transactionData, setTransactionData] = useState<Partial<InventoryTransaction>>({
    type: "adjustment",
    quantity: 0,
    notes: ""
  })

  // Filtered and sorted parts
  const filteredParts = useMemo(() => {
    let result = parts || []

    // Search filter
    if (filters.searchTerm) {
      const search = filters.searchTerm.toLowerCase()
      result = result.filter(part =>
        part.partNumber.toLowerCase().includes(search) ||
        part.name.toLowerCase().includes(search) ||
        part.manufacturer.toLowerCase().includes(search) ||
        part.description.toLowerCase().includes(search)
      )
    }

    // Category filter
    if (filters.category !== "all") {
      result = result.filter(part => part.category === filters.category)
    }

    // Status filter
    if (filters.status !== "all") {
      result = result.filter(part => {
        const status = getStockStatus(part)
        switch (filters.status) {
          case "in-stock":
            return status.type === "in-stock"
          case "low-stock":
            return status.type === "low-stock"
          case "out-of-stock":
            return status.type === "out-of-stock"
          case "overstocked":
            return status.type === "overstocked"
          default:
            return true
        }
      })
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0
      switch (filters.sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "quantity":
          comparison = a.quantityOnHand - b.quantityOnHand
          break
        case "value":
          comparison = (a.quantityOnHand * a.unitCost) - (b.quantityOnHand * b.unitCost)
          break
        case "last-used":
          comparison = (a.lastUsed || "").localeCompare(b.lastUsed || "")
          break
      }
      return filters.sortOrder === "asc" ? comparison : -comparison
    })

    return result
  }, [parts, filters])

  // Metrics
  const metrics = useMemo(() => {
    const allParts = parts || []
    return {
      totalParts: allParts.length,
      totalValue: allParts.reduce((sum, p) => sum + (p.quantityOnHand * p.unitCost), 0),
      lowStock: allParts.filter(p => p.quantityOnHand > 0 && p.quantityOnHand <= p.reorderPoint).length,
      outOfStock: allParts.filter(p => p.quantityOnHand === 0).length,
      overstocked: allParts.filter(p => p.quantityOnHand >= p.maxStockLevel).length,
      needsReorder: allParts.filter(p => p.quantityOnHand <= p.reorderPoint).length
    }
  }, [parts])

  // Get stock status
  const getStockStatus = useCallback((part: Part) => {
    if (part.quantityOnHand === 0) {
      return {
        type: "out-of-stock" as const,
        label: "Out of Stock",
        color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100"
      }
    }
    if (part.quantityOnHand <= part.reorderPoint) {
      return {
        type: "low-stock" as const,
        label: "Low Stock",
        color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100"
      }
    }
    if (part.quantityOnHand >= part.maxStockLevel) {
      return {
        type: "overstocked" as const,
        label: "Overstocked",
        color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100"
      }
    }
    return {
      type: "in-stock" as const,
      label: "In Stock",
      color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100"
    }
  }, [])

  // Get stock level percentage
  const getStockLevel = useCallback((part: Part) => {
    return Math.min((part.quantityOnHand / part.maxStockLevel) * 100, 100)
  }, [])

  // Handlers
  const handleAddPart = useCallback(async () => {
    if (!newPart.partNumber || !newPart.name) {
      toast.error("Part Number and Name are required")
      return
    }

    try {
      await addPart(newPart as Part)
      toast.success("Part added to inventory")
      setIsAddDialogOpen(false)
      resetNewPart()
    } catch (error) {
      toast.error("Failed to add part")
      // Error already shown to user via toast
    }
  }, [newPart, addPart])

  const handleUpdatePart = useCallback(async () => {
    if (!selectedPart) return

    try {
      await updatePart(selectedPart.id, selectedPart)
      toast.success("Part updated successfully")
      setIsEditDialogOpen(false)
      setSelectedPart(null)
    } catch (error) {
      toast.error("Failed to update part")
      // Error already shown to user via toast
    }
  }, [selectedPart, updatePart])

  const handleDeletePart = useCallback(async (partId: string) => {
    if (!confirm("Are you sure you want to delete this part?")) return

    try {
      await deletePart(partId)
      toast.success("Part deleted successfully")
    } catch (error) {
      toast.error("Failed to delete part")
      // Error already shown to user via toast
    }
  }, [deletePart])

  const handleBarcodeScanner = useCallback(() => {
    if (!barcodeInput) {
      toast.error("Please enter a barcode")
      return
    }

    // Simulate barcode lookup
    const part = parts?.find(p =>
      p.partNumber === barcodeInput ||
      p.id === barcodeInput
    )

    if (part) {
      setSelectedPart(part)
      setIsEditDialogOpen(true)
      setIsBarcodeDialogOpen(false)
      setBarcodeInput("")
      toast.success(`Found: ${part.name}`)
    } else {
      toast.error("Part not found")
    }
  }, [barcodeInput, parts])

  const handleCreateTransaction = useCallback(async () => {
    if (!selectedPart || !transactionData.quantity) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      await createTransaction({
        ...transactionData,
        partId: selectedPart.id,
        partNumber: selectedPart.partNumber,
        performedBy: "Current User" // Replace with actual user from auth
      } as InventoryTransaction)

      toast.success("Transaction recorded")
      setIsTransactionDialogOpen(false)
      setTransactionData({ type: "adjustment", quantity: 0, notes: "" })
    } catch (error) {
      toast.error("Failed to record transaction")
      // Error already shown to user via toast
    }
  }, [selectedPart, transactionData, createTransaction])

  const handleExport = useCallback(() => {
    const csv = [
      ["Part Number", "Name", "Category", "Manufacturer", "Quantity", "Unit Cost", "Total Value", "Status"].join(","),
      ...filteredParts.map(part => [
        part.partNumber,
        part.name,
        part.category,
        part.manufacturer,
        part.quantityOnHand,
        part.unitCost,
        (part.quantityOnHand * part.unitCost).toFixed(2),
        getStockStatus(part).label
      ].join(","))
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `inventory-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Inventory exported")
  }, [filteredParts, getStockStatus])

  const resetNewPart = () => {
    setNewPart({
      partNumber: "",
      name: "",
      description: "",
      category: "other",
      manufacturer: "",
      compatibleVehicles: [],
      quantityOnHand: 0,
      minStockLevel: 10,
      maxStockLevel: 100,
      reorderPoint: 20,
      unitCost: 0,
      location: "",
      alternateVendors: []
    })
  }

  // Permission gate
  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <ArrowsClockwise className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading permissions...</p>
        </div>
      </div>
    )
  }

  if (!canManage) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You do not have permission to access inventory management.
              Contact your administrator for access.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6" role="main" aria-label="Inventory Management">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Inventory Management</h2>
          <p className="text-muted-foreground">
            Comprehensive parts and supplies tracking with real-time stock alerts
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsBarcodeDialogOpen(true)}>
            <Barcode className="w-4 h-4 mr-2" />
            Scan Barcode
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <DownloadSimple className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Part
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Part</DialogTitle>
                <DialogDescription>
                  Enter part information to add to inventory
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="part-number">Part Number *</Label>
                    <Input
                      id="part-number"
                      value={newPart.partNumber}
                      onChange={e => setNewPart({ ...newPart, partNumber: e.target.value })}
                      placeholder="ABC-12345"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="part-category">Category *</Label>
                    <Select
                      value={newPart.category}
                      onValueChange={value => setNewPart({ ...newPart, category: value as Part["category"] })}
                    >
                      <SelectTrigger id="part-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="engine">Engine</SelectItem>
                        <SelectItem value="transmission">Transmission</SelectItem>
                        <SelectItem value="brakes">Brakes</SelectItem>
                        <SelectItem value="electrical">Electrical</SelectItem>
                        <SelectItem value="body">Body</SelectItem>
                        <SelectItem value="interior">Interior</SelectItem>
                        <SelectItem value="tires">Tires</SelectItem>
                        <SelectItem value="fluids">Fluids</SelectItem>
                        <SelectItem value="filters">Filters</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="part-name">Part Name *</Label>
                  <Input
                    id="part-name"
                    value={newPart.name}
                    onChange={e => setNewPart({ ...newPart, name: e.target.value })}
                    placeholder="Oil Filter"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="part-description">Description</Label>
                  <Textarea
                    id="part-description"
                    value={newPart.description}
                    onChange={e => setNewPart({ ...newPart, description: e.target.value })}
                    placeholder="Part description..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="manufacturer">Manufacturer</Label>
                    <Input
                      id="manufacturer"
                      value={newPart.manufacturer}
                      onChange={e => setNewPart({ ...newPart, manufacturer: e.target.value })}
                      placeholder="Acme Parts Co."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Storage Location</Label>
                    <Input
                      id="location"
                      value={newPart.location}
                      onChange={e => setNewPart({ ...newPart, location: e.target.value })}
                      placeholder="Shelf A-12"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Current Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      value={newPart.quantityOnHand}
                      onChange={e => setNewPart({ ...newPart, quantityOnHand: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit-cost">Unit Cost ($)</Label>
                    <Input
                      id="unit-cost"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newPart.unitCost}
                      onChange={e => setNewPart({ ...newPart, unitCost: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="min-stock">Min Stock</Label>
                    <Input
                      id="min-stock"
                      type="number"
                      min="0"
                      value={newPart.minStockLevel}
                      onChange={e => setNewPart({ ...newPart, minStockLevel: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reorder-point">Reorder Point</Label>
                    <Input
                      id="reorder-point"
                      type="number"
                      min="0"
                      value={newPart.reorderPoint}
                      onChange={e => setNewPart({ ...newPart, reorderPoint: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-stock">Max Stock</Label>
                    <Input
                      id="max-stock"
                      type="number"
                      min="0"
                      value={newPart.maxStockLevel}
                      onChange={e => setNewPart({ ...newPart, maxStockLevel: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddPart}>Add Part</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Parts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalParts}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Package className="w-3 h-3" />
              Unique SKUs
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.totalValue.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mt-1">
              <TrendUp className="w-3 h-3" />
              Asset value
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{metrics.lowStock}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Warning className="w-3 h-3" />
              Below reorder
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{metrics.outOfStock}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <TrendDown className="w-3 h-3" />
              Critical
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overstocked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{metrics.overstocked}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <TrendUp className="w-3 h-3" />
              Over max
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Needs Reorder</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{metrics.needsReorder}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <ShoppingCart className="w-3 h-3" />
              Action needed
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search parts..."
            value={filters.searchTerm}
            onChange={e => setFilters({ ...filters, searchTerm: e.target.value })}
            className="pl-10"
          />
        </div>
        <Select
          value={filters.category}
          onValueChange={value => setFilters({ ...filters, category: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="engine">Engine</SelectItem>
            <SelectItem value="transmission">Transmission</SelectItem>
            <SelectItem value="brakes">Brakes</SelectItem>
            <SelectItem value="electrical">Electrical</SelectItem>
            <SelectItem value="body">Body</SelectItem>
            <SelectItem value="interior">Interior</SelectItem>
            <SelectItem value="tires">Tires</SelectItem>
            <SelectItem value="fluids">Fluids</SelectItem>
            <SelectItem value="filters">Filters</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.status}
          onValueChange={value => setFilters({ ...filters, status: value as InventoryFilters["status"] })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="in-stock">In Stock</SelectItem>
            <SelectItem value="low-stock">Low Stock</SelectItem>
            <SelectItem value="out-of-stock">Out of Stock</SelectItem>
            <SelectItem value="overstocked">Overstocked</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.sortBy}
          onValueChange={value => setFilters({ ...filters, sortBy: value as InventoryFilters["sortBy"] })}
        >
          <SelectTrigger className="w-[180px]">
            <FunnelSimple className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Sort by Name</SelectItem>
            <SelectItem value="quantity">Sort by Quantity</SelectItem>
            <SelectItem value="value">Sort by Value</SelectItem>
            <SelectItem value="last-used">Sort by Last Used</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setFilters({
            ...filters,
            sortOrder: filters.sortOrder === "asc" ? "desc" : "asc"
          })}
          title={`Sort ${filters.sortOrder === "asc" ? "Descending" : "Ascending"}`}
        >
          <ArrowsClockwise className={`w-4 h-4 transition-transform ${filters.sortOrder === "desc" ? "rotate-180" : ""}`} />
        </Button>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory ({filteredParts.length})</CardTitle>
          <CardDescription>Current parts stock levels and details</CardDescription>
        </CardHeader>
        <CardContent>
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
                  <TableHead>Location</TableHead>
                  <TableHead>Stock Level</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Cost</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                      No parts found. {filters.searchTerm || filters.category !== "all" || filters.status !== "all"
                        ? "Try adjusting your filters."
                        : "Add parts to manage your inventory."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredParts.map(part => {
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
                        <TableCell className="text-sm text-muted-foreground">{part.location || "-"}</TableCell>
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
                          <span className="text-muted-foreground text-sm"> units</span>
                        </TableCell>
                        <TableCell>${part.unitCost.toFixed(2)}</TableCell>
                        <TableCell className="font-medium">
                          ${(part.quantityOnHand * part.unitCost).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge className={status.color} variant="secondary">
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <DotsThreeVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedPart(part)
                                  setIsEditDialogOpen(true)
                                }}
                              >
                                <PencilSimple className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedPart(part)
                                  setIsTransactionDialogOpen(true)
                                }}
                              >
                                <ShoppingCart className="w-4 h-4 mr-2" />
                                Record Transaction
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeletePart(part.id)}
                                className="text-red-600 dark:text-red-400"
                              >
                                <Trash className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* Barcode Scanner Dialog */}
      <Dialog open={isBarcodeDialogOpen} onOpenChange={setIsBarcodeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Barcode Scanner</DialogTitle>
            <DialogDescription>
              Enter or scan a barcode to look up a part
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center py-8">
              <Barcode className="w-24 h-24 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode / Part Number</Label>
              <Input
                id="barcode"
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
                placeholder="Scan or enter barcode..."
                onKeyDown={e => e.key === "Enter" && handleBarcodeScanner()}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBarcodeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBarcodeScanner}>Lookup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Part Dialog */}
      {selectedPart && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Part</DialogTitle>
              <DialogDescription>
                Update part information
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Part Number</Label>
                  <Input
                    value={selectedPart.partNumber}
                    onChange={e => setSelectedPart({ ...selectedPart, partNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={selectedPart.category}
                    onValueChange={value => setSelectedPart({ ...selectedPart, category: value as Part["category"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="engine">Engine</SelectItem>
                      <SelectItem value="transmission">Transmission</SelectItem>
                      <SelectItem value="brakes">Brakes</SelectItem>
                      <SelectItem value="electrical">Electrical</SelectItem>
                      <SelectItem value="body">Body</SelectItem>
                      <SelectItem value="interior">Interior</SelectItem>
                      <SelectItem value="tires">Tires</SelectItem>
                      <SelectItem value="fluids">Fluids</SelectItem>
                      <SelectItem value="filters">Filters</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Part Name</Label>
                <Input
                  value={selectedPart.name}
                  onChange={e => setSelectedPart({ ...selectedPart, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={selectedPart.description}
                  onChange={e => setSelectedPart({ ...selectedPart, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Manufacturer</Label>
                  <Input
                    value={selectedPart.manufacturer}
                    onChange={e => setSelectedPart({ ...selectedPart, manufacturer: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={selectedPart.location}
                    onChange={e => setSelectedPart({ ...selectedPart, location: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Current Quantity</Label>
                  <Input
                    type="number"
                    min="0"
                    value={selectedPart.quantityOnHand}
                    onChange={e => setSelectedPart({ ...selectedPart, quantityOnHand: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit Cost ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={selectedPart.unitCost}
                    onChange={e => setSelectedPart({ ...selectedPart, unitCost: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Min Stock</Label>
                  <Input
                    type="number"
                    min="0"
                    value={selectedPart.minStockLevel}
                    onChange={e => setSelectedPart({ ...selectedPart, minStockLevel: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reorder Point</Label>
                  <Input
                    type="number"
                    min="0"
                    value={selectedPart.reorderPoint}
                    onChange={e => setSelectedPart({ ...selectedPart, reorderPoint: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Stock</Label>
                  <Input
                    type="number"
                    min="0"
                    value={selectedPart.maxStockLevel}
                    onChange={e => setSelectedPart({ ...selectedPart, maxStockLevel: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdatePart}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Transaction Dialog */}
      {selectedPart && (
        <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Transaction</DialogTitle>
              <DialogDescription>
                Record inventory transaction for {selectedPart.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Transaction Type</Label>
                <Select
                  value={transactionData.type}
                  onValueChange={value => setTransactionData({ ...transactionData, type: value as InventoryTransaction["type"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="purchase">Purchase (Add Stock)</SelectItem>
                    <SelectItem value="usage">Usage (Remove Stock)</SelectItem>
                    <SelectItem value="return">Return (Add Stock)</SelectItem>
                    <SelectItem value="adjustment">Adjustment</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={transactionData.quantity}
                  onChange={e => setTransactionData({ ...transactionData, quantity: parseInt(e.target.value) || 0 })}
                  placeholder="Enter quantity..."
                />
              </div>

              <div className="space-y-2">
                <Label>Reference (Optional)</Label>
                <Input
                  value={transactionData.reference || ""}
                  onChange={e => setTransactionData({ ...transactionData, reference: e.target.value })}
                  placeholder="PO#, WO#, etc."
                />
              </div>

              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  value={transactionData.notes || ""}
                  onChange={e => setTransactionData({ ...transactionData, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>

              <div className="bg-muted p-3 rounded-md">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Stock:</span>
                    <span className="font-medium">{selectedPart.quantityOnHand} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transaction:</span>
                    <span className="font-medium">
                      {transactionData.type === "purchase" || transactionData.type === "return" ? "+" : "-"}
                      {transactionData.quantity || 0} units
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-1 mt-1">
                    <span className="text-muted-foreground">New Stock:</span>
                    <span className="font-bold">
                      {(transactionData.type === "purchase" || transactionData.type === "return"
                        ? selectedPart.quantityOnHand + (transactionData.quantity || 0)
                        : selectedPart.quantityOnHand - (transactionData.quantity || 0)
                      )} units
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsTransactionDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTransaction}>Record Transaction</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
