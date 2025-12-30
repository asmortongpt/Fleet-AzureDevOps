import { useVirtualizer } from '@tanstack/react-virtual';
import { ReactNode, useRef, useCallback } from 'react';

interface VirtualTableProps<T> {
  data: T[];
  columns: Array<{ key: string; label: string; width: number }>;
}

function VirtualTable<T>({ data, columns }: VirtualTableProps<T>): JSX.Element {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 10,
  });

  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: columns.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index: number) => columns[index]?.width ?? 100,
    overscan: 5,
  });

  const renderRow = useCallback(
    (virtualRow: { index: number; start: number; size: number }) => {
      const rowData = data[virtualRow.index];
      if (!rowData) return null;

      return (
        <div
          key={virtualRow.index}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: `${virtualRow.size}px`,
            transform: `translateY(${virtualRow.start}px)`,
            display: 'flex',
          }}
        >
          {columnVirtualizer.getVirtualItems().map((virtualColumn: { index: number; start: number; size: number }) => (
            <div
              key={virtualColumn.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: `${virtualColumn.size}px`,
                transform: `translateX(${virtualColumn.start}px)`,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
              }}
            >
              {rowData[columns[virtualColumn.index]?.key as keyof T] as ReactNode}
            </div>
          ))}
        </div>
      );
    },
    [data, columns, columnVirtualizer]
  );

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto relative">
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: `${columnVirtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'sticky',
            top: 0,
            display: 'flex',
            backgroundColor: 'white',
            zIndex: 1,
          }}
        >
          {columns.map((column, index) => (
            <div
              key={index}
              style={{
                width: `${column.width}px`,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
              }}
            >
              {column.label}
            </div>
          ))}
        </div>
        {rowVirtualizer.getVirtualItems().map(renderRow)}
      </div>
    </div>
  );
}

export default VirtualTable;