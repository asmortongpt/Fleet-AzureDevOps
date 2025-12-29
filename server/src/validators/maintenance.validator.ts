export function validateAssetId(assetId: string): void {
  if (!/^[a-zA-Z0-9-]+$/.test(assetId)) {
    throw new Error('Invalid asset ID');
  }
}

export function validateTenantId(tenantId: string): void {
  if (!/^[a-zA-Z0-9-]+$/.test(tenantId)) {
    throw new Error('Invalid tenant ID');
  }
}

export function validateMonthISO(monthISO: string): void {
  if (!/^\d{4}-\d{2}$/.test(monthISO)) {
    throw new Error('Invalid month format');
  }
}

export function validateEmail(email: string): void {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Invalid email format');
  }
}
