import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useFleetData } from "@/hooks/use-fleet-data"
import { MaintenanceRequest } from "@/lib/types"

interface MaintenanceRequestDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    defaultVehicleId?: string
    data: ReturnType<typeof useFleetData>
    onSuccess?: () => void
}

export function MaintenanceRequestDialog({
    open,
    onOpenChange,
    defaultVehicleId = "",
    data,
    onSuccess
}: MaintenanceRequestDialogProps) {
    const [selectedVehicle, setSelectedVehicle] = useState(defaultVehicleId)
    const [issueType, setIssueType] = useState("")
    const [priority, setPriority] = useState<MaintenanceRequest["priority"]>("medium")
    const [description, setDescription] = useState("")
    const [requestedBy, setRequestedBy] = useState("")
    const [errors, setErrors] = useState<Record<string, string>>({})

    // Update selected vehicle when defaultVehicleId changes
    useEffect(() => {
        if (defaultVehicleId) {
            setSelectedVehicle(defaultVehicleId)
        }
    }, [defaultVehicleId])

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (!selectedVehicle) newErrors.selectedVehicle = "Vehicle is required"
        if (!issueType) newErrors.issueType = "Issue type is required"
        if (!description) newErrors.description = "Description is required"
        else if (description.length < 10) newErrors.description = "Description must be at least 10 characters"
        if (!requestedBy) newErrors.requestedBy = "Requester name is required"

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = () => {
        if (!validateForm()) {
            const missingFields = Object.keys(errors).map(key =>
                key.replace(/([A-Z])/g, ' $1').trim()
            ).join(', ')
            toast.error(`Missing or invalid fields: ${missingFields}`)
            return
        }

        const vehicle = data.vehicles?.find(v => v.id === selectedVehicle)
        if (!vehicle) return

        const newRequest: MaintenanceRequest = {
            id: `mr-${Date.now()}`,
            vehicleId: vehicle.id,
            vehicleNumber: vehicle.number,
            issueType,
            priority,
            description,
            requestedBy,
            requestDate: new Date().toISOString().split('T')[0] as string,
            status: "pending"
        }

        data.addMaintenanceRequest(newRequest)
        toast.success("Maintenance request submitted")

        // Reset form
        setSelectedVehicle("")
        setIssueType("")
        setPriority("medium")
        setDescription("")
        setRequestedBy("")
        setErrors({})

        // Close dialog
        onOpenChange(false)

        // Callback
        if (onSuccess) onSuccess()
    }

    const vehicles = data.vehicles || []

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Submit Maintenance Request</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="vehicle">Vehicle</Label>
                        <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                            <SelectTrigger id="vehicle">
                                <SelectValue placeholder="Select vehicle" />
                            </SelectTrigger>
                            <SelectContent>
                                {vehicles.map(v => (
                                    <SelectItem key={v.id} value={v.id}>
                                        {v.number} - {v.make} {v.model}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="issue-type">Issue Type</Label>
                        <Select value={issueType} onValueChange={setIssueType}>
                            <SelectTrigger id="issue-type">
                                <SelectValue placeholder="Select issue type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Engine">Engine</SelectItem>
                                <SelectItem value="Brakes">Brakes</SelectItem>
                                <SelectItem value="Transmission">Transmission</SelectItem>
                                <SelectItem value="Electrical">Electrical</SelectItem>
                                <SelectItem value="Tires">Tires</SelectItem>
                                <SelectItem value="AC/Heating">AC/Heating</SelectItem>
                                <SelectItem value="Suspension">Suspension</SelectItem>
                                <SelectItem value="Body/Paint">Body/Paint</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select value={priority} onValueChange={(v) => setPriority(v as MaintenanceRequest["priority"])}>
                            <SelectTrigger id="priority">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="requested-by">Requested By</Label>
                        <Input
                            id="requested-by"
                            placeholder="Your name"
                            value={requestedBy}
                            onChange={(e) => setRequestedBy(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Describe the issue in detail..."
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit}>
                            Submit Request
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
