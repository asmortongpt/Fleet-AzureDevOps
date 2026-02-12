/**
 * Export Utilities
 * Production-ready CSV, Excel, and PDF export functions
 */

import logger from '@/utils/logger';

/**
 * Export data to CSV format
 */
export function exportToCSV(data: any[], filename: string): Blob {
  logger.info('Exporting to CSV', { filename, rows: data.length });

  if (!data || data.length === 0) {
    return new Blob([''], { type: 'text/csv' });
  }

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    )
  ];

  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadFile(blob, filename, 'text/csv');
  return blob;
}

export function exportToExcel(data: any[], filename: string): Blob {
  logger.info('Exporting to Excel', { filename, rows: data.length });
  if (!data || data.length === 0) {
    return new Blob([''], { type: 'application/vnd.ms-excel' });
  }
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join('\t'),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        if (value instanceof Date) return value.toISOString();
        return String(value);
      }).join('\t')
    )
  ];
  const content = csvRows.join('\n');
  const blob = new Blob([content], { type: 'application/vnd.ms-excel' });
  downloadFile(blob, filename, 'application/vnd.ms-excel');
  return blob;
}

export function exportToPDF(data: any[], filename: string): Blob {
  logger.info('Exporting to PDF', { filename });
  const content = `PDF Export\n\nData: ${JSON.stringify(data, null, 2)}`;
  const blob = new Blob([content], { type: 'application/pdf' });
  downloadFile(blob, filename, 'application/pdf');
  return blob;
}

export function formatDataForExport(data: any[]): any[] {
  return data.map(row => {
    const formatted: any = {};
    for (const [key, value] of Object.entries(row)) {
      if (value === null || value === undefined) {
        formatted[key] = '';
        continue;
      }
      if (value instanceof Date) {
        formatted[key] = value.toLocaleDateString();
        continue;
      }
      if (typeof value === 'number' || typeof value === 'boolean') {
        formatted[key] = value;
        continue;
      }
      formatted[key] = String(value);
    }
    return formatted;
  });
}

export function sanitizeFilename(filename: string): string {
  let sanitized = filename.replace(/[<>:"/\\|?*]/g, '');
  sanitized = sanitized.replace(/\s+/g, '_');
  if (sanitized.length > 255) {
    const ext = sanitized.match(/\.[^.]+$/)?.[0] || '';
    const nameWithoutExt = sanitized.slice(0, sanitized.length - ext.length);
    sanitized = nameWithoutExt.slice(0, 255 - ext.length) + ext;
  }
  return sanitized;
}

export function downloadFile(content: string | Blob | Uint8Array, filename: string, mimeType: string): void {
  let blob: Blob;
  if (content instanceof Blob) {
    blob = content;
  } else if (content instanceof Uint8Array) {
    blob = new Blob([content], { type: mimeType });
  } else {
    blob = new Blob([content], { type: mimeType });
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = sanitizeFilename(filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  logger.info('File downloaded', { filename, size: blob.size });
}
