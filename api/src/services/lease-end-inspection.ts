/**
 * Lease-End Inspection Service
 *
 * Provides business logic for lease-end inspection workflow, including:
 * - Inspection scheduling (60 days before lease end)
 * - Inspection checklist generation
 * - Excess wear charge calculations
 * - Final invoice generation
 *
 * @module services/lease-end-inspection
 * @since 2026-02-02
 */

import { tenantSafeQuery } from '../utils/dbHelpers';
import {
  LeaseEndInspection,
  LeaseEndChecklist,
  ChecklistItem,
  LeaseEndInvoice,
  ExcessWearItem,
  MissingItem,
} from '../types/contracts';
import LeaseManagementService from './lease-management';

export class LeaseEndInspectionService {
  /**
   * Schedule a lease-end inspection (recommended 60 days before lease end)
   */
  static async scheduleInspection(
    tenantId: string,
    contractId: string,
    vehicleId: string,
    scheduledDate?: string
  ): Promise<{ inspection_id: string; scheduled_date: string; checklist: LeaseEndChecklist }> {
    // Get contract details
    const contractQuery = `
      SELECT id, contract_number, end_date, vehicle_id
      FROM vehicle_contracts
      WHERE id = $1 AND tenant_id = $2 AND contract_type = 'lease'
    `;

    const contractResult = await tenantSafeQuery(contractQuery, [contractId, tenantId], tenantId);

    if (contractResult.rows.length === 0) {
      throw new Error('Lease contract not found');
    }

    const contract = contractResult.rows[0];

    // Calculate recommended inspection date (60 days before end)
    const leaseEndDate = new Date(contract.end_date);
    const recommendedDate = new Date(leaseEndDate);
    recommendedDate.setDate(recommendedDate.getDate() - 60);

    const inspectionDate = scheduledDate || recommendedDate.toISOString().split('T')[0];

    // Create inspection record (will be completed later)
    const createQuery = `
      INSERT INTO lease_end_inspections (
        tenant_id, contract_id, vehicle_id, inspection_date,
        final_odometer, mileage_overage, mileage_penalty,
        excess_wear_total, missing_items_total, total_charges,
        notes, metadata
      ) VALUES (
        $1, $2, $3, $4, 0, 0, 0, 0, 0, 0,
        'Inspection scheduled - pending completion',
        '{"status": "scheduled"}'::jsonb
      ) RETURNING id
    `;

    const inspectionResult = await tenantSafeQuery(createQuery, [
      tenantId,
      contractId,
      vehicleId,
      inspectionDate,
    ], tenantId);

    const inspectionId = inspectionResult.rows[0].id;

    // Generate inspection checklist
    const checklist = this.generateInspectionChecklist(contractId, vehicleId);

    return {
      inspection_id: inspectionId,
      scheduled_date: inspectionDate,
      checklist,
    };
  }

  /**
   * Generate inspection checklist for lease-end inspection
   */
  static generateInspectionChecklist(
    contractId: string,
    vehicleId: string
  ): LeaseEndChecklist {
    const checklistItems: ChecklistItem[] = [
      // Exterior checks
      {
        id: '1',
        category: 'Exterior',
        item: 'Check front bumper for damage',
        is_completed: false,
        completed_at: null,
        completed_by: null,
        notes: null,
      },
      {
        id: '2',
        category: 'Exterior',
        item: 'Check rear bumper for damage',
        is_completed: false,
        completed_at: null,
        completed_by: null,
        notes: null,
      },
      {
        id: '3',
        category: 'Exterior',
        item: 'Inspect body panels for dents/scratches',
        is_completed: false,
        completed_at: null,
        completed_by: null,
        notes: null,
      },
      {
        id: '4',
        category: 'Exterior',
        item: 'Check windshield for cracks/chips',
        is_completed: false,
        completed_at: null,
        completed_by: null,
        notes: null,
      },
      {
        id: '5',
        category: 'Exterior',
        item: 'Inspect all windows',
        is_completed: false,
        completed_at: null,
        completed_by: null,
        notes: null,
      },
      {
        id: '6',
        category: 'Exterior',
        item: 'Check all lights (headlights, taillights, signals)',
        is_completed: false,
        completed_at: null,
        completed_by: null,
        notes: null,
      },
      {
        id: '7',
        category: 'Exterior',
        item: 'Inspect mirrors',
        is_completed: false,
        completed_at: null,
        completed_by: null,
        notes: null,
      },
      {
        id: '8',
        category: 'Exterior',
        item: 'Check tire tread depth (minimum 4/32")',
        is_completed: false,
        completed_at: null,
        completed_by: null,
        notes: null,
      },
      {
        id: '9',
        category: 'Exterior',
        item: 'Inspect wheels/rims for damage',
        is_completed: false,
        completed_at: null,
        completed_by: null,
        notes: null,
      },

      // Interior checks
      {
        id: '10',
        category: 'Interior',
        item: 'Inspect seats for tears/stains',
        is_completed: false,
        completed_at: null,
        completed_by: null,
        notes: null,
      },
      {
        id: '11',
        category: 'Interior',
        item: 'Check carpet for damage/stains',
        is_completed: false,
        completed_at: null,
        completed_by: null,
        notes: null,
      },
      {
        id: '12',
        category: 'Interior',
        item: 'Inspect dashboard for cracks/damage',
        is_completed: false,
        completed_at: null,
        completed_by: null,
        notes: null,
      },
      {
        id: '13',
        category: 'Interior',
        item: 'Test all interior lights',
        is_completed: false,
        completed_at: null,
        completed_by: null,
        notes: null,
      },
      {
        id: '14',
        category: 'Interior',
        item: 'Check HVAC system functionality',
        is_completed: false,
        completed_at: null,
        completed_by: null,
        notes: null,
      },
      {
        id: '15',
        category: 'Interior',
        item: 'Test audio system',
        is_completed: false,
        completed_at: null,
        completed_by: null,
        notes: null,
      },
      {
        id: '16',
        category: 'Interior',
        item: 'Check for unusual odors (smoke, pets)',
        is_completed: false,
        completed_at: null,
        completed_by: null,
        notes: null,
      },

      // Mechanical checks
      {
        id: '17',
        category: 'Mechanical',
        item: 'Test engine start and idle',
        is_completed: false,
        completed_at: null,
        completed_by: null,
        notes: null,
      },
      {
        id: '18',
        category: 'Mechanical',
        item: 'Check for fluid leaks',
        is_completed: false,
        completed_at: null,
        completed_by: null,
        notes: null,
      },
      {
        id: '19',
        category: 'Mechanical',
        item: 'Inspect brake system',
        is_completed: false,
        completed_at: null,
        completed_by: null,
        notes: null,
      },
      {
        id: '20',
        category: 'Mechanical',
        item: 'Check battery condition',
        is_completed: false,
        completed_at: null,
        completed_by: null,
        notes: null,
      },
      {
        id: '21',
        category: 'Mechanical',
        item: 'Verify all warning lights function properly',
        is_completed: false,
        completed_at: null,
        completed_by: null,
        notes: null,
      },

      // Documentation checks
      {
        id: '22',
        category: 'Documentation',
        item: 'Verify all keys present (2 sets minimum)',
        is_completed: false,
        completed_at: null,
        completed_by: null,
        notes: null,
      },
      {
        id: '23',
        category: 'Documentation',
        item: 'Confirm owner\'s manual present',
        is_completed: false,
        completed_at: null,
        completed_by: null,
        notes: null,
      },
      {
        id: '24',
        category: 'Documentation',
        item: 'Verify spare tire and jack present',
        is_completed: false,
        completed_at: null,
        completed_by: null,
        notes: null,
      },
      {
        id: '25',
        category: 'Documentation',
        item: 'Check for all floor mats',
        is_completed: false,
        completed_at: null,
        completed_by: null,
        notes: null,
      },
      {
        id: '26',
        category: 'Documentation',
        item: 'Verify service records/maintenance logs',
        is_completed: false,
        completed_at: null,
        completed_by: null,
        notes: null,
      },
      {
        id: '27',
        category: 'Documentation',
        item: 'Record final odometer reading',
        is_completed: false,
        completed_at: null,
        completed_by: null,
        notes: null,
      },
    ];

    return {
      contract_id: contractId,
      vehicle_id: vehicleId,
      checklist_items: checklistItems,
      completed_items: 0,
      total_items: checklistItems.length,
      completion_percentage: 0,
    };
  }

  /**
   * Calculate excess wear charges based on inspection findings
   */
  static calculateExcessWearCharges(wearItems: ExcessWearItem[]): number {
    if (!wearItems || wearItems.length === 0) {
      return 0;
    }

    return wearItems.reduce((total, item) => total + (item.charge || 0), 0);
  }

  /**
   * Calculate missing items charges
   */
  static calculateMissingItemsCharges(missingItems: MissingItem[]): number {
    if (!missingItems || missingItems.length === 0) {
      return 0;
    }

    return missingItems.reduce((total, item) => total + (item.charge || 0), 0);
  }

  /**
   * Generate final lease-end invoice
   */
  static async generateFinalInvoice(
    tenantId: string,
    inspectionId: string
  ): Promise<LeaseEndInvoice> {
    // Get inspection details
    const inspectionQuery = `
      SELECT
        lei.*,
        vc.contract_number,
        v.vehicle_number
      FROM lease_end_inspections lei
      INNER JOIN vehicle_contracts vc ON lei.contract_id = vc.id
      INNER JOIN vehicles v ON lei.vehicle_id = v.id
      WHERE lei.id = $1 AND lei.tenant_id = $2
    `;

    const inspectionResult = await tenantSafeQuery(inspectionQuery, [inspectionId, tenantId], tenantId);

    if (inspectionResult.rows.length === 0) {
      throw new Error('Lease-end inspection not found');
    }

    const inspection = inspectionResult.rows[0];

    // Calculate charges
    const mileageCharges = inspection.mileage_penalty || 0;
    const wearAndTearCharges = inspection.excess_wear_total || 0;
    const missingItemsCharges = inspection.missing_items_total || 0;
    const cleaningCharges = 0; // Could be calculated based on condition
    const otherCharges = 0;

    const subtotal = mileageCharges + wearAndTearCharges + missingItemsCharges + cleaningCharges + otherCharges;
    const taxRate = 0.07; // 7% tax (adjust based on jurisdiction)
    const tax = subtotal * taxRate;
    const totalDue = subtotal + tax;

    // Calculate payment due date (typically 30 days after inspection)
    const inspectionDate = new Date(inspection.inspection_date);
    const paymentDueDate = new Date(inspectionDate);
    paymentDueDate.setDate(paymentDueDate.getDate() + 30);

    const invoice: LeaseEndInvoice = {
      inspection_id: inspectionId,
      contract_id: inspection.contract_id,
      vehicle_id: inspection.vehicle_id,
      mileage_charges: mileageCharges,
      wear_and_tear_charges: wearAndTearCharges,
      missing_items_charges: missingItemsCharges,
      cleaning_charges: cleaningCharges,
      other_charges: otherCharges,
      subtotal,
      tax,
      total_due: totalDue,
      payment_due_date: paymentDueDate.toISOString().split('T')[0],
      payment_status: 'pending',
      payment_date: null,
      invoice_url: null, // Would be generated and stored
    };

    // Update inspection with invoice URL (placeholder)
    await tenantSafeQuery(
      `UPDATE lease_end_inspections
       SET total_charges = $1, metadata = metadata || $2::jsonb
       WHERE id = $3 AND tenant_id = $4`,
      [
        totalDue,
        JSON.stringify({ invoice_generated: true, invoice_date: new Date().toISOString() }),
        inspectionId,
        tenantId,
      ],
      tenantId
    );

    return invoice;
  }

  /**
   * Complete a lease-end inspection with all findings
   */
  static async completeInspection(
    tenantId: string,
    inspectionId: string,
    data: {
      final_odometer: number;
      inspector_name?: string;
      inspector_company?: string;
      excess_wear_items?: ExcessWearItem[];
      missing_items?: MissingItem[];
      disposition?: 'returned' | 'purchased' | 'extended';
      notes?: string;
    }
  ): Promise<LeaseEndInspection> {
    // Get inspection and contract details
    const inspectionQuery = `
      SELECT
        lei.*,
        vc.mileage_allowance_annual,
        vc.excess_mileage_fee,
        vc.term_months
      FROM lease_end_inspections lei
      INNER JOIN vehicle_contracts vc ON lei.contract_id = vc.id
      WHERE lei.id = $1 AND lei.tenant_id = $2
    `;

    const inspectionResult = await tenantSafeQuery(inspectionQuery, [inspectionId, tenantId], tenantId);

    if (inspectionResult.rows.length === 0) {
      throw new Error('Inspection not found');
    }

    const inspection = inspectionResult.rows[0];

    // Calculate total mileage allowance (annual * years)
    const totalMileageAllowance = inspection.mileage_allowance_annual * (inspection.term_months / 12);

    // Calculate mileage overage
    const mileageOverage = Math.max(0, data.final_odometer - totalMileageAllowance);
    const mileagePenalty = mileageOverage * (inspection.excess_mileage_fee || 0);

    // Calculate excess wear charges
    const excessWearTotal = this.calculateExcessWearCharges(data.excess_wear_items || []);

    // Calculate missing items charges
    const missingItemsTotal = this.calculateMissingItemsCharges(data.missing_items || []);

    // Calculate total charges
    const totalCharges = mileagePenalty + excessWearTotal + missingItemsTotal;

    // Update inspection
    const updateQuery = `
      UPDATE lease_end_inspections
      SET
        final_odometer = $1,
        inspector_name = $2,
        inspector_company = $3,
        mileage_overage = $4,
        mileage_penalty = $5,
        excess_wear_items = $6,
        excess_wear_total = $7,
        missing_items = $8,
        missing_items_total = $9,
        total_charges = $10,
        disposition = $11,
        disposition_date = CASE WHEN $11 IS NOT NULL THEN CURRENT_DATE ELSE NULL END,
        notes = $12,
        metadata = metadata || '{"status": "completed"}'::jsonb,
        updated_at = NOW()
      WHERE id = $13 AND tenant_id = $14
      RETURNING *
    `;

    const updateResult = await tenantSafeQuery(updateQuery, [
      data.final_odometer,
      data.inspector_name || null,
      data.inspector_company || null,
      mileageOverage,
      mileagePenalty,
      JSON.stringify(data.excess_wear_items || []),
      excessWearTotal,
      JSON.stringify(data.missing_items || []),
      missingItemsTotal,
      totalCharges,
      data.disposition || null,
      data.notes || null,
      inspectionId,
      tenantId,
    ], tenantId);

    return updateResult.rows[0];
  }

  /**
   * Get common wear and tear charges (reference pricing)
   */
  static getStandardWearCharges(): { [key: string]: number } {
    return {
      // Exterior
      'front_bumper_scratch': 250,
      'rear_bumper_scratch': 250,
      'door_dent_small': 150,
      'door_dent_large': 400,
      'windshield_crack': 300,
      'side_mirror_damage': 200,
      'rim_scratch': 100,
      'paint_chip': 50,

      // Interior
      'seat_tear': 200,
      'seat_stain': 100,
      'carpet_stain': 75,
      'dashboard_crack': 150,
      'console_damage': 100,

      // Missing items
      'spare_tire': 150,
      'jack': 75,
      'owner_manual': 50,
      'floor_mats': 100,
      'key_fob': 200,

      // Mechanical
      'brake_pad_replacement': 300,
      'tire_replacement': 150,
      'excessive_brake_wear': 200,
    };
  }

  /**
   * Notify relevant parties about inspection scheduling/completion
   */
  static async sendInspectionNotifications(
    tenantId: string,
    inspectionId: string,
    notificationType: 'scheduled' | 'completed' | 'payment_due'
  ): Promise<void> {
    // TODO: Integrate with notification service
    console.log(`[LEASE INSPECTION] ${notificationType.toUpperCase()} notification for inspection ${inspectionId}`);

    // In production, this would:
    // 1. Get relevant stakeholders (fleet manager, vehicle coordinator, driver)
    // 2. Send email notifications
    // 3. Create in-app notifications
    // 4. Update calendar/scheduling system
  }
}

export default LeaseEndInspectionService;
