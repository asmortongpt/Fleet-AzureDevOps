import {
  Package,
  TrendingUp,
  TrendingDown,
  Building2,
  Truck,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign
} from "lucide-react"
import { useState, useMemo, useCallback } from "react"
import { toast } from "sonner"
import useSWR from "swr"

import { ProfessionalFleetMap, GISFacility } from "@/components/Maps/ProfessionalFleetMap"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDrilldown } from "@/contexts/DrilldownContext"
import { usePolicies } from "@/contexts/PolicyContext"
import { useFleetData } from "@/hooks/use-fleet-data"
import { apiFetcher } from "@/lib/api-fetcher"
import {
  enforcePaymentPolicy,
  shouldBlockAction,
  getApprovalRequirements
} from "@/lib/policy-engine/policy-enforcement"
import { cn } from "@/lib/utils"
import { formatEnum } from "@/utils/format-enum"
import { formatCurrency , formatDate } from "@/utils/format-helpers"

const fetcher = apiFetcher

// Supplier Panel Component
const SupplierPanel = ({ supplier, onCreatePO, isCreatingPO, onViewHistory, onContactSupplier }: { supplier: any; _onClose: () => void; onCreatePO: (supplier: any) => void; isCreatingPO: boolean; onViewHistory?: (supplier: any) => void; onContactSupplier?: (supplier: any) => void }) => {
  useDrilldown()

  if (!supplier) {
    return (
      <div className="p-2 text-muted-foreground">
        Select a supplier on the map to view details
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-2">
        <div>
          <h3 className="text-sm font-semibold">{supplier.name}</h3>
          <Badge variant={supplier.status === 'active' ? 'default' : 'secondary'}>
            {formatEnum(supplier.status)}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Card className="p-3">
            <div className="text-sm text-muted-foreground">Total Orders</div>
            <div className="font-medium text-sm">{supplier.orderCount}</div>
          </Card>

          <Card className="p-3">
            <div className="text-sm text-muted-foreground">Total Spend</div>
            <div className="font-medium text-sm">{formatCurrency(supplier.totalSpend)}</div>
          </Card>

          <Card className="p-3">
            <div className="text-sm text-muted-foreground">Rating</div>
            <div className="font-medium text-sm">⭐ {supplier.rating}</div>
          </Card>

          <Card className="p-3">
            <div className="text-sm text-muted-foreground">Category</div>
            <div className="font-medium">{formatEnum(supplier.category)}</div>
          </Card>
        </div>

        {/* Work Order Activity from Fleet Data */}
        {supplier.woOrderCount > 0 && (
          <Card className="p-3">
            <div className="text-sm font-medium mb-2">Work Order Activity</div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Work Orders</span>
                <span className="font-medium">{supplier.woOrderCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Parts Cost</span>
                <span className="font-medium">{formatCurrency(supplier.woPartsCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Labor Cost</span>
                <span className="font-medium">{formatCurrency(supplier.woLaborCost)}</span>
              </div>
            </div>
          </Card>
        )}

        <div className="space-y-2">
          <Button
            className="w-full"
            onClick={() => onCreatePO(supplier)}
            disabled={isCreatingPO}
          >
            <Package className="h-4 w-4 mr-2" />
            {isCreatingPO ? "Checking Policy..." : "Create Purchase Order"}
          </Button>
          <Button variant="outline" className="w-full" onClick={() => onViewHistory?.(supplier)}>
            View Order History
          </Button>
          <Button variant="outline" className="w-full" onClick={() => onContactSupplier?.(supplier)}>
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
      case 'in_transit': return <Truck className="h-4 w-4 text-emerald-400" />
      case 'processing': return <Clock className="h-4 w-4 text-yellow-500" />
      default: return <AlertCircle className="h-4 w-4 text-[var(--text-tertiary)]" />
    }
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-2">
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
                    {formatCurrency(order.value)}
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
      <div className="p-2 space-y-2">
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
const DashboardPanel = ({ suppliers, orders, inventory }: { suppliers: any[]; orders: any[]; inventory: any[] }) => {
  const totalSpend = suppliers.reduce((sum, s) => sum + s.totalSpend, 0)
  const totalWoPartsCost = suppliers.reduce((sum, s) => sum + (s.woPartsCost || 0), 0)
  const totalWoLaborCost = suppliers.reduce((sum, s) => sum + (s.woLaborCost || 0), 0)
  const activeOrders = orders.filter(po => po.status !== 'delivered').length
  const criticalItems = inventory.filter(item => item.quantity < item.minStock).length

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-2">
        <h3 className="font-semibold mb-3">Procurement Dashboard</h3>

        <Card className="p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Spend (PO + Work Orders)</p>
              <p className="text-sm font-bold">{formatCurrency(totalSpend)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">WO Vendor Costs</p>
              <p className="text-sm font-bold">
                {formatCurrency(totalWoPartsCost + totalWoLaborCost)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Parts: {formatCurrency(totalWoPartsCost)} / Labor: {formatCurrency(totalWoLaborCost)}
              </p>
            </div>
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Suppliers</p>
              <p className="text-sm font-bold">{suppliers.filter(s => s.status === 'active').length}</p>
            </div>
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Orders</p>
              <p className="text-sm font-bold">{activeOrders}</p>
            </div>
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Low Stock Items</p>
              <p className="text-sm font-bold text-red-600">{criticalItems}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-2">
          <CardHeader className="p-0 mb-3">
            <CardTitle className="text-sm">Spend by Category</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-2">
            {Object.entries(
              suppliers.reduce((acc, s) => {
                acc[s.category] = (acc[s.category] || 0) + s.totalSpend
                return acc
              }, {} as Record<string, number>)
            ).map(([category, spend]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-sm">{category}</span>
                <span className="text-sm font-medium">{formatCurrency(spend as number)}</span>
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
  const { policies } = usePolicies()
  const [selectedEntity, setSelectedEntity] = useState<{ type: string; data: any } | null>(null)
  const [activePanel, setActivePanel] = useState('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [isCreatingPO, setIsCreatingPO] = useState(false)

  const { workOrders: fleetWorkOrders } = useFleetData()

  const { data: vendorsResponse, error: vendorsError } = useSWR('/api/vendors', fetcher)
  const { data: ordersResponse, error: ordersError } = useSWR('/api/purchase-orders', fetcher)
  const { data: partsResponse, error: partsError } = useSWR('/api/parts', fetcher)
  const hasError = vendorsError || ordersError || partsError

  const vendors = Array.isArray(vendorsResponse) ? vendorsResponse : []
  const purchaseOrdersRaw = Array.isArray(ordersResponse) ? ordersResponse : []
  const parts = Array.isArray(partsResponse) ? partsResponse : []

  // Cross-reference vendor_id from work orders to compute total spend by vendor
  const workOrderVendorSpend = useMemo(() => {
    const spendMap = new Map<string, { totalCost: number; partsCost: number; laborCost: number; orderCount: number }>()
    fleetWorkOrders.forEach((wo: any) => {
      const vendorId = wo.vendor_id || wo.vendorId
      if (!vendorId) return
      const existing = spendMap.get(vendorId) || { totalCost: 0, partsCost: 0, laborCost: 0, orderCount: 0 }
      existing.totalCost += Number(wo.total_cost || wo.cost || 0)
      existing.partsCost += Number(wo.parts_cost || 0)
      existing.laborCost += Number(wo.labor_cost || 0)
      existing.orderCount += 1
      spendMap.set(vendorId, existing)
    })
    return spendMap
  }, [fleetWorkOrders])

  const suppliers = useMemo(() => {
    return vendors.map((vendor: any) => {
      const vendorOrders = purchaseOrdersRaw.filter((po: any) => po.vendorId === vendor.id)
      const poSpend = vendorOrders.reduce((sum: number, po: any) => sum + (Number(po.totalAmount) || 0), 0)
      const woSpend = workOrderVendorSpend.get(vendor.id)
      const totalSpend = poSpend + (woSpend?.totalCost || 0)
      const locationMeta = vendor.metadata || {}
      return {
        id: vendor.id,
        name: vendor.name,
        location: {
          lat: locationMeta.lat || 30.44,
          lng: locationMeta.lng || -84.28
        },
        category: vendor.type || 'General',
        orderCount: vendorOrders.length + (woSpend?.orderCount || 0),
        totalSpend,
        woPartsCost: woSpend?.partsCost || 0,
        woLaborCost: woSpend?.laborCost || 0,
        woOrderCount: woSpend?.orderCount || 0,
        rating: Number(vendor.rating) || 4.5,
        status: vendor.isActive ? 'active' : 'pending'
      }
    })
  }, [vendors, purchaseOrdersRaw, workOrderVendorSpend])

  const purchaseOrders = useMemo(() => {
    return purchaseOrdersRaw.map((po: any) => {
      const vendor = vendors.find((v: any) => v.id === po.vendorId)
      const vendorMeta = vendor?.metadata || {}
      const items = Array.isArray(po.lineItems) ? po.lineItems.length : 0
      const statusMap: Record<string, string> = {
        pending: 'processing',
        in_progress: 'in_transit',
        completed: 'delivered',
        cancelled: 'delivered',
        on_hold: 'processing',
        failed: 'processing'
      }
      const status = statusMap[po.status] || 'processing'
      const eta = formatDate(po.expectedDeliveryDate)
      return {
        id: po.number || po.id,
        supplier: po.vendorName || vendor?.name || 'Vendor',
        items,
        value: Number(po.totalAmount) || 0,
        status,
        eta,
        trackingId: po.number || po.id,
        delivery: {
          lat: vendorMeta.lat || 30.44,
          lng: vendorMeta.lng || -84.28
        }
      }
    })
  }, [purchaseOrdersRaw, vendors])

  const inventory = useMemo(() => {
    return parts.map((part: any) => {
      const qty = Number(part.quantityOnHand) || 0
      const minStock = Number(part.reorderPoint) || 0
      const trend =
        qty < minStock ? 'critical' : qty < minStock * 1.5 ? 'low' : qty > minStock * 2 ? 'high' : 'stable'
      return {
        id: part.id,
        name: part.name,
        quantity: qty,
        location: part.locationInWarehouse || 'Warehouse',
        minStock,
        value: Number(part.unitCost) || 0,
        trend
      }
    })
  }, [parts])

  // Convert suppliers to map markers
  const supplierMarkers = useMemo(() => {
    return suppliers
      .filter((s: any) => {
        const matchesSearch = !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter
        return matchesSearch && matchesCategory
      })
      .map((supplier: any) => ({
        id: supplier.id,
        number: supplier.name,
        status: supplier.status,
        make: supplier.category,
        model: `${supplier.orderCount} orders`,
        licensePlate: formatCurrency(supplier.totalSpend),
        location: supplier.location,
        fuelLevel: supplier.rating * 20 // Convert 5-star to percentage for display
      }))
  }, [searchQuery, categoryFilter, suppliers])

  // Convert POs to delivery markers
  const deliveryMarkers = useMemo(() => {
    return purchaseOrders
      .filter((po: any) => po.status === 'in_transit')
      .map((po: any) => ({
        id: po.id,
        name: po.trackingId,
        location: po.delivery,
        type: 'delivery'
      })) as unknown as GISFacility[]
  }, [purchaseOrders])

  const handleSupplierSelect = useCallback((supplierId: string) => {
    const supplier = suppliers.find((s: any) => s.id === supplierId)
    if (supplier) {
      setSelectedEntity({ type: 'supplier', data: supplier })
      setActivePanel('supplier')
    }
  }, [suppliers])

  const handleViewOrderHistory = useCallback((supplier: any) => {
    setActivePanel('orders')
    toast.success(`Showing orders for ${supplier.name}`)
  }, [])

  const handleContactSupplier = useCallback((supplier: any) => {
    toast.success(`Opening contact for ${supplier.name}`)
  }, [])

  // Handler for creating purchase orders with policy enforcement
  const handleCreatePurchaseOrder = async (supplier: any) => {
    setIsCreatingPO(true)

    try {
      // Sample payment data - in real implementation, this would come from a form
      const paymentData = {
        amount: 5000, // Sample amount
        category: supplier.category || 'Equipment',
        vendorId: supplier.id,
        approvalRequired: true
      }

      // Enforce payment policy before allowing PO creation
      const result = await enforcePaymentPolicy(policies, paymentData)

      // Check if action should be blocked
      if (shouldBlockAction(result)) {
        toast.error("Policy Violation", {
          description: "This purchase order cannot be created without resolving policy violations"
        })
        setIsCreatingPO(false)
        return
      }

      // Check if approval is required
      const approvalReq = getApprovalRequirements(result)
      if (approvalReq.required) {
        toast.warning(`${approvalReq.level?.toUpperCase()} Approval Required`, {
          description: approvalReq.reason
        })
        // In real implementation, route to approval workflow
      }

      // If we reach here, either policy allows it or requires approval
      if (result.allowed) {
        toast.success("Purchase Order Created", {
          description: approvalReq.required
            ? "PO submitted for approval"
            : "Purchase order created successfully"
        })
        // Proceed with PO creation
      }
    } catch (error) {
      toast.error("Error", {
        description: "Failed to validate purchase order against policies"
      })
    } finally {
      setIsCreatingPO(false)
    }
  }

  const categories = useMemo(() => {
    return Array.from(new Set(suppliers.map((s: any) => s.category))) as string[]
  }, [suppliers])

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-destructive font-medium">Failed to load procurement data</p>
        <p className="text-sm text-muted-foreground">
          {hasError instanceof Error ? hasError.message : 'An unexpected error occurred'}
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

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
        <div className="absolute top-4 left-4 bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-lg z-10">
          <div className="p-3 space-y-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48" data-testid="procurement-category-filter">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat: string) => (
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
            <DashboardPanel suppliers={suppliers} orders={purchaseOrders} inventory={inventory} />
          </TabsContent>
          <TabsContent value="supplier" className="h-[calc(100vh-48px)] mt-0">
            <SupplierPanel
              supplier={selectedEntity?.type === 'supplier' ? selectedEntity.data : null}
              _onClose={() => {}}
              onCreatePO={handleCreatePurchaseOrder}
              isCreatingPO={isCreatingPO}
              onViewHistory={handleViewOrderHistory}
              onContactSupplier={handleContactSupplier}
            />
          </TabsContent>
          <TabsContent value="orders" className="h-[calc(100vh-48px)] mt-0">
            <PurchaseOrdersPanel orders={purchaseOrders} onOrderSelect={(order) => setSelectedEntity({ type: 'order', data: order })} />
          </TabsContent>
          <TabsContent value="inventory" className="h-[calc(100vh-48px)] mt-0">
            <InventoryPanel inventory={inventory} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
