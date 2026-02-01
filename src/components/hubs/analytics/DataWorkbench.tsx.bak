// Analytics Hub - Excel-Style DataWorkbench
// Features: Editable cells, sorting, filtering, export to Excel
// Library: AG Grid (Excel-like experience)

import type { ValueFormatterParams, CellValueChangedEvent, ColDef, CellClassParams } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { Download, Filter } from 'lucide-react';
import React, { useState, useCallback } from 'react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import logger from '@/utils/logger';

interface RowData {
  vehicle: string;
  vin: string;
  mileage: number;
  status: string;
  fuel: number;
}

export const DataWorkbench: React.FC = () => {
  const [rowData] = useState([
    { vehicle: 'Toyota Camry', vin: 'VIN001', mileage: 45000, status: 'Active', fuel: 32.5 },
    { vehicle: 'Honda Accord', vin: 'VIN002', mileage: 52000, status: 'Maintenance', fuel: 28.3 },
    { vehicle: 'Ford F-150', vin: 'VIN003', mileage: 38000, status: 'Active', fuel: 18.7 },
    // ... add more sample data
  ]);

  const [columnDefs] = useState<ColDef<RowData>[]>([
    {
      field: 'vehicle',
      headerName: 'Vehicle',
      editable: true,
      filter: true,
      sortable: true,
      flex: 1
    },
    {
      field: 'vin',
      headerName: 'VIN',
      editable: true,
      filter: true,
      sortable: true,
      cellStyle: { fontFamily: 'monospace' }
    },
    {
      field: 'mileage',
      headerName: 'Mileage',
      editable: true,
      filter: 'agNumberColumnFilter',
      sortable: true,
      valueFormatter: (params: ValueFormatterParams<RowData>) => params.value?.toLocaleString()
    },
    {
      field: 'status',
      headerName: 'Status',
      editable: true,
      filter: true,
      sortable: true,
      cellStyle: (params: CellClassParams<RowData>) => ({
        color: params.value === 'Active' ? '#10b981' : '#eab308',
        fontWeight: '500'
      })
    },
    {
      field: 'fuel',
      headerName: 'Fuel (MPG)',
      editable: true,
      filter: 'agNumberColumnFilter',
      sortable: true,
      valueFormatter: (params: ValueFormatterParams<RowData>) => params.value?.toFixed(1)
    }
  ]);

  const defaultColDef = {
    resizable: true,
    minWidth: 100,
  };

  const onCellValueChanged = useCallback((params: CellValueChangedEvent<RowData>) => {
    logger.info('Cell changed:', params.data);
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
