/**
 * Barcode/RFID Tracking Service
 * Service for managing physical inventory tracking with barcode and RFID technology
 */

import { secureFetch } from '@/hooks/use-api';

export interface ItemLocation {
  facility: string;
  building: string;
  room: string;
  shelf: string;
  bin: string;
}

export interface CheckoutRecord {
  id: string;
  itemId: string;
  checkedOutBy: string;
  checkedOutTo: string;
  checkedOutDate: Date;
  checkedInDate?: Date;
  purpose: string;
  workOrderNumber?: string;
  condition: {
    checkoutCondition: string;
    checkinCondition?: string;
  };
}

export interface MaintenanceRecord {
  id: string;
  itemId: string;
  date: Date;
  type: string;
  description: string;
  performedBy: string;
  notes?: string;
}

export interface InventoryItem {
  id: string;
  partNumber: string;
  name: string;
  category: string;
  barcode: string;
  qrCode: string;
  rfidTag?: string;
  location: ItemLocation;
  status: 'in_stock' | 'checked_out' | 'maintenance' | 'reserved' | 'disposed';
  condition?: 'new' | 'good' | 'fair' | 'poor' | 'defective';
  unitCost: number;
  currentValue: number;
  lastScanned?: Date;
  lastMoved?: Date;
  scannedBy?: string;
  checkoutHistory?: CheckoutRecord[];
  maintenanceHistory?: MaintenanceRecord[];
}

export interface ScanEvent {
  id: string;
  timestamp: Date;
  scanType: 'barcode' | 'qrcode' | 'rfid';
  scannerId: string;
  scannerLocation: string;
  itemId: string;
  scannedBy: string;
  action: 'inventory' | 'checkout' | 'checkin' | 'transfer' | 'audit';
  notes?: string;
}

export interface InventoryAudit {
  id: string;
  type: 'full' | 'cycle' | 'spot';
  startDate: Date;
  endDate?: Date;
  location: string;
  assignedTeam: string[];
  supervisor: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  expectedCount: number;
  actualCount: number;
  discrepancies: AuditDiscrepancy[];
}

export interface AuditDiscrepancy {
  itemId: string;
  expectedLocation: ItemLocation;
  actualLocation?: ItemLocation;
  expectedCondition: string;
  actualCondition?: string;
  issue: 'missing' | 'misplaced' | 'damaged' | 'extra';
  notes?: string;
}

export interface BarcodeGenerationResult {
  code: string;
  format: string;
  imageData?: string;
}

export interface ScanResult {
  success: boolean;
  message: string;
  item?: InventoryItem;
}

export interface RFIDSweepResult {
  foundItems: InventoryItem[];
  missingItems: InventoryItem[];
  sweepDuration: number;
}

class BarcodeRFIDTrackingService {
  async generateBarcode(options: {
    itemId: string;
    partNumber: string;
    format: 'QR' | 'CODE128' | 'CODE39' | 'EAN13';
    size: 'small' | 'medium' | 'large';
    includeText: boolean;
  }): Promise<BarcodeGenerationResult> {
    const response = await secureFetch(`/api/inventory/items/${options.itemId}`);
    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || 'Failed to load inventory item for barcode generation');
    }

    const payload = await response.json();
    const item = payload.data || payload;
    const code =
      item?.sku ||
      item?.part_number ||
      item?.manufacturer_part_number ||
      options.partNumber;

    if (!code) {
      throw new Error('Inventory item is missing a barcode/part number');
    }

    return {
      code,
      format: options.format,
      imageData: item?.barcode_image || item?.qr_code_image
    };
  }

  async scanBarcode(
    code: string,
    scannerId: string,
    location: string,
    action: 'inventory' | 'checkout' | 'checkin' | 'transfer' | 'audit',
    userId: string
  ): Promise<ScanResult> {
    const response = await secureFetch('/api/inventory/scan', {
      method: 'POST',
      body: JSON.stringify({ barcode: code }),
    });

    if (!response.ok) {
      const message = await response.text();
      return {
        success: false,
        message: message || 'Item not found',
      };
    }

    const payload = await response.json();
    const item = payload.data || payload;
    const quantityOnHand = Number(item?.quantity_on_hand ?? item?.quantityOnHand ?? 0);
    const locationData = {
      facility: item?.warehouse_location || item?.warehouseLocation || '',
      building: item?.building || '',
      room: item?.room || '',
      shelf: item?.shelf || '',
      bin: item?.bin_location || item?.binLocation || '',
    };

    const mappedItem: InventoryItem = {
      id: item?.id,
      partNumber: item?.part_number || item?.partNumber || '',
      name: item?.name || '',
      category: item?.category || '',
      barcode: item?.sku || item?.part_number || item?.manufacturer_part_number || code,
      qrCode: item?.qr_code || item?.qrCode || '',
      rfidTag: item?.rfid_tag || item?.rfidTag,
      location: locationData,
      status: quantityOnHand > 0 ? 'in_stock' : 'reserved',
      condition: item?.condition,
      unitCost: Number(item?.unit_cost ?? item?.unitCost ?? 0),
      currentValue: Number(item?.current_value ?? item?.currentValue ?? 0),
      lastScanned: item?.last_used ? new Date(item.last_used) : undefined,
      lastMoved: item?.updated_at ? new Date(item.updated_at) : undefined,
      scannedBy: userId,
      checkoutHistory: item?.checkout_history || item?.checkoutHistory,
      maintenanceHistory: item?.maintenance_history || item?.maintenanceHistory,
    };

    return {
      success: true,
      message: 'Item scanned successfully',
      item: mappedItem,
    };
  }

  async checkOutItem(
    itemId: string,
    checkedOutTo: string,
    purpose: string,
    expectedReturnDate?: Date,
    workOrderNumber?: string,
    notes?: string,
    quantity: number = 1,
    condition?: string
  ): Promise<CheckoutRecord> {
    const normalizedNotes = condition
      ? `${notes ? `${notes} | ` : ''}Condition: ${condition}`
      : notes;

    const response = await secureFetch('/api/inventory/transactions', {
      method: 'POST',
      body: JSON.stringify({
        item_id: itemId,
        transaction_type: 'usage',
        quantity: -Math.abs(quantity),
        unit_cost: 0,
        reason: purpose,
        work_order_id: workOrderNumber,
        reference_number: workOrderNumber,
        notes: normalizedNotes,
      }),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || 'Failed to check out item');
    }

    const payload = await response.json();
    const data = payload.data || payload;

    return {
      id: data.id,
      itemId,
      checkedOutBy: data.user_id || '',
      checkedOutTo,
      checkedOutDate: data.created_at ? new Date(data.created_at) : new Date(),
      purpose,
      workOrderNumber,
      condition: {
        checkoutCondition: condition || data.condition || 'unknown',
      },
    };
  }

  async checkInItem(
    itemId: string,
    condition: string,
    notes?: string,
    quantity: number = 1
  ): Promise<CheckoutRecord> {
    const response = await secureFetch('/api/inventory/transactions', {
      method: 'POST',
      body: JSON.stringify({
        item_id: itemId,
        transaction_type: 'return',
        quantity: Math.abs(quantity),
        unit_cost: 0,
        reason: notes || 'Return',
        notes: condition ? `Condition: ${condition}${notes ? ` | ${notes}` : ''}` : notes,
      }),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || 'Failed to check in item');
    }

    const payload = await response.json();
    const data = payload.data || payload;

    return {
      id: data.id,
      itemId,
      checkedOutBy: data.user_id || '',
      checkedOutTo: 'returned',
      checkedOutDate: data.created_at ? new Date(data.created_at) : new Date(),
      checkedInDate: data.created_at ? new Date(data.created_at) : new Date(),
      purpose: notes || 'Return',
      condition: {
        checkoutCondition: condition || data.condition || 'unknown',
        checkinCondition: condition,
      },
    };
  }

  async startInventoryAudit(
    type: 'full' | 'cycle' | 'spot',
    location: string,
    assignedTeam: string[],
    supervisor: string
  ): Promise<InventoryAudit> {
    throw new Error('Inventory audit creation is not available in the backend yet');
  }

  async performRFIDSweep(
    readerId: string,
    location: string,
    userId: string
  ): Promise<RFIDSweepResult> {
    throw new Error('RFID sweep is not available in the backend yet');
  }
}

export const barcodeRFIDTrackingService = new BarcodeRFIDTrackingService();
