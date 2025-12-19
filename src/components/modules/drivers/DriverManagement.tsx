import { Plus, Edit, Trash, Phone, Mail } from "@phosphor-icons/react"
import { ColumnDef } from "@tanstack/react-table"
import { useState, useMemo } from "react"

import { DataGrid } from "@/components/common/DataGrid"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Driver {
  id: string
  name: string
  email: string
  phone: string
  licenseNumber: string
  licenseExpiry: string
  status: "active" | "inactive" | "suspended"
  photoUrl?: string
  assignedVehicle?: string
  rating: number
}

export function DriverManagement() {
  const [drivers, setDrivers] = useState<Driver[]>([])

  const columns: ColumnDef<Driver>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: "Driver",
      cell: ({ row }) => {
        const initials = row.original.name.split(" ").map(n => n[0]).join("").toUpperCase()
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={row.original.photoUrl} alt={row.original.name} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{row.original.name}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-sm">
          <Mail className="w-3 h-3" />
          {row.original.email}
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-sm">
          <Phone className="w-3 h-3" />
          {row.original.phone}
        </div>
      ),
    },
    {
      accessorKey: "licenseNumber",
      header: "License #",
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
      accessorKey: "rating",
      header: "Rating",
      cell: ({ row }) => `${row.original.rating}/5`,
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
        <h2 className="text-3xl font-bold">Driver Management</h2>
        <Button><Plus className="w-4 h-4 mr-2" /> Add Driver</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fleet Drivers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataGrid
            data={drivers}
            columns={columns}
            enableSearch={true}
            searchPlaceholder="Search drivers..."
            enablePagination={true}
            pageSize={20}
            emptyMessage="No drivers found"
          />
        </CardContent>
      </Card>
    </div>
  )
}
