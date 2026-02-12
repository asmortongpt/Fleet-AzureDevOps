/**
 * Maintenance Drilldown API Routes
 * Provides endpoints for:
 * - Preventive Maintenance Schedules
 * - Repairs
 * - Inspections
 * - Service Records
 * - Service Vendors
 *
 * All queries use parameterized SQL ($1, $2, ...) against real PostgreSQL tables.
 */

import { Router, Request, Response } from 'express'
import pool from '../config/database'

const router = Router()

// ============================================
// ROUTES
// ============================================

/**
 * GET /pm-schedules/:scheduleId
 * Fetch a single preventive maintenance schedule with vehicle details.
 * Tables: maintenance_schedules, vehicles, vendors, users
 */
router.get('/pm-schedules/:scheduleId', async (req: Request, res: Response) => {
  try {
    const { scheduleId } = req.params

    const result = await pool.query(
      `SELECT
        ms.id,
        ms.vehicle_id AS "vehicleId",
        v.number AS "vehicleNumber",
        v.make AS "vehicleMake",
        v.model AS "vehicleModel",
        v.year AS "vehicleYear",
        ms.service_type AS "serviceType",
        ms.description AS "serviceDescription",
        ms.last_service_odometer AS "lastServiceMileage",
        ms.next_service_due_date AS "nextDueDate",
        ms.next_service_due_odometer AS "nextDueMileage",
        v.odometer AS "currentMileage",
        ms.days_until_due AS "daysUntilDue",
        ms.miles_until_due AS "milesUntilDue",
        CASE
          WHEN ms.is_overdue = true THEN 'overdue'
          WHEN ms.days_until_due IS NOT NULL AND ms.days_until_due <= 7 THEN 'due-soon'
          ELSE 'upcoming'
        END AS "status",
        CASE
          WHEN ms.interval_miles IS NOT NULL AND ms.interval_months IS NOT NULL
            THEN 'Every ' || ms.interval_miles || ' miles or ' || ms.interval_months || ' months'
          WHEN ms.interval_miles IS NOT NULL
            THEN 'Every ' || ms.interval_miles || ' miles'
          WHEN ms.interval_days IS NOT NULL
            THEN 'Every ' || ms.interval_days || ' days'
          ELSE NULL
        END AS "frequency",
        ms.default_cost_estimate_cents AS "estimatedCostCents",
        ms.default_assigned_shop AS "serviceProvider",
        ms.is_active AS "isActive",
        ms.is_overdue AS "isOverdue",
        ms.schedule_name AS "scheduleName",
        ms.created_at AS "createdAt",
        ms.updated_at AS "updatedAt",
        vnd.name AS "vendorName",
        vnd.contact_name AS "vendorContactName",
        vnd.contact_phone AS "vendorContactPhone",
        vnd.contact_email AS "vendorContactEmail",
        vnd.address AS "vendorAddress"
      FROM maintenance_schedules ms
      LEFT JOIN vehicles v ON ms.vehicle_id = v.id
      LEFT JOIN vendors vnd ON ms.preferred_vendor_id = vnd.id::integer
      WHERE ms.id::text = $1
      LIMIT 1`,
      [scheduleId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'PM schedule not found' })
    }

    const row = result.rows[0]

    // Build the response shape matching the original API contract
    const schedule = {
      id: String(row.id),
      vehicleId: row.vehicleId ? String(row.vehicleId) : null,
      vehicleNumber: row.vehicleNumber || null,
      vehicleMake: row.vehicleMake || null,
      vehicleModel: row.vehicleModel || null,
      vehicleYear: row.vehicleYear || null,
      serviceType: row.serviceType || null,
      serviceDescription: row.serviceDescription || null,
      lastServiceDate: null, // Not stored directly on schedule; see service history
      lastServiceMileage: row.lastServiceMileage ? Number(row.lastServiceMileage) : null,
      nextDueDate: row.nextDueDate || null,
      nextDueMileage: row.nextDueMileage ? Number(row.nextDueMileage) : null,
      currentMileage: row.currentMileage ? Number(row.currentMileage) : null,
      daysUntilDue: row.daysUntilDue != null ? Number(row.daysUntilDue) : null,
      milesUntilDue: row.milesUntilDue != null ? Number(row.milesUntilDue) : null,
      status: row.status,
      frequency: row.frequency || null,
      estimatedCost: row.estimatedCostCents != null ? Number(row.estimatedCostCents) / 100 : null,
      assignedTechnician: null, // Resolved from work orders if needed
      serviceProvider: row.serviceProvider || row.vendorName || null,
      serviceProviderContact: row.vendorContactName
        ? {
            name: row.vendorContactName,
            phone: row.vendorContactPhone || null,
            email: row.vendorContactEmail || null,
            address: row.vendorAddress || null,
          }
        : null,
      notes: row.serviceDescription || null,
      scheduleName: row.scheduleName || null,
      isActive: row.isActive,
      isOverdue: row.isOverdue,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }

    res.json(schedule)
  } catch (error) {
    console.error('Error fetching PM schedule:', error)
    res.status(500).json({ error: 'Failed to fetch PM schedule' })
  }
})

/**
 * GET /vehicles/:vehicleId/service-history
 * Fetch maintenance/service history for a specific vehicle.
 * Tables: maintenance, vehicles, users, vendors
 */
router.get('/vehicles/:vehicleId/service-history', async (req: Request, res: Response) => {
  try {
    const { vehicleId } = req.params
    const { serviceType } = req.query

    let query = `
      SELECT
        m.id,
        m.work_order_number AS "workOrderNumber",
        COALESCE(m.completed_at, m.scheduled_date::timestamp) AS "serviceDate",
        m.maintenance_type AS "serviceType",
        m.description,
        m.actual_mileage AS "mileage",
        m.labor_hours AS "laborHours",
        m.labor_cost_cents AS "laborCostCents",
        m.parts_cost_cents AS "partsCostCents",
        m.actual_cost_cents AS "totalCostCents",
        m.status,
        m.notes,
        m.under_warranty AS "underWarranty",
        m.warranty_claim_number AS "warrantyClaimNumber",
        m.vendor_name AS "vendorName",
        m.next_service_date AS "nextServiceDate",
        m.next_service_mileage AS "nextServiceMileage",
        m.created_at AS "createdAt",
        u.first_name AS "techFirstName",
        u.last_name AS "techLastName",
        u.phone AS "technicianPhone",
        u.email AS "technicianEmail"
      FROM maintenance m
      LEFT JOIN users u ON m.assigned_to = u.id
      WHERE m.vehicle_id::text = $1
    `

    const params: (string | undefined)[] = [vehicleId]

    if (serviceType && typeof serviceType === 'string') {
      query += ` AND m.maintenance_type = $2`
      params.push(serviceType)
    }

    query += ` ORDER BY COALESCE(m.completed_at, m.scheduled_date::timestamp) DESC LIMIT 50`

    const result = await pool.query(query, params)

    const records = result.rows.map((row) => ({
      id: String(row.id),
      workOrderNumber: row.workOrderNumber || null,
      serviceDate: row.serviceDate || null,
      serviceType: row.serviceType || null,
      description: row.description || null,
      mileage: row.mileage != null ? Number(row.mileage) : null,
      technician:
        row.techFirstName || row.techLastName
          ? `${row.techFirstName || ''} ${row.techLastName || ''}`.trim()
          : null,
      technicianPhone: row.technicianPhone || null,
      technicianEmail: row.technicianEmail || null,
      laborHours: row.laborHours != null ? Number(row.laborHours) : null,
      laborCost: row.laborCostCents != null ? Number(row.laborCostCents) / 100 : null,
      partsCost: row.partsCostCents != null ? Number(row.partsCostCents) / 100 : null,
      totalCost: row.totalCostCents != null ? Number(row.totalCostCents) / 100 : null,
      status: row.status || null,
      notes: row.notes || null,
      warranty: row.underWarranty
        ? {
            active: row.underWarranty,
            claimNumber: row.warrantyClaimNumber || null,
          }
        : undefined,
      createdAt: row.createdAt,
    }))

    res.json(records)
  } catch (error) {
    console.error('Error fetching service history:', error)
    res.status(500).json({ error: 'Failed to fetch service history' })
  }
})

/**
 * GET /repairs/:repairId
 * Fetch a single repair/work order with parts and labor details.
 * Tables: work_orders, vehicles, work_order_parts, work_order_labor, users
 */
router.get('/repairs/:repairId', async (req: Request, res: Response) => {
  try {
    const { repairId } = req.params

    // Fetch the work order
    const woResult = await pool.query(
      `SELECT
        wo.id,
        wo.number AS "workOrderNumber",
        wo.vehicle_id AS "vehicleId",
        v.number AS "vehicleNumber",
        v.make AS "vehicleMake",
        v.model AS "vehicleModel",
        v.year AS "vehicleYear",
        wo.type AS "repairType",
        wo.title,
        wo.description,
        wo.status,
        wo.priority,
        wo.scheduled_start_date AS "scheduledStartDate",
        wo.scheduled_end_date AS "scheduledEndDate",
        wo.actual_start_date AS "startDate",
        wo.actual_end_date AS "completionDate",
        wo.estimated_cost AS "estimatedCost",
        wo.actual_cost AS "actualCost",
        wo.labor_hours AS "laborHours",
        wo.odometer_at_start AS "odometerAtStart",
        wo.odometer_at_end AS "odometerAtEnd",
        wo.notes,
        wo.assigned_technician AS "assignedTechnician",
        wo.assigned_vendor_id AS "assignedVendorId",
        wo.invoice_number AS "invoiceNumber",
        wo.issues_found AS "issuesFound",
        wo.recommendations,
        wo.created_at AS "createdAt",
        wo.updated_at AS "updatedAt",
        req_user.first_name AS "requestedByFirstName",
        req_user.last_name AS "requestedByLastName",
        req_user.phone AS "requestedByPhone",
        req_user.email AS "requestedByEmail",
        tech_user.first_name AS "techFirstName",
        tech_user.last_name AS "techLastName",
        tech_user.phone AS "technicianPhone",
        tech_user.email AS "technicianEmail"
      FROM work_orders wo
      LEFT JOIN vehicles v ON wo.vehicle_id = v.id
      LEFT JOIN users req_user ON wo.requested_by_id = req_user.id
      LEFT JOIN users tech_user ON wo.assigned_to_id = tech_user.id
      WHERE wo.id::text = $1
      LIMIT 1`,
      [repairId]
    )

    if (woResult.rows.length === 0) {
      return res.status(404).json({ error: 'Repair not found' })
    }

    const wo = woResult.rows[0]

    // Fetch parts used
    const partsResult = await pool.query(
      `SELECT
        wop.part_number AS "partNumber",
        wop.name AS "partName",
        wop.quantity,
        wop.unit_cost AS "unitCost",
        wop.total_cost AS "totalCost",
        wop.supplier,
        wop.notes
      FROM work_order_parts wop
      WHERE wop.work_order_id::text = $1
      ORDER BY wop.created_at`,
      [repairId]
    )

    // Fetch labor entries
    const laborResult = await pool.query(
      `SELECT
        wol.technician_name AS "technicianName",
        wol.hours,
        wol.rate,
        wol.total,
        wol.task AS "description",
        wol.notes,
        wol.date
      FROM work_order_labor wol
      WHERE wol.work_order_id::text = $1
      ORDER BY wol.date`,
      [repairId]
    )

    const repair = {
      id: String(wo.id),
      workOrderNumber: wo.workOrderNumber || null,
      vehicleId: wo.vehicleId ? String(wo.vehicleId) : null,
      vehicleNumber: wo.vehicleNumber || null,
      vehicleMake: wo.vehicleMake || null,
      vehicleModel: wo.vehicleModel || null,
      vehicleYear: wo.vehicleYear || null,
      repairType: wo.repairType || wo.title || null,
      description: wo.description || null,
      reportedDate: wo.createdAt || null,
      reportedBy:
        wo.requestedByFirstName || wo.requestedByLastName
          ? `${wo.requestedByFirstName || ''} ${wo.requestedByLastName || ''}`.trim()
          : null,
      reportedByPhone: wo.requestedByPhone || null,
      reportedByEmail: wo.requestedByEmail || null,
      status: wo.status || null,
      priority: wo.priority || null,
      diagnosisDate: wo.scheduledStartDate || null,
      diagnosisNotes: wo.notes || null,
      estimatedCost: wo.estimatedCost != null ? Number(wo.estimatedCost) : null,
      actualCost: wo.actualCost != null ? Number(wo.actualCost) : null,
      assignedTechnician:
        wo.assignedTechnician ||
        (wo.techFirstName || wo.techLastName
          ? `${wo.techFirstName || ''} ${wo.techLastName || ''}`.trim()
          : null),
      technicianPhone: wo.technicianPhone || null,
      technicianEmail: wo.technicianEmail || null,
      startDate: wo.startDate || null,
      completionDate: wo.completionDate || null,
      laborHours: wo.laborHours != null ? Number(wo.laborHours) : null,
      odometerAtStart: wo.odometerAtStart || null,
      odometerAtEnd: wo.odometerAtEnd || null,
      invoiceNumber: wo.invoiceNumber || null,
      issuesFound: wo.issuesFound || [],
      recommendations: wo.recommendations || [],
      partsUsed: partsResult.rows.map((p) => ({
        partNumber: p.partNumber || null,
        partName: p.partName || null,
        quantity: p.quantity != null ? Number(p.quantity) : null,
        unitCost: p.unitCost != null ? Number(p.unitCost) : null,
        totalCost: p.totalCost != null ? Number(p.totalCost) : null,
        supplier: p.supplier || null,
      })),
      laborEntries: laborResult.rows.map((l) => ({
        technicianName: l.technicianName || null,
        hours: l.hours != null ? Number(l.hours) : null,
        rate: l.rate != null ? Number(l.rate) : null,
        total: l.total != null ? Number(l.total) : null,
        description: l.description || null,
        date: l.date || null,
      })),
      createdAt: wo.createdAt,
      updatedAt: wo.updatedAt,
    }

    res.json(repair)
  } catch (error) {
    console.error('Error fetching repair:', error)
    res.status(500).json({ error: 'Failed to fetch repair' })
  }
})

/**
 * GET /inspections/:inspectionId
 * Fetch a single inspection record with details.
 * Tables: inspections (base), vehicle_inspections (extended), vehicles, users
 */
router.get('/inspections/:inspectionId', async (req: Request, res: Response) => {
  try {
    const { inspectionId } = req.params

    // Query the inspections table (from 0000_green_stranger.sql base schema)
    const result = await pool.query(
      `SELECT
        i.id,
        i.vehicle_id AS "vehicleId",
        v.number AS "vehicleNumber",
        v.make AS "vehicleMake",
        v.model AS "vehicleModel",
        v.year AS "vehicleYear",
        v.odometer AS "currentMileage",
        i.type AS "inspectionType",
        i.started_at AS "inspectionDate",
        i.completed_at AS "completedAt",
        i.status,
        i.inspector_name AS "inspectorName",
        i.location,
        i.defects_found AS "defectsFound",
        i.passed_inspection AS "passedInspection",
        i.notes,
        i.checklist_data AS "checklistData",
        i.created_at AS "createdAt",
        i.updated_at AS "updatedAt",
        insp_user.first_name AS "inspectorFirstName",
        insp_user.last_name AS "inspectorLastName",
        insp_user.phone AS "inspectorPhone",
        insp_user.email AS "inspectorEmail"
      FROM inspections i
      LEFT JOIN vehicles v ON i.vehicle_id = v.id
      LEFT JOIN users insp_user ON i.inspector_id = insp_user.id
      WHERE i.id::text = $1
      LIMIT 1`,
      [inspectionId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inspection not found' })
    }

    const row = result.rows[0]

    // Parse checklist_data JSONB for inspection items
    const checklistData = row.checklistData || {}
    const inspectionItems: Array<{
      category: string
      item: string
      result: string
      notes?: string
      severity?: string
    }> = []
    let itemsPassed = 0
    let itemsFailed = 0
    let itemsAdvisory = 0
    const failedItems: Array<{
      item: string
      severity: string
      notes: string
      correctiveAction: string | null
      actionStatus: string
      estimatedCost: number | null
    }> = []

    // If checklistData has items array, parse it
    if (Array.isArray(checklistData)) {
      for (const item of checklistData) {
        const inspItem = {
          category: item.category || 'General',
          item: item.item || item.name || 'Unknown',
          result: item.result || item.status || 'pass',
          notes: item.notes || undefined,
          severity: item.severity || undefined,
        }
        inspectionItems.push(inspItem)
        if (inspItem.result === 'pass') itemsPassed++
        else if (inspItem.result === 'fail') {
          itemsFailed++
          failedItems.push({
            item: inspItem.item,
            severity: inspItem.severity || 'high',
            notes: inspItem.notes || 'Failed inspection item',
            correctiveAction: item.correctiveAction || null,
            actionStatus: item.actionStatus || 'pending',
            estimatedCost: item.estimatedCost != null ? Number(item.estimatedCost) : null,
          })
        } else if (inspItem.result === 'advisory') itemsAdvisory++
      }
    } else if (typeof checklistData === 'object' && checklistData.items) {
      // Handle {items: [...]} format
      for (const item of checklistData.items) {
        const inspItem = {
          category: item.category || 'General',
          item: item.item || item.name || 'Unknown',
          result: item.result || item.status || 'pass',
          notes: item.notes || undefined,
          severity: item.severity || undefined,
        }
        inspectionItems.push(inspItem)
        if (inspItem.result === 'pass') itemsPassed++
        else if (inspItem.result === 'fail') {
          itemsFailed++
          failedItems.push({
            item: inspItem.item,
            severity: inspItem.severity || 'high',
            notes: inspItem.notes || 'Failed inspection item',
            correctiveAction: item.correctiveAction || null,
            actionStatus: item.actionStatus || 'pending',
            estimatedCost: item.estimatedCost != null ? Number(item.estimatedCost) : null,
          })
        } else if (inspItem.result === 'advisory') itemsAdvisory++
      }
    }

    const totalItems = inspectionItems.length
    const defectsFound = row.defectsFound || itemsFailed

    let overallResult: string
    if (row.passedInspection === false || itemsFailed > 0) {
      overallResult = 'fail'
    } else if (itemsAdvisory > 0) {
      overallResult = 'pass-with-advisories'
    } else {
      overallResult = 'pass'
    }

    const score =
      totalItems > 0
        ? Math.floor(((itemsPassed + itemsAdvisory * 0.5) / totalItems) * 100)
        : row.passedInspection
          ? 100
          : 0

    const inspection = {
      id: String(row.id),
      inspectionNumber: null, // Not in base schema
      vehicleId: row.vehicleId ? String(row.vehicleId) : null,
      vehicleNumber: row.vehicleNumber || null,
      vehicleMake: row.vehicleMake || null,
      vehicleModel: row.vehicleModel || null,
      vehicleYear: row.vehicleYear || null,
      inspectionType: row.inspectionType || null,
      inspectionDate: row.inspectionDate || null,
      completedAt: row.completedAt || null,
      mileage: row.currentMileage != null ? Number(row.currentMileage) : null,
      inspector: {
        name:
          row.inspectorName ||
          (row.inspectorFirstName || row.inspectorLastName
            ? `${row.inspectorFirstName || ''} ${row.inspectorLastName || ''}`.trim()
            : null),
        certificationNumber: null,
        phone: row.inspectorPhone || null,
        email: row.inspectorEmail || null,
      },
      location: row.location
        ? {
            facilityName: row.location,
            address: null,
            phone: null,
          }
        : null,
      overallResult,
      score,
      itemsInspected: totalItems || defectsFound,
      itemsPassed,
      itemsFailed,
      itemsAdvisory,
      inspectionItems,
      failedItems,
      defectsFound,
      passedInspection: row.passedInspection,
      notes: row.notes || null,
      nextInspectionDue: null,
      expirationDate: null,
      certificationNumber: null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }

    res.json(inspection)
  } catch (error) {
    console.error('Error fetching inspection:', error)
    res.status(500).json({ error: 'Failed to fetch inspection' })
  }
})

/**
 * GET /service-records/:serviceRecordId
 * Fetch a single service/maintenance record by ID.
 * Tables: maintenance, vehicles, users, vendors
 */
router.get('/service-records/:serviceRecordId', async (req: Request, res: Response) => {
  try {
    const { serviceRecordId } = req.params

    const result = await pool.query(
      `SELECT
        m.id,
        m.work_order_number AS "workOrderNumber",
        COALESCE(m.completed_at, m.scheduled_date::timestamp) AS "serviceDate",
        m.maintenance_type AS "serviceType",
        m.service_category AS "serviceCategory",
        m.description,
        m.actual_mileage AS "mileage",
        m.odometer_reading AS "odometerReading",
        m.labor_hours AS "laborHours",
        m.labor_cost_cents AS "laborCostCents",
        m.parts_cost_cents AS "partsCostCents",
        m.actual_cost_cents AS "totalCostCents",
        m.estimated_cost_cents AS "estimatedCostCents",
        m.status,
        m.notes,
        m.under_warranty AS "underWarranty",
        m.warranty_claim_number AS "warrantyClaimNumber",
        m.vendor_name AS "vendorName",
        m.invoice_number AS "invoiceNumber",
        m.invoice_date AS "invoiceDate",
        m.next_service_date AS "nextServiceDate",
        m.next_service_mileage AS "nextServiceMileage",
        m.safety_critical AS "safetyCritical",
        m.parts_used AS "partsUsed",
        m.created_at AS "createdAt",
        m.updated_at AS "updatedAt",
        u.first_name AS "techFirstName",
        u.last_name AS "techLastName",
        u.phone AS "technicianPhone",
        u.email AS "technicianEmail",
        v.number AS "vehicleNumber",
        v.make AS "vehicleMake",
        v.model AS "vehicleModel",
        v.year AS "vehicleYear",
        m.vehicle_id AS "vehicleId"
      FROM maintenance m
      LEFT JOIN users u ON m.assigned_to = u.id
      LEFT JOIN vehicles v ON m.vehicle_id = v.id
      WHERE m.id::text = $1
      LIMIT 1`,
      [serviceRecordId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service record not found' })
    }

    const row = result.rows[0]

    const record = {
      id: String(row.id),
      workOrderNumber: row.workOrderNumber || null,
      serviceDate: row.serviceDate || null,
      serviceType: row.serviceType || null,
      serviceCategory: row.serviceCategory || null,
      description: row.description || null,
      mileage: row.mileage != null ? Number(row.mileage) : row.odometerReading != null ? Number(row.odometerReading) : null,
      vehicleId: row.vehicleId ? String(row.vehicleId) : null,
      vehicleNumber: row.vehicleNumber || null,
      vehicleMake: row.vehicleMake || null,
      vehicleModel: row.vehicleModel || null,
      vehicleYear: row.vehicleYear || null,
      technician:
        row.techFirstName || row.techLastName
          ? `${row.techFirstName || ''} ${row.techLastName || ''}`.trim()
          : null,
      technicianPhone: row.technicianPhone || null,
      technicianEmail: row.technicianEmail || null,
      laborHours: row.laborHours != null ? Number(row.laborHours) : null,
      laborCost: row.laborCostCents != null ? Number(row.laborCostCents) / 100 : null,
      partsCost: row.partsCostCents != null ? Number(row.partsCostCents) / 100 : null,
      totalCost: row.totalCostCents != null ? Number(row.totalCostCents) / 100 : null,
      estimatedCost: row.estimatedCostCents != null ? Number(row.estimatedCostCents) / 100 : null,
      status: row.status || null,
      notes: row.notes || null,
      warranty: row.underWarranty
        ? {
            active: row.underWarranty,
            claimNumber: row.warrantyClaimNumber || null,
          }
        : undefined,
      vendorName: row.vendorName || null,
      invoiceNumber: row.invoiceNumber || null,
      invoiceDate: row.invoiceDate || null,
      partsUsed: row.partsUsed || [],
      safetyCritical: row.safetyCritical || false,
      nextServiceDate: row.nextServiceDate || null,
      nextServiceMileage: row.nextServiceMileage || null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }

    res.json(record)
  } catch (error) {
    console.error('Error fetching service record:', error)
    res.status(500).json({ error: 'Failed to fetch service record' })
  }
})

/**
 * GET /vendors/:vendorId
 * Fetch a single vendor with performance data and active contracts.
 * Tables: vendors, vendor_contacts, vendor_performance, vendor_contracts, work_orders
 */
router.get('/vendors/:vendorId', async (req: Request, res: Response) => {
  try {
    const { vendorId } = req.params

    // Fetch vendor base data
    const vendorResult = await pool.query(
      `SELECT
        vnd.id,
        vnd.name AS "vendorName",
        vnd.type AS "vendorType",
        vnd.contact_name AS "contactPerson",
        vnd.contact_phone AS "phone",
        vnd.contact_email AS "email",
        vnd.address,
        vnd.city,
        vnd.state,
        vnd.zip_code AS "zipCode",
        vnd.website,
        vnd.payment_terms AS "paymentTerms",
        vnd.preferred_vendor AS "preferredVendor",
        vnd.rating,
        vnd.is_active AS "isActive",
        vnd.notes,
        vnd.created_at AS "createdAt",
        vnd.updated_at AS "updatedAt"
      FROM vendors vnd
      WHERE vnd.id::text = $1
      LIMIT 1`,
      [vendorId]
    )

    if (vendorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' })
    }

    const v = vendorResult.rows[0]

    // Fetch primary contact
    const contactResult = await pool.query(
      `SELECT
        contact_name AS "contactName",
        job_title AS "jobTitle",
        email,
        phone,
        mobile,
        contact_type AS "contactType",
        is_primary AS "isPrimary"
      FROM vendor_contacts
      WHERE vendor_id::text = $1 AND is_active = true
      ORDER BY is_primary DESC, contact_type
      LIMIT 5`,
      [vendorId]
    )

    // Fetch latest performance data
    const perfResult = await pool.query(
      `SELECT
        overall_score AS "overallScore",
        quality_score AS "qualityScore",
        responsiveness_score AS "responsivenessScore",
        customer_satisfaction AS "customerSatisfaction",
        total_orders AS "totalOrders",
        on_time_percentage AS "onTimePercentage",
        total_spend AS "totalSpend",
        preferred_vendor AS "preferredVendor",
        ranking
      FROM vendor_performance
      WHERE vendor_id::text = $1
      ORDER BY evaluation_period_end DESC
      LIMIT 1`,
      [vendorId]
    )

    // Fetch active contracts count
    const contractResult = await pool.query(
      `SELECT COUNT(*) AS "activeContracts"
      FROM vendor_contracts
      WHERE vendor_id::text = $1 AND status = 'active'`,
      [vendorId]
    )

    // Fetch total services YTD from work_orders
    const servicesResult = await pool.query(
      `SELECT
        COUNT(*) AS "totalServicesYTD",
        COALESCE(SUM(actual_cost), 0) AS "totalCostYTD"
      FROM work_orders
      WHERE assigned_vendor_id::text = $1
        AND actual_start_date >= date_trunc('year', CURRENT_DATE)`,
      [vendorId]
    )

    const perf = perfResult.rows.length > 0 ? perfResult.rows[0] : null
    const contracts = contractResult.rows[0]
    const services = servicesResult.rows[0]

    const fullAddress = [v.address, v.city, v.state, v.zipCode].filter(Boolean).join(', ')

    const vendor = {
      id: String(v.id),
      vendorName: v.vendorName,
      vendorType: v.vendorType || null,
      contactPerson: v.contactPerson || null,
      phone: v.phone || null,
      email: v.email || null,
      address: fullAddress || null,
      website: v.website || null,
      contacts: contactResult.rows.map((c) => ({
        name: c.contactName,
        jobTitle: c.jobTitle || null,
        email: c.email || null,
        phone: c.phone || null,
        mobile: c.mobile || null,
        type: c.contactType,
        isPrimary: c.isPrimary,
      })),
      certifications: [], // Not stored in vendors table; could come from metadata
      activeContracts: contracts ? Number(contracts.activeContracts) : 0,
      totalServicesYTD: services ? Number(services.totalServicesYTD) : 0,
      totalCostYTD: services ? Number(services.totalCostYTD) : 0,
      averageRating: perf ? Number(perf.overallScore) : v.rating != null ? Number(v.rating) : null,
      qualityScore: perf ? Number(perf.qualityScore) : null,
      responsivenessScore: perf ? Number(perf.responsivenessScore) : null,
      customerSatisfaction: perf ? Number(perf.customerSatisfaction) : null,
      onTimePercentage: perf ? Number(perf.onTimePercentage) : null,
      ranking: perf ? perf.ranking : null,
      paymentTerms: v.paymentTerms || null,
      preferredVendor: v.preferredVendor || false,
      isActive: v.isActive,
      notes: v.notes || null,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
    }

    res.json(vendor)
  } catch (error) {
    console.error('Error fetching vendor:', error)
    res.status(500).json({ error: 'Failed to fetch vendor' })
  }
})

/**
 * GET /garage-bays/:bayNumber/work-order
 * Fetch the current work order assigned to a garage/service bay.
 * Tables: service_bays, work_orders (via maintenanceRecords FK), vehicles,
 *         work_order_parts, work_order_labor, technicians/users
 */
router.get('/garage-bays/:bayNumber/work-order', async (req: Request, res: Response) => {
  try {
    const { bayNumber } = req.params

    // Look up the service bay and its current work order
    const bayResult = await pool.query(
      `SELECT
        sb.id AS "bayId",
        sb.bay_number AS "bayNumber",
        sb.bay_name AS "bayName",
        sb.bay_type AS "bayType",
        sb.is_available AS "isAvailable",
        sb.is_operational AS "isOperational",
        sb.current_work_order_id AS "currentWorkOrderId",
        sb.current_vehicle_id AS "currentVehicleId",
        sb.occupied_since AS "occupiedSince",
        sb.notes AS "bayNotes"
      FROM service_bays sb
      WHERE sb.bay_number = $1
      LIMIT 1`,
      [bayNumber]
    )

    if (bayResult.rows.length === 0) {
      return res.status(404).json({ error: 'Service bay not found' })
    }

    const bay = bayResult.rows[0]

    if (!bay.currentWorkOrderId) {
      return res.json({
        bayNumber: bay.bayNumber,
        bayName: bay.bayName,
        bayType: bay.bayType,
        isAvailable: bay.isAvailable,
        isOperational: bay.isOperational,
        workOrder: null,
        message: 'No active work order in this bay',
      })
    }

    // Fetch the work order details
    const woResult = await pool.query(
      `SELECT
        wo.id,
        wo.number AS "workOrderNumber",
        wo.title,
        wo.description,
        wo.type AS "workOrderType",
        wo.priority,
        wo.status,
        wo.scheduled_start_date AS "scheduledStartDate",
        wo.scheduled_end_date AS "estimatedCompletion",
        wo.actual_start_date AS "startDate",
        wo.actual_end_date AS "completionDate",
        wo.estimated_cost AS "estimatedCost",
        wo.actual_cost AS "actualCost",
        wo.labor_hours AS "laborHours",
        wo.odometer_at_start AS "odometerAtStart",
        wo.assigned_technician AS "assignedTechnician",
        wo.notes,
        wo.vehicle_id AS "vehicleId",
        v.number AS "vehicleNumber",
        v.make AS "vehicleMake",
        v.model AS "vehicleModel",
        v.year AS "vehicleYear",
        v.odometer AS "mileage",
        v.license_plate AS "licensePlate",
        v.name AS "vehicleName"
      FROM work_orders wo
      LEFT JOIN vehicles v ON wo.vehicle_id = v.id
      WHERE wo.id = $1
      LIMIT 1`,
      [bay.currentWorkOrderId]
    )

    if (woResult.rows.length === 0) {
      return res.json({
        bayNumber: bay.bayNumber,
        bayName: bay.bayName,
        workOrder: null,
        message: 'Referenced work order not found',
      })
    }

    const wo = woResult.rows[0]

    // Calculate progress percentage based on labor hours
    const hoursEstimated = wo.laborHours ? Number(wo.laborHours) : null

    // Get actual logged hours from work_order_labor
    const laborLogResult = await pool.query(
      `SELECT COALESCE(SUM(hours), 0) AS "hoursLogged"
      FROM work_order_labor
      WHERE work_order_id = $1`,
      [bay.currentWorkOrderId]
    )
    const hoursLogged = Number(laborLogResult.rows[0]?.hoursLogged || 0)

    const progressPercentage =
      hoursEstimated && hoursEstimated > 0
        ? Math.min(Math.round((hoursLogged / hoursEstimated) * 100), 100)
        : wo.status === 'completed'
          ? 100
          : 0

    // Fetch parts for this work order
    const partsResult = await pool.query(
      `SELECT
        wop.part_number AS "partNumber",
        wop.name AS "description",
        wop.quantity,
        CASE WHEN wop.quantity > 0 THEN 'in-stock' ELSE 'ordered' END AS "status"
      FROM work_order_parts wop
      WHERE wop.work_order_id = $1
      ORDER BY wop.created_at`,
      [bay.currentWorkOrderId]
    )

    // Fetch technicians assigned (from work_order_labor)
    const techResult = await pool.query(
      `SELECT DISTINCT
        wol.technician_id AS "id",
        wol.technician_name AS "name"
      FROM work_order_labor wol
      WHERE wol.work_order_id = $1`,
      [bay.currentWorkOrderId]
    )

    const workOrder = {
      id: String(wo.id),
      bayNumber: bay.bayNumber,
      bayName: bay.bayName,
      workOrderId: wo.workOrderNumber || String(wo.id),
      workOrderType: wo.workOrderType || wo.title || null,
      description: wo.description || null,
      priority: wo.priority || null,
      status: wo.status || null,
      startDate: wo.startDate || bay.occupiedSince || null,
      estimatedCompletion: wo.estimatedCompletion || null,
      hoursLogged,
      hoursEstimated,
      progressPercentage,
      vehicleId: wo.vehicleId ? String(wo.vehicleId) : null,
      vehicleNumber: wo.vehicleNumber || null,
      vehicleMake: wo.vehicleMake || null,
      vehicleModel: wo.vehicleModel || null,
      vehicleYear: wo.vehicleYear || null,
      mileage: wo.mileage != null ? Number(wo.mileage) : wo.odometerAtStart || null,
      licensePlate: wo.licensePlate || null,
      vehicleName: wo.vehicleName || null,
      assignedTechnicians: techResult.rows.map((t) => ({
        id: t.id ? String(t.id) : null,
        name: t.name || null,
      })),
      parts: partsResult.rows.map((p) => ({
        partNumber: p.partNumber || null,
        description: p.description || null,
        quantity: p.quantity != null ? Number(p.quantity) : null,
        status: p.status || 'unknown',
      })),
      notes: wo.notes || null,
      estimatedCost: wo.estimatedCost != null ? Number(wo.estimatedCost) : null,
      actualCost: wo.actualCost != null ? Number(wo.actualCost) : null,
    }

    res.json(workOrder)
  } catch (error) {
    console.error('Error fetching garage bay work order:', error)
    res.status(500).json({ error: 'Failed to fetch garage bay work order' })
  }
})

export default router
