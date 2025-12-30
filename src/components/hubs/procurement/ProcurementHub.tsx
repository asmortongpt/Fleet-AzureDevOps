import {
  Package,
  TrendingUp,
  TrendingDown,
  Building2,
  Truck,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  BarChart3
} from "lucide-react"
import { useState, useMemo, useCallback } from "react"

import { ProfessionalFleetMap, GISFacility } from "@/components/Maps/ProfessionalFleetMap"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDrilldown } from "@/contexts/DrilldownContext"
import { cn } from "@/lib/utils"

// Mock procurement data
const mockSuppliers = [
  { id: "s1", name: "AutoParts Direct", location: { lat: 38.9072, lng: -77.0369 }, category: "Parts", orderCount: 24, totalSpend: 45800, rating: 4.8, status: "active" },
  { id: "s2", name: "Fleet Services Inc", location: { lat: 38.9369, lng: -77.0899 }, category: "Maintenance", orderCount: 18, totalSpend: 67200, rating: 4.6, status: "active" },
  { id: "s3", name: "Tire Warehouse USA", location: { lat: 38.8816, lng: -77.0910 }, category: "Tires", orderCount: 12, totalSpend: 28900, rating: 4.9, status: "active" },
  { id: "s4", name: "Fuel Depot Central", location: { lat: 38.9216, lng: -77.0147 }, category: "Fuel", orderCount: 45, totalSpend: 125400, rating: 4.5, status: "active" },
  { id: "s5", name: "Industrial Supplies Co", location: { lat: 38.8951, lng: -77.0364 }, category: "Equipment", orderCount: 8, totalSpend: 34100, rating: 4.7, status: "pending" }
]

const mockPurchaseOrders = [
  { id: "po-1001", supplier: "AutoParts Direct", items: 12, value: 4280, status: "in_transit", eta: "2 days", trackingId: "TRK-88392", delivery: { lat: 38.9072, lng: -77.0369 } },
  { id: "po-1002", supplier: "Fleet Services Inc", items: 5, value: 8950, status: "processing", eta: "4 days", trackingId: "TRK-88401", delivery: { lat: 38.9369, lng: -77.0899 } },
  { id: "po-1003", supplier: "Tire Warehouse USA", items: 16, value: 2400, status: "delivered", eta: "Delivered", trackingId: "TRK-88315", delivery: { lat: 38.8816, lng: -77.0910 } },
  { id: "po-1004", supplier: "Fuel Depot Central", items: 1, value: 12500, status: "in_transit", eta: "1 day", trackingId: "TRK-88445", delivery: { lat: 38.9216, lng: -77.0147 } }
]

const mockInventory = [
  { id: "inv-1", name: "Brake Pads", quantity: 45, location: "Warehouse A", minStock: 20, value: 12.50, trend: "stable" },
  { id: "inv-2", name: "Oil Filters", quantity: 12, location: "Warehouse B", minStock: 30, value: 8.75, trend: "low" },
  { id: "inv-3", name: "Air Filters", quantity: 67, location: "Warehouse A", minStock: 25, value: 15.20, trend: "high" },
  { id: "inv-4", name: "Windshield Wipers", quantity: 8, location: "Warehouse C", minStock: 15, value: 18.00, trend: "critical" }
]

// Supplier Panel Component
const SupplierPanel = ({ supplier }: { supplier: any; _onClose: () => void }) => {
  useDrilldown()

  if (!supplier) {
    return (
      <div className="p-4 text-muted-foreground">
        Select a supplier on the map to view details
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <div>
          <h3 className="text-lg font-semibold">{supplier.name}</h3>
          <Badge variant={supplier.status === 'active' ? 'default' : 'secondary'}>
            {supplier.status}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Card className="p-3">
            <div className="text-sm text-muted-foreground">Total Orders</div>
            <div className="font-medium text-lg">{supplier.orderCount}</div>
          </Card>

          <Card className="p-3">
            <div className="text-sm text-muted-foreground">Total Spend</div>
            <div className="font-medium text-lg">${supplier.totalSpend.toLocaleString()}</div>
          </Card>

          <Card className="p-3">
            <div className="text-sm text-muted-foreground">Rating</div>
            <div className="font-medium text-lg">⭐ {supplier.rating}</div>
          </Card>

          <Card className="p-3">
            <div className="text-sm text-muted-foreground">Category</div>
            <div className="font-medium">{supplier.category}</div>
          </Card>
        </div>

        <div className="space-y-2">
          <Button className="w-full">
            <Package className="h-4 w-4 mr-2" />
            Create Purchase Order
          </Button>
          <Button variant="outline" className="w-full">
            View Order History
          </Button>
          <Button variant="outline" className="w-full">
            Contact Supplier
          </Button>
        </div>
      </div>
    </ScrollArea>
  )
}

// Purchase Orders Panel
const PurchaseOrdersPanel = ({ orders, onOrderSelect }: { orders: any[]; onOrderSelect: (order: any) => void }) => {
  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'delivered': return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'in_transit': return <Truck className="h-4 w-4 text-blue-500" />
      case 'processing': return <Clock className="h-4 w-4 text-yellow-500" />
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-2">
        <h3 className="font-semibold mb-3">Active Purchase Orders</h3>
        {orders.map(order => (
          <Card
            key={order.id}
            className="p-3 cursor-pointer hover:bg-accent transition-colors"
            onClick={() => onOrderSelect(order)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {getStatusIcon(order.status)}
                  <span className="font-medium">{order.id}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{order.supplier}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">{order.items} items</Badge>
                  <Badge variant="secondary">
                    <DollarSign className="h-3 w-3 mr-1" />
                    ${order.value.toLocaleString()}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">ETA: {order.eta}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </ScrollArea>
  )
}

// Inventory Panel
const InventoryPanel = ({ inventory }: { inventory: any[] }) => {
  const getTrendIcon = (trend: string) => {
    if (trend === 'high') return <TrendingUp className="h-4 w-4 text-green-500" />
    if (trend === 'low' || trend === 'critical') return <TrendingDown className="h-4 w-4 text-red-500" />
    return null
  }

  const getTrendColor = (item: any) => {
    if (item.trend === 'critical') return 'text-red-600'
    if (item.trend === 'low') return 'text-yellow-600'
    if (item.trend === 'high') return 'text-green-600'
    return 'text-muted-foreground'
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-2">
        <h3 className="font-semibold mb-3">Inventory Status</h3>
        {inventory.map(item => (
          <Card key={item.id} className="p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.name}</span>
                  {getTrendIcon(item.trend)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{item.location}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className={cn("text-sm font-medium", getTrendColor(item))}>
                    Qty: {item.quantity}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Min: {item.minStock}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ${item.value}/unit
                  </span>
                </div>
                {item.quantity < item.minStock && (
                  <Badge variant="destructive" className="mt-2">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Below Minimum Stock
                  </Badge>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </ScrollArea>
  )
}

// Dashboard Panel
const DashboardPanel = () => {
  const totalSpend = mockSuppliers.reduce((sum, s) => sum + s.totalSpend, 0)
  const activeOrders = mockPurchaseOrders.filter(po => po.status !== 'delivered').length
  const criticalItems = mockInventory.filter(item => item.quantity < item.minStock).length

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <h3 className="font-semibold mb-3">Procurement Dashboard</h3>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Spend (30 days)</p>
              <p className="text-2xl font-bold">${totalSpend.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Suppliers</p>
              <p className="text-2xl font-bold">{mockSuppliers.filter(s => s.status === 'active').length}</p>
            </div>
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Orders</p>
              <p className="text-2xl font-bold">{activeOrders}</p>
            </div>
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Low Stock Items</p>
              <p className="text-2xl font-bold text-red-600">{criticalItems}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-4">
          <CardHeader className="p-0 mb-3">
            <CardTitle className="text-sm">Spend by Category</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-2">
            {Object.entries(
              mockSuppliers.reduce((acc, s) => {
                acc[s.category] = (acc[s.category] || 0) + s.totalSpend
                return acc
              }, {} as Record<string, number>)
            ).map(([category, spend]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-sm">{category}</span>
                <span className="text-sm font-medium">${spend.toLocaleString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}

// Main Procurement Hub Component
export function ProcurementHub() {
  const [selectedEntity, setSelectedEntity] = useState<{ type: string; data: any } | null>(null)
  const [activePanel, setActivePanel] = useState('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Convert suppliers to map markers
  const supplierMarkers = useMemo(() => {
    return mockSuppliers
      .filter(s => {
        const matchesSearch = !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter
        return matchesSearch && matchesCategory
      })
      .map(supplier => ({
        id: supplier.id,
        number: supplier.name,
        status: supplier.status,
        make: supplier.category,
        model: `${supplier.orderCount} orders`,
        licensePlate: `$${supplier.totalSpend.toLocaleString()}`,
        location: supplier.location,
        fuelLevel: supplier.rating * 20 // Convert 5-star to percentage for display
      }))
  }, [searchQuery, categoryFilter])

  // Convert POs to delivery markers
  const deliveryMarkers = useMemo(() => {
    return mockPurchaseOrders
      .filter(po => po.status === 'in_transit')
      .map(po => ({
        id: po.id,
        name: po.trackingId,
        location: po.delivery,
        type: 'delivery'
      })) as unknown as GISFacility[]
  }, [])

  const handleSupplierSelect = useCallback((supplierId: string) => {
    const supplier = mockSuppliers.find(s => s.id === supplierId)
    if (supplier) {
      setSelectedEntity({ type: 'supplier', data: supplier })
      setActivePanel('supplier')
    }
  }, [])

  const categories = useMemo(() => {
    return Array.from(new Set(mockSuppliers.map(s => s.category)))
  }, [])

  return (
    <div className="h-screen grid grid-cols-[1fr_400px]" data-testid="procurement-hub">
      {/* Map Section */}
      <div className="relative h-full">
        <ProfessionalFleetMap
          vehicles={supplierMarkers as any}
          facilities={deliveryMarkers}
          height="100vh"
          onVehicleSelect={handleSupplierSelect}
          showLegend={true}
          enableRealTime={false}
        />

        {/* Map Controls Overlay */}
        <div className="absolute top-4 left-4 bg-background/95 backdrop-blur rounded-lg shadow-lg z-10">
          <div className="p-3 space-y-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48" data-testid="procurement-category-filter">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Search suppliers..."
              className="w-48"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="procurement-search"
            />
          </div>
        </div>
      </div>

      {/* Sidebar Panel */}
      <div className="bg-background border-l h-full">
        <Tabs defaultValue="dashboard" value={activePanel} onValueChange={setActivePanel} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="supplier">Supplier</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard" className="h-[calc(100vh-48px)] mt-0">
            <DashboardPanel />
          </TabsContent>
          <TabsContent value="supplier" className="h-[calc(100vh-48px)] mt-0">
            <SupplierPanel supplier={selectedEntity?.type === 'supplier' ? selectedEntity.data : null} _onClose={() => {}} />
          </TabsContent>
          <TabsContent value="orders" className="h-[calc(100vh-48px)] mt-0">
            <PurchaseOrdersPanel orders={mockPurchaseOrders} onOrderSelect={(order) => setSelectedEntity({ type: 'order', data: order })} />
          </TabsContent>
          <TabsContent value="inventory" className="h-[calc(100vh-48px)] mt-0">
            <InventoryPanel inventory={mockInventory} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}