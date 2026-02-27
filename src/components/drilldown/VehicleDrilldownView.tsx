import { ColumnDef } from '@tanstack/react-table';
import { Truck, Calendar, Gauge, DollarSign, Wrench } from 'lucide-react';
import React from 'react';

import { ExcelDataTable } from '../shared/ExcelDataTable';

import { Vehicle } from '@/types';
import { formatCurrency, formatDate, formatNumber } from '@/utils/format-helpers';



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
          <div className="w-16 h-9 rounded-lg overflow-hidden bg-[#1a1a1a] flex items-center justify-center">
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
              <Truck className="w-4 h-4 text-[var(--text-tertiary)]" />
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
          <Truck className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-emerald-300">{row.original.number}</span>
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
          <Calendar className="w-4 h-4 text-[var(--text-tertiary)]" />
          {getValue<number>()}
        </div>
      ),
    },
    {
      accessorKey: 'vin',
      header: 'VIN',
      cell: ({ getValue }) => (
        <span className="font-mono text-xs text-[var(--text-tertiary)]">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const status = getValue<string>();
        const statusColors: Record<string, string> = {
          active: 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30',
          inactive: 'bg-[var(--surface-glass-hover)] text-[var(--text-tertiary)] border-white/[0.12]/30',
          maintenance: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          retired: 'bg-red-500/20 text-red-400 border-red-500/30',
          assigned: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          dispatched: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
          en_route: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
          on_site: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
          completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
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
          <Gauge className="w-4 h-4 text-[var(--text-tertiary)]" />
          {formatNumber(getValue<number>())} mi
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
          gasoline: 'bg-emerald-500/20 text-emerald-400',
          electric: 'bg-green-500/20 text-green-400',
          hybrid: 'bg-amber-500/20 text-amber-400',
        };
        return (
          <span className={`px-2 py-0.5 rounded text-xs ${fuelColors[fuel?.toLowerCase()] || 'bg-[var(--surface-glass-hover)] text-[var(--text-tertiary)]'}`}>
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
        return formatDate(date);
      },
    },
    {
      accessorKey: 'nextService',
      header: 'Next Service',
      cell: ({ getValue }) => {
        const date = getValue<string>();
        if (!date) return '—';
        const daysUntil = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        const isOverdue = daysUntil < 0;
        const isDueSoon = daysUntil < 7 && daysUntil >= 0;
        return (
          <div className="flex items-center gap-2">
            <Wrench className={`w-4 h-4 ${isOverdue ? 'text-red-400' : isDueSoon ? 'text-amber-400' : 'text-[var(--text-tertiary)]'}`} />
            <span className={isOverdue ? 'text-red-400 font-semibold' : isDueSoon ? 'text-amber-400' : ''}>
              {formatDate(date)}
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
          {formatCurrency(getValue<number>())}
        </div>
      ),
    },
    {
      accessorKey: 'currentValue',
      header: 'Current Value',
      cell: ({ getValue }) => (
        <span className="font-semibold text-emerald-700">
          {formatCurrency(getValue<number>())}
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
