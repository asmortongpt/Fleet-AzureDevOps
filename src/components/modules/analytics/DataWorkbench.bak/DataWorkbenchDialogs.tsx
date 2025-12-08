import { MagnifyingGlass } from "@phosphor-icons/react"
import { useState } from "react"

import { AdvancedSearchCriteria } from "./types"

import { Button } from "@/components/ui/button"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Vehicle } from "@/lib/types"


interface DataWorkbenchDialogsProps {
  vehicles: Vehicle[]
  isAddVehicleOpen: boolean
  isScheduleServiceOpen: boolean
  isAdvancedSearchOpen: boolean
  onAddVehicleClose: () => void
  onScheduleServiceClose: () => void
  onAdvancedSearchClose: () => void
  onAddVehicle: (vehicle: any) => void
  onScheduleService: () => void
  onAdvancedSearch: (criteria: AdvancedSearchCriteria) => void
}

export function DataWorkbenchDialogs({
  vehicles,
  isAddVehicleOpen,
  isScheduleServiceOpen,
  isAdvancedSearchOpen,
  onAddVehicleClose,
  onScheduleServiceClose,
  onAdvancedSearchClose,
  onAddVehicle,
  onScheduleService,
  onAdvancedSearch
}: DataWorkbenchDialogsProps) {
  const [newVehicle, setNewVehicle] = useState({
    number: "",
    make: "",
    model: "",
    year: new Date().getFullYear(),
    vin: "",
    licensePlate: ""
  })

  const [advancedSearchCriteria, setAdvancedSearchCriteria] = useState<AdvancedSearchCriteria>({
    vehicleNumber: "",
    make: "",
    model: "",
    vin: "",
    licensePlate: "",
    yearFrom: "",
    yearTo: "",
    status: "all",
    department: "",
    region: "",
    assignedDriver: "",
    fuelLevelMin: "",
    fuelLevelMax: "",
    mileageMin: "",
    mileageMax: ""
  })

  const handleSaveVehicle = () => {
    onAddVehicle(newVehicle)
    setNewVehicle({
      number: "",
      make: "",
      model: "",
      year: new Date().getFullYear(),
      vin: "",
      licensePlate: ""
    })
  }

  const handleAdvancedSearch = () => {
    onAdvancedSearch(advancedSearchCriteria)
  }

  return (
    <>
      {/* Add Vehicle Dialog */}
      <Dialog open={isAddVehicleOpen} onOpenChange={onAddVehicleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Vehicle</DialogTitle>
            <DialogDescription>
              Enter the vehicle information to add it to your fleet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="vehicle-number">Vehicle Number *</Label>
              <Input
                id="vehicle-number"
                placeholder="e.g., UNIT-021"
                value={newVehicle.number}
                onChange={(e) => setNewVehicle({ ...newVehicle, number: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="make">Make *</Label>
                <Input
                  id="make"
                  placeholder="e.g., Ford"
                  value={newVehicle.make}
                  onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model *</Label>
                <Input
                  id="model"
                  placeholder="e.g., F-150"
                  value={newVehicle.model}
                  onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                placeholder="2024"
                value={newVehicle.year}
                onChange={(e) => setNewVehicle({ ...newVehicle, year: parseInt(e.target.value) || new Date().getFullYear() })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vin">VIN</Label>
              <Input
                id="vin"
                placeholder="1FTFW1E12345678"
                value={newVehicle.vin}
                onChange={(e) => setNewVehicle({ ...newVehicle, vin: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="license-plate">License Plate</Label>
              <Input
                id="license-plate"
                placeholder="FL-1234"
                value={newVehicle.licensePlate}
                onChange={(e) => setNewVehicle({ ...newVehicle, licensePlate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onAddVehicleClose}>
              Cancel
            </Button>
            <Button onClick={handleSaveVehicle}>
              Add Vehicle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Advanced Search Dialog */}
      <Dialog open={isAdvancedSearchOpen} onOpenChange={onAdvancedSearchClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Advanced Search</DialogTitle>
            <DialogDescription>
              Search vehicles using multiple criteria to find exactly what you need
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Vehicle Identification */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Vehicle Identification</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adv-vehicle-number">Vehicle Number</Label>
                  <Input
                    id="adv-vehicle-number"
                    placeholder="e.g., UNIT-021"
                    value={advancedSearchCriteria.vehicleNumber}
                    onChange={(e) => setAdvancedSearchCriteria({ ...advancedSearchCriteria, vehicleNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adv-vin">VIN</Label>
                  <Input
                    id="adv-vin"
                    placeholder="Vehicle Identification Number"
                    value={advancedSearchCriteria.vin}
                    onChange={(e) => setAdvancedSearchCriteria({ ...advancedSearchCriteria, vin: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adv-license">License Plate</Label>
                  <Input
                    id="adv-license"
                    placeholder="e.g., FL-1234"
                    value={advancedSearchCriteria.licensePlate}
                    onChange={(e) => setAdvancedSearchCriteria({ ...advancedSearchCriteria, licensePlate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adv-status">Status</Label>
                  <Select
                    value={advancedSearchCriteria.status}
                    onValueChange={(value) => setAdvancedSearchCriteria({ ...advancedSearchCriteria, status: value })}
                  >
                    <SelectTrigger id="adv-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="service">In Service</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Vehicle Specifications */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Vehicle Specifications</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adv-make">Make</Label>
                  <Input
                    id="adv-make"
                    placeholder="e.g., Ford, Chevrolet"
                    value={advancedSearchCriteria.make}
                    onChange={(e) => setAdvancedSearchCriteria({ ...advancedSearchCriteria, make: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adv-model">Model</Label>
                  <Input
                    id="adv-model"
                    placeholder="e.g., F-150, Silverado"
                    value={advancedSearchCriteria.model}
                    onChange={(e) => setAdvancedSearchCriteria({ ...advancedSearchCriteria, model: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adv-year-from">Year From</Label>
                  <Input
                    id="adv-year-from"
                    type="number"
                    placeholder="e.g., 2020"
                    value={advancedSearchCriteria.yearFrom}
                    onChange={(e) => setAdvancedSearchCriteria({ ...advancedSearchCriteria, yearFrom: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adv-year-to">Year To</Label>
                  <Input
                    id="adv-year-to"
                    type="number"
                    placeholder="e.g., 2024"
                    value={advancedSearchCriteria.yearTo}
                    onChange={(e) => setAdvancedSearchCriteria({ ...advancedSearchCriteria, yearTo: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Assignment & Location */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Assignment & Location</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adv-department">Department</Label>
                  <Input
                    id="adv-department"
                    placeholder="e.g., Operations, Maintenance"
                    value={advancedSearchCriteria.department}
                    onChange={(e) => setAdvancedSearchCriteria({ ...advancedSearchCriteria, department: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adv-region">Region</Label>
                  <Input
                    id="adv-region"
                    placeholder="e.g., North, South, Central"
                    value={advancedSearchCriteria.region}
                    onChange={(e) => setAdvancedSearchCriteria({ ...advancedSearchCriteria, region: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="adv-driver">Assigned Driver</Label>
                  <Input
                    id="adv-driver"
                    placeholder="Driver name"
                    value={advancedSearchCriteria.assignedDriver}
                    onChange={(e) => setAdvancedSearchCriteria({ ...advancedSearchCriteria, assignedDriver: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Performance Metrics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adv-fuel-min">Fuel Level Min (%)</Label>
                  <Input
                    id="adv-fuel-min"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={advancedSearchCriteria.fuelLevelMin}
                    onChange={(e) => setAdvancedSearchCriteria({ ...advancedSearchCriteria, fuelLevelMin: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adv-fuel-max">Fuel Level Max (%)</Label>
                  <Input
                    id="adv-fuel-max"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="100"
                    value={advancedSearchCriteria.fuelLevelMax}
                    onChange={(e) => setAdvancedSearchCriteria({ ...advancedSearchCriteria, fuelLevelMax: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adv-mileage-min">Mileage Min</Label>
                  <Input
                    id="adv-mileage-min"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={advancedSearchCriteria.mileageMin}
                    onChange={(e) => setAdvancedSearchCriteria({ ...advancedSearchCriteria, mileageMin: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adv-mileage-max">Mileage Max</Label>
                  <Input
                    id="adv-mileage-max"
                    type="number"
                    min="0"
                    placeholder="999999"
                    value={advancedSearchCriteria.mileageMax}
                    onChange={(e) => setAdvancedSearchCriteria({ ...advancedSearchCriteria, mileageMax: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onAdvancedSearchClose}>
              Cancel
            </Button>
            <Button onClick={handleAdvancedSearch}>
              <MagnifyingGlass className="w-4 h-4 mr-2" />
              Search
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Service Dialog */}
      <Dialog open={isScheduleServiceOpen} onOpenChange={onScheduleServiceClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Service</DialogTitle>
            <DialogDescription>
              Schedule maintenance service for a vehicle
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="service-vehicle">Vehicle *</Label>
              <Select>
                <SelectTrigger id="service-vehicle">
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.slice(0, 10).map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.number} - {v.make} {v.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-type">Service Type *</Label>
              <Select>
                <SelectTrigger id="service-type">
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oil-change">Oil Change</SelectItem>
                  <SelectItem value="tire-rotation">Tire Rotation</SelectItem>
                  <SelectItem value="brake-service">Brake Service</SelectItem>
                  <SelectItem value="engine-tuneup">Engine Tune-up</SelectItem>
                  <SelectItem value="transmission">Transmission Service</SelectItem>
                  <SelectItem value="battery">Battery Replacement</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-date">Scheduled Date *</Label>
              <Input
                id="service-date"
                type="date"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-notes">Notes</Label>
              <Input
                id="service-notes"
                placeholder="Additional notes or instructions"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onScheduleServiceClose}>
              Cancel
            </Button>
            <Button onClick={onScheduleService}>
              Schedule Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
