export function validateDrillThroughRequest(req: any): boolean {
  return true; // Stub implementation
}

export function validateExportFormat(format: string): boolean {
  return ['json', 'csv', 'excel', 'pdf'].includes(format);
}

export function validateEntityType(entityType: string): boolean {
  const validTypes = ['vehicle', 'driver', 'maintenance', 'fuel', 'compliance'];
  return validTypes.includes(entityType);
}

export function validateFilters(filters: any): boolean {
  return filters && typeof filters === 'object';
}

export function validateFormat(format: string): boolean {
  return validateExportFormat(format);
}