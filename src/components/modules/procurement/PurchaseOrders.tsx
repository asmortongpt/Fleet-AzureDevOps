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
  DialogFooter
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { ShoppingCart, Plus, MagnifyingGlass, Package, TrendUp, Trash } from "@phosphor-icons/react"
import { PurchaseOrder } from "@/lib/types"
import { toast } from "sonner"

interface POItem {
  description: string
  partNumber: string
  quantity: number
  unitPrice: number
}

interface NewPOForm {
  vendorName: string
  expectedDelivery: string
  items: POItem[]
  notes: string
  shippingAddress: string
}

export function PurchaseOrders() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")

  const [newPO, setNewPO] = useState<NewPOForm>({
    vendorName: "",
    expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [{ description: "", partNumber: "", quantity: 1, unitPrice: 0 }],
    notes: "",
    shippingAddress: ""
  })

  const filteredOrders = (orders || []).filter(order => {
    const matchesSearch =
      order.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.vendorName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || order.status === filterStatus

    return matchesSearch && matchesStatus
  })

  const totalSpend = (orders || []).reduce((sum, order) => sum + order.total, 0)
  const pendingOrders = (orders || []).filter(o => o.status === "pending-approval").length
  const activeOrders = (orders || []).filter(o => ["approved", "ordered"].includes(o.status)).length

  // Handler: Create Purchase Order
  const handleCreatePO = () => {
    if (!newPO.vendorName.trim() || newPO.items.length === 0) {
      toast.error('Please fill in vendor name and at least one item')
      return
    }

    const total = newPO.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    const poNumber = `PO-${Date.now().toString().slice(-6)}`

    const purchaseOrder: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber,
      vendorName: newPO.vendorName,
      date: new Date().toISOString(),
      expectedDelivery: newPO.expectedDelivery,
      items: newPO.items.filter(item => item.description && item.quantity > 0),
      total,
      status: "pending-approval",
      notes: newPO.notes,
      shippingAddress: newPO.shippingAddress,
      requestedBy: "Current User",
      department: "Fleet Maintenance"
    }

    setOrders([...(orders || []), purchaseOrder])
    setIsCreateDialogOpen(false)
    setNewPO({
      vendorName: "",
      expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: [{ description: "", partNumber: "", quantity: 1, unitPrice: 0 }],
      notes: "",
      shippingAddress: ""
    })
    toast.success(`Purchase Order ${poNumber} created successfully`)
  }

  // Handler: Approve Order
  const handleApproveOrder = () => {
    if (!selectedOrder) return

    const updatedOrders = (orders || []).map(order =>
      order.id === selectedOrder.id
        ? { ...order, status: "approved" as PurchaseOrder["status"], approvedBy: "Current User" }
        : order
    )

    setOrders(updatedOrders)
    setIsDetailsDialogOpen(false)
    toast.success(`Purchase Order ${selectedOrder.poNumber} approved`)
  }

  // Handler: Reject Order
  const handleRejectOrder = () => {
    if (!selectedOrder || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    const updatedOrders = (orders || []).map(order =>
      order.id === selectedOrder.id
        ? { ...order, status: "cancelled" as PurchaseOrder["status"], notes: `${order.notes}\n\nRejection Reason: ${rejectionReason}` }
        : order
    )

    setOrders(updatedOrders)
    setIsRejectDialogOpen(false)
    setIsDetailsDialogOpen(false)
    setRejectionReason("")
    toast.success(`Purchase Order ${selectedOrder.poNumber} rejected`)
  }

  // Handler: Place Order
  const handlePlaceOrder = () => {
    if (!selectedOrder) return

    const updatedOrders = (orders || []).map(order =>
      order.id === selectedOrder.id
        ? { ...order, status: "ordered" as PurchaseOrder["status"] }
        : order
    )

    setOrders(updatedOrders)
    setIsDetailsDialogOpen(false)
    toast.success(`Purchase Order ${selectedOrder.poNumber} has been placed with vendor`)
  }

  // Helper: Add item to new PO
  const addItem = () => {
    setNewPO({
      ...newPO,
      items: [...newPO.items, { description: "", partNumber: "", quantity: 1, unitPrice: 0 }]
    })
  }

  // Helper: Remove item from new PO
  const removeItem = (index: number) => {
    if (newPO.items.length > 1) {
      setNewPO({
        ...newPO,
        items: newPO.items.filter((_, i) => i !== index)
      })
    }
  }

  // Helper: Update item in new PO
  const updateItem = (index: number, field: keyof POItem, value: string | number) => {
    const updatedItems = newPO.items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    )
    setNewPO({ ...newPO, items: updatedItems })
  }

  const getStatusColor = (status: PurchaseOrder["status"]) => {
    const colors: Record<PurchaseOrder["status"], string> = {
      draft: "bg-gray-100 text-gray-700",
      "pending-approval": "bg-yellow-100 text-yellow-700",
      approved: "bg-blue-100 text-blue-700",
      ordered: "bg-purple-100 text-purple-700",
      received: "bg-green-100 text-green-700",
      cancelled: "bg-red-100 text-red-700"
    }
    return colors[status]
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Purchase Orders</h2>
          <p className="text-muted-foreground">Manage parts and service purchase orders</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Purchase Order
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(orders || []).length}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <ShoppingCart className="w-3 h-3" />
              All time
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSpend.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
              <TrendUp className="w-3 h-3" />
              Cumulative
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingOrders}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Package className="w-3 h-3" />
              Awaiting review
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{activeOrders}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <ShoppingCart className="w-3 h-3" />
              In progress
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search purchase orders..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders ({filteredOrders.length})</CardTitle>
          <CardDescription>Track and manage all purchase orders</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO Number</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Expected Delivery</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No purchase orders found. Create your first order to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono font-medium">{order.poNumber}</TableCell>
                    <TableCell>{order.vendorName}</TableCell>
                    <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(order.expectedDelivery).toLocaleDateString()}</TableCell>
                    <TableCell>{order.items.length} items</TableCell>
                    <TableCell className="font-semibold">${order.total.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)} variant="secondary">
                        {order.status.replace("-", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order)
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

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Purchase Order Details</DialogTitle>
            <DialogDescription>
              Complete information for PO #{selectedOrder?.poNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold mb-3">Order Information</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">PO Number:</span>
                      <p className="font-medium font-mono">{selectedOrder.poNumber}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Vendor:</span>
                      <p className="font-medium">{selectedOrder.vendorName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <div className="mt-1">
                        <Badge className={getStatusColor(selectedOrder.status)} variant="secondary">
                          {selectedOrder.status.replace("-", " ")}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-3">Dates</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Order Date:</span>
                      <p className="font-medium">{new Date(selectedOrder.date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Expected Delivery:</span>
                      <p className="font-medium">{new Date(selectedOrder.expectedDelivery).toLocaleDateString()}</p>
                    </div>
                    {selectedOrder.deliveryDate && (
                      <div>
                        <span className="text-muted-foreground">Actual Delivery:</span>
                        <p className="font-medium">{new Date(selectedOrder.deliveryDate).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-3">Order Items</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-2 font-medium">Item</th>
                        <th className="text-left p-2 font-medium">Part Number</th>
                        <th className="text-right p-2 font-medium">Qty</th>
                        <th className="text-right p-2 font-medium">Unit Price</th>
                        <th className="text-right p-2 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-2">{item.description}</td>
                          <td className="p-2 font-mono text-xs">{item.partNumber}</td>
                          <td className="p-2 text-right">{item.quantity}</td>
                          <td className="p-2 text-right">${item.unitPrice.toFixed(2)}</td>
                          <td className="p-2 text-right font-medium">${(item.quantity * item.unitPrice).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted border-t-2">
                      <tr>
                        <td colSpan={4} className="p-2 text-right font-semibold">Total:</td>
                        <td className="p-2 text-right font-bold">${selectedOrder.total.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {selectedOrder.requestedBy && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Requestor Information</h3>
                  <div className="text-sm">
                    <p><span className="text-muted-foreground">Requested by:</span> {selectedOrder.requestedBy}</p>
                    {selectedOrder.department && (
                      <p><span className="text-muted-foreground">Department:</span> {selectedOrder.department}</p>
                    )}
                    {selectedOrder.approvedBy && (
                      <p><span className="text-muted-foreground">Approved by:</span> {selectedOrder.approvedBy}</p>
                    )}
                  </div>
                </div>
              )}

              {selectedOrder.notes && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Notes</h3>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}

              {selectedOrder.shippingAddress && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Shipping Address</h3>
                  <p className="text-sm whitespace-pre-line">{selectedOrder.shippingAddress}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
            {selectedOrder && selectedOrder.status === "pending-approval" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsRejectDialogOpen(true)
                  }}
                >
                  Reject
                </Button>
                <Button onClick={handleApproveOrder}>Approve Order</Button>
              </>
            )}
            {selectedOrder && selectedOrder.status === "approved" && (
              <Button onClick={handlePlaceOrder}>Place Order</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Purchase Order Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Purchase Order</DialogTitle>
            <DialogDescription>
              Fill in the details below to create a new purchase order
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor Name *</Label>
                <Input
                  id="vendor"
                  placeholder="e.g., AutoZone, NAPA, etc."
                  value={newPO.vendorName}
                  onChange={(e) => setNewPO({ ...newPO, vendorName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery-date">Expected Delivery</Label>
                <Input
                  id="delivery-date"
                  type="date"
                  value={newPO.expectedDelivery}
                  onChange={(e) => setNewPO({ ...newPO, expectedDelivery: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Order Items *</Label>
                <Button variant="outline" size="sm" onClick={addItem}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
              </div>
              <div className="border rounded-lg p-4 space-y-3">
                {newPO.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-4 space-y-2">
                      <Label className="text-xs">Description</Label>
                      <Input
                        placeholder="Item description"
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                      />
                    </div>
                    <div className="col-span-3 space-y-2">
                      <Label className="text-xs">Part Number</Label>
                      <Input
                        placeholder="Part #"
                        value={item.partNumber}
                        onChange={(e) => updateItem(index, 'partNumber', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label className="text-xs">Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label className="text-xs">Unit Price</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        disabled={newPO.items.length === 1}
                      >
                        <Trash className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total:</span>
                    <span className="text-lg font-bold">
                      ${newPO.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shipping">Shipping Address</Label>
              <Textarea
                id="shipping"
                placeholder="Enter shipping address..."
                value={newPO.shippingAddress}
                onChange={(e) => setNewPO({ ...newPO, shippingAddress: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes or special instructions..."
                value={newPO.notes}
                onChange={(e) => setNewPO({ ...newPO, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePO}>
              Create Purchase Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Purchase Order Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Purchase Order</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting PO #{selectedOrder?.poNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsRejectDialogOpen(false)
              setRejectionReason("")
            }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectOrder}>
              Reject Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
