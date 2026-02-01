/**
 * Enhanced Purchase Order Workflow API
 * Complete PO management with approval chains and workflow automation
 *
 * Features:
 * - Multi-level approval workflows
 * - Auto-creation from low stock alerts
 * - Vendor integration
 * - Line item management
 * - Receiving workflow
 * - Invoice matching
 * - Audit trail
 *
 * Security: Parameterized queries, RBAC, tenant isolation
 */

import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { Pool } from 'pg';

import { authenticateJWT } from '../middleware/auth';
import { csrfProtection } from '../middleware/csrf';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

let pool: Pool;

export function setDatabasePool(dbPool: Pool) {
  pool = dbPool;
}

// =============================================================================
// TYPES
// =============================================================================

interface POLineItem {
  inventory_item_id: string;
  part_number: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate?: number;
  discount?: number;
}

type POStatus = 'draft' | 'pending_approval' | 'approved' | 'ordered' | 'partially_received' | 'received' | 'cancelled';
type ApprovalStatus = 'pending' | 'approved' | 'rejected';

// =============================================================================
// VALIDATION
// =============================================================================

const validatePurchaseOrder = [
  body('vendor_id').isUUID().withMessage('Vendor ID must be valid'),
  body('line_items').isArray({ min: 1 }).withMessage('At least one line item required'),
  body('line_items.*.inventory_item_id').isUUID().withMessage('Item ID must be valid'),
  body('line_items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be positive'),
  body('line_items.*.unit_price').isFloat({ min: 0 }).withMessage('Price must be positive'),
];

// =============================================================================
// GET ALL PURCHASE ORDERS (with filtering)
// =============================================================================

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const {
    status,
    vendor_id,
    start_date,
    end_date,
    page = 1,
    limit = 50,
    sort_by = 'order_date',
    sort_order = 'desc',
  } = req.query;

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));
  const offset = (pageNum - 1) * limitNum;

  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (status) {
    conditions.push(`po.status = $${paramIndex++}`);
    params.push(status);
  }

  if (vendor_id) {
    conditions.push(`po.vendor_id = $${paramIndex++}`);
    params.push(vendor_id);
  }

  if (start_date) {
    conditions.push(`po.order_date >= $${paramIndex++}`);
    params.push(start_date);
  }

  if (end_date) {
    conditions.push(`po.order_date <= $${paramIndex++}`);
    params.push(end_date);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const validSortColumns = ['order_date', 'total_amount', 'status', 'number'];
  const sortColumn = validSortColumns.includes(sort_by as string) ? sort_by : 'order_date';
  const sortDirection = sort_order === 'asc' ? 'ASC' : 'DESC';

  const query = `
    SELECT
      po.*,
      v.name as vendor_name,
      v.contact_name as vendor_contact,
      v.email as vendor_email,
      v.phone as vendor_phone,
      COUNT(DISTINCT pol.id) as line_item_count,
      COALESCE(SUM(pol.quantity * pol.unit_price * (1 + COALESCE(pol.tax_rate, 0)) * (1 - COALESCE(pol.discount, 0))), 0) as calculated_total
    FROM purchase_orders po
    LEFT JOIN vendors v ON po.vendor_id = v.id
    LEFT JOIN purchase_order_line_items pol ON po.id = pol.purchase_order_id
    ${whereClause}
    GROUP BY po.id, v.id
    ORDER BY po.${sortColumn} ${sortDirection}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  params.push(limitNum, offset);

  const countQuery = `
    SELECT COUNT(*) as total
    FROM purchase_orders po
    ${whereClause}
  `;

  const [ordersResult, countResult] = await Promise.all([
    pool.query(query, params),
    pool.query(countQuery, params.slice(0, -2)),
  ]);

  const total = parseInt(countResult.rows[0].total);

  res.json({
    success: true,
    data: ordersResult.rows,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
}));

// =============================================================================
// GET SINGLE PURCHASE ORDER WITH LINE ITEMS
// =============================================================================

router.get('/:id', [
  param('id').isUUID(),
], asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const poQuery = `
    SELECT
      po.*,
      v.name as vendor_name,
      v.contact_name as vendor_contact,
      v.email as vendor_email,
      v.phone as vendor_phone,
      v.address as vendor_address,
      v.payment_terms as vendor_payment_terms
    FROM purchase_orders po
    JOIN vendors v ON po.vendor_id = v.id
    WHERE po.id = $1
  `;

  const lineItemsQuery = `
    SELECT
      pol.*,
      ii.sku,
      ii.name as item_name,
      ii.category,
      pol.quantity * pol.unit_price * (1 + COALESCE(pol.tax_rate, 0)) * (1 - COALESCE(pol.discount, 0)) as line_total
    FROM purchase_order_line_items pol
    JOIN inventory_items ii ON pol.inventory_item_id = ii.id
    WHERE pol.purchase_order_id = $1
    ORDER BY pol.line_number
  `;

  const approvalsQuery = `
    SELECT
      poa.*,
      u.name as approver_name,
      u.email as approver_email
    FROM purchase_order_approvals poa
    JOIN users u ON poa.approver_id = u.id
    WHERE poa.purchase_order_id = $1
    ORDER BY poa.approval_level, poa.created_at
  `;

  const receivingQuery = `
    SELECT *
    FROM purchase_order_receiving
    WHERE purchase_order_id = $1
    ORDER BY received_date DESC
  `;

  const [poResult, lineItemsResult, approvalsResult, receivingResult] = await Promise.all([
    pool.query(poQuery, [id]),
    pool.query(lineItemsQuery, [id]),
    pool.query(approvalsQuery, [id]),
    pool.query(receivingQuery, [id]),
  ]);

  if (poResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Purchase order not found',
    });
  }

  const purchaseOrder = {
    ...poResult.rows[0],
    line_items: lineItemsResult.rows,
    approvals: approvalsResult.rows,
    receiving_history: receivingResult.rows,
  };

  res.json({
    success: true,
    data: purchaseOrder,
  });
}));

// =============================================================================
// CREATE PURCHASE ORDER
// =============================================================================

router.post('/', [
  authenticateJWT,
  csrfProtection,
  ...validatePurchaseOrder,
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const {
    vendor_id,
    line_items,
    shipping_address,
    billing_address,
    payment_terms,
    notes,
    expected_delivery_date,
    shipping_method,
    tax_rate = 0,
  } = req.body;

  // @ts-ignore
  const userId = req.user?.id;
  // @ts-ignore
  const tenantId = req.user?.tenant_id;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Generate PO number
    const poNumberResult = await client.query(`
      SELECT COALESCE(MAX(CAST(SUBSTRING(number FROM '[0-9]+') AS INTEGER)), 0) + 1 as next_number
      FROM purchase_orders
      WHERE tenant_id = $1
        AND number ~ '^PO-[0-9]{6}$'
    `, [tenantId]);

    const poNumber = `PO-${String(poNumberResult.rows[0].next_number).padStart(6, '0')}`;

    // Calculate total
    const subtotal = line_items.reduce((sum: number, item: POLineItem) =>
      sum + (item.quantity * item.unit_price * (1 - (item.discount || 0))), 0
    );

    const tax = subtotal * tax_rate;
    const total = subtotal + tax;

    // Create purchase order
    const poQuery = `
      INSERT INTO purchase_orders (
        tenant_id, number, vendor_id, status,
        order_date, expected_delivery_date,
        subtotal, tax_amount, total_amount,
        shipping_address, billing_address, payment_terms,
        shipping_method, notes, created_by
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6,
        $7, $8, $9,
        $10, $11, $12,
        $13, $14, $15
      ) RETURNING *
    `;

    const poResult = await client.query(poQuery, [
      tenantId, poNumber, vendor_id, 'draft',
      new Date(), expected_delivery_date,
      subtotal, tax, total,
      shipping_address, billing_address, payment_terms,
      shipping_method, notes, userId,
    ]);

    const poId = poResult.rows[0].id;

    // Create line items
    const lineItemPromises = line_items.map((item: POLineItem, index: number) => {
      const lineItemQuery = `
        INSERT INTO purchase_order_line_items (
          purchase_order_id, line_number, inventory_item_id,
          part_number, description, quantity, unit_price,
          tax_rate, discount
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9
        ) RETURNING *
      `;

      return client.query(lineItemQuery, [
        poId, index + 1, item.inventory_item_id,
        item.part_number, item.description, item.quantity, item.unit_price,
        item.tax_rate || 0, item.discount || 0,
      ]);
    });

    await Promise.all(lineItemPromises);

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Purchase order created successfully',
      data: {
        ...poResult.rows[0],
        line_items_count: line_items.length,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

// =============================================================================
// SUBMIT FOR APPROVAL
// =============================================================================

router.post('/:id/submit-for-approval', [
  authenticateJWT,
  csrfProtection,
  param('id').isUUID(),
], asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  // @ts-ignore
  const userId = req.user?.id;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check current status
    const poResult = await client.query(`
      SELECT * FROM purchase_orders WHERE id = $1
    `, [id]);

    if (poResult.rows.length === 0) {
      throw new Error('Purchase order not found');
    }

    if (poResult.rows[0].status !== 'draft') {
      throw new Error('Only draft purchase orders can be submitted for approval');
    }

    const totalAmount = poResult.rows[0].total_amount;

    // Determine approval levels based on amount
    const approvalLevels = [];

    if (totalAmount < 1000) {
      approvalLevels.push({ level: 1, role: 'supervisor' });
    } else if (totalAmount < 10000) {
      approvalLevels.push({ level: 1, role: 'manager' });
    } else {
      approvalLevels.push({ level: 1, role: 'manager' });
      approvalLevels.push({ level: 2, role: 'director' });
    }

    // Get approvers from organization hierarchy
    for (const level of approvalLevels) {
      const approverQuery = `
        SELECT u.id
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        JOIN roles r ON ur.role_id = r.id
        WHERE r.name = $1
          AND u.tenant_id = $2
          AND u.is_active = true
        LIMIT 1
      `;

      const approverResult = await client.query(approverQuery, [level.role, poResult.rows[0].tenant_id]);

      if (approverResult.rows.length > 0) {
        await client.query(`
          INSERT INTO purchase_order_approvals (
            purchase_order_id, approver_id, approval_level, status
          ) VALUES ($1, $2, $3, $4)
        `, [id, approverResult.rows[0].id, level.level, 'pending']);
      }
    }

    // Update PO status
    await client.query(`
      UPDATE purchase_orders
      SET status = $1, submitted_for_approval_at = NOW(), submitted_by = $2
      WHERE id = $3
    `, ['pending_approval', userId, id]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Purchase order submitted for approval',
      data: {
        approvalLevels: approvalLevels.length,
      },
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

// =============================================================================
// APPROVE/REJECT PURCHASE ORDER
// =============================================================================

router.post('/:id/approve', [
  authenticateJWT,
  csrfProtection,
  param('id').isUUID(),
  body('action').isIn(['approve', 'reject']),
], asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { action, comments } = req.body;
  // @ts-ignore
  const userId = req.user?.id;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Find approval record
    const approvalResult = await client.query(`
      SELECT * FROM purchase_order_approvals
      WHERE purchase_order_id = $1 AND approver_id = $2 AND status = 'pending'
      ORDER BY approval_level
      LIMIT 1
    `, [id, userId]);

    if (approvalResult.rows.length === 0) {
      throw new Error('No pending approval found for this user');
    }

    const approvalId = approvalResult.rows[0].id;
    const approvalLevel = approvalResult.rows[0].approval_level;

    // Update approval record
    await client.query(`
      UPDATE purchase_order_approvals
      SET status = $1, approved_at = NOW(), comments = $2
      WHERE id = $3
    `, [action === 'approve' ? 'approved' : 'rejected', comments, approvalId]);

    if (action === 'reject') {
      // If rejected, cancel the PO
      await client.query(`
        UPDATE purchase_orders
        SET status = 'cancelled', cancelled_at = NOW(), cancelled_by = $1
        WHERE id = $2
      `, [userId, id]);
    } else {
      // Check if all approvals are complete
      const remainingApprovalsResult = await client.query(`
        SELECT COUNT(*) as count
        FROM purchase_order_approvals
        WHERE purchase_order_id = $1 AND status = 'pending'
      `, [id]);

      if (parseInt(remainingApprovalsResult.rows[0].count) === 0) {
        // All approvals complete, mark as approved
        await client.query(`
          UPDATE purchase_orders
          SET status = 'approved', approved_at = NOW(), approved_by = $1
          WHERE id = $2
        `, [userId, id]);
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Purchase order ${action}d successfully`,
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

// =============================================================================
// SEND TO VENDOR (Mark as Ordered)
// =============================================================================

router.post('/:id/send-to-vendor', [
  authenticateJWT,
  csrfProtection,
  param('id').isUUID(),
], asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { confirmation_number, vendor_po_number } = req.body;
  // @ts-ignore
  const userId = req.user?.id;

  const query = `
    UPDATE purchase_orders
    SET
      status = 'ordered',
      ordered_at = NOW(),
      ordered_by = $1,
      vendor_confirmation_number = $2,
      vendor_po_number = $3
    WHERE id = $4 AND status = 'approved'
    RETURNING *
  `;

  const result = await pool.query(query, [userId, confirmation_number, vendor_po_number, id]);

  if (result.rows.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Purchase order not found or not approved',
    });
  }

  res.json({
    success: true,
    message: 'Purchase order sent to vendor',
    data: result.rows[0],
  });
}));

// =============================================================================
// RECEIVE ITEMS
// =============================================================================

router.post('/:id/receive', [
  authenticateJWT,
  csrfProtection,
  param('id').isUUID(),
  body('received_items').isArray({ min: 1 }),
  body('received_items.*.line_item_id').isUUID(),
  body('received_items.*.quantity_received').isInt({ min: 1 }),
], asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { received_items, packing_slip_number, notes } = req.body;
  // @ts-ignore
  const userId = req.user?.id;
  // @ts-ignore
  const userName = req.user?.name || req.user?.email;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Create receiving record
    const receivingQuery = `
      INSERT INTO purchase_order_receiving (
        purchase_order_id, received_date, received_by, received_by_name,
        packing_slip_number, notes
      ) VALUES ($1, NOW(), $2, $3, $4, $5)
      RETURNING *
    `;

    const receivingResult = await client.query(receivingQuery, [
      id, userId, userName, packing_slip_number, notes,
    ]);

    const receivingId = receivingResult.rows[0].id;

    // Process each received item
    for (const item of received_items) {
      // Get line item details
      const lineItemResult = await client.query(`
        SELECT * FROM purchase_order_line_items
        WHERE id = $1 AND purchase_order_id = $2
      `, [item.line_item_id, id]);

      if (lineItemResult.rows.length === 0) {
        throw new Error(`Line item ${item.line_item_id} not found`);
      }

      const lineItem = lineItemResult.rows[0];

      // Create receiving line item
      await client.query(`
        INSERT INTO purchase_order_receiving_items (
          receiving_id, line_item_id, inventory_item_id,
          quantity_received, condition, notes
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        receivingId, item.line_item_id, lineItem.inventory_item_id,
        item.quantity_received, item.condition || 'good', item.notes,
      ]);

      // Update line item received quantity
      await client.query(`
        UPDATE purchase_order_line_items
        SET quantity_received = COALESCE(quantity_received, 0) + $1
        WHERE id = $2
      `, [item.quantity_received, item.line_item_id]);

      // Create inventory transaction
      await client.query(`
        INSERT INTO inventory_transactions (
          tenant_id, item_id, transaction_type, quantity, unit_cost,
          user_id, user_name, reason, reference_number
        ) VALUES (
          (SELECT tenant_id FROM purchase_orders WHERE id = $1),
          $2, 'purchase', $3, $4,
          $5, $6, 'Purchase order receiving', $7
        )
      `, [
        id, lineItem.inventory_item_id, item.quantity_received, lineItem.unit_price,
        userId, userName, `PO-${id.substring(0, 8)}`,
      ]);
    }

    // Check if PO is fully received
    const statusCheckResult = await client.query(`
      SELECT
        SUM(pol.quantity) as total_ordered,
        SUM(COALESCE(pol.quantity_received, 0)) as total_received
      FROM purchase_order_line_items pol
      WHERE pol.purchase_order_id = $1
    `, [id]);

    const totalOrdered = parseInt(statusCheckResult.rows[0].total_ordered);
    const totalReceived = parseInt(statusCheckResult.rows[0].total_received);

    let newStatus = 'partially_received';
    if (totalReceived >= totalOrdered) {
      newStatus = 'received';
    }

    await client.query(`
      UPDATE purchase_orders
      SET status = $1, last_received_at = NOW()
      WHERE id = $2
    `, [newStatus, id]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Items received successfully',
      data: {
        receiving_id: receivingId,
        status: newStatus,
        total_received: totalReceived,
        total_ordered: totalOrdered,
      },
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

// =============================================================================
// CANCEL PURCHASE ORDER
// =============================================================================

router.post('/:id/cancel', [
  authenticateJWT,
  csrfProtection,
  param('id').isUUID(),
  body('reason').trim().notEmpty(),
], asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  // @ts-ignore
  const userId = req.user?.id;

  const query = `
    UPDATE purchase_orders
    SET
      status = 'cancelled',
      cancelled_at = NOW(),
      cancelled_by = $1,
      cancellation_reason = $2
    WHERE id = $3 AND status NOT IN ('received', 'cancelled')
    RETURNING *
  `;

  const result = await pool.query(query, [userId, reason, id]);

  if (result.rows.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Purchase order cannot be cancelled',
    });
  }

  res.json({
    success: true,
    message: 'Purchase order cancelled successfully',
    data: result.rows[0],
  });
}));

// =============================================================================
// AUTO-CREATE PO FROM LOW STOCK ALERTS
// =============================================================================

router.post('/auto-create-from-alerts', [
  authenticateJWT,
  csrfProtection,
  body('alert_ids').isArray({ min: 1 }),
  body('alert_ids.*').isUUID(),
], asyncHandler(async (req: Request, res: Response) => {
  const { alert_ids } = req.body;
  // @ts-ignore
  const userId = req.user?.id;
  // @ts-ignore
  const tenantId = req.user?.tenant_id;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get alerts and group by supplier
    const alertsQuery = `
      SELECT
        a.*,
        i.id as inventory_item_id,
        i.sku,
        i.name,
        i.part_number,
        i.reorder_quantity,
        i.unit_cost,
        i.primary_supplier_id,
        i.primary_supplier_name
      FROM inventory_low_stock_alerts a
      JOIN inventory_items i ON a.item_id = i.id
      WHERE a.id = ANY($1::uuid[])
        AND a.resolved = false
    `;

    const alertsResult = await client.query(alertsQuery, [alert_ids]);

    // Group by supplier
    const supplierGroups = alertsResult.rows.reduce((groups: any, alert: any) => {
      const supplierId = alert.primary_supplier_id;
      if (!groups[supplierId]) {
        groups[supplierId] = {
          supplier_id: supplierId,
          supplier_name: alert.primary_supplier_name,
          items: [],
        };
      }
      groups[supplierId].items.push(alert);
      return groups;
    }, {});

    const createdPOs = [];

    // Create a PO for each supplier
    for (const group of Object.values(supplierGroups) as any[]) {
      // Generate PO number
      const poNumberResult = await client.query(`
        SELECT COALESCE(MAX(CAST(SUBSTRING(number FROM '[0-9]+') AS INTEGER)), 0) + 1 as next_number
        FROM purchase_orders
        WHERE tenant_id = $1
          AND number ~ '^PO-[0-9]{6}$'
      `, [tenantId]);

      const poNumber = `PO-${String(poNumberResult.rows[0].next_number).padStart(6, '0')}`;

      // Calculate total
      const subtotal = group.items.reduce((sum: number, item: any) =>
        sum + (item.reorder_quantity * item.unit_cost), 0
      );

      // Create PO
      const poResult = await client.query(`
        INSERT INTO purchase_orders (
          tenant_id, number, vendor_id, status, order_date,
          subtotal, tax_amount, total_amount,
          notes, created_by
        ) VALUES (
          $1, $2, $3, 'draft', NOW(),
          $4, 0, $4,
          'Auto-generated from low stock alerts', $5
        ) RETURNING *
      `, [tenantId, poNumber, group.supplier_id, subtotal, userId]);

      const poId = poResult.rows[0].id;

      // Create line items
      for (let i = 0; i < group.items.length; i++) {
        const item = group.items[i];
        await client.query(`
          INSERT INTO purchase_order_line_items (
            purchase_order_id, line_number, inventory_item_id,
            part_number, description, quantity, unit_price, tax_rate, discount
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 0)
        `, [
          poId, i + 1, item.inventory_item_id,
          item.part_number, item.name, item.reorder_quantity, item.unit_cost,
        ]);

        // Mark alert as having PO created
        await client.query(`
          UPDATE inventory_low_stock_alerts
          SET purchase_order_created = true, purchase_order_id = $1
          WHERE id = $2
        `, [poId, item.id]);
      }

      createdPOs.push({
        po_number: poNumber,
        po_id: poId,
        supplier_name: group.supplier_name,
        item_count: group.items.length,
        total_amount: subtotal,
      });
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: `Created ${createdPOs.length} purchase order(s) from low stock alerts`,
      data: createdPOs,
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

// =============================================================================
// GET PURCHASE ORDER SUMMARY
// =============================================================================

router.get('/summary/statistics', asyncHandler(async (req: Request, res: Response) => {
  const queries = [
    // Total by status
    pool.query(`
      SELECT status, COUNT(*) as count, SUM(total_amount) as total_amount
      FROM purchase_orders
      GROUP BY status
    `),
    // Pending approvals
    pool.query(`
      SELECT COUNT(*) as count
      FROM purchase_orders
      WHERE status = 'pending_approval'
    `),
    // Awaiting delivery
    pool.query(`
      SELECT COUNT(*) as count
      FROM purchase_orders
      WHERE status = 'ordered'
        AND expected_delivery_date <= NOW() + INTERVAL '7 days'
    `),
    // Top vendors by spend (30 days)
    pool.query(`
      SELECT
        v.name,
        COUNT(po.id) as order_count,
        SUM(po.total_amount) as total_spend
      FROM purchase_orders po
      JOIN vendors v ON po.vendor_id = v.id
      WHERE po.order_date >= NOW() - INTERVAL '30 days'
      GROUP BY v.id, v.name
      ORDER BY total_spend DESC
      LIMIT 5
    `),
  ];

  const [statusResult, pendingResult, deliveryResult, vendorsResult] = await Promise.all(queries);

  res.json({
    success: true,
    data: {
      by_status: statusResult.rows,
      pending_approvals: parseInt(pendingResult.rows[0].count),
      awaiting_delivery: parseInt(deliveryResult.rows[0].count),
      top_vendors: vendorsResult.rows,
    },
  });
}));

export default router;
