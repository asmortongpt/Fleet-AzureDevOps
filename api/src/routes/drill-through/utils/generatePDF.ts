export function generatePDF(data: any[]): Buffer {
  // Stub implementation - would use pdfkit in production
  // Return a minimal valid PDF structure
  const pdfHeader = '%PDF-1.4\n';
  const pdfContent = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << >> /MediaBox [0 0 612 792] >>\nendobj\n`;
  const pdfXref = `xref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n`;
  const pdfTrailer = `trailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n${pdfHeader.length + pdfContent.length}\n%%EOF`;
  
  return Buffer.from(pdfHeader + pdfContent + pdfXref + pdfTrailer);
}