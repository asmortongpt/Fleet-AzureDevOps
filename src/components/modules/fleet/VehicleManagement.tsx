import { Car, Plus, Edit, Trash, MapPin } from "@phosphor-icons/react"
import { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"

import { DataGrid } from "@/components/common/DataGrid"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useVehicles, Vehicle } from "@/hooks/useVehicles"

export function VehicleManagement() {
  const { data, isLoading } = useVehicles()

  const columns: ColumnDef<Vehicle>[] = useMemo(() => [
    {
      accessorKey: "vehicleNumber",
      header: "Vehicle #",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Car className="w-4 h-4" />
          <span className="font-medium">{row.original.vehicleNumber}</span>
        </div>
      ),
    },
    {
      accessorKey: "make",
      header: "Make/Model",
      cell: ({ row }) => (
        <div>{row.original.make} {row.original.model} ({row.original.year})</div>
      ),
    },
    {
      accessorKey: "vin",
      header: "VIN",
    },
    {
      accessorKey: "licensePlate",
      header: "License Plate",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.status === "active" ? "default" : "secondary"}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "mileage",
      header: "Mileage",
      cell: ({ row }) => row.original.mileage.toLocaleString() + " mi",
    },
    {
      accessorKey: "location",
      header: "Location",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {row.original.location}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: () => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm"><Trash className="w-4 h-4" /></Button>
        </div>
      ),
    },
  ], [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Vehicle Management</h2>
        <Button><Plus className="w-4 h-4 mr-2" /> Add Vehicle</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fleet Vehicles</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataGrid
            data={data?.data || []}
            columns={columns}
            enableSearch={true}
            searchPlaceholder="Search vehicles..."
            enablePagination={true}
            pageSize={20}
            emptyMessage={isLoading ? "Loading vehicles..." : "No vehicles found"}
          />
        </CardContent>
      </Card>
    </div>
  )
}
