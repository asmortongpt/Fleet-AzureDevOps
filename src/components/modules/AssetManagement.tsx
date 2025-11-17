import { useState, useEffect } from "react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus,
  MagnifyingGlass,
  Barcode,
  TrendDown,
  Package,
  CurrencyDollar,
  CalendarDots,
  MapPin,
  User,
  ArrowsLeftRight,
  ChartLine
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"

interface Asset {
  id: string
  asset_tag: string
  asset_name: string
  asset_type: string
  category: string
  description?: string
  manufacturer?: string
  model?: string
  serial_number?: string
  purchase_date?: string
  purchase_price?: number
  current_value?: number
  depreciation_rate?: number
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'needs_repair'
  status: 'active' | 'in_use' | 'maintenance' | 'retired' | 'disposed'
  location?: string
  assigned_to?: string
  assigned_to_name?: string
  warranty_expiration?: string
  last_maintenance?: string
  qr_code?: string
}

interface DepreciationData {
  currentValue: number
  totalDepreciation: number
  annualDepreciation: number
  projections: Array<{
    year: number
    value: number
    depreciation: number
  }>
}

export function AssetManagement() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("all-assets")
  const [heavyEquipment, setHeavyEquipment] = useState<any[]>([])
  const [isAddEquipmentDialogOpen, setIsAddEquipmentDialogOpen] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState<any | null>(null)
  const [isEquipmentDetailsDialogOpen, setIsEquipmentDetailsDialogOpen] = useState(false)

  const [newEquipment, setNewEquipment] = useState({
    equipment_type: "excavator",
    manufacturer: "",
    model: "",
    model_year: new Date().getFullYear(),
    serial_number: "",
    capacity_tons: 0,
    max_reach_feet: 0,
    engine_hours: 0,
    is_rental: false,
    rental_rate_daily: 0
  })

  // Fetch assets on component mount
  useEffect(() => {
    fetchAssets()
    if (activeTab === "heavy-equipment") {
      fetchHeavyEquipment()
    }
  }, [activeTab])

  const [newAsset, setNewAsset] = useState<Partial<Asset>>({
    asset_tag: "",
    asset_name: "",
    asset_type: "equipment",
    category: "",
    description: "",
    manufacturer: "",
    model: "",
    serial_number: "",
    purchase_date: "",
    purchase_price: 0,
    depreciation_rate: 20,
    condition: "excellent",
    status: "active",
    location: ""
  })

  const [assignmentData, setAssignmentData] = useState({
    assigned_to: "",
    notes: ""
  })

  const [transferData, setTransferData] = useState({
    to_location: "",
    to_user: "",
    transfer_date: new Date().toISOString().split('T')[0],
    transfer_reason: "",
    notes: ""
  })

  const filteredAssets = assets.filter(asset => {
    const matchesSearch =
      asset.asset_tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
    const matchesType = filterType === "all" || asset.asset_type === filterType
    const matchesStatus = filterStatus === "all" || asset.status === filterStatus

    return matchesSearch && matchesType && matchesStatus
  })

  // Statistics
  const totalAssets = assets.length
  const totalValue = assets.reduce((sum, a) => sum + (a.current_value || 0), 0)
  const activeAssets = assets.filter(a => a.status === 'active' || a.status === 'in_use').length
  const maintenanceAssets = assets.filter(a => a.status === 'maintenance').length

  const fetchAssets = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterType !== "all") params.append("asset_type", filterType)
      if (filterStatus !== "all") params.append("status", filterStatus)

      const response = await apiClient.get(`/api/asset-management?${params.toString()}`)
      setAssets(response.assets || [])
    } catch (error) {
      console.error("Error fetching assets:", error)
      toast.error("Failed to load assets")
    } finally {
      setLoading(false)
    }
  }

  const fetchHeavyEquipment = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/api/heavy-equipment')
      setHeavyEquipment(response.equipment || [])
    } catch (error) {
      console.error("Error fetching heavy equipment:", error)
      toast.error("Failed to load heavy equipment")
    } finally {
      setLoading(false)
    }
  }

  const handleAddEquipment = async () => {
    if (!newEquipment.manufacturer || !newEquipment.model) {
      toast.error("Please fill in required fields")
      return
    }

    try {
      // First create the base asset
      const assetData = {
        asset_tag: `HE-${Date.now()}`,
        asset_name: `${newEquipment.manufacturer} ${newEquipment.model}`,
        asset_type: "equipment",
        category: "heavy_equipment",
        manufacturer: newEquipment.manufacturer,
        model: newEquipment.model,
        serial_number: newEquipment.serial_number,
        condition: "excellent",
        status: "active"
      }

      const assetResponse = await apiClient.get("/api/asset-management", {
        method: "POST",
        body: JSON.stringify(assetData)
      })

      // Then create the heavy equipment record
      const equipmentData = {
        asset_id: assetResponse.asset.id,
        ...newEquipment
      }

      await apiClient.get("/api/heavy-equipment", {
        method: "POST",
        body: JSON.stringify(equipmentData)
      })

      toast.success("Heavy equipment added successfully")
      setIsAddEquipmentDialogOpen(false)
      fetchHeavyEquipment()
      setNewEquipment({
        equipment_type: "excavator",
        manufacturer: "",
        model: "",
        model_year: new Date().getFullYear(),
        serial_number: "",
        capacity_tons: 0,
        max_reach_feet: 0,
        engine_hours: 0,
        is_rental: false,
        rental_rate_daily: 0
      })
    } catch (error) {
      console.error("Error adding equipment:", error)
      toast.error("Failed to add heavy equipment")
    }
  }

  const handleAddAsset = async () => {
    if (!newAsset.asset_tag || !newAsset.asset_name) {
      toast.error("Please fill in required fields")
      return
    }

    try {
      const response = await apiClient.get("/api/asset-management", {
        method: "POST",
        body: JSON.stringify(newAsset)
      })

      setAssets(current => [...current, response.asset])
      toast.success("Asset added successfully")
      setIsAddDialogOpen(false)
      resetNewAsset()
    } catch (error) {
      console.error("Error adding asset:", error)
      toast.error("Failed to add asset")
    }
  }

  const handleAssignAsset = async () => {
    if (!selectedAsset || !assignmentData.assigned_to) {
      toast.error("Please select an employee")
      return
    }

    try {
      await apiClient.get(`/api/asset-management/${selectedAsset.id}/assign`, {
        method: "POST",
        body: JSON.stringify(assignmentData)
      })

      fetchAssets()
      toast.success("Asset assigned successfully")
      setIsAssignDialogOpen(false)
      setIsDetailsDialogOpen(false)
      setAssignmentData({ assigned_to: "", notes: "" })
    } catch (error) {
      console.error("Error assigning asset:", error)
      toast.error("Failed to assign asset")
    }
  }

  const handleTransferAsset = async () => {
    if (!selectedAsset || (!transferData.to_location && !transferData.to_user)) {
      toast.error("Please provide transfer details")
      return
    }

    try {
      await apiClient.get(`/api/asset-management/${selectedAsset.id}/transfer`, {
        method: "POST",
        body: JSON.stringify(transferData)
      })

      fetchAssets()
      toast.success("Asset transferred successfully")
      setIsTransferDialogOpen(false)
      setIsDetailsDialogOpen(false)
      setTransferData({
        to_location: "",
        to_user: "",
        transfer_date: new Date().toISOString().split('T')[0],
        transfer_reason: "",
        notes: ""
      })
    } catch (error) {
      console.error("Error transferring asset:", error)
      toast.error("Failed to transfer asset")
    }
  }

  const resetNewAsset = () => {
    setNewAsset({
      asset_tag: "",
      asset_name: "",
      asset_type: "equipment",
      category: "",
      description: "",
      manufacturer: "",
      model: "",
      serial_number: "",
      purchase_date: "",
      purchase_price: 0,
      depreciation_rate: 20,
      condition: "excellent",
      status: "active",
      location: ""
    })
  }

  const getStatusColor = (status: Asset['status']) => {
    const colors = {
      active: "bg-green-100 text-green-700",
      in_use: "bg-blue-100 text-blue-700",
      maintenance: "bg-yellow-100 text-yellow-700",
      retired: "bg-gray-100 text-gray-700",
      disposed: "bg-red-100 text-red-700"
    }
    return colors[status]
  }

  const getConditionColor = (condition: Asset['condition']) => {
    const colors = {
      excellent: "bg-green-100 text-green-700",
      good: "bg-blue-100 text-blue-700",
      fair: "bg-yellow-100 text-yellow-700",
      poor: "bg-orange-100 text-orange-700",
      needs_repair: "bg-red-100 text-red-700"
    }
    return colors[condition]
  }

  const calculateDepreciation = (asset: Asset): DepreciationData | null => {
    if (!asset.purchase_price || !asset.purchase_date || !asset.depreciation_rate) {
      return null
    }

    const purchaseDate = new Date(asset.purchase_date)
    const now = new Date()
    const yearsSincePurchase = (now.getTime() - purchaseDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)

    const annualDepreciation = asset.purchase_price * (asset.depreciation_rate / 100)
    const totalDepreciation = Math.min(annualDepreciation * yearsSincePurchase, asset.purchase_price)
    const currentValue = Math.max(asset.purchase_price - totalDepreciation, 0)

    // Calculate 10-year projections
    const projections = Array.from({ length: 10 }, (_, i) => {
      const year = i + 1
      const yearDepreciation = Math.min(annualDepreciation * year, asset.purchase_price)
      const yearValue = Math.max(asset.purchase_price - yearDepreciation, 0)
      return {
        year,
        value: yearValue,
        depreciation: yearDepreciation
      }
    })

    return {
      currentValue,
      totalDepreciation,
      annualDepreciation,
      projections
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Asset Management</h2>
          <p className="text-muted-foreground">Track and manage organizational assets and equipment</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Asset
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Asset</DialogTitle>
              <DialogDescription>
                Enter asset information to add to inventory
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="asset-tag">Asset Tag *</Label>
                  <Input
                    id="asset-tag"
                    value={newAsset.asset_tag}
                    onChange={e => setNewAsset({ ...newAsset, asset_tag: e.target.value })}
                    placeholder="AST-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="asset-name">Asset Name *</Label>
                  <Input
                    id="asset-name"
                    value={newAsset.asset_name}
                    onChange={e => setNewAsset({ ...newAsset, asset_name: e.target.value })}
                    placeholder="Dell Laptop"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="asset-type">Asset Type *</Label>
                  <Select
                    value={newAsset.asset_type}
                    onValueChange={value => setNewAsset({ ...newAsset, asset_type: value })}
                  >
                    <SelectTrigger id="asset-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vehicle">Vehicle</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="tool">Tool</SelectItem>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="furniture">Furniture</SelectItem>
                      <SelectItem value="facility">Facility</SelectItem>
                      <SelectItem value="software">Software License</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={newAsset.category}
                    onChange={e => setNewAsset({ ...newAsset, category: e.target.value })}
                    placeholder="IT Equipment"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newAsset.description}
                  onChange={e => setNewAsset({ ...newAsset, description: e.target.value })}
                  placeholder="Asset description..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input
                    id="manufacturer"
                    value={newAsset.manufacturer}
                    onChange={e => setNewAsset({ ...newAsset, manufacturer: e.target.value })}
                    placeholder="Dell"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={newAsset.model}
                    onChange={e => setNewAsset({ ...newAsset, model: e.target.value })}
                    placeholder="Latitude 7490"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serial-number">Serial Number</Label>
                  <Input
                    id="serial-number"
                    value={newAsset.serial_number}
                    onChange={e => setNewAsset({ ...newAsset, serial_number: e.target.value })}
                    placeholder="SN123456789"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchase-date">Purchase Date</Label>
                  <Input
                    id="purchase-date"
                    type="date"
                    value={newAsset.purchase_date}
                    onChange={e => setNewAsset({ ...newAsset, purchase_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchase-price">Purchase Price ($)</Label>
                  <Input
                    id="purchase-price"
                    type="number"
                    step="0.01"
                    value={newAsset.purchase_price}
                    onChange={e => setNewAsset({ ...newAsset, purchase_price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="depreciation-rate">Depreciation Rate (%)</Label>
                  <Input
                    id="depreciation-rate"
                    type="number"
                    step="0.1"
                    value={newAsset.depreciation_rate}
                    onChange={e => setNewAsset({ ...newAsset, depreciation_rate: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="condition">Condition *</Label>
                  <Select
                    value={newAsset.condition}
                    onValueChange={value => setNewAsset({ ...newAsset, condition: value as Asset['condition'] })}
                  >
                    <SelectTrigger id="condition">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                      <SelectItem value="needs_repair">Needs Repair</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={newAsset.status}
                    onValueChange={value => setNewAsset({ ...newAsset, status: value as Asset['status'] })}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="in_use">In Use</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                      <SelectItem value="disposed">Disposed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={newAsset.location}
                    onChange={e => setNewAsset({ ...newAsset, location: e.target.value })}
                    placeholder="Building A, Room 101"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddAsset}>Add Asset</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssets}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Package className="w-3 h-3" />
              In inventory
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
              <CurrencyDollar className="w-3 h-3" />
              Current valuation
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeAssets}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <TrendDown className="w-3 h-3" />
              In use or available
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{maintenanceAssets}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <CalendarDots className="w-3 h-3" />
              Under service
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all-assets">All Assets</TabsTrigger>
          <TabsTrigger value="heavy-equipment">Heavy Equipment</TabsTrigger>
        </TabsList>

        {/* All Assets Tab */}
        <TabsContent value="all-assets" className="space-y-6">
      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search assets by tag, name, or serial number..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="vehicle">Vehicle</SelectItem>
            <SelectItem value="equipment">Equipment</SelectItem>
            <SelectItem value="tool">Tool</SelectItem>
            <SelectItem value="electronics">Electronics</SelectItem>
            <SelectItem value="furniture">Furniture</SelectItem>
            <SelectItem value="facility">Facility</SelectItem>
            <SelectItem value="software">Software License</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="in_use">In Use</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="retired">Retired</SelectItem>
            <SelectItem value="disposed">Disposed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Assets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Assets ({filteredAssets.length})</CardTitle>
          <CardDescription>Complete asset inventory with tracking and management</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset Tag</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Current Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No assets found. Add your first asset to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAssets.map(asset => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-mono text-sm font-medium">{asset.asset_tag}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{asset.asset_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {asset.manufacturer} {asset.model}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{asset.asset_type}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {asset.location || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {asset.assigned_to_name ? (
                        <div className="flex items-center gap-1 text-sm">
                          <User className="w-3 h-3 text-muted-foreground" />
                          {asset.assigned_to_name}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getConditionColor(asset.condition)} variant="secondary">
                        {asset.condition}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      ${(asset.current_value || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(asset.status)} variant="secondary">
                        {asset.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedAsset(asset)
                          setIsDetailsDialogOpen(true)
                        }}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Asset Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Asset Details - {selectedAsset?.asset_tag}</DialogTitle>
            <DialogDescription>
              Complete information and management for {selectedAsset?.asset_name}
            </DialogDescription>
          </DialogHeader>
          {selectedAsset && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="depreciation">Depreciation</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="qr">QR Code</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Basic Information</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Asset Tag:</span>
                        <p className="font-medium font-mono">{selectedAsset.asset_tag}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Asset Name:</span>
                        <p className="font-medium">{selectedAsset.asset_name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Type:</span>
                        <p className="font-medium capitalize">{selectedAsset.asset_type}</p>
                      </div>
                      {selectedAsset.category && (
                        <div>
                          <span className="text-muted-foreground">Category:</span>
                          <p className="font-medium">{selectedAsset.category}</p>
                        </div>
                      )}
                      {selectedAsset.description && (
                        <div>
                          <span className="text-muted-foreground">Description:</span>
                          <p className="font-medium">{selectedAsset.description}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold mb-3">Product Information</h3>
                    <div className="space-y-2 text-sm">
                      {selectedAsset.manufacturer && (
                        <div>
                          <span className="text-muted-foreground">Manufacturer:</span>
                          <p className="font-medium">{selectedAsset.manufacturer}</p>
                        </div>
                      )}
                      {selectedAsset.model && (
                        <div>
                          <span className="text-muted-foreground">Model:</span>
                          <p className="font-medium">{selectedAsset.model}</p>
                        </div>
                      )}
                      {selectedAsset.serial_number && (
                        <div>
                          <span className="text-muted-foreground">Serial Number:</span>
                          <p className="font-medium font-mono">{selectedAsset.serial_number}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Status & Condition</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <div className="mt-1">
                          <Badge className={getStatusColor(selectedAsset.status)} variant="secondary">
                            {selectedAsset.status}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Condition:</span>
                        <div className="mt-1">
                          <Badge className={getConditionColor(selectedAsset.condition)} variant="secondary">
                            {selectedAsset.condition}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold mb-3">Location & Assignment</h3>
                    <div className="space-y-2 text-sm">
                      {selectedAsset.location && (
                        <div>
                          <span className="text-muted-foreground">Location:</span>
                          <p className="font-medium">{selectedAsset.location}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">Assigned To:</span>
                        <p className="font-medium">
                          {selectedAsset.assigned_to_name || "Unassigned"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-3">Financial Information</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    {selectedAsset.purchase_date && (
                      <div>
                        <span className="text-muted-foreground">Purchase Date:</span>
                        <p className="font-medium">
                          {new Date(selectedAsset.purchase_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {selectedAsset.purchase_price && (
                      <div>
                        <span className="text-muted-foreground">Purchase Price:</span>
                        <p className="font-medium text-lg">
                          ${selectedAsset.purchase_price.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {selectedAsset.current_value !== undefined && (
                      <div>
                        <span className="text-muted-foreground">Current Value:</span>
                        <p className="font-medium text-lg text-green-600">
                          ${selectedAsset.current_value.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => {
                      setIsAssignDialogOpen(true)
                      setIsDetailsDialogOpen(false)
                    }}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Assign Asset
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsTransferDialogOpen(true)
                      setIsDetailsDialogOpen(false)
                    }}
                  >
                    <ArrowsLeftRight className="w-4 h-4 mr-2" />
                    Transfer Asset
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="depreciation" className="space-y-4">
                {(() => {
                  const depData = calculateDepreciation(selectedAsset)
                  if (!depData) {
                    return (
                      <div className="text-center text-muted-foreground py-8">
                        Depreciation data not available. Add purchase price and date.
                      </div>
                    )
                  }

                  return (
                    <div className="space-y-6">
                      <div className="grid grid-cols-3 gap-4">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                              Current Value
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                              ${depData.currentValue.toLocaleString()}
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                              Total Depreciation
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                              ${depData.totalDepreciation.toLocaleString()}
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                              Annual Depreciation
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              ${depData.annualDepreciation.toLocaleString()}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold mb-3">10-Year Depreciation Projection</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Year</TableHead>
                              <TableHead>Value</TableHead>
                              <TableHead>Depreciation</TableHead>
                              <TableHead>Progress</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {depData.projections.map(proj => (
                              <TableRow key={proj.year}>
                                <TableCell>Year {proj.year}</TableCell>
                                <TableCell className="font-semibold">
                                  ${proj.value.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-red-600">
                                  -${proj.depreciation.toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  <Progress
                                    value={(proj.value / selectedAsset.purchase_price!) * 100}
                                    className="h-2"
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )
                })()}
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <div className="text-center text-muted-foreground py-8">
                  Asset history and audit log will appear here
                </div>
              </TabsContent>

              <TabsContent value="qr" className="space-y-4">
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Barcode className="w-32 h-32 text-gray-400" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    QR Code: {selectedAsset.qr_code}
                  </p>
                  <Button variant="outline">
                    Download QR Code
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Asset Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Asset</DialogTitle>
            <DialogDescription>
              Assign {selectedAsset?.asset_tag} to an employee
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="assign-to">Assign To *</Label>
              <Select
                value={assignmentData.assigned_to}
                onValueChange={value => setAssignmentData({ ...assignmentData, assigned_to: value })}
              >
                <SelectTrigger id="assign-to">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user-1">John Doe</SelectItem>
                  <SelectItem value="user-2">Jane Smith</SelectItem>
                  <SelectItem value="user-3">Bob Johnson</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assign-notes">Notes</Label>
              <Textarea
                id="assign-notes"
                value={assignmentData.notes}
                onChange={e => setAssignmentData({ ...assignmentData, notes: e.target.value })}
                placeholder="Assignment notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignAsset}>Assign Asset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Asset Dialog */}
      <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Asset</DialogTitle>
            <DialogDescription>
              Transfer {selectedAsset?.asset_tag} to a new location or user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="to-location">To Location</Label>
              <Input
                id="to-location"
                value={transferData.to_location}
                onChange={e => setTransferData({ ...transferData, to_location: e.target.value })}
                placeholder="Building B, Room 202"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to-user">To User (Optional)</Label>
              <Select
                value={transferData.to_user}
                onValueChange={value => setTransferData({ ...transferData, to_user: value })}
              >
                <SelectTrigger id="to-user">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user-1">John Doe</SelectItem>
                  <SelectItem value="user-2">Jane Smith</SelectItem>
                  <SelectItem value="user-3">Bob Johnson</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="transfer-date">Transfer Date</Label>
              <Input
                id="transfer-date"
                type="date"
                value={transferData.transfer_date}
                onChange={e => setTransferData({ ...transferData, transfer_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transfer-reason">Reason</Label>
              <Select
                value={transferData.transfer_reason}
                onValueChange={value => setTransferData({ ...transferData, transfer_reason: value })}
              >
                <SelectTrigger id="transfer-reason">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relocation">Relocation</SelectItem>
                  <SelectItem value="reassignment">Reassignment</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="upgrade">Upgrade</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="transfer-notes">Notes</Label>
              <Textarea
                id="transfer-notes"
                value={transferData.notes}
                onChange={e => setTransferData({ ...transferData, notes: e.target.value })}
                placeholder="Transfer notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTransferDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleTransferAsset}>Transfer Asset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </TabsContent>

        {/* Heavy Equipment Tab */}
        <TabsContent value="heavy-equipment" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Heavy Equipment Inventory</h3>
              <p className="text-sm text-muted-foreground">
                Specialized equipment with hour meter tracking and certifications
              </p>
            </div>
            <Dialog open={isAddEquipmentDialogOpen} onOpenChange={setIsAddEquipmentDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Heavy Equipment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Heavy Equipment</DialogTitle>
                  <DialogDescription>
                    Enter equipment details including specifications and tracking information
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="equipment-type">Equipment Type *</Label>
                      <Select
                        value={newEquipment.equipment_type}
                        onValueChange={value => setNewEquipment({ ...newEquipment, equipment_type: value })}
                      >
                        <SelectTrigger id="equipment-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="excavator">Excavator</SelectItem>
                          <SelectItem value="bulldozer">Bulldozer</SelectItem>
                          <SelectItem value="crane">Crane</SelectItem>
                          <SelectItem value="loader">Loader</SelectItem>
                          <SelectItem value="forklift">Forklift</SelectItem>
                          <SelectItem value="dump_truck">Dump Truck</SelectItem>
                          <SelectItem value="concrete_mixer">Concrete Mixer</SelectItem>
                          <SelectItem value="paver">Paver</SelectItem>
                          <SelectItem value="grader">Grader</SelectItem>
                          <SelectItem value="backhoe">Backhoe</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="eq-manufacturer">Manufacturer *</Label>
                      <Input
                        id="eq-manufacturer"
                        value={newEquipment.manufacturer}
                        onChange={e => setNewEquipment({ ...newEquipment, manufacturer: e.target.value })}
                        placeholder="Caterpillar"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="eq-model">Model *</Label>
                      <Input
                        id="eq-model"
                        value={newEquipment.model}
                        onChange={e => setNewEquipment({ ...newEquipment, model: e.target.value })}
                        placeholder="320 GC"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="eq-year">Model Year</Label>
                      <Input
                        id="eq-year"
                        type="number"
                        value={newEquipment.model_year}
                        onChange={e => setNewEquipment({ ...newEquipment, model_year: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="eq-serial">Serial Number</Label>
                      <Input
                        id="eq-serial"
                        value={newEquipment.serial_number}
                        onChange={e => setNewEquipment({ ...newEquipment, serial_number: e.target.value })}
                        placeholder="SN123456"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="eq-capacity">Capacity (tons)</Label>
                      <Input
                        id="eq-capacity"
                        type="number"
                        step="0.1"
                        value={newEquipment.capacity_tons}
                        onChange={e => setNewEquipment({ ...newEquipment, capacity_tons: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="eq-reach">Max Reach (feet)</Label>
                      <Input
                        id="eq-reach"
                        type="number"
                        step="0.1"
                        value={newEquipment.max_reach_feet}
                        onChange={e => setNewEquipment({ ...newEquipment, max_reach_feet: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="eq-hours">Engine Hours</Label>
                      <Input
                        id="eq-hours"
                        type="number"
                        step="0.1"
                        value={newEquipment.engine_hours}
                        onChange={e => setNewEquipment({ ...newEquipment, engine_hours: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="eq-rental"
                          checked={newEquipment.is_rental}
                          onChange={e => setNewEquipment({ ...newEquipment, is_rental: e.target.checked })}
                          className="rounded"
                        />
                        <Label htmlFor="eq-rental">Rental Equipment</Label>
                      </div>
                    </div>
                    {newEquipment.is_rental && (
                      <div className="space-y-2">
                        <Label htmlFor="eq-rental-rate">Daily Rental Rate ($)</Label>
                        <Input
                          id="eq-rental-rate"
                          type="number"
                          step="0.01"
                          value={newEquipment.rental_rate_daily}
                          onChange={e => setNewEquipment({ ...newEquipment, rental_rate_daily: parseFloat(e.target.value) })}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddEquipmentDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddEquipment}>Add Equipment</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Heavy Equipment Table */}
          <Card>
            <CardHeader>
              <CardTitle>Heavy Equipment ({heavyEquipment.length})</CardTitle>
              <CardDescription>
                Construction and industrial equipment with specialized tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset Tag</TableHead>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Engine Hours</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {heavyEquipment.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No heavy equipment found. Add your first equipment to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    heavyEquipment.map(equipment => (
                      <TableRow key={equipment.id}>
                        <TableCell className="font-mono text-sm font-medium">
                          {equipment.asset_tag}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{equipment.asset_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {equipment.manufacturer} {equipment.model}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">
                          {equipment.equipment_type?.replace('_', ' ')}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold">
                            {parseFloat(equipment.engine_hours || 0).toFixed(1)} hrs
                          </div>
                        </TableCell>
                        <TableCell>
                          {equipment.capacity_tons ? `${equipment.capacity_tons} tons` : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge className={equipment.is_rental ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"} variant="secondary">
                            {equipment.is_rental ? "Rental" : "Owned"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            {equipment.current_job_site || equipment.location || "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedEquipment(equipment)
                              setIsEquipmentDetailsDialogOpen(true)
                            }}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Equipment Details Dialog */}
          <Dialog open={isEquipmentDetailsDialogOpen} onOpenChange={setIsEquipmentDetailsDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Equipment Details - {selectedEquipment?.asset_tag}</DialogTitle>
                <DialogDescription>
                  Detailed information for {selectedEquipment?.asset_name}
                </DialogDescription>
              </DialogHeader>
              {selectedEquipment && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-semibold mb-3">Equipment Information</h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Type:</span>
                          <p className="font-medium capitalize">{selectedEquipment.equipment_type?.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Manufacturer:</span>
                          <p className="font-medium">{selectedEquipment.manufacturer}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Model:</span>
                          <p className="font-medium">{selectedEquipment.model}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Serial Number:</span>
                          <p className="font-medium font-mono">{selectedEquipment.serial_number || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold mb-3">Specifications</h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Capacity:</span>
                          <p className="font-medium">{selectedEquipment.capacity_tons ? `${selectedEquipment.capacity_tons} tons` : 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Max Reach:</span>
                          <p className="font-medium">{selectedEquipment.max_reach_feet ? `${selectedEquipment.max_reach_feet} feet` : 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Engine Hours:</span>
                          <p className="font-medium text-lg">{parseFloat(selectedEquipment.engine_hours || 0).toFixed(1)} hrs</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold mb-3">Current Status</h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Availability:</span>
                        <div className="mt-1">
                          <Badge className="bg-green-100 text-green-700" variant="secondary">
                            {selectedEquipment.availability_status || 'Available'}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Ownership:</span>
                        <div className="mt-1">
                          <Badge className={selectedEquipment.is_rental ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"} variant="secondary">
                            {selectedEquipment.is_rental ? 'Rental' : 'Owned'}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Location:</span>
                        <p className="font-medium">{selectedEquipment.current_job_site || selectedEquipment.location || 'Not assigned'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEquipmentDetailsDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  )
}
