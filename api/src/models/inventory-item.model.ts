export interface InventoryItem {
  id: number;
  name: string;
  quantity?: number;
  price?: number;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}
