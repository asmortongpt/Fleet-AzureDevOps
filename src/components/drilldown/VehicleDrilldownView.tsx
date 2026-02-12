import { ColumnDef } from '@tanstack/react-table';
import { Truck, Calendar, Gauge, DollarSign, Wrench } from 'lucide-react';
import React from 'react';

import { ExcelDataTable } from '../shared/ExcelDataTable';

import { Vehicle } from '@/types';


interface VehicleDrilldownViewProps {
  vehicles: Vehicle[];
  onVehicleClick?: (vehicle: Vehicle) => void;
  title?: string;
}

export function VehicleDrilldownView({ vehicles, onVehicleClick, title = 'Active Vehicles' }: VehicleDrilldownViewProps) {
  const columns: ColumnDef<Vehicle>[] = [
    {
      id: 'image',
      header: 'Photo',
      cell: ({ row }) => {
        const imageUrl = row.original.metadata?.image_url;
        return (
          <div className="w-16 h-9 rounded-lg overflow-hidden bg-slate-800 flex items-center justify-center">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={row.original.number}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <Truck className="w-4 h-4 text-slate-600" />
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'number',
      header: 'Unit #',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-blue-700" />
          <span className="font-semibold text-blue-300">{row.original.number}</span>
        </div>
      ),
    },
    {
      accessorKey: 'make',
      header: 'Make',
    },
    {
      accessorKey: 'model',
      header: 'Model',
    },
    {
      accessorKey: 'year',
      header: 'Year',
      cell: ({ getValue }) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-700" />
          {getValue<number>()}
        </div>
      ),
    },
    {
      accessorKey: 'vin',
      header: 'VIN',
      cell: ({ getValue }) => (
        <span className="font-mono text-xs text-slate-700">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const status = getValue<string>();
        const statusColors: Record<string, string> = {
          active: 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30',
          inactive: 'bg-slate-500/20 text-slate-700 border-slate-500/30',
          maintenance: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          retired: 'bg-red-500/20 text-red-400 border-red-500/30',
        };
        return (
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[status] || statusColors.inactive}`}>
            {status?.toUpperCase()}
          </span>
        );
      },
    },
    {
      accessorKey: 'mileage',
      header: 'Mileage',
      cell: ({ getValue }) => (
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-slate-700" />
          {getValue<number>()?.toLocaleString()} mi
        </div>
      ),
    },
    {
      accessorKey: 'assignedDriver',
      header: 'Driver',
    },
    {
      accessorKey: 'home_facility',
      header: 'Facility',
    },
    {
      accessorKey: 'fuelType',
      header: 'Fuel Type',
      cell: ({ getValue }) => {
        const fuel = getValue<string>();
        const fuelColors: Record<string, string> = {
          diesel: 'bg-orange-500/20 text-orange-400',
          gasoline: 'bg-blue-500/20 text-blue-700',
          electric: 'bg-green-500/20 text-green-400',
          hybrid: 'bg-purple-500/20 text-purple-400',
        };
        return (
          <span className={`px-2 py-0.5 rounded text-xs ${fuelColors[fuel?.toLowerCase()] || 'bg-slate-500/20 text-slate-700'}`}>
            {fuel}
          </span>
        );
      },
    },
    {
      accessorKey: 'lastService',
      header: 'Last Service',
      cell: ({ getValue }) => {
        const date = getValue<string>();
        return date ? new Date(date).toLocaleDateString() : 'N/A';
      },
    },
    {
      accessorKey: 'nextService',
      header: 'Next Service',
      cell: ({ getValue }) => {
        const date = getValue<string>();
        if (!date) return 'N/A';
        const daysUntil = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        const isOverdue = daysUntil < 0;
        const isDueSoon = daysUntil < 7 && daysUntil >= 0;
        return (
          <div className="flex items-center gap-2">
            <Wrench className={`w-4 h-4 ${isOverdue ? 'text-red-400' : isDueSoon ? 'text-amber-400' : 'text-slate-700'}`} />
            <span className={isOverdue ? 'text-red-400 font-semibold' : isDueSoon ? 'text-amber-400' : ''}>
              {new Date(date).toLocaleDateString()}
              {isOverdue && ' (OVERDUE)'}
              {isDueSoon && ` (${daysUntil}d)`}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'purchasePrice',
      header: 'Acq. Cost',
      cell: ({ getValue }) => (
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-700" />
          ${getValue<number>()?.toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: 'currentValue',
      header: 'Current Value',
      cell: ({ getValue }) => (
        <span className="font-semibold text-emerald-700">
          ${getValue<number>()?.toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <ExcelDataTable
      data={vehicles}
      columns={columns}
      title={title}
      onRowClick={onVehicleClick}
      enableFilters={true}
      enableExport={true}
    />
  );
}
