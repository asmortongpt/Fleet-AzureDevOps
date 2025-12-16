import React from 'react';
import DOMPurify from 'dompurify';

interface Column<T> {
  key: keyof T;
  header: string;
  render?: (value: any, row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick
}: DataTableProps<T>) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={String(col.key)} className="border p-2 text-left">
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr
            key={row.id || `row-${idx}`}
            onClick={() => onRowClick?.(row)}
            className="hover:bg-gray-100 cursor-pointer"
          >
            {columns.map((col) => (
              <td key={String(col.key)} className="border p-2">
                {col.render
                  ? col.render(row[col.key], row)
                  : <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(String(row[col.key])) }} />}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}