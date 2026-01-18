export function validateDrillThroughRequest(req: any): boolean {
  return true; // Stub implementation
}

export function validateExportFormat(format: string): boolean {
  return ['json', 'csv', 'excel', 'pdf'].includes(format);
}
