import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import { Plus, MagnifyingGlass, Star, Envelope, Phone, MapPin } from "@phosphor-icons/react"
import { Vendor } from "@/lib/types"
import { toast } from "sonner"

export function VendorManagement() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)

  const [newVendor, setNewVendor] = useState<Partial<Vendor>>({
    name: "",
    type: "parts",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    rating: 0,
    status: "active",
    services: [],
    paymentTerms: "Net 30",
    taxId: "",
    certifications: [],
    totalSpend: 0,
    invoiceCount: 0
  })

  const filteredVendors = (vendors || []).filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || vendor.type === filterType

    return matchesSearch && matchesType
  })

  const handleAddVendor = () => {
    if (!newVendor.name || !newVendor.email || !newVendor.phone) {
      toast.error("Please fill in required fields")
      return
    }

    const vendor: Vendor = {
      id: `vendor-${Date.now()}`,
      tenantId: "default-tenant", // TODO: Get from tenant context
      name: newVendor.name,
      type: newVendor.type as Vendor["type"],
      contactPerson: newVendor.contactPerson || "",
      email: newVendor.email,
      phone: newVendor.phone,
      address: newVendor.address || "",
      website: newVendor.website,
      rating: newVendor.rating || 0,
      status: newVendor.status as Vendor["status"],
      services: newVendor.services || [],
      paymentTerms: newVendor.paymentTerms || "Net 30",
      taxId: newVendor.taxId || "",
      certifications: newVendor.certifications || [],
      totalSpend: 0,
      invoiceCount: 0
    }

    setVendors(current => [...(current || []), vendor])
    toast.success("Vendor added successfully")
    setIsAddDialogOpen(false)
    setNewVendor({
      name: "",
      type: "parts",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      status: "active",
      services: [],
      paymentTerms: "Net 30",
      taxId: "",
      certifications: [],
      totalSpend: 0,
      invoiceCount: 0
    })
  }

  const getTypeColor = (type: Vendor["type"]) => {
    const colors: Record<Vendor["type"], string> = {
      parts: "bg-blue-100 text-blue-700",
      service: "bg-green-100 text-green-700",
      fuel: "bg-orange-100 text-orange-700",
      insurance: "bg-purple-100 text-purple-700",
      leasing: "bg-pink-100 text-pink-700",
      towing: "bg-yellow-100 text-yellow-700",
      other: "bg-gray-100 text-gray-700"
    }
    return colors[type]
  }

  const getStatusColor = (status: Vendor["status"]) => {
    const colors: Record<Vendor["status"], string> = {
      active: "bg-green-100 text-green-700",
      inactive: "bg-gray-100 text-gray-700",
      suspended: "bg-red-100 text-red-700"
    }
    return colors[status]
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Vendor Management</h2>
          <p className="text-muted-foreground">Manage your fleet service providers and suppliers</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Vendor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Vendor</DialogTitle>
              <DialogDescription>
                Enter vendor information to add them to your supplier network
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vendor-name">Vendor Name *</Label>
                  <Input
                    id="vendor-name"
                    value={newVendor.name}
                    onChange={e => setNewVendor({ ...newVendor, name: e.target.value })}
                    placeholder="Acme Auto Parts"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vendor-type">Type *</Label>
                  <Select
                    value={newVendor.type}
                    onValueChange={value => setNewVendor({ ...newVendor, type: value as Vendor["type"] })}
                  >
                    <SelectTrigger id="vendor-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parts">Parts Supplier</SelectItem>
                      <SelectItem value="service">Service Provider</SelectItem>
                      <SelectItem value="fuel">Fuel Station</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                      <SelectItem value="leasing">Leasing Company</SelectItem>
                      <SelectItem value="towing">Towing Service</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact-person">Contact Person *</Label>
                  <Input
                    id="contact-person"
                    value={newVendor.contactPerson}
                    onChange={e => setNewVendor({ ...newVendor, contactPerson: e.target.value })}
                    placeholder="John Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vendor-email">Email *</Label>
                  <Input
                    id="vendor-email"
                    type="email"
                    value={newVendor.email}
                    onChange={e => setNewVendor({ ...newVendor, email: e.target.value })}
                    placeholder="contact@vendor.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vendor-phone">Phone *</Label>
                  <Input
                    id="vendor-phone"
                    value={newVendor.phone}
                    onChange={e => setNewVendor({ ...newVendor, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vendor-website">Website</Label>
                  <Input
                    id="vendor-website"
                    value={newVendor.website}
                    onChange={e => setNewVendor({ ...newVendor, website: e.target.value })}
                    placeholder="https://vendor.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor-address">Address</Label>
                <Textarea
                  id="vendor-address"
                  value={newVendor.address}
                  onChange={e => setNewVendor({ ...newVendor, address: e.target.value })}
                  placeholder="123 Main St, City, State ZIP"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payment-terms">Payment Terms</Label>
                  <Select
                    value={newVendor.paymentTerms}
                    onValueChange={value => setNewVendor({ ...newVendor, paymentTerms: value })}
                  >
                    <SelectTrigger id="payment-terms">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                      <SelectItem value="Net 15">Net 15</SelectItem>
                      <SelectItem value="Net 30">Net 30</SelectItem>
                      <SelectItem value="Net 60">Net 60</SelectItem>
                      <SelectItem value="Net 90">Net 90</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax-id">Tax ID</Label>
                  <Input
                    id="tax-id"
                    value={newVendor.taxId}
                    onChange={e => setNewVendor({ ...newVendor, taxId: e.target.value })}
                    placeholder="XX-XXXXXXX"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddVendor}>Add Vendor</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="parts">Parts Supplier</SelectItem>
            <SelectItem value="service">Service Provider</SelectItem>
            <SelectItem value="fuel">Fuel Station</SelectItem>
            <SelectItem value="insurance">Insurance</SelectItem>
            <SelectItem value="leasing">Leasing</SelectItem>
            <SelectItem value="towing">Towing</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendors ({filteredVendors.length})</CardTitle>
          <CardDescription>Active supplier and service provider relationships</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Total Spend</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVendors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No vendors found. Add your first vendor to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredVendors.map(vendor => (
                  <TableRow key={vendor.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{vendor.name}</div>
                        <div className="text-sm text-muted-foreground">{vendor.contactPerson}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(vendor.type)} variant="secondary">
                        {vendor.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <Envelope className="w-3 h-3 text-muted-foreground" />
                          {vendor.email}
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          {vendor.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" weight="fill" />
                        <span>{vendor.rating.toFixed(1)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      ${vendor.totalSpend.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(vendor.status)} variant="secondary">
                        {vendor.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.location?.href = `tel:${vendor.phone}`}
                        >
                          <Phone className="w-4 h-4 mr-1" />
                          Call
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.location?.href = `mailto:${vendor.email}`}
                        >
                          <Envelope className="w-4 h-4 mr-1" />
                          Email
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedVendor(vendor)
                            setIsDetailsDialogOpen(true)
                          }}
                        >
                          View Details
                        </Button>
                      </div>
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
            <DialogTitle>Vendor Details</DialogTitle>
            <DialogDescription>
              Complete information for {selectedVendor?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedVendor && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold mb-3">Basic Information</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Vendor Name:</span>
                      <p className="font-medium">{selectedVendor.name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <div className="mt-1">
                        <Badge className={getTypeColor(selectedVendor.type)} variant="secondary">
                          {selectedVendor.type}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <div className="mt-1">
                        <Badge className={getStatusColor(selectedVendor.status)} variant="secondary">
                          {selectedVendor.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-3">Contact Information</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Contact Person:</span>
                      <p className="font-medium">{selectedVendor.contactPerson}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="font-medium">{selectedVendor.email}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.location?.href = `mailto:${selectedVendor.email}`}
                        >
                          <Envelope className="w-3 h-3 mr-1" />
                          Email
                        </Button>
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="font-medium">{selectedVendor.phone}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.location?.href = `tel:${selectedVendor.phone}`}
                        >
                          <Phone className="w-3 h-3 mr-1" />
                          Call
                        </Button>
                      </div>
                    </div>
                    {selectedVendor.website && (
                      <div>
                        <span className="text-muted-foreground">Website:</span>
                        <p className="font-medium">
                          <a
                            href={selectedVendor.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {selectedVendor.website}
                          </a>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-3">Address</h3>
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <p>{selectedVendor.address || "No address provided"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold mb-3">Financial Information</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Payment Terms:</span>
                      <p className="font-medium">{selectedVendor.paymentTerms}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tax ID:</span>
                      <p className="font-medium">{selectedVendor.taxId || "Not provided"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Spend:</span>
                      <p className="font-medium text-lg">${selectedVendor.totalSpend.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Invoice Count:</span>
                      <p className="font-medium">{selectedVendor.invoiceCount}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-3">Performance</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Rating:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Star className="w-5 h-5 text-yellow-500" weight="fill" />
                        <span className="font-medium text-lg">{selectedVendor.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {selectedVendor.services && selectedVendor.services.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Services Provided</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedVendor.services.map((service, index) => (
                      <Badge key={index} variant="outline">{service}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedVendor.certifications && selectedVendor.certifications.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Certifications</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedVendor.certifications.map((cert, index) => (
                      <Badge key={index} variant="secondary">{cert}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
