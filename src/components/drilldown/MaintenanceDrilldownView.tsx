import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { ExcelDataTable } from '../shared/ExcelDataTable';
import { Wrench, Calendar, DollarSign, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

export interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  unit_number: string;
  service_type: string;
  description: string;
  service_date: string;
  mileage: number;
  cost: number;
  technician: string;
  facility: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'routine' | 'urgent' | 'emergency';
  parts_used?: string[];
  labor_hours?: number;
  next_service_date?: string;
}

interface MaintenanceDrilldownViewProps {
  records: MaintenanceRecord[];
  onRecordClick?: (record: MaintenanceRecord) => void;
  title?: string;
}

export function MaintenanceDrilldownView({ records, onRecordClick, title = 'Maintenance Records' }: MaintenanceDrilldownViewProps) {
  const columns: ColumnDef<MaintenanceRecord>[] = [
    {
      accessorKey: 'unit_number',
      header: 'Unit #',
      cell: ({ getValue }) => (
        <span className="font-semibold text-blue-300">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'service_date',
      header: 'Service Date',
      cell: ({ getValue }) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          {new Date(getValue<string>()).toLocaleDateString()}
        </div>
      ),
    },
    {
      accessorKey: 'service_type',
      header: 'Service Type',
      cell: ({ getValue }) => {
        const type = getValue<string>();
        const typeColors: Record<string, string> = {
          'oil change': 'bg-blue-500/20 text-blue-400',
          'tire rotation': 'bg-purple-500/20 text-purple-400',
          'brake service': 'bg-red-500/20 text-red-400',
          'engine repair': 'bg-orange-500/20 text-orange-400',
          'transmission': 'bg-amber-500/20 text-amber-400',
          'inspection': 'bg-green-500/20 text-green-400',
        };
        return (
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeColors[type?.toLowerCase()] || 'bg-slate-500/20 text-slate-400'}`}>
            {type}
          </span>
        );
      },
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ getValue }) => (
        <div className="max-w-md truncate" title={getValue<string>()}>
          {getValue<string>()}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const status = getValue<string>();
        const statusConfig: Record<string, { icon: React.ReactNode; class: string }> = {
          scheduled: {
            icon: <Clock className="w-4 h-4" />,
            class: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
          },
          'in-progress': {
            icon: <Wrench className="w-4 h-4" />,
            class: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
          },
          completed: {
            icon: <CheckCircle className="w-4 h-4" />,
            class: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
          },
          cancelled: {
            icon: <AlertTriangle className="w-4 h-4" />,
            class: 'bg-red-500/20 text-red-400 border-red-500/30'
          },
        };
        const config = statusConfig[status] || statusConfig.scheduled;
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.class}`}>
            {config.icon}
            {status?.toUpperCase()}
          </span>
        );
      },
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ getValue }) => {
        const priority = getValue<string>();
        const priorityColors: Record<string, string> = {
          routine: 'bg-green-500/20 text-green-400',
          urgent: 'bg-amber-500/20 text-amber-400',
          emergency: 'bg-red-500/20 text-red-400 animate-pulse',
        };
        return (
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${priorityColors[priority] || priorityColors.routine}`}>
            {priority}
          </span>
        );
      },
    },
    {
      accessorKey: 'mileage',
      header: 'Mileage',
      cell: ({ getValue }) => `${getValue<number>()?.toLocaleString()} mi`,
    },
    {
      accessorKey: 'cost',
      header: 'Cost',
      cell: ({ getValue }) => (
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-emerald-400">${getValue<number>()?.toLocaleString()}</span>
        </div>
      ),
    },
    {
      accessorKey: 'labor_hours',
      header: 'Labor Hours',
      cell: ({ getValue }) => {
        const hours = getValue<number>();
        return hours ? `${hours.toFixed(1)}h` : 'N/A';
      },
    },
    {
      accessorKey: 'technician',
      header: 'Technician',
    },
    {
      accessorKey: 'facility',
      header: 'Facility',
    },
    {
      accessorKey: 'parts_used',
      header: 'Parts',
      cell: ({ getValue }) => {
        const parts = getValue<string[]>();
        return parts && parts.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {parts.slice(0, 3).map((part, idx) => (
              <span key={idx} className="px-2 py-0.5 bg-slate-700/50 text-slate-300 rounded text-xs">
                {part}
              </span>
            ))}
            {parts.length > 3 && (
              <span className="px-2 py-0.5 bg-slate-600/50 text-slate-400 rounded text-xs">
                +{parts.length - 3}
              </span>
            )}
          </div>
        ) : 'None';
      },
    },
    {
      accessorKey: 'next_service_date',
      header: 'Next Service',
      cell: ({ getValue }) => {
        const date = getValue<string>();
        if (!date) return 'N/A';
        const daysUntil = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return (
          <span className={daysUntil < 7 ? 'text-amber-400 font-semibold' : ''}>
            {new Date(date).toLocaleDateString()}
            {daysUntil < 7 && daysUntil >= 0 && ` (${daysUntil}d)`}
          </span>
        );
      },
    },
  ];

  return (
    <ExcelDataTable
      data={records}
      columns={columns}
      title={title}
      onRowClick={onRecordClick}
      enableFilters={true}
      enableExport={true}
    />
  );
}
