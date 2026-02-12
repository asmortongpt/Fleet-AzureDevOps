/**
 * PDF Generation Utility for Drill-Through Exports
 * Uses pdf-lib to create real PDF documents with headers, data rows, and pagination.
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function generatePDF(data: any[]): Promise<PDFDocument> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  if (!data || data.length === 0) {
    // Return a single-page PDF with a "no data" message
    const page = pdfDoc.addPage([842, 595]); // A4 landscape
    page.drawText('No data available for export.', {
      x: 50,
      y: 545,
      size: 14,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    return pdfDoc;
  }

  const headers = Object.keys(data[0]);
  const PAGE_WIDTH = 842;
  const PAGE_HEIGHT = 595;
  const MARGIN = 40;
  const HEADER_FONT_SIZE = 8;
  const DATA_FONT_SIZE = 7;
  const TITLE_FONT_SIZE = 14;
  const ROW_HEIGHT = 14;
  const HEADER_ROW_HEIGHT = 18;
  const usableWidth = PAGE_WIDTH - 2 * MARGIN;
  const columnWidth = Math.min(usableWidth / headers.length, 120);

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let yPosition = PAGE_HEIGHT - MARGIN;

  // Draw title
  const reportDate = new Date().toISOString().split('T')[0];
  page.drawText(`Fleet Data Export - ${reportDate}`, {
    x: MARGIN,
    y: yPosition,
    size: TITLE_FONT_SIZE,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.4),
  });
  yPosition -= 10;

  page.drawText(`Total Records: ${data.length}`, {
    x: MARGIN,
    y: yPosition,
    size: 9,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });
  yPosition -= 20;

  // Draw header separator line
  page.drawLine({
    start: { x: MARGIN, y: yPosition + 2 },
    end: { x: PAGE_WIDTH - MARGIN, y: yPosition + 2 },
    thickness: 1,
    color: rgb(0.2, 0.3, 0.6),
  });

  // Draw header row background
  page.drawRectangle({
    x: MARGIN,
    y: yPosition - HEADER_ROW_HEIGHT + 4,
    width: usableWidth,
    height: HEADER_ROW_HEIGHT,
    color: rgb(0.9, 0.92, 0.97),
  });

  // Draw headers
  headers.forEach((header, index) => {
    const label = header
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const truncatedLabel = label.length > 16 ? label.substring(0, 14) + '..' : label;

    page.drawText(truncatedLabel, {
      x: MARGIN + index * columnWidth + 2,
      y: yPosition - HEADER_ROW_HEIGHT + 8,
      size: HEADER_FONT_SIZE,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.4),
    });
  });

  yPosition -= HEADER_ROW_HEIGHT + 4;

  // Draw separator line after header
  page.drawLine({
    start: { x: MARGIN, y: yPosition + 2 },
    end: { x: PAGE_WIDTH - MARGIN, y: yPosition + 2 },
    thickness: 0.5,
    color: rgb(0.6, 0.6, 0.6),
  });

  let pageNumber = 1;
  let rowIndex = 0;

  // Draw data rows
  for (const row of data) {
    if (yPosition < MARGIN + 30) {
      // Add page number to current page
      page.drawText(`Page ${pageNumber}`, {
        x: PAGE_WIDTH - MARGIN - 40,
        y: 20,
        size: 8,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });

      // New page
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      yPosition = PAGE_HEIGHT - MARGIN;
      pageNumber++;

      // Redraw header on new page
      page.drawRectangle({
        x: MARGIN,
        y: yPosition - HEADER_ROW_HEIGHT + 4,
        width: usableWidth,
        height: HEADER_ROW_HEIGHT,
        color: rgb(0.9, 0.92, 0.97),
      });

      headers.forEach((header, index) => {
        const label = header
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());
        const truncatedLabel = label.length > 16 ? label.substring(0, 14) + '..' : label;

        page.drawText(truncatedLabel, {
          x: MARGIN + index * columnWidth + 2,
          y: yPosition - HEADER_ROW_HEIGHT + 8,
          size: HEADER_FONT_SIZE,
          font: boldFont,
          color: rgb(0.1, 0.1, 0.4),
        });
      });

      yPosition -= HEADER_ROW_HEIGHT + 4;

      page.drawLine({
        start: { x: MARGIN, y: yPosition + 2 },
        end: { x: PAGE_WIDTH - MARGIN, y: yPosition + 2 },
        thickness: 0.5,
        color: rgb(0.6, 0.6, 0.6),
      });
    }

    // Alternate row background for readability
    if (rowIndex % 2 === 0) {
      page.drawRectangle({
        x: MARGIN,
        y: yPosition - ROW_HEIGHT + 4,
        width: usableWidth,
        height: ROW_HEIGHT,
        color: rgb(0.96, 0.96, 0.98),
      });
    }

    // Draw each cell
    headers.forEach((header, index) => {
      const rawValue = row[header];
      let cellValue = '';

      if (rawValue === null || rawValue === undefined) {
        cellValue = '';
      } else if (rawValue instanceof Date) {
        cellValue = rawValue.toISOString().split('T')[0];
      } else if (typeof rawValue === 'object') {
        cellValue = JSON.stringify(rawValue);
      } else {
        cellValue = String(rawValue);
      }

      // Truncate long values to fit column
      const maxChars = Math.floor(columnWidth / (DATA_FONT_SIZE * 0.55));
      const truncated = cellValue.length > maxChars
        ? cellValue.substring(0, maxChars - 2) + '..'
        : cellValue;

      page.drawText(truncated, {
        x: MARGIN + index * columnWidth + 2,
        y: yPosition - ROW_HEIGHT + 6,
        size: DATA_FONT_SIZE,
        font,
        color: rgb(0.15, 0.15, 0.15),
      });
    });

    yPosition -= ROW_HEIGHT;
    rowIndex++;
  }

  // Add page number to last page
  page.drawText(`Page ${pageNumber}`, {
    x: PAGE_WIDTH - MARGIN - 40,
    y: 20,
    size: 8,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Add generation timestamp footer on last page
  page.drawText(`Generated: ${new Date().toISOString()} | CTAFleet Export`, {
    x: MARGIN,
    y: 20,
    size: 7,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  return pdfDoc;
}
