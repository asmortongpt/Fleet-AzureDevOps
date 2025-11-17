import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "@phosphor-icons/react"
import { Vehicle } from "@/lib/types"
import { toast } from "sonner"

interface AddVehicleDialogProps {
  onAdd: (vehicle: Vehicle) => void
}

export function AddVehicleDialog({ onAdd }: AddVehicleDialogProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    number: "",
    type: "sedan" as Vehicle["type"],
    make: "",
    model: "",
    year: new Date().getFullYear().toString(),
    vin: "",
    licensePlate: "",
    fuelType: "gasoline" as Vehicle["fuelType"],
    ownership: "owned" as Vehicle["ownership"],
    department: "Operations",
    region: "Central"
  })

  const handleSubmit = () => {
    if (!formData.number || !formData.make || !formData.model || !formData.vin || !formData.licensePlate) {
      toast.error("Please fill in all required fields")
      return
    }

    const newVehicle: Vehicle = {
      id: `veh-${Date.now()}`,
      tenantId: "default-tenant", // TODO: Get from tenant context
      number: formData.number,
      type: formData.type,
      make: formData.make,
      model: formData.model,
      year: parseInt(formData.year),
      vin: formData.vin,
      licensePlate: formData.licensePlate,
      status: "active",
      location: {
        lat: 27.9506 + (Math.random() - 0.5) * 2,
        lng: -82.4572 + (Math.random() - 0.5) * 2,
        address: "Fleet Headquarters, FL"
      },
      region: formData.region,
      department: formData.department,
      fuelLevel: 100,
      fuelType: formData.fuelType,
      mileage: 0,
      ownership: formData.ownership,
      lastService: new Date().toISOString().split('T')[0],
      nextService: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      alerts: []
    }

    onAdd(newVehicle)
    toast.success(`Vehicle ${formData.number} added successfully`)
    setOpen(false)
    setFormData({
      number: "",
      type: "sedan",
      make: "",
      model: "",
      year: new Date().getFullYear().toString(),
      vin: "",
      licensePlate: "",
      fuelType: "gasoline",
      ownership: "owned",
      department: "Operations",
      region: "Central"
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Vehicle
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Vehicle</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1">
          <div className="space-y-2">
            <Label htmlFor="number">Vehicle Number *</Label>
            <Input
              id="number"
              value={formData.number}
              onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              placeholder="FL-1001"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Vehicle Type</Label>
            <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as Vehicle["type"] })}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sedan">Sedan</SelectItem>
                <SelectItem value="suv">SUV</SelectItem>
                <SelectItem value="truck">Truck</SelectItem>
                <SelectItem value="van">Van</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="specialty">Specialty</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="make">Make *</Label>
            <Input
              id="make"
              value={formData.make}
              onChange={(e) => setFormData({ ...formData, make: e.target.value })}
              placeholder="Ford"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Model *</Label>
            <Input
              id="model"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="Explorer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <Input
              id="year"
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vin">VIN *</Label>
            <Input
              id="vin"
              value={formData.vin}
              onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
              placeholder="1HGBH41JXMN109186"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="licensePlate">License Plate *</Label>
            <Input
              id="licensePlate"
              value={formData.licensePlate}
              onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
              placeholder="ABC1234"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fuelType">Fuel Type</Label>
            <Select value={formData.fuelType} onValueChange={(v) => setFormData({ ...formData, fuelType: v as Vehicle["fuelType"] })}>
              <SelectTrigger id="fuelType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gasoline">Gasoline</SelectItem>
                <SelectItem value="diesel">Diesel</SelectItem>
                <SelectItem value="electric">Electric</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ownership">Ownership</Label>
            <Select value={formData.ownership} onValueChange={(v) => setFormData({ ...formData, ownership: v as Vehicle["ownership"] })}>
              <SelectTrigger id="ownership">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owned">Owned</SelectItem>
                <SelectItem value="leased">Leased</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select value={formData.department} onValueChange={(v) => setFormData({ ...formData, department: v })}>
              <SelectTrigger id="department">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Operations">Operations</SelectItem>
                <SelectItem value="Sales">Sales</SelectItem>
                <SelectItem value="Executive">Executive</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="Logistics">Logistics</SelectItem>
                <SelectItem value="Security">Security</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="region">Region</Label>
            <Select value={formData.region} onValueChange={(v) => setFormData({ ...formData, region: v })}>
              <SelectTrigger id="region">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="North">North</SelectItem>
                <SelectItem value="South">South</SelectItem>
                <SelectItem value="East">East</SelectItem>
                <SelectItem value="West">West</SelectItem>
                <SelectItem value="Central">Central</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Add Vehicle
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
