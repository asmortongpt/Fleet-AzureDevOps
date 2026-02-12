// Analytics Hub - Excel-Style DataWorkbench
// Features: Editable cells, sorting, filtering, export to Excel
// Library: AG Grid (Excel-like experience)

import type { ValueFormatterParams, CellValueChangedEvent, ColDef, CellClassParams } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { Download, Filter } from 'lucide-react';
import React, { useState, useCallback, useMemo } from 'react';
import useSWR from 'swr';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import logger from '@/utils/logger';
import { secureFetch } from '@/hooks/use-api';

interface RowData {
  id: string;
  vehicleNumber: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  status: string;
  fuelType: string;
}

export const DataWorkbench: React.FC = () => {
  const { data: rawVehicles = [] } = useSWR<any[]>(
    '/api/vehicles?limit=200',
    (url: string) =>
      fetch(url, { credentials: 'include' })
        .then(res => res.json())
        .then((data) => data?.data?.data ?? data?.data ?? data),
    { shouldRetryOnError: false }
  );

  const rowData = useMemo<RowData[]>(() => {
    return (rawVehicles || []).map((vehicle: any) => ({
      id: vehicle.id,
      vehicleNumber: vehicle.vehicleNumber || vehicle.vehicle_number || vehicle.name || '',
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: Number(vehicle.year || 0),
      mileage: Number(vehicle.mileage || vehicle.odometer_reading || 0),
      status: String(vehicle.status || ''),
      fuelType: String(vehicle.fuelType || vehicle.fuel_type || '')
    }));
  }, [rawVehicles]);

  const [columnDefs] = useState<ColDef<RowData>[]>([
    {
      field: 'vehicleNumber',
      headerName: 'Vehicle #',
      editable: true,
      filter: true,
      sortable: true,
      flex: 1
    },
    {
      field: 'make',
      headerName: 'Make',
      editable: true,
      filter: true,
      sortable: true,
      flex: 1
    },
    {
      field: 'model',
      headerName: 'Model',
      editable: true,
      filter: true,
      sortable: true,
      flex: 1
    },
    {
      field: 'year',
      headerName: 'Year',
      editable: true,
      filter: 'agNumberColumnFilter',
      sortable: true
    },
    {
      field: 'mileage',
      headerName: 'Mileage',
      editable: true,
      filter: 'agNumberColumnFilter',
      sortable: true,
      valueFormatter: (params: ValueFormatterParams<RowData>) => (params.value ?? 0).toLocaleString()
    },
    {
      field: 'status',
      headerName: 'Status',
      editable: true,
      filter: true,
      sortable: true,
      cellStyle: (params: CellClassParams<RowData>) => ({
        color: String(params.value || '').toLowerCase() === 'active' ? '#10b981' : '#eab308',
        fontWeight: '500'
      })
    },
    {
      field: 'fuelType',
      headerName: 'Fuel Type',
      editable: true,
      filter: true,
      sortable: true
    }
  ]);

  const defaultColDef = {
    resizable: true,
    minWidth: 100,
  };

  const onCellValueChanged = useCallback(async (params: CellValueChangedEvent<RowData>) => {
    const payload: Record<string, any> = {};
    if (params.colDef.field === 'vehicleNumber') payload.vehicleNumber = params.data.vehicleNumber;
    if (params.colDef.field === 'make') payload.make = params.data.make;
    if (params.colDef.field === 'model') payload.model = params.data.model;
    if (params.colDef.field === 'year') payload.year = Number(params.data.year || 0);
    if (params.colDef.field === 'mileage') payload.mileage = Number(params.data.mileage || 0);
    if (params.colDef.field === 'status') payload.status = params.data.status;
    if (params.colDef.field === 'fuelType') payload.fuelType = params.data.fuelType;

    if (!params.data.id || Object.keys(payload).length === 0) return;

    try {
      const response = await secureFetch(`/api/vehicles/${params.data.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.error || 'Failed to update vehicle');
      }
    } catch (error) {
      logger.error('Failed to update vehicle from workbench', error);
    }
  }, []);

  const exportToExcel = () => {
    // Export grid data to Excel
    const csv = [
      columnDefs.map(col => col.headerName).join(','),
      ...rowData.map(row =>
        columnDefs.map(col => col.field ? row[col.field as keyof RowData] : '').join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fleet-data-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Data Workbench</h2>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-2 py-2 bg-muted hover:bg-muted/80 rounded-lg">
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-2 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
          >
            <Download className="w-4 h-4" />
            Export to Excel
          </button>
        </div>
      </div>

      {/* Excel Grid */}
      <div className="ag-theme-alpine border border-border rounded-lg" style={{ height: 600 }}>
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onCellValueChanged={onCellValueChanged}
          rowSelection="multiple"
          enableRangeSelection={true}
          enableFillHandle={true}
          undoRedoCellEditing={true}
          animateRows={true}
        />
      </div>
    </div>
  );
};
