/**
 * Excel Generation Utility for Drill-Through Exports
 * Uses ExcelJS to create properly formatted XLSX workbooks with styled headers and data rows.
 */

import ExcelJS from 'exceljs';

export async function generateExcel(data: any[]): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CTAFleet Export';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Export Data', {
    properties: { defaultColWidth: 18 },
  });

  if (!data || data.length === 0) {
    worksheet.addRow(['No data available for export.']);
    return workbook;
  }

  const headers = Object.keys(data[0]);

  // Configure columns with headers
  worksheet.columns = headers.map((header) => {
    // Determine column width based on header name and a sample of data values
    const headerLabel = header.toUpperCase().replace(/_/g, ' ');
    let maxWidth = headerLabel.length;

    // Sample up to 20 rows to estimate column width
    const sampleSize = Math.min(data.length, 20);
    for (let i = 0; i < sampleSize; i++) {
      const val = data[i][header];
      const strLen = val === null || val === undefined ? 0 : String(val).length;
      if (strLen > maxWidth) maxWidth = strLen;
    }

    return {
      header: headerLabel,
      key: header,
      width: Math.min(Math.max(maxWidth + 2, 12), 40),
    };
  });

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2B579A' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 24;

  // Add borders to header
  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF1A3A6B' } },
      bottom: { style: 'medium', color: { argb: 'FF1A3A6B' } },
      left: { style: 'thin', color: { argb: 'FF1A3A6B' } },
      right: { style: 'thin', color: { argb: 'FF1A3A6B' } },
    };
  });

  // Add data rows
  for (let rowIdx = 0; rowIdx < data.length; rowIdx++) {
    const rowData = data[rowIdx];
    const values = headers.map((header) => {
      const val = rowData[header];
      if (val === null || val === undefined) return '';
      if (val instanceof Date) return val;
      if (typeof val === 'object') return JSON.stringify(val);
      return val;
    });

    const row = worksheet.addRow(values);

    // Alternate row shading for readability
    if (rowIdx % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF2F6FA' },
      };
    }

    // Add thin borders to all data cells
    row.eachCell((cell) => {
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      };
      cell.alignment = { vertical: 'middle', wrapText: false };
    });
  }

  // Auto-filter on header row
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: headers.length },
  };

  // Freeze the header row
  worksheet.views = [
    { state: 'frozen', ySplit: 1, activeCell: 'A2' },
  ];

  // Add a summary row at the bottom
  const summaryRowIdx = data.length + 3;
  const summaryRow = worksheet.getRow(summaryRowIdx);
  summaryRow.getCell(1).value = `Total Records: ${data.length}`;
  summaryRow.getCell(1).font = { bold: true, size: 10, color: { argb: 'FF555555' } };

  const dateRow = worksheet.getRow(summaryRowIdx + 1);
  dateRow.getCell(1).value = `Generated: ${new Date().toISOString()}`;
  dateRow.getCell(1).font = { italic: true, size: 9, color: { argb: 'FF888888' } };

  return workbook;
}
