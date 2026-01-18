import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Car, Wrench, Calendar, AlertTriangle } from "lucide-react"

export function VirtualGarage() {
  const vehicles = [
    { id: 1, name: "Truck 001", make: "Ford", model: "F-150", status: "active", lastService: "2024-01-10" },
    { id: 2, name: "Truck 002", make: "Chevrolet", model: "Silverado", status: "active", lastService: "2024-01-05" },
    { id: 3, name: "Truck 003", make: "Toyota", model: "Tundra", status: "maintenance", lastService: "2024-01-15" },
    { id: 4, name: "Van 001", make: "Ford", model: "Transit", status: "active", lastService: "2023-12-20" },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Virtual Garage</h1>
          <p className="text-muted-foreground">Manage and monitor your fleet vehicles</p>
        </div>
        <Button>
          <Car className="h-4 w-4 mr-2" />
          Add Vehicle
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicles.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Car className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicles.filter(v => v.status === "active").length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicles.filter(v => v.status === "maintenance").length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Service Due</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vehicle Inventory</CardTitle>
          <CardDescription>All vehicles in your garage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {vehicles.map((vehicle) => (
              <div key={vehicle.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Car className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{vehicle.name}</p>
                    <p className="text-sm text-muted-foreground">{vehicle.make} {vehicle.model}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm">Last Service</p>
                    <p className="text-sm text-muted-foreground">{vehicle.lastService}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    vehicle.status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {vehicle.status}
                  </span>
                  <Button variant="outline" size="sm">
                    <Wrench className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
