import { useState } from "react"
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
import { Label } from "@/components/ui/label"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, MagnifyingGlass, Package, TrendUp, TrendDown, Warning } from "@phosphor-icons/react"
import { Part } from "@/lib/types"
import { toast } from "sonner"

export function PartsInventory() {
  const [parts, setParts] = useState<Part[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

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
    location: ""
  })

  const filteredParts = (parts || []).filter(part => {
    const matchesSearch = 
      part.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === "all" || part.category === filterCategory

    return matchesSearch && matchesCategory
  })

  const lowStockParts = (parts || []).filter(p => p.quantityOnHand <= p.reorderPoint)
  const outOfStockParts = (parts || []).filter(p => p.quantityOnHand === 0)
  const totalInventoryValue = (parts || []).reduce((sum, p) => sum + (p.quantityOnHand * p.unitCost), 0)

  const handleAddPart = () => {
    if (!newPart.partNumber || !newPart.name) {
      toast.error("Please fill in required fields")
      return
    }

    const part: Part = {
      id: `part-${Date.now()}`,
      partNumber: newPart.partNumber,
      name: newPart.name,
      description: newPart.description || "",
      category: newPart.category as Part["category"],
      manufacturer: newPart.manufacturer || "",
      compatibleVehicles: newPart.compatibleVehicles || [],
      quantityOnHand: newPart.quantityOnHand || 0,
      minStockLevel: newPart.minStockLevel || 10,
      maxStockLevel: newPart.maxStockLevel || 100,
      reorderPoint: newPart.reorderPoint || 20,
      unitCost: newPart.unitCost || 0,
      location: newPart.location || "",
      alternateVendors: []
    }

    setParts(current => [...(current || []), part])
    toast.success("Part added to inventory")
    setIsAddDialogOpen(false)
    resetNewPart()
  }

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
      location: ""
    })
  }

  const getStockStatus = (part: Part) => {
    if (part.quantityOnHand === 0) return { label: "Out of Stock", color: "bg-red-100 text-red-700" }
    if (part.quantityOnHand <= part.reorderPoint) return { label: "Low Stock", color: "bg-yellow-100 text-yellow-700" }
    if (part.quantityOnHand >= part.maxStockLevel) return { label: "Overstocked", color: "bg-blue-100 text-blue-700" }
    return { label: "In Stock", color: "bg-green-100 text-green-700" }
  }

  const getStockLevel = (part: Part) => {
    return (part.quantityOnHand / part.maxStockLevel) * 100
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Parts Inventory</h2>
          <p className="text-muted-foreground">Manage vehicle parts and track stock levels</p>
        </div>
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
                    value={newPart.quantityOnHand}
                    onChange={e => setNewPart({ ...newPart, quantityOnHand: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit-cost">Unit Cost ($)</Label>
                  <Input
                    id="unit-cost"
                    type="number"
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
                    value={newPart.minStockLevel}
                    onChange={e => setNewPart({ ...newPart, minStockLevel: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reorder-point">Reorder Point</Label>
                  <Input
                    id="reorder-point"
                    type="number"
                    value={newPart.reorderPoint}
                    onChange={e => setNewPart({ ...newPart, reorderPoint: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-stock">Max Stock</Label>
                  <Input
                    id="max-stock"
                    type="number"
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

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Parts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(parts || []).length}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Package className="w-3 h-3" />
              Unique SKUs
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inventory Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalInventoryValue.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
              <TrendUp className="w-3 h-3" />
              Total assets
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowStockParts.length}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Warning className="w-3 h-3" />
              Need reorder
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outOfStockParts.length}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <TrendDown className="w-3 h-3" />
              Critical
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search parts..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48">
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory ({filteredParts.length})</CardTitle>
          <CardDescription>Current parts stock levels and details</CardDescription>
        </CardHeader>
        <CardContent>
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
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No parts found. Add parts to manage your inventory.
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
                      <TableCell>
                        <Badge className={status.color} variant="secondary">
                          {status.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
