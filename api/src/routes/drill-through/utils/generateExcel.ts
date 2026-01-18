export function generateExcel(data: any[]): Buffer {
  // Stub implementation - would use exceljs in production
  return Buffer.from(JSON.stringify(data));
}
