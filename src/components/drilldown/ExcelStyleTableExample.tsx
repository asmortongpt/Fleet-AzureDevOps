/**
 * ExcelStyleTable - Example Usage
 *
 * This file demonstrates how to use the ExcelStyleTable component
 * with various configurations and column types.
 */

import { useState } from 'react'

import { ExcelStyleTable, ColumnDef } from './ExcelStyleTable'

import { useDrilldown } from '@/contexts/DrilldownContext'

// ============================================================================
// EXAMPLE 1: Vehicle Fleet Table
// ============================================================================

interface Vehicle {
  id: string
  number: string
  make: string
  model: string
  year: number
  vin: string
  status: 'active' | 'idle' | 'service' | 'offline'
  mileage: number
  fuelLevel: number
  lastService: string
  nextService: string
  driverId?: string
  driverName?: string
  location: string
  averageSpeed: number
}

export function VehicleFleetTableExample() {
  const { push } = useDrilldown()
  const [selectedVehicles, setSelectedVehicles] = useState<Vehicle[]>([])

  // Sample data
  const vehicles: Vehicle[] = [
    {
      id: 'V-001',
      number: 'FL-2501',
      make: 'Ford',
      model: 'F-150',
      year: 2022,
      vin: '1FTFW1E85MFC12345',
      status: 'active',
      mileage: 45230,
      fuelLevel: 78,
      lastService: '2025-12-15',
      nextService: '2026-03-15',
      driverId: 'D-101',
      driverName: 'John Smith',
      location: 'Downtown Depot',
      averageSpeed: 45,
    },
    {
      id: 'V-002',
      number: 'FL-2502',
      make: 'Chevrolet',
      model: 'Silverado',
      year: 2021,
      vin: '1GC1KVEG5MF123456',
      status: 'service',
      mileage: 62100,
      fuelLevel: 25,
      lastService: '2025-11-20',
      nextService: '2026-02-20',
      location: 'Service Center',
      averageSpeed: 42,
    },
    // Add more vehicles as needed
  ]

  // Column definitions
  const vehicleColumns: ColumnDef<Vehicle>[] = [
    {
      id: 'number',
      header: 'Vehicle #',
      accessor: 'number',
      type: 'string',
      width: 120,
      sortable: true,
      filterable: true,
    },
    {
      id: 'vehicle',
      header: 'Make/Model',
      accessor: (row) => `${row.year} ${row.make} ${row.model}`,
      type: 'string',
      width: 200,
      sortable: true,
      filterable: true,
    },
    {
      id: 'vin',
      header: 'VIN',
      accessor: 'vin',
      type: 'string',
      width: 180,
      sortable: true,
      filterable: true,
    },
    {
      id: 'status',
      header: 'Status',
      accessor: 'status',
      type: 'select',
      filterOptions: ['active', 'idle', 'service', 'offline'],
      width: 120,
      sortable: true,
      filterable: true,
      render: (value) => {
        const statusColors = {
          active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
          idle: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
          service: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
          offline: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
        }
        return (
          <span className={`px-2 py-1 text-xs rounded-full ${statusColors[value as keyof typeof statusColors]}`}>
            {value}
          </span>
        )
      },
    },
    {
      id: 'mileage',
      header: 'Mileage',
      accessor: 'mileage',
      type: 'number',
      width: 120,
      sortable: true,
      filterable: true,
      format: (value) => `${value.toLocaleString()} mi`,
    },
    {
      id: 'fuelLevel',
      header: 'Fuel',
      accessor: 'fuelLevel',
      type: 'number',
      width: 100,
      sortable: true,
      filterable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${value > 50 ? 'bg-green-500' : value > 25 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${value}%` }}
            />
          </div>
          <span className="text-xs">{value}%</span>
        </div>
      ),
    },
    {
      id: 'lastService',
      header: 'Last Service',
      accessor: 'lastService',
      type: 'date',
      width: 140,
      sortable: true,
      filterable: true,
    },
    {
      id: 'nextService',
      header: 'Next Service',
      accessor: 'nextService',
      type: 'date',
      width: 140,
      sortable: true,
      filterable: true,
    },
    {
      id: 'driver',
      header: 'Driver',
      accessor: 'driverName',
      type: 'string',
      width: 150,
      sortable: true,
      filterable: true,
      render: (value) => value || '-',
    },
    {
      id: 'location',
      header: 'Location',
      accessor: 'location',
      type: 'string',
      width: 180,
      sortable: true,
      filterable: true,
    },
    {
      id: 'averageSpeed',
      header: 'Avg Speed',
      accessor: 'averageSpeed',
      type: 'number',
      width: 120,
      sortable: true,
      filterable: true,
      format: (value) => `${value} mph`,
    },
  ]

  const handleRowClick = (vehicle: Vehicle) => {
    push({
      id: `vehicle-${vehicle.id}`,
      type: 'vehicle',
      label: `${vehicle.number} - ${vehicle.make} ${vehicle.model}`,
      data: {
        vehicleId: vehicle.id,
        ...vehicle,
      },
    })
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Fleet Vehicles</h2>
        <p className="text-muted-foreground">
          Click on any row to view detailed vehicle information
        </p>
      </div>

      <ExcelStyleTable
        data={vehicles}
        columns={vehicleColumns}
        onRowClick={handleRowClick}
        enableSort
        enableFilter
        enableSearch
        enableExport
        enableSelection
        enablePagination
        pageSize={25}
        striped
        onSelectionChange={setSelectedVehicles}
      />

      {selectedVehicles.length > 0 && (
        <div className="p-4 bg-primary/10 rounded-md">
          <p className="text-sm font-medium">
            Selected {selectedVehicles.length} vehicle(s):{' '}
            {selectedVehicles.map(v => v.number).join(', ')}
          </p>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// EXAMPLE 2: Work Orders Table
// ============================================================================

interface WorkOrder {
  id: string
  number: string
  title: string
  description: string
  status: 'open' | 'in-progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  vehicleId: string
  vehicleNumber: string
  assignedTo: string
  createdDate: string
  dueDate: string
  completedDate?: string
  estimatedHours: number
  actualHours?: number
  cost: number
  category: string
}

export function WorkOrderTableExample() {
  const { push } = useDrilldown()

  const workOrders: WorkOrder[] = [
    {
      id: 'WO-001',
      number: 'WO-2026-001',
      title: 'Oil Change',
      description: 'Scheduled oil change and filter replacement',
      status: 'completed',
      priority: 'medium',
      vehicleId: 'V-001',
      vehicleNumber: 'FL-2501',
      assignedTo: 'Mike Johnson',
      createdDate: '2026-01-01',
      dueDate: '2026-01-05',
      completedDate: '2026-01-03',
      estimatedHours: 1.5,
      actualHours: 1.25,
      cost: 125.50,
      category: 'Preventive Maintenance',
    },
    {
      id: 'WO-002',
      number: 'WO-2026-002',
      title: 'Brake Inspection',
      description: 'Annual brake system inspection and pad replacement if needed',
      status: 'in-progress',
      priority: 'high',
      vehicleId: 'V-002',
      vehicleNumber: 'FL-2502',
      assignedTo: 'Sarah Williams',
      createdDate: '2026-01-02',
      dueDate: '2026-01-04',
      estimatedHours: 3,
      cost: 450.00,
      category: 'Safety',
    },
  ]

  const workOrderColumns: ColumnDef<WorkOrder>[] = [
    {
      id: 'number',
      header: 'WO #',
      accessor: 'number',
      type: 'string',
      width: 140,
      sortable: true,
      filterable: true,
    },
    {
      id: 'title',
      header: 'Title',
      accessor: 'title',
      type: 'string',
      width: 200,
      sortable: true,
      filterable: true,
    },
    {
      id: 'status',
      header: 'Status',
      accessor: 'status',
      type: 'select',
      filterOptions: ['open', 'in-progress', 'completed', 'cancelled'],
      width: 140,
      sortable: true,
      filterable: true,
      render: (value) => {
        const statusColors = {
          open: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
          'in-progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
          completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
          cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
        }
        return (
          <span className={`px-2 py-1 text-xs rounded-full ${statusColors[value as keyof typeof statusColors]}`}>
            {value}
          </span>
        )
      },
    },
    {
      id: 'priority',
      header: 'Priority',
      accessor: 'priority',
      type: 'select',
      filterOptions: ['low', 'medium', 'high', 'critical'],
      width: 120,
      sortable: true,
      filterable: true,
      render: (value) => {
        const priorityColors = {
          low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
          medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
          high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
          critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        }
        return (
          <span className={`px-2 py-1 text-xs rounded-full ${priorityColors[value as keyof typeof priorityColors]}`}>
            {value}
          </span>
        )
      },
    },
    {
      id: 'vehicle',
      header: 'Vehicle',
      accessor: 'vehicleNumber',
      type: 'string',
      width: 120,
      sortable: true,
      filterable: true,
    },
    {
      id: 'assignedTo',
      header: 'Assigned To',
      accessor: 'assignedTo',
      type: 'string',
      width: 150,
      sortable: true,
      filterable: true,
    },
    {
      id: 'createdDate',
      header: 'Created',
      accessor: 'createdDate',
      type: 'date',
      width: 120,
      sortable: true,
      filterable: true,
    },
    {
      id: 'dueDate',
      header: 'Due Date',
      accessor: 'dueDate',
      type: 'date',
      width: 120,
      sortable: true,
      filterable: true,
    },
    {
      id: 'estimatedHours',
      header: 'Est. Hours',
      accessor: 'estimatedHours',
      type: 'number',
      width: 120,
      sortable: true,
      filterable: true,
      format: (value) => `${value} hrs`,
    },
    {
      id: 'cost',
      header: 'Cost',
      accessor: 'cost',
      type: 'number',
      width: 120,
      sortable: true,
      filterable: true,
      format: (value) => `$${value.toFixed(2)}`,
    },
    {
      id: 'category',
      header: 'Category',
      accessor: 'category',
      type: 'string',
      width: 180,
      sortable: true,
      filterable: true,
    },
  ]

  const handleRowClick = (workOrder: WorkOrder) => {
    push({
      id: `work-order-${workOrder.id}`,
      type: 'workOrder',
      label: `${workOrder.number} - ${workOrder.title}`,
      data: {
        workOrderId: workOrder.id,
        ...workOrder,
      },
    })
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Work Orders</h2>
        <p className="text-muted-foreground">
          Manage and track all vehicle maintenance work orders
        </p>
      </div>

      <ExcelStyleTable
        data={workOrders}
        columns={workOrderColumns}
        onRowClick={handleRowClick}
        enableSort
        enableFilter
        enableSearch
        enableExport
        enablePagination
        pageSize={10}
        compact
      />
    </div>
  )
}

// ============================================================================
// EXAMPLE 3: Virtualized Large Dataset
// ============================================================================

export function VirtualizedTableExample() {
  // Generate large dataset
  const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
    id: `item-${i}`,
    name: `Item ${i}`,
    value: Math.random() * 1000,
    date: new Date(2025, 0, 1 + (i % 365)).toISOString(),
    status: ['active', 'inactive', 'pending'][i % 3],
  }))

  const columns: ColumnDef<typeof largeDataset[0]>[] = [
    {
      id: 'id',
      header: 'ID',
      accessor: 'id',
      width: 120,
      sortable: true,
    },
    {
      id: 'name',
      header: 'Name',
      accessor: 'name',
      width: 200,
      sortable: true,
      filterable: true,
    },
    {
      id: 'value',
      header: 'Value',
      accessor: 'value',
      type: 'number',
      width: 150,
      sortable: true,
      filterable: true,
      format: (value) => `$${value.toFixed(2)}`,
    },
    {
      id: 'date',
      header: 'Date',
      accessor: 'date',
      type: 'date',
      width: 150,
      sortable: true,
      filterable: true,
    },
    {
      id: 'status',
      header: 'Status',
      accessor: 'status',
      type: 'select',
      filterOptions: ['active', 'inactive', 'pending'],
      width: 120,
      sortable: true,
      filterable: true,
    },
  ]

  return (
    <div className="p-6 space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Virtualized Table (10,000 rows)</h2>
        <p className="text-muted-foreground">
          Demonstrating performance with large datasets
        </p>
      </div>

      <ExcelStyleTable
        data={largeDataset}
        columns={columns}
        enableSort
        enableFilter
        enableSearch
        enableExport
        virtualized
        maxHeight="600px"
        compact
      />
    </div>
  )
}
