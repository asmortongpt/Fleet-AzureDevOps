import { ShoppingCart, Plus, MagnifyingGlass, Package, TrendUp, Trash } from "@phosphor-icons/react"
import { useState } from "react"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { PurchaseOrder } from "@/lib/types"

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
  const [_filterStatus, _setFilterStatus] = useState<string>("all")
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
    const matchesStatus = _filterStatus === "all" || order.status === _filterStatus

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
      vendorId: `vendor-${Date.now()}`,
      vendorName: newPO.vendorName,
      date: new Date().toISOString(),
      expectedDelivery: newPO.expectedDelivery,
      deliveryDate: "",
      items: newPO.items.filter(item => item.description && item.quantity > 0) as PurchaseOrder['items'],
      subtotal: total * 0.9,
      tax: total * 0.1,
      shipping: 0,
      total,
      status: "pending-approval",
      notes: newPO.notes,
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
                        <th className="text-left p-2 font-medium">Part #</th>
                        <th className="text-right p-2 font-medium">Qty</th>
                        <th className="text-right p-2 font-medium">Price</th>
                        <th className="text-right p-2 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-2">{item.description}</td>
                          <td className="p-2 text-muted-foreground">{item.partNumber || '-'}</td>
                          <td className="p-2 text-right">{item.quantity}</td>
                          <td className="p-2 text-right">${item.unitPrice.toFixed(2)}</td>
                          <td className="p-2 text-right font-medium">${(item.quantity * item.unitPrice).toFixed(2)}</td>
                        </tr>
                      ))}
                      <tr className="border-t font-medium">
                        <td className="p-2" colSpan={4}>Total</td>
                        <td className="p-2 text-right">${selectedOrder.total.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold mb-3">Request Information</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Requested By:</span>
                      <p className="font-medium">{selectedOrder.requestedBy || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Department:</span>
                      <p className="font-medium">{selectedOrder.department || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-3">Shipping Information</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Shipping Address:</span>
                      <p className="font-medium">{selectedOrder.shippingAddress || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Notes</h3>
                  <p className="text-sm whitespace-pre-line text-muted-foreground">{selectedOrder.notes}</p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                {selectedOrder.status === 'pending-approval' && (
                  <>
                    <Button variant="outline" onClick={() => setIsRejectDialogOpen(true)}>
                      Reject
                    </Button>
                    <Button onClick={handleApproveOrder}>
                      Approve Order
                    </Button>
                  </>
                )}
                {selectedOrder.status === 'approved' && (
                  <Button onClick={handlePlaceOrder}>
                    Place Order with Vendor
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Purchase Order</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting PO #{selectedOrder?.poNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Rejection Reason</Label>
              <Textarea
                id="rejectionReason"
                placeholder="Explain why this purchase order is being rejected..."
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectOrder}>
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Purchase Order</DialogTitle>
            <DialogDescription>
              Enter details for a new purchase order request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vendorName">Vendor Name</Label>
                  <Input
                    id="vendorName"
                    placeholder="Enter vendor name"
                    value={newPO.vendorName}
                    onChange={e => setNewPO({ ...newPO, vendorName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expectedDelivery">Expected Delivery</Label>
                  <Input
                    id="expectedDelivery"
                    type="date"
                    value={newPO.expectedDelivery}
                    onChange={e => setNewPO({ ...newPO, expectedDelivery: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Shipping Address</Label>
                <Textarea
                  placeholder="Enter shipping address for this order"
                  value={newPO.shippingAddress}
                  onChange={e => setNewPO({ ...newPO, shippingAddress: e.target.value })}
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-3">Items</h3>
              <div className="space-y-4">
                {newPO.items.map((item, index) => (
                  <div key={index} className="border rounded-md p-3 space-y-3">
                    <div className="grid grid-cols-[2fr_1fr_1fr_1fr_0.5fr] gap-3 items-center">
                      <div className="space-y-2">
                        <Label htmlFor={`description-${index}`}>Description</Label>
                        <Input
                          id={`description-${index}`}
                          placeholder="Item description"
                          value={item.description}
                          onChange={e => updateItem(index, 'description', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`partNumber-${index}`}>Part #</Label>
                        <Input
                          id={`partNumber-${index}`}
                          placeholder="Part number"
                          value={item.partNumber}
                          onChange={e => updateItem(index, 'partNumber', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`quantity-${index}`}>Qty</Label>
                        <Input
                          id={`quantity-${index}`}
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`unitPrice-${index}`}>Price</Label>
                        <Input
                          id={`unitPrice-${index}`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitPrice}
                          onChange={e => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        disabled={newPO.items.length === 1}
                      >
                        <Trash className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addItem}>
                  <Plus className="w-3 h-3 mr-1" />
                  Add Item
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional information for this purchase order..."
                value={newPO.notes}
                onChange={e => setNewPO({ ...newPO, notes: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePO}>
                Create Purchase Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}