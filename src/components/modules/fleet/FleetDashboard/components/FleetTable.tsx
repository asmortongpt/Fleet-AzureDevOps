import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Vehicle } from "@/lib/types"

interface FleetTableProps {
  vehicles: Vehicle[]
  onVehicleClick: (vehicle: Vehicle) => void
}

export function FleetTable({ vehicles, onVehicleClick }: FleetTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium">Vehicle</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Fuel</th>
                <th className="text-left p-4 font-medium">Mileage</th>
                <th className="text-left p-4 font-medium">Location</th>
                <th className="text-left p-4 font-medium">Driver</th>
                <th className="text-left p-4 font-medium">Alerts</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => (
                <tr
                  key={vehicle.id}
                  className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => onVehicleClick(vehicle)}
                >
                  <td className="p-4">
                    <div>
                      <p className="font-medium">{vehicle.number}</p>
                      <p className="text-sm text-muted-foreground">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </p>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge
                      variant="outline"
                      className={
                        vehicle.status === "active"
                          ? "bg-success/10 text-success border-success/20"
                          : vehicle.status === "service"
                            ? "bg-warning/10 text-warning border-warning/20"
                            : "bg-muted text-muted-foreground"
                      }
                    >
                      {vehicle.status}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            vehicle.fuelLevel > 50
                              ? "bg-success"
                              : vehicle.fuelLevel > 25
                                ? "bg-warning"
                                : "bg-destructive"
                          }`}
                          style={{ width: `${vehicle.fuelLevel}%` }}
                        />
                      </div>
                      <span className="text-sm">{vehicle.fuelLevel}%</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-medium">{vehicle.mileage.toLocaleString()} mi</span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm">{vehicle.region}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm">{vehicle.assignedDriver || "Unassigned"}</span>
                  </td>
                  <td className="p-4">
                    {vehicle.alerts && vehicle.alerts.length > 0 ? (
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                        {vehicle.alerts.length}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">None</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
