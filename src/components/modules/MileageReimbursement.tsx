import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { 
  Receipt,
  Plus,
  FileText,
  CurrencyDollar,
  Car,
  MapPin,
  Calendar,
  CheckCircle,
  Clock,
  X
} from "@phosphor-icons/react"
import { useFleetData } from "@/hooks/use-fleet-data"
import { MileageReimbursement as MileageReimbursementType } from "@/lib/types"
import { toast } from "sonner"

const REIMBURSEMENT_RATE = 0.655

interface MileageReimbursementProps {
  data: ReturnType<typeof useFleetData>
}

export function MileageReimbursement({ data }: MileageReimbursementProps) {
  const requests = data.mileageReimbursements || []

  const [showForm, setShowForm] = useState(false)
  const [employeeName, setEmployeeName] = useState("")
  const [vehicleType, setVehicleType] = useState("sedan")
  const [tripDate, setTripDate] = useState("")
  const [startLocation, setStartLocation] = useState("")
  const [endLocation, setEndLocation] = useState("")
  const [miles, setMiles] = useState("")
  const [purpose, setPurpose] = useState("")

  const handleSubmit = () => {
    if (!employeeName || !tripDate || !miles || !startLocation || !endLocation || !purpose) {
      toast.error("Please fill in all required fields")
      return
    }

    const milesNum = parseFloat(miles)
    const amount = milesNum * REIMBURSEMENT_RATE

    const newRequest: MileageReimbursementType = {
      id: `mr-${Date.now()}`,
      employeeId: `EMP${Math.floor(Math.random() * 10000)}`,
      employeeName,
      vehicleType,
      tripDate,
      startLocation,
      endLocation,
      miles: milesNum,
      purpose,
      rate: REIMBURSEMENT_RATE,
      amount: Math.round(amount * 100) / 100,
      status: "submitted",
      submittedDate: new Date().toISOString().split('T')[0]
    }

    data.addMileageReimbursement(newRequest)
    toast.success("Reimbursement request submitted")
    
    setShowForm(false)
    setEmployeeName("")
    setVehicleType("sedan")
    setTripDate("")
    setStartLocation("")
    setEndLocation("")
    setMiles("")
    setPurpose("")
  }

  const handleStatusChange = (id: string, status: MileageReimbursementType["status"]) => {
    data.updateMileageReimbursement(id, { status })
    if (status === "approved") {
      data.updateMileageReimbursement(id, { approvedDate: new Date().toISOString().split('T')[0] })
    }
    toast.success(`Request ${status}`)
  }

  const getStatusColor = (status: MileageReimbursementType["status"]) => {
    const colors = {
      draft: "bg-muted text-muted-foreground",
      submitted: "bg-warning/10 text-warning border-warning/20",
      approved: "bg-success/10 text-success border-success/20",
      rejected: "bg-destructive/10 text-destructive border-destructive/20",
      paid: "bg-accent/10 text-accent border-accent/20"
    }
    return colors[status]
  }

  const totalSubmitted = requests.filter(r => r.status === "submitted").reduce((sum, r) => sum + r.amount, 0)
  const totalApproved = requests.filter(r => r.status === "approved").reduce((sum, r) => sum + r.amount, 0)
  const totalPaid = requests.filter(r => r.status === "paid").reduce((sum, r) => sum + r.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Mileage Reimbursement</h1>
          <p className="text-muted-foreground mt-1">Submit and manage mileage reimbursement requests</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? (
            <>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              New Request
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-warning/10 text-warning">
                <Clock className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Submitted</p>
            </div>
            <p className="text-2xl font-semibold metric-number">${totalSubmitted.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {requests.filter(r => r.status === "submitted").length} requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-success/10 text-success">
                <CheckCircle className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Approved</p>
            </div>
            <p className="text-2xl font-semibold metric-number">${totalApproved.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {requests.filter(r => r.status === "approved").length} requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-accent/10 text-accent">
                <CurrencyDollar className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Paid</p>
            </div>
            <p className="text-2xl font-semibold metric-number">${totalPaid.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {requests.filter(r => r.status === "paid").length} requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-muted">
                <Receipt className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Standard Rate</p>
            </div>
            <p className="text-2xl font-semibold metric-number">${REIMBURSEMENT_RATE}/mi</p>
            <p className="text-sm text-muted-foreground mt-1">IRS standard rate</p>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Submit Mileage Reimbursement Request</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="employeeName">Employee Name</Label>
                <Input
                  id="employeeName"
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicleType">Vehicle Type</Label>
                <Select value={vehicleType} onValueChange={setVehicleType}>
                  <SelectTrigger id="vehicleType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedan">Sedan</SelectItem>
                    <SelectItem value="suv">SUV</SelectItem>
                    <SelectItem value="truck">Truck</SelectItem>
                    <SelectItem value="van">Van</SelectItem>
                    <SelectItem value="personal">Personal Vehicle</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tripDate">Trip Date</Label>
                <Input
                  id="tripDate"
                  type="date"
                  value={tripDate}
                  onChange={(e) => setTripDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="miles">Miles Traveled</Label>
                <Input
                  id="miles"
                  type="number"
                  value={miles}
                  onChange={(e) => setMiles(e.target.value)}
                  placeholder="Enter miles"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startLocation">Start Location</Label>
                <Input
                  id="startLocation"
                  value={startLocation}
                  onChange={(e) => setStartLocation(e.target.value)}
                  placeholder="Starting point"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endLocation">End Location</Label>
                <Input
                  id="endLocation"
                  value={endLocation}
                  onChange={(e) => setEndLocation(e.target.value)}
                  placeholder="Destination"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="purpose">Trip Purpose</Label>
                <Textarea
                  id="purpose"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Describe the business purpose of this trip"
                  rows={3}
                />
              </div>
            </div>

            {miles && (
              <div className="mt-6 p-4 bg-accent/5 border border-accent/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Estimated Reimbursement:</p>
                  <p className="text-2xl font-semibold metric-number">
                    ${(parseFloat(miles) * REIMBURSEMENT_RATE).toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <Button onClick={handleSubmit}>
                Submit Request
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Reimbursement Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No reimbursement requests yet</p>
              <p className="text-sm text-muted-foreground">Click "New Request" to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map(request => (
                <div 
                  key={request.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-muted">
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium">{request.employeeName}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {request.tripDate}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {request.miles} miles
                        </div>
                        <div className="flex items-center gap-1">
                          <Car className="w-4 h-4" />
                          {request.vehicleType}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {request.startLocation} → {request.endLocation}
                      </p>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <p className="text-xl font-semibold metric-number">${request.amount.toFixed(2)}</p>
                    <Badge variant="outline" className={getStatusColor(request.status)}>
                      {request.status}
                    </Badge>
                    {request.status === "submitted" && (
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="outline" onClick={() => handleStatusChange(request.id, "approved")}>
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleStatusChange(request.id, "rejected")}>
                          Reject
                        </Button>
                      </div>
                    )}
                    {request.status === "approved" && (
                      <Button size="sm" variant="outline" onClick={() => handleStatusChange(request.id, "paid")}>
                        Mark Paid
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
