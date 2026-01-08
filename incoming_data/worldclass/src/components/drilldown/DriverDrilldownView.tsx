import { ColumnDef } from '@tanstack/react-table';
import { Phone, Mail, Calendar, Award, AlertCircle } from 'lucide-react';
import React from 'react';

import { ExcelDataTable } from '../shared/ExcelDataTable';


export interface Driver {
  id: string;
  driver_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  license_number: string;
  license_state: string;
  license_expiration: string;
  hire_date: string;
  status: 'active' | 'inactive' | 'on-leave' | 'terminated';
  assigned_vehicle?: string;
  certifications?: string[];
  violations_count?: number;
  total_miles_driven?: number;
  last_training_date?: string;
  performance_score?: number;
}

interface DriverDrilldownViewProps {
  drivers: Driver[];
  onDriverClick?: (driver: Driver) => void;
  title?: string;
}

export function DriverDrilldownView({ drivers, onDriverClick, title = 'Drivers' }: DriverDrilldownViewProps) {
  const columns: ColumnDef<Driver>[] = [
    {
      id: 'avatar',
      header: 'Photo',
      cell: ({ row }) => {
        const avatarUrl = row.original.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${row.original.driver_id}`;
        return (
          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center border-2 border-slate-700">
            <img
              src={avatarUrl}
              alt={`${row.original.first_name} ${row.original.last_name}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to initials if image fails
                const initials = `${row.original.first_name[0]}${row.original.last_name[0]}`.toUpperCase();
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-blue-600 text-white text-sm font-bold">${initials}</div>`;
              }}
            />
          </div>
        );
      },
    },
    {
      accessorKey: 'driver_id',
      header: 'Driver ID',
      cell: ({ getValue }) => (
        <span className="font-semibold text-blue-300">{getValue<string>()}</span>
      ),
    },
    {
      accessor: row => `${row.first_name} ${row.last_name}`,
      id: 'full_name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.original.first_name} {row.original.last_name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ getValue }) => (
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-slate-400" />
          <a href={`mailto:${getValue<string>()}`} className="text-blue-400 hover:text-blue-300 hover:underline">
            {getValue<string>()}
          </a>
        </div>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ getValue }) => (
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-slate-400" />
          {getValue<string>()}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const status = getValue<string>();
        const statusColors: Record<string, string> = {
          active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          inactive: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
          'on-leave': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          terminated: 'bg-red-500/20 text-red-400 border-red-500/30',
        };
        return (
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[status] || statusColors.inactive}`}>
            {status?.toUpperCase().replace('-', ' ')}
          </span>
        );
      },
    },
    {
      accessorKey: 'assigned_vehicle',
      header: 'Assigned Vehicle',
      cell: ({ getValue }) => {
        const vehicle = getValue<string>();
        return vehicle || <span className="text-slate-500">Unassigned</span>;
      },
    },
    {
      accessorKey: 'license_number',
      header: 'License #',
      cell: ({ getValue }) => (
        <span className="font-mono text-xs text-slate-400">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'license_state',
      header: 'State',
    },
    {
      accessorKey: 'license_expiration',
      header: 'License Exp.',
      cell: ({ getValue }) => {
        const date = getValue<string>();
        if (!date) return 'N/A';
        const daysUntil = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        const isExpired = daysUntil < 0;
        const isExpiringSoon = daysUntil < 30 && daysUntil >= 0;
        return (
          <div className="flex items-center gap-2">
            {(isExpired || isExpiringSoon) && <AlertCircle className={`w-4 h-4 ${isExpired ? 'text-red-400' : 'text-amber-400'}`} />}
            <span className={isExpired ? 'text-red-400 font-semibold' : isExpiringSoon ? 'text-amber-400' : ''}>
              {new Date(date).toLocaleDateString()}
              {isExpired && ' (EXPIRED)'}
              {isExpiringSoon && ` (${daysUntil}d)`}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'hire_date',
      header: 'Hire Date',
      cell: ({ getValue }) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          {new Date(getValue<string>()).toLocaleDateString()}
        </div>
      ),
    },
    {
      accessorKey: 'certifications',
      header: 'Certifications',
      cell: ({ getValue }) => {
        const certs = getValue<string[]>();
        return certs && certs.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {certs.slice(0, 2).map((cert, idx) => (
              <span key={idx} className="px-2 py-0.5 bg-blue-600/20 text-blue-400 rounded text-xs border border-blue-500/30">
                {cert}
              </span>
            ))}
            {certs.length > 2 && (
              <span className="px-2 py-0.5 bg-slate-600/50 text-slate-400 rounded text-xs">
                +{certs.length - 2}
              </span>
            )}
          </div>
        ) : <span className="text-slate-500">None</span>;
      },
    },
    {
      accessorKey: 'violations_count',
      header: 'Violations',
      cell: ({ getValue }) => {
        const count = getValue<number>() || 0;
        return (
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
            count === 0 ? 'bg-emerald-500/20 text-emerald-400' :
            count < 3 ? 'bg-amber-500/20 text-amber-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {count}
          </span>
        );
      },
    },
    {
      accessorKey: 'total_miles_driven',
      header: 'Total Miles',
      cell: ({ getValue }) => {
        const miles = getValue<number>();
        return miles ? `${miles.toLocaleString()} mi` : 'N/A';
      },
    },
    {
      accessorKey: 'performance_score',
      header: 'Performance',
      cell: ({ getValue }) => {
        const score = getValue<number>();
        if (!score) return 'N/A';
        return (
          <div className="flex items-center gap-2">
            <Award className={`w-4 h-4 ${score >= 90 ? 'text-emerald-400' : score >= 75 ? 'text-amber-400' : 'text-red-400'}`} />
            <span className={`font-semibold ${score >= 90 ? 'text-emerald-400' : score >= 75 ? 'text-amber-400' : 'text-red-400'}`}>
              {score}/100
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'last_training_date',
      header: 'Last Training',
      cell: ({ getValue }) => {
        const date = getValue<string>();
        return date ? new Date(date).toLocaleDateString() : 'N/A';
      },
    },
  ];

  return (
    <ExcelDataTable
      data={drivers}
      columns={columns}
      title={title}
      onRowClick={onDriverClick}
      enableFilters={true}
      enableExport={true}
    />
  );
}
